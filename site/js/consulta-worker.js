/* Consulta avançada: banco SQLite (sql.js) num Worker. Carrega os dados do site por estado e responde às consultas,
   sem travar a página. Mensagens: {tipo: "iniciar" | "uf" | "sql"}; as respostas voltam com o mesmo id. */
"use strict";
importScripts("vendor/sqljs/sql-wasm.js");

const pronto = initSqlJs({ locateFile: (f) => "vendor/sqljs/" + f });
let db = null, base = "", ordem = null, cands = [], muns = null, totalSecoes = 0;

const json = (p) => fetch(base + p).then((r) => { if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`); return r.json(); });
const hora = (h) => { if (!h) return null; const s = String(h).padStart(6, "0"); return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4, 6)}`; };

function colunas() {
  const out = {};
  ["secoes", "sinalizacoes", "locais", "candidatos", "testes", "municipios"].forEach((tab) => {
    out[tab] = db.exec(`PRAGMA table_info(${tab})`)[0].values.map((v) => v[1]);
  });
  return out;
}

function inserirVarios(sql, linhas) {
  const st = db.prepare(sql);
  db.run("BEGIN");
  linhas.forEach((l) => st.run(l));
  db.run("COMMIT");
  st.free();
}

async function iniciar(m) {
  const SQL = await pronto;
  base = m.base; ordem = m.ordem;
  cands = [...new Set(ordem["1"].concat(ordem["2"]))].filter((n) => n !== "95" && n !== "96");
  db = new SQL.Database();
  db.run(`CREATE TABLE secoes (uf TEXT, cod_mun TEXT, municipio TEXT, zona INTEGER, secao INTEGER, turno INTEGER, local INTEGER, aptos INTEGER, comparecimento INTEGER,
      faltosos INTEGER, abertura TEXT, encerramento TEXT, agregadas TEXT, validos INTEGER, brancos INTEGER, nulos INTEGER, sinalizada INTEGER, ${cands.map((n) => `v${n} INTEGER`).join(", ")});
    CREATE TABLE sinalizacoes (uf TEXT, cod_mun TEXT, zona INTEGER, secao INTEGER, turno INTEGER, teste TEXT, nivel TEXT, categoria TEXT);
    CREATE TABLE locais (uf TEXT, zona INTEGER, local INTEGER, cod_mun TEXT, nome TEXT, endereco TEXT, bairro TEXT, lat REAL, lon REAL, tipo INTEGER, acessibilidade INTEGER, secoes INTEGER);
    CREATE TABLE candidatos (turno INTEGER, numero TEXT, nome TEXT, votos INTEGER);
    CREATE TABLE testes (id TEXT, nome TEXT);
    CREATE TABLE municipios (uf TEXT, codigo TEXT, nome TEXT);`);
  inserirVarios("INSERT INTO candidatos VALUES (?,?,?,?)", ["1", "2"].flatMap((n) => m.cands[n].map((c) => [+n, c[0], c[1], c[2]])));
  inserirVarios("INSERT INTO testes VALUES (?,?)", m.testes);
  const [M, oc] = await Promise.all([json("municipios.json"), json("ocorrencias.json")]);
  muns = M;
  inserirVarios("INSERT INTO municipios VALUES (?,?,?)", Object.entries(M).flatMap(([uf, ms]) => Object.entries(ms).map(([cod, x]) => [uf, cod, x[0]])));
  inserirVarios("INSERT INTO sinalizacoes VALUES (?,?,?,?,?,?,?,?)", oc.o.map((r) => r.slice(0, 8)));
  db.run("CREATE INDEX i_sin ON sinalizacoes(uf, zona, secao)");
  return { colunas: colunas() };
}

async function carregarUf(m) {
  const uf = m.uf;
  const L = (await json(`locais/${uf}.json`)).l;
  const localDe = new Map();
  inserirVarios("INSERT INTO locais VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", L.map((l) => {
    l[10].forEach((s) => localDe.set(`${l[0]}|${s}`, l[1]));
    return [uf, l[0], l[1], l[2], l[3], l[4], l[5], l[6], l[7], l[8], l[9], l[10].length];
  }));
  const zs = [...new Set(Object.values(muns[uf] || {}).flatMap((x) => x[1]))].sort((a, b) => a - b);
  const st = db.prepare(`INSERT INTO secoes VALUES (${Array(17 + cands.length).fill("?").join(",")})`);
  db.run("BEGIN");
  let feitos = 0, n = 0;
  const fila = zs.slice();
  const inserir = (Z, z) => {
    Object.entries(Z.s).forEach(([s, rec]) => {
      const mun = Z.mun[rec[0]];
      n++;
      [1, 2].forEach((t) => {
        const tv = rec[t];
        if (!tv) return;
        const v = {};
        ordem[t].forEach((nr, i) => { v[nr] = tv[5][i] || 0; });
        const validos = Object.keys(v).reduce((a, nr) => a + (nr === "95" || nr === "96" ? 0 : v[nr]), 0);
        const fl = rec[3] && rec[3][String(t)];
        const sinal = fl && fl.o.some((o) => o[1] === "a") ? 1 : 0;
        const loc = localDe.get(`${z}|${s}`);
        st.run([uf, mun[0], mun[1], z, +s, t, loc == null ? null : loc, tv[0], tv[1], tv[0] - tv[1], hora(tv[2]), hora(tv[3]), tv[4] ? String(tv[4]) : null,
          validos, v["95"] || 0, v["96"] || 0, sinal].concat(cands.map((nr) => (ordem[t].includes(nr) ? v[nr] || 0 : null))));
      });
    });
  };
  const trabalhador = async () => {
    while (fila.length) {
      const z = fila.shift();
      try { inserir(await json(`secoes/${uf}/${z}.json`), z); } catch (e) { /* zona sem arquivo */ }
      feitos++;
      postMessage({ id: m.id, prog: [feitos, zs.length] });
    }
  };
  try { await Promise.all(Array.from({ length: 6 }, trabalhador)); } finally { db.run("COMMIT"); st.free(); }
  db.run("CREATE INDEX IF NOT EXISTS i_sec ON secoes(uf, zona, secao); CREATE INDEX IF NOT EXISTS i_loc ON secoes(uf, zona, cod_mun, local); CREATE INDEX IF NOT EXISTS i_mun ON secoes(uf, cod_mun)");
  totalSecoes += n;
  return { secoes: totalSecoes };
}

function consultar(m) {
  const st = db.prepare(m.sql);
  const cols = st.getColumnNames(), linhas = [];
  let cortado = false;
  while (st.step()) {
    if (linhas.length >= 300000) { cortado = true; break; }
    linhas.push(st.get());
  }
  st.free();
  return { colunas: cols, linhas, cortado };
}

onmessage = async (e) => {
  const m = e.data;
  try {
    let r;
    if (m.tipo === "iniciar") r = await iniciar(m);
    else if (m.tipo === "uf") r = await carregarUf(m);
    else if (m.tipo === "sql") r = consultar(m);
    else throw new Error("tipo desconhecido");
    postMessage(Object.assign({ id: m.id }, r));
  } catch (err) {
    postMessage({ id: m.id, erro: String((err && err.message) || err) });
  }
};
