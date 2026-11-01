/* Simulador de anomalias — interface. Página educativa: o visitante altera dados FICTÍCIOS e vê como cada um dos
   35 testes reage (T01–T15 dos boletins, V1–V6 da variação entre turnos e L01–L14 dos logs, estes com critérios preliminares), com explicação simples e técnica, missões, modo livre, provas com nota, prova final, boletim e
   perguntas e respostas. Nada desta página pode ser compartilhado, copiado, impresso ou exportado. */
(function () {
  "use strict";
  const A = window.APP, M = window.SIMM;
  const { esc, icone, $, $$ } = A;
  const L = () => window.SIM_TXT[A.state.lang] || window.SIM_TXT.PT;
  const U = () => L().ui;
  const TV = ["V1", "V2", "V3", "V4", "V5", "V6"], TL = ["L01", "L02", "L03", "L04", "L05", "L06", "L07", "L08", "L09", "L10", "L11", "L12", "L13", "L14"];
  const ORDEM = ["T01", "T02", "T11", "T12", "T03", "T04", "T05", "T06", "T07", "T10", "T08", "T09", "T13", "T14", "T15"].concat(TV, TL);
  const GRUPOS = [["boletim", ["T01", "T02", "T11", "T12"]], ["secao", ["T03", "T04", "T05", "T06", "T07", "T10"]], ["local", ["T08", "T09"]], ["cidade", ["T13", "T14", "T15"]],
    ["variacao", TV], ["log", TL]];
  const LIBERA_PROVA = 6, NOTA_MIN = 7, Q_PROVA = 10, Q_FINAL = 30, TEMPO_PROVA = 15 * 60, TEMPO_FINAL = 45 * 60, FINAL_MIN = 15;
  const num = (id) => (id[0] === "T" ? +id.slice(1) : id);
  const novo = (id) => id[0] !== "T";
  const nM = (id) => M.T[id].missoes.length;   // 12 missões nos testes T; 6 nos testes V e L
  const libera = (id) => Math.min(LIBERA_PROVA, Math.ceil(nM(id) / 2));
  const T35 = () => (window.T35 && (window.T35[A.state.lang] || window.T35.PT)) || null;

  // ===================================================================================================
  // Progresso (só neste navegador)
  // ===================================================================================================
  const CH = "sim_v1";
  function prog() { try { return JSON.parse(localStorage.getItem(CH)) || {}; } catch (e) { return {}; } }
  function salvar(p) { try { localStorage.setItem(CH, JSON.stringify(p)); } catch (e) { /* sem armazenamento */ } }
  const feitas = (id) => ((prog().m || {})[id] || []);
  // provas em andamento (uma por teste), guardadas à parte; o relógio fica parado enquanto a pessoa está fora
  const CH_EX = "sim_ex_v1";
  function exTodos() { try { return JSON.parse(localStorage.getItem(CH_EX)) || {}; } catch (e) { return {}; } }
  function exGravar(t) { try { if (Object.keys(t).length) localStorage.setItem(CH_EX, JSON.stringify(t)); else localStorage.removeItem(CH_EX); } catch (e) { /* sem armazenamento */ } }
  function exGuardar() { if (!EX) return; const t = exTodos(); if (EX.entregue) delete t[EX.id]; else t[EX.id] = Object.assign({}, EX, { gasto: usado(), desde: null, pausa: false }); exGravar(t); }
  function exApagar(id) { const t = exTodos(); delete t[id]; exGravar(t); }
  const exSalvo = (id) => { const x = exTodos()[id]; return x && !x.entregue && x.lang === A.state.lang && Array.isArray(x.qs) && x.qs.length ? x : null; };
  const exAndamento = () => Object.values(exTodos()).filter((x) => x && !x.entregue && x.lang === A.state.lang && (x.id === "final" || L()[x.id]));
  function lugar(o) { const p = prog(); p.u = Object.assign({ quando: Date.now() }, o); salvar(p); }
  function guardarCaso() { if (!ST || !ST.id || !ST.s) return; const p = prog(); p.c = p.c || {}; p.c[ST.id] = { modo: ST.modo, i: ST.i, s: ST.s, s0: ST.s0 }; salvar(p); }
  const casoSalvo = () => { const c = ((prog().c || {})[ST.id]) || null; return c && c.s && c.modo === ST.modo && (ST.modo !== "missao" || c.i === ST.i) ? c : null; };
  function marcar(id, i) { const p = prog(); p.m = p.m || {}; const l = new Set(p.m[id] || []); l.add(i); p.m[id] = [...l].sort((a, b) => a - b); salvar(p); }
  const notaDe = (id) => ((prog().n || {})[id] || null);
  function registrarNota(id, nota, extra) {
    const p = prog(); p.n = p.n || {};
    const o = p.n[id] || { melhor: 0, tent: 0, hist: [] };
    o.tent += 1; o.ultima = nota; o.melhor = Math.max(o.melhor, nota); o.hist = (o.hist || []).concat([{ nota, quando: Date.now(), ...extra }]).slice(-10);
    p.n[id] = o; salvar(p);
  }
  const provasFeitas = () => ORDEM.filter((id) => notaDe(id)).length;
  function notaFinal() {
    const med = ORDEM.reduce((t, id) => t + ((notaDe(id) || {}).melhor || 0), 0) / ORDEM.length;
    const fin = (notaDe("final") || {}).melhor;
    return { med, fin, total: fin == null ? null : 0.6 * med + 0.4 * fin };
  }

  // ===================================================================================================
  // Formatação
  // ===================================================================================================
  const loc = () => ({ PT: "pt-BR", EN: "en-US", ES: "es-ES" })[A.state.lang] || "pt-BR";
  const fn = (x, d = 0) => (isFinite(x) ? Number(x).toLocaleString(loc(), { minimumFractionDigits: d, maximumFractionDigits: d }) : "—");
  const fpct = (x, d = 1) => fn(100 * x, d) + "%";
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = (n) => String(n).replace("-", "⁻").replace(/\d/g, (d) => SUP[d]);
  function sci(l) {   // a partir do logaritmo natural
    if (l === -Infinity) return "0";
    const l10 = l / Math.LN10;
    if (l10 >= -2) return fn(Math.exp(l), 4);
    const e = Math.floor(l10), m = Math.pow(10, l10 - e);
    return `${fn(m, 2)} × 10${sup(e)}`;
  }
  function chance(l) {   // probabilidade em palavras ("1 em 3,4 milhões")
    const u = U(), p = Math.exp(l);
    if (p >= 0.995) return u.ch_certo;
    if (p >= 0.01) return fpct(p, p < 0.1 ? 1 : 0);
    const l10 = -l / Math.LN10;
    if (l10 < 3) return u.ch_um(fn(Math.round(1 / p)));
    if (l10 >= 21) return u.ch_digitos(Math.floor(l10) + 1);
    let esc_ = u.escala[0];
    u.escala.forEach((e) => { if (l10 >= e[0]) esc_ = e; });
    const v = Math.pow(10, l10 - esc_[0]);
    return u.ch_um(`${fn(v, v < 10 ? 1 : 0)} ${v >= 2 ? esc_[2] : esc_[1]}`);
  }
  const hora = (sec) => { sec = ((Math.round(sec) % 86400) + 86400) % 86400; const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; };
  const F = () => ({ n: fn, pct: fpct, chance, sci, hora, cat: (c) => (U().cat[c] || c), cargo: (k) => (U().cargo[k] || k) });

  // ===================================================================================================
  // Controles de cada teste (os rótulos vêm dos textos do idioma)
  // ===================================================================================================
  const RHO = { k: "rho", t: "sel", op: ["p", "m", "a"], opk: "rho" };
  const CTL = Object.assign({
    T03: [{ k: "n", t: "num", min: 0, max: 400, re: 1 }, { k: "a", t: "num", min: 0, max: (s) => s.n }, { k: "m", t: "num", min: 5, max: 99 }, RHO],
    T04: [{ k: "ap", t: "num", min: 0, max: 500, re: 1 }, { k: "co", t: "num", min: 0, max: (s) => s.ap }, { k: "m", t: "num", min: 40, max: 99 }, RHO],
    T05: [{ k: "tot", t: "num", min: 0, max: 500, re: 1 }, { k: "br", t: "num", min: 0, max: (s) => s.tot }, { k: "nu", t: "num", min: 0, max: (s) => s.tot }, { k: "m", t: "num", min: 1, max: 30 }, RHO],
    T07: [{ k: "val", t: "num", min: 0, max: 500, re: 1 }, { k: "leg", t: "num", min: 0, max: (s) => s.val }, { k: "m", t: "num", min: 1, max: 40 }, RHO],
    T10: [{ k: "co", t: "num", min: 0, max: 500, re: 1 }, { k: "sb", t: "num", min: 0, max: (s) => s.co }, { k: "m", t: "num", min: 0.5, max: 25, passo: 0.5 }, RHO],
    T06: [{ k: "nx", t: "num", min: 0, max: 400 }, { k: "nl", t: "num", min: 0, max: 400 }, { k: "eA", t: "num", min: 0, max: 100 },
      { k: "l.0", t: "num", min: 0, max: 100 }, { k: "l.1", t: "num", min: 0, max: 100 }, { k: "l.2", t: "num", min: 0, max: 100 }, { k: "l.3", t: "num", min: 0, max: 100 }, { k: "l.4", t: "num", min: 0, max: 100 },
      { k: "grupo", t: "sel", op: ["padrao", "dividido"] }],
    T11: [{ k: "fuso", t: "sel", op: ["0", "-1", "-2"], num: 1 }, { k: "ab", t: "hora" }, { k: "en", t: "hora" }, { k: "em", t: "hora" }, { k: "re", t: "hora" },
      { k: "drift", t: "num", min: -60, max: 60 }, { k: "data", t: "liga" }],
    T12: [{ k: "urna", t: "sel", op: ["prev", "cont", "outra", "desc"] }, { k: "carga", t: "sel", op: ["A7F3", "B2E8", ""] }, { k: "tipo", t: "sel", op: ["1", "2", "3", "4", "5"], num: 1 },
      { k: "junta", t: "liga" }, { k: "semCesp", t: "liga" }, { k: "va", t: "num", min: 0, max: 300 }, { k: "vb", t: "num", min: 0, max: 300 }],
    T13: [{ k: "S", t: "sel", op: ["40", "150", "400", "800", "1200", "3000"], num: 1 }, { k: "forca", t: "num", min: 3, max: 90 }, { k: "inv", t: "num", min: 0, max: 100 },
      { k: "arr", t: "num", min: 0, max: 100 }, { k: "soma", t: "num", min: 0, max: 40 }, { k: "somaP", t: "num", min: 0, max: 100 }, { k: "transf", t: "num", min: 0, max: 100 },
      { k: "ref", t: "sel", op: ["modelo", "benford"] }],
    T14: [{ k: "S", t: "sel", op: ["40", "150", "400", "800", "1200", "3000"], num: 1 }, { k: "forca", t: "num", min: 3, max: 90 }, { k: "inv", t: "num", min: 0, max: 100 },
      { k: "arr", t: "num", min: 0, max: 100 }, { k: "arrPasso", t: "sel", op: ["10", "5"], num: 1 }, { k: "soma", t: "num", min: 0, max: 40 }, { k: "somaP", t: "num", min: 0, max: 100 },
      { k: "transf", t: "num", min: 0, max: 100 }, { k: "ref", t: "sel", op: ["modelo", "uniforme"] }],
    T15: [{ k: "S", t: "sel", op: ["600", "1200", "3000"], num: 1 }, { k: "forca", t: "num", min: 10, max: 90 }, { k: "enc", t: "num", min: 0, max: 100 },
      { k: "alvo", t: "num", min: 80, max: 100 }, { k: "modo", t: "sel", op: ["espalhado", "zona"] }, { k: "mob", t: "num", min: 0, max: 60 }],
  }, M.CTL2 || {});
  const rotulo = (id, k) => { const T = L()[id]; return (T.campos && T.campos[k]) || U().c[k] || k; };
  function opRot(id, c, v) { const T = L()[id]; const m = (c.opk ? U()[c.opk] : T.op && T.op[c.k]) || {}; return m[v] != null ? m[v] : v; }
  function controle(id, c, s) {
    const v = M.ler(s, c.k), rot = esc(rotulo(id, c.k)), at = `data-k="${c.k}"${c.re ? " data-re" : ""}${c.num ? " data-num" : ""}`;
    if (c.t === "num") {
      const mx = typeof c.max === "function" ? c.max(s) : c.max, ps = c.passo || 1;
      return `<label class="sim-c" data-c="${c.k}"><span class="sim-c-r">${rot}</span><span class="sim-c-in"><input type="range" min="${c.min}" max="${mx}" step="${ps}" value="${v}" ${at} aria-label="${rot}"><input type="number" min="${c.min}" max="${mx}" step="${ps}" value="${v}" ${at} inputmode="decimal"></span></label>`;
    }
    if (c.t === "sel") return `<label class="sim-c" data-c="${c.k}"><span class="sim-c-r">${rot}</span><select ${at}>${c.op.map((o) => `<option value="${esc(o)}"${String(v) === o ? " selected" : ""}>${esc(opRot(id, c, o))}</option>`).join("")}</select></label>`;
    if (c.t === "liga") return `<label class="sim-c sim-liga" data-c="${c.k}"><input type="checkbox" ${at}${v ? " checked" : ""}><span class="sim-c-r">${rot}</span></label>`;
    if (c.t === "hora") return `<label class="sim-c" data-c="${c.k}"><span class="sim-c-r">${rot}</span><input type="time" step="1" value="${hora(v)}" ${at}></label>`;
    return "";
  }
  const numIn = (k, v, extra) => `<input type="number" class="sim-n" value="${v}" data-k="${k}" ${extra || ""} inputmode="numeric">`;

  // ===================================================================================================
  // Painéis personalizados (boletim, totais, vizinhança, idênticos)
  // ===================================================================================================
  function painelT01(s, r) {
    const u = U(), T = L().T01, cargos = [1, 3, 5, 6, 7].filter((c) => c !== +s.aus);
    const marca = (c) => r.cats.filter((x) => x.cargo === c).length ? `<span class="sim-x">${icone("x")}</span>` : `<span class="sim-v">${icone("check")}</span>`;
    return `<div class="sim-bu" aria-label="${esc(T.bu)}"><div class="sim-bu-h"><b>${esc(T.bu)}</b><span>${esc(u.local_fict)}</span></div>
      <div class="sim-tabw"><table class="sim-tab"><thead><tr><th>${esc(u.cargo_t)}</th><th>${esc(u.c.ap)}</th><th>${esc(u.c.co)}</th><th>${esc(u.c.ab)}</th><th></th></tr></thead><tbody>
      ${cargos.map((c) => `<tr><th>${esc(u.cargo[c])}</th><td>${numIn(`c.${c}.ap`, s.c[c].ap)}</td><td>${numIn(`c.${c}.co`, s.c[c].co)}</td><td>${numIn(`c.${c}.ab`, s.c[c].ab)}</td><td>${marca(c)}</td></tr>`).join("")}
      </tbody></table></div>
      <div class="sim-bu-v"><b>${esc(T.campos.votos)}</b> <span>${esc(u.cand.A)} ${numIn("va", s.va)}</span><span>${esc(u.cand.B)} ${numIn("vb", s.vb)}</span><span>${esc(u.c.br)} ${numIn("br", s.br)}</span><span>${esc(u.c.nu)} ${numIn("nu", s.nu)}</span></div>
      <div class="sim-grade">${controle("T01", { k: "neg", t: "num", min: -20, max: 50 }, s)}${controle("T01", { k: "fant", t: "num", min: 0, max: 60 }, s)}
        ${controle("T01", { k: "aus", t: "sel", op: ["0", "3", "5", "6", "7"], num: 1, re: 1 }, s)}${controle("T01", { k: "dup", t: "liga" }, s)}${controle("T01", { k: "div", t: "liga" }, s)}${controle("T01", { k: "urn", t: "liga" }, s)}</div></div>`;
  }
  function painelT02(s, r) {
    const u = U(), T = L().T02, tot = r.v.tot;
    const bloco = (k, campos) => {
      const esp = { p: 1, s: 2, d: 1 }[k] * s.co, dl = tot[k] - esp;
      return `<div class="sim-blk${dl ? " sim-blk-x" : ""}"><b>${esc(u.cargo[k])}${k === "s" ? ` <small>(${esc(T.dois)})</small>` : ""}</b>
        ${campos.map(([ck, rot]) => `<label>${esc(rot)} ${numIn(`${k}.${ck}`, s[k][ck])}</label>`).join("")}
        <div class="sim-soma"><span>${esc(T.soma)}: <b>${fn(tot[k])}</b></span><span>${esc(T.esperado)}: <b>${fn(esp)}</b></span><span class="${dl ? "sim-neg" : "sim-pos"}">Δ = ${dl > 0 ? "+" : ""}${fn(dl)}</span></div></div>`;
    };
    return `<div class="sim-bu"><div class="sim-bu-h"><b>${esc(L().T01.bu)}</b><span>${esc(u.local_fict)}</span></div>
      <label class="sim-c sim-c-co"><span class="sim-c-r">${esc(u.c.co)}</span>${numIn("co", s.co)}</label>
      <div class="sim-blks">${bloco("p", [["a", u.cand.A], ["b", u.cand.B], ["br", u.c.br], ["nu", u.c.nu]])}
      ${bloco("s", [["c1", T.campos.c1], ["c2", T.campos.c2], ["c3", T.campos.c3], ["br", u.c.br], ["nu", u.c.nu]])}
      ${bloco("d", [["nom", T.campos.nom], ["leg", T.campos.leg], ["br", u.c.br], ["nu", u.c.nu]])}</div></div>`;
  }
  function painelT08(s, r) {
    const u = U(), T = L().T08, k = +s.k, sec = r.v.sec || [];
    const media = r.v.sec && r.v.sec.length ? 100 * (sec.reduce((t, x) => t + (x.x || 0), 0) / Math.max(1, sec.reduce((t, x) => t + (x.n || 0), 0))) : null;
    return `<div class="sim-loc"><div class="sim-bu-h"><b>${esc(T.local)}</b><span>${esc(u.local_fict)}</span></div>
      ${controle("T08", { k: "k", t: "sel", op: ["2", "3", "4", "5", "6", "7", "8"], num: 1, re: 1 }, s)}
      <div class="sim-tabw"><table class="sim-tab sim-tab-loc"><thead><tr><th>${esc(u.secao_t)}</th><th>${esc(T.campos.n)}</th><th>${esc(T.campos.a)}</th><th>${esc(T.dif)}</th><th></th></tr></thead><tbody>
      ${Array.from({ length: k }, (_, i) => { const x = sec[i] || {}; return `<tr class="${i === +s.alvo ? "sim-alvo" : ""}${x.sinal ? " sim-tr-x" : ""}"><th>${esc(u.secao_t)} ${i + 1}${i === +s.alvo ? ` <small>${esc(T.alvo)}</small>` : ""}</th>
        <td>${numIn(`n.${i}`, s.n[i])}</td><td><span class="sim-c-in"><input type="range" min="0" max="100" value="${s.a[i]}" data-k="a.${i}" aria-label="${esc(T.campos.a)} ${i + 1}">${numIn(`a.${i}`, s.a[i], 'min="0" max="100"')}</span></td>
        <td class="num">${x.dif != null ? (x.dif > 0 ? "+" : "") + fn(x.dif, 1) : "—"}</td><td>${x.sinal ? `<span class="sim-x">${icone("x")}</span>` : x.na ? "·" : `<span class="sim-v">${icone("check")}</span>`}</td></tr>`; }).join("")}
      </tbody></table></div>${media != null ? `<p class="small muted">${esc(T.media)}: ${fn(media, 1)}%</p>` : ""}</div>`;
  }
  function painelT09(s, r) {
    const u = U(), T = L().T09, cats = T.cats[s.cargo];
    return `<div class="sim-loc"><div class="sim-bu-h"><b>${esc(T.titulo_par)}</b><span>${esc(u.local_fict)}</span></div>
      <div class="sim-grade">${controle("T09", { k: "cargo", t: "sel", op: ["p", "g", "d"], re: 1 }, s)}${controle("T09", { k: "N", t: "num", min: 2, max: 5000, re: 0 }, s)}</div>
      <div class="sim-acoes"><button type="button" class="btn btn-sm" data-sim-copiar>${icone("copy")} ${esc(T.copiar)}</button></div>
      <div class="sim-tabw"><table class="sim-tab sim-tab-par"><thead><tr><th></th><th>${esc(u.secao_t)} 42</th><th>${esc(u.secao_t)} 87</th><th></th></tr></thead><tbody>
      ${cats.map((nm, i) => `<tr><th>${esc(nm)}</th><td>${numIn(`v1.${i}`, s.v1[i])}</td><td>${numIn(`v2.${i}`, s.v2[i])}</td><td>${s.v1[i] === s.v2[i] ? "=" : "≠"}</td></tr>`).join("")}
      <tr class="sim-tot"><th>${esc(T.total)}</th><td>${fn(s.v1.reduce((a, b) => a + b, 0))}</td><td>${fn(s.v2.reduce((a, b) => a + b, 0))}</td><td>${r.v.igual ? "=" : "≠"}</td></tr></tbody></table></div></div>`;
  }
  const PAINEL = { T01: painelT01, T02: painelT02, T08: painelT08, T09: painelT09 };

  // ===================================================================================================
  // Desenhos (sempre com a marca de dados fictícios)
  // ===================================================================================================
  const W = 640;
  function faixaPontos(vals, alvo, o) {   // régua de pontos: cada ponto é uma seção fictícia
    const lo = o.lo != null ? o.lo : 0, hi = o.hi != null ? o.hi : Math.max(...vals, alvo) * 1.15 || 1;
    const x = (v) => 30 + ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo || 1)) * (W - 60);
    const r = M.rng(7), pts = vals.map((v) => `<circle cx="${x(v).toFixed(1)}" cy="${(34 + (r() - 0.5) * 26).toFixed(1)}" r="3.6" class="sim-pt"/>`).join("");
    const tk = [0, 0.25, 0.5, 0.75, 1].map((f) => lo + f * (hi - lo));
    return `<svg viewBox="0 0 ${W} 86" class="sim-svg" role="img" aria-label="${esc(o.rot)}">
      <line x1="30" x2="${W - 30}" y1="62" y2="62" class="sim-eixo"/>${tk.map((t) => `<text x="${x(t)}" y="80" class="sim-tk">${esc(o.fmt(t))}</text>`).join("")}
      ${o.media != null ? `<line x1="${x(o.media)}" x2="${x(o.media)}" y1="18" y2="62" class="sim-med"/>` : ""}
      ${pts}<g class="sim-alvo-g ${o.sinal ? "sim-alvo-x" : ""}"><path d="M${x(alvo)} 18 l9 16 -9 16 -9 -16z"/><text x="${x(alvo)}" y="12" class="sim-tk sim-tk-b">${esc(o.rotAlvo)}</text></g></svg>
      ${o.media != null ? `<p class="small muted sim-leg"><span class="sim-lg sim-lg-m"></span>${esc(o.rotMedia)}</p>` : ""}`;
  }
  function barra(partes) {   // barra empilhada com rótulos
    const t = partes.reduce((a, p) => a + Math.max(0, p.v), 0) || 1;
    return `<div class="sim-barra">${partes.map((p) => `<span class="${p.c}" style="flex:${Math.max(0, p.v) / t}" title="${esc(p.r)}: ${fn((100 * Math.max(0, p.v)) / t, 1)}%">${Math.max(0, p.v) / t > 0.08 ? esc(p.r) : ""}</span>`).join("")}</div>`;
  }
  function visSecao(id, s, r) {
    const u = U(), T = L()[id], g = M.regiao(id, s);
    const prop = { T03: s.a / Math.max(1, s.n), T04: s.co / Math.max(1, s.ap), T05: (s.br + s.nu) / Math.max(1, s.tot), T07: s.leg / Math.max(1, s.val), T10: s.sb / Math.max(1, s.co) }[id];
    const alvo = id === "T03" && s.a === 0 ? 1 : prop;
    const lo = id === "T03" || id === "T04" ? 0 : 0, hi = id === "T03" || id === "T04" ? 1 : Math.max(0.1, Math.max(...g.props, alvo) * 1.2);
    return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p>${faixaPontos(g.props, alvo, { lo, hi, media: g.m, sinal: r.nivel === "anom", rotAlvo: u.secao_t + " 42", rotMedia: u.media_reg + " " + fpct(g.m, 1), fmt: (v) => fpct(v, 0), rot: T.vis })}
      <div class="sim-kv">${(T.kv(s, r, F()) || []).map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join("")}</div></div>`;
  }
  function visT06(s, r) {
    const u = U(), T = L().T06, g = M.regiao("T06", s);
    return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p>
      <div class="sim-bl"><b>${esc(u.cargo[1])}</b>${barra([{ v: s.eA, c: "sim-esq", r: `${u.cand.A} (${T.esp[0]})` }, { v: 100 - s.eA, c: "sim-dir", r: `${u.cand.B} (${T.esp[4]})` }])}</div>
      <div class="sim-bl"><b>${esc(u.cargo[6])}</b>${barra(s.l.map((v, i) => ({ v, c: ["sim-esq", "sim-esq2", "sim-cen", "sim-dir2", "sim-dir"][i], r: T.esp[i] })))}</div>
      ${faixaPontos(g.props, r.v.delta, { lo: -4, hi: 4, media: g.m, sinal: r.nivel === "anom", rotAlvo: u.secao_t + " 42", rotMedia: u.mediana, fmt: (v) => fn(v, 0), rot: T.vis2 })}
      <p class="small muted">${esc(T.vis2)}</p>
      <div class="sim-kv">${(T.kv(s, r, F()) || []).map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join("")}</div></div>`;
  }
  function visT08(s, r) {
    const sec = r.v.sec || [], T = L().T08;
    if (!sec.length) return "";
    const h = 26 * sec.length + 20;
    const x = (v) => 110 + (v / 100) * (W - 150);
    return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p><svg viewBox="0 0 ${W} ${h}" class="sim-svg" role="img" aria-label="${esc(T.vis)}">
      ${[0, 25, 50, 75, 100].map((v) => `<line x1="${x(v)}" x2="${x(v)}" y1="4" y2="${h - 14}" class="sim-grid"/><text x="${x(v)}" y="${h - 2}" class="sim-tk">${v}%</text>`).join("")}
      ${sec.map((q, i) => q.pS == null ? "" : `<text x="100" y="${18 + i * 26}" class="sim-tk sim-tk-r">${esc(U().secao_t)} ${i + 1}</text><rect x="${x(0)}" y="${7 + i * 26}" width="${Math.max(2, x(100 * q.pS) - x(0))}" height="16" rx="4" class="${q.sinal ? "sim-bar-x" : "sim-bar"}"/>
        <line x1="${x(100 * q.pR)}" x2="${x(100 * q.pR)}" y1="${4 + i * 26}" y2="${26 + i * 26}" class="sim-med"/>`).join("")}</svg>
      <p class="small muted">${esc(T.vis_leg)}</p></div>`;
  }
  function visT09(s, r) { const T = L().T09; return `<div class="sim-vis"><div class="sim-kv">${(T.kv(s, r, F()) || []).map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join("")}</div></div>`; }
  function visT11(s, r) {
    const T = L().T11, v = r.v, x0 = 6 * 3600, x1 = 21 * 3600, x = (t) => 30 + ((Math.min(x1, Math.max(x0, t)) - x0) / (x1 - x0)) * (W - 60);
    const off = v.off * 3600, ev = [["ab", v.ab], ["en", v.en], ["em", v.em], ["re", v.re + off]];
    return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p><svg viewBox="0 0 ${W} 120" class="sim-svg" role="img" aria-label="${esc(T.vis)}">
      <rect x="${x(v.ini)}" y="30" width="${x(v.fim) - x(v.ini)}" height="40" rx="6" class="sim-janela"/><text x="${(x(v.ini) + x(v.fim)) / 2}" y="54" class="sim-tk">${esc(T.janela)}</text>
      ${[6, 8, 10, 12, 14, 16, 18, 20].map((h) => `<text x="${x(h * 3600)}" y="112" class="sim-tk">${h}h</text>`).join("")}
      <line x1="30" x2="${W - 30}" y1="96" y2="96" class="sim-eixo"/>
      ${ev.map(([k, t], i) => `<g class="${r.cats.length && T.alerta[k] && r.cats.some((c) => T.alerta[k].includes(c.c)) ? "sim-ev-x" : "sim-ev"}"><line x1="${x(t)}" x2="${x(t)}" y1="${18 + i * 4}" y2="96"/><circle cx="${x(t)}" cy="${18 + i * 4}" r="5"/><text x="${x(t) + 7}" y="${16 + i * 4 + (i % 2 ? 12 : 0)}" class="sim-tk sim-tk-l">${esc(T.ev[k])} ${hora(t)}</text></g>`).join("")}</svg>
      <p class="small muted">${esc(T.vis_leg)}</p></div>`;
  }
  function visT12(s, r) {
    const T = L().T12, U_ = M.URNAS;
    const nr = { prev: U_.prev, cont: U_.cont, outra: U_.outra, desc: U_.desc }[s.urna];
    return `<div class="sim-vis sim-urnas"><div class="sim-urna"><b>${esc(T.prevista)}</b><span>${esc(T.nr)} ${U_.prev}</span><span>${esc(T.carga_t)} A7F3</span></div>
      <div class="sim-urna ${r.nivel === "anom" ? "sim-urna-x" : r.nivel === "info" ? "sim-urna-i" : ""}"><b>${esc(T.usada)}</b><span>${esc(T.nr)} ${s.junta ? "—" : nr}</span><span>${esc(T.carga_t)} ${s.junta ? "—" : s.carga || "∅"}</span></div>
      <div class="sim-urna sim-urna-l"><b>${esc(T.lista)}</b><span>${esc(T.nr)} ${U_.cont} · ${esc(T.carga_t)} A7F3</span><span class="small muted">${esc(T.outra_t)} ${U_.outra}</span></div></div>`;
  }
  function visDig(id, s, r) {
    const T = L()[id], v = r.v;
    if (!v.E) return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p><p class="muted">${esc(T.sem)}</p>${v.O ? barrasDig(v.O, null, T) : ""}</div>`;
    return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p>${barrasDig(v.O, v.E, T)}<div class="sim-kv">${(T.kv(s, r, F()) || []).map(([k, val]) => `<div><span>${esc(k)}</span><b>${val}</b></div>`).join("")}</div></div>`;
  }
  function barrasDig(O, E, T) {
    const tO = O.reduce((a, b) => a + b, 0) || 1, mx = Math.max(...O.map((o) => o / tO), ...(E ? E.map((e) => e / tO) : [0])) * 1.15 || 1;
    const bw = (W - 80) / 10, y = (f) => 150 - (f / mx) * 130;
    return `<svg viewBox="0 0 ${W} 180" class="sim-svg" role="img" aria-label="${esc(T.vis)}">
      ${[0, 0.5, 1].map((f) => `<line x1="40" x2="${W - 30}" y1="${y(f * mx)}" y2="${y(f * mx)}" class="sim-grid"/><text x="34" y="${y(f * mx) + 4}" class="sim-tk sim-tk-r">${fpct(f * mx, 0)}</text>`).join("")}
      ${O.map((o, d) => `<rect x="${44 + d * bw + 4}" y="${y(o / tO)}" width="${bw - 10}" height="${150 - y(o / tO)}" rx="4" class="sim-bar"><title>${d}: ${fpct(o / tO, 1)}</title></rect>
        ${E ? `<line x1="${44 + d * bw}" x2="${44 + d * bw + bw - 2}" y1="${y(E[d] / tO)}" y2="${y(E[d] / tO)}" class="sim-esp"/>` : ""}<text x="${44 + d * bw + bw / 2}" y="168" class="sim-tk">${d}</text>`).join("")}</svg>
      <p class="small muted"><span class="sim-lg sim-lg-o"></span>${esc(T.obs)} ${E ? `<span class="sim-lg sim-lg-e"></span>${esc(T.esp)}` : ""}</p>`;
  }
  function visT15(s, r) {
    const T = L().T15, v = r.v, H = 300, x = (t) => 62 + t * (W - 82), y = (q) => H - 34 - q * (H - 54);
    const pts = v.pts.length > 2500 ? v.pts.filter((_, i) => i % 2 === 0 || _.mex || _.mob) : v.pts;
    return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p><svg viewBox="0 0 ${W} ${H}" class="sim-svg" role="img" aria-label="${esc(T.vis)}">
      <rect x="${x(0.9)}" y="${y(1)}" width="${x(1) - x(0.9)}" height="${y(0.9) - y(1)}" class="sim-canto"/>
      ${[0, 0.25, 0.5, 0.75, 1].map((f) => `<line x1="${x(f)}" x2="${x(f)}" y1="${y(0)}" y2="${y(1)}" class="sim-grid"/><text x="${x(f)}" y="${H - 12}" class="sim-tk">${fpct(f, 0)}</text><line x1="${x(0)}" x2="${x(1)}" y1="${y(f)}" y2="${y(f)}" class="sim-grid"/><text x="54" y="${y(f) + 4}" class="sim-tk sim-tk-r">${fpct(f, 0)}</text>`).join("")}
      ${pts.map((p) => `<circle cx="${x(p.t).toFixed(1)}" cy="${y(p.s).toFixed(1)}" r="${p.mex || p.mob ? 3 : 2}" class="${p.mex ? "sim-pt-x" : p.mob ? "sim-pt-m" : "sim-pt"}"/>`).join("")}
      <text x="${x(0.5)}" y="${H}" class="sim-tk sim-tk-b">${esc(T.eixo_x)}</text><text x="14" y="${y(0.5)}" class="sim-tk sim-tk-b" transform="rotate(-90 14 ${y(0.5)})">${esc(T.eixo_y)}</text></svg>
      <div class="sim-kv">${(T.kv(s, r, F()) || []).map(([k, val]) => `<div><span>${esc(k)}</span><b>${val}</b></div>`).join("")}</div></div>`;
  }
  // --- visuais dos testes V e L ---
  const kvHtml = (T, s, r) => (T.kv ? `<div class="sim-kv">${(T.kv(s, r, F()) || []).map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join("")}</div>` : "");
  function visBarras(id, s, r) {   // V1–V4: 1º turno, grupo de referência, esperado e observado no 2º turno
    const T = L()[id], v = r.v, cor = r.nivel === "anom" ? "sim-vb-x" : r.nivel === "info" ? "sim-vb-i" : "sim-vb-o";
    const ln = (rot, p, cls) => `<div class="sim-vb"><span>${esc(rot)}</span><span class="sim-vb-b"><i class="${cls}" style="width:${Math.max(0, Math.min(100, 100 * p)).toFixed(1)}%"></i></span><b>${p == null || !isFinite(p) ? "—" : fpct(p, 1)}</b></div>`;
    const v4 = id === "V4", p1 = v4 ? v.c1 / Math.max(1, v.ap) : s.a1 / 100;
    return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p><div class="sim-vbs">${ln(T.vl[0], p1, "sim-vb-1")}${ln(T.vl[1], s.g1 / 100, "sim-vb-g")}${ln(T.vl[2], s.g2 / 100, "sim-vb-g")}
      ${v.pe != null ? ln(T.vl[3], v.pe, "sim-vb-e") : ""}${ln(T.vl[4], v4 ? v.c2 / Math.max(1, v.ap) : s.a2 / 100, cor)}</div>${kvHtml(T, s, r)}</div>`;
  }
  function visTeto(id, s, r) {   // V5: ganho de cada finalista × votos disponíveis
    const T = L()[id], v = r.v, mx = Math.max(1, v.teto, Math.abs(v.gA), Math.abs(v.gB)) * 1.1;
    const ln = (rot, x, cls) => `<div class="sim-vb"><span>${esc(rot)}</span><span class="sim-vb-b"><i class="${cls}" style="width:${((100 * Math.max(0, x)) / mx).toFixed(1)}%"></i></span><b>${fn(x)}</b></div>`;
    return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p><div class="sim-vbs">${ln(T.vl[0], v.teto, "sim-vb-g")}${ln(T.vl[1], v.gA, v.kA ? "sim-vb-i" : "sim-vb-1")}${ln(T.vl[2], v.gB, v.kB ? "sim-vb-i" : "sim-vb-e")}</div>${kvHtml(T, s, r)}</div>`;
  }
  function visRegua(id, s, r) {   // seção comparada com 40 seções fictícias do município e vizinhas
    const T = L()[id], u = U(), g = r.v.regua, fm = { min: (x) => `${fn(x, 0)} min`, s: (x) => `${fn(x, 0)} s`, pct: (x) => `${fn(x, 1)}%` }[g.un];
    const hi = Math.max(...g.vals, g.alvo) * 1.15 || 1;
    return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p>${faixaPontos(g.vals, g.alvo, { lo: 0, hi, media: r.v.med, sinal: r.nivel === "anom", rotAlvo: u.secao_t + " 42", rotMedia: `${u.mediana} ${fm(r.v.med)}`, fmt: fm, rot: T.vis })}${kvHtml(T, s, r)}</div>`;
  }
  function visLinha(id, s, r) {   // linha do tempo do dia (hora local), com os eventos do log
    const T = L()[id], x0 = 5 * 3600, x1 = 21 * 3600, x = (t) => 30 + ((Math.min(x1, Math.max(x0, t)) - x0) / (x1 - x0)) * (W - 60);
    const mk = (T.marcas ? T.marcas(s, r, F()) : []).filter((m) => m.t != null);
    const cls = { x: "sim-mk-x", i: "sim-mk-i", o: "sim-mk-o" };
    return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p><svg viewBox="0 0 ${W} 120" class="sim-svg" role="img" aria-label="${esc(T.vis)}">
      <rect x="${x(8 * 3600)}" y="40" width="${x(17 * 3600) - x(8 * 3600)}" height="34" rx="6" class="sim-janela"/><line x1="30" x2="${W - 30}" y1="74" y2="74" class="sim-eixo"/>
      ${[6, 8, 10, 12, 14, 16, 17, 18, 20].map((h) => `<text x="${x(h * 3600)}" y="92" class="sim-tk">${h}h</text>`).join("")}
      ${mk.map((m, i) => `<g class="${cls[m.k] || cls.o}"><line x1="${x(m.t)}" x2="${x(m.t)}" y1="${i % 2 ? 30 : 22}" y2="74"/><circle cx="${x(m.t)}" cy="74" r="5"/><text x="${x(m.t)}" y="${i % 2 ? 26 : 16}" class="sim-tk sim-tk-b">${esc(m.rot)}</text></g>`).join("")}</svg>${kvHtml(T, s, r)}</div>`;
  }
  function visKv(id, s, r) { const T = L()[id]; return `<div class="sim-vis"><p class="sim-vis-t">${esc(T.vis)}</p>${kvHtml(T, s, r)}</div>`; }
  function visual(id, s, r) {
    if (novo(id)) return ({ transf: visBarras, comp: visBarras, teto: visTeto, regua: visRegua, linha: visLinha, kv: visKv }[M.T[id].vis] || visKv)(id, s, r);
    if (["T03", "T04", "T05", "T07", "T10"].includes(id)) return visSecao(id, s, r);
    return ({ T06: visT06, T08: visT08, T09: visT09, T11: visT11, T12: visT12, T15: visT15, T13: (a, b) => visDig("T13", a, b), T14: (a, b) => visDig("T14", a, b) }[id] || (() => ""))(s, r);
  }

  // ===================================================================================================
  // Resultado: luz, explicação simples e técnica
  // ===================================================================================================
  function luz(r) {
    const u = U();
    return `<div class="sim-luz sim-luz-${r.nivel}" role="status" aria-live="polite"><span class="sim-luz-ic" aria-hidden="true"></span><div><b>${esc(u.luz[r.nivel])}</b><span>${esc(u.luzDesc[r.nivel])}</span></div></div>`;
  }
  function simples(id, s, r) { const p = L()[id].simples(s, r, F()); return p.map((x) => `<p>${x}</p>`).join(""); }
  const lin = (k, v) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`;
  function calculo(id, s, r) {
    if (novo(id)) return (L()[id].tec ? L()[id].tec(s, r, F()) : []).map(([k, v]) => lin(k, v)).join("");
    const t = U().tl, v = r.v, P = M.P, out = [];
    const bb = () => { out.push(lin(t.grupo, `G = ${v.G} · m̂ = ${fn(v.mref, 4)} · ρ̂ = ${fn(v.rho, 4)}`), lin(t.ab, `α = ${fn(v.a, 2)} · β = ${fn(v.b, 2)}`)); };
    const bh = (Mx) => out.push(lin(t.bh, `q = min(1, p × M) = min(1, ${sci(v.lp)} × ${fn(Mx)}) = ${sci(v.lq)}`), lin(t.crit, `q < ${fn(P.ALFA_FDR, 2)} → ${v.q < P.ALFA_FDR ? t.sim : t.nao}`));
    if (id === "T01" || id === "T02" || id === "T11" || id === "T12") {
      if (!r.cats.length) out.push(lin(t.regras, t.todas_ok));
      r.cats.forEach((c) => out.push(lin(U().cat[c.c] || c.c, esc(c.obs || (c.info ? t.info : "✗")))));
      if (id === "T11") out.push(lin(t.janela, `${hora(v.ini - v.tol)} – ${hora(v.fim)} (${t.local}; ${t.tol} ${P.TOLERANCIA_MINUTOS} min)`), lin(t.receb, `${hora(v.re)} (Brasília) · ${t.emis_brt}: ${hora(v.emB)}`));
    } else if (id === "T03" || id === "T04") {
      const n = id === "T03" ? v.n : v.ap;
      if (r.nivel === "na") out.push(lin(t.min, `${id === "T03" ? "n" : "aptos"} = ${n} < ${id === "T03" ? P.MIN_VOTOS_UNANIMIDADE : P.MIN_APTOS_ABSTENCAO}`));
      else if (v.lp == null) out.push(lin(t.evento, t.sem_evento));
      else { bb(); out.push(lin(t.p, `p = P(X = n) = B(n + α, β) / B(α, β) = B(${n} + ${fn(v.a, 2)}, ${fn(v.b, 2)}) / B(${fn(v.a, 2)}, ${fn(v.b, 2)}) = ${sci(v.lp)}`)); bh(v.M); }
    } else if (id === "T05" || id === "T07" || id === "T10") {
      if (r.nivel === "na") out.push(lin(t.min, `n = ${v.n} < ${P.MIN_VOTOS_PROPORCAO}`));
      else {
        bb();
        out.push(lin(t.obs, `x / n = ${v.x} / ${v.n} = ${fpct(v.x / v.n, 2)}`));
        out.push(lin(t.p, v.acima ? `p = P(X ≥ x) = Σₖ₌ₓⁿ C(n,k)·B(k+α, n−k+β)/B(α,β) = ${sci(v.lp)}` : t.abaixo));
        if (id === "T05" && isFinite(v.z)) out.push(lin(t.z, `z = 0,6745 · (pᵢ − mediana) / MAD = ${fn(v.z, 2)}`));
        bh(v.M);
      }
    } else if (id === "T06") {
      out.push(lin(t.blocos, `${t.exec}: E ${fpct(v.ex.e, 0)} / D ${fpct(v.ex.d, 0)} · ${t.leg}: E ${fpct(v.lg.e, 0)} / C ${fpct(v.lg.c, 0)} / D ${fpct(v.lg.d, 0)}`));
      out.push(lin(t.escores, `ē(${t.exec}) = ${fn(v.dx, 2)} · ē(${t.leg}) = ${fn(v.dl, 2)} · Δ = ${fn(v.delta, 2)}`));
      if (r.nivel === "na") out.push(lin(t.min, `${P.MIN_VOTOS_VOTO_CRUZADO}`));
      else {
        out.push(lin(t.critA, `≥ ${fpct(P.LIMIAR_BLOCO, 0)} → ${v.crA ? t.sim : t.nao}`));
        out.push(lin(t.critB, `z = 0,6745 · (Δ − ${fn(v.med, 2)}) / ${fn(v.mad, 3)} = ${fn(v.z, 2)}; |z| ≥ ${fn(P.LIMIAR_Z_ROBUSTO, 1)} → ${v.crB ? t.sim : t.nao}`));
      }
    } else if (id === "T08") {
      const q = v.alvo || {};
      if (r.nivel === "na" && !q.n) out.push(lin(t.min, `k = ${v.k} < ${P.MIN_SECOES_LOCAL}`));
      else {
        out.push(lin(t.phi, `φ = max(1, mediana(z₀²) / 0,4549) = ${fn(v.phi, 2)}`));
        if (q.pS != null) {
          out.push(lin(t.props, `p̂ = ${fpct(q.pS, 1)} · p̂(${t.demais}) = ${fpct(q.pR, 1)} · Δ = ${fn(q.dif, 1)} p.p.`));
          out.push(lin(t.z, `z₀ = ${fn(q.z0, 2)} · z = z₀ / √φ = ${fn(q.z, 2)} · p = 2·P(Z > |z|) = ${sci(q.lp)}`));
          out.push(lin(t.bh, `q = min(1, p × ${fn(v.M)}) = ${sci(q.lq)}`), lin(t.crit, `q < 0,01 ${q.q < 0.01 ? "✓" : "✗"} · |Δ| ≥ 25 p.p. ${Math.abs(q.dif) >= 25 ? "✓" : "✗"} → ${q.sinal ? t.sim : t.nao}`));
        }
      }
    } else if (id === "T09") {
      out.push(lin(t.igual, v.igual ? t.sim : t.nao), lin(t.nk, `n = ${v.n} · K = ${v.K}`));
      if (v.lpc != null) {
        out.push(lin(t.pcol, `P ≈ (4πn)^−(K−1)/2 · Π pᵢ^−1/2 = ${sci(v.lpc)}`));
        out.push(lin(t.pares, `N = ${fn(v.N)} → N(N−1)/2 = ${fn(v.pares)}`), lin(t.E, `E = P × ${t.pares_c} = ${sci(v.lE)}; E < 0,01 → ${v.E < 0.01 ? t.sim : t.nao}`));
      }
    } else if (id === "T13" || id === "T14") {
      out.push(lin(t.contagens, `N = ${v.N} · ${t.mediana} = ${fn(v.med, 0)}`));
      if (v.E) {
        out.push(lin(t.ref, s.ref === "modelo" ? t.ref_modelo : s.ref === "benford" ? t.ref_benford : t.ref_unif));
        out.push(lin(t.chi2, `χ² = Σ (O − E)² / E ${s.ref === "modelo" ? "/ (1 + 1/50)" : ""} = ${fn(v.chi2, 2)} · gl = 9 · p = ${sci(v.lp)}`));
        if (id === "T13") out.push(lin(t.medias, `${t.obs_m} ${fn(v.media, 3)} · ${t.esp_m} ${fn(v.mediaE, 3)} · Benford 4,187`));
        out.push(lin(t.bh, `q = min(1, p × ${fn(v.M)}) = ${sci(v.lq)} → ${v.q < 0.01 ? t.sim : t.nao}`));
      } else out.push(lin(t.min, `N ≥ ${P.MIN_CONTAGENS_DIGITOS} · ${t.mediana} ≥ ${P.MIN_MEDIANA_DIGITOS}`));
    } else if (id === "T15") {
      out.push(lin(t.canto, `t ≥ 90% e s ≥ 90%: ${t.obs_c} = ${v.obs} · ${t.esp_c} = Σ_g n_g·p_t,g·p_s,g = ${fn(v.esp, 2)}`));
      out.push(lin(t.razao, `${isFinite(v.razao) ? fn(v.razao, 2) : "∞"} · ${t.regra}: ${t.obs_c} ≥ 10 e ${t.razao_c} ≥ 3 → ${r.nivel === "insp" ? t.sim : t.nao}`));
      out.push(lin(t.corr, `r = ${fn(v.corr, 3)} (${t.pond})`));
    }
    return out.join("");
  }
  function tecnica(id, s, r) {
    const R = A.state.R, z = novo(id) && T35(), t = U().tl;
    const tx = z ? { metodo: z[id[0]][id][1], criterio: z[id[0]][id][2], limites: z[id[0]][id][3] } : R && R.testes_txt && (R.testes_txt[A.state.lang] || R.testes_txt.PT)[id];
    return `${tx ? `<h4>${esc(id[0] === "L" ? t.metodo_l || t.metodo : id[0] === "V" ? t.metodo_v || t.metodo : t.metodo)}</h4><p>${esc(tx.metodo)}</p><p><b>${esc(t.criterio)}:</b> ${esc(tx.criterio)}</p>` : ""}
      <h4>${esc(t.calc)}</h4><table class="sim-calc"><tbody>${calculo(id, s, r)}</tbody></table>
      ${tx ? `<p class="small muted"><b>${esc(t.limites)}:</b> ${esc(tx.limites)}</p>` : ""}
      ${id[0] === "L" && z ? `<p class="small t35-prelim">${icone("help")} ${esc(z.prelim)}</p>` : id[0] === "T" || id === "V1" || id === "V2" || id === "V3" || id === "V4" ? `<p class="small muted">${esc(U().nota_bh)}</p>` : ""}`;
  }

  // ===================================================================================================
  // Estado da página do teste
  // ===================================================================================================
  let ST = null;   // {id, modo: "missao"|"livre", i, s, s0, aba}
  function avaliar() { return M.T[ST.id].avaliar(ST.s); }
  function htmlCaso() {
    const id = ST.id, s = ST.s, r = avaliar();
    const ctl = PAINEL[id] ? PAINEL[id](s, r) : `<div class="sim-grade">${CTL[id].map((c) => controle(id, c, s)).join("")}</div>`;
    return { ctl, r };
  }
  function desenharCaso() {
    const box = $("#sim-caso");
    if (!box) return;
    const { ctl, r } = htmlCaso();
    box.querySelector(".sim-ctl").innerHTML = ctl;
    atualizar(r);
  }
  function atualizar(r) {
    r = r || avaliar();
    const id = ST.id, s = ST.s;
    if (PAINEL[id]) {   // painéis com marcas por linha: atualiza só as marcas, sem perder o foco
      const ativo = document.activeElement, k = ativo && ativo.dataset && ativo.dataset.k, pos = ativo && ativo.selectionStart;
      $("#sim-caso .sim-ctl").innerHTML = PAINEL[id](s, r);
      if (k) { const el = $(`#sim-caso .sim-ctl [data-k="${k}"]${ativo.type === "range" ? '[type="range"]' : ':not([type="range"])'}`); if (el) { el.focus(); try { if (pos != null) el.setSelectionRange(pos, pos); } catch (e) { /* range */ } } }
    }
    $("#sim-vis").innerHTML = visual(id, s, r);
    $("#sim-luz").innerHTML = luz(r);
    $("#sim-ex-s").innerHTML = simples(id, s, r);
    $("#sim-ex-t").innerHTML = tecnica(id, s, r);
    if (ST.modo === "missao") conferirMissao(r);
    clearTimeout(atualizar.g); atualizar.g = setTimeout(guardarCaso, 400);
  }
  function conferirMissao(r) {
    const m = M.T[ST.id].missoes[ST.i], ok = m.ok(ST.s, r, ST.s0), box = $("#sim-feito");
    if (!box) return;
    if (ok && box.hidden) {
      marcar(ST.id, ST.i);
      const tx = L()[ST.id].m[ST.i], prox = proxima(ST.id, ST.i);
      box.innerHTML = `<div class="sim-feito-in"><b>${icone("trophy")} ${esc(U().cumprida)}</b><p>${tx[2]}</p>
        <div class="sim-acoes">${prox != null ? `<a class="btn btn-primary btn-sm" href="#/simulador/${ST.id}/m/${prox}">${esc(U().proxima)}</a>` : ""}
        <button class="btn btn-sm" type="button" data-sim-refazer>${esc(U().refazer)}</button>
        ${feitas(ST.id).length >= libera(ST.id) ? `<a class="btn btn-sm" href="#/simulador/${ST.id}/prova">${icone("timer")} ${esc(U().ir_prova)}</a>` : ""}</div></div>`;
      box.hidden = false;
      const li = $(`.sim-mlist [data-mi="${ST.i}"]`); if (li) li.classList.add("sim-ok");
      const pr = $("#sim-prog"); if (pr) pr.innerHTML = progressoTeste(ST.id);
      box.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }
  function proxima(id, i) { const n = nM(id), f = new Set(feitas(id)); for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (!f.has(j)) return j; } return i + 1 < n ? i + 1 : null; }
  const progressoTeste = (id) => { const n = feitas(id).length, t = nM(id); return `<span class="sim-pbar"><span style="width:${(100 * n) / t}%"></span></span><span>${esc(U().missoes_n(n, t))}</span>`; };

  // ===================================================================================================
  // Páginas
  // ===================================================================================================
  function aviso() { return `<div class="sim-aviso" role="note">${icone("shield")}<p>${esc(U().aviso)}</p></div>`; }
  function migalha(itens) { return `<nav class="sim-mig" aria-label="${esc(U().migalha)}"><a href="#/simulador">${esc(U().titulo)}</a>${itens.map(([t, h]) => ` › ${h ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`}`).join("")}</nav>`; }
  const nomeT = (id) => `${U().teste} ${num(id)} · ${L()[id].nome}`;

  function paginaInicio() {
    const u = U(), nf = notaFinal(), pf = provasFeitas();
    const cartao = (id) => { const n = feitas(id).length, nt = notaDe(id); return `<a class="sim-card" href="#/simulador/${id}"><span class="sim-card-n">${num(id)}</span><b>${esc(L()[id].nome)}</b><span class="small muted">${esc(L()[id].curto)}</span>
      <span class="sim-card-p">${progressoTeste(id)}</span>${nt ? `<span class="sim-nota ${nt.melhor >= NOTA_MIN ? "sim-nota-ok" : "sim-nota-x"}">${esc(u.nota)} ${fn(nt.melhor, 1)}</span>` : ""}</a>`; };
    return `<header class="page-head sim-hero"><span class="sim-tag">${icone("lab")} ${esc(u.tag)}</span><h1>${esc(u.titulo)}</h1><p class="lead">${esc(u.sub)}</p></header>
      ${oQueTem()}${continuar()}${aviso()}
      <section class="sim-intro grid2"><div class="card"><h2>${esc(u.para_que)}</h2><ul class="checks">${u.para_que_l.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="card"><h2>${esc(u.como)}</h2><ol class="sim-passos">${u.como_l.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div></section>
      <section class="sim-tipos"><h2>${esc(u.tipos_t)}</h2><div class="grid3">${["s", "a", "d"].map((k) => `<div class="card sim-tipo sim-tipo-${k}"><b>${esc(u.tipos[k])}</b><p>${esc(u.tipos_d[k])}</p></div>`).join("")}</div></section>
      <section class="sim-painel card"><div><h2>${icone("trophy")} ${esc(u.boletim)}</h2><p>${esc(u.boletim_resumo(ORDEM.reduce((t, id) => t + feitas(id).length, 0), ORDEM.reduce((t, id) => t + nM(id), 0), pf, ORDEM.length))}</p>
        ${nf.total != null ? `<p><b>${esc(u.nota_final)}: ${fn(nf.total, 1)}</b></p>` : ""}</div>
        <div class="sim-acoes"><a class="btn btn-sm" href="#/simulador/boletim">${esc(u.ver_boletim)}</a><a class="btn btn-sm" href="#/simulador/perguntas">${icone("help")} ${esc(u.perguntas)}</a>
        <a class="btn btn-sm ${pf >= FINAL_MIN ? "btn-primary" : ""}" href="#/simulador/final">${pf >= FINAL_MIN ? icone("timer") : icone("lock")} ${esc(u.prova_final)}</a></div></section>
      ${GRUPOS.map(([g, ids]) => `<section class="sim-grupo" data-g="${g}"><h2>${esc(u.niveis[g])}</h2><p class="muted">${esc(u.niveis_d[g])}</p><div class="sim-cards">${ids.map(cartao).join("")}</div></section>`).join("")}`;
  }

  function oQueTem() {
    const u = U(), soma = (f) => ORDEM.reduce((t, id) => t + f(id), 0);
    const nMis = soma(nM), banco = soma((id) => (L()[id].prova || []).length + (L()[id].situ || []).length), faq = L().faqGeral.length + soma((id) => (L()[id].faq || []).length);
    const tiles = [[ORDEM.length, u.t_testes, u.t_testes_d, "flask"], [nMis, u.t_missoes, u.t_missoes_d, "list"], [ORDEM.length, u.t_livre, u.t_livre_d, "lab"],
      [ORDEM.length + 1, u.t_provas, u.t_provas_d, "timer"], [banco, u.t_banco, u.t_banco_d, "help"], [faq, u.t_faq, u.t_faq_d, "chat"]];
    return `<section class="sim-tem"><h2>${esc(u.t_titulo)}</h2><div class="tiles tiles-3">${tiles.map(([v, r, d, ic]) => A.tile(v, r, d, ic)).join("")}</div></section>`;
  }
  function ondeParou() {   // texto do último lugar em que a pessoa estava
    const u = U(), o = prog().u;
    if (!o || !o.h) return null;
    if (o.id === "final") return { h: o.h, t: u.prova_final, q: o.quando };
    if (!L()[o.id] || !M.T[o.id]) return null;
    const t = o.tipo === "prova" ? u.prova_de(L()[o.id].nome) : o.tipo === "livre" ? `${nomeT(o.id)} · ${u.aba_livre}` : `${nomeT(o.id)} · ${u.missao_n((o.i || 0) + 1, nM(o.id))}`;
    return { h: o.h, t, q: o.quando };
  }
  function continuar() {
    const u = U(), o = ondeParou(), ex = exAndamento(), feitasT = ORDEM.reduce((t, id) => t + feitas(id).length, 0), pf = provasFeitas();
    const quando = (q) => { try { return new Date(q).toLocaleString(loc(), { dateStyle: "short", timeStyle: "short" }); } catch (e) { return ""; } };
    const nomeEx = (x) => (x.id === "final" ? u.prova_final : u.prova_de(L()[x.id].nome));
    const acao = o || feitasT || pf || ex.length
      ? `<p class="sim-cont-onde">${o ? `${esc(u.ct_parou)}: <b>${esc(o.t)}</b> <span class="small muted">${esc(u.ct_quando(quando(o.q)))}</span>` : ""}</p>
        <p class="small">${esc(u.boletim_resumo(feitasT, ORDEM.reduce((t, id) => t + nM(id), 0), pf, ORDEM.length))}</p>
        ${ex.length ? `<div class="sim-cont-ex"><span class="small muted">${esc(u.ct_provas)}:</span>${ex.map((x) => `<a class="chip" href="#/simulador/${x.id === "final" ? "final" : x.id + "/prova"}">${icone("timer")} ${esc(nomeEx(x))}</a>`).join("")}</div>` : ""}
        <div class="sim-acoes">${o ? `<a class="btn btn-primary" href="${esc(o.h)}">${icone("play")} ${esc(u.ct_btn)}</a>` : `<a class="btn btn-primary" href="#/simulador/T01">${icone("play")} ${esc(u.ct_comecar)}</a>`}
          <button type="button" class="btn btn-sm" data-sim-escolher>${esc(u.ct_escolher)}</button></div>`
      : `<p class="sim-cont-onde">${esc(u.ct_novo)}</p><div class="sim-acoes"><a class="btn btn-primary" href="#/simulador/T01">${icone("play")} ${esc(u.ct_comecar)}</a><button type="button" class="btn btn-sm" data-sim-escolher>${esc(u.ct_escolher)}</button></div>`;
    return `<section class="card sim-cont"><h2>${icone("timer")} ${esc(u.ct_t)}</h2><div class="sim-cont-g"><ul class="checks">${u.ct_l.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <div class="sim-cont-acao" aria-live="polite">${acao}</div></div></section>`;
  }

  function cabecalhoTeste(id, aba) {
    const u = U(), T = L()[id], nt = notaDe(id), lib = feitas(id).length >= libera(id), z = T35();
    const tab = (k, h, rot, ic) => `<a class="sim-aba${aba === k ? " on" : ""}" href="${h}"${aba === k ? ' aria-current="page"' : ""}>${ic ? icone(ic) : ""}${esc(rot)}</a>`;
    return `${migalha([[nomeT(id)]])}<header class="page-head sim-thead"><span class="sim-tag">${esc(u.niveis[M.T[id].nivel])}</span><h1>${esc(nomeT(id))}</h1><p class="lead">${esc(T.curto)}</p>
      <div class="sim-prog" id="sim-prog">${progressoTeste(id)}</div>${nt ? `<span class="sim-nota ${nt.melhor >= NOTA_MIN ? "sim-nota-ok" : "sim-nota-x"}">${esc(u.nota)} ${fn(nt.melhor, 1)}</span>` : ""}</header>
      <nav class="sim-abas" aria-label="${esc(u.abas)}">${tab("missoes", `#/simulador/${id}`, u.aba_missoes)}${tab("livre", `#/simulador/${id}/livre`, u.aba_livre)}${tab("prova", `#/simulador/${id}/prova`, u.aba_prova, lib ? "timer" : "lock")}${tab("faq", `#/simulador/${id}/perguntas`, u.aba_faq)}</nav>
      ${aviso()}${id[0] === "L" && z ? `<p class="small t35-prelim">${icone("help")} ${esc(z.prelim)}</p>` : ""}`;
  }
  function listaMissoes(id, atual) {
    const u = U(), T = L()[id], f = new Set(feitas(id));
    return `<details class="sim-mlist"${window.innerWidth > 900 ? " open" : ""}><summary>${esc(u.missoes)}</summary>${["s", "a", "d"].map((tp) => `<div class="sim-mgrp"><span class="sim-chip sim-chip-${tp}">${esc(u.tipos[tp])}</span><ol>${M.T[id].missoes.map((m, i) => (m.t !== tp ? "" : `<li data-mi="${i}" class="${f.has(i) ? "sim-ok" : ""}${i === atual ? " on" : ""}"><a href="#/simulador/${id}/m/${i}">${esc(T.m[i][0])}</a></li>`)).join("")}</ol></div>`).join("")}</details>`;
  }
  function areaTrabalho(id, cab) {
    const u = U();
    return `${cab}<div class="sim-caso card sim-fict" id="sim-caso"><div class="sim-caso-h"><b>${icone("lab")} ${esc(u.caso)}</b><span class="sim-selo">${esc(u.ficticio)}</span></div><div class="sim-ctl"></div><div id="sim-vis"></div></div>
      <div class="sim-res card sim-fict"><div id="sim-luz"></div>
        <div class="sim-ex-abas" role="tablist"><button type="button" role="tab" class="on" data-sim-aba="s" aria-selected="true">${esc(u.ex_simples)}</button><button type="button" role="tab" data-sim-aba="t" aria-selected="false">${esc(u.ex_tecnica)}</button></div>
        <div id="sim-ex-s" class="sim-ex" role="tabpanel"></div><div id="sim-ex-t" class="sim-ex sim-tec" role="tabpanel" hidden></div></div>`;
  }
  function paginaMissao(id, i) {
    const u = U(), T = L()[id], m = M.T[id].missoes[i], tx = T.m[i];
    const cab = `<div class="sim-missao card"><div class="sim-missao-h"><span class="sim-chip sim-chip-${m.t}">${esc(u.tipos[m.t])}</span><span class="small muted">${esc(u.missao_n(i + 1, nM(id)))}</span></div>
      <h2>${esc(tx[0])}</h2><p>${tx[1]}</p><div class="sim-acoes"><button type="button" class="btn btn-sm" data-sim-dica>${esc(u.dica)}</button><button type="button" class="btn btn-sm btn-ghost" data-sim-refazer>${esc(u.restaurar)}</button></div>
      <div id="sim-feito" class="sim-feito" hidden></div></div>`;
    return `${cabecalhoTeste(id, "missoes")}<div class="sim-lay"><aside>${listaMissoes(id, i)}</aside><div class="sim-main">${areaTrabalho(id, cab)}</div></div>`;
  }
  function paginaLivre(id) {
    const u = U();
    const cab = `<div class="sim-missao card"><h2>${esc(u.livre_t)}</h2><p>${esc(u.livre_d)}</p><div class="sim-acoes"><button type="button" class="btn btn-sm" data-sim-novo>${esc(u.novo_caso)}</button><button type="button" class="btn btn-sm btn-ghost" data-sim-refazer>${esc(u.restaurar)}</button></div></div>`;
    return `${cabecalhoTeste(id, "livre")}<div class="sim-lay"><aside>${listaMissoes(id, -1)}</aside><div class="sim-main">${areaTrabalho(id, cab)}</div></div>`;
  }
  function paginaFaqTeste(id) {
    return `${cabecalhoTeste(id, "faq")}<section class="sim-faq">${faqItens(L()[id].faq, id)}</section>`;
  }
  const faqItens = (lista, id) => lista.map(([q, a], i) => `<details class="sim-fq" id="sim-fq-${id || "g"}-${i}"><summary>${esc(q)}</summary><div>${a}</div></details>`).join("");
  function paginaFaq() {
    const u = U();
    return `${migalha([[u.perguntas]])}<header class="page-head"><h1>${esc(u.perguntas)}</h1><p class="lead">${esc(u.perguntas_sub)}</p></header>${aviso()}
      <label class="sim-busca">${icone("search")}<input type="search" id="sim-busca" placeholder="${esc(u.buscar)}" aria-label="${esc(u.buscar)}"></label>
      <section class="sim-faq" data-g="geral"><h2>${esc(u.faq_geral)}</h2>${faqItens(L().faqGeral, "g")}</section>
      ${ORDEM.map((id) => `<section class="sim-faq" data-g="${id}"><h2>${esc(nomeT(id))}</h2>${faqItens(L()[id].faq, id)}</section>`).join("")}
      <p class="muted" id="sim-busca-nada" hidden>${esc(u.nada)}</p>`;
  }

  // ===================================================================================================
  // Provas
  // ===================================================================================================
  let EX = null, relogio = null;
  const embaralhar = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const RESP = Object.assign({ T03: ["anom", "info", "ok", "na"], T11: ["anom", "info", "ok"], T12: ["anom", "info", "ok"], T15: ["insp", "ok"] }, M.RESP2 || {});
  function qConceito(id, q, r) {
    const ops = embaralhar([0, 1, 2, 3], r);
    return { tipo: "conceito", id, texto: q[0], opcoes: ops.map((k) => q[1 + k]), certa: ops.indexOf(0), explic: q[5] };
  }
  function qCenario(id, r) {
    const s = M.T[id].cenario(r), res = M.T[id].avaliar(s), ops = RESP[id] || ["anom", "ok", "na"];
    const T = L()[id];
    return { tipo: "cenario", id, texto: U().prova_cen(T.nome), ficha: T.ficha(s, F()), opcoes: ops.map((k) => U().resp[k]), certa: ops.indexOf(res.nivel),
      explic: L()[id].simples(s, res, F()).join(" ") };
  }
  function qQual(r, alvo) {
    const sit = L()[alvo].situ[r.int(0, L()[alvo].situ.length - 1)];
    const outros = embaralhar(ORDEM.filter((x) => x !== alvo), r).slice(0, 3), ops = embaralhar([alvo].concat(outros), r);
    return { tipo: "qual", id: alvo, texto: U().prova_qual, ficha: sit, opcoes: ops.map((x) => nomeT(x)), certa: ops.indexOf(alvo), explic: U().qual_explic(nomeT(alvo), L()[alvo].curto) };
  }
  function montarProva(id) {
    const r = M.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    let qs;
    if (id === "final") {
      const alvos = embaralhar(ORDEM, r).slice(0, 12), resto = embaralhar(ORDEM.concat(ORDEM), r).slice(0, 18);
      qs = alvos.map((a) => qQual(r, a)).concat(resto.map((t, i) => (i % 2 ? qCenario(t, r) : qConceito(t, L()[t].prova[r.int(0, L()[t].prova.length - 1)], r))));
      qs = embaralhar(qs, r);
    } else {
      const B = embaralhar(L()[id].prova, r).slice(0, 6).map((q) => qConceito(id, q, r));
      const C = Array.from({ length: Q_PROVA - B.length }, () => qCenario(id, r));
      qs = embaralhar(B.concat(C), r);
    }
    qs = qs.filter((q) => q.certa >= 0);
    EX = { id, qs, resp: qs.map(() => null), marc: qs.map(() => false), i: 0, ini: Date.now(), gasto: 0, desde: null, lim: id === "final" ? TEMPO_FINAL : TEMPO_PROVA, entregue: false, lang: A.state.lang };
  }
  // tempo usado = tempo já guardado + o trecho que está correndo agora (o relógio só corre com a prova na tela)
  const usado = () => (EX ? (EX.gasto || 0) + (EX.desde ? (Date.now() - EX.desde) / 1000 : 0) : 0);
  const restante = () => Math.max(0, EX.lim - Math.floor(usado()));
  function pausar(tela) {
    clearInterval(relogio);
    if (!EX || EX.entregue) return;
    if (EX.desde) { EX.gasto = usado(); EX.desde = null; }
    if (tela) EX.pausa = true;
    exGuardar();
  }
  function retomar() { if (EX && !EX.entregue && !EX.desde) EX.desde = Date.now(); }
  const mmss = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  function cabProva(id) {
    if (id === "final") return `${migalha([[U().prova_final]])}<header class="page-head"><h1>${esc(U().prova_final)}</h1><p class="lead">${esc(U().final_sub)}</p></header>${aviso()}`;
    return cabecalhoTeste(id, "prova");
  }
  function paginaProva(id) {
    const u = U();
    if (id !== "final" && feitas(id).length < libera(id)) return `${cabProva(id)}<section class="card sim-bloq">${icone("lock")}<h2>${esc(u.prova_bloq_t)}</h2><p>${esc(u.prova_bloq(libera(id), feitas(id).length))}</p><a class="btn btn-primary btn-sm" href="#/simulador/${id}">${esc(u.aba_missoes)}</a></section>`;
    if (id === "final" && provasFeitas() < FINAL_MIN) return `${cabProva(id)}<section class="card sim-bloq">${icone("lock")}<h2>${esc(u.prova_bloq_t)}</h2><p>${esc(u.final_bloq(provasFeitas(), FINAL_MIN))}</p><a class="btn btn-primary btn-sm" href="#/simulador/boletim">${esc(u.ver_boletim)}</a></section>`;
    return `${cabProva(id)}<section id="sim-prova" class="sim-prova"></section>`;
  }
  function telaRegras(id) {
    const u = U(), nt = notaDe(id), fin = id === "final";
    return `<div class="card sim-regras"><h2>${icone("timer")} ${esc(fin ? u.prova_final : u.prova_de(L()[id].nome))}</h2><ul class="checks">${u.regras(fin ? Q_FINAL : Q_PROVA, mmss(fin ? TEMPO_FINAL : TEMPO_PROVA), NOTA_MIN, fin).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      ${nt ? `<p class="muted">${esc(u.tentativas(nt.tent, fn(nt.melhor, 1), fn(nt.ultima, 1)))}</p>` : ""}
      <div class="sim-acoes"><button type="button" class="btn btn-primary" data-sim-comecar>${esc(u.comecar)}</button></div></div>`;
  }
  function telaQuestao() {
    const u = U(), q = EX.qs[EX.i], n = EX.qs.length, resp = EX.resp[EX.i];
    const tipo = { conceito: u.q_conceito, cenario: u.q_cenario, qual: u.q_qual }[q.tipo];
    return `<div class="sim-prova-barra"><b>${esc(EX.id === "final" ? u.prova_final : nomeT(EX.id))}</b><span>${esc(u.questao_n(EX.i + 1, n))}</span><span class="sim-tempo" id="sim-tempo">${icone("timer")} ${mmss(restante())}</span><span>${esc(u.respondidas(EX.resp.filter((x) => x != null).length, n))}</span></div>
      <nav class="sim-qmapa" aria-label="${esc(u.mapa)}">${EX.qs.map((_, k) => `<button type="button" data-sim-ir="${k}" class="${k === EX.i ? "on " : ""}${EX.resp[k] != null ? "resp " : ""}${EX.marc[k] ? "marc" : ""}" aria-label="${esc(u.questao_n(k + 1, n))}">${k + 1}</button>`).join("")}</nav>
      <article class="card sim-q sim-fict"><div class="sim-q-h"><span class="sim-chip">${esc(tipo)}</span><span class="small muted">${esc(u.vale(1))}</span></div>
        <h2 class="sim-q-t">${esc(q.texto)}</h2>${q.ficha ? `<div class="sim-ficha">${q.ficha}</div>` : ""}
        <div class="sim-ops" role="radiogroup">${q.opcoes.map((o, k) => `<label class="sim-op${resp === k ? " on" : ""}"><input type="radio" name="sim-op" value="${k}"${resp === k ? " checked" : ""}><span class="sim-op-l">${"ABCDE"[k]}</span><span>${esc(o)}</span></label>`).join("")}</div>
        <label class="sim-liga sim-marcar"><input type="checkbox" data-sim-marcar${EX.marc[EX.i] ? " checked" : ""}> ${esc(u.marcar)}</label></article>
      <div class="sim-acoes sim-prova-nav"><button type="button" class="btn btn-sm" data-sim-ant${EX.i === 0 ? " disabled" : ""}>${esc(u.anterior)}</button>
        <button type="button" class="btn btn-sm btn-primary" data-sim-prox>${esc(EX.i === n - 1 ? u.revisar : u.proxima_q)}</button>
        <button type="button" class="btn btn-sm btn-ghost" data-sim-entregar>${esc(u.entregar)}</button></div>`;
  }
  function telaRevisao() {
    const u = U(), n = EX.qs.length, sem = EX.resp.filter((x) => x == null).length, mc = EX.marc.filter(Boolean).length;
    return `<div class="card sim-regras"><h2>${esc(u.revisao_t)}</h2><p>${esc(u.revisao(n - sem, n, sem, mc))}</p>
      <nav class="sim-qmapa">${EX.qs.map((_, k) => `<button type="button" data-sim-ir="${k}" class="${EX.resp[k] != null ? "resp " : ""}${EX.marc[k] ? "marc" : ""}">${k + 1}</button>`).join("")}</nav>
      <div class="sim-acoes"><button type="button" class="btn btn-primary" data-sim-entregar-ja>${esc(u.entregar)}</button></div></div>`;
  }
  function entregar() {
    if (!EX || EX.entregue) return;
    EX.seg = Math.round(usado()); EX.gasto = EX.seg; EX.desde = null;
    EX.entregue = true; EX.fim = Date.now();
    clearInterval(relogio);
    exApagar(EX.id);
    const ac = EX.qs.reduce((t, q, k) => t + (EX.resp[k] === q.certa ? 1 : 0), 0), nota = Math.round((100 * ac) / EX.qs.length) / 10;
    EX.nota = nota; EX.ac = ac;
    registrarNota(EX.id, nota, { ac, total: EX.qs.length, seg: EX.seg });
    mostrarProva();
  }
  function telaResultado() {
    const u = U(), n = EX.qs.length, ok = EX.nota >= NOTA_MIN, seg = EX.seg != null ? EX.seg : Math.round((EX.fim - EX.ini) / 1000);
    const porTipo = {};
    EX.qs.forEach((q, k) => { const t = (porTipo[q.tipo] = porTipo[q.tipo] || [0, 0]); t[1]++; if (EX.resp[k] === q.certa) t[0]++; });
    const erradosT = [...new Set(EX.qs.filter((q, k) => EX.resp[k] !== q.certa).map((q) => q.id))];
    const sit = EX.nota >= 9 ? u.sit_dist : ok ? u.sit_aprov : EX.nota >= 5 ? u.sit_rec : u.sit_refazer;
    return `<div class="card sim-nota-final ${ok ? "sim-ok-box" : "sim-x-box"}"><span class="sim-nota-grande">${fn(EX.nota, 1)}</span><div><b>${esc(sit)}</b><p>${esc(u.resultado(EX.ac, n, mmss(seg)))}</p>
      <p class="small">${Object.entries(porTipo).map(([t, [a, b]]) => `${esc({ conceito: u.q_conceito, cenario: u.q_cenario, qual: u.q_qual }[t])}: ${a}/${b}`).join(" · ")}</p></div></div>
      ${!ok ? `<div class="card"><h3>${esc(u.recomenda)}</h3><ul>${erradosT.map((t) => `<li><a href="#/simulador/${t}">${esc(nomeT(t))}</a></li>`).join("")}</ul></div>` : ""}
      <div class="sim-acoes"><button type="button" class="btn btn-primary btn-sm" data-sim-refazer-prova>${esc(u.refazer_prova)}</button><a class="btn btn-sm" href="#/simulador/boletim">${esc(u.ver_boletim)}</a>
        ${EX.id !== "final" ? `<a class="btn btn-sm" href="#/simulador/${EX.id}">${esc(u.aba_missoes)}</a>` : ""}</div>
      <h2>${esc(u.correcao)}</h2>${EX.qs.map((q, k) => { const c = EX.resp[k] === q.certa; return `<details class="sim-corr ${c ? "sim-corr-ok" : "sim-corr-x"}"${c ? "" : " open"}><summary>${c ? icone("check") : icone("x")} ${esc(u.questao_n(k + 1, n))} — ${esc(q.texto)}</summary>
        ${q.ficha ? `<div class="sim-ficha">${q.ficha}</div>` : ""}<p><b>${esc(u.sua)}:</b> ${EX.resp[k] == null ? esc(u.sem_resp) : esc(q.opcoes[EX.resp[k]])}</p><p><b>${esc(u.certa)}:</b> ${esc(q.opcoes[q.certa])}</p><p>${q.explic}</p></details>`; }).join("")}`;
  }
  function telaRetomar() {
    const u = U(), n = EX.qs.length, r = EX.resp.filter((x) => x != null).length;
    return `<div class="card sim-regras sim-retoma"><h2>${icone("timer")} ${esc(u.ret_t)}</h2><p>${esc(u.ret_d(r, n, mmss(restante())))}</p><p class="small muted">${esc(u.ret_nota)}</p>
      <div class="sim-acoes"><button type="button" class="btn btn-primary" data-sim-continuar>${icone("play")} ${esc(u.ret_btn)}</button><button type="button" class="btn btn-sm btn-ghost" data-sim-descartar>${esc(u.ret_nova)}</button></div></div>`;
  }
  function mostrarProva() {
    const box = $("#sim-prova");
    if (!box) return;
    if (EX && EX.id === ST.prova && EX.entregue && !EX.mostrado && EX.lang === A.state.lang) { EX.mostrado = true; box.innerHTML = telaResultado(); window.scrollTo({ top: box.offsetTop - 80, behavior: "smooth" }); return; }
    if (!EX || EX.id !== ST.prova || EX.entregue || EX.lang !== A.state.lang) {
      const sv = exSalvo(ST.prova);   // prova deixada pela metade (outra visita, outro dia)
      if (!sv) { box.innerHTML = telaRegras(ST.prova); return; }
      clearInterval(relogio); EX = sv; EX.desde = null; EX.pausa = true;
    }
    if (EX.pausa) { box.innerHTML = telaRetomar(); return; }
    retomar(); exGuardar();
    box.innerHTML = EX.i >= EX.qs.length ? telaRevisao() : telaQuestao();
    clearInterval(relogio);
    let tique = 0;
    relogio = setInterval(() => {
      if (EX && !EX.entregue && ++tique % 15 === 0) exGuardar();
      if (!EX || EX.entregue) { clearInterval(relogio); return; }
      const t = restante(), el = $("#sim-tempo");
      if (el) { el.innerHTML = `${icone("timer")} ${mmss(t)}`; el.classList.toggle("sim-tempo-fim", t < 60); }
      if (t <= 0) entregar();
      if (!$("#sim-prova")) clearInterval(relogio);
    }, 1000);
  }

  // ===================================================================================================
  // Boletim
  // ===================================================================================================
  function paginaBoletim() {
    const u = U(), nf = notaFinal(), fin = notaDe("final");
    const sit = (nt) => (!nt ? `<span class="muted">${esc(u.nao_feita)}</span>` : nt.melhor >= NOTA_MIN ? `<span class="sim-nota sim-nota-ok">${esc(u.aprovado)}</span>` : `<span class="sim-nota sim-nota-x">${esc(u.refazer_t)}</span>`);
    let geral = u.em_andamento;
    if (nf.total != null) geral = nf.total >= 9 ? u.sit_dist : nf.total >= NOTA_MIN ? u.sit_aprov : nf.total >= 5 ? u.sit_rec : u.sit_refazer;
    return `${migalha([[u.boletim]])}<header class="page-head"><h1>${esc(u.boletim)}</h1><p class="lead">${esc(u.boletim_sub)}</p></header>${aviso()}
      <section class="card sim-nota-final ${nf.total != null && nf.total >= NOTA_MIN ? "sim-ok-box" : ""}"><span class="sim-nota-grande">${nf.total != null ? fn(nf.total, 1) : "—"}</span>
        <div><b>${esc(u.nota_final)}: ${esc(geral)}</b><p>${esc(u.formula(fn(nf.med, 1), fin ? fn(fin.melhor, 1) : "—"))}</p></div></section>
      <div class="table-wrap"><table class="sim-tab sim-bol"><thead><tr><th>${esc(u.teste)}</th><th>${esc(u.missoes)}</th><th>${esc(u.melhor)}</th><th>${esc(u.ultima)}</th><th>${esc(u.tent)}</th><th>${esc(u.situacao)}</th></tr></thead><tbody>
      ${ORDEM.map((id) => { const nt = notaDe(id); return `<tr><th><a href="#/simulador/${id}">${esc(nomeT(id))}</a></th><td>${feitas(id).length}/${nM(id)}</td><td>${nt ? fn(nt.melhor, 1) : "—"}</td><td>${nt ? fn(nt.ultima, 1) : "—"}</td><td>${nt ? nt.tent : 0}</td><td>${sit(nt)}</td></tr>`; }).join("")}
      <tr class="sim-tot"><th><a href="#/simulador/final">${esc(u.prova_final)}</a></th><td>—</td><td>${fin ? fn(fin.melhor, 1) : "—"}</td><td>${fin ? fn(fin.ultima, 1) : "—"}</td><td>${fin ? fin.tent : 0}</td><td>${sit(fin)}</td></tr></tbody></table></div>
      <p class="small muted">${esc(u.so_aqui)}</p><div class="sim-acoes"><button type="button" class="btn btn-sm btn-ghost" data-sim-apagar>${esc(u.apagar)}</button></div>`;
  }

  // ===================================================================================================
  // Proteção: sem compartilhar, copiar, imprimir, salvar ou incorporar. Faixa vermelha no rodapé.
  // ===================================================================================================
  const ativo = () => document.documentElement.classList.contains("sim-on");
  const emQuadro = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  function marcaDagua() {   // só a faixa vermelha e a tela de bloqueio (a marca d'água foi retirada)
    const u = U();
    if (!$("#sim-faixa")) {
      const b = document.createElement("div"); b.id = "sim-faixa"; b.setAttribute("role", "note");
      const o = document.createElement("div"); o.id = "sim-bloqueio"; o.hidden = true; o.setAttribute("role", "alertdialog");
      document.body.append(b, o);
    }
    $("#sim-faixa").innerHTML = `${icone("shield")}<span>${esc(u.faixa)}</span>`;
  }
  function bloquear(motivo) {
    if (!ativo()) return;
    const o = $("#sim-bloqueio"), u = U();
    document.documentElement.classList.add("sim-oculto");
    o.innerHTML = `<div class="sim-bloq-in">${icone("shield")}<h2>${esc(u.bloq_t)}</h2><p>${esc(u.bloq)}</p><p class="small muted">${esc(u.bloq_m[motivo] || "")}</p><button type="button" class="btn btn-primary" data-sim-voltar>${esc(u.bloq_voltar)}</button></div>`;
    o.hidden = false;
    const b = o.querySelector("[data-sim-voltar]"); if (b) setTimeout(() => b.focus(), 50);
  }
  function desbloquear() { const o = $("#sim-bloqueio"); if (o) o.hidden = true; document.documentElement.classList.remove("sim-oculto"); }
  function limparAreaTransferencia() { try { if (navigator.clipboard && document.hasFocus()) navigator.clipboard.writeText(U().bloq).catch(() => {}); } catch (e) { /* sem permissão */ } }
  function protecao() {
    if (protecao.feito) return;
    protecao.feito = true;
    // botões das ferramentas gerais do site (compartilhar, imagem, imprimir, exportar, avisar erro, copiar)
    document.addEventListener("click", (e) => {
      if (!ativo()) return;
      if (e.target.closest("[data-share], [data-img], [data-print], [data-export], [data-report], [data-copy], [data-mais], [data-save]")) { e.preventDefault(); e.stopImmediatePropagation(); bloquear("ferr"); }
    }, true);
    ["copy", "cut", "dragstart", "contextmenu"].forEach((ev) => document.addEventListener(ev, (e) => { if (!ativo()) return; if (ev === "contextmenu" && e.target.closest("input, select")) return; e.preventDefault(); if (ev !== "dragstart") bloquear(ev === "contextmenu" ? "menu" : "copia"); }, true));
    document.addEventListener("selectstart", (e) => { if (ativo() && !e.target.closest("input, select, textarea")) e.preventDefault(); }, true);
    let meta = false, shift = false;
    document.addEventListener("keydown", (e) => {
      if (!ativo()) return;
      const k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
      if (e.key === "Meta" || e.key === "OS") meta = true;
      if (e.key === "Shift") shift = true;
      if (k === "printscreen" || (meta && shift) || (e.metaKey && e.shiftKey)) { bloquear("print"); limparAreaTransferencia(); return; }
      if (mod && ["p", "s", "c", "x", "a", "u"].includes(k) && !(k === "a" && e.target.closest("input"))) { e.preventDefault(); e.stopPropagation(); bloquear(k === "p" ? "imprimir" : k === "s" ? "salvar" : "copia"); }
    }, true);
    document.addEventListener("keyup", (e) => {
      if (e.key === "Meta" || e.key === "OS") meta = false;
      if (e.key === "Shift") shift = false;
      if (ativo() && (e.key || "").toLowerCase() === "printscreen") { bloquear("print"); limparAreaTransferencia(); }
    }, true);
    window.addEventListener("blur", () => { meta = shift = false; if (ativo()) document.documentElement.classList.add("sim-fora"); });
    window.addEventListener("focus", () => document.documentElement.classList.remove("sim-fora"));
    document.addEventListener("visibilitychange", () => { if (ativo() && document.hidden) document.documentElement.classList.add("sim-fora"); });
    window.addEventListener("beforeprint", () => { if (ativo()) bloquear("imprimir"); });
    document.addEventListener("click", (e) => { if (e.target.closest("[data-sim-voltar]")) desbloquear(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sim-bloqueio").hidden) desbloquear(); });
  }
  function ligar(on) {
    document.documentElement.classList.toggle("sim-on", on);
    if (!on) { document.documentElement.classList.remove("sim-oculto", "sim-fora"); const o = $("#sim-bloqueio"); if (o) o.hidden = true; }
  }

  // ===================================================================================================
  // Rotas e eventos
  // ===================================================================================================
  function html(p) {
    const u = U(), sub = p[1], id = sub && /^(T\d\d|V\d|L\d\d)$/.test(sub) && L()[sub] ? sub : null;
    if (emQuadro || new URLSearchParams(location.search).get("embed") === "1") return `<section class="card sim-bloq">${icone("shield")}<h2>${esc(u.bloq_t)}</h2><p>${esc(u.so_no_site)}</p><a class="btn btn-primary" href="${esc(location.origin + location.pathname + "#/simulador")}" target="_top" rel="noopener">${esc(u.abrir_site)}</a></section>`;
    pausar(true);
    ST = null;
    if (sub === "perguntas") return paginaFaq();
    if (sub === "boletim") return paginaBoletim();
    if (sub === "final") { ST = { prova: "final" }; lugar({ h: "#/simulador/final", id: "final", tipo: "prova" }); return paginaProva("final"); }
    if (!id || !M.T[id]) return paginaInicio();
    if (p[2] === "livre") { ST = { id, modo: "livre" }; lugar({ h: `#/simulador/${id}/livre`, id, tipo: "livre" }); return paginaLivre(id); }
    if (p[2] === "prova") { ST = { prova: id }; lugar({ h: `#/simulador/${id}/prova`, id, tipo: "prova" }); return paginaProva(id); }
    if (p[2] === "perguntas") return paginaFaqTeste(id);
    let i = p[2] === "m" ? +p[3] : null;
    if (i == null || !(i >= 0 && i < nM(id))) { const f = new Set(feitas(id)); i = [...Array(nM(id)).keys()].find((k) => !f.has(k)); if (i == null) i = 0; }
    ST = { id, modo: "missao", i };
    lugar({ h: `#/simulador/${id}/m/${i}`, id, tipo: "missao", i });
    return paginaMissao(id, i);
  }
  function iniciar() {
    marcaDagua();
    if (ST && ST.id) {
      const c = casoSalvo();   // volta ao caso em que a pessoa estava mexendo
      let ok = false;
      if (c) { try { ST.s = M.clone(c.s); ST.s0 = M.clone(c.s0 || c.s); M.T[ST.id].avaliar(ST.s); ok = true; } catch (e) { ok = false; } }
      if (!ok) { ST.s = ST.modo === "missao" ? M.estadoMissao(ST.id, ST.i) : M.T[ST.id].base(); ST.s0 = M.clone(ST.s); }
      desenharCaso();
    }
    if (ST && ST.prova) mostrarProva();
  }
  function lerValor(el) {
    if (el.type === "checkbox") return el.checked;
    if (el.type === "time") { const [h, m, s] = el.value.split(":").map(Number); return (h || 0) * 3600 + (m || 0) * 60 + (s || 0); }
    if (el.tagName === "SELECT") return el.hasAttribute("data-num") ? +el.value : el.value;
    const v = parseFloat(String(el.value).replace(",", "."));
    return isFinite(v) ? v : 0;
  }
  function aoMudar(e, fimDeMudanca) {
    const el = e.target.closest("[data-k]");
    if (!el || !ST || !ST.s || !el.closest("#sim-caso")) return;
    const k = el.dataset.k;
    let v = lerValor(el);
    if (el.type === "range" || (el.type === "number" && el.max !== "")) { const mn = parseFloat(el.min), mx = parseFloat(el.max); if (el.type === "range" || fimDeMudanca) { if (isFinite(mn)) v = Math.max(mn, v); if (isFinite(mx)) v = Math.min(mx, v); } }
    const segue = { T03: { n: "a" }, T04: { ap: "co" } }[ST.id], sg = segue && segue[k];
    if (sg && M.ler(ST.s, sg) === M.ler(ST.s, k)) { M.setar(ST.s, sg, v); $$(`#sim-caso [data-k="${sg}"]`).forEach((o) => { o.max = v; o.value = v; }); }
    M.setar(ST.s, k, v);
    $$(`#sim-caso [data-k="${k}"]`).forEach((o) => { if (o !== el && o.type !== "checkbox") o.value = el.type === "time" ? el.value : v; });
    if (el.hasAttribute("data-re") && fimDeMudanca) { desenharCaso(); return; }
    if (fimDeMudanca && !PAINEL[ST.id]) {   // limites que dependem de outros campos (ex.: votos de A ≤ votos válidos)
      CTL[ST.id].forEach((c) => { if (typeof c.max === "function") { const mx = c.max(ST.s); $$(`#sim-caso [data-k="${c.k}"]`).forEach((o) => { o.max = mx; }); if (M.ler(ST.s, c.k) > mx) { M.setar(ST.s, c.k, mx); $$(`#sim-caso [data-k="${c.k}"]`).forEach((o) => { o.value = mx; }); } } });
    }
    clearTimeout(aoMudar.t);
    const pesado = ["T13", "T14", "T15"].includes(ST.id);
    if (pesado && !fimDeMudanca) aoMudar.t = setTimeout(() => atualizar(), 90); else atualizar();
  }
  document.addEventListener("input", (e) => { if (e.target.closest("#sim-caso")) aoMudar(e, e.target.type !== "range" && e.target.type !== "number"); });
  document.addEventListener("change", (e) => { if (e.target.closest("#sim-caso")) aoMudar(e, true); });
  document.addEventListener("click", (e) => {
    if (!ativo()) return;
    const ab = e.target.closest("[data-sim-aba]");
    if (ab) { const k = ab.dataset.simAba; $$("[data-sim-aba]").forEach((b) => { b.classList.toggle("on", b === ab); b.setAttribute("aria-selected", b === ab); }); $("#sim-ex-s").hidden = k !== "s"; $("#sim-ex-t").hidden = k !== "t"; return; }
    if (e.target.closest("[data-sim-refazer]") && ST && ST.id) { ST.s = M.clone(ST.s0); const f = $("#sim-feito"); if (f) { f.hidden = true; f.innerHTML = ""; } desenharCaso(); return; }
    if (e.target.closest("[data-sim-novo]") && ST && ST.id) { const r = M.rng((Math.random() * 1e9) >>> 0); ST.s = M.T[ST.id].cenario(r); ST.s0 = M.clone(ST.s); desenharCaso(); return; }
    if (e.target.closest("[data-sim-copiar]") && ST && ST.s) { ST.s.v2 = ST.s.v1.slice(); atualizar(); return; }
    if (e.target.closest("[data-sim-dica]") && ST && ST.id) {
      const m = M.T[ST.id].missoes[ST.i], alvo = $(`#sim-caso [data-c="${m.foco}"]`) || $(`#sim-caso [data-k="${m.foco}"]`) || $(`#sim-caso [data-sim-${m.foco}]`);
      if (alvo) { const el = alvo.closest(".sim-c, td, tr, button, label") || alvo; el.classList.remove("sim-dica"); void el.offsetWidth; el.classList.add("sim-dica"); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
      return;
    }
    if (e.target.closest("[data-sim-continuar]") && EX) { EX.pausa = false; mostrarProva(); return; }
    if (e.target.closest("[data-sim-descartar]") && EX) { exApagar(EX.id); EX = null; montarProva(ST.prova); mostrarProva(); return; }
    if (e.target.closest("[data-sim-escolher]")) { const g = $(".sim-grupo"); if (g) g.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (e.target.closest("[data-sim-comecar]")) { montarProva(ST.prova); mostrarProva(); window.scrollTo({ top: $("#sim-prova").offsetTop - 90 }); return; }
    const ir = e.target.closest("[data-sim-ir]"); if (ir && EX && !EX.entregue) { EX.i = +ir.dataset.simIr; mostrarProva(); return; }
    if (e.target.closest("[data-sim-ant]") && EX) { EX.i = Math.max(0, EX.i - 1); mostrarProva(); return; }
    if (e.target.closest("[data-sim-prox]") && EX) { EX.i += 1; mostrarProva(); return; }
    if (e.target.closest("[data-sim-entregar]") && EX) { EX.i = EX.qs.length; mostrarProva(); return; }
    if (e.target.closest("[data-sim-entregar-ja]") && EX) { entregar(); return; }
    if (e.target.closest("[data-sim-refazer-prova]")) { EX = null; montarProva(ST.prova); mostrarProva(); return; }
    if (e.target.closest("[data-sim-apagar]")) { if (window.confirm(U().apagar_conf)) { salvar({}); exGravar({}); EX = null; A.render(); } return; }
  });
  document.addEventListener("change", (e) => {
    if (!EX || EX.entregue) return;
    if (e.target.name === "sim-op") { EX.resp[EX.i] = +e.target.value; $$(".sim-op").forEach((l) => l.classList.toggle("on", l.contains(e.target))); const b = $(`[data-sim-ir="${EX.i}"]`); if (b) b.classList.add("resp"); exGuardar(); return; }
    if (e.target.matches("[data-sim-marcar]")) { EX.marc[EX.i] = e.target.checked; const b = $(`[data-sim-ir="${EX.i}"]`); if (b) b.classList.toggle("marc", e.target.checked); exGuardar(); }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id !== "sim-busca") return;
    const q = e.target.value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
    let algum = false;
    $$(".sim-faq").forEach((sec) => {
      let n = 0;
      sec.querySelectorAll(".sim-fq").forEach((d) => { const ok = !q || d.textContent.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q); d.hidden = !ok; if (ok) n++; if (q && ok) d.open = true; });
      sec.hidden = n === 0; if (n) algum = true;
    });
    $("#sim-busca-nada").hidden = algum;
  });
  document.addEventListener("pagina", (e) => { ligar(e.detail.ativo === "sim"); if (e.detail.ativo !== "sim") pausar(true); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { pausar(false); guardarCaso(); return; }
    if (EX && !EX.entregue && !EX.pausa && ST && ST.prova === EX.id && $("#sim-prova")) mostrarProva();
  });
  window.addEventListener("pagehide", () => { pausar(false); guardarCaso(); });

  protecao();
  A.simulador = { html, iniciar, ligar, bloquear, ORDEM };
})();
