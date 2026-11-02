/* Site da auditoria: roteamento, páginas e consulta de seção. */
(function () {
  "use strict";

  const REPO = "https://github.com/paranacontraoscorruptos/eleicoes2026brasil";
  const BLOB = REPO + "/blob/6638cbfa6cbdf0f3ddc5d8fc83370cab666012e4/auditoria-eleicoes-2026-Brasil/auditoria_eleicoes_2026.py"; // v2.1.0: linhas de resumo.motor.funcoes
  const ZIP = REPO + "/archive/refs/heads/site.zip";   // branch publicado (o main está desatualizado)
  // v2.2.0: testes V1–V6 (variação entre turnos) — linhas do motor neste commit
  const BLOB_V = REPO + "/blob/d47662c10c28de1dbf1abb1e261f420bf6afa819/auditoria-eleicoes-2026-Brasil/auditoria_eleicoes_2026.py";
  const FN_DL = ["desvio_logit", 3432, 3451], FN_TT = ["teste_transferencia", 3472, 3482];
  const FUNCS_V = { V1: [["executar_variacao", 3487, 3489], FN_TT, FN_DL], V2: [["executar_variacao", 3490, 3492], FN_TT, FN_DL], V3: [["executar_variacao", 3493, 3504], FN_DL],
    V4: [["executar_variacao", 3505, 3526], FN_DL], V5: [["executar_variacao", 3527, 3538]], V6: [["executar_variacao", 3539, 3548]] };
  const NIVEL_V = { V1: "uf", V2: "municipio", V3: "secao", V4: "secao", V5: "secao", V6: "secao" };
  // O que cada teste T conta: s = seção; sc = seção em um cargo; sp = seção em um par de cargos (T06); c = candidato em um estado
  const UN_T = { T01: "sc", T02: "sc", T03: "sc", T04: "s", T05: "sc", T06: "sp", T07: "sc", T08: "sc", T09: "sc", T10: "s", T11: "s", T12: "s", T13: "c", T14: "c", T15: "c" };
  const unTip = (Z, a, i, k) => Z.un_tip(nf(a), nf(i), Z.un_t[k]) + (Z.un_x[k] ? " " + Z.un_x[k] : "");
  const TESTES_V = ["V1", "V2", "V3", "V4", "V5", "V6"];
  const TESTES_L = ["L01", "L02", "L03", "L04", "L05", "L06", "L07", "L08", "L09", "L10", "L11", "L12", "L13", "L14"];
  // downloads pausados enquanto a auditoria completa (35 testes) não termina: os botões abrem o aviso (extras.js)
  const DL_PAUSA = false;
  const PASTA = "auditoria-eleicoes-2026-Brasil";
  const TSE_PORTAL = "https://dadosabertos.tse.jus.br/";
  const TSE_RESULTADOS = "https://resultados.tse.jus.br/";
  const URL_BU_EX = "https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/buweb/bweb_2t_PR_261020260742.zip";
  const TELEGRAM = "https://t.me/+gmizrDlU5FZmZTkx";
  // Onde baixar o Telegram: Android, iPhone e computador
  const TG_LOJAS = ["https://play.google.com/store/apps/details?id=org.telegram.messenger", "https://apps.apple.com/app/telegram-messenger/id686449807", "https://desktop.telegram.org/"];
  const LANGS = ["PT", "EN", "ES"];

  const state = { lang: "PT", R: null, extra: null, muns: null, zonas: {} };
  const ANIM = document.documentElement.classList.contains("anim");
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
  // T01–T15: nome do motor e número (3); V e L: nome dos 35 testes e o próprio código (V3, L01)
  const nomeTeste = (tid) => (tid[0] === "T" ? state.R.testes_txt[state.lang][tid].nome : (window.APP.audNome ? window.APP.audNome(tid) : tid));
  const numTeste = (tid) => (tid[0] === "T" ? parseInt(tid.slice(1), 10) : tid);
  // total de testes da auditoria completa e quantos já foram concluídos (lista em extras.js: APP.AUD)
  const nTestes = () => { if (window.APP && window.APP.audSync) window.APP.audSync(); const a = window.APP && window.APP.AUD; return a ? [a.feitos.length + a.faltam.length, a.feitos.length] : [35, 21]; };
  // auditoria completa (os 35 testes nos dois turnos): extras.js decide pelos dados publicados
  const audFim = () => !!(window.APP && window.APP.audCompleta && window.APP.audCompleta());
  const txtTestes = () => `${nTestes()[0]} ${t().st_testes_x(nTestes()[1])}`;

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
  function chipStatus(r) { if (r.na) return chip("na", t().st_na); const c = status(r); return chip(c, { red: t().st_red, amber: t().st_amber, green: t().st_green }[c]); }
  function tipoTeste(tid) {
    if (tid[0] === "L") return (window.T35[state.lang] || window.T35.PT).tipo_l;
    if (tid[0] === "V") return tid === "V5" || tid === "V6" ? t().det : t().stat;
    return ["T01", "T02", "T11", "T12"].includes(tid) ? t().det : ["T13", "T14", "T15"].includes(tid) ? t().agg : t().stat;
  }

  // --- blocos reutilizáveis ------------------------------------------------------
  // Link para o Atlas; com pergunta, ela já chega feita
  const linkAtlas = (q) => "#/atlas" + (q ? "?q=" + encodeURIComponent(q) : "");
  // Faixa curta que leva ao Atlas, no fim das páginas
  function botCta() {
    const L = t();
    return `<aside class="bot-band"><span class="bot-band-ico" aria-hidden="true">${icone("globe")}</span><p><b>${esc(L.bot_cta_title)}</b></p><a class="btn btn-bot" href="#/atlas">${esc(L.bot_cta_btn)}</a></aside>`;
  }

  // Grupo do Telegram: chamada completa na página inicial, faixa curta no rodapé
  function telegram(compacto) {
    const L = t();
    const ir = (cls) => `<a class="btn btn-tg ${cls}" href="${TELEGRAM}" target="_blank" rel="noopener">${icone("tg")} ${esc(L.tg_btn)}</a>`;
    if (compacto) {
      return `<div class="foot-tg">
        <span class="tg-ico" aria-hidden="true">${icone("tg")}</span>
        <p><b>${esc(L.tg_title)}</b><span>${esc(L.tg_no)} ${TG_LOJAS.map((h, i) => `<a href="${h}" target="_blank" rel="noopener">${esc(L.tg_lojas[i])}</a>`).join(" · ")}</span></p>
        ${ir("")}
      </div>`;
    }
    return `<section class="tg-cta" aria-labelledby="tg-h">
      <div class="tg-ico" aria-hidden="true">${icone("tg")}</div>
      <div class="tg-body">
        <h2 id="tg-h">${esc(L.tg_title)}</h2>
        <p>${esc(L.tg_text)}</p>
        ${ir("btn-lg")}
        <div class="tg-new">
          <h3>${esc(L.tg_new_title)}</h3>
          <ol>${L.tg_steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
          <div class="tg-dl">${TG_LOJAS.map((h, i) => `<a class="btn btn-sm" href="${h}" target="_blank" rel="noopener">${icone("download")} ${esc(L.tg_baixar[i])}</a>`).join("")}</div>
        </div>
      </div></section>`;
  }

  function icone(n) {
    const p = {
      chat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5z"/><circle cx="8.5" cy="9.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="9.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="9.5" r="1.1" fill="currentColor" stroke="none"/>',
      download: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/>',
      play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
      search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
      code: '<path d="m9 8-4 4 4 4m6-8 4 4-4 4"/>',
      copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4"/>',
      menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
      close: '<path d="M6 6l12 12M18 6 6 18"/>',
      send: '<path d="M4 12 20 4l-6 16-2.5-6.5z"/>',
      grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
      flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
      flag: '<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>',
      users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.2a3 3 0 0 1 0 5.6M17 13.6a5 5 0 0 1 3.5 5.4"/>',
      vote: '<path d="M4 12h16v8H4z"/><path d="M8 12V5h8v7"/><path d="m10 8.5 1.5 1.5 3-3"/>',
      file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
      chart: '<path d="M4 20V10m5.3 10V5m5.4 15v-7M20 20v-4"/>',
      terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
      shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="M12 8v4m0 3.5v.01"/>',
      arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
      insta: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r=".8" fill="currentColor"/>',
      moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
      up: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
      check: '<path d="m5 12 4.5 4.5L19 7"/>',
      alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4m0 3v.01"/>',
      tg: '<path fill="currentColor" stroke="none" d="M2.9 10.9 19.6 4.4c.8-.3 1.5.2 1.2 1.4l-2.8 13.4c-.2 1-.8 1.2-1.6.7l-4.3-3.2-2.1 2c-.2.2-.4.4-.9.4l.3-4.4 8-7.2c.3-.3-.1-.5-.5-.2l-9.9 6.2-4.2-1.3c-.9-.3-.9-.9.1-1.3z"/>',
      map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14m6-12v14"/>',
      pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
      list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>',
      book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
      hash: '<path d="M10 3 8 21m8-18-2 18M4 8.5h16M3.5 15.5h16"/>',
      qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2"/>',
      star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>',
      starf: '<path fill="currentColor" d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>',
      bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
      share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1m-7.6 6.5 7.6 4.1"/>',
      print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
      image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
      phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
      a11y: '<path d="M3 19 8.5 5h1L15 19M5 14.5h8"/><path d="M16 19l3-8 3 8m-5-2.5h4"/>',
      mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
      speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
      stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
      camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
      upload: '<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 19h14"/>',
      trash: '<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
      link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4L11.5 6M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.5-1.4"/>',
      rss: '<path d="M5 19a1 1 0 1 0 0-.01M5 11a8 8 0 0 1 8 8M5 4.5A14.5 14.5 0 0 1 19.5 19"/>',
      swap: '<path d="M4 8h14m0 0-3.5-3.5M18 8l-3.5 3.5M20 16H6m0 0 3.5-3.5M6 16l3.5 3.5"/>',
      globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z"/>',
      sidebar: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      plug: '<path d="M9 3v5m6-5v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21"/>',
      back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
      expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5m11-5v5h-5"/>',
      grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3.2"/>',
      building: '<path d="M4 20V9l8-5 8 5v11M3 20h18M10 20v-5h4v5M8 11h.01M12 11h.01M16 11h.01" />',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.7.3-1.2 1-1.2 1.8v.5M12 17h.01"/>',
      receipt: '<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21zM9 8h6M9 12h6M9 16h3"/>',
      news: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 13h7M7 16h4"/>',
      braces: '<path d="M8 4c-2 0-2.5 1-2.5 3v2c0 1.5-.8 2.5-2 3 1.2.5 2 1.5 2 3v2c0 2 .5 3 2.5 3M16 4c2 0 2.5 1 2.5 3v2c0 1.5.8 2.5 2 3-1.2.5-2 1.5-2 3v2c0 2-.5 3-2.5 3"/>',
      db: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
      seal: '<circle cx="12" cy="9" r="5.5"/><path d="m9.6 9 1.7 1.7 3.1-3.2M8.6 13.6 7 21l5-2.5 5 2.5-1.6-7.4"/>',
      archive: '<path d="M3 5h18v4H3zM5 9v10h14V9M10 13h4"/>',
      clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
      locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/>',
      text: '<path d="M4 6h16M4 10h16M4 14h10M4 18h7"/>',
      lab: '<path d="M9 3h6M10 3v6.5L4.6 18.2A1.9 1.9 0 0 0 6.2 21h11.6a1.9 1.9 0 0 0 1.6-2.8L14 9.5V3M7.3 15h9.4"/>',
      lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
      timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 2M10 2.5h4M18.5 6l1.5-1.5"/>',
      trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4m-4 3h8l-1-3H9z"/>',
      shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
      check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
      x: '<path d="M6 6l12 12M18 6 6 18"/>',
    }[n];
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
  }

  function barras(linhas, opts) {
    // linhas: [{rotulo, valor, texto, dica}]
    const max = Math.max(...linhas.map((l) => l.valor), 1e-9);
    // espaço reservado para o rótulo do valor, para a barra maior não ser cortada
    const res = Math.round(Math.min(170, 16 + Math.max(...linhas.map((l) => String(l.texto).length)) * 7.4));
    return `<div class="bars" role="list" style="--res:${res}px">` + linhas.map((l, i) =>
      `<div class="bar-row" role="listitem" tabindex="0" data-tip="${esc(l.dica)}" style="--i:${Math.min(i, 30)}">
        <span class="bar-label">${esc(l.rotulo)}</span>
        <span class="bar-track"><span class="bar" style="--f:${(l.valor / max).toFixed(4)}"></span><span class="bar-value">${esc(l.texto)}</span></span>
      </div>`).join("") + `</div>` + (opts && opts.nota ? `<p class="small muted">${opts.nota}</p>` : "");
  }

  // Barras do cartão de imagem e vídeo: candidatos mais votados (v = {nr: votos}, nomes = {nr: nome})
  function barrasCartao(n, v, nomes, max) {
    const L = t(), cs = Object.keys(v).filter((nr) => nr !== "95" && nr !== "96" && v[nr] > 0).sort((a, b) => v[b] - v[a]);
    const val = cs.reduce((a, nr) => a + v[nr], 0) || 1, top = v[cs[0]] || 1;
    return { t: `${L.round(n)} · ${L.cd_pres}`, itens: cs.slice(0, max).map((nr) => [`${titulo(nomes[nr] || nr)} (${nr})`, `${nf(v[nr])} · ${pct(v[nr] / val)}`, v[nr] / top]) };
  }
  // O mesmo, com o resultado nacional de um turno
  function barrasTurno(n, max) {
    const v = {}, nomes = {};
    state.R.turnos[n].presidente.candidatos.forEach((c) => { v[c.nr] = c.votos; nomes[c.nr] = c.nome; });
    return barrasCartao(n, v, nomes, max);
  }

  function tabela(cab, linhas, cls) {
    return `<div class="table-wrap"><table class="${cls || ""}"><thead><tr>${cab.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  // Tabela no padrão do site: a mesma tabela, dica ao passar o mouse e painel ao clicar da página Urnas que fecharam tarde.
  // O HTML já traz a tabela simples (impressão, exportação, sem JavaScript); logo depois de a página aparecer ela é
  // trocada pela tabela padrão (extras.js: APP.cqPagina.tabela). cfg: ver tabelaPadrao em extras.js.
  let tpSeq = 0;
  const tpFila = [];
  function tabelaTP(cfg, simples) {
    const id = `tp-${++tpSeq}`;
    tpFila.push(() => { const box = document.getElementById(id); if (box && window.APP.cqPagina) { box.innerHTML = ""; window.APP.cqPagina.tabela(box, cfg); } });
    return `<div class="tp-box" id="${id}">${simples || ""}</div>`;
  }
  function tpExecutar() { tpFila.splice(0).forEach((f) => { try { f(); } catch (e) { console.error(e); } }); }
  // bloco de números (rótulo e valor) e botão dos painéis
  const tpDl = (pares) => `<dl class="cq-p-dl tp-dl">${pares.filter(Boolean).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
  const tpBtn = (href, ic, txt, prim) => `<a class="btn btn-sm${prim ? " btn-primary" : " btn-ghost"}" href="${href}" data-ir>${icone(ic)} ${esc(txt)}</a>`;
  const tpVazio = () => ({ uf: null, z: null, s: null, loc: null, t: null, cod: null, mun: null, teste: null, nivel: null, nr: null });
  // os 35 testes de um turno: T do resumo do turno (Relatório Técnico); V e L da auditoria completa (aud35).
  // V1 a V6 comparam o 1º e o 2º turno: no 1º turno não se aplicam (o resultado está no 2º turno)
  function testes35(n) {
    const R = state.R, A35 = R.aud35 && R.aud35[n], T = R.turnos[n].testes;
    if (!A35) return T;
    return T.concat(A35.testes.filter((x) => x.id[0] !== "T").map((x) => (x.na ? { id: x.id, na: 1, unidades: null, sinal: 0, info: 0, brutos: null }
      : { id: x.id, unidades: x.u, sinal: x.a, info: x.i, brutos: null })));
  }
  const unTeste = (tid) => (tid[0] === "T" ? UN_T[tid] || "s" : tid[0] === "V" ? UN_V[tid] : "s");
  function txtTeste(tid) {
    const ZT = window.T35[state.lang] || window.T35.PT;
    if (tid[0] === "T") return state.R.testes_txt[state.lang][tid] || {};
    if (tid[0] === "V") { const z = ZT.V[tid] || []; return { nome: nomeTeste(tid), objetivo: z[0], criterio: z[2] }; }
    const lx = window.APP.logsL && window.APP.logsL.txt(tid), z = (ZT.L && ZT.L[tid]) || [];
    return { nome: nomeTeste(tid), objetivo: (lx && lx.objetivo) || z[0], criterio: (lx && lx.criterio) || z[2] };
  }
  // botões do painel de um teste: T (lista e gráfico), L (página dos logs e lista), V (comparar turnos e lista)
  function acoesTeste(n, tid) {
    const P = t().tp;
    const secs = tpBtn(`#/lista?t=${n}&teste=${tid}&nivel=a`, "list", t().dz.ver_secs);
    if (tid[0] === "L") return tpBtn(`#/logs?t=${n}&teste=${tid}&nivel=a`, "list", t().dz.ab.lg, true) + secs + tpBtn(`#/testes/${tid}`, "flask", P.ver_teste);
    if (tid[0] === "V") return tpBtn("#/variacao", "swap", t().dz.ab.vr, true) + (n === "2" && UN_V[tid] === "secao" ? secs : "") + tpBtn(`#/testes/${tid}`, "flask", P.ver_teste);
    return tpBtn(`#/testes/${tid}`, "flask", P.ver_teste, true) + tpBtn(`#/lista?t=${n}&teste=${tid}`, "list", P.ver_lista(numTeste(tid))) + tpBtn(`#/graficos/${tid}`, "chart", P.ver_graf);
  }
  // painel de um teste num turno: o que ele conta (com a unidade), os números do Relatório Técnico e o que ele confere
  function painelTesteTurno(n, tid) {
    const L = t(), R = state.R, x = testes35(n).find((y) => y.id === tid), tx = txtTeste(tid), P = L.tp;
    const ZT = window.T35[state.lang] || window.T35.PT, uk = unTeste(tid), un = ZT.un_t[uk];
    const cp = tid === "T11" && R.complementar && R.complementar.encerramento_tardio;
    const notaT11 = cp ? `<p class="note small enc-nota">${icone("help")} ${esc(L.ex.enc_resumo(nf(cp.turnos[1].sinalizadas), nf(cp.turnos[2].sinalizadas)))}</p>` : "";
    const res = x.na ? `<p>${chipStatus(x)}</p><p class="small muted">${esc(L.st_na_x)}</p>`
      : `${tpDl([[L.th_units, `${nf(x.unidades || 0)} <small>${esc(un)}</small>`],
      [L.th_anom, `${nf(x.sinal)} <small>${esc(un)}</small>`], [L.th_info, `${nf(x.info)} <small>${esc(un)}</small>`], tid[0] === "T" ? [L.th_raw, x.brutos == null ? "—" : nf(x.brutos)] : null,
      [L.th_rate, x.unidades ? pct(x.sinal / x.unidades, 3) : "—"], [L.th_status, chipStatus(x)]])}${ZT.un_x[uk] ? `<p class="small muted">${esc(ZT.un_x[uk])}</p>` : ""}`;
    const corpo = `<section class="tp-ap"><h3>${esc(P.tst_res(L.round(+n)))}</h3>${res}</section>${notaT11}
      ${tx.objetivo ? `<h3>${esc(P.tst_obj)}</h3><p>${esc(tx.objetivo)}</p>` : ""}${tx.criterio ? `<h3>${esc(P.tst_crit)}</h3><p>${esc(tx.criterio)}</p>` : ""}`;
    return { tipo: "info", e: {}, d: null, href: tid[0] === "L" ? `#/logs?t=${n}&teste=${tid}&nivel=a` : `#/testes/${tid}`, kick: `${L.round(+n)} · ${L.th_test} ${numTeste(tid)}`, tit: tx.nome || nomeTeste(tid), sub: tipoTeste(tid), corpo,
      acoes: acoesTeste(n, tid),
      dica: x.na ? `<div class="cq-d-t">${esc(L.st_na_x)}</div>` : `<div class="cq-d-t">${esc(unTip(ZT, x.sinal, x.info, uk))}</div><div class="cq-d-t">${esc(L.th_status)}: ${esc({ red: L.st_red, amber: L.st_amber, green: L.st_green }[status(x)])}</div>` };
  }

  // Ações da página: compartilhar, gerar imagem para redes (quando há cartão) e exportar (PDF, apresentação, Word, Excel…)
  function acoes(img, extra) {
    const L = t();
    return `<div class="pg-acoes">${extra || ""}
      <button class="btn btn-sm" type="button" data-share>${icone("share")} ${esc(L.sh_btn)}</button>
      ${img ? `<button class="btn btn-sm" type="button" data-img>${icone("image")} ${esc(L.im_btn)}</button>` : ""}
      <button class="btn btn-sm btn-ghost" type="button" data-export>${icone("download")} ${esc(L.xp.btn)}</button></div>`;
  }

  function copiar(txt) { return `<button class="btn-copy" type="button" data-copy="${esc(txt)}" aria-label="${esc(t().copy)}">${icone("copy")}<span>${esc(t().copy)}</span></button>`; }
  function blocoCodigo(cmd) { return `<div class="code"><pre><code>${esc(cmd)}</code></pre>${copiar(cmd)}</div>`; }

  // --- páginas ---------------------------------------------------------------------
  // Número com contagem animada, ícone e dica flutuante
  function tile(v, rotulo, dica, ic, extra) {
    return `<div class="tile spot" tabindex="0" data-tip="${esc(dica)}"><div class="tile-top">${icone(ic)}<span class="tile-i" aria-hidden="true">i</span></div>
      <div class="tile-v"><span data-count="${v}">${nf(v)}</span>${extra ? ` <small>${extra}</small>` : ""}</div><div class="tile-l">${esc(rotulo)}</div></div>`;
  }

  function miniTestes(T) {
    const L = t();
    return `<span class="round-chips">${T.testes.map((x) => `<span class="mini mini-${status(x)}" data-tip="${esc(`${numTeste(x.id)}. ${nomeTeste(x.id)}\n${L.th_anom}: ${nf(x.sinal)} · ${L.th_info}: ${nf(x.info)}`)}">${numTeste(x.id)}</span>`).join("")}</span>`;
  }
  // os 35 testes do turno nos cards da inicial (resumo.json: aud35, lido dos arquivos do Relatório Técnico de cada turno)
  // 1º turno: teste 11 como no Relatório (com as urnas que fecharam tarde); V1–V6 comparam os dois turnos e ficam no card do 2º turno
  const UN_V = { V1: "uf", V2: "municipio", V3: "secao", V4: "secao", V5: "secao", V6: "secao" };
  function mini35(n) {
    const L = t(), A35 = state.R.aud35 && state.R.aud35[n];
    if (!A35) return miniTestes(state.R.turnos[n]);
    const ZT = window.T35[state.lang] || window.T35.PT;
    const nome = (id) => (window.APP.audNome ? window.APP.audNome(id) : id);
    const chipM = (x) => {
      const k = x.id[0], rot = k === "T" ? String(numTeste(x.id)) : x.id;
      if (x.na) return `<span class="mini mini-na" data-tip="${esc(`${x.id}. ${nome(x.id)}\n${L.rc_na}`)}">${rot}</span>`;
      const uk = k === "T" ? UN_T[x.id] || "s" : k === "V" ? UN_V[x.id] : "s";
      const st = x.a > 0 ? "red" : x.i > 0 ? "amber" : "green";
      const extra = x.id === "T11" && A35.tardias ? `\n${L.rc_t11(nf(A35.tardias), nf(A35.tardias_votos.secoes), nf(A35.tardias_votos.votos))}` : "";
      return `<span class="mini mini-${st}" data-tip="${esc(`${k === "T" ? numTeste(x.id) : x.id}. ${nome(x.id)}\n${unTip(ZT, x.a, x.i, uk)}${extra}`)}">${rot}</span>`;
    };
    return `<span class="round-chips r35">${["T", "V", "L"].map((k) => `<span class="rc-g"><span class="rc-l">${esc(L.rc_g[k])}</span><span class="rc-c">${A35.testes.filter((x) => x.id[0] === k).map(chipM).join("")}</span></span>`).join("")}</span>`;
  }
  function metr35(n) {
    const L = t(), A35 = state.R.aud35 && state.R.aud35[n], T = state.R.turnos[n];
    if (!A35) return L.round_card(+n, nf(T.secoes_sinalizadas), pct(T.secoes_sinalizadas / T.entrada.secoes));
    return L.round_card(+n, nf(A35.secoes), pct(A35.secoes / A35.analisadas));
  }
  function tip35(n) {
    const L = t(), A35 = state.R.aud35 && state.R.aud35[n], T = state.R.turnos[n];
    const base = L.tip_round(nf(T.entrada.linhas), nf(T.entrada.secoes), nf(T.entrada.boletins), T.cab.emissao);
    if (!A35) return base;
    return (n === "1" ? L.rc_tip1(nf(A35.bu), nf(A35.tardias), nf(A35.log), nf(A35.secoes), nf(A35.analisadas))
      : L.rc_tip2(nf(A35.bu), nf(A35.var), nf(A35.log), nf(A35.secoes), nf(A35.analisadas))) + "\n\n" + base;
  }

  // --- Anomalias em destaque (seções "em números" da inicial) ------------------------------------------------------
  // dados: resumo.json → aud35[turno].dest (aud35.py, lido dos arquivos do Relatório Técnico de cada turno)
  // dica ao passar o mouse (data-tip) e painel ao clicar (mesmo painel das tabelas: cqPagina), com o botão da página no rodapé
  const dzA = (n) => state.R.aud35 && state.R.aud35[n];
  const dzHM = (h) => String(h || "").slice(0, 5);
  const dzDur = (min) => { const m = Math.floor(min); return t().dz.dur(Math.floor(m / 60), m % 60); };
  const dzNome = (it) => { const D = t().dz; return it.k === "tardias" ? D.tard_nome : it.k === "V" ? D.rot.V : (window.APP.audNome ? window.APP.audNome(it.t) : it.t); };
  const dzFam = (it) => (it.k === "tardias" ? "T" : it.t[0]);
  const dzId = (it) => (it.k === "V" ? "V3 · V4" : it.t);
  const dzPct = (n, it) => { const A35 = dzA(n); return it.u === "s" ? A35.analisadas : it.base || A35.analisadas; };
  // números do item já formatados (para as frases)
  function dzX(it) {
    const o = {};
    Object.entries(it.x || {}).forEach(([k, v]) => { if (typeof v === "number") o[k] = k === "pct_max" ? pct(v, 1) : nf(v); });
    return o;
  }
  function dzTip(n, it) {
    const D = t().dz, A35 = dzA(n), x = dzX(it), f = D.x[it.k];
    const lin = [`${dzId(it)} · ${D.rot[it.k] || dzNome(it)}`, `${nf(it.a)} ${D.un[it.u] || D.un.s} (${D.pct(pct(it.a / dzPct(n, it), it.a / dzPct(n, it) < 0.001 ? 3 : 2))})`];
    if (f) lin.push(f(x));
    const u = it.x && it.x.ult;
    if (u) lin.push(`${D.ult_mini} ${dzHM(u.hb)} (${D.ult_bsb})`);
    if (it.ufs && it.ufs.length) lin.push(`${D.mais}: ${it.ufs.slice(0, 3).map(([uf, q]) => `${uf} ${nf(q)}`).join(" · ")}`);
    lin.push(D.clique);
    return lin.join("\n");
  }
  function dzTile(n, it, gi) {
    const D = t().dz, x = dzX(it), f = D.x[it.k], u = it.x && it.x.ult;
    return `<div class="tile dz-tile spot${u ? " dz-grave-t" : ""}" role="button" tabindex="0" data-dz="${n}|${gi}" data-tip="${esc(dzTip(n, it))}">
      <div class="tile-top"><span class="dz-badge">${icone("alert")} ${esc(D.badge)}</span><span class="dz-id">${esc(dzId(it))}</span></div>
      <div class="tile-v"><span data-count="${it.a}">${nf(it.a)}</span> <small>${esc(D.un[it.u] || D.un.s)}</small></div>
      <div class="tile-l">${esc(D.rot[it.k] || dzNome(it))}</div>${f ? `<div class="dz-x">${esc(f(x))}</div>` : ""}
      ${u ? `<div class="dz-ult">${icone("clock")}<span>${esc(D.ult_mini)}</span><b>${esc(dzHM(u.hb))}</b></div>` : ""}</div>`;
  }
  // bloco de gravidade: o último voto depois do horário oficial, com a seção e o botão para conferir
  function dzUlt(n, u) {
    const D = t().dz, fim = state.lang === "EN" ? (n === "1" ? "5 pm" : "7 pm") : state.lang === "ES" ? (n === "1" ? "17 h" : "19 h") : n === "1" ? "17h" : "19h";
    const hora = u.h === u.hb ? `<b class="dz-g-h">${esc(dzHM(u.hb))}</b><span class="dz-g-s">${esc(D.ult_bsb)}</span>` : `<b class="dz-g-h">${esc(dzHM(u.hb))}</b><span class="dz-g-s">${esc(D.ult_dif(dzHM(u.hb), dzHM(u.h)))}</span>`;
    return `<section class="dz-grave"><p class="dz-g-k">${icone("alert")} ${esc(D.ult_k)}</p><div class="dz-g-r">${hora}</div>
      <p class="dz-g-d">${esc(D.ult_dur(dzDur(u.min), fim))}</p><p class="dz-g-o">${esc(D.ult_onde(titulo(u.nm_mun), u.uf, u.zona, u.secao, nf(u.v_apos)))}</p>
      <p class="btn-row"><a class="btn btn-sm" href="#/secao/${u.uf}/${u.zona}/${u.secao}" data-ir>${icone("search")} ${esc(D.ver_secao)}</a></p></section>`;
  }
  function dzUfs(it) {
    const D = t().dz; if (!it.ufs || !it.ufs.length) return "";
    const mx = it.ufs[0][1] || 1;
    return `<h3>${esc(D.ufs)}</h3><ol class="dz-ufs">${it.ufs.map(([uf, q]) => `<li><span class="dz-uf" title="${esc(ufNome(uf) || uf)}">${esc(uf)}</span><span class="dz-bar"><i style="width:${Math.max(4, Math.round((100 * q) / mx))}%"></i></span><b>${nf(q)}</b></li>`).join("")}</ol>`;
  }
  // textos do teste: objetivo e critério (boletins: testes_txt; logs: logs.js; variação: T35)
  function dzTxt(it) {
    const D = t().dz, R = state.R, ZT = window.T35[state.lang] || window.T35.PT;
    if (it.k === "tardias") return { obj: D.tard_obj, crit: D.tard_crit };
    if (it.k === "V") return { obj: `${ZT.V.V3[0]} ${ZT.V.V4[0]}`, crit: ZT.V.V3[2] };
    if (it.t[0] === "T") { const x = R.testes_txt[state.lang][it.t] || {}; return { obj: x.objetivo, crit: x.criterio }; }
    const lx = window.APP.logsL && window.APP.logsL.txt(it.t), z = ZT.L && ZT.L[it.t];
    return { obj: (lx && lx.objetivo) || (z && z[0]), crit: (lx && lx.criterio) || (z && z[2]) };
  }
  function dzPainel(n, it) {
    const L = t(), D = L.dz, A35 = dzA(n), x = it.x || {}, rt = L.round(+n), base = dzPct(n, it);
    const un = D.un[it.u] || D.un.s;
    const pares = [[D.th_a, `<b>${nf(it.a)}</b> <small>${esc(un)} (${pct(it.a / base, it.a / base < 0.001 ? 3 : 2)})</small>`]];
    if (it.i) pares.push([D.th_i, `${nf(it.i)} <small>${esc(un)}</small>`]);
    pares.push([it.u === "s" ? D.th_secs : D.th_base, nf(base)]);
    const un2 = { com_votos: D.u.secoes, votos: D.u.votos, votos_1h: D.u.votos, secoes_1h: D.u.secoes, u2h: D.u.secoes, u3h: D.u.secoes, u4h: D.u.secoes, tentativas: D.u.tent,
      religamentos: D.u.vezes, v_desligada: D.u.votos, sem_digital: "", seq_max: D.u.lib, V3: D.u.secoes, V4: D.u.secoes, a_menos: D.u.votos, a_mais: D.u.votos, max: D.u.votos };
    Object.keys(D.xd).forEach((k) => {
      if (x[k] == null || typeof x[k] === "object") return;
      if (k === "enc_max") { pares.push([D.xd.enc_max, `${esc(dzHM(x.enc_max))} <small>(+${esc(dzDur(x.enc_max_min))})</small>`]); return; }
      if (k === "a_mais" && !x.a_mais || k === "a_menos" && !x.a_menos) return;
      const v = k === "pct_max" ? pct(x[k], 1) : nf(x[k]);
      pares.push([D.xd[k], `${v}${un2[k] ? ` <small>${esc(un2[k])}</small>` : ""}`]);
    });
    const tx = dzTxt(it);
    const corpo = `${x.ult ? dzUlt(n, x.ult) : ""}<section class="tp-ap"><h3>${esc(n === "1" ? L.stats1_title : L.stats_title)}</h3>${tpDl(pares)}</section>${dzUfs(it)}
      ${tx.obj ? `<h3>${esc(D.obj)}</h3><p>${esc(tx.obj)}</p>` : ""}${tx.crit ? `<h3>${esc(D.crit)}</h3><p>${esc(tx.crit)}</p>` : ""}<p class="note small">${icone("help")} ${esc(D.nota)}</p>`;
    let acoes = "", href = "";
    if (it.k === "tardias") { href = "#/encerramento-tardio"; acoes = tpBtn(href, "clock", D.ab.et, true) + tpBtn(`#/logs?t=${n}&teste=L01&nivel=a`, "list", D.ver_l01); }
    else if (it.k === "V") { href = "#/variacao"; acoes = tpBtn(href, "swap", D.ab.vr, true) + tpBtn("#/testes/V3", "flask", D.ver_teste); }
    else if (it.t[0] === "L") { href = `#/logs?t=${n}&teste=${it.t}&nivel=a`; acoes = tpBtn(href, "list", D.ab.lg, true) + tpBtn(`#/testes/${it.t}`, "flask", D.ver_teste); }
    else { href = `#/testes/${it.t}`; acoes = tpBtn(href, "flask", D.ab.tst, true) + tpBtn(`#/lista?t=${n}&teste=${it.t}`, "list", D.ver_secs); }
    return { tipo: "info", e: {}, d: null, href, kick: `${rt} · ${L.rc_g[dzFam(it)]} · ${dzId(it)}`, tit: dzNome(it), sub: it.k === "tardias" ? D.tard_sub : D.rot[it.k] || "", corpo, acoes, dica: "" };
  }
  // painel do total: seções com anomalia por bloco de testes e os testes com mais seções
  function dzPainelTotal(n) {
    const L = t(), D = L.dz, A35 = dzA(n), rt = L.round(+n);
    const pares = [[D.th_secs, nf(A35.analisadas)], [D.tot_bu, `${nf(A35.bu)} <small>${esc(D.u.secoes)}</small>`]];
    if (A35.tardias) pares.push([D.tot_tard, `${nf(A35.tardias)} <small>${esc(D.u.secoes)}</small>`]);
    if (A35.var != null) pares.push([D.tot_var, `${nf(A35.var)} <small>${esc(D.u.secoes)}</small>`]);
    pares.push([D.tot_log, `${nf(A35.log)} <small>${esc(D.u.secoes)}</small>`], [D.tot_sem, `<b>${nf(A35.secoes)}</b> (${pct(A35.secoes / A35.analisadas)})`]);
    const ZT = window.T35[state.lang] || window.T35.PT;
    const top = A35.testes.filter((x) => x.a > 0).sort((a, b) => b.a - a.a).slice(0, 8);
    const nomeT = (x) => (window.APP.audNome ? window.APP.audNome(x.id) : x.id);
    const lista = `<h3>${esc(D.tot_top)}</h3><ol class="dz-ufs dz-tst">${top.map((x) => { const uk = x.id[0] === "T" ? UN_T[x.id] || "s" : x.id[0] === "V" ? UN_V[x.id] : "s";
      return `<li><span class="dz-uf">${esc(x.id)}</span><span class="dz-tn">${esc(nomeT(x))}</span><b>${nf(x.a)} <small>${esc(ZT.un_t[uk])}</small></b></li>`; }).join("")}</ol>`;
    const nT = A35.testes.filter((x) => !x.na).length;
    const corpo = `<section class="tp-ap"><h3>${esc(D.tot_t)}</h3>${tpDl(pares)}<p class="small muted">${esc(D.tot_x)}</p></section>${lista}<p class="note small">${icone("help")} ${esc(D.nota)}</p>`;
    return { tipo: "info", e: {}, d: null, href: `#/turno/${n}`, kick: D.tot_k(rt), tit: D.tot_t, sub: D.tot_sub(nT), corpo,
      acoes: tpBtn(`#/turno/${n}`, "chart", D.ab.turno(rt), true) + tpBtn("#/testes", "flask", D.ver35), dica: "" };
  }
  // tabela "invisível" do painel: linha 0 = total; 1… = destaques (setas do painel passam por todos)
  const dzRes = {};
  function dzAbrir(n, gi) {
    const A35 = dzA(n), CP = window.APP.cqPagina; if (!A35 || !CP) return;
    const itens = A35.dest;
    if (!dzRes[n] || dzRes[n].lang !== state.lang) {
      dzRes[n] = { lang: state.lang, id: CP.novoId(), m: { colunas: ["k"], linhas: [["total"]].concat(itens.map((x) => [x.k])) }, idx: [], pag: 0, pp: 999, ord: null, sel: null, G: null,
        ler: tpVazio, fonte: (e, d, l, i) => Promise.resolve(i === 0 ? dzPainelTotal(n) : dzPainel(n, itens[i - 1])), fonteId: `dz${n}`, chave: (l, i) => `dz|${n}|${i}`,
        rot: ["k"], semNum: true, animRolar: true, guiaPainel: false, box: document.createElement("div"), navRot: (k, q) => `${nf(k)} / ${nf(q)}` };
      CP.ordenar(dzRes[n]);
    }
    CP.abrir(gi, dzRes[n]);
  }
  document.addEventListener("click", (e) => { const el = e.target.closest && e.target.closest("[data-dz]"); if (!el) return; e.preventDefault(); const [n, gi] = el.dataset.dz.split("|"); dzAbrir(n, +gi); });
  document.addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const el = e.target.closest && e.target.closest("[data-dz]"); if (!el) return; e.preventDefault(); const [n, gi] = el.dataset.dz.split("|"); dzAbrir(n, +gi); });
  function dzSecao(n) {
    const L = t(), A35 = dzA(n); if (!A35 || !A35.dest) return "";
    return `<h3 class="dz-h">${icone("alert")} ${esc(L.dz.t(L.round(+n)))}</h3><p class="sec-sub small">${esc(L.dz.sub)}</p>
      <div class="tiles tiles-3 dz-tiles">${A35.dest.map((it, i) => dzTile(n, it, i + 1)).join("")}</div>`;
  }
  // número clicável (abre o painel do total ou de um destaque)
  function tileDz(n, gi, v, rotulo, dica, ic, extra) {
    return `<div class="tile spot dz-num" role="button" tabindex="0" data-dz="${n}|${gi}" data-tip="${esc(dica)}"><div class="tile-top">${icone(ic)}<span class="tile-i" aria-hidden="true">i</span></div>
      <div class="tile-v"><span data-count="${v}">${nf(v)}</span>${extra ? ` <small>${extra}</small>` : ""}</div><div class="tile-l">${esc(rotulo)}</div></div>`;
  }

  // 1º turno em números: totais da auditoria completa e as anomalias em destaque (com as urnas que fecharam tarde)
  function secao1Numeros() {
    const L = t(), D = L.dz, A35 = dzA("1"), T1 = state.R.turnos["1"], P1 = T1.presidente;
    if (!A35 || !A35.dest) return "";
    const td = A35.dest.findIndex((x) => x.k === "tardias"), it = A35.dest[td], x = it ? it.x : null;
    const nT = A35.testes.filter((y) => !y.na).length;
    const tl = [
      tile(A35.analisadas, L.st_secoes, L.tip_secoes(nf(T1.entrada.linhas)), "grid"),
      tile(nT, D.st_testes1, D.tip_testes1, "flask"),
      tileDz("1", 0, A35.secoes, D.st_anom1, D.tip_anom(nf(A35.bu), nf(A35.log), ""), "flag", `(${pct(A35.secoes / A35.analisadas)})`),
      x ? tileDz("1", td + 1, it.a, D.st_tard, D.tip_tard(nf(x.com_votos), nf(x.votos)), "clock", `(${pct(it.a / x.analisadas)})`) : "",
      x ? tileDz("1", td + 1, x.votos, D.st_vapos, D.tip_vapos(nf(x.com_votos)), "vote") : "",
      tile(P1.comparecimento, L.st_comp, L.tip_comp(nf(P1.comparecimento), nf(P1.aptos - P1.comparecimento)), "users", `(${pct(P1.comparecimento / P1.aptos)})`),
    ].join("");
    return `<section aria-labelledby="h-stats1"><h2 id="h-stats1">${esc(L.stats1_title)}</h2><p class="sec-sub small">${esc(L.stats1_sub)}</p>
      <div class="tiles tiles-3">${tl}</div>${dzSecao("1")}
    </section>`;
  }
  function paginaInicio() {
    const L = t(), R = state.R, T1 = R.turnos["1"], T2 = R.turnos["2"], P2 = T2.presidente;
    const tiles = [
      tile(T2.entrada.secoes, L.st_secoes, L.tip_secoes(nf(T2.entrada.linhas)), "grid"),
      tile(nTestes()[0], L.st_testes, audFim() ? L.tip_testes_fim : L.tip_testes, "flask", L.st_testes_x(nTestes()[1])),
      dzA("2") ? tileDz("2", 0, dzA("2").secoes, L.dz.st_anom35, L.dz.tip_anom(nf(dzA("2").bu), nf(dzA("2").log), nf(dzA("2").var)), "flag", `(${pct(dzA("2").secoes / dzA("2").analisadas)})`)
        : tile(T2.secoes_sinalizadas, L.st_sinal, L.tip_sinal, "flag", `(${pct(T2.secoes_sinalizadas / T2.entrada.secoes)})`),
      tile(P2.aptos, L.st_aptos, L.tip_aptos, "users"),
      tile(P2.comparecimento, L.st_comp, L.tip_comp(nf(P2.comparecimento), nf(P2.aptos - P2.comparecimento)), "vote", `(${pct(P2.comparecimento / P2.aptos)})`),
      tile(T2.entrada.boletins, L.st_bol, L.tip_bol, "file"),
    ].join("");
    const comOcorr = (T) => T.testes.filter((x) => x.sinal > 0 || x.info > 0).length;
    const pag = [
      { k: "r1", href: "#/turno/1", ic: "chart", m: metr35("1"), x: mini35("1"), tip: tip35("1") },
      { k: "r2", href: "#/turno/2", ic: "chart", m: metr35("2"), x: mini35("2"), tip: tip35("2") },
      { k: "tests", href: "#/testes", ic: "flask", m: audFim() ? L.m_tests_fim : L.m_tests, tip: (audFim() ? L.tip_tests_fim : L.tip_tests)(comOcorr(T1), comOcorr(T2)) },
    ];
    const cards = pag.map((c, i) => {
      const [tit, desc] = L.pg[c.k];
      const dentro = `<span class="pc-num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span class="pc-ico">${icone(c.ic)}</span>
        <span class="pc-title">${esc(tit)}</span><span class="pc-desc">${esc(desc)}</span>${c.x || ""}<span class="pc-metric">${esc(c.m)}</span>
        <span class="pc-go">${esc(c.bot ? L.pg_ask : L.pg_open)} ${icone("arrow")}</span>`;
      const cls = `page-card spot tilt${c.y ? " y" : ""}`;
      return `<a class="${cls}" href="${c.href}" data-tip="${esc(c.tip)}">${dentro}</a>`;
    }).join("");
    state.cartao = { kicker: L.round(2) + " · " + L.roundDate[2], titulo: L.hero_title,
      linhas: [[L.st_secoes, nf(T2.entrada.secoes)], [L.st_testes, txtTestes()], [L.st_sinal, `${nf(T2.secoes_sinalizadas)} (${pct(T2.secoes_sinalizadas / T2.entrada.secoes)})`],
        [L.st_aptos, nf(P2.aptos)], [L.st_comp, `${nf(P2.comparecimento)} (${pct(P2.comparecimento / P2.aptos)})`]], barras: [barrasTurno(2, 2)] };
    const ferr = MAIS.filter(([k]) => !["saved", "embed", "devs"].includes(k)).map(([k, h], i) => {
      const [tit, desc] = L.pg2[k];
      return `<a class="page-card spot tilt${i % 3 === 1 ? " y" : ""}" href="${h}"><span class="pc-ico">${icone(ICO_MAIS[k])}</span>
        <span class="pc-title">${esc(tit)}</span><span class="pc-desc">${esc(desc)}</span><span class="pc-go">${esc(L.pg_open)} ${icone("arrow")}</span></a>`;
    }).join("");
    return `
    <section class="hero">
      <canvas class="hero-canvas" aria-hidden="true"></canvas>
      <div class="hero-txt">
        <p class="kicker" data-scramble>${esc(L.hero_kicker)}</p>
        <h1 data-type>${esc(L.hero_title)}</h1>
        <p class="lead">${esc(L.hero_sub)}</p>
        <div class="hero-actions">
          <a class="btn btn-bot btn-lg" href="#/atlas">${icone("globe")} ${esc(L.bot_cta_btn)}</a>
          <a class="btn btn-primary btn-lg" href="#/secao">${icone("search")} ${esc(L.cta_lookup)}</a>
          <a class="btn btn-ghost btn-lg" href="#/downloads">${icone("download")} ${esc(L.cta_downloads)}</a>
        </div>
        ${acoes(true)}
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-ring"></div><div class="hero-ring r2"></div>
        <div class="hero-lens">${lente()}</div>
        <div class="float-chip c1"><span class="fc-ico">${icone("grid")}</span><span><b>${nf(T2.entrada.secoes)}</b>${esc(L.hero_chip_sec)}</span></div>
        <div class="float-chip c2 y"><span class="fc-ico">${icone("flask")}</span><span><b>${nTestes()[0]}</b>${esc(L.hero_chip_tests)}</span></div>
        <div class="float-chip c3"><span class="fc-ico">${icone("check")}</span><span><b>2</b>${esc(L.hero_chip_rounds)}</span></div>
      </div>
    </section>
    ${window.APP.destaqueVariacao ? window.APP.destaqueVariacao(false) : ""}
    ${destaqueUnanimidade()}
    ${destaqueEncTardio()}
    <section aria-labelledby="h-stats"><h2 id="h-stats">${esc(L.stats_title)}</h2><p class="sec-sub small">${esc(L.stats_sub)}</p>
      <div class="tiles tiles-3">${tiles}</div>${dzSecao("2")}
    </section>
    ${secao1Numeros()}
    <section aria-labelledby="h-pages"><h2 id="h-pages">${esc(L.explore_title)}</h2><p class="sec-sub">${esc(L.explore_sub)}</p>
      <div class="pages">${cards}</div>
    </section>
    <section aria-labelledby="h-tools"><h2 id="h-tools">${esc(L.tools_title)}</h2><p class="sec-sub">${esc(L.tools_sub)}</p>
      <div class="pages pages-tools">${ferr}</div>
    </section>
    <section aria-labelledby="h-leg"><h2 id="h-leg">${esc(L.legend_title)}</h2>
      <ul class="legend">${L.legend.map(([c, n, d]) => `<li>${chip(c, n)} <span class="muted">${esc(d)}</span></li>`).join("")}</ul>
    </section>`;
  }

  // Destaque: o Atlas, página de consultas e conferências
  function destaqueAtlas() {
    const L = t(), X = L.at;
    return `<section class="at-dest" aria-labelledby="at-dest-h">
      <div class="at-dest-txt"><p class="kicker">${esc(X.dest_kicker)}</p><h2 id="at-dest-h"><span class="at-marca" aria-hidden="true">${icone("globe")}</span> ${esc(X.dest_t)}</h2><p>${esc(X.dest_txt)}</p>
        <div class="btn-row"><a class="btn btn-bot btn-lg" href="#/atlas">${icone("globe")} ${esc(X.dest_btn)}</a></div></div>
      <ul class="at-dest-l">${X.dest_itens.map(([ic, txt]) => `<li>${icone(ic)}<span>${esc(txt)}</span></li>`).join("")}</ul>
    </section>`;
  }

  // Destaque: urnas com 100% dos votos válidos para um só candidato a Presidente no 2º turno (só a contagem, sem juízo)
  function destaqueUnanimidade() {
    const L = t(), u = (nr) => (state.R.turnos["2"].unanimidade.find((x) => x.uf === "BR" && x.cargo === 1 && x.nr === nr) || { secoes: 0 }).secoes;
    const num = (k, n, txt) => `<div class="un-n vr-${k}"><span class="un-v" data-count="${n}">${nf(n)}</span><span>${esc(txt)}</span></div>`;
    return `<section class="vr-dest un-dest" aria-labelledby="un-h">
      <div class="vr-dest-txt"><p class="kicker">${esc(L.un_kicker)}</p><h2 id="un-h">${esc(L.un_title)}</h2><p>${esc(L.un_txt)}</p>
        <div class="btn-row"><a class="btn btn-primary" href="#/testes/T03">${icone("flask")} ${esc(L.un_btn)}</a><a class="btn btn-ghost" href="#/lista?t=2&teste=T03">${icone("list")} ${esc(L.un_btn2)}</a></div></div>
      <div class="vr-dest-nums">${num("l", u("13"), L.un_lula)}${num("f", u("22"), L.un_flavio)}</div>
    </section>`;
  }

  // Destaque: urnas que fecharam 1 h ou mais depois do horário oficial e votos gravados depois disso (log da urna)
  function destaqueEncTardio() {
    const L = t(), C = state.R.complementar || {}, ET = C.encerramento_tardio, VH = C.votos_apos_horario;
    if (!ET) return "";
    const T1 = ET.turnos["1"], T2 = ET.turnos["2"], v1 = VH && VH.turnos["1"];
    const num = (k, n, txt) => `<div class="un-n ef-${k}"><span class="un-v" data-count="${n}">${nf(n)}</span><span>${esc(txt)}</span></div>`;
    return `<section class="vr-dest un-dest ef-dest" aria-labelledby="ef-h">
      <div class="vr-dest-txt"><p class="kicker">${esc(L.ef_kicker)}</p><h2 id="ef-h">${esc(L.ef_title)}</h2><p>${esc(L.ef_txt)}</p><p class="small muted">${esc(L.ef_nota)}</p>
        <div class="btn-row"><a class="btn btn-primary" href="#/encerramento-tardio">${icone("clock")} ${esc(L.ef_btn)}</a><a class="btn btn-ghost" href="#/testes/T11">${icone("flask")} ${esc(L.ef_btn2)}</a></div></div>
      <div class="vr-dest-nums">${num("a", T1.sinalizadas, L.ef_n1(pct(T1.sinalizadas / T1.analisadas)))}${v1 && v1.votos_1h != null ? num("r", v1.votos_1h, L.ef_n2(pct(v1.votos_1h / (v1.votos_dia || 1)))) : ""}${num("b", T2.sinalizadas, L.ef_n3)}</div>
    </section>`;
  }

  // Lente de análise no topo: curva normal, limiar do z robusto e pontos fora da curva (esquema ilustrativo)
  function lente() {
    const L = t(), Pm = state.R.parametros, cx = 200, base = 245, s = 30, zl = Pm.LIMIAR_Z_ROBUSTO;
    const dec = (x) => (state.lang === "EN" ? String(x) : String(x).replace(".", ","));
    const c1 = (v) => v.toFixed(1);
    let curva = "", marcas = "", grade = "", pts = "";
    for (let x = 56; x <= 344; x += 4) { const z = (x - cx) / s; curva += `${x === 56 ? "M" : "L"}${x} ${c1(base - 118 * Math.exp(-z * z / 2))}`; }
    for (let i = 0; i < 72; i++) {
      const a = i * Math.PI / 36, r2 = i % 6 ? 172 : 162;
      marcas += `M${c1(200 + 180 * Math.cos(a))} ${c1(200 + 180 * Math.sin(a))}L${c1(200 + r2 * Math.cos(a))} ${c1(200 + r2 * Math.sin(a))}`;
    }
    for (let k = 32; k < 400; k += 24) grade += `M${k} 0V400M0 ${k}H400`;
    let sd = 11;
    const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 56; i++) {
      const z = Math.max(-2.9, Math.min(2.9, Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd())));
      pts += `<circle cx="${c1(cx + z * s)}" cy="${c1(262 + rnd() * 30)}" r="2.6"/>`;
    }
    const xa = cx - zl * s, xb = cx + zl * s, fora = [[cx - 3.9 * s, 271], [cx + 4.3 * s, 282]];
    let eixo = "";
    for (let k = -4; k <= 4; k++) eixo += `M${cx + k * s} ${base}v${k ? 5 : 8}`;
    const [ox, oy] = fora[1];
    const mira = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => `M${ox + a * 13} ${oy + b * 13 - b * 6}v${b * 6}h${-a * 6}`).join("");
    return `<svg viewBox="0 0 400 400" focusable="false">
      <defs>
        <radialGradient id="ln-g" cx="40%" cy="32%" r="75%"><stop offset="0" class="ln-g0"/><stop offset="1" class="ln-g1"/></radialGradient>
        <linearGradient id="ln-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ln-a0"/><stop offset="1" class="ln-a1"/></linearGradient>
        <linearGradient id="ln-s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="ln-s0"/><stop offset="1" class="ln-s1"/></linearGradient>
        <clipPath id="ln-c"><circle cx="200" cy="200" r="176"/></clipPath>
      </defs>
      <circle class="ln-bg" cx="200" cy="200" r="180"/>
      <g clip-path="url(#ln-c)">
        <path class="ln-grid" d="${grade}"/>
        <rect class="ln-zone" x="40" y="118" width="${xa - 40}" height="182"/><rect class="ln-zone" x="${xb}" y="118" width="${360 - xb}" height="182"/>
        <path class="ln-lim" d="M${xa} 118V300M${xb} 118V300"/>
        <path class="ln-area" d="${curva}L344 ${base}L56 ${base}Z"/>
        <path class="ln-curve" pathLength="1" d="${curva}"/>
        <path class="ln-axis" d="M48 ${base}H352${eixo}"/>
        <g class="ln-dots">${pts}</g>
        ${fora.map(([x, y], i) => `<circle class="ln-ring" style="animation-delay:${i * -1}s" cx="${x}" cy="${y}" r="5"/><circle class="ln-out" cx="${x}" cy="${y}" r="3.6"/>`).join("")}
        <path class="ln-mira" d="${mira}"/>
        <g class="ln-scan"><rect x="-40" y="64" width="40" height="272" fill="url(#ln-s)"/><path d="M0 64V336"/></g>
      </g>
      <path class="ln-ticks" d="${marcas}"/>
      <text class="ln-t1" x="200" y="84" text-anchor="middle">${esc(L.lens_title)}</text>
      <text class="ln-t2" x="200" y="104" text-anchor="middle">z = (x − med) / (${dec(1.4826)} · MAD)</text>
      <text class="ln-t3" x="${xa - 4}" y="132" text-anchor="end">−${dec(zl)}</text><text class="ln-t3" x="${xb + 4}" y="132">+${dec(zl)}</text>
      <text class="ln-t3" x="${ox + 15}" y="${oy - 20}" text-anchor="end">z = ${dec(4.3)}</text>
      <text class="ln-t4" x="200" y="322" text-anchor="middle">FDR Benjamini–Hochberg · q = ${dec(Pm.ALFA_FDR)}</text>
    </svg>`;
  }

  function paginaTurno(n) {
    const L = t(), R = state.R, T = R.turnos[n];
    const P = T.presidente;
    const cands = P.candidatos.filter((c) => c.nr !== "95" && c.nr !== "96");
    const val = cands.reduce((a, c) => a + c.votos, 0);
    const br = P.candidatos.find((c) => c.nr === "95"), nu = P.candidatos.find((c) => c.nr === "96");
    const pres = barras(cands.map((c) => ({ rotulo: `${titulo(c.nome)} (${c.nr})`, valor: c.votos, texto: `${nf(c.votos)} · ${pct(c.votos / val)}`,
      dica: `${nf(c.votos)} · ${pct(c.votos / val)} ${L.valid}\n${titulo(c.nome)} (${c.nr})` })),
      { nota: `${esc(L.blank)}: ${nf(br.votos)} · ${esc(L.null_)}: ${nf(nu.votos)}. ${esc(L.r_pres_note(nf(P.comparecimento), nf(P.aptos), pct(P.comparecimento / P.aptos)))}` });
    const ZT = window.T35[state.lang] || window.T35.PT, unT = (tid) => ZT.un_t[unTeste(tid)], CORES = ["red", "amber", "green", "na"], T35n = testes35(n);
    const ou = (v, f) => (v == null ? "—" : f(v));
    const testes = tabelaTP({ id: `turno${n}-testes`, colunas: ["teste", "unidades", "sinal", "info", "brutos", "taxa", "situacao"],
      rot: [L.th_test, L.th_units, L.th_anom, L.th_info, L.th_raw, L.th_rate, L.th_status],
      linhas: T35n.map((x) => [x.id, x.na ? null : x.unidades || 0, x.na ? null : x.sinal, x.na ? null : x.info, x.brutos, !x.na && x.unidades ? x.sinal / x.unidades : null, x.na ? 3 : CORES.indexOf(status(x))]),
      fmt: [(id) => `<span class="lg-catc">${numTeste(id)}. ${esc(nomeTeste(id))}</span>`, (v) => ou(v, nf), (v) => ou(v, nf), (v) => ou(v, nf), (v) => ou(v, nf),
        (v) => ou(v, (y) => pct(y, 3)), (v) => chip(CORES[v], [L.st_red, L.st_amber, L.st_green, L.st_na][v])],
      cls: "num-cols", dicaLinha: true, ler: tpVazio, chave: (l) => `teste|${n}|${l[0]}`, fonte: (e, d, l) => Promise.resolve(painelTesteTurno(n, l[0])),
      dicaExtra: (dd, r, gi) => (r.m.linhas[gi][1] == null ? `<div class="cq-d-t">${esc(L.st_na_x)}</div>` : `<div class="cq-d-t">${esc(L.th_units)}: ${nf(r.m.linhas[gi][1])} ${esc(unT(r.m.linhas[gi][0]))}</div>`) },
    tabela([L.th_test, L.th_units, L.th_anom, L.th_info, L.th_raw, L.th_rate, L.th_status],
      T35n.map((x) => [`<a href="#/testes/${x.id}">${numTeste(x.id)}. ${esc(nomeTeste(x.id))}</a>`, x.na ? "—" : nf(x.unidades || 0), x.na ? "—" : nf(x.sinal), x.na ? "—" : nf(x.info),
        x.brutos == null ? "—" : nf(x.brutos), !x.na && x.unidades ? pct(x.sinal / x.unidades, 3) : "—", chipStatus(x)]), "num-cols"));
    const ufs = T.uf.slice().sort((a, b) => b.sinal / b.secoes - a.sinal / a.secoes);
    const ufBar = barras(ufs.map((u) => ({ rotulo: u.uf, valor: u.sinal / u.secoes, texto: pct(u.sinal / u.secoes),
      dica: `${pct(u.sinal / u.secoes)}\n${ufNome(u.uf)}: ${nf(u.sinal)} / ${nf(u.secoes)} ${L.th_sections.toLowerCase()}` })));
    const ufBloco = (u) => `<section class="tp-ap"><h3>${esc(L.tp.uf_t(L.round(+n)))}</h3>${tpDl([[L.th_sections, nf(u.secoes)], [L.th_flagged, `${nf(u.sinal)} (${pct(u.sinal / u.secoes)})`]])}<p class="small muted">${esc(L.tp.uf_nota)}</p></section>`;
    const ufTab = tabelaTP({ id: `turno${n}-ufs`, colunas: ["uf", "secoes", "sinal", "pct"], rot: [L.th_uf, L.th_sections, L.th_flagged, L.th_pct],
      linhas: ufs.map((u) => [u.uf, u.secoes, u.sinal, u.sinal / u.secoes]), fmt: [(v) => `${v} – ${esc(ufNome(v))}`, (v) => nf(v), (v) => nf(v), (v) => pct(v)],
      cls: "num-cols", turno: +n, ler: (l) => Object.assign(tpVazio(), { uf: l[0] }), chave: (l) => `uf|${n}|${l[0]}`,
      fonte: (e, d, l) => window.APP.cqPagina.fonteUf(l[0]), painelTopo: (dd, r, gi) => ufBloco(ufs[gi]),
      dicaExtra: (dd, r, gi) => `<div class="cq-d-t">${esc(L.th_flagged)}: ${nf(r.m.linhas[gi][2])} ${esc(L.th_sections.toLowerCase())} (${pct(r.m.linhas[gi][3])})</div>` },
    tabela([L.th_uf, L.th_sections, L.th_flagged, L.th_pct], ufs.map((u) => [`${u.uf} – ${esc(ufNome(u.uf))}`, nf(u.secoes), nf(u.sinal), pct(u.sinal / u.secoes)]), "num-cols"));
    // Sem seções convergentes (2º turno), a seção não aparece
    const conv = T.convergentes.length
      ? `<section><h2>${esc(L.r_conv_title)}</h2><p class="small muted">${esc(L.r_conv_sub)}</p>${tabelaTP({ id: `turno${n}-conv`, colunas: ["uf", "municipio", "zona", "secao", "testes"],
        rot: ["UF", L.th_mun, L.th_zone, L.th_section, L.th_tests], linhas: T.convergentes.map((c) => [c.uf, titulo(c.mun), c.zona, c.secao, c.testes]),
        fmt: [(v) => esc(v), (v) => `<span class="et-mun">${esc(v)}</span>`, (v) => String(v), (v) => String(v), (v) => esc(v.split(",").map(numTeste).join(", "))],
        temSec: true, ler: (l) => Object.assign(tpVazio(), { uf: l[0], z: l[2], s: l[3], t: +n }),
        painelTopo: (dd, r, gi) => `<section class="tp-ap"><h3>${esc(L.tp.conv_t)}</h3><ul class="plain">${r.m.linhas[gi][4].split(",").map((x) => `<li>${esc(L.th_test)} ${numTeste(x)}. ${esc(nomeTeste(x))}</li>`).join("")}</ul><p class="small muted">${esc(L.r_conv_sub)}</p></section>`,
        dicaExtra: (dd, r, gi) => `<div class="cq-d-t">${esc(L.th_tests)}: ${esc(r.m.linhas[gi][4].split(",").map(numTeste).join(", "))}</div>` },
        tabela(["UF", L.th_mun, L.th_zone, L.th_section, L.th_tests], T.convergentes.map((c) => [c.uf, esc(titulo(c.mun)), c.zona,
        `<a href="#/secao/${c.uf}/${c.zona}/${c.secao}">${c.secao}</a>`, c.testes.split(",").map((x) => `<a href="#/testes/${x}">${numTeste(x)}</a>`).join(", ")])))}</section>`
      : "";
    const un = T.unanimidade.filter((u) => u.uf === "BR");
    const unPainel = (u) => {
      const c = P.candidatos.find((y) => y.nr === u.nr);
      return { tipo: "info", e: {}, d: null, href: `#/lista?t=${n}&teste=T03`, kick: `${L.round(+n)} · ${L.cd_pres}`, tit: `${titulo(u.nome)} (${u.nr})`, sub: L.r_un_title,
        corpo: `<section class="tp-ap"><h3>${esc(L.tp.un_t)}</h3>${tpDl([[L.th_100, `${nf(u.secoes)} <small>${esc(L.tp.secoes)}</small>`], [L.th_improv, `${nf(u.improv)} <small>${esc(L.tp.secoes)}</small>`],
          c ? [L.tp.votos_br, `${nf(c.votos)} (${pct(c.votos / val)} ${esc(L.valid)})`] : null])}<p class="small muted">${esc(L.tp.un_nota)}</p></section>`,
        acoes: tpBtn(`#/lista?t=${n}&teste=T03`, "list", L.tp.ver_lista(3), true) + tpBtn("#/testes/T03", "flask", L.tp.ver_teste),
        dica: `<div class="cq-d-t">${esc(L.th_100)}: ${nf(u.secoes)} · ${esc(L.th_improv)}: ${nf(u.improv)}</div>` };
    };
    const unTab = tabelaTP({ id: `turno${n}-un`, colunas: ["cand", "secoes", "improv"], rot: [L.th_cand, L.th_100, L.th_improv],
      linhas: un.map((u) => [`${titulo(u.nome)} (${u.nr})`, u.secoes, u.improv]), fmt: [(v) => esc(v), (v) => nf(v), (v) => nf(v)], cls: "num-cols",
      ler: tpVazio, chave: (l) => `un|${n}|${l[0]}`, fonte: (e, d, l, gi) => Promise.resolve(unPainel(un[gi])) },
    tabela([L.th_cand, L.th_100, L.th_improv], un.map((u) => [`${esc(titulo(u.nome))} (${u.nr})`, nf(u.secoes), nf(u.improv)]), "num-cols"));
    const insp = T.klimek.filter((k) => k.insp).map((k) => `${esc(ufRotulo(k.uf))} (${esc(titulo(k.nome))})`).join(", ") || "—";
    const g = (nr, tipo) => `${PASTA}/resultados-${n}turno/graficos/klimek_${n}t_${nr}_${tipo}.png`;
    const fig = (nr, tipo, cap) => `<figure><a href="${g(nr, tipo)}" target="_blank" rel="noopener"><img src="${g(nr, tipo)}" alt="${esc(cap)}" loading="lazy"></a><figcaption>${esc(cap)}</figcaption></figure>`;
    const lider = cands.slice(0, 2);
    const ig = T.integridade;
    const integ = L.r_integ({ cesp: nf(ig["cesp:st_confere"] || 0), bu: nf(ig["bu:st_csv"] || 0), buOk: ig["bu:st_confere"] ? nf(ig["bu:st_confere"]) : "",
      nucleo: esc(T.cab.nucleo_sha256), manif: esc(T.cab.manifesto_sha512), emissao: esc(T.cab.emissao), versao: esc(T.cab.motor || R.motor.versao), dur: esc(T.cab.duracao) });
    const rel = ["PT", "EN", "ES"].map((lg) => { const p = `${PASTA}/resultados-${n}turno/Relatorio_Tecnico_Auditoria_Eleicoes_2026_${lg}.md`;
      return `<a class="btn" href="${p}" download>${icone("download")} ${esc(L.report_lang[lg])}</a>`; }).join("");
    state.cartao = { kicker: L.roundDate[n], titulo: `${L.round(+n)} · ${L.cd_pres}`, itens: barrasTurno(n, +n === 1 ? 6 : 2).itens.map((x) => ["b"].concat(x))
      .concat([[L.st_comp, `${nf(P.comparecimento)} (${pct(P.comparecimento / P.aptos)})`], [L.blank, nf(br.votos)], [L.null_, nf(nu.votos)],
        [L.r_flagged, `${nf(T.secoes_sinalizadas)} (${pct(T.secoes_sinalizadas / T.entrada.secoes)})`]].map((x) => ["l"].concat(x))) };
    return `
    <header class="page-head"><nav class="turno-sel" aria-label="${esc(L.nav.turno_sel)}">${[1, 2].map((k) => `<a href="#/turno/${k}"${+n === k ? ' aria-current="page"' : ""}>${esc(L.round(k))}</a>`).join("")}</nav>
      <p class="kicker">${esc(L.roundDate[n])}</p><h1>${esc(L.round(+n))}</h1>
      <p class="muted">${esc(L.r_processed(nf(T.entrada.linhas), nf(T.entrada.secoes), nf(T.entrada.boletins)))}</p>${acoes(true)}</header>
    <div class="tiles">
      ${tile(T.secoes_sinalizadas, L.r_flagged, L.tip_sinal, "flag", `(${pct(T.secoes_sinalizadas / T.entrada.secoes)})`)}
      ${tile(P.aptos, L.st_aptos, L.tip_aptos, "users")}
      ${tile(P.comparecimento, L.st_comp, L.tip_comp(nf(P.comparecimento), nf(P.aptos - P.comparecimento)), "vote", `(${pct(P.comparecimento / P.aptos)})`)}
    </div>
    ${n === "2" && window.APP.destaqueVariacao ? window.APP.destaqueVariacao(true) : ""}
    <section class="card"><h2>${esc(L.r_pres_title)}</h2>${pres}</section>
    <section><h2>${esc(L.r_tests_title)}</h2>${testes}
      <p class="note t35-turno">${icone("flask")} <span>${esc((window.T35[state.lang] || window.T35.PT).turno_nota)} <a href="#/testes">${esc((window.T35[state.lang] || window.T35.PT).ver35)}</a></span></p></section>
    ${window.APP.turnoHorario ? window.APP.turnoHorario(n) : ""}
    <section class="card"><div class="h-row"><h2>${esc(L.r_uf_title)}</h2><button class="btn btn-sm btn-ghost" type="button" data-toggle-view="uf">${esc(L.show_table)}</button></div>
      <p class="small muted">${esc(L.r_uf_sub)}</p><div data-view="uf-chart">${ufBar}</div><div data-view="uf-table" hidden>${ufTab}</div></section>
    ${conv}
    <section><h2>${esc(L.r_un_title)}</h2>${unTab}</section>
    <section><h2>${esc(L.r_klimek_title)}</h2><p>${esc(L.r_klimek_sub)} <b>${insp}</b></p>
      <div class="figs">${lider.map((c) => fig(c.nr, "brasil", L.r_klimek_br(titulo(c.nome)))).join("")}${lider.map((c) => fig(c.nr, "por_uf", L.r_klimek_uf(titulo(c.nome)))).join("")}</div></section>
    <section class="card"><h2>${esc(L.r_integ_title)}</h2><ul class="plain">${integ.map((x) => `<li>${x}</li>`).join("")}</ul></section>
    <section><h2>${esc(L.r_dl_title)}</h2><div class="btn-row">${rel}<a class="btn btn-ghost" href="#/downloads">${esc(L.all_files)}</a></div></section>
    ${botCta()}`;
  }

  function paginaTestes(foco) {
    const L = t(), R = state.R, X = state.extra;
    const cards = Object.keys(R.testes_txt[state.lang]).sort().map((tid) => {
      const tx = R.testes_txt[state.lang][tid];
      const r1 = R.turnos["1"].testes.find((x) => x.id === tid), r2 = R.turnos["2"].testes.find((x) => x.id === tid);
      const ZT = window.T35[state.lang] || window.T35.PT, uk = UN_T[tid] || "s";
      const res = (r, n) => `<span class="res" title="${esc(unTip(ZT, r.sinal, r.info, uk))}"><span class="muted">${esc(L.round(n))}:</span> ${chip(status(r), `${nf(r.sinal)} / ${nf(r.info)} ${ZT.un_t[uk]}`)}</span>`;
      const codigo = X.funcs[tid].map((f) => `<a href="${BLOB}#L${f.ini}-L${f.fim}" target="_blank" rel="noopener"><code>${esc(f.nome)}</code></a>`).join(" · ");
      const cp = tid === "T11" && R.complementar && R.complementar.encerramento_tardio, cpn = (n) => nf(cp.turnos[n].sinalizadas);
      const prev = cp ? `<div class="note enc-nota"><h3>${icone("help")} ${esc(L.ex.enc_t)}</h3><p>${esc(L.ex.enc_nota(cpn(1), cpn(2)))}</p>
        <p class="btn-row"><a class="btn btn-sm btn-primary" href="#/encerramento-tardio">${icone("clock")} ${esc(L.ex.et_title)}</a><a class="btn btn-sm" href="#/lista?teste=T11&nivel=a">${icone("list")} ${esc(L.f_list)}</a><a class="btn btn-sm btn-ghost" href="site/data/complementar/encerramento_tardio.csv" download>${icone("download")} ${esc(L.ex.enc_csv)}</a><a class="btn btn-sm btn-ghost" href="site/data/complementar/encerramento_tardio.py" download>${icone("code")} ${esc(L.ex.enc_py)}</a></p></div>` : "";
      const vhr = tid === "T11" && R.complementar && R.complementar.votos_apos_horario;
      const prevVh = vhr ? `<div class="note enc-nota"><h3>${icone("clock")} ${esc(L.ex.vh_t)}</h3><p>${esc(L.ex.vh_info(nf(vhr.turnos[1].secoes), nf(vhr.turnos[1].votos_1h), nf(vhr.turnos[1].secoes_1h), nf(vhr.turnos[2].secoes), nf(vhr.turnos[2].votos_1h)))}</p>
        <p class="btn-row"><a class="btn btn-sm btn-ghost" href="${vhr.csv_secoes}" download>${icone("download")} ${esc(L.ex.vh_csv_secoes)}</a><a class="btn btn-sm btn-ghost" href="${vhr.script}" download>${icone("code")} ${esc(L.ex.vh_py)}</a></p>
        <p class="small">${esc(L.ex.vh_csv_todos)}: ${vhr.ufs.map((u) => `<a href="site/data/complementar/votos_apos_horario/${u}.csv.gz" download>${u}</a>`).join(" · ")}</p></div>` : "";
      return `<article class="test-card" id="${tid}">
        <details${foco === tid ? " open" : ""}>
          <summary><span class="tnum">${numTeste(tid)}</span><span class="tmain"><span class="tname">${esc(tx.nome)}</span><span class="ttype">${esc(tipoTeste(tid))}</span>
            <span class="tsimple">${esc(X.simples[state.lang][tid])}</span><span class="tres">${res(r1, 1)}${res(r2, 2)}</span>${cp ? `<span class="tprev small">${esc(L.ex.enc_resumo(cpn(1), cpn(2), nf(r1.sinal + cp.turnos[1].sinalizadas), nf(r2.sinal + cp.turnos[2].sinalizadas)))}</span>` : ""}</span></summary>
          <div class="tbody">
            <h3>${esc(L.f_obj)}</h3><p>${esc(tx.objetivo)}</p>
            <h3>${esc(L.f_met)}</h3><p>${esc(tx.metodo)}</p>${prev}${prevVh}
            <h3>${esc(L.f_crit)}</h3><p>${esc(tx.criterio)}</p>
            <h3>${esc(L.f_lim)}</h3><p>${esc(tx.limites)}</p>
            <p class="btn-row"><a class="btn btn-bot btn-sm" href="${esc(linkAtlas(L.ask_test(numTeste(tid))))}">${icone("globe")} ${esc(L.f_ask)}</a>
            <a class="btn btn-sm" href="#/graficos/${tid}">${icone("chart")} ${esc(L.f_chart)}</a> <a class="btn btn-sm btn-ghost" href="#/lista?teste=${tid}">${icone("list")} ${esc(L.f_list)}</a>
            <span class="small">${icone("code")} ${esc(L.f_code)}: ${codigo}</span></p>
          </div></details></article>`;
    }).join("");
    const Z = window.T35[state.lang] || window.T35.PT, VR = L.vr, vres = (R.variacao || {}).testes || {};
    const corpo = (tx) => [[L.f_obj, tx[0]], [L.f_met, tx[1]], [L.f_crit, tx[2]], [L.f_lim, tx[3]]];
    const sec = (h, p, extra) => `<h3>${esc(h)}</h3><p>${esc(p)}</p>${extra || ""}`;
    const perguntar = (id) => `<a class="btn btn-bot btn-sm" href="${esc(linkAtlas(L.ask_test(id)))}">${icone("globe")} ${esc(L.f_ask)}</a>`;
    const simular = (id) => `<a class="btn btn-sm btn-ghost" href="#/simulador/${id}">${icone("lab")} ${esc(Z.sim)}</a>`;
    const cardsV = TESTES_V.map((id) => {
      const c = vres[id] || { a: 0, i: 0 }, cor = c.a ? "red" : c.i ? "amber" : "green";
      const codigo = FUNCS_V[id].map(([nm, a, b]) => `<a href="${BLOB_V}#L${a}-L${b}" target="_blank" rel="noopener"><code>${esc(nm)}</code></a>`).join(" · ");
      return `<article class="test-card tc-v" id="${id}"><details${foco === id ? " open" : ""}>
        <summary><span class="tnum">${id}</span><span class="tmain"><span class="tname">${esc(VR.nomes[id])}</span><span class="ttype">${esc(id === "V5" || id === "V6" ? L.det : L.stat)} · ${esc(Z.nivel[NIVEL_V[id]])}</span>
          <span class="tsimple">${esc(VR.curto[id])}</span><span class="tres"><span class="res" title="${esc(unTip(Z, c.a, c.i, NIVEL_V[id]))}"><span class="muted">${esc(Z.res_v)}:</span> ${chip(cor, `${nf(c.a)} / ${nf(c.i)} ${Z.un_t[NIVEL_V[id]]}`)}</span></span></span></summary>
        <div class="tbody">${corpo(Z.V[id]).map(([h, p]) => sec(h, p)).join("")}
          <p class="btn-row">${perguntar(id)} <a class="btn btn-sm" href="#/variacao">${icone("chart")} ${esc(Z.v_ver)}</a> ${simular(id)}
          <span class="small">${icone("code")} ${esc(L.f_code)}: ${codigo}</span></p></div></details></article>`;
    }).join("");
    const et = R.complementar && R.complementar.encerramento_tardio;
    const LL = window.APP.logsL && window.APP.logsL.ok() ? window.APP.logsL : null;   // testes L com resultado do 1º turno (logs.js)
    const cardsL = TESTES_L.map((id) => {
      const tx = Z.L[id], cp = id === "L01" && et ? `<div class="note enc-nota"><p>${icone("clock")} ${esc(LL ? L.ex.et_title : Z.l01_parcial)}</p><p class="btn-row"><a class="btn btn-sm btn-primary" href="#/encerramento-tardio">${esc(Z.l01_btn)}</a></p></div>` : "";
      const pronto = LL && LL.cartao(id, foco, Z, cp);
      if (pronto) return pronto;
      return `<article class="test-card tc-l" id="${id}"><details${foco === id ? " open" : ""}>
        <summary><span class="tnum">${id}</span><span class="tmain"><span class="tname">${esc(L.ex.aud_L[id])}</span><span class="ttype">${esc(Z.tipo_l)}</span>
          <span class="tsimple">${esc(tx[0])}</span><span class="tres"><span class="chip chip-and"><span class="dot" aria-hidden="true"></span>${esc(Z.andamento)}</span></span></span></summary>
        <div class="tbody">${sec(L.f_met, tx[1], `<p class="small muted">${esc(Z.viz)}</p>${cp}`)}${sec(L.f_crit, tx[2], `<p class="small t35-prelim">${icone("help")} ${esc(Z.prelim)}</p>`)}${sec(L.f_lim, tx[3])}
          <p class="btn-row">${perguntar(id)} ${simular(id)}</p></div></details></article>`;
    }).join("");
    const LT = LL && LL.textos();   // bloco L: 1º turno concluído, 2º turno em andamento
    const fimL = audFim();
    const blk = (k) => (k === "L" && LT ? [Z.blocos.L[0], fimL ? LT.bloco_l_fim : LT.bloco_l, fimL ? LT.bloco_l_p_fim : LT.bloco_l_p] : Z.blocos[k]);
    const bloco = (k, ok, html) => `<section class="t35-bloco" id="bloco-${k}" aria-labelledby="bloco-${k}-h"><div class="t35-h"><span class="t35-tag ${ok ? "t35-ok" : "t35-and"}">${esc(ok ? Z.concluido : k === "L" && LT ? LT.tag_l : Z.andamento)}</span>
      <h2 id="bloco-${k}-h">${esc(blk(k)[0])}</h2><p class="t35-n">${esc(blk(k)[1])}</p><p class="small muted">${esc(blk(k)[2])}</p></div><div class="tests">${html}</div></section>`;
    const nav = ["T", "V", "L"].map((k) => `<a class="t35-ir${k === "L" && !fimL ? " t35-ir-and" : ""}" href="#/testes/bloco-${k}"><b>${esc(blk(k)[0])}</b><span>${esc(blk(k)[1])}</span></a>`).join("");
    return `<header class="page-head"><h1>${esc(Z.titulo)}</h1><p class="lead">${esc(Z.sub)}</p>${A_aud()}${acoes(false)}
      <nav class="t35-nav" aria-label="${esc(Z.ir)}">${nav}</nav>
      <ul class="legend inline">${L.legend.map(([c, nm]) => `<li>${chip(c, nm)}</li>`).join("")}<li class="muted small">${esc(L.th_anom)} / ${esc(L.th_info)}</li></ul></header>
      ${bloco("T", true, cards)}${bloco("V", true, cardsV)}${bloco("L", fimL, cardsL)}${botCta()}`;
  }
  // barra de progresso da auditoria (extras.js), quando disponível
  const A_aud = () => (window.APP && window.APP.audBarra ? `<div class="t35-prog">${window.APP.audBarra()}</div>` : "");

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
      <div id="lk-saved"></div>
      <div id="lk-result" aria-live="polite"></div>${botCta()}`;
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
        // tabela padrão: dica e painel com o candidato nesta seção, no Brasil todo e no outro turno
        const nrs = cands.concat(["95", "96"]), outro = rec[3 - n] ? votosTurno(3 - n, rec[3 - n]) : null;
        const candPainel = (nr) => {
          const P = L.tp, bn = nr === "95" || nr === "96", pos = cands.indexOf(nr), vv = v[nr] || 0;
          const brC = state.R.turnos[n].presidente.candidatos, brVal = brC.filter((c) => c.nr !== "95" && c.nr !== "96").reduce((a, c) => a + c.votos, 0) || 1, brX = brC.find((c) => c.nr === nr);
          const ov = outro && outro.v[nr] != null ? outro.v[nr] : null, oVal = outro ? Object.keys(outro.v).filter((k) => k !== "95" && k !== "96").reduce((a, k) => a + outro.v[k], 0) || 1 : 1;
          const nome = bn ? (nr === "95" ? L.blank : L.null_) : `${titulo(nomes[nr])} (${nr})`;
          return { tipo: "info", e: {}, d: null, href: null, kick: `${L.round(n)} · ${L.th_zone} ${d.z} · ${L.th_section} ${d.s}`, tit: nome, sub: L.cd_pres,
            corpo: `<section class="tp-ap"><h3>${esc(P.cand_secao)}</h3>${tpDl([[P.votos, nf(vv)], bn ? [P.pct_comp, pct(vv / (tv[1] || 1))] : [P.pct_val, pct(vv / val)],
              bn ? null : [P.posicao, P.pos_de(pos + 1, cands.length)],
              !bn && pos > 0 ? [P.atras(titulo(nomes[cands[pos - 1]])), nf(v[cands[pos - 1]] - vv)] : null,
              !bn && pos === 0 && cands.length > 1 ? [P.frente(titulo(nomes[cands[1]])), nf(vv - v[cands[1]])] : null])}</section>
              <h3>${esc(P.comparar)}</h3>${tpDl([brX ? [P.no_brasil(L.round(n)), `${nf(brX.votos)}${bn ? "" : ` (${pct(brX.votos / brVal)} ${esc(L.valid)})`}`] : null,
                ov != null ? [P.outro_turno(L.round(3 - n)), `${nf(ov)}${bn ? "" : ` (${pct(ov / oVal)} ${esc(L.valid)})`}`] : null])}`,
            acoes: "", dica: `<div class="cq-d-t">${esc(P.votos)}: ${nf(vv)}${bn ? "" : ` · ${pct(vv / val)} ${esc(L.valid)}`}</div>${brX && !bn ? `<div class="cq-d-t">${esc(P.no_brasil(L.round(n)))}: ${pct(brX.votos / brVal)}</div>` : ""}` };
        };
        const tabCand = tabelaTP({ id: `secao-cand-${n}`, memo: `${d.uf}|${d.z}|${d.s}`, colunas: ["cand", "votos", "pct"], rot: [L.th_cand, L.tp.votos, "%"],
          linhas: nrs.map((nr) => [nr === "95" ? L.blank : nr === "96" ? L.null_ : `${titulo(nomes[nr])} (${nr})`, v[nr] || 0, nr === "95" || nr === "96" ? null : v[nr] / val]),
          fmt: [(x) => esc(x), (x) => nf(x), (x) => (x == null ? "" : pct(x))], cls: "num-cols", ler: tpVazio,
          chave: (l, gi) => `cand|${d.uf}|${d.z}|${d.s}|${n}|${nrs[gi]}`, fonte: (e, dd, l, gi) => Promise.resolve(candPainel(nrs[gi])) }, tabela([L.th_cand, L.lk_comp, "%"], linhas, "num-cols"));
        const kv = [[L.lk_aptos, nf(tv[0])], [L.lk_comp, `${nf(tv[1])} (${pct(tv[1] / tv[0], 1)})`], [L.lk_abst, nf(tv[0] - tv[1])],
          [L.lk_open, `${hora(tv[2])}`], [L.lk_close, `${hora(tv[3])}`]];
        if (tv[4]) kv.push([L.lk_agreg, esc(tv[4])]);
        corpo = `<dl class="kv">${kv.map(([k, x]) => `<div><dt>${esc(k)}</dt><dd>${x}</dd></div>`).join("")}</dl><p class="small muted">${esc(L.lk_open)}/${esc(L.lk_close)}: ${esc(L.lk_local)}.</p>`
          + tabCand;
      }
      let fl;
      if (f && f.o.length) {
        const catN = (c) => (R.categorias[c] || {})[state.lang] || c;
        const qTxt = (q) => (q == null ? "—" : dec(Number(q).toExponential(2)));
        const ocPainel = (o) => {
          const P = L.tp, tx = R.testes_txt[state.lang][o[0]] || {};
          return { tipo: "info", e: {}, d: null, href: `#/testes/${o[0]}`, kick: `${L.round(n)} · ${L.th_zone} ${d.z} · ${L.th_section} ${d.s}`, tit: `${L.th_test} ${numTeste(o[0])}. ${nomeTeste(o[0])}`, sub: catN(o[2]),
            corpo: `<section class="tp-ap"><h3>${esc(P.ap_t)}</h3>${tpDl([[L.x_level, chip(o[1] === "a" ? "red" : "amber", o[1] === "a" ? L.lv_a : L.lv_i)], [L.li_cat, esc(catN(o[2]))],
              [L.th_cargo, esc(o[3] && o[3] !== "—" ? o[3] : "—")], [L.th_obs, esc(dec(o[4] || "—"))], [L.th_ref, esc(dec(o[5] || "—"))], [L.th_q, esc(qTxt(o[6]))]])}</section>
              ${tx.objetivo ? `<h3>${esc(P.tst_obj)}</h3><p>${esc(tx.objetivo)}</p>` : ""}${tx.criterio ? `<h3>${esc(P.tst_crit)}</h3><p>${esc(tx.criterio)}</p>` : ""}`,
            acoes: tpBtn(`#/testes/${o[0]}`, "flask", P.ver_teste, true) + tpBtn(`#/lista?t=${n}&teste=${o[0]}`, "list", P.ver_lista(numTeste(o[0]))),
            dica: `<div class="cq-d-t">${esc(catN(o[2]))}</div><div class="cq-d-t">${esc(L.th_obs)}: ${esc(dec(o[4] || "—"))} · ${esc(L.th_ref)}: ${esc(dec(o[5] || "—"))}</div>` };
        };
        fl = (f.u ? `<p class="small muted">${esc(L.lk_urna(f.u, f.c, f.l))}</p>` : "") + tabelaTP({ id: `secao-oc-${n}`, memo: `${d.uf}|${d.z}|${d.s}`,
          colunas: ["teste", "nivel", "cargo", "obs", "ref", "q"], rot: [L.th_test, L.x_level, L.th_cargo, L.th_obs, L.th_ref, L.th_q],
          linhas: f.o.map((o) => [o[0], o[1], o[3] && o[3] !== "—" ? o[3] : "—", o[4] || "—", o[5] || "—", o[6] == null ? null : Number(o[6])]),
          fmt: [(id) => `<span class="lg-catc">${numTeste(id)}. ${esc(nomeTeste(id))}</span>`, (x) => chip(x === "a" ? "red" : "amber", x === "a" ? L.lv_a : L.lv_i), (x) => esc(x), (x) => esc(dec(x)), (x) => esc(dec(x)), (x) => esc(qTxt(x))],
          cls: "lg-tab", ler: tpVazio, chave: (l, gi) => `oc|${d.uf}|${d.z}|${d.s}|${n}|${gi}`, fonte: (e, dd, l, gi) => Promise.resolve(ocPainel(f.o[gi])) },
        tabela([L.th_test, "", L.th_cargo, L.th_obs, L.th_ref, L.th_q],
          f.o.map((o) => [`<a href="#/testes/${o[0]}">${numTeste(o[0])}. ${esc(nomeTeste(o[0]))}</a><br><span class="small muted">${esc((R.categorias[o[2]] || {})[state.lang] || o[2])}</span>`,
            chip(o[1] === "a" ? "red" : "amber", o[1] === "a" ? L.lv_a : L.lv_i), esc(o[3] && o[3] !== "—" ? o[3] : "—"), esc(dec(o[4] || "—")), esc(dec(o[5] || "—")),
            o[6] == null ? "—" : esc(dec(Number(o[6]).toExponential(2)))])))
          + (f.o.some((o) => o[2] === "encerramento_tardio") ? `<p class="note small enc-nota">${icone("help")} ${esc(L.ex.enc_sec)} <a href="#/encerramento-tardio">${esc(L.ex.et_title)}</a> · <a href="site/data/complementar/encerramento_tardio.csv" download>${esc(L.ex.enc_csv)}</a></p>` : "");
      } else fl = `<p>${chip("green", L.lk_noflags)}</p>`;
      return `<section class="card round-box"><h3>${esc(L.round(n))} <span class="muted small">${esc(L.roundDate[n])}</span></h3>${corpo}<h4>${esc(L.lk_flags)}</h4>${fl}<div class="vh-slot" data-t="${n}"${f && f.o.some((o) => o[2] === "encerramento_tardio") ? " data-vh" : ""}></div>${R.logs && R.logs[String(n)] ? `<div class="lg-slot" data-t="${n}"></div>` : ""}</section>`;
    }).join("");
    const nomeMun = titulo(d.mun[1]);
    const cart = [];
    [2, 1].forEach((n) => {
      const tv = rec[n]; if (!tv) return;
      const { v, nomes } = votosTurno(n, tv);
      const f = flags[String(n)];
      cart.push(["t", L.round(n)], ["l", L.lk_comp, `${nf(tv[1])} / ${nf(tv[0])}`]);
      barrasCartao(n, v, nomes, n === 1 ? 3 : 2).itens.forEach((x) => cart.push(["b"].concat(x)));
      const ts = f && f.o.length ? [...new Set(f.o.map((o) => numTeste(o[0])))] : [];
      cart.push(["l", L.lk_flags, ts.length ? L.cd_tests(ts.join(", "), ts.length) : L.cd_none]);
    });
    state.cartao = { kicker: `${d.uf} · ${nomeMun}`, titulo: `${L.th_zone} ${d.z} · ${L.th_section} ${d.s}`, itens: cart };
    const extra = `<button class="btn btn-sm" type="button" data-save="${esc(JSON.stringify({ uf: d.uf, z: d.z, s: d.s, m: nomeMun }))}">${icone("star")} <span>${esc(L.sv_save)}</span></button>`;
    return `<h2 class="lk-head">${esc(d.uf)} · <a href="#/uf/${d.uf}/${esc(d.mun[0])}">${esc(nomeMun)}</a> · ${esc(L.th_zone)} ${d.z} · ${esc(L.th_section)} ${d.s}</h2>
      ${acoes(true, extra)}${turnos}
      <p class="small">${esc(L.lk_check)} <a href="${TSE_RESULTADOS}" target="_blank" rel="noopener">resultados.tse.jus.br</a>.</p>
      <div class="btn-row lk-more"><a class="btn btn-sm" href="#/boletim?uf=${d.uf}&z=${d.z}&s=${d.s}">${icone("qr")} ${esc(L.lk_ballot)}</a>
        <button class="btn btn-sm btn-ghost" type="button" data-report="${esc(`${d.uf} · ${nomeMun} · ${L.th_zone} ${d.z} · ${L.th_section} ${d.s}`)}">${icone("alert")} ${esc(L.rep_btn)}</button></div>`;
  }

  function paginaReplicar() {
    const L = t(), R = state.R;
    const passos = L.rp_steps.map(([tit, txt, cmd]) => `<li><h3>${esc(tit)}</h3>${txt ? `<p>${txt}</p>` : ""}${cmd ? blocoCodigo(cmd) : ""}</li>`).join("");
    const hashes = [["Windows (Prompt)", "certutil -hashfile auditoria_eleicoes_2026.py SHA512"], ["Windows (PowerShell)", "Get-FileHash auditoria_eleicoes_2026.py -Algorithm SHA512"],
      ["Linux", "sha512sum auditoria_eleicoes_2026.py"], ["macOS", "shasum -a 512 auditoria_eleicoes_2026.py"]];
    const vals = [1, 2].map((n) => { const T = R.turnos[n]; return [esc(L.round(n)), `<code class="wrap">${esc(T.cab.nucleo_sha256)}</code>`, `<code class="wrap">${esc(T.cab.manifesto_sha512)}</code>`]; });
    return `<header class="page-head"><h1>${esc(L.rp_title)}</h1><p class="lead">${esc(L.rp_sub)}</p>${acoes(false)}</header>
      <ol class="steps">${passos}</ol>
      <section class="card"><h2>${esc(L.rp_links)}</h2><ul class="plain">
        <li><a href="${TSE_PORTAL}" target="_blank" rel="noopener">${esc(L.rp_portal)}</a></li>
        <li>${esc(L.rp_example)}${blocoCodigo(URL_BU_EX)}${blocoCodigo(URL_BU_EX + ".sha512")}</li></ul></section>
      <section><h2>${esc(L.rp_opts_title)}</h2>${tabelaTP({ id: "rp-opts", colunas: ["opcao", "desc"], rot: [L.tp.opcao, L.tp.desc], linhas: L.rp_opts.map(([o, d]) => [o, d]),
        fmt: [(x) => `<code>${esc(x)}</code>`, (x) => `<span class="lg-catc">${esc(x)}</span>`], ler: tpVazio, chave: (l) => `rp|${l[0]}`,
        fonte: (e, dd, l) => Promise.resolve({ tipo: "info", e: {}, d: null, href: null, kick: L.rp_opts_title, tit: l[0], sub: "",
          corpo: `<p>${esc(l[1])}</p><h3>${esc(L.tp.exemplo)}</h3>${blocoCodigo(`python auditoria_eleicoes_2026.py ${l[0]}`)}`, acoes: "", dica: `<div class="cq-d-t">${esc(l[1])}</div>` }) },
      tabela(["", ""], L.rp_opts.map(([o, d]) => [`<code>${esc(o)}</code>`, esc(d)])))}</section>
      <section><h2>${esc(L.rp_hash_title)}</h2>${hashes.map(([s, c]) => `<p class="small muted">${esc(s)}</p>${blocoCodigo(c)}`).join("")}</section>
      <section><h2>${esc(L.rp_nucleo_title)}</h2>${(() => {
        const c1 = { PT: "SHA-256 do núcleo analítico", EN: "Analytical core SHA-256", ES: "SHA-256 del núcleo analítico" }[state.lang], c2 = { PT: "SHA-512 do manifesto", EN: "Manifest SHA-512", ES: "SHA-512 del manifiesto" }[state.lang];
        return tabelaTP({ id: "rp-nucleo", colunas: ["turno", "nucleo", "manifesto"], rot: [L.x_round, c1, c2], linhas: [1, 2].map((n) => [n, R.turnos[n].cab.nucleo_sha256, R.turnos[n].cab.manifesto_sha512]),
          fmt: [(x) => esc(L.round(x)), (x) => `<code>${esc(x.slice(0, 16))}…</code>`, (x) => `<code>${esc(x.slice(0, 16))}…</code>`], ler: tpVazio, chave: (l) => `nucleo|${l[0]}`,
          fonte: (e, dd, l) => Promise.resolve({ tipo: "info", e: {}, d: null, href: null, kick: L.rp_nucleo_title, tit: L.round(l[0]), sub: `${L.tp.motor} ${R.turnos[l[0]].cab.motor || R.motor.versao}`,
            corpo: tpDl([[c1, `<code class="wrap">${esc(l[1])}</code> ${copiar(l[1])}`], [c2, `<code class="wrap">${esc(l[2])}</code> ${copiar(l[2])}`], [L.tp.emissao, esc(R.turnos[l[0]].cab.emissao || "—")]]) + `<p class="small muted">${esc(L.rp_env)}</p>`,
            acoes: "", dica: `<div class="cq-d-t">${esc(c1)}: ${esc(l[1].slice(0, 16))}…</div><div class="cq-d-t">${esc(c2)}: ${esc(l[2].slice(0, 16))}…</div>` }) },
        tabela(["", c1, c2], vals));
      })()}<p class="small muted">${esc(L.rp_env)}</p></section>
      <section class="card"><h2>${esc(L.vr.rp_t)}</h2><p>${esc(L.vr.rp_motor)}</p><p>${esc(L.vr.rp_txt)}</p>${blocoCodigo("python auditoria-eleicoes-2026-Brasil/variacao_entre_turnos.py --dados site/data --saida auditoria-eleicoes-2026-Brasil/resultados-2turno")}
        <p class="small muted">${esc(L.vr.rp_note)}</p><a class="btn btn-sm" href="#/variacao">${icone("swap")} ${esc(L.vr.title)}</a></section>
      ${botCta()}`;
  }

  function paginaDownloads() {
    const L = t(), R = state.R;
    const linha = (d) => {
      const nomeArq = d.nome;
      const desc = L.dl_desc[nomeArq] || (nomeArq.startsWith("graficos/") ? `${L.dl_graph}: ${nomeArq.slice(9)}` : "");
      return [`<span class="fname">${esc(nomeArq)}</span>${desc ? `<br><span class="small muted">${esc(desc)}</span>` : ""}`, tamanho(d.bytes),
        `<details class="sha"><summary><code>${esc(d.sha512.slice(0, 16))}…</code></summary><code class="wrap">${esc(d.sha512)}</code></details>${copiar(d.sha512)}`,
        DL_PAUSA ? `<button class="btn btn-sm" type="button" data-dl-bloq>${icone("download")} ${esc(L.dl_btn)}</button>` : `<a class="btn btn-sm" href="${esc(d.path)}" download>${icone("download")} ${esc(L.dl_btn)}</a>`];
    };
    // tabela padrão: dica e painel com a descrição, o tamanho, o SHA-512 inteiro (copiar) e o botão de baixar
    const descDe = (nomeArq) => L.dl_desc[nomeArq] || (nomeArq.startsWith("graficos/") ? `${L.dl_graph}: ${nomeArq.slice(9)}` : "");
    const btnDl = (d, prim) => (DL_PAUSA ? `<button class="btn btn-sm${prim ? " btn-primary" : ""}" type="button" data-dl-bloq>${icone("download")} ${esc(L.dl_btn)}</button>` : `<a class="btn btn-sm${prim ? " btn-primary" : ""}" href="${esc(d.path)}" download>${icone("download")} ${esc(L.dl_btn)}</a>`);
    const arqPainel = (d, tit) => ({ tipo: "info", e: {}, d: null, href: null, kick: tit, tit: d.nome, sub: descDe(d.nome),
      corpo: `<section class="tp-ap"><h3>${esc(L.tp.arq_t)}</h3>${tpDl([[L.th_file, `<span class="fname">${esc(d.nome)}</span>`], [L.th_size, `${esc(tamanho(d.bytes))} <small>(${nf(d.bytes)} bytes)</small>`],
        [L.th_sha, `<code class="wrap">${esc(d.sha512)}</code> ${copiar(d.sha512)}`]])}${DL_PAUSA ? `<p class="small muted">${esc(L.tp.dl_pausa)}</p>` : ""}</section>
        <h3>${esc(L.rp_hash_title)}</h3>${blocoCodigo(`certutil -hashfile ${d.nome.split("/").pop()} SHA512`)}`,
      acoes: btnDl(d, true), dica: `<div class="cq-d-t">${esc(descDe(d.nome) || d.nome)}</div><div class="cq-d-t">${esc(L.th_size)}: ${esc(tamanho(d.bytes))} · SHA-512 ${esc(d.sha512.slice(0, 16))}…</div>` });
    const grupo = (tit, itens) => `<section><h2>${esc(tit)}</h2>${tabelaTP({ id: `dl-${tit}`, colunas: ["arquivo", "tamanho", "sha", "baixar"], rot: [L.th_file, L.th_size, L.th_sha, ""],
      linhas: itens.map((d) => [d.nome, d.bytes, d.sha512, d.nome]),
      fmt: [(x) => { const ds = descDe(x); return `<span class="fname">${esc(x)}</span>${ds ? `<br><span class="small muted lg-catc">${esc(ds)}</span>` : ""}`; }, (x) => esc(tamanho(x)), (x) => `<code>${esc(x.slice(0, 16))}…</code>`,
        (x) => btnDl(itens.find((d) => d.nome === x))],
      cls: "dl", ler: tpVazio, chave: (l) => `dl|${l[0]}`, fonte: (e, dd, l, gi) => Promise.resolve(arqPainel(itens[gi], tit)) },
    tabela([L.th_file, L.th_size, L.th_sha, ""], itens.map(linha), "dl"))}</section>`;
    const ord = (a, b) => (a.nome.includes("/") - b.nome.includes("/")) || a.nome.localeCompare(b.nome);
    return `<header class="page-head"><h1>${esc(L.dl_title)}</h1><p class="lead">${esc(L.dl_sub)}</p>${acoes(false)}</header>
      ${DL_PAUSA && L.ex ? `<section class="card dl-pausa" role="note"><h2>${icone("lock")} ${esc(L.ex.dl_t)}</h2>${L.ex.dl_p(35).slice(0, 3).map((x) => `<p>${esc(x)}</p>`).join("")}<button class="btn btn-sm" type="button" data-aud>${icone("list")} ${esc(L.ex.dl_ver)}</button></section>` : ""}
      <section class="card dl-all">${DL_PAUSA ? `<button class="btn btn-primary btn-lg" type="button" data-dl-bloq>${icone("download")} ${esc(L.dl_all)}</button>` : `<a class="btn btn-primary btn-lg" href="${ZIP}">${icone("download")} ${esc(L.dl_all)}</a>`}<p class="small muted">${esc(L.dl_all_note)}</p></section>
      ${grupo(L.dl_code, R.downloads.filter((d) => d.turno === 0))}
      ${[1, 2].map((n) => grupo(L.dl_round(n), R.downloads.filter((d) => d.turno === n).sort(ord))).join("")}
      <section><h2>${esc(L.rp_hash_title)}</h2>${blocoCodigo("certutil -hashfile Relatorio_Tecnico_Auditoria_Eleicoes_2026_PT.md SHA512")}</section>
      ${botCta()}`;
  }

  function paginaLimitacoes() {
    const L = t();
    return `<header class="page-head"><h1>${esc(L.lm_title)}</h1>${acoes(false)}</header>
      <div class="grid2">
        <section class="card"><h2>${esc(L.lm_proves_title)}</h2><ul class="checks">${L.lm_proves.map((x) => `<li>${x}</li>`).join("")}</ul></section>
        <section class="card"><h2>${esc(L.lm_not_title)}</h2><ul class="crosses">${L.lm_not.map((x) => `<li>${x}</li>`).join("")}</ul></section>
      </div>
      <section><h2>${esc(L.lm_expected_title)}</h2><p>${esc(L.lm_expected)}</p></section>
      <section><h2>${esc(L.lm_site_title)}</h2><p>${esc(L.lm_site)}</p></section>
      ${botCta()}`;
  }

  // --- roteamento ------------------------------------------------------------------
  function rota() {
    const h = (location.hash || "#/").replace(/^#/, "");
    const [cam, q] = h.split("?");
    state.query = new URLSearchParams(q || "");
    return cam.split("/").filter(Boolean).map(decodeURIComponent);
  }

  async function render() {
    if (!state.R) return;   // os dados ainda estão carregando: iniciar() chama render() quando chegarem
    const L = t(), p = rota(), main = $("#main");
    let html, ativo = "home", tit = L.hero_title, pg = null;
    state.cartao = null;
    tpFila.length = 0;
    if (p[0] === "turno") {   // um botão só no menu: abre o último turno visto (ou o 2º) e a página tem a escolha 1º/2º
      let n = p[1];
      if (n !== "1" && n !== "2") { n = ler("turno") === "1" ? "1" : "2"; history.replaceState(null, "", "#/turno/" + n); }
      guardar("turno", n); html = paginaTurno(n); ativo = "res"; tit = L.round(+n);
    }
    else if (p[0] === "testes") { html = paginaTestes(p[1]); ativo = "tests"; tit = L.tests_title; }
    else if (p[0] === "secao") { html = paginaSecao(p[1], p[2], p[3]); ativo = "lookup"; tit = L.lk_title; }
    else if (p[0] === "replicar") { html = paginaReplicar(); ativo = "replicate"; tit = L.rp_title; }
    else if (p[0] === "downloads") { html = paginaDownloads(); ativo = "downloads"; tit = L.dl_title; }
    else if (p[0] === "limitacoes") { html = paginaLimitacoes(); ativo = "limits"; tit = L.lm_title; }
    else if (paginas[p[0]]) { pg = paginas[p[0]]; html = pg.html(p); ativo = pg.ativo || p[0]; tit = pg.titulo(p); }
    else html = paginaInicio();
    main.innerHTML = html;
    main.classList.remove("page-enter"); void main.offsetWidth; main.classList.add("page-enter");
    document.title = (ativo === "home" ? "" : tit + " · ") + L.brand;
    $$(".nav a, .nav2 a").forEach((a) => a.setAttribute("aria-current", a.dataset.nav === ativo ? "page" : "false"));
    indicador();
    fecharMenu();
    if (p[0] === "testes" && p[1]) { const el = document.getElementById(p[1]); if (el) el.scrollIntoView({ block: "start" }); }
    else window.scrollTo({ top: 0, behavior: "instant" });
    efeitos(main);
    tpExecutar();
    if (p[0] === "secao") await iniciarSecao(p[1], p[2], p[3]);
    if (pg && pg.iniciar) await pg.iniciar(p);
    document.dispatchEvent(new CustomEvent("pagina", { detail: { rota: p, titulo: tit, ativo } }));
  }

  async function iniciarSecao(uf, z, s) {
    const form = $("form[data-lookup]:not(.compact)");
    if (!form) return;
    const selUf = form.elements.uf, selMun = form.elements.mun, dl = $("#lk-zonas");
    await municipios();
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
      tpExecutar();
      if (d.rec) document.dispatchEvent(new CustomEvent("secao", { detail: { uf: d.uf, z: d.z, s: d.s, m: titulo(d.mun[1]) } }));
    }
  }

  // --- interface global ---------------------------------------------------------
  function fecharMenu() {
    const b = $("#menu-btn");
    if (document.body.classList.contains("menu-open") && b) b.innerHTML = icone("menu");
    document.body.classList.remove("menu-open"); if (b) b.setAttribute("aria-expanded", "false");
  }

  const PAGINAS = [["home", "#/"], ["r1", "#/turno/1"], ["r2", "#/turno/2"], ["tests", "#/testes"], ["lookup", "#/secao"], ["replicate", "#/replicar"], ["downloads", "#/downloads"], ["limits", "#/limitacoes"]];
  const ICO_MAIS = { atlas: "globe", vary: "swap", map: "map", states: "pin", list: "list", charts: "chart", glossary: "book", verify: "hash", ballot: "qr", saved: "star", updates: "bell" };
  // Páginas do menu "Mais" (ferramentas e consultas)
  const MAIS = [["atlas", "#/atlas"], ["vary", "#/variacao"], ["map", "#/mapa"], ["states", "#/uf"], ["list", "#/lista"], ["charts", "#/graficos"], ["glossary", "#/glossario"], ["verify", "#/conferir"],
    ["ballot", "#/boletim"], ["saved", "#/salvas"], ["updates", "#/atualizacoes"]];

  // faixa do alto: aviso de site independente + chamada do app (no app instalado: ligar os avisos; com avisos ligados, só o aviso)
  function faixaTopo(L) {
    L = L || t();
    const noApp = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    let ligados = false;
    try { ligados = "Notification" in window && Notification.permission === "granted" && localStorage.getItem("avisos") === "1"; } catch (e) { /* sem armazenamento */ }
    const app = noApp ? (ligados ? "" : `<button class="badge-app" type="button" data-avisos>${icone("bell")}<b>${esc(L.ba_av)}</b><span>${esc(L.ba_av_d)}</span><i aria-hidden="true">›</i></button>`)
      : `<button class="badge-app" type="button" data-install>${icone("phone")}<b>${esc(L.ba_app)}</b><span class="ba-l">${esc(L.ba_app_d)}</span><span class="ba-c">${esc(L.ba_app_c)}</span><i aria-hidden="true">›</i></button>`;
    $("#badge").innerHTML = `<span class="badge-t">${esc(L.badge)}</span>${app}`;
  }
  document.addEventListener("avisos", () => faixaTopo());

  // Menu do alto: todas as páginas numa lista só, nesta ordem. No computador, cabem duas fileiras ao lado da marca;
  // o que não couber desce para a faixa de baixo (ajustarMenu). No celular, tudo no menu lateral, com os títulos dos grupos.
  // Página nova que não estiver em nenhum grupo entra sozinha no último.
  const MENU1 = ["home", "res", "tests", "lookup", "atlas", "sim", "map", "faq", "downloads"];
  const MENU2 = [["g_res", ["vary", "late", "logs", "states", "list", "charts"]], ["g_con", ["query", "places", "verify", "ballot", "saved"]],
    ["g_ent", ["glossary", "anatomy", "replicate", "limits"]], ["g_mais", ["updates", "proofs", "press", "embed", "devs"]]];
  function menuItens() {
    const href = Object.assign(Object.fromEntries(PAGINAS.concat(MAIS)), { res: "#/turno" });
    const usados = new Set(MENU1.concat(...MENU2.map((g) => g[1]), ["r1", "r2"]));   // 1º e 2º turno: dentro de Resultados
    const sobra = Object.keys(href).filter((k) => !usados.has(k));
    const grupos = MENU2.map(([g, ks], i) => [g, (i === MENU2.length - 1 ? ks.concat(sobra) : ks).filter((k) => href[k])]);
    const um = MENU1.filter((k) => href[k]);
    return { href, um, grupos, todos: um.concat(...grupos.map((g) => g[1])) };
  }

  // computador: encaixa em duas fileiras o máximo de botões, na ordem da lista (um botão menor pode ocupar a sobra da 1ª fileira);
  // o que não couber aparece na faixa de baixo. No celular, volta a ordem original com os títulos dos grupos.
  let menuOrdem = [];
  function ajustarMenu() {
    const nav = $("#nav"), nav2 = $("#nav2");
    if (!nav || !nav2) return;
    const links = menuOrdem.filter((e) => e.matches("a[data-nav]")), fora = new Set();
    links.forEach((a) => a.classList.remove("fora"));
    let ordem = menuOrdem;
    if (window.matchMedia("(min-width: 1181px)").matches && links.length) {
      const W = nav.clientWidth, gap = parseFloat(getComputedStyle(nav).columnGap) || 0, fila = [[], []], usado = [0, 0];
      links.forEach((a) => {
        const w = a.getBoundingClientRect().width;
        const f = [0, 1].find((k) => usado[k] + (fila[k].length ? gap : 0) + w <= W + .5);
        if (f === undefined) { a.classList.add("fora"); fora.add(a.dataset.nav); return; }
        usado[f] += (fila[f].length ? gap : 0) + w; fila[f].push(a);
      });
      ordem = fila[0].concat(fila[1], menuOrdem.filter((e) => !fila[0].includes(e) && !fila[1].includes(e)));
    }
    if (ordem.some((e, k) => nav.children[k] !== e)) nav.append(...ordem);
    $$("#nav2 a[data-nav]").forEach((a) => a.classList.toggle("vis", fora.has(a.dataset.nav)));
    nav2.classList.toggle("vazio", !fora.size);
  }
  let ajusteFila = 0;
  const pedirAjuste = () => { cancelAnimationFrame(ajusteFila); ajusteFila = requestAnimationFrame(ajustarMenu); };
  window.addEventListener("resize", pedirAjuste);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pedirAjuste);
  // tamanho da letra (acessibilidade) e tema mudam atributos do <html>
  new MutationObserver(pedirAjuste).observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class", "data-contrast"] });

  function montarCabecalho() {
    const L = t();
    marca();
    faixaTopo(L);
    // menu: uma lista só (os títulos dos grupos aparecem só no menu lateral do celular); a faixa de baixo repete as páginas
    // e mostra só as que não couberem nas duas fileiras de cima
    const M = menuItens(); let n = 0;
    const item = (k) => `<a href="${M.href[k]}" data-nav="${k}" style="--i:${n++}">${esc(L.nav[k])}</a>`;
    $("#nav").innerHTML = M.um.map(item).join("")
      + M.grupos.map(([g, ks]) => `<span class="nav-sub-t" style="--i:${n++}">${esc(L.nav[g])}</span>${ks.map(item).join("")}`).join("")
      + `<button class="nav-a11y" type="button" data-a11y style="--i:${n++}">${icone("a11y")} ${esc(L.ax_title)}</button>`;
    $("#nav2").setAttribute("aria-label", L.nav.more_title);
    $("#nav2").innerHTML = `<div class="nav2-in">${M.todos.map((k) => `<a href="${M.href[k]}" data-nav="${k}">${esc(L.nav[k])}</a>`).join("")}</div>`;
    menuOrdem = [...$("#nav").children];
    ajustarMenu();
    $("#lang").innerHTML = LANGS.map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === state.lang}">${l}</button>`).join("");
    $("#lang").setAttribute("aria-label", L.lang);
    $("#theme-btn").setAttribute("aria-label", L.theme); $("#theme-btn").title = L.theme;
    $("#menu-btn").setAttribute("aria-label", L.menu);
    $("#search-btn").innerHTML = icone("search"); $("#search-btn").setAttribute("aria-label", L.sr_open); $("#search-btn").title = L.sr_open + " ( / )";
    $("#a11y-btn").innerHTML = icone("a11y"); $("#a11y-btn").setAttribute("aria-label", L.ax_open); $("#a11y-btn").title = L.ax_open;
    iconeTema();
    montarRodape();
    lancadorAtlas();
    document.documentElement.lang = { PT: "pt-BR", EN: "en", ES: "es" }[state.lang];
  }

  // Botão flutuante em todas as páginas: leva à página do Atlas (some na própria página do Atlas)
  function lancadorAtlas() {
    const L = t();
    let a = $("#atlas-launcher");
    if (!a) {
      a = document.createElement("a");
      a.id = "atlas-launcher"; a.className = "atlas-launcher"; a.href = "#/atlas";
      document.body.append(a);
    }
    a.innerHTML = `${icone("globe")}<span class="atlas-launcher-txt">${esc(L.launcher)}</span>`;
    a.setAttribute("aria-label", L.launcher_aria);
  }

  function montarRodape() {
    const L = t(), R = state.R, A = R ? R.autor : null;
    const ext = (h, txt) => `<a href="${h}" target="_blank" rel="noopener">${esc(txt)}</a>`;
    $("#footer").innerHTML = `<div class="flag-stripe" aria-hidden="true"></div>
      ${telegram(true)}
      <div class="foot-in">
        <div class="foot-brand">
          <a class="brand" href="#/"><img class="brand-flag" src="site/img/bandeira.svg" alt="" width="38" height="27"><span class="brand-txt"><span class="fb-name">${esc(L.brand)}</span><span class="brand-sub">${esc(L.brand_sub)}</span></span></a>
          <p>${esc(L.ft_tagline)}</p><p class="small muted">${esc(L.ft_disclaimer)}</p>
        </div>
        <nav class="foot-col" aria-label="${esc(L.ft_nav)}"><h3>${esc(L.ft_nav)}</h3><ul>${PAGINAS.map(([k, h]) => `<li><a href="${h}">${esc(L.nav[k])}</a></li>`).join("")}</ul></nav>
        <nav class="foot-col" aria-label="${esc(L.nav.more_title)}"><h3>${esc(L.nav.more_title)}</h3><ul>${MAIS.map(([k, h]) => `<li><a href="${h}">${esc(L.nav[k])}</a></li>`).join("")}</ul></nav>
        <div class="foot-col"><h3>${esc(L.ft_data)}</h3><ul>
          <li><a href="#/downloads">${esc(L.nav.downloads)}</a></li><li><a href="#/replicar">${esc(L.nav.replicate)}</a></li>
          <li>${ext(TSE_PORTAL, L.ft_tse_portal)}</li><li>${ext(TSE_RESULTADOS, L.ft_tse_res)}</li>
          <li><a href="feed.xml" data-feed>${esc(L.ft_feed)}</a></li>${L.ex ? `<li><a href="estados/">${esc(L.ex.ft_estatico)}</a></li>` : ""}</ul></div>
        <div class="foot-col"><h3>${esc(L.ft_author)}</h3><ul>
          ${A ? `<li><b>${esc(A.nome)}</b></li><li>${ext(`https://www.instagram.com/${A.instagram.replace("@", "")}/`, "Instagram " + A.instagram)}</li>` : ""}
          <li><a class="btn btn-bot btn-sm" href="#/atlas">${icone("globe")} ${esc(L.bot_cta_btn)}</a></li></ul></div>
      </div>
      <div class="foot-tools">
        <button class="btn btn-sm btn-ghost" type="button" data-install>${icone("phone")} ${esc(L.app_install)}</button>
        <button class="btn btn-sm btn-ghost" type="button" data-a11y>${icone("a11y")} ${esc(L.ax_title)}</button>
        <button class="btn btn-sm btn-ghost" type="button" data-report>${icone("alert")} ${esc(L.rep_site)}</button>
        <button class="btn btn-sm btn-ghost" type="button" data-share>${icone("share")} ${esc(L.sh_site)}</button>
      </div>
      <div class="foot-bottom">
        <span class="made"><img src="site/img/bandeira.svg" alt="" width="22" height="15">${esc(L.ft_made)}</span>
        ${R ? `<span>${esc(L.ft_reports(R.turnos["1"].cab.emissao, R.turnos["2"].cab.emissao))}</span>` : ""}
        <button class="to-top" type="button" data-top>${icone("up")} ${esc(L.ft_top)}</button>
      </div>`;
  }

  function definirIdioma(l) {
    if (!LANGS.includes(l)) return;
    state.lang = l; guardar("lang", l);
    montarCabecalho(); render();
    if (window.BOT) window.BOT.idioma(l);
  }

  // Tema escuro por padrão; o claro fica salvo só se o visitante escolher
  function iconeTema() {
    const escuro = document.documentElement.getAttribute("data-theme") !== "light";
    $("#theme-btn").innerHTML = icone(escuro ? "sun" : "moon");
  }
  function tema(alternar) {
    const raiz = document.documentElement;
    let atual = raiz.getAttribute("data-theme") === "light" ? "light" : "dark";
    if (alternar) atual = atual === "dark" ? "light" : "dark";
    raiz.setAttribute("data-theme", atual);
    if (alternar) guardar("theme", atual);
    const m = $('meta[name="theme-color"]'); if (m) m.content = atual === "dark" ? "#050c08" : "#f3f7f1";
    iconeTema();
  }

  // Indicador deslizante do menu
  function moverInd(sel, a) {
    const ind = $("#nav " + sel);
    if (!ind) return;
    if (!a || getComputedStyle(ind).display === "none") { ind.classList.remove("on"); return; }
    // posição relativa ao menu
    const nav = $("#nav"), rn = nav.getBoundingClientRect(), ra = a.getBoundingClientRect();
    ind.style.left = (ra.left - rn.left - nav.clientLeft) + "px"; ind.style.width = ra.width + "px"; ind.classList.add("on");
  }
  function indicador() { moverInd(".nav-ind", $('.nav > a[aria-current="page"]')); }

  // Dica flutuante (mouse e teclado): 1ª linha em destaque, demais abaixo
  function dicas() {
    const tip = document.createElement("div");
    tip.className = "tip"; tip.setAttribute("role", "tooltip"); tip.hidden = true;
    document.body.appendChild(tip);
    let atual = null;
    const encher = (el) => {
      if (atual === el) return;
      atual = el; tip.textContent = "";
      const linhas = el.dataset.tip.split("\n");
      const s = document.createElement("strong"); s.textContent = linhas[0]; tip.appendChild(s);
      linhas.slice(1).forEach((l) => { const d = document.createElement("div"); d.textContent = l; tip.appendChild(d); });
      tip.hidden = false;
    };
    const posicionar = (x, y) => {
      const r = tip.getBoundingClientRect(); let left = x + 14, top = y - r.height - 12;
      if (left + r.width > window.innerWidth - 8) left = Math.max(8, x - r.width - 14);
      if (top < 8) top = y + 18;
      tip.style.left = left + "px"; tip.style.top = top + "px";
    };
    const esconder = () => { tip.hidden = true; atual = null; };
    document.addEventListener("mousemove", (e) => { const el = e.target.closest("[data-tip]"); if (el) { encher(el); posicionar(e.clientX, e.clientY); } else if (atual) esconder(); });
    document.addEventListener("focusin", (e) => { const el = e.target.closest("[data-tip]"); if (el) { encher(el); const r = el.getBoundingClientRect(); posicionar(r.left + Math.min(r.width / 2, 120), r.top); } });
    document.addEventListener("focusout", esconder);
    window.addEventListener("scroll", esconder, { passive: true });
  }

  // --- efeitos --------------------------------------------------------------------
  const SEL_RV = ".card, .tile, .page-card, .test-card, .sim-card, .sim-aviso, figure, .table-wrap, .bot-band, .tg-cta, .steps > li, .legend > li, main section > h2, main section > .sec-sub, .h-row, main > section > p, .btn-row, .page-head > p, .page-head > ul";
  let obs = null;

  function revelar(el) {
    el.classList.add("in");
    if (el.classList.contains("rv")) {
      // depois de entrar, devolve as transições próprias do elemento (inclina, sobe)
      const d = parseInt(el.style.getPropertyValue("--d") || "0", 10);
      setTimeout(() => { el.classList.remove("rv", "rv-l", "rv-s", "in"); el.style.removeProperty("--d"); }, 760 + d * 70);
    }
    $$("[data-count]", el).concat(el.matches("[data-count]") ? [el] : []).forEach(contar);
  }

  function efeitos(raiz) {
    $$("h1[data-type], .page-head h1", raiz).forEach(digitar);
    $$("[data-scramble], .page-head .kicker", raiz).forEach(embaralhar);
    const cv = $(".hero-canvas", raiz); if (cv && ANIM) formulas(cv);
    if (!ANIM) return;
    if (obs) obs.disconnect();
    obs = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { obs.unobserve(en.target); revelar(en.target); } }), { rootMargin: "0px 0px -6% 0px" });
    $$(SEL_RV, raiz).forEach((el) => {
      if (el.parentElement.closest(".rv")) return;
      let i = 0, irm = el.previousElementSibling;
      while (irm && i < 8) { if (irm.classList.contains("rv")) i++; irm = irm.previousElementSibling; }
      el.classList.add("rv"); if (el.matches("h2, .h-row")) el.classList.add("rv-l");
      if (el.matches(".tile, .page-card")) el.classList.add("rv-s");
      el.style.setProperty("--d", i);
      obs.observe(el);
    });
    $$(".bars, .timeline", raiz).forEach((el) => obs.observe(el));
    $$("[data-count]", raiz).forEach((el) => { if (!el.closest(".rv")) obs.observe(el); });
  }

  // Título escrito letra por letra (o texto completo fica para leitores de tela)
  function digitar(h) {
    const txt = h.textContent.trim();
    if (!txt || !ANIM) return;
    h.classList.add("tw-on");
    h.innerHTML = `<span class="sr-only">${esc(txt)}</span><span class="tw" aria-hidden="true"><span class="tw-ghost">${esc(txt)}</span><span class="tw-live"></span></span>`;
    const live = $(".tw-live", h), passo = Math.max(16, Math.min(40, 1200 / txt.length));
    let i = 0;
    const tick = () => { i++; live.textContent = txt.slice(0, i); if (i < txt.length) setTimeout(tick, passo); else h.classList.add("tw-done"); };
    setTimeout(tick, 200);
  }

  // Texto que "decodifica" (efeito tecnológico nos rótulos)
  function embaralhar(el) {
    const txt = el.textContent.trim();
    if (!txt || !ANIM) return;
    el.innerHTML = `<span class="sr-only">${esc(txt)}</span><span aria-hidden="true"></span>`;
    const vis = el.lastElementChild, cs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/";
    let q = 0;
    const tick = () => {
      q += 1;
      const n = Math.floor(q * txt.length / 26);
      vis.textContent = txt.split("").map((c, k) => (k < n || c === " " ? c : cs[Math.floor(Math.random() * cs.length)])).join("");
      if (n < txt.length) setTimeout(tick, 34); else vis.textContent = txt;
    };
    tick();
  }

  // Contagem animada até o valor final
  function contar(el) {
    const alvo = Number(el.dataset.count);
    if (!(alvo > 0) || el.dataset.contado) return;
    el.dataset.contado = "1";
    const t0 = performance.now(), dur = 1500;
    const passo = (agora) => { const k = Math.min(1, (agora - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = nf(Math.round(alvo * e)); if (k < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  }

  // Fundo do topo: fórmulas e números da análise forense flutuando sobre papel milimetrado.
  // Perto do ponteiro aparece uma mira e o que estiver sob a lente acende.
  function formulas(cv) {
    const ctx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    const R = state.R, Pm = R.parametros, T2 = R.turnos["2"], en = state.lang === "EN";
    const dec = (x) => (en ? String(x) : String(x).replace(".", ","));
    const hash = T2.cab.manifesto_sha512;
    const textos = [
      `z = (x − med) / ${dec(1.4826)}·MAD`, "MAD = med|xᵢ − med(x)|", "p₍ᵢ₎ ≤ (i / m) · q", "X ~ BetaBin(n, α, β)",
      "E[X] = n·α / (α + β)", "ρ = 1 / (α + β + 1)", "χ² = Σ (O − E)² / E", "P(d₂) = Σ log₁₀(1 + 1/(10k + d₂))",
      `E[d₂] ≈ ${dec(4.187)}`, "r = cov(X, Y) / σₓσᵧ", "N(μ, σ²)", "F(x) = P(X ≤ x)", "IQR = Q₃ − Q₁", "H₀ : μ = μ₀",
      `|z| > ${dec(Pm.LIMIAR_Z_ROBUSTO)}`, `q = ${dec(Pm.ALFA_FDR)}`, "θ₋ᵢ (LOO)", "Σ vᵢ = N", "√n", "σ²", "Δ%", "∑", "χ²",
      `SHA-512 ${hash.slice(0, 16)}…`, hash.slice(16, 32), hash.slice(64, 80),
      nf(T2.entrada.secoes), nf(T2.entrada.boletins), nf(T2.entrada.linhas), dec(1.4826), dec(0.301), "0x" + hash.slice(100, 108)
    ];
    let w = 0, h = 0, itens = [], vis = true, raf = 0, t0 = performance.now();
    const mouse = { x: -999, y: -999 };
    const novo = (y) => {
      const z = Math.random() * .7 + .3;
      return { s: textos[Math.floor(Math.random() * textos.length)], x: Math.random() * w, y: y == null ? Math.random() * h : y,
        z, vy: -(.06 + z * .22), f: Math.round(10 + z * 7), fase: Math.random() * 6.28 };
    };
    const tam = () => {
      const r = cv.getBoundingClientRect(); w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(14, Math.min(46, Math.round(w * h / 15000)));
      itens = Array.from({ length: n }, () => novo());
    };
    const quadro = (agora) => {
      if (!cv.isConnected) { raf = 0; return; }
      // o topo fica escuro nos dois temas, então as cores são sempre as do tema escuro
      const g = "31,195,95", y = "255,212,0";
      const tt = (agora - t0) / 1000, varre = ((tt / 7) % 1.25) * h;
      ctx.clearRect(0, 0, w, h);
      // papel milimetrado
      ctx.beginPath();
      for (let x = 0; x < w; x += 28) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); }
      for (let k = 0; k < h; k += 28) { ctx.moveTo(0, k + .5); ctx.lineTo(w, k + .5); }
      ctx.strokeStyle = `rgba(${g},.06)`; ctx.lineWidth = 1; ctx.stroke();
      // faixa de varredura
      if (varre < h) {
        const gr = ctx.createLinearGradient(0, varre - 60, 0, varre);
        gr.addColorStop(0, `rgba(${y},0)`); gr.addColorStop(1, `rgba(${y},.06)`);
        ctx.fillStyle = gr; ctx.fillRect(0, varre - 60, w, 60);
        ctx.fillStyle = `rgba(${y},.28)`; ctx.fillRect(0, varre, w, 1);
      }
      ctx.textBaseline = "middle";
      for (let i = 0; i < itens.length; i++) {
        const p = itens[i];
        p.y += p.vy;
        if (p.y < -20) { itens[i] = novo(h + 20); continue; }
        const x = p.x + Math.sin(tt * .4 + p.fase) * 6;
        const dx = x - mouse.x, dy = p.y - mouse.y, perto = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 170);
        const na = Math.max(0, 1 - Math.abs(p.y - varre) / 50);
        const borda = Math.min(1, p.y / 60, (h - p.y) / 60);
        // mais apagado atrás do título, à esquerda
        let a = (.1 + p.z * .2) * (.3 + .7 * Math.min(1, x / (w * .75))) * Math.max(0, borda);
        a = Math.min(1, a + perto * .75 + na * .3);
        ctx.font = `500 ${p.f}px ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`;
        ctx.fillStyle = `rgba(${perto > .2 || na > .3 ? y : g},${a.toFixed(3)})`;
        ctx.fillText(p.s, x, p.y);
      }
      // mira no ponteiro
      if (mouse.x > -500) {
        const mx = mouse.x, my = mouse.y;
        ctx.strokeStyle = `rgba(${y},.55)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(mx, my, 46, 0, 6.2832); ctx.stroke();
        ctx.beginPath();
        [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([a, b]) => { ctx.moveTo(mx + a * 38, my + b * 38); ctx.lineTo(mx + a * 56, my + b * 56); });
        ctx.stroke();
        ctx.fillStyle = `rgba(${y},.9)`; ctx.beginPath(); ctx.arc(mx, my, 2, 0, 6.2832); ctx.fill();
        ctx.font = '600 11px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
        const z = (mx / w) * 8 - 4;
        ctx.fillText(`z = ${(z < 0 ? "−" : "+") + dec(Math.abs(z).toFixed(2))}`, mx + 54, my - 40);
      }
      raf = vis && !document.hidden ? requestAnimationFrame(quadro) : 0;
    };
    const iniciarLoop = () => { if (!raf && vis && cv.isConnected) raf = requestAnimationFrame(quadro); };
    tam(); iniciarLoop();
    new IntersectionObserver((e) => { vis = e[0].isIntersecting; iniciarLoop(); }).observe(cv);
    const hero = cv.parentElement;
    hero.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
    window.addEventListener("resize", () => { if (cv.isConnected) tam(); }, { passive: true });
    document.addEventListener("visibilitychange", iniciarLoop);
  }

  // Nome no topo: escreve, espera, apaga e escreve de novo
  let marcaVez = 0, marcaTxt = "";
  function marca() {
    const L = t();
    if (marcaTxt === L.brand + "|" + L.brand_sub) return;
    marcaTxt = L.brand + "|" + L.brand_sub;
    const vez = ++marcaVez;
    const linhas = [[$("#brand-name"), L.brand], [$("#brand-sub"), L.brand_sub]];
    if (!ANIM) { linhas.forEach(([el, s]) => { el.textContent = s; }); return; }
    const vivos = linhas.map(([el, s]) => {
      el.innerHTML = `<span class="sr-only">${esc(s)}</span><span class="tw" aria-hidden="true"><span class="tw-ghost">${esc(s)}</span><span class="tw-live"></span></span>`;
      return [$(".tw-live", el), s];
    });
    const cursor = (k) => vivos.forEach(([v], i) => v.classList.toggle("cur", i === k));
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      while (vez === marcaVez) {
        for (let k = 0; k < 2; k++) {
          const [v, s] = vivos[k]; cursor(k);
          for (let i = 1; i <= s.length; i++) { if (vez !== marcaVez) return; v.textContent = s.slice(0, i); await esperar(k ? 45 : 85); }
        }
        await esperar(5000);
        for (let k = 1; k >= 0; k--) {
          const [v, s] = vivos[k]; cursor(k);
          for (let i = s.length - 1; i >= 0; i--) { if (vez !== marcaVez) return; v.textContent = s.slice(0, i); await esperar(28); }
        }
        await esperar(500);
      }
    })();
  }

  function efeitosGlobais() {
    // cabeçalho compacto e barra de progresso da leitura
    const head = $("#site-head"), barra = $("#progress-bar");
    let pend = false;
    const rolar = () => { pend = false; const y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
      head.classList.toggle("scrolled", y > 8); barra.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`; };
    window.addEventListener("scroll", () => { if (!pend) { pend = true; requestAnimationFrame(rolar); } }, { passive: true });
    rolar();
    // menu: destaque que acompanha o mouse
    const nav = $("#nav");
    nav.addEventListener("mouseover", (e) => { const a = e.target.closest(".nav > a"); if (a) moverInd(".nav-hover", a); });
    nav.addEventListener("mouseleave", () => moverInd(".nav-hover", null));
    window.addEventListener("resize", indicador, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(indicador);
    if (!ANIM) return;
    // brilho que segue o mouse, inclinação 3D e lente que acompanha o ponteiro
    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const el = e.target.closest(".spot");
      if (el) {
        const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty("--mx", x + "px"); el.style.setProperty("--my", y + "px");
        if (el.classList.contains("tilt") && !el.classList.contains("rv")) el.style.transform = `perspective(900px) rotateX(${((y / r.height) - .5) * -7}deg) rotateY(${((x / r.width) - .5) * 7}deg) translateY(-5px)`;
      }
      const hv = e.target.closest(".hero");
      const fl = hv && $(".hero-lens", hv);
      if (fl) { const r = hv.getBoundingClientRect(); fl.style.transform = `rotateY(${((e.clientX - r.left) / r.width - .5) * 16}deg) rotateX(${((e.clientY - r.top) / r.height - .5) * -12}deg)`; }
    }, { passive: true });
    document.addEventListener("pointerout", (e) => {
      const el = e.target.closest(".tilt"); if (el && !el.contains(e.relatedTarget)) el.style.transform = "";
      const hv = e.target.closest(".hero"); if (hv && !hv.contains(e.relatedTarget)) { const fl = $(".hero-lens", hv); if (fl) fl.style.transform = ""; }
    });
    // ondinha ao clicar
    document.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".btn, .page-card");
      if (!b) return;
      const r = b.getBoundingClientRect(), s = document.createElement("span");
      s.className = "ripple"; s.style.left = (e.clientX - r.left) + "px"; s.style.top = (e.clientY - r.top) + "px";
      b.appendChild(s); setTimeout(() => s.remove(), 650);
    });
  }

  function eventos() {
    document.addEventListener("click", async (e) => {
      const lg = e.target.closest("[data-lang]"); if (lg) { definirIdioma(lg.dataset.lang); return; }
      if (e.target.closest("#theme-btn")) { tema(true); return; }
      if (e.target.closest("#menu-btn")) { const o = document.body.classList.toggle("menu-open"); $("#menu-btn").setAttribute("aria-expanded", String(o)); $("#menu-btn").innerHTML = icone(o ? "close" : "menu"); return; }
      if (e.target.closest("[data-top]")) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
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
        return;
      }
      if (document.body.classList.contains("menu-open") && !e.target.closest("#nav")) fecharMenu();
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
    // ?lang= e ?tema= no endereço (modo incorporado) valem só para esta visita; nada é salvo
    const qs = new URLSearchParams(location.search), pedido = (qs.get("lang") || "").toUpperCase(), tq = qs.get("tema");
    const salvo = ler("lang");
    const nav = (navigator.language || "pt").slice(0, 2).toLowerCase();
    state.lang = LANGS.includes(pedido) ? pedido : LANGS.includes(salvo) ? salvo : nav === "en" ? "EN" : nav === "es" ? "ES" : "PT";
    if (tq === "claro") document.documentElement.setAttribute("data-theme", "light");
    else if (tq === "escuro") document.documentElement.removeAttribute("data-theme");
    tema(false);
    montarCabecalho();
    eventos(); dicas(); efeitosGlobais();
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

  async function municipios() {
    if (!state.muns) { try { state.muns = await json("site/data/municipios.json"); } catch (e) { state.muns = {}; } }
    return state.muns;
  }

  const paginas = {};
  window.APP = { state, t, nf, pct, esc, titulo, ufNome, hora, numTeste, nomeTeste, nTestes, txtTestes, consultarSecao, votosTurno, icone, json, tabela, tile, barras, barrasCartao, barrasTurno, chip, chipStatus,
    status, botCta, linkAtlas, acoes, dec, zona, municipios, render, paginas, guardar, ler, efeitos, tema, REPO, DL_PAUSA, TELEGRAM, PAGINAS, MAIS, ICO_MAIS, blocoCodigo, tabelaTP, tpExecutar, $, $$ };
  document.addEventListener("DOMContentLoaded", iniciar);
})();
