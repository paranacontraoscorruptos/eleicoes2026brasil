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
    const kb = buscar(texto);
    return { E, kb, forte: forte(kb) };
  }

  G.MOTOR = { configurar, analisar, entender, continuar, buscar, forte, tokens, norm, numerar, raiz, lev, similaridade, detectarSecao, secoes, turnoDe, lugar, lugares, cortesia,
    estado: () => ({ lang: B.lang, kb: !!B.kb, muns: !!B.muns }) };
})(typeof self !== "undefined" ? self : this);
