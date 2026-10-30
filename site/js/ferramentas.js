/* Ferramentas gerais do site: compartilhar, imagem para redes, imprimir, avisar erro, seções salvas,
   busca, acessibilidade (fonte, contraste, Libras), app instalável e contador de visitas. */
(function () {
  "use strict";

  const A = window.APP;
  const { esc, icone, $, $$ } = A;
  const t = () => A.t();
  const URL_SITE = "https://paranacontraoscorruptos.org/";
  // Contador de visitas (GoatCounter, sem cookies). Fica desligado enquanto o código da conta estiver vazio.
  const GOATCOUNTER = "paranacontraoscorruptos";

  // --- janela (dialog) ---------------------------------------------------------------------------------------
  function janela(titulo, corpo, cls) {
    const d = document.createElement("dialog");
    d.className = "dlg " + (cls || "");
    d.innerHTML = `<div class="dlg-head"><h2>${esc(titulo)}</h2><button class="icon-btn dlg-x" type="button" aria-label="${esc(t().x_close)}">${icone("close")}</button></div><div class="dlg-body">${corpo}</div>`;
    document.body.appendChild(d);
    const fechar = () => d.close();
    d.querySelector(".dlg-x").addEventListener("click", fechar);
    d.addEventListener("click", (e) => { if (e.target === d) fechar(); });
    d.addEventListener("close", () => { d.remove(); document.body.classList.remove("dlg-open"); });
    document.body.classList.add("dlg-open");
    d.showModal();
    return d;
  }

  async function copiarTexto(txt) {
    try { await navigator.clipboard.writeText(txt); return true; } catch (e) {
      const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      ta.remove(); return ok;
    }
  }

  // --- compartilhar ---------------------------------------------------------------------------------------------
  function urlPagina() { return URL_SITE + (location.hash && location.hash !== "#/" ? location.hash : ""); }
  const toque = () => window.matchMedia("(pointer: coarse)").matches;

  // Ícones das redes: desenho simples em branco sobre a cor de cada uma
  const txtIco = (s, tam) => `<text x="12" y="${tam > 14 ? 17.6 : 16.4}" text-anchor="middle" font-size="${tam}" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="#fff">${s}</text>`;
  const envelope = (cor) => `<rect x="3.5" y="6" width="17" height="12" rx="2" fill="#fff"/><path d="m4 7 8 6.2L20 7" fill="none" stroke="${cor}" stroke-width="1.8" stroke-linejoin="round"/>`;
  const REDE_ICO = {
    whatsapp: '<path d="M12 3.6a8.4 8.4 0 0 0-7.2 12.7l-1.2 4.1 4.2-1.1A8.4 8.4 0 1 0 12 3.6z" fill="none" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.2 8.1c.2-.3.6-.3.8 0l.8 1.5c.1.2 0 .5-.2.7l-.5.5c.5 1.1 1.4 2 2.5 2.5l.5-.5c.2-.2.5-.3.7-.2l1.5.8c.3.2.3.6 0 .8-.6.7-1.5 1-2.4.6a7.9 7.9 0 0 1-4.4-4.4c-.3-.9 0-1.8.7-2.3z" fill="#fff"/>',
    telegram: '<path d="M20.8 4.2 3.3 11.1c-.8.3-.7 1.3.1 1.5l4.4 1.3 1.6 5c.2.7 1.1.8 1.5.3l2.4-2.5 4.3 3.1c.6.4 1.4.1 1.6-.6l2.7-12.6c.2-.9-.6-1.6-1.1-1.4z" fill="#fff"/><path d="m8 13.8 8.7-5.6-6.2 6.6-.4 3" fill="none" stroke="#229ed9" stroke-width="1.2" stroke-linejoin="round"/>',
    facebook: '<path d="M13.6 21v-7.3h2.5l.4-2.9h-2.9V9c0-.8.3-1.4 1.4-1.4h1.6V5c-.3 0-1.2-.1-2.3-.1-2.2 0-3.7 1.4-3.7 3.8v2.1H8.2v2.9h2.4V21z" fill="#fff"/>',
    x: '<path d="M4.2 4h4.5l3.6 5 4.2-5h2.4l-5.5 6.5L20 20h-4.5l-3.9-5.4L7 20H4.6l5.9-6.9z" fill="#fff"/>',
    threads: txtIco("@", 16),
    bluesky: '<path d="M12 10.9c-1.3-2.6-4.8-6-6.8-6-1.6 0-1.4 2.6-1 4.4.4 1.9 1.9 2.9 4 2.8-2.3.5-3.3 1.8-2.4 3.3.9 1.4 2.9 1.5 6.2-3 3.3 4.5 5.3 4.4 6.2 3 .9-1.5-.1-2.8-2.4-3.3 2.1.1 3.6-.9 4-2.8.4-1.8.6-4.4-1-4.4-2 0-5.5 3.4-6.8 6z" fill="#fff"/>',
    linkedin: txtIco("in", 13),
    reddit: '<circle cx="12" cy="13.6" r="6.2" fill="#fff"/><circle cx="9.6" cy="13" r="1.1" fill="#ff4500"/><circle cx="14.4" cy="13" r="1.1" fill="#ff4500"/><path d="M9.5 15.8c1.5.9 3.5.9 5 0" stroke="#ff4500" stroke-width="1.1" fill="none" stroke-linecap="round"/><circle cx="16.6" cy="5.6" r="1.4" fill="#fff"/><path d="m12 7.4 1-3 3.5.9" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/>',
    pinterest: txtIco("P", 16),
    tumblr: txtIco("t", 16),
    messenger: '<path d="M12 3.5c-4.8 0-8.5 3.5-8.5 8 0 2.5 1.2 4.8 3.2 6.3v3.1l2.9-1.6c.8.2 1.6.3 2.4.3 4.8 0 8.5-3.5 8.5-8.1s-3.7-8-8.5-8z" fill="#fff"/><path d="m7 14.2 3.6-3.8 2 2 3.4-2-3.6 3.8-2-2z" fill="#0084ff"/>',
    sms: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V16A2.5 2.5 0 0 1 4 13.5z" fill="#fff"/><circle cx="8.5" cy="10" r="1.1" fill="#34c759"/><circle cx="12" cy="10" r="1.1" fill="#34c759"/><circle cx="15.5" cy="10" r="1.1" fill="#34c759"/>',
    gmail: envelope("#ea4335"), outlook: envelope("#0078d4"), email: envelope("#4b6356"),
    instagram: '<rect x="4" y="4" width="16" height="16" rx="4.6" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="12" cy="12" r="3.8" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="16.7" cy="7.3" r="1.15" fill="#fff"/>',
    tiktok: '<path d="M14.4 3.5h2.7c.3 2 1.6 3.3 3.4 3.5v2.7a6.6 6.6 0 0 1-3.4-1.1v6.2a5.3 5.3 0 1 1-5.3-5.3l.8.1v2.8a2.6 2.6 0 1 0 1.8 2.5z" fill="#fff"/>',
    youtube: '<rect x="2.6" y="6" width="18.8" height="12.4" rx="3.6" fill="#fff"/><path d="m10.2 9.3 4.9 2.9-4.9 2.9z" fill="#ff0000"/>',
    kwai: txtIco("K", 16),
    status: '<circle cx="12" cy="12" r="7.6" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4.4 2.4"/><circle cx="12" cy="12" r="3.3" fill="#fff"/>',
    fbstory: '<rect x="7" y="3.5" width="10" height="17" rx="2.6" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M12 9v6M9 12h6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
  };
  const icoRede = (k) => `<span class="sh-ico r-${k}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${REDE_ICO[k]}</svg></span>`;
  // Redes que não recebem link de um site: o site cria a imagem ou o vídeo e copia o texto
  const APPS_POST = { instagram: ["https://www.instagram.com/", "post"], tiktok: ["https://www.tiktok.com/upload", "video"], youtube: ["https://www.youtube.com/upload", "video"],
    kwai: ["https://www.kwai.com/", "video"], status: ["https://web.whatsapp.com/", "story"], fbstory: ["https://www.facebook.com/stories/create", "story"] };

  function textoPost(url) { const L = t(); return `${L.sh_text} ${url}\n\n${L.sh_tags}`; }

  // o: endereço, título e cartão próprios (respostas do Atlas); sem o, a página atual ou o site
  async function compartilhar(site, o = {}) {
    const L = t();
    const url = o.url || (site ? URL_SITE : urlPagina());
    const titulo = o.titulo || (site ? L.hero_title : document.title);
    const texto = L.sh_text;
    // celular: a lista de apps do próprio aparelho já traz todas as redes instaladas
    if (navigator.share && toque()) {
      try { await navigator.share({ title: titulo, text: texto, url }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const u = encodeURIComponent(url), tx = encodeURIComponent(texto + " " + url), tt = encodeURIComponent(texto), ti = encodeURIComponent(titulo);
    const links = [["whatsapp", "WhatsApp", `https://wa.me/?text=${tx}`], ["telegram", "Telegram", `https://t.me/share/url?url=${u}&text=${tt}`],
      ["facebook", "Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`], ["x", "X (Twitter)", `https://twitter.com/intent/tweet?url=${u}&text=${tt}`],
      ["threads", "Threads", `https://www.threads.net/intent/post?text=${tx}`], ["bluesky", "Bluesky", `https://bsky.app/intent/compose?text=${tx}`],
      ["linkedin", "LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${u}`], ["reddit", "Reddit", `https://www.reddit.com/submit?url=${u}&title=${ti}`],
      ["pinterest", "Pinterest", `https://pinterest.com/pin/create/button/?url=${u}&media=${encodeURIComponent(URL_SITE + "site/img/og.jpg")}&description=${tt}`],
      ["tumblr", "Tumblr", `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${u}&title=${ti}&caption=${tt}`]]
      .concat(toque() ? [["messenger", "Messenger", `fb-messenger://share/?link=${u}`], ["sms", "SMS", `sms:?&body=${tx}`]] : [])
      .concat([["gmail", "Gmail", `https://mail.google.com/mail/?view=cm&fs=1&su=${ti}&body=${tx}`], ["outlook", "Outlook", `https://outlook.live.com/mail/0/deeplink/compose?subject=${ti}&body=${tx}`],
        ["email", L.sh_email, `mailto:?subject=${ti}&body=${tx}`]]);
    const sistema = navigator.share && !toque();
    const d = janela(L.sh_title, `<div class="sh-main">
      <p class="small muted sh-pg">${esc(titulo)}</p>
      <h3 class="sh-h">${esc(L.sh_sec_link)}</h3>
      <div class="sh-grid">${links.map(([k, n, h]) => `<a class="btn sh-rede" href="${esc(h)}" target="_blank" rel="noopener">${icoRede(k)}<span>${esc(n)}</span></a>`).join("")}</div>
      <h3 class="sh-h">${esc(L.sh_sec_post)}</h3>
      <p class="small muted">${esc(L.sh_post_note)}</p>
      <div class="sh-grid">${Object.keys(APPS_POST).map((k) => `<button class="btn sh-rede" type="button" data-post="${k}">${icoRede(k)}<span>${esc(L.sh_apps[k].nome)}</span></button>`).join("")}</div>
      <h3 class="sh-h">${esc(L.sh_sec_more)}</h3>
      <div class="sh-link"><input type="text" readonly value="${esc(url)}" aria-label="${esc(L.sh_link)}"><button class="btn btn-primary" type="button" data-cp>${icone("link")} ${esc(L.sh_copy)}</button></div>
      <div class="btn-row sh-mais">${sistema ? `<button class="btn" type="button" data-sys>${icone("share")} ${esc(L.sh_system)}</button>` : ""}<button class="btn" type="button" data-qr>${icone("qr")} ${esc(L.sh_qr_title)}</button></div>
      <div class="sh-qrbox" hidden></div></div><div class="sh-post" hidden></div>`, "dlg-share");
    const principal = d.querySelector(".sh-main"), post = d.querySelector(".sh-post");
    d.querySelector("[data-cp]").addEventListener("click", async (e) => {
      const bt = e.currentTarget;
      const ok = await copiarTexto(url);
      bt.lastChild.textContent = " " + (ok ? L.copied : L.sh_copy);
    });
    const sb = d.querySelector("[data-sys]");
    if (sb) sb.addEventListener("click", async () => { try { await navigator.share({ title: titulo, text: texto, url }); } catch (e) { /* cancelado */ } });
    d.querySelector("[data-qr]").addEventListener("click", async (e) => {
      const bt = e.currentTarget;
      const box = d.querySelector(".sh-qrbox");
      box.hidden = !box.hidden; e.currentTarget.setAttribute("aria-expanded", String(!box.hidden));
      if (!box.hidden && !box.innerHTML) box.innerHTML = await blocoQr(url);
    });
    d.addEventListener("click", (e) => {
      const b = e.target.closest("[data-post]");
      if (b) { principal.hidden = true; post.hidden = false; painelPost(post, b.dataset.post, url, o.cartao || cartaoAtual(site), o.fonte || (site || !A.exportar ? null : A.exportar.fontePagina)); post.scrollIntoView({ block: "start" }); return; }
      if (e.target.closest("[data-voltar]")) { limparMidia(post); post.hidden = true; post.innerHTML = ""; principal.hidden = false; }
    });
    d.addEventListener("close", () => limparMidia(post));
  }

  // Passo a passo para postar numa rede que não recebe link: formato, arquivo, texto e abrir a rede
  function painelPost(box, k, url, c, fonte) {
    const L = t(), ap = L.sh_apps[k], [urlApp, fmt] = APPS_POST[k];
    box.innerHTML = `<button class="btn btn-sm btn-ghost sh-voltar" type="button" data-voltar>‹ ${esc(L.sh_back)}</button>
      <h3 class="sh-post-t">${icoRede(k)}<span>${esc(ap.titulo)}</span></h3>
      <p class="small sh-dica">${esc(ap.dica)}</p>
      <h4 class="sh-passo">${esc(L.md_step1)}</h4><div class="md"></div>
      <h4 class="sh-passo">${esc(L.md_step2)}</h4>
      <textarea class="sh-texto" rows="3" readonly aria-label="${esc(L.md_copy_text)}">${esc(textoPost(url))}</textarea>
      <div class="btn-row"><button class="btn" type="button" data-cptx>${icone("copy")} ${esc(L.md_copy_text)}</button></div>
      <h4 class="sh-passo">${esc(L.md_step3)}</h4>
      <div class="btn-row"><a class="btn btn-primary" href="${urlApp}" target="_blank" rel="noopener">${icoRede(k)} ${esc(ap.abrir)}</a></div>
      ${toque() ? "" : `<div class="sh-qrcel"></div>`}`;
    painelMidia(box.querySelector(".md"), c, fmt, url, fonte);
    box.querySelector("[data-cptx]").addEventListener("click", async (e) => {
      const bt = e.currentTarget;
      const ok = await copiarTexto(textoPost(url));
      bt.lastChild.textContent = " " + (ok ? L.copied : L.md_copy_text);
    });
    const qc = box.querySelector(".sh-qrcel");
    if (qc) blocoQr(url).then((h) => { qc.innerHTML = h; });
  }

  // --- código QR (abrir a página no celular) ----------------------------------------------------------------------
  function carregarScript(src, global) {
    if (window[global]) return Promise.resolve(window[global]);
    return new Promise((ok, falha) => {
      const s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = () => (window[global] ? ok(window[global]) : falha(new Error(src)));
      s.onerror = () => falha(new Error(src));
      document.head.appendChild(s);
    });
  }
  async function svgQr(texto) {
    const qrcode = await carregarScript("site/js/vendor/qrcode.min.js", "qrcode");
    const q = qrcode(0, "M"); q.addData(texto); q.make();
    const n = q.getModuleCount(), m = 2;
    let p = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) p += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg class="qr" viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" shape-rendering="crispEdges" role="img" aria-label="QR Code"><rect width="100%" height="100%" fill="#fff"/><path d="${p}" fill="#000"/></svg>`;
  }
  async function blocoQr(url) {
    const L = t();
    try { return `<div class="sh-qr">${await svgQr(url)}<div><b>${esc(L.sh_qr_title)}</b><p class="small muted">${esc(L.sh_qr_note)}</p></div></div>`; }
    catch (e) { return ""; }
  }

  // --- imagem e vídeo para redes sociais ------------------------------------------------------------------------------
  const F_DISP = '"Space Grotesk", system-ui, sans-serif', F_SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", F_MONO = "ui-monospace, Menlo, Consolas, monospace";
  const FORMATOS = { post: [1080, 1350], story: [1080, 1920], video: [1080, 1920] };
  const DUR_VIDEO = 8;

  function quebrar(ctx, txt, larg) {
    const ps = String(txt).split(" "), linhas = [];
    let at = "";
    ps.forEach((p) => { const x = at ? at + " " + p : p; if (ctx.measureText(x).width > larg && at) { linhas.push(at); at = p; } else at = x; });
    if (at) linhas.push(at);
    return linhas;
  }
  async function fontes() {
    try { await Promise.all([document.fonts.load(`700 60px ${F_DISP}`), document.fonts.load(`600 30px ${F_DISP}`)]); } catch (e) { /* usa a fonte do sistema */ }
  }

  // Cartão da página atual; nas páginas sem números próprios, os números gerais do 2º turno
  function cartaoAtual(site) {
    if (!site && A.state.cartao) return A.state.cartao;
    const L = t(), R = A.state.R;
    const tit = document.title.split(" · ")[0];
    const c = { kicker: L.round(2) + " · " + L.roundDate[2], titulo: !site && tit && tit !== L.brand ? tit : L.hero_title, linhas: [] };
    if (R) {
      const T2 = R.turnos["2"], P2 = T2.presidente;
      c.linhas = [[L.st_secoes, A.nf(T2.entrada.secoes)], [L.st_testes, "15"], [L.st_sinal, `${A.nf(T2.secoes_sinalizadas)} (${A.pct(T2.secoes_sinalizadas / T2.entrada.secoes)})`],
        [L.st_aptos, A.nf(P2.aptos)], [L.st_comp, `${A.nf(P2.comparecimento)} (${A.pct(P2.comparecimento / P2.aptos)})`]];
      c.barras = [A.barrasTurno(2, 2)];
    }
    return c;
  }

  // Fundo fixo do cartão (desenhado uma vez; no vídeo é reaproveitado em cada quadro)
  function fundoCartao(W, H) {
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#07130c"); g.addColorStop(1, "#0c1a12");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rg = ctx.createRadialGradient(W * 0.9, 0, 10, W * 0.9, 0, 700); rg.addColorStop(0, "rgba(255,212,0,.16)"); rg.addColorStop(1, "rgba(255,212,0,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    const rg2 = ctx.createRadialGradient(0, H * 0.2, 10, 0, H * 0.2, 760); rg2.addColorStop(0, "rgba(0,156,59,.22)"); rg2.addColorStop(1, "rgba(0,156,59,0)");
    ctx.fillStyle = rg2; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.035)"; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
    const fx = ctx.createLinearGradient(0, 0, W, 0); fx.addColorStop(0, "#009c3b"); fx.addColorStop(.5, "#ffdf00"); fx.addColorStop(1, "#002776");
    ctx.fillStyle = fx; ctx.fillRect(0, 0, W, 14); ctx.fillRect(0, H - 14, W, 14);
    return cv;
  }

  // Números de um texto contando de 0 até o valor (e = 0 a 1), no formato do idioma
  function contarTexto(s, e) {
    if (e >= 1 || /\d:\d\d/.test(s)) return String(s); // horários não contam
    const L = t(), en = A.state.lang === "EN", dsep = en ? "." : ",", gsep = en ? "," : ".";
    const re = en ? /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g : /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
    return String(s).replace(re, (tok) => {
      const [int, frac] = tok.split(dsep), d = frac ? frac.length : 0;
      const v = parseFloat(int.split(gsep).join("") + (d ? "." + frac : ""));
      return new Intl.NumberFormat(L.locale, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: tok.includes(gsep) }).format(v * e);
    });
  }

  // Itens do cartão: ["t", título] · ["l", rótulo, valor] (rótulo com dois espaços na frente = sub-linha)
  // · ["b", rótulo, valor, fração de 0 a 1] · ["c", rótulo, [[cor, texto], …]] (selos coloridos).
  // c.itens vem pronto (Atlas); nas páginas, c.linhas e depois c.barras: [{ t, itens: [[rótulo, valor, fração]] }]
  function itensCartao(c) {
    if (c.itens) return c.itens;
    const l = (c.linhas || []).map(([r, v]) => ["l", r, v]);
    (c.barras || []).forEach((g) => { if (g.t) l.push(["t", g.t]); g.itens.forEach(([r, v, f]) => l.push(["b", r, v, f])); });
    return l;
  }
  const COR_CHIP = { red: ["rgba(239,68,68,.22)", "#ff6b6b"], amber: ["rgba(245,180,0,.2)", "#ffc83d"], green: ["rgba(31,195,95,.2)", "#3ddc84"] };
  const U_MIN = 42;
  const pesoTotal = (l) => l.reduce((a, x) => a + x.peso, 0);
  // Altura de cada item, em linhas: título 0,9; barra 1,4; selos que não cabem ao lado do rótulo vão para baixo (1,8)
  function pesar(ctx, it, larg, fr) {
    if (it[0] === "t") return .9;
    if (it[0] === "b") return 1.4;
    if (it[0] !== "c") return 1;
    ctx.font = `600 ${Math.round(31 * fr)}px ${F_SANS}`;
    const lr = ctx.measureText(it[1]).width;
    ctx.font = `600 ${Math.round(22 * fr)}px ${F_SANS}`;
    return lr + 24 + it[2].reduce((a, [, tx]) => a + 50 * fr + ctx.measureText(tx).width + 12, 0) <= larg ? 1 : 1.8;
  }
  // Entra o que cabe: seções inteiras (um título abre uma seção); a primeira entra mesmo cortada
  function encaixar(ctx, itens, larg, disp, alto) {
    const secs = [];
    itens.forEach((it) => {
      const x = Object.assign(it.slice(), { peso: pesar(ctx, it, larg, alto ? 1.18 : 1) });
      if (x[0] === "t" || !secs.length) secs.push([]);
      secs[secs.length - 1].push(x);
    });
    let out = [];
    secs.forEach((s) => {
      if ((pesoTotal(out) + pesoTotal(s)) * U_MIN <= disp) out = out.concat(s);
      else if (!out.length) for (const x of s) { if ((pesoTotal(out) + x.peso) * U_MIN > disp) break; out.push(x); }
    });
    while (out.length && out[out.length - 1][0] === "t") out.pop();
    return out;
  }
  function cortar(ctx, txt, larg) {
    let r = String(txt);
    if (ctx.measureText(r).width <= larg) return r;
    while (r.length > 4 && ctx.measureText(r + "…").width > larg) r = r.slice(0, -1);
    return r.trim() + "…";
  }

  // Desenha o cartão no instante tm (segundos) da animação do vídeo; tm = Infinity desenha a imagem final
  function quadroCartao(ctx, c, W, H, fundo, tm) {
    const L = t(), P = 80, alto = H > 1500;
    // Story e vídeo: o topo e a base ficam livres porque a interface dos apps cobre essas faixas
    const topo = alto ? 250 : 70, base = alto ? 270 : 0;
    const fase = (ini, dur) => { const x = Math.max(0, Math.min(1, (tm - ini) / dur)); return 1 - Math.pow(1 - x, 3); };
    ctx.globalAlpha = 1; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.drawImage(fundo, 0, 0);
    // marca
    let a = fase(0, .5);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#009c3b"; ctx.beginPath(); ctx.roundRect(P, topo, 64, 64, 16); ctx.fill();
    ctx.strokeStyle = "#ffdf00"; ctx.lineWidth = 6; ctx.lineCap = "round";
    [[16, 48, 28], [26.6, 48, 16], [37.4, 48, 32], [48, 48, 38]].forEach(([x, y1, y2]) => { ctx.beginPath(); ctx.moveTo(P + x, topo + y1); ctx.lineTo(P + x, topo + y2); ctx.stroke(); });
    ctx.fillStyle = "#eef6f0"; ctx.font = `700 38px ${F_DISP}`; ctx.fillText(L.brand, P + 86, topo + 36);
    ctx.fillStyle = "#ffd84d"; ctx.font = `600 20px ${F_SANS}`; ctx.fillText(L.brand_sub.toUpperCase(), P + 88, topo + 64);
    // título
    a = fase(.3, .6);
    ctx.globalAlpha = a;
    let y = topo + (alto ? 230 : 180) + (1 - a) * 40;
    ctx.fillStyle = "#ffd84d"; ctx.font = `700 26px ${F_MONO}`;
    quebrar(ctx, String(c.kicker || "").toUpperCase(), W - 2 * P).slice(0, 2).forEach((l) => { ctx.fillText(l, P, y); y += 36; });
    y += 30;
    const tt = alto ? 72 : 64;
    ctx.fillStyle = "#ffffff"; ctx.font = `700 ${tt}px ${F_DISP}`;
    let tl = quebrar(ctx, c.titulo, W - 2 * P);
    if (tl.length > 3) { ctx.font = `700 ${tt - 12}px ${F_DISP}`; tl = quebrar(ctx, c.titulo, W - 2 * P).slice(0, 4); }
    tl.forEach((l) => { ctx.fillText(l, P, y); y += tt + 8; });
    ctx.globalAlpha = 1;
    const bar = ctx.createLinearGradient(P, 0, P + 180, 0); bar.addColorStop(0, "#1fc35f"); bar.addColorStop(1, "#ffd400");
    ctx.fillStyle = bar; ctx.fillRect(P, y - 22, 180 * fase(.7, .6), 6);
    y += alto ? 70 : 40;
    // itens: entram um a um; os números contam e as barras crescem
    const itens = encaixar(ctx, itensCartao(c), W - 2 * P, H - base - 230 - y, alto);
    const u = Math.min(alto ? 110 : 64, (H - base - 230 - y) / Math.max(1, pesoTotal(itens)));
    const fr = alto && u >= 90 ? 1.18 : 1; // no formato alto, com espaço sobrando, letras maiores
    itens.forEach((it, i) => {
      const ini = 1 + i * .22, ap = fase(ini, .45), conta = fase(ini, 1.3);
      const dx = (1 - ap) * 30;
      ctx.globalAlpha = ap;
      if (it[0] === "t") {
        ctx.fillStyle = "#ffd84d"; ctx.font = `700 ${Math.round(23 * fr)}px ${F_MONO}`;
        ctx.fillText(cortar(ctx, String(it[1]).toUpperCase(), W - 2 * P), P + dx, y + u * .15);
        y += u * it.peso;
        return;
      }
      if (it[0] === "c") {
        ctx.font = `600 ${Math.round(31 * fr)}px ${F_SANS}`; ctx.fillStyle = "#e3efe6";
        ctx.fillText(cortar(ctx, it[1], W - 2 * P), P + dx, y);
        ctx.font = `600 ${Math.round(22 * fr)}px ${F_SANS}`;
        const ws = it[2].map(([, tx]) => 34 * fr + ctx.measureText(contarTexto(tx, 1)).width + 16 * fr), gap = 12;
        const doisAndares = it.peso > 1;
        let x = doisAndares ? P + 28 : W - P - ws.reduce((a, w) => a + w + gap, -gap);
        const cy = doisAndares ? y + u * .8 - 10 * fr : y - 10 * fr, ph = 22 * fr + 16;
        it[2].forEach(([cor, tx], j) => {
          const [fundo, ponto] = COR_CHIP[cor] || COR_CHIP.green;
          ctx.fillStyle = fundo; ctx.beginPath(); ctx.roundRect(x + dx, cy - ph / 2, ws[j], ph, ph / 2); ctx.fill();
          ctx.fillStyle = ponto; ctx.beginPath(); ctx.arc(x + dx + 17 * fr, cy, 6 * fr, 0, 7); ctx.fill();
          ctx.fillStyle = "#eef6f0"; ctx.textBaseline = "middle"; ctx.fillText(contarTexto(tx, conta), x + dx + 30 * fr, cy + 1); ctx.textBaseline = "alphabetic";
          x += ws[j] + gap;
        });
        y += u * it.peso;
        return;
      }
      const barra = it[0] === "b", sub = /^\s\s/.test(it[1]), r = String(it[1]).trim(), vv = String(it[2]);
      // o valor nunca é cortado: a letra diminui até caber; o rótulo usa o espaço que sobra
      let fv = Math.round((sub || barra ? 30 : 34) * fr);
      ctx.font = `700 ${fv}px ${F_DISP}`;
      while (ctx.measureText(vv).width > W - 2 * P - 300 && fv > 22) { fv -= 2; ctx.font = `700 ${fv}px ${F_DISP}`; }
      const lv = ctx.measureText(vv).width;
      ctx.font = `${sub ? 400 : 600} ${Math.round((sub || barra ? 28 : 31) * fr)}px ${F_SANS}`; ctx.fillStyle = sub ? "#b8ccbf" : "#e3efe6";
      const xr = (sub ? P + 28 : P) + dx;
      ctx.fillText(cortar(ctx, r, W - 2 * P - lv - 40 - (sub ? 28 : 0)), xr, y);
      ctx.font = `700 ${fv}px ${F_DISP}`; ctx.fillStyle = "#ffffff"; ctx.textAlign = "right";
      ctx.fillText(contarTexto(vv, conta), W - P, y); ctx.textAlign = "left";
      if (barra) {
        // trilho e barra (cresce no vídeo), com o fim arredondado
        const ty = y + Math.max(12, u * .2), th = Math.max(10, Math.round(u * .2)), tw = W - 2 * P;
        ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(P, ty, tw, th, th / 2); ctx.fill();
        const bw = tw * Math.max(0, Math.min(1, Number(it[3]) || 0)) * fase(ini + .15, 1.2);
        if (bw > 1) {
          const g = ctx.createLinearGradient(P, 0, P + tw, 0); g.addColorStop(0, "#1fc35f"); g.addColorStop(1, "#ffd400");
          ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(P, ty, Math.max(bw, th), th, th / 2); ctx.fill();
        }
      } else {
        ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P, y + u * 0.42); ctx.lineTo(P + (W - 2 * P) * ap, y + u * 0.42); ctx.stroke();
      }
      y += u * it.peso;
    });
    // rodapé
    a = fase(.6, .6);
    ctx.globalAlpha = a;
    const yb = H - base;
    ctx.fillStyle = "rgba(255,212,0,.12)"; ctx.beginPath(); ctx.roundRect(P, yb - 196, W - 2 * P, 54, 27); ctx.fill();
    ctx.fillStyle = "#ffd84d"; ctx.font = `600 24px ${F_SANS}`; ctx.textAlign = "center"; ctx.fillText(L.badge, W / 2, yb - 161);
    ctx.fillStyle = "#b8ccbf"; ctx.font = `500 23px ${F_SANS}`;
    ctx.fillText(L.cd_src, W / 2, yb - 104);
    // no vídeo, o endereço do site ganha destaque no fim
    const dest = fase(4.6, .8);
    if (dest > 0 && tm !== Infinity) { ctx.fillStyle = `rgba(31,195,95,${.18 * dest})`; ctx.beginPath(); ctx.roundRect(P + 40, yb - 98, W - 2 * P - 80, 52, 26); ctx.fill(); }
    ctx.fillStyle = "#eef6f0"; ctx.font = `600 25px ${F_MONO}`;
    ctx.fillText(URL_SITE.replace(/^https:\/\/|\/$/g, ""), W / 2, yb - 64);
    ctx.textAlign = "left"; ctx.globalAlpha = 1;
    return itens;
  }

  async function imagemCartao(c, fmt) {
    const [W, H] = FORMATOS[fmt];
    await fontes();
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    quadroCartao(cv.getContext("2d"), c, W, H, fundoCartao(W, H), Infinity);
    return new Promise((ok) => cv.toBlob(ok, "image/png"));
  }

  // --- som do vídeo: efeitos criados no próprio navegador (sem arquivos de áudio), no tempo da animação.
  // Cada vídeo sorteia tom, escala, timbre, fundo, batida e tique, então dois vídeos dificilmente soam iguais.
  const ESCALAS = [[0, 2, 4, 7, 9], [0, 3, 5, 7, 10], [0, 2, 4, 6, 7, 9, 11], [0, 2, 3, 5, 7, 9, 10], [0, 2, 4, 5, 7, 9, 11]];
  const sortear = (l) => l[Math.floor(Math.random() * l.length)];
  function sortearTrilha() {
    const k = { raiz: sortear([196, 207.65, 220, 233.08, 246.94, 261.63, 277.18, 293.66]), escala: sortear(ESCALAS), timbre: sortear(["marimba", "sino", "corda", "vidro", "suave"]),
      fundo: sortear(["quente", "ar", "quente", "ar", "nenhum"]), batida: sortear(["nenhuma", "leve", "pulso"]), tique: sortear(["clique", "madeira", "agudo"]), bpm: sortear([96, 104, 112, 120]) };
    if (k.fundo === "nenhum" && k.batida === "nenhuma") k.fundo = "ar"; // sem fundo e sem batida o meio do vídeo ficaria mudo
    return k;
  }
  // eventos: [{ ini (s), tipo: "t" título | "l" linha | "b" barra | "c" selos, n (selos), f (fração da barra), num (tem número que conta), cd (duração da contagem) }]
  // dur: duração do vídeo; acorde: instante do acorde final (null: sem acorde). k: o mesmo sorteio em todos os vídeos de um carrossel
  function trilha(ac, saida, eventos, t0, k = sortearTrilha(), dur = DUR_VIDEO, acorde = 4.6) {
    const e = k.escala, nota = (g) => k.raiz * Math.pow(2, (e[((g % e.length) + e.length) % e.length] + 12 * Math.floor(g / e.length)) / 12);
    const mestre = ac.createGain(), comp = ac.createDynamicsCompressor(), vol = ac.createGain();
    mestre.connect(comp); comp.connect(vol); vol.connect(saida); vol.gain.value = 1.6;
    mestre.gain.setValueAtTime(.9, t0); mestre.gain.setValueAtTime(.9, t0 + dur - .6); mestre.gain.linearRampToValueAtTime(.0001, t0 + dur - .05);
    const ruido = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), rd = ruido.getChannelData(0);
    for (let i = 0; i < rd.length; i++) rd[i] = Math.random() * 2 - 1;
    // envelope: sobe em a segundos até v e cai em r segundos
    const env = (v, t, a, r) => { const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + r); g.connect(mestre); return g; };
    const osc = (tipo, f, t, fim, para) => { const o = ac.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f, t); o.connect(para); o.start(t); o.stop(fim); return o; };
    const filtro = (tipo, f, para, q) => { const b = ac.createBiquadFilter(); b.type = tipo; b.frequency.value = f; if (q) b.Q.value = q; b.connect(para); return b; };
    const chiado = (t, dur, para) => { const s = ac.createBufferSource(); s.buffer = ruido; s.connect(para); s.start(t, Math.random() * .5, dur); };
    // uma nota no timbre sorteado; longo > 1 deixa a nota soar mais
    function tocar(f, t, v, longo = 1) {
      if (k.timbre === "marimba") { const g = env(v, t, .005, .35 * longo); osc("sine", f, t, t + .5 * longo, g); const g2 = env(v * .25, t, .003, .08); osc("sine", f * 4, t, t + .15, g2); }
      else if (k.timbre === "sino") {
        const g = env(v * .8, t, .004, 1.1 * longo), o = osc("sine", f, t, t + 1.3 * longo, g), m = ac.createGain();
        m.gain.setValueAtTime(f * 2, t); m.gain.exponentialRampToValueAtTime(1, t + .6); osc("sine", f * 3.5, t, t + 1.3 * longo, m); m.connect(o.frequency);
      } else if (k.timbre === "corda") { const g = env(v * .7, t, .004, .4 * longo), lp = filtro("lowpass", 600, g); lp.frequency.setValueAtTime(4000, t); lp.frequency.exponentialRampToValueAtTime(500, t + .3); osc("sawtooth", f, t, t + .5 * longo, lp); }
      else if (k.timbre === "vidro") { const g = env(v * .6, t, .006, .6 * longo); osc("sine", f * 2, t, t + .7 * longo, g); osc("triangle", f * 3, t, t + .7 * longo, env(v * .15, t, .006, .3)); }
      else { const g = env(v, t, .02, .5 * longo); osc("triangle", f, t, t + .6 * longo, g); }
    }
    function sopro(t, dur, v, de, ate) {
      const g = env(v, t, dur * .6, dur * .4), bp = filtro("bandpass", de, g, 1.2);
      bp.frequency.setValueAtTime(de, t); bp.frequency.exponentialRampToValueAtTime(ate, t + dur); chiado(t, dur + .05, bp);
    }
    function tique(t) {
      if (k.tique === "clique") chiado(t, .012, filtro("highpass", 3500, env(.05, t, .001, .01)));
      else osc("sine", k.tique === "madeira" ? 1500 : 3200, t, t + .04, env(k.tique === "madeira" ? .05 : .025, t, .001, .025));
    }
    function bumbo(t, v) { const g = env(v, t, .004, .25), o = osc("sine", 120, t, t + .3, g); o.frequency.exponentialRampToValueAtTime(45, t + .25); }
    // abertura: sopro, a marca entra, o título e o traço amarelo
    sopro(t0, .7, .16, 400, 2600);
    bumbo(t0 + .3, .22); tocar(nota(0), t0 + .3, .12, 1.5);
    sopro(t0 + .7, .3, .06, 3000, 7000);
    // fundo
    if (k.fundo !== "nenhum") {
      const g = ac.createGain(); g.connect(mestre);
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(k.fundo === "quente" ? .05 : .035, t0 + 1.6); g.gain.setValueAtTime(k.fundo === "quente" ? .05 : .035, t0 + dur - 1.2); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      const lp = filtro("lowpass", k.fundo === "quente" ? 700 : 2400, g);
      [0, 2, 4].forEach((d) => {
        const f = nota(d) / (k.fundo === "quente" ? 2 : 1);
        if (k.fundo === "quente") [-6, 6].forEach((ct) => { osc("sawtooth", f, t0, t0 + dur, lp).detune.value = ct; });
        else { osc("sine", f * 2, t0, t0 + dur, lp); osc("triangle", f, t0, t0 + dur, lp); }
      });
    }
    // batida: leve (só chimbal) ou pulso (bumbo e chimbal), do 1º item até o fim
    if (k.batida !== "nenhuma") {
      const p = 60 / k.bpm;
      for (let x = 1; x < dur - .7; x += p) {
        if (k.batida === "pulso") bumbo(t0 + x, .16);
        chiado(t0 + x + p / 2, .04, filtro("highpass", 7000, env(.035, t0 + x + p / 2, .002, .04)));
      }
    }
    // itens: uma nota que sobe a cada item, barras com um som que sobe junto e tiques enquanto os números contam
    const tiques = [];
    eventos.forEach((ev, i) => {
      const ini = ev.ini, t = t0 + ini;
      if (ev.tipo === "t") { tocar(nota(i) / 2, t, .1); return; }
      if (ev.tipo === "c") for (let j = 0; j < ev.n; j++) tocar(nota(i + j + 2), t + j * .09, .08);
      else tocar(nota(i + 2), t, .1);
      if (ev.tipo === "b") {
        const db = 1.2, f = nota(i), g = ac.createGain(), lp = filtro("lowpass", 1800, g);
        g.connect(mestre); g.gain.setValueAtTime(.0001, t + .15); g.gain.exponentialRampToValueAtTime(.035, t + .3); g.gain.exponentialRampToValueAtTime(.0001, t + .15 + db);
        const o = osc("triangle", f, t + .15, t + .2 + db, lp); o.frequency.exponentialRampToValueAtTime(f * (1.5 + Math.max(0, Math.min(1, +ev.f || 0))), t + .15 + db * .7);
      }
      if (ev.num) for (let s = 1; s <= 10; s++) tiques.push(ini + (ev.cd || 1.3) * (1 - Math.cbrt(1 - s / 10)));
    });
    let ult = -1;
    tiques.sort((a, b) => a - b).forEach((x) => { if (x - ult >= .045) { tique(t0 + x); ult = x; } });
    // fim: acorde quando o endereço do site ganha destaque
    if (acorde !== null) [0, 2, 4, 7].forEach((d, j) => tocar(nota(e.length + d), t0 + acorde + j * .1, .11, 2.5));
    return k;
  }

  // Vídeo vertical de 8 s gravado do próprio canvas (MP4 quando o navegador grava; senão WebM), com som se pedido
  function tipoVideo(som) {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return null;
    const l = som ? ["video/mp4;codecs=avc1.42E01F,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1.42E01F,opus", "video/mp4;codecs=avc1,opus", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["video/mp4;codecs=avc1.42E01F", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    return l.find((x) => MediaRecorder.isTypeSupported(x)) || null;
  }
  // O som começa antes de qualquer espera, ainda dentro do clique (o navegador só libera áudio depois de um toque)
  function criarAudio(som) {
    if (!som || !tipoVideo(true)) return null;
    try { const ac = new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); return ac; } catch (e) { return null; }
  }
  async function audioPronto(ac) {
    if (!ac) return null;
    try { await ac.resume(); if (ac.state === "running") return ac; } catch (e) { /* sem som */ }
    ac.close().catch(() => {});
    return null;
  }
  // Grava dur segundos do canvas: pintar(tm) desenha o quadro no instante tm; com ac, a trilha (som) toca junto.
  // vivo(): falso quando a janela fecha; a gravação para e devolve null
  async function gravarCanvas(cv, dur, pintar, aoAvancar, ac, som, vivo) {
    pintar(0);
    const fluxo = cv.captureStream(30);
    let saida = null;
    if (ac) { try { saida = ac.createMediaStreamDestination(); saida.stream.getAudioTracks().forEach((x) => fluxo.addTrack(x)); } catch (e) { saida = null; } }
    const tipo = tipoVideo(!!saida);
    const rec = new MediaRecorder(fluxo, { mimeType: tipo, videoBitsPerSecond: 8000000, audioBitsPerSecond: 160000 });
    const partes = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) partes.push(e.data); };
    const parou = new Promise((ok) => { rec.onstop = ok; });
    rec.start(250);
    const t0 = performance.now();
    if (saida) trilha(ac, saida, som.eventos, ac.currentTime, som.k, dur, som.acorde);
    const inteiro = await new Promise((ok) => {
      const passo = () => {
        if (vivo && !vivo()) { ok(false); return; }
        const tm = (performance.now() - t0) / 1000;
        pintar(tm);
        aoAvancar(Math.min(1, tm / dur));
        if (tm < dur) requestAnimationFrame(passo); else ok(true);
      };
      requestAnimationFrame(passo);
    });
    rec.stop(); fluxo.getTracks().forEach((x) => x.stop());
    await parou;
    if (!inteiro) return null;
    const mime = tipo.split(";")[0];
    return { blob: new Blob(partes, { type: mime }), ext: mime === "video/mp4" ? "mp4" : "webm", som: !!saida };
  }
  async function videoCartao(c, cv, aoAvancar, som) {
    const ac = criarAudio(som);
    const [W, H] = FORMATOS.video;
    await fontes();
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"), fundo = fundoCartao(W, H);
    const itens = quadroCartao(ctx, c, W, H, fundo, 0);
    const pronto = await audioPronto(ac);
    const eventos = itens.map((it, i) => ({ ini: 1 + i * .22, tipo: it[0], n: it[0] === "c" ? it[2].length : 0, f: it[3],
      num: it[0] !== "t" && /\d/.test(it[0] === "c" ? it[2].map((x) => x[1]).join("") : it[2]) }));
    const v = await gravarCanvas(cv, DUR_VIDEO, (tm) => quadroCartao(ctx, c, W, H, fundo, tm), aoAvancar, pronto, { eventos, k: sortearTrilha(), acorde: 4.6 });
    if (pronto) pronto.close().catch(() => {});
    return v;
  }
  // Carrossel em vídeo: cada imagem vira um vídeo curto, gravado um depois do outro no mesmo canvas (r.cv).
  // Todos usam o mesmo sorteio de som; aoAvancar(i, fração do total). Devolve null se a janela fechar no meio
  async function videosCarrossel(r, aoAvancar, ac, vivo) {
    const k = sortearTrilha(), total = r.slides.reduce((a, x) => a + x.dur, 0), vids = [], posters = [];
    let feito = 0;
    for (let i = 0; i < r.slides.length; i++) {
      const sl = r.slides[i];
      const v = await gravarCanvas(r.cv, sl.dur, sl.pintar, (x) => aoAvancar(i, (feito + x * sl.dur) / total), ac, { eventos: sl.sons, k, acorde: sl.acorde }, vivo);
      if (!v) return null;
      sl.pintar(Infinity);
      posters.push(await new Promise((ok) => r.cv.toBlob(ok, "image/jpeg", .85)));
      vids.push(v); feito += sl.dur;
    }
    return { vids, posters, W: r.W, H: r.H, nome: r.nome, som: vids.every((v) => v.som), ext: vids[0].ext, cortado: r.cortado };
  }

  // Painel de mídia: formato (post, story ou vídeo), prévia, baixar e enviar para um app
  function limparMidia(box) { (box._urls || []).forEach((u) => URL.revokeObjectURL(u)); box._urls = []; }
  // fonte (opcional): função que devolve o conteúdo da página ou da resposta, para o carrossel
  const TAM_ARQ = { "45": "4x5", "11": "1x1", "916": "9x16" };
  // crIni (pedido por texto no Atlas): { tipo: "img" | "vid", tam: "45" | "11" | "916" | "pdf" }
  function painelMidia(box, c, fmtIni, url, fonte, crIni) {
    const L = t(), feitos = {};
    const slug = c.slug || location.hash.replace(/^#\/?/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "inicio";
    const raiz = box.closest(".sh-post") || box.closest(".dlg-body") || box;
    raiz._urls = raiz._urls || [];
    box.innerHTML = `<div class="md-fmt" role="group" aria-label="${esc(L.md_fmt)}">${["post", "story", "video"].concat(fonte ? ["carrossel"] : []).map((f) => `<button type="button" class="chipq" data-fmt="${f}" aria-pressed="false">${esc(L["md_fmt_" + f])}</button>`).join("")}</div>
      <div class="md-prev"></div><p class="small muted md-nota"></p><div class="btn-row md-acoes"></div>`;
    const prev = box.querySelector(".md-prev"), nota = box.querySelector(".md-nota"), acoes = box.querySelector(".md-acoes");
    let atual = null, tamCr = (crIni && crIni.tam) || "45", tipoCr = (crIni && crIni.tipo) || "img", som = A.ler("bu-som") !== "0";
    if (tipoCr === "vid" && tamCr === "pdf") tamCr = "45";
    const botoes = (blob, nome, tipo, rotDl) => {
      const u = URL.createObjectURL(blob); raiz._urls.push(u);
      const arq = new File([blob], nome, { type: tipo });
      const pode = navigator.canShare && navigator.canShare({ files: [arq] });
      acoes.innerHTML = `<a class="btn btn-primary" href="${u}" download="${esc(nome)}">${icone("download")} ${esc(rotDl)}</a>${pode ? `<button class="btn" type="button" data-env>${icone("share")} ${esc(L.md_send)}</button>` : ""}`;
      const b = acoes.querySelector("[data-env]");
      if (b) b.addEventListener("click", async () => { try { await navigator.share({ files: [arq], title: c.titulo, text: textoPost(url || urlPagina()) }); } catch (e) { /* cancelado */ } });
      return u;
    };
    const mostrar = async (fmt) => {
      atual = fmt;
      box.querySelectorAll("[data-fmt]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fmt === fmt)));
      prev.className = "md-prev " + (fmt === "post" ? "" : fmt === "carrossel" ? "md-cr" : "alto");
      nota.textContent = L["md_note_" + fmt] || "";
      acoes.innerHTML = "";
      if (fmt === "carrossel") { mostrarCarrossel(tamCr); return; }
      if (fmt !== "video") {
        prev.innerHTML = `<p class="muted">${esc(L.lk_loading)}</p>`;
        if (!feitos[fmt]) feitos[fmt] = await imagemCartao(c, fmt);
        if (atual !== fmt) return;
        const u = botoes(feitos[fmt], `auditoria-bu-2026-${slug}-${fmt}.png`, "image/png", L.md_dl_img);
        prev.innerHTML = `<img src="${u}" alt="${esc(c.titulo)}" width="${FORMATOS[fmt][0] / 2}" height="${FORMATOS[fmt][1] / 2}">`;
        return;
      }
      const tipo = tipoVideo();
      if (!tipo) { prev.innerHTML = ""; nota.textContent = L.md_novideo; return; }
      const fimVideo = (v) => {
        const u = botoes(v.blob, `auditoria-bu-2026-${slug}.${v.ext}`, v.blob.type, L.md_dl_video);
        prev.innerHTML = `<video src="${u}" controls loop playsinline></video>`;
        // com som, a prévia já toca com áudio; se o navegador bloquear, toca sem som (o botão do vídeo liga)
        const vid = prev.querySelector("video");
        vid.muted = !v.som; vid.play().catch(() => { vid.muted = true; vid.play().catch(() => {}); });
        nota.textContent = L.md_note_video + (v.ext === "webm" ? " " + L.md_webm : "") + (som && !v.som ? " " + L.md_nosound : "");
        if (!v.som) return;
        acoes.insertAdjacentHTML("beforeend", `<button class="btn" type="button" data-refazer>${icone("swap")} ${esc(L.md_redo)}</button>`);
        acoes.querySelector("[data-refazer]").addEventListener("click", gravar);
      };
      const gravar = async () => {
        const cv = document.createElement("canvas");
        prev.innerHTML = `<div class="md-gravando"></div><div class="md-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(L.md_making)}"><span></span></div><p class="small">${esc(L.md_making)}</p>`;
        acoes.innerHTML = "";
        prev.querySelector(".md-gravando").appendChild(cv);
        box.querySelectorAll("[data-fmt]").forEach((b) => { b.disabled = true; });
        const barra = prev.querySelector(".md-prog span"), pb = prev.querySelector(".md-prog");
        try {
          feitos.video = await videoCartao(c, cv, (k) => { barra.style.width = (k * 100).toFixed(1) + "%"; pb.setAttribute("aria-valuenow", Math.round(k * 100)); }, som);
        } catch (e) { prev.innerHTML = ""; nota.textContent = L.md_novideo; feitos.video = null; }
        box.querySelectorAll("[data-fmt]").forEach((b) => { b.disabled = false; });
        if (feitos.video && atual === "video") fimVideo(feitos.video);
      };
      if (feitos.video) { fimVideo(feitos.video); return; }
      prev.innerHTML = `<div class="md-vid-ini"><label class="md-som"><input type="checkbox" data-som${som ? " checked" : ""}> ${icone("speaker")} <span>${esc(L.md_sound)}</span></label>
        <p class="small muted">${esc(L.md_sound_note)}</p>
        <button class="btn btn-primary" type="button" data-gravar>${icone("play")} ${esc(L.md_make_video)}</button></div>`;
      prev.querySelector("[data-som]").addEventListener("change", (e) => { som = e.target.checked; A.guardar("bu-som", som ? "1" : "0"); });
      prev.querySelector("[data-gravar]").addEventListener("click", gravar);
    };
    // Carrossel: várias imagens (ou um PDF), ou vários vídeos curtos, com a página ou a resposta inteira, divididas em capa, conteúdo e fim
    const travar = (sim) => box.querySelectorAll("[data-fmt], [data-cr], [data-crt]").forEach((b) => { b.disabled = sim; });
    // tira de prévia (imagens ou vídeos), com setas e contador
    const montarTira = (corpo, itens, n) => {
      corpo.innerHTML = `<div class="cr-tira" tabindex="0" role="region" aria-label="${esc(L.md_fmt_carrossel)}">${itens.join("")}</div>
        <div class="cr-nav"><button type="button" class="btn btn-sm btn-ghost" data-crv="-1" aria-label="${esc(L.cr_prev)}">‹</button><span class="cr-n">1 / ${n}</span><button type="button" class="btn btn-sm btn-ghost" data-crv="1" aria-label="${esc(L.cr_next)}">›</button></div>`;
      const tira = corpo.querySelector(".cr-tira"), cont = corpo.querySelector(".cr-n");
      const idx = () => { const c = tira.scrollLeft + tira.clientWidth / 2; let k = 0; Array.from(tira.children).forEach((it, i) => { if (it.offsetLeft <= c) k = i; }); return k; };
      tira.addEventListener("scroll", () => { cont.textContent = `${idx() + 1} / ${n}`; }, { passive: true });
      corpo.querySelectorAll("[data-crv]").forEach((b) => b.addEventListener("click", () => {
        const it = tira.children[Math.max(0, Math.min(n - 1, idx() + +b.dataset.crv))];
        tira.scrollTo({ left: it.offsetLeft - (tira.clientWidth - it.clientWidth) / 2, behavior: "smooth" });
      }));
    };
    // no celular vão todos juntos para o app; no computador, um .zip (ou um por um)
    const entregar = async (r, arqs, urls, nomeZip, rot, ainda) => {
      if (!r.zip) r.zip = A.exportar.zip(await Promise.all(arqs.map(async (f) => ({ nome: f.name, dados: new Uint8Array(await f.arrayBuffer()) }))));
      if (!ainda()) return;
      const uz = r.uz || (r.uz = URL.createObjectURL(r.zip)); if (!raiz._urls.includes(uz)) raiz._urls.push(uz);
      const pode = navigator.canShare && navigator.canShare({ files: arqs });
      acoes.innerHTML = `${pode ? `<button class="btn btn-primary" type="button" data-env>${icone("share")} ${esc(rot.send)}</button>` : ""}
        <a class="btn${pode ? "" : " btn-primary"}" href="${uz}" download="${esc(nomeZip)}">${icone("download")} ${esc(rot.zip)}</a>
        <button class="btn btn-ghost" type="button" data-cada>${icone(rot.icone)} ${esc(rot.cada)}</button>`;
      const env = acoes.querySelector("[data-env]");
      if (env) env.addEventListener("click", async () => { try { await navigator.share({ files: arqs, title: c.titulo, text: textoPost(url || urlPagina()) }); } catch (e) { /* cancelado */ } });
      acoes.querySelector("[data-cada]").addEventListener("click", () => {
        urls.forEach((u, i) => setTimeout(() => { const a = document.createElement("a"); a.href = u; a.download = arqs[i].name; document.body.appendChild(a); a.click(); a.remove(); }, i * 350));
      });
    };
    const mostrarCarrossel = async (tam, tipo = tipoCr) => {
      if (tipo === "vid" && tam === "pdf") tam = "45"; // o PDF não leva vídeo
      tamCr = tam; tipoCr = tipo;
      const ainda = () => atual === "carrossel" && tamCr === tam && tipoCr === tipo, chave = "cr" + tam;
      nota.textContent = tipo === "vid" ? L.crv_note : L.cr_note[tam];
      acoes.innerHTML = "";
      prev.innerHTML = `<div class="cr-tam" role="group" aria-label="${esc(L.cr_kind)}">${["img", "vid"].map((k) => `<button type="button" class="chipq" data-crt="${k}" aria-pressed="${k === tipo}">${icone(k === "img" ? "image" : "play")} ${esc(L.cr_tipos[k])}</button>`).join("")}</div>
        <div class="cr-tam" role="group" aria-label="${esc(L.cr_size)}">${["45", "11", "916", "pdf"].filter((k) => tipo === "img" || k !== "pdf").map((k) => `<button type="button" class="chipq" data-cr="${k}" aria-pressed="${k === tam}">${esc(L.cr_tam[k])}</button>`).join("")}</div>
        <div class="cr-corpo"><p class="muted cr-load" aria-live="polite">${esc(L.lk_loading)}</p></div>`;
      const corpo = prev.querySelector(".cr-corpo"), st = corpo.querySelector(".cr-load");
      if (tipo === "vid") { videosCr(tam, corpo, ainda); return; }
      st.textContent = L.cr_making(1, "…");
      if (!feitos[chave]) {
        feitos[chave] = A.exportar.carrossel(fonte(), tam, (k, n) => { if (ainda() && k < n) st.textContent = L.cr_making(k + 1, n); })
          .catch((e) => { console.error(e); return null; });
      }
      const r = await feitos[chave];
      if (!ainda()) return;
      if (!r) { delete feitos[chave]; corpo.innerHTML = `<p class="muted">${esc(L.xp.err)}</p>`; return; }
      const n = r.imgs.length;
      r.urls = r.urls || r.imgs.map((b) => { const u = URL.createObjectURL(b); raiz._urls.push(u); return u; });
      montarTira(corpo, r.urls.map((u, i) => `<figure class="cr-it${r.H > 1500 ? " alto" : ""}"><img src="${u}" alt="${esc(L.cr_img(i + 1, n))}" width="${r.W / 4}" height="${r.H / 4}"><figcaption>${i + 1} / ${n}</figcaption></figure>`), n);
      if (tam === "pdf") { botoes(r.pdf, `${r.nome}-carrossel.pdf`, "application/pdf", L.cr_dl_pdf); return; }
      const arqs = r.imgs.map((b, i) => new File([b], `${r.nome}-${String(i + 1).padStart(2, "0")}.png`, { type: "image/png" }));
      entregar(r, arqs, r.urls, `${r.nome}-carrossel-${TAM_ARQ[tam]}.zip`, { send: L.cr_send(n), zip: L.cr_dl_zip(n), cada: L.cr_dl_each, icone: "image" }, ainda);
    };
    // Carrossel em vídeo: monta as telas (rápido), mostra quantos vídeos e quanto tempo; grava só depois do clique
    const videosCr = async (tam, corpo, ainda) => {
      const chave = "crv" + tam;
      if (feitos[chave]) { mostrarVideos(feitos[chave], tam, corpo, ainda); return; }
      if (!tipoVideo()) { corpo.innerHTML = `<p class="muted">${esc(L.md_novideo)}</p>`; return; }
      if (!feitos["crl" + tam]) feitos["crl" + tam] = A.exportar.carrossel(fonte(), tam, null, true).catch((e) => { console.error(e); return null; });
      const r = await feitos["crl" + tam];
      if (!ainda()) return;
      if (!r) { delete feitos["crl" + tam]; corpo.innerHTML = `<p class="muted">${esc(L.xp.err)}</p>`; return; }
      const n = r.slides.length, segs = Math.ceil(r.slides.reduce((a, x) => a + x.dur, 0));
      corpo.innerHTML = `<div class="md-vid-ini"><label class="md-som"><input type="checkbox" data-som${som ? " checked" : ""}> ${icone("speaker")} <span>${esc(L.md_sound)}</span></label>
        <p class="small muted">${esc(L.md_sound_note)}</p><p class="small muted">${esc(L.crv_time(n, segs))}</p>
        <button class="btn btn-primary" type="button" data-gravar>${icone("play")} ${esc(L.crv_make(n))}</button></div>`;
      corpo.querySelector("[data-som]").addEventListener("change", (e) => { som = e.target.checked; A.guardar("bu-som", som ? "1" : "0"); });
      corpo.querySelector("[data-gravar]").addEventListener("click", () => gravarCr(r, tam, corpo, ainda));
    };
    const gravarCr = async (r, tam, corpo, ainda) => {
      const ac = criarAudio(som), n = r.slides.length, dl = box.closest("dialog");
      corpo.innerHTML = `<div class="md-gravando cr-grav${r.H > 1500 ? " alto" : ""}"></div><div class="md-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(L.crv_rec(1, n))}"><span></span></div>
        <p class="small cr-st" aria-live="polite">${esc(L.crv_rec(1, n))}</p><p class="small muted">${esc(L.crv_keep)}</p>`;
      corpo.querySelector(".md-gravando").appendChild(r.cv);
      acoes.innerHTML = "";
      travar(true);
      const barra = corpo.querySelector(".md-prog span"), pb = corpo.querySelector(".md-prog"), st = corpo.querySelector(".cr-st");
      let ult = -1, vs = null;
      const pronto = await audioPronto(ac);
      try {
        vs = await videosCarrossel(r, (i, x) => {
          barra.style.width = (x * 100).toFixed(1) + "%"; pb.setAttribute("aria-valuenow", Math.round(x * 100));
          if (i !== ult) { ult = i; st.textContent = L.crv_rec(i + 1, n); }
        }, pronto, () => box.isConnected && (!dl || dl.open));
      } catch (e) { console.error(e); vs = null; }
      if (pronto) pronto.close().catch(() => {});
      travar(false);
      if (!box.isConnected) return;
      if (!vs) { corpo.innerHTML = `<p class="muted">${esc(L.md_novideo)}</p>`; return; }
      feitos["crv" + tam] = vs;
      if (ainda()) mostrarVideos(vs, tam, corpo, ainda);
    };
    const mostrarVideos = (vs, tam, corpo, ainda) => {
      const n = vs.vids.length;
      vs.urls = vs.urls || vs.vids.map((v) => { const u = URL.createObjectURL(v.blob); raiz._urls.push(u); return u; });
      vs.purls = vs.purls || vs.posters.map((b) => { const u = URL.createObjectURL(b); raiz._urls.push(u); return u; });
      montarTira(corpo, vs.urls.map((u, i) => `<figure class="cr-it${vs.H > 1500 ? " alto" : ""}"><video src="${u}" poster="${vs.purls[i]}" controls loop playsinline preload="none" width="${vs.W / 4}" height="${vs.H / 4}" aria-label="${esc(L.crv_vid(i + 1, n))}"></video><figcaption>${i + 1} / ${n}</figcaption></figure>`), n);
      // um vídeo de cada vez: o que começa a tocar para os outros
      const vids = Array.from(corpo.querySelectorAll("video"));
      vids.forEach((v) => v.addEventListener("play", () => vids.forEach((o) => { if (o !== v) o.pause(); })));
      nota.textContent = L.crv_note + (vs.ext === "webm" ? " " + L.md_webm : "") + (som && !vs.som ? " " + L.md_nosound : "");
      const arqs = vs.vids.map((v, i) => new File([v.blob], `${vs.nome}-${String(i + 1).padStart(2, "0")}.${v.ext}`, { type: v.blob.type }));
      entregar(vs, arqs, vs.urls, `${vs.nome}-carrossel-video-${TAM_ARQ[tam]}.zip`, { send: L.crv_send(n), zip: L.crv_dl_zip(n), cada: L.crv_dl_each, icone: "download" }, ainda).then(() => {
        if (!ainda()) return;
        // gravar de novo: outro som (ou depois de mudar a opção de som)
        acoes.insertAdjacentHTML("beforeend", `<button class="btn btn-ghost" type="button" data-refazer>${icone("swap")} ${esc(L.crv_redo)}</button>`);
        acoes.querySelector("[data-refazer]").addEventListener("click", () => { delete feitos["crv" + tam]; videosCr(tam, corpo, ainda); });
      });
    };
    prev.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cr], [data-crt]");
      if (!b || b.disabled || atual !== "carrossel") return;
      if (b.dataset.cr && b.dataset.cr !== tamCr) mostrarCarrossel(b.dataset.cr);
      if (b.dataset.crt && b.dataset.crt !== tipoCr) mostrarCarrossel(tamCr, b.dataset.crt);
    });
    box.querySelector(".md-fmt").addEventListener("click", (e) => { const b = e.target.closest("[data-fmt]"); if (b && !b.disabled) mostrar(b.dataset.fmt); });
    mostrar(fmtIni || "post");
  }

  // o (respostas do Atlas): cartão, endereço e título próprios; sem o, a página atual
  async function gerarImagem(o = {}) {
    const L = t(), c = o.cartao || cartaoAtual(false), url = o.url || urlPagina();
    const d = janela(L.im_title, `<div class="md"></div>
      <h4 class="sh-passo">${esc(L.md_text_title)}</h4>
      <textarea class="sh-texto" rows="3" readonly aria-label="${esc(L.md_copy_text)}">${esc(textoPost(url))}</textarea>
      <div class="btn-row"><button class="btn" type="button" data-cptx>${icone("copy")} ${esc(L.md_copy_text)}</button><button class="btn btn-ghost" type="button" ${o.url ? "data-mais" : "data-share"}>${icone("share")} ${esc(L.md_more_nets)}</button></div>`, "dlg-img");
    const corpo = d.querySelector(".dlg-body");
    painelMidia(d.querySelector(".md"), c, o.fmt || "post", url, o.fonte || (A.exportar && A.exportar.fontePagina), o.cr);
    d.querySelector("[data-cptx]").addEventListener("click", async (e) => {
      const bt = e.currentTarget;
      const ok = await copiarTexto(textoPost(url));
      bt.lastChild.textContent = " " + (ok ? L.copied : L.md_copy_text);
    });
    d.querySelector("[data-share], [data-mais]").addEventListener("click", () => { d.close(); if (o.url) compartilhar(false, Object.assign({ cartao: c }, o)); });
    d.addEventListener("close", () => setTimeout(() => limparMidia(corpo), 1000));
  }

  // --- assinar o feed (RSS): o arquivo é para leitores de RSS; aqui vai a explicação e os atalhos -------------
  function assinarFeed() {
    const L = t(), url = URL_SITE + "feed.xml", u = encodeURIComponent(url);
    const d = janela(L.fd_title, `<p>${esc(L.fd_intro)}</p>
      <ol class="fd-passos">${L.fd_steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      <div class="sh-link"><input type="text" readonly value="${esc(url)}" aria-label="${esc(L.fd_addr)}"><button class="btn btn-primary" type="button" data-cp>${icone("link")} ${esc(L.fd_copy)}</button></div>
      <div class="sh-grid fd-apps"><a class="btn" href="https://feedly.com/i/subscription/feed/${u}" target="_blank" rel="noopener">${icone("rss")} ${esc(L.fd_open("Feedly"))}</a>
        <a class="btn" href="https://www.inoreader.com/?add_feed=${u}" target="_blank" rel="noopener">${icone("rss")} ${esc(L.fd_open("Inoreader"))}</a></div>
      <p class="small muted">${esc(L.fd_tg)} <a href="${A.TELEGRAM}" target="_blank" rel="noopener">${esc(L.fd_tg_link)}</a></p>`);
    d.querySelector("[data-cp]").addEventListener("click", async (e) => {
      const bt = e.currentTarget;
      const ok = await copiarTexto(url);
      bt.lastChild.textContent = " " + (ok ? L.copied : L.fd_copy);
    });
  }

  // --- documentos (PDF e página interativa): botões e links levam ao site -----------------------------------------------
  // No PDF o Chrome descarta links para o mesmo endereço com outro "#"; o "?de=pdf" deixa o endereço diferente
  const URL_DOC = URL_SITE + "?de=pdf";
  function urlAbs(href, base = URL_DOC) {
    if (!href || /^(https?:|mailto:|tel:|data:|blob:)/i.test(href)) return href || "";
    if (href.startsWith("#")) return base + href;
    try { return new URL(href, URL_SITE).href; } catch (e) { return href; }
  }
  // Numa cópia do conteúdo: botões de navegação viram links, perguntas sugeridas abrem no Atlas, o resto dos botões sai
  function linkarDoc(raiz, base = URL_DOC, novaAba = false) {
    const atlas = (q) => base + "#/atlas?q=" + encodeURIComponent(q.trim());
    const trocar = (el, href, cls) => { const a = document.createElement("a"); a.href = href; a.className = cls; a.innerHTML = el.innerHTML; el.replaceWith(a); };
    $$("[data-href]", raiz).forEach((el) => { const a = document.createElement("a"); a.href = el.dataset.href; a.className = "doc-lk"; a.append(...el.childNodes); el.append(a); el.removeAttribute("data-href"); });
    $$("button[data-go]", raiz).forEach((b) => trocar(b, b.dataset.go, "doc-btn"));
    $$("button[data-q]", raiz).forEach((b) => trocar(b, atlas(b.dataset.q), "doc-chip"));
    $$("button[data-at-id]", raiz).forEach((b) => trocar(b, atlas(b.textContent), "doc-chip"));
    $$("button, input, textarea, select, .btn-copy", raiz).forEach((x) => x.remove());
    $$(".chips, .at-btns", raiz).forEach((x) => { if (!x.querySelector("a")) { const r = x.previousElementSibling; if (r && r.matches(".msg-rel")) r.remove(); x.remove(); } });
    $$("a[href]", raiz).forEach((a) => {
      a.setAttribute("href", urlAbs(a.getAttribute("href"), base));
      if (a.classList.contains("btn")) a.setAttribute("class", "doc-btn");
      a.removeAttribute("download");
      if (novaAba) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
    });
    return raiz;
  }

  // --- imprimir / PDF -------------------------------------------------------------------------------------------------
  // Na impressão das páginas os links levam ao site; o cabeçalho traz o endereço da página e, pelo botão, um QR Code
  let fechados = [], qrImp = "";
  window.addEventListener("beforeprint", () => {
    const L = t();
    fechados = $$("main details:not([open])");
    fechados.forEach((d) => { d.open = true; });
    const url = URL_DOC + (location.hash || "#/");
    $$(".print-head").forEach((x) => x.remove());
    const ph = document.createElement("div");
    ph.className = "print-head";
    ph.innerHTML = `<b>${document.title.includes(L.brand) ? "" : esc(L.brand) + " · "}${esc(document.title)}</b><span><a href="${esc(url)}">${esc(urlPagina())}</a></span><span>${esc(L.pr_date(new Intl.DateTimeFormat(L.locale, { dateStyle: "long", timeStyle: "short" }).format(new Date())))} · ${esc(L.badge)}</span>`
      + (qrImp ? `<div class="print-qr">${qrImp}<span>${esc(L.pr_qr)}</span></div>` : "");
    $("#main").prepend(ph);
    if (document.body.classList.contains("atlas-on")) return;
    $$("main a[href]:not([data-href-orig])").forEach((a) => { a.dataset.hrefOrig = a.getAttribute("href"); a.setAttribute("href", urlAbs(a.dataset.hrefOrig)); });
  });
  window.addEventListener("afterprint", () => {
    fechados.forEach((d) => { d.open = false; }); fechados = [];
    $$("[data-href-orig]").forEach((a) => { a.setAttribute("href", a.dataset.hrefOrig); delete a.dataset.hrefOrig; }); qrImp = "";
    const ph = $(".print-head"); if (ph) ph.remove();
  });
  async function imprimirPagina() {
    qrImp = await svgQr(URL_DOC + (location.hash || "#/")).catch(() => "");
    window.print();
  }

  // --- avisar erro ---------------------------------------------------------------------------------------------------
  function avisarErro(contexto) {
    const L = t();
    const corpo = `${L.rep_tpl_where}: ${urlPagina()}\n${contexto ? `${L.rep_tpl_what}: ${contexto}\n` : ""}\n${L.rep_tpl_desc}:\n`;
    const d = janela(L.rep_title, `<p class="small muted">${esc(L.rep_sub)}</p>
      <label class="rep-f"><span>${esc(L.rep_label)}</span><textarea rows="7">${esc(corpo)}</textarea></label>
      <div class="btn-row"><a class="btn btn-primary" data-gh target="_blank" rel="noopener">${icone("code")} ${esc(L.rep_gh)}</a>
        <button class="btn btn-tg" type="button" data-tgr>${icone("tg")} ${esc(L.rep_tg)}</button></div>
      <p class="small muted">${esc(L.rep_note)}</p>`);
    const ta = d.querySelector("textarea"), gh = d.querySelector("[data-gh]");
    const tituloIssue = () => `${L.rep_issue}${contexto ? ": " + contexto : ""}`.slice(0, 120);
    const atual = () => { gh.href = `${A.REPO}/issues/new?title=${encodeURIComponent(tituloIssue())}&body=${encodeURIComponent(ta.value)}`; };
    ta.addEventListener("input", atual); atual();
    d.querySelector("[data-tgr]").addEventListener("click", async (e) => {
      const bt = e.currentTarget;
      await copiarTexto(ta.value);
      bt.lastChild.textContent = " " + L.rep_copied;
      window.open(A.TELEGRAM, "_blank", "noopener");
    });
    setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 30);
  }

  // --- seções salvas e recentes (só neste navegador) ------------------------------------------------------------
  const CH = { s: "secoes_salvas", r: "secoes_recentes" };
  const chave = (x) => `${x.uf}/${x.z}/${x.s}`;
  function lerLista(tipo) { try { const v = JSON.parse(A.ler(CH[tipo]) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function gravarLista(tipo, l) { A.guardar(CH[tipo], JSON.stringify(l)); }
  const FERR = {
    salvas: () => lerLista("s"),
    recentes: () => lerLista("r"),
    eSalva: (k) => lerLista("s").some((x) => chave(x) === k),
    alternar(item) {
      const l = lerLista("s"), k = chave(item), i = l.findIndex((x) => chave(x) === k);
      if (i >= 0) l.splice(i, 1); else l.unshift({ uf: item.uf, z: item.z, s: item.s, m: item.m });
      gravarLista("s", l.slice(0, 50));
      return i < 0;
    },
    remover(tipo, k) { gravarLista(tipo, lerLista(tipo).filter((x) => chave(x) !== k)); },
    limparRecentes() { gravarLista("r", []); },
  };
  window.FERR = FERR;

  function botaoSalvar(b) {
    const L = t(), item = JSON.parse(b.dataset.save), on = FERR.eSalva(chave(item));
    b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on));
    b.innerHTML = `${icone(on ? "starf" : "star")} <span>${esc(on ? L.sv_saved_btn : L.sv_save)}</span>`;
  }
  function atalhosSecoes() {
    const box = $("#lk-saved"); if (!box) return;
    const L = t(), s = FERR.salvas(), r = FERR.recentes().filter((x) => !s.some((y) => chave(y) === chave(x)));
    const chips = (l, ic) => l.slice(0, 8).map((x) => `<a class="chipq" href="#/secao/${x.uf}/${x.z}/${x.s}">${icone(ic)} ${esc(`${x.uf} · ${x.m || ""} · ${x.z}/${x.s}`)}</a>`).join("");
    box.innerHTML = s.length || r.length ? `<div class="lk-saved">${s.length ? `<p class="small"><b>${esc(L.sv_saved)}:</b></p><div class="chips">${chips(s, "starf")}</div>` : ""}
      ${r.length ? `<p class="small"><b>${esc(L.sv_recent)}:</b></p><div class="chips">${chips(r, "search")}</div>` : ""}<p class="small"><a href="#/salvas">${esc(L.sv_manage)}</a></p></div>` : "";
  }
  document.addEventListener("secao", (e) => {
    const x = e.detail, l = FERR.recentes().filter((y) => chave(y) !== chave(x));
    l.unshift({ uf: x.uf, z: x.z, s: x.s, m: x.m });
    gravarLista("r", l.slice(0, 12));
    $$("[data-save]").forEach(botaoSalvar);
  });

  // --- busca no site ------------------------------------------------------------------------------------------------
  const nz = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  let glossCache = {};

  async function indiceBusca() {
    const L = t(), R = A.state.R, idx = [];
    A.PAGINAS.forEach(([k, h]) => idx.push({ g: "p", tit: L.nav[k], sub: (L.pg[k] || L.pg.bot)[1] || "", h, ic: "arrow" }));
    A.MAIS.forEach(([k, h]) => idx.push({ g: "p", tit: L.nav[k], sub: (L.pg2[k] || ["", ""])[1], h, ic: A.ICO_MAIS[k] }));
    if (R) Object.keys(R.testes_txt[A.state.lang]).sort().forEach((id) => idx.push({ g: "t", tit: `${A.numTeste(id)}. ${A.nomeTeste(id)}`, sub: (A.state.extra && A.state.extra.simples[A.state.lang][id]) || "", h: `#/testes/${id}`, ic: "flask", k: `teste ${A.numTeste(id)} t${A.numTeste(id)}` }));
    Object.keys(window.UF_NOMES).sort().forEach((uf) => idx.push({ g: "u", tit: `${A.ufNome(uf)} (${uf})`, sub: L.uf_kicker, h: `#/uf/${uf}`, ic: "pin", k: uf }));
    const lg = A.state.lang;
    if (!glossCache[lg]) {
      try { const kb = await A.json(`site/data/kb_${lg.toLowerCase()}.json`); glossCache[lg] = kb.filter((e) => e.c === "glossario").map((e) => { const m = e.a.match(/^\*\*([^*]+)\*\*\s*[—-]\s*(.*)/); return { id: e.i, termo: m ? m[1] : e.q[0], def: m ? m[2] : "" }; }); }
      catch (e) { glossCache[lg] = []; }
    }
    glossCache[lg].forEach((x) => idx.push({ g: "g", tit: x.termo, sub: x.def.replace(/\*\*/g, ""), h: `#/glossario/${x.id}`, ic: "book" }));
    const muns = await A.municipios();
    Object.entries(muns).forEach(([uf, ms]) => Object.entries(ms).forEach(([cod, [nm]]) => idx.push({ g: "m", tit: `${A.titulo(nm)} (${uf})`, sub: A.ufNome(uf), h: `#/uf/${uf}/${cod}`, ic: "pin", k: nm })));
    idx.forEach((x) => { x.n = nz(x.tit + " " + (x.k || "")); x.ns = nz(x.sub); });
    return idx;
  }

  function buscarNoIndice(idx, q) {
    const L = t(), qn = nz(q), out = [];
    if (!qn) return out;
    // seção: "PR 177 45" ou "PR zona 177 seção 45"
    const ms = q.match(/\b([A-Za-z]{2})\b\D*?(\d{1,4})\D+?(\d{1,4})\b/);
    if (ms && window.UF_NOMES[ms[1].toUpperCase()]) out.push({ g: "s", tit: L.sr_section(ms[1].toUpperCase(), +ms[2], +ms[3]), sub: L.lk_sub, h: `#/secao/${ms[1].toUpperCase()}/${+ms[2]}/${+ms[3]}`, ic: "search" });
    const termos = qn.split(" ");
    const lim = { p: 6, t: 6, u: 5, g: 6, m: 8 };
    const cont = {};
    idx.map((x) => {
      let sc = 0;
      if (x.n.startsWith(qn)) sc = 100; else if (x.n.includes(" " + qn)) sc = 80; else if (x.n.includes(qn)) sc = 60;
      else if (termos.every((tm) => x.n.includes(tm))) sc = 40; else if (termos.every((tm) => (x.n + " " + x.ns).includes(tm))) sc = 15;
      return [sc - (x.g === "m" ? 5 : 0) - x.tit.length / 100, x];
    }).filter(([sc]) => sc > 0).sort((a, b) => b[0] - a[0]).forEach(([, x]) => { cont[x.g] = (cont[x.g] || 0) + 1; if (cont[x.g] <= lim[x.g]) out.push(x); });
    const ordem = ["s", "p", "t", "u", "m", "g"];
    out.sort((a, b) => ordem.indexOf(a.g) - ordem.indexOf(b.g));
    out.push({ g: "b", tit: L.sr_ask(q), h: A.linkAtlas(q), ic: "globe" });
    return out;
  }

  let indice = null, indiceLang = null;
  async function abrirBusca() {
    const L = t();
    const d = janela(L.sr_title, `<label class="sr-box">${icone("search")}<input type="search" placeholder="${esc(L.sr_ph)}" aria-label="${esc(L.sr_ph)}" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="sr-list"></label>
      <ul class="sr-list" id="sr-list" role="listbox"></ul><p class="small muted sr-hint">${esc(L.sr_hint)}</p>`, "dlg-search");
    const inp = d.querySelector("input"), ul = d.querySelector(".sr-list");
    let res = [], sel = 0;
    const grupos = { s: L.sr_g_s, p: L.sr_g_p, t: L.sr_g_t, u: L.sr_g_u, m: L.sr_g_m, g: L.sr_g_g, b: L.sr_g_b };
    const desenhar = () => {
      let ult = null;
      ul.innerHTML = res.map((x, i) => {
        const cab = x.g !== ult ? `<li class="sr-g" role="presentation">${esc(grupos[x.g])}</li>` : "";
        ult = x.g;
        return cab + `<li role="option" id="sr-${i}" aria-selected="${i === sel}" data-i="${i}">${icone(x.ic)}<span><b>${esc(x.tit)}</b>${x.sub ? `<small>${esc(String(x.sub).slice(0, 110))}</small>` : ""}</span></li>`;
      }).join("") || (inp.value.trim() ? "" : `<li class="sr-g" role="presentation">${esc(L.sr_try)}</li>` + L.sr_examples.map((x) => `<li role="option" data-ex="${esc(x)}">${icone("search")}<span><b>${esc(x)}</b></span></li>`).join(""));
      inp.setAttribute("aria-activedescendant", res.length ? "sr-" + sel : "");
    };
    const ir = (x) => {
      d.close();
      location.hash = x.h;
    };
    const atual = () => { res = indice ? buscarNoIndice(indice, inp.value) : []; sel = 0; desenhar(); };
    inp.addEventListener("input", atual);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(res.length - 1, sel + 1); desenhar(); $("#sr-" + sel, ul) && $("#sr-" + sel, ul).scrollIntoView({ block: "nearest" }); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); desenhar(); $("#sr-" + sel, ul) && $("#sr-" + sel, ul).scrollIntoView({ block: "nearest" }); }
      else if (e.key === "Enter" && res[sel]) { e.preventDefault(); ir(res[sel]); }
    });
    ul.addEventListener("click", (e) => {
      const ex = e.target.closest("[data-ex]"); if (ex) { inp.value = ex.dataset.ex; atual(); inp.focus(); return; }
      const li = e.target.closest("[data-i]"); if (li) ir(res[+li.dataset.i]);
    });
    desenhar();
    setTimeout(() => inp.focus(), 20);
    if (!indice || indiceLang !== A.state.lang) { indice = await indiceBusca(); indiceLang = A.state.lang; if (inp.value) atual(); }
  }

  // --- acessibilidade: tamanho do texto, alto contraste, tema e Libras -------------------------------------------
  const TAM = ["100%", "112.5%", "125%", "140%"];
  function painelA11y() {
    const L = t(), raiz = document.documentElement;
    const fs = raiz.style.getPropertyValue("--fs") || "100%", alto = raiz.getAttribute("data-contrast") === "alto", claro = raiz.getAttribute("data-theme") === "light";
    const vl = A.ler("libras") !== "0";
    const d = janela(L.ax_title, `
      <div class="ax-row"><span>${esc(L.ax_size)}</span><div class="seg" role="group" aria-label="${esc(L.ax_size)}">${TAM.map((v, i) => `<button type="button" data-fs="${v}" aria-pressed="${v === fs}" style="font-size:${0.85 + i * 0.13}rem">A${["−", "", "+", "++"][i]}</button>`).join("")}</div></div>
      <div class="ax-row"><span>${esc(L.ax_contrast)}</span><button type="button" class="sw-btn" data-ct aria-pressed="${alto}"><span></span>${esc(alto ? L.ax_on : L.ax_off)}</button></div>
      <div class="ax-row"><span>${esc(L.ax_theme)}</span><div class="seg" role="group" aria-label="${esc(L.ax_theme)}"><button type="button" data-th="dark" aria-pressed="${!claro}">${icone("moon")} ${esc(L.ax_dark)}</button><button type="button" data-th="light" aria-pressed="${claro}">${icone("sun")} ${esc(L.ax_light)}</button></div></div>
      <div class="ax-row"><span>${esc(L.ax_libras)}<small>${esc(L.ax_libras_note)}</small></span><button type="button" class="sw-btn" data-vl aria-pressed="${vl}"><span></span>${esc(vl ? L.ax_on : L.ax_off)}</button></div>
      <div class="ax-row"><span>${esc(L.ax_voice)}<small>${esc(L.ax_voice_note)}</small></span><a class="btn btn-sm btn-bot" href="#/atlas">${icone("mic")} ${esc(L.bot_cta_btn)}</a></div>
      <div class="ax-row"><span>${esc(L.app_install)}<small>${esc(L.app_note)}</small></span><button type="button" class="btn btn-sm" data-install>${icone("phone")} ${esc(L.app_btn)}</button></div>`, "dlg-a11y");
    d.addEventListener("click", (e) => {
      const f = e.target.closest("[data-fs]");
      if (f) { raiz.style.setProperty("--fs", f.dataset.fs); A.guardar("fonte", f.dataset.fs); $$("[data-fs]", d).forEach((b) => b.setAttribute("aria-pressed", String(b === f))); return; }
      const c = e.target.closest("[data-ct]");
      if (c) { const on = raiz.getAttribute("data-contrast") !== "alto"; if (on) raiz.setAttribute("data-contrast", "alto"); else raiz.removeAttribute("data-contrast"); A.guardar("contraste", on ? "alto" : ""); c.setAttribute("aria-pressed", String(on)); c.lastChild.textContent = on ? L.ax_on : L.ax_off; return; }
      const th = e.target.closest("[data-th]");
      if (th) { if ((raiz.getAttribute("data-theme") === "light") !== (th.dataset.th === "light")) $("#theme-btn").click(); $$("[data-th]", d).forEach((b) => b.setAttribute("aria-pressed", String(b === th))); return; }
      const v = e.target.closest("[data-vl]");
      if (v) { const on = v.getAttribute("aria-pressed") !== "true"; A.guardar("libras", on ? "1" : "0"); v.setAttribute("aria-pressed", String(on)); v.lastChild.textContent = on ? L.ax_on : L.ax_off; libras(); return; }
      if (e.target.closest('a[href^="#/atlas"], [data-install]')) d.close();
    });
  }

  // VLibras (Libras): só em português; o visitante pode desligar
  let vlCarregado = false;
  function libras() {
    const on = A.state.lang === "PT" && A.ler("libras") !== "0";
    document.documentElement.classList.toggle("vl-off", !on);
    if (!on || vlCarregado) return;
    vlCarregado = true;
    const s = document.createElement("script");
    s.src = "https://vlibras.gov.br/app/vlibras-plugin.js"; s.async = true;
    s.onload = () => { try { new window.VLibras.Widget("https://vlibras.gov.br/app"); } catch (e) { /* sem Libras */ } };
    document.body.appendChild(s);
  }

  // --- app instalável (PWA) ---------------------------------------------------------------------------------------------
  let pedidoInstalar = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); pedidoInstalar = e; });
  window.addEventListener("appinstalled", () => { pedidoInstalar = null; });
  async function instalar() {
    const L = t();
    if (pedidoInstalar) { pedidoInstalar.prompt(); try { await pedidoInstalar.userChoice; } catch (e) { /* cancelado */ } pedidoInstalar = null; return; }
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), app = window.matchMedia("(display-mode: standalone)").matches;
    janela(L.app_title, app ? `<p>${esc(L.app_already)}</p>` : `<p>${esc(L.app_intro)}</p>
      <h3>${icone("phone")} ${esc(ios ? "iPhone / iPad" : "Android")}</h3><ol>${(ios ? L.app_ios : L.app_android).map((x) => `<li>${x}</li>`).join("")}</ol>
      <h3>${esc(ios ? "Android" : "iPhone / iPad")}</h3><ol>${(ios ? L.app_android : L.app_ios).map((x) => `<li>${x}</li>`).join("")}</ol>
      <h3>${esc(L.app_pc)}</h3><ol>${L.app_desktop.map((x) => `<li>${x}</li>`).join("")}</ol>`, "dlg-app");
  }
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => { /* sem modo offline */ }); });
  }

  // --- contador de visitas ----------------------------------------------------------------------------------------------
  function contar() {
    if (!GOATCOUNTER || !window.goatcounter || !window.goatcounter.count) return;
    window.goatcounter.count({ path: "/" + (location.hash.replace(/^#\/?/, "").split("?")[0] || ""), title: document.title });
  }
  if (GOATCOUNTER && location.protocol === "https:") {
    window.goatcounter = { no_onload: true };
    const s = document.createElement("script");
    s.async = true; s.src = "https://gc.zgo.at/count.js"; s.dataset.goatcounter = `https://${GOATCOUNTER}.goatcounter.com/count`;
    s.onload = contar;
    document.head.appendChild(s);
  }

  // --- eventos ----------------------------------------------------------------------------------------------------------
  document.addEventListener("click", (e) => {
    const sh = e.target.closest("[data-share]"); if (sh) { compartilhar(sh.closest(".foot-tools") != null); return; }
    if (e.target.closest("[data-img]")) { gerarImagem(); return; }
    if (e.target.closest("[data-feed]")) { e.preventDefault(); assinarFeed(); return; }
    if (e.target.closest("[data-print]")) { imprimirPagina(); return; }
    const rp = e.target.closest("[data-report]"); if (rp) { avisarErro(rp.dataset.report || ""); return; }
    const sv = e.target.closest("[data-save]");
    if (sv) { FERR.alternar(JSON.parse(sv.dataset.save)); botaoSalvar(sv); atalhosSecoes(); return; }
    if (e.target.closest("[data-search]")) { abrirBusca(); return; }
    if (e.target.closest("#a11y-btn, [data-a11y]")) { painelA11y(); return; }
    if (e.target.closest("[data-install]")) { instalar(); }
  });
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase(), digitando = tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
    if (((e.key === "/" && !digitando) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) && !document.querySelector("dialog[open]")) { e.preventDefault(); abrirBusca(); }
  });
  document.addEventListener("pagina", (e) => {
    $$("[data-save]").forEach(botaoSalvar);
    if (e.detail.rota[0] === "secao") atalhosSecoes();
    libras();
    contar();
  });

  A.ferramentas = { janela, copiarTexto, svgQr, urlAbs, linkarDoc, URL_DOC, compartilhar, gerarImagem, avisarErro, abrirBusca, painelA11y, instalar, imagemCartao, cartaoAtual, buscarNoIndice, indiceBusca, imprimirPagina, contarTexto };
})();
