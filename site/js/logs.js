/* Testes L01 a L14 (logs das urnas): página "Logs das urnas", bloco na página da seção e textos em PT, EN e ES.
   Dados: resumo.json → logs["1"] (números de cada teste, categorias e textos do motor) e site/data/logs/t1/<UF>.json
   (seções com sinalização e seções sem log legível), gerados por site/data/logs/gerar.py a partir do pacote do motor.
   O 2º turno entra quando os logs dele forem concluídos. Nenhum número de título e nenhum .logjez entram no site. */
(function () {
  "use strict";
  const A = window.APP, I = window.I18N;
  if (!A || !I) return;
  const { esc, icone, tabela, chip, $ } = A;
  const t = () => A.t(), nf = (n) => A.nf(n), pct = (x, d) => A.pct(x, d);
  const R = () => A.state.R;
  // PUBLICADO: liga a página, o menu e os blocos quando os dados do 1º turno (gerar.py) estiverem no site
  const PUBLICADO = true;
  const LG1 = () => (PUBLICADO && R() && R().logs && R().logs["1"]) || null;
  const TESTES_L = Array.from({ length: 14 }, (_, i) => `L${String(i + 1).padStart(2, "0")}`);

  const TXT = {
    PT: {
      nav: "Logs das urnas",
      titulo: "Logs das urnas · 1º turno",
      sub: "Os 14 testes L leem o registro (log) de cada urna, com a hora de cada voto e de cada evento do dia. O 1º turno está concluído; o 2º turno está em andamento.",
      k_com: "Seções com log lido", k_sem: "Sem log legível", k_votos: "Votos no log", k_apos: "Votos depois do horário oficial",
      k_apos_sub: (p) => `${p} dos votos do log`, k_sin: "Seções com alguma sinalização", k_sin_sub: "em pelo menos um teste L",
      tab_t: "Os 14 testes no 1º turno", th_teste: "Teste", th_a: "Anomalias", th_i: "Informativos", th_un: "Seções analisadas",
      ver: "Ver lista",
      lista_t: "Seções sinalizadas", f_uf: "Estado", f_teste: "Teste", f_nivel: "Nível", todos: "Todos", n_a: "Anomalias", n_i: "Informativos",
      th_mun: "Município", th_zona: "Zona", th_secao: "Seção", th_nivel: "Nível", th_cat: "O que foi encontrado", th_obs: "Observado", th_ref: "Referência", th_det: "Detalhe", th_qtd: "Quantidade",
      nenhuma: "Nenhuma seção com sinalização nesse filtro.", qtd: (n, uf) => `${n} linha(s) em ${uf}.`,
      uf_t: "Por estado", th_uf: "UF", th_secs: "Seções com sinalização",
      como_t: "Como ler",
      como: ["Anomalia estatística (vermelho) é prioridade de verificação. Não é prova de fraude, erro ou irregularidade: aponta a seção para conferência com a ata da mesa, o boletim impresso e os registros da urna.",
        "Informativo (amarelo) é um evento registrado para conferência, sem atingir o critério de anomalia.",
        "Os horários são os do relógio da urna, na hora local do município.",
        "O site guarda só números tirados do log. Nenhum número de título (de eleitor ou de mesário) e nenhum arquivo .logjez ou logd.dat são publicados."],
      rel: "Relatório Técnico do 1º turno (Anexo B)", tardio: "Urnas que fecharam tarde",
      geral_t: "Votos depois do horário oficial (L01)",
      geral: (g) => [`${g.sa} seções tiveram voto depois do horário oficial (17h de Brasília, na hora local), com ${g.va} votos.`, `${g.s1} seções tiveram voto 1 hora ou mais depois, com ${g.v1} votos.`, `${g.sd} eleitores foram liberados sem digital depois do horário.`],
      sec_t: "Logs da urna (testes L01 a L14)", sec_sem: "Sem log legível para esta seção no 1º turno (teste L14).",
      sec_ok: "Nenhuma sinalização nos 14 testes do log.", sec_carregando: "Carregando os testes do log…",
      sec_leg: "Observado e referência: veja a explicação de cada teste na página Os 35 testes.",
      res_t1: "1º turno", res_t2: "2º turno", and_t2: "Em andamento",
      bloco_l: "14 testes · L01 a L14 · 1º turno concluído; 2º turno em andamento",
      bloco_l_p: "Usam o log de cada urna, que registra a hora de cada voto e de cada evento do dia. Os resultados do 1º turno estão publicados; os logs do 2º turno estão sendo baixados do TSE.",
      tag_l: "1º turno concluído",
      f_obj: "Objetivo", ver_secoes: "Ver as seções", cats_t: "O que foi encontrado no 1º turno", leg: "Legenda da lista",
      aud_nota: "Os 14 testes dos logs já foram concluídos no 1º turno e estão publicados. O 2º turno está em andamento.",
      aud_meio: "1º turno concluído",
      erro: "Não foi possível carregar os dados deste estado.",
    },
    EN: {
      nav: "Voting machine logs",
      titulo: "Voting machine logs · Round 1",
      sub: "The 14 L tests read each machine's log, with the time of every vote and every event of the day. Round 1 is completed; round 2 is in progress.",
      k_com: "Sections with a readable log", k_sem: "No readable log", k_votos: "Votes in the log", k_apos: "Votes after the official time",
      k_apos_sub: (p) => `${p} of the votes in the log`, k_sin: "Sections with any flag", k_sin_sub: "in at least one L test",
      tab_t: "The 14 tests in round 1", th_teste: "Test", th_a: "Anomalies", th_i: "Informational", th_un: "Sections analyzed",
      ver: "See list",
      lista_t: "Flagged sections", f_uf: "State", f_teste: "Test", f_nivel: "Level", todos: "All", n_a: "Anomalies", n_i: "Informational",
      th_mun: "Municipality", th_zona: "Zone", th_secao: "Section", th_nivel: "Level", th_cat: "What was found", th_obs: "Observed", th_ref: "Reference", th_det: "Detail", th_qtd: "Count",
      nenhuma: "No flagged section with this filter.", qtd: (n, uf) => `${n} row(s) in ${uf}.`,
      uf_t: "By state", th_uf: "State", th_secs: "Sections with a flag",
      como_t: "How to read it",
      como: ["A statistical anomaly (red) is a priority for checking. It is not proof of fraud, error or irregularity: it points the section out for checking against the polling station minutes, the printed tally sheet and the machine records.",
        "Informational (yellow) is an event recorded for checking, below the anomaly criterion.",
        "Times are those of the machine's clock, in the municipality's local time.",
        "The site keeps only numbers taken from the log. No voter ID number (of a voter or a poll worker) and no .logjez or logd.dat file is published."],
      rel: "Technical Report for round 1 (Appendix B)", tardio: "Machines that closed late",
      geral_t: "Votes after the official time (L01)",
      geral: (g) => [`${g.sa} sections had votes after the official time (5 pm Brasília time, in local time), with ${g.va} votes.`, `${g.s1} sections had votes 1 hour or more later, with ${g.v1} votes.`, `${g.sd} voters were released without a fingerprint after the official time.`],
      sec_t: "Machine log (tests L01 to L14)", sec_sem: "No readable log for this section in round 1 (test L14).",
      sec_ok: "No flag in the 14 log tests.", sec_carregando: "Loading the log tests…",
      sec_leg: "Observed and reference: see each test's explanation on The 35 tests page.",
      res_t1: "Round 1", res_t2: "Round 2", and_t2: "In progress",
      bloco_l: "14 tests · L01 to L14 · round 1 completed; round 2 in progress",
      bloco_l_p: "They use each machine's log, which records the time of every vote and every event of the day. Round 1 results are published; the round 2 logs are being downloaded from the TSE.",
      tag_l: "Round 1 completed",
      f_obj: "Objective", ver_secoes: "See the sections", cats_t: "What was found in round 1", leg: "List legend",
      aud_nota: "The 14 log tests are completed for round 1 and published. Round 2 is in progress.",
      aud_meio: "Round 1 completed",
      erro: "The data for this state could not be loaded.",
    },
    ES: {
      nav: "Logs de las urnas",
      titulo: "Logs de las urnas · 1.ª vuelta",
      sub: "Las 14 pruebas L leen el registro (log) de cada urna, con la hora de cada voto y de cada evento del día. La 1.ª vuelta está concluida; la 2.ª vuelta está en curso.",
      k_com: "Secciones con log leído", k_sem: "Sin log legible", k_votos: "Votos en el log", k_apos: "Votos después del horario oficial",
      k_apos_sub: (p) => `${p} de los votos del log`, k_sin: "Secciones con alguna señal", k_sin_sub: "en al menos una prueba L",
      tab_t: "Las 14 pruebas en la 1.ª vuelta", th_teste: "Prueba", th_a: "Anomalías", th_i: "Informativos", th_un: "Secciones analizadas",
      ver: "Ver lista",
      lista_t: "Secciones señaladas", f_uf: "Estado", f_teste: "Prueba", f_nivel: "Nivel", todos: "Todos", n_a: "Anomalías", n_i: "Informativos",
      th_mun: "Municipio", th_zona: "Zona", th_secao: "Sección", th_nivel: "Nivel", th_cat: "Qué se encontró", th_obs: "Observado", th_ref: "Referencia", th_det: "Detalle", th_qtd: "Cantidad",
      nenhuma: "Ninguna sección señalada con este filtro.", qtd: (n, uf) => `${n} fila(s) en ${uf}.`,
      uf_t: "Por estado", th_uf: "UF", th_secs: "Secciones con señal",
      como_t: "Cómo leer",
      como: ["La anomalía estadística (rojo) es prioridad de verificación. No es prueba de fraude, error o irregularidad: señala la sección para verificarla con el acta de la mesa, el boletín impreso y los registros de la urna.",
        "Informativo (amarillo) es un evento registrado para verificación, sin alcanzar el criterio de anomalía.",
        "Los horarios son los del reloj de la urna, en la hora local del municipio.",
        "El sitio guarda solo números tomados del log. No se publica ningún número de título (de elector o de miembro de mesa) ni ningún archivo .logjez o logd.dat."],
      rel: "Informe Técnico de la 1.ª vuelta (Anexo B)", tardio: "Urnas que cerraron tarde",
      geral_t: "Votos después del horario oficial (L01)",
      geral: (g) => [`${g.sa} secciones tuvieron votos después del horario oficial (17 h de Brasilia, en hora local), con ${g.va} votos.`, `${g.s1} secciones tuvieron votos 1 hora o más después, con ${g.v1} votos.`, `${g.sd} electores fueron liberados sin huella después del horario.`],
      sec_t: "Log de la urna (pruebas L01 a L14)", sec_sem: "Sin log legible para esta sección en la 1.ª vuelta (prueba L14).",
      sec_ok: "Ninguna señal en las 14 pruebas del log.", sec_carregando: "Cargando las pruebas del log…",
      sec_leg: "Observado y referencia: vea la explicación de cada prueba en la página Las 35 pruebas.",
      res_t1: "1.ª vuelta", res_t2: "2.ª vuelta", and_t2: "En curso",
      bloco_l: "14 pruebas · L01 a L14 · 1.ª vuelta concluida; 2.ª vuelta en curso",
      bloco_l_p: "Usan el log de cada urna, que registra la hora de cada voto y de cada evento del día. Los resultados de la 1.ª vuelta están publicados; los logs de la 2.ª vuelta se están descargando del TSE.",
      tag_l: "1.ª vuelta concluida",
      f_obj: "Objetivo", ver_secoes: "Ver las secciones", cats_t: "Qué se encontró en la 1.ª vuelta", leg: "Leyenda de la lista",
      aud_nota: "Las 14 pruebas de los logs ya se concluyeron en la 1.ª vuelta y están publicadas. La 2.ª vuelta está en curso.",
      aud_meio: "1.ª vuelta concluida",
      erro: "No se pudieron cargar los datos de este estado.",
    },
  };
  ["PT", "EN", "ES"].forEach((lg) => { if (I[lg]) { I[lg].nav.logs = TXT[lg].nav; } });
  // cartão da página na inicial e na busca
  const PG2 = {
    PT: ["Logs das urnas", "Os 14 testes do log de cada urna no 1º turno: resultados por teste, por estado e seção por seção."],
    EN: ["Voting machine logs", "The 14 tests on each machine's log in round 1: results by test, by state and section by section."],
    ES: ["Logs de las urnas", "Las 14 pruebas del log de cada urna en la 1.ª vuelta: resultados por prueba, por estado y sección por sección."],
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
      "logs/t1/{UF}.json": ["Seções de um estado com sinalização em algum teste L (1º turno).", [["campos", "mun, zona, secao, teste, nivel, cat, obs, ref, det"], ["sem_log[]", "[zona, seção] sem log legível"]]] },
    EN: { "logs/t1/resumo.json": ["Tests L01 to L14 in round 1: figures for each test, categories and the engine's texts.", [["testes.{L01…L14}", "unidades, a (anomalies), i (informational), cats [category, level, count]"], ["geral", "votes after the official time (L01)"], ["ufs.{UF}", "a, i, flagged sections"]]],
      "logs/t1/{UF}.json": ["A state's sections flagged in any L test (round 1).", [["campos", "mun, zona, secao, teste, nivel, cat, obs, ref, det"], ["sem_log[]", "[zone, section] with no readable log"]]] },
    ES: { "logs/t1/resumo.json": ["Pruebas L01 a L14 en la 1.ª vuelta: números de cada prueba, categorías y textos del motor.", [["testes.{L01…L14}", "unidades, a (anomalías), i (informativos), cats [categoría, nivel, cantidad]"], ["geral", "votos después del horario oficial (L01)"], ["ufs.{UF}", "a, i, secciones con señal"]]],
      "logs/t1/{UF}.json": ["Secciones de un estado con señal en alguna prueba L (1.ª vuelta).", [["campos", "mun, zona, secao, teste, nivel, cat, obs, ref, det"], ["sem_log[]", "[zona, sección] sin log legible"]]] },
  };
  ["PT", "EN", "ES"].forEach((lg) => { if (I[lg] && I[lg].ex && I[lg].ex.dv_desc) Object.assign(I[lg].ex.dv_desc, DV[lg]); });
  const L = () => TXT[A.state.lang] || TXT.PT;
  A.ICO_MAIS.logs = "list";
  const iLate = A.MAIS.findIndex((x) => x[0] === "late");
  if (PUBLICADO) A.MAIS.splice(iLate >= 0 ? iLate + 1 : 1, 0, ["logs", "#/logs"]);

  // textos e números de um teste L (para a página Os 35 testes)
  const txtL = (id) => { const g = LG1(); return g ? (g.txt[A.state.lang] || g.txt.PT)[id] : null; };
  const resL = (id) => { const g = LG1(); return g ? g.testes[id] : null; };
  const catNome = (c) => { const g = LG1(); return (g && g.categorias[c] && (g.categorias[c][A.state.lang] || g.categorias[c].PT)) || c; };
  const cor = (r) => (r.a ? "red" : r.i ? "amber" : "green");

  // dados de uma UF (cache)
  const cacheUF = new Map();
  function dadosUF(uf) {
    if (!cacheUF.has(uf)) {
      cacheUF.set(uf, fetch(`site/data/logs/t1/${uf}.json`).then((r) => (r.ok ? r.json() : { o: [], sem_log: [] }))
        .catch((e) => { cacheUF.delete(uf); throw e; }));
    }
    return cacheUF.get(uf);
  }

  // ------------------------------------------------------------------------------------------------ página Logs das urnas
  const st = { uf: "PR", teste: "", nivel: "" };
  function lerFiltros(q) {
    const uf = (q.get("uf") || "").toUpperCase();
    if (window.UF_NOMES[uf]) st.uf = uf;
    const te = (q.get("teste") || "").toUpperCase();
    st.teste = TESTES_L.includes(te) ? te : "";
    const nv = q.get("nivel");
    st.nivel = nv === "a" || nv === "i" ? nv : "";
  }
  const kpi = (tit, v, sub) => `<div><span class="et-k-t">${esc(tit)}</span><b>${v}</b><span>${esc(sub || "")}</span></div>`;
  const pgLogs = {
    ativo: "logs",
    titulo: () => L().titulo,
    html() {
      const E = L(), g = LG1();
      lerFiltros(A.state.query);
      if (!g) return `<header class="page-head"><h1>${esc(E.titulo)}</h1><p class="lead">${esc(E.sub)}</p></header><p class="alert">${esc(E.erro)}</p>`;
      const G = g.geral, sinSec = Object.values(g.ufs).reduce((a, u) => a + u.secoes, 0);
      const kpis = `<div class="et-kpis">${kpi(E.k_com, nf(g.cobertura.com_log))}${kpi(E.k_sem, nf(g.cobertura.sem_log))}${kpi(E.k_votos, nf(G.votos))}
        <div class="et-dest"><span class="et-k-t">${esc(E.k_apos)}</span><b>${nf(G.votos_apos)}</b><span>${esc(E.k_apos_sub(pct(G.votos_apos / (G.votos || 1), 1)))}</span></div>
        ${kpi(E.k_sin, nf(sinSec), E.k_sin_sub)}</div>`;
      const linhas = TESTES_L.map((id) => {
        const r = g.testes[id], tx = txtL(id);
        return [`<a href="#/testes/${id}">${id}. ${esc(tx.nome)}</a>`, chip(r.a ? "red" : "green", nf(r.a)), chip(r.i ? "amber" : "green", nf(r.i)), nf(r.unidades),
          `<a href="#/logs?uf=${st.uf}&teste=${id}" data-lg-ir="${id}">${esc(E.ver)}</a>`];
      });
      const ufs = Object.keys(window.UF_NOMES).sort();
      const opt = (v, txt, sel) => `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(txt)}</option>`;
      const geral = E.geral({ sa: nf(G.secoes_apos), va: nf(G.votos_apos), s1: nf(G.secoes_1h), v1: nf(G.votos_1h), sd: nf(G.sem_digital_apos) });
      const ufLinhas = ufs.filter((u) => g.ufs[u]).map((u) => [`<a href="#/logs?uf=${u}" data-lg-uf="${u}">${u} – ${esc(A.ufNome(u))}</a>`, nf(g.ufs[u].a), nf(g.ufs[u].i), nf(g.ufs[u].secoes)]);
      const rel = g.relatorio.replace("{lg}", A.state.lang);
      return `<header class="page-head"><h1>${esc(E.titulo)}</h1><p class="lead">${esc(E.sub)}</p>${A.acoes(false)}</header>
        ${kpis}
        <section class="card"><h2>${esc(E.tab_t)}</h2>${tabela([E.th_teste, E.th_a, E.th_i, E.th_un, ""], linhas, "num-cols lg-tab")}</section>
        <section class="card"><h2>${esc(E.geral_t)}</h2><ul>${geral.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="btn-row"><a class="btn btn-sm" href="#/encerramento-tardio">${icone("clock")} ${esc(E.tardio)}</a><a class="btn btn-sm btn-ghost" href="#/testes/L01">${icone("flask")} L01</a></p></section>
        <section class="card" id="lg-lista-c"><h2>${esc(E.lista_t)}</h2>
          <form class="et-filtros lg-filtros" id="lg-f" onsubmit="return false">
            <label><span>${esc(E.f_uf)}</span><select name="uf">${ufs.map((u) => opt(u, `${u} – ${A.ufNome(u)}`, u === st.uf)).join("")}</select></label>
            <label><span>${esc(E.f_teste)}</span><select name="teste">${opt("", E.todos, !st.teste)}${TESTES_L.map((id) => opt(id, `${id}. ${txtL(id).nome}`, id === st.teste)).join("")}</select></label>
            <label><span>${esc(E.f_nivel)}</span><select name="nivel">${opt("", E.todos, !st.nivel)}${opt("a", E.n_a, st.nivel === "a")}${opt("i", E.n_i, st.nivel === "i")}</select></label>
          </form>
          <p class="small muted" id="lg-qtd"></p><div id="lg-lista">${`<p class="muted">${esc(t().lk_loading)}</p>`}</div>
          <p class="small muted" id="lg-leg"></p></section>
        <section class="card"><h2>${esc(E.uf_t)}</h2>${tabela([E.th_uf, E.th_a, E.th_i, E.th_secs], ufLinhas, "num-cols")}</section>
        <section class="card"><h2>${esc(E.como_t)}</h2><ul>${E.como.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="btn-row"><a class="btn btn-sm btn-ghost" href="${esc(rel)}">${icone("download")} ${esc(E.rel)}</a><a class="btn btn-sm btn-ghost" href="#/testes/bloco-L">${icone("flask")} ${esc(window.T35 ? (window.T35[A.state.lang] || window.T35.PT).titulo : "")}</a></p></section>
        ${A.botCta()}`;
    },
    async iniciar() {
      const f = $("#lg-f");
      if (!f) return;
      const muns = await A.municipios().catch(() => ({}));
      const desenhar = async () => {
        const E = L(), box = $("#lg-lista");
        let d;
        try { d = await dadosUF(st.uf); } catch (e) { box.innerHTML = `<p class="alert">${esc(E.erro)}</p>`; return; }
        if (!$("#lg-lista")) return;
        const ls = d.o.filter((r) => (!st.teste || r[3] === st.teste) && (!st.nivel || r[4] === st.nivel));
        $("#lg-qtd").textContent = E.qtd(nf(ls.length), `${st.uf} – ${A.ufNome(st.uf)}`);
        const leg = st.teste ? (txtL(st.teste) || {}).leg : "";
        $("#lg-leg").textContent = leg ? `${E.leg}: ${leg}` : E.sec_leg;
        if (!ls.length) { box.innerHTML = `<p>${chip("green", E.nenhuma)}</p>`; return; }
        const nomeMun = (c) => { const m = (muns[st.uf] || {})[c]; return m ? A.titulo(m[0]) : c; };
        A.paginasExtra.paginar(box, ls, 50, (pg) => tabela([E.th_mun, E.th_zona, E.th_secao, E.th_teste, E.th_nivel, E.th_cat, E.th_obs, E.th_ref, E.th_det],
          pg.map((r) => [esc(nomeMun(r[0])), String(r[1]), `<a href="#/secao/${st.uf}/${r[1]}/${r[2]}">${r[2]}</a>`, `<a href="#/testes/${r[3]}">${r[3]}</a>`,
            chip(r[4] === "a" ? "red" : "amber", r[4] === "a" ? t().lv_a : t().lv_i), esc(catNome(r[5])), esc(A.dec(r[6] || "—")), esc(A.dec(r[7] || "—")), esc(A.dec(r[8] || "—"))]), "lg-lista-tab"));
      };
      const url = () => history.replaceState(null, "", `#/logs?uf=${st.uf}${st.teste ? `&teste=${st.teste}` : ""}${st.nivel ? `&nivel=${st.nivel}` : ""}`);
      f.addEventListener("change", () => { st.uf = f.elements.uf.value; st.teste = f.elements.teste.value; st.nivel = f.elements.nivel.value; url(); desenhar(); });
      document.getElementById("main").addEventListener("click", (e) => {
        const a = e.target.closest("[data-lg-ir], [data-lg-uf]");
        if (!a || !$("#lg-f")) return;
        e.preventDefault();
        if (a.dataset.lgIr) { st.teste = a.dataset.lgIr; f.elements.teste.value = st.teste; }
        if (a.dataset.lgUf) { st.uf = a.dataset.lgUf; f.elements.uf.value = st.uf; }
        url(); desenhar();
        $("#lg-lista-c").scrollIntoView({ block: "start", behavior: "smooth" });
      });
      await desenhar();
      if (A.state.query.get("teste") || A.state.query.get("uf")) { const c = $("#lg-lista-c"); if (c) c.scrollIntoView({ block: "start" }); }
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
      h += tabela([t().th_test, "", E.th_obs, E.th_ref, E.th_det], ls.map((r) => [`<a href="#/testes/${r[3]}">${r[3]}. ${esc((txtL(r[3]) || {}).nome || "")}</a><br><span class="small muted">${esc(catNome(r[5]))}</span>`,
        chip(r[4] === "a" ? "red" : "amber", r[4] === "a" ? t().lv_a : t().lv_i), esc(A.dec(r[6] || "—")), esc(A.dec(r[7] || "—")), esc(A.dec(r[8] || "—"))]))
        + `<p class="small muted">${esc(E.sec_leg)} <a href="#/logs?uf=${d.uf}">${esc(E.nav)}</a></p>`;
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
