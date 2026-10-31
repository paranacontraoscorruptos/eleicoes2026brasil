#!/usr/bin/env python3
"""Gera os arquivos das páginas de anomalia do site (uma página por anomalia grave).

Uso: python3 gerar.py [pasta site/data]

encerramento_tardio.json: seções que encerraram 1 hora ou mais depois do horário oficial
(complementar/encerramento_tardio.csv), com os votos gravados depois do horário pelo log da urna
(complementar/votos_apos_horario_secoes.csv) e, em "r", a votação dessas seções no dia todo, por turno
(boletim de urna, arquivos secoes/). Só biblioteca padrão; não baixa nada.
"""
import csv
import json
import os
import sys

base = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
comp = os.path.join(base, "complementar")

vh = {}
with open(os.path.join(comp, "votos_apos_horario_secoes.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        vh[(r["turno"], r["uf"], int(r["zona"]), int(r["secao"]))] = (int(r["votos_apos_fim"]), int(r["votos_dia_log"]), r["ultimo_voto"] or None)

# horas como número HHMMSS (igual aos arquivos de seção do site), para o arquivo ficar menor
def hms(h):
    return int(h.replace(":", "")) if h else None


# fuso do município em relação ao UTC (None no Exterior, onde vale a hora local)
def fuso(f):
    return int(f.replace("UTC", "")) if f.startswith("UTC") else None


linhas = []
with open(os.path.join(comp, "encerramento_tardio.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        z, s = int(r["zona"]), int(r["secao"])
        v = vh.get((r["turno"], r["uf"], z, s), (None, None, None))
        linhas.append([int(r["turno"]), r["uf"], r["cod_mun"], z, s, hms(r["abertura"]), hms(r["encerramento"]),
                       int(r["fim_oficial_local"][:2]), fuso(r["fuso"]), int(r["minutos_apos_fim"]), v[0], v[1], hms(v[2])])
linhas.sort(key=lambda x: (-x[9], x[0], x[1], x[3], x[4]))

# votação dessas seções no dia todo (boletim de urna), por turno: comparecimento, válidos, brancos, nulos e votos de cada número
ordem = json.load(open(os.path.join(base, "resumo.json"), encoding="utf-8"))["ordem_votos"]
zonas, res = {}, {}
for x in linhas:
    t, uf, z, s = x[0], x[1], x[3], x[4]
    if (uf, z) not in zonas:
        with open(os.path.join(base, "secoes", uf, f"{z}.json"), encoding="utf-8") as f:
            zonas[(uf, z)] = json.load(f)["s"]
    tv = zonas[(uf, z)][str(s)][t]
    r = res.setdefault(str(t), {"secoes": 0, "comparecimento": 0, "validos": 0, "brancos": 0, "nulos": 0, "votos": {nr: 0 for nr in ordem[str(t)]}})
    r["secoes"] += 1
    r["comparecimento"] += tv[1]
    for nr, v in zip(ordem[str(t)], tv[5]):
        r["votos"][nr] += v or 0
for r in res.values():
    r["brancos"], r["nulos"] = r["votos"].get("95", 0), r["votos"].get("96", 0)
    r["validos"] = sum(v for nr, v in r["votos"].items() if nr not in ("95", "96"))

out = {"c": ["turno", "uf", "cod_mun", "zona", "secao", "abertura_hhmmss", "encerramento_hhmmss", "fim_oficial_hora_local", "fuso_utc",
             "atraso_min", "votos_apos", "votos_dia", "ultimo_voto_hhmmss"],
       "fonte": ["complementar/encerramento_tardio.csv", "complementar/votos_apos_horario_secoes.csv", "secoes/<uf>/<zona>.json"],
       "r": res, "l": linhas}
dest = os.path.join(base, "anomalias", "encerramento_tardio.json")
with open(dest, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(dest, len(linhas), "linhas", sum(1 for x in linhas if x[10] is not None), "com log")
