/* Votos para Presidente do 1º para o 2º turno: Brasil, estados, municípios e seções, com os testes V1 a V6
   do Adendo A do Relatório Técnico do 2º turno (script variacao_entre_turnos.py). Mostra números e resultados; não tira conclusão. */
(function () {
  "use strict";

  const A = window.APP;
  const { esc, icone, tabela, chip, $, $$ } = A;
  const t = () => A.t(), V = () => t().vr, nf = (n) => A.nf(n), pct = (x, d) => A.pct(x, d == null ? 1 : d);
  const R = () => A.state.R;
  const X = () => A.paginasExtra;
  const TESTES = ["V1", "V2", "V3", "V4", "V5", "V6"];
  const NIVEL = { V1: "uf", V2: "municipio", V3: "secao", V4: "secao", V5: "secao", V6: "secao" };
  const REL = "auditoria-eleicoes-2026-Brasil/resultados-2turno/";
  const dados = () => X().dado("site/data/variacao.json");
  const carregando = () => `<p class="muted">${esc(t().lk_loading)}</p>`;
  const erro = (e) => `<p class="alert">${esc(t().x_err)} (${esc(e.message)})</p>`;
  const ufsLista = () => Object.keys(window.UF_NOMES).sort();

  // --- números ---------------------------------------------------------------------------------------------
  const sn = (x) => (x > 0 ? "+" : x < 0 ? "−" : "") + nf(Math.abs(x));
  const pp = (x) => (x > 0 ? "+" : x < 0 ? "−" : "") + A.dec(Math.abs(x).toFixed(1));
  const seta = (x) => (x > 0 ? "▲" : x < 0 ? "▼" : "＝");
  const v12 = (a, b) => `<span class="vr-n">${nf(a)} → ${nf(b)}</span><span class="vr-d">${seta(b - a)} ${sn(b - a)}</span>`;
  const v12txt = (a, b) => `${nf(a)} → ${nf(b)} (${sn(b - a)})`;

  // Barras do cartão de imagem e vídeo: votos de cada candidato no 1º e no 2º turno, na mesma escala
  function barrasVar(T) {
    const G = t(), top = Math.max(T.L1, T.L2, T.F1, T.F2, 1);
    const g = (nome, nr, a, b) => ({ t: `${nome} (${nr})`, itens: [[G.round(1), nf(a), a / top], [G.round(2), `${nf(b)} (${sn(b - a)})`, b / top]] });
    return [g(V().lula, "13", T.L1, T.L2), g(V().flavio, "22", T.F1, T.F2)];
  }

  // Totais a partir do formato do site: [aptos, comp, votos na ordem do turno]
  function deTurnos(t1, t2) {
    const o = { L1: 0, F1: 0, O1: 0, B1: 0, N1: 0, C1: 0, A1: 0, L2: 0, F2: 0, B2: 0, N2: 0, C2: 0, A2: 0 };
    [[1, t1], [2, t2]].forEach(([n, tv]) => {
      if (!tv) return;
      const ordem = R().ordem_votos[n], vt = tv.length > 3 ? tv[5] : tv[2]; // seção: [aptos, comp, abert., encerr., agreg., votos]; município: [aptos, comp, votos]
      o["A" + n] = tv[0]; o["C" + n] = tv[1];
      ordem.forEach((nr, i) => {
        const v = vt[i] || 0;
        if (nr === "13") o["L" + n] += v; else if (nr === "22") o["F" + n] += v; else if (nr === "95") o["B" + n] += v; else if (nr === "96") o["N" + n] += v; else o["O" + n] += v;
      });
    });
    return derivar(o);
  }
  // [L1, F1, O1, B1, N1, comp1, aptos1, L2, F2, B2, N2, comp2, aptos2]
  function deCols(a) {
    return derivar({ L1: a[0], F1: a[1], O1: a[2], B1: a[3], N1: a[4], C1: a[5], A1: a[6], L2: a[7], F2: a[8], B2: a[9], N2: a[10], C2: a[11], A2: a[12] });
  }
  function derivar(o) {
    o.dL = o.L2 - o.L1; o.dF = o.F2 - o.F1; o.dC = o.C2 - o.C1; o.BN1 = o.B1 + o.N1; o.BN2 = o.B2 + o.N2;
    o.pool = o.dL + o.dF; o.saldo = o.C1 ? (100 * (o.dL - o.dF)) / o.C1 : null;
    return o;
  }
  function somarMun(ms) {
    const s = { L1: 0, F1: 0, O1: 0, B1: 0, N1: 0, C1: 0, A1: 0, L2: 0, F2: 0, B2: 0, N2: 0, C2: 0, A2: 0 };
    ms.forEach((m) => Object.keys(s).forEach((k) => { s[k] += m[k]; }));
    return derivar(s);
  }

  // --- blocos ----------------------------------------------------------------------------------------------
  // migalhas: [[rótulo, link], ...] acima do título (fora do kicker, que tem efeito de texto)
  function cabecalho(kicker, titulo, sub, migalhas) {
    const mig = migalhas ? `<nav class="vr-mig small" aria-label="${esc(V().voltar)}">${migalhas.map(([r, h]) => `<a href="${h}">${esc(r)}</a>`).join(" <span aria-hidden=\"true\">›</span> ")}</nav>` : "";
    return `<header class="page-head">${mig}<p class="kicker">${esc(kicker)}</p><h1>${esc(titulo)}</h1>${sub ? `<p class="lead">${esc(sub)}</p>` : ""}${A.acoes(true)}</header>
      <p class="vr-aviso">${icone("shield")}<span>${esc(V().aviso)}</span></p>`;
  }

  // Dois cartões: quanto cada finalista ganhou ou perdeu
  function duelo(T) {
    const L = V();
    const card = (k, nome, nr, a, b) => {
      const d = b - a;
      return `<div class="vr-cand vr-${k} spot" tabindex="0" data-tip="${esc(`${nome} (${nr})\n${L.votos12(nf(a), nf(b))}`)}">
        <p class="vr-cand-n"><span class="vr-sw" aria-hidden="true"></span>${esc(nome)} <span class="muted">(${nr})</span></p>
        <p class="vr-big"><span class="vr-seta" aria-hidden="true">${seta(d)}</span> <span data-count="${Math.abs(d)}">${nf(Math.abs(d))}</span> <small>${esc(d > 0 ? L.ganhou : d < 0 ? L.perdeu : L.igual)}</small></p>
        <p>${esc(L.votos12(nf(a), nf(b)))}</p>${a ? `<p class="small muted">${esc(L.cresc((d >= 0 ? "+" : "−") + pct(Math.abs(d) / a)))}</p>` : ""}</div>`;
    };
    return `<div class="vr-duelo">${card("l", L.lula, "13", T.L1, T.L2)}${card("f", L.flavio, "22", T.F1, T.F2)}</div>`;
  }

  // De onde vieram os votos: a identidade contábil e a divisão do que ficou disponível
  function origem(T) {
    const L = V();
    const itens = [[L.pool_items[0], nf(T.O1)], [L.pool_items[1], v12(T.BN1, T.BN2)], [L.pool_items[2], `${seta(T.dC)} ${sn(T.dC)}`], [L.pool_items[3], `<b>${nf(T.pool)}</b>`]];
    let barra = `<p class="small muted">${esc(L.pool_neg)}</p>`;
    if (T.dL > 0 && T.dF > 0) {
      const fl = T.dL / T.pool, ff = T.dF / T.pool;
      const seg = (k, f, q, v) => `<span class="vr-seg vr-${k}" style="--f:${f.toFixed(4)}" tabindex="0" data-tip="${esc(L.tip_pool(q, sn(v), pct(f)))}"></span>`;
      barra = `<div class="vr-pool" role="img" aria-label="${esc(L.pool_split(pct(fl), pct(ff)))}">${seg("l", fl, L.lula, T.dL)}${seg("f", ff, L.flavio, T.dF)}</div>
        <div class="vr-pool-lab"><span><span class="vr-sw vr-l" aria-hidden="true"></span>${esc(L.lula)} <b>${sn(T.dL)}</b> (${pct(fl)})</span><span><span class="vr-sw vr-f" aria-hidden="true"></span>${esc(L.flavio)} <b>${sn(T.dF)}</b> (${pct(ff)})</span></div>
        <p class="small">${esc(L.pool_split(pct(fl), pct(ff)))}</p>`;
    }
    return `<section class="card"><h2>${esc(L.pool_t)}</h2><p>${esc(L.pool_txt)}</p><p class="vr-formula">${esc(L.pool_formula)}</p>
      <dl class="vr-itens">${itens.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>${barra}</section>`;
  }

  const corNivel = (nv) => (nv === "a" || nv === "anomalia" ? "red" : nv === "i" || nv === "informativo" ? "amber" : "green");
  const rotNivel = (nv) => (corNivel(nv) === "red" ? t().lv_a : corNivel(nv) === "amber" ? t().lv_i : V().ok);
  function chipTeste(id, nv, curto) { return chip(corNivel(nv), curto ? rotNivel(nv) : `${id} · ${rotNivel(nv)}`); }

  // Cartões dos 6 testes com a contagem (do país ou de um recorte)
  function cartoesTestes(cont, comComo) {
    const L = V();
    return `<div class="vr-testes">${TESTES.map((id) => {
      const c = cont[id] || { a: 0, i: 0 }, cor = c.a ? "red" : c.i ? "amber" : "green";
      return `<article class="vr-teste card">
        <p class="vr-teste-h"><span class="vr-id">${id}</span><span class="small muted">${esc(L.nivel[NIVEL[id]])}</span></p>
        <h3>${esc(L.nomes[id])}</h3><p class="small">${esc(L.curto[id])}</p>
        <p class="vr-teste-res">${chip(cor, `${L.an}: ${nf(c.a)} · ${L.inf}: ${nf(c.i)}`)}${c.unidades != null ? ` <span class="small muted">${esc(L.un(nf(c.unidades)))}</span>` : ""}</p>
        ${comComo ? `<details><summary>${esc(L.como_btn)}</summary><p class="small">${esc(L.como[id])}</p></details>` : ""}</article>`;
    }).join("")}</div>`;
  }

  // Medida de um item sinalizado, em texto
  function medida(s) {
    const L = V(), [id, , , , , , obs, esp, dif, , det] = s;
    const kv = Object.fromEntries(String(det || "").split("; ").filter(Boolean).map((x) => x.split("=")));
    if (id === "V1" || id === "V2" || id === "V3") return L.med_part(pct(obs), pct(esp), pp(dif));
    if (id === "V4") {
      const q = kv.destino === "13" ? L.lula : kv.destino === "22" ? L.flavio : "";
      return `${L.med_comp(pct(obs), pct(esp), pp(dif))} · ${q ? L.dir(q, A.dec((100 * kv.excesso).toFixed(0))) : L.dir_prop}`;
    }
    if (id === "V5") return L.med_teto(kv.candidato === "13" ? L.lula : L.flavio, sn(obs), nf(esp), sn(+kv.excesso));
    return kv.motivo === "aptos" ? L.mot.aptos(sn(+kv.d_aptos)) : L.mot[kv.motivo];
  }

  // Tabela dos itens sinalizados, com filtros, paginação e planilha
  function listaSinais(box, sinais, muns, fixo) {
    const L = V(), G = t();
    const nomeMun = (uf, cod) => A.titulo(((muns[uf] || {})[cod] || [cod])[0]);
    const ufs = [...new Set(sinais.map((s) => s[2]))].sort();
    const sel = (nome, rot, ops) => `<label><span>${esc(rot)}</span><select name="${nome}">${ops.map(([v, x]) => `<option value="${esc(v)}">${esc(x)}</option>`).join("")}</select></label>`;
    box.innerHTML = `<form class="filters" data-vr-filtro>
        ${sel("teste", L.th.teste, [["", L.todos]].concat(TESTES.map((id) => [id, `${id}. ${L.nomes[id]}`])))}
        ${sel("nivel", L.th.tipo, [["", G.x_all_lv], ["a", G.lv_a], ["i", G.lv_i]])}
        ${fixo ? "" : sel("uf", L.th.uf, [["", G.x_all_ufs]].concat(ufs.map((u) => [u, `${u} – ${A.ufNome(u)}`])))}
      </form>
      <div class="h-row"><p class="li-res" aria-live="polite" data-vr-res></p><button class="btn btn-sm" type="button" data-vr-csv>${icone("download")} ${esc(L.csv)}</button></div>
      <div data-vr-tab></div>`;
    const f = $("[data-vr-filtro]", box);
    let filtradas = sinais;
    const local = (s) => {
      const [, , uf, mun, z, sec] = s;
      if (!mun) return `<a href="#/variacao/${uf}">${esc(uf)} – ${esc(A.ufNome(uf))}</a>`;
      const m = `<a href="#/variacao/${uf}/${mun}">${esc(nomeMun(uf, mun))}</a> <span class="muted">(${uf})</span>`;
      return z == null ? m : `${m}<br><a href="#/secao/${uf}/${z}/${sec}">${esc(G.th_zone)} ${z} · ${esc(G.th_section)} ${sec}</a>${s[11] ? ` <span class="small muted">· ${esc(L.urna(s[11]))}</span>` : ""}`;
    };
    const aplicar = () => {
      const te = f.elements.teste.value, nv = f.elements.nivel.value, uf = f.elements.uf ? f.elements.uf.value : "";
      filtradas = sinais.filter((s) => (!te || s[0] === te) && (!nv || s[1] === nv) && (!uf || s[2] === uf));
      $("[data-vr-res]", box).innerHTML = L.lista_res(nf(filtradas.length));
      if (!filtradas.length) { $("[data-vr-tab]", box).innerHTML = `<p>${chip("green", L.nenhum)}</p>`; return; }
      X().paginar($("[data-vr-tab]", box), filtradas, 50, (ls) => tabela([L.th.teste, L.th.local, L.th.L, L.th.F, L.th.C, L.th.medida, L.th.q],
        ls.map((s) => { const v = s[12]; return [`<div class="vr-te">${chipTeste(s[0], s[1])}<span class="small">${esc(L.nomes[s[0]])}</span></div>`, `<div class="vr-loc">${local(s)}</div>`,
          v12(v[0], v[6]), v12(v[1], v[7]), v12(v[4], v[9]), `<div class="vr-med small">${esc(medida(s))}</div>`,
          `<span class="vr-n">${s[9] === "" || s[9] == null ? "—" : A.dec(Number(s[9]).toPrecision(3))}</span>`]; }), "vr-tab"));
    };
    f.addEventListener("change", aplicar);
    $("[data-vr-csv]", box).addEventListener("click", () => {
      const cab = ["teste", "nome_teste", "nivel", "uf", "codigo_municipio_tse", "municipio", "zona", "secao", "nr_urna", "lula_1t", "flavio_1t", "demais_1t", "brancos_nulos_1t", "comparecimento_1t",
        "aptos_1t", "lula_2t", "flavio_2t", "brancos_nulos_2t", "comparecimento_2t", "aptos_2t", "variacao_lula", "variacao_flavio", "observado", "esperado", "diferenca_pp", "q", "medida"];
      const linhas = filtradas.map((s) => { const v = s[12]; return [s[0], L.nomes[s[0]], s[1] === "a" ? G.lv_a : G.lv_i, s[2], s[3] || "", s[3] ? nomeMun(s[2], s[3]) : "", s[4] ?? "", s[5] ?? "", s[11] || ""]
        .concat(v, [v[6] - v[0], v[7] - v[1], s[6], s[7], s[8], s[9], medida(s)]); });
      baixarCsv("variacao_turnos_sinalizacoes.csv", cab, linhas);
    });
    aplicar();
  }

  function baixarCsv(nome, cab, linhas) {
    const q2 = (x) => `"${String(x == null ? "" : x).replace(/"/g, '""')}"`;
    const blob = new Blob(["﻿" + [cab.map(q2).join(";")].concat(linhas.map((l) => l.map(q2).join(";"))).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // --- mapa divergente: roxo = a favor de Lula, laranja = a favor de Flávio, cinza = parecido ---------------
  const CORTES = { saldo: [0.5, 3, 6], dif: [1, 2.5, 5] };
  function classe(v, m) {
    if (v == null || !isFinite(v)) return "dv-na";
    const b = CORTES[m], a = Math.abs(v);
    if (a < b[0]) return "dv-0";
    return (v > 0 ? "dv-l" : "dv-f") + (a < b[1] ? 1 : a < b[2] ? 2 : 3);
  }
  function legenda(m) {
    const L = V(), b = CORTES[m].map((x) => A.dec(String(x))), ext = m === "saldo" ? L.leg_saldo : L.leg_dif;
    const faixas = [["dv-f3", `≥ ${b[2]}`], ["dv-f2", `${b[1]} – ${b[2]}`], ["dv-f1", `${b[0]} – ${b[1]}`], ["dv-0", `< ${b[0]}`], ["dv-l1", `${b[0]} – ${b[1]}`], ["dv-l2", `${b[1]} – ${b[2]}`], ["dv-l3", `≥ ${b[2]}`]];
    return `<div class="dv-leg"><div class="dv-ext"><span>◀ ${esc(ext[0])}</span><span>${esc(ext[2])} ▶</span></div>
      <div class="dv-sws">${faixas.map(([c, x]) => `<span class="dv-sw-i"><span class="sw ${c}"></span><span>${esc(x)}</span></span>`).join("")}</div>
      <p class="small muted">${esc(m === "saldo" ? L.leg_un_saldo : L.leg_un_dif)} · <span class="sw dv-na"></span> ${esc(L.sem_dado)}</p></div>`;
  }
  const unid = (v, m) => (v == null ? "—" : m === "saldo" ? `${pp(v)}%` : `${pp(v)} p.p.`);
  const selMedida = (atual) => `<label><span>${esc(V().medida)}</span><select name="m"><option value="saldo"${atual === "saldo" ? " selected" : ""}>${esc(V().m_saldo)}</option><option value="dif"${atual === "dif" ? " selected" : ""}>${esc(V().m_dif)}</option></select></label>`;
  const dica = (nome, T, dif) => {
    const L = V();
    return `${nome}\n${L.lula}: ${v12txt(T.L1, T.L2)}\n${L.flavio}: ${v12txt(T.F1, T.F2)}\n${L.th.saldo}: ${T.saldo == null ? "—" : pp(T.saldo) + "%"}${dif != null ? `\n${L.m_dif}: ${pp(dif)} p.p.` : ""}`;
  };

  // --- Brasil ----------------------------------------------------------------------------------------------
  function htmlBrasil() {
    const L = V();
    return `${cabecalho(L.kicker, L.title, L.sub)}<div id="vr-body" class="pg-body">${carregando()}</div>${A.botCta(true)}`;
  }
  async function iniciarBrasil() {
    const L = V(), G = t();
    let D, M, muns;
    try { [D, M, muns] = await Promise.all([dados(), X().dado("site/data/mapa.json"), A.municipios()]); } catch (e) { $("#vr-body").innerHTML = erro(e); return; }
    const BR = deCols(D.br);
    const ufs = Object.fromEntries(Object.entries(D.uf).map(([uf, a]) => [uf, Object.assign(deCols(a), { secoes: a[13], esp: a[14], dif: a[15], q: a[16], nivel: a[17] })]));
    const totA = TESTES.reduce((s, id) => s + D.testes[id].a, 0), totI = TESTES.reduce((s, id) => s + D.testes[id].i, 0);
    A.state.cartao = { kicker: L.card_kicker, titulo: L.title, linhas: [[L.pool_items[3], nf(BR.pool)], [`${G.lv_a} / ${G.lv_i}`, `${nf(totA)} / ${nf(totI)}`]],
      barras: barrasVar(BR) };
    const ufOpts = ufsLista().map((u) => `<option value="${u}">${u} – ${esc(A.ufNome(u))}</option>`).join("");
    $("#vr-body").innerHTML = `
      ${duelo(BR)}
      ${origem(BR)}
      <section><h2>${esc(L.testes_t)}</h2><p class="sec-sub small">${esc(L.testes_sub)}</p>${cartoesTestes(D.testes, true)}</section>
      <section class="card"><div class="h-row"><h2>${esc(L.uf_t)}</h2><form class="filters inline" data-vr-m>${selMedida("saldo")}</form></div>
        <p class="small muted">${esc(L.uf_sub)}</p>
        <div class="map-wrap"><div class="map" id="vr-mapa"></div><div class="map-side" id="vr-leg"></div></div></section>
      <section><div class="h-row"><h2>${esc(L.th.uf)}</h2><form class="filters inline" data-vr-ord>${ordSel(["nome", "dL", "dF", "saldo", "dif"], "nome")}</form></div><div id="vr-ufs"></div></section>
      <section><h2>${esc(L.lista_t)}</h2><p class="sec-sub small">${esc(L.lista_sub)}</p><div id="vr-lista"></div></section>
      <section class="card"><h2>${esc(L.busca_t)}</h2>
        <form class="filters" id="vr-busca"><label><span>${esc(L.busca_uf)}</span><select name="uf">${ufOpts}</select></label>
          <label><span>${esc(L.busca_mun)}</span><select name="mun"></select></label><button class="btn btn-primary" type="submit">${icone("search")} ${esc(L.busca_go)}</button></form>
        <p class="small muted">${esc(L.busca_sec)} <a href="#/secao">${esc(G.cta_lookup)}</a></p></section>
      ${relatorio()}`;
    // mapa dos estados
    const pintaMapa = () => {
      const m = $("[data-vr-m]").elements.m.value;
      const val = (uf) => (m === "saldo" ? ufs[uf].saldo : ufs[uf].dif);
      const tip = (uf) => dica(`${A.ufNome(uf)} (${uf})`, ufs[uf], ufs[uf].dif);
      $("#vr-mapa").innerHTML = `<svg viewBox="0 0 ${M.vb[0]} ${M.vb[1]}" role="group" aria-label="${esc(L.uf_t)}">${Object.entries(M.uf).map(([uf, d]) => ufs[uf]
        ? `<a href="#/variacao/${uf}" class="mp-uf ${classe(val(uf), m)}" data-tip="${esc(tip(uf))}" aria-label="${esc(`${A.ufNome(uf)}: ${unid(val(uf), m)}`)}"><path d="${d}"/></a>` : "").join("")}</svg>
        ${ufs.ZZ ? `<a href="#/variacao/ZZ" class="mp-zz ${classe(val("ZZ"), m)}" data-tip="${esc(tip("ZZ"))}"><span class="sw ${classe(val("ZZ"), m)}"></span>${esc(A.ufNome("ZZ"))}: ${esc(unid(val("ZZ"), m))}</a>` : ""}`;
      $("#vr-leg").innerHTML = legenda(m);
    };
    $("[data-vr-m]").addEventListener("change", pintaMapa);
    pintaMapa();
    // tabela dos estados
    const tabUfs = () => {
      const o = $("[data-vr-ord]").elements.o.value;
      const ls = Object.keys(ufs).sort((a, b) => ordenar(o, ufs[a], ufs[b], A.ufNome(a), A.ufNome(b)));
      $("#vr-ufs").innerHTML = tabela([L.th.uf, L.th.L, L.th.F, L.th.O, L.th.BN, L.th.C, L.th.saldo, `${L.th.res} V1`], ls.map((uf) => { const T = ufs[uf];
        return [`<a href="#/variacao/${uf}"><b>${uf}</b></a> <span class="small muted">${esc(A.ufNome(uf))}</span>`, v12(T.L1, T.L2), v12(T.F1, T.F2), nf(T.O1), v12(T.BN1, T.BN2), v12(T.C1, T.C2),
          `<span class="vr-n">${pp(T.saldo)}%</span>`, `<span data-tip="${esc(V().res_uf(pct(T.L2 / (T.L2 + T.F2)), pct(T.esp), pp(T.dif)))}">${chipTeste("V1", T.nivel ? T.nivel[0] : "", true)}</span>`]; }), "vr-tab");
    };
    $("[data-vr-ord]").addEventListener("change", tabUfs);
    tabUfs();
    listaSinais($("#vr-lista"), D.s, muns, false);
    // consulta
    const fb = $("#vr-busca");
    const encher = () => {
      const m = muns[fb.elements.uf.value] || {};
      fb.elements.mun.innerHTML = `<option value="">—</option>` + Object.entries(m).sort((a, b) => a[1][0].localeCompare(b[1][0], "pt")).map(([c, [nm]]) => `<option value="${c}">${esc(A.titulo(nm))}</option>`).join("");
    };
    fb.elements.uf.addEventListener("change", encher);
    encher();
    fb.addEventListener("submit", (e) => { e.preventDefault(); location.hash = `#/variacao/${fb.elements.uf.value}${fb.elements.mun.value ? "/" + fb.elements.mun.value : ""}`; });
    A.efeitos($("#vr-body"));
  }

  function ordSel(ks, atual) {
    const L = V();
    return `<label><span>${esc(L.ordenar)}</span><select name="o">${ks.map((k) => `<option value="${k}"${k === atual ? " selected" : ""}>${esc(L.ord[k])}</option>`).join("")}</select></label>`;
  }
  function ordenar(o, a, b, na, nb) {
    if (o === "dL") return b.dL - a.dL;
    if (o === "dF") return b.dF - a.dF;
    if (o === "saldo") return (b.saldo ?? -1e9) - (a.saldo ?? -1e9);
    if (o === "dif") return Math.abs(b.dif ?? 0) - Math.abs(a.dif ?? 0);
    if (o === "dC") return Math.abs(b.dC) - Math.abs(a.dC);
    return na.localeCompare(nb, "pt");
  }

  function relatorio() {
    const L = V();
    const rel = ["PT", "EN", "ES"].map((lg) => `<a class="btn btn-sm" href="${REL}Relatorio_Tecnico_Auditoria_Eleicoes_2026_${lg}.md" download>${icone("download")} ${esc(L.rel_btn(lg))}</a>`).join("");
    return `<section class="card"><h2>${esc(L.rel_t)}</h2><p>${esc(L.rel_txt)}</p><div class="btn-row">${rel}<a class="btn btn-sm btn-ghost" href="#/downloads">${icone("hash")} ${esc(L.dl_btn)}</a></div></section>`;
  }

  // --- estado ----------------------------------------------------------------------------------------------
  function htmlUf(uf) {
    const L = V();
    return `${cabecalho(L.kicker, `${A.ufNome(uf)} (${uf})`, "", [[L.voltar, "#/variacao"]])}<div id="vr-body" class="pg-body">${carregando()}</div>${A.botCta(true)}`;
  }
  async function iniciarUf(uf) {
    const L = V(), G = t();
    let D, U, muns, MP = null;
    try { [D, U, muns] = await Promise.all([dados(), X().dado(`site/data/ufs/${uf}.json`), A.municipios()]); } catch (e) { $("#vr-body").innerHTML = erro(e); return; }
    if (uf !== "ZZ") { try { MP = await X().dado(`site/data/mapas/${uf}.json`); } catch (e) { MP = null; } }
    const nm = muns[uf] || {}, Dm = D.mun[uf] || {};
    const lin = Object.entries(U.m).map(([cod, m]) => {
      const T = deTurnos(m[2], m[3]), r = Dm[cod] || [null, null, null, "-"];
      return Object.assign(T, { cod, nome: A.titulo((nm[cod] || [cod])[0]), secoes: m[0], esp: r[0], dif: r[1], q: r[2], nivel: r[3] });
    });
    const a = D.uf[uf], T = Object.assign(deCols(a), { esp: a[14], dif: a[15], nivel: a[17] });
    const sUf = D.s.filter((s) => s[2] === uf);
    const cont = {}; TESTES.forEach((id) => { const x = sUf.filter((s) => s[0] === id); cont[id] = { a: x.filter((s) => s[1] === "a").length, i: x.filter((s) => s[1] === "i").length }; });
    A.state.cartao = { kicker: L.card_kicker, titulo: `${A.ufNome(uf)} (${uf})`, linhas: [[L.pool_items[3], nf(T.pool)],
      [`${G.lv_a} / ${G.lv_i}`, `${nf(sUf.filter((s) => s[1] === "a").length)} / ${nf(sUf.filter((s) => s[1] === "i").length)}`]], barras: barrasVar(T) };
    $("#vr-body").innerHTML = `
      ${duelo(T)}
      <section class="card"><h2>${esc(L.local_t)}</h2><p>${chipTeste("V1", T.nivel ? T.nivel[0] : "")} ${esc(L.res_uf(pct(T.L2 / (T.L2 + T.F2)), pct(T.esp), pp(T.dif)))}</p>${cartoesTestes(cont, false)}</section>
      ${origem(T)}
      ${MP ? `<section class="card"><div class="h-row"><h2>${esc(L.mun_map_t)}</h2><form class="filters inline" data-vr-m>${selMedida("saldo")}</form></div>
        <p class="small muted">${esc(L.mun_map_sub)}</p><div class="map-wrap"><div class="map map-uf" id="vr-mapa"></div><div class="map-side" id="vr-leg"></div></div></section>` : ""}
      ${sUf.length ? `<section><h2>${esc(L.lista_t)}</h2><div id="vr-lista"></div></section>` : ""}
      <section><div class="h-row"><h2>${esc(G.uf_mun_title)}</h2><label class="mini-search">${icone("search")}<input type="search" id="vr-q" placeholder="${esc(G.uf_mun_ph)}" aria-label="${esc(G.uf_mun_ph)}"></label></div>
        <div class="h-row"><form class="filters inline" data-vr-ord>${ordSel(["nome", "dL", "dF", "saldo", "dif"], "nome")}</form><button class="btn btn-sm" type="button" id="vr-csv">${icone("download")} ${esc(L.csv)}</button></div>
        <div id="vr-muns"></div></section>
      ${relatorio()}`;
    if (MP) {
      const porCod = Object.fromEntries(lin.map((m) => [m.cod, m]));
      const pinta = () => {
        const md = $("[data-vr-m]").elements.m.value;
        $("#vr-mapa").innerHTML = `<svg viewBox="0 0 ${MP.vb[0]} ${MP.vb[1]}" role="group" aria-label="${esc(L.mun_map_t)}">${Object.entries(MP.m).map(([cod, d]) => {
          const m = porCod[cod]; if (!m) return "";
          const v = md === "saldo" ? m.saldo : m.dif;
          return `<a href="#/variacao/${uf}/${cod}" class="mp-uf ${classe(v, md)}" data-tip="${esc(dica(m.nome, m, m.dif))}" aria-label="${esc(m.nome)}"><path d="${d}"/></a>`;
        }).join("")}</svg>`;
        $("#vr-leg").innerHTML = legenda(md);
      };
      $("[data-vr-m]").addEventListener("change", pinta);
      pinta();
    }
    if (sUf.length) listaSinais($("#vr-lista"), sUf, muns, true);
    let filtrados = lin;
    const tab = () => {
      const q = nz($("#vr-q").value.trim()), o = $("[data-vr-ord]").elements.o.value;
      filtrados = lin.filter((m) => !q || nz(m.nome).includes(q)).sort((x, y) => ordenar(o, x, y, x.nome, y.nome));
      X().paginar($("#vr-muns"), filtrados, 100, (ls) => tabela([L.th.mun, L.th.secoes, L.th.L, L.th.F, L.th.O, L.th.BN, L.th.C, L.th.saldo, `${L.th.res} V2`], ls.map((m) => [
        `<a href="#/variacao/${uf}/${m.cod}">${esc(m.nome)}</a>`, nf(m.secoes), v12(m.L1, m.L2), v12(m.F1, m.F2), nf(m.O1), v12(m.BN1, m.BN2), v12(m.C1, m.C2),
        m.saldo == null ? "—" : `<span class="vr-n">${pp(m.saldo)}%</span>`, m.nivel === "-" ? `<span class="small muted">—</span>` : `<span data-tip="${esc(m.esp == null ? L.res_na : L.res_mun(pct(m.L2 / (m.L2 + m.F2)), pct(m.esp), pp(m.dif)))}">${chipTeste("V2", m.nivel ? m.nivel[0] : "", true)}</span>`]), "vr-tab"));
    };
    $("#vr-q").addEventListener("input", tab);
    $("[data-vr-ord]").addEventListener("change", tab);
    $("#vr-csv").addEventListener("click", () => baixarCsv(`variacao_turnos_${uf}_municipios.csv`,
      ["uf", "codigo_municipio_tse", "municipio", "secoes", "lula_1t", "lula_2t", "variacao_lula", "flavio_1t", "flavio_2t", "variacao_flavio", "demais_1t", "brancos_nulos_1t", "brancos_nulos_2t",
        "comparecimento_1t", "comparecimento_2t", "variacao_comparecimento", "diferenca_ganhos_pct", "lula_esperado_pct", "diferenca_esperado_pp", "q", "resultado_v2"],
      filtrados.map((m) => [uf, m.cod, m.nome, m.secoes, m.L1, m.L2, m.dL, m.F1, m.F2, m.dF, m.O1, m.BN1, m.BN2, m.C1, m.C2, m.dC, m.saldo == null ? "" : m.saldo.toFixed(2),
        m.esp == null ? "" : (100 * m.esp).toFixed(2), m.dif == null ? "" : m.dif.toFixed(2), m.q ?? "", m.nivel === "-" ? "" : rotNivel(m.nivel ? m.nivel[0] : "")])));
    tab();
    A.efeitos($("#vr-body"));
  }
  const nz = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // --- município -------------------------------------------------------------------------------------------
  function htmlMun() { return `<div id="vr-body" class="pg-body">${carregando()}</div>${A.botCta(true)}`; }
  async function iniciarMun(uf, cod) {
    const L = V(), G = t();
    let D, U, muns;
    try { [D, U, muns] = await Promise.all([dados(), X().dado(`site/data/ufs/${uf}.json`), A.municipios()]); } catch (e) { $("#vr-body").innerHTML = erro(e); return; }
    const m = U.m[cod];
    if (!m) { $("#vr-body").innerHTML = `<p class="alert">${esc(G.mu_none)}</p><p><a href="#/variacao/${uf}">${esc(A.ufNome(uf) || uf)}</a></p>`; return; }
    const nome = A.titulo(((muns[uf] || {})[cod] || [cod])[0]);
    document.title = `${nome} (${uf}) · ${L.title} · ${G.brand}`;
    const r = (D.mun[uf] || {})[cod] || [null, null, null, "-"];
    const T = Object.assign(deTurnos(m[2], m[3]), { esp: r[0], dif: r[1], nivel: r[3] });
    const sM = D.s.filter((s) => s[2] === uf && s[3] === cod);
    const porSec = {}; sM.filter((s) => s[4] != null).forEach((s) => { (porSec[`${s[4]}/${s[5]}`] = porSec[`${s[4]}/${s[5]}`] || []).push(s); });
    const cont = {}; TESTES.forEach((id) => { const x = sM.filter((s) => s[0] === id); cont[id] = { a: x.filter((s) => s[1] === "a").length, i: x.filter((s) => s[1] === "i").length }; });
    A.state.cartao = { kicker: `${A.ufNome(uf)} (${uf}) · ${L.card_kicker}`, titulo: nome, linhas: [[L.pool_items[3], nf(T.pool)],
      [`${G.lv_a} / ${G.lv_i}`, `${nf(sM.filter((s) => s[1] === "a").length)} / ${nf(sM.filter((s) => s[1] === "i").length)}`]], barras: barrasVar(T) };
    const res = r[3] === "-" || r[0] == null ? `<p class="small muted">${esc(L.res_na)}</p>` : `<p>${chipTeste("V2", r[3] ? r[3][0] : "")} ${esc(L.res_mun(pct(T.L2 / (T.L2 + T.F2)), pct(T.esp), pp(T.dif)))}</p>`;
    $("#vr-body").innerHTML = `${cabecalho(L.kicker, nome, "", [[L.voltar, "#/variacao"], [`${A.ufNome(uf)} (${uf})`, `#/variacao/${uf}`]])}
      ${duelo(T)}
      <section class="card"><h2>${esc(L.local_t)}</h2>${res}${cartoesTestes(cont, false)}</section>
      ${origem(T)}
      ${sM.length ? `<section><h2>${esc(L.lista_t)}</h2><div id="vr-lista"></div></section>` : ""}
      <section><div class="h-row"><h2>${esc(L.secs_t)}</h2>${m[0] > 400 ? `<button class="btn btn-sm" type="button" id="vr-load">${icone("list")} ${esc(L.secs_btn(nf(m[0])))}</button>` : ""}</div><div id="vr-secs"></div></section>
      ${relatorio()}`;
    if (sM.length) listaSinais($("#vr-lista"), sM, muns, true);
    const carregar = async () => {
      const box = $("#vr-secs");
      box.innerHTML = carregando();
      const zs = await Promise.all(m[1].map((z) => A.zona(uf, z).then((Z) => [z, Z])));
      const linhas = [];
      zs.forEach(([z, Z]) => {
        if (!Z) return;
        const idx = Z.mun.findIndex((x) => x[0] === cod);
        Object.entries(Z.s).forEach(([s, rec]) => {
          if (rec[0] !== idx) return;
          const S = deTurnos(rec[1], rec[2]);
          linhas.push(Object.assign(S, { z, s: +s, ambos: !!(rec[1] && rec[2]), sin: porSec[`${z}/${s}`] || [] }));
        });
      });
      box.innerHTML = `<div class="h-row"><form class="filters inline" data-vr-sord>${ordSel(["zs", "dL", "dF", "dC"], "zs")}
          <label class="vr-chk"><input type="checkbox" name="so"> ${esc(L.so_sinal)}</label></form>
        <button class="btn btn-sm" type="button" id="vr-scsv">${icone("download")} ${esc(L.csv)}</button></div><div id="vr-stab"></div>`;
      const f = $("[data-vr-sord]");
      let vis = linhas;
      const tab = () => {
        const o = f.elements.o.value;
        vis = linhas.filter((x) => !f.elements.so.checked || x.sin.length).sort((a, b) => (o === "zs" ? a.z - b.z || a.s - b.s : ordenar(o, a, b)));
        if (!vis.length) { $("#vr-stab").innerHTML = `<p>${chip("green", L.nenhum)}</p>`; return; }
        X().paginar($("#vr-stab"), vis, 100, (ls) => tabela([L.th.zona, L.th.secao, L.th.L, L.th.F, L.th.O, L.th.BN, L.th.C, L.th.sinais], ls.map((x) => [x.z,
          `<a href="#/secao/${uf}/${x.z}/${x.s}">${x.s}</a>`, x.ambos ? v12(x.L1, x.L2) : "—", x.ambos ? v12(x.F1, x.F2) : "—", nf(x.O1), x.ambos ? v12(x.BN1, x.BN2) : "—", x.ambos ? v12(x.C1, x.C2) : "—",
          x.sin.length ? x.sin.map((s) => `<span data-tip="${esc(`${s[0]}. ${L.nomes[s[0]]}\n${medida(s)}`)}">${chipTeste(s[0], s[1])}</span>`).join(" ") : `<span class="small muted">—</span>`]), "vr-tab"));
      };
      f.addEventListener("change", tab);
      $("#vr-scsv").addEventListener("click", () => baixarCsv(`variacao_turnos_${uf}_${cod}_secoes.csv`,
        ["uf", "codigo_municipio_tse", "municipio", "zona", "secao", "lula_1t", "lula_2t", "variacao_lula", "flavio_1t", "flavio_2t", "variacao_flavio", "demais_1t", "brancos_nulos_1t", "brancos_nulos_2t",
          "comparecimento_1t", "comparecimento_2t", "variacao_comparecimento", "aptos_1t", "aptos_2t", "sinais"],
        vis.map((x) => [uf, cod, nome, x.z, x.s, x.L1, x.L2, x.dL, x.F1, x.F2, x.dF, x.O1, x.BN1, x.BN2, x.C1, x.C2, x.dC, x.A1, x.A2, x.sin.map((s) => `${s[0]}:${s[1] === "a" ? G.lv_a : G.lv_i}`).join(" ")])));
      tab();
    };
    if (m[0] > 400) $("#vr-load").addEventListener("click", (e) => { e.currentTarget.disabled = true; carregar(); });
    else carregar();
    A.efeitos($("#vr-body"));
  }

  // --- seção: cartão na consulta de seção ------------------------------------------------------------------
  document.addEventListener("secao", async (e) => {
    const { uf, z, s } = e.detail, box = $("#lk-result");
    if (!box || $(".vr-sec", box)) return;
    const L = V(), G = t();
    let D, d;
    try { [D, d] = await Promise.all([dados(), A.consultarSecao(uf, z, s)]); } catch (err) { return; }
    if (!d || !d.rec || !$("#lk-result") || $(".vr-sec", box)) return;
    const rec = d.rec, sin = D.s.filter((x) => x[2] === uf && x[4] === +z && x[5] === +s);
    let corpo;
    if (!rec[1] || !rec[2]) corpo = `<p class="small muted">${esc(L.sec_nodata)}</p>`;
    else {
      const T = deTurnos(rec[1], rec[2]);
      corpo = `<div class="vr-mini">${[[L.lula, T.L1, T.L2, "l"], [L.flavio, T.F1, T.F2, "f"]].map(([n, a, b, k]) => `<p><span class="vr-sw vr-${k}" aria-hidden="true"></span><b>${esc(n)}</b> ${v12(a, b)}</p>`).join("")}
        <p class="small">${esc(L.pool_items[0])}: ${nf(T.O1)} · ${esc(G.blank)} + ${esc(G.null_)}: ${v12(T.BN1, T.BN2)} · ${esc(G.st_comp)}: ${v12(T.C1, T.C2)}</p></div>`;
    }
    const sinais = sin.length ? `<ul class="plain">${sin.map((x) => `<li>${chipTeste(x[0], x[1])} <b>${esc(L.nomes[x[0]])}</b><br><span class="small">${esc(medida(x))}</span></li>`).join("")}</ul>` : `<p>${chip("green", L.ok)} ${esc(L.sec_none)}</p>`;
    box.insertAdjacentHTML("beforeend", `<section class="card vr-sec"><h2>${esc(L.sec_t)}</h2>${corpo}${sinais}
      <p class="btn-row"><a class="btn btn-sm" href="#/variacao/${uf}/${d.mun[0]}">${icone("chart")} ${esc(L.sec_more)}</a><a class="btn btn-sm btn-ghost" href="#/variacao">${esc(L.title)}</a></p></section>`);
  });

  // --- destaque na página inicial e na página do 2º turno ----------------------------------------------------
  A.destaqueVariacao = function (compacto) {
    const L = V(), Rr = R(), P1 = Rr.turnos["1"].presidente.candidatos, P2 = Rr.turnos["2"].presidente.candidatos;
    const v = (P, nr) => (P.find((c) => c.nr === nr) || { votos: 0 }).votos;
    const dL = v(P2, "13") - v(P1, "13"), dF = v(P2, "22") - v(P1, "22");
    const Vt = Rr.variacao ? Rr.variacao.testes : null;
    const totA = Vt ? TESTES.reduce((s, id) => s + Vt[id].a, 0) : null, totI = Vt ? TESTES.reduce((s, id) => s + Vt[id].i, 0) : null;
    const num = (k, nome, d) => `<div class="vr-dest-n vr-${k}"><span class="vr-sw" aria-hidden="true"></span><span>${esc(nome)}</span><b>${seta(d)} ${sn(d)}</b></div>`;
    return `<section class="vr-dest${compacto ? " compacto" : ""}" aria-labelledby="vr-dest-h">
      <div class="vr-dest-txt"><p class="kicker">${esc(L.dest_kicker)}</p><h2 id="vr-dest-h">${esc(L.dest_t)}</h2><p>${esc(L.dest_txt)}</p>
        <div class="btn-row"><a class="btn btn-primary btn-lg" href="#/variacao">${icone("chart")} ${esc(L.dest_btn)}</a>${compacto ? "" : `<a class="btn btn-ghost" href="#/secao">${icone("search")} ${esc(t().cta_lookup)}</a>`}</div></div>
      <div class="vr-dest-nums">${num("l", L.lula, dL)}${num("f", L.flavio, dF)}${totA != null ? `<p class="small">${chip(totA ? "red" : "green", L.dest_sinais(nf(totA), nf(totI)))}</p>` : ""}</div>
    </section>`;
  };

  // --- registro da página ----------------------------------------------------------------------------------
  A.paginas.variacao = {
    ativo: "vary",
    titulo: (p) => {
      const uf = (p[1] || "").toUpperCase();
      return uf && window.UF_NOMES[uf] && !p[2] ? `${A.ufNome(uf)} · ${V().title}` : V().title;
    },
    html: (p) => {
      const uf = (p[1] || "").toUpperCase();
      if (uf && window.UF_NOMES[uf]) return p[2] ? htmlMun() : htmlUf(uf);
      return htmlBrasil();
    },
    async iniciar(p) {
      const uf = (p[1] || "").toUpperCase();
      if (uf && window.UF_NOMES[uf]) return p[2] ? iniciarMun(uf, p[2]) : iniciarUf(uf);
      return iniciarBrasil();
    },
  };
})();
