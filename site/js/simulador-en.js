/* Anomaly simulator — English texts. */
(function () {
  "use strict";
  const S = (window.SIM_TXT = window.SIM_TXT || {});
  const p = (x) => (x === 1 ? "" : "s");

  const ui = {
    titulo: "Anomaly simulator", tag: "Educational page · fictitious data",
    sub: "Change made-up numbers and see, right away, how each of the 15 audit tests reacts, why it reacts and what that means.",
    aviso: "Educational simulation with fictitious data. Sharing these results is strictly prohibited, to prevent the spread of false news.",
    marca: "SIMULATION · FICTITIOUS DATA",
    faixa: "SIMULATION · FICTITIOUS DATA · sharing, copying or printing is prohibited",
    para_que: "What it is for",
    para_que_l: ["Understand, without formulas, what each audit test checks and how it decides.",
      "See why a test turns its light on and what the normal result would look like.",
      "Learn that a statistical anomaly is a prompt to check, not proof: there are legitimate causes.",
      "Know the limits of each test: changes it cannot see."],
    como: "How it works",
    como_l: ["Choose a test.", "Do the missions: each one asks you to change something in the fictitious case.", "Watch the test light and read the simple or the technical explanation.", "Take the test's exam, collect grades and take the final exam."],
    tipos_t: "Three kinds of mission",
    tipos: { s: "Make it flag", a: "False alarm", d: "Slipped through" },
    tipos_d: { s: "You change the fictitious data until the test turns its light on.", a: "A legitimate situation that also turns the light on. Shows that an anomaly is not proof.", d: "A change the test cannot see. Shows the limit of each test." },
    boletim: "Your report card", boletim_sub: "Your grade in each exam and your final grade. They are stored only on this device.",
    boletim_resumo: (m, mt, pr, pt) => `${m} of ${mt} missions done · ${pr} of ${pt} exams taken.`,
    nota_final: "Final grade", ver_boletim: "See report card", perguntas: "Questions and answers", prova_final: "Final exam",
    niveis: { boletim: "The tally sheet", secao: "The section compared with its region", local: "The polling place", cidade: "The whole city" },
    niveis_d: { boletim: "Tests that check the tally sheet itself: sums, times and the machine used.", secao: "Tests that compare a section with similar sections in the same region.", local: "Tests that compare sections of the same polling place or look for copies.", cidade: "Tests that look at every section of a city or state at once." },
    nota: "Grade", teste: "Test", abas: "Parts of the test", aba_missoes: "Missions", aba_livre: "Free mode", aba_prova: "Exam", aba_faq: "Questions",
    missoes: "Missions", missoes_n: (n, t) => `${n} of ${t} missions`, missao_n: (i, t) => `Mission ${i} of ${t}`, migalha: "Path",
    caso: "Fictitious case", ficticio: "Fictitious", ex_simples: "Simple explanation", ex_tecnica: "Technical explanation",
    dica: "Show where to change", restaurar: "Reset the case", cumprida: "Mission complete!", proxima: "Next mission", refazer: "Redo", ir_prova: "Go to the exam",
    livre_t: "Free mode", livre_d: "Change anything you like. Use “New case” to generate another fictitious case.", novo_caso: "New case",
    perguntas_sub: "The most common whys about the simulator and about each test.", buscar: "Search a question", faq_geral: "General", nada: "No question found.",
    luz: { ok: "Normal", anom: "Statistical anomaly", info: "Informational", insp: "Marked for inspection", na: "Outside the test" },
    luzDesc: { ok: "The test sees nothing out of the ordinary.", anom: "The test would flag this case for checking.", info: "It is recorded, but it is not an anomaly.", insp: "The indicator asks for a look at the chart.", na: "The case does not reach the minimum for the test to evaluate." },
    c: { ap: "Eligible", co: "Turnout", ab: "Abstentions", br: "Blank", nu: "Null", rho: "How much the region's sections vary", va: "Votes for Candidate A", vb: "Votes for Candidate B" },
    rho: { p: "Little (similar sections)", m: "Medium", a: "A lot (different sections)" },
    cargo: { 1: "President", 3: "Governor", 5: "Senator", 6: "Federal Deputy", 7: "State Deputy", p: "President", s: "Senator", d: "Federal Deputy", g: "Governor" },
    cargo_t: "Office", secao_t: "Section", cand: { A: "Candidate A", B: "Candidate B" }, local_fict: "Example Town · Zone 99 · fictitious",
    media_reg: "region average", mediana: "region median",
    cat: {
      aptos_comp_abst: "Eligible ≠ turnout + abstentions", comp_maior_aptos: "Turnout above eligible voters", valores_divergentes: "Different values in the same report",
      votavel_duplicado: "Repeated candidate", votos_negativos: "Negative count", comp_estadual_divergente: "Turnout differs across state offices",
      comp_presidente_menor: "Presidential turnout below state turnout", urna_inconsistente: "Machine data differs within the section", cargo_ausente: "Office missing from the report",
      soma_votos: "Sum of votes ≠ turnout", unanimidade: "Improbable unanimity", unanimidade_100: "100% for one candidate (informational)", abstencao_zero: "Improbable full turnout",
      brancos_nulos: "Excess blank and null votes", voto_cruzado_pres_df: "Extreme split ticket", legenda: "Excess party-list votes", vizinhanca: "Contrast with the same polling place",
      identicos: "Result identical to another section", biometria: "Biometrics unused above baseline",
      abertura_antecipada: "Opening before official time", encerramento_antecipado: "Closing before official time", encerramento_antes_abertura: "Closing before opening",
      emissao_antes_encerramento: "Report printed before closing", recebimento_antes_emissao: "Received before being printed", data_divergente: "Date differs from election day",
      atraso_abertura: "Delayed opening (informational)", tipo_urna_2: "Machine not tallied", tipo_urna_3: "Machine annulled and tallied separately", tipo_urna_4: "Machine annulled", tipo_urna_5: "Machine not installed",
      junta_apuradora: "Paper ballot voting (informational)", sem_correspondencia: "No official list published", urna_ausente: "Missing machine number", carga_divergente: "Load differs from expected",
      carga_ausente: "Missing load code", contingencia_oficial: "Official contingency machine (informational)", contingencia_carga_divergente: "Contingency machine with different load",
      urna_de_outra_secao: "Machine assigned to another section", urna_nao_prevista: "Machine absent from official lists", segundo_digito: "Second-digit deviation", ultimo_digito: "Unbalanced last digit", klimek: "Upper-corner concentration",
    },
    tl: {
      metodo: "Method (same as in the Technical Report)", criterio: "Criterion", calc: "Calculation in this fictitious case", limites: "Limitations",
      grupo: "Reference group", ab: "Beta-binomial parameters", p: "Probability", bh: "Benjamini–Hochberg adjustment", crit: "Decision", sim: "flags", nao: "does not flag",
      regras: "Rules", todas_ok: "all rules satisfied", info: "informational", janela: "Official window", local: "local time", tol: "tolerance", receb: "Reception", emis_brt: "printing in Brasília time",
      min: "Minimum not reached", evento: "Event", sem_evento: "no 100% (the test does not calculate)", obs: "Observed", abaixo: "proportion below the group mean: p = 1 (the test is one-sided)",
      z: "Robust z-score", blocos: "Blocs", exec: "President", leg: "Fed. Deputy", escores: "Mean ideological scores", critA: "Criterion A (blocs)", critB: "Criterion B (local context)",
      phi: "Group overdispersion", props: "Proportions", demais: "other sections", igual: "Identical vectors", nk: "Size", pcol: "Chance coincidence", pares: "Pairs of sections", pares_c: "pairs", E: "Expected coincidences",
      contagens: "Counts ≥ 10", mediana: "median", ref: "Reference", ref_modelo: "Monte Carlo, 50 replicas, beta-binomial per polling place (≥ 4 sections) or zone", ref_benford: "Benford's law (2nd digit), no model", ref_unif: "Uniform, no model and no median limit",
      chi2: "Goodness of fit", medias: "2nd-digit means", obs_m: "observed", esp_m: "expected",
      canto: "Upper corner", obs_c: "observed", esp_c: "expected", razao: "Observed/expected ratio", razao_c: "ratio", regra: "rule", corr: "Turnout × vote share correlation", pond: "weighted by eligible voters",
    },
    nota_bh: "Nationwide, each test evaluates hundreds of thousands of units. Here the Benjamini–Hochberg adjustment uses the same number of units as the 2026 first round, assuming all the others are within the norm (q = p × M).",
    ch_certo: "practically certain", ch_um: (x) => `1 in ${x}`, ch_digitos: (d) => `1 in a ${d}-digit number`,
    escala: [[3, "thousand", "thousand"], [6, "million", "million"], [9, "billion", "billion"], [12, "trillion", "trillion"], [15, "quadrillion", "quadrillion"], [18, "quintillion", "quintillion"]],
    prova_cen: (n) => `With the fictitious data below, what does the test “${n}” do?`, prova_qual: "Which test deals with this situation?",
    qual_explic: (n, c) => `It is ${n}: ${c}`,
    resp: { anom: "Flags it as a statistical anomaly", ok: "Does not flag (normal)", na: "Leaves it outside the test (minimum not reached)", info: "Records it only as informational", insp: "Marks it for inspection" },
    final_sub: "30 questions on all tests. Unlocked after the 15 exams.", prova_bloq_t: "Exam locked",
    prova_bloq: (m, f) => `Complete at least ${m} missions of this test to unlock the exam. You have done ${f}.`,
    final_bloq: (f, t) => `Take the exams of all ${t} tests to unlock the final exam. You have taken ${f}.`,
    prova_de: (n) => `Exam: ${n}`,
    regras: (n, t, min, fin) => [`${n} questions, worth 1 point each. The grade goes from 0 to 10.`, `Time: ${t}. When time runs out, the exam is handed in automatically.`,
      fin ? "Questions on all tests: concepts, fictitious cases and “which test deals with this”." : "Concept questions and new fictitious cases on every attempt.",
      `Passing grade: ${min}.`, "During the exam the simulator is closed. You can skip, mark for review and go back.", "The commented correction appears only at the end."],
    tentativas: (t, m, u) => `Attempts: ${t} · best grade: ${m} · last: ${u}`, comecar: "Start the exam",
    q_conceito: "Concept", q_cenario: "Fictitious case", q_qual: "Which test?", questao_n: (i, n) => `Question ${i} of ${n}`, respondidas: (a, n) => `${a}/${n} answered`, mapa: "Question map",
    vale: (x) => `Worth ${x} point${p(x)}`, marcar: "Mark for review", anterior: "Previous", proxima_q: "Next", revisar: "Review and hand in", entregar: "Hand in",
    revisao_t: "Review before handing in", revisao: (r, n, s, m) => `You answered ${r} of ${n}. ${s ? `${s} unanswered (worth zero). ` : ""}${m ? `${m} marked for review.` : ""}`,
    sit_dist: "Passed with distinction", sit_aprov: "Passed", sit_rec: "Make-up: redo the suggested simulations and try again", sit_refazer: "You need to redo the simulations",
    resultado: (a, n, t) => `${a} correct out of ${n} questions · time ${t}`, recomenda: "Redo the missions of these tests:", refazer_prova: "Retake the exam (new questions)",
    correcao: "Commented correction", sua: "Your answer", certa: "Correct answer", sem_resp: "no answer",
    em_andamento: "in progress (final exam missing)", formula: (m, f) => `Final grade = 60% of the average of the 15 exams (${m}) + 40% of the final exam (${f}). Exams not taken count as zero.`,
    melhor: "Best grade", ultima: "Last", tent: "Attempts", situacao: "Status", nao_feita: "not taken", aprovado: "Passed", refazer_t: "Redo",
    so_aqui: "The report card stays only on this device and cannot be shared.", apagar: "Erase my progress", apagar_conf: "Erase all missions and grades on this device?",
    bloq_t: "Action blocked on this page",
    bloq: "This page is an educational simulation with fictitious data. Sharing, copying, printing or capturing these results is strictly prohibited, to prevent the spread of false news.",
    bloq_m: { ferr: "Share, create image, export and print are turned off in the simulator.", menu: "The right-click menu is turned off on this page.", copia: "Copying is turned off on this page.",
      print: "Screen capture detected. The screen was hidden.", imprimir: "Printing and saving as PDF are turned off on this page.", salvar: "Saving the page is turned off." },
    bloq_voltar: "Back to the simulator", so_no_site: "The simulator only works inside the site itself. It cannot be embedded in other pages.", abrir_site: "Open on the site",
  };

  const faqGeral = [
    ["Are the simulator's numbers real?", "No. All numbers are made up and generated on your device. No real section, city or candidate data appears here. The candidates are called A and B on purpose."],
    ["Why can't I share or take a screenshot?", "Because a screenshot of a fictitious case could be spread as if it were real. To prevent false news, the page has no share, copy, image or print buttons, shows the “SIMULATION · FICTITIOUS DATA” watermark over the whole screen and hides the content when it detects a capture."],
    ["Does the screenshot block always work?", "No. A website cannot stop a phone screenshot or a photo of the screen taken with another device. On computers, the page detects some captures and hides the content. That is why the watermark and the red bar are always visible."],
    ["Does the simulator use the same rules as the audit?", "Yes. The limits, minimums and calculations are the same as the audit engine (same parameters as the Technical Report). The difference is that the data is made up and the comparison region is fictitious."],
    ["What is a statistical anomaly?", "A result very different from what is expected in that situation. It is a prompt to check the printed tally sheet, the minutes and the machine files. It proves nothing: there are legitimate causes, as the false-alarm missions show."],
    ["Why doesn't the site point to culprits or irregularities?", "Because a statistical test cannot know the cause. It only shows what departs from the pattern. Any conclusion depends on people checking the official documents."],
    ["What is the blue light, informational?", "A record that does not count as an anomaly: for example, an official machine replacement, or 100% for one candidate when that is not rare. It is noted for anyone who wants to check."],
    ["Why are some cases outside the test?", "Each test has a minimum (of votes, voters or sections). Below it, chance explains almost everything and the test would raise too many false alarms."],
    ["What is the adjustment for many sections?", "When hundreds of thousands of sections are tested, some look rare by chance alone. The Benjamini–Hochberg adjustment requires the result to stay rare even after counting all of them. The simulator uses the same number of units as the first round."],
    ["How does grading work?", "Each exam is graded from 0 to 10, and 7 passes. The final grade is 60% of the average of the 15 exams plus 40% of the final exam. You can retake exams: the best grade counts."],
    ["Where is my progress saved?", "Only in this browser, on this device. Nothing is sent anywhere. You can erase everything on your report card."],
    ["Can I use the simulator in a class?", "Yes, by opening the site in the classroom. The simulator cannot be embedded in other sites or exported. Remind the class that the data is fictitious."],
  ];

  const pq = (f, v) => `The chance of this happening by chance in a section like this is <b>${f.chance(v.lp)}</b>.`;
  const bhTxt = (f, v) => `Since the country has about ${f.n(v.M)} units evaluated in this test, the site only flags when, even after counting all of them, the result is still rare (false-alarm chance below 1%).`;
  const fichaL = (itens) => `<ul>${itens.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const rhoTxt = { p: "similar to each other", m: "with medium variation", a: "very different from each other" };

  const T = {};

  T.T01 = {
    nome: "Tally sheet closure", curto: "Checks whether each tally sheet adds up: eligible = turnout + abstentions, no negative numbers, no repeated candidate and no missing office.",
    bu: "Fictitious tally sheet",
    campos: { votos: "Votes for President:", neg: "Votes for a Federal Deputy candidate", fant: "Ghost voters (added to every row)", aus: "Office missing from the report", dup: "Repeated candidate on the Federal Deputy list", div: "One Federal Deputy row with different eligible count", urn: "Different machine number in one row" },
    op: { aus: { 0: "None", 3: "Governor", 5: "Senator", 6: "Federal Deputy", 7: "State Deputy" } },
    simples(s, r, f) {
      if (r.nivel === "ok") return ["All the tally sheet's sums close: in each office, eligible = turnout + abstentions; no negative numbers; no repeated candidate; state offices have the same turnout; the President does not have fewer voters than them.",
        "Test 1 only checks the tally sheet's arithmetic. It does not know who the votes went to or whether the voters exist: that is the job of other tests and of checking the printed tally sheet."];
      const l = r.cats.map((c) => `<b>${f.cat(c.c)}</b>${c.cargo ? ` (${f.cargo(c.cargo)})` : ""}${c.obs ? `: ${c.obs}` : ""}`);
      return [`The tally sheet has ${r.cats.length} problem${p(r.cats.length)}: ${l.join("; ")}.`,
        "In a correct tally sheet, every row closes (eligible = turnout + abstentions), there are no negative or repeated numbers, and the turnout of state offices is the same.",
        "The test is deterministic: any violation flags. In practice, the most common cause is a recording, transmission or file-reading error. The check is against the printed tally sheet and the machine's signed files."];
    },
    ficha: (s, f) => fichaL([`Eligible ${s.c[1].ap + s.fant}, turnout ${s.c[1].co + s.fant}, abstentions ${s.c[1].ab} (President)`,
      `Governor: ${s.c[3].ap + s.fant} / ${s.c[3].co + s.fant} / ${s.c[3].ab}; Senator: ${s.c[5].ap + s.fant} / ${s.c[5].co + s.fant} / ${s.c[5].ab}`,
      `Fed. Deputy: ${s.c[6].ap + s.fant} / ${s.c[6].co + s.fant} / ${s.c[6].ab}; State Deputy: ${s.c[7].ap + s.fant} / ${s.c[7].co + s.fant} / ${s.c[7].ab}`,
      `Smallest vote count of a candidate: ${s.neg}${s.dup ? "; one candidate appears twice" : ""}${+s.aus ? `; the ${f.cargo(+s.aus)} row is missing` : ""}`,
      `President: A ${s.va}, B ${s.vb}, blank ${s.br}, null ${s.nu}`]),
    m: [
      ["The sum that does not close", "On the tally sheet, eligible = turnout + abstentions. Change the <b>President's eligible</b> count so the sum no longer closes.", "Any difference, even of 1 voter, turns the light on. In real life this is usually a recording or file-reading error, solved with the printed tally sheet."],
      ["More voters than eligible", "Make the <b>Governor's turnout</b> larger than the eligible count (for example, 305).", "Nobody votes in a section without belonging to it. Turnout above eligible is impossible on a correct tally sheet."],
      ["A negative vote", "Put a <b>negative</b> number in the Federal Deputy candidate's votes.", "There is no negative number of votes. If it appears, there is an error in the record or the file."],
      ["Repeated candidate", "Tick <b>Repeated candidate</b> on the Federal Deputy list.", "Each candidate appears once per office. A repetition points to a recording or data-extraction error."],
      ["Different turnouts", "Change the <b>Governor's turnout</b> to 238 and abstentions to 62. The row closes, but differs from the other state offices.", "Whoever votes for Governor also votes for Senator and Deputies. State offices must have the same turnout, even if each row closes on its own."],
      ["President with fewer voters", "Make the <b>President's turnout</b> lower than the state offices' (for example, 235, with 65 abstentions).", "The President can have MORE voters (voters away from home vote only for President), never fewer."],
      ["Row lost in the copy", "Choose <b>Office missing: Senator</b>, as if the row had been lost when copying the file.", "The test flags, but the most common cause is technical: a failure generating or reading the file. The printed tally sheet settles it."],
      ["Typing error", "Change the <b>State Deputy</b> abstentions from 60 to <b>6</b>, like someone who forgets a zero.", "A silly typing error turns the light on just like a deliberate change. That is why an anomaly is a prompt to check, not an accusation."],
      ["Machine replaced mid-day", "Tick <b>Different machine number in one row</b>, as happens when the machine is replaced during voting.", "Replacing a faulty machine is provided for in the election rules. Test 12 checks whether the new machine was on the official list."],
      ["Votes moved around", "Move <b>30 votes</b> from Candidate A to Candidate B. Note that the light stays green.", "Test 1 only checks that the sums close. Moving votes between candidates keeps everything closed. Other tests and the printed tally sheet look at that."],
      ["Well-made ghost voters", "Add at least <b>10 ghost voters</b>: the simulator puts them in every row, in eligible and turnout.", "If everything is changed consistently, the sum closes and Test 1 does not see it. That is why there are turnout (4) and biometrics (10) tests, and the voter log check."],
      ["Blanks become votes", "Turn all of the President's <b>blank</b> votes into votes for Candidate A.", "Changing the kind of vote without changing the total does not alter any sum that Test 1 checks."],
    ],
    faq: [
      ["Why does an error of 1 voter already flag?", "Because the tally sheet arithmetic is exact. There is no “almost closes”: either it closes, or there is an error that needs explaining."],
      ["Why can the President have more voters?", "Voters away from their electoral domicile can vote only for President. So presidential turnout can be higher than state turnout, never lower."],
      ["If Test 1 does not flag, is the tally sheet correct?", "Not necessarily. It only guarantees that the sums close. Votes moved between candidates or consistent changes get past it."],
    ],
    prova: [
      ["Which sum does Test 1 check on each row of the tally sheet?", "Eligible = turnout + abstentions", "Votes for A = votes for B", "Blank = null", "Turnout = winner's votes", "It is the tally sheet's basic identity: every eligible voter either voted or stayed away."],
      ["Can the President have HIGHER turnout than the Governor in the same section?", "Yes, because of voters away from home", "No, never", "Only in the second round", "Only if the machine is replaced", "Voters away from home vote only for President. Lower is what cannot happen."],
      ["How many voters of difference are enough for Test 1 to flag?", "Any difference, even 1", "At least 10", "More than 5%", "It depends on the region", "The test is deterministic and has no tolerance."],
      ["Does a missing office row in the file prove manipulation?", "No: it can be a failure generating or reading the file", "Yes, always", "Only if it is the President", "Yes, if the section is large", "An anomaly is a prompt to check against the printed tally sheet and signed files."],
      ["What can Test 1 NOT see?", "Votes moved from one candidate to another", "Turnout above eligible", "Negative numbers", "Repeated candidate", "Moving votes between candidates keeps every sum closed."],
      ["Why must state offices have the same turnout?", "Because whoever votes for Governor also votes for Senator and Deputies", "Because the law requires rounding", "Because they are from the same party", "They don't have to", "The same group of voters votes for all state offices."],
    ],
    situ: ["On a section's tally sheet, the Governor's turnout is larger than the number of eligible voters.", "A Deputy candidate appears twice on the list of the same tally sheet."],
  };

  T.T02 = {
    nome: "Total inconsistency", curto: "Checks whether the sum of votes in each office equals the number of people who voted (twice that for the 2026 Senate, because each voter chooses two).",
    dois: "2 votes per voter", soma: "Sum", esperado: "Expected",
    campos: { c1: "Candidate S1", c2: "Candidate S2", c3: "Candidate S3", nom: "Votes for candidates", leg: "Party-list votes" },
    simples(s, r, f) {
      const t = r.v.tot;
      if (r.nivel === "ok") return [`The sums match: President ${f.n(t.p)} = ${f.n(s.co)}; Senate ${f.n(t.s)} = 2 × ${f.n(s.co)}; Federal Deputy ${f.n(t.d)} = ${f.n(s.co)}.`,
        "Test 2 checks quantities, not who the votes went to. Votes moved from one candidate to another, or from blank to a candidate, keep the sums the same."];
      return [`The sum does not match in ${r.cats.length} office${p(r.cats.length)}: ${r.cats.map((c) => `<b>${f.cargo(c.cargo)}</b> (${c.obs}, difference of ${c.delta > 0 ? "+" : ""}${f.n(c.delta)})`).join("; ")}.`,
        "On a correct tally sheet, each person who voted leaves exactly one vote per office (two for the 2026 Senate), counting blank and null votes.",
        "Any difference flags. In practice it may be a recording or extraction error or an incomplete file. The final check is against the printed tally sheet and the machine's signed file."];
    },
    ficha: (s, f) => fichaL([`Turnout: ${s.co}`, `President: A ${s.p.a}, B ${s.p.b}, blank ${s.p.br}, null ${s.p.nu}`, `Senate (2 votes per voter): ${s.s.c1} + ${s.s.c2} + ${s.s.c3} + blank ${s.s.br} + null ${s.s.nu}`, `Fed. Deputy: candidates ${s.d.nom}, party list ${s.d.leg}, blank ${s.d.br}, null ${s.d.nu}`]),
    m: [
      ["Extra votes", "Give Candidate A <b>20 extra votes</b> for President.", "The sum of an office's votes must equal the number of people who voted. Extra votes show up at once."],
      ["Missing votes", "Erase <b>15 votes</b> from Candidate B.", "Fewer votes also break the sum: someone voted and the vote does not appear."],
      ["A single vote", "Add <b>1 vote</b> to Candidate A.", "The test has no tolerance: any difference, even of 1 vote, is flagged."],
      ["Senate with an extra vote", "Add <b>10 votes</b> to Senate candidate S1.", "In 2026 each voter chooses two senators. The Senate sum must be twice the turnout, and the test already accounts for that."],
      ["Inflated party list", "Add <b>30 party-list votes</b> for Federal Deputy.", "Party-list votes (only the party number) count in the sum like any other vote."],
      ["Turnout without votes", "Raise <b>turnout by 10</b> without touching any vote.", "If more people voted, the votes of every office would have to rise together. All three offices light up."],
      ["Lost null row", "Set the <b>Federal Deputy null votes</b> to zero, as if the row had been lost in the file.", "It flags, but it may just be a row lost when reading the file. The printed tally sheet and the signed file settle it."],
      ["Swapped digits", "Change the <b>Senate blank votes</b> from 15 to <b>51</b>, like a typing error.", "A typing error when copying data lights up the same as a deliberate change."],
      ["Truncated file", "Set Senate candidate <b>S3</b> to zero, as if the file had been cut at the end.", "Incomplete files produce wrong sums. That is why the site checks file integrity before the tests."],
      ["Invisible swap", "Move <b>25 votes</b> from Candidate A to Candidate B.", "The sum still equals turnout, so Test 2 does not see it. A swap between candidates only shows on the printed tally sheet or in statistical patterns."],
      ["Blanks converted", "Turn the President's <b>blank</b> votes into votes for Candidate A.", "The total does not change. Test 2 checks quantities, not who the votes went to."],
      ["Consistent ghosts", "Raise <b>turnout by 10</b> and fix every sum (President +10, Senate +20, Deputy +10) until the light turns green again.", "Consistent changes get past Test 2. That is why the site combines several tests and recommends checking the printed tally sheet and the minutes."],
    ],
    faq: [
      ["Why does the Senate count double?", "In 2026 two thirds of the Senate are renewed: each voter chooses two senators. The Senate sum must be 2 × turnout."],
      ["Do blank and null votes count in the sum?", "Yes. The sum includes candidate, party-list, blank, null and annulled votes. Each person who voted leaves one vote in each office, even if blank."],
      ["If the sums match, are the votes right?", "Not necessarily. The test checks quantities. Who the votes went to only the printed tally sheet shows."],
    ],
    prova: [
      ["In the 2026 Senate, the sum of votes must be:", "Twice the turnout", "Equal to the turnout", "Half the turnout", "Equal to eligible voters", "Each voter chooses two senators in 2026."],
      ["Do blank and null votes count in the sum checked by Test 2?", "Yes", "No", "Only blank votes", "Only in the second round", "The sum includes every kind of vote."],
      ["A 1-vote difference in the sum:", "Is flagged", "Is ignored", "Only counts for President", "Only counts above 5 votes", "The test is exact, with no tolerance."],
      ["Which change does Test 2 NOT see?", "Moving votes from Candidate A to B", "Adding votes without raising turnout", "Erasing votes", "Raising turnout without votes", "The swap keeps the sum the same."],
      ["A data file cut off at the end can:", "Produce a wrong sum and turn the light on", "Never affect the test", "Raise turnout", "Change the machine's time", "That is why the site checks file integrity."],
      ["What does Test 2's light alone allow you to conclude?", "That the sum does not match and the printed tally sheet must be checked", "That there was manipulation", "That Candidate A won", "That the machine was replaced", "An anomaly is a prompt to check."],
    ],
    situ: ["The sum of presidential votes in a section is 5 votes higher than the number of people who voted.", "In the Senate, a section's vote sum equals the turnout instead of twice the turnout."],
  };

  T.T03 = {
    nome: "Unanimity in the section", curto: "Looks for sections where one candidate got 100% of valid votes and calculates whether that is too rare for the region.",
    vis: "Each dot is a fictitious section in the region (the candidate's share). The diamond is your section.",
    campos: { n: "Valid votes in the section", a: "Votes for Candidate A", m: "A's average share in the region (%)" },
    kv(s, r, f) { const v = r.v, out = [["Votes for A", `${f.n(Math.min(s.a, s.n))} of ${f.n(s.n)}`]]; if (v.lp != null) out.push(["Region average", f.pct(v.mref)], ["Chance by luck", f.chance(v.lp)], ["After adjustment (q)", f.sci(v.lq)]); return out; },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return [`The section has only <b>${f.n(v.n)}</b> valid vote${p(v.n)}. The test only evaluates sections with at least 10: with so few people, 100% for one candidate often happens by chance.`];
      if (r.nivel === "ok") return [`Nobody got 100% of the valid votes: Candidate A has ${f.n(v.a)} of ${f.n(v.n)} (${f.pct(v.a / Math.max(1, v.n))}).`, "Test 3 only looks for unanimity. A section very favorable to a candidate, but short of 100%, does not turn this light on. Other tests, like Neighborhood contrast, compare with neighboring sections."];
      const c = v.cand === "A" ? "Candidate A" : "Candidate B";
      const out = [`All ${f.n(v.n)} valid votes went to <b>${c}</b>. In the region's sections, this candidate usually gets <b>${f.pct(v.mref)}</b>.`, pq(f, v) + " " + bhTxt(f, v)];
      if (r.nivel === "anom") out.push(`<b>That is why the test flags.</b> Normal would be around ${f.pct(v.mref, 0)} for ${c}, with some votes for the other candidate too.`, "This proves nothing: small, close-knit communities (indigenous villages, isolated communities, specific institutions) can vote as a bloc. The flag asks for a check of the printed tally sheet and the minutes.");
      else out.push("<b>Not rare enough to flag.</b> The site only records it as informational (100% for one candidate), because in the region this candidate is already very strong or sections vary a lot.");
      return out;
    },
    ficha: (s, f) => fichaL([`Valid votes in the section: ${s.n}`, `Votes for Candidate A: ${s.a} (the rest went to Candidate B)`, `In the region, A gets on average ${s.m}% of the votes`, `Sections in the region ${rhoTxt[s.rho]}`]),
    m: [
      ["Unanimity", "Give <b>all valid votes</b> to Candidate A (120).", "In a region where A has about 55%, a 120-vote section with 100% for A is far too rare. The test calculates that chance from the region's sections."],
      ["Where A is weak", "Here A has only 30% in the region. Take A to <b>80 votes</b> (100%).", "The weaker the candidate in the region, the less likely unanimity is."],
      ["Unanimity for the other", "Now <b>set Candidate A to zero</b>: all 60 votes go to Candidate B.", "The test looks at any candidate. 100% for B where B has about 45% is also rare."],
      ["Large section", "Give the <b>300 votes</b> to Candidate A.", "The larger the section, the lower the chance that everyone picks the same candidate by luck."],
      ["Strong, but similar sections", "A has 75% and the region's sections are similar. Give the <b>80 votes</b> to A.", "Even where the candidate is strong, if sections tend to be similar, 100% of 80 votes departs from the pattern."],
      ["Find the minimum size", "The section has 10 votes, all for A. Raise the <b>valid votes</b> (A follows) until the light turns yellow.", "With few votes, 100% happens by chance. From a certain size it stops being plausible. The test calculates that point for each region."],
      ["Indigenous village", "A small, close-knit village votes together. Give the <b>30 votes</b> to Candidate A.", "The test flags, but small, homogeneous communities can legitimately vote as a bloc. The surrounding region does not represent that community well."],
      ["Religious community", "An isolated religious community votes together. Give the <b>40 votes</b> to A.", "Isolated, close-knit groups can give 100% to one candidate. That is why the site speaks of a statistical anomaly: it is a prompt to check."],
      ["Riverside community", "A remote riverside community votes in a single section. Give the <b>40 votes</b> to A.", "Isolated places can have a pattern very different from the comparison sections."],
      ["Near unanimity", "Give Candidate A every vote <b>but 1</b> (119 of 120).", "Test 3 only looks for 100%. With 99% the light stays green. Other tests may notice a section very different from its neighbors."],
      ["Section too small", "Give the <b>9 votes</b> to A.", "Below 10 valid votes the test does not evaluate: with so few voters, 100% often happens by chance."],
      ["Candidate's stronghold", "Where A has 97% in the region, give the <b>50 votes</b> to A.", "100% where the candidate already has almost everything is not rare. The site only records it as informational."],
    ],
    faq: [
      ["Why doesn't 100% in a small section flag?", "Because, with few voters, unanimity often happens by chance. The test calculates the chance taking the section's size into account."],
      ["What is the section compared with?", "With the sections of the same reference group: the same zone within the municipality, or the municipality, zone or state, depending on how many sections are available (at least 20)."],
      ["What is the blue light in this test?", "It is 100% for one candidate when that is not rare enough. It is recorded as informational, with the count per candidate."],
    ],
    prova: [
      ["What does Test 3 look for?", "Sections where one candidate got 100% of valid votes", "Sections with over 70% for a candidate", "Sections with many blank votes", "Sections without voters", "It only looks at unanimity and calculates whether it is rare for the region."],
      ["A section with 9 valid votes, all for one candidate:", "Stays outside the test", "Always flags", "Is informational", "Is annulled", "The minimum is 10 valid votes."],
      ["Why is 100% in a large section rarer?", "Because it is less likely that many people choose the same candidate by chance", "Because large sections use different machines", "Because the law forbids it", "It is not rarer", "The chance drops sharply with section size."],
      ["A small, close-knit village with 100% for one candidate:", "May flag, but may be legitimate", "Proves manipulation", "Never flags", "Is excluded from the test", "Homogeneous communities can vote as a bloc."],
      ["A section with 99% for one candidate:", "Does not turn Test 3's light on", "Flags in Test 3", "Stays outside the test", "Is informational", "The test only looks for 100%."],
      ["What does the adjustment for many sections do?", "Requires the result to stay rare even after counting every section tested", "Adds votes from neighboring sections", "Ignores small sections", "Swaps the candidates", "It is the Benjamini–Hochberg procedure."],
    ],
    situ: ["In a section with 200 valid votes, all went to the same candidate, who gets about half the votes in the region.", "A section of an isolated community gave 100% of its votes to a single candidate."],
  };

  T.T04 = {
    nome: "Zero abstention", curto: "Looks for sections where every eligible voter voted (no one stayed away) and calculates whether that is too rare for the region.",
    vis: "Each dot is a fictitious section in the region (turnout). The diamond is your section.",
    campos: { ap: "Eligible voters", co: "Turnout", m: "Average turnout in the region (%)" },
    kv(s, r, f) { const v = r.v, out = [["Voted", `${f.n(Math.min(s.co, s.ap))} of ${f.n(s.ap)}`]]; if (v.lp != null) out.push(["Region average", f.pct(v.mref)], ["Chance by luck", f.chance(v.lp)], ["After adjustment (q)", f.sci(v.lq)]); return out; },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return [`The section has only <b>${f.n(v.ap)}</b> eligible voters. The test only evaluates sections with at least 20: in very small sections, everybody voting is common.`];
      if (!v.integral) return [`${f.n(v.ap - v.co)} voter${v.ap - v.co === 1 ? "" : "s"} stayed away (turnout of ${f.pct(v.co / Math.max(1, v.ap))}).`, "Test 4 only looks at 100% turnout. Any absence keeps the light green, even if turnout is very high."];
      const out = [`All ${f.n(v.ap)} eligible voters voted. In the region's sections, average turnout is <b>${f.pct(v.mref)}</b>.`, pq(f, v) + " " + bhTxt(f, v)];
      if (r.nivel === "anom") out.push(`<b>That is why the test flags.</b> Normal would be about ${f.n(Math.round(v.ap * (1 - v.mref)))} voters staying away.`, "This proves nothing: special sections (prisons, detention units, hospitals) and recently reviewed voter rolls can legitimately have full turnout. Voters away from home also change the count.");
      else out.push("<b>Not rare enough to flag</b>, because in the region nearly everybody votes or sections vary a lot.");
      return out;
    },
    ficha: (s, f) => fichaL([`Eligible voters: ${s.ap}`, `Turnout: ${s.co}`, `In the region, average turnout is ${s.m}%`, `Sections in the region ${rhoTxt[s.rho]}`]),
    m: [
      ["Nobody stayed away", "Take <b>turnout</b> up to 180: everybody voted.", "Where 1 in 5 usually stays away, nobody missing in a 180-voter section is extremely rare."],
      ["Region with many absences", "Here 35% usually stay away. Take turnout to <b>120</b>.", "The more people usually stay away, the less likely it is that nobody does."],
      ["Medium section", "Take turnout to <b>45</b>.", "Even a 45-voter section flags when the region usually has many absences and sections are similar."],
      ["Large section", "Take turnout to <b>400</b>.", "In large sections, 100% turnout practically never happens by chance."],
      ["Find the minimum size", "The section has 20 voters and all of them voted. Raise the <b>eligible count</b> (turnout follows) until the light turns yellow.", "The point at which 100% becomes an anomaly depends on the section's size and how many usually stay away in the region."],
      ["Similar sections", "The sections in this region vary little. Take turnout to <b>80</b>.", "When the region's sections are similar, a large deviation stands out more."],
      ["Section in a prison", "In a prison unit, eligible inmates vote together. Take turnout to <b>50</b>.", "Special sections can legitimately reach 100%. The test does not know that; the section's minutes do."],
      ["Recently reviewed roll", "The city reviewed its voter roll and removed people who no longer live there. Take turnout to <b>60</b>.", "Clean rolls have fewer absences. The comparison sections may not have gone through the same review."],
      ["Hospital section", "Section with hospitalized voters and staff. Take turnout to <b>80</b>.", "Special places have special publics. The flag asks for a check, not a conclusion."],
      ["Only one missing", "Leave turnout at <b>179</b> (1 less than eligible).", "Test 4 only looks at 100%. With one voter missing, the light stays green."],
      ["Tiny section", "Take turnout to <b>19</b>.", "The test only evaluates sections with at least 20 eligible voters."],
      ["Region that hardly misses", "Where only 3% usually stay away, take turnout to <b>30</b>.", "100% where almost nobody stays away is not rare."],
    ],
    faq: [
      ["Why can everybody voting be suspicious?", "Because in large sections someone always misses: travel, illness, moving. Nobody missing in a section of hundreds of voters is very unlikely."],
      ["Why can a prison have 100%?", "Because pre-trial detainees are at the site and vote together. It is an example of a legitimate cause."],
      ["Why only from 20 eligible voters?", "Below that, 100% turnout is common and the test would raise too many false alarms."],
    ],
    prova: [
      ["What does Test 4 look for?", "Sections where every eligible voter voted", "Sections with many absences", "Sections with turnout above 90%", "Sections without a tally sheet", "It only looks at full turnout and calculates the chance."],
      ["A section with 19 eligible voters and 100% turnout:", "Stays outside the test", "Always flags", "Is informational", "Is annulled", "The minimum is 20 eligible voters."],
      ["In a prison section with 100% turnout, the flag:", "May have a legitimate cause", "Proves manipulation", "Never appears", "Annuls the section", "Special sections can legitimately have full turnout."],
      ["Where 30% usually stay away, 100% in a large section is:", "Very unlikely", "Common", "Impossible to calculate", "Always legitimate", "The chance drops sharply with size and absence rate."],
      ["Does a section with 1 voter missing turn Test 4's light on?", "No", "Yes", "Only if it is large", "Only in the second round", "The test only looks at 100% turnout."],
      ["What is the section compared with?", "With the sections of the same reference group", "Always with the whole country", "With the previous election", "Only with the next section", "The group can be zone, municipality, zone of the state or state, with at least 20 sections."],
    ],
    situ: ["In a section with 350 eligible voters, all voted, in a municipality where 1 in 5 usually stays away.", "Every eligible voter of a large section showed up, with no abstention at all."],
  };

  const excessoSimples = (o) => (s, r, f) => {
    const v = r.v;
    if (r.nivel === "na") return [`The section has only <b>${f.n(v.n)}</b> ${o.un}. The test only evaluates from 30: with so few, the proportion varies a lot by chance.`];
    const prop = f.pct(v.x / Math.max(1, v.n));
    if (!v.acima) return [`The section has ${f.n(v.x)} ${o.coisa} out of ${f.n(v.n)} (${prop}), below the region average (${f.pct(v.mref)}).`, `The test only looks for <b>excess</b>. Having fewer ${o.coisa} than the region does not turn the light on.`];
    const out = [`The section has <b>${f.n(v.x)}</b> ${o.coisa} out of ${f.n(v.n)} (${prop}). In the region's sections, the average is <b>${f.pct(v.mref)}</b>.`,
      `The chance of a section like this having that many ${o.coisa} (or more) by luck is <b>${f.chance(v.lp)}</b>. ` + bhTxt(f, v)];
    if (r.nivel === "anom") out.push(`<b>That is why the test flags.</b> Normal would be around ${f.n(Math.round(v.n * v.mref))} ${o.coisa}.`, o.legit);
    else out.push("<b>It is within the normal variation</b> of the region's sections. Small changes do not show.");
    return out;
  };
  const excessoKv = (rot) => (s, r, f) => { const v = r.v; return [[rot, v.n ? `${f.n(v.x)} of ${f.n(v.n)} (${f.pct(v.x / Math.max(1, v.n))})` : "—"]].concat(v.lp != null ? [["Region average", f.pct(v.mref)], ["Chance by luck", f.chance(v.lp)], ["After adjustment (q)", f.sci(v.lq)]] : []); };

  T.T05 = {
    nome: "Excess blank and null votes", curto: "Looks for tally sheets with far more blank and null votes than similar sections in the region.",
    vis: "Each dot is a fictitious section in the region (blank + null). The diamond is your section.",
    campos: { tot: "Votes in the office", m: "Blank + null in the region (%)" },
    kv: excessoKv("Blank + null"),
    simples: excessoSimples({ un: "votes in the office", coisa: "blank and null votes", legit: "This proves nothing: null-vote campaigns, candidates whose registration was denied and voters who struggle with the machine legitimately raise blank and null votes." }),
    ficha: (s, f) => fichaL([`Votes in the office: ${s.tot}`, `Blank: ${s.br} · null: ${s.nu}`, `In the region, blank + null average ${s.m}%`, `Sections in the region ${rhoTxt[s.rho]}`]),
    m: [
      ["Rain of null votes", "Raise the <b>null</b> votes until the light turns yellow.", "The test compares with the region's sections. Far more null votes than normal flag."],
      ["Too many blanks", "Raise only the <b>blank</b> votes until the light turns yellow.", "Blank and null votes are added together: the test looks at votes that went to no candidate."],
      ["Small section", "In this 40-vote section, raise the <b>null</b> votes until it flags.", "In small sections a larger proportion is needed to escape chance."],
      ["Large section", "In this 400-vote section, raise the <b>null</b> votes until it flags.", "In large sections, a smaller proportion is enough."],
      ["Region with many null votes", "Here 12% usually vote blank or null. Raise the <b>null</b> votes until it flags.", "The cut-off follows the region's pattern."],
      ["Find the limit", "Raise the <b>null</b> votes one by one and stop at the <b>first value</b> that turns the light on.", "That is this section's limit. One vote less and the light is green."],
      ["Null-vote campaign", "A neighborhood group campaigned for null votes. Raise the <b>null</b> votes until it flags.", "Null-vote campaigns are legitimate and really raise null votes."],
      ["Registration denied", "The neighborhood's favorite candidate had their registration denied, and votes for them became null. Raise the <b>null</b> votes until it flags.", "Votes for a candidate whose registration was denied may be counted as null. It is a legitimate cause."],
      ["Voters who struggle", "A care-home section: many elderly people struggle with the machine. Put <b>30 blank</b> and raise the <b>null</b> votes until it flags.", "Difficulty using the machine is a legitimate cause of blank and null votes."],
      ["A few more null votes", "Add <b>3 null</b> votes. Does the light stay green?", "Small changes stay within normal variation and the test does not see them."],
      ["Section too small", "Put <b>12 or more null</b> votes in this 29-vote section.", "Below 30 votes the test does not evaluate."],
      ["No blank or null votes", "Set <b>blank and null</b> to zero.", "The test only looks for excess. A lack of blank and null votes does not turn the light on."],
    ],
    faq: [
      ["Why are blank and null votes added together?", "Because both are votes that go to no candidate. The test looks at that total relative to the office's votes."],
      ["Why doesn't having few null votes flag?", "The test is one-sided: it only looks for excess, the pattern linked to recording problems or difficulty using the machine."],
      ["What is the robust z-score shown in the technical part?", "A measure of how far the section is from the region's median, using the median and the median absolute deviation, which are not swayed by extreme values."],
    ],
    prova: [
      ["Test 5 compares the section with:", "Similar sections in the same region", "The national result", "The previous election", "The next-numbered section", "It is the reference group."],
      ["A null-vote campaign in the neighborhood:", "Can legitimately make the test flag", "Proves manipulation", "Never changes null votes", "Annuls the section", "Legitimate causes raise null votes."],
      ["A section with fewer blank and null votes than the region:", "Does not flag", "Flags", "Stays outside the test", "Is informational", "The test only looks for excess."],
      ["What is the minimum number of votes for Test 5 to evaluate?", "30", "10", "100", "There is no minimum", "Below 30 votes the proportion varies too much by chance."],
      ["In a larger section, to flag you need:", "A smaller proportion of blank and null votes than in a small section", "A larger proportion", "Exactly the same proportion", "To be the largest in the country", "With more votes, chance explains less."],
      ["Adding 3 null votes to a normal section:", "Usually does not turn the light on", "Always turns it on", "Annuls the section", "Changes turnout", "It stays within normal variation."],
    ],
    situ: ["A section had 35% blank and null votes for President, in a region where the average is 4%.", "Votes that went to no candidate are far above the region's normal in one section."],
  };

  T.T07 = {
    nome: "Party-list paradox", curto: "Looks for Deputy tally sheets with far more party-list votes (only the party number) than similar sections in the region.",
    vis: "Each dot is a fictitious section in the region (party-list votes). The diamond is your section.",
    campos: { val: "Valid votes for Federal Deputy", leg: "Party-list votes", m: "Party-list share in the region (%)" },
    kv: excessoKv("Party-list votes"),
    simples: excessoSimples({ un: "valid votes", coisa: "party-list votes", legit: "This proves nothing: campaigns to vote for the party list and a party's strength in the neighborhood legitimately raise these votes." }),
    ficha: (s, f) => fichaL([`Valid votes for Federal Deputy: ${s.val}`, `Party-list votes: ${s.leg}`, `In the region, the party-list share averages ${s.m}%`, `Sections in the region ${rhoTxt[s.rho]}`]),
    m: [
      ["Party list on the rise", "Raise the <b>party-list votes</b> until it flags.", "A party-list vote is a vote for the party number only. The test compares with the region's sections."],
      ["Small section", "In this 60-vote section, raise the <b>party list</b> until it flags.", "In small sections a larger proportion is needed."],
      ["Large section", "In this 380-vote section, raise the <b>party list</b> until it flags.", "In large sections, a smaller proportion is enough."],
      ["Region with lots of party-list votes", "Here 20% vote for the party list. Raise the <b>party list</b> until it flags.", "The cut-off follows the region's pattern."],
      ["Region with few party-list votes", "Here only 4% vote for the party list. Raise the <b>party list</b> until it flags.", "Where almost nobody votes for the party list, a smaller increase already stands out."],
      ["Find the limit", "Raise the <b>party list</b> one by one and stop at the <b>first value</b> that turns the light on.", "That is this section's limit."],
      ["“Vote for the list” campaign", "A party campaigned for votes on its number only. Raise the <b>party list</b> until it flags.", "Campaigns for party-list votes are legitimate."],
      ["Strong party in the neighborhood", "A very traditional party in the neighborhood. Raise the <b>party list</b> until it flags.", "A party's strength in a place explains more party-list votes."],
      ["Voters who remember the party", "Many voters remember the party's number, not the candidate's. Raise the <b>party list</b> until it flags.", "It is legitimate behavior that raises party-list votes."],
      ["A little more", "Add <b>4</b> party-list votes.", "Within normal variation, the test does not see it."],
      ["Section too small", "Put <b>15 or more</b> party-list votes in this 28-vote section.", "Below 30 valid votes the test does not evaluate."],
      ["No party-list votes", "Set the <b>party list</b> to zero.", "The test only looks for excess."],
    ],
    faq: [
      ["What is a party-list vote?", "A vote for the party number only (two digits), without choosing a candidate. It counts for the party when seats are distributed."],
      ["Why does the test only apply to Deputies?", "Because party-list votes exist in proportional offices: Federal, State and District Deputy."],
      ["Why is it called a paradox?", "Because most voters vote for people. A section with many votes only for the party departs from common behavior."],
    ],
    prova: [
      ["What is a party-list vote?", "A vote for the party number only", "A blank vote", "A vote annulled by the courts", "A vote cast away from home", "It counts for the party."],
      ["Which offices is Test 7 applied to?", "Federal, State and District Deputy", "President and Governor", "Senator", "All offices", "Party-list votes exist in proportional offices."],
      ["A campaign to vote for the party list can:", "Legitimately make the test flag", "Annul the section", "Lower party-list votes", "Prove manipulation", "It is a legitimate cause."],
      ["The minimum number of valid votes for Test 7 to evaluate is:", "30", "10", "50", "100", "Same as the other proportion tests."],
      ["Fewer party-list votes than the region:", "Does not flag", "Flags", "Stays outside the test", "Is informational", "The test only looks for excess."],
      ["The Benjamini–Hochberg adjustment serves to:", "Avoid false alarms when many sections are tested", "Add party-list votes", "Change the party", "Change the region", "It is the correction for multiple tests."],
    ],
    situ: ["In one section, 40% of Federal Deputy votes went to the party number only, in a region where the average is 7%.", "Votes with no candidate, only the party number, are far above normal in one section."],
  };

  T.T10 = {
    nome: "Low biometric validation", curto: "Looks for sections where many voters with registered fingerprints were let in without them, far above the region's pattern.",
    vis: "Each dot is a fictitious section in the region (let in without biometrics). The diamond is your section.",
    campos: { co: "Turnout", sb: "Let in without biometrics", m: "Without biometrics in the region (%)" },
    kv: excessoKv("Without biometrics"),
    simples: excessoSimples({ un: "people who voted", coisa: "voters let in without biometrics", legit: "This proves nothing: worn fingerprints (elderly people, manual workers), a faulty fingerprint reader and poor-quality registration in the region explain legitimate increases." }),
    ficha: (s, f) => fichaL([`Turnout: ${s.co}`, `Let in without biometrics: ${s.sb}`, `In the region, the average is ${s.m}%`, `Sections in the region ${rhoTxt[s.rho]}`]),
    m: [
      ["Biometrics unused", "Raise the <b>voters let in without biometrics</b> until it flags.", "Anyone with a registered fingerprint is normally let in by fingerprint. Letting many in without it departs from the region's pattern."],
      ["Small section", "In this 60-voter section, raise it until it flags.", "In small sections a larger proportion is needed."],
      ["Large section", "In this 380-voter section, raise it until it flags.", "In large sections, a smaller proportion is enough."],
      ["Region where fingerprints often fail", "Here 12% are usually let in without fingerprints. Raise it until it flags.", "The cut-off follows the region."],
      ["Region where fingerprints rarely fail", "Here only 1.5% are let in without fingerprints. Raise it until it flags.", "Where biometrics work well, a smaller increase already stands out."],
      ["Find the limit", "Raise it one by one and stop at the <b>first value</b> that turns the light on.", "That is this section's limit."],
      ["Faulty reader", "The fingerprint reader failed in the afternoon. Raise it until it flags.", "A faulty reader is a legitimate cause and is usually written in the minutes."],
      ["Rural workers", "Many voters with fingerprints worn by manual work. Raise it until it flags.", "Worn fingerprints are not read. It is a legitimate cause."],
      ["Elderly voters' section", "A section with many elderly voters, whose fingerprints are hard to read. Raise it until it flags.", "Skin changes with age and the reader fails more."],
      ["A few more", "Add <b>3</b> voters let in without biometrics.", "Within normal variation, the test does not see it."],
      ["Section too small", "Put <b>15 or more</b> in this 29-voter section.", "Below 30 voters the test does not evaluate."],
      ["Nobody without biometrics", "Set the voters let in without biometrics to zero.", "The test only looks for excess."],
    ],
    faq: [
      ["What does being let in without biometrics mean?", "The voter has a registered fingerprint but is let in to vote by other means (photo ID and signature), because the fingerprint was not recognized."],
      ["Why is turnout the denominator?", "Because the tally sheet does not say how many of the section's voters have biometrics. The test uses the total number of people who voted."],
      ["Does this indicate someone else voted?", "No. It is only a prompt to check the minutes and the reader's log. There are many legitimate causes."],
    ],
    prova: [
      ["What does Test 10 look at?", "Voters with registered fingerprints let in without them", "Voters without an ID", "Blank votes", "The machine's time", "It is biometrics unused above the pattern."],
      ["A legitimate cause for many voters let in without biometrics is:", "A faulty fingerprint reader", "A strong candidate", "A large section", "An official contingency machine", "Faults and worn fingerprints explain increases."],
      ["Which denominator does the test use?", "Turnout", "Eligible voters with biometrics", "Valid votes", "Blank votes", "The tally sheet does not say how many have biometrics."],
      ["Minimum number of voters for the test to evaluate:", "30", "20", "10", "100", "It is the minimum of the proportion tests."],
      ["Fewer voters let in without biometrics than the region:", "Does not flag", "Flags", "Stays outside the test", "Is informational", "The test only looks for excess."],
      ["If the test flags, the next step is:", "Check the section's minutes and the machine's records", "Annul the section", "Conclude there was manipulation", "Ignore it", "An anomaly is a prompt to check."],
    ],
    situ: ["In one section, 25% of voters with registered fingerprints were let in without them, in a region where the average is 3%.", "A machine's fingerprint reader stopped working and many voters voted without biometric identification."],
  };

  const ESP = ["Left", "Center-left", "Center", "Center-right", "Right"];
  T.T06 = {
    nome: "Extreme split ticket", curto: "Looks for sections where the vote for President and the vote for Deputy go to opposite sides in an extreme way, very different from the region.",
    vis: "The section's votes by political side (the author's classification, fictitious here)", vis2: "Each dot is the difference between the two offices in a fictitious section of the region. The diamond is your section.",
    esp: ESP,
    campos: { nx: "Valid votes for President", nl: "Valid votes for Fed. Deputy", eA: "Candidate A (left) for President (%)", "l.0": "Fed. Deputy: Left", "l.1": "Fed. Deputy: Center-left", "l.2": "Fed. Deputy: Center", "l.3": "Fed. Deputy: Center-right", "l.4": "Fed. Deputy: Right", grupo: "Region" },
    op: { grupo: { padrao: "Split tickets are rare", dividido: "Split tickets are common" } },
    kv(s, r, f) { const v = r.v; return [["Left bloc (Pres. / Dep.)", `${f.pct(v.ex.e, 0)} / ${f.pct(v.lg.e, 0)}`], ["Right bloc (Pres. / Dep.)", `${f.pct(v.ex.d, 0)} / ${f.pct(v.lg.d, 0)}`], ["Difference (Δ)", f.n(v.delta, 2)]].concat(v.z != null ? [["Robust z-score", f.n(v.z, 2)]] : []); },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return ["The section has fewer than 50 valid votes in one of the offices. The test only evaluates from 50 in each."];
      const out = [`For President, the left bloc has ${f.pct(v.ex.e, 0)} and the right bloc ${f.pct(v.ex.d, 0)}. For Federal Deputy, ${f.pct(v.lg.e, 0)} and ${f.pct(v.lg.d, 0)} (the Center is outside both blocs).`];
      out.push(v.crA ? "<b>Criterion A met:</b> one bloc has 70% or more in one office and the opposite bloc has 70% or more in the other." : "Criterion A not met: no bloc reaches 70% in one office with the opposite bloc also at 70% in the other.");
      out.push(v.crB ? `<b>Criterion B met:</b> the difference between the offices (${f.n(v.delta, 2)}) departs strongly from the region's sections (z = ${f.n(v.z, 1)}; the limit is 3.5).` : `Criterion B not met: the difference between the offices stays within the region's pattern (z = ${f.n(v.z, 1)}; the limit is 3.5).`);
      if (r.nivel === "anom") out.push("<b>Because both criteria hold at the same time, the test flags.</b>", "This proves nothing: voting for different sides for President and Deputy is common and legitimate in Brazil, for example because of a popular local deputy. Also, classifying parties as left or right is the author's premise, not an official category.");
      else out.push("The test only flags when both criteria hold together.");
      return out;
    },
    ficha: (s, f) => fichaL([`President: Candidate A (left) ${s.eA}%, Candidate B (right) ${100 - s.eA}% · ${s.nx} valid votes`, `Federal Deputy: ${ESP.map((e, i) => `${e} ${s.l[i]}`).join(", ")} · ${s.nl} valid votes`, `Region: ${s.grupo === "dividido" ? "split tickets are common" : "split tickets are rare"}`]),
    m: [
      ["Left and right at once", "Set <b>Candidate A</b> (left) to 80% and the Federal Deputy vote to <b>60% Right</b> and 20% Center-right.", "When one bloc has 70% or more in one office and the opposite bloc 70% or more in the other, and that also departs strongly from the region, the test flags."],
      ["The other way round", "Candidate A at <b>20%</b> (B, on the right, at 80%) and Deputy at <b>50% Left</b> and 25% Center-left.", "The test looks both ways."],
      ["Split-ticket region", "Here split tickets are common. Make an extreme case: A at <b>97%</b> and Deputy at <b>90% Right</b>.", "Where splitting the vote is common, only very extreme cases depart from the pattern."],
      ["Section with few votes", "A at <b>85%</b> and Deputy at 60% Right and 25% Center-right.", "The test applies from 50 valid votes in each office."],
      ["Through the center-right", "A at <b>88%</b> and Deputy at <b>70% Center-right</b> and 15% Right.", "The right bloc adds Right and Center-right."],
      ["Through the center-left", "A at <b>12%</b> and Deputy at <b>65% Center-left</b> and 15% Left.", "The left bloc adds Left and Center-left."],
      ["Popular local deputy", "A right-wing deputy much loved in the neighborhood: A at <b>78%</b> and Deputy at <b>72% Right</b>.", "Split tickets are common and legitimate. A popular local politician explains the flag."],
      ["Voting to balance", "Voters who deliberately vote for opposite sides: A at <b>22%</b> and Deputy at <b>48% Left</b> and 30% Center-left.", "Some voters split their vote to balance power. It is legitimate."],
      ["A party's stronghold", "A at <b>76%</b> and Deputy at <b>65% Right</b> and 15% Center-right.", "A local party's strength for Deputy coexists with another preference for President."],
      ["Moderate divergence", "Leave A at <b>66%</b> and the Deputy right bloc at <b>65%</b>.", "Below 70% in one of the offices, criterion A is not met, even with a large difference."],
      ["Section too small", "A at <b>90%</b> and Deputy at <b>80% Right</b>.", "Below 50 valid votes in an office, the test does not evaluate."],
      ["Center vote", "A at <b>90%</b> and Deputy at <b>60% Center</b>.", "Center votes are in neither bloc. So the opposite bloc does not reach 70%."],
    ],
    faq: [
      ["Who decided which parties are left or right?", "It is an analytical premise of the author, explained in the Technical Report. It is not an official classification. In the simulator, the blocs are fictitious."],
      ["Why are both criteria needed?", "Criterion A catches extreme cases; B checks whether that is rare in the region. Together they avoid flagging regions where split tickets are common."],
      ["Is splitting the vote wrong?", "No. It is legitimate and frequent behavior. The test only points to extreme, rare cases for checking."],
    ],
    prova: [
      ["Test 6's criterion A requires:", "70% or more for one bloc in one office and for the opposite bloc in the other", "50% for each candidate", "More than 100 votes", "Equal votes in both offices", "It is the blocs criterion."],
      ["Test 6's criterion B uses:", "The robust z-score relative to the region", "The sum of blank votes", "The machine's time", "The contingency machine", "It compares the difference between offices with the region, with a limit of 3.5."],
      ["A split vote between left and right is:", "Legitimate and frequent behavior", "Forbidden", "Always flagged", "Proof of manipulation", "The test only points to extreme, rare cases."],
      ["Center votes:", "Are outside both the left and right blocs", "Count as left", "Count as right", "Are removed from the total", "They count in the total, but in no bloc."],
      ["The party classification used in the test is:", "An analytical premise of the author", "An official TSE list", "Drawn at random", "Chosen by the voter", "It is not an official category."],
      ["Minimum valid votes in each office for the test to evaluate:", "50", "10", "30", "200", "It is the split-ticket minimum."],
    ],
    situ: ["In a section, 85% voted for the left-wing presidential candidate and 80% for right-wing Deputies, something very rare in the region.", "A section's vote for President and vote for Deputy went to opposite political sides in an extreme way."],
  };

  T.T08 = {
    nome: "Neighborhood contrast", curto: "Compares each section with the other sections of the same polling place and looks for one that votes very differently.",
    local: "Fictitious polling place: Example School", dif: "Difference (p.p.)", alvo: "(in focus)", media: "A's share at the polling place", vis: "Candidate A's % in each section (the dashed line is the average of the place's other sections)",
    vis_leg: "Yellow bars: sections the test would flag.",
    campos: { k: "Sections at the place", n: "Valid votes", a: "Candidate A's %" },
    simples(s, r, f) {
      const v = r.v, q = v.alvo || {};
      if (r.nivel === "na" && !q.n) return [`The place has only ${v.k} sections. The test only evaluates places with at least 3: with 2, there is no way to tell which one is different.`];
      if (q.na) return ["The section in focus has fewer than 30 valid votes. The test does not evaluate it."];
      const out = [`The section in focus gives <b>${f.pct(q.pS)}</b> to Candidate A; the place's other sections give <b>${f.pct(q.pR)}</b>. The difference is <b>${f.n(Math.abs(q.dif), 1)} points</b>.`,
        `To flag, the test requires two things: a difference of at least 25 points, and that it is unlikely by chance, even considering the roughly ${f.n(v.M)} sections tested nationwide. Here the chance by luck is ${f.chance(q.lp)}.`];
      const outras = r.cats.filter((c) => c.secao !== +s.alvo).length;
      if (q.sinal) out.push("<b>Both conditions hold: the test flags this section.</b> Normal would be for it to vote like its neighbors at the same place.", "This proves nothing: voters are split into sections partly by address and registration order, and a section can gather a different public (another neighborhood, another age group).");
      else out.push(Math.abs(q.dif) < 25 ? "The difference is below 25 points, so the test does not flag." : "The difference exceeds 25 points, but can still be explained by chance (small sections vary more). The test does not flag.");
      if (outras) out.push(`${outras} other section${p(outras)} at the place would also turn the light on.`);
      return out;
    },
    ficha: (s, f) => fichaL(Array.from({ length: +s.k }, (_, i) => `Section ${i + 1}: ${s.n[i]} valid votes, ${s.a[i]}% for Candidate A${i === +s.alvo ? " (in focus)" : ""}`)),
    m: [
      ["One section stands out", "Take <b>Section 3</b> to 90% for Candidate A.", "Sections at the same place usually vote alike. One very different from the others flags."],
      ["Downwards", "Take <b>Section 3</b> to 20%.", "The test looks at differences up and down."],
      ["Place with 3 sections", "Take <b>Section 2</b> to 92%.", "The test applies from 3 sections at the place."],
      ["Small sections", "The sections have about 40 votes. Take <b>Section 3</b> to 100%.", "With about 40 votes per section, not even 100% is enough: after considering every section in the country, chance still explains the difference."],
      ["Find the limit", "Raise <b>Section 3</b> little by little and stop at the <b>first value</b> that turns the light on.", "The flag requires a difference of 25 points or more and that it cannot be explained by chance."],
      ["Two different sections", "Take <b>Sections 2 and 5</b> to 95%.", "More than one section can be flagged at the same place."],
      ["Different neighborhood", "Section 3 takes voters from another neighborhood. Take it to <b>88%</b>.", "Voters are split into sections partly by address and registration order. A section can have a different public."],
      ["Older voters' section", "Section 4 gathers older voters registered decades ago. Take it to <b>22%</b>.", "Age and registration date change a section's profile. It is a legitimate cause."],
      ["Transferred voters", "Section 1 received voters transferred from another city. Take it to <b>90%</b>.", "Groups with a different origin can vote differently from their neighbors."],
      ["Almost 25 points", "Take <b>Section 3</b> to <b>77%</b>: a large difference, but below 25 points.", "Below 25 points the test does not flag, even if the difference is large."],
      ["Place with 2 sections", "Take <b>Section 2</b> to 90%.", "With fewer than 3 sections the test does not evaluate."],
      ["All together", "Raise <b>every section</b> at the place by 25 points.", "If all change together, none stands out from its neighbors. The test compares within the place; changes to the whole place need other tests."],
    ],
    faq: [
      ["Why compare with the same place?", "Sections in the same building usually have similar voters (same neighborhood). So a section very different from its neighbors stands out."],
      ["What is the overdispersion φ?", "A correction: in real life, sections vary more than pure chance predicts. The test measures that extra variation in the group and discounts it, so as not to flag too much."],
      ["Why 25 points?", "Because smaller differences are common between sections at the same place. The limit avoids flagging small variations, even when they are statistically clear."],
    ],
    prova: [
      ["Test 8 compares a section with:", "The other sections of the same polling place", "The whole country", "The previous election", "A section in another state", "It is the neighborhood contrast."],
      ["To flag, the test requires:", "A difference of 25 points or more that is unlikely by chance", "Only a 10-point difference", "Only that the section is large", "That the place has 2 sections", "Both conditions together."],
      ["A place with 2 sections:", "Stays outside the test", "Always flags", "Is informational", "Is merged with the neighbor", "The minimum is 3 sections."],
      ["If every section at the place changes together:", "Test 8 does not see it", "Test 8 flags all of them", "The place is annulled", "The test becomes more sensitive", "None stands out from its neighbors."],
      ["A legitimate cause for a section to stand out is:", "Voters from another neighborhood or age group", "A contingency machine", "The closing time", "Party-list votes", "The split into sections follows address and registration order."],
      ["In small sections, the same difference in points:", "Is easier to explain by chance", "Is always flagged", "Does not exist", "Counts double", "Small sections vary more."],
    ],
    situ: ["At a school with 6 sections, all give about 50% to a candidate except one, which gives 92%.", "One section votes very differently from the other sections in the same building."],
  };

  T.T09 = {
    nome: "Sections with identical results", curto: "Looks for different sections with exactly the same results, vote for vote, and calculates whether that could happen by chance.",
    titulo_par: "Two fictitious sections", copiar: "Copy section 42 into 87", total: "Total",
    cats: { p: ["Candidate A", "Candidate B", "Blank", "Null"], g: ["Governor 1", "Governor 2", "Governor 3", "Governor 4", "Governor 5", "Governor 6", "Blank", "Null"],
      d: ["Deputy 1", "Deputy 2", "Deputy 3", "Deputy 4", "Deputy 5", "Deputy 6", "Deputy 7", "Deputy 8", "Deputy 9", "Deputy 10", "Party list", "Blank", "Null"] },
    campos: { cargo: "Office", N: "Sections with the same vote total in scope" },
    op: { cargo: { p: "President (4 categories)", g: "Governor (8 categories)", d: "Federal Deputy (13 categories)" } },
    kv(s, r, f) { const v = r.v; return [["Identical results?", v.igual ? "yes" : "no"], ["Votes (n) · categories (K)", `${f.n(v.n)} · ${v.K}`]].concat(v.lpc != null ? [["Chance of matching (one pair)", f.chance(v.lpc)], ["Expected coincidences (E)", f.sci(v.lE)]] : []); },
    simples(s, r, f) {
      const v = r.v;
      if (!v.igual) return ["The two sections differ in at least one category. The test only looks at results that are <b>exactly</b> the same, vote for vote.", "A single vote of difference is enough for the test not to treat it as a copy."];
      if (r.nivel === "na") return [`The sections are identical, but the test only evaluates tally sheets with at least 50 votes and 3 categories with votes (here: ${f.n(v.n)} votes and ${v.K} categories). With less, chance coincidences are common.`];
      const out = [`The two sections have exactly the same result: ${f.n(v.n)} votes in ${v.K} categories.`,
        `The chance of two sections of this size matching by luck is ${f.chance(v.lpc)}. But there are ${f.n(v.N)} sections with the same total in scope, giving ${f.n(v.pares)} possible pairs. The expected number of chance coincidences is <b>${f.sci(v.lE)}</b>.`];
      if (r.nivel === "anom") out.push("<b>That number is below 0.01: the test flags.</b> Normal would be for two sections to have similar, not identical, results.", "This proves nothing: the most common cause is a record duplicated during data extraction. The check is against the printed tally sheets of both sections.");
      else out.push("<b>Coincidences like this are expected by chance</b> (the expected number is not below 0.01). With few categories, as for President, identical results happen naturally among thousands of sections.");
      return out;
    },
    ficha: (s, f) => fichaL([`Office: ${({ p: "President", g: "Governor", d: "Federal Deputy" })[s.cargo]}`, `Section 42: ${s.v1.join(", ")}`, `Section 87: ${s.v2.join(", ")}`, `Sections with the same vote total in scope: ${f.n(s.N)}`]),
    m: [
      ["Copied tally sheet", "Click <b>Copy section 42 into 87</b>.", "Two identical Federal Deputy tally sheets, with 13 categories and over 200 votes, almost never happen by chance."],
      ["Copy for Governor", "Copy section 42 into 87 (8 categories).", "With several categories, identical results are extremely rare."],
      ["Smaller sections", "Copy section 42 into 87 (about 55 votes).", "Even with few votes, 13 identical categories are very unlikely."],
      ["Large state", "There are 1,500 sections with the same total in the state. Copy section 42 into 87.", "Even with many possible pairs, the coincidence stays unlikely."],
      ["Duplicated record", "Copy section 42 into 87, as if the same tally sheet had been saved twice in the file.", "Duplication during data extraction produces the same flag. That is why the site checks the original files."],
      ["Aggregated section repeated", "Copy section 42 into 87, as if an aggregated section had been reported twice.", "Aggregated sections are merged into a main one. A recording error can repeat the result."],
      ["Re-sent tally sheet", "Copy section 42 into 87, as if one's tally sheet had been saved in place of the other.", "Transmission or file errors explain copies. The check is against the printed tally sheets."],
      ["Copy with one vote changed", "Copy, then move <b>1 vote</b> from one candidate to another in section 87.", "The test looks for results that are exactly the same. One vote of difference is enough for it not to see."],
      ["President: expected coincidence", "Copy section 42 into 87 for President (4 categories).", "With only 4 categories and thousands of same-size sections in the country, identical results happen by chance. The test calculates that and does not flag."],
      ["President in a small section", "Copy section 42 into 87 (President, about 60 votes).", "The smaller the section and the fewer the categories, the more common coincidences are."],
      ["Fewer than 50 votes", "Copy section 42 into 87 (44 votes).", "Below 50 votes the test does not evaluate."],
      ["Only two candidates", "Copy section 42 into 87 (only A and B have votes).", "With fewer than 3 categories with votes, the test does not evaluate."],
    ],
    faq: [
      ["How can two sections have the same result by chance?", "With few categories and many same-size sections, coincidences happen naturally. The test calculates how many would be expected and only flags when it is very unlikely."],
      ["What is the expected number E?", "The chance of one pair matching multiplied by the number of pairs of sections with the same total. If E is below 0.01, the coincidence is too rare."],
      ["What is the most common cause of identical results?", "Records duplicated when extracting or transmitting data. That is why the check is against the printed tally sheets."],
    ],
    prova: [
      ["Test 9 looks for:", "Sections with exactly the same results", "Sections with similar results", "Sections with many blank votes", "Sections at the same place", "Equality vote for vote."],
      ["A copy with 1 vote changed:", "Is not seen by Test 9", "Always flags", "Stays outside the test", "Is informational", "The test requires exact equality."],
      ["Why do identical presidential results (4 categories) usually not flag?", "Because with few categories and thousands of sections coincidences are expected", "Because the President is not tested", "Because the test ignores blank votes", "Because they are always wrongdoing", "The expected number E does not fall below 0.01."],
      ["The test flags when:", "The expected number of chance coincidences is below 0.01", "The sections are neighbors", "There are more than 100 votes", "The winner is the same", "It is Test 9's criterion."],
      ["Test 9's minimums:", "50 votes and 3 categories with votes", "10 votes", "Only 2 categories", "100 sections", "Below that coincidences are common."],
      ["The most common cause of identical results is:", "Duplicated records in the data", "A contingency machine", "Voting away from home", "Daylight saving time", "The check is against the printed tally sheets."],
    ],
    situ: ["Two sections in different cities have exactly the same Federal Deputy votes, candidate by candidate.", "One section's tally sheet seems to have been copied into another, vote for vote."],
  };

  T.T11 = {
    nome: "Atypical times", curto: "Checks the order and time of the tally sheet's events: opening, closing, printing and reception, with 2 minutes of tolerance.",
    vis: "The section's timeline (local time). The green band is the official voting window.", janela: "official window", vis_leg: "Reception by the TSE is recorded in Brasília time and shown here converted to local time.",
    ev: { ab: "Opening", en: "Closing", em: "Printing", re: "Reception" },
    alerta: { ab: ["abertura_antecipada", "atraso_abertura", "encerramento_antes_abertura"], en: ["encerramento_antecipado", "encerramento_antes_abertura", "emissao_antes_encerramento"], em: ["emissao_antes_encerramento", "recebimento_antes_emissao"], re: ["recebimento_antes_emissao"] },
    campos: { fuso: "City time zone", ab: "Opening (local time)", en: "Closing (local time)", em: "Report printing (local time)", re: "Reception by the TSE (Brasília time)", drift: "Machine clock (minutes: + fast, − slow)", data: "Date differs from election day" },
    op: { fuso: { 0: "Same as Brasília", "-1": "1 hour behind (like Manaus)", "-2": "2 hours behind (like Acre)" } },
    simples(s, r, f) {
      const v = r.v;
      if (!r.cats.length) return [`All in order: the machine opened at ${f.hora(v.ab)} and closed at ${f.hora(v.en)} (local time), within the official window (${f.hora(v.ini)} to ${f.hora(v.fim)} in this city, with 2 minutes of tolerance). The report was printed after closing and received after printing.`,
        "Closing after 5 p.m. is normal when there is a queue: whoever arrived by 5 p.m. votes."];
      const out = [`The test found: ${r.cats.map((c) => `<b>${f.cat(c.c)}</b>`).join("; ")}.`,
        `The right order is: open from ${f.hora(v.ini)} (local time), close from ${f.hora(v.fim)}, print the report after closing and the TSE receives it after printing, all on election day.`];
      if (r.nivel === "info") out.push("An opening delayed by 1 hour or more is only <b>informational</b> (blue light): it usually has an operational cause, such as a machine replacement.");
      else out.push("This proves nothing: a misadjusted machine clock, a machine replaced during voting and cities in a different time zone from most of the state explain many cases.");
      if (+s.drift) out.push(`In this case, the machine's clock is ${Math.abs(s.drift)} minutes ${s.drift > 0 ? "fast" : "slow"}, and the times recorded on the report come out wrong.`);
      return out;
    },
    ficha: (s, f) => fichaL([`City time zone: ${({ 0: "same as Brasília", "-1": "1 hour behind Brasília", "-2": "2 hours behind Brasília" })[s.fuso]}`, `Opening ${f.hora(s.ab)} · closing ${f.hora(s.en)} · printing ${f.hora(s.em)} (local time)`, `Reception by the TSE: ${f.hora(s.re)} (Brasília time)`]),
    m: [
      ["Opened too early", "Change <b>opening</b> to 07:50.", "Voting starts at 8 a.m. Brasília time (converted to local time). With 2 minutes of tolerance, opening at 07:50 flags."],
      ["Closed early", "Change <b>closing</b> to 16:30.", "Voting lasts until 5 p.m. Closing more than 2 minutes earlier flags."],
      ["Report before the end", "Change <b>report printing</b> to 16:55, before closing.", "The report can only be printed after voting has closed."],
      ["Received before it existed", "Change <b>reception by the TSE</b> to 16:50.", "The TSE cannot receive a report that has not been printed yet."],
      ["Closed before opening", "Change <b>closing</b> to 07:30.", "An impossible order of events."],
      ["Wrong day", "Tick <b>Date differs from election day</b>.", "Opening and closing must be on election day."],
      ["Slow clock", "This machine's clock is 15 minutes slow. Set the <b>machine clock</b> to −15.", "The machine opened at 8 a.m. sharp, but its internal clock recorded 07:45. A misadjusted clock is a known, explainable cause."],
      ["Machine switched on in the afternoon", "The machine broke and the replacement was switched on at 13:10. Change <b>opening</b> to 13:10.", "Delays of 1 hour or more are only informational (blue light): they have operational causes."],
      ["Fast clock", "The machine's clock is 25 minutes fast. Set the <b>machine clock</b> to +25.", "Printing seems to come after reception because the machine's clock is wrong; reception uses the TSE's clock."],
      ["Within tolerance", "Change <b>closing</b> to 16:59 and printing to 17:01.", "There are 2 minutes of tolerance for small clock differences."],
      ["City in another time zone", "This city is 1 hour behind Brasília. Open at <b>07:01</b>, close at 16:01 and print at 16:03 (local time).", "7 a.m. local is 8 a.m. in Brasília. The test finds each city's time zone from its sections' opening times."],
      ["Queue until late", "There was a queue. Close at <b>19:10</b>, print at 19:13 and receive at 19:30.", "Closing after 5 p.m. is normal when there is a queue. The test does not flag."],
    ],
    faq: [
      ["Why doesn't closing after 5 p.m. flag?", "Because whoever is in the queue at 5 p.m. has the right to vote. Voting can end well after that in sections with queues."],
      ["How does the test know each city's time zone?", "From the 10th percentile of the city's sections' opening times: a regular opening is never before the official time, and delays do not shift that reference."],
      ["Why does reception use another clock?", "Opening, closing and printing are recorded by the machine's clock, in local time. Reception is recorded by the TSE's system, in Brasília time."],
    ],
    prova: [
      ["What is Test 11's tolerance?", "2 minutes", "30 minutes", "1 hour", "There is no tolerance", "Small clock differences are accepted."],
      ["Closing at 7 p.m. because of a queue:", "Is normal and does not flag", "Always flags", "Is informational", "Annuls the section", "Whoever arrived by 5 p.m. votes."],
      ["An opening 2 hours late:", "Is recorded only as informational", "Is a serious anomaly", "Is not recorded", "Annuls the machine", "Delays have operational causes."],
      ["In a city 1 hour behind Brasília, opening at 07:00 local time:", "Is normal", "Flags early opening", "Stays outside the test", "Is informational", "7 a.m. local equals 8 a.m. in Brasília."],
      ["A misadjusted machine clock can:", "Make the test flag with nothing wrong in the voting", "Change the votes", "Add voters", "Replace the machine", "It is an explainable cause."],
      ["Which of these orders is impossible?", "Reception by the TSE before the report is printed", "Opening before closing", "Printing after closing", "Closing after 5 p.m.", "The TSE cannot receive what does not exist yet."],
    ],
    situ: ["A section's tally sheet records that the machine opened at 07:30, half an hour before the official time.", "The tally sheet says it was received by the TSE before it was printed by the machine."],
  };

  T.T12 = {
    nome: "Machine replacement and paper ballots", curto: "Checks whether the machine used in the section is the one on the official list, whether the loaded software matches, and whether a machine was annulled or paper ballots were used.",
    prevista: "Expected machine (official list)", usada: "Machine used (tally sheet)", nr: "No.", carga_t: "Load", lista: "Official contingency list", outra_t: "Machine assigned to section 43:",
    campos: { urna: "Machine used", carga: "Load code (loaded software)", tipo: "Machine status", junta: "Paper ballot voting (counting board)", semCesp: "Official list not published for the section", va: "Votes for Candidate A", vb: "Votes for Candidate B" },
    op: { urna: { prev: "The expected machine (2045123)", cont: "Contingency machine from the list (2099001)", outra: "Machine assigned to section 43 (2045777)", desc: "Unknown machine (3011999)" },
      carga: { A7F3: "A7F3 (the expected one)", B2E8: "B2E8 (another)", "": "No code" }, tipo: { 1: "Tallied", 2: "Not tallied", 3: "Annulled and tallied separately", 4: "Annulled", 5: "Not installed" } },
    simples(s, r, f) {
      if (!r.cats.length) return ["The machine used is the one on the official list, with the expected software (load code), and it was tallied normally.", "Test 12 checks the machine, not the votes inside it. For the votes, the other tests and the printed tally sheet apply."];
      const out = [`The test found: ${r.cats.map((c) => `<b>${f.cat(c.c)}</b>`).join("; ")}.`];
      if (r.nivel === "info") out.push("<b>It stays only as informational (blue light)</b>: replacing a faulty machine with a contingency one from the official list, with the right software, and voting on paper when machines fail are provided-for procedures, recorded in the polling station minutes.");
      else out.push("Normal is for the section to use the expected machine, with the expected software, or a contingency machine from the official list with the same software.", "This proves nothing: the cause must be checked in the polling station minutes and the official machine records. An unpublished list, for example, is a missing file, not a problem with the machine.");
      return out;
    },
    ficha: (s, f) => fichaL([`Machine used: ${({ prev: "the one on the official list", cont: "the contingency one from the official list", outra: "the one assigned to another section", desc: "a machine on no list" })[s.urna]}`, `Load code: ${s.carga || "missing"} (expected: A7F3)`, `Status: ${({ 1: "tallied", 2: "not tallied", 3: "annulled and tallied separately", 4: "annulled", 5: "not installed" })[s.tipo]}${s.junta ? "; paper ballot voting" : ""}`]),
    m: [
      ["Unknown machine", "Choose the <b>unknown machine (3011999)</b>.", "A machine that appears on no official list is flagged."],
      ["Neighboring section's machine", "Choose the <b>machine assigned to section 43</b>.", "Each machine has an assigned section. Used in another, it flags."],
      ["Different software", "Change the <b>load code</b> to B2E8.", "The load code identifies the software loaded on the machine. Different from expected, it flags."],
      ["Contingency with wrong software", "Choose the <b>contingency machine</b> and code <b>B2E8</b>.", "The spare machine must also have the expected software."],
      ["No load code", "Choose <b>No code</b> for the load code.", "Without the code, the loaded software cannot be checked."],
      ["Annulled machine", "Change the status to <b>Annulled</b>.", "Annulled machines are flagged for checking."],
      ["Machine not tallied", "Change the status to <b>Not tallied</b>.", "A machine that was not tallied needs explaining."],
      ["Machine broke", "The original machine broke. Choose the <b>contingency machine from the list</b> (with load A7F3).", "Replacement by an official contingency machine is a provided-for procedure. It stays only as informational (blue light)."],
      ["Paper ballots", "The machine and the spare failed and the section voted on paper. Tick <b>Paper ballot voting</b>.", "Paper voting has operational causes recorded in the minutes. It is informational."],
      ["List not published", "Tick <b>Official list not published for the section</b>.", "Without the official list, the test has nothing to compare with and flags. The cause is the missing file, not the machine."],
      ["Replacement without a fault", "Choose the <b>contingency machine from the list</b>, as if it had been swapped without the machine breaking.", "The test does not know whether the swap was needed. Only the polling station minutes record that."],
      ["Votes changed in the right machine", "Keep the expected machine and load and move <b>20 votes</b> from B to A.", "Test 12 checks the machine, not the votes."],
    ],
    faq: [
      ["What is a contingency machine?", "A spare machine, prepared with the same software, that replaces the original when it fails. Each state's contingency machines are on an official list."],
      ["What is the load code?", "The identification of the software loaded on the machine before the election. It must match the one on the official list."],
      ["Is voting on paper irregular?", "No. When the machine and the spare fail, the section can vote on paper ballots, counted by a board. It is provided for and recorded in the minutes."],
    ],
    prova: [
      ["Replacing a faulty machine with a contingency one from the official list, with the right load:", "Is a provided-for procedure and stays informational", "Is always an anomaly", "Annuls the section", "Is not recorded", "The official replacement is provided for."],
      ["The load code identifies:", "The software loaded on the machine", "The number of voters", "The winning candidate", "The opening time", "It must match the expected one."],
      ["A machine that is on no official list:", "Is flagged", "Is normal", "Is informational", "Stays outside the test", "Machine absent from the correspondences."],
      ["Can Test 12 see votes changed inside the right machine?", "No, it checks the machine, not the votes", "Yes, always", "Only for President", "Only on paper", "For the votes, the other tests apply."],
      ["Paper ballot voting is:", "Recorded as informational", "Forbidden", "Always an anomaly", "Ignored", "It has operational causes recorded in the minutes."],
      ["If a section's official list was not published:", "The test flags for lack of comparison", "The machine is annulled", "The section is excluded from the election", "Nothing happens", "The cause is the missing file."],
    ],
    situ: ["The machine used in a section appears neither on the official list of assigned machines nor on the contingency list.", "The software loaded on a section's machine has a code different from the expected one."],
  };

  const digKv = (s, r, f) => { const v = r.v; return v.E ? [["Counts evaluated", f.n(v.N)], ["χ²", f.n(v.chi2, 1)], ["Chance by luck", f.chance(v.lp)], ["After adjustment (q)", f.sci(v.lq)]] : [["Counts ≥ 10", f.n(v.N)], ["Median", f.n(v.med, 0)]]; };
  const digSimples = (o) => (s, r, f) => {
    const v = r.v;
    if (r.nivel === "na") return [`The test does not evaluate this city: ${v.N < 50 ? `there are only ${f.n(v.N)} counts of 10 votes or more (the minimum is 50)` : `the median count is ${f.n(v.med, 0)}, below 30`}. With small counts, ${o.pq}`];
    const ref = s.ref === "modelo" ? "from the site's model (the real shape of this city's votes, simulated 50 times)" : s.ref === "benford" ? "from Benford's law" : "with all digits equal (uniform)";
    const out = [`The chart compares ${o.oque} of the ${f.n(v.N)} counts (bars) with the expected values ${ref} (ticks). The distance between the two is χ² = ${f.n(v.chi2, 1)}; the chance of a distance like that by luck is ${f.chance(v.lp)}.`];
    if (r.nivel === "anom") {
      out.push(`<b>The test flags: ${o.oque} departs from what is expected.</b>`);
      out.push(s.ref !== "modelo" && !s.inv && !s.arr ? o.semCuidado : o.legit);
    } else out.push(`<b>Within what is expected.</b> ${o.limite}`);
    return out;
  };
  const digFicha = (s, f) => fichaL([`Fictitious city with ${f.n(s.S)} sections; Candidate A gets on average ${s.forca}% of the votes`,
    `Sections with made-up numbers: ${s.inv}% · rounded: ${s.arr}%${s.soma ? ` · ${s.soma} votes added to A in ${s.somaP}% of sections` : ""}${s.transf ? ` · proportional shift in ${s.transf}%` : ""}`,
    `Reference: ${s.ref === "modelo" ? "the site's model" : s.ref === "benford" ? "Benford's law" : "uniform, no median limit"}`]);

  T.T13 = {
    nome: "Second-digit test (Mebane)", curto: "Looks at the second digit of the vote counts of every section of a city or state and compares it with what is expected for that city.",
    vis: "Frequency of the 2nd digit in Candidate A's counts", sem: "No reference: the test does not evaluate this case.", obs: "observed", esp: "expected",
    campos: { S: "Sections in the city", forca: "Candidate A's average strength (%)", inv: "Sections with made-up numbers (%)", arr: "Sections rounded to tens (%)", soma: "Votes added to A", somaP: "…in how many sections (%)", transf: "Sections with a proportional vote shift (%)", ref: "Reference" },
    op: { ref: { modelo: "The site's model (Monte Carlo)", benford: "Benford's law (without the site's care)" } },
    kv: digKv,
    simples: digSimples({ oque: "the 2nd digit", pq: "the shape of the numbers depends too much on section size and there is no reliable reference.",
      legit: "This proves nothing: deviations can come from strategic behavior, geographic concentration of votes or the model not describing the city well (Mebane, 2006).",
      semCuidado: "Note: this city's numbers were not changed. The light came on because Benford's law does not suit per-section votes, which stay in a narrow range. That is why the site uses its own model for each city.",
      limite: "Changes in few sections, or changes that keep the natural shape of the numbers, do not show in this test." }),
    ficha: digFicha,
    m: [
      ["Made-up numbers", "Make up the numbers of <b>40% of sections</b>.", "People who make up numbers tend to pick round values (like 150 or 200). That leaves the 2nd digit with too many zeros and fives."],
      ["Rounding small counts", "Here Candidate A has 2-digit counts. Round <b>35% of sections</b>.", "In 2-digit numbers, the 2nd digit is the last one. Rounding to tens leaves many zeros."],
      ["Large city", "In a 1,200-section city, make up the numbers of <b>20%</b>.", "With more sections, the test is more sensitive: a smaller share already shows."],
      ["Weak candidate", "Make up the numbers of <b>25%</b> of sections.", "The test also works for candidates with few votes, as long as the median exceeds 30."],
      ["Small city", "In a 150-section city, make up the numbers of <b>70%</b>.", "With few sections the test has little power: only large changes show."],
      ["Strong candidate", "Make up the numbers of <b>40%</b> of sections.", "With 3-digit counts, round values also affect the 2nd digit."],
      ["Wrong reference", "Change the <b>reference</b> to Benford's law, without changing any number.", "The data is clean and still the light comes on. Benford's law does not suit per-section votes. That is why the site uses a model built for each city."],
      ["Benford with a strong candidate", "Change the <b>reference</b> to Benford's law (1,200-section city).", "The more concentrated the counts, the worse Benford's law works."],
      ["Benford with a medium candidate", "Change the <b>reference</b> to Benford's law (1,200-section city).", "More sections give the test more power, including to err with the wrong reference."],
      ["Few made-up numbers", "Make up the numbers of only <b>4%</b> of sections.", "Changes in few sections get lost among hundreds of normal ones."],
      ["Adding votes everywhere", "Add <b>20 votes</b> to A in <b>100%</b> of sections.", "The model adjusts to the observed data. Adding the same value everywhere leaves no mark on the digits."],
      ["Proportional shift", "Shift votes proportionally in <b>40%</b> of sections.", "Proportional changes keep the natural shape of the numbers. The digit test does not see everything."],
    ],
    faq: [
      ["Why doesn't the site use Benford's law?", "Because Benford's law holds for numbers spread across several orders of magnitude. Per-section votes stay in a narrow range (say 80 to 200), and Benford would raise false alarms. The site simulates the real shape of each city's votes."],
      ["What is the site's model?", "A Monte Carlo simulation: 50 replicas of each section's vote, with a beta-binomial distribution fitted to the candidate's votes at each polling place (or zone). The digit distribution of those replicas is the expected one."],
      ["Why require a median of 30?", "With small, very skewed counts, not even the model gives a reliable reference. The test stays out so as not to err."],
    ],
    prova: [
      ["Test 13 looks at:", "The second digit of the vote counts", "The first digit", "The machine number", "The time", "It is Mebane's 2BL test."],
      ["Why doesn't the site use Benford as the reference?", "Per-section votes stay in a narrow range and Benford would raise false alarms", "Benford is forbidden", "Benford only applies to the President", "Because Benford is more sensitive", "The site simulates the real shape of the votes."],
      ["Making up numbers in 4% of sections:", "Usually does not show in the test", "Always flags", "Annuls the city", "Changes the reference", "Few changes get lost among the normal ones."],
      ["The test requires at least:", "50 counts and a median of 30 votes", "10 counts", "1,000 sections", "A median of 100", "Below that there is no reliable reference."],
      ["People who make up numbers tend to:", "Prefer round values", "Pick perfectly random numbers", "Use only even numbers", "Repeat the section number", "That leaves marks on the digits."],
      ["Does a deviation in Test 13 prove manipulation?", "No: it can come from strategic behavior, geographic concentration or model misfit", "Yes", "Only in the second round", "Only for Governor", "It is a prompt to investigate."],
    ],
    situ: ["In a candidate's vote counts in a state, the second digit is zero far more often than expected.", "Many per-section vote counts look like round numbers picked by hand."],
  };

  T.T14 = {
    nome: "Last-digit test (Beber-Scacco)", curto: "Looks at the last digit of the vote counts of every section and checks whether it is as balanced as expected for that city.",
    vis: "Frequency of the last digit in Candidate A's counts", sem: "No reference: the test does not evaluate this case.", obs: "observed", esp: "expected",
    campos: { S: "Sections in the city", forca: "Candidate A's average strength (%)", inv: "Sections with made-up numbers (%)", arr: "Rounded sections (%)", arrPasso: "Round to multiples of", soma: "Votes added to A", somaP: "…in how many sections (%)", transf: "Sections with a proportional vote shift (%)", ref: "Reference" },
    op: { ref: { modelo: "The site's model (Monte Carlo)", uniforme: "Uniform, no median limit (without the site's care)" }, arrPasso: { 10: "10", 5: "5" } },
    kv: digKv,
    simples: digSimples({ oque: "the last digit", pq: "the last digit is not balanced for purely arithmetic reasons.",
      legit: "This proves nothing: besides made-up numbers (Beber and Scacco, 2012), deviations can come from structural factors or the model not describing the city well.",
      semCuidado: "Note: this city's numbers were not changed. With small counts (10 to 20 votes), the last digit is not balanced for purely arithmetic reasons. Without the model and the median limit, clean data turns the light on.",
      limite: "Changes in few sections, or changes that keep the natural shape of the numbers, do not show in this test." }),
    ficha: digFicha,
    m: [
      ["Made-up endings", "Make up the numbers of <b>50% of sections</b>.", "People who make up numbers prefer endings in 0 and 5 (Beber and Scacco). The last digit is no longer balanced."],
      ["Rounding to tens", "Round <b>15% of sections</b> to multiples of 10.", "Many numbers ending in 0 show up at once."],
      ["Rounding to five", "Change “Round to multiples of” to <b>5</b> and round <b>25%</b> of sections.", "Too many endings in 0 and 5 are detected too."],
      ["Large city", "In a 1,200-section city, make up the numbers of <b>28%</b>.", "With more sections, a smaller share already shows."],
      ["Small city", "In a 150-section city, make up the numbers of <b>70%</b>.", "With few sections the test has little power."],
      ["Weak candidate", "Round <b>20%</b> of sections to multiples of 10.", "The test also applies to candidates with fewer votes, if the median exceeds 30."],
      ["Without the site's care", "Here counts are small (10 to 20 votes) and the site leaves the test out. Change the <b>reference</b> to Uniform, without changing numbers.", "With small counts, the last digit is not balanced for purely arithmetic reasons. Without the model and the median limit, clean data turns the light on."],
      ["Uniform in a large city", "Change the <b>reference</b> to Uniform (1,200-section city, small counts).", "More sections make the reference error even more visible."],
      ["Uniform with small counts", "Change the <b>reference</b> to Uniform (800-section city).", "That is why the site requires a median of 30 votes and uses the model."],
      ["Few made-up numbers", "Make up the numbers of only <b>4%</b> of sections.", "Changes in few sections get lost."],
      ["Adding votes everywhere", "Add <b>20 votes</b> to A in <b>100%</b> of sections.", "Adding the same value everywhere does not change the balance of the last digit."],
      ["Proportional shift", "Shift votes proportionally in <b>40%</b> of sections.", "Proportional changes keep the natural shape of the numbers."],
    ],
    faq: [
      ["Why should the last digit be balanced?", "In large, varied counts, each ending from 0 to 9 appears roughly the same number of times. People who make up numbers prefer some endings."],
      ["Why not compare directly with 10% for each digit?", "Because in counts concentrated in a narrow range (say 10 to 20), endings are not balanced for purely arithmetic reasons. The site uses the same model as Test 13."],
      ["Who are Beber and Scacco?", "Researchers who showed, in 2012, that numbers fabricated by people leave marks on the last digit."],
    ],
    prova: [
      ["Test 14 looks at:", "The last digit of the counts", "The second digit", "The sum of votes", "The load code", "It is Beber and Scacco's test."],
      ["People who make up numbers tend to:", "Prefer endings in 0 and 5", "Spread endings perfectly", "Use only the ending 7", "Leave no marks", "That unbalances the last digit."],
      ["With small counts (10 to 20), comparing with 10% for each ending:", "Raises false alarms", "Is the site's method", "Is always correct", "Is not possible", "Endings are not balanced for arithmetic reasons."],
      ["Rounding counts to multiples of 10:", "Leaves too many zeros and the test notices", "Changes nothing", "Only changes the second digit", "Annuls the sections", "Many 0 endings show up."],
      ["Adding 20 votes in every section:", "Does not change the balance of the last digit", "Always flags", "Zeroes the digits", "Changes the time zone", "The shift is the same everywhere."],
      ["For the test to evaluate, the median count must be at least:", "30 votes", "10 votes", "100 votes", "1 vote", "Same rule as Test 13."],
    ],
    situ: ["In a state, a candidate's vote counts end in 0 or 5 far more than expected.", "The final digit of the vote counts of many sections is not balanced."],
  };

  T.T15 = {
    nome: "Election fingerprint (Klimek)", curto: "Plots each section on a turnout × vote-share chart and looks for an abnormal cluster in the top-right corner.",
    vis: "Each dot is a fictitious section. The dashed square is the corner: turnout and vote share above 90%.", eixo_x: "turnout", eixo_y: "Candidate A's vote share",
    campos: { S: "Sections in the state", forca: "Candidate A's average strength (%)", enc: "Stuffed sections", alvo: "Level after stuffing (%)", modo: "Where", mob: "Sections with legitimate mobilization" },
    op: { modo: { espalhado: "Spread across the state", zona: "A whole zone" } },
    kv(s, r, f) { const v = r.v; return [["Sections in the corner", f.n(v.obs)], ["Expected in the corner", f.n(v.esp, 2)], ["Ratio", isFinite(v.razao) ? f.n(v.razao, 1) : v.obs ? "∞" : "—"], ["Correlation", f.n(v.corr, 3)]]; },
    simples(s, r, f) {
      const v = r.v;
      const out = [`There are <b>${f.n(v.obs)}</b> sections in the corner (turnout and A's vote share above 90%). If turnout and vote share did not move together within each zone, the expected number would be <b>${f.n(v.esp, 1)}</b>.`];
      if (r.nivel === "insp") out.push(`<b>Marked for inspection:</b> there are 10 or more sections in the corner and ${isFinite(v.razao) ? f.n(v.razao, 1) : "infinitely many"} times the expected number (the limit is 3). A cluster like this appears when ballot boxes are “stuffed” (turnout and vote share rise together).`,
        s.mob && !s.enc ? "Here the cause is legitimate: mobilizing voters in a candidate's stronghold also makes turnout and vote share rise together. That is why Klimek is only an indicator for looking at the chart, not proof." : "This proves nothing: strongholds and legitimate mobilization also make turnout and vote share rise together. Klimek is a diagnostic indicator for visual inspection.");
      else out.push(v.obs < 10 ? "With fewer than 10 sections in the corner, the indicator does not mark." : "The number of sections in the corner does not reach 3 times the expected. The indicator does not mark.",
        s.modo === "zona" && s.enc ? "Here the whole zone was changed. Since the expected number is calculated within each zone, the changed zone becomes its own pattern. This avoids false alarms between different regions, but has this limit." : "Normal is a cloud of dots with no cluster in the corner.");
      return out;
    },
    ficha: (s, f) => fichaL([`Fictitious state with ${f.n(s.S)} sections; Candidate A gets on average ${s.forca}%`, `Stuffed sections: ${s.enc}${s.enc ? ` (turnout and vote share taken to about ${s.alvo}%, ${s.modo === "zona" ? "in a whole zone" : "spread across the state"})` : ""}`, `Sections with legitimate mobilization: ${s.mob}`]),
    m: [
      ["Stuffing ballot boxes", "Set <b>30 sections</b> with stuffing.", "Each dot on the chart is a section. Stuffing creates a cluster in the top-right corner that does not appear in normal elections."],
      ["Few stuffed boxes", "Stuff only <b>14 sections</b>.", "From 10 sections in the corner, with 3 times the expected or more, the state is marked for inspection."],
      ["Large state", "In a 3,000-section state, stuff <b>25</b>.", "The expected number grows with size, but a cluster still stands out."],
      ["Lighter stuffing", "At a 92% level, stuff <b>25 sections</b>.", "Going above 90% on both axes is enough to enter the corner."],
      ["Weak candidate", "Stuff <b>20 sections</b>.", "Where the candidate is weak, almost no section reaches the corner naturally. Stuffing stands out even more."],
      ["Total stuffing", "At a 100% level, stuff <b>12 sections</b>.", "Extreme stuffing in a few sections is already enough."],
      ["Legitimate mobilization", "A local leader got voters to turn out en masse for the candidate. Set <b>25 sections</b> with legitimate mobilization.", "High turnout and high vote share together can be legitimate. That is why Klimek is only an indicator for inspection."],
      ["Candidate's hometown", "Set <b>40 sections</b> with legitimate mobilization.", "Strongholds produce the same picture legitimately."],
      ["Free transport", "Free buses took voters from loyal neighborhoods. Set <b>15 sections</b> with mobilization.", "Higher turnout where the candidate is strong is legitimate."],
      ["Fewer than 10", "Stuff <b>9 sections</b>.", "With fewer than 10 sections in the corner, the indicator does not mark."],
      ["Below 90%", "At an 88% level, stuff <b>40 sections</b>.", "The corner starts at 90%. Stuffing that does not get there is not counted."],
      ["A whole zone", "Change “Where” to <b>A whole zone</b> and turn stuffing on (1 or more).", "The expected number is calculated within each zone. If the whole zone changes, it becomes its own pattern. This avoids false alarms, but has this limit."],
    ],
    faq: [
      ["What is the election fingerprint?", "A chart where each section is a dot: turnout on one axis and the candidate's vote share on the other. Klimek and colleagues (2012) showed that ballot stuffing leaves a cluster in the top-right corner."],
      ["Why is the expected number calculated by zone?", "Because different regions have different profiles. Calculating within each zone avoids mistaking a mix of regions for a suspicious pattern (Simpson's paradox)."],
      ["What does marked for inspection mean?", "That the chart is worth a careful look. It is a diagnostic indicator, with no value as proof."],
    ],
    prova: [
      ["On the Klimek chart, each dot is:", "A section", "A candidate", "A state", "A voter", "Turnout × vote share of each section."],
      ["The corner the test looks at is:", "Turnout and vote share above 90%", "Turnout below 10%", "A 50% vote share", "Sections with 0 votes", "It is the top-right corner."],
      ["To mark for inspection, the test requires:", "10 or more sections in the corner and 3 times the expected", "1 section in the corner", "A negative correlation", "More than 1,000 sections", "Both conditions together."],
      ["Legitimate mobilization in a stronghold:", "Can produce the same picture", "Never shows on the chart", "Proves manipulation", "Annuls the sections", "That is why it is only an indicator."],
      ["If a whole zone is changed:", "It becomes its own pattern and the indicator may not mark", "The indicator always marks", "The state is annulled", "The corner moves", "The expected number is calculated within each zone."],
      ["Test 15's result is:", "An indicator for visual inspection", "Proof", "An automatic annulment", "A vote", "It is diagnostic."],
    ],
    situ: ["On a state's turnout × vote-share chart, a cluster of sections appears with almost 100% on both axes.", "Several sections have, at the same time, turnout and a candidate's vote share above 95%."],
  };

  S.EN = Object.assign({ ui, faqGeral }, T);
})();
