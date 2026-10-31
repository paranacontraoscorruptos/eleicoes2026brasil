/* Modo offline do app: guarda o essencial do site e as páginas e dados que o visitante já abriu.
   Código, estilos e dados resumidos vêm primeiro da rede (sempre a versão nova); sem internet, usa a cópia guardada. */
const VERSAO = "bu2026-v35";
const ESSENCIAL = ["./", "index.html", "manifest.webmanifest", "site/css/style.css", "site/js/i18n.js", "site/js/i18n-extras.js", "site/js/app.js", "site/js/paginas.js", "site/js/variacao.js", "site/js/ferramentas.js",
  "site/js/exportar.js", "site/js/consulta.js", "site/js/motor.js", "site/js/motor-worker.js", "site/js/bot.js", "site/js/atlas.js", "site/js/sites.js", "site/js/extras.js", "site/js/consulta-worker.js", "site/js/simulador-motor.js", "site/js/simulador.js", "site/js/simulador-pt.js", "site/js/simulador-en.js", "site/js/simulador-es.js", "site/data/resumo.json", "site/data/testes_extra.json", "site/fonts/space-grotesk-latin-wght-normal.woff2", "site/img/favicon.svg",
  "site/img/bandeira.svg", "site/img/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ESSENCIAL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Rede primeiro; guarda a resposta; sem rede, devolve a cópia
async function redePrimeiro(req) {
  const c = await caches.open(VERSAO);
  try {
    const r = await fetch(req);
    if (r.ok) c.put(req, r.clone());
    return r;
  } catch (err) {
    const m = await c.match(req, { ignoreSearch: true });
    if (m) return m;
    if (req.mode === "navigate") { const i = await c.match("index.html"); if (i) return i; }
    throw err;
  }
}

// Cópia guardada primeiro (dados das seções e mapas, que não mudam), atualizada em segundo plano
async function copiaPrimeiro(req, ev) {
  const c = await caches.open(VERSAO);
  const m = await c.match(req);
  const rede = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; });
  if (m) { ev.waitUntil(rede.catch(() => {})); return m; }
  return rede;
}

self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // arquivos grandes dos relatórios: só pela rede
  if (url.pathname.includes("/auditoria-eleicoes-2026-Brasil/") && !/\.png$/.test(url.pathname)) return;
  if (/\/site\/(data\/(secoes|ufs|mapas|locais)\/|fonts\/|img\/|js\/vendor\/)/.test(url.pathname) || /\.png$/.test(url.pathname)) { e.respondWith(copiaPrimeiro(req, e)); return; }
  e.respondWith(redePrimeiro(req));
});
