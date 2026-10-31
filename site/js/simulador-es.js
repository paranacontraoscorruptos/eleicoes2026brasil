/* Simulador de anomalías — textos en español. */
(function () {
  "use strict";
  const S = (window.SIM_TXT = window.SIM_TXT || {});
  const p = (x) => (x === 1 ? "" : "s");
  const pe = (x) => (x === 1 ? "" : "es");

  const ui = {
    titulo: "Simulador de anomalías", tag: "Página educativa · datos ficticios",
    sub: "Cambie números inventados y vea, al instante, cómo reacciona cada una de las 15 pruebas de la auditoría, por qué reacciona y qué significa.",
    aviso: "Simulación educativa con datos ficticios. Está estrictamente prohibido compartir estos resultados, para evitar la difusión de noticias falsas.",
    marca: "SIMULACIÓN · DATOS FICTICIOS",
    faixa: "SIMULACIÓN · DATOS FICTICIOS · prohibido compartir, copiar o imprimir",
    para_que: "Para qué sirve",
    para_que_l: ["Entender, sin fórmulas, qué comprueba cada prueba de la auditoría y cómo decide.",
      "Ver por qué una prueba enciende la luz y cómo sería el resultado normal.",
      "Descubrir que una anomalía estadística es un aviso para revisar, no una prueba: hay causas legítimas.",
      "Conocer los límites de cada prueba: cambios que no logra ver."],
    como: "Cómo funciona",
    como_l: ["Elija una prueba.", "Haga las misiones: cada una pide cambiar algo en el caso ficticio.", "Mire la luz de la prueba y lea la explicación sencilla o la técnica.", "Haga el examen de la prueba, acumule notas y haga el examen final."],
    tipos_t: "Tres tipos de misión",
    tipos: { s: "Haga que señale", a: "Falsa alarma", d: "Pasó inadvertido" },
    tipos_d: { s: "Usted cambia los datos ficticios hasta que la prueba enciende la luz.", a: "Una situación legítima que también enciende la luz. Muestra que una anomalía no es prueba.", d: "Un cambio que la prueba no logra ver. Muestra el límite de cada prueba." },
    boletim: "Su boletín de notas", boletim_sub: "Sus notas en cada examen y la nota final. Se guardan solo en este dispositivo.",
    boletim_resumo: (m, mt, pr, pt) => `${m} de ${mt} misiones hechas · ${pr} de ${pt} exámenes hechos.`,
    nota_final: "Nota final", ver_boletim: "Ver boletín de notas", perguntas: "Preguntas y respuestas", prova_final: "Examen final",
    niveis: { boletim: "El boletín", secao: "La sección comparada con su región", local: "El local de votación", cidade: "La ciudad entera" },
    niveis_d: { boletim: "Pruebas que revisan el propio boletín: cuentas, horarios y la urna usada.", secao: "Pruebas que comparan una sección con las secciones parecidas de la misma región.", local: "Pruebas que comparan secciones del mismo local de votación o buscan copias.", cidade: "Pruebas que miran todas las secciones de una ciudad o estado a la vez." },
    nota: "Nota", teste: "Prueba", abas: "Partes de la prueba", aba_missoes: "Misiones", aba_livre: "Modo libre", aba_prova: "Examen", aba_faq: "Preguntas",
    missoes: "Misiones", missoes_n: (n, t) => `${n} de ${t} misiones`, missao_n: (i, t) => `Misión ${i} de ${t}`, migalha: "Ruta",
    caso: "Caso ficticio", ficticio: "Ficticio", ex_simples: "Explicación sencilla", ex_tecnica: "Explicación técnica",
    dica: "Mostrar dónde cambiar", restaurar: "Restaurar el caso", cumprida: "¡Misión cumplida!", proxima: "Siguiente misión", refazer: "Rehacer", ir_prova: "Ir al examen",
    livre_t: "Modo libre", livre_d: "Cambie todo lo que quiera. Use “Nuevo caso” para generar otro caso ficticio.", novo_caso: "Nuevo caso",
    perguntas_sub: "Los porqués más comunes sobre el simulador y sobre cada prueba.", buscar: "Buscar una pregunta", faq_geral: "Generales", nada: "No se encontró ninguna pregunta.",
    luz: { ok: "Normal", anom: "Anomalía estadística", info: "Informativo", insp: "Marcado para inspección", na: "Fuera de la prueba" },
    luzDesc: { ok: "La prueba no ve nada fuera de lo normal.", anom: "La prueba señalaría este caso para revisión.", info: "Queda registrado, pero no es una anomalía.", insp: "El indicador pide mirar el gráfico.", na: "El caso no alcanza el mínimo para que la prueba lo evalúe." },
    c: { ap: "Habilitados", co: "Comparecencia", ab: "Abstenciones", br: "Blancos", nu: "Nulos", rho: "Cuánto varían las secciones de la región", va: "Votos del Candidato A", vb: "Votos del Candidato B" },
    rho: { p: "Poco (secciones parecidas)", m: "Medio", a: "Mucho (secciones distintas)" },
    cargo: { 1: "Presidente", 3: "Gobernador", 5: "Senador", 6: "Diputado Federal", 7: "Diputado Estatal", p: "Presidente", s: "Senador", d: "Diputado Federal", g: "Gobernador" },
    cargo_t: "Cargo", secao_t: "Sección", cand: { A: "Candidato A", B: "Candidato B" }, local_fict: "Villa Ejemplo · Zona 99 · ficticio",
    media_reg: "media de la región", mediana: "mediana de la región",
    cat: {
      aptos_comp_abst: "Habilitados ≠ comparecencia + abstenciones", comp_maior_aptos: "Comparecencia mayor que habilitados", valores_divergentes: "Valores distintos en el mismo boletín",
      votavel_duplicado: "Candidato repetido", votos_negativos: "Cantidad negativa", comp_estadual_divergente: "Comparecencia distinta entre cargos estatales",
      comp_presidente_menor: "Comparecencia presidencial menor que la estatal", urna_inconsistente: "Datos de la urna distintos en la misma sección", cargo_ausente: "Cargo ausente en el boletín",
      soma_votos: "Suma de votos ≠ comparecencia", unanimidade: "Unanimidad improbable", unanimidade_100: "100% para un candidato (informativo)", abstencao_zero: "Comparecencia total improbable",
      brancos_nulos: "Exceso de blancos y nulos", voto_cruzado_pres_df: "Voto cruzado extremo", legenda: "Exceso de votos de lista", vizinhanca: "Contraste con el mismo local",
      identicos: "Resultado idéntico al de otra sección", biometria: "Biometría no usada por encima del patrón",
      abertura_antecipada: "Apertura antes del horario", encerramento_antecipado: "Cierre antes del horario", encerramento_antes_abertura: "Cierre antes de la apertura",
      emissao_antes_encerramento: "Boletín emitido antes del cierre", recebimento_antes_emissao: "Recibido antes de ser emitido", data_divergente: "Fecha distinta del día de la elección",
      atraso_abertura: "Apertura con retraso (informativo)", tipo_urna_2: "Urna no escrutada", tipo_urna_3: "Urna anulada y escrutada por separado", tipo_urna_4: "Urna anulada", tipo_urna_5: "Urna no instalada",
      junta_apuradora: "Votación en papeleta (informativo)", sem_correspondencia: "Sin lista oficial publicada", urna_ausente: "Número de urna ausente", carga_divergente: "Carga distinta de la prevista",
      carga_ausente: "Código de carga ausente", contingencia_oficial: "Urna de contingencia oficial (informativo)", contingencia_carga_divergente: "Contingencia con carga distinta",
      urna_de_outra_secao: "Urna prevista para otra sección", urna_nao_prevista: "Urna fuera de las listas oficiales", segundo_digito: "Desvío del 2.º dígito", ultimo_digito: "Último dígito desequilibrado", klimek: "Concentración en la esquina superior",
    },
    tl: {
      metodo: "Método (igual al del Informe Técnico)", criterio: "Criterio", calc: "Cálculo en este caso ficticio", limites: "Limitaciones",
      grupo: "Grupo de referencia", ab: "Parámetros beta-binomiales", p: "Probabilidad", bh: "Ajuste de Benjamini–Hochberg", crit: "Decisión", sim: "señala", nao: "no señala",
      regras: "Reglas", todas_ok: "todas las reglas cumplidas", info: "informativo", janela: "Horario oficial", local: "hora local", tol: "tolerancia", receb: "Recepción", emis_brt: "emisión en hora de Brasilia",
      min: "Mínimo no alcanzado", evento: "Evento", sem_evento: "sin 100% (la prueba no calcula)", obs: "Observado", abaixo: "proporción por debajo de la media del grupo: p = 1 (la prueba es unilateral)",
      z: "Puntuación z robusta", blocos: "Bloques", exec: "Presidente", leg: "Dip. Federal", escores: "Puntuaciones ideológicas medias", critA: "Criterio A (bloques)", critB: "Criterio B (contexto local)",
      phi: "Sobredispersión del grupo", props: "Proporciones", demais: "demás secciones", igual: "Vectores idénticos", nk: "Tamaño", pcol: "Coincidencia casual", pares: "Pares de secciones", pares_c: "pares", E: "Coincidencias esperadas",
      contagens: "Conteos ≥ 10", mediana: "mediana", ref: "Referencia", ref_modelo: "Monte Carlo, 50 réplicas, beta-binomial por local (≥ 4 secciones) o zona", ref_benford: "Ley de Benford (2.º dígito), sin modelo", ref_unif: "Uniforme, sin modelo y sin límite de mediana",
      chi2: "Bondad de ajuste", medias: "Medias del 2.º dígito", obs_m: "observada", esp_m: "esperada",
      canto: "Esquina superior", obs_c: "observado", esp_c: "esperado", razao: "Razón observado/esperado", razao_c: "razón", regra: "regla", corr: "Correlación comparecencia × votación", pond: "ponderada por los habilitados",
    },
    nota_bh: "En el país, cada prueba evalúa cientos de miles de unidades. Aquí el ajuste de Benjamini–Hochberg usa el mismo número de unidades de la 1.ª vuelta de 2026, suponiendo que todas las demás están dentro del patrón (q = p × M).",
    ch_certo: "prácticamente segura", ch_um: (x) => `1 en ${x}`, ch_digitos: (d) => `1 en un número de ${d} cifras`,
    escala: [[3, "mil", "mil"], [6, "millón", "millones"], [9, "mil millones", "mil millones"], [12, "billón", "billones"], [15, "mil billones", "mil billones"], [18, "trillón", "trillones"]],
    prova_cen: (n) => `Con los datos ficticios de abajo, ¿qué hace la prueba “${n}”?`, prova_qual: "¿Qué prueba se ocupa de esta situación?",
    qual_explic: (n, c) => `Es la ${n}: ${c}`,
    resp: { anom: "La señala como anomalía estadística", ok: "No señala (normal)", na: "Queda fuera de la prueba (no alcanza el mínimo)", info: "La registra solo como informativo", insp: "La marca para inspección" },
    final_sub: "30 preguntas sobre todas las pruebas. Se desbloquea después de los 15 exámenes.", prova_bloq_t: "Examen bloqueado",
    prova_bloq: (m, f) => `Haga al menos ${m} misiones de esta prueba para desbloquear el examen. Usted hizo ${f}.`,
    final_bloq: (f, t) => `Haga los exámenes de las ${t} pruebas para desbloquear el examen final. Usted hizo ${f}.`,
    prova_de: (n) => `Examen: ${n}`,
    regras: (n, t, min, fin) => [`${n} preguntas, de 1 punto cada una. La nota va de 0 a 10.`, `Tiempo: ${t}. Cuando se acaba el tiempo, el examen se entrega solo.`,
      fin ? "Preguntas sobre todas las pruebas: conceptos, casos ficticios y “qué prueba se ocupa de esto”." : "Preguntas de concepto y casos ficticios nuevos en cada intento.",
      `Nota mínima para aprobar: ${min}.`, "Durante el examen el simulador queda cerrado. Puede saltar, marcar para revisar y volver.", "La corrección comentada aparece solo al final."],
    tentativas: (t, m, u) => `Intentos: ${t} · mejor nota: ${m} · última: ${u}`, comecar: "Empezar el examen",
    q_conceito: "Concepto", q_cenario: "Caso ficticio", q_qual: "¿Qué prueba?", questao_n: (i, n) => `Pregunta ${i} de ${n}`, respondidas: (a, n) => `${a}/${n} respondidas`, mapa: "Mapa de preguntas",
    vale: (x) => `Vale ${x} punto${p(x)}`, marcar: "Marcar para revisar", anterior: "Anterior", proxima_q: "Siguiente", revisar: "Revisar y entregar", entregar: "Entregar examen",
    revisao_t: "Revisión antes de entregar", revisao: (r, n, s, m) => `Respondió ${r} de ${n}. ${s ? `${s} sin respuesta (valen cero). ` : ""}${m ? `${m} marcada${p(m)} para revisar.` : ""}`,
    sit_dist: "Aprobado con distinción", sit_aprov: "Aprobado", sit_rec: "En recuperación: rehaga las simulaciones indicadas e inténtelo de nuevo", sit_refazer: "Necesita rehacer las simulaciones",
    resultado: (a, n, t) => `${a} acierto${p(a)} en ${n} preguntas · tiempo ${t}`, recomenda: "Rehaga las misiones de estas pruebas:", refazer_prova: "Rehacer el examen (preguntas nuevas)",
    correcao: "Corrección comentada", sua: "Su respuesta", certa: "Respuesta correcta", sem_resp: "sin respuesta",
    em_andamento: "en curso (falta el examen final)", formula: (m, f) => `Nota final = 60% de la media de los 15 exámenes (${m}) + 40% del examen final (${f}). Los exámenes no hechos cuentan cero.`,
    melhor: "Mejor nota", ultima: "Última", tent: "Intentos", situacao: "Situación", nao_feita: "no hecho", aprovado: "Aprobado", refazer_t: "Rehacer",
    so_aqui: "El boletín de notas queda solo en este dispositivo y no se puede compartir.", apagar: "Borrar mi progreso", apagar_conf: "¿Borrar todas las misiones y notas de este dispositivo?",
    bloq_t: "Acción bloqueada en esta página",
    bloq: "Esta página es una simulación educativa con datos ficticios. Está estrictamente prohibido compartir, copiar, imprimir o capturar estos resultados, para evitar la difusión de noticias falsas.",
    bloq_m: { ferr: "Compartir, crear imagen, exportar e imprimir están desactivados en el simulador.", menu: "El menú del botón derecho está desactivado en esta página.", copia: "Copiar está desactivado en esta página.",
      print: "Captura de pantalla detectada. La pantalla se ocultó.", imprimir: "Imprimir y guardar en PDF están desactivados en esta página.", salvar: "Guardar la página está desactivado." },
    bloq_voltar: "Volver al simulador", so_no_site: "El simulador solo funciona dentro del propio sitio. No se puede incorporar en otras páginas.", abrir_site: "Abrir en el sitio",
  };

  const faqGeral = [
    ["¿Los números del simulador son reales?", "No. Todos los números son inventados y se generan en su dispositivo. Aquí no aparece ningún dato real de sección, ciudad o candidato. Los candidatos se llaman A y B a propósito."],
    ["¿Por qué no puedo compartir ni hacer captura?", "Porque una captura de un caso ficticio podría difundirse como si fuera verdadera. Para evitar noticias falsas, la página no tiene botones de compartir, copiar, crear imagen ni imprimir, muestra la marca “SIMULACIÓN · DATOS FICTICIOS” en toda la pantalla y oculta el contenido cuando detecta una captura."],
    ["¿El bloqueo de captura funciona siempre?", "No. Un sitio no puede impedir la captura del celular ni la foto de la pantalla con otro aparato. En la computadora, la página detecta parte de las capturas y oculta el contenido. Por eso la marca de agua y la franja roja siempre están visibles."],
    ["¿El simulador usa las mismas reglas que la auditoría?", "Sí. Los límites, los mínimos y los cálculos son los mismos del motor de la auditoría (mismos parámetros del Informe Técnico). La diferencia es que los datos son inventados y la región de comparación es ficticia."],
    ["¿Qué es una anomalía estadística?", "Un resultado muy distinto de lo esperado para esa situación. Es un aviso para revisar el boletín impreso, el acta y los archivos de la urna. No prueba nada: hay causas legítimas, como muestran las misiones de falsa alarma."],
    ["¿Por qué el sitio no señala culpables ni irregularidades?", "Porque una prueba estadística no puede saber la causa. Solo muestra lo que se aparta del patrón. La conclusión depende de que personas revisen los documentos oficiales."],
    ["¿Qué es la luz azul, informativo?", "Un registro que no cuenta como anomalía: por ejemplo, un cambio oficial de urna o el 100% para un candidato cuando eso no es raro. Queda anotado para quien quiera revisar."],
    ["¿Por qué algunos casos quedan fuera de la prueba?", "Cada prueba tiene un mínimo (de votos, electores o secciones). Por debajo, el azar explica casi todo y la prueba daría demasiadas falsas alarmas."],
    ["¿Qué es el ajuste para muchas secciones?", "Cuando se prueban cientos de miles de secciones, algunas parecen raras solo por azar. El ajuste de Benjamini–Hochberg exige que el resultado siga siendo raro incluso después de contar todas. El simulador usa el mismo número de unidades de la 1.ª vuelta."],
    ["¿Cómo funciona la nota?", "Cada examen vale de 0 a 10, y se aprueba con 7. La nota final es el 60% de la media de los 15 exámenes más el 40% del examen final. Puede rehacer los exámenes: vale la mejor nota."],
    ["¿Dónde se guarda mi progreso?", "Solo en este navegador, en este dispositivo. No se envía nada a ningún lugar. Puede borrar todo en su boletín de notas."],
    ["¿Puedo usar el simulador en una clase?", "Sí, abriendo el sitio en el aula. El simulador no se puede incorporar en otros sitios ni exportar. Recuerde a la clase que los datos son ficticios."],
  ];

  const pq = (f, v) => `La probabilidad de que esto ocurra por azar en una sección así es de <b>${f.chance(v.lp)}</b>.`;
  const bhTxt = (f, v) => `Como el país tiene cerca de ${f.n(v.M)} unidades evaluadas en esta prueba, el sitio solo señala cuando, incluso contando todas, el resultado sigue siendo raro (probabilidad de falsa alarma por debajo del 1%).`;
  const fichaL = (itens) => `<ul>${itens.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const rhoTxt = { p: "parecidas entre sí", m: "con variación media", a: "muy distintas entre sí" };

  const T = {};

  T.T01 = {
    nome: "Cierre del boletín", curto: "Comprueba si la cuenta de cada boletín cierra: habilitados = comparecencia + abstenciones, sin números negativos, sin candidato repetido y sin cargo ausente.",
    bu: "Boletín de urna ficticio",
    campos: { votos: "Votos para Presidente:", neg: "Votos de un candidato a Dip. Federal", fant: "Electores fantasma (sumados en todas las líneas)", aus: "Cargo ausente en el boletín", dup: "Candidato repetido en la lista del Dip. Federal", div: "Una línea del Dip. Federal con habilitados distintos", urn: "Número de urna distinto en una línea" },
    op: { aus: { 0: "Ninguno", 3: "Gobernador", 5: "Senador", 6: "Diputado Federal", 7: "Diputado Estatal" } },
    simples(s, r, f) {
      if (r.nivel === "ok") return ["Todas las cuentas del boletín cierran: en cada cargo, habilitados = comparecencia + abstenciones; ningún número negativo; ningún candidato repetido; los cargos estatales tienen la misma comparecencia; el Presidente no tiene menos votantes que ellos.",
        "La Prueba 1 solo revisa la aritmética del boletín. No sabe para quién fueron los votos ni si los electores existen: eso es tarea de otras pruebas y de revisar el boletín impreso."];
      const l = r.cats.map((c) => `<b>${f.cat(c.c)}</b>${c.cargo ? ` (${f.cargo(c.cargo)})` : ""}${c.obs ? `: ${c.obs}` : ""}`);
      return [`El boletín tiene ${r.cats.length} problema${p(r.cats.length)}: ${l.join("; ")}.`,
        "En un boletín correcto, cada línea cierra (habilitados = comparecencia + abstenciones), no hay números negativos ni repetidos, y la comparecencia de los cargos estatales es igual.",
        "La prueba es determinística: cualquier violación señala. En la práctica, la causa más común es un error de registro, de transmisión o de lectura del archivo. La revisión se hace con el boletín impreso y los archivos firmados de la urna."];
    },
    ficha: (s, f) => fichaL([`Habilitados ${s.c[1].ap + s.fant}, comparecencia ${s.c[1].co + s.fant}, abstenciones ${s.c[1].ab} (Presidente)`,
      `Gobernador: ${s.c[3].ap + s.fant} / ${s.c[3].co + s.fant} / ${s.c[3].ab}; Senador: ${s.c[5].ap + s.fant} / ${s.c[5].co + s.fant} / ${s.c[5].ab}`,
      `Dip. Federal: ${s.c[6].ap + s.fant} / ${s.c[6].co + s.fant} / ${s.c[6].ab}; Dip. Estatal: ${s.c[7].ap + s.fant} / ${s.c[7].co + s.fant} / ${s.c[7].ab}`,
      `Menor cantidad de votos de un candidato: ${s.neg}${s.dup ? "; un candidato aparece dos veces" : ""}${+s.aus ? `; la línea de ${f.cargo(+s.aus)} no aparece` : ""}`,
      `Presidente: A ${s.va}, B ${s.vb}, blancos ${s.br}, nulos ${s.nu}`]),
    m: [
      ["La cuenta que no cierra", "En el boletín, habilitados = comparecencia + abstenciones. Cambie los <b>habilitados del Presidente</b> para que la cuenta deje de cerrar.", "Cualquier diferencia, incluso de 1 elector, enciende la luz. En la vida real suele ser un error de registro o de lectura del archivo, y se resuelve con el boletín impreso."],
      ["Más votantes que electores", "Haga que la <b>comparecencia del Gobernador</b> sea mayor que los habilitados (por ejemplo, 305).", "Nadie vota en una sección sin pertenecer a ella. Comparecencia mayor que habilitados es imposible en un boletín correcto."],
      ["Un voto negativo", "Ponga un número <b>negativo</b> en los votos del candidato a Diputado Federal.", "No existe una cantidad negativa de votos. Si aparece, hay un error en el registro o en el archivo."],
      ["Candidato repetido", "Marque <b>Candidato repetido</b> en la lista del Diputado Federal.", "Cada candidato aparece una vez por cargo. Una repetición indica un error de registro o de extracción de datos."],
      ["Comparecencias distintas", "Cambie la <b>comparecencia del Gobernador</b> a 238 y la abstención a 62. La línea cierra, pero queda distinta de los otros cargos estatales.", "Quien vota para Gobernador vota también para Senador y Diputados. La comparecencia de los cargos estatales tiene que ser igual, aunque cada línea cierre sola."],
      ["Presidente con menos votantes", "Deje la <b>comparecencia del Presidente</b> menor que la de los cargos estatales (por ejemplo, 235, con abstención 65).", "El Presidente puede tener MÁS votantes (los electores en tránsito votan solo para Presidente), nunca menos."],
      ["Línea perdida en la copia", "Elija <b>Cargo ausente: Senador</b>, como si la línea se hubiera perdido al copiar el archivo.", "La prueba señala, pero la causa más común es técnica: una falla al generar o leer el archivo. El boletín impreso resuelve la duda."],
      ["Error de tipeo", "Cambie la abstención del <b>Diputado Estatal</b> de 60 a <b>6</b>, como quien olvida un cero.", "Un simple error de tipeo enciende la luz igual que un cambio intencional. Por eso una anomalía es un aviso para revisar, no una acusación."],
      ["Urna cambiada a mitad del día", "Marque <b>Número de urna distinto en una línea</b>, como ocurre cuando la urna se sustituye durante la votación.", "El cambio de urna por avería está previsto en las reglas de la elección. La Prueba 12 revisa si la urna nueva estaba en la lista oficial."],
      ["Votos cambiados de lugar", "Pase <b>30 votos</b> del Candidato A al Candidato B. Note que la luz sigue verde.", "La Prueba 1 solo revisa que las cuentas cierren. Pasar votos entre candidatos mantiene todo cerrado. Otras pruebas y el boletín impreso miran eso."],
      ["Electores fantasma bien hechos", "Sume al menos <b>10 electores fantasma</b>: el simulador los pone en todas las líneas, en habilitados y en comparecencia.", "Si todo se cambia de forma coherente, la cuenta cierra y la Prueba 1 no lo ve. Por eso existen las pruebas de comparecencia (4) y de biometría (10), y la revisión del padrón de votación."],
      ["Blancos que se vuelven votos", "Convierta todos los votos <b>blancos</b> del Presidente en votos para el Candidato A.", "Cambiar el tipo de voto sin cambiar el total no altera ninguna cuenta que la Prueba 1 revisa."],
    ],
    faq: [
      ["¿Por qué un error de 1 elector ya señala?", "Porque la cuenta del boletín es exacta. No existe “casi cierra”: o cierra, o hay un error que necesita explicación."],
      ["¿Por qué el Presidente puede tener más votantes?", "Los electores en tránsito (fuera de su domicilio electoral) pueden votar solo para Presidente. Por eso la comparecencia presidencial puede ser mayor que la estatal, nunca menor."],
      ["Si la Prueba 1 no señala, ¿el boletín está bien?", "No necesariamente. Solo garantiza que las cuentas cierran. Votos pasados entre candidatos o cambios coherentes pasan por ella."],
    ],
    prova: [
      ["¿Qué cuenta revisa la Prueba 1 en cada línea del boletín?", "Habilitados = comparecencia + abstenciones", "Votos de A = votos de B", "Blancos = nulos", "Comparecencia = votos del ganador", "Es la identidad básica del boletín: cada elector habilitado votó o faltó."],
      ["¿El Presidente puede tener comparecencia MAYOR que el Gobernador en la misma sección?", "Sí, por los electores en tránsito", "No, nunca", "Solo en la 2.ª vuelta", "Solo si se cambia la urna", "Los electores en tránsito votan solo para Presidente. Menor es lo que no puede ser."],
      ["¿Cuántos electores de diferencia bastan para que la Prueba 1 señale?", "Cualquier diferencia, incluso 1", "Al menos 10", "Más del 5%", "Depende de la región", "La prueba es determinística y sin tolerancia."],
      ["¿Una línea de cargo ausente en el archivo prueba manipulación?", "No: puede ser una falla al generar o leer el archivo", "Sí, siempre", "Solo si es el Presidente", "Sí, si la sección es grande", "La anomalía es un aviso para revisar con el boletín impreso y los archivos firmados."],
      ["¿Qué NO logra ver la Prueba 1?", "Votos pasados de un candidato a otro", "Comparecencia mayor que habilitados", "Números negativos", "Candidato repetido", "Pasar votos entre candidatos mantiene todas las cuentas cerradas."],
      ["¿Por qué los cargos estatales deben tener la misma comparecencia?", "Porque quien vota para Gobernador vota también para Senador y Diputados", "Porque la ley manda redondear", "Porque son del mismo partido", "No tienen por qué", "Es el mismo grupo de electores votando en todos los cargos estatales."],
    ],
    situ: ["En el boletín de una sección, la comparecencia del Gobernador es mayor que el número de electores habilitados.", "Un candidato a Diputado aparece dos veces en la lista del mismo boletín."],
  };

  T.T02 = {
    nome: "Inconsistencia de totales", curto: "Comprueba si la suma de los votos de cada cargo es igual al número de personas que votaron (en el Senado de 2026, el doble, porque cada elector elige dos).",
    dois: "2 votos por elector", soma: "Suma", esperado: "Esperado",
    campos: { c1: "Candidato S1", c2: "Candidato S2", c3: "Candidato S3", nom: "Votos nominales", leg: "Votos de lista" },
    simples(s, r, f) {
      const t = r.v.tot;
      if (r.nivel === "ok") return [`Las sumas cuadran: Presidente ${f.n(t.p)} = ${f.n(s.co)}; Senado ${f.n(t.s)} = 2 × ${f.n(s.co)}; Diputado Federal ${f.n(t.d)} = ${f.n(s.co)}.`,
        "La Prueba 2 revisa cantidades, no para quién fueron los votos. Votos pasados de un candidato a otro, o de blancos a un candidato, mantienen las sumas iguales."];
      return [`La suma no cuadra en ${r.cats.length} cargo${p(r.cats.length)}: ${r.cats.map((c) => `<b>${f.cargo(c.cargo)}</b> (${c.obs}, diferencia de ${c.delta > 0 ? "+" : ""}${f.n(c.delta)})`).join("; ")}.`,
        "En un boletín correcto, cada persona que votó deja exactamente un voto por cargo (dos en el Senado de 2026), contando blancos y nulos.",
        "Cualquier diferencia señala. En la práctica puede ser un error de registro o de extracción o un archivo incompleto. La revisión definitiva se hace con el boletín impreso y el archivo firmado de la urna."];
    },
    ficha: (s, f) => fichaL([`Comparecencia: ${s.co}`, `Presidente: A ${s.p.a}, B ${s.p.b}, blancos ${s.p.br}, nulos ${s.p.nu}`, `Senado (2 votos por elector): ${s.s.c1} + ${s.s.c2} + ${s.s.c3} + blancos ${s.s.br} + nulos ${s.s.nu}`, `Dip. Federal: nominales ${s.d.nom}, lista ${s.d.leg}, blancos ${s.d.br}, nulos ${s.d.nu}`]),
    m: [
      ["Votos de más", "Dé <b>20 votos de más</b> al Candidato A para Presidente.", "La suma de los votos de un cargo tiene que ser igual al número de personas que votaron. Los votos de más aparecen al instante."],
      ["Votos desaparecidos", "Borre <b>15 votos</b> del Candidato B.", "Votos de menos también rompen la cuenta: alguien votó y el voto no aparece."],
      ["Un solo voto", "Sume <b>1 voto</b> al Candidato A.", "La prueba no tiene tolerancia: cualquier diferencia, incluso de 1 voto, se señala."],
      ["Senado con un voto de más", "Sume <b>10 votos</b> al candidato S1 del Senado.", "En 2026 cada elector elige dos senadores. La suma del Senado debe ser el doble de la comparecencia, y la prueba ya lo tiene en cuenta."],
      ["Lista inflada", "Sume <b>30 votos de lista</b> para Diputado Federal.", "Los votos de lista (solo el número del partido) entran en la suma como cualquier otro voto."],
      ["Comparecencia sin votos", "Aumente la <b>comparecencia en 10</b> sin tocar ningún voto.", "Si votó más gente, los votos de todos los cargos tendrían que aumentar juntos. Los tres cargos se encienden."],
      ["Línea de nulos perdida", "Ponga en cero los <b>nulos del Diputado Federal</b>, como si la línea se hubiera perdido en el archivo.", "Señala, pero puede ser solo una línea perdida al leer el archivo. El boletín impreso y el archivo firmado lo resuelven."],
      ["Dígitos cambiados", "Cambie los <b>blancos del Senado</b> de 15 a <b>51</b>, como un error de tipeo.", "Un error de tipeo al copiar los datos enciende la misma luz que un cambio intencional."],
      ["Archivo cortado", "Ponga en cero al candidato <b>S3</b> del Senado, como si el archivo se hubiera cortado al final.", "Los archivos incompletos generan sumas erróneas. Por eso el sitio revisa la integridad de los archivos antes de las pruebas."],
      ["Cambio invisible", "Pase <b>25 votos</b> del Candidato A al Candidato B.", "La suma sigue igual a la comparecencia, así que la Prueba 2 no lo ve. Un cambio entre candidatos solo aparece en el boletín impreso o en patrones estadísticos."],
      ["Blancos convertidos", "Convierta los votos <b>blancos</b> del Presidente en votos para el Candidato A.", "El total no cambia. La Prueba 2 revisa cantidades, no para quién fueron los votos."],
      ["Fantasmas coherentes", "Aumente la <b>comparecencia en 10</b> y ajuste todas las sumas (Presidente +10, Senado +20, Diputado +10) hasta que la luz vuelva a verde.", "Los cambios coherentes pasan por la Prueba 2. Por eso el sitio combina varias pruebas y recomienda revisar el boletín impreso y el acta."],
    ],
    faq: [
      ["¿Por qué el Senado cuenta el doble?", "En 2026 se renuevan dos tercios del Senado: cada elector elige dos senadores. La suma del Senado debe ser 2 × comparecencia."],
      ["¿Los blancos y nulos entran en la suma?", "Sí. La suma incluye votos nominales, de lista, blancos, nulos y anulados. Cada persona que votó deja un voto en cada cargo, aunque sea en blanco."],
      ["Si las sumas cuadran, ¿los votos están bien?", "No necesariamente. La prueba revisa cantidades. Para quién fueron los votos solo lo muestra el boletín impreso."],
    ],
    prova: [
      ["En el Senado de 2026, la suma de los votos debe ser:", "El doble de la comparecencia", "Igual a la comparecencia", "La mitad de la comparecencia", "Igual a los habilitados", "Cada elector elige dos senadores en 2026."],
      ["¿Los blancos y nulos entran en la suma que revisa la Prueba 2?", "Sí", "No", "Solo los blancos", "Solo en la 2.ª vuelta", "La suma incluye todos los tipos de voto."],
      ["Una diferencia de 1 voto en la suma:", "Se señala", "Se ignora", "Solo cuenta para Presidente", "Solo cuenta por encima de 5 votos", "La prueba es exacta, sin tolerancia."],
      ["¿Qué cambio NO ve la Prueba 2?", "Pasar votos del Candidato A al B", "Sumar votos sin aumentar la comparecencia", "Borrar votos", "Aumentar la comparecencia sin votos", "El cambio mantiene la suma igual."],
      ["Un archivo de datos cortado al final puede:", "Generar una suma errónea y encender la luz", "No afectar nunca la prueba", "Aumentar la comparecencia", "Cambiar el horario de la urna", "Por eso el sitio revisa la integridad de los archivos."],
      ["¿Qué permite concluir la luz de la Prueba 2 por sí sola?", "Que la suma no cuadra y hay que revisar el boletín impreso", "Que hubo manipulación", "Que ganó el Candidato A", "Que se cambió la urna", "La anomalía es un aviso para revisar."],
    ],
    situ: ["La suma de los votos para Presidente de una sección es 5 votos mayor que el número de personas que votaron.", "En el Senado, la suma de los votos de la sección es igual a la comparecencia, y no al doble."],
  };

  T.T03 = {
    nome: "Unanimidad en la sección", curto: "Busca secciones en las que un solo candidato obtuvo el 100% de los votos válidos y calcula si eso es demasiado raro para la región.",
    vis: "Cada punto es una sección ficticia de la región (votación del candidato). El rombo es su sección.",
    campos: { n: "Votos válidos en la sección", a: "Votos del Candidato A", m: "Votación media de A en la región (%)" },
    kv(s, r, f) { const v = r.v, out = [["Votos de A", `${f.n(Math.min(s.a, s.n))} de ${f.n(s.n)}`]]; if (v.lp != null) out.push(["Media de la región", f.pct(v.mref)], ["Probabilidad por azar", f.chance(v.lp)], ["Tras el ajuste (q)", f.sci(v.lq)]); return out; },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return [`La sección tiene solo <b>${f.n(v.n)}</b> voto${p(v.n)} válido${p(v.n)}. La prueba solo evalúa secciones con al menos 10: con tan poca gente, el 100% para un candidato ocurre por azar con frecuencia.`];
      if (r.nivel === "ok") return [`Nadie obtuvo el 100% de los votos válidos: el Candidato A tiene ${f.n(v.a)} de ${f.n(v.n)} (${f.pct(v.a / Math.max(1, v.n))}).`, "La Prueba 3 solo busca la unanimidad. Una sección muy favorable a un candidato, pero sin llegar al 100%, no enciende esta luz. Otras pruebas, como el Contraste de vecindad, comparan con las secciones vecinas."];
      const c = v.cand === "A" ? "Candidato A" : "Candidato B";
      const out = [`Los ${f.n(v.n)} votos válidos fueron todos para el <b>${c}</b>. En las secciones de la región, suele tener <b>${f.pct(v.mref)}</b>.`, pq(f, v) + " " + bhTxt(f, v)];
      if (r.nivel === "anom") out.push(`<b>Por eso la prueba señala.</b> Lo normal sería algo cerca del ${f.pct(v.mref, 0)} para el ${c}, con votos también para el otro candidato.`, "Esto no prueba nada: comunidades pequeñas y unidas (aldeas indígenas, comunidades aisladas, establecimientos específicos) pueden votar en bloque. La señal pide revisar el boletín impreso y el acta.");
      else out.push("<b>No es lo bastante raro para señalar.</b> El sitio solo lo registra como informativo (100% para un candidato), porque en la región ese candidato ya es muy fuerte o las secciones varían mucho.");
      return out;
    },
    ficha: (s, f) => fichaL([`Votos válidos en la sección: ${s.n}`, `Votos del Candidato A: ${s.a} (el resto fue para el Candidato B)`, `En la región, A tiene en promedio el ${s.m}% de los votos`, `Secciones de la región ${rhoTxt[s.rho]}`]),
    m: [
      ["Unanimidad", "Dé <b>todos los votos válidos</b> al Candidato A (120).", "En una región donde A tiene cerca del 55%, una sección de 120 votos con el 100% para A es demasiado rara. La prueba calcula esa probabilidad con las secciones de la región."],
      ["Donde A es débil", "Aquí A tiene solo el 30% en la región. Lleve a A a <b>80 votos</b> (100%).", "Cuanto más débil el candidato en la región, más improbable es la unanimidad."],
      ["Unanimidad para el otro", "Ahora <b>ponga en cero al Candidato A</b>: los 60 votos van todos para el Candidato B.", "La prueba mira cualquier candidato. El 100% para B donde B tiene cerca del 45% también es raro."],
      ["Sección grande", "Dé los <b>300 votos</b> al Candidato A.", "Cuanto mayor la sección, menor la probabilidad de que todos elijan al mismo candidato por azar."],
      ["Fuerte, pero en secciones parecidas", "A tiene el 75% y las secciones de la región son parecidas. Dé los <b>80 votos</b> a A.", "Incluso donde el candidato es fuerte, si las secciones suelen parecerse, el 100% en 80 votos se aparta del patrón."],
      ["Encuentre el tamaño mínimo", "La sección tiene 10 votos, todos para A. Aumente los <b>votos válidos</b> (A acompaña) hasta que la luz se ponga amarilla.", "Con pocos votos, el 100% ocurre por azar. A partir de cierto tamaño deja de ser plausible. La prueba calcula ese punto para cada región."],
      ["Aldea indígena", "Una aldea pequeña y unida vota junta. Dé los <b>30 votos</b> al Candidato A.", "La prueba señala, pero las comunidades pequeñas y homogéneas pueden votar en bloque de forma legítima. La región de alrededor no representa bien a esa comunidad."],
      ["Comunidad religiosa", "Una comunidad religiosa aislada vota junta. Dé los <b>40 votos</b> a A.", "Grupos aislados y unidos pueden dar el 100% a un candidato. Por eso el sitio habla de anomalía estadística: es un aviso para revisar."],
      ["Comunidad ribereña", "Una comunidad ribereña lejana vota en una sola sección. Dé los <b>40 votos</b> a A.", "Los lugares aislados pueden tener un patrón muy distinto de las secciones de comparación."],
      ["Casi unanimidad", "Dé al Candidato A todos los votos <b>menos 1</b> (119 de 120).", "La Prueba 3 solo busca el 100%. Con el 99% la luz sigue verde. Otras pruebas pueden notar una sección muy distinta de sus vecinas."],
      ["Sección demasiado pequeña", "Dé los <b>9 votos</b> a A.", "Por debajo de 10 votos válidos la prueba no evalúa: con tan pocos electores, el 100% ocurre por azar con frecuencia."],
      ["Bastión del candidato", "Donde A tiene el 97% en la región, dé los <b>50 votos</b> a A.", "El 100% donde el candidato ya tiene casi todo no es raro. El sitio solo lo registra como informativo."],
    ],
    faq: [
      ["¿Por qué el 100% en una sección pequeña no señala?", "Porque, con pocos electores, la unanimidad ocurre por azar con frecuencia. La prueba calcula la probabilidad teniendo en cuenta el tamaño de la sección."],
      ["¿Con qué se compara la sección?", "Con las secciones del mismo grupo de referencia: la misma zona dentro del municipio, o el municipio, la zona o el estado, según cuántas secciones haya (al menos 20)."],
      ["¿Qué es la luz azul en esta prueba?", "Es el 100% para un candidato cuando eso no es lo bastante raro. Queda registrado como informativo, con el conteo por candidato."],
    ],
    prova: [
      ["¿Qué busca la Prueba 3?", "Secciones en las que un candidato obtuvo el 100% de los votos válidos", "Secciones con más del 70% para un candidato", "Secciones con muchos blancos", "Secciones sin electores", "Solo mira la unanimidad y calcula si es rara para la región."],
      ["Una sección con 9 votos válidos, todos para un candidato:", "Queda fuera de la prueba", "Siempre señala", "Es informativa", "Se anula", "El mínimo es de 10 votos válidos."],
      ["¿Por qué el 100% en una sección grande es más raro?", "Porque es menos probable que muchas personas elijan al mismo candidato por azar", "Porque las secciones grandes usan otras urnas", "Porque la ley lo prohíbe", "No es más raro", "La probabilidad cae mucho con el tamaño de la sección."],
      ["Una aldea pequeña y unida con el 100% para un candidato:", "Puede señalar, pero puede ser legítimo", "Prueba manipulación", "Nunca señala", "Se excluye de la prueba", "Las comunidades homogéneas pueden votar en bloque."],
      ["Una sección con el 99% para un candidato:", "No enciende la Prueba 3", "Señala en la Prueba 3", "Queda fuera de la prueba", "Es informativa", "La prueba solo busca el 100%."],
      ["¿Qué hace el ajuste para muchas secciones?", "Exige que el resultado siga siendo raro incluso después de contar todas las secciones probadas", "Suma votos de las secciones vecinas", "Ignora las secciones pequeñas", "Cambia los candidatos", "Es el procedimiento de Benjamini–Hochberg."],
    ],
    situ: ["En una sección de 200 votos válidos, todos fueron para el mismo candidato, que en la región tiene cerca de la mitad de los votos.", "Una sección de una comunidad aislada dio el 100% de los votos a un único candidato."],
  };

  T.T04 = {
    nome: "Abstención cero", curto: "Busca secciones en las que votaron todos los electores habilitados (nadie faltó) y calcula si eso es demasiado raro para la región.",
    vis: "Cada punto es una sección ficticia de la región (comparecencia). El rombo es su sección.",
    campos: { ap: "Electores habilitados", co: "Comparecencia", m: "Comparecencia media en la región (%)" },
    kv(s, r, f) { const v = r.v, out = [["Votaron", `${f.n(Math.min(s.co, s.ap))} de ${f.n(s.ap)}`]]; if (v.lp != null) out.push(["Media de la región", f.pct(v.mref)], ["Probabilidad por azar", f.chance(v.lp)], ["Tras el ajuste (q)", f.sci(v.lq)]); return out; },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return [`La sección tiene solo <b>${f.n(v.ap)}</b> electores habilitados. La prueba solo evalúa secciones con al menos 20: en secciones muy pequeñas, que vote todo el mundo es común.`];
      if (!v.integral) return [`Falt${v.ap - v.co === 1 ? "ó" : "aron"} ${f.n(v.ap - v.co)} elector${pe(v.ap - v.co)} (comparecencia del ${f.pct(v.co / Math.max(1, v.ap))}).`, "La Prueba 4 solo mira la comparecencia del 100%. Cualquier falta deja la luz verde, aunque la comparecencia sea muy alta."];
      const out = [`Votaron los ${f.n(v.ap)} electores habilitados. En las secciones de la región, la comparecencia media es del <b>${f.pct(v.mref)}</b>.`, pq(f, v) + " " + bhTxt(f, v)];
      if (r.nivel === "anom") out.push(`<b>Por eso la prueba señala.</b> Lo normal sería que faltaran unos ${f.n(Math.round(v.ap * (1 - v.mref)))} electores.`, "Esto no prueba nada: secciones especiales (cárceles, centros de internación, hospitales) y padrones recién revisados pueden tener comparecencia total legítima. Los electores en tránsito también cambian la cuenta.");
      else out.push("<b>No es lo bastante raro para señalar</b>, porque en la región casi todo el mundo vota o las secciones varían mucho.");
      return out;
    },
    ficha: (s, f) => fichaL([`Electores habilitados: ${s.ap}`, `Comparecencia: ${s.co}`, `En la región, la comparecencia media es del ${s.m}%`, `Secciones de la región ${rhoTxt[s.rho]}`]),
    m: [
      ["Nadie faltó", "Lleve la <b>comparecencia</b> hasta 180: votaron todos.", "Donde 1 de cada 5 suele faltar, que nadie falte en una sección de 180 electores es rarísimo."],
      ["Región de muchas faltas", "Aquí el 35% suele faltar. Lleve la comparecencia a <b>120</b>.", "Cuanta más gente suele faltar, más improbable es que nadie falte."],
      ["Sección mediana", "Lleve la comparecencia a <b>45</b>.", "Incluso una sección de 45 electores señala cuando la región suele tener muchas faltas y las secciones son parecidas."],
      ["Sección grande", "Lleve la comparecencia a <b>400</b>.", "En secciones grandes, la comparecencia del 100% prácticamente no ocurre por azar."],
      ["Encuentre el tamaño mínimo", "La sección tiene 20 electores y votaron todos. Aumente los <b>habilitados</b> (la comparecencia acompaña) hasta que la luz se ponga amarilla.", "El punto en que el 100% se vuelve anomalía depende del tamaño de la sección y de cuánto suele faltar la región."],
      ["Secciones parecidas", "Las secciones de esta región varían poco. Lleve la comparecencia a <b>80</b>.", "Cuando las secciones de la región se parecen, una desviación grande llama más la atención."],
      ["Sección en una cárcel", "En una unidad penitenciaria, los presos habilitados votan juntos. Lleve la comparecencia a <b>50</b>.", "Las secciones especiales pueden tener el 100% de forma legítima. La prueba no lo sabe; el acta de la sección sí."],
      ["Padrón recién revisado", "La ciudad revisó el padrón y sacó a quien ya no vive allí. Lleve la comparecencia a <b>60</b>.", "Los padrones depurados tienen menos faltas. Las secciones de comparación pueden no haber pasado por la misma revisión."],
      ["Sección de un hospital", "Sección con electores internados y funcionarios. Lleve la comparecencia a <b>80</b>.", "Los lugares especiales tienen públicos especiales. La señal pide revisar, no concluir."],
      ["Solo faltó uno", "Deje la comparecencia en <b>179</b> (1 menos que los habilitados).", "La Prueba 4 solo mira el 100%. Con un elector ausente, la luz sigue verde."],
      ["Sección diminuta", "Lleve la comparecencia a <b>19</b>.", "La prueba solo evalúa secciones con al menos 20 electores habilitados."],
      ["Región que casi no falta", "Donde solo el 3% suele faltar, lleve la comparecencia a <b>30</b>.", "El 100% donde casi nadie falta no es raro."],
    ],
    faq: [
      ["¿Por qué que vote todo el mundo puede ser sospechoso?", "Porque en secciones grandes siempre falta alguien: viajes, enfermedad, mudanza. Que nadie falte en una sección de cientos de electores es muy improbable."],
      ["¿Por qué una cárcel puede tener el 100%?", "Porque los presos provisionales están en el lugar y votan juntos. Es un ejemplo de causa legítima."],
      ["¿Por qué solo a partir de 20 habilitados?", "Por debajo de eso, la comparecencia del 100% es común y la prueba daría demasiadas falsas alarmas."],
    ],
    prova: [
      ["¿Qué busca la Prueba 4?", "Secciones en las que votaron todos los habilitados", "Secciones con muchas faltas", "Secciones con comparecencia por encima del 90%", "Secciones sin boletín", "Solo mira la comparecencia total y calcula la probabilidad."],
      ["Una sección de 19 habilitados con el 100% de comparecencia:", "Queda fuera de la prueba", "Siempre señala", "Es informativa", "Se anula", "El mínimo es de 20 electores habilitados."],
      ["En una sección de cárcel con el 100% de comparecencia, la señal:", "Puede tener una causa legítima", "Prueba manipulación", "Nunca aparece", "Anula la sección", "Las secciones especiales pueden tener comparecencia total legítima."],
      ["Donde el 30% suele faltar, el 100% en una sección grande es:", "Muy improbable", "Común", "Imposible de calcular", "Siempre legítimo", "La probabilidad cae mucho con el tamaño y la tasa de faltas."],
      ["¿Una sección con 1 elector ausente enciende la Prueba 4?", "No", "Sí", "Solo si es grande", "Solo en la 2.ª vuelta", "La prueba solo mira la comparecencia del 100%."],
      ["¿Con qué se compara la sección?", "Con las secciones del mismo grupo de referencia", "Siempre con todo el país", "Con la elección anterior", "Solo con la sección vecina", "El grupo puede ser zona, municipio, zona del estado o estado, con al menos 20 secciones."],
    ],
    situ: ["En una sección de 350 electores habilitados votaron todos, en un municipio donde normalmente falta 1 de cada 5.", "Todos los electores habilitados de una sección grande comparecieron, sin ninguna abstención."],
  };

  const excessoSimples = (o) => (s, r, f) => {
    const v = r.v;
    if (r.nivel === "na") return [`La sección tiene solo <b>${f.n(v.n)}</b> ${o.un}. La prueba solo evalúa a partir de 30: con tan pocos, la proporción varía mucho por azar.`];
    const prop = f.pct(v.x / Math.max(1, v.n));
    if (!v.acima) return [`La sección tiene ${f.n(v.x)} ${o.coisa} de ${f.n(v.n)} (${prop}), por debajo de la media de la región (${f.pct(v.mref)}).`, `La prueba solo busca <b>exceso</b>. Tener menos ${o.coisa} que la región no enciende la luz.`];
    const out = [`La sección tiene <b>${f.n(v.x)}</b> ${o.coisa} de ${f.n(v.n)} (${prop}). En las secciones de la región, la media es del <b>${f.pct(v.mref)}</b>.`,
      `La probabilidad de que una sección así tenga tantos ${o.coisa} (o más) por azar es de <b>${f.chance(v.lp)}</b>. ` + bhTxt(f, v)];
    if (r.nivel === "anom") out.push(`<b>Por eso la prueba señala.</b> Lo normal serían unos ${f.n(Math.round(v.n * v.mref))} ${o.coisa}.`, o.legit);
    else out.push("<b>Está dentro de la variación normal</b> de las secciones de la región. Los cambios pequeños no aparecen.");
    return out;
  };
  const excessoKv = (rot) => (s, r, f) => { const v = r.v; return [[rot, v.n ? `${f.n(v.x)} de ${f.n(v.n)} (${f.pct(v.x / Math.max(1, v.n))})` : "—"]].concat(v.lp != null ? [["Media de la región", f.pct(v.mref)], ["Probabilidad por azar", f.chance(v.lp)], ["Tras el ajuste (q)", f.sci(v.lq)]] : []); };

  T.T05 = {
    nome: "Exceso de blancos y nulos", curto: "Busca boletines con muchos más votos blancos y nulos que las secciones parecidas de la región.",
    vis: "Cada punto es una sección ficticia de la región (blancos + nulos). El rombo es su sección.",
    campos: { tot: "Votos en el cargo", m: "Blancos + nulos en la región (%)" },
    kv: excessoKv("Blancos + nulos"),
    simples: excessoSimples({ un: "votos en el cargo", coisa: "votos blancos y nulos", legit: "Esto no prueba nada: las campañas por el voto nulo, los candidatos con registro denegado y los electores con dificultad para usar la urna elevan los blancos y nulos de forma legítima." }),
    ficha: (s, f) => fichaL([`Votos en el cargo: ${s.tot}`, `Blancos: ${s.br} · nulos: ${s.nu}`, `En la región, blancos + nulos son en promedio el ${s.m}%`, `Secciones de la región ${rhoTxt[s.rho]}`]),
    m: [
      ["Lluvia de nulos", "Aumente los <b>nulos</b> hasta que la luz se ponga amarilla.", "La prueba compara con las secciones de la región. Muchos más nulos de lo normal señalan."],
      ["Blancos en exceso", "Aumente solo los <b>blancos</b> hasta que la luz se ponga amarilla.", "Blancos y nulos se suman: la prueba mira los votos que no fueron para ningún candidato."],
      ["Sección pequeña", "En esta sección de 40 votos, aumente los <b>nulos</b> hasta que señale.", "En secciones pequeñas hace falta una proporción mayor para escapar del azar."],
      ["Sección grande", "En esta sección de 400 votos, aumente los <b>nulos</b> hasta que señale.", "En secciones grandes, una proporción menor ya basta."],
      ["Región con muchos nulos", "Aquí el 12% suele votar en blanco o nulo. Aumente los <b>nulos</b> hasta que señale.", "El punto de corte sigue el patrón de la región."],
      ["Encuentre el límite", "Suba los <b>nulos</b> de uno en uno y pare en el <b>primer valor</b> que enciende la luz.", "Ese es el límite de esta sección. Un voto menos y la luz queda verde."],
      ["Campaña por el voto nulo", "Un grupo del barrio hizo campaña por el voto nulo. Aumente los <b>nulos</b> hasta que señale.", "Las campañas por el voto nulo son legítimas y elevan los nulos de verdad."],
      ["Registro denegado", "Al candidato preferido del barrio le denegaron el registro, y los votos por él se volvieron nulos. Aumente los <b>nulos</b> hasta que señale.", "Los votos por un candidato con registro denegado pueden contarse como nulos. Es una causa legítima."],
      ["Electores con dificultad", "Sección de un asilo: muchos ancianos con dificultad para usar la urna. Ponga <b>30 blancos</b> y aumente los <b>nulos</b> hasta que señale.", "La dificultad para usar la urna es una causa legítima de blancos y nulos."],
      ["Pocos nulos de más", "Sume <b>3 nulos</b>. ¿La luz sigue verde?", "Los cambios pequeños quedan dentro de la variación normal y la prueba no los ve."],
      ["Sección demasiado pequeña", "Ponga <b>12 nulos</b> o más en esta sección de 29 votos.", "Por debajo de 30 votos la prueba no evalúa."],
      ["Ningún blanco ni nulo", "Ponga en cero <b>blancos y nulos</b>.", "La prueba solo busca exceso. La falta de blancos y nulos no enciende la luz."],
    ],
    faq: [
      ["¿Por qué se suman blancos y nulos?", "Porque ambos son votos que no van a ningún candidato. La prueba mira ese total en relación con los votos del cargo."],
      ["¿Por qué tener pocos nulos no señala?", "La prueba es unilateral: solo busca exceso, que es el patrón asociado a problemas de registro o de uso de la urna."],
      ["¿Qué es la puntuación z robusta de la parte técnica?", "Una medida de cuánto se aleja la sección de la mediana de la región, usando la mediana y la desviación absoluta mediana, que no se dejan llevar por valores extremos."],
    ],
    prova: [
      ["La Prueba 5 compara la sección con:", "Las secciones parecidas de la misma región", "El resultado del país", "La elección anterior", "La sección con el número siguiente", "Es el grupo de referencia."],
      ["Una campaña por el voto nulo en el barrio:", "Puede hacer que la prueba señale de forma legítima", "Prueba manipulación", "Nunca cambia los nulos", "Anula la sección", "Las causas legítimas elevan los nulos."],
      ["Una sección con menos blancos y nulos que la región:", "No señala", "Señala", "Queda fuera de la prueba", "Es informativa", "La prueba solo busca exceso."],
      ["¿Cuál es el mínimo de votos para que la Prueba 5 evalúe?", "30", "10", "100", "No hay mínimo", "Por debajo de 30 votos la proporción varía demasiado por azar."],
      ["En una sección mayor, para señalar hace falta:", "Una proporción de blancos y nulos menor que en una sección pequeña", "Una proporción mayor", "Exactamente la misma proporción", "Ser la mayor del país", "Con más votos, el azar explica menos."],
      ["Sumar 3 nulos a una sección normal:", "Normalmente no enciende la luz", "Siempre la enciende", "Anula la sección", "Cambia la comparecencia", "Queda dentro de la variación normal."],
    ],
    situ: ["Una sección tuvo un 35% de votos blancos y nulos para Presidente, en una región donde la media es del 4%.", "Los votos que no fueron para ningún candidato están muy por encima de lo normal de la región en una sección."],
  };

  T.T07 = {
    nome: "Paradoja de lista", curto: "Busca boletines de Diputado con muchos más votos de lista (solo el número del partido) que las secciones parecidas de la región.",
    vis: "Cada punto es una sección ficticia de la región (votos de lista). El rombo es su sección.",
    campos: { val: "Votos válidos para Dip. Federal", leg: "Votos de lista", m: "Lista en la región (%)" },
    kv: excessoKv("Votos de lista"),
    simples: excessoSimples({ un: "votos válidos", coisa: "votos de lista", legit: "Esto no prueba nada: las campañas por el voto de lista y la fuerza de un partido en el barrio elevan esos votos de forma legítima." }),
    ficha: (s, f) => fichaL([`Votos válidos para Diputado Federal: ${s.val}`, `Votos de lista: ${s.leg}`, `En la región, la lista es en promedio el ${s.m}%`, `Secciones de la región ${rhoTxt[s.rho]}`]),
    m: [
      ["Lista en alza", "Aumente los <b>votos de lista</b> hasta que señale.", "El voto de lista es el voto solo por el número del partido. La prueba compara con las secciones de la región."],
      ["Sección pequeña", "En esta sección de 60 votos, aumente la <b>lista</b> hasta que señale.", "En secciones pequeñas hace falta una proporción mayor."],
      ["Sección grande", "En esta sección de 380 votos, aumente la <b>lista</b> hasta que señale.", "En secciones grandes, una proporción menor ya basta."],
      ["Región con mucho voto de lista", "Aquí el 20% vota por la lista. Aumente la <b>lista</b> hasta que señale.", "El punto de corte sigue el patrón de la región."],
      ["Región con poco voto de lista", "Aquí solo el 4% vota por la lista. Aumente la <b>lista</b> hasta que señale.", "Donde casi nadie vota por la lista, un aumento menor ya llama la atención."],
      ["Encuentre el límite", "Suba la <b>lista</b> de uno en uno y pare en el <b>primer valor</b> que enciende la luz.", "Ese es el límite de esta sección."],
      ["Campaña “vote por la lista”", "Un partido hizo campaña para votar solo por su número. Aumente la <b>lista</b> hasta que señale.", "Las campañas por el voto de lista son legítimas."],
      ["Partido fuerte en el barrio", "Un partido muy tradicional en el barrio. Aumente la <b>lista</b> hasta que señale.", "La fuerza de un partido en un lugar explica más votos de lista."],
      ["Electores que recuerdan el partido", "Muchos electores recuerdan el número del partido, no el del candidato. Aumente la <b>lista</b> hasta que señale.", "Es un comportamiento legítimo que eleva la lista."],
      ["Un poco más", "Sume <b>4 votos</b> de lista.", "Dentro de la variación normal, la prueba no lo ve."],
      ["Sección demasiado pequeña", "Ponga <b>15 o más</b> votos de lista en esta sección de 28 votos.", "Por debajo de 30 votos válidos la prueba no evalúa."],
      ["Ningún voto de lista", "Ponga la <b>lista</b> en cero.", "La prueba solo busca exceso."],
    ],
    faq: [
      ["¿Qué es el voto de lista?", "Es el voto solo por el número del partido (dos dígitos), sin elegir a un candidato. Cuenta para el partido en el reparto de las bancas."],
      ["¿Por qué la prueba vale solo para Diputados?", "Porque el voto de lista existe en los cargos proporcionales: Diputado Federal, Estatal y Distrital."],
      ["¿Por qué se llama paradoja?", "Porque la mayoría de los electores vota por personas. Una sección con muchos votos solo por el partido se aparta del comportamiento común."],
    ],
    prova: [
      ["¿Qué es el voto de lista?", "El voto solo por el número del partido", "El voto en blanco", "El voto anulado por la Justicia", "El voto en tránsito", "Cuenta para el partido."],
      ["¿En qué cargos se aplica la Prueba 7?", "Diputado Federal, Estatal y Distrital", "Presidente y Gobernador", "Senador", "Todos los cargos", "La lista existe en los cargos proporcionales."],
      ["Una campaña por el voto de lista puede:", "Hacer que la prueba señale de forma legítima", "Anular la sección", "Disminuir la lista", "Probar manipulación", "Es una causa legítima."],
      ["El mínimo de votos válidos para que la Prueba 7 evalúe es:", "30", "10", "50", "100", "Igual que en las otras pruebas de proporción."],
      ["Menos votos de lista que la región:", "No señala", "Señala", "Queda fuera de la prueba", "Es informativo", "La prueba solo busca exceso."],
      ["El ajuste de Benjamini–Hochberg sirve para:", "Evitar falsas alarmas cuando se prueban muchas secciones", "Sumar votos de lista", "Cambiar el partido", "Cambiar la región", "Es la corrección para pruebas múltiples."],
    ],
    situ: ["En una sección, el 40% de los votos para Diputado Federal fueron solo por el número del partido, en una región donde la media es del 7%.", "Los votos sin candidato, solo por el número del partido, están muy por encima de lo normal en una sección."],
  };

  T.T10 = {
    nome: "Baja validación biométrica", curto: "Busca secciones en las que muchos electores con huella registrada fueron habilitados sin la huella, muy por encima del patrón de la región.",
    vis: "Cada punto es una sección ficticia de la región (habilitados sin biometría). El rombo es su sección.",
    campos: { co: "Comparecencia", sb: "Habilitados sin biometría", m: "Sin biometría en la región (%)" },
    kv: excessoKv("Sin biometría"),
    simples: excessoSimples({ un: "electores que votaron", coisa: "electores habilitados sin biometría", legit: "Esto no prueba nada: huellas gastadas (ancianos, trabajadores manuales), un lector biométrico defectuoso y un registro de baja calidad en la región explican aumentos legítimos." }),
    ficha: (s, f) => fichaL([`Comparecencia: ${s.co}`, `Habilitados sin biometría: ${s.sb}`, `En la región, la media es del ${s.m}%`, `Secciones de la región ${rhoTxt[s.rho]}`]),
    m: [
      ["Biometría no usada", "Aumente los <b>habilitados sin biometría</b> hasta que señale.", "Quien tiene huella registrada normalmente es habilitado por la huella. Habilitar a muchos sin ella se aparta del patrón de la región."],
      ["Sección pequeña", "En esta sección de 60 votantes, aumente hasta que señale.", "En secciones pequeñas hace falta una proporción mayor."],
      ["Sección grande", "En esta sección de 380 votantes, aumente hasta que señale.", "En secciones grandes, una proporción menor ya basta."],
      ["Región donde la huella falla mucho", "Aquí el 12% suele ser habilitado sin la huella. Aumente hasta que señale.", "El punto de corte sigue a la región."],
      ["Región donde la huella casi nunca falla", "Aquí solo el 1,5% es habilitado sin la huella. Aumente hasta que señale.", "Donde la biometría funciona bien, un aumento menor ya llama la atención."],
      ["Encuentre el límite", "Suba de uno en uno y pare en el <b>primer valor</b> que enciende la luz.", "Ese es el límite de esta sección."],
      ["Lector defectuoso", "El lector de huellas falló por la tarde. Aumente hasta que señale.", "Un lector defectuoso es una causa legítima y suele estar registrado en el acta."],
      ["Trabajadores rurales", "Muchos electores con huellas gastadas por el trabajo manual. Aumente hasta que señale.", "Las huellas gastadas no se leen. Es una causa legítima."],
      ["Sección de ancianos", "Sección con muchos ancianos, cuya huella es difícil de leer. Aumente hasta que señale.", "La piel cambia con la edad y el lector falla más."],
      ["Unos pocos más", "Sume <b>3</b> habilitados sin biometría.", "Dentro de la variación normal, la prueba no lo ve."],
      ["Sección demasiado pequeña", "Ponga <b>15 o más</b> en esta sección de 29 votantes.", "Por debajo de 30 votantes la prueba no evalúa."],
      ["Nadie sin biometría", "Ponga en cero a los habilitados sin biometría.", "La prueba solo busca exceso."],
    ],
    faq: [
      ["¿Qué es ser habilitado sin biometría?", "Es cuando el elector tiene la huella registrada, pero se le habilita para votar por otro medio (documento con foto y firma), porque la huella no fue reconocida."],
      ["¿Por qué el denominador es la comparecencia?", "Porque el boletín no informa cuántos electores de la sección tienen biometría. La prueba usa el total de personas que votaron."],
      ["¿Esto indica que votó otra persona?", "No. Es solo un aviso para revisar el acta y el registro del lector. Hay muchas causas legítimas."],
    ],
    prova: [
      ["¿Qué mira la Prueba 10?", "Electores con huella registrada habilitados sin la huella", "Electores sin credencial", "Votos blancos", "El horario de la urna", "Es la biometría no usada por encima del patrón."],
      ["Una causa legítima para muchos habilitados sin biometría es:", "Un lector biométrico defectuoso", "Un candidato fuerte", "Una sección grande", "Una urna de contingencia oficial", "Las averías y las huellas gastadas explican aumentos."],
      ["¿Qué denominador usa la prueba?", "La comparecencia", "Los habilitados con biometría", "Los votos válidos", "Los blancos", "El boletín no informa cuántos tienen biometría."],
      ["Mínimo de votantes para que la prueba evalúe:", "30", "20", "10", "100", "Es el mínimo de las pruebas de proporción."],
      ["Menos habilitados sin biometría que la región:", "No señala", "Señala", "Queda fuera de la prueba", "Es informativo", "La prueba solo busca exceso."],
      ["Si la prueba señala, el siguiente paso es:", "Revisar el acta de la sección y los registros de la urna", "Anular la sección", "Concluir que hubo manipulación", "Ignorarlo", "La anomalía es un aviso para revisar."],
    ],
    situ: ["En una sección, el 25% de los electores con huella registrada fueron habilitados sin la huella, en una región donde la media es del 3%.", "El lector de huellas de una urna dejó de funcionar y muchos electores votaron sin identificación biométrica."],
  };

  const ESP = ["Izquierda", "Centroizquierda", "Centro", "Centroderecha", "Derecha"];
  T.T06 = {
    nome: "Voto cruzado extremo", curto: "Busca secciones en las que el voto para Presidente y el voto para Diputado van a lados opuestos de forma extrema y muy distinta de la región.",
    vis: "Votos de la sección por lado político (clasificación del autor, ficticia aquí)", vis2: "Cada punto es la diferencia entre los dos cargos en una sección ficticia de la región. El rombo es su sección.",
    esp: ESP,
    campos: { nx: "Votos válidos para Presidente", nl: "Votos válidos para Dip. Federal", eA: "Candidato A (izquierda) para Presidente (%)", "l.0": "Dip. Federal: Izquierda", "l.1": "Dip. Federal: Centroizquierda", "l.2": "Dip. Federal: Centro", "l.3": "Dip. Federal: Centroderecha", "l.4": "Dip. Federal: Derecha", grupo: "Región" },
    op: { grupo: { padrao: "El voto dividido es raro", dividido: "El voto dividido es común" } },
    kv(s, r, f) { const v = r.v; return [["Bloque izquierda (Pres. / Dip.)", `${f.pct(v.ex.e, 0)} / ${f.pct(v.lg.e, 0)}`], ["Bloque derecha (Pres. / Dip.)", `${f.pct(v.ex.d, 0)} / ${f.pct(v.lg.d, 0)}`], ["Diferencia (Δ)", f.n(v.delta, 2)]].concat(v.z != null ? [["Puntuación z robusta", f.n(v.z, 2)]] : []); },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return ["La sección tiene menos de 50 votos válidos en alguno de los cargos. La prueba solo evalúa a partir de 50 en cada uno."];
      const out = [`Para Presidente, el bloque izquierda tiene el ${f.pct(v.ex.e, 0)} y el bloque derecha el ${f.pct(v.ex.d, 0)}. Para Diputado Federal, ${f.pct(v.lg.e, 0)} y ${f.pct(v.lg.d, 0)} (el Centro queda fuera de los dos bloques).`];
      out.push(v.crA ? "<b>Criterio A cumplido:</b> un bloque tiene el 70% o más en un cargo y el bloque opuesto tiene el 70% o más en el otro." : "Criterio A no cumplido: ningún bloque llega al 70% en un cargo con el bloque opuesto también al 70% en el otro.");
      out.push(v.crB ? `<b>Criterio B cumplido:</b> la diferencia entre los cargos (${f.n(v.delta, 2)}) se aparta mucho del patrón de las secciones de la región (z = ${f.n(v.z, 1)}; el límite es 3,5).` : `Criterio B no cumplido: la diferencia entre los cargos queda dentro del patrón de la región (z = ${f.n(v.z, 1)}; el límite es 3,5).`);
      if (r.nivel === "anom") out.push("<b>Como los dos criterios se cumplen a la vez, la prueba señala.</b>", "Esto no prueba nada: votar por lados distintos para Presidente y Diputado es común y legítimo en Brasil, por ejemplo por un diputado popular en el barrio. Además, clasificar a los partidos en izquierda y derecha es una premisa del autor, no una categoría oficial.");
      else out.push("La prueba solo señala cuando los dos criterios se cumplen juntos.");
      return out;
    },
    ficha: (s, f) => fichaL([`Presidente: Candidato A (izquierda) ${s.eA}%, Candidato B (derecha) ${100 - s.eA}% · ${s.nx} votos válidos`, `Diputado Federal: ${ESP.map((e, i) => `${e} ${s.l[i]}`).join(", ")} · ${s.nl} votos válidos`, `Región: ${s.grupo === "dividido" ? "el voto dividido es común" : "el voto dividido es raro"}`]),
    m: [
      ["Izquierda y derecha a la vez", "Ponga al <b>Candidato A</b> (izquierda) en el 80% y al Diputado Federal en <b>60% Derecha</b> y 20% Centroderecha.", "Cuando un bloque tiene el 70% o más en un cargo y el opuesto el 70% o más en el otro, y eso además se aparta mucho de la región, la prueba señala."],
      ["Al revés", "Candidato A en el <b>20%</b> (B, de derecha, en el 80%) y Diputado en <b>50% Izquierda</b> y 25% Centroizquierda.", "La prueba mira los dos sentidos."],
      ["Región de voto dividido", "Aquí el voto dividido es común. Haga un caso extremo: A en el <b>97%</b> y Diputado en <b>90% Derecha</b>.", "Donde dividir el voto es común, solo los casos muy extremos se apartan del patrón."],
      ["Sección con pocos votos", "A en el <b>85%</b> y Diputado en 60% Derecha y 25% Centroderecha.", "La prueba vale a partir de 50 votos válidos en cada cargo."],
      ["Por la centroderecha", "A en el <b>88%</b> y Diputado en <b>70% Centroderecha</b> y 15% Derecha.", "El bloque derecha suma Derecha y Centroderecha."],
      ["Por la centroizquierda", "A en el <b>12%</b> y Diputado en <b>65% Centroizquierda</b> y 15% Izquierda.", "El bloque izquierda suma Izquierda y Centroizquierda."],
      ["Diputado popular en el barrio", "Un diputado de derecha muy querido en el barrio: A en el <b>78%</b> y Diputado en <b>72% Derecha</b>.", "El voto dividido es común y legítimo. Un político local popular explica la señal."],
      ["Votar para equilibrar", "Electores que votan a propósito por lados opuestos: A en el <b>22%</b> y Diputado en <b>48% Izquierda</b> y 30% Centroizquierda.", "Hay electores que dividen el voto para equilibrar el poder. Es legítimo."],
      ["Bastión de un partido", "A en el <b>76%</b> y Diputado en <b>65% Derecha</b> y 15% Centroderecha.", "La fuerza de un partido local para Diputado convive con otra preferencia para Presidente."],
      ["Divergencia moderada", "Deje a A en el <b>66%</b> y el bloque derecha del Diputado en el <b>65%</b>.", "Por debajo del 70% en alguno de los cargos, el criterio A no se cumple, aunque la diferencia sea grande."],
      ["Sección demasiado pequeña", "A en el <b>90%</b> y Diputado en <b>80% Derecha</b>.", "Por debajo de 50 votos válidos en algún cargo, la prueba no evalúa."],
      ["Voto de centro", "A en el <b>90%</b> y Diputado en <b>60% Centro</b>.", "Los votos de Centro no entran en ningún bloque. Así el bloque opuesto no llega al 70%."],
    ],
    faq: [
      ["¿Quién decidió qué partidos son de izquierda o de derecha?", "Es una premisa analítica del autor, explicada en el Informe Técnico. No es una clasificación oficial. En el simulador, los bloques son ficticios."],
      ["¿Por qué hacen falta los dos criterios?", "El criterio A capta los casos extremos; el B comprueba si eso es raro en la región. Juntos evitan señalar regiones donde el voto dividido es común."],
      ["¿Dividir el voto está mal?", "No. Es un comportamiento legítimo y frecuente. La prueba solo indica casos extremos y raros para revisión."],
    ],
    prova: [
      ["El criterio A de la Prueba 6 exige:", "El 70% o más de un bloque en un cargo y del bloque opuesto en el otro", "El 50% para cada candidato", "Más de 100 votos", "Votos iguales en los dos cargos", "Es el criterio de los bloques."],
      ["El criterio B de la Prueba 6 usa:", "La puntuación z robusta respecto de la región", "La suma de los blancos", "El horario de la urna", "La urna de contingencia", "Compara la diferencia entre cargos con la región, con límite 3,5."],
      ["El voto dividido entre izquierda y derecha es:", "Un comportamiento legítimo y frecuente", "Prohibido", "Siempre señalado", "Prueba de manipulación", "La prueba solo indica casos extremos y raros."],
      ["Los votos de Centro:", "Quedan fuera de los bloques izquierda y derecha", "Cuentan como izquierda", "Cuentan como derecha", "Se descartan del total", "Entran en el total, pero en ningún bloque."],
      ["La clasificación de partidos usada en la prueba es:", "Una premisa analítica del autor", "Una lista oficial del TSE", "Definida por sorteo", "Elegida por el elector", "No es una categoría oficial."],
      ["Mínimo de votos válidos en cada cargo para que la prueba evalúe:", "50", "10", "30", "200", "Es el mínimo del voto cruzado."],
    ],
    situ: ["En una sección, el 85% votó por el candidato a Presidente de izquierda y el 80% por Diputados de derecha, algo muy raro en la región.", "El voto para Presidente y el voto para Diputado de una sección fueron a lados políticos opuestos de forma extrema."],
  };

  T.T08 = {
    nome: "Contraste de vecindad", curto: "Compara cada sección con las demás secciones del mismo local de votación y busca una que vote de forma muy distinta.",
    local: "Local de votación ficticio: Escuela Ejemplo", dif: "Diferencia (p.p.)", alvo: "(en foco)", media: "Votación de A en el local", vis: "% del Candidato A en cada sección (la línea punteada es la media de las demás secciones del local)",
    vis_leg: "Barras en amarillo: secciones que la prueba señalaría.",
    campos: { k: "Secciones en el local", n: "Votos válidos", a: "% del Candidato A" },
    simples(s, r, f) {
      const v = r.v, q = v.alvo || {};
      if (r.nivel === "na" && !q.n) return [`El local tiene solo ${v.k} secciones. La prueba solo evalúa locales con al menos 3: con 2, no hay forma de saber cuál de las dos es la distinta.`];
      if (q.na) return ["La sección en foco tiene menos de 30 votos válidos. La prueba no la evalúa."];
      const out = [`La sección en foco da el <b>${f.pct(q.pS)}</b> al Candidato A; las demás secciones del mismo local dan el <b>${f.pct(q.pR)}</b>. La diferencia es de <b>${f.n(Math.abs(q.dif), 1)} puntos</b>.`,
        `Para señalar, la prueba exige dos cosas: una diferencia de al menos 25 puntos y que sea improbable por azar, incluso considerando las cerca de ${f.n(v.M)} secciones probadas en el país. Aquí la probabilidad por azar es de ${f.chance(q.lp)}.`];
      const outras = r.cats.filter((c) => c.secao !== +s.alvo).length;
      if (q.sinal) out.push("<b>Las dos condiciones se cumplen: la prueba señala esta sección.</b> Lo normal sería que votara parecido a sus vecinas del mismo local.", "Esto no prueba nada: la división de los electores en secciones sigue en parte la dirección y el orden de inscripción, y una sección puede reunir a un público distinto (otro barrio, otra franja de edad).");
      else out.push(Math.abs(q.dif) < 25 ? "La diferencia queda por debajo de 25 puntos, así que la prueba no señala." : "La diferencia supera los 25 puntos, pero todavía puede explicarse por azar (las secciones pequeñas varían más). La prueba no señala.");
      if (outras) out.push(`${outras === 1 ? "Otra sección" : `Otras ${outras} secciones`} del local también encendería${outras === 1 ? "" : "n"} la luz.`);
      return out;
    },
    ficha: (s, f) => fichaL(Array.from({ length: +s.k }, (_, i) => `Sección ${i + 1}: ${s.n[i]} votos válidos, ${s.a[i]}% para el Candidato A${i === +s.alvo ? " (en foco)" : ""}`)),
    m: [
      ["Una sección desentona", "Lleve la <b>Sección 3</b> al 90% para el Candidato A.", "Las secciones del mismo local suelen votar parecido. Una muy distinta de las demás señala."],
      ["Hacia abajo", "Lleve la <b>Sección 3</b> al 20%.", "La prueba mira diferencias hacia arriba y hacia abajo."],
      ["Local con 3 secciones", "Lleve la <b>Sección 2</b> al 92%.", "La prueba vale a partir de 3 secciones en el local."],
      ["Secciones pequeñas", "Las secciones tienen unos 40 votos. Lleve la <b>Sección 3</b> al 100%.", "Con unos 40 votos por sección, ni el 100% basta: después de considerar todas las secciones del país, el azar todavía explica la diferencia."],
      ["Encuentre el límite", "Suba la <b>Sección 3</b> poco a poco y pare en el <b>primer valor</b> que enciende la luz.", "La señal exige una diferencia de 25 puntos o más y que no pueda explicarse por azar."],
      ["Dos secciones distintas", "Lleve las <b>Secciones 2 y 5</b> al 95%.", "Puede señalarse más de una sección en el mismo local."],
      ["Barrio distinto", "La Sección 3 recibe electores de otro barrio. Llévela al <b>88%</b>.", "La división de electores en secciones sigue en parte la dirección y el orden de inscripción. Una sección puede tener un público distinto."],
      ["Sección de electores mayores", "La Sección 4 reúne a electores mayores, inscritos hace décadas. Llévela al <b>22%</b>.", "La edad y la antigüedad de inscripción cambian el perfil de una sección. Es una causa legítima."],
      ["Electores trasladados", "La Sección 1 recibió electores trasladados de otra ciudad. Llévela al <b>90%</b>.", "Los grupos con otro origen pueden votar distinto de sus vecinos."],
      ["Casi 25 puntos", "Lleve la <b>Sección 3</b> al <b>77%</b>: una diferencia grande, pero por debajo de 25 puntos.", "Por debajo de 25 puntos la prueba no señala, aunque la diferencia sea grande."],
      ["Local con 2 secciones", "Lleve la <b>Sección 2</b> al 90%.", "Con menos de 3 secciones la prueba no evalúa."],
      ["Todo junto", "Aumente <b>todas las secciones</b> del local en 25 puntos.", "Si todas cambian juntas, ninguna desentona de sus vecinas. La prueba compara dentro del local; los cambios en todo el local necesitan otras pruebas."],
    ],
    faq: [
      ["¿Por qué comparar con el mismo local?", "Las secciones del mismo edificio suelen tener electores parecidos (mismo barrio). Por eso una sección muy distinta de sus vecinas llama la atención."],
      ["¿Qué es la sobredispersión φ?", "Una corrección: en la vida real, las secciones varían más de lo que prevé el azar puro. La prueba mide esa variación extra en el grupo y la descuenta, para no señalar de más."],
      ["¿Por qué 25 puntos?", "Porque las diferencias menores son comunes entre secciones del mismo local. El límite evita señalar variaciones pequeñas, aunque sean estadísticamente claras."],
    ],
    prova: [
      ["La Prueba 8 compara una sección con:", "Las demás secciones del mismo local de votación", "Todo el país", "La elección anterior", "Una sección de otro estado", "Es el contraste de vecindad."],
      ["Para señalar, la prueba exige:", "Una diferencia de 25 puntos o más que sea improbable por azar", "Solo una diferencia de 10 puntos", "Solo que la sección sea grande", "Que el local tenga 2 secciones", "Las dos condiciones juntas."],
      ["Un local con 2 secciones:", "Queda fuera de la prueba", "Siempre señala", "Es informativo", "Se suma al vecino", "El mínimo es de 3 secciones."],
      ["Si todas las secciones del local cambian juntas:", "La Prueba 8 no lo ve", "La Prueba 8 las señala todas", "El local se anula", "La prueba se vuelve más sensible", "Ninguna desentona de sus vecinas."],
      ["Una causa legítima para que una sección desentone es:", "Electores de otro barrio o de otra franja de edad", "Una urna de contingencia", "El horario de cierre", "Los votos de lista", "La división en secciones sigue la dirección y el orden de inscripción."],
      ["En secciones pequeñas, la misma diferencia en puntos:", "Es más fácil de explicar por azar", "Se señala siempre", "No existe", "Vale el doble", "Las secciones pequeñas varían más."],
    ],
    situ: ["En una escuela con 6 secciones, todas dan cerca del 50% a un candidato, salvo una, que da el 92%.", "Una sección vota de forma muy distinta de las demás secciones del mismo edificio."],
  };

  T.T09 = {
    nome: "Secciones con resultados idénticos", curto: "Busca secciones distintas con resultados exactamente iguales, voto por voto, y calcula si eso podría ocurrir por azar.",
    titulo_par: "Dos secciones ficticias", copiar: "Copiar la sección 42 en la 87", total: "Total",
    cats: { p: ["Candidato A", "Candidato B", "Blancos", "Nulos"], g: ["Gobernador 1", "Gobernador 2", "Gobernador 3", "Gobernador 4", "Gobernador 5", "Gobernador 6", "Blancos", "Nulos"],
      d: ["Diputado 1", "Diputado 2", "Diputado 3", "Diputado 4", "Diputado 5", "Diputado 6", "Diputado 7", "Diputado 8", "Diputado 9", "Diputado 10", "Lista", "Blancos", "Nulos"] },
    campos: { cargo: "Cargo", N: "Secciones con el mismo total de votos en el ámbito" },
    op: { cargo: { p: "Presidente (4 categorías)", g: "Gobernador (8 categorías)", d: "Diputado Federal (13 categorías)" } },
    kv(s, r, f) { const v = r.v; return [["¿Resultados iguales?", v.igual ? "sí" : "no"], ["Votos (n) · categorías (K)", `${f.n(v.n)} · ${v.K}`]].concat(v.lpc != null ? [["Probabilidad de coincidir (un par)", f.chance(v.lpc)], ["Coincidencias esperadas (E)", f.sci(v.lE)]] : []); },
    simples(s, r, f) {
      const v = r.v;
      if (!v.igual) return ["Las dos secciones tienen resultados distintos en al menos una categoría. La prueba solo mira resultados <b>exactamente</b> iguales, voto por voto.", "Basta un voto de diferencia para que la prueba no lo considere una copia."];
      if (r.nivel === "na") return [`Las secciones son idénticas, pero la prueba solo evalúa boletines con al menos 50 votos y 3 categorías con votos (aquí: ${f.n(v.n)} votos y ${v.K} categorías). Con menos, las coincidencias por azar son comunes.`];
      const out = [`Las dos secciones tienen exactamente el mismo resultado: ${f.n(v.n)} votos en ${v.K} categorías.`,
        `La probabilidad de que dos secciones de este tamaño coincidan por azar es de ${f.chance(v.lpc)}. Pero hay ${f.n(v.N)} secciones con el mismo total en el ámbito, lo que da ${f.n(v.pares)} pares posibles. El número esperado de coincidencias por azar es <b>${f.sci(v.lE)}</b>.`];
      if (r.nivel === "anom") out.push("<b>Ese número es menor que 0,01: la prueba señala.</b> Lo normal sería que dos secciones tuvieran resultados parecidos, pero no idénticos.", "Esto no prueba nada: la causa más común es un registro duplicado en la extracción de los datos. La revisión se hace con los boletines impresos de las dos secciones.");
      else out.push("<b>Coincidencias así son esperables por azar</b> (el número esperado no es menor que 0,01). Con pocas categorías, como en el Presidente, los resultados iguales ocurren de forma natural entre miles de secciones.");
      return out;
    },
    ficha: (s, f) => fichaL([`Cargo: ${({ p: "Presidente", g: "Gobernador", d: "Diputado Federal" })[s.cargo]}`, `Sección 42: ${s.v1.join(", ")}`, `Sección 87: ${s.v2.join(", ")}`, `Secciones con el mismo total de votos en el ámbito: ${f.n(s.N)}`]),
    m: [
      ["Boletín copiado", "Haga clic en <b>Copiar la sección 42 en la 87</b>.", "Dos boletines de Diputado Federal idénticos, con 13 categorías y más de 200 votos, casi nunca ocurren por azar."],
      ["Copia en el Gobernador", "Copie la sección 42 en la 87 (8 categorías).", "Con varias categorías, los resultados idénticos son rarísimos."],
      ["Secciones más pequeñas", "Copie la sección 42 en la 87 (unos 55 votos).", "Incluso con pocos votos, 13 categorías iguales son muy improbables."],
      ["Estado grande", "Hay 1.500 secciones con el mismo total en el estado. Copie la sección 42 en la 87.", "Incluso con muchos pares posibles, la coincidencia sigue siendo improbable."],
      ["Registro duplicado", "Copie la sección 42 en la 87, como si el mismo boletín se hubiera guardado dos veces en el archivo.", "La duplicación en la extracción de datos genera la misma señal. Por eso el sitio revisa los archivos originales."],
      ["Sección agregada repetida", "Copie la sección 42 en la 87, como si una sección agregada se hubiera informado dos veces.", "Las secciones agregadas se unen a una principal. Un error de registro puede repetir el resultado."],
      ["Boletín retransmitido", "Copie la sección 42 en la 87, como si el boletín de una se hubiera guardado en lugar del de la otra.", "Los errores de transmisión o de archivo explican copias. La revisión se hace con los boletines impresos."],
      ["Copia con un voto cambiado", "Copie y luego pase <b>1 voto</b> de un candidato a otro en la sección 87.", "La prueba busca resultados exactamente iguales. Un voto de diferencia basta para que no lo vea."],
      ["Presidente: coincidencia esperada", "Copie la sección 42 en la 87 en el Presidente (4 categorías).", "Con solo 4 categorías y miles de secciones del mismo tamaño en el país, los resultados iguales ocurren por azar. La prueba lo calcula y no señala."],
      ["Presidente en sección pequeña", "Copie la sección 42 en la 87 (Presidente, unos 60 votos).", "Cuanto menor la sección y menos categorías, más comunes son las coincidencias."],
      ["Menos de 50 votos", "Copie la sección 42 en la 87 (44 votos).", "Por debajo de 50 votos la prueba no evalúa."],
      ["Solo dos candidatos", "Copie la sección 42 en la 87 (solo A y B tienen votos).", "Con menos de 3 categorías con votos, la prueba no evalúa."],
    ],
    faq: [
      ["¿Cómo pueden dos secciones tener resultados iguales por azar?", "Con pocas categorías y muchas secciones del mismo tamaño, las coincidencias ocurren de forma natural. La prueba calcula cuántas serían esperables y solo señala cuando es muy improbable."],
      ["¿Qué es el número esperado E?", "Es la probabilidad de que un par coincida multiplicada por el número de pares de secciones con el mismo total. Si E es menor que 0,01, la coincidencia es demasiado rara."],
      ["¿Cuál es la causa más común de resultados idénticos?", "La duplicación de registros al extraer o transmitir los datos. Por eso la revisión se hace con los boletines impresos."],
    ],
    prova: [
      ["La Prueba 9 busca:", "Secciones con resultados exactamente iguales", "Secciones con resultados parecidos", "Secciones con muchos blancos", "Secciones del mismo local", "Igualdad voto por voto."],
      ["Una copia con 1 voto cambiado:", "No la ve la Prueba 9", "Siempre señala", "Queda fuera de la prueba", "Es informativa", "La prueba exige igualdad exacta."],
      ["¿Por qué los resultados iguales en el Presidente (4 categorías) suelen no señalar?", "Porque con pocas categorías y miles de secciones las coincidencias son esperables", "Porque el Presidente no se prueba", "Porque la prueba ignora los blancos", "Porque siempre son irregulares", "El número esperado E no baja de 0,01."],
      ["La prueba señala cuando:", "El número esperado de coincidencias por azar es menor que 0,01", "Las secciones son vecinas", "Hay más de 100 votos", "El ganador es el mismo", "Es el criterio de la Prueba 9."],
      ["Mínimos de la Prueba 9:", "50 votos y 3 categorías con votos", "10 votos", "Solo 2 categorías", "100 secciones", "Por debajo de eso las coincidencias son comunes."],
      ["La causa más común de resultados idénticos es:", "La duplicación de registros en los datos", "La urna de contingencia", "El voto en tránsito", "El horario de verano", "La revisión se hace con los boletines impresos."],
    ],
    situ: ["Dos secciones de ciudades distintas tienen exactamente los mismos votos para Diputado Federal, candidato por candidato.", "El boletín de una sección parece haber sido copiado en otra, voto por voto."],
  };

  T.T11 = {
    nome: "Horarios atípicos", curto: "Revisa el orden y el horario de los eventos del boletín: apertura, cierre, emisión y recepción, con 2 minutos de tolerancia.",
    vis: "Línea de tiempo de la sección (hora local). La franja verde es el horario oficial de votación.", janela: "horario oficial", vis_leg: "La recepción por el TSE se registra en hora de Brasilia y aparece aquí convertida a la hora local.",
    ev: { ab: "Apertura", en: "Cierre", em: "Emisión", re: "Recepción" },
    alerta: { ab: ["abertura_antecipada", "atraso_abertura", "encerramento_antes_abertura"], en: ["encerramento_antecipado", "encerramento_antes_abertura", "emissao_antes_encerramento"], em: ["emissao_antes_encerramento", "recebimento_antes_emissao"], re: ["recebimento_antes_emissao"] },
    campos: { fuso: "Huso horario de la ciudad", ab: "Apertura (hora local)", en: "Cierre (hora local)", em: "Emisión del boletín (hora local)", re: "Recepción por el TSE (hora de Brasilia)", drift: "Reloj de la urna (minutos: + adelantado, − atrasado)", data: "Fecha distinta del día de la elección" },
    op: { fuso: { 0: "Igual a Brasilia", "-1": "1 hora menos (como Manaos)", "-2": "2 horas menos (como Acre)" } },
    simples(s, r, f) {
      const v = r.v;
      if (!r.cats.length) return [`Todo en orden: la urna abrió a las ${f.hora(v.ab)} y cerró a las ${f.hora(v.en)} (hora local), dentro del horario oficial (de ${f.hora(v.ini)} a ${f.hora(v.fim)} en esta ciudad, con 2 minutos de tolerancia). El boletín se emitió después del cierre y se recibió después de emitido.`,
        "Cerrar después de las 17 h es normal cuando hay fila: quien llegó hasta las 17 h vota."];
      const out = [`La prueba encontró: ${r.cats.map((c) => `<b>${f.cat(c.c)}</b>`).join("; ")}.`,
        `Lo correcto es: abrir a partir de las ${f.hora(v.ini)} (hora local), cerrar a partir de las ${f.hora(v.fim)}, emitir el boletín después del cierre y que el TSE lo reciba después de la emisión, todo el día de la elección.`];
      if (r.nivel === "info") out.push("La apertura con 1 hora o más de retraso es solo <b>informativa</b> (luz azul): suele tener una causa operativa, como un cambio de urna.");
      else out.push("Esto no prueba nada: un reloj de urna desajustado, un cambio de urna durante la votación y ciudades con un huso distinto al de la mayoría del estado explican muchos casos.");
      if (+s.drift) out.push(`En este caso, el reloj de la urna está ${Math.abs(s.drift)} minutos ${s.drift > 0 ? "adelantado" : "atrasado"}, y los horarios registrados en el boletín salen mal.`);
      return out;
    },
    ficha: (s, f) => fichaL([`Huso de la ciudad: ${({ 0: "igual a Brasilia", "-1": "1 hora menos que Brasilia", "-2": "2 horas menos que Brasilia" })[s.fuso]}`, `Apertura ${f.hora(s.ab)} · cierre ${f.hora(s.en)} · emisión ${f.hora(s.em)} (hora local)`, `Recepción por el TSE: ${f.hora(s.re)} (hora de Brasilia)`]),
    m: [
      ["Abrió demasiado temprano", "Cambie la <b>apertura</b> a 07:50.", "La votación empieza a las 8 h de Brasilia (convertida a la hora local). Con tolerancia de 2 minutos, abrir a las 07:50 señala."],
      ["Cerró temprano", "Cambie el <b>cierre</b> a 16:30.", "La votación dura hasta las 17 h. Cerrar más de 2 minutos antes señala."],
      ["Boletín antes del final", "Cambie la <b>emisión del boletín</b> a 16:55, antes del cierre.", "El boletín solo puede imprimirse después de cerrada la votación."],
      ["Recibido antes de existir", "Cambie la <b>recepción por el TSE</b> a 16:50.", "El TSE no puede recibir un boletín que todavía no se emitió."],
      ["Cerró antes de abrir", "Cambie el <b>cierre</b> a 07:30.", "Un orden de eventos imposible."],
      ["Día equivocado", "Marque <b>Fecha distinta del día de la elección</b>.", "La apertura y el cierre tienen que ser el día de la elección."],
      ["Reloj atrasado", "El reloj de esta urna está 15 minutos atrasado. Ajuste el <b>reloj de la urna</b> a −15.", "La urna abrió a las 8 h en punto, pero el reloj interno marcó las 07:45. Un reloj desajustado es una causa conocida y explicable."],
      ["Urna encendida por la tarde", "La urna se averió y la sustituta se encendió a las 13:10. Cambie la <b>apertura</b> a 13:10.", "Los retrasos de 1 hora o más quedan solo como informativo (luz azul): tienen causas operativas."],
      ["Reloj adelantado", "El reloj de la urna está 25 minutos adelantado. Ajuste el <b>reloj de la urna</b> a +25.", "La emisión parece posterior a la recepción porque el reloj de la urna está mal; la recepción usa el reloj del TSE."],
      ["Dentro de la tolerancia", "Cambie el <b>cierre</b> a 16:59 y la emisión a 17:01.", "Hay 2 minutos de tolerancia para pequeñas diferencias de reloj."],
      ["Ciudad con otro huso", "Esta ciudad tiene 1 hora menos que Brasilia. Abra a las <b>07:01</b>, cierre a las 16:01 y emita a las 16:03 (hora local).", "Las 7 h locales son las 8 h en Brasilia. La prueba descubre el huso de cada ciudad por los horarios de apertura de sus secciones."],
      ["Fila hasta tarde", "Había fila. Cierre a las <b>19:10</b>, emita a las 19:13 y reciba a las 19:30.", "Cerrar después de las 17 h es normal cuando hay fila. La prueba no señala."],
    ],
    faq: [
      ["¿Por qué cerrar después de las 17 h no señala?", "Porque quien está en la fila a las 17 h tiene derecho a votar. La votación puede terminar mucho después en secciones con fila."],
      ["¿Cómo sabe la prueba el huso de cada ciudad?", "Por el percentil 10 de los horarios de apertura de las secciones de la ciudad: una apertura regular nunca es antes del horario oficial, y los retrasos no cambian esa referencia."],
      ["¿Por qué la recepción usa otro reloj?", "La apertura, el cierre y la emisión los registra el reloj de la urna, en hora local. La recepción la registra el sistema del TSE, en hora de Brasilia."],
    ],
    prova: [
      ["¿Cuál es la tolerancia de la Prueba 11?", "2 minutos", "30 minutos", "1 hora", "No hay tolerancia", "Se aceptan pequeñas diferencias de reloj."],
      ["Cerrar a las 19 h por la fila:", "Es normal y no señala", "Siempre señala", "Es informativo", "Anula la sección", "Quien llegó hasta las 17 h vota."],
      ["Una apertura con 2 horas de retraso:", "Se registra solo como informativa", "Es una anomalía grave", "No se registra", "Anula la urna", "Los retrasos tienen causas operativas."],
      ["En una ciudad con 1 hora menos que Brasilia, abrir a las 07:00 locales:", "Es normal", "Señala apertura anticipada", "Queda fuera de la prueba", "Es informativo", "Las 7 h locales equivalen a las 8 h en Brasilia."],
      ["Un reloj de urna desajustado puede:", "Hacer que la prueba señale sin nada mal en la votación", "Cambiar los votos", "Sumar electores", "Cambiar la urna", "Es una causa explicable."],
      ["¿Cuál de estos órdenes es imposible?", "Recepción por el TSE antes de la emisión del boletín", "Apertura antes del cierre", "Emisión después del cierre", "Cierre después de las 17 h", "El TSE no puede recibir lo que todavía no existe."],
    ],
    situ: ["El boletín de una sección registra que la urna abrió a las 07:30, media hora antes del horario oficial.", "El boletín dice que el TSE lo recibió antes de que la urna lo emitiera."],
  };

  T.T12 = {
    nome: "Cambio de urna y votación en papeleta", curto: "Revisa si la urna usada en la sección es la prevista en la lista oficial, si el programa cargado coincide y si hubo urna anulada o votación en papeleta.",
    prevista: "Urna prevista (lista oficial)", usada: "Urna usada (boletín)", nr: "N.º", carga_t: "Carga", lista: "Lista oficial de contingencia", outra_t: "Urna prevista para la sección 43:",
    campos: { urna: "Urna usada", carga: "Código de carga (programa cargado)", tipo: "Situación de la urna", junta: "Votación en papeleta (junta escrutadora)", semCesp: "Lista oficial no publicada para la sección", va: "Votos del Candidato A", vb: "Votos del Candidato B" },
    op: { urna: { prev: "La urna prevista (2045123)", cont: "Urna de contingencia de la lista (2099001)", outra: "Urna prevista para la sección 43 (2045777)", desc: "Urna desconocida (3011999)" },
      carga: { A7F3: "A7F3 (la prevista)", B2E8: "B2E8 (otra)", "": "Sin código" }, tipo: { 1: "Escrutada", 2: "No escrutada", 3: "Anulada y escrutada por separado", 4: "Anulada", 5: "No instalada" } },
    simples(s, r, f) {
      if (!r.cats.length) return ["La urna usada es la prevista en la lista oficial, con el programa (código de carga) previsto, y se escrutó con normalidad.", "La Prueba 12 revisa la urna, no los votos que hay dentro. Para los votos valen las otras pruebas y el boletín impreso."];
      const out = [`La prueba encontró: ${r.cats.map((c) => `<b>${f.cat(c.c)}</b>`).join("; ")}.`];
      if (r.nivel === "info") out.push("<b>Queda solo como informativo (luz azul)</b>: cambiar una urna averiada por una de contingencia de la lista oficial, con el programa correcto, y votar en papeleta cuando las urnas fallan son procedimientos previstos, registrados en el acta de la mesa.");
      else out.push("Lo normal es que la sección use la urna prevista, con el programa previsto, o una urna de contingencia de la lista oficial con el mismo programa.", "Esto no prueba nada: la causa debe revisarse en el acta de la mesa receptora y en los registros oficiales de urnas. Una lista no publicada, por ejemplo, es la falta del archivo, no un problema de la urna.");
      return out;
    },
    ficha: (s, f) => fichaL([`Urna usada: ${({ prev: "la prevista en la lista oficial", cont: "la de contingencia de la lista oficial", outra: "la prevista para otra sección", desc: "una urna que no está en ninguna lista" })[s.urna]}`, `Código de carga: ${s.carga || "ausente"} (el previsto es A7F3)`, `Situación: ${({ 1: "escrutada", 2: "no escrutada", 3: "anulada y escrutada por separado", 4: "anulada", 5: "no instalada" })[s.tipo]}${s.junta ? "; votación en papeleta" : ""}`]),
    m: [
      ["Urna desconocida", "Elija la <b>urna desconocida (3011999)</b>.", "Una urna que no aparece en ninguna lista oficial se señala."],
      ["Urna de la sección vecina", "Elija la <b>urna prevista para la sección 43</b>.", "Cada urna tiene una sección prevista. Usada en otra, señala."],
      ["Programa distinto", "Cambie el <b>código de carga</b> a B2E8.", "El código de carga identifica el programa cargado en la urna. Distinto del previsto, señala."],
      ["Contingencia con programa equivocado", "Elija la <b>urna de contingencia</b> y el código <b>B2E8</b>.", "La urna de reserva también tiene que tener el programa previsto."],
      ["Sin código de carga", "Elija <b>Sin código</b> en el código de carga.", "Sin el código no se puede revisar el programa cargado."],
      ["Urna anulada", "Cambie la situación a <b>Anulada</b>.", "Las urnas anuladas se señalan para revisión."],
      ["Urna no escrutada", "Cambie la situación a <b>No escrutada</b>.", "Una urna que no se escrutó necesita explicación."],
      ["La urna se averió", "La urna original se averió. Elija la <b>urna de contingencia de la lista</b> (con la carga A7F3).", "El cambio por una urna de contingencia oficial es un procedimiento previsto. Queda solo como informativo (luz azul)."],
      ["Votación en papeleta", "La urna y la de reserva fallaron y la sección votó en papel. Marque <b>Votación en papeleta</b>.", "La votación en papeleta tiene causas operativas registradas en el acta. Es informativa."],
      ["Lista no publicada", "Marque <b>Lista oficial no publicada para la sección</b>.", "Sin la lista oficial, la prueba no tiene con qué comparar y señala. La causa es la falta del archivo, no la urna."],
      ["Cambio sin avería", "Elija la <b>urna de contingencia de la lista</b>, como si el cambio se hubiera hecho sin que la urna se averiara.", "La prueba no sabe si el cambio era necesario. Eso solo lo registra el acta de la mesa receptora."],
      ["Votos cambiados en la urna correcta", "Mantenga la urna y la carga previstas y pase <b>20 votos</b> de B a A.", "La Prueba 12 revisa la urna, no los votos."],
    ],
    faq: [
      ["¿Qué es una urna de contingencia?", "Una urna de reserva, preparada con el mismo programa, que sustituye a la original cuando falla. Las urnas de contingencia de cada estado constan en una lista oficial."],
      ["¿Qué es el código de carga?", "La identificación del programa cargado en la urna antes de la elección. Tiene que coincidir con el previsto en la lista oficial."],
      ["¿Votar en papeleta es irregular?", "No. Cuando la urna y la de reserva fallan, la sección puede votar en papeletas, escrutadas por una junta. Está previsto y queda registrado en el acta."],
    ],
    prova: [
      ["Cambiar una urna averiada por una de contingencia de la lista oficial, con la carga correcta:", "Es un procedimiento previsto y queda como informativo", "Es siempre una anomalía", "Anula la sección", "No se registra", "El cambio oficial está previsto."],
      ["El código de carga identifica:", "El programa cargado en la urna", "El número de electores", "El candidato ganador", "El horario de apertura", "Tiene que coincidir con el previsto."],
      ["Una urna que no está en ninguna lista oficial:", "Se señala", "Es normal", "Es informativa", "Queda fuera de la prueba", "Urna no prevista en las correspondencias."],
      ["¿La Prueba 12 ve votos cambiados dentro de la urna correcta?", "No, revisa la urna, no los votos", "Sí, siempre", "Solo en el Presidente", "Solo en papeleta", "Para los votos valen las otras pruebas."],
      ["La votación en papeleta es:", "Registrada como informativa", "Prohibida", "Siempre una anomalía", "Ignorada", "Tiene causas operativas registradas en el acta."],
      ["Si no se publicó la lista oficial de una sección:", "La prueba señala por falta de comparación", "La urna se anula", "La sección queda fuera de la elección", "No pasa nada", "La causa es la falta del archivo."],
    ],
    situ: ["La urna usada en una sección no aparece en la lista oficial de urnas previstas ni en la de contingencia.", "El programa cargado en la urna de una sección tiene un código distinto del previsto."],
  };

  const digKv = (s, r, f) => { const v = r.v; return v.E ? [["Conteos evaluados", f.n(v.N)], ["χ²", f.n(v.chi2, 1)], ["Probabilidad por azar", f.chance(v.lp)], ["Tras el ajuste (q)", f.sci(v.lq)]] : [["Conteos ≥ 10", f.n(v.N)], ["Mediana", f.n(v.med, 0)]]; };
  const digSimples = (o) => (s, r, f) => {
    const v = r.v;
    if (r.nivel === "na") return [`La prueba no evalúa esta ciudad: ${v.N < 50 ? `hay solo ${f.n(v.N)} conteos de 10 votos o más (el mínimo es 50)` : `la mediana de los conteos es ${f.n(v.med, 0)}, por debajo de 30`}. Con conteos pequeños, ${o.pq}`];
    const ref = s.ref === "modelo" ? "del modelo del sitio (la forma real de los votos de esta ciudad, simulada 50 veces)" : s.ref === "benford" ? "de la ley de Benford" : "con todos los dígitos iguales (uniforme)";
    const out = [`El gráfico compara ${o.oque} de los ${f.n(v.N)} conteos (barras) con lo esperado ${ref} (marcas). La distancia entre ambos es χ² = ${f.n(v.chi2, 1)}; la probabilidad de una distancia así por azar es de ${f.chance(v.lp)}.`];
    if (r.nivel === "anom") {
      out.push(`<b>La prueba señala: ${o.oque} se aparta de lo esperado.</b>`);
      out.push(s.ref !== "modelo" && !s.inv && !s.arr ? o.semCuidado : o.legit);
    } else out.push(`<b>Dentro de lo esperado.</b> ${o.limite}`);
    return out;
  };
  const digFicha = (s, f) => fichaL([`Ciudad ficticia con ${f.n(s.S)} secciones; el Candidato A tiene en promedio el ${s.forca}% de los votos`,
    `Secciones con números inventados: ${s.inv}% · redondeadas: ${s.arr}%${s.soma ? ` · ${s.soma} votos sumados a A en el ${s.somaP}% de las secciones` : ""}${s.transf ? ` · desvío proporcional en el ${s.transf}%` : ""}`,
    `Referencia: ${s.ref === "modelo" ? "modelo del sitio" : s.ref === "benford" ? "ley de Benford" : "uniforme, sin límite de mediana"}`]);

  T.T13 = {
    nome: "Prueba del 2.º dígito (Mebane)", curto: "Mira el segundo dígito de los conteos de votos de todas las secciones de una ciudad o estado y lo compara con lo esperado para esa ciudad.",
    vis: "Frecuencia del 2.º dígito en los conteos del Candidato A", sem: "Sin referencia: la prueba no evalúa este caso.", obs: "observado", esp: "esperado",
    campos: { S: "Secciones en la ciudad", forca: "Fuerza media del Candidato A (%)", inv: "Secciones con números inventados (%)", arr: "Secciones redondeadas a decenas (%)", soma: "Votos sumados a A", somaP: "…en cuántas secciones (%)", transf: "Secciones con desvío proporcional de votos (%)", ref: "Referencia" },
    op: { ref: { modelo: "Modelo del sitio (Monte Carlo)", benford: "Ley de Benford (sin el cuidado del sitio)" } },
    kv: digKv,
    simples: digSimples({ oque: "el 2.º dígito", pq: "la forma de los números depende demasiado del tamaño de las secciones y no hay referencia confiable.",
      legit: "Esto no prueba nada: los desvíos pueden venir de comportamiento estratégico, de concentración geográfica de los votos o de que el modelo no describa bien la ciudad (Mebane, 2006).",
      semCuidado: "Atención: los números de esta ciudad no se cambiaron. La luz se encendió porque la ley de Benford no sirve para votos por sección, que quedan en una franja estrecha. Por eso el sitio usa un modelo propio para cada ciudad.",
      limite: "Los cambios en pocas secciones, o que mantienen la forma natural de los números, no aparecen en esta prueba." }),
    ficha: digFicha,
    m: [
      ["Números inventados", "Invente los números del <b>40% de las secciones</b>.", "Quien inventa números tiende a elegir valores redondos (como 150 o 200). Eso deja el 2.º dígito con demasiados ceros y cincos."],
      ["Redondear conteos pequeños", "Aquí el Candidato A tiene conteos de 2 cifras. Redondee el <b>35% de las secciones</b>.", "En números de 2 cifras, el 2.º dígito es el último. Redondear a decenas deja muchos ceros."],
      ["Ciudad grande", "En una ciudad de 1.200 secciones, invente los números del <b>20%</b>.", "Con más secciones, la prueba es más sensible: una fracción menor ya aparece."],
      ["Candidato débil", "Invente los números del <b>25%</b> de las secciones.", "La prueba funciona también para candidatos con pocos votos, siempre que la mediana pase de 30."],
      ["Ciudad pequeña", "En una ciudad de 150 secciones, invente los números del <b>70%</b>.", "Con pocas secciones la prueba tiene poco poder: solo aparecen los cambios grandes."],
      ["Candidato fuerte", "Invente los números del <b>40%</b> de las secciones.", "Con conteos de 3 cifras, los valores redondos también afectan al 2.º dígito."],
      ["Referencia equivocada", "Cambie la <b>referencia</b> a la ley de Benford, sin cambiar ningún número.", "Los datos están limpios y aun así la luz se enciende. La ley de Benford no sirve para votos por sección. Por eso el sitio usa un modelo hecho para cada ciudad."],
      ["Benford con candidato fuerte", "Cambie la <b>referencia</b> a la ley de Benford (ciudad de 1.200 secciones).", "Cuanto más concentrados los conteos, peor funciona la ley de Benford."],
      ["Benford con candidato medio", "Cambie la <b>referencia</b> a la ley de Benford (ciudad de 1.200 secciones).", "Más secciones dan más poder a la prueba, incluso para equivocarse con la referencia equivocada."],
      ["Pocos números inventados", "Invente los números de solo el <b>4%</b> de las secciones.", "Los cambios en pocas secciones se pierden entre cientos de secciones normales."],
      ["Sumar votos en todas", "Sume <b>20 votos</b> a A en el <b>100%</b> de las secciones.", "El modelo se ajusta a los datos observados. Sumar el mismo valor en todas no deja marca en los dígitos."],
      ["Desvío proporcional", "Desvíe votos de forma proporcional en el <b>40%</b> de las secciones.", "Los cambios proporcionales mantienen la forma natural de los números. La prueba de dígitos no lo ve todo."],
    ],
    faq: [
      ["¿Por qué el sitio no usa la ley de Benford?", "Porque la ley de Benford vale para números que se reparten en varios órdenes de magnitud. Los votos por sección quedan en una franja estrecha (por ejemplo, de 80 a 200), y Benford daría falsas alarmas. El sitio simula la forma real de los votos de cada ciudad."],
      ["¿Qué es el modelo del sitio?", "Una simulación de Monte Carlo: 50 réplicas de la votación de cada sección, con una distribución beta-binomial ajustada a los votos del candidato en cada local de votación (o zona). La distribución de los dígitos de esas réplicas es lo esperado."],
      ["¿Por qué exigir una mediana de 30?", "Con conteos pequeños y muy asimétricos, ni el modelo da una referencia confiable. La prueba queda fuera para no equivocarse."],
    ],
    prova: [
      ["La Prueba 13 mira:", "El segundo dígito de los conteos de votos", "El primer dígito", "El número de la urna", "El horario", "Es la prueba 2BL de Mebane."],
      ["¿Por qué el sitio no usa Benford como referencia?", "Los votos por sección quedan en una franja estrecha y Benford daría falsas alarmas", "Benford está prohibido", "Benford solo vale para el Presidente", "Porque Benford es más sensible", "El sitio simula la forma real de los votos."],
      ["Inventar números en el 4% de las secciones:", "Normalmente no aparece en la prueba", "Siempre señala", "Anula la ciudad", "Cambia la referencia", "Los pocos cambios se pierden entre los normales."],
      ["La prueba exige al menos:", "50 conteos y una mediana de 30 votos", "10 conteos", "1.000 secciones", "Una mediana de 100", "Por debajo de eso no hay referencia confiable."],
      ["Quien inventa números tiende a:", "Preferir valores redondos", "Elegir números aleatorios perfectos", "Usar solo números pares", "Repetir el número de la sección", "Eso deja marcas en los dígitos."],
      ["¿Un desvío en la Prueba 13 prueba manipulación?", "No: puede venir de comportamiento estratégico, concentración geográfica o desajuste del modelo", "Sí", "Solo en la 2.ª vuelta", "Solo para Gobernador", "Es un aviso para investigar."],
    ],
    situ: ["En los conteos de votos de un candidato en un estado, el segundo dígito es cero muchas más veces de lo esperado.", "Muchos conteos de votos por sección parecen números redondos elegidos a mano."],
  };

  T.T14 = {
    nome: "Prueba del último dígito (Beber-Scacco)", curto: "Mira el último dígito de los conteos de votos de todas las secciones y comprueba si está equilibrado como se espera para esa ciudad.",
    vis: "Frecuencia del último dígito en los conteos del Candidato A", sem: "Sin referencia: la prueba no evalúa este caso.", obs: "observado", esp: "esperado",
    campos: { S: "Secciones en la ciudad", forca: "Fuerza media del Candidato A (%)", inv: "Secciones con números inventados (%)", arr: "Secciones redondeadas (%)", arrPasso: "Redondear a múltiplos de", soma: "Votos sumados a A", somaP: "…en cuántas secciones (%)", transf: "Secciones con desvío proporcional de votos (%)", ref: "Referencia" },
    op: { ref: { modelo: "Modelo del sitio (Monte Carlo)", uniforme: "Uniforme, sin límite de mediana (sin el cuidado del sitio)" }, arrPasso: { 10: "10", 5: "5" } },
    kv: digKv,
    simples: digSimples({ oque: "el último dígito", pq: "el último dígito no está equilibrado por pura aritmética.",
      legit: "Esto no prueba nada: además de los números fabricados (Beber y Scacco, 2012), los desvíos pueden venir de factores estructurales o de que el modelo no describa bien la ciudad.",
      semCuidado: "Atención: los números de esta ciudad no se cambiaron. Con conteos pequeños (de 10 a 20 votos), el último dígito no está equilibrado por pura aritmética. Sin el modelo y sin el límite de mediana, los datos limpios encienden la luz.",
      limite: "Los cambios en pocas secciones, o que mantienen la forma natural de los números, no aparecen en esta prueba." }),
    ficha: digFicha,
    m: [
      ["Finales inventados", "Invente los números del <b>50% de las secciones</b>.", "Quien inventa números prefiere terminar en 0 y 5 (Beber y Scacco). El último dígito deja de estar equilibrado."],
      ["Redondear a decenas", "Redondee el <b>15% de las secciones</b> a múltiplos de 10.", "Muchos números terminados en 0 aparecen al instante."],
      ["Redondear a cinco", "Cambie “Redondear a múltiplos de” a <b>5</b> y redondee el <b>25%</b> de las secciones.", "Los finales 0 y 5 en exceso también se detectan."],
      ["Ciudad grande", "En una ciudad de 1.200 secciones, invente los números del <b>28%</b>.", "Con más secciones, una fracción menor ya aparece."],
      ["Ciudad pequeña", "En una ciudad de 150 secciones, invente los números del <b>70%</b>.", "Con pocas secciones la prueba tiene poco poder."],
      ["Candidato débil", "Redondee el <b>20%</b> de las secciones a múltiplos de 10.", "La prueba vale también para candidatos con menos votos, si la mediana pasa de 30."],
      ["Sin el cuidado del sitio", "Aquí los conteos son pequeños (de 10 a 20 votos) y el sitio deja la prueba fuera. Cambie la <b>referencia</b> a Uniforme, sin cambiar números.", "Con conteos pequeños, el último dígito no está equilibrado por pura aritmética. Sin el modelo y sin el límite de mediana, los datos limpios encienden la luz."],
      ["Uniforme en ciudad grande", "Cambie la <b>referencia</b> a Uniforme (ciudad de 1.200 secciones, conteos pequeños).", "Más secciones hacen aún más visible el error de referencia."],
      ["Uniforme con conteos pequeños", "Cambie la <b>referencia</b> a Uniforme (ciudad de 800 secciones).", "Por eso el sitio exige una mediana de 30 votos y usa el modelo."],
      ["Pocos números inventados", "Invente los números de solo el <b>4%</b> de las secciones.", "Los cambios en pocas secciones se pierden."],
      ["Sumar votos en todas", "Sume <b>20 votos</b> a A en el <b>100%</b> de las secciones.", "Sumar el mismo valor en todas no cambia el equilibrio del último dígito."],
      ["Desvío proporcional", "Desvíe votos de forma proporcional en el <b>40%</b> de las secciones.", "Los cambios proporcionales mantienen la forma natural de los números."],
    ],
    faq: [
      ["¿Por qué el último dígito debería estar equilibrado?", "En conteos grandes y variados, cada final de 0 a 9 aparece más o menos la misma cantidad de veces. Quienes inventan números prefieren algunos finales."],
      ["¿Por qué no comparar directamente con el 10% para cada dígito?", "Porque en conteos concentrados en una franja estrecha (por ejemplo, de 10 a 20), los finales no están equilibrados por pura aritmética. El sitio usa el mismo modelo de la Prueba 13."],
      ["¿Quiénes son Beber y Scacco?", "Investigadores que mostraron, en 2012, que los números fabricados por personas dejan marcas en el último dígito."],
    ],
    prova: [
      ["La Prueba 14 mira:", "El último dígito de los conteos", "El segundo dígito", "La suma de los votos", "El código de carga", "Es la prueba de Beber y Scacco."],
      ["Quien inventa números suele:", "Preferir finales 0 y 5", "Repartir los finales perfectamente", "Usar solo el final 7", "No dejar marcas", "Eso desequilibra el último dígito."],
      ["Con conteos pequeños (de 10 a 20), comparar con el 10% para cada final:", "Da falsas alarmas", "Es el método del sitio", "Siempre es correcto", "No es posible", "Los finales no están equilibrados por aritmética."],
      ["Redondear los conteos a múltiplos de 10:", "Deja demasiados ceros y la prueba lo nota", "No cambia nada", "Solo cambia el segundo dígito", "Anula las secciones", "Aparecen muchos finales 0."],
      ["Sumar 20 votos en todas las secciones:", "No cambia el equilibrio del último dígito", "Siempre señala", "Pone los dígitos en cero", "Cambia el huso horario", "El desplazamiento es igual en todas."],
      ["Para que la prueba evalúe, la mediana de los conteos debe ser de al menos:", "30 votos", "10 votos", "100 votos", "1 voto", "La misma regla de la Prueba 13."],
    ],
    situ: ["En un estado, los conteos de votos de un candidato terminan en 0 o 5 mucho más de lo esperado.", "El dígito final de los conteos de votos de muchas secciones no está equilibrado."],
  };

  T.T15 = {
    nome: "Huella digital electoral (Klimek)", curto: "Dibuja cada sección en un gráfico de comparecencia × votación y busca una acumulación anormal en la esquina superior derecha.",
    vis: "Cada punto es una sección ficticia. El cuadrado punteado es la esquina: comparecencia y votación por encima del 90%.", eixo_x: "comparecencia", eixo_y: "votación del Candidato A",
    campos: { S: "Secciones en el estado", forca: "Fuerza media del Candidato A (%)", enc: "Secciones con relleno", alvo: "Nivel después del relleno (%)", modo: "Dónde", mob: "Secciones con movilización legítima" },
    op: { modo: { espalhado: "Repartidas por el estado", zona: "Una zona entera" } },
    kv(s, r, f) { const v = r.v; return [["Secciones en la esquina", f.n(v.obs)], ["Esperado en la esquina", f.n(v.esp, 2)], ["Razón", isFinite(v.razao) ? f.n(v.razao, 1) : v.obs ? "∞" : "—"], ["Correlación", f.n(v.corr, 3)]]; },
    simples(s, r, f) {
      const v = r.v;
      const out = [`Hay <b>${f.n(v.obs)}</b> secciones en la esquina (comparecencia y votación de A por encima del 90%). Si la comparecencia y la votación no se movieran juntas dentro de cada zona, lo esperado sería <b>${f.n(v.esp, 1)}</b>.`];
      if (r.nivel === "insp") out.push(`<b>Marcado para inspección:</b> hay 10 o más secciones en la esquina y ${isFinite(v.razao) ? f.n(v.razao, 1) : "infinitas"} veces lo esperado (el límite es 3). Una acumulación así aparece cuando se “rellenan” urnas (la comparecencia y la votación suben juntas).`,
        s.mob && !s.enc ? "Aquí la causa es legítima: movilizar electores en un bastión del candidato también hace que la comparecencia y la votación suban juntas. Por eso Klimek es solo un indicador para mirar el gráfico, no una prueba." : "Esto no prueba nada: los bastiones electorales y la movilización legítima también hacen que la comparecencia y la votación suban juntas. Klimek es un indicador diagnóstico para inspección visual.");
      else out.push(v.obs < 10 ? "Con menos de 10 secciones en la esquina, el indicador no marca." : "El número de secciones en la esquina no llega a 3 veces lo esperado. El indicador no marca.",
        s.modo === "zona" && s.enc ? "Aquí se cambió la zona entera. Como lo esperado se calcula dentro de cada zona, la zona cambiada se vuelve su propio patrón. Eso evita falsas alarmas entre regiones distintas, pero tiene ese límite." : "Lo normal es una nube de puntos sin acumulación en la esquina.");
      return out;
    },
    ficha: (s, f) => fichaL([`Estado ficticio con ${f.n(s.S)} secciones; el Candidato A tiene en promedio el ${s.forca}%`, `Secciones con relleno: ${s.enc}${s.enc ? ` (comparecencia y votación llevadas a cerca del ${s.alvo}%, ${s.modo === "zona" ? "en una zona entera" : "repartidas por el estado"})` : ""}`, `Secciones con movilización legítima: ${s.mob}`]),
    m: [
      ["Rellenar urnas", "Ponga <b>30 secciones</b> con relleno.", "Cada punto del gráfico es una sección. El relleno crea una acumulación en la esquina superior derecha, que no aparece en elecciones normales."],
      ["Pocas urnas rellenadas", "Rellene solo <b>14 secciones</b>.", "A partir de 10 secciones en la esquina, con 3 veces lo esperado o más, el estado se marca para inspección."],
      ["Estado grande", "En un estado de 3.000 secciones, rellene <b>25</b>.", "Lo esperado crece con el tamaño, pero una acumulación todavía se destaca."],
      ["Relleno más leve", "Con un nivel del 92%, rellene <b>25 secciones</b>.", "Basta pasar del 90% en los dos ejes para entrar en la esquina."],
      ["Candidato débil", "Rellene <b>20 secciones</b>.", "Donde el candidato es débil, casi ninguna sección llega a la esquina de forma natural. El relleno se nota todavía más."],
      ["Relleno total", "Con un nivel del 100%, rellene <b>12 secciones</b>.", "Un relleno extremo en pocas secciones ya basta."],
      ["Movilización legítima", "Un líder local llevó a los electores a votar en masa por el candidato. Ponga <b>25 secciones</b> con movilización legítima.", "Una comparecencia alta y una votación alta juntas pueden ser legítimas. Por eso Klimek es solo un indicador para inspección."],
      ["Ciudad natal del candidato", "Ponga <b>40 secciones</b> con movilización legítima.", "Los bastiones electorales producen el mismo dibujo de forma legítima."],
      ["Transporte gratuito", "Buses gratuitos llevaron electores de barrios fieles. Ponga <b>15 secciones</b> con movilización.", "Más comparecencia donde el candidato es fuerte es legítimo."],
      ["Menos de 10", "Rellene <b>9 secciones</b>.", "Con menos de 10 secciones en la esquina, el indicador no marca."],
      ["Por debajo del 90%", "Con un nivel del 88%, rellene <b>40 secciones</b>.", "La esquina empieza en el 90%. El relleno que no llega ahí no se cuenta."],
      ["Una zona entera", "Cambie “Dónde” a <b>Una zona entera</b> y active el relleno (1 o más).", "Lo esperado se calcula dentro de cada zona. Si toda la zona cambia, se vuelve su propio patrón. Eso evita falsas alarmas, pero tiene ese límite."],
    ],
    faq: [
      ["¿Qué es la huella digital electoral?", "Un gráfico en el que cada sección es un punto: la comparecencia en un eje y la votación del candidato en el otro. Klimek y colegas (2012) mostraron que el relleno de urnas deja una acumulación en la esquina superior derecha."],
      ["¿Por qué lo esperado se calcula por zona?", "Porque las regiones distintas tienen perfiles distintos. Calcular dentro de cada zona evita confundir la mezcla de regiones con un patrón sospechoso (paradoja de Simpson)."],
      ["¿Qué quiere decir marcado para inspección?", "Que vale la pena mirar el gráfico con atención. Es un indicador diagnóstico, sin valor de prueba."],
    ],
    prova: [
      ["En el gráfico de Klimek, cada punto es:", "Una sección", "Un candidato", "Un estado", "Un elector", "Comparecencia × votación de cada sección."],
      ["La esquina que mira la prueba es:", "Comparecencia y votación por encima del 90%", "Comparecencia por debajo del 10%", "Votación del 50%", "Secciones con 0 votos", "Es la esquina superior derecha."],
      ["Para marcar para inspección, la prueba exige:", "10 o más secciones en la esquina y 3 veces lo esperado", "1 sección en la esquina", "Una correlación negativa", "Más de 1.000 secciones", "Las dos condiciones juntas."],
      ["La movilización legítima en un bastión electoral:", "Puede producir el mismo dibujo", "Nunca aparece en el gráfico", "Prueba manipulación", "Anula las secciones", "Por eso es solo un indicador."],
      ["Si se cambia una zona entera:", "Se vuelve su propio patrón y el indicador puede no marcar", "El indicador siempre marca", "El estado se anula", "La esquina cambia de lugar", "Lo esperado se calcula dentro de cada zona."],
      ["El resultado de la Prueba 15 es:", "Un indicador para inspección visual", "Una prueba", "Una anulación automática", "Un voto", "Es diagnóstico."],
    ],
    situ: ["En el gráfico de comparecencia × votación de un estado, aparece una acumulación de secciones con casi el 100% en los dos ejes.", "Varias secciones tienen, a la vez, comparecencia y votación de un candidato por encima del 95%."],
  };

  S.ES = Object.assign({ ui, faqGeral }, T);
})();
