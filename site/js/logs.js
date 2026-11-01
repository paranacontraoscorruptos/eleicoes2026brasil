/* Testes L01 a L14 (logs das urnas): página "Logs das urnas", bloco na página da seção e textos em PT, EN e ES.
   A página segue o formato da página "Urnas que fecharam tarde": cartões com números, barras por teste e por estado,
   a mesma tabela (ordem por coluna, páginas, sinais, dica no mouse) e o mesmo painel ao clicar na linha, com o que o
   teste apurou na urna no alto e um botão (também no rodapé do painel) que abre a hora de cada voto, nos testes em que
   ela importa, ou os registros do log que o teste usou.
   Dados: resumo.json → logs["1"] (números de cada teste, categorias e textos do motor), site/data/logs/t1/teste/Lxx.json
   (seções de cada teste, com as medidas do motor), site/data/logs/t1/det/<UF>/<zona>.json (o que cada teste apurou em
   cada seção) e site/data/logs/t1/<UF>.json (sinalizações de cada estado, para a página da seção). Gerados por
   site/data/logs/gerar.py e detalhes.py. Nenhum número de título e nenhum .logjez ou logd.dat entram no site. */
(function () {
  "use strict";
  const A = window.APP, I = window.I18N;
  if (!A || !I) return;
  const { esc, icone, tabela, chip, $, $$ } = A;
  const t = () => A.t(), X = () => A.t().ex, nf = (n) => A.nf(n), pct = (x, d) => A.pct(x, d);
  const R = () => A.state.R;
  // PUBLICADO: liga a página, o menu e os blocos quando os dados do 1º turno (gerar.py) estiverem no site
  const PUBLICADO = true;
  const LG1 = () => (PUBLICADO && R() && R().logs && R().logs["1"]) || null;
  const TESTES_L = Array.from({ length: 14 }, (_, i) => `L${String(i + 1).padStart(2, "0")}`);
  const API = () => A.cqPagina;

  // colunas próprias de cada teste: [chave, formato]; rótulos em TXT.cols
  const COLS = {
    L01: [["v_apos", "n"], ["v_apos_1h", "n"], ["ult_apos_min", "min"], ["sd_apos", "n"], ["n_votos", "n"], ["fim_local", "h"], ["z", "z"]],
    L02: [["rajada_max", "n"], ["n_rajadas", "n"], ["int_mediano", "s"], ["n_votos", "n"], ["n_sem_digital", "n"], ["z", "z"]],
    L03: [["seq_sem_digital", "n"], ["n_sem_digital", "n"], ["pct_digital", "pct"], ["n_votos", "n"], ["erro", "sim"]],
    L04: [["v_pos_sim", "n"], ["v_pos_nao", "n"], ["n_votos", "n"]],
    L05: [["n_religamentos", "n"], ["n_bateria", "n"], ["n_desligada", "n"], ["v_urna_desligada", "n"], ["min_parada", "min0"]],
    L06: [["n_urnas_voto", "n"], ["v_sobreposto", "n"], ["n_urnas", "n"], ["n_votos", "n"]],
    L07: [["n_tentativas", "n"], ["tentativas_seguidas", "n"], ["taxa", "pct2"], ["n_votos", "n"], ["z", "z"], ["q", "q"]],
    L08: [["n_nao_concluidos", "n"], ["taxa", "pct2"], ["n_votos", "n"], ["z", "z"], ["q", "q"]],
    L09: [["n_enc_cedo", "n"], ["n_enc_depois", "n"], ["liberado", "h"], ["encerramento", "h"]],
    L10: [["t_ligada", "h"], ["t_zeresima", "h"], ["t_primeiro_voto", "h"], ["abertura", "h"]],
    L11: [["ajuste_durante", "n"], ["ajuste_fora", "n"], ["dif_relogio_min", "min0"], ["abertura", "h"], ["encerramento", "h"]],
    L12: [["versao", "txt"], ["modelo", "txt"], ["n_urnas", "n"], ["observado", "txt"]],
    L13: [["pct_sem_digital", "pct"], ["pct_4_tentativas", "pct"], ["n_sem_digital", "n"], ["n_votos", "n"], ["z", "z"], ["q", "q"]],
    L14: [["n_votos", "n"], ["comp_bu", "n"], ["dif_bu", "sn"]],
  };
  // testes em que a hora de cada voto importa (o botão abre a lista voto a voto); nos outros, abre os registros do teste
  const VOTOS = new Set(["L01", "L02", "L03", "L04", "L08"]);

  const TXT = {
    PT: {
      nav: "Logs das urnas",
      titulo: "Logs das urnas · 1º turno",
      sub: "Os 14 testes L leem o registro (log) de cada urna, com a hora de cada voto e de cada evento do dia. Clique em uma seção da lista e veja o que o teste encontrou naquela urna.",
      oque_t: "O que esta página mostra",
      oque: ["O log da urna registra, com a hora do relógio da urna, cada eleitor liberado, cada voto gravado e cada evento do dia (urna ligada, zerésima, bateria, tentativas, encerramento). O log não mostra em quem foi o voto nem quem é o eleitor.",
        "Os 14 testes L procuram, nesse registro, o que foge do padrão: votos depois do horário, votos em rajada, liberações sem digital em sequência, interrupções, troca de urna, relógio ajustado e outros.",
        "Escolha um teste e clique em uma seção da lista: o painel mostra o que o teste apurou naquela urna, os dados da seção e um botão com a hora de cada voto (nos testes em que ela importa) ou com os registros do log que o teste usou.",
        "Anomalia estatística (vermelho) é prioridade de verificação, não prova de fraude, erro ou irregularidade: aponta a seção para conferência com a ata da mesa, o boletim impresso e os registros da urna. Informativo (amarelo) é um evento registrado para conferência, abaixo do critério de anomalia."],
      k_com: "Seções com log lido", k_com_sub: (n) => `${n} sem log legível`, k_votos: "Votos no log", k_votos_sub: (n) => `em ${n} seções`,
      k_apos: "Votos depois do horário oficial", k_apos_sub: (p, s) => `${p} dos votos do log · em ${s} seções`,
      k_1h: "Votos 1 h ou mais depois do horário", k_1h_sub: (s) => `em ${s} seções`, k_sd: "Liberados sem digital depois do horário", k_sd_sub: "eleitores, pelo log",
      k_a: "Anomalias estatísticas", k_a_sub: "somando os 14 testes", k_i: "Informativos", k_i_sub: "somando os 14 testes",
      k_sin: "Seções com alguma sinalização", k_sin_sub: "em pelo menos um teste L",
      faixas_t: "Os 14 testes no 1º turno", faixas_n: "Seções sinalizadas em cada teste: em vermelho, as anomalias; em amarelo, os informativos. Clique em um teste para ver a lista.",
      ufs_t: "Por estado", ufs_n: "Seções com sinalização em algum teste L. Clique em um estado para filtrar a lista.",
      lista_t: "Seções sinalizadas", f_teste: "Teste", f_nivel: "Nível", n_ops: { "": "Todos", a: "Anomalias", i: "Informativos" },
      f_uf: "Estado", f_uf_todos: "Todos os estados", f_mun: "Município", f_mun_ph: "Digite o nome", limpar: "Limpar filtros",
      info: (n, tot, todas) => (todas ? `${tot} seções` : `${n} de ${tot} seções com estes filtros`),
      csv: "Baixar esta lista (CSV)", nota_h: "Horários: relógio da urna, na hora local do município. O fim oficial é 17h de Brasília, na hora local.",
      leg: "Legenda do teste",
      col: { uf: "UF", municipio: "Município", zona: "Zona", secao: "Seção", nivel: "Nível", cat: "O que foi\nencontrado" },
      cols: { v_apos: "Votos depois\ndo horário", v_apos_1h: "Votos 1 h\nou mais depois", ult_apos_min: "Último voto\ndepois do horário", sd_apos: "Sem digital\ndepois do horário",
        n_votos: "Votos\nno log", fim_local: "Fim oficial\n(hora local)", z: "Escore z", rajada_max: "Maior rajada\n(votos)", n_rajadas: "Rajadas", int_mediano: "Tempo mediano\nentre votos",
        n_sem_digital: "Sem digital\n(eleitores)", seq_sem_digital: "Maior sequência\nsem digital", pct_digital: "Votaram\ncom digital", erro: "Erro da urna\nperto",
        v_pos_sim: "Votos depois\ndo SIM", v_pos_nao: "Votos depois\ndo NÃO", n_religamentos: "Religamentos", n_bateria: "Avisos de\nbateria", n_desligada: "Desligamentos",
        v_urna_desligada: "Votos com a\nurna desligada", min_parada: "Tempo\nparada", n_urnas_voto: "Urnas\ncom votos", v_sobreposto: "Votos na urna\nanterior depois\nda troca",
        n_urnas: "Urnas\nno log", n_tentativas: "Tentativas", tentativas_seguidas: "Maior\nsequência", taxa: "Parcela dos\natendimentos", q: "q (FDR)",
        n_nao_concluidos: "Votos não\nconcluídos", n_enc_cedo: "Tentativas\nantes da hora", n_enc_depois: "Tentativas\ndepois da hora", liberado: "Encerramento\nliberado às",
        encerramento: "Encerramento\n(boletim)", t_ligada: "Urna\nligada", t_zeresima: "Zerésima", t_primeiro_voto: "1º voto", abertura: "Abertura\n(boletim)",
        ajuste_durante: "Ajustes durante\na votação", ajuste_fora: "Ajustes fora\nda votação", dif_relogio_min: "Diferença\nlog × boletim", versao: "Versão", modelo: "Modelo",
        observado: "No log", pct_sem_digital: "Sem digital", pct_4_tentativas: "4 leituras\nou mais", comp_bu: "Comparecimento\n(boletim)", dif_bu: "Diferença" },
      sim: "Sim", nao: "—",
      como_t: "Como ler",
      como: ["Anomalia estatística (vermelho) é prioridade de verificação. Não é prova de fraude, erro ou irregularidade: aponta a seção para conferência com a ata da mesa, o boletim impresso e os registros da urna.",
        "Informativo (amarelo) é um evento registrado para conferência, sem atingir o critério de anomalia.",
        "Os horários são os do relógio da urna, na hora local do município.",
        "O site guarda só números tirados do log. Nenhum número de título (de eleitor ou de mesário) e nenhum arquivo .logjez ou logd.dat são publicados."],
      rel: "Relatório Técnico do 1º turno (Anexo B)", tardio: "Urnas que fecharam tarde",
      arq_t: "Arquivos e fontes", arq: ["Lista de cada teste (JSON)", "O que cada teste apurou em cada seção (JSON, um arquivo por zona)", "Scripts desta página"],
      arq_n: "Os arquivos são gerados a partir do pacote de resultados do motor (logs_sinalizacoes.csv e logs_secoes.csv.gz) e dos resumos numéricos dos logs lidos pelo motor.",
      // painel
      p_teste: "O que o teste apurou nesta urna", p_crit: "Critério do teste", p_dia: "Linha do dia (relógio da urna)", p_urna: "Urna", p_outros: "Outros testes do log nesta seção",
      p_nenhum_outro: "Nenhum outro teste do log sinalizou esta seção.", p_sem_det: "O detalhe deste teste não foi encontrado para esta seção.",
      p_nota: "Anomalia estatística não é prova de fraude, erro ou irregularidade: indica prioridade de verificação documental (ata da mesa, boletim impresso e registros da urna).",
      marcos: { lig: "Urna ligada", zer: "Zerésima impressa", pr: "Urna pronta para votos", ini: "Início oficial (hora local)", v1: "1º voto gravado", fim: "Fim oficial (hora local)",
        vu: "Último voto gravado", enc: "Encerramento confirmado", bu: "Boletim de urna impresso" },
      u_num: "Número da urna (boletim)", u_mod: "Modelo", u_ver: "Versão do software", u_carga: "Código de carga (boletim)", u_agreg: "Seções agregadas",
      u_th: ["Urna", "1º registro", "Último registro", "Votos", "Versão", "Modelo"], u_th_carga: ["Carga", "Carga feita para (município · zona · seção)"], u_vref: (v) => `Versão de referência do 1º turno: ${v}`,
      ver: { L02: (n) => `Ver o horário de cada voto (${n})`, L03: (n) => `Ver os votos da sequência sem digital (${n})`, L04: (n) => `Ver os votos depois da resposta (${n})`,
        L05: (n) => `Ver as interrupções (${n})`, L06: () => "Ver as urnas e os votos de cada uma", L07: (n) => `Ver as tentativas (${n})`, L08: (n) => `Ver os votos não concluídos (${n})`,
        L09: (n) => `Ver as tentativas de encerramento (${n})`, L10: () => "Ver a abertura da urna", L11: (n) => `Ver os ajustes do relógio (${n})`, L12: () => "Ver versão, modelo e carga",
        L13: () => "Ver como os eleitores foram liberados", L14: () => "Ver log × boletim" },
      ir: { L02: "Ver horário de cada voto", L03: "Ver os votos sem digital", L04: "Ver horário dos votos", L05: "Ver as interrupções", L06: "Ver as urnas usadas", L07: "Ver as tentativas",
        L08: "Ver os não concluídos", L09: "Ver as tentativas de encerrar", L10: "Ver a abertura da urna", L11: "Ver os ajustes do relógio", L12: "Ver versão e carga",
        L13: "Ver a biometria", L14: "Ver log × boletim" },
      dica: (toque, o) => `${toque ? "Toque" : "Clique"} aqui e veja ${o}.`,
      dica_o: { L02: "a hora exata de cada voto e as rajadas", L03: "cada voto da sequência sem digital, com a hora", L04: "os votos gravados depois da resposta, com a hora",
        L05: "cada desligamento, religamento e aviso de bateria", L06: "as urnas usadas e os votos de cada uma", L07: "cada tentativa, com a hora", L08: "cada voto não concluído, com a hora",
        L09: "cada tentativa de encerrar a votação", L10: "a hora da ligação, da zerésima e do 1º voto", L11: "cada ajuste do relógio da urna", L12: "a versão, o modelo e a carga de cada urna",
        L13: "como cada eleitor foi liberado", L14: "os votos do log e o comparecimento do boletim" },
      esconder: "Esconder", gap: (n) => `… ${n} ${n === 1 ? "voto não listado" : "votos não listados"} …`, ev_gap: (n) => `… mais ${n} registros não listados`,
      th_hora: "Hora", th_reg: "Registro", th_urna: "Urna",
      ev: { z: "Zerésima impressa", pr: "Urna pronta para receber votos", pa: "Voto parcial: eleitor suspenso, votos restantes anulados", dh: "Data e hora da urna ajustadas", er: "Erro registrado pela urna" },
      raj: (a, b, n, d) => `Rajada: votos ${a} a ${b} (${n} votos seguidos em ${d}, todos liberados sem digital, com até 30 s entre um e outro).`,
      sem_raj: "Nenhuma rajada de 5 votos ou mais sem digital nesta urna.",
      hist_t: "Tempo entre um voto e o seguinte", hist: ["até 30 s", "31 s a 1 min", "1 a 2 min", "2 a 5 min", "5 a 15 min", "mais de 15 min"],
      seq: (a, b, n, h1, h2) => `Sequência: votos ${a} a ${b} (${n} liberações seguidas sem digital), das ${h1} às ${h2}.`,
      seq_erro: (hs) => `Erros registrados pela urna perto da sequência: ${hs}.`,
      lib_t: "Como os eleitores foram liberados (dia todo)", lib3: ["Com a digital do eleitor", "Digital não reconhecida (ano de nascimento)", "Sem digital cadastrada (ano de nascimento)"],
      lib13: (k) => (k === 9 ? "Digital na 9ª leitura ou mais" : `Digital na ${k}ª leitura`), lib13_x: ["Digital não reconhecida (ano de nascimento)", "Sem digital cadastrada (ano de nascimento)", "Não identificada"],
      lib_mes: "Liberados sem digital com a digital do mesário", lib_cpf: "Identificados pelo CPF",
      l04_t: "Respostas e passos do encerramento", l04_v: (n) => `Votos gravados depois da 1ª resposta (${n})`,
      l05_t: "Interrupções do dia", l05_vd: (n) => `Votos gravados com a urna desligada (${n})`,
      l06_t: "Urnas usadas no dia", l06_sob: (n) => `Votos gravados na urna anterior depois do 1º voto da nova (${n})`, l06_nenhum: "Nenhum voto na urna anterior depois da troca.",
      l07_cont: ["Eleitor que já tinha votado", "Identificador não encontrado na seção", "Eleitor impedido"], l07_seq: (n, a, b, c) => `Maior sequência sem voto entre as tentativas: ${n} × “${c}”, das ${a} às ${b}.`,
      l09_lib: (h) => `A urna só libera o encerramento depois das ${h} (17h de Brasília, na hora local).`,
      l11_dh: (n) => `Ajustes de data e hora (${n})`, l11_volta: (n) => `Relógio voltou para trás (${n})`, l11_volta_v: (s) => `voltou ${s}`, l11_cmp: "Log × boletim",
      l11_th: ["", "Log", "Boletim", "Diferença"], l11_ab: "Abertura (urna pronta)", l11_en: "Encerramento",
      l14_t: "Votos do log × comparecimento do boletim", l14_log: "Votos no log", l14_bu: "Comparecimento no boletim", l14_dif: "Diferença",
      vazio: "Nenhum registro.",
      // página da seção
      sec_t: "Logs da urna (testes L01 a L14)", sec_sem: "Sem log legível para esta seção no 1º turno (teste L14).",
      sec_ok: "Nenhuma sinalização nos 14 testes do log.", sec_carregando: "Carregando os testes do log…",
      sec_leg: "Observado e referência: veja a explicação de cada teste na página Os 35 testes.",
      th_mun: "Município", th_zona: "Zona", th_secao: "Seção", th_nivel: "Nível", th_cat: "O que foi encontrado", th_obs: "Observado", th_ref: "Referência", th_det: "Detalhe", th_qtd: "Quantidade",
      th_teste: "Teste", th_un: "Seções analisadas",
      res_t1: "1º turno", res_t2: "2º turno", and_t2: "Em andamento",
      bloco_l: "14 testes · L01 a L14 · 1º turno concluído; 2º turno em andamento",
      bloco_l_p: "Usam o log de cada urna, que registra a hora de cada voto e de cada evento do dia. Os resultados do 1º turno estão publicados; os logs do 2º turno estão sendo baixados do TSE.",
      tag_l: "1º turno concluído",
      f_obj: "Objetivo", ver_secoes: "Ver as seções", cats_t: "O que foi encontrado no 1º turno",
      aud_nota: "Os 14 testes dos logs já foram concluídos no 1º turno e estão publicados. O 2º turno está em andamento.",
      aud_meio: "1º turno concluído",
      erro: "Não foi possível carregar os dados deste teste.",
    },
    EN: {
      nav: "Voting machine logs",
      titulo: "Voting machine logs · Round 1",
      sub: "The 14 L tests read each machine's log, with the time of every vote and every event of the day. Click a section on the list to see what the test found on that machine.",
      oque_t: "What this page shows",
      oque: ["The machine log records, by the machine's clock, each voter released, each vote recorded and each event of the day (machine on, zero report, battery, attempts, closing). The log does not show who the vote went to nor who the voter is.",
        "The 14 L tests look in that record for what falls outside the pattern: votes after the official time, votes in bursts, releases without fingerprint in a row, interruptions, machine replacement, clock adjustments and more.",
        "Choose a test and click a section on the list: the panel shows what the test found on that machine, the section's data and a button with the time of each vote (in the tests where it matters) or with the log records the test used.",
        "A statistical anomaly (red) is a priority for checking, not proof of fraud, error or irregularity: it points the section out for checking against the polling station minutes, the printed tally sheet and the machine records. Informational (yellow) is an event recorded for checking, below the anomaly criterion."],
      k_com: "Sections with a readable log", k_com_sub: (n) => `${n} with no readable log`, k_votos: "Votes in the log", k_votos_sub: (n) => `in ${n} sections`,
      k_apos: "Votes after the official time", k_apos_sub: (p, s) => `${p} of the votes in the log · in ${s} sections`,
      k_1h: "Votes 1 h or more after the official time", k_1h_sub: (s) => `in ${s} sections`, k_sd: "Released without fingerprint after the official time", k_sd_sub: "voters, from the log",
      k_a: "Statistical anomalies", k_a_sub: "adding up the 14 tests", k_i: "Informational", k_i_sub: "adding up the 14 tests",
      k_sin: "Sections with any flag", k_sin_sub: "in at least one L test",
      faixas_t: "The 14 tests in round 1", faixas_n: "Sections flagged in each test: anomalies in red, informational in yellow. Click a test to see the list.",
      ufs_t: "By state", ufs_n: "Sections flagged in any L test. Click a state to filter the list.",
      lista_t: "Flagged sections", f_teste: "Test", f_nivel: "Level", n_ops: { "": "All", a: "Anomalies", i: "Informational" },
      f_uf: "State", f_uf_todos: "All states", f_mun: "Municipality", f_mun_ph: "Type the name", limpar: "Clear filters",
      info: (n, tot, todas) => (todas ? `${tot} sections` : `${n} of ${tot} sections with these filters`),
      csv: "Download this list (CSV)", nota_h: "Times: the machine's clock, in the municipality's local time. The official end is 5 pm Brasília time, in local time.",
      leg: "Test legend",
      col: { uf: "State", municipio: "Municipality", zona: "Zone", secao: "Section", nivel: "Level", cat: "What was\nfound" },
      cols: { v_apos: "Votes after\nthe official time", v_apos_1h: "Votes 1 h\nor more later", ult_apos_min: "Last vote\nafter the time", sd_apos: "No fingerprint\nafter the time",
        n_votos: "Votes in\nthe log", fim_local: "Official end\n(local time)", z: "z-score", rajada_max: "Largest burst\n(votes)", n_rajadas: "Bursts", int_mediano: "Median time\nbetween votes",
        n_sem_digital: "No fingerprint\n(voters)", seq_sem_digital: "Longest run\nwithout fingerprint", pct_digital: "Voted with\nfingerprint", erro: "Machine error\nnearby",
        v_pos_sim: "Votes after\nYES", v_pos_nao: "Votes after\nNO", n_religamentos: "Restarts", n_bateria: "Battery\nwarnings", n_desligada: "Shutdowns",
        v_urna_desligada: "Votes with the\nmachine off", min_parada: "Time\nstopped", n_urnas_voto: "Machines\nwith votes", v_sobreposto: "Votes on the\nprevious machine\nafter the switch",
        n_urnas: "Machines\nin the log", n_tentativas: "Attempts", tentativas_seguidas: "Longest\nrun", taxa: "Share of\nservices", q: "q (FDR)",
        n_nao_concluidos: "Unfinished\nvotes", n_enc_cedo: "Attempts\nbefore the time", n_enc_depois: "Attempts\nafter the time", liberado: "Closing\nallowed from",
        encerramento: "Closing\n(tally sheet)", t_ligada: "Machine\non", t_zeresima: "Zero\nreport", t_primeiro_voto: "1st vote", abertura: "Opening\n(tally sheet)",
        ajuste_durante: "Adjustments\nduring voting", ajuste_fora: "Adjustments\noutside voting", dif_relogio_min: "Log × tally\nsheet difference", versao: "Version", modelo: "Model",
        observado: "In the log", pct_sem_digital: "No fingerprint", pct_4_tentativas: "4 reads\nor more", comp_bu: "Turnout\n(tally sheet)", dif_bu: "Difference" },
      sim: "Yes", nao: "—",
      como_t: "How to read it",
      como: ["A statistical anomaly (red) is a priority for checking. It is not proof of fraud, error or irregularity: it points the section out for checking against the polling station minutes, the printed tally sheet and the machine records.",
        "Informational (yellow) is an event recorded for checking, below the anomaly criterion.",
        "Times are those of the machine's clock, in the municipality's local time.",
        "The site keeps only numbers taken from the log. No voter ID number (of a voter or a poll worker) and no .logjez or logd.dat file is published."],
      rel: "Technical Report for round 1 (Appendix B)", tardio: "Machines that closed late",
      arq_t: "Files and sources", arq: ["List of each test (JSON)", "What each test found in each section (JSON, one file per zone)", "Scripts of this page"],
      arq_n: "The files are generated from the engine's results package (logs_sinalizacoes.csv and logs_secoes.csv.gz) and from the numeric summaries of the logs read by the engine.",
      p_teste: "What the test found on this machine", p_crit: "Test criterion", p_dia: "Timeline of the day (machine clock)", p_urna: "Machine", p_outros: "Other log tests in this section",
      p_nenhum_outro: "No other log test flagged this section.", p_sem_det: "The detail of this test was not found for this section.",
      p_nota: "A statistical anomaly is not proof of fraud, error or irregularity: it sets a priority for documentary checking (polling station minutes, printed tally sheet and machine records).",
      marcos: { lig: "Machine turned on", zer: "Zero report printed", pr: "Machine ready for votes", ini: "Official start (local time)", v1: "1st vote recorded", fim: "Official end (local time)",
        vu: "Last vote recorded", enc: "Closing confirmed", bu: "Tally sheet printed" },
      u_num: "Machine number (tally sheet)", u_mod: "Model", u_ver: "Software version", u_carga: "Load code (tally sheet)", u_agreg: "Aggregated sections",
      u_th: ["Machine", "1st record", "Last record", "Votes", "Version", "Model"], u_th_carga: ["Load", "Loaded for (municipality · zone · section)"], u_vref: (v) => `Reference version in round 1: ${v}`,
      ver: { L02: (n) => `See the time of each vote (${n})`, L03: (n) => `See the votes in the run without fingerprint (${n})`, L04: (n) => `See the votes after the answer (${n})`,
        L05: (n) => `See the interruptions (${n})`, L06: () => "See the machines and the votes on each", L07: (n) => `See the attempts (${n})`, L08: (n) => `See the unfinished votes (${n})`,
        L09: (n) => `See the closing attempts (${n})`, L10: () => "See the machine's opening", L11: (n) => `See the clock adjustments (${n})`, L12: () => "See version, model and load",
        L13: () => "See how voters were released", L14: () => "See log × tally sheet" },
      ir: { L02: "See the time of each vote", L03: "See the votes without fingerprint", L04: "See the time of the votes", L05: "See the interruptions", L06: "See the machines used", L07: "See the attempts",
        L08: "See the unfinished votes", L09: "See the closing attempts", L10: "See the machine's opening", L11: "See the clock adjustments", L12: "See version and load",
        L13: "See the biometrics", L14: "See log × tally sheet" },
      dica: (toque, o) => `${toque ? "Tap" : "Click"} here to see ${o}.`,
      dica_o: { L02: "the exact time of each vote and the bursts", L03: "each vote in the run without fingerprint, with its time", L04: "the votes recorded after the answer, with their times",
        L05: "each shutdown, restart and battery warning", L06: "the machines used and the votes on each", L07: "each attempt, with its time", L08: "each unfinished vote, with its time",
        L09: "each attempt to close the voting", L10: "the time the machine was turned on, the zero report and the 1st vote", L11: "each adjustment of the machine's clock", L12: "the version, model and load of each machine",
        L13: "how each voter was released", L14: "the votes in the log and the turnout on the tally sheet" },
      esconder: "Hide", gap: (n) => `… ${n} ${n === 1 ? "vote not listed" : "votes not listed"} …`, ev_gap: (n) => `… ${n} more records not listed`,
      th_hora: "Time", th_reg: "Record", th_urna: "Machine",
      ev: { z: "Zero report printed", pr: "Machine ready to receive votes", pa: "Partial vote: voter suspended, remaining votes null", dh: "Machine date and time adjusted", er: "Error recorded by the machine" },
      raj: (a, b, n, d) => `Burst: votes ${a} to ${b} (${n} votes in a row in ${d}, all released without fingerprint, at most 30 s apart).`,
      sem_raj: "No burst of 5 or more votes without fingerprint on this machine.",
      hist_t: "Time between one vote and the next", hist: ["up to 30 s", "31 s to 1 min", "1 to 2 min", "2 to 5 min", "5 to 15 min", "over 15 min"],
      seq: (a, b, n, h1, h2) => `Run: votes ${a} to ${b} (${n} releases in a row without fingerprint), from ${h1} to ${h2}.`,
      seq_erro: (hs) => `Errors recorded by the machine near the run: ${hs}.`,
      lib_t: "How voters were released (whole day)", lib3: ["With the voter's fingerprint", "Fingerprint not recognised (year of birth)", "No fingerprint on file (year of birth)"],
      lib13: (k) => (k === 9 ? "Fingerprint on the 9th read or later" : `Fingerprint on read ${k}`), lib13_x: ["Fingerprint not recognised (year of birth)", "No fingerprint on file (year of birth)", "Not identified"],
      lib_mes: "Released without fingerprint with the poll worker's fingerprint", lib_cpf: "Identified by CPF",
      l04_t: "Answers and closing steps", l04_v: (n) => `Votes recorded after the 1st answer (${n})`,
      l05_t: "Interruptions of the day", l05_vd: (n) => `Votes recorded with the machine off (${n})`,
      l06_t: "Machines used on the day", l06_sob: (n) => `Votes recorded on the previous machine after the 1st vote on the new one (${n})`, l06_nenhum: "No vote on the previous machine after the switch.",
      l07_cont: ["Voter who had already voted", "ID not found in the section", "Voter barred"], l07_seq: (n, a, b, c) => `Longest run without a vote between attempts: ${n} × “${c}”, from ${a} to ${b}.`,
      l09_lib: (h) => `The machine only allows closing after ${h} (5 pm Brasília time, in local time).`,
      l11_dh: (n) => `Date and time adjustments (${n})`, l11_volta: (n) => `Clock went backwards (${n})`, l11_volta_v: (s) => `went back ${s}`, l11_cmp: "Log × tally sheet",
      l11_th: ["", "Log", "Tally sheet", "Difference"], l11_ab: "Opening (machine ready)", l11_en: "Closing",
      l14_t: "Votes in the log × turnout on the tally sheet", l14_log: "Votes in the log", l14_bu: "Turnout on the tally sheet", l14_dif: "Difference",
      vazio: "No record.",
      sec_t: "Machine log (tests L01 to L14)", sec_sem: "No readable log for this section in round 1 (test L14).",
      sec_ok: "No flag in the 14 log tests.", sec_carregando: "Loading the log tests…",
      sec_leg: "Observed and reference: see each test's explanation on The 35 tests page.",
      th_mun: "Municipality", th_zona: "Zone", th_secao: "Section", th_nivel: "Level", th_cat: "What was found", th_obs: "Observed", th_ref: "Reference", th_det: "Detail", th_qtd: "Count",
      th_teste: "Test", th_un: "Sections analyzed",
      res_t1: "Round 1", res_t2: "Round 2", and_t2: "In progress",
      bloco_l: "14 tests · L01 to L14 · round 1 completed; round 2 in progress",
      bloco_l_p: "They use each machine's log, which records the time of every vote and every event of the day. Round 1 results are published; the round 2 logs are being downloaded from the TSE.",
      tag_l: "Round 1 completed",
      f_obj: "Objective", ver_secoes: "See the sections", cats_t: "What was found in round 1",
      aud_nota: "The 14 log tests are completed for round 1 and published. Round 2 is in progress.",
      aud_meio: "Round 1 completed",
      erro: "The data for this test could not be loaded.",
    },
    ES: {
      nav: "Logs de las urnas",
      titulo: "Logs de las urnas · 1.ª vuelta",
      sub: "Las 14 pruebas L leen el registro (log) de cada urna, con la hora de cada voto y de cada evento del día. Haga clic en una sección de la lista y vea qué encontró la prueba en esa urna.",
      oque_t: "Qué muestra esta página",
      oque: ["El log de la urna registra, con la hora del reloj de la urna, cada elector habilitado, cada voto registrado y cada evento del día (urna encendida, zerésima, batería, intentos, cierre). El log no muestra por quién fue el voto ni quién es el elector.",
        "Las 14 pruebas L buscan en ese registro lo que se sale del patrón: votos después del horario, votos en ráfaga, habilitaciones sin huella seguidas, interrupciones, cambio de urna, reloj ajustado y otros.",
        "Elija una prueba y haga clic en una sección de la lista: el panel muestra qué encontró la prueba en esa urna, los datos de la sección y un botón con la hora de cada voto (en las pruebas en que importa) o con los registros del log que usó la prueba.",
        "La anomalía estadística (rojo) es prioridad de verificación, no prueba de fraude, error o irregularidad: señala la sección para verificarla con el acta de la mesa, el boletín impreso y los registros de la urna. Informativo (amarillo) es un evento registrado para verificación, por debajo del criterio de anomalía."],
      k_com: "Secciones con log leído", k_com_sub: (n) => `${n} sin log legible`, k_votos: "Votos en el log", k_votos_sub: (n) => `en ${n} secciones`,
      k_apos: "Votos después del horario oficial", k_apos_sub: (p, s) => `${p} de los votos del log · en ${s} secciones`,
      k_1h: "Votos 1 h o más después del horario", k_1h_sub: (s) => `en ${s} secciones`, k_sd: "Habilitados sin huella después del horario", k_sd_sub: "electores, según el log",
      k_a: "Anomalías estadísticas", k_a_sub: "sumando las 14 pruebas", k_i: "Informativos", k_i_sub: "sumando las 14 pruebas",
      k_sin: "Secciones con alguna señal", k_sin_sub: "en al menos una prueba L",
      faixas_t: "Las 14 pruebas en la 1.ª vuelta", faixas_n: "Secciones señaladas en cada prueba: en rojo, las anomalías; en amarillo, los informativos. Haga clic en una prueba para ver la lista.",
      ufs_t: "Por estado", ufs_n: "Secciones con señal en alguna prueba L. Haga clic en un estado para filtrar la lista.",
      lista_t: "Secciones señaladas", f_teste: "Prueba", f_nivel: "Nivel", n_ops: { "": "Todos", a: "Anomalías", i: "Informativos" },
      f_uf: "Estado", f_uf_todos: "Todos los estados", f_mun: "Municipio", f_mun_ph: "Escriba el nombre", limpar: "Limpiar filtros",
      info: (n, tot, todas) => (todas ? `${tot} secciones` : `${n} de ${tot} secciones con estos filtros`),
      csv: "Descargar esta lista (CSV)", nota_h: "Horarios: reloj de la urna, en la hora local del municipio. El fin oficial es a las 17 h de Brasilia, en hora local.",
      leg: "Leyenda de la prueba",
      col: { uf: "UF", municipio: "Municipio", zona: "Zona", secao: "Sección", nivel: "Nivel", cat: "Qué se\nencontró" },
      cols: { v_apos: "Votos después\ndel horario", v_apos_1h: "Votos 1 h\no más después", ult_apos_min: "Último voto\ndespués del horario", sd_apos: "Sin huella\ndespués del horario",
        n_votos: "Votos\nen el log", fim_local: "Fin oficial\n(hora local)", z: "Puntuación z", rajada_max: "Mayor ráfaga\n(votos)", n_rajadas: "Ráfagas", int_mediano: "Tiempo mediano\nentre votos",
        n_sem_digital: "Sin huella\n(electores)", seq_sem_digital: "Mayor secuencia\nsin huella", pct_digital: "Votaron\ncon huella", erro: "Error de la\nurna cerca",
        v_pos_sim: "Votos después\ndel SÍ", v_pos_nao: "Votos después\ndel NO", n_religamentos: "Reencendidos", n_bateria: "Avisos de\nbatería", n_desligada: "Apagados",
        v_urna_desligada: "Votos con la\nurna apagada", min_parada: "Tiempo\nparada", n_urnas_voto: "Urnas\ncon votos", v_sobreposto: "Votos en la urna\nanterior después\ndel cambio",
        n_urnas: "Urnas\nen el log", n_tentativas: "Intentos", tentativas_seguidas: "Mayor\nsecuencia", taxa: "Proporción de\natenciones", q: "q (FDR)",
        n_nao_concluidos: "Votos no\nconcluidos", n_enc_cedo: "Intentos\nantes de la hora", n_enc_depois: "Intentos\ndespués de la hora", liberado: "Cierre\nliberado a las",
        encerramento: "Cierre\n(boletín)", t_ligada: "Urna\nencendida", t_zeresima: "Zerésima", t_primeiro_voto: "1.er voto", abertura: "Apertura\n(boletín)",
        ajuste_durante: "Ajustes durante\nla votación", ajuste_fora: "Ajustes fuera\nde la votación", dif_relogio_min: "Diferencia\nlog × boletín", versao: "Versión", modelo: "Modelo",
        observado: "En el log", pct_sem_digital: "Sin huella", pct_4_tentativas: "4 lecturas\no más", comp_bu: "Comparecencia\n(boletín)", dif_bu: "Diferencia" },
      sim: "Sí", nao: "—",
      como_t: "Cómo leer",
      como: ["La anomalía estadística (rojo) es prioridad de verificación. No es prueba de fraude, error o irregularidad: señala la sección para verificarla con el acta de la mesa, el boletín impreso y los registros de la urna.",
        "Informativo (amarillo) es un evento registrado para verificación, sin alcanzar el criterio de anomalía.",
        "Los horarios son los del reloj de la urna, en la hora local del municipio.",
        "El sitio guarda solo números tomados del log. No se publica ningún número de título (de elector o de miembro de mesa) ni ningún archivo .logjez o logd.dat."],
      rel: "Informe Técnico de la 1.ª vuelta (Anexo B)", tardio: "Urnas que cerraron tarde",
      arq_t: "Archivos y fuentes", arq: ["Lista de cada prueba (JSON)", "Qué encontró cada prueba en cada sección (JSON, un archivo por zona)", "Scripts de esta página"],
      arq_n: "Los archivos se generan a partir del paquete de resultados del motor (logs_sinalizacoes.csv y logs_secoes.csv.gz) y de los resúmenes numéricos de los logs leídos por el motor.",
      p_teste: "Qué encontró la prueba en esta urna", p_crit: "Criterio de la prueba", p_dia: "Línea del día (reloj de la urna)", p_urna: "Urna", p_outros: "Otras pruebas del log en esta sección",
      p_nenhum_outro: "Ninguna otra prueba del log señaló esta sección.", p_sem_det: "No se encontró el detalle de esta prueba para esta sección.",
      p_nota: "La anomalía estadística no es prueba de fraude, error o irregularidad: indica prioridad de verificación documental (acta de la mesa, boletín impreso y registros de la urna).",
      marcos: { lig: "Urna encendida", zer: "Zerésima impresa", pr: "Urna lista para votos", ini: "Inicio oficial (hora local)", v1: "1.er voto registrado", fim: "Fin oficial (hora local)",
        vu: "Último voto registrado", enc: "Cierre confirmado", bu: "Boletín de urna impreso" },
      u_num: "Número de la urna (boletín)", u_mod: "Modelo", u_ver: "Versión del software", u_carga: "Código de carga (boletín)", u_agreg: "Secciones agregadas",
      u_th: ["Urna", "1.er registro", "Último registro", "Votos", "Versión", "Modelo"], u_th_carga: ["Carga", "Carga hecha para (municipio · zona · sección)"], u_vref: (v) => `Versión de referencia de la 1.ª vuelta: ${v}`,
      ver: { L02: (n) => `Ver el horario de cada voto (${n})`, L03: (n) => `Ver los votos de la secuencia sin huella (${n})`, L04: (n) => `Ver los votos después de la respuesta (${n})`,
        L05: (n) => `Ver las interrupciones (${n})`, L06: () => "Ver las urnas y los votos de cada una", L07: (n) => `Ver los intentos (${n})`, L08: (n) => `Ver los votos no concluidos (${n})`,
        L09: (n) => `Ver los intentos de cierre (${n})`, L10: () => "Ver la apertura de la urna", L11: (n) => `Ver los ajustes del reloj (${n})`, L12: () => "Ver versión, modelo y carga",
        L13: () => "Ver cómo se habilitó a los electores", L14: () => "Ver log × boletín" },
      ir: { L02: "Ver el horario de cada voto", L03: "Ver los votos sin huella", L04: "Ver el horario de los votos", L05: "Ver las interrupciones", L06: "Ver las urnas usadas", L07: "Ver los intentos",
        L08: "Ver los no concluidos", L09: "Ver los intentos de cierre", L10: "Ver la apertura de la urna", L11: "Ver los ajustes del reloj", L12: "Ver versión y carga",
        L13: "Ver la biometría", L14: "Ver log × boletín" },
      dica: (toque, o) => `${toque ? "Toque" : "Haga clic"} aquí y vea ${o}.`,
      dica_o: { L02: "la hora exacta de cada voto y las ráfagas", L03: "cada voto de la secuencia sin huella, con la hora", L04: "los votos registrados después de la respuesta, con la hora",
        L05: "cada apagado, reencendido y aviso de batería", L06: "las urnas usadas y los votos de cada una", L07: "cada intento, con la hora", L08: "cada voto no concluido, con la hora",
        L09: "cada intento de cerrar la votación", L10: "la hora en que se encendió la urna, la zerésima y el 1.er voto", L11: "cada ajuste del reloj de la urna", L12: "la versión, el modelo y la carga de cada urna",
        L13: "cómo se habilitó a cada elector", L14: "los votos del log y la comparecencia del boletín" },
      esconder: "Ocultar", gap: (n) => `… ${n} ${n === 1 ? "voto no listado" : "votos no listados"} …`, ev_gap: (n) => `… ${n} registros más no listados`,
      th_hora: "Hora", th_reg: "Registro", th_urna: "Urna",
      ev: { z: "Zerésima impresa", pr: "Urna lista para recibir votos", pa: "Voto parcial: elector suspendido, votos restantes nulos", dh: "Fecha y hora de la urna ajustadas", er: "Error registrado por la urna" },
      raj: (a, b, n, d) => `Ráfaga: votos ${a} a ${b} (${n} votos seguidos en ${d}, todos habilitados sin huella, con hasta 30 s entre uno y otro).`,
      sem_raj: "Ninguna ráfaga de 5 votos o más sin huella en esta urna.",
      hist_t: "Tiempo entre un voto y el siguiente", hist: ["hasta 30 s", "31 s a 1 min", "1 a 2 min", "2 a 5 min", "5 a 15 min", "más de 15 min"],
      seq: (a, b, n, h1, h2) => `Secuencia: votos ${a} a ${b} (${n} habilitaciones seguidas sin huella), de las ${h1} a las ${h2}.`,
      seq_erro: (hs) => `Errores registrados por la urna cerca de la secuencia: ${hs}.`,
      lib_t: "Cómo se habilitó a los electores (todo el día)", lib3: ["Con la huella del elector", "Huella no reconocida (año de nacimiento)", "Sin huella registrada (año de nacimiento)"],
      lib13: (k) => (k === 9 ? "Huella en la 9.ª lectura o más" : `Huella en la ${k}.ª lectura`), lib13_x: ["Huella no reconocida (año de nacimiento)", "Sin huella registrada (año de nacimiento)", "No identificada"],
      lib_mes: "Habilitados sin huella con la huella del miembro de mesa", lib_cpf: "Identificados por el CPF",
      l04_t: "Respuestas y pasos del cierre", l04_v: (n) => `Votos registrados después de la 1.ª respuesta (${n})`,
      l05_t: "Interrupciones del día", l05_vd: (n) => `Votos registrados con la urna apagada (${n})`,
      l06_t: "Urnas usadas en el día", l06_sob: (n) => `Votos registrados en la urna anterior después del 1.er voto de la nueva (${n})`, l06_nenhum: "Ningún voto en la urna anterior después del cambio.",
      l07_cont: ["Elector que ya había votado", "Identificador no encontrado en la sección", "Elector impedido"], l07_seq: (n, a, b, c) => `Mayor secuencia sin voto entre los intentos: ${n} × “${c}”, de las ${a} a las ${b}.`,
      l09_lib: (h) => `La urna solo libera el cierre después de las ${h} (17 h de Brasilia, en hora local).`,
      l11_dh: (n) => `Ajustes de fecha y hora (${n})`, l11_volta: (n) => `Reloj atrasado (${n})`, l11_volta_v: (s) => `volvió ${s}`, l11_cmp: "Log × boletín",
      l11_th: ["", "Log", "Boletín", "Diferencia"], l11_ab: "Apertura (urna lista)", l11_en: "Cierre",
      l14_t: "Votos del log × comparecencia del boletín", l14_log: "Votos en el log", l14_bu: "Comparecencia en el boletín", l14_dif: "Diferencia",
      vazio: "Ningún registro.",
      sec_t: "Log de la urna (pruebas L01 a L14)", sec_sem: "Sin log legible para esta sección en la 1.ª vuelta (prueba L14).",
      sec_ok: "Ninguna señal en las 14 pruebas del log.", sec_carregando: "Cargando las pruebas del log…",
      sec_leg: "Observado y referencia: vea la explicación de cada prueba en la página Las 35 pruebas.",
      th_mun: "Municipio", th_zona: "Zona", th_secao: "Sección", th_nivel: "Nivel", th_cat: "Qué se encontró", th_obs: "Observado", th_ref: "Referencia", th_det: "Detalle", th_qtd: "Cantidad",
      th_teste: "Prueba", th_un: "Secciones analizadas",
      res_t1: "1.ª vuelta", res_t2: "2.ª vuelta", and_t2: "En curso",
      bloco_l: "14 pruebas · L01 a L14 · 1.ª vuelta concluida; 2.ª vuelta en curso",
      bloco_l_p: "Usan el log de cada urna, que registra la hora de cada voto y de cada evento del día. Los resultados de la 1.ª vuelta están publicados; los logs de la 2.ª vuelta se están descargando del TSE.",
      tag_l: "1.ª vuelta concluida",
      f_obj: "Objetivo", ver_secoes: "Ver las secciones", cats_t: "Qué se encontró en la 1.ª vuelta",
      aud_nota: "Las 14 pruebas de los logs ya se concluyeron en la 1.ª vuelta y están publicadas. La 2.ª vuelta está en curso.",
      aud_meio: "1.ª vuelta concluida",
      erro: "No se pudieron cargar los datos de esta prueba.",
    },
  };
  ["PT", "EN", "ES"].forEach((lg) => { if (I[lg]) { I[lg].nav.logs = TXT[lg].nav; } });
  // cartão da página na inicial e na busca
  const PG2 = {
    PT: ["Logs das urnas", "Os 14 testes do log de cada urna no 1º turno: lista por teste e, em cada seção, o que o teste apurou e a hora de cada voto."],
    EN: ["Voting machine logs", "The 14 tests on each machine's log in round 1: list by test and, for each section, what the test found and the time of each vote."],
    ES: ["Logs de las urnas", "Las 14 pruebas del log de cada urna en la 1.ª vuelta: lista por prueba y, en cada sección, qué encontró la prueba y la hora de cada voto."],
  };
  ["PT", "EN", "ES"].forEach((lg) => { if (I[lg] && I[lg].pg2) I[lg].pg2.logs = PG2[lg]; });
  // descrição dos arquivos novos do pacote na página Downloads
  const DESC = {
    PT: { "dados/logs_sinalizacoes.csv": "Testes L01 a L14: todas as sinalizações, seção por seção", "dados/logs_secoes.csv.gz": "Testes L01 a L14: medidas do log de cada seção (compactado)",
      "dados/logs_falhas.csv": "Seções sem log legível (teste L14)", "dados/resumo_testes.csv": "Resumo dos testes: ocorrências de cada teste" },
    EN: { "dados/logs_sinalizacoes.csv": "Tests L01 to L14: every flag, section by section", "dados/logs_secoes.csv.gz": "Tests L01 to L14: log measures of each section (compressed)",
      "dados/logs_falhas.csv": "Sections with no readable log (test L14)", "dados/resumo_testes.csv": "Test summary: occurrences of each test" },
    ES: { "dados/logs_sinalizacoes.csv": "Pruebas L01 a L14: todas las señales, sección por sección", "dados/logs_secoes.csv.gz": "Pruebas L01 a L14: medidas del log de cada sección (comprimido)",
      "dados/logs_falhas.csv": "Secciones sin log legible (prueba L14)", "dados/resumo_testes.csv": "Resumen de las pruebas: ocurrencias de cada prueba" },
  };
  ["PT", "EN", "ES"].forEach((lg) => { if (I[lg] && I[lg].dl_desc) Object.assign(I[lg].dl_desc, DESC[lg]); });
  // página Programadores: arquivos de dados dos testes L
  const DV = {
    PT: { "logs/t1/resumo.json": ["Testes L01 a L14 no 1º turno: números de cada teste, categorias e textos do motor.", [["testes.{L01…L14}", "unidades, a (anomalias), i (informativos), cats [categoria, nível, quantidade]"], ["geral", "votos depois do horário oficial (L01)"], ["ufs.{UF}", "a, i, seções com sinalização"]]],
      "logs/t1/{UF}.json": ["Seções de um estado com sinalização em algum teste L (1º turno).", [["campos", "mun, zona, secao, teste, nivel, cat, obs, ref, det"], ["sem_log[]", "[zona, seção] sem log legível"]]],
      "logs/t1/teste/{Lxx}.json": ["Seções sinalizadas em um teste L, com as medidas do motor em colunas próprias do teste.", [["c", "uf, cod_mun, zona, secao, nivel, cat e as medidas do teste"], ["l[]", "uma linha por seção (anomalias primeiro)"]]],
      "logs/t1/det/{UF}/{zona}.json": ["O que cada teste L apurou em cada seção sinalizada da zona (horas em segundos desde 0h, relógio da urna).", [["s.{seção}.m", "urna ligada, zerésima, pronta, 1º voto, último voto, encerramento, boletim impresso"], ["s.{seção}.{Lxx}", "votos (partes [índice, intervalo, [[hora, liberação, cabine, marcas]]]) ou registros [hora, código]"]]] },
    EN: { "logs/t1/resumo.json": ["Tests L01 to L14 in round 1: figures for each test, categories and the engine's texts.", [["testes.{L01…L14}", "unidades, a (anomalies), i (informational), cats [category, level, count]"], ["geral", "votes after the official time (L01)"], ["ufs.{UF}", "a, i, flagged sections"]]],
      "logs/t1/{UF}.json": ["A state's sections flagged in any L test (round 1).", [["campos", "mun, zona, secao, teste, nivel, cat, obs, ref, det"], ["sem_log[]", "[zone, section] with no readable log"]]],
      "logs/t1/teste/{Lxx}.json": ["Sections flagged in an L test, with the engine's measures in the test's own columns.", [["c", "uf, cod_mun, zona, secao, nivel, cat and the test's measures"], ["l[]", "one row per section (anomalies first)"]]],
      "logs/t1/det/{UF}/{zona}.json": ["What each L test found in each flagged section of the zone (times in seconds since midnight, machine clock).", [["s.{section}.m", "machine on, zero report, ready, 1st vote, last vote, closing, tally sheet printed"], ["s.{section}.{Lxx}", "votes (parts [index, interval, [[time, release, booth, flags]]]) or records [time, code]"]]] },
    ES: { "logs/t1/resumo.json": ["Pruebas L01 a L14 en la 1.ª vuelta: números de cada prueba, categorías y textos del motor.", [["testes.{L01…L14}", "unidades, a (anomalías), i (informativos), cats [categoría, nivel, cantidad]"], ["geral", "votos después del horario oficial (L01)"], ["ufs.{UF}", "a, i, secciones con señal"]]],
      "logs/t1/{UF}.json": ["Secciones de un estado con señal en alguna prueba L (1.ª vuelta).", [["campos", "mun, zona, secao, teste, nivel, cat, obs, ref, det"], ["sem_log[]", "[zona, sección] sin log legible"]]],
      "logs/t1/teste/{Lxx}.json": ["Secciones señaladas en una prueba L, con las medidas del motor en columnas propias de la prueba.", [["c", "uf, cod_mun, zona, secao, nivel, cat y las medidas de la prueba"], ["l[]", "una fila por sección (anomalías primero)"]]],
      "logs/t1/det/{UF}/{zona}.json": ["Qué encontró cada prueba L en cada sección señalada de la zona (horas en segundos desde las 0 h, reloj de la urna).", [["s.{sección}.m", "urna encendida, zerésima, lista, 1.er voto, último voto, cierre, boletín impreso"], ["s.{sección}.{Lxx}", "votos (partes [índice, intervalo, [[hora, habilitación, cabina, marcas]]]) o registros [hora, código]"]]] },
  };
  ["PT", "EN", "ES"].forEach((lg) => { if (I[lg] && I[lg].ex && I[lg].ex.dv_desc) Object.assign(I[lg].ex.dv_desc, DV[lg]); });
  const L = () => TXT[A.state.lang] || TXT.PT;
  // subpágina Achados em destaque (#/logs/destaques): textos de cada achado; números vêm de t1/destaques.json (destaques.py)
  const TXT_DZ = {
    PT: {
      titulo: "Achados em destaque · Logs das urnas",
      sub: "Os achados dos testes do log que mais merecem atenção no 1º turno. Em vermelho, prioridade alta; em amarelo, prioridade média. Clique em uma seção da lista e veja o que o teste encontrou naquela urna.",
      cta_k: "Merecem atenção", cta_t: "Achados em destaque",
      cta_p: "O log que não bate com o boletim de urna, a carga da urna diferente, o relógio ajustado durante a votação, tentativas fora do padrão e votos com a urna marcada como desligada.",
      cta_b: "Ver os achados", cta_n: (a, m) => [`${a} seções · prioridade alta`, `${m} seções · prioridade média`],
      oque_t: "O que esta página mostra",
      oque: ["Dos 14 testes do log, esta página separa os achados que mais merecem conferência, cada um com a lista das suas seções.",
        "Prioridade alta (vermelho): o log da urna não bate com o boletim de urna. Prioridade média (amarelo): eventos raros, que pedem conferência com a ata da mesa.",
        "Cada linha abre o mesmo painel da página Logs das urnas: o que o teste apurou na urna, a linha do dia, as urnas usadas e os registros do log.",
        "Anomalia estatística não é prova de fraude, erro ou irregularidade: indica prioridade de verificação documental (ata da mesa, boletim impresso e registros da urna)."],
      voltar: "Logs das urnas", p: { a: "Prioridade alta", m: "Prioridade média" },
      kt: { log_bu: "Log × boletim de urna", carga: "Carga diferente do boletim", relogio: "Relógio ajustado na votação", tentativas: "Tentativas fora do padrão", desligada: "Votos com a urna desligada" },
      k_tot: "Seções em destaque", k_tot_sub: (n) => `em ${n} achados`, k_sub: { a: "seções · prioridade alta", m: "seções · prioridade média" },
      faixas_t: "Os achados", faixas_n: "Em vermelho, prioridade alta; em amarelo, prioridade média. Clique em um achado para ver a lista das seções.",
      lista_t: "Seções do achado", f_grupo: "Achado", h_dest: "Casos que chamam atenção", h_porque: "Por que merece atenção", h_conferir: "O que conferir",
      abrir: "Abrir o painel desta seção", ver_teste: (id) => `Todas as seções do teste ${id}`,
      g: {
        log_bu: { t: "Menos votos no log do que no boletim de urna",
          a: (n, x) => `Em ${n} seções, o log da urna registra menos votos do que o comparecimento do boletim de urna: ${x.votos_a_menos} votos a menos, somando todas. Em 8 delas a diferença é de 1 ou 2 votos.`,
          d: [["BA", 183, 175, "Teixeira de Freitas (BA), zona 183, seção 175: 236 votos no log e 272 no boletim (36 a menos). A seção usou 3 urnas; a 2ª não tem os dados de carga no log."],
            ["SP", 2, 35, "São Paulo (SP), zona 2, seção 35: 232 votos no log e 247 no boletim (15 a menos). O log começa às 10:18, mas o boletim registra a abertura às 09:34: o começo do dia não está no log."],
            ["RJ", 87, 184, "São Gonçalo (RJ), zona 87, seção 184: 2 votos a menos. A mesma seção aparece também nos testes L05 (interrupções) e L11 (relógio ajustado)."]],
          w: "O boletim de urna é o resultado oficial da seção, e o log deveria registrar cada um desses votos. Quando os dois não batem, falta parte do log ou houve algo na seção que precisa ser conferido.",
          c: "A ata da mesa (troca de urna, interrupções), o boletim impresso e o log de todas as urnas usadas na seção." },
        carga: { t: "Código de carga no log diferente do boletim",
          a: (n) => `Em ${n} seções, o código de carga da urna registrado no log é diferente do código impresso no boletim de urna.`,
          d: [["PR", 3, 495, "Curitiba (PR), zona 3, seção 495: carga 255058257780317989897007 no log e 255058797790135151522313 no boletim."],
            ["SC", 27, 56, "São Francisco do Sul (SC), zona 27, seções 56 e 57: o log de cada uma é de uma urna de contingência preparada para Araquari (SC)."],
            ["AL", 22, 581, "Arapiraca (AL), zona 22, seção 581, e Nanuque (MG), zona 190, seção 107: a carga do log é diferente da carga do boletim."]],
          w: "O código de carga identifica a preparação da urna para a seção. Log e boletim com cargas diferentes indicam que o log pode ser de outra urna ou de outra preparação.",
          c: "A ata da mesa (troca de urna, urna de contingência), o boletim impresso e o registro de carga das urnas da zona eleitoral." },
        relogio: { t: "Relógio da urna ajustado durante a votação",
          a: (n, x) => `Em ${n} seções, a data e a hora da urna foram ajustadas com a votação aberta. ${x.exterior} delas ficam no exterior.`,
          d: [["RJ", 87, null, "São Gonçalo (RJ), zona 87: 15 seções."], ["BA", null, null, "Salvador (BA): 10 seções."],
            ["ZZ", null, null, "Exterior: Boston (5 seções), Washington (3) e Milão (3)."], ["SC", 46, 38, "Taió (SC), zona 46: 3 seções, com 2 ajustes em cada uma."]],
          w: "Ajustar o relógio no meio da votação muda a hora registrada dos votos seguintes e dificulta conferir o horário de cada voto.",
          c: "A ata da mesa (registro do ajuste e do motivo) e a diferença entre o relógio do log e os horários do boletim." },
        tentativas: { t: "Tentativas de liberar eleitor fora do padrão",
          a: (n, x) => `Em ${n} seções, as tentativas de liberar eleitor que não deram certo (eleitor que já tinha votado, não encontrado na seção ou impedido) ficaram muito acima do esperado. Em ${x.uma_por_voto}, há perto de uma tentativa para cada voto: a lista começa por elas.`,
          d: [["RJ", 156, 380, "Nova Iguaçu (RJ), zona 156, seção 380: 303 tentativas em 298 votos."], ["DF", 6, 425, "Brasília (DF), zona 6, seção 425: 269 tentativas em 263 votos."],
            ["MA", 22, 157, "Balsas (MA), zona 22, seção 157: 290 tentativas em 297 votos."],
            [null, null, null, "Nessas seções, a tentativa é quase sempre de “eleitor que já votou”, cerca de 15 segundos depois de cada voto. A urna recusou todas: nenhuma virou voto."]],
          w: "O padrão, voto após voto, é raro. Uma explicação possível é o mesário digitar de novo o título do eleitor que acabou de votar; só a conferência na seção confirma.",
          c: "A ata da mesa e o caderno de votação (eleitores que compareceram)." },
        desligada: { t: "Votos com a urna marcada como desligada",
          a: (n, x) => `Em ${n} seções, o log grava votos depois de um registro de urna desligada e antes do registro seguinte de urna ligada: ${x.votos} votos no total.`,
          d: [["ZZ", 1, 1162, "Miami (exterior), zona 1, seção 1162: 35 votos."], ["PA", 73, 291, "Belém (PA), zona 73, seção 291: 18 votos."],
            [null, null, null, "Afuá (PA), Cordeiros (BA) e Recife (PE): 4 votos, somando as três."]],
          w: "Uma urna desligada não grava votos. Pode ser efeito da forma como o log registra a hora de religar a urna; por isso está na lista para conferência.",
          c: "O log completo da urna (registros de ligar e desligar) e a ata da mesa (interrupções)." },
      },
    },
    EN: {
      titulo: "Key findings · Voting machine logs",
      sub: "The log test findings that most deserve attention in round 1. In red, high priority; in yellow, medium priority. Click a section on the list to see what the test found on that machine.",
      cta_k: "Deserve attention", cta_t: "Key findings",
      cta_p: "The log that does not match the tally sheet, a different machine load, the clock adjusted during voting, attempts outside the pattern and votes with the machine marked as off.",
      cta_b: "See the findings", cta_n: (a, m) => [`${a} sections · high priority`, `${m} sections · medium priority`],
      oque_t: "What this page shows",
      oque: ["Out of the 14 log tests, this page separates the findings that most deserve checking, each with the list of its sections.",
        "High priority (red): the machine log does not match the tally sheet. Medium priority (yellow): rare events that call for checking against the polling station minutes.",
        "Each row opens the same panel as the Voting machine logs page: what the test found on the machine, the timeline of the day, the machines used and the log records.",
        "A statistical anomaly is not proof of fraud, error or irregularity: it sets a priority for documentary checking (polling station minutes, printed tally sheet and machine records)."],
      voltar: "Voting machine logs", p: { a: "High priority", m: "Medium priority" },
      kt: { log_bu: "Log × tally sheet", carga: "Load differs from the tally sheet", relogio: "Clock adjusted during voting", tentativas: "Attempts outside the pattern", desligada: "Votes with the machine off" },
      k_tot: "Sections in the findings", k_tot_sub: (n) => `in ${n} findings`, k_sub: { a: "sections · high priority", m: "sections · medium priority" },
      faixas_t: "The findings", faixas_n: "In red, high priority; in yellow, medium priority. Click a finding to see its list of sections.",
      lista_t: "Sections in the finding", f_grupo: "Finding", h_dest: "Cases that stand out", h_porque: "Why it deserves attention", h_conferir: "What to check",
      abrir: "Open this section's panel", ver_teste: (id) => `All sections in test ${id}`,
      g: {
        log_bu: { t: "Fewer votes in the log than on the tally sheet",
          a: (n, x) => `In ${n} sections, the machine log records fewer votes than the turnout on the tally sheet: ${x.votos_a_menos} votes fewer, adding them all. In 8 of them the difference is 1 or 2 votes.`,
          d: [["BA", 183, 175, "Teixeira de Freitas (BA), zone 183, section 175: 236 votes in the log and 272 on the tally sheet (36 fewer). The section used 3 machines; the 2nd has no load data in the log."],
            ["SP", 2, 35, "São Paulo (SP), zone 2, section 35: 232 votes in the log and 247 on the tally sheet (15 fewer). The log starts at 10:18, but the tally sheet records the opening at 09:34: the start of the day is not in the log."],
            ["RJ", 87, 184, "São Gonçalo (RJ), zone 87, section 184: 2 votes fewer. The same section also shows up in tests L05 (interruptions) and L11 (clock adjusted)."]],
          w: "The tally sheet is the section's official result, and the log should record each of those votes. When the two do not match, part of the log is missing or something happened in the section that needs checking.",
          c: "The polling station minutes (machine replacement, interruptions), the printed tally sheet and the log of every machine used in the section." },
        carga: { t: "Load code in the log differs from the tally sheet",
          a: (n) => `In ${n} sections, the machine load code recorded in the log differs from the code printed on the tally sheet.`,
          d: [["PR", 3, 495, "Curitiba (PR), zone 3, section 495: load 255058257780317989897007 in the log and 255058797790135151522313 on the tally sheet."],
            ["SC", 27, 56, "São Francisco do Sul (SC), zone 27, sections 56 and 57: each log is from a backup machine prepared for Araquari (SC)."],
            ["AL", 22, 581, "Arapiraca (AL), zone 22, section 581, and Nanuque (MG), zone 190, section 107: the load in the log differs from the load on the tally sheet."]],
          w: "The load code identifies how the machine was prepared for the section. A log and a tally sheet with different loads suggest the log may be from another machine or another preparation.",
          c: "The polling station minutes (machine replacement, backup machine), the printed tally sheet and the load record of the zone's machines." },
        relogio: { t: "Machine clock adjusted during voting",
          a: (n, x) => `In ${n} sections, the machine's date and time were adjusted while voting was open. ${x.exterior} of them are abroad.`,
          d: [["RJ", 87, null, "São Gonçalo (RJ), zone 87: 15 sections."], ["BA", null, null, "Salvador (BA): 10 sections."],
            ["ZZ", null, null, "Abroad: Boston (5 sections), Washington (3) and Milan (3)."], ["SC", 46, 38, "Taió (SC), zone 46: 3 sections, with 2 adjustments in each."]],
          w: "Adjusting the clock in the middle of voting changes the recorded time of the following votes and makes it harder to check the time of each vote.",
          c: "The polling station minutes (record of the adjustment and its reason) and the difference between the log clock and the tally sheet times." },
        tentativas: { t: "Attempts to release a voter outside the pattern",
          a: (n, x) => `In ${n} sections, the failed attempts to release a voter (voter who had already voted, not found in the section or barred) were far above what is expected. In ${x.uma_por_voto}, there is about one attempt for each vote: the list starts with them.`,
          d: [["RJ", 156, 380, "Nova Iguaçu (RJ), zone 156, section 380: 303 attempts in 298 votes."], ["DF", 6, 425, "Brasília (DF), zone 6, section 425: 269 attempts in 263 votes."],
            ["MA", 22, 157, "Balsas (MA), zone 22, section 157: 290 attempts in 297 votes."],
            [null, null, null, "In these sections, the attempt is almost always “voter has already voted”, about 15 seconds after each vote. The machine refused them all: none became a vote."]],
          w: "The pattern, vote after vote, is rare. One possible explanation is the poll worker typing again the ID of the voter who has just voted; only checking at the section confirms it.",
          c: "The polling station minutes and the voting register (voters who turned up)." },
        desligada: { t: "Votes with the machine marked as off",
          a: (n, x) => `In ${n} sections, the log records votes after a machine-off record and before the next machine-on record: ${x.votos} votes in total.`,
          d: [["ZZ", 1, 1162, "Miami (abroad), zone 1, section 1162: 35 votes."], ["PA", 73, 291, "Belém (PA), zone 73, section 291: 18 votes."],
            [null, null, null, "Afuá (PA), Cordeiros (BA) and Recife (PE): 4 votes, adding the three."]],
          w: "A machine that is off does not record votes. It may be an effect of how the log records the time the machine is turned back on; that is why it is on the list for checking.",
          c: "The machine's full log (on and off records) and the polling station minutes (interruptions)." },
      },
    },
    ES: {
      titulo: "Hallazgos destacados · Logs de las urnas",
      sub: "Los hallazgos de las pruebas del log que más merecen atención en la 1.ª vuelta. En rojo, prioridad alta; en amarillo, prioridad media. Haga clic en una sección de la lista y vea qué encontró la prueba en esa urna.",
      cta_k: "Merecen atención", cta_t: "Hallazgos destacados",
      cta_p: "El log que no coincide con el boletín de urna, la carga de la urna distinta, el reloj ajustado durante la votación, intentos fuera del patrón y votos con la urna marcada como apagada.",
      cta_b: "Ver los hallazgos", cta_n: (a, m) => [`${a} secciones · prioridad alta`, `${m} secciones · prioridad media`],
      oque_t: "Qué muestra esta página",
      oque: ["De las 14 pruebas del log, esta página separa los hallazgos que más merecen verificación, cada uno con la lista de sus secciones.",
        "Prioridad alta (rojo): el log de la urna no coincide con el boletín de urna. Prioridad media (amarillo): eventos raros, que piden verificación con el acta de la mesa.",
        "Cada fila abre el mismo panel de la página Logs de las urnas: qué encontró la prueba en la urna, la línea del día, las urnas usadas y los registros del log.",
        "Una anomalía estadística no es prueba de fraude, error o irregularidad: indica prioridad de verificación documental (acta de la mesa, boletín impreso y registros de la urna)."],
      voltar: "Logs de las urnas", p: { a: "Prioridad alta", m: "Prioridad media" },
      kt: { log_bu: "Log × boletín de urna", carga: "Carga distinta del boletín", relogio: "Reloj ajustado en la votación", tentativas: "Intentos fuera del patrón", desligada: "Votos con la urna apagada" },
      k_tot: "Secciones destacadas", k_tot_sub: (n) => `en ${n} hallazgos`, k_sub: { a: "secciones · prioridad alta", m: "secciones · prioridad media" },
      faixas_t: "Los hallazgos", faixas_n: "En rojo, prioridad alta; en amarillo, prioridad media. Haga clic en un hallazgo para ver la lista de secciones.",
      lista_t: "Secciones del hallazgo", f_grupo: "Hallazgo", h_dest: "Casos que llaman la atención", h_porque: "Por qué merece atención", h_conferir: "Qué verificar",
      abrir: "Abrir el panel de esta sección", ver_teste: (id) => `Todas las secciones de la prueba ${id}`,
      g: {
        log_bu: { t: "Menos votos en el log que en el boletín de urna",
          a: (n, x) => `En ${n} secciones, el log de la urna registra menos votos que la participación del boletín de urna: ${x.votos_a_menos} votos menos, sumando todas. En 8 de ellas la diferencia es de 1 o 2 votos.`,
          d: [["BA", 183, 175, "Teixeira de Freitas (BA), zona 183, sección 175: 236 votos en el log y 272 en el boletín (36 menos). La sección usó 3 urnas; la 2.ª no tiene los datos de carga en el log."],
            ["SP", 2, 35, "São Paulo (SP), zona 2, sección 35: 232 votos en el log y 247 en el boletín (15 menos). El log empieza a las 10:18, pero el boletín registra la apertura a las 09:34: el comienzo del día no está en el log."],
            ["RJ", 87, 184, "São Gonçalo (RJ), zona 87, sección 184: 2 votos menos. La misma sección aparece también en las pruebas L05 (interrupciones) y L11 (reloj ajustado)."]],
          w: "El boletín de urna es el resultado oficial de la sección, y el log debería registrar cada uno de esos votos. Cuando los dos no coinciden, falta parte del log o hubo algo en la sección que hay que verificar.",
          c: "El acta de la mesa (cambio de urna, interrupciones), el boletín impreso y el log de todas las urnas usadas en la sección." },
        carga: { t: "Código de carga en el log distinto del boletín",
          a: (n) => `En ${n} secciones, el código de carga de la urna registrado en el log es distinto del código impreso en el boletín de urna.`,
          d: [["PR", 3, 495, "Curitiba (PR), zona 3, sección 495: carga 255058257780317989897007 en el log y 255058797790135151522313 en el boletín."],
            ["SC", 27, 56, "São Francisco do Sul (SC), zona 27, secciones 56 y 57: el log de cada una es de una urna de contingencia preparada para Araquari (SC)."],
            ["AL", 22, 581, "Arapiraca (AL), zona 22, sección 581, y Nanuque (MG), zona 190, sección 107: la carga del log es distinta de la carga del boletín."]],
          w: "El código de carga identifica la preparación de la urna para la sección. Un log y un boletín con cargas distintas indican que el log puede ser de otra urna o de otra preparación.",
          c: "El acta de la mesa (cambio de urna, urna de contingencia), el boletín impreso y el registro de carga de las urnas de la zona electoral." },
        relogio: { t: "Reloj de la urna ajustado durante la votación",
          a: (n, x) => `En ${n} secciones, la fecha y la hora de la urna se ajustaron con la votación abierta. ${x.exterior} de ellas están en el exterior.`,
          d: [["RJ", 87, null, "São Gonçalo (RJ), zona 87: 15 secciones."], ["BA", null, null, "Salvador (BA): 10 secciones."],
            ["ZZ", null, null, "Exterior: Boston (5 secciones), Washington (3) y Milán (3)."], ["SC", 46, 38, "Taió (SC), zona 46: 3 secciones, con 2 ajustes en cada una."]],
          w: "Ajustar el reloj en medio de la votación cambia la hora registrada de los votos siguientes y dificulta verificar el horario de cada voto.",
          c: "El acta de la mesa (registro del ajuste y del motivo) y la diferencia entre el reloj del log y los horarios del boletín." },
        tentativas: { t: "Intentos de habilitar elector fuera del patrón",
          a: (n, x) => `En ${n} secciones, los intentos fallidos de habilitar elector (elector que ya había votado, no encontrado en la sección o impedido) quedaron muy por encima de lo esperado. En ${x.uma_por_voto}, hay cerca de un intento por cada voto: la lista empieza por ellas.`,
          d: [["RJ", 156, 380, "Nova Iguaçu (RJ), zona 156, sección 380: 303 intentos en 298 votos."], ["DF", 6, 425, "Brasília (DF), zona 6, sección 425: 269 intentos en 263 votos."],
            ["MA", 22, 157, "Balsas (MA), zona 22, sección 157: 290 intentos en 297 votos."],
            [null, null, null, "En esas secciones, el intento es casi siempre de “elector que ya votó”, unos 15 segundos después de cada voto. La urna los rechazó todos: ninguno se convirtió en voto."]],
          w: "El patrón, voto tras voto, es raro. Una explicación posible es que el miembro de mesa vuelva a digitar el título del elector que acaba de votar; solo la verificación en la sección lo confirma.",
          c: "El acta de la mesa y el cuaderno de votación (electores que comparecieron)." },
        desligada: { t: "Votos con la urna marcada como apagada",
          a: (n, x) => `En ${n} secciones, el log registra votos después de un registro de urna apagada y antes del siguiente registro de urna encendida: ${x.votos} votos en total.`,
          d: [["ZZ", 1, 1162, "Miami (exterior), zona 1, sección 1162: 35 votos."], ["PA", 73, 291, "Belém (PA), zona 73, sección 291: 18 votos."],
            [null, null, null, "Afuá (PA), Cordeiros (BA) y Recife (PE): 4 votos, sumando las tres."]],
          w: "Una urna apagada no registra votos. Puede ser un efecto de la forma en que el log registra la hora de volver a encender la urna; por eso está en la lista para verificación.",
          c: "El log completo de la urna (registros de encender y apagar) y el acta de la mesa (interrupciones)." },
      },
    },
  };
  const LD = () => TXT_DZ[A.state.lang] || TXT_DZ.PT;
  A.ICO_MAIS.logs = "list";
  const iLate = A.MAIS.findIndex((x) => x[0] === "late");
  if (PUBLICADO) A.MAIS.splice(iLate >= 0 ? iLate + 1 : 1, 0, ["logs", "#/logs"]);

  // textos e números de um teste L (para a página Os 35 testes)
  const txtL = (id) => { const g = LG1(); return g ? (g.txt[A.state.lang] || g.txt.PT)[id] : null; };
  const resL = (id) => { const g = LG1(); return g ? g.testes[id] : null; };
  const catNome = (c) => { const g = LG1(); return (g && g.categorias[c] && (g.categorias[c][A.state.lang] || g.categorias[c].PT)) || c; };
  const cor = (r) => (r.a ? "red" : r.i ? "amber" : "green");

  // ------------------------------------------------------------------------------------------------ dados (com cache)
  const cache = { uf: new Map(), teste: new Map(), det: new Map() };
  function buscar(mapa, k, url, vazio) {
    if (!mapa.has(k)) {
      if (mapa.size > 60) mapa.clear();
      mapa.set(k, fetch(url).then((r) => (r.ok ? r.json() : vazio)).catch((e) => { mapa.delete(k); throw e; }));
    }
    return mapa.get(k);
  }
  const dadosUF = (uf) => buscar(cache.uf, uf, `site/data/logs/t1/${uf}.json`, { o: [], sem_log: [] });
  const dadosTeste = (id) => buscar(cache.teste, id, `site/data/logs/t1/teste/${id}.json`, { c: [], l: [] });
  const detZona = (uf, z) => buscar(cache.det, `${uf}/${z}`, `site/data/logs/t1/det/${uf}/${z}.json`, { s: {} });
  const detSecao = async (uf, z, s) => ((await detZona(uf, +z)).s || {})[String(+s)] || null;

  // ------------------------------------------------------------------------------------------------ formatos
  const dec = (x, d) => A.dec(Number(x).toFixed(d));
  const H = (s) => (s == null ? "—" : API().vh.H(s));
  const dur = (s) => (s == null ? "—" : API().vh.dur(s));
  function fmtQ(q) {
    if (q == null) return "—";
    if (q === 0) return "0";
    const e = Math.floor(Math.log10(Math.abs(q)));
    return e < -3 ? `${A.dec((q / Math.pow(10, e)).toFixed(1))}×10${String(e).replace("-", "⁻").replace(/\d/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c])}` : A.dec(String(+q.toPrecision(2)));
  }
  function fmtVal(tipo, v) {
    const E = L();
    if (v == null || v === "") return "—";
    switch (tipo) {
      case "n": return nf(v);
      case "sn": return (v > 0 ? "+" : v < 0 ? "−" : "") + nf(Math.abs(v));
      case "min": return `${v >= 0 ? "+" : "−"}${nf(Math.abs(Math.round(v)))} min`;
      case "min0": return `${nf(Math.round(v))} min`;
      case "s": return `${nf(Math.round(v))} s`;
      case "pct": return `${dec(v, 1)}%`;
      case "pct2": return `${dec(v, v < 1 ? 2 : 1)}%`;
      case "z": return dec(v, 1);
      case "q": return fmtQ(v);
      case "sim": return v ? E.sim : E.nao;
      default: return String(v);
    }
  }
  const libTxt = (c) => { const V = X().vh_lib; return /^\d$/.test(c) ? V.D(+c) : V[c] || V["?"]; };
  const semDig = (c) => c === "N" || c === "S";
  const EVK = { l: "ligada", d: "desligada", b: "bateria", r: "rede", s: "suspensa", i: "reinicio", j: "ja_votou", n: "nao_encontrado", p: "impedido", em: "enc_menu",
    ex: "enc_cancelado", ea: "enc_abortado", ts: "todos_sim", tn: "todos_nao", ok: "enc_confirmado", bu: "bu_impresso", sv: "suspenso_sem_voto", er: "erro" };
  function evTxt(c) {
    const E = L(), V = X().vh_ev || {}, i = c.indexOf(":"), k = i < 0 ? c : c.slice(0, i), h = i < 0 ? "" : c.slice(i + 1);
    if (k === "ec") return typeof V.enc_cedo === "function" ? V.enc_cedo(h || "17:00") : "enc_cedo";
    if (k === "v1") return E.marcos.v1;
    if (E.ev[k]) return E.ev[k];
    return V[EVK[k]] || k;
  }

  // ------------------------------------------------------------------------------------------------ listas do painel
  // votos em partes contíguas: [índice do 1º voto, segundos desde o anterior, [[hora, liberação, cabine, marcas(, urna)]]]
  function htmlVotos(partes, opc) {
    const E = L(), V = X(), o = opc || {}, multi = partes.some((p) => p[2].some((v) => v.length > 4)), nc = multi ? 6 : 5;
    if (!partes.length) return `<p class="small muted">${esc(E.vazio)}</p>`;
    let h = "", fimAnt = null;
    partes.forEach((p) => {
      const [i0, dt0, vs] = p;
      if (fimAnt != null && i0 > fimAnt) h += `<tr class="vh-pausa lg-gap"><td colspan="${nc}">${esc(E.gap(i0 - fimAnt))}</td></tr>`;
      vs.forEach((v, k) => {
        const n = i0 + k + 1, dt = k ? v[0] - vs[k - 1][0] : dt0;
        if (k && dt >= 900) h += `<tr class="vh-pausa"><td colspan="${nc}">${esc(V.vh_pausa(dur(dt)))}</td></tr>`;
        const cls = [semDig(v[1]) ? "vh-sd" : "", o.marca && o.marca(n) ? "lg-raj" : ""].filter(Boolean).join(" ");
        const marcas = API().vh.marcas(v[3] || 0, V).join(" · ");
        h += `<tr class="vh-v${cls ? " " + cls : ""}"><td>${nf(n)}º</td><td><b>${H(v[0])}</b></td><td>${dt == null ? "—" : esc(dur(dt))}</td><td>${esc(libTxt(v[1]))}${marcas ? `<br><small>${esc(marcas)}</small>` : ""}</td><td>${esc(dur(v[2]))}</td>${multi ? `<td>${v.length > 4 ? v[4] + 1 : 1}</td>` : ""}</tr>`;
      });
      fimAnt = i0 + vs.length;
    });
    if (o.total != null && fimAnt != null && o.total > fimAnt) h += `<tr class="vh-pausa lg-gap"><td colspan="${nc}">${esc(E.gap(o.total - fimAnt))}</td></tr>`;
    return `<div class="cq-p-tw vh-tw"><table class="cq-p-t vh-votos lg-votos"><thead><tr><th scope="col" title="${esc(V.vh_c_n_t)}">${esc(V.vh_c_n)}</th><th scope="col">${esc(V.vh_c_grav)}</th>
      <th scope="col">${esc(V.vh_c_int)}</th><th scope="col">${esc(V.vh_c_lib)}</th><th scope="col">${esc(V.vh_c_cab)}</th>${multi ? `<th scope="col">${esc(E.th_urna)}</th>` : ""}</tr></thead><tbody>${h}</tbody></table></div>`;
  }
  // registros do log [hora, código(, urna)]: repetições seguidas viram "N vezes"
  function htmlEventos(evs, corte) {
    const E = L(), V = X();
    if (!evs || !evs.length) return `<p class="small muted">${esc(E.vazio)}</p>`;
    const multi = evs.some((e) => e[2]), gr = [];
    evs.forEach((e) => { const u = gr[gr.length - 1]; if (u && u.c === e[1] && u.u === (e[2] || 0)) { u.n++; u.t2 = e[0]; } else gr.push({ c: e[1], u: e[2] || 0, t: e[0], t2: e[0], n: 1 }); });
    return `<div class="cq-p-tw vh-tw"><table class="cq-p-t vh-votos lg-evs"><thead><tr><th scope="col">${esc(E.th_hora)}</th><th scope="col">${esc(E.th_reg)}</th>${multi ? `<th scope="col">${esc(E.th_urna)}</th>` : ""}</tr></thead><tbody>
      ${gr.map((g) => `<tr><td><b>${H(g.t)}</b>${g.n > 1 ? `<br><small>${esc(H(g.t2))}</small>` : ""}</td><td>${esc(evTxt(g.c))}${g.n > 1 ? ` <small>(${esc(V.vh_ev_vezes(nf(g.n)))})</small>` : ""}</td>${multi ? `<td>${g.u + 1}</td>` : ""}</tr>`).join("")}
      ${corte ? `<tr class="vh-pausa"><td colspan="${multi ? 3 : 2}">${esc(E.ev_gap(nf(corte)))}</td></tr>` : ""}</tbody></table></div>`;
  }
  const nVotos = (partes) => partes.reduce((a, p) => a + p[2].length, 0);
  // barras horizontais (distribuições): [[rótulo, valor]]
  function htmlBarras(ls, tot) {
    const mx = Math.max(1, ...ls.map((x) => x[1]));
    return `<div class="cq-p-tw"><table class="cq-p-t lg-dist"><tbody>${ls.map(([r, v], i) => `<tr><th scope="row">${esc(r)}</th><td>${API().nA(v)}</td><td>${tot ? API().pA(v / (tot || 1), 1) : ""}</td><td class="lg-dist-b"><span class="cq-barra"><i style="--w:${((100 * v) / mx).toFixed(1)}%;--i:${i}"></i></span></td></tr>`).join("")}</tbody></table></div>`;
  }
  function urnasHtml(D, comCarga) {
    const E = L(), us = D.u;
    if (!us || !us.length) return "";
    const uv = D.uv || [];
    const cab = E.u_th.concat(comCarga ? E.u_th_carga : []);
    return `<div class="cq-p-tw"><table class="cq-p-t lg-urnas"><thead><tr>${cab.map((x) => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead><tbody>${us.map((u, i) => {
      const v = uv[i];
      return `<tr><th scope="row">${i + 1}. ${esc(String(u[0]))}</th><td>${H(u[1])}${v && v[0] != null ? `<br><small>${esc(X().vh_c_grav)}: ${H(v[0])}</small>` : ""}</td><td>${H(u[2])}${v && v[1] != null ? `<br><small>${esc(X().vh_c_grav)}: ${H(v[1])}</small>` : ""}</td>
        <td>${nf(u[3] || 0)}</td><td>${esc(u[4] || "—")}</td><td>${esc(u[5] || "—")}</td>${comCarga ? `<td><code class="wrap">${esc(u[6] || "—")}</code></td><td>${esc([u[7], u[8], u[9]].filter(Boolean).join(" · ") || "—")}</td>` : ""}</tr>`;
    }).join("")}</tbody></table></div>`;
  }

  // conteúdo da lista que o botão abre, por teste
  function listaHtml(teste, D, linha, cols) {
    const E = L(), val = (k) => linha[cols.indexOf(k)];
    if (!D) return `<p class="small muted">${esc(E.p_sem_det)}</p>`;
    const T = D[teste] || {};
    const horaDe = (partes) => { const m = new Map(); partes.forEach((p) => p[2].forEach((v, k) => m.set(p[0] + k + 1, v[0]))); return (n) => m.get(n); };
    switch (teste) {
      case "L02": {
        const raj = T.raj || [], dentro = (n) => raj.some(([a, b]) => n >= a && n <= b), tAt = horaDe(T.v || []);
        const txt = raj.length ? raj.map(([a, b]) => `<p class="lg-raj-t">${esc(E.raj(nf(a), nf(b), nf(b - a + 1), dur((tAt(b) || 0) - (tAt(a) || 0))))}</p>`).join("") : `<p class="small muted">${esc(E.sem_raj)}</p>`;
        return txt + htmlVotos(T.v || [], { marca: dentro, total: D.n });
      }
      case "L03": {
        const [a, b] = T.seq || [0, 0], tAt = horaDe(T.v || []);
        return `<p class="lg-raj-t">${esc(E.seq(nf(a), nf(b), nf(b - a + 1), H(tAt(a)), H(tAt(b))))}</p>${(T.erro || []).length ? `<p class="small">${esc(E.seq_erro(T.erro.map(H).join(", ")))}</p>` : ""}
          ${htmlVotos(T.v || [], { marca: (n) => n >= a && n <= b, total: D.n })}`;
      }
      case "L04": {
        const nv = (val("v_pos_sim") || 0) + (val("v_pos_nao") || 0);
        return `<h5 class="vh-sub">${esc(E.l04_t)}</h5>${htmlEventos(T.ev)}<h5 class="vh-sub">${esc(E.l04_v(nf(nVotos(T.v || []))))}</h5>${htmlVotos(T.v || [], { total: D.n })}${nv ? "" : ""}`;
      }
      case "L05": {
        const nvd = val("v_urna_desligada") || 0;
        return `<h5 class="vh-sub">${esc(E.l05_t)}</h5>${htmlEventos(T.ev, T.corte)}${nvd || (T.vd || []).length ? `<h5 class="vh-sub">${esc(E.l05_vd(nf(nvd)))}</h5>${htmlVotos(T.vd || [])}` : ""}`;
      }
      case "L06": {
        const n = T.nsob || 0;
        return `<h5 class="vh-sub">${esc(E.l06_t)}</h5>${urnasHtml(D, true)}<h5 class="vh-sub">${esc(E.l06_sob(nf(n)))}</h5>${n ? htmlVotos(T.sob || []) : `<p class="small muted">${esc(E.l06_nenhum)}</p>`}`;
      }
      case "L07": {
        const s = T.seq;
        return `${s ? `<p class="lg-raj-t">${esc(E.l07_seq(nf(s[3]), H(s[0]), H(s[1]), evTxt(s[2])))}</p>` : ""}${htmlEventos(T.ev, Math.max(0, (val("n_tentativas") || 0) - (T.ev || []).length))}`;
      }
      case "L08": case "L09": return htmlEventos(T.ev);
      case "L10": return htmlEventos((T.ev || []).concat(D.m && D.m[3] != null ? [[D.m[3], "v1"]] : []).sort((x, y) => x[0] - y[0]));
      case "L11": {
        const dh = T.dh || [], vo = T.volta || [], m = D.m || [];
        const seg = (h) => { const x = /^(\d\d):(\d\d):(\d\d)$/.exec(h || ""); return x ? +x[1] * 3600 + +x[2] * 60 + +x[3] : null; };
        const lin = (rot, a, b) => `<tr><th scope="row">${esc(rot)}</th><td>${H(a)}</td><td>${H(b)}</td><td>${a != null && b != null ? esc(dur(Math.abs(a - b))) : "—"}</td></tr>`;
        return `<h5 class="vh-sub">${esc(E.l11_dh(nf(dh.length)))}</h5>${dh.length ? `<ul class="lg-hs">${dh.map((x) => `<li>${H(x)}</li>`).join("")}</ul>` : `<p class="small muted">${esc(E.vazio)}</p>`}
          ${vo.length ? `<h5 class="vh-sub">${esc(E.l11_volta(nf(vo.length)))}</h5><ul class="lg-hs">${vo.map((x) => `<li>${H(x[0])} · ${esc(E.l11_volta_v(dur(x[1])))}</li>`).join("")}</ul>` : ""}
          <h5 class="vh-sub">${esc(E.l11_cmp)}</h5><div class="cq-p-tw"><table class="cq-p-t"><thead><tr>${E.l11_th.map((x) => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead><tbody>
          ${lin(E.l11_ab, m[2], seg(T.ab))}${lin(E.l11_en, m[5], seg(T.en))}</tbody></table></div>`;
      }
      case "L12": {
        const g = LG1();
        return `${urnasHtml(D, true)}<dl class="cq-p-dl"><div><dt>${esc(E.u_carga)}</dt><dd><code class="wrap">${esc(T.carga || "—")}</code></dd></div><div><dt>${esc(E.u_num)}</dt><dd>${esc(D.nu || "—")}</dd></div></dl>
          <p class="small muted">${esc(E.u_vref(g && g.versao_ref ? g.versao_ref : "—"))}</p>`;
      }
      case "L13": {
        const lb = T.lib || [], n = D.n || 1;
        const ls = lb.slice(0, 9).map((v, k) => [E.lib13(k + 1), v]).filter((x, k) => k < 4 || x[1]).concat(E.lib13_x.map((r, k) => [r, lb[9 + k] || 0]));
        return `${htmlBarras(ls, n)}<dl class="cq-p-dl"><div><dt>${esc(E.lib_mes)}</dt><dd>${nf(T.mes || 0)}</dd></div><div><dt>${esc(E.lib_cpf)}</dt><dd>${nf(T.cpf || 0)}</dd></div></dl>`;
      }
      case "L14": {
        const comp = T.comp;
        return `<h5 class="vh-sub">${esc(E.l14_t)}</h5><dl class="cq-p-dl"><div><dt>${esc(E.l14_log)}</dt><dd>${nf(D.n)}</dd></div><div><dt>${esc(E.l14_bu)}</dt><dd>${comp == null ? "—" : nf(comp)}</dd></div>
          <div><dt>${esc(E.l14_dif)}</dt><dd>${comp == null ? "—" : fmtVal("sn", D.n - comp)}</dd></div></dl>${urnasHtml(D, false)}`;
      }
      default: return "";
    }
  }
  // quantos itens o botão abre (para o rótulo)
  function qtdLista(teste, D, linha, cols) {
    const T = (D && D[teste]) || {}, val = (k) => linha[cols.indexOf(k)];
    switch (teste) {
      case "L02": return D ? D.n : 0;
      case "L03": return val("seq_sem_digital") || 0;
      case "L04": return nVotos(T.v || []);
      case "L05": return (T.ev || []).length + (T.corte || 0);
      case "L07": return val("n_tentativas") || (T.ev || []).length;
      case "L08": case "L09": return (T.ev || []).length;
      case "L11": return (T.dh || []).length + (T.volta || []).length;
      default: return 0;
    }
  }
  // o que fica sempre à vista no bloco do teste (antes do botão)
  function visivelHtml(teste, D) {
    const E = L(), T = (D && D[teste]) || {};
    if (!D) return "";
    if (teste === "L02" && T.hist) return `<h5 class="vh-sub">${esc(E.hist_t)}</h5>${htmlBarras(E.hist.map((r, i) => [r, T.hist[i] || 0]), T.hist.reduce((a, b) => a + b, 0))}`;
    if (teste === "L03" && T.lib) return `<h5 class="vh-sub">${esc(E.lib_t)}</h5>${htmlBarras(E.lib3.map((r, i) => [r, T.lib[i] || 0]), D.n)}`;
    if (teste === "L07" && T.cont) return htmlBarras(E.l07_cont.map((r, i) => [r, T.cont[i] || 0]), 0);
    if (teste === "L09" && D.fim) return `<p class="small">${esc(E.l09_lib(H(D.fim).slice(0, 5)))}</p>`;
    return "";
  }
  // linha do dia: marcos do log, com o início e o fim oficiais (hora local)
  function diaHtml(D) {
    const E = L(), M = E.marcos, m = D.m || [];
    const ls = [["lig", m[0]], ["zer", m[1]], ["pr", m[2]], ["ini", D.fim ? D.fim - 9 * 3600 : null], ["v1", m[3]], ["fim", D.fim || null], ["vu", m[4]], ["enc", m[5]], ["bu", m[6]]]
      .filter((x) => x[1] != null).sort((a, b) => a[1] - b[1] || (a[0] === "ini" || a[0] === "fim" ? -1 : 1));
    return `<ol class="lg-dia">${ls.map(([k, s]) => `<li class="${k === "ini" || k === "fim" ? "of" : ""}"><time>${H(s)}</time><span>${esc(M[k])}</span></li>`).join("")}</ol>`;
  }
  function urnaHtml(D, teste) {
    const E = L(), vm = D.vm || (D.u && D.u[0] ? [D.u[0][4], D.u[0][5]] : ["", ""]);
    let h = `<dl class="cq-p-dl"><div><dt>${esc(E.u_num)}</dt><dd>${esc(D.nu || "—")}</dd></div><div><dt>${esc(E.u_mod)}</dt><dd>${esc(vm[1] || "—")}</dd></div><div><dt>${esc(E.u_ver)}</dt><dd>${esc(vm[0] || "—")}</dd></div>
      ${D.ag ? `<div><dt>${esc(E.u_agreg)}</dt><dd>${esc(D.ag)}</dd></div>` : ""}</dl>`;
    if (D.u && D.u.length > 1 && teste !== "L06" && teste !== "L12" && teste !== "L14") h += urnasHtml(D, false);
    return h;
  }

  // ------------------------------------------------------------------------------------------------ painel: bloco do teste
  const regs = new Map();   // chave do botão -> dados para montar a lista
  function blocoTeste(dd, r, gi) {
    const E = L(), Lg = t(), id = r.teste, linha = r.linhasLg[gi], cols = r.colsLg, tx = txtL(id) || {}, D = dd.lgDet, e = dd.e;
    const nv = linha[4], c = COLS[id];
    let h = `<section class="lg-bloco"><p class="cq-p-rot">${esc(E.p_teste)}</p><h3>${esc(id)} · ${esc(tx.nome || "")}</h3>
      <p class="lg-cat">${chip(nv === "a" ? "red" : "amber", nv === "a" ? Lg.lv_a : Lg.lv_i)} <span>${esc(catNome(linha[5]))}</span></p>
      <dl class="cq-p-dl">${c.map(([k, tp]) => { const v = linha[cols.indexOf(k)]; return v == null || v === "" ? "" : `<div><dt>${esc(E.cols[k].replace(/\n/g, " "))}</dt><dd>${esc(fmtVal(tp, v))}</dd></div>`; }).join("")}</dl>
      <details class="lg-crit"><summary>${esc(E.p_crit)}</summary><p class="small">${esc(tx.criterio || "")}</p><p class="small muted">${esc(tx.leg || "")}</p></details>`;
    if (id === "L01") {
      const rec = dd.vh && dd.vh[1];
      h += rec ? API().vh.html(rec, 1, `${e.uf}|${+e.z}|${+e.s}|1`, X(), false) : `<p class="small muted">${esc(E.p_sem_det)}</p>`;
    } else {
      h += visivelHtml(id, D);
      if (D) {
        const k = `${e.uf}|${+e.z}|${+e.s}|${id}`, n = qtdLista(id, D, linha, cols), toque = matchMedia("(hover: none)").matches;
        regs.set(k, { id, D, linha, cols });
        if (regs.size > 300) regs.delete(regs.keys().next().value);
        const ico = VOTOS.has(id) ? "clock" : "list";
        h += `<p class="lg-acoes vh-acoes"><button class="btn btn-sm btn-primary vh-ver" type="button" aria-expanded="false" data-lg-ver="${esc(k)}" data-lg-ir="${esc(E.ir[id])}" data-lg-ico="${ico}"
          data-lg-dica="${esc(E.dica(toque, E.dica_o[id]))}">${icone(ico)} <span>${esc(E.ver[id](nf(n)))}</span></button></p><div class="lg-lista" hidden></div>`;
      } else h += `<p class="small muted">${esc(E.p_sem_det)}</p>`;
    }
    if (D) h += `<h4>${esc(E.p_dia)}</h4>${diaHtml(D)}<h4>${esc(E.p_urna)}</h4>${urnaHtml(D, id)}`;
    const outros = (dd.lgFl || []).filter((o) => o[3] !== id);
    h += `<h4>${esc(E.p_outros)}</h4>${outros.length ? `<ul class="lg-outros">${outros.map((o) => `<li><a href="#/logs?teste=${o[3]}&uf=${e.uf}">${esc(o[3])}. ${esc((txtL(o[3]) || {}).nome || "")}</a> ${chip(o[4] === "a" ? "red" : "amber", o[4] === "a" ? Lg.lv_a : Lg.lv_i)}<br><span class="small muted">${esc(catNome(o[5]))}</span></li>`).join("")}</ul>` : `<p class="small muted">${esc(E.p_nenhum_outro)}</p>`}
      <p class="cq-p-nota">${icone("help")} ${esc(E.p_nota)}</p></section>`;
    return h;
  }
  // abre/fecha a lista de um botão do bloco do teste
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-lg-ver]");
    if (!b) return;
    const E = L(), g = regs.get(b.dataset.lgVer), box = b.closest(".lg-bloco"), lista = box && box.querySelector(".lg-lista");
    if (!g || !lista) return;
    const abrir = b.getAttribute("aria-expanded") !== "true";
    if (abrir && !lista.dataset.ok) {
      lista.innerHTML = listaHtml(g.id, g.D, g.linha, g.cols); lista.dataset.ok = "1"; API().contar(lista);
      // rajada ou sequência sem digital: a lista já abre nos votos marcados
      const r0 = lista.querySelector("tr.lg-raj"), tw = r0 && r0.closest(".vh-tw");
      if (tw) requestAnimationFrame(() => { tw.scrollTop = Math.max(0, r0.offsetTop - 70); });
    }
    lista.hidden = !abrir;
    b.setAttribute("aria-expanded", String(abrir));
    b.querySelector("span").textContent = abrir ? E.esconder : E.ver[g.id](nf(qtdLista(g.id, g.D, g.linha, g.cols)));
    if (b.closest(".cq-painel")) API().usado();
    if (abrir && ev.isTrusted) lista.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });

  // tabela de um teste (mesma tabela, dica e painel da consulta): linhas do teste já filtradas, na ordem da página
  function resTabela(id, ls, cols, nomeMun, ord, info) {
    const api = API(), c = COLS[id], E2 = L(), Lg = t();
    const chaves = ["uf", "municipio", "zona", "secao", "nivel", "cat"].concat(c.map((x) => x[0]));
    const rot = chaves.map((k) => E2.col[k] || E2.cols[k] || k);
    const fmtC = { nivel: (v) => chip(v === "a" ? "red" : "amber", v === "a" ? Lg.lv_a : Lg.lv_i), municipio: (v) => `<span class="et-mun">${esc(v)}</span>`, cat: (v) => `<span class="lg-catc">${esc(v)}</span>` };
    c.forEach(([k, tp]) => { fmtC[k] = (v) => esc(fmtVal(tp, v)); });
    const r = { id: api.novoId(), m: { colunas: chaves, linhas: ls.map((l) => [l[0], nomeMun(l[0], l[1]), l[2], l[3], l[4], catNome(l[5])].concat(c.map(([k]) => l[cols.indexOf(k)]))) },
      sql: null, turno: 0, ms: 0, pag: 0, pp: api.ppSalvo(), ord, sel: null, G: null, temSec: true,
      ler: (l) => ({ uf: l[0], z: l[2], s: l[3], loc: null, t: 1, cod: null, mun: null, teste: null, nivel: null, nr: null }),
      fonte: async (e, dd0) => {
        const [dd, det, fu] = await Promise.all([api.fonteSecao(e, dd0), detSecao(e.uf, e.z, e.s).catch(() => null), dadosUF(e.uf).catch(() => null)]);
        return Object.assign(dd, { lgDet: det, lgFl: fu ? fu.o.filter((o) => o[1] === e.z && o[2] === e.s) : [] });
      },
      fonteId: "lg", rot, fmt: chaves.map((k) => fmtC[k] || null), semNum: true, tabCls: "et-tab lg-tab", barraTopo: true, animRolar: true, dicaLinha: true, guiaPainel: true,
      info,
      teste: id, linhasLg: ls, colsLg: cols,
      painelTopo: (dd, rr, gi) => (dd.tipo === "secao" ? blocoTeste(dd, rr, gi) : ""),
      semVH: () => id === "L01",
      botaoPainel: (corpo) => corpo.querySelector(".lg-bloco [data-vh-ver], .lg-bloco [data-lg-ver]"),
      dicaExtra: (dd, rr, gi) => {
        const l = rr.linhasLg[gi], v = c.slice(0, 2).map(([k, tp]) => `${E2.cols[k].replace(/\n/g, " ")}: ${fmtVal(tp, l[cols.indexOf(k)])}`).join(" · ");
        return `<div class="cq-d-t lg-d-t"><b>${esc(id)}</b> · ${esc(catNome(l[5]))}<br>${esc(v)}</div>`;
      } };
    api.ordenar(r);
    return r;
  }

  // ------------------------------------------------------------------------------------------------ subpágina Achados em destaque
  // #/logs/destaques?achado=log_bu&uf=BA&mun=...: os achados em vermelho (prioridade alta) e amarelo (prioridade média),
  // cada um com a explicação e a mesma tabela e painel da página Logs das urnas
  const dz = { res: null, chave: null, f: { g: "", uf: "", mun: "" } };
  const dadosDest = () => buscar(cache.teste, "_dest", "site/data/logs/t1/destaques.json", { g: [] });
  const somaP = (D, p) => D.g.filter((x) => x.p === p).reduce((a, x) => a + x.n, 0);
  const corP = (p) => (p === "a" ? "red" : "amber");
  function dzLerFiltros(q) {
    const f = { g: "", uf: "", mun: "" };
    const g = q.get("achado"); if (g && LD().g[g]) f.g = g;
    const uf = (q.get("uf") || "").toUpperCase(); if (window.UF_NOMES[uf]) f.uf = uf;
    f.mun = (q.get("mun") || "").slice(0, 60);
    return f;
  }
  // cartões com números e a lista dos achados (barras em vermelho ou amarelo)
  function dzTopo(D, f) {
    const E = LD(), gs = D.g, tot = gs.reduce((a, x) => a + x.n, 0), nA = API().nA;
    const kpis = `<div class="et-kpis lg-kpis dz-kpis">${gs.map((x) => `<div class="${x.p === "a" ? "et-dest" : "dz-m"}"><span class="et-k-t">${esc(x.teste)} · ${esc(E.kt[x.k] || x.k)}</span><b>${nA(x.n)}</b><span>${esc(E.k_sub[x.p])}</span></div>`).join("")}
      <div><span class="et-k-t">${esc(E.k_tot)}</span><b>${nA(tot)}</b><span>${esc(E.k_tot_sub(nf(gs.length)))}</span></div></div>`;
    const mx = Math.max(1, ...gs.map((x) => x.n));
    const faixas = `<section class="card"><h2>${esc(E.faixas_t)}</h2><p class="small muted">${esc(E.faixas_n)}</p><ul class="et-faixas lg-faixas dz-faixas">${gs.map((x, k) =>
      `<li><button type="button" data-dz-g="${x.k}" aria-pressed="${f.g === x.k}"><span><b>${esc(x.teste)}</b> ${esc(E.g[x.k].t)}</span>${barra(x.p === "a" ? x.n : 0, x.p === "a" ? 0 : x.n, mx, k)}<em><span class="${x.p === "a" ? "lg-na" : "lg-ni"}">${nA(x.n)}</span></em></button></li>`).join("")}</ul></section>`;
    return kpis + faixas;
  }
  // explicação do achado: o que foi encontrado, casos (clique abre o painel da seção), por que merece atenção e o que conferir
  function dzGrupo(x) {
    const E = LD(), G = E.g[x.k], tx = txtL(x.teste) || {}, xf = {};
    Object.keys(x.x || {}).forEach((k) => { xf[k] = nf(x.x[k]); });
    const casos = G.d.map(([uf, z, s, txt]) => `<li>${s != null ? `<a class="dz-caso" href="#/secao/${uf}/${z}/${s}" data-dz-c="${uf}|${z}|${s}" title="${esc(E.abrir)}">${esc(txt)}</a>` : esc(txt)}</li>`).join("");
    return `<div class="dz-g dz-${x.p}"><p class="dz-g-top">${chip(corP(x.p), E.p[x.p])} <a class="chip" href="#/logs?teste=${x.teste}&nivel=a">${esc(x.teste)} · ${esc(tx.nome || "")}</a></p>
      <h3>${esc(G.t)}</h3><p>${esc(G.a(nf(x.n), xf))}</p>
      <h4>${esc(E.h_dest)}</h4><ul class="dz-casos">${casos}</ul>
      <div class="dz-g2"><div><h4>${esc(E.h_porque)}</h4><p>${esc(G.w)}</p></div><div><h4>${esc(E.h_conferir)}</h4><p>${esc(G.c)}</p></div></div></div>`;
  }
  const pgDest = {
    html() {
      const E = LD(), E1 = L(), g = LG1();
      if (!g || !API()) return `<header class="page-head"><h1>${esc(E.titulo)}</h1><p class="lead">${esc(E.sub)}</p></header><p class="alert">${esc(E1.erro)}</p>`;
      dz.f = dzLerFiltros(A.state.query);
      const rel = g.relatorio.replace("{lg}", A.state.lang);
      return `<header class="page-head"><p class="dz-volta"><a href="#/logs">‹ ${esc(E.voltar)}</a></p><h1>${esc(E.titulo)}</h1><p class="lead">${esc(E.sub)}</p>${A.acoes(false)}</header>
        <section class="card et-sobre"><h2>${esc(E.oque_t)}</h2><ul>${E.oque.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="btn-row"><a class="btn btn-sm" href="#/logs">${icone("list")} ${esc(E.voltar)}</a><a class="btn btn-sm btn-ghost" href="#/encerramento-tardio">${icone("clock")} ${esc(E1.tardio)}</a></p></section>
        <div id="dz-topo">${API().carregando()}</div>
        <section class="card cq-p" id="cq-res-c"><h2>${esc(E.lista_t)}</h2><div id="dz-g"></div>
          <form class="et-filtros" id="dz-f" onsubmit="return false">
            <div class="filters">
              <label><span>${esc(E.f_grupo)}</span><select name="g"></select></label>
              <label><span>${esc(E1.f_uf)}</span><select name="uf"><option value="">${esc(E1.f_uf_todos)}</option></select></label>
              <label><span>${esc(E1.f_mun)}</span><input name="mun" type="search" autocomplete="off" placeholder="${esc(E1.f_mun_ph)}" value="${esc(dz.f.mun)}"></label>
              <button class="btn btn-sm btn-ghost" type="button" id="dz-limpar">${icone("close")} ${esc(E1.limpar)}</button></div></form>
          <p class="small muted" id="cq-info" aria-live="polite"></p><div id="cq-res">${API().carregando()}</div>
          <div class="btn-row" id="cq-dl" hidden><button class="btn btn-sm" type="button" id="dz-csv">${icone("download")} ${esc(E1.csv)}</button><a class="btn btn-sm btn-ghost" id="dz-teste" href="#/logs">${icone("list")} <span></span></a></div>
          <p class="small muted" id="lg-leg"></p><p class="small muted">${esc(E1.nota_h)}</p></section>
        <section class="card"><h2>${esc(E1.como_t)}</h2><ul>${E1.como.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="btn-row"><a class="btn btn-sm btn-ghost" href="${esc(rel)}">${icone("download")} ${esc(E1.rel)}</a><a class="btn btn-sm btn-ghost" href="#/logs">${icone("list")} ${esc(E.voltar)}</a></p></section>
        <section class="card"><h2>${esc(E1.arq_t)}</h2><ul class="et-arq">
          <li>${esc(E.titulo)}: <a href="site/data/logs/t1/destaques.json" download>destaques.json</a> · <a href="site/data/logs/destaques.py" download>destaques.py</a></li>
          <li>${esc(E1.arq[1])}: <code>site/data/logs/t1/det/{UF}/{zona}.json</code></li></ul>
          <p class="small muted">${esc(E1.arq_n)}</p></section>${A.botCta()}`;
    },
    async iniciar() {
      const E = LD(), api = API(), box = $("#cq-res"), form = $("#dz-f"), topo = $("#dz-topo");
      if (!box || !form || !topo || !api) return;
      let D, M;
      try { [D, M] = await Promise.all([dadosDest(), A.municipios().catch(() => ({})), api.sinais()]); }
      catch (e) { topo.innerHTML = ""; box.innerHTML = api.erroDados(e); return; }
      if (!box.isConnected) return;
      if (!D.g.length) { topo.innerHTML = ""; box.innerHTML = `<p class="alert">${esc(L().erro)}</p>`; return; }
      M = M || {};
      if (!D.g.some((x) => x.k === dz.f.g)) dz.f.g = D.g[0].k;
      topo.innerHTML = dzTopo(D, dz.f);
      const blocos = () => $$(".dz-kpis > div, .dz-faixas");
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) api.zerar(blocos());
      api.animarAoVer(blocos());
      const grupo = () => D.g.find((x) => x.k === dz.f.g);
      const nomeMun = (uf, c) => { const m = (M[uf] || {})[c]; return m ? A.titulo(m[0]) : String(c); };
      const filtrar = (ls, f, sem) => {
        const q = api.nz(f.mun.trim());
        return ls.filter((l) => (sem === "uf" || !f.uf || l[0] === f.uf) && (!q || api.nz(nomeMun(l[0], l[1])).includes(q)));
      };
      const chaveD = () => JSON.stringify([A.state.lang, dz.f.g, dz.f.uf, api.nz(dz.f.mun.trim())]);
      const montar = () => {
        const x = grupo();
        return Object.assign(resTabela(x.teste, filtrar(x.l, dz.f), x.c, nomeMun, dz.res && dz.res.k === x.k ? dz.res.ord : null,
          (n) => L().info(nf(n), nf(x.l.length), n === x.l.length)), { k: x.k });
      };
      const selG = form.elements.g, selUf = form.elements.uf;
      selG.innerHTML = D.g.map((x) => `<option value="${x.k}">${esc(x.teste)}. ${esc(E.g[x.k].t)} (${nf(x.n)})</option>`).join("");
      const opcoesUf = () => {
        const c = {}; filtrar(grupo().l, dz.f, "uf").forEach((l) => { c[l[0]] = (c[l[0]] || 0) + 1; });
        const tot = Object.values(c).reduce((a, b) => a + b, 0);
        const us = Object.keys(window.UF_NOMES).filter((u) => c[u] || u === dz.f.uf).sort((a, b) => (a === "ZZ") - (b === "ZZ") || A.ufNome(a).localeCompare(A.ufNome(b)));
        selUf.innerHTML = `<option value="">${esc(L().f_uf_todos)} (${nf(tot)})</option>` + us.map((u) => `<option value="${u}">${esc(A.ufNome(u))} (${nf(c[u] || 0)})</option>`).join("");
        selUf.value = dz.f.uf;
      };
      const explicar = () => {
        const x = grupo(), tx = txtL(x.teste) || {};
        $("#dz-g").innerHTML = dzGrupo(x);
        $("#lg-leg").textContent = `${L().leg} (${x.teste}): ${tx.leg || ""}`;
        const a = $("#dz-teste"); a.href = `#/logs?teste=${x.teste}&nivel=a`; a.querySelector("span").textContent = E.ver_teste(x.teste);
      };
      const mostrar = (manter) => {
        const k = chaveD();
        if (!(manter && dz.res && dz.chave === k)) { dz.res = montar(); dz.chave = k; }
        api.mostrar(dz.res);
        $("#cq-dl").hidden = !dz.res.m.linhas.length;
        opcoesUf(); explicar();
      };
      const endereco = () => {
        const q = new URLSearchParams();
        q.set("achado", dz.f.g);
        if (dz.f.uf) q.set("uf", dz.f.uf);
        if (dz.f.mun.trim()) q.set("mun", dz.f.mun.trim());
        const h = `#/logs/destaques?${q}`;
        if (location.hash !== h) history.replaceState(history.state, "", h);
      };
      const aplicar = () => {
        api.fechar();
        $$("[data-dz-g]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dzG === dz.f.g)));
        selG.value = dz.f.g;
        endereco();
        mostrar(false);
      };
      const irLista = () => $("#cq-res-c").scrollIntoView({ block: "start", behavior: "smooth" });
      selG.addEventListener("change", () => { dz.f.g = selG.value; aplicar(); });
      selUf.addEventListener("change", () => { dz.f.uf = selUf.value; aplicar(); });
      let tm = 0;
      form.elements.mun.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => { dz.f.mun = form.elements.mun.value; aplicar(); }, 250); });
      $("#dz-limpar").addEventListener("click", () => { dz.f = { g: dz.f.g, uf: "", mun: "" }; form.elements.mun.value = ""; aplicar(); });
      $$("[data-dz-g]").forEach((b) => b.addEventListener("click", () => { dz.f.g = b.dataset.dzG; aplicar(); irLista(); }));
      // caso citado no texto: abre o painel da seção (tira os filtros se a seção estiver fora deles)
      $("#dz-g").addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-dz-c]"); if (!b || !dz.res || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button) return;
        ev.preventDefault();
        const [uf, z, s] = b.dataset.dzC.split("|");
        const acha = () => dz.res.linhasLg.findIndex((l) => l[0] === uf && l[2] === +z && l[3] === +s);
        let i = acha();
        if (i < 0 && (dz.f.uf || dz.f.mun)) { dz.f.uf = ""; dz.f.mun = ""; form.elements.mun.value = ""; aplicar(); i = acha(); }
        if (i >= 0) api.abrir(i);
      });
      $("#dz-csv").addEventListener("click", () => {
        const r = dz.res; if (!r) return;
        const c = COLS[r.teste], cab = ["achado", "teste", "nivel", "categoria", "uf", "cod_mun", "municipio", "zona", "secao"].concat(c.map((x) => x[0]));
        const ls = r.idx.map((i) => { const l = r.linhasLg[i]; return [r.k, r.teste, l[4] === "a" ? "anomalia" : "informativo", l[5], l[0], l[1], nomeMun(l[0], l[1]), l[2], l[3]].concat(c.map(([k]) => l[r.colsLg.indexOf(k)])); });
        api.baixar(`logs_urnas_destaques_${r.k}_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + [cab].concat(ls).map((l) => l.map(api.csvCampo).join(",")).join("\r\n"), "text/csv;charset=utf-8");
      });
      selG.value = dz.f.g;
      endereco();
      api.ligar(box);
      mostrar(true);
      // volta de uma página aberta pelo painel: a lista, a página e a linha continuam onde estavam
      const v = dz.res.volta; dz.res.volta = null;
      if (v) {
        const tr = $(`#cq-res tr[data-i="${v.i}"]`);
        if (tr) { tr.scrollIntoView({ block: "center" }); tr.classList.add("cq-volta"); setTimeout(() => tr.classList.remove("cq-volta"), 2600); }
        if (v.painel) setTimeout(() => api.abrir(v.i), 0);
      } else if (A.state.query.get("achado") || A.state.query.get("uf")) { const c = $("#cq-res-c"); if (c) c.scrollIntoView({ block: "start" }); }
    },
  };

  // ------------------------------------------------------------------------------------------------ página Logs das urnas
  const lg = { res: null, chave: null, f: { teste: "L01", nivel: "", uf: "", mun: "" } };
  function lerFiltros(q) {
    const f = { teste: "L01", nivel: "", uf: "", mun: "" };
    const te = (q.get("teste") || "").toUpperCase(); if (TESTES_L.includes(te)) f.teste = te;
    const nv = q.get("nivel"); if (nv === "a" || nv === "i") f.nivel = nv;
    const uf = (q.get("uf") || "").toUpperCase(); if (window.UF_NOMES[uf]) f.uf = uf;
    f.mun = (q.get("mun") || "").slice(0, 60);
    return f;
  }
  const chaveF = (f) => JSON.stringify([A.state.lang, f.teste, f.nivel, f.uf, API().nz(f.mun.trim())]);
  const kpi = (tit, v, sub, dest) => `<div${dest ? ' class="et-dest"' : ""}><span class="et-k-t">${esc(tit)}</span><b>${API().nA(v)}</b><span>${esc(sub || "")}</span></div>`;
  const barra = (a, i, mx, k) => `<span class="et-fb lg-fb"><i class="a" style="--w:${a ? Math.max(0.6, (100 * a) / mx).toFixed(2) : 0}%;--i:${k}"></i><i class="i" style="--w:${i ? Math.max(0.6, (100 * i) / mx).toFixed(2) : 0}%;--i:${k}"></i></span>`;
  const contas = (a, i) => `<em><span class="lg-na">${API().nA(a)}</span><span class="lg-ni">${API().nA(i)}</span></em>`;
  const pgLogs = {
    ativo: "logs",
    titulo: (p) => (p && p[1] === "destaques" ? LD().titulo : L().titulo),
    html(p) {
      if (p && p[1] === "destaques") return pgDest.html(p);
      const E = L(), g = LG1();
      if (!g || !API()) return `<header class="page-head"><h1>${esc(E.titulo)}</h1><p class="lead">${esc(E.sub)}</p></header><p class="alert">${esc(E.erro)}</p>`;
      const f = (lg.f = lerFiltros(A.state.query));
      const G = g.geral, sinSec = Object.values(g.ufs).reduce((a, u) => a + u.secoes, 0);
      const sa = TESTES_L.reduce((a, id) => a + (g.testes[id].a || 0), 0), si = TESTES_L.reduce((a, id) => a + (g.testes[id].i || 0), 0);
      const kpis = `<div class="et-kpis lg-kpis">${kpi(E.k_com, g.cobertura.com_log, E.k_com_sub(nf(g.cobertura.sem_log)))}${kpi(E.k_votos, G.votos, E.k_votos_sub(nf(G.secoes)))}
        ${kpi(E.k_apos, G.votos_apos, E.k_apos_sub(pct(G.votos_apos / (G.votos || 1), 2), nf(G.secoes_apos)), true)}${kpi(E.k_1h, G.votos_1h, E.k_1h_sub(nf(G.secoes_1h)))}
        ${kpi(E.k_sd, G.sem_digital_apos, E.k_sd_sub)}${kpi(E.k_a, sa, E.k_a_sub, true)}${kpi(E.k_i, si, E.k_i_sub)}${kpi(E.k_sin, sinSec, E.k_sin_sub)}</div>`;
      const mx = Math.max(1, ...TESTES_L.map((id) => g.testes[id].a + g.testes[id].i));
      const faixas = `<section class="card"><h2>${esc(E.faixas_t)}</h2><p class="small muted">${esc(E.faixas_n)}</p><ul class="et-faixas lg-faixas">${TESTES_L.map((id, k) => {
        const r = g.testes[id];
        return `<li><button type="button" data-lg-t="${id}" aria-pressed="${f.teste === id}"><span><b>${id}</b> ${esc(txtL(id).nome)}</span>${barra(r.a, r.i, mx, k)}${contas(r.a, r.i)}</button></li>`;
      }).join("")}</ul></section>`;
      const ufs = Object.keys(g.ufs).sort((a, b) => (a === "ZZ") - (b === "ZZ") || A.ufNome(a).localeCompare(A.ufNome(b)));
      const mxu = Math.max(1, ...ufs.map((u) => g.ufs[u].a + g.ufs[u].i));
      const porUf = `<section class="card"><h2>${esc(E.ufs_t)}</h2><p class="small muted">${esc(E.ufs_n)}</p><ul class="et-faixas lg-faixas lg-ufs">${ufs.map((u, k) => {
        const x = g.ufs[u];
        return `<li><button type="button" data-lg-uf="${u}" aria-pressed="${f.uf === u}" title="${esc(`${nf(x.secoes)} · ${E.k_sin.toLowerCase()}`)}"><span><b>${u}</b> ${esc(A.ufNome(u))}</span>${barra(x.a, x.i, mxu, k)}${contas(x.a, x.i)}</button></li>`;
      }).join("")}</ul></section>`;
      const rel = g.relatorio.replace("{lg}", A.state.lang);
      const t35 = window.T35 ? (window.T35[A.state.lang] || window.T35.PT).titulo : "L01–L14";
      const D0 = LD();
      const cta = `<a class="lg-cta" href="#/logs/destaques"><span class="lg-cta-i" aria-hidden="true">${icone("alert")}</span><span class="lg-cta-x"><span class="lg-cta-k">${esc(D0.cta_k)}</span>
        <b>${esc(D0.cta_t)}</b><span class="lg-cta-p">${esc(D0.cta_p)}</span><span class="lg-cta-n" id="lg-cta-n"></span></span><span class="btn btn-sm btn-primary lg-cta-b">${esc(D0.cta_b)} ›</span></a>`;
      return `<header class="page-head"><h1>${esc(E.titulo)}</h1><p class="lead">${esc(E.sub)}</p>${A.acoes(false)}</header>${cta}
        <section class="card et-sobre"><h2>${esc(E.oque_t)}</h2><ul>${E.oque.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="btn-row"><a class="btn btn-sm" href="#/testes/bloco-L">${icone("flask")} ${esc(t35)}</a><a class="btn btn-sm btn-ghost" href="#/encerramento-tardio">${icone("clock")} ${esc(E.tardio)}</a></p></section>
        ${kpis}${faixas}
        <section class="card cq-p" id="cq-res-c"><h2>${esc(E.lista_t)}</h2><p class="lg-atual" id="lg-atual"></p>
          <form class="et-filtros" id="lg-f" onsubmit="return false">
            <div class="cq-turnos" role="radiogroup" aria-label="${esc(E.f_nivel)}"><span class="cq-turnos-r">${icone("flask")} ${esc(E.f_nivel)}</span>
              <span class="cq-turnos-b">${["", "a", "i"].map((v) => `<button type="button" role="radio" aria-checked="${f.nivel === v}" data-lg-n="${v}">${esc(E.n_ops[v])}<small data-lg-nc="${v}"></small></button>`).join("")}</span></div>
            <div class="filters">
              <label><span>${esc(E.f_teste)}</span><select name="teste">${TESTES_L.map((id) => `<option value="${id}"${f.teste === id ? " selected" : ""}>${id}. ${esc(txtL(id).nome)} (${nf(g.testes[id].a + g.testes[id].i)})</option>`).join("")}</select></label>
              <label><span>${esc(E.f_uf)}</span><select name="uf"><option value="">${esc(E.f_uf_todos)}</option></select></label>
              <label><span>${esc(E.f_mun)}</span><input name="mun" type="search" autocomplete="off" placeholder="${esc(E.f_mun_ph)}" value="${esc(f.mun)}"></label>
              <button class="btn btn-sm btn-ghost" type="button" id="lg-limpar">${icone("close")} ${esc(E.limpar)}</button></div></form>
          <p class="small muted" id="cq-info" aria-live="polite"></p><div id="cq-res">${API().carregando()}</div>
          <div class="btn-row" id="cq-dl" hidden><button class="btn btn-sm" type="button" id="lg-csv">${icone("download")} ${esc(E.csv)}</button></div>
          <p class="small muted" id="lg-leg"></p><p class="small muted">${esc(E.nota_h)}</p></section>
        ${porUf}
        <section class="card"><h2>${esc(E.como_t)}</h2><ul>${E.como.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="btn-row"><a class="btn btn-sm btn-ghost" href="${esc(rel)}">${icone("download")} ${esc(E.rel)}</a><a class="btn btn-sm btn-ghost" href="#/testes/bloco-L">${icone("flask")} ${esc(t35)}</a></p></section>
        <section class="card"><h2>${esc(E.arq_t)}</h2><ul class="et-arq">
          <li>${esc(E.arq[0])}: ${TESTES_L.map((id) => `<a href="site/data/logs/t1/teste/${id}.json" download>${id}</a>`).join(" · ")}</li>
          <li>${esc(E.arq[1])}: <code>site/data/logs/t1/det/{UF}/{zona}.json</code></li>
          <li>${esc(E.arq[2])}: <a href="site/data/logs/gerar.py" download>gerar.py</a> · <a href="site/data/logs/detalhes.py" download>detalhes.py</a></li></ul>
          <p class="small muted">${esc(E.arq_n)}</p></section>${A.botCta()}`;
    },
    async iniciar(p) {
      if (p && p[1] === "destaques") return pgDest.iniciar(p);
      const E = L(), api = API(), box = $("#cq-res"), form = $("#lg-f");
      if (!box || !form || !api) return;
      // números da chamada para os achados em destaque
      dadosDest().then((D) => {
        const el = $("#lg-cta-n"); if (!el || !D.g.length) return;
        const [a, m] = LD().cta_n(nf(somaP(D, "a")), nf(somaP(D, "m")));
        el.innerHTML = `${chip("red", a)} ${chip("amber", m)}`;
      }).catch(() => {});
      const blocos = () => $$(".lg-kpis > div, .lg-faixas");
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) api.zerar(blocos());
      api.animarAoVer(blocos());
      let M = {};
      const carregar = async (id) => {
        const [d, muns] = await Promise.all([dadosTeste(id), A.municipios().catch(() => ({})), api.sinais()]);
        M = muns || {};
        return d;
      };
      let dados;
      try { dados = await carregar(lg.f.teste); } catch (e) { box.innerHTML = api.erroDados(e); return; }
      if (!box.isConnected) return;
      const nomeMun = (uf, c) => { const m = (M[uf] || {})[c]; return m ? A.titulo(m[0]) : String(c); };
      const filtrar = (ls, f, sem) => {
        const q = api.nz(f.mun.trim());
        return ls.filter((l) => (sem === "nivel" || !f.nivel || l[4] === f.nivel) && (sem === "uf" || !f.uf || l[0] === f.uf) && (!q || api.nz(nomeMun(l[0], l[1])).includes(q)));
      };
      const montarRes = (d, f) => resTabela(f.teste, filtrar(d.l, f), d.c, nomeMun, lg.res && lg.res.teste === f.teste ? lg.res.ord : null,
        (n) => L().info(nf(n), nf(d.l.length), n === d.l.length));
      const legenda = () => {
        const tx = txtL(lg.f.teste) || {};
        $("#lg-leg").textContent = `${E.leg}: ${tx.leg || ""}`;
        $("#lg-atual").innerHTML = `<b>${esc(lg.f.teste)} · ${esc(tx.nome || "")}</b><br><span class="muted">${esc(tx.objetivo || "")}</span>`;
      };
      const selUf = form.elements.uf;
      const opcoesUf = () => {
        const c = {}; filtrar(dados.l, lg.f, "uf").forEach((l) => { c[l[0]] = (c[l[0]] || 0) + 1; });
        const tot = Object.values(c).reduce((a, b) => a + b, 0);
        const us = Object.keys(window.UF_NOMES).filter((u) => c[u] || u === lg.f.uf).sort((a, b) => (a === "ZZ") - (b === "ZZ") || A.ufNome(a).localeCompare(A.ufNome(b)));
        selUf.innerHTML = `<option value="">${esc(E.f_uf_todos)} (${nf(tot)})</option>` + us.map((u) => `<option value="${u}">${esc(A.ufNome(u))} (${nf(c[u] || 0)})</option>`).join("");
        selUf.value = lg.f.uf;
      };
      const contar = () => {
        const base = filtrar(dados.l, lg.f, "nivel"), c = { "": base.length, a: 0, i: 0 };
        base.forEach((l) => { c[l[4]]++; });
        $$("[data-lg-nc]").forEach((el) => { el.textContent = ` (${nf(c[el.dataset.lgNc])})`; });
      };
      const mostrar = (manter) => {
        const k = chaveF(lg.f);
        if (!(manter && lg.res && lg.chave === k)) { lg.res = montarRes(dados, lg.f); lg.chave = k; }
        api.mostrar(lg.res);
        $("#cq-dl").hidden = !lg.res.m.linhas.length;
        contar(); opcoesUf(); legenda();
      };
      const endereco = () => {
        const q = new URLSearchParams();
        q.set("teste", lg.f.teste);
        if (lg.f.nivel) q.set("nivel", lg.f.nivel);
        if (lg.f.uf) q.set("uf", lg.f.uf);
        if (lg.f.mun.trim()) q.set("mun", lg.f.mun.trim());
        const h = `#/logs?${q}`;
        if (location.hash !== h) history.replaceState(history.state, "", h);
      };
      let seqT = 0;
      const aplicar = async (mudouTeste) => {
        api.fechar();
        $$("[data-lg-n]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.lgN === lg.f.nivel)));
        $$("[data-lg-t]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lgT === lg.f.teste)));
        $$("[data-lg-uf]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lgUf === lg.f.uf)));
        form.elements.teste.value = lg.f.teste;
        endereco();
        if (mudouTeste) {
          const s = ++seqT;
          box.innerHTML = api.carregando();
          try { dados = await carregar(lg.f.teste); } catch (e) { box.innerHTML = api.erroDados(e); return; }
          if (s !== seqT || !box.isConnected) return;
        }
        mostrar(false);
      };
      const irLista = () => $("#cq-res-c").scrollIntoView({ block: "start", behavior: "smooth" });
      form.addEventListener("click", (ev) => { const b = ev.target.closest("[data-lg-n]"); if (b) { lg.f.nivel = b.dataset.lgN; aplicar(false); } });
      form.elements.teste.addEventListener("change", () => { lg.f.teste = form.elements.teste.value; aplicar(true); });
      selUf.addEventListener("change", () => { lg.f.uf = selUf.value; aplicar(false); });
      let tm = 0;
      form.elements.mun.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => { lg.f.mun = form.elements.mun.value; aplicar(false); }, 250); });
      $("#lg-limpar").addEventListener("click", () => { lg.f = { teste: lg.f.teste, nivel: "", uf: "", mun: "" }; form.elements.mun.value = ""; aplicar(false); });
      $$("[data-lg-t]").forEach((b) => b.addEventListener("click", () => { const mud = lg.f.teste !== b.dataset.lgT; lg.f.teste = b.dataset.lgT; aplicar(mud); irLista(); }));
      $$("[data-lg-uf]").forEach((b) => b.addEventListener("click", () => { lg.f.uf = lg.f.uf === b.dataset.lgUf ? "" : b.dataset.lgUf; aplicar(false); irLista(); }));
      $("#lg-csv").addEventListener("click", () => {
        const r = lg.res; if (!r) return;
        const c = COLS[r.teste], cab = ["teste", "nivel", "categoria", "uf", "cod_mun", "municipio", "zona", "secao"].concat(c.map((x) => x[0]));
        const ls = r.idx.map((i) => { const l = r.linhasLg[i]; return [r.teste, l[4] === "a" ? "anomalia" : "informativo", l[5], l[0], l[1], nomeMun(l[0], l[1]), l[2], l[3]].concat(c.map(([k]) => l[r.colsLg.indexOf(k)])); });
        api.baixar(`logs_urnas_${r.teste}_${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + [cab].concat(ls).map((l) => l.map(api.csvCampo).join(",")).join("\r\n"), "text/csv;charset=utf-8");
      });
      api.ligar(box);
      mostrar(true);
      // volta de uma página aberta pelo painel: a lista, a página e a linha continuam onde estavam
      const v = lg.res.volta; lg.res.volta = null;
      if (v) {
        const tr = $(`#cq-res tr[data-i="${v.i}"]`);
        if (tr) { tr.scrollIntoView({ block: "center" }); tr.classList.add("cq-volta"); setTimeout(() => tr.classList.remove("cq-volta"), 2600); }
        if (v.painel) setTimeout(() => api.abrir(v.i), 0);
      } else if (A.state.query.get("teste") || A.state.query.get("uf")) { const c = $("#cq-res-c"); if (c) c.scrollIntoView({ block: "start" }); }
    },
  };
  if (PUBLICADO) A.paginas.logs = pgLogs;

  // ------------------------------------------------------------------------------------------------ página da seção
  document.addEventListener("secao", async (ev) => {
    const d = ev.detail || {}, sl = document.querySelector('.lg-slot[data-t="1"]');
    if (!sl || !LG1()) return;
    const E = L();
    sl.innerHTML = `<h4>${esc(E.sec_t)}</h4><p class="muted small">${esc(E.sec_carregando)}</p>`;
    let dd;
    try { dd = await dadosUF(d.uf); } catch (e) { sl.innerHTML = `<h4>${esc(E.sec_t)}</h4><p class="alert">${esc(E.erro)}</p>`; return; }
    if (!sl.isConnected) return;
    const z = +d.z, s = +d.s;
    const ls = dd.o.filter((r) => r[1] === z && r[2] === s);
    const sem = (dd.sem_log || []).some((x) => x[0] === z && x[1] === s);
    let h = `<h4>${esc(E.sec_t)}</h4>`;
    if (sem) h += `<p>${chip("amber", E.sec_sem)}</p>`;
    if (ls.length) {
      const ids = ls.map((r) => r[3]).filter((x, i, a) => a.indexOf(x) === i);
      h += tabela([t().th_test, "", E.th_obs, E.th_ref, E.th_det], ls.map((r) => [`<a href="#/testes/${r[3]}">${r[3]}. ${esc((txtL(r[3]) || {}).nome || "")}</a><br><span class="small muted">${esc(catNome(r[5]))}</span>`,
        chip(r[4] === "a" ? "red" : "amber", r[4] === "a" ? t().lv_a : t().lv_i), esc(A.dec(r[6] || "—")), esc(A.dec(r[7] || "—")), esc(A.dec(r[8] || "—"))]))
        + `<p class="small muted">${esc(E.sec_leg)}</p><p class="btn-row">${ids.map((id) => `<a class="btn btn-sm btn-ghost" href="#/logs?teste=${id}&uf=${d.uf}">${icone("list")} ${esc(E.nav)} · ${id}</a>`).join("")}</p>`;
    } else if (!sem) h += `<p>${chip("green", E.sec_ok)}</p>`;
    sl.innerHTML = h;
  });

  // ------------------------------------------------------------------------------------------------ página Os 35 testes
  // cartão de um teste L com o resultado do 1º turno (app.js chama quando há resumo dos logs)
  function cartaoL(id, foco, Z, extra) {
    const E = L(), r = resL(id), tx = txtL(id);
    if (!r || !tx) return null;
    const Lg = t();
    const cats = r.cats.length ? tabela([E.th_cat, E.th_nivel, E.th_qtd], r.cats.map(([c, nv, n]) => [esc(catNome(c)), chip(nv === "a" ? "red" : "amber", nv === "a" ? Lg.lv_a : Lg.lv_i), nf(n)]), "num-cols") : `<p>${chip("green", Lg.lk_noflags || "—")}</p>`;
    return `<article class="test-card tc-l" id="${id}"><details${foco === id ? " open" : ""}>
      <summary><span class="tnum">${id}</span><span class="tmain"><span class="tname">${esc(tx.nome)}</span><span class="ttype">${esc(Z.tipo_l)}</span>
        <span class="tsimple">${esc(Z.L[id][0])}</span><span class="tres"><span class="res"><span class="muted">${esc(E.res_t1)}:</span> ${chip(cor(r), `${nf(r.a)} / ${nf(r.i)}`)}</span>
        <span class="res"><span class="muted">${esc(E.res_t2)}:</span> <span class="chip chip-and"><span class="dot" aria-hidden="true"></span>${esc(E.and_t2)}</span></span></span></span></summary>
      <div class="tbody"><h3>${esc(E.f_obj)}</h3><p>${esc(tx.objetivo)}</p><h3>${esc(Lg.f_met)}</h3><p>${esc(tx.metodo)}</p>${extra || ""}
        <h3>${esc(Lg.f_crit)}</h3><p>${esc(tx.criterio)}</p><h3>${esc(Lg.f_lim)}</h3><p>${esc(tx.limites)}</p>
        <h3>${esc(E.cats_t)}</h3><p class="small muted">${esc(E.th_un)}: ${nf(r.unidades)} · ${esc(tx.leg)}</p>${cats}
        <p class="btn-row"><a class="btn btn-sm btn-primary" href="#/logs?teste=${id}">${icone("list")} ${esc(E.ver_secoes)}</a>
          <a class="btn btn-bot btn-sm" href="${esc(A.linkAtlas(Lg.ask_test(id)))}">${icone("globe")} ${esc(Lg.f_ask)}</a>
          <a class="btn btn-sm btn-ghost" href="#/simulador/${id}">${icone("lab")} ${esc(Z.sim)}</a></p></div></details></article>`;
  }
  A.logsL = { ok: () => !!LG1(), cartao: cartaoL, txt: txtL, res: resL, textos: L, TESTES: TESTES_L };
})();
