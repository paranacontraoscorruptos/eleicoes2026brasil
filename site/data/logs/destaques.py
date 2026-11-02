"""Apontamentos em destaque dos testes L (logs das urnas), por turno: a subpágina "Apontamentos em destaque" da página Logs das urnas.

Lê as listas de cada teste (site/data/logs/t<turno>/teste/Lxx.json, geradas por detalhes.py) e separa os apontamentos que mais
merecem conferência, em dois grupos:
  prioridade alta (a)  o log da urna não bate com o boletim de urna (L14, L12)
  prioridade média (m) eventos raros que pedem conferência com a ata da mesa (L11, L07, L05 com voto na urna desligada,
                       L06 com voto na urna anterior depois da troca)
Grava site/data/logs/t<turno>/destaques.json:
  g[]  um grupo por apontamento: k (chave), teste, p (a ou m), c (colunas do teste), l (seções, na ordem da página), n, x (números do texto)
Rodar depois de gerar.py e detalhes.py:  python3 site/data/logs/destaques.py [turno]   (padrão: 1)
Só números tirados das listas do site; nenhum número de título e nenhum .logjez ou logd.dat.
"""
import json
import sys
from pathlib import Path

TURNO = int(sys.argv[1]) if len(sys.argv) > 1 else 1
PASTA = Path(__file__).resolve().parent / f"t{TURNO}"


def col(c, nome):
    return c.index(nome)


def razao(l, c):
    return (l[col(c, "n_tentativas")] or 0) / max(1, l[col(c, "n_votos")] or 0)


# chave, teste, prioridade, filtro da linha, ordem (chave de ordenação; None = ordem da lista do teste)
GRUPOS = [
    ("log_bu", "L14", "a", lambda l, c: l[4] == "a", lambda l, c: l[col(c, "dif_bu")]),
    ("carga", "L12", "a", lambda l, c: l[4] == "a", None),
    ("relogio", "L11", "m", lambda l, c: l[4] == "a", lambda l, c: -(l[col(c, "ajuste_durante")] or 0)),
    ("tentativas", "L07", "m", lambda l, c: l[4] == "a", lambda l, c: -razao(l, c)),
    ("desligada", "L05", "m", lambda l, c: l[4] == "a" and (l[col(c, "v_urna_desligada")] or 0) > 0,
     lambda l, c: -(l[col(c, "v_urna_desligada")] or 0)),
    ("troca", "L06", "m", lambda l, c: l[4] == "a", lambda l, c: -(l[col(c, "v_sobreposto")] or 0)),
]


def main():
    saida = []
    for k, teste, p, filtro, ordem in GRUPOS:
        D = json.loads((PASTA / "teste" / f"{teste}.json").read_text(encoding="utf-8"))
        c, ls = D["c"], [l for l in D["l"] if filtro(l, D["c"])]
        if ordem:
            ls.sort(key=lambda l: ordem(l, c))
        x = {}
        if teste == "L14":
            x["votos_a_menos"] = -sum(min(0, l[col(c, "dif_bu")]) for l in ls)
        if teste == "L07":
            x["uma_por_voto"] = sum(1 for l in ls if razao(l, c) >= 0.8)
        if teste == "L05":
            x["votos"] = sum(l[col(c, "v_urna_desligada")] for l in ls)
        if teste == "L06":
            x["votos"] = sum(l[col(c, "v_sobreposto")] for l in ls)
        if teste == "L11":
            x["exterior"] = sum(1 for l in ls if l[0] == "ZZ")
        saida.append({"k": k, "teste": teste, "p": p, "c": c, "l": ls, "n": len(ls), "x": x})
        print(f"{k:11s} {teste} {p}: {len(ls)} seções {x}")
    (PASTA / "destaques.json").write_text(json.dumps({"turno": TURNO, "g": saida}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


if __name__ == "__main__":
    main()
