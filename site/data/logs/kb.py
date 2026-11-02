#!/usr/bin/env python3
"""Atualiza as respostas do Atlas (kb_pt/en/es.json) sobre os testes L01 a L14 com os resultados de cada turno publicado.

Uso: python3 kb.py   (depois de gerar.py; lê site/data/resumo.json → logs["1"] e logs["2"])

Reescreve as respostas t_L01 … t_L14 e logs_testes com os textos do motor e os números de cada turno (seções, não votos).
Com os dois turnos publicados, a auditoria completa (35 testes) está concluída: as respostas sobre, testes_lista,
auditoria_35, deterministicos e downloads passam a dizer isso (e que os downloads estão liberados).
Só biblioteca padrão.
"""
import json
from pathlib import Path

D = Path(__file__).resolve().parents[1]
LOGS = json.loads((D / "resumo.json").read_text(encoding="utf-8"))["logs"]
TURNOS = [t for t in ("1", "2") if t in LOGS]
G = LOGS[TURNOS[0]]
DOIS = TURNOS == ["1", "2"]
IDS = [f"L{i:02d}" for i in range(1, 15)]
fmt = lambda n, lg: f"{n:,}".replace(",", "." if lg != "en" else ",")

T = {
    "pt": {"bloco": "Logs das urnas", "sit": "concluídos nos dois turnos" if DOIS else "1º turno concluído; 2º turno em andamento",
           "turno": {"1": "1º turno", "2": "2º turno"},
           "un": lambda n: "seção" if n == 1 else "seções", "nota": "Os números são de seções (urnas), não de votos: 🔴 seções com anomalia estatística · 🟡 seções com informativo.",
           "res": lambda tn, a, i, u, un: f"**Resultado no {tn}.** 🔴 {a} {un[0]} com anomalia estatística e 🟡 {i} {un[1]} com informativo, de {u} seções com log lido.",
           "res_nota": "Os números são de seções (urnas), não de votos.",
           "oque": "O que verifica", "como": "Como é calculado", "crit": "Critério", "lim": "Limitações", "achado": lambda tn: f"O que foi encontrado no {tn}",
           "ressalva": "Anomalia estatística não é prova de fraude, erro ou irregularidade: indica prioridade de verificação documental (ata da mesa, boletim impresso e registros da urna).",
           "ver": "A lista das seções de cada teste está na página **Logs das urnas** (escolha o turno no alto): clique em uma seção para ver o que o teste apurou naquela urna e, nos testes em que importa, a hora de cada voto. A página de cada seção mostra os testes L dela.",
           "s": "Auditoria completa (logs das urnas)",
           "intro": ("São **14 testes** que leem o log de cada urna (hora de cada voto e de cada evento). **Concluídos nos dois turnos**, com resultados publicados." if DOIS else
                     "São **14 testes** que leem o log de cada urna (hora de cada voto e de cada evento). **1º turno concluído**, com resultados publicados; o 2º turno está em andamento."),
           "fim": "O log não mostra em quem foi o voto nem o nome do eleitor, e nenhum número de título é publicado.",
           "subs": [("(1º turno concluído; 2º turno em andamento)", "(concluídos nos dois turnos)"),
                    ("**Logs das urnas (L01 a L14) · 1º turno concluído; 2º turno em andamento**", "**Logs das urnas (L01 a L14) · concluídos nos dois turnos**"),
                    ("Nos logs das urnas (em andamento),", "Nos logs das urnas,")],
           "aud35": "A auditoria completa tem **35 testes**, todos concluídos nos dois turnos:\n\n"
                    "- **15 testes dos boletins de urna** (T01 a T15);\n- **6 testes da variação entre os turnos** (V1 a V6);\n"
                    "- **14 testes dos logs das urnas** (L01 a L14), que usam a hora de cada voto e de cada evento.\n\n"
                    "Os resultados dos dois turnos estão publicados no site, e relatórios, dados e o motor estão liberados para download na página **Downloads**.",
           "dl": "Na página **Downloads** estão todos os arquivos dos dois turnos (relatórios PT/EN/ES, CSV, JSON, gráficos, log e manifesto) e o código-fonte, "
                 "cada um com tamanho e SHA-512. Há também o botão **Baixar tudo (.zip)**. Os downloads estão liberados: a auditoria completa (35 testes) terminou nos dois turnos."},
    "en": {"bloco": "Voting machine logs", "sit": "completed for both rounds" if DOIS else "round 1 completed; round 2 in progress",
           "turno": {"1": "round 1", "2": "round 2"},
           "un": lambda n: "section" if n == 1 else "sections", "nota": "The numbers are sections (polling stations), not votes: 🔴 sections with a statistical anomaly · 🟡 sections with an informational flag.",
           "res": lambda tn, a, i, u, un: f"**Result in {tn}.** 🔴 {a} {un[0]} with a statistical anomaly and 🟡 {i} {un[1]} with an informational flag, out of {u} sections with a readable log.",
           "res_nota": "The numbers are sections (polling stations), not votes.",
           "oque": "What it checks", "como": "How it is calculated", "crit": "Criterion", "lim": "Limitations", "achado": lambda tn: f"What was found in {tn}",
           "ressalva": "A statistical anomaly is not proof of fraud, error or irregularity: it sets a priority for documentary checking (polling station minutes, printed tally sheet and machine records).",
           "ver": "The list of sections for each test is on the **Voting machine logs** page (choose the round at the top): click a section to see what the test found on that machine and, in the tests where it matters, the time of each vote. Each section's page shows its L tests.",
           "s": "Full audit (voting machine logs)",
           "intro": ("These are **14 tests** that read each machine's log (time of each vote and each event). **Completed for both rounds**, with results published." if DOIS else
                     "These are **14 tests** that read each machine's log (time of each vote and each event). **Round 1 is completed**, with results published; round 2 is in progress."),
           "fim": "The log does not show who the vote went to nor the voter's name, and no voter ID number is published.",
           "subs": [("(round 1 completed; round 2 in progress)", "(completed for both rounds)"),
                    ("**Voting machine logs (L01 to L14) · round 1 completed; round 2 in progress**", "**Voting machine logs (L01 to L14) · completed for both rounds**"),
                    ("In the machine logs (in progress),", "In the machine logs,")],
           "aud35": "The full audit has **35 tests**, all completed for both rounds:\n\n"
                    "- **15 tally-sheet tests** (T01 to T15);\n- **6 tests on the change between rounds** (V1 to V6);\n"
                    "- **14 voting machine log tests** (L01 to L14), which use the time of each vote and each event.\n\n"
                    "The results for both rounds are published on the site, and reports, data and the engine are available for download on the **Downloads** page.",
           "dl": "The **Downloads** page has every file from both rounds (PT/EN/ES reports, CSV, JSON, charts, log and manifest) and the source code, each with "
                 "size and SHA-512. There is also a **Download everything (.zip)** button. Downloads are available: the full audit (35 tests) is finished for both rounds."},
    "es": {"bloco": "Logs de las urnas", "sit": "concluidas en las dos vueltas" if DOIS else "1.ª vuelta concluida; 2.ª vuelta en curso",
           "turno": {"1": "1.ª vuelta", "2": "2.ª vuelta"},
           "un": lambda n: "sección" if n == 1 else "secciones", "nota": "Los números son de secciones (urnas), no de votos: 🔴 secciones con anomalía estadística · 🟡 secciones con informativo.",
           "res": lambda tn, a, i, u, un: f"**Resultado en la {tn}.** 🔴 {a} {un[0]} con anomalía estadística y 🟡 {i} {un[1]} con informativo, de {u} secciones con log leído.",
           "res_nota": "Los números son de secciones (urnas), no de votos.",
           "oque": "Qué verifica", "como": "Cómo se calcula", "crit": "Criterio", "lim": "Limitaciones", "achado": lambda tn: f"Qué se encontró en la {tn}",
           "ressalva": "La anomalía estadística no es prueba de fraude, error o irregularidad: indica prioridad de verificación documental (acta de la mesa, boletín impreso y registros de la urna).",
           "ver": "La lista de secciones de cada prueba está en la página **Logs de las urnas** (elija la vuelta arriba): haga clic en una sección para ver qué encontró la prueba en esa urna y, en las pruebas en que importa, la hora de cada voto. La página de cada sección muestra sus pruebas L.",
           "s": "Auditoría completa (logs de las urnas)",
           "intro": ("Son **14 pruebas** que leen el log de cada urna (hora de cada voto y de cada evento). **Concluidas en las dos vueltas**, con resultados publicados." if DOIS else
                     "Son **14 pruebas** que leen el log de cada urna (hora de cada voto y de cada evento). **1.ª vuelta concluida**, con resultados publicados; la 2.ª vuelta está en curso."),
           "fim": "El log no muestra por quién fue el voto ni el nombre del elector, y no se publica ningún número de título.",
           "subs": [("(1.ª vuelta concluida; 2.ª vuelta en curso)", "(concluidas en las dos vueltas)"),
                    ("**Logs de las urnas (L01 a L14) · 1.ª vuelta concluida; 2.ª vuelta en curso**", "**Logs de las urnas (L01 a L14) · concluidas en las dos vueltas**"),
                    ("En los logs de las urnas (en curso),", "En los logs de las urnas,")],
           "aud35": "La auditoría completa tiene **35 pruebas**, todas concluidas en las dos vueltas:\n\n"
                    "- **15 pruebas de los boletines de urna** (T01 a T15);\n- **6 pruebas de la variación entre las vueltas** (V1 a V6);\n"
                    "- **14 pruebas de los logs de las urnas** (L01 a L14), que usan la hora de cada voto y de cada evento.\n\n"
                    "Los resultados de las dos vueltas están publicados en el sitio, y los informes, los datos y el motor están disponibles para descarga en la página **Descargas**.",
           "dl": "En la página **Descargas** están todos los archivos de las dos vueltas (informes PT/EN/ES, CSV, JSON, gráficos, log y manifiesto) y el código fuente, "
                 "cada uno con tamaño y SHA-512. También está el botón **Descargar todo (.zip)**. Las descargas están disponibles: la auditoría completa (35 pruebas) terminó en las dos vueltas."},
}

