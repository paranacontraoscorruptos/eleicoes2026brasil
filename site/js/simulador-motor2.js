/* Simulador de anomalias — motor dos testes V1–V6 (variação entre turnos) e L01–L14 (logs das urnas).
   V1–V6: mesmas regras e parâmetros do motor da auditoria v2.2.0 (deslocamento logístico do grupo, z com fator de
   dispersão do grupo, Benjamini–Hochberg; teto de votos disponíveis; cadastro alterado).
   L01–L14: critérios SIMPLIFICADOS (os testes completos estão no Relatório Técnico, Anexo B); comparação com a região pelo escore z robusto.
   Tudo com dados fictícios gerados no aparelho, a partir de sementes fixas. */
(function (raiz) {
  "use strict";
  const S = raiz.SIMM;
  const { rng, mediana, zRobusto, lsfNormal } = S;
  const T = S.T;

  // --- parâmetros (iguais aos VAR_* do auditoria_eleicoes_2026.py) -------------------------------------------
  const VP = { ALFA: 0.01, ANOM_PP: 10, INFO_PP: 5, MIN_VOTOS: 30, MIN_APTOS: 20, PHI_MIN: 0.05, DIR: 0.30, MIN_VAR: 20, TETO: 0.10, CAD: 0.10, Z: 3.5 };
  // unidades analisadas em cada teste (resultado publicado), usadas no ajuste de Benjamini–Hochberg (q = p × M)
  const MV = { V1: 28, V2: 5696, V3: 498996, V4: 499205 };
  const SIG = { p: 0.03, m: 0.08, a: 0.2 };   // como as unidades do grupo variam (escala logística)
  const logit = (p) => Math.log(p / (1 - p)), expit = (x) => 1 / (1 + Math.exp(-x));
  const lim01 = (p) => Math.min(1 - 1e-9, Math.max(1e-9, p));
  const H = (h, m) => h * 3600 + (m || 0) * 60;
  const tem = (r, c) => r.cats.some((x) => x.c === c);

  // fator de dispersão do grupo: mediana(z0²)/0,4549 em 60 unidades fictícias do mesmo tamanho
  const cachePhi = new Map();
  function phiGrupo(seed, n, g1, g2, vk) {
    const ch = [seed, n, g1, g2, vk].join("|");
    if (cachePhi.has(ch)) return cachePhi.get(ch);
    const r = rng(seed), d = logit(lim01(g2 / 100)) - logit(lim01(g1 / 100)), sg = SIG[vk] || SIG.m, z2 = [];
    for (let j = 0; j < 60; j++) {
      const nj = Math.max(VP.MIN_VOTOS, Math.round(n * (0.6 + 0.8 * r())));
      const x1 = r.binom(nj, lim01(expit(logit(lim01(g1 / 100)) + 0.35 * r.normal())));
      const base = logit((x1 + 0.5) / (nj + 1)), pe = expit(base + d);
      const x2 = r.binom(nj, lim01(expit(base + d + sg * r.normal())));
      const z0 = (x2 / nj - pe) / Math.sqrt(pe * (1 - pe) / nj);
      z2.push(z0 * z0);
    }
    const phi = Math.max(VP.PHI_MIN, mediana(z2) / 0.4549364);
    cachePhi.set(ch, phi);
    return phi;
  }
  // desvio logístico: proporção esperada no 2º turno = expit(logit(x1/n1) + [logit(g2) − logit(g1)])
  function desvio(x1, n1, x2, n2, s, M) {
    const d = logit(lim01(s.g2 / 100)) - logit(lim01(s.g1 / 100));
    const pe = expit(logit((x1 + 0.5) / (n1 + 1)) + d), po = x2 / n2;
    const z0 = (po - pe) / Math.sqrt(pe * (1 - pe) / n2), phi = phiGrupo(s.seed, n2, s.g1, s.g2, s.var);
    const z = z0 / Math.sqrt(phi), lp = Math.log(2) + lsfNormal(Math.abs(z)), lq = Math.min(0, lp + Math.log(M));
    const q = Math.exp(lq), dif = 100 * (po - pe);
    return { d, pe, po, z0, phi, z, lp, lq, q, dif, sig: q < VP.ALFA, M };
  }
  const nivelVar = (v) => (v.sig && Math.abs(v.dif) >= VP.ANOM_PP ? "anom" : v.sig && Math.abs(v.dif) >= VP.INFO_PP ? "info" : "ok");

  // ---------------- V1, V2, V3 Transferência atípica (estado, município, seção) ----------------
  function transf(id, n0) {
    return {
      nivel: "variacao", vis: "transf",
      base: () => ({ n: n0, a1: 47, a2: 50, g1: 46, g2: 49, var: "m", seed: { V1: 101, V2: 202, V3: 303 }[id] }),
      avaliar(s) {
        const n = Math.round(s.n), x1 = Math.round((n * s.a1) / 100), x2 = Math.round((n * s.a2) / 100);
        if (n < VP.MIN_VOTOS) return { nivel: "na", cats: [], v: { n, x1, x2 } };
        const v = Object.assign({ n, x1, x2 }, desvio(x1, n, x2, n, s, MV[id]));
        const nivel = nivelVar(v);
        return { nivel, cats: nivel === "ok" ? [] : [{ c: "transferencia", info: nivel === "info" }], v };
      },
    };
  }
  T.V1 = transf("V1", 2000000);
  T.V2 = transf("V2", 20000);
  T.V3 = transf("V3", 220);
  T.V1.missoes = [
    { t: "s", foco: "a2", sol: (s) => { s.a2 = 62; }, ok: (s, r) => r.nivel === "anom" && s.a2 > 55 },
    { t: "s", foco: "a2", sol: (s) => { s.a2 = 36; }, ok: (s, r) => r.nivel === "anom" && s.a2 < 45 },
    { t: "a", foco: "a2", sol: (s) => { s.a2 = 63; }, ok: (s, r) => r.nivel === "anom" },
    { t: "a", ini: { var: "p" }, foco: "a2", sol: (s) => { s.a2 = 56; }, ok: (s, r) => r.nivel !== "ok" && s.var === "p" },
    { t: "d", foco: "g2", sol: (s) => { s.g2 = 58; s.a2 = 59; }, ok: (s, r) => s.g2 >= 55 && s.a2 >= 56 && r.nivel === "ok" },
    { t: "d", ini: { var: "a" }, foco: "a2", sol: (s) => { s.a2 = 56; }, ok: (s, r) => s.a2 >= 55 && r.nivel === "ok" },
  ];
  T.V2.missoes = [
    { t: "s", foco: "a2", sol: (s) => { s.a2 = 64; }, ok: (s, r) => r.nivel === "anom" && s.a2 > 55 },
    { t: "s", foco: "a2", sol: (s) => { s.a2 = 37; }, ok: (s, r) => r.nivel === "anom" && s.a2 < 45 },
    { t: "a", foco: "a2", sol: (s) => { s.a2 = 65; }, ok: (s, r) => r.nivel === "anom" },
    { t: "a", ini: { var: "p" }, foco: "a2", sol: (s) => { s.a2 = 57; }, ok: (s, r) => r.nivel === "info" },
    { t: "d", foco: "g2", sol: (s) => { s.g2 = 60; s.a2 = 61; }, ok: (s, r) => s.g2 >= 56 && s.a2 >= 57 && r.nivel === "ok" },
    { t: "d", foco: "a2", sol: (s) => { s.a2 = 53; }, ok: (s, r) => s.a2 >= 52 && r.nivel === "ok" },
  ];
  T.V3.missoes = [
    { t: "s", foco: "a2", sol: (s) => { s.a2 = 82; }, ok: (s, r) => r.nivel === "anom" && s.a2 > 55 },
    { t: "s", foco: "a2", sol: (s) => { s.a2 = 18; }, ok: (s, r) => r.nivel === "anom" && s.a2 < 45 },
    { t: "a", ini: { n: 300 }, foco: "a2", sol: (s) => { s.a2 = 80; }, ok: (s, r) => r.nivel === "anom" && s.a2 >= 75 },
    { t: "a", ini: { n: 420 }, foco: "a2", sol: (s) => { s.a2 = 20; }, ok: (s, r) => r.nivel === "anom" && s.a2 <= 25 },
    { t: "d", foco: "a2", sol: (s) => { s.a2 = 63; }, ok: (s, r) => s.a2 >= 60 && r.nivel === "ok" },
    { t: "d", foco: "n", sol: (s) => { s.n = 25; s.a2 = 90; }, ok: (s, r) => r.nivel === "na" && s.a2 >= 80 },
  ];
  const cenTransf = (id, ns) => function (r) {
    const s = this.base(); s.seed = r.int(1, 99999); s.n = ns[r.int(0, ns.length - 1)]; s.a1 = r.int(30, 65); s.g1 = r.int(35, 60); s.g2 = s.g1 + r.int(-4, 6);
    s.var = ["p", "m", "a"][r.int(0, 2)];
    const k = r.int(0, 3), pe = Math.round(100 * expit(logit(s.a1 / 100) + logit(s.g2 / 100) - logit(s.g1 / 100)));
    s.a2 = Math.max(1, Math.min(99, pe + (k === 0 ? r.int(-2, 2) : k === 1 ? r.int(12, 30) * (r() < 0.5 ? -1 : 1) : k === 2 ? r.int(5, 9) : r.int(-3, 3))));
    if (id === "V3" && r() < 0.15) s.n = r.int(10, 29);
    return s;
  };
  T.V1.cenario = cenTransf("V1", [800000, 2000000, 6000000]);
  T.V2.cenario = cenTransf("V2", [3000, 20000, 150000]);
  T.V3.cenario = cenTransf("V3", [120, 220, 380]);

  // ---------------- V4 Variação atípica do comparecimento ----------------
  T.V4 = {
    nivel: "variacao", vis: "comp",
    base: () => ({ ap: 300, c1: 240, c2: 237, g1: 80, g2: 79, sa: 50, dirA: 50, var: "m", seed: 404 }),
    avaliar(s) {
      const ap = Math.round(s.ap), c1 = Math.min(ap, Math.round(s.c1)), c2 = Math.min(ap, Math.round(s.c2));
      if (ap < VP.MIN_APTOS) return { nivel: "na", cats: [], v: { ap, c1, c2 } };
      const v = Object.assign({ ap, c1, c2 }, desvio(c1, ap, c2, ap, s, MV.V4));
      const dC = c2 - c1, sa = s.sa / 100, da = s.dirA / 100;
      const A1 = sa * c1, A2 = A1 + da * dC, B1 = (1 - sa) * c1, B2 = B1 + (1 - da) * dC;
      const exA = dC ? (A2 - A1) / dC - (A1 + A2) / (c1 + c2 || 1) : -9, exB = dC ? (B2 - B1) / dC - (B1 + B2) / (c1 + c2 || 1) : -9;
      Object.assign(v, { dC, exA, exB, exc: Math.max(exA, exB), destino: exA >= exB ? "A" : "B" });
      v.dir = Math.abs(dC) >= VP.MIN_VAR && v.exc >= VP.DIR;
      const nivel = v.sig && Math.abs(v.dif) >= VP.ANOM_PP && v.dir ? "anom" : v.sig && Math.abs(v.dif) >= VP.INFO_PP ? "info" : "ok";
      return { nivel, cats: nivel === "ok" ? [] : [{ c: v.dir ? "comp_direcionado" : "comp_atipico", info: nivel === "info" }], v };
    },
    missoes: [
      { t: "s", foco: "c2", sol: (s) => { s.c2 = 290; s.dirA = 95; }, ok: (s, r) => r.nivel === "anom" && s.c2 > s.c1 },
      { t: "s", foco: "c2", sol: (s) => { s.c2 = 190; s.dirA = 95; }, ok: (s, r) => r.nivel === "anom" && s.c2 < s.c1 },
      { t: "a", foco: "dirA", sol: (s) => { s.c2 = 288; s.dirA = 100; }, ok: (s, r) => r.nivel === "anom" && s.dirA >= 90 },
      { t: "a", foco: "c2", sol: (s) => { s.c2 = 285; }, ok: (s, r) => r.nivel === "info" && s.c2 >= 280 },
      { t: "d", foco: "g2", sol: (s) => { s.g2 = 93; s.c2 = 282; s.dirA = 100; }, ok: (s, r) => s.g2 >= 90 && s.c2 >= 275 && r.nivel === "ok" },
      { t: "d", foco: "c2", sol: (s) => { s.c2 = 249; s.dirA = 100; }, ok: (s, r) => s.c2 > s.c1 && s.dirA >= 90 && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base(); s.seed = r.int(1, 99999); s.ap = [80, 200, 300, 420][r.int(0, 3)]; s.c1 = Math.round(s.ap * (0.7 + 0.15 * r())); s.g1 = 80; s.g2 = 80 + r.int(-3, 3);
      const k = r.int(0, 3);
      s.c2 = Math.min(s.ap, Math.max(0, s.c1 + (k === 0 ? r.int(-4, 4) : k === 1 || k === 2 ? Math.round(s.ap * (0.14 + 0.08 * r())) * (r() < 0.75 ? 1 : -1) : Math.round(s.ap * 0.07))));
      s.dirA = k === 2 ? r.int(30, 70) : r.int(0, 100); s.sa = r.int(30, 70);
      return s;
    },
  };

  // ---------------- V5 Ganho acima do teto de votos disponíveis ----------------
  T.V5 = {
    nivel: "variacao", vis: "teto",
    base: () => ({ L1: 100, F1: 110, O1: 25, BN1: 15, c2: 245, L2: 125, F2: 112 }),
    avaliar(s) {
      const c1 = s.L1 + s.F1 + s.O1 + s.BN1, BN2 = s.c2 - s.L2 - s.F2;
      const teto = s.O1 + s.BN1 + Math.max(s.c2 - c1, 0), gA = s.L2 - s.L1, gB = s.F2 - s.F1, exA = gA - teto, exB = gB - teto;
      const kA = exA >= VP.MIN_VAR && exA >= VP.TETO * s.F1, kB = exB >= VP.MIN_VAR && exB >= VP.TETO * s.L1;
      const v = { c1, BN2, teto, gA, gB, exA, exB, kA, kB };
      if (BN2 < 0) return { nivel: "na", cats: [], v: Object.assign(v, { soma: true }) };
      const cats = []; if (kA) cats.push({ c: "acima_teto_A", info: true }); if (kB) cats.push({ c: "acima_teto_B", info: true });
      return { nivel: cats.length ? "info" : "ok", cats, v };
    },
    missoes: [
      { t: "s", foco: "L2", sol: (s) => { s.L2 = 175; s.F2 = 62; }, ok: (s, r) => r.v.kA },
      { t: "s", foco: "F2", sol: (s) => { s.F2 = 170; s.L2 = 67; }, ok: (s, r) => r.v.kB },
      { t: "a", foco: "L2", sol: (s) => { s.L2 = 165; s.F2 = 72; }, ok: (s, r) => r.v.kA },
      { t: "a", foco: "c2", sol: (s) => { s.c2 = 260; s.F2 = 182; s.L2 = 68; }, ok: (s, r) => r.v.kB && s.c2 > r.v.c1 },
      { t: "d", foco: "L2", sol: (s) => { s.L2 = 155; s.F2 = 85; }, ok: (s, r) => s.L2 - s.L1 > r.v.teto && r.nivel === "ok" },
      { t: "d", foco: "c2", sol: (s) => { s.c2 = 300; s.L2 = 185; s.F2 = 108; }, ok: (s, r) => s.c2 >= 290 && s.L2 >= 180 && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base(); s.L1 = r.int(60, 160); s.F1 = r.int(60, 160); s.O1 = r.int(5, 40); s.BN1 = r.int(5, 25);
      const c1 = s.L1 + s.F1 + s.O1 + s.BN1; s.c2 = c1 + r.int(-15, 20);
      const k = r.int(0, 2), troca = k === 0 ? 0 : k === 1 ? r.int(25, 60) : r.int(3, 15), lado = r() < 0.5;
      const disp = s.O1 + s.BN1 + Math.max(0, s.c2 - c1), gA = Math.round(disp * (0.3 + 0.4 * r()));
      s.L2 = s.L1 + gA + (lado ? troca : -troca); s.F2 = s.F1 + (disp - gA) - Math.round(disp * 0.1) + (lado ? -troca : troca);
      s.L2 = Math.max(0, s.L2); s.F2 = Math.max(0, Math.min(s.c2 - s.L2, s.F2));
      return s;
    },
  };

  // ---------------- V6 Cadastro alterado entre os turnos ----------------
  T.V6 = {
    nivel: "variacao", vis: "kv",
    base: () => ({ ap1: 300, ap2: 302, bu1: true, bu2: true }),
    avaliar(s) {
      const d = s.ap2 - s.ap1, ambos = s.bu1 && s.bu2;
      const k = ambos && Math.abs(d) >= VP.MIN_VAR && Math.abs(d) >= VP.CAD * s.ap1, falta = !ambos && (s.bu1 || s.bu2);
      const cats = k ? [{ c: "aptos_mudaram", info: true }] : falta ? [{ c: s.bu1 ? "sem_bu_2t" : "sem_bu_1t", info: true }] : [];
      return { nivel: !s.bu1 && !s.bu2 ? "na" : cats.length ? "info" : "ok", cats, v: { d, rel: s.ap1 ? Math.abs(d) / s.ap1 : 0 } };
    },
    missoes: [
      { t: "s", foco: "ap2", sol: (s) => { s.ap2 = 345; }, ok: (s, r) => tem(r, "aptos_mudaram") && s.ap2 > s.ap1 },
      { t: "s", foco: "bu2", sol: (s) => { s.bu2 = false; }, ok: (s, r) => tem(r, "sem_bu_2t") },
      { t: "a", foco: "ap2", sol: (s) => { s.ap2 = 380; }, ok: (s, r) => tem(r, "aptos_mudaram") && s.ap2 >= 370 },
      { t: "a", foco: "ap2", sol: (s) => { s.ap2 = 250; }, ok: (s, r) => tem(r, "aptos_mudaram") && s.ap2 < s.ap1 },
      { t: "d", foco: "ap2", sol: (s) => { s.ap2 = 318; }, ok: (s, r) => s.ap2 - s.ap1 >= 15 && r.nivel === "ok" },
      { t: "d", ini: { ap1: 600, ap2: 600 }, foco: "ap2", sol: (s) => { s.ap2 = 650; }, ok: (s, r) => s.ap2 - s.ap1 >= 40 && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base(); s.ap1 = r.int(80, 600); const k = r.int(0, 3);
      s.ap2 = s.ap1 + (k === 0 ? r.int(-8, 8) : k === 1 ? Math.round(s.ap1 * (0.12 + 0.2 * r())) * (r() < 0.5 ? -1 : 1) : k === 2 ? Math.round(s.ap1 * 0.05) : 0);
      if (k === 3) { s.ap2 = s.ap1; s[r() < 0.5 ? "bu1" : "bu2"] = false; }
      return s;
    },
  };

  // =========================================================================================================
  // Logs das urnas (critérios preliminares). Região fictícia: 40 seções do município e vizinhas.
  // =========================================================================================================
  const cacheReg = new Map();
  function regiao(seed, med, esp, lo, hi) {
    const ch = [seed, med, esp, lo, hi].join("|");
    if (cacheReg.has(ch)) return cacheReg.get(ch);
    const r = rng(seed), g = [];
    for (let i = 0; i < 40; i++) g.push(Math.max(lo, Math.min(hi, med + esp * r.normal())));
    cacheReg.set(ch, g);
    return g;
  }
  const zReg = (v, g) => zRobusto(v, g.concat([v]));
  const FIM = H(17), TOL = 120;

  // L01 Votos depois do horário oficial
  T.L01 = {
    nivel: "log", vis: "regua",
    base: () => ({ ult: H(17, 6), napos: 4, cidade: "pouca", seed: 1101 }),
    avaliar(s) {
      const at = Math.max(0, (s.ult - FIM) / 60), g = s.cidade === "muita" ? regiao(s.seed, 80, 35, 0, 240) : regiao(s.seed, 9, 6, 0, 40);
      const z = zReg(at, g), v = { at, z, g, med: mediana(g), regua: { vals: g, alvo: at, un: "min" } };
      if (!s.napos || at <= 0) return { nivel: "ok", cats: [], v };
      const anom = z >= VP.Z && at >= 60;
      return { nivel: anom ? "anom" : "info", cats: [{ c: anom ? "voto_tarde_fora" : "voto_tarde", info: !anom }], v };
    },
    missoes: [
      { t: "s", foco: "ult", sol: (s) => { s.ult = H(20, 10); s.napos = 80; }, ok: (s, r) => r.nivel === "anom" && s.ult >= H(19, 30) },
      { t: "s", foco: "ult", sol: (s) => { s.ult = H(19); }, ok: (s, r) => r.nivel === "anom" && s.ult < H(19, 30) },
      { t: "a", foco: "ult", sol: (s) => { s.ult = H(18, 30); s.napos = 45; }, ok: (s, r) => r.nivel === "anom" && s.ult <= H(18, 45) },
      { t: "a", foco: "napos", sol: (s) => { s.ult = H(17, 20); s.napos = 12; }, ok: (s, r) => r.nivel === "info" && s.napos >= 10 },
      { t: "d", foco: "cidade", sol: (s) => { s.cidade = "muita"; s.ult = H(18, 40); s.napos = 60; }, ok: (s, r) => s.cidade === "muita" && s.ult >= H(18, 30) && r.nivel === "info" },
      { t: "d", foco: "napos", sol: (s) => { s.ult = H(17, 25); s.napos = 10; }, ok: (s, r) => s.napos >= 8 && r.nivel === "info" && s.ult <= H(17, 40) },
    ],
    cenario(r) {
      const s = this.base(); s.seed = r.int(1, 99999); s.cidade = r() < 0.7 ? "pouca" : "muita"; const k = r.int(0, 3);
      s.ult = k === 0 ? H(16, r.int(40, 59)) : k === 1 ? H(17, r.int(1, 30)) : k === 2 ? H(18, r.int(30, 59)) : H(19, r.int(0, 50));
      s.napos = s.ult > FIM ? r.int(3, 120) : 0;
      return s;
    },
  };

  // L02 Tempo de cada voto (votos rápidos e em rajada)
  T.L02 = {
    nivel: "log", vis: "regua",
    base: () => ({ raj: 2, semdig: false, med: 72, seed: 1202 }),
    avaliar(s) {
      const g = regiao(s.seed, 75, 9, 30, 150), z = zReg(s.med, g), v = { z, g, med: mediana(g), regua: { vals: g, alvo: s.med, un: "s" } };
      const cats = [];
      if (s.raj >= 5 && s.semdig) cats.push({ c: "rajada" });
      if (z <= -VP.Z) cats.push({ c: "tempo_curto", info: true });
      return { nivel: cats.some((c) => !c.info) ? "anom" : cats.length ? "info" : "ok", cats, v };
    },
    missoes: [
      { t: "s", foco: "raj", sol: (s) => { s.raj = 6; s.semdig = true; }, ok: (s, r) => tem(r, "rajada") && s.raj <= 8 },
      { t: "s", foco: "raj", sol: (s) => { s.raj = 15; s.semdig = true; }, ok: (s, r) => tem(r, "rajada") && s.raj >= 12 },
      { t: "a", foco: "semdig", sol: (s) => { s.raj = 5; s.semdig = true; }, ok: (s, r) => tem(r, "rajada") && s.raj === 5 },
      { t: "a", foco: "med", sol: (s) => { s.med = 35; }, ok: (s, r) => tem(r, "tempo_curto") && r.nivel === "info" },
      { t: "d", foco: "raj", sol: (s) => { s.raj = 4; s.semdig = true; }, ok: (s, r) => s.raj === 4 && s.semdig && r.nivel === "ok" },
      { t: "d", foco: "raj", sol: (s) => { s.raj = 10; s.semdig = false; }, ok: (s, r) => s.raj >= 8 && !s.semdig && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base(); s.seed = r.int(1, 99999); const k = r.int(0, 3);
      s.raj = k === 0 ? r.int(5, 20) : r.int(0, 4); s.semdig = k === 0 || r() < 0.4; s.med = k === 1 ? r.int(25, 40) : r.int(60, 95);
      return s;
    },
  };

  // L03 Liberações sem digital em sequência
  T.L03 = {
    nivel: "log", vis: "kv",
    base: () => ({ seq: 3, bio: 85, falha: false }),
    avaliar(s) {
      if (s.bio < 50) return { nivel: "na", cats: [], v: {} };
      if (s.seq >= 10) return { nivel: s.falha ? "info" : "anom", cats: [{ c: s.falha ? "seq_com_falha" : "seq_sem_digital", info: s.falha }], v: {} };
      return { nivel: "ok", cats: [], v: {} };
    },
    missoes: [
      { t: "s", foco: "seq", sol: (s) => { s.seq = 12; }, ok: (s, r) => r.nivel === "anom" && s.seq <= 20 },
      { t: "s", foco: "seq", sol: (s) => { s.seq = 40; }, ok: (s, r) => r.nivel === "anom" && s.seq >= 30 },
      { t: "a", foco: "seq", sol: (s) => { s.seq = 10; }, ok: (s, r) => r.nivel === "anom" && s.seq === 10 },
      { t: "a", foco: "falha", sol: (s) => { s.seq = 30; s.falha = true; }, ok: (s, r) => r.nivel === "info" && s.seq >= 20 },
      { t: "d", foco: "seq", sol: (s) => { s.seq = 9; }, ok: (s, r) => s.seq === 9 && r.nivel === "ok" },
      { t: "d", foco: "bio", sol: (s) => { s.bio = 20; s.seq = 50; }, ok: (s, r) => s.seq >= 40 && r.nivel === "na" },
    ],
    cenario(r) { const s = this.base(); s.bio = r() < 0.15 ? r.int(5, 45) : r.int(60, 98); s.seq = r() < 0.5 ? r.int(10, 80) : r.int(0, 9); s.falha = r() < 0.3; return s; },
  };

  // L04 Votos depois do “todos já votaram? SIM”
  T.L04 = {
    nivel: "log", vis: "linha",
    base: () => ({ resp: "sim", depois: 0, registra: true }),
    avaliar(s) {
      if (!s.registra) return { nivel: "na", cats: [], v: {} };
      if (s.depois > 0) return { nivel: s.resp === "sim" ? "anom" : "info", cats: [{ c: s.resp === "sim" ? "voto_apos_sim" : "retomada", info: s.resp !== "sim" }], v: {} };
      return { nivel: "ok", cats: [], v: {} };
    },
    missoes: [
      { t: "s", foco: "depois", sol: (s) => { s.depois = 1; }, ok: (s, r) => r.nivel === "anom" && s.depois === 1 },
      { t: "s", foco: "depois", sol: (s) => { s.depois = 15; }, ok: (s, r) => r.nivel === "anom" && s.depois >= 10 },
      { t: "a", foco: "depois", sol: (s) => { s.depois = 2; }, ok: (s, r) => r.nivel === "anom" && s.depois === 2 },
      { t: "a", foco: "resp", sol: (s) => { s.resp = "nao"; s.depois = 3; }, ok: (s, r) => r.nivel === "info" },
      { t: "d", foco: "registra", sol: (s) => { s.registra = false; s.depois = 5; }, ok: (s, r) => r.nivel === "na" && s.depois > 0 },
      { t: "d", foco: "resp", sol: (s) => { s.resp = "nao"; s.depois = 20; }, ok: (s, r) => r.nivel === "info" && s.depois >= 15 },
    ],
    cenario(r) { const s = this.base(); s.resp = r() < 0.7 ? "sim" : "nao"; s.depois = r() < 0.5 ? 0 : r.int(1, 25); s.registra = r() > 0.1; return s; },
  };

  // L05 Falta de energia e interrupções
  T.L05 = {
    nivel: "log", vis: "linha",
    base: () => ({ quedas: 0, min: 0, dentro: false }),
    avaliar(s) {
      const cats = [];
      if (s.quedas >= 1 && s.dentro) cats.push({ c: "voto_desligada" });
      if (s.quedas >= 3) cats.push({ c: "muitos_reinicios" });
      if (s.quedas >= 1 && !cats.length) cats.push({ c: "interrupcao", info: true });
      return { nivel: cats.some((c) => !c.info) ? "anom" : cats.length ? "info" : "ok", cats, v: {} };
    },
    missoes: [
      { t: "s", foco: "dentro", sol: (s) => { s.quedas = 1; s.min = 20; s.dentro = true; }, ok: (s, r) => tem(r, "voto_desligada") },
      { t: "s", foco: "quedas", sol: (s) => { s.quedas = 3; s.min = 15; }, ok: (s, r) => tem(r, "muitos_reinicios") && !s.dentro },
      { t: "a", foco: "quedas", sol: (s) => { s.quedas = 4; s.min = 40; }, ok: (s, r) => tem(r, "muitos_reinicios") && s.quedas >= 4 },
      { t: "a", foco: "min", sol: (s) => { s.quedas = 1; s.min = 20; }, ok: (s, r) => r.nivel === "info" && s.min >= 15 },
      { t: "d", foco: "quedas", sol: (s) => { s.quedas = 2; s.min = 30; }, ok: (s, r) => s.quedas === 2 && r.nivel === "info" },
      { t: "d", foco: "min", sol: (s) => { s.quedas = 1; s.min = 90; }, ok: (s, r) => s.min >= 80 && r.nivel === "info" },
    ],
    cenario(r) { const s = this.base(); s.quedas = r() < 0.35 ? 0 : r.int(1, 5); s.min = s.quedas ? r.int(5, 120) : 0; s.dentro = s.quedas > 0 && r() < 0.3; return s; },
  };

  // L06 Troca de urna
  T.L06 = {
    nivel: "log", vis: "kv",
    base: () => ({ troca: false, v1: 240, v2: 0, comp: 240, depois: 0 }),
    avaliar(s) {
      const tot = s.v1 + (s.troca ? s.v2 : 0), dif = tot - s.comp, cats = [];
      if (dif !== 0) cats.push({ c: "soma_log_bu" });
      if (s.troca && s.depois > 0) cats.push({ c: "voto_original_apos" });
      if (!cats.length && s.troca) cats.push({ c: "troca_registrada", info: true });
      return { nivel: cats.some((c) => !c.info) ? "anom" : cats.length ? "info" : "ok", cats, v: { tot, dif } };
    },
    missoes: [
      { t: "s", foco: "v2", sol: (s) => { s.troca = true; s.v1 = 120; s.v2 = 130; }, ok: (s, r) => s.troca && r.v.dif > 0 },
      { t: "s", foco: "depois", sol: (s) => { s.troca = true; s.v1 = 120; s.v2 = 120; s.depois = 2; }, ok: (s, r) => tem(r, "voto_original_apos") && r.v.dif === 0 },
      { t: "a", foco: "v2", sol: (s) => { s.troca = true; s.v1 = 110; s.v2 = 118; }, ok: (s, r) => s.troca && r.v.dif < 0 && r.v.dif >= -20 },
      { t: "a", foco: "troca", sol: (s) => { s.troca = true; s.v1 = 100; s.v2 = 140; }, ok: (s, r) => r.nivel === "info" },
      { t: "d", foco: "troca", sol: (s) => { s.troca = true; s.v1 = 90; s.v2 = 150; }, ok: (s, r) => r.nivel === "info" && s.v1 <= 95 },
      { t: "d", foco: "comp", sol: (s) => { s.v1 = 260; s.comp = 260; }, ok: (s, r) => s.comp >= 255 && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base(); s.comp = r.int(120, 380); s.troca = r() < 0.6;
      if (s.troca) { s.v1 = r.int(20, s.comp - 20); s.v2 = s.comp - s.v1 + (r() < 0.35 ? r.int(-12, 12) || 3 : 0); s.depois = r() < 0.2 ? r.int(1, 5) : 0; }
      else { s.v1 = s.comp + (r() < 0.3 ? r.int(-8, 8) || 2 : 0); s.v2 = 0; }
      return s;
    },
  };

  // L07 Tentativas repetidas (já votou, não encontrado, impedido)
  T.L07 = {
    nivel: "log", vis: "regua",
    base: () => ({ tent: 3, el: 250, seguidas: false, seed: 1707 }),
    avaliar(s) {
      const tx = s.el ? (100 * s.tent) / s.el : 0, g = regiao(s.seed, 1.2, 0.5, 0, 6), z = zReg(tx, g);
      const v = { tx, z, g, med: mediana(g), regua: { vals: g, alvo: tx, un: "pct" } }, cats = [];
      if (s.tent >= 5 && z >= VP.Z) cats.push({ c: "tentativas_altas" });
      else if (s.seguidas) cats.push({ c: "tentativas_seguidas", info: true });
      return { nivel: cats.some((c) => !c.info) ? "anom" : cats.length ? "info" : "ok", cats, v };
    },
    missoes: [
      { t: "s", foco: "tent", sol: (s) => { s.tent = 30; }, ok: (s, r) => r.nivel === "anom" && s.tent >= 20 },
      { t: "s", ini: { el: 150 }, foco: "tent", sol: (s) => { s.tent = 12; }, ok: (s, r) => r.nivel === "anom" && s.tent <= 15 },
      { t: "a", foco: "tent", sol: (s) => { s.tent = 25; }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", foco: "seguidas", sol: (s) => { s.seguidas = true; }, ok: (s, r) => r.nivel === "info" },
      { t: "d", foco: "tent", sol: (s) => { s.tent = 4; s.el = 60; }, ok: (s, r) => s.tent === 4 && r.nivel === "ok" && r.v.tx > 5 },
      { t: "d", ini: { el: 700 }, foco: "tent", sol: (s) => { s.tent = 10; }, ok: (s, r) => s.tent >= 8 && r.nivel === "ok" },
    ],
    cenario(r) { const s = this.base(); s.seed = r.int(1, 99999); s.el = r.int(80, 600); s.tent = r() < 0.4 ? Math.round(s.el * (0.05 + 0.08 * r())) : r.int(0, Math.max(1, Math.round(s.el * 0.015))); s.seguidas = r() < 0.25; return s; },
  };

  // L08 Votos não concluídos
  T.L08 = {
    nivel: "log", vis: "regua",
    base: () => ({ nc: 1, el: 250, seed: 1808 }),
    avaliar(s) {
      const tx = s.el ? (100 * s.nc) / s.el : 0, g = regiao(s.seed, 0.5, 0.25, 0, 3), z = zReg(tx, g);
      const v = { tx, z, g, med: mediana(g), regua: { vals: g, alvo: tx, un: "pct" } };
      const anom = s.nc >= 5 && z >= VP.Z;
      return { nivel: anom ? "anom" : "ok", cats: anom ? [{ c: "nao_concluidos" }] : [], v };
    },
    missoes: [
      { t: "s", foco: "nc", sol: (s) => { s.nc = 12; }, ok: (s, r) => r.nivel === "anom" && s.nc >= 10 },
      { t: "s", ini: { el: 150 }, foco: "nc", sol: (s) => { s.nc = 6; }, ok: (s, r) => r.nivel === "anom" && s.nc <= 8 },
      { t: "a", foco: "nc", sol: (s) => { s.nc = 10; }, ok: (s, r) => r.nivel === "anom" && s.nc <= 11 },
      { t: "a", ini: { el: 180 }, foco: "nc", sol: (s) => { s.nc = 8; }, ok: (s, r) => r.nivel === "anom" },
      { t: "d", ini: { el: 80 }, foco: "nc", sol: (s) => { s.nc = 4; }, ok: (s, r) => s.nc === 4 && r.nivel === "ok" },
      { t: "d", ini: { el: 700 }, foco: "nc", sol: (s) => { s.nc = 5; }, ok: (s, r) => s.nc >= 5 && r.nivel === "ok" },
    ],
    cenario(r) { const s = this.base(); s.seed = r.int(1, 99999); s.el = r.int(80, 600); s.nc = r() < 0.4 ? Math.round(s.el * (0.03 + 0.04 * r())) : r.int(0, Math.max(1, Math.round(s.el * 0.006))); return s; },
  };

  // L09 Tentativas de encerramento
  T.L09 = {
    nivel: "log", vis: "linha",
    base: () => ({ t1: H(17, 3), n: 1 }),
    avaliar(s) {
      if (s.t1 < FIM - TOL) return { nivel: "anom", cats: [{ c: "encerrar_antes" }], v: {} };
      if (s.n >= 2) return { nivel: "info", cats: [{ c: "varias_tentativas", info: true }], v: {} };
      return { nivel: "ok", cats: [], v: {} };
    },
    missoes: [
      { t: "s", foco: "t1", sol: (s) => { s.t1 = H(16, 30); }, ok: (s, r) => r.nivel === "anom" && s.t1 >= H(16) },
      { t: "s", foco: "t1", sol: (s) => { s.t1 = H(12, 10); }, ok: (s, r) => r.nivel === "anom" && s.t1 < H(14) },
      { t: "a", foco: "t1", sol: (s) => { s.t1 = H(15); s.n = 2; }, ok: (s, r) => r.nivel === "anom" && s.t1 >= H(14) && s.t1 < H(16) },
      { t: "a", foco: "n", sol: (s) => { s.n = 2; }, ok: (s, r) => r.nivel === "info" },
      { t: "d", foco: "t1", sol: (s) => { s.t1 = H(17, 1); s.n = 1; }, ok: (s, r) => r.nivel === "ok" && s.t1 > FIM && s.t1 <= H(17, 2) },
      { t: "d", foco: "t1", sol: (s) => { s.t1 = H(16, 59); }, ok: (s, r) => r.nivel === "ok" && s.t1 < FIM },
    ],
    cenario(r) { const s = this.base(); const k = r.int(0, 2); s.t1 = k === 0 ? H(r.int(11, 16), r.int(0, 50)) : H(17, r.int(0, 50)); s.n = r.int(1, 3); return s; },
  };

  // L10 Hora da zerésima e da ligação da urna
  T.L10 = {
    nivel: "log", vis: "linha",
    base: () => ({ zer: H(7, 25), v1: H(8, 2), tem: true }),
    avaliar(s) {
      if (!s.tem) return { nivel: "anom", cats: [{ c: "sem_zeresima" }], v: {} };
      if (s.zer > s.v1) return { nivel: "anom", cats: [{ c: "zeresima_depois" }], v: {} };
      if (s.zer < H(6) || s.zer > H(8)) return { nivel: "info", cats: [{ c: "zeresima_fora", info: true }], v: {} };
      return { nivel: "ok", cats: [], v: {} };
    },
    missoes: [
      { t: "s", foco: "zer", sol: (s) => { s.zer = H(8, 20); s.v1 = H(8, 5); }, ok: (s, r) => tem(r, "zeresima_depois") },
      { t: "s", foco: "tem", sol: (s) => { s.tem = false; }, ok: (s, r) => tem(r, "sem_zeresima") },
      { t: "a", foco: "zer", sol: (s) => { s.zer = H(10, 15); s.v1 = H(10, 20); }, ok: (s, r) => r.nivel === "info" && s.zer >= H(9) },
      { t: "a", foco: "zer", sol: (s) => { s.zer = H(5, 40); }, ok: (s, r) => r.nivel === "info" && s.zer < H(6) },
      { t: "d", foco: "zer", sol: (s) => { s.zer = H(7, 59); s.v1 = H(8); }, ok: (s, r) => r.nivel === "ok" && s.v1 - s.zer <= 120 },
      { t: "d", foco: "v1", sol: (s) => { s.v1 = H(9, 30); }, ok: (s, r) => r.nivel === "ok" && s.v1 >= H(9) },
    ],
    cenario(r) { const s = this.base(); s.tem = r() > 0.12; s.zer = H(r.int(5, 9), r.int(0, 59)); s.v1 = r() < 0.2 ? s.zer - r.int(5, 30) * 60 : Math.max(H(8), s.zer + r.int(2, 40) * 60); return s; },
  };

  // L11 Relógio da urna
  T.L11 = {
    nivel: "log", vis: "linha",
    base: () => ({ dif: 2, ajuste: "nao" }),
    avaliar(s) {
      if (s.ajuste === "durante") return { nivel: "anom", cats: [{ c: "ajuste_durante" }], v: {} };
      const cats = [];
      if (Math.abs(s.dif) >= 15) cats.push({ c: "relogio_errado", info: true });
      if (s.ajuste === "fora") cats.push({ c: "ajuste_fora", info: true });
      return { nivel: cats.length ? "info" : "ok", cats, v: {} };
    },
    missoes: [
      { t: "s", foco: "ajuste", sol: (s) => { s.ajuste = "durante"; }, ok: (s, r) => r.nivel === "anom" && Math.abs(s.dif) < 15 },
      { t: "s", foco: "dif", sol: (s) => { s.ajuste = "durante"; s.dif = -30; }, ok: (s, r) => r.nivel === "anom" && Math.abs(s.dif) >= 15 },
      { t: "a", foco: "ajuste", sol: (s) => { s.dif = 40; s.ajuste = "durante"; }, ok: (s, r) => r.nivel === "anom" && s.dif >= 30 },
      { t: "a", foco: "dif", sol: (s) => { s.dif = 20; }, ok: (s, r) => r.nivel === "info" && s.dif >= 15 },
      { t: "d", foco: "dif", sol: (s) => { s.dif = -10; }, ok: (s, r) => r.nivel === "ok" && s.dif <= -8 },
      { t: "d", foco: "ajuste", sol: (s) => { s.ajuste = "fora"; }, ok: (s, r) => r.nivel === "info" && s.ajuste === "fora" },
    ],
    cenario(r) { const s = this.base(); s.dif = r() < 0.5 ? r.int(-8, 8) : r.int(-60, 60); s.ajuste = ["nao", "nao", "fora", "durante"][r.int(0, 3)]; return s; },
  };

  // L12 Modelo, versão do software e código de carga
  T.L12 = {
    nivel: "log", vis: "kv",
    base: () => ({ versao: "ok", carga: "ok", modelo: "prev", bate: true, va: 130, secao: "certa" }),
    avaliar(s) {
      const cats = [];
      if (s.versao !== "ok") cats.push({ c: "versao_diferente" });
      if (s.carga !== "ok") cats.push({ c: "carga_log_diferente" });
      if (!s.bate) cats.push({ c: "log_bu_diferentes" });
      if (!cats.length && s.modelo !== "prev") cats.push({ c: "modelo_outro", info: true });
      return { nivel: cats.some((c) => !c.info) ? "anom" : cats.length ? "info" : "ok", cats, v: {} };
    },
    missoes: [
      { t: "s", foco: "versao", sol: (s) => { s.versao = "outra"; }, ok: (s, r) => tem(r, "versao_diferente") },
      { t: "s", foco: "bate", sol: (s) => { s.bate = false; }, ok: (s, r) => tem(r, "log_bu_diferentes") },
      { t: "a", foco: "carga", sol: (s) => { s.carga = "outra"; }, ok: (s, r) => tem(r, "carga_log_diferente") },
      { t: "a", foco: "modelo", sol: (s) => { s.modelo = "outro"; }, ok: (s, r) => r.nivel === "info" },
      { t: "d", foco: "va", sol: (s) => { s.va += 30; }, ok: (s, r, s0) => s.va >= s0.va + 30 && r.nivel === "ok" },
      { t: "d", foco: "secao", sol: (s) => { s.secao = "outra"; }, ok: (s, r) => s.secao === "outra" && r.nivel === "ok" },
    ],
    cenario(r) { const s = this.base(); s.versao = r() < 0.2 ? "outra" : "ok"; s.carga = r() < 0.2 ? "outra" : "ok"; s.modelo = r() < 0.3 ? "outro" : "prev"; s.bate = r() > 0.15; return s; },
  };

  // L13 Biometria detalhada
  T.L13 = {
    nivel: "log", vis: "regua",
    base: () => ({ sem: 8, quatro: 5, regiao: "normal", seed: 1313 }),
    avaliar(s) {
      const g = s.regiao === "ruim" ? regiao(s.seed, 38, 6, 0, 100) : regiao(s.seed, 8, 2.5, 0, 100), z = zReg(s.sem, g);
      const v = { z, g, med: mediana(g), regua: { vals: g, alvo: s.sem, un: "pct" } }, cats = [];
      if (z >= VP.Z) cats.push({ c: "sem_digital_alto" });
      else if (s.quatro >= 20) cats.push({ c: "muitas_tentativas", info: true });
      return { nivel: cats.some((c) => !c.info) ? "anom" : cats.length ? "info" : "ok", cats, v };
    },
    missoes: [
      { t: "s", foco: "sem", sol: (s) => { s.sem = 45; }, ok: (s, r) => r.nivel === "anom" && s.sem >= 40 },
      { t: "s", foco: "sem", sol: (s) => { s.sem = 25; }, ok: (s, r) => r.nivel === "anom" && s.sem <= 30 },
      { t: "a", foco: "sem", sol: (s) => { s.sem = 60; }, ok: (s, r) => r.nivel === "anom" && s.sem >= 55 },
      { t: "a", foco: "quatro", sol: (s) => { s.quatro = 30; }, ok: (s, r) => r.nivel === "info" },
      { t: "d", foco: "sem", sol: (s) => { s.sem = 14; }, ok: (s, r) => s.sem >= 12 && r.nivel === "ok" },
      { t: "d", foco: "regiao", sol: (s) => { s.regiao = "ruim"; s.sem = 45; }, ok: (s, r) => s.regiao === "ruim" && s.sem >= 40 && r.nivel === "ok" },
    ],
    cenario(r) { const s = this.base(); s.seed = r.int(1, 99999); s.regiao = r() < 0.25 ? "ruim" : "normal"; s.sem = r() < 0.4 ? r.int(25, 70) : r.int(2, 14); s.quatro = r() < 0.3 ? r.int(20, 40) : r.int(0, 15); return s; },
  };

  // L14 Votos do log × boletim de urna
  T.L14 = {
    nivel: "log", vis: "kv",
    base: () => ({ log: 240, bu: 240, corromp: false, va: 130 }),
    avaliar(s) {
      const cats = [];
      if (s.corromp) cats.push({ c: "log_incompleto" });
      else if (s.log !== s.bu) cats.push({ c: "log_diferente_bu" });
      return { nivel: cats.length ? "anom" : "ok", cats, v: { dif: s.log - s.bu } };
    },
    missoes: [
      { t: "s", foco: "log", sol: (s) => { s.log = 245; }, ok: (s, r) => r.nivel === "anom" && s.log > s.bu },
      { t: "s", foco: "log", sol: (s) => { s.log = 230; }, ok: (s, r) => r.nivel === "anom" && s.log < s.bu },
      { t: "a", foco: "corromp", sol: (s) => { s.corromp = true; }, ok: (s, r) => tem(r, "log_incompleto") },
      { t: "a", foco: "log", sol: (s) => { s.log = 241; }, ok: (s, r) => r.nivel === "anom" && Math.abs(s.log - s.bu) === 1 },
      { t: "d", foco: "va", sol: (s) => { s.va += 25; }, ok: (s, r, s0) => s.va >= s0.va + 20 && r.nivel === "ok" },
      { t: "d", foco: "bu", sol: (s) => { s.log = 260; s.bu = 260; }, ok: (s, r) => r.nivel === "ok" && s.bu >= 255 },
    ],
    cenario(r) { const s = this.base(); s.bu = r.int(80, 420); s.log = s.bu + (r() < 0.45 ? (r.int(1, 12) * (r() < 0.5 ? -1 : 1)) : 0); s.corromp = r() < 0.12; return s; },
  };

  // --- controles de cada teste (os rótulos vêm dos textos do idioma) ------------------------------------------
  const VAR = { k: "var", t: "sel", op: ["p", "m", "a"] };
  const pctC = (k) => ({ k, t: "num", min: 1, max: 99 });
  S.CTL2 = {
    V1: [{ k: "n", t: "num", min: 100000, max: 8000000, passo: 100000 }, pctC("a1"), pctC("a2"), pctC("g1"), pctC("g2"), VAR],
    V2: [{ k: "n", t: "num", min: 500, max: 300000, passo: 500 }, pctC("a1"), pctC("a2"), pctC("g1"), pctC("g2"), VAR],
    V3: [{ k: "n", t: "num", min: 0, max: 3000, re: 1 }, pctC("a1"), pctC("a2"), pctC("g1"), pctC("g2"), VAR],
    V4: [{ k: "ap", t: "num", min: 0, max: 600, re: 1 }, { k: "c1", t: "num", min: 0, max: (s) => s.ap }, { k: "c2", t: "num", min: 0, max: (s) => s.ap },
      pctC("g1"), pctC("g2"), { k: "sa", t: "num", min: 0, max: 100 }, { k: "dirA", t: "num", min: 0, max: 100 }, VAR],
    V5: [{ k: "L1", t: "num", min: 0, max: 400 }, { k: "F1", t: "num", min: 0, max: 400 }, { k: "O1", t: "num", min: 0, max: 200 }, { k: "BN1", t: "num", min: 0, max: 200 },
      { k: "c2", t: "num", min: 0, max: 800 }, { k: "L2", t: "num", min: 0, max: 600 }, { k: "F2", t: "num", min: 0, max: 600 }],
    V6: [{ k: "ap1", t: "num", min: 0, max: 800 }, { k: "ap2", t: "num", min: 0, max: 800 }, { k: "bu1", t: "liga" }, { k: "bu2", t: "liga" }],
    L01: [{ k: "ult", t: "hora" }, { k: "napos", t: "num", min: 0, max: 300 }, { k: "cidade", t: "sel", op: ["pouca", "muita"] }],
    L02: [{ k: "raj", t: "num", min: 0, max: 40 }, { k: "semdig", t: "liga" }, { k: "med", t: "num", min: 10, max: 200 }],
    L03: [{ k: "seq", t: "num", min: 0, max: 200 }, { k: "bio", t: "num", min: 0, max: 100 }, { k: "falha", t: "liga" }],
    L04: [{ k: "resp", t: "sel", op: ["sim", "nao"] }, { k: "depois", t: "num", min: 0, max: 60 }, { k: "registra", t: "liga" }],
    L05: [{ k: "quedas", t: "num", min: 0, max: 8 }, { k: "min", t: "num", min: 0, max: 240 }, { k: "dentro", t: "liga" }],
    L06: [{ k: "troca", t: "liga" }, { k: "v1", t: "num", min: 0, max: 500 }, { k: "v2", t: "num", min: 0, max: 500 }, { k: "comp", t: "num", min: 0, max: 500 }, { k: "depois", t: "num", min: 0, max: 50 }],
    L07: [{ k: "tent", t: "num", min: 0, max: 120 }, { k: "el", t: "num", min: 1, max: 800 }, { k: "seguidas", t: "liga" }],
    L08: [{ k: "nc", t: "num", min: 0, max: 80 }, { k: "el", t: "num", min: 1, max: 800 }],
    L09: [{ k: "t1", t: "hora" }, { k: "n", t: "num", min: 1, max: 6 }],
    L10: [{ k: "zer", t: "hora" }, { k: "v1", t: "hora" }, { k: "tem", t: "liga" }],
    L11: [{ k: "dif", t: "num", min: -90, max: 90 }, { k: "ajuste", t: "sel", op: ["nao", "fora", "durante"] }],
    L12: [{ k: "versao", t: "sel", op: ["ok", "outra"] }, { k: "carga", t: "sel", op: ["ok", "outra"] }, { k: "modelo", t: "sel", op: ["prev", "outro"] }, { k: "bate", t: "liga" }, { k: "secao", t: "sel", op: ["certa", "outra"] }, { k: "va", t: "num", min: 0, max: 300 }],
    L13: [{ k: "sem", t: "num", min: 0, max: 100 }, { k: "quatro", t: "num", min: 0, max: 100 }, { k: "regiao", t: "sel", op: ["normal", "ruim"] }],
    L14: [{ k: "log", t: "num", min: 0, max: 500 }, { k: "bu", t: "num", min: 0, max: 500 }, { k: "corromp", t: "liga" }, { k: "va", t: "num", min: 0, max: 300 }],
  };
  // respostas possíveis nas provas (casos fictícios)
  S.RESP2 = {
    V1: ["anom", "info", "ok", "na"], V2: ["anom", "info", "ok", "na"], V3: ["anom", "info", "ok", "na"], V4: ["anom", "info", "ok", "na"], V5: ["info", "ok", "na"], V6: ["info", "ok"],
    L01: ["anom", "info", "ok"], L02: ["anom", "info", "ok"], L03: ["anom", "info", "ok", "na"], L04: ["anom", "info", "ok", "na"], L05: ["anom", "info", "ok"], L06: ["anom", "info", "ok"],
    L07: ["anom", "info", "ok"], L08: ["anom", "ok"], L09: ["anom", "info", "ok"], L10: ["anom", "info", "ok"], L11: ["anom", "info", "ok"], L12: ["anom", "info", "ok"],
    L13: ["anom", "info", "ok"], L14: ["anom", "ok"],
  };
  S.VP = VP; S.MV = MV; S.H = H; S.FIM = FIM;
})(typeof window !== "undefined" ? window : globalThis);
