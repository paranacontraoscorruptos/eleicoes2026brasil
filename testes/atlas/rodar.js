#!/usr/bin/env node
/* Bateria de testes do motor do Atlas (site/js/motor.js), sem navegador:
     1) base de perguntas e respostas (PT, EN, ES): cada pergunta da base, com erro de digitação, plural trocado
        e frase de "enchimento", tem de achar a sua resposta (acerto mínimo por idioma);
     2) perguntas escritas à mão (perguntas.json): intenção, lugar, zona, seção, turno, testes, medida e conversa;
     3) pedidos de conversa (conversa.json): comandos sobre a resposta, várias tarefas, ações, contas e referências.
   Uso: node testes/atlas/rodar.js   (sai com código 1 se algo ficar abaixo do esperado) */
"use strict";
const fs = require("fs"), vm = require("vm"), path = require("path");
const RAIZ = path.resolve(__dirname, "../..");
const ler = (p) => fs.readFileSync(path.join(RAIZ, p), "utf8");
const MINIMO = { PT: 0.96, EN: 0.96, ES: 0.95 };

const ctx = { console };
ctx.window = ctx; ctx.self = ctx;
vm.createContext(ctx);
vm.runInContext(ler("site/js/i18n.js"), ctx);
vm.runInContext(ler("site/js/motor.js"), ctx);
const M = ctx.MOTOR;
const R = JSON.parse(ler("site/data/resumo.json")), muns = JSON.parse(ler("site/data/municipios.json"));
const cands = [];
["1", "2"].forEach((n) => R.turnos[n].presidente.candidatos.forEach((c) => { if (!cands.some((x) => x.nr === c.nr)) cands.push({ nr: c.nr, nome: c.nome }); }));
const kbs = {};
const configurar = (lang) => { kbs[lang] = kbs[lang] || JSON.parse(ler(`site/data/kb_${lang.toLowerCase()}.json`)); M.configurar({ lang, kb: kbs[lang], muns, ufNomes: ctx.UF_NOMES, cands }); };

// --- 1) base -----------------------------------------------------------------------------------------------------------
const PREF = { PT: ["me explica ", "quero saber ", "você pode me dizer "], EN: ["can you tell me ", "i want to know ", "please explain "], ES: ["puedes decirme ", "quiero saber ", "explícame "] };
function aleatorio(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }
function casosBase(lang) {
  const kb = kbs[lang], dono = new Map(), r = aleatorio(42), casos = [];
  kb.forEach((e) => e.q.forEach((q) => { const k = q.toLowerCase().trim(); dono.set(k, dono.has(k) && dono.get(k) !== e.i ? null : e.i); }));
  kb.forEach((e) => {
    e.q.forEach((q) => { if (dono.get(q.toLowerCase().trim())) casos.push({ tipo: "pergunta", q, id: e.i }); });
    const base = e.q.find((q) => dono.get(q.toLowerCase().trim()) && q.split(" ").length >= 2);
    if (!base) return;
    const ws = base.split(" ");
    const li = ws.reduce((b, w, i) => (w.replace(/[^\p{L}]/gu, "").length > ws[b].replace(/[^\p{L}]/gu, "").length ? i : b), 0), w = ws[li];
    if (w.length >= 6) { const p = 2 + Math.floor(r() * (w.length - 4)); casos.push({ tipo: "digitação", q: ws.map((x, i) => (i === li ? w.slice(0, p) + w[p + 1] + w[p] + w.slice(p + 2) : x)).join(" "), id: e.i }); }
    if (w.length >= 5) casos.push({ tipo: "plural", q: ws.map((x, i) => (i === li ? (/s$/.test(w) ? w.slice(0, -1) : w + "s") : x)).join(" "), id: e.i });
    casos.push({ tipo: "enchimento", q: PREF[lang][Math.floor(r() * 3)] + base, id: e.i });
  });
  return casos;
}
let falhou = false, total = 0;
for (const lang of ["PT", "EN", "ES"]) {
  configurar(lang);
  const casos = casosBase(lang), por = {};
  let ok = 0;
  casos.forEach((c) => {
    const r = M.buscar(c.q), certo = r.length && r[0].i === c.id && M.forte(r);
    por[c.tipo] = por[c.tipo] || [0, 0]; por[c.tipo][1]++; if (certo) { por[c.tipo][0]++; ok++; }
  });
  total += casos.length;
  const taxa = ok / casos.length, passou = taxa >= MINIMO[lang];
  if (!passou) falhou = true;
  console.log(`${passou ? "ok  " : "FALHA"} base ${lang}: ${ok}/${casos.length} (${(100 * taxa).toFixed(1)}%, mínimo ${100 * MINIMO[lang]}%) · ${Object.entries(por).map(([k, [a, n]]) => `${k} ${a}/${n}`).join(" · ")}`);
}

