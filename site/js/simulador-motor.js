/* Simulador de anomalias — motor. Reproduz, com dados fictícios, as regras e os parâmetros dos 15 testes do motor
   de auditoria (auditoria_eleicoes_2026.py): beta-binomial com estimador de momentos, Benjamini–Hochberg, escore z
   robusto, z de duas proporções com sobredispersão, coincidência multinomial, dígitos com Monte Carlo e Klimek.
   Não lê nenhum dado real: tudo é gerado no aparelho a partir de sementes fixas. */
(function (raiz) {
  "use strict";

  // --- parâmetros do motor (iguais aos do auditoria_eleicoes_2026.py) ---------------------------------------
  const P = {
    ALFA_FDR: 0.01, MIN_SECOES_GRUPO: 20, RHO_MIN: 1e-6, RHO_MAX: 0.5, MIN_VOTOS_UNANIMIDADE: 10, MIN_APTOS_ABSTENCAO: 20,
    MIN_VOTOS_PROPORCAO: 30, LIMIAR_BLOCO: 0.7, LIMIAR_Z_ROBUSTO: 3.5, MIN_VOTOS_VOTO_CRUZADO: 50, MIN_SECOES_LOCAL: 3,
    LIMIAR_DIF_VIZINHANCA_PP: 25, MIN_VOTOS_IDENTICOS: 50, MIN_CATEGORIAS_IDENTICOS: 3, LIMIAR_ESPERADO_IDENTICOS: 0.01,
    HORA_INICIO_OFICIAL: 8, HORA_FIM_OFICIAL: 17, TOLERANCIA_MINUTOS: 2, ATRASO_ABERTURA_MIN: 60, MIN_CONTAGENS_DIGITOS: 50,
    MIN_MEDIANA_DIGITOS: 30, REPLICAS_DIGITOS: 50, MIN_SECOES_LOCAL_DIGITOS: 4, KLIMEK_CANTO: 0.9, KLIMEK_MIN_CANTO: 10, KLIMEK_RAZAO: 3,
  };
  // Unidades avaliadas no 1º turno de 2026 (resumo do Relatório Técnico): usadas no ajuste de Benjamini–Hochberg,
  // supondo que todas as demais unidades do país estejam dentro do padrão (q = min(1, p × M)).
  const M = { T03: 1992870, T04: 499206, T05: 2490244, T07: 995429, T08: 902557, T10: 499060, T13: 120, T14: 248 };
  const RHO = { p: 0.002, m: 0.008, a: 0.03 };   // como as seções da região variam: pouco, médio, muito

  // --- números aleatórios com semente -----------------------------------------------------------------------
  function rng(seed) {
    let a = seed >>> 0;
    const f = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
    f.normal = () => { let u = 0; while (u === 0) u = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * f()); };
    f.gamma = (k) => {
      if (k < 1) { const u = f(); return f.gamma(1 + k) * Math.pow(u || 1e-12, 1 / k); }
      const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
      for (;;) {
        let x, v;
        do { x = f.normal(); v = 1 + c * x; } while (v <= 0);
        v = v * v * v; const u = f();
        if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
      }
    };
    f.beta = (a, b) => { const x = f.gamma(a), y = f.gamma(b); return x / (x + y); };
    f.binom = (n, p) => {
      if (n <= 0 || p <= 0) return 0;
      if (p >= 1) return n;
      const q = Math.min(p, 1 - p);
      let k;
      if (n * q < 15) {   // inversão exata
        const r = q / (1 - q); let pr = Math.pow(1 - q, n), acc = pr, u = f(); k = 0;
        while (u > acc && k < n) { pr *= r * (n - k) / (k + 1); k++; acc += pr; }
      } else k = Math.min(n, Math.max(0, Math.round(n * q + Math.sqrt(n * q * (1 - q)) * f.normal())));
      return q === p ? k : n - k;
    };
    return f;
  }

  // --- funções estatísticas -----------------------------------------------------------------------------------
  const LC = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lgamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1; let a = LC[0]; const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += LC[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  const lbeta = (a, b) => lgamma(a) + lgamma(b) - lgamma(a + b);
  const lchoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
  const logSoma = (ls) => { const mx = Math.max(...ls); if (!isFinite(mx)) return -Infinity; let s = 0; ls.forEach((l) => { s += Math.exp(l - mx); }); return mx + Math.log(s); };
  // P(X ≥ x) sob beta-binomial, em logaritmo natural
  function lsfBB(x, n, a, b) {
    if (x <= 0) return 0;
    if (x > n) return -Infinity;
    const ls = [];
    for (let k = x; k <= n; k++) ls.push(lchoose(n, k) + lbeta(k + a, n - k + b) - lbeta(a, b));
    return Math.min(0, logSoma(ls));
  }
  // P(X = n) = B(n + a, b) / B(a, b)
  const lintegral = (n, a, b) => Math.min(0, lbeta(n + a, b) - lbeta(a, b));
  // Estimador de momentos ponderado (Ridout, Demétrio & Firth, 1999), igual ao parametros_betabinomial do motor
  function paramsBB(N, X, Q, S2, G) {
    const mb = X / N;
    const S = (Q - 2 * mb * X + mb * mb * N) / (G - 1);
    const n0 = (N - S2 / N) / (G - 1);
    let rho = (S / (mb * (1 - mb)) - 1) / (n0 - 1);
    if (!isFinite(rho)) rho = P.RHO_MIN;
    if (G < 3) rho = P.RHO_MAX;
    rho = Math.min(P.RHO_MAX, Math.max(P.RHO_MIN, rho));
    const m = (X + 0.5) / (N + 1), k = 1 / rho - 1;
    return { a: m * k, b: (1 - m) * k, m: mb, rho, mp: m };
  }
  function suficientes(xs, ns) {
    let N = 0, X = 0, Q = 0, S2 = 0;
    xs.forEach((x, i) => { const n = ns[i]; N += n; X += x; Q += (x * x) / n; S2 += n * n; });
    return { N, X, Q, S2, G: xs.length };
  }
  const paramsGrupo = (xs, ns) => { const s = suficientes(xs, ns); return paramsBB(s.N, s.X, s.Q, s.S2, s.G); };
  const mediana = (v) => { const s = v.slice().sort((a, b) => a - b), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
  function zRobusto(v, todos) { const med = mediana(todos), mad = mediana(todos.map((x) => Math.abs(x - med))); return mad > 0 ? (0.6745 * (v - med)) / mad : NaN; }
  // log P(Z > z) da normal padrão (aproximação de Numerical Recipes, erro relativo < 1,2e-7)
  function lsfNormal(z) {
    if (z < 0) return Math.log(1 - Math.exp(lsfNormal(-z)));
    const x = z / Math.SQRT2, t = 1 / (1 + 0.5 * x);
    const l = Math.log(t) - x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))));
    return l - Math.LN2;
  }
  // log P(χ² > x) com gl graus de liberdade (gama incompleta regularizada superior)
  function lsfChi2(x, gl) {
    const a = gl / 2, z = x / 2;
    if (z <= 0) return 0;
    const pre = -z + a * Math.log(z) - lgamma(a);
    if (z < a + 1) {
      let s = 1 / a, d = s, ap = a;
      for (let i = 0; i < 500; i++) { ap += 1; d *= z / ap; s += d; if (Math.abs(d) < Math.abs(s) * 1e-15) break; }
      const pinf = Math.exp(pre) * s;
      return Math.log(Math.max(1e-300, 1 - pinf));
    }
    let b = z + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (let i = 1; i < 500; i++) {
      const an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return pre + Math.log(h);
  }
  // Benjamini–Hochberg para a unidade testada quando as demais M − 1 estão dentro do padrão
  const lqBH = (lp, m) => Math.min(0, lp + Math.log(m));
  const ex = (l) => Math.exp(Math.max(-745, l));

  // =========================================================================================================
  // Grupo de referência fictício (região): seções com média m e correlação intraclasse rho
  // =========================================================================================================
  const cacheGrupo = new Map();
  function grupo(seed, m, rho, G, nmin, nmax) {
    const ch = [seed, m, rho, G, nmin, nmax].join("|");
    if (cacheGrupo.has(ch)) return cacheGrupo.get(ch);
    const r = rng(seed), k = 1 / rho - 1, xs = [], ns = [];
    for (let i = 0; i < G; i++) {
      const n = r.int(nmin, nmax), p = r.beta(Math.max(1e-3, m * k), Math.max(1e-3, (1 - m) * k));
      ns.push(n); xs.push(r.binom(n, p));
    }
    const g = { xs, ns };
    cacheGrupo.set(ch, g);
    return g;
  }

  // Testes de proporção em uma seção contra a região (T03, T04, T05, T07, T10)
  // tipo "integral": P(X = n) (unanimidade, comparecimento integral); "superior": P(X ≥ x) só quando x/n > m
  function proporcao(o) {
    const g = grupo(o.seed, o.m, RHO[o.rho] || o.rho, o.G || 60, o.nmin, o.nmax);
    const xs = o.inverter ? g.xs.map((x, i) => g.ns[i] - x) : g.xs;
    const pr = paramsGrupo(xs, g.ns);
    let lp = 0;
    if (o.tipo === "integral") lp = lintegral(o.n, pr.a, pr.b);
    else if (o.n > 0 && o.x > 0 && o.x / o.n > pr.m) lp = lsfBB(o.x, o.n, pr.a, pr.b);
    const lq = lqBH(lp, o.M);
    const props = xs.map((x, i) => x / g.ns[i]);
    return { lp, lq, p: ex(lp), q: ex(lq), a: pr.a, b: pr.b, mref: pr.m, rho: pr.rho, G: xs.length, props, alfa: P.ALFA_FDR, M: o.M,
      z: zRobusto(o.x / o.n, props.concat([o.x / o.n])) };
  }

  // =========================================================================================================
  // Os 15 testes. Cada um: base() → estado inicial; avaliar(s) → {nivel, cats[], v{}}; missões; cenário de prova.
  // nivel: "ok" (normal), "anom" (anomalia), "info" (informativo), "insp" (marcado para inspeção), "na" (fora do teste)
  // =========================================================================================================
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const tem = (r, c) => r.cats.some((x) => x.c === c);
  const T = {};

  // ---------------- T01 Fechamento do boletim ----------------
  const CARGOS = [1, 3, 5, 6, 7];
  T.T01 = {
    nivel: "boletim",
    base: () => ({ c: { 1: { ap: 300, co: 240, ab: 60 }, 3: { ap: 300, co: 240, ab: 60 }, 5: { ap: 300, co: 240, ab: 60 }, 6: { ap: 300, co: 240, ab: 60 }, 7: { ap: 300, co: 240, ab: 60 } },
      va: 130, vb: 95, br: 5, nu: 10, neg: 7, dup: false, div: false, urn: false, aus: 0, fant: 0 }),
    avaliar(s) {
      const cats = [], L = CARGOS.filter((c) => c !== +s.aus);
      const e = (c) => ({ ap: s.c[c].ap + s.fant, co: s.c[c].co + s.fant, ab: s.c[c].ab });
      L.forEach((c) => {
        const x = e(c);
        if (x.ap !== x.co + x.ab) cats.push({ c: "aptos_comp_abst", cargo: c, obs: `${x.ap} ≠ ${x.co} + ${x.ab}` });
        if (x.co > x.ap) cats.push({ c: "comp_maior_aptos", cargo: c, obs: `${x.co} > ${x.ap}` });
      });
      if (s.div) cats.push({ c: "valores_divergentes", cargo: 6, obs: `${e(6).ap - 2}–${e(6).ap}` });
      if (s.dup) cats.push({ c: "votavel_duplicado", cargo: 6, obs: "1" });
      if (s.neg < 0) cats.push({ c: "votos_negativos", cargo: 6, obs: String(s.neg) });
      const est = L.filter((c) => c !== 1).map((c) => e(c).co);
      if (est.length && Math.min(...est) !== Math.max(...est)) cats.push({ c: "comp_estadual_divergente", obs: `${Math.min(...est)}–${Math.max(...est)}` });
      if (L.includes(1) && est.length && e(1).co < Math.max(...est)) cats.push({ c: "comp_presidente_menor", cargo: 1, obs: `${e(1).co} < ${Math.max(...est)}` });
      if (s.urn) cats.push({ c: "urna_inconsistente", obs: "2" });
      if (+s.aus) cats.push({ c: "cargo_ausente", cargo: +s.aus, obs: String(s.aus) });
      return { nivel: cats.length ? "anom" : "ok", cats, v: { L } };
    },
    missoes: [
      { t: "s", foco: "c.1.ap", sol: (s) => { s.c[1].ap += 5; }, ok: (s, r) => tem(r, "aptos_comp_abst") },
      { t: "s", foco: "c.3.co", sol: (s) => { s.c[3].co = 305; s.c[3].ab = -5; }, ok: (s, r) => tem(r, "comp_maior_aptos") },
      { t: "s", foco: "neg", sol: (s) => { s.neg = -5; }, ok: (s, r) => tem(r, "votos_negativos") },
      { t: "s", foco: "dup", sol: (s) => { s.dup = true; }, ok: (s, r) => tem(r, "votavel_duplicado") },
      { t: "s", foco: "c.3.co", sol: (s) => { s.c[3].co = 238; s.c[3].ab = 62; }, ok: (s, r) => tem(r, "comp_estadual_divergente") && !tem(r, "aptos_comp_abst") },
      { t: "s", foco: "c.1.co", sol: (s) => { s.c[1].co = 235; s.c[1].ab = 65; }, ok: (s, r) => tem(r, "comp_presidente_menor") && !tem(r, "aptos_comp_abst") },
      { t: "a", foco: "aus", sol: (s) => { s.aus = 5; }, ok: (s, r) => tem(r, "cargo_ausente") },
      { t: "a", foco: "c.7.ab", sol: (s) => { s.c[7].ab = 6; }, ok: (s, r) => s.c[7].ab === 6 && tem(r, "aptos_comp_abst") },
      { t: "a", foco: "urn", sol: (s) => { s.urn = true; }, ok: (s, r) => tem(r, "urna_inconsistente") },
      { t: "d", foco: "va", sol: (s) => { s.va -= 30; s.vb += 30; }, ok: (s, r, s0) => s.va <= s0.va - 30 && s.vb >= s0.vb + 30 && r.nivel === "ok" },
      { t: "d", foco: "fant", sol: (s) => { s.fant = 10; }, ok: (s, r) => s.fant >= 10 && r.nivel === "ok" },
      { t: "d", foco: "br", sol: (s) => { s.va += s.br; s.br = 0; }, ok: (s, r, s0) => s.br === 0 && s.va >= s0.va + s0.br && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base(), k = r.int(0, 9);
      const ap = r.int(150, 420), co = Math.round(ap * (0.7 + r() * 0.2));
      CARGOS.forEach((c) => { s.c[c] = { ap, co, ab: ap - co }; });
      if (k === 0) s.c[CARGOS[r.int(0, 4)]].ab += r.int(1, 9);
      else if (k === 1) s.neg = -r.int(1, 9);
      else if (k === 2) s.dup = true;
      else if (k === 3) { s.c[3].co -= 2; s.c[3].ab += 2; }
      else if (k === 4) { s.c[1].co -= 3; s.c[1].ab += 3; }
      else if (k === 5) s.aus = [3, 5, 6, 7][r.int(0, 3)];
      else if (k === 6) s.fant = r.int(5, 30);
      else if (k === 7) { const d = r.int(5, 40); s.va += d; s.vb -= d; }
      return s;
    },
  };

  // ---------------- T02 Inconsistência de totais ----------------
  const K2 = { p: 1, s: 2, d: 1 };
  const soma = (o) => Object.values(o).reduce((a, b) => a + (+b || 0), 0);
  T.T02 = {
    nivel: "boletim",
    base: () => ({ co: 240, p: { a: 130, b: 95, br: 5, nu: 10 }, s: { c1: 150, c2: 140, c3: 160, br: 15, nu: 15 }, d: { nom: 190, leg: 20, br: 12, nu: 18 } }),
    avaliar(s) {
      const cats = [], tot = {};
      ["p", "s", "d"].forEach((k) => {
        tot[k] = soma(s[k]);
        const esp = K2[k] * s.co, dl = tot[k] - esp;
        if (dl !== 0) cats.push({ c: "soma_votos", cargo: k, obs: `${tot[k]} ≠ ${K2[k]} × ${s.co}`, delta: dl });
      });
      return { nivel: cats.length ? "anom" : "ok", cats, v: { tot } };
    },
    missoes: [
      { t: "s", foco: "p.a", sol: (s) => { s.p.a += 20; }, ok: (s, r, s0) => s.p.a >= s0.p.a + 20 && r.cats.some((x) => x.cargo === "p" && x.delta > 0) },
      { t: "s", foco: "p.b", sol: (s) => { s.p.b -= 15; }, ok: (s, r, s0) => s.p.b <= s0.p.b - 15 && r.cats.some((x) => x.cargo === "p" && x.delta < 0) },
      { t: "s", foco: "p.a", sol: (s) => { s.p.a += 1; }, ok: (s, r) => r.cats.some((x) => x.cargo === "p" && x.delta === 1) },
      { t: "s", foco: "s.c1", sol: (s) => { s.s.c1 += 10; }, ok: (s, r) => r.cats.some((x) => x.cargo === "s" && x.delta > 0) },
      { t: "s", foco: "d.leg", sol: (s) => { s.d.leg += 30; }, ok: (s, r, s0) => s.d.leg >= s0.d.leg + 30 && r.cats.some((x) => x.cargo === "d") },
      { t: "s", foco: "co", sol: (s) => { s.co += 10; }, ok: (s, r, s0) => s.co >= s0.co + 10 && r.cats.length === 3 },
      { t: "a", foco: "d.nu", sol: (s) => { s.d.nu = 0; }, ok: (s, r) => s.d.nu === 0 && r.cats.some((x) => x.cargo === "d") },
      { t: "a", foco: "s.br", sol: (s) => { s.s.br = 51; }, ok: (s, r) => s.s.br === 51 && r.cats.some((x) => x.cargo === "s") },
      { t: "a", foco: "s.c3", sol: (s) => { s.s.c3 = 0; }, ok: (s, r) => s.s.c3 === 0 && r.cats.some((x) => x.cargo === "s") },
      { t: "d", foco: "p.a", sol: (s) => { s.p.a -= 25; s.p.b += 25; }, ok: (s, r, s0) => s.p.a <= s0.p.a - 25 && s.p.b >= s0.p.b + 25 && r.nivel === "ok" },
      { t: "d", foco: "p.br", sol: (s) => { s.p.a += s.p.br; s.p.br = 0; }, ok: (s, r, s0) => s.p.br === 0 && s.p.a >= s0.p.a + s0.p.br && r.nivel === "ok" },
      { t: "d", foco: "co", sol: (s) => { s.co += 10; s.p.a += 10; s.s.c1 += 10; s.s.c2 += 10; s.d.nom += 10; }, ok: (s, r, s0) => s.co >= s0.co + 10 && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base(), k = r.int(0, 7), d = r.int(1, 25);
      if (k === 0) s.p.a += d; else if (k === 1) s.s.c2 -= d; else if (k === 2) s.d.leg += d; else if (k === 3) s.co += d;
      else if (k === 4) { s.p.a -= d; s.p.b += d; } else if (k === 5) { s.s.c1 += d; s.s.c3 -= d; }
      return s;
    },
  };

  // ---------------- T03 Unanimidade na seção ----------------
  T.T03 = {
    nivel: "secao",
    base: () => ({ n: 120, a: 70, m: 55, rho: "m", seed: 303 }),
    avaliar(s) {
      const n = s.n, a = Math.min(s.a, n);
      if (n < P.MIN_VOTOS_UNANIMIDADE) return { nivel: "na", cats: [], v: { n, a } };
      const uniA = a === n, uniB = a === 0;
      if (!uniA && !uniB) return { nivel: "ok", cats: [], v: { n, a, mref: s.m / 100 } };
      const pr = proporcao({ seed: s.seed, m: s.m / 100, rho: s.rho, nmin: 60, nmax: 300, tipo: "integral", n, x: n, M: M.T03, inverter: uniB });
      const anom = pr.q < P.ALFA_FDR;
      return { nivel: anom ? "anom" : "info", cats: [{ c: anom ? "unanimidade" : "unanimidade_100", cand: uniA ? "A" : "B" }], v: Object.assign({ n, a, cand: uniA ? "A" : "B" }, pr) };
    },
    missoes: [
      { t: "s", foco: "a", sol: (s) => { s.a = s.n; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { m: 30, n: 80, a: 25 }, foco: "a", sol: (s) => { s.a = s.n; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { n: 60, a: 33 }, foco: "a", sol: (s) => { s.a = 0; }, ok: (s, r) => r.nivel === "anom" && r.v.cand === "B" },
      { t: "s", ini: { n: 300, a: 170 }, foco: "a", sol: (s) => { s.a = s.n; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { m: 75, rho: "p", n: 80, a: 60 }, foco: "a", sol: (s) => { s.a = s.n; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { m: 75, rho: "m", n: 10, a: 10 }, foco: "n", sol: (s) => { for (let n = 10; n <= 400; n++) { s.n = n; s.a = n; if (T.T03.avaliar(s).nivel === "anom") return; } }, ok: (s, r) => r.nivel === "anom" && s.a === s.n },
      { t: "a", ini: { m: 50, rho: "p", n: 30, a: 16 }, foco: "a", sol: (s) => { s.a = s.n; }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", ini: { m: 55, rho: "p", n: 40, a: 22 }, foco: "a", sol: (s) => { s.a = s.n; }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", ini: { m: 50, rho: "m", n: 40, a: 21 }, foco: "a", sol: (s) => { s.a = s.n; }, ok: (s, r) => r.nivel === "anom" },
      { t: "d", foco: "a", sol: (s) => { s.a = s.n - 1; }, ok: (s, r) => s.a === s.n - 1 && r.nivel === "ok" },
      { t: "d", ini: { n: 9, a: 5 }, foco: "a", sol: (s) => { s.a = 9; }, ok: (s, r) => s.a === s.n && r.nivel === "na" },
      { t: "d", ini: { m: 97, rho: "m", n: 50, a: 48 }, foco: "a", sol: (s) => { s.a = s.n; }, ok: (s, r) => s.a === s.n && r.nivel === "info" },
    ],
    cenario(r) {
      const m = [30, 45, 55, 70, 85, 95][r.int(0, 5)], n = [8, 15, 25, 40, 80, 150, 250][r.int(0, 6)];
      const k = r.int(0, 3);
      return { m, rho: ["p", "m", "a"][r.int(0, 2)], n, a: k === 0 ? n - 1 - r.int(0, 3) : k === 1 ? 0 : n, seed: r.int(1, 99999) };
    },
  };

  // ---------------- T04 Abstenção zero ----------------
  T.T04 = {
    nivel: "secao",
    base: () => ({ ap: 180, co: 140, m: 80, rho: "m", seed: 404 }),
    avaliar(s) {
      const ap = s.ap, co = Math.min(s.co, ap);
      if (ap < P.MIN_APTOS_ABSTENCAO) return { nivel: "na", cats: [], v: { ap, co } };
      if (co !== ap) return { nivel: "ok", cats: [], v: { ap, co, mref: s.m / 100 } };
      const pr = proporcao({ seed: s.seed, m: s.m / 100, rho: s.rho, nmin: 150, nmax: 420, tipo: "integral", n: ap, x: ap, M: M.T04 });
      const anom = pr.q < P.ALFA_FDR;
      return { nivel: anom ? "anom" : "ok", cats: anom ? [{ c: "abstencao_zero" }] : [], v: Object.assign({ ap, co, integral: true }, pr) };
    },
    missoes: [
      { t: "s", foco: "co", sol: (s) => { s.co = s.ap; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { m: 65, ap: 120, co: 80 }, foco: "co", sol: (s) => { s.co = s.ap; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { m: 65, rho: "p", ap: 45, co: 30 }, foco: "co", sol: (s) => { s.co = s.ap; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { ap: 400, co: 330 }, foco: "co", sol: (s) => { s.co = s.ap; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { m: 85, ap: 20, co: 20 }, foco: "ap", sol: (s) => { for (let n = 20; n <= 500; n++) { s.ap = n; s.co = n; if (T.T04.avaliar(s).nivel === "anom") return; } }, ok: (s, r) => r.nivel === "anom" && s.co === s.ap },
      { t: "s", ini: { m: 75, rho: "p", ap: 80, co: 61 }, foco: "co", sol: (s) => { s.co = s.ap; }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", ini: { m: 65, rho: "p", ap: 50, co: 33 }, foco: "co", sol: (s) => { s.co = s.ap; }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", ini: { m: 65, rho: "m", ap: 60, co: 41 }, foco: "co", sol: (s) => { s.co = s.ap; }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", ini: { m: 78, rho: "p", ap: 80, co: 63 }, foco: "co", sol: (s) => { s.co = s.ap; }, ok: (s, r) => r.nivel === "anom" },
      { t: "d", foco: "co", sol: (s) => { s.co = s.ap - 1; }, ok: (s, r) => s.co === s.ap - 1 && r.nivel === "ok" },
      { t: "d", ini: { ap: 19, co: 15 }, foco: "co", sol: (s) => { s.co = 19; }, ok: (s, r) => s.co === s.ap && r.nivel === "na" },
      { t: "d", ini: { m: 97, rho: "m", ap: 30, co: 28 }, foco: "co", sol: (s) => { s.co = s.ap; }, ok: (s, r) => s.co === s.ap && r.nivel === "ok" },
    ],
    cenario(r) {
      const ap = [15, 25, 40, 80, 150, 300][r.int(0, 5)], m = [60, 75, 85, 92, 97][r.int(0, 4)];
      return { ap, co: r() < 0.7 ? ap : ap - r.int(1, 5), m, rho: ["p", "m", "a"][r.int(0, 2)], seed: r.int(1, 99999) };
    },
  };

  // ---------------- Testes de excesso (T05, T07, T10): mesma mecânica, campos diferentes ----------------
  function testeExcesso(id, cfg) {
    return {
      nivel: "secao",
      base: () => Object.assign({ m: cfg.m, rho: "m", seed: cfg.seed }, cfg.ini),
      x: cfg.x, n: cfg.n,
      avaliar(s) {
        const n = cfg.n(s), x = Math.min(cfg.x(s), n);
        if (n < cfg.min) return { nivel: "na", cats: [], v: { n, x } };
        const pr = proporcao({ seed: s.seed, m: s.m / 100, rho: s.rho, nmin: cfg.nmin, nmax: cfg.nmax, tipo: "superior", n, x, M: M[id] });
        const anom = pr.q < P.ALFA_FDR;
        return { nivel: anom ? "anom" : "ok", cats: anom ? [{ c: cfg.cat }] : [], v: Object.assign({ n, x, acima: x / n > pr.mref }, pr) };
      },
      cenario(r) {
        const s = this.base();
        cfg.cen(s, r);
        s.m = cfg.ms[r.int(0, cfg.ms.length - 1)]; s.rho = ["p", "m", "a"][r.int(0, 2)]; s.seed = r.int(1, 99999);
        return s;
      },
    };
  }
  // menor valor do campo k que acende a luz (para a missão "ache o limite")
  function limite(t, s, k, de, ate) { for (let v = de; v <= ate; v++) { const c = clone(s); setar(c, k, v); if (T[t].avaliar(c).nivel === "anom") return v; } return null; }

  T.T05 = testeExcesso("T05", { cat: "brancos_nulos", m: 4, seed: 505, min: P.MIN_VOTOS_PROPORCAO, nmin: 150, nmax: 400, ms: [3, 4, 6, 10, 15],
    ini: { tot: 250, br: 4, nu: 6 }, n: (s) => s.tot, x: (s) => s.br + s.nu,
    cen: (s, r) => { s.tot = [25, 45, 120, 250, 400][r.int(0, 4)]; const f = [0.01, 0.04, 0.08, 0.15, 0.3, 0.45][r.int(0, 5)]; s.nu = Math.round(s.tot * f * 0.6); s.br = Math.round(s.tot * f * 0.4); } });
  T.T05.missoes = [
    { t: "s", foco: "nu", sol: (s) => { s.nu = limite("T05", s, "nu", s.nu, s.tot) + 10; }, ok: (s, r, s0) => s.nu > s0.nu && r.nivel === "anom" },
    { t: "s", foco: "br", sol: (s) => { s.br = limite("T05", s, "br", s.br, s.tot) + 10; }, ok: (s, r, s0) => s.br > s0.br && s.nu === s0.nu && r.nivel === "anom" },
    { t: "s", ini: { tot: 40, br: 1, nu: 1 }, foco: "nu", sol: (s) => { s.nu = limite("T05", s, "nu", s.nu, s.tot) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", ini: { tot: 400, br: 7, nu: 9 }, foco: "nu", sol: (s) => { s.nu = limite("T05", s, "nu", s.nu, s.tot) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", ini: { m: 12, tot: 250, br: 12, nu: 18 }, foco: "nu", sol: (s) => { s.nu = limite("T05", s, "nu", s.nu, s.tot) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", foco: "nu", sol: (s) => { s.nu = limite("T05", s, "nu", s.nu, 250); }, ok: (s, r) => { if (r.nivel !== "anom") return false; const c = clone(s); c.nu -= 1; return T.T05.avaliar(c).nivel !== "anom"; } },
    { t: "a", foco: "nu", sol: (s) => { s.nu = limite("T05", s, "nu", s.nu, s.tot) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "a", ini: { tot: 220, br: 3, nu: 6 }, foco: "nu", sol: (s) => { s.nu = limite("T05", s, "nu", s.nu, s.tot) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "a", ini: { tot: 180, br: 3, nu: 4 }, foco: "br", sol: (s) => { s.br = 30; s.nu = limite("T05", s, "nu", s.nu, s.tot) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "d", foco: "nu", sol: (s) => { s.nu += 3; }, ok: (s, r, s0) => s.br + s.nu >= s0.br + s0.nu + 3 && r.nivel === "ok" },
    { t: "d", ini: { tot: 29, br: 1, nu: 1 }, foco: "nu", sol: (s) => { s.nu = 12; }, ok: (s, r) => s.br + s.nu >= 10 && r.nivel === "na" },
    { t: "d", foco: "nu", sol: (s) => { s.br = 0; s.nu = 0; }, ok: (s, r) => s.br + s.nu === 0 && r.nivel === "ok" },
  ];

  T.T07 = testeExcesso("T07", { cat: "legenda", m: 7, seed: 707, min: P.MIN_VOTOS_PROPORCAO, nmin: 150, nmax: 380, ms: [4, 7, 12, 20],
    ini: { val: 220, leg: 15 }, n: (s) => s.val, x: (s) => s.leg,
    cen: (s, r) => { s.val = [25, 60, 150, 300][r.int(0, 3)]; s.leg = Math.round(s.val * [0.02, 0.07, 0.15, 0.3, 0.45][r.int(0, 4)]); } });
  T.T07.missoes = [
    { t: "s", foco: "leg", sol: (s) => { s.leg = limite("T07", s, "leg", s.leg, s.val) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", ini: { val: 60, leg: 4 }, foco: "leg", sol: (s) => { s.leg = limite("T07", s, "leg", s.leg, s.val) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", ini: { val: 380, leg: 26 }, foco: "leg", sol: (s) => { s.leg = limite("T07", s, "leg", s.leg, s.val) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", ini: { m: 20, val: 220, leg: 44 }, foco: "leg", sol: (s) => { s.leg = limite("T07", s, "leg", s.leg, s.val) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", ini: { m: 4, val: 220, leg: 9 }, foco: "leg", sol: (s) => { s.leg = limite("T07", s, "leg", s.leg, s.val) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", foco: "leg", sol: (s) => { s.leg = limite("T07", s, "leg", s.leg, 220); }, ok: (s, r) => { if (r.nivel !== "anom") return false; const c = clone(s); c.leg -= 1; return T.T07.avaliar(c).nivel !== "anom"; } },
    { t: "a", foco: "leg", sol: (s) => { s.leg = limite("T07", s, "leg", s.leg, s.val) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "a", ini: { val: 160, leg: 10 }, foco: "leg", sol: (s) => { s.leg = limite("T07", s, "leg", s.leg, s.val) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "a", ini: { val: 260, leg: 18 }, foco: "leg", sol: (s) => { s.leg = limite("T07", s, "leg", s.leg, s.val) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "d", foco: "leg", sol: (s) => { s.leg += 4; }, ok: (s, r, s0) => s.leg >= s0.leg + 4 && r.nivel === "ok" },
    { t: "d", ini: { val: 28, leg: 2 }, foco: "leg", sol: (s) => { s.leg = 20; }, ok: (s, r) => s.leg >= 15 && r.nivel === "na" },
    { t: "d", foco: "leg", sol: (s) => { s.leg = 0; }, ok: (s, r) => s.leg === 0 && r.nivel === "ok" },
  ];

  T.T10 = testeExcesso("T10", { cat: "biometria", m: 3, seed: 1010, min: P.MIN_VOTOS_PROPORCAO, nmin: 150, nmax: 400, ms: [1.5, 3, 6, 12],
    ini: { co: 220, sb: 6 }, n: (s) => s.co, x: (s) => s.sb,
    cen: (s, r) => { s.co = [25, 60, 150, 300][r.int(0, 3)]; s.sb = Math.round(s.co * [0.01, 0.03, 0.08, 0.2, 0.35][r.int(0, 4)]); } });
  T.T10.missoes = [
    { t: "s", foco: "sb", sol: (s) => { s.sb = limite("T10", s, "sb", s.sb, s.co) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", ini: { co: 60, sb: 2 }, foco: "sb", sol: (s) => { s.sb = limite("T10", s, "sb", s.sb, s.co) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", ini: { co: 380, sb: 11 }, foco: "sb", sol: (s) => { s.sb = limite("T10", s, "sb", s.sb, s.co) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", ini: { m: 12, co: 220, sb: 26 }, foco: "sb", sol: (s) => { s.sb = limite("T10", s, "sb", s.sb, s.co) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", ini: { m: 1.5, co: 220, sb: 3 }, foco: "sb", sol: (s) => { s.sb = limite("T10", s, "sb", s.sb, s.co) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "s", foco: "sb", sol: (s) => { s.sb = limite("T10", s, "sb", s.sb, 220); }, ok: (s, r) => { if (r.nivel !== "anom") return false; const c = clone(s); c.sb -= 1; return T.T10.avaliar(c).nivel !== "anom"; } },
    { t: "a", foco: "sb", sol: (s) => { s.sb = limite("T10", s, "sb", s.sb, s.co) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "a", ini: { co: 200, sb: 5 }, foco: "sb", sol: (s) => { s.sb = limite("T10", s, "sb", s.sb, s.co) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "a", ini: { co: 240, sb: 7 }, foco: "sb", sol: (s) => { s.sb = limite("T10", s, "sb", s.sb, s.co) + 10; }, ok: (s, r) => r.nivel === "anom" },
    { t: "d", foco: "sb", sol: (s) => { s.sb += 3; }, ok: (s, r, s0) => s.sb >= s0.sb + 3 && r.nivel === "ok" },
    { t: "d", ini: { co: 29, sb: 1 }, foco: "sb", sol: (s) => { s.sb = 15; }, ok: (s, r) => s.sb >= 10 && r.nivel === "na" },
    { t: "d", foco: "sb", sol: (s) => { s.sb = 0; }, ok: (s, r) => s.sb === 0 && r.nivel === "ok" },
  ];

  // ---------------- T06 Voto cruzado extremo ----------------
  const ESC = [-2, -1, 0, 1, 2];   // Esquerda, Centro-esquerda, Centro, Centro-direita, Direita
  const escLeg = (l) => { const t = soma(l); return t ? l.reduce((a, w, i) => a + w * ESC[i], 0) / t : 0; };
  const escExe = (eA) => (-2 * eA + 2 * (100 - eA)) / 100;   // Candidato A: Esquerda; Candidato B: Direita
  const cacheG6 = new Map();
  function grupo6(seed, tipo) {
    const ch = seed + tipo;
    if (cacheG6.has(ch)) return cacheG6.get(ch);
    const r = rng(seed + (tipo === "dividido" ? 7 : 0)), ds = [];
    const ruido = tipo === "dividido" ? 0.55 : 0.18;
    for (let i = 0; i < 60; i++) {
      const eA = Math.min(95, Math.max(5, 55 + 12 * r.normal()));
      const lado = (100 - eA) / 100;   // a votação para deputado acompanha, em parte, a do presidente
      const base = [0.22 * (1 - lado) + 0.05, 0.18 * (1 - lado) + 0.05, 0.2, 0.18 * lado + 0.05, 0.22 * lado + 0.05].map((w) => Math.max(0.01, w + 0.03 * r.normal()));
      const t = soma(base);
      ds.push(escExe(eA) - escLeg(base.map((w) => (100 * w) / t)) + ruido * r.normal());
    }
    cacheG6.set(ch, ds);
    return ds;
  }
  T.T06 = {
    nivel: "secao",
    base: () => ({ nx: 250, nl: 240, eA: 55, l: [20, 15, 20, 20, 25], grupo: "padrao", seed: 606 }),
    avaliar(s) {
      const tl = soma(s.l) || 1, w = s.l.map((x) => x / tl);
      const ex_ = { e: s.eA / 100, d: 1 - s.eA / 100 }, lg = { e: w[0] + w[1], c: w[2], d: w[3] + w[4] };
      const dx = escExe(s.eA), dl = escLeg(s.l), delta = dx - dl;
      const v = { ex: ex_, lg, dx, dl, delta };
      if (s.nx < P.MIN_VOTOS_VOTO_CRUZADO || s.nl < P.MIN_VOTOS_VOTO_CRUZADO) return { nivel: "na", cats: [], v };
      const crA = (ex_.e >= P.LIMIAR_BLOCO && lg.d >= P.LIMIAR_BLOCO) || (ex_.d >= P.LIMIAR_BLOCO && lg.e >= P.LIMIAR_BLOCO);
      const ds = grupo6(s.seed, s.grupo), todos = ds.concat([delta]);
      const z = zRobusto(delta, todos), crB = Math.abs(z) >= P.LIMIAR_Z_ROBUSTO;
      Object.assign(v, { crA, crB, z, med: mediana(todos), mad: mediana(todos.map((x) => Math.abs(x - mediana(todos)))), G: todos.length });
      return { nivel: crA && crB ? "anom" : "ok", cats: crA && crB ? [{ c: "voto_cruzado_pres_df" }] : [], v };
    },
    missoes: [
      { t: "s", foco: "eA", sol: (s) => { s.eA = 80; s.l = [5, 5, 10, 20, 60]; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", foco: "eA", sol: (s) => { s.eA = 20; s.l = [50, 25, 10, 10, 5]; }, ok: (s, r) => r.nivel === "anom" && s.eA <= 30 },
      { t: "s", ini: { grupo: "dividido" }, foco: "eA", sol: (s) => { s.eA = 97; s.l = [0, 0, 2, 8, 90]; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { nx: 60, nl: 55 }, foco: "eA", sol: (s) => { s.eA = 85; s.l = [3, 4, 8, 25, 60]; }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", foco: "l.3", sol: (s) => { s.eA = 88; s.l = [0, 5, 10, 70, 15]; }, ok: (s, r) => r.nivel === "anom" && s.l[3] >= s.l[4] },
      { t: "s", foco: "l.1", sol: (s) => { s.eA = 12; s.l = [15, 65, 10, 5, 5]; }, ok: (s, r) => r.nivel === "anom" && s.l[1] >= s.l[0] },
      { t: "a", foco: "l.4", sol: (s) => { s.eA = 78; s.l = [4, 4, 8, 12, 72]; }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", foco: "eA", sol: (s) => { s.eA = 22; s.l = [48, 30, 10, 7, 5]; }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", ini: { eA: 70 }, foco: "l.4", sol: (s) => { s.eA = 76; s.l = [5, 5, 10, 15, 65]; }, ok: (s, r) => r.nivel === "anom" },
      { t: "d", foco: "eA", sol: (s) => { s.eA = 66; s.l = [8, 10, 17, 25, 40]; }, ok: (s, r) => s.eA >= 60 && r.v.lg.d >= 0.6 && r.nivel === "ok" },
      { t: "d", ini: { nx: 49, nl: 47 }, foco: "eA", sol: (s) => { s.eA = 90; s.l = [0, 0, 5, 15, 80]; }, ok: (s, r) => s.eA >= 85 && r.v.lg.d >= 0.8 && r.nivel === "na" },
      { t: "d", foco: "l.2", sol: (s) => { s.eA = 90; s.l = [5, 5, 60, 15, 15]; }, ok: (s, r) => s.eA >= 85 && s.l[2] >= 50 && r.nivel === "ok" },
    ],
    cenario(r) {
      const k = r.int(0, 3), s = this.base();
      s.grupo = r() < 0.3 ? "dividido" : "padrao"; s.seed = r.int(1, 99999);
      if (k === 0) { s.eA = r.int(75, 95); s.l = [2, 3, 8, r.int(10, 25), r.int(55, 80)]; }
      else if (k === 1) { s.eA = r.int(60, 69); s.l = [10, 10, 15, 25, 40]; }
      else if (k === 2) { s.nx = r.int(30, 49); s.eA = 85; s.l = [2, 3, 5, 15, 75]; }
      else { s.eA = r.int(40, 65); }
      return s;
    },
  };

  // ---------------- T08 Contraste de vizinhança ----------------
  const cacheFi = new Map();
  function phiGrupo(seed) {   // sobredispersão do grupo: mediana(z0²)/0,4549 em seções fictícias de outros locais
    if (cacheFi.has(seed)) return cacheFi.get(seed);
    const r = rng(seed), z2 = [];
    for (let l = 0; l < 25; l++) {
      const k = r.int(3, 7), mu = Math.min(0.85, Math.max(0.15, 0.55 + 0.1 * r.normal()));
      const ns = [], xs = [];
      for (let i = 0; i < k; i++) { const n = r.int(150, 330), p = r.beta(mu * 120, (1 - mu) * 120); ns.push(n); xs.push(r.binom(n, p)); }
      const N = soma(ns), X = soma(xs);
      ns.forEach((n, i) => { const pr = (X - xs[i]) / (N - n), pp = X / N, se = Math.sqrt(pp * (1 - pp) * (1 / n + 1 / (N - n))); if (se > 0) z2.push(Math.pow((xs[i] / n - pr) / se, 2)); });
    }
    const phi = Math.max(1, mediana(z2) / 0.4549364);
    cacheFi.set(seed, phi);
    return phi;
  }
  T.T08 = {
    nivel: "local",
    base: () => ({ k: 5, n: [220, 240, 210, 230, 250, 225, 235, 215], a: [55, 52, 58, 54, 56, 53, 57, 55], alvo: 2, seed: 808 }),
    avaliar(s) {
      const k = +s.k, ns = s.n.slice(0, k), xs = ns.map((n, i) => Math.round((n * s.a[i]) / 100));
      const phi = phiGrupo(s.seed), sec = [];
      if (k < P.MIN_SECOES_LOCAL) return { nivel: "na", cats: [], v: { k, phi, sec } };
      const N = soma(ns), X = soma(xs);
      ns.forEach((n, i) => {
        if (n < P.MIN_VOTOS_PROPORCAO) { sec.push({ i, na: true }); return; }
        const pS = xs[i] / n, pR = (X - xs[i]) / (N - n), pP = X / N;
        const se = Math.sqrt(pP * (1 - pP) * (1 / n + 1 / (N - n)));
        const z0 = se > 0 ? (pS - pR) / se : 0, z = z0 / Math.sqrt(phi);
        const lp = Math.log(2) + lsfNormal(Math.abs(z)), lq = lqBH(Math.min(0, lp), M.T08);
        const dif = 100 * (pS - pR);
        sec.push({ i, n, x: xs[i], pS, pR, z0, z, lp, lq, p: ex(lp), q: ex(lq), dif, sinal: ex(lq) < P.ALFA_FDR && Math.abs(dif) >= P.LIMIAR_DIF_VIZINHANCA_PP });
      });
      const sinal = sec.filter((x) => x.sinal);
      const al = sec[s.alvo] || sec[0];
      return { nivel: sinal.length ? "anom" : "ok", cats: sinal.map((x) => ({ c: "vizinhanca", secao: x.i })), v: { k, phi, sec, alvo: al, M: M.T08 } };
    },
    missoes: [
      { t: "s", foco: "a.2", sol: (s) => { s.a[2] = 90; }, ok: (s, r) => r.v.alvo.sinal },
      { t: "s", foco: "a.2", sol: (s) => { s.a[2] = 20; }, ok: (s, r) => r.v.alvo.sinal && r.v.alvo.dif < 0 },
      { t: "s", ini: { k: 3, alvo: 1 }, foco: "a.1", sol: (s) => { s.a[1] = 92; }, ok: (s, r) => r.v.alvo.sinal },
      { t: "d", ini: { n: [40, 38, 42, 36, 41, 39, 40, 37], alvo: 2 }, foco: "a.2", sol: (s) => { s.a[2] = 100; }, ok: (s, r) => s.a[2] >= 95 && !r.v.alvo.sinal },
      { t: "s", foco: "a.2", sol: (s) => { for (let v = 56; v <= 100; v++) { s.a[2] = v; if (T.T08.avaliar(s).v.alvo.sinal) return; } }, ok: (s, r) => { if (!r.v.alvo.sinal) return false; const c = clone(s); c.a[c.alvo] -= Math.sign(r.v.alvo.dif); return !T.T08.avaliar(c).v.alvo.sinal; } },
      { t: "s", ini: { k: 6, alvo: 1 }, foco: "a.1", sol: (s) => { s.a[1] = 95; s.a[4] = 95; }, ok: (s, r) => r.v.sec.filter((x) => x.sinal).length >= 2 },
      { t: "a", foco: "a.2", sol: (s) => { s.a[2] = 88; }, ok: (s, r) => r.v.alvo.sinal },
      { t: "a", ini: { alvo: 3 }, foco: "a.3", sol: (s) => { s.a[3] = 22; }, ok: (s, r) => r.v.alvo.sinal },
      { t: "a", ini: { k: 4, alvo: 0 }, foco: "a.0", sol: (s) => { s.a[0] = 90; }, ok: (s, r) => r.v.alvo.sinal },
      { t: "d", foco: "a.2", sol: (s) => { s.a[2] = 77; }, ok: (s, r) => Math.abs(r.v.alvo.dif) >= 20 && !r.v.alvo.sinal },
      { t: "d", ini: { k: 2, alvo: 1 }, foco: "a.1", sol: (s) => { s.a[1] = 90; }, ok: (s, r) => s.a[1] >= 85 && r.nivel === "na" },
      { t: "d", foco: "a.0", sol: (s) => { for (let i = 0; i < 8; i++) s.a[i] += 25; }, ok: (s, r, s0) => s.a.slice(0, s.k).every((v, i) => v >= s0.a[i] + 20) && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base(); s.k = r.int(2, 6); s.alvo = r.int(0, Math.min(s.k, 5) - 1); s.seed = r.int(1, 99999);
      if (r() < 0.3) s.n = s.n.map(() => r.int(32, 60));
      s.a[s.alvo] = Math.min(100, Math.max(0, 55 + [-40, -30, -20, 20, 30, 40][r.int(0, 5)] + r.int(-5, 5)));
      return s;
    },
  };

  // ---------------- T09 Seções com resultados idênticos ----------------
  const VET = {
    p: { v1: [128, 104, 6, 12], v2: [117, 113, 4, 9], N: 2200 },
    g: { v1: [61, 54, 47, 30, 22, 9, 8, 14], v2: [66, 49, 44, 33, 19, 11, 7, 16], N: 90 },
    d: { v1: [38, 31, 27, 22, 19, 16, 14, 11, 9, 7, 21, 9, 13], v2: [35, 33, 25, 24, 18, 14, 15, 12, 8, 9, 19, 10, 12], N: 90 },
  };
  T.T09 = {
    nivel: "local",
    base: () => ({ cargo: "d", v1: VET.d.v1.slice(), v2: VET.d.v2.slice(), N: VET.d.N }),
    avaliar(s) {
      const a = s.v1.filter((x) => x > 0), b = s.v2.filter((x) => x > 0);
      const igual = s.v1.length === s.v2.length && s.v1.every((x, i) => x === s.v2[i]);
      const n = soma(s.v1), K = a.length, v = { n, K, igual, N: s.N };
      if (!igual) return { nivel: "ok", cats: [], v };
      if (n < P.MIN_VOTOS_IDENTICOS || K < P.MIN_CATEGORIAS_IDENTICOS) return { nivel: "na", cats: [], v };
      const ps = a.map((x) => x / n);
      const lpc = Math.min(0, -0.5 * (K - 1) * Math.log(4 * Math.PI * n) - 0.5 * ps.reduce((t, p) => t + Math.log(p), 0));
      const pares = (s.N * (s.N - 1)) / 2, lE = lpc + Math.log(Math.max(1, pares));
      Object.assign(v, { lpc, pc: ex(lpc), pares, lE, E: ex(lE) });
      const anom = v.E < P.LIMIAR_ESPERADO_IDENTICOS;
      return { nivel: anom ? "anom" : "ok", cats: anom ? [{ c: "identicos" }] : [], v };
    },
    missoes: [
      { t: "s", foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { cargo: "g", v1: VET.g.v1.slice(), v2: VET.g.v2.slice(), N: 90 }, foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { v1: [9, 7, 6, 5, 4, 4, 3, 3, 2, 2, 5, 3, 4], v2: [8, 8, 5, 6, 4, 3, 3, 4, 2, 1, 6, 2, 5] }, foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.nivel === "anom" },
      { t: "s", ini: { cargo: "g", v1: VET.g.v1.slice(), v2: VET.g.v2.slice(), N: 1500 }, foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", ini: { cargo: "g", v1: VET.g.v1.slice(), v2: VET.g.v2.slice(), N: 90 }, foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.nivel === "anom" },
      { t: "a", ini: { N: 400 }, foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.nivel === "anom" },
      { t: "d", foco: "v2.0", sol: (s) => { s.v2 = s.v1.slice(); s.v2[0] += 1; s.v2[1] -= 1; }, ok: (s, r) => { const dif = s.v1.reduce((t, x, i) => t + Math.abs(x - s.v2[i]), 0); return dif > 0 && dif <= 2 && r.nivel === "ok"; } },
      { t: "d", ini: { cargo: "p", v1: VET.p.v1.slice(), v2: VET.p.v2.slice(), N: 2200 }, foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.v.igual && r.nivel === "ok" },
      { t: "d", ini: { cargo: "p", v1: [31, 26, 2, 3], v2: [28, 29, 1, 4], N: 2200 }, foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.v.igual && r.nivel === "ok" },
      { t: "d", ini: { v1: [8, 6, 5, 4, 3, 3, 2, 2, 1, 1, 4, 2, 3], v2: [7, 7, 4, 4, 3, 2, 3, 2, 1, 1, 5, 1, 4] }, foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.v.igual && r.nivel === "na" },
      { t: "d", ini: { cargo: "p", v1: [140, 112, 0, 0], v2: [131, 121, 0, 0], N: 2200 }, foco: "copiar", sol: (s) => { s.v2 = s.v1.slice(); }, ok: (s, r) => r.v.igual && r.nivel === "na" },
    ],
    cenario(r) {
      const cargo = ["p", "g", "d"][r.int(0, 2)], v1 = VET[cargo].v1.map((x) => Math.max(0, Math.round(x * [0.2, 0.5, 1, 1.5][r.int(0, 3)])));
      const s = { cargo, v1, v2: v1.slice(), N: [40, 90, 600, 2200][r.int(0, 3)] };
      if (r() < 0.25) s.v2[0] += 1;
      return s;
    },
  };

  // ---------------- T11 Horários atípicos ----------------
  const hs = (h, m, s) => h * 3600 + m * 60 + (s || 0);
  T.T11 = {
    nivel: "boletim",
    base: () => ({ fuso: 0, ab: hs(8, 0, 12), en: hs(17, 0, 40), em: hs(17, 2, 10), re: hs(17, 15, 30), drift: 0, data: false }),
    avaliar(s) {
      const off = +s.fuso, tol = P.TOLERANCIA_MINUTOS * 60, dr = (+s.drift || 0) * 60;
      const ab = s.ab + dr, en = s.en + dr, em = s.em + dr, re = s.re;
      const ini = (P.HORA_INICIO_OFICIAL + off) * 3600, fim = (P.HORA_FIM_OFICIAL + off) * 3600;
      const emB = em - off * 3600, cats = [];
      if (ab < ini - tol) cats.push({ c: "abertura_antecipada" });
      if (en < fim - tol) cats.push({ c: "encerramento_antecipado" });
      if (en < ab) cats.push({ c: "encerramento_antes_abertura" });
      if (em < en - tol) cats.push({ c: "emissao_antes_encerramento" });
      if (s.data) cats.push({ c: "data_divergente" });
      if (re < emB - tol) cats.push({ c: "recebimento_antes_emissao" });
      const atraso = ab >= ini + P.ATRASO_ABERTURA_MIN * 60;
      if (atraso) cats.push({ c: "atraso_abertura", info: true });
      const anom = cats.some((c) => !c.info);
      return { nivel: anom ? "anom" : atraso ? "info" : "ok", cats, v: { ab, en, em, re, emB, ini, fim, off, tol } };
    },
    missoes: [
      { t: "s", foco: "ab", sol: (s) => { s.ab = hs(7, 50); }, ok: (s, r) => tem(r, "abertura_antecipada") },
      { t: "s", foco: "en", sol: (s) => { s.en = hs(16, 30); s.em = hs(16, 32); }, ok: (s, r) => tem(r, "encerramento_antecipado") },
      { t: "s", foco: "em", sol: (s) => { s.em = hs(16, 55); }, ok: (s, r) => tem(r, "emissao_antes_encerramento") },
      { t: "s", foco: "re", sol: (s) => { s.re = hs(16, 50); }, ok: (s, r) => tem(r, "recebimento_antes_emissao") },
      { t: "s", foco: "en", sol: (s) => { s.en = hs(7, 30); }, ok: (s, r) => tem(r, "encerramento_antes_abertura") },
      { t: "s", foco: "data", sol: (s) => { s.data = true; }, ok: (s, r) => tem(r, "data_divergente") },
      { t: "a", foco: "drift", sol: (s) => { s.drift = -15; }, ok: (s, r) => s.drift < 0 && tem(r, "abertura_antecipada") },
      { t: "a", foco: "ab", sol: (s) => { s.ab = hs(13, 10); }, ok: (s, r) => tem(r, "atraso_abertura") },
      { t: "a", foco: "drift", sol: (s) => { s.drift = 25; }, ok: (s, r) => s.drift > 0 && tem(r, "recebimento_antes_emissao") },
      { t: "d", foco: "en", sol: (s) => { s.en = hs(16, 59); s.em = hs(17, 1); }, ok: (s, r) => s.en >= hs(16, 58) && s.en < hs(17, 0) && r.nivel === "ok" },
      { t: "d", ini: { fuso: -1, ab: hs(8, 0, 12), en: hs(17, 0, 40), em: hs(17, 2, 10), re: hs(17, 15, 30) }, foco: "ab", sol: (s) => { s.ab = hs(7, 1); s.en = hs(16, 1); s.em = hs(16, 3); }, ok: (s, r) => +s.fuso === -1 && s.ab <= hs(7, 5) && r.nivel === "ok" },
      { t: "d", foco: "en", sol: (s) => { s.en = hs(19, 10); s.em = hs(19, 13); s.re = hs(19, 30); }, ok: (s, r) => s.en >= hs(18, 30) && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base(), k = r.int(0, 8);
      if (k === 0) s.ab = hs(7, r.int(30, 57)); else if (k === 1) s.ab = hs(7, 58, r.int(0, 59));
      else if (k === 2) s.en = hs(16, r.int(0, 57)); else if (k === 3) s.en = hs(16, 58, r.int(5, 59));
      else if (k === 4) { s.fuso = -1; s.ab = hs(7, r.int(0, 5)); s.en = hs(16, r.int(0, 10)); s.em = s.en + 120; }
      else if (k === 5) s.ab = hs(r.int(9, 13), r.int(0, 59)); else if (k === 6) s.re = s.em - r.int(5, 30) * 60;
      else if (k === 7) { s.en = hs(18, r.int(0, 59)); s.em = s.en + 180; s.re = s.em + 900; }
      return s;
    },
  };

  // ---------------- T12 Troca de urna e votação em cédula ----------------
  const URNAS = { prev: 2045123, cont: 2099001, outra: 2045777, desc: 3011999 };
  T.T12 = {
    nivel: "boletim",
    URNAS, CARGA: "A7F3",
    base: () => ({ urna: "prev", carga: "A7F3", tipo: 1, junta: false, semCesp: false, va: 130, vb: 110 }),
    avaliar(s) {
      const cats = [], tipo = +s.tipo;
      if (tipo !== 1) cats.push({ c: "tipo_urna_" + tipo });
      if (s.junta) cats.push({ c: "junta_apuradora", info: true });
      else if (s.semCesp) cats.push({ c: "sem_correspondencia" });
      else if (s.urna === "prev") {
        if (!s.carga) cats.push({ c: "carga_ausente" });
        else if (s.carga !== "A7F3") cats.push({ c: "carga_divergente" });
      } else if (s.urna === "cont") cats.push(s.carga === "A7F3" ? { c: "contingencia_oficial", info: true } : { c: "contingencia_carga_divergente" });
      else if (s.urna === "outra") cats.push({ c: "urna_de_outra_secao" });
      else cats.push({ c: "urna_nao_prevista" });
      const anom = cats.some((c) => !c.info);
      return { nivel: anom ? "anom" : cats.length ? "info" : "ok", cats, v: { regular: !cats.length } };
    },
    missoes: [
      { t: "s", foco: "urna", sol: (s) => { s.urna = "desc"; }, ok: (s, r) => tem(r, "urna_nao_prevista") },
      { t: "s", foco: "urna", sol: (s) => { s.urna = "outra"; }, ok: (s, r) => tem(r, "urna_de_outra_secao") },
      { t: "s", foco: "carga", sol: (s) => { s.carga = "B2E8"; }, ok: (s, r) => tem(r, "carga_divergente") },
      { t: "s", foco: "urna", sol: (s) => { s.urna = "cont"; s.carga = "B2E8"; }, ok: (s, r) => tem(r, "contingencia_carga_divergente") },
      { t: "s", foco: "carga", sol: (s) => { s.carga = ""; }, ok: (s, r) => tem(r, "carga_ausente") },
      { t: "s", foco: "tipo", sol: (s) => { s.tipo = 4; }, ok: (s, r) => tem(r, "tipo_urna_4") },
      { t: "s", foco: "tipo", sol: (s) => { s.tipo = 2; }, ok: (s, r) => tem(r, "tipo_urna_2") },
      { t: "a", foco: "urna", sol: (s) => { s.urna = "cont"; }, ok: (s, r) => tem(r, "contingencia_oficial") },
      { t: "a", foco: "junta", sol: (s) => { s.junta = true; }, ok: (s, r) => tem(r, "junta_apuradora") },
      { t: "a", foco: "semCesp", sol: (s) => { s.semCesp = true; }, ok: (s, r) => tem(r, "sem_correspondencia") },
      { t: "d", foco: "urna", sol: (s) => { s.urna = "cont"; }, ok: (s, r) => tem(r, "contingencia_oficial") && r.nivel === "info" },
      { t: "d", foco: "va", sol: (s) => { s.va += 20; s.vb -= 20; }, ok: (s, r, s0) => s.va >= s0.va + 20 && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base();
      s.urna = ["prev", "prev", "cont", "outra", "desc"][r.int(0, 4)];
      s.carga = r() < 0.75 ? "A7F3" : r() < 0.5 ? "B2E8" : "";
      if (r() < 0.12) s.tipo = [2, 3, 4, 5][r.int(0, 3)];
      if (r() < 0.12) s.junta = true;
      return s;
    },
  };

  // =========================================================================================================
  // Cidade fictícia (T13, T14, T15): zonas → locais → seções
  // =========================================================================================================
  const cacheCidade = new Map();
  function cidade(seed, S, forca) {
    const ch = [seed, S, forca].join("|");
    if (cacheCidade.has(ch)) return cacheCidade.get(ch);
    const r = rng(seed), secs = [];
    const Z = Math.max(4, Math.round(S / 150));
    const zonas = Array.from({ length: Z }, () => ({ t: Math.min(0.88, Math.max(0.7, 0.79 + 0.04 * r.normal())), s: Math.min(0.97, Math.max(0.02, forca / 100 + (forca < 15 ? 0.01 : 0.08) * r.normal())) }));
    let loc = 0;
    while (secs.length < S) {
      const z = r.int(0, Z - 1), k = [1, 2, 3, 4, 5, 6, 8][r.int(0, 6)], mu = Math.min(0.98, Math.max(0.015, zonas[z].s + (zonas[z].s < 0.15 ? 0.008 : 0.06) * r.normal()));
      for (let i = 0; i < k && secs.length < S; i++) {
        const ap = r.int(220, 420), t = Math.min(0.97, Math.max(0.55, zonas[z].t + 0.04 * r.normal()));
        const co = Math.round(ap * t), val = Math.round(co * (0.93 + 0.04 * r())), p = r.beta(mu * 150, (1 - mu) * 150);
        secs.push({ z, loc, ap, co, val, x: r.binom(val, p) });
      }
      loc++;
    }
    const c = { secs, Z };
    cacheCidade.set(ch, c);
    return c;
  }
  const seg = (v) => (v < 100 ? v % 10 : v < 1000 ? Math.floor(v / 10) % 10 : v < 10000 ? Math.floor(v / 100) % 10 : Math.floor(v / 1000) % 10);
  const BENFORD2 = Array.from({ length: 10 }, (_, d) => { let p = 0; for (let k = 1; k <= 9; k++) p += Math.log10(1 + 1 / (10 * k + d)); return p; });
  // escolhe, de forma reprodutível, uma fração das seções para receber uma alteração
  const escolhidas = (n, frac, seed) => { const r = rng(seed), idx = []; for (let i = 0; i < n; i++) if (r() < frac / 100) idx.push(i); return new Set(idx); };
  function manipular(c, s, ultimo) {
    const xs = c.secs.map((q) => q.x), vals = c.secs.map((q) => q.val);
    const inv = escolhidas(xs.length, s.inv || 0, (s.seed || 1) + 11), arr = escolhidas(xs.length, s.arr || 0, (s.seed || 1) + 23);
    const som = escolhidas(xs.length, s.somaP || 0, (s.seed || 1) + 37), tr = escolhidas(xs.length, s.transf || 0, (s.seed || 1) + 51);
    const r = rng((s.seed || 1) + 97);
    for (let i = 0; i < xs.length; i++) {
      let x = xs[i];
      if (tr.has(i)) x += Math.round(0.15 * (vals[i] - x) * (0.7 + 0.6 * r()));
      if (som.has(i)) x += +s.soma || 0;
      if (inv.has(i)) {
        if (ultimo) { const u = r(), d = u < 0.3 ? 0 : u < 0.5 ? 5 : [2, 3, 4, 6, 7, 8][Math.floor(r() * 6)]; x = x - (x % 10) + d; }
        else x = x >= 100 ? Math.round(x / 50) * 50 : Math.round(x / 5) * 5;
      }
      if (arr.has(i)) x = Math.round(x / (s.arrPasso || 10)) * (s.arrPasso || 10);
      xs[i] = Math.max(0, Math.min(vals[i] + (+s.soma || 0), x));
    }
    return xs;
  }
  // Teste de dígitos como no motor: referência por Monte Carlo (50 réplicas) de beta-binomial ajustada por local
  // (≥ 4 seções) ou pela zona; χ² com 9 graus de liberdade corrigido por 1 + 1/50; q = p × M.
  function digitos(s, ultimo) {
    const c = cidade(s.seed, s.S, s.forca), xs = manipular(c, s, ultimo);
    const ns = c.secs.map((q, i) => Math.max(q.val, xs[i]));
    const obs = xs.filter((x) => x >= 10);
    const dig = (v) => (ultimo ? v % 10 : seg(v));
    const O = new Array(10).fill(0); obs.forEach((v) => { O[dig(v)]++; });
    const med = mediana(obs), Nn = obs.length;
    const v = { O, N: Nn, med, xs, ref: s.ref };
    const semCuidado = s.ref === "uniforme" || s.ref === "benford";
    if (Nn < P.MIN_CONTAGENS_DIGITOS || (!semCuidado && med < P.MIN_MEDIANA_DIGITOS)) return { nivel: "na", cats: [], v };
    let E;
    if (s.ref === "benford") E = BENFORD2.map((p) => Nn * p);
    else if (s.ref === "uniforme") E = new Array(10).fill(Nn / 10);
    else {
      const tam = new Map(); c.secs.forEach((q) => tam.set(q.loc, (tam.get(q.loc) || 0) + 1));
      const g = c.secs.map((q) => (tam.get(q.loc) >= P.MIN_SECOES_LOCAL_DIGITOS ? "L" + q.loc : "Z" + q.z));
      const grp = new Map();
      g.forEach((k, i) => { if (!grp.has(k)) grp.set(k, { xs: [], ns: [] }); grp.get(k).xs.push(xs[i]); grp.get(k).ns.push(ns[i]); });
      const par = new Map(); grp.forEach((d, k) => par.set(k, paramsGrupo(d.xs, d.ns)));
      const r = rng((s.seed || 1) * 7 + (ultimo ? 3 : 1)), S = new Array(10).fill(0);
      for (let rep = 0; rep < P.REPLICAS_DIGITOS; rep++) for (let i = 0; i < ns.length; i++) {
        const pr = par.get(g[i]), sim = r.binom(ns[i], r.beta(Math.max(1e-3, pr.a), Math.max(1e-3, pr.b)));
        if (sim >= 10) S[dig(sim)]++;
      }
      const tS = soma(S);
      E = S.map((x) => (Nn * (x + 0.5)) / (tS + 5));
    }
    const corr = s.ref === "modelo" || !s.ref ? 1 + 1 / P.REPLICAS_DIGITOS : 1;
    const chi2 = O.reduce((t, o, d) => t + Math.pow(o - E[d], 2) / E[d], 0) / corr;
    const lp = lsfChi2(chi2, 9), lq = lqBH(lp, ultimo ? M.T14 : M.T13);
    const media = O.reduce((t, o, d) => t + o * d, 0) / Nn, mediaE = E.reduce((t, e, d) => t + e * d, 0) / soma(E);
    Object.assign(v, { E, chi2, lp, lq, p: ex(lp), q: ex(lq), media, mediaE, corr, M: ultimo ? M.T14 : M.T13 });
    const anom = v.q < P.ALFA_FDR;
    return { nivel: anom ? "anom" : "ok", cats: anom ? [{ c: ultimo ? "ultimo_digito" : "segundo_digito" }] : [], v };
  }
  const baseDig = () => ({ S: 400, forca: 50, inv: 0, arr: 0, arrPasso: 10, soma: 0, somaP: 0, transf: 0, ref: "modelo", seed: 1313 });
  T.T13 = {
    nivel: "cidade",
    base: baseDig,
    avaliar: (s) => digitos(s, false),
    missoes: [
      { t: "s", foco: "inv", sol: (s) => { s.inv = 40; }, ok: (s, r) => s.inv > 0 && r.nivel === "anom" },
      { t: "s", ini: { forca: 22 }, foco: "arr", sol: (s) => { s.arr = 35; }, ok: (s, r) => s.arr > 0 && r.nivel === "anom" },
      { t: "s", ini: { S: 1200 }, foco: "inv", sol: (s) => { s.inv = 20; }, ok: (s, r) => s.inv > 0 && s.inv <= 25 && r.nivel === "anom" },
      { t: "s", ini: { forca: 25 }, foco: "inv", sol: (s) => { s.inv = 25; }, ok: (s, r) => s.inv > 0 && r.nivel === "anom" },
      { t: "s", ini: { S: 150 }, foco: "inv", sol: (s) => { s.inv = 70; }, ok: (s, r) => s.inv > 0 && r.nivel === "anom" },
      { t: "s", ini: { forca: 70 }, foco: "inv", sol: (s) => { s.inv = 40; }, ok: (s, r) => s.inv > 0 && r.nivel === "anom" },
      { t: "a", foco: "ref", sol: (s) => { s.ref = "benford"; }, ok: (s, r) => s.ref === "benford" && !s.inv && !s.arr && r.nivel === "anom" },
      { t: "a", ini: { forca: 85, S: 1200 }, foco: "ref", sol: (s) => { s.ref = "benford"; }, ok: (s, r) => s.ref === "benford" && !s.inv && !s.arr && r.nivel === "anom" },
      { t: "a", ini: { forca: 40, S: 1200 }, foco: "ref", sol: (s) => { s.ref = "benford"; }, ok: (s, r) => s.ref === "benford" && !s.inv && !s.arr && r.nivel === "anom" },
      { t: "d", foco: "inv", sol: (s) => { s.inv = 4; }, ok: (s, r) => s.inv >= 3 && r.nivel === "ok" },
      { t: "d", foco: "soma", sol: (s) => { s.soma = 20; s.somaP = 100; }, ok: (s, r) => s.soma >= 15 && s.somaP >= 90 && r.nivel === "ok" },
      { t: "d", foco: "transf", sol: (s) => { s.transf = 40; }, ok: (s, r) => s.transf >= 30 && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = baseDig(); s.seed = r.int(1, 99999); s.S = [40, 150, 400, 1200][r.int(0, 3)]; s.forca = [15, 30, 50, 70][r.int(0, 3)];
      const k = r.int(0, 3); if (k === 0) s.inv = r.int(20, 60); else if (k === 1) s.inv = r.int(1, 4);
      return s;
    },
  };
  T.T14 = {
    nivel: "cidade",
    base: () => Object.assign(baseDig(), { seed: 1414 }),
    avaliar: (s) => digitos(s, true),
    missoes: [
      { t: "s", foco: "inv", sol: (s) => { s.inv = 50; }, ok: (s, r) => s.inv > 0 && r.nivel === "anom" },
      { t: "s", foco: "arr", sol: (s) => { s.arr = 15; }, ok: (s, r) => s.arr > 0 && s.arrPasso === 10 && r.nivel === "anom" },
      { t: "s", foco: "arrPasso", sol: (s) => { s.arrPasso = 5; s.arr = 25; }, ok: (s, r) => s.arr > 0 && s.arrPasso === 5 && r.nivel === "anom" },
      { t: "s", ini: { S: 1200 }, foco: "inv", sol: (s) => { s.inv = 28; }, ok: (s, r) => s.inv > 0 && s.inv <= 30 && r.nivel === "anom" },
      { t: "s", ini: { S: 150 }, foco: "inv", sol: (s) => { s.inv = 70; }, ok: (s, r) => s.inv > 0 && r.nivel === "anom" },
      { t: "s", ini: { forca: 25 }, foco: "arr", sol: (s) => { s.arr = 20; }, ok: (s, r) => s.arr > 0 && r.nivel === "anom" },
      { t: "a", ini: { forca: 5 }, foco: "ref", sol: (s) => { s.ref = "uniforme"; }, ok: (s, r) => s.ref === "uniforme" && !s.inv && !s.arr && r.nivel === "anom" },
      { t: "a", ini: { forca: 3, S: 1200 }, foco: "ref", sol: (s) => { s.ref = "uniforme"; }, ok: (s, r) => s.ref === "uniforme" && !s.inv && !s.arr && r.nivel === "anom" },
      { t: "a", ini: { forca: 4, S: 800 }, foco: "ref", sol: (s) => { s.ref = "uniforme"; }, ok: (s, r) => s.ref === "uniforme" && !s.inv && !s.arr && r.nivel === "anom" },
      { t: "d", foco: "inv", sol: (s) => { s.inv = 4; }, ok: (s, r) => s.inv >= 3 && r.nivel === "ok" },
      { t: "d", foco: "soma", sol: (s) => { s.soma = 20; s.somaP = 100; }, ok: (s, r) => s.soma >= 15 && s.somaP >= 90 && r.nivel === "ok" },
      { t: "d", foco: "transf", sol: (s) => { s.transf = 40; }, ok: (s, r) => s.transf >= 30 && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = baseDig(); s.seed = r.int(1, 99999); s.S = [40, 150, 400, 1200][r.int(0, 3)]; s.forca = [15, 30, 50, 70][r.int(0, 3)];
      const k = r.int(0, 3); if (k === 0) { s.arr = r.int(15, 40); } else if (k === 1) s.inv = r.int(1, 4);
      return s;
    },
  };

  // ---------------- T15 Impressão digital eleitoral (Klimek) ----------------
  function klimek(s) {
    const c = cidade(s.seed, s.S, s.forca), r = rng((s.seed || 1) + 5), alvo = s.alvo / 100;
    const pts = c.secs.map((q) => ({ z: q.z, ap: q.ap, t: q.co / q.ap, s: q.x / q.val }));
    const pega = (i) => pts[i];
    // seções com enchimento: espalhadas pela cidade ou a zona 0 inteira
    const idx = s.modo === "zona" ? pts.map((p, i) => (p.z === 0 ? i : -1)).filter((i) => i >= 0)
      : [...escolhidas(pts.length, 100, (s.seed || 1) + 71)].sort((a, b) => ((a * 7919) % 101) - ((b * 7919) % 101)).slice(0, +s.enc || 0);
    if (s.modo === "zona" ? +s.enc > 0 : true) idx.forEach((i) => { const p = pega(i); p.t = Math.min(1, alvo + 0.02 * (r() - 0.5)); p.s = Math.min(1, alvo + 0.02 * (r() - 0.5)); p.mex = 1; });
    // mobilização legítima: seções de uma zona em que comparecimento e votação sobem juntos
    const mob = pts.map((p, i) => (p.z === 1 ? i : -1)).filter((i) => i >= 0).slice(0, +s.mob || 0);
    mob.forEach((i) => { const p = pega(i); p.t = Math.min(1, 0.91 + 0.06 * r()); p.s = Math.min(1, 0.9 + 0.07 * r()); p.mob = 1; });
    const C = P.KLIMEK_CANTO, gs = new Map();
    pts.forEach((p) => { p.ct = p.t >= C ? 1 : 0; p.cs = p.s >= C ? 1 : 0; if (!gs.has(p.z)) gs.set(p.z, { n: 0, ct: 0, cs: 0 }); const g = gs.get(p.z); g.n++; g.ct += p.ct; g.cs += p.cs; });
    let esp = 0, obs = 0;
    pts.forEach((p) => { const g = gs.get(p.z); esp += (g.ct / g.n) * (g.cs / g.n); obs += p.ct && p.cs ? 1 : 0; });
    const w = pts.map((p) => p.ap), sw = soma(w);
    const mt = pts.reduce((a, p, i) => a + w[i] * p.t, 0) / sw, ms = pts.reduce((a, p, i) => a + w[i] * p.s, 0) / sw;
    let cov = 0, vt = 0, vs = 0;
    pts.forEach((p, i) => { cov += w[i] * (p.t - mt) * (p.s - ms); vt += w[i] * (p.t - mt) ** 2; vs += w[i] * (p.s - ms) ** 2; });
    const corr = vt > 0 && vs > 0 ? cov / Math.sqrt(vt * vs) : NaN;
    const razao = esp > 0 ? obs / esp : obs > 0 ? Infinity : NaN;
    const insp = obs >= P.KLIMEK_MIN_CANTO && razao >= P.KLIMEK_RAZAO;
    return { nivel: insp ? "insp" : "ok", cats: insp ? [{ c: "klimek" }] : [], v: { pts, obs, esp, razao, corr, Z: c.Z, n: pts.length } };
  }
  T.T15 = {
    nivel: "cidade",
    base: () => ({ S: 1200, forca: 50, enc: 0, alvo: 97, modo: "espalhado", mob: 0, seed: 1515 }),
    avaliar: klimek,
    missoes: [
      { t: "s", foco: "enc", sol: (s) => { s.enc = 30; }, ok: (s, r) => s.enc > 0 && r.nivel === "insp" },
      { t: "s", foco: "enc", sol: (s) => { s.enc = 14; }, ok: (s, r) => s.enc > 0 && s.enc <= 15 && r.nivel === "insp" },
      { t: "s", ini: { S: 3000 }, foco: "enc", sol: (s) => { s.enc = 25; }, ok: (s, r) => s.enc > 0 && r.nivel === "insp" },
      { t: "s", ini: { alvo: 92 }, foco: "enc", sol: (s) => { s.enc = 25; }, ok: (s, r) => s.enc > 0 && s.alvo < 95 && r.nivel === "insp" },
      { t: "s", ini: { forca: 30 }, foco: "enc", sol: (s) => { s.enc = 20; }, ok: (s, r) => s.enc > 0 && r.nivel === "insp" },
      { t: "s", ini: { alvo: 100 }, foco: "enc", sol: (s) => { s.enc = 12; }, ok: (s, r) => s.enc > 0 && r.nivel === "insp" },
      { t: "a", foco: "mob", sol: (s) => { s.mob = 25; }, ok: (s, r) => s.mob > 0 && !s.enc && r.nivel === "insp" },
      { t: "a", ini: { forca: 35 }, foco: "mob", sol: (s) => { s.mob = 40; }, ok: (s, r) => s.mob > 0 && !s.enc && r.nivel === "insp" },
      { t: "a", ini: { S: 600 }, foco: "mob", sol: (s) => { s.mob = 15; }, ok: (s, r) => s.mob > 0 && !s.enc && r.nivel === "insp" },
      { t: "d", foco: "enc", sol: (s) => { s.enc = 9; }, ok: (s, r) => s.enc >= 5 && r.nivel === "ok" },
      { t: "d", ini: { alvo: 88 }, foco: "enc", sol: (s) => { s.enc = 40; }, ok: (s, r) => s.enc >= 30 && s.alvo < 90 && r.nivel === "ok" },
      { t: "d", foco: "modo", sol: (s) => { s.modo = "zona"; s.enc = 1; }, ok: (s, r) => s.modo === "zona" && s.enc > 0 && r.nivel === "ok" },
    ],
    cenario(r) {
      const s = this.base(); s.seed = r.int(1, 99999); s.S = [600, 1200, 3000][r.int(0, 2)];
      const k = r.int(0, 4);
      if (k === 0) s.enc = r.int(15, 40); else if (k === 1) s.enc = r.int(1, 8); else if (k === 2) { s.enc = 30; s.alvo = r.int(80, 88); }
      else if (k === 3) { s.modo = "zona"; s.enc = 1; }
      return s;
    },
  };

  // --- utilidades de estado ---------------------------------------------------------------------------------
  function ler(o, k) { return k.split(".").reduce((a, p) => (a == null ? a : a[p]), o); }
  function setar(o, k, v) { const ps = k.split("."), u = ps.pop(); const alvo = ps.reduce((a, p) => a[p], o); alvo[u] = v; }
  function estadoMissao(id, i) { const t = T[id], s = t.base(), m = t.missoes[i]; if (m && m.ini) Object.assign(s, clone(m.ini)); return s; }

  // Região fictícia de cada teste por seção (para o desenho): proporções das seções e média estimada
  const FAIXA = { T03: [60, 300], T04: [150, 420], T05: [150, 400], T07: [150, 380], T10: [150, 400] };
  function regiao(id, s) {
    if (id === "T06") { const ds = grupo6(s.seed, s.grupo); return { props: ds, m: mediana(ds) }; }
    const f = FAIXA[id], g = grupo(s.seed, s.m / 100, RHO[s.rho] || s.rho, 60, f[0], f[1]);
    const inv = id === "T03" && s.a === 0;
    const xs = inv ? g.xs.map((x, i) => g.ns[i] - x) : g.xs, pr = paramsGrupo(xs, g.ns);
    return { props: xs.map((x, i) => x / g.ns[i]), m: pr.m, rho: pr.rho, G: xs.length };
  }

  raiz.SIMM = { P, M, RHO, T, regiao, phiGrupo, rng, clone, ler, setar, estadoMissao, lgamma, lbeta, lsfBB, lintegral, paramsBB, lsfNormal, lsfChi2, mediana, zRobusto, BENFORD2, URNAS, cidade, hs };
})(typeof window !== "undefined" ? window : globalThis);
