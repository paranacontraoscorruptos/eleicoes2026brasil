/* Sites do Atlas: um site estático completo, feito neste aparelho e baixado pronto (index.html, um arquivo só, ou .zip).
   Tem o Início e as 8 partes, trocadas pelo menu: com as respostas da conversa, relatório, várias páginas, apresentação e
   perguntas e respostas (as respostas vão uma vez só no arquivo); com os dados do Brasil, dos estados e de todos os municípios,
   comparativo, ranking, painel e mapa clicável. Tem compartilhar, imprimir/PDF, baixar os dados (CSV), PT/EN/ES, tema claro/escuro,
   três estilos e funciona sem internet. Depois de baixar, o Atlas ajuda a pôr o site no ar no GitHub Pages: passo a passo com as
   telas já preenchidas (A) ou automático, com uma chave do GitHub que não fica guardada (B). Só carrega quando a pessoa abre "Criar site". */
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
.gs-card[hidden],.gs-q[hidden],.gs-pg[hidden],.gs-slide[hidden],.gs-nada[hidden],.gs-v[hidden]{display:none}
.gs-hv{padding:30px 0 22px}
.gs-hv h1{font-size:clamp(1.6rem,4.4vw,2.5rem);margin:0 0 10px}
.gs-hv .gs-resumo{margin-top:16px}
.gs-secoes{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.gs-sc{display:grid;grid-template-columns:40px minmax(0,1fr);column-gap:12px;row-gap:2px;align-items:start}
.gs-sc-i{grid-row:span 2;display:inline-flex;width:40px;height:40px;border-radius:12px;align-items:center;justify-content:center;background:var(--accent-soft);color:var(--accent)}
.gs-sc-i svg{width:20px;height:20px}
.gs-sec,.gs-q{scroll-margin-top:124px}
.gd-chips{list-style:none;margin:0 0 18px;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.gd-chips li{display:inline-flex;align-items:center;gap:2px;min-height:34px;padding:2px 4px 2px 12px;border:1px solid var(--accent);border-radius:999px;background:var(--accent-soft);font-size:.88rem}
.gd-chips li:not(:has(button)){padding-right:12px}
.gd-x{display:inline-flex;width:28px;height:28px;padding:0;border:0;border-radius:50%;align-items:center;justify-content:center;background:transparent;color:var(--ink-2);cursor:pointer}
.gd-x:hover,.gd-x:focus-visible{background:var(--surface-2);color:var(--ink)}
.gd-x svg{width:14px;height:14px}
.gd-links{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}
.gd-links .btn svg{width:16px;height:16px}
.gd-rank tbody th a{color:inherit;text-decoration:none}
.gd-rank tbody th a:hover,.gd-rank tbody th a:focus-visible{color:var(--accent);text-decoration:underline}
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
body[data-v="apresentacao"] .gs-top{position:relative}
body[data-v="apresentacao"] .gs-rod{padding-bottom:90px}
.gs-deck{position:relative;display:grid;min-height:calc(100vh - 112px);min-height:calc(100dvh - 112px);outline:none}
.gs-slide{display:grid;align-content:center;padding:26px 16px 96px;animation:gsin .35s ease-out}
.gs-slide-in{width:100%;max-width:980px;margin:0 auto;max-height:calc(100vh - 240px);max-height:calc(100dvh - 240px);overflow:auto}
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
@media print{.gs-top{position:static}.gs-secoes,.gd-links,.gd-chips .gd-x{display:none!important}.gs-nav,.gs-ferr,.gs-subir,.gs-ctrl,.gs-prog,.gd-ctl,.gs-busca,.gs-ferr2,.gs-pager,.gd-nav,.gs-cont{display:none!important}.gs-pg[hidden],.gs-slide[hidden],.gs-q[hidden]{display:block!important}.gs-slide{break-after:page;min-height:0;padding:12px 0;animation:none}.gs-slide-in{max-height:none;overflow:visible}.gs-deck{display:block;min-height:0}.gd-tabela .table-wrap{max-height:none}.gd-rank tbody th{position:static}}`;
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
      cada("[data-t]", function (el) { el.textContent = GS.t(el.getAttribute("data-t"), { d: GS.quando(), n: el.getAttribute("data-n") }); });
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
  }

  // o site: Início e as partes, trocadas pelo endereço (#/ranking, #/paginas/2, #/apresentacao/3…)
  // as respostas existem uma vez só no arquivo e vão para a parte aberta (relatório, páginas, apresentação ou perguntas)
  function rtSite() {
    var d = document, GS = window.GS, V = {}, atual = null, ultimo = ["inicio", ""];
    Array.prototype.forEach.call(d.querySelectorAll(".gs-v"), function (v) { V[v.getAttribute("data-v")] = v; });
    var nav = [].slice.call(d.querySelectorAll(".gs-nav a[data-v]")), partes = [].slice.call(d.querySelectorAll(".gs-parte"));
    var H = GS.vistas = GS.vistas || {};
    function focar(el) { if (!el) return; if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); }
    GS.titular = function (s) { d.title = (s ? s + " · " : "") + GS.cfg.titulo; };
    // endereço que não é de uma parte (#conteudo, do "pular para o conteúdo") não troca a parte aberta
    function rota() {
      var m = location.hash.match(/^#\/([a-z]*)\/?(.*)$/);
      if (!m) return atual ? ultimo : ["inicio", ""];
      return V[m[1]] ? [m[1], decodeURIComponent(m[2] || "")] : ["inicio", ""];
    }
    // idioma: só traduz o que está aberto, sem rolar a página
    function mudar(idioma) {
      var r = rota(), v = r[0], nova = v !== atual, primeira = atual === null;
      ultimo = r;
      if (nova) {
        for (var k in V) V[k].hidden = k !== v;
        d.body.setAttribute("data-v", v);
        partes.forEach(function (p, i) { var sl = V[v].querySelector('.gs-slot[data-i="' + i + '"]'); if (sl && p.parentNode !== sl) sl.appendChild(p); });
        var at = null;
        nav.forEach(function (a) { if (a.getAttribute("data-v") === v) { a.setAttribute("aria-current", "page"); at = a; } else a.removeAttribute("aria-current"); });
        if (at) at.parentNode.scrollLeft = at.offsetLeft - at.parentNode.clientWidth / 2 + at.offsetWidth / 2;
        window.GS_CSV = null; atual = GS.atual = v;
        if (!primeira) { window.scrollTo(0, 0); focar(V[v].querySelector("h1")); }
      }
      GS.titular(v === "inicio" ? "" : GS.t("v_" + v));
      if (H[v]) H[v](r[1], nova, idioma);
    }
    // o mesmo link de novo (sem mudar o endereço) também leva ao lugar
    d.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#/"]');
      if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); mudar(); }
    });

    H.inicio = function () { if (!partes.length && GS.csvTodos) window.GS_CSV = GS.csvTodos; };

    // relatório: todas as respostas numa página; #/relatorio/3 rola até a terceira
    H.relatorio = function (s, nova, idioma) {
      var el = !idioma && +s && d.getElementById("rel-" + +s);
      if (el) { el.scrollIntoView(); focar(el.querySelector("h2")); }
    };

    // várias páginas: capa com busca e uma página por resposta (#/paginas/2)
    var pgs = V.paginas ? [].slice.call(V.paginas.querySelectorAll(".gs-pg")) : [], pgN = -1;
    H.paginas = function (s, nova) {
      var n = +s || 0; if (!pgs[n]) n = 0;
      if (n !== pgN || nova) {
        pgs.forEach(function (p, i) { p.hidden = i !== n; });
        if (!nova) window.scrollTo(0, 0);
        if (n) focar(pgs[n].querySelector("h2"));
        pgN = n;
      }
      if (n) GS.titular(pgs[n].getAttribute("data-tit"));
    };
    function buscar(raiz, itens, txt) {
      var q = raiz.querySelector(".gs-busca input"), nada = raiz.querySelector(".gs-nada"), cont = raiz.querySelector(".gs-cont");
      q.addEventListener("input", function () {
        var s = GS.norm(q.value), k = 0, ultimoOk = null;
        itens.forEach(function (x, i) { var ok = !s || txt[i].indexOf(s) >= 0; x.hidden = !ok; if (ok) { k++; ultimoOk = x; } });
        if (k === 1 && s && ultimoOk.tagName === "DETAILS") ultimoOk.open = true;
        nada.hidden = k > 0; cont.textContent = s ? GS.t("res", { n: k, t: itens.length }) : "";
      });
    }
    if (V.paginas) { var cards = [].slice.call(V.paginas.querySelectorAll(".gs-capa .gs-card")); buscar(V.paginas, cards, cards.map(function (c) { return c.getAttribute("data-busca"); })); }

    // apresentação: uma tela por vez; setas, toque, teclado e tela cheia
    var S = V.apresentacao ? [].slice.call(V.apresentacao.querySelectorAll(".gs-slide")) : [], si = 0;
    function ir(n) {
      si = Math.max(0, Math.min(S.length - 1, n));
      S.forEach(function (s, k) { s.hidden = k !== si; });
      V.apresentacao.querySelector(".gs-ctrl .gs-cont").textContent = GS.t("slide", { n: si + 1, t: S.length });
      V.apresentacao.querySelector(".gs-prog i").style.width = ((si + 1) / S.length) * 100 + "%";
      var h = "#/apresentacao/" + (si + 1);
      if (location.hash !== h && history.replaceState) history.replaceState(null, "", h);
      var dentro = S[si].querySelector(".gs-slide-in"); if (dentro) dentro.scrollTop = 0;
    }
    H.apresentacao = function (s) { ir((+s || 1) - 1); };
    if (S.length) {
      var deck = V.apresentacao.querySelector(".gs-deck");
      var cheia = function () { if (d.fullscreenElement) d.exitFullscreen(); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(function () { /* sem tela cheia */ }); };
      V.apresentacao.addEventListener("click", function (e) {
        var b = e.target.closest("[data-gs]"); if (!b) return;
        var k = b.getAttribute("data-gs");
        if (k === "ant") ir(si - 1); else if (k === "prox") ir(si + 1); else if (k === "cheia") cheia();
      });
      d.addEventListener("keydown", function (e) {
        if (atual !== "apresentacao" || e.target.closest("input, select, textarea, dialog") || e.altKey || e.ctrlKey || e.metaKey) return;
        var k = e.key;
        if (k === " " && e.target.closest("button, a")) return;
        if (k === "ArrowRight" || k === "PageDown" || k === " ") { e.preventDefault(); ir(si + 1); }
        else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); ir(si - 1); }
        else if (k === "Home") ir(0); else if (k === "End") ir(S.length - 1);
      });
      var x0 = null, y0 = 0;
      deck.addEventListener("touchstart", function (e) { if (e.target.closest(".table-wrap, .map, table")) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      deck.addEventListener("touchend", function (e) {
        if (x0 == null) return;
        var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) ir(si + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }

    // perguntas e respostas: busca, abrir e fechar todas; #/perguntas/3 abre a terceira
    var qs = V.perguntas ? [].slice.call(V.perguntas.querySelectorAll(".gs-q")) : [];
    H.perguntas = function (s, nova, idioma) {
      var x = !idioma && qs[+s - 1];
      if (x) { x.open = true; x.scrollIntoView(); focar(x.querySelector("summary")); }
    };
    if (qs.length) {
      buscar(V.perguntas, qs, qs.map(function (x, i) { return GS.norm(x.querySelector("summary").textContent + " " + (partes[i] ? partes[i].textContent : "")); }));
      V.perguntas.addEventListener("click", function (e) {
        var b = e.target.closest("[data-gs='abrir'], [data-gs='fechar']"); if (!b) return;
        var ab = b.getAttribute("data-gs") === "abrir";
        qs.forEach(function (x) { if (!x.hidden) x.open = ab; });
      });
      // na impressão saem todas abertas
      var antes = null;
      addEventListener("beforeprint", function () { antes = qs.map(function (x) { return x.open; }); qs.forEach(function (x) { x.open = true; }); });
      addEventListener("afterprint", function () { if (antes) qs.forEach(function (x, i) { x.open = antes[i]; }); antes = null; });
    }

    addEventListener("hashchange", function () { mudar(); });
    GS.ouvir.push(function () { mudar(true); });
    mudar();
  }

  // comparativo, ranking, painel e mapa: os números do Brasil, dos estados e de todos os municípios vêm dentro do arquivo (#gs-dados)
  function rtDados() {
    var d = document, GS = window.GS, E = GS.esc, I = GS.cfg.ico, D = JSON.parse(d.getElementById("gs-dados").textContent), ini = D.ini || {};
    var st = { n: 2, ord: "aptos", dir: -1, busca: "", nivel: ini.nivel || (ini.uf ? "mun" : "uf"), uf: ini.uf || "", lim: 50, sel: ini.sel || ini.uf || "BR",
      med: "compP", mapa: ini.uf && D.mapas.uf[ini.uf] ? ini.uf : "BR", msel: ini.sel || null, cmp: (ini.cmp || []).slice() };
    var POR = {}, DE_UF = {}, R = {};
    [D.br].concat(D.ufs, D.mun).forEach(function (u) { POR[u.k] = u; });
    D.mun.forEach(function (u) { (DE_UF[u.u] = DE_UF[u.u] || []).push(u); });
    ["comparativo", "ranking", "painel", "mapa"].forEach(function (k) { R[k] = d.getElementById("gd-" + k); });
    function ufNome(uf) { var x = D.ufn[uf]; return x ? x[GS.lang] || x.PT : uf; }
    function nome(u) { return u.tp === "uf" ? ufNome(u.u) : u.tp === "br" ? GS.t("brasil") : u.n; }
    function rot(u) { return u.tp === "mun" ? u.n + " (" + u.u + ")" : nome(u); }
    function sub(u) { return u.tp === "mun" ? ufNome(u.u) : GS.t(u.tp === "uf" ? "estado" : "pais"); }
    function ref(u) { return u.tp === "mun" ? POR[u.u] : u.tp === "uf" ? D.br : null; }
    function grupoDe(u) { return u.tp === "mun" ? DE_UF[u.u] || [u] : u.tp === "uf" ? D.ufs : [u]; }
    function ordenar(l) { return l.slice().sort(function (a, b) { return rot(a).localeCompare(rot(b), GS.loc()); }); }
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
    function seg(nome_, attr, ops, atual) {
      return '<div class="gd-seg" role="group" aria-label="' + E(nome_) + '">' + ops.map(function (o) {
        return '<button type="button" ' + attr + '="' + o[0] + '" aria-pressed="' + (String(atual) === String(o[0])) + '">' + E(o[1]) + "</button>";
      }).join("") + "</div>";
    }
    function ctlTurno() { return seg(GS.t("turno_t"), "data-n", [[2, GS.t("turno", { n: 2 })], [1, GS.t("turno", { n: 1 })]], st.n); }
    function nota() { return '<p class="small muted gd-nota">' + E(GS.t("anom_nota")) + "</p>"; }
    function opcao(v, txt, on) { return '<option value="' + E(v) + '"' + (on ? " selected" : "") + ">" + E(txt) + "</option>"; }
    function rotulo(txt, campo, cls) { return '<label class="gd-f' + (cls ? " " + cls : "") + '"><span>' + E(txt) + "</span>" + campo + "</label>"; }
    function refocar(r, sel) { var el = r.querySelector(sel); if (el) el.focus({ preventScroll: true }); }
    function link(h, txt, ic) { return '<a class="btn btn-sm" href="' + E(h) + '">' + (ic ? I[ic] + " " : "") + E(txt) + "</a>"; }
    function marcar(v, s) { var h = "#/" + v + (s ? "/" + s : ""); if (GS.atual === v && location.hash !== h && history.replaceState) history.replaceState(null, "", h); }
    function achar(txt, l) {
      var s = GS.norm(txt); if (!s) return null;
      var f = function (g) { return l.filter(function (o) { return g(GS.norm(rot(o))); })[0]; };
      return f(function (x) { return x === s; }) || l.filter(function (o) { return GS.norm(nome(o)) === s; })[0] || f(function (x) { return x.indexOf(s) === 0; }) || null;
    }
    // lista para achar um lugar digitando (5 mil municípios): montada só quando precisa, no idioma aberto
    function lista(id, l) {
      var dl = d.getElementById(id);
      if (!dl) { dl = d.createElement("datalist"); dl.id = id; d.body.appendChild(dl); }
      var marca = GS.lang + ":" + l.length + ":" + (l[0] && l[0].k);
      if (dl.getAttribute("data-m") !== marca) { dl.innerHTML = l.map(function (u) { return '<option value="' + E(rot(u)) + '">'; }).join(""); dl.setAttribute("data-m", marca); }
    }

    // --- comparativo: os lugares lado a lado; dá para pôr e tirar lugares ---
    function cmpMontar() {
      var r = R.comparativo;
      st.cmp = st.cmp.filter(function (k, i, l) { return POR[k] && l.indexOf(k) === i; }).slice(0, 6);
      var us = st.cmp.map(function (k) { return POR[k]; }), n = st.n, top = principais(n, n === 1 ? 3 : 2);
      lista("gd-dl", [D.br].concat(ordenar(D.ufs), ordenar(D.mun)));
      r.innerHTML = '<div class="gd-ctl">' + ctlTurno()
        + '<label class="gd-busca"><span class="gd-f">' + E(GS.t("cmp_add")) + '</span><input type="search" list="gd-dl" data-gd="por" placeholder="' + E(GS.t("achar_ph")) + '"' + (us.length >= 6 ? " disabled" : "") + "></label></div>"
        + '<ul class="gd-chips">' + us.map(function (u) {
          var tx = GS.t("tirar", { x: rot(u) });
          return "<li><span>" + E(rot(u)) + "</span>" + (us.length > 2 ? '<button type="button" class="gd-x" data-gd="tirar" data-k="' + E(u.k) + '" aria-label="' + E(tx) + '" title="' + E(tx) + '">' + I.close + "</button>" : "") + "</li>";
        }).join("") + '</ul><div class="gd-res"></div>' + nota();
      var Ms = ["aptos", "comp", "compP", "abst", "brancos", "nulos"].concat(top.map(function (c) { return "c:" + c[0]; })).concat(["secoes", "anom", "anomP"]).map(med);
      var graf = ["compP", "abst", "brancos", "nulos"].concat(top.slice(0, 2).map(function (c) { return "c:" + c[0]; })).concat(["anomP"]).map(med);
      r.querySelector(".gd-res").innerHTML = '<div class="gd-cards">' + us.map(function (u) {
        return '<article class="card gd-card"><h3>' + E(nome(u)) + '</h3><p class="small muted">' + E(sub(u)) + '</p><dl class="kv">' + ["aptos", "compP", "abst", "anomP"].map(function (k) { return kvi(med(k), u); }).join("") + "</dl></article>";
      }).join("") + "</div>"
        + "<h2>" + E(GS.t("lado")) + '</h2><div class="table-wrap"><table class="num-cols"><thead><tr><th scope="col">' + E(GS.t("medida")) + "</th>" + us.map(function (u) { return '<th scope="col">' + E(nome(u)) + "</th>"; }).join("") + "</tr></thead><tbody>"
        + Ms.map(function (M) { return '<tr><th scope="row">' + E(M.nome) + "</th>" + us.map(function (u) { return "<td" + (M.dica && M.val(u) != null ? ' data-tip="' + E(dicaDe(M, u)) + '"' : "") + ">" + E(fv(M, u)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>"
        + "<h2>" + E(GS.t("graficos")) + '</h2><div class="gd-grafs">' + graf.map(function (M) {
          return '<section class="card"><h3>' + E(M.nome) + "</h3>" + barras(us.map(function (u) { return { rot: nome(u), v: M.val(u), txt: fv(M, u), dica: dicaDe(M, u) }; })) + "</section>";
        }).join("") + "</div>"
        + "<h2>" + E(GS.t("candidatos")) + '</h2><div class="gd-grafs">' + us.map(function (u) { return '<section class="card"><h3>' + E(nome(u)) + "</h3>" + barrasCands(u) + "</section>"; }).join("") + "</div>";
      window.GS_CSV = function () { return [[GS.t("medida")].concat(us.map(rot))].concat(Ms.map(function (M) { return [cabCsv(M)].concat(us.map(function (u) { return csvv(M, u); })); })); };
      marcar("comparativo", st.cmp.join(","));
    }

    // --- ranking: estados ou municípios (todos ou de um estado) ---
    function colsRank() { return ["secoes", "aptos", "compP", "abst", "brancos", "nulos"].concat(principais(st.n, 2).map(function (c) { return "c:" + c[0]; })).concat(["anom", "anomP"]); }
    function rankLista() { return st.nivel === "uf" ? D.ufs : st.uf ? DE_UF[st.uf] || [] : D.mun; }
    function rankMontar() {
      var r = R.ranking;
      r.innerHTML = '<div class="gd-ctl">' + ctlTurno() + seg(GS.t("nivel"), "data-nivel", [["uf", GS.t("estados")], ["mun", GS.t("municipios")]], st.nivel)
        + (st.nivel === "mun" ? rotulo(GS.t("uf"), '<select data-gd="uf">' + opcao("", GS.t("todos"), !st.uf) + ordenar(D.ufs).map(function (u) { return opcao(u.u, u.u + " – " + nome(u), st.uf === u.u); }).join("") + "</select>") : "")
        + '<label class="gd-busca"><span class="gd-f">' + E(GS.t("buscar")) + '</span><input type="search" data-gd="busca" placeholder="' + E(GS.t("busca_nome")) + '" value="' + E(st.busca) + '"></label>'
        + rotulo(GS.t("mostrar"), '<select data-gd="lim">' + [25, 50, 100, 0].map(function (x) { return opcao(x, x ? GS.nf(x) : GS.t("todos"), st.lim === x); }).join("") + "</select>") + "</div>"
        + '<p class="small muted gd-resumo" aria-live="polite"></p><div class="table-wrap"></div><p class="gd-mais"></p>' + nota();
      rankTabela();
    }
    function rankTabela() {
      var r = R.ranking, cols = colsRank(); if (cols.indexOf(st.ord) < 0) { st.ord = "aptos"; st.dir = -1; }
      var Ms = {}; cols.forEach(function (k) { Ms[k] = med(k); });
      var s = GS.norm(st.busca), Mo = Ms[st.ord], comUf = st.nivel === "mun";
      var l = rankLista().filter(function (u) { return !s || GS.norm(rot(u)).indexOf(s) >= 0; }).map(function (u) { return { u: u, v: Mo.val(u) }; });
      l.sort(function (a, b) { if (a.v == null && b.v == null) return 0; if (a.v == null) return 1; if (b.v == null) return -1; return (st.dir < 0 ? b.v - a.v : a.v - b.v) || rot(a.u).localeCompare(rot(b.u)); });
      var max = Math.max.apply(null, l.map(function (x) { return Math.abs(x.v || 0); }).concat([1e-9])), vis = st.lim ? l.slice(0, st.lim) : l;
      r.querySelector(".table-wrap").innerHTML = '<table class="num-cols gd-rank"><thead><tr><th scope="col">#</th><th scope="col">' + E(GS.t("lugar")) + "</th>" + cols.map(function (k) {
        var on = k === st.ord;
        return '<th scope="col" aria-sort="' + (on ? (st.dir < 0 ? "descending" : "ascending") : "none") + '"><button type="button" data-ord="' + k + '" data-tip="' + E(Ms[k].nome) + '">' + E(Ms[k].curto) + (on ? (st.dir < 0 ? " ↓" : " ↑") : "") + "</button></th>";
      }).join("") + "</tr></thead><tbody>" + (vis.length ? vis.map(function (x, i) {
        return "<tr><td>" + GS.nf(i + 1) + '</td><th scope="row"><a href="#/painel/' + E(x.u.k) + '" title="' + E(GS.t("no_painel")) + '">' + E(rot(x.u)) + "</a></th>" + cols.map(function (k) {
          var M = Ms[k], v = M.val(x.u);
          return "<td" + (v != null && M.dica ? ' data-tip="' + E(dicaDe(M, x.u)) + '"' : "") + ">" + E(v == null ? "–" : M.txt(v)) + (k === st.ord && v != null ? '<span class="gd-mb" style="--f:' + (Math.abs(v) / max).toFixed(4) + '"></span>' : "") + "</td>";
        }).join("") + "</tr>";
      }).join("") : '<tr><td colspan="' + (cols.length + 2) + '">' + E(GS.t("nenhum")) + "</td></tr>") + "</tbody></table>";
      r.querySelector(".gd-resumo").textContent = GS.t("r_resumo", { n: GS.nf(l.length), m: Mo.nome, o: GS.t(st.dir < 0 ? "maior" : "menor") });
      var falta = l.length - vis.length;
      r.querySelector(".gd-mais").innerHTML = falta > 0 ? '<button type="button" class="btn btn-sm" data-gd="mais">' + E(GS.t("ver_mais", { n: GS.nf(Math.min(50, falta)) })) + "</button>" : "";
      window.GS_CSV = function () {
        return [["#", GS.t("lugar")].concat(comUf ? [GS.t("uf")] : []).concat(cols.map(function (k) { return cabCsv(Ms[k]); }))]
          .concat(l.map(function (x, i) { return [i + 1, nome(x.u)].concat(comUf ? [x.u.u] : []).concat(cols.map(function (k) { return csvv(Ms[k], x.u); })); }));
      };
    }

    // --- painel: um lugar (Brasil, estado ou município) e os números dele ---
    function painelMontar() {
      var r = R.painel, u = POR[st.sel] || D.br, uf = u.tp === "br" ? "" : u.u;
      st.sel = u.k;
      r.innerHTML = '<div class="gd-ctl">' + ctlTurno()
        + rotulo(GS.t("estado_l"), '<select data-gd="p-uf">' + opcao("BR", GS.t("brasil"), !uf) + ordenar(D.ufs).map(function (x) { return opcao(x.u, nome(x), x.u === uf); }).join("") + "</select>", "gd-lugar")
        + (uf ? rotulo(GS.t("municipio"), '<select data-gd="p-mun">' + opcao(uf, GS.t("todo_estado"), u.tp === "uf") + ordenar(DE_UF[uf] || []).map(function (x) { return opcao(x.k, x.n, x.k === u.k); }).join("") + "</select>", "gd-lugar") : "")
        + (grupoDe(u).length > 1 ? '<span class="gd-nav"><button type="button" class="gs-bt" data-gd="ant" aria-label="' + E(GS.t("ant_l")) + '" title="' + E(GS.t("ant_l")) + '">' + I.back + '</button><button type="button" class="gs-bt gs-prx" data-gd="prox" aria-label="' + E(GS.t("prox_l")) + '" title="' + E(GS.t("prox_l")) + '">' + I.back + "</button></span>" : "")
        + '</div><div class="gd-res"></div>' + nota();
      painelAtualizar();
    }
    function painelAtualizar() {
      var r = R.painel, u = POR[st.sel], n = st.n, Rf = ref(u), G = grupoDe(u), top = principais(n, 2).map(function (c) { return "c:" + c[0]; });
      var tiles = [["aptos", "users"], ["compP", "vote"], ["abst", "users"], ["brancos", "file"], ["nulos", "file"], ["secoes", "grid"], ["anom", "flag"]];
      var cmp = ["compP", "abst", "brancos", "nulos"].concat(top);
      var pos = ["aptos", "compP", "abst", "brancos", "nulos"].concat(top).concat(["anomP"]);
      r.querySelector(".gd-res").innerHTML = '<h2 class="gd-nome">' + E(nome(u)) + '</h2><p class="small muted">' + E(sub(u)) + " · " + E(GS.t("turno", { n: n })) + "</p>"
        + '<p class="gd-links">' + link("#/mapa/" + (u.tp === "mun" ? u.u : "BR") + (u.tp === "br" ? "" : "/" + u.k), GS.t("no_mapa"), "map") + link("#/comparativo/" + u.k + (Rf ? "," + Rf.k : ""), GS.t("comparar"), "swap") + "</p>"
        + '<div class="tiles">' + tiles.map(function (x) {
          var M = med(x[0]);
          return '<div class="tile" tabindex="0" data-tip="' + E(dicaDe(M, u)) + '"><div class="tile-top">' + I[x[1]] + '</div><div class="tile-v">' + E(fv(M, u))
            + (x[0] === "anom" && M.val(u) != null ? " <small>" + E(GS.t("por_mil", { v: fv(med("anomP"), u) })) + "</small>" : "") + '</div><div class="tile-l">' + E(M.nome) + "</div></div>";
        }).join("") + "</div>"
        + '<section class="card"><h3>' + E(GS.t("candidatos")) + "</h3>" + barrasCands(u) + "</section>"
        + (Rf ? '<section class="card"><h3>' + E(GS.t("comparado", { r: nome(Rf) })) + '</h3><div class="gd-grafs gd-mini">' + cmp.map(function (k) {
          var M = med(k);
          return "<div><h4>" + E(M.nome) + "</h4>" + barras([{ rot: nome(u), v: M.val(u), txt: fv(M, u), dica: dicaDe(M, u) }, { rot: nome(Rf), v: M.val(Rf), txt: fv(M, Rf), dica: dicaDe(M, Rf), cls: "gd-ref" }]) + "</div>";
        }).join("") + "</div></section>" : "")
        + (G.length > 1 ? '<section class="card"><h3>' + E(GS.t(u.tp === "mun" ? "posicoes_m" : "posicoes", { n: GS.nf(G.length), uf: ufNome(u.u) })) + '</h3><ul class="gd-pos">' + pos.map(function (k) {
          var M = med(k), v = M.val(u); if (v == null) return "";
          var p = 1 + G.filter(function (o) { var w = M.val(o); return w != null && w > v; }).length;
          return "<li><span>" + E(M.nome) + "</span><b>" + E(GS.t("pos", { p: GS.nf(p), t: GS.nf(G.length) })) + "</b></li>";
        }).join("") + '</ul><p class="small muted">' + E(GS.t("pos_nota")) + "</p></section>" : "");
      var todas = ["aptos", "comp", "compP", "abst", "brancos", "nulos"].concat(principais(n, 99).map(function (c) { return "c:" + c[0]; })).concat(["secoes", "anom", "anomP"]).map(med);
      window.GS_CSV = function () { return [[GS.t("medida"), nome(u)].concat(Rf ? [nome(Rf)] : [])].concat(todas.map(function (M) { return [cabCsv(M), csvv(M, u)].concat(Rf ? [csvv(M, Rf)] : []); })); };
      if (GS.atual === "painel") GS.titular(GS.t("v_painel") + " · " + rot(u));
      marcar("painel", u.k);
    }
    function mover(passo) {
      var ord = ordenar(grupoDe(POR[st.sel])), i = ord.findIndex(function (u) { return u.k === st.sel; });
      st.sel = ord[(i + passo + ord.length) % ord.length].k;
      var s = R.painel.querySelector(st.sel.indexOf("-") > 0 ? '[data-gd="p-mun"]' : '[data-gd="p-uf"]'); if (s) s.value = st.sel;
      painelAtualizar();
    }

    // --- mapa: Brasil (estados) ou os municípios de um estado ---
    function classes(vals) {
      var pos = vals.filter(function (v) { return v > 0; }).sort(function (a, b) { return a - b; }), zero = vals.some(function (v) { return v <= 0; });
      if (!pos.length) return { cls: function () { return 0; }, faixas: [], zero: zero };
      var q = [0.25, 0.5, 0.75].map(function (p) { return pos[Math.min(pos.length - 1, Math.floor(p * pos.length))]; });
      var lim = q.filter(function (x, i) { return q.indexOf(x) === i && x < pos[pos.length - 1]; });
      var faixas = [], ini_ = pos[0];
      lim.forEach(function (x) { faixas.push([ini_, x]); ini_ = pos.filter(function (v) { return v > x; })[0]; });
      faixas.push([ini_, pos[pos.length - 1]]);
      return { cls: function (v) { return v <= 0 ? 0 : 1 + lim.filter(function (x) { return v > x; }).length; }, faixas: faixas, zero: zero };
    }
    function opsMapa() { return ["compP", "abst", "brancos", "nulos"].concat(principais(st.n, st.n === 1 ? 5 : 2).map(function (c) { return "c:" + c[0]; })).concat(["anomP"]); }
    function mapaUns() { return st.mapa === "BR" ? D.ufs : DE_UF[st.mapa] || []; }
    function chaveMapa(pk) { return st.mapa === "BR" ? pk : st.mapa + "-" + pk; }
    function noMapa(u) { return u && (st.mapa === "BR" ? u.tp === "uf" : u.tp === "mun" && u.u === st.mapa); }
    function mapaMontar() {
      var r = R.mapa, ops = opsMapa(); if (ops.indexOf(st.med) < 0) st.med = "compP";
      if (st.mapa !== "BR" && !D.mapas.uf[st.mapa]) st.mapa = "BR";
      if (st.msel && !noMapa(POR[st.msel])) st.msel = null;
      lista("gd-dlm", ordenar(mapaUns()));
      r.innerHTML = '<div class="gd-ctl">' + ctlTurno()
        + rotulo(GS.t("mapa_de"), '<select data-gd="m-niv">' + opcao("BR", GS.t("mapa_br"), st.mapa === "BR") + ordenar(D.ufs).filter(function (x) { return D.mapas.uf[x.u]; }).map(function (x) { return opcao(x.u, GS.t("mapa_uf", { uf: nome(x) }), st.mapa === x.u); }).join("") + "</select>")
        + rotulo(GS.t("medida"), '<select data-gd="med">' + ops.map(function (k) { return opcao(k, med(k).nome, k === st.med); }).join("") + "</select>")
        + '<label class="gd-busca"><span class="gd-f">' + E(GS.t("achar")) + '</span><input type="search" list="gd-dlm" data-gd="achar" placeholder="' + E(GS.t("achar_ph")) + '"></label></div>'
        + '<div class="map-wrap gd-mapa"><div class="map' + (st.mapa !== "BR" ? " map-uf" : "") + '"></div><div class="map-side"></div></div>'
        + '<details class="gd-tabela"><summary>' + E(GS.t("ver_tabela")) + '</summary><div class="table-wrap"></div></details>' + nota();
      mapaAtualizar();
    }
    function mapaAtualizar() {
      var r = R.mapa, M = med(st.med), vals = {}, l = [], us = mapaUns(), MP = st.mapa === "BR" ? D.mapas.br : D.mapas.uf[st.mapa], P = MP.p;
      us.forEach(function (u) { var v = M.val(u); vals[u.k] = v; if (v != null) l.push(v); });
      var C = classes(l), sel = st.msel;
      r.querySelector(".map").innerHTML = '<svg viewBox="0 0 ' + MP.vb[0] + " " + MP.vb[1] + '" role="group" aria-label="' + E(M.nome) + '">' + Object.keys(P).map(function (pk) {
        var k = chaveMapa(pk), u = POR[k]; if (!u) return "";
        var v = vals[k], tx = v == null ? "–" : M.txt(v);
        return '<a class="mp-uf q' + (v == null ? 0 : C.cls(v)) + (k === sel ? " mp-dest" : "") + '" data-k="' + E(k) + '" role="button" tabindex="0" aria-label="' + E(rot(u) + ": " + tx) + '" data-tip="' + E(dicaDe(M, u)) + '"><path d="' + P[pk] + '"/></a>';
      }).join("") + (sel && P[sel.replace(st.mapa + "-", "")] ? '<path class="mp-dest-c" d="' + P[sel.replace(st.mapa + "-", "")] + '"/>' : "") + "</svg>";
      var u = sel && POR[sel];
      r.querySelector(".map-side").innerHTML = '<p class="small"><b>' + E(M.nome) + " · " + E(GS.t("turno", { n: st.n })) + '</b></p><ul class="seq-leg">'
        + (C.zero ? '<li><span class="sw q0"></span>' + E(GS.t("zero")) + "</li>" : "")
        + C.faixas.map(function (f, i) { return '<li><span class="sw q' + (i + 1) + '"></span>' + E(f[0] === f[1] ? M.txt(f[0]) : M.txt(f[0]) + " – " + M.txt(f[1])) + "</li>"; }).join("")
        + '</ul><p class="small muted">' + E(GS.t("leg_nota")) + "</p>"
        + (u ? '<div class="card"><h3>' + E(rot(u)) + '</h3><dl class="kv">' + ["aptos", "compP", "abst", "brancos", "nulos", "anom"].map(function (k) { return kvi(med(k), u); }).join("") + "</dl>" + barrasCands(u)
          + '<p class="gd-links">' + (u.tp === "uf" && D.mapas.uf[u.u] ? '<button type="button" class="btn btn-sm" data-gd="m-abrir" data-uf="' + E(u.u) + '">' + I.map + " " + E(GS.t("ver_muns")) + "</button>" : "") + link("#/painel/" + u.k, GS.t("no_painel"), "grid") + "</p></div>"
          : st.mapa !== "BR" ? '<p class="small muted">' + E(GS.t("toque")) + '</p><p class="gd-links"><button type="button" class="btn btn-sm" data-gd="m-abrir" data-uf="BR">' + I.back + " " + E(GS.t("mapa_br")) + "</button></p>" : '<p class="small muted">' + E(GS.t("toque")) + "</p>");
      var ord = us.map(function (o) { return { u: o, v: vals[o.k] }; }).filter(function (x) { return x.v != null; }).sort(function (a, b) { return b.v - a.v; });
      r.querySelector(".gd-tabela .table-wrap").innerHTML = '<table class="num-cols"><thead><tr><th scope="col">#</th><th scope="col">' + E(GS.t("lugar")) + '</th><th scope="col">' + E(M.nome) + "</th></tr></thead><tbody>"
        + ord.map(function (x, i) { return "<tr><td>" + GS.nf(i + 1) + "</td><td>" + E(rot(x.u)) + "</td><td>" + E(M.txt(x.v)) + "</td></tr>"; }).join("") + "</tbody></table>";
      window.GS_CSV = function () { return [[GS.t("lugar"), GS.t("uf"), cabCsv(M)]].concat(ord.map(function (x) { return [nome(x.u), x.u.u, csvv(M, x.u)]; })); };
      marcar("mapa", st.mapa + (u ? "/" + u.k : ""));
    }

    // todos os lugares numa planilha só (o botão CSV no Início, quando o site não tem respostas)
    GS.csvTodos = function () {
      var n = st.n, Ms = ["aptos", "comp", "compP", "abst", "brancos", "nulos"].concat(principais(n, 99).map(function (c) { return "c:" + c[0]; })).concat(["secoes", "anom", "anomP"]).map(med);
      return [[GS.t("lugar"), GS.t("uf"), GS.t("nivel")].concat(Ms.map(cabCsv))].concat([D.br].concat(D.ufs, D.mun).map(function (u) {
        return [nome(u), u.u || "", GS.t(u.tp === "mun" ? "municipio" : u.tp === "uf" ? "estado" : "pais")].concat(Ms.map(function (M) { return csvv(M, u); }));
      }));
    };

    var MONTAR = { comparativo: cmpMontar, ranking: rankMontar, painel: painelMontar, mapa: mapaMontar };
    function montar(v) { MONTAR[v](); GS.animar(R[v]); }
    GS.vistas = GS.vistas || {};
    GS.vistas.comparativo = function (s) { var l = s ? s.split(",").filter(function (k) { return POR[k]; }) : []; if (l.length) st.cmp = l; montar("comparativo"); };
    GS.vistas.ranking = function () { montar("ranking"); };
    GS.vistas.painel = function (s) { if (POR[s]) st.sel = s; montar("painel"); };
    GS.vistas.mapa = function (s) {
      var p = s ? s.split("/") : [];
      if (p[0] && (p[0] === "BR" || D.mapas.uf[p[0]])) { st.mapa = p[0]; st.msel = POR[p[1]] ? p[1] : null; }
      montar("mapa");
    };
    Object.keys(R).forEach(function (v) {
      var r = R[v];
      r.addEventListener("click", function (e) {
        var b = e.target.closest("[data-n]");
        if (b) { st.n = +b.getAttribute("data-n"); montar(v); refocar(r, '[data-n="' + st.n + '"]'); return; }
        b = e.target.closest("[data-nivel]");
        if (b) { st.nivel = b.getAttribute("data-nivel"); st.lim = 50; montar(v); refocar(r, '[data-nivel="' + st.nivel + '"]'); return; }
        b = e.target.closest("[data-ord]");
        if (b) { var k = b.getAttribute("data-ord"); if (st.ord === k) st.dir = -st.dir; else { st.ord = k; st.dir = -1; } rankTabela(); refocar(r, '[data-ord="' + k + '"]'); return; }
        b = e.target.closest("[data-gd]");
        if (b) {
          var g = b.getAttribute("data-gd");
          if (g === "mais") { st.lim += 50; rankTabela(); }
          else if (g === "ant" || g === "prox") { mover(g === "prox" ? 1 : -1); GS.animar(r); }
          else if (g === "tirar") { st.cmp = st.cmp.filter(function (x) { return x !== b.getAttribute("data-k"); }); montar(v); refocar(r, '[data-gd="por"]'); }
          else if (g === "m-abrir") { st.mapa = b.getAttribute("data-uf"); st.msel = null; montar(v); refocar(r, '[data-gd="m-niv"]'); }
          return;
        }
        var a = e.target.closest(".mp-uf[data-k]");
        if (a) { st.msel = a.getAttribute("data-k"); mapaAtualizar(); GS.animar(r.querySelector(".map-side")); }
      });
      r.addEventListener("keydown", function (e) {
        var a = e.target.closest && e.target.closest(".mp-uf[data-k]");
        if (a && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); st.msel = a.getAttribute("data-k"); mapaAtualizar(); refocar(r, '.mp-uf[data-k="' + st.msel + '"]'); }
      });
      r.addEventListener("input", function (e) { if (e.target.getAttribute("data-gd") === "busca") { st.busca = e.target.value; rankTabela(); } });
      r.addEventListener("change", function (e) {
        var g = e.target.getAttribute("data-gd"), val = e.target.value, u;
        if (g === "uf") { st.uf = val; st.lim = 50; rankTabela(); }
        else if (g === "lim") { st.lim = +val; rankTabela(); }
        else if (g === "p-uf" || g === "p-mun") { st.sel = val; montar(v); refocar(r, '[data-gd="' + (g === "p-uf" && val !== "BR" ? "p-mun" : g) + '"]'); }
        else if (g === "m-niv") { st.mapa = val; st.msel = null; montar(v); refocar(r, '[data-gd="m-niv"]'); }
        else if (g === "med") { st.med = val; mapaAtualizar(); }
        else if (g === "achar") { u = achar(val, mapaUns()); e.target.value = ""; if (!u) { GS.aviso(GS.t("nenhum")); return; } st.msel = u.k; mapaAtualizar(); }
        else if (g === "por") {
          u = achar(val, [D.br].concat(D.ufs, D.mun)); e.target.value = "";
          if (!u) { GS.aviso(GS.t("nenhum")); return; }
          if (st.cmp.indexOf(u.k) < 0 && st.cmp.length < 6) st.cmp.push(u.k);
          montar(v); refocar(r, '[data-gd="por"]');
        }
      });
    });
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
  const ICOS = ["share", "print", "download", "chat", "send", "link", "close", "back", "users", "vote", "file", "grid", "flag", "map", "swap"];
  const RT = { base: rtBase, dados: rtDados, site: rtSite };
  const rtTexto = (nomes) => nomes.map((k) => `(${RT[k].toString()})();`).join("\n");

  // --- a página: cabeçalho com as ferramentas e o menu das partes, conteúdo e rodapé com o carimbo ------------------------------
  // o: { titulo, lang, estilo, quando, R, zipar, arq, nav, corpo, dados, feito, lead }
  function pagina(o) {
    const G = window.I18N[o.lang].at.gx, g = (k, p) => esc(preencher(G[k], p));
    const quandoTxt = new Intl.DateTimeFormat(HTML_LANG[o.lang], { dateStyle: "long", timeStyle: "short" }).format(o.quando);
    const marca = `<span class="at-marca" aria-hidden="true">${icone("globe")}</span>`;
    const bt = (k, ic, tk) => `<button type="button" class="gs-bt" data-gs="${k}" data-tl="${tk}" aria-label="${g(tk)}" title="${g(tk)}">${icone(ic)}<span data-t="${tk}">${g(tk)}</span></button>`;
    const cfg = { titulo: o.titulo, lang: o.lang, langs: LANGS, quando: o.quando.toISOString(), arq: o.arq,
      t: Object.fromEntries(LANGS.map((l) => [l, window.I18N[l].at.gx])), ico: Object.fromEntries(ICOS.map((k) => [k, icone(k)])) };
    const host = URL_SITE.replace(/^https:\/\/|\/$/g, "");
    const rodape = `<div class="gs-selo">${marca}<span><b data-t="por">${g("por")}</b><span data-t="${o.feito}">${g(o.feito, { d: quandoTxt })}</span></span></div>
<p data-t="fonte">${g("fonte")}</p><p data-t="badge">${g("badge")}</p>
<p><a href="${URL_SITE}" target="_blank" rel="noopener">${host}</a> · <a href="${URL_SITE}#/atlas" target="_blank" rel="noopener" data-t="atlas">${g("atlas")}</a></p>`;
    const corpo = typeof o.corpo === "function" ? o.corpo(rodape) : o.corpo;
    const scripts = [A.exportar.SCRIPT_DOC, rtTexto(["base", "dados", "site"])].join("\n");
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
<body class="doc-pagina gs" data-v="inicio">
<a class="skip" href="#conteudo" data-t="pular">${g("pular")}</a>
<header class="gs-top"><div class="gs-faixa"></div>
<div class="gs-wrap gs-barra"><a class="gs-marca" href="#/">${marca}<span><b>${esc(o.titulo)}</b><small data-t="marca">${g("marca")}</small></span></a>
<div class="gs-ferr"><label class="gs-lang"><span class="sr-only" data-t="idioma">${g("idioma")}</span><select>${LANGS.map((l) => `<option value="${l}"${l === o.lang ? " selected" : ""}>${l}</option>`).join("")}</select></label>${bt("share", "share", "comp")}${bt("print", "print", "imp")}${bt("csv", "download", "csv")}<button type="button" class="gs-bt gs-tema" data-tl="tema" aria-label="${g("tema")}" title="${g("tema")}"><span class="i-sol">${icone("sun")}</span><span class="i-lua">${icone("moon")}</span></button></div></div>
${o.nav || ""}
</header>
<main class="gs-main" id="conteudo">
${corpo}
</main>
<footer class="gs-rod"><div class="gs-wrap">
${rodape}
</div></footer>
<script type="application/json" id="gs-cfg">${json(cfg)}<\/script>
<script type="application/json" id="gs-dados">${json(o.dados)}<\/script>
${o.zipar ? `<script src="js/site.js"><\/script>` : `<script>${scripts}<\/script>`}
</body>
</html>
`;
    return { html, scripts };
  }

  // --- o conteúdo: Início e as partes do site (as 4 das respostas só quando há respostas) -----------------------------------------
  const partesSite = (temResp) => TIPOS.filter((x) => x[2] === "d" || temResp);
  const sub_ = (p) => (p.sub ? `<p>${esc(p.sub)}</p>` : "");
  const cabParte = (p, i) => `<header class="gs-cab"><span class="gs-n" aria-hidden="true">${num(i)}</span><div><h2>${esc(p.titulo)}</h2>${sub_(p)}</div></header>`;
  const cartoes = (partes, href, busca_) => partes.map((p, i) => `<a class="gs-card" href="${href(i)}"${busca_ ? ` data-busca="${esc(norm(`${p.titulo} ${p.sub || ""} ${p.texto || ""}`))}"` : ""}><span class="gs-n">${num(i)}</span><b>${esc(p.titulo)}</b>${p.sub ? `<span>${esc(p.sub)}</span>` : ""}${p.destaque ? `<strong>${esc(p.destaque[1])}</strong><small>${esc(p.destaque[0])}</small>` : p.resumo ? `<small>${esc(p.resumo)}</small>` : ""}</a>`).join("");
  const busca = (G) => `<label class="gs-busca">${icone("search")}<span class="sr-only" data-t="buscar">${esc(G.buscar)}</span><input type="search" data-tp="busca_ph" placeholder="${esc(G.busca_ph)}"></label><p class="gs-cont" aria-live="polite"></p>`;

  // o: { titulo, lang, partes, quandoTxt, lead }
  function corpoSite(o) {
    const G = window.I18N[o.lang].at.gx, P = o.partes, g = (k, p) => esc(preencher(G[k], p)), vs = partesSite(P.length > 0);
    const tx = (k, p) => `<span data-t="${k}"${p && p.n != null ? ` data-n="${p.n}"` : ""}>${g(k, p)}</span>`;
    const nPartes = P.length ? tx("partes", { n: P.length }) : "";
    const hv = (k, lead, extra) => `<div class="gs-hero gs-hv"><div class="gs-wrap"><p class="gs-kicker">${esc(o.titulo)}</p><h1 data-t="v_${k}">${g("v_" + k)}</h1><p class="gs-lead" data-t="${lead}">${g(lead)}</p>${extra || ""}</div></div>`;
    const slot = (i, dentro) => `<div class="gs-slot" data-i="${i}">${dentro || ""}</div>`;
    const V = {};
    V.inicio = `<div class="gs-hero" id="inicio"><div class="gs-wrap"><p class="gs-kicker" data-t="k_r">${g("k_r")}</p><h1>${esc(o.titulo)}</h1><p class="gs-lead" data-t="${o.lead}">${g(o.lead)}</p>
<p class="gs-meta">${esc(o.quandoTxt)}${P.length ? ` · ${nPartes}` : ""}</p><p class="doc-selo" data-t="badge">${g("badge")}</p>
<p class="gs-resumo-t" data-t="neste">${g("neste")}</p><div class="gs-secoes">${vs.map(([k, ic]) => `<a class="gs-card gs-sc" href="#/${k}"><span class="gs-sc-i" aria-hidden="true">${icone(ic)}</span><b data-t="v_${k}">${g("v_" + k)}</b><small data-t="dv_${k}">${g("dv_" + k)}</small></a>`).join("")}</div></div></div>`;
    if (P.length) {
      // as respostas vão uma vez só, dentro do relatório; as outras partes recebem o mesmo conteúdo quando abrem
      V.relatorio = hv("relatorio", "lead_rel", `<p class="gs-meta">${nPartes}</p>${P.length > 1 ? `<div class="gs-resumo">${cartoes(P, (i) => `#/relatorio/${i + 1}`)}</div>` : ""}`)
        + P.map((p, i) => `<section class="gs-sec" id="rel-${i + 1}"><div class="gs-wrap">${cabParte(p, i)}${slot(i, `<div class="doc-corpo gs-parte" data-i="${i}" data-parte="${esc(p.titulo)}">${p.el.innerHTML}</div>`)}<p class="gs-subir"><a href="#/relatorio">↑ ${tx("topo")}</a></p></div></section>`).join("\n");
      const pager = (i) => `<nav class="gs-pager">${i ? `<a href="#/paginas/${i}"><small data-t="ant">${g("ant")}</small>${esc(P[i - 1].titulo)}</a>` : `<a href="#/paginas"><small data-t="v_paginas">${g("v_paginas")}</small>${esc(o.titulo)}</a>`}${i < P.length - 1 ? `<a class="gs-px" href="#/paginas/${i + 2}"><small data-t="prox">${g("prox")}</small>${esc(P[i + 1].titulo)}</a>` : ""}</nav>`;
      V.paginas = `<section class="gs-pg gs-capa">${hv("paginas", "pag_lead", `${busca(G)}<div class="gs-resumo">${cartoes(P, (i) => `#/paginas/${i + 1}`, true)}</div><p class="gs-nada" hidden data-t="nada">${g("nada")}</p>`)}</section>
${P.map((p, i) => `<section class="gs-pg" hidden data-tit="${esc(p.titulo)}"><div class="gs-sec"><div class="gs-wrap">${cabParte(p, i)}${slot(i)}${pager(i)}</div></div></section>`).join("\n")}`;
      const ctl = `<div class="gs-ctrl"><button type="button" class="gs-bt" data-gs="ant" data-tl="ant_l" aria-label="${g("ant_l")}" title="${g("ant_l")}">${icone("back")}</button><span class="gs-cont" aria-live="polite"></span><button type="button" class="gs-bt gs-prx" data-gs="prox" data-tl="prox_l" aria-label="${g("prox_l")}" title="${g("prox_l")}">${icone("back")}</button><button type="button" class="gs-bt" data-gs="cheia" data-tl="tela" aria-label="${g("tela")}" title="${g("tela")}">${ICO_TELA}</button></div><div class="gs-prog" aria-hidden="true"><i></i></div>`;
      V.apresentacao = `<div class="gs-deck" aria-roledescription="carousel">
<section class="gs-slide gs-s-capa gs-hero" aria-roledescription="slide"><div class="gs-slide-in"><p class="gs-kicker" data-t="v_apresentacao">${g("v_apresentacao")}</p><h1>${esc(o.titulo)}</h1><p class="gs-lead" data-t="apr_lead">${g("apr_lead")}</p><p class="gs-meta">${esc(o.quandoTxt)} · ${nPartes}</p></div></section>
${P.map((p, i) => `<section class="gs-slide" hidden aria-roledescription="slide"><div class="gs-slide-in">${cabParte(p, i)}${slot(i)}</div></section>`).join("\n")}
<section class="gs-slide gs-s-fim" hidden aria-roledescription="slide"><div class="gs-slide-in"><p class="gs-kicker">${esc(o.titulo)}</p><h2 data-t="fim">${g("fim")}</h2><p class="gs-lead" data-t="badge">${g("badge")}</p><p class="gs-ferr2"><a class="btn" href="#/apresentacao/1" data-t="rever">${g("rever")}</a><a class="btn" href="#/" data-t="v_inicio">${g("v_inicio")}</a></p></div></section>
</div>${ctl}`;
      V.perguntas = hv("perguntas", "faq_lead", `${busca(G)}<div class="gs-ferr2"><button type="button" class="btn btn-sm" data-gs="abrir" data-t="abrir_todas">${g("abrir_todas")}</button><button type="button" class="btn btn-sm" data-gs="fechar" data-t="fechar_todas">${g("fechar_todas")}</button></div>`)
        + `<div class="gs-wrap"><div class="gs-faq">${P.map((p, i) => `<details class="gs-q" id="q-${i + 1}"><summary><span class="gs-n" aria-hidden="true">${num(i)}</span><span><b>${esc(p.titulo)}</b>${p.sub ? `<small>${esc(p.sub)}</small>` : ""}</span></summary>${slot(i)}</details>`).join("\n")}</div><p class="gs-nada" hidden data-t="nada">${g("nada")}</p></div>`;
    }
    ["comparativo", "ranking", "painel", "mapa"].forEach((k) => { V[k] = hv(k, `l_${k}`) + `<section class="gd"><div class="gs-wrap" id="gd-${k}"></div></section>`; });
    return {
      nav: `<nav class="gs-nav" data-tl="nav" aria-label="${g("nav")}"><div class="gs-wrap"><a href="#/" data-v="inicio" data-t="v_inicio">${g("v_inicio")}</a>${vs.map(([k]) => `<a href="#/${k}" data-v="${k}" data-t="v_${k}">${g("v_" + k)}</a>`).join("")}</div></nav>`,
      corpo: [["inicio"]].concat(vs).map(([k]) => `<section class="gs-v" data-v="${k}"${k === "inicio" ? "" : " hidden"}>\n${V[k]}\n</section>`).join("\n"),
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
  // o site leva o Brasil, os estados e todos os municípios, com os mapas: dá para ver qualquer lugar
  let BASE_DADOS = null;
  async function baseDados() {
    if (BASE_DADOS) return BASE_DADOS;
    const Q = A.consulta, dado = A.paginasExtra.dado;
    const [br, ufs, mun, mapaBr] = await Promise.all([Q.linhaLugar({ tipo: "br" }), Q.estados({}), Q.municipios(null, {}), dado("site/data/mapa.json")]);
    const lista = ufs.filter((r) => r.uf !== "ZZ").map(curto);
    const mapas = { br: { vb: mapaBr.vb, p: mapaBr.uf }, uf: {} };
    await Promise.all(lista.map((u) => dado(`site/data/mapas/${u.u}.json`).then((M) => { mapas.uf[u.u] = { vb: M.vb, p: M.m }; }, () => null)));
    BASE_DADOS = { br: curto(br), ufs: lista, mun: mun.filter((r) => r.uf !== "ZZ").map(curto), mapas, cands: candidatos(), ufn: ufNomes() };
    return BASE_DADOS;
  }
  // o que já vem escolhido no site: os lugares da conversa (ou do pedido)
  async function dadosSite(c) {
    const B = await baseDados(), tem = (k) => k === "BR" || B.ufs.some((u) => u.k === k) || B.mun.some((u) => u.k === k);
    const ks = c.lugs.map((x) => (x.tipo === "br" ? "BR" : x.tipo === "uf" ? x.uf : `${x.uf}-${x.cod}`)).filter(tem);
    const l0 = c.lugs.find((x) => x.tipo !== "br");
    const cmp = ks.slice(0, 5);
    if (cmp.length < 2 && l0 && l0.tipo === "mun" && !cmp.includes(l0.uf)) cmp.push(l0.uf);
    if (cmp.length < 2 && !cmp.includes("BR")) cmp.push("BR");
    if (cmp.length < 2) B.ufs.slice().sort((a, b) => ((b.t[2] || [0])[0] - (a.t[2] || [0])[0])).slice(0, 3).forEach((u) => cmp.push(u.k));
    const ini = { cmp, sel: ks.find((k) => k !== "BR") || null, uf: l0 ? l0.uf : "", nivel: c.nivel || (l0 ? "mun" : "uf") };
    return Object.assign({}, B, { ini });
  }

  // --- montar o site: { nome, html } (um arquivo, index.html) ou { nome, blob } (.zip) ---------------------------------------------
  // c: { titulo, estilo, lang, partes, lugs, nivel }
  async function montar(c, zipar) {
    const T = X(), R = await recursos(), quando = new Date();
    const nome = `${(nz(c.titulo) || "site-atlas").slice(0, 50)}-${quando.toISOString().slice(0, 10)}`;
    const D = await dadosSite(c);
    const quandoTxt = new Intl.DateTimeFormat(HTML_LANG[c.lang], { dateStyle: "long", timeStyle: "short" }).format(quando);
    const partes = (c.partes || []).map((p) => Object.assign({}, p, { texto: p.texto || "" }));
    const lead = partes.length ? "lead_s" : "lead_d";
    const r = corpoSite({ titulo: c.titulo, lang: c.lang, partes, quandoTxt, lead });
    const pg = pagina({ titulo: c.titulo, lang: c.lang, estilo: c.estilo, quando, R, zipar, arq: nome, dados: D, nav: r.nav, corpo: r.corpo, feito: partes.length ? "feito_s" : "feito_d", lead });
    if (!zipar) return { nome, html: pg.html };
    const arquivos = [
      { nome: `${nome}/index.html`, dados: pg.html },
      { nome: `${nome}/css/estilo.css`, dados: estiloCss(R, true) },
      { nome: `${nome}/js/site.js`, dados: `/* ${window.I18N[c.lang].at.gx.por} · ${URL_SITE} */\n${pg.scripts}\n` },
      { nome: `${nome}/README.md`, dados: T.gs_leia(c.titulo, new Intl.DateTimeFormat(HTML_LANG[c.lang], { dateStyle: "long" }).format(quando)) },
      { nome: `${nome}/dados/dados.json`, dados: JSON.stringify(D) },
    ];
    if (partes.length) arquivos.push({ nome: `${nome}/dados/respostas.json`, dados: JSON.stringify({ titulo: c.titulo, gerado: quando.toISOString(), por: "Atlas · Paraná Contra os Corruptos", site: URL_SITE, aviso: t().badge,
      partes: c.partes.map((p) => ({ titulo: p.titulo, sub: p.sub || "", blocos: A.exportar.modelo([p.el]).map((b) => (b.el ? Object.assign({}, b, { el: undefined }) : b)) })) }, null, 2) });
    if (R.favicon) arquivos.push({ nome: `${nome}/img/favicon.svg`, dados: R.favicon });
    if (R.fonte) arquivos.push({ nome: `${nome}/fonts/${FONTE}`, dados: new Uint8Array(R.fonte) });
    if (R.ofl) arquivos.push({ nome: `${nome}/fonts/OFL-SpaceGrotesk.txt`, dados: R.ofl });
    return { nome, blob: A.exportar.zip(arquivos) };
  }

  const chaveLug = (x) => `${x.tipo}|${x.uf || ""}|${x.cod || ""}`;

  function nomeLug(x) { const T = X(); return x.tipo === "br" ? T.sb_br : x.tipo === "uf" ? A.ufNome(x.uf) : `${x.nome || x.cod} (${x.uf})`; }

  // --- janela "Criar site" -----------------------------------------------------------------------------------------------------
  // O site já vem completo: Início e as 8 partes (as 4 com as respostas só quando há respostas). A pessoa escolhe as respostas,
  // o título e o estilo. Os lugares da conversa (ou do pedido) só deixam o comparativo, o painel e o mapa já abertos neles.
  // o: { itens: [{ d, p, on }], atual, lugares: [ref], pedido: { tipo, lugares, texto } }
  function abrir(o) {
    const T = X(), itens = o.itens || [], temResp = itens.length > 0, ped = o.pedido || {};
    const vistos = new Set(), pedidos = !!(ped.lugares && ped.lugares.length);
    // os da conversa vêm do mais recente para o mais antigo: os 5 últimos, na ordem em que foram perguntados
    const cit = (pedidos ? ped.lugares : (o.lugares || []).slice(0, 5).reverse())
      .filter((x) => x && ((x.tipo === "mun" && x.cod && x.uf !== "ZZ") || (x.tipo === "uf" && x.uf !== "ZZ") || x.tipo === "br"))
      .map((x) => (x.tipo === "mun" ? { tipo: "mun", uf: x.uf, cod: x.cod, nome: x.nome } : x.tipo === "uf" ? { tipo: "uf", uf: x.uf } : { tipo: "br" }))
      .filter((x) => { const k = chaveLug(x); if (vistos.has(k)) return false; vistos.add(k); return true; });
    const pt = norm(ped.texto || ""), l0 = cit.find((x) => x.tipo !== "br");
    const nivel = /\b(?:estados|states|ufs)\b/.test(pt) ? "uf" : /\b(?:municipios|cidades|municipalities|cities|ciudades)\b/.test(pt) ? "mun" : null;
    const S = { estilo: "padrao", lugs: cit.slice(0, 5), nivel, editado: false, ultimo: null, zip: false, cfg: null };

    const parteLi = ([k, ic, g]) => { const off = g === "r" && !temResp; return `<li${off ? ' class="off"' : ""}><span class="sb-inc-i" aria-hidden="true">${icone(ic)}</span><span><b>${esc(T.sb_tipos[k][0])}</b><small>${esc(T.sb_tipos[k][1])}</small></span></li>`; };
    const estiloCard = ([k, cs]) => `<label class="sb-est"><input type="radio" name="sb-est" value="${k}"${k === S.estilo ? " checked" : ""}><span class="sb-sw" aria-hidden="true">${cs.map((c) => `<i style="background:${c}"></i>`).join("")}</span><span><b>${esc(T.sb_estilos[k][0])}</b><small>${esc(T.sb_estilos[k][1])}</small></span></label>`;
    const fmt = (k, ic) => `<button type="button" class="ex-f" data-st-fmt="${k}">${icone(ic)}<span><b>${esc(T["st_" + k][0])}</b><small>${esc(T["st_" + k][1])}</small></span></button>`;
    const lista = itens.map((x, i) => `<li class="st-it" data-i="${i}"><input type="checkbox" class="st-on"${x.on ? " checked" : ""} aria-label="${esc(x.p.titulo)}">
        <div class="st-txt"><input type="text" class="st-tit" maxlength="90" value="${esc(x.p.titulo)}" aria-label="${esc(T.st_tit(i + 1))}">
        <small>${esc(curtoTxt(x.p.resumo, 120))}</small>${x.d._m.q ? `<small class="st-q">${esc(T.st_q)}: ${esc(curtoTxt(x.d._m.q, 80))}</small>` : ""}</div>
        <span class="st-ord"><button type="button" class="icon-btn" data-st="sobe" aria-label="${esc(T.st_subir)}" title="${esc(T.st_subir)}">${icone("up")}</button><button type="button" class="icon-btn st-desce" data-st="desce" aria-label="${esc(T.st_descer)}" title="${esc(T.st_descer)}">${icone("up")}</button></span></li>`).join("");
    const dlg = A.ferramentas.janela(T.st_title, `<p class="small muted">${esc(temResp ? T.sb_lead : T.sb_lead_d)}</p>
      <div class="sb-inc"><p class="sb-g">${esc(T.sb_inclui)}</p><ul class="sb-inc-l">${TIPOS.map(parteLi).join("")}</ul>${temResp ? "" : `<p class="small muted sb-aviso">${esc(T.sb_sem_resp)}</p>`}</div>
      ${temResp ? `<div class="sb-parte"><p class="sb-g">${esc(T.sb_resp_t)}</p><p class="small muted">${esc(T.st_lead)}</p>
        <div class="st-topo"><span class="small st-conta" aria-live="polite"></span><span><button type="button" class="btn btn-sm" data-st="todas">${esc(T.st_marcar)}</button> <button type="button" class="btn btn-sm" data-st="nenhuma">${esc(T.st_desmarcar)}</button></span></div>
        <ol class="st-lista">${lista}</ol></div>` : ""}
      <label class="st-nome"><span>${esc(T.st_nome)}</span><input type="text" name="sb-titulo" maxlength="90"></label>
      <fieldset class="sb-fs"><legend>${esc(T.sb_estilo)}</legend><div class="sb-ests">${ESTILOS.map(estiloCard).join("")}</div></fieldset>
      <p class="sb-g">${esc(T.sb_fmt)}</p>
      <div class="ex-grid st-fmts">${fmt("html", "globe")}${fmt("zip", "download")}</div>
      <p class="small ex-st" aria-live="polite"></p>
      <section class="sb-pub" hidden></section>`, "dlg-ex dlg-site");

    const q = (s) => dlg.querySelector(s), st = q(".ex-st"), inTit = q('[name="sb-titulo"]');
    const lis = () => $$(".st-it", dlg);
    const tituloPadrao = () => (temResp ? T.st_nome_def : T.sb_tit_def(l0 ? nomeLug(l0) : T.sb_br));
    const contar = () => { if (!temResp) return; const n = lis().filter((li) => li.querySelector(".st-on").checked).length; q(".st-conta").textContent = T.st_conta(n, itens.length); lis().forEach((li) => li.classList.toggle("off", !li.querySelector(".st-on").checked)); };
    const marcarEst = () => $$(".sb-est", dlg).forEach((l) => l.classList.toggle("on", l.querySelector("input").checked));
    inTit.value = tituloPadrao();
    contar(); marcarEst();
    dlg.addEventListener("change", (e) => {
      const el = e.target;
      if (el.matches(".st-on")) contar();
      else if (el.name === "sb-est") { S.estilo = el.value; marcarEst(); }
    });
    inTit.addEventListener("input", () => { S.editado = !!inTit.value.trim(); });
    const cfgAtual = () => ({ estilo: S.estilo, lang: A.state.lang, titulo: (inTit.value.trim() || tituloPadrao()).slice(0, 90), lugs: S.lugs.slice(), nivel: S.nivel,
      partes: temResp ? lis().filter((li) => li.querySelector(".st-on").checked).map((li) => { const x = itens[+li.dataset.i]; return Object.assign({}, x.p, { titulo: li.querySelector(".st-tit").value.trim() || x.p.titulo, texto: corrido(x.p.el) }); }) : [] });
    dlg.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-st], [data-st-fmt]"); if (!b || b.disabled) return;
      const k = b.dataset.st;
      if (k === "todas" || k === "nenhuma") { lis().forEach((li) => { li.querySelector(".st-on").checked = k === "todas"; }); contar(); return; }
      if (k === "sobe" || k === "desce") {
        const li = b.closest(".st-it"), viz = k === "sobe" ? li.previousElementSibling : li.nextElementSibling;
        if (viz) { if (k === "sobe") viz.before(li); else viz.after(li); b.focus(); }
        return;
      }
      const c = cfgAtual();
      if (temResp && !c.partes.length) { st.textContent = T.st_pick; return; }
      const zipar = b.dataset.stFmt === "zip";
      $$("[data-st-fmt]", dlg).forEach((x) => { x.disabled = true; });
      b.classList.add("on"); st.textContent = T.sb_carregando;
      try {
        const r = await montar(c, zipar);
        // o .html já sai com o nome que o GitHub Pages precisa: é só enviar, sem baixar de novo
        const arq = zipar ? `${r.nome}.zip` : "index.html";
        if (zipar) A.exportar.baixar(arq, r.blob); else A.exportar.baixar(arq, r.html, "text/html;charset=utf-8");
        S.cfg = c; S.ultimo = zipar ? null : r.html; S.zip = zipar; S.arq = arq;
        st.textContent = T.st_done(arq);
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
    // no automático, o HTML de um arquivo só é o que vai para o GitHub (também quando a pessoa baixou o .zip)
    const htmlPub = async () => { if (!S.ultimo) S.ultimo = (await montar(S.cfg, false)).html; return S.ultimo; };
    const user0 = A.ler(GH_USER) || "";
    const passo = (n, k, botao) => `<li><span class="sb-pn" aria-hidden="true">${n}</span><div><b>${esc(T[k][0])}</b><small>${rotulos(T[k][1])}</small>${botao || ""}</div></li>`;
    const ghBt = (k, ic) => `<a class="btn btn-sm" data-pb="${k}" href="#" target="_blank" rel="noopener">${icone(ic)} ${esc(T.pb_gh)}</a>`;
    // os nomes dos botões do GitHub ficam em “aspas” e em negrito (inglês / português, para quem usa o tradutor do navegador)
    const rotulos = (s) => esc(s).replace(/“([^”]+)”/g, "<b>“$1”</b>");
    const M = T.pb_mock, ligar = `<li data-pb-li="pages"><span class="sb-pn" aria-hidden="true">3</span><div><b>${esc(T.pb_p4[0])}</b><small>${rotulos(T.pb_p4[1])}</small>
          <ol class="sb-sub">${T.pb_p4_itens.map((x) => `<li>${rotulos(x)}</li>`).join("")}</ol>
          <div class="sb-gh" aria-hidden="true"><p class="sb-gh-t">${icone("globe")} ${esc(M.tela)}</p><p class="sb-gh-l">${esc(M.branch)}</p>
            <div class="sb-gh-row"><span class="sb-gh-c"><i>1</i>${esc(M.none)} ▾</span><span class="sb-gh-seta">→</span><span class="sb-gh-c sb-gh-on">main ▾</span><span class="sb-gh-c sb-gh-dim">/ (root) ▾</span><span class="sb-gh-c sb-gh-ok"><i>2</i>${esc(M.save)}</span></div>
            <p class="sb-gh-v"><i>3</i><span>${esc(M.live)} <span data-pb="url2"></span></span></p></div>
          <small>${rotulos(T.pb_p4_nota)}</small>${ghBt("pages", "globe")}</div></li>`;
    sec.innerHTML = `<h3>${icone("upload")} ${esc(T.pb_t)}</h3><p class="small muted">${esc(T.pb_lead)}</p>
      <label class="st-nome"><span>${esc(T.pb_repo)}</span><input type="text" name="pb-repo" maxlength="80" value="${esc(slugRepo(S.cfg.titulo))}" autocapitalize="off" autocomplete="off" spellcheck="false"></label>
      <label class="sb-chk"><input type="checkbox" name="pb-raiz"><span><b>${esc(T.pb_raiz)}</b><small>${esc(T.pb_raiz_nota)}</small></span></label>
      <div class="sb-tabs" role="tablist">${["a", "b"].map((k, i) => `<button type="button" role="tab" class="sb-tab" id="sb-tab-${k}" data-pb-tab="${k}" aria-selected="${!i}" aria-controls="sb-tp-${k}"><b>${esc(T["pb_" + k][0])}</b><small>${esc(T["pb_" + k][1])}</small></button>`).join("")}</div>
      <div class="sb-tabp" id="sb-tp-a" role="tabpanel" aria-labelledby="sb-tab-a">
        <p class="small">${esc(T.pb_conta)} <a href="https://github.com/signup" target="_blank" rel="noopener">${esc(T.pb_conta_bt)}</a></p>
        <label class="st-nome"><span>${esc(T.pb_user)}</span><input type="text" name="pb-user" value="${esc(user0)}" placeholder="${esc(T.pb_user_ph)}" autocapitalize="off" autocomplete="username" spellcheck="false"><small class="muted">${esc(T.pb_user_nota)}</small></label>
        <ol class="sb-passos">${passo(1, "pb_p1", ghBt("novo", "plus"))}
          <li><span class="sb-pn" aria-hidden="true">2</span><div><b>${esc(T.pb_p2[0])}</b><small data-pb="p2"></small>${ghBt("enviar", "upload")}</div></li>
          ${ligar}
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
      q('[data-pb="url"]').textContent = q('[data-pb="url2"]').textContent = urlSite(ok ? u : T.pb_user_x, r);
      // o arquivo já baixado: o index.html, ou o que vem dentro do .zip
      q('[data-pb="p2"]').innerHTML = rotulos(S.zip ? T.pb_p2_zip : T.pb_p2_html);
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
      if (k === "copiar") { if (!RE_USER.test(u)) { msg.textContent = T.pb_falta_user; return; } const ok = await copiarTexto(urlSite(u, repo(u))); msg.textContent = ok ? T.pb_copiado : urlSite(u, repo(u)); }
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
