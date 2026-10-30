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
  const SR = () => window.BOT.semResposta;
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
  const FUNCS = [["ask", "chat"], ["roteiro", "check"], ["secao", "search"], ["zona", "grid"], ["municipio", "pin"], ["estado", "map"], ["brasil", "flag"], ["urna", "vote"],
    ["ranking", "chart"], ["comparar", "swap"], ["filtro", "list"], ["porque", "alert"], ["relatorio", "file"], ["mapa", "map"],
    ["qr", "qr"], ["hash", "hash"], ["lista", "list"], ["apuracao", "chart"], ["downloads", "download"], ["tse", "shield"], ["ibge", "users"]];
  // Ícones dos tipos de arquivo; o botão "+" mostra só o que não está na barra lateral
  const ICO_ARQ = { foto: "image", camera: "camera", arquivo: "upload", hash: "hash", lista: "list", apuracao: "chart" };
  const MAIS = ["foto", "camera", "arquivo"];

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
  const cab = (txt, sub, href) => `<p class="at-h"><b${href ? ` data-href="${esc(href)}"` : ""}>${txt}</b>${sub ? ` <span class="muted">${sub}</span>` : ""}</p>`;
  const fonte = (txt) => `<p class="msg-src">${esc(t().bot_source)}: ${esc(txt)}</p>`;
  const botoes = (bs) => { const l = bs.filter(Boolean); return l.length ? `<div class="at-btns">${l.join("")}</div>` : ""; };
  const ir = (h, ic, txt) => `<button type="button" class="btn btn-sm" data-go="${esc(h)}">${icone(ic)} ${esc(txt)}</button>`;
  const perg = (q, txt) => `<button type="button" class="chipq" data-q="${esc(q)}">${esc(txt || q)}</button>`;
  const chipsQ = (l) => (l.length ? `<div class="chips">${l.join("")}</div>` : "");
  const btnArq = (k, rot) => `<button type="button" class="btn btn-sm" data-at-arq="${k}">${icone(ICO_ARQ[k])} ${esc(rot || X().up[k][0])}</button>`;
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
  function menuMais() {
    const T = X();
    return MAIS.filter((k) => k !== "camera" || podeCamera).map((k) => `<button type="button" role="menuitem" data-at-arq="${k}">${icone(ICO_ARQ[k])}<span><b>${esc(T.up[k][0])}</b><small>${esc(T.up[k][1])}</small></span></button>`).join("")
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
          <button class="at-menu" type="button" data-at="gaveta" aria-label="${esc(T.side_open)}" aria-expanded="false" aria-controls="at-side">${icone("sidebar")}<span>${esc(T.funcs_t)}</span></button>
          <div class="at-ferr">
            <button class="at-ib" type="button" data-at="exportar-conversa" aria-label="${esc(T.exp_conv)}" title="${esc(T.exp_conv)}" aria-haspopup="menu" aria-expanded="false">${icone("download")}</button>
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
        </form>
        <div class="at-solte" id="at-solte" hidden><div>${icone("upload")}<b>${esc(T.drop)}</b><span>${esc(T.drop_sub)}</span></div></div>
      </section>
      <input type="file" id="at-arq" hidden>
    </div>`;
  }

  function iniciar() {
    document.body.classList.add("atlas-on");
    if (window.BOT) window.BOT.iniciar(A.state.lang);
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
  // Resposta nova: como nas páginas, os números dos blocos contam e as barras crescem quando aparecem na conversa
  const RE_NUM = /^(\d{1,3}(?:[.,\u00a0\u202f]\d{3})+|\d+)(?=$|\s|\()/;
  function animar(d) {
    if (!document.documentElement.classList.contains("anim")) { preparar(d); return; }
    d.querySelectorAll(".kv dd").forEach((dd) => {
      const tn = dd.firstChild, m = tn && tn.nodeType === 3 && tn.nodeValue.match(RE_NUM);
      const n = m ? +m[1].replace(/\D/g, "") : 0;
      if (n < 10 || /^(19|20)\d\d$/.test(m[1])) return;
      const sp = document.createElement("span");
      sp.dataset.count = n; sp.textContent = nf(0);
      tn.nodeValue = tn.nodeValue.slice(m[1].length);
      dd.insertBefore(sp, tn);
    });
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      if (en.target.classList.contains("bars")) en.target.classList.add("in"); else contarNum(en.target);
    }), { root: S.el.log, rootMargin: "0px 0px -4% 0px" });
    d.querySelectorAll(".bars, [data-count]").forEach((el) => io.observe(el));
  }
  function contarNum(el) {
    const alvo = +el.dataset.count, t0 = performance.now();
    const passo = (agora) => { const k = Math.min(1, (agora - t0) / 1500), e = 1 - Math.pow(1 - k, 3); el.textContent = nf(Math.round(alvo * e)); if (k < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  }

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
    if (S.pre) { h = S.pre + h; S.pre = ""; }
    h += ofertaMidia(h, meta);
    const d = bolha("a", h);
    animar(d);
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
    S.ocupado = true; bloquear(true); S.pre = ""; S.parou = false;
    try { await fn(); } catch (e) {
      console.error(e);
      if (S.el.log && document.contains(S.el.log)) { const d = bolha("a", `<p class="alert">${esc(X().err)} (${esc(e.message)})</p>`); d.scrollIntoView({ block: "nearest" }); }
    } finally { S.ocupado = false; bloquear(false); S.pre = ""; }
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
  // "ver em tela cheia antes de baixar", "baixar só algumas imagens do carrossel": é sobre a prévia, não sobre os arquivos do site
  const RE_PREVIA = /\b(tela cheia|full screen|fullscreen|pantalla completa|carrossel|carousel|carrusel|previa|preview|vista previa)\b/;
  const RE_AJUDA = /^(?:ajuda|help|ayuda|menu|funcoes|functions|funciones|o que (?:voce|vc) (?:faz|sabe(?: fazer)?)|what can you do|que (?:puede|puedes) hacer|quem e voce|who are you|quien eres|o que e o atlas|what is atlas|que es atlas)$/;
  // --- memória da conversa: o assunto da última resposta, para "e no 1º turno?", "e em Londrina?", "e a seção 51?" -----
  const convAtual = () => S.convs.find((x) => x.id === S.atual) || null;
  function ctxAtual() { const c = convAtual(); return (c && c.ctx) || null; }
  // Memória da conversa inteira: lugares e seções citados (o mais recente primeiro) e a última lista mostrada
  function memoria() { const c = convAtual(); if (!c) return null; if (!c.mem) c.mem = { lug: [], sec: [], lista: [] }; return c.mem; }
  const chaveLug = (x) => `${x.tipo}|${x.uf || ""}|${x.cod || ""}|${x.z || ""}|${x.s || ""}`;
  function guardarEm(l, x) { const k = chaveLug(x), i = l.findIndex((y) => chaveLug(y) === k); if (i >= 0) l.splice(i, 1); l.unshift(x); if (l.length > 15) l.length = 15; }
  function lembrar(o) {
    const c = convAtual(); if (!c) return;
    c.ctx = JSON.parse(JSON.stringify(o));
    const mm = memoria();
    [].concat(o.lugares || [], o.lugar ? [o.lugar] : []).filter((x) => x && (x.tipo === "mun" || x.tipo === "uf" || x.tipo === "br"))
      .forEach((x) => guardarEm(mm.lug, { tipo: x.tipo, uf: x.uf || null, cod: x.cod || null, nome: x.nome || null }));
    if (o.sec && o.sec.uf && o.sec.z) guardarEm(mm.sec, o.sec.s ? { tipo: "secao", uf: o.sec.uf, z: o.sec.z, s: o.sec.s } : { tipo: "zona", uf: o.sec.uf, z: o.sec.z });
    guardarConversas();
  }
  // Itens de uma lista mostrada (ranking, filtro, comparação…), para "o segundo", "o último"
  function listar(itens) {
    const mm = memoria(); if (!mm) return;
    mm.lista = itens.filter(Boolean).slice(0, 100).map((r) => ({ tipo: r.tipo, uf: r.uf || null, cod: r.cod || null, nome: r.nome || null, z: r.z || null, s: r.s || null }));
    guardarConversas();
  }
  const lugarCtx = (lg) => (lg.muns && lg.muns.length === 1 ? Object.assign({ tipo: "mun" }, lg.muns[0]) : lg.uf ? { tipo: "uf", uf: lg.uf, nome: A.ufNome(lg.uf) } : null);
  function ctxDe(E, extra) {
    return Object.assign({ q: E.texto, intencao: E.intencao, turno: E.turno, metrica: E.metrica, unidade: E.unidade, ordem: E.ordem, n: E.n, off: E.off || 0, nivel: E.nivel, testes: E.testes, op: E.op,
      cand: E.cand, taxa: E.taxa, urna: E.urna || null, lugar: lugarCtx(E.lugar) || (E.br ? { tipo: "br" } : null), sec: E.sec && E.sec.uf && E.sec.z ? E.sec : null, lugares: E.lugares, secs: E.secs }, extra || {});
  }

  const kbEntradas = (r) => r.map((x) => ({ sc: x.sc, f: x.f, e: motor().entrada(x.i) })).filter((x) => x.e);
  const kbForte = (r) => r.length && r[0].sc >= 4 && r[0].f >= 0.34;

  // op.etapa: parte de um pedido com várias tarefas · op.semAcao: só os dados (a ação vem depois)
  async function responder(texto, op) {
    op = op || {};
    const c = motor().cortesia(texto);
    if (c && c.so) return cortesia(c);
    // "Oi, tudo bem? Resultado de Curitiba": a resposta começa devolvendo a saudação
    if (c) { S.pre += `<p>${esc(motor().cortesiaTexto(c, false, t().cort))}</p>`; texto = c.resto; }
    const T = X(), MT = window.MOTOR, cv = convAtual(), oferta = cv && cv.oferta;
    if (oferta && !op.etapa) { cv.oferta = null; guardarConversas(); }
    // pedido sobre a resposta anterior ("resume", "mais 10", "agora em inglês", "sim")
    const cmd = MT.comando(texto);
    if (cmd) { const r = await comandoResp(cmd, op.etapa ? null : oferta, texto); if (r !== false) return r; }
    const so = oferta && oferta.midia && !op.etapa && nz(texto).match(RE_SO_MIDIA), dm = so && ultimaResposta();
    if (dm) return executar(acaoMidia(so[1]), dm, texto, "");
    const calc = MT.calculo(texto);
    if (calc) return calculoResp(calc, texto);
    if (!op.etapa) { const ps = MT.etapas(texto); if (ps.length > 1) return plano(ps, texto); }
    if (RE_AJUDA.test(nz(texto))) return ajuda();
    // "o segundo da lista", "a anterior", "aquela seção"
    const ref = resolver(texto);
    if (ref.semRef) { await pensarRapido(T.think.cv); S.parou = true; return escrever(`<p>${esc(T.ref_none)}</p>` + funcChips(["municipio", "estado", "secao"]), { q: texto, acao: true }); }
    if (ref.nota) entendi(ref.nota);
    texto = ref.texto;
    const n = nz(texto), ctx = ctxAtual();
    const [an] = await Promise.all([motor().analisar(texto, ctx), motor().carregar().catch(() => {})]);
    const E = an.E, kb = kbEntradas(an.kb);
    if (!op.semAcao && E.acoes && E.acoes.lista.length) { const r = await acoesResp(E.acoes, texto, kb); if (r !== false) return r; }
    preferirUf(E, ctx);
    if (E.conta) return contaResp(E.conta, E, texto);
    if (E.continuou && E.seguimento === "conector" && ctx && ctx.intencao) { const p = mudou(E, ctx); if (p.length) entendi(T.en_cont(p.join(" · "))); }
    if (E.urna) { lembrar(ctxDe(E, { intencao: "urna" })); return urna(E.urna, texto); }
    if (E.intencao === "roteiro" && !(an.forte && !/\b(roteiro|checklist|guia)\b/.test(n) && !/\b(secao|urna|boletim|section|ballot|seccion|boletin)\b/.test(n))) return roteiro(texto);
    if (RE_DL.test(n) && E.intencao !== "relatorio" && !RE_PREVIA.test(n)) return downloads(texto);
    if (E.intencao === "porque") return porque(E, texto);
    if (E.intencao === "ranking") return rankingResp(E, texto);
    if (E.intencao === "comparar") return compararResp(E, texto);
    if (E.intencao === "filtro") return filtroResp(E, texto);
    if (E.intencao === "relatorio") return relatorioResp(E, texto);
    if (E.intencao === "mapa") return mapaResp(E, texto);
    const querTse = E.querTse;
    const sec = E.sec;
    if (sec && sec.z && !/\b(relatorio|report|informe)\b/.test(n)) {
      if (!sec.uf) return pedir(sec.s ? T.need_uf_sec : T.need_uf_zone, sec.s ? [`PR ${T.w_zone} ${sec.z} ${T.w_section} ${sec.s}`, `SP ${T.w_zone} ${sec.z} ${T.w_section} ${sec.s}`] : [`PR ${T.w_zone} ${sec.z}`, `SP ${T.w_zone} ${sec.z}`]);
      lembrar(ctxDe(E, { intencao: sec.s ? "secao" : "zona", lugar: { tipo: "uf", uf: sec.uf, nome: A.ufNome(sec.uf) }, sec: sec.s ? sec : { uf: sec.uf, z: sec.z, s: null } }));
      if (sec.s) return querTse && S.con.tse ? tseSecao({ uf: sec.uf, z: sec.z, s: sec.s }, texto) : secao(sec, texto);
      return zona(sec, texto);
    }
    if (sec && sec.s && !sec.z) return pedir(T.need_zone, [`${sec.uf || "PR"} ${T.w_zone} 3 ${T.w_section} ${sec.s}`]);
    const lg = E.lugar;
    const forte = lg.forte || !kbForte(kb) || querTse;
    if (lg.muns.length && forte) {
      const nomes = new Set(lg.muns.map((m) => m.uf));
      if (nomes.size > 1) return escolherMun(lg.muns, texto);
      const m = lg.muns[0];
      lembrar(ctxDe(E, { intencao: "lugar" }));
      if (querTse) return tseComparar({ tipo: "mun", uf: m.uf, cod: m.cod, nome: m.nome }, texto);
      return municipio(m, { q: texto, querIbge: E.querIbge });
    }
    if (lg.uf && forte) {
      lembrar(ctxDe(E, { intencao: "lugar" }));
      if (querTse) return tseComparar({ tipo: "uf", uf: lg.uf, nome: A.ufNome(lg.uf) }, texto);
      return estado(lg.uf, { q: texto, homonimos: lg.homonimos });
    }
    if (E.br && forte) { lembrar(ctxDe(E, { intencao: "lugar", lugar: { tipo: "br" } })); return querTse ? tseComparar({ tipo: "br", nome: T.br_name }, texto) : brasil(texto); }
    if (querTse) return pedir(T.tse_which, T.ex.tse);
    if (E.querIbge) return pedir(T.ibge_which, T.ex.ibge);
    return kbResposta(texto, kb, E);
  }

  // Saudação, obrigado ou tchau: devolve e oferece as funções
  async function cortesia(c) {
    await pensar(t().cort.think);
    return escrever(`<p>${esc(motor().cortesiaTexto(c, true, t().cort))}</p>` + (c.tipos.includes("tchau") ? "" : funcChips(["secao", "municipio", "estado", "qr", "downloads", "ask"])));
  }

  async function pedir(txt, exemplos) {
    S.parou = true;
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
  // Entendi só uma parte (uma medida, um teste, um candidato): sugere perguntas completas
  function esclarecer(E) {
    if (!E) return [];
    const T = X(), out = [];
    const fr = E.metrica && T.rk_frase[E.metrica] ? T.rk_frase[E.metrica](E.ordem || "desc", E.cand && A.titulo(E.cand.nome)) : "";
    if (fr) out.push(`${T.rk_base("uf")} ${fr}`, `${T.rk_base("mun", "PR")} ${fr}`);
    if (E.testes && E.testes.length) out.push(T.cl_ft(E.testes.map((x) => A.numTeste(x)).join(` ${T.w_and} `)), T.cl_teste(A.numTeste(E.testes[0])));
    else if (E.nivel === "a") out.push(T.ex.filtro[1]);
    if (E.cand && !fr) out.push(`${T.rk_base("mun", "PR")} ${T.rk_frase.cand("desc", A.titulo(E.cand.nome))}`);
    return [...new Set(out)].slice(0, 4);
  }
  async function kbResposta(texto, r, E) {
    const L = t(), T = X(), M = motor();
    if (!kbForte(r)) {
      window.BOT.semResposta.guardar(texto);
      S.parou = true;
      const sug = r.filter((x) => x.f > 0 && !x.e.ns).slice(0, 3), cl = esclarecer(E);
      await pensar([L.bot_think_qa[0], L.bot_think_qa[1], ...L.bot_think_none]);
      if (cl.length) {
        return escrever(`<p>${esc(umDe(T.cl_lead))}</p>` + chipsQ(cl.map((q) => perg(q)))
          + (sug.length ? `<p class="msg-rel">${esc(L.bot_maybe)}</p><div class="chips">${sug.map((x) => `<button type="button" class="chipq" data-at-id="${esc(x.e.i)}">${esc(M.rotulo(x.e))}</button>`).join("")}</div>` : ""), { q: texto });
      }
      return escrever(`<p>${esc(sug.length ? L.bot_maybe : umDe(T.fallback_v))}</p>`
        + (sug.length ? `<div class="chips">${sug.map((x) => `<button type="button" class="chipq" data-at-id="${esc(x.e.i)}">${esc(M.rotulo(x.e))}</button>`).join("")}</div>` : "")
        + `<p class="msg-rel">${esc(T.fallback_fn)}</p>` + funcChips(["secao", "municipio", "estado", "downloads", "qr"]), { q: texto });
    }
    const outros = r.slice(1, 3).filter((x) => x.sc >= r[0].sc * 0.75).map((x) => x.e);
    await pensar(L.bot_think_qa);
    return escrever(htmlEntrada(r[0].e, outros), { q: texto, kb: r[0].e.i });
  }
  const funcChips = (ks) => `<div class="chips">${ks.map((k) => `<button type="button" class="chipq" data-at-fn="${k}">${esc(X().fn[k][0])}</button>`).join("")}</div>`;

  async function ajuda() {
    const T = X();
    await pensar(T.think.guia);
    const h = `<p>${esc(T.help_lead)}</p><ul class="at-lista">${FUNCS.map(([k, ic]) => `<li><b>${esc(T.fn[k][0])}</b> — ${esc(T.fn[k][1])}</li>`).join("")}</ul>
      <h4 class="at-t">${esc(T.help_conv_t)}</h4><ul class="at-lista">${T.help_conv.map(([a, b]) => `<li><b>${esc(a)}</b> — ${esc(b)}</li>`).join("")}</ul>
      <p>${esc(T.help_files)}</p>${funcChips(["secao", "municipio", "qr", "downloads"])}${botoes([btnCon()])}`;
    return escrever(h, { q: T.fn.ask[0], fn: "ask" });
  }

  // Funções da barra lateral e dos atalhos: a pessoa toca, o Atlas explica como usar
  function funcao(k) {
    const T = X();
    fecharGaveta();
    if (S.ocupado) return;
    ocupar(async () => { usuario(T.fn[k][0]); await guiaFuncao(k); });
  }
  async function guiaFuncao(k) {
    const T = X();
    if (k === "roteiro") return roteiro(T.fn[k][0]);
    {
      await pensar(T.think.guia);
      let h = `<p>${esc(T.guia[k])}</p>`;
      if (T.ex[k]) h += chipsQ(T.ex[k].map((q) => perg(q)));
      if (k === "qr") h += botoes([btnArq("foto"), podeCamera ? btnArq("camera") : ""]);
      if (k === "hash") h += botoes([btnArq("hash", T.pick), ir("#/downloads", "download", t().nav.downloads)]);
      if (k === "lista") h += kv([[T.fmt, `<code>uf;zona;secao</code>`]]) + botoes([btnArq("lista", T.pick), `<button type="button" class="btn btn-sm" data-at="modelo-lista">${icone("download")} ${esc(T.template)}</button>`]);
      if (k === "apuracao") h += kv([[T.fmt, `<code>uf;zona;secao;turno;aptos;votaram;13;22;brancos;nulos</code>`]]) + botoes([btnArq("apuracao", T.pick), `<button type="button" class="btn btn-sm" data-at="modelo-apuracao">${icone("download")} ${esc(T.template)}</button>`]);
      if (ARQ_PRIV.includes(k)) h += `<p class="small muted">${esc(T.privacy)}</p>`;
      if ((k === "tse" && !S.con.tse) || (k === "ibge" && !S.con.ibge)) h += `<p class="note small">${esc(T.con_off[k])}</p>` + botoes([btnCon()]);
      return escrever(h, { q: T.fn[k][0], fn: k });
    }
  }
  const ARQ_PRIV = ["qr", "hash", "lista", "apuracao"];

  // --- diálogo: "entendi", referências, comandos sobre a resposta, ações, várias etapas e contas -----------------------
  const pensarRapido = (etapas, trabalho) => window.BOT.pensando(etapas, trabalho, S.el.log, true);
  const ditas = new Map();
  // Uma frase de um grupo, sem repetir a da vez anterior
  function umDe(l) {
    if (!Array.isArray(l)) return l;
    const op = l.length > 1 ? l.filter((x) => x !== ditas.get(l)) : l, x = op[Math.floor(Math.random() * op.length)];
    ditas.set(l, x);
    return x;
  }
  // Linha curta antes da resposta: o que o Atlas entendeu
  const entendi = (txt) => { S.pre += `<p class="at-entendi">${esc(txt)}</p>`; };
  const obsHtml = (l) => { const x = l.filter(Boolean); return x.length ? `<p class="at-obs">${esc(x.join(" "))}</p>` : ""; };
  // Próximo passo sugerido: fica guardado para um "sim" na próxima mensagem
  function oferecer(pergunta, q, fn, semChip) {
    const c = convAtual(); if (c) c.oferta = fn ? { fn } : { q };
    return `<p class="msg-rel at-oferta">${esc(pergunta)}</p>` + (semChip ? "" : fn ? funcChips([fn]) : chipsQ([perg(q)]));
  }
  // Resposta com números: oferece criar imagem, vídeo, carrossel, apresentação ou site (não repete nas duas respostas seguintes)
  const MIDIAS = ["post", "video", "carrossel", "pptx", "site"];
  const RE_DADOS = /class="(?:kv|bars|at-sinais)["\s]/;
  const midiaChips = () => `<div class="chips at-midia">${MIDIAS.map((k) => `<button type="button" class="chipq" data-at-md="${k}">${esc(X().md_bt[k])}</button>`).join("")}</div>`;
  function ofertaMidia(h, meta) {
    if (!meta || meta.cmd || meta.acao || meta.plano || meta.fn || !RE_DADOS.test(h)) return "";
    const c = conversa();
    if (c.m.filter((x) => x.r === "a").slice(-2).some((x) => /at-midia/.test(x.h || ""))) return "";
    const T = X(), outra = /at-oferta/.test(h);
    c.oferta = Object.assign(c.oferta || {}, { midia: true });
    return `<p class="msg-rel at-oferta">${esc(umDe(outra ? T.md_of_tb : T.md_of))}</p>` + midiaChips();
  }
  // "vídeo", "o carrossel", "uma apresentação"… logo depois da oferta
  const RE_SO_MIDIA = /^(?:(?:quero|queria|pode ser|prefiro|faz|faca|cria|crie|gera|gere|manda|i want|i d like|make|create|quiero|prefiero|haz|crea)\s+)?(?:(?:a|o|um|uma|the|an?|el|la|un|una|em|in|en)\s+)?(imagem|image|imagen|post|videos?|carrossel|carousel|carrusel|apresentacao|presentation|presentacion|powerpoint|pptx|site|website|sitio(?: web)?)(?:\s+(?:por favor|please|pf))?$/;
  function acaoMidia(k) {
    if (/^(?:imagem|image|imagen|post)$/.test(k)) k = "post";
    else if (/^videos?$/.test(k)) k = "video";
    else if (/^(?:carrossel|carousel|carrusel)$/.test(k)) k = "carrossel";
    else if (/^(?:site|website|sitio(?: web)?)$/.test(k)) return { k: "site" };
    else if (k !== "post" && k !== "video") k = "pptx";
    return k === "pptx" ? { k: "exportar", fmt: "pptx", todas: false } : k === "carrossel" ? { k: "midia", fmt: "carrossel", tipo: "img", tam: null } : { k: "midia", fmt: k };
  }
  // Lugar, zona ou seção: o texto que o motor entende ("Londrina PR", "PR zona 3 seção 50") e o nome para mostrar
  function rotRef(x) {
    const T = X();
    if (x.tipo === "secao") return `${x.uf} ${T.w_zone} ${x.z} ${T.w_section} ${x.s}`;
    if (x.tipo === "zona") return `${x.uf} ${T.w_zone} ${x.z}`;
    if (x.tipo === "mun") return Object.keys(window.UF_NOMES).some((u) => nz(A.ufNome(u)) === nz(x.nome)) ? `${T.w_city} ${x.nome} ${x.uf}` : `${x.nome} ${x.uf}`;
    if (x.tipo === "uf") return A.ufNome(x.uf);
    return T.br_name;
  }
  function nomeRef(x) {
    const L = t();
    if (x.tipo === "secao") return `${x.uf} · ${L.th_zone} ${x.z} · ${L.th_section} ${x.s}`;
    if (x.tipo === "zona") return `${x.uf} · ${L.th_zone} ${x.z}`;
    if (x.tipo === "mun") return `${x.nome} (${x.uf})`;
    if (x.tipo === "uf") return `${A.ufNome(x.uf)} (${x.uf})`;
    return X().br_name;
  }
  const igualRef = (a, b) => !!(a && b) && chaveLug(a) === chaveLug(b);
  function atualRef(ctx, tipo) {
    if (!ctx) return null;
    if (tipo === "secao") return ctx.sec && ctx.sec.s ? { tipo: "secao", uf: ctx.sec.uf, z: ctx.sec.z, s: ctx.sec.s } : null;
    if (tipo === "zona") return ctx.sec && ctx.sec.z ? { tipo: "zona", uf: ctx.sec.uf, z: ctx.sec.z } : null;
    return ctx.lugar && (!tipo || ctx.lugar.tipo === tipo) ? ctx.lugar : null;
  }
  // "o segundo", "a anterior", "aquela seção", "dessa cidade": troca pelo que foi citado antes na conversa
  const REF_SOBRA = new Set(("e and y o a os as the el la los las mostra mostre me abre abra ver veja show open see muestra muestrame detalhes details detalles sobre about dados data datos quero fala "
    + "info resultado result resultados do da de of del que tal what how volta voltar back go to para pra pro vuelve volver ao al um one uno").split(" "));
  function resolver(texto) {
    const MT = window.MOTOR, mm = memoria(), ctx = ctxAtual(), T = X();
    if (!mm) return { texto };
    let r = null;
    const o = mm.lista.length ? MT.ordinal(texto) : null;
    if (o) {
      const i = o.i < 0 ? mm.lista.length + o.i : o.i - 1, x = mm.lista[i];
      if (x) r = { ini: o.ini, fim: o.fim, x, nota: T.ref_ord(i + 1, nomeRef(x)) };
    }
    if (!r) {
      const a = MT.anterior(texto);
      if (a) {
        const l = a.alvo === "secao" || a.alvo === "zona" ? mm.sec.filter((x) => x.tipo === a.alvo) : mm.lug.filter((x) => !a.alvo || x.tipo === a.alvo);
        // sem tipo dito ("a anterior"): primeiro um lugar do mesmo tipo do atual (cidade com cidade)
        const atual = atualRef(ctx, a.alvo), outros = l.filter((y) => !igualRef(y, atual));
        const x = (!a.alvo && atual && outros.find((y) => y.tipo === atual.tipo)) || outros[0];
        if (x) r = { ini: a.ini, fim: a.fim, x, nota: T.ref_prev(nomeRef(x)) };
        else return { texto, semRef: true };
      }
    }
    if (!r) {
      const d = MT.demonstrativo(texto);
      if (d && d.alvo) {
        const l = d.alvo === "secao" || d.alvo === "zona" ? mm.sec.filter((x) => x.tipo === d.alvo) : mm.lug.filter((x) => x.tipo === d.alvo);
        const atual = atualRef(ctx, d.alvo);
        // "essa cidade": a do assunto atual; "aquela cidade": a de antes
        const x = d.longe ? l.find((y) => !igualRef(y, atual)) || atual : atual || l[0];
        if (x) r = { ini: d.ini, fim: d.fim, x, nota: T.ref_this(nomeRef(x)), prep: d.prep };
      }
    }
    if (!r) return { texto };
    const trecho = texto.slice(r.ini, r.fim), antes = texto.slice(0, r.ini), depois = texto.slice(r.fim);
    const sobra = nz(antes + " " + depois).split(" ").filter(Boolean);
    if (sobra.every((w) => REF_SOBRA.has(w))) return { texto: rotRef(r.x), nota: r.nota };
    const pre = (trecho.match(/^\s*(com|with|con|para|pra|pro|to|sobre|about|entre|between)\s/i) || [])[1] || "";
    const prep = r.prep === "de" ? T.w_of : r.prep === "em" ? T.w_in : "";
    return { texto: [antes, pre, prep, rotRef(r.x), depois].join(" ").replace(/\s+/g, " ").trim(), nota: r.nota };
  }
  // Pergunta de continuação: o que mudou em relação à anterior ("e em SC?" → "SC")
  function mudou(E, ctx) {
    const L = t(), p = [];
    const lg = lugarCtx(E.lugar) || (E.br ? { tipo: "br" } : null);
    if (lg && !igualRef(lg, ctx.lugar)) p.push(nomeRef(lg));
    if (E.turno && E.turno !== ctx.turno) p.push(L.round(E.turno));
    if (E.sec && E.sec.z && (!ctx.sec || ctx.sec.z !== E.sec.z || ctx.sec.s !== E.sec.s)) p.push(nomeRef(E.sec.s ? { tipo: "secao", uf: E.sec.uf || "", z: E.sec.z, s: E.sec.s } : { tipo: "zona", uf: E.sec.uf || "", z: E.sec.z }));
    return p;
  }
  // "Cascavel" depois de falar do Paraná: entre os municípios com esse nome, fica o do estado da conversa
  function preferirUf(E, ctx) {
    const uf = ctx && ((ctx.lugar && ctx.lugar.uf) || (ctx.sec && ctx.sec.uf));
    if (!uf) return;
    const um = (l) => { const f = l.filter((m) => m.uf === uf); return f.length === 1 && new Set(l.map((m) => m.uf)).size > 1 ? f[0] : null; };
    const m = E.lugar.muns.length > 1 ? um(E.lugar.muns) : null;
    if (m) { E.lugar = Object.assign({}, E.lugar, { muns: [m] }); entendi(X().ref_uf(`${m.nome} (${m.uf})`)); }
    (E.lugares || []).forEach((x, i) => {
      const a = x.alternativas && um(x.alternativas);
      if (a) { E.lugares[i] = Object.assign({ tipo: "mun" }, a); entendi(X().ref_uf(`${a.nome} (${a.uf})`)); }
    });
  }
  // O que o Atlas entendeu de uma pergunta, em poucas palavras
  function descrever(ctx) {
    const T = X(), L = t(), p = [];
    const lg = ctx.lugar;
    const nomes = { ranking: T.fn.ranking[0], comparar: T.fn.comparar[0], filtro: T.fn.filtro[0], porque: T.fn.porque[0], relatorio: T.fn.relatorio[0], mapa: T.fn.mapa[0], secao: T.fn.secao[0],
      zona: T.fn.zona[0], urna: T.fn.urna[0], roteiro: T.fn.roteiro[0], conta: T.cv_conta, lugar: lg ? T.fn[lg.tipo === "mun" ? "municipio" : lg.tipo === "uf" ? "estado" : "brasil"][0] : "" };
    if (nomes[ctx.intencao]) p.push(nomes[ctx.intencao]);
    if (ctx.lugares && ctx.lugares.length > 1) p.push(ctx.lugares.map(nomeRef).join(" × "));
    else if (ctx.sec && ctx.sec.z) p.push(nomeRef(ctx.sec.s ? Object.assign({ tipo: "secao" }, ctx.sec) : { tipo: "zona", uf: ctx.sec.uf, z: ctx.sec.z }));
    else if (lg) p.push(nomeRef(lg));
    if (ctx.metrica) p.push(Q().medida(ctx.metrica, { cand: ctx.cand && ctx.cand.nr, candNome: ctx.cand && A.titulo(ctx.cand.nome), nivel: ctx.nivel }).nome);
    if (ctx.turno) p.push(L.round(ctx.turno));
    return p.join(" · ");
  }
  // Refaz a resposta guardada na memória, com mudanças (mais itens, outra ordem, outro idioma, mais detalhes)
  function eDeCtx(c, mod) {
    const lg = c.lugar || null;
    const E = { texto: c.q || "", turno: c.turno || 0, sec: c.sec || null, secs: c.secs || [], nivel: c.nivel || "", metrica: c.metrica || null, taxa: !!c.taxa, ordem: c.ordem || null, n: c.n || null,
      off: c.off || 0, unidade: c.unidade || null, cand: c.cand || null, intencao: c.intencao, testes: c.testes || [], op: c.op || "e", lugares: c.lugares || [], br: !!(lg && lg.tipo === "br"),
      minha: false, urna: c.urna || null, querTse: false, querIbge: false,
      lugar: { uf: lg && lg.tipo === "uf" ? lg.uf : null, muns: lg && lg.tipo === "mun" ? [{ uf: lg.uf, cod: lg.cod, nome: lg.nome }] : [], forte: true, homonimos: [] } };
    return Object.assign(E, mod || {});
  }
  async function refazer(ctx, mod) {
    const E = eDeCtx(ctx, mod), q = ctx.q || "";
    switch (E.intencao) {
      case "ranking": return rankingResp(E, q);
      case "comparar": return compararResp(E, q);
      case "filtro": return filtroResp(E, q);
      case "relatorio": return relatorioResp(E, q);
      case "mapa": return mapaResp(E, q);
      case "porque": return porque(E, q);
      case "secao": return E.sec && E.sec.s ? secao(E.sec, q) : false;
      case "zona": return E.sec && E.sec.z ? zona(E.sec, q) : false;
      case "urna": return E.urna ? urna(E.urna, q) : false;
      case "roteiro": return roteiro(q);
      case "conta": return ctx.conta ? contaResp(ctx.conta, E, q) : false;
      case "lugar": {
        const lg = ctx.lugar; if (!lg) return false;
        return lg.tipo === "mun" ? municipio(lg, { q }) : lg.tipo === "uf" ? estado(lg.uf, { q }) : brasil(q);
      }
    }
    return false;
  }

  // Última resposta com conteúdo (sem contar avisos de ação, planos e comandos)
  function ultimaResposta() {
    const l = $$(".at-resp", S.el.log);
    for (let i = l.length - 1; i >= 0; i--) { const m = l[i]._m; if (m && !m.acao && !m.plano && !m.cmd && !m.fn) return l[i]; }
    return null;
  }
  // "resume", "explica mais simples", "mais detalhes", "só os números", "mais 10", "inverte", "agora em inglês", "sim", "não foi isso"…
  async function comandoResp(cmd, oferta, q) {
    const T = X(), ctx = ctxAtual();
    if (cmd.k === "sim") {
      if (oferta && oferta.fn) return guiaFuncao(oferta.fn);
      if (oferta && oferta.q) return responder(oferta.q);
      if (oferta && oferta.midia && ultimaResposta()) {
        await pensarRapido(T.think.cv);
        convAtual().oferta = { midia: true };
        return escrever(`<p>${esc(T.md_qual)}</p>` + midiaChips(), { q, acao: true });
      }
      await pensarRapido(T.think.cv);
      return escrever(`<p>${esc(umDe(T.cv_ok))}</p>` + funcChips(["secao", "municipio", "ranking", "comparar"]), { q, acao: true });
    }
    if (cmd.k === "nao") { await pensarRapido(T.think.cv); return escrever(`<p>${esc(umDe(T.cv_nao))}</p>` + funcChips(["secao", "municipio", "estado", "ask"]), { q, acao: true }); }
    if (cmd.k === "idioma") return idiomaResp(cmd.lang, q);
    if (cmd.k === "conversa") return conversaResp(q);
    const d = ultimaResposta();
    // sem resposta antes: segue como uma pergunta comum
    if (!d) return false;
    if (cmd.k === "errado") return erradoResp(q, ctx, d);
    if (cmd.k === "resumo") return resumoResp(d, q);
    if (cmd.k === "simples") return simplesResp(d, ctx, q);
    if (cmd.k === "detalhes") return detalhesResp(d, ctx, q);
    if (cmd.k === "numeros") return numerosResp(d, q);
    if (cmd.k === "mais") return maisResp(d, ctx, cmd.n, q);
    return ordemResp(ctx, cmd.k, q);
  }
  const divDe = (h) => { const d = document.createElement("div"); d.innerHTML = h; return d; };
  const txtDe = (e) => (e ? e.textContent.replace(/\s+/g, " ").trim() : "");
  // Resumo de uma resposta: a frase principal e os números de cada parte
  function resumir(h) {
    const dv = divDe(h);
    dv.querySelectorAll("button, .chips, .at-btns, .at-acts, svg, figure, .msg-rel, .msg-src, .at-entendi, .at-oferta, .note").forEach((x) => x.remove());
    const out = [];
    let parte = "", nParte = 0;
    const lead = Array.from(dv.children).find((p) => p.matches("p") && !p.matches(".at-h, .small, .muted, .at-obs") && txtDe(p).length > 12);
    if (lead) out.push(txtDe(lead));
    dv.querySelectorAll("h4.at-t, .kv > div, .bar-row, .at-sinais > li, table, .at-obs, .at-card").forEach((e) => {
      if (out.length >= 10) return;
      if (e.matches("h4")) { parte = txtDe(e).replace(txtDe(e.querySelector(".muted")), "").trim(); nParte = 0; return; }
      if (e.matches(".at-obs")) { out.push(txtDe(e)); return; }
      if ((e.closest(".at-card") && !e.matches(".at-card")) || nParte >= 3) return;
      const pre = parte ? parte + " · " : "";
      if (e.matches(".kv > div")) out.push(`${pre}${txtDe(e.querySelector("dt"))}: ${txtDe(e.querySelector("dd"))}`);
      else if (e.matches(".bar-row")) out.push(`${pre}${txtDe(e.querySelector(".bar-label"))}: ${txtDe(e.querySelector(".bar-value"))}`);
      else if (e.matches("li")) out.push(pre + txtDe(e));
      else if (e.matches(".at-card")) out.push(pre + txtDe(e.querySelector("p")));
      else if (e.matches("table")) {
        Array.from(e.rows).slice(1, 4).forEach((tr) => {
          const cs = Array.from(tr.cells).map(txtDe).filter((x) => x && x !== X().ft_why);
          if (cs.length) out.push(cs.length > 1 && !/^\d+$/.test(cs[0]) ? `${pre}${cs[0]}: ${cs.slice(1).join(" · ")}` : pre + cs.join(" · "));
        });
        nParte += 2;
      }
      nParte++;
    });
    if (out.length <= 1) {
      dv.querySelectorAll("p, li").forEach((e) => {
        const x = txtDe(e);
        if (out.length < 5 && x && !out.includes(x) && !e.matches(".small, .at-h")) out.push(x.length > 220 ? x.slice(0, 217).replace(/\s+\S*$/, "") + "…" : x);
      });
    }
    return { tit: txtDe(dv.querySelector(".at-h b")), itens: out.filter(Boolean).slice(0, 10) };
  }
  async function resumoResp(d, q) {
    const T = X(), r = resumir(d._m.h);
    await pensarRapido(T.think.cv);
    if (!r.itens.length) return escrever(`<p>${esc(T.cv_nada)}</p>`, { q, cmd: true });
    return escrever(cab(esc(T.cv_resumo), esc(r.tit)) + `<ul class="at-lista">${r.itens.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`, { q, cmd: true });
  }
  // Explicação em palavras simples: frases feitas com os números e o significado dos termos da resposta
  function frasesLugar(r, n, nome) {
    const T = X(), L = t(), x = r.t && r.t[n];
    if (!x) return [];
    const taxa = x.comp / (x.aptos || 1), fr = [T.sp_lugar(nome, nf(x.aptos), nf(x.comp), pct(taxa, 1), L.round(n)), T.sp_100(Math.round(taxa * 100))];
    const nomes = nomesTurno(n), vv = Q().validos(x) || 1;
    const cs = Object.keys(x.v).filter((nr) => nr !== "95" && nr !== "96" && x.v[nr] > 0).sort((a, b) => x.v[b] - x.v[a]);
    if (cs.length >= 2) fr.push(T.sp_cands(A.titulo(nomes[cs[0]] || cs[0]), pct(x.v[cs[0]] / vv, 1), A.titulo(nomes[cs[1]] || cs[1]), pct(x.v[cs[1]] / vv, 1)));
    const b = (x.v["95"] || 0) + (x.v["96"] || 0);
    fr.push(T.sp_bn(nf(b), pct(b / (x.comp || 1), 1)));
    if (r.sec) fr.push(T.sp_sinal(r.sn[n].a, nf(r.sn[n].a), nf(r.sec)));
    return fr;
  }
  function frasesSecao(sd) {
    const T = X(), L = t(), rec = sd.rec, n = rec[2] ? 2 : 1, tv = rec[n], f = (rec[3] || {})[String(n)];
    const fr = [T.sp_secao(nf(tv[0]), nf(tv[1]), L.round(n))];
    const { v, nomes } = A.votosTurno(n, tv), vv = Object.keys(v).reduce((a, nr) => a + (nr === "95" || nr === "96" ? 0 : v[nr]), 0) || 1;
    const cs = Object.keys(v).filter((nr) => nr !== "95" && nr !== "96" && v[nr] > 0).sort((a, b) => v[b] - v[a]);
    if (cs.length >= 2) fr.push(T.sp_cands(A.titulo(nomes[cs[0]] || cs[0]), pct(v[cs[0]] / vv, 1), A.titulo(nomes[cs[1]] || cs[1]), pct(v[cs[1]] / vv, 1)));
    fr.push(f && f.o.length ? T.sp_sec_flag(f.o.map((o) => `${A.numTeste(o[0])}. ${A.nomeTeste(o[0])}`).filter((x, i, l) => l.indexOf(x) === i).join("; ")) : T.sp_sec_ok);
    return fr;
  }
  function frasesRanking(h) {
    const T = X(), dv = divDe(h), tb = dv.querySelector("table");
    if (!tb) return [];
    const rs = Array.from(tb.rows).slice(1), c = (tr, i) => txtDe(tr.cells[i]);
    if (!rs.length) return [];
    const fr = [T.sp_rank(txtDe(dv.querySelector(".at-h b")), txtDe(dv.querySelector(".at-h .muted"))), T.sp_rank_1(c(rs[0], 0), c(rs[0], 1), c(rs[0], 2))];
    const u = rs[rs.length - 1];
    if (rs.length > 1) fr.push(T.sp_rank_1(c(u, 0), c(u, 1), c(u, 2)));
    fr.push(T.sp_rank_note);
    return fr;
  }
  function glossario(h) {
    const n = " " + nz(paraTexto(h)) + " ";
    return X().gloss.filter(([re]) => new RegExp(re).test(n)).slice(0, 6).map(([, a, b]) => [a, b]);
  }
  async function simplesResp(d, ctx, q) {
    const T = X(), m = d._m, it = ctx && ctx.intencao, n = (ctx && ctx.turno) || 2;
    const trab = (async () => {
      if (m.kb || !ctx) return [];
      if ((it === "lugar" || it === "relatorio" || it === "mapa") && ctx.lugar) { const r = await Q().linhaLugar(ctx.lugar); return r ? frasesLugar(r, n, nomeRef(ctx.lugar)) : []; }
      if ((it === "secao" || it === "porque") && ctx.sec && ctx.sec.s) { const sd = await A.consultarSecao(ctx.sec.uf, ctx.sec.z, ctx.sec.s); return sd.rec ? frasesSecao(sd) : []; }
      if (it === "ranking") return frasesRanking(m.h);
      if (it === "comparar" && ctx.lugares && ctx.lugares.length >= 2) {
        const rs = (await Promise.all(ctx.lugares.slice(0, 4).map((x) => Q().linhaLugar(x)))).filter(Boolean);
        return rs.map((r, i) => (r.t[n] ? T.sp_cmp(nomeRef(ctx.lugares[i]), pct(r.t[n].comp / (r.t[n].aptos || 1), 1), nf(r.sn[n].a)) : "")).filter(Boolean).concat([T.sp_cmp_note]);
      }
      return [];
    })();
    const fr = await pensarRapido(T.think.cv, trab);
    let h = cab(esc(T.cv_simples), "");
    if (fr.length) h += fr.map((x) => `<p>${esc(x)}</p>`).join("");
    else {
      const e = m.kb && motor().entrada(m.kb + "_simples");
      if (e) h += motor().md(e.a);
      else {
        const dv = divDe(m.h); dv.querySelectorAll(".at-h, .small, .muted, .msg-rel, .msg-src, .chips, .at-btns").forEach((x) => x.remove());
        const p = Array.from(dv.querySelectorAll("p, li")).map(txtDe).filter((x) => x.length > 10).slice(0, 2);
        h += p.length ? `<p>${esc(T.sp_geral)} ${esc(p.join(" "))}</p>` : `<p>${esc(T.cv_nada)}</p>`;
      }
    }
    const gl = glossario(m.h);
    if (gl.length) h += `<h4 class="at-t">${esc(T.cv_gloss)}</h4>` + kv(gl.map(([a, b]) => [a, esc(b)]));
    return escrever(h, { q, cmd: true });
  }
  async function detalhesResp(d, ctx, q) {
    const T = X(), m = d._m, it = ctx && ctx.intencao, mm = memoria();
    if (m.kb) {
      const e = motor().entrada(m.kb), rel = e && (e.r || []).map((id) => motor().entrada(id)).find((x) => x && !x.ns);
      if (rel) { await pensarRapido(t().bot_think_qa); entendi(T.cv_det_kb(motor().rotulo(rel))); return escrever(htmlEntrada(rel), { q: motor().rotulo(rel), kb: rel.i }); }
    }
    if ((it === "lugar" || it === "mapa") && ctx.lugar && ctx.lugar.tipo !== "br") { entendi(T.cv_det_rel); return refazer(ctx, { intencao: "relatorio" }); }
    if (it === "secao") return refazer(ctx, { intencao: "porque" });
    if (it === "zona") return refazer(ctx, { intencao: "filtro" });
    if (it === "ranking") { entendi(T.cv_det_rank); return refazer(ctx, { n: Math.min(50, Math.max(30, (ctx.n || 10) * 2)), off: 0 }); }
    if (it === "filtro" && mm && mm.lista[0] && mm.lista[0].tipo === "secao") { const x = mm.lista[0]; entendi(T.cv_det_ft(nomeRef(x))); return refazer({ intencao: "porque", sec: { uf: x.uf, z: x.z, s: x.s }, q: T.pq_q(x.uf, x.z, x.s) }); }
    await pensarRapido(T.think.cv);
    const qs = ((ctx && ctx.lugares) || []).filter((x) => x.tipo === "mun" || x.tipo === "uf").map((x) => `${T.rl_word} ${rotRef(x)}`);
    if (it === "porque") (m.h.match(/<b>(\d{1,2})\. /g) || []).forEach((x) => qs.push(T.cl_teste(x.replace(/\D/g, ""))));
    return escrever(`<p>${esc(it === "relatorio" ? T.cv_det_done : T.cv_nodet)}</p>` + chipsQ([...new Set(qs)].slice(0, 5).map((x) => perg(x)))
      + botoes([`<button type="button" class="btn btn-sm" data-at="exportar-ult">${icone("download")} ${esc(T.ac_export)}</button>`]), { q, cmd: true });
  }
  async function numerosResp(d, q) {
    const T = X(), dv = divDe(d._m.h), SEL = ".at-h, h4.at-t, .kv, .bars, .table-wrap, .at-sinais, .at-card > p:first-child";
    const partes = Array.from(dv.querySelectorAll(SEL)).filter((e) => !e.parentElement.closest(".kv, .bars, .table-wrap, .at-sinais"));
    await pensarRapido(T.think.cv);
    if (partes.filter((e) => !e.matches(".at-h, h4")).length < 1) return escrever(`<p>${esc(T.cv_nonum)}</p>`, { q, cmd: true });
    return escrever(partes.map((e) => e.outerHTML).join("") + fonte(T.src_site), { q, cmd: true });
  }
  async function maisResp(d, ctx, n, q) {
    const T = X(), m = d._m, it = ctx && ctx.intencao;
    if (it === "ranking") return refazer(ctx, { off: (ctx.off || 0) + (ctx.n || 10), n: Math.min(50, n || ctx.n || 10) });
    await pensarRapido(T.think.cv);
    if (m.kb) {
      const e = motor().entrada(m.kb), rel = ((e && e.r) || []).map((id) => motor().entrada(id)).filter((x) => x && !x.ns);
      if (rel.length) return escrever(`<p>${esc(T.cv_more_kb)}</p><div class="chips">${rel.map((x) => `<button type="button" class="chipq" data-at-id="${esc(x.i)}">${esc(motor().rotulo(x))}</button>`).join("")}</div>`, { q, cmd: true });
    }
    const bt = d.querySelector(".at-btns");
    return escrever(`<p>${esc(it === "filtro" ? T.cv_more_filtro : T.cv_more_none)}</p>` + (bt ? `<div class="at-btns">${bt.innerHTML}</div>` : ""), { q, cmd: true });
  }
  async function ordemResp(ctx, k, q) {
    const T = X();
    if (!ctx || ctx.intencao !== "ranking") { await pensarRapido(T.think.cv); return escrever(`<p>${esc(T.cv_noorder)}</p>` + chipsQ(T.ex.ranking.slice(0, 2).map((x) => perg(x))), { q, cmd: true }); }
    const ordem = k === "asc" ? "asc" : k === "desc" ? "desc" : ctx.ordem === "asc" ? "desc" : "asc";
    entendi(T.cv_ordem(ordem));
    return refazer(ctx, { ordem, off: 0 });
  }
  // Troca o idioma do site e refaz a última resposta no idioma novo
  async function idiomaResp(lang, q) {
    if (lang === A.state.lang) { const T = X(); await pensarRapido(T.think.cv); return escrever(`<p>${esc(T.cv_lang_same)}</p>`, { q, cmd: true }); }
    const ctx = ctxAtual(), d = ultimaResposta(), kbId = d && d._m && d._m.kb;
    const b = document.querySelector(`#lang [data-lang="${lang}"]`);
    if (!b) return false;
    const log0 = S.el.log;
    b.click();
    for (let i = 0; i < 40 && (S.el.log === log0 || !document.contains(S.el.log)); i++) await new Promise((r) => setTimeout(r, 50));
    const T = X();
    entendi(T.cv_lang_ok);
    if (kbId) {
      await motor().carregar();
      const e = motor().entrada(kbId);
      if (e) { await pensarRapido(t().bot_think_qa); return escrever(htmlEntrada(e), { q: motor().rotulo(e), kb: e.i }); }
    }
    if (ctx && ctx.intencao) { const r = await refazer(ctx); if (r !== false) return r; }
    await pensarRapido(T.think.cv);
    return escrever(`<p>${esc(T.hello)} ${esc(T.cv_lang_hi)}</p>` + funcChips(["secao", "municipio", "estado", "ask"]), { q, cmd: true });
  }
  async function conversaResp(q) {
    const T = X(), c = convAtual(), mm = memoria();
    await pensarRapido(T.think.cv);
    const us = c ? c.m.filter((x) => x.r === "u" && x.txt) : [];
    const qs = us.slice(0, -1).map((x) => x.txt).slice(-10);
    let h = cab(esc(T.cv_conv_t), esc(T.cv_conv_n(Math.max(0, us.length - 1))));
    const lug = mm ? mm.lug : [], sec = mm ? mm.sec : [];
    if (!lug.length && !sec.length) h += `<p>${esc(T.cv_conv_none)}</p>`;
    if (lug.length) h += `<p class="msg-rel">${esc(T.cv_conv_lug)}</p>` + chipsQ(lug.map((x) => perg(rotRef(x), nomeRef(x))));
    if (sec.length) h += `<p class="msg-rel">${esc(T.cv_conv_sec)}</p>` + chipsQ(sec.map((x) => perg(rotRef(x), nomeRef(x))));
    if (qs.length) h += `<h4 class="at-t">${esc(T.cv_conv_q)}</h4><ol class="at-lista">${qs.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`;
    h += botoes([`<button type="button" class="btn btn-sm" data-at="exportar-conversa">${icone("download")} ${esc(T.exp_conv)}</button>`]);
    return escrever(h, { q, cmd: true });
  }
  async function erradoResp(q, ctx, d) {
    const T = X(), m = d._m;
    let alts = [];
    if (m.q) { try { const an = await motor().analisar(m.q, null); alts = kbEntradas(an.kb).filter((x) => x.e.i !== m.kb && !x.e.ns && x.f >= 0.5 && x.sc >= 3).slice(0, 3); } catch (e) { /* segue sem alternativas */ } }
    await pensarRapido(T.think.cv);
    let h = `<p>${esc(umDe(T.er_lead))}</p>`;
    const desc = ctx && ctx.intencao ? descrever(ctx) : m.kb ? motor().rotulo(motor().entrada(m.kb) || { q: [m.q || ""] }) : "";
    if (desc && m.q) h += `<p class="small">${esc(T.er_entendi(m.q, desc))}</p>`;
    if (alts.length) h += `<p class="msg-rel">${esc(T.er_alts)}</p><div class="chips">${alts.map((x) => `<button type="button" class="chipq" data-at-id="${esc(x.e.i)}">${esc(motor().rotulo(x.e))}</button>`).join("")}</div>`;
    const ex = (ctx && ctx.intencao && T.ex[ctx.intencao]) || T.ex.ask;
    h += `<p class="msg-rel">${esc(T.er_rephrase)}</p>` + chipsQ(ex.slice(0, 3).map((x) => perg(x)));
    h += botoes([S.con.github ? `<button type="button" class="btn btn-sm" data-at="reportar-ult">${icone("alert")} ${esc(T.ac_report)}</button>` : ""]);
    window.BOT.semResposta.guardar(m.q || q);
    return escrever(h, { q, cmd: true });
  }

  // --- ações pedidas por texto: imagem, vídeo, carrossel, exportar, ouvir, compartilhar, copiar, abrir página -------------
  const SOCIAL = ["instagram", "tiktok", "kwai", "youtube", "facebook"];
  const SITE_DADOS = ["comparativo", "ranking", "painel", "mapa"];
  async function acoesResp(ac, texto, kb) {
    const T = X();
    // a ação vem junto de um pedido de dados ("imagem do relatório de Curitiba"): primeiro a resposta, depois a ação
    // site com os dados ("site de ranking do PR"): o resto do pedido diz os lugares do site, não vira uma resposta antes
    if (ac.resto && !ac.lista.every((a) => a.k === "abrir") && !ac.lista.some((a) => a.k === "site" && (SITE_DADOS.includes(a.tipo) || !respostasSite().length))) {
      const an = await motor().analisar(ac.resto, ctxAtual()), E2 = an.E;
      if (E2.intencao || E2.lugar.uf || E2.lugar.muns.length || (E2.sec && E2.sec.z) || E2.br || E2.urna || E2.conta || an.forte) {
        S.parou = false;
        await responder(ac.resto, { etapa: true, semAcao: true });
        if (S.parou) return true;
      }
    }
    const d = ultimaResposta();
    if (!d && !ac.lista.some((a) => a.k === "abrir" || a.k === "site" || (a.k === "exportar" && a.todas))) {
      // sem resposta para usar: a pergunta é sobre a função ("gerar imagem"); a base responde
      if (kbForte(kb)) return false;
      await pensarRapido(T.think.cv);
      S.parou = true;
      return escrever(`<p>${esc(T.ac_need)}</p>` + funcChips(["secao", "municipio", "estado", "ranking"]), { q: texto, acao: true });
    }
    for (const a of ac.lista) await executar(a, d, texto, ac.resto);
    return true;
  }
  function itensCompartilhar(m) {
    const T = X(), L = t();
    const link = linkResposta(m), txt = paraTexto(m.h), titulo = `Atlas · ${m.q || T.title}`;
    const curto = (n) => (txt.length > n ? txt.slice(0, n - 1).trimEnd() + "…" : txt);
    return [
      { k: "whatsapp", href: `https://wa.me/?text=${enc(`*${titulo}*\n\n${curto(900)}\n\n${link}\n${L.badge}`)}`, ic: rede("whatsapp"), txt: "WhatsApp" },
      { k: "telegram", href: `https://t.me/share/url?url=${enc(link)}&text=${enc(`${titulo}\n\n${curto(900)}\n${L.badge}`)}`, ic: rede("telegram"), txt: "Telegram" },
      { k: "x", href: `https://twitter.com/intent/tweet?text=${enc(`${titulo}: ${curto(160)}`)}&url=${enc(link)}`, ic: rede("x"), txt: "X (Twitter)" },
      { k: "email", href: `mailto:?subject=${enc(titulo)}&body=${enc(`${curto(1800)}\n\n${link}\n\n${L.badge}`)}`, ic: rede("email"), txt: L.sh_email },
    ];
  }
  const NOME_REDE = { instagram: "Instagram", tiktok: "TikTok", kwai: "Kwai", youtube: "YouTube", facebook: "Facebook", whatsapp: "WhatsApp", telegram: "Telegram", x: "X (Twitter)", email: "e-mail" };
  function nomePagina(dest) {
    const L = t(), N = L.nav;
    return { "#/mapa": N.map, "#/downloads": N.downloads, "#/testes": N.tests, "#/graficos": N.charts, "#/glossario": N.glossary, "#/limitacoes": N.limits, "#/replicar": N.replicate,
      "#/atualizacoes": N.updates, "#/lista": N.list, "#/variacao": L.pg2.vary[0], "#/turno/1": L.round(1), "#/turno/2": L.round(2), "#/": N.home }[dest] || dest;
  }
  async function executar(a, d, q, resto) {
    const T = X(), m = d && d._m;
    if (a.k === "site") {
      // tipo pedido ("site de ranking") e lugares citados no pedido ("comparando Curitiba e Londrina") já vêm escolhidos na janela
      let lugares = [];
      try { if (resto) { await motorComMunicipios(); lugares = (window.MOTOR.lugares(resto) || []).filter((x) => !x.alternativas); } } catch (e) { lugares = []; }
      const semResp = !respostasSite().length;
      await escrever(`<p>${esc(SITE_DADOS.includes(a.tipo) ? T.st_abrir_t(T.sb_tipos[a.tipo][0]) : semResp ? T.st_abrir_d : T.st_abrir)}</p>`, { q, acao: true });
      janelaSite(d, { tipo: a.tipo || null, lugares, texto: resto || "" });
      return;
    }
    const midia = (fmt, cr) => A.ferramentas.gerarImagem({ cartao: cartaoResposta(d, m), url: linkResposta(m), titulo: `Atlas · ${m.q || T.title}`, fonte: () => fonteAtlas(d), fmt, cr });
    if (a.k === "midia") {
      const tam = a.tam ? ` ${{ 45: "4:5", 11: "1:1", 916: "9:16", pdf: "PDF" }[a.tam]}` : "";
      await escrever(`<p>${esc(a.fmt === "carrossel" ? T.ac_midia[a.tipo === "vid" ? "cvid" : "cimg"](tam) : T.ac_midia[a.fmt])}</p>`, { q, acao: true });
      midia(a.fmt, a.fmt === "carrossel" ? { tipo: a.tipo, tam: a.tam } : null);
      return;
    }
    if (a.k === "exportar") {
      const alvo = a.todas ? null : d, nome = (t().xp.f[a.fmt] || [a.fmt.toUpperCase()])[0];
      if (a.fmt === "pdf") { await escrever(`<p>${esc(T.ac_pdf)}</p>`, { q, acao: true }); await imprimir(alvo); return; }
      try {
        if (a.fmt === "html") await paginaInterativa(alvo); else await A.exportar.gerar(a.fmt, fonteAtlas(alvo));
        return escrever(`<p>${esc(T.ac_exp_ok(nome, a.todas))}</p>` + botoes([`<button type="button" class="btn btn-sm" data-at="exportar-ult">${icone("download")} ${esc(T.ac_exp_more)}</button>`]), { q, acao: true });
      } catch (e) { console.error(e); return escrever(`<p class="alert">${esc(T.ac_exp_err(e.message))}</p>`, { q, acao: true }); }
    }
    if (a.k === "ouvir") {
      const b = d.querySelector('[data-at-ac="ouvir"]');
      if (!podeFalar || !b) return escrever(`<p>${esc(T.ac_ouvir_no)}</p>`, { q, acao: true });
      await escrever(`<p>${esc(T.ac_ouvir)}</p>`, { q, acao: true });
      ouvir(b, m);
      return;
    }
    if (a.k === "compartilhar") {
      if (SOCIAL.includes(a.rede)) {
        await escrever(`<p>${esc(T.ac_social(NOME_REDE[a.rede]))}</p>`, { q, acao: true });
        midia(["youtube", "tiktok", "kwai"].includes(a.rede) ? "video" : "post", null);
        return;
      }
      const its = itensCompartilhar(m).filter((x) => !a.rede || x.k === a.rede);
      return escrever(`<p>${esc(a.rede ? T.ac_share_one(NOME_REDE[a.rede]) : T.ac_share)}</p><div class="at-btns">${its.map((x) => `<a class="btn btn-sm" href="${esc(x.href)}" target="_blank" rel="noopener">${x.ic} ${esc(x.txt)}</a>`).join("")}</div>`, { q, acao: true });
    }
    if (a.k === "copiar") {
      const ok = await A.ferramentas.copiarTexto(a.link ? linkResposta(m) : paraTexto(m.h) + "\n\n" + linkResposta(m));
      return escrever(`<p>${esc(ok ? (a.link ? T.ac_copy_link : T.ac_copy_ok) : T.ac_copy_fail)}</p>`, { q, acao: true });
    }
    if (a.k === "abrir") {
      let dest = a.destino, nome;
      if (dest === "lugar") {
        // "abre a página de Londrina" ou a do assunto atual
        let alvo = null;
        if (resto) { const an = await motor().analisar(resto, null); alvo = lugarCtx(an.E.lugar) || (an.E.sec && an.E.sec.s && an.E.sec.uf ? Object.assign({ tipo: "secao" }, an.E.sec) : null); }
        const ctx = ctxAtual();
        if (!alvo && ctx) alvo = ctx.sec && ctx.sec.s ? { tipo: "secao", uf: ctx.sec.uf, z: ctx.sec.z, s: ctx.sec.s } : ctx.lugar;
        // pediu "a página do município" (ou do estado) e o assunto é uma seção: sobe para o município (ou o estado) dela
        if (alvo && alvo.tipo === "secao" && a.alvo === "mun") { const sd = await A.consultarSecao(alvo.uf, alvo.z, alvo.s).catch(() => null); if (sd && sd.mun) alvo = { tipo: "mun", uf: alvo.uf, cod: sd.mun[0], nome: A.titulo(sd.mun[1]) }; }
        if (alvo && alvo.tipo !== "uf" && a.alvo === "uf" && alvo.uf) alvo = { tipo: "uf", uf: alvo.uf };
        if (!alvo || alvo.tipo === "br") { await pensarRapido(T.think.cv); S.parou = true; return escrever(`<p>${esc(T.ac_open_none)}</p>`, { q, acao: true }); }
        dest = alvo.tipo === "mun" ? `#/uf/${alvo.uf}/${alvo.cod}` : alvo.tipo === "uf" ? `#/uf/${alvo.uf}` : `#/secao/${alvo.uf}/${alvo.z}/${alvo.s}`;
        nome = nomeRef(alvo);
      } else nome = nomePagina(dest);
      await escrever(`<p>${esc(T.ac_open(nome))}</p>`, { q, acao: true });
      setTimeout(() => { location.hash = dest; }, 700);
    }
  }
  // Várias tarefas numa mensagem: mostra o plano e faz uma de cada vez (o que abre janela fica para o fim)
  async function plano(ps, texto) {
    const T = X(), MT = window.MOTOR;
    const janela = (p) => MT.acoes(p).lista.some((a) => a.k === "midia" || a.k === "site" || (a.k === "compartilhar" && SOCIAL.includes(a.rede)));
    const ord = ps.map((p, i) => ({ p, i, j: janela(p) ? 1 : 0 })).sort((a, b) => a.j - b.j || a.i - b.i);
    await pensarRapido(T.think.plano);
    await escrever(`<p>${esc(T.pl_lead(ord.length))}</p><ol class="at-plano">${ord.map((x) => `<li>${esc(x.p)}</li>`).join("")}</ol>`, { q: texto, plano: true });
    for (let k = 0; k < ord.length; k++) {
      S.parou = false;
      S.pre = `<p class="at-entendi">${esc(T.pl_step(k + 1, ord.length, ord[k].p))}</p>`;
      await responder(ord[k].p, { etapa: true });
      S.pre = "";
      if (S.parou && k < ord.length - 1) { await escrever(`<p>${esc(T.pl_stop(k + 1))}</p>` + chipsQ(ord.slice(k + 1).map((x) => perg(x.p))), { q: texto, acao: true }); return; }
    }
  }

  // --- contas: média, soma, mediana, maior e menor; filtros com limiar; diferença entre dois lugares; conta simples -------
  const CAPITAL = { AC: "Rio Branco", AL: "Maceió", AM: "Manaus", AP: "Macapá", BA: "Salvador", CE: "Fortaleza", DF: "Brasília", ES: "Vitória", GO: "Goiânia", MA: "São Luís", MG: "Belo Horizonte",
    MS: "Campo Grande", MT: "Cuiabá", PA: "Belém", PB: "João Pessoa", PE: "Recife", PI: "Teresina", PR: "Curitiba", RJ: "Rio de Janeiro", RN: "Natal", RO: "Porto Velho", RR: "Boa Vista",
    RS: "Porto Alegre", SC: "Florianópolis", SE: "Aracaju", SP: "São Paulo", TO: "Palmas" };
  const TAXA = new Set(["comp", "abst", "brancos", "nulos", "bn", "cand_pct"]);
  // Numerador e denominador de uma medida num lugar e turno (seções e sinalizações vêm da linha inteira)
  function partesDe(r, k, n, cand) {
    if (k === "secoes") return { num: r.sec, den: null };
    if (k === "sinal") return { num: r.sn[n].a, den: r.sec || null };
    const x = r.t && r.t[n];
    if (!x) return null;
    const v = (nr) => x.v[nr] || 0;
    if (k === "comp") return { num: x.comp, den: x.aptos };
    if (k === "abst") return { num: x.aptos - x.comp, den: x.aptos };
    if (k === "brancos") return { num: v("95"), den: x.comp };
    if (k === "nulos") return { num: v("96"), den: x.comp };
    if (k === "bn") return { num: v("95") + v("96"), den: x.comp };
    if (k === "cand_pct" || k === "cand") return { num: v(cand), den: Q().validos(x) };
    if (k === "aptos") return { num: x.aptos, den: null };
    return null;
  }
  async function linhasGrupo(g) {
    const fora = (l) => l.filter((r) => r.uf !== "ZZ");
    const reg = g.regiao ? window.MOTOR.REGIOES[g.regiao] : null;
    if (g.unidade === "uf") { const l = fora(await Q().estados({})); return reg ? l.filter((r) => reg.includes(r.uf)) : l; }
    const ufs = g.uf ? [g.uf] : reg || Object.keys(window.UF_NOMES).filter((u) => u !== "ZZ");
    const l = await Q().municipios(ufs, {});
    return g.capitais ? l.filter((r) => CAPITAL[r.uf] && nz(r.nome) === nz(CAPITAL[r.uf])) : fora(l);
  }
  function grupoTxt(g) {
    const T = X();
    const quem = g.capitais ? T.ct_cap : T.rk_unid[g.unidade === "uf" ? "uf" : "mun"];
    return `${quem} · ${g.uf ? `${A.ufNome(g.uf)} (${g.uf})` : g.regiao ? T.ct_reg[g.regiao] : T.br_name}`;
  }
  const usaTaxa = (c) => c.pct || (TAXA.has(c.metrica) && c.v <= 100);
  function condTexto(c, nome) {
    const T = X(), f = (v) => (usaTaxa(c) ? `${A.nf(v)}%` : nf(v));
    return c.op === "bt" ? T.ct_cond.bt(nome, f(c.v), f(c.v2)) : T.ct_cond[c.op](nome, f(c.v));
  }
  async function contaResp(cq, E, q) {
    const T = X(), L = t(), g = cq.grupo || {};
    let n = cq.turno || 2;
    const cand = cq.cand, cn = cand && cand.nr, candNome = cand && A.titulo(cand.nome);
    if (cand && !turnoTem(n, cn)) { if (cq.turno) return faltando(T.rk_cand_round(candNome, L.round(n)), [`${q} ${L.round(1)}`]); n = 1; }
    if (cq.tipo === "dif") return difResp(cq, n, q);
    if (g.unidade === "mun" && !g.uf && !g.regiao && !g.capitais && !g.br) {
      return faltando(T.ct_ask_scope, [`${q} ${T.w_in} ${A.ufNome("PR")}`, `${q} ${T.w_in} ${A.ufNome("SP")}`, `${q} ${T.ct_q_cap}`, `${q} ${T.w_in} ${T.br_name}`]);
    }
    const rows = await pensar(T.think.conta, linhasGrupo(g));
    lembrar({ q, intencao: "conta", conta: cq, turno: cq.turno, lugar: g.uf ? { tipo: "uf", uf: g.uf, nome: A.ufNome(g.uf) } : null });
    if (!rows.length) return escrever(`<p>${esc(T.ct_none)}</p>`, { q });
    const nomeMed = (k) => Q().medida(k, { cand: cn, candNome }).nome;
    const sub = `${grupoTxt(g)} · ${L.round(n)}`, como = [];
    let h;
    if (cq.tipo === "agg") {
      const k = cq.metrica, taxa = TAXA.has(k);
      const vals = rows.map((r) => ({ r, p: partesDe(r, k, n, cn) })).filter((x) => x.p && x.p.num != null && (!taxa || x.p.den));
      if (!vals.length) return escrever(`<p>${esc(T.ct_none)}</p>`, { q });
      const v = (x) => (taxa ? x.p.num / x.p.den : x.p.num), f = (x) => (taxa ? pct(x, 2) : nf(Math.round(x * 10) / 10));
      const ord = vals.slice().sort((a, b) => v(a) - v(b)), N = ord.length;
      const soma = ord.reduce((a, x) => a + x.p.num, 0), somaDen = ord.reduce((a, x) => a + (x.p.den || 0), 0);
      const media = ord.reduce((a, x) => a + v(x), 0) / N, mediana = N % 2 ? v(ord[(N - 1) / 2]) : (v(ord[N / 2 - 1]) + v(ord[N / 2])) / 2;
      const maior = ord[N - 1], menor = ord[0];
      const res = { media: f(media), soma: nf(soma), mediana: f(mediana), max: `${nomeTxt(maior.r)}, ${f(v(maior))}`, min: `${nomeTxt(menor.r)}, ${f(v(menor))}` }[cq.op];
      h = cab(esc(`${T.ct_op[cq.op]} · ${nomeMed(k)}`), esc(sub)) + `<p>${esc(T.ct_lead(T.ct_op[cq.op], nomeMed(k), res, N))}</p>`;
      h += kv([[T.ct_kv.media(N), esc(f(media))], taxa ? [T.ct_kv.pond, esc(pct(soma / (somaDen || 1), 2))] : [T.ct_kv.soma, esc(nf(soma))], [T.ct_kv.mediana, esc(f(mediana))],
        [T.ct_kv.max, esc(`${nomeTxt(maior.r)} · ${f(v(maior))}`)], [T.ct_kv.min, esc(`${nomeTxt(menor.r)} · ${f(v(menor))}`)]]);
      const barra = ord.slice().reverse().slice(0, N <= 30 ? N : 15), topo = v(barra[0]) || 1;
      h += `<h4 class="at-t">${esc(N <= 30 ? T.ct_todos(N) : T.ct_top(15, N))}</h4>` + A.barras(barra.map((x) => ({ rotulo: nomeTxt(x.r), valor: v(x) / topo, texto: f(v(x)), dica: `${nomeTxt(x.r)}\n${nomeMed(k)}: ${f(v(x))}` })));
      listar(barra.map((x) => x.r));
      como.push(T.ct_f[k](candNome), T.ct_h_media, taxa ? T.ct_h_pond : T.ct_h_soma, T.ct_h_mediana);
      if (!g.regiao && !g.capitais && T.rk_frase[k]) h += oferecer(T.of_ct_rank, `${T.rk_base(g.unidade, g.uf)} ${T.rk_frase[k](cq.op === "min" ? "asc" : "desc", candNome)}`);
    } else {
      const conds = cq.conds || [];
      const valor = (r, c) => { const p = partesDe(r, c.metrica, n, cn); if (!p || p.num == null) return null; if (!usaTaxa(c)) return p.num; return p.den ? (p.num / p.den) * 100 : null; };
      const passa = (r, c) => { const x = valor(r, c); return x != null && (c.op === "gt" ? x > c.v : c.op === "lt" ? x < c.v : x >= c.v && x <= c.v2); };
      const ok = rows.filter((r) => conds.every((c) => passa(r, c)));
      const c0 = conds[0];
      if (c0) ok.sort((a, b) => (c0.op === "lt" ? valor(a, c0) - valor(b, c0) : valor(b, c0) - valor(a, c0)));
      const un = (g.capitais ? T.ct_cap : T.rk_unid[g.unidade === "uf" ? "uf" : "mun"]).toLowerCase();
      const condTxt = conds.map((c) => condTexto(c, nomeMed(c.metrica))).join(` ${T.w_and} `);
      h = cab(esc(conds.length ? T.ct_lim_t(condTxt) : T.ct_count_t), esc(sub));
      h += `<p>${esc(conds.length ? (ok.length ? T.ct_lim_lead(nf(ok.length), nf(rows.length), un) : T.ct_lim_none) : T.ct_count(nf(rows.length), un))}</p>`;
      if (!ok.length && c0) {
        // perto do limite: os mais próximos de passar na primeira condição
        const perto = rows.filter((r) => conds.slice(1).every((c) => passa(r, c)) && valor(r, c0) != null).sort((a, b) => (c0.op === "lt" ? valor(a, c0) - valor(b, c0) : valor(b, c0) - valor(a, c0))).slice(0, 5);
        if (perto.length) h += obsHtml([T.ct_perto(nomeMed(c0.metrica).toLowerCase(), perto.map((r) => `${nomeTxt(r)} (${usaTaxa(c0) ? `${A.nf(Math.round(valor(r, c0) * 10) / 10)}%` : nf(valor(r, c0))})`).join(", "))]);
        como.push(T.ct_h_lim(condTxt));
        if (T.rk_frase[c0.metrica] && !g.regiao && !g.capitais) h += oferecer(T.of_ct_rank, `${T.rk_base(g.unidade, g.uf)} ${T.rk_frase[c0.metrica](c0.op === "lt" ? "asc" : "desc", candNome)}`);
      }
      if (ok.length && conds.length) {
        const mets = conds.filter((c, i) => conds.findIndex((x) => x.metrica === c.metrica) === i), mostra = ok.slice(0, MAX_FILTRO);
        h += tabela(["#", T.rk_th_nome].concat(mets.map((c) => nomeMed(c.metrica)), [L.st_secoes]), mostra.map((r, i) => [String(i + 1), nomeLinha(r)].concat(mets.map((c) => {
          const p = partesDe(r, c.metrica, n, cn);
          return p ? esc(usaTaxa(c) ? pct(p.num / (p.den || 1), 2) : nf(p.num)) : "—";
        }), [nf(r.sec)])), "num-cols at-rank");
        if (ok.length > MAX_FILTRO) h += `<p class="small muted">${esc(T.ft_more(nf(MAX_FILTRO), nf(ok.length)))}</p>`;
        listar(mostra);
        mets.forEach((c) => como.push(T.ct_f[c.metrica](candNome)));
        como.push(T.ct_h_lim(condTxt));
        h += botoes([`<button type="button" class="btn btn-sm" data-at-csv>${icone("download")} ${esc(T.ct_csv)}</button>`]);
        if (ok[0].tipo === "mun" || ok[0].tipo === "uf") h += oferecer(T.of_rel(nomeTxt(ok[0])), `${T.rl_word} ${rotRef(ok[0])}`);
      }
    }
    como.push(T.ct_h_src(L.round(n)));
    h += `<h4 class="at-t">${esc(T.ct_how)}</h4><ul class="at-lista small">${como.filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    h += fonte(T.src_site);
    return escrever(h, { q });
  }
  async function difResp(cq, n, q) {
    const T = X(), L = t(), k = cq.metrica, cn = cq.cand && cq.cand.nr, candNome = cq.cand && A.titulo(cq.cand.nome);
    const rs = await pensar(T.think.conta, Promise.all(cq.lugares.map((x) => Q().linhaLugar(x))));
    lembrar({ q, intencao: "conta", conta: cq, turno: cq.turno, lugares: cq.lugares, lugar: cq.lugares[cq.lugares.length - 1] });
    const taxa = TAXA.has(k), ps = rs.map((r) => (r ? partesDe(r, k, n, cn) : null));
    if (ps.some((p) => !p || p.num == null || (taxa && !p.den))) return escrever(`<p>${esc(T.ct_none)}</p>`, { q });
    const nome = (r) => (r.tipo === "br" ? T.br_name : nomeTxt(r)), nomeMed = Q().medida(k, { cand: cn, candNome }).nome;
    const vs = ps.map((p) => (taxa ? p.num / p.den : p.num)), dif = vs[0] - vs[1];
    const fmt = (x) => (taxa ? pct(x, 2) : nf(x));
    const difTxt = taxa ? `${A.nf(Math.round(Math.abs(dif) * 10000) / 100)} ${T.ct_pp}` : nf(Math.abs(dif));
    const a = dif >= 0 ? 0 : 1, b = 1 - a;
    let h = cab(esc(T.ct_dif_t(nome(rs[0]), nome(rs[1]))), esc(`${nomeMed} · ${L.round(n)}`));
    h += `<p>${esc(dif === 0 ? T.ct_dif_igual(nomeMed) : T.ct_dif_lead(nome(rs[a]), nome(rs[b]), difTxt, nomeMed))}</p>`;
    const linhas = rs.map((r, i) => [nome(r), esc(fmt(vs[i]) + (taxa ? ` · ${nf(ps[i].num)}` : ""))]).concat([[T.ct_dif, esc(difTxt)]]);
    if (!taxa && vs[0] > 0 && vs[1] > 0) linhas.push([T.ct_razao, esc(T.ct_vezes(A.nf(Math.round((Math.max(...vs) / Math.min(...vs)) * 100) / 100)))]);
    h += kv(linhas);
    const topo = Math.max(...vs.map(Math.abs)) || 1;
    h += A.barras(rs.map((r, i) => ({ rotulo: nome(r), valor: Math.abs(vs[i]) / topo, texto: fmt(vs[i]), dica: `${nome(r)}\n${nomeMed}: ${fmt(vs[i])}` })));
    listar(cq.lugares);
    h += `<h4 class="at-t">${esc(T.ct_how)}</h4><ul class="at-lista small">${[T.ct_f[k](candNome), T.ct_h_dif, T.ct_h_src(L.round(n))].map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    h += oferecer(T.of_cmp_full, `${rotRef(cq.lugares[0])} x ${rotRef(cq.lugares[1])}`);
    h += fonte(T.src_site);
    return escrever(h, { q });
  }
  async function calculoResp(c, q) {
    const T = X(), fmtN = (x) => new Intl.NumberFormat(t().locale, { maximumFractionDigits: 6 }).format(x);
    await pensarRapido(T.think.calc);
    const expr = c.seq.map((x) => (typeof x === "number" ? fmtN(x) : { "*": "×", "/": "÷", de: T.w_of }[x] || x)).join(" ").replace(/\( /g, "(").replace(/ \)/g, ")").replace(/ %/g, "%");
    return escrever(cab(esc(T.ct_calc_t), "") + kv([[expr, `<b>${esc(fmtN(c.valor))}</b>`]]) + `<p class="small muted">${esc(T.ct_calc_note)}</p>`, { q, cmd: true });
  }

  // --- dados: município, estado, zona, seção, urna, Brasil -------------------------------------------------
  async function escolherMun(muns, texto) {
    const T = X();
    S.parou = true;
    listar(muns.map((m) => Object.assign({ tipo: "mun" }, m)));
    await pensar(T.think.mun.slice(0, 1));
    return escrever(`<p>${esc(T.mun_many)}</p>` + chipsQ(muns.map((m) => perg(`${m.nome} ${m.uf}`, `${m.nome} (${m.uf})`))), { q: texto });
  }

  async function municipio(m, opts) {
    const T = X(), L = t();
    const etapas = T.think.mun.slice(0, 3).concat(S.con.ibge && m.uf !== "ZZ" ? [T.think.ibge] : [], T.think.mun.slice(3));
    const trab = (async () => {
      const [U, s] = await Promise.all([ext().dado(`site/data/ufs/${m.uf}.json`), sinais((o) => o[0] === m.uf && o[1] === m.cod)]);
      const [ib, mapa] = await Promise.all([S.con.ibge && m.uf !== "ZZ" ? ibge(m).catch((e) => ({ erro: e.message })) : null, blocoMapa(m.uf, 2, m.cod).catch(() => "")]);
      return { x: U.m[m.cod], U, s, ib, mapa };
    })();
    const { x, U, s, ib, mapa } = await pensar(etapas, trab);
    if (!x) return escrever(`<p>${esc(L.mu_none)}</p>`, { q: opts.q });
    let h = cab(`${esc(m.nome)} (${esc(m.uf)})`, esc(A.ufNome(m.uf)), `#/uf/${m.uf}/${m.cod}`);
    h += `<p>${esc(T.mun_lead(nf(x[0]), x[1].length, x[1].join(", ")))}</p>`;
    [2, 1].forEach((n) => { const tv = x[n + 1]; if (tv) h += blocoTurno(n, tv[0], tv[1], tv[2]); });
    h += blocoSinais(s);
    if (mapa) h += mapa;
    if (ib) h += blocoIbge(ib, m);
    else if (opts.querIbge && m.uf !== "ZZ") h += `<p class="note small">${esc(T.con_off.ibge)}</p>`;
    // destaque: comparecimento do município × estado no 2º turno; sugestão: seções com anomalia ou o relatório
    const t2 = x[3], tu = Object.values(U.m).reduce((a, mm) => (mm[3] ? [a[0] + mm[3][0], a[1] + mm[3][1]] : a), [0, 0]);
    if (t2 && tu[0] && m.uf !== "ZZ") { const a = t2[1] / (t2[0] || 1), b = tu[1] / tu[0]; h += obsHtml([T.ob_mun_comp(m.nome, pct(a, 1), pct(b, 1), a >= b), s[2].a.size ? T.ob_anom(s[2].a.size, nf(s[2].a.size)) : ""]); }
    h += s[2].a.size ? oferecer(T.of_ft(m.nome), T.of_q_ft(`${m.nome} ${m.uf}`)) : oferecer(T.of_rel(m.nome), `${T.rl_word} ${m.nome} ${m.uf}`);
    h += botoes([ir(`#/uf/${m.uf}/${m.cod}`, "pin", T.open_mun), ir(`#/lista?uf=${m.uf}&mun=${m.cod}`, "list", T.open_list), ir(`#/variacao/${m.uf}/${m.cod}`, "swap", T.open_var),
      S.con.tse ? tseBtn({ tipo: "mun", uf: m.uf, cod: m.cod, nome: m.nome }) : "", opts.querIbge && !ib && m.uf !== "ZZ" ? btnCon() : ""]);
    h += fonte(T.src_site + (ib && !ib.erro && !ib.semMatch ? " · IBGE" : ""));
    return escrever(h, { q: opts.q });
  }

  async function estado(uf, opts) {
    const T = X(), L = t();
    const trab = Promise.all([ext().dado(`site/data/ufs/${uf}.json`), sinais((o) => o[0] === uf), blocoMapa(uf, 2, null).catch(() => ""),
      uf === "ZZ" ? null : Q().ranking({ unidade: "mun", uf, metrica: "sinal", turno: 2, ordem: "desc", n: 3 }).catch(() => null)]);
    const [U, s, mapa, rk] = await pensar(T.think.uf, trab);
    const ms = Object.values(U.m);
    const tot = { 1: null, 2: null };
    ms.forEach((m) => [1, 2].forEach((n) => {
      const x = m[n + 1]; if (!x) return;
      if (!tot[n]) tot[n] = [0, 0, x[2].map(() => 0)];
      tot[n][0] += x[0]; tot[n][1] += x[1]; x[2].forEach((v, i) => { tot[n][2][i] += v; });
    }));
    const sec = ms.reduce((a, m) => a + m[0], 0);
    let h = cab(`${esc(A.ufNome(uf))} (${esc(uf)})`, esc(L.uf_kicker), `#/uf/${uf}`);
    h += `<p>${esc(T.uf_lead(nf(sec), nf(ms.length)))}</p>`;
    [2, 1].forEach((n) => { if (tot[n]) h += blocoTurno(n, tot[n][0], tot[n][1], tot[n][2]); });
    h += blocoSinais(s, T.sg_note_uf);
    if (mapa) h += mapa;
    // destaque: os municípios com mais seções com anomalia; sugestão: o ranking completo
    const top = rk ? rk.top.filter((x) => x.v > 0) : [];
    if (top.length) { h += obsHtml([T.ob_uf_top(top.map((x) => `${x.r.nome} (${nf(x.v)})`).join(", "))]); listar(top.map((x) => x.r)); }
    if (rk) h += oferecer(T.of_uf_rank(uf), T.of_q_rank(uf));
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
    let h = cab(`${esc(p.uf)} · ${esc(L.th_zone)} ${p.z}`, esc(A.ufNome(p.uf)), `#/lista?uf=${p.uf}&z=${p.z}`);
    h += `<p>${esc(T.zone_lead(nf(nums.length), Z.mun.map((m) => A.titulo(m[1])).join(", ")))}</p>`;
    [2, 1].forEach((n) => { if (tot[n]) h += blocoTurno(n, tot[n][0], tot[n][1], tot[n][2]); });
    h += `<h4 class="at-t">${esc(T.sg_t)}</h4><ul class="at-sinais">${[2, 1].map((n) => `<li><b>${esc(L.round(n))}:</b> ${A.chip(an[n] ? "red" : "green", T.sg_a(nf(an[n])))} ${A.chip(inf[n] ? "amber" : "green", T.sg_i_only(nf(inf[n])))}</li>`).join("")}</ul>`;
    const ex = nums.map(Number).sort((a, b) => a - b).slice(0, 3);
    if (an[2] + inf[2] > 0) h += oferecer(T.of_zona_ft, T.of_q_zona(p.uf, p.z));
    h += `<p class="msg-rel">${esc(T.zone_try)}</p>` + chipsQ(ex.map((s) => perg(`${p.uf} ${T.w_zone} ${p.z} ${T.w_section} ${s}`)));
    h += botoes([ir(`#/lista?uf=${p.uf}&z=${p.z}`, "list", T.open_list)]);
    h += fonte(T.src_site);
    return escrever(h, { q });
  }

  async function secao(p, q) {
    const L = t(), T = X();
    const d = await pensar(L.bot_think_sec, A.consultarSecao(p.uf, p.z, p.s));
    let extra = "";
    if (d.rec) {
      const fl = d.rec[3] || {}, a = [2, 1].reduce((k, n) => k + ((fl[String(n)] && fl[String(n)].o.filter((o) => o[1] === "a").length) || 0), 0);
      const algum = [2, 1].some((n) => fl[String(n)] && fl[String(n)].o.length);
      extra = algum ? obsHtml([a ? T.ob_sec_a(a, nf(a)) : T.ob_sec_i]) + oferecer(T.of_pq, T.pq_q(d.uf, d.z, d.s)) : obsHtml([T.ob_sec_ok]) + oferecer(T.of_qr, null, "qr", true);
    }
    return escrever(htmlSecao(d, extra), { q });
  }
  function htmlSecao(d, extra) {
    const L = t(), T = X();
    if (d.erro === "zona") return `<p>${esc(L.lk_nozone)}</p>`;
    if (d.erro === "secao") {
      let h = `<p>${esc(L.lk_nosec)}</p>`;
      if (d.agregadaEm.length) h += `<p>${esc(L.lk_agg_hint(d.s))}</p>` + chipsQ(d.agregadaEm.map((x) => perg(`${d.uf} ${T.w_zone} ${d.z} ${T.w_section} ${x}`, x)));
      return h;
    }
    if (d.erro) return `<p>${esc(T.need_uf_sec)}</p>`;
    const rec = d.rec, flags = rec[3] || {}, nomeM = A.titulo(d.mun[1]);
    let h = cab(`${esc(d.uf)} · ${esc(nomeM)} · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s}`, "", `#/secao/${d.uf}/${d.z}/${d.s}`);
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
    h += `<p class="small muted">${esc(L.lk_open)}/${esc(L.lk_close)}: ${esc(L.lk_local)}.</p>` + (extra || "");
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
      h += `<li><b data-href="#/secao/${d.uf}/${d.z}/${d.s}">${esc(d.uf)} · ${esc(A.titulo(d.mun[1]))} · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s}</b> · ${esc(L.round(n))}<br>
        <span class="small">${esc(L.lk_urna(f.u, f.c, f.l))}</span><br>${f.o.map((o) => `${A.chip(o[1] === "a" ? "red" : "amber", `${A.numTeste(o[0])}. ${A.nomeTeste(o[0])}`)}`).join(" ")}</li>`;
    });
    h += `</ul><p class="small muted">${esc(T.urna_note)}</p>`;
    listar(achou.filter((x) => x.d.rec).map(({ d }) => ({ tipo: "secao", uf: d.uf, z: d.z, s: d.s })));
    h += chipsQ(achou.filter((x) => x.d.rec).map(({ d }) => perg(`${d.uf} ${T.w_zone} ${d.z} ${T.w_section} ${d.s}`)));
    h += fonte(T.src_site);
    return escrever(h, { q });
  }

  async function brasil(q) {
    const T = X(), L = t();
    const mapa = await pensar(T.think.br, blocoMapa(null, 2, null).catch(() => ""));
    let h = cab(esc(T.br_name), esc(L.cd_pres));
    [2, 1].forEach((n) => {
      const P = R().turnos[n].presidente, arr = R().ordem_votos[n].map((nr) => (P.candidatos.find((c) => c.nr === nr) || { votos: 0 }).votos);
      h += blocoTurno(n, P.aptos, P.comparecimento, arr, [[L.st_secoes, nf(R().turnos[n].entrada.secoes)], [L.st_sinal, `${nf(R().turnos[n].secoes_sinalizadas)} (${pct(R().turnos[n].secoes_sinalizadas / R().turnos[n].entrada.secoes)})`]]);
    });
    h += `<p class="small muted">${esc(T.sg_note)}</p>` + mapa;
    h += botoes([ir("#/turno/2", "chart", L.round(2)), ir("#/turno/1", "chart", L.round(1)), ir("#/mapa", "map", L.nav.map), S.con.tse ? tseBtn({ tipo: "br", nome: T.br_name }) : ""]);
    h += fonte(T.src_site);
    return escrever(h, { q });
  }

  // --- ranking, comparação, filtro, mapa, "por que", relatório e roteiro -----------------------------------------------
  const Q = () => A.consulta;
  const turnoTem = (n, nr) => R().turnos[n].presidente.candidatos.some((c) => c.nr === nr);
  const lk = (q, txt) => `<button type="button" class="at-lk" data-q="${esc(q)}">${esc(txt)}</button>`;
  const ABS = /\b(numero|quantidade|total|absolut\w*|number|count|cantidad)\b/;
  // Nome de quem aparece numa linha de ranking ou comparação, com o link que pergunta sobre ele
  function nomeLinha(r) {
    const T = X(), L = t();
    if (r.tipo === "uf") return lk(A.ufNome(r.uf), `${r.uf} – ${A.ufNome(r.uf)}`);
    if (r.tipo === "mun") return lk(`${r.nome} ${r.uf}`, `${r.nome} (${r.uf})`);
    if (r.tipo === "zona") return lk(`${r.uf} ${T.w_zone} ${r.z}`, `${L.th_zone} ${r.z}`);
    if (r.tipo === "secao") return lk(`${r.uf} ${T.w_zone} ${r.z} ${T.w_section} ${r.s}`, `${L.th_zone} ${r.z} · ${L.th_section} ${r.s}`);
    return esc(r.nome || "");
  }
  const nomeTxt = (r) => (r.tipo === "uf" ? `${r.uf} – ${A.ufNome(r.uf)}` : r.tipo === "mun" ? `${r.nome} (${r.uf})` : r.nome || "");
  // Pergunta que falta um dado: oferece as opções prontas
  async function faltando(txt, qs, extra) {
    S.parou = true;
    await pensar(X().think.guia);
    return escrever(`<p>${esc(txt)}</p>` + chipsQ(qs.map((x) => (Array.isArray(x) ? perg(x[0], x[1]) : perg(x)))) + (extra || ""));
  }
  function escopoTxt(uf, cod, nomeMun) {
    if (cod) return `${nomeMun} (${uf})`;
    if (uf) return `${A.ufNome(uf)} (${uf})`;
    return X().rk_br;
  }

  async function rankingResp(E, q) {
    const T = X(), L = t(), lg = E.lugar, nq = nz(q);
    if (lg.muns.length > 1 && new Set(lg.muns.map((m) => m.uf)).size > 1) return escolherMun(lg.muns, q);
    let uf = lg.uf || (lg.muns.length ? lg.muns[0].uf : null), cod = lg.muns.length ? lg.muns[0].cod : null;
    const nomeMun_ = lg.muns.length ? lg.muns[0].nome : "";
    let un = E.unidade;
    if (cod && (!un || un === "mun")) un = E.metrica === "sinal" || !E.metrica ? "zona" : "secao";
    if (!un) un = uf ? "mun" : E.br ? "uf" : null;
    if (un === "uf") { uf = null; cod = null; }
    if (!E.metrica) {
      const base = T.rk_base(un || "mun", uf, cod ? nomeMun_ : "");
      return faltando(T.rk_ask_metric, ["sinal", "comp", "abst", "bn"].map((k) => `${base} ${T.rk_frase[k](E.ordem || "desc")}`));
    }
    if (!un || (un === "mun" && !uf && !E.br)) {
      const fr = T.rk_frase[E.metrica] ? T.rk_frase[E.metrica](E.ordem || "desc", E.cand && A.titulo(E.cand.nome)) : "";
      return faltando(T.rk_ask_scope, [`${T.rk_base("mun", "PR")} ${fr}`, `${T.rk_base("mun", "SP")} ${fr}`, `${T.rk_base("uf")} ${fr}`, `${T.rk_base("mun", null, "", true)} ${fr}`]);
    }
    if ((un === "zona" || un === "secao") && !uf) return faltando(T.rk_ask_city, T.ex.municipio.slice(0, 3).map((c) => `${T.rk_base(un, null, c)} ${T.rk_frase[E.metrica] ? T.rk_frase[E.metrica](E.ordem || "desc") : ""}`));
    if (un === "secao" && !cod && !(E.sec && E.sec.z)) return faltando(T.rk_ask_city, T.ex.municipio.slice(0, 3).map((c) => `${T.rk_base("secao", null, c)} ${T.rk_frase[E.metrica] ? T.rk_frase[E.metrica](E.ordem || "desc") : ""}`));
    if (un === "zona" && !cod && E.metrica !== "sinal") return faltando(T.rk_ask_city_zone, T.ex.municipio.slice(0, 3).map((c) => `${T.rk_base("zona", null, c)} ${T.rk_frase[E.metrica](E.ordem || "desc")}`));
    const cand = E.cand;
    let n = E.turno || 2;
    if (cand && !turnoTem(n, cand.nr)) { if (E.turno) return faltando(T.rk_cand_round(A.titulo(cand.nome), L.round(n)), [q.replace(/2\S* turno|segundo turno/i, "") + " " + L.round(1)]); n = 1; }
    const opts = { unidade: un, uf, cod, z: E.sec && E.sec.z, metrica: E.metrica, turno: n, ordem: E.ordem || "desc", n: E.n || 10, nivel: E.nivel, taxa: E.taxa, abs: ABS.test(nq),
      cand: cand && cand.nr, candNome: cand && A.titulo(cand.nome), testes: (E.testes || []).filter((x) => !Q().TESTES_UF.includes(x)), op: E.op };
    const res = await pensar(T.think.rank, Q().ranking(opts));
    lembrar(ctxDe(E, { intencao: "ranking", unidade: un, turno: E.turno, lugar: cod ? { tipo: "mun", uf, cod, nome: nomeMun_ } : uf ? { tipo: "uf", uf, nome: A.ufNome(uf) } : E.br ? { tipo: "br" } : null }));
    if (!res.top.length) return escrever(`<p>${esc(T.rk_none)}</p>`, { q });
    // "mostra mais 10": continua de onde a lista parou
    const off = E.off || 0, fatia = res.todas.slice(off, off + Math.min(E.n || 10, 50));
    if (!fatia.length) { await pensarRapido(T.think.cv); return escrever(`<p>${esc(T.cv_rank_fim(nf(res.total)))}</p>`, { q, cmd: true }); }
    listar(res.todas.slice(0, off + fatia.length).map((x) => x.r));
    const M = res.M;
    let h = cab(esc(`${T.rk_unid[un]} · ${escopoTxt(uf, cod, nomeMun_)}`), esc(`${T.rk_ord(M.nome, opts.ordem)} · ${L.round(n)}`));
    h += `<p>${esc(off ? T.rk_lead_off(nf(off + 1), nf(off + fatia.length), nf(res.total), T.rk_unid[un].toLowerCase()) : T.rk_lead(nf(fatia.length), nf(res.total), T.rk_unid[un].toLowerCase()))}</p>`;
    if (opts.testes.length) h += `<p class="small">${esc(T.rk_tests(opts.testes.map((x) => `${A.numTeste(x)}. ${A.nomeTeste(x)}`).join(opts.op === "ou" ? " | " : " + ")))}</p>`;
    const barra = fatia.slice(0, 15);
    const max = Math.max(...barra.map((x) => Math.abs(x.v)), 1e-9);
    h += A.barras(barra.map((x) => ({ rotulo: nomeTxt(x.r), valor: Math.abs(x.v) / max, texto: M.txt(x.r, n), dica: `${nomeTxt(x.r)}\n${M.nome}: ${M.txt(x.r, n)}` })));
    const comSinal = M.k === "sinal";
    h += tabela(["#", T.rk_th_nome, M.nome, L.st_secoes].concat(comSinal ? [] : [T.rk_th_flag]),
      fatia.map((x, i) => [String(off + i + 1), nomeLinha(x.r), esc(M.txt(x.r, n)), x.r.sec == null ? "—" : nf(x.r.sec)].concat(comSinal ? [] : [nf(x.r.sn[n].a)])), "num-cols at-rank");
    if (res.soSinal) h += `<p class="small muted">${esc(T.rk_only_flags)}</p>`;
    if (M.pct && un !== "uf") h += `<p class="small muted">${esc(T.rk_note_pct)}</p>`;
    h += `<p class="small muted">${esc(comSinal ? T.sg_note : T.rk_note)}</p>`;
    // destaque: quem lidera e a mediana; sugestão: comparar os dois primeiros ou ver por que a 1ª seção foi sinalizada
    const meio = res.todas[Math.floor((res.todas.length - 1) / 2)], t0 = res.todas[0], t1 = res.todas[1];
    if (!off && res.total >= 3) h += obsHtml([T.ob_rk(nomeTxt(t0.r) || t0.r.nome, M.txt(t0.r, n), M.txt(meio.r, n), nf(res.total))]);
    if (t1 && (t0.r.tipo === "mun" || t0.r.tipo === "uf")) h += oferecer(T.of_rk_cmp(nomeTxt(t0.r), nomeTxt(t1.r)), `${rotRef(t0.r)} x ${rotRef(t1.r)}`);
    else if (t0.r.tipo === "secao" && t0.r.sn[n].a + t0.r.sn[n].i > 0) h += oferecer(T.of_pq_1, T.pq_q(t0.r.uf, t0.r.z, t0.r.s, n));
    h += botoes([comSinal ? ir(`#/lista?t=${n}${uf ? "&uf=" + uf : ""}${cod ? "&mun=" + cod : ""}${E.nivel ? "&nivel=" + E.nivel : ""}`, "list", T.open_list) : "", ir(uf ? `#/uf/${uf}` : "#/mapa", "map", uf ? T.open_uf : L.nav.map)]);
    h += fonte(T.src_site);
    return escrever(h, { q });
  }

  // Linhas da comparação: o que cada lugar tem, lado a lado
  function linhasComparacao(rs) {
    const L = t(), T = X(), out = [];
    const pctOu = (a, b) => (b ? pct(a / b) : "—");
    const linha = (rot, f) => out.push([esc(rot)].concat(rs.map((r) => { try { return f(r); } catch (e) { return "—"; } })));
    linha(L.st_secoes, (r) => nf(r.sec));
    [2, 1].forEach((n) => {
      out.push([`<b>${esc(L.round(n))}</b>`].concat(rs.map(() => "")));
      linha(L.lk_aptos, (r) => nf(r.t[n].aptos));
      linha(L.lk_comp, (r) => `${pctOu(r.t[n].comp, r.t[n].aptos)} · ${nf(r.t[n].comp)}`);
      linha(L.lk_abst, (r) => pctOu(r.t[n].aptos - r.t[n].comp, r.t[n].aptos));
      const nomes = nomesTurno(n);
      const cands = R().ordem_votos[n].filter((nr) => nr !== "95" && nr !== "96").slice(0, n === 1 ? 4 : 2);
      cands.forEach((nr) => linha(`${A.titulo(nomes[nr] || nr)} (${nr})`, (r) => `${pctOu(r.t[n].v[nr] || 0, Q().validos(r.t[n]))} · ${nf(r.t[n].v[nr] || 0)}`));
      linha(L.blank, (r) => `${pctOu(r.t[n].v["95"] || 0, r.t[n].comp)}`);
      linha(L.null_, (r) => `${pctOu(r.t[n].v["96"] || 0, r.t[n].comp)}`);
      linha(T.cp_flag_a, (r) => (r.tipo === "secao" ? (r.sn[n].a ? A.chip("red", L.lv_a) : r.sn[n].i ? A.chip("amber", L.lv_i) : A.chip("green", L.lk_noflags)) : `${nf(r.sn[n].a)}${r.sec ? ` · ${nf(Math.round((r.sn[n].a / r.sec) * 10000) / 10)} ${t().cq_per1000}` : ""}`));
    });
    return out;
  }
  async function compararResp(E, q) {
    const T = X(), L = t();
    let alvos = [];
    if (E.secs && E.secs.length >= 2) {
      if (E.secs.some((x) => !x.uf)) return faltando(T.need_uf_sec, [E.secs.map((x) => `PR ${T.w_zone} ${x.z} ${T.w_section} ${x.s}`).join(" x ")]);
      alvos = E.secs.slice(0, 4).map((x) => ({ tipo: "secao", uf: x.uf, z: x.z, s: x.s }));
    } else {
      const amb = (E.lugares || []).find((x) => x.alternativas);
      if (amb) return faltando(T.cp_pick(amb.nome), amb.alternativas.map((m) => [q.replace(new RegExp(amb.trecho.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `${m.nome} ${m.uf}`), `${m.nome} (${m.uf})`]));
      alvos = (E.lugares || []).filter((x) => !x.alternativas).slice(0, 4);
      const ctx = ctxAtual();
      const igual = (a, b) => a.tipo === b.tipo && a.uf === b.uf && a.cod === b.cod;
      if (alvos.length === 1 && ctx && ctx.lugar && !igual(ctx.lugar, alvos[0])) alvos.unshift(ctx.lugar);
      if (alvos.length < 2) {
        const um = alvos[0];
        const nome = um ? (um.tipo === "uf" ? A.ufNome(um.uf) : um.tipo === "mun" ? `${um.nome} ${um.uf}` : T.br_name) : "";
        const outra = (l) => l.find((x) => nz(x) !== nz(um.nome || ""));
        const sug = um && um.tipo === "mun" ? [`${nome} x ${outra(["Curitiba", "Londrina"])}`, `${nome} x ${outra(["São Paulo", "Campinas"])}`]
          : um && um.tipo === "uf" ? [`${A.ufNome(um.uf)} x ${um.uf === "SP" ? "Paraná" : "São Paulo"}`, `${A.ufNome(um.uf)} x ${T.br_name}`] : T.ex.comparar;
        return faltando(T.cp_ask, sug);
      }
    }
    const rs = (await pensar(T.think.comp, Promise.all(alvos.map((x) => Q().linhaLugar(x))))).filter(Boolean);
    lembrar(ctxDe(E, { intencao: "comparar", lugares: alvos.filter((x) => x.tipo !== "secao"), lugar: alvos[alvos.length - 1].tipo !== "secao" ? alvos[alvos.length - 1] : null }));
    if (rs.length < 2) return escrever(`<p>${esc(T.cp_none)}</p>`, { q });
    const nome = (r) => (r.tipo === "secao" ? r.nome : nomeTxt(r) || (r.tipo === "br" ? T.br_name : ""));
    let h = cab(esc(T.cp_title(rs.map(nome).join(" × "))), esc(L.cd_pres));
    h += A.tabela([""].concat(rs.map((r) => (r.tipo === "br" ? esc(T.br_name) : nomeLinha(r)))), linhasComparacao(rs), "num-cols at-comp");
    [2, 1].forEach((n) => {
      const nomes = nomesTurno(n), cands = R().ordem_votos[n].filter((nr) => nr !== "95" && nr !== "96").slice(0, 2);
      h += `<h4 class="at-t">${esc(L.round(n))} · ${esc(T.cp_bars)}</h4>`;
      h += A.barras(cands.flatMap((nr) => rs.map((r) => { const v = (r.t[n].v[nr] || 0) / (Q().validos(r.t[n]) || 1); return { rotulo: `${A.titulo(nomes[nr] || nr)} · ${nome(r)}`, valor: v, texto: pct(v), dica: `${nome(r)}\n${A.titulo(nomes[nr] || nr)} (${nr}): ${pct(v)} ${L.valid}` }; })));
    });
    h += `<h4 class="at-t">${esc(L.lk_comp)}</h4>` + A.barras(rs.map((r) => { const v = r.t[2].comp / (r.t[2].aptos || 1); return { rotulo: nome(r), valor: v, texto: pct(v), dica: `${nome(r)}\n${L.lk_comp}: ${pct(v)} (${L.round(2)})` }; }));
    h += `<p class="small muted">${esc(T.sg_note)}</p>`;
    listar(alvos);
    const cs = rs.filter((r) => r.t[2] && r.t[2].aptos).map((r) => ({ r, v: r.t[2].comp / r.t[2].aptos })).sort((a, b) => b.v - a.v);
    if (cs.length >= 2) h += obsHtml([T.ob_cp(nome(cs[0].r), pct(cs[0].v, 1), nome(cs[cs.length - 1].r), pct(cs[cs.length - 1].v, 1), A.nf(Math.round((cs[0].v - cs[cs.length - 1].v) * 1000) / 10))]);
    const rel = alvos.find((x) => x.tipo === "mun" || x.tipo === "uf");
    if (rel) h += oferecer(T.of_rel(nomeRef(rel)), `${T.rl_word} ${rotRef(rel)}`);
    h += botoes(rs.filter((r) => r.tipo !== "br").map((r) => ir(r.tipo === "uf" ? `#/uf/${r.uf}` : r.tipo === "mun" ? `#/uf/${r.uf}/${r.cod}` : `#/secao/${r.uf}/${r.z}/${r.s}`, "arrow", nome(r))));
    h += fonte(T.src_site);
    return escrever(h, { q });
  }

  const MAX_FILTRO = 100;
  function alvoFiltro(E) {
    const lg = E.lugar;
    if (lg.muns.length === 1 || (lg.muns.length && new Set(lg.muns.map((m) => m.uf)).size === 1)) return { uf: lg.muns[0].uf, cod: lg.muns[0].cod, nome: `${lg.muns[0].nome} (${lg.muns[0].uf})` };
    if (E.sec && E.sec.z && E.sec.uf) return { uf: E.sec.uf, z: E.sec.z, nome: `${E.sec.uf} · ${t().th_zone} ${E.sec.z}` };
    if (lg.uf) return { uf: lg.uf, nome: A.ufNome(lg.uf) };
    if (E.br) return { nome: X().br_name };
    return null;
  }
  async function filtroResp(E, q) {
    const T = X(), L = t(), lg = E.lugar;
    if (lg.muns.length > 1 && new Set(lg.muns.map((m) => m.uf)).size > 1) return escolherMun(lg.muns, q);
    const alvo = alvoFiltro(E);
    if (!alvo) return faltando(T.ft_ask_place, [`${q} ${T.w_in} Curitiba`, `${q} ${T.w_in} ${A.ufNome("SP")}`, `${q} ${T.w_in} ${T.br_name}`]);
    const estaduais = (E.testes || []).filter((x) => Q().TESTES_UF.includes(x)), testes = (E.testes || []).filter((x) => !Q().TESTES_UF.includes(x));
    if (estaduais.length && !testes.length) {
      await pensar(T.think.guia);
      return escrever(`<p>${esc(T.ft_state_tests)}</p>` + botoes(estaduais.map((x) => ir(`#/lista?teste=${x}${alvo.uf ? "&uf=" + alvo.uf : ""}`, "list", `${A.numTeste(x)}. ${A.nomeTeste(x)}`))), { q });
    }
    const f = { uf: alvo.uf, cod: alvo.cod, z: alvo.z, turno: E.turno || 0, testes, op: E.op, nivel: E.nivel };
    const l = await pensar(T.think.filtro, Q().filtrar(f));
    lembrar(ctxDe(E, { intencao: "filtro" }));
    const nomeT = testes.length ? testes.map((x) => `${A.numTeste(x)}. ${A.nomeTeste(x)}`).join(E.op === "ou" ? ` ${T.w_or} ` : ` ${T.w_and} `) : E.nivel === "a" ? L.lv_a : E.nivel === "i" ? L.lv_i : T.ft_any;
    let h = cab(esc(T.ft_title(alvo.nome)), esc(`${nomeT}${f.turno ? " · " + L.round(f.turno) : ""}`));
    if (!l.length) {
      h += `<p>${A.chip("green", T.ft_none)}</p>`;
      if (testes.length > 1 && E.op !== "ou") h += `<p class="small muted">${esc(T.ft_try_or)}</p>` + chipsQ([perg(q.replace(/\s(e|and|y)\s/i, ` ${T.w_or} `))]);
      return escrever(h + fonte(T.src_site), { q });
    }
    const por = { 1: l.filter((x) => x.n === 1).length, 2: l.filter((x) => x.n === 2).length };
    h += `<p>${esc(T.ft_lead(nf(l.length)))}</p><p>${[2, 1].filter((n) => !f.turno || f.turno === n).map((n) => A.chip(por[n] ? "red" : "green", `${L.round(n)}: ${nf(por[n])}`)).join(" ")}</p>`;
    if (estaduais.length) h += `<p class="small muted">${esc(T.ft_state_tests)}</p>`;
    const mostra = l.slice(0, MAX_FILTRO);
    h += tabela([L.th_uf, L.th_mun, L.th_zone, L.th_section, T.th_round, T.ft_th_tests, ""], mostra.map((x) => [esc(x.uf), esc(x.mun), x.z, x.s, `${x.n}º`,
      x.testes.map((id) => A.chip(x.a ? "red" : "amber", String(A.numTeste(id)))).join(" "), lk(T.pq_q(x.uf, x.z, x.s, x.n), T.ft_why)]), "num-cols at-filtro");
    if (l.length > MAX_FILTRO) h += `<p class="small muted">${esc(T.ft_more(nf(MAX_FILTRO), nf(l.length)))}</p>`;
    h += `<p class="small muted">${esc(T.sg_note)}</p>`;
    listar(mostra.map((x) => ({ tipo: "secao", uf: x.uf, z: x.z, s: x.s })));
    if (l.length >= 3 && !f.z) {
      const pz = {}; l.forEach((x) => { const k = x.uf + " " + x.z; pz[k] = (pz[k] || 0) + 1; });
      const [zk, zn] = Object.entries(pz).sort((a, b) => b[1] - a[1])[0];
      if (zn >= 2) h += obsHtml([T.ob_ft_zona(zk.split(" ")[1], nf(zn), nf(l.length))]);
    }
    h += oferecer(T.of_pq_1, T.pq_q(l[0].uf, l[0].z, l[0].s, l[0].n));
    h += botoes([`<button type="button" class="btn btn-sm" data-at-filtro="${esc(JSON.stringify(f))}">${icone("download")} ${esc(T.ft_csv(nf(l.length)))}</button>`,
      ir(`#/lista?${[f.turno ? "t=" + f.turno : "", f.uf ? "uf=" + f.uf : "", f.cod ? "mun=" + f.cod : "", f.z ? "z=" + f.z : "", testes.length === 1 ? "teste=" + testes[0] : "", E.nivel ? "nivel=" + E.nivel : ""].filter(Boolean).join("&")}`, "list", T.open_list)]);
    h += fonte(T.src_site);
    return escrever(h, { q });
  }
  async function csvFiltro(f) {
    const L = t(), T = X(), l = await Q().filtrar(f);
    baixar(`atlas-secoes-${slug([f.uf, f.cod, f.z].filter(Boolean).join(" ") || "brasil")}-${hoje()}.csv`, csv([[L.th_uf, T.th_cod, L.th_mun, L.th_zone, L.th_section, T.th_round, T.ft_th_level, T.ft_th_tests]]
      .concat(l.map((x) => [x.uf, x.cod, x.mun, x.z, x.s, x.n, x.a ? L.lv_a : L.lv_i, x.testes.map((id) => `${A.numTeste(id)}. ${A.nomeTeste(id)}`).join(" | ")]))
      .concat([[], [L.badge, URL_SITE]])), "text/csv;charset=utf-8");
  }

  // Mapa: estado (municípios) ou Brasil (estados), pintado pela taxa de seções com anomalia
  async function blocoMapa(uf, n, destaque) {
    const T = X(), L = t();
    if (uf === "ZZ") return "";
    if (uf) {
      const ms = await Q().municipiosUf(uf, {});
      const val = {}, por = {}; ms.forEach((m) => { val[m.cod] = m.sec ? m.sn[n].a / m.sec : 0; por[m.cod] = m; });
      return Q().mapa({ uf, valor: val, destaque, titulo: T.mp_t(A.ufNome(uf)), legenda: T.mp_leg(L.round(n)), nome: (k) => (por[k] ? por[k].nome : k),
        dica: (k, v) => (por[k] ? `${por[k].nome}\n${L.mp_tip(nf(por[k].sn[n].a), nf(por[k].sec), pct(v, 2))}` : k) });
    }
    const es = await Q().estados({});
    const val = {}, por = {}; es.forEach((u) => { val[u.uf] = u.sec ? u.sn[n].a / u.sec : 0; por[u.uf] = u; });
    return Q().mapa({ valor: val, destaque, titulo: T.mp_t(T.br_name), legenda: T.mp_leg(L.round(n)), nome: (k) => A.ufNome(k),
      dica: (k, v) => (por[k] ? `${A.ufNome(k)} (${k})\n${L.mp_tip(nf(por[k].sn[n].a), nf(por[k].sec), pct(v, 2))}` : k) });
  }
  async function mapaResp(E, q) {
    const T = X(), L = t(), lg = E.lugar, n = E.turno || 2;
    if (lg.muns.length > 1 && new Set(lg.muns.map((m) => m.uf)).size > 1) return escolherMun(lg.muns, q);
    const m = lg.muns[0], uf = m ? m.uf : lg.uf;
    const h0 = await pensar(T.think.mapa, blocoMapa(uf, n, m ? m.cod : null));
    lembrar(ctxDe(E, { intencao: "mapa" }));
    let h = cab(esc(T.mp_t(m ? `${m.nome} (${m.uf})` : uf ? A.ufNome(uf) : T.br_name)), esc(`${L.round(n)} · ${L.roundDate[n]}`), m ? `#/uf/${m.uf}/${m.cod}` : uf ? `#/uf/${uf}` : "#/mapa");
    h += `<p>${esc(m ? T.mp_lead_mun(m.nome) : uf ? T.mp_lead_uf : T.mp_lead_br)}</p>` + h0;
    h += `<p class="small muted">${esc(T.mp_note)}</p>`;
    h += botoes([ir(uf ? `#/uf/${uf}` : "#/mapa", "map", uf ? T.open_uf : L.nav.map), m ? ir(`#/uf/${m.uf}/${m.cod}`, "pin", T.open_mun) : "", n === 2 ? `<button type="button" class="btn btn-sm" data-q="${esc(`${q} ${L.round(1)}`)}">${icone("map")} ${esc(L.round(1))}</button>` : ""]);
    h += fonte(T.src_site);
    return escrever(h, { q });
  }

  // "Por que esta seção foi sinalizada?": cada teste que deu sinal, com o objetivo, o critério e os números da seção
  async function porque(E, q) {
    const T = X(), L = t(), ctx = ctxAtual();
    let sec = E.sec && E.sec.z && E.sec.s ? E.sec : null;
    if (sec && !sec.uf && ctx && ctx.sec) sec = Object.assign({}, sec, { uf: ctx.sec.uf });
    if (!sec && ctx && ctx.sec && ctx.sec.s) sec = ctx.sec;
    if (!sec || !sec.uf) return faltando(T.pq_ask, [T.pq_q("PR", 3, 50), T.pq_q("SP", 1, 5)]);
    const trab = (async () => {
      const d = await A.consultarSecao(sec.uf, sec.z, sec.s);
      if (!d.rec) return { d };
      const U = await ext().dado(`site/data/ufs/${d.uf}.json`);
      return { d, mun: U.m[d.mun[0]] };
    })();
    const { d, mun } = await pensar(T.think.porque, trab);
    lembrar(ctxDe(E, { intencao: "porque", sec: { uf: sec.uf, z: sec.z, s: sec.s }, lugar: { tipo: "uf", uf: sec.uf, nome: A.ufNome(sec.uf) } }));
    if (!d.rec) return escrever(htmlSecao(d), { q });
    const rec = d.rec, flags = rec[3] || {}, nomeM = A.titulo(d.mun[1]);
    const turnos = [2, 1].filter((n) => !E.turno || E.turno === n).filter((n) => flags[String(n)] && flags[String(n)].o.length);
    let h = cab(`${esc(d.uf)} · ${esc(nomeM)} · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s}`, esc(T.pq_title), `#/secao/${d.uf}/${d.z}/${d.s}`);
    if (!turnos.length) {
      h += `<p>${A.chip("green", T.pq_none)}</p>` + botoes([ir(`#/secao/${d.uf}/${d.z}/${d.s}`, "search", T.open_sec)]) + fonte(L.bot_sec_src);
      return escrever(h, { q });
    }
    const TT = R().testes_txt[A.state.lang];
    turnos.forEach((n) => {
      const tv = rec[n], f = flags[String(n)];
      const { v, nomes } = A.votosTurno(n, tv);
      const val = Object.keys(v).reduce((a, nr) => a + (nr === "95" || nr === "96" ? 0 : v[nr]), 0) || 1;
      const mt = mun && mun[n + 1], mv = mt ? votosObj(n, mt[2]) : null;
      const mval = mv ? Object.keys(mv).reduce((a, nr) => a + (nr === "95" || nr === "96" ? 0 : mv[nr]), 0) || 1 : 1;
      const top = Object.keys(v).filter((nr) => nr !== "95" && nr !== "96").sort((a, b) => v[b] - v[a])[0];
      h += `<h4 class="at-t">${esc(L.round(n))} <span class="muted small">${esc(L.roundDate[n])}</span></h4>`;
      const vistos = new Set();
      f.o.forEach((o) => {
        const id = o[0], tx = TT[id] || {};
        const nums = [];
        const k2 = id + o[2]; if (vistos.has(k2)) return; vistos.add(k2);
        if (id === "T03") nums.push([`${A.titulo(nomes[top] || top)} (${top})`, `${nf(v[top])} · ${pct(v[top] / val)} ${L.valid}`], [T.pq_valid, nf(val)]);
        else if (id === "T04") nums.push([L.lk_aptos, nf(tv[0])], [L.lk_comp, `${nf(tv[1])} (${pct(tv[1] / (tv[0] || 1), 1)})`], mt ? [T.pq_ref_mun(nomeM), pct(mt[1] / (mt[0] || 1), 1)] : null);
        else if (id === "T05") { const b = (v["95"] || 0) + (v["96"] || 0); nums.push([T.pq_bn, `${nf(b)} · ${pct(b / (tv[1] || 1))}`], mv ? [T.pq_ref_mun(nomeM), pct(((mv["95"] || 0) + (mv["96"] || 0)) / (mt[1] || 1))] : null); }
        else if (id === "T08") nums.push([`${A.titulo(nomes[top] || top)} (${top})`, `${pct(v[top] / val)} ${L.valid}`], mv ? [T.pq_ref_mun(nomeM), `${pct((mv[top] || 0) / mval)} ${L.valid}`] : null);
        else if (id === "T11") nums.push([L.lk_open, A.hora(tv[2])], [L.lk_close, A.hora(tv[3])]);
        else if (id === "T12" && f.u) nums.push([T.pq_urna, esc(L.lk_urna(f.u, f.c, f.l))]);
        const linhas = nums.filter(Boolean);
        h += `<div class="at-card at-pq"><p>${A.chip(o[1] === "a" ? "red" : "amber", o[1] === "a" ? L.lv_a : L.lv_i)} <b>${A.numTeste(id)}. ${esc(A.nomeTeste(id))}</b> <span class="small muted">· ${esc((R().categorias[o[2]] || {})[A.state.lang] || o[2])}</span></p>
          ${tx.objetivo ? `<p class="small"><b>${esc(T.pq_obj)}:</b> ${esc(tx.objetivo)}</p>` : ""}${tx.criterio ? `<p class="small"><b>${esc(T.pq_crit)}:</b> ${esc(tx.criterio)}</p>` : ""}
          ${linhas.length ? `<p class="small"><b>${esc(T.pq_nums)}:</b></p>${kv(linhas)}` : `<p class="small muted">${esc(T.pq_nodata)}</p>`}</div>`;
      });
    });
    h += `<p class="small muted">${esc(T.sg_note)}</p>`;
    h += botoes([ir(`#/secao/${d.uf}/${d.z}/${d.s}`, "search", T.open_sec), `<button type="button" class="btn btn-sm" data-at-fn="qr">${icone("qr")} ${esc(T.fn.qr[0])}</button>`,
      S.con.tse ? `<button type="button" class="btn btn-sm" data-at-tsesec="${esc(JSON.stringify({ uf: d.uf, z: d.z, s: d.s }))}">${icone("shield")} ${esc(T.tse_files)}</button>` : "", ir("#/testes", "list", L.nav.tests)]);
    h += fonte(`${L.bot_sec_src} · ${T.pq_src}`);
    return escrever(h, { q });
  }

  // Relatório completo de um município ou estado, pronto para exportar em qualquer formato
  async function relatorioResp(E, q) {
    const T = X(), L = t(), lg = E.lugar, ctx = ctxAtual();
    if (lg.muns.length > 1 && new Set(lg.muns.map((m) => m.uf)).size > 1) return escolherMun(lg.muns, q);
    let m = lg.muns[0], uf = m ? m.uf : lg.uf;
    if (!m && !uf && ctx && ctx.lugar && E.minha !== true) { if (ctx.lugar.tipo === "mun") { m = ctx.lugar; uf = m.uf; } else if (ctx.lugar.tipo === "uf") uf = ctx.lugar.uf; }
    if (!m && !uf) return faltando(T.rl_ask, (ctx && ctx.lugar && ctx.lugar.tipo === "mun" ? [`${T.rl_word} ${ctx.lugar.nome} ${ctx.lugar.uf}`] : []).concat(T.ex.municipio.slice(0, 3).map((c) => `${T.rl_word} ${c}`)));
    if (m) return relatorioMun(m, E, q);
    return relatorioUf(uf, E, q);
  }
  async function relatorioMun(m, E, q) {
    const T = X(), L = t();
    const trab = (async () => {
      const [U, zs, pos2, pos1, secs, mapa] = await Promise.all([ext().dado(`site/data/ufs/${m.uf}.json`), Q().zonas(m.uf, m.cod, {}), Q().posicao(m.uf, m.cod, 2), Q().posicao(m.uf, m.cod, 1),
        Q().filtrar({ uf: m.uf, cod: m.cod }), blocoMapa(m.uf, 2, m.cod).catch(() => "")]);
      const ib = S.con.ibge && m.uf !== "ZZ" ? await ibge(m).catch((e) => ({ erro: e.message })) : null;
      return { x: U.m[m.cod], zs, pos2, pos1, secs, mapa, ib };
    })();
    const r = await pensar(T.think.relat, trab);
    lembrar(ctxDe(E, { intencao: "relatorio", lugar: Object.assign({ tipo: "mun" }, m) }));
    if (!r.x) return escrever(`<p>${esc(L.mu_none)}</p>`, { q });
    const x = r.x;
    let h = cab(esc(T.rl_title(`${m.nome} (${m.uf})`)), esc(`${A.ufNome(m.uf)} · ${T.rl_kicker}`), `#/uf/${m.uf}/${m.cod}`);
    h += `<p>${esc(T.mun_lead(nf(x[0]), x[1].length, x[1].join(", ")))}</p>`;
    const a2 = r.secs.filter((s) => s.n === 2 && s.a).length, a1 = r.secs.filter((s) => s.n === 1 && s.a).length;
    h += `<h4 class="at-t">${esc(T.rl_resumo)}</h4>` + kv([[T.rl_pos(L.round(2)), esc(T.rl_pos_v(r.pos2.pos, r.pos2.total, pct(r.pos2.taxa, 2)))], [T.rl_pos(L.round(1)), esc(T.rl_pos_v(r.pos1.pos, r.pos1.total, pct(r.pos1.taxa, 2)))],
      [`${T.cp_flag_a} · ${L.round(2)}`, nf(a2)], [`${T.cp_flag_a} · ${L.round(1)}`, nf(a1)]]);
    [2, 1].forEach((n) => { const tv = x[n + 1]; if (tv) h += blocoTurno(n, tv[0], tv[1], tv[2]); });
    if (r.mapa) h += `<h4 class="at-t">${esc(T.mp_t(A.ufNome(m.uf)))}</h4>` + r.mapa;
    if (r.zs.length) {
      h += `<h4 class="at-t">${esc(T.rl_zonas)}</h4>`;
      h += tabela([L.th_zone, L.st_secoes, `${L.lk_comp} · ${L.round(2)}`, `${T.cp_flag_a} · ${L.round(2)}`, `${T.cp_flag_a} · ${L.round(1)}`],
        r.zs.sort((a, b) => a.z - b.z).map((z) => [lk(`${m.uf} ${T.w_zone} ${z.z}`, String(z.z)), nf(z.sec), z.t[2] ? pct(z.t[2].comp / (z.t[2].aptos || 1), 1) : "—", nf(z.sn[2].a), nf(z.sn[1].a)]), "num-cols");
    }
    if (r.secs.length) {
      h += `<h4 class="at-t">${esc(T.rl_secs(nf(r.secs.length)))}</h4>`;
      h += tabela([L.th_zone, L.th_section, T.th_round, T.ft_th_tests, ""], r.secs.slice(0, 40).map((s) => [s.z, s.s, `${s.n}º`, s.testes.map((id) => A.chip(s.a ? "red" : "amber", String(A.numTeste(id)))).join(" "), lk(T.pq_q(s.uf, s.z, s.s, s.n), T.ft_why)]), "num-cols");
      if (r.secs.length > 40) h += `<p class="small muted">${esc(T.ft_more("40", nf(r.secs.length)))}</p>`;
    } else h += `<p>${A.chip("green", T.rl_nosecs)}</p>`;
    if (r.ib) h += blocoIbge(r.ib, m);
    h += `<p class="small muted">${esc(T.sg_note)}</p>`;
    if (r.secs.length) listar(r.secs.slice(0, 40).map((x) => ({ tipo: "secao", uf: x.uf, z: x.z, s: x.s })));
    h += oferecer(T.of_rl_pdf, T.of_q_pdf);
    h += botoes([`<button type="button" class="btn btn-sm btn-primary" data-at-exp>${icone("download")} ${esc(T.rl_export)}</button>`, ir(`#/uf/${m.uf}/${m.cod}`, "pin", T.open_mun),
      ir(`#/lista?uf=${m.uf}&mun=${m.cod}`, "list", T.open_list), ir(`#/variacao/${m.uf}/${m.cod}`, "swap", T.open_var)]);
    h += fonte(T.src_site + (r.ib && !r.ib.erro && !r.ib.semMatch ? " · IBGE" : ""));
    return escrever(h, { q });
  }
  async function relatorioUf(uf, E, q) {
    const T = X(), L = t();
    const trab = Promise.all([ext().dado(`site/data/ufs/${uf}.json`), Q().ranking({ unidade: "mun", uf, metrica: "sinal", turno: 2, ordem: "desc", n: 15 }), Q().filtrar({ uf }), blocoMapa(uf, 2, null).catch(() => "")]);
    const [U, rk, secs, mapa] = await pensar(T.think.relat, trab);
    lembrar(ctxDe(E, { intencao: "relatorio", lugar: { tipo: "uf", uf, nome: A.ufNome(uf) } }));
    const ms = Object.values(U.m), tot = { 1: null, 2: null };
    ms.forEach((mm) => [1, 2].forEach((n) => { const x = mm[n + 1]; if (!x) return; if (!tot[n]) tot[n] = [0, 0, x[2].map(() => 0)]; tot[n][0] += x[0]; tot[n][1] += x[1]; x[2].forEach((v, i) => { tot[n][2][i] += v; }); }));
    let h = cab(esc(T.rl_title(`${A.ufNome(uf)} (${uf})`)), esc(T.rl_kicker), `#/uf/${uf}`);
    h += `<p>${esc(T.uf_lead(nf(ms.reduce((a, mm) => a + mm[0], 0)), nf(ms.length)))}</p>`;
    h += `<h4 class="at-t">${esc(T.rl_resumo)}</h4>` + kv([[`${T.cp_flag_a} · ${L.round(2)}`, nf(secs.filter((s) => s.n === 2 && s.a).length)], [`${T.cp_flag_a} · ${L.round(1)}`, nf(secs.filter((s) => s.n === 1 && s.a).length)],
      [T.rl_muns_flag, nf(rk.todas.filter((x) => x.v > 0).length)]]);
    [2, 1].forEach((n) => { if (tot[n]) h += blocoTurno(n, tot[n][0], tot[n][1], tot[n][2]); });
    if (mapa) h += `<h4 class="at-t">${esc(T.mp_t(A.ufNome(uf)))}</h4>` + mapa;
    const top = rk.top.filter((x) => x.v > 0);
    if (top.length) {
      h += `<h4 class="at-t">${esc(T.rl_top_mun)}</h4>`;
      h += tabela(["#", T.rk_th_nome, rk.M.nome, L.st_secoes], top.map((x, i) => [String(i + 1), nomeLinha(x.r), esc(rk.M.txt(x.r, 2)), nf(x.r.sec)]), "num-cols");
    }
    h += `<p class="small muted">${esc(T.sg_note_uf)}</p>`;
    if (top.length) listar(top.map((x) => x.r));
    h += oferecer(T.of_rl_pdf, T.of_q_pdf);
    h += botoes([`<button type="button" class="btn btn-sm btn-primary" data-at-exp>${icone("download")} ${esc(T.rl_export)}</button>`, ir(`#/uf/${uf}`, "pin", T.open_uf), ir(`#/lista?uf=${uf}`, "list", T.open_list), ir(`#/variacao/${uf}`, "swap", T.open_var)]);
    h += fonte(T.src_site);
    return escrever(h, { q });
  }

  // Roteiro do cidadão: passos com caixa de marcar; o progresso fica só neste aparelho
  const CH_RT = "atlas_roteiro";
  const rtFeitos = () => new Set(lerJ(CH_RT, []));
  async function roteiro(q) {
    const T = X();
    await pensar(T.think.guia);
    lembrar({ intencao: "roteiro" });
    const passos = T.rt_steps, feitos = rtFeitos();
    const acao = {
      achar: chipsQ([perg(T.ex.secao[0])]),
      consultar: botoes([`<button type="button" class="btn btn-sm" data-at-fn="secao">${icone("search")} ${esc(T.fn.secao[0])}</button>`]),
      qr: botoes([btnArq("foto"), podeCamera ? btnArq("camera") : "", ir("#/boletim", "qr", t().nav.ballot || T.fn.qr[0])]),
      arquivos: botoes([btnCon(), `<button type="button" class="btn btn-sm" data-at-arq="hash">${icone("hash")} ${esc(T.up.hash[0])}</button>`]),
      porque: chipsQ([perg(T.pq_q("PR", 3, 50))]),
      comparar: chipsQ([perg(T.ex.comparar[0]), perg(T.ex.ranking[0])]),
      relatorio: chipsQ([perg(`${T.rl_word} Curitiba`)]),
      reportar: botoes([`<a class="btn btn-sm" href="${A.REPO}/issues/new" target="_blank" rel="noopener">${icone("code")} GitHub</a>`, `<a class="btn btn-sm" href="${A.TELEGRAM}" target="_blank" rel="noopener">${icone("tg")} Telegram</a>`]),
    };
    let h = cab(esc(T.rt_title), "") + `<p>${esc(T.rt_lead)}</p><ol class="at-rt">`;
    passos.forEach(([k, tit, txt]) => {
      h += `<li class="at-rt-p${feitos.has(k) ? " ok" : ""}" data-rt-p="${k}"><label class="at-chk"><input type="checkbox" data-rt="${k}"${feitos.has(k) ? " checked" : ""}> <b>${esc(tit)}</b></label><p class="small">${esc(txt)}</p>${acao[k] || ""}</li>`;
    });
    h += `</ol><p class="small at-rt-prog" aria-live="polite">${esc(T.rt_prog(passos.filter(([k]) => feitos.has(k)).length, passos.length))}</p><p class="small muted">${esc(T.rt_note)}</p>`;
    return escrever(h, { q, fn: "roteiro" });
  }
  // Marca as caixas do roteiro (respostas antigas mostram o progresso atual)
  function sincronizarRoteiro(d) {
    const feitos = rtFeitos(), T = X(), ps = d.querySelectorAll("[data-rt]");
    if (!ps.length) return;
    ps.forEach((c) => { c.checked = feitos.has(c.dataset.rt); c.closest(".at-rt-p").classList.toggle("ok", c.checked); });
    const p = d.querySelector(".at-rt-prog"); if (p) p.textContent = T.rt_prog([...ps].filter((c) => c.checked).length, ps.length);
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
    let h = cab(`${esc(d.uf)} · ${esc(A.titulo(d.mun[1]))} · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s}`, esc(T.tse_files), `#/secao/${d.uf}/${d.z}/${d.s}`);
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
    inp.multiple = k === "foto" || k === "hash" || k === "arquivo";
    // "arquivo": o tipo é identificado pelo conteúdo, como ao arrastar
    inp.dataset.tipo = k === "arquivo" ? "" : k;
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
  // resumo (opcional) recebe { difs, iguais, local } para a tabela de vários boletins
  async function compararBU(r, origem, resumo) {
    const L = t(), T = X();
    resumo = resumo || {};
    resumo.local = r.uf ? `${r.uf} · ${L.th_zone} ${r.z} · ${L.th_section} ${r.s} · ${L.round(r.turno === 1 ? 1 : 2)}` : "—";
    if (!r.uf || !(r.z > 0) || !(r.s > 0)) { resumo.erro = T.qr_noloc; return `<p>${esc(T.qr_noloc)}</p>`; }
    const d = await A.consultarSecao(r.uf, r.z, r.s), n = r.turno === 1 ? 1 : 2;
    if (d.erro) { resumo.erro = d.erro === "zona" ? L.lk_nozone : L.lk_nosec; return `<p>${esc(resumo.erro)}</p>`; }
    const tv = d.rec[n];
    if (!tv) { resumo.erro = L.lk_nodata; return `<p>${esc(L.lk_nodata)}</p>`; }
    resumo.local = `${d.uf} · ${A.titulo(d.mun[1])} · ${L.th_zone} ${d.z} · ${L.th_section} ${d.s} · ${L.round(n)}`;
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
    Object.assign(resumo, { difs, iguais, chip: res, link: `#/secao/${d.uf}/${d.z}/${d.s}` });
    return cab(`${esc(d.uf)} · ${esc(A.titulo(d.mun[1]))} · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s} · ${esc(L.round(n))}`, "", `#/secao/${d.uf}/${d.z}/${d.s}`)
      + `<p>${res} <span class="small muted">${esc(origem)}</span></p>` + tabela([L.bu_th_field, L.bu_th_paper, L.bu_th_file, ""], corpo, "num-cols")
      + `<p class="small muted">${esc(L.bu_res_note)}</p><p class="small muted">${esc(L.bu_note)}</p>`
      + botoes([ir(`#/secao/${d.uf}/${d.z}/${d.s}`, "search", T.open_sec)]) + fonte(L.bot_sec_src);
  }
  // Partes de QR Code lidas, separadas por boletim: a parte que traz estado, zona e seção abre (ou acha) o boletim;
  // as outras vão para o último boletim que ainda não tem aquela parte
  function agruparQR(txts) {
    const grupos = [], outros = [];
    const chave = (p) => (p.campos.UNFE && p.campos.ZONA && p.campos.SECA ? [p.campos.UNFE.toUpperCase(), +p.campos.ZONA, +p.campos.SECA, +(p.campos.TURN || 0)].join("|") : null);
    if (Object.keys(S.qr.partes).length) { const ps = Object.values(S.qr.partes); grupos.push({ k: ps.map(chave).find(Boolean) || null, partes: Object.assign({}, S.qr.partes) }); }
    txts.forEach((x) => {
      const p = ext().lerQR(x);
      if (!p.parte) { outros.push(x); return; }
      const k = chave(p);
      let g = k ? grupos.find((y) => y.k === k) : null;
      if (!g && k) { g = grupos.slice().reverse().find((y) => !y.k && !y.partes[p.parte]); if (g) g.k = k; }
      if (!g && !k) g = grupos.slice().reverse().find((y) => !y.partes[p.parte]);
      if (!g) { g = { k, partes: {} }; grupos.push(g); }
      g.partes[p.parte] = p;
    });
    return { grupos, outros: outros.length };
  }
  async function conferirQR(fs) {
    const T = X(), L = t();
    const trab = (async () => {
      const txts = [];
      for (const f of fs) {
        try {
          const bmp = await createImageBitmap(f);
          (await decodificar(bmp, bmp.width, bmp.height)).forEach((x) => txts.push(x));
        } catch (e) { /* imagem que não abriu */ }
      }
      const G = agruparQR(txts), outros = G.outros;
      if (G.grupos.length > 1) return variosBU(G.grupos);
      S.qr.partes = G.grupos.length ? G.grupos[0].partes : {};
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

  async function variosBU(grupos) {
    const T = X(), L = t();
    const linhas = [], blocos = [];
    let pendente = null;
    for (const g of grupos) {
      const r = ext().juntarQR(g.partes), ks = Object.keys(g.partes), total = g.partes[ks[0]].total || ks.length;
      if (!r.presidente) {
        linhas.push([esc(r.uf ? `${r.uf} · ${L.th_zone} ${r.z} · ${L.th_section} ${r.s}` : "—"), A.chip("amber", L.bu_qr_part(ks.length, total)), ""]);
        pendente = g.partes;
        continue;
      }
      const rs = {};
      const h = await compararBU(r, `${L.bu_from_qr} · ${T.qr_from_photo}`, rs);
      linhas.push([rs.link ? `<b data-href="${esc(rs.link)}">${esc(rs.local)}</b>` : esc(rs.local), rs.chip || A.chip("amber", rs.erro || "—"), rs.difs ? nf(rs.difs) : "0"]);
      blocos.push(h);
    }
    S.qr = { partes: pendente || {} };
    const comDif = linhas.filter((l) => l[2] !== "0" && l[2] !== "").length;
    let h = `<p>${esc(T.qm_lead(grupos.length))}</p><p>${A.chip(comDif ? "red" : "green", comDif ? T.qm_diff(comDif) : T.qm_ok)}</p>`;
    h += tabela([T.qm_th_local, T.qm_th_res, T.qm_th_dif], linhas, "num-cols");
    if (pendente) h += `<p class="small muted">${esc(T.qm_pend)}</p>` + botoes([btnArq("foto"), podeCamera ? btnArq("camera") : ""]);
    h += blocos.map((b, i) => `<section class="at-qm"><h4 class="at-t">${esc(T.qm_item(i + 1))}</h4>${b}</section>`).join("");
    return { h };
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
  // --- documento: PDF com links e página interativa -----------------------------------------------------------
  // Pergunta que reabre a resposta no Atlas (não vale para guias de função nem para respostas a arquivos)
  function perguntaViva(d) {
    const m = d._m;
    if (!m || !m.q || m.fn) return "";
    let p = d.previousElementSibling; while (p && !p.classList.contains("msg-user")) p = p.previousElementSibling;
    return p && p.querySelector(".at-anexo") ? "" : m.q;
  }
  const linkVivo = (d, base) => { if (!d) return base + "#/atlas"; const q = perguntaViva(d); return q ? base + "#/atlas?q=" + enc(q) : ""; };
  // Cópia da resposta (com a pergunta) ou da conversa inteira; botões viram links para o site
  function montarDoc(d, o) {
    const T = X(), L = t();
    let msgs = $$(".msg", S.el.log).filter((x) => !x.classList.contains("msg-typing"));
    if (d) { let p = d.previousElementSibling; while (p && !p.classList.contains("msg-user")) p = p.previousElementSibling; msgs = p ? [p, d] : [d]; }
    const vivo = linkVivo(d, o.base), quando = new Intl.DateTimeFormat(L.locale, { dateStyle: "long", timeStyle: "short" }).format(new Date());
    const doc = document.createElement("article");
    doc.className = "at-doc";
    doc.innerHTML = `<header class="doc-cab"><div class="doc-tit">${marca()}<div><b>Atlas</b><span>${esc(L.brand)} · ${esc(L.brand_sub)}</span></div></div>
      <p class="doc-meta">${esc(d ? T.doc_one : T.doc_all)} · ${esc(quando)}</p><p class="doc-selo">${esc(L.badge)}</p>
      ${vivo ? `<div class="doc-vivo">${o.qr || ""}<div><b>${esc(d ? T.doc_live_one : T.doc_live_all)}</b><p>${esc(o.html ? T.doc_live_note_html : T.doc_live_note)}</p><a href="${esc(vivo)}">${esc(vivo.replace(/^https:\/\//, ""))}</a></div></div>` : ""}</header>`;
    msgs.forEach((x) => {
      const u = x.classList.contains("msg-user"), c = x.cloneNode(true);
      c.querySelectorAll(".at-acts, .caret").forEach((e) => e.remove());
      c.querySelectorAll("[style*='display: none']").forEach((e) => { e.style.display = ""; });
      // número que ainda contava, ou barra que ainda não cresceu: fica o valor final
      c.querySelectorAll("[data-count]").forEach((e) => { e.textContent = nf(+e.dataset.count); });
      c.querySelectorAll(".bars").forEach((b) => b.classList.add("in"));
      const sec = document.createElement("section");
      sec.className = "doc-msg " + (u ? "doc-u" : "doc-a");
      sec.innerHTML = `<p class="doc-quem">${esc(u ? T.who_you : "Atlas")}</p><div class="doc-corpo"></div>`;
      sec.lastChild.append(...c.childNodes);
      const qv = !u && !d ? perguntaViva(x) : "";
      if (qv) sec.insertAdjacentHTML("beforeend", `<p class="doc-ir"><a href="${esc(o.base + "#/atlas?q=" + enc(qv))}">${icone("arrow")} ${esc(T.doc_live_this)}</a></p>`);
      doc.append(sec);
    });
    doc.insertAdjacentHTML("beforeend", `<footer class="doc-rod"><a href="${esc(o.base + "#/")}">${esc(URL_SITE.replace(/^https:\/\/|\/$/g, ""))}</a> · ${esc(L.badge)}</footer>`);
    return A.ferramentas.linkarDoc(doc, o.base, o.html);
  }
  function limparDoc() { $$(".at-doc-imp").forEach((x) => x.remove()); document.body.classList.remove("at-imprimindo"); }
  function colocarDoc(d, qr) {
    limparDoc();
    const doc = montarDoc(d, { base: A.ferramentas.URL_DOC, qr });
    doc.classList.add("at-doc-imp");
    document.body.append(doc); document.body.classList.add("at-imprimindo");
  }
  // PDF: o navegador salva a cópia; com o QR Code que reabre a resposta no site
  async function imprimir(d) {
    if (!d && !S.el.log.querySelector(".msg")) return;
    const vivo = linkVivo(d, A.ferramentas.URL_DOC);
    const qr = vivo ? await A.ferramentas.svgQr(vivo).catch(() => "") : "";
    colocarDoc(d, qr);
    window.addEventListener("afterprint", limparDoc, { once: true });
    window.print();
  }
  // Ctrl+P na página do Atlas também sai como documento (sem o QR Code, que leva um instante para ser gerado)
  window.addEventListener("beforeprint", () => {
    if (!document.body.classList.contains("atlas-on") || document.body.classList.contains("at-imprimindo") || !S.el.log || !S.el.log.querySelector(".msg")) return;
    colocarDoc(null, "");
    window.addEventListener("afterprint", limparDoc, { once: true });
  });

  // Números dos blocos num arquivo .html: o script do arquivo faz a contagem ao aparecer
  function contarNoArquivo(raiz) {
    raiz.querySelectorAll(".kv dd").forEach((dd) => {
      const tn = dd.firstChild, m = tn && tn.nodeType === 3 && tn.nodeValue.match(RE_NUM);
      const n = m ? +m[1].replace(/\D/g, "") : 0;
      if (n < 10 || /^(19|20)\d\d$/.test(m[1])) return;
      const sp = document.createElement("span"); sp.dataset.count = n; sp.textContent = m[1];
      tn.nodeValue = tn.nodeValue.slice(m[1].length); dd.insertBefore(sp, tn);
    });
    return raiz;
  }

  // --- criar site: o visitante escolhe as respostas (sem as perguntas) e baixa um site pronto (.html ou .zip) --------------------
  const respostasSite = () => $$(".at-resp", S.el.log).filter((d) => { const m = d._m; return m && !m.acao && !m.cmd && !m.plano && (!m.fn || m.fn === "roteiro"); });
  const temDados = (d) => !!(d.querySelector(".kv, .bars, .at-sinais, table, .at-mapa, .at-h, .at-rt") || d._m.kb);
  const curto = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };
  // texto corrido de um trecho, com espaço entre blocos (o textContent junta "2026" e "Aptos")
  const corrido = (el) => { const c = el.cloneNode(true); c.querySelectorAll("p, div, dt, dd, li, h4, td, th, figcaption, .bar-label, .bar-value").forEach((x) => x.append(" ")); return c.textContent; };
  // Uma resposta como parte do site: título e subtítulo saem do cabeçalho da resposta; botões viram links para o site
  function parteSite(d) {
    const c = d.cloneNode(true);
    c.querySelectorAll(".at-acts, .caret, .msg-rel, .chips, .at-entendi, form").forEach((e) => e.remove());
    c.querySelectorAll("[style*='display: none']").forEach((e) => { e.style.display = ""; });
    c.querySelectorAll("[data-count]").forEach((e) => { e.textContent = nf(+e.dataset.count); e.removeAttribute("data-count"); });
    c.querySelectorAll(".rv").forEach((e) => { e.classList.remove("rv", "rv-l", "rv-s", "in"); e.style.removeProperty("--d"); });
    let titulo = "", sub = "";
    const h = c.querySelector(".at-h");
    if (h) { const b = h.querySelector("b"), mu = h.querySelector(".muted"); titulo = curto((b || h).textContent, 90); sub = mu ? curto(mu.textContent, 90) : ""; h.remove(); }
    if (!titulo) { const b = c.querySelector("h4, b, strong"), tb = b ? curto(b.textContent, 90) : ""; titulo = tb && tb.length <= 60 ? tb : curto(corrido(c), 60); }
    const kv = c.querySelector(".kv > div"), br = c.querySelector(".bar-row");
    const destaque = kv ? [curto(kv.querySelector("dt").textContent, 40), curto(kv.querySelector("dd").textContent, 30)]
      : br ? [curto(br.querySelector(".bar-label").textContent, 40), curto(br.querySelector(".bar-value").textContent, 30)] : null;
    A.ferramentas.linkarDoc(c, URL_SITE, true);
    return { titulo: titulo || "Atlas", sub, el: contarNoArquivo(c), destaque, resumo: curto(corrido(c), 110) };
  }
  // O motor da página (o das respostas costuma rodar no worker) precisa dos municípios para achar os lugares de um pedido de site
  async function motorComMunicipios() { if (!S.munsMotor) { window.MOTOR.configurar({ muns: await A.municipios() }); S.munsMotor = true; } }
  // A janela e os geradores ficam em sites.js, carregado só agora; pedido: { tipo, lugares, texto } vindo do motor
  async function janelaSite(dAtual, pedido) {
    try { await carregarScript("site/js/sites.js", "ATLAS_SITES"); } catch (e) { console.error(e); return null; }
    const itens = respostasSite().map((d) => ({ d, p: parteSite(d), on: temDados(d) || d === dAtual }));
    const mm = memoria();
    return A.sites.abrir({ itens, atual: dAtual, lugares: (mm && mm.lug) || [], pedido });
  }

  // Página interativa: um arquivo .html com o visual do site, dicas nos gráficos e números e barras animados
  async function paginaInterativa(d) {
    const T = X();
    if (!d && !S.el.log.querySelector(".msg")) return;
    const vivo = linkVivo(d, URL_SITE);
    const qr = vivo ? await A.ferramentas.svgQr(vivo).catch(() => "") : "";
    const doc = contarNoArquivo(montarDoc(d, { base: URL_SITE, qr, html: true }));
    const q = d ? (d._m && d._m.q) || T.doc_one : T.doc_all;
    return A.exportar.htmlInterativo(doc, `Atlas · ${q}`, `atlas-${slug(d ? q : T.doc_all)}-${hoje()}.html`);
  }

  // --- ações em cada resposta: copiar, ouvir, compartilhar, exportar, automação, reportar ------------------
  function acoesResposta(d, m) {
    const T = X(), C = S.con;
    d._m = m;
    sincronizarRoteiro(d);
    const old = d.querySelector(".at-acts"); if (old) old.remove();
    const b = (k, ic, txt, pop) => `<button type="button" class="at-ac" data-at-ac="${k}" aria-label="${esc(txt)}" title="${esc(txt)}"${pop ? ' aria-haspopup="menu" aria-expanded="false"' : ""}>${icone(ic)}</button>`;
    d.insertAdjacentHTML("beforeend", `<div class="at-acts">${b("copiar", "copy", T.ac_copy)}${podeFalar ? b("ouvir", "speaker", T.ac_listen) : ""}${C.share ? b("compartilhar", "share", T.ac_share, true) : ""}${d.querySelector(".kv, .bars, .at-sinais") ? b("imagem", "image", t().im_btn) : ""}${C.export ? b("exportar", "download", T.ac_export, true) : ""}${C.hook && urlValida(S.hook.url) ? b("automacao", "plug", T.ac_hook) : ""}${C.github ? b("reportar", "alert", T.ac_report) : ""}<span class="at-status" aria-live="polite"></span></div>`);
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
    const itens = itensCompartilhar(m);
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
  // Cartão de imagem e vídeo da resposta: título, blocos de números, barras e selos dos testes (ver itensCartao em ferramentas.js)
  function cartaoResposta(d, m) {
    const c = d.cloneNode(true), txt = (e) => (e ? e.textContent.replace(/\s+/g, " ").trim() : "");
    c.querySelectorAll(".at-acts, .caret").forEach((e) => e.remove());
    c.querySelectorAll("[data-count]").forEach((e) => { e.textContent = nf(+e.dataset.count); });
    const h = c.querySelector(".at-h"), sub = h && h.querySelector(".muted");
    const itens = [];
    c.querySelectorAll("h4.at-t, .kv > div, .bar-row, .at-sinais > li").forEach((e) => {
      if (e.matches("h4")) {
        const s = e.querySelector(".muted"), x = s ? s.textContent : "";
        itens.push(["t", [txt(e).replace(x.trim(), "").trim(), x.trim()].filter(Boolean).join(" · ")]);
      } else if (e.matches(".bar-row")) {
        const f = parseFloat((e.querySelector(".bar").getAttribute("style") || "").replace(/.*--f:\s*/, ""));
        itens.push(["b", txt(e.querySelector(".bar-label")), txt(e.querySelector(".bar-value")), f || 0]);
      } else if (e.matches("li")) {
        const ch = $$(".chip", e).map((x) => [(x.className.match(/chip-(red|amber|green)/) || [, "green"])[1], txt(x)]);
        itens.push(ch.length ? ["c", txt(e.querySelector("b")).replace(/:$/, ""), ch] : ["l", txt(e), ""]);
      } else itens.push(["l", txt(e.querySelector("dt")), txt(e.querySelector("dd"))]);
    });
    return { kicker: ["Atlas", txt(sub)].filter(Boolean).join(" · "), titulo: h ? txt(h.querySelector("b")) : m.q || "Atlas", itens, slug: "atlas-" + slug(m.q || (h ? txt(h.querySelector("b")) : "")) };
  }
  // Esta resposta (com a pergunta) ou a conversa inteira, como fonte para os formatos de exportação
  function fonteAtlas(d) {
    const T = X();
    let msgs = $$(".msg", S.el.log).filter((x) => !x.classList.contains("msg-typing"));
    if (d) { let p = d.previousElementSibling; while (p && !p.classList.contains("msg-user")) p = p.previousElementSibling; msgs = p ? [p, d] : [d]; }
    const m = d && d._m, h = d && d.querySelector(".at-h b");
    const titulo = d ? (h ? h.textContent.trim() : "") || (m && m.q) || T.doc_one : T.doc_all;
    const vivo = linkVivo(d, URL_SITE) || URL_SITE + "#/atlas";
    return { elementos: msgs, meta: { titulo, sub: d && m && m.q && h && m.q !== titulo ? m.q : d ? "" : (conversa().t || ""), kicker: "Atlas · " + t().brand, url: vivo, arquivo: "atlas-" + (d ? titulo : T.doc_all) } };
  }
  function exportarMenu(btn, d, m) {
    const T = X(), xp = t().xp;
    A.ferramentas.svgQr("").catch(() => {});
    const escopos = (m ? [{ k: "uma", rot: xp.one }] : []).concat([{ k: "todas", rot: xp.all }]);
    A.exportar.abrir({ titulo: T.ac_export, escopos, fonte: (k) => fonteAtlas(k === "uma" ? d : null), pdf: (k) => imprimir(k === "uma" ? d : null), html: (k) => paginaInterativa(k === "uma" ? d : null),
      extra: [{ k: "site", ic: "grid", rot: T.st_bt[0], sub: T.st_bt[1], fn: () => janelaSite(d) }] });
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
        <span class="at-con-txt"><b>${esc(T.hist_save)}</b><small>${esc(T.hist_save_sub)}</small></span></label></li>
        <li class="at-con"><label class="at-sw"><input type="checkbox" data-sem-on${SR().ligado() ? " checked" : ""}><span class="at-sw-t" aria-hidden="true"></span>
        <span class="at-con-txt"><b>${esc(T.sem_t)}</b><small>${esc(T.sem_sub)}</small></span></label>
        <div class="at-sem"><p class="small" data-sem-n>${esc(T.sem_n(SR().lista().length))}</p>
          <div class="btn-row"><button class="btn btn-sm" type="button" data-sem="csv">${icone("download")} CSV</button><button class="btn btn-sm" type="button" data-sem="json">${icone("download")} JSON</button>
          <a class="btn btn-sm" data-sem="gh" target="_blank" rel="noopener">${icone("code")} ${esc(T.sem_gh)}</a><button class="btn btn-sm btn-ghost" type="button" data-sem="limpar">${icone("trash")} ${esc(T.sem_clear)}</button></div>
          <p class="small muted">${esc(T.sem_note)}</p></div></li></ul>`, "dlg-atlas");
    const semAtual = () => {
      const l = SR().lista(), gh = dl.querySelector('[data-sem="gh"]');
      dl.querySelector("[data-sem-n]").textContent = T.sem_n(l.length);
      const corpo = `${T.sem_issue_lead}\n\n${l.slice(0, 60).map((x) => `- ${x.q.replace(/\s+/g, " ")} (${x.lang})`).join("\n")}`;
      gh.href = `${A.REPO}/issues/new?title=${enc(T.sem_issue_t)}&body=${enc(corpo.slice(0, 6000))}`;
      dl.querySelectorAll("[data-sem]").forEach((b) => { b.toggleAttribute("disabled", !l.length && b.dataset.sem !== "gh"); if (b.dataset.sem === "gh") b.classList.toggle("off", !l.length); });
    };
    semAtual();
    dl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sem]"); if (!b) return;
      const l = SR().lista(), k = b.dataset.sem;
      if (k === "csv") baixar(`atlas-sem-resposta-${hoje()}.csv`, csv([[T.th_text, T.th_when, "lang"]].concat(l.map((x) => [x.q, new Date(x.ts).toISOString(), x.lang]))), "text/csv;charset=utf-8");
      if (k === "json") baixar(`atlas-sem-resposta-${hoje()}.json`, JSON.stringify({ fonte: "Atlas · paranacontraoscorruptos.org", perguntas: l }, null, 2), "application/json");
      if (k === "gh" && !l.length) e.preventDefault();
      if (k === "limpar" && window.confirm(T.sem_clear_q)) { SR().limpar(); semAtual(); }
    });
    const atualizar = () => { gravarJ(CH.con, S.con); gravarJ(CH.hook, S.hook); $$(".at-resp").forEach((d) => { if (d._m) acoesResposta(d, d._m); }); };
    dl.addEventListener("change", (e) => {
      const c = e.target.closest("[data-con]");
      if (c) { S.con[c.dataset.con] = c.checked; atualizar(); return; }
      if (e.target.matches("[data-hook-auto]")) { S.hook.auto = e.target.checked; atualizar(); return; }
      if (e.target.matches("[data-sem-on]")) { SR().ligar(e.target.checked); semAtual(); return; }
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
        if (k === "imagem") { A.ferramentas.gerarImagem({ cartao: cartaoResposta(d, m), url: linkResposta(m), titulo: `Atlas · ${m.q || X().title}`, fonte: () => fonteAtlas(d) }); return; }
        if (k === "exportar") { exportarMenu(ac, d, m); return; }
        if (k === "automacao") { enviarAutomacao(m, d); return; }
        if (k === "reportar") { reportar(m); return; }
        return;
      }
      if (!el.closest(".at-mais, .at-menu-mais, [data-at='exportar-conversa']")) fecharMenus();
      const md = el.closest("[data-at-md]");
      if (md) {
        const r = md.closest(".at-resp"), d = r && r._m && !r._m.acao && !r._m.cmd && !r._m.plano ? r : ultimaResposta(), rot = X().md_bt[md.dataset.atMd];
        if (d && !S.ocupado) ocupar(async () => { usuario(rot); await executar(acaoMidia(md.dataset.atMd), d, rot, ""); });
        return;
      }
      const q = el.closest("[data-q]"); if (q) { perguntar(q.dataset.q); return; }
      const id = el.closest("[data-at-id]");
      if (id) {
        const en = motor().entrada(id.dataset.atId); if (!en || S.ocupado) return;
        ocupar(async () => { usuario(motor().rotulo(en)); await pensar(t().bot_think_qa); await escrever(htmlEntrada(en), { q: motor().rotulo(en), kb: en.i }); });
        return;
      }
      const go = el.closest("[data-go]"); if (go) { location.hash = go.dataset.go; return; }
      const fn = el.closest("[data-at-fn]"); if (fn) { funcao(fn.dataset.atFn); return; }
      const arq = el.closest("[data-at-arq]"); if (arq) { escolherArquivo(arq.dataset.atArq); return; }
      const tse = el.closest("[data-at-tse]");
      if (tse) { const alvo = JSON.parse(tse.dataset.atTse); if (!S.ocupado) ocupar(async () => { usuario(T.tse_user(alvo.tipo === "br" ? alvo.nome : `${alvo.nome} (${alvo.uf})`)); await tseComparar(alvo, T.tse_user(alvo.nome)); }); return; }
      const ts = el.closest("[data-at-tsesec]");
      if (ts) { const p = JSON.parse(ts.dataset.atTsesec); if (!S.ocupado) ocupar(async () => { const q = `${p.uf} ${T.w_zone} ${p.z} ${T.w_section} ${p.s} · TSE`; usuario(q); await tseSecao(p, q); }); return; }
      const cf = el.closest("[data-at-filtro]");
      if (cf) { csvFiltro(JSON.parse(cf.dataset.atFiltro)); return; }
      const xr = el.closest("[data-at-exp]");
      if (xr) { const d = xr.closest(".at-resp"); if (d && d._m) exportarMenu(xr, d, d._m); return; }
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
      if (k === "mais") {
        const abrir = S.el.mais.hidden; fecharMenus();
        S.el.mais.hidden = !abrir; at.setAttribute("aria-expanded", String(abrir));
        if (abrir) { const f = S.el.mais.querySelector("button"); if (f) f.focus({ preventScroll: true }); }
        return;
      }
      if (k === "mic") { microfone(at); return; }
      if (k === "exportar-ult" || k === "reportar-ult") { const d = ultimaResposta(); if (d) { if (k === "reportar-ult") reportar(d._m); else exportarMenu(at, d, d._m); } return; }
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
        exportarMenuTopo();
        return;
      }
      if (k === "modelo-lista") { baixar("modelo-lista-secoes.csv", csv([["uf", "zona", "secao"], ["PR", "3", "50"], ["SP", "1", "5"], ["BA", "1", "3"]]), "text/csv;charset=utf-8"); return; }
      if (k === "modelo-apuracao") {
        const cands = R().ordem_votos["2"].filter((nr) => nr !== "95" && nr !== "96");
        baixar("modelo-apuracao.csv", csv([["uf", "zona", "secao", "turno", "aptos", "votaram"].concat(cands, ["brancos", "nulos"]), ["PR", "3", "50", "2", "", ""].concat(cands.map(() => ""), ["", ""])]), "text/csv;charset=utf-8");
      }
    });
    // Roteiro do cidadão: marcar um passo vale para todas as cópias do roteiro
    root.addEventListener("change", (e) => {
      const c = e.target.closest("[data-rt]"); if (!c) return;
      const f = rtFeitos(); if (c.checked) f.add(c.dataset.rt); else f.delete(c.dataset.rt);
      gravarJ(CH_RT, [...f]);
      $$(".at-resp", S.el.log).forEach(sincronizarRoteiro);
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
  function exportarMenuTopo() { exportarMenu(null, null, null); }

  // Eventos de página (uma vez só)
  // Celular: a conversa ocupa só a parte que aparece (sem as barras do navegador e do Android e sem o teclado),
  // para o campo de digitar não ficar escondido embaixo. O zoom com dois dedos não muda a altura.
  const vv = window.visualViewport;
  const alturaTela = () => { const h = vv ? vv.height * vv.scale : window.innerHeight; if (h > 200) document.documentElement.style.setProperty("--alt", Math.round(h) + "px"); };
  alturaTela();
  (vv || window).addEventListener("resize", alturaTela);
  window.addEventListener("orientationchange", () => setTimeout(alturaTela, 300));
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