for lg, X in T.items():
    arq = D / f"kb_{lg}.json"
    kb = json.loads(arq.read_text(encoding="utf-8"))
    txt, cat = G["txt"][lg.upper()], {c: v[lg.upper()] for c, v in G["categorias"].items()}
    tn = lambda t: X["turno"][t]
    for it in kb:
        if DOIS and it["i"] in ("sobre", "testes_lista", "deterministicos"):
            for a, b in X["subs"]:
                it["a"] = it["a"].replace(a, b)
        elif DOIS and it["i"] == "auditoria_35":
            it["a"] = X["aud35"]
        elif DOIS and it["i"] == "downloads":
            it["a"] = X["dl"]
        elif it["i"] == "logs_testes":
            # números de seções (urnas), não de votos: a unidade vai ao lado de cada número
            blocos = []
            for t in TURNOS:
                g = LOGS[t]
                linhas = [f"- **{x}** — {txt[x]['nome']}: 🔴 {fmt(g['testes'][x]['a'], lg)} {X['un'](g['testes'][x]['a'])} · 🟡 {fmt(g['testes'][x]['i'], lg)} {X['un'](g['testes'][x]['i'])}" for x in IDS]
                blocos.append(f"**{tn(t)[0].upper() + tn(t)[1:]}**\n" + "\n".join(linhas))
            it["a"] = "\n\n".join([X["intro"], X["nota"]] + blocos + [X["ver"], X["fim"]])
            it["s"] = X["s"]
            it["act"] = {"go": "#/logs"}
        elif it["i"].startswith("t_L") and it["i"][2:] in IDS:
            x = it["i"][2:]
            tx = txt[x]
            partes = [f"**{x} — {tx['nome']}** · {X['bloco']} · {X['sit']}"]
            for t in TURNOS:
                r = LOGS[t]["testes"][x]
                partes.append(X["res"](tn(t), fmt(r["a"], lg), fmt(r["i"], lg), fmt(r["unidades"], lg), (X["un"](r["a"]), X["un"](r["i"]))))
            partes.append(X["res_nota"])
            partes += [f"**{X['oque']}.** {tx['objetivo']}", f"**{X['como']}.** {tx['metodo']}", f"**{X['crit']}.** {tx['criterio']}", f"**{X['lim']}.** {tx['limites']}"]
            for t in TURNOS:
                r = LOGS[t]["testes"][x]
                cats = "\n".join(f"- {'🔴' if nv == 'a' else '🟡'} {cat.get(c, c)}: {fmt(n, lg)} {X['un'](n)}" for c, nv, n in r["cats"])
                if cats:
                    partes.append(f"**{X['achado'](tn(t))}:**\n{cats}")
            partes += [X["ressalva"], X["ver"]]
            it["a"] = "\n\n".join(partes)
            it["s"] = X["s"]
            it["act"] = {"go": f"#/testes/{x}"}
    arq.write_text(json.dumps(kb, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(lg, "ok", "dois turnos" if DOIS else "1º turno")
