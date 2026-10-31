/* Simulador de anomalias — textos em português. */
(function () {
  "use strict";
  const S = (window.SIM_TXT = window.SIM_TXT || {});
  const p = (x) => (x === 1 ? "" : "s");

  const ui = {
    titulo: "Simulador de anomalias", tag: "Página educativa · dados fictícios",
    sub: "Mude números inventados e veja, na hora, como cada um dos 15 testes da auditoria reage, por que reage e o que isso significa.",
    aviso: "Simulação educativa com dados fictícios. É estritamente proibido compartilhar estes resultados, para evitar a divulgação de notícias falsas.",
    marca: "SIMULAÇÃO · DADOS FICTÍCIOS",
    faixa: "SIMULAÇÃO · DADOS FICTÍCIOS · proibido compartilhar, copiar ou imprimir",
    para_que: "Para que serve",
    para_que_l: ["Entender, sem fórmulas, o que cada teste da auditoria confere e como ele decide.",
      "Ver por que um teste acende a luz e como seria o resultado normal.",
      "Descobrir que anomalia estatística é um alerta para conferir, não uma prova: há causas legítimas.",
      "Conhecer os limites de cada teste: alterações que ele não consegue ver."],
    como: "Como funciona",
    como_l: ["Escolha um teste.", "Faça as missões: cada uma pede para mudar algo no caso fictício.", "Veja a luz do teste e leia a explicação simples ou a técnica.", "Faça a prova do teste, acumule notas e faça a prova final."],
    tipos_t: "Três tipos de missão",
    tipos: { s: "Faça sinalizar", a: "Alarme falso", d: "Passou despercebido" },
    tipos_d: { s: "Você altera os dados fictícios até o teste acender a luz.", a: "Uma situação legítima que também acende a luz. Mostra que anomalia não é prova.", d: "Uma alteração que o teste não consegue ver. Mostra o limite de cada teste." },
    boletim: "Seu boletim", boletim_sub: "Suas notas em cada prova e a nota final. Ficam guardadas só neste aparelho.",
    boletim_resumo: (m, mt, pr, pt) => `${m} de ${mt} missões feitas · ${pr} de ${pt} provas feitas.`,
    nota_final: "Nota final", ver_boletim: "Ver boletim", perguntas: "Perguntas e respostas", prova_final: "Prova final",
    niveis: { boletim: "O boletim", secao: "A seção comparada com a região", local: "O local de votação", cidade: "A cidade inteira" },
    niveis_d: { boletim: "Testes que conferem o próprio boletim: contas, horários e a urna usada.", secao: "Testes que comparam uma seção com as seções parecidas da mesma região.", local: "Testes que comparam seções do mesmo local de votação ou procuram cópias.", cidade: "Testes que olham todas as seções de uma cidade ou estado ao mesmo tempo." },
    nota: "Nota", teste: "Teste", abas: "Partes do teste", aba_missoes: "Missões", aba_livre: "Modo livre", aba_prova: "Prova", aba_faq: "Perguntas",
    missoes: "Missões", missoes_n: (n, t) => `${n} de ${t} missões`, missao_n: (i, t) => `Missão ${i} de ${t}`, migalha: "Caminho",
    caso: "Caso fictício", ficticio: "Fictício", ex_simples: "Explicação simples", ex_tecnica: "Explicação técnica",
    dica: "Mostrar onde mexer", restaurar: "Restaurar o caso", cumprida: "Missão cumprida!", proxima: "Próxima missão", refazer: "Refazer", ir_prova: "Ir para a prova",
    livre_t: "Modo livre", livre_d: "Mexa em tudo como quiser. Use “Novo caso” para gerar outro caso fictício.", novo_caso: "Novo caso",
    perguntas_sub: "Os porquês mais comuns sobre o simulador e sobre cada teste.", buscar: "Buscar uma pergunta", faq_geral: "Gerais", nada: "Nenhuma pergunta encontrada.",
    luz: { ok: "Normal", anom: "Anomalia estatística", info: "Informativo", insp: "Marcado para inspeção", na: "Fora do teste" },
    luzDesc: { ok: "O teste não vê nada fora do padrão.", anom: "O teste sinalizaria este caso para conferência.", info: "Fica registrado, mas não é anomalia.", insp: "O indicador pede uma olhada no gráfico.", na: "O caso não atinge o mínimo para o teste avaliar." },
    c: { ap: "Aptos", co: "Comparecimento", ab: "Abstenções", br: "Brancos", nu: "Nulos", rho: "Quanto as seções da região variam", va: "Votos do Candidato A", vb: "Votos do Candidato B" },
    rho: { p: "Pouco (seções parecidas)", m: "Médio", a: "Muito (seções diferentes)" },
    cargo: { 1: "Presidente", 3: "Governador", 5: "Senador", 6: "Deputado Federal", 7: "Deputado Estadual", p: "Presidente", s: "Senador", d: "Deputado Federal", g: "Governador" },
    cargo_t: "Cargo", secao_t: "Seção", cand: { A: "Candidato A", B: "Candidato B" }, local_fict: "Vila Exemplo · Zona 99 · fictício",
    media_reg: "média da região", mediana: "mediana da região",
    cat: {
      aptos_comp_abst: "Aptos ≠ comparecimento + abstenções", comp_maior_aptos: "Comparecimento maior que aptos", valores_divergentes: "Valores diferentes no mesmo boletim",
      votavel_duplicado: "Candidato repetido", votos_negativos: "Quantidade negativa", comp_estadual_divergente: "Comparecimento diferente entre cargos estaduais",
      comp_presidente_menor: "Comparecimento do Presidente menor que o estadual", urna_inconsistente: "Dados da urna diferentes na mesma seção", cargo_ausente: "Cargo faltando no boletim",
      soma_votos: "Soma dos votos ≠ comparecimento", unanimidade: "Unanimidade improvável", unanimidade_100: "100% para um candidato (informativo)", abstencao_zero: "Comparecimento integral improvável",
      brancos_nulos: "Excesso de brancos e nulos", voto_cruzado_pres_df: "Voto cruzado extremo", legenda: "Excesso de votos de legenda", vizinhanca: "Contraste com o mesmo local",
      identicos: "Resultado idêntico a outra seção", biometria: "Biometria não usada acima do padrão",
      abertura_antecipada: "Abertura antes do horário", encerramento_antecipado: "Encerramento antes do horário", encerramento_antes_abertura: "Encerramento antes da abertura",
      emissao_antes_encerramento: "Boletim emitido antes do encerramento", recebimento_antes_emissao: "Recebido antes de ser emitido", data_divergente: "Data diferente do dia da eleição",
      atraso_abertura: "Abertura com atraso (informativo)", tipo_urna_2: "Urna não apurada", tipo_urna_3: "Urna anulada e apurada em separado", tipo_urna_4: "Urna anulada", tipo_urna_5: "Urna não instalada",
      junta_apuradora: "Votação em cédula (informativo)", sem_correspondencia: "Sem lista oficial publicada", urna_ausente: "Número de urna ausente", carga_divergente: "Carga diferente da prevista",
      carga_ausente: "Código de carga ausente", contingencia_oficial: "Urna de contingência oficial (informativo)", contingencia_carga_divergente: "Contingência com carga diferente",
      urna_de_outra_secao: "Urna prevista para outra seção", urna_nao_prevista: "Urna fora das listas oficiais", segundo_digito: "Desvio do 2º dígito", ultimo_digito: "Último dígito desequilibrado", klimek: "Concentração no canto superior",
    },
    tl: {
      metodo: "Método (igual ao do Relatório Técnico)", criterio: "Critério", calc: "Cálculo neste caso fictício", limites: "Limitações",
      grupo: "Grupo de referência", ab: "Parâmetros beta-binomiais", p: "Probabilidade", bh: "Ajuste de Benjamini–Hochberg", crit: "Decisão", sim: "sinaliza", nao: "não sinaliza",
      regras: "Regras", todas_ok: "todas as regras satisfeitas", info: "informativo", janela: "Janela oficial", local: "hora local", tol: "tolerância", receb: "Recebimento", emis_brt: "emissão em hora de Brasília",
      min: "Mínimo não atingido", evento: "Evento", sem_evento: "sem 100% (o teste não calcula)", obs: "Observado", abaixo: "proporção abaixo da média do grupo: p = 1 (o teste é unilateral)",
      z: "Escore z robusto", blocos: "Blocos", exec: "Presidente", leg: "Dep. Federal", escores: "Escores ideológicos médios", critA: "Critério A (blocos)", critB: "Critério B (contexto local)",
      phi: "Sobredispersão do grupo", props: "Proporções", demais: "demais seções", igual: "Vetores idênticos", nk: "Tamanho", pcol: "Coincidência casual", pares: "Pares de seções", pares_c: "pares", E: "Coincidências esperadas",
      contagens: "Contagens ≥ 10", mediana: "mediana", ref: "Referência", ref_modelo: "Monte Carlo, 50 réplicas, beta-binomial por local (≥ 4 seções) ou zona", ref_benford: "Lei de Benford (2º dígito), sem modelo", ref_unif: "Uniforme, sem modelo e sem limite de mediana",
      chi2: "Aderência", medias: "Médias do 2º dígito", obs_m: "observada", esp_m: "esperada",
      canto: "Canto superior", obs_c: "observado", esp_c: "esperado", razao: "Razão observado/esperado", razao_c: "razão", regra: "regra", corr: "Correlação comparecimento × votação", pond: "ponderada pelos aptos",
    },
    nota_bh: "No país, cada teste avalia centenas de milhares de unidades. Aqui o ajuste de Benjamini–Hochberg usa o mesmo número de unidades do 1º turno de 2026, supondo que todas as outras estão dentro do padrão (q = p × M).",
    ch_certo: "praticamente certa", ch_um: (x) => `1 em ${x}`, ch_digitos: (d) => `1 em um número de ${d} algarismos`,
    escala: [[3, "mil", "mil"], [6, "milhão", "milhões"], [9, "bilhão", "bilhões"], [12, "trilhão", "trilhões"], [15, "quatrilhão", "quatrilhões"], [18, "quintilhão", "quintilhões"]],
    // provas
    prova_cen: (n) => `Com os dados fictícios abaixo, o que o teste “${n}” faz?`, prova_qual: "Qual teste cuida desta situação?",
    qual_explic: (n, c) => `É o ${n}: ${c}`,
    resp: { anom: "Sinaliza como anomalia estatística", ok: "Não sinaliza (normal)", na: "Fica fora do teste (não atinge o mínimo)", info: "Registra só como informativo", insp: "Marca para inspeção" },
    final_sub: "30 questões sobre todos os testes. Liberada depois das 15 provas.", prova_bloq_t: "Prova bloqueada",
    prova_bloq: (m, f) => `Faça pelo menos ${m} missões deste teste para liberar a prova. Você fez ${f}.`,
    final_bloq: (f, t) => `Faça as provas dos ${t} testes para liberar a prova final. Você fez ${f}.`,
    prova_de: (n) => `Prova: ${n}`,
    regras: (n, t, min, fin) => [`${n} questões, valendo 1 ponto cada. A nota vai de 0 a 10.`, `Tempo: ${t}. Quando o tempo acaba, a prova é entregue sozinha.`,
      fin ? "Questões sobre todos os testes: conceitos, casos fictícios e “qual teste cuida disso”." : "Questões de conceito e casos fictícios novos a cada tentativa.",
      `Nota mínima para aprovação: ${min}.`, "Durante a prova o simulador fica fechado. Você pode pular, marcar para revisar e voltar.", "A correção comentada aparece só no final."],
    tentativas: (t, m, u) => `Tentativas: ${t} · melhor nota: ${m} · última: ${u}`, comecar: "Começar a prova",
    q_conceito: "Conceito", q_cenario: "Caso fictício", q_qual: "Qual teste?", questao_n: (i, n) => `Questão ${i} de ${n}`, respondidas: (a, n) => `${a}/${n} respondidas`, mapa: "Mapa das questões",
    vale: (x) => `Vale ${x} ponto${p(x)}`, marcar: "Marcar para revisar", anterior: "Anterior", proxima_q: "Próxima", revisar: "Revisar e entregar", entregar: "Entregar prova",
    revisao_t: "Revisão antes de entregar", revisao: (r, n, s, m) => `Você respondeu ${r} de ${n}. ${s ? `${s} sem resposta (valem zero). ` : ""}${m ? `${m} marcada${p(m)} para revisar.` : ""}`,
    sit_dist: "Aprovado com distinção", sit_aprov: "Aprovado", sit_rec: "Em recuperação: refaça as simulações indicadas e tente de novo", sit_refazer: "Precisa refazer as simulações",
    resultado: (a, n, t) => `${a} acerto${p(a)} em ${n} questões · tempo ${t}`, recomenda: "Refaça as missões destes testes:", refazer_prova: "Refazer a prova (questões novas)",
    correcao: "Correção comentada", sua: "Sua resposta", certa: "Resposta certa", sem_resp: "sem resposta",
    em_andamento: "em andamento (falta a prova final)", formula: (m, f) => `Nota final = 60% da média das 15 provas (${m}) + 40% da prova final (${f}). Provas não feitas contam zero.`,
    melhor: "Melhor nota", ultima: "Última", tent: "Tentativas", situacao: "Situação", nao_feita: "não feita", aprovado: "Aprovado", refazer_t: "Refazer",
    so_aqui: "O boletim fica só neste aparelho e não pode ser compartilhado.", apagar: "Apagar meu progresso", apagar_conf: "Apagar todas as missões e notas deste aparelho?",
    // proteção
    bloq_t: "Ação bloqueada nesta página",
    bloq: "Esta página é uma simulação educativa com dados fictícios. É estritamente proibido compartilhar, copiar, imprimir ou capturar estes resultados, para evitar a divulgação de notícias falsas.",
    bloq_m: { ferr: "Compartilhar, gerar imagem, exportar e imprimir estão desligados no simulador.", menu: "O menu do botão direito está desligado nesta página.", copia: "Copiar está desligado nesta página.",
      print: "Captura de tela detectada. A tela foi escondida.", imprimir: "Imprimir e salvar em PDF estão desligados nesta página.", salvar: "Salvar a página está desligado." },
    bloq_voltar: "Voltar ao simulador", so_no_site: "O simulador só funciona dentro do próprio site. Ele não pode ser incorporado em outras páginas.", abrir_site: "Abrir no site",
  };

  // Perguntas gerais
  const faqGeral = [
    ["Os números do simulador são reais?", "Não. Todos os números são inventados e gerados no seu aparelho. Nenhum dado real de seção, cidade ou candidato aparece aqui. Os candidatos se chamam A e B de propósito."],
    ["Por que não posso compartilhar nem tirar print?", "Porque um print de um caso fictício pode ser divulgado como se fosse verdadeiro. Para evitar notícias falsas, a página não tem botões de compartilhar, copiar, gerar imagem ou imprimir, mostra a marca “SIMULAÇÃO · DADOS FICTÍCIOS” em toda a tela e esconde o conteúdo quando detecta uma captura."],
    ["O bloqueio de print funciona sempre?", "Não. Um site não consegue impedir o print do celular nem a foto da tela com outro aparelho. No computador, a página detecta parte das capturas e esconde o conteúdo. Por isso a marca d’água e a faixa vermelha ficam sempre visíveis."],
    ["O simulador usa as mesmas regras da auditoria?", "Sim. Os limites, os mínimos e as contas são os mesmos do motor da auditoria (mesmos parâmetros do Relatório Técnico). A diferença é que os dados são inventados e a região de comparação é fictícia."],
    ["O que é anomalia estatística?", "É um resultado muito diferente do esperado para aquela situação. É um alerta para conferir o boletim impresso, a ata e os arquivos da urna. Não é prova de nada: há causas legítimas, como mostram as missões de alarme falso."],
    ["Por que o site não aponta culpados nem irregularidades?", "Porque um teste estatístico não tem como saber a causa. Ele só mostra o que foge do padrão. A conclusão depende de conferência humana dos documentos oficiais."],
    ["O que é a luz azul, informativo?", "É um registro que não conta como anomalia: por exemplo, uma troca oficial de urna ou 100% para um candidato quando isso não é raro. Fica anotado para quem quiser conferir."],
    ["Por que alguns casos ficam fora do teste?", "Cada teste tem um mínimo (de votos, eleitores ou seções). Abaixo dele, o acaso explica quase tudo e o teste daria alarmes falsos demais."],
    ["O que é o ajuste para muitas seções?", "Quando se testam centenas de milhares de seções, algumas parecem raras só por acaso. O ajuste de Benjamini–Hochberg exige que o resultado continue raro mesmo depois de contar todas. O simulador usa o mesmo número de unidades do 1º turno."],
    ["Como funciona a nota?", "Cada prova vale de 0 a 10, com aprovação a partir de 7. A nota final é 60% da média das 15 provas mais 40% da prova final. Você pode refazer as provas: vale a melhor nota."],
    ["Meu progresso fica salvo onde?", "Só neste navegador, neste aparelho. Nada é enviado para lugar nenhum. Você pode apagar tudo no seu boletim."],
    ["Posso usar o simulador numa aula?", "Pode, abrindo o site na sala. O simulador não pode ser incorporado em outros sites nem exportado. Lembre a turma de que os dados são fictícios."],
  ];

  // ---------------------------------------------------------------------------------------------------
  // Ajudantes de texto
  // ---------------------------------------------------------------------------------------------------
  const pq = (f, v) => `A chance de isso acontecer por acaso numa seção assim é de <b>${f.chance(v.lp)}</b>.`;
  const bhTxt = (f, v) => `Como o país tem cerca de ${f.n(v.M)} unidades avaliadas neste teste, o site só sinaliza quando, mesmo contando todas, o resultado continua raro (chance de alarme falso abaixo de 1%).`;
  const fichaL = (itens) => `<ul>${itens.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const rhoTxt = { p: "parecidas entre si", m: "com variação média", a: "bem diferentes entre si" };

  const T = {};

  T.T01 = {
    nome: "Fechamento do boletim", curto: "Confere se a conta de cada boletim fecha: aptos = comparecimento + abstenções, sem números negativos, sem candidato repetido e sem cargo faltando.",
    bu: "Boletim de urna fictício",
    campos: { votos: "Votos para Presidente:", neg: "Votos de um candidato a Dep. Federal", fant: "Eleitores-fantasma (somados em todas as linhas)", aus: "Cargo ausente no boletim", dup: "Candidato repetido na lista do Dep. Federal", div: "Uma linha do Dep. Federal com aptos diferentes", urn: "Número da urna diferente em uma linha" },
    op: { aus: { 0: "Nenhum", 3: "Governador", 5: "Senador", 6: "Deputado Federal", 7: "Deputado Estadual" } },
    simples(s, r, f) {
      if (r.nivel === "ok") return ["Todas as contas do boletim fecham: em cada cargo, aptos = comparecimento + abstenções; nenhum número negativo; nenhum candidato repetido; os cargos estaduais têm o mesmo comparecimento; o Presidente não tem menos votantes que eles.",
        "O Teste 1 confere só a aritmética do boletim. Ele não sabe para quem foram os votos nem se os eleitores existem: isso é papel de outros testes e da conferência do boletim impresso."];
      const l = r.cats.map((c) => `<b>${f.cat(c.c)}</b>${c.cargo ? ` (${f.cargo(c.cargo)})` : ""}${c.obs ? `: ${c.obs}` : ""}`);
      return [`O boletim tem ${r.cats.length} problema${p(r.cats.length)}: ${l.join("; ")}.`,
        "Num boletim correto, cada linha fecha (aptos = comparecimento + abstenções), não há números negativos nem repetidos, e o comparecimento dos cargos estaduais é igual.",
        "O teste é determinístico: qualquer violação sinaliza. Na prática, a causa mais comum é erro de registro, de transmissão ou de leitura do arquivo. A conferência é com o boletim impresso e os arquivos assinados da urna."];
    },
    ficha: (s, f) => fichaL([`Aptos ${s.c[1].ap + s.fant}, comparecimento ${s.c[1].co + s.fant}, abstenções ${s.c[1].ab} (Presidente)`,
      `Governador: ${s.c[3].ap + s.fant} / ${s.c[3].co + s.fant} / ${s.c[3].ab}; Senador: ${s.c[5].ap + s.fant} / ${s.c[5].co + s.fant} / ${s.c[5].ab}`,
      `Dep. Federal: ${s.c[6].ap + s.fant} / ${s.c[6].co + s.fant} / ${s.c[6].ab}; Dep. Estadual: ${s.c[7].ap + s.fant} / ${s.c[7].co + s.fant} / ${s.c[7].ab}`,
      `Menor quantidade de votos de um candidato: ${s.neg}${s.dup ? "; um candidato aparece duas vezes" : ""}${+s.aus ? `; a linha de ${f.cargo(+s.aus)} não aparece` : ""}`,
      `Presidente: A ${s.va}, B ${s.vb}, brancos ${s.br}, nulos ${s.nu}`]),
    m: [
      ["A conta que não fecha", "No boletim, aptos = comparecimento + abstenções. Mude os <b>aptos do Presidente</b> para a conta deixar de fechar.", "Qualquer diferença, mesmo de 1 eleitor, acende a luz. Na vida real isso costuma ser erro de registro ou de leitura do arquivo, e se resolve com o boletim impresso."],
      ["Mais votantes que eleitores", "Faça o <b>comparecimento do Governador</b> ficar maior que os aptos (por exemplo, 305).", "Ninguém vota numa seção sem estar nela. Comparecimento maior que aptos é impossível num boletim correto."],
      ["Um voto negativo", "Coloque um número <b>negativo</b> nos votos do candidato a Deputado Federal.", "Não existe quantidade negativa de votos. Se aparecer, há erro no registro ou no arquivo."],
      ["Candidato repetido", "Marque <b>Candidato repetido</b> na lista do Deputado Federal.", "Cada candidato aparece uma vez por cargo. Repetição indica erro de registro ou de extração dos dados."],
      ["Comparecimentos diferentes", "Mude o <b>comparecimento do Governador</b> para 238 e a abstenção para 62. A linha fecha, mas fica diferente dos outros cargos estaduais.", "Quem vota para Governador vota também para Senador e Deputados. O comparecimento dos cargos estaduais tem de ser igual, mesmo que cada linha feche sozinha."],
      ["Presidente com menos votantes", "Deixe o <b>comparecimento do Presidente</b> menor que o dos cargos estaduais (por exemplo, 235, com abstenção 65).", "O Presidente pode ter MAIS votantes (eleitores em trânsito votam só para Presidente), nunca menos."],
      ["Linha perdida na cópia", "Escolha <b>Cargo ausente: Senador</b>, como se a linha tivesse se perdido ao copiar o arquivo.", "O teste sinaliza, mas a causa mais comum é técnica: falha ao gerar ou ler o arquivo. O boletim impresso resolve a dúvida."],
      ["Erro de digitação", "Troque a abstenção do <b>Deputado Estadual</b> de 60 para <b>6</b>, como quem esquece um zero.", "Um erro bobo de digitação acende a luz igual a uma alteração de propósito. Por isso uma anomalia é um alerta para conferir, não uma acusação."],
      ["Urna trocada no meio do dia", "Marque <b>Número da urna diferente em uma linha</b>, como acontece quando a urna é substituída durante a votação.", "Troca de urna por defeito é prevista nas regras da eleição. O Teste 12 confere se a urna nova estava na lista oficial."],
      ["Votos trocados de lugar", "Passe <b>30 votos</b> do Candidato A para o Candidato B. Repare que a luz continua verde.", "O Teste 1 só confere se as contas fecham. Trocar votos entre candidatos mantém tudo fechado. Outros testes e a conferência do boletim impresso olham isso."],
      ["Eleitores-fantasma bem feitos", "Some pelo menos <b>10 eleitores-fantasma</b>: o simulador os coloca em todas as linhas, nos aptos e no comparecimento.", "Se tudo for alterado de forma coerente, a conta fecha e o Teste 1 não vê. Por isso existem os testes de comparecimento (4) e de biometria (10), e a conferência do caderno de votação."],
      ["Brancos viram votos", "Transforme todos os <b>brancos</b> do Presidente em votos para o Candidato A.", "Mudar o tipo de voto sem mudar o total não altera nenhuma conta que o Teste 1 confere."],
    ],
    faq: [
      ["Por que um erro de 1 eleitor já sinaliza?", "Porque a conta do boletim é exata. Não existe “quase fecha”: ou fecha, ou há um erro que precisa ser explicado."],
      ["Por que o Presidente pode ter mais votantes?", "Eleitores em trânsito (fora do seu domicílio eleitoral) podem votar só para Presidente. Por isso o comparecimento do Presidente pode ser maior que o dos cargos estaduais, nunca menor."],
      ["Se o Teste 1 não sinaliza, o boletim está certo?", "Não necessariamente. Ele só garante que as contas fecham. Votos trocados entre candidatos ou alterações coerentes passam por ele."],
    ],
    prova: [
      ["Qual conta o Teste 1 confere em cada linha do boletim?", "Aptos = comparecimento + abstenções", "Votos de A = votos de B", "Brancos = nulos", "Comparecimento = votos do vencedor", "É a identidade básica do boletim: todo eleitor apto ou votou ou faltou."],
      ["O Presidente pode ter comparecimento MAIOR que o Governador na mesma seção?", "Sim, por causa dos eleitores em trânsito", "Não, nunca", "Só no 2º turno", "Só se a urna for trocada", "Eleitores em trânsito votam só para Presidente. Menor é que não pode."],
      ["Quantos eleitores de diferença bastam para o Teste 1 sinalizar?", "Qualquer diferença, até 1", "Pelo menos 10", "Mais de 5%", "Depende da região", "O teste é determinístico e sem tolerância."],
      ["Uma linha de cargo faltando no arquivo prova manipulação?", "Não: pode ser falha ao gerar ou ler o arquivo", "Sim, sempre", "Só se for o Presidente", "Sim, se a seção for grande", "Anomalia é alerta para conferir com o boletim impresso e os arquivos assinados."],
      ["O que o Teste 1 NÃO consegue ver?", "Votos trocados de um candidato para outro", "Comparecimento maior que aptos", "Números negativos", "Candidato repetido", "Trocar votos entre candidatos mantém todas as contas fechadas."],
      ["Por que os cargos estaduais devem ter o mesmo comparecimento?", "Porque quem vota para Governador vota também para Senador e Deputados", "Porque a lei manda arredondar", "Porque são do mesmo partido", "Não precisam", "É o mesmo grupo de eleitores votando em todos os cargos estaduais."],
    ],
    situ: ["No boletim de uma seção, o comparecimento do Governador é maior que o número de eleitores aptos.", "Um candidato a Deputado aparece duas vezes na lista do mesmo boletim."],
  };

  T.T02 = {
    nome: "Inconsistência de totais", curto: "Confere se a soma dos votos de cada cargo é igual ao número de pessoas que votaram (no Senado de 2026, o dobro, porque cada eleitor vota em dois).",
    dois: "2 votos por eleitor", soma: "Soma", esperado: "Esperado",
    campos: { c1: "Candidato S1", c2: "Candidato S2", c3: "Candidato S3", nom: "Votos nominais", leg: "Votos de legenda" },
    simples(s, r, f) {
      const t = r.v.tot;
      if (r.nivel === "ok") return [`As somas batem: Presidente ${f.n(t.p)} = ${f.n(s.co)}; Senado ${f.n(t.s)} = 2 × ${f.n(s.co)}; Deputado Federal ${f.n(t.d)} = ${f.n(s.co)}.`,
        "O Teste 2 confere quantidades, não para quem foram os votos. Votos trocados de um candidato para outro, ou de brancos para um candidato, mantêm as somas iguais."];
      return [`A soma não bate em ${r.cats.length} cargo${p(r.cats.length)}: ${r.cats.map((c) => `<b>${f.cargo(c.cargo)}</b> (${c.obs}, diferença de ${c.delta > 0 ? "+" : ""}${f.n(c.delta)})`).join("; ")}.`,
        "Num boletim correto, cada pessoa que votou deixa exatamente um voto por cargo (dois no Senado de 2026), contando brancos e nulos.",
        "Qualquer diferença sinaliza. Na prática, pode ser erro de registro, de extração ou um arquivo incompleto. A conferência definitiva é com o boletim impresso e o arquivo assinado da urna."];
    },
    ficha: (s, f) => fichaL([`Comparecimento: ${s.co}`, `Presidente: A ${s.p.a}, B ${s.p.b}, brancos ${s.p.br}, nulos ${s.p.nu}`, `Senado (2 votos por eleitor): ${s.s.c1} + ${s.s.c2} + ${s.s.c3} + brancos ${s.s.br} + nulos ${s.s.nu}`, `Dep. Federal: nominais ${s.d.nom}, legenda ${s.d.leg}, brancos ${s.d.br}, nulos ${s.d.nu}`]),
    m: [
      ["Votos a mais", "Dê <b>20 votos a mais</b> ao Candidato A para Presidente.", "A soma dos votos de um cargo tem de ser igual ao número de pessoas que votaram. Votos a mais aparecem na hora."],
      ["Votos sumidos", "Apague <b>15 votos</b> do Candidato B.", "Votos a menos também quebram a conta: alguém votou e o voto não aparece."],
      ["Um único voto", "Some <b>1 voto</b> ao Candidato A.", "O teste não tem tolerância: qualquer diferença, até de 1 voto, é sinalizada."],
      ["Senado com voto a mais", "Some <b>10 votos</b> ao candidato S1 do Senado.", "Em 2026 cada eleitor vota em dois senadores. A soma do Senado tem de ser o dobro do comparecimento, e o teste já leva isso em conta."],
      ["Legenda inflada", "Some <b>30 votos de legenda</b> para Deputado Federal.", "Votos de legenda (só no número do partido) entram na soma como qualquer outro voto."],
      ["Comparecimento sem votos", "Aumente o <b>comparecimento em 10</b> sem mexer em nenhum voto.", "Se mais gente votou, os votos de todos os cargos teriam de aumentar juntos. Os três cargos acendem."],
      ["Linha de nulos perdida", "Zere os <b>nulos do Deputado Federal</b>, como se a linha tivesse se perdido no arquivo.", "Sinaliza, mas pode ser só a perda de uma linha ao ler o arquivo. O boletim impresso e o arquivo assinado resolvem."],
      ["Dígitos trocados", "Troque os <b>brancos do Senado</b> de 15 para <b>51</b>, como um erro de digitação.", "Um erro de digitação ao copiar os dados acende a mesma luz que uma alteração de propósito."],
      ["Arquivo cortado", "Zere o candidato <b>S3</b> do Senado, como se o arquivo tivesse sido cortado no fim.", "Arquivos incompletos geram somas erradas. Por isso o site confere a integridade dos arquivos antes dos testes."],
      ["Troca invisível", "Passe <b>25 votos</b> do Candidato A para o Candidato B.", "A soma continua igual ao comparecimento, então o Teste 2 não vê. A troca entre candidatos só aparece no boletim impresso ou em padrões estatísticos."],
      ["Brancos convertidos", "Transforme os <b>brancos</b> do Presidente em votos para o Candidato A.", "O total não muda. O Teste 2 confere quantidades, não para quem foram os votos."],
      ["Fantasmas coerentes", "Aumente o <b>comparecimento em 10</b> e acerte todas as somas (Presidente +10, Senado +20, Deputado +10) até a luz voltar ao verde.", "Alterações coerentes passam pelo Teste 2. Por isso o site combina vários testes e recomenda conferir o boletim impresso e a ata."],
    ],
    faq: [
      ["Por que o Senado conta o dobro?", "Em 2026 são renovados dois terços do Senado: cada eleitor escolhe dois senadores. A soma do Senado deve ser 2 × comparecimento."],
      ["Brancos e nulos entram na soma?", "Sim. A soma inclui votos nominais, de legenda, brancos, nulos e anulados. Cada pessoa que votou deixa um voto em cada cargo, mesmo que seja branco."],
      ["Se as somas batem, os votos estão certos?", "Não necessariamente. O teste confere quantidades. Para quem foram os votos só o boletim impresso mostra."],
    ],
    prova: [
      ["No Senado de 2026, a soma dos votos deve ser:", "O dobro do comparecimento", "Igual ao comparecimento", "Metade do comparecimento", "Igual aos aptos", "Cada eleitor escolhe dois senadores em 2026."],
      ["Brancos e nulos entram na soma conferida pelo Teste 2?", "Sim", "Não", "Só os brancos", "Só no 2º turno", "A soma inclui todos os tipos de voto."],
      ["Uma diferença de 1 voto na soma:", "É sinalizada", "É ignorada", "Só conta se for no Presidente", "Só conta acima de 5 votos", "O teste é exato, sem tolerância."],
      ["Qual alteração o Teste 2 NÃO vê?", "Passar votos do Candidato A para o B", "Somar votos sem aumentar o comparecimento", "Apagar votos", "Aumentar o comparecimento sem votos", "A troca mantém a soma igual."],
      ["Um arquivo de dados cortado no fim pode:", "Gerar uma soma errada e acender a luz", "Nunca afetar o teste", "Aumentar o comparecimento", "Mudar o horário da urna", "Por isso o site confere a integridade dos arquivos."],
      ["O que a luz do Teste 2 sozinha permite concluir?", "Que a soma não bate e é preciso conferir o boletim impresso", "Que houve manipulação", "Que o candidato A ganhou", "Que a urna foi trocada", "Anomalia é um alerta para conferência."],
    ],
    situ: ["A soma dos votos para Presidente de uma seção é 5 votos maior que o número de pessoas que votaram.", "No Senado, a soma dos votos da seção é igual ao comparecimento, e não ao dobro."],
  };

  const secaoKv = (rot) => (s, r, f) => r.v.lp == null ? [[rot, `${f.pct(r.v.x != null ? r.v.x / r.v.n : 0)}`]] : [[rot, `${f.pct(r.v.x != null ? r.v.x / r.v.n : 1)}`], ["Média da região", f.pct(r.v.mref)], ["Chance por acaso", f.chance(r.v.lp)], ["Depois do ajuste (q)", f.sci(r.v.lq)]];

  T.T03 = {
    nome: "Unanimidade na seção", curto: "Procura seções em que um único candidato teve 100% dos votos válidos e calcula se isso é raro demais para aquela região.",
    vis: "Cada ponto é uma seção fictícia da região (votação do candidato). O losango é a sua seção.",
    campos: { n: "Votos válidos na seção", a: "Votos do Candidato A", m: "Votação média de A na região (%)" },
    kv(s, r, f) { const v = r.v, out = [["Votos de A", `${f.n(Math.min(s.a, s.n))} de ${f.n(s.n)}`]]; if (v.lp != null) out.push(["Média da região", f.pct(v.mref)], ["Chance por acaso", f.chance(v.lp)], ["Depois do ajuste (q)", f.sci(v.lq)]); return out; },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return [`A seção tem só <b>${f.n(v.n)}</b> voto${p(v.n)} válido${p(v.n)}. O teste só avalia seções com pelo menos 10: com tão pouca gente, 100% para um candidato acontece por acaso com frequência.`];
      if (r.nivel === "ok") return [`Ninguém teve 100% dos votos válidos: o Candidato A tem ${f.n(v.a)} de ${f.n(v.n)} (${f.pct(v.a / Math.max(1, v.n))}).`, "O Teste 3 procura só a unanimidade. Uma seção muito favorável a um candidato, mas sem 100%, não acende esta luz. Outros testes, como o Contraste de vizinhança, comparam com as seções vizinhas."];
      const c = v.cand === "A" ? "Candidato A" : "Candidato B";
      const out = [`Todos os ${f.n(v.n)} votos válidos foram para o <b>${c}</b>. Nas seções da região, ele costuma ter <b>${f.pct(v.mref)}</b>.`, pq(f, v) + " " + bhTxt(f, v)];
      if (r.nivel === "anom") out.push(`<b>Por isso o teste sinaliza.</b> O normal seria algo perto de ${f.pct(v.mref, 0)} para ${c}, com votos também para o outro candidato.`, "Isso não prova nada: comunidades pequenas e unidas (aldeias, comunidades isoladas, estabelecimentos específicos) podem votar em bloco. O sinal pede conferência do boletim impresso e da ata.");
      else out.push("<b>Não é raro o bastante para sinalizar.</b> O site só registra como informativo (100% para um candidato), porque na região esse candidato já é muito forte ou as seções variam muito.");
      return out;
    },
    ficha: (s, f) => fichaL([`Votos válidos na seção: ${s.n}`, `Votos do Candidato A: ${s.a} (os demais foram para o Candidato B)`, `Na região, A tem em média ${s.m}% dos votos`, `Seções da região ${rhoTxt[s.rho]}`]),
    m: [
      ["Unanimidade", "Dê <b>todos os votos válidos</b> ao Candidato A (120).", "Numa região onde A tem cerca de 55%, uma seção de 120 votos com 100% para A é rara demais. O teste calcula essa chance com as seções da região."],
      ["Onde A é fraco", "Aqui A tem só 30% na região. Leve A a <b>80 votos</b> (100%).", "Quanto mais fraco o candidato na região, mais improvável é a unanimidade."],
      ["Unanimidade para o outro", "Agora <b>zere o Candidato A</b>: os 60 votos vão todos para o Candidato B.", "O teste olha qualquer candidato. 100% para B onde ele tem cerca de 45% também é raro."],
      ["Seção grande", "Dê os <b>300 votos</b> ao Candidato A.", "Quanto maior a seção, menor a chance de todos escolherem o mesmo candidato por acaso."],
      ["Forte, mas em seções parecidas", "A tem 75% e as seções da região são parecidas. Dê os <b>80 votos</b> a A.", "Mesmo onde o candidato é forte, se as seções costumam ser parecidas, 100% em 80 votos foge do padrão."],
      ["Ache o tamanho mínimo", "A seção tem 10 votos, todos para A. Aumente os <b>votos válidos</b> (A acompanha) até a luz ficar amarela.", "Com poucos votos, 100% acontece por acaso. A partir de certo tamanho deixa de ser plausível. O teste calcula esse ponto para cada região."],
      ["Aldeia indígena", "Uma aldeia pequena e unida vota junto. Dê os <b>30 votos</b> ao Candidato A.", "O teste sinaliza, mas comunidades pequenas e homogêneas podem votar em bloco de forma legítima. A região ao redor não representa bem essa comunidade."],
      ["Comunidade religiosa", "Uma comunidade religiosa isolada vota junta. Dê os <b>40 votos</b> a A.", "Grupos isolados e unidos podem dar 100% a um candidato. Por isso o site fala em anomalia estatística: é um alerta para conferir."],
      ["Comunidade ribeirinha", "Uma comunidade ribeirinha distante vota numa seção só. Dê os <b>40 votos</b> a A.", "Lugares isolados podem ter um padrão muito diferente das seções que servem de comparação."],
      ["Quase unanimidade", "Dê ao Candidato A todos os votos <b>menos 1</b> (119 de 120).", "O Teste 3 procura só 100%. Com 99% a luz fica verde. Outros testes podem perceber uma seção muito diferente das vizinhas."],
      ["Seção pequena demais", "Dê os <b>9 votos</b> a A.", "Abaixo de 10 votos válidos o teste não avalia: com tão poucos eleitores, 100% acontece por acaso com frequência."],
      ["Reduto do candidato", "Onde A tem 97% na região, dê os <b>50 votos</b> a A.", "100% onde o candidato já tem quase tudo não é raro. O site só registra como informativo."],
    ],
    faq: [
      ["Por que 100% numa seção pequena não sinaliza?", "Porque, com poucos eleitores, a unanimidade acontece por acaso com frequência. O teste calcula a chance considerando o tamanho da seção."],
      ["Com o que a seção é comparada?", "Com as seções do mesmo grupo de referência: a mesma zona dentro do município, ou o município, a zona ou o estado, conforme o número de seções disponíveis (pelo menos 20)."],
      ["O que é a luz azul neste teste?", "É 100% para um candidato quando isso não é raro o bastante. Fica registrado como informativo, com a contagem por candidato."],
    ],
    prova: [
      ["O que o Teste 3 procura?", "Seções em que um candidato teve 100% dos votos válidos", "Seções com mais de 70% para um candidato", "Seções com muitos brancos", "Seções sem eleitores", "Ele olha só a unanimidade e calcula se ela é rara para a região."],
      ["Uma seção com 9 votos válidos, todos para um candidato:", "Fica fora do teste", "Sempre sinaliza", "É informativa", "É anulada", "O mínimo é 10 votos válidos."],
      ["Por que 100% numa seção grande é mais raro?", "Porque é menos provável que muitas pessoas escolham o mesmo candidato por acaso", "Porque seções grandes têm urnas diferentes", "Porque a lei proíbe", "Não é mais raro", "A chance cai muito com o tamanho da seção."],
      ["Uma aldeia pequena e unida com 100% para um candidato:", "Pode sinalizar, mas pode ser legítimo", "Prova manipulação", "Nunca sinaliza", "É excluída do teste", "Comunidades homogêneas podem votar em bloco."],
      ["Uma seção com 99% para um candidato:", "Não acende o Teste 3", "Sinaliza no Teste 3", "Fica fora do teste", "É informativa", "O teste procura só 100%."],
      ["O que o ajuste para muitas seções faz?", "Exige que o resultado continue raro mesmo depois de contar todas as seções testadas", "Soma votos das seções vizinhas", "Ignora seções pequenas", "Troca os candidatos", "É o procedimento de Benjamini–Hochberg."],
    ],
    situ: ["Numa seção de 200 votos válidos, todos foram para o mesmo candidato, que na região tem cerca de metade dos votos.", "Uma seção de uma comunidade isolada deu 100% dos votos a um único candidato."],
  };

  T.T04 = {
    nome: "Abstenção zero", curto: "Procura seções em que todos os eleitores aptos votaram (nenhuma falta) e calcula se isso é raro demais para aquela região.",
    vis: "Cada ponto é uma seção fictícia da região (comparecimento). O losango é a sua seção.",
    campos: { ap: "Eleitores aptos", co: "Comparecimento", m: "Comparecimento médio na região (%)" },
    kv(s, r, f) { const v = r.v, out = [["Votaram", `${f.n(Math.min(s.co, s.ap))} de ${f.n(s.ap)}`]]; if (v.lp != null) out.push(["Média da região", f.pct(v.mref)], ["Chance por acaso", f.chance(v.lp)], ["Depois do ajuste (q)", f.sci(v.lq)]); return out; },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return [`A seção tem só <b>${f.n(v.ap)}</b> eleitores aptos. O teste só avalia seções com pelo menos 20: em seções muito pequenas, todo mundo votar é comum.`];
      if (!v.integral) return [`Faltaram ${f.n(v.ap - v.co)} eleitor${v.ap - v.co === 1 ? "" : "es"} (comparecimento de ${f.pct(v.co / Math.max(1, v.ap))}).`, "O Teste 4 olha só o comparecimento de 100%. Qualquer falta deixa a luz verde, mesmo que o comparecimento seja muito alto."];
      const out = [`Todos os ${f.n(v.ap)} eleitores aptos votaram. Nas seções da região, o comparecimento médio é de <b>${f.pct(v.mref)}</b>.`, pq(f, v) + " " + bhTxt(f, v)];
      if (r.nivel === "anom") out.push(`<b>Por isso o teste sinaliza.</b> O normal seria faltarem cerca de ${f.n(Math.round(v.ap * (1 - v.mref)))} eleitores.`, "Isso não prova nada: seções especiais (presídios, unidades de internação, hospitais) e cadastros recém-revisados podem ter comparecimento integral legítimo. Eleitores em trânsito também mudam a conta.");
      else out.push("<b>Não é raro o bastante para sinalizar</b>, porque na região quase todo mundo vota ou as seções variam muito.");
      return out;
    },
    ficha: (s, f) => fichaL([`Eleitores aptos: ${s.ap}`, `Comparecimento: ${s.co}`, `Na região, o comparecimento médio é de ${s.m}%`, `Seções da região ${rhoTxt[s.rho]}`]),
    m: [
      ["Ninguém faltou", "Leve o <b>comparecimento</b> até 180: todos votaram.", "Onde 1 em cada 5 costuma faltar, ninguém faltar numa seção de 180 eleitores é raríssimo."],
      ["Região de muita falta", "Aqui 35% costumam faltar. Leve o comparecimento a <b>120</b>.", "Quanto mais gente costuma faltar, mais improvável é ninguém faltar."],
      ["Seção média", "Leve o comparecimento a <b>45</b>.", "Mesmo uma seção de 45 eleitores sinaliza quando a região costuma ter muitas faltas e as seções são parecidas."],
      ["Seção grande", "Leve o comparecimento a <b>400</b>.", "Em seções grandes, comparecimento de 100% praticamente não acontece por acaso."],
      ["Ache o tamanho mínimo", "A seção tem 20 eleitores e todos votaram. Aumente os <b>aptos</b> (o comparecimento acompanha) até a luz ficar amarela.", "O ponto em que 100% vira anomalia depende do tamanho da seção e de quanto a região costuma faltar."],
      ["Seções parecidas", "As seções desta região variam pouco. Leve o comparecimento a <b>80</b>.", "Quando as seções da região são parecidas, um desvio grande chama mais atenção."],
      ["Seção num presídio", "Numa unidade prisional, os presos aptos votam juntos. Leve o comparecimento a <b>50</b>.", "Seções especiais podem ter 100% de forma legítima. O teste não sabe disso; a ata da seção sabe."],
      ["Cadastro recém-revisado", "A cidade revisou o cadastro e tirou quem não mora mais lá. Leve o comparecimento a <b>60</b>.", "Cadastros limpos têm menos faltas. As seções de comparação podem não ter passado pela mesma revisão."],
      ["Seção de um hospital", "Seção com eleitores internados e funcionários. Leve o comparecimento a <b>80</b>.", "Locais especiais têm públicos especiais. O sinal pede conferência, não conclusão."],
      ["Só um faltou", "Deixe o comparecimento em <b>179</b> (1 a menos que os aptos).", "O Teste 4 olha só os 100%. Com um eleitor faltando, a luz fica verde."],
      ["Seção minúscula", "Leve o comparecimento a <b>19</b>.", "O teste só avalia seções com pelo menos 20 eleitores aptos."],
      ["Região que quase não falta", "Onde só 3% costumam faltar, leve o comparecimento a <b>30</b>.", "100% onde quase ninguém falta não é raro."],
    ],
    faq: [
      ["Por que todo mundo votar pode ser suspeito?", "Porque, em seções grandes, sempre alguém falta: viagem, doença, mudança. Ninguém faltar numa seção de centenas de eleitores é muito improvável."],
      ["Por que um presídio pode ter 100%?", "Porque os eleitores presos provisoriamente estão no local e votam juntos. É um exemplo de causa legítima."],
      ["Por que só a partir de 20 aptos?", "Abaixo disso, 100% de comparecimento é comum e o teste daria alarmes falsos demais."],
    ],
    prova: [
      ["O que o Teste 4 procura?", "Seções em que todos os aptos votaram", "Seções com muitas faltas", "Seções com comparecimento acima de 90%", "Seções sem boletim", "Ele olha só o comparecimento integral e calcula a chance."],
      ["Uma seção de 19 aptos com 100% de comparecimento:", "Fica fora do teste", "Sinaliza sempre", "É informativa", "É anulada", "O mínimo é 20 eleitores aptos."],
      ["Numa seção de presídio com 100% de comparecimento, o sinal:", "Pode ter causa legítima", "Prova manipulação", "Nunca aparece", "Anula a seção", "Seções especiais podem ter comparecimento integral legítimo."],
      ["Onde 30% costumam faltar, 100% numa seção grande é:", "Muito improvável", "Comum", "Impossível de calcular", "Sempre legítimo", "A chance cai muito com o tamanho e a taxa de falta."],
      ["Uma seção com 1 eleitor faltando acende o Teste 4?", "Não", "Sim", "Só se for grande", "Só no 2º turno", "O teste olha só o comparecimento de 100%."],
      ["Com o que a seção é comparada?", "Com as seções do mesmo grupo de referência", "Com o país inteiro sempre", "Com a eleição anterior", "Com a seção vizinha apenas", "O grupo pode ser zona, município, zona da UF ou UF, com pelo menos 20 seções."],
    ],
    situ: ["Numa seção de 350 eleitores aptos, todos votaram, num município onde normalmente 1 em cada 5 falta.", "Todos os eleitores aptos de uma seção grande compareceram, sem nenhuma abstenção."],
  };

  const excessoSimples = (o) => (s, r, f) => {
    const v = r.v;
    if (r.nivel === "na") return [`A seção tem só <b>${f.n(v.n)}</b> ${o.un}. O teste só avalia a partir de 30: com tão pouco, a proporção varia muito por acaso.`];
    const prop = f.pct(v.x / Math.max(1, v.n));
    if (!v.acima) return [`A seção tem ${f.n(v.x)} ${o.coisa} em ${f.n(v.n)} (${prop}), abaixo da média da região (${f.pct(v.mref)}).`, `O teste só procura <b>excesso</b>. Ter menos ${o.coisa} que a região não acende a luz.`];
    const out = [`A seção tem <b>${f.n(v.x)}</b> ${o.coisa} em ${f.n(v.n)} (${prop}). Nas seções da região, a média é de <b>${f.pct(v.mref)}</b>.`,
      `A chance de uma seção assim ter tantos ${o.coisa} (ou mais) por acaso é de <b>${f.chance(v.lp)}</b>. ` + bhTxt(f, v)];
    if (r.nivel === "anom") out.push(`<b>Por isso o teste sinaliza.</b> O normal seria algo perto de ${f.n(Math.round(v.n * v.mref))} ${o.coisa}.`, o.legit);
    else out.push("<b>Está dentro da variação normal</b> das seções da região. Alterações pequenas não aparecem.");
    return out;
  };
  const excessoKv = (rot) => (s, r, f) => { const v = r.v; return [[rot, v.n ? `${f.n(v.x)} de ${f.n(v.n)} (${f.pct(v.x / Math.max(1, v.n))})` : "—"]].concat(v.lp != null ? [["Média da região", f.pct(v.mref)], ["Chance por acaso", f.chance(v.lp)], ["Depois do ajuste (q)", f.sci(v.lq)]] : []); };

  T.T05 = {
    nome: "Excesso de brancos e nulos", curto: "Procura boletins com muito mais votos brancos e nulos do que as seções parecidas da região.",
    vis: "Cada ponto é uma seção fictícia da região (brancos + nulos). O losango é a sua seção.",
    campos: { tot: "Votos no cargo", m: "Brancos + nulos na região (%)" },
    kv: excessoKv("Brancos + nulos"),
    simples: excessoSimples({ un: "votos no cargo", coisa: "brancos e nulos", legit: "Isso não prova nada: campanhas de voto nulo, candidatos com registro negado e eleitores com dificuldade de usar a urna elevam os brancos e nulos de forma legítima." }),
    ficha: (s, f) => fichaL([`Votos no cargo: ${s.tot}`, `Brancos: ${s.br} · nulos: ${s.nu}`, `Na região, brancos + nulos são em média ${s.m}%`, `Seções da região ${rhoTxt[s.rho]}`]),
    m: [
      ["Chuva de nulos", "Aumente os <b>nulos</b> até a luz ficar amarela.", "O teste compara com as seções da região. Muito mais nulos que o normal sinalizam."],
      ["Brancos em excesso", "Aumente só os <b>brancos</b> até a luz ficar amarela.", "Brancos e nulos são somados: o teste olha os votos que não foram para nenhum candidato."],
      ["Seção pequena", "Nesta seção de 40 votos, aumente os <b>nulos</b> até sinalizar.", "Em seções pequenas é preciso uma proporção maior para fugir do acaso."],
      ["Seção grande", "Nesta seção de 400 votos, aumente os <b>nulos</b> até sinalizar.", "Em seções grandes, uma proporção menor já basta."],
      ["Região com muitos nulos", "Aqui 12% costumam votar branco ou nulo. Aumente os <b>nulos</b> até sinalizar.", "O ponto de corte acompanha o padrão da região."],
      ["Ache o limite", "Suba os <b>nulos</b> de 1 em 1 e pare no <b>primeiro valor</b> que acende a luz.", "Esse é o limite desta seção. Um voto a menos e a luz fica verde."],
      ["Campanha de voto nulo", "Um grupo do bairro fez campanha pelo voto nulo. Aumente os <b>nulos</b> até sinalizar.", "Campanhas de voto nulo são legítimas e elevam os nulos de verdade."],
      ["Candidato com registro negado", "O candidato preferido do bairro teve o registro negado, e os votos nele viraram nulos. Aumente os <b>nulos</b> até sinalizar.", "Votos em candidato com registro negado podem ser contados como nulos. É uma causa legítima."],
      ["Eleitores com dificuldade", "Seção de um asilo: muitos idosos com dificuldade de usar a urna. Coloque <b>30 brancos</b> e aumente os <b>nulos</b> até sinalizar.", "Dificuldade de uso da urna é uma causa legítima de brancos e nulos."],
      ["Poucos nulos a mais", "Some <b>3 nulos</b>. A luz continua verde?", "Alterações pequenas ficam dentro da variação normal e o teste não vê."],
      ["Seção pequena demais", "Coloque <b>12 nulos</b> ou mais nesta seção de 29 votos.", "Abaixo de 30 votos o teste não avalia."],
      ["Nenhum branco ou nulo", "Zere <b>brancos e nulos</b>.", "O teste só procura excesso. Falta de brancos e nulos não acende a luz."],
    ],
    faq: [
      ["Por que brancos e nulos são somados?", "Porque os dois são votos que não vão para nenhum candidato. O teste olha esse total em relação aos votos do cargo."],
      ["Por que ter poucos nulos não sinaliza?", "O teste é unilateral: procura só excesso, que é o padrão associado a problemas de registro ou de uso da urna."],
      ["O que é o escore z robusto mostrado na parte técnica?", "Uma medida de quanto a seção se afasta da mediana da região, usando a mediana e o desvio absoluto mediano, que não se deixam levar por valores extremos."],
    ],
    prova: [
      ["O Teste 5 compara a seção com:", "As seções parecidas da mesma região", "O resultado do país", "A eleição anterior", "A seção de número seguinte", "É o grupo de referência."],
      ["Uma campanha de voto nulo no bairro:", "Pode fazer o teste sinalizar de forma legítima", "Prova manipulação", "Nunca muda os nulos", "Anula a seção", "Causas legítimas elevam os nulos."],
      ["Uma seção com menos brancos e nulos que a região:", "Não sinaliza", "Sinaliza", "Fica fora do teste", "É informativa", "O teste procura só excesso."],
      ["Qual é o mínimo de votos para o Teste 5 avaliar?", "30", "10", "100", "Não há mínimo", "Abaixo de 30 votos a proporção varia demais por acaso."],
      ["Em uma seção maior, para sinalizar é preciso:", "Uma proporção de brancos e nulos menor que numa seção pequena", "Uma proporção maior", "Exatamente a mesma proporção", "Ser a maior do país", "Com mais votos, o acaso explica menos."],
      ["Somar 3 nulos numa seção normal:", "Normalmente não acende a luz", "Sempre acende", "Anula a seção", "Muda o comparecimento", "Fica dentro da variação normal."],
    ],
    situ: ["Uma seção teve 35% de votos brancos e nulos para Presidente, numa região onde a média é de 4%.", "Os votos que não foram para nenhum candidato estão muito acima do normal da região numa seção."],
  };

  T.T07 = {
    nome: "Paradoxo de legenda", curto: "Procura boletins de Deputado com muito mais votos de legenda (só no número do partido) do que as seções parecidas da região.",
    vis: "Cada ponto é uma seção fictícia da região (votos de legenda). O losango é a sua seção.",
    campos: { val: "Votos válidos para Dep. Federal", leg: "Votos de legenda", m: "Legenda na região (%)" },
    kv: excessoKv("Votos de legenda"),
    simples: excessoSimples({ un: "votos válidos", coisa: "votos de legenda", legit: "Isso não prova nada: campanhas de voto na legenda e a força de um partido no bairro elevam esses votos de forma legítima." }),
    ficha: (s, f) => fichaL([`Votos válidos para Deputado Federal: ${s.val}`, `Votos de legenda: ${s.leg}`, `Na região, a legenda é em média ${s.m}%`, `Seções da região ${rhoTxt[s.rho]}`]),
    m: [
      ["Legenda em alta", "Aumente os <b>votos de legenda</b> até sinalizar.", "Voto de legenda é o voto só no número do partido. O teste compara com as seções da região."],
      ["Seção pequena", "Nesta seção de 60 votos, aumente a <b>legenda</b> até sinalizar.", "Em seções pequenas é preciso uma proporção maior."],
      ["Seção grande", "Nesta seção de 380 votos, aumente a <b>legenda</b> até sinalizar.", "Em seções grandes, uma proporção menor já basta."],
      ["Região de muita legenda", "Aqui 20% votam na legenda. Aumente a <b>legenda</b> até sinalizar.", "O ponto de corte acompanha o padrão da região."],
      ["Região de pouca legenda", "Aqui só 4% votam na legenda. Aumente a <b>legenda</b> até sinalizar.", "Onde quase ninguém vota na legenda, um aumento menor já chama atenção."],
      ["Ache o limite", "Suba a <b>legenda</b> de 1 em 1 e pare no <b>primeiro valor</b> que acende a luz.", "Esse é o limite desta seção."],
      ["Campanha “vote na legenda”", "Um partido fez campanha para votar só no número dele. Aumente a <b>legenda</b> até sinalizar.", "Campanhas de voto na legenda são legítimas."],
      ["Partido forte no bairro", "Um partido muito tradicional no bairro. Aumente a <b>legenda</b> até sinalizar.", "A força de um partido num lugar explica mais votos de legenda."],
      ["Eleitores que lembram o partido", "Muitos eleitores lembram o número do partido, não o do candidato. Aumente a <b>legenda</b> até sinalizar.", "É um comportamento legítimo que eleva a legenda."],
      ["Um pouco a mais", "Some <b>4 votos</b> de legenda.", "Dentro da variação normal, o teste não vê."],
      ["Seção pequena demais", "Coloque <b>15 ou mais</b> votos de legenda nesta seção de 28 votos.", "Abaixo de 30 votos válidos o teste não avalia."],
      ["Nenhuma legenda", "Zere a <b>legenda</b>.", "O teste procura só excesso."],
    ],
    faq: [
      ["O que é voto de legenda?", "É o voto só no número do partido (dois dígitos), sem escolher um candidato. Ele conta para o partido na divisão das vagas."],
      ["Por que o teste vale só para Deputados?", "Porque o voto de legenda existe nos cargos proporcionais: Deputado Federal, Estadual e Distrital."],
      ["Por que chama paradoxo?", "Porque a maioria dos eleitores vota em pessoas. Uma seção com muitos votos só no partido foge do comportamento comum."],
    ],
    prova: [
      ["O que é voto de legenda?", "O voto só no número do partido", "O voto em branco", "O voto anulado pela Justiça", "O voto em trânsito", "Ele conta para o partido."],
      ["Em quais cargos o Teste 7 é aplicado?", "Deputado Federal, Estadual e Distrital", "Presidente e Governador", "Senador", "Todos os cargos", "A legenda existe nos cargos proporcionais."],
      ["Uma campanha para votar na legenda pode:", "Fazer o teste sinalizar de forma legítima", "Anular a seção", "Diminuir a legenda", "Provar manipulação", "É uma causa legítima."],
      ["O mínimo de votos válidos para o Teste 7 avaliar é:", "30", "10", "50", "100", "Igual aos outros testes de proporção."],
      ["Menos legenda que a região:", "Não sinaliza", "Sinaliza", "Fica fora do teste", "É informativo", "O teste procura só excesso."],
      ["O ajuste de Benjamini–Hochberg serve para:", "Evitar alarmes falsos quando se testam muitas seções", "Somar votos de legenda", "Trocar o partido", "Mudar a região", "É a correção para múltiplos testes."],
    ],
    situ: ["Numa seção, 40% dos votos para Deputado Federal foram só no número do partido, numa região onde a média é de 7%.", "Votos sem candidato, só no número do partido, estão muito acima do normal numa seção."],
  };

  T.T10 = {
    nome: "Baixa validação biométrica", curto: "Procura seções em que muitos eleitores com digital cadastrada foram liberados sem a digital, bem acima do padrão da região.",
    vis: "Cada ponto é uma seção fictícia da região (liberados sem biometria). O losango é a sua seção.",
    campos: { co: "Comparecimento", sb: "Liberados sem biometria", m: "Sem biometria na região (%)" },
    kv: excessoKv("Sem biometria"),
    simples: excessoSimples({ un: "eleitores que votaram", coisa: "eleitores liberados sem biometria", legit: "Isso não prova nada: digitais gastas (idosos, trabalhadores manuais), leitor biométrico com defeito e cadastro de baixa qualidade na região explicam aumentos legítimos." }),
    ficha: (s, f) => fichaL([`Comparecimento: ${s.co}`, `Liberados sem biometria: ${s.sb}`, `Na região, a média é de ${s.m}%`, `Seções da região ${rhoTxt[s.rho]}`]),
    m: [
      ["Biometria não usada", "Aumente os <b>liberados sem biometria</b> até sinalizar.", "Quem tem digital cadastrada normalmente é liberado pela digital. Liberar muitos sem ela foge do padrão da região."],
      ["Seção pequena", "Nesta seção de 60 votantes, aumente até sinalizar.", "Em seções pequenas é preciso uma proporção maior."],
      ["Seção grande", "Nesta seção de 380 votantes, aumente até sinalizar.", "Em seções grandes, uma proporção menor já basta."],
      ["Região onde a digital falha muito", "Aqui 12% costumam ser liberados sem a digital. Aumente até sinalizar.", "O ponto de corte acompanha a região."],
      ["Região onde a digital quase nunca falha", "Aqui só 1,5% são liberados sem a digital. Aumente até sinalizar.", "Onde a biometria funciona bem, um aumento menor já chama atenção."],
      ["Ache o limite", "Suba de 1 em 1 e pare no <b>primeiro valor</b> que acende a luz.", "Esse é o limite desta seção."],
      ["Leitor com defeito", "O leitor de digitais falhou à tarde. Aumente até sinalizar.", "Defeito no leitor é causa legítima e costuma estar registrado na ata."],
      ["Trabalhadores rurais", "Muitos eleitores com digitais gastas pelo trabalho manual. Aumente até sinalizar.", "Digitais gastas não são lidas. É uma causa legítima."],
      ["Seção de idosos", "Seção com muitos idosos, cuja digital é difícil de ler. Aumente até sinalizar.", "A pele muda com a idade e o leitor falha mais."],
      ["Poucos a mais", "Some <b>3</b> liberados sem biometria.", "Dentro da variação normal, o teste não vê."],
      ["Seção pequena demais", "Coloque <b>15 ou mais</b> nesta seção de 29 votantes.", "Abaixo de 30 votantes o teste não avalia."],
      ["Ninguém sem biometria", "Zere os liberados sem biometria.", "O teste procura só excesso."],
    ],
    faq: [
      ["O que é ser liberado sem biometria?", "É quando o eleitor tem digital cadastrada, mas é liberado para votar por outro meio (documento com foto e assinatura), porque a digital não foi reconhecida."],
      ["Por que o denominador é o comparecimento?", "Porque o boletim não informa quantos eleitores da seção têm biometria. O teste usa o total de pessoas que votaram."],
      ["Isso indica voto de outra pessoa?", "Não. É só um alerta para conferir a ata e o registro do leitor. Há muitas causas legítimas."],
    ],
    prova: [
      ["O que o Teste 10 olha?", "Eleitores com digital cadastrada liberados sem a digital", "Eleitores sem título", "Votos brancos", "Horário da urna", "É a biometria não usada acima do padrão."],
      ["Uma causa legítima para muitos liberados sem biometria é:", "Leitor biométrico com defeito", "Candidato forte", "Seção grande", "Urna de contingência oficial", "Defeitos e digitais gastas explicam aumentos."],
      ["Qual denominador o teste usa?", "O comparecimento", "Os aptos com biometria", "Os votos válidos", "Os brancos", "O boletim não informa quantos têm biometria."],
      ["Mínimo de votantes para o teste avaliar:", "30", "20", "10", "100", "É o mínimo dos testes de proporção."],
      ["Menos liberados sem biometria que a região:", "Não sinaliza", "Sinaliza", "Fica fora do teste", "É informativo", "O teste procura só excesso."],
      ["Se o teste sinaliza, o próximo passo é:", "Conferir a ata da seção e os registros da urna", "Anular a seção", "Concluir que houve manipulação", "Ignorar", "Anomalia é alerta para conferência."],
    ],
    situ: ["Numa seção, 25% dos eleitores com digital cadastrada foram liberados sem a digital, numa região onde a média é de 3%.", "O leitor de digitais de uma urna parou de funcionar e muitos eleitores votaram sem identificação biométrica."],
  };

  const ESP = ["Esquerda", "Centro-esquerda", "Centro", "Centro-direita", "Direita"];
  T.T06 = {
    nome: "Voto cruzado extremo", curto: "Procura seções em que o voto para Presidente e o voto para Deputado vão para lados opostos de forma extrema e muito diferente da região.",
    vis: "Votos da seção por lado político (classificação do autor, fictícia aqui)", vis2: "Cada ponto é a diferença entre os dois cargos numa seção fictícia da região. O losango é a sua seção.",
    esp: ESP,
    campos: { nx: "Votos válidos para Presidente", nl: "Votos válidos para Dep. Federal", eA: "Candidato A (esquerda) para Presidente (%)", "l.0": "Dep. Federal: Esquerda", "l.1": "Dep. Federal: Centro-esquerda", "l.2": "Dep. Federal: Centro", "l.3": "Dep. Federal: Centro-direita", "l.4": "Dep. Federal: Direita", grupo: "Região" },
    op: { grupo: { padrao: "Voto dividido é raro", dividido: "Voto dividido é comum" } },
    kv(s, r, f) { const v = r.v; return [["Bloco esquerda (Pres. / Dep.)", `${f.pct(v.ex.e, 0)} / ${f.pct(v.lg.e, 0)}`], ["Bloco direita (Pres. / Dep.)", `${f.pct(v.ex.d, 0)} / ${f.pct(v.lg.d, 0)}`], ["Diferença (Δ)", f.n(v.delta, 2)]].concat(v.z != null ? [["Escore z robusto", f.n(v.z, 2)]] : []); },
    simples(s, r, f) {
      const v = r.v;
      if (r.nivel === "na") return ["A seção tem menos de 50 votos válidos em algum dos cargos. O teste só avalia a partir de 50 em cada um."];
      const out = [`Para Presidente, o bloco esquerda tem ${f.pct(v.ex.e, 0)} e o bloco direita ${f.pct(v.ex.d, 0)}. Para Deputado Federal, ${f.pct(v.lg.e, 0)} e ${f.pct(v.lg.d, 0)} (o Centro fica fora dos dois blocos).`];
      out.push(v.crA ? "<b>Critério A atingido:</b> um bloco tem 70% ou mais num cargo e o bloco oposto tem 70% ou mais no outro." : "Critério A não atingido: nenhum bloco chega a 70% num cargo com o bloco oposto também a 70% no outro.");
      out.push(v.crB ? `<b>Critério B atingido:</b> a diferença entre os cargos (${f.n(v.delta, 2)}) foge muito do padrão das seções da região (z = ${f.n(v.z, 1)}; o limite é 3,5).` : `Critério B não atingido: a diferença entre os cargos fica dentro do padrão da região (z = ${f.n(v.z, 1)}; o limite é 3,5).`);
      if (r.nivel === "anom") out.push("<b>Como os dois critérios valem ao mesmo tempo, o teste sinaliza.</b>", "Isso não prova nada: votar em lados diferentes para Presidente e Deputado é comum e legítimo no Brasil, por exemplo por um deputado popular no bairro. Além disso, a classificação dos partidos em esquerda e direita é uma premissa do autor, não uma categoria oficial.");
      else out.push("O teste só sinaliza quando os dois critérios valem juntos.");
      return out;
    },
    ficha: (s, f) => fichaL([`Presidente: Candidato A (esquerda) ${s.eA}%, Candidato B (direita) ${100 - s.eA}% · ${s.nx} votos válidos`, `Deputado Federal: ${ESP.map((e, i) => `${e} ${s.l[i]}`).join(", ")} · ${s.nl} votos válidos`, `Região: ${s.grupo === "dividido" ? "voto dividido é comum" : "voto dividido é raro"}`]),
    m: [
      ["Esquerda e direita ao mesmo tempo", "Coloque o <b>Candidato A</b> (esquerda) com 80% e o Deputado Federal com <b>60% Direita</b> e 20% Centro-direita.", "Quando um bloco tem 70% ou mais num cargo e o oposto tem 70% ou mais no outro, e isso também foge muito da região, o teste sinaliza."],
      ["O contrário", "Candidato A com <b>20%</b> (B, de direita, com 80%) e Deputado com <b>50% Esquerda</b> e 25% Centro-esquerda.", "O teste olha os dois sentidos."],
      ["Região de voto dividido", "Aqui o voto dividido é comum. Faça um caso extremo: A com <b>97%</b> e Deputado com <b>90% Direita</b>.", "Onde dividir o voto é comum, só casos muito extremos fogem do padrão."],
      ["Seção com poucos votos", "A com <b>85%</b> e Deputado com 60% Direita e 25% Centro-direita.", "O teste vale a partir de 50 votos válidos em cada cargo."],
      ["Pela centro-direita", "A com <b>88%</b> e Deputado com <b>70% Centro-direita</b> e 15% Direita.", "O bloco direita soma Direita e Centro-direita."],
      ["Pela centro-esquerda", "A com <b>12%</b> e Deputado com <b>65% Centro-esquerda</b> e 15% Esquerda.", "O bloco esquerda soma Esquerda e Centro-esquerda."],
      ["Deputado popular no bairro", "Um deputado de direita muito querido no bairro: A com <b>78%</b> e Deputado com <b>72% Direita</b>.", "Voto dividido é comum e legítimo. Um político local popular explica o sinal."],
      ["Voto para equilibrar", "Eleitores que votam de propósito em lados opostos: A com <b>22%</b> e Deputado com <b>48% Esquerda</b> e 30% Centro-esquerda.", "Há eleitores que dividem o voto para equilibrar o poder. É legítimo."],
      ["Reduto de um partido", "A com <b>76%</b> e Deputado com <b>65% Direita</b> e 15% Centro-direita.", "A força de um partido local para Deputado convive com outra preferência para Presidente."],
      ["Divergência moderada", "Deixe A com <b>66%</b> e o bloco direita do Deputado com <b>65%</b>.", "Abaixo de 70% em algum dos cargos, o critério A não é atingido, mesmo com bastante diferença."],
      ["Seção pequena demais", "A com <b>90%</b> e Deputado com <b>80% Direita</b>.", "Abaixo de 50 votos válidos em algum cargo, o teste não avalia."],
      ["Voto no centro", "A com <b>90%</b> e Deputado com <b>60% Centro</b>.", "Votos de Centro não entram em nenhum bloco. Assim o bloco oposto não chega a 70%."],
    ],
    faq: [
      ["Quem decidiu quais partidos são de esquerda ou de direita?", "É uma premissa analítica do autor, explicada no Relatório Técnico. Não é uma classificação oficial. No simulador, os blocos são fictícios."],
      ["Por que precisa dos dois critérios?", "O critério A pega casos extremos; o B confere se isso é raro na região. Juntos, evitam sinalizar regiões onde o voto dividido é comum."],
      ["Voto dividido é errado?", "Não. É um comportamento legítimo e frequente. O teste só aponta casos extremos e raros para conferência."],
    ],
    prova: [
      ["O critério A do Teste 6 exige:", "70% ou mais de um bloco num cargo e do bloco oposto no outro", "50% para cada candidato", "Mais de 100 votos", "Votos iguais nos dois cargos", "É o critério dos blocos."],
      ["O critério B do Teste 6 usa:", "O escore z robusto em relação à região", "A soma dos brancos", "O horário da urna", "A urna de contingência", "Compara a diferença entre os cargos com a região, com limite 3,5."],
      ["Voto dividido entre esquerda e direita é:", "Comportamento legítimo e frequente", "Proibido", "Sempre sinalizado", "Prova de manipulação", "O teste só aponta casos extremos e raros."],
      ["Votos de Centro:", "Ficam fora dos blocos esquerda e direita", "Contam como esquerda", "Contam como direita", "São descartados do total", "Eles entram no total, mas em nenhum bloco."],
      ["A classificação dos partidos usada no teste é:", "Uma premissa analítica do autor", "Uma lista oficial do TSE", "Definida por sorteio", "Escolhida pelo eleitor", "Não é categoria oficial."],
      ["Mínimo de votos válidos em cada cargo para o teste avaliar:", "50", "10", "30", "200", "É o mínimo do voto cruzado."],
    ],
    situ: ["Numa seção, 85% votaram no candidato a Presidente de esquerda e 80% votaram em Deputados de direita, algo muito raro na região.", "O voto para Presidente e o voto para Deputado de uma seção foram para lados políticos opostos de forma extrema."],
  };

  T.T08 = {
    nome: "Contraste de vizinhança", curto: "Compara cada seção com as demais seções do mesmo local de votação e procura uma que vote de forma muito diferente.",
    local: "Local de votação fictício: Escola Exemplo", dif: "Diferença (p.p.)", alvo: "(em foco)", media: "Votação de A no local", vis: "% do Candidato A em cada seção (a linha tracejada é a média das demais seções do local)",
    vis_leg: "Barras em amarelo: seções que o teste sinalizaria.",
    campos: { k: "Seções no local", n: "Votos válidos", a: "% do Candidato A" },
    simples(s, r, f) {
      const v = r.v, q = v.alvo || {};
      if (r.nivel === "na" && !q.n) return [`O local tem só ${v.k} seções. O teste só avalia locais com pelo menos 3: com 2, não dá para saber qual das duas é a diferente.`];
      if (q.na) return ["A seção em foco tem menos de 30 votos válidos. O teste não a avalia."];
      const out = [`A seção em foco dá <b>${f.pct(q.pS)}</b> ao Candidato A; as demais seções do mesmo local dão <b>${f.pct(q.pR)}</b>. A diferença é de <b>${f.n(Math.abs(q.dif), 1)} pontos</b>.`,
        `Para sinalizar, o teste exige duas coisas: diferença de pelo menos 25 pontos e que ela seja improvável por acaso, mesmo considerando as cerca de ${f.n(v.M)} seções testadas no país. Aqui a chance por acaso é de ${f.chance(q.lp)}.`];
      const outras = r.cats.filter((c) => c.secao !== +s.alvo).length;
      if (q.sinal) out.push("<b>As duas condições valem: o teste sinaliza esta seção.</b> O normal seria ela votar parecido com as vizinhas do mesmo local.", "Isso não prova nada: a divisão dos eleitores em seções segue em parte o endereço e a ordem do cadastro, e uma seção pode reunir um público diferente (outro bairro, outra faixa de idade).");
      else out.push(Math.abs(q.dif) < 25 ? "A diferença fica abaixo de 25 pontos, então o teste não sinaliza." : "A diferença passa de 25 pontos, mas ainda pode ser explicada pelo acaso (seções pequenas variam mais). O teste não sinaliza.");
      if (outras) out.push(`Outra${p(outras)} ${outras} seç${outras === 1 ? "ão" : "ões"} do local também acenderia${outras === 1 ? "" : "m"} a luz.`);
      return out;
    },
    ficha: (s, f) => fichaL(Array.from({ length: +s.k }, (_, i) => `Seção ${i + 1}: ${s.n[i]} votos válidos, ${s.a[i]}% para o Candidato A${i === +s.alvo ? " (em foco)" : ""}`)),
    m: [
      ["Uma seção destoa", "Leve a <b>Seção 3</b> a 90% para o Candidato A.", "As seções do mesmo local costumam votar parecido. Uma delas muito diferente das outras sinaliza."],
      ["Para baixo", "Leve a <b>Seção 3</b> a 20%.", "O teste olha diferenças para cima e para baixo."],
      ["Local com 3 seções", "Leve a <b>Seção 2</b> a 92%.", "O teste vale a partir de 3 seções no local."],
      ["Seções pequenas", "As seções têm cerca de 40 votos. Leve a <b>Seção 3</b> a 100%.", "Com cerca de 40 votos por seção, nem 100% basta: depois de considerar todas as seções do país, o acaso ainda explica a diferença."],
      ["Ache o limite", "Suba a <b>Seção 3</b> aos poucos e pare no <b>primeiro valor</b> que acende a luz.", "O sinal exige diferença de 25 pontos ou mais e que ela não seja explicável pelo acaso."],
      ["Duas seções diferentes", "Leve as <b>Seções 2 e 5</b> a 95%.", "Mais de uma seção pode ser sinalizada no mesmo local."],
      ["Bairro diferente", "A Seção 3 recebe eleitores de outro bairro. Leve-a a <b>88%</b>.", "A divisão de eleitores em seções segue em parte o endereço e a ordem de cadastro. Uma seção pode ter um público diferente."],
      ["Seção de eleitores mais velhos", "A Seção 4 reúne eleitores mais velhos, cadastrados há décadas. Leve-a a <b>22%</b>.", "Idade e tempo de cadastro mudam o perfil de uma seção. É uma causa legítima."],
      ["Eleitores transferidos", "A Seção 1 recebeu eleitores transferidos de outra cidade. Leve-a a <b>90%</b>.", "Grupos com origem diferente podem votar diferente das vizinhas."],
      ["Quase 25 pontos", "Leve a <b>Seção 3</b> a <b>77%</b>: diferença grande, mas abaixo de 25 pontos.", "Abaixo de 25 pontos o teste não sinaliza, mesmo que a diferença seja grande."],
      ["Local com 2 seções", "Leve a <b>Seção 2</b> a 90%.", "Com menos de 3 seções o teste não avalia."],
      ["Tudo junto", "Aumente <b>todas as seções</b> do local em 25 pontos.", "Se todas mudam juntas, nenhuma destoa das vizinhas. O teste compara dentro do local; mudanças no local inteiro precisam de outros testes."],
    ],
    faq: [
      ["Por que comparar com o mesmo local?", "Seções do mesmo prédio costumam ter eleitores parecidos (mesmo bairro). Por isso uma seção muito diferente das vizinhas chama atenção."],
      ["O que é a sobredispersão φ?", "É uma correção: na vida real, as seções variam mais do que o acaso puro prevê. O teste mede essa variação extra no grupo e a desconta, para não sinalizar demais."],
      ["Por que 25 pontos?", "Porque diferenças menores são comuns entre seções do mesmo local. O limite evita sinalizar variações pequenas, mesmo quando elas são estatisticamente claras."],
    ],
    prova: [
      ["O Teste 8 compara uma seção com:", "As demais seções do mesmo local de votação", "O país inteiro", "A eleição anterior", "A seção de outro estado", "É o contraste de vizinhança."],
      ["Para sinalizar, o teste exige:", "Diferença de 25 pontos ou mais e improvável por acaso", "Só diferença de 10 pontos", "Só que a seção seja grande", "Que o local tenha 2 seções", "As duas condições juntas."],
      ["Um local com 2 seções:", "Fica fora do teste", "Sempre sinaliza", "É informativo", "É somado ao vizinho", "O mínimo é 3 seções."],
      ["Se todas as seções do local mudarem juntas:", "O Teste 8 não vê", "O Teste 8 sinaliza todas", "O local é anulado", "O teste fica mais sensível", "Nenhuma destoa das vizinhas."],
      ["Uma causa legítima para uma seção destoar é:", "Eleitores de outro bairro ou outra faixa de idade", "Urna de contingência", "Horário de encerramento", "Votos de legenda", "A divisão em seções segue endereço e ordem de cadastro."],
      ["Em seções pequenas, a mesma diferença de pontos:", "É mais fácil de ser explicada pelo acaso", "É sempre sinalizada", "Não existe", "Vale o dobro", "Seções pequenas variam mais."],
    ],
    situ: ["Numa escola com 6 seções, todas dão cerca de 50% a um candidato, menos uma, que dá 92%.", "Uma seção vota de forma muito diferente das outras seções do mesmo prédio."],
  };

  T.T09 = {
    nome: "Seções com resultados idênticos", curto: "Procura seções diferentes com resultados exatamente iguais, voto por voto, e calcula se isso poderia acontecer por acaso.",
    titulo_par: "Duas seções fictícias", copiar: "Copiar a seção 42 na 87", total: "Total",
    cats: { p: ["Candidato A", "Candidato B", "Brancos", "Nulos"], g: ["Governador 1", "Governador 2", "Governador 3", "Governador 4", "Governador 5", "Governador 6", "Brancos", "Nulos"],
      d: ["Deputado 1", "Deputado 2", "Deputado 3", "Deputado 4", "Deputado 5", "Deputado 6", "Deputado 7", "Deputado 8", "Deputado 9", "Deputado 10", "Legenda", "Brancos", "Nulos"] },
    campos: { cargo: "Cargo", N: "Seções com o mesmo total de votos no escopo" },
    op: { cargo: { p: "Presidente (4 categorias)", g: "Governador (8 categorias)", d: "Deputado Federal (13 categorias)" } },
    kv(s, r, f) { const v = r.v; return [["Resultados iguais?", v.igual ? "sim" : "não"], ["Votos (n) · categorias (K)", `${f.n(v.n)} · ${v.K}`]].concat(v.lpc != null ? [["Chance de coincidir (um par)", f.chance(v.lpc)], ["Coincidências esperadas (E)", f.sci(v.lE)]] : []); },
    simples(s, r, f) {
      const v = r.v;
      if (!v.igual) return ["As duas seções têm resultados diferentes em pelo menos uma categoria. O teste só olha resultados <b>exatamente</b> iguais, voto por voto.", "Basta um voto de diferença para o teste não considerar uma cópia."];
      if (r.nivel === "na") return [`As seções são idênticas, mas o teste só avalia boletins com pelo menos 50 votos e 3 categorias com votos (aqui: ${f.n(v.n)} votos e ${v.K} categorias). Com menos, coincidências por acaso são comuns.`];
      const out = [`As duas seções têm exatamente o mesmo resultado: ${f.n(v.n)} votos em ${v.K} categorias.`,
        `A chance de duas seções desse tamanho coincidirem por acaso é de ${f.chance(v.lpc)}. Mas existem ${f.n(v.N)} seções com o mesmo total no escopo, o que dá ${f.n(v.pares)} pares possíveis. O número esperado de coincidências por acaso é <b>${f.sci(v.lE)}</b>.`];
      if (r.nivel === "anom") out.push("<b>Esse número é menor que 0,01: o teste sinaliza.</b> O normal seria duas seções terem resultados parecidos, mas não idênticos.", "Isso não prova nada: a causa mais comum é a duplicação de um registro na extração dos dados. A conferência é com os boletins impressos das duas seções.");
      else out.push("<b>Coincidências assim são esperadas por acaso</b> (o número esperado não é menor que 0,01). Com poucas categorias, como no Presidente, resultados iguais acontecem naturalmente entre milhares de seções.");
      return out;
    },
    ficha: (s, f) => fichaL([`Cargo: ${({ p: "Presidente", g: "Governador", d: "Deputado Federal" })[s.cargo]}`, `Seção 42: ${s.v1.join(", ")}`, `Seção 87: ${s.v2.join(", ")}`, `Seções com o mesmo total de votos no escopo: ${f.n(s.N)}`]),
    m: [
      ["Cópia de boletim", "Clique em <b>Copiar a seção 42 na 87</b>.", "Dois boletins de Deputado Federal idênticos, com 13 categorias e mais de 200 votos, quase nunca acontecem por acaso."],
      ["Cópia no Governador", "Copie a seção 42 na 87 (8 categorias).", "Com várias categorias, resultados idênticos são raríssimos."],
      ["Seções menores", "Copie a seção 42 na 87 (cerca de 55 votos).", "Mesmo com poucos votos, 13 categorias iguais são muito improváveis."],
      ["Estado grande", "Há 1.500 seções com o mesmo total no estado. Copie a seção 42 na 87.", "Mesmo com muitos pares possíveis, a coincidência continua improvável."],
      ["Registro duplicado", "Copie a seção 42 na 87, como se o mesmo boletim tivesse sido gravado duas vezes no arquivo.", "Duplicação na extração dos dados gera o mesmo sinal. Por isso o site confere os arquivos originais."],
      ["Seção agregada repetida", "Copie a seção 42 na 87, como se uma seção agregada tivesse sido informada duas vezes.", "Seções agregadas são juntadas a uma principal. Um erro de registro pode repetir o resultado."],
      ["Boletim retransmitido", "Copie a seção 42 na 87, como se o boletim de uma tivesse sido gravado no lugar da outra.", "Erros de transmissão ou de arquivo explicam cópias. A conferência é com os boletins impressos."],
      ["Cópia com um voto mudado", "Copie e depois mude <b>1 voto</b> de um candidato para outro na seção 87.", "O teste procura resultados exatamente iguais. Uma diferença de um voto basta para ele não ver."],
      ["Presidente: coincidência esperada", "Copie a seção 42 na 87 no Presidente (4 categorias).", "Com só 4 categorias e milhares de seções do mesmo tamanho no país, resultados iguais acontecem por acaso. O teste calcula isso e não sinaliza."],
      ["Presidente em seção pequena", "Copie a seção 42 na 87 (Presidente, cerca de 60 votos).", "Quanto menor a seção e menos categorias, mais comuns são as coincidências."],
      ["Menos de 50 votos", "Copie a seção 42 na 87 (44 votos).", "Abaixo de 50 votos o teste não avalia."],
      ["Só dois candidatos", "Copie a seção 42 na 87 (só A e B têm votos).", "Com menos de 3 categorias com votos, o teste não avalia."],
    ],
    faq: [
      ["Como duas seções podem ter resultados iguais por acaso?", "Com poucas categorias e muitas seções do mesmo tamanho, coincidências acontecem naturalmente. O teste calcula quantas seriam esperadas e só sinaliza quando isso é muito improvável."],
      ["O que é o número esperado E?", "É a chance de um par coincidir multiplicada pelo número de pares de seções com o mesmo total. Se E for menor que 0,01, a coincidência é rara demais."],
      ["Qual a causa mais comum de resultados idênticos?", "Duplicação de registros ao extrair ou transmitir os dados. Por isso a conferência é com os boletins impressos."],
    ],
    prova: [
      ["O Teste 9 procura:", "Seções com resultados exatamente iguais", "Seções com resultados parecidos", "Seções com muitos brancos", "Seções do mesmo local", "Igualdade voto por voto."],
      ["Uma cópia com 1 voto mudado:", "Não é vista pelo Teste 9", "Sempre sinaliza", "Fica fora do teste", "É informativa", "O teste exige igualdade exata."],
      ["Por que resultados iguais no Presidente (4 categorias) costumam não sinalizar?", "Porque com poucas categorias e milhares de seções coincidências são esperadas", "Porque o Presidente não é testado", "Porque o teste ignora brancos", "Porque são sempre irregulares", "O número esperado E não fica abaixo de 0,01."],
      ["O teste sinaliza quando:", "O número esperado de coincidências por acaso é menor que 0,01", "As seções são vizinhas", "Há mais de 100 votos", "O vencedor é o mesmo", "É o critério do Teste 9."],
      ["Mínimos do Teste 9:", "50 votos e 3 categorias com votos", "10 votos", "Só 2 categorias", "100 seções", "Abaixo disso coincidências são comuns."],
      ["A causa mais comum de resultados idênticos é:", "Duplicação de registros nos dados", "Urna de contingência", "Voto em trânsito", "Horário de verão", "A conferência é com os boletins impressos."],
    ],
    situ: ["Duas seções de cidades diferentes têm exatamente os mesmos votos para Deputado Federal, candidato por candidato.", "O boletim de uma seção parece ter sido copiado em outra, voto por voto."],
  };

  T.T11 = {
    nome: "Horários atípicos", curto: "Confere a ordem e o horário dos eventos do boletim: abertura, encerramento, emissão e recebimento, com 2 minutos de tolerância.",
    vis: "Linha do tempo da seção (hora local). A faixa verde é o horário oficial de votação.", janela: "horário oficial", vis_leg: "O recebimento pelo TSE é registrado em hora de Brasília e aparece aqui convertido para a hora local.",
    ev: { ab: "Abertura", en: "Encerramento", em: "Emissão", re: "Recebimento" },
    alerta: { ab: ["abertura_antecipada", "atraso_abertura", "encerramento_antes_abertura"], en: ["encerramento_antecipado", "encerramento_antes_abertura", "emissao_antes_encerramento"], em: ["emissao_antes_encerramento", "recebimento_antes_emissao"], re: ["recebimento_antes_emissao"] },
    campos: { fuso: "Fuso da cidade", ab: "Abertura (hora local)", en: "Encerramento (hora local)", em: "Emissão do boletim (hora local)", re: "Recebimento pelo TSE (hora de Brasília)", drift: "Relógio da urna (minutos: + adiantado, − atrasado)", data: "Data diferente do dia da eleição" },
    op: { fuso: { 0: "Igual a Brasília", "-1": "1 hora a menos (como Manaus)", "-2": "2 horas a menos (como o Acre)" } },
    simples(s, r, f) {
      const v = r.v;
      if (!r.cats.length) return [`Tudo em ordem: a urna abriu às ${f.hora(v.ab)} e encerrou às ${f.hora(v.en)} (hora local), dentro do horário oficial (das ${f.hora(v.ini)} às ${f.hora(v.fim)} nesta cidade, com 2 minutos de tolerância). O boletim foi emitido depois do encerramento e recebido depois de emitido.`,
        "Encerrar depois das 17h é normal quando há fila: quem chegou até as 17h vota."];
      const out = [`O teste encontrou: ${r.cats.map((c) => `<b>${f.cat(c.c)}</b>`).join("; ")}.`,
        `O certo é: abrir a partir das ${f.hora(v.ini)} (hora local), encerrar a partir das ${f.hora(v.fim)}, emitir o boletim depois do encerramento e o TSE receber depois da emissão, tudo no dia da eleição.`];
      if (r.nivel === "info") out.push("A abertura com 1 hora ou mais de atraso é só <b>informativa</b> (luz azul): costuma ter causa operacional, como troca de urna.");
      else out.push("Isso não prova nada: relógio da urna desregulado, troca de urna durante a votação e cidades com fuso diferente da maioria do estado explicam muitos casos.");
      if (+s.drift) out.push(`Neste caso, o relógio da urna está ${Math.abs(s.drift)} minutos ${s.drift > 0 ? "adiantado" : "atrasado"}, e os horários registrados no boletim saem errados.`);
      return out;
    },
    ficha: (s, f) => fichaL([`Fuso da cidade: ${({ 0: "igual a Brasília", "-1": "1 hora a menos que Brasília", "-2": "2 horas a menos que Brasília" })[s.fuso]}`, `Abertura ${f.hora(s.ab)} · encerramento ${f.hora(s.en)} · emissão ${f.hora(s.em)} (hora local)`, `Recebimento pelo TSE: ${f.hora(s.re)} (hora de Brasília)`]),
    m: [
      ["Abriu cedo demais", "Mude a <b>abertura</b> para 07:50.", "A votação começa às 8h de Brasília (convertida para a hora local). Com tolerância de 2 minutos, abrir às 07:50 sinaliza."],
      ["Fechou cedo", "Mude o <b>encerramento</b> para 16:30.", "A votação vai até as 17h. Encerrar mais de 2 minutos antes sinaliza."],
      ["Boletim antes do fim", "Mude a <b>emissão do boletim</b> para 16:55, antes do encerramento.", "O boletim só pode ser impresso depois de encerrada a votação."],
      ["Recebido antes de existir", "Mude o <b>recebimento pelo TSE</b> para 16:50.", "O TSE não pode receber um boletim que ainda não foi emitido."],
      ["Fechou antes de abrir", "Mude o <b>encerramento</b> para 07:30.", "Ordem impossível de eventos."],
      ["Dia errado", "Marque <b>Data diferente do dia da eleição</b>.", "Abertura e encerramento têm de ser no dia da eleição."],
      ["Relógio atrasado", "O relógio desta urna está 15 minutos atrasado. Ajuste o <b>relógio da urna</b> para −15.", "A urna abriu às 8h certinho, mas o relógio interno marcou 07:45. Relógio desregulado é causa conhecida e explicável."],
      ["Urna ligada à tarde", "A urna quebrou e a substituta foi ligada às 13:10. Mude a <b>abertura</b> para 13:10.", "Atrasos de 1 hora ou mais ficam só como informativo (luz azul): têm causas operacionais."],
      ["Relógio adiantado", "O relógio da urna está 25 minutos adiantado. Ajuste o <b>relógio da urna</b> para +25.", "A emissão parece depois do recebimento porque o relógio da urna está errado; o recebimento usa o relógio do TSE."],
      ["Dentro da tolerância", "Mude o <b>encerramento</b> para 16:59 e a emissão para 17:01.", "Há 2 minutos de tolerância para pequenas diferenças de relógio."],
      ["Cidade com outro fuso", "Esta cidade tem 1 hora a menos que Brasília. Abra às <b>07:01</b>, feche às 16:01 e emita às 16:03 (hora local).", "7h local é 8h em Brasília. O teste descobre o fuso de cada cidade pelos horários de abertura das suas seções."],
      ["Fila até tarde", "Havia fila. Feche às <b>19:10</b>, emita às 19:13 e receba às 19:30.", "Encerrar depois das 17h é normal quando há fila. O teste não sinaliza."],
    ],
    faq: [
      ["Por que encerrar depois das 17h não sinaliza?", "Porque quem está na fila às 17h tem direito de votar. A votação pode terminar bem depois em seções com fila."],
      ["Como o teste sabe o fuso de cada cidade?", "Pelo 10º percentil dos horários de abertura das seções da cidade: uma abertura regular nunca é antes do horário oficial, e atrasos não mudam essa referência."],
      ["Por que o recebimento usa outro relógio?", "A abertura, o encerramento e a emissão são registrados pelo relógio da urna, em hora local. O recebimento é registrado pelo sistema do TSE, em hora de Brasília."],
    ],
    prova: [
      ["Qual é a tolerância do Teste 11?", "2 minutos", "30 minutos", "1 hora", "Não há tolerância", "Pequenas diferenças de relógio são aceitas."],
      ["Encerrar às 19h por causa de fila:", "É normal e não sinaliza", "Sempre sinaliza", "É informativo", "Anula a seção", "Quem chegou até as 17h vota."],
      ["Uma abertura com 2 horas de atraso:", "É registrada só como informativa", "É anomalia grave", "Não é registrada", "Anula a urna", "Atrasos têm causas operacionais."],
      ["Numa cidade com 1 hora a menos que Brasília, abrir às 07:00 local:", "É normal", "Sinaliza abertura antecipada", "Fica fora do teste", "É informativo", "7h local equivale a 8h em Brasília."],
      ["Um relógio de urna desregulado pode:", "Fazer o teste sinalizar sem nada errado na votação", "Mudar os votos", "Somar eleitores", "Trocar a urna", "É uma causa explicável."],
      ["Qual destas ordens é impossível?", "Recebimento pelo TSE antes da emissão do boletim", "Abertura antes do encerramento", "Emissão depois do encerramento", "Encerramento depois das 17h", "O TSE não recebe o que ainda não existe."],
    ],
    situ: ["O boletim de uma seção registra que a urna abriu às 07:30, meia hora antes do horário oficial.", "O boletim diz que foi recebido pelo TSE antes de ter sido emitido pela urna."],
  };

  T.T12 = {
    nome: "Troca de urna e votação em cédula", curto: "Confere se a urna usada na seção é a prevista na lista oficial, se o programa gravado bate e se houve urna anulada ou votação em cédula.",
    prevista: "Urna prevista (lista oficial)", usada: "Urna usada (boletim)", nr: "Nº", carga_t: "Carga", lista: "Lista oficial de contingência", outra_t: "Urna prevista para a seção 43:",
    campos: { urna: "Urna usada", carga: "Código de carga (programa gravado)", tipo: "Situação da urna", junta: "Votação em cédula (junta apuradora)", semCesp: "Lista oficial não publicada para a seção", va: "Votos do Candidato A", vb: "Votos do Candidato B" },
    op: { urna: { prev: "A urna prevista (2045123)", cont: "Urna de contingência da lista (2099001)", outra: "Urna prevista para a seção 43 (2045777)", desc: "Urna desconhecida (3011999)" },
      carga: { A7F3: "A7F3 (a prevista)", B2E8: "B2E8 (outra)", "": "Sem código" }, tipo: { 1: "Apurada", 2: "Não apurada", 3: "Anulada e apurada em separado", 4: "Anulada", 5: "Não instalada" } },
    simples(s, r, f) {
      if (!r.cats.length) return ["A urna usada é a prevista na lista oficial, com o programa (código de carga) previsto, e foi apurada normalmente.", "O Teste 12 confere a urna, não os votos dentro dela. Para os votos, valem os outros testes e o boletim impresso."];
      const out = [`O teste encontrou: ${r.cats.map((c) => `<b>${f.cat(c.c)}</b>`).join("; ")}.`];
      if (r.nivel === "info") out.push("<b>Fica só como informativo (luz azul)</b>: trocar uma urna com defeito por uma de contingência da lista oficial, com o programa certo, e votar em cédula quando as urnas falham são procedimentos previstos, registrados na ata da mesa.");
      else out.push("O normal é a seção usar a urna prevista, com o programa previsto, ou uma urna de contingência da lista oficial com o mesmo programa.", "Isso não prova nada: a causa precisa ser conferida na ata da mesa receptora e nos registros oficiais de urnas. Lista não publicada, por exemplo, é falta do arquivo, não problema na urna.");
      return out;
    },
    ficha: (s, f) => fichaL([`Urna usada: ${({ prev: "a prevista na lista oficial", cont: "a de contingência da lista oficial", outra: "a prevista para outra seção", desc: "uma urna que não está em nenhuma lista" })[s.urna]}`, `Código de carga: ${s.carga || "ausente"} (o previsto é A7F3)`, `Situação: ${({ 1: "apurada", 2: "não apurada", 3: "anulada e apurada em separado", 4: "anulada", 5: "não instalada" })[s.tipo]}${s.junta ? "; votação em cédula" : ""}`]),
    m: [
      ["Urna desconhecida", "Escolha a <b>urna desconhecida (3011999)</b>.", "Uma urna que não aparece em nenhuma lista oficial é sinalizada."],
      ["Urna da seção vizinha", "Escolha a <b>urna prevista para a seção 43</b>.", "Cada urna tem uma seção prevista. Usada em outra, sinaliza."],
      ["Programa diferente", "Mude o <b>código de carga</b> para B2E8.", "O código de carga identifica o programa gravado na urna. Diferente do previsto, sinaliza."],
      ["Contingência com programa errado", "Escolha a <b>urna de contingência</b> e o código <b>B2E8</b>.", "A urna reserva também tem de ter o programa previsto."],
      ["Sem código de carga", "Escolha <b>Sem código</b> no código de carga.", "Sem o código não dá para conferir o programa gravado."],
      ["Urna anulada", "Mude a situação para <b>Anulada</b>.", "Urnas anuladas são sinalizadas para conferência."],
      ["Urna não apurada", "Mude a situação para <b>Não apurada</b>.", "Uma urna que não foi apurada precisa de explicação."],
      ["Urna quebrou", "A urna original quebrou. Escolha a <b>urna de contingência da lista</b> (com a carga A7F3).", "Troca por urna de contingência oficial é procedimento previsto. Fica só como informativo (luz azul)."],
      ["Votação em cédula", "A urna e a reserva falharam e a seção votou em papel. Marque <b>Votação em cédula</b>.", "Votação em cédula tem causas operacionais registradas em ata. É informativa."],
      ["Lista não publicada", "Marque <b>Lista oficial não publicada para a seção</b>.", "Sem a lista oficial, o teste não tem com o que comparar e sinaliza. A causa é a falta do arquivo, não a urna."],
      ["Troca sem defeito", "Escolha a <b>urna de contingência da lista</b>, como se a troca tivesse sido feita sem a urna ter quebrado.", "O teste não sabe se a troca era necessária. Isso só a ata da mesa receptora registra."],
      ["Votos mudados na urna certa", "Mantenha a urna e a carga previstas e passe <b>20 votos</b> de B para A.", "O Teste 12 confere a urna, não os votos."],
    ],
    faq: [
      ["O que é uma urna de contingência?", "É uma urna reserva, preparada com o mesmo programa, que substitui a original quando ela apresenta defeito. As urnas de contingência de cada estado constam de uma lista oficial."],
      ["O que é o código de carga?", "É a identificação do programa gravado na urna antes da eleição. Ele precisa bater com o previsto na lista oficial."],
      ["Votar em cédula é irregular?", "Não. Quando a urna e a reserva falham, a seção pode votar em cédula de papel, apurada por uma junta. É previsto e fica registrado em ata."],
    ],
    prova: [
      ["Trocar uma urna com defeito por uma de contingência da lista oficial, com a carga certa:", "É procedimento previsto e fica como informativo", "É sempre anomalia", "Anula a seção", "Não é registrado", "A troca oficial é prevista."],
      ["O código de carga identifica:", "O programa gravado na urna", "O número de eleitores", "O candidato vencedor", "O horário de abertura", "Ele precisa bater com o previsto."],
      ["Uma urna que não está em nenhuma lista oficial:", "É sinalizada", "É normal", "É informativa", "Fica fora do teste", "Urna não prevista nas correspondências."],
      ["O Teste 12 consegue ver votos alterados dentro da urna certa?", "Não, ele confere a urna, não os votos", "Sim, sempre", "Só no Presidente", "Só em cédula", "Para os votos valem os outros testes."],
      ["Votação em cédula é:", "Registrada como informativa", "Proibida", "Sempre anomalia", "Ignorada", "Tem causas operacionais registradas em ata."],
      ["Se a lista oficial de uma seção não foi publicada:", "O teste sinaliza por falta de comparação", "A urna é anulada", "A seção é excluída da eleição", "Nada acontece", "A causa é a falta do arquivo."],
    ],
    situ: ["A urna usada numa seção não aparece na lista oficial de urnas previstas nem na de contingência.", "O programa gravado na urna de uma seção tem código diferente do previsto."],
  };

  const digKv = (s, r, f) => { const v = r.v; return v.E ? [["Contagens avaliadas", f.n(v.N)], ["χ²", f.n(v.chi2, 1)], ["Chance por acaso", f.chance(v.lp)], ["Depois do ajuste (q)", f.sci(v.lq)]] : [["Contagens ≥ 10", f.n(v.N)], ["Mediana", f.n(v.med, 0)]]; };
  const digSimples = (o) => (s, r, f) => {
    const v = r.v;
    if (r.nivel === "na") return [`O teste não avalia esta cidade: ${v.N < 50 ? `há só ${f.n(v.N)} contagens com 10 votos ou mais (o mínimo é 50)` : `a mediana das contagens é ${f.n(v.med, 0)}, abaixo de 30`}. Com contagens pequenas, ${o.pq}`];
    const ref = s.ref === "modelo" ? "do modelo do site (a forma real dos votos desta cidade, simulada 50 vezes)" : s.ref === "benford" ? "da Lei de Benford" : "de dígitos todos iguais (uniforme)";
    const out = [`O gráfico compara ${o.oque} das ${f.n(v.N)} contagens (barras) com o esperado ${ref} (traços). A distância entre os dois é χ² = ${f.n(v.chi2, 1)}; a chance de uma distância assim por acaso é de ${f.chance(v.lp)}.`];
    if (r.nivel === "anom") {
      out.push(`<b>O teste sinaliza: ${o.oque} foge do esperado.</b>`);
      out.push(s.ref !== "modelo" && !s.inv && !s.arr ? o.semCuidado : o.legit);
    } else out.push(`<b>Dentro do esperado.</b> ${o.limite}`);
    return out;
  };
  const digFicha = (s, f) => fichaL([`Cidade fictícia com ${f.n(s.S)} seções; o Candidato A tem em média ${s.forca}% dos votos`,
    `Seções com números inventados: ${s.inv}% · arredondadas: ${s.arr}%${s.soma ? ` · ${s.soma} votos somados a A em ${s.somaP}% das seções` : ""}${s.transf ? ` · desvio proporcional em ${s.transf}%` : ""}`,
    `Referência: ${s.ref === "modelo" ? "modelo do site" : s.ref === "benford" ? "Lei de Benford" : "uniforme, sem limite de mediana"}`]);

  T.T13 = {
    nome: "Teste do 2º dígito (Mebane)", curto: "Olha o segundo algarismo das contagens de votos de todas as seções de uma cidade ou estado e compara com o esperado para aquela cidade.",
    vis: "Frequência do 2º dígito nas contagens do Candidato A", sem: "Sem referência: o teste não avalia este caso.", obs: "observado", esp: "esperado",
    campos: { S: "Seções na cidade", forca: "Força média do Candidato A (%)", inv: "Seções com números inventados (%)", arr: "Seções arredondadas para dezenas (%)", soma: "Votos somados a A", somaP: "…em quantas seções (%)", transf: "Seções com desvio proporcional de votos (%)", ref: "Referência" },
    op: { ref: { modelo: "Modelo do site (Monte Carlo)", benford: "Lei de Benford (sem o cuidado do site)" } },
    kv: digKv,
    simples: digSimples({ oque: "o 2º dígito", pq: "a forma dos números depende demais do tamanho das seções e não há referência confiável.",
      legit: "Isso não prova nada: desvios podem vir de comportamento estratégico, de concentração geográfica dos votos ou de o modelo não descrever bem a cidade (Mebane, 2006).",
      semCuidado: "Atenção: os números desta cidade não foram alterados. A luz acendeu porque a Lei de Benford não serve para votos por seção, que ficam numa faixa estreita. É por isso que o site usa um modelo próprio para cada cidade.",
      limite: "Alterações em poucas seções ou que mantêm a forma natural dos números não aparecem neste teste." }),
    ficha: digFicha,
    m: [
      ["Números inventados", "Invente os números de <b>40% das seções</b>.", "Quem inventa números tende a escolher valores redondos (como 150 ou 200). Isso deixa o 2º dígito com zeros e cincos demais."],
      ["Arredondar contagens pequenas", "Aqui o Candidato A tem contagens de 2 algarismos. Arredonde <b>35% das seções</b>.", "Em números de 2 algarismos, o 2º dígito é o último. Arredondar para dezenas deixa muitos zeros."],
      ["Cidade grande", "Numa cidade de 1.200 seções, invente os números de <b>20%</b>.", "Com mais seções, o teste fica mais sensível: uma fração menor já aparece."],
      ["Candidato fraco", "Invente os números de <b>25%</b> das seções.", "O teste funciona também para candidatos com poucos votos, desde que a mediana passe de 30."],
      ["Cidade pequena", "Numa cidade de 150 seções, invente os números de <b>70%</b>.", "Com poucas seções o teste tem pouco poder: só alterações grandes aparecem."],
      ["Candidato forte", "Invente os números de <b>40%</b> das seções.", "Com contagens de 3 algarismos, os valores redondos também mexem no 2º dígito."],
      ["Referência errada", "Mude a <b>referência</b> para a Lei de Benford, sem alterar nenhum número.", "Os dados são limpos e mesmo assim a luz acende. A Lei de Benford não serve para votos por seção. Por isso o site usa um modelo feito para cada cidade."],
      ["Benford com candidato forte", "Mude a <b>referência</b> para a Lei de Benford (cidade de 1.200 seções).", "Quanto mais concentradas as contagens, pior a Lei de Benford funciona."],
      ["Benford com candidato médio", "Mude a <b>referência</b> para a Lei de Benford (cidade de 1.200 seções).", "Mais seções dão mais poder ao teste, inclusive para errar com a referência errada."],
      ["Poucos números inventados", "Invente os números de só <b>4%</b> das seções.", "Alterações em poucas seções se perdem no meio de centenas de seções normais."],
      ["Somar votos em todas", "Some <b>20 votos</b> a A em <b>100%</b> das seções.", "O modelo se ajusta aos dados observados. Somar o mesmo valor em todas não deixa marca nos dígitos."],
      ["Desvio proporcional", "Desvie votos de forma proporcional em <b>40%</b> das seções.", "Mudanças proporcionais mantêm a forma natural dos números. O teste de dígitos não vê tudo."],
    ],
    faq: [
      ["Por que o site não usa a Lei de Benford?", "Porque a Lei de Benford vale para números que se espalham por várias ordens de grandeza. Votos por seção ficam numa faixa estreita (por exemplo, 80 a 200), e Benford daria alarmes falsos. O site simula a forma real dos votos de cada cidade."],
      ["O que é o modelo do site?", "É uma simulação de Monte Carlo: 50 réplicas da votação de cada seção, com uma distribuição beta-binomial ajustada aos votos do candidato em cada local de votação (ou zona). A distribuição dos dígitos dessas réplicas é o esperado."],
      ["Por que exigir mediana de 30?", "Com contagens pequenas e muito assimétricas, nem o modelo dá uma referência confiável. O teste fica de fora para não errar."],
    ],
    prova: [
      ["O Teste 13 olha:", "O segundo algarismo das contagens de votos", "O primeiro algarismo", "O número da urna", "O horário", "É o teste 2BL de Mebane."],
      ["Por que o site não usa Benford como referência?", "Votos por seção ficam numa faixa estreita e Benford daria alarmes falsos", "Benford é proibido", "Benford só vale para o Presidente", "Porque Benford é mais sensível", "O site simula a forma real dos votos."],
      ["Inventar números em 4% das seções:", "Normalmente não aparece no teste", "Sempre sinaliza", "Anula a cidade", "Muda a referência", "Poucas alterações se perdem no meio das normais."],
      ["O teste exige pelo menos:", "50 contagens e mediana de 30 votos", "10 contagens", "1.000 seções", "Mediana de 100", "Abaixo disso não há referência confiável."],
      ["Quem inventa números tende a:", "Preferir valores redondos", "Escolher números aleatórios perfeitos", "Usar só números pares", "Repetir o número da seção", "Isso deixa marcas nos dígitos."],
      ["Um desvio no Teste 13 prova manipulação?", "Não: pode vir de comportamento estratégico, concentração geográfica ou desajuste do modelo", "Sim", "Só no 2º turno", "Só para Governador", "É um alerta para investigar."],
    ],
    situ: ["Nas contagens de votos de um candidato num estado, o segundo algarismo é zero muito mais vezes do que o esperado.", "Muitas contagens de votos por seção parecem números redondos escolhidos à mão."],
  };

  T.T14 = {
    nome: "Teste do último dígito (Beber-Scacco)", curto: "Olha o último algarismo das contagens de votos de todas as seções e confere se ele está equilibrado como o esperado para aquela cidade.",
    vis: "Frequência do último dígito nas contagens do Candidato A", sem: "Sem referência: o teste não avalia este caso.", obs: "observado", esp: "esperado",
    campos: { S: "Seções na cidade", forca: "Força média do Candidato A (%)", inv: "Seções com números inventados (%)", arr: "Seções arredondadas (%)", arrPasso: "Arredondar para múltiplos de", soma: "Votos somados a A", somaP: "…em quantas seções (%)", transf: "Seções com desvio proporcional de votos (%)", ref: "Referência" },
    op: { ref: { modelo: "Modelo do site (Monte Carlo)", uniforme: "Uniforme, sem limite de mediana (sem o cuidado do site)" }, arrPasso: { 10: "10", 5: "5" } },
    kv: digKv,
    simples: digSimples({ oque: "o último dígito", pq: "o último algarismo não é equilibrado por pura aritmética.",
      legit: "Isso não prova nada: além de números fabricados (Beber e Scacco, 2012), desvios podem vir de fatores estruturais ou de o modelo não descrever bem a cidade.",
      semCuidado: "Atenção: os números desta cidade não foram alterados. Com contagens pequenas (10 a 20 votos), o último dígito não é equilibrado por pura aritmética. Sem o modelo e sem o limite de mediana, dados limpos acendem a luz.",
      limite: "Alterações em poucas seções ou que mantêm a forma natural dos números não aparecem neste teste." }),
    ficha: digFicha,
    m: [
      ["Finais inventados", "Invente os números de <b>50% das seções</b>.", "Quem inventa números prefere terminar em 0 e 5 (Beber e Scacco). O último dígito deixa de ser equilibrado."],
      ["Arredondar para dezenas", "Arredonde <b>15% das seções</b> para múltiplos de 10.", "Muitos números terminados em 0 aparecem na hora."],
      ["Arredondar para cinco", "Mude “Arredondar para múltiplos de” para <b>5</b> e arredonde <b>25%</b> das seções.", "Finais 0 e 5 em excesso também são detectados."],
      ["Cidade grande", "Numa cidade de 1.200 seções, invente os números de <b>28%</b>.", "Com mais seções, uma fração menor já aparece."],
      ["Cidade pequena", "Numa cidade de 150 seções, invente os números de <b>70%</b>.", "Com poucas seções o teste tem pouco poder."],
      ["Candidato fraco", "Arredonde <b>20%</b> das seções para múltiplos de 10.", "O teste vale também para candidatos com menos votos, se a mediana passar de 30."],
      ["Sem o cuidado do site", "Aqui as contagens são pequenas (10 a 20 votos) e o site deixa o teste de fora. Mude a <b>referência</b> para Uniforme, sem alterar números.", "Com contagens pequenas, o último dígito não é equilibrado por pura aritmética. Sem o modelo e sem o limite de mediana, dados limpos acendem a luz."],
      ["Uniforme na cidade grande", "Mude a <b>referência</b> para Uniforme (cidade de 1.200 seções, contagens pequenas).", "Mais seções tornam o erro de referência ainda mais visível."],
      ["Uniforme com contagens pequenas", "Mude a <b>referência</b> para Uniforme (cidade de 800 seções).", "É por isso que o site exige mediana de 30 votos e usa o modelo."],
      ["Poucos números inventados", "Invente os números de só <b>4%</b> das seções.", "Alterações em poucas seções se perdem."],
      ["Somar votos em todas", "Some <b>20 votos</b> a A em <b>100%</b> das seções.", "Somar o mesmo valor em todas não muda o equilíbrio do último dígito."],
      ["Desvio proporcional", "Desvie votos de forma proporcional em <b>40%</b> das seções.", "Mudanças proporcionais mantêm a forma natural dos números."],
    ],
    faq: [
      ["Por que o último dígito deveria ser equilibrado?", "Em contagens grandes e variadas, cada final de 0 a 9 aparece mais ou menos o mesmo número de vezes. Pessoas que inventam números preferem alguns finais."],
      ["Por que não comparar direto com 10% para cada dígito?", "Porque em contagens concentradas numa faixa estreita (por exemplo, 10 a 20), os finais não são equilibrados por pura aritmética. O site usa o mesmo modelo do Teste 13."],
      ["Quem são Beber e Scacco?", "Pesquisadores que mostraram, em 2012, que números fabricados por pessoas deixam marcas no último dígito."],
    ],
    prova: [
      ["O Teste 14 olha:", "O último algarismo das contagens", "O segundo algarismo", "A soma dos votos", "O código de carga", "É o teste de Beber e Scacco."],
      ["Quem inventa números costuma:", "Preferir finais 0 e 5", "Distribuir os finais perfeitamente", "Usar só o final 7", "Não deixar marcas", "Isso desequilibra o último dígito."],
      ["Com contagens pequenas (10 a 20), comparar com 10% para cada final:", "Dá alarmes falsos", "É o método do site", "É sempre correto", "Não é possível", "Os finais não são equilibrados por aritmética."],
      ["Arredondar contagens para múltiplos de 10:", "Deixa zeros demais e o teste percebe", "Não muda nada", "Muda o segundo dígito apenas", "Anula as seções", "Muitos finais 0 aparecem."],
      ["Somar 20 votos em todas as seções:", "Não muda o equilíbrio do último dígito", "Sinaliza sempre", "Zera os dígitos", "Muda o fuso", "O deslocamento é igual em todas."],
      ["Para o teste avaliar, a mediana das contagens precisa ser de pelo menos:", "30 votos", "10 votos", "100 votos", "1 voto", "Mesma regra do Teste 13."],
    ],
    situ: ["Num estado, as contagens de votos de um candidato terminam em 0 ou 5 muito mais do que o esperado.", "O algarismo final das contagens de votos de muitas seções não está equilibrado."],
  };

  T.T15 = {
    nome: "Impressão digital eleitoral (Klimek)", curto: "Desenha cada seção num gráfico de comparecimento × votação e procura um amontoado anormal no canto de cima à direita.",
    vis: "Cada ponto é uma seção fictícia. O quadrado tracejado é o canto: comparecimento e votação acima de 90%.", eixo_x: "comparecimento", eixo_y: "votação do Candidato A",
    campos: { S: "Seções no estado", forca: "Força média do Candidato A (%)", enc: "Seções com enchimento", alvo: "Nível depois do enchimento (%)", modo: "Onde", mob: "Seções com mobilização legítima" },
    op: { modo: { espalhado: "Espalhadas pelo estado", zona: "Uma zona inteira" } },
    kv(s, r, f) { const v = r.v; return [["Seções no canto", f.n(v.obs)], ["Esperado no canto", f.n(v.esp, 2)], ["Razão", isFinite(v.razao) ? f.n(v.razao, 1) : v.obs ? "∞" : "—"], ["Correlação", f.n(v.corr, 3)]]; },
    simples(s, r, f) {
      const v = r.v;
      const out = [`Há <b>${f.n(v.obs)}</b> seções no canto (comparecimento e votação de A acima de 90%). Se comparecimento e votação não andassem juntos dentro de cada zona, o esperado seria <b>${f.n(v.esp, 1)}</b>.`];
      if (r.nivel === "insp") out.push(`<b>Marcado para inspeção:</b> há 10 ou mais seções no canto e ${isFinite(v.razao) ? f.n(v.razao, 1) : "infinitas"} vezes o esperado (o limite é 3). Um amontoado assim aparece quando urnas são “enchidas” (comparecimento e votação sobem juntos).`,
        s.mob && !s.enc ? "Neste caso a causa é legítima: mobilização de eleitores num reduto do candidato também faz comparecimento e votação subirem juntos. Por isso o Klimek é só um indicador para olhar o gráfico, não uma prova." : "Isso não prova nada: redutos eleitorais e mobilização legítima também fazem comparecimento e votação subirem juntos. O Klimek é um indicador diagnóstico para inspeção visual.");
      else out.push(v.obs < 10 ? "Com menos de 10 seções no canto, o indicador não marca." : "O número de seções no canto não chega a 3 vezes o esperado. O indicador não marca.",
        s.modo === "zona" && s.enc ? "Aqui a zona inteira foi alterada. Como o esperado é calculado dentro de cada zona, a zona alterada vira o próprio padrão. Isso evita falsos alarmes entre regiões diferentes, mas tem esse limite." : "O normal é uma nuvem de pontos sem amontoado no canto.");
      return out;
    },
    ficha: (s, f) => fichaL([`Estado fictício com ${f.n(s.S)} seções; o Candidato A tem em média ${s.forca}%`, `Seções com enchimento: ${s.enc}${s.enc ? ` (comparecimento e votação levados a cerca de ${s.alvo}%, ${s.modo === "zona" ? "numa zona inteira" : "espalhadas pelo estado"})` : ""}`, `Seções com mobilização legítima: ${s.mob}`]),
    m: [
      ["Encher urnas", "Coloque <b>30 seções</b> com enchimento.", "Cada ponto do gráfico é uma seção. Enchimento cria um amontoado no canto de cima à direita, que não aparece em eleições normais."],
      ["Poucas urnas enchidas", "Encha só <b>14 seções</b>.", "A partir de 10 seções no canto, com 3 vezes o esperado ou mais, o estado é marcado para inspeção."],
      ["Estado grande", "Num estado de 3.000 seções, encha <b>25</b>.", "O esperado cresce com o tamanho, mas um amontoado ainda se destaca."],
      ["Enchimento mais leve", "Com nível de 92%, encha <b>25 seções</b>.", "Basta passar de 90% nos dois eixos para entrar no canto."],
      ["Candidato fraco", "Encha <b>20 seções</b>.", "Onde o candidato é fraco, quase nenhuma seção chega ao canto naturalmente. O enchimento aparece ainda mais."],
      ["Enchimento total", "Com nível de 100%, encha <b>12 seções</b>.", "Um enchimento extremo em poucas seções já basta."],
      ["Mobilização legítima", "Uma liderança local levou eleitores a votar em peso no candidato. Coloque <b>25 seções</b> com mobilização legítima.", "Comparecimento alto e votação alta juntos podem ser legítimos. Por isso o Klimek é só um indicador para inspeção."],
      ["Cidade natal do candidato", "Coloque <b>40 seções</b> com mobilização legítima.", "Redutos eleitorais produzem o mesmo desenho de forma legítima."],
      ["Transporte gratuito", "Ônibus gratuitos levaram eleitores de bairros fiéis. Coloque <b>15 seções</b> com mobilização.", "Mais comparecimento onde o candidato é forte é legítimo."],
      ["Menos de 10", "Encha <b>9 seções</b>.", "Com menos de 10 seções no canto, o indicador não marca."],
      ["Abaixo de 90%", "Com nível de 88%, encha <b>40 seções</b>.", "O canto começa em 90%. Enchimento que não chega lá não é contado."],
      ["Uma zona inteira", "Mude “Onde” para <b>Uma zona inteira</b> e ative o enchimento (1 ou mais).", "O esperado é calculado dentro de cada zona. Se a zona inteira muda, ela vira o próprio padrão. Isso evita falsos alarmes, mas tem esse limite."],
    ],
    faq: [
      ["O que é a impressão digital eleitoral?", "É um gráfico em que cada seção é um ponto: comparecimento num eixo e votação do candidato no outro. Klimek e colegas (2012) mostraram que o enchimento de urnas deixa um amontoado no canto de cima à direita."],
      ["Por que o esperado é calculado por zona?", "Porque regiões diferentes têm perfis diferentes. Calcular dentro de cada zona evita confundir a mistura de regiões com um padrão suspeito (paradoxo de Simpson)."],
      ["Marcado para inspeção quer dizer o quê?", "Que vale a pena olhar o gráfico com atenção. É um indicador diagnóstico, sem valor de prova."],
    ],
    prova: [
      ["No gráfico de Klimek, cada ponto é:", "Uma seção", "Um candidato", "Um estado", "Um eleitor", "Comparecimento × votação de cada seção."],
      ["O canto observado pelo teste é:", "Comparecimento e votação acima de 90%", "Comparecimento abaixo de 10%", "Votação de 50%", "Seções com 0 votos", "É o canto de cima à direita."],
      ["Para marcar para inspeção, o teste exige:", "10 ou mais seções no canto e 3 vezes o esperado", "1 seção no canto", "Correlação negativa", "Mais de 1.000 seções", "As duas condições juntas."],
      ["Mobilização legítima num reduto eleitoral:", "Pode produzir o mesmo desenho", "Nunca aparece no gráfico", "Prova manipulação", "Anula as seções", "Por isso é só indicador."],
      ["Se uma zona inteira for alterada:", "Ela vira o próprio padrão e o indicador pode não marcar", "O indicador sempre marca", "O estado é anulado", "O canto muda de lugar", "O esperado é calculado dentro de cada zona."],
      ["O resultado do Teste 15 é:", "Um indicador para inspeção visual", "Uma prova", "Uma anulação automática", "Um voto", "É diagnóstico."],
    ],
    situ: ["No gráfico de comparecimento × votação de um estado, aparece um amontoado de seções com quase 100% nos dois eixos.", "Várias seções têm, ao mesmo tempo, comparecimento e votação de um candidato acima de 95%."],
  };

  S.PT = Object.assign({ ui, faqGeral }, T);
})();
