/* Atlas na página: liga o motor (motor.js, de preferência em segundo plano no motor-worker.js), escreve as
   respostas (markdown simples, "pensando" e texto digitado) e guarda as perguntas que ficaram sem resposta.
   Entradas da base com "ns" só respondem quando perguntadas e nunca viram sugestão. */
(function () {
  "use strict";

  const M = () => window.MOTOR;
  const B = { lang: "PT", kb: null, byId: {}, carregando: null, iniciado: false, cfg: null };
  const norm = (s) => M().norm(s);

  // --- motor em segundo plano (Web Worker); sem ele, o mesmo motor roda na página ----------------------------------
  const W = { w: null, n: 0, esp: new Map() };
  function trabalhador() {
    if (W.w !== null) return W.w;
    try {
      if (!window.Worker || location.protocol === "file:") throw new Error("sem worker");
      W.w = new Worker("site/js/motor-worker.js");
      W.w.onmessage = (e) => { const p = W.esp.get(e.data.id); if (!p) return; W.esp.delete(e.data.id); clearTimeout(p[2]); if (e.data.erro) p[1](new Error(e.data.erro)); else p[0](e.data.r); };
      W.w.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); desistir(); };
    } catch (e) { W.w = false; }
    return W.w;
  }
  // O worker falhou: tudo passa a rodar na página
  function desistir() {
    if (W.w) { try { W.w.terminate(); } catch (e) { /* já parou */ } }
    W.w = false; B.cfg = null;
    W.esp.forEach((p) => { clearTimeout(p[2]); p[1](new Error("worker")); });
    W.esp.clear();
  }
  function chamar(tipo, d, ms) {
    const w = trabalhador();
    if (!w) return Promise.reject(new Error("worker"));
    return new Promise((ok, falha) => {
      const id = ++W.n;
      const tm = setTimeout(() => { if (W.esp.has(id)) { W.esp.delete(id); desistir(); falha(new Error("tempo")); } }, ms || 15000);
      W.esp.set(id, [ok, falha, tm]);
      w.postMessage({ id, tipo, d });
    });
  }
  const urlAbs = (u) => new URL(u, location.href).href;
  function candidatos() {
    const R = window.APP && window.APP.state.R, out = [];
    if (R) ["1", "2"].forEach((n) => R.turnos[n].presidente.candidatos.forEach((c) => { if (!out.some((x) => x.nr === c.nr)) out.push({ nr: c.nr, nome: c.nome }); }));
    return out;
  }
  // Prepara o motor (no worker ou, sem ele, na página) para o idioma atual
  async function configurar() {
    const lang = B.lang;
    if (B.cfg && B.cfg.lang === lang) return B.cfg.p;
    const kbUrl = urlAbs(`site/data/kb_${lang.toLowerCase()}.json`), munsUrl = urlAbs("site/data/municipios.json");
    const base = { lang, ufNomes: window.UF_NOMES, cands: candidatos() };
    const p = chamar("config", Object.assign({ kbUrl, munsUrl }, base), 20000).then(() => "worker").catch(async () => {
      const [kb, muns] = await Promise.all([carregar().then(() => B.kb), window.APP.municipios()]);
      M().configurar(Object.assign({ kb, muns }, base));
      return "pagina";
    });
    B.cfg = { lang, p };
    return p;
  }
  // Pergunta inteira: intenção, entidades, lugares e respostas da base (com a conversa anterior em "ctx")
  async function analisar(texto, ctx) {
    const onde = await configurar();
    if (onde === "worker") { try { return await chamar("analisar", { texto, ctx: ctx || null }); } catch (e) { await configurar(); } }
    return M().analisar(texto, ctx || null);
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

  // A base também fica na página: as respostas e sugestões saem dela pelo id
  function carregar() {
    if (B.kb) return Promise.resolve();
    if (!B.carregando) {
      const lang = B.lang;
      B.carregando = fetch(`site/data/kb_${lang.toLowerCase()}.json`).then((r) => r.json()).then((kb) => {
        if (lang !== B.lang) return;
        B.kb = kb; B.byId = {}; kb.forEach((e) => { B.byId[e.i] = e; });
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

  // curto: pedidos sobre a resposta anterior e ações (resumir, exportar, abrir) pensam menos
  async function pensando(etapas, trabalho, log, curto) {
    const ms = curto ? 1400 + Math.random() * 700 : 5000 + Math.random() * 1000;
    const seq = etapas.map(sortear);
    if (!curto && Math.random() < 0.5) seq.splice(-1, 0, sortear(L().bot_think_wait));
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

  const SAUDA = ["dia", "tarde", "noite", "ola", "oi", "como"];
  // Texto da resposta: devolve a saudação recebida; "completa" junta o convite (ou o tchau)
  function cortesiaTexto(c, completa, T = L().cort) {
    const p = [], tem = (k) => c.tipos.includes(k);
    const s = SAUDA.slice(0, 5).find(tem);
    if (s) p.push(T[s]);
    if (tem("como")) p.push(T.como);
    if (completa) {
      if (tem("obg")) p.push(T.obg);
      p.push(tem("tchau") ? T.tchau : s || tem("como") ? T.ajuda : T.mais);
    }
    return p.join(" ");
  }

  // --- perguntas sem resposta: ficam só neste aparelho; a pessoa pode exportar ou apagar ----------------------------
  const CH_SEM = "atlas_sem_resposta", CH_SEM_ON = "atlas_sem_resposta_on";
  const semResposta = {
    ligado: () => { try { return localStorage.getItem(CH_SEM_ON) !== "0"; } catch (e) { return false; } },
    ligar(sim) { try { localStorage.setItem(CH_SEM_ON, sim ? "1" : "0"); if (!sim) localStorage.removeItem(CH_SEM); } catch (e) { /* sem armazenamento */ } },
    lista() { try { const v = JSON.parse(localStorage.getItem(CH_SEM) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } },
    guardar(q) {
      if (!semResposta.ligado()) return;
      q = String(q || "").trim().slice(0, 300);
      if (!q) return;
      const l = semResposta.lista().filter((x) => x.q !== q);
      l.unshift({ q, ts: Date.now(), lang: B.lang });
      try { localStorage.setItem(CH_SEM, JSON.stringify(l.slice(0, 200))); } catch (e) { /* sem espaço */ }
    },
    limpar() { try { localStorage.removeItem(CH_SEM); } catch (e) { /* sem armazenamento */ } },
  };

  window.BOT = {
    iniciar(lang) {
      if (B.iniciado) return;
      B.iniciado = true; B.lang = lang;
      M().configurar({ lang, ufNomes: window.UF_NOMES });
    },
    idioma(lang) {
      if (!B.iniciado || lang === B.lang) return;
      B.lang = lang; B.kb = null; B.byId = {}; B.cfg = null;
      M().configurar({ lang, ufNomes: window.UF_NOMES });
    },
    // a base, o motor e o jeito de pensar e escrever das respostas do Atlas
    motor: { carregar, analisar, md, rotulo, cortesia: (t) => M().cortesia(t), cortesiaTexto, detectarSecao: (t) => M().detectarSecao(t), norm, entrada: (id) => B.byId[id],
      onde: () => (W.w ? "worker" : W.w === false ? "pagina" : "?") },
    semResposta, pensando, digitar,
    _buscar: async (q) => { await carregar(); const r = await analisar(q); return r.kb.map((x) => [x.i, +x.sc.toFixed(2), +x.f.toFixed(2)]); },
  };
})();
