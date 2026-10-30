/* Bot da auditoria: busca aproximada numa base de perguntas e respostas, no navegador.
   Entradas com "ns" só respondem quando perguntadas e nunca viram sugestão. */
(function () {
  "use strict";

  const STOP = {
    PT: "a o as os um uma uns umas de da do das dos em no na nos nas por para pra pro com sem que qual quais quanto quantos quantas como e ou eu me meu minha voce voces ele ela isso isto esse essa este esta aqui ali la se ja so mais muito pouco ser foi era sao tem ter teve ha sobre entre ate apos pelo pela pelos pelas ao aos tambem nao sim fala fale diga dizer quero queria gostaria saber pode poderia favor ola oi".split(" "),
    EN: "a an the of in on at to for from with without by and or i me my you your it its this that these those is are was were be been do does did have has had what which who whom how about please can could would tell want know show give hi hello".split(" "),
    ES: "a el la los las un una unos unas de del en por para con sin que cual cuales cuanto cuantos cuantas como y o yo me mi mis tu usted ustedes es son fue era ser estar hay tiene tener sobre entre hasta pero tambien no si dime decir quiero queria saber puede podria favor hola".split(" "),
  };
  const SIN = {
    PT: { analise: "teste", analises: "teste", testes: "teste", vetor: "teste", vetores: "teste", primeiro: "1", primeira: "1", segundo: "2", segunda: "2",
      secoes: "secao", urnas: "urna", zonas: "zona", eleitores: "eleitor", fraudes: "fraude", fraudada: "fraude", fraudado: "fraude", roubada: "fraude",
      baixar: "download", downloads: "download", hashes: "hash", programa: "codigo", script: "codigo", motor: "codigo", rodar: "executar", rodo: "executar" },
    EN: { tests: "test", analysis: "test", analyses: "test", check: "test", checks: "test", first: "1", "1st": "1", second: "2", "2nd": "2",
      sections: "section", machines: "machine", zones: "zone", voters: "voter", rigged: "fraud", stolen: "fraud", downloads: "download", hashes: "hash",
      script: "code", engine: "code", program: "code", run: "execute", running: "execute" },
    ES: { pruebas: "prueba", analisis: "prueba", test: "prueba", primera: "1", primero: "1", segunda: "2", segundo: "2", secciones: "seccion", urnas: "urna",
      zonas: "zona", electores: "elector", fraudulenta: "fraude", robada: "fraude", descargar: "descarga", descargas: "descarga", hashes: "hash",
      script: "codigo", motor: "codigo", programa: "codigo", correr: "ejecutar" },
  };
  const NUMEROS = {
    PT: "zero um dois tres quatro cinco seis sete oito nove dez onze doze treze catorze quinze", EN: "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen",
    ES: "cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince",
  };
  const numerar = (nz, lang) => {
    const ws = NUMEROS[lang].split(" ");
    return nz.replace(/\b[a-z]+\b/g, (w) => { const i = ws.indexOf(w === "quatorze" ? "catorze" : w); return i > 1 || (i === 1 && lang !== "PT") ? String(i) : w; });
  };
  const UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO", "ZZ"];

  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ºª°]/g, " ").replace(/[^a-z0-9]+/g, " ")
    .replace(/\bsha (\d{3})\b/g, "sha$1").trim();

  const B = { lang: "PT", kb: null, idx: null, byId: {}, carregando: null, aberto: false, iniciado: false };
  let stopSet = new Set(STOP.PT);

  function tokens(s) {
    const sin = SIN[B.lang];
    return numerar(norm(s), B.lang).split(" ").filter((w) => w && !stopSet.has(w)).map((w) => {
      if (sin[w]) return sin[w];
      if (w.length > 4 && w.endsWith("s") && !/\d/.test(w)) w = w.slice(0, -1);
      return sin[w] || w;
    });
  }

  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let menor = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < menor) menor = cur[j];
      }
      if (menor > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  function similaridade(q, d) {
    if (q === d) return 1;
    if (/\d/.test(q) || /\d/.test(d)) return 0;
    if (q.length >= 4 && d.length >= 4 && (d.startsWith(q) || q.startsWith(d))) return 0.75;
    if (q.length >= 5 && d.length >= 5) { const mx = q.length >= 8 ? 2 : 1, l = lev(q, d, mx); if (l === 1) return 0.7; if (l === 2 && mx === 2) return 0.5; }
    return 0;
  }

  function indexar(kb) {
    const vocab = new Map(), frases = [];
    kb.forEach((e, i) => {
      const pesos = new Map();
      const add = (txt, w) => tokens(txt).forEach((tk) => { if ((pesos.get(tk) || 0) < w) pesos.set(tk, w); });
      e.q.forEach((q) => add(q, 3));
      if (e.k) add(e.k, 1.5);
      add(e.a.slice(0, 260).replace(/[`*#\[\]()]/g, " "), 0.4);
      pesos.forEach((w, tk) => { if (!vocab.has(tk)) vocab.set(tk, []); vocab.get(tk).push([i, w]); });
      frases.push(e.q.map((q) => tokens(q).join(" ")));
    });
    const N = kb.length;
    const idf = new Map();
    vocab.forEach((p, tk) => idf.set(tk, Math.log(1 + N / p.length)));
    return { vocab, idf, frases, termos: Array.from(vocab.keys()) };
  }

  function buscar(texto) {
    const I = B.idx, qt = [...new Set(tokens(texto))];
    if (!qt.length) return [];
    const contrib = new Map();
    qt.forEach((q, qi) => {
      I.termos.forEach((tk) => {
        const s = similaridade(q, tk);
        if (!s) return;
        const idf = I.idf.get(tk);
        I.vocab.get(tk).forEach(([e, w]) => {
          let c = contrib.get(e); if (!c) { c = { v: new Array(qt.length).fill(0), s: new Array(qt.length).fill(0) }; contrib.set(e, c); }
          const v = s * w * idf; if (v > c.v[qi]) c.v[qi] = v; if (s > c.s[qi]) c.s[qi] = s;
        });
      });
    });
    const qj = qt.join(" ");
    const nz = numerar(norm(texto), B.lang);
    const mt = nz.match(/\b(?:teste|test|prueba|analise|analisis|analysis|t)\s?0?(1[0-5]|[1-9])\b/);
    const tid = mt ? "T" + String(mt[1]).padStart(2, "0") : null;
    const res = [];
    contrib.forEach((cc, e) => {
      const c = cc.v;
      const soma = c.reduce((a, b) => a + b, 0);
      const cob = c.filter((x) => x > 0).length / qt.length;
      const fortes = cc.s.filter((x) => x >= 0.7).length;
      let sc = soma * (0.35 + 0.65 * cob);
      const fr = I.frases[e];
      if (fr.includes(qj)) sc += 6;
      else if (qt.length >= 2 && fr.some((f) => f.includes(qj) || (f.length > 3 && qj.includes(f)))) sc += 2.5;
      const ent = B.kb[e];
      if (tid && ent.x && ent.x.t) sc = ent.x.t === tid ? sc * 1.5 + 2 : sc * 0.15;
      res.push([sc, e, fortes / qt.length]);
    });
    res.sort((a, b) => b[0] - a[0]);
    return res.slice(0, 6).map(([sc, e, f]) => ({ sc, e: B.kb[e], f }));
  }

  // --- markdown simples e seguro -------------------------------------------------
  function md(src) {
    const esc = window.APP.esc;
    const blocos = [];
    src = src.replace(/```[a-z]*\n([\s\S]*?)```/g, (m, code) => { blocos.push(code.replace(/\n$/, "")); return `\u0000${blocos.length - 1}\u0000`; });
    const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const out = []; let lista = null, par = [];
    const fecharPar = () => { if (par.length) { out.push(`<p>${par.join("<br>")}</p>`); par = []; } };
    const fecharLista = () => { if (lista) { out.push(`<${lista.t}>${lista.itens.join("")}</${lista.t}>`); lista = null; } };
    src.split("\n").forEach((ln) => {
      const cb = ln.match(/^\u0000(\d+)\u0000$/);
      const ul = ln.match(/^(\s*)- (.*)$/), ol = ln.match(/^(\d+)\. (.*)$/);
      if (cb) {
        fecharPar(); fecharLista();
        const code = blocos[+cb[1]];
        out.push(`<div class="code"><pre><code>${esc(code)}</code></pre><button class="btn-copy" type="button" data-copy="${esc(code)}">${window.APP.icone("copy")}<span>${esc(window.APP.t().copy)}</span></button></div>`);
      } else if (ul) {
        fecharPar();
        if (!lista || lista.t !== "ul") { fecharLista(); lista = { t: "ul", itens: [] }; }
        lista.itens.push(`<li${ul[1].length >= 2 ? ' class="sub"' : ""}>${inline(ul[2])}</li>`);
      } else if (ol) {
        fecharPar();
        if (!lista || lista.t !== "ol") { fecharLista(); lista = { t: "ol", itens: [] }; }
        lista.itens.push(`<li>${inline(ol[2])}</li>`);
      } else if (!ln.trim()) { fecharPar(); fecharLista(); }
      else { fecharLista(); par.push(inline(ln)); }
    });
    fecharPar(); fecharLista();
    return out.join("");
  }

  // --- interface ------------------------------------------------------------------
  const L = () => window.I18N[B.lang];
  let el = {};
  // Voz: ouvir as respostas (síntese do navegador) e perguntar falando (reconhecimento de voz, quando existe)
  const VOZ = { PT: "pt-BR", EN: "en-US", ES: "es-ES" };
  const Reconhecer = window.SpeechRecognition || window.webkitSpeechRecognition;
  const podeFalar = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
  let ouvindo = null, falando = null;

  function pararFala() {
    if (podeFalar) window.speechSynthesis.cancel();
    if (falando) { falando.classList.remove("on"); falando.innerHTML = window.APP.icone("speaker"); falando.setAttribute("aria-label", L().bot_listen); falando = null; }
  }
  function falar(b) {
    if (falando === b) { pararFala(); return; }
    pararFala();
    const m = b.closest(".msg").cloneNode(true);
    m.querySelectorAll("button, .msg-src, .msg-rel, .chips, .code").forEach((x) => x.remove());
    const txt = m.textContent.replace(/\s+/g, " ").trim();
    if (!txt) return;
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = VOZ[B.lang];
    const v = window.speechSynthesis.getVoices().find((x) => x.lang && x.lang.replace("_", "-").toLowerCase().startsWith(VOZ[B.lang].slice(0, 2).toLowerCase()));
    if (v) u.voice = v;
    u.onend = u.onerror = () => { if (falando === b) pararFala(); };
    falando = b; b.classList.add("on"); b.innerHTML = window.APP.icone("stop"); b.setAttribute("aria-label", L().bot_stop);
    window.speechSynthesis.speak(u);
  }
  function microfone() {
    const T = L();
    if (ouvindo) { ouvindo.stop(); return; }
    const r = new Reconhecer();
    r.lang = VOZ[B.lang]; r.interimResults = true; r.maxAlternatives = 1;
    const mic = el.mic, antes = el.inp.placeholder;
    let final = "";
    r.onresult = (e) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) { txt += e.results[i][0].transcript; if (e.results[i].isFinal) final = txt; }
      el.inp.value = txt;
    };
    r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") msg(`<p>${window.APP.esc(T.bot_mic_denied)}</p>`, "bot"); };
    r.onend = () => {
      ouvindo = null; mic.classList.remove("on"); mic.setAttribute("aria-pressed", "false"); el.inp.placeholder = antes;
      const v = (final || el.inp.value).trim();
      if (v) { el.inp.value = ""; perguntar(v); }
    };
    ouvindo = r; mic.classList.add("on"); mic.setAttribute("aria-pressed", "true"); el.inp.placeholder = T.bot_mic_on;
    try { r.start(); } catch (e) { ouvindo = null; mic.classList.remove("on"); }
  }

  function criar() {
    const ic = window.APP.icone;
    const lan = document.createElement("button");
    lan.id = "bot-launcher"; lan.type = "button"; lan.className = "bot-launcher";
    lan.innerHTML = `${ic("chat")}<span class="bot-launcher-txt"></span>`;
    const bub = document.createElement("div");
    bub.id = "bot-bubble"; bub.className = "bot-bubble"; bub.hidden = true; bub.setAttribute("role", "status");
    const pan = document.createElement("div");
    pan.id = "bot"; pan.className = "bot"; pan.hidden = true; pan.setAttribute("role", "dialog"); pan.setAttribute("aria-labelledby", "bot-title");
    pan.innerHTML = `<header class="bot-head"><span class="bot-avatar" aria-hidden="true">${ic("chat")}</span>
        <div class="bot-head-txt"><h2 id="bot-title"></h2><p class="bot-sub"></p></div>
        <button type="button" class="bot-icon-btn bot-x">${ic("close")}</button></header>
      <div class="bot-log" role="log" aria-live="polite"></div>
      <form class="bot-form" autocomplete="off"><label class="sr-only" for="bot-in"></label>
        <input id="bot-in" type="text" maxlength="300" enterkeyhint="send">
        ${Reconhecer ? `<button type="button" class="bot-mic" aria-pressed="false">${ic("mic")}</button>` : ""}
        <button type="submit" class="bot-send">${ic("send")}</button></form>`;
    document.body.append(bub, lan, pan);
    el = { lan, bub, pan, log: pan.querySelector(".bot-log"), form: pan.querySelector(".bot-form"), inp: pan.querySelector("#bot-in"), x: pan.querySelector(".bot-x"), mic: pan.querySelector(".bot-mic") };
    if (el.mic) el.mic.addEventListener("click", microfone);
    lan.addEventListener("click", () => (B.aberto ? fechar() : abrir()));
    el.x.addEventListener("click", fechar);
    el.form.addEventListener("submit", (e) => { e.preventDefault(); const v = el.inp.value.trim(); if (v) { el.inp.value = ""; perguntar(v); } });
    pan.addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(); });
    el.log.addEventListener("click", (e) => {
      const fa = e.target.closest(".msg-speak"); if (fa) { falar(fa); return; }
      const c = e.target.closest("[data-q]"); if (c) { perguntar(c.dataset.q); return; }
      const i = e.target.closest("[data-id]");
      if (i) {
        const en = B.byId[i.dataset.id];
        ocupar(async () => { msg(window.APP.esc(rotulo(en)), "user"); await pensando(L().bot_think_qa); mostrarEntrada(en); });
        return;
      }
      const g = e.target.closest("[data-go]"); if (g) { location.hash = g.dataset.go; if (window.matchMedia("(max-width: 640px)").matches) fechar(); }
    });
    bub.addEventListener("click", (e) => {
      if (e.target.closest(".bubble-x")) { fecharBalao(true); return; }
      if (e.target.closest(".bubble-go")) abrir();
    });
    textos();
  }

  function textos() {
    const T = L();
    el.lan.querySelector(".bot-launcher-txt").textContent = T.launcher;
    el.lan.setAttribute("aria-label", T.launcher_aria);
    el.lan.setAttribute("aria-expanded", String(B.aberto));
    el.lan.setAttribute("aria-controls", "bot");
    el.pan.querySelector("#bot-title").textContent = T.bot_title;
    el.pan.querySelector(".bot-sub").textContent = T.bot_sub;
    el.x.setAttribute("aria-label", T.bot_close);
    el.pan.querySelector("label[for=bot-in]").textContent = T.bot_ph;
    el.inp.placeholder = T.bot_ph;
    el.pan.querySelector(".bot-send").setAttribute("aria-label", T.bot_send);
    if (el.mic) { el.mic.setAttribute("aria-label", T.bot_mic); el.mic.title = T.bot_mic; }
    el.bub.innerHTML = `<p>${T.bubble}</p><div class="bubble-actions"><button type="button" class="btn btn-bot btn-sm bubble-go">${window.APP.esc(T.bubble_btn)}</button></div>
      <button type="button" class="bubble-x" aria-label="${window.APP.esc(T.bubble_close)}">${window.APP.icone("close")}</button>`;
  }

  function carregar() {
    if (B.kb) return Promise.resolve();
    if (!B.carregando) {
      B.carregando = fetch(`site/data/kb_${B.lang.toLowerCase()}.json`).then((r) => r.json()).then((kb) => {
        B.kb = kb; B.byId = {}; kb.forEach((e) => { B.byId[e.i] = e; }); B.idx = indexar(kb);
      }).finally(() => { B.carregando = null; });
    }
    return B.carregando;
  }

  function msg(html, quem) {
    const d = document.createElement("div");
    d.className = "msg msg-" + quem;
    d.innerHTML = html;
    if (quem === "bot" && podeFalar) d.insertAdjacentHTML("beforeend", `<button type="button" class="msg-speak" aria-label="${window.APP.esc(L().bot_listen)}" title="${window.APP.esc(L().bot_listen)}">${window.APP.icone("speaker")}</button>`);
    el.log.appendChild(d);
    // Resposta longa: mostra o começo dela; pergunta: rola até o fim
    el.log.scrollTop = quem === "bot" ? Math.max(0, d.offsetTop - el.log.offsetTop - 12) : el.log.scrollHeight;
    return d;
  }

  function chips(itens) {
    if (!itens.length) return "";
    return `<div class="chips">${itens.map((c) => c.id ? `<button type="button" class="chipq" data-id="${c.id}">${window.APP.esc(c.txt)}</button>`
      : `<button type="button" class="chipq" data-q="${window.APP.esc(c.txt)}">${window.APP.esc(c.txt)}</button>`).join("")}</div>`;
  }

  const rotulo = (e) => { const q = e.q[0]; return q.charAt(0).toUpperCase() + q.slice(1) + (/[?]$/.test(q) ? "" : "?"); };

  // Antes de responder: três pontinhos e as etapas da busca, trocando uma a uma.
  // Cada etapa sorteia uma frase do seu grupo (nunca a mesma da vez anterior),
  // às vezes entra um "Só um momento…" e cada frase fica um tempo diferente.
  // Dura de 5 a 6 s, ou até o "trabalho" (se houver) terminar.
  const aguardar = (ms) => new Promise((r) => setTimeout(r, ms));
  const ultima = new Map();
  function sortear(grupo) {
    const op = grupo.length > 1 ? grupo.filter((x) => x !== ultima.get(grupo)) : grupo;
    const x = op[Math.floor(Math.random() * op.length)];
    ultima.set(grupo, x);
    return x;
  }

  async function pensando(etapas, trabalho) {
    const ms = 5000 + Math.random() * 1000;
    const seq = etapas.map(sortear);
    if (Math.random() < 0.5) seq.splice(-1, 0, sortear(L().bot_think_wait));
    const pesos = seq.map(() => 0.75 + Math.random() * 0.6), soma = pesos.reduce((a, b) => a + b);
    const d = document.createElement("div");
    d.className = "msg msg-bot msg-typing";
    d.innerHTML = `<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
    el.log.appendChild(d);
    el.log.scrollTop = el.log.scrollHeight;
    const etapa = (txt) => { d.querySelector(".typing-txt")?.remove(); d.insertAdjacentHTML("beforeend", `<span class="typing-txt">${window.APP.esc(txt)}</span>`); };
    etapa(seq[0]);
    let t = 0;
    const tms = seq.slice(1).map((txt, i) => setTimeout(() => etapa(txt), (t += (ms * pesos[i]) / soma)));
    try { return (await Promise.all([trabalho, aguardar(ms)]))[0]; } finally { tms.forEach(clearTimeout); d.remove(); }
  }

  // Uma resposta por vez: enquanto o bot "escreve", o envio fica bloqueado
  async function ocupar(fn) {
    if (B.ocupado) return;
    const env = el.form.querySelector(".bot-send");
    B.ocupado = true; env.disabled = true;
    try { await fn(); } finally { B.ocupado = false; env.disabled = false; }
  }

  function mostrarEntrada(e, extras) {
    const T = L(), esc = window.APP.esc;
    let h = md(e.a);
    if (e.act && e.act.go) h += `<p><button type="button" class="btn btn-sm" data-go="${esc(e.act.go)}">${esc(T.bot_open)}</button></p>`;
    h += `<p class="msg-src">${esc(T.bot_source)}: ${esc(e.s)}</p>`;
    const rel = [];
    (e.r || []).forEach((id) => { if (B.byId[id] && !B.byId[id].ns && rel.length < 4) rel.push({ id, txt: rotulo(B.byId[id]) }); });
    (extras || []).forEach((x) => { if (x.i !== e.i && !x.ns && !rel.some((r) => r.id === x.i) && rel.length < 5) rel.push({ id: x.i, txt: rotulo(x) }); });
    if (rel.length) h += `<p class="msg-rel">${esc(T.bot_related)}:</p>` + chips(rel);
    msg(h, "bot");
  }

  function detectarSecao(texto) {
    let nz = " " + norm(texto) + " ";
    const mz = nz.match(/\b(?:zona|zone|zn)\s*(\d{1,4})\b/);
    const ms = nz.match(/\b(?:secao|section|seccion|sec|se)\s*(\d{1,4})\b/);
    if (!mz && !ms) return null;
    nz = nz.replace(/\b(?:zona|zone|zn)\s*\d{1,4}\b/, " ").replace(/\b(?:secao|section|seccion|sec|se)\s*\d{1,4}\b/, " ");
    let uf = null;
    const orig = String(texto).replace(/\b(?:zona|zone|zn|se[cç][aã]o|section|secci[oó]n|sec|se)\s*\d{1,4}\b/gi, " ").match(/\b[A-Za-z]{2}\b/g) || [];
    uf = orig.find((tk) => tk === tk.toUpperCase() && UFS.includes(tk)) || null;
    if (!uf) { const tk = orig.find((x) => UFS.includes(x.toUpperCase()) && !stopSet.has(x.toLowerCase())); if (tk) uf = tk.toUpperCase(); }
    if (!uf) {
      for (const [sig, nome] of Object.entries(window.UF_NOMES)) {
        const nm = typeof nome === "string" ? nome : nome[B.lang];
        if (nz.includes(" " + norm(nm) + " ")) { uf = sig; break; }
      }
    }
    return { uf, z: mz ? +mz[1] : null, s: ms ? +ms[1] : null };
  }

  async function responderSecao(p) {
    const T = L(), A = window.APP, esc = A.esc;
    if (!p.z || !p.s || !p.uf) { await pensando([T.bot_think_qa[0], T.bot_think_sec[0]]); msg(!p.z || !p.s ? T.bot_need_zs : T.bot_need_uf, "bot"); return; }
    const d = await pensando(T.bot_think_sec, A.consultarSecao(p.uf, p.z, p.s));
    const I = window.I18N[B.lang];
    if (d.erro === "zona") { msg(esc(I.lk_nozone), "bot"); return; }
    if (d.erro === "secao") {
      let h = `<p>${esc(I.lk_nosec)}</p>`;
      if (d.agregadaEm.length) h += `<p>${esc(I.lk_agg_hint(d.s))} ${d.agregadaEm.map((x) => `<button type="button" class="chipq" data-q="${esc(`${d.uf} zona ${d.z} secao ${x}`)}">${esc(x)}</button>`).join(" ")}</p>`;
      msg(h, "bot"); return;
    }
    const rec = d.rec, flags = rec[3] || {};
    let h = `<p><b>${esc(d.uf)} · ${esc(A.titulo(d.mun[1]))} · ${esc(I.th_zone)} ${d.z} · ${esc(I.th_section)} ${d.s}</b></p>`;
    [2, 1].forEach((n) => {
      const tv = rec[n];
      h += `<p><b>${esc(I.round(n))}</b><br>`;
      if (!tv) h += esc(I.lk_nodata);
      else {
        const { v, nomes } = A.votosTurno(n, tv);
        const cands = Object.keys(v).filter((nr) => nr !== "95" && nr !== "96" && v[nr] > 0).sort((a, b) => v[b] - v[a]);
        const val = cands.reduce((a, nr) => a + v[nr], 0) || 1;
        h += `${esc(I.lk_aptos)}: ${A.nf(tv[0])} · ${esc(I.lk_comp)}: ${A.nf(tv[1])} (${A.pct(tv[1] / tv[0], 1)})<br>`;
        h += cands.slice(0, n === 1 ? 4 : 2).map((nr) => `${esc(A.titulo(nomes[nr]))}: ${A.nf(v[nr])} (${A.pct(v[nr] / val, 1)})`).join(" · ");
        h += `<br>${esc(I.blank)}: ${A.nf(v["95"] || 0)} · ${esc(I.null_)}: ${A.nf(v["96"] || 0)}<br>`;
        h += `${esc(I.lk_open)} ${A.hora(tv[2])} · ${esc(I.lk_close)} ${A.hora(tv[3])} (${esc(I.lk_local)})`;
      }
      const f = flags[String(n)];
      if (f && f.o.length) h += `<br>${esc(I.lk_flags)}: ` + f.o.map((o) => `${o[1] === "a" ? "🔴" : "🟡"} ${A.numTeste(o[0])}. ${esc(A.nomeTeste(o[0]))}`).join("; ");
      else h += `<br>${esc(I.lk_flags)}: 🟢 ${esc(I.lk_noflags)}`;
      h += "</p>";
    });
    h += `<p><button type="button" class="btn btn-sm" data-go="#/secao/${d.uf}/${d.z}/${d.s}">${esc(I.bot_sec_details)}</button></p>`;
    h += `<p class="msg-src">${esc(I.bot_source)}: ${esc(I.bot_sec_src)}</p>`;
    msg(h, "bot");
  }

  function perguntar(texto) {
    if (B.ocupado) { el.inp.value = texto; return; }
    ocupar(() => responder(texto));
  }

  async function responder(texto) {
    const T = L(), esc = window.APP.esc;
    msg(esc(texto), "user");
    const sec = detectarSecao(texto);
    if (sec && (sec.z || (sec.s && sec.uf)) && !/\b(relatorio|report|informe)\b/.test(norm(texto))) { await responderSecao(sec); return; }
    try { await carregar(); } catch (e) { msg(`<p class="alert">Erro: ${esc(e.message)}</p>`, "bot"); return; }
    const r = buscar(texto);
    if (!r.length || r[0].sc < 4 || r[0].f < 0.34) {
      const sug = r.filter((x) => x.f > 0 && !x.e.ns).slice(0, 3).map((x) => ({ id: x.e.i, txt: rotulo(x.e) }));
      const top = sug.length ? sug : T.bot_fallback_topics.map((x) => ({ txt: x }));
      await pensando([T.bot_think_qa[0], T.bot_think_qa[1], ...T.bot_think_none]);
      msg(`<p>${esc(sug.length ? T.bot_maybe : T.bot_fallback)}</p>` + chips(top), "bot");
      return;
    }
    const outros = r.slice(1, 3).filter((x) => x.sc >= r[0].sc * 0.75).map((x) => x.e);
    await pensando(T.bot_think_qa);
    mostrarEntrada(r[0].e, outros);
  }

  function saudacao() {
    const T = L();
    el.log.innerHTML = "";
    msg(`<p>${T.bot_hello}</p>` + chips(T.bot_starters.map((x) => ({ txt: x }))), "bot");
  }

  function abrir(pergunta) {
    fecharBalao(false);
    if (!B.aberto) {
      B.aberto = true; el.pan.hidden = false; document.body.classList.add("bot-open");
      el.lan.setAttribute("aria-expanded", "true");
      if (!el.log.childElementCount) saudacao();
      carregar().catch(() => {});
    }
    if (pergunta) perguntar(pergunta);
    setTimeout(() => el.inp.focus(), 30);
  }

  function fechar() {
    pararFala(); if (ouvindo) ouvindo.abort();
    B.aberto = false; el.pan.hidden = true; document.body.classList.remove("bot-open");
    el.lan.setAttribute("aria-expanded", "false"); el.lan.focus();
  }

  function fecharBalao(lembrar) {
    el.bub.hidden = true;
    if (lembrar) { try { sessionStorage.setItem("bot-bubble", "1"); } catch (e) { /* sem armazenamento */ } }
  }

  function balao() {
    let visto = false;
    try { visto = sessionStorage.getItem("bot-bubble") === "1"; } catch (e) { /* sem armazenamento */ }
    if (visto) return;
    setTimeout(() => { if (!B.aberto) el.bub.hidden = false; }, 1500);
  }

  window.BOT = {
    iniciar(lang) {
      if (B.iniciado) return;
      B.iniciado = true; B.lang = lang; stopSet = new Set(STOP[lang]);
      criar(); balao();
    },
    idioma(lang) {
      if (!B.iniciado || lang === B.lang) return;
      pararFala();
      B.lang = lang; stopSet = new Set(STOP[lang]); B.kb = null; B.idx = null;
      textos(); saudacao();
      if (B.aberto) carregar().catch(() => {});
    },
    abrir: (q) => { if (B.iniciado) abrir(q); },
    _buscar: async (q) => { await carregar(); return buscar(q).map((x) => [x.e.i, +x.sc.toFixed(2), +x.f.toFixed(2)]); },
  };
})();
