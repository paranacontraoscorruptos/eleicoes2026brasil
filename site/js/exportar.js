/* Exportar uma página do site ou uma resposta do Atlas: PDF, apresentação animada (.html), página interativa (.html),
   PowerPoint (.pptx), Word (.docx), Excel (.xlsx), planilha CSV, imagem longa (.png), texto (.txt), Markdown (.md)
   e dados (.json). Tudo é gerado neste aparelho, sem servidor.
   O conteúdo vira primeiro uma lista de blocos (títulos, parágrafos, números, barras, tabelas, listas, selos,
   imagens); cada formato é escrito a partir dessa lista. */
(function () {
  "use strict";

  const A = window.APP;
  const { esc, icone, $, $$ } = A;
  const t = () => A.t(), E = () => A.t().xp;
  const URL_SITE = "https://paranacontraoscorruptos.org/";
  const ICON_PX = 30;

  // --- formatos -------------------------------------------------------------------------------------------------------
  const FORMATOS = [["pdf", "print"], ["slides", "play"], ["html", "globe"], ["pptx", "chart"], ["docx", "file"], ["xlsx", "grid"], ["csv", "list"], ["png", "image"], ["txt", "copy"], ["md", "code"], ["json", "terminal"]];

  // --- texto de um elemento (sem ícones nem o que é só visual; números que ainda contavam saem no valor final) ----------
  const nf = (n) => A.nf(n);
  const OCULTO = "[aria-hidden='true'], svg, .tw, button:not(.at-lk), .caret, .at-acts, script, style";
  function txt(el) {
    if (!el) return "";
    if (el.nodeType === 3) return el.nodeValue;
    if (el.matches && el.matches(OCULTO)) return "";
    if (el.dataset && el.dataset.count != null && el.dataset.count !== "") return nf(+el.dataset.count);
    let s = "";
    el.childNodes.forEach((c) => { s += c.nodeType === 3 ? c.nodeValue : c.nodeType === 1 ? (c.tagName === "BR" ? "\n" : txt(c)) : ""; });
    return s;
  }
  const limpo = (s) => String(s || "").replace(/[ \t\u00a0]+/g, " ").replace(/ *\n */g, "\n").trim();
  const absoluto = (href) => (A.ferramentas && A.ferramentas.urlAbs ? A.ferramentas.urlAbs(href, URL_SITE) : href);
  // Trechos de um parágrafo: texto, negrito, link e selo colorido
  function trechos(el) {
    const out = [];
    const add = (o) => { if (!o.txt) return; const u = out[out.length - 1]; if (u && !u.href && !o.href && !u.cor && !o.cor && !!u.b === !!o.b) u.txt += o.txt; else out.push(o); };
    const andar = (n, b) => n.childNodes.forEach((c) => {
      if (c.nodeType === 3) { add({ txt: c.nodeValue.replace(/\s+/g, " "), b }); return; }
      if (c.nodeType !== 1 || c.matches(OCULTO)) return;
      if (c.tagName === "BR") { add({ txt: "\n" }); return; }
      if (c.dataset.count != null && c.dataset.count !== "") { add({ txt: nf(+c.dataset.count), b }); return; }
      if (c.classList.contains("chip")) { const m = c.className.match(/chip-(red|amber|green)/); out.push({ txt: limpo(txt(c)), cor: m ? m[1] : "green" }); return; }
      if (c.tagName === "A" && c.getAttribute("href")) { out.push({ txt: limpo(txt(c)), href: absoluto(c.getAttribute("href")), b }); return; }
      if (c.dataset.href) { out.push({ txt: limpo(txt(c)), href: absoluto(c.dataset.href), b: b || /^(B|STRONG)$/.test(c.tagName) }); return; }
      if (c.matches("button.at-lk") && c.dataset.q) { out.push({ txt: limpo(txt(c)), href: URL_SITE + "#/atlas?q=" + encodeURIComponent(c.dataset.q), b }); return; }
      andar(c, b || /^(B|STRONG|H\d)$/.test(c.tagName));
    });
    andar(el, false);
    if (out.length) { out[0].txt = out[0].txt.replace(/^\s+/, ""); out[out.length - 1].txt = out[out.length - 1].txt.replace(/\s+$/, ""); }
    return out.filter((x) => x.txt);
  }
  const textoTrechos = (rs) => rs.map((r) => r.txt).join("");

  // --- modelo: blocos na ordem em que aparecem -------------------------------------------------------------------------
  const PULAR = ".at-acts, .caret, script, style, noscript, form, .filters, .pg-acoes, .bot-band, .bot-cta, .tg-cta, .skip, .atlas-launcher, .print-head, .tip, dialog, "
    + ".at-btns, .chips, .msg-rel, input, select, textarea, button:not(.at-lk), .btn-copy, .hero-canvas, .hero-visual, [hidden], .at-doc-imp, .at-menu-mais, .at-cam, .lk-form, .tabs, "
    + ".doc-ir, .at-status, .sh-qr, .at-sem, nav, .map-side form";
  const ehIcone = (svg) => svg.getAttribute("aria-hidden") === "true" || (svg.getBoundingClientRect().width || +svg.getAttribute("width") || 0) <= ICON_PX;
  function modelo(elementos) {
    const out = [];
    const ultimo = () => out[out.length - 1];
    function bloco(el) {
      if (el.nodeType === 3) { const s = limpo(el.nodeValue); if (s) out.push({ t: "p", runs: [{ txt: s }] }); return; }
      if (el.nodeType !== 1 || el.matches(PULAR)) return;
      if (el.matches("a.btn, a.doc-btn")) return;
      const tag = el.tagName;
      if (el.classList.contains("msg-user")) { const s = limpo(txt(el)); if (s) out.push({ t: "quem", eu: true, txt: s }); return; }
      if (el.classList.contains("at-resp")) { out.push({ t: "quem", eu: false, txt: "Atlas" }); el.childNodes.forEach(bloco); return; }
      if (/^H[1-6]$/.test(tag)) {
        const sr = el.querySelector(".sr-only");
        const sub = el.querySelector(".muted");
        let s = limpo(sr ? sr.textContent : txt(el));
        if (sub && !sr) s = limpo(s.replace(limpo(txt(sub)), ""));
        if (s) out.push({ t: "h", n: Math.min(3, +tag[1]), txt: s, sub: sub ? limpo(txt(sub)) : "" });
        return;
      }
      if (el.matches("p.at-h")) { const b = el.querySelector("b"), m = el.querySelector(".muted"); out.push({ t: "h", n: 2, txt: limpo(txt(b || el)), sub: m ? limpo(txt(m)) : "", href: b && b.dataset.href ? absoluto(b.dataset.href) : "" }); return; }
      if (el.matches(".kicker")) { const s = limpo(txt(el)); if (s) out.push({ t: "kicker", txt: s }); return; }
      if (el.matches("p.msg-src")) { out.push({ t: "fonte", txt: limpo(txt(el)).replace(/^[^:]{1,14}:\s*/, "") }); return; }
      if (el.matches(".note, .alert, p.small.muted, .small.muted")) {
        if (el.tagName !== "P" && el.children.length && el.querySelector("p, ul, table, dl")) { el.childNodes.forEach(bloco); return; }
        const s = limpo(txt(el)); if (s) out.push({ t: "nota", txt: s, cor: el.classList.contains("alert") ? "red" : "" }); return;
      }
      if (tag === "P" || el.matches(".lead")) {
        const rs = trechos(el);
        if (!rs.length) return;
        if (rs.every((r) => r.cor)) out.push({ t: "chips", itens: rs.map((r) => ({ cor: r.cor, txt: r.txt })) });
        else out.push({ t: "p", runs: rs });
        return;
      }
      if (el.matches("dl.kv")) { out.push({ t: "kv", itens: $$("dt", el).map((dt) => [limpo(txt(dt)), limpo(txt(dt.nextElementSibling))]) }); return; }
      if (el.matches(".tiles")) { const l = $$(".tile", el).map((x) => [limpo(txt(x.querySelector(".tile-l"))), limpo(txt(x.querySelector(".tile-v")))]).filter((x) => x[0] || x[1]); if (l.length) out.push({ t: "kv", itens: l }); return; }
      if (el.matches(".tile")) { out.push({ t: "kv", itens: [[limpo(txt(el.querySelector(".tile-l"))), limpo(txt(el.querySelector(".tile-v")))]] }); return; }
      if (el.matches(".bars")) {
        const itens = $$(".bar-row", el).map((r) => ({ rot: limpo(txt(r.querySelector(".bar-label"))), txt: limpo(txt(r.querySelector(".bar-value"))), f: parseFloat(((r.querySelector(".bar") || {}).getAttribute ? r.querySelector(".bar").getAttribute("style") || "" : "").replace(/.*--f:\s*/, "")) || 0 }));
        if (itens.length) out.push({ t: "bars", itens });
        return;
      }
      if (tag === "TABLE") {
        const linhas = Array.from(el.rows).map((tr) => Array.from(tr.cells).map((c) => limpo(txt(c))));
        if (!linhas.length) return;
        const temCab = el.tHead && el.tHead.rows.length;
        out.push({ t: "tab", cab: temCab ? linhas[0] : [], linhas: temCab ? linhas.slice(1) : linhas });
        return;
      }
      if (tag === "UL" || tag === "OL") {
        const itens = $$(":scope > li", el).map((li) => {
          if (li.matches(".at-rt-p")) { const b = li.querySelector("b"), p = li.querySelector("p"); return [{ txt: limpo(txt(b)), b: true }, { txt: p ? " — " + limpo(txt(p)) : "" }]; }
          if (el.matches(".seq-leg")) { const sw = li.querySelector(".sw"), m = sw && sw.className.match(/q(\d)/); return [{ txt: limpo(txt(li)), cor: m ? "q" + m[1] : "" }]; }
          return trechos(li);
        }).filter((x) => x.length);
        if (itens.length) out.push({ t: "lista", ord: tag === "OL", itens });
        return;
      }
      if (tag === "svg") { if (!ehIcone(el)) out.push({ t: "img", el, alt: el.getAttribute("aria-label") || "" }); return; }
      // imagem que ainda não carregou (carregamento sob demanda, comum no celular) entra também: é carregada na exportação
      if (tag === "IMG") { if ((el.naturalWidth > 60 || (!el.complete && (el.currentSrc || el.src))) && !el.closest(".brand")) out.push({ t: "img", src: el.currentSrc || el.src, el, alt: el.alt || "" }); return; }
      if (tag === "PRE") { out.push({ t: "code", txt: el.textContent.replace(/\n$/, "") }); return; }
      if (tag === "DETAILS") { const s = el.querySelector("summary"); if (s) out.push({ t: "h", n: 3, txt: limpo(txt(s)) }); el.childNodes.forEach((c) => { if (c !== s) bloco(c); }); return; }
      if (el.matches(".tile-v")) return;
      el.childNodes.forEach(bloco);
    }
    elementos.forEach(bloco);
    // junta parágrafos de uma linha só que vieram soltos de um mesmo contêiner
    return out.filter((b, i) => !(b.t === "p" && !textoTrechos(b.runs).trim()) && !(b.t === "fonte" && out.slice(i + 1).some((x) => x.t === "fonte" && x.txt === b.txt)));
  }

  // --- números do texto: "1.234", "12,5%" → valor (para Excel e para a contagem animada) ----------------------------------
  function numero(s) {
    s = String(s == null ? "" : s).replace(/[\u00a0\u202f]/g, " ").trim();
    const en = A.state.lang === "EN";
    const re = en ? /^([+\-−]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s?(%)?$/ : /^([+\-−]?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?)\s?(%)?$/;
    const m = s.match(re);
    if (!m) return null;
    let x = m[1].replace("−", "-");
    x = en ? x.replace(/,/g, "") : x.replace(/\./g, "").replace(",", ".");
    const v = parseFloat(x);
    if (Number.isNaN(v)) return null;
    const dec = (x.split(".")[1] || "").length;
    return m[2] ? { v: v / 100, pct: true, dec } : { v, dec };
  }
  const partes = (s) => String(s || "").split(/\s+·\s+/);

  // --- utilidades de arquivo -------------------------------------------------------------------------------------------------
  function baixar(nome, conteudo, tipo) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo }));
    a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  }
  const nz = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const nomeArq = (meta, ext) => `${(nz(meta.arquivo || meta.titulo) || "auditoria-bu-2026").slice(0, 60)}-${new Date().toISOString().slice(0, 10)}.${ext}`;
  const xml = (s) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
  const bytes = (dataUrl) => { const b = atob(dataUrl.split(",")[1]); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };

  // ZIP simples (sem compressão): é o envelope dos arquivos .pptx, .docx e .xlsx
  const CRC = (() => { const tb = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; tb[n] = c >>> 0; } return tb; })();
  function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function zip(arquivos, tipo) {
    const enc = new TextEncoder(), pecas = [], central = [];
    const d = new Date(), hora = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff, dia = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
    let pos = 0;
    arquivos.forEach((f) => {
      const nome = enc.encode(f.nome), dados = typeof f.dados === "string" ? enc.encode(f.dados) : f.dados, crc = crc32(dados);
      const lh = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, hora, 2], [12, dia, 2], [14, crc, 4], [18, dados.length, 4], [22, dados.length, 4], [26, nome.length, 2], [28, 0, 2]]
        .forEach(([o, v, n]) => (n === 4 ? lh.setUint32(o, v, true) : lh.setUint16(o, v, true)));
      pecas.push(new Uint8Array(lh.buffer), nome, dados);
      const ch = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, hora, 2], [14, dia, 2], [16, crc, 4], [20, dados.length, 4], [24, dados.length, 4], [28, nome.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, pos, 4]]
        .forEach(([o, v, n]) => (n === 4 ? ch.setUint32(o, v, true) : ch.setUint16(o, v, true)));
      central.push(new Uint8Array(ch.buffer), nome);
      pos += 30 + nome.length + dados.length;
    });
    const tamC = central.reduce((a, x) => a + x.length, 0), fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true); fim.setUint32(12, tamC, true); fim.setUint32(16, pos, true);
    return new Blob([...pecas, ...central, new Uint8Array(fim.buffer)], { type: tipo || "application/zip" });
  }

  // Gráfico ou mapa (SVG da página) como PNG, com as cores calculadas e o fundo do tema atual
  const PROPS = ["fill", "fill-opacity", "stroke", "stroke-width", "stroke-opacity", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "opacity", "font-size", "font-family", "font-weight", "text-anchor", "dominant-baseline", "visibility", "display", "paint-order"];
  const fundoTema = () => getComputedStyle(document.body).backgroundColor || "#07130c";
  async function svgPng(svg, largura) {
    const r = svg.getBoundingClientRect(), vb = svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width ? svg.viewBox.baseVal : null;
    const w0 = r.width || (vb && vb.width) || 600, h0 = r.height || (vb && vb.height) || 400;
    const W = Math.round(largura || Math.min(1800, Math.max(900, w0 * 2))), H = Math.max(1, Math.round((W * h0) / w0));
    const c = svg.cloneNode(true), orig = [svg, ...svg.querySelectorAll("*")], copia = [c, ...c.querySelectorAll("*")];
    orig.forEach((el, i) => { const dst = copia[i]; if (!dst || !dst.style) return; const cs = getComputedStyle(el); PROPS.forEach((p) => { const v = cs.getPropertyValue(p); if (v) dst.style.setProperty(p, v); }); });
    c.setAttribute("xmlns", "http://www.w3.org/2000/svg"); c.setAttribute("width", W); c.setAttribute("height", H);
    if (!c.getAttribute("viewBox")) c.setAttribute("viewBox", `0 0 ${w0} ${h0}`);
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(c));
    await img.decode();
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"); ctx.fillStyle = fundoTema(); ctx.fillRect(0, 0, W, H); ctx.drawImage(img, 0, 0, W, H);
    return { url: cv.toDataURL("image/png"), w: W, h: H };
  }
  async function imgPng(src) {
    const img = new Image(); img.crossOrigin = "anonymous"; img.src = src; await img.decode();
    const cv = document.createElement("canvas"); cv.width = img.naturalWidth; cv.height = img.naturalHeight; cv.getContext("2d").drawImage(img, 0, 0);
    return { url: cv.toDataURL("image/png"), w: cv.width, h: cv.height };
  }
  // Imagens do modelo prontas (PNG), uma vez só por exportação
  async function prepararImagens(M) {
    await Promise.all(M.blocos.filter((b) => b.t === "img" && !b.png).map(async (b) => {
      try { b.png = b.el && b.el.tagName === "svg" ? await svgPng(b.el) : await imgPng(b.src); } catch (e) { b.png = null; }
    }));
    M.blocos = M.blocos.filter((b) => b.t !== "img" || b.png);
    if (!M.qr && M.meta.url) { try { const s = await A.ferramentas.svgQr(M.meta.url); M.qrSvg = s; M.qr = await svgTextoPng(s, 360); } catch (e) { M.qr = null; } }
  }
  async function svgTextoPng(s, W) {
    const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s.replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" `)); await img.decode();
    const cv = document.createElement("canvas"); cv.width = W; cv.height = W; const ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, W, W);
    return { url: cv.toDataURL("image/png"), w: W, h: W };
  }

  // --- divisão em slides (apresentação animada e PowerPoint) -------------------------------------------------------------
  // Cada slide tem até 10 "unidades": parágrafo ≈ 1 a 4, par de números 1, barra 1, linha de tabela 1, item de lista 1, imagem 10
  const CAP = 10, MAX_SLIDE = 24;
  function dividirTexto(s, max) { const out = []; let at = ""; s.split(/(?<=[.!?;])\s+/).forEach((f) => { if ((at + " " + f).length > max && at) { out.push(at); at = f; } else at = at ? at + " " + f : f; }); if (at) out.push(at); return out; }
  function paginar(M) {
    const slides = [{ tipo: "capa" }];
    let tit = M.meta.titulo, sub = "", at = null;
    const novo = (cont) => { at = { tipo: "c", titulo: tit, sub, cont: !!cont, itens: [], u: 0 }; slides.push(at); };
    const caber = (u) => { if (!at || (at.u + u > CAP && at.itens.length)) novo(at && at.titulo === tit); };
    M.blocos.forEach((b) => {
      if (b.t === "quem") { if (b.eu) { tit = b.txt.length > 90 ? b.txt.slice(0, 88) + "…" : b.txt; sub = ""; novo(); } return; }
      if (b.t === "kicker") { sub = b.txt; return; }
      if (b.t === "h" && b.n <= 2) { tit = b.txt; sub = b.sub || ""; novo(); return; }
      if (b.t === "h") { if (at && at.u > 5) novo(); else if (!at) novo(); at.itens.push(b); at.u += 1; return; }
      if (b.t === "fonte") return;
      if (b.t === "p") {
        const s = textoTrechos(b.runs);
        if (s.length <= 420) { const u = Math.max(1, Math.ceil(s.length / 140)); caber(u); at.itens.push(b); at.u += u; return; }
        dividirTexto(s, 400).forEach((x) => { const u = Math.ceil(x.length / 140); caber(u); at.itens.push({ t: "p", runs: [{ txt: x }] }); at.u += u; });
        return;
      }
      if (b.t === "kv") { for (let i = 0; i < b.itens.length; i += 8) { const it = b.itens.slice(i, i + 8), u = Math.ceil(it.length / 2) + 1; caber(u); at.itens.push({ t: "kv", itens: it }); at.u += u; } return; }
      const mais = (n) => { if (n > MAX_SLIDE) { caber(1); at.itens.push({ t: "nota", txt: E().more_rows(A.nf(n - MAX_SLIDE)) }); at.u += 1; } };
      if (b.t === "bars" && b.itens.length > MAX_SLIDE) { const n = b.itens.length; b = Object.assign({}, b, { itens: b.itens.slice(0, MAX_SLIDE) }); paginarBloco(b); mais(n); return; }
      if (b.t === "tab" && b.linhas.length > MAX_SLIDE) { const n = b.linhas.length; b = Object.assign({}, b, { linhas: b.linhas.slice(0, MAX_SLIDE) }); paginarBloco(b); mais(n); return; }
      paginarBloco(b);
    });
    function paginarBloco(b) {
      if (b.t === "bars") { for (let i = 0; i < b.itens.length; i += 8) { const it = b.itens.slice(i, i + 8), u = it.length; caber(u); at.itens.push({ t: "bars", itens: it }); at.u += u; } return; }
      if (b.t === "tab") { for (let i = 0; i < Math.max(1, b.linhas.length); i += 8) { const it = b.linhas.slice(i, i + 8), u = it.length + 1; caber(u); at.itens.push({ t: "tab", cab: b.cab, linhas: it }); at.u += u; } return; }
      if (b.t === "lista") { for (let i = 0; i < b.itens.length; i += 7) { const it = b.itens.slice(i, i + 7), u = it.length; caber(u); at.itens.push({ t: "lista", ord: b.ord, ini: i, itens: it }); at.u += u; } return; }
      if (b.t === "img") { if (!(at && at.itens.length === 1 && at.itens[0].t === "h")) novo(at && at.titulo === tit); at.itens.push(b); at.u = CAP; return; }
      if (b.t === "code") { const ls = b.txt.split("\n"); for (let i = 0; i < ls.length; i += 12) { caber(4); at.itens.push({ t: "code", txt: ls.slice(i, i + 12).join("\n") }); at.u += 4; } return; }
      caber(1); at.itens.push(b); at.u += 1;
    }
    const fontes = [...new Set(M.blocos.filter((b) => b.t === "fonte").map((b) => b.txt))];
    slides.push({ tipo: "fim", fontes });
    return slides.filter((s) => s.tipo !== "c" || s.itens.length);
  }

  // --- 1) apresentação animada (.html, um arquivo só, funciona sem internet) -----------------------------------------------
  const DECK_CSS = `*{box-sizing:border-box}html,body{margin:0;height:100%;background:#020604;overflow:hidden}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#eef6f0;-webkit-font-smoothing:antialiased}
.deck{position:fixed;inset:0;display:grid;place-items:center}
.slide{position:absolute;width:1280px;height:720px;left:50%;top:50%;margin:-360px 0 0 -640px;padding:56px 72px 64px;background:radial-gradient(900px 500px at 92% -10%,rgba(255,212,0,.13),transparent 60%),radial-gradient(800px 600px at -10% 20%,rgba(0,156,59,.2),transparent 60%),linear-gradient(135deg,#07130c,#0c1a12);
 border-radius:18px;overflow:hidden;opacity:0;visibility:hidden;transform-origin:center;transition:opacity .45s ease,visibility 0s .45s;display:flex;flex-direction:column;gap:18px}
.slide::before,.slide::after{content:"";position:absolute;left:0;right:0;height:8px;background:linear-gradient(90deg,#009c3b,#ffdf00 50%,#002776)}.slide::before{top:0}.slide::after{bottom:0}
.slide.on{opacity:1;visibility:visible;transition:opacity .45s ease}
.slide .grade{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:48px 48px;pointer-events:none}
.kick{font:600 15px/1.2 system-ui;letter-spacing:.14em;text-transform:uppercase;color:#3ddc84}
h1{font-size:44px;line-height:1.08;margin:0;font-weight:800;letter-spacing:-.01em}h2{font-size:36px;line-height:1.12;margin:0;font-weight:800}
h3{font-size:22px;margin:4px 0 0;color:#ffd400}.sub{font-size:19px;color:#a8bfb0;margin:-8px 0 0}
.corpo{flex:1;display:flex;flex-direction:column;gap:16px;min-height:0;position:relative}
p{font-size:21px;line-height:1.45;margin:0;color:#dfeee5}a{color:#ffd400}
.kv{display:grid;grid-template-columns:repeat(var(--c,2),1fr);gap:14px}
.kvi{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 18px}
.kl{display:block;font-size:15px;color:#a8bfb0;margin-bottom:6px}.kvv{display:block;font-size:30px;font-weight:800;font-variant-numeric:tabular-nums;color:#fff}
.bars{display:grid;gap:12px}.br{display:grid;grid-template-columns:minmax(180px,34%) 1fr;gap:16px;align-items:center}
.bl{font-size:18px;color:#dfeee5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bt{position:relative;height:30px;background:rgba(255,255,255,.06);border-radius:8px}.bt i{position:absolute;left:0;top:0;bottom:0;width:calc(var(--f)*(100% - 190px));min-width:3px;border-radius:8px;background:linear-gradient(90deg,#1fc35f,#7ee2a6);transform-origin:left;transform:scaleX(0)}
.bv{position:absolute;top:50%;transform:translateY(-50%);left:calc(var(--f)*(100% - 190px) + 12px);font-size:17px;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
.on .bt i{transform:scaleX(1);transition:transform 1.1s cubic-bezier(.2,.8,.2,1) calc(var(--i)*90ms + .25s)}
table{width:100%;border-collapse:collapse;font-size:17px;font-variant-numeric:tabular-nums}th{text-align:left;color:#a8bfb0;font-weight:600;border-bottom:1px solid rgba(255,255,255,.18);padding:8px 10px}
td{padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.07)}td:not(:first-child),th:not(:first-child){text-align:right}
ul,ol{margin:0;padding-left:26px;display:grid;gap:8px}li{font-size:20px;line-height:1.4}
.chip{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;font-size:17px;font-weight:600;margin:0 8px 8px 0}.chip::before{content:"";width:9px;height:9px;border-radius:50%;background:currentColor}
.c-red{background:rgba(239,68,68,.2);color:#ff6b6b}.c-amber{background:rgba(245,180,0,.18);color:#ffc83d}.c-green{background:rgba(31,195,95,.18);color:#3ddc84}
.q0{color:#1c2b44}.q1{color:#24457e}.q2{color:#2f63bb}.q3{color:#5689e8}.q4{color:#a4c3f7}
.nota{font-size:16px;color:#a8bfb0}.nota.red{color:#ff8a8a}pre{margin:0;font:15px/1.5 ui-monospace,Menlo,Consolas,monospace;background:rgba(0,0,0,.35);padding:14px 16px;border-radius:10px;white-space:pre-wrap;color:#cfe8d8}
.fig{flex:1;min-height:0;display:flex;align-items:center;justify-content:center}.fig img{max-width:100%;max-height:100%;border-radius:12px;object-fit:contain}
.rod{position:absolute;left:72px;right:72px;bottom:22px;display:flex;justify-content:space-between;font-size:13px;color:#7f9888}
.capa{justify-content:center}.capa h1{font-size:58px;max-width:900px}.capa .sub{font-size:24px;margin:0}.capa .meta{font-size:16px;color:#a8bfb0}
.selo{display:inline-block;align-self:flex-start;padding:8px 14px;border:1px solid rgba(255,212,0,.5);border-radius:999px;color:#ffd400;font-size:15px;font-weight:600}
.qr{position:absolute;right:72px;bottom:70px;width:190px;text-align:center;font-size:13px;color:#a8bfb0}.qr img{width:190px;height:190px;border-radius:12px;background:#fff;padding:10px;display:block;margin-bottom:8px}
.fim{justify-content:center}.fim h2{font-size:40px}
.an{opacity:0;transform:translateY(18px)}.on .an{opacity:1;transform:none;transition:opacity .6s ease calc(var(--i,0)*80ms + .1s),transform .6s cubic-bezier(.2,.8,.2,1) calc(var(--i,0)*80ms + .1s)}
.on tr.an{transition-delay:calc(var(--i,0)*60ms + .2s)}
.ui{position:fixed;left:0;right:0;bottom:0;display:flex;align-items:center;gap:10px;padding:10px 14px;z-index:5;opacity:.0;transition:opacity .3s}.ui:hover,.toque .ui,.ui:focus-within{opacity:1}
.ui button{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:8px 14px;font:600 14px system-ui;cursor:pointer}
.ui .n{color:#cfe8d8;font:600 14px system-ui;margin-left:auto}.prog{position:fixed;left:0;top:0;height:4px;background:#ffd400;z-index:6;transition:width .35s}
.dica{position:fixed;left:50%;bottom:58px;transform:translateX(-50%);background:rgba(0,0,0,.7);color:#fff;padding:8px 14px;border-radius:999px;font:14px system-ui;z-index:6;transition:opacity .6s}
@media (prefers-reduced-motion:reduce){.an,.on .an{opacity:1;transform:none;transition:none}.bt i,.on .bt i{transform:none;transition:none}.slide{transition:none}}
@media print{html,body{overflow:visible;height:auto;background:#fff}.deck{position:static;display:block}.slide{position:relative;left:auto;top:auto;margin:0 0 0;opacity:1;visibility:visible;transform:none!important;break-after:page;border-radius:0}.an{opacity:1;transform:none}.bt i{transform:none}.ui,.prog,.dica{display:none}@page{size:1280px 720px;margin:0}}`;
  const DECK_JS = `(function(){var S=[].slice.call(document.querySelectorAll(".slide")),i=0,deck=document.querySelector(".deck"),prog=document.querySelector(".prog"),n=document.querySelector(".ui .n"),reduz=matchMedia("(prefers-reduced-motion: reduce)").matches;
var loc=document.documentElement.getAttribute("data-locale")||"pt-BR",en=/^en/.test(loc),RE=en?/\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?/g:/\\d{1,3}(?:\\.\\d{3})+(?:,\\d+)?|\\d+(?:,\\d+)?/g;
function conta(s,e){if(e>=1||/\\d:\\d\\d/.test(s))return s;return s.replace(RE,function(tk){var ds=en?".":",",gs=en?",":".",p=tk.split(ds),d=p[1]?p[1].length:0,v=parseFloat(p[0].split(gs).join("")+(d?"."+p[1]:""));if(/^(19|20)\\d\\d$/.test(tk))return tk;return new Intl.NumberFormat(loc,{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:tk.indexOf(gs)>=0}).format(v*e);});}
function animar(sl){if(reduz)return;var ns=sl.querySelectorAll("[data-num]"),t0=performance.now();function f(t){var k=Math.min(1,(t-t0-250)/1400);if(k<0)k=0;var e=1-Math.pow(1-k,3);for(var j=0;j<ns.length;j++)ns[j].textContent=conta(ns[j].getAttribute("data-num"),e);if(k<1&&sl.classList.contains("on"))requestAnimationFrame(f);else for(var j2=0;j2<ns.length;j2++)ns[j2].textContent=ns[j2].getAttribute("data-num");}requestAnimationFrame(f);}
function escala(){var k=Math.min(innerWidth/1280,innerHeight/720)*.98;S.forEach(function(s){s.style.transform="scale("+k+")";});}
function ir(k){k=Math.max(0,Math.min(S.length-1,k));S[i].classList.remove("on");i=k;var s=S[i];void s.offsetWidth;s.classList.add("on");animar(s);prog.style.width=((i+1)/S.length*100)+"%";n.textContent=(i+1)+" / "+S.length;try{history.replaceState(null,"","#"+(i+1));}catch(e){}}
addEventListener("resize",escala);escala();
addEventListener("keydown",function(e){var k=e.key;if(k==="ArrowRight"||k==="PageDown"||k===" "||k==="Enter"||k==="ArrowDown"){e.preventDefault();ir(i+1);}else if(k==="ArrowLeft"||k==="PageUp"||k==="Backspace"||k==="ArrowUp"){e.preventDefault();ir(i-1);}else if(k==="Home")ir(0);else if(k==="End")ir(S.length-1);else if(k==="f"||k==="F")tela();});
function tela(){var d=document;if(!d.fullscreenElement){(d.documentElement.requestFullscreen||d.documentElement.webkitRequestFullscreen||function(){}).call(d.documentElement);}else{(d.exitFullscreen||d.webkitExitFullscreen).call(d);}}
deck.addEventListener("click",function(e){if(e.target.closest("a"))return;if(e.clientX<innerWidth/3)ir(i-1);else ir(i+1);});
var x0=null;addEventListener("touchstart",function(e){x0=e.touches[0].clientX;document.body.classList.add("toque");},{passive:true});addEventListener("touchend",function(e){if(x0==null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40){ir(i+(dx<0?1:-1));}x0=null;},{passive:true});
document.querySelector("[data-a]").onclick=function(e){e.stopPropagation();ir(i-1);};document.querySelector("[data-p]").onclick=function(e){e.stopPropagation();ir(i+1);};document.querySelector("[data-f]").onclick=function(e){e.stopPropagation();tela();};
var h=parseInt(location.hash.slice(1),10);i=0;S[0].classList.add("on");ir(h>0?h-1:0);setTimeout(function(){var d=document.querySelector(".dica");if(d)d.style.opacity=0;},4000);})();`;

  function runsHtml(rs) {
    return rs.map((r) => {
      const s = esc(r.txt).replace(/\n/g, "<br>");
      if (r.cor && /^q\d$/.test(r.cor)) return `<span class="${r.cor}">■</span> ${s}`;
      if (r.cor) return `<span class="chip c-${r.cor}">${s}</span>`;
      const x = r.b ? `<b>${s}</b>` : s;
      return r.href ? `<a href="${esc(r.href)}" target="_blank" rel="noopener">${x}</a>` : x;
    }).join("");
  }
  const contavel = (s) => /\d/.test(s) && !/\d:\d\d/.test(s);
  function slideHtml(sl, M, k, total) {
    const L = t(), X = E(), meta = M.meta;
    const rod = `<div class="rod"><span>${esc(L.badge)} · ${esc(URL_SITE.replace(/^https:\/\/|\/$/g, ""))}</span><span>${k} / ${total}</span></div>`;
    if (sl.tipo === "capa") {
      return `<section class="slide capa"><div class="grade"></div><span class="kick an" style="--i:0">${esc(meta.kicker || L.brand)}</span><h1 class="an" style="--i:1">${esc(meta.titulo)}</h1>
        ${meta.sub ? `<p class="sub an" style="--i:2">${esc(meta.sub)}</p>` : ""}<p class="meta an" style="--i:3">${esc(X.made(meta.quando))}</p><span class="selo an" style="--i:4">${esc(L.badge)}</span>
        ${M.qr ? `<div class="qr an" style="--i:5"><img src="${M.qr.url}" alt="QR Code">${esc(X.open)}</div>` : ""}${rod}</section>`;
    }
    if (sl.tipo === "fim") {
      return `<section class="slide fim"><div class="grade"></div><span class="kick an" style="--i:0">${esc(X.slide_end)}</span><h2 class="an" style="--i:1">${esc(L.badge)}</h2>
        ${sl.fontes.length ? `<p class="an" style="--i:2"><b>${esc(X.src)}:</b> ${esc(sl.fontes.join(" · "))}</p>` : ""}<p class="nota an" style="--i:3">${esc(L.at.sg_note)}</p>
        ${meta.url ? `<p class="an" style="--i:4"><a href="${esc(meta.url)}" target="_blank" rel="noopener">${esc(meta.url.replace(/^https:\/\//, ""))}</a></p>` : ""}<p class="meta nota an" style="--i:5">${esc(X.made(meta.quando))}</p>
        ${M.qr ? `<div class="qr an" style="--i:6"><img src="${M.qr.url}" alt="QR Code">${esc(X.open)}</div>` : ""}${rod}</section>`;
    }
    let i = 2, h = "";
    sl.itens.forEach((b) => {
      const an = () => `class="an" style="--i:${i++}"`;
      if (b.t === "h") h += `<h3 ${an()}>${esc(b.txt)}</h3>`;
      else if (b.t === "p") h += `<p ${an()}>${runsHtml(b.runs)}</p>`;
      else if (b.t === "kv") h += `<div class="kv" style="--c:${b.itens.length <= 2 ? b.itens.length : b.itens.length === 3 ? 3 : b.itens.length <= 4 ? 2 : 4}">${b.itens.map(([kk, v]) => `<div class="kvi an" style="--i:${i++}"><span class="kl">${esc(kk)}</span><span class="kvv"${contavel(v) ? ` data-num="${esc(v)}"` : ""}>${esc(v)}</span></div>`).join("")}</div>`;
      else if (b.t === "bars") h += `<div class="bars">${b.itens.map((x, j) => `<div class="br an" style="--i:${i++}"><span class="bl" title="${esc(x.rot)}">${esc(x.rot)}</span><span class="bt" style="--f:${Math.max(0, Math.min(1, x.f)).toFixed(4)};--i:${j}"><i></i><span class="bv"${contavel(x.txt) ? ` data-num="${esc(x.txt)}"` : ""}>${esc(x.txt)}</span></span></div>`).join("")}</div>`;
      else if (b.t === "tab") h += `<table>${b.cab.length ? `<thead><tr>${b.cab.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>` : ""}<tbody>${b.linhas.map((l) => `<tr class="an" style="--i:${i++}">${l.map((c) => `<td${contavel(c) && c.length < 30 ? ` data-num="${esc(c)}"` : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      else if (b.t === "lista") h += `<${b.ord ? `ol start="${(b.ini || 0) + 1}"` : "ul"}>${b.itens.map((rs) => `<li class="an" style="--i:${i++}">${runsHtml(rs)}</li>`).join("")}</${b.ord ? "ol" : "ul"}>`;
      else if (b.t === "chips") h += `<div ${an()}>${b.itens.map((c) => `<span class="chip c-${c.cor}">${esc(c.txt)}</span>`).join("")}</div>`;
      else if (b.t === "img") h += `<div class="fig an" style="--i:${i++}"><img src="${b.png.url}" alt="${esc(b.alt)}"></div>`;
      else if (b.t === "code") h += `<pre ${an()}>${esc(b.txt)}</pre>`;
      else if (b.t === "nota") h += `<p class="nota${b.cor ? " red" : ""} an" style="--i:${i++}">${esc(b.txt)}</p>`;
    });
    return `<section class="slide"><div class="grade"></div><span class="kick an" style="--i:0">${esc(sl.sub || meta.kicker || L.brand)}</span><h2 class="an" style="--i:1">${esc(sl.titulo)}${sl.cont ? ` <span class="sub">${esc(X.cont)}</span>` : ""}</h2>
      <div class="corpo">${h}</div>${rod}</section>`;
  }
  async function apresentacao(M) {
    await prepararImagens(M);
    const L = t(), X = E(), sl = paginar(M);
    const html = `<!doctype html><html lang="${{ PT: "pt-BR", EN: "en", ES: "es" }[A.state.lang]}" data-locale="${esc(L.locale)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(M.meta.titulo)} · ${esc(L.brand)}</title><style>${DECK_CSS}</style></head><body><div class="prog"></div><main class="deck" aria-live="polite">${sl.map((s, k) => slideHtml(s, M, k + 1, sl.length)).join("")}</main>
<div class="ui"><button type="button" data-a>‹ ${esc(X.prev)}</button><button type="button" data-p>${esc(X.next)} ›</button><button type="button" data-f>${esc(X.full)}</button><span class="n"></span></div>
<div class="dica">${esc(X.nav_help)}</div><script>${DECK_JS}<\/script></body></html>`;
    baixar(nomeArq(M.meta, "html").replace(/\.html$/, "-apresentacao.html"), html, "text/html;charset=utf-8");
  }

  // --- 2) PowerPoint (.pptx) -----------------------------------------------------------------------------------------------
  const EMU = 9525; // 1 px (a 96 ppp) em EMU; o slide tem 1280 × 720 px
  const NS_P = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const COR = { fundo: "07130C", txt: "EEF6F0", sub: "A8BFB0", verde: "1FC35F", amarelo: "FFD400", red: "FF6B6B", amber: "FFC83D", green: "3DDC84", linha: "2A3A30", cartao: "13241A" };
  const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  function pptx(M) {
    const L = t(), X = E(), sl = paginar(M), lang = { PT: "pt-BR", EN: "en-US", ES: "es-ES" }[A.state.lang];
    const media = [], arquivos = [];
    const slidesXml = sl.map((s, k) => {
      let id = 2;
      const rels = [{ id: "rId1", tipo: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout", alvo: "../slideLayouts/slideLayout1.xml" }];
      const rel = (tipo, alvo, ext) => { const r = "rId" + (rels.length + 1); rels.push({ id: r, tipo, alvo, ext }); return r; };
      const shapes = [], barras = [];
      const xf = (x, y, w, h) => `<a:xfrm><a:off x="${Math.round(x * EMU)}" y="${Math.round(y * EMU)}"/><a:ext cx="${Math.round(w * EMU)}" cy="${Math.round(h * EMU)}"/></a:xfrm>`;
      const rPr = (o) => `<a:rPr lang="${lang}" sz="${Math.round((o.sz || 18) * 100)}"${o.b ? ' b="1"' : ""} dirty="0"><a:solidFill><a:srgbClr val="${o.cor || COR.txt}"/></a:solidFill><a:latin typeface="Arial"/><a:cs typeface="Arial"/>${o.href ? `<a:hlinkClick r:id="${rel("http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", o.href, true)}"/>` : ""}</a:rPr>`;
      const par = (runs, o) => `<a:p><a:pPr algn="${(o && o.algn) || "l"}"${o && o.bullet ? ' marL="285750" indent="-285750"' : ""}>${o && o.bullet ? `<a:buFont typeface="Arial"/><a:buChar char="${o.bullet}"/>` : "<a:buNone/>"}</a:pPr>${runs.map((r) => `<a:r>${rPr(r)}<a:t>${xml(r.txt)}</a:t></a:r>`).join("")}<a:endParaRPr lang="${lang}" sz="${Math.round(((runs[0] && runs[0].sz) || 18) * 100)}" dirty="0"/></a:p>`;
      const caixa = (x, y, w, h, pars, o) => { const i = id++; shapes.push(`<p:sp><p:nvSpPr><p:cNvPr id="${i}" name="Texto ${i}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${xf(x, y, w, h)}<a:prstGeom prst="${(o && o.geom) || "rect"}"><a:avLst/></a:prstGeom>${o && o.fill ? `<a:solidFill><a:srgbClr val="${o.fill}"/></a:solidFill>` : "<a:noFill/>"}</p:spPr><p:txBody><a:bodyPr wrap="square" lIns="${o && o.pad ? 91440 : 0}" tIns="${o && o.pad ? 45720 : 0}" rIns="${o && o.pad ? 91440 : 0}" bIns="${o && o.pad ? 45720 : 0}" anchor="${(o && o.anchor) || "t"}"><a:normAutofit/></a:bodyPr><a:lstStyle/>${pars.join("")}</p:txBody></p:sp>`); return i; };
      const ret = (x, y, w, h, cor, nome) => { const i = id++; shapes.push(`<p:sp><p:nvSpPr><p:cNvPr id="${i}" name="${nome || "Forma"} ${i}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xf(x, y, w, h)}<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 25000"/></a:avLst></a:prstGeom><a:solidFill><a:srgbClr val="${cor}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr></p:sp>`); return i; };
      const imagem = (png, x, y, w, h, alt) => {
        const n = media.length + 1; media.push({ nome: `ppt/media/image${n}.png`, dados: bytes(png.url) });
        const r = rel("http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", `../media/image${n}.png`);
        const i = id++;
        shapes.push(`<p:pic><p:nvPicPr><p:cNvPr id="${i}" name="Imagem ${i}" descr="${xml(alt || "")}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${r}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xf(x, y, w, h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`);
      };
      const faixa = () => { ret(0, 0, 1280, 8, COR.verde, "Faixa"); ret(0, 712, 1280, 8, COR.amarelo, "Faixa"); };
      const rodape = () => caixa(72, 684, 1136, 22, [par([{ txt: `${L.badge} · ${URL_SITE.replace(/^https:\/\/|\/$/g, "")} · ${k + 1}/${sl.length}`, sz: 10, cor: "7F9888" }])]);
      faixa();
      if (s.tipo === "capa") {
        caixa(72, 150, 900, 30, [par([{ txt: (M.meta.kicker || L.brand).toUpperCase(), sz: 14, b: true, cor: COR.green }])]);
        caixa(72, 190, 900, 210, [par([{ txt: M.meta.titulo, sz: 44, b: true, cor: "FFFFFF" }])], { anchor: "t" });
        if (M.meta.sub) caixa(72, 410, 900, 60, [par([{ txt: M.meta.sub, sz: 20, cor: COR.sub }])]);
        caixa(72, 480, 900, 30, [par([{ txt: X.made(M.meta.quando), sz: 14, cor: COR.sub }])]);
        caixa(72, 530, 520, 40, [par([{ txt: L.badge, sz: 14, b: true, cor: COR.amarelo }])], { pad: true, geom: "roundRect" });
        if (M.qr) { imagem(M.qr, 1020, 420, 180, 180, "QR Code"); caixa(990, 610, 240, 30, [par([{ txt: X.open, sz: 11, cor: COR.sub }], { algn: "ctr" })]); }
        if (M.meta.url) caixa(72, 590, 900, 30, [par([{ txt: M.meta.url.replace(/^https:\/\//, ""), sz: 13, cor: COR.amarelo, href: M.meta.url }])]);
      } else if (s.tipo === "fim") {
        caixa(72, 160, 1000, 30, [par([{ txt: X.slide_end.toUpperCase(), sz: 14, b: true, cor: COR.green }])]);
        caixa(72, 200, 1000, 90, [par([{ txt: L.badge, sz: 34, b: true, cor: "FFFFFF" }])]);
        const ps = [];
        if (s.fontes.length) ps.push(par([{ txt: X.src + ": ", sz: 16, b: true }, { txt: s.fontes.join(" · "), sz: 16 }]));
        ps.push(par([{ txt: L.at.sg_note, sz: 14, cor: COR.sub }]));
        if (M.meta.url) ps.push(par([{ txt: M.meta.url.replace(/^https:\/\//, ""), sz: 14, cor: COR.amarelo, href: M.meta.url }]));
        ps.push(par([{ txt: X.made(M.meta.quando), sz: 12, cor: COR.sub }]));
        caixa(72, 310, 860, 300, ps);
        if (M.qr) imagem(M.qr, 1020, 420, 180, 180, "QR Code");
        rodape();
      } else {
        caixa(72, 40, 1136, 24, [par([{ txt: (s.sub || M.meta.kicker || L.brand).toUpperCase(), sz: 12, b: true, cor: COR.green }])]);
        caixa(72, 66, 1136, 64, [par([{ txt: s.titulo + (s.cont ? ` ${X.cont}` : ""), sz: 28, b: true, cor: "FFFFFF" }])]);
        let y = 146;
        const resta = () => 668 - y;
        s.itens.forEach((b) => {
          if (resta() < 30) return;
          if (b.t === "h") { caixa(72, y, 1136, 32, [par([{ txt: b.txt, sz: 18, b: true, cor: COR.amarelo }])]); y += 38; }
          else if (b.t === "p" || b.t === "nota") {
            const s_ = b.t === "p" ? textoTrechos(b.runs) : b.txt, alt = Math.min(resta(), 30 * Math.ceil(s_.length / 110) + 6);
            caixa(72, y, 1136, alt, [par(b.t === "p" ? b.runs.map((r) => ({ txt: r.txt, b: r.b, href: r.href, sz: 16, cor: r.cor ? COR[r.cor] || COR.txt : COR.txt })) : [{ txt: b.txt, sz: 13, cor: COR.sub }])]); y += alt + 8;
          } else if (b.t === "kv") {
            const cols = b.itens.length <= 2 ? b.itens.length : b.itens.length === 3 ? 3 : b.itens.length <= 4 ? 2 : 4, w = (1136 - (cols - 1) * 14) / cols, hh = 84;
            b.itens.forEach(([kk, v], j) => {
              const cx = 72 + (j % cols) * (w + 14), cy = y + Math.floor(j / cols) * (hh + 12);
              caixa(cx, cy, w, hh, [par([{ txt: kk, sz: 12, cor: COR.sub }]), par([{ txt: v, sz: 22, b: true, cor: "FFFFFF" }])], { fill: COR.cartao, pad: true, geom: "roundRect", anchor: "ctr" });
            });
            y += Math.ceil(b.itens.length / cols) * (hh + 12) + 4;
          } else if (b.t === "bars") {
            const lw = 380, tw = 1136 - lw - 16, alt = 34;
            b.itens.forEach((x) => {
              caixa(72, y, lw, alt, [par([{ txt: x.rot, sz: 14, cor: COR.txt }])], { anchor: "ctr" });
              ret(72 + lw + 16, y + 6, tw - 190, alt - 12, COR.linha, "Trilho");
              const bw = Math.max(4, (tw - 190) * Math.max(0, Math.min(1, x.f)));
              barras.push(ret(72 + lw + 16, y + 6, bw, alt - 12, COR.verde, "Barra"));
              caixa(72 + lw + 16 + bw + 10, y, 300, alt, [par([{ txt: x.txt, sz: 13, b: true, cor: "FFFFFF" }])], { anchor: "ctr" });
              y += alt + 8;
            });
            y += 6;
          } else if (b.t === "tab") {
            const cols = Math.max(1, (b.cab.length || (b.linhas[0] || []).length)), rh = 34, linhas = (b.cab.length ? [b.cab] : []).concat(b.linhas);
            const tw = 1136, cw = Math.floor((tw * EMU) / cols);
            const cel = (c, cab_, j) => `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:pPr algn="${j ? "r" : "l"}"/>${c ? `<a:r>${rPr({ sz: 12, b: cab_, cor: cab_ ? COR.sub : COR.txt })}<a:t>${xml(c)}</a:t></a:r>` : ""}<a:endParaRPr lang="${lang}" sz="1200" dirty="0"/></a:p></a:txBody><a:tcPr marL="68580" marR="68580" marT="34290" marB="34290" anchor="ctr"><a:lnL><a:noFill/></a:lnL><a:lnR><a:noFill/></a:lnR><a:lnT><a:noFill/></a:lnT><a:lnB w="6350"><a:solidFill><a:srgbClr val="${COR.linha}"/></a:solidFill></a:lnB><a:solidFill><a:srgbClr val="${cab_ ? COR.cartao : COR.fundo}"/></a:solidFill></a:tcPr></a:tc>`;
            const i = id++;
            shapes.push(`<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${i}" name="Tabela ${i}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${72 * EMU}" y="${Math.round(y * EMU)}"/><a:ext cx="${cw * cols}" cy="${Math.round(linhas.length * rh * EMU)}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="${b.cab.length ? 1 : 0}" bandRow="0"/><a:tblGrid>${Array.from({ length: cols }, () => `<a:gridCol w="${cw}"/>`).join("")}</a:tblGrid>${linhas.map((l, li) => `<a:tr h="${Math.round(rh * EMU)}">${Array.from({ length: cols }, (_, j) => cel(l[j] || "", li === 0 && b.cab.length > 0, j)).join("")}</a:tr>`).join("")}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`);
            y += linhas.length * rh + 12;
          } else if (b.t === "lista") {
            const alt = Math.min(resta(), b.itens.length * 32 + 6);
            caixa(72, y, 1136, alt, b.itens.map((rs, j) => par(rs.map((r) => ({ txt: r.txt, b: r.b, href: r.href, sz: 15, cor: r.cor && COR[r.cor] ? COR[r.cor] : COR.txt })), { bullet: b.ord ? `${(b.ini || 0) + j + 1}.` : "•" })));
            y += alt + 8;
          } else if (b.t === "chips") {
            caixa(72, y, 1136, 34, [par(b.itens.flatMap((c) => [{ txt: "● ", sz: 14, cor: COR[c.cor] || COR.txt }, { txt: c.txt + "    ", sz: 14, b: true, cor: COR[c.cor] || COR.txt }]))]); y += 42;
          } else if (b.t === "img") {
            const maxW = 1136, maxH = resta(), k_ = Math.min(maxW / b.png.w, maxH / b.png.h), w = b.png.w * k_, h = b.png.h * k_;
            imagem(b.png, 72 + (maxW - w) / 2, y, w, h, b.alt); y += h + 8;
          } else if (b.t === "code") {
            const alt = Math.min(resta(), b.txt.split("\n").length * 20 + 16);
            caixa(72, y, 1136, alt, b.txt.split("\n").map((ln) => `<a:p><a:r><a:rPr lang="${lang}" sz="1100" dirty="0"><a:solidFill><a:srgbClr val="CFE8D8"/></a:solidFill><a:latin typeface="Consolas"/></a:rPr><a:t>${xml(ln) || " "}</a:t></a:r></a:p>`), { fill: "0A140E", pad: true });
            y += alt + 8;
          }
        });
        rodape();
      }
      // barras entram da esquerda para a direita, uma depois da outra, sozinhas ao abrir o slide
      let tid = 4;
      const timing = barras.length ? `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst><p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst><p:par><p:cTn id="${tid++}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${barras.map((sp, j) => {
        const a = tid++, b2 = tid++, c = tid++;
        return `<p:par><p:cTn id="${a}" presetID="22" presetClass="entr" presetSubtype="8" fill="hold" grpId="0" nodeType="withEffect"><p:stCondLst><p:cond delay="${j * 120}"/></p:stCondLst><p:childTnLst><p:set><p:cBhvr><p:cTn id="${b2}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${sp}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set><p:animEffect transition="in" filter="wipe(left)"><p:cBhvr><p:cTn id="${c}" dur="700"/><p:tgtEl><p:spTgt spid="${sp}"/></p:tgtEl></p:cBhvr></p:animEffect></p:childTnLst></p:cTn></p:par>`;
      }).join("")}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst><p:bldLst>${barras.map((sp) => `<p:bldP spid="${sp}" grpId="0" animBg="1"/>`).join("")}</p:bldLst></p:timing>` : "";
      const corpo = `${XML_HEAD}<p:sld ${NS_P}><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${COR.fundo}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes.join("")}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${timing}</p:sld>`;
      const relsXml = `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.map((r) => `<Relationship Id="${r.id}" Type="${r.tipo}" Target="${xml(r.alvo)}"${r.ext ? ' TargetMode="External"' : ""}/>`).join("")}</Relationships>`;
      return { corpo, relsXml };
    });
    const n = slidesXml.length;
    arquivos.push({ nome: "[Content_Types].xml", dados: `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>${slidesXml.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>` });
    arquivos.push({ nome: "_rels/.rels", dados: relsPacote("ppt/presentation.xml") });
    arquivos.push(...props(M, "Microsoft Office PowerPoint"));
    arquivos.push({ nome: "ppt/presentation.xml", dados: `${XML_HEAD}<p:presentation ${NS_P} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slidesXml.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("")}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:defaultTextStyle></p:presentation>` });
    arquivos.push({ nome: "ppt/_rels/presentation.xml.rels", dados: `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slidesXml.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join("")}<Relationship Id="rId${n + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/><Relationship Id="rId${n + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/><Relationship Id="rId${n + 4}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/><Relationship Id="rId${n + 5}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/></Relationships>` });
    arquivos.push({ nome: "ppt/presProps.xml", dados: `${XML_HEAD}<p:presentationPr ${NS_P}/>` });
    arquivos.push({ nome: "ppt/viewProps.xml", dados: `${XML_HEAD}<p:viewPr ${NS_P}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>` });
    arquivos.push({ nome: "ppt/tableStyles.xml", dados: `${XML_HEAD}<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>` });
    const grupoVazio = `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`;
    arquivos.push({ nome: "ppt/slideMasters/slideMaster1.xml", dados: `${XML_HEAD}<p:sldMaster ${NS_P}><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${COR.fundo}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>${grupoVazio}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="3200"/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>` });
    arquivos.push({ nome: "ppt/slideMasters/_rels/slideMaster1.xml.rels", dados: `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>` });
    arquivos.push({ nome: "ppt/slideLayouts/slideLayout1.xml", dados: `${XML_HEAD}<p:sldLayout ${NS_P} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${grupoVazio}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>` });
    arquivos.push({ nome: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", dados: `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>` });
    arquivos.push({ nome: "ppt/theme/theme1.xml", dados: tema() });
    slidesXml.forEach((s, i) => { arquivos.push({ nome: `ppt/slides/slide${i + 1}.xml`, dados: s.corpo }, { nome: `ppt/slides/_rels/slide${i + 1}.xml.rels`, dados: s.relsXml }); });
    arquivos.push(...media);
    return zip(arquivos, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  }
  function tema() {
    const cor = (n, v) => `<a:${n}><a:srgbClr val="${v}"/></a:${n}>`;
    const fill = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>';
    return `${XML_HEAD}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Auditoria BU 2026"><a:themeElements><a:clrScheme name="BU2026"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>${cor("dk2", "07130C")}${cor("lt2", "EEF6F0")}${cor("accent1", "1FC35F")}${cor("accent2", "FFD400")}${cor("accent3", "002776")}${cor("accent4", "FF8A3D")}${cor("accent5", "3DDC84")}${cor("accent6", "A8BFB0")}${cor("hlink", "FFD400")}${cor("folHlink", "E0C341")}</a:clrScheme>`
      + `<a:fontScheme name="BU2026"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>`
      + `<a:fmtScheme name="BU2026"><a:fillStyleLst>${fill}${fill}${fill}</a:fillStyleLst><a:lnStyleLst>${[6350, 12700, 19050].map((w) => `<a:ln w="${w}"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>`).join("")}</a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst>${fill}${fill}${fill}</a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;
  }
  const relsPacote = (principal) => `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="${principal}"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
  function props(M, app) {
    const agora = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    return [{ nome: "docProps/core.xml", dados: `${XML_HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(M.meta.titulo)}</dc:title><dc:subject>${xml(t().badge)}</dc:subject><dc:creator>${xml(t().brand)}</dc:creator><dc:description>${xml(M.meta.url || URL_SITE)}</dc:description><dcterms:created xsi:type="dcterms:W3CDTF">${agora}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${agora}</dcterms:modified></cp:coreProperties>` },
      { nome: "docProps/app.xml", dados: `${XML_HEAD}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>${app}</Application></Properties>` }];
  }

  // --- 3) Word (.docx) -----------------------------------------------------------------------------------------------------
  async function docx(M) {
    await prepararImagens(M);
    const L = t(), X = E(), rels = [], media = [];
    const rel = (tipo, alvo, ext) => { const r = "rId" + (rels.length + 10); rels.push({ id: r, tipo, alvo, ext }); return r; };
    const run = (r, o) => {
      o = o || {};
      const pr = `<w:rPr>${o.estilo ? `<w:rStyle w:val="${o.estilo}"/>` : ""}${r.mono ? '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>' : ""}${r.b ? "<w:b/>" : ""}${r.i ? "<w:i/>" : ""}${r.cor ? `<w:color w:val="${r.cor}"/>` : ""}${r.sz ? `<w:sz w:val="${r.sz * 2}"/>` : ""}</w:rPr>`;
      return String(r.txt).split("\n").map((s, i) => `<w:r>${pr}${i ? "<w:br/>" : ""}<w:t xml:space="preserve">${xml(s)}</w:t></w:r>`).join("");
    };
    const COR_W = { red: "C62828", amber: "B26A00", green: "1B7F3A" };
    const runs = (rs, o) => rs.map((r) => {
      if (r.href) return `<w:hyperlink r:id="${rel("http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", r.href, true)}" w:history="1">${run(r, { estilo: "Hyperlink" })}</w:hyperlink>`;
      if (r.cor) return run({ txt: (/^q/.test(r.cor) ? "■ " : "● ") + r.txt + (/^q/.test(r.cor) ? "" : "  "), b: !/^q/.test(r.cor), cor: COR_W[r.cor] || "1B7F3A" });
      return run(Object.assign({}, r, o || {}));
    }).join("");
    const p = (conteudo, estilo, extra) => `<w:p>${estilo || extra ? `<w:pPr>${estilo ? `<w:pStyle w:val="${estilo}"/>` : ""}${extra || ""}</w:pPr>` : ""}${conteudo}</w:p>`;
    const LARG = 9638; // largura útil (twips) com margens de 2 cm
    function tabelaW(cab, linhas, opts) {
      const cols = Math.max(cab.length, ...linhas.map((l) => l.length), 1), w = Math.floor(LARG / cols);
      const larguras = (opts && opts.larg) || Array.from({ length: cols }, () => w);
      const cel = (c, cab_, j) => `<w:tc><w:tcPr><w:tcW w:w="${larguras[j]}" w:type="dxa"/>${cab_ ? '<w:shd w:val="clear" w:color="auto" w:fill="E8F5EC"/>' : ""}</w:tcPr><w:p><w:pPr><w:spacing w:before="20" w:after="20"/>${j && !(opts && opts.esq) ? '<w:jc w:val="right"/>' : ""}</w:pPr>${c && c.xml ? c.xml : run({ txt: String(c), b: cab_, sz: 9 })}</w:p></w:tc>`;
      return `<w:tbl><w:tblPr><w:tblStyle w:val="TabelaBU"/><w:tblW w:w="${LARG}" w:type="dxa"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr><w:tblGrid>${larguras.map((x) => `<w:gridCol w:w="${x}"/>`).join("")}</w:tblGrid>`
        + (cab.length ? `<w:tr><w:trPr><w:tblHeader/></w:trPr>${Array.from({ length: cols }, (_, j) => cel(cab[j] || "", true, j)).join("")}</w:tr>` : "")
        + linhas.map((l) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${Array.from({ length: cols }, (_, j) => cel(l[j] == null ? "" : l[j], false, j)).join("")}</w:tr>`).join("") + "</w:tbl>" + p("", null, '<w:spacing w:after="60"/>');
    }
    let corpo = "", img = 0;
    const figura = (png, alt, maxCm) => {
      img++;
      const n = media.length + 1; media.push({ nome: `word/media/image${n}.png`, dados: bytes(png.url) });
      const r = rel("http://schemas.openxmlformats.org/officeDocument/2006/relationships/image", `media/image${n}.png`);
      const cx = Math.round((maxCm || 16.5) * 360000), cy = Math.round((cx * png.h) / png.w);
      return p(`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${img}" name="Imagem ${img}" descr="${xml(alt || "")}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${img}" name="image${n}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${r}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`, null, '<w:jc w:val="center"/>');
    };
    // capa
    corpo += p(run({ txt: (M.meta.kicker || L.brand).toUpperCase(), b: true, cor: "1B7F3A", sz: 9 }));
    corpo += p(run({ txt: M.meta.titulo }), "Title");
    if (M.meta.sub) corpo += p(run({ txt: M.meta.sub }), "Subtitle");
    corpo += p(run({ txt: X.made(M.meta.quando), cor: "666666", sz: 9 }) + (M.meta.url ? run({ txt: " · ", cor: "666666", sz: 9 }) + runs([{ txt: M.meta.url.replace(/^https:\/\//, ""), href: M.meta.url }]) : ""));
    corpo += p(run({ txt: L.badge, b: true, cor: "8A6D00", sz: 10 }), null, '<w:shd w:val="clear" w:color="auto" w:fill="FFF6CC"/><w:spacing w:after="240"/>');
    M.blocos.forEach((b) => {
      if (b.t === "quem") corpo += p(run({ txt: b.eu ? `${X.you}: ${b.txt}` : b.txt, b: true, cor: b.eu ? "1B7F3A" : "333333" }), b.eu ? "Heading1" : null);
      else if (b.t === "kicker") corpo += p(run({ txt: b.txt.toUpperCase(), b: true, cor: "1B7F3A", sz: 9 }));
      else if (b.t === "h") corpo += p(b.href ? runs([{ txt: b.txt, href: b.href }]) : run({ txt: b.txt }), `Heading${Math.min(3, b.n)}`) + (b.sub ? p(run({ txt: b.sub, cor: "666666" })) : "");
      else if (b.t === "p") corpo += p(runs(b.runs));
      else if (b.t === "nota") corpo += p(run({ txt: b.txt, i: true, cor: b.cor ? "C62828" : "666666", sz: 9 }));
      else if (b.t === "fonte") corpo += p(run({ txt: b.txt, cor: "666666", sz: 8 }));
      else if (b.t === "kv") corpo += tabelaW([], b.itens.map(([k, v]) => [{ xml: run({ txt: k, cor: "555555", sz: 9 }) }, { xml: run({ txt: v, b: true, sz: 10 }) }]), { larg: [5200, LARG - 5200] });
      else if (b.t === "bars") corpo += tabelaW([], b.itens.map((x) => [{ xml: run({ txt: x.rot, sz: 9 }) }, { xml: run({ txt: x.txt, b: true, sz: 9 }) }, { xml: run({ txt: "█".repeat(Math.max(1, Math.round(Math.max(0, Math.min(1, x.f)) * 24))), cor: "1FC35F", sz: 9 }) }]), { larg: [3600, 2400, LARG - 6000], esq: true });
      else if (b.t === "tab") corpo += tabelaW(b.cab, b.linhas);
      else if (b.t === "lista") corpo += b.itens.map((rs, j) => p(run({ txt: b.ord ? `${(b.ini || 0) + j + 1}. ` : "• " }) + runs(rs), null, '<w:ind w:left="360" w:hanging="240"/><w:spacing w:after="40"/>')).join("");
      else if (b.t === "chips") corpo += p(runs(b.itens.map((c) => ({ txt: c.txt, cor: c.cor }))));
      else if (b.t === "img") corpo += figura(b.png, b.alt);
      else if (b.t === "code") corpo += b.txt.split("\n").map((ln) => p(run({ txt: ln || " ", mono: true, sz: 8 }), "Codigo")).join("");
    });
    corpo += p(run({ txt: L.at.sg_note, i: true, cor: "666666", sz: 9 }), null, '<w:spacing w:before="240"/>');
    if (M.qr) corpo += figura(M.qr, "QR Code", 3.2) + p(run({ txt: X.open, cor: "666666", sz: 8 }), null, '<w:jc w:val="center"/>');
    const ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
    const doc = `${XML_HEAD}<w:document ${ns}><w:body>${corpo}<w:sectPr><w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const rodape = `${XML_HEAD}<w:ftr ${ns}><w:p><w:pPr><w:jc w:val="center"/></w:pPr>${run({ txt: `${L.badge} · ${URL_SITE.replace(/^https:\/\/|\/$/g, "")} · `, cor: "777777", sz: 8 })}<w:r><w:rPr><w:color w:val="777777"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:color w:val="777777"/><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:color w:val="777777"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:color w:val="777777"/><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:color w:val="777777"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
    const estilos = `${XML_HEAD}<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="${{ PT: "pt-BR", EN: "en-US", ES: "es-ES" }[A.state.lang]}"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>`
      + `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>`
      + `<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="0B2A17"/><w:sz w:val="48"/></w:rPr></w:style>`
      + `<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:color w:val="555555"/><w:sz w:val="26"/></w:rPr></w:style>`
      + [1, 2, 3].map((n) => `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="${n === 1 ? 360 : 240}" w:after="100"/><w:outlineLvl w:val="${n - 1}"/></w:pPr><w:rPr><w:b/><w:color w:val="${n === 3 ? "1B7F3A" : "0B2A17"}"/><w:sz w:val="${[0, 34, 28, 24][n]}"/></w:rPr></w:style>`).join("")
      + `<w:style w:type="paragraph" w:styleId="Codigo"><w:name w:val="Codigo"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0"/><w:shd w:val="clear" w:color="auto" w:fill="F2F5F3"/></w:pPr></w:style>`
      + `<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="006B2E"/><w:u w:val="single"/></w:rPr></w:style>`
      + `<w:style w:type="table" w:styleId="TabelaBU"><w:name w:val="Tabela BU"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="C9D6CE"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="C9D6CE"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E1E8E4"/></w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;
    const arquivos = [
      { nome: "[Content_Types].xml", dados: `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>` },
      { nome: "_rels/.rels", dados: relsPacote("word/document.xml") },
      ...props(M, "Microsoft Office Word"),
      { nome: "word/document.xml", dados: doc },
      { nome: "word/styles.xml", dados: estilos },
      { nome: "word/settings.xml", dados: `${XML_HEAD}<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="708"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>` },
      { nome: "word/footer1.xml", dados: rodape },
      { nome: "word/_rels/document.xml.rels", dados: `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${rels.map((r) => `<Relationship Id="${r.id}" Type="${r.tipo}" Target="${xml(r.alvo)}"${r.ext ? ' TargetMode="External"' : ""}/>`).join("")}</Relationships>` },
      ...media,
    ];
    return zip(arquivos, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }

  // --- 4) Excel (.xlsx): "Resumo" com o texto e os números; uma aba por tabela e por gráfico -----------------------------
  function xlsx(M) {
    const L = t(), X = E();
    const abas = [];
    const nomes = new Set();
    const nomeAba = (s) => { let n = String(s || X.sheet_tab).replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 28) || X.sheet_tab; let k = n, i = 2; while (nomes.has(k.toLowerCase())) k = `${n.slice(0, 26)} ${i++}`; nomes.add(k.toLowerCase()); return k; };
    // célula: texto, número (com formato) ou fórmula de link
    const cel = (v, s) => {
      if (v && typeof v === "object" && v.f) return { f: v.f, txt: v.txt, s: s || 0 };
      const n = typeof v === "number" ? { v } : numero(v);
      if (n) return { n: n.v, s: s || (n.pct ? 3 : Number.isInteger(n.v) && !n.dec ? 2 : 6) };
      return { txt: v == null ? "" : String(v), s: s || 0 };
    };
    const resumo = { nome: nomeAba(X.sheet_resumo), linhas: [], larg: [46, 40, 20, 20] };
    resumo.linhas.push([cel(M.meta.titulo, 4)], [cel(M.meta.sub || "", 5)], [cel(X.made(M.meta.quando), 5)], [M.meta.url ? { f: `HYPERLINK("${M.meta.url.replace(/"/g, '""')}","${M.meta.url.replace(/^https:\/\//, "").replace(/"/g, '""')}")`, txt: M.meta.url, s: 8 } : cel("")], [cel(L.badge, 7)], []);
    let tit = M.meta.titulo;
    M.blocos.forEach((b) => {
      if (b.t === "h" || b.t === "quem") { tit = b.txt; resumo.linhas.push([], [cel(b.eu ? `${X.you}: ${b.txt}` : b.txt, 7)]); }
      else if (b.t === "p") resumo.linhas.push([cel(textoTrechos(b.runs), 0)]);
      else if (b.t === "nota" || b.t === "fonte") resumo.linhas.push([cel(b.txt, 5)]);
      else if (b.t === "kv") b.itens.forEach(([k, v]) => resumo.linhas.push([cel(k)].concat(partes(v).map((x) => cel(x)))));
      else if (b.t === "lista") b.itens.forEach((rs) => resumo.linhas.push([cel("• " + textoTrechos(rs))]));
      else if (b.t === "chips") resumo.linhas.push(b.itens.map((c) => cel(c.txt)));
      else if (b.t === "bars") {
        const n = Math.max(...b.itens.map((x) => partes(x.txt).length));
        abas.push({ nome: nomeAba(`${X.sheet_graf} · ${tit}`), cab: [X.th_item].concat(Array.from({ length: n }, (_, i) => (i ? `${X.th_valor} ${i + 1}` : X.th_valor))),
          linhas: b.itens.map((x) => [cel(x.rot)].concat(partes(x.txt).map((v) => cel(v)))) });
        resumo.linhas.push([cel(`→ ${abas[abas.length - 1].nome}`, 5)]);
      } else if (b.t === "tab") {
        abas.push({ nome: nomeAba(tit), cab: b.cab, linhas: b.linhas.map((l) => l.map((v) => cel(v))) });
        resumo.linhas.push([cel(`→ ${abas[abas.length - 1].nome}`, 5)]);
      } else if (b.t === "img") resumo.linhas.push([cel(`(${X.img_note})`, 5)]);
    });
    const col = (i) => { let s = ""; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
    const linhaXml = (cs, r) => `<row r="${r}">${cs.map((c, j) => { const ref = col(j) + r; if (!c) return ""; if (c.f) return `<c r="${ref}" t="str" s="${c.s}"><f>${xml(c.f)}</f><v>${xml(c.txt)}</v></c>`; if (c.n != null) return `<c r="${ref}" s="${c.s}"><v>${c.n}</v></c>`; return c.txt ? `<c r="${ref}" t="inlineStr" s="${c.s}"><is><t xml:space="preserve">${xml(c.txt)}</t></is></c>` : ""; }).join("")}</row>`;
    const folhas = [];
    folhas.push(`${XML_HEAD}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${resumo.larg.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${resumo.linhas.map((l, i) => linhaXml(l, i + 1)).join("")}</sheetData><pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`);
    const filtros = [];
    abas.forEach((a, k) => {
      const ncol = Math.max(a.cab.length, ...a.linhas.map((l) => l.length), 1);
      const larg = Array.from({ length: ncol }, (_, j) => Math.min(60, Math.max(10, ...[a.cab[j] || ""].concat(a.linhas.map((l) => (l[j] ? (l[j].txt != null ? l[j].txt : String(l[j].n)) : ""))).map((s) => String(s).length + 2))));
      const temCab = a.cab.length > 0, ult = a.linhas.length + (temCab ? 1 : 0);
      if (temCab && a.linhas.length) filtros.push({ aba: k + 1, ref: `'${a.nome.replace(/'/g, "''")}'!$A$1:$${col(ncol - 1)}$${ult}` });
      folhas.push(`${XML_HEAD}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:${col(ncol - 1)}${Math.max(1, ult)}"/><sheetViews><sheetView workbookViewId="0">${temCab ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/>' : ""}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${larg.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${(temCab ? [linhaXml(a.cab.map((c) => ({ txt: c, s: 1 })), 1)] : []).concat(a.linhas.map((l, i) => linhaXml(l, i + 1 + (temCab ? 1 : 0)))).join("")}</sheetData>${temCab && a.linhas.length ? `<autoFilter ref="A1:${col(ncol - 1)}${ult}"/>` : ""}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`);
    });
    const todas = [resumo].concat(abas);
    const estilos = `${XML_HEAD}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="0.00%"/><numFmt numFmtId="166" formatCode="#,##0.00"/></numFmts>`
      + `<fonts count="6"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="15"/><color rgb="FF0B2A17"/><name val="Calibri"/><family val="2"/></font><font><i/><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/><family val="2"/></font><font><u/><sz val="11"/><color rgb="FF006B2E"/><name val="Calibri"/><family val="2"/></font></fonts>`
      + `<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1B7F3A"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF6CC"/><bgColor indexed="64"/></patternFill></fill></fills>`
      + `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
      + `<cellXfs count="9"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>`
      + `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    const arquivos = [
      { nome: "[Content_Types].xml", dados: `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${todas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>` },
      { nome: "_rels/.rels", dados: relsPacote("xl/workbook.xml") },
      ...props(M, "Microsoft Excel"),
      { nome: "xl/workbook.xml", dados: `${XML_HEAD}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${todas.map((a, i) => `<sheet name="${xml(a.nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>${filtros.length ? `<definedNames>${filtros.map((f) => `<definedName name="_xlnm._FilterDatabase" localSheetId="${f.aba}" hidden="1">${xml(f.ref)}</definedName>`).join("")}</definedNames>` : ""}</workbook>` },
      { nome: "xl/_rels/workbook.xml.rels", dados: `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${todas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${todas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { nome: "xl/styles.xml", dados: estilos },
      ...folhas.map((f, i) => ({ nome: `xl/worksheets/sheet${i + 1}.xml`, dados: f })),
    ];
    return zip(arquivos, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  // --- 5) CSV, texto, Markdown e JSON --------------------------------------------------------------------------------------
  const q2 = (x) => `"${String(x == null ? "" : x).replace(/"/g, '""')}"`;
  function csv(M) {
    const L = t(), X = E(), out = [[M.meta.titulo], [M.meta.sub || ""], [X.made(M.meta.quando)], [M.meta.url || URL_SITE], [L.badge], []];
    M.blocos.forEach((b) => {
      if (b.t === "h" || b.t === "quem") out.push([], [b.eu ? `${X.you}: ${b.txt}` : b.txt]);
      else if (b.t === "p") out.push([textoTrechos(b.runs)]);
      else if (b.t === "nota" || b.t === "fonte" || b.t === "kicker") out.push([b.txt]);
      else if (b.t === "kv") b.itens.forEach(([k, v]) => out.push([k, v]));
      else if (b.t === "bars") b.itens.forEach((x) => out.push([x.rot].concat(partes(x.txt))));
      else if (b.t === "tab") { out.push([]); if (b.cab.length) out.push(b.cab); b.linhas.forEach((l) => out.push(l)); out.push([]); }
      else if (b.t === "lista") b.itens.forEach((rs) => out.push(["• " + textoTrechos(rs)]));
      else if (b.t === "chips") out.push(b.itens.map((c) => c.txt));
    });
    return "\ufeff" + out.map((l) => l.map(q2).join(";")).join("\r\n");
  }
  function texto(M) {
    const L = t(), X = E(), out = [];
    const sub = (s, c) => s + "\n" + c.repeat(Math.min(80, Math.max(3, s.length)));
    out.push(sub(M.meta.titulo, "="));
    if (M.meta.sub) out.push(M.meta.sub);
    out.push(X.made(M.meta.quando), M.meta.url || URL_SITE, L.badge, "");
    M.blocos.forEach((b) => {
      if (b.t === "quem") out.push("", b.eu ? `>> ${X.you}: ${b.txt}` : `${b.txt}:`);
      else if (b.t === "h") out.push("", b.n <= 2 ? sub(b.txt, "-") : `# ${b.txt}`, b.sub || "");
      else if (b.t === "kicker") out.push(b.txt.toUpperCase());
      else if (b.t === "p") out.push(textoTrechos(b.runs).replace(/\n/g, " ") + (b.runs.some((r) => r.href) ? "  (" + b.runs.filter((r) => r.href).map((r) => r.href).join(" ") + ")" : ""));
      else if (b.t === "nota" || b.t === "fonte") out.push(b.txt);
      else if (b.t === "kv") { const w = Math.min(44, Math.max(...b.itens.map(([k]) => k.length))); b.itens.forEach(([k, v]) => out.push(`${(k + ":").padEnd(w + 2)}${v}`)); }
      else if (b.t === "bars") { const w = Math.min(40, Math.max(...b.itens.map((x) => x.rot.length))); b.itens.forEach((x) => out.push(`${x.rot.padEnd(w + 1).slice(0, w + 1)} ${"█".repeat(Math.max(1, Math.round(Math.max(0, Math.min(1, x.f)) * 20))).padEnd(20)} ${x.txt}`)); }
      else if (b.t === "tab") {
        const ls = (b.cab.length ? [b.cab] : []).concat(b.linhas), n = Math.max(...ls.map((l) => l.length));
        const w = Array.from({ length: n }, (_, j) => Math.min(40, Math.max(...ls.map((l) => String(l[j] || "").length))));
        ls.forEach((l, i) => { out.push(Array.from({ length: n }, (_, j) => String(l[j] || "").slice(0, 40).padEnd(w[j])).join(" | ").trimEnd()); if (i === 0 && b.cab.length) out.push(w.map((x) => "-".repeat(x)).join("-+-")); });
      } else if (b.t === "lista") b.itens.forEach((rs, j) => out.push(`${b.ord ? `${(b.ini || 0) + j + 1}.` : "•"} ${textoTrechos(rs)}`));
      else if (b.t === "chips") out.push(b.itens.map((c) => `[${c.txt}]`).join(" "));
      else if (b.t === "img") out.push(`[${X.img_note}${b.alt ? ": " + b.alt : ""}]`);
      else if (b.t === "code") out.push(b.txt);
    });
    out.push("", "—", L.at.sg_note, L.badge, M.meta.url || URL_SITE);
    return out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
  }
  function markdown(M) {
    const L = t(), X = E(), out = [];
    const md = (s) => String(s).replace(/([\\`*_[\]|<>])/g, "\\$1");
    const runsMd = (rs) => rs.map((r) => { if (r.cor) return `${{ red: "🔴", amber: "🟡", green: "🟢" }[r.cor] || "■"} ${md(r.txt)}`; const s = r.b ? `**${md(r.txt)}**` : md(r.txt); return r.href ? `[${s}](${r.href})` : s; }).join("").replace(/\n/g, "  \n");
    const tab = (cab, ls) => { const n = Math.max(cab.length, ...ls.map((l) => l.length)); const c = cab.length ? cab : Array.from({ length: n }, (_, i) => (i ? " " : X.th_item)); out.push("", `| ${Array.from({ length: n }, (_, j) => md(c[j] || "")).join(" | ")} |`, `|${Array.from({ length: n }, (_, j) => (j ? " ---: " : " --- ")).join("|")}|`); ls.forEach((l) => out.push(`| ${Array.from({ length: n }, (_, j) => md(l[j] == null ? "" : l[j])).join(" | ")} |`)); out.push(""); };
    out.push(`# ${md(M.meta.titulo)}`, "");
    if (M.meta.sub) out.push(`*${md(M.meta.sub)}*`, "");
    out.push(`> **${md(L.badge)}**  `, `> ${md(X.made(M.meta.quando))} · [${md((M.meta.url || URL_SITE).replace(/^https:\/\//, ""))}](${M.meta.url || URL_SITE})`, "");
    M.blocos.forEach((b) => {
      if (b.t === "quem") out.push("", b.eu ? `### ${X.you}: ${md(b.txt)}` : `**${md(b.txt)}:**`, "");
      else if (b.t === "h") out.push("", `${"#".repeat(Math.min(4, b.n + 1))} ${b.href ? `[${md(b.txt)}](${b.href})` : md(b.txt)}`, b.sub ? `*${md(b.sub)}*` : "", "");
      else if (b.t === "kicker") out.push(`**${md(b.txt.toUpperCase())}**`, "");
      else if (b.t === "p") out.push(runsMd(b.runs), "");
      else if (b.t === "nota") out.push(`> ${md(b.txt)}`, "");
      else if (b.t === "fonte") out.push(`<sub>${md(b.txt)}</sub>`, "");
      else if (b.t === "kv") tab([X.th_item, X.th_valor], b.itens);
      else if (b.t === "bars") tab([X.th_item, X.th_valor, ""], b.itens.map((x) => [x.rot, x.txt, "█".repeat(Math.max(1, Math.round(Math.max(0, Math.min(1, x.f)) * 16)))]));
      else if (b.t === "tab") tab(b.cab, b.linhas);
      else if (b.t === "lista") { b.itens.forEach((rs, j) => out.push(`${b.ord ? `${(b.ini || 0) + j + 1}.` : "-"} ${runsMd(rs)}`)); out.push(""); }
      else if (b.t === "chips") out.push(b.itens.map((c) => `${{ red: "🔴", amber: "🟡", green: "🟢" }[c.cor] || "•"} ${md(c.txt)}`).join(" · "), "");
      else if (b.t === "img") out.push(`*(${md(X.img_note)}${b.alt ? ": " + md(b.alt) : ""} — [${md((M.meta.url || URL_SITE).replace(/^https:\/\//, ""))}](${M.meta.url || URL_SITE}))*`, "");
      else if (b.t === "code") out.push("```", b.txt, "```", "");
    });
    out.push("---", "", `*${md(L.at.sg_note)}*`, "", `**${md(L.badge)}** · [${md(URL_SITE.replace(/^https:\/\/|\/$/g, ""))}](${URL_SITE})`);
    return out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
  }
  function json(M) {
    const L = t();
    const blocos = M.blocos.map((b) => {
      const o = Object.assign({}, b); delete o.el; delete o.png; delete o.src;
      if (b.t === "p") { o.texto = textoTrechos(b.runs); const ls = b.runs.filter((r) => r.href).map((r) => r.href); if (ls.length) o.links = ls; delete o.runs; }
      if (b.t === "lista") { o.itens = b.itens.map(textoTrechos); }
      if (b.t === "kv") o.itens = b.itens.map(([k, v]) => ({ item: k, valor: v, numero: numero(partes(v)[0]) ? numero(partes(v)[0]).v : null }));
      if (b.t === "bars") o.itens = b.itens.map((x) => ({ item: x.rot, valor: x.txt, numero: numero(partes(x.txt)[0]) ? numero(partes(x.txt)[0]).v : null, fracao: +x.f.toFixed(4) }));
      if (b.t === "tab" && b.cab.length) o.registros = b.linhas.map((l) => Object.fromEntries(b.cab.map((c, j) => [c || `col${j + 1}`, l[j] == null ? "" : l[j]])));
      if (b.t === "img") o.descricao = b.alt || "";
      return o;
    });
    return JSON.stringify({ fonte: "paranacontraoscorruptos.org", aviso: L.badge, nota: L.at.sg_note, titulo: M.meta.titulo, subtitulo: M.meta.sub || "", url: M.meta.url || URL_SITE,
      gerado_em: new Date().toISOString(), idioma: A.state.lang, blocos }, null, 2);
  }

  // --- 6) imagem longa (.png): tudo numa imagem vertical, no visual dos cartões -------------------------------------------
  const F_DISP = '"Space Grotesk", system-ui, sans-serif', F_SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", F_MONO = "ui-monospace, Menlo, Consolas, monospace";
  const MAX_ALTURA = 14000;
  const CHIP = { red: ["rgba(239,68,68,.22)", "#ff6b6b"], amber: ["rgba(245,180,0,.2)", "#ffc83d"], green: ["rgba(31,195,95,.2)", "#3ddc84"] };
  const SEQ = { q0: "#1c2b44", q1: "#24457e", q2: "#2f63bb", q3: "#5689e8", q4: "#a4c3f7" };
  function quebrar(ctx, s, larg) {
    const out = [];
    String(s).split("\n").forEach((par_) => {
      let at = "";
      par_.split(" ").forEach((p) => {
        const x = at ? at + " " + p : p;
        if (ctx.measureText(x).width <= larg || !at && ctx.measureText(p).width <= larg) { at = x; return; }
        if (at) out.push(at);
        // palavra mais larga que a linha (hash, endereço): quebra por letra
        at = "";
        for (const c of p) { if (at && ctx.measureText(at + c).width > larg) { out.push(at); at = c; } else at += c; }
      });
      out.push(at);
    });
    return out;
  }
  function cortar(ctx, s, larg) { s = String(s); if (ctx.measureText(s).width <= larg) return s; while (s.length > 1 && ctx.measureText(s + "…").width > larg) s = s.slice(0, -1); return s + "…"; }
  async function carregarFontes() { try { await Promise.all([document.fonts.load(`700 52px ${F_DISP}`), document.fonts.load(`600 30px ${F_DISP}`)]); } catch (e) { /* fonte do sistema */ } }
  // Imagens e QR Code decodificados antes de desenhar no canvas
  async function decodificar(M) {
    await Promise.all(M.blocos.filter((b) => b.t === "img").map(async (b) => { const im = new Image(); im.src = b.png.url; try { await im.decode(); b._im = im; } catch (e) { b._im = null; } }));
    if (M.qr) { const im = new Image(); im.src = M.qr.url; try { await im.decode(); M._qrIm = im; } catch (e) { M._qrIm = null; } }
  }
  function fundoSlide(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#07130c"); g.addColorStop(1, "#0c1a12"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const rg = ctx.createRadialGradient(w * 0.9, 0, 10, w * 0.9, 0, 700); rg.addColorStop(0, "rgba(255,212,0,.16)"); rg.addColorStop(1, "rgba(255,212,0,0)"); ctx.fillStyle = rg; ctx.fillRect(0, 0, w, Math.min(h, 900));
    const rg2 = ctx.createRadialGradient(0, Math.min(h, 1400) * 0.2, 10, 0, Math.min(h, 1400) * 0.2, 760); rg2.addColorStop(0, "rgba(0,156,59,.2)"); rg2.addColorStop(1, "rgba(0,156,59,0)"); ctx.fillStyle = rg2; ctx.fillRect(0, 0, w, Math.min(h, 1400));
    ctx.strokeStyle = "rgba(255,255,255,.035)"; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
    const fx = ctx.createLinearGradient(0, 0, w, 0); fx.addColorStop(0, "#009c3b"); fx.addColorStop(0.5, "#ffdf00"); fx.addColorStop(1, "#002776"); ctx.fillStyle = fx; ctx.fillRect(0, 0, w, 14); ctx.fillRect(0, h - 14, w, 14);
  }
  // Números contando de 0 até o valor (e de 0 a 1), no vídeo do carrossel
  const contar = (s, e) => (e >= 1 || !contavel(String(s)) || !A.ferramentas ? String(s) : A.ferramentas.contarTexto(s, e));
  // Desenha um bloco a partir de y (ou só mede, com medir) e devolve onde o próximo começa.
  // ani (vídeo do carrossel): ani(j) → [aparece, cresce], de 0 a 1, para a parte j do bloco (item, linha, barra)
  function pintarBloco(ctx, b, y, medir, PAD, LW, ani) {
    if (ani && !medir && !/^(kv|bars|tab|lista|chips)$/.test(b.t)) {
      // bloco inteiro: aparece subindo
      const [a] = ani(0);
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, (1 - a) * 26);
      const fim = pintarBloco(ctx, b, y, a <= 0, PAD, LW);
      ctx.restore();
      return fim;
    }
    // parte j: aparece deslizando; f(e) desenha com e (0 a 1) para os números contarem e as barras crescerem
    const parte = (j, f) => {
      if (!ani) { f(1); return; }
      const [a, e] = ani(j);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate((1 - a) * 30, 0); f(e); ctx.restore();
    };
    const X = E();
    const T_ = (s, font, cor, x, yy) => { if (medir) return; ctx.font = font; ctx.fillStyle = cor; ctx.fillText(s, x, yy); };
    const linhas = (s, font, cor, lh, x, w) => { ctx.font = font; const ls = quebrar(ctx, s, w || LW); ls.forEach((l) => { y += lh; T_(l, font, cor, x || PAD, y); }); };
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    if (b.t === "quem") { y += 18; linhas(b.eu ? `${X.you}: ${b.txt}` : b.txt, `600 30px ${F_DISP}`, b.eu ? "#ffd400" : "#3ddc84", 40); y += 8; }
    else if (b.t === "h") { y += b.n <= 2 ? 30 : 18; if (!medir) { ctx.fillStyle = "#1fc35f"; ctx.fillRect(PAD, y + 8, 8, b.n <= 2 ? 40 : 30); } const lh = b.n <= 2 ? 48 : 38; ctx.font = `700 ${b.n <= 2 ? 40 : 32}px ${F_DISP}`; quebrar(ctx, b.txt, LW - 24).forEach((l) => { y += lh; T_(l, `700 ${b.n <= 2 ? 40 : 32}px ${F_DISP}`, "#ffffff", PAD + 24, y); }); if (b.sub) linhas(b.sub, `400 24px ${F_SANS}`, "#a8bfb0", 32, PAD + 24, LW - 24); y += 10; }
    else if (b.t === "kicker") linhas(b.txt.toUpperCase(), `600 22px ${F_SANS}`, "#3ddc84", 30);
    else if (b.t === "p") { linhas(textoTrechos(b.runs), `400 28px ${F_SANS}`, "#dfeee5", 40); y += 12; }
    else if (b.t === "nota" || b.t === "fonte") { linhas(b.txt, `400 22px ${F_SANS}`, b.cor ? "#ff8a8a" : "#8fa79a", 30); y += 10; }
    else if (b.t === "kv") {
      // valores longos: uma coluna, com o texto quebrado em linhas
      ctx.font = `700 36px ${F_DISP}`;
      const cols = b.itens.some(([, v]) => ctx.measureText(v).width > (LW - 20) / 2 - 36) ? 1 : 2, gw = (LW - 20 * (cols - 1)) / cols;
      if (cols === 2) {
        const hh = 112;
        b.itens.forEach(([k, v], j) => {
          const x = PAD + (j % cols) * (gw + 20), yy = y + Math.floor(j / cols) * (hh + 16);
          if (!medir) parte(j, (e) => {
            ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.beginPath(); ctx.roundRect(x, yy, gw, hh, 18); ctx.fill();
            ctx.font = `400 22px ${F_SANS}`; ctx.fillStyle = "#a8bfb0"; ctx.fillText(cortar(ctx, k, gw - 36), x + 18, yy + 38);
            ctx.font = `700 36px ${F_DISP}`; ctx.fillStyle = "#ffffff"; ctx.fillText(cortar(ctx, contar(v, e), gw - 36), x + 18, yy + 86);
          });
        });
        y += Math.ceil(b.itens.length / cols) * (hh + 16) + 8;
      } else {
        b.itens.forEach(([k, v], j) => {
          ctx.font = `700 30px ${F_DISP}`;
          const ls = quebrar(ctx, v, gw - 36), hh = 60 + ls.length * 38, yy = y;
          if (!medir) parte(j, () => {
            ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.beginPath(); ctx.roundRect(PAD, yy, gw, hh, 18); ctx.fill();
            ctx.font = `400 22px ${F_SANS}`; ctx.fillStyle = "#a8bfb0"; ctx.fillText(cortar(ctx, k, gw - 36), PAD + 18, yy + 36);
            ctx.font = `700 30px ${F_DISP}`; ctx.fillStyle = "#ffffff"; ls.forEach((l, i) => ctx.fillText(l, PAD + 18, yy + 76 + i * 38));
          });
          y += hh + 14;
        });
        y += 8;
      }
    } else if (b.t === "bars") {
      b.itens.forEach((x, j) => {
        y += 34;
        const yr = y, yb = y + 12;
        // a barra cresce e o valor vai junto, contando
        if (!medir) parte(j, (e) => {
          ctx.font = `500 24px ${F_SANS}`; ctx.fillStyle = "#dfeee5"; ctx.fillText(cortar(ctx, x.rot, LW), PAD, yr);
          ctx.font = `700 22px ${F_SANS}`; const vw = ctx.measureText(x.txt).width + 20, tw = LW - vw, bw = Math.max(6, tw * Math.max(0, Math.min(1, x.f)) * e);
          ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.roundRect(PAD, yb, tw, 30, 8); ctx.fill();
          const g = ctx.createLinearGradient(PAD, 0, PAD + bw, 0); g.addColorStop(0, "#1fc35f"); g.addColorStop(1, "#7ee2a6"); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(PAD, yb, bw, 30, 8); ctx.fill();
          ctx.fillStyle = "#ffffff"; ctx.fillText(contar(x.txt, e), PAD + bw + 12, yb + 23);
        });
        y += 50;
      });
      y += 10;
    } else if (b.t === "tab") {
      const ls = (b.cab.length ? [b.cab] : []).concat(b.linhas.slice(0, 40)), n = Math.max(...ls.map((l) => l.length), 1);
      ctx.font = `400 22px ${F_SANS}`;
      // larguras das colunas pelo texto mais longo de cada uma (b.pesos: as mesmas em todas as partes de uma tabela dividida)
      const pesos = b.pesos || Array.from({ length: n }, (_, j) => Math.max(6, ...ls.map((l) => Math.min(30, String(l[j] || "").length)))), soma = pesos.reduce((a, x) => a + x, 0);
      const cw = pesos.map((p_) => (LW * p_) / soma);
      ls.forEach((l, i) => {
        y += 40;
        const yy = y;
        if (!medir) parte(i, () => {
          const cab_ = i === 0 && b.cab.length;
          if (cab_) { ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(PAD, yy - 30, LW, 40); }
          let x = PAD;
          l.forEach((c, j) => { ctx.font = `${cab_ ? 600 : 400} 21px ${F_SANS}`; ctx.fillStyle = cab_ ? "#a8bfb0" : "#e6f2ea"; const s = cortar(ctx, c, cw[j] - 14); ctx.textAlign = j ? "right" : "left"; ctx.fillText(s, j ? x + cw[j] - 6 : x + 6, yy); ctx.textAlign = "left"; x += cw[j]; });
          ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(PAD, yy + 10, LW, 1);
        });
      });
      if (b.linhas.length > 40) { y += 34; T_(`… +${A.nf(b.linhas.length - 40)}`, `400 22px ${F_SANS}`, "#8fa79a", PAD, y); }
      y += 22;
    } else if (b.t === "lista") {
      b.itens.forEach((rs, j) => {
        const pre = b.ord ? `${(b.ini || 0) + j + 1}.` : "•", sw = rs[0] && rs[0].cor && SEQ[rs[0].cor];
        ctx.font = `400 26px ${F_SANS}`;
        const ls = quebrar(ctx, textoTrechos(rs), LW - 44), yi = y;
        y += ls.length * 36;
        if (!medir) parte(j, () => { ctx.font = `400 26px ${F_SANS}`; ls.forEach((l, k) => { const yy = yi + (k + 1) * 36; if (!k) { ctx.fillStyle = sw || "#3ddc84"; ctx.fillText(sw ? "■" : pre, PAD, yy); } ctx.fillStyle = "#dfeee5"; ctx.fillText(l, PAD + 40, yy); }); });
      });
      y += 14;
    }
    else if (b.t === "chips") {
      let x = PAD; y += 10; ctx.font = `600 22px ${F_SANS}`;
      b.itens.forEach((c, j) => {
        ctx.font = `600 22px ${F_SANS}`;
        const w = ctx.measureText(c.txt).width + 56;
        if (x + w > PAD + LW) { x = PAD; y += 54; }
        const xx = x, yy = y;
        if (!medir) parte(j, (e) => { ctx.font = `600 22px ${F_SANS}`; const [bg, fg] = CHIP[c.cor] || CHIP.green; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(xx, yy, w, 44, 22); ctx.fill(); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(xx + 22, yy + 22, 6, 0, 7); ctx.fill(); ctx.fillText(contar(c.txt, e), xx + 36, yy + 30); });
        x += w + 12;
      });
      y += 62;
    } else if (b.t === "img") {
      // b.maxH (carrossel): a imagem diminui e fica centrada para caber na altura
      let w = LW, h = (LW * b.png.h) / b.png.w;
      if (b.maxH && h > b.maxH) { w = (w * b.maxH) / h; h = b.maxH; }
      y += 12;
      if (!medir && b._im) { const x = PAD + (LW - w) / 2; ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.clip(); ctx.drawImage(b._im, x, y, w, h); ctx.restore(); }
      y += h + 18;
    }
    else if (b.t === "code") { ctx.font = `400 20px ${F_MONO}`; const ls = b.txt.split("\n").slice(0, 40); if (!medir) { ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(PAD, y + 8, LW, ls.length * 28 + 24); } ls.forEach((l) => { y += 28; T_(cortar(ctx, l, LW - 30), `400 20px ${F_MONO}`, "#cfe8d8", PAD + 16, y + 10); }); y += 34; }
    return y;
  }
  async function imagemLonga(M) {
    await prepararImagens(M);
    await carregarFontes();
    const L = t(), X = E(), W = 1080, PAD = 64, LW = W - 2 * PAD;
    // desenha (ou só mede, quando medir) e devolve a altura usada
    function desenhar(ctx, medir) {
      let y = 70;
      const T_ = (s, font, cor, x, yy) => { if (medir) return; ctx.font = font; ctx.fillStyle = cor; ctx.fillText(s, x, yy); };
      const linhas = (s, font, cor, lh, x, w) => { ctx.font = font; const ls = quebrar(ctx, s, w || LW); ls.forEach((l) => { y += lh; T_(l, font, cor, x || PAD, y); }); };
      ctx.textBaseline = "alphabetic";
      linhas((M.meta.kicker || L.brand).toUpperCase(), `600 24px ${F_SANS}`, "#3ddc84", 30);
      y += 10; linhas(M.meta.titulo, `700 56px ${F_DISP}`, "#ffffff", 64);
      if (M.meta.sub) { y += 4; linhas(M.meta.sub, `400 28px ${F_SANS}`, "#a8bfb0", 38); }
      y += 8; linhas(X.made(M.meta.quando), `400 22px ${F_SANS}`, "#7f9888", 30);
      y += 26;
      if (!medir) { ctx.strokeStyle = "rgba(255,212,0,.6)"; ctx.lineWidth = 2; ctx.font = `600 22px ${F_SANS}`; const w = ctx.measureText(L.badge).width + 36; ctx.beginPath(); ctx.roundRect(PAD, y - 8, w, 44, 22); ctx.stroke(); ctx.fillStyle = "#ffd400"; ctx.fillText(L.badge, PAD + 18, y + 22); }
      y += 64;
      M.blocos.forEach((b) => { y = pintarBloco(ctx, b, y, medir, PAD, LW); });
      y += 30;
      linhas(L.at.sg_note, `400 22px ${F_SANS}`, "#8fa79a", 30);
      y += 24;
      const qrY = y;
      linhas(L.badge, `600 26px ${F_SANS}`, "#ffd400", 36, PAD, LW - 230);
      linhas((M.meta.url || URL_SITE).replace(/^https:\/\//, ""), `400 22px ${F_SANS}`, "#dfeee5", 30, PAD, LW - 230);
      if (M._qrIm && !medir) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(W - PAD - 200, qrY, 200, 200, 14); ctx.fill(); ctx.imageSmoothingEnabled = false; ctx.drawImage(M._qrIm, W - PAD - 190, qrY + 10, 180, 180); ctx.imageSmoothingEnabled = true; }
      y = Math.max(y, qrY + (M._qrIm ? 210 : 0)) + 50;
      return y;
    }
    await decodificar(M);
    const med = document.createElement("canvas").getContext("2d");
    const H = Math.ceil(desenhar(med, true));
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"); fundoSlide(ctx, W, H); desenhar(ctx, false);
    // muito comprida para um arquivo só: corta em partes e entrega num .zip
    if (H <= MAX_ALTURA) return new Promise((ok) => cv.toBlob(ok, "image/png"));
    const n = Math.ceil(H / MAX_ALTURA), arqs = [];
    for (let i = 0; i < n; i++) {
      const h = Math.min(MAX_ALTURA, H - i * MAX_ALTURA), p = document.createElement("canvas"); p.width = W; p.height = h;
      p.getContext("2d").drawImage(cv, 0, i * MAX_ALTURA, W, h, 0, 0, W, h);
      const b = await new Promise((ok) => p.toBlob(ok, "image/png"));
      arqs.push({ nome: `${String(i + 1).padStart(2, "0")}.png`, dados: new Uint8Array(await b.arrayBuffer()) });
    }
    const z = zip(arqs); z.partes = n; return z;
  }

  // --- 6b) carrossel: várias imagens do mesmo tamanho (capa, conteúdo e fim), ou um PDF com uma página por imagem ----------
  const CARROSSEL = { "45": [1080, 1350], "11": [1080, 1080], "916": [1080, 1920], pdf: [1080, 1350] };
  const MAX_IMGS = { "45": 20, "11": 20, "916": 20, pdf: 40 }; // o Instagram aceita até 20 imagens num carrossel
  const MAX_VIDS = 10; // cada vídeo é gravado em tempo real: 10 vídeos levam perto de 1 minuto
  // Partes de um bloco que podem ir para imagens diferentes: linhas de tabela e de barras, itens de lista e números, frases
  function pedacos(M, med, LW) {
    const X = E(), out = [];
    const perguntas = M.blocos.filter((b) => b.t === "quem" && b.eu).length;
    let sec = "", grp = 0;
    M.blocos.forEach((b) => {
      grp++;
      const add = (p) => out.push(Object.assign(p, { sec, grp }));
      if (b.t === "fonte") return;
      if (b.t === "quem") { if (b.eu && perguntas > 1) { sec = b.txt; add({ t: "quem", eu: true, txt: b.txt, quebra: 2 }); } return; }
      if (b.t === "h" && b.n <= 2) { if (!out.length && b.txt === M.meta.titulo) return; sec = b.txt; add(Object.assign({}, b, { quebra: 1 })); return; }
      // o que já está na capa (rótulo, título e linha de apoio) e no fim (aviso) não se repete; links soltos não servem numa imagem
      if (b.t === "kicker" && b.txt === M.meta.kicker) return;
      if (b.t === "p" && M.meta.sub && textoTrechos(b.runs).trim() === M.meta.sub) return;
      if (b.t === "p" && b.runs.every((r) => r.href || !r.txt.trim())) return;
      if (b.t === "nota" && b.txt === t().at.sg_note) return;
      // números do topo da página (antes do primeiro título) vão para a capa
      if (b.t === "kv" && !M.capa && !out.some((x) => x.t === "h" || x.t === "quem") && b.itens.length >= 2 && b.itens.every(([k, v]) => String(v).length <= 24 && String(k).length <= 40)) { M.capa = b.itens.slice(0, 4); if (b.itens.length > 4) add({ t: "kv", itens: b.itens.slice(4) }); return; }
      if (b.t === "p" && pintarBloco(med, b, 0, true, 0, LW) > 520) { dividirTexto(textoTrechos(b.runs), 280).forEach((s) => add({ t: "p", runs: [{ txt: s }] })); return; }
      const mais = (n) => { if (n > MAX_SLIDE) add({ t: "nota", txt: X.more_rows(A.nf(n - MAX_SLIDE)) }); };
      if (b.t === "kv") { b.itens.forEach((it) => add({ t: "kv", itens: [it] })); return; }
      if (b.t === "bars") { b.itens.slice(0, MAX_SLIDE).forEach((it) => add({ t: "bars", itens: [it] })); mais(b.itens.length); return; }
      if (b.t === "tab") {
        const ls = (b.cab.length ? [b.cab] : []).concat(b.linhas.slice(0, MAX_SLIDE)), n = Math.max(...ls.map((l) => l.length), 1);
        const pesos = Array.from({ length: n }, (_, j) => Math.max(6, ...ls.map((l) => Math.min(30, String(l[j] || "").length))));
        b.linhas.slice(0, MAX_SLIDE).forEach((l) => add({ t: "tab", cab: b.cab, linhas: [l], pesos }));
        mais(b.linhas.length); return;
      }
      if (b.t === "lista") { b.itens.forEach((it, j) => add({ t: "lista", ord: b.ord, ini: (b.ini || 0) + j, itens: [it] })); return; }
      if (b.t === "code") { const ls = b.txt.split("\n"); for (let i = 0; i < ls.length; i += 12) add({ t: "code", txt: ls.slice(i, i + 12).join("\n") }); return; }
      add(Object.assign({}, b));
    });
    // título sem nada até o próximo título do mesmo nível (ou acima) sai
    return out.filter((p, i) => {
      if (p.t !== "h") return true;
      const nv = (x) => (x.t === "quem" ? 0 : x.t === "h" ? x.n : 9), prox = out[i + 1];
      return prox && nv(prox) > p.n;
    });
  }
  // Partes vizinhas do mesmo bloco, na mesma imagem, voltam a ser um bloco só
  function juntar(ps) {
    const out = [];
    ps.forEach((p) => {
      const u = out[out.length - 1];
      if (u && u.grp === p.grp && u.t === p.t && /^(kv|bars|tab|lista)$/.test(p.t)) {
        if (p.t === "tab") u.linhas = u.linhas.concat(p.linhas); else u.itens = u.itens.concat(p.itens);
      } else out.push(Object.assign({}, p, p.itens ? { itens: p.itens.slice() } : {}, p.linhas ? { linhas: p.linhas.slice() } : {}));
    });
    return out;
  }
  // video: em vez das imagens, devolve as telas (slides) para gravar: cada uma com duração, sons e pintar(tm) no canvas r.cv
  async function carrossel(fonte, fmt, aoAvancar, video) {
    const quando = new Intl.DateTimeFormat(t().locale, { dateStyle: "long", timeStyle: "short" }).format(new Date());
    const M = { meta: Object.assign({ quando }, fonte.meta), blocos: modelo(fonte.elementos) };
    await prepararImagens(M);
    await carregarFontes();
    await decodificar(M);
    const L = t(), X = E(), [W, H] = CARROSSEL[fmt], alto = H > 1500, PAD = 72, LW = W - 2 * PAD;
    // Story: o topo e a base ficam livres porque a interface dos apps cobre essas faixas
    const topo = alto ? 210 : 56, base = alto ? 240 : 44, CAB = 128, ROD = 118;
    const y0 = topo + CAB, y1 = H - base - ROD, livre = y1 - y0;
    const med = document.createElement("canvas").getContext("2d");
    const ps = pedacos(M, med, LW);
    const conta = {};
    for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; conta[p.grp] = (conta[p.grp] || 0) + 1; p.resta = conta[p.grp]; if (p.t === "img") p.maxH = Math.round(livre * 0.8); }
    const altura = (l) => juntar(l).reduce((y, b) => pintarBloco(med, b, y, true, PAD, LW), 0);
    const titulo = (p) => p.t === "h" || p.t === "quem" || p.t === "kicker";
    // conteúdo distribuído nas imagens: cada uma recebe o que cabe; um título nunca fica sozinho no fim de uma imagem
    const telas = [];
    let at = [];
    ps.forEach((p) => {
      if (at.length && (p.quebra === 2 || (p.quebra === 1 && altura(at) > livre * 0.45))) { telas.push(at); at = []; }
      if (p.t === "img" && at.length && altura(at.concat(p)) > livre) { const sobra = livre - altura(at) - 40; if (sobra >= livre * 0.45) p.maxH = Math.min(p.maxH, sobra); }
      if (at.length && altura(at.concat(p)) > livre) {
        const leva = [];
        // a última linha de uma tabela (ou lista) não vai sozinha para a próxima imagem
        if (p.resta === 1 && at.length >= 3 && at[at.length - 1].grp === p.grp && at[at.length - 2].grp === p.grp) leva.unshift(at.pop());
        while (at.length > 1 && titulo(at[at.length - 1])) leva.unshift(at.pop());
        telas.push(at); at = leva;
      }
      at.push(p);
    });
    if (at.length) telas.push(at);
    const cabe = (video ? MAX_VIDS : MAX_IMGS[fmt]) - 2, cortado = telas.length > cabe;
    if (cortado) telas.length = cabe;
    const total = telas.length + 2, fontes = [...new Set(M.blocos.filter((b) => b.t === "fonte").map((b) => b.txt))];
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    let dominio = (M.meta.url || URL_SITE).replace(/^https:\/\//, "").replace(/\/$/, "");
    try { dominio = decodeURI(dominio).replace(/%20/g, " "); } catch (e) { /* fica como está */ }

    const marca = (x, y, s) => {
      ctx.fillStyle = "#009c3b"; ctx.beginPath(); ctx.roundRect(x, y, s, s, s / 4); ctx.fill();
      ctx.strokeStyle = "#ffdf00"; ctx.lineWidth = s / 10.6; ctx.lineCap = "round";
      [[.25, .75, .44], [.42, .75, .25], [.58, .75, .5], [.75, .75, .59]].forEach(([fx, a, b]) => { ctx.beginPath(); ctx.moveTo(x + fx * s, y + a * s); ctx.lineTo(x + fx * s, y + b * s); ctx.stroke(); });
      ctx.lineCap = "butt";
    };
    const pilula = (txt, x, y, cor, fundo, font, centro) => {
      ctx.font = font; const w = ctx.measureText(txt).width + 44;
      const x0 = centro ? x - w / 2 : x;
      ctx.fillStyle = fundo; ctx.beginPath(); ctx.roundRect(x0, y, w, 52, 26); ctx.fill();
      ctx.fillStyle = cor; ctx.textBaseline = "middle"; ctx.fillText(txt, x0 + 22, y + 27); ctx.textBaseline = "alphabetic";
      return w;
    };
    // cabeçalho (marca e número da imagem) e rodapé (aviso, endereço e "arraste")
    function moldura(k, contexto) {
      fundoSlide(ctx, W, H);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      marca(PAD, topo + 4, 46);
      ctx.fillStyle = "#eef6f0"; ctx.font = `700 28px ${F_DISP}`; ctx.fillText(L.brand, PAD + 62, topo + 38);
      ctx.font = `600 24px ${F_MONO}`; ctx.fillStyle = "#ffd84d"; ctx.textAlign = "right"; ctx.fillText(`${k} / ${total}`, W - PAD, topo + 38); ctx.textAlign = "left";
      if (contexto) { ctx.font = `700 21px ${F_MONO}`; ctx.fillStyle = "#3ddc84"; ctx.fillText(cortar(ctx, contexto.toUpperCase(), LW), PAD, topo + 96); }
      const yr = H - base - ROD + 30;
      ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fillRect(PAD, yr, LW, 1);
      ctx.font = `600 20px ${F_SANS}`; ctx.fillStyle = "#ffd84d"; ctx.fillText(cortar(ctx, L.badge, LW - (k < total ? 230 : 0)), PAD, yr + 40);
      ctx.font = `500 21px ${F_MONO}`; ctx.fillStyle = "#b8ccbf"; ctx.fillText(cortar(ctx, dominio, LW - (k < total ? 230 : 0)), PAD, yr + 74);
      if (k < total) { ctx.font = `700 24px ${F_SANS}`; const w = ctx.measureText(L.cr_swipe + "  →").width + 44; pilula(L.cr_swipe + "  →", W - PAD - w, yr + 22, "#07130c", "#3ddc84", `700 24px ${F_SANS}`); }
    }
    // fase: 0 antes de ini, sobe até 1 em dur segundos (tm = Infinity: tudo pronto, como na imagem)
    const fase = (tm, ini, dur) => { const x = Math.max(0, Math.min(1, (tm - ini) / dur)); return 1 - Math.pow(1 - x, 3); };
    const surge = (tm, ini, f) => { const a = fase(tm, ini, .5); if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, (1 - a) * 24); f(a); ctx.restore(); };
    function capa(tm) {
      // título: a letra diminui até caber em 6 linhas
      const quadrado = H <= W;
      let tt = alto ? 84 : 76, tl;
      ctx.font = `700 ${tt}px ${F_DISP}`; tl = quebrar(ctx, M.meta.titulo, LW);
      while (tl.length > (alto ? 7 : quadrado ? 4 : 5) && tt > 44) { tt -= 6; ctx.font = `700 ${tt}px ${F_DISP}`; tl = quebrar(ctx, M.meta.titulo, LW); }
      ctx.font = `400 30px ${F_SANS}`;
      const sub = M.meta.sub ? quebrar(ctx, M.meta.sub, LW).slice(0, quadrado ? 2 : 4) : [];
      if (M.meta.sub && sub.length < quebrar(ctx, M.meta.sub, LW).length) sub[sub.length - 1] = cortar(ctx, sub[sub.length - 1] + " …", LW);
      ctx.font = `600 24px ${F_MONO}`;
      const kick = quebrar(ctx, String(M.meta.kicker || L.brand).toUpperCase(), LW).slice(0, 2);
      const cap = M.capa || [], hCap = cap.length ? Math.ceil(cap.length / 2) * 120 + 24 : 0;
      const hBloco = kick.length * 34 + 24 + tl.length * (tt + 8) + 40 + sub.length * 40 + 30 + 34 + hCap;
      let y = y0 + Math.max(0, (livre - hBloco - 150) / 2);
      kick.forEach((l) => { y += 34; const yy = y; surge(tm, .2, () => { ctx.font = `600 24px ${F_MONO}`; ctx.fillStyle = "#3ddc84"; ctx.fillText(l, PAD, yy); }); });
      y += 24;
      tl.forEach((l, i) => { y += tt + 8; const yy = y; surge(tm, .45 + i * .12, () => { ctx.font = `700 ${tt}px ${F_DISP}`; ctx.fillStyle = "#ffffff"; ctx.fillText(l, PAD, yy); }); });
      y += 28;
      const g = ctx.createLinearGradient(PAD, 0, PAD + 200, 0); g.addColorStop(0, "#1fc35f"); g.addColorStop(1, "#ffd400"); ctx.fillStyle = g; ctx.fillRect(PAD, y, 200 * fase(tm, .9, .6), 7);
      y += 12;
      sub.forEach((l) => { y += 40; const yy = y; surge(tm, 1.1, () => { ctx.font = `400 30px ${F_SANS}`; ctx.fillStyle = "#cfe0d5"; ctx.fillText(l, PAD, yy); }); });
      if (cap.length) { y += 24; y = pintarBloco(ctx, { t: "kv", itens: cap }, y, false, PAD, LW, tm === Infinity ? null : (j) => [fase(tm, 1.5 + j * .15, .45), fase(tm, 1.6 + j * .15, 1.2)]) - 8; }
      y += 30;
      const yd = y;
      surge(tm, 2.3, () => { ctx.font = `400 22px ${F_SANS}`; ctx.fillStyle = "#8fa79a"; ctx.fillText(X.made(M.meta.quando), PAD, yd + 4); });
      y += 44;
      const yb = y;
      surge(tm, 2.5, () => {
        ctx.strokeStyle = "rgba(255,212,0,.6)"; ctx.lineWidth = 2; ctx.font = `600 22px ${F_SANS}`;
        const bw = Math.min(LW, ctx.measureText(L.badge).width + 40); ctx.beginPath(); ctx.roundRect(PAD, yb, bw, 48, 24); ctx.stroke();
        ctx.fillStyle = "#ffd400"; ctx.fillText(cortar(ctx, L.badge, LW - 40), PAD + 20, yb + 32);
      });
      surge(tm, 2.8, () => pilula(L.cr_swipe_cover(total, video), W / 2, y1 - 70, "#eef6f0", "rgba(31,195,95,.22)", `600 26px ${F_SANS}`, true));
    }
    // Conteúdo de uma imagem: blocos, onde começam e, no vídeo, quando cada parte entra (e o som de cada uma)
    function plano(tela) {
      const bl = juntar(tela), h = bl.reduce((y, b) => pintarBloco(med, b, y, true, PAD, LW), 0);
      // pouco conteúdo: fica um pouco acima do meio
      const yIni = y0 - 10 + (titulo(tela[0]) && h < livre * 0.7 ? (livre - h) * 0.35 : 0);
      let s = .35;
      const tl = bl.map((b) => {
        const n = b.t === "tab" ? b.linhas.length + (b.cab.length ? 1 : 0) : /^(kv|bars|lista|chips)$/.test(b.t) ? b.itens.length : 1;
        const passo = n > 1 ? Math.min(.18, 1.5 / n) : 0, r = { ini: s, passo, n };
        s += (n - 1) * passo + (n > 1 ? .35 : .3);
        return r;
      });
      // muito conteúdo: tudo entra mais depressa, para sobrar tempo de leitura
      const k = Math.min(1, 3.4 / s);
      tl.forEach((r) => { r.ini *= k; r.passo *= k; });
      const sons = [];
      bl.forEach((b, i) => {
        const r = tl[i];
        if (b.t === "h" || b.t === "quem" || b.t === "kicker") sons.push({ ini: r.ini, tipo: "t" });
        else if ((b.t === "bars" || b.t === "kv") && r.n <= 6) b.itens.forEach((x, j) => sons.push({ ini: r.ini + j * r.passo, tipo: b.t === "bars" ? "b" : "l", f: x.f, num: contavel(String(b.t === "bars" ? x.txt : x[1])), cd: 1.2 }));
        else if (r.n > 1) sons.push({ ini: r.ini, tipo: "c", n: Math.min(4, r.n), num: b.t === "bars" || b.t === "kv" });
        else sons.push({ ini: r.ini, tipo: "l" });
      });
      return { bl, yIni, tl, sons: sons.slice(0, 16), dur: Math.max(4.5, Math.min(7, s * k + 3.5)) };
    }
    function conteudo(pl, tm) {
      let y = pl.yIni;
      ctx.save(); ctx.beginPath(); ctx.rect(0, y0 - 20, W, livre + 30); ctx.clip();
      pl.bl.forEach((b, i) => {
        const r = pl.tl[i];
        y = pintarBloco(ctx, b, y, false, PAD, LW, tm === Infinity ? null : (j) => { const t0 = r.ini + j * r.passo; return [fase(tm, t0, .45), fase(tm, t0 + .1, 1.2)]; });
      });
      ctx.restore();
    }
    // fim: fonte, aviso e QR Code (no PDF o QR e o endereço viram link)
    function fim(tm) {
      let y = y0;
      surge(tm, .2, () => {
        ctx.fillStyle = "#1fc35f"; ctx.fillRect(PAD, y0 + 4, 8, 44);
        ctx.fillStyle = "#ffffff"; ctx.font = `700 44px ${F_DISP}`; ctx.fillText(X.slide_end, PAD + 26, y0 + 42);
      });
      y += 70;
      const linhas = (s, font, cor, lh, ini) => { ctx.font = font; quebrar(ctx, s, LW).forEach((l) => { y += lh; const yy = y; surge(tm, ini, () => { ctx.font = font; ctx.fillStyle = cor; ctx.fillText(l, PAD, yy); }); }); };
      (fontes.length ? fontes : [L.cd_src]).slice(0, 3).forEach((f, i) => linhas(`${X.src}: ${f}`, `400 24px ${F_SANS}`, "#b8ccbf", 34, .5 + i * .12));
      y += 14;
      linhas(L.at.sg_note, `400 26px ${F_SANS}`, "#dfeee5", 38, .95);
      if (cortado) { y += 10; linhas(L.cr_more, `600 24px ${F_SANS}`, "#ffd84d", 34, 1.25); }
      y += 30;
      const q = Math.max(150, Math.min(alto ? 360 : 300, y1 - y - 90));
      const qx = (W - q) / 2, qy = y;
      // o QR Code entra crescendo
      const aq = fase(tm, 1.5, .7);
      if (M._qrIm && aq > 0) {
        ctx.save(); ctx.globalAlpha *= aq; ctx.translate(W / 2, qy + q / 2); ctx.scale(.85 + .15 * aq, .85 + .15 * aq); ctx.translate(-W / 2, -(qy + q / 2));
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(qx, qy, q, q, 18); ctx.fill(); ctx.imageSmoothingEnabled = false; ctx.drawImage(M._qrIm, qx + 14, qy + 14, q - 28, q - 28); ctx.imageSmoothingEnabled = true;
        ctx.restore();
      }
      const link = { x: qx, y, w: q, h: q + 80 };
      y += (M._qrIm ? q : 0) + 46;
      const ya = y;
      // no vídeo, o endereço do site ganha destaque no fim
      const dest = tm === Infinity ? 0 : fase(tm, 2.6, .8);
      if (dest > 0) { ctx.font = `500 24px ${F_MONO}`; const w = Math.min(LW, ctx.measureText(dominio).width + 60); ctx.fillStyle = `rgba(31,195,95,${.18 * dest})`; ctx.beginPath(); ctx.roundRect((W - w) / 2, ya + 6, w, 46, 23); ctx.fill(); }
      surge(tm, 2.1, () => { ctx.textAlign = "center"; ctx.font = `700 26px ${F_SANS}`; ctx.fillStyle = "#3ddc84"; ctx.fillText(X.open, W / 2, ya); ctx.textAlign = "left"; });
      surge(tm, 2.3, () => { ctx.textAlign = "center"; ctx.font = `500 24px ${F_MONO}`; ctx.fillStyle = "#eef6f0"; ctx.fillText(cortar(ctx, dominio, LW), W / 2, ya + 36); ctx.textAlign = "left"; });
      if (!M._qrIm) { link.y = y - 34; link.h = 80; }
      link.x = Math.min(link.x, PAD); link.w = Math.max(link.w, LW);
      return link;
    }
    // Telas: a moldura (fundo, marca, número, rodapé) é desenhada uma vez e guardada; cada quadro do vídeo só refaz o conteúdo
    const guardada = document.createElement("canvas");
    let naGuardada = 0;
    const slides = [{ k: 1, contexto: "", dur: 5, desenhar: capa, acorde: null,
      sons: [{ ini: .45, tipo: "t" }].concat((M.capa || []).map(([, v], j) => ({ ini: 1.5 + j * .15, tipo: "l", num: contavel(String(v)), cd: 1.2 }))) }]
      .concat(telas.map((tela, i) => {
        const pl = plano(tela);
        return { k: i + 2, contexto: titulo(tela[0]) ? "" : tela[0].sec || M.meta.titulo, dur: pl.dur, sons: pl.sons, acorde: null, desenhar: (tm) => conteudo(pl, tm) };
      }))
      .concat([{ k: total, contexto: "", dur: 5.5, desenhar: fim, acorde: 2.6, sons: [{ ini: .2, tipo: "t" }, { ini: .5, tipo: "l" }, { ini: 1.5, tipo: "c", n: 3 }] }]);
    slides.forEach((sl) => {
      sl.pintar = (tm) => {
        if (video && naGuardada === sl.k) ctx.drawImage(guardada, 0, 0);
        else {
          moldura(sl.k, sl.contexto);
          if (sl.k === 1) { ctx.fillStyle = "#ffd84d"; ctx.font = `600 22px ${F_SANS}`; ctx.fillText(L.brand_sub.toUpperCase(), PAD + 62, topo + 70); }
          if (video) { guardada.width = W; guardada.height = H; guardada.getContext("2d").drawImage(cv, 0, 0); naGuardada = sl.k; }
        }
        ctx.globalAlpha = 1; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        return sl.desenhar(tm);
      };
    });
    const nome = nz(M.meta.arquivo || M.meta.titulo).slice(0, 50) || "auditoria-bu-2026";
    if (video) return { slides, cv, W, H, total, cortado, nome };
    const pdf = fmt === "pdf", out = [];
    let link = null;
    for (const sl of slides) {
      const l = sl.pintar(Infinity);
      if (sl.k === total) link = l;
      const b = await new Promise((ok) => cv.toBlob(ok, pdf ? "image/jpeg" : "image/png", 0.9));
      out.push(b);
      if (aoAvancar) aoAvancar(out.length, total);
    }
    const r = { imgs: out, W, H, total, cortado, nome };
    if (pdf) r.pdf = await pdfImagens(out, W, H, M.meta, Object.assign(link, { url: M.meta.url || URL_SITE }));
    return r;
  }

  // PDF feito à mão: uma página por imagem JPEG (2 px por ponto) e, na última, um link para o site
  async function pdfImagens(jpgs, W, H, meta, link) {
    const enc = new TextEncoder(), partes = [], offs = [];
    let pos = 0;
    const add = (x) => { const b = typeof x === "string" ? enc.encode(x) : x; partes.push(b); pos += b.length; };
    const pw = W / 2, ph = H / 2, n = jpgs.length;
    const hex = (s) => "<FEFF" + Array.from(String(s)).map((c) => { const k = c.codePointAt(0); return k > 0xffff ? [0xd800 + ((k - 0x10000) >> 10), 0xdc00 + ((k - 0x10000) & 0x3ff)] : [k]; }).flat().map((k) => k.toString(16).padStart(4, "0")).join("") + ">";
    const lit = (s) => "(" + String(s).replace(/[\\()]/g, (c) => "\\" + c).replace(/[^\x20-\x7e]/g, "") + ")";
    const obj = (k, corpo) => { offs[k] = pos; add(`${k} 0 obj\n`); corpo(); add("\nendobj\n"); };
    const annot = 4 + 3 * n;
    add("%PDF-1.4\n%âã\n");
    obj(1, () => add("<< /Type /Catalog /Pages 2 0 R >>"));
    obj(2, () => add(`<< /Type /Pages /Count ${n} /Kids [${jpgs.map((_, i) => `${4 + 3 * i} 0 R`).join(" ")}] >>`));
    obj(3, () => add(`<< /Title ${hex(meta.titulo || "")} /Author ${hex(t().brand)} /Subject ${hex(t().badge)} /Producer ${hex(URL_SITE)} >>`));
    for (let i = 0; i < n; i++) {
      const p = 4 + 3 * i, dados = new Uint8Array(await jpgs[i].arrayBuffer()), cs = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
      obj(p, () => add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R${i === n - 1 && link ? ` /Annots [${annot} 0 R]` : ""} >>`));
      obj(p + 1, () => { add(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`); });
      obj(p + 2, () => { add(`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${dados.length} >>\nstream\n`); add(dados); add("\nendstream"); });
    }
    const r = link ? [link.x / 2, ph - (link.y + link.h) / 2, (link.x + link.w) / 2, ph - link.y / 2].map((v) => +v.toFixed(2)) : null;
    if (r) obj(annot, () => add(`<< /Type /Annot /Subtype /Link /Rect [${r.join(" ")}] /Border [0 0 0] /A << /S /URI /URI ${lit(link.url)} >> >>`));
    const tot = (r ? annot : annot - 1) + 1, xref = pos;
    add(`xref\n0 ${tot}\n0000000000 65535 f \n` + Array.from({ length: tot - 1 }, (_, i) => `${String(offs[i + 1]).padStart(10, "0")} 00000 n \n`).join(""));
    add(`trailer\n<< /Size ${tot} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(partes, { type: "application/pdf" });
  }

  // --- 7) página interativa (.html) — usada pelas páginas e pelo Atlas --------------------------------------------------------
  const SCRIPT_DOC = `(function(){var h=document.documentElement,reduz=matchMedia("(prefers-reduced-motion: reduce)").matches;if(reduz)h.classList.remove("anim");
var tip=document.createElement("div");tip.className="tip";tip.hidden=true;document.body.appendChild(tip);var at=null;
function encher(el){if(at===el)return;at=el;tip.textContent="";var l=el.getAttribute("data-tip").split("\\n"),s=document.createElement("strong");s.textContent=l[0];tip.appendChild(s);for(var i=1;i<l.length;i++){var d=document.createElement("div");d.textContent=l[i];tip.appendChild(d);}tip.hidden=false;}
function pos(x,y){var r=tip.getBoundingClientRect(),a=x+14,b=y-r.height-12;if(a+r.width>innerWidth-8)a=Math.max(8,x-r.width-14);if(b<8)b=y+18;tip.style.left=a+"px";tip.style.top=b+"px";}
function sai(){tip.hidden=true;at=null;}
document.addEventListener("mousemove",function(e){var el=e.target.closest("[data-tip]");if(el){encher(el);pos(e.clientX,e.clientY);}else if(at)sai();});
document.addEventListener("click",function(e){var el=e.target.closest("[data-tip]");if(el){encher(el);var r=el.getBoundingClientRect();pos(r.left+Math.min(r.width/2,120),r.top);}else sai();});
document.addEventListener("focusin",function(e){var el=e.target.closest("[data-tip]");if(el){encher(el);var r=el.getBoundingClientRect();pos(r.left+Math.min(r.width/2,120),r.top);}});
addEventListener("scroll",sai,{passive:true});
var fmt=new Intl.NumberFormat(h.getAttribute("data-locale")||"pt-BR");
function conta(el){var alvo=+el.getAttribute("data-count"),t0=performance.now();function p(t){var k=Math.min(1,(t-t0)/1500),e=1-Math.pow(1-k,3);el.textContent=fmt.format(Math.round(alvo*e));if(k<1)requestAnimationFrame(p);}requestAnimationFrame(p);}
if(reduz||!("IntersectionObserver" in window))return;
var io=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;io.unobserve(en.target);if(en.target.classList.contains("bars"))en.target.classList.add("in");else conta(en.target);});},{rootMargin:"0px 0px -6% 0px"});
document.querySelectorAll(".bars").forEach(function(el){el.classList.remove("in");io.observe(el);});
document.querySelectorAll("[data-count]").forEach(function(el){el.textContent=fmt.format(0);io.observe(el);});})();`;
  async function htmlInterativo(doc, titulo, arquivo) {
    const L = t();
    const css = await fetch("site/css/style.css").then((r) => r.text()).catch(() => "");
    const tema_ = document.documentElement.getAttribute("data-theme");
    const pagina = `<!doctype html>
<html lang="${{ PT: "pt-BR", EN: "en", ES: "es" }[A.state.lang]}" class="anim"${tema_ ? ` data-theme="${esc(tema_)}"` : ""} data-locale="${esc(L.locale)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark light">
<title>${esc(titulo)}</title><link rel="icon" href="${URL_SITE}site/img/favicon.svg">
<style>${css.replace(/url\("\.\.\//g, `url("${URL_SITE}site/`)}</style></head>
<body class="doc-pagina">${doc.outerHTML}<script>${SCRIPT_DOC}<\/script></body></html>`;
    baixar(arquivo, pagina, "text/html;charset=utf-8");
  }
  // Página do site como .html: o conteúdo da página, com os links levando ao site
  async function paginaHtml(meta) {
    const L = t(), main = $("#main");
    const doc = document.createElement("article");
    doc.className = "at-doc pg-doc";
    const qr = meta.url ? await A.ferramentas.svgQr(meta.url).catch(() => "") : "";
    doc.innerHTML = `<header class="doc-cab"><div class="doc-tit"><span class="at-marca" aria-hidden="true">${icone("globe")}</span><div><b>${esc(L.brand)}</b><span>${esc(L.brand_sub)}</span></div></div>
      <p class="doc-meta">${esc(meta.titulo)} · ${esc(E().made(meta.quando))}</p><p class="doc-selo">${esc(L.badge)}</p>
      ${meta.url ? `<div class="doc-vivo">${qr}<div><b>${esc(E().open)}</b><p>${esc(L.at.doc_live_note_html)}</p><a href="${esc(meta.url)}">${esc(meta.url.replace(/^https:\/\//, ""))}</a></div></div>` : ""}</header>`;
    const corpo = document.createElement("div"); corpo.className = "pg-doc-corpo";
    Array.from(main.children).forEach((c) => { if (!c.matches(".print-head, .bot-band, .bot-cta, .tg-cta")) corpo.append(c.cloneNode(true)); });
    corpo.querySelectorAll(".pg-acoes, form.filters, .lk-form, .tabs, script, .hero-canvas, .bot-band, .bot-cta, .tg-cta, [data-toggle-view]").forEach((x) => x.remove());
    corpo.querySelectorAll(".rv").forEach((x) => { x.classList.remove("rv", "rv-l", "rv-s", "in"); x.style.removeProperty("--d"); });
    corpo.querySelectorAll("[data-count]").forEach((x) => { x.textContent = nf(+x.dataset.count); });
    corpo.querySelectorAll(".tw-on").forEach((h) => { const s = h.querySelector(".sr-only"); if (s) h.textContent = s.textContent; h.classList.remove("tw-on"); });
    corpo.querySelectorAll(".bars").forEach((b) => b.classList.add("in"));
    doc.append(A.ferramentas.linkarDoc(corpo, URL_SITE, true));
    doc.insertAdjacentHTML("beforeend", `<footer class="doc-rod"><a href="${esc(URL_SITE)}">${esc(URL_SITE.replace(/^https:\/\/|\/$/g, ""))}</a> · ${esc(L.badge)}</footer>`);
    return htmlInterativo(doc, `${meta.titulo} · ${L.brand}`, nomeArq(meta, "html"));
  }

  // --- 8) site estático: página inicial com resumo, menu e uma parte por resposta; .html (um arquivo) ou .zip (pasta) ----------
  const CSS_SITE = `body.gs{margin:0}
.gs-wrap{max-width:1040px;margin:0 auto;padding:0 16px}
.gs-top{position:sticky;top:0;z-index:20;background:var(--glass);-webkit-backdrop-filter:saturate(1.4) blur(12px);backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid var(--line)}
.gs-faixa{height:4px;background:var(--brasil)}
.gs-barra{display:flex;align-items:center;gap:12px;min-height:58px}
.gs-marca{display:flex;align-items:center;gap:10px;flex:1;min-width:0;color:var(--ink);text-decoration:none}
.gs-marca span:last-child{min-width:0}
.gs-marca b{display:block;font:700 1rem var(--display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gs-marca small{display:block;font-size:.74rem;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gs-tema{flex:none;width:40px;height:40px;border-radius:12px;border:1px solid var(--line-2);background:var(--surface);color:var(--ink);display:grid;place-items:center;cursor:pointer}
.gs-tema:hover{border-color:var(--accent)}
.gs-tema svg{width:18px;height:18px}
.gs-tema .i-lua,[data-theme="light"] .gs-tema .i-sol{display:none}
[data-theme="light"] .gs-tema .i-lua{display:block}
.gs-nav{border-top:1px solid var(--line)}
.gs-nav .gs-wrap{display:flex;gap:6px;overflow-x:auto;padding-top:8px;padding-bottom:8px;scrollbar-width:thin}
.gs-nav a{flex:none;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:5px 12px;border-radius:999px;border:1px solid var(--line-2);color:var(--ink-2);text-decoration:none;font-size:.84rem}
.gs-nav a:hover{border-color:var(--accent);color:var(--ink)}
.gs-nav a[aria-current]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
main.gs-main{max-width:none;margin:0;padding:0}
.gs-hero{padding:46px 0 30px;border-bottom:1px solid var(--line);background:radial-gradient(900px 320px at 12% 0,var(--accent-soft),transparent 70%),radial-gradient(700px 260px at 95% 10%,var(--yellow-soft),transparent 70%)}
.gs-kicker{margin:0 0 10px;font:700 .74rem var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--yellow-text)}
.gs-hero h1{font-size:clamp(1.9rem,5vw,3rem);margin:0 0 12px;overflow-wrap:anywhere}
.gs-lead{margin:0 0 10px;max-width:62ch;font-size:1.06rem;color:var(--ink-2)}
.gs-meta{margin:0 0 4px;font-size:.86rem;color:var(--muted)}
.gs-resumo-t{margin:26px 0 10px;font:700 .78rem var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.gs-resumo{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
.gs-card{display:flex;flex-direction:column;gap:3px;padding:14px 16px;border:1px solid var(--line-2);border-radius:var(--radius);background:var(--surface);color:var(--ink);text-decoration:none;transition:border-color .2s,transform .2s}
.gs-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.gs-card .gs-n{font:700 .72rem var(--mono);color:var(--accent)}
.gs-card b{font:700 1rem var(--display);overflow-wrap:anywhere}
.gs-card span{font-size:.8rem;color:var(--muted)}
.gs-card strong{margin-top:6px;font:700 1.3rem var(--display);font-variant-numeric:tabular-nums}
.gs-card small{font-size:.76rem;color:var(--ink-2)}
.gs-sec{padding:38px 0 14px;border-bottom:1px solid var(--line)}
.gs-cab{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px}
.gs-cab .gs-n{flex:none;margin-top:5px;padding:4px 8px;border-radius:8px;background:var(--accent);color:var(--accent-ink);font:700 .8rem var(--mono)}
.gs-cab h2{margin:0 0 4px;overflow-wrap:anywhere}
.gs-cab p{margin:0;font-size:.9rem;color:var(--muted)}
.gs-sec .doc-corpo{max-width:880px}
.gs-subir{margin:18px 0 0;font-size:.84rem}
.gs-rod{padding:30px 0 44px;font-size:.86rem;color:var(--ink-2)}
.gs-selo{display:flex;gap:12px;align-items:center;margin-bottom:14px;padding:14px 16px;border:1px solid var(--accent);border-radius:var(--radius);background:var(--accent-soft)}
.gs-selo b{display:block;font:700 1rem var(--display);color:var(--ink)}
.gs-selo span span{display:block;font-size:.8rem}
.gs-rod p{margin:0 0 6px}
@media (max-width:600px){.gs-hero{padding:30px 0 22px}.gs-cab{gap:10px}.gs-sec{padding-top:30px}}
@media print{.gs-top{position:static}.gs-nav,.gs-tema,.gs-subir{display:none}}`;
  const TEMA_SITE = `(function(){var h=document.documentElement,t=null;try{t=localStorage.getItem("gs-tema")}catch(e){}if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";if(t==="light")h.setAttribute("data-theme","light");})();`;
  const SCRIPT_SITE = `(function(){var h=document.documentElement,b=document.querySelector(".gs-tema");
if(b)b.addEventListener("click",function(){var l=h.getAttribute("data-theme")!=="light";if(l)h.setAttribute("data-theme","light");else h.removeAttribute("data-theme");try{localStorage.setItem("gs-tema",l?"light":"dark")}catch(e){}});
var ls=[].slice.call(document.querySelectorAll(".gs-nav a"));if(!ls.length||!("IntersectionObserver" in window))return;var nav=ls[0].parentNode,por={};ls.forEach(function(a){por[a.getAttribute("href").slice(1)]=a;});
var io=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;var a=por[en.target.id];ls.forEach(function(x){x.removeAttribute("aria-current");});if(a){a.setAttribute("aria-current","true");nav.scrollLeft=a.offsetLeft-nav.clientWidth/2+a.offsetWidth/2;}});},{rootMargin:"-45% 0px -50% 0px"});
document.querySelectorAll(".gs-sec").forEach(function(s){io.observe(s);});})();`;
  const base64 = (buf) => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  // o: { titulo, partes: [{ titulo, sub, el, destaque: [rótulo, valor], resumo }] } · fmt: "html" ou "zip"
  async function siteEstatico(o, fmt) {
    const L = t(), T = L.at, zipar = fmt === "zip";
    const quando = new Intl.DateTimeFormat(L.locale, { dateStyle: "long", timeStyle: "short" }).format(new Date());
    const pega = (u, tipo) => fetch(u).then((r) => (r.ok ? r[tipo]() : Promise.reject(new Error(r.status))));
    const [css, fonte, favicon, ofl] = await Promise.all([pega("site/css/style.css", "text"), pega("site/fonts/space-grotesk-latin-wght-normal.woff2", "arrayBuffer").catch(() => null),
      pega("site/img/favicon.svg", "text").catch(() => ""), zipar ? pega("site/fonts/OFL-SpaceGrotesk.txt", "text").catch(() => "") : ""]);
    const FONTE = "space-grotesk-latin-wght-normal.woff2";
    // .html: a fonte vai dentro do arquivo (funciona sem internet); .zip: fica na pasta fonts/
    const estilo = (zipar || !fonte ? css.replace(/url\("\.\.\/fonts\/[^"]+"\)/, zipar ? `url("../fonts/${FONTE}")` : `url("${URL_SITE}site/fonts/${FONTE}")`)
      : css.replace(/url\("\.\.\/fonts\/[^"]+"\)/, `url("data:font/woff2;base64,${base64(fonte)}")`)) + "\n/* site gerado pelo Atlas */\n" + CSS_SITE;
    const marcaAtlas = `<span class="at-marca" aria-hidden="true">${icone("globe")}</span>`;
    const ids = o.partes.map((p, i) => `parte-${i + 1}-${nz(p.titulo).slice(0, 40) || "atlas"}`);
    const num = (i) => String(i + 1).padStart(2, "0");
    const nav = o.partes.map((p, i) => `<a href="#${ids[i]}">${esc(p.titulo)}</a>`).join("");
    const cards = o.partes.map((p, i) => `<a class="gs-card" href="#${ids[i]}"><span class="gs-n">${num(i)}</span><b>${esc(p.titulo)}</b>${p.sub ? `<span>${esc(p.sub)}</span>` : ""}${p.destaque ? `<strong>${esc(p.destaque[1])}</strong><small>${esc(p.destaque[0])}</small>` : p.resumo ? `<small>${esc(p.resumo)}</small>` : ""}</a>`).join("");
    const secoes = o.partes.map((p, i) => `<section class="gs-sec" id="${ids[i]}"><div class="gs-wrap"><header class="gs-cab"><span class="gs-n" aria-hidden="true">${num(i)}</span><div><h2>${esc(p.titulo)}</h2>${p.sub ? `<p>${esc(p.sub)}</p>` : ""}</div></header>
<div class="doc-corpo">${p.el.innerHTML}</div><p class="gs-subir"><a href="#inicio">↑ ${esc(T.gs_topo)}</a></p></div></section>`).join("\n");
    const lang = { PT: "pt-BR", EN: "en", ES: "es" }[A.state.lang];
    const icone_ = zipar ? "img/favicon.svg" : `data:image/svg+xml,${encodeURIComponent(favicon)}`;
    const pagina = `<!doctype html>
<html lang="${lang}" class="anim" data-locale="${esc(L.locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="description" content="${esc(T.gs_lead)}">
<meta name="generator" content="Atlas · Paraná Contra os Corruptos (${esc(URL_SITE)})">
<meta property="og:title" content="${esc(o.titulo)}">
<meta property="og:description" content="${esc(T.gs_lead)}">
<title>${esc(o.titulo)}</title>
${favicon || zipar ? `<link rel="icon" href="${esc(icone_)}">` : ""}
<script>${TEMA_SITE}<\/script>
${zipar ? `<link rel="stylesheet" href="css/estilo.css">` : `<style>${estilo}</style>`}
</head>
<body class="doc-pagina gs">
<a class="skip" href="#conteudo">${esc(T.gs_pular)}</a>
<header class="gs-top"><div class="gs-faixa"></div>
<div class="gs-wrap gs-barra"><a class="gs-marca" href="#inicio">${marcaAtlas}<span><b>${esc(o.titulo)}</b><small>Atlas · Paraná Contra os Corruptos</small></span></a>
<button type="button" class="gs-tema" aria-label="${esc(T.gs_tema)}" title="${esc(T.gs_tema)}"><span class="i-sol">${icone("sun")}</span><span class="i-lua">${icone("moon")}</span></button></div>
${o.partes.length > 1 ? `<nav class="gs-nav" aria-label="${esc(T.gs_nav)}"><div class="gs-wrap">${nav}</div></nav>` : ""}
</header>
<main class="gs-main" id="conteudo">
<section class="gs-hero" id="inicio"><div class="gs-wrap">
<p class="gs-kicker">${esc(T.gs_kicker)}</p>
<h1>${esc(o.titulo)}</h1>
<p class="gs-lead">${esc(T.gs_lead)}</p>
<p class="gs-meta">${esc(quando)} · ${esc(T.gs_partes(o.partes.length))}</p>
<p class="doc-selo">${esc(L.badge)}</p>
${o.partes.length > 1 ? `<p class="gs-resumo-t">${esc(T.gs_neste)}</p><div class="gs-resumo">${cards}</div>` : ""}
</div></section>
${secoes}
</main>
<footer class="gs-rod"><div class="gs-wrap">
<div class="gs-selo">${marcaAtlas}<span><b>${esc(T.gs_por)}</b><span>${esc(T.gs_feito(quando))}</span></span></div>
<p>${esc(T.gs_fonte)}</p>
<p>${esc(L.badge)}</p>
<p><a href="${esc(URL_SITE)}" target="_blank" rel="noopener">${esc(URL_SITE.replace(/^https:\/\/|\/$/g, ""))}</a> · <a href="${esc(URL_SITE + "#/atlas")}" target="_blank" rel="noopener">${esc(T.gs_atlas)}</a></p>
</div></footer>
${zipar ? `<script src="js/site.js"><\/script>` : `<script>${SCRIPT_DOC}\n${SCRIPT_SITE}<\/script>`}
</body>
</html>
`;
    const nome = `${(nz(o.titulo) || "site-atlas").slice(0, 50)}-${new Date().toISOString().slice(0, 10)}`;
    if (!zipar) return baixar(`${nome}.html`, pagina, "text/html;charset=utf-8");
    const dados = { titulo: o.titulo, gerado: new Date().toISOString(), por: "Atlas · Paraná Contra os Corruptos", site: URL_SITE, aviso: L.badge, fonte: T.gs_fonte,
      partes: o.partes.map((p, i) => ({ id: ids[i], titulo: p.titulo, sub: p.sub || "", blocos: modelo([p.el]).map((b) => (b.el ? Object.assign({}, b, { el: undefined }) : b)) })) };
    const arquivos = [
      { nome: `${nome}/index.html`, dados: pagina },
      { nome: `${nome}/css/estilo.css`, dados: estilo },
      { nome: `${nome}/js/site.js`, dados: `/* ${T.gs_por} · ${URL_SITE} */\n${SCRIPT_DOC}\n${SCRIPT_SITE}\n` },
      { nome: `${nome}/dados/respostas.json`, dados: JSON.stringify(dados, null, 2) },
      { nome: `${nome}/README.md`, dados: T.gs_leia(o.titulo, quando) },
    ];
    if (favicon) arquivos.push({ nome: `${nome}/img/favicon.svg`, dados: favicon });
    if (fonte) arquivos.push({ nome: `${nome}/fonts/${FONTE}`, dados: new Uint8Array(fonte) });
    if (ofl) arquivos.push({ nome: `${nome}/fonts/OFL-SpaceGrotesk.txt`, dados: ofl });
    return baixar(`${nome}.zip`, zip(arquivos));
  }

  // --- gerar um formato a partir da fonte --------------------------------------------------------------------------------------
  // fonte: { elementos: [Element], meta: { titulo, sub, kicker, url, arquivo } }
  async function gerar(fmt, fonte) {
    const quando = new Intl.DateTimeFormat(t().locale, { dateStyle: "long", timeStyle: "short" }).format(new Date());
    const meta = Object.assign({ quando }, fonte.meta);
    const M = { meta, blocos: modelo(fonte.elementos) };
    if (fmt === "slides") return apresentacao(M);
    if (fmt === "pptx") { await prepararImagens(M); return baixar(nomeArq(meta, "pptx"), pptx(M)); }
    if (fmt === "docx") return baixar(nomeArq(meta, "docx"), await docx(M));
    if (fmt === "xlsx") return baixar(nomeArq(meta, "xlsx"), xlsx(M));
    if (fmt === "csv") return baixar(nomeArq(meta, "csv"), csv(M), "text/csv;charset=utf-8");
    if (fmt === "txt") return baixar(nomeArq(meta, "txt"), texto(M), "text/plain;charset=utf-8");
    if (fmt === "md") return baixar(nomeArq(meta, "md"), markdown(M), "text/markdown;charset=utf-8");
    if (fmt === "json") return baixar(nomeArq(meta, "json"), json(M), "application/json");
    if (fmt === "png") { const b = await imagemLonga(M); return baixar(b.partes ? nomeArq(meta, "zip").replace(/\.zip$/, "-imagens.zip") : nomeArq(meta, "png"), b); }
    throw new Error(fmt);
  }

  // --- janela de exportação ------------------------------------------------------------------------------------------------
  // o: { titulo, escopos: [{ k, rot }], fonte(k) → fonte, pdf(k), html(k), extra: [{ k, ic, rot, sub, fn(k) }] }
  function abrir(o) {
    const X = E();
    let esc_ = o.escopos[0].k;
    const d = A.ferramentas.janela(X.title, `<p class="small muted">${esc(X.sub)}</p>
      ${o.escopos.length > 1 ? `<div class="ex-esc" role="radiogroup" aria-label="${esc(X.scope)}">${o.escopos.map((e, i) => `<label><input type="radio" name="ex-esc" value="${e.k}"${i ? "" : " checked"}><span>${esc(e.rot)}</span></label>`).join("")}</div>` : ""}
      <div class="ex-grid">${FORMATOS.map(([k, ic]) => `<button type="button" class="ex-f" data-ex="${k}">${icone(ic)}<span><b>${esc(X.f[k][0])}</b><small>${esc(X.f[k][1])}</small></span></button>`).join("")}${(o.extra || []).map((x) => `<button type="button" class="ex-f" data-ex-extra="${x.k}">${icone(x.ic)}<span><b>${esc(x.rot)}</b><small>${esc(x.sub)}</small></span></button>`).join("")}</div>
      <p class="small ex-st" aria-live="polite"></p>`, "dlg-ex");
    const st = d.querySelector(".ex-st");
    d.addEventListener("change", (e) => { if (e.target.name === "ex-esc") esc_ = e.target.value; });
    d.addEventListener("click", async (e) => {
      const xb = e.target.closest("[data-ex-extra]");
      if (xb) { const x = o.extra.find((y) => y.k === xb.dataset.exExtra); d.close(); setTimeout(() => x.fn(esc_), 120); return; }
      const b = e.target.closest("[data-ex]"); if (!b || b.disabled) return;
      const k = b.dataset.ex;
      if (k === "pdf") { d.close(); setTimeout(() => o.pdf(esc_), 120); return; }
      $$("[data-ex]", d).forEach((x) => { x.disabled = true; });
      b.classList.add("on"); st.textContent = X.wait;
      try {
        if (k === "html") await o.html(esc_);
        else await gerar(k, o.fonte(esc_));
        st.textContent = X.done(X.f[k][0]);
      } catch (err) { console.error(err); st.textContent = `${X.err} (${err.message})`; }
      finally { $$("[data-ex]", d).forEach((x) => { x.disabled = false; }); b.classList.remove("on"); }
    });
    return d;
  }

  // Página atual: título, subtítulo e o conteúdo principal
  function fontePagina() {
    const L = t(), main = $("#main"), h1 = main.querySelector("h1");
    const sr = h1 && h1.querySelector(".sr-only");
    const titulo = limpo(sr ? sr.textContent : h1 ? txt(h1) : document.title.split(" · ")[0]) || L.brand;
    const lead = main.querySelector(".page-head .lead"), kick = main.querySelector(".page-head .kicker");
    const url = URL_SITE + (location.hash && location.hash !== "#/" ? location.hash : "");
    const els = Array.from(main.children).filter((c) => !c.matches(".print-head"));
    return { elementos: els, meta: { titulo, sub: lead ? limpo(txt(lead)) : "", kicker: kick ? limpo(txt(kick)) : L.brand, url, arquivo: titulo } };
  }
  function exportarPagina() {
    const X = E();
    abrir({ titulo: X.title, escopos: [{ k: "pagina", rot: X.page }], fonte: fontePagina, pdf: () => A.ferramentas.imprimirPagina(), html: () => paginaHtml(fontePagina().meta) });
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-export]")) exportarPagina(); });

  A.exportar = { abrir, gerar, modelo, htmlInterativo, siteEstatico, exportarPagina, fontePagina, carrossel, numero, zip, FORMATOS, _paginar: paginar };
})();
