/* Páginas de consulta e ferramentas: mapa, estados e municípios, lista de ocorrências, gráficos,
   glossário, conferência de arquivos e do boletim impresso, seções salvas e atualizações. */
(function () {
  "use strict";

  const A = window.APP;
  const { esc, icone, tabela, chip, $, $$ } = A;
  const t = () => A.t(), nf = (n) => A.nf(n), pct = (x, d) => A.pct(x, d);
  const R = () => A.state.R;
  const cache = {};

  // Carrega um JSON uma vez só
  function dado(url) {
    if (!cache[url]) cache[url] = A.json(url).catch((e) => { delete cache[url]; throw e; });
    return cache[url];
  }

  // Ocorrências de todas as seções: [uf, mun, zona, secao, turno, teste, nivel, cat]
  const ocorrencias = () => dado("site/data/ocorrencias.json").then((d) => d.o);
  const nomeCat = (c) => { const x = R().categorias[c]; return x ? x[A.state.lang] : c.replace(/_/g, " "); };
  const ufsLista = () => Object.keys(window.UF_NOMES).sort();
  const secoesUf = (n, uf) => (R().turnos[n].uf.find((u) => u.uf === uf) || { secoes: 0 }).secoes;
  const testesTodos = () => R().turnos["1"].testes.map((x) => x.id);
  const carregando = () => `<p class="muted">${esc(t().lk_loading)}</p>`;
  const erroDados = (e) => `<p class="alert">${esc(t().x_err)} (${esc(e.message)})</p>`;
  function cabecalho(tit, sub, img, extra) {
    return `<header class="page-head"><h1>${esc(tit)}</h1>${sub ? `<p class="lead">${esc(sub)}</p>` : ""}${A.acoes(img, extra)}</header>`;
  }
  function seletor(nome, rotulo, opcoes, atual) {
    return `<label><span>${esc(rotulo)}</span><select name="${nome}">${opcoes.map(([v, txt]) => `<option value="${esc(v)}"${String(v) === String(atual) ? " selected" : ""}>${esc(txt)}</option>`).join("")}</select></label>`;
  }
  const opTurno = (ambos) => (ambos ? [["", t().x_both]] : []).concat([["2", t().round(2)], ["1", t().round(1)]]);
  const opTeste = (todos) => (todos ? [["", todos]] : []).concat(testesTodos().map((id) => [id, `${A.numTeste(id)}. ${A.nomeTeste(id)}${estadual(id) ? ` (${t().est_short})` : ""}`]));
  const opNivel = () => [["", t().x_all_lv], ["a", t().lv_a], ["i", t().lv_i]];

  // --- testes 13, 14 e 15: feitos por estado (todas as seções do estado juntas), por candidato e cargo ----------
  // Não têm resultado por seção; quando dão sinal, o relatório registra o estado (ou BR, o agregado nacional).
  const ESTADUAIS = { T13: ["mebane", "segundo_digito"], T14: ["beber", "ultimo_digito"], T15: ["klimek", "klimek"] };
  const estadual = (id) => id in ESTADUAIS;
  function analisesEstado(n, id) {
    return R().turnos[n][ESTADUAIS[id][0]].map((r) => ({ id, n: +n, uf: r.uf, cargo: r.cargo || 1, nr: r.nr, nome: r.nome, r,
      nivel: id === "T15" ? (r.insp ? "i" : "") : r.sinal ? "a" : "" }));
  }
  // Mesmo formato de ocorrencias.json; município, zona e seção vazios e o detalhe da análise na 9ª posição
  function ocorrenciasEstado() {
    const out = [];
    ["1", "2"].forEach((n) => Object.keys(ESTADUAIS).forEach((id) => analisesEstado(n, id).forEach((x) => {
      if (x.nivel) out.push([x.uf, null, null, null, x.n, id, x.nivel, ESTADUAIS[id][1], x]);
    })));
    return out;
  }
  const nomeUf = (uf) => (uf === "BR" ? t().est_br : A.ufNome(uf));
  const CARGOS = () => { const L = t(); return { 1: L.cd_pres, 3: L.cd_gov, 5: L.cd_sen, 6: L.cd_df, 7: L.cd_de }; };
  const analiseTxt = (x) => `${A.titulo(x.nome)} (${x.nr}) · ${CARGOS()[x.cargo] || x.cargo}`;
  // Medida e referência de cada análise, como na tabela do relatório
  function analiseValores(x) {
    const r = x.r;
    if (x.id === "T15") return [nf(r.secoes), `${nf(r.obs)} / ${A.dec(r.esp.toFixed(2))}`, r.razao == null ? "—" : A.dec(r.razao.toFixed(2))];
    return [nf(r.n), A.dec(r.chi2.toFixed(2)), A.dec(r.q.toPrecision(3))];
  }
  const chipAnalise = (x) => (x.nivel === "a" ? chip("red", t().lv_a) : x.nivel === "i" ? chip("amber", t().lv_i) : chip("green", t().est_ok));
  // Tabela com todas as análises (com e sem sinal) de um teste por estado
  function tabelaAnalises(ls, comTurno) {
    const L = t(), id = ls.length ? ls[0].id : "T13";
    const cab = (comTurno ? [L.x_round] : []).concat([L.th_uf, L.th_cand + " · " + L.th_cargo].concat(id === "T15" ? [L.th_sections, L.est_th_corner, L.gr_kl_raz] : ["n", "χ²", "q"]), [L.est_th_res]);
    return tabela(cab, ls.map((x) => (comTurno ? [x.n + "º"] : []).concat([x.uf === "BR" ? `<b>${esc(nomeUf("BR"))}</b>` : `<a href="#/uf/${x.uf}">${x.uf}</a>`, esc(analiseTxt(x))], analiseValores(x), [chipAnalise(x)])), "num-cols");
  }

  // --- cores sequenciais (5 classes: zero + 4 faixas por quantil dos valores positivos) ---------------------
  function classes(vals) {
    const pos = vals.filter((v) => v > 0).sort((a, b) => a - b);
    if (!pos.length) return { cls: () => 0, faixas: [] };
    const q = [0.25, 0.5, 0.75].map((p) => pos[Math.min(pos.length - 1, Math.floor(p * pos.length))]);
    const lim = [...new Set(q)].filter((x) => x < pos[pos.length - 1]);
    const cls = (v) => (v <= 0 ? 0 : 1 + lim.filter((x) => v > x).length);
    const faixas = [];
    let ini = pos[0];
    lim.forEach((x) => { faixas.push([ini, x]); ini = pos.find((v) => v > x); });
    faixas.push([ini, pos[pos.length - 1]]);
    return { cls, faixas };
  }
  function legendaSeq(faixas, fmt) {
    const L = t();
    return `<ul class="seq-leg"><li><span class="sw q0"></span>${esc(L.mp_zero)}</li>${faixas.map(([a, b], i) => `<li><span class="sw q${i + 1}"></span>${esc(a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`)}</li>`).join("")}</ul>`;
  }

  // --- gráficos SVG redesenhados na largura do contêiner --------------------------------------------------------
  const desenhos = new Map();
  let ro = null, obsG = null;
  const vistos = new Set(); // gráficos que já entraram na tela (não animam de novo ao mudar a largura)
  function grafico(id, fn) {
    desenhos.set(id, fn);
    return `<div class="chart" id="ch-${id}"></div>`;
  }
  // Ao entrar na tela (e a cada troca de filtro) as barras crescem e os números contam junto
  function pintar(el, html, animar) {
    el.innerHTML = html;
    if (!document.documentElement.classList.contains("anim") || !animar || !obsG) return;
    clearTimeout(el._fim);
    el.classList.remove("gr-in");
    el.classList.add("gr-anim");
    if (vistos.has(el.id)) { void el.offsetWidth; requestAnimationFrame(() => entrar(el)); } else obsG.observe(el);
  }
  function entrar(el) {
    vistos.add(el.id);
    el.classList.add("gr-in");
    $$("[data-n]", el).forEach(contarSvg);
    el._fim = setTimeout(() => el.classList.remove("gr-anim", "gr-in"), 2400);
  }
  function contarSvg(tx) {
    const alvo = Number(tx.dataset.n), d = Number(tx.dataset.d || 0), fim = tx.textContent;
    if (!(alvo > 0)) return;
    const atraso = Number(tx.dataset.atraso || 0), dur = 1000, t0 = performance.now() + atraso;
    const fmt = (x) => (d ? A.dec(x.toFixed(d)) : nf(Math.round(x)));
    tx.textContent = fmt(0);
    const passo = (agora) => {
      const k = Math.max(0, Math.min(1, (agora - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      tx.textContent = k < 1 ? fmt(alvo * e) : fim;
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }
  function desenharTodos() {
    if (ro) ro.disconnect();
    if (obsG) obsG.disconnect();
    obsG = "IntersectionObserver" in window ? new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { obsG.unobserve(en.target); entrar(en.target); }
    }), { rootMargin: "0px 0px -12% 0px" }) : null;
    ro = new ResizeObserver((ents) => ents.forEach((en) => {
      const id = en.target.id.slice(3), fn = desenhos.get(id), w = Math.round(en.contentRect.width);
      if (fn && w > 0 && en.target.dataset.w !== String(w)) { en.target.dataset.w = w; pintar(en.target, fn(w), !vistos.has(en.target.id)); }
    }));
    desenhos.forEach((fn, id) => { const el = document.getElementById("ch-" + id); if (el) ro.observe(el); });
  }
  function redesenhar(id) {
    const el = document.getElementById("ch-" + id), fn = desenhos.get(id);
    if (el && fn) pintar(el, fn(el.clientWidth || 600), true);
  }

  // Histograma de barras verticais. bins: [{v, rot, dica}]; linhas: [{i, rot}] (posição em índice de faixa)
  function histograma(w, o) {
    const h = o.h || 250, ml = 52, mr = 12, mt = 26, mb = 40, iw = w - ml - mr, ih = h - mt - mb;
    const vals = o.bins.map((b) => b.v);
    const ord = vals.slice().sort((a, b) => b - a);
    // barra muito maior que as outras é cortada para as demais aparecerem
    const corte = ord[0] > ord[1] * 6 && ord[1] > 0 ? ord[1] * 1.25 : null;
    const max = corte || ord[0] || 1;
    const bw = iw / o.bins.length, passo = Math.min(14, 700 / o.bins.length);
    const y = (v) => mt + ih - Math.min(ih, (v / max) * ih);
    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(o.titulo)}">`;
    for (let k = 0; k <= 4; k++) {
      const v = (max * k) / 4, yy = y(v);
      s += `<line class="gr-grid" x1="${ml}" x2="${w - mr}" y1="${yy}" y2="${yy}"/><text class="gr-ax" x="${ml - 6}" y="${yy + 4}" text-anchor="end">${esc(nf(Math.round(v)))}</text>`;
    }
    o.bins.forEach((b, i) => {
      const x = ml + i * bw, yy = y(b.v), alto = mt + ih - yy;
      const cortada = corte && b.v > corte;
      s += `<g class="gr-bin${b.foco ? " foco" : ""}" tabindex="-1" data-tip="${esc(b.dica)}" style="--t:${Math.round(i * passo)}ms"><rect class="gr-hit" x="${x}" y="${mt}" width="${bw}" height="${ih}"/>`;
      if (b.v > 0) s += `<rect class="gr-bar" x="${x + Math.min(1, bw * 0.15)}" y="${yy}" width="${Math.max(1, bw - Math.min(2, bw * 0.3))}" height="${Math.max(1, alto)}" rx="${Math.min(3, bw / 3)}"/>`;
      if (cortada) s += `<path class="gr-cut" d="M${x - 2} ${mt + 10}l${bw / 2 + 2} -5l${bw / 2 + 2} 5"/><text class="gr-val" x="${x + bw / 2}" y="${mt - 8}" text-anchor="${i > o.bins.length * 0.7 ? "end" : "middle"}" data-n="${b.v}" data-atraso="${Math.round(i * passo)}">${esc(nf(b.v))}</text>`;
      s += "</g>";
    });
    (o.linhas || []).forEach((l, k) => {
      const x = ml + l.i * bw;
      s += `<line class="gr-lim" x1="${x}" x2="${x}" y1="${mt - 4}" y2="${mt + ih}"/><text class="gr-lim-t" x="${x + (l.esq ? -5 : 5)}" y="${mt + 12 + k * 15}" text-anchor="${l.esq ? "end" : "start"}">${esc(l.rot)}</text>`;
    });
    o.bins.forEach((b, i) => { if (b.eixo != null) s += `<text class="gr-ax" x="${ml + i * bw}" y="${h - mb + 16}" text-anchor="middle">${esc(b.eixo)}</text>`; });
    s += `<line class="gr-base" x1="${ml}" x2="${w - mr}" y1="${mt + ih}" y2="${mt + ih}"/>`;
    if (o.eixoX) s += `<text class="gr-ax gr-ax-t" x="${ml + iw / 2}" y="${h - 6}" text-anchor="middle">${esc(o.eixoX)}</text>`;
    return s + "</svg>";
  }

  // Pontos em escala logarítmica (valores de q ou razão), uma linha por grupo
  function pontosLog(w, o) {
    const grupos = o.grupos, lh = 26, ml = Math.min(150, Math.max(70, w * 0.22)), mr = 16, mt = 30, mb = 34;
    const h = mt + grupos.length * lh + mb, iw = w - ml - mr;
    const [a, b] = o.dom, la = Math.log10(a), lb = Math.log10(b);
    const x = (v) => ml + ((Math.log10(Math.min(b, Math.max(a, v))) - la) / (lb - la)) * iw;
    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(o.titulo)}">`;
    for (let e = Math.ceil(la); e <= lb; e++) {
      const xx = x(10 ** e);
      s += `<line class="gr-grid" x1="${xx}" x2="${xx}" y1="${mt - 6}" y2="${h - mb}"/><text class="gr-ax" x="${xx}" y="${h - mb + 16}" text-anchor="middle">${esc(A.dec(String(10 ** e)))}</text>`;
    }
    const xl = x(o.limite);
    // rótulo da linha de corte: do lado que couber na largura
    const larg = o.rotLimite.length * 6.6, dir = o.acima ? xl + 5 + larg <= w : xl - 5 - larg < 0;
    s += `<rect class="gr-zone" x="${o.acima ? xl : ml}" y="${mt - 6}" width="${o.acima ? ml + iw - xl : xl - ml}" height="${grupos.length * lh + 6}"/>`;
    s += `<line class="gr-lim" x1="${xl}" x2="${xl}" y1="${mt - 12}" y2="${h - mb}"/><text class="gr-lim-t" x="${xl + (dir ? 5 : -5)}" y="${mt - 16}" text-anchor="${dir ? "start" : "end"}">${esc(o.rotLimite)}</text>`;
    grupos.forEach((g, i) => {
      const yy = mt + i * lh + lh / 2;
      s += `<text class="gr-ax gr-lab" x="${ml - 8}" y="${yy + 4}" text-anchor="end">${esc(g.rot)}</text><line class="gr-row" x1="${ml}" x2="${ml + iw}" y1="${yy}" y2="${yy}"/>`;
      g.pts.forEach((p, k) => {
        const dy = g.pts.length > 1 ? (k - (g.pts.length - 1) / 2) * 5 : 0;
        s += `<circle class="gr-pt${p.marca ? " marca" : ""} c${p.cor || 0}" cx="${x(p.v)}" cy="${yy + dy}" r="5" tabindex="-1" data-tip="${esc(p.dica)}" style="--t:${i * 45 + k * 90}ms"/>`;
      });
    });
    if (o.eixoX) s += `<text class="gr-ax gr-ax-t" x="${w / 2}" y="${h - 4}" text-anchor="middle">${esc(o.eixoX)}</text>`;
    return s + "</svg>";
  }

  // Barras horizontais empilhadas (anomalia + informativo)
  function barrasEmp(w, o) {
    const lh = 22, ml = 44, mr = 70, mt = 8, mb = 8, iw = w - ml - mr;
    const h = mt + o.linhas.length * lh + mb;
    const max = Math.max(...o.linhas.map((l) => l.a + l.i), 1e-9);
    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(o.titulo)}">`;
    o.linhas.forEach((l, i) => {
      const y = mt + i * lh, wa = (l.a / max) * iw, wi = (l.i / max) * iw, atraso = Math.min(i, 30) * 35;
      s += `<g class="gr-hrow" tabindex="-1" data-tip="${esc(l.dica)}" style="--t:${atraso}ms"><rect class="gr-hit" x="0" y="${y}" width="${w}" height="${lh}"/>
        <text class="gr-ax gr-lab" x="${ml - 8}" y="${y + lh / 2 + 4}" text-anchor="end">${esc(l.rot)}</text><g class="gr-hb" style="transform-origin:${ml}px ${y}px">`;
      if (wa > 0) s += `<rect class="gr-a" x="${ml}" y="${y + 4}" width="${Math.max(2, wa)}" height="${lh - 8}" rx="3"/>`;
      if (wi > 0) s += `<rect class="gr-i" x="${ml + wa + (wa > 0 ? 2 : 0)}" y="${y + 4}" width="${Math.max(2, wi)}" height="${lh - 8}" rx="3"/>`;
      s += `</g><text class="gr-ax gr-hv" x="${ml + wa + wi + 8}" y="${y + lh / 2 + 4}" style="--dx:${(wa + wi).toFixed(1)}px"${l.n != null ? ` data-n="${l.n}" data-d="${l.d || 0}" data-atraso="${atraso}"` : ""}>${esc(l.txt)}</text></g>`;
    });
    return s + "</svg>";
  }

  // ===================================================================================================
  // Mapa do Brasil
  // ===================================================================================================
  function medidaUf(oc, n, teste, nivel) {
    if (estadual(teste)) {
      // teste por estado: análises (candidato × cargo) com sinal, sobre o total de análises do estado
      const est = {};
      analisesEstado(n, teste).forEach((x) => { const e = (est[x.uf] = est[x.uf] || { k: 0, tot: 0 }); e.tot++; if (x.nivel && (!nivel || x.nivel === nivel)) e.k++; });
      return Object.fromEntries(ufsLista().concat("BR").map((uf) => { const e = est[uf] || { k: 0, tot: 0 }; return [uf, { k: e.k, tot: e.tot, v: e.k }]; }));
    }
    const sec = {};
    oc.forEach((r) => {
      if (String(r[4]) !== n || (teste && r[5] !== teste) || (nivel && r[6] !== nivel)) return;
      (sec[r[0]] = sec[r[0]] || new Set()).add(r[2] + "/" + r[3]);
    });
    return Object.fromEntries(ufsLista().map((uf) => { const tot = secoesUf(n, uf), k = sec[uf] ? sec[uf].size : 0; return [uf, { k, tot, v: tot ? k / tot : 0 }]; }));
  }

  const pgMapa = {
    ativo: "map",
    titulo: () => t().mp_title,
    html() {
      const L = t(), q = A.state.query;
      return `${cabecalho(L.mp_title, L.mp_sub, false)}
        <section class="card">
          <form class="filters" data-filtro="mapa">${seletor("t", L.x_round, opTurno(false), q.get("t") || "2")}${seletor("teste", L.x_test, opTeste(L.x_all_tests), q.get("teste") || "")}${seletor("nivel", L.x_level, opNivel(), q.has("nivel") ? q.get("nivel") : "a")}</form>
          <div class="map-wrap"><div class="map" id="mapa">${carregando()}</div><div class="map-side"><div id="mapa-leg"></div><p class="small muted" id="mapa-nota"></p></div></div>
          <div class="h-row"><span></span><button class="btn btn-sm btn-ghost" type="button" data-toggle-view="mp">${esc(L.show_table)}</button></div>
          <div data-view="mp-chart" hidden></div><div data-view="mp-table" hidden id="mapa-tab"></div>
        </section>
        <p class="small muted">${esc(L.mp_src)}</p>${A.botCta(true)}`;
    },
    async iniciar() {
      const L = t();
      let M, oc;
      try { [M, oc] = await Promise.all([dado("site/data/mapa.json"), ocorrencias()]); } catch (e) { $("#mapa").innerHTML = erroDados(e); return; }
      const f = $('form[data-filtro="mapa"]');
      const pinta = () => {
        const n = f.elements.t.value, teste = f.elements.teste.value, nivel = f.elements.nivel.value, est = estadual(teste);
        history.replaceState(null, "", `#/mapa?t=${n}${teste ? "&teste=" + teste : ""}&nivel=${nivel}`);
        const med = medidaUf(oc, n, teste, nivel);
        const { cls, faixas } = classes(ufsLista().map((uf) => med[uf].v));
        const fmt = est ? (v) => nf(v) : (v) => pct(v, 3);
        const tip = (m) => (est ? L.est_tip(nf(m.k), nf(m.tot)) : L.mp_tip(nf(m.k), nf(m.tot), fmt(m.v)));
        const dica = (uf) => `${A.ufNome(uf)} (${uf})\n${tip(med[uf])}\n${L.mp_click}`;
        const paths = Object.entries(M.uf).map(([uf, d]) => `<a href="#/uf/${uf}" class="mp-uf q${cls(med[uf].v)}" data-tip="${esc(dica(uf))}" aria-label="${esc(`${A.ufNome(uf)}: ${fmt(med[uf].v)}`)}"><path d="${d}"/></a>`).join("");
        const zz = med.ZZ;
        $("#mapa").innerHTML = `<svg viewBox="0 0 ${M.vb[0]} ${M.vb[1]}" role="group" aria-label="${esc(L.mp_title)}">${paths}</svg>
          <a href="#/uf/ZZ" class="mp-zz q${cls(zz.v)}" data-tip="${esc(dica("ZZ"))}"><span class="sw q${cls(zz.v)}"></span>${esc(A.ufNome("ZZ"))}: ${esc(fmt(zz.v))}</a>`;
        const nomeT = teste ? `${A.numTeste(teste)}. ${A.nomeTeste(teste)}` : L.x_all_tests, nomeN = nivel ? (nivel === "a" ? L.lv_a : L.lv_i) : L.x_all_lv;
        $("#mapa-leg").innerHTML = `<p class="small"><b>${esc(est ? L.est_leg(nomeT, nomeN) : L.mp_leg(nomeT, nomeN))}</b></p>` + legendaSeq(faixas, fmt)
          + (est ? `<p class="small est-br">${esc(L.est_br_tot(tip(med.BR)))}</p>` : "");
        $("#mapa-nota").innerHTML = est ? `${esc(L.est_note_map)} <a href="#/lista?t=${n}&teste=${teste}">${esc(L.est_see_all)}</a>` : `${esc(L.mp_note)} ${esc(L.mp_note_est)}`;
        const linhas = ufsLista().map((uf) => [uf, med[uf]]).sort((a, b) => b[1].v - a[1].v);
        $("#mapa-tab").innerHTML = tabela([L.th_uf, est ? L.est_th_an : L.th_sections, est ? L.est_th_k : L.mp_th_k].concat(est ? [] : ["%"]),
          linhas.map(([uf, m]) => [`<a href="#/uf/${uf}">${uf} – ${esc(A.ufNome(uf))}</a>`, nf(m.tot), nf(m.k)].concat(est ? [] : [fmt(m.v)])), "num-cols");
      };
      f.addEventListener("change", (e) => {
        // os testes por estado só geram um tipo (13 e 14: anomalia; 15: informativo): mostra os dois
        if (e.target.name === "teste" && estadual(e.target.value)) f.elements.nivel.value = "";
        pinta();
      });
      pinta();
    },
  };

  // ===================================================================================================
  // Estados e municípios
  // ===================================================================================================
  function somaVotos(ms) {
    // soma [aptos, comp, votos[]] de vários municípios para um turno
    const tot = { 1: null, 2: null };
    ms.forEach((m) => [1, 2].forEach((n) => {
      const x = m[n + 1]; if (!x) return;
      if (!tot[n]) tot[n] = [0, 0, x[2].map(() => 0)];
      tot[n][0] += x[0]; tot[n][1] += x[1]; x[2].forEach((v, i) => { tot[n][2][i] += v; });
    }));
    return tot;
  }
  function blocoVotos(n, tv) {
    const L = t(), ordem = R().ordem_votos[n];
    if (!tv) return `<p class="muted">${esc(L.lk_nodata)}</p>`;
    const nomes = {}; R().turnos[n].presidente.candidatos.forEach((c) => { nomes[c.nr] = c.nome; });
    const v = {}; ordem.forEach((nr, i) => { v[nr] = tv[2][i] || 0; });
    const cands = ordem.filter((nr) => nr !== "95" && nr !== "96" && v[nr] > 0).sort((a, b) => v[b] - v[a]);
    const val = cands.reduce((a, nr) => a + v[nr], 0) || 1;
    return `<p class="small muted">${esc(L.lk_comp)}: ${nf(tv[1])} / ${nf(tv[0])} ${esc(L.st_aptos.toLowerCase())} (${pct(tv[1] / tv[0], 1)})</p>`
      + A.barras(cands.slice(0, 6).map((nr) => ({ rotulo: `${A.titulo(nomes[nr])} (${nr})`, valor: v[nr], texto: `${nf(v[nr])} · ${pct(v[nr] / val)}`, dica: `${nf(v[nr])} · ${pct(v[nr] / val)} ${L.valid}\n${A.titulo(nomes[nr])} (${nr})` })),
        { nota: `${esc(L.blank)}: ${nf(v["95"] || 0)} · ${esc(L.null_)}: ${nf(v["96"] || 0)}` });
  }
  // Tabela dos 15 testes de um estado ou município. Testes 1 a 12: ocorrências nas seções do local;
  // testes 13 a 15: resultado do estado inteiro (análises candidato × cargo com sinal / total de análises).
  function testesLocal(oc, uf, noMun) {
    const L = t(), cont = {};
    oc.forEach((r) => { const k = r[5] + "/" + r[4]; cont[k] = cont[k] || [0, 0]; cont[k][r[6] === "a" ? 0 : 1]++; });
    const c = (x, extra) => chip(x[0] ? "red" : x[1] ? "amber" : "green", `${nf(x[0])} / ${nf(x[1])}`) + (extra ? ` <span class="small muted">${esc(extra)}</span>` : "");
    const linhas = testesTodos().map((id) => {
      const nome = `<a href="#/testes/${id}">${A.numTeste(id)}. ${esc(A.nomeTeste(id))}</a>`;
      if (!estadual(id)) return [nome, c(cont[id + "/1"] || [0, 0]), c(cont[id + "/2"] || [0, 0])];
      const res = (n) => {
        const ls = analisesEstado(n, id).filter((x) => x.uf === uf);
        return c([ls.filter((x) => x.nivel === "a").length, ls.filter((x) => x.nivel === "i").length], L.est_of(nf(ls.length)));
      };
      return [`${nome} <a class="tag" href="#/lista?uf=${uf}&teste=${id}" data-tip="${esc(L.est_tag_tip)}">${esc(noMun ? L.est_tag_uf(uf) : L.est_tag)}</a>`, res("1"), res("2")];
    });
    return tabela([L.th_test, `${L.round(1)} (${L.th_anom} / ${L.th_info})`, `${L.round(2)} (${L.th_anom} / ${L.th_info})`], linhas)
      + `<p class="small muted">${esc(noMun ? L.est_note_mun : L.est_note_uf)}</p>`;
  }

  function paginaUfIndice() {
    const L = t();
    return `${cabecalho(L.uf_title, L.uf_sub, false)}<section id="uf-idx">${carregando()}</section>${A.botCta(true)}`;
  }
  async function iniciarUfIndice() {
    const L = t(), oc = await ocorrencias().catch(() => null);
    if (!oc) { $("#uf-idx").innerHTML = erroDados(new Error("ocorrencias.json")); return; }
    const m1 = medidaUf(oc, "1", "", "a"), m2 = medidaUf(oc, "2", "", "a");
    $("#uf-idx").innerHTML = `<div class="uf-grid">${ufsLista().map((uf) => `<a class="uf-card spot" href="#/uf/${uf}"><span class="uf-sig">${uf}</span><span class="uf-nm">${esc(A.ufNome(uf))}</span>
      <span class="uf-n">${esc(L.uf_card(nf(m2[uf].tot), nf(m2[uf].k), nf(m1[uf].k)))}</span></a>`).join("")}</div>`;
  }

  function paginaUf(uf) {
    const L = t();
    return `<header class="page-head"><p class="kicker">${esc(L.uf_kicker)}</p><h1>${esc(A.ufNome(uf))} (${uf})</h1>${A.acoes(true)}</header><div id="uf-body" class="pg-body">${carregando()}</div>${A.botCta(true)}`;
  }
  async function iniciarUf(uf) {
    const L = t();
    let U, oc, muns;
    try { [U, oc, muns] = await Promise.all([dado(`site/data/ufs/${uf}.json`), ocorrencias(), A.municipios()]); } catch (e) { $("#uf-body").innerHTML = erroDados(e); return; }
    const nm = muns[uf] || {};
    const ocUf = oc.filter((r) => r[0] === uf);
    const tot = somaVotos(Object.values(U.m));
    const sec = Object.values(U.m).reduce((a, m) => a + m[0], 0);
    const anom = (n, f) => new Set(ocUf.filter((r) => String(r[4]) === n && r[6] === "a" && (!f || f(r))).map((r) => r[2] + "/" + r[3])).size;
    const a1 = anom("1"), a2 = anom("2");
    A.state.cartao = { kicker: L.uf_kicker, titulo: `${A.ufNome(uf)} (${uf})`, linhas: [[L.st_secoes, nf(sec)], [L.uf_muns, nf(Object.keys(U.m).length)],
      [`${L.r_flagged} · ${L.round(1)}`, nf(a1)], [`${L.r_flagged} · ${L.round(2)}`, nf(a2)]].concat(tot[2] ? [[L.st_aptos, nf(tot[2][0])], [L.st_comp, `${nf(tot[2][1])} (${pct(tot[2][1] / tot[2][0])})`]] : []) };
    // municípios
    const linhasMun = Object.entries(U.m).map(([cod, m]) => {
      const o = ocUf.filter((r) => r[1] === cod);
      const k1 = new Set(o.filter((r) => r[4] === 1 && r[6] === "a").map((r) => r[2] + "/" + r[3])).size;
      const k2 = new Set(o.filter((r) => r[4] === 2 && r[6] === "a").map((r) => r[2] + "/" + r[3])).size;
      return { cod, nome: A.titulo((nm[cod] || [cod])[0]), sec: m[0], k1, k2, oc: o.length };
    });
    $("#uf-body").innerHTML = `
      <div class="tiles">${A.tile(sec, L.st_secoes, L.uf_tip_sec, "grid")}${A.tile(Object.keys(U.m).length, L.uf_muns, L.uf_tip_mun, "pin")}
        ${A.tile(a1, `${L.r_flagged} · ${L.round(1)}`, L.tip_sinal, "flag", `(${pct(a1 / (secoesUf("1", uf) || 1))})`)}${A.tile(a2, `${L.r_flagged} · ${L.round(2)}`, L.tip_sinal, "flag", `(${pct(a2 / (secoesUf("2", uf) || 1))})`)}</div>
      <section class="grid2"><div class="card"><h2>${esc(L.round(2))} · ${esc(L.cd_pres)}</h2>${blocoVotos(2, tot[2])}</div><div class="card"><h2>${esc(L.round(1))} · ${esc(L.cd_pres)}</h2>${blocoVotos(1, tot[1])}</div></section>
      ${uf === "ZZ" ? "" : `<section class="card"><div class="h-row"><h2>${esc(L.uf_map_title)}</h2><form class="filters inline" data-filtro="ufmapa">${seletor("t", L.x_round, opTurno(false), "2")}</form></div>
        <p class="small muted">${esc(L.uf_map_sub)}</p><div class="map-wrap"><div class="map map-uf" id="uf-mapa">${carregando()}</div><div class="map-side" id="uf-mapa-leg"></div></div></section>`}
      <section><h2>${esc(L.uf_tests_title)}</h2><p class="small muted">${esc(L.uf_tests_sub)}</p>${testesLocal(ocUf, uf, false)}
        <p class="btn-row"><a class="btn btn-sm" href="#/lista?uf=${uf}">${icone("list")} ${esc(L.uf_see_list)}</a><a class="btn btn-sm btn-ghost" href="#/secao/${uf}">${icone("search")} ${esc(L.cta_lookup)}</a></p></section>
      <section><div class="h-row"><h2>${esc(L.uf_mun_title)}</h2><label class="mini-search">${icone("search")}<input type="search" id="mun-q" placeholder="${esc(L.uf_mun_ph)}" aria-label="${esc(L.uf_mun_ph)}"></label></div>
        <div id="mun-tab"></div></section>`;
    const tab = (filtro) => {
      const nz = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const ls = linhasMun.filter((m) => !filtro || nz(m.nome).includes(nz(filtro))).sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
      $("#mun-tab").innerHTML = tabela([L.th_mun, L.th_sections, `${L.th_flagged} · ${L.round(1)}`, `${L.th_flagged} · ${L.round(2)}`, L.uf_th_oc],
        ls.map((m) => [`<a href="#/uf/${uf}/${m.cod}">${esc(m.nome)}</a>`, nf(m.sec), nf(m.k1), nf(m.k2), nf(m.oc)]), "num-cols");
    };
    tab("");
    $("#mun-q").addEventListener("input", (e) => tab(e.target.value.trim()));
    A.efeitos($("#uf-body"));
    if (uf === "ZZ") return;
    let MP;
    try { MP = await dado(`site/data/mapas/${uf}.json`); } catch (e) { $("#uf-mapa").innerHTML = erroDados(e); return; }
    const f = $('form[data-filtro="ufmapa"]');
    const pinta = () => {
      const n = +f.elements.t.value;
      const val = {}; linhasMun.forEach((m) => { val[m.cod] = m.sec ? (n === 1 ? m.k1 : m.k2) / m.sec : 0; });
      const { cls, faixas } = classes(Object.values(val));
      const fmt = (v) => pct(v, 2);
      $("#uf-mapa").innerHTML = `<svg viewBox="0 0 ${MP.vb[0]} ${MP.vb[1]}" role="group" aria-label="${esc(L.uf_map_title)}">${Object.entries(MP.m).map(([cod, d]) => {
        const m = linhasMun.find((x) => x.cod === cod);
        if (!m) return "";
        return `<a href="#/uf/${uf}/${cod}" class="mp-uf q${cls(val[cod])}" data-tip="${esc(`${m.nome}\n${L.mp_tip(nf(n === 1 ? m.k1 : m.k2), nf(m.sec), fmt(val[cod]))}`)}" aria-label="${esc(m.nome)}"><path d="${d}"/></a>`;
      }).join("")}</svg>`;
      $("#uf-mapa-leg").innerHTML = `<p class="small"><b>${esc(L.uf_map_leg)}</b></p>${legendaSeq(faixas, fmt)}<p class="small muted">${esc(L.uf_map_note)}</p>`;
    };
    f.addEventListener("change", pinta);
    pinta();
  }

  function paginaMun(uf, cod) {
    return `<div id="mun-body" class="pg-body">${carregando()}</div>${A.botCta(true)}`;
  }
  async function iniciarMun(uf, cod) {
    const L = t();
    let U, oc, muns;
    try { [U, oc, muns] = await Promise.all([dado(`site/data/ufs/${uf}.json`), ocorrencias(), A.municipios()]); } catch (e) { $("#mun-body").innerHTML = erroDados(e); return; }
    const m = U.m[cod];
    if (!m) { $("#mun-body").innerHTML = `<p class="alert">${esc(L.mu_none)}</p><p><a href="#/uf/${uf}">${esc(A.ufNome(uf) || uf)}</a></p>`; return; }
    const nome = A.titulo(((muns[uf] || {})[cod] || [cod])[0]);
    document.title = `${nome} (${uf}) · ${L.brand}`;
    const ocM = oc.filter((r) => r[0] === uf && r[1] === cod);
    const k = (n) => new Set(ocM.filter((r) => r[4] === n && r[6] === "a").map((r) => r[2] + "/" + r[3])).size;
    const tot = somaVotos([m]);
    A.state.cartao = { kicker: `${A.ufNome(uf)} (${uf})`, titulo: nome, linhas: [[L.st_secoes, nf(m[0])], [L.mu_zones, m[1].join(", ")], [`${L.r_flagged} · ${L.round(1)}`, nf(k(1))], [`${L.r_flagged} · ${L.round(2)}`, nf(k(2))]]
      .concat(tot[2] ? [[L.st_aptos, nf(tot[2][0])], [L.st_comp, `${nf(tot[2][1])} (${pct(tot[2][1] / tot[2][0])})`]] : []) };
    const linhasOc = ocM.slice().sort((a, b) => a[4] - b[4] || a[2] - b[2] || a[3] - b[3]).map((r) => [A.t().round(r[4]), r[2], `<a href="#/secao/${uf}/${r[2]}/${r[3]}">${r[3]}</a>`,
      `<a href="#/testes/${r[5]}">${A.numTeste(r[5])}. ${esc(A.nomeTeste(r[5]))}</a>`, chip(r[6] === "a" ? "red" : "amber", r[6] === "a" ? L.lv_a : L.lv_i), esc(nomeCat(r[7]))]);
    $("#mun-body").innerHTML = `<header class="page-head"><p class="kicker"><a href="#/uf/${uf}">${esc(A.ufNome(uf))} (${uf})</a></p><h1>${esc(nome)}</h1>${A.acoes(true)}</header>
      <div class="tiles">${A.tile(m[0], L.st_secoes, L.uf_tip_sec, "grid")}${A.tile(m[1].length, L.mu_zones, m[1].join(", "), "pin")}
        ${A.tile(k(1), `${L.r_flagged} · ${L.round(1)}`, L.tip_sinal, "flag")}${A.tile(k(2), `${L.r_flagged} · ${L.round(2)}`, L.tip_sinal, "flag")}</div>
      <section class="grid2"><div class="card"><h2>${esc(L.round(2))} · ${esc(L.cd_pres)}</h2>${blocoVotos(2, tot[2])}</div><div class="card"><h2>${esc(L.round(1))} · ${esc(L.cd_pres)}</h2>${blocoVotos(1, tot[1])}</div></section>
      <section><h2>${esc(L.mu_tests_title)}</h2><p class="small muted">${esc(L.mu_tests_sub)}</p>${testesLocal(ocM, uf, true)}</section>
      <section><h2>${esc(L.mu_oc_title)}</h2>${linhasOc.length ? tabela([L.x_round, L.th_zone, L.th_section, L.th_test, "", L.li_cat], linhasOc) : `<p>${chip("green", L.mu_oc_none)}</p>`}</section>
      <section><div class="h-row"><h2>${esc(L.mu_sec_title)}</h2><button class="btn btn-sm" type="button" id="mu-load">${icone("list")} ${esc(L.mu_sec_btn(nf(m[0])))}</button></div><div id="mu-secs"></div></section>`;
    A.efeitos($("#mun-body"));
    $("#mu-load").addEventListener("click", async (e) => {
      e.currentTarget.disabled = true;
      $("#mu-secs").innerHTML = carregando();
      const zs = await Promise.all(m[1].map((z) => A.zona(uf, z).then((Z) => [z, Z])));
      const linhas = [];
      zs.forEach(([z, Z]) => {
        if (!Z) return;
        const idx = Z.mun.findIndex((x) => x[0] === cod);
        Object.entries(Z.s).forEach(([s, rec]) => {
          if (rec[0] !== idx) return;
          const fl = rec[3] || {}, nfl = (n) => (fl[n] ? fl[n].o.length : 0);
          linhas.push([z, +s, rec[2] ? rec[2][0] : rec[1] ? rec[1][0] : 0, nfl("1"), nfl("2")]);
        });
      });
      linhas.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      paginar($("#mu-secs"), linhas, 100, (ls) => tabela([L.th_zone, L.th_section, L.lk_aptos, `${L.mu_th_oc} · ${L.round(1)}`, `${L.mu_th_oc} · ${L.round(2)}`],
        ls.map((r) => [r[0], `<a href="#/secao/${uf}/${r[0]}/${r[1]}">${r[1]}</a>`, nf(r[2]), r[3] ? chip("amber", nf(r[3])) : "0", r[4] ? chip("amber", nf(r[4])) : "0"]), "num-cols"));
    });
  }

  // Paginação simples de uma tabela
  function paginar(box, linhas, porPag, montar, aoMudar) {
    const L = t();
    let pag = 0;
    const total = Math.max(1, Math.ceil(linhas.length / porPag));
    const desenhar = () => {
      const nav = total > 1 ? `<nav class="pager" aria-label="${esc(L.pg_nav)}"><button class="btn btn-sm" type="button" data-p="${pag - 1}"${pag ? "" : " disabled"}>‹ ${esc(L.pg_prev)}</button>
        <span>${esc(L.pg_of(pag + 1, total))}</span><button class="btn btn-sm" type="button" data-p="${pag + 1}"${pag < total - 1 ? "" : " disabled"}>${esc(L.pg_next)} ›</button></nav>` : "";
      box.innerHTML = montar(linhas.slice(pag * porPag, (pag + 1) * porPag)) + nav;
    };
    box.onclick = (e) => {
      const b = e.target.closest("[data-p]"); if (!b) return;
      pag = Math.max(0, Math.min(total - 1, +b.dataset.p)); desenhar();
      if (aoMudar) aoMudar(pag);
      box.scrollIntoView({ block: "start", behavior: "smooth" });
    };
    desenhar();
  }

  const pgUf = {
    ativo: "states",
    titulo: (p) => (p[1] && window.UF_NOMES[p[1].toUpperCase()] ? `${A.ufNome(p[1].toUpperCase())}` : t().uf_title),
    html: (p) => {
      const uf = (p[1] || "").toUpperCase();
      if (!window.UF_NOMES[uf]) return paginaUfIndice();
      return p[2] ? paginaMun(uf, p[2]) : paginaUf(uf);
    },
    iniciar: (p) => {
      const uf = (p[1] || "").toUpperCase();
      if (!window.UF_NOMES[uf]) return iniciarUfIndice();
      return p[2] ? iniciarMun(uf, p[2]) : iniciarUf(uf);
    },
  };

  // ===================================================================================================
  // Lista de ocorrências com filtros e CSV
  // ===================================================================================================
  const pgLista = {
    ativo: "list",
    titulo: () => t().li_title,
    html() {
      const L = t(), q = A.state.query;
      const ufs = [["", L.x_all_ufs]].concat(ufsLista().map((u) => [u, `${u} – ${A.ufNome(u)}`]));
      return `${cabecalho(L.li_title, L.li_sub, false)}
        <section class="card"><form class="filters" data-filtro="lista">
          ${seletor("t", L.x_round, opTurno(true), q.get("t") || "")}${seletor("uf", L.th_uf, ufs, (q.get("uf") || "").toUpperCase())}
          <label><span>${esc(L.th_mun)}</span><select name="mun"><option value="">${esc(L.lk_mun_all)}</option></select></label>
          <label><span>${esc(L.th_zone)}</span><input name="z" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="${esc(q.get("z") || "")}"></label>
          ${seletor("teste", L.x_test, opTeste(L.x_all_tests), q.get("teste") || "")}${seletor("nivel", L.x_level, opNivel(), q.get("nivel") || "")}
          <button class="btn btn-sm btn-ghost" type="reset">${esc(L.li_clear)}</button>
        </form></section>
        <div class="h-row li-head"><p id="li-res" class="li-res" aria-live="polite"></p><button class="btn btn-sm" type="button" id="li-csv">${icone("download")} ${esc(L.li_csv)}</button></div>
        <div id="li-tab">${carregando()}</div><div id="li-est"></div>
        <p class="small muted">${esc(L.li_note)}</p>${A.botCta(true)}`;
    },
    async iniciar() {
      const L = t(), q = A.state.query;
      let oc, muns;
      try { [oc, muns] = await Promise.all([ocorrencias(), A.municipios()]); } catch (e) { $("#li-tab").innerHTML = erroDados(e); return; }
      // seções (testes 1 a 12) + resultados por estado com sinal (testes 13 a 15), como em secoes_sinalizadas.csv
      oc = oc.concat(ocorrenciasEstado());
      const f = $('form[data-filtro="lista"]');
      let ord = { k: q.get("ord") || "", d: 1 }, filtradas = [];
      const nomeMun = (uf, cod) => (cod == null ? "" : A.titulo(((muns[uf] || {})[cod] || [cod])[0]));
      const cat = (r) => nomeCat(r[7]) + (r[8] ? ` · ${analiseTxt(r[8])}` : "");
      const num = (x) => (x == null ? -1 : x);
      const encherMun = (sel) => {
        const m = muns[f.elements.uf.value] || {};
        f.elements.mun.innerHTML = `<option value="">${esc(L.lk_mun_all)}</option>` + Object.entries(m).sort((a, b) => a[1][0].localeCompare(b[1][0], "pt"))
          .map(([cod, [nm]]) => `<option value="${cod}"${cod === sel ? " selected" : ""}>${esc(A.titulo(nm))}</option>`).join("");
        f.elements.mun.disabled = !f.elements.uf.value;
      };
      encherMun(q.get("mun") || "");
      const COLS = [["t", L.x_round, (r) => r[4]], ["uf", L.th_uf, (r) => r[0]], ["mun", L.th_mun, (r) => nomeMun(r[0], r[1])], ["z", L.th_zone, (r) => num(r[2])], ["s", L.th_section, (r) => num(r[3])],
        ["teste", L.th_test, (r) => r[5]], ["nivel", L.x_level, (r) => r[6]], ["cat", L.li_cat, cat]];
      const aplicar = () => {
        const v = Object.fromEntries(["t", "uf", "mun", "z", "teste", "nivel"].map((k) => [k, f.elements[k].value.trim()]));
        const qs = Object.entries(v).filter(([, x]) => x).map(([k, x]) => `${k}=${encodeURIComponent(x)}`).join("&");
        history.replaceState(null, "", "#/lista" + (qs ? "?" + qs : ""));
        filtradas = oc.filter((r) => (!v.t || String(r[4]) === v.t) && (!v.uf || r[0] === v.uf) && (!v.mun || r[1] === v.mun) && (!v.z || String(r[2]) === String(parseInt(v.z, 10)))
          && (!v.teste || r[5] === v.teste) && (!v.nivel || r[6] === v.nivel));
        // teste por estado escolhido: todas as análises do teste (com e sem sinal), por turno e estado
        const ae = estadual(v.teste) ? ["1", "2"].filter((n) => !v.t || n === v.t).flatMap((n) => analisesEstado(n, v.teste)).filter((x) => !v.uf || x.uf === v.uf) : [];
        $("#li-est").innerHTML = ae.length ? `<section class="card li-est"><h2>${esc(L.est_all_title(A.numTeste(v.teste), A.nomeTeste(v.teste)))}</h2>
          <p class="small muted">${esc(L.est_all_sub)} <a href="#/graficos/${v.teste}">${esc(L.est_see_chart)}</a></p>${tabelaAnalises(ae, true)}</section>` : "";
        if (ord.k) {
          const get = COLS.find((c) => c[0] === ord.k)[2];
          filtradas = filtradas.slice().sort((a, b) => { const x = get(a), y = get(b); return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "pt")) * ord.d; });
        }
        const deSecao = filtradas.filter((r) => r[3] != null);
        const secs = new Set(deSecao.map((r) => r[4] + r[0] + r[2] + "/" + r[3])).size;
        const nEst = filtradas.length - deSecao.length;
        $("#li-res").innerHTML = !deSecao.length && nEst ? L.li_res_so_est(nf(nEst)) : L.li_res(nf(deSecao.length), nf(secs)) + (nEst ? L.li_res_est(nf(nEst)) : "");
        $("#li-csv").disabled = !filtradas.length;
        paginar($("#li-tab"), filtradas, 50, (ls) => {
          const cab = COLS.map(([k, nm]) => `<button type="button" class="th-sort" data-ord="${k}" aria-label="${esc(L.li_sort(nm))}">${esc(nm)}${ord.k === k ? (ord.d > 0 ? " ▲" : " ▼") : ""}</button>`);
          return ls.length ? tabela(cab, ls.map((r) => [r[4] + "º", r[0]].concat(r[3] == null
            ? [`<span class="muted">${esc(r[0] === "BR" ? L.est_whole_br : L.est_whole)}</span>`, "—", "—"]
            : [`<a href="#/uf/${r[0]}/${r[1]}">${esc(nomeMun(r[0], r[1]))}</a>`, r[2], `<a href="#/secao/${r[0]}/${r[2]}/${r[3]}">${r[3]}</a>`],
            [`<a href="#/testes/${r[5]}" data-tip="${esc(A.nomeTeste(r[5]))}">${A.numTeste(r[5])}</a>`, chip(r[6] === "a" ? "red" : "amber", r[6] === "a" ? L.lv_a : L.lv_i), esc(cat(r))])), "li-table")
            : `<p class="alert">${esc(estadual(v.teste) ? L.est_none(A.numTeste(v.teste)) : L.li_none)}</p>`;
        });
      };
      f.addEventListener("change", (e) => { if (e.target.name === "uf") encherMun(""); aplicar(); });
      f.addEventListener("input", (e) => { if (e.target.name === "z") aplicar(); });
      f.addEventListener("reset", () => setTimeout(() => { encherMun(""); aplicar(); }, 0));
      f.addEventListener("submit", (e) => e.preventDefault());
      $("#li-tab").addEventListener("click", (e) => {
        const b = e.target.closest("[data-ord]"); if (!b) return;
        ord = ord.k === b.dataset.ord ? { k: ord.k, d: -ord.d } : { k: b.dataset.ord, d: 1 };
        aplicar();
      });
      $("#li-csv").addEventListener("click", () => {
        const cab = ["turno", "uf", "municipio", "codigo_municipio_tse", "zona", "secao", "teste", "nome_teste", "nivel", "categoria", "detalhe"];
        const q2 = (x) => `"${String(x).replace(/"/g, '""')}"`;
        const linhas = filtradas.map((r) => [r[4], r[0], nomeMun(r[0], r[1]), r[1] ?? "", r[2] ?? "", r[3] ?? "", r[5], A.nomeTeste(r[5]), r[6] === "a" ? L.lv_a : L.lv_i, nomeCat(r[7]), r[8] ? analiseTxt(r[8]) : ""].map(q2).join(";"));
        const blob = new Blob(["﻿" + [cab.join(";")].concat(linhas).join("\r\n")], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ocorrencias_filtradas.csv";
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      });
      aplicar();
    },
  };

  // ===================================================================================================
  // Gráficos dos testes
  // ===================================================================================================
  const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

  const pgGraficos = {
    ativo: "charts",
    titulo: () => t().gr_title,
    html() {
      const L = t();
      desenhos.clear();
      vistos.clear();
      const bloco = (id, tit, sub, controles, extra) => `<section class="card gr-card" id="g-${id}"><div class="h-row"><h2>${esc(tit)}</h2>${controles || ""}</div>
        <p class="small muted">${sub}</p><div data-view="${id}-chart">${grafico(id, () => "")}</div><div data-view="${id}-table" hidden id="tab-${id}"></div>
        <div class="h-row"><p class="small muted gr-src">${esc(extra || "")}</p><button class="btn btn-sm btn-ghost" type="button" data-toggle-view="${id}">${esc(L.show_table)}</button></div></section>`;
      const ft = (nome, ops) => `<form class="filters inline" data-g="${nome}">${ops}</form>`;
      const indice = [["oc", L.gr_oc_title], ["T11", L.gr_ab_title], ["T04", L.gr_cp_title], ["T03", L.gr_ld_title], ["T13", L.gr_dg_title], ["T15", L.gr_kl_title]];
      return `${cabecalho(L.gr_title, L.gr_sub, false)}
        <nav class="gr-idx" aria-label="${esc(L.gr_title)}">${indice.map(([id, nm]) => `<a class="chipq" href="#/graficos/${id}">${esc(nm)}</a>`).join("")}</nav>
        <p class="note small">${esc(L.gr_note)}</p>
        ${bloco("oc", L.gr_oc_title, esc(L.gr_oc_sub), ft("oc", seletor("t", L.x_round, opTurno(false), "2") + seletor("teste", L.x_test, opTeste(L.x_all_tests), "") + seletor("m", L.gr_measure, [["n", L.gr_m_n], ["r", L.gr_m_r]], "r")), L.gr_src_oc)}
        ${bloco("T11", L.gr_ab_title, esc(L.gr_ab_sub), ft("T11", seletor("t", L.x_round, opTurno(false), "2")), L.gr_src_sec)}
        ${bloco("T04", L.gr_cp_title, esc(L.gr_cp_sub), ft("T04", seletor("t", L.x_round, opTurno(false), "2")), L.gr_src_sec)}
        ${bloco("T03", L.gr_ld_title, esc(L.gr_ld_sub), ft("T03", seletor("t", L.x_round, opTurno(false), "2")), L.gr_src_sec)}
        ${bloco("T13", L.gr_dg_title, esc(L.gr_dg_sub), ft("T13", seletor("t", L.x_round, opTurno(false), "2") + seletor("teste", L.x_test, [["T13", `13. ${A.nomeTeste("T13")}`], ["T14", `14. ${A.nomeTeste("T14")}`]], "T13")), L.gr_src_res)}
        ${bloco("T15", L.gr_kl_title, esc(L.gr_kl_sub), ft("T15", seletor("t", L.x_round, opTurno(false), "2")), L.gr_src_res)}
        ${A.botCta(true)}`;
    },
    async iniciar(p) {
      const L = t();
      let G, oc;
      try { [G, oc] = await Promise.all([dado("site/data/graficos.json"), ocorrencias()]); } catch (e) { $("#ch-oc").innerHTML = erroDados(e); return; }
      const val = (nome, campo) => $(`form[data-g="${nome}"]`).elements[campo].value;
      const tabelaEm = (id, cab, linhas) => { $("#tab-" + id).innerHTML = tabela(cab, linhas, "num-cols"); };

      const ocEst = ocorrenciasEstado();
      desenhos.set("oc", (w) => {
        const n = val("oc", "t"), teste = val("oc", "teste"), est = estadual(teste);
        // teste por estado: conta análises (candidato × cargo) com sinal; "a cada 1.000 seções" não se aplica
        const selM = $('form[data-g="oc"]').elements.m;
        selM.disabled = est;
        const porMil = !est && selM.value === "r";
        const cont = {}, soma = (uf, nivel) => { cont[uf] = cont[uf] || { a: 0, i: 0 }; cont[uf][nivel === "a" ? "a" : "i"]++; };
        if (!est) oc.forEach((r) => { if (String(r[4]) === n && (!teste || r[5] === teste)) soma(r[0], r[6]); });
        // resultados por estado com sinal (testes 13 a 15); o agregado nacional (BR) vai na nota
        ocEst.forEach((r) => { if (String(r[4]) === n && (!teste || r[5] === teste) && r[0] !== "BR") soma(r[0], r[6]); });
        const an = {};
        if (est) analisesEstado(n, teste).forEach((x) => { an[x.uf] = (an[x.uf] || 0) + 1; });
        const linhas = ufsLista().map((uf) => {
          const c = cont[uf] || { a: 0, i: 0 }, sec = secoesUf(n, uf) || 1, k = porMil ? 1000 / sec : 1;
          const fmt = (x) => (porMil ? A.dec((x * k).toFixed(2)) : nf(x));
          const dica = est ? `${A.ufNome(uf)} (${uf})\n${L.est_tip(nf(c.a + c.i), nf(an[uf] || 0))}`
            : `${A.ufNome(uf)} (${uf})\n${L.lv_a}: ${nf(c.a)} · ${L.lv_i}: ${nf(c.i)}\n${L.gr_per1000}: ${A.dec(((c.a + c.i) * 1000 / sec).toFixed(2))}`;
          return { rot: uf, a: c.a * k, i: c.i * k, txt: fmt(c.a + c.i), n: (c.a + c.i) * k, d: porMil ? 2 : 0, dica, c, sec };
        }).sort((x, y) => y.a + y.i - (x.a + x.i) || x.rot.localeCompare(y.rot));
        if (est) {
          tabelaEm("oc", [L.th_uf, L.est_th_an, L.lv_a, L.lv_i], linhas.map((l) => [`${l.rot} – ${esc(A.ufNome(l.rot))}`, nf(an[l.rot] || 0), nf(l.c.a), nf(l.c.i)]));
        } else {
          tabelaEm("oc", [L.th_uf, L.th_sections, L.lv_a, L.lv_i, L.gr_per1000], linhas.map((l) => [`${l.rot} – ${esc(A.ufNome(l.rot))}`, nf(l.sec), nf(l.c.a), nf(l.c.i), A.dec(((l.c.a + l.c.i) * 1000 / l.sec).toFixed(2))]));
        }
        const br = ocEst.filter((r) => String(r[4]) === n && (!teste || r[5] === teste) && r[0] === "BR").length;
        const nota = est ? L.est_note_chart(nf(br), nf(an.BR || 0)) : !teste && br ? L.est_note_all(nf(br)) : "";
        return `<ul class="legend inline gr-leg"><li>${chip("red", L.lv_a)}</li><li>${chip("amber", L.lv_i)}</li></ul>`
          + (nota ? `<p class="small muted gr-nota">${esc(nota)}</p>` : "") + barrasEmp(w, { titulo: L.gr_oc_title, linhas });
      });

      desenhos.set("T11", (w) => {
        const H = G[val("T11", "t")].abre;
        const bins = H.b.map((v, i) => { const m = H.ini + i * H.passo; return { v, eixo: m % 60 === 0 ? hhmm(m) : null, dica: `${hhmm(m)}–${hhmm(m + H.passo - 1)}\n${L.gr_n_sec(nf(v))}`, foco: m >= 9 * 60 }; });
        const pos = (min) => (min - H.ini) / H.passo;
        tabelaEm("T11", [L.gr_th_range, L.th_sections], H.b.map((v, i) => [v, i]).filter(([v]) => v > 0).map(([v, i]) => [`${hhmm(H.ini + i * H.passo)}–${hhmm(H.ini + (i + 1) * H.passo - 1)}`, nf(v)])
          .concat(H.antes ? [[`< ${hhmm(H.ini)}`, nf(H.antes)]] : []).concat(H.depois ? [[`≥ ${hhmm(H.ini + H.b.length * H.passo)}`, nf(H.depois)]] : []));
        return histograma(w, { titulo: L.gr_ab_title, bins, linhas: [{ i: pos(8 * 60), rot: L.gr_ab_l1, esq: true }, { i: pos(9 * 60), rot: L.gr_ab_l2 }], eixoX: L.gr_ab_x });
      });

      desenhos.set("T04", (w) => {
        const c = G[val("T04", "t")].comp;
        const ini = 30;
        const bins = [{ v: c.slice(0, ini).reduce((a, b) => a + b, 0), eixo: `<${ini}%`, dica: `< ${ini}%\n${L.gr_n_sec(nf(c.slice(0, ini).reduce((a, b) => a + b, 0)))}` }]
          .concat(c.slice(ini).map((v, i) => ({ v, eixo: (ini + i) % 10 === 0 ? `${ini + i}%` : null, foco: ini + i === 100, dica: `${ini + i === 100 ? "100%" : `${ini + i}% – ${ini + i + 1}%`}\n${L.gr_n_sec(nf(v))}` })));
        tabelaEm("T04", [L.gr_th_range, L.th_sections], bins.filter((b) => b.v).map((b) => [esc(b.dica.split("\n")[0]), nf(b.v)]));
        return histograma(w, { titulo: L.gr_cp_title, bins, linhas: [{ i: bins.length - 1, rot: L.gr_cp_l, esq: true }], eixoX: L.gr_cp_x });
      });

      desenhos.set("T03", (w) => {
        const c = G[val("T03", "t")].lider;
        const ini = Math.max(0, c.findIndex((v) => v > 0));
        const bins = c.slice(ini).map((v, i) => ({ v, eixo: (ini + i) % 10 === 0 ? `${ini + i}%` : null, foco: ini + i === 100, dica: `${ini + i === 100 ? "100%" : `${ini + i}% – ${ini + i + 1}%`}\n${L.gr_n_sec(nf(v))}` }));
        tabelaEm("T03", [L.gr_th_range, L.th_sections], bins.filter((b) => b.v).map((b) => [esc(b.dica.split("\n")[0]), nf(b.v)]));
        return histograma(w, { titulo: L.gr_ld_title, bins, linhas: [{ i: bins.length - 1, rot: L.gr_ld_l, esq: true }], eixoX: L.gr_ld_x });
      });

      const CARGO = { 1: L.cd_pres, 3: L.cd_gov, 5: L.cd_sen, 6: L.cd_df, 7: L.cd_de };
      desenhos.set("T13", (w) => {
        const n = val("T13", "t"), teste = val("T13", "teste"), Pm = R().parametros;
        const rows = R().turnos[n][teste === "T13" ? "mebane" : "beber"];
        const por = {};
        rows.forEach((r) => { (por[r.uf] = por[r.uf] || []).push(r); });
        const grupos = Object.keys(por).sort((a, b) => (a === "BR" ? -1 : b === "BR" ? 1 : a.localeCompare(b))).map((uf) => ({ rot: uf === "BR" ? (A.state.lang === "EN" ? "Brazil" : "Brasil") : uf, pts: por[uf].map((r) => ({ v: Math.max(r.q, 1e-4), marca: r.sinal, cor: r.cargo === 1 ? 0 : 1,
          dica: `${uf} · ${CARGO[r.cargo] || r.cargo}\n${A.titulo(r.nome)} (${r.nr})\nq = ${A.dec(r.q.toPrecision(3))} · p = ${A.dec(r.p.toPrecision(3))} · n = ${nf(r.n)}` })) }));
        tabelaEm("T13", ["UF", L.th_cargo, L.th_cand, "n", "χ²", "p", "q"], rows.map((r) => [r.uf, esc(CARGO[r.cargo] || r.cargo), `${esc(A.titulo(r.nome))} (${r.nr})`, nf(r.n), A.dec(r.chi2.toFixed(2)), A.dec(r.p.toPrecision(3)), A.dec(r.q.toPrecision(3))]));
        return `<ul class="legend inline gr-leg"><li><span class="dotk c0"></span>${esc(L.cd_pres)}</li><li><span class="dotk c1"></span>${esc(L.cd_gov)}</li></ul>`
          + pontosLog(w, { titulo: L.gr_dg_title, grupos, dom: [1e-4, 1], limite: Pm.ALFA_FDR, rotLimite: L.gr_q_l(A.dec(String(Pm.ALFA_FDR))), eixoX: L.gr_q_x });
      });

      desenhos.set("T15", (w) => {
        const n = val("T15", "t"), Pm = R().parametros;
        const rows = R().turnos[n].klimek.filter((r) => r.razao != null && r.razao > 0);
        const nomes = [...new Set(rows.map((r) => r.nr))];
        const por = {};
        rows.forEach((r) => { (por[r.uf] = por[r.uf] || []).push(r); });
        const grupos = Object.keys(por).sort((a, b) => (a === "BR" ? -1 : b === "BR" ? 1 : a.localeCompare(b))).map((uf) => ({ rot: uf === "BR" ? A.state.lang === "EN" ? "Brazil" : "Brasil" : uf,
          pts: por[uf].map((r) => ({ v: r.razao, marca: r.insp, cor: nomes.indexOf(r.nr) % 2,
            dica: `${uf} · ${A.titulo(r.nome)} (${r.nr})\n${L.gr_kl_tip(A.dec(r.razao.toFixed(2)), nf(r.obs), A.dec(r.esp.toFixed(1)))}${r.insp ? "\n" + L.gr_kl_insp : ""}` })) }));
        tabelaEm("T15", ["UF", L.th_cand, L.gr_kl_obs, L.gr_kl_esp, L.gr_kl_raz, L.gr_kl_th_insp], rows.map((r) => [r.uf, `${esc(A.titulo(r.nome))} (${r.nr})`, nf(r.obs), A.dec(r.esp.toFixed(2)), A.dec(r.razao.toFixed(2)), r.insp ? chip("amber", L.yes) : "—"]));
        const cand = R().turnos[n].presidente.candidatos.filter((c) => nomes.includes(c.nr));
        return `<ul class="legend inline gr-leg">${cand.slice(0, 2).map((c) => `<li><span class="dotk c${nomes.indexOf(c.nr) % 2}"></span>${esc(A.titulo(c.nome))} (${c.nr})</li>`).join("")}<li><span class="dotk marca"></span>${esc(L.gr_kl_insp)}</li></ul>`
          + pontosLog(w, { titulo: L.gr_kl_title, grupos, dom: [0.1, 100], limite: Pm.KLIMEK_RAZAO, acima: true, rotLimite: L.gr_kl_l(A.dec(String(Pm.KLIMEK_RAZAO)), Pm.KLIMEK_MIN_CANTO), eixoX: L.gr_kl_x });
      });

      $$("form[data-g]").forEach((f) => f.addEventListener("change", () => redesenhar(f.dataset.g)));
      desenharTodos();
      const foco = p[1] === "T14" ? "T13" : p[1] === "T05" || p[1] === "T12" ? "oc" : p[1];
      if (foco && document.getElementById("g-" + foco)) setTimeout(() => document.getElementById("g-" + foco).scrollIntoView({ block: "start" }), 60);
      else if (p[1] && /^T\d\d$/.test(p[1])) {
        const f = $('form[data-g="oc"]'); f.elements.teste.value = p[1]; redesenhar("oc");
        setTimeout(() => document.getElementById("g-oc").scrollIntoView({ block: "start" }), 60);
      }
    },
  };

  // ===================================================================================================
  // Glossário (mesma base do bot)
  // ===================================================================================================
  const pgGlossario = {
    ativo: "glossary",
    titulo: () => t().gl_title,
    html() {
      const L = t();
      return `${cabecalho(L.gl_title, L.gl_sub, false)}
        <label class="mini-search big">${icone("search")}<input type="search" id="gl-q" placeholder="${esc(L.gl_ph)}" aria-label="${esc(L.gl_ph)}"></label>
        <nav class="gl-letters" id="gl-letters" aria-label="${esc(L.gl_letters)}"></nav><div id="gl-list">${carregando()}</div>${A.botCta(true)}`;
    },
    async iniciar(p) {
      const L = t();
      let kb;
      try { kb = await dado(`site/data/kb_${A.state.lang.toLowerCase()}.json`); } catch (e) { $("#gl-list").innerHTML = erroDados(e); return; }
      const nz = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const itens = kb.filter((e) => e.c === "glossario").map((e) => {
        const m = e.a.match(/^\*\*([^*]+)\*\*\s*[—-]\s*([\s\S]*)$/);
        return { id: e.i, termo: m ? m[1] : e.q[0], def: m ? m[2] : e.a, q: e.q[0] };
      }).sort((a, b) => nz(a.termo).localeCompare(nz(b.termo)));
      const md = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n+/g, "<br>");
      const letra = (x) => nz(x.termo).charAt(0).toUpperCase();
      const desenhar = (filtro) => {
        const ls = itens.filter((x) => !filtro || nz(x.termo + " " + x.def).includes(nz(filtro)));
        const letras = [...new Set(ls.map(letra))];
        $("#gl-letters").innerHTML = letras.map((l) => `<a href="#gl-${l}" data-letra="${l}">${l}</a>`).join("");
        $("#gl-list").innerHTML = ls.length ? letras.map((l) => `<section class="gl-sec" id="gl-${l}"><h2>${l}</h2><dl class="gl">${ls.filter((x) => letra(x) === l).map((x) =>
          `<div class="gl-item" id="${esc(x.id)}"><dt>${esc(x.termo)}</dt><dd>${md(x.def)}<button class="btn btn-sm btn-ghost" type="button" data-ask="${esc(x.q)}">${icone("chat")} ${esc(L.gl_ask)}</button></dd></div>`).join("")}</dl></section>`).join("")
          : `<p class="alert">${esc(L.gl_none)}</p>`;
      };
      desenhar("");
      $("#gl-q").addEventListener("input", (e) => desenhar(e.target.value.trim()));
      $("#gl-letters").addEventListener("click", (e) => { const a = e.target.closest("[data-letra]"); if (!a) return; e.preventDefault(); const s = document.getElementById("gl-" + a.dataset.letra); if (s) s.scrollIntoView({ block: "start", behavior: "smooth" }); });
      if (p[1]) { const el = document.getElementById(p[1]); if (el) { el.classList.add("hl"); setTimeout(() => el.scrollIntoView({ block: "center" }), 60); } }
    },
  };

  // ===================================================================================================
  // Conferir arquivo (SHA-512 no navegador)
  // ===================================================================================================
  function carregarScript(src, global) {
    if (window[global]) return Promise.resolve(window[global]);
    return new Promise((ok, falha) => {
      const s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = () => (window[global] ? ok(window[global]) : falha(new Error(src)));
      s.onerror = () => falha(new Error(src));
      document.head.appendChild(s);
    });
  }
  // Hex ou base64 → hex minúsculo
  function normHash(x) {
    x = String(x).trim();
    if (/^[0-9a-fA-F]{128}$/.test(x)) return x.toLowerCase();
    if (/^[A-Za-z0-9+/]{86}==$/.test(x)) { try { return Array.from(atob(x), (c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join(""); } catch (e) { return null; } }
    return null;
  }
  function hashesDoTexto(txt, origem) {
    // linhas "hash  nome" (sha512sum), "SHA512 (nome) = hash" ou só o hash (hex ou base64)
    const out = [];
    txt.split(/\r?\n/).forEach((ln) => {
      const tks = ln.trim().split(/\s+/);
      const m = ln.match(/^SHA512 \((.+)\) = ([0-9a-fA-F]{128})/);
      if (m) { out.push({ h: m[2].toLowerCase(), nome: m[1], origem }); return; }
      tks.forEach((tk, i) => { const h = normHash(tk.replace(/^\*/, "")); if (h) out.push({ h, nome: (tks[i + 1] || "").replace(/^\*/, ""), origem }); });
    });
    return out;
  }

  const pgConferir = {
    ativo: "verify",
    titulo: () => t().vf_title,
    html() {
      const L = t();
      return `${cabecalho(L.vf_title, L.vf_sub, false)}
        <section class="card"><label class="drop" id="vf-drop"><input type="file" id="vf-in" multiple>
          <span class="drop-ico">${icone("upload")}</span><b>${esc(L.vf_drop)}</b><span class="small muted">${esc(L.vf_drop2)}</span></label>
          <label class="vf-exp"><span>${esc(L.vf_expected)}</span><input id="vf-hash" type="text" autocomplete="off" spellcheck="false" placeholder="${esc(L.vf_expected_ph)}"></label>
          <p class="small muted">${esc(L.vf_privacy)}</p></section>
        <div id="vf-res" aria-live="polite"></div>
        <section class="card"><h2>${esc(L.vf_how_title)}</h2><ul class="checks">${L.vf_how(nf(R().downloads.length)).map((x) => `<li>${x}</li>`).join("")}</ul>
          <p class="btn-row"><a class="btn btn-sm" href="#/downloads">${icone("download")} ${esc(L.vf_go_dl)}</a><a class="btn btn-sm btn-ghost" href="#/replicar">${icone("terminal")} ${esc(L.vf_go_rp)}</a></p></section>${A.botCta(true)}`;
    },
    iniciar() {
      const L = t();
      const pub = R().downloads.map((d) => ({ h: d.sha512.toLowerCase(), nome: d.nome, origem: L.vf_src_pub }));
      [1, 2].forEach((n) => pub.push({ h: R().turnos[n].cab.manifesto_sha512.toLowerCase(), nome: "manifesto_saida.sha512", origem: `${L.vf_src_man} · ${L.round(n)}` }));
      let extras = [], itens = [];
      const desenhar = () => {
        const esperado = normHash($("#vf-hash").value);
        const todos = pub.concat(extras);
        $("#vf-res").innerHTML = itens.length ? `<section class="vf-list">${itens.map((it) => {
          let st, msg;
          if (it.erro) { st = "red"; msg = esc(it.erro); }
          else if (!it.h) { st = "amber"; msg = `${esc(L.vf_working)} ${Math.round(it.prog * 100)}%`; }
          else {
            const ig = todos.filter((x) => x.h === it.h);
            const mesmoNome = todos.filter((x) => x.nome && x.nome.split("/").pop() === it.nome && x.h !== it.h);
            if (esperado && esperado === it.h) { st = "green"; msg = esc(L.vf_ok_exp); }
            else if (ig.length) { st = "green"; msg = esc(L.vf_ok(ig.map((x) => `${x.nome || "—"} (${x.origem})`).join("; "))); }
            else if (esperado) { st = "red"; msg = esc(L.vf_diff_exp); }
            else if (mesmoNome.length) { st = "red"; msg = esc(L.vf_diff(mesmoNome[0].nome, mesmoNome[0].origem)); }
            else { st = "amber"; msg = esc(L.vf_unknown); }
          }
          return `<article class="card vf-item vf-${st}"><div class="vf-top">${chip(st, { green: L.vf_st_ok, red: L.vf_st_bad, amber: it.h ? L.vf_st_unk : L.vf_st_wait }[st])}<b class="fname">${esc(it.nome)}</b><span class="small muted">${esc(A.nf(it.tam))} bytes</span></div>
            ${it.h ? `<code class="wrap vf-h">${it.h}</code>` : `<progress max="1" value="${it.prog || 0}"></progress>`}<p class="small">${msg}</p></article>`;
        }).join("")}</section>` : "";
      };
      const processar = async (files) => {
        let lib;
        try { lib = await carregarScript("site/js/vendor/sha512.umd.min.js", "hashwasm"); } catch (e) { $("#vf-res").innerHTML = erroDados(e); return; }
        const novos = Array.from(files).map((f) => ({ f, nome: f.name, tam: f.size, prog: 0, h: null }));
        itens = novos.concat(itens);
        desenhar();
        for (const it of novos) {
          try {
            // arquivos de hash pequenos também alimentam a lista de comparação
            if (it.tam < 2e6 && /\.(sha512|sha|txt|md5|hash)$/i.test(it.nome)) extras = extras.concat(hashesDoTexto(await it.f.text(), it.nome));
            const h = await lib.createSHA512(); h.init();
            const passo = 8 * 1024 * 1024;
            for (let pos = 0; pos < it.tam; pos += passo) {
              h.update(new Uint8Array(await it.f.slice(pos, pos + passo).arrayBuffer()));
              it.prog = Math.min(1, (pos + passo) / it.tam); desenhar();
            }
            it.h = h.digest("hex");
          } catch (e) { it.erro = e.message; }
          desenhar();
        }
      };
      const inp = $("#vf-in"), drop = $("#vf-drop");
      inp.addEventListener("change", () => { const fs = Array.from(inp.files); inp.value = ""; if (fs.length) processar(fs); });
      ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
      ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
      drop.addEventListener("drop", (e) => { const fs = Array.from(e.dataTransfer.files); if (fs.length) processar(fs); });
      $("#vf-hash").addEventListener("input", desenhar);
    },
  };

  // ===================================================================================================
  // Conferir o boletim impresso (QR Code ou números digitados)
  // ===================================================================================================
  // Texto do QR Code do BU: pares CHAVE:VALOR separados por espaço. "QRBU:parte:total" abre cada parte;
  // CARG abre o bloco de um cargo; dentro dele, "número:votos" são os votos nominais.
  function lerQR(txt) {
    const out = { campos: {}, cargos: [], parte: null, total: null };
    let cargo = null;
    String(txt).trim().split(/\s+/).forEach((tk) => {
      const i = tk.indexOf(":"); if (i < 1) return;
      const k = tk.slice(0, i).toUpperCase(), v = tk.slice(i + 1);
      if (k === "QRBU") { const [a, b] = v.split(":"); out.parte = +a; out.total = +b; return; }
      if (k === "CARG") { cargo = { cod: parseInt(v, 10), votos: {}, campos: {} }; out.cargos.push(cargo); return; }
      if (k === "IDEL" || k === "HASH" || k === "ASSI") { cargo = null; out.campos[k] = v; return; }
      if (/^\d+$/.test(k)) { if (cargo) cargo.votos[k] = parseInt(v, 10) || 0; return; }
      if (cargo) { cargo.campos[k] = v; return; }
      out.campos[k] = v;
    });
    return out;
  }
  // Junta as partes lidas e devolve os números para comparar
  function juntarQR(partes) {
    const campos = {}, cargos = [];
    Object.keys(partes).sort((a, b) => a - b).forEach((k) => { const p = partes[k]; Object.assign(campos, p.campos); p.cargos.forEach((c) => cargos.push(c)); });
    const pres = cargos.find((c) => c.cod === 1);
    const num = (x) => (x == null || x === "" ? null : parseInt(x, 10));
    const r = { uf: campos.UNFE ? campos.UNFE.toUpperCase() : null, z: num(campos.ZONA), s: num(campos.SECA), turno: num(campos.TURN), aptos: num(campos.APTO), comp: num(campos.COMP), votos: {}, presidente: !!pres };
    if (pres) {
      Object.entries(pres.votos).forEach(([nr, v]) => { r.votos[nr] = v; });
      if (pres.campos.BRAN != null) r.votos["95"] = num(pres.campos.BRAN);
      if (pres.campos.NULO != null) r.votos["96"] = num(pres.campos.NULO);
      if (r.aptos == null && pres.campos.APTA != null) r.aptos = num(pres.campos.APTA);
    }
    return r;
  }

  const pgBoletim = {
    ativo: "ballot",
    titulo: () => t().bu_title,
    html() {
      const L = t(), q = A.state.query;
      const ufs = ufsLista().map((u) => [u, `${u} – ${A.ufNome(u)}`]);
      return `${cabecalho(L.bu_title, L.bu_sub, false)}
        <p class="note small">${esc(L.bu_note)}</p>
        <section class="card"><h2>${esc(L.bu_s1)}</h2>
          <form class="lk-form bu-form" id="bu-sec" novalidate>${seletor("uf", L.lk_uf, ufs, (q.get("uf") || "PR").toUpperCase())}
            <label><span>${esc(L.lk_zone)}</span><input name="z" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="${esc(q.get("z") || "")}"></label>
            <label><span>${esc(L.lk_section)}</span><input name="s" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="${esc(q.get("s") || "")}"></label>
            ${seletor("t", L.x_round, opTurno(false), q.get("t") || "2")}</form></section>
        <section class="card"><h2>${esc(L.bu_s2)}</h2>
          <div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-tab="qr">${icone("qr")} ${esc(L.bu_tab_qr)}</button><button type="button" role="tab" aria-selected="false" data-tab="num">${icone("list")} ${esc(L.bu_tab_num)}</button></div>
          <div data-pane="qr"><p class="small muted">${esc(L.bu_qr_help)}</p>
            <div class="btn-row"><button class="btn btn-primary" type="button" id="bu-cam">${icone("camera")} ${esc(L.bu_cam)}</button>
              <label class="btn"><input type="file" accept="image/*" id="bu-foto" hidden>${icone("image")} ${esc(L.bu_photo)}</label></div>
            <div class="bu-video" id="bu-video" hidden><video playsinline muted></video><span class="bu-mira" aria-hidden="true"></span><button class="btn btn-sm" type="button" id="bu-stop">${icone("stop")} ${esc(L.bu_stop)}</button></div>
            <p id="bu-qr-st" class="small" aria-live="polite"></p><details class="bu-raw" hidden><summary>${esc(L.bu_raw)}</summary><pre></pre></details></div>
          <div data-pane="num" hidden><p class="small muted">${esc(L.bu_num_help)}</p><form id="bu-num" class="bu-num"></form></div>
          <p class="small muted">${esc(L.bu_privacy)}</p></section>
        <div id="bu-res" aria-live="polite"></div>${A.botCta(true)}`;
    },
    iniciar() {
      const L = t(), fs = $("#bu-sec"), fn = $("#bu-num");
      let partes = {}, stream = null, rodando = false;
      const turno = () => fs.elements.t.value;
      const campoNum = (nm, rot) => `<label><span>${esc(rot)}</span><input name="${nm}" inputmode="numeric" pattern="[0-9]*" autocomplete="off"></label>`;
      const montarNum = () => {
        const n = turno(), nomes = {}; R().turnos[n].presidente.candidatos.forEach((c) => { nomes[c.nr] = c.nome; });
        const cands = R().ordem_votos[n].filter((nr) => nr !== "95" && nr !== "96").sort((a, b) => +a - +b);
        fn.innerHTML = campoNum("aptos", L.lk_aptos) + campoNum("comp", L.lk_comp) + cands.map((nr) => campoNum("v" + nr, `${nr} · ${A.titulo(nomes[nr] || nr)}`)).join("")
          + campoNum("v95", L.blank) + campoNum("v96", L.null_) + `<button class="btn btn-primary" type="submit">${icone("check")} ${esc(L.bu_compare)}</button>`;
      };
      montarNum();
      $$(".tabs [data-tab]").forEach((b) => b.addEventListener("click", () => {
        $$(".tabs [data-tab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
        $$("[data-pane]").forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
        if (b.dataset.tab !== "qr") parar();
      }));
      fs.elements.t.addEventListener("change", montarNum);

      const comparar = async (imp, origem) => {
        const uf = fs.elements.uf.value, z = parseInt(fs.elements.z.value, 10), s = parseInt(fs.elements.s.value, 10), n = turno();
        const box = $("#bu-res");
        if (!(z > 0) || !(s > 0)) { box.innerHTML = `<p class="alert">${esc(L.bu_need)}</p>`; return; }
        box.innerHTML = carregando();
        const d = await A.consultarSecao(uf, z, s);
        if (d.erro) { box.innerHTML = `<p class="alert">${esc(d.erro === "zona" ? L.lk_nozone : L.lk_nosec)}</p>`; return; }
        const tv = d.rec[n];
        if (!tv) { box.innerHTML = `<p class="alert">${esc(L.lk_nodata)}</p>`; return; }
        const { v, nomes } = A.votosTurno(n, tv);
        const linhas = [[L.lk_aptos, imp.aptos, tv[0]], [L.lk_comp, imp.comp, tv[1]]];
        const fim = (x) => (x === "95" || x === "96" ? 1 : 0);
        Object.keys(v).sort((a, b) => fim(a) - fim(b) || +a - +b).forEach((nr) => linhas.push([nr === "95" ? L.blank : nr === "96" ? L.null_ : `${nr} · ${A.titulo(nomes[nr] || nr)}`, imp.votos[nr], v[nr]]));
        Object.keys(imp.votos).filter((nr) => !(nr in v)).forEach((nr) => linhas.push([`${nr}`, imp.votos[nr], null]));
        let iguais = 0, difs = 0;
        const corpo = linhas.map(([rot, a, b]) => {
          let st;
          if (a == null || Number.isNaN(a)) st = "—";
          else if (a === (b || 0)) { st = chip("green", L.bu_eq); iguais++; } else { st = chip("red", L.bu_ne); difs++; }
          return [esc(rot), a == null || Number.isNaN(a) ? "—" : nf(a), b == null ? "—" : nf(b), st];
        });
        const res = difs ? chip("red", L.bu_res_diff(difs)) : iguais ? chip("green", L.bu_res_ok(iguais)) : chip("amber", L.bu_res_none);
        box.innerHTML = `<section class="card"><h2>${esc(`${uf} · ${A.titulo(d.mun[1])} · ${L.th_zone} ${z} · ${L.th_section} ${s} · ${L.round(+n)}`)}</h2>
          <p>${res} <span class="small muted">${esc(origem)}</span></p>${tabela([L.bu_th_field, L.bu_th_paper, L.bu_th_file, ""], corpo, "num-cols")}
          <p class="small muted">${esc(L.bu_res_note)}</p><p class="btn-row"><a class="btn btn-sm" href="#/secao/${uf}/${z}/${s}">${icone("search")} ${esc(L.bot_sec_details)}</a>
          ${difs ? `<button class="btn btn-sm btn-ghost" type="button" data-report="${esc(`${L.bu_title}: ${uf} · ${L.th_zone} ${z} · ${L.th_section} ${s} · ${L.round(+n)}`)}">${icone("alert")} ${esc(L.rep_btn)}</button>` : ""}</p></section>`;
        box.scrollIntoView({ block: "start", behavior: "smooth" });
      };

      fn.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = (nm) => { const x = fn.elements[nm].value.trim(); return x === "" ? null : parseInt(x.replace(/\D/g, ""), 10); };
        const imp = { aptos: val("aptos"), comp: val("comp"), votos: {} };
        Array.from(fn.elements).forEach((el) => { if (el.name && el.name.startsWith("v")) { const x = val(el.name); if (x != null) imp.votos[el.name.slice(1)] = x; } });
        comparar(imp, L.bu_from_num);
      });

      // --- leitura do QR Code -----------------------------------------------------------------------------
      const st = (txt) => { $("#bu-qr-st").textContent = txt; };
      const recebeuTexto = (txt) => {
        const p = lerQR(txt);
        const raw = $(".bu-raw"); raw.hidden = false;
        if (!p.parte) { st(L.bu_qr_unknown); raw.querySelector("pre").textContent = txt; return false; }
        partes[p.parte] = p;
        raw.querySelector("pre").textContent = Object.keys(partes).sort((a, b) => a - b).map((k) => `[${k}/${p.total}]`).join(" ") + "\n\n" + txt;
        const lidas = Object.keys(partes).length;
        const r = juntarQR(partes);
        if (r.uf && window.UF_NOMES[r.uf]) fs.elements.uf.value = r.uf;
        if (r.z) fs.elements.z.value = r.z;
        if (r.s) fs.elements.s.value = r.s;
        if (r.turno === 1 || r.turno === 2) { if (fs.elements.t.value !== String(r.turno)) { fs.elements.t.value = String(r.turno); montarNum(); } }
        if (!r.presidente && lidas < (p.total || 1)) { st(L.bu_qr_part(lidas, p.total)); return false; }
        st(r.presidente ? L.bu_qr_done(lidas, p.total) : L.bu_qr_nopres(lidas, p.total));
        if (r.presidente) comparar(r, L.bu_from_qr);
        return r.presidente || lidas >= (p.total || 1);
      };
      const decodificar = async (fonte, w, h) => {
        if ("BarcodeDetector" in window) {
          try { const det = new window.BarcodeDetector({ formats: ["qr_code"] }); const cod = await det.detect(fonte); if (cod.length) return cod.map((c) => c.rawValue); } catch (e) { /* cai no jsQR */ }
        }
        const lib = await carregarScript("site/js/vendor/jsQR.min.js", "jsQR");
        const cv = document.createElement("canvas"), esc2 = Math.min(1, 1280 / Math.max(w, h));
        cv.width = Math.round(w * esc2); cv.height = Math.round(h * esc2);
        const ctx = cv.getContext("2d", { willReadFrequently: true }); ctx.drawImage(fonte, 0, 0, cv.width, cv.height);
        const img = ctx.getImageData(0, 0, cv.width, cv.height);
        const r = lib(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
        return r ? [r.data] : [];
      };
      const parar = () => {
        rodando = false;
        if (stream) { stream.getTracks().forEach((tr) => tr.stop()); stream = null; }
        const v = $("#bu-video"); if (v) v.hidden = true;
      };
      window.addEventListener("hashchange", parar, { once: true });
      $("#bu-stop").addEventListener("click", parar);
      $("#bu-cam").addEventListener("click", async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { st(L.bu_nocam); return; }
        try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }); } catch (e) { st(L.bu_cam_denied); return; }
        partes = {};
        const box = $("#bu-video"), vid = box.querySelector("video");
        box.hidden = false; vid.srcObject = stream; await vid.play().catch(() => {});
        rodando = true; st(L.bu_scanning);
        const visto = new Set();
        const laco = async () => {
          if (!rodando) return;
          if (vid.readyState >= 2) {
            try {
              const txts = await decodificar(vid, vid.videoWidth, vid.videoHeight);
              for (const x of txts) { if (!visto.has(x)) { visto.add(x); if (navigator.vibrate) navigator.vibrate(60); if (recebeuTexto(x)) { parar(); return; } } }
            } catch (e) { /* tenta de novo no próximo quadro */ }
          }
          setTimeout(laco, 250);
        };
        laco();
      });
      $("#bu-foto").addEventListener("change", async (e) => {
        const f = e.target.files[0]; e.target.value = "";
        if (!f) return;
        st(L.bu_reading);
        try {
          const bmp = await createImageBitmap(f);
          const txts = await decodificar(bmp, bmp.width, bmp.height);
          if (!txts.length) { st(L.bu_qr_none); return; }
          txts.forEach(recebeuTexto);
        } catch (err) { st(L.bu_qr_none); }
      });
    },
  };

  // ===================================================================================================
  // Minhas seções (salvas e consultadas recentemente, só neste navegador)
  // ===================================================================================================
  const pgSalvas = {
    ativo: "saved",
    titulo: () => t().sv_title,
    html() {
      const L = t();
      return `${cabecalho(L.sv_title, L.sv_sub, false)}<div id="sv-body"></div>${A.botCta(true)}`;
    },
    iniciar() {
      const L = t(), F = window.FERR;
      const lista = (itens, tipo) => itens.length ? `<ul class="sv-list">${itens.map((x) => `<li class="card"><a href="#/secao/${x.uf}/${x.z}/${x.s}"><b>${esc(x.uf)} · ${esc(x.m || "")}</b><span>${esc(L.th_zone)} ${x.z} · ${esc(L.th_section)} ${x.s}</span></a>
          <button class="icon-btn" type="button" data-rm="${tipo}" data-k="${esc(`${x.uf}/${x.z}/${x.s}`)}" aria-label="${esc(L.sv_rm)}" title="${esc(L.sv_rm)}">${icone("trash")}</button></li>`).join("")}</ul>` : `<p class="muted">${esc(tipo === "s" ? L.sv_none : L.sv_none_r)}</p>`;
      const desenhar = () => {
        const s = F.salvas(), r = F.recentes();
        $("#sv-body").innerHTML = `<section><h2>${esc(L.sv_saved)}</h2>${lista(s, "s")}</section>
          <section><div class="h-row"><h2>${esc(L.sv_recent)}</h2>${r.length ? `<button class="btn btn-sm btn-ghost" type="button" data-clear>${icone("trash")} ${esc(L.sv_clear)}</button>` : ""}</div>${lista(r, "r")}</section>
          <p class="note small">${esc(L.sv_note)}</p><p><a class="btn btn-primary" href="#/secao">${icone("search")} ${esc(L.cta_lookup)}</a></p>`;
      };
      $("#sv-body").addEventListener("click", (e) => {
        const b = e.target.closest("[data-rm]");
        if (b) { F.remover(b.dataset.rm, b.dataset.k); desenhar(); return; }
        if (e.target.closest("[data-clear]")) { F.limparRecentes(); desenhar(); }
      });
      desenhar();
    },
  };

  // ===================================================================================================
  // Atualizações
  // ===================================================================================================
  const pgAtualizacoes = {
    ativo: "updates",
    titulo: () => t().up_title,
    html() {
      const L = t();
      return `${cabecalho(L.up_title, L.up_sub, false, `<a class="btn btn-sm" href="feed.xml" data-feed>${icone("rss")} ${esc(L.up_rss)}</a><a class="btn btn-sm btn-tg" href="${A.TELEGRAM}" target="_blank" rel="noopener">${icone("tg")} ${esc(L.tg_btn)}</a>`)}
        <div id="up-list">${carregando()}</div>${A.botCta(true)}`;
    },
    async iniciar() {
      const L = t(), lg = A.state.lang;
      let U;
      try { U = await dado("site/data/atualizacoes.json"); } catch (e) { $("#up-list").innerHTML = erroDados(e); return; }
      const data = (d) => new Intl.DateTimeFormat(L.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z"));
      $("#up-list").innerHTML = `<ol class="timeline up-tl">${U.map((u, i) => `<li${u.tipo === "dados" ? ' class="y"' : ""}><time datetime="${u.d}">${esc(data(u.d))}</time>
        <span class="up-tipo">${esc(L.up_tipo[u.tipo] || u.tipo)}</span><h2 class="up-t">${esc(u.t[lg])}</h2><p>${esc(u.x[lg])}</p>${u.link ? `<a class="btn btn-sm" href="${esc(u.link)}">${esc(L.pg_open)} ${icone("arrow")}</a>` : ""}</li>`).join("")}</ol>`;
      A.efeitos($("#up-list"));
    },
  };

  Object.assign(A.paginas, { mapa: pgMapa, uf: pgUf, lista: pgLista, graficos: pgGraficos, glossario: pgGlossario, conferir: pgConferir, boletim: pgBoletim, salvas: pgSalvas, atualizacoes: pgAtualizacoes });
  A.paginasExtra = { ocorrencias, dado, lerQR, juntarQR, normHash, hashesDoTexto, paginar };
})();
