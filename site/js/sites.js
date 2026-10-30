/* Sites do Atlas: oito tipos de site estático, feitos neste aparelho e baixados prontos (.html, um arquivo só, ou .zip).
   Com as respostas da conversa: relatório, várias páginas, apresentação e perguntas e respostas.
   Com os dados (interativos, com troca de idioma PT/EN/ES): comparativo, ranking, painel e mapa clicável.
   Todos têm compartilhar, imprimir/PDF, baixar os dados (CSV), tema claro/escuro, três estilos e funcionam sem internet.
   Depois de baixar, o Atlas ajuda a pôr o site no ar no GitHub Pages: passo a passo com as telas já preenchidas (A)
   ou automático, com uma chave do GitHub que não fica guardada (B). Este arquivo só carrega quando a pessoa abre "Criar site". */
(function () {
  "use strict";

  const A = window.APP;
  const { esc, icone, $$ } = A;
  const t = () => A.t(), X = () => A.t().at;
  const URL_SITE = "https://paranacontraoscorruptos.org/";
  const LANGS = ["PT", "EN", "ES"], HTML_LANG = { PT: "pt-BR", EN: "en", ES: "es" };
  const nz = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
  const preencher = (s, p) => Object.keys(p || {}).reduce((a, k) => a.split(`{${k}}`).join(p[k]), String(s == null ? "" : s));
  const num = (i) => String(i + 1).padStart(2, "0");

  const TIPOS = [["relatorio", "file", "r"], ["paginas", "book", "r"], ["apresentacao", "play", "r"], ["perguntas", "chat", "r"],
    ["comparativo", "swap", "d"], ["ranking", "list", "d"], ["painel", "grid", "d"], ["mapa", "map", "d"]];
  const grupo = (k) => (TIPOS.find((x) => x[0] === k) || [])[2];
  const ESTILOS = [["padrao", ["#1fc35f", "#ffd400", "#050c08"]], ["jornal", ["#e0b45a", "#f6f1e6", "#16130e"]], ["contraste", ["#b8a6ff", "#ffffff", "#000000"]]];
  const ICO_TELA = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

  // --- visual do site gerado (vai depois do CSS do site principal) ------------------------------------------------------------
  const CSS_GS = `body.gs{margin:0}
.gs-wrap{max-width:1040px;margin:0 auto;padding:0 16px}
.gs-top{position:sticky;top:0;z-index:20;background:var(--glass);-webkit-backdrop-filter:saturate(1.4) blur(12px);backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid var(--line)}
.gs-faixa{height:4px;background:var(--brasil)}
.gs-barra{display:flex;align-items:center;gap:10px;min-height:58px}
.gs-marca{display:flex;align-items:center;gap:10px;flex:1;min-width:0;color:var(--ink);text-decoration:none}
.gs-marca>span:last-child{min-width:0}
.gs-marca b{display:block;font:700 1rem var(--display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gs-marca small{display:block;font-size:.74rem;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gs-ferr{display:flex;align-items:center;gap:6px;flex:none}
.gs-bt{flex:none;height:40px;min-width:40px;padding:0 10px;border-radius:12px;border:1px solid var(--line-2);background:var(--surface);color:var(--ink);display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;font:600 .84rem var(--font)}
.gs-bt:hover,.gs-bt:focus-visible{border-color:var(--accent)}
.gs-bt svg{width:18px;height:18px;flex:none}
.gs-bt>span:not([class]){display:none}
@media (min-width:980px){.gs-ferr .gs-bt>span:not([class]){display:inline}}
.gs-tema .i-sol{display:inline-flex}.gs-tema .i-lua{display:none}
[data-theme="light"] .gs-tema .i-sol{display:none}[data-theme="light"] .gs-tema .i-lua{display:inline-flex}
.gs-lang select{height:40px;border-radius:12px;border:1px solid var(--line-2);background:var(--surface);color:var(--ink);padding:0 6px;font:600 .84rem var(--font);cursor:pointer}
.gs-nav{border-top:1px solid var(--line)}
.gs-nav .gs-wrap{display:flex;gap:6px;overflow-x:auto;padding-top:8px;padding-bottom:8px;scrollbar-width:thin}
.gs-nav a{flex:none;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:5px 12px;border-radius:999px;border:1px solid var(--line-2);color:var(--ink-2);text-decoration:none;font-size:.84rem}
.gs-nav a:hover{border-color:var(--accent);color:var(--ink)}
.gs-nav a[aria-current]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
main.gs-main{max-width:none;margin:0;padding:0}
.gs-hero{padding:46px 0 30px;border-bottom:1px solid var(--line);background:radial-gradient(900px 320px at 12% 0,var(--accent-soft),transparent 70%),radial-gradient(700px 260px at 95% 10%,var(--yellow-soft),transparent 70%)}
.gs-kicker{margin:0 0 10px;font:700 .74rem var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--yellow-text)}
.gs-hero h1{font-size:clamp(1.9rem,5vw,3rem);margin:0 0 12px;overflow-wrap:anywhere}
.gs-lead{margin:0 0 10px;max-width:62ch;font-size:1.06rem;color:var(--ink-2)}
.gs-meta{margin:0 0 4px;font-size:.86rem;color:var(--muted)}
.gs-resumo-t{margin:26px 0 10px;font:700 .78rem var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.gs-resumo{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
.gs-card{display:flex;flex-direction:column;gap:3px;padding:14px 16px;border:1px solid var(--line-2);border-radius:var(--radius);background:var(--surface);color:var(--ink);text-decoration:none;transition:border-color .2s,transform .2s}
.gs-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.gs-card .gs-n{font:700 .72rem var(--mono);color:var(--accent)}
.gs-card b{font:700 1rem var(--display);overflow-wrap:anywhere}
.gs-card span{font-size:.8rem;color:var(--muted)}
.gs-card strong{margin-top:6px;font:700 1.3rem var(--display);font-variant-numeric:tabular-nums}
.gs-card small{font-size:.76rem;color:var(--ink-2)}
.gs-sec{padding:38px 0 14px;border-bottom:1px solid var(--line)}
.gs-cab{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px}
.gs-cab .gs-n{flex:none;margin-top:5px;padding:4px 8px;border-radius:8px;background:var(--accent);color:var(--accent-ink);font:700 .8rem var(--mono)}
.gs-cab h2{margin:0 0 4px;overflow-wrap:anywhere}
.gs-cab p{margin:0;font-size:.9rem;color:var(--muted)}
.gs-sec .doc-corpo{max-width:880px}
.gs-subir{margin:18px 0 0;font-size:.84rem}
.gs-rod{padding:30px 0 44px;font-size:.86rem;color:var(--ink-2)}
.gs-selo{display:flex;gap:12px;align-items:center;margin-bottom:14px;padding:14px 16px;border:1px solid var(--accent);border-radius:var(--radius);background:var(--accent-soft)}
.gs-selo b{display:block;font:700 1rem var(--display);color:var(--ink)}
.gs-selo span span{display:block;font-size:.8rem}
.gs-rod p{margin:0 0 6px}
.gs-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:90;max-width:calc(100vw - 32px);background:var(--ink);color:var(--bg);padding:9px 16px;border-radius:999px;font:600 .88rem var(--font);box-shadow:var(--shadow)}
.gs-dlg{width:min(420px,calc(100vw - 32px));padding:18px;border:1px solid var(--line-2);border-radius:var(--radius);background:var(--surface);color:var(--ink)}
.gs-dlg::backdrop{background:rgba(0,0,0,.55)}
.gs-dlg h2{margin:0 0 12px;font-size:1.15rem}
.gs-dlg-n{margin:0 0 12px;font-size:.86rem;color:var(--ink-2)}
.gs-lst{display:grid;gap:8px}
.gs-op{display:flex;align-items:center;gap:10px;width:100%;padding:11px 12px;border:1px solid var(--line-2);border-radius:12px;background:var(--surface-2);color:var(--ink);font:600 .92rem var(--font);text-align:left;text-decoration:none;cursor:pointer}
.gs-op:hover,.gs-op:focus-visible{border-color:var(--accent)}
.gs-op svg{width:18px;height:18px;color:var(--accent);flex:none}
.gs-busca{display:flex;align-items:center;gap:8px;max-width:520px;margin:18px 0 6px;padding:0 12px;border:1px solid var(--line-2);border-radius:12px;background:var(--surface)}
.gs-busca svg{width:18px;height:18px;color:var(--muted);flex:none}
.gs-busca input{flex:1;min-width:0;min-height:46px;border:0;background:transparent;color:var(--ink);font:inherit;font-size:1rem;outline:none}
.gs-busca:focus-within{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-soft)}
.gs-cont{margin:0;min-height:1.2em;font-size:.84rem;color:var(--muted)}
.gs-nada{color:var(--ink-2)}
.gs-card[hidden],.gs-q[hidden],.gs-pg[hidden],.gs-slide[hidden],.gs-nada[hidden]{display:none}
.gs-pg .gs-sec{border-bottom:0}
.gs-pager{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;margin:26px 0 8px;padding-top:16px;border-top:1px solid var(--line)}
.gs-pager a{display:inline-flex;flex-direction:column;gap:2px;max-width:46%;padding:10px 14px;border:1px solid var(--line-2);border-radius:12px;color:var(--ink);text-decoration:none;font-size:.9rem;overflow-wrap:anywhere}
.gs-pager a:hover{border-color:var(--accent)}
.gs-pager small{color:var(--muted);font-size:.74rem}
.gs-pager .gs-px{margin-left:auto;text-align:right}
.gs-ferr2{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 0}
.gs-faq{display:grid;gap:10px;padding:22px 0 30px}
.gs-q{border:1px solid var(--line-2);border-radius:var(--radius);background:var(--surface);overflow:hidden}
.gs-q[open]{border-color:var(--accent)}
.gs-q summary{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;cursor:pointer;list-style:none}
.gs-q summary::-webkit-details-marker{display:none}
.gs-q summary::after{content:"+";margin-left:auto;padding-left:8px;font:700 1.3rem/1 var(--display);color:var(--accent);transition:transform .2s}
.gs-q[open] summary::after{transform:rotate(45deg)}
.gs-q summary .gs-n{flex:none;margin-top:2px;padding:3px 7px;border-radius:7px;background:var(--accent-soft);color:var(--accent);font:700 .76rem var(--mono)}
.gs-q summary b{display:block;font:700 1.02rem var(--display);overflow-wrap:anywhere}
.gs-q summary small{display:block;margin-top:2px;color:var(--muted);font-size:.82rem}
.gs-q .doc-corpo{padding:14px 16px 16px;border-top:1px solid var(--line)}
.gs-apresentacao .gs-top{position:relative}
.gs-deck{position:relative;display:grid;min-height:calc(100vh - 63px);min-height:calc(100dvh - 63px);outline:none}
.gs-slide{display:grid;align-content:center;padding:26px 16px 96px;animation:gsin .35s ease-out}
.gs-slide-in{width:100%;max-width:980px;margin:0 auto;max-height:calc(100vh - 200px);max-height:calc(100dvh - 200px);overflow:auto}
.gs-s-capa h1{font-size:clamp(2rem,6vw,3.6rem);margin:0 0 14px;overflow-wrap:anywhere}
.gs-ctrl{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:30;display:flex;align-items:center;gap:8px;padding:6px;border:1px solid var(--line-2);border-radius:999px;background:var(--glass);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.gs-ctrl .gs-bt{border-radius:999px}
.gs-ctrl .gs-cont{min-width:70px;text-align:center;font:700 .86rem var(--mono);color:var(--ink-2)}
.gs-prog{position:fixed;left:0;right:0;bottom:0;z-index:30;height:4px;background:var(--line)}
.gs-prog i{display:block;width:0;height:100%;background:var(--accent);transition:width .3s}
.gs-prx svg{transform:rotate(180deg)}
@keyframes gsin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.gs-slide{animation:none}}
.gd{padding:24px 0 40px}
.gd-ctl{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:0 0 18px}
.gd-seg{display:inline-flex;border:1px solid var(--line-2);border-radius:12px;overflow:hidden;background:var(--surface)}
.gd-seg button{min-height:40px;padding:0 14px;border:0;background:transparent;color:var(--ink-2);font:600 .88rem var(--font);cursor:pointer}
.gd-seg button[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink)}
.gd-f{display:grid;gap:3px;font-size:.78rem;color:var(--ink-2)}
.gd-f select,.gd-busca input{min-height:40px;max-width:100%;padding:0 10px;border:1px solid var(--line-2);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit;font-size:.92rem}
.gd-busca{flex:1 1 220px;display:grid}
.gd-busca input{width:100%}
.gd-lugar{flex:1 1 240px}.gd-lugar select{width:100%}
.gd-nav{display:flex;gap:6px}
.gd-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:8px}
.gd-card h3{margin:0}
.gd-card .kv{margin-top:10px}
.gd-grafs{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:14px;margin:0 0 8px}
.gd .card h3{margin:0 0 6px;font-size:1rem}
.gd h2{margin:28px 0 12px;font-size:1.25rem}
.gd .gd-nome{margin:4px 0 2px;font-size:1.6rem}
.gd-mini{gap:12px 22px}
.gd-mini h4{margin:0;font-size:.84rem;color:var(--ink-2)}
.bar-row.gd-ref .bar{background:var(--muted)}
.gd-res>.tiles{margin:14px 0 18px}
.gd-res>.card{margin-bottom:16px}
.gd-pos{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.gd-pos li{display:flex;justify-content:space-between;gap:12px;padding:7px 10px;border-radius:10px;background:var(--surface-2);font-size:.9rem}
.gd-pos b{font-variant-numeric:tabular-nums;white-space:nowrap}
.gd-rank th button{all:unset;cursor:pointer;display:inline-flex;gap:4px;white-space:nowrap}
.gd-rank th button:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
.gd-rank th[aria-sort="ascending"],.gd-rank th[aria-sort="descending"]{color:var(--accent)}
.gd-rank td,.gd-rank th{white-space:nowrap}
.gd-rank tbody th{position:sticky;left:0;z-index:1;max-width:240px;overflow:hidden;text-overflow:ellipsis;background:var(--surface);color:var(--ink);font:600 .9rem var(--font);letter-spacing:0;text-transform:none}
.gd-rank td{position:relative}
.gd-mb{position:absolute;left:8px;right:8px;bottom:4px;height:3px;transform:scaleX(var(--f));transform-origin:left;background:var(--series-1);border-radius:2px}
.gd-mais{margin:12px 0 0}
.gd-nota{margin-top:20px}
.gd tbody th{background:transparent;color:var(--ink);font:600 .9rem var(--font);letter-spacing:0;text-transform:none}
.gd-mapa{margin-top:0}
.gd-mapa .map-side .card{margin-top:12px}
.gd-tabela{margin-top:18px}
.gd-tabela summary{cursor:pointer;font-weight:600;color:var(--accent)}
.gd-tabela .table-wrap{margin-top:10px;max-height:420px;overflow:auto}
.gd .mp-uf{cursor:pointer}
.gd .mp-uf:focus-visible path{stroke:var(--yellow);stroke-width:2.5}
html[data-estilo="jornal"]{--display:Georgia,"Times New Roman",serif;--bg:#16130e;--surface:#1e1a14;--surface-2:#26211a;--surface-3:#2e281f;--glass:rgba(22,19,14,.84);--ink:#f1ebdd;--ink-2:#cfc5b1;--muted:#a59a85;--line:#352e24;--line-2:#4a4133;--grid:transparent;--accent:#e0b45a;--accent-hover:#ebc579;--accent-ink:#1a1407;--accent-soft:rgba(224,180,90,.14);--yellow:#e0b45a;--yellow-text:#e0b45a;--yellow-soft:rgba(224,180,90,.08);--series-1:#d9a441;--track:#2a241b;--brasil:linear-gradient(90deg,#e0b45a,#e0b45a);--gy:linear-gradient(120deg,#e0b45a,#f1ebdd);--glow:0 0 0 1px rgba(224,180,90,.35);--radius:6px}
html[data-estilo="jornal"][data-theme="light"]{--bg:#f6f1e6;--surface:#fffdf8;--surface-2:#f1eadb;--surface-3:#e8dfcc;--glass:rgba(246,241,230,.92);--ink:#1d1912;--ink-2:#463e30;--muted:#6f6552;--line:#ddd3bf;--line-2:#c8bb9f;--accent:#8a5a00;--accent-hover:#704900;--accent-ink:#fff;--accent-soft:#f3e6c9;--yellow:#8a5a00;--yellow-text:#8a5a00;--yellow-soft:#f6ecd4;--series-1:#a8730f;--track:#ece4d2;--brasil:linear-gradient(90deg,#1d1912,#1d1912);--gy:linear-gradient(120deg,#8a5a00,#1d1912)}
html[data-estilo="jornal"] h1,html[data-estilo="jornal"] h2,html[data-estilo="jornal"] h3{letter-spacing:0}
html[data-estilo="contraste"]{--bg:#000;--surface:#0a0a0a;--surface-2:#141414;--surface-3:#1f1f1f;--glass:rgba(0,0,0,.9);--ink:#fff;--ink-2:#e6e6e6;--muted:#bdbdbd;--line:#3a3a3a;--line-2:#6b6b6b;--grid:transparent;--accent:#b8a6ff;--accent-hover:#cfc2ff;--accent-ink:#0b0620;--accent-soft:rgba(184,166,255,.16);--yellow:#b8a6ff;--yellow-text:#b8a6ff;--yellow-soft:rgba(184,166,255,.08);--series-1:#b8a6ff;--track:#1f1f1f;--brasil:linear-gradient(90deg,#fff,#fff);--gy:linear-gradient(120deg,#b8a6ff,#fff);--glow:0 0 0 2px #b8a6ff}
html[data-estilo="contraste"][data-theme="light"]{--bg:#fff;--surface:#fff;--surface-2:#f2f2f2;--surface-3:#e6e6e6;--glass:rgba(255,255,255,.95);--ink:#000;--ink-2:#1a1a1a;--muted:#444;--line:#bdbdbd;--line-2:#7a7a7a;--accent:#4b2fd1;--accent-hover:#3a22b0;--accent-ink:#fff;--accent-soft:#ebe6ff;--yellow:#4b2fd1;--yellow-text:#4b2fd1;--yellow-soft:#f1eeff;--series-1:#4b2fd1;--track:#ececec;--brasil:linear-gradient(90deg,#000,#000);--gy:linear-gradient(120deg,#4b2fd1,#000);--glow:0 0 0 2px #4b2fd1}
html[data-estilo="contraste"] .card,html[data-estilo="contraste"] .tile,html[data-estilo="contraste"] .kv div,html[data-estilo="contraste"] .gs-card,html[data-estilo="contraste"] .gs-q{border-width:2px}
@media (max-width:600px){.gs-hero{padding:30px 0 22px}.gs-cab{gap:10px}.gs-sec{padding-top:30px}.gs-pager a{max-width:100%}}
@media (max-width:420px){.gs-barra{gap:6px}.gs-ferr{gap:4px}.gs-bt{min-width:36px;height:38px;padding:0 8px}.gs-lang select{height:38px}.gs-marca .at-marca{display:none}}
@media print{.gs-top{position:static}.gs-nav,.gs-ferr,.gs-subir,.gs-ctrl,.gs-prog,.gd-ctl,.gs-busca,.gs-ferr2,.gs-pager,.gd-nav,.gs-cont{display:none!important}.gs-pg[hidden],.gs-slide[hidden],.gs-q[hidden]{display:block!important}.gs-slide{break-after:page;min-height:0;padding:12px 0;animation:none}.gs-slide-in{max-height:none;overflow:visible}.gs-deck{display:block;min-height:0}.gd-tabela .table-wrap{max-height:none}.gd-rank tbody th{position:static}}`;
  const TEMA_SITE = `(function(){var h=document.documentElement,t=null;try{t=localStorage.getItem("gs-tema")}catch(e){}if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";if(t==="light")h.setAttribute("data-theme","light");})();`;

  // ===== código que roda dentro do site gerado: vai como texto, então não usa nada de fora da própria função =====
  function rtBase() {
    var d = document, h = d.documentElement, CFG = JSON.parse(d.getElementById("gs-cfg").textContent);
    var LOC = { PT: "pt-BR", EN: "en", ES: "es" }, HL = { PT: "pt-BR", EN: "en", ES: "es" };
    var GS = window.GS = { cfg: CFG, lang: CFG.lang, ouvir: [] };
    var cada = function (sel, f, r) { Array.prototype.forEach.call((r || d).querySelectorAll(sel), f); };
    var CH_LANG = "gs-lang:" + CFG.arq;
    try { var lg = localStorage.getItem(CH_LANG); if (lg && CFG.langs.indexOf(lg) >= 0) GS.lang = lg; } catch (e) { /* sem armazenamento */ }
    GS.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
    GS.t = function (k, p) {
      var s = (CFG.t[GS.lang] || {})[k];
      if (s == null) s = (CFG.t[CFG.lang] || {})[k];
      if (s == null) return k;
      if (p) Object.keys(p).forEach(function (x) { s = s.split("{" + x + "}").join(p[x]); });
      return s;
    };
    GS.loc = function () { return LOC[GS.lang] || "pt-BR"; };
    GS.nf = function (n, c) { return new Intl.NumberFormat(GS.loc(), { minimumFractionDigits: c || 0, maximumFractionDigits: c || 0 }).format(n); };
    GS.pct = function (x, c) { if (x == null || isNaN(x)) return "–"; c = c == null ? 1 : c; return new Intl.NumberFormat(GS.loc(), { style: "percent", minimumFractionDigits: c, maximumFractionDigits: c }).format(x); };
    GS.norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); };
    GS.quando = function () { return new Intl.DateTimeFormat(GS.loc(), { dateStyle: "long", timeStyle: "short" }).format(new Date(CFG.quando)); };
    GS.aviso = function (msg) { var a = d.createElement("div"); a.className = "gs-toast"; a.setAttribute("role", "status"); a.textContent = msg; d.body.appendChild(a); setTimeout(function () { a.remove(); }, 2800); };
    GS.baixar = function (nome, txt, tipo) {
      var u = URL.createObjectURL(new Blob([txt], { type: tipo })), a = d.createElement("a");
      a.href = u; a.download = nome; d.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 5000);
    };
    GS.csv = function (linhas) {
      var q = function (v) { v = String(v == null ? "" : v); return /[";\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      return "﻿" + linhas.map(function (l) { return l.map(q).join(";"); }).join("\r\n");
    };
    // gráficos de barras crescendo de novo depois de redesenhar a tela
    GS.animar = function (raiz) {
      var bs = raiz.querySelectorAll(".bars");
      if (!h.classList.contains("anim")) { cada(".bars", function (b) { b.classList.add("in"); }, raiz); return; }
      Array.prototype.forEach.call(bs, function (b) { b.classList.remove("in"); });
      requestAnimationFrame(function () { requestAnimationFrame(function () { Array.prototype.forEach.call(bs, function (b) { b.classList.add("in"); }); }); });
    };
    function traduzir() {
      h.lang = HL[GS.lang] || "pt-BR"; h.setAttribute("data-locale", GS.loc());
      cada("[data-t]", function (el) { el.textContent = GS.t(el.getAttribute("data-t"), { d: GS.quando() }); });
      cada("[data-tl]", function (el) { var s = GS.t(el.getAttribute("data-tl")); el.setAttribute("aria-label", s); if (el.hasAttribute("title")) el.title = s; });
      cada("[data-tp]", function (el) { el.placeholder = GS.t(el.getAttribute("data-tp")); });
    }
    GS.mudar = function (l) { GS.lang = l; try { localStorage.setItem(CH_LANG, l); } catch (e) { /* sem armazenamento */ } traduzir(); GS.ouvir.forEach(function (f) { f(); }); };
    traduzir();
    var sel = d.querySelector(".gs-lang select");
    if (sel) { sel.value = GS.lang; sel.addEventListener("change", function () { GS.mudar(sel.value); }); }
    // tema claro e escuro
    var bt = d.querySelector(".gs-tema");
    if (bt) bt.addEventListener("click", function () { var l = h.getAttribute("data-theme") !== "light"; if (l) h.setAttribute("data-theme", "light"); else h.removeAttribute("data-theme"); try { localStorage.setItem("gs-tema", l ? "light" : "dark"); } catch (e) { /* sem armazenamento */ } });
    // compartilhar, imprimir e baixar os dados
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-gs]"); if (!b) return;
      var k = b.getAttribute("data-gs");
      if (k === "share") compartilhar();
      else if (k === "print") window.print();
      else if (k === "csv") GS.baixar(CFG.arq + ".csv", GS.csv(window.GS_CSV ? window.GS_CSV() : csvDaPagina()), "text/csv;charset=utf-8");
    });
    function csvDaPagina() {
      var L = [[GS.t("csv_parte"), GS.t("csv_item"), GS.t("csv_valor")]];
      // números que ainda estão contando (ou em página escondida) saem com o valor final
      var tx = function (el) {
        if (!el) return "";
        var c = el.cloneNode(true);
        cada("[data-count]", function (x) { x.textContent = GS.nf(+x.getAttribute("data-count")); }, c);
        return c.textContent.replace(/\s+/g, " ").trim();
      };
      cada("[data-parte]", function (p) {
        var tit = p.getAttribute("data-parte"), n0 = L.length;
        cada(".kv > div", function (x) { L.push([tit, tx(x.querySelector("dt")), tx(x.querySelector("dd"))]); }, p);
        cada(".bar-row", function (x) { L.push([tit, tx(x.querySelector(".bar-label")), tx(x.querySelector(".bar-value"))]); }, p);
        cada("table tr", function (tr) { L.push([tit].concat(Array.prototype.map.call(tr.children, tx))); }, p);
        if (L.length === n0) cada(".doc-corpo p, .doc-corpo li", function (x) { var s = tx(x); if (s) L.push([tit, "", s]); }, p);
      });
      return L;
    }
    function compartilhar() {
      var local = location.protocol === "file:", url = location.href, tit = d.title, I = CFG.ico;
      var dl = d.createElement("dialog");
      var op = function (href, ic, txt) { return '<a class="gs-op" target="_blank" rel="noopener" href="' + GS.esc(href) + '">' + I[ic] + "<span>" + GS.esc(txt) + "</span></a>"; };
      var bo = function (k, ic, txt) { return '<button type="button" class="gs-op" data-op="' + k + '">' + I[ic] + "<span>" + GS.esc(txt) + "</span></button>"; };
      dl.className = "gs-dlg";
      dl.innerHTML = "<h2>" + GS.esc(GS.t("comp")) + "</h2>" + (local ? '<p class="gs-dlg-n">' + GS.esc(GS.t("local")) + "</p>" : "") + '<div class="gs-lst">'
        + op("https://wa.me/?text=" + encodeURIComponent(local ? tit : tit + "\n" + url), "chat", "WhatsApp")
        + op("https://t.me/share/url?url=" + encodeURIComponent(local ? "" : url) + "&text=" + encodeURIComponent(tit), "send", "Telegram")
        + op("https://twitter.com/intent/tweet?text=" + encodeURIComponent(tit) + (local ? "" : "&url=" + encodeURIComponent(url)), "share", "X (Twitter)")
        + (local ? "" : bo("copiar", "link", GS.t("copiar")))
        + (navigator.share && !local ? bo("nativo", "share", GS.t("mais")) : "")
        + bo("fechar", "close", GS.t("fechar")) + "</div>";
      d.body.appendChild(dl);
      dl.addEventListener("close", function () { dl.remove(); });
      dl.addEventListener("click", function (e) {
        if (e.target === dl) { dl.close(); return; }
        var b = e.target.closest("[data-op]"); if (!b) return;
        var k = b.getAttribute("data-op");
        if (k === "copiar") (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { GS.aviso(GS.t("copiado")); }, function () { window.prompt(GS.t("copiar"), url); });
        else if (k === "nativo") navigator.share({ title: tit, url: url }).catch(function () { /* cancelado */ });
        dl.close();
      });
      if (dl.showModal) dl.showModal(); else dl.setAttribute("open", "");
    }
    // relatório: o menu acompanha a parte que está na tela
    if (CFG.tipo !== "relatorio" || !("IntersectionObserver" in window)) return;
    var ls = [].slice.call(d.querySelectorAll(".gs-nav a")); if (!ls.length) return;
    var nav = ls[0].parentNode, por = {};
    ls.forEach(function (a) { por[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var a = por[en.target.id];
        ls.forEach(function (x) { x.removeAttribute("aria-current"); });
        if (a) { a.setAttribute("aria-current", "true"); nav.scrollLeft = a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2; }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    cada(".gs-sec", function (s) { io.observe(s); });
  }

  // várias páginas: capa com busca e uma página por resposta, trocadas pelo endereço (#/p/2)
  function rtPaginas() {
    var d = document, GS = window.GS, pgs = [].slice.call(d.querySelectorAll(".gs-pg")), nav = [].slice.call(d.querySelectorAll(".gs-nav a"));
    function mostrar() {
      var m = location.hash.match(/^#\/p\/(\d+)/), n = m ? +m[1] : 0;
      if (!pgs[n]) n = 0;
      pgs.forEach(function (p, i) { p.hidden = i !== n; });
      var alvo = n ? "#/p/" + n : "#/", at = null;
      nav.forEach(function (a) { if (a.getAttribute("href") === alvo) { a.setAttribute("aria-current", "page"); at = a; } else a.removeAttribute("aria-current"); });
      if (at) at.parentNode.scrollLeft = at.offsetLeft - at.parentNode.clientWidth / 2 + at.offsetWidth / 2;
      d.title = (n ? pgs[n].getAttribute("data-parte") + " · " : "") + GS.cfg.titulo;
      window.scrollTo(0, 0);
      var h2 = n && pgs[n].querySelector("h2");
      if (h2) { h2.setAttribute("tabindex", "-1"); h2.focus({ preventScroll: true }); }
    }
    addEventListener("hashchange", mostrar);
    mostrar();
    var q = d.querySelector(".gs-busca input"); if (!q) return;
    var cards = [].slice.call(d.querySelectorAll(".gs-capa .gs-card")), nada = d.querySelector(".gs-capa .gs-nada"), cont = d.querySelector(".gs-capa .gs-cont");
    q.addEventListener("input", function () {
      var s = GS.norm(q.value), k = 0;
      cards.forEach(function (c) { var ok = !s || c.getAttribute("data-busca").indexOf(s) >= 0; c.hidden = !ok; if (ok) k++; });
      nada.hidden = k > 0; cont.textContent = s ? GS.t("res", { n: k, t: cards.length }) : "";
    });
  }

  // apresentação: uma tela por vez; setas, toque, teclado e tela cheia
  function rtSlides() {
    var d = document, GS = window.GS, S = [].slice.call(d.querySelectorAll(".gs-slide")), i = 0;
    var cont = d.querySelector(".gs-ctrl .gs-cont"), prog = d.querySelector(".gs-prog i"), deck = d.querySelector(".gs-deck");
    function ir(n) {
      i = Math.max(0, Math.min(S.length - 1, n));
      S.forEach(function (s, k) { s.hidden = k !== i; });
      cont.textContent = GS.t("slide", { n: i + 1, t: S.length });
      prog.style.width = ((i + 1) / S.length) * 100 + "%";
      if (location.hash !== "#/" + (i + 1)) history.replaceState(null, "", "#/" + (i + 1));
      var dentro = S[i].querySelector(".gs-slide-in"); if (dentro) dentro.scrollTop = 0;
    }
    function cheia() { if (d.fullscreenElement) d.exitFullscreen(); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(function () { /* sem tela cheia */ }); }
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-gs]"); if (!b) return;
      var k = b.getAttribute("data-gs");
      if (k === "ant") ir(i - 1); else if (k === "prox") ir(i + 1); else if (k === "cheia") cheia();
    });
    d.addEventListener("keydown", function (e) {
      if (e.target.closest("input, select, textarea, dialog") || e.altKey || e.ctrlKey || e.metaKey) return;
      var k = e.key;
      if (k === " " && e.target.closest("button, a")) return;
      if (k === "ArrowRight" || k === "PageDown" || k === " ") { e.preventDefault(); ir(i + 1); }
      else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); ir(i - 1); }
      else if (k === "Home") ir(0); else if (k === "End") ir(S.length - 1);
    });
    var x0 = null, y0 = 0;
    deck.addEventListener("touchstart", function (e) { if (e.target.closest(".table-wrap, .map, table")) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    deck.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) ir(i + (dx < 0 ? 1 : -1));
    }, { passive: true });
    addEventListener("hashchange", function () { var m = location.hash.match(/^#\/(\d+)/); if (m && +m[1] - 1 !== i) ir(+m[1] - 1); });
    var m = location.hash.match(/^#\/(\d+)/);
    ir(m ? +m[1] - 1 : 0);
  }

  // perguntas e respostas: busca, abrir e fechar todas; o endereço #q-3 abre a terceira
  function rtFaq() {
    var d = document, GS = window.GS, qs = [].slice.call(d.querySelectorAll(".gs-q"));
    var q = d.querySelector(".gs-busca input"), nada = d.querySelector(".gs-nada"), cont = d.querySelector(".gs-cont");
    var txt = qs.map(function (x) { return GS.norm(x.textContent); });
    q.addEventListener("input", function () {
      var s = GS.norm(q.value), k = 0, ultimo = null;
      qs.forEach(function (x, i) { var ok = !s || txt[i].indexOf(s) >= 0; x.hidden = !ok; if (ok) { k++; ultimo = x; } });
      if (k === 1 && s) ultimo.open = true;
      nada.hidden = k > 0; cont.textContent = s ? GS.t("res", { n: k, t: qs.length }) : "";
    });
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-gs='abrir'], [data-gs='fechar']"); if (!b) return;
      var ab = b.getAttribute("data-gs") === "abrir";
      qs.forEach(function (x) { if (!x.hidden) x.open = ab; });
    });
    function alvo() { var x = location.hash && d.getElementById(location.hash.slice(1)); if (x && x.classList.contains("gs-q")) { x.open = true; x.scrollIntoView(); } }
    addEventListener("hashchange", alvo);
    alvo();
    // na impressão saem todas abertas
    var antes = null;
    addEventListener("beforeprint", function () { antes = qs.map(function (x) { return x.open; }); qs.forEach(function (x) { x.open = true; }); });
    addEventListener("afterprint", function () { if (antes) qs.forEach(function (x, i) { x.open = antes[i]; }); antes = null; });
  }

  // comparativo, ranking, painel e mapa: os números de cada lugar vêm dentro do arquivo (#gs-dados)
  function rtDados() {
    var d = document, GS = window.GS, E = GS.esc, D = JSON.parse(d.getElementById("gs-dados").textContent), raiz = d.getElementById("gd");
    var st = { n: 2, ord: "aptos", dir: -1, busca: "", uf: "", lim: 50, sel: null, med: "compP" };
    var POR = {}; D.un.forEach(function (u) { POR[u.k] = u; });
    var I = GS.cfg.ico;
    function nome(u) { if (u.tp === "uf") { var x = D.ufn[u.u]; return x ? x[GS.lang] || x.PT : u.u; } return u.tp === "br" ? GS.t("brasil") : u.n; }
    function rot(u) { return u.tp === "mun" && D.comUf ? nome(u) + " (" + u.u + ")" : nome(u); }
    function sub(u) { if (u.tp === "mun") { var x = D.ufn[u.u]; return x ? x[GS.lang] || x.PT : u.u; } return GS.t(u.tp === "uf" ? "estado" : "pais"); }
    function cands(n) { return D.cands[n] || []; }
    function iC(n, nr) { var l = cands(n); for (var i = 0; i < l.length; i++) if (l[i][0] === nr) return i; return -1; }
    function vt(u, n, nr) { var x = u.t[n], i = iC(n, nr); return x && i >= 0 ? x[2 + i] || 0 : 0; }
    function validos(u, n) { var x = u.t[n], s = 0; if (!x) return 0; cands(n).forEach(function (c, i) { if (c[0] !== "95" && c[0] !== "96") s += x[2 + i] || 0; }); return s; }
    function candNome(c) { return c[0] === "95" ? GS.t("branco") : c[0] === "96" ? GS.t("nulo") : c[1] + " (" + c[0] + ")"; }
    function principais(n, k) { return cands(n).filter(function (c) { return c[0] !== "95" && c[0] !== "96"; }).slice(0, k); }
    // medidas: valor (número para ordenar e pintar) e texto
    function med(k) {
      var n = st.n, P = function (v) { return GS.pct(v, 2); }, M;
      if (k.indexOf("c:") === 0) {
        var nr = k.slice(2), c = cands(n)[iC(n, nr)] || [nr, nr];
        return { k: k, p: true, nome: GS.t("m_cand", { c: candNome(c) }), curto: c[1] ? c[1].split(" ").slice(-1)[0] + " (" + nr + ")" : nr,
          val: function (u) { var v = validos(u, n); return u.t[n] && v ? vt(u, n, nr) / v : null; }, txt: P, dica: function (u) { return GS.nf(vt(u, n, nr)) + " " + GS.t("votos"); } };
      }
      var x = function (u) { return u.t[n]; };
      M = {
        aptos: { val: function (u) { return x(u) ? x(u)[0] : null; }, txt: GS.nf },
        comp: { val: function (u) { return x(u) ? x(u)[1] : null; }, txt: GS.nf },
        compP: { p: true, val: function (u) { return x(u) && x(u)[0] ? x(u)[1] / x(u)[0] : null; }, txt: P, dica: function (u) { return GS.t("d_comp", { v: GS.nf(x(u)[1]), a: GS.nf(x(u)[0]) }); } },
        abst: { p: true, val: function (u) { return x(u) && x(u)[0] ? 1 - x(u)[1] / x(u)[0] : null; }, txt: P, dica: function (u) { return GS.t("d_abst", { v: GS.nf(x(u)[0] - x(u)[1]) }); } },
        brancos: { p: true, val: function (u) { return x(u) && x(u)[1] ? vt(u, n, "95") / x(u)[1] : null; }, txt: P, dica: function (u) { return GS.nf(vt(u, n, "95")) + " " + GS.t("votos"); } },
        nulos: { p: true, val: function (u) { return x(u) && x(u)[1] ? vt(u, n, "96") / x(u)[1] : null; }, txt: P, dica: function (u) { return GS.nf(vt(u, n, "96")) + " " + GS.t("votos"); } },
        secoes: { val: function (u) { return u.s; }, txt: GS.nf },
        anom: { val: function (u) { return u.a[n] ? u.a[n][0] : null; }, txt: GS.nf, dica: function (u) { return GS.t("d_anom", { a: GS.nf(u.a[n][0]), s: GS.nf(u.s) }); } },
        anomP: { val: function (u) { return u.a[n] && u.s ? (u.a[n][0] / u.s) * 1000 : null; }, txt: function (v) { return GS.nf(v, 1); }, dica: function (u) { return GS.t("d_anom", { a: GS.nf(u.a[n][0]), s: GS.nf(u.s) }); } },
      }[k];
      M.k = k; M.nome = GS.t("m_" + k); M.curto = GS.t("c_" + k);
      return M;
    }
    function fv(M, u) { var v = M.val(u); return v == null ? "–" : M.txt(v); }
    function csvv(M, u) { var v = M.val(u); return v == null ? "" : M.p ? GS.nf(v * 100, 2) : M.k === "anomP" ? GS.nf(v, 2) : v; }
    function cabCsv(M) { return M.nome + (M.p && M.k.indexOf("c:") ? " (%)" : ""); }
    function dicaDe(M, u) { var v = fv(M, u); return rot(u) + "\n" + M.nome + ": " + v + (M.dica && M.val(u) != null ? "\n" + M.dica(u) : ""); }
    function barras(linhas) {
      var max = Math.max.apply(null, linhas.map(function (l) { return l.v || 0; }).concat([1e-9]));
      var res = Math.round(Math.min(170, 16 + Math.max.apply(null, linhas.map(function (l) { return String(l.txt).length; }).concat([4])) * 7.4));
      return '<div class="bars" role="list" style="--res:' + res + 'px">' + linhas.map(function (l, i) {
        return '<div class="bar-row' + (l.cls ? " " + l.cls : "") + '" role="listitem" tabindex="0" data-tip="' + E(l.dica || l.rot + "\n" + l.txt) + '" style="--i:' + Math.min(i, 30) + '"><span class="bar-label">' + E(l.rot)
          + '</span><span class="bar-track"><span class="bar" style="--f:' + ((l.v || 0) / max).toFixed(4) + '"></span><span class="bar-value">' + E(l.txt) + "</span></span></div>";
      }).join("") + "</div>";
    }
    function kvi(M, u) { return '<div data-tip="' + E(dicaDe(M, u)) + '"><dt>' + E(M.nome) + "</dt><dd>" + E(fv(M, u)) + "</dd></div>"; }
    function barrasCands(u) {
      var n = st.n, v = validos(u, n);
      var l = principais(n, 99).map(function (c) { return { c: c, x: vt(u, n, c[0]) }; }).filter(function (o) { return o.x > 0; }).sort(function (a, b) { return b.x - a.x; });
      if (!v) return '<p class="small muted">–</p>';
      var linhas = l.slice(0, 6).map(function (o) { return { rot: candNome(o.c), v: o.x, txt: GS.pct(o.x / v, 1), dica: candNome(o.c) + "\n" + GS.nf(o.x) + " " + GS.t("votos") + " · " + GS.pct(o.x / v, 2) }; });
      var resto = l.slice(6).reduce(function (s, o) { return s + o.x; }, 0);
      if (resto) linhas.push({ rot: GS.t("outros"), v: resto, txt: GS.pct(resto / v, 1), dica: GS.t("outros") + "\n" + GS.nf(resto) + " " + GS.t("votos") });
      return barras(linhas) + '<p class="small muted">' + E(GS.t("validos", { v: GS.nf(v) })) + "</p>";
    }
    function ctlTurno() {
      return '<div class="gd-seg" role="group" aria-label="' + E(GS.t("turno_t")) + '">' + [2, 1].map(function (n) {
        return '<button type="button" data-n="' + n + '" aria-pressed="' + (st.n === n) + '">' + E(GS.t("turno", { n: n })) + "</button>";
      }).join("") + "</div>";
    }
    function nota() { return '<p class="small muted gd-nota">' + E(GS.t("anom_nota")) + "</p>"; }
    function opcao(v, txt, on) { return '<option value="' + E(v) + '"' + (on ? " selected" : "") + ">" + E(txt) + "</option>"; }
    function refocar(sel) { var el = raiz.querySelector(sel); if (el) el.focus({ preventScroll: true }); }
    var ordenados = function () { return D.un.slice().sort(function (a, b) { return rot(a).localeCompare(rot(b), GS.loc()); }); };

    // --- comparativo ---
    function cmpMontar() { raiz.innerHTML = '<div class="gd-ctl">' + ctlTurno() + '</div><div class="gd-res"></div>' + nota(); cmpAtualizar(); }
    function cmpAtualizar() {
      var n = st.n, us = D.un, top = principais(n, n === 1 ? 3 : 2);
      var Ms = ["aptos", "comp", "compP", "abst", "brancos", "nulos"].concat(top.map(function (c) { return "c:" + c[0]; })).concat(["secoes", "anom", "anomP"]).map(med);
      var graf = ["compP", "abst", "brancos", "nulos"].concat(top.slice(0, 2).map(function (c) { return "c:" + c[0]; })).concat(["anomP"]).map(med);
      raiz.querySelector(".gd-res").innerHTML = '<div class="gd-cards">' + us.map(function (u) {
        return '<article class="card gd-card"><h3>' + E(nome(u)) + '</h3><p class="small muted">' + E(sub(u)) + '</p><dl class="kv">' + ["aptos", "compP", "abst", "anomP"].map(function (k) { return kvi(med(k), u); }).join("") + "</dl></article>";
      }).join("") + "</div>"
        + "<h2>" + E(GS.t("lado")) + '</h2><div class="table-wrap"><table class="num-cols"><thead><tr><th scope="col">' + E(GS.t("medida")) + "</th>" + us.map(function (u) { return '<th scope="col">' + E(nome(u)) + "</th>"; }).join("") + "</tr></thead><tbody>"
        + Ms.map(function (M) { return '<tr><th scope="row">' + E(M.nome) + "</th>" + us.map(function (u) { return "<td" + (M.dica && M.val(u) != null ? ' data-tip="' + E(dicaDe(M, u)) + '"' : "") + ">" + E(fv(M, u)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>"
        + "<h2>" + E(GS.t("graficos")) + '</h2><div class="gd-grafs">' + graf.map(function (M) {
          return '<section class="card"><h3>' + E(M.nome) + "</h3>" + barras(us.map(function (u) { return { rot: nome(u), v: M.val(u), txt: fv(M, u), dica: dicaDe(M, u) }; })) + "</section>";
        }).join("") + "</div>"
        + "<h2>" + E(GS.t("candidatos")) + '</h2><div class="gd-grafs">' + us.map(function (u) { return '<section class="card"><h3>' + E(nome(u)) + "</h3>" + barrasCands(u) + "</section>"; }).join("") + "</div>";
      window.GS_CSV = function () { return [[GS.t("medida")].concat(us.map(nome))].concat(Ms.map(function (M) { return [cabCsv(M)].concat(us.map(function (u) { return csvv(M, u); })); })); };
    }

    // --- ranking ---
    function colsRank() { return ["secoes", "aptos", "compP", "abst", "brancos", "nulos"].concat(principais(st.n, 2).map(function (c) { return "c:" + c[0]; })).concat(["anom", "anomP"]); }
    function rankMontar() {
      var ufs = D.comUf ? D.un.map(function (u) { return u.u; }).filter(function (u, i, l) { return l.indexOf(u) === i; }).sort() : [];
      raiz.innerHTML = '<div class="gd-ctl">' + ctlTurno()
        + '<label class="gd-busca"><span class="gd-f">' + E(GS.t("buscar")) + '</span><input type="search" data-gd="busca" placeholder="' + E(GS.t("busca_nome")) + '" value="' + E(st.busca) + '"></label>'
        + (ufs.length ? '<label class="gd-f"><span>' + E(GS.t("uf")) + '</span><select data-gd="uf">' + opcao("", GS.t("todos"), !st.uf) + ufs.map(function (u) { return opcao(u, u, st.uf === u); }).join("") + "</select></label>" : "")
        + '<label class="gd-f"><span>' + E(GS.t("mostrar")) + '</span><select data-gd="lim">' + [25, 50, 100, 0].map(function (x) { return opcao(x, x ? GS.nf(x) : GS.t("todos"), st.lim === x); }).join("") + "</select></label></div>"
        + '<p class="small muted gd-resumo" aria-live="polite"></p><div class="table-wrap"></div><p class="gd-mais"></p>' + nota();
      rankTabela();
    }
    function rankTabela() {
      var cols = colsRank(); if (cols.indexOf(st.ord) < 0) { st.ord = "aptos"; st.dir = -1; }
      var Ms = {}; cols.forEach(function (k) { Ms[k] = med(k); });
      var s = GS.norm(st.busca), Mo = Ms[st.ord];
      var l = D.un.filter(function (u) { return (!s || GS.norm(rot(u)).indexOf(s) >= 0) && (!st.uf || u.u === st.uf); })
        .map(function (u) { return { u: u, v: Mo.val(u) }; });
      l.sort(function (a, b) { if (a.v == null && b.v == null) return 0; if (a.v == null) return 1; if (b.v == null) return -1; return (st.dir < 0 ? b.v - a.v : a.v - b.v) || rot(a.u).localeCompare(rot(b.u)); });
      var max = Math.max.apply(null, l.map(function (x) { return Math.abs(x.v || 0); }).concat([1e-9])), vis = st.lim ? l.slice(0, st.lim) : l;
      raiz.querySelector(".table-wrap").innerHTML = '<table class="num-cols gd-rank"><thead><tr><th scope="col">#</th><th scope="col">' + E(GS.t("lugar")) + "</th>" + cols.map(function (k) {
        var on = k === st.ord;
        return '<th scope="col" aria-sort="' + (on ? (st.dir < 0 ? "descending" : "ascending") : "none") + '"><button type="button" data-ord="' + k + '" data-tip="' + E(Ms[k].nome) + '">' + E(Ms[k].curto) + (on ? (st.dir < 0 ? " ↓" : " ↑") : "") + "</button></th>";
      }).join("") + "</tr></thead><tbody>" + (vis.length ? vis.map(function (x, i) {
        return "<tr><td>" + GS.nf(i + 1) + '</td><th scope="row">' + E(rot(x.u)) + "</th>" + cols.map(function (k) {
          var M = Ms[k], v = M.val(x.u);
          return "<td" + (v != null && M.dica ? ' data-tip="' + E(dicaDe(M, x.u)) + '"' : "") + ">" + E(v == null ? "–" : M.txt(v)) + (k === st.ord && v != null ? '<span class="gd-mb" style="--f:' + (Math.abs(v) / max).toFixed(4) + '"></span>' : "") + "</td>";
        }).join("") + "</tr>";
      }).join("") : '<tr><td colspan="' + (cols.length + 2) + '">' + E(GS.t("nenhum")) + "</td></tr>") + "</tbody></table>";
      raiz.querySelector(".gd-resumo").textContent = GS.t("r_resumo", { n: GS.nf(l.length), m: Mo.nome, o: GS.t(st.dir < 0 ? "maior" : "menor") });
      var falta = l.length - vis.length;
      raiz.querySelector(".gd-mais").innerHTML = falta > 0 ? '<button type="button" class="btn btn-sm" data-gd="mais">' + E(GS.t("ver_mais", { n: GS.nf(Math.min(50, falta)) })) + "</button>" : "";
      window.GS_CSV = function () {
        return [["#", GS.t("lugar")].concat(D.comUf ? [GS.t("uf")] : []).concat(cols.map(function (k) { return cabCsv(Ms[k]); }))]
          .concat(l.map(function (x, i) { return [i + 1, nome(x.u)].concat(D.comUf ? [x.u.u] : []).concat(cols.map(function (k) { return csvv(Ms[k], x.u); })); }));
      };
    }

    // --- painel ---
    function painelMontar() {
      var ord = ordenados();
      if (!st.sel || !POR[st.sel]) { var m = location.hash.match(/^#k=(.+)$/), k = m ? decodeURIComponent(m[1]) : null; st.sel = k && POR[k] ? k : POR[D.sel] ? D.sel : ord[0].k; }
      raiz.innerHTML = '<div class="gd-ctl">' + ctlTurno() + '<label class="gd-f gd-lugar"><span>' + E(GS.t("lugar")) + '</span><select data-gd="sel">' + ord.map(function (u) { return opcao(u.k, rot(u), u.k === st.sel); }).join("") + "</select></label>"
        + '<span class="gd-nav"><button type="button" class="gs-bt" data-gd="ant" aria-label="' + E(GS.t("ant_l")) + '" title="' + E(GS.t("ant_l")) + '">' + I.back + '</button><button type="button" class="gs-bt gs-prx" data-gd="prox" aria-label="' + E(GS.t("prox_l")) + '" title="' + E(GS.t("prox_l")) + '">' + I.back + "</button></span></div>"
        + '<div class="gd-res"></div>' + nota();
      painelAtualizar();
    }
    function painelAtualizar() {
      var u = POR[st.sel], n = st.n, R = D.ref, top = principais(n, 2).map(function (c) { return "c:" + c[0]; });
      var tiles = [["aptos", "users"], ["compP", "vote"], ["abst", "users"], ["brancos", "file"], ["nulos", "file"], ["secoes", "grid"], ["anom", "flag"]];
      var cmp = ["compP", "abst", "brancos", "nulos"].concat(top);
      var pos = ["aptos", "compP", "abst", "brancos", "nulos"].concat(top).concat(["anomP"]);
      raiz.querySelector(".gd-res").innerHTML = '<h2 class="gd-nome">' + E(nome(u)) + '</h2><p class="small muted">' + E(sub(u)) + " · " + E(GS.t("turno", { n: n })) + "</p>"
        + '<div class="tiles">' + tiles.map(function (x) {
          var M = med(x[0]);
          return '<div class="tile" tabindex="0" data-tip="' + E(dicaDe(M, u)) + '"><div class="tile-top">' + I[x[1]] + '</div><div class="tile-v">' + E(fv(M, u))
            + (x[0] === "anom" && M.val(u) != null ? " <small>" + E(GS.t("por_mil", { v: fv(med("anomP"), u) })) + "</small>" : "") + '</div><div class="tile-l">' + E(M.nome) + "</div></div>";
        }).join("") + "</div>"
        + '<section class="card"><h3>' + E(GS.t("candidatos")) + "</h3>" + barrasCands(u) + "</section>"
        + (R ? '<section class="card"><h3>' + E(GS.t("comparado", { r: nome(R) })) + '</h3><div class="gd-grafs gd-mini">' + cmp.map(function (k) {
          var M = med(k);
          return "<div><h4>" + E(M.nome) + "</h4>" + barras([{ rot: nome(u), v: M.val(u), txt: fv(M, u), dica: dicaDe(M, u) }, { rot: nome(R), v: M.val(R), txt: fv(M, R), dica: dicaDe(M, R), cls: "gd-ref" }]) + "</div>";
        }).join("") + "</div></section>" : "")
        + (D.un.length > 1 ? '<section class="card"><h3>' + E(GS.t("posicoes", { n: GS.nf(D.un.length) })) + '</h3><ul class="gd-pos">' + pos.map(function (k) {
          var M = med(k), v = M.val(u); if (v == null) return "";
          var p = 1 + D.un.filter(function (o) { var w = M.val(o); return w != null && w > v; }).length;
          return "<li><span>" + E(M.nome) + "</span><b>" + E(GS.t("pos", { p: GS.nf(p), t: GS.nf(D.un.length) })) + "</b></li>";
        }).join("") + '</ul><p class="small muted">' + E(GS.t("pos_nota")) + "</p></section>" : "");
      if (history.replaceState) history.replaceState(null, "", "#k=" + encodeURIComponent(u.k));
      var todas = ["aptos", "comp", "compP", "abst", "brancos", "nulos"].concat(principais(n, 99).map(function (c) { return "c:" + c[0]; })).concat(["secoes", "anom", "anomP"]).map(med);
      window.GS_CSV = function () { return [[GS.t("medida"), nome(u)].concat(R ? [nome(R)] : [])].concat(todas.map(function (M) { return [cabCsv(M), csvv(M, u)].concat(R ? [csvv(M, R)] : []); })); };
    }
    function mover(passo) {
      var ord = ordenados(), i = ord.findIndex(function (u) { return u.k === st.sel; });
      st.sel = ord[(i + passo + ord.length) % ord.length].k;
      var s = raiz.querySelector('[data-gd="sel"]'); if (s) s.value = st.sel;
      painelAtualizar();
    }

    // --- mapa ---
    function classes(vals) {
      var pos = vals.filter(function (v) { return v > 0; }).sort(function (a, b) { return a - b; }), zero = vals.some(function (v) { return v <= 0; });
      if (!pos.length) return { cls: function () { return 0; }, faixas: [], zero: zero };
      var q = [0.25, 0.5, 0.75].map(function (p) { return pos[Math.min(pos.length - 1, Math.floor(p * pos.length))]; });
      var lim = q.filter(function (x, i) { return q.indexOf(x) === i && x < pos[pos.length - 1]; });
      var faixas = [], ini = pos[0];
      lim.forEach(function (x) { faixas.push([ini, x]); ini = pos.filter(function (v) { return v > x; })[0]; });
      faixas.push([ini, pos[pos.length - 1]]);
      return { cls: function (v) { return v <= 0 ? 0 : 1 + lim.filter(function (x) { return v > x; }).length; }, faixas: faixas, zero: zero };
    }
    function opsMapa() { return ["compP", "abst", "brancos", "nulos"].concat(principais(st.n, st.n === 1 ? 5 : 2).map(function (c) { return "c:" + c[0]; })).concat(["anomP"]); }
    function mapaMontar() {
      var ops = opsMapa(); if (ops.indexOf(st.med) < 0) st.med = "compP";
      if (!st.sel) { var m = location.hash.match(/^#k=(.+)$/), k = m ? decodeURIComponent(m[1]) : null; if (k && POR[k]) st.sel = k; }
      raiz.innerHTML = '<div class="gd-ctl">' + ctlTurno() + '<label class="gd-f"><span>' + E(GS.t("medida")) + '</span><select data-gd="med">' + ops.map(function (k) { return opcao(k, med(k).nome, k === st.med); }).join("") + "</select></label>"
        + '<label class="gd-busca"><span class="gd-f">' + E(GS.t("achar")) + '</span><input type="search" list="gd-dl" data-gd="achar" placeholder="' + E(GS.t("achar_ph")) + '"></label><datalist id="gd-dl">' + ordenados().map(function (u) { return '<option value="' + E(rot(u)) + '">'; }).join("") + "</datalist></div>"
        + '<div class="map-wrap gd-mapa"><div class="map' + (D.mapaUf ? " map-uf" : "") + '"></div><div class="map-side"></div></div>'
        + '<details class="gd-tabela"><summary>' + E(GS.t("ver_tabela")) + '</summary><div class="table-wrap"></div></details>' + nota();
      mapaAtualizar();
    }
    function mapaAtualizar() {
      var M = med(st.med), vals = {}, l = [];
      D.un.forEach(function (u) { var v = M.val(u); vals[u.k] = v; if (v != null) l.push(v); });
      var C = classes(l), P = D.mapa.p;
      raiz.querySelector(".map").innerHTML = '<svg viewBox="0 0 ' + D.mapa.vb[0] + " " + D.mapa.vb[1] + '" role="group" aria-label="' + E(M.nome) + '">' + Object.keys(P).map(function (k) {
        var u = POR[k]; if (!u) return "";
        var v = vals[k], tx = v == null ? "–" : M.txt(v);
        return '<a class="mp-uf q' + (v == null ? 0 : C.cls(v)) + (k === st.sel ? " mp-dest" : "") + '" data-k="' + E(k) + '" role="button" tabindex="0" aria-label="' + E(rot(u) + ": " + tx) + '" data-tip="' + E(dicaDe(M, u)) + '"><path d="' + P[k] + '"/></a>';
      }).join("") + (st.sel && P[st.sel] ? '<path class="mp-dest-c" d="' + P[st.sel] + '"/>' : "") + "</svg>";
      var u = st.sel && POR[st.sel];
      raiz.querySelector(".map-side").innerHTML = '<p class="small"><b>' + E(M.nome) + " · " + E(GS.t("turno", { n: st.n })) + '</b></p><ul class="seq-leg">'
        + (C.zero ? '<li><span class="sw q0"></span>' + E(GS.t("zero")) + "</li>" : "")
        + C.faixas.map(function (f, i) { return '<li><span class="sw q' + (i + 1) + '"></span>' + E(f[0] === f[1] ? M.txt(f[0]) : M.txt(f[0]) + " – " + M.txt(f[1])) + "</li>"; }).join("")
        + '</ul><p class="small muted">' + E(GS.t("leg_nota")) + "</p>"
        + (u ? '<div class="card"><h3>' + E(rot(u)) + '</h3><dl class="kv">' + ["aptos", "compP", "abst", "brancos", "nulos", "anom"].map(function (k) { return kvi(med(k), u); }).join("") + "</dl>" + barrasCands(u) + "</div>"
          : '<p class="small muted">' + E(GS.t("toque")) + "</p>");
      var ord = D.un.map(function (o) { return { u: o, v: vals[o.k] }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return b.v - a.v; });
      raiz.querySelector(".gd-tabela .table-wrap").innerHTML = '<table class="num-cols"><thead><tr><th scope="col">#</th><th scope="col">' + E(GS.t("lugar")) + '</th><th scope="col">' + E(M.nome) + "</th></tr></thead><tbody>"
        + ord.map(function (x, i) { return "<tr><td>" + GS.nf(i + 1) + "</td><td>" + E(rot(x.u)) + "</td><td>" + E(M.txt(x.v)) + "</td></tr>"; }).join("") + "</tbody></table>";
      if (u && history.replaceState) history.replaceState(null, "", "#k=" + encodeURIComponent(u.k));
      window.GS_CSV = function () { return [[GS.t("lugar")].concat(D.comUf ? [GS.t("uf")] : []).concat([cabCsv(M)])].concat(ord.map(function (x) { return [nome(x.u)].concat(D.comUf ? [x.u.u] : []).concat([csvv(M, x.u)]); })); };
    }
    function achar(txt) {
      var s = GS.norm(txt); if (!s) return;
      var u = D.un.filter(function (o) { return GS.norm(rot(o)) === s; })[0] || D.un.filter(function (o) { return GS.norm(rot(o)).indexOf(s) === 0; })[0];
      if (!u) { GS.aviso(GS.t("nenhum")); return; }
      st.sel = u.k; mapaAtualizar();
    }

    var VISTAS = { comparativo: cmpMontar, ranking: rankMontar, painel: painelMontar, mapa: mapaMontar };
    function montar() { VISTAS[D.tipo](); GS.animar(raiz); }
    raiz.addEventListener("click", function (e) {
      var b = e.target.closest("[data-n]");
      if (b) { st.n = +b.getAttribute("data-n"); montar(); refocar('[data-n="' + st.n + '"]'); return; }
      b = e.target.closest("[data-ord]");
      if (b) { var k = b.getAttribute("data-ord"); if (st.ord === k) st.dir = -st.dir; else { st.ord = k; st.dir = -1; } rankTabela(); refocar('[data-ord="' + k + '"]'); return; }
      b = e.target.closest("[data-gd]");
      if (b) { var g = b.getAttribute("data-gd"); if (g === "mais") { st.lim += 50; rankTabela(); } else if (g === "ant" || g === "prox") { mover(g === "prox" ? 1 : -1); GS.animar(raiz); } return; }
      var a = e.target.closest(".mp-uf[data-k]");
      if (a) { st.sel = a.getAttribute("data-k"); mapaAtualizar(); GS.animar(raiz.querySelector(".map-side")); }
    });
    raiz.addEventListener("keydown", function (e) {
      var a = e.target.closest && e.target.closest(".mp-uf[data-k]");
      if (a && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); st.sel = a.getAttribute("data-k"); mapaAtualizar(); refocar('.mp-uf[data-k="' + st.sel + '"]'); }
    });
    raiz.addEventListener("input", function (e) { if (e.target.getAttribute("data-gd") === "busca") { st.busca = e.target.value; rankTabela(); } });
    raiz.addEventListener("change", function (e) {
      var g = e.target.getAttribute("data-gd"), v = e.target.value;
      if (g === "uf") { st.uf = v; rankTabela(); } else if (g === "lim") { st.lim = +v; rankTabela(); }
      else if (g === "sel") { st.sel = v; painelAtualizar(); GS.animar(raiz); }
      else if (g === "med") { st.med = v; mapaAtualizar(); }
      else if (g === "achar") { achar(v); e.target.value = ""; }
    });
    GS.ouvir.push(montar);
    montar();
  }

  // --- recursos do site (CSS, fonte, ícone e licença da fonte): baixados uma vez ------------------------------------------------
  const FONTE = "space-grotesk-latin-wght-normal.woff2";
  let REC = null;
  async function recursos() {
    if (REC) return REC;
    const pega = (u, tipo) => fetch(u).then((r) => (r.ok ? r[tipo]() : Promise.reject(new Error(`${u}: ${r.status}`))));
    const [css, fonte, favicon, ofl] = await Promise.all([pega("site/css/style.css", "text"), pega(`site/fonts/${FONTE}`, "arrayBuffer").catch(() => null),
      pega("site/img/favicon.svg", "text").catch(() => ""), pega("site/fonts/OFL-SpaceGrotesk.txt", "text").catch(() => "")]);
    REC = { css, fonte, favicon, ofl };
    return REC;
  }
  const base64 = (buf) => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  // .html: a fonte vai dentro do arquivo (funciona sem internet); .zip: fica na pasta fonts/
  function estiloCss(R, zipar) {
    const fonte = zipar ? `url("../fonts/${FONTE}")` : R.fonte ? `url("data:font/woff2;base64,${base64(R.fonte)}")` : `url("${URL_SITE}site/fonts/${FONTE}")`;
    return R.css.replace(/url\("\.\.\/fonts\/[^"]+"\)/, fonte) + "\n/* site gerado pelo Atlas · " + URL_SITE + " */\n" + CSS_GS;
  }
  const ICOS = ["share", "print", "download", "chat", "send", "link", "close", "back", "users", "vote", "file", "grid", "flag"];
  const RT = { base: rtBase, paginas: rtPaginas, apresentacao: rtSlides, perguntas: rtFaq, dados: rtDados };
  const rtTexto = (nomes) => nomes.map((k) => `(${RT[k].toString()})();`).join("\n");

  // --- a página: cabeçalho com as ferramentas, conteúdo e rodapé com o carimbo ---------------------------------------------------
  // o: { tipo, titulo, lang, langs, estilo, quando, R, zipar, nav, corpo, dados, feito, rodape }
  function pagina(o) {
    const G = window.I18N[o.lang].at.gx, g = (k, p) => esc(preencher(G[k], p));
    const quandoTxt = new Intl.DateTimeFormat(HTML_LANG[o.lang], { dateStyle: "long", timeStyle: "short" }).format(o.quando);
    const marca = `<span class="at-marca" aria-hidden="true">${icone("globe")}</span>`;
    const bt = (k, ic, tk) => `<button type="button" class="gs-bt" data-gs="${k}" data-tl="${tk}" aria-label="${g(tk)}" title="${g(tk)}">${icone(ic)}<span data-t="${tk}">${g(tk)}</span></button>`;
    const inicio = o.tipo === "paginas" ? "#/" : o.tipo === "apresentacao" ? "#/1" : "#inicio";
    const cfg = { tipo: o.tipo, titulo: o.titulo, lang: o.lang, langs: o.langs ? LANGS : [o.lang], quando: o.quando.toISOString(), arq: o.arq,
      t: Object.fromEntries((o.langs ? LANGS : [o.lang]).map((l) => [l, window.I18N[l].at.gx])), ico: Object.fromEntries(ICOS.map((k) => [k, icone(k)])) };
    const host = URL_SITE.replace(/^https:\/\/|\/$/g, "");
    const rodape = `<div class="gs-selo">${marca}<span><b data-t="por">${g("por")}</b><span data-t="${o.feito}">${g(o.feito, { d: quandoTxt })}</span></span></div>
<p data-t="fonte">${g("fonte")}</p><p data-t="badge">${g("badge")}</p>
<p><a href="${URL_SITE}" target="_blank" rel="noopener">${host}</a> · <a href="${URL_SITE}#/atlas" target="_blank" rel="noopener" data-t="atlas">${g("atlas")}</a></p>`;
    const corpo = typeof o.corpo === "function" ? o.corpo(rodape) : o.corpo;
    const scripts = [A.exportar.SCRIPT_DOC, rtTexto(["base"].concat(o.rt || []))].join("\n");
    const icone_ = o.zipar ? "img/favicon.svg" : o.R.favicon ? `data:image/svg+xml,${encodeURIComponent(o.R.favicon)}` : "";
    const html = `<!doctype html>
<html lang="${HTML_LANG[o.lang]}" class="anim" data-locale="${esc(t().locale)}" data-estilo="${esc(o.estilo)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="description" content="${g(o.lead)}">
<meta name="generator" content="Atlas · Paraná Contra os Corruptos (${esc(URL_SITE)})">
<meta property="og:title" content="${esc(o.titulo)}">
<meta property="og:description" content="${g(o.lead)}">
<title>${esc(o.titulo)}</title>
${icone_ ? `<link rel="icon" href="${esc(icone_)}">` : ""}
<script>${TEMA_SITE}<\/script>
${o.zipar ? `<link rel="stylesheet" href="css/estilo.css">` : `<style>${estiloCss(o.R, false)}</style>`}
</head>
<body class="doc-pagina gs gs-${o.tipo}">
<a class="skip" href="#conteudo" data-t="pular">${g("pular")}</a>
<header class="gs-top"><div class="gs-faixa"></div>
<div class="gs-wrap gs-barra"><a class="gs-marca" href="${inicio}">${marca}<span><b>${esc(o.titulo)}</b><small data-t="marca">${g("marca")}</small></span></a>
<div class="gs-ferr">${o.langs ? `<label class="gs-lang"><span class="sr-only" data-t="idioma">${g("idioma")}</span><select>${LANGS.map((l) => `<option value="${l}"${l === o.lang ? " selected" : ""}>${l}</option>`).join("")}</select></label>` : ""}${bt("share", "share", "comp")}${bt("print", "print", "imp")}${bt("csv", "download", "csv")}<button type="button" class="gs-bt gs-tema" data-tl="tema" aria-label="${g("tema")}" title="${g("tema")}"><span class="i-sol">${icone("sun")}</span><span class="i-lua">${icone("moon")}</span></button></div></div>
${o.nav || ""}
</header>
<main class="gs-main" id="conteudo">
${corpo}
</main>
${o.semRodape ? "" : `<footer class="gs-rod"><div class="gs-wrap">\n${rodape}\n</div></footer>`}
<script type="application/json" id="gs-cfg">${json(cfg)}<\/script>
${o.dados ? `<script type="application/json" id="gs-dados">${json(o.dados)}<\/script>` : ""}
${o.zipar ? `<script src="js/site.js"><\/script>` : `<script>${scripts}<\/script>`}
</body>
</html>
`;
    return { html, scripts };
  }

  // --- conteúdo de cada tipo ---------------------------------------------------------------------------------------------------
  const sub_ = (p) => (p.sub ? `<p>${esc(p.sub)}</p>` : "");
  const cabParte = (p, i) => `<header class="gs-cab"><span class="gs-n" aria-hidden="true">${num(i)}</span><div><h2>${esc(p.titulo)}</h2>${sub_(p)}</div></header>`;
  const cartoes = (partes, href) => partes.map((p, i) => `<a class="gs-card" href="${href(i)}" data-busca="${esc(norm(`${p.titulo} ${p.sub || ""} ${p.texto || ""}`))}"><span class="gs-n">${num(i)}</span><b>${esc(p.titulo)}</b>${p.sub ? `<span>${esc(p.sub)}</span>` : ""}${p.destaque ? `<strong>${esc(p.destaque[1])}</strong><small>${esc(p.destaque[0])}</small>` : p.resumo ? `<small>${esc(p.resumo)}</small>` : ""}</a>`).join("");
  function heroResp(o, G, lead, extra) {
    const g = (k, p) => esc(preencher(G[k], p));
    return `<p class="gs-kicker" data-t="k_r">${g("k_r")}</p><h1>${esc(o.titulo)}</h1><p class="gs-lead" data-t="${lead}">${g(lead)}</p>
<p class="gs-meta">${esc(o.quandoTxt)} · ${g("partes", { n: o.partes.length })}</p><p class="doc-selo" data-t="badge">${g("badge")}</p>${extra || ""}`;
  }
  const busca = (G) => `<label class="gs-busca">${icone("search")}<span class="sr-only" data-t="buscar">${esc(G.buscar)}</span><input type="search" data-tp="busca_ph" placeholder="${esc(G.busca_ph)}"></label><p class="gs-cont" aria-live="polite"></p>`;

  function corpoResp(o) {
    const G = window.I18N[o.lang].at.gx, P = o.partes, g = (k) => esc(G[k]);
    if (o.tipo === "relatorio") {
      const ids = P.map((p, i) => `parte-${i + 1}-${nz(p.titulo).slice(0, 40) || "atlas"}`);
      return {
        nav: P.length > 1 ? `<nav class="gs-nav" data-tl="nav" aria-label="${g("nav")}"><div class="gs-wrap">${P.map((p, i) => `<a href="#${ids[i]}">${esc(p.titulo)}</a>`).join("")}</div></nav>` : "",
        corpo: `<section class="gs-hero" id="inicio"><div class="gs-wrap">${heroResp(o, G, "lead_r", P.length > 1 ? `<p class="gs-resumo-t" data-t="neste">${g("neste")}</p><div class="gs-resumo">${cartoes(P, (i) => `#${ids[i]}`)}</div>` : "")}</div></section>
${P.map((p, i) => `<section class="gs-sec" id="${ids[i]}" data-parte="${esc(p.titulo)}"><div class="gs-wrap">${cabParte(p, i)}
<div class="doc-corpo">${p.el.innerHTML}</div><p class="gs-subir"><a href="#inicio">↑ <span data-t="topo">${g("topo")}</span></a></p></div></section>`).join("\n")}`,
      };
    }
    if (o.tipo === "paginas") {
      const pager = (i) => `<nav class="gs-pager">${i ? `<a href="#/p/${i}"><small data-t="ant">${g("ant")}</small>${esc(P[i - 1].titulo)}</a>` : `<a href="#/"><small data-t="inicio">${g("inicio")}</small>${esc(o.titulo)}</a>`}${i < P.length - 1 ? `<a class="gs-px" href="#/p/${i + 2}"><small data-t="prox">${g("prox")}</small>${esc(P[i + 1].titulo)}</a>` : ""}</nav>`;
      return {
        nav: `<nav class="gs-nav" data-tl="nav" aria-label="${g("nav")}"><div class="gs-wrap"><a href="#/" data-t="inicio">${g("inicio")}</a>${P.map((p, i) => `<a href="#/p/${i + 1}">${esc(p.titulo)}</a>`).join("")}</div></nav>`,
        corpo: `<section class="gs-pg gs-capa"><div class="gs-hero" id="inicio"><div class="gs-wrap">${heroResp(o, G, "pag_lead", `${busca(G)}<p class="gs-resumo-t" data-t="neste">${g("neste")}</p><div class="gs-resumo">${cartoes(P, (i) => `#/p/${i + 1}`)}</div><p class="gs-nada" hidden data-t="nada">${g("nada")}</p>`)}</div></div></section>
${P.map((p, i) => `<section class="gs-pg" hidden data-parte="${esc(p.titulo)}"><div class="gs-sec"><div class="gs-wrap">${cabParte(p, i)}<div class="doc-corpo">${p.el.innerHTML}</div>${pager(i)}</div></div></section>`).join("\n")}`,
      };
    }
    if (o.tipo === "apresentacao") {
      const ctl = `<div class="gs-ctrl"><button type="button" class="gs-bt" data-gs="ant" data-tl="ant_l" aria-label="${g("ant_l")}" title="${g("ant_l")}">${icone("back")}</button><span class="gs-cont" aria-live="polite"></span><button type="button" class="gs-bt gs-prx" data-gs="prox" data-tl="prox_l" aria-label="${g("prox_l")}" title="${g("prox_l")}">${icone("back")}</button><button type="button" class="gs-bt" data-gs="cheia" data-tl="tela" aria-label="${g("tela")}" title="${g("tela")}">${ICO_TELA}</button></div><div class="gs-prog" aria-hidden="true"><i></i></div>`;
      return {
        semRodape: true,
        corpo: (rodape) => `<div class="gs-deck" aria-roledescription="carousel">
<section class="gs-slide gs-s-capa gs-hero" aria-roledescription="slide"><div class="gs-slide-in">${heroResp(o, G, "apr_lead")}</div></section>
${P.map((p, i) => `<section class="gs-slide" hidden aria-roledescription="slide" data-parte="${esc(p.titulo)}"><div class="gs-slide-in">${cabParte(p, i)}<div class="doc-corpo">${p.el.innerHTML}</div></div></section>`).join("\n")}
<section class="gs-slide gs-s-fim" hidden aria-roledescription="slide"><div class="gs-slide-in gs-rod">${rodape}</div></section>
</div>${ctl}`,
      };
    }
    // perguntas e respostas
    return {
      corpo: `<section class="gs-hero" id="inicio"><div class="gs-wrap">${heroResp(o, G, "faq_lead", `${busca(G)}<div class="gs-ferr2"><button type="button" class="btn btn-sm" data-gs="abrir" data-t="abrir_todas">${g("abrir_todas")}</button><button type="button" class="btn btn-sm" data-gs="fechar" data-t="fechar_todas">${g("fechar_todas")}</button></div>`)}</div></section>
<div class="gs-wrap"><div class="gs-faq">${P.map((p, i) => `<details class="gs-q" id="q-${i + 1}" data-parte="${esc(p.titulo)}"><summary><span class="gs-n" aria-hidden="true">${num(i)}</span><span><b>${esc(p.titulo)}</b>${p.sub ? `<small>${esc(p.sub)}</small>` : ""}</span></summary><div class="doc-corpo">${p.el.innerHTML}</div></details>`).join("\n")}</div><p class="gs-nada" hidden data-t="nada">${g("nada")}</p></div>`,
    };
  }

  // --- dados de cada lugar, no formato curto que vai no site --------------------------------------------------------------------
  function curto(r) {
    const R = A.state.R, t_ = {}, a = {};
    [1, 2].forEach((n) => {
      const x = r.t && r.t[n];
      if (x) t_[n] = [x.aptos, x.comp].concat(R.ordem_votos[n].map((nr) => x.v[nr] || 0));
      if (r.sn && r.sn[n]) a[n] = [r.sn[n].a, r.sn[n].i];
    });
    const k = r.tipo === "uf" ? r.uf : r.tipo === "br" ? "BR" : `${r.uf}-${r.cod}`;
    return { k, tp: r.tipo, n: r.tipo === "mun" ? r.nome : "", u: r.uf || "", s: r.sec || 0, t: t_, a };
  }
  function candidatos() {
    const R = A.state.R, o = {};
    [1, 2].forEach((n) => {
      const nomes = {}; R.turnos[n].presidente.candidatos.forEach((c) => { nomes[c.nr] = c.nome; });
      o[n] = R.ordem_votos[n].map((nr) => [nr, nr === "95" || nr === "96" ? "" : A.titulo(nomes[nr] || nr)]);
    });
    return o;
  }
  const ufNomes = () => Object.fromEntries(Object.entries(window.UF_NOMES).map(([k, v]) => [k, typeof v === "string" ? { PT: v, EN: v, ES: v } : v]));
  const cacheDados = {};
  async function dadosSite(c) {
    const Q = A.consulta, chave = JSON.stringify([c.tipo, c.esc, c.uf, c.lugs.map(chaveLug)]);
    if (cacheDados[chave]) return cacheDados[chave];
    let un, ref = null, mapa = null, comUf = false, mapaUf = false, sel = null;
    if (c.tipo === "comparativo") {
      un = (await Promise.all(c.lugs.map((x) => Q.linhaLugar(x.tipo === "br" ? { tipo: "br" } : x)))).filter(Boolean).map(curto);
      comUf = c.lugs.some((x) => x.tipo === "mun");
    } else {
      const esc_ = c.tipo === "ranking" ? c.esc : c.esc === "br" ? "muns" : c.esc;
      if (esc_ === "ufs") { un = (await Q.estados({})).filter((r) => r.uf !== "ZZ").map(curto); ref = curto(await Q.linhaLugar({ tipo: "br" })); }
      else if (esc_ === "br") { un = (await Q.municipios(null, {})).filter((r) => r.uf !== "ZZ").map(curto); ref = curto(await Q.linhaLugar({ tipo: "br" })); comUf = true; }
      else { un = (await Q.municipiosUf(c.uf, {})).map(curto); const e = (await Q.estados({})).find((r) => r.uf === c.uf); ref = e ? curto(e) : null; }
      const l0 = c.lugs.find((x) => (esc_ === "ufs" ? x.tipo === "uf" : x.tipo === "mun" && x.uf === c.uf));
      if (l0) sel = l0.tipo === "uf" ? l0.uf : `${l0.uf}-${l0.cod}`;
      if (c.tipo === "mapa") {
        const M = esc_ === "ufs" ? await A.paginasExtra.dado("site/data/mapa.json") : await A.paginasExtra.dado(`site/data/mapas/${c.uf}.json`);
        mapa = { vb: M.vb, p: esc_ === "ufs" ? M.uf : Object.fromEntries(Object.entries(M.m).map(([cod, d]) => [`${c.uf}-${cod}`, d])) };
        mapaUf = esc_ !== "ufs";
      }
    }
    const D = { tipo: c.tipo, un, ref, cands: candidatos(), ufn: ufNomes(), comUf, mapaUf, sel, mapa };
    cacheDados[chave] = D;
    return D;
  }

  // --- montar o site: { nome, html } (um arquivo) ou { nome, blob } (.zip) -------------------------------------------------------
  // c: { tipo, titulo, estilo, lang, partes, lugs, esc, uf }
  async function montar(c, zipar) {
    const T = X(), R = await recursos(), quando = new Date(), dados = grupo(c.tipo) === "d";
    const nome = `${(nz(c.titulo) || "site-atlas").slice(0, 50)}-${quando.toISOString().slice(0, 10)}`;
    const base = { tipo: c.tipo, titulo: c.titulo, lang: c.lang, estilo: c.estilo, quando, R, zipar, arq: nome };
    let o;
    if (dados) {
      const D = await dadosSite(c);
      o = Object.assign(base, { langs: true, dados: D, rt: ["dados"], feito: "feito_d", lead: `l_${c.tipo}`,
        corpo: (() => { const G = window.I18N[c.lang].at.gx, g = (k, p) => esc(preencher(G[k], p));
          const quandoTxt = new Intl.DateTimeFormat(HTML_LANG[c.lang], { dateStyle: "long", timeStyle: "short" }).format(quando);
          return `<section class="gs-hero" id="inicio"><div class="gs-wrap"><p class="gs-kicker" data-t="k_${c.tipo}">${g(`k_${c.tipo}`)}</p><h1>${esc(c.titulo)}</h1><p class="gs-lead" data-t="l_${c.tipo}">${g(`l_${c.tipo}`)}</p>
<p class="gs-meta" data-t="feito_d">${g("feito_d", { d: quandoTxt })}</p><p class="doc-selo" data-t="badge">${g("badge")}</p></div></section>
<section class="gd"><div class="gs-wrap" id="gd"></div></section>`; })() });
    } else {
      const quandoTxt = new Intl.DateTimeFormat(HTML_LANG[c.lang], { dateStyle: "long", timeStyle: "short" }).format(quando);
      const partes = c.partes.map((p) => Object.assign({}, p, { texto: p.texto || "" }));
      const r = corpoResp({ tipo: c.tipo, titulo: c.titulo, lang: c.lang, partes, quandoTxt });
      o = Object.assign(base, { langs: false, partes, rt: c.tipo === "relatorio" ? [] : [c.tipo], feito: "feito_r", lead: "lead_r" }, r);
    }
    const pg = pagina(o);
    if (!zipar) return { nome, html: pg.html };
    const arquivos = [
      { nome: `${nome}/index.html`, dados: pg.html },
      { nome: `${nome}/css/estilo.css`, dados: estiloCss(R, true) },
      { nome: `${nome}/js/site.js`, dados: `/* ${window.I18N[c.lang].at.gx.por} · ${URL_SITE} */\n${pg.scripts}\n` },
      { nome: `${nome}/README.md`, dados: T.gs_leia(c.titulo, new Intl.DateTimeFormat(HTML_LANG[c.lang], { dateStyle: "long" }).format(quando)) },
    ];
    if (dados) arquivos.push({ nome: `${nome}/dados/dados.json`, dados: JSON.stringify(o.dados) });
    else arquivos.push({ nome: `${nome}/dados/respostas.json`, dados: JSON.stringify({ titulo: c.titulo, gerado: quando.toISOString(), por: "Atlas · Paraná Contra os Corruptos", site: URL_SITE, aviso: t().badge,
      partes: c.partes.map((p) => ({ titulo: p.titulo, sub: p.sub || "", blocos: A.exportar.modelo([p.el]).map((b) => (b.el ? Object.assign({}, b, { el: undefined }) : b)) })) }, null, 2) });
    if (R.favicon) arquivos.push({ nome: `${nome}/img/favicon.svg`, dados: R.favicon });
    if (R.fonte) arquivos.push({ nome: `${nome}/fonts/${FONTE}`, dados: new Uint8Array(R.fonte) });
    if (R.ofl) arquivos.push({ nome: `${nome}/fonts/OFL-SpaceGrotesk.txt`, dados: R.ofl });
    return { nome, blob: A.exportar.zip(arquivos) };
  }

  // --- lugares: nomes, chave e busca pelo nome digitado ------------------------------------------------------------------------
  const chaveLug = (x) => `${x.tipo}|${x.uf || ""}|${x.cod || ""}`;
  function nomeLug(x) { const T = X(); return x.tipo === "br" ? T.sb_br : x.tipo === "uf" ? A.ufNome(x.uf) : `${x.nome || x.cod} (${x.uf})`; }
  let LISTA_LUG = null;
  async function listaLugares() {
    if (LISTA_LUG) return LISTA_LUG;
    const T = X(), muns = await A.municipios(), l = [{ rot: T.sb_br, ref: { tipo: "br" } }];
    Object.keys(window.UF_NOMES).filter((u) => u !== "ZZ").sort().forEach((u) => l.push({ rot: `${A.ufNome(u)} (${T.sb_estado})`, ref: { tipo: "uf", uf: u } }));
    Object.entries(muns).forEach(([uf, ms]) => { if (uf === "ZZ") return; Object.entries(ms).forEach(([cod, v]) => { const nome = A.titulo(v[0]); l.push({ rot: `${nome} (${uf})`, ref: { tipo: "mun", uf, cod, nome } }); }); });
    // o motor da página também passa a conhecer os municípios (para achar "Londrina" escrito de outro jeito)
    try { window.MOTOR.configurar({ muns }); } catch (e) { /* sem motor */ }
    LISTA_LUG = l;
    return l;
  }
  function acharLugar(txt, lista) {
    const s = norm(txt); if (!s) return null;
    const exato = lista.find((x) => norm(x.rot) === s);
    if (exato) return exato.ref;
    try {
      const r = (window.MOTOR.lugares(txt) || []).find((x) => (x.tipo === "mun" && x.cod) || x.tipo === "uf" || x.tipo === "br");
      if (r) return r.tipo === "mun" ? { tipo: "mun", uf: r.uf, cod: r.cod, nome: r.nome } : r.tipo === "uf" ? { tipo: "uf", uf: r.uf } : { tipo: "br" };
    } catch (e) { /* motor ainda não carregou */ }
    const ini = lista.filter((x) => norm(x.rot).startsWith(s));
    return ini.length === 1 ? ini[0].ref : null;
  }

  // --- janela "Criar site" -----------------------------------------------------------------------------------------------------
  // o: { itens: [{ d, p, on }], atual, lugares: [ref], pedido: { tipo, lugares, texto } }
  function abrir(o) {
    const T = X(), itens = o.itens || [], temResp = itens.length > 0, ped = o.pedido || {};
    let tipo = TIPOS.some((x) => x[0] === ped.tipo) ? ped.tipo : temResp ? "relatorio" : "painel";
    if (grupo(tipo) === "r" && !temResp) tipo = "painel";
    const vistos = new Set(), pedidos = !!(ped.lugares && ped.lugares.length);
    // os da conversa vêm do mais recente para o mais antigo: os 5 últimos, na ordem em que foram perguntados
    const cit = (pedidos ? ped.lugares : (o.lugares || []).slice(0, 5).reverse())
      .filter((x) => x && ((x.tipo === "mun" && x.cod && x.uf !== "ZZ") || (x.tipo === "uf" && x.uf !== "ZZ") || x.tipo === "br"))
      .map((x) => (x.tipo === "mun" ? { tipo: "mun", uf: x.uf, cod: x.cod, nome: x.nome } : x.tipo === "uf" ? { tipo: "uf", uf: x.uf } : { tipo: "br" }))
      .filter((x) => { const k = chaveLug(x); if (vistos.has(k)) return false; vistos.add(k); return true; });
    const S = { tipo, estilo: "padrao", lugs: cit.slice(0, 5), esc: "ufs", uf: "PR", editado: false, ultimo: null, cfg: null };
    const l0 = cit.find((x) => x.tipo !== "br");
    if (l0) { S.esc = "muns"; S.uf = l0.uf; }
    const pt = norm(ped.texto || "");
    if (/\b(?:estados|states|ufs)\b/.test(pt)) S.esc = "ufs";
    else if (/\b(?:municipios|cidades|municipalities|cities|ciudades)\b/.test(pt) && /\b(?:brasil|brazil|pais|country|todo|todos|all)\b/.test(pt) && !l0) S.esc = "br";

    const tipoCard = ([k, ic, g]) => { const off = g === "r" && !temResp; return `<label class="sb-tipo${off ? " off" : ""}"><input type="radio" name="sb-tipo" value="${k}"${k === S.tipo ? " checked" : ""}${off ? " disabled" : ""}>${icone(ic)}<span><b>${esc(T.sb_tipos[k][0])}</b><small>${esc(T.sb_tipos[k][1])}</small></span></label>`; };
    const estiloCard = ([k, cs]) => `<label class="sb-est"><input type="radio" name="sb-est" value="${k}"${k === S.estilo ? " checked" : ""}><span class="sb-sw" aria-hidden="true">${cs.map((c) => `<i style="background:${c}"></i>`).join("")}</span><span><b>${esc(T.sb_estilos[k][0])}</b><small>${esc(T.sb_estilos[k][1])}</small></span></label>`;
    const fmt = (k, ic) => `<button type="button" class="ex-f" data-st-fmt="${k}">${icone(ic)}<span><b>${esc(T["st_" + k][0])}</b><small>${esc(T["st_" + k][1])}</small></span></button>`;
    const ufsOpt = Object.keys(window.UF_NOMES).filter((u) => u !== "ZZ").sort().map((u) => `<option value="${u}"${u === S.uf ? " selected" : ""}>${u} – ${esc(A.ufNome(u))}</option>`).join("");
    const lista = itens.map((x, i) => `<li class="st-it" data-i="${i}"><input type="checkbox" class="st-on"${x.on ? " checked" : ""} aria-label="${esc(x.p.titulo)}">
        <div class="st-txt"><input type="text" class="st-tit" maxlength="90" value="${esc(x.p.titulo)}" aria-label="${esc(T.st_tit(i + 1))}">
        <small>${esc(curtoTxt(x.p.resumo, 120))}</small>${x.d._m.q ? `<small class="st-q">${esc(T.st_q)}: ${esc(curtoTxt(x.d._m.q, 80))}</small>` : ""}</div>
        <span class="st-ord"><button type="button" class="icon-btn" data-st="sobe" aria-label="${esc(T.st_subir)}" title="${esc(T.st_subir)}">${icone("up")}</button><button type="button" class="icon-btn st-desce" data-st="desce" aria-label="${esc(T.st_descer)}" title="${esc(T.st_descer)}">${icone("up")}</button></span></li>`).join("");
    const dlg = A.ferramentas.janela(T.st_title, `<p class="small muted">${esc(T.sb_lead)}</p>
      <fieldset class="sb-fs"><legend>${esc(T.sb_tipo)}</legend>
        <p class="sb-g">${esc(T.sb_g_resp)}</p><div class="sb-grade">${TIPOS.filter((x) => x[2] === "r").map(tipoCard).join("")}</div>${temResp ? "" : `<p class="small muted sb-aviso">${esc(T.sb_sem_resp)}</p>`}
        <p class="sb-g">${esc(T.sb_g_dados)}</p><div class="sb-grade">${TIPOS.filter((x) => x[2] === "d").map(tipoCard).join("")}</div>
      </fieldset>
      <div class="sb-parte" data-sb="r"><p class="small muted">${esc(T.st_lead)}</p>
        <div class="st-topo"><span class="small st-conta" aria-live="polite"></span><span><button type="button" class="btn btn-sm" data-st="todas">${esc(T.st_marcar)}</button> <button type="button" class="btn btn-sm" data-st="nenhuma">${esc(T.st_desmarcar)}</button></span></div>
        <ol class="st-lista">${lista}</ol></div>
      <div class="sb-parte" data-sb="lug" hidden><p class="sb-g">${esc(T.sb_lug_t)}</p><ul class="sb-chips" aria-live="polite"></ul>
        <label class="st-nome"><span>${esc(T.sb_lug_add)}</span><span class="sb-add"><input type="text" class="sb-lug-in" list="sb-dl" placeholder="${esc(T.sb_lug_ph)}" autocomplete="off"><button type="button" class="btn btn-sm" data-sb="add">${icone("plus")} ${esc(T.sb_add)}</button></span></label>
        <datalist id="sb-dl"></datalist></div>
      <div class="sb-parte sb-esc" data-sb="esc" hidden>
        <label class="st-nome"><span>${esc(T.sb_esc_t)}</span><select name="sb-esc">${["ufs", "muns", "br"].map((k) => `<option value="${k}"${k === S.esc ? " selected" : ""}>${esc(T.sb_esc[k])}</option>`).join("")}</select></label>
        <label class="st-nome sb-uf"><span>${esc(T.sb_uf)}</span><select name="sb-uf">${ufsOpt}</select></label></div>
      <label class="st-nome"><span>${esc(T.st_nome)}</span><input type="text" name="sb-titulo" maxlength="90"></label>
      <fieldset class="sb-fs"><legend>${esc(T.sb_estilo)}</legend><div class="sb-ests">${ESTILOS.map(estiloCard).join("")}</div></fieldset>
      <p class="sb-g">${esc(T.sb_fmt)}</p>
      <div class="ex-grid st-fmts">${fmt("html", "globe")}${fmt("zip", "download")}</div>
      <p class="small ex-st" aria-live="polite"></p>
      <section class="sb-pub" hidden></section>`, "dlg-ex dlg-site");

    const q = (s) => dlg.querySelector(s), st = q(".ex-st"), inTit = q('[name="sb-titulo"]'), selEsc = q('[name="sb-esc"]'), selUf = q('[name="sb-uf"]');
    const lis = () => $$(".st-it", dlg);
    const escNome = () => (S.esc === "muns" ? A.ufNome(S.uf) : T.sb_br);
    const tituloPadrao = () => (grupo(S.tipo) === "r" ? T.st_nome_def : T.sb_tit(S.tipo, S.esc, S.tipo === "comparativo" ? S.lugs.map((x) => (x.tipo === "mun" ? x.nome || x.cod : nomeLug(x))).join(" × ") || "…" : escNome()));
    const contar = () => { if (!temResp) return; const n = lis().filter((li) => li.querySelector(".st-on").checked).length; q(".st-conta").textContent = T.st_conta(n, itens.length); lis().forEach((li) => li.classList.toggle("off", !li.querySelector(".st-on").checked)); };
    function chips() {
      q(".sb-chips").innerHTML = S.lugs.length ? S.lugs.map((x, i) => `<li><span>${esc(nomeLug(x))}</span><button type="button" class="icon-btn" data-sb-rm="${i}" aria-label="${esc(T.sb_lug_rm(nomeLug(x)))}" title="${esc(T.sb_lug_rm(nomeLug(x)))}">${icone("close")}</button></li>`).join("")
        : `<li class="sb-vazio">${esc(T.sb_lug_min)}</li>`;
    }
    function mostrar() {
      const g = grupo(S.tipo);
      q('[data-sb="r"]').hidden = g !== "r";
      q('[data-sb="lug"]').hidden = S.tipo !== "comparativo";
      q('[data-sb="esc"]').hidden = g !== "d" || S.tipo === "comparativo";
      selEsc.querySelector('[value="br"]').hidden = S.tipo !== "ranking";
      selEsc.querySelector('[value="br"]').disabled = S.tipo !== "ranking";
      if (S.esc === "br" && S.tipo !== "ranking") { S.esc = "muns"; selEsc.value = "muns"; }
      q(".sb-uf").hidden = S.esc !== "muns";
      if (!S.editado) inTit.value = tituloPadrao();
      $$(".sb-tipo", dlg).forEach((l) => l.classList.toggle("on", l.querySelector("input").checked));
      $$(".sb-est", dlg).forEach((l) => l.classList.toggle("on", l.querySelector("input").checked));
      chips();
    }
    contar(); mostrar();
    // a lista de lugares (5.570 municípios) entra no campo de busca só quando a pessoa vai usar
    let lugaresProntos = null;
    const carregarLugares = () => (lugaresProntos = lugaresProntos || listaLugares().then((l) => { q("#sb-dl").innerHTML = l.map((x) => `<option value="${esc(x.rot)}">`).join(""); return l; }));
    if (S.tipo === "comparativo") carregarLugares();
    async function adicionar() {
      const inp = q(".sb-lug-in"), v = inp.value.trim(); if (!v) return;
      const ref = acharLugar(v, await carregarLugares());
      if (!ref) { st.textContent = T.sb_lug_nao; return; }
      if (S.lugs.some((x) => chaveLug(x) === chaveLug(ref))) { inp.value = ""; return; }
      if (S.lugs.length >= 5) { st.textContent = T.sb_lug_max; return; }
      S.lugs.push(ref); inp.value = ""; st.textContent = ""; mostrar();
    }
    dlg.addEventListener("change", (e) => {
      const el = e.target;
      if (el.matches(".st-on")) contar();
      else if (el.name === "sb-tipo") { S.tipo = el.value; if (S.tipo === "comparativo") carregarLugares(); mostrar(); }
      else if (el.name === "sb-est") { S.estilo = el.value; mostrar(); }
      else if (el.name === "sb-esc") { S.esc = el.value; mostrar(); }
      else if (el.name === "sb-uf") { S.uf = el.value; mostrar(); }
      else if (el.matches(".sb-lug-in") && el.value.trim()) adicionar();
    });
    inTit.addEventListener("input", () => { S.editado = !!inTit.value.trim(); });
    q(".sb-lug-in").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } });
    q(".sb-lug-in").addEventListener("focus", carregarLugares);
    const cfgAtual = () => ({ tipo: S.tipo, estilo: S.estilo, lang: A.state.lang, titulo: (inTit.value.trim() || tituloPadrao()).slice(0, 90), lugs: S.lugs.slice(), esc: S.esc, uf: S.uf,
      partes: grupo(S.tipo) === "r" ? lis().filter((li) => li.querySelector(".st-on").checked).map((li) => { const x = itens[+li.dataset.i]; return Object.assign({}, x.p, { titulo: li.querySelector(".st-tit").value.trim() || x.p.titulo, texto: corrido(x.p.el) }); }) : null });
    dlg.addEventListener("click", async (e) => {
      const rm = e.target.closest("[data-sb-rm]");
      if (rm) { S.lugs.splice(+rm.dataset.sbRm, 1); mostrar(); return; }
      if (e.target.closest('[data-sb="add"]')) { adicionar(); return; }
      const b = e.target.closest("[data-st], [data-st-fmt]"); if (!b || b.disabled) return;
      const k = b.dataset.st;
      if (k === "todas" || k === "nenhuma") { lis().forEach((li) => { li.querySelector(".st-on").checked = k === "todas"; }); contar(); return; }
      if (k === "sobe" || k === "desce") {
        const li = b.closest(".st-it"), viz = k === "sobe" ? li.previousElementSibling : li.nextElementSibling;
        if (viz) { if (k === "sobe") viz.before(li); else viz.after(li); b.focus(); }
        return;
      }
      const c = cfgAtual();
      if (c.partes && !c.partes.length) { st.textContent = T.st_pick; return; }
      if (c.tipo === "comparativo" && c.lugs.length < 2) { st.textContent = T.sb_lug_min; q(".sb-lug-in").focus(); return; }
      const zipar = b.dataset.stFmt === "zip";
      $$("[data-st-fmt]", dlg).forEach((x) => { x.disabled = true; });
      b.classList.add("on"); st.textContent = grupo(c.tipo) === "d" ? T.sb_carregando : T.st_wait;
      try {
        const r = await montar(c, zipar);
        if (zipar) A.exportar.baixar(`${r.nome}.zip`, r.blob); else A.exportar.baixar(`${r.nome}.html`, r.html, "text/html;charset=utf-8");
        S.cfg = c; S.ultimo = zipar ? null : r.html;
        st.textContent = T.st_done("." + b.dataset.stFmt);
        publicacao(dlg, S);
      } catch (err) { console.error(err); st.textContent = `${T.st_err} (${err.message})`; }
      finally { $$("[data-st-fmt]", dlg).forEach((x) => { x.disabled = false; }); b.classList.remove("on"); }
    });
    return dlg;
  }
  const curtoTxt = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };
  const corrido = (el) => { const c = el.cloneNode(true); c.querySelectorAll("p, div, dt, dd, li, h4, td, th, figcaption, .bar-label, .bar-value").forEach((x) => x.append(" ")); return c.textContent.replace(/\s+/g, " ").trim(); };

  // --- colocar no ar: GitHub Pages ---------------------------------------------------------------------------------------------
  const GH_USER = "atlas_gh_usuario";
  const RE_USER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
  const slugRepo = (s) => (nz(s).slice(0, 60).replace(/-+$/, "") || "site-atlas");
  const b64Texto = (s) => base64(new TextEncoder().encode(s).buffer);
  const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
  function publicacao(dlg, S) {
    const T = X(), sec = dlg.querySelector(".sb-pub"), primeira = sec.hidden;
    sec.hidden = false;
    // já montada (outro download na mesma janela): só acompanha o novo título, se a pessoa não mudou o nome
    if (sec._atualizar) { const r = sec.querySelector('[name="pb-repo"]'); if (!r.dataset.editado) r.value = slugRepo(S.cfg.titulo); sec._atualizar(); return; }
    // o HTML de um arquivo só é o que vai para o GitHub (também quando a pessoa baixou o .zip)
    const htmlPub = async () => { if (!S.ultimo) S.ultimo = (await montar(S.cfg, false)).html; return S.ultimo; };
    const user0 = A.ler(GH_USER) || "";
    const passo = (n, k, botao) => `<li><span class="sb-pn" aria-hidden="true">${n}</span><div><b>${esc(T[k][0])}</b><small>${esc(T[k][1])}</small>${botao || ""}</div></li>`;
    const ghBt = (k, ic) => `<a class="btn btn-sm" data-pb="${k}" href="#" target="_blank" rel="noopener">${icone(ic)} ${esc(T.pb_gh)}</a>`;
    sec.innerHTML = `<h3>${icone("upload")} ${esc(T.pb_t)}</h3><p class="small muted">${esc(T.pb_lead)}</p>
      <label class="st-nome"><span>${esc(T.pb_repo)}</span><input type="text" name="pb-repo" maxlength="80" value="${esc(slugRepo(S.cfg.titulo))}" autocapitalize="off" autocomplete="off" spellcheck="false"></label>
      <label class="sb-chk"><input type="checkbox" name="pb-raiz"><span><b>${esc(T.pb_raiz)}</b><small>${esc(T.pb_raiz_nota)}</small></span></label>
      <div class="sb-tabs" role="tablist">${["a", "b"].map((k, i) => `<button type="button" role="tab" class="sb-tab" id="sb-tab-${k}" data-pb-tab="${k}" aria-selected="${!i}" aria-controls="sb-tp-${k}"><b>${esc(T["pb_" + k][0])}</b><small>${esc(T["pb_" + k][1])}</small></button>`).join("")}</div>
      <div class="sb-tabp" id="sb-tp-a" role="tabpanel" aria-labelledby="sb-tab-a">
        <p class="small">${esc(T.pb_conta)} <a href="https://github.com/signup" target="_blank" rel="noopener">${esc(T.pb_conta_bt)}</a></p>
        <label class="st-nome"><span>${esc(T.pb_user)}</span><input type="text" name="pb-user" value="${esc(user0)}" placeholder="${esc(T.pb_user_ph)}" autocapitalize="off" autocomplete="username" spellcheck="false"><small class="muted">${esc(T.pb_user_nota)}</small></label>
        <ol class="sb-passos">${passo(1, "pb_p1", ghBt("novo", "plus"))}${passo(2, "pb_p2", `<button type="button" class="btn btn-sm" data-pb="baixar">${icone("download")} index.html</button>`)}${passo(3, "pb_p3", ghBt("enviar", "upload"))}
          <li data-pb-li="pages"><span class="sb-pn" aria-hidden="true">4</span><div><b>${esc(T.pb_p4[0])}</b><small>${esc(T.pb_p4[1])}</small>${ghBt("pages", "globe")}</div></li>
          <li><span class="sb-pn" aria-hidden="true">${icone("check")}</span><div><b>${esc(T.pb_p5[0])}</b><small>${esc(T.pb_p5[1])}</small><code class="sb-url" data-pb="url"></code><span class="sb-acts"><button type="button" class="btn btn-sm" data-pb="copiar">${icone("copy")} ${esc(T.pb_copiar)}</button><a class="btn btn-sm" data-pb="abrir" href="#" target="_blank" rel="noopener">${icone("globe")} ${esc(T.pb_abrir)}</a></span></div></li></ol>
        <p class="small ex-st" data-pb="msg" aria-live="polite"></p></div>
      <div class="sb-tabp" id="sb-tp-b" role="tabpanel" aria-labelledby="sb-tab-b" hidden>
        <ol class="sb-passos">${passo(1, "pb_b1", `<a class="btn btn-sm" href="${esc(urlChave())}" target="_blank" rel="noopener">${icone("plug")} ${esc(T.pb_gh)}</a>`)}
          ${passo(2, "pb_b2", `<input type="password" class="sb-chave" name="pb-chave" autocomplete="off" spellcheck="false" placeholder="github_pat_…" aria-label="${esc(T.pb_b2[0])}">`)}
          ${passo(3, "pb_b3", `<button type="button" class="btn btn-sm sb-pub-bt" data-pb="publicar">${icone("upload")} ${esc(T.pb_publicar)}</button>`)}</ol>
        <ul class="sb-prog" aria-live="polite"></ul><div class="sb-res" aria-live="polite"></div>
        <p class="small muted">${esc(T.pb_chave_nota)}</p></div>`;
    const q = (s) => sec.querySelector(s), msg = q('[data-pb="msg"]');
    const user = () => q('[name="pb-user"]').value.trim().replace(/^@/, "").replace(/^https?:\/\/github\.com\//i, "").replace(/\/.*$/, "");
    const raiz = () => q('[name="pb-raiz"]').checked;
    const repo = (u) => (raiz() ? `${u}.github.io` : (q('[name="pb-repo"]').value.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "") || "site-atlas"));
    const urlSite = (u, r) => (raiz() ? `https://${u.toLowerCase()}.github.io/` : `https://${u.toLowerCase()}.github.io/${r}/`);
    function atualizarA() {
      const u = user(), ok = RE_USER.test(u), r = repo(u || "usuario");
      const lk = { novo: `https://github.com/new?name=${encodeURIComponent(r)}&description=${encodeURIComponent(T.pb_desc)}&visibility=public`,
        enviar: ok ? `https://github.com/${u}/${r}/upload/main` : "#", pages: ok ? `https://github.com/${u}/${r}/settings/pages` : "#", abrir: ok ? urlSite(u, r) : "#" };
      Object.entries(lk).forEach(([k, v]) => { q(`[data-pb="${k}"]`).href = v; });
      q('[data-pb="url"]').textContent = urlSite(ok ? u : T.pb_user_x, r);
      q('[data-pb-li="pages"]').hidden = raiz();
      if (ok) { try { localStorage.setItem(GH_USER, u); } catch (e) { /* sem armazenamento */ } }
    }
    atualizarA();
    sec._atualizar = atualizarA;
    sec.addEventListener("input", (e) => { if (e.target.name === "pb-repo") e.target.dataset.editado = "1"; if (e.target.name === "pb-user" || e.target.name === "pb-repo") atualizarA(); });
    sec.addEventListener("change", (e) => { if (e.target.name === "pb-raiz") atualizarA(); });
    sec.addEventListener("click", async (e) => {
      const tab = e.target.closest("[data-pb-tab]");
      if (tab) { const k = tab.dataset.pbTab; $$("[data-pb-tab]", sec).forEach((x) => x.setAttribute("aria-selected", x === tab)); q("#sb-tp-a").hidden = k !== "a"; q("#sb-tp-b").hidden = k !== "b"; return; }
      const b = e.target.closest("[data-pb]"); if (!b) return;
      const k = b.dataset.pb, u = user();
      if ((k === "enviar" || k === "pages" || k === "abrir") && !RE_USER.test(u)) { e.preventDefault(); msg.textContent = T.pb_falta_user; q('[name="pb-user"]').focus(); return; }
      if (k === "baixar") { A.exportar.baixar("index.html", await htmlPub(), "text/html;charset=utf-8"); msg.textContent = T.pb_baixado; }
      else if (k === "copiar") { if (!RE_USER.test(u)) { msg.textContent = T.pb_falta_user; return; } const ok = await copiarTexto(urlSite(u, repo(u))); msg.textContent = ok ? T.pb_copiado : urlSite(u, repo(u)); }
      else if (k === "publicar") publicarAuto(sec, S, htmlPub, { repo, raiz, urlSite });
      else if (k === "forcar") publicarAuto(sec, S, htmlPub, { repo, raiz, urlSite }, true);
    });
    if (primeira) sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function copiarTexto(s) { try { await navigator.clipboard.writeText(s); return true; } catch (e) { return false; } }
  function urlChave() {
    const T = X(), d = new Date(), p = (n) => String(n).padStart(2, "0");
    const nome = `Atlas site ${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}h${p(d.getMinutes())}`;
    return `https://github.com/settings/personal-access-tokens/new?name=${encodeURIComponent(nome)}&description=${encodeURIComponent(T.pb_desc)}&expires_in=1&administration=write&contents=write&pages=write`;
  }
  // Uma chamada à API do GitHub com a chave da pessoa (a chave só vai para api.github.com)
  async function gh(chave, metodo, caminho, corpo) {
    let r;
    try {
      r = await fetch("https://api.github.com" + caminho, { method: metodo, cache: "no-store", body: corpo ? JSON.stringify(corpo) : undefined,
        headers: Object.assign({ Accept: "application/vnd.github+json", Authorization: `Bearer ${chave}` }, corpo ? { "Content-Type": "application/json" } : {}) });
    } catch (e) { const er = new Error(X().pb_rede); er.rede = true; throw er; }
    let j = null; try { j = await r.json(); } catch (e) { j = null; }
    return { ok: r.ok, s: r.status, j: j || {} };
  }
  // B) automático: confere a chave, cria o repositório, envia o site, liga o GitHub Pages e espera ficar no ar
  async function publicarAuto(sec, S, htmlPub, f, forcar) {
    const T = X(), q = (s) => sec.querySelector(s), prog = q(".sb-prog"), res = q(".sb-res"), bt = q('[data-pb="publicar"]'), inChave = q('[name="pb-chave"]');
    const chave = inChave.value.trim();
    if (!chave) { res.innerHTML = `<p class="small">${esc(T.pb_sem_chave)}</p>`; inChave.focus(); return; }
    bt.disabled = true; res.innerHTML = ""; prog.innerHTML = "";
    const etapa = (k) => { const li = document.createElement("li"); li.className = "sb-et"; li.innerHTML = `<span class="sb-et-i" aria-hidden="true">…</span><span>${esc(T.pb_et[k])}</span>`; prog.append(li); return { ok: () => { li.classList.add("ok"); li.firstChild.innerHTML = icone("check"); }, falha: () => { li.classList.add("erro"); li.firstChild.textContent = "✕"; } }; };
    const erro = (txt, extra) => { res.innerHTML = `<p class="small sb-erro">${esc(txt)}</p>${extra || ""}`; };
    let e1;
    try {
      e1 = etapa("conta");
      const eu = await gh(chave, "GET", "/user");
      if (!eu.ok) { e1.falha(); return erro(eu.s === 401 ? T.pb_e401 : T.pb_erro(eu.j.message || eu.s)); }
      e1.ok();
      const dono = eu.j.login, nomeRepo = f.raiz() ? `${dono}.github.io` : f.repo(dono), url = f.urlSite(dono, nomeRepo);
      e1 = etapa("repo");
      let ramo = "main";
      const cr = await gh(chave, "POST", "/user/repos", { name: nomeRepo, description: T.pb_desc, homepage: url, has_issues: false, has_wiki: false, has_projects: false, auto_init: false });
      if (cr.ok) ramo = cr.j.default_branch || "main";
      else if (cr.s === 422) {
        const ex = await gh(chave, "GET", `/repos/${dono}/${nomeRepo}`);
        if (!ex.ok) { e1.falha(); return erro(T.pb_erro(cr.j.message || cr.s)); }
        if (!forcar) { e1.falha(); return erro(T.pb_existe(nomeRepo), `<p class="sb-acts"><button type="button" class="btn btn-sm" data-pb="forcar">${icone("upload")} ${esc(T.pb_atualizar)}</button></p>`); }
        ramo = ex.j.default_branch || "main";
      } else { e1.falha(); return erro(cr.s === 401 ? T.pb_e401 : cr.s === 403 || cr.s === 404 ? T.pb_e403 : T.pb_erro(cr.j.message || cr.s)); }
      e1.ok();
      e1 = etapa("envio");
      const arquivos = [["index.html", await htmlPub()], ["README.md", T.pb_readme(S.cfg.titulo, url)], [".nojekyll", ""]];
      for (const [caminho, texto] of arquivos) {
        const atual = await gh(chave, "GET", `/repos/${dono}/${nomeRepo}/contents/${caminho}`);
        const pu = await gh(chave, "PUT", `/repos/${dono}/${nomeRepo}/contents/${caminho}`, Object.assign({ message: T.pb_commit, content: b64Texto(texto) }, atual.ok && atual.j.sha ? { sha: atual.j.sha } : {}));
        if (!pu.ok) { e1.falha(); return erro(pu.s === 403 || pu.s === 404 ? T.pb_e403 : T.pb_erro(pu.j.message || pu.s)); }
      }
      e1.ok();
      e1 = etapa("pages");
      let pg = await gh(chave, "POST", `/repos/${dono}/${nomeRepo}/pages`, { source: { branch: ramo, path: "/" } });
      if (!pg.ok && pg.s !== 409) { await espera(2500); pg = await gh(chave, "POST", `/repos/${dono}/${nomeRepo}/pages`, { source: { branch: ramo, path: "/" } }); }
      const ligado = pg.ok || pg.s === 409 || (await gh(chave, "GET", `/repos/${dono}/${nomeRepo}/pages`)).ok;
      if (!ligado) {
        e1.falha();
        return erro(T.pb_e_pages, `<p class="sb-acts"><a class="btn btn-sm" href="https://github.com/${esc(dono)}/${esc(nomeRepo)}/settings/pages" target="_blank" rel="noopener">${icone("globe")} ${esc(T.pb_gh)}</a></p>` + pronto(url, true));
      }
      e1.ok();
      e1 = etapa("espera");
      let feito = false;
      for (let i = 0; i < 40 && !feito; i++) {
        await espera(i ? 4000 : 2500);
        const s = await gh(chave, "GET", `/repos/${dono}/${nomeRepo}/pages`);
        if (s.ok && s.j.status === "built") feito = true;
        else if (s.ok && s.j.status === "errored") break;
      }
      if (feito) e1.ok(); else e1.falha();
      inChave.value = "";
      res.innerHTML = pronto(url, !feito);
    } catch (err) {
      console.error(err);
      if (e1) e1.falha();
      erro(err.rede ? T.pb_rede : T.pb_erro(err.message));
    } finally { bt.disabled = false; }
  }
  function pronto(url, demora) {
    const T = X();
    return `<div class="sb-ok"><p><b>${esc(demora ? T.pb_demora : T.pb_no_ar)}</b></p><code class="sb-url">${esc(url)}</code>
      <p class="sb-acts"><a class="btn btn-sm" href="${esc(url)}" target="_blank" rel="noopener">${icone("globe")} ${esc(T.pb_abrir)}</a><button type="button" class="btn btn-sm" data-copiar-url="${esc(url)}">${icone("copy")} ${esc(T.pb_copiar)}</button></p>
      <p class="small muted">${esc(T.pb_apagar)} <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener">github.com/settings/personal-access-tokens</a></p></div>`;
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copiar-url]"); if (!b) return;
    const ok = await copiarTexto(b.dataset.copiarUrl);
    b.lastChild.textContent = " " + (ok ? X().pb_copiado : b.dataset.copiarUrl);
  });

  A.sites = { abrir, montar, TIPOS };
  window.ATLAS_SITES = A.sites;
})();
