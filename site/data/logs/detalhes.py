#!/usr/bin/env python3
"""Testes L01 a L14 (logs das urnas): listas por teste e o que cada teste apurou em cada seção sinalizada.

Uso: python3 detalhes.py <pasta dos resumos dos logs> [turno] [pasta do pacote] [pasta de saída]
     pasta dos resumos: a mesma passada ao motor em --logs (t<turno>/<UF>.jsonl.gz, um resumo numérico por seção,
     gravado pela extração do motor: hora de cada voto, forma de liberação, eventos do dia e urnas; nenhum título)

Lê também, no pacote do motor (auditoria-eleicoes-2026-Brasil/resultados-<turno>turno/dados/), logs_sinalizacoes.csv
(as sinalizações) e logs_secoes.csv.gz (as medidas de cada seção). Escreve em site/data/logs/t<turno>/:
  teste/L01.json … L14.json   as seções sinalizadas no teste, com as medidas do motor em colunas próprias de cada teste
                               {"c": colunas, "l": [[uf, cod_mun, zona, seção, nível, categoria, medidas…]]}
  det/<UF>/<zona>.json        o que cada teste apurou em cada seção sinalizada da zona: urnas, marcos do dia e, por
                               teste, a hora dos votos (quando importa para o teste) ou os registros que o teste usou
Os horários são os do relógio da urna, em segundos desde 0h do dia da votação (hora local). O teste L01 usa a lista
voto a voto já publicada em site/data/votoshora (todas as seções do L01 estão lá). Só biblioteca padrão.
"""
import csv
import gzip
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

RESUMOS = Path(sys.argv[1])
turno = int(sys.argv[2]) if len(sys.argv) > 2 else 1
RAIZ = Path(__file__).resolve().parents[3]
PAC = Path(sys.argv[3]) if len(sys.argv) > 3 else RAIZ / "auditoria-eleicoes-2026-Brasil" / f"resultados-{turno}turno"
SAIDA = Path(sys.argv[4]) if len(sys.argv) > 4 else Path(__file__).resolve().parent / f"t{turno}"
DADOS = PAC / "dados"

# constantes do motor (auditoria_eleicoes_2026.py)
RAJADA_SEG, RAJADA_MIN = 30, 5
SEQ_SEM_DIGITAL = 10
SEM_DIGITAL = ("N", "S")
MAX_LISTA = 400            # votos ou registros por lista (o resto é contado, não listado)
HORA_FIM = {1: 17, 2: 19}  # fim oficial (Brasília) no L01; o encerramento é liberado às 17h de Brasília (L09)


