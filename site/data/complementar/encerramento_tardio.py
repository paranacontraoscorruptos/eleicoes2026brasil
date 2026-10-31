#!/usr/bin/env python3
"""Análise complementar: encerramento da urna muito depois do horário oficial (1º e 2º turno).

Prévia publicada no site antes de a verificação entrar no motor (auditoria_eleicoes_2026.py, teste T11).
Usa somente os dados públicos do site (site/data/secoes/<UF>/<zona>.json) e as mesmas regras de horário do T11:

- abertura e encerramento estão em hora local;
- o fuso de cada município é inferido, entre os fusos possíveis da UF (FUSOS_UF, diferença para Brasília),
  pelo 10º percentil das aberturas do município no turno (uma abertura regular nunca é antes das 8h);
- horário oficial de encerramento (hora de Brasília): 17h no 1º turno e 19h no 2º turno (encerramento estendido para as
  19h no 2º turno), convertido para a hora local; no Exterior (ZZ), as mesmas horas em hora local;
- entram as seções com abertura, encerramento e comparecimento > 0.

Sinal (anomalia, categoria "encerramento_tardio"): encerramento >= horário oficial local + ATRASO_ENCERRAMENTO_MIN.

Uso:  python3 encerramento_tardio.py [pasta site/data]   ->  encerramento_tardio.csv e encerramento_tardio.json
"""
import csv
import json
import sys
from pathlib import Path

import pandas as pd

HORA_INICIO_OFICIAL = 8          # hora de Brasília (igual ao motor)
HORA_FIM_OFICIAL = {1: 17, 2: 19}  # hora de Brasília: 1º turno 17h; 2º turno 19h (encerramento estendido)
FUSOS_UF = {"AC": (-2,), "AM": (-2, -1), "RO": (-1,), "RR": (-1,), "MT": (-1,), "MS": (-1,), "PE": (0, 1), "ZZ": (0,)}
ATRASO_ENCERRAMENTO_MIN = 60     # minutos depois do horário oficial local


def hora(h):
    """HHMMSS (inteiro) -> horas decimais."""
    if not h:
        return None
    s = str(int(h)).zfill(6)
    return int(s[:2]) + int(s[2:4]) / 60 + int(s[4:6]) / 3600


def hms(h):
    s = str(int(h)).zfill(6)
    return f"{s[:2]}:{s[2:4]}:{s[4:6]}"


def main():
    base = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[1])
    linhas = []
    for arq in sorted((base / "secoes").glob("*/*.json")):
        uf, zona = arq.parent.name, int(arq.stem)
        Z = json.loads(arq.read_text(encoding="utf-8"))
        for secao, rec in Z["s"].items():
            cod, nome = Z["mun"][rec[0]]
            for turno in (1, 2):
                tv = rec[turno] if len(rec) > turno else None
                if not tv or not tv[1] or not tv[2] or not tv[3]:
                    continue
                linhas.append((turno, uf, cod, nome, zona, int(secao), tv[2], tv[3]))
    s = pd.DataFrame(linhas, columns=["turno", "uf", "cod_mun", "municipio", "zona", "secao", "ab", "enc"])
    s["h_ab"] = s["ab"].map(hora)
    s["h_enc"] = s["enc"].map(hora)
    # fuso local do município (mesma regra do T11)
    q = s.groupby(["turno", "uf", "cod_mun"])["h_ab"].transform(lambda v: v.quantile(0.10))
    s["offset"] = [min(FUSOS_UF.get(u, (0,)), key=lambda o: abs(h - HORA_INICIO_OFICIAL - o)) for u, h in zip(s["uf"], q)]
    s["fim_local"] = s["turno"].map(HORA_FIM_OFICIAL) + s["offset"]
    s["min_apos"] = ((s["h_enc"] - s["fim_local"]) * 60).round().astype(int)
    s["enc_brasilia"] = s["h_enc"] - s["offset"]
    sinal = s[s["min_apos"] >= ATRASO_ENCERRAMENTO_MIN].sort_values(["turno", "min_apos", "uf", "zona", "secao"], ascending=[True, False, True, True, True])

    out = Path(__file__).resolve().parent
    with open(out / "encerramento_tardio.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["turno", "uf", "cod_mun", "municipio", "zona", "secao", "abertura", "encerramento", "fuso", "fim_oficial_local", "minutos_apos_fim"])
        for r in sinal.itertuples():
            fuso = "hora local" if r.uf == "ZZ" else f"UTC{r.offset - 3:+d}"
            w.writerow([r.turno, r.uf, r.cod_mun, r.municipio, r.zona, r.secao, hms(r.ab), hms(r.enc), fuso, f"{int(r.fim_local):02d}:00", r.min_apos])

    resumo = {"criterio": {"hora_fim_oficial_brasilia": {str(k): v for k, v in HORA_FIM_OFICIAL.items()}, "atraso_min": ATRASO_ENCERRAMENTO_MIN, "fusos_uf": FUSOS_UF}, "turnos": {}}
    for t in (1, 2):
        st, sg = s[s["turno"] == t], sinal[sinal["turno"] == t]
        br = st[st["uf"] != "ZZ"]["enc_brasilia"]
        faixas = {f">={m}min": int((st["min_apos"] >= m).sum()) for m in (60, 120, 180, 240, 300, 360)}
        resumo["turnos"][str(t)] = {
            "secoes_analisadas": int(len(st)), "sinalizadas": int(len(sg)), "pct": round(len(sg) / max(1, len(st)), 6), "faixas": faixas,
            "encerramento_brasilia": {"mediana": round(float(br.median()), 4), "p10": round(float(br.quantile(.1)), 4), "p90": round(float(br.quantile(.9)), 4),
                                      "entre_17h_e_17h30": round(float(((br >= 17) & (br < 17.5)).mean()), 4), "a_partir_19h": round(float((br >= 19).mean()), 4)},
            "por_uf": {u: int(n) for u, n in sg["uf"].value_counts().sort_index().items()},
        }
    (out / "encerramento_tardio.json").write_text(json.dumps(resumo, ensure_ascii=False, indent=1), encoding="utf-8")
    for t in ("1", "2"):
        r = resumo["turnos"][t]
        print(f"{t}º turno: {r['sinalizadas']} de {r['secoes_analisadas']} seções ({100 * r['pct']:.2f}%) · faixas {r['faixas']} · encerramento (Brasília) {r['encerramento_brasilia']}")


if __name__ == "__main__":
    main()
