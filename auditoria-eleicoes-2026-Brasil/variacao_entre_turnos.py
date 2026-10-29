#!/usr/bin/env python3
"""Variação dos votos para Presidente entre o 1º e o 2º turno — Eleições Gerais de 2026.

Adendo A ao Relatório Técnico do 2º turno. Compara, seção por seção, os votos dos dois turnos para Presidente
(Lula, nº 13, e Flávio Bolsonaro, nº 22), os votos dos demais candidatos do 1º turno, brancos, nulos e comparecimento,
e aplica seis testes de anomalia estatística (V1 a V6) nos níveis estado, município e seção.

Entrada: os votos por seção dos dois turnos publicados com o site (site/data/secoes/<UF>/<zona>.json), extraídos dos
Boletins de Urna oficiais do TSE pelo motor auditoria_eleicoes_2026.py v2.1.0, e as listas de urnas
(resultados-*/dados/busca_urnas.json) para o número da urna e o código de carga das seções já listadas pelo motor.

Saída (determinística: mesma entrada, mesmos arquivos):
  <saida>/dados/variacao_turnos_sinalizacoes.csv   só os itens 🔴 e 🟡, todos os níveis
  <saida>/dados/variacao_turnos_municipios.csv     todos os municípios, com ganhos, perdas e resultado do teste V2
  <saida>/dados/variacao_turnos_ufs.csv            todas as UFs, com ganhos, perdas e resultado do teste V1
  <dados>/variacao.json                            dados para o site
  Adendo A inserido nos relatórios PT, EN e ES de <saida> e manifesto_saida.sha512 atualizado.

Uso:
  python auditoria-eleicoes-2026-Brasil/variacao_entre_turnos.py --dados site/data --saida auditoria-eleicoes-2026-Brasil/resultados-2turno

Anomalia estatística não é prova de fraude.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

VERSAO = "1.0.0"
DATA_EDICAO = "29/10/2026"

# Parâmetros herdados do motor v2.1.0
ALFA_FDR = 0.01                  # taxa de falsas descobertas (Benjamini–Hochberg)
MIN_SECOES_GRUPO = 20            # mínimo de seções no grupo de referência
MIN_VOTOS_PROPORCAO = 30         # mínimo de votos nos finalistas, em cada turno
# Parâmetros próprios deste adendo
LIMIAR_ANOMALIA_PP = 10.0        # efeito mínimo para 🔴 (pontos percentuais)
LIMIAR_INFO_PP = 5.0             # efeito mínimo para 🟡 (pontos percentuais)
MIN_UNIDADES_REF = 3             # mínimo de unidades no grupo de referência (além da própria)
PHI_MIN = 0.05                   # limite inferior do fator de dispersão
MIN_APTOS = 20                   # mínimo de eleitores aptos, em cada turno (teste V4)
LIMIAR_DIRECIONAMENTO = 0.30     # excesso da parcela da variação do comparecimento sobre a participação do finalista (V4)
MIN_VOTOS_VARIACAO = 20          # variação mínima em votos (testes V4, V5 e V6)
LIMIAR_TETO = 0.10               # excesso sobre o teto, em fração dos votos do outro finalista no 1º turno (V5)
LIMIAR_CADASTRO = 0.10           # variação relativa de eleitores aptos (V6)

NR_L, NR_F = "13", "22"
NOMES = {NR_L: "Lula", NR_F: "Flávio Bolsonaro"}
TESTES = ["V1", "V2", "V3", "V4", "V5", "V6"]
NIVEL_TESTE = {"V1": "uf", "V2": "municipio", "V3": "secao", "V4": "secao", "V5": "secao", "V6": "secao"}

MARCA_INI, MARCA_FIM = "<!-- adendo-variacao:inicio -->", "<!-- adendo-variacao:fim -->"
NOTA_INI, NOTA_FIM = "<!-- nota-edicao:inicio -->", "<!-- nota-edicao:fim -->"


# ----------------------------------------------------------------------------------------------- estatística
def benjamini_hochberg(p) -> np.ndarray:
    p = np.asarray(p, dtype=float)
    m = p.size
    if m == 0:
        return p
    ordem = np.argsort(p, kind="mergesort")
    ajust = p[ordem] * m / np.arange(1, m + 1)
    ajust = np.minimum.accumulate(ajust[::-1])[::-1]
    q = np.empty(m)
    q[ordem] = np.clip(ajust, 0.0, 1.0)
    return q


def logit(p):
    return np.log(p / (1.0 - p))


def expit(x):
    return 1.0 / (1.0 + np.exp(-x))


def rotular_grupos(d: pd.DataFrame) -> pd.Series:
    """Mesma hierarquia do motor: zona dentro do município → município → zona → UF → Brasil."""
    rot = pd.Series("", index=d.index, dtype=object)
    k = d.groupby(["uf", "mun", "zona"])["mun"].transform("size")
    m0 = k >= MIN_SECOES_GRUPO
    rot[m0] = "MZ|" + d.loc[m0, "uf"] + "|" + d.loc[m0, "mun"] + "|" + d.loc[m0, "zona"].astype(str)
    resto = ~m0
    k = d[resto].groupby(["uf", "mun"])["mun"].transform("size")
    m1 = pd.Series(False, index=d.index)
    m1.loc[k.index] = k >= MIN_SECOES_GRUPO
    rot[m1] = "M|" + d.loc[m1, "uf"] + "|" + d.loc[m1, "mun"]
    resto &= ~m1
    k = d[resto].groupby(["uf", "zona"])["zona"].transform("size")
    m2 = pd.Series(False, index=d.index)
    m2.loc[k.index] = k >= MIN_SECOES_GRUPO
    rot[m2] = "Z|" + d.loc[m2, "uf"] + "|" + d.loc[m2, "zona"].astype(str)
    resto &= ~m2
    k = d[resto].groupby("uf")["uf"].transform("size")
    m3 = pd.Series(False, index=d.index)
    m3.loc[k.index] = k >= MIN_SECOES_GRUPO
    rot[m3] = "U|" + d.loc[m3, "uf"]
    rot[resto & ~m3] = "BR"
    return rot


def desvio_logit(x1, n1, x2, n2, grupo) -> pd.DataFrame:
    """Proporção esperada no 2º turno pelo deslocamento logístico uniforme do grupo de referência,
    calculado sem a própria unidade (leave-one-out): logit(p̂) = logit(x1/n1) + [logit(ΣX2/ΣN2) − logit(ΣX1/ΣN1)].
    Estatística z de quase-verossimilhança, com fator de dispersão φ = mediana(z²)/0,4549 estimado no grupo."""
    d = pd.DataFrame({"x1": x1, "n1": n1, "x2": x2, "n2": n2, "g": grupo})
    G = d.groupby("g")[["x1", "n1", "x2", "n2"]].transform("sum")
    k = d.groupby("g")["g"].transform("size") - 1
    delta = logit((G.x2 - d.x2 + 0.5) / (G.n2 - d.n2 + 1.0)) - logit((G.x1 - d.x1 + 0.5) / (G.n1 - d.n1 + 1.0))
    pe = expit(logit((d.x1 + 0.5) / (d.n1 + 1.0)) + delta)
    po = d.x2 / d.n2
    z0 = (po - pe) / np.sqrt(pe * (1.0 - pe) / d.n2)
    phi = ((z0 ** 2).groupby(d.g).transform("median") / 0.4549364).clip(lower=PHI_MIN)
    z = z0 / np.sqrt(phi)
    out = pd.DataFrame({"esperado": pe, "observado": po, "dif_pp": 100.0 * (po - pe), "phi": phi, "z": z}, index=d.index)
    out["ref_ok"] = k >= MIN_UNIDADES_REF
    out["p"] = np.where(out.ref_ok, 2.0 * stats.norm.sf(out.z.abs()), np.nan)
    out["q"] = np.nan
    ok = out.ref_ok.values
    out.loc[ok, "q"] = benjamini_hochberg(out.loc[ok, "p"].values)
    return out


def nivel_sinal(q, dif):
    q, dif = np.asarray(q, dtype=float), np.abs(np.asarray(dif, dtype=float))
    sig = np.nan_to_num(q, nan=1.0) < ALFA_FDR
    return np.where(sig & (dif >= LIMIAR_ANOMALIA_PP), "anomalia", np.where(sig & (dif >= LIMIAR_INFO_PP), "informativo", ""))


# ----------------------------------------------------------------------------------------------- entrada
def carregar(dados: Path) -> tuple[pd.DataFrame, dict]:
    R = json.loads((dados / "resumo.json").read_text(encoding="utf-8"))
    ordem = R["ordem_votos"]
    linhas = []
    for pasta in sorted((dados / "secoes").iterdir()):
        uf = pasta.name
        for arq in sorted(pasta.glob("*.json"), key=lambda p: int(p.stem)):
            z = int(arq.stem)
            d = json.loads(arq.read_text(encoding="utf-8"))
            for s, rec in d["s"].items():
                cod, nome = d["mun"][rec[0]]
                ln = {"uf": uf, "mun": str(cod), "nm_mun": nome, "zona": z, "secao": int(s)}
                for n in (1, 2):
                    tv = rec[n] if len(rec) > n else None
                    if not tv:
                        continue
                    o = ordem[str(n)]
                    v = dict(zip(o, list(tv[5]) + [0] * (len(o) - len(tv[5]))))
                    ln.update({f"aptos{n}": tv[0], f"comp{n}": tv[1], f"agreg{n}": tv[4] or "",
                               f"L{n}": v[NR_L], f"F{n}": v[NR_F], f"B{n}": v["95"], f"N{n}": v["96"],
                               f"O{n}": sum(x for c, x in v.items() if c not in (NR_L, NR_F, "95", "96"))})
                linhas.append(ln)
    df = pd.DataFrame(linhas)
    num = [c for c in df.columns if c[:-1] in ("aptos", "comp", "L", "F", "B", "N", "O")]
    df["ambos"] = df["comp1"].notna() & df["comp2"].notna()
    df[num] = df[num].fillna(0).astype("int64")
    df = df.sort_values(["uf", "mun", "zona", "secao"], kind="mergesort").reset_index(drop=True)
    return df, R


def carregar_urnas(saida: Path) -> dict:
    """Número da urna e código de carga das seções listadas pelo motor (2º turno primeiro)."""
    urnas = {}
    for pasta in (saida, saida.parent / "resultados-1turno"):
        f = pasta / "dados" / "busca_urnas.json"
        if not f.exists():
            continue
        for e in json.loads(f.read_text(encoding="utf-8")):
            k = (e["uf"], int(e["zona"]), int(e["secao"]))
            if k not in urnas and e.get("nr_urna"):
                urnas[k] = (str(e["nr_urna"]), str(e.get("cod_carga") or ""), int(e["turno"]))
    return urnas


# ----------------------------------------------------------------------------------------------- testes
COLS_VOTOS = ["L1", "F1", "O1", "B1", "N1", "comp1", "aptos1", "L2", "F2", "B2", "N2", "comp2", "aptos2"]


def agregar(df: pd.DataFrame, chave: list[str]) -> pd.DataFrame:
    """Totais oficiais por unidade (todas as seções; uma seção com boletim em um só turno entra só nesse turno)."""
    a = df.groupby(chave, as_index=False, sort=True)[COLS_VOTOS].sum()
    a["secoes"] = df.groupby(chave, sort=True).size().values
    return a


def teste_transferencia(u: pd.DataFrame, grupo) -> pd.DataFrame:
    """V1, V2 e V3: participação de Lula nos votos dos dois finalistas no 2º turno, comparada à esperada
    pela participação no 1º turno e pelo deslocamento observado no grupo de referência."""
    u = u.copy()
    u["H1"], u["H2"] = u.L1 + u.F1, u.L2 + u.F2
    ok = (u.H1 >= MIN_VOTOS_PROPORCAO) & (u.H2 >= MIN_VOTOS_PROPORCAO)
    r = desvio_logit(u.L1[ok], u.H1[ok], u.L2[ok], u.H2[ok], pd.Series(grupo, index=u.index)[ok])
    u = u.join(r)
    u["analisada"] = ok & u.ref_ok.fillna(False).astype(bool)
    u["nivel"] = np.where(u.analisada, nivel_sinal(u.q, u.dif_pp), "")
    return u


def executar(df: pd.DataFrame, urnas: dict) -> dict:
    res = {}
    # V1 — estados, comparados às demais UFs
    ufs = agregar(df, ["uf"])
    res["V1"] = teste_transferencia(ufs, np.full(len(ufs), "BR"))
    # V2 — municípios, comparados aos demais municípios da mesma UF
    muns = agregar(df, ["uf", "mun", "nm_mun"])
    res["V2"] = teste_transferencia(muns, muns.uf.values)
    # Seções presentes nos dois turnos
    s = df[df.ambos].copy()
    s["H1"], s["H2"] = s.L1 + s.F1, s.L2 + s.F2
    # V3 — seções, comparadas às seções do grupo de referência
    elig = (s.H1 >= MIN_VOTOS_PROPORCAO) & (s.H2 >= MIN_VOTOS_PROPORCAO)
    g = rotular_grupos(s[elig])
    r = desvio_logit(s.L1[elig], s.H1[elig], s.L2[elig], s.H2[elig], g)
    v3 = s[elig].join(r)
    v3["grupo"] = g
    v3["analisada"] = v3.ref_ok.astype(bool)
    v3["nivel"] = np.where(v3.analisada, nivel_sinal(v3.q, v3.dif_pp), "")
    res["V3"] = v3
    # V4 — comparecimento: taxa do 2º turno comparada à esperada pela taxa do 1º turno e pelo grupo
    elig = (s.aptos1 >= MIN_APTOS) & (s.aptos2 >= MIN_APTOS)
    g = rotular_grupos(s[elig])
    r = desvio_logit(s.comp1[elig], s.aptos1[elig], s.comp2[elig], s.aptos2[elig], g)
    v4 = s[elig].join(r)
    v4["analisada"] = v4.ref_ok.astype(bool)
    # Direcionamento: a parcela da variação líquida do comparecimento que coube a um finalista (ΔX/ΔC) supera a
    # participação média dele na seção, (X1 + X2)/(C1 + C2), em pelo menos LIMIAR_DIRECIONAMENTO.
    dC = (v4.comp2 - v4.comp1).astype(float)
    ex = {}
    for nr, c in ((NR_L, "L"), (NR_F, "F")):
        with np.errstate(all="ignore"):
            ex[nr] = ((v4[c + "2"] - v4[c + "1"]) / dC.where(dC != 0)) - (v4[c + "1"] + v4[c + "2"]) / (v4.comp1 + v4.comp2)
        ex[nr] = ex[nr].fillna(-9.0)
    v4["exc_dir"] = np.maximum(ex[NR_L], ex[NR_F])
    v4["direcionada"] = (dC.abs() >= MIN_VOTOS_VARIACAO) & (v4.exc_dir >= LIMIAR_DIRECIONAMENTO)
    v4["destino"] = np.where(~v4.direcionada, "", np.where(ex[NR_L] >= ex[NR_F], NR_L, NR_F))
    sig = np.nan_to_num(v4.q.values, nan=1.0) < ALFA_FDR
    dif = v4.dif_pp.abs().values
    v4["nivel"] = np.where(v4.analisada & sig & (dif >= LIMIAR_ANOMALIA_PP) & v4.direcionada, "anomalia",
                           np.where(v4.analisada & sig & (dif >= LIMIAR_INFO_PP), "informativo", ""))
    res["V4"] = v4
    # V5 — ganho acima do teto de votos disponíveis sem troca direta entre os finalistas
    v5 = s.copy()
    teto = v5.O1 + v5.B1 + v5.N1 + np.maximum(v5.comp2 - v5.comp1, 0)
    v5["teto"] = teto
    v5["exc_L"] = (v5.L2 - v5.L1) - teto
    v5["exc_F"] = (v5.F2 - v5.F1) - teto
    kL = (v5.exc_L >= MIN_VOTOS_VARIACAO) & (v5.exc_L >= LIMIAR_TETO * v5.F1)
    kF = (v5.exc_F >= MIN_VOTOS_VARIACAO) & (v5.exc_F >= LIMIAR_TETO * v5.L1)
    v5["quem"] = np.where(kL, NR_L, np.where(kF, NR_F, ""))
    v5["analisada"] = True
    v5["nivel"] = np.where(kL | kF, "informativo", "")
    res["V5"] = v5
    # V6 — cadastro alterado entre os turnos ou boletim ausente em um dos turnos
    v6 = df.copy()
    da = v6.aptos2 - v6.aptos1
    v6["d_aptos"] = da
    k = v6.ambos & (da.abs() >= MIN_VOTOS_VARIACAO) & (da.abs() >= LIMIAR_CADASTRO * v6.aptos1)
    falta = ~v6.ambos & ((v6.aptos1 > 0) | (v6.aptos2 > 0))
    v6["motivo"] = np.where(k, "aptos", np.where(falta & (v6.aptos2 == 0), "sem_bu_2t", np.where(falta, "sem_bu_1t", "")))
    v6["analisada"] = True
    v6["nivel"] = np.where(k | falta, "informativo", "")
    res["V6"] = v6
    res["_ufs"], res["_muns"], res["_urnas"] = ufs, muns, urnas
    res["_br"] = {c: int(df[c].sum()) for c in COLS_VOTOS}
    return res


# ----------------------------------------------------------------------------------------------- formatação
def fnum(x, lang: str) -> str:
    s = f"{int(round(x)):,}"
    return s if lang == "EN" else s.replace(",", ".")


def fsin(x, lang: str) -> str:
    return ("+" if x > 0 else "−" if x < 0 else "") + fnum(abs(x), lang)


def fdec(x, lang: str, nd: int = 1) -> str:
    s = f"{x:.{nd}f}"
    return s if lang == "EN" else s.replace(".", ",")


def fpct(x, lang: str, nd: int = 1) -> str:
    return fdec(100.0 * x, lang, nd) + "%"


def fq(q, lang: str) -> str:
    if q is None or not np.isfinite(q):
        return "—"
    s = f"{q:.2e}" if q < 1e-4 else f"{q:.4f}"
    return s if lang == "EN" else s.replace(".", ",")


def sha512(p: Path) -> str:
    return hashlib.sha512(p.read_bytes()).hexdigest()


def r6(x):
    """6 algarismos significativos, como o núcleo analítico do motor."""
    if x is None or (isinstance(x, float) and not np.isfinite(x)):
        return None
    return float(f"{x:.6g}")


# ----------------------------------------------------------------------------------------------- sinais
def montar_sinais(res: dict) -> pd.DataFrame:
    urnas = res["_urnas"]
    lin = []

    def base(r, teste):
        return {"teste": teste, "nivel_geo": NIVEL_TESTE[teste], "uf": r["uf"], "mun": r.get("mun", ""), "nm_mun": r.get("nm_mun", ""),
                "zona": r.get("zona", ""), "secao": r.get("secao", ""), "secoes_agregadas": "",
                "L1": r["L1"], "F1": r["F1"], "O1": r["O1"], "BN1": r["B1"] + r["N1"], "comp1": r["comp1"], "aptos1": r["aptos1"],
                "L2": r["L2"], "F2": r["F2"], "BN2": r["B2"] + r["N2"], "comp2": r["comp2"], "aptos2": r["aptos2"],
                "dL": r["L2"] - r["L1"], "dF": r["F2"] - r["F1"], "dComp": r["comp2"] - r["comp1"],
                "observado": "", "esperado": "", "dif_pp": "", "q": "", "detalhe": "", "nr_urna": "", "cod_carga": ""}

    for t in ("V1", "V2", "V3"):
        d = res[t]
        for _, r in d[d.nivel != ""].iterrows():
            b = base(r, t)
            b.update(nivel=r["nivel"], observado=r6(r["observado"]), esperado=r6(r["esperado"]), dif_pp=r6(r["dif_pp"]), q=r6(r["q"]),
                     detalhe=f"phi={r['phi']:.3g}")
            lin.append(b)
    d = res["V4"]
    for _, r in d[d.nivel != ""].iterrows():
        b = base(r, "V4")
        b.update(nivel=r["nivel"], observado=r6(r["observado"]), esperado=r6(r["esperado"]), dif_pp=r6(r["dif_pp"]), q=r6(r["q"]),
                 detalhe=(f"destino={r['destino']}; excesso={r['exc_dir']:.3g}" if r["destino"] else "destino=proporcional") + f"; phi={r['phi']:.3g}")
        lin.append(b)
    d = res["V5"]
    for _, r in d[d.nivel != ""].iterrows():
        b = base(r, "V5")
        exc = r["exc_L"] if r["quem"] == NR_L else r["exc_F"]
        b.update(nivel=r["nivel"], observado=int(r["L2"] - r["L1"] if r["quem"] == NR_L else r["F2"] - r["F1"]), esperado=int(r["teto"]),
                 detalhe=f"candidato={r['quem']}; excesso={int(exc)}")
        lin.append(b)
    d = res["V6"]
    for _, r in d[d.nivel != ""].iterrows():
        b = base(r, "V6")
        b.update(nivel=r["nivel"], observado=int(r["aptos2"]), esperado=int(r["aptos1"]),
                 detalhe=f"motivo={r['motivo']}" + (f"; d_aptos={int(r['d_aptos'])}" if r["motivo"] == "aptos" else ""))
        lin.append(b)
    s = pd.DataFrame(lin)
    for i, r in s.iterrows():
        if r["nivel_geo"] == "secao":
            u = urnas.get((r["uf"], int(r["zona"]), int(r["secao"])))
            if u:
                s.at[i, "nr_urna"], s.at[i, "cod_carga"] = u[0], u[1]
    ordem_t = {t: i for i, t in enumerate(TESTES)}
    s["_o1"] = s.nivel.map({"anomalia": 0, "informativo": 1})
    s["_o2"] = s.teste.map(ordem_t)
    s["_o3"] = pd.to_numeric(s.q, errors="coerce").fillna(1.0)
    s = s.sort_values(["_o2", "_o1", "_o3", "uf", "mun", "zona", "secao"], kind="mergesort").drop(columns=["_o1", "_o2", "_o3"])
    return s.reset_index(drop=True)


# ----------------------------------------------------------------------------------------------- textos
TX = {
    "PT": {
        "nome": {"V1": "Transferência atípica no estado", "V2": "Transferência atípica no município", "V3": "Transferência atípica na seção",
                 "V4": "Variação atípica do comparecimento", "V5": "Ganho acima do teto de votos disponíveis",
                 "V6": "Cadastro alterado entre os turnos"},
        "nivel": {"uf": "Estado", "municipio": "Município", "secao": "Seção"},
        "nota_topo": "> 📌 **Nota de edição ({data}).** Este relatório foi complementado pelo **Adendo A — Variação dos votos para Presidente "
                     "entre o 1º e o 2º turno**, ao final do documento, com a nota do autor que justifica a edição. As seções 1 a 15 não foram alteradas.\n",
        "titulo": "## Adendo A — Variação dos votos para Presidente entre o 1º e o 2º turno",
        "nota_t": "### Nota de edição — {data}",
        "nota": [
            "Após a emissão deste Relatório Técnico, em {emissao}, a comparação entre os votos obtidos pelos finalistas à Presidência da República "
            "no 1º e no 2º turno passou a ocupar lugar central no debate público. Levantamentos sobre quantos votos cada candidato ganhou ou perdeu "
            "de um turno para o outro — por estado, por município e até por seção eleitoral — foram amplamente difundidos nas redes sociais e na "
            "imprensa nacional e internacional, acompanhados de dúvidas e questionamentos legítimos por parte dos eleitores.",
            "Na condição de autor e responsável técnico por esta auditoria, considerei que um trabalho que se propõe a examinar, com independência e "
            "transparência, a consistência estatística dos resultados oficiais não poderia permanecer silente diante de uma questão de tamanho "
            "interesse público. Senti-me, por isso, no dever de submeter também essa comparação a testes estatísticos formais, conduzidos com o mesmo "
            "rigor, os mesmos fundamentos metodológicos e o mesmo padrão de documentação adotados nos quinze testes originais. O propósito é oferecer "
            "à sociedade uma resposta técnica, verificável e imparcial, capaz de distinguir a variação esperada entre os turnos — decorrente da "
            "redistribuição dos votos dos candidatos não classificados, dos votos brancos e nulos e da mudança do comparecimento — daquilo que, de "
            "fato, merece verificação documental.",
            "Este Adendo A baseia-se exclusivamente nos dados oficiais dos Boletins de Urna dos dois turnos, já processados por esta auditoria. "
            "As seções 1 a 15 deste relatório não foram alteradas: seus resultados, critérios e conclusões permanecem integralmente válidos, e os "
            "quinze testes originais não precisaram ser reexecutados, pois os dados de entrada e o núcleo analítico (SHA-256 `{nucleo}`) são os "
            "mesmos. O adendo foi produzido por script próprio (`variacao_entre_turnos.py`), publicado junto com este relatório para que qualquer "
            "pessoa possa reproduzi-lo integralmente. Os hashes SHA-512 deste documento e dos novos arquivos de dados foram atualizados em "
            "`manifesto_saida.sha512`, e a edição foi registrada publicamente na página de Atualizações do site.",
            "Reafirmo o princípio que orienta todo este trabalho: anomalia estatística indica prioridade de verificação e não constitui, por si só, "
            "prova de fraude, erro ou irregularidade; do mesmo modo, a ausência de sinalização não substitui a conferência dos boletins impressos e "
            "dos arquivos digitais assinados das urnas.",
        ],
        "assina": "**{autor}**  \nAutor e responsável técnico",
        "a1_t": "### A.1 Objetivo e escopo",
        "a1": "Comparar, para o cargo de Presidente, os votos do 1º turno (04/10/2026) e do 2º turno (25/10/2026) em quatro níveis — Brasil, "
              "estado (UF), município e seção eleitoral —, informando separadamente quantos votos cada finalista ganhou ou perdeu, e aplicar seis "
              "testes (V1 a V6) para identificar variações estatisticamente atípicas. Finalistas: Lula (nº 13) e Flávio Bolsonaro (nº 22). Cada "
              "seção eleitoral corresponde a uma urna; seções agregadas aparecem sob o número da seção principal, como no restante do relatório.\n\n"
              "Este adendo lista apenas os itens com anomalia (🔴) ou evento informativo (🟡). A variação de todos os estados e municípios está em "
              "`dados/variacao_turnos_ufs.csv` e `dados/variacao_turnos_municipios.csv`; a de todas as seções pode ser consultada no site.",
        "a2_t": "### A.2 Variação nacional e identidade dos votos",
        "a2": "Os votos que um finalista ganha no 2º turno só podem vir de quatro fontes: eleitores que votaram nos demais candidatos no 1º turno; "
              "eleitores que votaram em branco ou nulo no 1º turno; eleitores que não votaram no 1º turno e votaram no 2º; e eleitores do outro "
              "finalista que mudaram de voto. Em qualquer nível — Brasil, estado, município ou seção — vale a identidade contábil:\n\n"
              "> **ganho de Lula + ganho de Flávio = votos dos demais candidatos no 1º turno + (brancos e nulos do 1º turno − brancos e nulos do "
              "2º turno) + variação do comparecimento**",
        "a2_br": "No Brasil: {o1} + ({bn1} − {bn2}) {dc_sinal} {dc} = **{pool}** votos, dos quais Lula ficou com **{dl}** ({pl}) e Flávio Bolsonaro "
                 "com **{df}** ({pf}).",
        "cab_br": ["", "1º turno", "2º turno", "Variação"],
        "lin_br": ["Lula (13)", "Flávio Bolsonaro (22)", "Demais candidatos", "Brancos", "Nulos", "Comparecimento", "Eleitores aptos"],
        "a3_t": "### A.3 Métodos",
        "comum": "**Fundamento comum (V1 a V4).** Para cada unidade (estado, município ou seção), a proporção observada no 2º turno (p₂) é comparada "
                 "à proporção esperada (p̂), obtida aplicando à proporção do 1º turno (p₁) o deslocamento logístico observado no grupo de referência, "
                 "calculado sem a própria unidade (*leave-one-out*): logit(p̂) = logit(p₁) + [logit(P₂) − logit(P₁)], em que P₁ e P₂ são as "
                 "proporções agregadas do grupo. A diferença é avaliada pela estatística z = (p₂ − p̂)/√(p̂(1 − p̂)/n), dividida por √φ, com "
                 "φ = mediana(z²)/0,4549 estimado no grupo de referência (φ ≥ {phi}). Diferentemente do teste 8, φ pode ser menor que 1: o voto do "
                 "1º turno explica a maior parte do voto do 2º, e a variação entre turnos é menor que a de sorteios binomiais independentes. "
                 "p bilateral; ajuste de Benjamini–Hochberg em cada teste. Além da significância estatística, exige-se efeito mínimo: "
                 "🔴 q < {alfa} e |p₂ − p̂| ≥ {la} p.p.; 🟡 q < {alfa} e {li} ≤ |p₂ − p̂| < {la} p.p. Unidades cujo grupo de referência tem menos "
                 "de {mref} outras unidades não são avaliadas.",
        "obj": "Objetivo", "met": "Método", "crit": "Critério",
        "testes": {
            "V1": ["verificar se a participação de Lula nos votos dos dois finalistas, no 2º turno, se afastou do esperado para o estado.",
                   "p = Lula/(Lula + Flávio) em cada turno; grupo de referência: as demais UFs (o Exterior é tratado como uma UF).",
                   "fundamento comum."],
            "V2": ["verificar se a participação de Lula nos votos dos dois finalistas, no 2º turno, se afastou do esperado para o município.",
                   "p = Lula/(Lula + Flávio) em cada turno; grupo de referência: os demais municípios da mesma UF; municípios com ao menos "
                   "{minv} votos nos finalistas em cada turno.",
                   "fundamento comum."],
            "V3": ["verificar se a participação de Lula nos votos dos dois finalistas, no 2º turno, se afastou do esperado para a seção, "
                   "considerando as seções vizinhas.",
                   "p = Lula/(Lula + Flávio) em cada turno; grupo de referência: a mesma hierarquia do relatório (zona dentro do município, "
                   "com ao menos {mg} seções → município → zona → UF → Brasil); seções com ao menos {minv} votos nos finalistas em cada turno.",
                   "fundamento comum."],
            "V4": ["identificar seções em que o comparecimento subiu ou caiu muito além do observado nas seções do grupo de referência, "
                   "tratando como anomalia os casos em que essa variação ficou concentrada em um dos finalistas.",
                   "p = comparecimento/eleitores aptos, com o fundamento comum (seções com ao menos {mapt} aptos em cada turno). Direcionamento: "
                   "a parcela da variação líquida do comparecimento que coube a um finalista (ΔX/ΔC) supera a participação média dele na seção, "
                   "(X₁ + X₂)/(C₁ + C₂), em ao menos {dir} p.p., com |ΔC| ≥ {mvar} votos.",
                   "🔴 q < {alfa}, |p₂ − p̂| ≥ {la} p.p. e variação direcionada; 🟡 q < {alfa} e |p₂ − p̂| ≥ {li} p.p. nos demais casos."],
            "V5": ["identificar seções em que um finalista ganhou mais votos do que havia disponível sem que eleitores do outro finalista "
                   "mudassem de voto.",
                   "teto = votos dos demais candidatos no 1º turno + brancos e nulos do 1º turno + aumento do comparecimento (quando houver). "
                   "Teste determinístico.",
                   "🟡 quando o ganho supera o teto em ao menos {mvar} votos e em ao menos {teto}% dos votos do outro finalista no 1º turno. "
                   "É sempre informativo: a mudança de voto entre os finalistas é um comportamento legítimo do eleitor; o registro indica onde "
                   "essa mudança foi expressiva."],
            "V6": ["registrar seções cujo eleitorado mudou entre os turnos, o que afeta a comparação.",
                   "comparação do número de eleitores aptos nos dois boletins da seção.",
                   "🟡 quando o número de aptos variou em ao menos {mvar} eleitores e em ao menos {cad}%, ou quando a seção tem boletim em apenas "
                   "um dos turnos. É sempre informativo: ajustes do cadastro entre os turnos ocorrem, por exemplo, com eleitores habilitados para "
                   "votar em trânsito, seções especiais e decisões da Justiça Eleitoral."],
        },
        "a4_t": "### A.4 Resultados consolidados",
        "cab_res": ["Teste", "Nível", "Unidades analisadas", "Anomalias (🔴)", "Eventos informativos (🟡)"],
        "a4_txt": "Os testes V3, V4 e V5 examinam as mesmas seções e não são independentes; uma seção pode aparecer em mais de um deles.",
        "a5_t": "### A.5 Itens sinalizados — listas completas",
        "a5": "As listas trazem todos os itens 🔴 e 🟡, em ordem de q. Para conferir a sua seção, procure a UF, a zona e a seção (Ctrl+F). As colunas "
              "“1º → 2º” mostram os votos no 1º turno, no 2º turno e, entre parênteses, a variação. O número da urna é informado quando a seção "
              "também foi listada pelo motor na Seção 9 (1º ou 2º turno); nos demais casos, consulte o boletim impresso ou os arquivos do TSE.",
        "sub_a": "🔴 Anomalias — lista completa ({n})", "sub_i": "🟡 Eventos informativos — lista completa ({n})", "nenhum": "Nenhuma sinalização.",
        "c": {"uf": "UF", "mun": "Município", "zona": "Zona", "secao": "Seção", "urna": "Nº da urna", "secoes": "Seções",
              "L": "Lula 1º → 2º", "F": "Flávio 1º → 2º", "O": "Demais 1º", "BN": "Brancos e nulos 1º → 2º", "C": "Comparecimento 1º → 2º",
              "obs": "% Lula obs.", "esp": "% Lula esp.", "dif": "Δ p.p.", "q": "q (BH)", "aptos": "Aptos 1º → 2º",
              "tobs": "Comparec. obs.", "tesp": "Comparec. esp.", "dest": "Direcionamento", "cand": "Finalista", "ganho": "Ganho",
              "teto": "Teto", "exc": "Excesso", "mot": "Motivo"},
        "dest": {"13": "Lula ({x} p.p. acima da participação)", "22": "Flávio ({x} p.p. acima da participação)", "": "proporcional"},
        "mot": {"aptos": "aptos alterados ({x})", "sem_bu_2t": "sem boletim no 2º turno", "sem_bu_1t": "sem boletim no 1º turno"},
        "a6_t": "### A.6 Limitações",
        "a6": ["A comparação é feita com votos agregados por seção. O voto é secreto, e não há dado individual de eleitor: não é possível saber "
               "quem mudou de voto, nem separar quem votou em um turno e se absteve no outro; os testes tratam a variação líquida.",
               "O deslocamento logístico uniforme é uma aproximação. Perfis locais distintos (idade, renda, religião, bairro de origem) e fatos "
               "locais ocorridos entre os turnos (apoios políticos, mudança de local de votação, transporte, clima) podem gerar desvios legítimos.",
               "Os limiares de efeito ({la} e {li} p.p.), de direcionamento ({dir} p.p.), de teto ({teto}%) e de cadastro ({cad}%) são premissas "
               "explícitas deste adendo e podem ser alterados no script, que acompanha o relatório.",
               "Os testes V3, V4 e V5 não são independentes entre si; sinalizações simultâneas podem ter a mesma causa legítima.",
               "Como no restante do relatório, a análise não examina os arquivos assinados das urnas (.bu, .rdv, .logjez), cuja verificação é "
               "recomendada para os itens sinalizados."],
        "a7_t": "### A.7 Reprodutibilidade e arquivos",
        "a7": "O adendo é reprodutível a partir dos votos por seção publicados com o site (`site/data/secoes`), extraídos dos Boletins de Urna "
              "oficiais pelo motor v2.1.0, e das listas de urnas do motor (`dados/busca_urnas.json`). Mesma entrada, mesmos arquivos.\n\n"
              "**Comando de execução:** `python auditoria-eleicoes-2026-Brasil/variacao_entre_turnos.py --dados site/data --saida auditoria-eleicoes-2026-Brasil/resultados-2turno` (na pasta raiz do repositório)\n\n"
              "**Script:** `variacao_entre_turnos.py` v{versao} — SHA-512 `{sha}`",
        "cab_arq": ["Arquivo", "Conteúdo", "SHA-512"],
        "arq": {"sin": "Itens 🔴 e 🟡 de todos os testes e níveis", "mun": "Todos os municípios: votos, variação e teste V2",
                "uf": "Todos os estados: votos, variação e teste V1"},
        "rodape": "*Adendo A gerado pelo script `variacao_entre_turnos.py` v{versao} em {data}. Anomalia estatística não é prova de fraude.*",
    },
    "EN": {
        "nome": {"V1": "Atypical transfer in the state", "V2": "Atypical transfer in the municipality", "V3": "Atypical transfer in the section",
                 "V4": "Atypical change in turnout", "V5": "Gain above the ceiling of available votes",
                 "V6": "Voter roll changed between rounds"},
        "nivel": {"uf": "State", "municipio": "Municipality", "secao": "Section"},
        "nota_topo": "> 📌 **Editorial note ({data}).** This report has been supplemented with **Addendum A — Change in presidential votes "
                     "between round 1 and round 2**, at the end of the document, including the author's note explaining the edit. Sections 1 to 15 "
                     "have not been changed.\n",
        "titulo": "## Addendum A — Change in presidential votes between round 1 and round 2",
        "nota_t": "### Editorial note — {data}",
        "nota": [
            "After this Technical Report was issued on {emissao}, the comparison between the votes received by the two presidential finalists "
            "in round 1 and round 2 became central to the public debate. Figures on how many votes each candidate gained or lost from one round "
            "to the next — by state, by municipality and even by polling section — were widely circulated on social media and in the national "
            "and international press, accompanied by legitimate doubts and questions from voters.",
            "As the author and the person technically responsible for this audit, I considered that a work which sets out to examine, "
            "independently and transparently, the statistical consistency of the official results could not remain silent on a question of such "
            "public interest. I therefore felt duty-bound to subject this comparison to formal statistical tests as well, carried out with the "
            "same rigor, the same methodological foundations and the same documentation standard adopted in the fifteen original tests. The "
            "purpose is to offer society a technical, verifiable and impartial answer, able to distinguish the change expected between rounds — "
            "resulting from the redistribution of votes cast for the candidates who did not advance, of blank and null votes, and from changes in "
            "turnout — from what actually warrants documentary verification.",
            "This Addendum A is based exclusively on the official data of the Ballot Box Reports (Boletins de Urna) of both rounds, already "
            "processed by this audit. Sections 1 to 15 of this report have not been changed: their results, criteria and conclusions remain fully "
            "valid, and the fifteen original tests did not need to be re-run, since the input data and the analytical core (SHA-256 `{nucleo}`) "
            "are the same. The addendum was produced by a dedicated script (`variacao_entre_turnos.py`), published together with this report so "
            "that anyone can reproduce it in full. The SHA-512 hashes of this document and of the new data files have been updated in "
            "`manifesto_saida.sha512`, and the edit has been publicly recorded on the site's Updates page.",
            "I reaffirm the principle that guides this entire work: a statistical anomaly indicates a priority for verification and is not, in "
            "itself, proof of fraud, error or irregularity; likewise, the absence of a flag does not replace checking the printed reports and the "
            "signed digital files of the voting machines.",
        ],
        "assina": "**{autor}**  \nAuthor and technical lead",
        "a1_t": "### A.1 Purpose and scope",
        "a1": "To compare, for the office of President, the votes of round 1 (Oct 4, 2026) and round 2 (Oct 25, 2026) at four levels — Brazil, "
              "state (UF), municipality and polling section —, reporting separately how many votes each finalist gained or lost, and to apply six "
              "tests (V1 to V6) to identify statistically atypical changes. Finalists: Lula (no. 13) and Flávio Bolsonaro (no. 22). Each polling "
              "section corresponds to one voting machine; aggregated sections appear under the number of the main section, as in the rest of the report.\n\n"
              "This addendum lists only items with an anomaly (🔴) or an informational event (🟡). The change for every state and municipality is in "
              "`dados/variacao_turnos_ufs.csv` and `dados/variacao_turnos_municipios.csv`; the change for every section can be looked up on the site.",
        "a2_t": "### A.2 National change and vote identity",
        "a2": "The votes a finalist gains in round 2 can only come from four sources: voters who chose the other candidates in round 1; voters who "
              "voted blank or null in round 1; voters who did not vote in round 1 and voted in round 2; and voters of the other finalist who changed "
              "their vote. At every level — Brazil, state, municipality or section — the following accounting identity holds:\n\n"
              "> **Lula's gain + Flávio's gain = votes for the other candidates in round 1 + (blank and null in round 1 − blank and null in round 2) "
              "+ change in turnout**",
        "a2_br": "In Brazil: {o1} + ({bn1} − {bn2}) {dc_sinal} {dc} = **{pool}** votes, of which Lula took **{dl}** ({pl}) and Flávio Bolsonaro "
                 "**{df}** ({pf}).",
        "cab_br": ["", "Round 1", "Round 2", "Change"],
        "lin_br": ["Lula (13)", "Flávio Bolsonaro (22)", "Other candidates", "Blank", "Null", "Turnout", "Eligible voters"],
        "a3_t": "### A.3 Methods",
        "comum": "**Common basis (V1 to V4).** For each unit (state, municipality or section), the proportion observed in round 2 (p₂) is compared "
                 "with the expected proportion (p̂), obtained by applying to the round 1 proportion (p₁) the logistic shift observed in the "
                 "reference group, computed without the unit itself (leave-one-out): logit(p̂) = logit(p₁) + [logit(P₂) − logit(P₁)], where P₁ and "
                 "P₂ are the group's aggregate proportions. The difference is assessed with the statistic z = (p₂ − p̂)/√(p̂(1 − p̂)/n), divided by "
                 "√φ, with φ = median(z²)/0.4549 estimated in the reference group (φ ≥ {phi}). Unlike test 8, φ may be below 1: the round 1 vote "
                 "explains most of the round 2 vote, and the change between rounds is smaller than that of independent binomial draws. Two-sided "
                 "p; Benjamini–Hochberg adjustment within each test. In addition to statistical significance, a minimum effect is required: "
                 "🔴 q < {alfa} and |p₂ − p̂| ≥ {la} p.p.; 🟡 q < {alfa} and {li} ≤ |p₂ − p̂| < {la} p.p. Units whose reference group has fewer "
                 "than {mref} other units are not assessed.",
        "obj": "Purpose", "met": "Method", "crit": "Criterion",
        "testes": {
            "V1": ["check whether Lula's share of the two finalists' votes in round 2 departed from what was expected for the state.",
                   "p = Lula/(Lula + Flávio) in each round; reference group: the other states (Abroad is treated as a state).",
                   "common basis."],
            "V2": ["check whether Lula's share of the two finalists' votes in round 2 departed from what was expected for the municipality.",
                   "p = Lula/(Lula + Flávio) in each round; reference group: the other municipalities of the same state; municipalities with at "
                   "least {minv} votes for the finalists in each round.",
                   "common basis."],
            "V3": ["check whether Lula's share of the two finalists' votes in round 2 departed from what was expected for the section, given the "
                   "neighboring sections.",
                   "p = Lula/(Lula + Flávio) in each round; reference group: the same hierarchy as the report (zone within the municipality with "
                   "at least {mg} sections → municipality → zone → state → Brazil); sections with at least {minv} votes for the finalists in each round.",
                   "common basis."],
            "V4": ["identify sections where turnout rose or fell far beyond what was observed in the reference group, treating as an anomaly "
                   "the cases where that change was concentrated on one of the finalists.",
                   "p = turnout/eligible voters, with the common basis (sections with at least {mapt} eligible voters in each round). Direction: the "
                   "share of the net turnout change that went to one finalist (ΔX/ΔC) exceeds that finalist's average share in the section, "
                   "(X₁ + X₂)/(C₁ + C₂), by at least {dir} p.p., with |ΔC| ≥ {mvar} votes.",
                   "🔴 q < {alfa}, |p₂ − p̂| ≥ {la} p.p. and directed change; 🟡 q < {alfa} and |p₂ − p̂| ≥ {li} p.p. in the other cases."],
            "V5": ["identify sections where a finalist gained more votes than were available without voters of the other finalist changing their vote.",
                   "ceiling = votes for the other candidates in round 1 + blank and null in round 1 + increase in turnout (if any). Deterministic test.",
                   "🟡 when the gain exceeds the ceiling by at least {mvar} votes and by at least {teto}% of the other finalist's round 1 votes. It is "
                   "always informational: changing one's vote between the finalists is legitimate voter behavior; the record shows where that change "
                   "was large."],
            "V6": ["record sections whose electorate changed between rounds, which affects the comparison.",
                   "comparison of the number of eligible voters in the section's two reports.",
                   "🟡 when the number of eligible voters changed by at least {mvar} voters and by at least {cad}%, or when the section has a report "
                   "in only one round. It is always informational: voter roll adjustments between rounds occur, for example, with voters authorized "
                   "to vote in transit, special sections and Electoral Court decisions."],
        },
        "a4_t": "### A.4 Consolidated results",
        "cab_res": ["Test", "Level", "Units analyzed", "Anomalies (🔴)", "Informational events (🟡)"],
        "a4_txt": "Tests V3, V4 and V5 examine the same sections and are not independent; a section may appear in more than one of them.",
        "a5_t": "### A.5 Flagged items — complete lists",
        "a5": "The lists include every 🔴 and 🟡 item, ordered by q. To check your section, search for the state, zone and section (Ctrl+F). The "
              "“R1 → R2” columns show the votes in round 1, in round 2 and, in parentheses, the change. The voting machine number is given when "
              "the section was also listed by the engine in Section 9 (round 1 or 2); otherwise, see the printed report or the TSE files.",
        "sub_a": "🔴 Anomalies — complete list ({n})", "sub_i": "🟡 Informational events — complete list ({n})", "nenhum": "No flags.",
        "c": {"uf": "State", "mun": "Municipality", "zona": "Zone", "secao": "Section", "urna": "Machine no.", "secoes": "Sections",
              "L": "Lula R1 → R2", "F": "Flávio R1 → R2", "O": "Others R1", "BN": "Blank and null R1 → R2", "C": "Turnout R1 → R2",
              "obs": "% Lula obs.", "esp": "% Lula exp.", "dif": "Δ p.p.", "q": "q (BH)", "aptos": "Eligible R1 → R2",
              "tobs": "Turnout obs.", "tesp": "Turnout exp.", "dest": "Direction", "cand": "Finalist", "ganho": "Gain",
              "teto": "Ceiling", "exc": "Excess", "mot": "Reason"},
        "dest": {"13": "Lula ({x} p.p. above share)", "22": "Flávio ({x} p.p. above share)", "": "proportional"},
        "mot": {"aptos": "eligible voters changed ({x})", "sem_bu_2t": "no report in round 2", "sem_bu_1t": "no report in round 1"},
        "a6_t": "### A.6 Limitations",
        "a6": ["The comparison uses votes aggregated by section. The vote is secret and there is no individual voter data: it is not possible to "
               "know who changed their vote, nor to separate those who voted in one round and abstained in the other; the tests deal with the net change.",
               "The uniform logistic shift is an approximation. Different local profiles (age, income, religion, neighborhood of origin) and local "
               "events between rounds (political endorsements, change of polling place, transport, weather) may cause legitimate deviations.",
               "The effect thresholds ({la} and {li} p.p.), direction ({dir} p.p.), ceiling ({teto}%) and voter roll ({cad}%) are explicit "
               "assumptions of this addendum and can be changed in the script that accompanies the report.",
               "Tests V3, V4 and V5 are not independent of each other; simultaneous flags may share the same legitimate cause.",
               "As in the rest of the report, the analysis does not examine the voting machines' signed files (.bu, .rdv, .logjez), whose "
               "verification is recommended for flagged items."],
        "a7_t": "### A.7 Reproducibility and files",
        "a7": "The addendum can be reproduced from the per-section votes published with the site (`site/data/secoes`), extracted from the official "
              "Ballot Box Reports by engine v2.1.0, and from the engine's machine lists (`dados/busca_urnas.json`). Same input, same files.\n\n"
              "**Command:** `python auditoria-eleicoes-2026-Brasil/variacao_entre_turnos.py --dados site/data --saida auditoria-eleicoes-2026-Brasil/resultados-2turno` (from the repository root folder)\n\n"
              "**Script:** `variacao_entre_turnos.py` v{versao} — SHA-512 `{sha}`",
        "cab_arq": ["File", "Content", "SHA-512"],
        "arq": {"sin": "🔴 and 🟡 items of every test and level", "mun": "Every municipality: votes, change and test V2",
                "uf": "Every state: votes, change and test V1"},
        "rodape": "*Addendum A generated by the script `variacao_entre_turnos.py` v{versao} on {data}. A statistical anomaly is not proof of fraud.*",
    },
    "ES": {
        "nome": {"V1": "Transferencia atípica en el estado", "V2": "Transferencia atípica en el municipio", "V3": "Transferencia atípica en la sección",
                 "V4": "Variación atípica de la participación", "V5": "Ganancia por encima del techo de votos disponibles",
                 "V6": "Padrón alterado entre las vueltas"},
        "nivel": {"uf": "Estado", "municipio": "Municipio", "secao": "Sección"},
        "nota_topo": "> 📌 **Nota de edición ({data}).** Este informe fue complementado con el **Anexo A — Variación de los votos para Presidente "
                     "entre la 1.ª y la 2.ª vuelta**, al final del documento, con la nota del autor que justifica la edición. Las secciones 1 a 15 "
                     "no fueron modificadas.\n",
        "titulo": "## Anexo A — Variación de los votos para Presidente entre la 1.ª y la 2.ª vuelta",
        "nota_t": "### Nota de edición — {data}",
        "nota": [
            "Tras la emisión de este Informe Técnico, el {emissao}, la comparación entre los votos obtenidos por los finalistas a la Presidencia "
            "de la República en la 1.ª y en la 2.ª vuelta pasó a ocupar un lugar central en el debate público. Cifras sobre cuántos votos ganó o "
            "perdió cada candidato de una vuelta a otra —por estado, por municipio e incluso por sección electoral— fueron ampliamente difundidas "
            "en las redes sociales y en la prensa nacional e internacional, acompañadas de dudas y cuestionamientos legítimos de los electores.",
            "En mi condición de autor y responsable técnico de esta auditoría, consideré que un trabajo que se propone examinar, con independencia "
            "y transparencia, la consistencia estadística de los resultados oficiales no podía permanecer en silencio ante una cuestión de tanto "
            "interés público. Me sentí, por ello, en el deber de someter también esta comparación a pruebas estadísticas formales, realizadas con "
            "el mismo rigor, los mismos fundamentos metodológicos y el mismo estándar de documentación adoptados en las quince pruebas originales. "
            "El propósito es ofrecer a la sociedad una respuesta técnica, verificable e imparcial, capaz de distinguir la variación esperada entre "
            "las vueltas —derivada de la redistribución de los votos de los candidatos no clasificados, de los votos en blanco y nulos y del "
            "cambio en la participación— de aquello que realmente merece verificación documental.",
            "Este Anexo A se basa exclusivamente en los datos oficiales de los Boletines de Urna de las dos vueltas, ya procesados por esta "
            "auditoría. Las secciones 1 a 15 de este informe no fueron modificadas: sus resultados, criterios y conclusiones siguen siendo "
            "plenamente válidos, y no fue necesario volver a ejecutar las quince pruebas originales, pues los datos de entrada y el núcleo "
            "analítico (SHA-256 `{nucleo}`) son los mismos. El anexo fue producido por un script propio (`variacao_entre_turnos.py`), publicado "
            "junto con este informe para que cualquier persona pueda reproducirlo íntegramente. Los hashes SHA-512 de este documento y de los "
            "nuevos archivos de datos fueron actualizados en `manifesto_saida.sha512`, y la edición quedó registrada públicamente en la página de "
            "Actualizaciones del sitio.",
            "Reafirmo el principio que orienta todo este trabajo: una anomalía estadística indica prioridad de verificación y no constituye, por "
            "sí sola, prueba de fraude, error o irregularidad; del mismo modo, la ausencia de señalización no sustituye la verificación de los "
            "boletines impresos y de los archivos digitales firmados de las urnas.",
        ],
        "assina": "**{autor}**  \nAutor y responsable técnico",
        "a1_t": "### A.1 Objetivo y alcance",
        "a1": "Comparar, para el cargo de Presidente, los votos de la 1.ª vuelta (04/10/2026) y de la 2.ª vuelta (25/10/2026) en cuatro niveles "
              "—Brasil, estado (UF), municipio y sección electoral—, informando por separado cuántos votos ganó o perdió cada finalista, y aplicar "
              "seis pruebas (V1 a V6) para identificar variaciones estadísticamente atípicas. Finalistas: Lula (n.º 13) y Flávio Bolsonaro (n.º 22). "
              "Cada sección electoral corresponde a una urna; las secciones agregadas aparecen bajo el número de la sección principal, como en el "
              "resto del informe.\n\n"
              "Este anexo enumera solo los ítems con anomalía (🔴) o evento informativo (🟡). La variación de todos los estados y municipios está en "
              "`dados/variacao_turnos_ufs.csv` y `dados/variacao_turnos_municipios.csv`; la de todas las secciones puede consultarse en el sitio.",
        "a2_t": "### A.2 Variación nacional e identidad de los votos",
        "a2": "Los votos que un finalista gana en la 2.ª vuelta solo pueden provenir de cuatro fuentes: electores que votaron por los demás "
              "candidatos en la 1.ª vuelta; electores que votaron en blanco o nulo en la 1.ª vuelta; electores que no votaron en la 1.ª vuelta y "
              "votaron en la 2.ª; y electores del otro finalista que cambiaron su voto. En cualquier nivel —Brasil, estado, municipio o sección— se "
              "cumple la identidad contable:\n\n"
              "> **ganancia de Lula + ganancia de Flávio = votos de los demás candidatos en la 1.ª vuelta + (blancos y nulos de la 1.ª vuelta − "
              "blancos y nulos de la 2.ª vuelta) + variación de la participación**",
        "a2_br": "En Brasil: {o1} + ({bn1} − {bn2}) {dc_sinal} {dc} = **{pool}** votos, de los cuales Lula obtuvo **{dl}** ({pl}) y Flávio "
                 "Bolsonaro **{df}** ({pf}).",
        "cab_br": ["", "1.ª vuelta", "2.ª vuelta", "Variación"],
        "lin_br": ["Lula (13)", "Flávio Bolsonaro (22)", "Demás candidatos", "Blancos", "Nulos", "Participación", "Electores habilitados"],
        "a3_t": "### A.3 Métodos",
        "comum": "**Fundamento común (V1 a V4).** Para cada unidad (estado, municipio o sección), la proporción observada en la 2.ª vuelta (p₂) se "
                 "compara con la proporción esperada (p̂), obtenida aplicando a la proporción de la 1.ª vuelta (p₁) el desplazamiento logístico "
                 "observado en el grupo de referencia, calculado sin la propia unidad (*leave-one-out*): logit(p̂) = logit(p₁) + [logit(P₂) − "
                 "logit(P₁)], donde P₁ y P₂ son las proporciones agregadas del grupo. La diferencia se evalúa con el estadístico "
                 "z = (p₂ − p̂)/√(p̂(1 − p̂)/n), dividido por √φ, con φ = mediana(z²)/0,4549 estimado en el grupo de referencia (φ ≥ {phi}). A "
                 "diferencia de la prueba 8, φ puede ser menor que 1: el voto de la 1.ª vuelta explica la mayor parte del voto de la 2.ª, y la "
                 "variación entre vueltas es menor que la de sorteos binomiales independientes. p bilateral; ajuste de Benjamini–Hochberg en cada "
                 "prueba. Además de la significancia estadística, se exige un efecto mínimo: 🔴 q < {alfa} y |p₂ − p̂| ≥ {la} p.p.; 🟡 q < {alfa} y "
                 "{li} ≤ |p₂ − p̂| < {la} p.p. Las unidades cuyo grupo de referencia tiene menos de {mref} otras unidades no se evalúan.",
        "obj": "Objetivo", "met": "Método", "crit": "Criterio",
        "testes": {
            "V1": ["verificar si la participación de Lula en los votos de los dos finalistas, en la 2.ª vuelta, se apartó de lo esperado para el estado.",
                   "p = Lula/(Lula + Flávio) en cada vuelta; grupo de referencia: las demás UF (el Exterior se trata como una UF).",
                   "fundamento común."],
            "V2": ["verificar si la participación de Lula en los votos de los dos finalistas, en la 2.ª vuelta, se apartó de lo esperado para el municipio.",
                   "p = Lula/(Lula + Flávio) en cada vuelta; grupo de referencia: los demás municipios de la misma UF; municipios con al menos "
                   "{minv} votos para los finalistas en cada vuelta.",
                   "fundamento común."],
            "V3": ["verificar si la participación de Lula en los votos de los dos finalistas, en la 2.ª vuelta, se apartó de lo esperado para la "
                   "sección, considerando las secciones vecinas.",
                   "p = Lula/(Lula + Flávio) en cada vuelta; grupo de referencia: la misma jerarquía del informe (zona dentro del municipio, con "
                   "al menos {mg} secciones → municipio → zona → UF → Brasil); secciones con al menos {minv} votos para los finalistas en cada vuelta.",
                   "fundamento común."],
            "V4": ["identificar secciones en las que la participación subió o bajó mucho más de lo observado en el grupo de referencia, "
                   "tratando como anomalía los casos en que esa variación se concentró en uno de los finalistas.",
                   "p = participación/electores habilitados, con el fundamento común (secciones con al menos {mapt} habilitados en cada vuelta). "
                   "Direccionamiento: la parte de la variación neta de la participación que correspondió a un finalista (ΔX/ΔC) supera su "
                   "participación media en la sección, (X₁ + X₂)/(C₁ + C₂), en al menos {dir} p.p., con |ΔC| ≥ {mvar} votos.",
                   "🔴 q < {alfa}, |p₂ − p̂| ≥ {la} p.p. y variación direccionada; 🟡 q < {alfa} y |p₂ − p̂| ≥ {li} p.p. en los demás casos."],
            "V5": ["identificar secciones en las que un finalista ganó más votos de los que había disponibles sin que electores del otro finalista "
                   "cambiaran su voto.",
                   "techo = votos de los demás candidatos en la 1.ª vuelta + blancos y nulos de la 1.ª vuelta + aumento de la participación (si "
                   "lo hubo). Prueba determinística.",
                   "🟡 cuando la ganancia supera el techo en al menos {mvar} votos y en al menos el {teto}% de los votos del otro finalista en la "
                   "1.ª vuelta. Es siempre informativo: cambiar el voto entre los finalistas es un comportamiento legítimo del elector; el registro "
                   "indica dónde ese cambio fue significativo."],
            "V6": ["registrar secciones cuyo electorado cambió entre las vueltas, lo que afecta la comparación.",
                   "comparación del número de electores habilitados en los dos boletines de la sección.",
                   "🟡 cuando el número de habilitados varió en al menos {mvar} electores y en al menos el {cad}%, o cuando la sección tiene "
                   "boletín en una sola vuelta. Es siempre informativo: los ajustes del padrón entre vueltas ocurren, por ejemplo, con electores "
                   "habilitados para votar en tránsito, secciones especiales y decisiones de la Justicia Electoral."],
        },
        "a4_t": "### A.4 Resultados consolidados",
        "cab_res": ["Prueba", "Nivel", "Unidades analizadas", "Anomalías (🔴)", "Eventos informativos (🟡)"],
        "a4_txt": "Las pruebas V3, V4 y V5 examinan las mismas secciones y no son independientes; una sección puede aparecer en más de una de ellas.",
        "a5_t": "### A.5 Ítems señalados — listas completas",
        "a5": "Las listas incluyen todos los ítems 🔴 y 🟡, en orden de q. Para verificar su sección, busque la UF, la zona y la sección (Ctrl+F). "
              "Las columnas “1.ª → 2.ª” muestran los votos en la 1.ª vuelta, en la 2.ª vuelta y, entre paréntesis, la variación. El número de la "
              "urna se informa cuando la sección también fue listada por el motor en la Sección 9 (1.ª o 2.ª vuelta); en los demás casos, consulte "
              "el boletín impreso o los archivos del TSE.",
        "sub_a": "🔴 Anomalías — lista completa ({n})", "sub_i": "🟡 Eventos informativos — lista completa ({n})", "nenhum": "Ninguna señalización.",
        "c": {"uf": "UF", "mun": "Municipio", "zona": "Zona", "secao": "Sección", "urna": "N.º de urna", "secoes": "Secciones",
              "L": "Lula 1.ª → 2.ª", "F": "Flávio 1.ª → 2.ª", "O": "Demás 1.ª", "BN": "Blancos y nulos 1.ª → 2.ª", "C": "Participación 1.ª → 2.ª",
              "obs": "% Lula obs.", "esp": "% Lula esp.", "dif": "Δ p.p.", "q": "q (BH)", "aptos": "Habilitados 1.ª → 2.ª",
              "tobs": "Particip. obs.", "tesp": "Particip. esp.", "dest": "Direccionamiento", "cand": "Finalista", "ganho": "Ganancia",
              "teto": "Techo", "exc": "Exceso", "mot": "Motivo"},
        "dest": {"13": "Lula ({x} p.p. sobre su participación)", "22": "Flávio ({x} p.p. sobre su participación)", "": "proporcional"},
        "mot": {"aptos": "habilitados alterados ({x})", "sem_bu_2t": "sin boletín en la 2.ª vuelta", "sem_bu_1t": "sin boletín en la 1.ª vuelta"},
        "a6_t": "### A.6 Limitaciones",
        "a6": ["La comparación se hace con votos agregados por sección. El voto es secreto y no hay datos individuales de electores: no es posible "
               "saber quién cambió su voto ni separar a quien votó en una vuelta y se abstuvo en la otra; las pruebas tratan la variación neta.",
               "El desplazamiento logístico uniforme es una aproximación. Perfiles locales distintos (edad, ingresos, religión, barrio de origen) y "
               "hechos locales ocurridos entre las vueltas (apoyos políticos, cambio de local de votación, transporte, clima) pueden generar "
               "desviaciones legítimas.",
               "Los umbrales de efecto ({la} y {li} p.p.), de direccionamiento ({dir} p.p.), de techo ({teto}%) y de padrón ({cad}%) son premisas "
               "explícitas de este anexo y pueden modificarse en el script que acompaña al informe.",
               "Las pruebas V3, V4 y V5 no son independientes entre sí; señalizaciones simultáneas pueden tener la misma causa legítima.",
               "Como en el resto del informe, el análisis no examina los archivos firmados de las urnas (.bu, .rdv, .logjez), cuya verificación "
               "se recomienda para los ítems señalados."],
        "a7_t": "### A.7 Reproducibilidad y archivos",
        "a7": "El anexo es reproducible a partir de los votos por sección publicados con el sitio (`site/data/secoes`), extraídos de los Boletines "
              "de Urna oficiales por el motor v2.1.0, y de las listas de urnas del motor (`dados/busca_urnas.json`). Misma entrada, mismos archivos.\n\n"
              "**Comando de ejecución:** `python auditoria-eleicoes-2026-Brasil/variacao_entre_turnos.py --dados site/data --saida auditoria-eleicoes-2026-Brasil/resultados-2turno` (en la carpeta raíz del repositorio)\n\n"
              "**Script:** `variacao_entre_turnos.py` v{versao} — SHA-512 `{sha}`",
        "cab_arq": ["Archivo", "Contenido", "SHA-512"],
        "arq": {"sin": "Ítems 🔴 y 🟡 de todas las pruebas y niveles", "mun": "Todos los municipios: votos, variación y prueba V2",
                "uf": "Todos los estados: votos, variación y prueba V1"},
        "rodape": "*Anexo A generado por el script `variacao_entre_turnos.py` v{versao} el {data}. Una anomalía estadística no es prueba de fraude.*",
    },
}


def contagens(res: dict) -> dict:
    c = {}
    for t in TESTES:
        d = res[t]
        c[t] = {"unidades": int(d.analisada.sum()), "a": int((d.nivel == "anomalia").sum()), "i": int((d.nivel == "informativo").sum())}
    return c


def status(c: dict) -> str:
    return "🔴" if c["a"] else ("🟡" if c["i"] else "🟢")


def md_tabela(cab: list[str], linhas: list[list], direita: set[int] = frozenset()) -> str:
    sep = ["---:" if i in direita else "---" for i in range(len(cab))]
    out = ["| " + " | ".join(cab) + " |", "|" + "|".join(sep) + "|"]
    out += ["| " + " | ".join(str(c) for c in ln) + " |" for ln in linhas]
    return "\n".join(out)


def adendo(lang: str, res: dict, sinais: pd.DataFrame, hashes: dict, autor: str) -> str:
    L, R = TX[lang], res["_R"]
    num = lambda x: fnum(x, lang)
    var = lambda a, b: f"{num(a)} → {num(b)} ({fsin(b - a, lang)})"
    par = dict(phi=fdec(PHI_MIN, lang, 2), alfa=fdec(ALFA_FDR, lang, 2), la=fdec(LIMIAR_ANOMALIA_PP, lang, 0), li=fdec(LIMIAR_INFO_PP, lang, 0),
               mref=MIN_UNIDADES_REF, minv=MIN_VOTOS_PROPORCAO, mg=MIN_SECOES_GRUPO, mapt=MIN_APTOS, dir=fdec(100 * LIMIAR_DIRECIONAMENTO, lang, 0),
               mvar=MIN_VOTOS_VARIACAO, teto=fdec(100 * LIMIAR_TETO, lang, 0), cad=fdec(100 * LIMIAR_CADASTRO, lang, 0))
    P = [L["titulo"], "", L["nota_t"].format(data=DATA_EDICAO), ""]
    for x in L["nota"]:
        P += [x.format(emissao=R["turnos"]["2"]["cab"]["emissao"], nucleo=R["turnos"]["2"]["cab"]["nucleo_sha256"]), ""]
    P += [L["assina"].format(autor=autor), "", L["a1_t"], "", L["a1"], "", L["a2_t"], "", L["a2"], ""]
    b = res["_br"]
    BN1, BN2, dC = b["B1"] + b["N1"], b["B2"] + b["N2"], b["comp2"] - b["comp1"]
    dl, dfl = b["L2"] - b["L1"], b["F2"] - b["F1"]
    pool = dl + dfl
    linhas = [[L["lin_br"][0], num(b["L1"]), num(b["L2"]), fsin(dl, lang)], [L["lin_br"][1], num(b["F1"]), num(b["F2"]), fsin(dfl, lang)],
              [L["lin_br"][2], num(b["O1"]), "—", fsin(-b["O1"], lang)], [L["lin_br"][3], num(b["B1"]), num(b["B2"]), fsin(b["B2"] - b["B1"], lang)],
              [L["lin_br"][4], num(b["N1"]), num(b["N2"]), fsin(b["N2"] - b["N1"], lang)], [L["lin_br"][5], num(b["comp1"]), num(b["comp2"]), fsin(dC, lang)],
              [L["lin_br"][6], num(b["aptos1"]), num(b["aptos2"]), fsin(b["aptos2"] - b["aptos1"], lang)]]
    P += [md_tabela(L["cab_br"], linhas, {1, 2, 3}), ""]
    P += [L["a2_br"].format(o1=num(b["O1"]), bn1=num(BN1), bn2=num(BN2), dc_sinal="+" if dC >= 0 else "−", dc=num(abs(dC)), pool=num(pool),
                            dl=fsin(dl, lang), pl=fpct(dl / pool, lang), df=fsin(dfl, lang), pf=fpct(dfl / pool, lang)), ""]
    P += [L["a3_t"], "", L["comum"].format(**par), ""]
    for t in TESTES:
        o, m, c = (x.format(**par) for x in L["testes"][t])
        P += [f"**{t} — {L['nome'][t]}.** *{L['obj']}:* {o} *{L['met']}:* {m} *{L['crit']}:* {c}", ""]
    cont = contagens(res)
    P += [L["a4_t"], ""]
    P += [md_tabela(L["cab_res"], [[f"{status(cont[t])} {t}. {L['nome'][t]}", L["nivel"][NIVEL_TESTE[t]], num(cont[t]["unidades"]),
                                    num(cont[t]["a"]), num(cont[t]["i"])] for t in TESTES], {2, 3, 4}), "", L["a4_txt"], ""]
    P += [L["a5_t"], "", L["a5"], ""]
    C = L["c"]
    for i, t in enumerate(TESTES, 1):
        st = sinais[sinais.teste == t]
        P += [f"#### A.5.{i} {status(cont[t])} {t}. {L['nome'][t]}", ""]
        if st.empty:
            P += [L["nenhum"], ""]
            continue
        for nv, sub in (("anomalia", "sub_a"), ("informativo", "sub_i")):
            d = st[st.nivel == nv]
            if d.empty:
                continue
            P += [f"**{L[sub].format(n=num(len(d)))}**", ""]
            P += [tabela_sinais(t, d, lang, C, L), ""]
    P += [L["a6_t"], ""] + [f"- {x.format(**par)}" for x in L["a6"]] + [""]
    P += [L["a7_t"], "", L["a7"].format(versao=VERSAO, sha=sha512(Path(__file__).resolve())), ""]
    P += [md_tabela(L["cab_arq"], [[f"`dados/{hashes[k][0]}`", L["arq"][k], f"`{hashes[k][1]}`"] for k in ("sin", "mun", "uf")]), ""]
    P += [L["rodape"].format(versao=VERSAO, data=DATA_EDICAO)]
    return "\n".join(P)


def tabela_sinais(t: str, d: pd.DataFrame, lang: str, C: dict, L: dict) -> str:
    num = lambda x: fnum(x, lang)
    var = lambda a, b: f"{num(a)} → {num(b)} ({fsin(b - a, lang)})"
    pc = lambda x: fpct(float(x), lang) if x != "" else "—"
    dp = lambda x: (("+" if float(x) > 0 else "−" if float(x) < 0 else "") + fdec(abs(float(x)), lang)) if x != "" else "—"
    mun = lambda r: f"{r.nm_mun} ({int(r.mun)})"
    linhas = []
    for k, r in enumerate(d.itertuples(), 1):
        if t == "V1":
            linhas.append([k, r.uf, var(r.L1, r.L2), var(r.F1, r.F2), num(r.O1), var(r.BN1, r.BN2), var(r.comp1, r.comp2),
                           pc(r.observado), pc(r.esperado), dp(r.dif_pp), fq(r.q, lang)])
            continue
        if t == "V2":
            linhas.append([k, r.uf, mun(r), var(r.L1, r.L2), var(r.F1, r.F2), num(r.O1), var(r.BN1, r.BN2), var(r.comp1, r.comp2),
                           pc(r.observado), pc(r.esperado), dp(r.dif_pp), fq(r.q, lang)])
            continue
        loc = [k, r.uf, mun(r), int(r.zona), int(r.secao), r.nr_urna or "—"]
        if t == "V3":
            linhas.append(loc + [var(r.L1, r.L2), var(r.F1, r.F2), num(r.O1), var(r.BN1, r.BN2), var(r.comp1, r.comp2),
                                 pc(r.observado), pc(r.esperado), dp(r.dif_pp), fq(r.q, lang)])
        elif t == "V4":
            det = dict(x.split("=") for x in r.detalhe.split("; "))
            dest = det["destino"] if det["destino"] in (NR_L, NR_F) else ""
            x = fdec(100 * float(det["excesso"]), lang, 0) if dest else ""
            linhas.append(loc + [var(r.comp1, r.comp2), pc(r.observado), pc(r.esperado), dp(r.dif_pp), fq(r.q, lang),
                                 var(r.L1, r.L2), var(r.F1, r.F2), L["dest"][dest].format(x=x)])
        elif t == "V5":
            det = dict(x.split("=") for x in r.detalhe.split("; "))
            linhas.append(loc + [NOMES[det["candidato"]], fsin(int(r.observado), lang), num(int(r.esperado)), fsin(int(det["excesso"]), lang),
                                 var(r.L1, r.L2), var(r.F1, r.F2), num(r.O1), var(r.BN1, r.BN2), var(r.comp1, r.comp2)])
        else:
            det = dict(x.split("=") for x in r.detalhe.split("; "))
            linhas.append(loc + [var(int(r.esperado), int(r.observado)), L["mot"][det["motivo"]].format(x=fsin(int(det.get("d_aptos", 0)), lang)),
                                 var(r.comp1, r.comp2)])
    base = ["#", C["uf"], C["mun"], C["zona"], C["secao"], C["urna"]]
    cab = {"V1": ["#", C["uf"], C["L"], C["F"], C["O"], C["BN"], C["C"], C["obs"], C["esp"], C["dif"], C["q"]],
           "V2": ["#", C["uf"], C["mun"], C["L"], C["F"], C["O"], C["BN"], C["C"], C["obs"], C["esp"], C["dif"], C["q"]],
           "V3": base + [C["L"], C["F"], C["O"], C["BN"], C["C"], C["obs"], C["esp"], C["dif"], C["q"]],
           "V4": base + [C["C"], C["tobs"], C["tesp"], C["dif"], C["q"], C["L"], C["F"], C["dest"]],
           "V5": base + [C["cand"], C["ganho"], C["teto"], C["exc"], C["L"], C["F"], C["O"], C["BN"], C["C"]],
           "V6": base + [C["aptos"], C["mot"], C["C"]]}[t]
    return md_tabela(cab, linhas, {0, 3, 4} if t not in ("V1", "V2") else {0})


def colocar_nota(texto: str, bloco: str) -> str:
    i = texto.index("\n## 1.")
    return texto[:i] + "\n" + bloco + "\n" + texto[i:]


def colocar_adendo(texto: str, bloco: str) -> str:
    i = texto.rindex("\n---\n")
    return texto[:i] + "\n\n" + bloco + "\n" + texto[i:]


def inserir(texto: str, ini: str, fim: str, bloco: str, onde) -> str:
    """Substitui o bloco entre marcadores (execução repetida não duplica) ou o insere na posição indicada."""
    if ini in texto:
        return re.sub(re.escape(ini) + r".*?" + re.escape(fim), lambda m: bloco, texto, count=1, flags=re.S)
    return onde(texto, bloco)


# ----------------------------------------------------------------------------------------------- saídas
COLS_CSV = ["teste", "teste_nome", "nivel", "nivel_geo", "uf", "mun", "nm_mun", "zona", "secao", "nr_urna", "cod_carga",
            "L1", "F1", "O1", "BN1", "comp1", "aptos1", "L2", "F2", "BN2", "comp2", "aptos2", "dL", "dF", "dComp",
            "observado", "esperado", "dif_pp", "q", "detalhe"]


def escrever_csv(p: Path, linhas: list[dict], cols: list[str]) -> None:
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=cols, extrasaction="ignore", lineterminator="\r\n")  # como as planilhas do motor
    w.writeheader()
    for ln in linhas:
        w.writerow({k: ("" if v is None or (isinstance(v, float) and not np.isfinite(v)) else v) for k, v in ln.items()})
    p.write_bytes(("\ufeff" + buf.getvalue()).encode("utf-8"))


def tabela_nivel(d: pd.DataFrame, chave: list[str]) -> list[dict]:
    out = []
    for _, r in d.iterrows():
        ln = {k: r[k] for k in chave}
        ln.update({c: int(r[c]) for c in COLS_VOTOS})
        ln.update(secoes=int(r["secoes"]), BN1=int(r["B1"] + r["N1"]), BN2=int(r["B2"] + r["N2"]),
                  dL=int(r["L2"] - r["L1"]), dF=int(r["F2"] - r["F1"]), dComp=int(r["comp2"] - r["comp1"]),
                  observado=r6(r["observado"]), esperado=r6(r["esperado"]), dif_pp=r6(r["dif_pp"]), q=r6(r["q"]),
                  nivel=r["nivel"] or ("" if not r["analisada"] else "ok"))
        out.append(ln)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dados", required=True, type=Path, help="pasta site/data")
    ap.add_argument("--saida", required=True, type=Path, help="pasta resultados-2turno")
    a = ap.parse_args()
    df, R = carregar(a.dados)
    res = executar(df, carregar_urnas(a.saida))
    res["_R"] = R
    sinais = montar_sinais(res)
    sinais["teste_nome"] = sinais.teste.map(TX["PT"]["nome"])
    # planilhas
    dd = a.saida / "dados"
    arqs = {"sin": dd / "variacao_turnos_sinalizacoes.csv", "mun": dd / "variacao_turnos_municipios.csv", "uf": dd / "variacao_turnos_ufs.csv"}
    escrever_csv(arqs["sin"], sinais.to_dict("records"), COLS_CSV)
    cols_n = ["secoes"] + COLS_VOTOS + ["BN1", "BN2", "dL", "dF", "dComp", "observado", "esperado", "dif_pp", "q", "nivel"]
    escrever_csv(arqs["mun"], tabela_nivel(res["V2"], ["uf", "mun", "nm_mun"]), ["uf", "mun", "nm_mun"] + cols_n)
    escrever_csv(arqs["uf"], tabela_nivel(res["V1"], ["uf"]), ["uf"] + cols_n)
    hashes = {k: (p.name, sha512(p)) for k, p in arqs.items()}
    # dados do site
    site = {
        "versao": VERSAO, "data": DATA_EDICAO,
        "par": {"ALFA_FDR": ALFA_FDR, "MIN_SECOES_GRUPO": MIN_SECOES_GRUPO, "MIN_VOTOS_PROPORCAO": MIN_VOTOS_PROPORCAO,
                "LIMIAR_ANOMALIA_PP": LIMIAR_ANOMALIA_PP, "LIMIAR_INFO_PP": LIMIAR_INFO_PP, "MIN_UNIDADES_REF": MIN_UNIDADES_REF,
                "PHI_MIN": PHI_MIN, "MIN_APTOS": MIN_APTOS, "LIMIAR_DIRECIONAMENTO": LIMIAR_DIRECIONAMENTO, "MIN_VOTOS_VARIACAO": MIN_VOTOS_VARIACAO,
                "LIMIAR_TETO": LIMIAR_TETO, "LIMIAR_CADASTRO": LIMIAR_CADASTRO},
        "cols": COLS_VOTOS,
        "br": [res["_br"][c] for c in COLS_VOTOS],
        "testes": contagens(res),
        "uf": {r["uf"]: [int(r[c]) for c in COLS_VOTOS] + [int(r["secoes"]), r6(r["esperado"]), r6(r["dif_pp"]), r6(r["q"]), r["nivel"]]
               for _, r in res["V1"].iterrows()},
        "mun": {},
        # [teste, nivel, uf, mun, zona, secao, observado, esperado, dif_pp, q, detalhe, nr_urna,
        #  [L1, F1, O1, BN1, comp1, aptos1, L2, F2, BN2, comp2, aptos2]]
        "s": [[r.teste, "a" if r.nivel == "anomalia" else "i", r.uf, r.mun, (int(r.zona) if r.zona != "" else None),
               (int(r.secao) if r.secao != "" else None), r.observado, r.esperado, r.dif_pp, r.q, r.detalhe, r.nr_urna,
               [int(getattr(r, c)) for c in ("L1", "F1", "O1", "BN1", "comp1", "aptos1", "L2", "F2", "BN2", "comp2", "aptos2")]]
              for r in sinais.itertuples()],
    }
    for _, r in res["V2"].iterrows():
        site["mun"].setdefault(r["uf"], {})[r["mun"]] = [r6(r["esperado"]), r6(r["dif_pp"]), r6(r["q"]), r["nivel"] if r["analisada"] else "-"]
    (a.dados / "variacao.json").write_text(json.dumps(site, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    # adendo nos relatórios e manifesto
    man = a.saida / "manifesto_saida.sha512"
    bruto = man.read_bytes().decode("utf-8")
    nl_man = "\r\n" if "\r\n" in bruto else "\n"
    linhas = {ln.split("  ", 1)[1]: ln.split("  ", 1)[0] for ln in bruto.splitlines() if ln.strip()}
    for lang in ("PT", "EN", "ES"):
        p = a.saida / f"Relatorio_Tecnico_Auditoria_Eleicoes_2026_{lang}.md"
        bruto = p.read_bytes().decode("utf-8")
        nl = "\r\n" if "\r\n" in bruto else "\n"  # preserva as quebras de linha do original
        txt = bruto.replace("\r\n", "\n")
        txt = inserir(txt, NOTA_INI, NOTA_FIM, NOTA_INI + "\n" + TX[lang]["nota_topo"].format(data=DATA_EDICAO) + "\n" + NOTA_FIM, colocar_nota)
        autor = re.search(r"^\| (?:Autor|Author) \| (.+?) \|$", txt, re.M).group(1)  # nome como na Seção 2 do relatório
        txt = inserir(txt, MARCA_INI, MARCA_FIM, MARCA_INI + "\n" + adendo(lang, res, sinais, hashes, autor) + "\n" + MARCA_FIM, colocar_adendo)
        p.write_bytes(txt.replace("\n", nl).encode("utf-8"))
        linhas[p.name] = sha512(p)
    for p in arqs.values():
        linhas[f"dados/{p.name}"] = sha512(p)
    # mesma ordem do motor (caminhos comparados sem distinção de maiúsculas, como no Windows) e mesmas quebras de linha
    ordem = sorted(linhas.items(), key=lambda x: tuple(c.casefold() for c in x[0].split("/")))
    man.write_bytes("".join(f"{h}  {n}{nl_man}" for n, h in ordem).encode("utf-8"))
    c = contagens(res)
    for t in TESTES:
        print(f"{t} {TX['PT']['nome'][t]}: unidades={c[t]['unidades']} anomalias={c[t]['a']} informativos={c[t]['i']}")


if __name__ == "__main__":
    main()
