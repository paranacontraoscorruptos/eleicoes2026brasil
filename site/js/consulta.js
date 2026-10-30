/* Consultas nos dados publicados, feitas neste aparelho: tabelas de estados, municípios, zonas e seções,
   medidas (comparecimento, abstenção, brancos, nulos, votos, sinalizações), ranking, comparação, filtros e mapas.
   É a base das respostas de ranking, comparação, filtro, mapa e relatório do Atlas. */
(function () {
  "use strict";

  const A = window.APP;
  const R = () => A.state.R;
  const ext = () => A.paginasExtra;
  const dado = (u) => ext().dado(u);
  const UFS = () => Object.keys(window.UF_NOMES).sort();
  const TESTES_UF = ["T13", "T14", "T15"];

  // Votos de um turno como objeto {número: votos}
  function votos(n, arr) { const o = {}; R().ordem_votos[n].forEach((nr, i) => { o[nr] = (arr && arr[i]) || 0; }); return o; }
  const vazioT = () => ({ aptos: 0, comp: 0, v: {} });
  function somarT(a, b) { if (!b) return a; a.aptos += b.aptos; a.comp += b.comp; Object.keys(b.v).forEach((nr) => { a.v[nr] = (a.v[nr] || 0) + b.v[nr]; }); return a; }

  // --- sinalizações: seções distintas com anomalia ("a") e só com informativo ("i"), por turno ---------------------
  // filtro: { testes: ["T07", …], op: "e" | "ou", nivel: "a" | "i" | "" }
  function chaveSinais(f) { return JSON.stringify([f && f.testes ? f.testes : [], f && f.op, f && f.nivel]); }
  const cacheSinais = {};
  async function sinais(f) {
    const k = chaveSinais(f);
    if (cacheSinais[k]) return cacheSinais[k];
    const oc = await ext().ocorrencias();
    const testes = f && f.testes && f.testes.length ? new Set(f.testes) : null;
    // por seção e turno: testes e níveis encontrados
    const porSec = new Map();
    oc.forEach((o) => {
      if (testes && !testes.has(o[5])) return;
      const ks = `${o[0]}|${o[1]}|${o[2]}|${o[3]}|${o[4]}`;
      let x = porSec.get(ks); if (!x) { x = { uf: o[0], mun: o[1], z: o[2], s: o[3], n: o[4], t: new Set(), a: false }; porSec.set(ks, x); }
      x.t.add(o[5]); if (o[6] === "a") x.a = true;
    });
    const secs = [];
    porSec.forEach((x) => {
      if (testes && f.op === "e" && f.testes.some((id) => !x.t.has(id))) return;
      if (f && f.nivel === "a" && !x.a) return;
      if (f && f.nivel === "i" && x.a) return;
      secs.push(x);
    });
    // contagem por município, zona e estado
    const idx = { mun: new Map(), zona: new Map(), uf: new Map() };
    const conta = (m, k, x) => { let c = m.get(k); if (!c) { c = { 1: { a: 0, i: 0 }, 2: { a: 0, i: 0 } }; m.set(k, c); } c[x.n][x.a ? "a" : "i"]++; };
    secs.forEach((x) => { conta(idx.mun, x.uf + "|" + x.mun, x); conta(idx.zona, x.uf + "|" + x.z, x); conta(idx.zona, x.uf + "|" + x.mun + "|" + x.z, x); conta(idx.uf, x.uf, x); });
    cacheSinais[k] = { secs, idx };
    return cacheSinais[k];
  }
  const zeroS = () => ({ 1: { a: 0, i: 0 }, 2: { a: 0, i: 0 } });

  // --- tabelas ------------------------------------------------------------------------------------------------------
  async function municipiosUf(uf, f) {
    const [U, muns, S] = await Promise.all([dado(`site/data/ufs/${uf}.json`), A.municipios(), sinais(f)]);
    return Object.entries(U.m).map(([cod, m]) => {
      const t = {}; [1, 2].forEach((n) => { const x = m[n + 1]; if (x) t[n] = { aptos: x[0], comp: x[1], v: votos(n, x[2]) }; });
      return { tipo: "mun", uf, cod, nome: A.titulo(((muns[uf] || {})[cod] || [cod])[0]), sec: m[0], zonas: m[1], t, sn: S.idx.mun.get(uf + "|" + cod) || zeroS() };
    });
  }
  async function municipios(ufs, f) { return (await Promise.all((ufs || UFS()).map((uf) => municipiosUf(uf, f)))).flat(); }
  async function estados(f) {
    const S = await sinais(f);
    const ms = await municipios(null, f);
    const por = {};
    ms.forEach((m) => {
      let u = por[m.uf]; if (!u) { u = por[m.uf] = { tipo: "uf", uf: m.uf, nome: A.ufNome(m.uf), sec: 0, nmun: 0, t: {}, sn: S.idx.uf.get(m.uf) || zeroS() }; }
      u.sec += m.sec; u.nmun++;
      [1, 2].forEach((n) => { if (m.t[n]) u.t[n] = somarT(u.t[n] || vazioT(), m.t[n]); });
    });
    return Object.values(por);
  }
  // Seções de uma zona (opcional: só as de um município)
  async function secoesZona(uf, z, cod, f) {
    const [Z, S] = await Promise.all([A.zona(uf, z), sinais(f)]);
    if (!Z) return [];
    const flag = new Map(); S.secs.forEach((x) => { if (x.uf === uf && x.z === z) flag.set(x.s + "|" + x.n, x); });
    return Object.entries(Z.s).filter(([, rec]) => !cod || (Z.mun[rec[0]] || [])[0] === cod).map(([s, rec]) => {
      const t = {}; [1, 2].forEach((n) => { const tv = rec[n]; if (tv) t[n] = { aptos: tv[0], comp: tv[1], v: votos(n, tv[5]) }; });
      const sn = zeroS(); [1, 2].forEach((n) => { const x = flag.get(+s + "|" + n); if (x) sn[n][x.a ? "a" : "i"] = 1; });
      return { tipo: "secao", uf, z, s: +s, cod: (Z.mun[rec[0]] || [])[0], nome: `${t_().th_zone} ${z} · ${t_().th_section} ${s}`, mun: A.titulo((Z.mun[rec[0]] || ["", ""])[1]), sec: 1, t, sn };
    });
  }
  // Zonas de um município (com os números das seções dele) ou de um estado (só sinalizações)
  async function zonas(uf, cod, f) {
    if (cod) {
      const U = await dado(`site/data/ufs/${uf}.json`), m = U.m[cod]; if (!m) return [];
      return Promise.all(m[1].map(async (z) => {
        const ss = await secoesZona(uf, z, cod, f);
        const t = {}, sn = zeroS();
        ss.forEach((x) => { [1, 2].forEach((n) => { if (x.t[n]) t[n] = somarT(t[n] || vazioT(), x.t[n]); sn[n].a += x.sn[n].a; sn[n].i += x.sn[n].i; }); });
        return { tipo: "zona", uf, z, cod, nome: `${t_().th_zone} ${z}`, sec: ss.length, t, sn };
      }));
    }
    const S = await sinais(f), U = await dado(`site/data/ufs/${uf}.json`);
    const zs = new Set(); Object.values(U.m).forEach((m) => m[1].forEach((z) => zs.add(z)));
    return [...zs].map((z) => ({ tipo: "zona", uf, z, nome: `${t_().th_zone} ${z}`, sec: null, t: {}, sn: S.idx.zona.get(uf + "|" + z) || zeroS(), soSinal: true }));
  }
  async function secoesMun(uf, cod, f) {
    const U = await dado(`site/data/ufs/${uf}.json`), m = U.m[cod]; if (!m) return [];
    return (await Promise.all(m[1].map((z) => secoesZona(uf, z, cod, f)))).flat();
  }
  const t_ = () => A.t();

  // --- medidas --------------------------------------------------------------------------------------------------------
  const validos = (T) => Object.keys(T.v).reduce((a, nr) => a + (nr === "95" || nr === "96" ? 0 : T.v[nr]), 0);
  // Cada medida: valor (número usado para ordenar) e texto; "pct" diz se é proporção (sem tamanho mínimo, ver nota)
  function medida(k, o) {
    o = o || {};
    const L = t_(), nf = A.nf, pct = (x) => A.pct(x, 2);
    const T = (r, n) => r.t && r.t[n];
    const M = {
      sinal: { nome: o.nivel === "i" ? L.cq_m.sinal_i : L.cq_m.sinal, pct: !!o.taxa,
        val: (r, n) => { const c = r.sn[n][o.nivel === "i" ? "i" : "a"]; return o.taxa ? (r.sec ? (c / r.sec) * 1000 : null) : c; },
        txt: (r, n) => { const c = r.sn[n][o.nivel === "i" ? "i" : "a"]; return r.sec ? `${nf(c)} · ${A.nf(Math.round((c / r.sec) * 10000) / 10)} ${L.cq_per1000}` : nf(c); } },
      comp: { nome: L.cq_m.comp, pct: true, val: (r, n) => (T(r, n) && T(r, n).aptos ? T(r, n).comp / T(r, n).aptos : null), txt: (r, n) => `${pct(T(r, n).comp / T(r, n).aptos)} · ${nf(T(r, n).comp)}` },
      abst: { nome: L.cq_m.abst, pct: true, val: (r, n) => (T(r, n) && T(r, n).aptos ? 1 - T(r, n).comp / T(r, n).aptos : null), txt: (r, n) => `${pct(1 - T(r, n).comp / T(r, n).aptos)} · ${nf(T(r, n).aptos - T(r, n).comp)}` },
      brancos: { nome: L.cq_m.brancos, pct: !o.abs, val: (r, n) => (T(r, n) && T(r, n).comp ? (o.abs ? T(r, n).v["95"] || 0 : (T(r, n).v["95"] || 0) / T(r, n).comp) : null), txt: (r, n) => `${pct((T(r, n).v["95"] || 0) / T(r, n).comp)} · ${nf(T(r, n).v["95"] || 0)}` },
      nulos: { nome: L.cq_m.nulos, pct: !o.abs, val: (r, n) => (T(r, n) && T(r, n).comp ? (o.abs ? T(r, n).v["96"] || 0 : (T(r, n).v["96"] || 0) / T(r, n).comp) : null), txt: (r, n) => `${pct((T(r, n).v["96"] || 0) / T(r, n).comp)} · ${nf(T(r, n).v["96"] || 0)}` },
      bn: { nome: L.cq_m.bn, pct: !o.abs, val: (r, n) => { const x = T(r, n); if (!x || !x.comp) return null; const b = (x.v["95"] || 0) + (x.v["96"] || 0); return o.abs ? b : b / x.comp; },
        txt: (r, n) => { const x = T(r, n), b = (x.v["95"] || 0) + (x.v["96"] || 0); return `${pct(b / x.comp)} · ${nf(b)}`; } },
      aptos: { nome: L.cq_m.aptos, pct: false, val: (r, n) => (T(r, n) ? T(r, n).aptos : null), txt: (r, n) => nf(T(r, n).aptos) },
      secoes: { nome: L.cq_m.secoes, pct: false, val: (r) => r.sec, txt: (r) => nf(r.sec) },
      cand_pct: { nome: L.cq_m.cand_pct(o.candNome || o.cand), pct: true, val: (r, n) => { const x = T(r, n); if (!x) return null; const vv = validos(x); return vv ? (x.v[o.cand] || 0) / vv : null; },
        txt: (r, n) => { const x = T(r, n), vv = validos(x) || 1; return `${pct((x.v[o.cand] || 0) / vv)} · ${nf(x.v[o.cand] || 0)}`; } },
      cand: { nome: L.cq_m.cand(o.candNome || o.cand), pct: false, val: (r, n) => (T(r, n) ? T(r, n).v[o.cand] || 0 : null), txt: (r, n) => { const x = T(r, n), vv = validos(x) || 1; return `${nf(x.v[o.cand] || 0)} · ${pct((x.v[o.cand] || 0) / vv)}`; } },
    };
    return Object.assign({ k }, M[k] || M.sinal);
  }

  // --- ranking, comparação e filtro --------------------------------------------------------------------------------------
  // q: { unidade: "uf"|"mun"|"zona"|"secao", uf, cod, metrica, turno, ordem, n, nivel, taxa, abs, cand, candNome, testes, op }
  async function ranking(q) {
    const f = { testes: q.testes || [], op: q.op || "e", nivel: q.metrica === "sinal" ? q.nivel || "" : "" };
    let linhas;
    if (q.unidade === "uf") linhas = await estados(f);
    else if (q.unidade === "zona") linhas = await zonas(q.uf, q.cod, f);
    else if (q.unidade === "secao") linhas = q.cod ? await secoesMun(q.uf, q.cod, f) : q.z ? await secoesZona(q.uf, q.z, null, f) : [];
    else linhas = await municipios(q.uf ? [q.uf] : null, f);
    if (q.unidade === "uf") linhas = linhas.filter((r) => r.uf !== "ZZ" || q.comExterior);
    const n = q.turno || 2, M = medida(q.metrica || "sinal", q);
    const comValor = linhas.map((r) => ({ r, v: M.val(r, n) })).filter((x) => x.v != null && !Number.isNaN(x.v));
    comValor.sort((a, b) => (q.ordem === "asc" ? a.v - b.v : b.v - a.v) || (a.r.nome || "").localeCompare(b.r.nome || ""));
    const total = comValor.length;
    const top = comValor.slice(0, Math.min(q.n || 10, 50));
    return { M, n, total, top, todas: comValor, soSinal: linhas.some((r) => r.soSinal) };
  }
  // Lugar de um município dentro do estado (pela taxa de seções com anomalia)
  async function posicao(uf, cod, n) {
    const ms = await municipiosUf(uf, {});
    const v = (m) => (m.sec ? m.sn[n].a / m.sec : 0);
    const ord = ms.slice().sort((a, b) => v(b) - v(a));
    const i = ord.findIndex((m) => m.cod === cod);
    return { pos: i + 1, total: ord.length, taxa: i >= 0 ? v(ord[i]) : 0, comAlguma: ms.filter((m) => m.sn[n].a > 0).length };
  }
  // Uma linha (com números dos dois turnos) para um lugar: {tipo:"uf"|"mun"|"br"|"secao"|"zona", ...}
  async function linhaLugar(lg) {
    if (lg.tipo === "br") {
      const out = { tipo: "br", nome: t_().at.br_name, sec: R().turnos["2"].entrada.secoes, t: {}, sn: zeroS() };
      [1, 2].forEach((n) => { const P = R().turnos[n].presidente, v = {}; P.candidatos.forEach((c) => { v[c.nr] = c.votos; }); out.t[n] = { aptos: P.aptos, comp: P.comparecimento, v }; });
      const S = await sinais({}); S.secs.forEach((x) => { out.sn[x.n][x.a ? "a" : "i"]++; });
      return out;
    }
    if (lg.tipo === "uf") return (await estados({})).find((r) => r.uf === lg.uf) || null;
    if (lg.tipo === "mun") return (await municipiosUf(lg.uf, {})).find((r) => r.cod === lg.cod) || null;
    if (lg.tipo === "secao") {
      const ss = await secoesZona(lg.uf, lg.z, null, {});
      const r = ss.find((x) => x.s === lg.s);
      return r ? Object.assign(r, { nome: `${lg.uf} · ${r.mun} · ${r.nome}` }) : null;
    }
    return null;
  }
  // Seções sinalizadas que passam no filtro: { uf, cod, z, turno, testes, op, nivel }
  async function filtrar(q) {
    const S = await sinais({ testes: q.testes || [], op: q.op || "e", nivel: q.nivel || "" });
    const muns = await A.municipios();
    let l = S.secs.filter((x) => (!q.uf || x.uf === q.uf) && (!q.cod || x.mun === q.cod) && (!q.z || x.z === q.z) && (!q.turno || x.n === q.turno));
    l = l.slice().sort((a, b) => b.n - a.n || a.uf.localeCompare(b.uf) || ((muns[a.uf] || {})[a.mun] || [""])[0].localeCompare(((muns[b.uf] || {})[b.mun] || [""])[0]) || a.z - b.z || a.s - b.s);
    return l.map((x) => ({ uf: x.uf, cod: x.mun, mun: A.titulo(((muns[x.uf] || {})[x.mun] || [x.mun])[0]), z: x.z, s: x.s, n: x.n, testes: [...x.t].sort(), a: x.a }));
  }

  // --- mapas ----------------------------------------------------------------------------------------------------------------
  // Faixas por quartis dos valores positivos (q0 = zero; q1 a q4)
  function classes(vals) {
    const pos = vals.filter((v) => v > 0).sort((a, b) => a - b);
    if (!pos.length) return { cls: () => 0, faixas: [] };
    const q = [0.25, 0.5, 0.75].map((p) => pos[Math.min(pos.length - 1, Math.floor(p * pos.length))]);
    const lim = [...new Set(q)].filter((x) => x < pos[pos.length - 1]);
    const cls = (v) => (v <= 0 ? 0 : 1 + lim.filter((x) => v > x).length);
    const faixas = []; let ini = pos[0];
    lim.forEach((x) => { faixas.push([ini, x]); ini = pos.find((v) => v > x); });
    faixas.push([ini, pos[pos.length - 1]]);
    return { cls, faixas };
  }
  // Mapa de um estado (municípios) ou do Brasil (estados), pintado por "valor" (0 a 1); "destaque" recebe contorno
  async function mapa(o) {
    const L = t_(), esc = A.esc;
    const M = o.uf ? await dado(`site/data/mapas/${o.uf}.json`) : await dado("site/data/mapa.json");
    const partes = o.uf ? M.m : M.uf;
    const { cls, faixas } = classes(Object.keys(partes).map((k) => (o.valor[k] == null ? 0 : o.valor[k])));
    const href = (k) => (o.uf ? `#/uf/${o.uf}/${k}` : `#/uf/${k}`);
    const svg = `<svg viewBox="0 0 ${M.vb[0]} ${M.vb[1]}" role="img" aria-label="${esc(o.titulo || L.mp_title)}">${Object.entries(partes).map(([k, d]) => {
      const v = o.valor[k] == null ? 0 : o.valor[k], dest = o.destaque === k;
      return `<a href="${href(k)}" class="mp-uf q${cls(v)}${dest ? " mp-dest" : ""}" data-tip="${esc(o.dica ? o.dica(k, v) : k)}" aria-label="${esc(o.nome ? o.nome(k) : k)}"><path d="${d}"/></a>`;
    }).join("")}${o.destaque && partes[o.destaque] ? `<path class="mp-dest-c" d="${partes[o.destaque]}"/>` : ""}</svg>`;
    const fmt = o.fmt || ((v) => A.pct(v, 2));
    const leg = `<ul class="seq-leg"><li><span class="sw q0"></span>${esc(L.mp_zero)}</li>${faixas.map(([a, b], i) => `<li><span class="sw q${i + 1}"></span>${esc(a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`)}</li>`).join("")}</ul>`;
    return `<figure class="at-mapa"><div class="map">${svg}</div><figcaption>${o.legenda ? `<p class="small"><b>${esc(o.legenda)}</b></p>` : ""}${leg}</figcaption></figure>`;
  }

  A.consulta = { sinais, municipios, municipiosUf, estados, zonas, secoesZona, secoesMun, medida, ranking, posicao, linhaLugar, filtrar, mapa, classes, votos, validos, TESTES_UF };
})();
