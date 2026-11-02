/* Simulador de anomalías — textos en español de las pruebas V1–V6 (variación entre vueltas) y L01–L14 (logs de las urnas).
   Las pruebas de los logs están concluidas en las dos vueltas; los criterios usados aquí son simplificados. */
(function () {
  "use strict";
  const S = window.SIM_TXT && window.SIM_TXT.ES;
  if (!S) return;
  const fichaL = (itens) => `<ul>${itens.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const luz = (r) => S.ui.luz[r.nivel];
  const sim = (b) => (b ? "✓" : "✗");

  Object.assign(S.ui, {
    sub: "Cambie números inventados y vea, al instante, cómo reacciona cada una de las 35 pruebas de la auditoría, por qué reacciona y qué significa.",
    final_sub: "30 preguntas sobre las 35 pruebas. Se desbloquea después de 15 exámenes.",
    final_bloq: (f, t) => `Haga al menos ${t} exámenes de pruebas para desbloquear el examen final. Usted hizo ${f}.`,
    formula: (m, f) => `Nota final = 60% de la media de los 35 exámenes (${m}) + 40% del examen final (${f}). Los exámenes no hechos cuentan cero.`,
  });
  Object.assign(S.ui.tl, { metodo_v: "Método (igual al del Informe Técnico, Adenda A)", metodo_l: "Método simplificado (la prueba completa está en el Informe Técnico, Anexo B)" });
  Object.assign(S.ui.niveis, { variacao: "De la 1.ª a la 2.ª vuelta", log: "El log de la urna" });
  Object.assign(S.ui.niveis_d, {
    variacao: "Pruebas que comparan la 1.ª y la 2.ª vuelta para Presidente: cuánto ganó cada finalista y dónde el cambio se aparta del patrón.",
    log: "Pruebas que leen el log de la urna, con la hora de cada voto y de cada evento. Aquí en el simulador los criterios son simplificados; las pruebas completas están en el Informe Técnico (Anexo B).",
  });
  Object.assign(S.ui.cat, {
    transferencia: "Transferencia fuera de lo esperado", comp_direcionado: "Comparecencia atípica y dirigida", comp_atipico: "Comparecencia atípica",
    acima_teto_A: "El Candidato A ganó por encima del techo", acima_teto_B: "El Candidato B ganó por encima del techo", aptos_mudaram: "Cambiaron los electores habilitados",
    sem_bu_2t: "Sin boletín en la 2.ª vuelta", sem_bu_1t: "Sin boletín en la 1.ª vuelta",
    voto_tarde: "Votos después del horario", voto_tarde_fora: "Votos mucho después del horario, fuera del patrón", rajada: "Ráfaga de votos sin huella",
    tempo_curto: "Tiempo de voto muy corto", seq_sem_digital: "Secuencia larga sin huella", seq_com_falha: "Secuencia sin huella con falla del lector",
    voto_apos_sim: "Voto después de “¿todos ya votaron? SÍ”", retomada: "Votación reanudada después del NO", voto_desligada: "Voto con la urna apagada",
    muitos_reinicios: "3 reinicios o más", interrupcao: "Interrupción registrada", soma_log_bu: "Suma de las urnas ≠ boletín", voto_original_apos: "Voto en la urna original después del cambio",
    troca_registrada: "Cambio de urna registrado", tentativas_altas: "Intentos por encima de las secciones vecinas", tentativas_seguidas: "Intentos seguidos con el mismo resultado",
    nao_concluidos: "Votos no concluidos por encima de las vecinas", encerrar_antes: "Intento de cerrar antes del horario", varias_tentativas: "Más de un intento de cierre",
    sem_zeresima: "Sin zerésima", zeresima_depois: "Zerésima después del primer voto", zeresima_fora: "Zerésima fuera de la mañana de la elección",
    ajuste_durante: "Reloj ajustado durante la votación", relogio_errado: "Reloj con 15 min o más de diferencia", ajuste_fora: "Reloj ajustado fuera de la votación",
    versao_diferente: "Versión del programa distinta", carga_log_diferente: "Código de carga distinto", log_bu_diferentes: "Log y boletín con datos distintos",
    modelo_outro: "Modelo fuera de lo previsto", sem_digital_alto: "Habilitación sin huella por encima de las vecinas", muitas_tentativas: "Muchos electores con 4 intentos o más",
    log_incompleto: "Log incompleto o dañado", log_diferente_bu: "Votos del log ≠ comparecencia del boletín",
  });
  S.faqGeral.forEach((q) => {
    if (/60% de la media de los 15 exámenes/.test(q[1])) q[1] = "Cada examen vale de 0 a 10, y se aprueba con 7. La nota final es el 60% de la media de los 35 exámenes más el 40% del examen final, que se abre después de 15 exámenes. Puede rehacer los exámenes: vale la mejor nota.";
  });
  S.faqGeral.push(
    ["¿Cuáles son las 35 pruebas?", "Son 15 pruebas en los boletines de urna (T01 a T15), 6 en la variación de la 1.ª a la 2.ª vuelta (V1 a V6) y 14 en los logs de las urnas (L01 a L14). Las pruebas de los logs están concluidas en las dos vueltas (resultados en la página Logs de las urnas). Aquí en el simulador, los criterios de las pruebas L son simplificados."],
    ["¿Por qué las pruebas de los logs aquí son más simples?", "Las 14 pruebas de los logs están concluidas en las dos vueltas, y el criterio completo de cada una está en el Informe Técnico (Anexo B). Aquí en el simulador las reglas son simplificadas, para mostrar la idea de cada prueba con pocos números. Los resultados reales están en la página Logs de las urnas."],
    ["¿El log de la urna muestra por quién votó la persona?", "No. El log registra la hora de cada voto y de los eventos de la urna (encender, habilitar al elector, huella, cerrar), pero no a quién fue el voto ni el nombre del elector."],
  );

  // --- parte superior de la página inicial: qué tiene el simulador y cómo parar y seguir después ---
  Object.assign(S.ui, {
    t_titulo: "Qué tiene el simulador",
    t_testes: "pruebas para simular", t_testes_d: "15 pruebas de los boletines (T01 a T15), 6 de la variación entre vueltas (V1 a V6) y 14 de los logs de las urnas (L01 a L14).",
    t_missoes: "misiones", t_missoes_d: "12 en cada prueba de los boletines y 6 en cada prueba nueva. Son de tres tipos: haga que señale, falsa alarma y pasó inadvertido.",
    t_livre: "simulaciones libres", t_livre_d: "En el modo libre de cada prueba usted cambia los números como quiera o pide un caso nuevo, sin límite.",
    t_provas: "exámenes con nota", t_provas_d: "Un examen de 10 preguntas para cada prueba (15 minutos) y el examen final, con 30 preguntas sobre todas las pruebas (45 minutos).",
    t_banco: "preguntas en el banco de exámenes", t_banco_d: "Preguntas de concepto y de “¿qué prueba es esta?”. Las preguntas con casos se crean en el momento, así que cada examen es distinto.",
    t_faq: "preguntas y respuestas", t_faq_d: "Dudas respondidas en lenguaje sencillo: generales y de cada prueba.",
    ct_t: "Empiece cuando quiera, pare y siga después",
    ct_l: ["Empiece por cualquier prueba, misión, simulación libre o examen. No hace falta seguir el orden.",
      "Puede parar en cualquier momento: cerrar la página, ir a trabajar, dormir. Al volver, siga desde donde se quedó.",
      "Todo queda guardado en este navegador: misiones cumplidas, notas, el último caso que cambió en cada prueba y los exámenes a medias.",
      "En el examen, el reloj se detiene cuando usted sale y solo vuelve a contar cuando sigue.",
      "Para seguir, abra el simulador en el mismo dispositivo y en el mismo navegador.",
      "No se envía nada a ningún servidor. En ventana privada, en otro dispositivo o si borra los datos del navegador, el progreso no aparece."],
    ct_parou: "Se quedó en", ct_quando: (d) => (d ? `(${d})` : ""), ct_btn: "Seguir desde donde me quedé", ct_comecar: "Empezar por la Prueba 1", ct_escolher: "Elegir una prueba",
    ct_novo: "Todavía no empezó. Empiece por la Prueba 1 o elija cualquier prueba de la lista.", ct_provas: "Exámenes a medias",
    ret_t: "Examen a medias", ret_d: (r, n, t) => `Respondió ${r} de ${n} preguntas. Tiempo restante: ${t}.`,
    ret_nota: "El reloj quedó detenido mientras usted estaba fuera. Vuelve a contar cuando siga.",
    ret_btn: "Seguir el examen", ret_nova: "Descartar y empezar otro",
    apagar_conf: "¿Borrar todas las misiones, notas y exámenes a medias de este dispositivo?",
  });
  S.faqGeral.forEach((q) => {
    if (/^¿Dónde se guarda mi progreso/.test(q[0])) q[1] = "Solo en este navegador, en este dispositivo: misiones cumplidas, notas, el último caso que cambió en cada prueba y los exámenes a medias. No se envía nada a ningún lugar. Puede borrar todo en su boletín de notas.";
  });
  S.faqGeral.push(
    ["¿Puedo parar y seguir después?", "Sí. Cierre la página cuando quiera. Al volver, en el mismo dispositivo y en el mismo navegador, el simulador muestra dónde se quedó y el botón “Seguir desde donde me quedé”. En un examen a medias, el reloj queda detenido mientras usted está fuera."],
  );

  const T = {};
  const UN = {
    V1: { o: "el estado", d: "del estado", g: "en los demás estados", G: "Estados", f: "Estado ficticio", s: "estado" },
    V2: { o: "el municipio", d: "del municipio", g: "en los demás municipios del estado", G: "Municipios", f: "Municipio ficticio", s: "municipio" },
    V3: { o: "la sección", d: "de la sección", g: "en las secciones de la misma zona", G: "Secciones", f: "Sección ficticia", s: "sección" },
  };
  const opVar = (G) => ({ p: `Poco (${G.toLowerCase()} parecidos)`, m: "Medio", a: `Mucho (${G.toLowerCase()} distintos)` });
  function transfTxt(id) {
    const u = UN[id];
    return {
      vis: `Parte del Candidato A en los votos de los dos finalistas (${u.s} y grupo de comparación)`,
      vl: [`A en la 1.ª vuelta (${u.s})`, "A en la 1.ª vuelta (grupo)", "A en la 2.ª vuelta (grupo)", "A esperado en la 2.ª vuelta", "A observado en la 2.ª vuelta"],
      campos: { n: "Votos de los dos finalistas", a1: "% de A en la 1.ª vuelta", a2: "% de A en la 2.ª vuelta", g1: "% de A en el grupo, 1.ª vuelta", g2: "% de A en el grupo, 2.ª vuelta", var: `Cuánto varían los ${u.G.toLowerCase()} del grupo` },
      op: { var: opVar(u.G) },
      simples(s, r, f) {
        const v = r.v;
        if (r.nivel === "na") return [`Fuera de la prueba: ${u.o} tiene ${f.n(v.n)} votos de los dos finalistas, menos que el mínimo de 30 en cada vuelta.`];
        const out = [`En la 1.ª vuelta, el Candidato A tuvo el ${s.a1}% de los votos de los dos finalistas ${u.d}. ${u.g[0].toUpperCase() + u.g.slice(1)}, A pasó del ${s.g1}% al ${s.g2}%. Con el mismo cambio, lo esperado en la 2.ª vuelta era <b>${f.pct(v.pe)}</b>; lo observado fue <b>${f.pct(v.po)}</b> (${f.n(v.dif, 1)} puntos).`];
        if (r.nivel === "anom") out.push("<b>La prueba lo señala: la diferencia supera los 10 puntos y es muy rara por azar.</b> Eso no prueba nada: alianzas, apoyo de líderes y voto útil cambian el voto de forma legítima.");
        else if (r.nivel === "info") out.push("Diferencia de 5 a 10 puntos y rara por azar: queda como <b>informativo</b>.");
        else if (Math.abs(v.dif) >= 5) out.push(`<b>Dentro de lo esperado.</b> La diferencia parece grande, pero no es rara para el tamaño ${u.d} y para cuánto varía el grupo.`);
        else out.push("<b>Dentro de lo esperado.</b> El cambio acompaña al del grupo.");
        return out;
      },
      ficha: (s, f) => fichaL([`${u.f} con ${f.n(s.n)} votos de los dos finalistas`, `Candidato A: ${s.a1}% en la 1.ª vuelta y ${s.a2}% en la 2.ª vuelta`, `Grupo de comparación: A pasó del ${s.g1}% al ${s.g2}%`, `El grupo varía: ${opVar(u.G)[s.var].toLowerCase()}`]),
      kv: (s, r, f) => (r.v.pe == null ? [["Votos", f.n(r.v.n)]] : [["Esperado en la 2.ª vuelta", f.pct(r.v.pe)], ["Observado", f.pct(r.v.po)], ["Diferencia", `${f.n(r.v.dif, 1)} p.p.`], ["Probabilidad tras el ajuste (q)", f.sci(r.v.lq)]]),
      tec: (s, r, f) => {
        const v = r.v;
        if (r.nivel === "na") return [["Mínimo no alcanzado", `n = ${f.n(v.n)} < 30`]];
        return [["Desplazamiento del grupo", `Δ = logit(${s.g2}%) − logit(${s.g1}%) = ${f.n(v.d, 3)}`], ["Esperado", `p̂ = expit(logit((${f.n(v.x1)} + 0,5)/(${f.n(v.n)} + 1)) + Δ) = ${f.pct(v.pe, 2)}`],
          ["Observado", `${f.n(v.x2)} / ${f.n(v.n)} = ${f.pct(v.po, 2)} · diferencia ${f.n(v.dif, 1)} p.p.`], ["Puntaje z", `z₀ = ${f.n(v.z0, 2)} · φ = mediana(z₀²)/0,4549 = ${f.n(v.phi, 2)} · z = z₀/√φ = ${f.n(v.z, 2)}`],
          ["Probabilidad", `p = 2·P(Z > |z|) = ${f.sci(v.lp)}`], ["Ajuste de Benjamini–Hochberg", `q = min(1, p × ${f.n(v.M)}) = ${f.sci(v.lq)}`],
          ["Decisión", `q < 0,01 ${sim(v.sig)} · |dif| ≥ 10 p.p. → anomalía; ≥ 5 p.p. → informativo → ${luz(r)}`]];
      },
    };
  }
  T.V1 = Object.assign(transfTxt("V1"), {
    nome: "Transferencia atípica en el estado", curto: "Compara el cambio del voto de cada estado, de la 1.ª a la 2.ª vuelta, con el cambio de los demás estados.",
    m: [
      ["Vuelco en el estado", "Cambie la parte de A en la 2.ª vuelta a <b>62%</b>.", "Lo esperado era cerca del 50%. Más de 10 puntos por encima, en un estado entero, es muy raro: anomalía estadística."],
      ["Caída fuerte", "Cambie la parte de A en la 2.ª vuelta a <b>36%</b>.", "Vale en los dos sentidos: ganar o perder mucho más de lo esperado se señala."],
      ["Alianza regional", "El gobernador, muy popular, apoyó a A en la 2.ª vuelta. Cambie A a <b>63%</b>.", "La prueba lo señala, pero la causa es legítima. Una anomalía estadística es un punto a verificar, no una prueba."],
      ["Estados parecidos", "Aquí los estados varían poco entre sí. Cambie A a <b>56%</b>.", "Con un grupo homogéneo, 6 puntos ya son raros: informativo."],
      ["Todo el país cambió", "Cambie el grupo en la 2.ª vuelta a <b>58%</b> y A en la 2.ª vuelta a <b>59%</b>.", "Si todos cambian juntos, lo esperado cambia también. La prueba solo busca a quien se aparta del grupo."],
      ["Grupo muy variable", "Aquí los estados varían mucho. Cambie A a <b>56%</b>.", "Con un grupo muy variable, 6 puntos no son raros: dentro de lo esperado."],
    ],
    faq: [
      ["¿Por qué comparar con los demás estados?", "Porque todo el país cambia de la 1.ª a la 2.ª vuelta. La prueba aplica ese cambio general al estado y ve si quedó muy lejos de lo esperado."],
      ["¿Por qué solo Lula y Flávio Bolsonaro?", "Porque son los dos finalistas: solo ellos están en las dos vueltas. La prueba usa la parte de cada uno en los votos de los dos."],
    ],
    prova: [
      ["El V1 compara cada estado con:", "Los demás estados", "Los municipios del estado", "La 1.ª vuelta de 2022", "Las encuestas", "El cambio del resto del país da lo esperado."],
      ["Para señalar una anomalía, la diferencia debe ser:", "De 10 puntos o más y rara por azar (q < 0,01)", "De 1 punto o más", "Cualquier diferencia", "De 50 puntos", "Los dos criterios valen juntos."],
      ["Si todos los estados se mueven 8 puntos al mismo lado:", "Lo esperado se mueve también y la prueba no señala", "Todos se señalan", "La prueba se cancela", "Solo se señala el estado más grande", "La prueba busca a quien se aparta del grupo."],
      ["Una diferencia de 5 a 10 puntos, rara por azar, queda como:", "Informativo", "Anomalía", "Fuera de la prueba", "Error de datos", "Es la franja informativa."],
      ["Una alianza regional legítima puede:", "Hacer que la prueba señale sin nada irregular", "Impedir la prueba", "Cambiar la 1.ª vuelta", "Borrar la diferencia", "La prueba muestra el desvío, no la causa."],
      ["El factor de dispersión (φ) sirve para:", "Tener en cuenta cuánto varían naturalmente las unidades del grupo", "Redondear votos", "Elegir el estado", "Contar secciones", "Grupos más variables exigen diferencias mayores."],
    ],
    situ: ["En un estado, la parte de Lula en los votos de los finalistas subió 14 puntos de la 1.ª a la 2.ª vuelta, mientras en el resto del país subió 2.", "El resultado de la 2.ª vuelta de un estado quedó muy lejos de lo que indicaba el cambio de los demás estados."],
  });
  T.V2 = Object.assign(transfTxt("V2"), {
    nome: "Transferencia atípica en el municipio", curto: "Compara el cambio del voto de cada municipio, de la 1.ª a la 2.ª vuelta, con el de los demás municipios del estado.",
    m: [
      ["Vuelco en el municipio", "Cambie la parte de A en la 2.ª vuelta a <b>64%</b>.", "Más de 10 puntos por encima de lo esperado y raro por azar: anomalía estadística."],
      ["Caída en el municipio", "Cambie la parte de A en la 2.ª vuelta a <b>37%</b>.", "Perder mucho más de lo esperado también se señala."],
      ["Apoyo del alcalde", "El alcalde, muy popular, hizo campaña por A en la 2.ª vuelta. Cambie A a <b>65%</b>.", "Causa legítima, misma señal. Solo la verificación muestra la causa."],
      ["Municipios parecidos", "Los municipios de este estado varían poco. Cambie A a <b>57%</b>.", "Con un grupo homogéneo, 7 puntos quedan como informativo."],
      ["Todo el estado cambió", "Cambie el grupo en la 2.ª vuelta a <b>60%</b> y A en la 2.ª vuelta a <b>61%</b>.", "El municipio acompañó al estado: nada fuera del patrón."],
      ["Cambio pequeño", "Cambie A en la 2.ª vuelta a <b>53%</b>.", "3 puntos por encima de lo esperado están dentro del patrón."],
    ],
    faq: [
      ["¿Con quién se compara el municipio?", "Con los demás municipios del mismo estado. El cambio del conjunto de ellos da lo esperado para el municipio."],
      ["¿Los municipios pequeños pueden señalarse?", "Solo si tienen 30 votos o más de los finalistas en cada vuelta. En municipios pequeños, la diferencia debe ser mayor para ser rara."],
    ],
    prova: [
      ["El V2 compara el municipio con:", "Los demás municipios del mismo estado", "Todos los municipios del país", "Las secciones del municipio", "El municipio vecino", "El grupo es el estado."],
      ["¿Qué pasa si todo el estado se mueve 10 puntos?", "Lo esperado del municipio se mueve también", "Todos los municipios se señalan", "La prueba se detiene", "El municipio queda excluido", "La prueba busca a quien se aparta del grupo."],
      ["El apoyo de un alcalde popular a un finalista:", "Puede hacer que la prueba señale por una causa legítima", "Es fraude", "No cambia votos", "Anula la elección", "Una anomalía no es prueba."],
      ["¿Mínimo de votos de los finalistas por vuelta?", "30", "1.000", "10", "No hay mínimo", "Por debajo, domina el azar."],
      ["Una diferencia de 3 puntos respecto de lo esperado:", "Está dentro de lo esperado", "Es anomalía", "Es informativo", "Queda fuera de la prueba", "El límite mínimo es de 5 puntos."],
      ["El ajuste de Benjamini–Hochberg sirve para:", "Controlar las falsas alarmas al probar miles de municipios", "Sumar votos", "Elegir a los finalistas", "Calcular la comparecencia", "Muchas pruebas generan rarezas por azar."],
    ],
    situ: ["En un municipio, Flávio Bolsonaro ganó 15 puntos más de lo que indicaba el cambio de los demás municipios del estado.", "El cambio del voto de un municipio de la 1.ª a la 2.ª vuelta fue muy distinto del de los demás municipios del estado."],
  });
  T.V3 = Object.assign(transfTxt("V3"), {
    nome: "Transferencia atípica en la sección", curto: "Compara el cambio del voto de cada sección, de la 1.ª a la 2.ª vuelta, con el de las secciones vecinas.",
    m: [
      ["Vuelco en la sección", "Cambie la parte de A en la 2.ª vuelta a <b>82%</b>.", "Una sección de 220 votos con 32 puntos por encima de lo esperado es muy rara: anomalía estadística."],
      ["Caída en la sección", "Cambie la parte de A en la 2.ª vuelta a <b>18%</b>.", "También se señala cuando la parte de A cae mucho más de lo esperado."],
      ["Apoyo local", "Un líder comunitario del barrio apoyó a A en la 2.ª vuelta. Cambie A a <b>80%</b>.", "Causa legítima y localizada. La prueba lo señala; solo la verificación lo explica."],
      ["Electores trasladados", "La sección recibió, en la 2.ª vuelta, electores de otra sección con otro perfil. Cambie A a <b>20%</b>.", "Los cambios en el grupo de electores también cambian el resultado de la sección."],
      ["Sección pequeña", "Cambie A en la 2.ª vuelta a <b>63%</b> (13 puntos por encima).", "En 220 votos, 13 puntos todavía pueden venir del azar: dentro de lo esperado."],
      ["Muy pequeña", "Cambie los votos de los finalistas a <b>25</b> y A en la 2.ª vuelta a <b>90%</b>.", "Con menos de 30 votos, la sección queda fuera de la prueba."],
    ],
    faq: [
      ["¿Por qué una sección necesita diferencias mayores?", "Porque tiene pocos votos: en 200 votos, el azar solo mueve la parte de un candidato varios puntos. La prueba lo tiene en cuenta."],
      ["¿Con qué secciones se compara?", "Con las de la misma zona y municipio. Cuando hay pocas, usa el municipio, la zona o el estado."],
    ],
    prova: [
      ["El V3 compara la sección con:", "Las secciones de la misma zona y municipio", "Secciones de otro estado", "El resultado nacional", "Las encuestas", "Cuando hay pocas, el grupo se amplía."],
      ["Una sección de 220 votos con 13 puntos por encima de lo esperado:", "Puede estar dentro de lo esperado", "Siempre es anomalía", "Queda fuera de la prueba", "Es informativo", "Las secciones pequeñas varían más por azar."],
      ["Una sección con 25 votos de los finalistas:", "Queda fuera de la prueba", "Siempre se señala", "Es informativa", "Queda excluida de la elección", "El mínimo es 30 en cada vuelta."],
      ["Electores trasladados a la sección entre vueltas pueden:", "Cambiar el resultado sin nada irregular", "Anular la sección", "Poner los votos en cero", "No tener efecto", "Cambia el perfil de los electores."],
      ["La prueba también necesita que la sección tenga:", "Boletín en las dos vueltas", "Biometría", "Más de 500 electores", "Urna nueva", "Si no, no hay qué comparar."],
      ["Una señal en el V3 indica:", "Dónde conviene verificar el boletín y el acta", "Fraude comprobado", "Error del TSE", "Voto anulado", "Una anomalía es un punto a verificar."],
    ],
    situ: ["En una sección, la parte de Lula en los votos de los finalistas pasó del 45% en la 1.ª vuelta al 80% en la 2.ª, mientras las secciones vecinas cambiaron 3 puntos.", "El resultado de la 2.ª vuelta de una sección quedó muy lejos de lo que indicaba el cambio de las secciones vecinas."],
  });

  T.V4 = {
    nome: "Variación atípica de la comparecencia", curto: "Busca secciones en las que la comparecencia subió o bajó mucho más de lo esperado y si la variación fue a un solo finalista.",
    vis: "Comparecencia de la sección y del grupo (1.ª y 2.ª vuelta)",
    vl: ["Sección en la 1.ª vuelta", "Grupo en la 1.ª vuelta", "Grupo en la 2.ª vuelta", "Esperado en la 2.ª vuelta", "Sección en la 2.ª vuelta"],
    campos: { ap: "Electores habilitados", c1: "Comparecencia en la 1.ª vuelta", c2: "Comparecencia en la 2.ª vuelta", g1: "Comparecencia del grupo, 1.ª vuelta (%)", g2: "Comparecencia del grupo, 2.ª vuelta (%)",
      sa: "Parte de A en la sección (%)", dirA: "Parte de la variación que fue a A (%)", var: "Cuánto varían las secciones del grupo" },
    op: { var: opVar("Secciones") },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return ["Fuera de la prueba: la sección tiene menos de 20 electores habilitados."];
      const out = [`La comparecencia pasó del ${f.pct(v.c1 / v.ap)} al <b>${f.pct(v.po)}</b>. Según el grupo, lo esperado era <b>${f.pct(v.pe)}</b> (${f.n(v.dif, 1)} puntos).`];
      out.push(v.dir ? `La variación fue dirigida: el ${s.dirA}% quedó con ${v.destino}, muy por encima de la parte de ese finalista en la sección.` : "La variación se repartió entre los finalistas de forma parecida al voto de la sección.");
      if (r.nivel === "anom") out.push("<b>La prueba lo señala:</b> variación grande, rara por azar y hacia un solo lado. El transporte de electores, la movilización legítima y el cambio de local explican muchos casos.");
      else if (r.nivel === "info") out.push("Queda como <b>informativo</b>: la variación es grande, pero no fue a un solo finalista (o quedó entre 5 y 10 puntos).");
      else out.push("<b>Dentro de lo esperado.</b>");
      return out;
    },
    ficha: (s, f) => fichaL([`Sección ficticia con ${s.ap} electores habilitados`, `Comparecencia: ${s.c1} en la 1.ª vuelta y ${s.c2} en la 2.ª vuelta`, `Grupo: del ${s.g1}% al ${s.g2}%`, `El ${s.dirA}% de la variación fue a A (A tiene el ${s.sa}% en la sección)`]),
    kv: (s, r, f) => (r.v.pe == null ? [] : [["Esperado", f.pct(r.v.pe)], ["Observado", f.pct(r.v.po)], ["Diferencia", `${f.n(r.v.dif, 1)} p.p.`], ["Dirigida", r.v.dir ? `sí (${r.v.destino})` : "no"]]),
    tec: (s, r, f) => {
      const v = r.v;
      if (r.nivel === "na") return [["Mínimo no alcanzado", `habilitados = ${v.ap} < 20`]];
      return [["Esperado", `p̂ = expit(logit((${v.c1} + 0,5)/(${v.ap} + 1)) + [logit(${s.g2}%) − logit(${s.g1}%)]) = ${f.pct(v.pe, 2)}`], ["Observado", `${v.c2} / ${v.ap} = ${f.pct(v.po, 2)} · ${f.n(v.dif, 1)} p.p.`],
        ["Puntaje z", `z₀ = ${f.n(v.z0, 2)} · φ = ${f.n(v.phi, 2)} · z = ${f.n(v.z, 2)} · p = ${f.sci(v.lp)}`], ["Benjamini–Hochberg", `q = min(1, p × ${f.n(v.M)}) = ${f.sci(v.lq)}`],
        ["Dirección", `exceso = ΔX/ΔC − (X₁+X₂)/(C₁+C₂) = ${f.n(v.exc, 2)}; |ΔC| = ${Math.abs(v.dC)} ≥ 20 y exceso ≥ 0,30 → ${v.dir ? "dirigida" : "no dirigida"}`],
        ["Decisión", `q < 0,01 ${sim(v.sig)} · |dif| ≥ 10 p.p. y dirigida → anomalía; ≥ 5 p.p. → informativo → ${luz(r)}`]];
    },
    m: [
      ["La comparecencia se disparó", "Cambie la comparecencia de la 2.ª vuelta a <b>290</b> y la parte de la variación que fue a A a <b>95%</b>.", "Subió mucho más de lo esperado y casi todo fue a A: anomalía estadística."],
      ["La comparecencia se desplomó", "Cambie la comparecencia de la 2.ª vuelta a <b>190</b> y la parte de la variación de A a <b>95%</b>.", "La caída salió casi toda de los electores de A: variación grande y dirigida."],
      ["Transporte de electores", "Un autobús gratuito llevó a votar a electores de un barrio que vota por A. Comparecencia <b>288</b>, <b>100%</b> de la variación para A.", "La movilización legítima también se señala. Solo la verificación muestra la causa."],
      ["Terminó el feriado", "Mucha gente volvió de viaje para la 2.ª vuelta. Cambie la comparecencia a <b>285</b>, manteniendo el reparto igual.", "Variación grande, pero repartida entre los finalistas: informativo."],
      ["Toda la ciudad fue a votar", "Cambie el grupo en la 2.ª vuelta a <b>93%</b>, la comparecencia a <b>282</b> y el 100% de la variación para A.", "El grupo subió también: lo esperado sube y la prueba no señala."],
      ["Variación pequeña", "Cambie la comparecencia a <b>249</b> y el 100% de la variación para A.", "Solo 9 votos más: demasiado poco para la prueba."],
    ],
    faq: [
      ["¿Qué es una variación dirigida?", "Cuando la parte de la variación de la comparecencia que quedó con un finalista supera en 30 puntos la parte de él en la sección. Ej.: A tiene el 50% en la sección, pero se quedó con el 90% de los electores adicionales."],
      ["¿Una comparecencia mayor es mala?", "No. Que vote más gente es bueno. La prueba solo busca variaciones fuera del patrón de las secciones vecinas, para verificar."],
    ],
    prova: [
      ["Para que el V4 señale una anomalía, la variación debe ser:", "Grande, rara por azar y dirigida a un finalista", "Cualquier aumento", "Solo una caída", "De 1 voto", "Los tres criterios juntos."],
      ["Comparecencia mucho mayor, repartida igual entre los finalistas:", "Queda como informativo", "Es anomalía", "Queda fuera de la prueba", "Anula la sección", "Falta la dirección."],
      ["Si la comparecencia sube en toda la ciudad:", "Lo esperado sube también y la sección no se señala", "Todas se señalan", "La prueba se detiene", "Se vuelve anomalía", "La prueba compara con el grupo."],
      ["Mínimo de electores habilitados para el V4:", "20 en cada vuelta", "500", "1", "100.000", "Por debajo, queda fuera de la prueba."],
      ["El transporte gratuito de electores de un barrio:", "Puede hacer que la prueba señale por una causa legítima", "Siempre es fraude", "No cambia la comparecencia", "Cambia la 1.ª vuelta", "Una anomalía no es prueba."],
      ["La variación mínima en votos para ser dirigida es:", "20 votos", "1 voto", "500 votos", "No hay mínimo", "Las variaciones pequeñas no cuentan."],
    ],
    situ: ["En una sección, la comparecencia subió del 70% al 95% de la 1.ª a la 2.ª vuelta, y casi todos los votos nuevos fueron al mismo finalista.", "La comparecencia de una sección cayó mucho más que en las secciones vecinas entre las vueltas."],
  };

  T.V5 = {
    nome: "Ganancia por encima del techo de votos disponibles", curto: "Busca secciones en las que un finalista ganó más votos de los que había disponibles sin quitarle votos al otro.",
    vis: "Ganancia de cada finalista × votos disponibles (techo)", vl: ["Votos disponibles (techo)", "Ganancia de A", "Ganancia de B"],
    campos: { L1: "A en la 1.ª vuelta", F1: "B en la 1.ª vuelta", O1: "Demás candidatos en la 1.ª vuelta", BN1: "Blancos y nulos en la 1.ª vuelta", c2: "Comparecencia en la 2.ª vuelta", L2: "A en la 2.ª vuelta", F2: "B en la 2.ª vuelta" },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return ["Los votos de A y B en la 2.ª vuelta superan la comparecencia: corrija los números."];
      const out = [`Techo = demás candidatos (${s.O1}) + blancos y nulos (${s.BN1}) + aumento de la comparecencia (${Math.max(0, s.c2 - v.c1)}) = <b>${v.teto}</b>. A ganó ${f.n(v.gA)} y B ganó ${f.n(v.gB)}.`];
      if (r.nivel === "info") out.push(`<b>Informativo:</b> ${v.kA ? "A" : "B"} ganó ${f.n(v.kA ? v.exA : v.exB)} votos por encima del techo. Parte de los electores del otro finalista cambió su voto. Cambiar el voto es legítimo: el registro solo muestra dónde el cambio fue grande.`);
      else out.push("Ninguna ganancia supera el techo en 20 votos y en el 10% de los votos del otro finalista: dentro de lo esperado.");
      return out;
    },
    ficha: (s, f) => fichaL([`1.ª vuelta: A ${s.L1}, B ${s.F1}, demás ${s.O1}, blancos y nulos ${s.BN1}`, `2.ª vuelta: comparecencia ${s.c2}, A ${s.L2}, B ${s.F2}`]),
    kv: (s, r, f) => [["Techo", f.n(r.v.teto)], ["Ganancia de A", f.n(r.v.gA)], ["Ganancia de B", f.n(r.v.gB)], ["Exceso", f.n(Math.max(r.v.exA, r.v.exB))]],
    tec: (s, r, f) => { const v = r.v; return [["Techo", `O₁ + BN₁ + max(C₂ − C₁, 0) = ${s.O1} + ${s.BN1} + ${Math.max(0, s.c2 - v.c1)} = ${v.teto}`], ["Exceso de A", `(${s.L2} − ${s.L1}) − ${v.teto} = ${v.exA}; ≥ 20 y ≥ 10% × ${s.F1} → ${sim(v.kA)}`],
      ["Exceso de B", `(${s.F2} − ${s.F1}) − ${v.teto} = ${v.exB}; ≥ 20 y ≥ 10% × ${s.L1} → ${sim(v.kB)}`], ["Decisión", `siempre informativo → ${luz(r)}`]]; },
    m: [
      ["A superó el techo", "Cambie A en la 2.ª vuelta a <b>175</b> y B a <b>62</b>.", "A ganó 75 votos, pero solo había 40 disponibles: electores de B pasaron a A. Informativo."],
      ["B superó el techo", "Cambie B en la 2.ª vuelta a <b>170</b> y A a <b>67</b>.", "Vale para los dos finalistas."],
      ["Debate decisivo", "Después de un debate, electores de B se pasaron a A. A <b>165</b>, B <b>72</b>.", "Cambiar el voto es legítimo. La prueba solo lo registra, como informativo."],
      ["Más gente y cambio", "La comparecencia subió a <b>260</b>; B llegó a <b>182</b> y A a <b>68</b>.", "Aun con el techo mayor, B ganó por encima de él."],
      ["Exceso pequeño", "Cambie A a <b>155</b> y B a <b>85</b>.", "A superó el techo en 15 votos: por debajo del mínimo de 20, dentro de lo esperado."],
      ["Techo mayor", "Cambie la comparecencia a <b>300</b>, A a <b>185</b> y B a <b>108</b>.", "50 electores más aumentan el techo: la ganancia de A cabe en él."],
    ],
    faq: [
      ["¿Por qué el V5 es siempre informativo?", "Porque superar el techo solo muestra que electores cambiaron de un finalista al otro. Eso es legítimo; el registro muestra dónde el cambio fue grande."],
      ["¿Qué entra en el techo?", "Los votos de los demás candidatos y los blancos y nulos de la 1.ª vuelta, más el aumento de la comparecencia. Son los votos que un finalista puede ganar sin quitárselos al otro."],
    ],
    prova: [
      ["El techo del V5 es:", "Demás candidatos + blancos y nulos de la 1.ª vuelta + aumento de la comparecencia", "El total de electores", "Los votos de B", "La comparecencia de la 1.ª vuelta", "Son los votos disponibles."],
      ["Una ganancia por encima del techo muestra que:", "Electores cambiaron de un finalista al otro", "Hubo fraude", "La urna falló", "El boletín está mal", "Es un cambio legítimo."],
      ["El V5 señala como:", "Siempre informativo", "Siempre anomalía", "Anomalía por encima de 100 votos", "Fuera de la prueba", "Cambiar el voto es legítimo."],
      ["El exceso mínimo para registrar es:", "20 votos y el 10% de los votos del otro finalista en la 1.ª vuelta", "1 voto", "50%", "500 votos", "Los dos mínimos valen juntos."],
      ["Si la comparecencia sube 50 votos:", "El techo sube 50 votos", "El techo baja", "Nada cambia", "La prueba se detiene", "Los nuevos electores son votos disponibles."],
      ["Un exceso de 15 votos por encima del techo:", "Está dentro de lo esperado", "Es anomalía", "Es informativo", "Anula la sección", "Por debajo del mínimo de 20."],
    ],
    situ: ["En una sección, un finalista ganó de la 1.ª a la 2.ª vuelta más votos que la suma de los votos de los demás candidatos, blancos, nulos y nuevos electores.", "Los datos muestran que electores de un finalista se pasaron al otro en una sección."],
  };

  T.V6 = {
    nome: "Padrón modificado entre las vueltas", curto: "Busca secciones en las que el número de electores habilitados cambió mucho entre las vueltas o que tienen boletín en una sola vuelta.",
    vis: "Electores habilitados en la 1.ª y en la 2.ª vuelta",
    campos: { ap1: "Habilitados en la 1.ª vuelta", ap2: "Habilitados en la 2.ª vuelta", bu1: "Tiene boletín en la 1.ª vuelta", bu2: "Tiene boletín en la 2.ª vuelta" },
    simples(s, r, f) {
      if (r.nivel === "na") return ["La sección no tiene boletín en ninguna vuelta."];
      if (r.cats.length && r.cats[0].c !== "aptos_mudaram") return [`<b>Informativo:</b> la sección tiene boletín solo en la ${s.bu1 ? "1.ª" : "2.ª"} vuelta.`, "Ocurre con secciones creadas, unidas o eliminadas entre las vueltas y con secciones especiales."];
      const out = [`Los habilitados pasaron de ${s.ap1} a ${s.ap2} (${s.ap2 - s.ap1 >= 0 ? "+" : ""}${s.ap2 - s.ap1}, ${f.pct(r.v.rel)}).`];
      out.push(r.nivel === "info" ? "<b>Informativo:</b> cambio de 20 electores o más y del 10% o más. El voto en tránsito, las secciones especiales y las decisiones de la Justicia Electoral cambian el padrón." : "Dentro de lo esperado: los cambios pequeños en el padrón son normales.");
      return out;
    },
    ficha: (s, f) => fichaL([`Habilitados: ${s.ap1} en la 1.ª vuelta y ${s.ap2} en la 2.ª vuelta`, `Boletín en la 1.ª vuelta: ${s.bu1 ? "sí" : "no"} · en la 2.ª vuelta: ${s.bu2 ? "sí" : "no"}`]),
    kv: (s, r, f) => [["Habilitados 1.ª vuelta", f.n(s.ap1)], ["Habilitados 2.ª vuelta", f.n(s.ap2)], ["Cambio", `${s.ap2 - s.ap1} (${f.pct(r.v.rel)})`]],
    tec: (s, r, f) => [["Variación", `|${s.ap2} − ${s.ap1}| = ${Math.abs(s.ap2 - s.ap1)}; ≥ 20 y ≥ 10% × ${s.ap1} → ${sim(r.cats.some((c) => c.c === "aptos_mudaram"))}`], ["Boletines", `1.ª vuelta ${sim(s.bu1)} · 2.ª vuelta ${sim(s.bu2)}`], ["Decisión", `siempre informativo → ${luz(r)}`]],
    m: [
      ["Más electores", "Cambie los habilitados de la 2.ª vuelta a <b>345</b>.", "45 electores más (15%): informativo."],
      ["Sin boletín en la 2.ª vuelta", "Desmarque <b>Tiene boletín en la 2.ª vuelta</b>.", "Una sección con boletín en una sola vuelta queda registrada como informativa."],
      ["Sección especial", "La sección recibió presos sin condena que votan en la 2.ª vuelta. Cambie los habilitados a <b>380</b>.", "Las secciones especiales cambian el padrón de forma legítima."],
      ["Voto en tránsito", "Parte de los electores pidió voto en tránsito para la 2.ª vuelta. Cambie los habilitados a <b>250</b>.", "Las caídas también se registran."],
      ["Cambio pequeño", "Cambie los habilitados de la 2.ª vuelta a <b>318</b>.", "18 electores más: por debajo del mínimo de 20."],
      ["Sección grande", "En una sección de 600 electores, cambie los habilitados de la 2.ª vuelta a <b>650</b>.", "50 electores son solo el 8%: por debajo del 10%, dentro de lo esperado."],
    ],
    faq: [
      ["¿El padrón puede cambiar entre las vueltas?", "Sí, por el voto en tránsito, las secciones especiales (presos sin condena, hospitales) y las decisiones de la Justicia Electoral. Por eso el V6 es solo informativo."],
      ["¿Por qué registrar una sección con boletín en una sola vuelta?", "Porque no se puede comparar en las demás pruebas de variación. El registro ayuda a verificar el motivo."],
    ],
    prova: [
      ["El V6 es:", "Siempre informativo", "Siempre anomalía", "Anomalía por encima de 100 electores", "Una prueba de horario", "Los cambios en el padrón tienen causas legítimas."],
      ["El V6 registra cambios de:", "20 electores o más y del 10% o más", "1 elector", "50%", "Cualquier tamaño", "Los dos mínimos valen juntos."],
      ["Una sección con boletín solo en la 1.ª vuelta:", "Queda registrada como informativa", "Se anula", "Se ignora", "Es anomalía", "No se pueden comparar las vueltas."],
      ["¿Cuál de estas causas cambia el padrón entre las vueltas?", "El voto en tránsito", "La biometría", "El horario de apertura", "El código de carga", "Es una causa legítima."],
      ["En una sección de 600 electores, 50 más:", "Está dentro de lo esperado (8%)", "Es informativo", "Es anomalía", "Queda fuera de la prueba", "Por debajo del 10%."],
      ["¿Para qué sirve el V6?", "Mostrar dónde cambió el padrón y explicar variaciones en otras pruebas", "Contar votos", "Encontrar fraude", "Medir la biometría", "Es un registro de contexto."],
    ],
    situ: ["Una sección tenía 300 electores habilitados en la 1.ª vuelta y 360 en la 2.ª vuelta.", "Una sección aparece con boletín de urna solo en la 1.ª vuelta."],
  };

  // ============================== L01 a L14 (criterios preliminares) ==============================
  const regKv = (r, f, fm) => [["Esta sección", fm(r.v.regua.alvo)], ["Mediana de la región", fm(r.v.med)], ["Puntaje z robusto", f.n(r.v.z, 1)]];
  const regTec = (r, f, fm, regra) => [["Región", `40 secciones ficticias del municipio y vecinas · mediana ${fm(r.v.med)}`], ["Puntaje z robusto", `z = 0,6745 · (x − mediana) / MAD = ${f.n(r.v.z, 2)}`], ["Regla (simplificada)", regra], ["Decisión", luz(r)]];
  const mn = (f) => (x) => `${f.n(x, 0)} min`, sg = (f) => (x) => `${f.n(x, 0)} s`, pc = (f) => (x) => `${f.n(x, 1)}%`;

  T.L01 = {
    nome: "Votos después del horario oficial", curto: "Cuenta los votos registrados en el log después del horario oficial y compara el retraso con el de las secciones vecinas.",
    vis: "Cuántos minutos después de las 17 h cada sección recibió el último voto (puntos: región; rombo: esta sección)",
    campos: { ult: "Hora del último voto (hora local)", napos: "Votos después de las 17 h", cidade: "En la ciudad" },
    op: { cidade: { pouca: "Poca fila: las vecinas cerraron enseguida", muita: "Mucha fila: varias vecinas cerraron tarde" } },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "ok") return ["Ningún voto después del horario oficial (17 h, hora local): nada que registrar."];
      const out = [`El último voto fue a las <b>${f.hora(s.ult)}</b>, ${f.n(v.at, 0)} minutos después de las 17 h, con ${s.napos} votos después del horario. En las secciones vecinas, la mediana fue de ${f.n(v.med, 0)} minutos.`];
      out.push(r.nivel === "anom" ? "<b>La prueba lo señala:</b> votos mucho después del horario y fuera del patrón de las vecinas. La fila larga, la apertura tardía y el cambio de urna explican casos; el acta registra la entrega de turnos."
        : "<b>Informativo:</b> quien estaba en la fila a las 17 h puede votar. El log no muestra si había fila.");
      return out;
    },
    ficha: (s, f) => fichaL([`Último voto a las ${f.hora(s.ult)} (hora local); ${s.napos} votos después de las 17 h`, s.cidade === "muita" ? "En la ciudad, varias secciones cerraron tarde" : "En la ciudad, las secciones cerraron poco después de las 17 h"]),
    kv: (s, r, f) => regKv(r, f, mn(f)),
    tec: (s, r, f) => regTec(r, f, mn(f), "votos después de las 17 h → informativo; z ≥ 3,5 y retraso ≥ 60 min → anomalía"),
    m: [
      ["Hasta la noche", "Cambie el último voto a <b>20:10</b> y los votos después de las 17 h a <b>80</b>.", "Más de 3 horas después, con las vecinas cerrando enseguida: anomalía estadística."],
      ["Dos horas después", "Cambie solo el último voto a <b>19:00</b>.", "Mucho más allá de las vecinas: se señala."],
      ["Fila de verdad", "La urna abrió con retraso y la fila fue larga. Último voto a las <b>18:30</b>, <b>45</b> votos después.", "Causa legítima, misma señal. Solo el acta confirma los turnos."],
      ["Fila normal", "Último voto a las <b>17:20</b>, con <b>12</b> votos después de las 17 h.", "Votar después del horario con fila está permitido: informativo."],
      ["Toda la ciudad con fila", "Elija <b>Mucha fila</b>, último voto a las <b>18:40</b> y <b>60</b> votos después.", "Si las vecinas también cerraron tarde, la sección no se aparta del patrón: solo informativo."],
      ["Quien no estaba en la fila", "Último voto a las <b>17:25</b>, con <b>10</b> votos después.", "El log no muestra si la persona ya estaba en la fila: la prueba no puede verlo."],
    ],
    faq: [["¿Se puede votar después de las 17 h?", "Sí, quien ya estaba en la fila a las 17 h. La mesa entrega turnos. Por eso los votos después del horario son, en general, solo informativos."],
      ["¿Qué horario vale en la 2.ª vuelta?", "En 2026, el cierre de la 2.ª vuelta se extendió hasta las 19 h de Brasilia. La prueba usa el horario oficial de cada vuelta, convertido a la hora local."]],
    prova: [
      ["Votos después del horario, con fila:", "Quedan como informativo", "Son siempre anomalía", "Se anulan", "Quedan fuera de la prueba", "Quien estaba en la fila puede votar."],
      ["El L01 señala una anomalía cuando:", "La urna recibe votos mucho después del horario, fuera del patrón de las vecinas", "Hay 1 voto después de las 17 h", "La urna abre a las 8 h", "Hay biometría", "Necesita el retraso y el contraste con la región."],
      ["¿El log muestra si la persona estaba en la fila?", "No", "Sí", "Solo en la 2.ª vuelta", "Solo con biometría", "El acta registra los turnos."],
      ["Si toda la ciudad cerró tarde:", "La sección no se aparta del patrón y no es anomalía", "Todas son anomalía", "La prueba se detiene", "Los votos se anulan", "La prueba compara con las vecinas."],
      ["El L01 usa la hora:", "Local del municipio, convertida del horario oficial", "Siempre de Brasilia", "Del celular del miembro de mesa", "Del TSE", "Cada municipio tiene su huso."],
      ["¿Cuál de estas causas explica votos muy tarde?", "Apertura tardía y fila larga", "Buena biometría", "Urna nueva", "Zerésima", "Es una causa legítima."],
    ],
    situ: ["El log de una urna muestra votos registrados hasta las 20 h, mientras las urnas vecinas cerraron hacia las 17:10.", "Una sección tuvo 40 votos registrados después del horario oficial de cierre."],
  };
  T.L02 = {
    nome: "Tiempo de cada voto (votos rápidos y en ráfaga)", curto: "Mide el tiempo entre un voto y el siguiente y busca ráfagas de votos sin huella.",
    vis: "Tiempo mediano entre votos (puntos: región; rombo: esta sección)",
    campos: { raj: "Mayor ráfaga (votos seguidos con 30 s o menos)", semdig: "La ráfaga se habilitó sin huella", med: "Tiempo mediano entre votos (segundos)" },
    simples(s, r, f) {
      const out = [`La mayor ráfaga tiene <b>${s.raj}</b> votos seguidos con 30 segundos o menos entre ellos${s.raj ? (s.semdig ? ", habilitados sin huella" : ", con huella") : ""}. El tiempo mediano entre votos es de ${s.med} s (región: ${f.n(r.v.med, 0)} s).`];
      if (r.cats.some((c) => c.c === "rajada")) out.push("<b>La prueba lo señala:</b> 5 o más votos seguidos en 30 s o menos, sin huella. Un lector biométrico defectuoso y electores rápidos explican casos; el log no muestra quién estaba en la cabina.");
      else if (r.nivel === "info") out.push("<b>Informativo:</b> el tiempo mediano está muy por debajo de la región. Una boleta corta y electores rápidos acortan el tiempo.");
      else out.push("Dentro de lo esperado.");
      return out;
    },
    ficha: (s, f) => fichaL([`Mayor ráfaga: ${s.raj} votos seguidos con 30 s o menos${s.semdig ? ", sin huella" : ", con huella"}`, `Tiempo mediano entre votos: ${s.med} s`]),
    kv: (s, r, f) => [["Mayor ráfaga", `${s.raj}`], ["Sin huella", s.semdig ? "sí" : "no"]].concat(regKv(r, f, sg(f))),
    tec: (s, r, f) => [["Ráfaga", `${s.raj} ≥ 5 y sin huella → ${sim(s.raj >= 5 && s.semdig)} (anomalía)`]].concat(regTec(r, f, sg(f), "z ≤ −3,5 en el tiempo mediano → informativo")),
    m: [
      ["Ráfaga corta", "Cambie la mayor ráfaga a <b>6</b> y marque <b>sin huella</b>.", "6 votos en secuencia rápida, sin huella: anomalía estadística."],
      ["Ráfaga larga", "Cambie la mayor ráfaga a <b>15</b>, sin huella.", "Cuanto mayor la ráfaga sin huella, más rara."],
      ["Lector roto", "El lector de huellas se rompió y 5 electores rápidos votaron seguidos. Ráfaga <b>5</b>, sin huella.", "Causa legítima, misma señal. El acta registra la falla del lector."],
      ["Electores rápidos", "Sección de electores jóvenes: cambie el tiempo mediano a <b>35 s</b>.", "Muy por debajo de la región: informativo."],
      ["Casi ráfaga", "Cambie la ráfaga a <b>4</b>, sin huella.", "Por debajo de 5 votos, la prueba no señala."],
      ["Rápidos con huella", "Cambie la ráfaga a <b>10</b>, <b>con huella</b>.", "Los votos rápidos con la huella de cada elector no se señalan."],
    ],
    faq: [["¿Por qué 30 segundos?", "Es menos que el tiempo normal para votar por todos los cargos. Votos seguidos tan rápidos, sin huella, merecen verificación."],
      ["¿La prueba ve quién votó?", "No. El log muestra la hora de cada voto y si hubo huella, no quién estaba en la cabina ni por quién votó."]],
    prova: [
      ["El L02 señala una anomalía cuando hay:", "5 o más votos seguidos con 30 s o menos, sin huella", "1 voto rápido", "Votos con huella", "Fila", "Ráfaga sin huella."],
      ["Una ráfaga de votos rápidos con huella:", "No se señala", "Es anomalía", "Es informativo", "Anula la urna", "Cada elector se identificó."],
      ["Un tiempo mediano muy por debajo de la región queda como:", "Informativo", "Anomalía", "Fuera de la prueba", "Error", "Puede tener una causa legítima."],
      ["¿Qué puede explicar una ráfaga sin huella?", "Un lector biométrico defectuoso", "Zerésima", "Código de carga", "Huso horario", "El miembro de mesa habilita con un código."],
      ["Una ráfaga de 4 votos sin huella:", "No se señala", "Es anomalía", "Es informativo", "Queda fuera de la prueba", "El mínimo es 5."],
      ["¿El log muestra por quién fue el voto?", "No", "Sí", "Solo en la ráfaga", "Solo en la 2.ª vuelta", "Muestra solo la hora y los eventos."],
    ],
    situ: ["El log de una urna muestra 8 votos seguidos con 20 segundos entre ellos, todos habilitados sin huella.", "En una sección, el tiempo entre un voto y el siguiente es mucho menor que en las secciones vecinas."],
  };
  T.L03 = {
    nome: "Habilitaciones sin huella seguidas", curto: "Busca secuencias largas de electores habilitados sin huella, con el código del miembro de mesa.",
    vis: "Resumen del log de la sección",
    campos: { seq: "Mayor secuencia de habilitaciones sin huella", bio: "Electores con biometría registrada (%)", falha: "El log registra falla del lector en el período" },
    simples(s, r) {
      if (r.nivel === "na") return [`Fuera de la prueba: solo el ${s.bio}% de los electores tiene biometría registrada. Sin biometría, habilitar con el código es lo normal (ej.: en el exterior).`];
      const out = [`La mayor secuencia de electores habilitados sin huella es de <b>${s.seq}</b>.`];
      if (r.nivel === "anom") out.push("<b>La prueba lo señala:</b> 10 o más habilitaciones seguidas sin huella, sin falla registrada del lector. Huellas gastadas y un lector defectuoso explican casos; solo el acta lo confirma.");
      else if (r.nivel === "info") out.push("<b>Informativo:</b> la secuencia coincide con una falla del lector registrada en el log.");
      else out.push("Dentro de lo esperado: algunas habilitaciones sin huella son normales.");
      return out;
    },
    ficha: (s) => fichaL([`Mayor secuencia sin huella: ${s.seq}`, `Electores con biometría: ${s.bio}%`, `Falla del lector en el log: ${s.falha ? "sí" : "no"}`]),
    kv: (s) => [["Mayor secuencia", String(s.seq)], ["Con biometría", `${s.bio}%`], ["Falla del lector", s.falha ? "sí" : "no"]],
    tec: (s, r) => [["Elegible", `biometría ${s.bio}% ≥ 50% → ${sim(s.bio >= 50)}`], ["Secuencia", `${s.seq} ≥ 10 → ${sim(s.seq >= 10)}`], ["Falla registrada", sim(s.falha)], ["Decisión (simplificada)", `secuencia sin falla → anomalía; con falla → informativo → ${luz(r)}`]],
    m: [
      ["Secuencia larga", "Cambie la mayor secuencia a <b>12</b>.", "12 electores seguidos sin huella, sin falla del lector: anomalía estadística."],
      ["Secuencia muy larga", "Cambie la secuencia a <b>40</b>.", "Cuanto más larga, más rara."],
      ["Huellas gastadas", "Un grupo de trabajadores rurales con huellas gastadas votó seguido. Secuencia <b>10</b>.", "Causa legítima, misma señal."],
      ["El lector se rompió", "El lector se rompió y el log registró la falla. Secuencia <b>30</b> y marque la falla.", "Con la falla registrada, queda como informativo."],
      ["Casi", "Cambie la secuencia a <b>9</b>.", "Por debajo de 10, no se señala."],
      ["Sección en el exterior", "Solo el 20% de los electores tiene biometría. Cambie la biometría a <b>20%</b> y la secuencia a <b>50</b>.", "Sin biometría registrada, habilitar con el código es lo normal: fuera de la prueba."],
    ],
    faq: [["¿Qué es habilitar sin huella?", "Cuando la huella no se reconoce, el miembro de mesa habilita al elector digitando un código, después de verificar el documento. Está previsto."],
      ["¿Por qué mirar secuencias?", "Una habilitación sin huella aislada es común. Muchas seguidas, sin falla del lector, merecen verificación en el acta."]],
    prova: [
      ["El L03 señala una anomalía con:", "10 o más habilitaciones seguidas sin huella, sin falla del lector", "1 habilitación sin huella", "Votos con huella", "Fila", "La secuencia es la señal."],
      ["Si el log registra una falla del lector en el período:", "Queda como informativo", "Se vuelve anomalía grave", "La prueba se detiene", "Anula la sección", "La falla explica la secuencia."],
      ["Una sección con el 20% de electores con biometría:", "Queda fuera de la prueba", "Siempre se señala", "Es informativa", "Se anula", "Sin biometría, habilitar con el código es lo normal."],
      ["¿Quién habilita al elector sin huella?", "El miembro de mesa, con un código, tras verificar el documento", "El propio elector", "El TSE", "Nadie", "Es un procedimiento previsto."],
      ["Una secuencia de 9:", "No se señala", "Es anomalía", "Es informativo", "Queda fuera de la prueba", "El mínimo es 10."],
      ["¿Qué puede explicar secuencias sin huella?", "Huellas gastadas y lector defectuoso", "Zerésima", "Huso", "Código de carga", "Son causas legítimas."],
    ],
    situ: ["El log de una sección muestra 25 electores seguidos habilitados con el código del miembro de mesa, sin huella, sin falla del lector registrada.", "En una sección donde casi todos tienen biometría, una larga secuencia de votos se habilitó sin huella."],
  };
  T.L04 = {
    nome: "Votos después del “¿todos ya votaron? SÍ”", curto: "Verifica si la urna registró votos después de que el miembro de mesa confirmara, al cierre, que todos ya votaron.",
    vis: "Línea de tiempo del cierre (hora local)",
    campos: { resp: "Respuesta del miembro de mesa", depois: "Votos registrados después de la respuesta", registra: "Esta urna registra la pregunta en el log" },
    op: { resp: { sim: "SÍ (todos ya votaron)", nao: "NO (todavía hay electores)" } },
    marcas: (s, r) => { const H = window.SIMM.H; const m = [{ t: H(8), k: "o", rot: "apertura" }, { t: H(17, 5), k: "o", rot: `pregunta: ${s.resp === "sim" ? "SÍ" : "NO"}` }]; if (s.depois) m.push({ t: H(17, 12), k: r.nivel === "anom" ? "x" : "i", rot: `${s.depois} voto(s)` }); return m; },
    simples(s, r) {
      if (r.nivel === "na") return ["Fuera de la prueba: esta urna no registra la pregunta en el log, así que no se sabe la hora de la respuesta."];
      if (r.nivel === "anom") return [`<b>La prueba lo señala:</b> ${s.depois} voto(s) registrado(s) después de que el miembro de mesa respondiera SÍ. Después de esa respuesta, la votación debería terminar.`, "Puede ser un error del miembro de mesa al responder; el acta registra el cierre."];
      if (r.nivel === "info") return [`El miembro de mesa respondió NO y la votación siguió con ${s.depois} voto(s): <b>informativo</b>. Reanudar la votación está previsto.`];
      return ["Ningún voto después de la respuesta: todo en orden."];
    },
    ficha: (s) => fichaL([`Respuesta a la pregunta “¿todos ya votaron?”: ${s.resp === "sim" ? "SÍ" : "NO"}`, `Votos registrados después: ${s.depois}`, `La urna registra la pregunta en el log: ${s.registra ? "sí" : "no"}`]),
    kv: (s) => [["Respuesta", s.resp === "sim" ? "SÍ" : "NO"], ["Votos después", String(s.depois)]],
    tec: (s, r) => [["Registro", sim(s.registra)], ["Regla (simplificada)", "voto después de SÍ → anomalía; después de NO → informativo"], ["Decisión", luz(r)]],
    m: [
      ["Un voto más", "Cambie los votos después de la respuesta a <b>1</b>.", "Cualquier voto después del SÍ se señala."],
      ["Muchos votos después", "Cambie a <b>15</b> votos.", "La votación siguió después de que el miembro de mesa dijera que todos ya habían votado."],
      ["Error del miembro de mesa", "El miembro de mesa respondió SÍ por error y 2 electores de la fila votaron. Cambie a <b>2</b>.", "Causa explicable, misma señal. El acta lo registra."],
      ["Todavía había fila", "Elija <b>NO</b> y cambie los votos después a <b>3</b>.", "Con NO, reanudar está previsto: informativo."],
      ["Urna que no registra", "Desmarque <b>Esta urna registra la pregunta</b> y ponga 5 votos después.", "Sin el registro, la prueba no puede verlo: fuera de la prueba."],
      ["Fila larga con NO", "Elija <b>NO</b> y cambie a <b>20</b> votos.", "Aun con muchos votos, después del NO es solo informativo."],
    ],
    faq: [["¿Qué es la pregunta “¿todos ya votaron?”", "Al cierre, la urna pregunta al miembro de mesa si todos los electores presentes ya votaron. Con SÍ, la votación termina; con NO, continúa."],
      ["¿Todas las urnas registran esa pregunta?", "Depende del modelo y del programa. Donde no hay registro, la prueba no evalúa."]],
    prova: [
      ["Un voto registrado después de la respuesta SÍ:", "Es anomalía", "Es informativo", "Es normal", "Queda fuera de la prueba", "Después del SÍ, la votación termina."],
      ["Votos después de la respuesta NO:", "Son informativos", "Son anomalía", "Se anulan", "Están prohibidos", "Reanudar está previsto."],
      ["Si la urna no registra la pregunta:", "El caso queda fuera de la prueba", "Siempre se señala", "Es informativo", "Es anomalía", "No se sabe la hora."],
      ["¿Qué puede explicar un voto después del SÍ?", "Un error del miembro de mesa al responder", "Biometría", "Zerésima", "Huso", "El acta lo registra."],
      ["Con SÍ, la votación:", "Termina", "Continúa", "Vuelve a empezar", "Cambia de urna", "Es el cierre."],
      ["El L04 es una prueba:", "Del orden de los eventos en el log", "De votos por candidato", "De biometría", "Del padrón", "Verifica la secuencia del cierre."],
    ],
    situ: ["El log muestra que el miembro de mesa confirmó que todos ya habían votado y, después, la urna registró 3 votos más.", "Una urna registró votos después de la confirmación de cierre de la votación."],
  };
  T.L05 = {
    nome: "Cortes de energía e interrupciones", curto: "Encuentra cortes de energía, apagados y reinicios de la urna durante la votación.",
    vis: "Línea de tiempo de las interrupciones (hora local)",
    campos: { quedas: "Reinicios / cortes de energía", min: "Minutos detenida en total", dentro: "Hay un voto con hora dentro de una interrupción" },
    marcas: (s, r) => { const H = window.SIMM.H, m = []; for (let i = 0; i < s.quedas; i++) m.push({ t: H(9 + 2 * i, 30), k: s.quedas >= 3 ? "x" : "i", rot: `corte ${i + 1}` }); if (s.dentro && s.quedas) m.push({ t: H(9, 35), k: "x", rot: "voto" }); return m; },
    simples(s, r) {
      if (r.nivel === "ok") return ["Ninguna interrupción registrada."];
      const out = [`El log registra ${s.quedas} interrupción(es), ${s.min} minutos detenida en total.`];
      if (r.cats.some((c) => c.c === "voto_desligada")) out.push("<b>La prueba lo señala:</b> hay un voto con hora dentro del período en que la urna estaba apagada. No debería pasar; un reloj desajustado es una explicación posible.");
      else if (r.nivel === "anom") out.push("<b>La prueba lo señala:</b> 3 reinicios o más. Las tormentas y una red eléctrica inestable explican casos; el acta los registra.");
      else out.push("<b>Informativo:</b> los cortes de energía ocurren. La batería de la urna mantiene la votación.");
      return out;
    },
    ficha: (s) => fichaL([`Interrupciones: ${s.quedas} · ${s.min} minutos detenida`, `Voto con hora dentro de una interrupción: ${s.dentro ? "sí" : "no"}`]),
    kv: (s) => [["Interrupciones", String(s.quedas)], ["Minutos detenida", String(s.min)], ["Voto durante", s.dentro ? "sí" : "no"]],
    tec: (s, r) => [["Regla (simplificada)", "voto durante la interrupción o 3+ reinicios → anomalía; 1–2 interrupciones → informativo"], ["Decisión", luz(r)]],
    m: [
      ["Voto a oscuras", "Ponga <b>1</b> interrupción y marque <b>Hay un voto dentro de una interrupción</b>.", "Voto con hora en que la urna estaba apagada: anomalía."],
      ["Muchos reinicios", "Cambie a <b>3</b> reinicios.", "3 o más reinicios se señalan."],
      ["Tormenta", "Una tormenta cortó la luz 4 veces. Cambie a <b>4</b> cortes.", "Causa legítima, misma señal."],
      ["Un corte", "Cambie a <b>1</b> corte de <b>20</b> minutos.", "Un corte es informativo."],
      ["Dos cortes", "Cambie a <b>2</b> cortes.", "Por debajo de 3, solo informativo."],
      ["Parada larga", "Cambie a 1 corte de <b>90</b> minutos.", "El tiempo detenida por sí solo no es criterio: informativo."],
    ],
    faq: [["¿La urna funciona sin luz?", "Sí, tiene batería. Aun así, los cortes y reinicios quedan registrados en el log."],
      ["¿Por qué un voto durante la interrupción es grave?", "Porque la urna apagada no registra votos. Un voto con hora en ese intervalo indica un reloj equivocado o un registro a verificar."]],
    prova: [
      ["Un voto con hora dentro de una interrupción:", "Es anomalía", "Es normal", "Es informativo", "Queda fuera de la prueba", "La urna apagada no registra votos."],
      ["Un corte de energía:", "Es informativo", "Es anomalía", "Anula la sección", "No se registra", "Ocurre."],
      ["¿Cuántos reinicios señalan una anomalía?", "3 o más", "1", "10", "Ninguno", "Muchos reinicios merecen verificación."],
      ["¿La urna funciona sin energía eléctrica?", "Sí, con batería", "No", "Solo en la 2.ª vuelta", "Solo de mañana", "La batería mantiene la votación."],
      ["90 minutos detenida, sin voto durante:", "Informativo", "Anomalía", "Fuera de la prueba", "Anulación", "El tiempo solo no es criterio."],
      ["¿Qué puede explicar muchos cortes?", "Tormenta y red eléctrica inestable", "Biometría", "Zerésima", "Carga", "Causas legítimas."],
    ],
    situ: ["El log de una urna muestra cuatro apagados y reencendidos durante la votación.", "Aparece un voto registrado a una hora en que, según el log, la urna estaba apagada."],
  };
  T.L06 = {
    nome: "Cambio de urna", curto: "Verifica los cambios de urna durante la votación y si los votos de las urnas suman la comparecencia del boletín.",
    vis: "Votos en el log de cada urna × boletín",
    campos: { troca: "Hubo cambio de urna", v1: "Votos en el log de la urna original", v2: "Votos en el log de la urna sustituta", comp: "Comparecencia en el boletín", depois: "Votos en la urna original después del cambio" },
    simples(s, r, f) {
      const v = r.v, out = [`Votos en los logs: ${s.v1}${s.troca ? ` + ${s.v2} = ${v.tot}` : ""}; comparecencia en el boletín: ${s.comp}.`];
      if (r.cats.some((c) => c.c === "soma_log_bu")) out.push(`<b>La prueba lo señala:</b> diferencia de ${v.dif > 0 ? "+" : ""}${v.dif} entre los logs y el boletín.`);
      if (r.cats.some((c) => c.c === "voto_original_apos")) out.push("<b>La prueba lo señala:</b> voto registrado en la urna original después del cambio.");
      if (r.nivel === "info") out.push("<b>Informativo:</b> cambio de urna registrado, con la suma correcta. El cambio está previsto cuando la urna falla; el acta registra el motivo.");
      if (r.nivel === "ok") out.push("Sin cambio y con la suma correcta.");
      if (r.nivel === "anom") out.push("La causa debe verificarse en el acta: la votación en papel durante el cambio, por ejemplo, no aparece en el log.");
      return out;
    },
    ficha: (s) => fichaL([s.troca ? `Cambio de urna: ${s.v1} votos en la original y ${s.v2} en la sustituta` : `Sin cambio: ${s.v1} votos en el log`, `Comparecencia en el boletín: ${s.comp}`, s.troca ? `Votos en la original después del cambio: ${s.depois}` : ""].filter(Boolean)),
    kv: (s, r) => [["Suma de los logs", String(r.v.tot)], ["Boletín", String(s.comp)], ["Diferencia", String(r.v.dif)]],
    tec: (s, r) => [["Suma", `${s.v1}${s.troca ? ` + ${s.v2}` : ""} = ${r.v.tot}; boletín ${s.comp}; diferencia ${r.v.dif}`], ["Regla (simplificada)", "suma ≠ boletín o voto en la original después del cambio → anomalía; cambio registrado → informativo"], ["Decisión", luz(r)]],
    m: [
      ["Suma mayor", "Marque el cambio, <b>120</b> votos en la original y <b>130</b> en la sustituta.", "250 votos en los logs y 240 en el boletín: anomalía."],
      ["Voto después del cambio", "Marque el cambio, 120 + 120 votos y <b>2</b> votos en la original después del cambio.", "La urna original no debería recibir votos después de sustituida."],
      ["Papel durante el cambio", "Durante el cambio, electores votaron en papel. Logs: <b>110</b> + <b>118</b>.", "Los votos en papel no están en el log: la suma queda menor. Causa legítima, misma señal."],
      ["Cambio oficial", "Marque el cambio, <b>100</b> en la original y <b>140</b> en la sustituta.", "Suma correcta: cambio previsto, solo informativo."],
      ["Cambio bien hecho", "Marque el cambio, <b>90</b> + <b>150</b>.", "El L06 verifica cantidades, no a quién fueron los votos."],
      ["Log y boletín iguales de más", "Cambie el log de la original y el boletín a <b>260</b>.", "Si log y boletín tienen el mismo número, la prueba no ve diferencia. Otras pruebas comparan con el padrón."],
    ],
    faq: [["¿Cambiar la urna es irregular?", "No. Si la urna falla, la mesa usa una urna de contingencia. El cambio y el motivo quedan en el acta y en el log."],
      ["¿Qué suma el L06?", "Los votos concluidos en el log de cada urna usada en la sección, y los compara con la comparecencia del boletín."]],
    prova: [
      ["Cambio de urna con la suma correcta:", "Informativo", "Anomalía", "Fuera de la prueba", "Anulación", "Está previsto."],
      ["Suma de los logs distinta del boletín:", "Anomalía", "Normal", "Informativo", "Ignorada", "Los números deberían coincidir."],
      ["Voto en la urna original después del cambio:", "Anomalía", "Normal", "Informativo", "Fuera de la prueba", "Ya había sido sustituida."],
      ["¿El L06 verifica a quién fueron los votos?", "No, verifica cantidades", "Sí", "Solo de Presidente", "Solo en la sustituta", "El log no muestra el candidato."],
      ["Votos en papel durante el cambio:", "No aparecen en el log y pueden generar diferencia", "Aparecen en el log", "Se anulan", "Están prohibidos", "El acta los registra."],
      ["¿Dónde queda el motivo del cambio?", "En el acta de la mesa", "En el log", "En el boletín", "En la zerésima", "El log no dice el motivo."],
    ],
    situ: ["Los logs de la urna original y de la sustituta suman 250 votos, pero el boletín registra 240 electores que votaron.", "El log muestra el cambio de la urna a mitad de la votación, con la suma de votos coincidiendo con el boletín."],
  };
  T.L07 = {
    nome: "Intentos repetidos (ya votó, no encontrado, impedido)", curto: "Cuenta los intentos de habilitar electores que ya votaron, no fueron encontrados o están impedidos, y compara con las secciones vecinas.",
    vis: "Intentos cada 100 electores (puntos: región; rombo: esta sección)",
    campos: { tent: "Intentos (ya votó, no encontrado, impedido)", el: "Electores que votaron", seguidas: "3 o más intentos seguidos con el mismo resultado" },
    simples(s, r, f) {
      const out = [`${s.tent} intentos en ${s.el} electores: <b>${f.n(r.v.tx, 1)}%</b> (región: ${f.n(r.v.med, 1)}%).`];
      if (r.nivel === "anom") out.push("<b>La prueba lo señala:</b> muy por encima de las vecinas. Electores que cambiaron de sección y errores al digitar el título explican casos.");
      else if (r.nivel === "info") out.push("<b>Informativo:</b> 3 intentos seguidos con el mismo resultado, por ejemplo, número de título digitado mal.");
      else out.push(s.tent < 5 ? "Dentro de lo esperado: con menos de 5 intentos la prueba no señala." : "Dentro de lo esperado.");
      return out;
    },
    ficha: (s) => fichaL([`${s.tent} intentos (ya votó, no encontrado, impedido) en ${s.el} electores`, `Intentos seguidos con el mismo resultado: ${s.seguidas ? "sí" : "no"}`]),
    kv: (s, r, f) => regKv(r, f, pc(f)),
    tec: (s, r, f) => [["Tasa", `${s.tent} / ${s.el} = ${f.n(r.v.tx, 2)}%`]].concat(regTec(r, f, pc(f), "z ≥ 3,5 y 5+ intentos → anomalía; 3 seguidos → informativo")),
    m: [
      ["Muchos intentos", "Cambie los intentos a <b>30</b>.", "El 12% de los electores, muy por encima de las vecinas: anomalía."],
      ["Sección menor", "En una sección de 150 electores, cambie a <b>12</b> intentos.", "8%: muy por encima de la región."],
      ["Sección trasladada", "Muchos electores fueron cambiados de sección y vinieron a la antigua. Cambie a <b>25</b>.", "Causa legítima, misma señal."],
      ["Error de digitación", "Marque <b>3 intentos seguidos</b>.", "Un título digitado mal genera intentos seguidos: informativo."],
      ["Pocos intentos", "Cambie a <b>4</b> intentos y 60 electores.", "Aun con tasa alta, menos de 5 intentos no se señalan."],
      ["Sección grande", "En una sección de 700 electores, cambie a <b>10</b> intentos.", "1,4%: dentro del patrón de la región."],
    ],
    faq: [["¿El log muestra el nombre del elector?", "No. Muestra el tipo de mensaje (ya votó, no encontrado, impedido) y la hora."],
      ["¿Por qué comparar con las vecinas?", "Porque los errores de digitación y los cambios de sección ocurren en todas partes. La prueba busca secciones muy fuera del patrón local."]],
    prova: [
      ["El L07 señala una anomalía cuando:", "La tasa está muy por encima de las vecinas y hay 5+ intentos", "Hay 1 intento", "Hay biometría", "Hay fila", "Los dos criterios juntos."],
      ["3 intentos seguidos con el mismo resultado:", "Informativo", "Anomalía", "Fuera de la prueba", "Anulación", "Ej.: título digitado mal."],
      ["¿El log muestra el nombre del elector?", "No", "Sí", "Solo si ya votó", "Solo en la 2.ª vuelta", "Muestra el tipo de mensaje."],
      ["4 intentos en una sección pequeña:", "No se señalan", "Son anomalía", "Son informativos", "Anulan la sección", "El mínimo es 5."],
      ["¿Qué puede explicar muchos intentos?", "Electores cambiados de sección", "Zerésima", "Huso", "Código de carga", "Causa legítima."],
      ["La comparación usa:", "El puntaje z robusto con las secciones vecinas", "La media del país", "La 1.ª vuelta de 2022", "Encuestas", "Es el patrón local."],
    ],
    situ: ["En una sección, el log muestra 30 intentos de habilitar electores que ya habían votado o no estaban en la lista, contra 2 o 3 en las vecinas.", "El miembro de mesa digitó tres veces el mismo título y recibió “elector no encontrado”."],
  };
  T.L08 = {
    nome: "Votos no concluidos", curto: "Cuenta los votos que empezaron y no terminaron y compara con las secciones vecinas.",
    vis: "Votos no concluidos cada 100 electores (puntos: región; rombo: esta sección)",
    campos: { nc: "Votos no concluidos", el: "Electores que votaron" },
    simples(s, r, f) {
      const out = [`${s.nc} votos no concluidos en ${s.el} electores: <b>${f.n(r.v.tx, 1)}%</b> (región: ${f.n(r.v.med, 1)}%).`];
      out.push(r.nivel === "anom" ? "<b>La prueba lo señala:</b> muy por encima de las vecinas. Electores con dificultades y un teclado defectuoso explican casos." : s.nc < 5 ? "Dentro de lo esperado: con menos de 5 casos la prueba no señala." : "Dentro de lo esperado.");
      return out;
    },
    ficha: (s) => fichaL([`${s.nc} votos no concluidos en ${s.el} electores`]),
    kv: (s, r, f) => regKv(r, f, pc(f)),
    tec: (s, r, f) => [["Tasa", `${s.nc} / ${s.el} = ${f.n(r.v.tx, 2)}%`]].concat(regTec(r, f, pc(f), "z ≥ 3,5 y 5+ casos → anomalía")),
    m: [
      ["Muchos votos interrumpidos", "Cambie a <b>12</b> votos no concluidos.", "Muy por encima de las vecinas: anomalía."],
      ["Sección menor", "En una sección de 150 electores, cambie a <b>6</b>.", "4%: muy por encima de la región."],
      ["Teclado defectuoso", "Una tecla fallaba y electores desistieron. Cambie a <b>10</b>.", "Causa legítima, misma señal."],
      ["Sección de mayores", "En una sección de 180 electores, muchos mayores, cambie a <b>8</b>.", "La dificultad con la urna también genera votos no concluidos."],
      ["Pocos casos", "En una sección de 80 electores, cambie a <b>4</b>.", "Menos de 5 casos no se señalan."],
      ["Sección grande", "En una sección de 700 electores, cambie a <b>5</b>.", "0,7%: dentro del patrón."],
    ],
    faq: [["¿Qué es un voto no concluido?", "El elector empieza a votar y no confirma el último cargo, o el miembro de mesa cierra el voto pendiente. El log lo registra."],
      ["¿El voto no concluido cuenta?", "Los cargos ya confirmados cuentan; los que faltaban quedan sin voto. El log no muestra por quién."]],
    prova: [
      ["El L08 señala una anomalía con:", "Tasa muy por encima de las vecinas y 5+ casos", "1 caso", "Biometría", "Fila", "Los dos criterios juntos."],
      ["¿Qué puede explicar votos no concluidos?", "Electores con dificultades y teclado defectuoso", "Zerésima", "Huso", "Carga", "Causas legítimas."],
      ["4 casos en una sección de 80 electores:", "No se señalan", "Son anomalía", "Son informativos", "Anulan la sección", "El mínimo es 5."],
      ["¿El log muestra por quién sería el voto?", "No", "Sí", "Solo de Presidente", "Solo en la 2.ª vuelta", "Muestra solo el evento."],
      ["La comparación usa:", "Las secciones del municipio y las vecinas", "Todo el país", "Encuestas", "La 1.ª vuelta de 2022", "Es el patrón local."],
      ["5 casos en una sección de 700 electores:", "Están dentro de lo esperado", "Son anomalía", "Son informativos", "Quedan fuera de la prueba", "El 0,7% es común."],
    ],
    situ: ["En una sección, 15 electores empezaron a votar y no concluyeron el voto, contra 1 o 2 en las secciones vecinas.", "El log de una urna muestra muchos votos interrumpidos a la mitad."],
  };
  T.L09 = {
    nome: "Intentos de cierre", curto: "Busca intentos de cerrar la votación antes del horario o más de una vez.",
    vis: "Intentos de cierre (hora local)",
    campos: { t1: "Hora del 1.er intento de cierre", n: "Número de intentos" },
    marcas: (s, r) => { const m = [{ t: s.t1, k: r.nivel === "anom" ? "x" : "o", rot: "1.er intento" }]; for (let i = 1; i < s.n; i++) m.push({ t: s.t1 + i * 600, k: "i", rot: `${i + 1}.º` }); return m; },
    simples(s, r, f) {
      if (r.nivel === "anom") return [`<b>La prueba lo señala:</b> intento de cerrar a las ${f.hora(s.t1)}, antes de las 17 h (con 2 minutos de tolerancia).`, "Una tecla presionada por error genera intentos cancelados; el acta los registra."];
      if (r.nivel === "info") return [`<b>Informativo:</b> ${s.n} intentos de cerrar después de las 17 h. La fila o un error lo explican.`];
      return [`Un intento a las ${f.hora(s.t1)}, en horario: todo en orden.`];
    },
    ficha: (s, f) => fichaL([`1.er intento de cierre a las ${f.hora(s.t1)} (hora local)`, `Intentos en total: ${s.n}`]),
    kv: (s, r, f) => [["1.er intento", f.hora(s.t1)], ["Intentos", String(s.n)]],
    tec: (s, r, f) => [["Horario", `${f.hora(s.t1)} < 16:58 → ${sim(s.t1 < 17 * 3600 - 120)}`], ["Regla (simplificada)", "antes del horario → anomalía; 2+ intentos después → informativo"], ["Decisión", luz(r)]],
    m: [
      ["Antes de hora", "Cambie el 1.er intento a <b>16:30</b>.", "Intentar cerrar antes de las 17 h se señala."],
      ["Al mediodía", "Cambie el 1.er intento a <b>12:10</b>.", "Mucho antes del horario: anomalía."],
      ["Tecla equivocada", "El miembro de mesa presionó la tecla de cerrar por error a las <b>15:00</b> y canceló. Cambie la hora y haga 2 intentos.", "Error explicable, misma señal. El acta lo registra."],
      ["Fila al final", "Cambie a <b>2</b> intentos después de las 17 h.", "Más de un intento después del horario: informativo."],
      ["Cierre normal", "Cambie el 1.er intento a <b>17:01</b>, con 1 intento.", "En horario: nada que señalar."],
      ["Dentro de la tolerancia", "Cambie el 1.er intento a <b>16:59</b>.", "Hay 2 minutos de tolerancia para diferencias de reloj."],
    ],
    faq: [["¿Por qué una tolerancia de 2 minutos?", "Los relojes pueden tener pequeñas diferencias. Es la misma tolerancia de la prueba 11."],
      ["¿Intentar cerrar temprano está prohibido?", "La votación va hasta el horario oficial. Un intento antes, aunque se cancele, merece verificación en el acta."]],
    prova: [
      ["Un intento de cerrar a las 16:30:", "Anomalía", "Normal", "Informativo", "Fuera de la prueba", "Antes del horario."],
      ["Dos intentos después de las 17 h:", "Informativo", "Anomalía", "Normal", "Anulación", "Fila o error."],
      ["La tolerancia del L09 es de:", "2 minutos", "30 minutos", "1 hora", "Ninguna", "Igual a la prueba 11."],
      ["Un intento a las 16:59:", "No se señala", "Es anomalía", "Es informativo", "Queda fuera de la prueba", "Dentro de la tolerancia."],
      ["Un intento cancelado por error antes de hora:", "Se señala, y el acta lo explica", "No aparece en el log", "Anula la sección", "Se ignora", "El log registra el comando."],
      ["El L09 verifica:", "La hora y el número de los comandos de cierre", "Los votos", "La biometría", "El padrón", "Es una prueba de eventos."],
    ],
    situ: ["El log muestra un comando para cerrar la votación a las 14 h, cancelado enseguida.", "Una urna registró tres intentos de cierre después de las 17 h."],
  };
  T.L10 = {
    nome: "Hora de la zerésima y del encendido de la urna", curto: "Verifica la hora de la zerésima (el informe que muestra la urna sin votos) y del primer voto.",
    vis: "Línea de tiempo de la mañana (hora local)",
    campos: { zer: "Hora de la zerésima", v1: "Hora del primer voto", tem: "La urna imprimió la zerésima" },
    marcas: (s, r) => { const m = [{ t: s.v1, k: "o", rot: "1.er voto" }]; if (s.tem) m.push({ t: s.zer, k: r.nivel === "anom" ? "x" : r.nivel === "info" ? "i" : "o", rot: "zerésima" }); return m; },
    simples(s, r, f) {
      if (!s.tem) return ["<b>La prueba lo señala:</b> no hay zerésima en el log. Es el informe que muestra que la urna empezó sin votos."];
      if (r.nivel === "anom") return [`<b>La prueba lo señala:</b> zerésima a las ${f.hora(s.zer)}, después del primer voto (${f.hora(s.v1)}).`];
      if (r.nivel === "info") return [`<b>Informativo:</b> zerésima a las ${f.hora(s.zer)}, fuera de la mañana de la elección (entre las 6 h y las 8 h). La urna de contingencia imprime la zerésima a la hora del cambio.`];
      return [`Zerésima a las ${f.hora(s.zer)} y primer voto a las ${f.hora(s.v1)}: en orden.`];
    },
    ficha: (s, f) => fichaL([s.tem ? `Zerésima a las ${f.hora(s.zer)}` : "Sin zerésima en el log", `Primer voto a las ${f.hora(s.v1)}`]),
    kv: (s, r, f) => [["Zerésima", s.tem ? f.hora(s.zer) : "—"], ["1.er voto", f.hora(s.v1)]],
    tec: (s, r, f) => [["Orden", s.tem ? `zerésima ${f.hora(s.zer)} ≤ 1.er voto ${f.hora(s.v1)} → ${sim(s.zer <= s.v1)}` : "sin zerésima"], ["Ventana", "entre las 06:00 y las 08:00 → normal; fuera → informativo"], ["Decisión (simplificada)", luz(r)]],
    m: [
      ["Zerésima tardía", "Cambie la zerésima a <b>08:20</b> y el primer voto a 08:05.", "La zerésima tiene que venir antes de cualquier voto."],
      ["Sin zerésima", "Desmarque <b>La urna imprimió la zerésima</b>.", "Sin zerésima, no hay prueba de que la urna empezó vacía."],
      ["Urna de contingencia", "La urna se cambió a las 10 h. Cambie la zerésima a <b>10:15</b> y el 1.er voto a 10:20.", "La sustituta imprime la zerésima a la hora del cambio: informativo."],
      ["Miembros de mesa madrugadores", "Cambie la zerésima a <b>05:40</b>.", "Antes de las 6 h queda como informativo."],
      ["Justo a tiempo", "Zerésima a las <b>07:59</b> y primer voto a las 08:00.", "En orden: nada que señalar."],
      ["Primer elector tarde", "Cambie el primer voto a <b>09:30</b>.", "Que el primer elector tarde en llegar no es criterio."],
    ],
    faq: [["¿Qué es la zerésima?", "Es el informe que imprime la urna antes de la votación, mostrando que todos los candidatos tienen cero votos. Los fiscales pueden verificarlo."],
      ["¿Por qué la urna de contingencia tiene otra hora?", "Porque solo se enciende cuando la original falla; su zerésima sale a la hora del cambio."]],
    prova: [
      ["Zerésima después del primer voto:", "Anomalía", "Normal", "Informativo", "Fuera de la prueba", "Tiene que venir antes."],
      ["Sin zerésima en el log:", "Anomalía", "Normal", "Informativo", "Se ignora", "No hay prueba de la urna vacía."],
      ["Zerésima a las 10:15 en una urna de contingencia:", "Informativo", "Anomalía", "Normal", "Anulación", "Se imprimió en el cambio."],
      ["La zerésima muestra:", "Que la urna empezó sin votos", "El resultado", "Los electores", "La biometría", "Se hace antes de la votación."],
      ["Primer voto a las 9:30:", "No es criterio de la prueba", "Es anomalía", "Es informativo", "Anula la urna", "El elector puede llegar tarde."],
      ["Zerésima a las 05:40:", "Informativo", "Anomalía", "Normal", "Fuera de la prueba", "Antes de las 6 h."],
    ],
    situ: ["El log de una urna muestra la zerésima impresa 15 minutos después del primer voto.", "En una sección, no hay registro de zerésima en el log de la urna."],
  };
  T.L11 = {
    nome: "Reloj de la urna", curto: "Verifica si el reloj de la urna estaba en hora y si se ajustó durante el día.",
    vis: "Ajustes del reloj en el día (hora local)",
    campos: { dif: "Diferencia del reloj (minutos: + adelantado, − atrasado)", ajuste: "Ajuste de fecha y hora en el log" },
    op: { ajuste: { nao: "Ningún ajuste", fora: "Ajuste antes o después de la votación", durante: "Ajuste durante la votación" } },
    marcas: (s, r) => { const H = window.SIMM.H; return s.ajuste === "durante" ? [{ t: H(12), k: "x", rot: "ajuste" }] : s.ajuste === "fora" ? [{ t: H(7), k: "i", rot: "ajuste" }] : []; },
    simples(s, r) {
      if (r.nivel === "anom") return ["<b>La prueba lo señala:</b> el reloj se ajustó durante la votación, con votos antes y después. Todos los horarios del día se vuelven difíciles de comparar.", "Puede ser la corrección de un reloj equivocado; el acta lo registra."];
      const out = [`El reloj de la urna estaba ${Math.abs(s.dif)} minutos ${s.dif >= 0 ? "adelantado" : "atrasado"}.`];
      out.push(r.nivel === "info" ? "<b>Informativo:</b> diferencia de 15 minutos o más, o ajuste fuera de la votación. Un reloj equivocado cambia los horarios de todas las demás pruebas." : "Dentro de lo esperado.");
      return out;
    },
    ficha: (s) => fichaL([`Reloj ${Math.abs(s.dif)} min ${s.dif >= 0 ? "adelantado" : "atrasado"}`, `Ajuste en el log: ${({ nao: "ninguno", fora: "fuera de la votación", durante: "durante la votación" })[s.ajuste]}`]),
    kv: (s) => [["Diferencia", `${s.dif} min`], ["Ajuste", ({ nao: "ninguno", fora: "fuera", durante: "durante" })[s.ajuste]]],
    tec: (s, r) => [["Diferencia", `|${s.dif}| ≥ 15 → ${sim(Math.abs(s.dif) >= 15)}`], ["Regla (simplificada)", "ajuste durante la votación → anomalía; diferencia ≥ 15 min o ajuste fuera → informativo"], ["Decisión", luz(r)]],
    m: [
      ["Ajuste a mitad del día", "Elija <b>Ajuste durante la votación</b>.", "Cambiar el reloj con la votación en curso se señala."],
      ["Ajuste y reloj equivocado", "Ajuste durante la votación y diferencia de <b>−30</b> minutos.", "Sigue señalándose."],
      ["Corrección del reloj", "El miembro de mesa corrigió un reloj adelantado 40 minutos a mitad de la votación. Diferencia <b>40</b> y ajuste durante.", "Causa explicable, misma señal."],
      ["Reloj adelantado", "Cambie la diferencia a <b>20</b> minutos.", "15 minutos o más: informativo."],
      ["Atraso pequeño", "Cambie la diferencia a <b>−10</b> minutos.", "Por debajo de 15 minutos: dentro de lo esperado."],
      ["Ajuste antes de la votación", "Elija <b>Ajuste antes o después de la votación</b>.", "Un ajuste fuera de la votación queda como informativo."],
    ],
    faq: [["¿Por qué importa el reloj?", "Porque todas las pruebas de horario (11, L01, L09, L10) usan la hora de la urna. Un reloj equivocado genera falsas alarmas."],
      ["¿Cómo se descubre la diferencia?", "Comparando la hora del log con la de la recepción por el TSE y con los demás registros del día."]],
    prova: [
      ["Ajuste del reloj durante la votación:", "Anomalía", "Normal", "Informativo", "Fuera de la prueba", "Con votos antes y después."],
      ["Reloj adelantado 20 minutos:", "Informativo", "Anomalía", "Normal", "Anulación", "15 min o más."],
      ["Reloj atrasado 10 minutos:", "Dentro de lo esperado", "Anomalía", "Informativo", "Fuera de la prueba", "Por debajo de 15 min."],
      ["Un reloj equivocado afecta:", "Las pruebas de horario", "Los votos", "La biometría", "El padrón", "Usan la hora de la urna."],
      ["Ajuste antes de la votación:", "Informativo", "Anomalía", "Normal", "Anulación", "Fuera de la votación."],
      ["La diferencia del reloj se mide comparando con:", "La recepción por el TSE y otros registros", "El celular del elector", "Encuestas", "La 1.ª vuelta", "Son referencias externas."],
    ],
    situ: ["El log muestra que la hora de la urna se cambió a las 13 h, con votos antes y después.", "El reloj de una urna estaba 25 minutos adelantado respecto del horario oficial."],
  };
  T.L12 = {
    nome: "Modelo, versión del software y código de carga", curto: "Verifica el modelo de la urna, la versión del programa y el código de carga registrados en el log.",
    vis: "Datos de la urna en el log",
    campos: { versao: "Versión del programa", carga: "Código de carga", modelo: "Modelo de la urna", bate: "Log y boletín con los mismos datos", secao: "Sección prevista para esta urna", va: "Votos del Candidato A" },
    op: { versao: { ok: "La oficial", outra: "Otra" }, carga: { ok: "El previsto", outra: "Otro" }, modelo: { prev: "El previsto", outro: "Otro modelo" }, secao: { certa: "Esta sección", outra: "Otra sección" } },
    simples(s, r, f) {
      if (r.nivel === "anom") return [`<b>La prueba lo señala:</b> ${r.cats.map((c) => f.cat(c.c)).join("; ")}.`, "Errores de registro y una urna de contingencia mal registrada explican casos; la lista oficial y el acta lo confirman."];
      if (r.nivel === "info") return ["<b>Informativo:</b> el modelo es distinto del previsto, con versión y carga correctas. Las urnas de contingencia pueden ser de otro modelo."];
      return ["Versión, carga y modelo coinciden, y log y boletín concuerdan.", "El L12 verifica la identidad de la urna, no los votos ni la sección (eso es la prueba 12)."];
    },
    ficha: (s) => fichaL([`Versión: ${s.versao === "ok" ? "oficial" : "otra"} · carga: ${s.carga === "ok" ? "prevista" : "otra"}`, `Modelo: ${s.modelo === "prev" ? "previsto" : "otro"} · log y boletín: ${s.bate ? "iguales" : "distintos"}`]),
    kv: (s) => [["Versión", s.versao === "ok" ? "oficial" : "otra"], ["Carga", s.carga === "ok" ? "prevista" : "otra"], ["Modelo", s.modelo === "prev" ? "previsto" : "otro"], ["Log × boletín", s.bate ? "iguales" : "distintos"]],
    tec: (s, r) => [["Versión", sim(s.versao === "ok")], ["Carga", sim(s.carga === "ok")], ["Log = boletín", sim(s.bate)], ["Modelo previsto", sim(s.modelo === "prev")], ["Decisión (simplificada)", luz(r)]],
    m: [
      ["Versión distinta", "Cambie la versión del programa a <b>Otra</b>.", "Un programa distinto del oficial se señala."],
      ["Log y boletín distintos", "Desmarque <b>Log y boletín con los mismos datos</b>.", "Los dos archivos de la misma urna tienen que concordar."],
      ["Error de registro", "La urna de contingencia se registró con la carga equivocada. Cambie la carga a <b>Otro</b>.", "Causa explicable, misma señal."],
      ["Contingencia de otro modelo", "Cambie el modelo a <b>Otro modelo</b>.", "Con versión y carga correctas, solo informativo."],
      ["Votos cambiados", "Pase <b>30</b> votos a A.", "El L12 verifica la urna, no los votos."],
      ["Urna de otra sección", "Cambie la sección prevista a <b>Otra sección</b>.", "Eso lo verifica la prueba 12, no el L12."],
    ],
    faq: [["¿Qué es el código de carga?", "Es la identificación de la preparación de la urna antes de la elección (programa y datos). Tiene que coincidir con la lista oficial."],
      ["¿Qué diferencia hay con la prueba 12?", "La prueba 12 verifica si la urna es la prevista para la sección. El L12 verifica la versión, la carga y el modelo registrados en el log."]],
    prova: [
      ["Versión del programa distinta de la oficial:", "Anomalía", "Informativo", "Normal", "Fuera de la prueba", "El programa tiene que ser el oficial."],
      ["Modelo distinto, con versión y carga correctas:", "Informativo", "Anomalía", "Normal", "Anulación", "La contingencia puede ser de otro modelo."],
      ["Log y boletín con datos distintos:", "Anomalía", "Normal", "Informativo", "Se ignora", "Deben concordar."],
      ["¿El L12 verifica los votos?", "No", "Sí", "Solo de Presidente", "Solo en la 2.ª vuelta", "Verifica la identidad de la urna."],
      ["¿Quién verifica si la urna es la de la sección?", "La prueba 12", "El L12", "El V6", "El L01", "Es otra prueba."],
      ["El código de carga identifica:", "La preparación de la urna (programa y datos)", "Al elector", "Al candidato", "El horario", "Tiene que coincidir con la lista."],
    ],
    situ: ["El log de una urna registra una versión del programa distinta de la versión oficial de la elección.", "El código de carga en el log de una urna no coincide con el del boletín."],
  };
  T.L13 = {
    nome: "Biometría detallada", curto: "Detalla el uso de la biometría y compara la habilitación sin huella con la de las secciones vecinas.",
    vis: "Electores habilitados sin huella (%) (puntos: región; rombo: esta sección)",
    campos: { sem: "Habilitados sin huella (%)", quatro: "Electores con 4 intentos o más (%)", regiao: "Biometría en la región" },
    op: { regiao: { normal: "Normal", ruim: "Mala (muchas fallas en la región)" } },
    simples(s, r, f) {
      const out = [`El <b>${s.sem}%</b> de los electores fue habilitado sin huella (región: ${f.n(r.v.med, 1)}%).`];
      if (r.nivel === "anom") out.push("<b>La prueba lo señala:</b> muy por encima de las vecinas. Un lector defectuoso y electores sin biometría explican casos; complementa la prueba 10.");
      else if (r.nivel === "info") out.push(`<b>Informativo:</b> el ${s.quatro}% de los electores necesitó 4 intentos o más. Las huellas gastadas son comunes en algunos trabajos.`);
      else out.push("Dentro del patrón de la región.");
      return out;
    },
    ficha: (s) => fichaL([`Habilitados sin huella: ${s.sem}%`, `Con 4 intentos o más: ${s.quatro}%`, `Biometría en la región: ${s.regiao === "ruim" ? "mala" : "normal"}`]),
    kv: (s, r, f) => regKv(r, f, pc(f)),
    tec: (s, r, f) => regTec(r, f, pc(f), "z ≥ 3,5 en la habilitación sin huella → anomalía; 4+ intentos en el 20% o más → informativo"),
    m: [
      ["Muchos sin huella", "Cambie los habilitados sin huella a <b>45%</b>.", "Muy por encima de las vecinas: anomalía."],
      ["Un cuarto sin huella", "Cambie a <b>25%</b>.", "Todavía muy por encima de la región (8%)."],
      ["Lector defectuoso", "El lector falló buena parte del día. Cambie a <b>60%</b>.", "Causa legítima, misma señal."],
      ["Huellas gastadas", "Cambie los electores con 4 intentos a <b>30%</b>.", "Muchos intentos, pero reconocidos: informativo."],
      ["Un poco por encima", "Cambie a <b>14%</b>.", "Dentro de la variación de la región."],
      ["Toda la región con fallas", "Elija <b>Mala</b> y cambie a <b>45%</b>.", "Si las vecinas también tienen muchas fallas, la sección no se aparta del patrón."],
    ],
    faq: [["¿Qué diferencia hay con la prueba 10?", "La prueba 10 usa el boletín de urna. El L13 usa el log, elector por elector: cuántos intentos y cómo fue habilitado cada uno."],
      ["¿Habilitar sin huella es irregular?", "No. Cuando la huella no se reconoce, el miembro de mesa verifica el documento y habilita. La prueba busca secciones muy fuera del patrón."]],
    prova: [
      ["El L13 señala una anomalía cuando:", "La habilitación sin huella está muy por encima de las vecinas", "Hay 1 habilitación sin huella", "Hay fila", "Hay cambio de urna", "Puntaje z robusto ≥ 3,5."],
      ["Muchos electores con 4 intentos:", "Informativo", "Anomalía", "Normal", "Anulación", "Huellas gastadas."],
      ["Si toda la región tiene muchas fallas:", "La sección no se aparta del patrón", "Todas se señalan", "La prueba se detiene", "Es anomalía", "Compara con las vecinas."],
      ["El L13 usa:", "El log, elector por elector", "Solo el boletín", "Encuestas", "El padrón", "Más detalle que la prueba 10."],
      ["Un lector defectuoso puede:", "Hacer que la prueba señale por una causa legítima", "Cambiar votos", "Poner la urna en cero", "Cambiar la sección", "Una anomalía no es prueba."],
      ["Habilitar sin huella es:", "Previsto, con verificación del documento", "Prohibido", "Fraude", "Imposible", "El miembro de mesa habilita."],
    ],
    situ: ["En una sección, el 45% de los electores fue habilitado sin huella, contra el 8% en las secciones vecinas.", "El log muestra que muchos electores necesitaron cuatro o más intentos de huella."],
  };
  T.L14 = {
    nome: "Votos del log × boletín de urna", curto: "Verifica si el número de votos registrados en el log es igual a la comparecencia del boletín de urna.",
    vis: "Votos en el log × comparecencia en el boletín",
    campos: { log: "Votos concluidos en el log", bu: "Comparecencia en el boletín", corromp: "Log incompleto o dañado", va: "Votos del Candidato A en el boletín" },
    simples(s, r) {
      if (s.corromp) return ["<b>La prueba lo señala:</b> el archivo del log está incompleto o dañado, así que no se puede verificar el conteo. Queda registrado como falla del archivo."];
      if (r.nivel === "anom") return [`<b>La prueba lo señala:</b> el log tiene ${s.log} votos y el boletín, ${s.bu} (${s.log - s.bu > 0 ? "+" : ""}${s.log - s.bu}).`, "Los dos vienen de la misma urna y deberían tener el mismo número. La verificación empieza por el boletín impreso y el acta."];
      return [`Log y boletín tienen ${s.bu} votos: coinciden.`, "El L14 verifica la cantidad, no a quién fueron los votos."];
    },
    ficha: (s) => fichaL([`Votos en el log: ${s.log} · comparecencia en el boletín: ${s.bu}`, s.corromp ? "Log incompleto o dañado" : "Log completo"]),
    kv: (s) => [["Log", String(s.log)], ["Boletín", String(s.bu)], ["Diferencia", String(s.log - s.bu)]],
    tec: (s, r) => [["Diferencia", `${s.log} − ${s.bu} = ${s.log - s.bu}`], ["Archivo", s.corromp ? "incompleto" : "completo"], ["Regla (simplificada)", "cualquier diferencia o log incompleto → anomalía"], ["Decisión", luz(r)]],
    m: [
      ["Votos de más en el log", "Cambie los votos en el log a <b>245</b>.", "5 votos más en el log que en el boletín: anomalía."],
      ["Votos de menos en el log", "Cambie los votos en el log a <b>230</b>.", "También se señala cuando faltan votos en el log."],
      ["Archivo dañado", "Marque <b>Log incompleto o dañado</b>.", "Sin el archivo entero, no se puede verificar: queda registrado como falla del archivo."],
      ["Un voto", "Cambie el log a <b>241</b>.", "Incluso 1 voto de diferencia se señala: es una cuenta."],
      ["Votos cambiados", "Pase <b>25</b> votos a A en el boletín, sin cambiar el total.", "El L14 verifica cantidades, no candidatos."],
      ["Los dos iguales", "Cambie el log y el boletín a <b>260</b>.", "Si los dos tienen el mismo número, la prueba no ve diferencia."],
    ],
    faq: [["¿El log y el boletín no son lo mismo?", "No. El boletín tiene los votos por candidato; el log tiene los eventos y la hora de cada voto. Los dos salen de la misma urna, así que el total tiene que coincidir."],
      ["¿Una diferencia prueba algo?", "No. Un log incompleto, un cambio de urna y la votación en papel también generan diferencia. La verificación se hace con el boletín impreso y el acta."]],
    prova: [
      ["Una diferencia de 1 voto entre log y boletín:", "Anomalía", "Normal", "Informativo", "Fuera de la prueba", "Es una cuenta: tiene que coincidir."],
      ["Un log dañado:", "Queda registrado como falla del archivo", "Se ignora", "Es normal", "Anula la elección", "No se puede verificar."],
      ["El L14 verifica:", "El total de votos", "Los votos por candidato", "La biometría", "El horario", "Solo la cantidad."],
      ["Votos cambiados entre candidatos, con el total igual:", "No aparecen en el L14", "Siempre se señalan", "Son informativos", "Anulan el log", "El log no muestra el candidato."],
      ["¿Dónde empieza la verificación de una diferencia?", "En el boletín impreso y el acta", "En una encuesta", "En el padrón", "En el celular", "Documentos oficiales."],
      ["¿Qué más genera diferencia sin nada irregular?", "Un log incompleto o la votación en papel", "Biometría", "Zerésima", "Huso", "Causas explicables."],
    ],
    situ: ["El log de una urna tiene 245 votos, pero el boletín registra 240 electores que votaron.", "El archivo de log de una sección está incompleto y no se pueden contar los votos."],
  };

  Object.assign(S, T);
})();
