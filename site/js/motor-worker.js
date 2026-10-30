/* Motor do Atlas em segundo plano (Web Worker): a página manda a pergunta e recebe a intenção, os lugares
   e as respostas mais próximas da base, sem travar a tela. A base e os municípios são lidos aqui mesmo. */
/* global MOTOR */
importScripts("motor.js");
const lidos = {};
function json(url) {
  if (!lidos[url]) lidos[url] = fetch(url).then((r) => { if (!r.ok) throw new Error(r.status + " " + url); return r.json(); }).catch((e) => { delete lidos[url]; throw e; });
  return lidos[url];
}
self.onmessage = async (e) => {
  const { id, tipo, d } = e.data || {};
  try {
    let r = null;
    if (tipo === "config") {
      const o = { lang: d.lang, ufNomes: d.ufNomes, cands: d.cands };
      [o.kb, o.muns] = await Promise.all([d.kbUrl ? json(d.kbUrl) : null, d.munsUrl ? json(d.munsUrl) : null]);
      if (!o.kb) delete o.kb;
      if (!o.muns) delete o.muns;
      MOTOR.configurar(o);
      r = MOTOR.estado();
    } else if (tipo === "analisar") r = MOTOR.analisar(d.texto, d.ctx || null);
    else if (tipo === "buscar") r = MOTOR.buscar(d.texto);
    self.postMessage({ id, r });
  } catch (err) {
    self.postMessage({ id, erro: String((err && err.message) || err) });
  }
};
