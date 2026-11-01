/* Modo offline do app: guarda o essencial do site e as páginas e dados que o visitante já abriu.
   Código, estilos e dados resumidos vêm primeiro da rede (sempre a versão nova); sem internet, usa a cópia guardada. */
const VERSAO = "bu2026-v48";
const AVISOS = "bu2026-avisos";   // guarda a última novidade avisada e o idioma (não é apagado ao trocar de versão)
const ESSENCIAL = ["./", "index.html", "manifest.webmanifest", "site/css/style.css", "site/js/i18n.js", "site/js/i18n-extras.js", "site/js/i18n-testes.js", "site/js/app.js", "site/js/paginas.js", "site/js/variacao.js", "site/js/ferramentas.js",
  "site/js/exportar.js", "site/js/consulta.js", "site/js/motor.js", "site/js/motor-worker.js", "site/js/bot.js", "site/js/atlas.js", "site/js/sites.js", "site/js/extras.js", "site/js/consulta-worker.js", "site/js/simulador-motor.js", "site/js/simulador-motor2.js", "site/js/simulador-novos-pt.js", "site/js/simulador-novos-en.js", "site/js/simulador-novos-es.js", "site/js/simulador.js", "site/js/simulador-pt.js", "site/js/simulador-en.js", "site/js/simulador-es.js", "site/data/resumo.json", "site/data/testes_extra.json", "site/fonts/space-grotesk-latin-wght-normal.woff2", "site/img/favicon.svg",
  "site/img/bandeira.svg", "site/img/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ESSENCIAL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO && k !== AVISOS).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
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

// --- avisos de novidades -------------------------------------------------------------------------------------------------
// Lê site/data/atualizacoes.json (mais nova primeiro) e avisa os itens que apareceram desde a última conferência.
async function avLer(k) { const c = await caches.open(AVISOS); const r = await c.match("aviso-" + k); return r ? r.text() : null; }
async function avGravar(k, v) { const c = await caches.open(AVISOS); await c.put("aviso-" + k, new Response(String(v))); }
const avChave = (it) => `${it.d}|${(it.t && it.t.PT) || ""}`;
async function avConferir() {
  if (typeof Notification !== "undefined" && Notification.permission !== "granted") return;
  const r = await fetch("site/data/atualizacoes.json", { cache: "no-store" });
  if (!r.ok) return;
  const lista = await r.json();
  if (!Array.isArray(lista) || !lista.length) return;
  const ult = await avLer("ultimo"), lg = (await avLer("lg")) || "PT";
  await avGravar("ultimo", avChave(lista[0]));
  if (ult === null) return;                       // primeira vez: só marca onde está
  const novos = [];
  for (const it of lista) { if (avChave(it) === ult) break; novos.push(it); }
  if (!novos.length || novos.length === lista.length) return;
  const it = novos[0], tx = (o) => (o && (o[lg] || o.PT)) || "";
  const mais = { PT: (n) => ` (+${n} novidade${n > 1 ? "s" : ""})`, EN: (n) => ` (+${n} update${n > 1 ? "s" : ""})`, ES: (n) => ` (+${n} novedad${n > 1 ? "es" : ""})` }[lg] || ((n) => ` (+${n})`);
  await self.registration.showNotification(tx(it.t) + (novos.length > 1 ? mais(novos.length - 1) : ""), {
    body: tx(it.x).slice(0, 200), icon: "site/img/icon-192.png", badge: "site/img/icon-192.png", tag: "novidades",
    data: { url: "./" + (novos.length > 1 ? "#/atualizacoes" : (it.link || "#/atualizacoes")) },
  });
}
self.addEventListener("periodicsync", (e) => { if (e.tag === "novidades") e.waitUntil(avConferir().catch(() => {})); });
self.addEventListener("message", (e) => {
  const m = e.data || {};
  if (m.tipo === "avisos") e.waitUntil(avGravar("lg", m.lg || "PT").then(() => avLer("ultimo")).then((u) => (u === null ? avConferir() : null)).catch(() => {}));
  else if (m.tipo === "checar") e.waitUntil(avGravar("lg", m.lg || "PT").then(avConferir).catch(() => {}));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => x.url.startsWith(self.registration.scope));
    if (c) return c.focus().then((w) => (w && w.navigate ? w.navigate(url) : null)).catch(() => self.clients.openWindow(url));
    return self.clients.openWindow(url);
  }));
});
