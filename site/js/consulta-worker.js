/* Consulta avançada: banco SQLite (sql.js) num Worker. Carrega os dados do site por estado e responde às consultas,
   sem travar a página. Mensagens: {tipo: "iniciar" | "uf" | "sql" | "varias"}; as respostas voltam com o mesmo id. */
"use strict";
importScripts("vendor/sqljs/sql-wasm.js");

const pronto = initSqlJs({ locateFile: (f) => "vendor/sqljs/" + f });
let db = null, base = "", ordem = null, cands = [], muns = null, totalSecoes = 0;

const json = (p) => fetch(base + p).then((r) => { if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`); return r.json(); });
const hora = (h) => { if (!h) return null; const s = String(h).padStart(6, "0"); return `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4, 6)}`; };

function colunas() {
  const out = {};
  ["secoes", "sinalizacoes", "locais", "candidatos", "testes", "municipios", "votos_horario"].forEach((tab) => {
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
    CREATE TABLE municipios (uf TEXT, codigo TEXT, nome TEXT);
    CREATE TABLE votos_horario (uf TEXT, cod_mun TEXT, zona INTEGER, secao INTEGER, turno INTEGER, fim TEXT, votos_dia INTEGER, comparecimento_bu INTEGER,
      votos_apos INTEGER, h1 INTEGER, h2 INTEGER, h3 INTEGER, h4 INTEGER, h5 INTEGER, h6 INTEGER, h7 INTEGER, h8 INTEGER, ultimo_voto TEXT, encerramento TEXT,
      min_ultimo_ate_enc REAL, maior_intervalo_min REAL, sem_digital_antes INTEGER, votos_antes INTEGER, sem_digital_apos INTEGER, pct_sem_digital_antes REAL,
      pct_sem_digital_apos REAL, cpf_apos INTEGER, ja_votou_apos INTEGER, urnas INTEGER);`);
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
  aplicarTurno(0);
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
  try { await votosHorario(uf); } catch (e) { /* sem a tabela de votos depois do horário */ }
  return { secoes: totalSecoes };
}

// Votos depois do horário oficial (log da urna), só nas seções sinalizadas por encerramento tardio
const hs = (x) => { if (x == null) return null; const d = Math.floor(x / 86400), r = x - 86400 * d; return `${String(Math.floor(r / 3600) + 24 * d).padStart(2, "0")}:${String(Math.floor((r % 3600) / 60)).padStart(2, "0")}:${String(r % 60).padStart(2, "0")}`; };
async function votosHorario(uf) {
  let V;
  try { V = await json(`votoshora/${uf}.json`); } catch (e) { return; }
  const ix = Object.fromEntries(V.campos.map((c, i) => [c, i]));
  const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
  inserirVarios(`INSERT INTO votos_horario VALUES (${Array(29).fill("?").join(",")})`, V.l.map((l) => {
    const g = (c) => l[ix[c]], u = g("ultimo_voto"), e = g("encerramento");
    return [uf, String(g("cod_mun")), g("zona"), g("secao"), g("turno"), hs(g("fim")).slice(0, 5), g("votos_dia"), g("comparecimento_bu"), g("votos_apos")]
      .concat([1, 2, 3, 4, 5, 6, 7, 8].map((k) => g("h" + k)))
      .concat([hs(u), hs(e), u != null && e != null ? r1((e - u) / 60) : null, g("maior_intervalo") == null ? null : r1(g("maior_intervalo") / 60),
        g("sem_digital_antes"), g("votos_antes"), g("sem_digital_apos"), g("votos_antes") ? r1((100 * g("sem_digital_antes")) / g("votos_antes")) : null,
        g("votos_apos") ? r1((100 * g("sem_digital_apos")) / g("votos_apos")) : null, g("cpf_apos"), g("ja_votou_apos"), g("urnas")]);
  }));
  db.run("CREATE INDEX IF NOT EXISTS i_vh ON votos_horario(uf, zona, secao)");
}

// Turno da consulta: visões temporárias com o mesmo nome das tabelas (secoes, sinalizacoes, candidatos) deixam só
// o turno escolhido, para qualquer consulta escrita; main.secoes etc. continuam com os dois turnos.
let turnoVista = 0;
function aplicarTurno(t) {
  t = t === 1 || t === 2 ? t : 0;
  if (t === turnoVista) return;
  db.run("DROP VIEW IF EXISTS temp.secoes; DROP VIEW IF EXISTS temp.sinalizacoes; DROP VIEW IF EXISTS temp.candidatos; DROP VIEW IF EXISTS temp.votos_horario;");
  if (t) db.run(`CREATE TEMP VIEW secoes AS SELECT * FROM main.secoes WHERE turno = ${t};
    CREATE TEMP VIEW sinalizacoes AS SELECT * FROM main.sinalizacoes WHERE turno = ${t};
    CREATE TEMP VIEW candidatos AS SELECT * FROM main.candidatos WHERE turno = ${t};
    CREATE TEMP VIEW votos_horario AS SELECT * FROM main.votos_horario WHERE turno = ${t};`);
  turnoVista = t;
}

function consultar(m) {
  if (m.turno != null) aplicarTurno(m.turno);
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
    else if (m.tipo === "varias") r = { res: m.sqls.map((sql) => { try { return consultar({ sql }); } catch (err) { return { erro: String((err && err.message) || err) }; } }) };
    else throw new Error("tipo desconhecido");
    postMessage(Object.assign({ id: m.id }, r));
  } catch (err) {
    postMessage({ id: m.id, erro: String((err && err.message) || err) });
  }
};
