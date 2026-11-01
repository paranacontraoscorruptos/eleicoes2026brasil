/* Simulador de anomalias — textos em português dos testes V1–V6 (variação entre turnos) e L01–L14 (logs das urnas).
   Os testes dos logs estão em andamento: os critérios usados aqui são preliminares. */
(function () {
  "use strict";
  const S = window.SIM_TXT && window.SIM_TXT.PT;
  if (!S) return;
  const fichaL = (itens) => `<ul>${itens.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const luz = (r) => S.ui.luz[r.nivel];
  const sim = (b) => (b ? "✓" : "✗");

  // --- ajustes da interface para os 35 testes ---
  Object.assign(S.ui, {
    sub: "Mude números inventados e veja, na hora, como cada um dos 35 testes da auditoria reage, por que reage e o que isso significa.",
    final_sub: "30 questões sobre todos os 35 testes. Liberada depois de 15 provas.",
    final_bloq: (f, t) => `Faça pelo menos ${t} provas de testes para liberar a prova final. Você fez ${f}.`,
    formula: (m, f) => `Nota final = 60% da média das 35 provas (${m}) + 40% da prova final (${f}). Provas não feitas contam zero.`,
  });
  Object.assign(S.ui.tl, { metodo_v: "Método (igual ao do Relatório Técnico, Adendo A)", metodo_l: "Método previsto (o teste está em andamento)" });
  Object.assign(S.ui.niveis, { variacao: "Do 1º para o 2º turno", log: "O log da urna (em andamento)" });
  Object.assign(S.ui.niveis_d, {
    variacao: "Testes que comparam o 1º e o 2º turno para Presidente: quanto cada finalista ganhou e onde a mudança foge do padrão.",
    log: "Testes que leem o log da urna, com a hora de cada voto e de cada evento. Os critérios ainda são preliminares: os testes estão em andamento.",
  });
  Object.assign(S.ui.cat, {
    transferencia: "Transferência fora do esperado", comp_direcionado: "Comparecimento atípico e direcionado", comp_atipico: "Comparecimento atípico",
    acima_teto_A: "Candidato A ganhou acima do teto", acima_teto_B: "Candidato B ganhou acima do teto", aptos_mudaram: "Eleitores aptos mudaram",
    sem_bu_2t: "Sem boletim no 2º turno", sem_bu_1t: "Sem boletim no 1º turno",
    voto_tarde: "Votos depois do horário", voto_tarde_fora: "Votos muito depois do horário, fora do padrão", rajada: "Rajada de votos sem digital",
    tempo_curto: "Tempo de voto muito curto", seq_sem_digital: "Sequência longa sem digital", seq_com_falha: "Sequência sem digital com falha do leitor",
    voto_apos_sim: "Voto depois do “todos já votaram? SIM”", retomada: "Votação retomada depois do NÃO", voto_desligada: "Voto com a urna desligada",
    muitos_reinicios: "3 reinícios ou mais", interrupcao: "Interrupção registrada", soma_log_bu: "Soma das urnas ≠ boletim", voto_original_apos: "Voto na urna original depois da troca",
    troca_registrada: "Troca de urna registrada", tentativas_altas: "Tentativas acima das seções vizinhas", tentativas_seguidas: "Tentativas seguidas com o mesmo resultado",
    nao_concluidos: "Votos não concluídos acima das vizinhas", encerrar_antes: "Tentativa de encerrar antes do horário", varias_tentativas: "Mais de uma tentativa de encerrar",
    sem_zeresima: "Sem zerésima", zeresima_depois: "Zerésima depois do primeiro voto", zeresima_fora: "Zerésima fora da manhã da eleição",
    ajuste_durante: "Relógio ajustado durante a votação", relogio_errado: "Relógio com 15 min ou mais de diferença", ajuste_fora: "Relógio ajustado fora da votação",
    versao_diferente: "Versão do programa diferente", carga_log_diferente: "Código de carga diferente", log_bu_diferentes: "Log e boletim com dados diferentes",
    modelo_outro: "Modelo fora do previsto", sem_digital_alto: "Liberação sem digital acima das vizinhas", muitas_tentativas: "Muitos eleitores com 4 tentativas ou mais",
    log_incompleto: "Log incompleto ou corrompido", log_diferente_bu: "Votos do log ≠ comparecimento do boletim",
  });
  // perguntas gerais que citavam os 15 testes
  S.faqGeral.forEach((q) => {
    if (/60% da média das 15 provas/.test(q[1])) q[1] = "Cada prova vale de 0 a 10, com aprovação a partir de 7. A nota final é 60% da média das 35 provas mais 40% da prova final, que abre depois de 15 provas. Você pode refazer as provas: vale a melhor nota.";
  });
  S.faqGeral.push(
    ["Quais são os 35 testes?", "São 15 testes nos boletins de urna (T01 a T15), 6 na variação do 1º para o 2º turno (V1 a V6) e 14 nos logs das urnas (L01 a L14). Os testes dos logs já foram concluídos no 1º turno (resultados na página Logs das urnas); o 2º turno está em andamento. Aqui no simulador, os critérios dos testes L são simplificados."],
    ["Por que os testes dos logs têm critério preliminar?", "Porque eles ainda estão sendo feitos: os logs de todas as urnas estão sendo baixados do TSE. O simulador usa os critérios previstos hoje. Quando cada teste for concluído e publicado, os critérios podem ser ajustados."],
    ["O log da urna mostra em quem a pessoa votou?", "Não. O log registra a hora de cada voto e dos eventos da urna (ligar, liberar o eleitor, digital, encerrar), mas não registra em quem foi o voto nem o nome do eleitor."],
  );

  // --- topo da página inicial: o que tem no simulador e como parar e continuar depois ---
  Object.assign(S.ui, {
    t_titulo: "O que tem no simulador",
    t_testes: "testes para simular", t_testes_d: "15 testes dos boletins (T01 a T15), 6 da variação entre os turnos (V1 a V6) e 14 dos logs das urnas (L01 a L14).",
    t_missoes: "missões", t_missoes_d: "12 em cada teste dos boletins e 6 em cada teste novo. São de três tipos: faça sinalizar, alarme falso e passou despercebido.",
    t_livre: "simulações livres", t_livre_d: "No modo livre de cada teste você muda os números como quiser ou pede um caso novo, sem limite.",
    t_provas: "provas com nota", t_provas_d: "Uma prova de 10 questões para cada teste (15 minutos) e a prova final, com 30 questões sobre todos os testes (45 minutos).",
    t_banco: "perguntas no banco das provas", t_banco_d: "Questões de conceito e de “qual teste é este?”. As questões com casos são criadas na hora, então cada prova sai diferente.",
    t_faq: "perguntas e respostas", t_faq_d: "Dúvidas respondidas em linguagem simples: gerais e de cada teste.",
    ct_t: "Comece quando quiser, pare e continue depois",
    ct_l: ["Comece por qualquer teste, missão, simulação livre ou prova. Não precisa seguir a ordem.",
      "Pode parar a qualquer hora: fechar a página, ir trabalhar, dormir. Na volta, continue de onde parou.",
      "Tudo fica salvo neste navegador: missões cumpridas, notas, o último caso que você mexeu em cada teste e as provas pela metade.",
      "Na prova, o relógio para quando você sai e só volta a contar quando você continua.",
      "Para continuar, abra o simulador no mesmo aparelho e no mesmo navegador.",
      "Nada é enviado para servidor. Em janela anônima, em outro aparelho ou se você limpar os dados do navegador, o progresso não aparece."],
    ct_parou: "Você parou em", ct_quando: (d) => (d ? `(${d})` : ""), ct_btn: "Continuar de onde parei", ct_comecar: "Começar pelo Teste 1", ct_escolher: "Escolher um teste",
    ct_novo: "Você ainda não começou. Comece pelo Teste 1 ou escolha qualquer teste na lista.", ct_provas: "Provas pela metade",
    ret_t: "Prova pela metade", ret_d: (r, n, t) => `Você respondeu ${r} de ${n} questões. Tempo restante: ${t}.`,
    ret_nota: "O relógio ficou parado enquanto você estava fora. Ele volta a contar quando você continuar.",
    ret_btn: "Continuar a prova", ret_nova: "Descartar e começar outra",
    apagar_conf: "Apagar todas as missões, notas e provas pela metade deste aparelho?",
  });
  S.faqGeral.forEach((q) => {
    if (/^Meu progresso fica salvo onde/.test(q[0])) q[1] = "Só neste navegador, neste aparelho: missões cumpridas, notas, o último caso que você mexeu em cada teste e as provas pela metade. Nada é enviado para lugar nenhum. Você pode apagar tudo no seu boletim.";
  });
  S.faqGeral.push(
    ["Posso parar e continuar depois?", "Pode. Feche a página quando quiser. Quando voltar, no mesmo aparelho e no mesmo navegador, o simulador mostra onde você parou e o botão “Continuar de onde parei”. Numa prova pela metade, o relógio fica parado enquanto você está fora."],
  );

  const T = {};
  // ============================== V1, V2, V3 ==============================
  const UN = {
    V1: { o: "o estado", d: "do estado", g: "nos demais estados", G: "Estados", f: "Estado fictício" },
    V2: { o: "o município", d: "do município", g: "nos demais municípios do estado", G: "Municípios", f: "Município fictício" },
    V3: { o: "a seção", d: "da seção", g: "nas seções da mesma zona", G: "Seções", f: "Seção fictícia" },
  };
  const opVar = (G) => ({ p: `Pouco (${G.toLowerCase()} parecidos)`, m: "Médio", a: `Muito (${G.toLowerCase()} diferentes)` });
  function transfTxt(id) {
    const u = UN[id];
    return {
      vis: `Parte do Candidato A nos votos dos dois finalistas (${u.o.replace(/^[oa] /, "")} e o grupo de comparação)`,
      vl: [`A no 1º turno (${u.o.replace(/^[oa] /, "")})`, "A no 1º turno (grupo)", "A no 2º turno (grupo)", "A esperado no 2º turno", "A observado no 2º turno"],
      campos: { n: "Votos nos dois finalistas", a1: "% de A no 1º turno", a2: "% de A no 2º turno", g1: "% de A no grupo, 1º turno", g2: "% de A no grupo, 2º turno", var: `Quanto ${u.G.toLowerCase()} do grupo variam` },
      op: { var: opVar(u.G) },
      simples(s, r, f) {
        const v = r.v;
        if (r.nivel === "na") return [`Fora do teste: ${u.o} tem ${f.n(v.n)} votos nos dois finalistas, menos que o mínimo de 30 em cada turno.`];
        const out = [`No 1º turno, o Candidato A teve ${s.a1}% dos votos dos dois finalistas ${u.d}. ${u.g[0].toUpperCase() + u.g.slice(1)}, A foi de ${s.g1}% para ${s.g2}%. Com a mesma mudança, o esperado no 2º turno era <b>${f.pct(v.pe)}</b>; o observado foi <b>${f.pct(v.po)}</b> (${f.n(v.dif, 1)} pontos).`];
        if (r.nivel === "anom") out.push(`<b>O teste sinaliza: a diferença passa de 10 pontos e é muito rara pelo acaso.</b> Isso não prova nada: alianças, apoio de lideranças e voto útil mudam o voto de forma legítima.`);
        else if (r.nivel === "info") out.push("Diferença entre 5 e 10 pontos e rara pelo acaso: fica como <b>informativo</b>.");
        else if (Math.abs(v.dif) >= 5) out.push(`<b>Dentro do esperado.</b> A diferença parece grande, mas não é rara para o tamanho ${u.d} e para o quanto o grupo varia.`);
        else out.push("<b>Dentro do esperado.</b> A mudança acompanha a do grupo.");
        return out;
      },
      ficha: (s, f) => fichaL([`${u.f} com ${f.n(s.n)} votos nos dois finalistas`, `Candidato A: ${s.a1}% no 1º turno e ${s.a2}% no 2º turno`, `Grupo de comparação: A foi de ${s.g1}% para ${s.g2}%`, `O grupo varia: ${opVar(u.G)[s.var].toLowerCase()}`]),
      kv: (s, r, f) => (r.v.pe == null ? [["Votos", f.n(r.v.n)]] : [["Esperado no 2º turno", f.pct(r.v.pe)], ["Observado", f.pct(r.v.po)], ["Diferença", `${f.n(r.v.dif, 1)} p.p.`], ["Chance depois do ajuste (q)", f.sci(r.v.lq)]]),
      tec: (s, r, f) => {
        const v = r.v;
        if (r.nivel === "na") return [["Mínimo não atingido", `n = ${f.n(v.n)} < 30`]];
        return [["Deslocamento do grupo", `Δ = logit(${s.g2}%) − logit(${s.g1}%) = ${f.n(v.d, 3)}`], ["Esperado", `p̂ = expit(logit((${f.n(v.x1)} + 0,5)/(${f.n(v.n)} + 1)) + Δ) = ${f.pct(v.pe, 2)}`],
          ["Observado", `${f.n(v.x2)} / ${f.n(v.n)} = ${f.pct(v.po, 2)} · diferença ${f.n(v.dif, 1)} p.p.`], ["Escore z", `z₀ = ${f.n(v.z0, 2)} · φ = mediana(z₀²)/0,4549 = ${f.n(v.phi, 2)} · z = z₀/√φ = ${f.n(v.z, 2)}`],
          ["Probabilidade", `p = 2·P(Z > |z|) = ${f.sci(v.lp)}`], ["Ajuste de Benjamini–Hochberg", `q = min(1, p × ${f.n(v.M)}) = ${f.sci(v.lq)}`],
          ["Decisão", `q < 0,01 ${sim(v.sig)} · |dif| ≥ 10 p.p. → anomalia; ≥ 5 p.p. → informativo → ${luz(r)}`]];
      },
    };
  }
  T.V1 = Object.assign(transfTxt("V1"), {
    nome: "Transferência atípica no estado", curto: "Compara a mudança do voto de cada estado, do 1º para o 2º turno, com a mudança dos demais estados.",
    m: [
      ["Virada no estado", "Mude a parte de A no 2º turno para <b>62%</b>.", "O esperado era cerca de 50%. Mais de 10 pontos acima, num estado inteiro, é muito raro: anomalia estatística."],
      ["Queda forte", "Mude a parte de A no 2º turno para <b>36%</b>.", "Vale nos dois sentidos: ganhar ou perder muito além do esperado sinaliza."],
      ["Aliança regional", "O governador, muito popular, apoiou A no 2º turno. Mude A para <b>63%</b>.", "O teste sinaliza, mas a causa é legítima. Anomalia estatística é um ponto para conferir, não uma prova."],
      ["Estados parecidos", "Neste caso os estados variam pouco entre si. Mude A para <b>56%</b>.", "Com um grupo homogêneo, 6 pontos já são raros: fica como informativo."],
      ["O país inteiro mudou", "Mude o grupo no 2º turno para <b>58%</b> e A no 2º turno para <b>59%</b>.", "Se todos mudam juntos, o esperado muda junto. O teste só procura quem foge do grupo."],
      ["Grupo muito variável", "Aqui os estados variam muito entre si. Mude A para <b>56%</b>.", "Com um grupo muito variável, 6 pontos não chegam a ser raros: dentro do esperado."],
    ],
    faq: [
      ["Por que comparar com os outros estados?", "Porque o país inteiro muda do 1º para o 2º turno. O teste aplica essa mudança geral ao estado e vê se ele ficou muito longe do esperado."],
      ["Por que só Lula e Flávio Bolsonaro?", "Porque são os dois finalistas: só eles estão nos dois turnos. O teste usa a parte de cada um nos votos dos dois."],
    ],
    prova: [
      ["O V1 compara cada estado com:", "Os demais estados", "Os municípios do estado", "O 1º turno de 2022", "As pesquisas eleitorais", "A mudança do resto do país dá o esperado."],
      ["Para sinalizar como anomalia, a diferença precisa ser:", "De 10 pontos ou mais e rara pelo acaso (q < 0,01)", "De 1 ponto ou mais", "Qualquer diferença", "De 50 pontos", "Os dois critérios valem juntos."],
      ["Se todos os estados mudam 8 pontos para o mesmo lado:", "O esperado muda junto e o teste não sinaliza", "Todos sinalizam", "O teste é cancelado", "Só o maior estado sinaliza", "O teste procura quem foge do grupo."],
      ["Uma diferença entre 5 e 10 pontos, rara pelo acaso, fica como:", "Informativo", "Anomalia", "Fora do teste", "Erro de dados", "É a faixa do registro informativo."],
      ["Uma aliança regional legítima pode:", "Fazer o teste sinalizar sem nada errado", "Impedir o teste", "Mudar o 1º turno", "Zerar a diferença", "O teste mostra o desvio, não a causa."],
      ["O fator de dispersão (φ) serve para:", "Levar em conta o quanto as unidades do grupo variam naturalmente", "Arredondar os votos", "Escolher o estado", "Contar seções", "Grupos mais variáveis exigem diferenças maiores."],
    ],
    situ: ["Num estado, a parte de Lula nos votos dos finalistas subiu 14 pontos do 1º para o 2º turno, enquanto no resto do país subiu 2.", "O resultado do 2º turno de um estado ficou muito longe do que a mudança dos demais estados indicava."],
  });
  T.V2 = Object.assign(transfTxt("V2"), {
    nome: "Transferência atípica no município", curto: "Compara a mudança do voto de cada município, do 1º para o 2º turno, com a dos demais municípios do estado.",
    m: [
      ["Virada no município", "Mude a parte de A no 2º turno para <b>64%</b>.", "Mais de 10 pontos acima do esperado e raro pelo acaso: anomalia estatística."],
      ["Queda no município", "Mude a parte de A no 2º turno para <b>37%</b>.", "Perder muito além do esperado também sinaliza."],
      ["Apoio do prefeito", "O prefeito, muito popular, fez campanha para A no 2º turno. Mude A para <b>65%</b>.", "Causa legítima, sinal igual. Só a conferência mostra a causa."],
      ["Municípios parecidos", "Os municípios deste estado variam pouco. Mude A para <b>57%</b>.", "Com um grupo homogêneo, 7 pontos ficam como informativo."],
      ["O estado inteiro mudou", "Mude o grupo no 2º turno para <b>60%</b> e A no 2º turno para <b>61%</b>.", "O município acompanhou o estado: nada fora do padrão."],
      ["Mudança pequena", "Mude A no 2º turno para <b>53%</b>.", "3 pontos acima do esperado ficam dentro do padrão."],
    ],
    faq: [
      ["Com quem o município é comparado?", "Com os demais municípios do mesmo estado. A mudança do conjunto deles dá o esperado para o município."],
      ["Municípios pequenos podem sinalizar?", "Só se tiverem 30 votos ou mais nos finalistas em cada turno. Em municípios pequenos, a diferença precisa ser maior para ser rara."],
    ],
    prova: [
      ["O V2 compara o município com:", "Os demais municípios do mesmo estado", "Todos os municípios do país", "As seções do município", "O município vizinho", "O grupo é o estado."],
      ["O que acontece se o estado todo muda 10 pontos?", "O esperado do município muda junto", "Todos os municípios sinalizam", "O teste para", "O município é excluído", "O teste procura quem foge do grupo."],
      ["Apoio de um prefeito popular a um finalista:", "Pode fazer o teste sinalizar por causa legítima", "É fraude", "Não muda votos", "Anula a eleição", "Anomalia não é prova."],
      ["Qual o mínimo de votos nos finalistas por turno?", "30", "1.000", "10", "Não há mínimo", "Abaixo disso, o acaso domina."],
      ["Diferença de 3 pontos para o esperado:", "Fica dentro do esperado", "É anomalia", "É informativo", "Fica fora do teste", "O limite mínimo é 5 pontos."],
      ["O ajuste de Benjamini–Hochberg serve para:", "Controlar os falsos alarmes ao testar milhares de municípios", "Somar votos", "Escolher os finalistas", "Calcular o comparecimento", "Muitos testes geram raridades por acaso."],
    ],
    situ: ["Num município, Flávio Bolsonaro ganhou 15 pontos a mais do que a mudança dos outros municípios do estado indicava.", "A mudança do voto de um município do 1º para o 2º turno ficou muito diferente da dos demais municípios do estado."],
  });
  T.V3 = Object.assign(transfTxt("V3"), {
    nome: "Transferência atípica na seção", curto: "Compara a mudança do voto de cada seção, do 1º para o 2º turno, com a das seções vizinhas.",
    m: [
      ["Virada na seção", "Mude a parte de A no 2º turno para <b>82%</b>.", "Uma seção de 220 votos com 32 pontos acima do esperado é muito rara: anomalia estatística."],
      ["Queda na seção", "Mude a parte de A no 2º turno para <b>18%</b>.", "Também sinaliza quando a parte de A cai muito além do esperado."],
      ["Apoio local", "Um líder comunitário do bairro apoiou A no 2º turno. Mude A para <b>80%</b>.", "Causa legítima e localizada. O teste sinaliza; só a conferência explica."],
      ["Eleitores transferidos", "A seção recebeu, no 2º turno, eleitores de outra seção com perfil diferente. Mude A para <b>20%</b>.", "Mudanças no grupo de eleitores também mudam o resultado da seção."],
      ["Seção pequena", "Mude A no 2º turno para <b>63%</b> (13 pontos acima).", "Em 220 votos, 13 pontos ainda podem vir do acaso: dentro do esperado."],
      ["Muito pequena", "Mude os votos nos finalistas para <b>25</b> e A no 2º turno para <b>90%</b>.", "Com menos de 30 votos, a seção fica fora do teste."],
    ],
    faq: [
      ["Por que uma seção precisa de diferenças maiores?", "Porque tem poucos votos: em 200 votos, o acaso sozinho muda a parte de um candidato vários pontos. O teste leva isso em conta."],
      ["Com quais seções a seção é comparada?", "Com as da mesma zona e município. Quando há poucas, usa o município, a zona ou o estado."],
    ],
    prova: [
      ["O V3 compara a seção com:", "As seções da mesma zona e município", "As seções de outro estado", "O resultado nacional", "As pesquisas", "Quando há poucas, o grupo é ampliado."],
      ["Uma seção de 220 votos com 13 pontos acima do esperado:", "Pode estar dentro do esperado", "Sempre é anomalia", "Fica fora do teste", "É informativo", "Seções pequenas variam mais por acaso."],
      ["Uma seção com 25 votos nos finalistas:", "Fica fora do teste", "Sempre sinaliza", "É informativa", "É excluída da eleição", "O mínimo é 30 em cada turno."],
      ["Eleitores transferidos para a seção entre os turnos podem:", "Mudar o resultado sem nada errado", "Anular a seção", "Zerar os votos", "Não têm efeito", "O perfil dos eleitores muda."],
      ["O teste também precisa que a seção tenha:", "Boletim nos dois turnos", "Biometria", "Mais de 500 eleitores", "Urna nova", "Senão não há o que comparar."],
      ["Sinal no V3 indica:", "Onde vale conferir o boletim e a ata", "Fraude comprovada", "Erro do TSE", "Voto anulado", "Anomalia é ponto de conferência."],
    ],
    situ: ["Numa seção, a parte de Lula nos votos dos finalistas foi de 45% no 1º turno para 80% no 2º, enquanto as seções vizinhas mudaram 3 pontos.", "O resultado do 2º turno de uma seção ficou muito longe do que a mudança das seções vizinhas indicava."],
  });

  // ============================== V4 ==============================
  T.V4 = {
    nome: "Variação atípica do comparecimento", curto: "Procura seções em que o comparecimento subiu ou caiu muito além do esperado e se a variação foi para um só finalista.",
    vis: "Comparecimento da seção e do grupo (1º e 2º turno)",
    vl: ["Seção no 1º turno", "Grupo no 1º turno", "Grupo no 2º turno", "Esperado no 2º turno", "Seção no 2º turno"],
    campos: { ap: "Eleitores aptos", c1: "Comparecimento no 1º turno", c2: "Comparecimento no 2º turno", g1: "Comparecimento do grupo, 1º turno (%)", g2: "Comparecimento do grupo, 2º turno (%)",
      sa: "Parte de A na seção (%)", dirA: "Parte da variação que foi para A (%)", var: "Quanto as seções do grupo variam" },
    op: { var: opVar("Seções") },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return ["Fora do teste: a seção tem menos de 20 eleitores aptos."];
      const out = [`O comparecimento foi de ${f.pct(v.c1 / v.ap)} para <b>${f.pct(v.po)}</b>. Pelo grupo, o esperado era <b>${f.pct(v.pe)}</b> (${f.n(v.dif, 1)} pontos).`];
      out.push(v.dir ? `A variação foi direcionada: ${s.dirA}% dela ficou com ${v.destino === "A" ? "A" : "B"}, bem acima da parte desse finalista na seção.` : "A variação se dividiu entre os finalistas de forma parecida com o voto da seção.");
      if (r.nivel === "anom") out.push("<b>O teste sinaliza:</b> variação grande, rara pelo acaso e para um só lado. Transporte de eleitores, mobilização legítima e mudança de local explicam muitos casos.");
      else if (r.nivel === "info") out.push("Fica como <b>informativo</b>: a variação é grande, mas não foi para um só finalista (ou ficou entre 5 e 10 pontos).");
      else out.push("<b>Dentro do esperado.</b>");
      return out;
    },
    ficha: (s, f) => fichaL([`Seção fictícia com ${s.ap} eleitores aptos`, `Comparecimento: ${s.c1} no 1º turno e ${s.c2} no 2º turno`, `Grupo: de ${s.g1}% para ${s.g2}%`, `${s.dirA}% da variação foi para A (A tem ${s.sa}% na seção)`]),
    kv: (s, r, f) => (r.v.pe == null ? [] : [["Esperado", f.pct(r.v.pe)], ["Observado", f.pct(r.v.po)], ["Diferença", `${f.n(r.v.dif, 1)} p.p.`], ["Direcionada", r.v.dir ? `sim (${r.v.destino})` : "não"]]),
    tec: (s, r, f) => {
      const v = r.v;
      if (r.nivel === "na") return [["Mínimo não atingido", `aptos = ${v.ap} < 20`]];
      return [["Esperado", `p̂ = expit(logit((${v.c1} + 0,5)/(${v.ap} + 1)) + [logit(${s.g2}%) − logit(${s.g1}%)]) = ${f.pct(v.pe, 2)}`], ["Observado", `${v.c2} / ${v.ap} = ${f.pct(v.po, 2)} · ${f.n(v.dif, 1)} p.p.`],
        ["Escore z", `z₀ = ${f.n(v.z0, 2)} · φ = ${f.n(v.phi, 2)} · z = ${f.n(v.z, 2)} · p = ${f.sci(v.lp)}`], ["Benjamini–Hochberg", `q = min(1, p × ${f.n(v.M)}) = ${f.sci(v.lq)}`],
        ["Direção", `excesso = ΔX/ΔC − (X₁+X₂)/(C₁+C₂) = ${f.n(v.exc, 2)}; |ΔC| = ${Math.abs(v.dC)} ≥ 20 e excesso ≥ 0,30 → ${v.dir ? "direcionada" : "não direcionada"}`],
        ["Decisão", `q < 0,01 ${sim(v.sig)} · |dif| ≥ 10 p.p. e direcionada → anomalia; ≥ 5 p.p. → informativo → ${luz(r)}`]];
    },
    m: [
      ["Comparecimento disparou", "Mude o comparecimento do 2º turno para <b>290</b> e a parte da variação que foi para A para <b>95%</b>.", "Subiu muito além do esperado e quase tudo foi para A: anomalia estatística."],
      ["Comparecimento despencou", "Mude o comparecimento do 2º turno para <b>190</b> e a parte da variação de A para <b>95%</b>.", "A queda saiu quase toda dos eleitores de A: variação grande e direcionada."],
      ["Transporte de eleitores", "Um ônibus gratuito levou às urnas eleitores de um bairro que vota em A. Comparecimento <b>288</b>, <b>100%</b> da variação para A.", "Mobilização legítima também sinaliza. Só a conferência mostra a causa."],
      ["Feriado acabou", "Muita gente voltou de viagem no 2º turno. Mude o comparecimento para <b>285</b>, mantendo a divisão igual.", "Variação grande, mas dividida entre os finalistas: fica como informativo."],
      ["A cidade toda foi votar", "Mude o grupo no 2º turno para <b>93%</b>, o comparecimento para <b>282</b> e 100% da variação para A.", "O grupo subiu junto: o esperado sobe e o teste não sinaliza."],
      ["Variação pequena", "Mude o comparecimento para <b>249</b> e 100% da variação para A.", "Só 9 votos a mais: pequeno demais para o teste."],
    ],
    faq: [
      ["O que é variação direcionada?", "É quando a parte da variação do comparecimento que ficou com um finalista supera em 30 pontos a parte dele na seção. Ex.: A tem 50% na seção, mas ficou com 90% dos eleitores a mais."],
      ["Comparecimento maior é ruim?", "Não. Mais eleitores votando é bom. O teste só procura variações fora do padrão das seções vizinhas, para conferência."],
    ],
    prova: [
      ["Para o V4 sinalizar como anomalia, a variação precisa ser:", "Grande, rara pelo acaso e direcionada a um finalista", "Qualquer aumento", "Só uma queda", "De 1 voto", "Os três critérios valem juntos."],
      ["Comparecimento muito maior, dividido igual entre os finalistas:", "Fica como informativo", "É anomalia", "Fica fora do teste", "Anula a seção", "Falta a direção."],
      ["Se o comparecimento sobe em toda a cidade:", "O esperado sobe junto e a seção não sinaliza", "Todas sinalizam", "O teste para", "Vira anomalia", "O teste compara com o grupo."],
      ["Mínimo de eleitores aptos para o V4:", "20 em cada turno", "500", "1", "100.000", "Abaixo disso, fica fora do teste."],
      ["Transporte gratuito de eleitores de um bairro:", "Pode fazer o teste sinalizar por causa legítima", "É sempre fraude", "Não muda o comparecimento", "Muda o 1º turno", "Anomalia não é prova."],
      ["O mínimo de variação de votos para ser direcionada é:", "20 votos", "1 voto", "500 votos", "Não há mínimo", "Variações pequenas não contam."],
    ],
    situ: ["Numa seção, o comparecimento subiu de 70% para 95% do 1º para o 2º turno, e quase todos os novos votos foram para o mesmo finalista.", "O comparecimento de uma seção caiu muito mais do que nas seções vizinhas entre os turnos."],
  };

  // ============================== V5 ==============================
  T.V5 = {
    nome: "Ganho acima do teto de votos disponíveis", curto: "Procura seções em que um finalista ganhou mais votos do que havia disponível sem tirar votos do outro.",
    vis: "Ganho de cada finalista × votos disponíveis (teto)", vl: ["Votos disponíveis (teto)", "Ganho de A", "Ganho de B"],
    campos: { L1: "A no 1º turno", F1: "B no 1º turno", O1: "Demais candidatos no 1º turno", BN1: "Brancos e nulos no 1º turno", c2: "Comparecimento no 2º turno", L2: "A no 2º turno", F2: "B no 2º turno" },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return ["Os votos de A e B no 2º turno passam do comparecimento: corrija os números."];
      const out = [`Teto = demais candidatos (${s.O1}) + brancos e nulos (${s.BN1}) + aumento do comparecimento (${Math.max(0, s.c2 - v.c1)}) = <b>${v.teto}</b>. A ganhou ${f.n(v.gA)} e B ganhou ${f.n(v.gB)}.`];
      if (r.nivel === "info") out.push(`<b>Informativo:</b> ${v.kA ? "A" : "B"} ganhou ${f.n(v.kA ? v.exA : v.exB)} votos acima do teto. Parte dos eleitores do outro finalista mudou de voto. Mudar de voto é legítimo: o registro só mostra onde a mudança foi grande.`);
      else out.push("Nenhum ganho passa do teto em 20 votos e 10% dos votos do outro finalista: dentro do esperado.");
      return out;
    },
    ficha: (s, f) => fichaL([`1º turno: A ${s.L1}, B ${s.F1}, demais ${s.O1}, brancos e nulos ${s.BN1}`, `2º turno: comparecimento ${s.c2}, A ${s.L2}, B ${s.F2}`]),
    kv: (s, r, f) => [["Teto", f.n(r.v.teto)], ["Ganho de A", f.n(r.v.gA)], ["Ganho de B", f.n(r.v.gB)], ["Excesso", f.n(Math.max(r.v.exA, r.v.exB))]],
    tec: (s, r, f) => { const v = r.v; return [["Teto", `O₁ + BN₁ + max(C₂ − C₁, 0) = ${s.O1} + ${s.BN1} + ${Math.max(0, s.c2 - v.c1)} = ${v.teto}`], ["Excesso de A", `(${s.L2} − ${s.L1}) − ${v.teto} = ${v.exA}; ≥ 20 e ≥ 10% × ${s.F1} → ${sim(v.kA)}`],
      ["Excesso de B", `(${s.F2} − ${s.F1}) − ${v.teto} = ${v.exB}; ≥ 20 e ≥ 10% × ${s.L1} → ${sim(v.kB)}`], ["Decisão", `sempre informativo → ${luz(r)}`]]; },
    m: [
      ["A passou do teto", "Mude A no 2º turno para <b>175</b> e B para <b>62</b>.", "A ganhou 75 votos, mas só havia 40 disponíveis: eleitores de B passaram para A. Fica como informativo."],
      ["B passou do teto", "Mude B no 2º turno para <b>170</b> e A para <b>67</b>.", "Vale para os dois finalistas."],
      ["Debate decisivo", "Depois de um debate, eleitores de B mudaram para A. A <b>165</b>, B <b>72</b>.", "Mudar de voto é legítimo. O teste só registra, como informativo."],
      ["Mais gente e troca", "O comparecimento subiu para <b>260</b>; B foi a <b>182</b> e A a <b>68</b>.", "Mesmo com o teto maior, B ganhou além dele."],
      ["Excesso pequeno", "Mude A para <b>155</b> e B para <b>85</b>.", "A passou do teto em 15 votos: abaixo do mínimo de 20, fica dentro do esperado."],
      ["Teto maior", "Mude o comparecimento para <b>300</b>, A para <b>185</b> e B para <b>108</b>.", "50 eleitores a mais aumentam o teto: o ganho de A cabe nele."],
    ],
    faq: [
      ["Por que o V5 é sempre informativo?", "Porque passar do teto só mostra que eleitores trocaram de um finalista para o outro. Isso é legítimo; o registro mostra onde a troca foi grande."],
      ["O que entra no teto?", "Os votos dos demais candidatos e os brancos e nulos do 1º turno, mais o aumento do comparecimento. São os votos que um finalista pode ganhar sem tirar do outro."],
    ],
    prova: [
      ["O teto do V5 é:", "Demais candidatos + brancos e nulos do 1º turno + aumento do comparecimento", "O total de eleitores", "Os votos de B", "O comparecimento do 1º turno", "São os votos disponíveis."],
      ["Ganho acima do teto mostra que:", "Eleitores trocaram de um finalista para o outro", "Houve fraude", "A urna falhou", "O boletim está errado", "É uma troca legítima."],
      ["O V5 sinaliza como:", "Sempre informativo", "Sempre anomalia", "Anomalia se passar de 100 votos", "Fora do teste", "Mudar de voto é legítimo."],
      ["O excesso mínimo para registrar é:", "20 votos e 10% dos votos do outro finalista no 1º turno", "1 voto", "50%", "500 votos", "Os dois mínimos valem juntos."],
      ["Se o comparecimento sobe 50 votos:", "O teto sobe 50 votos", "O teto cai", "Nada muda", "O teste para", "Novos eleitores são votos disponíveis."],
      ["Um excesso de 15 votos acima do teto:", "Fica dentro do esperado", "É anomalia", "É informativo", "Anula a seção", "Abaixo do mínimo de 20."],
    ],
    situ: ["Numa seção, um finalista ganhou do 1º para o 2º turno mais votos do que a soma dos votos dos outros candidatos, brancos, nulos e novos eleitores.", "Os dados mostram que eleitores de um finalista passaram para o outro numa seção."],
  };

  // ============================== V6 ==============================
  T.V6 = {
    nome: "Cadastro alterado entre os turnos", curto: "Procura seções em que o número de eleitores aptos mudou muito entre os turnos ou que têm boletim em um só turno.",
    vis: "Eleitores aptos no 1º e no 2º turno",
    campos: { ap1: "Aptos no 1º turno", ap2: "Aptos no 2º turno", bu1: "Tem boletim no 1º turno", bu2: "Tem boletim no 2º turno" },
    simples(s, r, f) {
      if (r.nivel === "na") return ["A seção não tem boletim em nenhum turno."];
      if (r.cats.length && r.cats[0].c !== "aptos_mudaram") return [`<b>Informativo:</b> a seção tem boletim só no ${s.bu1 ? "1º" : "2º"} turno.`, "Acontece com seções criadas, unidas ou extintas entre os turnos e com seções especiais."];
      const out = [`Os aptos foram de ${s.ap1} para ${s.ap2} (${s.ap2 - s.ap1 >= 0 ? "+" : ""}${s.ap2 - s.ap1}, ${f.pct(r.v.rel)}).`];
      out.push(r.nivel === "info" ? "<b>Informativo:</b> mudança de 20 eleitores ou mais e de 10% ou mais. Voto em trânsito, seções especiais e decisões da Justiça Eleitoral mudam o cadastro." : "Dentro do esperado: pequenas mudanças no cadastro são normais.");
      return out;
    },
    ficha: (s, f) => fichaL([`Aptos: ${s.ap1} no 1º turno e ${s.ap2} no 2º turno`, `Boletim no 1º turno: ${s.bu1 ? "sim" : "não"} · no 2º turno: ${s.bu2 ? "sim" : "não"}`]),
    kv: (s, r, f) => [["Aptos 1º turno", f.n(s.ap1)], ["Aptos 2º turno", f.n(s.ap2)], ["Mudança", `${s.ap2 - s.ap1} (${f.pct(r.v.rel)})`]],
    tec: (s, r, f) => [["Variação", `|${s.ap2} − ${s.ap1}| = ${Math.abs(s.ap2 - s.ap1)}; ≥ 20 e ≥ 10% × ${s.ap1} → ${sim(r.cats.some((c) => c.c === "aptos_mudaram"))}`], ["Boletins", `1º turno ${sim(s.bu1)} · 2º turno ${sim(s.bu2)}`], ["Decisão", `sempre informativo → ${luz(r)}`]],
    m: [
      ["Mais eleitores", "Mude os aptos do 2º turno para <b>345</b>.", "45 eleitores a mais (15%): fica como informativo."],
      ["Sem boletim no 2º turno", "Desmarque <b>Tem boletim no 2º turno</b>.", "Seção com boletim em um só turno fica registrada como informativa."],
      ["Seção especial", "A seção recebeu presos provisórios que votam no 2º turno. Mude os aptos para <b>380</b>.", "Seções especiais mudam o cadastro de forma legítima."],
      ["Voto em trânsito", "Parte dos eleitores pediu voto em trânsito no 2º turno. Mude os aptos para <b>250</b>.", "Quedas também são registradas."],
      ["Mudança pequena", "Mude os aptos do 2º turno para <b>318</b>.", "18 eleitores a mais: abaixo do mínimo de 20."],
      ["Seção grande", "Numa seção de 600 eleitores, mude os aptos do 2º turno para <b>650</b>.", "50 eleitores são só 8%: abaixo de 10%, dentro do esperado."],
    ],
    faq: [
      ["O cadastro pode mudar entre os turnos?", "Pode, por voto em trânsito, seções especiais (presos provisórios, hospitais) e decisões da Justiça Eleitoral. Por isso o V6 é só informativo."],
      ["Por que registrar seção com boletim em um só turno?", "Porque ela não pode ser comparada nos outros testes de variação. O registro ajuda a conferir o motivo."],
    ],
    prova: [
      ["O V6 é:", "Sempre informativo", "Sempre anomalia", "Anomalia acima de 100 eleitores", "Um teste de horário", "Mudanças no cadastro têm causas legítimas."],
      ["O V6 registra mudanças de:", "20 eleitores ou mais e de 10% ou mais", "1 eleitor", "50%", "Qualquer tamanho", "Os dois mínimos valem juntos."],
      ["Uma seção com boletim só no 1º turno:", "É registrada como informativa", "É anulada", "É ignorada", "É anomalia", "Não dá para comparar os turnos."],
      ["Qual destas causas muda o cadastro entre os turnos?", "Voto em trânsito", "Biometria", "Horário de abertura", "Código de carga", "É uma causa legítima."],
      ["Numa seção de 600 eleitores, 50 a mais:", "Fica dentro do esperado (8%)", "É informativo", "É anomalia", "Fica fora do teste", "Abaixo de 10%."],
      ["Para que serve o V6?", "Mostrar onde o cadastro mudou e explicar variações nos outros testes", "Contar votos", "Achar fraude", "Medir biometria", "É um registro de contexto."],
    ],
    situ: ["Uma seção tinha 300 eleitores aptos no 1º turno e 360 no 2º turno.", "Uma seção aparece com boletim de urna só no 1º turno."],
  };

  // ============================== L01 a L14 (critérios preliminares) ==============================
  const regKv = (r, f, fm) => [["Esta seção", fm(r.v.regua.alvo)], ["Mediana da região", fm(r.v.med)], ["Escore z robusto", f.n(r.v.z, 1)]];
  const regTec = (r, f, fm, regra) => [["Região", `40 seções fictícias do município e vizinhas · mediana ${fm(r.v.med)}`], ["Escore z robusto", `z = 0,6745 · (x − mediana) / MAD = ${f.n(r.v.z, 2)}`], ["Regra (preliminar)", regra], ["Decisão", luz(r)]];
  const mn = (f) => (x) => `${f.n(x, 0)} min`, sg = (f) => (x) => `${f.n(x, 0)} s`, pc = (f) => (x) => `${f.n(x, 1)}%`;

  T.L01 = {
    nome: "Votos depois do horário oficial", curto: "Conta os votos gravados no log depois do horário oficial e compara o atraso com o das seções vizinhas.",
    vis: "Quantos minutos depois das 17h cada seção recebeu o último voto (pontos: região; losango: esta seção)",
    campos: { ult: "Hora do último voto (hora local)", napos: "Votos depois das 17h", cidade: "Na cidade" },
    op: { cidade: { pouca: "Pouca fila: as vizinhas fecharam logo", muita: "Muita fila: várias vizinhas fecharam tarde" } },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "ok") return ["Nenhum voto depois do horário oficial (17h, hora local): nada a registrar."];
      const out = [`O último voto foi às <b>${f.hora(s.ult)}</b>, ${f.n(v.at, 0)} minutos depois das 17h, com ${s.napos} votos depois do horário. Nas seções vizinhas, a mediana foi de ${f.n(v.med, 0)} minutos.`];
      out.push(r.nivel === "anom" ? "<b>O teste sinaliza:</b> votos muito depois do horário e fora do padrão das vizinhas. Fila longa, atraso na abertura e troca de urna explicam casos; a ata registra a distribuição de senhas."
        : "<b>Informativo:</b> quem estava na fila às 17h pode votar. O log não mostra se havia fila.");
      return out;
    },
    ficha: (s, f) => fichaL([`Último voto às ${f.hora(s.ult)} (hora local); ${s.napos} votos depois das 17h`, s.cidade === "muita" ? "Na cidade, várias seções fecharam tarde" : "Na cidade, as seções fecharam logo depois das 17h"]),
    kv: (s, r, f) => regKv(r, f, mn(f)),
    tec: (s, r, f) => regTec(r, f, mn(f), `votos depois das 17h → informativo; z ≥ 3,5 e atraso ≥ 60 min → anomalia`),
    m: [
      ["Até de noite", "Mude o último voto para <b>20:10</b> e os votos depois das 17h para <b>80</b>.", "Mais de 3 horas depois, com as vizinhas fechando logo: anomalia estatística."],
      ["Duas horas depois", "Mude só o último voto para <b>19:00</b>.", "Muito além das vizinhas: sinaliza."],
      ["Fila de verdade", "A urna abriu com atraso e a fila foi longa. Último voto às <b>18:30</b>, <b>45</b> votos depois.", "Causa legítima, sinal igual. Só a ata confirma as senhas."],
      ["Fila normal", "Último voto às <b>17:20</b>, com <b>12</b> votos depois das 17h.", "Votar depois do horário com fila é permitido: fica como informativo."],
      ["Cidade toda com fila", "Escolha <b>Muita fila</b>, último voto às <b>18:40</b> e <b>60</b> votos depois.", "Se as vizinhas também fecharam tarde, a seção não foge do padrão: só informativo."],
      ["Quem não estava na fila", "Último voto às <b>17:25</b>, com <b>10</b> votos depois.", "O log não mostra se a pessoa já estava na fila: o teste não tem como ver isso."],
    ],
    faq: [["Votar depois das 17h é permitido?", "Sim, para quem já estava na fila às 17h. A mesa distribui senhas. Por isso votos depois do horário são, em geral, só informativos."],
      ["Qual horário vale no 2º turno?", "Em 2026, o encerramento do 2º turno foi estendido até as 19h de Brasília. O teste usa o horário oficial de cada turno, convertido para a hora local."]],
    prova: [
      ["Votos depois do horário, com fila:", "Ficam como informativo", "São sempre anomalia", "São anulados", "Ficam fora do teste", "Quem estava na fila pode votar."],
      ["O L01 sinaliza anomalia quando:", "A urna recebe votos muito depois do horário, fora do padrão das vizinhas", "Há 1 voto depois das 17h", "A urna abre às 8h", "Há biometria", "Precisa do atraso e do contraste com a região."],
      ["O log mostra se a pessoa estava na fila?", "Não", "Sim", "Só no 2º turno", "Só com biometria", "A ata registra as senhas."],
      ["Se toda a cidade fechou tarde:", "A seção não foge do padrão e não vira anomalia", "Todas viram anomalia", "O teste para", "Os votos são anulados", "O teste compara com as vizinhas."],
      ["O L01 usa a hora:", "Local do município, convertida do horário oficial", "Sempre de Brasília", "Do celular do mesário", "Do TSE", "Cada município tem seu fuso."],
      ["Qual destas causas explica votos muito tarde?", "Abertura atrasada e fila longa", "Biometria boa", "Urna nova", "Zerésima", "É uma causa legítima."],
    ],
    situ: ["O log de uma urna mostra votos sendo gravados até as 20h, enquanto as urnas vizinhas fecharam por volta das 17h10.", "Uma seção teve 40 votos gravados depois do horário oficial de encerramento."],
  };
  T.L02 = {
    nome: "Tempo de cada voto (votos rápidos e em rajada)", curto: "Mede o tempo entre um voto e o seguinte e procura rajadas de votos sem digital.",
    vis: "Tempo mediano entre votos (pontos: região; losango: esta seção)",
    campos: { raj: "Maior rajada (votos seguidos com 30 s ou menos)", semdig: "A rajada foi liberada sem digital", med: "Tempo mediano entre votos (segundos)" },
    simples(s, r, f) {
      const out = [`A maior rajada tem <b>${s.raj}</b> votos seguidos com 30 segundos ou menos entre eles${s.raj ? (s.semdig ? ", liberados sem digital" : ", com digital") : ""}. O tempo mediano entre votos é ${s.med} s (região: ${f.n(r.v.med, 0)} s).`];
      if (r.cats.some((c) => c.c === "rajada")) out.push("<b>O teste sinaliza:</b> 5 ou mais votos seguidos em 30 s ou menos, sem digital. Leitor biométrico com defeito e eleitores rápidos explicam casos; o log não mostra quem estava na cabine.");
      else if (r.nivel === "info") out.push("<b>Informativo:</b> o tempo mediano está muito abaixo da região. Cédula curta e eleitores rápidos encurtam o tempo.");
      else out.push("Dentro do esperado.");
      return out;
    },
    ficha: (s, f) => fichaL([`Maior rajada: ${s.raj} votos seguidos com 30 s ou menos${s.semdig ? ", sem digital" : ", com digital"}`, `Tempo mediano entre votos: ${s.med} s`]),
    kv: (s, r, f) => [["Maior rajada", `${s.raj}`], ["Sem digital", s.semdig ? "sim" : "não"]].concat(regKv(r, f, sg(f))),
    tec: (s, r, f) => [["Rajada", `${s.raj} ≥ 5 e sem digital → ${sim(s.raj >= 5 && s.semdig)} (anomalia)`]].concat(regTec(r, f, sg(f), "z ≤ −3,5 no tempo mediano → informativo")),
    m: [
      ["Rajada curta", "Mude a maior rajada para <b>6</b> e marque <b>sem digital</b>.", "6 votos em sequência rápida, sem digital: anomalia estatística."],
      ["Rajada longa", "Mude a maior rajada para <b>15</b>, sem digital.", "Quanto maior a rajada sem digital, mais rara."],
      ["Leitor quebrado", "O leitor de digital quebrou e 5 eleitores rápidos votaram em seguida. Rajada <b>5</b>, sem digital.", "Causa legítima, sinal igual. A ata registra a falha do leitor."],
      ["Eleitores rápidos", "Seção de eleitores jovens: mude o tempo mediano para <b>35 s</b>.", "Muito abaixo da região: fica como informativo."],
      ["Quase rajada", "Mude a rajada para <b>4</b>, sem digital.", "Abaixo de 5 votos, o teste não sinaliza."],
      ["Rápidos com digital", "Mude a rajada para <b>10</b>, <b>com digital</b>.", "Votos rápidos com a digital de cada eleitor não sinalizam."],
    ],
    faq: [["Por que 30 segundos?", "É menos do que o tempo normal para votar em todos os cargos. Votos seguidos tão rápidos, sem digital, merecem conferência."],
      ["O teste vê quem votou?", "Não. O log mostra a hora de cada voto e se houve digital, não quem estava na cabine nem em quem votou."]],
    prova: [
      ["O L02 sinaliza anomalia quando há:", "5 ou mais votos seguidos com 30 s ou menos, sem digital", "1 voto rápido", "Votos com digital", "Fila", "Rajada sem digital."],
      ["Rajada de votos rápidos com digital:", "Não sinaliza", "É anomalia", "É informativo", "Anula a urna", "Cada eleitor se identificou."],
      ["Tempo mediano muito abaixo da região fica como:", "Informativo", "Anomalia", "Fora do teste", "Erro", "Pode ter causa legítima."],
      ["O que pode explicar uma rajada sem digital?", "Leitor biométrico com defeito", "Zerésima", "Código de carga", "Fuso horário", "O mesário libera pelo código."],
      ["Uma rajada de 4 votos sem digital:", "Não sinaliza", "É anomalia", "É informativo", "Fica fora do teste", "O mínimo é 5."],
      ["O log mostra em quem foi o voto?", "Não", "Sim", "Só na rajada", "Só no 2º turno", "Mostra só a hora e os eventos."],
    ],
    situ: ["O log de uma urna mostra 8 votos seguidos com 20 segundos entre eles, todos liberados sem digital.", "Numa seção, o tempo entre um voto e o seguinte é muito menor que nas seções vizinhas."],
  };
  T.L03 = {
    nome: "Liberações sem digital em sequência", curto: "Procura sequências longas de eleitores liberados sem a digital, pelo código do mesário.",
    vis: "Resumo do log da seção",
    campos: { seq: "Maior sequência de liberações sem digital", bio: "Eleitores com biometria cadastrada (%)", falha: "O log registra falha do leitor no período" },
    simples(s, r) {
      if (r.nivel === "na") return [`Fora do teste: só ${s.bio}% dos eleitores têm biometria cadastrada. Sem biometria, liberar pelo código é o normal (ex.: no exterior).`];
      const out = [`A maior sequência de eleitores liberados sem digital é de <b>${s.seq}</b>.`];
      if (r.nivel === "anom") out.push("<b>O teste sinaliza:</b> 10 ou mais liberações seguidas sem digital, sem falha registrada do leitor. Dedos gastos e leitor com defeito explicam casos; só a ata confirma.");
      else if (r.nivel === "info") out.push("<b>Informativo:</b> a sequência coincide com uma falha do leitor registrada no log.");
      else out.push("Dentro do esperado: algumas liberações sem digital são normais.");
      return out;
    },
    ficha: (s) => fichaL([`Maior sequência sem digital: ${s.seq}`, `Eleitores com biometria: ${s.bio}%`, `Falha do leitor no log: ${s.falha ? "sim" : "não"}`]),
    kv: (s) => [["Maior sequência", String(s.seq)], ["Com biometria", `${s.bio}%`], ["Falha do leitor", s.falha ? "sim" : "não"]],
    tec: (s, r) => [["Elegível", `biometria ${s.bio}% ≥ 50% → ${sim(s.bio >= 50)}`], ["Sequência", `${s.seq} ≥ 10 → ${sim(s.seq >= 10)}`], ["Falha registrada", sim(s.falha)], ["Decisão (preliminar)", `sequência sem falha → anomalia; com falha → informativo → ${luz(r)}`]],
    m: [
      ["Sequência longa", "Mude a maior sequência para <b>12</b>.", "12 eleitores seguidos sem digital, sem falha do leitor: anomalia estatística."],
      ["Sequência muito longa", "Mude a sequência para <b>40</b>.", "Quanto mais longa, mais rara."],
      ["Digitais gastas", "Um grupo de trabalhadores rurais com digitais gastas votou em seguida. Sequência <b>10</b>.", "Causa legítima, sinal igual."],
      ["Leitor quebrou", "O leitor quebrou e o log registrou a falha. Sequência <b>30</b> e marque a falha.", "Com a falha registrada, fica como informativo."],
      ["Quase", "Mude a sequência para <b>9</b>.", "Abaixo de 10, não sinaliza."],
      ["Seção no exterior", "Só 20% dos eleitores têm biometria. Mude a biometria para <b>20%</b> e a sequência para <b>50</b>.", "Sem biometria cadastrada, liberar pelo código é o normal: fora do teste."],
    ],
    faq: [["O que é liberar sem digital?", "Quando a digital não é reconhecida, o mesário libera o eleitor digitando um código, depois de conferir o documento. É previsto."],
      ["Por que olhar sequências?", "Uma liberação sem digital isolada é comum. Muitas seguidas, sem falha do leitor, merecem conferência na ata."]],
    prova: [
      ["O L03 sinaliza anomalia com:", "10 ou mais liberações seguidas sem digital, sem falha do leitor", "1 liberação sem digital", "Votos com digital", "Fila", "A sequência é o sinal."],
      ["Se o log registra falha do leitor no período:", "Fica como informativo", "Vira anomalia grave", "O teste para", "Anula a seção", "A falha explica a sequência."],
      ["Seção com 20% de eleitores com biometria:", "Fica fora do teste", "Sempre sinaliza", "É informativa", "É anulada", "Sem biometria, liberar pelo código é normal."],
      ["Quem libera o eleitor sem digital?", "O mesário, com um código, depois de conferir o documento", "O próprio eleitor", "O TSE", "Ninguém", "É procedimento previsto."],
      ["Uma sequência de 9:", "Não sinaliza", "É anomalia", "É informativo", "Fica fora do teste", "O mínimo é 10."],
      ["O que pode explicar sequências sem digital?", "Digitais gastas e leitor com defeito", "Zerésima", "Fuso", "Código de carga", "São causas legítimas."],
    ],
    situ: ["O log de uma seção mostra 25 eleitores seguidos liberados pelo código do mesário, sem a digital, sem falha do leitor registrada.", "Numa seção onde quase todos têm biometria, uma longa sequência de votos foi liberada sem digital."],
  };
  T.L04 = {
    nome: "Votos depois do “todos já votaram? SIM”", curto: "Confere se a urna gravou votos depois de o mesário confirmar, no encerramento, que todos já votaram.",
    vis: "Linha do tempo do encerramento (hora local)",
    campos: { resp: "Resposta do mesário", depois: "Votos gravados depois da resposta", registra: "Esta urna registra a pergunta no log" },
    op: { resp: { sim: "SIM (todos já votaram)", nao: "NÃO (ainda há eleitores)" } },
    marcas: (s, r) => { const H = window.SIMM.H; const m = [{ t: H(8), k: "o", rot: "abertura" }, { t: H(17, 5), k: "o", rot: `pergunta: ${s.resp === "sim" ? "SIM" : "NÃO"}` }]; if (s.depois) m.push({ t: H(17, 12), k: r.nivel === "anom" ? "x" : "i", rot: `${s.depois} voto(s)` }); return m; },
    simples(s, r) {
      if (r.nivel === "na") return ["Fora do teste: esta urna não registra a pergunta no log, então não há como saber a hora da resposta."];
      if (r.nivel === "anom") return [`<b>O teste sinaliza:</b> ${s.depois} voto(s) gravado(s) depois de o mesário responder SIM. Depois dessa resposta, a votação deveria terminar.`, "Pode ser engano do mesário ao responder; a ata registra o encerramento."];
      if (r.nivel === "info") return [`O mesário respondeu NÃO e a votação seguiu com ${s.depois} voto(s): <b>informativo</b>. Retomar a votação é previsto.`];
      return ["Nenhum voto depois da resposta: tudo em ordem."];
    },
    ficha: (s) => fichaL([`Resposta à pergunta “todos já votaram?”: ${s.resp === "sim" ? "SIM" : "NÃO"}`, `Votos gravados depois: ${s.depois}`, `A urna registra a pergunta no log: ${s.registra ? "sim" : "não"}`]),
    kv: (s) => [["Resposta", s.resp === "sim" ? "SIM" : "NÃO"], ["Votos depois", String(s.depois)]],
    tec: (s, r) => [["Registro", sim(s.registra)], ["Regra (preliminar)", "voto depois de SIM → anomalia; depois de NÃO → informativo"], ["Decisão", luz(r)]],
    m: [
      ["Um voto a mais", "Mude os votos depois da resposta para <b>1</b>.", "Qualquer voto depois do SIM sinaliza."],
      ["Muitos votos depois", "Mude para <b>15</b> votos.", "A votação seguiu depois de o mesário dizer que todos já tinham votado."],
      ["Engano do mesário", "O mesário respondeu SIM por engano e 2 eleitores da fila votaram. Mude para <b>2</b>.", "Causa explicável, sinal igual. A ata registra."],
      ["Ainda havia fila", "Escolha <b>NÃO</b> e mude os votos depois para <b>3</b>.", "Com NÃO, retomar é previsto: informativo."],
      ["Urna que não registra", "Desmarque <b>Esta urna registra a pergunta</b> e mude os votos depois para 5.", "Sem o registro, o teste não tem como ver: fora do teste."],
      ["Fila longa com NÃO", "Escolha <b>NÃO</b> e mude para <b>20</b> votos.", "Mesmo com muitos votos, depois do NÃO é só informativo."],
    ],
    faq: [["O que é a pergunta “todos já votaram?”", "No encerramento, a urna pergunta ao mesário se todos os eleitores presentes já votaram. Com SIM, a votação termina; com NÃO, continua."],
      ["Todas as urnas registram essa pergunta?", "Depende do modelo e do programa. Onde não há registro, o teste não avalia."]],
    prova: [
      ["Voto gravado depois da resposta SIM:", "É anomalia", "É informativo", "É normal", "Fica fora do teste", "Depois do SIM, a votação acaba."],
      ["Votos depois da resposta NÃO:", "São informativos", "São anomalia", "São anulados", "São proibidos", "Retomar é previsto."],
      ["Se a urna não registra a pergunta:", "O caso fica fora do teste", "Sempre sinaliza", "É informativo", "É anomalia", "Não há como saber a hora."],
      ["O que pode explicar um voto depois do SIM?", "Engano do mesário ao responder", "Biometria", "Zerésima", "Fuso", "A ata registra."],
      ["Com SIM, a votação:", "Termina", "Continua", "Recomeça", "Muda de urna", "É o encerramento."],
      ["O L04 é um teste:", "De ordem de eventos no log", "De votos por candidato", "De biometria", "De cadastro", "Confere a sequência do encerramento."],
    ],
    situ: ["O log mostra que o mesário confirmou que todos já tinham votado e, depois disso, a urna gravou mais 3 votos.", "Uma urna gravou votos depois da confirmação de encerramento da votação."],
  };
  T.L05 = {
    nome: "Falta de energia e interrupções", curto: "Encontra quedas de energia, desligamentos e reinícios da urna durante a votação.",
    vis: "Linha do tempo das interrupções (hora local)",
    campos: { quedas: "Reinícios / quedas de energia", min: "Minutos parada no total", dentro: "Há voto com hora dentro de uma interrupção" },
    marcas: (s, r) => { const H = window.SIMM.H, m = []; for (let i = 0; i < s.quedas; i++) m.push({ t: H(9 + 2 * i, 30), k: s.quedas >= 3 ? "x" : "i", rot: `queda ${i + 1}` }); if (s.dentro && s.quedas) m.push({ t: H(9, 35), k: "x", rot: "voto" }); return m; },
    simples(s, r) {
      if (r.nivel === "ok") return ["Nenhuma interrupção registrada."];
      const out = [`O log registra ${s.quedas} interrupção(ões), ${s.min} minutos parada no total.`];
      if (r.cats.some((c) => c.c === "voto_desligada")) out.push("<b>O teste sinaliza:</b> há voto com hora dentro do período em que a urna estava desligada. Isso não deveria acontecer; relógio desregulado é uma explicação possível.");
      else if (r.nivel === "anom") out.push("<b>O teste sinaliza:</b> 3 reinícios ou mais. Temporais e rede elétrica instável explicam casos; a ata registra.");
      else out.push("<b>Informativo:</b> queda de energia acontece. A bateria da urna mantém a votação.");
      return out;
    },
    ficha: (s) => fichaL([`Interrupções: ${s.quedas} · ${s.min} minutos parada`, `Voto com hora dentro de uma interrupção: ${s.dentro ? "sim" : "não"}`]),
    kv: (s) => [["Interrupções", String(s.quedas)], ["Minutos parada", String(s.min)], ["Voto durante", s.dentro ? "sim" : "não"]],
    tec: (s, r) => [["Regra (preliminar)", "voto durante interrupção ou 3+ reinícios → anomalia; 1–2 interrupções → informativo"], ["Decisão", luz(r)]],
    m: [
      ["Voto no escuro", "Marque <b>1</b> interrupção e <b>Há voto dentro de uma interrupção</b>.", "Voto com hora em que a urna estava desligada: anomalia."],
      ["Muitos reinícios", "Mude para <b>3</b> reinícios.", "3 ou mais reinícios sinalizam."],
      ["Temporal", "Um temporal derrubou a luz 4 vezes. Mude para <b>4</b> quedas.", "Causa legítima, sinal igual."],
      ["Uma queda", "Mude para <b>1</b> queda de <b>20</b> minutos.", "Uma queda é informativa."],
      ["Duas quedas", "Mude para <b>2</b> quedas.", "Abaixo de 3, só informativo."],
      ["Parada longa", "Mude para 1 queda de <b>90</b> minutos.", "O tempo parado sozinho não é critério: informativo."],
    ],
    faq: [["A urna funciona sem luz?", "Sim, tem bateria. Mesmo assim, quedas e reinícios ficam registrados no log."],
      ["Por que voto durante a interrupção é grave?", "Porque a urna desligada não grava votos. Um voto com hora nesse intervalo indica relógio errado ou registro a conferir."]],
    prova: [
      ["Voto com hora dentro de uma interrupção:", "É anomalia", "É normal", "É informativo", "Fica fora do teste", "A urna desligada não grava votos."],
      ["Uma queda de energia:", "É informativa", "É anomalia", "Anula a seção", "Não é registrada", "Acontece."],
      ["Quantos reinícios sinalizam anomalia?", "3 ou mais", "1", "10", "Nenhum", "Muitos reinícios merecem conferência."],
      ["A urna funciona sem energia elétrica?", "Sim, com bateria", "Não", "Só no 2º turno", "Só de manhã", "A bateria mantém a votação."],
      ["90 minutos parada, sem voto durante:", "Informativo", "Anomalia", "Fora do teste", "Anulação", "O tempo sozinho não é critério."],
      ["O que pode explicar muitas quedas?", "Temporal e rede elétrica instável", "Biometria", "Zerésima", "Carga", "Causas legítimas."],
    ],
    situ: ["O log de uma urna mostra quatro desligamentos e religamentos durante a votação.", "Um voto aparece gravado com hora em que, pelo log, a urna estava desligada."],
  };
  T.L06 = {
    nome: "Troca de urna", curto: "Confere as trocas de urna durante a votação e se os votos das urnas somam o comparecimento do boletim.",
    vis: "Votos no log de cada urna × boletim",
    campos: { troca: "Houve troca de urna", v1: "Votos no log da urna original", v2: "Votos no log da urna substituta", comp: "Comparecimento no boletim", depois: "Votos na urna original depois da troca" },
    simples(s, r, f) {
      const v = r.v, out = [`Votos nos logs: ${s.v1}${s.troca ? ` + ${s.v2} = ${v.tot}` : ""}; comparecimento no boletim: ${s.comp}.`];
      if (r.cats.some((c) => c.c === "soma_log_bu")) out.push(`<b>O teste sinaliza:</b> diferença de ${v.dif > 0 ? "+" : ""}${v.dif} entre os logs e o boletim.`);
      if (r.cats.some((c) => c.c === "voto_original_apos")) out.push("<b>O teste sinaliza:</b> voto gravado na urna original depois da troca.");
      if (r.nivel === "info") out.push("<b>Informativo:</b> troca de urna registrada, com a soma certa. Troca é prevista quando a urna falha; a ata registra o motivo.");
      if (r.nivel === "ok") out.push("Sem troca e com a soma certa.");
      if (r.nivel === "anom") out.push("A causa precisa ser conferida na ata: votação em cédula durante a troca, por exemplo, não aparece no log.");
      return out;
    },
    ficha: (s) => fichaL([s.troca ? `Troca de urna: ${s.v1} votos na original e ${s.v2} na substituta` : `Sem troca: ${s.v1} votos no log`, `Comparecimento no boletim: ${s.comp}`, s.troca ? `Votos na original depois da troca: ${s.depois}` : ""].filter(Boolean)),
    kv: (s, r) => [["Soma dos logs", String(r.v.tot)], ["Boletim", String(s.comp)], ["Diferença", String(r.v.dif)]],
    tec: (s, r) => [["Soma", `${s.v1}${s.troca ? ` + ${s.v2}` : ""} = ${r.v.tot}; boletim ${s.comp}; diferença ${r.v.dif}`], ["Regra (preliminar)", "soma ≠ boletim ou voto na original depois da troca → anomalia; troca registrada → informativo"], ["Decisão", luz(r)]],
    m: [
      ["Soma maior", "Marque a troca, <b>120</b> votos na original e <b>130</b> na substituta.", "250 votos nos logs e 240 no boletim: anomalia."],
      ["Voto depois da troca", "Marque a troca, 120 + 120 votos e <b>2</b> votos na original depois da troca.", "A urna original não deveria receber votos depois de trocada."],
      ["Cédula na troca", "Durante a troca, eleitores votaram em cédula. Logs: <b>110</b> + <b>118</b>.", "Os votos em cédula não estão no log: a soma fica menor. Causa legítima, sinal igual."],
      ["Troca oficial", "Marque a troca, <b>100</b> na original e <b>140</b> na substituta.", "Soma certa: troca prevista, só informativo."],
      ["Troca bem feita", "Marque a troca, <b>90</b> + <b>150</b>.", "O L06 confere quantidades, não em quem foram os votos."],
      ["Log e boletim iguais a mais", "Mude o log da original e o boletim para <b>260</b>.", "Se log e boletim têm o mesmo número, o teste não vê diferença. Outros testes comparam com o cadastro."],
    ],
    faq: [["Trocar a urna é irregular?", "Não. Se a urna falha, a mesa usa uma urna de contingência. A troca e o motivo ficam na ata e no log."],
      ["O que o L06 soma?", "Os votos concluídos no log de cada urna usada na seção, e compara com o comparecimento do boletim."]],
    prova: [
      ["Troca de urna com a soma certa:", "Informativo", "Anomalia", "Fora do teste", "Anulação", "É prevista."],
      ["Soma dos logs diferente do boletim:", "Anomalia", "Normal", "Informativo", "Ignorada", "Os números deveriam bater."],
      ["Voto na urna original depois da troca:", "Anomalia", "Normal", "Informativo", "Fora do teste", "Ela já foi substituída."],
      ["O L06 confere em quem foram os votos?", "Não, confere quantidades", "Sim", "Só de Presidente", "Só na substituta", "O log não mostra o candidato."],
      ["Votos em cédula durante a troca:", "Não aparecem no log e podem gerar diferença", "Aparecem no log", "São anulados", "São proibidos", "A ata registra."],
      ["Onde fica o motivo da troca?", "Na ata da mesa", "No log", "No boletim", "Na zerésima", "O log não diz o motivo."],
    ],
    situ: ["Os logs da urna original e da substituta somam 250 votos, mas o boletim registra 240 eleitores que votaram.", "O log mostra a troca da urna no meio da votação, com a soma dos votos batendo com o boletim."],
  };
  T.L07 = {
    nome: "Tentativas repetidas (já votou, não encontrado, impedido)", curto: "Conta tentativas de liberar eleitores que já votaram, não foram encontrados ou estão impedidos, e compara com as seções vizinhas.",
    vis: "Tentativas a cada 100 eleitores (pontos: região; losango: esta seção)",
    campos: { tent: "Tentativas (já votou, não encontrado, impedido)", el: "Eleitores que votaram", seguidas: "3 ou mais tentativas seguidas com o mesmo resultado" },
    simples(s, r, f) {
      const out = [`${s.tent} tentativas em ${s.el} eleitores: <b>${f.n(r.v.tx, 1)}%</b> (região: ${f.n(r.v.med, 1)}%).`];
      if (r.nivel === "anom") out.push("<b>O teste sinaliza:</b> muito acima das vizinhas. Eleitores que mudaram de seção e erro ao digitar o título explicam casos.");
      else if (r.nivel === "info") out.push("<b>Informativo:</b> 3 tentativas seguidas com o mesmo resultado, por exemplo, número do título digitado errado.");
      else out.push(s.tent < 5 ? "Dentro do esperado: com menos de 5 tentativas o teste não sinaliza." : "Dentro do esperado.");
      return out;
    },
    ficha: (s) => fichaL([`${s.tent} tentativas (já votou, não encontrado, impedido) em ${s.el} eleitores`, `Tentativas seguidas com o mesmo resultado: ${s.seguidas ? "sim" : "não"}`]),
    kv: (s, r, f) => regKv(r, f, pc(f)),
    tec: (s, r, f) => [["Taxa", `${s.tent} / ${s.el} = ${f.n(r.v.tx, 2)}%`]].concat(regTec(r, f, pc(f), "z ≥ 3,5 e 5+ tentativas → anomalia; 3 seguidas → informativo")),
    m: [
      ["Muitas tentativas", "Mude as tentativas para <b>30</b>.", "12% dos eleitores, muito acima das vizinhas: anomalia."],
      ["Seção menor", "Numa seção de 150 eleitores, mude para <b>12</b> tentativas.", "8%: muito acima da região."],
      ["Seção transferida", "Muitos eleitores foram mudados de seção e vieram à antiga. Mude para <b>25</b>.", "Causa legítima, sinal igual."],
      ["Erro de digitação", "Marque <b>3 tentativas seguidas</b>.", "Um título digitado errado gera tentativas seguidas: informativo."],
      ["Poucas tentativas", "Mude para <b>4</b> tentativas e 60 eleitores.", "Mesmo com taxa alta, menos de 5 tentativas não sinalizam."],
      ["Seção grande", "Numa seção de 700 eleitores, mude para <b>10</b> tentativas.", "1,4%: dentro do padrão da região."],
    ],
    faq: [["O log mostra o nome do eleitor?", "Não. Mostra o tipo de mensagem (já votou, não encontrado, impedido) e a hora."],
      ["Por que comparar com as vizinhas?", "Porque erros de digitação e mudanças de seção acontecem em todo lugar. O teste procura seções muito fora do padrão local."]],
    prova: [
      ["O L07 sinaliza anomalia quando:", "A taxa está muito acima das vizinhas e há 5+ tentativas", "Há 1 tentativa", "Há biometria", "Há fila", "Os dois critérios juntos."],
      ["3 tentativas seguidas com o mesmo resultado:", "Informativo", "Anomalia", "Fora do teste", "Anulação", "Ex.: título digitado errado."],
      ["O log mostra o nome do eleitor?", "Não", "Sim", "Só se já votou", "Só no 2º turno", "Mostra o tipo de mensagem."],
      ["4 tentativas numa seção pequena:", "Não sinalizam", "São anomalia", "São informativas", "Anulam a seção", "O mínimo é 5."],
      ["O que pode explicar muitas tentativas?", "Eleitores mudados de seção", "Zerésima", "Fuso", "Código de carga", "Causa legítima."],
      ["A comparação usa:", "O escore z robusto com as seções vizinhas", "A média do país", "O 1º turno de 2022", "Pesquisas", "É o padrão local."],
    ],
    situ: ["Numa seção, o log mostra 30 tentativas de liberar eleitores que já tinham votado ou não estavam na lista, contra 2 ou 3 nas vizinhas.", "O mesário digitou três vezes o mesmo título e recebeu “eleitor não encontrado”."],
  };
  T.L08 = {
    nome: "Votos não concluídos", curto: "Conta os votos que começaram e não terminaram e compara com as seções vizinhas.",
    vis: "Votos não concluídos a cada 100 eleitores (pontos: região; losango: esta seção)",
    campos: { nc: "Votos não concluídos", el: "Eleitores que votaram" },
    simples(s, r, f) {
      const out = [`${s.nc} votos não concluídos em ${s.el} eleitores: <b>${f.n(r.v.tx, 1)}%</b> (região: ${f.n(r.v.med, 1)}%).`];
      out.push(r.nivel === "anom" ? "<b>O teste sinaliza:</b> muito acima das vizinhas. Eleitores com dificuldade e teclado com defeito explicam casos." : s.nc < 5 ? "Dentro do esperado: com menos de 5 casos o teste não sinaliza." : "Dentro do esperado.");
      return out;
    },
    ficha: (s) => fichaL([`${s.nc} votos não concluídos em ${s.el} eleitores`]),
    kv: (s, r, f) => regKv(r, f, pc(f)),
    tec: (s, r, f) => [["Taxa", `${s.nc} / ${s.el} = ${f.n(r.v.tx, 2)}%`]].concat(regTec(r, f, pc(f), "z ≥ 3,5 e 5+ casos → anomalia")),
    m: [
      ["Muitos votos interrompidos", "Mude para <b>12</b> votos não concluídos.", "Muito acima das vizinhas: anomalia."],
      ["Seção menor", "Numa seção de 150 eleitores, mude para <b>6</b>.", "4%: muito acima da região."],
      ["Teclado com defeito", "Uma tecla falhava e eleitores desistiram. Mude para <b>10</b>.", "Causa legítima, sinal igual."],
      ["Seção de idosos", "Numa seção de 180 eleitores, muitos idosos, mude para <b>8</b>.", "Dificuldade com a urna também gera votos não concluídos."],
      ["Poucos casos", "Numa seção de 80 eleitores, mude para <b>4</b>.", "Menos de 5 casos não sinalizam."],
      ["Seção grande", "Numa seção de 700 eleitores, mude para <b>5</b>.", "0,7%: dentro do padrão."],
    ],
    faq: [["O que é voto não concluído?", "O eleitor começa a votar e não confirma o último cargo, ou o mesário encerra o voto pendente. O log registra."],
      ["O voto não concluído conta?", "Os cargos já confirmados contam; os que faltavam ficam sem voto. O log não mostra em quem."]],
    prova: [
      ["O L08 sinaliza anomalia com:", "Taxa muito acima das vizinhas e 5+ casos", "1 caso", "Biometria", "Fila", "Os dois critérios juntos."],
      ["O que pode explicar votos não concluídos?", "Eleitores com dificuldade e teclado com defeito", "Zerésima", "Fuso", "Carga", "Causas legítimas."],
      ["4 casos numa seção de 80 eleitores:", "Não sinalizam", "São anomalia", "São informativos", "Anulam a seção", "O mínimo é 5."],
      ["O log mostra em quem seria o voto?", "Não", "Sim", "Só no Presidente", "Só no 2º turno", "Mostra só o evento."],
      ["A comparação usa:", "As seções do município e vizinhas", "O país inteiro", "Pesquisas", "O 1º turno de 2022", "É o padrão local."],
      ["5 casos numa seção de 700 eleitores:", "Ficam dentro do esperado", "São anomalia", "São informativos", "Ficam fora do teste", "0,7% é comum."],
    ],
    situ: ["Numa seção, 15 eleitores começaram a votar e não concluíram o voto, contra 1 ou 2 nas seções vizinhas.", "O log de uma urna mostra muitos votos interrompidos no meio."],
  };
  T.L09 = {
    nome: "Tentativas de encerramento", curto: "Procura tentativas de encerrar a votação antes do horário ou mais de uma vez.",
    vis: "Tentativas de encerramento (hora local)",
    campos: { t1: "Hora da 1ª tentativa de encerrar", n: "Número de tentativas" },
    marcas: (s, r) => { const H = window.SIMM.H, m = [{ t: s.t1, k: r.nivel === "anom" ? "x" : "o", rot: "1ª tentativa" }]; for (let i = 1; i < s.n; i++) m.push({ t: s.t1 + i * 600, k: "i", rot: `${i + 1}ª` }); return m; },
    simples(s, r, f) {
      if (r.nivel === "anom") return [`<b>O teste sinaliza:</b> tentativa de encerrar às ${f.hora(s.t1)}, antes das 17h (com 2 minutos de tolerância).`, "Tecla apertada por engano gera tentativas canceladas; a ata registra."];
      if (r.nivel === "info") return [`<b>Informativo:</b> ${s.n} tentativas de encerrar depois das 17h. Fila ou engano explicam.`];
      return [`Uma tentativa às ${f.hora(s.t1)}, no horário: tudo em ordem.`];
    },
    ficha: (s, f) => fichaL([`1ª tentativa de encerrar às ${f.hora(s.t1)} (hora local)`, `Tentativas no total: ${s.n}`]),
    kv: (s, r, f) => [["1ª tentativa", f.hora(s.t1)], ["Tentativas", String(s.n)]],
    tec: (s, r, f) => [["Horário", `${f.hora(s.t1)} < 16:58 → ${sim(s.t1 < 17 * 3600 - 120)}`], ["Regra (preliminar)", "antes do horário → anomalia; 2+ tentativas depois → informativo"], ["Decisão", luz(r)]],
    m: [
      ["Antes da hora", "Mude a 1ª tentativa para <b>16:30</b>.", "Tentar encerrar antes das 17h sinaliza."],
      ["Ao meio-dia", "Mude a 1ª tentativa para <b>12:10</b>.", "Muito antes do horário: anomalia."],
      ["Tecla errada", "O mesário apertou a tecla de encerrar por engano às <b>15:00</b> e cancelou. Mude a hora e faça 2 tentativas.", "Engano explicável, sinal igual. A ata registra."],
      ["Fila no fim", "Mude para <b>2</b> tentativas depois das 17h.", "Mais de uma tentativa depois do horário: informativo."],
      ["Encerramento normal", "Mude a 1ª tentativa para <b>17:01</b>, com 1 tentativa.", "No horário: nada a sinalizar."],
      ["Dentro da tolerância", "Mude a 1ª tentativa para <b>16:59</b>.", "Há 2 minutos de tolerância para diferenças de relógio."],
    ],
    faq: [["Por que tolerância de 2 minutos?", "Relógios podem ter pequenas diferenças. É a mesma tolerância do teste 11."],
      ["Tentar encerrar cedo é proibido?", "A votação vai até o horário oficial. Uma tentativa antes, mesmo cancelada, merece conferência na ata."]],
    prova: [
      ["Tentativa de encerrar às 16:30:", "Anomalia", "Normal", "Informativo", "Fora do teste", "Antes do horário."],
      ["Duas tentativas depois das 17h:", "Informativo", "Anomalia", "Normal", "Anulação", "Fila ou engano."],
      ["A tolerância do L09 é de:", "2 minutos", "30 minutos", "1 hora", "Nenhuma", "Igual ao teste 11."],
      ["Tentativa às 16:59:", "Não sinaliza", "É anomalia", "É informativa", "Fica fora do teste", "Dentro da tolerância."],
      ["Uma tentativa cancelada por engano antes da hora:", "Sinaliza, e a ata explica", "Não aparece no log", "Anula a seção", "É ignorada", "O log registra o comando."],
      ["O L09 confere:", "A hora e o número dos comandos de encerramento", "Os votos", "A biometria", "O cadastro", "É um teste de eventos."],
    ],
    situ: ["O log mostra um comando para encerrar a votação às 14h, cancelado em seguida.", "Uma urna registrou três tentativas de encerramento depois das 17h."],
  };
  T.L10 = {
    nome: "Hora da zerésima e da ligação da urna", curto: "Confere a hora da zerésima (o relatório que mostra a urna sem votos) e do primeiro voto.",
    vis: "Linha do tempo da manhã (hora local)",
    campos: { zer: "Hora da zerésima", v1: "Hora do primeiro voto", tem: "A urna imprimiu a zerésima" },
    marcas: (s, r) => { const m = [{ t: s.v1, k: "o", rot: "1º voto" }]; if (s.tem) m.push({ t: s.zer, k: r.nivel === "anom" ? "x" : r.nivel === "info" ? "i" : "o", rot: "zerésima" }); return m; },
    simples(s, r, f) {
      if (!s.tem) return ["<b>O teste sinaliza:</b> não há zerésima no log. Ela é o relatório que mostra que a urna começou sem votos."];
      if (r.nivel === "anom") return [`<b>O teste sinaliza:</b> zerésima às ${f.hora(s.zer)}, depois do primeiro voto (${f.hora(s.v1)}).`];
      if (r.nivel === "info") return [`<b>Informativo:</b> zerésima às ${f.hora(s.zer)}, fora da manhã da eleição (entre 6h e 8h). Urna de contingência imprime a zerésima na hora da troca.`];
      return [`Zerésima às ${f.hora(s.zer)} e primeiro voto às ${f.hora(s.v1)}: em ordem.`];
    },
    ficha: (s, f) => fichaL([s.tem ? `Zerésima às ${f.hora(s.zer)}` : "Sem zerésima no log", `Primeiro voto às ${f.hora(s.v1)}`]),
    kv: (s, r, f) => [["Zerésima", s.tem ? f.hora(s.zer) : "—"], ["1º voto", f.hora(s.v1)]],
    tec: (s, r, f) => [["Ordem", s.tem ? `zerésima ${f.hora(s.zer)} ≤ 1º voto ${f.hora(s.v1)} → ${sim(s.zer <= s.v1)}` : "sem zerésima"], ["Janela", "entre 06:00 e 08:00 → normal; fora → informativo"], ["Decisão (preliminar)", luz(r)]],
    m: [
      ["Zerésima atrasada", "Mude a zerésima para <b>08:20</b> e o primeiro voto para 08:05.", "A zerésima tem de vir antes de qualquer voto."],
      ["Sem zerésima", "Desmarque <b>A urna imprimiu a zerésima</b>.", "Sem zerésima, não há prova de que a urna começou vazia."],
      ["Urna de contingência", "A urna foi trocada às 10h. Mude a zerésima para <b>10:15</b> e o 1º voto para 10:20.", "A substituta imprime a zerésima na hora da troca: informativo."],
      ["Mesários madrugadores", "Mude a zerésima para <b>05:40</b>.", "Antes das 6h fica como informativo."],
      ["Em cima da hora", "Zerésima às <b>07:59</b> e primeiro voto às 08:00.", "Em ordem: nada a sinalizar."],
      ["Primeiro eleitor tarde", "Mude o primeiro voto para <b>09:30</b>.", "Demorar para o primeiro eleitor chegar não é critério."],
    ],
    faq: [["O que é a zerésima?", "É o relatório impresso pela urna antes da votação, mostrando que todos os candidatos estão com zero votos. Os fiscais podem conferir."],
      ["Por que a urna de contingência tem outra hora?", "Porque ela só é ligada quando a original falha; a zerésima dela sai na hora da troca."]],
    prova: [
      ["Zerésima depois do primeiro voto:", "Anomalia", "Normal", "Informativo", "Fora do teste", "Ela tem de vir antes."],
      ["Sem zerésima no log:", "Anomalia", "Normal", "Informativo", "Ignorado", "Não há prova da urna vazia."],
      ["Zerésima às 10:15 numa urna de contingência:", "Informativo", "Anomalia", "Normal", "Anulação", "Foi impressa na troca."],
      ["A zerésima mostra:", "Que a urna começou sem votos", "O resultado", "Os eleitores", "A biometria", "É feita antes da votação."],
      ["Primeiro voto às 9h30:", "Não é critério do teste", "É anomalia", "É informativo", "Anula a urna", "O eleitor pode chegar tarde."],
      ["Zerésima às 05:40:", "Informativo", "Anomalia", "Normal", "Fora do teste", "Antes das 6h."],
    ],
    situ: ["O log de uma urna mostra a zerésima impressa 15 minutos depois do primeiro voto.", "Numa seção, não há registro de zerésima no log da urna."],
  };
  T.L11 = {
    nome: "Relógio da urna", curto: "Verifica se o relógio da urna estava certo e se foi ajustado durante o dia.",
    vis: "Ajustes de relógio no dia (hora local)",
    campos: { dif: "Diferença do relógio (minutos: + adiantado, − atrasado)", ajuste: "Ajuste de data e hora no log" },
    op: { ajuste: { nao: "Nenhum ajuste", fora: "Ajuste antes ou depois da votação", durante: "Ajuste durante a votação" } },
    marcas: (s, r) => { const H = window.SIMM.H; return s.ajuste === "durante" ? [{ t: H(12), k: "x", rot: "ajuste" }] : s.ajuste === "fora" ? [{ t: H(7), k: "i", rot: "ajuste" }] : []; },
    simples(s, r) {
      if (r.nivel === "anom") return ["<b>O teste sinaliza:</b> o relógio foi ajustado durante a votação, com votos antes e depois. Todos os horários do dia ficam difíceis de comparar.", "Pode ser correção de um relógio errado; a ata registra."];
      const out = [`O relógio da urna estava ${Math.abs(s.dif)} minutos ${s.dif >= 0 ? "adiantado" : "atrasado"}.`];
      out.push(r.nivel === "info" ? "<b>Informativo:</b> diferença de 15 minutos ou mais, ou ajuste fora da votação. Relógio errado muda os horários de todos os outros testes." : "Dentro do esperado.");
      return out;
    },
    ficha: (s) => fichaL([`Relógio ${Math.abs(s.dif)} min ${s.dif >= 0 ? "adiantado" : "atrasado"}`, `Ajuste no log: ${({ nao: "nenhum", fora: "fora da votação", durante: "durante a votação" })[s.ajuste]}`]),
    kv: (s) => [["Diferença", `${s.dif} min`], ["Ajuste", ({ nao: "nenhum", fora: "fora", durante: "durante" })[s.ajuste]]],
    tec: (s, r) => [["Diferença", `|${s.dif}| ≥ 15 → ${sim(Math.abs(s.dif) >= 15)}`], ["Regra (preliminar)", "ajuste durante a votação → anomalia; diferença ≥ 15 min ou ajuste fora → informativo"], ["Decisão", luz(r)]],
    m: [
      ["Ajuste no meio do dia", "Escolha <b>Ajuste durante a votação</b>.", "Mudar o relógio com a votação em andamento sinaliza."],
      ["Ajuste e relógio errado", "Ajuste durante a votação e diferença de <b>−30</b> minutos.", "Continua sinalizando."],
      ["Correção do relógio", "O mesário corrigiu um relógio 40 minutos adiantado no meio da votação. Diferença <b>40</b> e ajuste durante.", "Causa explicável, sinal igual."],
      ["Relógio adiantado", "Mude a diferença para <b>20</b> minutos.", "15 minutos ou mais: informativo."],
      ["Atraso pequeno", "Mude a diferença para <b>−10</b> minutos.", "Abaixo de 15 minutos: dentro do esperado."],
      ["Ajuste antes da votação", "Escolha <b>Ajuste antes ou depois da votação</b>.", "Ajuste fora da votação fica como informativo."],
    ],
    faq: [["Por que o relógio importa?", "Porque todos os testes de horário (11, L01, L09, L10) usam a hora da urna. Relógio errado gera alarmes falsos."],
      ["Como se descobre a diferença?", "Comparando a hora do log com a do recebimento pelo TSE e com os demais registros do dia."]],
    prova: [
      ["Ajuste de relógio durante a votação:", "Anomalia", "Normal", "Informativo", "Fora do teste", "Com votos antes e depois."],
      ["Relógio 20 minutos adiantado:", "Informativo", "Anomalia", "Normal", "Anulação", "15 min ou mais."],
      ["Relógio 10 minutos atrasado:", "Dentro do esperado", "Anomalia", "Informativo", "Fora do teste", "Abaixo de 15 min."],
      ["Relógio errado afeta:", "Os testes de horário", "Os votos", "A biometria", "O cadastro", "Eles usam a hora da urna."],
      ["Ajuste antes da votação:", "Informativo", "Anomalia", "Normal", "Anulação", "Fora da votação."],
      ["A diferença do relógio é medida comparando com:", "O recebimento pelo TSE e outros registros", "O celular do eleitor", "Pesquisas", "O 1º turno", "São referências externas."],
    ],
    situ: ["O log mostra que a hora da urna foi mudada às 13h, com votos antes e depois.", "O relógio de uma urna estava 25 minutos adiantado em relação ao horário oficial."],
  };
  T.L12 = {
    nome: "Modelo, versão do software e código de carga", curto: "Confere o modelo da urna, a versão do programa e o código de carga registrados no log.",
    vis: "Dados da urna no log",
    campos: { versao: "Versão do programa", carga: "Código de carga", modelo: "Modelo da urna", bate: "Log e boletim com os mesmos dados", secao: "Seção prevista para esta urna", va: "Votos do Candidato A" },
    op: { versao: { ok: "A oficial", outra: "Outra" }, carga: { ok: "O previsto", outra: "Outro" }, modelo: { prev: "O previsto", outro: "Outro modelo" }, secao: { certa: "Esta seção", outra: "Outra seção" } },
    simples(s, r, f) {
      if (r.nivel === "anom") return [`<b>O teste sinaliza:</b> ${r.cats.map((c) => f.cat(c.c)).join("; ")}.`, "Erro de cadastro e urna de contingência mal registrada explicam casos; a lista oficial e a ata confirmam."];
      if (r.nivel === "info") return ["<b>Informativo:</b> o modelo é diferente do previsto, com versão e carga certas. Urnas de contingência podem ser de outro modelo."];
      return ["Versão, carga e modelo conferem, e log e boletim batem.", "O L12 confere a identidade da urna, não os votos nem a seção (isso é o teste 12)."];
    },
    ficha: (s) => fichaL([`Versão: ${s.versao === "ok" ? "oficial" : "outra"} · carga: ${s.carga === "ok" ? "prevista" : "outra"}`, `Modelo: ${s.modelo === "prev" ? "previsto" : "outro"} · log e boletim: ${s.bate ? "iguais" : "diferentes"}`]),
    kv: (s) => [["Versão", s.versao === "ok" ? "oficial" : "outra"], ["Carga", s.carga === "ok" ? "prevista" : "outra"], ["Modelo", s.modelo === "prev" ? "previsto" : "outro"], ["Log × boletim", s.bate ? "iguais" : "diferentes"]],
    tec: (s, r) => [["Versão", sim(s.versao === "ok")], ["Carga", sim(s.carga === "ok")], ["Log = boletim", sim(s.bate)], ["Modelo previsto", sim(s.modelo === "prev")], ["Decisão (preliminar)", luz(r)]],
    m: [
      ["Versão diferente", "Mude a versão do programa para <b>Outra</b>.", "Programa diferente do oficial sinaliza."],
      ["Log e boletim diferentes", "Desmarque <b>Log e boletim com os mesmos dados</b>.", "Os dois arquivos da mesma urna têm de concordar."],
      ["Erro de cadastro", "A urna de contingência foi registrada com a carga errada. Mude a carga para <b>Outro</b>.", "Causa explicável, sinal igual."],
      ["Contingência de outro modelo", "Mude o modelo para <b>Outro modelo</b>.", "Com versão e carga certas, só informativo."],
      ["Votos mudados", "Passe <b>30</b> votos para A.", "O L12 confere a urna, não os votos."],
      ["Urna de outra seção", "Mude a seção prevista para <b>Outra seção</b>.", "Isso é conferido pelo teste 12, não pelo L12."],
    ],
    faq: [["O que é o código de carga?", "É a identificação da preparação da urna antes da eleição (programa e dados). Tem de bater com a lista oficial."],
      ["Qual a diferença para o teste 12?", "O teste 12 confere se a urna é a prevista para a seção. O L12 confere versão, carga e modelo registrados no log."]],
    prova: [
      ["Versão do programa diferente da oficial:", "Anomalia", "Informativo", "Normal", "Fora do teste", "O programa tem de ser o oficial."],
      ["Modelo diferente, com versão e carga certas:", "Informativo", "Anomalia", "Normal", "Anulação", "Contingência pode ser de outro modelo."],
      ["Log e boletim com dados diferentes:", "Anomalia", "Normal", "Informativo", "Ignorado", "Devem concordar."],
      ["O L12 confere os votos?", "Não", "Sim", "Só do Presidente", "Só no 2º turno", "Confere a identidade da urna."],
      ["Quem confere se a urna é a da seção?", "O teste 12", "O L12", "O V6", "O L01", "É outro teste."],
      ["O código de carga identifica:", "A preparação da urna (programa e dados)", "O eleitor", "O candidato", "O horário", "Tem de bater com a lista."],
    ],
    situ: ["O log de uma urna registra uma versão do programa diferente da versão oficial da eleição.", "O código de carga no log de uma urna não bate com o do boletim."],
  };
  T.L13 = {
    nome: "Biometria detalhada", curto: "Detalha o uso da biometria e compara a liberação sem digital com a das seções vizinhas.",
    vis: "Eleitores liberados sem digital (%) (pontos: região; losango: esta seção)",
    campos: { sem: "Liberados sem digital (%)", quatro: "Eleitores com 4 tentativas ou mais (%)", regiao: "Biometria na região" },
    op: { regiao: { normal: "Normal", ruim: "Ruim (muitas falhas na região)" } },
    simples(s, r, f) {
      const out = [`<b>${s.sem}%</b> dos eleitores foram liberados sem digital (região: ${f.n(r.v.med, 1)}%).`];
      if (r.nivel === "anom") out.push("<b>O teste sinaliza:</b> muito acima das vizinhas. Leitor com defeito e eleitores sem biometria explicam casos; complementa o teste 10.");
      else if (r.nivel === "info") out.push(`<b>Informativo:</b> ${s.quatro}% dos eleitores precisaram de 4 tentativas ou mais. Digitais gastas são comuns em alguns trabalhos.`);
      else out.push("Dentro do padrão da região.");
      return out;
    },
    ficha: (s) => fichaL([`Liberados sem digital: ${s.sem}%`, `Com 4 tentativas ou mais: ${s.quatro}%`, `Biometria na região: ${s.regiao === "ruim" ? "ruim" : "normal"}`]),
    kv: (s, r, f) => regKv(r, f, pc(f)),
    tec: (s, r, f) => regTec(r, f, pc(f), "z ≥ 3,5 na liberação sem digital → anomalia; 4+ tentativas em 20% ou mais → informativo"),
    m: [
      ["Muitos sem digital", "Mude os liberados sem digital para <b>45%</b>.", "Muito acima das vizinhas: anomalia."],
      ["Um quarto sem digital", "Mude para <b>25%</b>.", "Ainda muito acima da região (8%)."],
      ["Leitor com defeito", "O leitor falhou boa parte do dia. Mude para <b>60%</b>.", "Causa legítima, sinal igual."],
      ["Digitais gastas", "Mude os eleitores com 4 tentativas para <b>30%</b>.", "Muitas tentativas, mas reconhecidas: informativo."],
      ["Um pouco acima", "Mude para <b>14%</b>.", "Dentro da variação da região."],
      ["Região toda com falhas", "Escolha <b>Ruim</b> e mude para <b>45%</b>.", "Se as vizinhas também têm muitas falhas, a seção não foge do padrão."],
    ],
    faq: [["Qual a diferença para o teste 10?", "O teste 10 usa o boletim de urna. O L13 usa o log, eleitor por eleitor: quantas tentativas e como cada um foi liberado."],
      ["Liberar sem digital é irregular?", "Não. Quando a digital não é reconhecida, o mesário confere o documento e libera. O teste procura seções muito fora do padrão."]],
    prova: [
      ["O L13 sinaliza anomalia quando:", "A liberação sem digital está muito acima das vizinhas", "Há 1 liberação sem digital", "Há fila", "Há troca de urna", "Escore z robusto ≥ 3,5."],
      ["Muitos eleitores com 4 tentativas:", "Informativo", "Anomalia", "Normal", "Anulação", "Digitais gastas."],
      ["Se toda a região tem muitas falhas:", "A seção não foge do padrão", "Todas sinalizam", "O teste para", "É anomalia", "Compara com as vizinhas."],
      ["O L13 usa:", "O log, eleitor por eleitor", "Só o boletim", "Pesquisas", "O cadastro", "Mais detalhe que o teste 10."],
      ["Leitor com defeito pode:", "Fazer o teste sinalizar por causa legítima", "Mudar votos", "Zerar a urna", "Trocar a seção", "Anomalia não é prova."],
      ["Liberar sem digital é:", "Previsto, com conferência do documento", "Proibido", "Fraude", "Impossível", "O mesário libera."],
    ],
    situ: ["Numa seção, 45% dos eleitores foram liberados sem digital, contra 8% nas seções vizinhas.", "O log mostra que muitos eleitores precisaram de quatro ou mais tentativas de digital."],
  };
  T.L14 = {
    nome: "Votos do log × boletim de urna", curto: "Confere se o número de votos gravados no log é igual ao comparecimento do boletim de urna.",
    vis: "Votos no log × comparecimento no boletim",
    campos: { log: "Votos concluídos no log", bu: "Comparecimento no boletim", corromp: "Log incompleto ou corrompido", va: "Votos do Candidato A no boletim" },
    simples(s, r) {
      if (s.corromp) return ["<b>O teste sinaliza:</b> o arquivo do log está incompleto ou corrompido, então não dá para conferir a contagem. Fica registrado como falha do arquivo."];
      if (r.nivel === "anom") return [`<b>O teste sinaliza:</b> o log tem ${s.log} votos e o boletim, ${s.bu} (${s.log - s.bu > 0 ? "+" : ""}${s.log - s.bu}).`, "Os dois vêm da mesma urna e deveriam ter o mesmo número. A conferência começa pelo boletim impresso e pela ata."];
      return [`Log e boletim têm ${s.bu} votos: conferem.`, "O L14 confere a quantidade, não em quem foram os votos."];
    },
    ficha: (s) => fichaL([`Votos no log: ${s.log} · comparecimento no boletim: ${s.bu}`, s.corromp ? "Log incompleto ou corrompido" : "Log completo"]),
    kv: (s) => [["Log", String(s.log)], ["Boletim", String(s.bu)], ["Diferença", String(s.log - s.bu)]],
    tec: (s, r) => [["Diferença", `${s.log} − ${s.bu} = ${s.log - s.bu}`], ["Arquivo", s.corromp ? "incompleto" : "completo"], ["Regra (preliminar)", "qualquer diferença ou log incompleto → anomalia"], ["Decisão", luz(r)]],
    m: [
      ["Votos a mais no log", "Mude os votos no log para <b>245</b>.", "5 votos a mais no log que no boletim: anomalia."],
      ["Votos a menos no log", "Mude os votos no log para <b>230</b>.", "Também sinaliza quando faltam votos no log."],
      ["Arquivo corrompido", "Marque <b>Log incompleto ou corrompido</b>.", "Sem o arquivo inteiro, não dá para conferir: registrado como falha do arquivo."],
      ["Um voto", "Mude o log para <b>241</b>.", "Mesmo 1 voto de diferença sinaliza: é uma conta."],
      ["Votos trocados", "Passe <b>25</b> votos para A no boletim, sem mudar o total.", "O L14 confere quantidades, não candidatos."],
      ["Os dois iguais", "Mude log e boletim para <b>260</b>.", "Se os dois têm o mesmo número, o teste não vê diferença."],
    ],
    faq: [["Log e boletim não são a mesma coisa?", "Não. O boletim tem os votos por candidato; o log tem os eventos e a hora de cada voto. Os dois saem da mesma urna, então o total tem de bater."],
      ["Uma diferença prova algo?", "Não. Log incompleto, troca de urna e votação em cédula também geram diferença. A conferência é feita com o boletim impresso e a ata."]],
    prova: [
      ["Diferença de 1 voto entre log e boletim:", "Anomalia", "Normal", "Informativo", "Fora do teste", "É uma conta: tem de bater."],
      ["Log corrompido:", "É registrado como falha do arquivo", "É ignorado", "É normal", "Anula a eleição", "Não dá para conferir."],
      ["O L14 confere:", "O total de votos", "Os votos por candidato", "A biometria", "O horário", "Só a quantidade."],
      ["Votos trocados entre candidatos, com o total igual:", "Não aparecem no L14", "Sempre sinalizam", "São informativos", "Anulam o log", "O log não mostra o candidato."],
      ["Onde começa a conferência de uma diferença?", "No boletim impresso e na ata", "Na pesquisa", "No cadastro", "No celular", "Documentos oficiais."],
      ["O que também gera diferença sem nada errado?", "Log incompleto ou votação em cédula", "Biometria", "Zerésima", "Fuso", "Causas explicáveis."],
    ],
    situ: ["O log de uma urna tem 245 votos, mas o boletim registra 240 eleitores que votaram.", "O arquivo de log de uma seção está incompleto e não dá para contar os votos."],
  };

  Object.assign(S, T);
})();
