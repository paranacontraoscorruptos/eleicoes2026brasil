/* Motor do Atlas: entende a pergunta (o que a pessoa quer e o que ela cita: lugar, zona, seção, turno, testes,
   medida, ordem) e busca na base de perguntas e respostas. Não mexe na página: roda na página ou em segundo plano
   (Web Worker, ver motor-worker.js). Os dados chegam por configurar(): base, municípios, nomes dos estados e candidatos. */
(function (G) {
  "use strict";

  // --- linguagem: palavras vazias, sinônimos, números por extenso e radicais ---------------------------------------
  const STOP = {
    PT: "a o as os um uma uns umas de da do das dos em no na nos nas por para pra pro com sem que qual quais quanto quantos quantas como e ou eu me meu minha voce voces ele ela isso isto esse essa este esta aqui ali la se ja so mais muito pouco ser foi era sao tem ter teve ha sobre entre ate apos pelo pela pelos pelas ao aos tambem nao sim fala fale diga dizer quero queria gostaria saber pode poderia favor ola oi explica explique explicar",
    EN: "a an the of in on at to for from with without by and or i me my you your it its this that these those is are was were be been do does did have has had what which who whom how about please can could would tell want know show give hi hello explain",
    ES: "a el la los las un una unos unas de del en por para con sin que cual cuales cuanto cuantos cuantas como y o yo me mi mis tu usted ustedes es son fue era ser estar hay tiene tener sobre entre hasta pero tambien no si dime decir quiero queria saber puede podria favor hola explica explicame decirme dime",
  };
  const SIN = {
    PT: { analise: "teste", analises: "teste", testes: "teste", vetor: "teste", vetores: "teste", primeiro: "1", primeira: "1", segundo: "2", segunda: "2",
      secoes: "secao", urnas: "urna", zonas: "zona", eleitores: "eleitor", fraudes: "fraude", fraudada: "fraude", fraudado: "fraude", roubada: "fraude",
      baixar: "download", downloads: "download", hashes: "hash", programa: "codigo", script: "codigo", motor: "codigo", rodar: "executar", rodo: "executar" },
    EN: { tests: "test", analysis: "test", analyses: "test", check: "test", checks: "test", first: "1", "1st": "1", second: "2", "2nd": "2",
      sections: "section", machines: "machine", zones: "zone", voters: "voter", rigged: "fraud", stolen: "fraud", downloads: "download", hashes: "hash",
      script: "code", engine: "code", program: "code", run: "execute", running: "execute" },
    ES: { pruebas: "prueba", analisis: "prueba", test: "prueba", primera: "1", primero: "1", segunda: "2", segundo: "2", secciones: "seccion", urnas: "urna",
      zonas: "zona", electores: "elector", fraudulenta: "fraude", robada: "fraude", descargar: "descarga", descargas: "descarga", hashes: "hash",
      script: "codigo", motor: "codigo", programa: "codigo", correr: "ejecutar" },
  };
  const NUM = {
    PT: { zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15,
      dezesseis: 16, dezasseis: 16, dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
      cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900, mil: 1000 },
    EN: { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
      seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000 },
    ES: { cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16,
      diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, treinta: 30, cuarenta: 40, cincuenta: 50,
      sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500, seiscientos: 600, setecientos: 700,
      ochocientos: 800, novecientos: 900, mil: 1000 },
  };
  const LIGA = new Set(["e", "and", "y"]);
  // "um"/"uma" (e "una") também são artigo: só viram número ao lado de turno, zona, seção, teste ou urna
  const ARTIGO = new Set(["um", "uma", "una", "one"]);
  const CONTEXTO_NUM = /^(turno|turnos|round|vuelta|zona|zone|secao|section|seccion|teste|test|prueba|urna|machine|t)$/;

  const norm = (s) => String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ºª°]/g, " ").replace(/[^a-z0-9]+/g, " ")
    .replace(/\bsha (\d{3})\b/g, "sha$1").trim();

  // Números escritos por extenso viram algarismos: "cinquenta e um" → 51, "dois mil" → 2000
  function numerar(nz, lang) {
    const T = NUM[lang] || NUM.PT, ws = nz.split(" "), out = [];
    for (let i = 0; i < ws.length; i++) {
      if (!(ws[i] in T)) { out.push(ws[i]); continue; }
      let j = i, total = 0, cur = 0, achou = 0;
      while (j < ws.length) {
        const w = ws[j];
        if (w in T) {
          const v = T[w];
          if (v === 1000) { cur = (cur || 1) * 1000; total += cur; cur = 0; }
          else if (v === 100 && w === "hundred") cur = (cur || 1) * 100;
          else cur += v;
          achou++; j++;
        } else if (LIGA.has(w) && achou && j + 1 < ws.length && ws[j + 1] in T && T[ws[j + 1]] < T[ws[j - 1]]) j++;
        else break;
      }
      const sozinho = achou === 1 && ARTIGO.has(ws[i]);
      if (sozinho && !((i > 0 && CONTEXTO_NUM.test(ws[i - 1])) || (j < ws.length && CONTEXTO_NUM.test(ws[j]) && lang !== "PT"))) { out.push(ws[i]); continue; }
      if (sozinho && lang === "PT" && !(i > 0 && CONTEXTO_NUM.test(ws[i - 1]))) { out.push(ws[i]); continue; }
      out.push(String(total + cur));
      i = j - 1;
    }
    return out.join(" ");
  }

  // Radical simples (PT, ES, EN): "sinalizadas", "sinalização" e "sinalizar" caem no mesmo radical
  const PROTEGE = new Set(("secao seccion section zona zone urna turno round vuelta teste test prueba hash codigo code sha512 brasil brazil estado state municipio municipality eleitor elector voter fraude fraud "
    + "download descarga executar ejecutar execute relatorio report informe sinal senal flag anomalia anomaly comparecimento comparecencia turnout abstencao abstencion abstention branco blanco blank nulo null "
    + "candidato candidate resultado result contagem conteo count telegram github python presidente president lula flavio bolsonaro klimek mebane benford").split(" "));
  const SUF_PT = ["izacoes", "izacao", "acoes", "icoes", "acao", "icao", "mente", "idades", "idade", "ancias", "ancia", "encias", "encia", "adores", "adoras", "adora", "ador", "aveis", "ivel", "avel",
    "istas", "ista", "ismos", "ismo", "ados", "adas", "idos", "idas", "ado", "ada", "ido", "ida", "ando", "endo", "indo", "aram", "eram", "iram", "avam", "aria", "ariam", "ar", "er", "ir", "ou", "eu", "iu", "ava"];
  const SUF_ES = ["izaciones", "izacion", "aciones", "acion", "mente", "idades", "idad", "ancias", "ancia", "encias", "encia", "adores", "adoras", "adora", "ador", "ables", "able", "ibles", "ible",
    "istas", "ista", "ismos", "ismo", "ados", "adas", "idos", "idas", "ado", "ada", "ido", "ida", "ando", "iendo", "aron", "ieron", "aban", "aria", "arian", "ar", "er", "ir", "aba", "io"];
  function raiz(w, lang) {
    if (w.length < 5 || /\d/.test(w) || PROTEGE.has(w)) return w;
    if (lang === "EN") {
      let x = w.replace(/ies$/, "y").replace(/sses$/, "ss").replace(/([^su])s$/, "$1");
      if (PROTEGE.has(x)) return x;
      x = x.replace(/(ations|ation|ational)$/, "ate").replace(/(ingly|ing|edly|ed|ly)$/, "");
      return x.length >= 4 ? x : w;
    }
    let x = w.replace(/oes$/, "ao").replace(/aes$/, "ao").replace(/ais$/, "al").replace(/eis$/, "el").replace(/ns$/, "m").replace(/([rzl])es$/, "$1").replace(/([^s])s$/, "$1");
    if (PROTEGE.has(x)) return x;
    for (const s of lang === "ES" ? SUF_ES : SUF_PT) if (x.endsWith(s) && x.length - s.length >= 4) { x = x.slice(0, -s.length); break; }
    if (x.length > 4) x = x.replace(/[aeo]$/, "");
    return x;
  }

  // --- estado do motor --------------------------------------------------------------------------------------------
  const B = { lang: "PT", kb: null, idx: null, byId: {}, muns: null, lug: null, ufNomes: {}, cands: [], stop: new Set(STOP.PT.split(" ")) };

  function tokens(s) {
    const sin = SIN[B.lang];
    return numerar(norm(s), B.lang).split(" ").filter((w) => w && !B.stop.has(w)).map((w) => {
      if (sin[w]) return sin[w];
      if (w.length > 4 && w.endsWith("s") && !/\d/.test(w)) w = w.slice(0, -1);
      return sin[w] || w;
    });
  }

  // Distância de edição com troca de letras vizinhas (Damerau); para cedo acima de "max"
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let p2 = null, p1 = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let menor = i;
      for (let j = 1; j <= b.length; j++) {
        let v = Math.min(p1[j] + 1, cur[j - 1] + 1, p1[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (p2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        cur[j] = v; if (v < menor) menor = v;
      }
      if (menor > max) return max + 1;
      p2 = p1; p1 = cur;
    }
    return p1[b.length];
  }

  // Duas letras vizinhas trocadas ("reslutado")
  function trocadas(a, b) {
    if (a.length !== b.length) return false;
    let i = 0; while (i < a.length && a[i] === b[i]) i++;
    return i < a.length - 1 && a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  // 1: igual · 0,8: mesmo radical · 0,75: começo igual · 0,7: um erro de digitação · 0,5: dois erros (palavras longas)
  function similaridade(q, d, rq, rd) {
    if (q === d) return 1;
    if (/\d/.test(q) || /\d/.test(d)) return 0;
    const mn = Math.min(q.length, d.length);
    if (rq && rq === rd && rq.length >= 4) return 0.8;
    if (mn >= 4 && (d.startsWith(q) || q.startsWith(d))) return 0.75;
    if (mn >= 4 && trocadas(q, d)) return 0.7;
    if (mn >= 5) {
      const mx = mn >= 8 ? 2 : 1, l = lev(q, d, mx);
      if (l === 1) return 0.7;
      if (l === 2 && mx === 2) return 0.5;
    }
    return 0;
  }

  function indexar(kb) {
    const vocab = new Map(), frases = [];
    kb.forEach((e, i) => {
      const pesos = new Map();
      const add = (txt, w) => tokens(txt).forEach((tk) => { if ((pesos.get(tk) || 0) < w) pesos.set(tk, w); });
      e.q.forEach((q) => add(q, 3));
      if (e.k) add(e.k, 1.5);
      add(e.a.slice(0, 260).replace(/[`*#\[\]()]/g, " "), 0.4);
      pesos.forEach((w, tk) => { if (!vocab.has(tk)) vocab.set(tk, []); vocab.get(tk).push([i, w]); });
      frases.push(e.q.map((q) => tokens(q).join(" ")));
    });
    const N = kb.length, idf = new Map();
    vocab.forEach((p, tk) => idf.set(tk, Math.log(1 + N / p.length)));
    const termos = Array.from(vocab.keys());
    return { vocab, idf, frases, termos, raizes: termos.map((tk) => raiz(tk, B.lang)) };
  }

  function buscar(texto) {
    if (!B.kb) return [];
    if (!B.idx) B.idx = indexar(B.kb);
    const I = B.idx, qt = [...new Set(tokens(texto))];
    if (!qt.length) return [];
    const contrib = new Map();
    qt.forEach((q, qi) => {
      const rq = raiz(q, B.lang);
      I.termos.forEach((tk, ti) => {
        const s = similaridade(q, tk, rq, I.raizes[ti]);
        if (!s) return;
        const idf = I.idf.get(tk);
        I.vocab.get(tk).forEach(([e, w]) => {
          let c = contrib.get(e); if (!c) { c = { v: new Array(qt.length).fill(0), s: new Array(qt.length).fill(0) }; contrib.set(e, c); }
          const v = s * w * idf; if (v > c.v[qi]) c.v[qi] = v; if (s > c.s[qi]) c.s[qi] = s;
        });
      });
    });
    const qj = qt.join(" ");
    const nz = numerar(norm(texto), B.lang);
    const mt = nz.match(/\b(?:teste|test|prueba|analise|analisis|analysis|t)\s?0?(1[0-5]|[1-9])\b/);
    const tid = mt ? "T" + String(mt[1]).padStart(2, "0") : null;
    const res = [];
    contrib.forEach((cc, e) => {
      const c = cc.v;
      const soma = c.reduce((a, b) => a + b, 0);
      const cob = c.filter((x) => x > 0).length / qt.length;
      const fortes = cc.s.filter((x) => x >= 0.7).length;
      let sc = soma * (0.35 + 0.65 * cob);
      const fr = I.frases[e];
      if (fr.includes(qj)) sc += 6;
      else if (qt.length >= 2 && fr.some((f) => f.includes(qj) || (f.length > 3 && qj.includes(f)))) sc += 2.5;
      const ent = B.kb[e];
      if (tid && ent.x && ent.x.t) sc = ent.x.t === tid ? sc * 1.5 + 2 : sc * 0.15;
      res.push([sc, e, fortes / qt.length]);
    });
    res.sort((a, b) => b[0] - a[0]);
    return res.slice(0, 6).map(([sc, e, f]) => ({ i: B.kb[e].i, sc, f }));
  }
  const forte = (r) => !!(r.length && r[0].sc >= 4 && r[0].f >= 0.34);

  // --- zona, seção e turno ------------------------------------------------------------------------------------------
  // "Pará" só vale com acento ("para" é palavra comum)
  const RE_PARA = /(^|[^\p{L}])par[áÁ]($|[^\p{L}])/iu;
  const UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO", "ZZ"];
  const nomeUf = (sig) => { const v = B.ufNomes[sig]; return v == null ? sig : typeof v === "string" ? v : v[B.lang] || v.PT; };

  function ufDoTexto(texto, nz) {
    const orig = String(texto).match(/\b[A-Za-z]{2}\b/g) || [];
    let uf = orig.find((tk) => tk === tk.toUpperCase() && UFS.includes(tk)) || null;
    if (!uf) { const tk = orig.find((x) => UFS.includes(x.toUpperCase()) && !B.stop.has(x.toLowerCase())); if (tk) uf = tk.toUpperCase(); }
    if (!uf) {
      for (const sig of Object.keys(B.ufNomes)) {
        const v = B.ufNomes[sig];
        if ((typeof v === "string" ? [v] : Object.values(v)).some((nm) => nz.includes(" " + norm(nm) + " ") && (norm(nm) !== "para" || RE_PARA.test(texto)))) { uf = sig; break; }
      }
    }
    return uf;
  }
  function detectarSecao(texto) {
    let nz = " " + numerar(norm(texto), B.lang) + " ";
    const mz = nz.match(/\b(?:zona|zone|zn)\s*(\d{1,4})\b/);
    const ms = nz.match(/\b(?:secao|section|seccion|sec|se)\s*(\d{1,4})\b/);
    if (!mz && !ms) return null;
    nz = nz.replace(/\b(?:zona|zone|zn)\s*\d{1,4}\b/, " ").replace(/\b(?:secao|section|seccion|sec|se)\s*\d{1,4}\b/, " ");
    const semNum = String(texto).replace(/\b(?:zona|zone|zn|se[cç][aã]o|section|secci[oó]n|sec|se)\s*\d{1,4}\b/gi, " ");
    return { uf: ufDoTexto(semNum, nz), z: mz ? +mz[1] : null, s: ms ? +ms[1] : null };
  }
  // Várias seções na mesma frase ("PR zona 3 seção 50 x PR zona 3 seção 51")
  function secoes(texto) {
    const out = [], re = /(?:\b([A-Za-z]{2})\b[\s,]*)?(?:zona|zone|zn)\s*(\d{1,4})[\s,/-]*(?:se[cç][aã]o|section|secci[oó]n|sec)\s*(\d{1,4})/gi;
    const geral = detectarSecao(texto);
    let m;
    while ((m = re.exec(texto))) {
      const sig = m[1] && UFS.includes(m[1].toUpperCase()) && !B.stop.has(m[1].toLowerCase()) ? m[1].toUpperCase() : null;
      out.push({ uf: sig || (out.length ? out[out.length - 1].uf : geral && geral.uf), z: +m[2], s: +m[3] });
    }
    return out;
  }
  function turnoDe(n) {
    n = " " + n + " ";
    if (/\b(?:1|1o|1st|primeiro|primeira|first|primer|primera)\s*(?:turno|round|vuelta)\b|\b(?:turno|round|vuelta)\s*1\b/.test(n)) return 1;
    if (/\b(?:2|2o|2nd|segundo|segunda|second)\s*(?:turno|round|vuelta)\b|\b(?:turno|round|vuelta)\s*2\b/.test(n)) return 2;
    return 0;
  }

  // --- lugares: estado e município citados ---------------------------------------------------------------------------
  // Palavras que não mudam o assunto quando a pergunta cita um lugar ("resultado em Curitiba")
  const NEUTRAS = new Set(("resultado resultados result results voto votos vote votes votacao voting votacion eleitor eleitores eleitorado voter voters elector electores abstencao abstention abstencion "
    + "comparecimento turnout participacao participation participacion comparecencia secao secoes section sections seccion secciones sinal sinais sinalizacao sinalizacoes flag flags flagged anomalia anomalias "
    + "anomaly anomalies dado dados data datos turno turnos round rounds vuelta vueltas 1 2 1o 2o 1st 2nd primeiro segundo first second primera segunda primer quanto quantos quanta quantas how many much "
    + "cuanto cuantos cuanta cuantas em no na nos nas de do da dos das in on of the en el la los las del a o e y and qual quais what which cual cuales foi foram was were fue fueron is es e "
    + "populacao population poblacion ibge tse conferir confira check comparar compare comprobar verificar oficial official eleicao election eleccion presidente president lula flavio bolsonaro "
    + "candidato candidatos candidate candidates ganhou venceu won gano mapa map zona zonas zone zones cidade municipio city municipality ciudad estado state uf me mostre mostra show muestra ver see "
    + "sobre about acerca total totais totals geral general resumo summary resumen por para pra for to com with con tem has tiene teve had numero numeros number numbers regiao region "
    + "habitantes inhabitants quero want quiero saber know informacoes information informacion info brasil brazil nacional national pais country baixo baixa alto alta low high bajo baja maior menor higher lower mayor").split(" "));
  // Nomes de município que também são palavras comuns: só valem com "cidade/município", com a UF ou sozinhos
  const ARRISCADO = new Set(["alegre", "alto alegre", "barao", "barcelos", "barra", "barras", "bom jesus", "capixaba", "caraubas", "catarina", "coluna", "contagem", "custodia", "delta", "extrema", "flores",
    "guaranta", "horizonte", "independencia", "jurua", "liberdade", "lima", "luz", "marcacao", "modelo", "monte carlo", "olho d agua", "passa tempo", "passos", "pimenta", "propria", "querencia",
    "registro", "reserva", "rio grande", "santo estevao", "tanque novo", "una", "uniao", "votorantim", "vitoria", "natal", "serra", "formosa", "esperanca", "feliz", "central", "floresta", "prata",
    "paraiso", "cristal", "saudade", "recreio", "harmonia", "concordia", "progresso", "maravilha", "colorado", "palmas", "bonito", "salto", "campo alegre"]);
  const SIGLA_COMUM = new Set(UFS.map((x) => x.toLowerCase()));
  const RE_KW_MUN = /\b(cidade|municipio|city|municipality|town|ciudad)\b/;
  const RE_KW_UF = /\b(estado|state|provincia)\b/;
  const titulo = (s) => String(s).toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Dos|Das|E)\b/g, (m) => m.toLowerCase());

  function indiceLugares() {
    if (B.lug) return B.lug;
    const lista = [];
    Object.entries(B.muns || {}).forEach(([uf, ms]) => Object.entries(ms).forEach(([cod, v]) => lista.push({ n: norm(v[0]), uf, cod, nome: titulo(v[0]) })));
    lista.sort((a, b) => b.n.length - a.n.length);
    const ufs = [];
    Object.entries(B.ufNomes).forEach(([uf, v]) => (typeof v === "string" ? [v] : Object.values(v)).forEach((x) => ufs.push({ n: norm(x), uf })));
    ufs.push({ n: "minas", uf: "MG" });
    ufs.sort((a, b) => b.n.length - a.n.length);
    B.lug = { lista, ufs };
    return B.lug;
  }

  // Estado e/ou município citados, e se a pergunta é "sobre o lugar" (forte)
  function lugar(texto) {
    const I = indiceLugares();
    const n = " " + norm(texto) + " ";
    let uf = null, ufNome = null;
    for (const u of I.ufs) {
      if (!n.includes(" " + u.n + " ")) continue;
      if (u.n === "para" && !RE_PARA.test(texto) && !/\b(?:estado do|state of|estado de) para\b/.test(n)) continue;
      uf = u.uf; ufNome = u.n; break;
    }
    const siglas = (String(texto).match(/\b[A-Z]{2}\b/g) || []).filter((x) => B.ufNomes[x]);
    let ufSigla = siglas[0] || null;
    const tks = n.trim().split(" ");
    if (!ufSigla && tks.length <= 3) { const ult = tks[tks.length - 1]; if (ult.length === 2 && B.ufNomes[ult.toUpperCase()] && (tks.length > 1 || SIGLA_COMUM.has(ult))) ufSigla = ult.toUpperCase(); }
    const semUf = ufNome ? n.replace(" " + ufNome + " ", " ") : n;
    let muns = [];
    for (const m of I.lista) {
      if (muns.length && m.n.length < muns[0].n.length) break;
      if (m.n.length >= 3 && semUf.includes(" " + m.n + " ")) muns.push(m);
    }
    const kwMun = RE_KW_MUN.test(n), kwUf = RE_KW_UF.test(n);
    // município com o mesmo nome do estado citado ("Paraná", RN): vira alternativa, a não ser que peça "cidade"
    const homonimos = ufNome ? I.lista.filter((m) => m.n === ufNome) : [];
    if (kwMun && !muns.length && homonimos.length) { muns = homonimos; uf = null; ufNome = null; }
    const ufFiltro = ufSigla || uf;
    if (muns.length && ufFiltro) { const f = muns.filter((m) => m.uf === ufFiltro); if (f.length) muns = f; }
    let resto = semUf;
    if (muns.length) resto = resto.replace(" " + muns[0].n + " ", " ");
    const sobra = resto.trim().split(" ").filter((w) => w && !NEUTRAS.has(w) && !(w.length === 2 && B.ufNomes[w.toUpperCase()]));
    const forte_ = kwMun || kwUf || !sobra.length;
    if (muns.length && muns[0].n.length <= 4 && !(kwMun || ufFiltro || !sobra.length)) muns = [];
    if (muns.length && ARRISCADO.has(muns[0].n) && !(kwMun || ufFiltro || !sobra.length)) muns = [];
    return { uf: muns.length ? null : (ufSigla || uf), muns: muns.map(({ uf: u, cod, nome }) => ({ uf: u, cod, nome })), forte: forte_, homonimos: muns.length ? [] : homonimos.map(({ uf: u, cod, nome }) => ({ uf: u, cod, nome })), kwMun };
  }

  // Vários lugares (para comparar): a frase é cortada nos "x", "vs", "e", "com", vírgulas
  const CORTE = /\s+(?:x|vs\.?|versus|contra|com|e|and|y|ou|or|frente a|with|con)\s+|\s*[,;/]\s*/i;
  function lugares(texto) {
    const out = [], visto = new Set();
    String(texto).split(CORTE).forEach((parte) => {
      if (!parte || !parte.trim()) return;
      const lg = lugar(parte);
      if (lg.muns.length) {
        const k = lg.muns.map((m) => m.uf + m.cod).join("|");
        if (!visto.has(k)) { visto.add(k); out.push(lg.muns.length === 1 ? Object.assign({ tipo: "mun" }, lg.muns[0]) : { tipo: "mun", alternativas: lg.muns, nome: lg.muns[0].nome, trecho: parte.trim() }); }
      } else if (lg.uf && !visto.has(lg.uf)) { visto.add(lg.uf); out.push({ tipo: "uf", uf: lg.uf, nome: nomeUf(lg.uf) }); }
      else if (/\b(brasil|brazil|nacional|national|pais|country)\b/.test(norm(parte)) && !visto.has("BR")) { visto.add("BR"); out.push({ tipo: "br" }); }
    });
    return out;
  }

  // --- o que a pergunta quer -----------------------------------------------------------------------------------------
  const TESTE_NOMES = [
    ["T03", /\b(unanimidade|unanimidades|unanimity|unanimidad|100 ?% para)\b/], ["T04", /\babstenc\w* zero|zero abstenc\w*|abstention zero|zero abstention|comparecimento (?:de |total |integral )?100\b/],
    ["T05", /\b(?:excesso de |excess(?:ive)? )?(?:brancos e nulos|blank and null|blancos y nulos)\b(?= .*\b(?:teste|test|prueba|excesso|excess|exceso)\b)|\bexces\w* de brancos/],
    ["T06", /\bvoto cruzado|cross(?:ed)? vot\w*|voto cruzado\b/], ["T07", /\bparadox\w* de legenda|party[- ]list paradox|paradoja de (?:la )?lista|voto (?:de|na) legenda\b/],
    ["T08", /\b(?:contraste de )?vizinhanca|neighbou?rhood contrast|contraste de vecindad|vecindad\b/], ["T09", /\b(?:resultados? identic\w*|identical results?|resultados identicos)\b/],
    ["T10", /\bbiometri\w*/], ["T11", /\bhorarios? atipic\w*|unusual times?|atypical times?|horarios atipicos\b/], ["T12", /\btroca de urna|contingencia|contingency|cedula|paper ballot|papeleta|urna de reserva\b/],
    ["T13", /\bmebane|segundo digito|second digit|2o digito|2 digito\b/], ["T14", /\bbeber|scacco|ultimo digito|last digit\b/], ["T15", /\bklimek|impressao digital|fingerprint|huella electoral\b/],
    ["T01", /\bfechamento do boletim|report closure|cierre del boletin\b/], ["T02", /\binconsistencia de totais|totals inconsistency|inconsistencia de totales\b/],
  ];
  function testesDe(n) {
    const ids = new Set();
    let op = "e";
    const re = /\b(?:testes?|tests?|pruebas?|analises?|t)\s*((?:0?(?:1[0-5]|[1-9])\b(?:\s*(?:,|e|and|y|ou|or|o)\s*)?)+)/g;
    let m;
    while ((m = re.exec(n))) {
      if (/\b(ou|or|o)\b/.test(m[1])) op = "ou";
      (m[1].match(/\d+/g) || []).forEach((x) => { const v = +x; if (v >= 1 && v <= 15) ids.add("T" + String(v).padStart(2, "0")); });
    }
    TESTE_NOMES.forEach(([id, rx]) => { if (rx.test(n)) ids.add(id); });
    return { testes: [...ids].sort(), op };
  }
  const MEDIDAS = [
    ["bn", /\b(?:brancos? e nulos?|nulos? e brancos?|blank and null|null and blank|blancos? y nulos?|nulos? y blancos?)\b/],
    ["brancos", /\b(?:brancos?|blank|blanks|blancos?|em branco|en blanco)\b/], ["nulos", /\b(?:nulos?|null|nulls|anulados?)\b/],
    ["abst", /\b(?:abstenc\w*|abstention\w*|faltaram|faltosos|ausentes|ausencia|no show|did not vote|nao votaram|no votaron)\b/],
    ["comp", /\b(?:comparecimento|comparecencia|turnout|participacao|participacion|participation|votaram|compareceram|voted)\b/],
    ["aptos", /\b(?:eleitores|eleitorado|aptos|voters|registered|electores|habilitados|electorado)\b/],
    ["sinal", /\b(?:sinaliz\w*|sinal|sinais|anomalia\w*|anomal\w*|ocorrencia\w*|occurrence\w*|flag\w*|alerta\w*|marcad\w*|senal\w*|ocurrencia\w*|suspeit\w*|informativ\w*)\b/],
    ["secoes", /\b(?:mais|menos|maior|menor|most|fewest|more|less|mas)\s+(?:numero de\s+|number of\s+)?(?:secoes|sections|secciones)\b|\b(?:numero|quantidade|number|cantidad) de (?:secoes|sections|secciones)\b/],
  ];
  const RE_TAXA = /\b(taxa|proporcao|proporcional|percentual|porcentagem|por mil|por 1000|a cada 1000|rate|proportion|percentage|percent|per 1000|tasa|proporcion|porcentaje|cada 1000|%)\b/;
  const RE_DESC = /\b(mais|maior|maiores|top|lider\w*|primeiros|most|highest|largest|biggest|more|greatest|mas|mayor|mayores|mejores|piores|worst|alto|alta|altos|altas|high)\b/;
  const RE_ASC = /\b(menos|menor|menores|least|lowest|fewest|smallest|less|minimo|minima|baixo|baixa|baixos|baixas|low|bajo|baja|bajos|bajas)\b/;
  const UNIDADES = [["mun", /\b(municipios?|cidades?|municipalit\w*|cities|city|towns?|ciudades?)\b/], ["uf", /\b(estados?|ufs?|states?|unidades da federacao|provincias?)\b/],
    ["zona", /\b(zonas?|zones?)\b(?!\s*\d)/], ["secao", /\b(secoes|sections|secciones|urnas|secao|section|seccion)\b(?!\s*\d)/]];
  const RE_RANK = /\b(ranking|rank|top|lideres|classificacao|lista dos|liste os|quais (?:os|as)? ?(?:\d+ )?(?:municipios|cidades|estados|zonas|secoes)|which (?:\d+ )?(?:states|cities|municipalities|zones|sections)|cuales (?:son )?(?:los|las)? ?(?:\d+ )?(?:estados|ciudades|municipios|zonas|secciones))\b/;
  const RE_COMP = /\b(compar\w*|versus|vs|contra|diferenca entre|diferencas entre|lado a lado|frente a|difference between|differences between|diferencia entre|diferencias entre|x)\b/;
  const RE_PORQUE = /\b(por ?que|porque|pq|why|motivo|razao|razon|reason|explic\w*|o que (?:significa|quer dizer)|what does .* mean|que significa)\b/;
  const RE_SINAL = /\b(sinaliz\w*|marcad\w*|flag\w*|anomal\w*|alerta\w*|apareceu|aparece|suspeit\w*|senal\w*)\b/;
  const RE_RELAT = /\b(relatorio|report|informe|dossie|dossier|raio x|tudo sobre|everything about|todo sobre|resumo completo|ficha completa|panorama)\b/;
  const RE_RELAT_TEC = /\b(tecnico|technical|auditoria|audit|motor|engine|pdf|md|markdown|ingles|english|espanhol|spanish|portugues|baixar|download|descargar|1o turno|2o turno)\b/;
  const RE_MAPA = /\b(mapa|map|mapas|maps)\b/;
  const RE_ROTEIRO = /\b(roteiro|checklist|guia do cidadao|guia ciudadana|guia del ciudadano|citizen guide)\b|\b(?:passo a passo|passo-a-passo|step by step|paso a paso)\b.*\b(?:confer\w*|verific\w*|chec\w*|audit\w*|fiscaliz\w*|secao|urna|boletim|voto|check|verify|section|ballot|seccion|boletin|comprob\w*)\b|\b(?:confer\w*|verific\w*|chec\w*|secao|urna|boletim|check|verify|section|seccion|boletin)\b.*\b(?:passo a passo|step by step|paso a paso)\b|\bcomo (?:eu )?(?:posso )?(?:conferir|verificar|checar|auditar|fiscalizar) (?:a |minha |uma |o |meu )?(?:secao|urna|boletim|voto|votacao|eleicao)\b|\bhow (?:do i|can i|to) (?:check|verify|audit) (?:my |a |the )?(?:section|polling|ballot|vote|election)\b|\bcomo (?:puedo )?(?:verificar|comprobar|revisar) (?:mi |una |la )?(?:seccion|urna|boletin|voto|eleccion)\b/;
  const RE_FILTRO = /\b(secoes|sections|secciones|lista|list|listar|liste|quais secoes|which sections|que secciones)\b/;
  const RE_MINHA = /\b(minha (?:cidade|secao|zona|urna)|meu municipio|my (?:city|town|section|zone)|mi (?:ciudad|seccion|zona|municipio))\b/;
  const RE_SEGUE = /^(?:e|and|y|tambem|also|agora|now|ahora|e o|e a|e no|e na|e em|e para|what about|how about|y en|y el|y la|y para)\b/;
  const RE_CAND_PCT = /\b(percentual|porcentagem|%|percent|percentage|porcentaje|proporcao|share)\b/;

  function candidatoDe(n) {
    for (const c of B.cands) {
      if (new RegExp(`\\b(?:candidato |numero |n |nr )?${c.nr}\\b`).test(n) && /\b(votos?|candidat\w*|votes?|numero|partido|votacao|votacion)\b/.test(n)) return c;
      const ps = norm(c.nome).split(" ").filter((p) => p.length >= 4 && !["silva", "souza", "santos", "oliveira", "costa"].includes(p));
      if (ps.some((p) => new RegExp(`\\b${p}\\b`).test(n))) return c;
    }
    return null;
  }

  function entender(texto, ctx) {
    const n = " " + numerar(norm(texto), B.lang) + " ";
    const E = { texto: String(texto), turno: turnoDe(n), sec: detectarSecao(texto), secs: secoes(texto), nivel: "", metrica: null, taxa: RE_TAXA.test(n) || /%/.test(texto), ordem: null, n: null, unidade: null,
      cand: null, intencao: null, seguimento: false, minha: RE_MINHA.test(n) };
    Object.assign(E, testesDe(n));
    if (/\b(anomalia|anomalias|anomaly|anomalies)\b/.test(n) && !/\binformativ/.test(n)) E.nivel = "a";
    else if (/\binformativ\w*|informational\b/.test(n) && !/\banomal/.test(n)) E.nivel = "i";
    for (const [k, rx] of MEDIDAS) if (rx.test(n)) { E.metrica = k; break; }
    E.cand = candidatoDe(n);
    if (E.cand && (!E.metrica || E.metrica === "aptos")) E.metrica = RE_CAND_PCT.test(n) || !/\bvotos?\b|\bvotes?\b/.test(n) ? "cand_pct" : "cand";
    if (RE_ASC.test(n)) E.ordem = "asc"; else if (RE_DESC.test(n)) E.ordem = "desc";
    for (const [k, rx] of UNIDADES) if (rx.test(n)) { E.unidade = k; break; }
    const mn = n.match(/\b(?:top|os|as|the|los|las)\s+(\d{1,3})\b/) || n.match(/\b(\d{1,3})\s+(?:\w+\s+)?(?:municipios?|cidades?|estados?|ufs?|zonas?|secoes|cities|municipalities|states|zones|sections|ciudades|municipios|secciones|maiores|menores|primeiros|largest|biggest|highest|lowest|mayores|menores)\b/);
    if (mn) { const v = +mn[1]; if (v >= 1 && v <= 100) E.n = v; }
    const um = n.match(/\b(?:urna|machine|maquina)\s*(?:n|no|nr|numero|number|num|de|del|da)?\s*(\d{6,8})\b/);
    E.urna = um ? um[1] : null;
    E.querTse = /\btse\b/.test(n) && /\b(conferir|confere|confira|comparar|compare|checar|cheque|verificar|verifique|check|verify|comprobar|cotejar)\b/.test(n);
    E.querIbge = /\b(ibge|populacao|population|poblacion|habitantes|inhabitants)\b/.test(n);
    E.br = /\b(brasil|brazil|nacional|national|pais|country|todo o pais|whole country)\b/.test(n);

    // intenção (a ordem importa: a mais específica primeiro)
    const temRank = (E.ordem && (E.unidade || E.metrica)) || RE_RANK.test(n);
    if (RE_ROTEIRO.test(n)) E.intencao = "roteiro";
    else if (RE_PORQUE.test(n) && (RE_SINAL.test(n) || (E.sec && E.sec.z && E.sec.s)) && !temRank) E.intencao = "porque";
    else if (RE_RELAT.test(n) && !RE_RELAT_TEC.test(n) && !(E.sec && E.sec.z)) E.intencao = "relatorio";
    else if (RE_COMP.test(n) && !E.querTse && !temRank && (E.secs.length >= 2 || /\b(compar\w*|versus|vs|diferenca|difference|diferencia|lado a lado|frente a)\b/.test(n) || /\s(?:x|vs)\s/i.test(" " + texto + " "))) E.intencao = "comparar";
    else if (temRank && !(E.sec && E.sec.s && E.sec.z)) E.intencao = "ranking";
    else if (RE_FILTRO.test(n) && (E.testes.length || E.nivel || RE_SINAL.test(n)) && !(E.sec && E.sec.s)) E.intencao = "filtro";
    else if (RE_MAPA.test(n) && !(E.sec && E.sec.z)) E.intencao = "mapa";
    else if (E.testes.length && (E.sec || /\b(municipio|cidade|estado|zona|city|state|zone|ciudad)\b/.test(n)) && RE_SINAL.test(n) && !(E.sec && E.sec.s)) E.intencao = "filtro";

    // lugares: tira da frase as palavras de medida, unidade e ordem para não confundir com nomes de município
    let limpo = String(texto);
    if (E.intencao === "ranking" || E.intencao === "filtro" || E.intencao === "comparar" || E.intencao === "mapa" || E.intencao === "relatorio") {
      limpo = limpo.replace(/\b(munic[ií]pios?|cidades?|municipalit\w*|cities|city|towns?|ciudad(?:es)?|estados?|states?|zonas?|zones?)\b(?!\s*\d)/gi, " ");
    }
    E.lugar = lugar(limpo);
    E.lugares = E.intencao === "comparar" ? lugares(limpo) : [];
    const sobra = tokens(texto).filter((w) => !NEUTRAS.has(w) && !/^\d+$/.test(w));
    E.seguimento = RE_SEGUE.test(n.trim()) ? "conector" : sobra.length <= 1 && !!(E.turno || E.sec || E.lugar.uf || E.lugar.muns.length) && !E.intencao ? "curto" : false;
    if (E.intencao === "ranking" && !E.metrica && E.testes.length) E.metrica = "sinal";
    return E;
  }

  // Pergunta de continuação ("e no 1º turno?", "e em Londrina?"): completa com o que veio da resposta anterior
  function continuar(E, ctx) {
    if (!ctx || !E.seguimento) return E;
    const novoLugar = E.lugar.uf || E.lugar.muns.length || E.br;
    const x = Object.assign({}, E);
    const herda = E.seguimento === "conector" && !x.intencao && ctx.intencao && ["ranking", "filtro", "relatorio", "mapa", "porque", "comparar"].includes(ctx.intencao);
    if (herda) {
      x.intencao = ctx.intencao;
      ["metrica", "unidade", "ordem", "n", "nivel", "cand"].forEach((k) => { if (x[k] == null || x[k] === "") x[k] = ctx[k] == null ? x[k] : ctx[k]; });
      if (!x.testes.length && ctx.testes) { x.testes = ctx.testes; x.op = ctx.op || "e"; }
    }
    if (!x.turno && ctx.turno && !novoLugar && !x.sec) x.turno = ctx.turno;
    if (x.sec && ctx.sec) {
      const s = Object.assign({}, x.sec);
      if (!s.uf) s.uf = ctx.sec.uf;
      if (s.s && !s.z) s.z = ctx.sec.z;
      x.sec = s;
    } else if (x.sec && !x.sec.uf && ctx.lugar && ctx.lugar.uf) x.sec = Object.assign({}, x.sec, { uf: ctx.lugar.uf });
    if (!novoLugar && !x.sec && ctx.lugar && (herda || E.seguimento === "conector")) {
      x.lugar = ctx.lugar.tipo === "mun" ? Object.assign({}, x.lugar, { muns: [ctx.lugar], uf: null, forte: true }) : ctx.lugar.tipo === "uf" ? Object.assign({}, x.lugar, { uf: ctx.lugar.uf, muns: [], forte: true }) : x.lugar;
      if (ctx.lugar.tipo === "br") x.br = true;
      if (!x.intencao && ctx.sec && x.turno) x.sec = ctx.sec;
    }
    if (x.intencao === "comparar" && ctx.lugares && novoLugar && (!x.lugares || x.lugares.length < 2)) {
      const novo = x.lugar.muns.length ? Object.assign({ tipo: "mun" }, x.lugar.muns[0]) : x.lugar.uf ? { tipo: "uf", uf: x.lugar.uf, nome: nomeUf(x.lugar.uf) } : null;
      if (novo) x.lugares = ctx.lugares.slice(0, 3).concat([novo]);
    }
    x.continuou = true;
    return x;
  }

  // --- saudação, obrigado e tchau ---------------------------------------------------------------------------------------
  const CORTESIA = [
    ["dia", "bo[mn] dia|bons dias|buen dia|buenos dias|good morning|morning", 1],
    ["tarde", "boa tarde|buenas tardes|good afternoon|afternoon", 1],
    ["noite", "boa noite|buenas noches|good evening|evening", 1],
    ["ola", "ola+|alo+|alou|hello+|hola+|buenas|saludos|greetings|howdy", 1],
    ["oi", "oi+e*|hi+|hey+|eae|eai|e ai|ei|opa|hiya", 1],
    ["oi", "salve|fala|yo", 0],
    ["como", "tudo bem|tudo bom|tudo certo|tudo joia|tudo tranquilo|tudo beleza|td bem|td bom|tdb|como vai(?: voce| vc)?|how are you(?: doing)?|how are things|como estas|como esta usted|todo bien", 1],
    ["como", "como (?:voce |vc )?esta(?: voce| vc)?|beleza|blz|suave|tranquilo|de boa|e voce|e vc|and you|y tu|y usted|how s it going|how is it going|what s up|whats up|wassup|sup|que tal|como te va|como andas", 0],
    ["obg", "(?:muito |muitissimo )?obrigad[oa]s?|obg|brigad[oa]|valeu|vlw|agradeco|(?:thank you|thanks)(?: (?:a lot|so much|very much))?|thx|ty|(?:muchas |mil )?gracias", 0],
    ["tchau", "tchau|xau|ate (?:mais|logo|breve|a proxima)|falou|flw|bye|goodbye|good bye|see you|see ya|adios|chao|hasta (?:luego|pronto|la proxima)|nos vemos", 0],
    ["", "atlas|bot|amigo|amiga|pessoal|galera|gente|todo mundo|a todos|todos|there|all|everyone|guys|ok|okay|okey|certo|entendi|show|legal|otimo|perfeito|great|perfect|cool|nice|vale|bueno|genial|perfecto|e|and|y|muito|very|tambem|too|tambien", 1],
  ].map(([k, f, p]) => [k, new RegExp(`^(?:${f})(?: |$)`), p]);
  const SAUDA = ["dia", "tarde", "noite", "ola", "oi", "como"];
  // null: não é cortesia. so: a mensagem é só cortesia. Senão "resto" é o texto original depois da saudação.
  function cortesia(texto) {
    const t = String(texto || "").trim();
    let n = norm(t);
    if (!n) return /👋|🙋|✋|🖐/u.test(t) ? { tipos: ["oi"], so: true } : /🙏/u.test(t) ? { tipos: ["obg"], so: true } : null;
    const tipos = new Set();
    let antes = true;
    for (let c; (c = CORTESIA.find(([, re]) => re.test(n)));) {
      if (c[0]) tipos.add(c[0]);
      if (!c[2]) antes = false;
      n = n.slice(n.match(c[1])[0].length);
    }
    if (!tipos.size) return null;
    if (!n) return { tipos: [...tipos], so: true };
    if (!antes || !SAUDA.some((k) => tipos.has(k))) return null;
    const k = norm(t).split(" ").length - n.split(" ").length;
    const resto = t.replace(new RegExp(`^(?:[^\\p{L}\\p{N}]*[\\p{L}\\p{N}]+){${k}}[^\\p{L}\\p{N}]*`, "u"), "");
    return resto ? { tipos: [...tipos], so: false, resto } : { tipos: [...tipos], so: true };
  }

  // --- conversa: comandos sobre a última resposta ----------------------------------------------------------------------
  // "Atlas, por favor, resume isso agora" → "resume isso": tira o que é só educação ou enchimento nas pontas
  function enxuto(n) {
    let x = String(n).trim(), antes;
    do {
      antes = x;
      x = x.replace(/^(?:atlas|por favor|please|pls|pf|porfa|agora|now|ahora|entao|ok|okay|certo|bem|well|bueno|hey|ei|oi|e ai|e|and|y|tambem|also)\s+/, "")
        .replace(/\s+(?:por favor|please|pls|pf|porfa|agora|now|ahora|ai|ae|aqui|pra mim|para mim|for me|para mi|rapidinho|de novo|again|otra vez)$/, "");
    } while (x !== antes);
    return x;
  }
  const IDIOMAS = [["EN", /^(?:ingles|english|ingl)$/], ["ES", /^(?:espanhol|spanish|espanol|castelhano|castellano)$/], ["PT", /^(?:portugues|portuguese|portugu)$/]];
  const CMD = [
    ["conversa", /^(?:(?:faz|faca|me da|me de|da|de)\s+)?(?:um\s+)?(?:resumo|resume|resuma|resumir)\s+(?:d[aeo]\s+|a\s+|toda\s+(?:a\s+)?)?(?:nossa\s+|esta\s+|essa\s+)?conversa$|^(?:do |sobre o )?que (?:a gente |nos )?(?:ja )?(?:falamos|conversamos|vimos|consultamos)(?: ate agora)?$|^(?:summarize|summarise|recap)\s+(?:the|our|this)\s+(?:conversation|chat)$|^what (?:did|have) we (?:talk(?:ed)? about|discuss(?:ed)?|covered?|seen)(?: so far)?$|^(?:resume|resumen de|haz un resumen de)\s+(?:la|nuestra|esta)\s+conversacion$|^de que (?:hemos )?(?:hablado|hablamos)(?: hasta ahora)?$/],
    ["resumo", /^(?:(?:faz|faca|me da|me de|da|de|quero|gera|gere|cria|crie)\s+)?(?:um\s+|o\s+)?(?:resumo|resume|resuma|resumir|resumindo|em resumo|resumidamente|tl ?dr)(?:\s+(?:isso|isto|disso|disto|a resposta|essa resposta|esta resposta|da resposta|dessa resposta))?$|^(?:summarize|summarise|sum up|sum it up|recap|summary|give me a summary|tl ?dr)(?:\s+(?:it|this|that|the answer))?$|^(?:resumelo|resumen|hazme un resumen|un resumen|resumir|resume)(?:\s+(?:eso|esto|la respuesta))?$/],
    ["simples", /^(?:(?:me\s+)?(?:explica|explique|explicar|fala|fale|diz|diga|escreve|escreva|repete|repita)\s+)?(?:isso\s+|isto\s+)?(?:(?:de\s+(?:um\s+)?(?:jeito|forma|modo|maneira)|em\s+(?:palavras|linguagem|termos)|com\s+palavras)\s+)?(?:mais\s+)?(?:simples|facil|faceis|simplificad[oa]|clar[oa])$|^(?:simplifica|simplifique|simplificar)(?:\s+(?:isso|isto|a resposta))?$|^(?:nao|n)\s+(?:entendi|entendo|compreendi|ficou claro|to entendendo|estou entendendo)(?:\s+(?:nada|direito|bem|isso|a resposta))?$|^como assim$|^(?:explica|explique|explain|explicame)(?:\s+(?:melhor|isso|isto|better|it|that|mejor))?$|^(?:para|pra)\s+leigos?$|^(?:explica|explique)\s+(?:como|pra|para)\s+(?:se eu fosse|uma?)\s.*$|^(?:explain|say|put)\s+(?:it\s+|that\s+|this\s+)?(?:in\s+(?:simple|plain|simpler)\s+(?:terms|words|english|language)|(?:more\s+)?simply|simpler|like i m \d+)$|^(?:i\s+)?(?:don t|do not|didn t|did not|dont|didnt)\s+(?:understand|get it|get that)(?:\s+(?:it|that|this|anything))?$|^what do you mean$|^(?:simpler|simplify|simplify it|in plain english|eli5)$|^(?:explica|explicame|explicalo|dimelo|dime)\s+(?:mas\s+)?(?:simple|facil|sencillo|mejor|claro)$|^(?:en\s+(?:palabras|terminos)\s+(?:simples|sencillas|sencillos)|mas\s+(?:simple|sencillo|facil))$|^no\s+(?:entendi|entiendo|comprendo)(?:\s+(?:nada|bien|eso))?$|^como asi$|^simplificalo$/],
    ["detalhes", /^(?:me\s+)?(?:(?:da|de|mostra|mostre|quero|traz|traga|ver)\s+)?(?:mais\s+detalhes|mais\s+informac\w*|mais\s+info|detalhes|os detalhes)(?:\s+(?:sobre isso|disso))?$|^(?:detalha|detalhe|detalhar|aprofunda|aprofunde|aprofundar|expande|expanda|expandir)(?:\s+(?:isso|mais|a resposta))?$|^(?:me\s+)?(?:fala|fale|conta|conte|diz|diga)\s+mais(?:\s+(?:sobre isso|disso))?$|^(?:more\s+(?:details|detail|info|information)|(?:give me|show me)\s+more\s+(?:details|info)|tell me more|go deeper|in detail|details|elaborate|expand(?: on (?:it|that))?)$|^(?:mas\s+(?:detalles|informacion|info)|dame mas detalles|detalles|cuentame mas|dime mas|profundiza|amplia|en detalle)$/],
    ["numeros", /^(?:(?:mostra|mostre|quero|me da|me de|deixa)\s+)?(?:so|somente|apenas)\s+(?:os\s+)?(?:numeros|dados|valores)$|^sem texto$|^(?:(?:show me|give me)\s+)?(?:just|only)\s+(?:the\s+)?(?:numbers|data|figures)$|^(?:numbers|figures)\s+only$|^(?:solo|solamente)\s+(?:los\s+)?(?:numeros|datos|valores)$|^sin texto$/],
    ["mais", /^(?:(?:mostra|mostre|me mostra|ver|veja|quero ver|traz|traga|lista|liste|show|show me|see|give me|muestra|muestrame|dame)\s+)?(?:(?:os|as|the|los|las)\s+)?(?:mais|outros|outras|os proximos|as proximas|proximos|proximas|o resto|os demais|as demais|the next|next|more|the rest|the others|others|otros|otras|los siguientes|las siguientes|siguientes|el resto|mas)(?:\s+(\d{1,3}))?(?:\s+(?:itens|linhas|lugares|resultados|municipios|cidades|estados|zonas|secoes|items|rows|results|places|cities|states|zones|sections|ciudades|secciones))?$|^(?:(?:mostra|mostre|me mostra|ver|show|show me|see|give me|muestra|muestrame|dame)\s+)?(?:mais\s+|more\s+|mas\s+)?(\d{1,3})\s+(?:a mais|mais|more|mas|outros|outras|others|otros|otras)(?:\s+(?:itens|linhas|lugares|resultados|items|rows|results|places|resultados))?$|^(?:ver|see|load|carregar|cargar)\s+mais$|^(?:continua|continue|continuar|sigue|segue)$/],
    ["inverter", /^(?:(?:mostra|mostre|coloca|coloque|poe|ponha|ordena|ordene|show|sort|put|muestra|ordena)\s+)?(?:(?:em|na|in|en)\s+)?(?:ordem\s+)?(?:inversa|invertida|contraria|reverse(?:d)?(?:\s+order)?|orden\s+inverso|al reves|ao contrario|do contrario)$|^(?:inverte|inverta|inverter|invert|reverse|flip|invierte|invertir)(?:\s+(?:a ordem|a lista|o ranking|isso|it|the order|the list|el orden|la lista))?$/],
    ["asc", /^(?:(?:mostra|mostre|agora|show|now|muestra|ahora|ver)\s+)?(?:(?:os|as|the|los|las)\s+)?(?:menores|de baixo|ultimos|ultimas|lowest|bottom|smallest|last ones|bottom ones)$|^(?:do|de)\s+menor\s+(?:para|pro|ao|a)\s+(?:o\s+)?mayor$|^do menor (?:para|pro|ao) (?:o )?maior$|^(?:from\s+)?(?:lowest|smallest) to (?:highest|largest)$/],
    ["desc", /^(?:(?:mostra|mostre|agora|show|now|muestra|ahora|ver)\s+)?(?:(?:os|as|the|los|las)\s+)?(?:maiores|de cima|highest|top ones|largest|mayores)$|^do maior (?:para|pro|ao) (?:o )?menor$|^(?:from\s+)?(?:highest|largest) to (?:lowest|smallest)$|^de mayor a menor$/],
    ["errado", /^(?:nao|n)\s+(?:foi|e|era)\s+(?:isso|isto|bem isso|o que eu (?:perguntei|pedi|queria))(?:\s+que eu (?:perguntei|pedi|queria))?$|^(?:ta|esta|isso esta|isso ta|voce)\s+(?:errad[oa]|enganad[oa])$|^(?:errado|errada|resposta errada|entendeu errado|voce entendeu errado|nao entendeu|voce nao entendeu|nada a ver|nao tem nada a ver)$|^(?:that s|this is|that is|it s|thats|its)\s+(?:wrong|not (?:it|right|what i (?:asked|meant|wanted)))$|^(?:wrong|wrong answer|not what i (?:asked|meant|wanted)|you misunderstood|you got it wrong|no that s not it)$|^(?:no\s+)?(?:es|era)\s+eso$|^(?:eso no es|no es eso|no era eso|esta mal|incorrecto|respuesta incorrecta|no entendiste|entendiste mal|nada que ver)$/],
    ["sim", /^(?:sim|s|ss|quero|quero sim|claro|claro que sim|pode|pode ser|pode sim|bora|vamos|manda|manda ver|ok|okay|ok pode|beleza|blz|isso|isso mesmo|com certeza|yes|yeah|yep|yup|sure|of course|go ahead|do it|ok sure|si|dale|vale|claro que si|por supuesto|venga|adelante)$/],
    ["nao", /^(?:nao|n|nao quero|nao obrigad[oa]|agora nao|deixa|deixa pra la|deixa para la|no|nope|no thanks|not now|no gracias|ahora no|mejor no|dejalo)$/],
  ];
  // Pedido sobre a resposta anterior ("resume", "mais 10", "agora em inglês"…): { k, n, lang }
  function comando(texto) {
    const raw = String(texto || "");
    let n = enxuto(numerar(norm(raw), B.lang));
    if (!n) return null;
    if (/^(?:(?:agora|now|ahora)\s+)?(?:(?:responde|responda|fala|fale|escreve|escreva|mostra|mostre|muda|mude|troca|troque|traduz|traduza|passa|passe|answer|reply|speak|write|switch|change|translate|show|habla|escribe|cambia|traduce|muestra)\s+)?(?:(?:tudo|it|this|isso|everything|todo|the answer|a resposta|la respuesta)\s+)?(?:(?:em|para|pro|pra|in|to|into|en|al|a)\s+)?(?:o\s+|el\s+)?[a-z]+$/.test(n)) {
      const ult = n.split(" ").pop(), l = IDIOMAS.find(([, re]) => re.test(ult));
      if (l && (n === ult || n.split(" ").length >= 2)) return { k: "idioma", lang: l[0] };
    }
    for (const [k, re] of CMD) {
      const m = n.match(re);
      if (m) { const d = m.slice(1).find((x) => x); return { k, n: d ? +d : null }; }
    }
    return null;
  }

  // --- referências: "o segundo da lista", "a anterior", "aquela seção" ---------------------------------------------------
  const ORD = { primeiro: 1, primeira: 1, segundo: 2, segunda: 2, terceiro: 3, terceira: 3, quarto: 4, quarta: 4, quinto: 5, quinta: 5, sexto: 6, sexta: 6, setimo: 7, setima: 7,
    oitavo: 8, oitava: 8, nono: 9, nona: 9, decimo: 10, decima: 10, ultimo: -1, ultima: -1, penultimo: -2, penultima: -2,
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, last: -1,
    primer: 1, primero: 1, tercer: 3, tercero: 3, tercera: 3, cuarto: 4, cuarta: 4, septimo: 7, septima: 7, octavo: 8, octava: 8, noveno: 9, novena: 9 };
  const sem = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const NAO_LISTA = "(?!\\s*(?:º|ª|°|o\\b|a\\b)?\\s*(?:turno|round|vuelta|teste|test|prueba|zona|zone|se[cç][aã]o|section|secci[oó]n|candidat\\w*|d[ií]gito|digit|vez|time)\\b)";
  const RE_ORD = [
    new RegExp(`(?<![\\p{L}\\p{N}])(?:(?:com|pelo|pela|para|pra|pro|sobre)\\s+)?(?:o|a|do|da|no|na|ao|à)\\s+(primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|sext[oa]|s[eé]tim[oa]|oitav[oa]|non[oa]|d[eé]cim[oa]|[uú]ltim[oa]|pen[uú]ltim[oa]|(\\d{1,2})\\s*[ºª°o]?)${NAO_LISTA}(?:\\s+(?:lugar|colocad[oa]|item|linha|op[cç][aã]o|resultado|da lista|do ranking|da tabela))*`, "iu"),
    new RegExp(`(?<![\\p{L}\\p{N}])the\\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last|(\\d{1,2})(?:st|nd|rd|th)?)${NAO_LISTA}(?:\\s+(?:one|item|place|row|result|option|on the list|in the list|of the list))*`, "iu"),
    new RegExp(`(?<![\\p{L}\\p{N}])(?:(?:con|sobre|para)\\s+)?(?:el|la|del|de la|al|en el|en la)\\s+(primer[oa]?|segund[oa]|tercer[oa]?|cuart[oa]|quint[oa]|sext[oa]|s[eé]ptim[oa]|octav[oa]|noven[oa]|d[eé]cim[oa]|[uú]ltim[oa]|pen[uú]ltim[oa]|(\\d{1,2})\\s*[ºª.]?)${NAO_LISTA}(?:\\s+(?:lugar|puesto|elemento|fila|resultado|de la lista|del ranking))*`, "iu"),
    /(?:#|\bitem\s+)(\d{1,2})\b()/iu,
  ];
  // Item de uma lista citado pela posição: { i (1, 2… ou -1 último), ini, fim } no texto original
  function ordinal(texto) {
    const t = String(texto || "");
    for (const re of RE_ORD) {
      const m = t.match(re);
      if (!m) continue;
      const w = sem(m[1]), i = m[2] ? +m[2] : /^\d+/.test(w) ? parseInt(w, 10) : ORD[w];
      if (i) return { i, ini: m.index, fim: m.index + m[0].length };
    }
    return null;
  }
  const ALVO = [["secao", /^(?:se[cç][aã]o|section|secci[oó]n)$/iu], ["zona", /^(?:zona|zone)$/iu], ["mun", /^(?:cidade|munic[ií]pio|city|municipality|town|ciudad|municipio)$/iu], ["uf", /^(?:estado|state)$/iu]];
  const alvoDe = (w) => { const a = ALVO.find(([, re]) => re.test(w || "")); return a ? a[0] : null; };
  // "a anterior", "o lugar anterior", "the previous one", "la anterior"
  function anterior(texto) {
    const t = String(texto || "");
    const m = t.match(/(?<![\p{L}\p{N}])(?:(?:com|para|pra|pro|volta(?:r)?\s+(?:para|pra|a|ao))\s+)?(?:o|a|do|da|no|na|ao|à)\s+(?:(lugar|cidade|munic[ií]pio|estado|se[cç][aã]o|zona)\s+)?(?:anterior|de antes)\b/iu)
      || t.match(/(?<![\p{L}\p{N}])(?:(?:with|to|back to)\s+)?the\s+(?:(place|city|municipality|state|section|zone)\s+)?(?:previous|prior|one before)(?:\s+(?:one|place|city|state|section|zone))?\b/iu)
      || t.match(/(?<![\p{L}\p{N}])(?:(?:con|a|volver a|vuelve a)\s+)?(?:el|la|del|de la|al|en el|en la)\s+(?:(lugar|ciudad|municipio|estado|secci[oó]n|zona)\s+)?anterior\b/iu);
    if (!m) return null;
    const alvo = alvoDe(m[1]) || (/\b(?:place|city|municipality|state|section|zone)\b/i.test(m[0]) ? alvoDe((m[0].match(/\b(place|city|municipality|state|section|zone)\b/i) || [])[1]) : null);
    return { ini: m.index, fim: m.index + m[0].length, alvo };
  }
  // "aquela seção", "dessa cidade", "nesse estado", "that section", "esa ciudad"
  function demonstrativo(texto) {
    const t = String(texto || "");
    const m = t.match(/(?<![\p{L}\p{N}])(aquel[ae]|ess[ae]|est[ae]|dess[ae]|dest[ae]|daquel[ae]|ness[ae]|nest[ae]|naquel[ae])\s+(se[cç][aã]o|cidade|munic[ií]pio|estado|zona)\b/iu)
      || t.match(/(?<![\p{L}\p{N}])(that|this)\s+(section|city|municipality|town|state|zone)\b/iu)
      || t.match(/(?<![\p{L}\p{N}])(aquel(?:la)?|es[ae]|est[ae]|de es[ae]|de est[ae]|en es[ae]|en est[ae])\s+(secci[oó]n|ciudad|municipio|estado|zona)\b/iu);
    if (!m) return null;
    const p = sem(m[1]);
    return { ini: m.index, fim: m.index + m[0].length, alvo: alvoDe(m[2]), longe: /^(?:aquel|daquel|naquel)/.test(p), prep: /^d/.test(p) ? "de" : /^(?:n|en )/.test(p) ? "em" : "" };
  }

  // --- várias tarefas numa mensagem: "relatório de Curitiba, compara com Londrina e gera as imagens" ---------------------
  const VERBOS = ("gera gere gerar cria crie criar faz faca fazer monta monte exporta exporte exportar salva salve salvar compara compare comparar mostra mostre mostrar me mostra abre abra abrir "
    + "baixa baixe baixar le leia ler compartilha compartilhe compartilhar manda mande envia envie explica explique resume resuma lista liste calcula calcule imprime imprima traduz traduza "
    + "quero transforma transforme coloca coloque depois "
    + "generate make create export save compare show open download read share send explain summarize list calculate print translate put "
    + "genera crea haz exporta guarda muestra muestrame abre descarga lee comparte envia resume calcula imprime traduce dame").split(" ");
  const RE_VERBO = new RegExp(`^(?:${VERBOS.join("|")})\\b`);
  const RE_OBJETO = /^(?:o|a|os|as|um|uma|the|an?|el|la|los|las|un|una)\s+(?:relatorio|report|informe|mapa|map|ranking|imagem|imagens|image|images|imagen|video|videos|carrossel|carousel|carrusel|pdf|resumo|summary|resumen|grafico|chart|comparacao|comparison|comparacion)\b/;
  const RE_FORTE = /\s*;\s*|\s*,?\s+(?:e\s+)?(?:depois(?:\s+disso)?|em\s+seguida|ent[aã]o|and\s+then|then|after\s+that|afterwards|y\s+luego|luego|y\s+despu[eé]s|despu[eé]s|a\s+continuaci[oó]n)\s+/iu;
  function etapas(texto) {
    const out = [];
    String(texto || "").split(RE_FORTE).forEach((parte) => {
      if (!parte || !parte.trim()) return;
      const re = /,\s*|\s+(?:e|and|y)\s+/g;
      let ini = 0, m;
      while ((m = re.exec(parte))) {
        const depois = norm(parte.slice(m.index + m[0].length));
        if (RE_VERBO.test(depois) || (m[0].trim() !== "," && RE_OBJETO.test(depois))) { out.push(parte.slice(ini, m.index)); ini = m.index + m[0].length; }
      }
      out.push(parte.slice(ini));
    });
    return out.map((x) => x.trim().replace(/^(?:(?:e|and|y)\s+)?(?:(?:depois|ent[aã]o|then|luego|despu[eé]s|em seguida)\s+)?/iu, "").replace(/[,;.]+$/, "").trim()).filter((x) => norm(x)).slice(0, 5);
  }

  // --- ações sobre a resposta: imagem, vídeo, carrossel, exportar, ouvir, compartilhar, copiar, abrir uma página ----------
  const FMT_EXP = [["slides", /\b(?:apresentacao animada|slides?|slideshow|animated presentation|presentacion animada)\b/], ["pptx", /\b(?:pptx|ppt|powerpoint|power point|apresentacao|apresentacoes|presentation|presentacion)\b/],
    ["docx", /\b(?:docx|word|documento word)\b/], ["xlsx", /\b(?:xlsx|xls|excel|planilha|planilhas|spreadsheet|hoja de calculo)\b/], ["csv", /\bcsv\b/], ["png", /\b(?:png|imagem longa|imagem vertical|long image|imagen larga)\b/],
    ["txt", /\b(?:txt|texto puro|texto simples|plain text|texto plano|bloco de notas)\b/], ["md", /\b(?:markdown|md)\b/], ["json", /\bjson\b/], ["html", /\b(?:html|pagina interativa|pagina web|interactive page|web page|pagina interactiva)\b/],
    ["pdf", /\bpdf\b/]];
  const RE_V_EXP = /\b(?:exporta|exporte|exportar|export|salva|salve|salvar|save|guarda|guardar|baixa|baixe|baixar|download|descarga|descargar|gera|gere|gerar|cria|crie|criar|transforma|transforme|converte|converta|manda|mande|quero|generate|create|convert|turn|genera|crea|convierte|dame|me da|faz|faca|make|haz)\b/;
  const RE_V_MIDIA = /\b(?:gera|gere|gerar|cria|crie|criar|faz|faca|fazer|monta|monte|montar|produz|produza|transforma|transforme|converte|quero|queria|preciso|manda|mande|make|create|generate|build|produce|turn|convert|want|need|genera|generar|crea|crear|haz|hacer|arma|convierte|quiero|necesito|dame|me da|me de|tira|tire)\b/;
  const RE_DL_COISA = /\b(?:motor|codigo|code|script|log|logs|manifesto|manifest|sinalizadas|flagged|senaladas|nucleo|core|busca urnas|pacote|package|zip|tudo|everything|todo|tecnico|technical|1o turno|2o turno|turno|round|vuelta|auditoria|audit)\b/;
  const RE_PERGUNTA_COMO = /^(?:como|how|what|o que|que|qual|quais|cual|cuales|onde|where|donde|da para|tem como|can i|can you|could you|posso|pode|e possivel|is it possible|se puede|puedo|puedes|why|por que|porque)\b/;
  const REDES = [["whatsapp", /\b(?:whatsapp|whats|zap|zapzap|wpp|wa)\b/], ["telegram", /\btelegram\b/], ["x", /\b(?:twitter|x)\b/], ["email", /\b(?:email|e mail|correo|gmail|mail)\b/],
    ["instagram", /\b(?:instagram|insta|ig|reels?)\b/], ["tiktok", /\btik ?tok\b/], ["kwai", /\bkwai\b/], ["youtube", /\b(?:youtube|yt|shorts)\b/], ["facebook", /\b(?:facebook|face|fb)\b/]];
  const PAGINAS = [["#/turno/1", /\b(?:1o? turno|primeiro turno|first round|round 1|1st round|primera vuelta|1a vuelta)\b/], ["#/turno/2", /\b(?:2o? turno|segundo turno|second round|round 2|2nd round|segunda vuelta|2a vuelta)\b/],
    ["#/downloads", /\b(?:downloads?|descargas)\b/], ["#/testes", /\b(?:testes|tests|pruebas)\b/], ["#/graficos", /\b(?:graficos|charts|graficas)\b/], ["#/glossario", /\b(?:glossario|glossary|glosario)\b/],
    ["#/limitacoes", /\b(?:limitacoes|limitations|limitaciones)\b/], ["#/replicar", /\b(?:replicar|replicate|replication|replicacion)\b/], ["#/atualizacoes", /\b(?:atualizacoes|updates|actualizaciones|novidades|news)\b/],
    ["#/lista", /\b(?:lista de secoes|secoes sinalizadas|secoes marcadas|flagged sections|secciones senaladas|lista)\b/], ["#/variacao", /\b(?:variacao|variation|variacion)\b/], ["#/mapa", /\b(?:mapa|map)\b/],
    ["#/", /\b(?:inicio|home|pagina inicial|homepage|pagina principal|inicial)\b/], ["lugar", /\b(?:pagina|page)\b/]];
  const RE_SITE = /\b(?:sitio web|sitios web|sitios|sitio|web site|websites|website|sites|site|landing page|mini ?site)\b/;
  const RE_ABRIR = /\b(?:abre|abra|abrir|vai para|va para|vai pra|va pra|ir para|ir pra|me leva|leva para|leva pra|open|go to|take me to|navigate to|ir a|ve a|llevame a|llevame)\b/;
  const RESTO_FORA = new Set(("de do da dos das of the a o as os um uma uns umas an el la los las un una em no na in en com with con e and y pra para pro to for por me mim isso isto it this that eso esto essa esse esta este "
    + "dessa desse desta deste resposta answer respuesta conversa conversation conversacion tambem also tambien agora now ahora tudo all todo formato format arquivo file archivo como as also la lo le "
    + "pf favor please porfa uma vez de novo nele nela ela ele it them eles elas ai ae aqui ali").split(" "));
  // { lista: [{ k, … }], resto, todas } · resto: o pedido sem as palavras da ação ("gera a imagem do relatório de Curitiba" → "relatório de Curitiba")
  function acoes(texto) {
    const raw = String(texto || "").trim();
    const pal = raw.split(/\s+/), nw = pal.map((w) => norm(w));
    let s = "", pos = [];
    nw.forEach((w, i) => { if (!w) return; if (s) s += " "; pos.push([s.length, s.length + w.length, i]); s += w; });
    const n = " " + s + " ";
    const lista = [], tira = new Set();
    const marcar = (re) => { const g = new RegExp(re.source, "g"); let m; while ((m = g.exec(s))) { const a = m.index, b = a + m[0].length; pos.forEach(([x, y, i]) => { if (x < b && y > a) tira.add(i); }); if (!m[0].length) g.lastIndex++; } };
    if (RE_PERGUNTA_COMO.test(s)) return { lista, resto: raw, todas: false };
    const todas = /\b(?:conversa|conversation|conversacion|tudo que falamos|toda a conversa|whole chat|chat inteiro)\b/.test(n);
    // imagem, story, vídeo, carrossel
    const carr = /\b(?:carrossel|carrosseis|carrosel|carousel|carousels|carrusel|carruseles)\b/.test(n);
    const video = /\b(?:videos?)\b/.test(n), story = /\b(?:story|stories|storie)\b/.test(n);
    const imagem = /\b(?:imagem|imagens|image|images|imagen|imagenes|card|cartao|post|figura|arte)\b/.test(n) || (B.lang !== "EN" && /\bprint\b/.test(n));
    const qr = /\b(?:qr|boletim|cedula|ballot|boletin|camera|foto do)\b/.test(n);
    // site com as respostas da conversa ("cria um site com esses dados", "make a website")
    const site = RE_SITE.test(n) && !/\b(?:tse|oficial|official|justica eleitoral|deste site|desse site|this site|este sitio|del sitio)\b/.test(n)
      && (RE_V_MIDIA.test(n) || /\b(?:em|como|in|as|into|en|para|pra|to|num|numa)\s+(?:um\s+|uma\s+|an?\s+|un\s+)?(?:site|website|sitio)\b/.test(n));
    if (site) {
      lista.push({ k: "site" });
      marcar(RE_SITE); marcar(/\b(?:html|zip|github|pages|com|with|con|esses|essas|estes|estas|these|those|estos|esos|esas|dados|data|datos|respostas|answers|respuestas|completo|complete|pronto|ready|estatico|static)\b/);
    } else if (carr) {
      const tam = /\b(?:9 ?16|9x16|vertical|stories?|reels?|tiktok)\b/.test(n) ? "916" : /\b(?:1 ?1|1x1|quadrad\w*|square|cuadrad\w*)\b/.test(n) ? "11" : /\bpdf\b/.test(n) && !video ? "pdf" : /\b(?:4 ?5|4x5|feed)\b/.test(n) ? "45" : null;
      lista.push({ k: "midia", fmt: "carrossel", tipo: video ? "vid" : "img", tam });
      marcar(/\b(?:carrossel|carrosseis|carrosel|carousel|carousels|carrusel|carruseles|videos?|de|em|in|en|of|com|with|con|imagens|images|imagenes|9 ?16|9x16|1 ?1|1x1|4 ?5|4x5|vertical|quadrad\w*|square|cuadrad\w*|feed|stories?|reels?|tiktok|pdf)\b/);
    } else if ((video || story || imagem) && !qr && (RE_V_MIDIA.test(n) || /\b(?:em|como|in|as|en|uma?|o|a|the|an?|el|la|un)\s+(?:videos?|imagem|image|imagen|story|card|post)\b/.test(n))) {
      lista.push({ k: "midia", fmt: video ? "video" : story ? "story" : "post" });
      marcar(/\b(?:videos?|story|stories|storie|imagem|imagens|image|images|imagen|imagenes|card|cartao|post|figura|arte|print)\b/);
    }
    // exportar em um formato
    if (!site && (!lista.length || !/\bpdf\b/.test(n) || lista[0].fmt !== "carrossel")) {
      const fx = FMT_EXP.find(([, re]) => re.test(n));
      if (fx && !RE_DL_COISA.test(n) && (RE_V_EXP.test(n) || new RegExp(`\\b(?:em|no|na|in|en|como|as|para|to|into|formato|format)\\s+(?:um\\s+|uma\\s+|an?\\s+|el\\s+|la\\s+)?(?:${fx[1].source.replace(/\\b/g, "")})`).test(n))) {
        lista.push({ k: "exportar", fmt: fx[0], todas });
        marcar(fx[1]); marcar(/\b(?:exporta|exporte|exportar|export|salva|salve|salvar|save|guarda|guardar|baixa|baixe|baixar|download|descarga|descargar|transforma|transforme|converte|converta|convert|convierte|formato|format|arquivo|file|archivo|documento)\b/);
      }
    }
    if (/\b(?:imprime|imprima|imprimir|imprimelo)\b/.test(n) || (B.lang === "EN" && /^print\b/.test(s))) { lista.push({ k: "exportar", fmt: "pdf", todas }); marcar(/\b(?:imprime|imprima|imprimir|imprimelo|print)\b/); }
    // ouvir
    if (/\b(?:le|leia|ler|read|lee|leer|leelo|narra|narre|narrar|fala|fale|falar|diz|diga|say|speak|habla)\b.*\b(?:voz alta|em voz|out loud|aloud|en voz alta|em audio|in audio)\b|\b(?:ouvir|escutar|listen|escuchar|ouca|oir)\b|^(?:le|leia|read|lee|leelo|narra|narre)(?:\s+(?:isso|isto|it|this|a resposta|the answer|eso|esto|la respuesta|pra mim|para mim|for me|para mi))?$/.test(s)) {
      lista.push({ k: "ouvir" });
      marcar(/\b(?:em voz alta|en voz alta|voz alta|em voz|le|leia|ler|read|lee|leer|leelo|narra|narre|narrar|fala|fale|falar|diz|diga|say|speak|habla|alta|alto|out loud|aloud|en voz alta|em audio|in audio|ouvir|escutar|listen|escuchar|ouca|oir|quero|want|quiero)\b/);
    }
    // compartilhar e copiar
    const rede = REDES.find(([, re]) => re.test(n));
    if (/\b(?:compartilha|compartilhe|compartilhar|comparte|compartir|compartelo)\b/.test(n) || /^share\b|\bshare (?:it|this|that|the answer|the chat|on|via|to|with)\b/.test(s) || (rede && /\b(?:manda|mande|mandar|envia|envie|enviar|send|envialo|posta|poste|postar|post)\b/.test(n))) {
      lista.push({ k: "compartilhar", rede: rede ? rede[0] : null, todas });
      marcar(/\b(?:compartilha|compartilhe|compartilhar|share|comparte|compartir|compartelo|manda|mande|mandar|envia|envie|enviar|send|envialo|posta|poste|postar|whatsapp|whats|zap|zapzap|wpp|telegram|twitter|email|e mail|correo|gmail|mail|instagram|insta|reels?|tik ?tok|kwai|youtube|shorts|facebook|fb|pelo|pela|por|via|no|na|on|in|en|pro|pra|para|to)\b/);
    }
    if (/\b(?:copia|copie|copiar|copy|copialo)\b/.test(n)) { lista.push({ k: "copiar", link: /\b(?:link|endereco|url|enlace)\b/.test(n) }); marcar(/\b(?:copia|copie|copiar|copy|copialo|link|endereco|url|enlace)\b/); }
    // abrir uma página do site
    if (RE_ABRIR.test(n)) {
      const pg = PAGINAS.find(([, re]) => re.test(n));
      if (pg) {
        const temLugar = pg[0] === "#/mapa" && (() => { const lg = lugar(raw); return !!(lg.uf || lg.muns.length); })();
        // "a página do município" (ou do estado, da seção): de que tipo é o lugar
        const alvo = pg[0] !== "lugar" ? null : /\b(?:municipio|cidade|city|municipality|town|ciudad)\b/.test(n) ? "mun" : /\b(?:estado|state)\b/.test(n) ? "uf" : /\b(?:secao|section|seccion)\b/.test(n) ? "secao" : null;
        if (!temLugar) { lista.push({ k: "abrir", destino: pg[0], alvo }); marcar(RE_ABRIR); marcar(pg[1]); marcar(/\b(?:pagina|page|a|o|the|la|el|do|da|de|of|del|municipio|cidade|city|municipality|town|ciudad|estado|state|secao|section|seccion)\b/); }
      }
    }
    if (!lista.length) return { lista, resto: raw, todas };
    marcar(RE_V_MIDIA); marcar(RE_V_EXP);
    const ficam = pal.filter((w, i) => !tira.has(i) && nw[i]);
    while (ficam.length && RESTO_FORA.has(norm(ficam[0]))) ficam.shift();
    while (ficam.length && RESTO_FORA.has(norm(ficam[ficam.length - 1]))) ficam.pop();
    const resto = ficam.join(" ").replace(/[,;:.!?]+$/, "").trim();
    return { lista, resto: tokens(resto).length ? resto : "", todas };
  }

  // --- contas: média, soma, mediana, maior, menor, quantos; limiares; diferença entre dois lugares; conta simples ---------
  const MAG = { mil: 1e3, thousand: 1e3, k: 1e3, milhao: 1e6, milhoes: 1e6, million: 1e6, millions: 1e6, millon: 1e6, millones: 1e6, mi: 1e6, bilhao: 1e9, bilhoes: 1e9, billion: 1e9 };
  // Números do texto: "100.000", "25,5", "1.2" viram um token só ("100000", "25d5", "1d2"); "%" vira " pct "
  function prepNumeros(texto) {
    let t = String(texto || "");
    if (B.lang === "EN") t = t.replace(/(\d{1,3}(?:,\d{3})+)(?!\d)/g, (m) => m.replace(/,/g, "")).replace(/(\d)\.(\d)/g, "$1d$2");
    else t = t.replace(/(\d{1,3}(?:\.\d{3})+)(?!\d)/g, (m) => m.replace(/\./g, "")).replace(/(\d),(\d)/g, "$1d$2").replace(/(\d)\.(\d)/g, "$1d$2");
    t = t.replace(/(\d+(?:d\d+)?)\s*(k|mil|milh[õo]es|milh[ãa]o|millions?|mill[oó]n|millones|bilh[õo]es|bilh[ãa]o|billions?|thousand|mi)(?![\p{L}\d])/giu, (m, a, b) => {
      const k = norm(b), f = k === "k" || k === "mil" || k === "thousand" ? 1e3 : /^bil/.test(k) ? 1e9 : 1e6;
      return String(Math.round(valorNum(a) * f * 1000) / 1000).replace(".", "d");
    });
    return t.replace(/%/g, " pct ");
  }
  const valorNum = (tk) => parseFloat(String(tk).replace("d", "."));
  const REGIOES = { norte: ["AC", "AM", "AP", "PA", "RO", "RR", "TO"], nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"], centro: ["DF", "GO", "MT", "MS"], sudeste: ["ES", "MG", "RJ", "SP"], sul: ["PR", "RS", "SC"] };
  const RE_REG = [["nordeste", /\b(?:nordeste|northeast|north east|noreste)\b/], ["centro", /\b(?:centro oeste|centro-oeste|center west|central west|midwest|centro oeste)\b/], ["sudeste", /\b(?:sudeste|southeast|south east|sureste)\b/],
    ["norte", /\b(?:regiao norte|region norte|north region|norte|north)\b/], ["sul", /\b(?:regiao sul|region sur|south region|sul|south|sur)\b/]];
  const RE_CAPITAIS = /\b(?:capitais|capital|capitals|capitales)\b/;
  const OPS = [["mediana", /\b(?:mediana|median)\b/], ["media", /\b(?:media|medias|mean|average|avg|promedio)\b/], ["soma", /\b(?:soma|somatorio|somando|sum|suma|total de|totais de)\b/],
    ["max", /\b(?:maximo|maxima|maximum|maior valor|highest value|valor maximo|max)\b/], ["min", /\b(?:minimo|minima|minimum|menor valor|lowest value|valor minimo|min)\b/],
    ["conta", /\b(?:quantos|quantas|how many|cuantos|cuantas|numero de|number of|cantidad de)\b/]];
  const RE_GT = "(?:acima de|mais de|maior que|maior do que|superior a|mais que|pelo menos|no minimo|above|over|more than|greater than|at least|higher than|mas de|mayor que|por encima de|al menos|gt)";
  const RE_LT = "(?:abaixo de|menos de|menor que|menor do que|inferior a|no maximo|below|under|less than|fewer than|at most|lower than|por debajo de|como maximo|lt)";
  const NUMX = "(\\d+(?:d\\d+)?)\\s*(mil|milhao|milhoes|million|millions|millon|millones|mi|bilhao|bilhoes|billion|thousand)?\\s*(pct|por cento|porcento|percent|por ciento)?";
  const RE_DIF = /\b(?:diferenca|diferencas|difference|diferencia|quanto a mais|quantos a mais|quanto a menos|quantos a menos|how many more|how much more|how many fewer|cuanto mas|cuantos mas|a mais que|a mais do que|tem mais|teve mais|tiene mas|has more|had more)\b/;
  function medidaDe(trecho, cand) {
    const t = " " + trecho + " ";
    if (cand) return RE_CAND_PCT.test(t) || /\bpct\b/.test(t) ? "cand_pct" : "cand";
    for (const [k, rx] of MEDIDAS) if (rx.test(t)) return k === "secoes" ? null : k;
    if (/\b(?:secoes|sections|secciones)\b/.test(t) && !/\b(?:anomal|sinaliz|flag)/.test(t)) return "secoes";
    if (/\b(?:votos?|votes?|votantes)\b/.test(t)) return "comp";
    return null;
  }
  function grupoDe(n, lg) {
    const semUf = Object.values(B.ufNomes).reduce((s, v) => (typeof v === "string" ? [v] : Object.values(v)).reduce((x, nm) => x.split(" " + norm(nm) + " ").join(" "), s), n);
    const reg = (RE_REG.find(([, re]) => re.test(semUf)) || [])[0] || null;
    const capitais = RE_CAPITAIS.test(n), br = /\b(?:brasil|brazil|nacional|national|pais|country|todo o pais)\b/.test(n);
    let unidade = null;
    for (const [k, rx] of UNIDADES) if (rx.test(n)) { unidade = k; break; }
    if (capitais) unidade = "mun";
    if (!unidade) unidade = reg || br ? "uf" : lg.uf || lg.muns.length ? "mun" : null;
    if (unidade === "uf" && /\b(?:estado de|estado do|estado da|state of)\b/.test(n) && lg.uf && !reg) unidade = "mun";
    return { unidade, uf: lg.muns.length ? lg.muns[0].uf : lg.uf, regiao: reg, capitais, br: br && !lg.uf && !reg };
  }
  function conta(texto) {
    const raw = prepNumeros(texto);
    const n = " " + numerar(norm(raw), B.lang).replace(/\b(\d+) (\d{3})\b/g, "$1$2") + " ";
    const cand = candidatoDe(n);
    const turno = turnoDe(n);
    // limiares: "abstenção acima de 25%", "mais de 100 mil eleitores", "entre 70% e 80%"
    const conds = [];
    const reC = new RegExp(`\\b(?:(entre|between)\\s+${NUMX}\\s+(?:e|and|y|a)\\s+${NUMX}|(${RE_GT}|${RE_LT})\\s+(?:de\\s+|a\\s+|que\\s+)?${NUMX})`, "g");
    let m;
    while ((m = reC.exec(n))) {
      const ini = Math.max(n.lastIndexOf(" e ", m.index), n.lastIndexOf(" and ", m.index), n.lastIndexOf(" y ", m.index), n.lastIndexOf(" com ", m.index), n.lastIndexOf(" with ", m.index), n.lastIndexOf(" con ", m.index), n.lastIndexOf(",", m.index), 0);
      const resto = n.slice(m.index + m[0].length);
      const fimR = resto.search(/\s(?:e|and|y|com|with|con|no|na|em|in|en|do|da|de|of|del)\s/);
      const trecho = n.slice(ini, m.index) + " " + m[0] + " " + (fimR >= 0 ? resto.slice(0, fimR) : resto);
      const metrica = medidaDe(trecho.replace(/\b(?:mais|menos|maior|menor|more|less|mas)\b/g, " "), cand && new RegExp(`\\b(?:${norm(cand.nome).split(" ").filter((p) => p.length >= 4).join("|") || "x^"})\\b|\\b${cand.nr}\\b`).test(trecho) ? cand : null);
      if (!metrica) continue;
      if (m[1]) {
        const a = valorNum(m[2]) * (MAG[m[3]] || 1), b = valorNum(m[5]) * (MAG[m[6]] || 1), pct = !!(m[4] || m[7]) || /\bpct\b/.test(trecho);
        conds.push({ metrica, op: "bt", v: Math.min(a, b), v2: Math.max(a, b), pct });
      } else {
        const op = new RegExp(`^${RE_GT}$`).test(m[8]) ? "gt" : "lt", v = valorNum(m[9]) * (MAG[m[10]] || 1), pct = !!m[11] || /\bpct\b/.test(trecho);
        conds.push({ metrica, op, v, pct });
      }
    }
    const lg = lugar(texto);
    const g = grupoDe(n, lg);
    if (conds.length) {
      if (!g.unidade) g.unidade = "mun";
      return { tipo: "limiar", conds, grupo: g, turno, cand: cand ? { nr: cand.nr, nome: cand.nome } : null, conta: OPS[5][1].test(n) };
    }
    // diferença entre dois lugares numa medida
    const met = medidaDe(n.replace(/\b(?:mais|menos|maior|menor|more|less|mas|fewer)\b/g, " "), cand);
    if (RE_DIF.test(n) && met) {
      const ls = lugares(String(texto).replace(/\s(?:do que|que|than|than in)\s/gi, " x ")).filter((x) => !x.alternativas);
      if (ls.length >= 2) return { tipo: "dif", metrica: met, lugares: ls.slice(0, 2), turno, cand: cand ? { nr: cand.nr, nome: cand.nome } : null };
    }
    // média, soma, mediana, maior, menor e "quantos" num grupo de lugares
    const op = (OPS.find(([, re]) => re.test(n)) || [])[0];
    const temGrupo = g.capitais || g.regiao || /\b(?:municipios|cidades|estados|ufs|municipalities|cities|states|ciudades|capitais|capitals|capitales)\b/.test(n);
    if (!op || !(temGrupo || (op !== "conta" && (lg.uf || g.br) && !lg.muns.length))) return null;
    if (op === "conta") return { tipo: "limiar", conds: [], grupo: Object.assign(g, { unidade: g.unidade || "mun" }), turno, cand: null, conta: true, metrica: met };
    if (!met) return null;
    return { tipo: "agg", op, metrica: met, grupo: Object.assign(g, { unidade: g.unidade || "mun" }), turno, cand: cand ? { nr: cand.nr, nome: cand.nome } : null };
  }
  // Conta só com números: "quanto é 15% de 2 milhões", "1234 + 567", "(10 - 4) x 3"
  function calculo(texto) {
    let n = numerar(norm(prepNumeros(texto).replace(/[+]/g, " mais ").replace(/[*×]/g, " vezes ").replace(/[÷/]/g, " dividido ").replace(/(\d)\s*-\s*(\d)/g, "$1 menos $2")
      .replace(/\(/g, " abre ").replace(/\)/g, " fecha ").replace(/\^/g, " elevado ")), B.lang);
    n = enxuto(n).replace(/^(?:quanto e|quanto da|quanto que e|calcula|calcule|calcular|faz a conta|faca a conta|conta|how much is|what is|what s|whats|calculate|compute|cuanto es|cuanto da|calcula|haz la cuenta)\s+/, "");
    const tks = n.replace(/\b(\d+(?:d\d+)?) (mil|milhao|milhoes|million|millions|millon|millones|bilhao|bilhoes|billion|thousand)\b/g, (m, a, b) => String(valorNum(a) * MAG[b]).replace(".", "d")).split(" ").filter(Boolean);
    const OP = { mais: "+", plus: "+", menos: "-", minus: "-", vezes: "*", x: "*", times: "*", multiplicado: "*", por: "*", dividido: "/", divided: "/", elevado: "^", abre: "(", fecha: ")", pct: "%" };
    const SKIP = new Set(["por", "by", "a", "entre", "ao", "al", "to", "the", "of"]);
    const seq = [];
    for (let i = 0; i < tks.length; i++) {
      const w = tks[i];
      if (/^\d+(?:d\d+)?$/.test(w)) { seq.push(valorNum(w)); continue; }
      if (w === "por" && (tks[i - 1] === "dividido" || tks[i + 1] === "cento" || tks[i + 1] === "ciento")) { if (tks[i + 1] === "cento" || tks[i + 1] === "ciento") { seq.push("%"); i++; } continue; }
      if ((w === "de" || w === "of" || w === "del") && seq[seq.length - 1] === "%") { seq.push("de"); continue; }
      if (w === "percent" || w === "porcento") { seq.push("%"); continue; }
      if (OP[w]) { seq.push(OP[w]); continue; }
      if (SKIP.has(w) && seq.length) continue;
      return null;
    }
    if (seq.filter((x) => typeof x === "number").length < 2 && !(seq.includes("%") && seq.includes("de"))) return null;
    if (!seq.some((x) => typeof x === "string" && x !== "(" && x !== ")")) return null;
    // análise recursiva: soma > produto > potência > número, "%" e "% de"
    let i = 0;
    const ver = () => seq[i];
    function fator() {
      let x = ver();
      if (x === "(") { i++; const v = soma(); if (ver() === ")") i++; x = v; } else if (x === "-") { i++; x = -fator(); return x; } else if (typeof x === "number") i++; else throw new Error("conta");
      if (ver() === "%") { i++; x /= 100; if (ver() === "de") { i++; return x * fator(); } }
      if (ver() === "^") { i++; return Math.pow(x, fator()); }
      return x;
    }
    function produto() { let x = fator(); while (ver() === "*" || ver() === "/") { const o = seq[i++], y = fator(); x = o === "*" ? x * y : x / y; } return x; }
    function soma() { let x = produto(); while (ver() === "+" || ver() === "-") { const o = seq[i++], y = produto(); x = o === "+" ? x + y : x - y; } return x; }
    try { const v = soma(); if (i !== seq.length || !Number.isFinite(v)) return null; return { valor: v, seq }; } catch (e) { return null; }
  }

  // --- configuração e análise completa -------------------------------------------------------------------------------
  function configurar(o) {
    if (o.lang && o.lang !== B.lang) { B.lang = o.lang; B.stop = new Set(STOP[o.lang].split(" ")); B.kb = null; B.idx = null; }
    if (o.kb) { B.kb = o.kb; B.idx = null; B.byId = {}; o.kb.forEach((e) => { B.byId[e.i] = e; }); }
    if (o.muns) { B.muns = o.muns; B.lug = null; }
    if (o.ufNomes) { B.ufNomes = o.ufNomes; B.lug = null; }
    if (o.cands) B.cands = o.cands.filter((c) => c.nr !== "95" && c.nr !== "96");
  }
  // Tudo de uma vez: intenção, lugares e as respostas mais próximas da base
  function analisar(texto, ctx) {
    const E = continuar(entender(texto, ctx), ctx);
    E.conta = conta(texto);
    E.acoes = acoes(texto);
    const kb = buscar(texto);
    return { E, kb, forte: forte(kb) };
  }

  G.MOTOR = { configurar, analisar, entender, continuar, buscar, forte, tokens, norm, numerar, raiz, lev, similaridade, detectarSecao, secoes, turnoDe, lugar, lugares, cortesia,
    comando, ordinal, anterior, demonstrativo, etapas, acoes, conta, calculo, REGIOES,
    estado: () => ({ lang: B.lang, kb: !!B.kb, muns: !!B.muns }) };
})(typeof self !== "undefined" ? self : this);
