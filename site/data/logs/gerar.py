#!/usr/bin/env python3
"""Testes L01 a L14 (logs das urnas) no site, a partir do pacote de resultados do motor.

Uso: python3 gerar.py [turno] [pasta do pacote] [pasta de saída]   (padrão: 1 e as pastas do repositório)

Lê auditoria-eleicoes-2026-Brasil/resultados-<turno>turno/ (relatório PT e dados/resumo_testes.csv,
logs_sinalizacoes.csv, logs_secoes.csv.gz e logs_falhas.csv) e escreve em site/data/logs/t<turno>/:
  resumo.json  números de cada teste L, categorias, números gerais de L01, cobertura e textos dos testes
  <UF>.json    seções com sinalização em algum teste L: [mun, zona, seção, teste, nível, categoria, observado,
               referência, detalhe] (nível "a" = anomalia, "i" = informativo) e, em "sem_log", as seções sem log legível
e grava o resumo também em site/data/resumo.json, na chave "logs" (sem mudar as outras chaves).
Os textos dos testes e das categorias vêm do próprio motor (TESTES_LOG e CATEGORIAS_LOG, lidos sem executá-lo).
Nenhum número de título e nenhum arquivo .logjez ou logd.dat entram nos dados. Só biblioteca padrão.
"""
import ast
import csv
import gzip
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

turno = int(sys.argv[1]) if len(sys.argv) > 1 else 1
RAIZ = Path(__file__).resolve().parents[3]
AUD = RAIZ / "auditoria-eleicoes-2026-Brasil"
PAC = Path(sys.argv[2]) if len(sys.argv) > 2 else AUD / f"resultados-{turno}turno"
DADOS = PAC / "dados"
SAIDA = Path(sys.argv[3]) if len(sys.argv) > 3 else Path(__file__).resolve().parent / f"t{turno}"


def literal(nome):
    """Valor literal de uma constante do motor (dicionário de textos), sem importar o motor."""
    arv = ast.parse((AUD / "auditoria_eleicoes_2026.py").read_text(encoding="utf-8"))
    for no in arv.body:
        if isinstance(no, ast.Assign) and any(isinstance(a, ast.Name) and a.id == nome for a in no.targets):
            return ast.literal_eval(no.value)
    raise KeyError(nome)