def ler(nome):
    abrir = gzip.open if nome.endswith(".gz") else open
    with abrir(DADOS / nome, "rt", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def num(x, f=float):
    try:
        return f(x) if x not in ("", None, "nan") else None
    except ValueError:
        return None


def seg_hm(s):
    """"15:00" → segundos."""
    try:
        h, m = s.split(":")[:2]
        return int(h) * 3600 + int(m) * 60
    except (ValueError, AttributeError):
        return None


def depois_igual(txt):
    """"z = 7.2" → 7.2; "q = 2.4e-09" → 2.4e-09."""
    if not txt or "=" not in txt:
        return None
    return num(txt.split("=", 1)[1].strip())


def hora_bu(s):
    """"04/10/2026 17:01:22" → "17:01:22"."""
    return s[11:19] if s and len(s) >= 19 else ""


# --------------------------------------------------------------------------------------- colunas de cada teste
# (nome, função(medidas da seção, linha da sinalização) → valor)
I = lambda k: (lambda m, s: num(m.get(k), lambda x: int(float(x))))
F = lambda k, d=1: (lambda m, s: (lambda v: None if v is None else round(v, d))(num(m.get(k))))
P = lambda k: (lambda m, s: (lambda v: None if v is None else round(100 * v, 1))(num(m.get(k))))
Z = lambda campo: (lambda m, s: depois_igual(s[campo]) if s[campo].startswith("z") else depois_igual(s["detalhe"]) if s["detalhe"].startswith("z") else None)
Q = lambda m, s: next((depois_igual(s[c]) for c in ("detalhe", "referencia") if s[c].startswith("q")), None)
T = lambda k: (lambda m, s: m.get(k) or None)
taxa = lambda a, b: (lambda m, s: (lambda x, n: None if x is None or n is None or x + n == 0 else round(100 * x / (x + n), 2))(num(m.get(a)), num(m.get(b))))
COLS = {
    "L01": [("v_apos", I("v_apos")), ("v_apos_1h", I("v_apos_1h")), ("ult_apos_min", F("ult_apos_min", 0)), ("sd_apos", I("sd_apos")),
            ("n_votos", I("n_votos")), ("fim_local", T("fim_local")), ("z", Z("detalhe"))],
    "L02": [("rajada_max", I("rajada_max")), ("n_rajadas", I("n_rajadas")), ("int_mediano", F("int_mediano", 0)), ("n_votos", I("n_votos")),
            ("n_sem_digital", I("n_sem_digital")), ("z", Z("referencia"))],
    "L03": [("seq_sem_digital", I("seq_sem_digital")), ("n_sem_digital", I("n_sem_digital")), ("pct_digital", P("pct_digital")),
            ("n_votos", I("n_votos")), ("erro", lambda m, s: 1 if s["detalhe"] == "ERRO" else 0)],
    "L04": [("v_pos_sim", I("v_pos_sim")), ("v_pos_nao", I("v_pos_nao")), ("n_votos", I("n_votos"))],
    "L05": [("n_religamentos", I("n_religamentos")), ("n_bateria", I("n_bateria")), ("n_desligada", I("n_desligada")),
            ("v_urna_desligada", I("v_urna_desligada")), ("min_parada", lambda m, s: (lambda v: None if v is None else int(v) // 60)(num(m.get("seg_parada"))))],
    "L06": [("n_urnas_voto", I("n_urnas_voto")), ("v_sobreposto", I("v_sobreposto")), ("n_urnas", I("n_urnas")), ("n_votos", I("n_votos"))],
    "L07": [("n_tentativas", I("n_tentativas")), ("tentativas_seguidas", I("tentativas_seguidas")), ("taxa", taxa("n_tentativas", "n_votos")),
            ("n_votos", I("n_votos")), ("z", Z("referencia")), ("q", Q)],
    "L08": [("n_nao_concluidos", I("n_nao_concluidos")), ("taxa", taxa("n_nao_concluidos", "n_votos")), ("n_votos", I("n_votos")),
            ("z", Z("referencia")), ("q", Q)],
    "L09": [("n_enc_cedo", I("n_enc_cedo")), ("n_enc_depois", I("n_enc_depois")), ("liberado", lambda m, s: s["referencia"] if s["categoria"] == "encerramento_tentado_cedo" else (m.get("fim_local") or None)),
            ("encerramento", lambda m, s: hora_bu(s["encerramento"]) or None)],
    "L10": [("t_ligada", T("t_ligada")), ("t_zeresima", T("t_zeresima")), ("t_primeiro_voto", T("t_primeiro_voto")),
            ("abertura", lambda m, s: hora_bu(s["abertura"]) or None)],
    "L11": [("ajuste_durante", I("ajuste_durante")), ("ajuste_fora", I("ajuste_fora")), ("dif_relogio_min", F("dif_relogio_min", 0)),
            ("abertura", lambda m, s: hora_bu(s["abertura"]) or None), ("encerramento", lambda m, s: hora_bu(s["encerramento"]) or None)],
    "L12": [("versao", T("versao")), ("modelo", T("modelo")), ("n_urnas", I("n_urnas")), ("observado", lambda m, s: s["observado"] or None)],
    "L13": [("pct_sem_digital", P("pct_sem_digital")), ("pct_4_tentativas", P("pct_4_tentativas")), ("n_sem_digital", I("n_sem_digital")),
            ("n_votos", I("n_votos")), ("z", Z("referencia")), ("q", Q)],
    "L14": [("n_votos", I("n_votos")), ("comp_bu", I("comp_bu")), ("dif_bu", I("dif_bu"))],
}
# ordem da lista: anomalias primeiro e, dentro do nível, a medida principal do teste (maior primeiro)
PRINCIPAL = {"L01": "ult_apos_min", "L02": "rajada_max", "L03": "seq_sem_digital", "L04": "v_pos_nao", "L05": "v_urna_desligada", "L06": "v_sobreposto",
             "L07": "n_tentativas", "L08": "n_nao_concluidos", "L09": "n_enc_cedo", "L10": None, "L11": "ajuste_durante", "L12": None,
             "L13": "pct_sem_digital", "L14": "dif_bu"}
PRINCIPAL2 = {"L02": "int_mediano", "L05": "n_religamentos", "L06": "n_urnas_voto", "L09": "n_enc_depois", "L11": "dif_relogio_min", "L03": "seq_sem_digital"}

# --------------------------------------------------------------------------------------- leitura
sin = [r for r in ler("logs_sinalizacoes.csv") if int(r["turno"]) == turno and r["categoria"] != "log_ausente"]
med = {(r["uf"], int(r["zona"]), int(r["secao"])): r for r in ler("logs_secoes.csv.gz") if int(r["turno"]) == turno}
por_sec = defaultdict(list)
for r in sin:
    por_sec[(r["uf"], int(r["zona"]), int(r["secao"]))].append(r)

# listas por teste
listas = defaultdict(list)
for r in sin:
    k = (r["uf"], int(r["zona"]), int(r["secao"]))
    m = med.get(k, {})
    nv = "a" if r["nivel"] == "anomalia" else "i"
    listas[r["teste"]].append([r["uf"], r["mun"], k[1], k[2], nv, r["categoria"]] + [f(m, r) for _, f in COLS[r["teste"]]])
(SAIDA / "teste").mkdir(parents=True, exist_ok=True)
for velho in (SAIDA / "teste").glob("*.json"):
    velho.unlink()
for t, ls in sorted(listas.items()):
    nomes = [c for c, _ in COLS[t]]
    chaves = [x for x in (PRINCIPAL.get(t), PRINCIPAL2.get(t)) if x]
    idx = [6 + nomes.index(c) for c in chaves]
    ls.sort(key=lambda l: (l[4] != "a",) + tuple(-(l[i] if isinstance(l[i], (int, float)) else -1) for i in idx) + (l[0], l[2], l[3]))
    (SAIDA / "teste" / f"{t}.json").write_text(json.dumps({"c": ["uf", "cod_mun", "zona", "secao", "nivel", "cat"] + nomes, "l": ls},
                                                          ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(t, len(ls), "linhas")


# --------------------------------------------------------------------------------------- o que cada teste apurou na seção
# códigos curtos dos eventos do log (a página traduz)
EV = {"ligada": "l", "desligada": "d", "bateria": "b", "rede": "r", "suspensa": "s", "reinicio": "i", "ja_votou": "j", "nao_encontrado": "n",
      "impedido": "p", "enc_menu": "em", "enc_cedo": "ec", "enc_cancelado": "ex", "enc_abortado": "ea", "todos_sim": "ts", "todos_nao": "tn",
      "enc_confirmado": "ok", "bu_impresso": "bu", "zer": "z", "pronta": "pr", "suspenso_sem_voto": "sv", "erro": "er", "dh": "dh"}


def cod(c):
    """"enc_cedo:15:00" → "ec:15:00"."""
    k, _, h = c.partition(":")
    return EV.get(k, k) + (":" + h if h else "")


def evento(e):
    return [e[0], cod(e[1])] + ([e[2]] if len(e) > 2 and e[2] else [])


def detalhe(r, sinais, m):
    vt = r["vt"]
    n = len(vt)
    t, ac = [], 0
    for x in vt:
        ac += x
        t.append(ac)
    lib, vu, vf = r["vl"], r.get("vu", ""), r.get("vf", {})
    cab = r["vh"]                                  # segundos entre a liberação e o voto gravado (na cabine)
    ev = sorted(r["ev"], key=lambda e: e[0])
    sd = [c in SEM_DIGITAL for c in lib]
    fim = seg_hm(m.get("fim_local", "")) or 0
    primeiro = lambda c, u=None: next((e[0] for e in ev if e[1] == c and (u is None or e[2] == u)), None)
    ultimo = lambda c: next((e[0] for e in reversed(ev) if e[1] == c), None)
    s0 = sinais[0]
    testes = {s["teste"] for s in sinais}
    completo = bool(testes & {"L06", "L12"})
    # marcos do dia como o motor v3.1.1 conta (L10): 1ª zerésima da seção, de qualquer urna, e a ligação da urna que a
    # imprimiu (sem zerésima, a urna do 1º voto); não depende da ordem das urnas no log
    u1 = int(vu[0]) if (vu and n) else 0
    zer_e = next((e for e in ev if e[1] == "zer"), None)
    lig = primeiro("ligada", zer_e[2] if zer_e else u1)
    # urnas: [número, 1º registro do dia, último registro, votos, versão, modelo(, carga, município, zona e seção da carga)];
    # com uma urna só (e sem L06/L12), basta a versão e o modelo ("vm": o número é o do boletim, "nu")
    D = {"u": [list(x[:10] if completo else x[:6]) for x in r["u"]] if len(r["u"]) > 1 or completo else None,
         "vm": [r["u"][0][4], r["u"][0][5]] if r["u"] else ["", ""],
         "m": [lig if lig is not None else (r["u"][0][1] if r["u"] else None), zer_e[0] if zer_e else None, primeiro("pronta"), t[0] if n else None,
               t[-1] if n else None, ultimo("enc_confirmado"), primeiro("bu_impresso")],
         "fim": fim, "n": n, "sd": sum(sd), "nu": s0["nr_urna"]}
    if D["u"] is None:
        del D["u"]
    else:
        del D["vm"]
    if s0["secoes_agregadas"]:
        D["ag"] = s0["secoes_agregadas"]
    # votos em partes contíguas: [nº do 1º voto da parte − 1, segundos desde o voto anterior, [[hora, liberação, cabine, marcas(, urna)]]]
    def vc(i):
        x = [t[i], lib[i], cab[i], vf.get(str(i), 0)]
        return x + [int(vu[i])] if vu else x

    def partes(ix):
        out = []
        for i in ix:
            if out and out[-1][0] + len(out[-1][2]) == i:
                out[-1][2].append(vc(i))
            else:
                out.append([i, t[i] - t[i - 1] if i else None, [vc(i)]])
        return out

    def corte(ix, a, b):
        """as primeiras a e as últimas b posições de uma lista de índices."""
        return ix if len(ix) <= a + b else ix[:a] + ix[-b:]
    if "L02" in testes:
        runs, ini_r = [], None
        for i in range(1, n):
            mesma = (vu[i] == vu[i - 1]) if vu else True
            if mesma and t[i] - t[i - 1] <= RAJADA_SEG and sd[i] and sd[i - 1]:
                if ini_r is None:
                    ini_r = i - 1
            else:
                if ini_r is not None and i - ini_r >= RAJADA_MIN:
                    runs.append([ini_r + 1, i])
                ini_r = None
        if ini_r is not None and n - ini_r >= RAJADA_MIN:
            runs.append([ini_r + 1, n])
        ints = [t[i] - t[i - 1] for i in range(1, n) if not vu or vu[i] == vu[i - 1]]
        bins = [0, 0, 0, 0, 0, 0]
        for x in ints:
            bins[0 if x <= 30 else 1 if x <= 60 else 2 if x <= 120 else 3 if x <= 300 else 4 if x <= 900 else 5] += 1
        D["L02"] = {"raj": runs, "hist": bins, "v": partes(list(range(n)))}
    if "L03" in testes:
        best, fim_s, run = 0, -1, 0
        for i, x in enumerate(sd):
            run = run + 1 if x else 0
            if run > best:
                best, fim_s = run, i
        a = fim_s - best + 1
        ix = list(range(max(0, a - 3), min(n, fim_s + 4)))
        erros = [e[0] for e in ev if e[1] == "erro" and best and t[a] - 600 <= e[0] <= t[fim_s]]
        D["L03"] = {"seq": [a + 1, fim_s + 1], "v": partes(corte(ix, 63, 23)), "erro": erros[:50],
                    "lib": [sum(1 for c in lib if c not in SEM_DIGITAL), lib.count("N"), lib.count("S")]}
    if "L04" in testes:
        cods = ("todos_sim", "todos_nao", "enc_menu", "enc_cancelado", "enc_abortado", "enc_confirmado")
        evs = [e for e in ev if e[1] in cods]
        t1 = next((e[0] for e in evs if e[1] in ("todos_sim", "todos_nao")), None)
        ix = [i for i in range(n) if t1 is not None and t[i] >= t1]
        D["L04"] = {"ev": [evento(e[:2]) for e in evs][:MAX_LISTA], "v": partes(corte(ix, 200, 50))}
    if "L05" in testes:
        cods = ("ligada", "desligada", "bateria", "rede", "suspensa", "reinicio")
        evs = [evento(e) for e in ev if e[1] in cods]
        ix = set()
        for e in ev:
            if e[1] != "desligada":
                continue
            prox = next((x[0] for x in ev if x[1] == "ligada" and x[2] == e[2] and x[0] > e[0]), None)
            if prox is not None:
                ix |= {i for i in range(n) if e[0] < t[i] < prox and (not vu or int(vu[i]) == e[2])}
        D["L05"] = {"ev": evs[:MAX_LISTA], "vd": partes(corte(sorted(ix), 150, 50))}
        if len(evs) > MAX_LISTA:
            D["L05"]["corte"] = len(evs) - MAX_LISTA
    if testes & {"L06", "L12", "L14"} or len(r["u"]) > 1:
        uv = {}
        for i in range(n):
            u = int(vu[i]) if vu else 0
            x = uv.setdefault(u, [t[i], t[i], 0])
            x[1] = t[i]
            x[2] += 1
        D["uv"] = [uv.get(k, [None, None, 0]) for k in range(len(r["u"]))]
    if "L06" in testes:
        sob = []
        if vu:
            prim, ult = {}, {}
            for i in range(n):
                prim.setdefault(vu[i], t[i])
                ult[vu[i]] = t[i]
            # urna anterior = a que recebeu o último voto mais cedo; a nova é a que continuou (como o motor v3.1.1)
            sob = [i for i in range(n) if any(ult[u2] > ult[vu[i]] and t[i] > prim[u2] for u2 in prim)]
        D["L06"] = {"sob": partes(corte(sob, 200, 50)), "nsob": len(sob)}
    if "L07" in testes:
        cods = ("ja_votou", "nao_encontrado", "impedido")
        evs = [e for e in ev if e[1] in cods]
        # maior sequência sem voto entre as tentativas, com o mesmo resultado (como o motor conta)
        sq, best, ant_c, iv, ini_s, melhor = 0, 0, None, 0, None, None
        for e in evs:
            while iv < n and t[iv] <= e[0]:
                iv += 1
                ant_c, sq = None, 0
            if e[1] == ant_c:
                sq += 1
            else:
                sq, ini_s = 1, e[0]
            ant_c = e[1]
            if sq > best:
                best, melhor = sq, [ini_s, e[0], cod(e[1]), sq]
        c = Counter(e[1] for e in evs)
        D["L07"] = {"ev": [evento(e[:2]) for e in evs][:MAX_LISTA], "cont": [c["ja_votou"], c["nao_encontrado"], c["impedido"]], "seq": melhor}
    if "L08" in testes:
        evs = [[e[0], "sv"] for e in ev if e[1] == "suspenso_sem_voto"] + [[t[int(i)], "pa"] for i, f in vf.items() if f & 4]
        D["L08"] = {"ev": sorted(evs)[:MAX_LISTA]}
    if "L09" in testes:
        cods = ("enc_menu", "enc_cedo", "enc_cancelado", "enc_abortado", "todos_sim", "todos_nao", "enc_confirmado", "bu_impresso")
        D["L09"] = {"ev": [evento(e[:2]) for e in ev if e[1].split(":")[0] in cods][:MAX_LISTA]}
    if "L10" in testes:
        D["L10"] = {"ev": [evento(e) for e in ev if e[1] in ("ligada", "zer", "pronta")][:60], "ab": hora_bu(s0["abertura"])}
    if "L11" in testes:
        D["L11"] = {"dh": [e[0] for e in ev if e[1] == "dh"][:MAX_LISTA], "volta": [[x[0], x[1]] for x in r.get("volta", [])][:MAX_LISTA],
                    "ab": hora_bu(s0["abertura"]), "en": hora_bu(s0["encerramento"])}
    if "L12" in testes:
        D["L12"] = {"carga": s0["cod_carga"]}
    if "L13" in testes:
        c = Counter(lib)
        D["L13"] = {"lib": [c[str(k)] for k in range(1, 10)] + [c["N"], c["S"], c["?"]], "mes": sum(1 for f in vf.values() if f & 16), "cpf": r["vd"].count("C")}
    if "L14" in testes:
        D["L14"] = {"comp": num(s0["comparecimento"], int)}
    return D


por_zona = defaultdict(dict)
pend = defaultdict(dict)
for k in por_sec:
    pend[k[0]][k] = por_sec[k]
for uf in sorted(pend):
    arq = RESUMOS / f"t{turno}" / f"{uf}.jsonl.gz"
    achou = 0
    with gzip.open(arq, "rt", encoding="utf-8") as f:
        for ln in f:
            try:
                r = json.loads(ln)
            except json.JSONDecodeError:
                continue
            k = (r["k"][1], int(r["k"][3]), int(r["k"][4]))
            if k not in pend[uf] or r.get("falha"):
                continue
            por_zona[(uf, k[1])][str(k[2])] = detalhe(r, pend[uf][k], med.get(k, {}))
            achou += 1
    print(uf, achou, "de", len(pend[uf]), "seções")
det = SAIDA / "det"
for velho in det.glob("*/*.json"):
    velho.unlink()
for (uf, z), ss in sorted(por_zona.items()):
    (det / uf).mkdir(parents=True, exist_ok=True)
    (det / uf / f"{z}.json").write_text(json.dumps({"s": ss}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("det:", sum(len(x) for x in por_zona.values()), "seções em", len(por_zona), "zonas")
