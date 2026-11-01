#!/usr/bin/env python3
"""Atualiza as respostas do Atlas (kb_pt/en/es.json) sobre os testes L01 a L14 com os resultados do 1º turno.

Uso: python3 kb.py   (depois de gerar.py; lê site/data/resumo.json → logs["1"])

Reescreve as respostas t_L01 … t_L14 e logs_testes com os textos do motor e os números do 1º turno, e marca nas
respostas sobre, testes_lista e auditoria_35 que os testes L estão com o 1º turno concluído e o 2º em andamento.
Só biblioteca padrão.
"""
import json
from pathlib import Path

D = Path(__file__).resolve().parents[1]
G = json.loads((D / "resumo.json").read_text(encoding="utf-8"))["logs"]["1"]
IDS = [f"L{i:02d}" for i in range(1, 15)]
fmt = lambda n, lg: f"{n:,}".replace(",", "." if lg != "en" else ",")

T = {
    "pt": {"bloco": "Logs das urnas", "sit": "1º turno concluído; 2º turno em andamento",
           "res": lambda a, i, u: f"**Resultado no 1º turno.** 🔴 {a} anomalia(s) estatística(s) e 🟡 {i} evento(s) informativo(s) em {u} seções com log lido.",
           "oque": "O que verifica", "como": "Como é calculado", "crit": "Critério", "lim": "Limitações", "achado": "O que foi encontrado no 1º turno",
           "ressalva": "Anomalia estatística não é prova de fraude, erro ou irregularidade: indica prioridade de verificação documental (ata da mesa, boletim impresso e registros da urna).",
           "ver": "A lista das seções, por estado, está na página **Logs das urnas**; a página de cada seção mostra os testes L dela.",
           "s": "Auditoria completa (logs das urnas)",
           "intro": "São **14 testes** que leem o log de cada urna (hora de cada voto e de cada evento). **1º turno concluído**, com resultados publicados; o 2º turno está em andamento.",
           "fim": "O log não mostra em quem foi o voto nem o nome do eleitor, e nenhum número de título é publicado.",
           "subs": [("(estes em andamento)", "(1º turno concluído; 2º turno em andamento)"),
                    ("**Logs das urnas (L01 a L14) · em andamento**", "**Logs das urnas (L01 a L14) · 1º turno concluído; 2º turno em andamento**"),
                    ("- **14 em andamento:** os testes dos logs das urnas (L01 a L14), que usam a hora de cada voto e de cada evento.",
                     "- **14 com o 1º turno concluído:** os testes dos logs das urnas (L01 a L14), que usam a hora de cada voto e de cada evento. Os resultados do 1º turno estão publicados; o 2º turno está em andamento."),
                    ("Para os testes dos logs, os dados estão sendo baixados", "Para o 2º turno dos testes dos logs, os dados estão sendo baixados")]},
    "en": {"bloco": "Voting machine logs", "sit": "round 1 completed; round 2 in progress",
           "res": lambda a, i, u: f"**Round 1 result.** 🔴 {a} statistical anomaly(ies) and 🟡 {i} informational event(s) in {u} sections with a readable log.",
           "oque": "What it checks", "como": "How it is calculated", "crit": "Criterion", "lim": "Limitations", "achado": "What was found in round 1",
           "ressalva": "A statistical anomaly is not proof of fraud, error or irregularity: it sets a priority for documentary checking (polling station minutes, printed tally sheet and machine records).",
           "ver": "The list of sections, by state, is on the **Voting machine logs** page; each section's page shows its L tests.",
           "s": "Full audit (voting machine logs)",
           "intro": "These are **14 tests** that read each machine's log (time of each vote and each event). **Round 1 is completed**, with results published; round 2 is in progress.",
           "fim": "The log does not show who the vote went to nor the voter's name, and no voter ID number is published.",
           "subs": [("(in progress)", "(round 1 completed; round 2 in progress)"),
                    ("**Voting machine logs (L01 to L14) · in progress**", "**Voting machine logs (L01 to L14) · round 1 completed; round 2 in progress**"),
                    ("- **14 in progress:** the voting machine log tests (L01 to L14), which use the time of each vote and each event.",
                     "- **14 with round 1 completed:** the voting machine log tests (L01 to L14), which use the time of each vote and each event. Round 1 results are published; round 2 is in progress."),
                    ("For the log tests, the data are being downloaded", "For round 2 of the log tests, the data are being downloaded")]},
    "es": {"bloco": "Logs de las urnas", "sit": "1.ª vuelta concluida; 2.ª vuelta en curso",
           "res": lambda a, i, u: f"**Resultado en la 1.ª vuelta.** 🔴 {a} anomalía(s) estadística(s) y 🟡 {i} evento(s) informativo(s) en {u} secciones con log leído.",
           "oque": "Qué verifica", "como": "Cómo se calcula", "crit": "Criterio", "lim": "Limitaciones", "achado": "Qué se encontró en la 1.ª vuelta",
           "ressalva": "La anomalía estadística no es prueba de fraude, error o irregularidad: indica prioridad de verificación documental (acta de la mesa, boletín impreso y registros de la urna).",
           "ver": "La lista de secciones, por estado, está en la página **Logs de las urnas**; la página de cada sección muestra sus pruebas L.",
           "s": "Auditoría completa (logs de las urnas)",
           "intro": "Son **14 pruebas** que leen el log de cada urna (hora de cada voto y de cada evento). **1.ª vuelta concluida**, con resultados publicados; la 2.ª vuelta está en curso.",
           "fim": "El log no muestra por quién fue el voto ni el nombre del elector, y no se publica ningún número de título.",
           "subs": [("(en curso)", "(1.ª vuelta concluida; 2.ª vuelta en curso)"),
                    ("**Logs de las urnas (L01 a L14) · en curso**", "**Logs de las urnas (L01 a L14) · 1.ª vuelta concluida; 2.ª vuelta en curso**"),
                    ("- **14 en curso:** las pruebas de los logs de las urnas (L01 a L14), que usan la hora de cada voto y de cada evento.",
                     "- **14 con la 1.ª vuelta concluida:** las pruebas de los logs de las urnas (L01 a L14), que usan la hora de cada voto y de cada evento. Los resultados de la 1.ª vuelta están publicados; la 2.ª vuelta está en curso."),
                    ("Para las pruebas de los logs, los datos se están descargando", "Para la 2.ª vuelta de las pruebas de los logs, los datos se están descargando")]},
}

