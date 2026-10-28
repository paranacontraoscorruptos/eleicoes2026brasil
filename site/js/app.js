/* Site da auditoria: roteamento, páginas e consulta de seção. */
(function () {
  "use strict";

  const REPO = "https://github.com/paranacontraoscorruptos/eleicoes2026brasil";
  const BLOB = REPO + "/blob/main/auditoria-eleicoes-2026-Brasil/auditoria_eleicoes_2026.py";
  const ZIP = REPO + "/archive/refs/heads/main.zip";
  const PASTA = "auditoria-eleicoes-2026-Brasil";
  const TSE_PORTAL = "https://dadosabertos.tse.jus.br/";
  const TSE_RESULTADOS = "https://resultados.tse.jus.br/";
  const URL_BU_EX = "https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/buweb/bweb_2t_PR_261020260742.zip";
  const LANGS = ["PT", "EN", "ES"];

  const state = { lang: "PT", R: null, extra: null, muns: null, zonas: {} };
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  const t = () => window.I18N[state.lang];
  const nf = (n) => new Intl.NumberFormat(t().locale).format(n);
  const pct = (x, nd = 2) => new Intl.NumberFormat(t().locale, { style: "percent", minimumFractionDigits: nd, maximumFractionDigits: nd }).format(x);
  const ufNome = (uf) => { const v = window.UF_NOMES[uf]; return typeof v === "string" ? v : v[state.lang]; };
  const titulo = (s) => String(s).toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Dos|Das|E)\b/g, (m) => m.toLowerCase());
  const nomeTeste = (tid) => state.R.testes_txt[state.lang][tid].nome;
  const numTeste = (tid) => parseInt(tid.slice(1), 10);

  function tamanho(b) {
    if (b >= 1048576) return new Intl.NumberFormat(t().locale, { maximumFractionDigits: 1 }).format(b / 1048576) + " MB";
    return new Intl.NumberFormat(t().locale, { maximumFractionDigits: 0 }).format(Math.max(1, b / 1024)) + " KB";
  }
  function hora(v) {
    if (v == null) return "—";
    if (typeof v === "number") { const s = String(v).padStart(6, "0"); return s.slice(0, 2) + ":" + s.slice(2, 4) + ":" + s.slice(4); }
    return esc(v);
  }

  async function json(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status + " " + url);
    return r.json();
  }

  // --- status dos testes -------------------------------------------------------
  // Decimais vindos dos CSV do motor usam ponto; em PT/ES viram vírgula
  const dec = (v) => (state.lang === "EN" ? String(v) : String(v).replace(/(\d)\.(\d)/g, "$1,$2"));
  const ufRotulo = (uf) => (uf === "BR" ? { PT: "Brasil", EN: "Brazil", ES: "Brasil" }[state.lang] : uf);

  function status(r) { return r.sinal > 0 ? "red" : r.info > 0 ? "amber" : "green"; }
  function chip(cor, texto) { return `<span class="chip chip-${cor}"><span class="dot" aria-hidden="true"></span>${esc(texto)}</span>`; }
  function chipStatus(r) { const c = status(r); return chip(c, { red: t().st_red, amber: t().st_amber, green: t().st_green }[c]); }
  function tipoTeste(tid) { return ["T01", "T02", "T11", "T12"].includes(tid) ? t().det : ["T13", "T14", "T15"].includes(tid) ? t().agg : t().stat; }

  // --- blocos reutilizáveis ------------------------------------------------------
  function botCta(compacto) {
    const L = t();
    if (compacto) {
      return `<aside class="bot-band"><span class="bot-band-ico" aria-hidden="true">${icone("chat")}</span><p><b>${esc(L.bot_cta_title)}</b></p><button class="btn btn-bot" type="button" data-open-bot>${esc(L.bot_cta_btn)}</button></aside>`;
    }
    return `<section class="bot-cta" aria-labelledby="bot-cta-h">
      <div class="bot-cta-ico" aria-hidden="true">${icone("chat")}</div>
      <div class="bot-cta-body">
        <h2 id="bot-cta-h">${esc(L.bot_cta_title)}</h2>
        <p>${esc(L.bot_cta_text)}</p>
        <div class="bot-cta-actions"><button class="btn btn-bot btn-lg" type="button" data-open-bot>${icone("chat")} ${esc(L.bot_cta_btn)}</button></div>
        <p class="small muted">${esc(L.bot_cta_small)}</p>
      </div></section>`;
  }

  function icone(n) {
    const p = {
      chat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5z"/><circle cx="8.5" cy="9.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="9.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="9.5" r="1.1" fill="currentColor" stroke="none"/>',
      download: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/>',
      search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
      code: '<path d="m9 8-4 4 4 4m6-8 4 4-4 4"/>',
      copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4"/>',
      menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
      close: '<path d="M6 6l12 12M18 6 6 18"/>',
      send: '<path d="M4 12 20 4l-6 16-2.5-6.5z"/>',
    }[n];
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
  }

  function barras(linhas, opts) {
    // linhas: [{rotulo, valor, texto, dica}]
    const max = Math.max(...linhas.map((l) => l.valor), 1e-9);
    return `<div class="bars" role="list">` + linhas.map((l) =>
      `<div class="bar-row" role="listitem" tabindex="0" data-tip="${esc(l.dica)}">
        <span class="bar-label">${esc(l.rotulo)}</span>
        <span class="bar-track"><span class="bar" style="width:${(100 * l.valor / max).toFixed(2)}%"></span><span class="bar-value">${esc(l.texto)}</span></span>
      </div>`).join("") + `</div>` + (opts && opts.nota ? `<p class="small muted">${opts.nota}</p>` : "");
  }

  function tabela(cab, linhas, cls) {
    return `<div class="table-wrap"><table class="${cls || ""}"><thead><tr>${cab.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function copiar(txt) { return `<button class="btn-copy" type="button" data-copy="${esc(txt)}" aria-label="${esc(t().copy)}">${icone("copy")}<span>${esc(t().copy)}</span></button>`; }
  function blocoCodigo(cmd) { return `<div class="code"><pre><code>${esc(cmd)}</code></pre>${copiar(cmd)}</div>`; }

  // --- páginas ---------------------------------------------------------------------
  function paginaInicio() {
    const L = t(), R = state.R, T1 = R.turnos["1"], T2 = R.turnos["2"];
    const d = { bol: nf(T1.entrada.boletins + T2.entrada.boletins), s1: nf(T1.secoes_sinalizadas), p1: pct(T1.secoes_sinalizadas / T1.entrada.secoes),
      s2: nf(T2.secoes_sinalizadas), p2: pct(T2.secoes_sinalizadas / T2.entrada.secoes), c1: nf(T1.convergentes.length) };
    const arit = T2.testes.filter((x) => x.id === "T01" || x.id === "T02").reduce((a, x) => a + x.sinal, 0);
    const tiles = [[nf(T2.entrada.secoes), L.st_secoes], ["15", L.st_testes], [`${nf(T2.secoes_sinalizadas)} <small>(${pct(T2.secoes_sinalizadas / T2.entrada.secoes)})</small>`, L.st_sinal],
      [nf(T2.convergentes.length), L.st_conv], [nf(arit), L.st_arit]];
    const A = R.autor;
    return `
    <section class="hero">
      <p class="kicker">${esc(L.hero_kicker)}</p>
      <h1>${esc(L.hero_title)}</h1>
      <p class="lead">${esc(L.hero_sub)}</p>
      <div class="hero-actions">
        <button class="btn btn-bot btn-lg" type="button" data-open-bot>${icone("chat")} ${esc(L.bot_cta_btn)}</button>
        <a class="btn btn-lg" href="#/secao">${icone("search")} ${esc(L.cta_lookup)}</a>
        <a class="btn btn-ghost btn-lg" href="#/downloads">${icone("download")} ${esc(L.cta_downloads)}</a>
      </div>
    </section>
    ${botCta(false)}
    <section aria-labelledby="h-stats"><h2 id="h-stats">${esc(L.stats_title)}</h2>
      <div class="tiles">${tiles.map(([v, l]) => `<div class="tile"><div class="tile-v">${v}</div><div class="tile-l">${esc(l)}</div></div>`).join("")}</div>
    </section>
    <section class="card" aria-labelledby="h-found"><h2 id="h-found">${esc(L.found_title)}</h2>
      <ul class="checks">${L.found(d).map((x) => `<li>${x}</li>`).join("")}</ul>
      <p class="note">${esc(L.found_note)}</p>
    </section>
    <section aria-labelledby="h-rounds"><h2 id="h-rounds">${esc(L.rounds_title)}</h2>
      <div class="grid2">${[1, 2].map((n) => { const T = R.turnos[n]; return `<a class="round-card" href="#/turno/${n}">
        <span class="round-n">${esc(L.round(n))}</span><span class="round-d">${esc(L.roundDate[n])}</span>
        <span class="round-s">${esc(L.round_card(n, nf(T.secoes_sinalizadas), pct(T.secoes_sinalizadas / T.entrada.secoes)))}</span>
        <span class="round-chips">${T.testes.map((x) => `<span class="mini mini-${status(x)}" title="${esc(numTeste(x.id) + ". " + nomeTeste(x.id))}">${numTeste(x.id)}</span>`).join("")}</span></a>`; }).join("")}</div>
    </section>
    <section class="card" aria-labelledby="h-lk"><h2 id="h-lk">${esc(L.lookup_cta_title)}</h2><p>${esc(L.lookup_cta_text)}</p>${formSecao(true)}</section>
    <section aria-labelledby="h-leg"><h2 id="h-leg">${esc(L.legend_title)}</h2>
      <ul class="legend">${L.legend.map(([c, n, d]) => `<li>${chip(c, n)} <span class="muted">${esc(d)}</span></li>`).join("")}</ul>
    </section>
    <section class="card author" aria-labelledby="h-au"><h2 id="h-au">${esc(L.author_title)}</h2>
      <p class="author-name">${esc(A.nome)}</p>
      <p><span class="muted">${esc(L.author_spec)}:</span> ${esc(A.especialidade[state.lang])}<br><span class="muted">${esc(L.author_place)}:</span> ${esc(A.local[state.lang])}<br>Instagram: <a href="https://www.instagram.com/${esc(A.instagram.replace("@", ""))}/" rel="noopener" target="_blank">${esc(A.instagram)}</a></p>
    </section>`;
  }

  function paginaTurno(n) {
    const L = t(), R = state.R, T = R.turnos[n];
    const P = T.presidente;
    const cands = P.candidatos.filter((c) => c.nr !== "95" && c.nr !== "96");
    const val = cands.reduce((a, c) => a + c.votos, 0);
    const br = P.candidatos.find((c) => c.nr === "95"), nu = P.candidatos.find((c) => c.nr === "96");
    const pres = barras(cands.map((c) => ({ rotulo: `${titulo(c.nome)} (${c.nr})`, valor: c.votos, texto: `${nf(c.votos)} · ${pct(c.votos / val)}`,
      dica: `${titulo(c.nome)}: ${nf(c.votos)} (${pct(c.votos / val)} ${L.valid})` })),
      { nota: `${esc(L.blank)}: ${nf(br.votos)} · ${esc(L.null_)}: ${nf(nu.votos)}. ${esc(L.r_pres_note(nf(P.comparecimento), nf(P.aptos), pct(P.comparecimento / P.aptos)))}` });
    const testes = tabela([L.th_test, L.th_units, L.th_anom, L.th_info, L.th_raw, L.th_rate, L.th_status],
      T.testes.map((x) => [`<a href="#/testes/${x.id}">${numTeste(x.id)}. ${esc(nomeTeste(x.id))}</a>`, nf(x.unidades || 0), nf(x.sinal), nf(x.info),
        x.brutos == null ? "—" : nf(x.brutos), x.unidades ? pct(x.sinal / x.unidades, 3) : "—", chipStatus(x)]), "num-cols");
    const ufs = T.uf.slice().sort((a, b) => b.sinal / b.secoes - a.sinal / a.secoes);
    const ufBar = barras(ufs.map((u) => ({ rotulo: u.uf, valor: u.sinal / u.secoes, texto: pct(u.sinal / u.secoes),
      dica: `${ufNome(u.uf)}: ${nf(u.sinal)} / ${nf(u.secoes)} (${pct(u.sinal / u.secoes)})` })));
    const ufTab = tabela([L.th_uf, L.th_sections, L.th_flagged, L.th_pct], ufs.map((u) => [`${u.uf} – ${esc(ufNome(u.uf))}`, nf(u.secoes), nf(u.sinal), pct(u.sinal / u.secoes)]), "num-cols");
    const conv = T.convergentes.length
      ? tabela(["UF", L.th_mun, L.th_zone, L.th_section, L.th_tests], T.convergentes.map((c) => [c.uf, esc(titulo(c.mun)), c.zona,
        `<a href="#/secao/${c.uf}/${c.zona}/${c.secao}">${c.secao}</a>`, c.testes.split(",").map((x) => `<a href="#/testes/${x}">${numTeste(x)}</a>`).join(", ")]))
      : `<p>${esc(L.r_conv_none)}</p>`;
    const un = T.unanimidade.filter((u) => u.uf === "BR");
    const unTab = tabela([L.th_cand, L.th_100, L.th_improv], un.map((u) => [`${esc(titulo(u.nome))} (${u.nr})`, nf(u.secoes), nf(u.improv)]), "num-cols");
    const insp = T.klimek.filter((k) => k.insp).map((k) => `${esc(ufRotulo(k.uf))} (${esc(titulo(k.nome))})`).join(", ") || "—";
    const g = (nr, tipo) => `${PASTA}/resultados-${n}turno/graficos/klimek_${n}t_${nr}_${tipo}.png`;
    const fig = (nr, tipo, cap) => `<figure><a href="${g(nr, tipo)}" target="_blank" rel="noopener"><img src="${g(nr, tipo)}" alt="${esc(cap)}" loading="lazy"></a><figcaption>${esc(cap)}</figcaption></figure>`;
    const lider = cands.slice(0, 2);
    const ig = T.integridade;
    const integ = L.r_integ({ cesp: nf(ig["cesp:st_confere"] || 0), bu: nf(ig["bu:st_csv"] || 0), nucleo: esc(T.cab.nucleo_sha256), manif: esc(T.cab.manifesto_sha512),
      emissao: esc(T.cab.emissao), versao: esc(R.motor.versao), dur: esc(T.cab.duracao) });
    const rel = ["PT", "EN", "ES"].map((lg) => { const p = `${PASTA}/resultados-${n}turno/Relatorio_Tecnico_Auditoria_Eleicoes_2026_${lg}.md`;
      return `<a class="btn" href="${p}" download>${icone("download")} ${esc(L.report_lang[lg])}</a>`; }).join("");
    return `
    <header class="page-head"><p class="kicker">${esc(L.roundDate[n])}</p><h1>${esc(L.round(n))}</h1>
      <p class="muted">${esc(L.r_processed(nf(T.entrada.linhas), nf(T.entrada.secoes), nf(T.entrada.boletins)))}</p></header>
    <div class="tiles">
      <div class="tile"><div class="tile-v">${nf(T.secoes_sinalizadas)} <small>(${pct(T.secoes_sinalizadas / T.entrada.secoes)})</small></div><div class="tile-l">${esc(L.r_flagged)}</div></div>
      <div class="tile"><div class="tile-v">${nf(T.convergentes.length)}</div><div class="tile-l">${esc(L.r_conv)}</div></div>
      <div class="tile"><div class="tile-v">${nf(T.testes.filter((x) => x.id === "T01" || x.id === "T02").reduce((a, x) => a + x.sinal, 0))}</div><div class="tile-l">${esc(L.st_arit)}</div></div>
    </div>
    <section class="card"><h2>${esc(L.r_pres_title)}</h2>${pres}</section>
    <section><h2>${esc(L.r_tests_title)}</h2>${testes}</section>
    <section class="card"><div class="h-row"><h2>${esc(L.r_uf_title)}</h2><button class="btn btn-sm btn-ghost" type="button" data-toggle-view="uf">${esc(L.show_table)}</button></div>
      <p class="small muted">${esc(L.r_uf_sub)}</p><div data-view="uf-chart">${ufBar}</div><div data-view="uf-table" hidden>${ufTab}</div></section>
    <section><h2>${esc(L.r_conv_title)}</h2><p class="small muted">${esc(L.r_conv_sub)}</p>${conv}</section>
    <section><h2>${esc(L.r_un_title)}</h2>${unTab}</section>
    <section><h2>${esc(L.r_klimek_title)}</h2><p>${esc(L.r_klimek_sub)} <b>${insp}</b></p>
      <div class="figs">${lider.map((c) => fig(c.nr, "brasil", L.r_klimek_br(titulo(c.nome)))).join("")}${lider.map((c) => fig(c.nr, "por_uf", L.r_klimek_uf(titulo(c.nome)))).join("")}</div></section>
    <section class="card"><h2>${esc(L.r_integ_title)}</h2><ul class="plain">${integ.map((x) => `<li>${x}</li>`).join("")}</ul></section>
    <section><h2>${esc(L.r_dl_title)}</h2><div class="btn-row">${rel}<a class="btn btn-ghost" href="#/downloads">${esc(L.all_files)}</a></div></section>
    ${botCta(true)}`;
  }

  function paginaTestes(foco) {
    const L = t(), R = state.R, X = state.extra;
    const cards = Object.keys(R.testes_txt[state.lang]).sort().map((tid) => {
      const tx = R.testes_txt[state.lang][tid];
      const r1 = R.turnos["1"].testes.find((x) => x.id === tid), r2 = R.turnos["2"].testes.find((x) => x.id === tid);
      const res = (r, n) => `<span class="res"><span class="muted">${esc(L.round(n))}:</span> ${chip(status(r), `${nf(r.sinal)} / ${nf(r.info)}`)}</span>`;
      const codigo = X.funcs[tid].map((f) => `<a href="${BLOB}#L${f.ini}-L${f.fim}" target="_blank" rel="noopener"><code>${esc(f.nome)}</code></a>`).join(" · ");
      return `<article class="test-card" id="${tid}">
        <details${foco === tid ? " open" : ""}>
          <summary><span class="tnum">${numTeste(tid)}</span><span class="tmain"><span class="tname">${esc(tx.nome)}</span><span class="ttype">${esc(tipoTeste(tid))}</span>
            <span class="tsimple">${esc(X.simples[state.lang][tid])}</span><span class="tres">${res(r1, 1)}${res(r2, 2)}</span></span></summary>
          <div class="tbody">
            <h3>${esc(L.f_obj)}</h3><p>${esc(tx.objetivo)}</p>
            <h3>${esc(L.f_met)}</h3><p>${esc(tx.metodo)}</p>
            <h3>${esc(L.f_crit)}</h3><p>${esc(tx.criterio)}</p>
            <h3>${esc(L.f_lim)}</h3><p>${esc(tx.limites)}</p>
            <p class="btn-row"><button class="btn btn-bot btn-sm" type="button" data-ask="${esc(L.ask_test(numTeste(tid)))}">${icone("chat")} ${esc(L.f_ask)}</button>
            <span class="small">${icone("code")} ${esc(L.f_code)}: ${codigo}</span></p>
          </div></details></article>`;
    }).join("");
    return `<header class="page-head"><h1>${esc(L.tests_title)}</h1><p class="lead">${esc(L.tests_sub)}</p>
      <ul class="legend inline">${L.legend.map(([c, nm]) => `<li>${chip(c, nm)}</li>`).join("")}<li class="muted small">${esc(L.th_anom)} / ${esc(L.th_info)}</li></ul></header>
      <div class="tests">${cards}</div>${botCta(true)}`;
  }

  function formSecao(compacto, uf, z, s) {
    const L = t();
    const ufs = Object.keys(window.UF_NOMES).sort();
    return `<form class="lk-form${compacto ? " compact" : ""}" data-lookup novalidate>
      <label><span>${esc(L.lk_uf)}</span><select name="uf" required>${ufs.map((u) => `<option value="${u}"${u === (uf || "PR") ? " selected" : ""}>${u} – ${esc(ufNome(u))}</option>`).join("")}</select></label>
      ${compacto ? "" : `<label class="lk-mun"><span>${esc(L.lk_mun)}</span><select name="mun"><option value="">${esc(L.lk_mun_all)}</option></select></label>`}
      <label><span>${esc(L.lk_zone)}</span><input name="zona" inputmode="numeric" pattern="[0-9]*" required autocomplete="off" value="${z ? esc(z) : ""}" ${compacto ? "" : 'list="lk-zonas"'}></label>
      <label><span>${esc(L.lk_section)}</span><input name="secao" inputmode="numeric" pattern="[0-9]*" required autocomplete="off" value="${s ? esc(s) : ""}"></label>
      <button class="btn btn-primary" type="submit">${icone("search")} ${esc(L.lk_go)}</button>
      ${compacto ? "" : '<datalist id="lk-zonas"></datalist>'}
    </form><p class="small muted">${esc(L.lk_where)}</p>`;
  }

  function paginaSecao(uf, z, s) {
    const L = t();
    return `<header class="page-head"><h1>${esc(L.lk_title)}</h1><p class="lead">${esc(L.lk_sub)}</p></header>
      <section class="card">${formSecao(false, uf, z, s)}</section>
      <p class="note small">${esc(L.lk_privacy)}</p>
      <div id="lk-result" aria-live="polite"></div>${botCta(true)}`;
  }

  async function zona(uf, z) {
    const k = uf + "/" + z;
    if (!(k in state.zonas)) {
      try { state.zonas[k] = await json(`site/data/secoes/${uf}/${z}.json`); } catch (e) { state.zonas[k] = null; }
    }
    return state.zonas[k];
  }

  // Devolve os dados de uma seção (ou null se a zona não existir)
  async function consultarSecao(uf, z, s) {
    uf = String(uf).toUpperCase(); z = parseInt(z, 10); s = parseInt(s, 10);
    if (!window.UF_NOMES[uf] || !(z > 0) || !(s > 0)) return { erro: "param" };
    const Z = await zona(uf, z);
    if (!Z) return { erro: "zona", uf, z, s };
    const rec = Z.s[String(s)];
    const out = { uf, z, s, rec: null, agregadaEm: [] };
    if (!rec) {
      for (const [num, r] of Object.entries(Z.s)) {
        for (const t_ of [1, 2]) {
          const ag = r[t_] && r[t_][4];
          if (ag && String(ag).split("/").map((x) => parseInt(x, 10)).includes(s) && !out.agregadaEm.includes(num)) out.agregadaEm.push(num);
        }
      }
      out.erro = "secao";
      return out;
    }
    out.rec = rec;
    out.mun = Z.mun[rec[0]];
    return out;
  }

  function votosTurno(n, tv) {
    // tv = [aptos, comp, abert, encerr, agreg, votos]
    const R = state.R, ordem = R.ordem_votos[n];
    const nomes = {}; R.turnos[n].presidente.candidatos.forEach((c) => { nomes[c.nr] = c.nome; });
    const v = {}; ordem.forEach((nr, i) => { v[nr] = tv[5][i] || 0; });
    return { v, nomes };
  }

  function htmlSecao(d) {
    const L = t(), R = state.R;
    if (d.erro === "zona") return `<p class="alert">${esc(L.lk_nozone)}</p>`;
    if (d.erro === "secao") {
      let h = `<p class="alert">${esc(L.lk_nosec)}</p>`;
      if (d.agregadaEm.length) h += `<p>${esc(L.lk_agg_hint(d.s))} ${d.agregadaEm.map((x) => `<a href="#/secao/${d.uf}/${d.z}/${x}">${esc(x)}</a>`).join(", ")}</p>`;
      return h;
    }
    if (d.erro) return "";
    const rec = d.rec, flags = rec[3] || {};
    const turnos = [2, 1].map((n) => {
      const tv = rec[n];
      const f = flags[String(n)];
      let corpo;
      if (!tv) corpo = `<p class="muted">${esc(L.lk_nodata)}</p>`;
      else {
        const { v, nomes } = votosTurno(n, tv);
        const cands = Object.keys(v).filter((nr) => nr !== "95" && nr !== "96" && v[nr] > 0).sort((a, b) => v[b] - v[a]);
        const val = cands.reduce((a, nr) => a + v[nr], 0) || 1;
        const linhas = cands.map((nr) => [`${esc(titulo(nomes[nr]))} (${nr})`, nf(v[nr]), pct(v[nr] / val)]);
        linhas.push([esc(L.blank), nf(v["95"] || 0), ""], [esc(L.null_), nf(v["96"] || 0), ""]);
        const kv = [[L.lk_aptos, nf(tv[0])], [L.lk_comp, `${nf(tv[1])} (${pct(tv[1] / tv[0], 1)})`], [L.lk_abst, nf(tv[0] - tv[1])],
          [L.lk_open, `${hora(tv[2])}`], [L.lk_close, `${hora(tv[3])}`]];
        if (tv[4]) kv.push([L.lk_agreg, esc(tv[4])]);
        corpo = `<dl class="kv">${kv.map(([k, x]) => `<div><dt>${esc(k)}</dt><dd>${x}</dd></div>`).join("")}</dl><p class="small muted">${esc(L.lk_open)}/${esc(L.lk_close)}: ${esc(L.lk_local)}.</p>`
          + tabela([L.th_cand, L.lk_comp, "%"], linhas, "num-cols");
      }
      let fl;
      if (f && f.o.length) {
        fl = `<p class="small muted">${esc(L.lk_urna(f.u, f.c, f.l))}</p>` + tabela([L.th_test, "", L.th_cargo, L.th_obs, L.th_ref, L.th_q],
          f.o.map((o) => [`<a href="#/testes/${o[0]}">${numTeste(o[0])}. ${esc(nomeTeste(o[0]))}</a><br><span class="small muted">${esc((R.categorias[o[2]] || {})[state.lang] || o[2])}</span>`,
            chip(o[1] === "a" ? "red" : "amber", o[1] === "a" ? L.lv_a : L.lv_i), esc(o[3] && o[3] !== "—" ? o[3] : "—"), esc(dec(o[4] || "—")), esc(dec(o[5] || "—")),
            o[6] == null ? "—" : esc(dec(Number(o[6]).toExponential(2)))]));
      } else fl = `<p>${chip("green", L.lk_noflags)}</p>`;
      return `<section class="card round-box"><h3>${esc(L.round(n))} <span class="muted small">${esc(L.roundDate[n])}</span></h3>${corpo}<h4>${esc(L.lk_flags)}</h4>${fl}</section>`;
    }).join("");
    return `<h2 class="lk-head">${esc(d.uf)} · ${esc(titulo(d.mun[1]))} · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s}</h2>${turnos}
      <p class="small">${esc(L.lk_check)} <a href="${TSE_RESULTADOS}" target="_blank" rel="noopener">resultados.tse.jus.br</a>.</p>`;
  }

  function paginaReplicar() {
    const L = t(), R = state.R;
    const passos = L.rp_steps.map(([tit, txt, cmd]) => `<li><h3>${esc(tit)}</h3>${txt ? `<p>${txt}</p>` : ""}${cmd ? blocoCodigo(cmd) : ""}</li>`).join("");
    const hashes = [["Windows (Prompt)", "certutil -hashfile auditoria_eleicoes_2026.py SHA512"], ["Windows (PowerShell)", "Get-FileHash auditoria_eleicoes_2026.py -Algorithm SHA512"],
      ["Linux", "sha512sum auditoria_eleicoes_2026.py"], ["macOS", "shasum -a 512 auditoria_eleicoes_2026.py"]];
    const vals = [1, 2].map((n) => { const T = R.turnos[n]; return [esc(L.round(n)), `<code class="wrap">${esc(T.cab.nucleo_sha256)}</code>`, `<code class="wrap">${esc(T.cab.manifesto_sha512)}</code>`]; });
    return `<header class="page-head"><h1>${esc(L.rp_title)}</h1><p class="lead">${esc(L.rp_sub)}</p></header>
      <ol class="steps">${passos}</ol>
      <section class="card"><h2>${esc(L.rp_links)}</h2><ul class="plain">
        <li><a href="${TSE_PORTAL}" target="_blank" rel="noopener">${esc(L.rp_portal)}</a></li>
        <li>${esc(L.rp_example)}${blocoCodigo(URL_BU_EX)}${blocoCodigo(URL_BU_EX + ".sha512")}</li></ul></section>
      <section><h2>${esc(L.rp_opts_title)}</h2>${tabela(["", ""], L.rp_opts.map(([o, d]) => [`<code>${esc(o)}</code>`, esc(d)]))}</section>
      <section><h2>${esc(L.rp_hash_title)}</h2>${hashes.map(([s, c]) => `<p class="small muted">${esc(s)}</p>${blocoCodigo(c)}`).join("")}</section>
      <section><h2>${esc(L.rp_nucleo_title)}</h2>${tabela(["", { PT: "SHA-256 do núcleo analítico", EN: "Analytical core SHA-256", ES: "SHA-256 del núcleo analítico" }[state.lang], { PT: "SHA-512 do manifesto", EN: "Manifest SHA-512", ES: "SHA-512 del manifiesto" }[state.lang]], vals)}<p class="small muted">${esc(L.rp_env)}</p></section>
      ${botCta(true)}`;
  }

  function paginaDownloads() {
    const L = t(), R = state.R;
    const linha = (d) => {
      const nomeArq = d.nome;
      const desc = L.dl_desc[nomeArq] || (nomeArq.startsWith("graficos/") ? `${L.dl_graph}: ${nomeArq.slice(9)}` : "");
      return [`<span class="fname">${esc(nomeArq)}</span>${desc ? `<br><span class="small muted">${esc(desc)}</span>` : ""}`, tamanho(d.bytes),
        `<details class="sha"><summary><code>${esc(d.sha512.slice(0, 16))}…</code></summary><code class="wrap">${esc(d.sha512)}</code></details>${copiar(d.sha512)}`,
        `<a class="btn btn-sm" href="${esc(d.path)}" download>${icone("download")} ${esc(L.dl_btn)}</a>`];
    };
    const grupo = (tit, itens) => `<section><h2>${esc(tit)}</h2>${tabela([L.th_file, L.th_size, L.th_sha, ""], itens.map(linha), "dl")}</section>`;
    const ord = (a, b) => (a.nome.includes("/") - b.nome.includes("/")) || a.nome.localeCompare(b.nome);
    return `<header class="page-head"><h1>${esc(L.dl_title)}</h1><p class="lead">${esc(L.dl_sub)}</p></header>
      <section class="card dl-all"><a class="btn btn-primary btn-lg" href="${ZIP}">${icone("download")} ${esc(L.dl_all)}</a><p class="small muted">${esc(L.dl_all_note)}</p></section>
      ${grupo(L.dl_code, R.downloads.filter((d) => d.turno === 0))}
      ${[1, 2].map((n) => grupo(L.dl_round(n), R.downloads.filter((d) => d.turno === n).sort(ord))).join("")}
      <section><h2>${esc(L.rp_hash_title)}</h2>${blocoCodigo("certutil -hashfile Relatorio_Tecnico_Auditoria_Eleicoes_2026_PT.md SHA512")}</section>
      ${botCta(true)}`;
  }

  function paginaLimitacoes() {
    const L = t();
    return `<header class="page-head"><h1>${esc(L.lm_title)}</h1></header>
      <div class="grid2">
        <section class="card"><h2>${esc(L.lm_proves_title)}</h2><ul class="checks">${L.lm_proves.map((x) => `<li>${x}</li>`).join("")}</ul></section>
        <section class="card"><h2>${esc(L.lm_not_title)}</h2><ul class="crosses">${L.lm_not.map((x) => `<li>${x}</li>`).join("")}</ul></section>
      </div>
      <section><h2>${esc(L.lm_expected_title)}</h2><p>${esc(L.lm_expected)}</p></section>
      <section><h2>${esc(L.lm_site_title)}</h2><p>${esc(L.lm_site)}</p></section>
      ${botCta(true)}`;
  }

  // --- roteamento ------------------------------------------------------------------
  function rota() {
    const h = (location.hash || "#/").replace(/^#/, "");
    const p = h.split("/").filter(Boolean);
    return p;
  }

  async function render() {
    const L = t(), p = rota(), main = $("#main");
    let html, ativo = "home", tit = L.hero_title;
    if (p[0] === "turno" && (p[1] === "1" || p[1] === "2")) { html = paginaTurno(p[1]); ativo = "r" + p[1]; tit = L.round(+p[1]); }
    else if (p[0] === "testes") { html = paginaTestes(p[1]); ativo = "tests"; tit = L.tests_title; }
    else if (p[0] === "secao") { html = paginaSecao(p[1], p[2], p[3]); ativo = "lookup"; tit = L.lk_title; }
    else if (p[0] === "replicar") { html = paginaReplicar(); ativo = "replicate"; tit = L.rp_title; }
    else if (p[0] === "downloads") { html = paginaDownloads(); ativo = "downloads"; tit = L.dl_title; }
    else if (p[0] === "limitacoes") { html = paginaLimitacoes(); ativo = "limits"; tit = L.lm_title; }
    else html = paginaInicio();
    main.innerHTML = html;
    document.title = (ativo === "home" ? "" : tit + " · ") + L.brand;
    $$(".nav a").forEach((a) => a.setAttribute("aria-current", a.dataset.nav === ativo ? "page" : "false"));
    fecharMenu();
    if (p[0] === "testes" && p[1]) { const el = document.getElementById(p[1]); if (el) el.scrollIntoView({ block: "start" }); }
    else window.scrollTo(0, 0);
    if (p[0] === "secao") await iniciarSecao(p[1], p[2], p[3]);
  }

  async function iniciarSecao(uf, z, s) {
    const form = $("form[data-lookup]:not(.compact)");
    if (!form) return;
    const selUf = form.elements.uf, selMun = form.elements.mun, dl = $("#lk-zonas");
    if (!state.muns) { try { state.muns = await json("site/data/municipios.json"); } catch (e) { state.muns = {}; } }
    const encherMun = () => {
      const m = state.muns[selUf.value] || {};
      const itens = Object.entries(m).sort((a, b) => a[1][0].localeCompare(b[1][0], "pt"));
      selMun.innerHTML = `<option value="">${esc(t().lk_mun_all)}</option>` + itens.map(([cod, [nm]]) => `<option value="${cod}">${esc(titulo(nm))}</option>`).join("");
      encherZonas();
    };
    const encherZonas = () => {
      const m = state.muns[selUf.value] || {};
      let zs = selMun.value ? (m[selMun.value] || ["", []])[1] : [...new Set(Object.values(m).flatMap((x) => x[1]))];
      zs = zs.slice().sort((a, b) => a - b);
      dl.innerHTML = zs.map((x) => `<option value="${x}">`).join("");
      if (selMun.value && zs.length === 1) form.elements.zona.value = zs[0];
    };
    selUf.addEventListener("change", encherMun);
    selMun.addEventListener("change", encherZonas);
    encherMun();
    if (uf && z && s) {
      if (window.UF_NOMES[uf.toUpperCase()]) selUf.value = uf.toUpperCase();
      const box = $("#lk-result");
      box.innerHTML = `<p class="muted">${esc(t().lk_loading)}</p>`;
      const d = await consultarSecao(uf, z, s);
      box.innerHTML = htmlSecao(d);
    }
  }

  // --- interface global ---------------------------------------------------------
  function fecharMenu() { document.body.classList.remove("menu-open"); const b = $("#menu-btn"); if (b) b.setAttribute("aria-expanded", "false"); }

  function montarCabecalho() {
    const L = t();
    $("#brand-name").textContent = L.brand;
    $("#badge").textContent = L.badge;
    const itens = [["home", "#/"], ["r1", "#/turno/1"], ["r2", "#/turno/2"], ["tests", "#/testes"], ["lookup", "#/secao"], ["replicate", "#/replicar"], ["downloads", "#/downloads"], ["limits", "#/limitacoes"]];
    $("#nav").innerHTML = itens.map(([k, h]) => `<a href="${h}" data-nav="${k}">${esc(L.nav[k])}</a>`).join("");
    $("#lang").innerHTML = LANGS.map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === state.lang}">${l}</button>`).join("");
    $("#lang").setAttribute("aria-label", L.lang);
    $("#theme-btn").setAttribute("aria-label", L.theme); $("#theme-btn").title = L.theme;
    $("#menu-btn").setAttribute("aria-label", L.menu);
    const A = state.R ? state.R.autor : null;
    $("#footer").innerHTML = `<p>${esc(L.ft_disclaimer)}</p>
      <p>${A ? `${esc(L.ft_author)}: ${esc(A.nome)} · Instagram <a href="https://www.instagram.com/${esc(A.instagram.replace("@", ""))}/" target="_blank" rel="noopener">${esc(A.instagram)}</a> · ` : ""}<a href="${REPO}" target="_blank" rel="noopener">${esc(L.ft_repo)}</a></p>`;
    document.documentElement.lang = { PT: "pt-BR", EN: "en", ES: "es" }[state.lang];
  }

  function definirIdioma(l) {
    if (!LANGS.includes(l)) return;
    state.lang = l; guardar("lang", l);
    montarCabecalho(); render();
    if (window.BOT) window.BOT.idioma(l);
  }

  function tema(alternar) {
    const raiz = document.documentElement;
    let atual = raiz.getAttribute("data-theme");
    if (!atual) atual = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    if (alternar) { atual = atual === "dark" ? "light" : "dark"; raiz.setAttribute("data-theme", atual); guardar("theme", atual); }
  }

  // Dica flutuante para barras (mouse e teclado)
  function dicas() {
    const tip = document.createElement("div");
    tip.className = "tip"; tip.setAttribute("role", "tooltip"); tip.hidden = true;
    document.body.appendChild(tip);
    const mostrar = (el, x, y) => { tip.textContent = el.dataset.tip; tip.hidden = false;
      const r = tip.getBoundingClientRect(); let left = x + 12, top = y - r.height - 10;
      if (left + r.width > window.innerWidth - 8) left = window.innerWidth - r.width - 8; if (top < 8) top = y + 16;
      tip.style.left = left + "px"; tip.style.top = top + "px"; };
    document.addEventListener("mousemove", (e) => { const el = e.target.closest("[data-tip]"); if (el) mostrar(el, e.clientX, e.clientY); else tip.hidden = true; });
    document.addEventListener("focusin", (e) => { const el = e.target.closest("[data-tip]"); if (el) { const r = el.getBoundingClientRect(); mostrar(el, r.left + r.width / 2, r.top); } });
    document.addEventListener("focusout", () => { tip.hidden = true; });
    window.addEventListener("scroll", () => { tip.hidden = true; }, { passive: true });
  }

  function eventos() {
    document.addEventListener("click", async (e) => {
      const lg = e.target.closest("[data-lang]"); if (lg) { definirIdioma(lg.dataset.lang); return; }
      if (e.target.closest("#theme-btn")) { tema(true); return; }
      if (e.target.closest("#menu-btn")) { const o = document.body.classList.toggle("menu-open"); $("#menu-btn").setAttribute("aria-expanded", String(o)); return; }
      const ob = e.target.closest("[data-open-bot]"); if (ob && window.BOT) { window.BOT.abrir(); return; }
      const ask = e.target.closest("[data-ask]"); if (ask && window.BOT) { window.BOT.abrir(ask.dataset.ask); return; }
      const cp = e.target.closest("[data-copy]");
      if (cp) {
        try { await navigator.clipboard.writeText(cp.dataset.copy); const s = cp.querySelector("span"); const o = s.textContent; s.textContent = t().copied; setTimeout(() => { s.textContent = o; }, 1500); } catch (err) { /* sem área de transferência */ }
        return;
      }
      const tg = e.target.closest("[data-toggle-view]");
      if (tg) {
        const k = tg.dataset.toggleView, ch = $(`[data-view="${k}-chart"]`), tb = $(`[data-view="${k}-table"]`);
        const mostrarTabela = !ch.hidden; ch.hidden = mostrarTabela; tb.hidden = !mostrarTabela;
        tg.textContent = mostrarTabela ? t().show_chart : t().show_table;
      }
    });
    document.addEventListener("submit", (e) => {
      const f = e.target.closest("form[data-lookup]");
      if (!f) return;
      e.preventDefault();
      const uf = f.elements.uf.value, z = parseInt(f.elements.zona.value, 10), s = parseInt(f.elements.secao.value, 10);
      if (!(z > 0)) { f.elements.zona.focus(); return; }
      if (!(s > 0)) { f.elements.secao.focus(); return; }
      const alvo = `#/secao/${uf}/${z}/${s}`;
      if (location.hash === alvo) render(); else location.hash = alvo;
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharMenu(); });
    window.addEventListener("hashchange", render);
  }

  async function iniciar() {
    const salvo = ler("lang");
    const nav = (navigator.language || "pt").slice(0, 2).toLowerCase();
    state.lang = LANGS.includes(salvo) ? salvo : nav === "en" ? "EN" : nav === "es" ? "ES" : "PT";
    const th = ler("theme"); if (th === "dark" || th === "light") document.documentElement.setAttribute("data-theme", th);
    montarCabecalho();
    eventos(); dicas();
    try {
      [state.R, state.extra] = await Promise.all([json("site/data/resumo.json"), json("site/data/testes_extra.json")]);
    } catch (e) {
      $("#main").innerHTML = `<p class="alert">Erro ao carregar os dados (${esc(e.message)}).</p>`;
      return;
    }
    montarCabecalho();
    await render();
    if (window.BOT) window.BOT.iniciar(state.lang);
  }

  window.APP = { state, t, nf, pct, esc, titulo, ufNome, hora, numTeste, nomeTeste, consultarSecao, votosTurno, icone };
  document.addEventListener("DOMContentLoaded", iniciar);
})();