// --- 2) perguntas escritas à mão ------------------------------------------------------------------------------------------
const P = JSON.parse(fs.readFileSync(path.join(__dirname, "perguntas.json"), "utf8")).casos;
let ant = {}, okP = 0;
const lugarCtx = (E) => (E.lugar.muns.length === 1 ? Object.assign({ tipo: "mun" }, E.lugar.muns[0]) : E.lugar.uf ? { tipo: "uf", uf: E.lugar.uf } : E.br ? { tipo: "br" } : null);
P.forEach((c) => {
  configurar(c.lang);
  const contexto = c.ctx ? ant[c.lang] || null : null;
  const { E, kb, forte } = M.analisar(c.q, contexto);
  const lg = E.lugar, obtido = {
    intencao: E.intencao, uf: lg.uf, unidade: E.unidade, metrica: E.metrica, ordem: E.ordem, n: E.n, turno: E.turno, nivel: E.nivel, testes: E.testes, op: E.op,
    cand: E.cand ? E.cand.nr : null, mun: lg.muns.length === 1 ? `${lg.muns[0].nome}/${lg.muns[0].uf}` : null, muns: lg.muns.length, minha: E.minha, seguimento: E.seguimento,
    sec: E.sec ? `${E.sec.uf || "-"}/${E.sec.z || "-"}/${E.sec.s || "-"}` : null, secs: E.secs.length, urna: E.urna, querTse: E.querTse, br: E.br,
    lugares: (E.lugares || []).map((x) => (x.tipo === "mun" ? `mun:${x.nome}/${x.uf}` : x.tipo === "uf" ? `uf:${x.uf}` : x.tipo)),
    kb: forte ? kb[0].i : null, cortesia: !!M.cortesia(c.q),
  };
  const erros = Object.entries(c.espera).filter(([k, v]) => JSON.stringify(obtido[k]) !== JSON.stringify(v)).map(([k, v]) => `${k}: esperado ${JSON.stringify(v)}, veio ${JSON.stringify(obtido[k])}`);
  if (erros.length) { falhou = true; console.log(`FALHA [${c.lang}] ${c.q}\n      ${erros.join("\n      ")}`); } else okP++;
  ant[c.lang] = { intencao: E.intencao, lugar: lugarCtx(E), sec: E.sec && E.sec.uf && E.sec.z ? E.sec : null, turno: E.turno, metrica: E.metrica, unidade: E.unidade, ordem: E.ordem, n: E.n, nivel: E.nivel,
    testes: E.testes, op: E.op, cand: E.cand, lugares: E.lugares };
});
total += P.length;
console.log(`${okP === P.length ? "ok  " : "FALHA"} perguntas escritas à mão: ${okP}/${P.length}`);

// --- 3) conversa ---------------------------------------------------------------------------------------------------------
const C = JSON.parse(ler("testes/atlas/conversa.json")).casos;
let okC = 0;
C.forEach((c) => {
  configurar(c.lang);
  const r = M[c.fn](c.q);
  let obtido = r;
  if (c.fn === "etapas") obtido = { n: r.length };
  else if (c.fn === "acoes") obtido = r.lista.length ? Object.assign({ resto: r.resto }, r.lista[0]) : null;
  else if (c.fn === "conta" && r) obtido = Object.assign({}, r, r.grupo || {}, { conds: (r.conds || []).length });
  const erros = c.espera.nulo ? (obtido ? [`esperado nada, veio ${JSON.stringify(obtido)}`] : [])
    : !obtido ? ["não entendeu"] : Object.entries(c.espera).filter(([k, v]) => JSON.stringify(obtido[k]) !== JSON.stringify(v)).map(([k, v]) => `${k}: esperado ${JSON.stringify(v)}, veio ${JSON.stringify(obtido[k])}`);
  if (erros.length) { falhou = true; console.log(`FALHA [${c.lang}] ${c.fn}: ${c.q}\n      ${erros.join("\n      ")}`); } else okC++;
});
total += C.length;
console.log(`${okC === C.length ? "ok  " : "FALHA"} pedidos de conversa: ${okC}/${C.length}`);
console.log(`${total} casos no total.`);
process.exit(falhou ? 1 : 0);
