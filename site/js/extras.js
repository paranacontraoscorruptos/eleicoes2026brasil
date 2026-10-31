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
  [["places", "#/locais"], ["faq", "#/perguntas"], ["anatomy", "#/anatomia"], ["query", "#/consulta"], ["press", "#/imprensa"], ["embed", "#/incorporar"], ["devs", "#/dados"], ["proofs", "#/provas"]]
    .forEach((x) => A.MAIS.push(x));
  Object.assign(A.ICO_MAIS, { places: "building", faq: "help", anatomy: "receipt", query: "db", press: "news", embed: "code", devs: "braces", proofs: "seal" });

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

  const pgConsulta = {
    ativo: "query",
    titulo: () => X().cq_title,
    html() {
      const E = X(), q = A.state.query, sel = new Set((q.get("ufs") || "").split(",").filter(Boolean));
      const ufs = ufsLoc();
      return `${cabecalho(E.cq_title, E.cq_sub, false)}
        <section class="card cq-p"><h2>${esc(E.cq_p1)}</h2><p class="small muted">${esc(E.cq_p1_note)}</p>
          <div class="cq-ufs" id="cq-ufs">${ufs.map((u) => `<label class="cq-uf${cq.carregados.has(u) ? " ok" : ""}"><input type="checkbox" value="${u}"${sel.has(u) || cq.carregados.has(u) ? " checked" : ""}${cq.carregados.has(u) ? " disabled" : ""}><span>${u}</span></label>`).join("")}</div>
          <div class="btn-row"><button class="btn btn-sm btn-ghost" type="button" id="cq-todos">${esc(E.cq_todos)}</button><button class="btn btn-sm btn-ghost" type="button" id="cq-nenhum">${esc(E.cq_nenhum)}</button>
            <button class="btn btn-primary" type="button" id="cq-carregar">${icone("download")} ${esc(E.cq_carregar)}</button></div>
          <p class="small" id="cq-status" aria-live="polite">${cq.carregados.size ? esc(E.cq_carregado([...cq.carregados].join(", "), nf(cq.secoes))) : ""}</p><div class="cq-prog" hidden><span id="cq-prog"></span></div></section>
        <section class="card cq-p"><h2>${esc(E.cq_p2)}</h2>
          <form class="cq-form" id="cq-form">
            <div class="filters"><label><span>${esc(E.cq_tab)}</span><select name="tab">${Object.keys(E.cq_desc_tab).map((k) => `<option value="${k}">${k} — ${esc(E.cq_desc_tab[k])}</option>`).join("")}</select></label>
              <label><span>${esc(E.cq_agrupar)}</span><select name="grupo"></select></label>
              <label><span>${esc(E.cq_medida)}</span><select name="medida"></select></label>
              <label><span>${esc(E.cq_ordenar)}</span><select name="ordem"></select></label>
              <label><span>&nbsp;</span><select name="dir"><option value="DESC">${esc(E.cq_desc)}</option><option value="ASC">${esc(E.cq_asc)}</option></select></label>
              <label><span>${esc(E.cq_limite)}</span><input type="number" name="lim" min="1" max="1000000" value="1000"></label></div>
            <details class="cq-cols"><summary>${esc(E.cq_cols)} (<span id="cq-ncols">${esc(E.cq_todas)}</span>)</summary><div id="cq-colbox"></div></details>
            <h3 class="small">${esc(E.cq_filtros)}</h3><div id="cq-filtros"></div><button class="btn btn-sm btn-ghost" type="button" id="cq-addf">${icone("plus")} ${esc(E.cq_add_f)}</button>
            <div class="btn-row cq-gerar"><button class="btn" type="submit">${icone("code")} ${esc(E.cq_montar)}</button></div>
          </form>
          <h3 class="small">${esc(E.cq_exemplos)}</h3><div class="cq-ex">${E.cq_ex.map(([r], i) => `<button class="chipq" type="button" data-ex="${i}">${esc(r)}</button>`).join("")}</div>
          <label class="cq-sql-l"><span>${esc(E.cq_sql)}</span><textarea id="cq-sql" rows="7" spellcheck="false">${esc(q.get("q") || E.cq_ex[0][1])}</textarea></label>
          <div class="btn-row"><button class="btn btn-primary" type="button" id="cq-rodar">${icone("play")} ${esc(E.cq_rodar)}</button><button class="btn btn-sm btn-ghost" type="button" id="cq-link">${icone("link")} ${esc(E.cq_link)}</button></div>
          <details class="cq-ref"><summary>${esc(E.cq_tabelas_t)}</summary><div id="cq-ref"></div></details></section>
        <section class="card cq-p" id="cq-res-c"><h2>${esc(E.cq_p3)}</h2><p class="small muted" id="cq-info"></p><div id="cq-res"></div>
          <div class="btn-row" id="cq-dl" hidden><button class="btn btn-sm" type="button" data-cq="csv">${icone("download")} ${esc(E.cq_csv)}</button><button class="btn btn-sm btn-ghost" type="button" data-cq="json">${icone("download")} ${esc(E.cq_json)}</button></div></section>${A.botCta()}`;
    },
    async iniciar() {
      const E = X(), f = $("#cq-form");
      let ultimo = null;
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
        const lim = Math.max(1, Math.min(1000000, parseInt(f.elements.lim.value, 10) || 1000));
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
      $(".cq-ex").addEventListener("click", (e) => { const b = e.target.closest("[data-ex]"); if (!b) return; $("#cq-sql").value = E.cq_ex[+b.dataset.ex][1]; if (cq.colunas.secoes) rodar(); });

      async function rodar() {
        if (!cq.carregados.size) { status(E.cq_antes); $("#cq-carregar").focus(); return; }
        const sql = $("#cq-sql").value.trim();
        $("#cq-res").innerHTML = carregando(); $("#cq-info").textContent = ""; $("#cq-dl").hidden = true;
        const t0 = performance.now();
        try {
          const m = await pedir({ tipo: "sql", sql });
          ultimo = m;
          const ms = Math.round(performance.now() - t0), MAX = 500;
          $("#cq-info").textContent = E.cq_linhas(nf(m.linhas.length), nf(ms)) + (m.linhas.length > MAX ? ` · ${E.cq_mostrando(nf(MAX))}` : "") + (m.cortado ? " …" : "");
          const ident = m.colunas.map((c) => /^(zona|secao|local|turno|cod_mun|codigo|numero|id|lat|lon)$/i.test(c));
          const fmt = (v, i) => (v == null ? "—" : typeof v === "number" ? (Number.isInteger(v) && !ident[i] ? nf(v) : String(v).replace(".", A.state.lang === "EN" ? "." : ",")) : esc(v));
          $("#cq-res").innerHTML = m.linhas.length ? tabela(m.colunas.map(esc), m.linhas.slice(0, MAX).map((l) => l.map(fmt)), "num-cols cq-tab") : `<p class="muted">${esc(E.cq_vazio)}</p>`;
          $("#cq-dl").hidden = !m.linhas.length;
          $("#cq-res-c").scrollIntoView({ block: "start", behavior: "smooth" });
        } catch (e) { $("#cq-res").innerHTML = `<p class="alert"><b>${esc(E.cq_erro)}:</b> ${esc(e.message)}</p>`; }
      }
      $("#cq-rodar").addEventListener("click", rodar);
      $("#cq-dl").addEventListener("click", (e) => {
        const b = e.target.closest("[data-cq]"); if (!b || !ultimo) return;
        const nome = `consulta-${new Date().toISOString().slice(0, 10)}`;
        if (b.dataset.cq === "csv") baixar(nome + ".csv", "﻿" + [ultimo.colunas].concat(ultimo.linhas).map((l) => l.map(csvCampo).join(",")).join("\r\n"), "text/csv;charset=utf-8");
        else baixar(nome + ".json", JSON.stringify(ultimo.linhas.map((l) => Object.fromEntries(l.map((v, i) => [ultimo.colunas[i], v])))), "application/json");
      });
      // o botão copia pelo [data-copy] do site; o link é refeito a cada mudança
      const linkConsulta = () => { $("#cq-link").dataset.copy = `${SITE}#/consulta?ufs=${encodeURIComponent((cq.carregados.size ? [...cq.carregados] : marcados()).join(","))}&q=${encodeURIComponent($("#cq-sql").value.trim())}`; };
      ["input", "change"].forEach((ev) => { $("#cq-sql").addEventListener(ev, linkConsulta); $("#cq-ufs").addEventListener(ev, linkConsulta); });
      $("#cq-link").addEventListener("pointerdown", linkConsulta); $("#cq-link").addEventListener("focus", linkConsulta);
      linkConsulta();
      if (cq.colunas.secoes) montarForm();
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
        tm = setTimeout(() => { $("#eb-previa").innerHTML = `<iframe src="./?embed=1&lang=${v.lang}&tema=${v.tema}${rota}" width="100%" height="${alt}" style="border:0" loading="lazy" title="${esc(E.eb_previa)}"></iframe>`; }, 350);
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
      $("#dv-motor").textContent = E.dv_motor(R().motor.versao);
      let C = { arquivos: [] };
      try { C = await dado("site/data/catalogo.json"); } catch (e) { /* sem catálogo */ }
      const por = {}; C.arquivos.forEach((a) => { por[a.p] = a; });
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
        $("#pv-ots").innerHTML = `<p class="small muted">${esc(E.pv_registrado(dataHora(P.data)))}${P.arquivos.some((x) => !x.bloco) ? ` · ${esc(E.pv_pendente_note)}` : ""}</p>
          <h3>${esc(E.pv_manif_t)}</h3><p class="small">${esc(E.pv_manif_txt)}</p>${tabela(cab, P.manifestos.map(linha), "pv-tab")}
          <h3>${esc(t().nav.downloads)}</h3>${tabela(cab, P.arquivos.map(linha), "pv-tab")}`;
      } catch (e) { $("#pv-ots").innerHTML = `<p class="muted">${esc(E.pv_pendente)}</p>`; }
      try {
        const C = await dado("site/data/arquivo.json");
        $("#pv-copias").innerHTML = C.copias && C.copias.length ? tabela([E.pv_th_end, E.pv_th_data, ""].map(esc), C.copias.map((c) => [`<code class="wrap">${esc(c.url.replace(SITE, "/"))}</code>`, esc(dataHora(c.quando)), `<a class="btn btn-sm" href="${esc(c.copia)}" target="_blank" rel="noopener">${icone("archive")} ${esc(E.pv_ver)}</a>`]), "pv-tab")
          : `<p class="muted">${esc(E.pv_sem_copias)}</p>`;
      } catch (e) { $("#pv-copias").innerHTML = `<p class="muted">${esc(E.pv_sem_copias)}</p>`; }
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

  Object.assign(A.paginas, { locais: pgLocais, perguntas: pgPerguntas, anatomia: pgAnatomia, consulta: pgConsulta, imprensa: pgImprensa, incorporar: pgIncorporar, widget: pgWidget, dados: pgDados, provas: pgProvas });
  A.extras = { locais, sinalizacoes, md };
})();
