/* Motor de respostas do Atlas: busca aproximada numa base de perguntas e respostas, no navegador.
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

  const B = { lang: "PT", kb: null, idx: null, byId: {}, carregando: null, iniciado: false };
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

  const L = () => window.I18N[B.lang];

  function carregar() {
    if (B.kb) return Promise.resolve();
    if (!B.carregando) {
      B.carregando = fetch(`site/data/kb_${B.lang.toLowerCase()}.json`).then((r) => r.json()).then((kb) => {
        B.kb = kb; B.byId = {}; kb.forEach((e) => { B.byId[e.i] = e; }); B.idx = indexar(kb);
      }).finally(() => { B.carregando = null; });
    }
    return B.carregando;
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

  async function pensando(etapas, trabalho, log) {
    const ms = 5000 + Math.random() * 1000;
    const seq = etapas.map(sortear);
    if (Math.random() < 0.5) seq.splice(-1, 0, sortear(L().bot_think_wait));
    const pesos = seq.map(() => 0.75 + Math.random() * 0.6), soma = pesos.reduce((a, b) => a + b);
    const d = document.createElement("div");
    d.className = "msg msg-bot msg-typing";
    d.innerHTML = `<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    const etapa = (txt) => { d.querySelector(".typing-txt")?.remove(); d.insertAdjacentHTML("beforeend", `<span class="typing-txt">${window.APP.esc(txt)}</span>`); };
    etapa(seq[0]);
    let t = 0;
    const tms = seq.slice(1).map((txt, i) => setTimeout(() => etapa(txt), (t += (ms * pesos[i]) / soma)));
    try { return (await Promise.all([trabalho, aguardar(ms)]))[0]; } finally { tms.forEach(clearTimeout); d.remove(); }
  }

  // Resposta "digitada": o texto aparece aos poucos, com cursor piscando, e os
  // botões surgem na ordem em que estão. Tocar na resposta mostra tudo de uma vez.
  async function digitar(d, log, atomos = "button, svg, img, .chips") {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const passos = [];
    const andar = (n) => {
      for (const c of [...n.childNodes]) {
        if (c.nodeType === 3 && c.nodeValue.trim()) { passos.push({ t: c, txt: c.nodeValue }); c.nodeValue = ""; }
        else if (c.nodeType === 1) {
          const bloco = c.matches(atomos);
          passos.push({ el: c, disp: c.style.display, bloco });
          c.style.display = "none";
          if (!bloco) andar(c);
        }
      }
    };
    andar(d);
    const N = passos.reduce((a, x) => a + (x.txt ? x.txt.length : 0), 0) || 1;
    const vel = N / Math.min(7000, Math.max(900, N * 12));
    const cursor = document.createElement("span");
    cursor.className = "caret"; cursor.setAttribute("aria-hidden", "true");
    const topo = Math.max(0, d.offsetTop - log.offsetTop - 12);
    let pular = false, seguir = true;
    const pare = () => { pular = true; }, solto = () => { seguir = false; };
    d.addEventListener("click", pare);
    log.addEventListener("wheel", solto, { passive: true });
    log.addEventListener("touchmove", solto, { passive: true });
    log.setAttribute("aria-busy", "true");
    try {
      // a cada "tique" escreve algumas letras, passando de um trecho para o próximo
      let k = 0, i = 0;
      while (k < passos.length && !pular) {
        const tick = 28 + Math.random() * 24;
        let resto = Math.max(1, Math.round(vel * tick)), pausa = 0;
        while (resto > 0 && k < passos.length && !pausa) {
          const x = passos[k];
          if (x.el) { x.el.style.display = x.disp; if (x.bloco) x.el.animate([{ opacity: 0 }, { opacity: 1 }], 250); k++; continue; }
          let j = Math.min(x.txt.length, i + resto);
          // pausa curta no fim de cada frase
          const fim = x.txt.slice(i, j + 1).search(/[.!?]\s/);
          if (fim >= 0) { j = i + fim + 1; pausa = (120 + Math.random() * 160) * Math.min(1, 400 / N); }
          x.t.nodeValue = x.txt.slice(0, j);
          x.t.after(cursor);
          resto -= j - i; i = j;
          if (i >= x.txt.length) { k++; i = 0; }
        }
        if (seguir) log.scrollTop = topo;
        await aguardar(tick + pausa);
      }
    } finally {
      passos.forEach((x) => { if (x.el) x.el.style.display = x.disp; else x.t.nodeValue = x.txt; });
      cursor.remove();
      d.removeEventListener("click", pare);
      log.removeEventListener("wheel", solto);
      log.removeEventListener("touchmove", solto);
      log.removeAttribute("aria-busy");
      if (seguir) log.scrollTop = topo;
    }
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

  // Saudação, "tudo bem?", obrigado e tchau (PT, EN e ES). Cada linha: [tipo, frase, pode vir antes de uma pergunta].
  // Frases que também são verbo ou pergunta ("salve o arquivo", "como está a seção") só valem quando a mensagem é só cortesia.
  const CORTESIA = [
    ["dia", "bo[mn] dia|bons dias|buen dia|buenos dias|good morning|morning", 1],
    ["tarde", "boa tarde|buenas tardes|good afternoon|afternoon", 1],
    ["noite", "boa noite|buenas noches|good evening|evening", 1],
    ["ola", "ola+|alo+|alou|hello+|hola+|buenas|saludos|greetings|howdy", 1],
    ["oi", "oi+e*|hi+|hey+|eae|eai|e ai|ei|opa|hiya", 1],
    ["oi", "salve|fala|yo", 0],
    ["como", "tudo bem|tudo bom|tudo certo|tudo joia|tudo tranquilo|tudo beleza|td bem|td bom|tdb|como vai(?: voce| vc)?|how are you(?: doing)?|how are things|como estas|como esta usted|todo bien", 1],
    ["como", "como (?:voce |vc )?esta(?: voce| vc)?|beleza|blz|suave|tranquilo|de boa|e voce|e vc|and you|y tu|y usted|how s it going|how is it going|what s up|whats up|wassup|sup|que tal|como te va|como andas", 0],
    ["obg", "(?:muito |muitissimo )?obrigad[oa]s?|obg|brigad[oa]|valeu|vlw|agradeco|(?:thank you|thanks)(?: (?:a lot|so much|very much))?|thx|ty|(?:muchas |mil )?gracias", 0],
    ["tchau", "tchau|xau|ate (?:mais|logo|breve|a proxima)|falou|flw|bye|goodbye|good bye|see you|see ya|adios|chao|hasta (?:luego|pronto|la proxima)|nos vemos", 0],
    ["", "atlas|bot|amigo|amiga|pessoal|galera|gente|todo mundo|a todos|todos|there|all|everyone|guys|ok|okay|okey|certo|entendi|show|legal|otimo|perfeito|great|perfect|cool|nice|vale|bueno|genial|perfecto|e|and|y|muito|very|tambem|too|tambien", 1],
  ].map(([k, f, p]) => [k, new RegExp(`^(?:${f})(?: |$)`), p]);
  const SAUDA = ["dia", "tarde", "noite", "ola", "oi", "como"];

  // null: não é cortesia. so: a mensagem é só cortesia. Senão "resto" é o texto original depois da saudação.
  function cortesia(texto) {
    const t = String(texto || "").trim();
    let n = norm(t);
    if (!n) return /👋|🙋|✋|🖐/u.test(t) ? { tipos: new Set(["oi"]), so: true } : /🙏/u.test(t) ? { tipos: new Set(["obg"]), so: true } : null;
    const tipos = new Set();
    let antes = true;
    for (let c; (c = CORTESIA.find(([, re]) => re.test(n)));) {
      if (c[0]) tipos.add(c[0]);
      if (!c[2]) antes = false;
      n = n.slice(n.match(c[1])[0].length);
    }
    if (!tipos.size) return null;
    if (!n) return { tipos, so: true };
    if (!antes || !SAUDA.some((k) => tipos.has(k))) return null;
    // tira do texto original as mesmas palavras que saíram do normalizado
    const k = norm(t).split(" ").length - n.split(" ").length;
    const resto = t.replace(new RegExp(`^(?:[^\\p{L}\\p{N}]*[\\p{L}\\p{N}]+){${k}}[^\\p{L}\\p{N}]*`, "u"), "");
    return resto ? { tipos, so: false, resto } : { tipos, so: true };
  }
  // Texto da resposta: devolve a saudação recebida; "completa" junta o convite (ou o tchau)
  function cortesiaTexto(c, completa, T = L().cort) {
    const p = [];
    const s = SAUDA.slice(0, 5).find((k) => c.tipos.has(k));
    if (s) p.push(T[s]);
    if (c.tipos.has("como")) p.push(T.como);
    if (completa) {
      if (c.tipos.has("obg")) p.push(T.obg);
      p.push(c.tipos.has("tchau") ? T.tchau : s || c.tipos.has("como") ? T.ajuda : T.mais);
    }
    return p.join(" ");
  }

  window.BOT = {
    iniciar(lang) {
      if (B.iniciado) return;
      B.iniciado = true; B.lang = lang; stopSet = new Set(STOP[lang]);
    },
    idioma(lang) {
      if (!B.iniciado || lang === B.lang) return;
      B.lang = lang; stopSet = new Set(STOP[lang]); B.kb = null; B.idx = null;
    },
    // a base, a busca e o jeito de pensar e escrever das respostas do Atlas
    motor: { carregar, buscar, md, rotulo, detectarSecao, cortesia, cortesiaTexto, norm, entrada: (id) => B.byId[id] },
    pensando, digitar,
    _buscar: async (q) => { await carregar(); return buscar(q).map((x) => [x.e.i, +x.sc.toFixed(2), +x.f.toFixed(2)]); },
  };
})();