def ler(nome):
    abrir = gzip.open if nome.endswith(".gz") else open
    with abrir(DADOS / nome, "rt", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


TESTES_LOG, CATEGORIAS_LOG, LEG_LOG = literal("TESTES_LOG"), literal("CATEGORIAS_LOG"), literal("LEG_LOG")
IDS = [f"L{i:02d}" for i in range(1, 15)]
rel = (PAC / "Relatorio_Tecnico_Auditoria_Eleicoes_2026_PT.md").read_text(encoding="utf-8")
campo = lambda rot: (re.search(r"\| " + rot + r" \| `?([^|`]+?)`? \|", rel) or [None, ""])[1].strip()

# números de cada teste: os do motor (resumo_testes.csv)
res = {r["teste"]: r for r in ler("resumo_testes.csv") if r["teste"] in IDS}
sin = ler("logs_sinalizacoes.csv")
cats = defaultdict(Counter)
por_uf = defaultdict(lambda: {"a": 0, "i": 0, "secoes": set()})
linhas = defaultdict(list)
num = lambda x: int(float(x)) if x not in ("", None) else None
for r in sin:
    if int(r["turno"]) != turno:
        continue
    nv = "a" if r["nivel"] == "anomalia" else "i"
    cats[r["teste"]][(r["categoria"], nv)] += 1
    u = por_uf[r["uf"]]
    u[nv] += 1
    u["secoes"].add((r["zona"], r["secao"]))
    linhas[r["uf"]].append([r["mun"], int(r["zona"]), int(r["secao"]), r["teste"], nv, r["categoria"],
                            r["observado"] or "", r["referencia"] or "", r["detalhe"] or ""])

# números gerais dos votos depois do horário oficial (L01) e cobertura, a partir das medidas por seção
sec = [r for r in ler("logs_secoes.csv.gz") if int(r["turno"]) == turno and not r["falha"]]
g = {"secoes": len(sec), "votos": 0, "secoes_apos": 0, "votos_apos": 0, "secoes_1h": 0, "votos_1h": 0, "sem_digital_apos": 0}
for r in sec:
    v, va, v1, sd = (num(r[k]) or 0 for k in ("n_votos", "v_apos", "v_apos_1h", "sd_apos"))
    g["votos"] += v
    g["votos_apos"] += va
    g["votos_1h"] += v1
    g["sem_digital_apos"] += sd
    g["secoes_apos"] += va > 0
    g["secoes_1h"] += v1 > 0
falhas = [r for r in ler("logs_falhas.csv") if int(r["turno"]) == turno]
versoes = Counter(r["versao"] for r in sec if r["versao"])

testes = {}
for t in IDS:
    r = res.get(t, {})
    testes[t] = {"unidades": num(r.get("unidades")), "a": num(r.get("sinalizacoes")), "i": num(r.get("informativos")),
                 "cats": [[c, nv, n] for (c, nv), n in sorted(cats[t].items(), key=lambda x: (-x[1], x[0]))]}
txt = {lg: {t: {**{k: TESTES_LOG[t][lg][k] for k in ("nome", "objetivo", "metodo", "criterio", "limites")}, "leg": LEG_LOG[lg][t]} for t in IDS}
       for lg in ("PT", "EN", "ES")}
usadas = {c for t in IDS for c, _, _ in testes[t]["cats"]}
resumo = {
    "turno": turno, "motor": campo("Versão do motor de análise"), "doc_id": campo("Identificador do documento"),
    "emissao": campo("Data de emissão"), "relatorio": f"auditoria-eleicoes-2026-Brasil/resultados-{turno}turno/Relatorio_Tecnico_Auditoria_Eleicoes_2026_{{lg}}.md",
    "cobertura": {"com_log": len(sec), "sem_log": len(falhas)}, "geral": g,
    "versao_ref": versoes.most_common(1)[0][0] if versoes else "",
    "testes": testes, "ufs": {u: {"a": v["a"], "i": v["i"], "secoes": len(v["secoes"])} for u, v in sorted(por_uf.items())},
    "txt": txt, "categorias": {c: CATEGORIAS_LOG.get(c, {"PT": c, "EN": c, "ES": c}) for c in sorted(usadas)},
}
SAIDA.mkdir(parents=True, exist_ok=True)
for velho in SAIDA.glob("*.json"):
    velho.unlink()
(SAIDA / "resumo.json").write_text(json.dumps(resumo, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
campos = ["mun", "zona", "secao", "teste", "nivel", "cat", "obs", "ref", "det"]
sem_log = defaultdict(list)
for r in falhas:
    sem_log[r["uf"]].append([int(r["zona"]), int(r["secao"])])
for uf in sorted(set(linhas) | set(sem_log)):
    ls = sorted(linhas.get(uf, []), key=lambda x: (x[1], x[2], x[3], x[4]))
    (SAIDA / f"{uf}.json").write_text(json.dumps({"campos": campos, "o": ls, "sem_log": sorted(sem_log.get(uf, []))}, ensure_ascii=False,
                                                 separators=(",", ":")), encoding="utf-8")
# resumo também no resumo.json do site (chave "logs"), só na saída padrão; os resultados dos outros testes não mudam
if len(sys.argv) <= 3:
    arq = SAIDA.parents[1] / "resumo.json"
    R = json.loads(arq.read_text(encoding="utf-8"))
    R.setdefault("logs", {})[str(turno)] = resumo
    arq.write_text(json.dumps(R, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
tot = sum(len(x) for x in linhas.values())
print(f"{turno}º turno: {len(sec):,} seções com log, {tot:,} sinalizações em {len(linhas)} UF(s) -> {SAIDA}".replace(",", "."))
