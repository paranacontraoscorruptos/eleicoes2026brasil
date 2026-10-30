/* Atlas: página própria de conversa. Responde sobre a auditoria (mesma base do bot) e sobre os dados de cada
   estado, município, zona, seção e urna; confere o QR Code do boletim, arquivos (SHA-512), listas de seções e
   apurações próprias; leva aos downloads; e tem conexões: compartilhar, exportar, IBGE, TSE, GitHub e automação.
   Tudo roda no navegador: arquivos são lidos só neste aparelho e as conversas ficam só neste navegador. */
(function () {
  "use strict";

  const A = window.APP;
  const { esc, icone, $, $$ } = A;
  const t = () => A.t(), X = () => A.t().at;
  const nf = (n) => A.nf(n), pct = (x, d) => A.pct(x, d);
  const R = () => A.state.R;
  const ext = () => A.paginasExtra;
  const motor = () => window.BOT.motor;
  const URL_SITE = "https://paranacontraoscorruptos.org/";
  const TSE = "https://resultados.tse.jus.br/oficial/ele2026/";
  const ELEICAO = { 1: "6257", 2: "6258" }, PLEITO = { 1: "3220", 2: "3221" };
  const IBGE = "https://servicodados.ibge.gov.br/api/";
  const MAX_LINHAS = 500;
  const nz = (s) => String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const enc = encodeURIComponent;
  const Reconhecer = window.SpeechRecognition || window.webkitSpeechRecognition;
  const podeFalar = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
  const podeCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const toque = () => window.matchMedia("(pointer: coarse)").matches;

  // Funções da barra lateral: [chave, ícone]
  const FUNCS = [["ask", "chat"], ["secao", "search"], ["zona", "grid"], ["municipio", "pin"], ["estado", "map"], ["brasil", "flag"], ["urna", "vote"],
    ["qr", "qr"], ["hash", "hash"], ["lista", "list"], ["apuracao", "chart"], ["downloads", "download"], ["tse", "shield"], ["ibge", "users"]];
  // Itens do botão "+": [chave, ícone]
  const MAIS = [["foto", "image"], ["camera", "camera"], ["hash", "hash"], ["lista", "list"], ["apuracao", "chart"]];

  // --- guardado neste navegador ------------------------------------------------------------------------
  const CH = { conv: "atlas_conversas", lado: "atlas_lateral", con: "atlas_conexoes", hook: "atlas_automacao", salvar: "atlas_salvar" };
  function lerJ(k, pad) { try { const v = JSON.parse(A.ler(k) || "null"); return v == null ? pad : v; } catch (e) { return pad; } }
  function gravarJ(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  // Compartilhar, exportar e GitHub só agem quando a pessoa toca; IBGE, TSE e automação falam com outro site e começam desligados
  const CON_PADRAO = { share: true, export: true, github: true, ibge: false, tse: false, hook: false };
  const S = {
    convs: [], atual: null, ocupado: false, el: {}, qr: { partes: {} }, cam: null, idxLug: null,
    con: Object.assign({}, CON_PADRAO, lerJ(CH.con, {})),
    hook: Object.assign({ url: "", auto: false }, lerJ(CH.hook, {})),
    salvar: A.ler(CH.salvar) !== "0",
  };
  S.convs = S.salvar ? lerJ(CH.conv, []) : [];
  if (!Array.isArray(S.convs)) S.convs = [];

  const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function conversa() {
    let c = S.convs.find((x) => x.id === S.atual);
    if (!c) { c = { id: novoId(), t: "", d: Date.now(), m: [] }; S.convs.unshift(c); S.atual = c.id; }
    return c;
  }
  function guardarConversas() {
    if (!S.salvar) return;
    let l = S.convs.filter((c) => c.m.length).slice(0, 40);
    // sem espaço: descarta as conversas mais antigas
    while (!gravarJ(CH.conv, l) && l.length) l = l.slice(0, -1);
  }
  function registrar(m) {
    const c = conversa();
    c.m.push(Object.assign({ ts: Date.now() }, m));
    if (c.m.length > 200) c.m = c.m.slice(-200);
    if (m.r === "u" && !c.t) c.t = (m.txt || "").slice(0, 70);
    c.d = Date.now();
    S.convs = [c].concat(S.convs.filter((x) => x !== c));
    guardarConversas();
    listaConversas();
  }

  // --- pequenos blocos de HTML ---------------------------------------------------------------------------
  const marca = () => `<span class="at-marca" aria-hidden="true">${icone("globe")}</span>`;
  const cab = (txt, sub) => `<p class="at-h"><b>${txt}</b>${sub ? ` <span class="muted">${sub}</span>` : ""}</p>`;
  const fonte = (txt) => `<p class="msg-src">${esc(t().bot_source)}: ${esc(txt)}</p>`;
  const botoes = (bs) => { const l = bs.filter(Boolean); return l.length ? `<div class="at-btns">${l.join("")}</div>` : ""; };
  const ir = (h, ic, txt) => `<button type="button" class="btn btn-sm" data-go="${esc(h)}">${icone(ic)} ${esc(txt)}</button>`;
  const perg = (q, txt) => `<button type="button" class="chipq" data-q="${esc(q)}">${esc(txt || q)}</button>`;
  const chipsQ = (l) => (l.length ? `<div class="chips">${l.join("")}</div>` : "");
  const btnArq = (k, rot) => `<button type="button" class="btn btn-sm" data-at-arq="${k}">${icone(MAIS.find((x) => x[0] === k)[1])} ${esc(rot || X().up[k][0])}</button>`;
  const btnCon = () => `<button type="button" class="btn btn-sm" data-at="conexoes">${icone("plug")} ${esc(X().conn_open)}</button>`;
  const kv = (l) => `<dl class="kv">${l.map(([k, x]) => `<div><dt>${esc(k)}</dt><dd>${x}</dd></div>`).join("")}</dl>`;
  const tabela = (cab_, linhas, cls) => A.tabela(cab_.map(esc), linhas, cls);
  const tam = (b) => (b >= 1048576 ? new Intl.NumberFormat(t().locale, { maximumFractionDigits: 1 }).format(b / 1048576) + " MB" : nf(Math.max(1, Math.round(b / 1024))) + " KB");
  const nomeMun = (uf, cod, muns) => A.titulo(((muns[uf] || {})[cod] || [cod])[0]);
  const z4 = (x) => String(x).padStart(4, "0");

  function nomesTurno(n) { const o = {}; R().turnos[n].presidente.candidatos.forEach((c) => { o[c.nr] = c.nome; }); return o; }
  function votosObj(n, arr) { const o = {}; R().ordem_votos[n].forEach((nr, i) => { o[nr] = (arr && arr[i]) || 0; }); return o; }

  // Um turno: eleitores, comparecimento, barras dos candidatos e brancos/nulos
  function blocoTurno(n, aptos, comp, arr, extraKv) {
    const L = t(), nomes = nomesTurno(n), v = votosObj(n, arr);
    const cands = Object.keys(v).filter((nr) => nr !== "95" && nr !== "96" && v[nr] > 0).sort((a, b) => v[b] - v[a]);
    const val = cands.reduce((a, nr) => a + v[nr], 0) || 1;
    const linhas = [[L.lk_aptos, nf(aptos)], [L.lk_comp, `${nf(comp)} (${pct(comp / (aptos || 1), 1)})`], [L.lk_abst, nf(aptos - comp)]].concat(extraKv || []);
    return `<h4 class="at-t">${esc(L.round(n))} <span class="muted small">${esc(L.roundDate[n])}</span></h4>${kv(linhas)}
      ${A.barras(cands.slice(0, n === 1 ? 5 : 2).map((nr) => ({ rotulo: `${A.titulo(nomes[nr] || nr)} (${nr})`, valor: v[nr], texto: `${nf(v[nr])} · ${pct(v[nr] / val)}`,
        dica: `${nf(v[nr])} · ${pct(v[nr] / val)} ${L.valid}\n${A.titulo(nomes[nr] || nr)} (${nr})` })))}
      <p class="small muted">${esc(L.blank)}: ${nf(v["95"] || 0)} · ${esc(L.null_)}: ${nf(v["96"] || 0)}</p>`;
  }

  // Seções com sinalização (ocorrencias.json: [uf, mun, zona, secao, turno, teste, nivel, cat])
  async function sinais(filtro) {
    const oc = await ext().ocorrencias();
    const r = { 1: { a: new Set(), i: new Set() }, 2: { a: new Set(), i: new Set() } };
    oc.forEach((o) => { if (filtro(o)) r[o[4]][o[6] === "a" ? "a" : "i"].add(o[2] + "/" + o[3]); });
    return r;
  }
  function blocoSinais(s, nota) {
    const T = X(), L = t();
    const linha = (n) => `<li><b>${esc(L.round(n))}:</b> ${A.chip(s[n].a.size ? "red" : "green", T.sg_a(nf(s[n].a.size)))} ${A.chip(s[n].i.size ? "amber" : "green", T.sg_i(nf(s[n].i.size)))}</li>`;
    return `<h4 class="at-t">${esc(T.sg_t)}</h4><ul class="at-sinais">${linha(2)}${linha(1)}</ul><p class="small muted">${esc(nota || T.sg_note)}</p>`;
  }

  // --- página ----------------------------------------------------------------------------------------------
  const escuro = () => document.documentElement.getAttribute("data-theme") !== "light";
  function menuMais() {
    const T = X();
    return MAIS.filter(([k]) => k !== "camera" || podeCamera).map(([k, ic]) => `<button type="button" role="menuitem" data-at-arq="${k}">${icone(ic)}<span><b>${esc(T.up[k][0])}</b><small>${esc(T.up[k][1])}</small></span></button>`).join("")
      + `<p class="at-menu-nota">${icone("shield")}<span>${esc(T.privacy)}</span></p>`;
  }

  function html() {
    const L = t(), T = X();
    const lado = A.ler(CH.lado) === "mini" ? "mini" : "aberto";
    return `<div class="atlas vazio" id="atlas" data-lado="${lado}">
      <aside class="at-side" id="at-side" aria-label="${esc(T.side_aria)}">
        <div class="at-side-top">
          <button class="at-logo" type="button" data-at="nova" title="${esc(T.new_chat)}">${marca()}<span class="at-nome">Atlas</span></button>
          <button class="at-ib at-recolher" type="button" data-at="lado" aria-expanded="${lado !== "mini"}" aria-controls="at-side" aria-label="${esc(lado === "mini" ? T.side_expand : T.side_collapse)}" title="${esc(lado === "mini" ? T.side_expand : T.side_collapse)}">${icone("sidebar")}</button>
          <button class="at-ib at-fechar-lado" type="button" data-at="gaveta-fechar" aria-label="${esc(T.side_close)}">${icone("close")}</button>
        </div>
        <button class="at-nova" type="button" data-at="nova" title="${esc(T.new_chat)}">${icone("plus")}<span>${esc(T.new_chat)}</span></button>
        <nav class="at-funcs" aria-label="${esc(T.funcs_t)}"><p class="at-side-h">${esc(T.funcs_t)}</p>
          ${FUNCS.map(([k, ic]) => `<button type="button" class="at-fn" data-at-fn="${k}" title="${esc(T.fn[k][1])}">${icone(ic)}<span>${esc(T.fn[k][0])}</span></button>`).join("")}</nav>
        <div class="at-hist"><p class="at-side-h">${esc(T.hist_t)}</p><ul id="at-hist-l"></ul></div>
        <div class="at-side-foot">
          <button type="button" class="at-fn" data-at="conexoes" title="${esc(T.conn_t)}">${icone("plug")}<span>${esc(T.conn_t)}</span></button>
          <p class="at-local">${icone("shield")}<span>${esc(T.hist_local)}</span></p>
        </div>
      </aside>
      <div class="at-veu" data-at="gaveta-fechar" aria-hidden="true"></div>
      <section class="at-main" aria-label="Atlas">
        <header class="at-top">
          <button class="at-ib at-menu" type="button" data-at="gaveta" aria-label="${esc(T.side_open)}" aria-expanded="false" aria-controls="at-side">${icone("menu")}</button>
          <a class="at-voltar" href="#/">${icone("back")}<span>${esc(T.back)}</span></a>
          <span class="at-selo">${esc(L.badge)}</span>
          <div class="at-ferr">
            <button class="at-ib" type="button" data-at="exportar-conversa" aria-label="${esc(T.exp_conv)}" title="${esc(T.exp_conv)}" aria-haspopup="menu" aria-expanded="false">${icone("download")}</button>
            <div class="lang" role="group" aria-label="${esc(L.lang)}">${["PT", "EN", "ES"].map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === A.state.lang}">${l}</button>`).join("")}</div>
            <button class="at-ib at-tema" type="button" data-at="tema" aria-label="${esc(L.theme)}" title="${esc(L.theme)}">${icone(escuro() ? "sun" : "moon")}</button>
          </div>
        </header>
        <div class="at-vazio" id="at-vazio">
          <div class="at-marca-g">${marca()}</div>
          <h1>${esc(T.hello)}</h1><p>${esc(T.hello_sub)}</p>
        </div>
        <div class="at-log" id="at-log" role="log" aria-live="polite" aria-label="${esc(T.log_aria)}"></div>
        <form class="at-comp" id="at-comp" autocomplete="off">
          <div class="at-caixa">
            <button class="at-ib at-mais" type="button" data-at="mais" aria-label="${esc(T.plus)}" title="${esc(T.plus)}" aria-haspopup="menu" aria-expanded="false" aria-controls="at-menu-mais">${icone("plus")}</button>
            <label class="sr-only" for="at-in">${esc(T.ph)}</label>
            <textarea id="at-in" rows="1" maxlength="600" placeholder="${esc(T.ph)}" enterkeyhint="send"></textarea>
            ${Reconhecer ? `<button class="at-ib at-mic" type="button" data-at="mic" aria-label="${esc(T.mic)}" title="${esc(T.mic)}" aria-pressed="false">${icone("mic")}</button>` : ""}
            <button class="at-enviar" type="submit" aria-label="${esc(T.send)}" title="${esc(T.send)}">${icone("send")}</button>
            <div class="at-menu-mais" id="at-menu-mais" role="menu" aria-label="${esc(T.plus)}" hidden>${menuMais()}</div>
          </div>
          <div class="at-chips" id="at-chips">${["secao", "municipio", "estado", "qr", "downloads", "ask"].map((k) => `<button type="button" class="at-chip" data-at-fn="${k}">${icone(FUNCS.find((x) => x[0] === k)[1])}<span>${esc(T.fn[k][0])}</span></button>`).join("")}</div>
          <p class="at-nota">${esc(T.note)}</p>
        </form>
        <div class="at-solte" id="at-solte" hidden><div>${icone("upload")}<b>${esc(T.drop)}</b><span>${esc(T.drop_sub)}</span></div></div>
      </section>
      <input type="file" id="at-arq" hidden>
    </div>`;
  }

  function iniciar() {
    document.body.classList.add("atlas-on");
    if (window.BOT) { window.BOT.iniciar(A.state.lang); window.BOT.fechar(); }
    const root = $("#atlas");
    S.el = { root, log: $("#at-log"), inp: $("#at-in"), form: $("#at-comp"), arq: $("#at-arq"), mais: $("#at-menu-mais"), solte: $("#at-solte"), hist: $("#at-hist-l") };
    listaConversas();
    eventos(root);
    const c = S.convs.find((x) => x.id === S.atual);
    if (c && c.m.length) mostrarConversa(c);
    if (S.ocupado) bloquear(true);
    const q = ((A.state.query && A.state.query.get("q")) || "").trim();
    if (q) {
      history.replaceState(null, "", "#/atlas");
      S.atual = null; mostrarConversa(null);
      perguntar(q.slice(0, 600));
    } else if (!toque()) setTimeout(() => { if (S.el.inp) S.el.inp.focus({ preventScroll: true }); }, 60);
  }

  function listaConversas() {
    const ul = S.el.hist; if (!ul || !document.contains(ul)) return;
    const T = X(), l = S.convs.filter((c) => c.m.length).slice(0, 40);
    ul.innerHTML = l.length ? l.map((c) => `<li class="${c.id === S.atual ? "on" : ""}"><button type="button" class="at-h-it" data-at-conv="${c.id}" title="${esc(c.t)}"${c.id === S.atual ? ' aria-current="true"' : ""}>${icone("chat")}<span>${esc(c.t || T.untitled)}</span></button>
        <button type="button" class="at-h-x" data-at-del="${c.id}" aria-label="${esc(T.hist_del)}: ${esc(c.t)}" title="${esc(T.hist_del)}">${icone("trash")}</button></li>`).join("")
      + `<li class="at-h-limpar"><button type="button" data-at="limpar">${esc(T.hist_clear)}</button></li>` : `<li class="at-h-vazio">${esc(T.hist_none)}</li>`;
  }

  function bolha(r, h) {
    const d = document.createElement("div");
    d.className = r === "u" ? "msg msg-user" : "msg msg-bot at-resp";
    d.innerHTML = h;
    S.el.log.appendChild(d);
    return d;
  }
  // Barras já desenhadas (sem a animação de entrada da página)
  function preparar(d) { d.querySelectorAll(".bars").forEach((b) => b.classList.add("in")); }

  function mostrarConversa(c) {
    const log = S.el.log; log.innerHTML = "";
    S.el.root.classList.toggle("vazio", !c || !c.m.length);
    if (!c) { listaConversas(); return; }
    c.m.forEach((m) => { const d = bolha(m.r, m.h); if (m.r === "a") { preparar(d); acoesResposta(d, m); } });
    log.scrollTop = log.scrollHeight;
    listaConversas();
  }

  // --- conversa ----------------------------------------------------------------------------------------------
  const pensar = (etapas, trabalho) => window.BOT.pensando(etapas, trabalho, S.el.log);
  const ATOMOS = "button, svg, img, .chips, .bars, .table-wrap, .kv, a.btn, .at-card";
  async function escrever(h, meta) {
    const d = bolha("a", h);
    preparar(d);
    await window.BOT.digitar(d, S.el.log, ATOMOS);
    const m = Object.assign({ r: "a", h }, meta || {});
    registrar(m);
    // a página foi redesenhada enquanto escrevia (troca de idioma): mostra a conversa de novo
    if (!document.contains(d)) { const c = S.convs.find((x) => x.id === S.atual); if (c && S.el.log && document.contains(S.el.log)) mostrarConversa(c); return null; }
    acoesResposta(d, m);
    if (S.con.hook && S.hook.auto && urlValida(S.hook.url)) enviarAutomacao(m, d);
    return d;
  }
  function usuario(txt, h) {
    S.el.root.classList.remove("vazio");
    const html_ = h || `<p>${esc(txt)}</p>`;
    bolha("u", html_);
    registrar({ r: "u", h: html_, txt });
    S.el.log.scrollTop = S.el.log.scrollHeight;
  }
  function bloquear(sim) {
    if (!S.el.root || !document.contains(S.el.root)) return;
    S.el.root.classList.toggle("ocupado", sim);
    const b = S.el.root.querySelector(".at-enviar"); if (b) b.disabled = sim;
  }
  // Uma resposta por vez
  async function ocupar(fn) {
    if (S.ocupado) return false;
    S.ocupado = true; bloquear(true);
    try { await fn(); } catch (e) {
      console.error(e);
      if (S.el.log && document.contains(S.el.log)) { const d = bolha("a", `<p class="alert">${esc(X().err)} (${esc(e.message)})</p>`); d.scrollIntoView({ block: "nearest" }); }
    } finally { S.ocupado = false; bloquear(false); }
    return true;
  }
  function perguntar(texto) {
    texto = String(texto || "").trim();
    if (!texto) return;
    if (S.ocupado) { S.el.inp.value = texto; ajustar(); return; }
    ocupar(async () => { usuario(texto); await responder(texto); });
  }

  // --- entender a pergunta ------------------------------------------------------------------------------------
  const RE_DL = /\b(baixar|baixe|download|downloads|descargar|descargue|bajar)\b/;
  const RE_TSE = /\btse\b/;
  const RE_CONF = /\b(conferir|confere|confira|comparar|compare|checar|cheque|verificar|verifique|check|verify|comprobar|cotejar)\b/;
  const RE_IBGE = /\b(ibge|populacao|population|poblacion|habitantes|inhabitants)\b/;
  const RE_BR = /\b(brasil|brazil|nacional|national|pais|country)\b/;
  const RE_KW_MUN = /\b(cidade|municipio|city|municipality|town|ciudad)\b/;
  const RE_KW_UF = /\b(estado|state|provincia)\b/;
  const RE_URNA = /\b(?:urna|machine|maquina)\s*(?:n|no|nr|numero|number|num|de|del|da)?\s*(\d{6,8})\b/;
  const RE_AJUDA = /^(?:ajuda|help|ayuda|menu|funcoes|functions|funciones|o que (?:voce|vc) (?:faz|sabe(?: fazer)?)|what can you do|que (?:puede|puedes) hacer|quem e voce|who are you|quien eres|o que e o atlas|what is atlas|que es atlas)$/;
  // Palavras que não mudam o assunto quando a pergunta cita um lugar ("resultado em Curitiba")
  const NEUTRAS = new Set(("resultado resultados result results voto votos vote votes votacao voting votacion eleitor eleitores eleitorado voter voters elector electores abstencao abstention abstencion "
    + "comparecimento turnout participacao participation participacion comparecencia secao secoes section sections seccion secciones sinal sinais sinalizacao sinalizacoes flag flags flagged anomalia anomalias "
    + "anomaly anomalies dado dados data datos turno turnos round rounds vuelta vueltas 1 2 1o 2o 1st 2nd primeiro segundo first second primera segunda primer quanto quantos quanta quantas how many much "
    + "cuanto cuantos cuanta cuantas em no na nos nas de do da dos das in on of the en el la los las del a o e y and qual quais what which cual cuales foi foram was were fue fueron is es e "
    + "populacao population poblacion ibge tse conferir confira check comparar compare comprobar verificar oficial official eleicao election eleccion presidente president lula flavio bolsonaro "
    + "candidato candidatos candidate candidates ganhou venceu won gano mapa map zona zonas zone zones cidade municipio city municipality ciudad estado state uf me mostre mostra show muestra ver see "
    + "sobre about acerca total totais totals geral general resumo summary resumen por para pra for to com with con tem has tiene teve had numero numeros number numbers regiao region "
    + "habitantes inhabitants quero want quiero saber know informacoes information informacion info brasil brazil nacional national pais country baixo baixa alto alta low high bajo baja maior menor higher lower mayor").split(" "));
  // Nomes de município que também são palavras comuns: só valem com "cidade/município", com a UF ou sozinhos
  const RISCO_L = ["alegre", "alto alegre", "barao", "barcelos", "barra", "barras", "bom jesus", "capixaba", "caraubas", "catarina", "coluna", "contagem", "custodia", "delta", "extrema", "flores",
    "guaranta", "horizonte", "independencia", "jurua", "liberdade", "lima", "luz", "marcacao", "modelo", "monte carlo", "olho d agua", "passa tempo", "passos", "pimenta", "propria", "querencia",
    "registro", "reserva", "rio grande", "santo estevao", "tanque novo", "una", "uniao", "votorantim", "vitoria", "natal", "serra", "formosa", "esperanca", "feliz", "central", "floresta", "prata",
    "paraiso", "cristal", "saudade", "recreio", "harmonia", "concordia", "progresso", "maravilha", "colorado", "palmas", "bonito", "salto", "campo alegre"];
  const ARRISCADO = new Set(RISCO_L);
  const SIGLA_COMUM = new Set(["to", "es", "se", "am", "al", "go", "ma", "pa", "ac", "ap", "pi", "rn", "ce", "ba", "df", "mt", "ms", "rr", "ro", "sc", "rs", "mg", "rj", "pe", "pb", "sp", "pr", "zz"]);

  async function indiceLugares() {
    if (S.idxLug) return S.idxLug;
    const muns = await A.municipios();
    const lista = [];
    Object.entries(muns).forEach(([uf, ms]) => Object.entries(ms).forEach(([cod, [nm]]) => lista.push({ n: nz(nm), uf, cod, nome: A.titulo(nm) })));
    lista.sort((a, b) => b.n.length - a.n.length);
    const ufs = [];
    Object.entries(window.UF_NOMES).forEach(([uf, v]) => (typeof v === "string" ? [v] : Object.values(v)).forEach((x) => ufs.push({ n: nz(x), uf })));
    ufs.push({ n: "minas", uf: "MG" });
    ufs.sort((a, b) => b.n.length - a.n.length);
    S.idxLug = { lista, ufs };
    return S.idxLug;
  }

  // Estado e/ou município citados na pergunta, e se a pergunta é "sobre o lugar" (forte)
  function acharLugar(texto, I) {
    const n = " " + nz(texto) + " ";
    let uf = null, ufNome = null;
    for (const u of I.ufs) if (n.includes(" " + u.n + " ")) { uf = u.uf; ufNome = u.n; break; }
    const siglas = (String(texto).match(/\b[A-Z]{2}\b/g) || []).filter((x) => window.UF_NOMES[x]);
    let ufSigla = siglas[0] || null;
    const tks = n.trim().split(" ");
    if (!ufSigla && tks.length <= 3) { const ult = tks[tks.length - 1]; if (ult.length === 2 && window.UF_NOMES[ult.toUpperCase()] && (tks.length > 1 || SIGLA_COMUM.has(ult))) ufSigla = ult.toUpperCase(); }
    const semUf = ufNome ? n.replace(" " + ufNome + " ", " ") : n;
    let muns = [];
    for (const m of I.lista) {
      if (muns.length && m.n.length < muns[0].n.length) break;
      if (m.n.length >= 3 && semUf.includes(" " + m.n + " ")) muns.push(m);
    }
    const kwMun = RE_KW_MUN.test(n), kwUf = RE_KW_UF.test(n);
    // município com o mesmo nome do estado citado ("Paraná", RN): vira alternativa, a não ser que peça "cidade"
    const homonimos = ufNome ? I.lista.filter((m) => m.n === ufNome) : [];
    if (kwMun && !muns.length && homonimos.length) { muns = homonimos; uf = null; ufNome = null; }
    const ufFiltro = ufSigla || uf;
    if (muns.length && ufFiltro) { const f = muns.filter((m) => m.uf === ufFiltro); if (f.length) muns = f; }
    // o que sobra da pergunta além do lugar
    let resto = semUf;
    if (muns.length) resto = resto.replace(" " + muns[0].n + " ", " ");
    const sobra = resto.trim().split(" ").filter((w) => w && !NEUTRAS.has(w) && !(w.length === 2 && window.UF_NOMES[w.toUpperCase()]));
    const forte = kwMun || kwUf || !sobra.length;
    if (muns.length && muns[0].n.length <= 4 && !(kwMun || ufFiltro || !sobra.length)) muns = [];
    if (muns.length && ARRISCADO.has(muns[0].n) && !(kwMun || ufFiltro || !sobra.length)) muns = [];
    return { uf: muns.length ? null : (ufSigla || uf), muns, forte, homonimos: muns.length ? [] : homonimos, kwMun };
  }

  async function buscaKb(texto) {
    try { await motor().carregar(); return motor().buscar(texto); } catch (e) { return []; }
  }
  const kbForte = (r) => r.length && r[0].sc >= 4 && r[0].f >= 0.34;

  async function responder(texto) {
    const T = X(), n = nz(texto);
    if (RE_AJUDA.test(n)) return ajuda();
    const mu = n.match(RE_URNA);
    if (mu) return urna(mu[1], texto);
    if (RE_DL.test(n)) return downloads(texto);
    const querTse = RE_TSE.test(n) && RE_CONF.test(n);
    const sec = motor().detectarSecao(texto);
    if (sec && sec.z && !/\b(relatorio|report|informe)\b/.test(n)) {
      if (!sec.uf) return pedir(sec.s ? T.need_uf_sec : T.need_uf_zone, sec.s ? [`PR ${T.w_zone} ${sec.z} ${T.w_section} ${sec.s}`, `SP ${T.w_zone} ${sec.z} ${T.w_section} ${sec.s}`] : [`PR ${T.w_zone} ${sec.z}`, `SP ${T.w_zone} ${sec.z}`]);
      if (sec.s) return querTse && S.con.tse ? tseSecao({ uf: sec.uf, z: sec.z, s: sec.s }, texto) : secao(sec, texto);
      return zona(sec, texto);
    }
    if (sec && sec.s && !sec.z) return pedir(T.need_zone, [`${sec.uf || "PR"} ${T.w_zone} 3 ${T.w_section} ${sec.s}`]);
    const [I, kb] = await Promise.all([indiceLugares(), buscaKb(texto)]);
    const lg = acharLugar(texto, I);
    const forte = lg.forte || !kbForte(kb) || querTse;
    if (lg.muns.length && forte) {
      const nomes = new Set(lg.muns.map((m) => m.uf));
      if (nomes.size > 1) return escolherMun(lg.muns, texto);
      const m = lg.muns[0];
      if (querTse) return tseComparar({ tipo: "mun", uf: m.uf, cod: m.cod, nome: m.nome }, texto);
      return municipio(m, { q: texto, querIbge: RE_IBGE.test(n) });
    }
    if (lg.uf && forte) {
      if (querTse) return tseComparar({ tipo: "uf", uf: lg.uf, nome: A.ufNome(lg.uf) }, texto);
      return estado(lg.uf, { q: texto, homonimos: lg.homonimos });
    }
    if (RE_BR.test(n) && forte) return querTse ? tseComparar({ tipo: "br", nome: T.br_name }, texto) : brasil(texto);
    if (querTse) return pedir(T.tse_which, T.ex.tse);
    if (RE_IBGE.test(n)) return pedir(T.ibge_which, T.ex.ibge);
    return kbResposta(texto, kb);
  }

  async function pedir(txt, exemplos) {
    await pensar(X().think.guia);
    return escrever(`<p>${esc(txt)}</p>` + chipsQ((exemplos || []).map((q) => perg(q))));
  }

  // --- respostas da base (as mesmas do bot) -----------------------------------------------------------------
  function htmlEntrada(e, extras) {
    const T = X(), L = t(), M = motor();
    let h = M.md(e.a);
    const bs = [];
    if (e.act && e.act.go) bs.push(ir(e.act.go, "arrow", L.bot_open));
    if (e.act && e.act.go === "#/downloads") bs.push(`<button type="button" class="btn btn-sm" data-q="${esc(T.ex.downloads[0])}">${icone("download")} ${esc(T.dl_direct)}</button>`);
    h += botoes(bs);
    h += fonte(e.s);
    const rel = [];
    (e.r || []).forEach((id) => { const x = M.entrada(id); if (x && !x.ns && rel.length < 4) rel.push(x); });
    (extras || []).forEach((x) => { if (x.i !== e.i && !x.ns && !rel.some((r) => r.i === x.i) && rel.length < 5) rel.push(x); });
    if (rel.length) h += `<p class="msg-rel">${esc(L.bot_related)}:</p><div class="chips">${rel.map((x) => `<button type="button" class="chipq" data-at-id="${esc(x.i)}">${esc(M.rotulo(x))}</button>`).join("")}</div>`;
    return h;
  }
  async function kbResposta(texto, r) {
    const L = t(), T = X(), M = motor();
    if (!kbForte(r)) {
      const sug = r.filter((x) => x.f > 0 && !x.e.ns).slice(0, 3);
      await pensar([L.bot_think_qa[0], L.bot_think_qa[1], ...L.bot_think_none]);
      return escrever(`<p>${esc(sug.length ? L.bot_maybe : T.fallback)}</p>`
        + (sug.length ? `<div class="chips">${sug.map((x) => `<button type="button" class="chipq" data-at-id="${esc(x.e.i)}">${esc(M.rotulo(x.e))}</button>`).join("")}</div>` : "")
        + `<p class="msg-rel">${esc(T.fallback_fn)}</p>` + funcChips(["secao", "municipio", "estado", "downloads", "qr"]), { q: texto });
    }
    const outros = r.slice(1, 3).filter((x) => x.sc >= r[0].sc * 0.75).map((x) => x.e);
    await pensar(L.bot_think_qa);
    return escrever(htmlEntrada(r[0].e, outros), { q: texto });
  }
  const funcChips = (ks) => `<div class="chips">${ks.map((k) => `<button type="button" class="chipq" data-at-fn="${k}">${esc(X().fn[k][0])}</button>`).join("")}</div>`;

  async function ajuda() {
    const T = X();
    await pensar(T.think.guia);
    const h = `<p>${esc(T.help_lead)}</p><ul class="at-lista">${FUNCS.map(([k, ic]) => `<li><b>${esc(T.fn[k][0])}</b> — ${esc(T.fn[k][1])}</li>`).join("")}</ul>
      <p>${esc(T.help_files)}</p>${funcChips(["secao", "municipio", "qr", "downloads"])}${botoes([btnCon()])}`;
    return escrever(h, { q: T.fn.ask[0] });
  }

  // Funções da barra lateral e dos atalhos: a pessoa toca, o Atlas explica como usar
  function funcao(k) {
    const T = X();
    fecharGaveta();
    if (S.ocupado) return;
    ocupar(async () => {
      usuario(T.fn[k][0]);
      await pensar(T.think.guia);
      let h = `<p>${esc(T.guia[k])}</p>`;
      if (T.ex[k]) h += chipsQ(T.ex[k].map((q) => perg(q)));
      if (k === "qr") h += botoes([btnArq("foto"), podeCamera ? btnArq("camera") : ""]);
      if (k === "hash") h += botoes([btnArq("hash", T.pick), ir("#/downloads", "download", t().nav.downloads)]);
      if (k === "lista") h += kv([[T.fmt, `<code>uf;zona;secao</code>`]]) + botoes([btnArq("lista", T.pick), `<button type="button" class="btn btn-sm" data-at="modelo-lista">${icone("download")} ${esc(T.template)}</button>`]);
      if (k === "apuracao") h += kv([[T.fmt, `<code>uf;zona;secao;turno;aptos;votaram;13;22;brancos;nulos</code>`]]) + botoes([btnArq("apuracao", T.pick), `<button type="button" class="btn btn-sm" data-at="modelo-apuracao">${icone("download")} ${esc(T.template)}</button>`]);
      if (ARQ_PRIV.includes(k)) h += `<p class="small muted">${esc(T.privacy)}</p>`;
      if ((k === "tse" && !S.con.tse) || (k === "ibge" && !S.con.ibge)) h += `<p class="note small">${esc(T.con_off[k])}</p>` + botoes([btnCon()]);
      await escrever(h, { q: T.fn[k][0] });
    });
  }
  const ARQ_PRIV = ["qr", "hash", "lista", "apuracao"];

  // --- dados: município, estado, zona, seção, urna, Brasil -------------------------------------------------
  async function escolherMun(muns, texto) {
    const T = X();
    await pensar(T.think.mun.slice(0, 1));
    return escrever(`<p>${esc(T.mun_many)}</p>` + chipsQ(muns.map((m) => perg(`${m.nome} ${m.uf}`, `${m.nome} (${m.uf})`))), { q: texto });
  }

  async function municipio(m, opts) {
    const T = X(), L = t();
    const etapas = T.think.mun.slice(0, 3).concat(S.con.ibge && m.uf !== "ZZ" ? [T.think.ibge] : [], T.think.mun.slice(3));
    const trab = (async () => {
      const [U, s] = await Promise.all([ext().dado(`site/data/ufs/${m.uf}.json`), sinais((o) => o[0] === m.uf && o[1] === m.cod)]);
      const ib = S.con.ibge && m.uf !== "ZZ" ? await ibge(m).catch((e) => ({ erro: e.message })) : null;
      return { x: U.m[m.cod], s, ib };
    })();
    const { x, s, ib } = await pensar(etapas, trab);
    if (!x) return escrever(`<p>${esc(L.mu_none)}</p>`, { q: opts.q });
    let h = cab(`${esc(m.nome)} (${esc(m.uf)})`, esc(A.ufNome(m.uf)));
    h += `<p>${esc(T.mun_lead(nf(x[0]), x[1].length, x[1].join(", ")))}</p>`;
    [2, 1].forEach((n) => { const tv = x[n + 1]; if (tv) h += blocoTurno(n, tv[0], tv[1], tv[2]); });
    h += blocoSinais(s);
    if (ib) h += blocoIbge(ib, m);
    else if (opts.querIbge && m.uf !== "ZZ") h += `<p class="note small">${esc(T.con_off.ibge)}</p>`;
    h += botoes([ir(`#/uf/${m.uf}/${m.cod}`, "pin", T.open_mun), ir(`#/lista?uf=${m.uf}&mun=${m.cod}`, "list", T.open_list), ir(`#/variacao/${m.uf}/${m.cod}`, "swap", T.open_var),
      S.con.tse ? tseBtn({ tipo: "mun", uf: m.uf, cod: m.cod, nome: m.nome }) : "", opts.querIbge && !ib && m.uf !== "ZZ" ? btnCon() : ""]);
    h += fonte(T.src_site + (ib && !ib.erro && !ib.semMatch ? " · IBGE" : ""));
    return escrever(h, { q: opts.q });
  }

  async function estado(uf, opts) {
    const T = X(), L = t();
    const trab = Promise.all([ext().dado(`site/data/ufs/${uf}.json`), sinais((o) => o[0] === uf)]);
    const [U, s] = await pensar(T.think.uf, trab);
    const ms = Object.values(U.m);
    const tot = { 1: null, 2: null };
    ms.forEach((m) => [1, 2].forEach((n) => {
      const x = m[n + 1]; if (!x) return;
      if (!tot[n]) tot[n] = [0, 0, x[2].map(() => 0)];
      tot[n][0] += x[0]; tot[n][1] += x[1]; x[2].forEach((v, i) => { tot[n][2][i] += v; });
    }));
    const sec = ms.reduce((a, m) => a + m[0], 0);
    let h = cab(`${esc(A.ufNome(uf))} (${esc(uf)})`, esc(L.uf_kicker));
    h += `<p>${esc(T.uf_lead(nf(sec), nf(ms.length)))}</p>`;
    [2, 1].forEach((n) => { if (tot[n]) h += blocoTurno(n, tot[n][0], tot[n][1], tot[n][2]); });
    h += blocoSinais(s, T.sg_note_uf);
    h += botoes([ir(`#/uf/${uf}`, "pin", T.open_uf), ir(`#/lista?uf=${uf}`, "list", T.open_list), ir(`#/variacao/${uf}`, "swap", T.open_var), ir("#/mapa", "map", t().nav.map),
      S.con.tse ? tseBtn({ tipo: "uf", uf, nome: A.ufNome(uf) }) : ""]);
    if (opts.homonimos && opts.homonimos.length) h += `<p class="msg-rel">${esc(T.uf_homonym)}</p>` + chipsQ(opts.homonimos.map((m) => perg(`${T.w_city} ${m.nome} ${m.uf}`, `${m.nome} (${m.uf})`)));
    h += fonte(T.src_site);
    return escrever(h, { q: opts.q });
  }

  async function zona(p, q) {
    const T = X(), L = t();
    const Z = await pensar(T.think.zona, A.zona(p.uf, p.z));
    if (!Z) return escrever(`<p>${esc(L.lk_nozone)}</p>`, { q });
    const tot = { 1: null, 2: null }, an = { 1: 0, 2: 0 }, inf = { 1: 0, 2: 0 };
    const nums = Object.keys(Z.s);
    nums.forEach((s) => {
      const rec = Z.s[s], fl = rec[3] || {};
      [1, 2].forEach((n) => {
        const tv = rec[n]; if (!tv) return;
        if (!tot[n]) tot[n] = [0, 0, tv[5].map(() => 0)];
        tot[n][0] += tv[0]; tot[n][1] += tv[1]; tv[5].forEach((v, i) => { tot[n][2][i] = (tot[n][2][i] || 0) + v; });
        const f = fl[String(n)];
        if (f && f.o.some((o) => o[1] === "a")) an[n]++; else if (f && f.o.length) inf[n]++;
      });
    });
    let h = cab(`${esc(p.uf)} · ${esc(L.th_zone)} ${p.z}`, esc(A.ufNome(p.uf)));
    h += `<p>${esc(T.zone_lead(nf(nums.length), Z.mun.map((m) => A.titulo(m[1])).join(", ")))}</p>`;
    [2, 1].forEach((n) => { if (tot[n]) h += blocoTurno(n, tot[n][0], tot[n][1], tot[n][2]); });
    h += `<h4 class="at-t">${esc(T.sg_t)}</h4><ul class="at-sinais">${[2, 1].map((n) => `<li><b>${esc(L.round(n))}:</b> ${A.chip(an[n] ? "red" : "green", T.sg_a(nf(an[n])))} ${A.chip(inf[n] ? "amber" : "green", T.sg_i_only(nf(inf[n])))}</li>`).join("")}</ul>`;
    const ex = nums.map(Number).sort((a, b) => a - b).slice(0, 3);
    h += `<p class="msg-rel">${esc(T.zone_try)}</p>` + chipsQ(ex.map((s) => perg(`${p.uf} ${T.w_zone} ${p.z} ${T.w_section} ${s}`)));
    h += botoes([ir(`#/lista?uf=${p.uf}&z=${p.z}`, "list", T.open_list)]);
    h += fonte(T.src_site);
    return escrever(h, { q });
  }

  async function secao(p, q) {
    const L = t(), T = X();
    const d = await pensar(L.bot_think_sec, A.consultarSecao(p.uf, p.z, p.s));
    return escrever(htmlSecao(d), { q });
  }
  function htmlSecao(d) {
    const L = t(), T = X();
    if (d.erro === "zona") return `<p>${esc(L.lk_nozone)}</p>`;
    if (d.erro === "secao") {
      let h = `<p>${esc(L.lk_nosec)}</p>`;
      if (d.agregadaEm.length) h += `<p>${esc(L.lk_agg_hint(d.s))}</p>` + chipsQ(d.agregadaEm.map((x) => perg(`${d.uf} ${T.w_zone} ${d.z} ${T.w_section} ${x}`, x)));
      return h;
    }
    if (d.erro) return `<p>${esc(T.need_uf_sec)}</p>`;
    const rec = d.rec, flags = rec[3] || {}, nomeM = A.titulo(d.mun[1]);
    let h = cab(`${esc(d.uf)} · ${esc(nomeM)} · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s}`);
    [2, 1].forEach((n) => {
      const tv = rec[n], f = flags[String(n)];
      if (!tv) { h += `<h4 class="at-t">${esc(L.round(n))}</h4><p class="muted">${esc(L.lk_nodata)}</p>`; return; }
      const extra = [[L.lk_open, A.hora(tv[2])], [L.lk_close, A.hora(tv[3])]];
      if (tv[4]) extra.push([L.lk_agreg, esc(tv[4])]);
      h += blocoTurno(n, tv[0], tv[1], tv[5], extra);
      if (f && f.u) h += `<p class="small">${esc(L.lk_urna(f.u, f.c, f.l))}</p>`;
      if (f && f.o.length) h += `<ul class="at-sinais">${f.o.map((o) => `<li>${A.chip(o[1] === "a" ? "red" : "amber", o[1] === "a" ? L.lv_a : L.lv_i)} ${A.numTeste(o[0])}. ${esc(A.nomeTeste(o[0]))} <span class="small muted">· ${esc((R().categorias[o[2]] || {})[A.state.lang] || o[2])}</span></li>`).join("")}</ul>`;
      else h += `<p>${A.chip("green", L.lk_noflags)}</p>`;
    });
    h += `<p class="small muted">${esc(L.lk_open)}/${esc(L.lk_close)}: ${esc(L.lk_local)}.</p>`;
    h += botoes([ir(`#/secao/${d.uf}/${d.z}/${d.s}`, "search", T.open_sec), `<button type="button" class="btn btn-sm" data-at-fn="qr">${icone("qr")} ${esc(T.fn.qr[0])}</button>`,
      S.con.tse ? `<button type="button" class="btn btn-sm" data-at-tsesec="${esc(JSON.stringify({ uf: d.uf, z: d.z, s: d.s }))}">${icone("shield")} ${esc(T.tse_files)}</button>` : ""]);
    h += fonte(L.bot_sec_src);
    return h;
  }

  async function urna(nr, q) {
    const T = X(), L = t();
    const trab = (async () => {
      const idx = await ext().dado("site/data/urnas.json");
      const l = idx[String(+nr)] || [];
      return Promise.all(l.map(async ([uf, z, s, n]) => ({ n, d: await A.consultarSecao(uf, z, s) })));
    })();
    const achou = await pensar(T.think.urna, trab);
    if (!achou.length) return escrever(`<p>${esc(T.urna_none(nr))}</p>` + botoes([btnArq("foto"), podeCamera ? btnArq("camera") : ""]), { q });
    let h = cab(`${esc(T.w_urna)} ${esc(nr)}`);
    h += `<p>${esc(T.urna_lead(achou.length))}</p><ul class="at-lista">`;
    achou.forEach(({ n, d }) => {
      if (!d.rec) return;
      const f = (d.rec[3] || {})[String(n)] || { o: [] };
      h += `<li><b>${esc(d.uf)} · ${esc(A.titulo(d.mun[1]))} · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s}</b> · ${esc(L.round(n))}<br>
        <span class="small">${esc(L.lk_urna(f.u, f.c, f.l))}</span><br>${f.o.map((o) => `${A.chip(o[1] === "a" ? "red" : "amber", `${A.numTeste(o[0])}. ${A.nomeTeste(o[0])}`)}`).join(" ")}</li>`;
    });
    h += `</ul><p class="small muted">${esc(T.urna_note)}</p>`;
    h += chipsQ(achou.filter((x) => x.d.rec).map(({ d }) => perg(`${d.uf} ${T.w_zone} ${d.z} ${T.w_section} ${d.s}`)));
    h += fonte(T.src_site);
    return escrever(h, { q });
  }

  async function brasil(q) {
    const T = X(), L = t();
    await pensar(T.think.br);
    let h = cab(esc(T.br_name), esc(L.cd_pres));
    [2, 1].forEach((n) => {
      const P = R().turnos[n].presidente, arr = R().ordem_votos[n].map((nr) => (P.candidatos.find((c) => c.nr === nr) || { votos: 0 }).votos);
      h += blocoTurno(n, P.aptos, P.comparecimento, arr, [[L.st_secoes, nf(R().turnos[n].entrada.secoes)], [L.st_sinal, `${nf(R().turnos[n].secoes_sinalizadas)} (${pct(R().turnos[n].secoes_sinalizadas / R().turnos[n].entrada.secoes)})`]]);
    });
    h += `<p class="small muted">${esc(T.sg_note)}</p>`;
    h += botoes([ir("#/turno/2", "chart", L.round(2)), ir("#/turno/1", "chart", L.round(1)), ir("#/mapa", "map", L.nav.map), S.con.tse ? tseBtn({ tipo: "br", nome: T.br_name }) : ""]);
    h += fonte(T.src_site);
    return escrever(h, { q });
  }

  // --- downloads: botão que baixa o arquivo pedido ------------------------------------------------------------
  const DL_TIPOS = [
    [/\b(relatorio|relatorios|report|reports|informe|informes|laudo)\b/, (d) => /^Relatorio_/.test(d.nome)],
    [/\b(sinalizada|sinalizadas|flagged|senaladas|marcadas)\b/, (d) => /secoes_sinalizadas/.test(d.nome)],
    [/\b(log|logs)\b/, (d) => /log_execucao/.test(d.nome)],
    [/\b(manifesto|manifest|manifiesto)\b/, (d) => /manifesto_saida/.test(d.nome)],
    [/\b(nucleo|core|json)\b/, (d) => /nucleo_analitico/.test(d.nome)],
    [/\b(urnas|machines|busca)\b/, (d) => /busca_urnas/.test(d.nome)],
    [/\b(grafico|graficos|chart|charts|klimek|png|imagem|imagens|image|images|grafica|graficas)\b/, (d) => /^graficos\//.test(d.nome)],
    [/\b(variacao|variation|variacion)\b/, (d) => /variacao/.test(d.nome)],
    [/\b(codigo|code|motor|engine|script|programa|program|python|py)\b/, (d) => /\.py$/.test(d.nome)],
    // genérico: só quando nada mais específico foi pedido
    [/\b(csv|planilha|planilhas|spreadsheet|spreadsheets|hoja|hojas|tabela|tabelas|tables)\b/, (d) => /\.csv$/.test(d.nome), true],
  ];
  function turnoDe(n) {
    if (/\b(?:1|1o|1st|primeiro|primeira|first|primer|primera)\s*(?:turno|round|vuelta)\b|\b(?:turno|round|vuelta)\s*1\b/.test(n)) return 1;
    if (/\b(?:2|2o|2nd|segundo|segunda|second)\s*(?:turno|round|vuelta)\b|\b(?:turno|round|vuelta)\s*2\b/.test(n)) return 2;
    return 0;
  }
  async function downloads(q) {
    const T = X(), L = t(), n = " " + nz(q) + " ", D = R().downloads;
    await pensar(T.think.dl);
    const turno = turnoDe(n);
    const lingua = /\b(ingles|english|en)\b/.test(n) ? "EN" : /\b(espanhol|spanish|espanol|es)\b/.test(n) ? "ES" : /\b(portugues|portuguese|pt)\b/.test(n) ? "PT" : A.state.lang;
    const tudo = /\b(tudo|todos|completo|zip|all|everything|todo|pacote|package)\b/.test(n);
    let itens = [];
    DL_TIPOS.forEach(([re, f, geral]) => { if (re.test(n) && !(geral && itens.length)) itens = itens.concat(D.filter(f)); });
    itens = itens.filter((d, i, l) => l.indexOf(d) === i);
    itens = itens.filter((d) => !/^Relatorio_/.test(d.nome) || d.nome.endsWith(`_${lingua}.md`));
    if (turno) itens = itens.filter((d) => d.turno === 0 || d.turno === turno);
    const geral = !itens.length;
    if (geral) itens = D.filter((d) => d.turno === 0 && /auditoria_eleicoes/.test(d.nome)).concat(D.filter((d) => d.nome === `Relatorio_Tecnico_Auditoria_Eleicoes_2026_${lingua}.md` && (!turno || d.turno === turno)));
    itens.sort((a, b) => b.turno - a.turno || a.nome.localeCompare(b.nome));
    const mais = itens.length > 12;
    itens = itens.slice(0, 12);
    const rot = (d) => (d.turno ? L.round(d.turno) : T.dl_code);
    let h = `<p>${esc(geral ? T.dl_lead_all : T.dl_lead(itens.length))}</p>`;
    if (tudo || geral) h += botoes([`<a class="btn btn-primary btn-sm" href="${A.REPO}/archive/refs/heads/main.zip">${icone("download")} ${esc(L.dl_all)}</a>`]);
    h += `<ul class="at-dl">${itens.map((d) => `<li><a class="btn btn-sm" href="${esc(d.path)}" download>${icone("download")} ${esc(d.nome.split("/").pop())}</a>
      <span class="small muted">${esc(rot(d))} · ${esc(tam(d.bytes))}${L.dl_desc[d.nome] ? ` · ${esc(L.dl_desc[d.nome])}` : ""}</span></li>`).join("")}</ul>`;
    if (mais) h += `<p class="small muted">${esc(T.dl_more)}</p>`;
    h += `<p class="small muted">${esc(T.dl_check)}</p>`;
    h += botoes([ir("#/downloads", "download", T.open_dl), itens.some((d) => /\.py$/.test(d.nome)) ? ir("#/replicar", "terminal", L.nav.replicate) : "", `<button type="button" class="btn btn-sm" data-at-arq="hash">${icone("hash")} ${esc(T.up.hash[0])}</button>`]);
    h += fonte(T.src_dl);
    return escrever(h, { q });
  }

  // --- conexão: TSE (dados abertos de resultados.tse.jus.br) --------------------------------------------------
  function buscar(url, ms) {
    const ctl = "AbortController" in window ? new AbortController() : null;
    const tm = ctl ? setTimeout(() => ctl.abort(), ms || 12000) : null;
    return fetch(url, ctl ? { signal: ctl.signal, cache: "no-store" } : { cache: "no-store" }).finally(() => clearTimeout(tm));
  }
  const tseBtn = (alvo) => `<button type="button" class="btn btn-sm" data-at-tse="${esc(JSON.stringify(alvo))}">${icone("shield")} ${esc(X().tse_btn)}</button>`;

  async function tseTotais(n, alvo) {
    const ele = ELEICAO[n], uf = alvo.tipo === "br" ? "br" : alvo.uf.toLowerCase(), arq = alvo.tipo === "mun" ? uf + alvo.cod : uf;
    const r = await buscar(`${TSE}${ele}/dados/${uf}/${arq}-c0001-e${ele.padStart(6, "0")}-u.json`);
    if (!r.ok) throw new Error("TSE " + r.status);
    const j = await r.json(), votos = {};
    ((j.carg && j.carg[0] && j.carg[0].agr) || []).forEach((a) => a.par.forEach((p) => p.cand.forEach((c) => { votos[c.n] = +c.vap; })));
    // nulos: o TSE separa os "nulos técnicos" (votos de candidato anulado), que o boletim traz no número do candidato
    votos["95"] = +j.v.vb; votos["96"] = +j.v.vn;
    return { aptos: +j.e.te, comp: +j.e.c, votos, vnt: +j.v.vnt || 0, quando: `${j.dg} ${j.hg}` };
  }
  async function siteTotais(n, alvo) {
    if (alvo.tipo === "br") {
      const P = R().turnos[n].presidente, v = {};
      P.candidatos.forEach((c) => { v[c.nr] = c.votos; });
      return { aptos: P.aptos, comp: P.comparecimento, votos: v };
    }
    const U = await ext().dado(`site/data/ufs/${alvo.uf}.json`);
    const ms = alvo.tipo === "mun" ? [U.m[alvo.cod]] : Object.values(U.m);
    const o = { aptos: 0, comp: 0, votos: {} };
    ms.forEach((m) => { const x = m && m[n + 1]; if (!x) return; o.aptos += x[0]; o.comp += x[1]; R().ordem_votos[n].forEach((nr, i) => { o.votos[nr] = (o.votos[nr] || 0) + (x[2][i] || 0); }); });
    return o;
  }
  async function tseComparar(alvo, q) {
    const T = X(), L = t();
    if (!S.con.tse) { await pensar(T.think.guia); return escrever(`<p>${esc(T.con_off.tse)}</p>` + botoes([btnCon()]), { q }); }
    const trab = Promise.all([2, 1].map(async (n) => {
      const site = await siteTotais(n, alvo);
      try { return { n, site, tse: await tseTotais(n, alvo) }; } catch (e) { return { n, site, erro: e.name === "AbortError" ? "tempo esgotado" : e.message }; }
    }));
    const res = await pensar(T.think.tse, trab);
    let h = cab(esc(T.tse_title(alvo.tipo === "uf" ? `${alvo.nome} (${alvo.uf})` : alvo.tipo === "mun" ? `${alvo.nome} (${alvo.uf})` : alvo.nome)), esc(L.cd_pres));
    let difs = 0, comps = 0;
    res.forEach(({ n, site, tse, erro }) => {
      h += `<h4 class="at-t">${esc(L.round(n))}</h4>`;
      if (erro) { h += `<p class="alert">${esc(T.tse_err(erro))}</p>`; return; }
      const nomes = nomesTurno(n);
      const linhas = [[L.lk_aptos, site.aptos, tse.aptos], [L.lk_comp, site.comp, tse.comp]];
      const cands = R().ordem_votos[n].filter((nr) => nr !== "95" && nr !== "96"), fora = cands.filter((nr) => !(nr in tse.votos));
      cands.forEach((nr) => {
        const anulado = fora.length === 1 && fora[0] === nr && tse.vnt > 0;
        linhas.push([`${A.titulo(nomes[nr] || nr)} (${nr})${anulado ? ` · ${T.tse_nt}` : ""}`, site.votos[nr] || 0, anulado ? tse.vnt : tse.votos[nr] || 0]);
      });
      linhas.push([L.blank, site.votos["95"] || 0, tse.votos["95"] || 0], [L.null_, site.votos["96"] || 0, tse.votos["96"] || 0]);
      h += tabela([L.bu_th_field, T.th_site, T.th_tse, ""], linhas.map(([k, a, b]) => { comps++; if (a !== b) difs++; return [esc(k), nf(a), nf(b), A.chip(a === b ? "green" : "red", a === b ? L.bu_eq : L.bu_ne)]; }), "num-cols");
      h += `<p class="small muted">${esc(T.tse_when(tse.quando))}</p>`;
    });
    h = `<p>${comps ? A.chip(difs ? "red" : "green", difs ? T.tse_diff(difs) : T.tse_ok(comps)) : ""}</p>` + h;
    h += `<p class="small muted">${esc(T.tse_note)}</p>` + fonte("resultados.tse.jus.br · " + T.src_site);
    return escrever(h, { q });
  }

  async function tseSecao(p, q) {
    const T = X(), L = t();
    if (!S.con.tse) { await pensar(T.think.guia); return escrever(`<p>${esc(T.con_off.tse)}</p>` + botoes([btnCon()]), { q }); }
    const trab = (async () => {
      const d = await A.consultarSecao(p.uf, p.z, p.s);
      if (!d.rec) return { d };
      const mun = d.mun[0], uf = d.uf.toLowerCase();
      const turnos = await Promise.all([2, 1].map(async (n) => {
        const base = `${TSE}arquivo-urna/${PLEITO[n]}/dados/${uf}/${mun}/${z4(d.z)}/${z4(d.s)}`;
        try {
          const r = await buscar(`${base}/p00${PLEITO[n]}-${uf}-m${mun}-z${z4(d.z)}-s${z4(d.s)}-aux.json`);
          if (!r.ok) throw new Error("TSE " + r.status);
          const j = await r.json(), hs = j.hashes || [];
          return { n, st: j.st, hs: hs.map((x) => ({ st: x.st, quando: `${x.dr} ${x.hr}`, arq: (x.arq || []).map((a) => ({ nm: a.nm, tp: a.tp, url: `${base}/${x.hash}/${a.nm}` })) })) };
        } catch (e) { return { n, erro: e.name === "AbortError" ? "tempo esgotado" : e.message }; }
      }));
      return { d, turnos };
    })();
    const { d, turnos } = await pensar(T.think.tsesec, trab);
    if (!d.rec) return escrever(htmlSecao(d), { q });
    let h = cab(`${esc(d.uf)} · ${esc(A.titulo(d.mun[1]))} · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s}`, esc(T.tse_files));
    turnos.forEach((x) => {
      h += `<h4 class="at-t">${esc(L.round(x.n))}</h4>`;
      if (x.erro) { h += `<p class="alert">${esc(T.tse_err(x.erro))}</p>`; return; }
      x.hs.forEach((hs) => {
        h += `<p class="small">${A.chip(/totaliz/i.test(hs.st) ? "green" : "amber", hs.st)} <span class="muted">${esc(hs.quando)}</span></p>`;
        h += tabela([T.th_file, T.th_type, ""], hs.arq.map((a) => [`<span class="fname">${esc(a.nm)}</span>`, esc(T.tse_tipos[a.tp] || a.tp), `<a class="btn btn-sm" href="${esc(a.url)}" target="_blank" rel="noopener">${icone("download")} ${esc(T.dl_btn)}</a>`]));
      });
    });
    h += `<p class="small muted">${esc(T.tse_files_note)}</p>` + botoes([ir(`#/secao/${d.uf}/${d.z}/${d.s}`, "search", T.open_sec), `<button type="button" class="btn btn-sm" data-at-arq="hash">${icone("hash")} ${esc(T.up.hash[0])}</button>`]);
    h += fonte("resultados.tse.jus.br");
    return escrever(h, { q });
  }

  // --- conexão: IBGE (população e região do município) ----------------------------------------------------------
  const ibgeUfs = {};
  function lev(a, b) {
    const m = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) { let ant = m[0]; m[0] = i; for (let j = 1; j <= b.length; j++) { const tmp = m[j]; m[j] = Math.min(m[j] + 1, m[j - 1] + 1, ant + (a[i - 1] === b[j - 1] ? 0 : 1)); ant = tmp; } }
    return m[b.length];
  }
  async function ibge(m) {
    if (!ibgeUfs[m.uf]) ibgeUfs[m.uf] = buscar(`${IBGE}v1/localidades/estados/${m.uf}/municipios`).then((r) => { if (!r.ok) throw new Error("IBGE " + r.status); return r.json(); })
      .catch((e) => { delete ibgeUfs[m.uf]; throw e; });
    const lista = await ibgeUfs[m.uf], alvo = nz(m.nome), sem = (s) => s.replace(/ /g, "");
    let x = lista.find((i) => nz(i.nome) === alvo) || lista.find((i) => sem(nz(i.nome)) === sem(alvo)) || lista.find((i) => nz(i.nome).startsWith(alvo + " "));
    if (!x) { const c = lista.map((i) => [lev(sem(nz(i.nome)), sem(alvo)), i]).sort((a, b) => a[0] - b[0])[0]; if (c && c[0] <= 2) x = c[1]; }
    if (!x) return { semMatch: true };
    const pop = async (ag, per, vr) => {
      const r = await buscar(`${IBGE}v3/agregados/${ag}/periodos/${per}/variaveis/${vr}?localidades=N6[${x.id}]`);
      if (!r.ok) throw new Error("IBGE " + r.status);
      const s = (await r.json())[0].resultados[0].series[0].serie, ano = Object.keys(s).sort().pop();
      return { ano, v: +s[ano] };
    };
    const [censo, est] = await Promise.all([pop(4709, 2022, 93).catch(() => null), pop(6579, -1, 9324).catch(() => null)]);
    const ri = x["regiao-imediata"], rint = ri && ri["regiao-intermediaria"];
    const regiao = (x.microrregiao && x.microrregiao.mesorregiao && x.microrregiao.mesorregiao.UF.regiao.nome) || (rint && rint.UF && rint.UF.regiao.nome) || "";
    return { id: x.id, nome: x.nome, censo, est, regiao, inter: rint ? rint.nome : "", imed: ri ? ri.nome : "" };
  }
  function blocoIbge(ib, m) {
    const T = X();
    if (ib.erro) return `<p class="note small">${esc(T.ibge_err)}</p>`;
    if (ib.semMatch) return `<p class="note small">${esc(T.ibge_nomatch)}</p>`;
    const l = [];
    if (ib.censo) l.push([T.ibge_censo(ib.censo.ano), nf(ib.censo.v)]);
    if (ib.est && (!ib.censo || ib.est.ano !== ib.censo.ano)) l.push([T.ibge_est(ib.est.ano), nf(ib.est.v)]);
    if (ib.regiao) l.push([T.ibge_reg, esc(ib.regiao)]);
    if (ib.inter) l.push([T.ibge_inter, esc(ib.inter)]);
    if (ib.imed) l.push([T.ibge_imed, esc(ib.imed)]);
    const slug = nz(ib.nome).replace(/ /g, "-");
    return `<div class="at-card"><h4 class="at-t">${icone("users")} ${esc(T.ibge_t)}</h4>${kv(l)}
      <p class="small"><a href="https://cidades.ibge.gov.br/brasil/${m.uf.toLowerCase()}/${slug}/panorama" target="_blank" rel="noopener">${esc(T.ibge_link)}</a> · <span class="muted">${esc(T.ibge_code(ib.id))}</span></p></div>`;
  }

  // --- arquivos (botão "+", arrastar e soltar, colar) -----------------------------------------------------------
  const PUB = () => new Set(R().downloads.map((d) => d.nome.split("/").pop()).concat(["manifesto_saida.sha512"]));
  function escolherArquivo(k) {
    fecharMenus();
    if (k === "camera") { abrirCamera(); return; }
    const inp = S.el.arq;
    inp.accept = { foto: "image/*", lista: ".csv,.txt,.tsv,text/csv,text/plain", apuracao: ".csv,.txt,.tsv,text/csv,text/plain" }[k] || "";
    inp.multiple = k === "foto" || k === "hash";
    inp.dataset.tipo = k;
    inp.value = "";
    inp.click();
  }

  async function classificar(fs) {
    const pub = PUB();
    if (fs.every((f) => /^image\//.test(f.type) && !pub.has(f.name))) return "foto";
    if (fs.length === 1 && /\.(csv|tsv|txt)$/i.test(fs[0].name) && !pub.has(fs[0].name) && fs[0].size < 8e6) {
      const tipo = tipoCsv(lerCsv(await fs[0].slice(0, 8192).text()).slice(0, 3));
      if (tipo) return tipo;
    }
    if (fs.every((f) => pub.has(f.name) || /\.(md|json|py|zip|sha512|sha|txt|log|csv|tsv|png|jpe?g|dat|jez|rdv|vsc|bu|imgbu|logjez|sig)$/i.test(f.name))) return "hash";
    return "nao";
  }

  async function tratarArquivos(fs, tipo) {
    fs = Array.from(fs || []).filter((f) => f && f.size >= 0);
    if (!fs.length) return;
    fecharGaveta(); fecharMenus();
    if (S.ocupado) return;
    await ocupar(async () => {
      const T = X();
      usuario(`📎 ${fs.map((f) => f.name).join(", ")}`, `<p class="at-anexo">${icone("upload")} <b>${esc(T.sent(fs.length))}</b></p><ul class="at-arqs">${fs.map((f) => `<li>${esc(f.name)} <span>${esc(tam(f.size))}</span></li>`).join("")}</ul>`);
      if (tipo === "camera") tipo = "foto";
      if (!tipo) tipo = await classificar(fs);
      if (tipo === "foto") return conferirQR(fs);
      if (tipo === "hash") return conferirHash(fs);
      if (tipo === "lista") return conferirLista(fs[0]);
      if (tipo === "apuracao") return conferirApuracao(fs[0]);
      return naoSuportado(fs);
    });
  }

  async function naoSuportado(fs) {
    const T = X();
    await pensar(T.think.nao);
    return escrever(`<p>${esc(T.unsup)}</p><ul class="at-lista">${T.accepts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="small muted">${esc(T.unsup_hash)}</p>`
      + botoes([btnArq("hash")]), { q: fs.map((f) => f.name).join(", ") });
  }

  // QR Code do boletim de urna (foto ou câmera)
  function carregarScript(src, global) {
    if (window[global]) return Promise.resolve(window[global]);
    return new Promise((ok, falha) => {
      const s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = () => (window[global] ? ok(window[global]) : falha(new Error(src)));
      s.onerror = () => falha(new Error(src));
      document.head.appendChild(s);
    });
  }
  async function decodificar(fonte_, w, h) {
    if ("BarcodeDetector" in window) {
      try { const det = new window.BarcodeDetector({ formats: ["qr_code"] }); const cod = await det.detect(fonte_); if (cod.length) return cod.map((c) => c.rawValue); } catch (e) { /* usa o jsQR */ }
    }
    const lib = await carregarScript("site/js/vendor/jsQR.min.js", "jsQR");
    const cv = document.createElement("canvas"), k = Math.min(1, 1280 / Math.max(w, h));
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    const ctx = cv.getContext("2d", { willReadFrequently: true }); ctx.drawImage(fonte_, 0, 0, cv.width, cv.height);
    const img = ctx.getImageData(0, 0, cv.width, cv.height);
    const r = lib(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
    return r ? [r.data] : [];
  }
  // Guarda uma parte do QR Code; diz se já dá para comparar
  function receberQR(txt) {
    const p = ext().lerQR(txt);
    if (!p.parte) return { ok: false };
    S.qr.partes[p.parte] = p;
    const r = ext().juntarQR(S.qr.partes), lidas = Object.keys(S.qr.partes).length, total = p.total || 1;
    return { ok: true, pronto: r.presidente, lidas, total, msg: r.presidente ? t().bu_qr_done(lidas, total) : t().bu_qr_part(lidas, total) };
  }
  async function compararBU(r, origem) {
    const L = t(), T = X();
    if (!r.uf || !(r.z > 0) || !(r.s > 0)) return `<p>${esc(T.qr_noloc)}</p>`;
    const d = await A.consultarSecao(r.uf, r.z, r.s), n = r.turno === 1 ? 1 : 2;
    if (d.erro) return `<p>${esc(d.erro === "zona" ? L.lk_nozone : L.lk_nosec)}</p>`;
    const tv = d.rec[n];
    if (!tv) return `<p>${esc(L.lk_nodata)}</p>`;
    const { v, nomes } = A.votosTurno(n, tv);
    const linhas = [[L.lk_aptos, r.aptos, tv[0]], [L.lk_comp, r.comp, tv[1]]];
    const fim = (x) => (x === "95" || x === "96" ? 1 : 0);
    Object.keys(v).sort((a, b) => fim(a) - fim(b) || +a - +b).forEach((nr) => linhas.push([nr === "95" ? L.blank : nr === "96" ? L.null_ : `${nr} · ${A.titulo(nomes[nr] || nr)}`, r.votos[nr], v[nr]]));
    Object.keys(r.votos).filter((nr) => !(nr in v)).forEach((nr) => linhas.push([nr, r.votos[nr], null]));
    let iguais = 0, difs = 0;
    const corpo = linhas.map(([rot, a, b]) => {
      let st = "—";
      if (a != null && !Number.isNaN(a)) { if (a === (b || 0)) { st = A.chip("green", L.bu_eq); iguais++; } else { st = A.chip("red", L.bu_ne); difs++; } }
      return [esc(rot), a == null || Number.isNaN(a) ? "—" : nf(a), b == null ? "—" : nf(b), st];
    });
    const res = difs ? A.chip("red", L.bu_res_diff(difs)) : iguais ? A.chip("green", L.bu_res_ok(iguais)) : A.chip("amber", L.bu_res_none);
    return cab(`${esc(d.uf)} · ${esc(A.titulo(d.mun[1]))} · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s} · ${esc(L.round(n))}`)
      + `<p>${res} <span class="small muted">${esc(origem)}</span></p>` + tabela([L.bu_th_field, L.bu_th_paper, L.bu_th_file, ""], corpo, "num-cols")
      + `<p class="small muted">${esc(L.bu_res_note)}</p><p class="small muted">${esc(L.bu_note)}</p>`
      + botoes([ir(`#/secao/${d.uf}/${d.z}/${d.s}`, "search", T.open_sec)]) + fonte(L.bot_sec_src);
  }
  async function conferirQR(fs) {
    const T = X(), L = t();
    const trab = (async () => {
      let lidos = 0, outros = 0;
      for (const f of fs) {
        try {
          const bmp = await createImageBitmap(f);
          const txts = await decodificar(bmp, bmp.width, bmp.height);
          txts.forEach((x) => { if (receberQR(x).ok) lidos++; else outros++; });
        } catch (e) { /* imagem que não abriu */ }
      }
      const ks = Object.keys(S.qr.partes);
      if (!ks.length) return { h: `<p>${esc(outros ? L.bu_qr_unknown : L.bu_qr_none)}</p><ul class="at-lista">${T.qr_tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` + botoes([btnArq("foto"), podeCamera ? btnArq("camera") : ""]) };
      const r = ext().juntarQR(S.qr.partes), total = S.qr.partes[ks[0]].total || ks.length;
      if (!r.presidente) return { h: `<p>${esc(ks.length < total ? L.bu_qr_part(ks.length, total) : L.bu_qr_nopres(ks.length, total))}</p><p class="small muted">${esc(T.qr_parts)}</p>` + botoes([btnArq("foto"), podeCamera ? btnArq("camera") : ""]) };
      const h = await compararBU(r, `${L.bu_from_qr} · ${T.qr_from_photo}`);
      S.qr = { partes: {} };
      return { h };
    })();
    const x = await pensar(T.think.qr, trab);
    return escrever(x.h, { q: T.fn.qr[0] });
  }

  async function abrirCamera() {
    const T = X(), L = t();
    fecharMenus(); fecharGaveta();
    if (S.ocupado || S.cam) return;
    if (!podeCamera) { ocupar(async () => { usuario(T.up.camera[0]); await pensar(T.think.guia); await escrever(`<p>${esc(L.bu_nocam)}</p>` + botoes([btnArq("foto")])); }); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }); }
    catch (e) { ocupar(async () => { usuario(T.up.camera[0]); await pensar(T.think.guia); await escrever(`<p>${esc(L.bu_cam_denied)}</p>` + botoes([btnArq("foto")])); }); return; }
    const box = document.createElement("div");
    box.className = "at-cam"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", T.up.camera[0]);
    box.innerHTML = `<div class="at-cam-in"><div class="at-cam-v"><video playsinline muted></video><span class="bu-mira" aria-hidden="true"></span></div>
      <p class="at-cam-st" aria-live="polite">${esc(L.bu_scanning)}</p><p class="small at-cam-dica">${esc(L.bu_qr_help)}</p>
      <button class="btn" type="button">${icone("stop")} ${esc(L.bu_stop)}</button></div>`;
    S.el.root.querySelector(".at-main").appendChild(box);
    const vid = box.querySelector("video"); vid.srcObject = stream; await vid.play().catch(() => {});
    S.cam = { stream, box };
    const visto = new Set();
    const responder_ = () => ocupar(async () => {
      usuario(T.cam_user);
      const r = ext().juntarQR(S.qr.partes), ks = Object.keys(S.qr.partes);
      if (!ks.length) { await pensar(T.think.qr.slice(0, 2)); await escrever(`<p>${esc(L.bu_qr_none)}</p>` + botoes([btnArq("camera"), btnArq("foto")])); return; }
      if (!r.presidente) { await pensar(T.think.qr.slice(0, 2)); await escrever(`<p>${esc(L.bu_qr_nopres(ks.length, S.qr.partes[ks[0]].total || ks.length))}</p>` + botoes([btnArq("camera"), btnArq("foto")])); return; }
      const h = await pensar(T.think.qr, compararBU(r, `${L.bu_from_qr} · ${T.qr_from_cam}`));
      S.qr = { partes: {} };
      await escrever(h, { q: T.fn.qr[0] });
    });
    box.querySelector("button").addEventListener("click", () => { pararCamera(); if (Object.keys(S.qr.partes).length) responder_(); });
    const laco = async () => {
      if (!S.cam || S.cam.box !== box) return;
      if (vid.readyState >= 2) {
        try {
          const txts = await decodificar(vid, vid.videoWidth, vid.videoHeight);
          for (const x of txts) {
            if (visto.has(x)) continue;
            visto.add(x);
            if (navigator.vibrate) navigator.vibrate(60);
            const st = receberQR(x);
            box.querySelector(".at-cam-st").textContent = st.ok ? st.msg : L.bu_qr_unknown;
            if (st.pronto) { pararCamera(); responder_(); return; }
          }
        } catch (e) { /* tenta no próximo quadro */ }
      }
      setTimeout(laco, 250);
    };
    laco();
  }
  function pararCamera() {
    if (!S.cam) return;
    S.cam.stream.getTracks().forEach((tr) => tr.stop());
    S.cam.box.remove();
    S.cam = null;
  }

  // Conferir arquivo: SHA-512 calculado aqui e comparado com os arquivos publicados e os manifestos
  async function conferirHash(fs) {
    const T = X(), L = t();
    const trab = (async () => {
      const lib = await carregarScript("site/js/vendor/sha512.umd.min.js", "hashwasm");
      const pub = R().downloads.map((d) => ({ h: d.sha512.toLowerCase(), nome: d.nome, origem: L.vf_src_pub }));
      [1, 2].forEach((n) => pub.push({ h: R().turnos[n].cab.manifesto_sha512.toLowerCase(), nome: "manifesto_saida.sha512", origem: `${L.vf_src_man} · ${L.round(n)}` }));
      let extras = [];
      for (const f of fs) if (f.size < 2e6 && /\.(sha512|sha|txt|hash)$/i.test(f.name)) extras = extras.concat(ext().hashesDoTexto(await f.text(), f.name));
      const out = [];
      for (const f of fs) {
        try {
          const h = await lib.createSHA512(); h.init();
          for (let pos = 0; pos < f.size; pos += 8388608) h.update(new Uint8Array(await f.slice(pos, pos + 8388608).arrayBuffer()));
          out.push({ f, h: h.digest("hex") });
        } catch (e) { out.push({ f, erro: e.message }); }
      }
      return { out, todos: pub.concat(extras) };
    })();
    const { out, todos } = await pensar(T.think.hash, trab);
    let ok = 0, bad = 0;
    const cards = out.map(({ f, h, erro }) => {
      let st, msg;
      if (erro) { st = "red"; msg = erro; }
      else {
        const ig = todos.filter((x) => x.h === h);
        const mesmo = todos.filter((x) => x.nome && x.nome.split("/").pop() === f.name && x.h !== h);
        if (ig.length) { st = "green"; msg = L.vf_ok(ig.map((x) => `${x.nome || "—"} (${x.origem})`).filter((x, i, l) => l.indexOf(x) === i).join("; ")); ok++; }
        else if (mesmo.length) { st = "red"; msg = L.vf_diff(mesmo[0].nome, mesmo[0].origem); bad++; }
        else { st = "amber"; msg = T.hash_unknown; }
      }
      return `<div class="at-card at-vf at-vf-${st}"><p>${A.chip(st, { green: L.vf_st_ok, red: L.vf_st_bad, amber: L.vf_st_unk }[st])} <b class="fname">${esc(f.name)}</b> <span class="small muted">${esc(nf(f.size))} bytes</span></p>
        ${h ? `<p class="small">SHA-512:</p><code class="wrap at-hash">${h}</code><p><button class="btn-copy at-copy" type="button" data-copy="${h}">${icone("copy")}<span>${esc(L.copy)}</span></button></p>` : ""}<p class="small">${esc(msg)}</p></div>`;
    }).join("");
    let h = `<p>${esc(T.hash_lead(out.length, ok, bad))}</p>${cards}<p class="small muted">${esc(L.vf_privacy)}</p>`;
    h += botoes([ir("#/downloads", "download", T.open_dl), ir("#/conferir", "hash", L.nav.verify)]);
    return escrever(h, { q: T.fn.hash[0] });
  }

  // CSV: leitura simples (aspas, ; , tab ou |)
  function lerCsv(txt) {
    txt = String(txt).replace(/^﻿/, "");
    const l1 = txt.split(/\r?\n/, 1)[0] || "";
    const sep = [";", ",", "\t", "|"].map((c) => [c, l1.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
    const linhas = []; let cel = "", lin = [], aspas = false;
    for (let i = 0; i < txt.length; i++) {
      const c = txt[i];
      if (aspas) { if (c === '"') { if (txt[i + 1] === '"') { cel += '"'; i++; } else aspas = false; } else cel += c; continue; }
      if (c === '"') aspas = true;
      else if (c === sep) { lin.push(cel.trim()); cel = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && txt[i + 1] === "\n") i++; lin.push(cel.trim()); cel = ""; if (lin.some((x) => x)) linhas.push(lin); lin = []; }
      else cel += c;
    }
    lin.push(cel.trim()); if (lin.some((x) => x)) linhas.push(lin);
    return linhas;
  }
  const COLS = { uf: /^(uf|sg uf|sigla uf|sigla|estado|state)$/, z: /^(zona|nr zona|zone|zona eleitoral|numero zona)$/, s: /^(secao|nr secao|section|seccion|secao eleitoral|numero secao)$/,
    t: /^(turno|nr turno|round|vuelta)$/, aptos: /^(aptos|eleitores aptos|qt aptos|eligible|habilitados)$/, comp: /^(votaram|comparecimento|qt comparecimento|comp|voted|turnout|votantes)$/,
    v95: /^(brancos|branco|votos brancos|blank|blancos|en blanco|95)$/, v96: /^(nulos|nulo|votos nulos|null|nulls|anulados|96)$/ };
  function mapaColunas(cab_) {
    const m = {};
    cab_.forEach((c, i) => {
      const x = nz(c);
      Object.entries(COLS).forEach(([k, re]) => { if (re.test(x) && !(k in m)) m[k] = i; });
      if (/^\d{2}$/.test(x) && x !== "95" && x !== "96") m["v" + x] = i;
    });
    return m;
  }
  function tipoCsv(linhas) {
    if (!linhas.length) return null;
    const m = mapaColunas(linhas[0]);
    const votos = Object.keys(m).some((k) => /^v\d{2}$/.test(k) || k === "aptos" || k === "comp");
    if ("z" in m && "s" in m) return votos ? "apuracao" : "lista";
    // sem cabeçalho: UF;zona;seção
    const l = linhas[0];
    if (l.length >= 3 && window.UF_NOMES[String(l[0]).toUpperCase()] && /^\d+$/.test(l[1]) && /^\d+$/.test(l[2])) return "lista";
    return null;
  }

  async function conferirLista(f) {
    const T = X(), L = t();
    const trab = (async () => {
      const linhas = lerCsv(await f.text());
      if (!linhas.length) return { vazio: true };
      let m = mapaColunas(linhas[0]), corpo = linhas.slice(1);
      if (!("z" in m && "s" in m)) { m = { uf: 0, z: 1, s: 2 }; corpo = linhas; }
      const cortou = corpo.length > MAX_LINHAS;
      corpo = corpo.slice(0, MAX_LINHAS);
      const out = [];
      for (const l of corpo) {
        const uf = String(("uf" in m ? l[m.uf] : "") || "").toUpperCase().trim(), z = parseInt(l[m.z], 10), s = parseInt(l[m.s], 10);
        if (!window.UF_NOMES[uf] || !(z > 0) || !(s > 0)) { out.push({ inval: true, l }); continue; }
        out.push({ uf, z, s, d: await A.consultarSecao(uf, z, s) });
      }
      return { out, cortou, total: linhas.length };
    })();
    const r = await pensar(T.think.lista, trab);
    if (r.vazio) return escrever(`<p>${esc(T.csv_empty)}</p>` + botoes([`<button type="button" class="btn btn-sm" data-at="modelo-lista">${icone("download")} ${esc(T.template)}</button>`]), { q: T.fn.lista[0] });
    let ach = 0, nao = 0, inv = 0, a1 = 0, a2 = 0;
    const sinal = (f_) => { if (!f_ || !f_.o.length) return "0"; const a = f_.o.filter((o) => o[1] === "a").length, i = f_.o.length - a; return (a ? A.chip("red", nf(a)) : "") + (i ? " " + A.chip("amber", nf(i)) : ""); };
    const linhas = r.out.map((x) => {
      if (x.inval) { inv++; return [esc(x.l.join(" · ")), esc(T.ls_invalid), "", "", "", "", "", ""]; }
      if (!x.d.rec) { nao++; return [esc(x.uf), esc(T.ls_nf), x.z, x.s, "—", "—", "—", "—"]; }
      ach++;
      const rec = x.d.rec, fl = rec[3] || {}, tv = rec[2] || rec[1];
      if (fl["1"] && fl["1"].o.some((o) => o[1] === "a")) a1++;
      if (fl["2"] && fl["2"].o.some((o) => o[1] === "a")) a2++;
      return [esc(x.uf), `<button type="button" class="at-lk" data-q="${esc(`${x.uf} ${T.w_zone} ${x.z} ${T.w_section} ${x.s}`)}">${esc(A.titulo(x.d.mun[1]))}</button>`, x.z, x.s, tv ? nf(tv[0]) : "—", tv ? nf(tv[1]) : "—", sinal(fl["1"]), sinal(fl["2"])];
    });
    let h = `<p>${esc(T.ls_sum(nf(r.out.length), nf(ach), nf(nao), nf(inv)))}</p>`;
    h += `<p>${A.chip(a2 ? "red" : "green", T.ls_a(L.round(2), nf(a2)))} ${A.chip(a1 ? "red" : "green", T.ls_a(L.round(1), nf(a1)))}</p>`;
    if (r.cortou) h += `<p class="note small">${esc(T.ls_cut(nf(MAX_LINHAS)))}</p>`;
    h += tabela([L.th_uf, L.th_mun, L.th_zone, L.th_section, L.lk_aptos, L.lk_comp, `${L.th_flagged} · ${L.round(1)}`, `${L.th_flagged} · ${L.round(2)}`], linhas, "num-cols");
    h += `<p class="small muted">${esc(T.ls_note)}</p>` + botoes([`<button type="button" class="btn btn-sm" data-at-csv>${icone("download")} ${esc(T.csv_dl)}</button>`]);
    h += fonte(T.src_site);
    return escrever(h, { q: T.fn.lista[0] });
  }

  async function conferirApuracao(f) {
    const T = X(), L = t();
    const trab = (async () => {
      const linhas = lerCsv(await f.text());
      if (linhas.length < 2) return { vazio: true };
      const m = mapaColunas(linhas[0]);
      const campos = Object.keys(m).filter((k) => /^v\d{2}$/.test(k) || ["aptos", "comp", "v95", "v96"].includes(k));
      if (!("uf" in m && "z" in m && "s" in m) || !campos.length) return { formato: true };
      const corpo = linhas.slice(1, MAX_LINHAS + 1), out = [];
      for (const l of corpo) {
        const uf = String(l[m.uf] || "").toUpperCase(), z = parseInt(l[m.z], 10), s = parseInt(l[m.s], 10), n = "t" in m && String(l[m.t]).trim().startsWith("1") ? 1 : 2;
        if (!window.UF_NOMES[uf] || !(z > 0) || !(s > 0)) { out.push({ inval: true, l }); continue; }
        const d = await A.consultarSecao(uf, z, s);
        const tv = d.rec && d.rec[n];
        const comp = [];
        if (tv) {
          const { v, nomes } = A.votosTurno(n, tv);
          campos.forEach((k) => {
            const bruto = String(l[m[k]] == null ? "" : l[m[k]]).replace(/\D/g, "");
            if (bruto === "") return;
            const seu = parseInt(bruto, 10);
            const nr = k.slice(1), oficial = k === "aptos" ? tv[0] : k === "comp" ? tv[1] : v[nr] || 0;
            const rot = k === "aptos" ? L.lk_aptos : k === "comp" ? L.lk_comp : nr === "95" ? L.blank : nr === "96" ? L.null_ : `${nr} · ${A.titulo(nomes[nr] || nr)}`;
            comp.push({ rot, seu, oficial, ok: seu === oficial });
          });
        }
        out.push({ uf, z, s, n, d, tv, comp });
      }
      return { out, cortou: linhas.length - 1 > MAX_LINHAS };
    })();
    const r = await pensar(T.think.apur, trab);
    const modelo = `<button type="button" class="btn btn-sm" data-at="modelo-apuracao">${icone("download")} ${esc(T.template)}</button>`;
    if (r.vazio || r.formato) return escrever(`<p>${esc(T.ap_format)}</p>` + kv([[T.fmt, `<code>uf;zona;secao;turno;aptos;votaram;13;22;brancos;nulos</code>`]]) + botoes([btnArq("apuracao", T.pick), modelo]), { q: T.fn.apuracao[0] });
    let iguais = 0, difs = 0, nao = 0, inv = 0;
    const linhas = [];
    r.out.forEach((x) => {
      if (x.inval) { inv++; linhas.push([esc(x.l.join(" · ")), esc(T.ls_invalid), "", "", ""]); return; }
      const loc = `${x.uf} · ${x.z}/${x.s} · ${L.round(x.n)}`;
      if (!x.tv) { nao++; linhas.push([esc(loc), esc(x.d.rec ? L.lk_nodata : T.ls_nf), "", "", ""]); return; }
      x.comp.forEach((c) => { if (c.ok) iguais++; else difs++; linhas.push([esc(loc), esc(c.rot), nf(c.seu), nf(c.oficial), A.chip(c.ok ? "green" : "red", c.ok ? L.bu_eq : L.bu_ne)]); });
    });
    let h = `<p>${A.chip(difs ? "red" : "green", difs ? T.ap_diff(nf(difs)) : T.ap_ok(nf(iguais)))}</p><p>${esc(T.ap_sum(nf(r.out.length), nf(iguais), nf(difs), nf(nao), nf(inv)))}</p>`;
    if (r.cortou) h += `<p class="note small">${esc(T.ls_cut(nf(MAX_LINHAS)))}</p>`;
    h += tabela([T.th_local, L.bu_th_field, T.th_yours, L.bu_th_file, ""], linhas, "num-cols");
    h += `<p class="small muted">${esc(L.bu_res_note)}</p>` + botoes([`<button type="button" class="btn btn-sm" data-at-csv>${icone("download")} ${esc(T.csv_dl)}</button>`, modelo]);
    h += fonte(L.bot_sec_src);
    return escrever(h, { q: T.fn.apuracao[0] });
  }

  // --- texto, planilha e impressão de uma resposta ----------------------------------------------------------
  function paraTexto(html_) {
    const d = document.createElement("div"); d.innerHTML = html_;
    d.querySelectorAll("button:not(.at-lk), .chips, .at-btns, .at-acts, svg, .msg-rel").forEach((x) => x.remove());
    d.querySelectorAll("li").forEach((x) => x.prepend("• "));
    d.querySelectorAll("tr").forEach((tr) => tr.querySelectorAll("th, td").forEach((c, i) => { if (i) c.prepend(" | "); }));
    d.querySelectorAll("dt, .bar-label").forEach((x) => x.append(": "));
    d.querySelectorAll("p, li, h4, tr, dl > div, .bar-row, br, .at-card").forEach((x) => x.after("\n"));
    return d.textContent.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function tabelasDe(html_) {
    const d = document.createElement("div"); d.innerHTML = html_;
    return Array.from(d.querySelectorAll("table")).map((tb) => Array.from(tb.rows).map((tr) => Array.from(tr.cells).map((c) => c.textContent.replace(/\s+/g, " ").trim())));
  }
  function baixar(nome, conteudo, tipo) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const q2 = (x) => `"${String(x == null ? "" : x).replace(/"/g, '""')}"`;
  const csv = (linhas) => "﻿" + linhas.map((l) => l.map(q2).join(";")).join("\r\n");
  const hoje = () => new Date().toISOString().slice(0, 10);
  const slug = (s) => nz(s).replace(/ /g, "-").slice(0, 40) || "atlas";
  function linhasPlanilha(html_) {
    const d = document.createElement("div"); d.innerHTML = html_;
    d.querySelectorAll("button:not(.at-lk), .chips, .at-btns, .at-acts, .msg-rel, svg").forEach((x) => x.remove());
    const txt = (x) => x.textContent.replace(/\s+/g, " ").trim(), out = [];
    const andar = (n) => Array.from(n.children).forEach((c) => {
      if (c.matches("table")) { if (out.length) out.push([]); Array.from(c.rows).forEach((tr) => out.push(Array.from(tr.cells).map(txt))); out.push([]); }
      else if (c.matches("dl")) Array.from(c.querySelectorAll("dt")).forEach((dt) => out.push([txt(dt), txt(dt.nextElementSibling || dt)]));
      else if (c.matches(".bar-row")) out.push([txt(c.querySelector(".bar-label")), txt(c.querySelector(".bar-value"))]);
      else if (c.matches("p, h4, li") && !c.querySelector("table, dl, .bar-row")) { const x = txt(c); if (x) out.push([x]); }
      else andar(c);
    });
    andar(d);
    return out;
  }
  function csvResposta(m) {
    const linhas = [["Atlas", m.q || ""], [t().badge, URL_SITE + "#/atlas"], []].concat(linhasPlanilha(m.h));
    baixar(`atlas-${slug(m.q)}-${hoje()}.csv`, csv(linhas), "text/csv;charset=utf-8");
  }
  function csvConversa() {
    const c = S.convs.find((x) => x.id === S.atual); if (!c) return;
    const T = X(), fmt = new Intl.DateTimeFormat(t().locale, { dateStyle: "short", timeStyle: "short" });
    const linhas = [[T.th_who, T.th_when, T.th_text]].concat(c.m.map((m) => [m.r === "u" ? T.who_you : "Atlas", fmt.format(new Date(m.ts || Date.now())), m.r === "u" ? (m.txt || paraTexto(m.h)) : paraTexto(m.h)]));
    linhas.push([], [t().badge, URL_SITE + "#/atlas"]);
    baixar(`atlas-conversa-${hoje()}.csv`, csv(linhas), "text/csv;charset=utf-8");
  }
  function imprimir(d) {
    document.body.classList.add("at-imprimindo");
    if (d) {
      document.body.classList.add("at-so-um");
      d.classList.add("at-alvo");
      let p = d.previousElementSibling; while (p && !p.classList.contains("msg-user")) p = p.previousElementSibling;
      if (p) p.classList.add("at-alvo");
    }
    const fim = () => { document.body.classList.remove("at-imprimindo", "at-so-um"); $$(".at-alvo").forEach((x) => x.classList.remove("at-alvo")); window.removeEventListener("afterprint", fim); };
    window.addEventListener("afterprint", fim);
    window.print();
  }

  // --- ações em cada resposta: copiar, ouvir, compartilhar, exportar, automação, reportar ------------------
  function acoesResposta(d, m) {
    const T = X(), C = S.con;
    d._m = m;
    const old = d.querySelector(".at-acts"); if (old) old.remove();
    const b = (k, ic, txt, pop) => `<button type="button" class="at-ac" data-at-ac="${k}" aria-label="${esc(txt)}" title="${esc(txt)}"${pop ? ' aria-haspopup="menu" aria-expanded="false"' : ""}>${icone(ic)}</button>`;
    d.insertAdjacentHTML("beforeend", `<div class="at-acts">${b("copiar", "copy", T.ac_copy)}${podeFalar ? b("ouvir", "speaker", T.ac_listen) : ""}${C.share ? b("compartilhar", "share", T.ac_share, true) : ""}${C.export ? b("exportar", "download", T.ac_export, true) : ""}${C.hook && urlValida(S.hook.url) ? b("automacao", "plug", T.ac_hook) : ""}${C.github ? b("reportar", "alert", T.ac_report) : ""}<span class="at-status" aria-live="polite"></span></div>`);
  }
  function status(d, txt) {
    const s = d.querySelector(".at-status"); if (!s) return;
    s.textContent = txt;
    clearTimeout(s._t); s._t = setTimeout(() => { s.textContent = ""; }, 4000);
  }
  const linkResposta = (m) => URL_SITE + "#/atlas" + (m.q ? "?q=" + enc(m.q) : "");
  function popover(btn, itens) {
    fecharMenus();
    const p = document.createElement("div");
    p.className = "at-pop"; p.setAttribute("role", "menu");
    p.innerHTML = itens.map((x) => (x.href ? `<a role="menuitem" href="${esc(x.href)}" target="_blank" rel="noopener">${x.ic}<span>${esc(x.txt)}</span></a>`
      : `<button type="button" role="menuitem" data-pop="${x.k}">${x.ic}<span>${esc(x.txt)}</span></button>`)).join("");
    btn.parentElement.appendChild(p);
    btn.setAttribute("aria-expanded", "true");
    p._btn = btn;
    const r = p.getBoundingClientRect();
    if (r.top < 60) p.classList.add("baixo");
    const primeiro = p.querySelector("a, button"); if (primeiro) primeiro.focus({ preventScroll: true });
    return p;
  }
  const rede = (k) => `<span class="at-rede r-${k}" aria-hidden="true">${{ whatsapp: "W", telegram: "T", x: "X", email: "@", mais: "+" }[k]}</span>`;
  function compartilharResposta(btn, d, m) {
    const T = X(), L = t();
    const link = linkResposta(m), txt = paraTexto(m.h), titulo = `Atlas · ${m.q || T.title}`;
    const curto = (n) => (txt.length > n ? txt.slice(0, n - 1).trimEnd() + "…" : txt);
    const itens = [
      { href: `https://wa.me/?text=${enc(`*${titulo}*\n\n${curto(900)}\n\n${link}\n${L.badge}`)}`, ic: rede("whatsapp"), txt: "WhatsApp" },
      { href: `https://t.me/share/url?url=${enc(link)}&text=${enc(`${titulo}\n\n${curto(900)}\n${L.badge}`)}`, ic: rede("telegram"), txt: "Telegram" },
      { href: `https://twitter.com/intent/tweet?text=${enc(`${titulo}: ${curto(160)}`)}&url=${enc(link)}`, ic: rede("x"), txt: "X (Twitter)" },
      { href: `mailto:?subject=${enc(titulo)}&body=${enc(`${curto(1800)}\n\n${link}\n\n${L.badge}`)}`, ic: rede("email"), txt: L.sh_email },
    ];
    if (navigator.share) itens.push({ k: "sistema", ic: rede("mais"), txt: T.sh_more });
    itens.push({ k: "link", ic: icone("link"), txt: L.sh_copy });
    const p = popover(btn, itens);
    p.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-pop]");
      if (!b) { setTimeout(fecharMenus, 50); return; }
      fecharMenus();
      if (b.dataset.pop === "sistema") { try { await navigator.share({ title: titulo, text: curto(900), url: link }); } catch (err) { /* cancelado */ } }
      if (b.dataset.pop === "link") { const ok = await A.ferramentas.copiarTexto(link); status(d, ok ? L.copied : ""); }
    });
  }
  function exportarMenu(btn, d, m) {
    const T = X();
    const itens = [];
    if (m) itens.push({ k: "pdf1", ic: icone("print"), txt: T.ex_pdf_one }, { k: "csv1", ic: icone("list"), txt: T.ex_csv_one });
    itens.push({ k: "pdf", ic: icone("print"), txt: T.ex_pdf_all }, { k: "csv", ic: icone("list"), txt: T.ex_csv_all });
    const p = popover(btn, itens);
    p.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pop]"); if (!b) return;
      fecharMenus();
      ({ pdf1: () => imprimir(d), csv1: () => csvResposta(m), pdf: () => imprimir(null), csv: csvConversa })[b.dataset.pop]();
    });
  }
  let falando = null;
  function ouvir(btn, m) {
    if (!podeFalar) return;
    if (falando === btn) { window.speechSynthesis.cancel(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(paraTexto(m.h).replace(/[•|]/g, " ").slice(0, 4000));
    const VOZ = { PT: "pt-BR", EN: "en-US", ES: "es-ES" }[A.state.lang];
    u.lang = VOZ;
    const v = window.speechSynthesis.getVoices().find((x) => x.lang && x.lang.replace("_", "-").toLowerCase().startsWith(VOZ.slice(0, 2).toLowerCase()));
    if (v) u.voice = v;
    const fim = () => { if (falando === btn) { btn.classList.remove("on"); btn.innerHTML = icone("speaker"); falando = null; } };
    u.onend = u.onerror = fim;
    if (falando) { falando.classList.remove("on"); falando.innerHTML = icone("speaker"); }
    falando = btn; btn.classList.add("on"); btn.innerHTML = icone("stop");
    window.speechSynthesis.speak(u);
  }
  function reportar(m) {
    const T = X(), L = t();
    const resp = paraTexto(m.h);
    const corpo = `**${T.rp_q}:** ${m.q || "—"}\n\n**${T.rp_a}:**\n${resp.slice(0, 1500).split("\n").map((x) => "> " + x).join("\n")}${resp.length > 1500 ? "\n> …" : ""}\n\n**Link:** ${linkResposta(m)}\n**${T.rp_date}:** ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC\n\n**${T.rp_what}:**\n`;
    const dl = A.ferramentas.janela(T.rp_title, `<p class="small muted">${esc(T.rp_sub)}</p>
      <label class="rep-f"><span>${esc(L.rep_label)}</span><textarea rows="9">${esc(corpo)}</textarea></label>
      <div class="btn-row"><a class="btn btn-primary" data-gh target="_blank" rel="noopener">${icone("code")} ${esc(L.rep_gh)}</a></div>
      <p class="small muted">${esc(T.rp_note)}</p>`);
    const ta = dl.querySelector("textarea"), gh = dl.querySelector("[data-gh]");
    const atual = () => { gh.href = `${A.REPO}/issues/new?title=${enc(`Atlas: ${m.q || T.rp_issue}`.slice(0, 110))}&body=${enc(ta.value.slice(0, 6000))}`; };
    ta.addEventListener("input", atual); atual();
    setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 30);
  }

  // --- conexão: automação (Zapier, Make, n8n) ---------------------------------------------------------------------
  const urlValida = (u) => /^https:\/\/[^\s/@]+\.[^\s/@]+(\/[^\s]*)?$/i.test(u);
  async function postar(url, corpo) {
    try {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 15000);
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo, signal: ctl.signal }).finally(() => clearTimeout(tm));
      return r.ok ? "ok" : "http " + r.status;
    } catch (e) {
      // o destino não responde ao navegador (CORS): manda mesmo assim, sem confirmação
      try { await fetch(url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: corpo }); return "opaco"; } catch (e2) { return "falha"; }
    }
  }
  async function enviarAutomacao(m, d) {
    const T = X();
    if (!urlValida(S.hook.url)) { if (d) status(d, T.hook_bad); return; }
    if (d) status(d, T.hook_sending);
    const corpo = JSON.stringify({ fonte: "Atlas · paranacontraoscorruptos.org", aviso: t().badge, enviado_em: new Date().toISOString(), idioma: A.state.lang,
      pergunta: m.q || "", resposta: paraTexto(m.h), tabelas: tabelasDe(m.h), link: linkResposta(m) });
    const st = await postar(S.hook.url, corpo);
    if (d) status(d, st === "ok" ? T.hook_ok : st === "opaco" ? T.hook_opaque : T.hook_fail(st));
    return st;
  }

  // --- painel de conexões ------------------------------------------------------------------------------------------
  function painelConexoes() {
    const T = X();
    fecharMenus(); fecharGaveta();
    const item = (k) => `<li class="at-con"><label class="at-sw"><input type="checkbox" data-con="${k}"${S.con[k] ? " checked" : ""}><span class="at-sw-t" aria-hidden="true"></span>
        <span class="at-con-txt"><b>${esc(T.con[k][0])}</b><small>${esc(T.con[k][1])}</small></span></label>
        ${k === "hook" ? `<div class="at-hook"><label><span class="small">${esc(T.hook_url)}</span><input type="url" inputmode="url" placeholder="https://hooks.zapier.com/…" value="${esc(S.hook.url)}" data-hook-url spellcheck="false" autocomplete="off"></label>
          <label class="at-chk"><input type="checkbox" data-hook-auto${S.hook.auto ? " checked" : ""}> <span class="small">${esc(T.hook_auto)}</span></label>
          <div class="btn-row"><button class="btn btn-sm" type="button" data-hook-test>${icone("send")} ${esc(T.hook_test)}</button><span class="small muted" data-hook-st aria-live="polite"></span></div>
          <p class="small muted">${esc(T.hook_help)}</p></div>` : ""}</li>`;
    const dl = A.ferramentas.janela(T.conn_t, `<p class="small muted">${esc(T.conn_sub)}</p>
      <ul class="at-cons">${["share", "export", "ibge", "tse", "github", "hook"].map(item).join("")}</ul>
      <h3>${esc(T.priv_t)}</h3><ul class="at-cons"><li class="at-con"><label class="at-sw"><input type="checkbox" data-salvar${S.salvar ? " checked" : ""}><span class="at-sw-t" aria-hidden="true"></span>
        <span class="at-con-txt"><b>${esc(T.hist_save)}</b><small>${esc(T.hist_save_sub)}</small></span></label></li></ul>`, "dlg-atlas");
    const atualizar = () => { gravarJ(CH.con, S.con); gravarJ(CH.hook, S.hook); $$(".at-resp").forEach((d) => { if (d._m) acoesResposta(d, d._m); }); };
    dl.addEventListener("change", (e) => {
      const c = e.target.closest("[data-con]");
      if (c) { S.con[c.dataset.con] = c.checked; atualizar(); return; }
      if (e.target.matches("[data-hook-auto]")) { S.hook.auto = e.target.checked; atualizar(); return; }
      if (e.target.matches("[data-salvar]")) {
        S.salvar = e.target.checked;
        A.guardar(CH.salvar, S.salvar ? "1" : "0");
        if (S.salvar) guardarConversas(); else { try { localStorage.removeItem(CH.conv); } catch (err) { /* sem armazenamento */ } }
      }
    });
    dl.addEventListener("input", (e) => { if (e.target.matches("[data-hook-url]")) { S.hook.url = e.target.value.trim(); atualizar(); } });
    dl.querySelector("[data-hook-test]").addEventListener("click", async () => {
      const st = dl.querySelector("[data-hook-st]");
      if (!urlValida(S.hook.url)) { st.textContent = T.hook_bad; return; }
      st.textContent = T.hook_sending;
      const r = await postar(S.hook.url, JSON.stringify({ fonte: "Atlas · paranacontraoscorruptos.org", teste: true, enviado_em: new Date().toISOString(), mensagem: T.hook_test_msg }));
      st.textContent = r === "ok" ? T.hook_ok : r === "opaco" ? T.hook_opaque : T.hook_fail(r);
    });
  }

  // --- barra lateral, menus, voz -------------------------------------------------------------------------------
  function fecharGaveta() {
    const r = S.el.root; if (!r || !r.classList.contains("gaveta")) return;
    r.classList.remove("gaveta");
    const b = r.querySelector(".at-menu"); if (b) b.setAttribute("aria-expanded", "false");
  }
  function fecharMenus() {
    $$(".at-pop").forEach((p) => { if (p._btn) p._btn.setAttribute("aria-expanded", "false"); p.remove(); });
    const m = S.el.mais; if (m && !m.hidden) { m.hidden = true; const b = S.el.root.querySelector(".at-mais"); if (b) b.setAttribute("aria-expanded", "false"); }
    const ex = S.el.root && S.el.root.querySelector('[data-at="exportar-conversa"]'); if (ex) ex.setAttribute("aria-expanded", "false");
  }
  function ajustar() { const i = S.el.inp; if (!i) return; i.style.height = "auto"; i.style.height = Math.min(200, i.scrollHeight) + "px"; }
  let ouvindo = null;
  function microfone(btn) {
    const T = X();
    if (ouvindo) { ouvindo.stop(); return; }
    const r = new Reconhecer();
    r.lang = { PT: "pt-BR", EN: "en-US", ES: "es-ES" }[A.state.lang]; r.interimResults = true; r.maxAlternatives = 1;
    const inp = S.el.inp, antes = inp.placeholder;
    let final = "";
    r.onresult = (e) => { let x = ""; for (let i = 0; i < e.results.length; i++) { x += e.results[i][0].transcript; if (e.results[i].isFinal) final = x; } inp.value = x; ajustar(); };
    r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") inp.placeholder = t().bot_mic_denied; };
    r.onend = () => {
      ouvindo = null; btn.classList.remove("on"); btn.setAttribute("aria-pressed", "false");
      setTimeout(() => { inp.placeholder = antes; }, 2500);
      const v = (final || inp.value).trim();
      if (v) { inp.value = ""; ajustar(); perguntar(v); }
    };
    ouvindo = r; btn.classList.add("on"); btn.setAttribute("aria-pressed", "true"); inp.placeholder = T.mic_on;
    try { r.start(); } catch (e) { ouvindo = null; btn.classList.remove("on"); }
  }

  function eventos(root) {
    const T = X();
    S.el.form.addEventListener("submit", (e) => { e.preventDefault(); const v = S.el.inp.value.trim(); if (v && !S.ocupado) { S.el.inp.value = ""; ajustar(); } perguntar(v); });
    S.el.inp.addEventListener("input", ajustar);
    S.el.inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !toque()) { e.preventDefault(); S.el.form.requestSubmit ? S.el.form.requestSubmit() : S.el.form.dispatchEvent(new Event("submit", { cancelable: true })); }
    });
    S.el.inp.addEventListener("paste", (e) => {
      const fs = Array.from((e.clipboardData && e.clipboardData.files) || []);
      if (fs.length) { e.preventDefault(); tratarArquivos(fs, null); }
    });
    S.el.arq.addEventListener("change", () => { const fs = Array.from(S.el.arq.files); const k = S.el.arq.dataset.tipo; S.el.arq.value = ""; tratarArquivos(fs, k); });
    root.addEventListener("click", (e) => {
      const el = e.target;
      const pop = el.closest(".at-pop"); if (pop) return;
      const ac = el.closest("[data-at-ac]");
      if (ac) {
        const d = ac.closest(".at-resp"), m = d && d._m; if (!m) return;
        const k = ac.dataset.atAc, aberto = ac.getAttribute("aria-expanded") === "true";
        if (aberto) { fecharMenus(); return; }
        if (k === "copiar") { A.ferramentas.copiarTexto(paraTexto(m.h) + "\n\n" + linkResposta(m)).then((ok) => status(d, ok ? t().copied : "")); return; }
        if (k === "ouvir") { ouvir(ac, m); return; }
        if (k === "compartilhar") { compartilharResposta(ac, d, m); return; }
        if (k === "exportar") { exportarMenu(ac, d, m); return; }
        if (k === "automacao") { enviarAutomacao(m, d); return; }
        if (k === "reportar") { reportar(m); return; }
        return;
      }
      if (!el.closest(".at-mais, .at-menu-mais, [data-at='exportar-conversa']")) fecharMenus();
      const q = el.closest("[data-q]"); if (q) { perguntar(q.dataset.q); return; }
      const id = el.closest("[data-at-id]");
      if (id) {
        const en = motor().entrada(id.dataset.atId); if (!en || S.ocupado) return;
        ocupar(async () => { usuario(motor().rotulo(en)); await pensar(t().bot_think_qa); await escrever(htmlEntrada(en), { q: motor().rotulo(en) }); });
        return;
      }
      const go = el.closest("[data-go]"); if (go) { location.hash = go.dataset.go; return; }
      const fn = el.closest("[data-at-fn]"); if (fn) { funcao(fn.dataset.atFn); return; }
      const arq = el.closest("[data-at-arq]"); if (arq) { escolherArquivo(arq.dataset.atArq); return; }
      const tse = el.closest("[data-at-tse]");
      if (tse) { const alvo = JSON.parse(tse.dataset.atTse); if (!S.ocupado) ocupar(async () => { usuario(T.tse_user(alvo.tipo === "br" ? alvo.nome : `${alvo.nome} (${alvo.uf})`)); await tseComparar(alvo, T.tse_user(alvo.nome)); }); return; }
      const ts = el.closest("[data-at-tsesec]");
      if (ts) { const p = JSON.parse(ts.dataset.atTsesec); if (!S.ocupado) ocupar(async () => { const q = `${p.uf} ${T.w_zone} ${p.z} ${T.w_section} ${p.s} · TSE`; usuario(q); await tseSecao(p, q); }); return; }
      const cv = el.closest("[data-at-csv]");
      if (cv) { const d = cv.closest(".at-resp"); if (d && d._m) csvResposta(d._m); return; }
      const conv = el.closest("[data-at-conv]");
      if (conv) { if (S.ocupado) return; S.atual = conv.dataset.atConv; mostrarConversa(S.convs.find((x) => x.id === S.atual)); fecharGaveta(); return; }
      const del = el.closest("[data-at-del]");
      if (del) {
        if (S.ocupado && del.dataset.atDel === S.atual) return;
        S.convs = S.convs.filter((x) => x.id !== del.dataset.atDel);
        guardarConversas();
        if (del.dataset.atDel === S.atual) { S.atual = null; mostrarConversa(null); } else listaConversas();
        return;
      }
      const at = el.closest("[data-at]"); if (!at) return;
      const k = at.dataset.at;
      if (k === "nova") { if (S.ocupado) return; S.atual = null; mostrarConversa(null); fecharGaveta(); if (!toque()) S.el.inp.focus(); return; }
      if (k === "lado") {
        const mini = root.dataset.lado !== "mini";
        root.dataset.lado = mini ? "mini" : "aberto"; A.guardar(CH.lado, root.dataset.lado);
        at.setAttribute("aria-expanded", String(!mini)); at.setAttribute("aria-label", mini ? T.side_expand : T.side_collapse); at.title = mini ? T.side_expand : T.side_collapse;
        return;
      }
      if (k === "gaveta") { root.classList.add("gaveta"); at.setAttribute("aria-expanded", "true"); setTimeout(() => { const f = root.querySelector(".at-side .at-nova"); if (f) f.focus(); }, 50); return; }
      if (k === "gaveta-fechar") { fecharGaveta(); return; }
      if (k === "tema") { A.tema(true); at.innerHTML = icone(escuro() ? "sun" : "moon"); return; }
      if (k === "mais") {
        const abrir = S.el.mais.hidden; fecharMenus();
        S.el.mais.hidden = !abrir; at.setAttribute("aria-expanded", String(abrir));
        if (abrir) { const f = S.el.mais.querySelector("button"); if (f) f.focus({ preventScroll: true }); }
        return;
      }
      if (k === "mic") { microfone(at); return; }
      if (k === "conexoes") { painelConexoes(); return; }
      if (k === "limpar") {
        if (!window.confirm(T.hist_clear_q)) return;
        S.convs = S.convs.filter((x) => S.ocupado && x.id === S.atual);
        guardarConversas();
        if (!S.ocupado) { S.atual = null; mostrarConversa(null); } else listaConversas();
        return;
      }
      if (k === "exportar-conversa") {
        const c = S.convs.find((x) => x.id === S.atual);
        if (!c || !c.m.length) { at.title = T.exp_empty; at.classList.add("treme"); setTimeout(() => at.classList.remove("treme"), 500); return; }
        if (at.getAttribute("aria-expanded") === "true") { fecharMenus(); return; }
        exportarMenuTopo(at);
        return;
      }
      if (k === "modelo-lista") { baixar("modelo-lista-secoes.csv", csv([["uf", "zona", "secao"], ["PR", "3", "50"], ["SP", "1", "5"], ["BA", "1", "3"]]), "text/csv;charset=utf-8"); return; }
      if (k === "modelo-apuracao") {
        const cands = R().ordem_votos["2"].filter((nr) => nr !== "95" && nr !== "96");
        baixar("modelo-apuracao.csv", csv([["uf", "zona", "secao", "turno", "aptos", "votaram"].concat(cands, ["brancos", "nulos"]), ["PR", "3", "50", "2", "", ""].concat(cands.map(() => ""), ["", ""])]), "text/csv;charset=utf-8");
      }
    });
    // Arrastar e soltar arquivos na conversa
    const main = root.querySelector(".at-main");
    let prof = 0;
    const temArq = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files");
    main.addEventListener("dragenter", (e) => { if (!temArq(e)) return; e.preventDefault(); prof++; S.el.solte.hidden = false; });
    main.addEventListener("dragover", (e) => { if (!temArq(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
    main.addEventListener("dragleave", () => { prof = Math.max(0, prof - 1); if (!prof) S.el.solte.hidden = true; });
    main.addEventListener("drop", (e) => { if (!temArq(e)) return; e.preventDefault(); prof = 0; S.el.solte.hidden = true; tratarArquivos(e.dataTransfer.files, null); });
  }
  function exportarMenuTopo(btn) {
    const T = X();
    fecharMenus();
    const p = document.createElement("div");
    p.className = "at-pop at-pop-topo"; p.setAttribute("role", "menu");
    p.innerHTML = `<button type="button" role="menuitem" data-pop="pdf">${icone("print")}<span>${esc(T.ex_pdf_all)}</span></button><button type="button" role="menuitem" data-pop="csv">${icone("list")}<span>${esc(T.ex_csv_all)}</span></button>`;
    btn.parentElement.appendChild(p); p._btn = btn; btn.setAttribute("aria-expanded", "true");
    p.querySelector("button").focus({ preventScroll: true });
    p.addEventListener("click", (e) => { const b = e.target.closest("[data-pop]"); if (!b) return; fecharMenus(); if (b.dataset.pop === "pdf") imprimir(null); else csvConversa(); });
  }

  // Eventos de página (uma vez só)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !document.body.classList.contains("atlas-on")) return;
    if (S.cam) { pararCamera(); return; }
    if ($(".at-pop") || (S.el.mais && !S.el.mais.hidden)) { fecharMenus(); return; }
    fecharGaveta();
  });
  document.addEventListener("click", (e) => { if (document.body.classList.contains("atlas-on") && !e.target.closest(".at-pop, [data-at-ac], .at-mais, .at-menu-mais, [data-at='exportar-conversa']")) fecharMenus(); });
  // soltar arquivo fora da conversa não abre o arquivo no navegador
  ["dragover", "drop"].forEach((ev) => window.addEventListener(ev, (e) => { if (document.body.classList.contains("atlas-on") && !e.defaultPrevented) e.preventDefault(); }));
  document.addEventListener("pagina", (e) => {
    const no = e.detail.rota[0] === "atlas";
    document.body.classList.toggle("atlas-on", no);
    if (!no) { pararCamera(); if (podeFalar && falando) window.speechSynthesis.cancel(); }
  });

  A.paginas.atlas = { ativo: "atlas", titulo: () => "Atlas", html, iniciar };
})();
