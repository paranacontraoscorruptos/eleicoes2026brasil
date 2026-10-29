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

  function tabela(cab, linhas, cls) {
    return `<div class="table-wrap"><table class="${cls || ""}"><thead><tr>${cab.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  // Ações da página: compartilhar, gerar imagem para redes (quando há cartão) e imprimir/PDF
  function acoes(img, extra) {
    const L = t();
    return `<div class="pg-acoes">${extra || ""}
      <button class="btn btn-sm" type="button" data-share>${icone("share")} ${esc(L.sh_btn)}</button>
      ${img ? `<button class="btn btn-sm" type="button" data-img>${icone("image")} ${esc(L.im_btn)}</button>` : ""}
      <button class="btn btn-sm btn-ghost" type="button" data-print>${icone("print")} ${esc(L.pr_btn)}</button></div>`;
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

  function paginaInicio() {
    const L = t(), R = state.R, T1 = R.turnos["1"], T2 = R.turnos["2"], P2 = T2.presidente;
    const A = R.autor;
    const tiles = [
      tile(T2.entrada.secoes, L.st_secoes, L.tip_secoes(nf(T2.entrada.linhas)), "grid"),
      tile(15, L.st_testes, L.tip_testes, "flask"),
      tile(T2.secoes_sinalizadas, L.st_sinal, L.tip_sinal, "flag", `(${pct(T2.secoes_sinalizadas / T2.entrada.secoes)})`),
      tile(P2.aptos, L.st_aptos, L.tip_aptos, "users"),
      tile(P2.comparecimento, L.st_comp, L.tip_comp(nf(P2.comparecimento), nf(P2.aptos - P2.comparecimento)), "vote", `(${pct(P2.comparecimento / P2.aptos)})`),
      tile(T2.entrada.boletins, L.st_bol, L.tip_bol, "file"),
    ].join("");
    const comOcorr = (T) => T.testes.filter((x) => x.sinal > 0 || x.info > 0).length;
    const totDl = R.downloads.reduce((a, d) => a + d.bytes, 0);
    const pag = [
      { k: "r1", href: "#/turno/1", ic: "chart", m: L.round_card(1, nf(T1.secoes_sinalizadas), pct(T1.secoes_sinalizadas / T1.entrada.secoes)), x: miniTestes(T1),
        tip: L.tip_round(nf(T1.entrada.linhas), nf(T1.entrada.secoes), nf(T1.entrada.boletins), T1.cab.emissao) },
      { k: "r2", href: "#/turno/2", ic: "chart", m: L.round_card(2, nf(T2.secoes_sinalizadas), pct(T2.secoes_sinalizadas / T2.entrada.secoes)), x: miniTestes(T2),
        tip: L.tip_round(nf(T2.entrada.linhas), nf(T2.entrada.secoes), nf(T2.entrada.boletins), T2.cab.emissao) },
      { k: "tests", href: "#/testes", ic: "flask", m: L.m_tests, tip: L.tip_tests(comOcorr(T1), comOcorr(T2)) },
      { k: "lookup", href: "#/secao", ic: "search", m: L.m_lookup(nf(T2.entrada.secoes)), tip: L.tip_lookup, y: true },
      { k: "replicate", href: "#/replicar", ic: "terminal", m: L.m_replicate, tip: L.tip_replicate(T2.cab.nucleo_sha256.slice(0, 16)) },
      { k: "downloads", href: "#/downloads", ic: "download", m: L.m_downloads(nf(R.downloads.length), tamanho(totDl)), tip: L.tip_downloads(nf(R.downloads.length), tamanho(totDl)) },
      { k: "limits", href: "#/limitacoes", ic: "shield", m: L.m_limits, tip: L.tip_limits },
      { k: "bot", ic: "chat", m: L.m_bot, tip: L.tip_bot, y: true, bot: true },
    ];
    const cards = pag.map((c, i) => {
      const [tit, desc] = L.pg[c.k];
      const dentro = `<span class="pc-num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span class="pc-ico">${icone(c.ic)}</span>
        <span class="pc-title">${esc(tit)}</span><span class="pc-desc">${esc(desc)}</span>${c.x || ""}<span class="pc-metric">${esc(c.m)}</span>
        <span class="pc-go">${esc(c.bot ? L.pg_ask : L.pg_open)} ${icone("arrow")}</span>`;
      const cls = `page-card spot tilt${c.y ? " y" : ""}`;
      return c.bot ? `<button class="${cls}" type="button" data-open-bot data-tip="${esc(c.tip)}">${dentro}</button>`
        : `<a class="${cls}" href="${c.href}" data-tip="${esc(c.tip)}">${dentro}</a>`;
    }).join("");
    const cands = P2.candidatos.filter((c) => c.nr !== "95" && c.nr !== "96");
    const val = cands.reduce((a, c) => a + c.votos, 0);
    const br = P2.candidatos.find((c) => c.nr === "95"), nu = P2.candidatos.find((c) => c.nr === "96");
    state.cartao = { kicker: L.round(2) + " · " + L.roundDate[2], titulo: L.hero_title,
      linhas: [[L.st_secoes, nf(T2.entrada.secoes)], [L.st_testes, "15"], [L.st_sinal, `${nf(T2.secoes_sinalizadas)} (${pct(T2.secoes_sinalizadas / T2.entrada.secoes)})`],
        [L.st_aptos, nf(P2.aptos)], [L.st_comp, `${nf(P2.comparecimento)} (${pct(P2.comparecimento / P2.aptos)})`]] };
    const ferr = MAIS.filter(([k]) => k !== "saved").map(([k, h], i) => {
      const [tit, desc] = L.pg2[k];
      return `<a class="page-card spot tilt${i % 3 === 1 ? " y" : ""}" href="${h}"><span class="pc-ico">${icone(ICO_MAIS[k])}</span>
        <span class="pc-title">${esc(tit)}</span><span class="pc-desc">${esc(desc)}</span><span class="pc-go">${esc(L.pg_open)} ${icone("arrow")}</span></a>`;
    }).join("");
    const pres = barras(cands.map((c) => ({ rotulo: `${titulo(c.nome)} (${c.nr})`, valor: c.votos, texto: `${pct(c.votos / val)}`,
      dica: `${nf(c.votos)} · ${pct(c.votos / val)} ${L.valid}\n${titulo(c.nome)} (${c.nr})` })));
    return `
    <section class="hero">
      <canvas class="hero-canvas" aria-hidden="true"></canvas>
      <div class="hero-txt">
        <p class="kicker" data-scramble>${esc(L.hero_kicker)}</p>
        <h1 data-type>${esc(L.hero_title)}</h1>
        <p class="lead">${esc(L.hero_sub)}</p>
        <div class="hero-actions">
          <button class="btn btn-bot btn-lg" type="button" data-open-bot>${icone("chat")} ${esc(L.bot_cta_btn)}</button>
          <a class="btn btn-primary btn-lg" href="#/secao">${icone("search")} ${esc(L.cta_lookup)}</a>
          <a class="btn btn-ghost btn-lg" href="#/downloads">${icone("download")} ${esc(L.cta_downloads)}</a>
        </div>
        ${acoes(true)}
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-ring"></div><div class="hero-ring r2"></div>
        <div class="hero-lens">${lente()}</div>
        <div class="float-chip c1"><span class="fc-ico">${icone("grid")}</span><span><b>${nf(T2.entrada.secoes)}</b>${esc(L.hero_chip_sec)}</span></div>
        <div class="float-chip c2 y"><span class="fc-ico">${icone("flask")}</span><span><b>15</b>${esc(L.hero_chip_tests)}</span></div>
        <div class="float-chip c3"><span class="fc-ico">${icone("check")}</span><span><b>2</b>${esc(L.hero_chip_rounds)}</span></div>
      </div>
    </section>
    ${botCta(false)}
    ${telegram(false)}
    <section aria-labelledby="h-stats"><h2 id="h-stats">${esc(L.stats_title)}</h2><p class="sec-sub small">${esc(L.stats_sub)}</p>
      <div class="tiles tiles-3">${tiles}</div>
    </section>
    <section aria-labelledby="h-pages"><h2 id="h-pages">${esc(L.explore_title)}</h2><p class="sec-sub">${esc(L.explore_sub)}</p>
      <div class="pages">${cards}</div>
    </section>
    <section aria-labelledby="h-tools"><h2 id="h-tools">${esc(L.tools_title)}</h2><p class="sec-sub">${esc(L.tools_sub)}</p>
      <div class="pages pages-tools">${ferr}</div>
    </section>
    <section class="grid2">
      <div class="card pres-home"><h2>${esc(L.home_pres_title)}</h2><p class="small muted">${esc(L.home_pres_sub)}</p>${pres}
        <p class="small muted">${esc(L.blank)}: ${nf(br.votos)} · ${esc(L.null_)}: ${nf(nu.votos)}</p>
        <a class="btn btn-sm" href="#/turno/2">${esc(L.home_pres_more)} ${icone("arrow")}</a></div>
      <div class="card"><h2>${esc(L.tl_title)}</h2>
        <ol class="timeline">${L.tl.map(([d, x], i) => `<li${i % 2 ? ' class="y"' : ""}><time>${esc(d)}</time><span>${esc(x)}</span></li>`).join("")}</ol></div>
    </section>
    <section class="card" aria-labelledby="h-lk"><h2 id="h-lk">${esc(L.lookup_cta_title)}</h2><p>${esc(L.lookup_cta_text)}</p>${formSecao(true)}</section>
    <section aria-labelledby="h-leg"><h2 id="h-leg">${esc(L.legend_title)}</h2>
      <ul class="legend">${L.legend.map(([c, n, d]) => `<li>${chip(c, n)} <span class="muted">${esc(d)}</span></li>`).join("")}</ul>
    </section>
    <section class="card author" aria-labelledby="h-au">
      <div class="avatar"><img src="site/img/autor.jpg" alt="" width="96" height="96" loading="lazy" decoding="async"></div>
      <div class="author-body"><h2 id="h-au">${esc(L.author_title)}</h2>
        <p class="author-name">${esc(A.nome)}</p>
        <p><span class="muted">${esc(L.author_spec)}:</span> ${esc(A.especialidade[state.lang])}<br><span class="muted">${esc(L.author_place)}:</span> ${esc(A.local[state.lang])}</p>
        <p><a class="btn btn-sm" href="https://www.instagram.com/${esc(A.instagram.replace("@", ""))}/" rel="noopener" target="_blank">${icone("insta")} ${esc(A.instagram)}</a></p>
      </div>
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
    const testes = tabela([L.th_test, L.th_units, L.th_anom, L.th_info, L.th_raw, L.th_rate, L.th_status],
      T.testes.map((x) => [`<a href="#/testes/${x.id}">${numTeste(x.id)}. ${esc(nomeTeste(x.id))}</a>`, nf(x.unidades || 0), nf(x.sinal), nf(x.info),
        x.brutos == null ? "—" : nf(x.brutos), x.unidades ? pct(x.sinal / x.unidades, 3) : "—", chipStatus(x)]), "num-cols");
    const ufs = T.uf.slice().sort((a, b) => b.sinal / b.secoes - a.sinal / a.secoes);
    const ufBar = barras(ufs.map((u) => ({ rotulo: u.uf, valor: u.sinal / u.secoes, texto: pct(u.sinal / u.secoes),
      dica: `${pct(u.sinal / u.secoes)}\n${ufNome(u.uf)}: ${nf(u.sinal)} / ${nf(u.secoes)} ${L.th_sections.toLowerCase()}` })));
    const ufTab = tabela([L.th_uf, L.th_sections, L.th_flagged, L.th_pct], ufs.map((u) => [`${u.uf} – ${esc(ufNome(u.uf))}`, nf(u.secoes), nf(u.sinal), pct(u.sinal / u.secoes)]), "num-cols");
    // Sem seções convergentes (2º turno), a seção não aparece
    const conv = T.convergentes.length
      ? `<section><h2>${esc(L.r_conv_title)}</h2><p class="small muted">${esc(L.r_conv_sub)}</p>${tabela(["UF", L.th_mun, L.th_zone, L.th_section, L.th_tests], T.convergentes.map((c) => [c.uf, esc(titulo(c.mun)), c.zona,
        `<a href="#/secao/${c.uf}/${c.zona}/${c.secao}">${c.secao}</a>`, c.testes.split(",").map((x) => `<a href="#/testes/${x}">${numTeste(x)}</a>`).join(", ")]))}</section>`
      : "";
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
    state.cartao = { kicker: L.roundDate[n], titulo: `${L.round(n)} · ${L.cd_pres}`, linhas: cands.slice(0, 4).map((c) => [`${titulo(c.nome)} (${c.nr})`, `${nf(c.votos)} (${pct(c.votos / val)})`])
      .concat([[L.blank, nf(br.votos)], [L.null_, nf(nu.votos)], [L.r_flagged, `${nf(T.secoes_sinalizadas)} (${pct(T.secoes_sinalizadas / T.entrada.secoes)})`]]) };
    return `
    <header class="page-head"><p class="kicker">${esc(L.roundDate[n])}</p><h1>${esc(L.round(n))}</h1>
      <p class="muted">${esc(L.r_processed(nf(T.entrada.linhas), nf(T.entrada.secoes), nf(T.entrada.boletins)))}</p>${acoes(true)}</header>
    <div class="tiles">
      ${tile(T.secoes_sinalizadas, L.r_flagged, L.tip_sinal, "flag", `(${pct(T.secoes_sinalizadas / T.entrada.secoes)})`)}
      ${tile(P.aptos, L.st_aptos, L.tip_aptos, "users")}
      ${tile(P.comparecimento, L.st_comp, L.tip_comp(nf(P.comparecimento), nf(P.aptos - P.comparecimento)), "vote", `(${pct(P.comparecimento / P.aptos)})`)}
    </div>
    <section class="card"><h2>${esc(L.r_pres_title)}</h2>${pres}</section>
    <section><h2>${esc(L.r_tests_title)}</h2>${testes}</section>
    <section class="card"><div class="h-row"><h2>${esc(L.r_uf_title)}</h2><button class="btn btn-sm btn-ghost" type="button" data-toggle-view="uf">${esc(L.show_table)}</button></div>
      <p class="small muted">${esc(L.r_uf_sub)}</p><div data-view="uf-chart">${ufBar}</div><div data-view="uf-table" hidden>${ufTab}</div></section>
    ${conv}
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
            <a class="btn btn-sm" href="#/graficos/${tid}">${icone("chart")} ${esc(L.f_chart)}</a> <a class="btn btn-sm btn-ghost" href="#/lista?teste=${tid}">${icone("list")} ${esc(L.f_list)}</a>
            <span class="small">${icone("code")} ${esc(L.f_code)}: ${codigo}</span></p>
          </div></details></article>`;
    }).join("");
    return `<header class="page-head"><h1>${esc(L.tests_title)}</h1><p class="lead">${esc(L.tests_sub)}</p>${acoes(false)}
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
      <div id="lk-saved"></div>
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
    const nomeMun = titulo(d.mun[1]);
    const cart = [];
    [2, 1].forEach((n) => {
      const tv = rec[n]; if (!tv) return;
      const { v, nomes } = votosTurno(n, tv);
      const cs = Object.keys(v).filter((nr) => nr !== "95" && nr !== "96" && v[nr] > 0).sort((a, b) => v[b] - v[a]).slice(0, n === 1 ? 3 : 2);
      const f = flags[String(n)];
      cart.push([L.round(n), `${L.lk_comp} ${nf(tv[1])} / ${nf(tv[0])}`]);
      cs.forEach((nr) => cart.push([`  ${titulo(nomes[nr])} (${nr})`, nf(v[nr])]));
      const ts = f && f.o.length ? [...new Set(f.o.map((o) => numTeste(o[0])))] : [];
      cart.push([`  ${L.lk_flags}`, ts.length ? L.cd_tests(ts.join(", "), ts.length) : L.cd_none]);
    });
    state.cartao = { kicker: `${d.uf} · ${nomeMun}`, titulo: `${L.th_zone} ${d.z} · ${L.th_section} ${d.s}`, linhas: cart };
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
    return `<header class="page-head"><h1>${esc(L.dl_title)}</h1><p class="lead">${esc(L.dl_sub)}</p>${acoes(false)}</header>
      <section class="card dl-all"><a class="btn btn-primary btn-lg" href="${ZIP}">${icone("download")} ${esc(L.dl_all)}</a><p class="small muted">${esc(L.dl_all_note)}</p></section>
      ${grupo(L.dl_code, R.downloads.filter((d) => d.turno === 0))}
      ${[1, 2].map((n) => grupo(L.dl_round(n), R.downloads.filter((d) => d.turno === n).sort(ord))).join("")}
      <section><h2>${esc(L.rp_hash_title)}</h2>${blocoCodigo("certutil -hashfile Relatorio_Tecnico_Auditoria_Eleicoes_2026_PT.md SHA512")}</section>
      ${botCta(true)}`;
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
      ${botCta(true)}`;
  }

  // --- roteamento ------------------------------------------------------------------
  function rota() {
    const h = (location.hash || "#/").replace(/^#/, "");
    const [cam, q] = h.split("?");
    state.query = new URLSearchParams(q || "");
    return cam.split("/").filter(Boolean).map(decodeURIComponent);
  }

  async function render() {
    const L = t(), p = rota(), main = $("#main");
    let html, ativo = "home", tit = L.hero_title, pg = null;
    state.cartao = null;
    if (p[0] === "turno" && (p[1] === "1" || p[1] === "2")) { html = paginaTurno(p[1]); ativo = "r" + p[1]; tit = L.round(+p[1]); }
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
    if (p[0] === "secao") await iniciarSecao(p[1], p[2], p[3]);
    if (pg && pg.iniciar) await pg.iniciar(p);
    document.dispatchEvent(new CustomEvent("pagina", { detail: { rota: p, titulo: tit } }));
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
  const ICO_MAIS = { map: "map", states: "pin", list: "list", charts: "chart", glossary: "book", verify: "hash", ballot: "qr", saved: "star", updates: "bell" };
  // Páginas do menu "Mais" (ferramentas e consultas)
  const MAIS = [["map", "#/mapa"], ["states", "#/uf"], ["list", "#/lista"], ["charts", "#/graficos"], ["glossary", "#/glossario"], ["verify", "#/conferir"],
    ["ballot", "#/boletim"], ["saved", "#/salvas"], ["updates", "#/atualizacoes"]];

  function montarCabecalho() {
    const L = t();
    marca();
    $("#badge").textContent = L.badge;
    $("#nav").innerHTML = '<span class="nav-hover" aria-hidden="true"></span><span class="nav-ind" aria-hidden="true"></span>'
      + PAGINAS.map(([k, h], i) => `<a href="${h}" data-nav="${k}" style="--i:${i}">${esc(L.nav[k])}</a>`).join("")
      // no celular as ferramentas ficam no menu lateral; no computador, na segunda fileira (#nav2)
      + `<div class="nav-more" style="--i:${PAGINAS.length}"><div class="nav-sub" id="nav-sub"><span class="nav-sub-t">${esc(L.nav.more_title)}</span>${MAIS.map(([k, h], i) => `<a href="${h}" data-nav="${k}" style="--i:${PAGINAS.length + i + 1}">${icone(ICO_MAIS[k])}<span>${esc(L.nav[k])}</span></a>`).join("")}</div></div>
        <button class="nav-a11y" type="button" data-a11y>${icone("a11y")} ${esc(L.ax_title)}</button>`;
    $("#nav2").setAttribute("aria-label", L.nav.more_title);
    $("#nav2").innerHTML = `<div class="nav2-in">${MAIS.map(([k, h]) => `<a href="${h}" data-nav="${k}">${icone(ICO_MAIS[k])}<span>${esc(L.nav[k])}</span></a>`).join("")}</div>`;
    $("#lang").innerHTML = LANGS.map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === state.lang}">${l}</button>`).join("");
    $("#lang").setAttribute("aria-label", L.lang);
    $("#theme-btn").setAttribute("aria-label", L.theme); $("#theme-btn").title = L.theme;
    $("#menu-btn").setAttribute("aria-label", L.menu);
    $("#search-btn").innerHTML = icone("search"); $("#search-btn").setAttribute("aria-label", L.sr_open); $("#search-btn").title = L.sr_open + " ( / )";
    $("#a11y-btn").innerHTML = icone("a11y"); $("#a11y-btn").setAttribute("aria-label", L.ax_open); $("#a11y-btn").title = L.ax_open;
    iconeTema();
    montarRodape();
    document.documentElement.lang = { PT: "pt-BR", EN: "en", ES: "es" }[state.lang];
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
          <li><a href="feed.xml" data-feed>${esc(L.ft_feed)}</a></li></ul></div>
        <div class="foot-col"><h3>${esc(L.ft_author)}</h3><ul>
          ${A ? `<li><b>${esc(A.nome)}</b></li><li>${ext(`https://www.instagram.com/${A.instagram.replace("@", "")}/`, "Instagram " + A.instagram)}</li>` : ""}
          <li><button class="btn btn-bot btn-sm" type="button" data-open-bot>${icone("chat")} ${esc(L.bot_cta_btn)}</button></li></ul></div>
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
  const SEL_RV = ".card, .tile, .page-card, .test-card, figure, .table-wrap, .bot-cta, .bot-band, .tg-cta, .steps > li, .legend > li, main section > h2, main section > .sec-sub, .h-row, main > section > p, .btn-row, .page-head > p, .page-head > ul";
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
      const claro = document.documentElement.getAttribute("data-theme") === "light";
      const g = claro ? "0,135,58" : "31,195,95", y = claro ? "176,124,0" : "255,212,0";
      const tt = (agora - t0) / 1000, varre = ((tt / 7) % 1.25) * h;
      ctx.clearRect(0, 0, w, h);
      // papel milimetrado
      ctx.beginPath();
      for (let x = 0; x < w; x += 28) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); }
      for (let k = 0; k < h; k += 28) { ctx.moveTo(0, k + .5); ctx.lineTo(w, k + .5); }
      ctx.strokeStyle = `rgba(${g},${claro ? .07 : .06})`; ctx.lineWidth = 1; ctx.stroke();
      // faixa de varredura
      if (varre < h) {
        const gr = ctx.createLinearGradient(0, varre - 60, 0, varre);
        gr.addColorStop(0, `rgba(${y},0)`); gr.addColorStop(1, `rgba(${y},${claro ? .08 : .06})`);
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
        let a = (.1 + p.z * .2) * (claro ? .7 : 1) * (.3 + .7 * Math.min(1, x / (w * .75))) * Math.max(0, borda);
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
    const salvo = ler("lang");
    const nav = (navigator.language || "pt").slice(0, 2).toLowerCase();
    state.lang = LANGS.includes(salvo) ? salvo : nav === "en" ? "EN" : nav === "es" ? "ES" : "PT";
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
  window.APP = { state, t, nf, pct, esc, titulo, ufNome, hora, numTeste, nomeTeste, consultarSecao, votosTurno, icone, json, tabela, tile, barras, chip, chipStatus,
    status, botCta, acoes, dec, zona, municipios, render, paginas, guardar, ler, efeitos, REPO, TELEGRAM, PAGINAS, MAIS, ICO_MAIS, $, $$ };
  document.addEventListener("DOMContentLoaded", iniciar);
})();
