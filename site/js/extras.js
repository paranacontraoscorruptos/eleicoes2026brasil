/* Páginas e recursos extras: locais de votação, perguntas frequentes, anatomia do boletim, consulta avançada
   (SQL no navegador), kit de imprensa, incorporar (modo incorporado), para programadores, provas e cópias
   e linguagem simples. */
(function () {
  "use strict";

  const A = window.APP;
  const { esc, icone, tabela, chip, $, $$ } = A;
  const t = () => A.t(), X = () => A.t().ex;
  const nf = (n) => A.nf(n), pct = (x, d) => A.pct(x, d);
  const R = () => A.state.R;
  const dado = (u) => A.paginasExtra.dado(u);
  const SITE = "https://paranacontraoscorruptos.org/";
  const QS = new URLSearchParams(location.search);
  const EMBED = QS.get("embed") === "1";
  if (EMBED) document.documentElement.classList.add("embed");

  const carregando = (txt) => `<p class="muted">${esc(txt || t().lk_loading)}</p>`;
  const erroDados = (e) => `<p class="alert">${esc(t().x_err)} (${esc(e.message)})</p>`;
  function cabecalho(tit, sub, img, extra) {
    return `<header class="page-head"><h1>${esc(tit)}</h1>${sub ? `<p class="lead">${esc(sub)}</p>` : ""}${A.acoes(img, extra)}</header>`;
  }
  function copiar(txt) { return `<button class="btn-copy" type="button" data-copy="${esc(txt)}" aria-label="${esc(t().copy)}">${icone("copy")}<span>${esc(t().copy)}</span></button>`; }
  function blocoCodigo(txt) { return `<div class="code"><pre><code>${esc(txt)}</code></pre>${copiar(txt)}</div>`; }
  const tamanho = (b) => (b >= 1048576 ? `${A.dec((b / 1048576).toFixed(1))} MB` : `${A.dec(Math.max(1, Math.round(b / 1024)).toString())} KB`);
  const nz = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // Markdown curto: parágrafos, listas "- ", **negrito**, `código` e [texto](link)
  function md(s) {
    const inline = (x) => esc(x).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, href) => `<a href="${href}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ""}>${txt}</a>`);
    return String(s).split(/\n{2,}/).map((bl) => {
      const ls = bl.split("\n");
      if (ls.every((l) => /^- /.test(l))) return `<ul>${ls.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
      return `<p>${ls.map(inline).join("<br>")}</p>`;
    }).join("");
  }
  const semMd = (s) => String(s).replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");

  function baixar(nome, conteudo, tipo) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const a = document.createElement("a");
    a.href = url; a.download = nome; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  const hoje = () => new Date().toLocaleDateString({ PT: "pt-BR", EN: "en-US", ES: "es-ES" }[A.state.lang]);
  const munNome = async (uf, cod) => { const M = await A.municipios(); const m = M[uf] && M[uf][cod]; return m ? A.titulo(m[0]) : cod; };

  // --- menu: páginas novas na fileira de ferramentas ---------------------------------------------------------
  [["sim", "#/simulador"], ["places", "#/locais"], ["faq", "#/perguntas"], ["anatomy", "#/anatomia"], ["query", "#/consulta"], ["press", "#/imprensa"], ["embed", "#/incorporar"], ["devs", "#/dados"], ["proofs", "#/provas"]]
    .forEach((x) => A.MAIS.push(x));
  Object.assign(A.ICO_MAIS, { sim: "lab", places: "building", faq: "help", anatomy: "receipt", query: "db", press: "news", embed: "code", devs: "braces", proofs: "seal" });

  // ===================================================================================================
  // Sinalizações por seção (a partir de ocorrencias.json): "UF|zona|seção" -> {turno: [[teste, nível]]}
  // ===================================================================================================
  let sinIdx = null;
  async function sinalizacoes() {
    if (sinIdx) return sinIdx;
    const oc = await A.paginasExtra.ocorrencias();
    const m = new Map();
    oc.forEach((r) => {
      const k = `${r[0]}|${r[2]}|${r[3]}`;
      let x = m.get(k); if (!x) m.set(k, x = { 1: [], 2: [] });
      x[r[4]].push([r[5], r[6]]);
    });
    return (sinIdx = m);
  }
  const anomalias = (S, uf, z, s, n) => { const x = S.get(`${uf}|${z}|${s}`); if (!x) return 0; return (n ? x[n] : x[1].concat(x[2])).filter((o) => o[1] === "a").length; };

  // ===================================================================================================
  // Locais de votação
  // ===================================================================================================
  const locais = (uf) => dado(`site/data/locais/${uf}.json`).then((d) => d.l);
  const indiceLoc = () => dado("site/data/locais/indice.json");
  const idLocal = (l) => `${l[0]}-${l[1]}`;
  const ufsLoc = () => Object.keys(window.UF_NOMES).sort((a, b) => (a === "ZZ") - (b === "ZZ") || A.ufNome(a).localeCompare(A.ufNome(b)));
  const COR_CAND = { 13: "c0", 22: "c1" };
  const corCand = (nr) => COR_CAND[nr] || "co";
  const linkOsm = (l) => `https://www.openstreetmap.org/?mlat=${l[6]}&mlon=${l[7]}#map=18/${l[6]}/${l[7]}`;

  function migalhas(itens) {
    return `<nav class="lc-crumbs" aria-label="${esc(X().lc_title)}">${itens.map(([txt, h], i) => (h && i < itens.length - 1 ? `<a href="${h}">${esc(txt)}</a>` : `<span>${esc(txt)}</span>`)).join(`<span aria-hidden="true">›</span>`)}</nav>`;
  }
  function cardLocal(l, uf, S, extra) {
    const E = X(), n = sinLocal(S, uf, l);
    return `<a class="lc-item" href="#/locais/${uf}/${l[2]}/${idLocal(l)}"><span class="lc-ico">${icone("building")}</span><span class="lc-txt">
      <b>${esc(A.titulo(l[3]))}</b><span class="small muted">${esc([l[4], l[5]].filter(Boolean).map(A.titulo).join(" · "))}</span>
      <span class="lc-meta"><span>${esc(E.lc_zona)} ${l[0]} · ${esc(E.lc_local)} ${l[1]}</span><span>${esc(E.lc_n_secoes(nf(l[10].length)))}</span>${n ? chip("red", E.lc_sin(nf(n))) : ""}${extra || ""}</span></span></a>`;
  }
  const sinLocal = (S, uf, l) => l[10].reduce((a, s) => a + anomalias(S, uf, l[0], s), 0);

  const pgLocais = {
    ativo: "places",
    titulo: (p) => X().lc_title,
    html(p) {
      const E = X(), uf = (p[1] || "").toUpperCase();
      if (!window.UF_NOMES[uf]) {
        return `${cabecalho(E.lc_title, E.lc_sub, false)}
          <section class="card lc-perto"><div class="h-row"><h2>${icone("locate")} ${esc(E.lc_near)}</h2><button class="btn btn-primary" type="button" id="lc-perto">${icone("locate")} ${esc(E.lc_near)}</button></div>
            <p class="small muted">${esc(E.lc_near_note)}</p><div id="lc-perto-r"></div></section>
          <section><h2>${esc(E.lc_uf_t)}</h2><div class="lc-ufs" id="lc-ufs">${carregando()}</div></section>${A.botCta()}`;
      }
      if (!p[2]) {
        return `${migalhas([[E.lc_title, "#/locais"], [A.ufNome(uf), ""]])}${cabecalho(`${E.lc_title} · ${A.ufNome(uf)}`, E.lc_sub, false)}
          <label class="mini-search big">${icone("search")}<input type="search" id="lc-q" placeholder="${esc(E.lc_ph_mun)}" aria-label="${esc(E.lc_ph_mun)}"></label>
          <div id="lc-muns">${carregando(E.lc_carregando)}</div>${A.botCta()}`;
      }
      if (!p[3]) {
        return `<div id="lc-head">${migalhas([[E.lc_title, "#/locais"], [A.ufNome(uf), `#/locais/${uf}`], ["…", ""]])}${cabecalho(E.lc_title, "", false)}</div>
          <div class="lc-tools"><label class="mini-search big">${icone("search")}<input type="search" id="lc-q" placeholder="${esc(E.lc_ph)}" aria-label="${esc(E.lc_ph)}" value="${esc(A.state.query.get("b") || "")}"></label>
            <label class="lc-ord"><span>${esc(E.lc_ordem)}</span><select id="lc-ord"><option value="nome">${esc(E.lc_o_nome)}</option><option value="bairro">${esc(E.lc_o_bairro)}</option><option value="sec">${esc(E.lc_o_sec)}</option><option value="sin">${esc(E.lc_o_sin)}</option></select></label></div>
          <p class="small muted" id="lc-n"></p><div id="lc-lista">${carregando(E.lc_carregando)}</div><p class="small muted">${esc(E.lc_fonte)}</p>${A.botCta()}`;
      }
      return `<div id="lc-det">${carregando(E.lc_carregando)}</div>${A.botCta()}`;
    },
    async iniciar(p) {
      const E = X(), uf = (p[1] || "").toUpperCase();
      try {
        if (!window.UF_NOMES[uf]) return await iniciarInicio();
        if (!p[2]) return await iniciarUfLoc(uf);
        if (!p[3]) return await iniciarMunLoc(uf, p[2]);
        return await iniciarLocal(uf, p[2], p[3]);
      } catch (e) {
        const box = $("#lc-det") || $("#lc-lista") || $("#lc-muns") || $("#lc-ufs");
        if (box) box.innerHTML = erroDados(e);
      }

      async function iniciarInicio() {
        const I = await indiceLoc();
        $("#lc-ufs").innerHTML = ufsLoc().filter((u) => I[u]).map((u) => `<a class="lc-uf" href="#/locais/${u}"><b>${u}</b><span>${esc(A.ufNome(u))}</span>
          <small>${esc(E.lc_n_locais(nf(I[u].locais)))} · ${esc(E.lc_n_secoes(nf(I[u].secoes)))}</small></a>`).join("");
        $("#lc-perto").addEventListener("click", pertoDeMim);
      }

      async function pertoDeMim() {
        const box = $("#lc-perto-r");
        if (!navigator.geolocation) { box.innerHTML = `<p class="alert">${esc(E.lc_near_err)}</p>`; return; }
        box.innerHTML = carregando(E.lc_near_wait);
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const la = pos.coords.latitude, lo = pos.coords.longitude;
          const I = await indiceLoc();
          const ufs = Object.keys(I).filter((u) => { const c = I[u].caixa; return c && la >= c[0] - 0.3 && la <= c[2] + 0.3 && lo >= c[1] - 0.3 && lo <= c[3] + 0.3; });
          const rad = Math.PI / 180, dist = (a, b) => { const dLa = (a - la) * rad, dLo = (b - lo) * rad; const h = Math.sin(dLa / 2) ** 2 + Math.cos(la * rad) * Math.cos(a * rad) * Math.sin(dLo / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
          const perto = [];
          const [S] = await Promise.all([sinalizacoes()]);
          for (const u of ufs) (await locais(u)).forEach((l) => { if (l[6] != null) perto.push([dist(l[6], l[7]), u, l]); });
          perto.sort((a, b) => a[0] - b[0]);
          const top = perto.slice(0, 12);
          box.innerHTML = top.length ? `<h3>${esc(E.lc_near_t)}</h3><div class="lc-lista">${top.map(([d, u, l]) => cardLocal(l, u, S, `<span class="lc-dist">${esc(E.lc_dist(A.dec(d.toFixed(d < 10 ? 1 : 0))))}</span>`)).join("")}</div>`
            : `<p class="muted">${esc(E.lc_near_none)}</p>`;
        }, () => { box.innerHTML = `<p class="alert">${esc(E.lc_near_err)}</p>`; }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
      }

      async function iniciarUfLoc(uf) {
        const [L, M] = await Promise.all([locais(uf), A.municipios()]);
        const por = {};
        L.forEach((l) => { const x = por[l[2]] = por[l[2]] || [0, 0]; x[0]++; x[1] += l[10].length; });
        const muns = Object.keys(por).map((cod) => ({ cod, nome: A.titulo((M[uf] && M[uf][cod] || [cod])[0]), n: por[cod] })).sort((a, b) => a.nome.localeCompare(b.nome));
        const desenhar = () => {
          const q = nz($("#lc-q").value.trim());
          const ls = muns.filter((m) => !q || nz(m.nome).includes(q));
          $("#lc-muns").innerHTML = ls.length ? `<ul class="lc-muns">${ls.map((m) => `<li><a href="#/locais/${uf}/${m.cod}"><b>${esc(m.nome)}</b><small>${esc(E.lc_n_locais(nf(m.n[0])))} · ${esc(E.lc_n_secoes(nf(m.n[1])))}</small></a></li>`).join("")}</ul>`
            : `<p class="muted">${esc(E.lc_none)}</p>`;
        };
        $("#lc-q").addEventListener("input", desenhar);
        desenhar();
      }

      async function iniciarMunLoc(uf, cod) {
        const [L, S, nome] = await Promise.all([locais(uf), sinalizacoes(), munNome(uf, cod)]);
        document.title = `${E.lc_title} · ${nome} · ${t().brand}`;
        $("#lc-head").innerHTML = migalhas([[E.lc_title, "#/locais"], [A.ufNome(uf), `#/locais/${uf}`], [nome, ""]])
          + cabecalho(`${E.lc_title} · ${nome} (${uf})`, E.lc_sub, false, `<a class="btn btn-sm" href="#/uf/${uf}/${cod}">${icone("pin")} ${esc(E.lc_all_mun)}</a>`);
        const ls = L.filter((l) => l[2] === cod).map((l) => ({ l, sin: sinLocal(S, uf, l), txt: nz([l[3], l[4], l[5]].join(" ")) }));
        let mostrar = 120;
        const desenhar = () => {
          const qq = $("#lc-q").value.trim(), q = nz(qq), num = /^\d+$/.test(qq) ? +qq : null, ord = $("#lc-ord").value;
          const f = ls.filter((x) => !q || x.txt.includes(q) || (num != null && (x.l[10].includes(num) || x.l[1] === num)));
          f.sort(ord === "sec" ? (a, b) => b.l[10].length - a.l[10].length : ord === "sin" ? (a, b) => b.sin - a.sin || a.l[3].localeCompare(b.l[3])
            : ord === "bairro" ? (a, b) => (a.l[5] || "").localeCompare(b.l[5] || "") || a.l[3].localeCompare(b.l[3]) : (a, b) => a.l[3].localeCompare(b.l[3]));
          $("#lc-n").textContent = `${E.lc_n_locais(nf(f.length))} · ${E.lc_n_secoes(nf(f.reduce((a, x) => a + x.l[10].length, 0)))}`;
          $("#lc-lista").innerHTML = f.length ? `<div class="lc-lista">${f.slice(0, mostrar).map((x) => cardLocal(x.l, uf, S)).join("")}</div>`
            + (f.length > mostrar ? `<div class="btn-row lc-mais"><button class="btn" type="button" id="lc-mais">${esc(E.lc_mais)} (${nf(f.length - mostrar)})</button></div>` : "")
            : `<p class="muted">${esc(E.lc_none)}</p>`;
          const b = $("#lc-mais"); if (b) b.addEventListener("click", () => { mostrar += 200; desenhar(); });
        };
        $("#lc-q").addEventListener("input", () => { mostrar = 120; desenhar(); });
        $("#lc-ord").addEventListener("change", desenhar);
        desenhar();
      }

      async function iniciarLocal(uf, cod, id) {
        const [z, nr] = id.split("-").map((x) => parseInt(x, 10));
        const [L, S, nome] = await Promise.all([locais(uf), sinalizacoes(), munNome(uf, cod)]);
        const l = L.find((x) => x[0] === z && x[1] === nr && x[2] === cod);
        if (!l) { $("#lc-det").innerHTML = `<p class="alert">${esc(E.lc_nao_achou)}</p>`; return; }
        const Z = await A.zona(uf, z);
        const LL = t(), T2 = R().turnos["2"].presidente.candidatos.filter((c) => c.nr !== "95" && c.nr !== "96").map((c) => c.nr);
        let n = A.state.query.get("t") === "1" ? 1 : 2;
        document.title = `${A.titulo(l[3])} · ${t().brand}`;
        const desenhar = () => {
          const linhas = l[10].map((s) => {
            const rec = Z && Z.s[String(s)], tv = rec && rec[n];
            if (!tv) return { s, tv: null };
            const { v } = A.votosTurno(n, tv);
            const val = Object.keys(v).filter((k) => k !== "95" && k !== "96").reduce((a, k) => a + v[k], 0);
            return { s, tv, v, val, sin: (S.get(`${uf}|${z}|${s}`) || { 1: [], 2: [] })[n] };
          });
          const ok = linhas.filter((x) => x.tv);
          const tot = { aptos: 0, comp: 0, val: 0, v: {} };
          ok.forEach((x) => { tot.aptos += x.tv[0]; tot.comp += x.tv[1]; tot.val += x.val; Object.keys(x.v).forEach((k) => { tot.v[k] = (tot.v[k] || 0) + x.v[k]; }); });
          const cols = T2.slice();
          const outros = n === 1;
          const share = (x, k) => (x.val ? (k === "o" ? x.val - cols.reduce((a, c) => a + (x.v[c] || 0), 0) : x.v[k] || 0) / x.val : 0);
          const lider = cols.slice().sort((a, b) => (tot.v[b] || 0) - (tot.v[a] || 0))[0];
          const nomes = {}; R().turnos[n].presidente.candidatos.forEach((c) => { nomes[c.nr] = c.nome; });
          const nomeC = (k) => `${A.titulo(nomes[k] || k)} (${k})`;
          const comVal = ok.filter((x) => x.val > 0);
          const dif = (x) => {
            const outrasS = comVal.filter((y) => y !== x);
            if (!x.val || outrasS.length < 1) return null;
            return 100 * (share(x, lider) - outrasS.reduce((a, y) => a + share(y, lider), 0) / outrasS.length);
          };
          const chipsSin = (sin) => (sin && sin.length ? [...new Map(sin.map((o) => [o[0], o])).values()].map((o) => `<a href="#/testes/${o[0]}" class="chip-link">${chip(o[1] === "a" ? "red" : "amber", A.numTeste(o[0]))}</a>`).join(" ") : "—");
          const sinN = ok.reduce((a, x) => a + (x.sin || []).filter((o) => o[1] === "a").length, 0);
          const cab = [E.lc_th_sec, E.lc_th_aptos, E.lc_th_comp, E.lc_th_ab, E.lc_th_enc].concat(cols.map(nomeC)).concat(outros ? [E.lc_outros] : [])
            .concat([E.lc_th_br, E.lc_th_nu, comVal.length > 1 ? E.lc_th_dif : null, E.lc_th_sin]).filter((c) => c != null).map(esc);
          const pc = (x) => A.dec((100 * x).toFixed(1)) + "%";
          const corpo = linhas.map((x) => {
            const sLink = `<a href="#/secao/${uf}/${z}/${x.s}">${x.s}</a>`;
            if (!x.tv) return [sLink, "—", "—", "—", "—"].concat(cols.map(() => "—")).concat(outros ? ["—"] : []).concat(["—", "—"]).concat(comVal.length > 1 ? ["—"] : []).concat(["—"]);
            const d = dif(x);
            return [sLink, nf(x.tv[0]), `${nf(x.tv[1])} <small class="muted">${pct(x.tv[1] / x.tv[0], 1)}</small>`, A.hora(x.tv[2]), A.hora(x.tv[3])]
              .concat(cols.map((k) => `${pc(share(x, k))} <small class="muted">${nf(x.v[k] || 0)}</small>`)).concat(outros ? [pc(share(x, "o"))] : [])
              .concat([nf(x.v["95"] || 0), nf(x.v["96"] || 0)])
              .concat(comVal.length > 1 ? [d == null ? "—" : `<span class="lc-dif" style="--a:${Math.min(1, Math.abs(d) / 25).toFixed(2)}">${d > 0 ? "+" : d < 0 ? "−" : ""}${A.dec(Math.abs(d).toFixed(1))} p.p.</span>`] : [])
              .concat([chipsSin(x.sin)]);
          });
          const tx = { val: tot.val, v: tot.v };
          corpo.push([`<b>${esc(E.lc_media)}</b>`, `<b>${nf(tot.aptos)}</b>`, `<b>${nf(tot.comp)}</b> <small class="muted">${tot.aptos ? pct(tot.comp / tot.aptos, 1) : ""}</small>`, "", ""]
            .concat(cols.map((k) => `<b>${pc(share(tx, k))}</b>`)).concat(outros ? [`<b>${pc(share(tx, "o"))}</b>`] : [])
            .concat([`<b>${nf(tot.v["95"] || 0)}</b>`, `<b>${nf(tot.v["96"] || 0)}</b>`]).concat(comVal.length > 1 ? [""] : []).concat([""]));
          const segs = (x) => cols.map((k) => [k, share(x, k)]).concat(outros ? [["o", share(x, "o")]] : []);
          const barras = ok.map((x) => `<div class="lc-bar-row" tabindex="0" data-tip="${esc(`${E.lc_th_sec} ${x.s}\n` + segs(x).map(([k, f]) => `${k === "o" ? E.lc_outros : nomeC(k)}: ${pc(f)}`).join("\n"))}">
              <span class="lc-bar-l">${x.s}</span><span class="lc-bar">${segs(x).map(([k, f]) => `<span class="lc-seg ${k === "o" ? "co" : corCand(k)}" style="width:${(100 * f).toFixed(2)}%"></span>`).join("")}</span></div>`).join("");
          const leg = `<ul class="legend inline gr-leg">${cols.map((k) => `<li><span class="lc-dot ${corCand(k)}"></span>${esc(nomeC(k))}</li>`).join("")}${outros ? `<li><span class="lc-dot co"></span>${esc(E.lc_outros)}</li>` : ""}</ul>`;
          const ag = l[11] ? Object.entries(l[11]).map(([pp, a]) => E.lc_agreg_txt(pp, a.join(", "))).join(" · ") : "";
          const tags = [`${E.lc_zona} ${z}`, `${E.lc_local} ${nr}`, E.lc_n_secoes(nf(l[10].length)), l[9] ? E.lc_acess : E.lc_sem_acess].concat(l[8] !== 1 ? [E.lc_tipo[l[8]] || ""] : []);
          const cart = [["t", LL.round(n)], ["l", E.lc_n_secoes(nf(l[10].length)), ""], ["l", LL.lk_comp, `${nf(tot.comp)} / ${nf(tot.aptos)}`]];
          A.barrasCartao(n, tot.v, nomes, 2).itens.forEach((it) => cart.push(["b"].concat(it)));
          A.state.cartao = { kicker: `${uf} · ${nome} · ${E.lc_kicker}`, titulo: A.titulo(l[3]), itens: cart };
          $("#lc-det").innerHTML = `${migalhas([[E.lc_title, "#/locais"], [A.ufNome(uf), `#/locais/${uf}`], [nome, `#/locais/${uf}/${cod}`], [A.titulo(l[3]), ""]])}
            <header class="page-head"><p class="kicker">${esc(E.lc_kicker)}</p><h1>${esc(A.titulo(l[3]))}</h1>
              <p class="lead">${esc([l[4], l[5]].filter(Boolean).map(A.titulo).join(" · "))} — ${esc(nome)} (${uf})</p>
              <p class="lc-tags">${tags.map((x) => `<span class="lc-tag">${esc(x)}</span>`).join("")}</p>
              ${A.acoes(true, (l[6] != null ? `<a class="btn btn-sm" href="${linkOsm(l)}" target="_blank" rel="noopener" title="${esc(E.lc_mapa_note)}">${icone("map")} ${esc(E.lc_mapa)}</a>` : "")
                + `<a class="btn btn-sm btn-ghost" href="#/locais/${uf}/${cod}?b=${encodeURIComponent(l[5] || "")}">${icone("building")} ${esc(E.lc_bairro)}</a>`)}</header>
            ${l[6] == null ? `<p class="small muted">${esc(E.lc_sem_coord)}</p>` : ""}
            <section><div class="h-row"><h2>${esc(E.lc_resumo_t)}</h2><form class="filters inline" id="lc-turno"><label><span>${esc(LL.x_round)}</span><select name="t"><option value="2"${n === 2 ? " selected" : ""}>${esc(LL.round(2))}</option><option value="1"${n === 1 ? " selected" : ""}>${esc(LL.round(1))}</option></select></label></form></div><dl class="kv">
              <div><dt>${esc(LL.th_sections)}</dt><dd>${nf(l[10].length)}</dd></div><div><dt>${esc(E.lc_th_aptos)}</dt><dd>${nf(tot.aptos)}</dd></div>
              <div><dt>${esc(E.lc_th_comp)}</dt><dd>${nf(tot.comp)} <small>${tot.aptos ? pct(tot.comp / tot.aptos, 1) : ""}</small></dd></div>
              <div><dt>${esc(E.lc_th_sin)}</dt><dd>${nf(sinN)}</dd></div></dl></section>
            <section class="card"><h2>${esc(E.lc_barras_t)}</h2>${leg}<div class="lc-bars">${barras}</div></section>
            <section><h2>${esc(E.lc_secoes_t)}</h2>${tabela(cab, corpo, "num-cols lc-tab")}
              ${comVal.length > 1 ? `<p class="small muted">${esc(E.lc_dif_note(nomeC(lider)))}</p>` : ""}${ag ? `<p class="small"><b>${esc(E.lc_agreg)}:</b> ${esc(ag)}</p>` : ""}
              <p class="note small">${esc(E.lc_nota)}</p></section>
            <div class="btn-row"><a class="btn btn-sm" href="#/uf/${uf}/${cod}">${icone("pin")} ${esc(E.lc_all_mun)}</a><a class="btn btn-sm btn-ghost" href="#/locais/${uf}/${cod}">${icone("building")} ${esc(E.lc_title)} · ${esc(nome)}</a></div>
            <p class="small muted">${esc(E.lc_fonte)} ${esc(LL.lk_open)}/${esc(LL.lk_close)}: ${esc(LL.lk_local)}.</p>`;
          $("#lc-turno").addEventListener("change", (e) => { n = +e.target.value; history.replaceState(null, "", `#/locais/${uf}/${cod}/${id}${n === 1 ? "?t=1" : ""}`); desenhar(); A.efeitos($("#lc-det")); });
        };
        desenhar();
        A.efeitos($("#lc-det"));
      }
    },
  };

  // Na consulta de seção: o local de votação, com link para as seções vizinhas
  document.addEventListener("secao", async (e) => {
    const { uf, z, s } = e.detail;
    try {
      const l = (await locais(uf)).find((x) => x[0] === z && x[10].includes(s));
      const head = $(".lk-head");
      if (!l || !head || head.parentNode.querySelector(".lk-local")) return;
      const E = X();
      head.insertAdjacentHTML("afterend", `<p class="lk-local">${icone("building")} <span><b>${esc(E.lc_na_secao)}:</b> ${esc(A.titulo(l[3]))} — ${esc([l[4], l[5]].filter(Boolean).map(A.titulo).join(" · "))}
        · <a href="#/locais/${uf}/${l[2]}/${idLocal(l)}">${esc(E.lc_ver_local(nf(l[10].length)))}</a></span></p>`);
    } catch (err) { /* sem dados de locais */ }
  });

  // ===================================================================================================
  // Perguntas frequentes
  // ===================================================================================================
  const perguntas = () => dado("site/data/perguntas.json");
  function ldFaq(lista) {
    let s = document.getElementById("ld-faq");
    if (!lista) { if (s) s.remove(); return; }
    if (!s) { s = document.createElement("script"); s.type = "application/ld+json"; s.id = "ld-faq"; document.head.append(s); }
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: { PT: "pt-BR", EN: "en", ES: "es" }[A.state.lang],
      mainEntity: lista.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: semMd(q.a) } })) });
  }
  const pgPerguntas = {
    ativo: "faq",
    titulo: () => X().fq_title,
    html() {
      const E = X();
      return `${cabecalho(E.fq_title, E.fq_sub, false)}
        <label class="mini-search big">${icone("search")}<input type="search" id="fq-q" placeholder="${esc(E.fq_ph)}" aria-label="${esc(E.fq_ph)}"></label>
        <div id="fq-lista">${carregando()}</div>
        <aside class="bot-band"><span class="bot-band-ico" aria-hidden="true">${icone("help")}</span><p><b>${esc(E.fq_ask)}</b></p><a class="btn btn-bot" href="#/atlas">${esc(E.fq_ask_btn)}</a></aside>`;
    },
    async iniciar(p) {
      const E = X();
      let F;
      try { F = await perguntas(); } catch (e) { $("#fq-lista").innerHTML = erroDados(e); return; }
      const lg = A.state.lang, lista = F[lg], G = F.grupos[lg];
      ldFaq(lista);
      const desenhar = () => {
        const q = nz($("#fq-q").value.trim());
        const ls = lista.filter((x) => !q || nz(x.q + " " + semMd(x.a)).includes(q));
        const grupos = [...new Set(ls.map((x) => x.g))];
        $("#fq-lista").innerHTML = ls.length ? grupos.map((g) => `<section class="fq-grupo"><h2>${esc(G[g])}</h2>${ls.filter((x) => x.g === g).map((x) => `
          <details class="fq-q" id="q-${x.id}" data-id="${x.id}"${q || p[1] === x.id ? " open" : ""}><summary>${esc(x.q)}</summary>
            <div class="fq-a">${md(x.a)}<div class="fq-tools">${`<button class="btn btn-sm btn-ghost" type="button" data-copy="${esc(SITE + "#/perguntas/" + x.id)}">${icone("link")} ${esc(E.fq_link)}</button>`}
              <a class="btn btn-sm btn-bot" href="#/atlas?q=${encodeURIComponent(x.q)}">${icone("globe")} ${esc(E.fq_ask_this)}</a></div></div></details>`).join("")}</section>`).join("")
          : `<p class="muted">${esc(E.fq_none)}</p>`;
      };
      $("#fq-q").addEventListener("input", desenhar);
      $("#fq-lista").addEventListener("toggle", (e) => {
        const d = e.target; if (!d.matches || !d.matches("details.fq-q") || !d.open) return;
        history.replaceState(null, "", `#/perguntas/${d.dataset.id}`);
      }, true);
      desenhar();
      if (p[1]) { const d = document.getElementById("q-" + p[1]); if (d) setTimeout(() => d.scrollIntoView({ block: "start" }), 60); }
    },
  };
  document.addEventListener("pagina", (e) => { if ((e.detail.rota || [])[0] !== "perguntas") ldFaq(null); });

  // ===================================================================================================
  // Anatomia do boletim de urna
  // ===================================================================================================
  // Linhas do boletim ilustrativo (o boletim real é impresso em português)
  const PAPEL = {
    cab: [["BOLETIM DE URNA", "c b"], ["Eleições Gerais 2026 · 2º Turno", "c"], ["25/10/2026", "c"]],
    onde: [["Município", "EXEMPLO"], ["Zona Eleitoral", "0001"], ["Local de votação", "1015"], ["Seção Eleitoral", "0045"], ["Seções agregadas", "—"]],
    urna: [["Urna (n.º de série)", "2.012.345"], ["Código de carga", "123.456.789.012"]],
    horas: [["Abertura", "08:00:01"], ["Encerramento", "17:00:48"], ["Emissão do boletim", "17:01:20"]],
    eleitores: [["Eleitores aptos", "350"], ["Comparecimento", "290"], ["Eleitores faltosos", "60"]],
    votos: [["PRESIDENTE", "b"], ["Candidato A · 91", "150"], ["Candidato B · 92", "120"], ["Votos nominais", "270"], ["Brancos", "8"], ["Nulos", "12"], ["Total apurado", "290"]],
    codigos: [["Código de verificação", "b"], ["8F2A C91D 0B7E 44A1 6D30 E2F9", "mono"]],
    qr: [],
    assina: [["______________________", "c"], ["Presidente da mesa", "c"], ["______________________", "c"], ["Fiscais", "c"]],
  };
  const pgAnatomia = {
    ativo: "anatomy",
    titulo: () => X().an_title,
    html(p) {
      const E = X();
      const linhas = (id) => PAPEL[id].map(([a, b]) => (b === "c" || b === "c b" ? `<span class="an-l ${b === "c b" ? "an-c an-b" : "an-c"}">${esc(a)}</span>`
        : b === "b" ? `<span class="an-l an-b">${esc(a)}</span>` : b === "mono" ? `<span class="an-l an-c">${esc(a)}</span>` : `<span class="an-l"><span>${esc(a)}</span><span>${esc(b)}</span></span>`)).join("");
      const papel = E.an.map(([id, tit], i) => `<button type="button" class="an-parte" data-parte="${id}" aria-label="${i + 1}. ${esc(tit)}"><span class="an-num">${i + 1}</span>
        ${id === "qr" ? `<span class="an-qr" id="an-qr"></span><span class="an-l an-c">QR 1/1</span>` : linhas(id)}</button>`).join("");
      const cards = E.an.map(([id, tit, txt, ls], i) => `<article class="an-card" id="an-${id}" data-parte="${id}" tabindex="-1"><h3><span class="an-num">${i + 1}</span> ${esc(tit)}</h3><p>${esc(txt)}</p>
        ${ls.length ? `<p class="an-links">${ls.map(([r, h]) => `<a class="chipq" href="${h}">${esc(r)}</a>`).join("")}</p>` : ""}</article>`).join("");
      return `${cabecalho(E.an_title, E.an_sub, false)}<p class="note small">${esc(E.an_nota)}</p>
        <div class="an-wrap"><div class="an-papel" data-marca="${esc(E.an_exemplo)}">${papel}</div><div class="an-lista"><h2>${esc(E.an_partes)}</h2>${cards}</div></div>${A.botCta()}`;
    },
    async iniciar(p) {
      const ativar = (id, rolarPara) => {
        $$(".an-parte, .an-card").forEach((el) => el.classList.toggle("on", el.dataset.parte === id));
        const alvo = rolarPara === "card" ? document.getElementById("an-" + id) : $(`.an-parte[data-parte="${id}"]`);
        if (alvo) alvo.scrollIntoView({ block: "nearest", behavior: "smooth" });
      };
      $(".an-papel").addEventListener("click", (e) => { const b = e.target.closest(".an-parte"); if (b) { ativar(b.dataset.parte, "card"); history.replaceState(null, "", "#/anatomia/" + b.dataset.parte); } });
      $(".an-lista").addEventListener("click", (e) => { const c = e.target.closest(".an-card"); if (c && !e.target.closest("a")) ativar(c.dataset.parte, "papel"); });
      try { $("#an-qr").innerHTML = await A.ferramentas.svgQr(`EXEMPLO · boletim ilustrativo · ${SITE}#/anatomia`); } catch (e) { /* sem QR */ }
      if (p[1]) setTimeout(() => ativar(p[1], "card"), 80);
    },
  };

  // ===================================================================================================
  // Consulta avançada (SQLite no navegador, num Worker)
  // ===================================================================================================
  let cw = null, cwSeq = 0;
  const cwPend = new Map();
  const cq = { carregados: new Set(), secoes: 0, colunas: {} };
  function worker() {
    if (cw) return cw;
    cw = new Worker("site/js/consulta-worker.js");
    cw.onmessage = (e) => {
      const m = e.data, p = cwPend.get(m.id);
      if (!p) return;
      if (m.prog) { if (p.prog) p.prog(m.prog); return; }
      cwPend.delete(m.id);
      if (m.erro) p.rej(new Error(m.erro)); else p.res(m);
    };
    return cw;
  }
  const pedir = (msg, prog) => new Promise((res, rej) => { const id = ++cwSeq; cwPend.set(id, { res, rej, prog }); worker().postMessage(Object.assign({ id }, msg)); });
  async function iniciarBanco() {
    if (cq.pronto) return cq.pronto;
    const base = new URL("site/data/", location.href).href;
    const ordem = R().ordem_votos, cands = {};
    ["1", "2"].forEach((n) => { cands[n] = R().turnos[n].presidente.candidatos.map((c) => [c.nr, c.nome, c.votos]); });
    const testes = Object.keys(R().testes_txt.PT).sort().map((id) => [id, A.nomeTeste(id)]);
    cq.pronto = pedir({ tipo: "iniciar", base, ordem, cands, testes }).then((m) => { cq.colunas = m.colunas; return m; });
    return cq.pronto;
  }
  const csvCampo = (v) => (v == null ? "" : /[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

  // ===================================================================================================
  // Consulta avançada: resultado em páginas, ordem por coluna, painel flutuante da linha e dica no mouse
  // ===================================================================================================
  const CQ_PP = [50, 100, 250, 500, 1000];
  const ppSalvo = () => { try { const v = +localStorage.getItem("cq_pp"); return CQ_PP.includes(v) ? v : 100; } catch (e) { return 100; } };
  const sqlTxt = (v) => `'${String(v).replace(/'/g, "''")}'`;
  const sqlLit = (v) => (typeof v === "number" ? String(v) : sqlTxt(v));
  const nomeCol = (c) => String(c).toLowerCase().replace(/^.*\./, "");
  const identCol = (c) => /^(zona|secao|local|turno|cod_mun|codigo|numero|id|lat|lon)$/.test(nomeCol(c));
  const fmtCel = (v, ident) => (v == null ? "—" : typeof v === "number" ? (Number.isInteger(v) && !ident ? nf(v) : String(v).replace(".", A.state.lang === "EN" ? "." : ",")) : esc(v));
  const varias = (sqls) => pedir({ tipo: "varias", sqls }).then((m) => m.res.map((x) => { if (x.erro) throw new Error(x.erro); return x; }));
  const objs = (res) => res.linhas.map((l) => Object.fromEntries(res.colunas.map((c, i) => [c, l[i]])));
  const candsT = (n) => R().turnos[n].presidente.candidatos.filter((c) => c.nr !== "95" && c.nr !== "96");
  const seg = (h) => { const m = /^(\d\d):(\d\d):(\d\d)$/.exec(h || ""); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null; };
  const duracao = (a, b) => { const x = seg(a), y = seg(b); if (x == null || y == null || y < x) return "—"; const s = y - x; return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")} min`; };
  const comSinal = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + nf(Math.abs(v));
  const pp1 = (x) => (A.state.lang === "EN" ? x.toFixed(1) : x.toFixed(1).replace(".", ","));
  let cqResSeq = 0;
  cq.hist = [];
  // turno da consulta: 1, 2 ou 0 (os dois)
  cq.turno = (() => { try { const v = localStorage.getItem("cq_turno"); return v === "1" ? 1 : v === "2" ? 2 : 0; } catch (e) { return 0; } })();
  function seletorTurno(pos) {
    const E = X();
    return `<div class="cq-turnos" role="radiogroup" aria-label="${esc(E.cq_turno_t)}" data-pos="${pos}"><span class="cq-turnos-r">${icone("vote")} ${esc(E.cq_turno_t)}</span>
      <span class="cq-turnos-b">${[1, 2, 0].map((n) => `<button type="button" role="radio" aria-checked="${cq.turno === n}" data-turno="${n}">${esc(E.cq_turno_ops[n])}</button>`).join("")}</span></div>`;
  }

  // O que a linha identifica (pelas colunas do resultado): seção, local, município, zona, estado, teste, candidato, turno
  function leitor(cols) {
    const ix = {};
    cols.forEach((c, i) => { const k = nomeCol(c); if (!(k in ix)) ix[k] = i; });
    const g = (l, k) => (k in ix ? l[ix[k]] : null);
    const int = (l, k) => { const v = g(l, k); return v != null && /^\d+$/.test(String(v)) ? +v : null; };
    return (l) => {
      const ufv = String(g(l, "uf") || ""), t_ = int(l, "turno");
      const cod = g(l, "cod_mun") != null ? g(l, "cod_mun") : g(l, "codigo");
      const te = [g(l, "teste"), g(l, "id")].find((v) => /^T\d{2}$/.test(String(v || "")));
      const nr = g(l, "numero"), mun = g(l, "municipio");
      return { uf: /^[A-Z]{2}$/.test(ufv) && window.UF_NOMES[ufv] ? ufv : null, z: int(l, "zona"), s: int(l, "secao"), loc: int(l, "local"),
        t: t_ === 1 || t_ === 2 ? t_ : null, cod: cod != null && /^\d+$/.test(String(cod)) ? String(cod) : null,
        mun: typeof mun === "string" && mun ? mun : null, teste: te || null, nivel: ["a", "i"].includes(g(l, "nivel")) ? g(l, "nivel") : null,
        nr: nr != null && /^\d{2}$/.test(String(nr)) ? String(nr) : null };
    };
  }
  function destino(e) {
    if (e.uf && e.z != null && e.s != null) return { tipo: "secao", href: `#/secao/${e.uf}/${e.z}/${e.s}` };
    if (e.uf && e.z != null && e.loc != null) return { tipo: "local", href: e.cod ? `#/locais/${e.uf}/${e.cod}/${e.z}-${e.loc}` : null };
    if (e.teste) {
      const q = new URLSearchParams();
      if (e.t) q.set("t", e.t);
      if (e.uf) q.set("uf", e.uf);
      if (e.uf && e.cod) q.set("mun", e.cod);
      if (e.uf && e.z != null) q.set("z", e.z);
      if (e.nivel) q.set("nivel", e.nivel);
      if ([...q.keys()].length) { q.set("teste", e.teste); return { tipo: "lista", href: `#/lista?${q}` }; }
      return { tipo: "teste", href: `#/testes/${e.teste}` };
    }
    if ((e.uf && e.cod) || e.mun) return { tipo: "mun", href: e.uf && e.cod ? `#/uf/${e.uf}/${e.cod}` : null };
    if (e.uf && e.z != null) return { tipo: "zona", href: `#/lista?uf=${e.uf}&z=${e.z}${e.t ? `&t=${e.t}` : ""}` };
    if (e.uf) return { tipo: "uf", href: `#/uf/${e.uf}` };
    if (e.nr) return { tipo: "cand", href: `#/turno/${e.t || 2}` };
    if (e.t) return { tipo: "turno", href: `#/turno/${e.t}` };
    return null;
  }
  // Endereço que falta (código do município pelo nome, ou município do local)
  async function resolver(e, d) {
    if (!d) return null;
    if (d.href) return d.href;
    try {
      if (d.tipo === "local") {
        const [r] = await varias([`SELECT l.cod_mun FROM locais l LEFT JOIN municipios m ON m.uf = l.uf AND m.codigo = l.cod_mun WHERE l.uf = ${sqlTxt(e.uf)} AND l.zona = ${e.z} AND l.local = ${e.loc}${e.mun ? ` ORDER BY m.nome = ${sqlTxt(e.mun)} DESC` : ""} LIMIT 1`]);
        if (r.linhas.length) return `#/locais/${e.uf}/${r.linhas[0][0]}/${e.z}-${e.loc}`;
      } else if (d.tipo === "mun") {
        const [r] = await varias([`SELECT uf, codigo FROM municipios WHERE nome = ${sqlTxt(e.mun)}${e.uf ? ` AND uf = ${sqlTxt(e.uf)}` : ""} LIMIT 2`]);
        if (r.linhas.length === 1) return `#/uf/${r.linhas[0][0]}/${r.linhas[0][1]}`;
        if (e.uf) return `#/uf/${e.uf}`;
      }
    } catch (err) { /* banco ainda não pronto */ }
    return null;
  }

  // Consulta agrupada simples (SELECT … FROM … [WHERE …] GROUP BY …): cada grupo pode abrir as suas linhas
  function partes(s) {
    const out = []; let d = 0, q = null, cur = "";
    for (const ch of s) {
      if (q) { if (ch === q) q = null; } else if (ch === "'" || ch === '"') q = ch; else if (ch === "(") d++; else if (ch === ")") d--;
      else if (ch === "," && !d) { out.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  const nzSql = (s) => String(s).replace(/\s+/g, " ").trim().toLowerCase();
  function agrupada(sql, cols) {
    const s = sql.trim().replace(/;\s*$/, "");
    if ((s.match(/\bselect\b/gi) || []).length !== 1 || /\b(union|intersect|except)\b/i.test(s)) return null;
    const m = s.match(/^select\s+([\s\S]+?)\s+from\s+([\s\S]+?)(?:\s+where\s+([\s\S]+?))?\s+group\s+by\s+([\s\S]+?)(?:\s+having\s+[\s\S]+?)?(?:\s+order\s+by\s+[\s\S]+?)?(?:\s+limit\s+\d+(?:\s*(?:,|offset)\s*\d+)?)?$/i);
    if (!m) return null;
    const itens = partes(m[1].replace(/^distinct\s+/i, "")).map((x) => {
      const a = x.match(/^([\s\S]+?)\s+as\s+"?([A-Za-z_]\w*)"?$/i) || x.match(/^([\s\S]*[\w)\]])\s+"?([A-Za-z_]\w*)"?$/);
      if (a && !/^(end|asc|desc)$/i.test(a[2])) return { expr: a[1], nome: a[2].toLowerCase() };
      return { expr: x, nome: /^[\w.]+$/.test(x) ? nomeCol(x) : x.toLowerCase() };
    });
    const nomes = cols.map((c) => String(c).toLowerCase());
    const grupos = partes(m[4]).map((gx) => {
      const it = /^\d+$/.test(gx) ? itens[+gx - 1] : itens.find((x) => x.nome === gx.toLowerCase() || nzSql(x.expr) === nzSql(gx));
      let ci = it ? nomes.indexOf(it.nome) : -1;
      if (ci < 0) ci = nomes.findIndex((c) => nomeCol(c) === nomeCol(gx));
      return { expr: it ? it.expr : gx, ci };
    });
    if (!grupos.length || grupos.some((g) => g.ci < 0)) return null;
    return { from: m[2].trim(), where: m[3] ? m[3].trim() : null, grupos };
  }
  function sqlGrupo(G, l) {
    const conds = G.grupos.map((g) => (l[g.ci] == null ? `${g.expr} IS NULL` : `${g.expr} = ${sqlLit(l[g.ci])}`));
    return `SELECT *\nFROM ${G.from}\nWHERE ${G.where ? `(${G.where})\n  AND ` : ""}${conds.join("\n  AND ")}`;
  }

  // Sinalizações de cada seção (ocorrencias.json): "UF|zona|seção" -> [[turno, teste, nível, categoria]]
  let mapaSin = null;
  async function sinaisSecoes() {
    if (mapaSin) return mapaSin;
    const oc = await A.paginasExtra.ocorrencias(), m = new Map();
    oc.forEach((o) => { if (o[2] == null || o[3] == null) return; const k = `${o[0]}|${o[2]}|${o[3]}`; let a = m.get(k); if (!a) m.set(k, (a = [])); a.push([o[4], o[5], o[6], o[7]]); });
    return (mapaSin = m);
  }
  function chipsSinal(r, e) {
    if (!cq.sin || !e.uf || e.z == null || e.s == null) return "—";
    const fs = (cq.sin.get(`${e.uf}|${e.z}|${e.s}`) || []).filter((f) => (e.t ? f[0] === e.t : !r.turno || f[0] === r.turno));
    if (!fs.length) return `<span class="cq-sn-ok" aria-label="${esc(X().cq_nenhuma)}">—</span>`;
    const vistos = new Set(), cat = R().categorias || {};
    return fs.filter((f) => { const k = f[0] + f[1] + f[2]; if (vistos.has(k)) return false; vistos.add(k); return true; }).sort((a, b) => (a[2] === "a" ? 0 : 1) - (b[2] === "a" ? 0 : 1) || a[1].localeCompare(b[1]))
      .map((f) => `<span class="cq-sn cq-sn-${f[2]}" title="${esc(`${t().round(f[0])} · ${A.numTeste(f[1])}. ${A.nomeTeste(f[1])} — ${(cat[f[3]] || {})[A.state.lang] || f[3]} (${X().cq_nivel[f[2]]})`)}">${A.numTeste(f[1])}</span>`).join("");
  }
  function ordenar(r) {
    const L = r.m.linhas;
    r.idx = Array.from({ length: L.length }, (_, i) => i);
    if (!r.ord) return;
    const { i, d } = r.ord, col = new Intl.Collator(A.state.lang === "EN" ? "en" : "pt", { numeric: true, sensitivity: "base" });
    r.idx.sort((a, b) => {
      const x = L[a][i], y = L[b][i];
      if (x == null || y == null) return (x == null) - (y == null) || a - b;
      return d * (typeof x === "number" && typeof y === "number" ? x - y : col.compare(String(x), String(y))) || a - b;
    });
  }

  // --- tabela e páginas --------------------------------------------------------------------------------------------
  function paginador(r, pos) {
    const E = X(), n = r.m.linhas.length, np = Math.max(1, Math.ceil(n / r.pp)), a = r.pag * r.pp + 1, b = Math.min(n, (r.pag + 1) * r.pp);
    const bt = (k, txt, dis, rot, cls) => `<button class="btn btn-sm btn-ghost${cls ? " " + cls : ""}" type="button" data-pg="${k}"${dis ? " disabled" : ""}${rot ? ` aria-label="${esc(rot)}" title="${esc(rot)}"` : ""}>${txt}</button>`;
    return `<nav class="cq-pag" aria-label="${esc(E.cq_pag_nav)}" data-pos="${pos}">
      <div class="cq-pag-b">${bt("ini", "«", r.pag === 0, E.cq_pag_ini, "cq-pag-x")}${bt("ant", `‹ <span>${esc(E.cq_pag_ant)}</span>`, r.pag === 0)}
        <label class="cq-pag-n"><span>${esc(E.cq_pagina)}</span><input type="number" min="1" max="${np}" value="${r.pag + 1}" inputmode="numeric" aria-label="${esc(E.cq_pagina)}"><span>${esc(E.cq_de)} ${nf(np)}</span></label>
        ${bt("prox", `<span>${esc(E.cq_pag_prox)}</span> ›`, r.pag >= np - 1)}${bt("fim", "»", r.pag >= np - 1, E.cq_pag_fim, "cq-pag-x")}</div>
      <span class="cq-pag-i">${esc(E.cq_faixa(nf(a), nf(b), nf(n)))}</span>
      <label class="cq-pag-pp"><span>${esc(E.cq_porpag)}</span><select>${CQ_PP.map((x) => `<option value="${x}"${x === r.pp ? " selected" : ""}>${x}</option>`).join("")}</select></label></nav>`;
  }
  function linhaHtml(r, gi, k, ident) {
    const E = X(), l = r.m.linhas[gi];
    const cel = l.map((v, i) => `<td>${fmtCel(v, ident[i])}</td>`).join("");
    const sel = r.sel === gi ? " cq-sel" : "";
    return `<tr class="cq-lin${sel}" tabindex="0" data-i="${gi}"><td class="cq-n">${nf(k + 1)}</td>${r.temSec ? `<td class="cq-sin">${chipsSinal(r, r.ler(l))}</td>` : ""}${cel}${r.G ? `<td class="cq-acao"><button class="icon-btn" type="button" data-grupo="${gi}" aria-label="${esc(E.cq_ver_linhas)}" title="${esc(E.cq_ver_linhas)}">${icone("list")}</button></td>` : ""}</tr>`;
  }
  function voltarHtml() {
    const ant = cq.hist[cq.hist.length - 1];
    return ant ? `<p class="cq-voltar"><button class="btn btn-sm" type="button" data-voltar>‹ ${esc(X().cq_voltar(nf(ant.m.linhas.length)))}</button></p>` : "";
  }
  function mostrarRes() {
    const E = X(), r = cq.res, box = $("#cq-res");
    if (!box || !r) return;
    dicaEsconder();
    const m = r.m, n = m.linhas.length;
    $("#cq-info").textContent = `${E.cq_turno_info(E.cq_turno_ops[r.turno || 0])} · ${E.cq_linhas(nf(n), nf(r.ms))}` + (m.cortado ? ` · ${E.cq_cortado(nf(n))}` : "");
    $("#cq-dl").hidden = !n;
    if (!n) { box.innerHTML = `${voltarHtml()}<p class="muted">${esc(E.cq_vazio)}</p>`; return; }
    const np = Math.ceil(n / r.pp);
    r.pag = Math.min(Math.max(0, r.pag), np - 1);
    const ident = m.colunas.map(identCol), ini = r.pag * r.pp, fim = Math.min(n, ini + r.pp);
    let corpo = "";
    for (let k = ini; k < fim; k++) corpo += linhaHtml(r, r.idx[k], k, ident);
    const cab = `<th scope="col" class="cq-n">#</th>` + (r.temSec ? `<th scope="col" class="cq-sin" title="${esc(E.cq_sin_tip)}">${esc(E.cq_sin_col)}</th>` : "") + m.colunas.map((c, i) => {
      const s = r.ord && r.ord.i === i ? r.ord.d : 0;
      return `<th scope="col" aria-sort="${s > 0 ? "ascending" : s < 0 ? "descending" : "none"}"><button class="cq-ord" type="button" data-ord="${i}" title="${esc(E.cq_ord_col(c))}">${esc(c)}<span aria-hidden="true">${s > 0 ? "▲" : s < 0 ? "▼" : "↕"}</span></button></th>`;
    }).join("") + (r.G ? `<th scope="col"><span class="sr-only">${esc(E.cq_ver_linhas)}</span></th>` : "");
    box.innerHTML = `${voltarHtml()}${paginador(r, "topo")}<div class="table-wrap cq-wrap"><table class="num-cols cq-tab"><thead><tr>${cab}</tr></thead><tbody>${corpo}</tbody></table></div>${paginador(r, "base")}
      <p class="small muted cq-uso">${icone("help")} ${esc(E.cq_uso)}</p>`;
  }
  function irPagina(p, rolar) {
    const r = cq.res; if (!r) return;
    const np = Math.max(1, Math.ceil(r.m.linhas.length / r.pp));
    r.pag = Math.min(Math.max(0, p), np - 1);
    mostrarRes();
    if (rolar) $("#cq-res-c").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // --- dados de uma linha (para o painel e para a dica) ---------------------------------------------------------------
  const cacheInfo = new Map();
  function ondeDe(e, tipo) {
    const u = e.uf ? `uf = ${sqlTxt(e.uf)}` : null;
    if (tipo === "secao") return `${u} AND zona = ${e.z} AND secao = ${e.s}`;
    if (tipo === "local") return `${u} AND zona = ${e.z} AND local = ${e.loc}${e.cod ? ` AND cod_mun = ${sqlTxt(e.cod)}` : ""}`;
    if (tipo === "mun") return [u, e.cod ? `cod_mun = ${sqlTxt(e.cod)}` : `municipio = ${sqlTxt(e.mun)}`].filter(Boolean).join(" AND ");
    if (tipo === "zona") return `${u} AND zona = ${e.z}`;
    return u;
  }
  function dadosLinha(r, gi) {
    const l = r.m.linhas[gi], e = r.ler(l), d = destino(e);
    const k = d ? `${d.tipo}|${JSON.stringify(e)}` : `linha|${r.id}|${gi}`;
    if (!cacheInfo.has(k)) {
      if (cacheInfo.size > 400) cacheInfo.clear();
      cacheInfo.set(k, carregarDados(e, d).catch(() => ({ tipo: "linha", e, d: null, href: null })));
    }
    return cacheInfo.get(k);
  }
  async function carregarDados(e, d) {
    const out = { e, d, href: await resolver(e, d) };
    if (!d) return Object.assign(out, { tipo: "linha" });
    const tp = d.tipo;
    if (tp === "secao") {
      const w = ondeDe(e, "secao"), ws = `s.uf = ${sqlTxt(e.uf)} AND s.zona = ${e.z} AND s.secao = ${e.s}`;
      const [S, F, Lc] = await varias([`SELECT * FROM main.secoes WHERE ${w} ORDER BY turno`,
        `SELECT turno, teste, nivel, categoria FROM main.sinalizacoes WHERE ${w} ORDER BY turno, nivel, teste`,
        `SELECT l.nome, l.endereco, l.bairro FROM main.secoes s JOIN locais l ON l.uf = s.uf AND l.zona = s.zona AND l.local = s.local AND l.cod_mun = s.cod_mun WHERE ${ws} LIMIT 1`]);
      const ts = objs(S);
      if (!ts.length) return Object.assign(out, { tipo: "linha" });
      const x = ts[0];
      return Object.assign(out, { tipo: tp, ts, fl: F.linhas, loc: Lc.linhas[0] || null, munNome: A.titulo(x.municipio || ""),
        hLocal: x.local != null ? `#/locais/${e.uf}/${x.cod_mun}/${e.z}-${x.local}` : null, hMun: `#/uf/${e.uf}/${x.cod_mun}` });
    }
    if (tp === "local" || tp === "mun" || tp === "zona" || tp === "uf") {
      let cod = e.cod;
      const mh = /^#\/(?:uf|locais)\/[A-Z]{2}\/(\d+)/.exec(out.href || "");
      if (!cod && mh) cod = mh[1];
      const e2 = Object.assign({}, e, { cod });
      const vs = (cq.colunas.secoes || []).filter((c) => /^v\d+$/.test(c));
      const sqls = [`SELECT turno, COUNT(*) AS secoes, SUM(aptos) AS aptos, SUM(comparecimento) AS comparecimento, SUM(faltosos) AS faltosos, SUM(validos) AS validos,
        SUM(brancos) AS brancos, SUM(nulos) AS nulos, SUM(sinalizada) AS sinalizadas, SUM(encerramento >= '18:00:00') AS tarde, MIN(abertura) AS abertura, MAX(encerramento) AS encerramento${vs.map((c) => `, SUM(${c}) AS ${c}`).join("")}
        FROM main.secoes WHERE ${ondeDe(e2, tp)} GROUP BY turno ORDER BY turno`];
      if (tp === "local") sqls.push(`SELECT nome, endereco, bairro, secoes FROM locais WHERE ${ondeDe(e2, "local")} LIMIT 1`);
      const [G, Lc] = await varias(sqls);
      const munNome = cod && e.uf ? await munNome_(e.uf, cod) : e.mun ? A.titulo(e.mun) : "";
      return Object.assign(out, { tipo: tp, ts: objs(G), loc: Lc ? Lc.linhas[0] || null : null, munNome, hMun: tp === "local" && cod ? `#/uf/${e.uf}/${cod}` : null });
    }
    if (tp === "teste" || tp === "lista") {
      const w = [`teste = ${sqlTxt(e.teste)}`].concat(e.uf ? [`uf = ${sqlTxt(e.uf)}`] : [], e.t ? [`turno = ${e.t}`] : [], e.uf && e.cod ? [`cod_mun = ${sqlTxt(e.cod)}`] : [],
        e.uf && e.z != null ? [`zona = ${e.z}`] : [], e.nivel ? [`nivel = ${sqlTxt(e.nivel)}`] : []).join(" AND ");
      const [S] = await varias([`SELECT turno, nivel, COUNT(*) AS n FROM main.sinalizacoes WHERE ${w} GROUP BY turno, nivel ORDER BY turno, nivel`]);
      return Object.assign(out, { tipo: tp, cont: S.linhas });
    }
    return Object.assign(out, { tipo: tp });
  }
  const munNome_ = (uf, cod) => munNome(uf, cod).catch(() => cod);

  // --- conteúdo: votos de cada turno, diferença entre candidatos e ganho do 1º para o 2º turno ---------------------------
  function porTurno(ts) { const o = {}; (ts || []).forEach((x) => { o[x.turno] = x; }); return o; }
  function rankCands(n, x) {
    return candsT(n).map((c) => ({ nr: c.nr, nome: A.titulo(c.nome), v: x["v" + c.nr] || 0 })).filter((c) => c.v > 0).sort((a, b) => b.v - a.v);
  }
  // números que contam e barras que enchem quando o painel abre (ou passa para outra linha)
  const nA = (v) => `<span data-cn="${v || 0}">${nf(v || 0)}</span>`;
  const pA = (x, d) => `<span data-cp="${x || 0}" data-cd="${d}">${pct(x || 0, d)}</span>`;
  const sA = (v) => `<span data-cs="${v}">${comSinal(v)}</span>`;
  let animSeq = 0;
  function animarPainel(raiz) {
    const id = ++animSeq;
    raiz.classList.remove("cq-cheio");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { raiz.classList.add("cq-cheio"); return; }
    const els = $$("[data-cn],[data-cp],[data-cs]", raiz), t0 = performance.now(), dur = 1100;
    const passo = (agora) => {
      if (id !== animSeq) return;
      const k = Math.min(1, (agora - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      els.forEach((el) => {
        if (el.dataset.cn != null) el.textContent = nf(Math.round(+el.dataset.cn * e));
        else if (el.dataset.cp != null) el.textContent = pct(+el.dataset.cp * e, +el.dataset.cd);
        else el.textContent = comSinal(Math.round(+el.dataset.cs * e));
      });
      if (k < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
    void raiz.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => { if (id === animSeq) raiz.classList.add("cq-cheio"); }));
  }
  // turnos que o painel mostra: o turno escolhido na consulta (ou os dois)
  const turnosVer = (by, tf) => [1, 2].filter((n) => by[n] && (!tf || n === tf));
  // 1) votos para Presidente: 1º turno, depois 2º turno
  function htmlVotos(dd, tf) {
    const E = X(), L = t(), by = porTurno(dd.ts), ns = turnosVer(by, tf);
    if (!Object.keys(by).length) return `<p class="muted small">${esc(E.cq_nao_carregado)}</p>`;
    if (!ns.length) return `<p class="muted small">${esc(E.cq_sem_turno(L.round(tf)))}</p>`;
    return ns.map((n) => {
      const x = by[n], cs = rankCands(n, x), val = x.validos || cs.reduce((a, c) => a + c.v, 0) || 1;
      const cp = x.comparecimento / (x.aptos || 1);
      let h = `<section class="cq-p-turno"><h3>${esc(L.round(n))} <small>· ${esc(L.roundDate[n])}</small></h3><p class="cq-p-rot">${esc(E.cq_t_votos)} · ${esc(L.lk_comp)} ${nA(x.comparecimento)} (${pA(cp, 1)})</p>
        <div class="cq-medidor" title="${esc(`${L.lk_comp}: ${pct(cp, 1)}`)}"><i style="--w:${(100 * Math.min(1, cp)).toFixed(1)}%"></i></div>`;
      if (!cs.length) return h + `<p class="muted small">${esc(E.cq_sem_votos)}</p></section>`;
      h += `<table class="cq-p-t cq-p-c"><thead><tr><th scope="col">${esc(E.cq_cand)}</th><th scope="col">${esc(E.cq_votos)}</th><th scope="col">${esc(E.cq_pct)}</th></tr></thead><tbody>${cs.map((c, i) => `<tr><th scope="row">${esc(c.nome)} <small>(${c.nr})</small></th><td>${nA(c.v)}</td><td><span class="cq-barra"><i style="--w:${(100 * c.v / val).toFixed(1)}%;--i:${i}"></i></span>${pA(c.v / val, 1)}</td></tr>`).join("")}
        <tr class="cq-p-bn"><th scope="row">${esc(L.blank)}</th><td>${nA(x.brancos)}</td><td></td></tr><tr class="cq-p-bn"><th scope="row">${esc(L.null_)}</th><td>${nA(x.nulos)}</td><td></td></tr></tbody></table>`;
      h += cs.length > 1 ? `<p class="cq-p-dif">${icone("arrow")} ${esc(E.cq_vant(cs[0].nome, cs[1].nome, nf(cs[0].v - cs[1].v), pp1(100 * (cs[0].v - cs[1].v) / val)))}</p>` : `<p class="cq-p-dif">${icone("arrow")} ${esc(E.cq_unico(cs[0].nome))}</p>`;
      return h + `</section>`;
    }).join("");
  }
  // 2) do 1º para o 2º turno (só quando a consulta é dos dois turnos)
  function htmlComparacao(dd, tf) {
    const E = X(), L = t(), by = porTurno(dd.ts);
    if (tf || !by[1] || !by[2]) return "";
    const cs2 = candsT(2), v1 = (nr) => by[1]["v" + nr] || 0, v2 = (nr) => by[2]["v" + nr] || 0;
    const ls = cs2.map((c) => [`${esc(A.titulo(c.nome))} <small>(${c.nr})</small>`, v1(c.nr), v2(c.nr)])
      .concat([[esc(L.blank), by[1].brancos || 0, by[2].brancos || 0], [esc(L.null_), by[1].nulos || 0, by[2].nulos || 0], [esc(L.lk_comp), by[1].comparecimento || 0, by[2].comparecimento || 0]]);
    const mx = Math.max(1, ...cs2.flatMap((c) => [v1(c.nr), v2(c.nr)]));
    const barra = (v, cls, i) => `<div class="cq-graf-b ${cls}"><span><i style="--w:${(100 * v / mx).toFixed(1)}%;--i:${i}"></i></span><em>${nA(v)}</em></div>`;
    let h = `<section><h3>${esc(E.cq_t_comp)}</h3>
      <div class="cq-graf" role="img" aria-label="${esc(cs2.map((c) => `${A.titulo(c.nome)}: ${L.round(1)} ${nf(v1(c.nr))}, ${L.round(2)} ${nf(v2(c.nr))}`).join("; "))}">
        <div class="cq-graf-leg" aria-hidden="true"><span class="t1">${esc(L.round(1))}</span><span class="t2">${esc(L.round(2))}</span></div>
        ${cs2.map((c, i) => `<div class="cq-graf-l" aria-hidden="true"><b>${esc(A.titulo(c.nome))} <small>(${c.nr})</small> <span class="${v2(c.nr) - v1(c.nr) > 0 ? "cq-pos" : v2(c.nr) - v1(c.nr) < 0 ? "cq-neg" : ""}">${sA(v2(c.nr) - v1(c.nr))}</span></b>${barra(v1(c.nr), "t1", 2 * i)}${barra(v2(c.nr), "t2", 2 * i + 1)}</div>`).join("")}
      </div>
      <div class="cq-p-tw"><table class="cq-p-t"><thead><tr><th></th><th scope="col">${esc(L.round(1))}</th><th scope="col">${esc(L.round(2))}</th><th scope="col">${esc(E.cq_ganho)}</th></tr></thead><tbody>
      ${ls.map(([rot, a, b]) => `<tr><th scope="row">${rot}</th><td>${nA(a)}</td><td>${nA(b)}</td><td class="${b - a > 0 ? "cq-pos" : b - a < 0 ? "cq-neg" : ""}">${sA(b - a)}</td></tr>`).join("")}</tbody></table></div>`;
    if (cs2.length === 2) {
      const [a, b] = cs2, d1 = v1(a.nr) - v1(b.nr), d2 = v2(a.nr) - v2(b.nr);
      h += `<p class="cq-p-dif">${icone("arrow")} ${esc(E.cq_dist(A.titulo(a.nome), A.titulo(b.nome), comSinal(d1), comSinal(d2)))}</p>`;
    }
    return h + `</section>`;
  }
  // 3) resumo (por último): os dois turnos lado a lado, com o turno escolhido em destaque
  function htmlResumo(dd, tf) {
    const E = X(), L = t(), by = porTurno(dd.ts), ns = [1, 2].filter((n) => by[n]), sec = dd.tipo === "secao";
    if (!ns.length) return "";
    const tSel = tf || dd.e.t;
    const th = ns.map((n) => `<th scope="col"${tSel === n ? ' class="on"' : ""}>${esc(L.round(n))}</th>`).join("") + (ns.length === 2 ? `<th scope="col">${esc(E.cq_dif)}</th>` : "");
    const linha = (rot, f, num) => {
      const vs = ns.map((n) => f(by[n], n));
      const dif = ns.length === 2 && num ? (() => { const a = num(by[1]), b = num(by[2]); return a == null || b == null ? "" : `<span class="${b - a > 0 ? "cq-pos" : b - a < 0 ? "cq-neg" : ""}">${sA(b - a)}</span>`; })() : "";
      return `<tr><th scope="row">${esc(rot)}</th>${vs.map((v, i) => `<td${tSel === ns[i] ? ' class="on"' : ""}>${v}</td>`).join("")}${ns.length === 2 ? `<td>${dif}</td>` : ""}</tr>`;
    };
    const num = (k) => (x) => (x[k] == null ? null : x[k]);
    const linhas = [];
    if (!sec) linhas.push(linha(E.cq_secoes, (x) => nA(x.secoes), num("secoes")));
    linhas.push(linha(L.lk_aptos, (x) => nA(x.aptos), num("aptos")),
      linha(L.lk_comp, (x) => `${nA(x.comparecimento)} <small>(${pA(x.comparecimento / (x.aptos || 1), 1)})</small>`, num("comparecimento")),
      linha(L.lk_abst, (x) => nA(x.faltosos), num("faltosos")),
      linha(E.cq_validos, (x) => nA(x.validos), num("validos")),
      linha(L.blank, (x) => nA(x.brancos), num("brancos")), linha(L.null_, (x) => nA(x.nulos), num("nulos")));
    if (sec) {
      linhas.push(linha(L.lk_open, (x) => esc(x.abertura || "—")), linha(L.lk_close, (x) => `${esc(x.encerramento || "—")}${seg(x.encerramento) >= 18 * 3600 ? ` <span class="cq-tarde" title="${esc(E.cq_nota_tarde)}">!</span>` : ""}`),
        linha(E.cq_tempo, (x) => duracao(x.abertura, x.encerramento)));
      if (ns.some((n) => by[n].agregadas)) linhas.push(linha(L.lk_agreg, (x) => esc(x.agregadas || "—")));
    } else {
      linhas.push(linha(E.cq_primeira, (x) => esc(x.abertura || "—")), linha(E.cq_ultima, (x) => esc(x.encerramento || "—")),
        linha(E.cq_tarde, (x) => `${nA(x.tarde)} <small>(${pA((x.tarde || 0) / (x.secoes || 1), 1)})</small>`, num("tarde")),
        linha(E.cq_anom, (x) => `${nA(x.sinalizadas)} <small>(${pA((x.sinalizadas || 0) / (x.secoes || 1), 1)})</small>`, num("sinalizadas")));
    }
    return `<section class="cq-p-res"><h3>${esc(ns.length === 2 ? E.cq_t_resumo2 : E.cq_t_resumo)}</h3><div class="cq-p-tw"><table class="cq-p-t"><thead><tr><th></th>${th}</tr></thead><tbody>${linhas.join("")}</tbody></table></div></section>`;
  }
  const htmlVotacao = (dd, tf) => htmlVotos(dd, tf) + htmlComparacao(dd, tf);
  function htmlSinais(dd, tf) {
    const E = X(), L = t(), cat = R().categorias || {};
    const ns = turnosVer(porTurno(dd.ts), tf);
    if (!ns.length) return "";
    return `<h3>${esc(E.cq_t_sin)}</h3>${ns.map((n) => {
      const fs = dd.fl.filter((f) => f[0] === n);
      return `<div class="cq-p-sin"><h4>${esc(L.round(n))}</h4>${fs.length ? `<ul>${fs.map((f) => `<li><a href="#/testes/${f[1]}">${esc(A.numTeste(f[1]))}. ${esc(A.nomeTeste(f[1]))}</a> ${chip(f[2] === "a" ? "red" : "amber", E.cq_nivel[f[2]] || f[2])}<br><span class="small muted">${esc((cat[f[3]] || {})[A.state.lang] || f[3] || "")}</span></li>`).join("")}</ul>` : `<p class="small muted">${esc(E.cq_nenhuma)}</p>`}</div>`;
    }).join("")}`;
  }
  function htmlColunas(r, gi) {
    const E = X(), l = r.m.linhas[gi], ident = r.m.colunas.map(identCol);
    return `<dl class="cq-p-dl">${r.m.colunas.map((c, i) => `<div><dt><code>${esc(c)}</code>${E.cq_col[/^v\d+$/.test(nomeCol(c)) ? "vNN" : nomeCol(c)] ? ` <small>${esc(E.cq_col[/^v\d+$/.test(nomeCol(c)) ? "vNN" : nomeCol(c)])}</small>` : ""}</dt><dd>${fmtCel(l[i], ident[i])}</dd></div>`).join("")}</dl>`;
  }
  // título, corpo e botões do painel
  function conteudo(dd, r, gi) {
    const E = X(), L = t(), e = dd.e, tf = r.turno || 0;
    let kick = "", tit = "", sub = "", corpo = "";
    if (dd.tipo === "secao") {
      kick = `${e.uf} · ${dd.munNome}`; tit = `${L.th_zone} ${e.z} · ${L.th_section} ${e.s}`;
      sub = dd.loc ? [A.titulo(dd.loc[0]), dd.loc[2] && A.titulo(dd.loc[2])].filter(Boolean).join(" · ") : "";
      corpo = htmlVotacao(dd, tf) + htmlSinais(dd, tf) + htmlResumo(dd, tf);
      if ((dd.ts || []).some((x) => (!tf || x.turno === tf) && seg(x.encerramento) >= 18 * 3600)) corpo += `<p class="cq-p-nota">${icone("help")} ${esc(E.cq_nota_tarde)}</p>`;
      corpo += `<p class="small muted">${esc(E.cq_hora_local)}</p>`;
    } else if (dd.tipo === "local") {
      kick = `${e.uf} · ${dd.munNome || ""}`; tit = dd.loc ? A.titulo(dd.loc[0]) : `${X().lc_local} ${e.loc}`;
      sub = [`${L.th_zone} ${e.z} · ${X().lc_local} ${e.loc}`, dd.loc && dd.loc[1] && A.titulo(dd.loc[1]), dd.loc && dd.loc[2] && A.titulo(dd.loc[2])].filter(Boolean).join(" · ");
      corpo = htmlVotacao(dd, tf) + htmlResumo(dd, tf);
    } else if (dd.tipo === "mun") { kick = e.uf ? A.ufNome(e.uf) : ""; tit = dd.munNome || A.titulo(e.mun || e.cod || ""); corpo = htmlVotacao(dd, tf) + htmlResumo(dd, tf); }
    else if (dd.tipo === "zona") { kick = A.ufNome(e.uf); tit = `${L.th_zone} ${e.z}`; corpo = htmlVotacao(dd, tf) + htmlResumo(dd, tf); }
    else if (dd.tipo === "uf") { kick = E.cq_estado; tit = `${A.ufNome(e.uf)} (${e.uf})`; corpo = htmlVotacao(dd, tf) + htmlResumo(dd, tf); }
    else if (dd.tipo === "teste" || dd.tipo === "lista") {
      kick = `${E.cq_teste} ${A.numTeste(e.teste)}`; tit = A.nomeTeste(e.teste);
      sub = [e.uf ? A.ufNome(e.uf) : E.cq_brasil, e.t ? L.round(e.t) : "", e.z != null ? `${L.th_zone} ${e.z}` : ""].filter(Boolean).join(" · ");
      const c = {}; (dd.cont || []).forEach(([n, nv, q]) => { c[n] = c[n] || { a: 0, i: 0 }; c[n][nv] = q; });
      const ns = [1, 2].filter((n) => (!e.t || e.t === n) && (!tf || tf === n));
      corpo = `<div class="cq-p-tw"><table class="cq-p-t"><thead><tr><th></th>${ns.map((n) => `<th scope="col">${esc(L.round(n))}</th>`).join("")}</tr></thead><tbody>
        <tr><th scope="row">${chip("red", E.cq_nivel.a)}</th>${ns.map((n) => `<td>${nA((c[n] || {}).a)}</td>`).join("")}</tr>
        <tr><th scope="row">${chip("amber", E.cq_nivel.i)}</th>${ns.map((n) => `<td>${nA((c[n] || {}).i)}</td>`).join("")}</tr></tbody></table></div>
        <p class="small muted">${esc(E.cq_ocorr)}</p>`;
    } else if (dd.tipo === "cand") {
      const nr = e.nr, ns = [1, 2].filter((n) => (!tf || tf === n) && R().turnos[n].presidente.candidatos.some((c) => c.nr === nr));
      const c0 = ns.length ? R().turnos[ns[0]].presidente.candidatos.find((c) => c.nr === nr) : null;
      kick = E.cq_cand; tit = c0 ? `${A.titulo(c0.nome)} (${nr})` : nr;
      corpo = `<div class="cq-p-tw"><table class="cq-p-t"><thead><tr><th></th><th scope="col">${esc(E.cq_votos)}</th><th scope="col">${esc(E.cq_pct)}</th></tr></thead><tbody>${ns.map((n) => {
        const P = R().turnos[n].presidente, c = P.candidatos.find((y) => y.nr === nr), val = candsT(n).reduce((a, y) => a + y.votos, 0) || 1;
        return `<tr><th scope="row">${esc(L.round(n))}</th><td>${nA(c.votos)}</td><td>${pA(c.votos / val, 2)}</td></tr>`;
      }).join("")}</tbody></table></div>`;
    } else if (dd.tipo === "turno") {
      const T = R().turnos[e.t], P = T.presidente;
      kick = L.roundDate[e.t]; tit = L.round(e.t);
      corpo = `<dl class="cq-p-dl"><div><dt>${esc(E.cq_secoes)}</dt><dd>${nf(T.entrada.secoes)}</dd></div><div><dt>${esc(E.cq_anom)}</dt><dd>${nf(T.secoes_sinalizadas)}</dd></div>
        <div><dt>${esc(L.lk_aptos)}</dt><dd>${nf(P.aptos)}</dd></div><div><dt>${esc(L.lk_comp)}</dt><dd>${nf(P.comparecimento)} (${pct(P.comparecimento / P.aptos, 1)})</dd></div></dl>`;
    } else { kick = r.G ? E.cq_grupo : ""; tit = E.cq_t_dados; }
    if (dd.tipo !== "linha" && dd.tipo !== "secao") corpo += `<h3>${esc(E.cq_t_dados)}</h3>${htmlColunas(r, gi)}`;
    else if (dd.tipo === "linha") corpo = htmlColunas(r, gi);
    const acoes = [];
    if (dd.href) acoes.push(`<a class="btn btn-sm btn-primary" href="${dd.href}" data-ir>${icone("arrow")} ${esc(E.cq_abrir[dd.tipo] || E.cq_abrir.secao)}</a>`);
    if (dd.tipo === "secao") {
      if (dd.hLocal) acoes.push(`<a class="btn btn-sm btn-ghost" href="${dd.hLocal}" data-ir>${icone("building")} ${esc(E.cq_ir_local)}</a>`);
      acoes.push(`<a class="btn btn-sm btn-ghost" href="${dd.hMun}" data-ir>${icone("map")} ${esc(E.cq_ir_mun)}</a>`);
    }
    if (dd.hMun && dd.tipo === "local") acoes.push(`<a class="btn btn-sm btn-ghost" href="${dd.hMun}" data-ir>${icone("map")} ${esc(E.cq_ir_mun)}</a>`);
    if (r.G) acoes.push(`<button class="btn btn-sm btn-ghost" type="button" data-grupo="${gi}">${icone("list")} ${esc(E.cq_ver_linhas)}</button>`);
    return { kick, tit, sub, corpo, acoes: acoes.join("") };
  }
  // resumo curto (dica ao passar o mouse)
  function resumo(dd, r, gi) {
    const E = X(), L = t(), e = dd.e, by = porTurno(dd.ts);
    const c = conteudo(dd, r, gi);
    let h = `<strong>${esc(c.tit)}</strong>${c.kick ? `<div class="cq-d-k">${esc(c.kick)}</div>` : ""}`;
    const tf = r.turno || 0;
    const ns = [1, 2].filter((n) => by[n] && (!tf || n === tf) && (tf || !e.t || e.t === n || dd.tipo !== "secao"));
    if (dd.ts && ns.length) {
      h += ns.map((n) => {
        const x = by[n], cs = rankCands(n, x), val = x.validos || 1;
        const lid = cs.length > 1 ? `${cs[0].nr} ${pct(cs[0].v / val, 1)} × ${cs[1].nr} ${pct(cs[1].v / val, 1)} (${comSinal(cs[0].v - cs[1].v)})` : "";
        const extra = dd.tipo === "secao" ? `${L.lk_close} ${x.encerramento || "—"}` : `${nf(x.secoes)} ${E.cq_secoes.toLowerCase()} · ${nf(x.sinalizadas || 0)} ${E.cq_nivel.a}`;
        return `<div class="cq-d-t"><b>${esc(L.round(n))}</b> · ${esc(L.lk_comp)} ${pct(x.comparecimento / (x.aptos || 1), 1)} · ${esc(extra)}${lid ? `<br>${esc(lid)}` : ""}</div>`;
      }).join("");
      if (dd.tipo === "secao") { const fl = dd.fl.filter((f) => ns.includes(f[0])), n = fl.length; h += `<div class="cq-d-t">${esc(E.cq_t_sin)}: ${n ? fl.map((f) => `${A.numTeste(f[1])}${f[2] === "a" ? "" : "ⁱ"}`).join(", ") : esc(E.cq_nenhuma)}</div>`; }
    } else if (dd.tipo === "linha" || !dd.ts) {
      const ident = r.m.colunas.map(identCol), l = r.m.linhas[gi];
      h += r.m.colunas.slice(0, 8).map((col, i) => `<div class="cq-d-t"><b>${esc(col)}</b>: ${fmtCel(l[i], ident[i])}</div>`).join("");
    }
    return h + `<div class="cq-d-ir">${esc(E.cq_dica_clique)}</div>`;
  }

  // --- painel flutuante ---------------------------------------------------------------------------------------------
  const painel = { el: null, gi: null, seq: 0 };
  function painelEl() {
    if (painel.el && painel.el.isConnected) return painel.el;
    const E = X(), el = document.createElement("aside");
    el.className = "cq-painel"; el.hidden = true; el.tabIndex = -1;
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "false"); el.setAttribute("aria-labelledby", "cq-p-tit");
    el.innerHTML = `<div class="cq-p-head"><div><p class="cq-p-kick"></p><h2 id="cq-p-tit"></h2><p class="cq-p-sub small muted"></p></div>
      <button class="icon-btn" type="button" data-p="x" aria-label="${esc(E.cq_p_fechar)}" title="${esc(E.cq_p_fechar)} (Esc)">${icone("close")}</button></div>
      <div class="cq-p-body"></div>
      <div class="cq-p-foot"><div class="btn-row cq-p-acoes"></div>
        <div class="cq-p-nav"><button class="btn btn-sm btn-ghost" type="button" data-p="ant" aria-label="${esc(E.cq_p_ant)}" title="${esc(E.cq_p_ant)} (↑)">‹</button><span class="small muted"></span><button class="btn btn-sm btn-ghost" type="button" data-p="prox" aria-label="${esc(E.cq_p_prox)}" title="${esc(E.cq_p_prox)} (↓)">›</button></div></div>`;
    document.body.append(el);
    el.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-p]");
      if (b) { if (b.dataset.p === "x") fecharPainel(true); else passoPainel(b.dataset.p === "prox" ? 1 : -1); return; }
      const g = ev.target.closest("[data-grupo]");
      if (g) { fecharPainel(); abrirGrupo(+g.dataset.grupo); return; }
      if (ev.target.closest("a[href^='#']") && cq.res) cq.res.volta = { i: painel.gi, painel: true };
    });
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") { ev.preventDefault(); fecharPainel(true); }
      else if ((ev.key === "ArrowDown" || ev.key === "ArrowUp") && !ev.target.closest("input,select,textarea")) { ev.preventDefault(); passoPainel(ev.key === "ArrowDown" ? 1 : -1); }
    });
    painel.el = el;
    return el;
  }
  async function abrirPainel(gi) {
    const r = cq.res; if (!r) return;
    const E = X(), el = painelEl(), seq = ++painel.seq;
    painel.gi = gi; r.sel = gi;
    dicaEsconder();
    $$("#cq-res tr.cq-sel").forEach((tr) => tr.classList.remove("cq-sel"));
    const tr = $(`#cq-res tr[data-i="${gi}"]`); if (tr) tr.classList.add("cq-sel");
    const k = r.idx.indexOf(gi), n = r.m.linhas.length;
    el.querySelector(".cq-p-nav span").textContent = E.cq_p_linha(nf(k + 1), nf(n));
    el.querySelector('[data-p="ant"]').disabled = k <= 0;
    el.querySelector('[data-p="prox"]').disabled = k >= n - 1;
    const aberto = !el.hidden;
    const hd = $("#site-head");
    el.style.top = innerWidth > 700 && hd ? `${Math.max(12, Math.round(hd.getBoundingClientRect().bottom) + 10)}px` : "";
    if (!aberto) { el.hidden = false; document.documentElement.classList.add("cq-p-on"); }
    el.querySelector(".cq-p-body").innerHTML = carregando();
    const dd = await dadosLinha(r, gi);
    if (seq !== painel.seq || cq.res !== r) return;
    const c = conteudo(dd, r, gi);
    el.querySelector(".cq-p-kick").textContent = c.kick;
    el.querySelector("#cq-p-tit").textContent = c.tit;
    const sub = el.querySelector(".cq-p-sub"); sub.textContent = c.sub; sub.hidden = !c.sub;
    const corpo = el.querySelector(".cq-p-body");
    corpo.innerHTML = c.corpo; corpo.scrollTop = 0;
    animarPainel(corpo);
    el.querySelector(".cq-p-acoes").innerHTML = c.acoes;
    if (!aberto) el.focus({ preventScroll: true });
  }
  function fecharPainel(foco) {
    if (!painel.el || painel.el.hidden) return;
    painel.el.hidden = true; painel.seq++;
    document.documentElement.classList.remove("cq-p-on");
    const r = cq.res;
    if (r) { r.sel = null; const tr = $(`#cq-res tr[data-i="${painel.gi}"]`); if (tr) { tr.classList.remove("cq-sel"); if (foco) tr.focus({ preventScroll: true }); } }
  }
  function passoPainel(dir) {
    const r = cq.res; if (!r || painel.gi == null) return;
    const k = r.idx.indexOf(painel.gi) + dir;
    if (k < 0 || k >= r.idx.length) return;
    const gi = r.idx[k], pag = Math.floor(k / r.pp);
    if (pag !== r.pag) { r.pag = pag; r.sel = gi; mostrarRes(); }
    const tr = $(`#cq-res tr[data-i="${gi}"]`);
    if (tr) tr.scrollIntoView({ block: "nearest" });
    abrirPainel(gi);
  }
  function abrirGrupo(gi) {
    const r = cq.res; if (!r || !r.G || !cq.rodar) return;
    cq.hist.push(r); if (cq.hist.length > 5) cq.hist.shift();
    $("#cq-sql").value = sqlGrupo(r.G, r.m.linhas[gi]);
    cq.rodar(true);
  }

  // --- dica ao passar o mouse ---------------------------------------------------------------------------------------
  const dica = { el: null, tr: null, tm: 0, x: 0, y: 0 };
  function dicaPos() {
    const el = dica.el; if (!el || el.hidden) return;
    const r = el.getBoundingClientRect(); let x = dica.x + 16, y = dica.y + 18;
    if (x + r.width > innerWidth - 8) x = Math.max(8, dica.x - r.width - 16);
    if (y + r.height > innerHeight - 8) y = Math.max(8, dica.y - r.height - 14);
    el.style.left = x + "px"; el.style.top = y + "px";
  }
  function dicaEsconder() { clearTimeout(dica.tm); dica.tr = null; if (dica.el) dica.el.hidden = true; }
  function dicaMostrar(tr) {
    if (dica.tr === tr) return;
    dica.tr = tr; clearTimeout(dica.tm);
    if (dica.el) dica.el.hidden = true;
    dica.tm = setTimeout(async () => {
      const r = cq.res, gi = +tr.dataset.i;
      if (!r || dica.tr !== tr) return;
      if (!dica.el || !dica.el.isConnected) { dica.el = document.createElement("div"); dica.el.className = "tip cq-dica"; dica.el.setAttribute("role", "tooltip"); document.body.append(dica.el); }
      const dd = await dadosLinha(r, gi);
      if (dica.tr !== tr || cq.res !== r) return;
      dica.el.innerHTML = resumo(dd, r, gi); dica.el.hidden = false; dicaPos();
    }, 220);
  }
  window.addEventListener("scroll", () => dicaEsconder(), { passive: true });
  // ao trocar de página (ou de idioma) o painel fecha e é refeito no idioma atual
  document.addEventListener("pagina", () => { dicaEsconder(); fecharPainel(); if (painel.el) { painel.el.remove(); painel.el = null; } if (dica.el) { dica.el.remove(); dica.el = null; } });

  // Liga os eventos da área de resultado (uma vez por página aberta)
  function ligarRes(box) {
    const abrirLinha = (gi) => abrirPainel(gi);
    box.addEventListener("click", async (ev) => {
      const r = cq.res; if (!r) return;
      const pg = ev.target.closest("[data-pg]");
      if (pg) {
        const np = Math.ceil(r.m.linhas.length / r.pp), alvo = { ini: 0, ant: r.pag - 1, prox: r.pag + 1, fim: np - 1 }[pg.dataset.pg];
        irPagina(alvo, pg.closest(".cq-pag").dataset.pos === "base"); return;
      }
      const o = ev.target.closest("[data-ord]");
      if (o) {
        const i = +o.dataset.ord, d = r.ord && r.ord.i === i ? (r.ord.d === 1 ? -1 : 0) : 1;
        r.ord = d ? { i, d } : null; ordenar(r); r.pag = 0; mostrarRes(); return;
      }
      if (ev.target.closest("[data-voltar]")) {
        const ant = cq.hist.pop(); if (!ant) return;
        cq.res = ant; $("#cq-sql").value = ant.sql; mostrarRes(); return;
      }
      const g = ev.target.closest("[data-grupo]");
      if (g) { abrirGrupo(+g.dataset.grupo); return; }
      const tr = ev.target.closest("tr.cq-lin");
      if (!tr || ev.target.closest("button,input,select")) return;
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey) novaAba(+tr.dataset.i); else abrirLinha(+tr.dataset.i);
    });
    // Ctrl+clique ou botão do meio: abre a página da linha em outra aba
    const novaAba = async (gi) => { const r = cq.res, e = r.ler(r.m.linhas[gi]), h = await resolver(e, destino(e)); if (h) window.open(new URL(h, location.href).href, "_blank", "noopener"); };
    box.addEventListener("auxclick", (ev) => { const tr = ev.button === 1 && ev.target.closest("tr.cq-lin"); if (tr) { ev.preventDefault(); novaAba(+tr.dataset.i); } });
    box.addEventListener("keydown", (ev) => {
      const tr = ev.target.closest && ev.target.closest("tr.cq-lin");
      if (tr && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); abrirLinha(+tr.dataset.i); }
      else if (tr && (ev.key === "ArrowDown" || ev.key === "ArrowUp")) { ev.preventDefault(); const o = ev.key === "ArrowDown" ? tr.nextElementSibling : tr.previousElementSibling; if (o) o.focus(); }
    });
    box.addEventListener("change", (ev) => {
      const r = cq.res; if (!r) return;
      if (ev.target.matches(".cq-pag-n input")) irPagina((parseInt(ev.target.value, 10) || 1) - 1, ev.target.closest(".cq-pag").dataset.pos === "base");
      else if (ev.target.matches(".cq-pag-pp select")) {
        const prim = r.pag * r.pp; r.pp = +ev.target.value; r.pag = Math.floor(prim / r.pp);
        try { localStorage.setItem("cq_pp", String(r.pp)); } catch (e) { /* sem armazenamento */ }
        mostrarRes();
      }
    });
    box.addEventListener("pointerover", (ev) => {
      if (ev.pointerType !== "mouse") return;
      const tr = ev.target.closest("tr.cq-lin");
      if (tr) { dica.x = ev.clientX; dica.y = ev.clientY; dicaMostrar(tr); } else dicaEsconder();
    });
    box.addEventListener("pointermove", (ev) => { if (ev.pointerType === "mouse") { dica.x = ev.clientX; dica.y = ev.clientY; dicaPos(); } });
    box.addEventListener("pointerleave", dicaEsconder);
    box.addEventListener("focusin", (ev) => {
      const tr = ev.target.closest("tr.cq-lin"); if (!tr || !tr.matches(":focus-visible")) return;
      const rc = tr.getBoundingClientRect(); dica.x = rc.left + 40; dica.y = rc.bottom - 4; dicaMostrar(tr);
    });
    box.addEventListener("focusout", dicaEsconder);
  }

  const pgConsulta = {
    ativo: "query",
    titulo: () => X().cq_title,
    html() {
      const E = X(), q = A.state.query, sel = new Set((q.get("ufs") || "").split(",").filter(Boolean));
      const ufs = ufsLoc();
      if (["0", "1", "2"].includes(q.get("turno"))) cq.turno = +q.get("turno");
      return `${cabecalho(E.cq_title, E.cq_sub, false)}
        <section class="card cq-p"><h2>${esc(E.cq_p1)}</h2><p class="small muted">${esc(E.cq_p1_note)}</p>
          <div class="cq-ufs" id="cq-ufs">${ufs.map((u) => `<label class="cq-uf${cq.carregados.has(u) ? " ok" : ""}"><input type="checkbox" value="${u}"${sel.has(u) || cq.carregados.has(u) ? " checked" : ""}${cq.carregados.has(u) ? " disabled" : ""}><span>${u}</span></label>`).join("")}</div>
          <div class="btn-row"><button class="btn btn-sm btn-ghost" type="button" id="cq-todos">${esc(E.cq_todos)}</button><button class="btn btn-sm btn-ghost" type="button" id="cq-nenhum">${esc(E.cq_nenhum)}</button>
            <button class="btn btn-primary" type="button" id="cq-carregar">${icone("download")} ${esc(E.cq_carregar)}</button></div>
          <p class="small" id="cq-status" aria-live="polite">${cq.carregados.size ? esc(E.cq_carregado([...cq.carregados].join(", "), nf(cq.secoes))) : ""}</p><div class="cq-prog" hidden><span id="cq-prog"></span></div></section>
        <section class="card cq-p"><h2>${esc(E.cq_p2)}</h2>
          ${seletorTurno("form")}<p class="small muted cq-turnos-n">${esc(E.cq_turno_nota)}</p>
          <form class="cq-form" id="cq-form">
            <div class="filters"><label><span>${esc(E.cq_tab)}</span><select name="tab">${Object.keys(E.cq_desc_tab).map((k) => `<option value="${k}">${k} — ${esc(E.cq_desc_tab[k])}</option>`).join("")}</select></label>
              <label><span>${esc(E.cq_agrupar)}</span><select name="grupo"></select></label>
              <label><span>${esc(E.cq_medida)}</span><select name="medida"></select></label>
              <label><span>${esc(E.cq_ordenar)}</span><select name="ordem"></select></label>
              <label><span>&nbsp;</span><select name="dir"><option value="DESC">${esc(E.cq_desc)}</option><option value="ASC">${esc(E.cq_asc)}</option></select></label>
              <label><span>${esc(E.cq_limite)}</span><input type="number" name="lim" min="1" max="1000000" value="100000"></label></div>
            <details class="cq-cols"><summary>${esc(E.cq_cols)} (<span id="cq-ncols">${esc(E.cq_todas)}</span>)</summary><div id="cq-colbox"></div></details>
            <h3 class="small">${esc(E.cq_filtros)}</h3><div id="cq-filtros"></div><button class="btn btn-sm btn-ghost" type="button" id="cq-addf">${icone("plus")} ${esc(E.cq_add_f)}</button>
            <div class="btn-row cq-gerar"><button class="btn" type="submit">${icone("code")} ${esc(E.cq_montar)}</button></div>
          </form>
          <h3 class="small">${esc(E.cq_exemplos)}</h3><div class="cq-ex">${E.cq_ex.map(([r], i) => `<button class="chipq" type="button" data-ex="${i}">${esc(r)}</button>`).join("")}</div>
          <label class="cq-sql-l"><span>${esc(E.cq_sql)}</span><textarea id="cq-sql" rows="7" spellcheck="false">${esc(q.get("q") || (cq.res && cq.res.sql) || E.cq_ex[0][1])}</textarea></label>
          <div class="btn-row"><button class="btn btn-primary" type="button" id="cq-rodar">${icone("play")} ${esc(E.cq_rodar)}</button><button class="btn btn-sm btn-ghost" type="button" id="cq-link">${icone("link")} ${esc(E.cq_link)}</button></div>
          <details class="cq-ref"><summary>${esc(E.cq_tabelas_t)}</summary><div id="cq-ref"></div></details></section>
        <section class="card cq-p" id="cq-res-c"><h2>${esc(E.cq_p3)}</h2>${seletorTurno("res")}<p class="small muted" id="cq-info"></p><div id="cq-res"></div>
          <div class="btn-row" id="cq-dl" hidden><button class="btn btn-sm" type="button" data-cq="csv">${icone("download")} ${esc(E.cq_csv)}</button><button class="btn btn-sm btn-ghost" type="button" data-cq="json">${icone("download")} ${esc(E.cq_json)}</button></div></section>${A.botCta()}`;
    },
    async iniciar() {
      const E = X(), f = $("#cq-form");
      const marcados = () => $$("#cq-ufs input:checked").map((i) => i.value);
      $("#cq-todos").addEventListener("click", () => $$("#cq-ufs input").forEach((i) => { i.checked = true; }));
      $("#cq-nenhum").addEventListener("click", () => $$("#cq-ufs input:not(:disabled)").forEach((i) => { i.checked = false; }));
      const status = (txt) => { $("#cq-status").textContent = txt; };
      async function carregar() {
        const novos = marcados().filter((u) => !cq.carregados.has(u));
        if (!novos.length) return;
        const barra = $(".cq-prog"); barra.hidden = false;
        $("#cq-carregar").disabled = true;
        try {
          await iniciarBanco();
          for (let i = 0; i < novos.length; i++) {
            status(E.cq_progresso(`${novos[i]} (${i + 1}`, `${novos.length})`));
            const m = await pedir({ tipo: "uf", uf: novos[i] }, ([a, b]) => { $("#cq-prog").style.width = `${(100 * (i + a / b) / novos.length).toFixed(1)}%`; });
            cq.carregados.add(novos[i]); cq.secoes = m.secoes;
            const el = $(`#cq-ufs input[value="${novos[i]}"]`); if (el) { el.disabled = true; el.parentNode.classList.add("ok"); }
          }
          status(`${E.cq_carregado([...cq.carregados].join(", "), nf(cq.secoes))} · ${E.cq_pronto}`);
          montarForm();
        } catch (e) { status(`${E.cq_erro}: ${e.message}`); }
        barra.hidden = true; $("#cq-carregar").disabled = false;
      }
      $("#cq-carregar").addEventListener("click", carregar);

      // construtor visual
      const colsDe = (tab) => cq.colunas[tab] || [];
      function opcoes(sel, lista, vazio) { sel.innerHTML = (vazio ? `<option value="">${esc(vazio)}</option>` : "") + lista.map((c) => `<option value="${c}">${c}</option>`).join(""); }
      function linhaFiltro() {
        const cs = colsDe(f.elements.tab.value);
        const d = document.createElement("div");
        d.className = "cq-f";
        d.innerHTML = `<select class="cq-fc">${cs.map((c) => `<option>${c}</option>`).join("")}</select><select class="cq-fo">${Object.entries(E.cq_ops).map(([k, r]) => `<option value="${k}">${esc(r)}</option>`).join("")}</select>
          <input class="cq-fv" type="text" aria-label="valor"><button class="icon-btn" type="button" aria-label="${esc(t().close || "x")}">${icone("close")}</button>`;
        d.querySelector("button").addEventListener("click", () => d.remove());
        $("#cq-filtros").append(d);
      }
      function montarForm() {
        const tab = f.elements.tab.value, cs = colsDe(tab);
        opcoes(f.elements.grupo, cs, E.cq_nada);
        const num = cs.filter((c) => /^(aptos|comparecimento|faltosos|validos|brancos|nulos|sinalizada|secoes|votos|v\d+|lat|lon|zona|secao|local|turno)$/.test(c));
        f.elements.medida.innerHTML = `<option value="count">${esc(E.cq_contar)}</option>` + num.map((c) => `<option value="sum:${c}">${esc(E.cq_somar)} ${c}</option><option value="avg:${c}">${esc(E.cq_media)} ${c}</option>`).join("");
        opcoes(f.elements.ordem, ["(auto)"].concat(cs), "");
        f.elements.ordem.querySelector("option").remove();
        $("#cq-colbox").innerHTML = cs.map((c) => `<label class="cq-col"><input type="checkbox" value="${c}" checked><span>${c}</span></label>`).join("");
        $("#cq-filtros").innerHTML = "";
        $("#cq-ref").innerHTML = Object.keys(cq.colunas).map((k) => `<h4>${k} <small class="muted">${esc(E.cq_desc_tab[k] || "")}</small></h4><p class="small">${cq.colunas[k].map((c) => `<code>${c}</code> ${esc(E.cq_col[/^v\d+$/.test(c) ? "vNN" : c] || "")}`).join(" · ")}</p>`).join("");
      }
      f.elements.tab.addEventListener("change", montarForm);
      $("#cq-addf").addEventListener("click", () => { if (!cq.colunas.secoes) { status(E.cq_antes); return; } linhaFiltro(); });
      $("#cq-colbox").addEventListener("change", () => { const n = $$("#cq-colbox input:checked").length, tot = $$("#cq-colbox input").length; $("#cq-ncols").textContent = n === tot ? E.cq_todas : String(n); });
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!cq.colunas.secoes) { status(E.cq_antes); return; }
        const tab = f.elements.tab.value, grupo = f.elements.grupo.value, med = f.elements.medida.value, ord = f.elements.ordem.value, dir = f.elements.dir.value;
        const lim = Math.max(1, Math.min(1000000, parseInt(f.elements.lim.value, 10) || 100000));
        const where = $$("#cq-filtros .cq-f").map((d) => {
          const c = d.querySelector(".cq-fc").value, o = d.querySelector(".cq-fo").value, v = d.querySelector(".cq-fv").value.trim();
          if (!v) return null;
          const lit = /^-?\d+(\.\d+)?$/.test(v) ? v : `'${v.replace(/'/g, "''")}'`;
          return o === "like" ? `${c} LIKE '%${v.replace(/'/g, "''")}%'` : `${c} ${o} ${lit}`;
        }).filter(Boolean);
        let sel, gb = "", ob = "";
        if (grupo) {
          const [fn, col] = med === "count" ? ["COUNT", "*"] : med.split(":").map((x, i) => (i ? x : x.toUpperCase()));
          const alias = med === "count" ? "linhas" : `${fn.toLowerCase() === "avg" ? "media" : "soma"}_${col}`;
          sel = `${grupo}, ${fn === "AVG" ? `ROUND(AVG(${col}), 2)` : `${fn}(${col})`} AS ${alias}`;
          gb = `\nGROUP BY ${grupo}`;
          ob = `\nORDER BY ${ord && ord !== "(auto)" && ord === grupo ? grupo : alias} ${dir}`;
        } else {
          const cs = $$("#cq-colbox input:checked").map((i) => i.value), tot = $$("#cq-colbox input").length;
          sel = cs.length && cs.length < tot ? cs.join(", ") : "*";
          if (ord && ord !== "(auto)") ob = `\nORDER BY ${ord} ${dir}`;
        }
        $("#cq-sql").value = `SELECT ${sel}\nFROM ${tab}${where.length ? `\nWHERE ${where.join("\n  AND ")}` : ""}${gb}${ob}\nLIMIT ${lim}`;
        rodar();
      });
      $(".cq-ex").addEventListener("click", (e) => {
        const b = e.target.closest("[data-ex]"); if (!b) return;
        const sql = E.cq_ex[+b.dataset.ex][1], mt = /\bturno\s*=\s*([12])\b/.exec(sql);
        // exemplo feito para um turno: o seletor acompanha (senão o resultado viria vazio)
        if (mt && cq.turno && cq.turno !== +mt[1]) mudarTurno(+mt[1], false);
        $("#cq-sql").value = sql; if (cq.colunas.secoes) rodar();
      });

      async function rodar(manter) {
        if (!cq.carregados.size) { status(E.cq_antes); $("#cq-carregar").focus(); return; }
        const sql = $("#cq-sql").value.trim();
        if (manter !== true) cq.hist = [];
        fecharPainel();
        $("#cq-res").innerHTML = carregando(); $("#cq-info").textContent = ""; $("#cq-dl").hidden = true;
        const t0 = performance.now();
        try {
          const m = await pedir({ tipo: "sql", sql, turno: cq.turno });
          cq.res = { id: ++cqResSeq, m, sql, turno: cq.turno, ms: Math.round(performance.now() - t0), pag: 0, pp: ppSalvo(), ord: null, sel: null, ler: leitor(m.colunas), G: agrupada(sql, m.colunas) };
          const nomes = m.colunas.map(nomeCol);
          cq.res.temSec = ["uf", "zona", "secao"].every((c) => nomes.includes(c));
          if (cq.res.temSec) { try { cq.sin = await sinaisSecoes(); } catch (e2) { cq.sin = null; } }
          ordenar(cq.res);
          mostrarRes();
          $("#cq-res-c").scrollIntoView({ block: "start", behavior: "smooth" });
        } catch (e) { cq.res = null; $("#cq-res").innerHTML = `${voltarHtml()}<p class="alert"><b>${esc(E.cq_erro)}:</b> ${esc(e.message)}</p>`; }
      }
      cq.rodar = rodar;
      ligarRes($("#cq-res"));
      // turno da consulta: os dois seletores ficam iguais e a consulta roda de novo
      function mudarTurno(n, rodarJa) {
        if (cq.turno === n) return;
        cq.turno = n;
        try { localStorage.setItem("cq_turno", String(n)); } catch (e) { /* sem armazenamento */ }
        $$(".cq-turnos [data-turno]").forEach((b) => b.setAttribute("aria-checked", String(+b.dataset.turno === n)));
        linkConsulta();
        if (rodarJa !== false && cq.res && cq.carregados.size) rodar();
      }
      $$(".cq-turnos").forEach((g) => g.addEventListener("click", (e) => { const b = e.target.closest("[data-turno]"); if (b) mudarTurno(+b.dataset.turno); }));
      $("#cq-rodar").addEventListener("click", () => rodar());
      $("#cq-dl").addEventListener("click", (e) => {
        const b = e.target.closest("[data-cq]"), r = cq.res; if (!b || !r) return;
        const ultimo = { colunas: r.m.colunas, linhas: r.idx.map((i) => r.m.linhas[i]) };
        const nome = `consulta-${new Date().toISOString().slice(0, 10)}`;
        if (b.dataset.cq === "csv") baixar(nome + ".csv", "﻿" + [ultimo.colunas].concat(ultimo.linhas).map((l) => l.map(csvCampo).join(",")).join("\r\n"), "text/csv;charset=utf-8");
        else baixar(nome + ".json", JSON.stringify(ultimo.linhas.map((l) => Object.fromEntries(l.map((v, i) => [ultimo.colunas[i], v])))), "application/json");
      });
      // o botão copia pelo [data-copy] do site; o link é refeito a cada mudança
      const linkConsulta = () => { $("#cq-link").dataset.copy = `${SITE}#/consulta?ufs=${encodeURIComponent((cq.carregados.size ? [...cq.carregados] : marcados()).join(","))}${cq.turno ? `&turno=${cq.turno}` : ""}&q=${encodeURIComponent($("#cq-sql").value.trim())}`; };
      ["input", "change"].forEach((ev) => { $("#cq-sql").addEventListener(ev, linkConsulta); $("#cq-ufs").addEventListener(ev, linkConsulta); });
      $("#cq-link").addEventListener("pointerdown", linkConsulta); $("#cq-link").addEventListener("focus", linkConsulta);
      linkConsulta();
      if (cq.colunas.secoes) montarForm();
      // volta de uma página aberta pelo resultado: a tabela, a página e a linha continuam onde estavam
      if (cq.res && $("#cq-sql").value.trim() === cq.res.sql && cq.res.turno === cq.turno) {
        mostrarRes();
        const v = cq.res.volta; cq.res.volta = null;
        if (v) {
          const tr = $(`#cq-res tr[data-i="${v.i}"]`);
          if (tr) { tr.scrollIntoView({ block: "center" }); tr.classList.add("cq-volta"); setTimeout(() => tr.classList.remove("cq-volta"), 2600); }
          if (v.painel) setTimeout(() => abrirPainel(v.i), 0);
        }
      }
      // link com estados e consulta: carrega e roda
      if (A.state.query.get("ufs") && marcados().some((u) => !cq.carregados.has(u))) { await carregar(); if (A.state.query.get("q")) rodar(); }
    },
  };

  // ===================================================================================================
  // Kit de imprensa
  // ===================================================================================================
  async function numerosPrincipais() {
    const T1 = R().turnos["1"], T2 = R().turnos["2"], P2 = T2.presidente;
    let locaisN = null;
    try { const I = await indiceLoc(); locaisN = Object.values(I).reduce((a, x) => a + x.locais, 0); } catch (e) { /* sem índice */ }
    return { s2: T2.entrada.secoes, s1: T1.entrada.secoes, f2: T2.secoes_sinalizadas, f1: T1.secoes_sinalizadas, p2: T2.secoes_sinalizadas / T2.entrada.secoes, p1: T1.secoes_sinalizadas / T1.entrada.secoes,
      testes: 15, locais: locaisN, aptos: P2.aptos, comp: P2.comparecimento };
  }
  const pgImprensa = {
    ativo: "press",
    titulo: () => X().im_title,
    html() {
      const E = X(), L = t(), T2 = R().turnos["2"], P2 = T2.presidente;
      A.state.cartao = { kicker: `${L.round(2)} · ${L.roundDate[2]}`, titulo: L.hero_title,
        linhas: [[L.st_secoes, nf(T2.entrada.secoes)], [L.st_testes, "15"], [L.st_sinal, `${nf(T2.secoes_sinalizadas)} (${pct(T2.secoes_sinalizadas / T2.entrada.secoes)})`],
          [L.st_aptos, nf(P2.aptos)], [L.st_comp, `${nf(P2.comparecimento)} (${pct(P2.comparecimento / P2.aptos)})`]], barras: [A.barrasTurno ? A.barrasTurno(2, 2) : null].filter(Boolean) };
      return `${cabecalho(E.im_title, E.im_sub, true)}<div id="im-corpo">${carregando()}</div>${A.botCta()}`;
    },
    async iniciar() {
      const E = X(), N = await numerosPrincipais(), au = R().autor || { nome: "" };
      const partes = au.nome.trim().split(/\s+/), sob = partes.pop() || "";
      const v = { s2: nf(N.s2), s1: nf(N.s1), f2: nf(N.f2), f1: nf(N.f1), p2: pct(N.p2), p1: pct(N.p1), url: SITE, dom: SITE.replace(/^https:\/\/|\/$/g, ""), hoje: hoje(),
        autorAbnt: `${sob.toUpperCase()}, ${partes.join(" ")}`, autorApa: `${sob}, ${partes.map((x) => x[0] + ".").join(" ")}` };
      const nums = [["s2", nf(N.s2)], ["f2", `${nf(N.f2)} (${pct(N.p2)})`], ["s1", nf(N.s1)], ["f1", `${nf(N.f1)} (${pct(N.p1)})`], ["testes", "15"], ["aptos", nf(N.aptos)], ["comp", `${nf(N.comp)} (${pct(N.comp / N.aptos)})`]]
        .concat(N.locais ? [["locais", nf(N.locais)]] : []);
      const texto = (rot, txt) => `<article class="im-txt"><div class="h-row"><h3>${esc(rot)}</h3>${copiar(txt)}</div>${txt.split("\n\n").map((p) => `<p>${esc(p)}</p>`).join("")}<p class="small muted">${nf(txt.length)} ${A.state.lang === "EN" ? "characters" : "caracteres"}</p></article>`;
      const L = t(), A_ = R().autor;
      $("#im-corpo").innerHTML = `
        <section><h2>${esc(E.im_nums_t)}</h2><div class="im-nums">${nums.map(([k, x]) => `<div class="im-num"><b>${esc(x)}</b><span>${esc(E.im_n[k])}</span>${copiar(`${x} — ${E.im_n[k]}`)}</div>`).join("")}</div></section>
        <section><h2>${esc(E.im_textos_t)}</h2>${texto(E.im_curto, E.im_txt_curto(v))}${texto(E.im_medio, E.im_txt_medio(v))}${texto(E.im_longo, E.im_txt_longo(v))}</section>
        <section class="grid2">
          <div class="card"><h2>${esc(E.im_citar_t)}</h2>${[[E.im_simples, E.im_cit_simples(v)], [E.im_abnt, E.im_cit_abnt(v)], [E.im_apa, E.im_cit_apa(v)]].map(([r, x]) => `<div class="im-cit"><h3 class="small">${esc(r)}</h3><p>${esc(x)}</p>${copiar(x)}</div>`).join("")}</div>
          <div class="card"><h2>${esc(E.im_palavras_t)}</h2>${tabela([`${icone("check")} ${esc(E.im_usar)}`, `${icone("close")} ${esc(E.im_evitar)}`], E.im_palavras.map(([u, ev]) => [`<b class="im-ok">${esc(u)}</b>`, `<s class="im-no">${esc(ev)}</s>`]), "im-pal")}</div>
        </section>
        <section class="grid2">
          <div class="card"><h2>${esc(E.im_imgs_t)}</h2><figure class="im-og"><img src="site/img/og.jpg" alt="${esc(L.hero_title)}" width="1200" height="630" loading="lazy"><figcaption class="small muted">${esc(E.im_og)}</figcaption></figure>
            <div class="btn-row"><a class="btn btn-sm" href="site/img/og.jpg" download="auditoria-bu-2026.jpg">${icone("download")} ${esc(E.im_baixar)}</a><button class="btn btn-sm btn-ghost" type="button" data-img>${icone("image")} ${esc(E.im_gerar)}</button></div></div>
          <div class="card"><h2>${esc(E.im_arq_t)}</h2><ul class="im-arq">${E.im_arq.map(([r, h]) => `<li><a href="${h}" download>${icone("file")} ${esc(r)}</a></li>`).join("")}${E.im_arq_pg.map(([r, h]) => `<li><a href="${h}">${icone("arrow")} ${esc(r)}</a></li>`).join("")}</ul>
            <h2>${esc(E.im_contato_t)}</h2><p>${esc(E.im_contato)}</p><div class="btn-row"><a class="btn btn-sm" href="${A.TELEGRAM}" target="_blank" rel="noopener">${icone("tg")} Telegram</a>
            ${A_ ? `<a class="btn btn-sm btn-ghost" href="https://www.instagram.com/${A_.instagram.replace("@", "")}/" target="_blank" rel="noopener">${icone("insta")} ${esc(A_.instagram)}</a>` : ""}</div></div>
        </section>`;
      A.efeitos($("#im-corpo"));
    },
  };

  // ===================================================================================================
  // Números principais como página (para incorporar)
  // ===================================================================================================
  const pgWidget = {
    ativo: "embed",
    titulo: () => X().eb_tipos.numeros,
    html() {
      const E = X(), L = t(), T2 = R().turnos["2"], P2 = T2.presidente;
      const cands = P2.candidatos.filter((c) => c.nr !== "95" && c.nr !== "96"), val = cands.reduce((a, c) => a + c.votos, 0);
      return `<section class="card wg" id="wg-numeros"><p class="kicker">${esc(L.round(2))} · ${esc(L.roundDate[2])}</p><h2>${esc(E.eb_nums_t)}</h2><p class="small muted">${esc(E.eb_nums_sub)}</p>
        <div class="tiles">${[[T2.entrada.secoes, L.st_secoes, "grid"], [15, L.st_testes, "flask"], [T2.secoes_sinalizadas, L.st_sinal, "flag", `(${pct(T2.secoes_sinalizadas / T2.entrada.secoes)})`], [P2.comparecimento, L.st_comp, "vote", `(${pct(P2.comparecimento / P2.aptos)})`]]
          .map(([v, r, ic, ex]) => A.tile(v, r, r, ic, ex)).join("")}</div>
        ${A.barras(cands.map((c) => ({ rotulo: `${A.titulo(c.nome)} (${c.nr})`, valor: c.votos, texto: pct(c.votos / val), dica: `${nf(c.votos)} · ${pct(c.votos / val)} ${L.valid}` })))}</section>`;
    },
  };

  // ===================================================================================================
  // Incorporar
  // ===================================================================================================
  const pgIncorporar = {
    ativo: "embed",
    titulo: () => X().eb_title,
    html() {
      const E = X(), L = t(), q = A.state.query;
      const sel = (nome, rot, ops, at) => `<label data-campo="${nome}"><span>${esc(rot)}</span><select name="${nome}">${ops.map(([v, r]) => `<option value="${esc(v)}"${String(v) === String(at) ? " selected" : ""}>${esc(r)}</option>`).join("")}</select></label>`;
      const inp = (nome, rot, v, tipo) => `<label data-campo="${nome}"><span>${esc(rot)}</span><input name="${nome}" type="${tipo || "text"}" value="${esc(v)}"></label>`;
      return `${cabecalho(E.eb_title, E.eb_sub, false)}
        <section class="card"><form class="filters" id="eb-form">
          ${sel("tipo", E.eb_tipo, Object.entries(E.eb_tipos), q.get("tipo") || "numeros")}
          ${sel("uf", E.eb_uf, ufsLoc().map((u) => [u, `${u} – ${A.ufNome(u)}`]), q.get("uf") || "PR")}
          ${inp("zona", E.eb_zona, q.get("z") || "177", "number")}${inp("secao", E.eb_secao, q.get("s") || "88", "number")}
          <label data-campo="mun"><span>${esc(E.eb_mun)}</span><select name="mun"></select></label>
          ${inp("local", E.eb_local, q.get("l") || "177-1260")}
          ${sel("graf", E.eb_graf, Object.entries(E.eb_graficos), q.get("g") || "T11")}
          ${sel("turno", E.eb_turno, [["2", L.round(2)], ["1", L.round(1)]], "2")}
          ${sel("lang", E.eb_lang, [["PT", "Português"], ["EN", "English"], ["ES", "Español"]], A.state.lang)}
          ${sel("tema", E.eb_tema, [["escuro", E.eb_escuro], ["claro", E.eb_claro]], document.documentElement.getAttribute("data-theme") === "light" ? "claro" : "escuro")}
          ${inp("alt", E.eb_altura, "640", "number")}
        </form></section>
        <section><h2>${esc(E.eb_codigo)}</h2><div id="eb-codigo"></div><p class="small muted">${esc(E.eb_auto)}</p><div id="eb-auto"></div></section>
        <section><div class="h-row"><h2>${esc(E.eb_previa)}</h2><a class="btn btn-sm btn-ghost" id="eb-abrir" target="_blank" rel="noopener">${icone("link")} ${esc(E.eb_abrir)}</a></div><div class="eb-previa" id="eb-previa"></div></section>${A.botCta()}`;
    },
    async iniciar() {
      const E = X(), f = $("#eb-form"), M = await A.municipios();
      const preencherMun = () => {
        const uf = f.elements.uf.value, ms = Object.entries(M[uf] || {}).map(([c, m]) => [c, A.titulo(m[0])]).sort((a, b) => a[1].localeCompare(b[1]));
        const at = f.elements.mun.value || A.state.query.get("m") || (uf === "PR" ? "75353" : "");
        f.elements.mun.innerHTML = ms.map(([c, n]) => `<option value="${c}"${c === at ? " selected" : ""}>${esc(n)}</option>`).join("");
      };
      const VIS = { numeros: [], secao: ["uf", "zona", "secao"], mun: ["uf", "mun"], grafico: ["graf", "turno"], mapa: ["turno"], local: ["uf", "mun", "local"] };
      let tm = null;
      const atualizar = () => {
        const v = Object.fromEntries(new FormData(f).entries());
        $$("[data-campo]", f).forEach((l) => { const c = l.dataset.campo; l.hidden = !["tipo", "lang", "tema", "alt"].includes(c) && !VIS[v.tipo].includes(c); });
        let rota;
        if (v.tipo === "numeros") rota = "#/widget";
        else if (v.tipo === "secao") rota = `#/secao/${v.uf}/${parseInt(v.zona, 10) || 1}/${parseInt(v.secao, 10) || 1}?so=lk-result`;
        else if (v.tipo === "mun") rota = `#/uf/${v.uf}/${v.mun}`;
        else if (v.tipo === "grafico") rota = `#/graficos/${v.graf}?so=g-${v.graf}&t=${v.turno}`;
        else if (v.tipo === "mapa") rota = `#/mapa?t=${v.turno}&so=mapa`;
        else rota = `#/locais/${v.uf}/${v.mun}/${v.local}`;
        const url = `${SITE}?embed=1&lang=${v.lang}&tema=${v.tema}${rota}`;
        const alt = Math.max(200, Math.min(3000, parseInt(v.alt, 10) || 640));
        const cod = `<iframe src="${url}" width="100%" height="${alt}" style="border:0;max-width:100%" loading="lazy" title="${E.eb_iframe_t} · ${E.eb_tipos[v.tipo]}" data-bu-2026></iframe>`;
        $("#eb-codigo").innerHTML = blocoCodigo(cod);
        $("#eb-auto").innerHTML = blocoCodigo(`<script>addEventListener("message",function(e){if(e.origin==="${SITE.replace(/\/$/, "")}"&&e.data&&e.data.buAltura)document.querySelectorAll("iframe[data-bu-2026]").forEach(function(f){if(f.contentWindow===e.source)f.style.height=e.data.buAltura+"px"})});<\/script>`);
        $("#eb-abrir").href = url;
        clearTimeout(tm);
        tm = setTimeout(() => { if (!$("#eb-previa")) return; $("#eb-previa").innerHTML = `<iframe src="./?embed=1&lang=${v.lang}&tema=${v.tema}${rota}" width="100%" height="${alt}" style="border:0" loading="lazy" title="${esc(E.eb_previa)}"></iframe>`; }, 350);
      };
      f.elements.uf.addEventListener("change", () => { f.elements.mun.value = ""; preencherMun(); });
      f.addEventListener("input", atualizar); f.addEventListener("change", atualizar);
      preencherMun(); atualizar();
    },
  };

  // --- modo incorporado: só o conteúdo, a fonte no rodapé e a altura para a página de fora --------------------
  if (EMBED) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#/"]');
      if (!a || a.closest(".emb-keep")) return;
      e.preventDefault();
      window.open(SITE + a.getAttribute("href"), "_blank", "noopener");
    }, true);
    const avisar = () => { try { parent.postMessage({ buAltura: Math.ceil(document.documentElement.scrollHeight), buRota: location.hash }, "*"); } catch (err) { /* sem página de fora */ } };
    if ("ResizeObserver" in window) new ResizeObserver(avisar).observe(document.documentElement);
    document.addEventListener("pagina", () => {
      const so = A.state.query.get("so"), main = $("#main");
      if (so) {
        let el = document.getElementById(so);
        if (el && so === "mapa") el = el.closest(".card") || el;
        if (el) {
          main.replaceChildren(el);
          const tq = A.state.query.get("t"), sel = el.querySelector('select[name="t"]');
          if (tq && sel && sel.value !== tq) { sel.value = tq; sel.dispatchEvent(new Event("change", { bubbles: true })); }
        }
      }
      let rod = $("#emb-fonte");
      if (!rod) { rod = document.createElement("div"); rod.id = "emb-fonte"; rod.className = "emb-fonte"; document.body.append(rod); }
      const E = X(), h = location.hash.replace(/([?&])so=[^&]*&?/, "$1").replace(/[?&]$/, "");
      rod.innerHTML = `<span>${esc(E.eb_fonte)}: <a href="${SITE}${esc(h)}" target="_blank" rel="noopener"><b>${esc(t().brand)}</b></a> · ${esc(t().badge)}</span><a href="${SITE}${esc(h)}" target="_blank" rel="noopener">${esc(E.eb_abrir_site)} ↗</a>`;
      setTimeout(avisar, 300);
    });
  }

  // ===================================================================================================
  // Para programadores
  // ===================================================================================================
  const pgDados = {
    ativo: "devs",
    titulo: () => X().dv_title,
    html() {
      const E = X(), base = SITE + "site/data/";
      const js = `const base = "${base}";
const [resumo, zona] = await Promise.all([
  fetch(base + "resumo.json").then((r) => r.json()),
  fetch(base + "secoes/PR/177.json").then((r) => r.json()),
]);
const [iMun, t1, t2] = zona.s["88"];
const votos = Object.fromEntries(resumo.ordem_votos["2"].map((nr, i) => [nr, t2[5][i] || 0]));
console.log(zona.mun[iMun][1], "aptos", t2[0], "votaram", t2[1], votos);`;
      const py = `import json, urllib.request
base = "${base}"
ler = lambda p: json.load(urllib.request.urlopen(base + p))
resumo, zona = ler("resumo.json"), ler("secoes/PR/177.json")
i_mun, t1, t2 = zona["s"]["88"][:3]
votos = dict(zip(resumo["ordem_votos"]["2"], t2[5]))
print(zona["mun"][i_mun][1], "aptos", t2[0], "votaram", t2[1], votos)`;
      const sh = `curl -s ${base}locais/indice.json
curl -s ${base}secoes/PR/177.json -o PR-177.json
curl -s ${base}SHA256SUMS.txt | head`;
      return `${cabecalho(E.dv_title, E.dv_sub, false)}
        <section class="card"><h2>${esc(E.dv_base)}</h2>${blocoCodigo(base)}<p class="small">${esc(E.dv_cors)}</p><p class="small muted" id="dv-motor"></p></section>
        <section><h2>${esc(E.dv_arquivos_t)}</h2><div id="dv-arqs">${carregando()}</div></section>
        <section><h2>${esc(E.dv_exemplo_t)}</h2><p>${esc(E.dv_ex_desc)}</p><h3 class="small">${esc(E.dv_ex_js)}</h3>${blocoCodigo(js)}<h3 class="small">${esc(E.dv_ex_py)}</h3>${blocoCodigo(py)}<h3 class="small">${esc(E.dv_ex_sh)}</h3>${blocoCodigo(sh)}</section>
        <section class="card"><h2>${esc(E.dv_regras_t)}</h2><ul>${E.dv_regras.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <div class="btn-row"><a class="btn btn-sm" href="#/consulta">${icone("db")} ${esc(t().nav.query)}</a><a class="btn btn-sm btn-ghost" href="#/provas">${icone("seal")} ${esc(t().nav.proofs)}</a><a class="btn btn-sm btn-ghost" href="#/downloads">${icone("download")} ${esc(t().nav.downloads)}</a></div></section>${A.botCta()}`;
    },
    async iniciar() {
      const E = X();
      ($("#dv-motor") || {}).textContent = E.dv_motor(R().motor.versao);
      let C = { arquivos: [] };
      try { C = await dado("site/data/catalogo.json"); } catch (e) { /* sem catálogo */ }
      const por = {}; C.arquivos.forEach((a) => { por[a.p] = a; });
      if (!$("#dv-arqs")) return;   // a pessoa já saiu da página
      $("#dv-arqs").innerHTML = Object.entries(E.dv_desc).map(([p, [desc, campos]]) => {
        const c = p.split(", ").map((x) => por[x]).filter(Boolean);
        const tam = c.length ? c.map((x) => (x.n > 1 ? E.dv_n_arq(nf(x.n), tamanho(x.bytes)) : tamanho(x.bytes))).join(" + ") : "";
        const url = SITE + "site/data/" + p.split(", ")[0].replace("{UF}", "PR").replace("{zona}", "177").replace("{pt,en,es}", "pt");
        return `<details class="dv-arq"><summary><code>${esc(p)}</code><span>${esc(desc)}</span><small class="muted">${esc(tam)}</small></summary>
          <div class="dv-corpo">${tabela([esc(E.dv_campos), ""], campos.map(([k, x]) => [`<code>${esc(k)}</code>`, esc(x)]), "dv-tab")}
          <p class="small"><a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a></p></div></details>`;
      }).join("");
    },
  };

  // ===================================================================================================
  // Provas e cópias
  // ===================================================================================================
  const pgProvas = {
    ativo: "proofs",
    titulo: () => X().pv_title,
    html() {
      const E = X();
      return `${cabecalho(E.pv_title, E.pv_sub, false)}
        <div class="pv-tres">${E.pv_tres.map(([tit, txt, h, r], i) => `<article class="card"><span class="pv-ico">${icone(["hash", "seal", "archive"][i])}</span><h2>${esc(tit)}</h2><p>${esc(txt)}</p>${h ? `<a class="btn btn-sm" href="${h}">${esc(r)}</a>` : ""}</article>`).join("")}</div>
        <section><h2>${icone("seal")} ${esc(E.pv_ots_t)}</h2><h3>${esc(E.pv_ots_como)}</h3><ol class="pv-passos">${E.pv_ots_passos.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
          <div class="btn-row"><a class="btn btn-sm" href="https://opentimestamps.org/" target="_blank" rel="noopener">${icone("link")} opentimestamps.org</a></div>
          <p class="small">${esc(E.pv_ots_cli)}</p>${blocoCodigo("ots verify Relatorio_Tecnico_Auditoria_Eleicoes_2026_PT.md.ots")}<div id="pv-ots">${carregando()}</div></section>
        <section><h2>${icone("archive")} ${esc(E.pv_arq_t)}</h2><p>${esc(E.pv_arq_txt)}</p>
          <div class="btn-row"><a class="btn btn-sm" href="https://web.archive.org/web/*/paranacontraoscorruptos.org*" target="_blank" rel="noopener">${icone("archive")} ${esc(E.pv_todas)}</a>
            <a class="btn btn-sm btn-ghost" href="https://web.archive.org/save/${SITE}" target="_blank" rel="noopener" title="${esc(E.pv_agora_note)}">${icone("plus")} ${esc(E.pv_agora)}</a>
            <a class="btn btn-sm btn-ghost" href="https://archive.ph/submit/?url=${encodeURIComponent(SITE)}" target="_blank" rel="noopener">${icone("plus")} ${esc(E.pv_archive_today)}</a></div>
          <p class="small muted">${esc(E.pv_agora_note)}</p><div id="pv-copias">${carregando()}</div></section>${A.botCta()}`;
    },
    async iniciar() {
      const E = X();
      const dataHora = (iso) => { try { return new Date(iso).toLocaleString({ PT: "pt-BR", EN: "en-US", ES: "es-ES" }[A.state.lang], { dateStyle: "short", timeStyle: "short" }); } catch (e) { return iso; } };
      try {
        const P = await dado("site/data/provas.json");
        const estado = (x) => (x.bloco ? chip("green", E.pv_confirmado(nf(x.bloco), x.quando ? dataHora(x.quando) : "")) : chip("amber", E.pv_pendente));
        const linha = (x) => [`<a href="${esc(x.p)}" download>${esc(x.p.split("/").slice(-2).join("/"))}</a>`, `<details class="sha"><summary><code>${esc(x.sha256.slice(0, 16))}…</code></summary><code class="wrap">${esc(x.sha256)}</code></details>`,
          `<a class="btn btn-sm" href="${esc(x.ots)}" download>${icone("download")} .ots</a>`, estado(x)];
        const cab = [E.pv_th_arq, E.pv_th_sha, E.pv_th_prova, E.pv_th_estado].map(esc);
        ($("#pv-ots") || {}).innerHTML = `<p class="small muted">${esc(E.pv_registrado(dataHora(P.data)))}${P.arquivos.some((x) => !x.bloco) ? ` · ${esc(E.pv_pendente_note)}` : ""}</p>
          <h3>${esc(E.pv_manif_t)}</h3><p class="small">${esc(E.pv_manif_txt)}</p>${tabela(cab, P.manifestos.map(linha), "pv-tab")}
          <h3>${esc(t().nav.downloads)}</h3>${tabela(cab, P.arquivos.map(linha), "pv-tab")}`;
      } catch (e) { ($("#pv-ots") || {}).innerHTML = `<p class="muted">${esc(E.pv_pendente)}</p>`; }
      try {
        const C = await dado("site/data/arquivo.json");
        ($("#pv-copias") || {}).innerHTML = C.copias && C.copias.length ? tabela([E.pv_th_end, E.pv_th_data, ""].map(esc), C.copias.map((c) => [`<code class="wrap">${esc(c.url.replace(SITE, "/"))}</code>`, esc(dataHora(c.quando)), `<a class="btn btn-sm" href="${esc(c.copia)}" target="_blank" rel="noopener">${icone("archive")} ${esc(E.pv_ver)}</a>`]), "pv-tab")
          : `<p class="muted">${esc(E.pv_sem_copias)}</p>`;
      } catch (e) { ($("#pv-copias") || {}).innerHTML = `<p class="muted">${esc(E.pv_sem_copias)}</p>`; }
    },
  };

  // ===================================================================================================
  // Linguagem simples: resumo curto no topo de cada página
  // ===================================================================================================
  function caixaSimples(ativo, rota) {
    if (EMBED) return;
    const E = X(), S = E.simples[ativo];
    if (!S) return;
    const main = $("#main");
    if (main.querySelector("details.simples")) return;
    let itens = S.slice();
    if (ativo === "tests" && rota[1] && A.state.extra && A.state.extra.simples[A.state.lang][rota[1]]) itens = [A.state.extra.simples[A.state.lang][rota[1]]].concat(itens);
    const aberto = A.ler("simples") === "1";
    const html = `<details class="simples"${aberto ? " open" : ""}><summary>${icone("text")}<b>${esc(E.simples_lbl)}</b><span>${esc(E.simples_t)}</span></summary><ul>${itens.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></details>`;
    const ref = main.querySelector(".page-head") || main.querySelector(".hero");
    if (ref) ref.insertAdjacentHTML("afterend", html); else main.insertAdjacentHTML("afterbegin", html);
    main.querySelector("details.simples").addEventListener("toggle", (e) => A.guardar("simples", e.target.open ? "1" : "0"));
  }
  A.linguagemSimples = (on) => { A.guardar("simples", on ? "1" : "0"); const d = $("details.simples"); if (d) d.open = on; };

  // Ao abrir cada página: linguagem simples e link para os locais na página do município
  document.addEventListener("pagina", (e) => {
    const rota = e.detail.rota || [], ativo = e.detail.ativo;
    if ((ativo === "places" && rota[3]) || rota[0] === "widget") return;   // a página do local monta o cabeçalho depois
    caixaSimples(ativo, rota);
    if (rota[0] === "uf" && rota[1] && rota[2] && !EMBED) {
      const ac = $("#main .page-head .pg-acoes");
      if (ac && !ac.querySelector("[data-lc]")) ac.insertAdjacentHTML("afterbegin", `<a class="btn btn-sm" data-lc href="#/locais/${rota[1].toUpperCase()}/${rota[2]}">${icone("building")} ${esc(X().lc_mun_link)}</a>`);
    }
  });

  // ===================================================================================================
  // Simulador de anomalias: arquivos carregados só quando a página é aberta
  // ===================================================================================================
  let simBase = null;
  const simIdioma = {};
  function simScript(src) {
    return new Promise((ok, erro) => { const el = document.createElement("script"); el.src = "site/js/" + src; el.onload = ok; el.onerror = () => erro(new Error(src)); document.head.append(el); });
  }
  function simCarregar() {
    if (!simBase) simBase = simScript("simulador-motor.js").then(() => simScript("simulador.js"));
    const lg = A.state.lang;
    if (!simIdioma[lg]) simIdioma[lg] = simScript(`simulador-${lg.toLowerCase()}.js`).catch(() => (lg === "PT" ? Promise.reject(new Error("PT")) : simScript("simulador-pt.js")));
    return Promise.all([simBase, simIdioma[lg]]);
  }
  const pgSimulador = {
    ativo: "sim",
    titulo: () => t().nav.sim,
    html() { document.documentElement.classList.add("sim-on"); return `<div id="sim-raiz" class="sim-carregando">${carregando()}</div>`; },
    async iniciar(p) {
      try { await simCarregar(); } catch (e) { $("#sim-raiz").innerHTML = erroDados(e); return; }
      if (!$("#sim-raiz") || (location.hash || "").indexOf("#/simulador") !== 0) return;
      $("#main").innerHTML = A.simulador.html(p);
      A.simulador.ligar(true);
      A.simulador.iniciar(p);
    },
  };
  document.addEventListener("pagina", (e) => { if (e.detail.ativo !== "sim") document.documentElement.classList.remove("sim-on"); });

  Object.assign(A.paginas, { simulador: pgSimulador, locais: pgLocais, perguntas: pgPerguntas, anatomia: pgAnatomia, consulta: pgConsulta, imprensa: pgImprensa, incorporar: pgIncorporar, widget: pgWidget, dados: pgDados, provas: pgProvas });
  A.extras = { locais, sinalizacoes, md };
})();
