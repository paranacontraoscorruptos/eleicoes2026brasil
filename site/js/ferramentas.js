/* Ferramentas gerais do site: compartilhar, imagem para redes, imprimir, avisar erro, seções salvas,
   busca, acessibilidade (fonte, contraste, Libras), app instalável e contador de visitas. */
(function () {
  "use strict";

  const A = window.APP;
  const { esc, icone, $, $$ } = A;
  const t = () => A.t();
  const URL_SITE = "https://paranacontraoscorruptos.org/";
  // Contador de visitas (GoatCounter, sem cookies). Fica desligado enquanto o código da conta estiver vazio.
  const GOATCOUNTER = "";

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

  async function compartilhar(site) {
    const L = t();
    const url = site ? URL_SITE : urlPagina();
    const titulo = site ? L.hero_title : document.title;
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
      if (b) { principal.hidden = true; post.hidden = false; painelPost(post, b.dataset.post, url, site); post.scrollIntoView({ block: "start" }); return; }
      if (e.target.closest("[data-voltar]")) { limparMidia(post); post.hidden = true; post.innerHTML = ""; principal.hidden = false; }
    });
    d.addEventListener("close", () => limparMidia(post));
  }

  // Passo a passo para postar numa rede que não recebe link: formato, arquivo, texto e abrir a rede
  function painelPost(box, k, url, site) {
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
    painelMidia(box.querySelector(".md"), cartaoAtual(site), fmt, url);
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
    if (e >= 1) return String(s);
    const L = t(), en = A.state.lang === "EN", dsep = en ? "." : ",", gsep = en ? "," : ".";
    const re = en ? /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g : /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
    return String(s).replace(re, (tok) => {
      const [int, frac] = tok.split(dsep), d = frac ? frac.length : 0;
      const v = parseFloat(int.split(gsep).join("") + (d ? "." + frac : ""));
      return new Intl.NumberFormat(L.locale, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: tok.includes(gsep) }).format(v * e);
    });
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
    // linhas: entram uma a uma e os números contam
    const linhas = (c.linhas || []).slice(0, 14);
    const fim = H - base - 230, alt = Math.min(alto ? 120 : 64, Math.max(44, (fim - y) / Math.max(1, linhas.length)));
    const fr = alto && alt >= 90 ? 1.18 : 1; // no formato alto, com espaço sobrando, letras maiores
    linhas.forEach(([rot, val], i) => {
      const ini = 1 + i * .22, ap = fase(ini, .45), conta = fase(ini, 1.3);
      const sub = /^\s\s/.test(rot), r = String(rot).trim(), vv = String(val);
      ctx.globalAlpha = ap;
      const dx = (1 - ap) * 30;
      // o valor nunca é cortado: a letra diminui até caber; o rótulo usa o espaço que sobra
      let fv = Math.round((sub ? 30 : 34) * fr);
      ctx.font = `700 ${fv}px ${F_DISP}`;
      while (ctx.measureText(vv).width > W - 2 * P - 300 && fv > 22) { fv -= 2; ctx.font = `700 ${fv}px ${F_DISP}`; }
      const lv = ctx.measureText(vv).width;
      ctx.font = `${sub ? 400 : 600} ${Math.round((sub ? 28 : 31) * fr)}px ${F_SANS}`; ctx.fillStyle = sub ? "#b8ccbf" : "#e3efe6";
      const xr = (sub ? P + 28 : P) + dx, maxr = W - 2 * P - lv - 40 - (sub ? 28 : 0);
      let rr = r; while (ctx.measureText(rr).width > maxr && rr.length > 4) rr = rr.slice(0, -2);
      if (rr !== r) rr = rr.trim() + "…";
      ctx.fillText(rr, xr, y);
      ctx.font = `700 ${fv}px ${F_DISP}`; ctx.fillStyle = "#ffffff"; ctx.textAlign = "right";
      ctx.fillText(contarTexto(vv, conta), W - P, y); ctx.textAlign = "left";
      ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P, y + alt * 0.42); ctx.lineTo(P + (W - 2 * P) * ap, y + alt * 0.42); ctx.stroke();
      y += alt;
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
  }

  async function imagemCartao(c, fmt) {
    const [W, H] = FORMATOS[fmt];
    await fontes();
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    quadroCartao(cv.getContext("2d"), c, W, H, fundoCartao(W, H), Infinity);
    return new Promise((ok) => cv.toBlob(ok, "image/png"));
  }

  // Vídeo vertical de 8 s gravado do próprio canvas (MP4 quando o navegador grava; senão WebM)
  function tipoVideo() {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return null;
    return ["video/mp4;codecs=avc1.42E01F", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((x) => MediaRecorder.isTypeSupported(x)) || null;
  }
  async function videoCartao(c, cv, aoAvancar) {
    const [W, H] = FORMATOS.video, tipo = tipoVideo();
    await fontes();
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"), fundo = fundoCartao(W, H);
    quadroCartao(ctx, c, W, H, fundo, 0);
    const fluxo = cv.captureStream(30);
    const rec = new MediaRecorder(fluxo, { mimeType: tipo, videoBitsPerSecond: 8000000 });
    const partes = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) partes.push(e.data); };
    const parou = new Promise((ok) => { rec.onstop = ok; });
    rec.start(250);
    const t0 = performance.now();
    await new Promise((ok) => {
      const passo = () => {
        const tm = (performance.now() - t0) / 1000;
        quadroCartao(ctx, c, W, H, fundo, tm);
        aoAvancar(Math.min(1, tm / DUR_VIDEO));
        if (tm < DUR_VIDEO) requestAnimationFrame(passo); else ok();
      };
      requestAnimationFrame(passo);
    });
    rec.stop(); fluxo.getTracks().forEach((x) => x.stop());
    await parou;
    const mime = tipo.split(";")[0];
    return { blob: new Blob(partes, { type: mime }), ext: mime === "video/mp4" ? "mp4" : "webm" };
  }

  // Painel de mídia: formato (post, story ou vídeo), prévia, baixar e enviar para um app
  function limparMidia(box) { (box._urls || []).forEach((u) => URL.revokeObjectURL(u)); box._urls = []; }
  function painelMidia(box, c, fmtIni, url) {
    const L = t(), feitos = {};
    const slug = location.hash.replace(/^#\/?/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "inicio";
    const raiz = box.closest(".sh-post") || box.closest(".dlg-body") || box;
    raiz._urls = raiz._urls || [];
    box.innerHTML = `<div class="md-fmt" role="group" aria-label="${esc(L.md_fmt)}">${["post", "story", "video"].map((f) => `<button type="button" class="chipq" data-fmt="${f}" aria-pressed="false">${esc(L["md_fmt_" + f])}</button>`).join("")}</div>
      <div class="md-prev"></div><p class="small muted md-nota"></p><div class="btn-row md-acoes"></div>`;
    const prev = box.querySelector(".md-prev"), nota = box.querySelector(".md-nota"), acoes = box.querySelector(".md-acoes");
    let atual = null;
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
      prev.className = "md-prev " + (fmt === "post" ? "" : "alto");
      nota.textContent = L["md_note_" + fmt];
      acoes.innerHTML = "";
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
        prev.innerHTML = `<video src="${u}" controls autoplay muted loop playsinline></video>`;
        nota.textContent = L.md_note_video + (v.ext === "webm" ? " " + L.md_webm : "");
      };
      if (feitos.video) { fimVideo(feitos.video); return; }
      prev.innerHTML = `<div class="md-vid-ini"><button class="btn btn-primary" type="button" data-gravar>${icone("play")} ${esc(L.md_make_video)}</button></div>`;
      prev.querySelector("[data-gravar]").addEventListener("click", async () => {
        const cv = document.createElement("canvas");
        prev.innerHTML = `<div class="md-gravando"></div><div class="md-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(L.md_making)}"><span></span></div><p class="small">${esc(L.md_making)}</p>`;
        prev.querySelector(".md-gravando").appendChild(cv);
        box.querySelectorAll("[data-fmt]").forEach((b) => { b.disabled = true; });
        const barra = prev.querySelector(".md-prog span"), pb = prev.querySelector(".md-prog");
        try {
          feitos.video = await videoCartao(c, cv, (k) => { barra.style.width = (k * 100).toFixed(1) + "%"; pb.setAttribute("aria-valuenow", Math.round(k * 100)); });
        } catch (e) { prev.innerHTML = ""; nota.textContent = L.md_novideo; feitos.video = null; }
        box.querySelectorAll("[data-fmt]").forEach((b) => { b.disabled = false; });
        if (feitos.video && atual === "video") fimVideo(feitos.video);
      });
    };
    box.querySelector(".md-fmt").addEventListener("click", (e) => { const b = e.target.closest("[data-fmt]"); if (b && !b.disabled) mostrar(b.dataset.fmt); });
    mostrar(fmtIni || "post");
  }

  async function gerarImagem() {
    const L = t(), c = cartaoAtual(false);
    const d = janela(L.im_title, `<div class="md"></div>
      <h4 class="sh-passo">${esc(L.md_text_title)}</h4>
      <textarea class="sh-texto" rows="3" readonly aria-label="${esc(L.md_copy_text)}">${esc(textoPost(urlPagina()))}</textarea>
      <div class="btn-row"><button class="btn" type="button" data-cptx>${icone("copy")} ${esc(L.md_copy_text)}</button><button class="btn btn-ghost" type="button" data-share>${icone("share")} ${esc(L.md_more_nets)}</button></div>`, "dlg-img");
    const corpo = d.querySelector(".dlg-body");
    painelMidia(d.querySelector(".md"), c, "post", urlPagina());
    d.querySelector("[data-cptx]").addEventListener("click", async (e) => {
      const bt = e.currentTarget;
      const ok = await copiarTexto(textoPost(urlPagina()));
      bt.lastChild.textContent = " " + (ok ? L.copied : L.md_copy_text);
    });
    d.querySelector("[data-share]").addEventListener("click", () => d.close());
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

  // --- imprimir / PDF -------------------------------------------------------------------------------------------------
  let fechados = [];
  window.addEventListener("beforeprint", () => {
    const L = t();
    fechados = $$("main details:not([open])");
    fechados.forEach((d) => { d.open = true; });
    const ph = document.createElement("div");
    ph.className = "print-head";
    ph.innerHTML = `<b>${esc(L.brand)} · ${esc(document.title)}</b><span>${esc(urlPagina())}</span><span>${esc(L.pr_date(new Intl.DateTimeFormat(L.locale, { dateStyle: "long", timeStyle: "short" }).format(new Date())))} · ${esc(L.badge)}</span>`;
    $("#main").prepend(ph);
  });
  window.addEventListener("afterprint", () => {
    fechados.forEach((d) => { d.open = false; }); fechados = [];
    const ph = $(".print-head"); if (ph) ph.remove();
  });

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
    out.push({ g: "b", tit: L.sr_ask(q), sub: L.bot_title, ask: q, ic: "chat" });
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
      if (x.ask) { if (window.BOT) window.BOT.abrir(x.ask); return; }
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
      <div class="ax-row"><span>${esc(L.ax_voice)}<small>${esc(L.ax_voice_note)}</small></span><button type="button" class="btn btn-sm btn-bot" data-open-bot>${icone("mic")} ${esc(L.bot_cta_btn)}</button></div>
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
      if (e.target.closest("[data-open-bot], [data-install]")) d.close();
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
    if (e.target.closest("[data-print]")) { window.print(); return; }
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

  A.ferramentas = { janela, copiarTexto, compartilhar, gerarImagem, avisarErro, abrirBusca, painelA11y, instalar, imagemCartao, cartaoAtual, buscarNoIndice, indiceBusca };
})();
