/* Ferramentas gerais do site: compartilhar, imagem para redes, imprimir, avisar erro, seções salvas,
   busca, acessibilidade (fonte, contraste, Libras), app instalável e contador de visitas. */
(function () {
  "use strict";

  const A = window.APP;
  const { esc, icone, $, $$ } = A;
  const t = () => A.t();
  const URL_SITE = "https://paranacontraoscorruptos.github.io/eleicoes2026brasil/";
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

  async function compartilhar(site) {
    const L = t();
    const url = site ? URL_SITE : urlPagina();
    const titulo = site ? L.hero_title : document.title;
    const texto = L.sh_text;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ title: titulo, text: texto, url }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const u = encodeURIComponent(url), tx = encodeURIComponent(texto + " " + url), tt = encodeURIComponent(texto);
    const redes = [["WhatsApp", `https://wa.me/?text=${tx}`, "chat"], ["Telegram", `https://t.me/share/url?url=${u}&text=${tt}`, "tg"],
      ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`, "share"], ["X", `https://twitter.com/intent/tweet?url=${u}&text=${tt}`, "share"],
      [L.sh_email, `mailto:?subject=${encodeURIComponent(titulo)}&body=${tx}`, "file"]];
    const d = janela(L.sh_title, `<p class="small muted">${esc(titulo)}</p>
      <div class="sh-grid">${redes.map(([n, h, ic]) => `<a class="btn" href="${h}" target="_blank" rel="noopener">${icone(ic)} ${esc(n)}</a>`).join("")}</div>
      <div class="sh-link"><input type="text" readonly value="${esc(url)}" aria-label="${esc(L.sh_link)}"><button class="btn btn-primary" type="button" data-cp>${icone("link")} ${esc(L.sh_copy)}</button></div>`);
    d.querySelector("[data-cp]").addEventListener("click", async (e) => {
      const ok = await copiarTexto(url);
      e.currentTarget.lastChild.textContent = " " + (ok ? L.copied : L.sh_copy);
    });
  }

  // --- imagem para redes sociais (canvas 1080 × 1350) ----------------------------------------------------------
  function quebrar(ctx, txt, larg) {
    const ps = String(txt).split(" "), linhas = [];
    let at = "";
    ps.forEach((p) => { const x = at ? at + " " + p : p; if (ctx.measureText(x).width > larg && at) { linhas.push(at); at = p; } else at = x; });
    if (at) linhas.push(at);
    return linhas;
  }

  async function desenharCartao(c) {
    const L = t(), W = 1080, H = 1350, P = 80;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const disp = '"Space Grotesk", system-ui, sans-serif', sans = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
    try { await Promise.all([document.fonts.load(`700 60px ${disp}`), document.fonts.load(`600 30px ${disp}`)]); } catch (e) { /* usa a fonte do sistema */ }
    // fundo
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
    // marca
    ctx.fillStyle = "#009c3b"; ctx.beginPath(); ctx.roundRect(P, 70, 64, 64, 16); ctx.fill();
    ctx.strokeStyle = "#ffdf00"; ctx.lineWidth = 6; ctx.lineCap = "round";
    [[16, 48, 28], [26.6, 48, 16], [37.4, 48, 32], [48, 48, 38]].forEach(([x, y1, y2]) => { ctx.beginPath(); ctx.moveTo(P + x, 70 + y1); ctx.lineTo(P + x, 70 + y2); ctx.stroke(); });
    ctx.fillStyle = "#eef6f0"; ctx.font = `700 38px ${disp}`; ctx.textBaseline = "alphabetic"; ctx.fillText(L.brand, P + 86, 106);
    ctx.fillStyle = "#ffd84d"; ctx.font = `600 20px ${sans}`; ctx.fillText(L.brand_sub.toUpperCase(), P + 88, 134);
    // título
    let y = 250;
    ctx.fillStyle = "#ffd84d"; ctx.font = `700 26px ui-monospace, Menlo, Consolas, monospace`;
    quebrar(ctx, String(c.kicker || "").toUpperCase(), W - 2 * P).slice(0, 2).forEach((l) => { ctx.fillText(l, P, y); y += 36; });
    y += 30;
    ctx.fillStyle = "#ffffff"; ctx.font = `700 64px ${disp}`;
    let tl = quebrar(ctx, c.titulo, W - 2 * P);
    if (tl.length > 3) { ctx.font = `700 52px ${disp}`; tl = quebrar(ctx, c.titulo, W - 2 * P).slice(0, 4); }
    tl.forEach((l) => { ctx.fillText(l, P, y); y += 72; });
    const bar = ctx.createLinearGradient(P, 0, P + 180, 0); bar.addColorStop(0, "#1fc35f"); bar.addColorStop(1, "#ffd400");
    ctx.fillStyle = bar; ctx.fillRect(P, y - 22, 180, 6);
    y += 40;
    // linhas
    const linhas = (c.linhas || []).slice(0, 14);
    const fim = H - 230, alt = Math.min(64, Math.max(44, (fim - y) / Math.max(1, linhas.length)));
    linhas.forEach(([rot, val]) => {
      const sub = /^\s\s/.test(rot), r = String(rot).trim();
      ctx.font = `${sub ? 400 : 600} ${sub ? 28 : 31}px ${sans}`; ctx.fillStyle = sub ? "#b8ccbf" : "#e3efe6";
      const xr = sub ? P + 28 : P;
      let rr = r; while (ctx.measureText(rr).width > 560 && rr.length > 4) rr = rr.slice(0, -2);
      if (rr !== r) rr = rr.trim() + "…";
      ctx.fillText(rr, xr, y);
      ctx.font = `700 ${sub ? 30 : 34}px ${disp}`; ctx.fillStyle = "#ffffff"; ctx.textAlign = "right";
      let vv = String(val); while (ctx.measureText(vv).width > W - 2 * P - 600 && vv.length > 4) vv = vv.slice(0, -2);
      ctx.fillText(vv, W - P, y); ctx.textAlign = "left";
      ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P, y + alt * 0.42); ctx.lineTo(W - P, y + alt * 0.42); ctx.stroke();
      y += alt;
    });
    // rodapé
    ctx.fillStyle = "rgba(255,212,0,.12)"; ctx.beginPath(); ctx.roundRect(P, H - 196, W - 2 * P, 54, 27); ctx.fill();
    ctx.fillStyle = "#ffd84d"; ctx.font = `600 24px ${sans}`; ctx.textAlign = "center"; ctx.fillText(L.badge, W / 2, H - 161);
    ctx.fillStyle = "#b8ccbf"; ctx.font = `500 23px ${sans}`;
    ctx.fillText(L.cd_src, W / 2, H - 104);
    ctx.fillStyle = "#eef6f0"; ctx.font = `600 25px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillText(URL_SITE.replace("https://", ""), W / 2, H - 64); ctx.textAlign = "left";
    return cv;
  }

  async function gerarImagem() {
    const L = t(), c = A.state.cartao;
    if (!c) return;
    const d = janela(L.im_title, `<p class="muted">${esc(L.lk_loading)}</p>`, "dlg-img");
    const cv = await desenharCartao(c);
    const blob = await new Promise((ok) => cv.toBlob(ok, "image/png"));
    const url = URL.createObjectURL(blob);
    const nome = "auditoria-bu-2026-" + (location.hash.replace(/^#\/?/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "inicio") + ".png";
    const arq = new File([blob], nome, { type: "image/png" });
    const podeEnviar = navigator.canShare && navigator.canShare({ files: [arq] });
    d.querySelector(".dlg-body").innerHTML = `<img class="im-prev" src="${url}" alt="${esc(c.titulo)}" width="540" height="675">
      <p class="small muted">${esc(L.im_note)}</p>
      <div class="btn-row"><a class="btn btn-primary" href="${url}" download="${esc(nome)}">${icone("download")} ${esc(L.im_dl)}</a>
      ${podeEnviar ? `<button class="btn" type="button" data-env>${icone("share")} ${esc(L.sh_btn)}</button>` : ""}</div>`;
    const b = d.querySelector("[data-env]");
    if (b) b.addEventListener("click", async () => { try { await navigator.share({ files: [arq], title: c.titulo, text: L.sh_text + " " + urlPagina() }); } catch (e) { /* cancelado */ } });
    d.addEventListener("close", () => setTimeout(() => URL.revokeObjectURL(url), 1000));
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
      await copiarTexto(ta.value);
      e.currentTarget.lastChild.textContent = " " + L.rep_copied;
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

  A.ferramentas = { compartilhar, gerarImagem, avisarErro, abrirBusca, painelA11y, instalar, desenharCartao, buscarNoIndice, indiceBusca };
})();
