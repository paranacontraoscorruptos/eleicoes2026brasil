/* Anomaly simulator — English texts for tests V1–V6 (change between rounds) and L01–L14 (voting machine logs).
   The log tests are completed for both rounds; the criteria used here are simplified. */
(function () {
  "use strict";
  const S = window.SIM_TXT && window.SIM_TXT.EN;
  if (!S) return;
  const fichaL = (itens) => `<ul>${itens.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const luz = (r) => S.ui.luz[r.nivel];
  const sim = (b) => (b ? "✓" : "✗");

  Object.assign(S.ui, {
    sub: "Change made-up numbers and see, right away, how each of the 35 audit tests reacts, why it reacts and what that means.",
    final_sub: "30 questions on all 35 tests. Unlocked after 15 exams.",
    final_bloq: (f, t) => `Take at least ${t} test exams to unlock the final exam. You have taken ${f}.`,
    formula: (m, f) => `Final grade = 60% of the average of the 35 exams (${m}) + 40% of the final exam (${f}). Exams not taken count as zero.`,
  });
  Object.assign(S.ui.tl, { metodo_v: "Method (same as in the Technical Report, Addendum A)", metodo_l: "Simplified method (the full test is in the Technical Report, Appendix B)" });
  Object.assign(S.ui.niveis, { variacao: "From round 1 to round 2", log: "The machine log" });
  Object.assign(S.ui.niveis_d, {
    variacao: "Tests that compare round 1 and round 2 for President: how much each finalist gained and where the change departs from the pattern.",
    log: "Tests that read the machine log, with the time of each vote and each event. Here in the simulator the criteria are simplified; the full tests are in the Technical Report (Appendix B).",
  });
  Object.assign(S.ui.cat, {
    transferencia: "Transfer outside the expected range", comp_direcionado: "Atypical, directed turnout", comp_atipico: "Atypical turnout",
    acima_teto_A: "Candidate A gained above the ceiling", acima_teto_B: "Candidate B gained above the ceiling", aptos_mudaram: "Eligible voters changed",
    sem_bu_2t: "No tally sheet in round 2", sem_bu_1t: "No tally sheet in round 1",
    voto_tarde: "Votes after the official time", voto_tarde_fora: "Votes long after the official time, outside the pattern", rajada: "Burst of votes without fingerprint",
    tempo_curto: "Very short voting time", seq_sem_digital: "Long run without fingerprint", seq_com_falha: "Run without fingerprint with reader failure",
    voto_apos_sim: "Vote after “has everyone voted? YES”", retomada: "Voting resumed after NO", voto_desligada: "Vote while the machine was off",
    muitos_reinicios: "3 or more restarts", interrupcao: "Interruption recorded", soma_log_bu: "Machines' sum ≠ tally sheet", voto_original_apos: "Vote on the original machine after replacement",
    troca_registrada: "Machine replacement recorded", tentativas_altas: "Attempts above neighbouring sections", tentativas_seguidas: "Consecutive attempts with the same result",
    nao_concluidos: "Unfinished votes above neighbours", encerrar_antes: "Attempt to close before the official time", varias_tentativas: "More than one closing attempt",
    sem_zeresima: "No zero report", zeresima_depois: "Zero report after the first vote", zeresima_fora: "Zero report outside the election morning",
    ajuste_durante: "Clock adjusted during voting", relogio_errado: "Clock off by 15 min or more", ajuste_fora: "Clock adjusted outside voting",
    versao_diferente: "Different software version", carga_log_diferente: "Different load code", log_bu_diferentes: "Log and tally sheet with different data",
    modelo_outro: "Unexpected model", sem_digital_alto: "Releases without fingerprint above neighbours", muitas_tentativas: "Many voters with 4 or more attempts",
    log_incompleto: "Incomplete or corrupted log", log_diferente_bu: "Log votes ≠ tally-sheet turnout",
  });
  S.faqGeral.forEach((q) => {
    if (/60% of the average of the 15 exams/.test(q[1])) q[1] = "Each exam is graded from 0 to 10, and 7 passes. The final grade is 60% of the average of the 35 exams plus 40% of the final exam, which opens after 15 exams. You can retake exams: the best grade counts.";
  });
  S.faqGeral.push(
    ["What are the 35 tests?", "15 tests on the tally sheets (T01 to T15), 6 on the change from round 1 to round 2 (V1 to V6) and 14 on the machine logs (L01 to L14). The log tests are completed for both rounds (results on the Voting machine logs page). Here in the simulator, the L test criteria are simplified."],
    ["Why are the log tests simpler here?", "The 14 log tests are completed for both rounds, and the full criterion of each one is in the Technical Report (Appendix B). Here in the simulator the rules are simplified, to show the idea of each test with a few numbers. The real results are on the Voting machine logs page."],
    ["Does the machine log show who someone voted for?", "No. The log records the time of each vote and of the machine's events (switching on, releasing the voter, fingerprint, closing), but not who the vote went to nor the voter's name."],
  );

  // --- top of the home page: what the simulator has and how to stop and continue later ---
  Object.assign(S.ui, {
    t_titulo: "What the simulator has",
    t_testes: "tests to simulate", t_testes_d: "15 tally-sheet tests (T01 to T15), 6 on the change between rounds (V1 to V6) and 14 on the machine logs (L01 to L14).",
    t_missoes: "missions", t_missoes_d: "12 in each tally-sheet test and 6 in each new test. Three kinds: make it flag, false alarm and slipped through.",
    t_livre: "free simulations", t_livre_d: "In each test's free mode you change the numbers as you like or ask for a new case, with no limit.",
    t_provas: "graded exams", t_provas_d: "A 10-question exam for each test (15 minutes) and the final exam, with 30 questions on all tests (45 minutes).",
    t_banco: "questions in the exam bank", t_banco_d: "Concept and “which test is this?” questions. Case questions are created on the spot, so every exam is different.",
    t_faq: "questions and answers", t_faq_d: "Doubts answered in plain language: general ones and for each test.",
    ct_t: "Start whenever you want, stop and continue later",
    ct_l: ["Start with any test, mission, free simulation or exam. You do not need to follow the order.",
      "You can stop at any time: close the page, go to work, go to sleep. When you come back, continue where you left off.",
      "Everything is saved in this browser: completed missions, grades, the last case you changed in each test and unfinished exams.",
      "In an exam, the clock stops when you leave and only starts again when you continue.",
      "To continue, open the simulator on the same device and in the same browser.",
      "Nothing is sent to a server. In a private window, on another device or if you clear the browser data, your progress will not show."],
    ct_parou: "You stopped at", ct_quando: (d) => (d ? `(${d})` : ""), ct_btn: "Continue where I left off", ct_comecar: "Start with Test 1", ct_escolher: "Choose a test",
    ct_novo: "You have not started yet. Start with Test 1 or choose any test in the list.", ct_provas: "Unfinished exams",
    ret_t: "Unfinished exam", ret_d: (r, n, t) => `You answered ${r} of ${n} questions. Time left: ${t}.`,
    ret_nota: "The clock stopped while you were away. It starts again when you continue.",
    ret_btn: "Continue the exam", ret_nova: "Discard and start another",
    apagar_conf: "Erase all missions, grades and unfinished exams on this device?",
  });
  S.faqGeral.forEach((q) => {
    if (/^Where is my progress/.test(q[0])) q[1] = "Only in this browser, on this device: completed missions, grades, the last case you changed in each test and unfinished exams. Nothing is sent anywhere. You can erase everything in your report card.";
  });
  S.faqGeral.push(
    ["Can I stop and continue later?", "Yes. Close the page whenever you want. When you come back, on the same device and in the same browser, the simulator shows where you stopped and the “Continue where I left off” button. In an unfinished exam, the clock stays stopped while you are away."],
  );

  const T = {};
  const UN = {
    V1: { o: "the state", d: "of the state", g: "in the other states", G: "States", f: "Fictitious state", s: "state" },
    V2: { o: "the municipality", d: "of the municipality", g: "in the other municipalities of the state", G: "Municipalities", f: "Fictitious municipality", s: "municipality" },
    V3: { o: "the section", d: "of the section", g: "in the sections of the same zone", G: "Sections", f: "Fictitious section", s: "section" },
  };
  const opVar = (G) => ({ p: `Little (similar ${G.toLowerCase()})`, m: "Medium", a: `A lot (different ${G.toLowerCase()})` });
  function transfTxt(id) {
    const u = UN[id];
    return {
      vis: `Candidate A's share of the two finalists' votes (${u.s} and comparison group)`,
      vl: [`A in round 1 (${u.s})`, "A in round 1 (group)", "A in round 2 (group)", "A expected in round 2", "A observed in round 2"],
      campos: { n: "Votes for the two finalists", a1: "% for A in round 1", a2: "% for A in round 2", g1: "% for A in the group, round 1", g2: "% for A in the group, round 2", var: `How much the group's ${u.G.toLowerCase()} vary` },
      op: { var: opVar(u.G) },
      simples(s, r, f) {
        const v = r.v;
        if (r.nivel === "na") return [`Outside the test: ${u.o} has ${f.n(v.n)} votes for the two finalists, below the minimum of 30 in each round.`];
        const out = [`In round 1, Candidate A had ${s.a1}% of the two finalists' votes ${u.d}. ${u.g[0].toUpperCase() + u.g.slice(1)}, A went from ${s.g1}% to ${s.g2}%. With the same change, the expected share in round 2 was <b>${f.pct(v.pe)}</b>; the observed share was <b>${f.pct(v.po)}</b> (${f.n(v.dif, 1)} points).`];
        if (r.nivel === "anom") out.push("<b>The test flags it: the difference exceeds 10 points and is very rare by chance.</b> This proves nothing: alliances, support from leaders and tactical voting change the vote legitimately.");
        else if (r.nivel === "info") out.push("A difference of 5 to 10 points, rare by chance: recorded as <b>informative</b>.");
        else if (Math.abs(v.dif) >= 5) out.push(`<b>Within the expected range.</b> The difference looks large, but it is not rare for the size ${u.d} and for how much the group varies.`);
        else out.push("<b>Within the expected range.</b> The change follows the group's.");
        return out;
      },
      ficha: (s, f) => fichaL([`${u.f} with ${f.n(s.n)} votes for the two finalists`, `Candidate A: ${s.a1}% in round 1 and ${s.a2}% in round 2`, `Comparison group: A went from ${s.g1}% to ${s.g2}%`, `The group varies: ${opVar(u.G)[s.var].toLowerCase()}`]),
      kv: (s, r, f) => (r.v.pe == null ? [["Votes", f.n(r.v.n)]] : [["Expected in round 2", f.pct(r.v.pe)], ["Observed", f.pct(r.v.po)], ["Difference", `${f.n(r.v.dif, 1)} p.p.`], ["Chance after adjustment (q)", f.sci(r.v.lq)]]),
      tec: (s, r, f) => {
        const v = r.v;
        if (r.nivel === "na") return [["Minimum not reached", `n = ${f.n(v.n)} < 30`]];
        return [["Group shift", `Δ = logit(${s.g2}%) − logit(${s.g1}%) = ${f.n(v.d, 3)}`], ["Expected", `p̂ = expit(logit((${f.n(v.x1)} + 0.5)/(${f.n(v.n)} + 1)) + Δ) = ${f.pct(v.pe, 2)}`],
          ["Observed", `${f.n(v.x2)} / ${f.n(v.n)} = ${f.pct(v.po, 2)} · difference ${f.n(v.dif, 1)} p.p.`], ["z-score", `z₀ = ${f.n(v.z0, 2)} · φ = median(z₀²)/0.4549 = ${f.n(v.phi, 2)} · z = z₀/√φ = ${f.n(v.z, 2)}`],
          ["Probability", `p = 2·P(Z > |z|) = ${f.sci(v.lp)}`], ["Benjamini–Hochberg adjustment", `q = min(1, p × ${f.n(v.M)}) = ${f.sci(v.lq)}`],
          ["Decision", `q < 0.01 ${sim(v.sig)} · |dif| ≥ 10 p.p. → anomaly; ≥ 5 p.p. → informative → ${luz(r)}`]];
      },
    };
  }
  T.V1 = Object.assign(transfTxt("V1"), {
    nome: "Atypical transfer in the state", curto: "Compares each state's change in the vote, from round 1 to round 2, with the change in the other states.",
    m: [
      ["Swing in the state", "Change A's share in round 2 to <b>62%</b>.", "The expected value was about 50%. More than 10 points above it, in a whole state, is very rare: statistical anomaly."],
      ["Sharp drop", "Change A's share in round 2 to <b>36%</b>.", "It works both ways: gaining or losing far beyond the expected value is flagged."],
      ["Regional alliance", "The very popular governor backed A in round 2. Change A to <b>63%</b>.", "The test flags it, but the cause is legitimate. A statistical anomaly is something to check, not proof."],
      ["Similar states", "Here the states vary little among themselves. Change A to <b>56%</b>.", "With a homogeneous group, 6 points is already rare: informative."],
      ["The whole country changed", "Change the group in round 2 to <b>58%</b> and A in round 2 to <b>59%</b>.", "If everyone changes together, the expected value changes too. The test only looks for units that depart from the group."],
      ["Very variable group", "Here the states vary a lot. Change A to <b>56%</b>.", "With a very variable group, 6 points is not rare: within the expected range."],
    ],
    faq: [
      ["Why compare with the other states?", "Because the whole country changes from round 1 to round 2. The test applies that general change to the state and checks whether it ended up far from the expected value."],
      ["Why only Lula and Flávio Bolsonaro?", "Because they are the two finalists: only they are in both rounds. The test uses each one's share of the two finalists' votes."],
    ],
    prova: [
      ["V1 compares each state with:", "The other states", "The state's municipalities", "The 2022 round 1", "Opinion polls", "The change in the rest of the country gives the expected value."],
      ["To be flagged as an anomaly, the difference must be:", "10 points or more and rare by chance (q < 0.01)", "1 point or more", "Any difference", "50 points", "Both criteria apply together."],
      ["If every state shifts 8 points the same way:", "The expected value shifts too and the test does not flag", "All are flagged", "The test is cancelled", "Only the largest state is flagged", "The test looks for units that depart from the group."],
      ["A difference of 5 to 10 points, rare by chance, is recorded as:", "Informative", "Anomaly", "Outside the test", "Data error", "That is the informative range."],
      ["A legitimate regional alliance can:", "Make the test flag with nothing wrong", "Prevent the test", "Change round 1", "Erase the difference", "The test shows the deviation, not the cause."],
      ["The dispersion factor (φ) is used to:", "Account for how much the group's units naturally vary", "Round votes", "Choose the state", "Count sections", "More variable groups require larger differences."],
    ],
    situ: ["In one state, Lula's share of the finalists' votes rose 14 points from round 1 to round 2, while in the rest of the country it rose 2.", "A state's round-2 result ended up far from what the change in the other states pointed to."],
  });
  T.V2 = Object.assign(transfTxt("V2"), {
    nome: "Atypical transfer in the municipality", curto: "Compares each municipality's change in the vote, from round 1 to round 2, with the other municipalities of the state.",
    m: [
      ["Swing in the municipality", "Change A's share in round 2 to <b>64%</b>.", "More than 10 points above the expected value and rare by chance: statistical anomaly."],
      ["Drop in the municipality", "Change A's share in round 2 to <b>37%</b>.", "Losing far beyond the expected value is also flagged."],
      ["Mayor's support", "The very popular mayor campaigned for A in round 2. Change A to <b>65%</b>.", "Legitimate cause, same signal. Only checking shows the cause."],
      ["Similar municipalities", "This state's municipalities vary little. Change A to <b>57%</b>.", "With a homogeneous group, 7 points is informative."],
      ["The whole state changed", "Change the group in round 2 to <b>60%</b> and A in round 2 to <b>61%</b>.", "The municipality followed the state: nothing outside the pattern."],
      ["Small change", "Change A in round 2 to <b>53%</b>.", "3 points above the expected value is within the pattern."],
    ],
    faq: [
      ["Who is the municipality compared with?", "With the other municipalities of the same state. Their combined change gives the expected value for the municipality."],
      ["Can small municipalities be flagged?", "Only if they have 30 or more votes for the finalists in each round. In small municipalities the difference must be larger to be rare."],
    ],
    prova: [
      ["V2 compares the municipality with:", "The other municipalities of the same state", "Every municipality in the country", "The municipality's sections", "The neighbouring municipality", "The group is the state."],
      ["What happens if the whole state shifts 10 points?", "The municipality's expected value shifts too", "Every municipality is flagged", "The test stops", "The municipality is excluded", "The test looks for departures from the group."],
      ["A popular mayor backing a finalist:", "Can make the test flag for a legitimate reason", "Is fraud", "Does not change votes", "Voids the election", "An anomaly is not proof."],
      ["Minimum votes for the finalists per round?", "30", "1,000", "10", "No minimum", "Below that, chance dominates."],
      ["A difference of 3 points from the expected value:", "Is within the expected range", "Is an anomaly", "Is informative", "Is outside the test", "The minimum is 5 points."],
      ["The Benjamini–Hochberg adjustment is used to:", "Control false alarms when testing thousands of municipalities", "Add votes", "Choose the finalists", "Compute turnout", "Many tests produce rarities by chance."],
    ],
    situ: ["In one municipality, Flávio Bolsonaro gained 15 points more than the change in the state's other municipalities pointed to.", "A municipality's change in the vote from round 1 to round 2 was very different from the other municipalities of the state."],
  });
  T.V3 = Object.assign(transfTxt("V3"), {
    nome: "Atypical transfer in the section", curto: "Compares each section's change in the vote, from round 1 to round 2, with that of neighbouring sections.",
    m: [
      ["Swing in the section", "Change A's share in round 2 to <b>82%</b>.", "A section of 220 votes 32 points above the expected value is very rare: statistical anomaly."],
      ["Drop in the section", "Change A's share in round 2 to <b>18%</b>.", "It is also flagged when A's share falls far below the expected value."],
      ["Local support", "A neighbourhood community leader backed A in round 2. Change A to <b>80%</b>.", "A legitimate, local cause. The test flags it; only checking explains it."],
      ["Transferred voters", "In round 2 the section received voters from another section with a different profile. Change A to <b>20%</b>.", "Changes in the group of voters also change the section's result."],
      ["Small section", "Change A in round 2 to <b>63%</b> (13 points above).", "In 220 votes, 13 points can still come from chance: within the expected range."],
      ["Very small", "Change the finalists' votes to <b>25</b> and A in round 2 to <b>90%</b>.", "With fewer than 30 votes, the section is outside the test."],
    ],
    faq: [
      ["Why does a section need larger differences?", "Because it has few votes: in 200 votes, chance alone moves a candidate's share by several points. The test takes this into account."],
      ["Which sections is it compared with?", "With those of the same zone and municipality. When there are few, it uses the municipality, the zone or the state."],
    ],
    prova: [
      ["V3 compares the section with:", "The sections of the same zone and municipality", "Sections in another state", "The national result", "Polls", "When there are few, the group is widened."],
      ["A 220-vote section 13 points above the expected value:", "May be within the expected range", "Is always an anomaly", "Is outside the test", "Is informative", "Small sections vary more by chance."],
      ["A section with 25 votes for the finalists:", "Is outside the test", "Is always flagged", "Is informative", "Is excluded from the election", "The minimum is 30 in each round."],
      ["Voters transferred to the section between rounds can:", "Change the result with nothing wrong", "Void the section", "Zero the votes", "Have no effect", "The voters' profile changes."],
      ["The test also needs the section to have:", "A tally sheet in both rounds", "Biometrics", "More than 500 voters", "A new machine", "Otherwise there is nothing to compare."],
      ["A V3 signal shows:", "Where to check the tally sheet and the minutes", "Proven fraud", "A TSE error", "A voided vote", "An anomaly is a point to check."],
    ],
    situ: ["In one section, Lula's share of the finalists' votes went from 45% in round 1 to 80% in round 2, while neighbouring sections changed 3 points.", "A section's round-2 result ended up far from what the change in neighbouring sections pointed to."],
  });

  T.V4 = {
    nome: "Atypical change in turnout", curto: "Looks for sections where turnout rose or fell far beyond the expected value and whether the change went to a single finalist.",
    vis: "Turnout of the section and of the group (round 1 and round 2)",
    vl: ["Section in round 1", "Group in round 1", "Group in round 2", "Expected in round 2", "Section in round 2"],
    campos: { ap: "Eligible voters", c1: "Turnout in round 1", c2: "Turnout in round 2", g1: "Group turnout, round 1 (%)", g2: "Group turnout, round 2 (%)",
      sa: "A's share in the section (%)", dirA: "Share of the change that went to A (%)", var: "How much the group's sections vary" },
    op: { var: opVar("Sections") },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return ["Outside the test: the section has fewer than 20 eligible voters."];
      const out = [`Turnout went from ${f.pct(v.c1 / v.ap)} to <b>${f.pct(v.po)}</b>. From the group, the expected value was <b>${f.pct(v.pe)}</b> (${f.n(v.dif, 1)} points).`];
      out.push(v.dir ? `The change was directed: ${s.dirA}% of it went to ${v.destino}, well above that finalist's share in the section.` : "The change was split between the finalists much like the section's vote.");
      if (r.nivel === "anom") out.push("<b>The test flags it:</b> a large change, rare by chance and to one side. Voter transport, legitimate mobilisation and a change of polling place explain many cases.");
      else if (r.nivel === "info") out.push("Recorded as <b>informative</b>: the change is large, but did not go to a single finalist (or was between 5 and 10 points).");
      else out.push("<b>Within the expected range.</b>");
      return out;
    },
    ficha: (s, f) => fichaL([`Fictitious section with ${s.ap} eligible voters`, `Turnout: ${s.c1} in round 1 and ${s.c2} in round 2`, `Group: from ${s.g1}% to ${s.g2}%`, `${s.dirA}% of the change went to A (A has ${s.sa}% in the section)`]),
    kv: (s, r, f) => (r.v.pe == null ? [] : [["Expected", f.pct(r.v.pe)], ["Observed", f.pct(r.v.po)], ["Difference", `${f.n(r.v.dif, 1)} p.p.`], ["Directed", r.v.dir ? `yes (${r.v.destino})` : "no"]]),
    tec: (s, r, f) => {
      const v = r.v;
      if (r.nivel === "na") return [["Minimum not reached", `eligible = ${v.ap} < 20`]];
      return [["Expected", `p̂ = expit(logit((${v.c1} + 0.5)/(${v.ap} + 1)) + [logit(${s.g2}%) − logit(${s.g1}%)]) = ${f.pct(v.pe, 2)}`], ["Observed", `${v.c2} / ${v.ap} = ${f.pct(v.po, 2)} · ${f.n(v.dif, 1)} p.p.`],
        ["z-score", `z₀ = ${f.n(v.z0, 2)} · φ = ${f.n(v.phi, 2)} · z = ${f.n(v.z, 2)} · p = ${f.sci(v.lp)}`], ["Benjamini–Hochberg", `q = min(1, p × ${f.n(v.M)}) = ${f.sci(v.lq)}`],
        ["Direction", `excess = ΔX/ΔC − (X₁+X₂)/(C₁+C₂) = ${f.n(v.exc, 2)}; |ΔC| = ${Math.abs(v.dC)} ≥ 20 and excess ≥ 0.30 → ${v.dir ? "directed" : "not directed"}`],
        ["Decision", `q < 0.01 ${sim(v.sig)} · |dif| ≥ 10 p.p. and directed → anomaly; ≥ 5 p.p. → informative → ${luz(r)}`]];
    },
    m: [
      ["Turnout soared", "Change round-2 turnout to <b>290</b> and the share of the change that went to A to <b>95%</b>.", "It rose far beyond the expected value and almost all of it went to A: statistical anomaly."],
      ["Turnout collapsed", "Change round-2 turnout to <b>190</b> and A's share of the change to <b>95%</b>.", "The drop came almost entirely from A's voters: a large, directed change."],
      ["Voter transport", "A free bus took voters from a neighbourhood that votes for A. Turnout <b>288</b>, <b>100%</b> of the change to A.", "Legitimate mobilisation is also flagged. Only checking shows the cause."],
      ["Holiday is over", "Many people came back from travel for round 2. Change turnout to <b>285</b>, keeping the split even.", "A large change, but split between the finalists: informative."],
      ["The whole city voted", "Change the group in round 2 to <b>93%</b>, turnout to <b>282</b> and 100% of the change to A.", "The group rose too: the expected value rises and the test does not flag."],
      ["Small change", "Change turnout to <b>249</b> and 100% of the change to A.", "Only 9 more votes: too small for the test."],
    ],
    faq: [
      ["What is a directed change?", "When the share of the turnout change that went to one finalist exceeds that finalist's share in the section by 30 points. E.g. A has 50% in the section but took 90% of the extra voters."],
      ["Is higher turnout bad?", "No. More people voting is good. The test only looks for changes outside the pattern of neighbouring sections, for checking."],
    ],
    prova: [
      ["For V4 to flag an anomaly, the change must be:", "Large, rare by chance and directed to one finalist", "Any increase", "Only a drop", "1 vote", "All three criteria together."],
      ["Much higher turnout, split evenly between the finalists:", "Is informative", "Is an anomaly", "Is outside the test", "Voids the section", "Direction is missing."],
      ["If turnout rises across the whole city:", "The expected value rises and the section is not flagged", "All are flagged", "The test stops", "It becomes an anomaly", "The test compares with the group."],
      ["Minimum eligible voters for V4:", "20 in each round", "500", "1", "100,000", "Below that, it is outside the test."],
      ["Free transport of voters from a neighbourhood:", "Can make the test flag for a legitimate reason", "Is always fraud", "Does not change turnout", "Changes round 1", "An anomaly is not proof."],
      ["The minimum change in votes for it to count as directed:", "20 votes", "1 vote", "500 votes", "No minimum", "Small changes do not count."],
    ],
    situ: ["In one section, turnout rose from 70% to 95% from round 1 to round 2, and almost all the new votes went to the same finalist.", "A section's turnout fell much more than in neighbouring sections between rounds."],
  };

  T.V5 = {
    nome: "Gain above the ceiling of available votes", curto: "Looks for sections where a finalist gained more votes than were available without taking votes from the other.",
    vis: "Each finalist's gain × available votes (ceiling)", vl: ["Available votes (ceiling)", "A's gain", "B's gain"],
    campos: { L1: "A in round 1", F1: "B in round 1", O1: "Other candidates in round 1", BN1: "Blank and null in round 1", c2: "Turnout in round 2", L2: "A in round 2", F2: "B in round 2" },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return ["A's and B's votes in round 2 exceed turnout: fix the numbers."];
      const out = [`Ceiling = other candidates (${s.O1}) + blank and null (${s.BN1}) + increase in turnout (${Math.max(0, s.c2 - v.c1)}) = <b>${v.teto}</b>. A gained ${f.n(v.gA)} and B gained ${f.n(v.gB)}.`];
      if (r.nivel === "info") out.push(`<b>Informative:</b> ${v.kA ? "A" : "B"} gained ${f.n(v.kA ? v.exA : v.exB)} votes above the ceiling. Some of the other finalist's voters switched. Switching votes is legitimate: the record only shows where the switch was large.`);
      else out.push("No gain exceeds the ceiling by 20 votes and 10% of the other finalist's votes: within the expected range.");
      return out;
    },
    ficha: (s, f) => fichaL([`Round 1: A ${s.L1}, B ${s.F1}, others ${s.O1}, blank and null ${s.BN1}`, `Round 2: turnout ${s.c2}, A ${s.L2}, B ${s.F2}`]),
    kv: (s, r, f) => [["Ceiling", f.n(r.v.teto)], ["A's gain", f.n(r.v.gA)], ["B's gain", f.n(r.v.gB)], ["Excess", f.n(Math.max(r.v.exA, r.v.exB))]],
    tec: (s, r, f) => { const v = r.v; return [["Ceiling", `O₁ + BN₁ + max(C₂ − C₁, 0) = ${s.O1} + ${s.BN1} + ${Math.max(0, s.c2 - v.c1)} = ${v.teto}`], ["A's excess", `(${s.L2} − ${s.L1}) − ${v.teto} = ${v.exA}; ≥ 20 and ≥ 10% × ${s.F1} → ${sim(v.kA)}`],
      ["B's excess", `(${s.F2} − ${s.F1}) − ${v.teto} = ${v.exB}; ≥ 20 and ≥ 10% × ${s.L1} → ${sim(v.kB)}`], ["Decision", `always informative → ${luz(r)}`]]; },
    m: [
      ["A passed the ceiling", "Change A in round 2 to <b>175</b> and B to <b>62</b>.", "A gained 75 votes, but only 40 were available: B's voters switched to A. Informative."],
      ["B passed the ceiling", "Change B in round 2 to <b>170</b> and A to <b>67</b>.", "It applies to both finalists."],
      ["Decisive debate", "After a debate, B's voters switched to A. A <b>165</b>, B <b>72</b>.", "Switching votes is legitimate. The test only records it, as informative."],
      ["More voters and a switch", "Turnout rose to <b>260</b>; B went to <b>182</b> and A to <b>68</b>.", "Even with a higher ceiling, B gained beyond it."],
      ["Small excess", "Change A to <b>155</b> and B to <b>85</b>.", "A passed the ceiling by 15 votes: below the minimum of 20, within the expected range."],
      ["Higher ceiling", "Change turnout to <b>300</b>, A to <b>185</b> and B to <b>108</b>.", "50 extra voters raise the ceiling: A's gain fits under it."],
    ],
    faq: [
      ["Why is V5 always informative?", "Because exceeding the ceiling only shows that voters switched from one finalist to the other. That is legitimate; the record shows where the switch was large."],
      ["What goes into the ceiling?", "Votes for the other candidates and blank and null votes in round 1, plus the increase in turnout. These are the votes a finalist can gain without taking them from the other."],
    ],
    prova: [
      ["The V5 ceiling is:", "Other candidates + blank and null in round 1 + increase in turnout", "Total voters", "B's votes", "Round-1 turnout", "These are the available votes."],
      ["A gain above the ceiling shows that:", "Voters switched from one finalist to the other", "There was fraud", "The machine failed", "The tally sheet is wrong", "It is a legitimate switch."],
      ["V5 flags as:", "Always informative", "Always an anomaly", "An anomaly above 100 votes", "Outside the test", "Switching votes is legitimate."],
      ["The minimum excess to record is:", "20 votes and 10% of the other finalist's round-1 votes", "1 vote", "50%", "500 votes", "Both minimums apply together."],
      ["If turnout rises by 50 votes:", "The ceiling rises by 50 votes", "The ceiling falls", "Nothing changes", "The test stops", "New voters are available votes."],
      ["An excess of 15 votes above the ceiling:", "Is within the expected range", "Is an anomaly", "Is informative", "Voids the section", "Below the minimum of 20."],
    ],
    situ: ["In one section, a finalist gained from round 1 to round 2 more votes than the sum of the other candidates' votes, blank and null votes and new voters.", "The data show that one finalist's voters switched to the other in a section."],
  };

  T.V6 = {
    nome: "Voter roll changed between rounds", curto: "Looks for sections where the number of eligible voters changed a lot between rounds or that have a tally sheet in only one round.",
    vis: "Eligible voters in round 1 and round 2",
    campos: { ap1: "Eligible in round 1", ap2: "Eligible in round 2", bu1: "Has a tally sheet in round 1", bu2: "Has a tally sheet in round 2" },
    simples(s, r, f) {
      if (r.nivel === "na") return ["The section has no tally sheet in either round."];
      if (r.cats.length && r.cats[0].c !== "aptos_mudaram") return [`<b>Informative:</b> the section has a tally sheet only in round ${s.bu1 ? "1" : "2"}.`, "This happens with sections created, merged or closed between rounds and with special sections."];
      const out = [`Eligible voters went from ${s.ap1} to ${s.ap2} (${s.ap2 - s.ap1 >= 0 ? "+" : ""}${s.ap2 - s.ap1}, ${f.pct(r.v.rel)}).`];
      out.push(r.nivel === "info" ? "<b>Informative:</b> a change of 20 voters or more and of 10% or more. In-transit voting, special sections and Electoral Court decisions change the roll." : "Within the expected range: small changes in the roll are normal.");
      return out;
    },
    ficha: (s, f) => fichaL([`Eligible: ${s.ap1} in round 1 and ${s.ap2} in round 2`, `Tally sheet in round 1: ${s.bu1 ? "yes" : "no"} · in round 2: ${s.bu2 ? "yes" : "no"}`]),
    kv: (s, r, f) => [["Eligible round 1", f.n(s.ap1)], ["Eligible round 2", f.n(s.ap2)], ["Change", `${s.ap2 - s.ap1} (${f.pct(r.v.rel)})`]],
    tec: (s, r, f) => [["Change", `|${s.ap2} − ${s.ap1}| = ${Math.abs(s.ap2 - s.ap1)}; ≥ 20 and ≥ 10% × ${s.ap1} → ${sim(r.cats.some((c) => c.c === "aptos_mudaram"))}`], ["Tally sheets", `round 1 ${sim(s.bu1)} · round 2 ${sim(s.bu2)}`], ["Decision", `always informative → ${luz(r)}`]],
    m: [
      ["More voters", "Change round-2 eligible voters to <b>345</b>.", "45 more voters (15%): informative."],
      ["No tally sheet in round 2", "Untick <b>Has a tally sheet in round 2</b>.", "A section with a tally sheet in only one round is recorded as informative."],
      ["Special section", "The section received pre-trial detainees who vote in round 2. Change eligible voters to <b>380</b>.", "Special sections change the roll legitimately."],
      ["In-transit voting", "Some voters requested in-transit voting for round 2. Change eligible voters to <b>250</b>.", "Drops are recorded too."],
      ["Small change", "Change round-2 eligible voters to <b>318</b>.", "18 more voters: below the minimum of 20."],
      ["Large section", "In a section of 600 voters, change round-2 eligible voters to <b>650</b>.", "50 voters is only 8%: below 10%, within the expected range."],
    ],
    faq: [
      ["Can the roll change between rounds?", "Yes, through in-transit voting, special sections (pre-trial detainees, hospitals) and Electoral Court decisions. That is why V6 is only informative."],
      ["Why record a section with a tally sheet in only one round?", "Because it cannot be compared in the other change tests. The record helps to check the reason."],
    ],
    prova: [
      ["V6 is:", "Always informative", "Always an anomaly", "An anomaly above 100 voters", "A timing test", "Roll changes have legitimate causes."],
      ["V6 records changes of:", "20 voters or more and 10% or more", "1 voter", "50%", "Any size", "Both minimums apply together."],
      ["A section with a tally sheet only in round 1:", "Is recorded as informative", "Is voided", "Is ignored", "Is an anomaly", "The rounds cannot be compared."],
      ["Which of these changes the roll between rounds?", "In-transit voting", "Biometrics", "Opening time", "Load code", "It is a legitimate cause."],
      ["In a section of 600 voters, 50 more:", "Is within the expected range (8%)", "Is informative", "Is an anomaly", "Is outside the test", "Below 10%."],
      ["What is V6 for?", "To show where the roll changed and explain changes in other tests", "Count votes", "Find fraud", "Measure biometrics", "It is a context record."],
    ],
    situ: ["A section had 300 eligible voters in round 1 and 360 in round 2.", "A section has a tally sheet only in round 1."],
  };

  // ============================== L01 to L14 (preliminary criteria) ==============================
  const regKv = (r, f, fm) => [["This section", fm(r.v.regua.alvo)], ["Regional median", fm(r.v.med)], ["Robust z-score", f.n(r.v.z, 1)]];
  const regTec = (r, f, fm, regra) => [["Region", `40 fictitious sections of the municipality and neighbours · median ${fm(r.v.med)}`], ["Robust z-score", `z = 0.6745 · (x − median) / MAD = ${f.n(r.v.z, 2)}`], ["Rule (simplified)", regra], ["Decision", luz(r)]];
  const mn = (f) => (x) => `${f.n(x, 0)} min`, sg = (f) => (x) => `${f.n(x, 0)} s`, pc = (f) => (x) => `${f.n(x, 1)}%`;

  T.L01 = {
    nome: "Votes after the official closing time", curto: "Counts the votes recorded in the log after the official time and compares the delay with neighbouring sections.",
    vis: "Minutes after 5 pm when each section received its last vote (dots: region; diamond: this section)",
    campos: { ult: "Time of the last vote (local time)", napos: "Votes after 5 pm", cidade: "In the city" },
    op: { cidade: { pouca: "Short lines: neighbours closed soon", muita: "Long lines: many neighbours closed late" } },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "ok") return ["No votes after the official time (5 pm, local time): nothing to record."];
      const out = [`The last vote was at <b>${f.hora(s.ult)}</b>, ${f.n(v.at, 0)} minutes after 5 pm, with ${s.napos} votes after the official time. In neighbouring sections, the median was ${f.n(v.med, 0)} minutes.`];
      out.push(r.nivel === "anom" ? "<b>The test flags it:</b> votes long after the official time and outside the neighbours' pattern. Long lines, late opening and machine replacement explain cases; the minutes record the queue tickets."
        : "<b>Informative:</b> people in line at 5 pm may vote. The log does not show whether there was a line.");
      return out;
    },
    ficha: (s, f) => fichaL([`Last vote at ${f.hora(s.ult)} (local time); ${s.napos} votes after 5 pm`, s.cidade === "muita" ? "In the city, many sections closed late" : "In the city, sections closed shortly after 5 pm"]),
    kv: (s, r, f) => regKv(r, f, mn(f)),
    tec: (s, r, f) => regTec(r, f, mn(f), "votes after 5 pm → informative; z ≥ 3.5 and delay ≥ 60 min → anomaly"),
    m: [
      ["Into the night", "Change the last vote to <b>20:10</b> and the votes after 5 pm to <b>80</b>.", "More than 3 hours later, with neighbours closing soon: statistical anomaly."],
      ["Two hours later", "Change only the last vote to <b>19:00</b>.", "Far beyond the neighbours: flagged."],
      ["A real line", "The machine opened late and the line was long. Last vote at <b>18:30</b>, <b>45</b> votes after.", "Legitimate cause, same signal. Only the minutes confirm the tickets."],
      ["Normal line", "Last vote at <b>17:20</b>, with <b>12</b> votes after 5 pm.", "Voting after the official time with a line is allowed: informative."],
      ["Whole city in line", "Choose <b>Long lines</b>, last vote at <b>18:40</b> and <b>60</b> votes after.", "If the neighbours also closed late, the section does not depart from the pattern: only informative."],
      ["Someone not in line", "Last vote at <b>17:25</b>, with <b>10</b> votes after.", "The log does not show whether the person was already in line: the test cannot see it."],
    ],
    faq: [["Is voting after 5 pm allowed?", "Yes, for people already in line at 5 pm. The polling station hands out tickets. That is why votes after the official time are usually only informative."],
      ["Which time applies in round 2?", "In 2026, round-2 closing was extended to 7 pm Brasília time. The test uses each round's official time, converted to local time."]],
    prova: [
      ["Votes after the official time, with a line:", "Are informative", "Are always an anomaly", "Are voided", "Are outside the test", "People in line may vote."],
      ["L01 flags an anomaly when:", "The machine receives votes long after the official time, outside the neighbours' pattern", "There is 1 vote after 5 pm", "The machine opens at 8 am", "There is biometrics", "It needs both the delay and the contrast with the region."],
      ["Does the log show whether the person was in line?", "No", "Yes", "Only in round 2", "Only with biometrics", "The minutes record the tickets."],
      ["If the whole city closed late:", "The section does not depart from the pattern and is not an anomaly", "All become anomalies", "The test stops", "The votes are voided", "The test compares with neighbours."],
      ["L01 uses the time:", "Local to the municipality, converted from the official time", "Always Brasília time", "From the poll worker's phone", "From the TSE", "Each municipality has its time zone."],
      ["Which of these explains very late votes?", "Late opening and a long line", "Good biometrics", "A new machine", "Zero report", "It is a legitimate cause."],
    ],
    situ: ["A machine's log shows votes being recorded until 8 pm, while neighbouring machines closed around 5:10 pm.", "A section had 40 votes recorded after the official closing time."],
  };
  T.L02 = {
    nome: "Time per vote (fast votes and bursts)", curto: "Measures the time between one vote and the next and looks for bursts of votes without fingerprint.",
    vis: "Median time between votes (dots: region; diamond: this section)",
    campos: { raj: "Longest burst (consecutive votes 30 s or less apart)", semdig: "The burst was released without fingerprint", med: "Median time between votes (seconds)" },
    simples(s, r, f) {
      const out = [`The longest burst has <b>${s.raj}</b> consecutive votes 30 seconds or less apart${s.raj ? (s.semdig ? ", released without fingerprint" : ", with fingerprint") : ""}. The median time between votes is ${s.med} s (region: ${f.n(r.v.med, 0)} s).`];
      if (r.cats.some((c) => c.c === "rajada")) out.push("<b>The test flags it:</b> 5 or more consecutive votes 30 s or less apart, without fingerprint. A faulty fingerprint reader and fast voters explain cases; the log does not show who was in the booth.");
      else if (r.nivel === "info") out.push("<b>Informative:</b> the median time is far below the region. A short ballot and fast voters shorten the time.");
      else out.push("Within the expected range.");
      return out;
    },
    ficha: (s, f) => fichaL([`Longest burst: ${s.raj} consecutive votes 30 s or less apart${s.semdig ? ", without fingerprint" : ", with fingerprint"}`, `Median time between votes: ${s.med} s`]),
    kv: (s, r, f) => [["Longest burst", `${s.raj}`], ["Without fingerprint", s.semdig ? "yes" : "no"]].concat(regKv(r, f, sg(f))),
    tec: (s, r, f) => [["Burst", `${s.raj} ≥ 5 and without fingerprint → ${sim(s.raj >= 5 && s.semdig)} (anomaly)`]].concat(regTec(r, f, sg(f), "z ≤ −3.5 on the median time → informative")),
    m: [
      ["Short burst", "Change the longest burst to <b>6</b> and tick <b>without fingerprint</b>.", "6 votes in a fast sequence, without fingerprint: statistical anomaly."],
      ["Long burst", "Change the longest burst to <b>15</b>, without fingerprint.", "The longer the burst without fingerprint, the rarer."],
      ["Broken reader", "The fingerprint reader broke and 5 fast voters voted in a row. Burst <b>5</b>, without fingerprint.", "Legitimate cause, same signal. The minutes record the reader failure."],
      ["Fast voters", "A section of young voters: change the median time to <b>35 s</b>.", "Far below the region: informative."],
      ["Almost a burst", "Change the burst to <b>4</b>, without fingerprint.", "Below 5 votes, the test does not flag."],
      ["Fast with fingerprint", "Change the burst to <b>10</b>, <b>with fingerprint</b>.", "Fast votes with each voter's fingerprint are not flagged."],
    ],
    faq: [["Why 30 seconds?", "It is less than the normal time to vote for every office. Consecutive votes that fast, without fingerprint, deserve checking."],
      ["Does the test see who voted?", "No. The log shows the time of each vote and whether there was a fingerprint, not who was in the booth nor who they voted for."]],
    prova: [
      ["L02 flags an anomaly when there are:", "5 or more consecutive votes 30 s or less apart, without fingerprint", "1 fast vote", "Votes with fingerprint", "A line", "A burst without fingerprint."],
      ["A burst of fast votes with fingerprint:", "Is not flagged", "Is an anomaly", "Is informative", "Voids the machine", "Each voter identified themselves."],
      ["A median time far below the region is:", "Informative", "An anomaly", "Outside the test", "An error", "It can have a legitimate cause."],
      ["What can explain a burst without fingerprint?", "A faulty fingerprint reader", "Zero report", "Load code", "Time zone", "The poll worker releases by code."],
      ["A burst of 4 votes without fingerprint:", "Is not flagged", "Is an anomaly", "Is informative", "Is outside the test", "The minimum is 5."],
      ["Does the log show who the vote went to?", "No", "Yes", "Only in the burst", "Only in round 2", "It shows only the time and the events."],
    ],
    situ: ["A machine's log shows 8 consecutive votes 20 seconds apart, all released without fingerprint.", "In one section, the time between one vote and the next is much shorter than in neighbouring sections."],
  };
  T.L03 = {
    nome: "Releases without fingerprint in a row", curto: "Looks for long runs of voters released without a fingerprint, through the poll worker's code.",
    vis: "Summary of the section's log",
    campos: { seq: "Longest run of releases without fingerprint", bio: "Voters with registered biometrics (%)", falha: "The log records a reader failure in the period" },
    simples(s, r) {
      if (r.nivel === "na") return [`Outside the test: only ${s.bio}% of voters have registered biometrics. Without biometrics, release by code is normal (e.g. abroad).`];
      const out = [`The longest run of voters released without fingerprint is <b>${s.seq}</b>.`];
      if (r.nivel === "anom") out.push("<b>The test flags it:</b> 10 or more consecutive releases without fingerprint, with no reader failure recorded. Worn fingerprints and a faulty reader explain cases; only the minutes confirm.");
      else if (r.nivel === "info") out.push("<b>Informative:</b> the run coincides with a reader failure recorded in the log.");
      else out.push("Within the expected range: some releases without fingerprint are normal.");
      return out;
    },
    ficha: (s) => fichaL([`Longest run without fingerprint: ${s.seq}`, `Voters with biometrics: ${s.bio}%`, `Reader failure in the log: ${s.falha ? "yes" : "no"}`]),
    kv: (s) => [["Longest run", String(s.seq)], ["With biometrics", `${s.bio}%`], ["Reader failure", s.falha ? "yes" : "no"]],
    tec: (s, r) => [["Eligible", `biometrics ${s.bio}% ≥ 50% → ${sim(s.bio >= 50)}`], ["Run", `${s.seq} ≥ 10 → ${sim(s.seq >= 10)}`], ["Failure recorded", sim(s.falha)], ["Decision (simplified)", `run without failure → anomaly; with failure → informative → ${luz(r)}`]],
    m: [
      ["Long run", "Change the longest run to <b>12</b>.", "12 voters in a row without fingerprint, no reader failure: statistical anomaly."],
      ["Very long run", "Change the run to <b>40</b>.", "The longer, the rarer."],
      ["Worn fingerprints", "A group of farm workers with worn fingerprints voted in a row. Run <b>10</b>.", "Legitimate cause, same signal."],
      ["Reader broke", "The reader broke and the log recorded the failure. Run <b>30</b> and tick the failure.", "With the failure recorded, it is informative."],
      ["Almost", "Change the run to <b>9</b>.", "Below 10, it is not flagged."],
      ["Section abroad", "Only 20% of voters have biometrics. Change biometrics to <b>20%</b> and the run to <b>50</b>.", "Without registered biometrics, release by code is normal: outside the test."],
    ],
    faq: [["What is release without fingerprint?", "When the fingerprint is not recognised, the poll worker releases the voter by typing a code, after checking the ID document. This is allowed."],
      ["Why look at runs?", "An isolated release without fingerprint is common. Many in a row, with no reader failure, deserve checking in the minutes."]],
    prova: [
      ["L03 flags an anomaly with:", "10 or more consecutive releases without fingerprint, no reader failure", "1 release without fingerprint", "Votes with fingerprint", "A line", "The run is the signal."],
      ["If the log records a reader failure in the period:", "It is informative", "It becomes a serious anomaly", "The test stops", "It voids the section", "The failure explains the run."],
      ["A section where 20% of voters have biometrics:", "Is outside the test", "Is always flagged", "Is informative", "Is voided", "Without biometrics, release by code is normal."],
      ["Who releases a voter without fingerprint?", "The poll worker, with a code, after checking the ID", "The voter", "The TSE", "Nobody", "It is an allowed procedure."],
      ["A run of 9:", "Is not flagged", "Is an anomaly", "Is informative", "Is outside the test", "The minimum is 10."],
      ["What can explain runs without fingerprint?", "Worn fingerprints and a faulty reader", "Zero report", "Time zone", "Load code", "Legitimate causes."],
    ],
    situ: ["A section's log shows 25 voters in a row released with the poll worker's code, without fingerprint, and no reader failure recorded.", "In a section where almost everyone has biometrics, a long sequence of votes was released without fingerprint."],
  };
  T.L04 = {
    nome: "Votes after “has everyone voted? YES”", curto: "Checks whether the machine recorded votes after the poll worker confirmed, at closing, that everyone had voted.",
    vis: "Closing timeline (local time)",
    campos: { resp: "Poll worker's answer", depois: "Votes recorded after the answer", registra: "This machine records the question in the log" },
    op: { resp: { sim: "YES (everyone has voted)", nao: "NO (voters still present)" } },
    marcas: (s, r) => { const H = window.SIMM.H; const m = [{ t: H(8), k: "o", rot: "opening" }, { t: H(17, 5), k: "o", rot: `question: ${s.resp === "sim" ? "YES" : "NO"}` }]; if (s.depois) m.push({ t: H(17, 12), k: r.nivel === "anom" ? "x" : "i", rot: `${s.depois} vote(s)` }); return m; },
    simples(s, r) {
      if (r.nivel === "na") return ["Outside the test: this machine does not record the question in the log, so the time of the answer is unknown."];
      if (r.nivel === "anom") return [`<b>The test flags it:</b> ${s.depois} vote(s) recorded after the poll worker answered YES. After that answer, voting should end.`, "It may be a poll worker's mistake when answering; the minutes record the closing."];
      if (r.nivel === "info") return [`The poll worker answered NO and voting went on with ${s.depois} vote(s): <b>informative</b>. Resuming voting is allowed.`];
      return ["No vote after the answer: all in order."];
    },
    ficha: (s) => fichaL([`Answer to “has everyone voted?”: ${s.resp === "sim" ? "YES" : "NO"}`, `Votes recorded after: ${s.depois}`, `The machine records the question in the log: ${s.registra ? "yes" : "no"}`]),
    kv: (s) => [["Answer", s.resp === "sim" ? "YES" : "NO"], ["Votes after", String(s.depois)]],
    tec: (s, r) => [["Record", sim(s.registra)], ["Rule (simplified)", "vote after YES → anomaly; after NO → informative"], ["Decision", luz(r)]],
    m: [
      ["One more vote", "Change the votes after the answer to <b>1</b>.", "Any vote after YES is flagged."],
      ["Many votes after", "Change to <b>15</b> votes.", "Voting continued after the poll worker said everyone had voted."],
      ["Poll worker's mistake", "The poll worker answered YES by mistake and 2 voters in line voted. Change to <b>2</b>.", "An explainable cause, same signal. The minutes record it."],
      ["There was still a line", "Choose <b>NO</b> and change the votes after to <b>3</b>.", "With NO, resuming is allowed: informative."],
      ["Machine that does not record", "Untick <b>This machine records the question</b> and set the votes after to 5.", "Without the record, the test cannot see it: outside the test."],
      ["Long line with NO", "Choose <b>NO</b> and change to <b>20</b> votes.", "Even with many votes, after NO it is only informative."],
    ],
    faq: [["What is the question “has everyone voted?”", "At closing, the machine asks the poll worker whether all voters present have voted. With YES, voting ends; with NO, it continues."],
      ["Do all machines record this question?", "It depends on the model and the software. Where there is no record, the test does not evaluate."]],
    prova: [
      ["A vote recorded after the YES answer:", "Is an anomaly", "Is informative", "Is normal", "Is outside the test", "After YES, voting ends."],
      ["Votes after the NO answer:", "Are informative", "Are an anomaly", "Are voided", "Are forbidden", "Resuming is allowed."],
      ["If the machine does not record the question:", "The case is outside the test", "It is always flagged", "It is informative", "It is an anomaly", "The time cannot be known."],
      ["What can explain a vote after YES?", "A poll worker's mistake when answering", "Biometrics", "Zero report", "Time zone", "The minutes record it."],
      ["With YES, voting:", "Ends", "Continues", "Restarts", "Changes machine", "It is the closing."],
      ["L04 is a test of:", "The order of events in the log", "Votes per candidate", "Biometrics", "The voter roll", "It checks the closing sequence."],
    ],
    situ: ["The log shows that the poll worker confirmed everyone had voted and, after that, the machine recorded 3 more votes.", "A machine recorded votes after the voting-closing confirmation."],
  };
  T.L05 = {
    nome: "Power cuts and interruptions", curto: "Finds power cuts, shutdowns and restarts of the machine during voting.",
    vis: "Timeline of interruptions (local time)",
    campos: { quedas: "Restarts / power cuts", min: "Minutes stopped in total", dentro: "A vote has a time inside an interruption" },
    marcas: (s, r) => { const H = window.SIMM.H, m = []; for (let i = 0; i < s.quedas; i++) m.push({ t: H(9 + 2 * i, 30), k: s.quedas >= 3 ? "x" : "i", rot: `cut ${i + 1}` }); if (s.dentro && s.quedas) m.push({ t: H(9, 35), k: "x", rot: "vote" }); return m; },
    simples(s, r) {
      if (r.nivel === "ok") return ["No interruption recorded."];
      const out = [`The log records ${s.quedas} interruption(s), ${s.min} minutes stopped in total.`];
      if (r.cats.some((c) => c.c === "voto_desligada")) out.push("<b>The test flags it:</b> a vote has a time inside the period when the machine was off. That should not happen; a drifting clock is one possible explanation.");
      else if (r.nivel === "anom") out.push("<b>The test flags it:</b> 3 or more restarts. Storms and an unstable power grid explain cases; the minutes record them.");
      else out.push("<b>Informative:</b> power cuts happen. The machine's battery keeps voting going.");
      return out;
    },
    ficha: (s) => fichaL([`Interruptions: ${s.quedas} · ${s.min} minutes stopped`, `Vote with a time inside an interruption: ${s.dentro ? "yes" : "no"}`]),
    kv: (s) => [["Interruptions", String(s.quedas)], ["Minutes stopped", String(s.min)], ["Vote during", s.dentro ? "yes" : "no"]],
    tec: (s, r) => [["Rule (simplified)", "vote during an interruption or 3+ restarts → anomaly; 1–2 interruptions → informative"], ["Decision", luz(r)]],
    m: [
      ["Vote in the dark", "Set <b>1</b> interruption and tick <b>A vote has a time inside an interruption</b>.", "A vote at a time when the machine was off: anomaly."],
      ["Many restarts", "Change to <b>3</b> restarts.", "3 or more restarts are flagged."],
      ["Storm", "A storm cut the power 4 times. Change to <b>4</b> cuts.", "Legitimate cause, same signal."],
      ["One cut", "Change to <b>1</b> cut of <b>20</b> minutes.", "One cut is informative."],
      ["Two cuts", "Change to <b>2</b> cuts.", "Below 3, only informative."],
      ["Long stop", "Change to 1 cut of <b>90</b> minutes.", "Time stopped alone is not a criterion: informative."],
    ],
    faq: [["Does the machine work without power?", "Yes, it has a battery. Even so, cuts and restarts are recorded in the log."],
      ["Why is a vote during an interruption serious?", "Because a machine that is off does not record votes. A vote time inside that interval points to a wrong clock or a record to check."]],
    prova: [
      ["A vote with a time inside an interruption:", "Is an anomaly", "Is normal", "Is informative", "Is outside the test", "A machine that is off records no votes."],
      ["One power cut:", "Is informative", "Is an anomaly", "Voids the section", "Is not recorded", "It happens."],
      ["How many restarts flag an anomaly?", "3 or more", "1", "10", "None", "Many restarts deserve checking."],
      ["Does the machine work without mains power?", "Yes, on battery", "No", "Only in round 2", "Only in the morning", "The battery keeps voting going."],
      ["90 minutes stopped, no vote during:", "Informative", "Anomaly", "Outside the test", "Voiding", "Time alone is not a criterion."],
      ["What can explain many cuts?", "A storm and an unstable power grid", "Biometrics", "Zero report", "Load", "Legitimate causes."],
    ],
    situ: ["A machine's log shows four shutdowns and restarts during voting.", "A vote appears recorded at a time when, according to the log, the machine was off."],
  };
  T.L06 = {
    nome: "Machine replacement", curto: "Checks machine replacements during voting and whether the machines' votes add up to the tally-sheet turnout.",
    vis: "Votes in each machine's log × tally sheet",
    campos: { troca: "The machine was replaced", v1: "Votes in the original machine's log", v2: "Votes in the replacement machine's log", comp: "Turnout on the tally sheet", depois: "Votes on the original machine after the replacement" },
    simples(s, r, f) {
      const v = r.v, out = [`Votes in the logs: ${s.v1}${s.troca ? ` + ${s.v2} = ${v.tot}` : ""}; turnout on the tally sheet: ${s.comp}.`];
      if (r.cats.some((c) => c.c === "soma_log_bu")) out.push(`<b>The test flags it:</b> a difference of ${v.dif > 0 ? "+" : ""}${v.dif} between the logs and the tally sheet.`);
      if (r.cats.some((c) => c.c === "voto_original_apos")) out.push("<b>The test flags it:</b> a vote recorded on the original machine after the replacement.");
      if (r.nivel === "info") out.push("<b>Informative:</b> machine replacement recorded, with the right sum. Replacement is allowed when the machine fails; the minutes record the reason.");
      if (r.nivel === "ok") out.push("No replacement and the right sum.");
      if (r.nivel === "anom") out.push("The cause must be checked in the minutes: paper ballots during the replacement, for example, do not appear in the log.");
      return out;
    },
    ficha: (s) => fichaL([s.troca ? `Machine replaced: ${s.v1} votes on the original and ${s.v2} on the replacement` : `No replacement: ${s.v1} votes in the log`, `Turnout on the tally sheet: ${s.comp}`, s.troca ? `Votes on the original after the replacement: ${s.depois}` : ""].filter(Boolean)),
    kv: (s, r) => [["Sum of the logs", String(r.v.tot)], ["Tally sheet", String(s.comp)], ["Difference", String(r.v.dif)]],
    tec: (s, r) => [["Sum", `${s.v1}${s.troca ? ` + ${s.v2}` : ""} = ${r.v.tot}; tally sheet ${s.comp}; difference ${r.v.dif}`], ["Rule (simplified)", "sum ≠ tally sheet or vote on the original after replacement → anomaly; replacement recorded → informative"], ["Decision", luz(r)]],
    m: [
      ["Larger sum", "Tick the replacement, <b>120</b> votes on the original and <b>130</b> on the replacement.", "250 votes in the logs and 240 on the tally sheet: anomaly."],
      ["Vote after the replacement", "Tick the replacement, 120 + 120 votes and <b>2</b> votes on the original after the replacement.", "The original machine should receive no votes after being replaced."],
      ["Paper ballots during the swap", "During the swap, voters used paper ballots. Logs: <b>110</b> + <b>118</b>.", "Paper votes are not in the log: the sum is smaller. Legitimate cause, same signal."],
      ["Official replacement", "Tick the replacement, <b>100</b> on the original and <b>140</b> on the replacement.", "Right sum: allowed replacement, only informative."],
      ["Well-done replacement", "Tick the replacement, <b>90</b> + <b>150</b>.", "L06 checks quantities, not who the votes went to."],
      ["Log and tally equal but higher", "Change the original's log and the tally sheet to <b>260</b>.", "If log and tally sheet have the same number, the test sees no difference. Other tests compare with the roll."],
    ],
    faq: [["Is replacing the machine irregular?", "No. If the machine fails, the polling station uses a contingency machine. The replacement and the reason are recorded in the minutes and in the log."],
      ["What does L06 add up?", "The completed votes in the log of each machine used in the section, compared with the tally-sheet turnout."]],
    prova: [
      ["Machine replacement with the right sum:", "Informative", "Anomaly", "Outside the test", "Voiding", "It is allowed."],
      ["Sum of the logs different from the tally sheet:", "Anomaly", "Normal", "Informative", "Ignored", "The numbers should match."],
      ["A vote on the original machine after the replacement:", "Anomaly", "Normal", "Informative", "Outside the test", "It had already been replaced."],
      ["Does L06 check who the votes went to?", "No, it checks quantities", "Yes", "Only for President", "Only on the replacement", "The log does not show the candidate."],
      ["Paper ballots during the replacement:", "Do not appear in the log and can create a difference", "Appear in the log", "Are voided", "Are forbidden", "The minutes record them."],
      ["Where is the reason for the replacement recorded?", "In the polling station minutes", "In the log", "On the tally sheet", "On the zero report", "The log does not say why."],
    ],
    situ: ["The logs of the original and replacement machines add up to 250 votes, but the tally sheet records 240 voters.", "The log shows the machine being replaced mid-voting, with the sum of votes matching the tally sheet."],
  };
  T.L07 = {
    nome: "Repeated attempts (already voted, not found, barred)", curto: "Counts attempts to release voters who already voted, were not found or are barred, and compares with neighbouring sections.",
    vis: "Attempts per 100 voters (dots: region; diamond: this section)",
    campos: { tent: "Attempts (already voted, not found, barred)", el: "Voters who voted", seguidas: "3 or more consecutive attempts with the same result" },
    simples(s, r, f) {
      const out = [`${s.tent} attempts among ${s.el} voters: <b>${f.n(r.v.tx, 1)}%</b> (region: ${f.n(r.v.med, 1)}%).`];
      if (r.nivel === "anom") out.push("<b>The test flags it:</b> far above the neighbours. Voters moved to another section and typing errors in the voter ID explain cases.");
      else if (r.nivel === "info") out.push("<b>Informative:</b> 3 consecutive attempts with the same result, for example a mistyped voter ID number.");
      else out.push(s.tent < 5 ? "Within the expected range: with fewer than 5 attempts the test does not flag." : "Within the expected range.");
      return out;
    },
    ficha: (s) => fichaL([`${s.tent} attempts (already voted, not found, barred) among ${s.el} voters`, `Consecutive attempts with the same result: ${s.seguidas ? "yes" : "no"}`]),
    kv: (s, r, f) => regKv(r, f, pc(f)),
    tec: (s, r, f) => [["Rate", `${s.tent} / ${s.el} = ${f.n(r.v.tx, 2)}%`]].concat(regTec(r, f, pc(f), "z ≥ 3.5 and 5+ attempts → anomaly; 3 consecutive → informative")),
    m: [
      ["Many attempts", "Change the attempts to <b>30</b>.", "12% of voters, far above the neighbours: anomaly."],
      ["Smaller section", "In a section of 150 voters, change to <b>12</b> attempts.", "8%: far above the region."],
      ["Moved section", "Many voters were moved to another section and came to the old one. Change to <b>25</b>.", "Legitimate cause, same signal."],
      ["Typing error", "Tick <b>3 consecutive attempts</b>.", "A mistyped voter ID creates consecutive attempts: informative."],
      ["Few attempts", "Change to <b>4</b> attempts and 60 voters.", "Even with a high rate, fewer than 5 attempts are not flagged."],
      ["Large section", "In a section of 700 voters, change to <b>10</b> attempts.", "1.4%: within the region's pattern."],
    ],
    faq: [["Does the log show the voter's name?", "No. It shows the type of message (already voted, not found, barred) and the time."],
      ["Why compare with neighbours?", "Because typing errors and section changes happen everywhere. The test looks for sections far outside the local pattern."]],
    prova: [
      ["L07 flags an anomaly when:", "The rate is far above the neighbours and there are 5+ attempts", "There is 1 attempt", "There is biometrics", "There is a line", "Both criteria together."],
      ["3 consecutive attempts with the same result:", "Informative", "Anomaly", "Outside the test", "Voiding", "E.g. a mistyped voter ID."],
      ["Does the log show the voter's name?", "No", "Yes", "Only if they already voted", "Only in round 2", "It shows the message type."],
      ["4 attempts in a small section:", "Are not flagged", "Are an anomaly", "Are informative", "Void the section", "The minimum is 5."],
      ["What can explain many attempts?", "Voters moved to another section", "Zero report", "Time zone", "Load code", "A legitimate cause."],
      ["The comparison uses:", "The robust z-score against neighbouring sections", "The national average", "The 2022 round 1", "Polls", "It is the local pattern."],
    ],
    situ: ["In one section, the log shows 30 attempts to release voters who had already voted or were not on the list, against 2 or 3 in neighbouring sections.", "The poll worker typed the same voter ID three times and got “voter not found”."],
  };
  T.L08 = {
    nome: "Unfinished votes", curto: "Counts votes that started and did not finish and compares with neighbouring sections.",
    vis: "Unfinished votes per 100 voters (dots: region; diamond: this section)",
    campos: { nc: "Unfinished votes", el: "Voters who voted" },
    simples(s, r, f) {
      const out = [`${s.nc} unfinished votes among ${s.el} voters: <b>${f.n(r.v.tx, 1)}%</b> (region: ${f.n(r.v.med, 1)}%).`];
      out.push(r.nivel === "anom" ? "<b>The test flags it:</b> far above the neighbours. Voters with difficulties and a faulty keypad explain cases." : s.nc < 5 ? "Within the expected range: with fewer than 5 cases the test does not flag." : "Within the expected range.");
      return out;
    },
    ficha: (s) => fichaL([`${s.nc} unfinished votes among ${s.el} voters`]),
    kv: (s, r, f) => regKv(r, f, pc(f)),
    tec: (s, r, f) => [["Rate", `${s.nc} / ${s.el} = ${f.n(r.v.tx, 2)}%`]].concat(regTec(r, f, pc(f), "z ≥ 3.5 and 5+ cases → anomaly")),
    m: [
      ["Many interrupted votes", "Change to <b>12</b> unfinished votes.", "Far above the neighbours: anomaly."],
      ["Smaller section", "In a section of 150 voters, change to <b>6</b>.", "4%: far above the region."],
      ["Faulty keypad", "A key kept failing and voters gave up. Change to <b>10</b>.", "Legitimate cause, same signal."],
      ["Section of elderly voters", "In a section of 180 voters, many elderly, change to <b>8</b>.", "Difficulty with the machine also creates unfinished votes."],
      ["Few cases", "In a section of 80 voters, change to <b>4</b>.", "Fewer than 5 cases are not flagged."],
      ["Large section", "In a section of 700 voters, change to <b>5</b>.", "0.7%: within the pattern."],
    ],
    faq: [["What is an unfinished vote?", "The voter starts voting and does not confirm the last office, or the poll worker ends the pending vote. The log records it."],
      ["Does an unfinished vote count?", "Offices already confirmed count; the missing ones get no vote. The log does not show who for."]],
    prova: [
      ["L08 flags an anomaly with:", "A rate far above the neighbours and 5+ cases", "1 case", "Biometrics", "A line", "Both criteria together."],
      ["What can explain unfinished votes?", "Voters with difficulties and a faulty keypad", "Zero report", "Time zone", "Load", "Legitimate causes."],
      ["4 cases in a section of 80 voters:", "Are not flagged", "Are an anomaly", "Are informative", "Void the section", "The minimum is 5."],
      ["Does the log show who the vote would have gone to?", "No", "Yes", "Only for President", "Only in round 2", "It shows only the event."],
      ["The comparison uses:", "The municipality's and neighbouring sections", "The whole country", "Polls", "The 2022 round 1", "It is the local pattern."],
      ["5 cases in a section of 700 voters:", "Are within the expected range", "Are an anomaly", "Are informative", "Are outside the test", "0.7% is common."],
    ],
    situ: ["In one section, 15 voters started voting and did not finish, against 1 or 2 in neighbouring sections.", "A machine's log shows many votes interrupted midway."],
  };
  T.L09 = {
    nome: "Closing attempts", curto: "Looks for attempts to close voting before the official time or more than once.",
    vis: "Closing attempts (local time)",
    campos: { t1: "Time of the 1st closing attempt", n: "Number of attempts" },
    marcas: (s, r) => { const m = [{ t: s.t1, k: r.nivel === "anom" ? "x" : "o", rot: "1st attempt" }]; for (let i = 1; i < s.n; i++) m.push({ t: s.t1 + i * 600, k: "i", rot: `#${i + 1}` }); return m; },
    simples(s, r, f) {
      if (r.nivel === "anom") return [`<b>The test flags it:</b> an attempt to close at ${f.hora(s.t1)}, before 5 pm (with a 2-minute tolerance).`, "A key pressed by mistake creates cancelled attempts; the minutes record them."];
      if (r.nivel === "info") return [`<b>Informative:</b> ${s.n} attempts to close after 5 pm. A line or a mistake explains it.`];
      return [`One attempt at ${f.hora(s.t1)}, on time: all in order.`];
    },
    ficha: (s, f) => fichaL([`1st closing attempt at ${f.hora(s.t1)} (local time)`, `Total attempts: ${s.n}`]),
    kv: (s, r, f) => [["1st attempt", f.hora(s.t1)], ["Attempts", String(s.n)]],
    tec: (s, r, f) => [["Time", `${f.hora(s.t1)} < 16:58 → ${sim(s.t1 < 17 * 3600 - 120)}`], ["Rule (simplified)", "before the official time → anomaly; 2+ attempts after → informative"], ["Decision", luz(r)]],
    m: [
      ["Too early", "Change the 1st attempt to <b>16:30</b>.", "Trying to close before 5 pm is flagged."],
      ["At noon", "Change the 1st attempt to <b>12:10</b>.", "Long before the official time: anomaly."],
      ["Wrong key", "The poll worker pressed the close key by mistake at <b>15:00</b> and cancelled. Change the time and make 2 attempts.", "An explainable mistake, same signal. The minutes record it."],
      ["Line at the end", "Change to <b>2</b> attempts after 5 pm.", "More than one attempt after the official time: informative."],
      ["Normal closing", "Change the 1st attempt to <b>17:01</b>, with 1 attempt.", "On time: nothing to flag."],
      ["Within tolerance", "Change the 1st attempt to <b>16:59</b>.", "There is a 2-minute tolerance for clock differences."],
    ],
    faq: [["Why a 2-minute tolerance?", "Clocks can have small differences. It is the same tolerance as test 11."],
      ["Is trying to close early forbidden?", "Voting runs until the official time. An attempt before it, even if cancelled, deserves checking in the minutes."]],
    prova: [
      ["An attempt to close at 16:30:", "Anomaly", "Normal", "Informative", "Outside the test", "Before the official time."],
      ["Two attempts after 5 pm:", "Informative", "Anomaly", "Normal", "Voiding", "A line or a mistake."],
      ["L09's tolerance is:", "2 minutes", "30 minutes", "1 hour", "None", "Same as test 11."],
      ["An attempt at 16:59:", "Is not flagged", "Is an anomaly", "Is informative", "Is outside the test", "Within tolerance."],
      ["One attempt cancelled by mistake before the official time:", "Is flagged, and the minutes explain it", "Does not appear in the log", "Voids the section", "Is ignored", "The log records the command."],
      ["L09 checks:", "The time and number of closing commands", "The votes", "Biometrics", "The roll", "It is an events test."],
    ],
    situ: ["The log shows a command to close voting at 2 pm, cancelled right after.", "A machine recorded three closing attempts after 5 pm."],
  };
  T.L10 = {
    nome: "Time of the zero report and machine switch-on", curto: "Checks the time of the zero report (the printout that shows the machine with no votes) and of the first vote.",
    vis: "Morning timeline (local time)",
    campos: { zer: "Time of the zero report", v1: "Time of the first vote", tem: "The machine printed the zero report" },
    marcas: (s, r) => { const m = [{ t: s.v1, k: "o", rot: "1st vote" }]; if (s.tem) m.push({ t: s.zer, k: r.nivel === "anom" ? "x" : r.nivel === "info" ? "i" : "o", rot: "zero report" }); return m; },
    simples(s, r, f) {
      if (!s.tem) return ["<b>The test flags it:</b> there is no zero report in the log. It is the printout that shows the machine started with no votes."];
      if (r.nivel === "anom") return [`<b>The test flags it:</b> zero report at ${f.hora(s.zer)}, after the first vote (${f.hora(s.v1)}).`];
      if (r.nivel === "info") return [`<b>Informative:</b> zero report at ${f.hora(s.zer)}, outside the election morning (6 am to 8 am). A contingency machine prints its zero report at the time of the replacement.`];
      return [`Zero report at ${f.hora(s.zer)} and first vote at ${f.hora(s.v1)}: in order.`];
    },
    ficha: (s, f) => fichaL([s.tem ? `Zero report at ${f.hora(s.zer)}` : "No zero report in the log", `First vote at ${f.hora(s.v1)}`]),
    kv: (s, r, f) => [["Zero report", s.tem ? f.hora(s.zer) : "—"], ["1st vote", f.hora(s.v1)]],
    tec: (s, r, f) => [["Order", s.tem ? `zero report ${f.hora(s.zer)} ≤ 1st vote ${f.hora(s.v1)} → ${sim(s.zer <= s.v1)}` : "no zero report"], ["Window", "between 06:00 and 08:00 → normal; outside → informative"], ["Decision (simplified)", luz(r)]],
    m: [
      ["Late zero report", "Change the zero report to <b>08:20</b> and the first vote to 08:05.", "The zero report must come before any vote."],
      ["No zero report", "Untick <b>The machine printed the zero report</b>.", "Without a zero report, there is no proof the machine started empty."],
      ["Contingency machine", "The machine was replaced at 10 am. Change the zero report to <b>10:15</b> and the 1st vote to 10:20.", "The replacement prints its zero report at the time of the swap: informative."],
      ["Early poll workers", "Change the zero report to <b>05:40</b>.", "Before 6 am it is informative."],
      ["Just in time", "Zero report at <b>07:59</b> and first vote at 08:00.", "In order: nothing to flag."],
      ["Late first voter", "Change the first vote to <b>09:30</b>.", "The first voter arriving late is not a criterion."],
    ],
    faq: [["What is the zero report?", "It is the report the machine prints before voting, showing every candidate with zero votes. Party monitors can check it."],
      ["Why does a contingency machine have another time?", "Because it is only switched on when the original fails; its zero report comes out at the time of the replacement."]],
    prova: [
      ["A zero report after the first vote:", "Anomaly", "Normal", "Informative", "Outside the test", "It must come first."],
      ["No zero report in the log:", "Anomaly", "Normal", "Informative", "Ignored", "There is no proof the machine was empty."],
      ["A zero report at 10:15 on a contingency machine:", "Informative", "Anomaly", "Normal", "Voiding", "It was printed at the swap."],
      ["The zero report shows:", "That the machine started with no votes", "The result", "The voters", "Biometrics", "It is made before voting."],
      ["First vote at 9:30:", "Is not a criterion of the test", "Is an anomaly", "Is informative", "Voids the machine", "Voters may arrive late."],
      ["A zero report at 05:40:", "Informative", "Anomaly", "Normal", "Outside the test", "Before 6 am."],
    ],
    situ: ["A machine's log shows the zero report printed 15 minutes after the first vote.", "In one section, there is no zero report in the machine log."],
  };
  T.L11 = {
    nome: "Machine clock", curto: "Checks whether the machine's clock was right and whether it was adjusted during the day.",
    vis: "Clock adjustments during the day (local time)",
    campos: { dif: "Clock difference (minutes: + fast, − slow)", ajuste: "Date and time adjustment in the log" },
    op: { ajuste: { nao: "No adjustment", fora: "Adjustment before or after voting", durante: "Adjustment during voting" } },
    marcas: (s, r) => { const H = window.SIMM.H; return s.ajuste === "durante" ? [{ t: H(12), k: "x", rot: "adjustment" }] : s.ajuste === "fora" ? [{ t: H(7), k: "i", rot: "adjustment" }] : []; },
    simples(s, r) {
      if (r.nivel === "anom") return ["<b>The test flags it:</b> the clock was adjusted during voting, with votes before and after. All of the day's times become hard to compare.", "It may be the correction of a wrong clock; the minutes record it."];
      const out = [`The machine's clock was ${Math.abs(s.dif)} minutes ${s.dif >= 0 ? "fast" : "slow"}.`];
      out.push(r.nivel === "info" ? "<b>Informative:</b> a difference of 15 minutes or more, or an adjustment outside voting. A wrong clock shifts the times used by every other test." : "Within the expected range.");
      return out;
    },
    ficha: (s) => fichaL([`Clock ${Math.abs(s.dif)} min ${s.dif >= 0 ? "fast" : "slow"}`, `Adjustment in the log: ${({ nao: "none", fora: "outside voting", durante: "during voting" })[s.ajuste]}`]),
    kv: (s) => [["Difference", `${s.dif} min`], ["Adjustment", ({ nao: "none", fora: "outside", durante: "during" })[s.ajuste]]],
    tec: (s, r) => [["Difference", `|${s.dif}| ≥ 15 → ${sim(Math.abs(s.dif) >= 15)}`], ["Rule (simplified)", "adjustment during voting → anomaly; difference ≥ 15 min or adjustment outside → informative"], ["Decision", luz(r)]],
    m: [
      ["Midday adjustment", "Choose <b>Adjustment during voting</b>.", "Changing the clock while voting is under way is flagged."],
      ["Adjustment and wrong clock", "Adjustment during voting and a difference of <b>−30</b> minutes.", "Still flagged."],
      ["Clock correction", "The poll worker corrected a clock 40 minutes fast in the middle of voting. Difference <b>40</b> and adjustment during.", "An explainable cause, same signal."],
      ["Fast clock", "Change the difference to <b>20</b> minutes.", "15 minutes or more: informative."],
      ["Slightly slow", "Change the difference to <b>−10</b> minutes.", "Below 15 minutes: within the expected range."],
      ["Adjustment before voting", "Choose <b>Adjustment before or after voting</b>.", "An adjustment outside voting is informative."],
    ],
    faq: [["Why does the clock matter?", "Because every timing test (11, L01, L09, L10) uses the machine's time. A wrong clock creates false alarms."],
      ["How is the difference found?", "By comparing the log time with the time of receipt by the TSE and with the day's other records."]],
    prova: [
      ["A clock adjustment during voting:", "Anomaly", "Normal", "Informative", "Outside the test", "With votes before and after."],
      ["A clock 20 minutes fast:", "Informative", "Anomaly", "Normal", "Voiding", "15 min or more."],
      ["A clock 10 minutes slow:", "Within the expected range", "Anomaly", "Informative", "Outside the test", "Below 15 min."],
      ["A wrong clock affects:", "The timing tests", "The votes", "Biometrics", "The roll", "They use the machine's time."],
      ["An adjustment before voting:", "Informative", "Anomaly", "Normal", "Voiding", "Outside voting."],
      ["The clock difference is measured against:", "Receipt by the TSE and other records", "The voter's phone", "Polls", "Round 1", "They are external references."],
    ],
    situ: ["The log shows the machine's time was changed at 1 pm, with votes before and after.", "A machine's clock was 25 minutes fast compared with the official time."],
  };
  T.L12 = {
    nome: "Model, software version and load code", curto: "Checks the machine model, the software version and the load code recorded in the log.",
    vis: "Machine data in the log",
    campos: { versao: "Software version", carga: "Load code", modelo: "Machine model", bate: "Log and tally sheet with the same data", secao: "Section this machine is assigned to", va: "Candidate A's votes" },
    op: { versao: { ok: "The official one", outra: "Another" }, carga: { ok: "The expected one", outra: "Another" }, modelo: { prev: "The expected one", outro: "Another model" }, secao: { certa: "This section", outra: "Another section" } },
    simples(s, r, f) {
      if (r.nivel === "anom") return [`<b>The test flags it:</b> ${r.cats.map((c) => f.cat(c.c)).join("; ")}.`, "Registration errors and a poorly recorded contingency machine explain cases; the official list and the minutes confirm."];
      if (r.nivel === "info") return ["<b>Informative:</b> the model differs from the expected one, with the right version and load. Contingency machines can be another model."];
      return ["Version, load and model match, and log and tally sheet agree.", "L12 checks the machine's identity, not the votes nor the section (that is test 12)."];
    },
    ficha: (s) => fichaL([`Version: ${s.versao === "ok" ? "official" : "another"} · load: ${s.carga === "ok" ? "expected" : "another"}`, `Model: ${s.modelo === "prev" ? "expected" : "another"} · log and tally sheet: ${s.bate ? "equal" : "different"}`]),
    kv: (s) => [["Version", s.versao === "ok" ? "official" : "another"], ["Load", s.carga === "ok" ? "expected" : "another"], ["Model", s.modelo === "prev" ? "expected" : "another"], ["Log × tally sheet", s.bate ? "equal" : "different"]],
    tec: (s, r) => [["Version", sim(s.versao === "ok")], ["Load", sim(s.carga === "ok")], ["Log = tally sheet", sim(s.bate)], ["Expected model", sim(s.modelo === "prev")], ["Decision (simplified)", luz(r)]],
    m: [
      ["Different version", "Change the software version to <b>Another</b>.", "Software other than the official one is flagged."],
      ["Log and tally sheet differ", "Untick <b>Log and tally sheet with the same data</b>.", "The two files of the same machine must agree."],
      ["Registration error", "The contingency machine was registered with the wrong load. Change the load to <b>Another</b>.", "An explainable cause, same signal."],
      ["Contingency of another model", "Change the model to <b>Another model</b>.", "With the right version and load, only informative."],
      ["Changed votes", "Move <b>30</b> votes to A.", "L12 checks the machine, not the votes."],
      ["Machine from another section", "Change the assigned section to <b>Another section</b>.", "That is checked by test 12, not by L12."],
    ],
    faq: [["What is the load code?", "It identifies how the machine was prepared before the election (software and data). It must match the official list."],
      ["How is it different from test 12?", "Test 12 checks whether the machine is the one assigned to the section. L12 checks the version, load and model recorded in the log."]],
    prova: [
      ["A software version different from the official one:", "Anomaly", "Informative", "Normal", "Outside the test", "The software must be the official one."],
      ["A different model, with the right version and load:", "Informative", "Anomaly", "Normal", "Voiding", "A contingency machine can be another model."],
      ["Log and tally sheet with different data:", "Anomaly", "Normal", "Informative", "Ignored", "They must agree."],
      ["Does L12 check the votes?", "No", "Yes", "Only for President", "Only in round 2", "It checks the machine's identity."],
      ["Who checks whether the machine belongs to the section?", "Test 12", "L12", "V6", "L01", "It is another test."],
      ["The load code identifies:", "How the machine was prepared (software and data)", "The voter", "The candidate", "The time", "It must match the list."],
    ],
    situ: ["A machine's log records a software version different from the election's official version.", "The load code in a machine's log does not match the one on the tally sheet."],
  };
  T.L13 = {
    nome: "Detailed biometrics", curto: "Details the use of biometrics and compares releases without fingerprint with neighbouring sections.",
    vis: "Voters released without fingerprint (%) (dots: region; diamond: this section)",
    campos: { sem: "Released without fingerprint (%)", quatro: "Voters with 4 or more attempts (%)", regiao: "Biometrics in the region" },
    op: { regiao: { normal: "Normal", ruim: "Poor (many failures in the region)" } },
    simples(s, r, f) {
      const out = [`<b>${s.sem}%</b> of voters were released without fingerprint (region: ${f.n(r.v.med, 1)}%).`];
      if (r.nivel === "anom") out.push("<b>The test flags it:</b> far above the neighbours. A faulty reader and voters without biometrics explain cases; it complements test 10.");
      else if (r.nivel === "info") out.push(`<b>Informative:</b> ${s.quatro}% of voters needed 4 or more attempts. Worn fingerprints are common in some jobs.`);
      else out.push("Within the region's pattern.");
      return out;
    },
    ficha: (s) => fichaL([`Released without fingerprint: ${s.sem}%`, `With 4 or more attempts: ${s.quatro}%`, `Biometrics in the region: ${s.regiao === "ruim" ? "poor" : "normal"}`]),
    kv: (s, r, f) => regKv(r, f, pc(f)),
    tec: (s, r, f) => regTec(r, f, pc(f), "z ≥ 3.5 on releases without fingerprint → anomaly; 4+ attempts for 20% or more → informative"),
    m: [
      ["Many without fingerprint", "Change the releases without fingerprint to <b>45%</b>.", "Far above the neighbours: anomaly."],
      ["A quarter without fingerprint", "Change to <b>25%</b>.", "Still far above the region (8%)."],
      ["Faulty reader", "The reader failed for much of the day. Change to <b>60%</b>.", "Legitimate cause, same signal."],
      ["Worn fingerprints", "Change voters with 4 attempts to <b>30%</b>.", "Many attempts, but recognised: informative."],
      ["Slightly above", "Change to <b>14%</b>.", "Within the region's variation."],
      ["Whole region with failures", "Choose <b>Poor</b> and change to <b>45%</b>.", "If the neighbours also have many failures, the section does not depart from the pattern."],
    ],
    faq: [["How is it different from test 10?", "Test 10 uses the tally sheet. L13 uses the log, voter by voter: how many attempts and how each one was released."],
      ["Is release without fingerprint irregular?", "No. When the fingerprint is not recognised, the poll worker checks the ID and releases the voter. The test looks for sections far outside the pattern."]],
    prova: [
      ["L13 flags an anomaly when:", "Releases without fingerprint are far above the neighbours", "There is 1 release without fingerprint", "There is a line", "There is a machine replacement", "Robust z-score ≥ 3.5."],
      ["Many voters with 4 attempts:", "Informative", "Anomaly", "Normal", "Voiding", "Worn fingerprints."],
      ["If the whole region has many failures:", "The section does not depart from the pattern", "All are flagged", "The test stops", "It is an anomaly", "It compares with neighbours."],
      ["L13 uses:", "The log, voter by voter", "Only the tally sheet", "Polls", "The roll", "More detail than test 10."],
      ["A faulty reader can:", "Make the test flag for a legitimate reason", "Change votes", "Zero the machine", "Change the section", "An anomaly is not proof."],
      ["Release without fingerprint is:", "Allowed, with an ID check", "Forbidden", "Fraud", "Impossible", "The poll worker releases."],
    ],
    situ: ["In one section, 45% of voters were released without fingerprint, against 8% in neighbouring sections.", "The log shows that many voters needed four or more fingerprint attempts."],
  };
  T.L14 = {
    nome: "Log votes × tally sheet", curto: "Checks whether the number of votes recorded in the log equals the turnout on the tally sheet.",
    vis: "Votes in the log × turnout on the tally sheet",
    campos: { log: "Completed votes in the log", bu: "Turnout on the tally sheet", corromp: "Incomplete or corrupted log", va: "Candidate A's votes on the tally sheet" },
    simples(s, r) {
      if (s.corromp) return ["<b>The test flags it:</b> the log file is incomplete or corrupted, so the count cannot be checked. It is recorded as a file failure."];
      if (r.nivel === "anom") return [`<b>The test flags it:</b> the log has ${s.log} votes and the tally sheet ${s.bu} (${s.log - s.bu > 0 ? "+" : ""}${s.log - s.bu}).`, "Both come from the same machine and should have the same number. Checking starts with the printed tally sheet and the minutes."];
      return [`Log and tally sheet have ${s.bu} votes: they match.`, "L14 checks the quantity, not who the votes went to."];
    },
    ficha: (s) => fichaL([`Votes in the log: ${s.log} · turnout on the tally sheet: ${s.bu}`, s.corromp ? "Incomplete or corrupted log" : "Complete log"]),
    kv: (s) => [["Log", String(s.log)], ["Tally sheet", String(s.bu)], ["Difference", String(s.log - s.bu)]],
    tec: (s, r) => [["Difference", `${s.log} − ${s.bu} = ${s.log - s.bu}`], ["File", s.corromp ? "incomplete" : "complete"], ["Rule (simplified)", "any difference or incomplete log → anomaly"], ["Decision", luz(r)]],
    m: [
      ["More votes in the log", "Change the votes in the log to <b>245</b>.", "5 more votes in the log than on the tally sheet: anomaly."],
      ["Fewer votes in the log", "Change the votes in the log to <b>230</b>.", "It is also flagged when votes are missing from the log."],
      ["Corrupted file", "Tick <b>Incomplete or corrupted log</b>.", "Without the whole file, it cannot be checked: recorded as a file failure."],
      ["One vote", "Change the log to <b>241</b>.", "Even 1 vote of difference is flagged: it is arithmetic."],
      ["Swapped votes", "Move <b>25</b> votes to A on the tally sheet, without changing the total.", "L14 checks quantities, not candidates."],
      ["Both equal", "Change log and tally sheet to <b>260</b>.", "If both have the same number, the test sees no difference."],
    ],
    faq: [["Aren't the log and the tally sheet the same thing?", "No. The tally sheet has the votes per candidate; the log has the events and the time of each vote. Both come from the same machine, so the total must match."],
      ["Does a difference prove anything?", "No. An incomplete log, a machine replacement and paper ballots also create a difference. Checking is done with the printed tally sheet and the minutes."]],
    prova: [
      ["A difference of 1 vote between log and tally sheet:", "Anomaly", "Normal", "Informative", "Outside the test", "It is arithmetic: it must match."],
      ["A corrupted log:", "Is recorded as a file failure", "Is ignored", "Is normal", "Voids the election", "It cannot be checked."],
      ["L14 checks:", "The total number of votes", "Votes per candidate", "Biometrics", "The time", "Only the quantity."],
      ["Votes swapped between candidates, with the same total:", "Do not show up in L14", "Are always flagged", "Are informative", "Void the log", "The log does not show the candidate."],
      ["Where does checking a difference start?", "With the printed tally sheet and the minutes", "With a poll", "With the roll", "With a phone", "Official documents."],
      ["What else creates a difference with nothing wrong?", "An incomplete log or paper ballots", "Biometrics", "Zero report", "Time zone", "Explainable causes."],
    ],
    situ: ["A machine's log has 245 votes, but the tally sheet records 240 voters.", "A section's log file is incomplete and the votes cannot be counted."],
  };

  Object.assign(S, T);
})();