for lg, X in T.items():
    arq = D / f"kb_{lg}.json"
    kb = json.loads(arq.read_text(encoding="utf-8"))
    txt, cat = G["txt"][lg.upper()], {c: v[lg.upper()] for c, v in G["categorias"].items()}
    for it in kb:
        if it["i"] in ("sobre", "testes_lista", "auditoria_35"):
            for a, b in X["subs"]:
                it["a"] = it["a"].replace(a, b)
        elif it["i"] == "logs_testes":
            linhas = [f"- **{t}** — {txt[t]['nome']}: 🔴 {fmt(G['testes'][t]['a'], lg)} · 🟡 {fmt(G['testes'][t]['i'], lg)}" for t in IDS]
            it["a"] = "\n\n".join([X["intro"], "\n".join(linhas), X["ver"], X["fim"]])
            it["s"] = X["s"]
            it["act"] = {"go": "#/logs"}
        elif it["i"].startswith("t_L") and it["i"][2:] in IDS:
            t = it["i"][2:]
            r, tx = G["testes"][t], txt[t]
            cats = "\n".join(f"- {'🔴' if nv == 'a' else '🟡'} {cat.get(c, c)}: {fmt(n, lg)}" for c, nv, n in r["cats"])
            partes = [f"**{t} — {tx['nome']}** · {X['bloco']} · {X['sit']}", X["res"](fmt(r["a"], lg), fmt(r["i"], lg), fmt(r["unidades"], lg)),
                      f"**{X['oque']}.** {tx['objetivo']}", f"**{X['como']}.** {tx['metodo']}", f"**{X['crit']}.** {tx['criterio']}",
                      f"**{X['lim']}.** {tx['limites']}"]
            if cats:
                partes.append(f"**{X['achado']}:**\n{cats}")
            partes += [X["ressalva"], X["ver"]]
            it["a"] = "\n\n".join(partes)
            it["s"] = X["s"]
            it["act"] = {"go": f"#/testes/{t}"}
    arq.write_text(json.dumps(kb, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(lg, "ok")
