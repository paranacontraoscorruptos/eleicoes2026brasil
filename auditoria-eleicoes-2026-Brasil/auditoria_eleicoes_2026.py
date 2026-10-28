#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auditoria Estatística dos Boletins de Urna — Eleições Gerais de 2026
=====================================================================

Motor de análise estatística (election forensics) aplicado aos dados públicos
oficiais de Boletins de Urna (BU) divulgados pelo Tribunal Superior Eleitoral.

Autor: Eduardo Santana dos Santos Beira de Lima

Uso:
    python auditoria_eleicoes_2026.py
    python auditoria_eleicoes_2026.py --dados ./dados_tse --saida ./resultados
    python auditoria_eleicoes_2026.py --offline        (não acessa a internet)

Entradas (pasta --dados):
    bweb_<turno>t_<UF>_<data>.zip  (preferencial: permite conferir o hash oficial)
    bweb_<turno>t_<UF>_<data>.csv  (aceito; o hash oficial do TSE refere-se ao .zip)
    CESP_<turno>t_<UF>_<data>.zip  (opcional; baixado automaticamente se houver internet)

Saídas (pasta --saida):
    Relatorio_Tecnico_Auditoria_Eleicoes_2026_PT.md / _EN.md / _ES.md
    dados/*.csv, graficos/*.png, manifesto_saida.sha512, log_execucao.txt
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import platform
import re
import shutil
import sys
import time
import traceback
import urllib.request
import zipfile
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    import duckdb
    import numpy as np
    import pandas as pd
    from scipy import special, stats
except ImportError as exc:  # pragma: no cover
    sys.exit(f"Dependência ausente: {exc.name}. Instale com: pip install -r requirements.txt")

try:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
except ImportError:  # pragma: no cover
    plt = None

VERSAO_MOTOR = "2.1.0"

# =============================================================================
# 1. CONFIGURAÇÃO
# =============================================================================
AUTOR = {
    "nome": "Eduardo Santana dos Santos Beira de Lima",
    "especialidade": {
        "PT": "Especialista em Engenharia de Prompt e Arquitetura Analítica com Inteligência Artificial",
        "EN": "Specialist in Prompt Engineering and AI-Driven Analytical Architecture",
        "ES": "Especialista en Ingeniería de Prompts y Arquitectura Analítica con Inteligencia Artificial",
    },
    "local": {
        "PT": "Centro de Curitiba, Paraná, Brasil",
        "EN": "Downtown Curitiba, Paraná, Brazil",
        "ES": "Centro de Curitiba, Paraná, Brasil",
    },
    "instagram": "@edu.limaoficial",
}

ANO_ELEICAO = 2026
PASTA_DADOS = "./dados_tse"
PASTA_SAIDA = "./resultados"
PREFIXO_RELATORIO = "Relatorio_Tecnico_Auditoria_Eleicoes_2026"

URL_CKAN = "https://dadosabertos.tse.jus.br/api/3/action/package_show?id={pacote}"
URL_HASH_BU = "https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes{ano}/buweb/{arquivo}.sha512"
URL_HASH_CESP = "https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes{ano}/correspesp/{arquivo}.sha512"
PACOTE_CESP = "resultados-{ano}-correspondencias-esperadas-e-efetivadas-{turno}-turno"

# Votos por eleitor em cada cargo. Senado 2026: renovação de 2/3 -> 2 votos por eleitor.
VAGAS_POR_CARGO = {1: 1, 3: 1, 5: 2, 6: 1, 7: 1, 8: 1}
CARGOS_ESTADUAIS = (3, 5, 6, 7, 8)

# Parâmetros estatísticos
ALFA_FDR = 0.01                  # taxa de falsas descobertas (Benjamini–Hochberg)
MIN_SECOES_GRUPO = 20            # mínimo de seções para um grupo de referência
RHO_MIN, RHO_MAX = 1e-6, 0.5     # limites da correlação intraclasse (beta-binomial)
MIN_VOTOS_UNANIMIDADE = 10       # votos válidos mínimos (unanimidade)
MIN_APTOS_ABSTENCAO = 20         # eleitores aptos mínimos (abstenção zero)
MIN_VOTOS_PROPORCAO = 30         # votos mínimos para testes de proporção
LIMIAR_BLOCO = 0.70              # voto cruzado: participação mínima do bloco
LIMIAR_Z_ROBUSTO = 3.5           # escore z modificado (Iglewicz–Hoaglin)
MIN_VOTOS_VOTO_CRUZADO = 50
MIN_SECOES_LOCAL = 3             # contraste de vizinhança
LIMIAR_DIF_VIZINHANCA_PP = 25.0
MIN_VOTOS_IDENTICOS = 50
MIN_CATEGORIAS_IDENTICOS = 3
LIMIAR_ESPERADO_IDENTICOS = 0.01
HORA_INICIO_OFICIAL = 8          # hora de Brasília
HORA_FIM_OFICIAL = 17            # hora de Brasília
TOLERANCIA_MINUTOS = 2
# Fusos possíveis por UF, em horas relativas a Brasília (demais UFs: 0). ZZ: votação em hora local.
FUSOS_UF = {"AC": (-2,), "AM": (-2, -1), "RO": (-1,), "RR": (-1,), "MT": (-1,), "MS": (-1,), "PE": (0, 1), "ZZ": (0,)}
ATRASO_ABERTURA_MIN = 60
MIN_CONTAGENS_DIGITOS = 50
KLIMEK_CANTO = 0.90
KLIMEK_MIN_CANTO = 10
KLIMEK_RAZAO = 3.0
FRACAO_MEMORIA_DUCKDB = 0.45     # fração da RAM destinada ao DuckDB
MIN_MEDIANA_DIGITOS = 30         # mediana mínima das contagens para os testes de dígitos
REPLICAS_DIGITOS = 50            # réplicas de Monte Carlo (testes de dígitos)
SEMENTE_SIMULACAO = 20261004     # semente fixa: resultados reprodutíveis
MIN_SECOES_LOCAL_DIGITOS = 4     # seções mínimas para usar o local de votação como grupo do modelo
DIGITOS_NUCLEO = 6                # algarismos significativos dos números reais no núcleo analítico (determinismo)
PASTA_DETERMINISMO = ".determinismo"  # registro de homologação (baseline) dentro da pasta de saída

UFS_BRASIL = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
              "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO", "ZZ"]

# -----------------------------------------------------------------------------
# Classificação ideológica (premissa analítica do autor) — 30 partidos de 2026
# -----------------------------------------------------------------------------
ESPECTROS = ["Esquerda", "Centro-esquerda", "Centro", "Centro-direita", "Direita"]
ESCORE_ESPECTRO = {"Esquerda": -2, "Centro-esquerda": -1, "Centro": 0, "Centro-direita": 1, "Direita": 2}
BLOCO_ESPECTRO = {"Esquerda": "E", "Centro-esquerda": "E", "Centro": "C", "Centro-direita": "D", "Direita": "D"}

PARTIDOS = {
    10: ("REPUBLICANOS", "Direita"), 11: ("PP", "Direita"), 12: ("PDT", "Centro-esquerda"),
    13: ("PT", "Esquerda"), 14: ("MISSÃO", "Direita"), 15: ("MDB", "Centro"),
    16: ("PSTU", "Esquerda"), 18: ("REDE", "Centro-esquerda"), 20: ("PODE", "Direita"),
    21: ("PCB", "Esquerda"), 22: ("PL", "Direita"), 23: ("CIDADANIA", "Centro"),
    25: ("PRD", "Centro-direita"), 27: ("DC", "Direita"), 28: ("PRTB", "Direita"),
    29: ("PCO", "Esquerda"), 30: ("NOVO", "Direita"), 33: ("MOBILIZA", "Centro-direita"),
    35: ("DEMOCRATA", "Centro-direita"), 36: ("AGIR", "Centro-direita"), 40: ("PSB", "Centro-esquerda"),
    43: ("PV", "Centro"), 44: ("UNIÃO", "Centro-direita"), 45: ("PSDB", "Centro-direita"),
    50: ("PSOL", "Esquerda"), 55: ("PSD", "Centro-direita"), 65: ("PCdoB", "Esquerda"),
    70: ("AVANTE", "Centro-direita"), 77: ("SOLIDARIEDADE", "Centro"), 80: ("UP", "Esquerda"),
}

# Federações registradas no TSE para 2026 (fonte: consulta_cand_2026, campos NR_FEDERACAO e
# DS_COMPOSICAO_FEDERACAO). Regra: todos os partidos federados recebem a classificação do
# partido que encabeça a federação (primeiro partido da composição registrada).
FEDERACOES = {
    100: {"nome": "PSDB/CIDADANIA", "partidos": [45, 23], "cabeca": 45},
    101: {"nome": "PT/PCdoB/PV", "partidos": [13, 65, 43], "cabeca": 13},
    102: {"nome": "PSOL/REDE", "partidos": [50, 18], "cabeca": 50},
    103: {"nome": "PRD/SOLIDARIEDADE", "partidos": [25, 77], "cabeca": 25},
    104: {"nome": "UNIÃO/PP", "partidos": [44, 11], "cabeca": 44},
}


def classificacao_efetiva() -> pd.DataFrame:
    linhas = []
    federacao_de = {p: (nr, f) for nr, f in FEDERACOES.items() for p in f["partidos"]}
    for numero, (sigla, original) in sorted(PARTIDOS.items()):
        efetiva, fed = original, ""
        if numero in federacao_de:
            nr, f = federacao_de[numero]
            efetiva = PARTIDOS[f["cabeca"]][1]
            fed = f"{nr} — {f['nome']}"
        linhas.append({"numero": numero, "sigla": sigla, "original": original, "federacao": fed,
                       "efetiva": efetiva, "bloco": BLOCO_ESPECTRO[efetiva], "escore": ESCORE_ESPECTRO[efetiva]})
    return pd.DataFrame(linhas)


# =============================================================================
# 2. TEXTOS DO RELATÓRIO (PT / EN / ES)
# =============================================================================
IDIOMAS = ("PT", "EN", "ES")

NOMES_CARGOS = {
    1: {"PT": "Presidente", "EN": "President", "ES": "Presidente"},
    3: {"PT": "Governador", "EN": "Governor", "ES": "Gobernador"},
    5: {"PT": "Senador", "EN": "Senator", "ES": "Senador"},
    6: {"PT": "Deputado Federal", "EN": "Federal Deputy", "ES": "Diputado Federal"},
    7: {"PT": "Deputado Estadual", "EN": "State Deputy", "ES": "Diputado Estatal"},
    8: {"PT": "Deputado Distrital", "EN": "District Deputy", "ES": "Diputado Distrital"},
}

NOMES_ESPECTROS = {
    "Esquerda": {"PT": "Esquerda", "EN": "Left", "ES": "Izquierda"},
    "Centro-esquerda": {"PT": "Centro-esquerda", "EN": "Center-left", "ES": "Centroizquierda"},
    "Centro": {"PT": "Centro", "EN": "Center", "ES": "Centro"},
    "Centro-direita": {"PT": "Centro-direita", "EN": "Center-right", "ES": "Centroderecha"},
    "Direita": {"PT": "Direita", "EN": "Right", "ES": "Derecha"},
}

CATEGORIAS = {
    # T01
    "aptos_comp_abst": {"PT": "Aptos ≠ comparecimento + abstenções", "EN": "Eligible ≠ turnout + abstentions", "ES": "Habilitados ≠ comparecencia + abstenciones"},
    "comp_maior_aptos": {"PT": "Comparecimento > aptos", "EN": "Turnout > eligible voters", "ES": "Comparecencia > habilitados"},
    "valores_divergentes": {"PT": "Valores divergentes no mesmo boletim", "EN": "Inconsistent values within the same report", "ES": "Valores divergentes en el mismo boletín"},
    "votavel_duplicado": {"PT": "Votável duplicado", "EN": "Duplicated vote option", "ES": "Opción de voto duplicada"},
    "votos_negativos": {"PT": "Quantidade negativa", "EN": "Negative count", "ES": "Cantidad negativa"},
    "comp_estadual_divergente": {"PT": "Comparecimento divergente entre cargos estaduais", "EN": "Turnout differs across state-level offices", "ES": "Comparecencia divergente entre cargos estatales"},
    "comp_presidente_menor": {"PT": "Comparecimento presidencial < estadual", "EN": "Presidential turnout < state-level turnout", "ES": "Comparecencia presidencial < estatal"},
    "cargo_ausente": {"PT": "Cargo esperado ausente no boletim", "EN": "Expected office missing from report", "ES": "Cargo esperado ausente en el boletín"},
    # T02
    "soma_votos": {"PT": "Σ votos ≠ k × comparecimento", "EN": "Σ votes ≠ k × turnout", "ES": "Σ votos ≠ k × comparecencia"},
    # T03-T10
    "unanimidade": {"PT": "Unanimidade improvável", "EN": "Improbable unanimity", "ES": "Unanimidad improbable"},
    "unanimidade_100": {"PT": "100% para um único candidato", "EN": "100% for a single candidate", "ES": "100% para un único candidato"},
    "abstencao_zero": {"PT": "Comparecimento integral improvável", "EN": "Improbable full turnout", "ES": "Comparecencia total improbable"},
    "brancos_nulos": {"PT": "Excesso de brancos e nulos", "EN": "Excess blank and null votes", "ES": "Exceso de blancos y nulos"},
    "voto_cruzado_pres_df": {"PT": "Presidente × Deputado Federal", "EN": "President × Federal Deputy", "ES": "Presidente × Diputado Federal"},
    "voto_cruzado_gov_de": {"PT": "Governador × Deputado Estadual/Distrital", "EN": "Governor × State/District Deputy", "ES": "Gobernador × Diputado Estatal/Distrital"},
    "legenda": {"PT": "Excesso de votos de legenda", "EN": "Excess party-list votes", "ES": "Exceso de votos de lista"},
    "vizinhanca": {"PT": "Contraste com o mesmo local", "EN": "Contrast with same polling place", "ES": "Contraste con el mismo local"},
    "identicos": {"PT": "Resultado idêntico a outra seção", "EN": "Result identical to another section", "ES": "Resultado idéntico a otra sección"},
    "biometria": {"PT": "Biometria não utilizada acima do padrão", "EN": "Biometric non-use above baseline", "ES": "Biometría no utilizada por encima del patrón"},
    # T11
    "abertura_antecipada": {"PT": "Abertura antes do horário oficial", "EN": "Opening before official time", "ES": "Apertura antes del horario oficial"},
    "encerramento_antecipado": {"PT": "Encerramento antes do horário oficial", "EN": "Closing before official time", "ES": "Cierre antes del horario oficial"},
    "encerramento_antes_abertura": {"PT": "Encerramento anterior à abertura", "EN": "Closing earlier than opening", "ES": "Cierre anterior a la apertura"},
    "emissao_antes_encerramento": {"PT": "Emissão do BU anterior ao encerramento", "EN": "Report issued before closing", "ES": "Emisión del BU anterior al cierre"},
    "recebimento_antes_emissao": {"PT": "Recebimento do BU anterior à emissão", "EN": "Report received before issuance", "ES": "Recepción del BU anterior a la emisión"},
    "data_divergente": {"PT": "Data distinta da data do pleito", "EN": "Date differs from election day", "ES": "Fecha distinta del día de la elección"},
    "horario_ausente": {"PT": "Horário ausente em urna apurada", "EN": "Missing timestamp in tallied machine", "ES": "Horario ausente en urna escrutada"},
    "atraso_abertura": {"PT": "Abertura com atraso (informativo)", "EN": "Delayed opening (informational)", "ES": "Apertura con retraso (informativo)"},
    # T12
    "contingencia_oficial": {"PT": "Urna de contingência oficial (informativo)", "EN": "Official contingency machine (informational)", "ES": "Urna de contingencia oficial (informativo)"},
    "carga_ausente": {"PT": "Código de carga ausente", "EN": "Missing software load code", "ES": "Código de carga ausente"},
    "urna_inconsistente": {"PT": "Atributos da urna divergentes na mesma seção", "EN": "Inconsistent machine attributes within the section", "ES": "Atributos de la urna divergentes en la misma sección"},
    "carga_divergente": {"PT": "Carga divergente da prevista", "EN": "Software load differs from expected", "ES": "Carga distinta de la prevista"},
    "contingencia_carga_divergente": {"PT": "Contingência com carga divergente", "EN": "Contingency machine with mismatched load", "ES": "Contingencia con carga divergente"},
    "urna_nao_prevista": {"PT": "Urna não prevista nas correspondências", "EN": "Machine absent from official correspondences", "ES": "Urna no prevista en las correspondencias"},
    "urna_de_outra_secao": {"PT": "Urna prevista para outra seção", "EN": "Machine assigned to another section", "ES": "Urna prevista para otra sección"},
    "sem_correspondencia": {"PT": "Seção sem correspondência publicada", "EN": "Section without published correspondence", "ES": "Sección sin correspondencia publicada"},
    "urna_ausente": {"PT": "Número de urna ausente", "EN": "Missing machine number", "ES": "Número de urna ausente"},
    "tipo_urna_2": {"PT": "Urna não apurada", "EN": "Machine not tallied", "ES": "Urna no escrutada"},
    "tipo_urna_3": {"PT": "Urna anulada e apurada em separado", "EN": "Machine annulled and tallied separately", "ES": "Urna anulada y escrutada por separado"},
    "tipo_urna_4": {"PT": "Urna anulada", "EN": "Machine annulled", "ES": "Urna anulada"},
    "tipo_urna_5": {"PT": "Urna não instalada", "EN": "Machine not installed", "ES": "Urna no instalada"},
    "junta_apuradora": {"PT": "Apuração por junta (cédula/recuperação) (informativo)", "EN": "Tallied by counting board (paper/recovery) (informational)", "ES": "Escrutinio por junta (papeleta/recuperación) (informativo)"},
    # T13-T15
    "segundo_digito": {"PT": "Desvio do 2º dígito", "EN": "Second-digit deviation", "ES": "Desvío del 2.º dígito"},
    "ultimo_digito": {"PT": "Último dígito não uniforme", "EN": "Non-uniform last digit", "ES": "Último dígito no uniforme"},
    "klimek": {"PT": "Concentração no canto superior", "EN": "Upper-corner concentration", "ES": "Concentración en la esquina superior"},
}

TESTES = {
    "T01": {
        "PT": {"nome": "Fechamento do Boletim",
               "objetivo": "Verificar a consistência aritmética e estrutural interna de cada Boletim de Urna (BU).",
               "metodo": "Para cada par seção–cargo são verificadas as identidades: (i) aptos = comparecimento + abstenções; (ii) comparecimento ≤ aptos; (iii) constância de aptos, comparecimento e abstenções entre todas as linhas do mesmo boletim; (iv) ausência de votável duplicado; (v) ausência de quantidades negativas. Para cada seção: (vi) igualdade do comparecimento entre os cargos de âmbito estadual; (vii) comparecimento presidencial maior ou igual ao estadual (a diferença positiva é explicada por eleitores em trânsito habilitados apenas para Presidente); (viii) presença de todos os cargos esperados no boletim; (ix) constância do número da urna, do código de carga, do horário de abertura e da contagem biométrica em todas as linhas da seção.",
               "criterio": "Teste determinístico. Qualquer violação é sinalizada como anomalia.",
               "limites": "Uma violação indica erro de registro, de extração ou de processamento e deve ser confrontada com o BU impresso e com os arquivos digitais assinados da urna (.bu, .rdv, .logjez)."},
        "EN": {"nome": "Ballot Report Arithmetic Closure",
               "objetivo": "To verify the internal arithmetic and structural consistency of each Ballot Box Report (Boletim de Urna, BU).",
               "metodo": "For each section–office pair the following identities are checked: (i) eligible voters = turnout + abstentions; (ii) turnout ≤ eligible voters; (iii) constancy of eligible voters, turnout and abstentions across all records of the same report; (iv) absence of duplicated vote options; (v) absence of negative counts. For each section: (vi) equal turnout across all state-level offices; (vii) presidential turnout greater than or equal to state-level turnout (a positive difference is explained by in-transit voters entitled to vote for President only); (viii) presence of every expected office in the report; (ix) constancy of the machine number, software load code, opening time and biometric count across all records of the section.",
               "criterio": "Deterministic test. Any violation is flagged as an anomaly.",
               "limites": "A violation indicates a recording, extraction or processing error and must be checked against the printed BU and the signed digital files of the voting machine (.bu, .rdv, .logjez)."},
        "ES": {"nome": "Cierre Aritmético del Boletín de Urna",
               "objetivo": "Verificar la consistencia aritmética y estructural interna de cada Boletín de Urna (BU).",
               "metodo": "Para cada par sección–cargo se verifican las identidades: (i) habilitados = comparecencia + abstenciones; (ii) comparecencia ≤ habilitados; (iii) constancia de habilitados, comparecencia y abstenciones en todos los registros del mismo boletín; (iv) ausencia de opciones de voto duplicadas; (v) ausencia de cantidades negativas. Para cada sección: (vi) igualdad de la comparecencia entre los cargos de ámbito estatal; (vii) comparecencia presidencial mayor o igual que la estatal (la diferencia positiva se explica por electores en tránsito habilitados solo para Presidente); (viii) presencia de todos los cargos esperados en el boletín; (ix) constancia del número de urna, del código de carga, del horario de apertura y del recuento biométrico en todos los registros de la sección.",
               "criterio": "Prueba determinística. Cualquier violación se señala como anomalía.",
               "limites": "Una violación indica un error de registro, extracción o procesamiento y debe contrastarse con el BU impreso y con los archivos digitales firmados de la urna (.bu, .rdv, .logjez)."},
    },
    "T02": {
        "PT": {"nome": "Inconsistência de Totais",
               "objetivo": "Verificar se o total de votos registrados em cada cargo é compatível com o número de eleitores que compareceram.",
               "metodo": "Para cada seção–cargo: Σ votos (nominais, legenda, brancos, nulos e anulados) = k × comparecimento, em que k é o número de votos por eleitor no cargo: k = 2 para Senador em 2026 (renovação de dois terços do Senado Federal) e k = 1 para os demais cargos. A validade empírica de k é confirmada pela razão modal Σ votos / comparecimento observada em cada cargo.",
               "criterio": "Teste determinístico. Qualquer diferença (Δ ≠ 0) é sinalizada como anomalia.",
               "limites": "Diferenças podem decorrer de erro de extração ou de registro; a verificação definitiva exige o BU impresso e o arquivo .bu assinado."},
        "EN": {"nome": "Vote Total Inconsistency",
               "objetivo": "To verify whether the total number of votes recorded for each office is consistent with the number of voters who turned out.",
               "metodo": "For each section–office: Σ votes (candidate, party-list, blank, null and annulled) = k × turnout, where k is the number of votes per voter for the office: k = 2 for Senator in 2026 (renewal of two thirds of the Federal Senate) and k = 1 for all other offices. The empirical validity of k is confirmed by the modal ratio Σ votes / turnout observed for each office.",
               "criterio": "Deterministic test. Any difference (Δ ≠ 0) is flagged as an anomaly.",
               "limites": "Differences may stem from extraction or recording errors; definitive verification requires the printed BU and the signed .bu file."},
        "ES": {"nome": "Inconsistencia de Totales",
               "objetivo": "Verificar si el total de votos registrados en cada cargo es compatible con el número de electores que comparecieron.",
               "metodo": "Para cada sección–cargo: Σ votos (nominales, de lista, en blanco, nulos y anulados) = k × comparecencia, donde k es el número de votos por elector en el cargo: k = 2 para Senador en 2026 (renovación de dos tercios del Senado Federal) y k = 1 para los demás cargos. La validez empírica de k se confirma mediante la razón modal Σ votos / comparecencia observada en cada cargo.",
               "criterio": "Prueba determinística. Cualquier diferencia (Δ ≠ 0) se señala como anomalía.",
               "limites": "Las diferencias pueden deberse a errores de extracción o de registro; la verificación definitiva exige el BU impreso y el archivo .bu firmado."},
    },
    "T03": {
        "PT": {"nome": "Unanimidade na Seção",
               "objetivo": "Identificar seções em que um único candidato recebeu a totalidade dos votos válidos e avaliar a raridade estatística do evento.",
               "metodo": "São elegíveis os pares seção–cargo (Presidente, Governador e Deputados) com ao menos {MIN_VOTOS_UNANIMIDADE} votos válidos. Para cada unanimidade, a probabilidade do evento é calculada sob modelo beta-binomial cujos parâmetros (média e correlação intraclasse) são estimados, pelo método dos momentos, a partir da votação do mesmo candidato em todas as seções do grupo geográfico de referência (Seção 8.2). p = P(X = n). Os p-valores são ajustados pelo procedimento de Benjamini–Hochberg (Seção 8.4).",
               "criterio": "Anomalia (🔴) quando q < {ALFA_FDR}. Todas as demais seções com 100% dos votos válidos para um único candidato são listadas como evento informativo (🟡), com a contagem por candidato.",
               "limites": "Comunidades pequenas e homogêneas (aldeias indígenas, comunidades isoladas, estabelecimentos específicos) podem produzir unanimidade legítima que o grupo de referência não captura."},
        "EN": {"nome": "In-Section Unanimity",
               "objetivo": "To identify sections in which a single candidate received all valid votes and to assess the statistical rarity of the event.",
               "metodo": "Eligible units are section–office pairs (President, Governor and Deputies) with at least {MIN_VOTOS_UNANIMIDADE} valid votes. For each unanimity, the probability of the event is computed under a beta-binomial model whose parameters (mean and intraclass correlation) are estimated by the method of moments from the same candidate's vote in all sections of the geographic reference group (Section 8.2). p = P(X = n). P-values are adjusted with the Benjamini–Hochberg procedure (Section 8.4).",
               "criterio": "Anomaly (🔴) when q < {ALFA_FDR}. All other sections with 100% of the valid votes for a single candidate are listed as informational events (🟡), with the count by candidate.",
               "limites": "Small homogeneous communities (indigenous villages, isolated communities, specific facilities) may produce legitimate unanimity that the reference group does not capture."},
        "ES": {"nome": "Unanimidad en la Sección",
               "objetivo": "Identificar secciones en las que un único candidato recibió la totalidad de los votos válidos y evaluar la rareza estadística del evento.",
               "metodo": "Son elegibles los pares sección–cargo (Presidente, Gobernador y Diputados) con al menos {MIN_VOTOS_UNANIMIDADE} votos válidos. Para cada unanimidad, la probabilidad del evento se calcula bajo un modelo beta-binomial cuyos parámetros (media y correlación intraclase) se estiman, por el método de los momentos, a partir de la votación del mismo candidato en todas las secciones del grupo geográfico de referencia (Sección 8.2). p = P(X = n). Los p-valores se ajustan mediante el procedimiento de Benjamini–Hochberg (Sección 8.4).",
               "criterio": "Anomalía (🔴) cuando q < {ALFA_FDR}. Todas las demás secciones con el 100% de los votos válidos para un único candidato se enumeran como evento informativo (🟡), con el recuento por candidato.",
               "limites": "Comunidades pequeñas y homogéneas (aldeas indígenas, comunidades aisladas, establecimientos específicos) pueden producir unanimidad legítima que el grupo de referencia no captura."},
    },
    "T04": {
        "PT": {"nome": "Abstenção Zero",
               "objetivo": "Identificar seções com comparecimento de 100% dos eleitores aptos e avaliar a raridade estatística do evento.",
               "metodo": "Seções com ao menos {MIN_APTOS_ABSTENCAO} eleitores aptos. O comparecimento é modelado como beta-binomial (x = comparecimento; n = aptos), com parâmetros estimados no grupo de referência; p = P(X = n); ajuste de Benjamini–Hochberg.",
               "criterio": "Sinalização quando q < {ALFA_FDR}. A contagem bruta de seções com comparecimento integral também é reportada.",
               "limites": "Seções pequenas, seções especiais (estabelecimentos prisionais, unidades de internação) e cadastros recentemente revisados podem apresentar comparecimento integral legítimo. Eleitores em trânsito alteram o denominador."},
        "EN": {"nome": "Zero Abstention",
               "objetivo": "To identify sections with 100% turnout of eligible voters and to assess the statistical rarity of the event.",
               "metodo": "Sections with at least {MIN_APTOS_ABSTENCAO} eligible voters. Turnout is modeled as beta-binomial (x = turnout; n = eligible voters), with parameters estimated within the reference group; p = P(X = n); Benjamini–Hochberg adjustment.",
               "criterio": "Flagged when q < {ALFA_FDR}. The raw count of sections with full turnout is also reported.",
               "limites": "Small sections, special sections (prisons, juvenile detention units) and recently revised voter rolls may show legitimate full turnout. In-transit voters alter the denominator."},
        "ES": {"nome": "Abstención Cero",
               "objetivo": "Identificar secciones con comparecencia del 100% de los electores habilitados y evaluar la rareza estadística del evento.",
               "metodo": "Secciones con al menos {MIN_APTOS_ABSTENCAO} electores habilitados. La comparecencia se modela como beta-binomial (x = comparecencia; n = habilitados), con parámetros estimados en el grupo de referencia; p = P(X = n); ajuste de Benjamini–Hochberg.",
               "criterio": "Señalización cuando q < {ALFA_FDR}. También se informa el recuento bruto de secciones con comparecencia total.",
               "limites": "Secciones pequeñas, secciones especiales (establecimientos penitenciarios, unidades de internación) y padrones recientemente revisados pueden presentar comparecencia total legítima. Los electores en tránsito alteran el denominador."},
    },
    "T05": {
        "PT": {"nome": "Excesso de Brancos e Nulos",
               "objetivo": "Identificar boletins com proporção de votos em branco e nulos significativamente superior à do grupo de referência.",
               "metodo": "Para cada seção–cargo com ao menos {MIN_VOTOS_PROPORCAO} votos: x = brancos + nulos; n = total de votos do cargo. p = P(X ≥ x) sob modelo beta-binomial ajustado ao grupo de referência; ajuste de Benjamini–Hochberg. É reportado também o escore z robusto modificado da proporção (mediana e desvio absoluto mediano do grupo).",
               "criterio": "Sinalização quando q < {ALFA_FDR}.",
               "limites": "Campanhas de voto nulo, candidaturas indeferidas e dificuldades de uso da urna por perfis específicos de eleitorado elevam legitimamente a proporção de votos inválidos."},
        "EN": {"nome": "Excess Blank and Null Votes",
               "objetivo": "To identify reports whose share of blank and null votes is significantly higher than that of the reference group.",
               "metodo": "For each section–office with at least {MIN_VOTOS_PROPORCAO} votes: x = blank + null; n = total votes for the office. p = P(X ≥ x) under a beta-binomial model fitted to the reference group; Benjamini–Hochberg adjustment. The modified robust z-score of the share (group median and median absolute deviation) is also reported.",
               "criterio": "Flagged when q < {ALFA_FDR}.",
               "limites": "Null-vote campaigns, rejected candidacies and difficulties in operating the voting machine among specific voter profiles legitimately raise the share of invalid votes."},
        "ES": {"nome": "Exceso de Votos en Blanco y Nulos",
               "objetivo": "Identificar boletines con proporción de votos en blanco y nulos significativamente superior a la del grupo de referencia.",
               "metodo": "Para cada sección–cargo con al menos {MIN_VOTOS_PROPORCAO} votos: x = blancos + nulos; n = total de votos del cargo. p = P(X ≥ x) bajo un modelo beta-binomial ajustado al grupo de referencia; ajuste de Benjamini–Hochberg. También se informa el puntaje z robusto modificado de la proporción (mediana y desviación absoluta mediana del grupo).",
               "criterio": "Señalización cuando q < {ALFA_FDR}.",
               "limites": "Campañas de voto nulo, candidaturas impugnadas y dificultades de uso de la urna en perfiles específicos de electorado elevan legítimamente la proporción de votos inválidos."},
    },
    "T06": {
        "PT": {"nome": "Voto Cruzado Extremo",
               "objetivo": "Identificar seções com divergência ideológica extrema entre o voto para o Executivo e o voto para o Legislativo.",
               "metodo": "Os votos válidos (nominais e de legenda) são atribuídos ao espectro do partido (Seção 12): Esquerda (−2), Centro-esquerda (−1), Centro (0), Centro-direita (+1) e Direita (+2); partidos federados recebem a classificação do partido que encabeça a federação; os votos de Centro integram o denominador. São comparados os pares Presidente × Deputado Federal e Governador × Deputado Estadual/Distrital, em seções com ao menos {MIN_VOTOS_VOTO_CRUZADO} votos válidos em ambos os cargos. Critério A (blocos): participação ≥ {LIMIAR_BLOCO_PCT}% do bloco Esquerda (Esquerda + Centro-esquerda) em um cargo e ≥ {LIMIAR_BLOCO_PCT}% do bloco Direita (Direita + Centro-direita) no outro. Critério B (contexto local): escore z robusto modificado (Iglewicz–Hoaglin) da diferença entre os escores ideológicos médios dos dois cargos, calculado dentro do grupo de referência, com |z| ≥ {LIMIAR_Z_ROBUSTO}.",
               "criterio": "Sinalização quando os critérios A e B são satisfeitos simultaneamente. As contagens do critério A isolado são reportadas.",
               "limites": "O voto dividido é comportamento eleitoral legítimo e frequente no Brasil. A classificação ideológica é premissa analítica do autor e não categoria oficial."},
        "EN": {"nome": "Extreme Split-Ticket Voting",
               "objetivo": "To identify sections showing extreme ideological divergence between the executive and the legislative vote.",
               "metodo": "Valid votes (candidate and party-list) are assigned to the party's spectrum (Section 12): Left (−2), Center-left (−1), Center (0), Center-right (+1) and Right (+2); federated parties take the classification of the party heading the federation; Center votes remain in the denominator. The pairs President × Federal Deputy and Governor × State/District Deputy are compared in sections with at least {MIN_VOTOS_VOTO_CRUZADO} valid votes in both offices. Criterion A (blocs): share ≥ {LIMIAR_BLOCO_PCT}% for the Left bloc (Left + Center-left) in one office and ≥ {LIMIAR_BLOCO_PCT}% for the Right bloc (Right + Center-right) in the other. Criterion B (local context): modified robust z-score (Iglewicz–Hoaglin) of the difference between the two offices' mean ideological scores, computed within the reference group, with |z| ≥ {LIMIAR_Z_ROBUSTO}.",
               "criterio": "Flagged when criteria A and B are met simultaneously. Counts for criterion A alone are reported.",
               "limites": "Split-ticket voting is legitimate and frequent electoral behavior in Brazil. The ideological classification is an analytical assumption of the author, not an official category."},
        "ES": {"nome": "Voto Cruzado Extremo",
               "objetivo": "Identificar secciones con divergencia ideológica extrema entre el voto para el Ejecutivo y el voto para el Legislativo.",
               "metodo": "Los votos válidos (nominales y de lista) se asignan al espectro del partido (Sección 12): Izquierda (−2), Centroizquierda (−1), Centro (0), Centroderecha (+1) y Derecha (+2); los partidos federados reciben la clasificación del partido que encabeza la federación; los votos de Centro integran el denominador. Se comparan los pares Presidente × Diputado Federal y Gobernador × Diputado Estatal/Distrital, en secciones con al menos {MIN_VOTOS_VOTO_CRUZADO} votos válidos en ambos cargos. Criterio A (bloques): participación ≥ {LIMIAR_BLOCO_PCT}% del bloque Izquierda (Izquierda + Centroizquierda) en un cargo y ≥ {LIMIAR_BLOCO_PCT}% del bloque Derecha (Derecha + Centroderecha) en el otro. Criterio B (contexto local): puntaje z robusto modificado (Iglewicz–Hoaglin) de la diferencia entre los puntajes ideológicos medios de los dos cargos, calculado dentro del grupo de referencia, con |z| ≥ {LIMIAR_Z_ROBUSTO}.",
               "criterio": "Señalización cuando los criterios A y B se cumplen simultáneamente. Se informan los recuentos del criterio A aislado.",
               "limites": "El voto dividido es un comportamiento electoral legítimo y frecuente en Brasil. La clasificación ideológica es una premisa analítica del autor y no una categoría oficial."},
    },
    "T07": {
        "PT": {"nome": "Paradoxo de Legenda",
               "objetivo": "Identificar boletins de cargos proporcionais com proporção de votos de legenda significativamente superior à do grupo de referência.",
               "metodo": "Para Deputado Federal, Estadual e Distrital, com ao menos {MIN_VOTOS_PROPORCAO} votos válidos: x = votos de legenda; n = votos válidos. p = P(X ≥ x) sob modelo beta-binomial ajustado ao grupo de referência; ajuste de Benjamini–Hochberg.",
               "criterio": "Sinalização quando q < {ALFA_FDR}.",
               "limites": "Campanhas de voto na legenda e a força de partidos específicos em determinadas localidades elevam legitimamente a proporção de votos de legenda."},
        "EN": {"nome": "Party-List Vote Anomaly",
               "objetivo": "To identify proportional-office reports whose share of party-list votes is significantly higher than that of the reference group.",
               "metodo": "For Federal, State and District Deputy, with at least {MIN_VOTOS_PROPORCAO} valid votes: x = party-list votes; n = valid votes. p = P(X ≥ x) under a beta-binomial model fitted to the reference group; Benjamini–Hochberg adjustment.",
               "criterio": "Flagged when q < {ALFA_FDR}.",
               "limites": "Party-list vote campaigns and the strength of specific parties in certain localities legitimately raise the share of party-list votes."},
        "ES": {"nome": "Paradoja del Voto de Lista",
               "objetivo": "Identificar boletines de cargos proporcionales con proporción de votos de lista significativamente superior a la del grupo de referencia.",
               "metodo": "Para Diputado Federal, Estatal y Distrital, con al menos {MIN_VOTOS_PROPORCAO} votos válidos: x = votos de lista; n = votos válidos. p = P(X ≥ x) bajo un modelo beta-binomial ajustado al grupo de referencia; ajuste de Benjamini–Hochberg.",
               "criterio": "Señalización cuando q < {ALFA_FDR}.",
               "limites": "Campañas de voto de lista y la fuerza de partidos específicos en determinadas localidades elevan legítimamente la proporción de votos de lista."},
    },
    "T08": {
        "PT": {"nome": "Contraste de Vizinhança",
               "objetivo": "Identificar seções cuja votação diverge drasticamente das demais seções do mesmo local de votação.",
               "metodo": "Para Presidente (candidato mais votado no conjunto de dados) e Governador (candidato mais votado na UF), em locais com ao menos {MIN_SECOES_LOCAL} seções e seções com ao menos {MIN_VOTOS_PROPORCAO} votos válidos: a proporção do candidato na seção é comparada à proporção nas demais seções do mesmo local por estatística z de duas proporções, corrigida por fator de sobredispersão φ estimado de forma robusta em cada grupo de referência (φ = mediana(z²)/0,4549, com φ ≥ 1). p bilateral; ajuste de Benjamini–Hochberg.",
               "criterio": "Sinalização quando q < {ALFA_FDR} e a diferença absoluta é ≥ {LIMIAR_DIF_VIZINHANCA_PP} pontos percentuais.",
               "limites": "A distribuição de eleitores em seções segue parcialmente a ordem de alistamento e o endereço, podendo gerar perfis distintos (idade, bairro de origem) dentro do mesmo local."},
        "EN": {"nome": "Neighboring-Section Contrast",
               "objetivo": "To identify sections whose vote diverges drastically from the other sections at the same polling place.",
               "metodo": "For President (top candidate in the dataset) and Governor (top candidate in the state), at polling places with at least {MIN_SECOES_LOCAL} sections and sections with at least {MIN_VOTOS_PROPORCAO} valid votes: the candidate's share in the section is compared with the share in the remaining sections of the same polling place using a two-proportion z statistic, corrected by an overdispersion factor φ robustly estimated within each reference group (φ = median(z²)/0.4549, with φ ≥ 1). Two-sided p; Benjamini–Hochberg adjustment.",
               "criterio": "Flagged when q < {ALFA_FDR} and the absolute difference is ≥ {LIMIAR_DIF_VIZINHANCA_PP} percentage points.",
               "limites": "Voters are assigned to sections partly by registration order and address, which may produce distinct profiles (age, neighborhood of origin) within the same polling place."},
        "ES": {"nome": "Contraste de Vecindad",
               "objetivo": "Identificar secciones cuya votación diverge drásticamente de las demás secciones del mismo local de votación.",
               "metodo": "Para Presidente (candidato más votado en el conjunto de datos) y Gobernador (candidato más votado en la UF), en locales con al menos {MIN_SECOES_LOCAL} secciones y secciones con al menos {MIN_VOTOS_PROPORCAO} votos válidos: la proporción del candidato en la sección se compara con la proporción en las demás secciones del mismo local mediante el estadístico z de dos proporciones, corregido por un factor de sobredispersión φ estimado de forma robusta en cada grupo de referencia (φ = mediana(z²)/0,4549, con φ ≥ 1). p bilateral; ajuste de Benjamini–Hochberg.",
               "criterio": "Señalización cuando q < {ALFA_FDR} y la diferencia absoluta es ≥ {LIMIAR_DIF_VIZINHANCA_PP} puntos porcentuales.",
               "limites": "La distribución de electores en secciones sigue parcialmente el orden de inscripción y el domicilio, lo que puede generar perfiles distintos (edad, barrio de origen) dentro del mismo local."},
    },
    "T09": {
        "PT": {"nome": "Seções com Resultados Idênticos",
               "objetivo": "Identificar seções distintas com vetores de resultado exatamente idênticos.",
               "metodo": "Para cada seção–cargo (Presidente, Governador e Deputados) é calculada uma assinatura (MD5) do vetor completo de resultados (votáveis, brancos e nulos). Consideram-se boletins com ao menos {MIN_VOTOS_IDENTICOS} votos e ao menos {MIN_CATEGORIAS_IDENTICOS} categorias com votos. Assinaturas coincidentes em seções distintas (mesmo cargo; mesma UF para cargos estaduais; todo o conjunto para Presidente) são avaliadas pela probabilidade aproximada de coincidência casual de dois vetores multinomiais (aproximação normal: P ≈ (4πn)^−(K−1)/2 · Π pᵢ^−1/2), multiplicada pelo número de pares de seções com o mesmo total de votos no escopo, o que resulta no número esperado de coincidências casuais E.",
               "criterio": "Sinalização quando E < {LIMIAR_ESPERADO_IDENTICOS}.",
               "limites": "A aproximação fornece ordem de grandeza. Coincidências podem decorrer de duplicação de registros na extração dos dados."},
        "EN": {"nome": "Sections with Identical Results",
               "objetivo": "To identify distinct sections with exactly identical result vectors.",
               "metodo": "For each section–office (President, Governor and Deputies) a signature (MD5) of the full result vector (vote options, blank and null) is computed. Reports with at least {MIN_VOTOS_IDENTICOS} votes and at least {MIN_CATEGORIAS_IDENTICOS} categories with votes are considered. Matching signatures in distinct sections (same office; same state for state-level offices; whole dataset for President) are assessed through the approximate probability of a chance match between two multinomial vectors (normal approximation: P ≈ (4πn)^−(K−1)/2 · Π pᵢ^−1/2), multiplied by the number of section pairs with the same vote total within the scope, yielding the expected number of chance matches E.",
               "criterio": "Flagged when E < {LIMIAR_ESPERADO_IDENTICOS}.",
               "limites": "The approximation provides an order of magnitude. Matches may stem from duplicated records in the data extraction."},
        "ES": {"nome": "Secciones con Resultados Idénticos",
               "objetivo": "Identificar secciones distintas con vectores de resultado exactamente idénticos.",
               "metodo": "Para cada sección–cargo (Presidente, Gobernador y Diputados) se calcula una firma (MD5) del vector completo de resultados (opciones de voto, blancos y nulos). Se consideran boletines con al menos {MIN_VOTOS_IDENTICOS} votos y al menos {MIN_CATEGORIAS_IDENTICOS} categorías con votos. Las firmas coincidentes en secciones distintas (mismo cargo; misma UF para cargos estatales; todo el conjunto para Presidente) se evalúan mediante la probabilidad aproximada de coincidencia casual de dos vectores multinomiales (aproximación normal: P ≈ (4πn)^−(K−1)/2 · Π pᵢ^−1/2), multiplicada por el número de pares de secciones con el mismo total de votos en el ámbito, lo que resulta en el número esperado de coincidencias casuales E.",
               "criterio": "Señalización cuando E < {LIMIAR_ESPERADO_IDENTICOS}.",
               "limites": "La aproximación proporciona un orden de magnitud. Las coincidencias pueden deberse a la duplicación de registros en la extracción de los datos."},
    },
    "T10": {
        "PT": {"nome": "Baixa Validação Biométrica",
               "objetivo": "Identificar seções com proporção atípica de eleitores com biometria cadastrada habilitados sem identificação biométrica.",
               "metodo": "x = QT_ELEI_BIOM_SEM_HABILITACAO (eleitores com biometria cadastrada habilitados por outro meio); n = comparecimento. Seções com ao menos {MIN_VOTOS_PROPORCAO} comparecimentos. p = P(X ≥ x) sob modelo beta-binomial ajustado ao grupo de referência; ajuste de Benjamini–Hochberg.",
               "criterio": "Sinalização quando q < {ALFA_FDR}.",
               "limites": "Falhas de leitura de digitais (idosos, trabalhadores manuais), defeitos no leitor biométrico e diferenças regionais na qualidade do cadastro explicam elevações legítimas. O BU não informa quantos eleitores da seção possuem biometria cadastrada; o denominador utilizado é o comparecimento total."},
        "EN": {"nome": "Low Biometric Validation",
               "objetivo": "To identify sections with an atypical share of biometrically registered voters who were enabled without biometric identification.",
               "metodo": "x = QT_ELEI_BIOM_SEM_HABILITACAO (biometrically registered voters enabled by other means); n = turnout. Sections with at least {MIN_VOTOS_PROPORCAO} voters. p = P(X ≥ x) under a beta-binomial model fitted to the reference group; Benjamini–Hochberg adjustment.",
               "criterio": "Flagged when q < {ALFA_FDR}.",
               "limites": "Fingerprint reading failures (elderly voters, manual workers), biometric reader defects and regional differences in registry quality explain legitimate increases. The BU does not report how many voters in the section have biometric records; the denominator used is total turnout."},
        "ES": {"nome": "Baja Validación Biométrica",
               "objetivo": "Identificar secciones con proporción atípica de electores con biometría registrada habilitados sin identificación biométrica.",
               "metodo": "x = QT_ELEI_BIOM_SEM_HABILITACAO (electores con biometría registrada habilitados por otro medio); n = comparecencia. Secciones con al menos {MIN_VOTOS_PROPORCAO} comparecientes. p = P(X ≥ x) bajo un modelo beta-binomial ajustado al grupo de referencia; ajuste de Benjamini–Hochberg.",
               "criterio": "Señalización cuando q < {ALFA_FDR}.",
               "limites": "Fallas de lectura de huellas (adultos mayores, trabajadores manuales), defectos del lector biométrico y diferencias regionales en la calidad del registro explican aumentos legítimos. El BU no informa cuántos electores de la sección tienen biometría registrada; el denominador utilizado es la comparecencia total."},
    },
    "T11": {
        "PT": {"nome": "Horários Atípicos",
               "objetivo": "Verificar a conformidade cronológica dos eventos registrados no BU.",
               "metodo": "Para urnas eletrônicas apuradas, o fuso horário local de cada município é inferido, entre os fusos possíveis da UF, pelo 10º percentil dos horários de abertura (uma abertura regular nunca precede o horário oficial, e atrasos não deslocam a referência) (abertura, encerramento e emissão do BU são registrados em hora local; o recebimento, em hora de Brasília). Horário oficial: {HORA_INICIO_OFICIAL}h–{HORA_FIM_OFICIAL}h (hora de Brasília), convertido para a hora local; no Exterior, {HORA_INICIO_OFICIAL}h–{HORA_FIM_OFICIAL}h em hora local. Tolerância: {TOLERANCIA_MINUTOS} min. Verificações: abertura anterior ao horário oficial; encerramento anterior ao horário oficial; encerramento anterior à abertura; emissão do BU anterior ao encerramento; recebimento do BU anterior à emissão (exceto Exterior); data de abertura ou encerramento distinta da data do pleito; ausência de horários em urna eletrônica apurada. Atrasos de abertura ≥ {ATRASO_ABERTURA_MIN} min são reportados como eventos informativos.",
               "criterio": "Teste determinístico. Qualquer violação é sinalizada como anomalia; atrasos são informativos.",
               "limites": "Desvios de relógio da urna, substituição de urna durante a votação e municípios com fuso horário distinto da maioria podem gerar sinalizações explicáveis."},
        "EN": {"nome": "Atypical Timestamps",
               "objetivo": "To verify the chronological consistency of the events recorded in the BU.",
               "metodo": "For tallied electronic voting machines, the local time zone of each municipality is inferred, among the time zones possible for the state, from the 10th percentile of opening times (a regular opening never precedes the official time, and delays do not shift the reference) (opening, closing and report issuance are recorded in local time; receipt in Brasília time). Official voting hours: {HORA_INICIO_OFICIAL}:00–{HORA_FIM_OFICIAL}:00 (Brasília time), converted to local time; abroad, {HORA_INICIO_OFICIAL}:00–{HORA_FIM_OFICIAL}:00 local time. Tolerance: {TOLERANCIA_MINUTOS} min. Checks: opening before official time; closing before official time; closing earlier than opening; report issued before closing; report received before issuance (except abroad); opening or closing date different from election day; missing timestamps in a tallied electronic machine. Opening delays ≥ {ATRASO_ABERTURA_MIN} min are reported as informational events.",
               "criterio": "Deterministic test. Any violation is flagged as an anomaly; delays are informational.",
               "limites": "Machine clock drift, replacement of a machine during voting and municipalities whose time zone differs from the majority may produce explainable flags."},
        "ES": {"nome": "Horarios Atípicos",
               "objetivo": "Verificar la conformidad cronológica de los eventos registrados en el BU.",
               "metodo": "Para urnas electrónicas escrutadas, el huso horario local de cada municipio se infiere, entre los husos posibles de la UF, por el percentil 10 de los horarios de apertura (una apertura regular nunca precede el horario oficial y los retrasos no desplazan la referencia) (apertura, cierre y emisión del BU se registran en hora local; la recepción, en hora de Brasilia). Horario oficial: {HORA_INICIO_OFICIAL}h–{HORA_FIM_OFICIAL}h (hora de Brasilia), convertido a la hora local; en el Exterior, {HORA_INICIO_OFICIAL}h–{HORA_FIM_OFICIAL}h en hora local. Tolerancia: {TOLERANCIA_MINUTOS} min. Verificaciones: apertura anterior al horario oficial; cierre anterior al horario oficial; cierre anterior a la apertura; emisión del BU anterior al cierre; recepción del BU anterior a la emisión (excepto Exterior); fecha de apertura o cierre distinta del día de la elección; ausencia de horarios en urna electrónica escrutada. Los retrasos de apertura ≥ {ATRASO_ABERTURA_MIN} min se informan como eventos informativos.",
               "criterio": "Prueba determinística. Cualquier violación se señala como anomalía; los retrasos son informativos.",
               "limites": "Desvíos del reloj de la urna, sustitución de la urna durante la votación y municipios con huso horario distinto de la mayoría pueden generar señalizaciones explicables."},
    },
    "T12": {
        "PT": {"nome": "Troca de Urna e Votação em Cédula",
               "objetivo": "Verificar a correspondência entre a urna efetivamente utilizada em cada seção e a urna prevista na correspondência oficial, e identificar seções com apuração por junta ou urna não apurada, anulada ou não instalada.",
               "metodo": "Quando disponíveis os arquivos oficiais de correspondência esperada (CESP/TSE), a urna efetivada (número e código de carga) é comparada com a urna esperada da seção e com a relação oficial de urnas de contingência da UF. Categorias: urna original (regular); substituição por urna de contingência oficial com carga coincidente (informativo); carga divergente da prevista; código de carga ausente; urna de contingência com carga divergente; urna prevista para outra seção; urna não prevista; seção sem correspondência publicada. Independentemente do CESP: tipo de urna diferente de \"Apurada\" e boletins oriundos de junta apuradora (votação por cédula ou recuperação de dados, informativo).",
               "criterio": "Categorias não regulares e não informativas são sinalizadas como anomalia.",
               "limites": "A substituição por urna de contingência é procedimento operacional previsto. Votações por cédula têm causas operacionais registradas em ata da mesa receptora."},
        "EN": {"nome": "Voting Machine Replacement and Paper-Ballot Voting",
               "objetivo": "To verify the correspondence between the voting machine actually used in each section and the machine assigned in the official correspondence, and to identify sections tallied by counting boards or with machines not tallied, annulled or not installed.",
               "metodo": "When the official expected-correspondence files (CESP/TSE) are available, the effective machine (number and software load code) is compared with the section's expected machine and with the state's official list of contingency machines. Categories: original machine (regular); replacement by an official contingency machine with matching load (informational); load differing from expected; missing load code; contingency machine with mismatched load; machine assigned to another section; machine absent from correspondences; section without published correspondence. Regardless of CESP: machine type other than \"Tallied\" and reports originating from counting boards (paper-ballot voting or data recovery, informational).",
               "criterio": "Non-regular, non-informational categories are flagged as anomalies.",
               "limites": "Replacement by a contingency machine is a standard operational procedure. Paper-ballot voting has operational causes recorded in the polling station minutes."},
        "ES": {"nome": "Sustitución de Urna y Votación con Papeleta",
               "objetivo": "Verificar la correspondencia entre la urna efectivamente utilizada en cada sección y la urna prevista en la correspondencia oficial, e identificar secciones escrutadas por junta o con urna no escrutada, anulada o no instalada.",
               "metodo": "Cuando están disponibles los archivos oficiales de correspondencia esperada (CESP/TSE), la urna efectiva (número y código de carga) se compara con la urna esperada de la sección y con la relación oficial de urnas de contingencia de la UF. Categorías: urna original (regular); sustitución por urna de contingencia oficial con carga coincidente (informativo); carga distinta de la prevista; código de carga ausente; urna de contingencia con carga divergente; urna prevista para otra sección; urna no prevista; sección sin correspondencia publicada. Independientemente del CESP: tipo de urna distinto de \"Escrutada\" y boletines provenientes de junta escrutadora (votación con papeleta o recuperación de datos, informativo).",
               "criterio": "Las categorías no regulares y no informativas se señalan como anomalía.",
               "limites": "La sustitución por urna de contingencia es un procedimiento operacional previsto. Las votaciones con papeleta tienen causas operacionales registradas en el acta de la mesa receptora."},
    },
    "T13": {
        "PT": {"nome": "Teste do 2º Dígito (Mebane)",
               "objetivo": "Avaliar a distribuição do segundo dígito das contagens de votos por seção (teste 2BL de Mebane), com distribuição de referência condicionada à forma real das contagens.",
               "metodo": "Para cada candidato a Presidente e Governador, por UF (e, para Presidente, também no agregado de todas as UFs carregadas), consideram-se as contagens por seção com ao menos dois dígitos (≥ 10 votos), exigindo-se ao menos {MIN_CONTAGENS_DIGITOS} contagens e mediana das contagens de ao menos {MIN_MEDIANA_DIGITOS} votos (séries de contagens pequenas e acentuadamente assimétricas não admitem referência confiável). A distribuição esperada do segundo dígito não é a de Benford, inadequada a contagens concentradas em faixa estreita de valores, mas a distribuição condicional à forma real da votação do candidato, obtida por simulação de Monte Carlo ({REPLICAS_DIGITOS} réplicas; semente fixa {SEMENTE_SIMULACAO}) a partir de modelo beta-binomial ajustado, pelo método dos momentos, à votação do candidato em cada local de votação (ou, em locais com menos de {MIN_SECOES_LOCAL_DIGITOS} seções, no grupo de referência), preservando o número de votos válidos de cada seção. O modelo reproduz a forma da distribuição das contagens e não contém irregularidades na escala dos dígitos. Calculam-se a estatística χ² de aderência (9 graus de liberdade, corrigida pela incerteza de Monte Carlo) e as médias observada e esperada do segundo dígito; a média de Benford para o segundo dígito (4,187; Mebane, 2006) é reportada para comparação com a literatura. Ajuste de Benjamini–Hochberg.",
               "criterio": "Sinalização quando q < {ALFA_FDR}.",
               "limites": "Desvios indicam irregularidade na distribuição fina das contagens e podem decorrer, entre outras causas, de comportamento estratégico ou de concentração geográfica (Mebane, 2006, 2008). O teste pressupõe que o modelo de referência descreve adequadamente a forma da distribuição; desajustes residuais do modelo também podem produzir desvios. O teste do primeiro dígito (1BL) foi excluído por inadequação metodológica a contagens por seção (Deckert, Myagkov e Ordeshook, 2011)."},
        "EN": {"nome": "Second-Digit Test (Mebane 2BL)",
               "objetivo": "To assess the distribution of the second digit of section-level vote counts (Mebane's 2BL test), using a reference distribution conditioned on the actual shape of the counts.",
               "metodo": "For each candidate for President and Governor, by state (and, for President, also aggregated across all loaded states), section-level counts with at least two digits (≥ 10 votes) are considered, requiring at least {MIN_CONTAGENS_DIGITOS} counts and a median count of at least {MIN_MEDIANA_DIGITOS} votes (series of small, strongly skewed counts do not admit a reliable reference). The expected second-digit distribution is not Benford's, which is unsuitable for counts concentrated in a narrow range of values, but the distribution conditional on the actual shape of the candidate's vote, obtained by Monte Carlo simulation ({REPLICAS_DIGITOS} replicates; fixed seed {SEMENTE_SIMULACAO}) from a beta-binomial model fitted by the method of moments to the candidate's vote at each polling place (or, for polling places with fewer than {MIN_SECOES_LOCAL_DIGITOS} sections, within the reference group), preserving each section's number of valid votes. The model reproduces the shape of the count distribution and contains no irregularities at the scale of the digits. The χ² goodness-of-fit statistic (9 degrees of freedom, corrected for Monte Carlo uncertainty) and the observed and expected second-digit means are computed; Benford's second-digit mean (4.187; Mebane, 2006) is reported for comparison with the literature. Benjamini–Hochberg adjustment.",
               "criterio": "Flagged when q < {ALFA_FDR}.",
               "limites": "Deviations indicate irregularity in the fine-grained distribution of counts and may stem, among other causes, from strategic behavior or geographic concentration (Mebane, 2006, 2008). The test assumes that the reference model adequately describes the shape of the distribution; residual model misfit may also produce deviations. The first-digit test (1BL) was excluded as methodologically unsuitable for section-level counts (Deckert, Myagkov and Ordeshook, 2011)."},
        "ES": {"nome": "Prueba del 2.º Dígito (Mebane)",
               "objetivo": "Evaluar la distribución del segundo dígito de los recuentos de votos por sección (prueba 2BL de Mebane), con una distribución de referencia condicionada a la forma real de los recuentos.",
               "metodo": "Para cada candidato a Presidente y Gobernador, por UF (y, para Presidente, también en el agregado de todas las UF cargadas), se consideran los recuentos por sección con al menos dos dígitos (≥ 10 votos), exigiéndose al menos {MIN_CONTAGENS_DIGITOS} recuentos y una mediana de los recuentos de al menos {MIN_MEDIANA_DIGITOS} votos (las series de recuentos pequeños y marcadamente asimétricos no admiten una referencia confiable). La distribución esperada del segundo dígito no es la de Benford, inadecuada para recuentos concentrados en un rango estrecho de valores, sino la distribución condicional a la forma real de la votación del candidato, obtenida mediante simulación de Monte Carlo ({REPLICAS_DIGITOS} réplicas; semilla fija {SEMENTE_SIMULACAO}) a partir de un modelo beta-binomial ajustado, por el método de los momentos, a la votación del candidato en cada local de votación (o, en locales con menos de {MIN_SECOES_LOCAL_DIGITOS} secciones, en el grupo de referencia), preservando el número de votos válidos de cada sección. El modelo reproduce la forma de la distribución de los recuentos y no contiene irregularidades en la escala de los dígitos. Se calculan el estadístico χ² de bondad de ajuste (9 grados de libertad, corregido por la incertidumbre de Monte Carlo) y las medias observada y esperada del segundo dígito; la media de Benford para el segundo dígito (4,187; Mebane, 2006) se informa para comparación con la literatura. Ajuste de Benjamini–Hochberg.",
               "criterio": "Señalización cuando q < {ALFA_FDR}.",
               "limites": "Los desvíos indican irregularidad en la distribución fina de los recuentos y pueden deberse, entre otras causas, a comportamiento estratégico o concentración geográfica (Mebane, 2006, 2008). La prueba supone que el modelo de referencia describe adecuadamente la forma de la distribución; los desajustes residuales del modelo también pueden producir desvíos. La prueba del primer dígito (1BL) fue excluida por inadecuación metodológica a recuentos por sección (Deckert, Myagkov y Ordeshook, 2011)."},
    },
    "T14": {
        "PT": {"nome": "Teste do Último Dígito (Beber-Scacco)",
               "objetivo": "Avaliar a uniformidade do último dígito das contagens de votos por seção.",
               "metodo": "Para cada candidato a Presidente, Governador e Senador, por UF (e, para Presidente, também no agregado de todas as UFs carregadas), consideram-se contagens ≥ 10 votos, exigindo-se ao menos {MIN_CONTAGENS_DIGITOS} contagens e mediana das contagens de ao menos {MIN_MEDIANA_DIGITOS} votos (séries de contagens pequenas e acentuadamente assimétricas não admitem referência confiável). Em contagens concentradas em faixa estreita (por exemplo, entre 10 e 20 votos), o último dígito não é uniforme por razões puramente aritméticas; por isso, a distribuição esperada é obtida pelo mesmo modelo beta-binomial com simulação de Monte Carlo do teste 13, que preserva a forma real da distribuição e isola eventuais irregularidades na casa das unidades. Estatística χ² (9 graus de liberdade, corrigida pela incerteza de Monte Carlo); ajuste de Benjamini–Hochberg.",
               "criterio": "Sinalização quando q < {ALFA_FDR}.",
               "limites": "Conjuntos pequenos de contagens têm baixo poder estatístico. A fabricação humana de números tende a produzir preferências por determinados dígitos finais (Beber e Scacco, 2012); desvios também podem resultar de fatores estruturais ou de desajuste do modelo."},
        "EN": {"nome": "Last-Digit Test (Beber–Scacco)",
               "objetivo": "To assess the uniformity of the last digit of section-level vote counts.",
               "metodo": "For each candidate for President, Governor and Senator, by state (and, for President, also aggregated across all loaded states), counts ≥ 10 votes are considered, requiring at least {MIN_CONTAGENS_DIGITOS} counts and a median count of at least {MIN_MEDIANA_DIGITOS} votes (series of small, strongly skewed counts do not admit a reliable reference). For counts concentrated in a narrow range (e.g., between 10 and 20 votes), the last digit is not uniform for purely arithmetic reasons; therefore the expected distribution is obtained from the same beta-binomial model with Monte Carlo simulation used in test 13, which preserves the actual shape of the distribution and isolates any irregularity in the units place. χ² statistic (9 degrees of freedom, corrected for Monte Carlo uncertainty); Benjamini–Hochberg adjustment.",
               "criterio": "Flagged when q < {ALFA_FDR}.",
               "limites": "Small sets of counts have low statistical power. Human fabrication of numbers tends to produce preferences for certain final digits (Beber and Scacco, 2012); deviations may also result from structural factors or model misfit."},
        "ES": {"nome": "Prueba del Último Dígito (Beber-Scacco)",
               "objetivo": "Evaluar la uniformidad del último dígito de los recuentos de votos por sección.",
               "metodo": "Para cada candidato a Presidente, Gobernador y Senador, por UF (y, para Presidente, también en el agregado de todas las UF cargadas), se consideran recuentos ≥ 10 votos, exigiéndose al menos {MIN_CONTAGENS_DIGITOS} recuentos y una mediana de los recuentos de al menos {MIN_MEDIANA_DIGITOS} votos (las series de recuentos pequeños y marcadamente asimétricos no admiten una referencia confiable). En recuentos concentrados en un rango estrecho (por ejemplo, entre 10 y 20 votos), el último dígito no es uniforme por razones puramente aritméticas; por ello, la distribución esperada se obtiene con el mismo modelo beta-binomial con simulación de Monte Carlo de la prueba 13, que preserva la forma real de la distribución y aísla eventuales irregularidades en la posición de las unidades. Estadístico χ² (9 grados de libertad, corregido por la incertidumbre de Monte Carlo); ajuste de Benjamini–Hochberg.",
               "criterio": "Señalización cuando q < {ALFA_FDR}.",
               "limites": "Los conjuntos pequeños de recuentos tienen baja potencia estadística. La fabricación humana de números tiende a producir preferencias por determinados dígitos finales (Beber y Scacco, 2012); los desvíos también pueden resultar de factores estructurales o de desajuste del modelo."},
    },
    "T15": {
        "PT": {"nome": "Impressão Digital Eleitoral (Klimek)",
               "objetivo": "Examinar a distribuição conjunta do comparecimento e da votação dos dois candidatos presidenciais mais votados.",
               "metodo": "Para cada seção: comparecimento t = comparecimento / aptos; votação s = votos do candidato / votos válidos. São produzidos histogramas bidimensionais (impressão digital eleitoral; Klimek et al., 2012) por candidato, no agregado e por UF, e calculados: correlação de Pearson entre t e s ponderada pelo número de aptos; número de seções no canto superior direito (t ≥ {KLIMEK_CANTO_PCT}% e s ≥ {KLIMEK_CANTO_PCT}%) e razão entre o número observado e o esperado sob independência entre comparecimento e votação dentro de cada grupo de referência (expectativa estratificada, que neutraliza a mistura de regiões com perfis distintos). O agregado nacional exclui o Exterior, cujo padrão de comparecimento é estruturalmente distinto.",
               "criterio": "Indicador diagnóstico. UFs com ao menos {KLIMEK_MIN_CANTO} seções no canto e razão observado/esperado ≥ {KLIMEK_RAZAO} são marcadas para inspeção visual.",
               "limites": "Correlação positiva entre comparecimento e votação ocorre legitimamente em redutos eleitorais; a independência das marginais é uma referência simplificada."},
        "EN": {"nome": "Election Fingerprint (Klimek)",
               "objetivo": "To examine the joint distribution of turnout and of the vote for the two most voted presidential candidates.",
               "metodo": "For each section: turnout t = turnout / eligible voters; vote share s = candidate votes / valid votes. Two-dimensional histograms (election fingerprints; Klimek et al., 2012) are produced per candidate, in aggregate and by state, and the following are computed: Pearson correlation between t and s weighted by eligible voters; number of sections in the upper-right corner (t ≥ {KLIMEK_CANTO_PCT}% and s ≥ {KLIMEK_CANTO_PCT}%) and the ratio between the observed number and the number expected under independence between turnout and vote share within each reference group (stratified expectation, which neutralizes the pooling of regions with different profiles). The national aggregate excludes voters abroad, whose turnout pattern is structurally different.",
               "criterio": "Diagnostic indicator. States with at least {KLIMEK_MIN_CANTO} sections in the corner and an observed/expected ratio ≥ {KLIMEK_RAZAO} are marked for visual inspection.",
               "limites": "A positive correlation between turnout and vote share occurs legitimately in electoral strongholds; independence of the marginals is a simplified benchmark."},
        "ES": {"nome": "Huella Digital Electoral (Klimek)",
               "objetivo": "Examinar la distribución conjunta de la comparecencia y de la votación de los dos candidatos presidenciales más votados.",
               "metodo": "Para cada sección: comparecencia t = comparecencia / habilitados; votación s = votos del candidato / votos válidos. Se producen histogramas bidimensionales (huella digital electoral; Klimek et al., 2012) por candidato, en el agregado y por UF, y se calculan: correlación de Pearson entre t y s ponderada por el número de habilitados; número de secciones en la esquina superior derecha (t ≥ {KLIMEK_CANTO_PCT}% y s ≥ {KLIMEK_CANTO_PCT}%) y razón entre el número observado y el esperado bajo independencia entre comparecencia y votación dentro de cada grupo de referencia (expectativa estratificada, que neutraliza la mezcla de regiones con perfiles distintos). El agregado nacional excluye el Exterior, cuyo patrón de comparecencia es estructuralmente distinto.",
               "criterio": "Indicador diagnóstico. Las UF con al menos {KLIMEK_MIN_CANTO} secciones en la esquina y razón observado/esperado ≥ {KLIMEK_RAZAO} se marcan para inspección visual.",
               "limites": "La correlación positiva entre comparecencia y votación ocurre legítimamente en bastiones electorales; la independencia de las marginales es una referencia simplificada."},
    },
}
ORDEM_TESTES = list(TESTES.keys())
TESTES_AGREGADOS = {"T13", "T14", "T15"}  # unidade de análise não é a seção
# Famílias de testes mecanicamente acoplados (contam uma única vez na convergência)
FAMILIAS_TESTES = {"T01": "aritmetica", "T02": "aritmetica", "T03": "concentracao", "T06": "concentracao", "T08": "concentracao"}


def parametros_texto(lang: str) -> dict:
    dec = (lambda v: str(v).replace(".", ",")) if lang in ("PT", "ES") else str
    return {
        "MIN_VOTOS_UNANIMIDADE": MIN_VOTOS_UNANIMIDADE, "ALFA_FDR": dec(ALFA_FDR),
        "MIN_APTOS_ABSTENCAO": MIN_APTOS_ABSTENCAO, "MIN_VOTOS_PROPORCAO": MIN_VOTOS_PROPORCAO,
        "MIN_VOTOS_VOTO_CRUZADO": MIN_VOTOS_VOTO_CRUZADO, "LIMIAR_BLOCO_PCT": int(LIMIAR_BLOCO * 100),
        "LIMIAR_Z_ROBUSTO": dec(LIMIAR_Z_ROBUSTO), "MIN_SECOES_LOCAL": MIN_SECOES_LOCAL,
        "LIMIAR_DIF_VIZINHANCA_PP": dec(LIMIAR_DIF_VIZINHANCA_PP).rstrip("0").rstrip(",.") ,
        "MIN_VOTOS_IDENTICOS": MIN_VOTOS_IDENTICOS, "MIN_CATEGORIAS_IDENTICOS": MIN_CATEGORIAS_IDENTICOS,
        "LIMIAR_ESPERADO_IDENTICOS": dec(LIMIAR_ESPERADO_IDENTICOS), "HORA_INICIO_OFICIAL": HORA_INICIO_OFICIAL,
        "HORA_FIM_OFICIAL": HORA_FIM_OFICIAL, "TOLERANCIA_MINUTOS": TOLERANCIA_MINUTOS,
        "ATRASO_ABERTURA_MIN": ATRASO_ABERTURA_MIN, "MIN_CONTAGENS_DIGITOS": MIN_CONTAGENS_DIGITOS,
        "KLIMEK_CANTO_PCT": int(KLIMEK_CANTO * 100), "KLIMEK_MIN_CANTO": KLIMEK_MIN_CANTO,
        "KLIMEK_RAZAO": dec(KLIMEK_RAZAO), "REPLICAS_DIGITOS": REPLICAS_DIGITOS,
        "SEMENTE_SIMULACAO": SEMENTE_SIMULACAO, "MIN_MEDIANA_DIGITOS": MIN_MEDIANA_DIGITOS, "MIN_SECOES_LOCAL_DIGITOS": MIN_SECOES_LOCAL_DIGITOS,
    }


def texto_teste(tid: str, lang: str, campo: str) -> str:
    return TESTES[tid][lang][campo].format(**parametros_texto(lang))


# Textos gerais do relatório ---------------------------------------------------
TXT = {
    "PT": {
        "titulo": "Relatório Técnico de Auditoria Estatística dos Boletins de Urna",
        "subtitulo": "Eleições Gerais de {ano} — {turnos}",
        "turno": "{n}º turno",
        "id_doc": "Identificador do documento",
        "data_doc": "Data de emissão",
        "versao": "Versão do motor de análise",
        "s1": "1. Natureza do documento e ressalvas",
        "s1_txt": [
            "Este documento é um relatório técnico de análise estatística exploratória (*election forensics*) aplicada aos dados públicos oficiais de Boletins de Urna (BU) divulgados pelo Tribunal Superior Eleitoral (TSE) no Portal de Dados Abertos.",
            "O relatório **não constitui laudo pericial oficial** (arts. 159 e seguintes do Código de Processo Penal) e **não atribui conduta a qualquer pessoa ou instituição**.",
            "Uma sinalização estatística identifica uma observação improvável sob o modelo de referência explicitado neste documento. **Anomalia estatística não é prova de fraude, erro ou irregularidade.** Toda sinalização deve ser submetida a verificação documental e técnica: BU impresso, arquivos digitais assinados da urna (.bu, .imgbu, .rdv, .logjez), ata da mesa receptora e registros de ocorrência.",
            "Em análises de centenas de milhares de unidades, espera-se, mesmo em um processo eleitoral íntegro, um número não nulo de sinalizações, decorrente da variabilidade natural, de particularidades locais e de premissas simplificadoras dos modelos. A taxa de falsas descobertas é controlada em {alfa} (Seção 8.4) para os testes inferenciais.",
        ],
        "s2": "2. Autoria e responsabilidade técnica",
        "autor": "Autor", "especialidade": "Especialidade", "local": "Local de execução", "instagram": "Instagram",
        "s3": "3. Sumário executivo",
        "s3_intro": "Foram processados {linhas} registros de {arquivos} arquivos oficiais ({ufs} unidades da federação), correspondentes a {secoes} boletins de seção ({distintas} seções eleitorais distintas; {turnos}) e {boletins} boletins seção–cargo. Foram aplicados {ntestes} testes estatísticos e de consistência.",
        "s3_integridade": "Integridade dos arquivos: {ok} de {total} arquivos com hash SHA-512 conferido com o hash oficial publicado pelo TSE; {div} divergente(s); {nv} sem conferência oficial possível.",
        "s3_secoes": "Seções com ao menos uma sinalização de anomalia: {n} ({pct} das seções analisadas). Seções com sinalizações convergentes (dois ou mais testes distintos): {conv}.",
        "s3_tabela": "Resultados consolidados",
        "col_teste": "Teste", "col_unidades": "Unidades analisadas", "col_sinal": "Sinalizações (anomalia)",
        "col_info": "Eventos informativos", "col_taxa": "Taxa", "col_bruto": "Ocorrências brutas", "col_criterio": "Critério",
        "falha": "Falha na execução", "nao_aplicavel": "não aplicável",
        "s4": "4. Escopo, fontes de dados e cobertura",
        "s4_txt": "Fonte primária: Portal de Dados Abertos do TSE, conjunto \"Resultados – {ano} – Boletim de Urna\" (arquivos bweb). Fonte complementar: \"Correspondências esperadas e efetivadas\" (arquivos CESP), utilizada no teste 12. Os dados são públicos e foram processados sem alteração de conteúdo.",
        "s4_cobertura": "Cobertura por UF",
        "col_uf": "UF", "col_arquivo": "Arquivo", "col_linhas": "Registros", "col_secoes": "Seções", "col_turno": "Turno",
        "ufs_ausentes": "UFs ausentes do conjunto analisado: {ufs}. Os resultados referem-se exclusivamente às UFs carregadas.",
        "ufs_completas": "Todas as 27 UFs e o Exterior (ZZ) estão presentes no conjunto analisado.",
        "s5": "5. Integridade dos dados e cadeia de custódia digital",
        "s5_txt": [
            "Para cada arquivo de entrada foi calculado o resumo criptográfico SHA-512 (FIPS 180-4), o mesmo algoritmo utilizado pelo TSE na publicação dos arquivos. Sempre que disponível, o resumo calculado foi comparado ao resumo oficial (arquivo .sha512 publicado pelo TSE ao lado de cada arquivo .zip).",
            "O hash oficial do TSE refere-se ao arquivo compactado (.zip). Arquivos fornecidos já descompactados (.csv) têm o resumo registrado, mas não podem ser conferidos contra o hash oficial.",
            "O **hash do manifesto** é o SHA-512 da lista ordenada \"nome;tamanho;sha512\" de todos os arquivos de entrada e identifica univocamente o conjunto de dados analisado.",
        ],
        "col_tamanho": "Tamanho (bytes)", "col_sha": "SHA-512 (calculado)", "col_status": "Conferência oficial",
        "st_confere": "CONFERE", "st_diverge": "DIVERGE", "st_sem_hash": "hash oficial indisponível", "st_csv": "não verificável (.csv)",
        "hash_manifesto": "Hash do manifesto (SHA-512)",
        "aviso_divergencia": "**ATENÇÃO:** há arquivo(s) cujo hash diverge do oficial publicado pelo TSE. Esses arquivos foram excluídos da análise (Seção 4); obtenha nova cópia no portal do TSE e execute novamente.",
        "excluidos": "**Arquivos excluídos da análise:** {lista}. Arquivos com hash divergente do oficial ou corrompidos não são analisados.",
        "motivo_hash": "hash divergente do oficial", "motivo_zip": "arquivo .zip corrompido",
        "s6": "6. Ambiente computacional e cronologia da execução",
        "inicio": "Início do processamento", "fim": "Conclusão do processamento", "duracao": "Duração total",
        "fuso": "Fuso horário de referência", "so": "Sistema operacional", "python": "Python", "bibliotecas": "Bibliotecas",
        "cpu": "Núcleos de processamento", "volume_zip": "Volume compactado lido", "volume_csv": "Volume descompactado processado",
        "s7": "7. Pré-processamento e controle de qualidade",
        "s7_txt": [
            "Leitura integral dos arquivos CSV (codificação Latin-1, separador \";\") por mecanismo analítico colunar (DuckDB), sem amostragem.",
            "Valores sentinela do TSE (\"#NULO#\", \"#NE\", −1, −3) convertidos em ausência de informação nos campos numéricos e temporais.",
            "Códigos de carga da urna normalizados (remoção de separadores e de zeros à esquerda) para comparação com a correspondência esperada.",
            "Chave da seção: turno, UF, código do município, zona e seção. Chave do boletim: seção e cargo.",
            "Votos válidos: nominais e de legenda (tipos 1 e 4). Inválidos: brancos (tipo 2, votável 95) e nulos (tipo 3, votável 96). Anulados apurados em separado (votável 97) integram o total, mas não os válidos.",
        ],
        "col_cargo": "Cargo", "col_boletins": "Boletins", "col_votos": "Votos", "col_razao": "Razão modal Σvotos/comparecimento",
        "s8": "8. Fundamentos metodológicos",
        "s8_1": "8.1 Unidade de análise",
        "s8_1_txt": "A unidade elementar é o boletim seção–cargo. Testes de comparecimento, biometria, horários e urna utilizam a seção. Os testes de dígitos (13 e 14) e a impressão digital eleitoral (15) operam sobre agregados (candidato × UF).",
        "s8_2": "8.2 Grupos geográficos de referência",
        "s8_2_txt": "Cada seção é comparada às seções de seu grupo de referência, definido hierarquicamente: a zona eleitoral dentro do município (quando reúne ao menos {min} seções); caso contrário, o município; em seguida, o conjunto das seções remanescentes da mesma zona eleitoral; depois, da UF; e, por último, do turno. Essa hierarquia preserva a homogeneidade local, inclusive em grandes cidades divididas em várias zonas, sem sacrificar a estabilidade das estimativas.",
        "s8_3": "8.3 Modelo beta-binomial e sobredispersão",
        "s8_3_txt": "Contagens de votos por seção apresentam variabilidade superior à prevista pelo modelo binomial, em razão da heterogeneidade do eleitorado entre seções. Os testes de proporção utilizam o modelo beta-binomial (Skellam, 1948), com média m e correlação intraclasse ρ estimadas no grupo de referência pelo estimador de momentos ponderado (Ridout, Demétrio e Firth, 1999): m = Σx/Σn; S = Σ nᵢ(yᵢ − m)²/(G − 1); n₀ = (Σn − Σn²/Σn)/(G − 1); ρ = [S/(m(1 − m)) − 1]/(n₀ − 1), restrito a [{rmin}; {rmax}]. Parâmetros: α = m(1/ρ − 1); β = (1 − m)(1/ρ − 1). A própria unidade testada é excluída da estimativa do seu grupo (leave-one-out), de modo que um valor extremo não mascara a si mesmo; grupos com menos de três unidades recebem ρ máximo (conservador).",
        "s8_4": "8.4 Múltiplas comparações",
        "s8_4_txt": "Em cada teste inferencial, os p-valores de todas as unidades elegíveis são ajustados pelo procedimento de Benjamini e Hochberg (1995), que controla a taxa esperada de falsas descobertas (FDR) em {alfa}. Unidades em que o evento testado não ocorre (por exemplo, ausência de unanimidade) ou cuja proporção não excede a média do grupo recebem p = 1; como essas unidades não poderiam ser sinalizadas, isso não altera as sinalizações e torna o ajuste conservador.",
        "s8_5": "8.5 Testes determinísticos",
        "s8_5_txt": "Os testes 1, 2, 11 e 12 verificam identidades aritméticas, cronológicas ou documentais. Não há modelo probabilístico: qualquer violação é sinalizada.",
        "s8_6": "8.6 Parâmetros utilizados",
        "col_parametro": "Parâmetro", "col_valor": "Valor",
        "s9": "9. Resultados por teste",
        "objetivo": "Objetivo", "metodo": "Método", "criterio": "Critério de sinalização", "limites": "Limitações e explicações alternativas",
        "resultado": "Resultado", "sem_sinal": "Nenhuma sinalização.",
        "principais": "Principais sinalizações (até {n}; lista completa em `dados/secoes_sinalizadas.csv`)",
        "por_categoria": "Distribuição por categoria",
        "col_categoria": "Categoria", "col_qtd": "Quantidade",
        "col_mun": "Município", "col_zona": "Zona", "col_secao": "Seção", "col_obs": "Observado", "col_ref": "Referência",
        "col_p": "p", "col_q": "q (BH)", "col_detalhe": "Detalhe", "col_candidato": "Candidato",
        "col_media": "Média obs. 2º dígito", "col_media_modelo": "Média esperada (modelo)", "col_media_benford": "Média Benford 2BL",
        "tabela_digitos": "Resultados por candidato e UF (até {n}, ordenados por q; tabela completa em `dados/`)", "br_sem_zz": "Brasil (sem Exterior)", "col_chi2": "χ²", "col_n": "Contagens", "col_corr": "Correlação (t, s)",
        "col_canto_obs": "Canto obs.", "col_canto_esp": "Canto esp.", "col_razao_oe": "Obs./esp.", "col_marca": "Inspeção",
        "unidades_txt": "Unidades analisadas: {u}. Sinalizações: {s}. Eventos informativos: {i}.",
        "bruto_txt": "Ocorrências brutas (antes do critério estatístico): {b}.",
        "k_senador": "Validação empírica de k (votos por eleitor)",
        "cruzado_a": "Seções que atendem apenas ao critério A (blocos): {a}. Atendem a A e B: {ab}.",
        "klimek_graficos": "Gráficos",
        "s10": "10. Seções com sinalizações convergentes",
        "s10_txt": "Seções sinalizadas por duas ou mais famílias de testes, excluídos eventos informativos e testes agregados. Testes mecanicamente acoplados contam como uma única evidência: Fechamento do Boletim e Inconsistência de Totais (família aritmética); Unanimidade na Seção, Voto Cruzado Extremo e Contraste de Vizinhança (família de concentração de votos). A convergência de sinalizações de famílias distintas aumenta a prioridade de verificação documental.",
        "col_testes": "Testes", "col_ntestes": "Famílias de testes",
        "s11": "11. Distribuição das sinalizações por UF",
        "col_secoes_sinal": "Seções sinalizadas", "col_pct": "% das seções",
        "s12": "12. Classificação partidária e federações",
        "s12_txt": "A classificação ideológica é premissa analítica do autor, utilizada exclusivamente no teste 6. Partidos integrantes de federação registrada no TSE para {ano} recebem a classificação do partido que encabeça a federação.",
        "col_numero": "Nº", "col_sigla": "Partido", "col_original": "Classificação original", "col_federacao": "Federação", "col_efetiva": "Classificação aplicada",
        "s13": "13. Limitações gerais",
        "s13_txt": [
            "Os dados analisados são os publicados pelo TSE; a análise não examina os arquivos assinados individuais das urnas (.bu, .rdv, .logjez), cuja verificação criptográfica é recomendada como etapa subsequente para as seções sinalizadas.",
            "Os modelos estatísticos são aproximações da realidade. A sinalização expressa improbabilidade sob o modelo, não a causa do desvio.",
            "Os testes não são independentes entre si; sinalizações convergentes podem compartilhar a mesma causa legítima.",
            "A classificação ideológica (teste 6) e os limiares adotados são premissas explícitas e podem ser alterados no código-fonte, que acompanha este relatório para reprodução integral.",
            "O teste do primeiro dígito de Benford (1BL) e comparações com eleições anteriores não integram o escopo.",
        ],
        "s14": "14. Reprodutibilidade e arquivos produzidos",
        "s14_txt": "A análise é integralmente reprodutível: com os mesmos arquivos de entrada (hash do manifesto idêntico) e o mesmo código-fonte, os resultados são idênticos. Os arquivos produzidos, com os respectivos hashes SHA-512, são listados abaixo; o arquivo `manifesto_saida.sha512` registra os hashes de todos os arquivos, inclusive deste relatório.",
        "comando": "Comando de execução",
        "s15": "15. Referências",
        "rodape": "Documento gerado automaticamente pelo motor de auditoria estatística v{v}. Anomalia estatística não é prova de fraude.",
        "ignorados": "Arquivos ignorados por serem versões duplicadas ou mais antigas do mesmo turno/UF (mantida apenas a versão mais recente): {lista}.",
        "ram": "Memória física", "limite_duckdb": "Limite de memória do DuckDB",
        "cesp_cobertura": "Correspondência urna esperada × efetivada verificada em {secoes} seções ({regulares} com urna e carga regulares). Turno/UF sem arquivo CESP (não verificados): {sem}.",
        "digitos_excluidas": "Séries candidato × UF excluídas por mediana das contagens inferior a {m} votos: {n}.",
        "nenhum": "nenhum", "col_sinalizado": "Sinalizado",
        "sim": "sim", "nao": "não", "todas_ufs": "Todas as UFs", "sem_cesp": "Arquivos CESP indisponíveis: a correspondência urna esperada × efetivada não foi verificada; apenas tipo de urna e junta apuradora foram avaliados.",
    },
    "EN": {
        "titulo": "Technical Report on the Statistical Audit of Ballot Box Reports",
        "subtitulo": "Brazilian General Elections {ano} — {turnos}",
        "turno": "round {n}",
        "id_doc": "Document identifier",
        "data_doc": "Issue date",
        "versao": "Analysis engine version",
        "s1": "1. Nature of the document and disclaimers",
        "s1_txt": [
            "This document is a technical report of exploratory statistical analysis (*election forensics*) applied to the official public Ballot Box Report (Boletim de Urna, BU) data released by Brazil's Superior Electoral Court (Tribunal Superior Eleitoral, TSE) on its Open Data Portal.",
            "This report **is not an official forensic expert report** (Articles 159 et seq. of the Brazilian Code of Criminal Procedure) and **does not attribute any conduct to any person or institution**.",
            "A statistical flag identifies an observation that is improbable under the reference model stated in this document. **A statistical anomaly is not proof of fraud, error or irregularity.** Every flag must undergo documentary and technical verification: the printed BU, the signed digital files of the voting machine (.bu, .imgbu, .rdv, .logjez), polling station minutes and incident records.",
            "In analyses covering hundreds of thousands of units, a non-zero number of flags is expected even in a sound electoral process, owing to natural variability, local particularities and simplifying model assumptions. The false discovery rate is controlled at {alfa} (Section 8.4) for the inferential tests.",
        ],
        "s2": "2. Authorship and technical responsibility",
        "autor": "Author", "especialidade": "Field of expertise", "local": "Place of execution", "instagram": "Instagram",
        "s3": "3. Executive summary",
        "s3_intro": "A total of {linhas} records from {arquivos} official files ({ufs} federative units) were processed, corresponding to {secoes} section reports ({distintas} distinct polling sections; {turnos}) and {boletins} section–office reports. {ntestes} statistical and consistency tests were applied.",
        "s3_integridade": "File integrity: {ok} of {total} files with SHA-512 hash matching the official hash published by the TSE; {div} mismatching; {nv} without possible official verification.",
        "s3_secoes": "Sections with at least one anomaly flag: {n} ({pct} of the sections analyzed). Sections with convergent flags (two or more distinct tests): {conv}.",
        "s3_tabela": "Consolidated results",
        "col_teste": "Test", "col_unidades": "Units analyzed", "col_sinal": "Flags (anomaly)",
        "col_info": "Informational events", "col_taxa": "Rate", "col_bruto": "Raw occurrences", "col_criterio": "Criterion",
        "falha": "Execution failure", "nao_aplicavel": "not applicable",
        "s4": "4. Scope, data sources and coverage",
        "s4_txt": "Primary source: TSE Open Data Portal, dataset \"Resultados – {ano} – Boletim de Urna\" (bweb files). Supplementary source: \"Correspondências esperadas e efetivadas\" (CESP files), used in test 12. The data are public and were processed without any alteration of content.",
        "s4_cobertura": "Coverage by state",
        "col_uf": "State", "col_arquivo": "File", "col_linhas": "Records", "col_secoes": "Sections", "col_turno": "Round",
        "ufs_ausentes": "States missing from the analyzed dataset: {ufs}. Results refer exclusively to the loaded states.",
        "ufs_completas": "All 27 federative units and voters abroad (ZZ) are present in the analyzed dataset.",
        "s5": "5. Data integrity and digital chain of custody",
        "s5_txt": [
            "For each input file, the SHA-512 cryptographic digest (FIPS 180-4) was computed — the same algorithm used by the TSE when publishing the files. Whenever available, the computed digest was compared with the official digest (.sha512 file published by the TSE next to each .zip file).",
            "The TSE's official hash refers to the compressed file (.zip). Files supplied already decompressed (.csv) have their digest recorded but cannot be checked against the official hash.",
            "The **manifest hash** is the SHA-512 of the sorted list \"name;size;sha512\" of all input files and uniquely identifies the analyzed dataset.",
        ],
        "col_tamanho": "Size (bytes)", "col_sha": "SHA-512 (computed)", "col_status": "Official check",
        "st_confere": "MATCH", "st_diverge": "MISMATCH", "st_sem_hash": "official hash unavailable", "st_csv": "not verifiable (.csv)",
        "hash_manifesto": "Manifest hash (SHA-512)",
        "aviso_divergencia": "**WARNING:** one or more files have a hash that does not match the official hash published by the TSE. Those files were excluded from the analysis (Section 4); obtain a new copy from the TSE portal and run again.",
        "excluidos": "**Files excluded from the analysis:** {lista}. Files whose hash does not match the official one, or that are corrupted, are not analyzed.",
        "motivo_hash": "hash does not match the official one", "motivo_zip": "corrupted .zip file",
        "s6": "6. Computing environment and execution timeline",
        "inicio": "Processing start", "fim": "Processing end", "duracao": "Total duration",
        "fuso": "Reference time zone", "so": "Operating system", "python": "Python", "bibliotecas": "Libraries",
        "cpu": "Processor cores", "volume_zip": "Compressed volume read", "volume_csv": "Decompressed volume processed",
        "s7": "7. Pre-processing and quality control",
        "s7_txt": [
            "Full reading of the CSV files (Latin-1 encoding, \";\" separator) by a columnar analytical engine (DuckDB), without sampling.",
            "TSE sentinel values (\"#NULO#\", \"#NE\", −1, −3) converted to missing information in numeric and time fields.",
            "Voting-machine load codes normalized (removal of separators and leading zeros) for comparison with the expected correspondence.",
            "Section key: round, state, municipality code, electoral zone and section. Report key: section and office.",
            "Valid votes: candidate and party-list votes (types 1 and 4). Invalid: blank (type 2, option 95) and null (type 3, option 96). Annulled votes tallied separately (option 97) are included in the total but not among valid votes.",
        ],
        "col_cargo": "Office", "col_boletins": "Reports", "col_votos": "Votes", "col_razao": "Modal ratio Σvotes/turnout",
        "s8": "8. Methodological foundations",
        "s8_1": "8.1 Unit of analysis",
        "s8_1_txt": "The elementary unit is the section–office report. Turnout, biometric, timestamp and machine tests use the section. The digit tests (13 and 14) and the election fingerprint (15) operate on aggregates (candidate × state).",
        "s8_2": "8.2 Geographic reference groups",
        "s8_2_txt": "Each section is compared with the sections of its reference group, defined hierarchically: the electoral zone within the municipality (when it comprises at least {min} sections); otherwise, the municipality; then the remaining sections of the same electoral zone; then of the state; and finally of the round. This hierarchy preserves local homogeneity, including in large cities divided into several zones, without sacrificing the stability of the estimates.",
        "s8_3": "8.3 Beta-binomial model and overdispersion",
        "s8_3_txt": "Section-level vote counts show greater variability than predicted by the binomial model, owing to heterogeneity of the electorate across sections. Proportion tests use the beta-binomial model (Skellam, 1948), with mean m and intraclass correlation ρ estimated within the reference group by the weighted moment estimator (Ridout, Demétrio and Firth, 1999): m = Σx/Σn; S = Σ nᵢ(yᵢ − m)²/(G − 1); n₀ = (Σn − Σn²/Σn)/(G − 1); ρ = [S/(m(1 − m)) − 1]/(n₀ − 1), restricted to [{rmin}; {rmax}]. Parameters: α = m(1/ρ − 1); β = (1 − m)(1/ρ − 1). The unit under test is excluded from its group's estimate (leave-one-out), so that an extreme value does not mask itself; groups with fewer than three units receive the maximum ρ (conservative).",
        "s8_4": "8.4 Multiple comparisons",
        "s8_4_txt": "In each inferential test, the p-values of all eligible units are adjusted with the Benjamini and Hochberg (1995) procedure, which controls the expected false discovery rate (FDR) at {alfa}. Units in which the tested event does not occur (e.g., no unanimity) or whose share does not exceed the group mean receive p = 1; since such units could not be flagged, this does not change the flags and makes the adjustment conservative.",
        "s8_5": "8.5 Deterministic tests",
        "s8_5_txt": "Tests 1, 2, 11 and 12 verify arithmetic, chronological or documentary identities. There is no probabilistic model: any violation is flagged.",
        "s8_6": "8.6 Parameters used",
        "col_parametro": "Parameter", "col_valor": "Value",
        "s9": "9. Results by test",
        "objetivo": "Objective", "metodo": "Method", "criterio": "Flagging criterion", "limites": "Limitations and alternative explanations",
        "resultado": "Result", "sem_sinal": "No flags.",
        "principais": "Main flags (up to {n}; full list in `dados/secoes_sinalizadas.csv`)",
        "por_categoria": "Breakdown by category",
        "col_categoria": "Category", "col_qtd": "Count",
        "col_mun": "Municipality", "col_zona": "Zone", "col_secao": "Section", "col_obs": "Observed", "col_ref": "Reference",
        "col_p": "p", "col_q": "q (BH)", "col_detalhe": "Detail", "col_candidato": "Candidate",
        "col_media": "Obs. mean 2nd digit", "col_media_modelo": "Expected mean (model)", "col_media_benford": "Benford 2BL mean",
        "tabela_digitos": "Results by candidate and state (up to {n}, sorted by q; full table in `dados/`)", "br_sem_zz": "Brazil (excluding abroad)", "col_chi2": "χ²", "col_n": "Counts", "col_corr": "Correlation (t, s)",
        "col_canto_obs": "Corner obs.", "col_canto_esp": "Corner exp.", "col_razao_oe": "Obs./exp.", "col_marca": "Inspect",
        "unidades_txt": "Units analyzed: {u}. Flags: {s}. Informational events: {i}.",
        "bruto_txt": "Raw occurrences (before the statistical criterion): {b}.",
        "k_senador": "Empirical validation of k (votes per voter)",
        "cruzado_a": "Sections meeting criterion A only (blocs): {a}. Meeting A and B: {ab}.",
        "klimek_graficos": "Charts",
        "s10": "10. Sections with convergent flags",
        "s10_txt": "Sections flagged by two or more test families, excluding informational events and aggregate tests. Mechanically coupled tests count as a single piece of evidence: Ballot Report Arithmetic Closure and Vote Total Inconsistency (arithmetic family); In-Section Unanimity, Extreme Split-Ticket Voting and Neighboring-Section Contrast (vote-concentration family). Convergent flags from distinct families increase the priority for documentary verification.",
        "col_testes": "Tests", "col_ntestes": "Test families",
        "s11": "11. Distribution of flags by state",
        "col_secoes_sinal": "Flagged sections", "col_pct": "% of sections",
        "s12": "12. Party classification and federations",
        "s12_txt": "The ideological classification is an analytical assumption of the author, used exclusively in test 6. Parties belonging to a federation registered with the TSE for {ano} take the classification of the party heading the federation.",
        "col_numero": "No.", "col_sigla": "Party", "col_original": "Original classification", "col_federacao": "Federation", "col_efetiva": "Applied classification",
        "s13": "13. General limitations",
        "s13_txt": [
            "The data analyzed are those published by the TSE; the analysis does not examine the individual signed voting-machine files (.bu, .rdv, .logjez), whose cryptographic verification is recommended as a subsequent step for flagged sections.",
            "Statistical models are approximations of reality. A flag expresses improbability under the model, not the cause of the deviation.",
            "The tests are not mutually independent; convergent flags may share the same legitimate cause.",
            "The ideological classification (test 6) and the thresholds adopted are explicit assumptions and can be changed in the source code, which accompanies this report for full reproduction.",
            "Benford's first-digit test (1BL) and comparisons with previous elections are outside the scope.",
        ],
        "s14": "14. Reproducibility and output files",
        "s14_txt": "The analysis is fully reproducible: with the same input files (identical manifest hash) and the same source code, the results are identical. The output files and their SHA-512 hashes are listed below; the file `manifesto_saida.sha512` records the hashes of all files, including this report.",
        "comando": "Execution command",
        "s15": "15. References",
        "rodape": "Document automatically generated by the statistical audit engine v{v}. A statistical anomaly is not proof of fraud.",
        "ignorados": "Files ignored as duplicate or older versions of the same round/state (only the most recent version was kept): {lista}.",
        "ram": "Physical memory", "limite_duckdb": "DuckDB memory limit",
        "cesp_cobertura": "Expected × effective machine correspondence verified in {secoes} sections ({regulares} with regular machine and load). Round/state pairs without a CESP file (not verified): {sem}.",
        "digitos_excluidas": "Candidate × state series excluded because the median count is below {m} votes: {n}.",
        "nenhum": "none", "col_sinalizado": "Flagged",
        "sim": "yes", "nao": "no", "todas_ufs": "All states", "sem_cesp": "CESP files unavailable: the expected × effective machine correspondence was not verified; only machine type and counting-board tallying were assessed.",
    },
    "ES": {
        "titulo": "Informe Técnico de Auditoría Estadística de los Boletines de Urna",
        "subtitulo": "Elecciones Generales de Brasil {ano} — {turnos}",
        "turno": "{n}.ª vuelta",
        "id_doc": "Identificador del documento",
        "data_doc": "Fecha de emisión",
        "versao": "Versión del motor de análisis",
        "s1": "1. Naturaleza del documento y salvedades",
        "s1_txt": [
            "Este documento es un informe técnico de análisis estadístico exploratorio (*election forensics*) aplicado a los datos públicos oficiales de Boletines de Urna (BU) divulgados por el Tribunal Superior Electoral de Brasil (TSE) en su Portal de Datos Abiertos.",
            "El informe **no constituye un dictamen pericial oficial** (arts. 159 y siguientes del Código de Proceso Penal brasileño) y **no atribuye conducta alguna a ninguna persona o institución**.",
            "Una señalización estadística identifica una observación improbable bajo el modelo de referencia explicitado en este documento. **Una anomalía estadística no es prueba de fraude, error o irregularidad.** Toda señalización debe someterse a verificación documental y técnica: BU impreso, archivos digitales firmados de la urna (.bu, .imgbu, .rdv, .logjez), acta de la mesa receptora y registros de incidencias.",
            "En análisis de cientos de miles de unidades se espera, incluso en un proceso electoral íntegro, un número no nulo de señalizaciones, derivado de la variabilidad natural, de particularidades locales y de supuestos simplificadores de los modelos. La tasa de falsos descubrimientos se controla en {alfa} (Sección 8.4) para las pruebas inferenciales.",
        ],
        "s2": "2. Autoría y responsabilidad técnica",
        "autor": "Autor", "especialidade": "Especialidad", "local": "Lugar de ejecución", "instagram": "Instagram",
        "s3": "3. Resumen ejecutivo",
        "s3_intro": "Se procesaron {linhas} registros de {arquivos} archivos oficiales ({ufs} unidades federativas), correspondientes a {secoes} boletines de sección ({distintas} secciones electorales distintas; {turnos}) y {boletins} boletines sección–cargo. Se aplicaron {ntestes} pruebas estadísticas y de consistencia.",
        "s3_integridade": "Integridad de los archivos: {ok} de {total} archivos con hash SHA-512 coincidente con el hash oficial publicado por el TSE; {div} divergente(s); {nv} sin verificación oficial posible.",
        "s3_secoes": "Secciones con al menos una señalización de anomalía: {n} ({pct} de las secciones analizadas). Secciones con señalizaciones convergentes (dos o más pruebas distintas): {conv}.",
        "s3_tabela": "Resultados consolidados",
        "col_teste": "Prueba", "col_unidades": "Unidades analizadas", "col_sinal": "Señalizaciones (anomalía)",
        "col_info": "Eventos informativos", "col_taxa": "Tasa", "col_bruto": "Ocurrencias brutas", "col_criterio": "Criterio",
        "falha": "Falla en la ejecución", "nao_aplicavel": "no aplicable",
        "s4": "4. Alcance, fuentes de datos y cobertura",
        "s4_txt": "Fuente primaria: Portal de Datos Abiertos del TSE, conjunto \"Resultados – {ano} – Boletim de Urna\" (archivos bweb). Fuente complementaria: \"Correspondências esperadas e efetivadas\" (archivos CESP), utilizada en la prueba 12. Los datos son públicos y se procesaron sin alteración de contenido.",
        "s4_cobertura": "Cobertura por UF",
        "col_uf": "UF", "col_arquivo": "Archivo", "col_linhas": "Registros", "col_secoes": "Secciones", "col_turno": "Vuelta",
        "ufs_ausentes": "UF ausentes del conjunto analizado: {ufs}. Los resultados se refieren exclusivamente a las UF cargadas.",
        "ufs_completas": "Las 27 UF y el Exterior (ZZ) están presentes en el conjunto analizado.",
        "s5": "5. Integridad de los datos y cadena de custodia digital",
        "s5_txt": [
            "Para cada archivo de entrada se calculó el resumen criptográfico SHA-512 (FIPS 180-4), el mismo algoritmo utilizado por el TSE en la publicación de los archivos. Siempre que estuvo disponible, el resumen calculado se comparó con el resumen oficial (archivo .sha512 publicado por el TSE junto a cada archivo .zip).",
            "El hash oficial del TSE se refiere al archivo comprimido (.zip). Los archivos entregados ya descomprimidos (.csv) tienen su resumen registrado, pero no pueden contrastarse con el hash oficial.",
            "El **hash del manifiesto** es el SHA-512 de la lista ordenada \"nombre;tamaño;sha512\" de todos los archivos de entrada e identifica unívocamente el conjunto de datos analizado.",
        ],
        "col_tamanho": "Tamaño (bytes)", "col_sha": "SHA-512 (calculado)", "col_status": "Verificación oficial",
        "st_confere": "COINCIDE", "st_diverge": "DIVERGE", "st_sem_hash": "hash oficial no disponible", "st_csv": "no verificable (.csv)",
        "hash_manifesto": "Hash del manifiesto (SHA-512)",
        "aviso_divergencia": "**ATENCIÓN:** hay archivo(s) cuyo hash diverge del oficial publicado por el TSE. Esos archivos fueron excluidos del análisis (Sección 4); obtenga una nueva copia en el portal del TSE y ejecute nuevamente.",
        "excluidos": "**Archivos excluidos del análisis:** {lista}. Los archivos con hash divergente del oficial o corruptos no se analizan.",
        "motivo_hash": "hash divergente del oficial", "motivo_zip": "archivo .zip corrupto",
        "s6": "6. Entorno computacional y cronología de la ejecución",
        "inicio": "Inicio del procesamiento", "fim": "Conclusión del procesamiento", "duracao": "Duración total",
        "fuso": "Huso horario de referencia", "so": "Sistema operativo", "python": "Python", "bibliotecas": "Bibliotecas",
        "cpu": "Núcleos de procesamiento", "volume_zip": "Volumen comprimido leído", "volume_csv": "Volumen descomprimido procesado",
        "s7": "7. Preprocesamiento y control de calidad",
        "s7_txt": [
            "Lectura íntegra de los archivos CSV (codificación Latin-1, separador \";\") mediante un motor analítico columnar (DuckDB), sin muestreo.",
            "Valores centinela del TSE (\"#NULO#\", \"#NE\", −1, −3) convertidos en ausencia de información en los campos numéricos y temporales.",
            "Códigos de carga de la urna normalizados (eliminación de separadores y ceros a la izquierda) para su comparación con la correspondencia esperada.",
            "Clave de la sección: vuelta, UF, código del municipio, zona y sección. Clave del boletín: sección y cargo.",
            "Votos válidos: nominales y de lista (tipos 1 y 4). Inválidos: en blanco (tipo 2, opción 95) y nulos (tipo 3, opción 96). Los votos anulados escrutados por separado (opción 97) integran el total, pero no los válidos.",
        ],
        "col_cargo": "Cargo", "col_boletins": "Boletines", "col_votos": "Votos", "col_razao": "Razón modal Σvotos/comparecencia",
        "s8": "8. Fundamentos metodológicos",
        "s8_1": "8.1 Unidad de análisis",
        "s8_1_txt": "La unidad elemental es el boletín sección–cargo. Las pruebas de comparecencia, biometría, horarios y urna utilizan la sección. Las pruebas de dígitos (13 y 14) y la huella digital electoral (15) operan sobre agregados (candidato × UF).",
        "s8_2": "8.2 Grupos geográficos de referencia",
        "s8_2_txt": "Cada sección se compara con las secciones de su grupo de referencia, definido jerárquicamente: la zona electoral dentro del municipio (cuando reúne al menos {min} secciones); en caso contrario, el municipio; luego, el conjunto de las secciones restantes de la misma zona electoral; después, de la UF; y, por último, de la vuelta. Esta jerarquía preserva la homogeneidad local, incluso en grandes ciudades divididas en varias zonas, sin sacrificar la estabilidad de las estimaciones.",
        "s8_3": "8.3 Modelo beta-binomial y sobredispersión",
        "s8_3_txt": "Los recuentos de votos por sección presentan una variabilidad superior a la prevista por el modelo binomial, debido a la heterogeneidad del electorado entre secciones. Las pruebas de proporción utilizan el modelo beta-binomial (Skellam, 1948), con media m y correlación intraclase ρ estimadas en el grupo de referencia mediante el estimador de momentos ponderado (Ridout, Demétrio y Firth, 1999): m = Σx/Σn; S = Σ nᵢ(yᵢ − m)²/(G − 1); n₀ = (Σn − Σn²/Σn)/(G − 1); ρ = [S/(m(1 − m)) − 1]/(n₀ − 1), restringido a [{rmin}; {rmax}]. Parámetros: α = m(1/ρ − 1); β = (1 − m)(1/ρ − 1). La propia unidad evaluada se excluye de la estimación de su grupo (leave-one-out), de modo que un valor extremo no se enmascara a sí mismo; los grupos con menos de tres unidades reciben el ρ máximo (conservador).",
        "s8_4": "8.4 Comparaciones múltiples",
        "s8_4_txt": "En cada prueba inferencial, los p-valores de todas las unidades elegibles se ajustan mediante el procedimiento de Benjamini y Hochberg (1995), que controla la tasa esperada de falsos descubrimientos (FDR) en {alfa}. Las unidades en las que el evento probado no ocurre (por ejemplo, ausencia de unanimidad) o cuya proporción no supera la media del grupo reciben p = 1; como esas unidades no podrían señalarse, esto no altera las señalizaciones y hace conservador el ajuste.",
        "s8_5": "8.5 Pruebas determinísticas",
        "s8_5_txt": "Las pruebas 1, 2, 11 y 12 verifican identidades aritméticas, cronológicas o documentales. No hay modelo probabilístico: cualquier violación se señala.",
        "s8_6": "8.6 Parámetros utilizados",
        "col_parametro": "Parámetro", "col_valor": "Valor",
        "s9": "9. Resultados por prueba",
        "objetivo": "Objetivo", "metodo": "Método", "criterio": "Criterio de señalización", "limites": "Limitaciones y explicaciones alternativas",
        "resultado": "Resultado", "sem_sinal": "Ninguna señalización.",
        "principais": "Principales señalizaciones (hasta {n}; lista completa en `dados/secoes_sinalizadas.csv`)",
        "por_categoria": "Distribución por categoría",
        "col_categoria": "Categoría", "col_qtd": "Cantidad",
        "col_mun": "Municipio", "col_zona": "Zona", "col_secao": "Sección", "col_obs": "Observado", "col_ref": "Referencia",
        "col_p": "p", "col_q": "q (BH)", "col_detalhe": "Detalle", "col_candidato": "Candidato",
        "col_media": "Media obs. 2.º dígito", "col_media_modelo": "Media esperada (modelo)", "col_media_benford": "Media Benford 2BL",
        "tabela_digitos": "Resultados por candidato y UF (hasta {n}, ordenados por q; tabla completa en `dados/`)", "br_sem_zz": "Brasil (sin Exterior)", "col_chi2": "χ²", "col_n": "Recuentos", "col_corr": "Correlación (t, s)",
        "col_canto_obs": "Esquina obs.", "col_canto_esp": "Esquina esp.", "col_razao_oe": "Obs./esp.", "col_marca": "Inspección",
        "unidades_txt": "Unidades analizadas: {u}. Señalizaciones: {s}. Eventos informativos: {i}.",
        "bruto_txt": "Ocurrencias brutas (antes del criterio estadístico): {b}.",
        "k_senador": "Validación empírica de k (votos por elector)",
        "cruzado_a": "Secciones que cumplen solo el criterio A (bloques): {a}. Cumplen A y B: {ab}.",
        "klimek_graficos": "Gráficos",
        "s10": "10. Secciones con señalizaciones convergentes",
        "s10_txt": "Secciones señaladas por dos o más familias de pruebas, excluidos los eventos informativos y las pruebas agregadas. Las pruebas mecánicamente acopladas cuentan como una única evidencia: Cierre Aritmético del Boletín e Inconsistencia de Totales (familia aritmética); Unanimidad en la Sección, Voto Cruzado Extremo y Contraste de Vecindad (familia de concentración de votos). La convergencia de señalizaciones de familias distintas aumenta la prioridad de verificación documental.",
        "col_testes": "Pruebas", "col_ntestes": "Familias de pruebas",
        "s11": "11. Distribución de las señalizaciones por UF",
        "col_secoes_sinal": "Secciones señaladas", "col_pct": "% de las secciones",
        "s12": "12. Clasificación partidaria y federaciones",
        "s12_txt": "La clasificación ideológica es una premisa analítica del autor, utilizada exclusivamente en la prueba 6. Los partidos integrantes de una federación registrada ante el TSE para {ano} reciben la clasificación del partido que encabeza la federación.",
        "col_numero": "N.º", "col_sigla": "Partido", "col_original": "Clasificación original", "col_federacao": "Federación", "col_efetiva": "Clasificación aplicada",
        "s13": "13. Limitaciones generales",
        "s13_txt": [
            "Los datos analizados son los publicados por el TSE; el análisis no examina los archivos firmados individuales de las urnas (.bu, .rdv, .logjez), cuya verificación criptográfica se recomienda como etapa posterior para las secciones señaladas.",
            "Los modelos estadísticos son aproximaciones de la realidad. La señalización expresa improbabilidad bajo el modelo, no la causa del desvío.",
            "Las pruebas no son independientes entre sí; las señalizaciones convergentes pueden compartir la misma causa legítima.",
            "La clasificación ideológica (prueba 6) y los umbrales adoptados son premisas explícitas y pueden modificarse en el código fuente, que acompaña este informe para su reproducción íntegra.",
            "La prueba del primer dígito de Benford (1BL) y las comparaciones con elecciones anteriores no forman parte del alcance.",
        ],
        "s14": "14. Reproducibilidad y archivos producidos",
        "s14_txt": "El análisis es íntegramente reproducible: con los mismos archivos de entrada (hash del manifiesto idéntico) y el mismo código fuente, los resultados son idénticos. Los archivos producidos y sus hashes SHA-512 se enumeran a continuación; el archivo `manifesto_saida.sha512` registra los hashes de todos los archivos, incluido este informe.",
        "comando": "Comando de ejecución",
        "s15": "15. Referencias",
        "rodape": "Documento generado automáticamente por el motor de auditoría estadística v{v}. Una anomalía estadística no es prueba de fraude.",
        "ignorados": "Archivos ignorados por ser versiones duplicadas o más antiguas de la misma vuelta/UF (se mantuvo solo la versión más reciente): {lista}.",
        "ram": "Memoria física", "limite_duckdb": "Límite de memoria de DuckDB",
        "cesp_cobertura": "Correspondencia urna esperada × efectiva verificada en {secoes} secciones ({regulares} con urna y carga regulares). Pares vuelta/UF sin archivo CESP (no verificados): {sem}.",
        "digitos_excluidas": "Series candidato × UF excluidas por mediana de los recuentos inferior a {m} votos: {n}.",
        "nenhum": "ninguno", "col_sinalizado": "Señalado",
        "sim": "sí", "nao": "no", "todas_ufs": "Todas las UF", "sem_cesp": "Archivos CESP no disponibles: no se verificó la correspondencia urna esperada × efectiva; solo se evaluaron el tipo de urna y la junta escrutadora.",
    },
}

TXT_EXTRA = {
    "PT": {
        "legenda": "**Legenda de cores:** 🔴 Anomalia estatística (urna listada para verificação) · 🟡 Evento informativo (registrado para conferência, sem atingir o critério de anomalia) · 🟢 Nenhuma ocorrência · ⚠️ Falha na execução do teste",
        "hash_nucleo": "SHA-256 do núcleo analítico",
        "det_ok": "> 🛡️ **Status de Integridade (Determinismo Técnico):** Este relatório foi validado matematicamente. O hash criptográfico (SHA-256) aplicado estritamente sobre o **núcleo analítico de votos** (englobando as 15 metodologias estatísticas e excluindo timestamps de processamento) é idêntico ao relatório de homologação inicial. Isso comprova a exatidão absoluta e a ausência de aleatoriedade no motor de auditoria.",
        "det_base": "> 🧾 **Status de Integridade (Determinismo Técnico):** Primeira execução com estes arquivos de entrada. O núcleo analítico (15 metodologias, sem data, hora ou duração) foi registrado como **relatório de homologação**, com SHA-256 `{h}`. Toda nova execução com os mesmos arquivos será comparada a este registro.",
        "det_div": "> 🚨 **ALERTA CRÍTICO — Falha de Determinismo:** o núcleo analítico desta execução (SHA-256 `{h}`) difere do relatório de homologação (SHA-256 `{hb}`). Foram encontradas **{n} divergência(s)**, listadas abaixo (lista completa em `determinismo_divergencias.json`).",
        "det_corrompido": "> 🚨 **ALERTA CRÍTICO:** o registro de homologação foi alterado (`baseline_payload.json` não corresponde a `baseline.hash`). A verificação de determinismo não pôde ser concluída.",
        "col_analise": "Análise", "col_campo": "Campo", "col_baseline": "Valor no baseline (teste)", "col_atual": "Valor atual (live)",
        "busca_titulo": "🔎 Como conferir a sua urna",
        "busca_txt": ["Cada teste da Seção 9 traz a **lista completa** das urnas que caíram nele, com UF, município (nome e código do TSE), zona, seção, seções agregadas, local de votação, número da urna e código de carga.",
                      "1. Localize a UF, a zona e a seção no título de eleitor ou no e-Título.",
                      "2. Procure a zona e a seção neste relatório (Ctrl+F) ou nos arquivos `dados/busca_urnas.json` (uma entrada por seção, com todos os testes em que ela aparece) e `dados/secoes_sinalizadas.csv`.",
                      "3. Se a sua seção foi **agregada** a outra, os seus votos aparecem sob o número da seção principal: procure o número da sua seção na coluna *Seções agregadas*.",
                      "4. O número da urna e o código de carga permitem a comparação com o boletim impresso afixado na seção e com os arquivos oficiais de correspondência do TSE."],
        "res_caixa": "📊 **Resultado:** {st} **{s} anomalia(s)** em {u} unidades analisadas ({taxa}) · 🟡 {i} evento(s) informativo(s).",
        "explica_anom": "**O que significa:** cada urna da lista 🔴 abaixo apresentou um resultado que, pelo critério acima, é aritmeticamente impossível (testes 1 e 2) ou estatisticamente improvável para o seu contexto. É uma anomalia estatística: indica prioridade de verificação documental (boletim impresso, ata da mesa, registros da urna), mas não é, por si só, prova de fraude.",
        "explica_zero": "**O que significa:** nenhuma urna atingiu o critério de anomalia deste teste.",
        "explica_info": "Os eventos 🟡 são registrados para transparência e conferência, mas não atingiram o critério de anomalia.",
        "explica_agregado": "**O que significa:** a unidade de análise deste teste é o candidato em cada UF (não a seção); a tabela abaixo mostra todos os resultados.",
        "tab_anom": "🔴 Urnas com anomalia — lista completa ({n})",
        "tab_info": "🟡 Eventos informativos — lista completa ({n})",
        "col_num": "#", "col_agreg": "Seções agregadas", "col_local": "Local", "col_urna": "Nº da urna", "col_carga": "Cód. carga",
        "col_ocorrencia": "Ocorrência",
        "t03_por_cand": "Seções com 100% dos votos válidos para um único candidato, por candidato",
        "col_secoes_100": "Seções 100%", "col_improvaveis": "🔴 Improváveis",
        "tabela_digitos_full": "Resultados por candidato e UF (lista completa, ordenada por q)",
        "conv_full": "Lista completa ({n})",
        "s14_det": "**Verificação de determinismo.** O núcleo analítico (resultados das 15 análises e das urnas listadas, sem data, hora ou duração) está em `dados/nucleo_analitico.json`; o seu SHA-256 é `{h}`. O registro de homologação (baseline) destes arquivos de entrada fica em `{pasta}`. Números reais são registrados com {d} algarismos significativos, o que neutraliza o ruído de arredondamento de ponto flutuante sem afetar nenhum resultado.",
    },
    "EN": {
        "legenda": "**Color legend:** 🔴 Statistical anomaly (ballot box listed for verification) · 🟡 Informational event (recorded for checking, below the anomaly criterion) · 🟢 No occurrence · ⚠️ Test execution failure",
        "hash_nucleo": "SHA-256 of the analytical core",
        "det_ok": "> 🛡️ **Integrity Status (Technical Determinism):** This report has been mathematically validated. The cryptographic hash (SHA-256) applied strictly to the **analytical core of votes** (covering the 15 statistical methodologies and excluding processing timestamps) is identical to the initial homologation report. This demonstrates the absolute exactness and the absence of randomness in the audit engine.",
        "det_base": "> 🧾 **Integrity Status (Technical Determinism):** First run with these input files. The analytical core (15 methodologies, without date, time or duration) has been recorded as the **homologation report**, with SHA-256 `{h}`. Every new run with the same files will be compared with this record.",
        "det_div": "> 🚨 **CRITICAL ALERT — Determinism Failure:** the analytical core of this run (SHA-256 `{h}`) differs from the homologation report (SHA-256 `{hb}`). **{n} divergence(s)** were found and are listed below (full list in `determinismo_divergencias.json`).",
        "det_corrompido": "> 🚨 **CRITICAL ALERT:** the homologation record has been altered (`baseline_payload.json` does not match `baseline.hash`). The determinism check could not be completed.",
        "col_analise": "Analysis", "col_campo": "Field", "col_baseline": "Baseline value (test)", "col_atual": "Current value (live)",
        "busca_titulo": "🔎 How to check your ballot box",
        "busca_txt": ["Each test in Section 9 includes the **full list** of the ballot boxes it flagged, with state, municipality (name and TSE code), zone, section, aggregated sections, polling place, ballot box number and load code.",
                      "1. Find your state, zone and section on your voter card or in the e-Título app.",
                      "2. Search for the zone and section in this report (Ctrl+F) or in the files `dados/busca_urnas.json` (one entry per section, with every test in which it appears) and `dados/secoes_sinalizadas.csv`.",
                      "3. If your section was **aggregated** into another, your votes appear under the number of the main section: look for your section number in the *Aggregated sections* column.",
                      "4. The ballot box number and the load code allow comparison with the printed report posted at the section and with the TSE's official correspondence files."],
        "res_caixa": "📊 **Result:** {st} **{s} anomaly(ies)** in {u} units analyzed ({taxa}) · 🟡 {i} informational event(s).",
        "explica_anom": "**What it means:** each ballot box in the 🔴 list below showed a result that, under the criterion above, is arithmetically impossible (tests 1 and 2) or statistically improbable in its context. It is a statistical anomaly: it indicates priority for documentary verification (printed report, polling station minutes, ballot box records), but is not, by itself, proof of fraud.",
        "explica_zero": "**What it means:** no ballot box met the anomaly criterion of this test.",
        "explica_info": "The 🟡 events are recorded for transparency and checking, but did not meet the anomaly criterion.",
        "explica_agregado": "**What it means:** the unit of analysis of this test is the candidate in each state (not the section); the table below shows all results.",
        "tab_anom": "🔴 Ballot boxes with anomalies — full list ({n})",
        "tab_info": "🟡 Informational events — full list ({n})",
        "col_num": "#", "col_agreg": "Aggregated sections", "col_local": "Place", "col_urna": "Ballot box no.", "col_carga": "Load code",
        "col_ocorrencia": "Occurrence",
        "t03_por_cand": "Sections with 100% of the valid votes for a single candidate, by candidate",
        "col_secoes_100": "100% sections", "col_improvaveis": "🔴 Improbable",
        "tabela_digitos_full": "Results by candidate and state (full list, sorted by q)",
        "conv_full": "Full list ({n})",
        "s14_det": "**Determinism check.** The analytical core (results of the 15 analyses and of the listed ballot boxes, without date, time or duration) is in `dados/nucleo_analitico.json`; its SHA-256 is `{h}`. The homologation record (baseline) for these input files is kept in `{pasta}`. Real numbers are recorded with {d} significant digits, which neutralizes floating-point rounding noise without affecting any result.",
    },
    "ES": {
        "legenda": "**Leyenda de colores:** 🔴 Anomalía estadística (urna listada para verificación) · 🟡 Evento informativo (registrado para verificación, sin alcanzar el criterio de anomalía) · 🟢 Ninguna ocurrencia · ⚠️ Fallo en la ejecución de la prueba",
        "hash_nucleo": "SHA-256 del núcleo analítico",
        "det_ok": "> 🛡️ **Estado de Integridad (Determinismo Técnico):** Este informe ha sido validado matemáticamente. El hash criptográfico (SHA-256) aplicado estrictamente sobre el **núcleo analítico de votos** (que abarca las 15 metodologías estadísticas y excluye las marcas de tiempo de procesamiento) es idéntico al informe de homologación inicial. Esto demuestra la exactitud absoluta y la ausencia de aleatoriedad en el motor de auditoría.",
        "det_base": "> 🧾 **Estado de Integridad (Determinismo Técnico):** Primera ejecución con estos archivos de entrada. El núcleo analítico (15 metodologías, sin fecha, hora ni duración) se registró como **informe de homologación**, con SHA-256 `{h}`. Toda nueva ejecución con los mismos archivos se comparará con este registro.",
        "det_div": "> 🚨 **ALERTA CRÍTICA — Fallo de Determinismo:** el núcleo analítico de esta ejecución (SHA-256 `{h}`) difiere del informe de homologación (SHA-256 `{hb}`). Se encontraron **{n} divergencia(s)**, enumeradas abajo (lista completa en `determinismo_divergencias.json`).",
        "det_corrompido": "> 🚨 **ALERTA CRÍTICA:** el registro de homologación fue alterado (`baseline_payload.json` no corresponde a `baseline.hash`). La verificación de determinismo no pudo completarse.",
        "col_analise": "Análisis", "col_campo": "Campo", "col_baseline": "Valor en el baseline (prueba)", "col_atual": "Valor actual (live)",
        "busca_titulo": "🔎 Cómo verificar su urna",
        "busca_txt": ["Cada prueba de la Sección 9 incluye la **lista completa** de las urnas señaladas, con UF, municipio (nombre y código del TSE), zona, sección, secciones agregadas, local de votación, número de la urna y código de carga.",
                      "1. Localice la UF, la zona y la sección en el título de elector o en la aplicación e-Título.",
                      "2. Busque la zona y la sección en este informe (Ctrl+F) o en los archivos `dados/busca_urnas.json` (una entrada por sección, con todas las pruebas en que aparece) y `dados/secoes_sinalizadas.csv`.",
                      "3. Si su sección fue **agregada** a otra, sus votos aparecen bajo el número de la sección principal: busque el número de su sección en la columna *Secciones agregadas*.",
                      "4. El número de la urna y el código de carga permiten la comparación con el boletín impreso fijado en la sección y con los archivos oficiales de correspondencia del TSE."],
        "res_caixa": "📊 **Resultado:** {st} **{s} anomalía(s)** en {u} unidades analizadas ({taxa}) · 🟡 {i} evento(s) informativo(s).",
        "explica_anom": "**Qué significa:** cada urna de la lista 🔴 de abajo presentó un resultado que, según el criterio anterior, es aritméticamente imposible (pruebas 1 y 2) o estadísticamente improbable en su contexto. Es una anomalía estadística: indica prioridad de verificación documental (boletín impreso, acta de la mesa, registros de la urna), pero no es, por sí sola, prueba de fraude.",
        "explica_zero": "**Qué significa:** ninguna urna alcanzó el criterio de anomalía de esta prueba.",
        "explica_info": "Los eventos 🟡 se registran por transparencia y verificación, pero no alcanzaron el criterio de anomalía.",
        "explica_agregado": "**Qué significa:** la unidad de análisis de esta prueba es el candidato en cada UF (no la sección); la tabla de abajo muestra todos los resultados.",
        "tab_anom": "🔴 Urnas con anomalía — lista completa ({n})",
        "tab_info": "🟡 Eventos informativos — lista completa ({n})",
        "col_num": "#", "col_agreg": "Secciones agregadas", "col_local": "Local", "col_urna": "Nº de urna", "col_carga": "Cód. carga",
        "col_ocorrencia": "Ocurrencia",
        "t03_por_cand": "Secciones con el 100% de los votos válidos para un único candidato, por candidato",
        "col_secoes_100": "Secciones 100%", "col_improvaveis": "🔴 Improbables",
        "tabela_digitos_full": "Resultados por candidato y UF (lista completa, ordenada por q)",
        "conv_full": "Lista completa ({n})",
        "s14_det": "**Verificación de determinismo.** El núcleo analítico (resultados de los 15 análisis y de las urnas listadas, sin fecha, hora ni duración) está en `dados/nucleo_analitico.json`; su SHA-256 es `{h}`. El registro de homologación (baseline) de estos archivos de entrada se guarda en `{pasta}`. Los números reales se registran con {d} cifras significativas, lo que neutraliza el ruido de redondeo de coma flotante sin afectar ningún resultado.",
    },
}
for _lang in TXT_EXTRA:
    TXT[_lang].update(TXT_EXTRA[_lang])

REFERENCIAS = [
    "Beber, B.; Scacco, A. (2012). What the numbers say: A digit-based test for election fraud. *Political Analysis*, 20(2), 211–234.",
    "Benjamini, Y.; Hochberg, Y. (1995). Controlling the false discovery rate: a practical and powerful approach to multiple testing. *Journal of the Royal Statistical Society: Series B*, 57(1), 289–300.",
    "Deckert, J.; Myagkov, M.; Ordeshook, P. C. (2011). Benford's Law and the detection of election fraud. *Political Analysis*, 19(3), 245–268.",
    "Iglewicz, B.; Hoaglin, D. C. (1993). *How to Detect and Handle Outliers*. Milwaukee: ASQC Quality Press.",
    "Klimek, P.; Yegorov, Y.; Hanel, R.; Thurner, S. (2012). Statistical detection of systematic election irregularities. *Proceedings of the National Academy of Sciences*, 109(41), 16469–16473.",
    "Mebane, W. R., Jr. (2006). Election forensics: Vote counts and Benford's law. Summer Meeting of the Political Methodology Society, University of California, Davis.",
    "Mebane, W. R., Jr. (2008). Election forensics: The second-digit Benford's law test and recent American presidential elections. In: Alvarez, R. M.; Hall, T. E.; Hyde, S. D. (eds.), *Election Fraud: Detecting and Deterring Electoral Manipulation*. Washington, DC: Brookings Institution Press, 162–181.",
    "National Institute of Standards and Technology (2015). *FIPS PUB 180-4: Secure Hash Standard (SHS)*.",
    "Ridout, M. S.; Demétrio, C. G. B.; Firth, D. (1999). Estimating intraclass correlation for binary data. *Biometrics*, 55(1), 137–148.",
    "Skellam, J. G. (1948). A probability distribution derived from the binomial distribution by regarding the probability of success as variable between the sets of trials. *Journal of the Royal Statistical Society: Series B*, 10(2), 257–261.",
    "Tribunal Superior Eleitoral. Portal de Dados Abertos — Resultados {ano}: Boletim de Urna; Correspondências esperadas e efetivadas. https://dadosabertos.tse.jus.br/",
]


# =============================================================================
# 3. UTILITÁRIOS
# =============================================================================
def fuso_brasilia():
    try:
        from zoneinfo import ZoneInfo

        return ZoneInfo("America/Sao_Paulo")
    except Exception:  # Windows sem o pacote tzdata
        return timezone(timedelta(hours=-3), "BRT")


TZ_BRT = fuso_brasilia()
_LOG: list[str] = []


def log(msg: str) -> None:
    linha = f"[{datetime.now(TZ_BRT).strftime('%H:%M:%S')}] {msg}"
    print(linha, flush=True)
    _LOG.append(linha)


def memoria_total_gb() -> float | None:
    """Memória física total (GB), sem dependências externas (Windows, Linux, macOS)."""
    try:
        if sys.platform.startswith("win"):
            import ctypes

            class MEMSTATUS(ctypes.Structure):
                _fields_ = [("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
                            ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
                            ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong),
                            ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong),
                            ("sullAvailExtendedVirtual", ctypes.c_ulonglong)]
            st = MEMSTATUS()
            st.dwLength = ctypes.sizeof(MEMSTATUS)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(st))
            return st.ullTotalPhys / 1024 ** 3
        return os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 1024 ** 3
    except Exception:
        return None


def sha512_arquivo(caminho: Path, bloco: int = 8 * 1024 * 1024) -> str:
    h = hashlib.sha512()
    with open(caminho, "rb") as f:
        for parte in iter(lambda: f.read(bloco), b""):
            h.update(parte)
    return h.hexdigest()


def fnum(x, lang: str, nd: int = 0) -> str:
    if x is None:
        return "—"
    try:
        if isinstance(x, (float, np.floating)) and not np.isfinite(x):
            return "—"
    except TypeError:
        return str(x)
    s = f"{x:,.{nd}f}"
    if lang in ("PT", "ES"):
        s = s.replace(",", "\u0001").replace(".", ",").replace("\u0001", ".")
    return s


def fpct(x, lang: str, nd: int = 2) -> str:
    if x is None or not np.isfinite(x):
        return "—"
    return fnum(100.0 * x, lang, nd) + "%"


def fp(p, lang: str) -> str:
    if p is None or (isinstance(p, float) and not np.isfinite(p)):
        return "—"
    if p <= 0:
        return "< 1e-300"
    s = f"{p:.2e}" if p < 1e-4 else f"{p:.4f}"
    return s.replace(".", ",") if lang in ("PT", "ES") else s


def fgen(v, lang: str) -> str:
    """Formata valores genéricos de tabela (números com separador do idioma)."""
    if v is None:
        return "—"
    if isinstance(v, (bool, np.bool_)):
        return TXT[lang]["sim"] if v else TXT[lang]["nao"]
    if isinstance(v, (int, np.integer)):
        return fnum(int(v), lang)
    if isinstance(v, (float, np.floating)):
        if not np.isfinite(v):
            return "—"
        if float(v).is_integer() and abs(v) >= 1:
            return fnum(v, lang)
        return fnum(v, lang, 4 if abs(v) < 1 else 2)
    if isinstance(v, float) and math.isnan(v):
        return "—"
    return str(v)


def fid(v) -> str:
    """Identificadores (zona, seção, município): inteiro sem separador de milhar."""
    try:
        if v is None or v is pd.NA or (isinstance(v, (float, np.floating)) and not np.isfinite(v)):
            return "—"
        return str(int(v))
    except (TypeError, ValueError):
        return str(v)


_RE_DECIMAL = re.compile(r"(?<=\d)\.(?=\d)")


def fdec(texto, lang: str) -> str:
    """Converte o separador decimal de textos já formatados para o padrão do idioma."""
    if texto is None or (isinstance(texto, float) and math.isnan(texto)):
        return ""
    texto = str(texto)
    if lang == "EN":
        return texto.replace("hora local", "local time")
    return _RE_DECIMAL.sub(",", texto)


def md_tabela(cabecalho: list[str], linhas: list[list], alinhar_direita: set[int] | None = None) -> str:
    alinhar_direita = alinhar_direita or set()
    esc = lambda s: str(s).replace("|", "\\|").replace("\n", " ")
    out = ["| " + " | ".join(esc(c) for c in cabecalho) + " |",
           "|" + "|".join("---:" if i in alinhar_direita else "---" for i in range(len(cabecalho))) + "|"]
    for ln in linhas:
        out.append("| " + " | ".join(esc(c) for c in ln) + " |")
    return "\n".join(out)


def benjamini_hochberg(p) -> np.ndarray:
    p = np.asarray(p, dtype=float)
    m = p.size
    if m == 0:
        return p
    ordem = np.argsort(p, kind="mergesort")
    ajust = p[ordem] * m / np.arange(1, m + 1)
    ajust = np.minimum.accumulate(ajust[::-1])[::-1]
    q = np.empty(m)
    q[ordem] = np.clip(ajust, 0.0, 1.0)
    return q


def parametros_betabinomial(N, X, Q, S2, G):
    """Estimador de momentos ponderado (Ridout, Demétrio & Firth, 1999) a partir de
    estatísticas suficientes do grupo: N=Σn, X=Σx, Q=Σx²/n, S2=Σn², G=nº de unidades."""
    N, X, Q, S2, G = (np.asarray(v, dtype=float) for v in (N, X, Q, S2, G))
    with np.errstate(all="ignore"):
        m_bruto = X / N
        S = (Q - 2.0 * m_bruto * X + m_bruto ** 2 * N) / (G - 1.0)
        n0 = (N - S2 / N) / (G - 1.0)
        rho = (S / (m_bruto * (1.0 - m_bruto)) - 1.0) / (n0 - 1.0)
    rho = np.where(np.isfinite(rho), rho, RHO_MIN)
    rho = np.where(G < 3, RHO_MAX, rho)  # grupo pequeno demais: dispersão máxima (conservador)
    rho = np.clip(rho, RHO_MIN, RHO_MAX)
    m = (X + 0.5) / (N + 1.0)          # pseudo-contagem evita m ∈ {0, 1}
    k = 1.0 / rho - 1.0
    return m * k, (1.0 - m) * k, m_bruto, rho


def parametros_loo(agg: pd.DataFrame, g, x, n):
    """Parâmetros beta-binomiais do grupo de cada unidade EXCLUINDO a própria unidade (leave-one-out)."""
    ga = agg.reindex(g)
    x = np.asarray(x, dtype=float)
    n = np.asarray(n, dtype=float)
    return parametros_betabinomial(ga["N"].values - n, ga["X"].values - x, ga["Q"].values - x * x / n,
                                   ga["S2"].values - n * n, ga["G"].values - 1)


def p_superior_betabinomial(x, n, a, b, m):
    """P(X ≥ x) apenas onde x/n > m (demais recebem p = 1: não alteram o BH dos menores)."""
    x = np.asarray(x, dtype=float)
    n = np.asarray(n, dtype=float)
    p = np.ones(x.size)
    alvo = (n > 0) & (x > 0) & (x / np.where(n > 0, n, 1) > m)
    if alvo.any():
        p[alvo] = stats.betabinom.sf(x[alvo] - 1, n[alvo], a[alvo], b[alvo])
    return np.clip(p, 0.0, 1.0)


def p_integral_betabinomial(n, a, b):
    """P(X = n) sob beta-binomial = B(n + a, b) / B(a, b)."""
    n = np.asarray(n, dtype=float)
    with np.errstate(all="ignore"):
        lp = special.betaln(n + a, b) - special.betaln(a, b)
    return np.clip(np.exp(lp), 0.0, 1.0)


def z_robusto(valores: pd.Series, grupos: pd.Series) -> pd.Series:
    med = valores.groupby(grupos).transform("median")
    mad = (valores - med).abs().groupby(grupos).transform("median")
    with np.errstate(all="ignore"):
        z = 0.6745 * (valores - med) / mad.replace(0, np.nan)
    return z


def rotular_grupos(sec: pd.DataFrame) -> pd.Series:
    """Hierarquia: zona dentro do município (≥ MIN) → município (restantes) → zona (restantes)
    → UF (restantes) → turno."""
    d = sec[["turno", "uf", "mun", "zona"]]
    t, u = d["turno"].astype(str), d["uf"].astype(str)
    rot = pd.Series("", index=d.index, dtype=object)
    k_mz = d.groupby(["turno", "uf", "mun", "zona"])["mun"].transform("size")
    m0 = k_mz >= MIN_SECOES_GRUPO
    rot[m0] = "MZ|" + t[m0] + "|" + u[m0] + "|" + d.loc[m0, "mun"].astype(str) + "|" + d.loc[m0, "zona"].astype(str)
    k_mun = d[~m0].groupby(["turno", "uf", "mun"])["mun"].transform("size")
    m1 = pd.Series(False, index=d.index)
    m1.loc[k_mun.index] = k_mun >= MIN_SECOES_GRUPO
    rot[m1] = "M|" + t[m1] + "|" + u[m1] + "|" + d.loc[m1, "mun"].astype(str)
    resto = ~m0 & ~m1
    k_z = d[resto].groupby(["turno", "uf", "zona"])["zona"].transform("size")
    m2 = pd.Series(False, index=d.index)
    m2.loc[k_z.index] = k_z >= MIN_SECOES_GRUPO
    rot[m2] = "Z|" + t[m2] + "|" + u[m2] + "|" + d.loc[m2, "zona"].astype(str)
    resto2 = resto & ~m2
    k_u = d[resto2].groupby(["turno", "uf"])["uf"].transform("size")
    m3 = pd.Series(False, index=d.index)
    m3.loc[k_u.index] = k_u >= MIN_SECOES_GRUPO
    rot[m3] = "U|" + t[m3] + "|" + u[m3]
    resto3 = resto2 & ~m3
    rot[resto3] = "N|" + t[resto3]
    return rot


CHAVE_SECAO = ["turno", "uf", "mun", "zona", "secao"]
COLUNAS_SINAL = ["teste", "nivel", "categoria", "turno", "uf", "mun", "nm_mun", "zona", "secao", "loc", "cargo",
                 "observado", "referencia", "p", "q", "detalhe"]


@dataclass
class Resultado:
    tid: str
    unidades: int = 0
    sinalizados: int = 0
    informativos: int = 0
    brutos: int | None = None
    tabela: pd.DataFrame = field(default_factory=lambda: pd.DataFrame(columns=COLUNAS_SINAL))
    extras: dict = field(default_factory=dict)
    erro: str | None = None
    segundos: float = 0.0


def montar_sinais(df: pd.DataFrame, tid: str, nivel, categoria, observado, referencia="", p=np.nan, q=np.nan,
                  detalhe="", cargo=None) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=COLUNAS_SINAL)
    out = pd.DataFrame({
        "teste": tid,
        "nivel": nivel,
        "categoria": categoria,
        "turno": df["turno"].values,
        "uf": df["uf"].values,
        "mun": df["mun"].values,
        "nm_mun": df["nm_mun"].values if "nm_mun" in df else "",
        "zona": df["zona"].values,
        "secao": df["secao"].values,
        "loc": df["loc"].values if "loc" in df else np.nan,
        "cargo": (df["cargo"].values if cargo is None and "cargo" in df else (cargo if cargo is not None else np.nan)),
        "observado": observado,
        "referencia": referencia,
        "p": p,
        "q": q,
        "detalhe": detalhe,
    })
    return out[COLUNAS_SINAL]


# Dados de identificação da urna anexados a cada sinalização (vindos do próprio Boletim de Urna).
IDENT_SECAO = {"agreg": "secoes_agregadas", "urna": "nr_urna", "carga": "cod_carga", "tipo_urna": "tipo_urna",
               "junta": "junta", "aptos": "aptos", "comp": "comparecimento", "abertura": "abertura",
               "enc": "encerramento", "n_urnas": "n_urnas"}
COLUNAS_IDENT = list(IDENT_SECAO.values())


def sig_n(x, n: int = DIGITOS_NUCLEO):
    """Arredonda para n algarismos significativos (neutraliza ruído de ponto flutuante da ordem de 1e-15)."""
    try:
        f = float(x)
    except (TypeError, ValueError):
        return x
    return float(f"{f:.{n}g}") if math.isfinite(f) else f


def ordenar_sinais(tab: pd.DataFrame) -> pd.DataFrame:
    """Ordem canônica e total das sinalizações: anomalias primeiro, por q, depois pela chave da seção.
    Garante a mesma ordem em qualquer execução sobre os mesmos dados."""
    if tab is None or tab.empty:
        return tab
    t = tab.copy()
    t["_niv"] = (t["nivel"] != "anomalia").astype(int)
    t["_q"] = [sig_n(v) for v in t["q"]]
    t["_p"] = [sig_n(v) for v in t["p"]]
    for c in ("turno", "mun", "zona", "secao", "loc", "cargo"):
        t["_" + c] = pd.to_numeric(t[c], errors="coerce")
    for c in ("uf", "categoria", "observado", "referencia", "detalhe"):
        t["_" + c] = t[c].astype(str)
    chaves = ["_niv", "_q", "_p", "_turno", "_uf", "_mun", "_zona", "_secao", "_cargo", "_categoria", "_observado",
              "_referencia", "_detalhe", "_loc"]
    t = t.sort_values(chaves, kind="mergesort", na_position="last")
    return t.drop(columns=chaves).reset_index(drop=True)


def canon(v):
    """Converte um valor para forma JSON canônica: sem NaN, reais com DIGITOS_NUCLEO algarismos significativos."""
    if v is None or v is pd.NA or v is pd.NaT:
        return None
    if isinstance(v, (bool, np.bool_)):
        return bool(v)
    if isinstance(v, (int, np.integer)):
        return int(v)
    if isinstance(v, (float, np.floating)):
        f = float(v)
        if math.isnan(f):
            return None
        if math.isinf(f):
            return "inf" if f > 0 else "-inf"
        f = sig_n(f)
        return int(f) if f.is_integer() and abs(f) < 2 ** 53 else f
    if isinstance(v, (pd.Timestamp, datetime)):
        return v.isoformat()
    if isinstance(v, dict):
        return {str(k): canon(x) for k, x in v.items()}
    if isinstance(v, pd.DataFrame):
        return canon_df(v)
    if isinstance(v, pd.Series):
        return [canon(x) for x in v.tolist()]
    if isinstance(v, np.ndarray):
        return [canon(x) for x in v.tolist()]
    if isinstance(v, (list, tuple)):
        return [canon(x) for x in v]
    if isinstance(v, set):
        return sorted(canon(x) for x in v)
    if isinstance(v, Path):
        return v.name
    return str(v)


def canon_df(df: pd.DataFrame):
    """Tabela → dicionário indexado pela chave natural (turno|uf|cargo|nv...) quando única; senão, lista ordenada."""
    regs = [{str(k): canon(x) for k, x in r.items()} for r in df.to_dict("records")]
    chave = [c for c in ("turno", "uf", "mun", "zona", "secao", "cargo", "nv", "grupo") if c in df.columns]
    if chave:
        ks = ["|".join(str(r.get(c)) for c in chave) for r in regs]
        if len(set(ks)) == len(ks):
            return {k: r for k, r in sorted(zip(ks, regs))}
    return sorted(regs, key=lambda r: json.dumps(r, sort_keys=True, ensure_ascii=False))


def json_canonico(obj) -> str:
    return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def sha256_texto(txt: str) -> str:
    return hashlib.sha256(txt.encode("utf-8")).hexdigest()


def diff_profundo(a, b, caminho: tuple = ()) -> list[tuple]:
    """Comparação profunda: devolve (caminho, valor no baseline, valor atual) para cada divergência."""
    out = []
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a:
                out.append((caminho + (k,), "<ausente>", b[k]))
            elif k not in b:
                out.append((caminho + (k,), a[k], "<ausente>"))
            else:
                out.extend(diff_profundo(a[k], b[k], caminho + (k,)))
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            out.append((caminho + ("<tamanho>",), len(a), len(b)))
        for i, (x, y) in enumerate(zip(a, b)):
            out.extend(diff_profundo(x, y, caminho + (f"[{i}]",)))
    elif a != b:
        out.append((caminho, a, b))
    return out


def ocultar_no_windows(p: Path) -> None:
    if os.name == "nt":
        try:
            import ctypes
            ctypes.windll.kernel32.SetFileAttributesW(str(p), 0x02)
        except Exception:
            pass


# =============================================================================
# 4. MOTOR DA AUDITORIA
# =============================================================================
RE_BU = re.compile(r"^bweb_(\d)t_([A-Z]{2})_(\d{12})\.(zip|csv)$", re.I)
RE_CESP = re.compile(r"^CESP_(\d)t_([A-Z]{2})_(\d{12})\.zip$", re.I)
RE_CSEC = re.compile(r"^csec_(\d)t_([A-Z]{2})_(\d{12})\.csv$", re.I)
RE_CCONT = re.compile(r"^ccont_(\d)t_([A-Z]{2})_(\d{12})\.csv$", re.I)
RE_HEX = re.compile(r"\b([0-9a-fA-F]{128})\b")


def ts_nome(ts: str) -> datetime:
    try:
        return datetime.strptime(ts, "%d%m%Y%H%M")
    except ValueError:
        return datetime.min


SQL_SELECT_BU = """
SELECT
  TRY_CAST(NR_TURNO AS TINYINT) AS turno,
  SG_UF AS uf,
  TRY_CAST(CD_MUNICIPIO AS INTEGER) AS mun,
  NM_MUNICIPIO AS nm_mun,
  TRY_CAST(NR_ZONA AS INTEGER) AS zona,
  TRY_CAST(NR_SECAO AS INTEGER) AS secao,
  TRY_CAST(NR_LOCAL_VOTACAO AS INTEGER) AS loc,
  TRY_CAST(CD_CARGO_PERGUNTA AS SMALLINT) AS cargo,
  TRY_CAST(CD_TIPO_VOTAVEL AS SMALLINT) AS tv,
  TRY_CAST(NR_VOTAVEL AS INTEGER) AS nv,
  CASE WHEN TRY_CAST(CD_CARGO_PERGUNTA AS SMALLINT) IN (1, 3, 5) THEN NM_VOTAVEL END AS nm_votavel,
  TRY_CAST(NR_PARTIDO AS SMALLINT) AS partido,
  TRY_CAST(QT_VOTOS AS INTEGER) AS votos,
  TRY_CAST(QT_APTOS AS INTEGER) AS aptos,
  TRY_CAST(QT_COMPARECIMENTO AS INTEGER) AS comp,
  TRY_CAST(QT_ABSTENCOES AS INTEGER) AS abst,
  TRY_CAST(CD_TIPO_URNA AS SMALLINT) AS tipo_urna,
  TRY_CAST(NR_URNA_EFETIVADA AS BIGINT) AS urna,
  CASE WHEN CD_CARGA_1_URNA_EFETIVADA IS NULL OR CD_CARGA_1_URNA_EFETIVADA LIKE '#%' THEN NULL
       ELSE NULLIF(ltrim(replace(CD_CARGA_1_URNA_EFETIVADA, '.', '') ||
                         replace(coalesce(CD_CARGA_2_URNA_EFETIVADA, ''), '.', ''), '0'), '') END AS carga,
  CASE WHEN DS_SECOES_AGREGADAS LIKE '#%' THEN NULL ELSE DS_SECOES_AGREGADAS END AS agreg,
  TRY_CAST(DT_ABERTURA AS TIMESTAMP) AS abertura,
  TRY_CAST(DT_ENCERRAMENTO AS TIMESTAMP) AS enc,
  TRY_CAST(DT_EMISSAO_BU AS TIMESTAMP) AS emis,
  TRY_CAST(DT_BU_RECEBIDO AS TIMESTAMP) AS receb,
  CASE WHEN TRY_CAST(QT_ELEI_BIOM_SEM_HABILITACAO AS INTEGER) < 0 THEN NULL
       ELSE TRY_CAST(QT_ELEI_BIOM_SEM_HABILITACAO AS INTEGER) END AS biom,
  TRY_CAST(NR_JUNTA_APURADORA AS INTEGER) AS junta,
  CAST({arq} AS SMALLINT) AS arq
FROM {fonte}
"""

LEITURA_CSV = "read_csv('{caminho}', delim=';', quote='\"', escape='\"', header=true, encoding='latin-1', all_varchar=true)"


class Auditoria:
    def __init__(self, args):
        self.args = args
        self.dados = Path(args.dados).resolve()
        self.saida = Path(args.saida).resolve()
        self.trabalho = self.saida / "_trabalho"
        self.pasta_csv = self.saida / "dados"
        self.pasta_graf = self.saida / "graficos"
        self.t0 = time.time()
        self.inicio = datetime.now(TZ_BRT)
        self.arquivos_bu: list[dict] = []
        self.arquivos_cesp: list[dict] = []
        self.integridade: list[dict] = []
        self.resultados: dict[str, Resultado] = {}
        self.meta: dict = {}
        self.con = None

    # ------------------------------------------------------------------ setup
    def preparar_pastas(self):
        for p in (self.saida, self.trabalho, self.pasta_csv, self.pasta_graf):
            p.mkdir(parents=True, exist_ok=True)
        db = self.trabalho / "auditoria.duckdb"
        for f in (db, Path(str(db) + ".wal")):
            if f.exists():
                f.unlink()
        self.con = duckdb.connect(str(db))
        self.con.execute(f"SET temp_directory='{(self.trabalho / 'tmp').as_posix()}'")
        self.con.execute("SET preserve_insertion_order=false")
        # Limite explícito de memória do DuckDB (o restante fica para pandas/NumPy); excedentes vão para o disco.
        ram = memoria_total_gb()
        limite = max(2.0, min(ram * FRACAO_MEMORIA_DUCKDB, ram - 3.0)) if ram else 4.0
        self.con.execute(f"SET memory_limit='{limite:.1f}GB'")
        self.meta["ram_gb"] = ram
        self.meta["duckdb_memory_limit_gb"] = round(limite, 1)
        log(f"Memória física: {ram:.1f} GB; limite do DuckDB: {limite:.1f} GB." if ram else f"Limite do DuckDB: {limite:.1f} GB.")

    # ------------------------------------------------------- descoberta
    def descobrir_arquivos(self):
        if not self.dados.exists():
            sys.exit(f"Pasta de dados não encontrada: {self.dados}")
        todos = [p for p in self.dados.rglob("*") if p.is_file() and "_trabalho" not in p.parts]
        bu, cesp, csec, ccont, ignorados = {}, {}, [], [], []
        for p in sorted(todos):
            m = RE_BU.match(p.name)
            if m:
                turno, uf, ts, ext = int(m.group(1)), m.group(2).upper(), m.group(3), m.group(4).lower()
                novo = {"caminho": p, "turno": turno, "uf": uf, "ts": ts, "ext": ext, "nome": p.name}
                atual = bu.get((turno, uf))
                # Uma única versão por (turno, UF): a mais recente; no empate, o .zip (hash oficial verificável).
                if atual is None or (ts_nome(ts), ext == "zip") > (ts_nome(atual["ts"]), atual["ext"] == "zip"):
                    if atual is not None:
                        ignorados.append(atual["nome"])
                    bu[(turno, uf)] = novo
                else:
                    ignorados.append(p.name)
                continue
            m = RE_CESP.match(p.name)
            if m:
                cesp.setdefault((int(m.group(1)), m.group(2).upper()), []).append(
                    {"caminho": p, "turno": int(m.group(1)), "uf": m.group(2).upper(), "ts": m.group(3), "nome": p.name, "ext": "zip"})
                continue
            m = RE_CSEC.match(p.name)
            if m:
                csec.append({"caminho": p, "turno": int(m.group(1)), "uf": m.group(2).upper(), "ts": m.group(3), "nome": p.name, "ext": "csv"})
                continue
            m = RE_CCONT.match(p.name)
            if m:
                ccont.append({"caminho": p, "turno": int(m.group(1)), "uf": m.group(2).upper(), "ts": m.group(3), "nome": p.name, "ext": "csv"})
        self.arquivos_bu = sorted(bu.values(), key=lambda d: (d["turno"], d["uf"], d["nome"]))
        if not self.arquivos_bu:
            sys.exit(f"Nenhum arquivo de Boletim de Urna (bweb_*.zip ou bweb_*.csv) encontrado em {self.dados}")
        # CESP: mantém o arquivo mais recente por (turno, UF)
        self.cesp_zip = {k: max(v, key=lambda d: ts_nome(d["ts"])) for k, v in cesp.items()}
        self.cesp_csv = {"csec": csec, "ccont": ccont}
        self.meta["ignorados"] = sorted(ignorados)
        for nome in self.meta["ignorados"]:
            log(f"  Ignorado (versão duplicada ou mais antiga do mesmo turno/UF): {nome}")
        log(f"Arquivos de Boletim de Urna encontrados: {len(self.arquivos_bu)} "
            f"({', '.join(sorted({a['uf'] for a in self.arquivos_bu}))})")

    # ------------------------------------------------------- downloads
    def _baixar(self, url: str, destino: Path | None = None, timeout: int = 60) -> bytes | None:
        for tentativa in range(3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "auditoria-eleicoes/2.0"})
                with urllib.request.urlopen(req, timeout=timeout) as r:
                    dados = r.read()
                if destino is not None:
                    destino.parent.mkdir(parents=True, exist_ok=True)
                    destino.write_bytes(dados)
                return dados
            except Exception:
                time.sleep(2 * (tentativa + 1))
        return None

    def baixar_complementos(self):
        if self.args.offline:
            log("Modo offline: hashes oficiais e arquivos CESP não serão baixados.")
            return
        pasta = self.dados / "complementos_tse"
        turnos_ufs = {(a["turno"], a["uf"]) for a in self.arquivos_bu}
        faltantes = sorted(k for k in turnos_ufs if k not in self.cesp_zip)
        if faltantes:
            log(f"Baixando arquivos oficiais de correspondência (CESP) para {len(faltantes)} UF/turno...")
            for turno in sorted({t for t, _ in faltantes}):
                bruto = self._baixar(URL_CKAN.format(pacote=PACOTE_CESP.format(ano=ANO_ELEICAO, turno=turno)))
                if not bruto:
                    log("  Não foi possível consultar o catálogo do TSE (CESP). Teste 12 usará apenas os dados do BU.")
                    continue
                try:
                    recursos = json.loads(bruto.decode("utf-8"))["result"]["resources"]
                except Exception:
                    continue
                por_uf = {}
                for r in recursos:
                    nome = r.get("url", "").rsplit("/", 1)[-1]
                    m = RE_CESP.match(nome)
                    if m and int(m.group(1)) == turno:
                        uf = m.group(2).upper()
                        if (turno, uf) in faltantes:
                            atual = por_uf.get(uf)
                            if atual is None or ts_nome(m.group(3)) > ts_nome(atual[1]):
                                por_uf[uf] = (r["url"], m.group(3), nome)
                for uf, (url, ts, nome) in sorted(por_uf.items()):
                    destino = pasta / nome
                    if not destino.exists() and self._baixar(url, destino, timeout=300) is None:
                        log(f"  Falha ao baixar {nome}")
                        continue
                    self._baixar(url + ".sha512", pasta / (nome + ".sha512"))
                    self.cesp_zip[(turno, uf)] = {"caminho": destino, "turno": turno, "uf": uf, "ts": ts, "nome": nome, "ext": "zip"}
                    log(f"  {nome} obtido.")

    # ------------------------------------------------------- integridade
    def _hash_oficial(self, arq: dict, tipo: str) -> str | None:
        conteudo = None
        for local in (arq["caminho"].with_name(arq["caminho"].name + ".sha512"),
                      self.dados / "complementos_tse" / (arq["nome"] + ".sha512")):
            if local.exists():
                conteudo = local.read_text(encoding="utf-8", errors="ignore")
                break
        if conteudo is None and not self.args.offline:
            modelo = URL_HASH_BU if tipo == "bu" else URL_HASH_CESP
            bruto = self._baixar(modelo.format(ano=ANO_ELEICAO, arquivo=arq["nome"]))
            if bruto:
                conteudo = bruto.decode("utf-8", errors="ignore")
                destino = self.dados / "complementos_tse" / (arq["nome"] + ".sha512")
                destino.parent.mkdir(parents=True, exist_ok=True)
                destino.write_text(conteudo, encoding="utf-8")
        if not conteudo:
            return None
        m = RE_HEX.search(conteudo)
        return m.group(1).lower() if m else None

    def verificar_integridade(self):
        log("Calculando hashes SHA-512 e conferindo com os hashes oficiais do TSE...")
        lista = [(a, "bu") for a in self.arquivos_bu] + [(a, "cesp") for a in self.cesp_zip.values()]
        for chave in ("csec", "ccont"):
            lista += [(a, "cesp") for a in self.cesp_csv[chave]]
        for arq, tipo in lista:
            calc = sha512_arquivo(arq["caminho"])
            oficial = self._hash_oficial(arq, tipo) if arq["ext"] == "zip" else None
            if arq["ext"] != "zip":
                status = "st_csv"
            elif oficial is None:
                status = "st_sem_hash"
            else:
                status = "st_confere" if oficial == calc else "st_diverge"
            arq["sha512"], arq["status"] = calc, status
            self.integridade.append({"arquivo": arq["nome"], "tipo": tipo, "uf": arq["uf"], "turno": arq["turno"],
                                     "tamanho": arq["caminho"].stat().st_size, "sha512": calc,
                                     "sha512_oficial": oficial or "", "status": status})
            marca = {"st_confere": "CONFERE", "st_diverge": "DIVERGE!", "st_sem_hash": "sem hash oficial", "st_csv": "csv"}[status]
            log(f"  {arq['nome']}: {marca}")
        manifesto = "\n".join(f"{i['arquivo']};{i['tamanho']};{i['sha512']}" for i in sorted(self.integridade, key=lambda d: d["arquivo"]))
        self.meta["hash_manifesto"] = hashlib.sha512(manifesto.encode("utf-8")).hexdigest()
        # Cadeia de custódia: arquivo cujo hash diverge do oficial NÃO é analisado.
        self.meta.setdefault("excluidos", [])
        for a in [a for a in self.arquivos_bu if a.get("status") == "st_diverge"]:
            self.meta["excluidos"].append((a["nome"], "hash"))
            log(f"  EXCLUÍDO DA ANÁLISE (hash diverge do oficial): {a['nome']}")
        self.arquivos_bu = [a for a in self.arquivos_bu if a.get("status") != "st_diverge"]
        for k in [k for k, a in self.cesp_zip.items() if a.get("status") == "st_diverge"]:
            self.meta["excluidos"].append((self.cesp_zip[k]["nome"], "hash"))
            log(f"  EXCLUÍDO DA ANÁLISE (hash diverge do oficial): {self.cesp_zip[k]['nome']}")
            del self.cesp_zip[k]
        if not self.arquivos_bu:
            sys.exit("Nenhum arquivo de Boletim de Urna íntegro para analisar.")

    # ------------------------------------------------------- ingestão
    def ingerir(self):
        log("Carregando Boletins de Urna no banco analítico (DuckDB)...")
        self.con.execute("DROP TABLE IF EXISTS bu")
        criado = False
        pasta_ext = self.trabalho / "csv"
        pasta_ext.mkdir(exist_ok=True)
        self.meta["bytes_zip"] = 0
        self.meta["bytes_csv"] = 0
        for i, arq in enumerate(self.arquivos_bu):
            t = time.time()
            temporarios = []
            if arq["ext"] == "zip":
                try:
                    z = zipfile.ZipFile(arq["caminho"])
                except zipfile.BadZipFile:
                    self.meta.setdefault("excluidos", []).append((arq["nome"], "zip"))
                    log(f"  EXCLUÍDO DA ANÁLISE (arquivo .zip corrompido): {arq['nome']}")
                    arq["excluido"] = True
                    continue
                self.meta["bytes_zip"] += arq["caminho"].stat().st_size
                with z:
                    membros = [m for m in z.infolist() if m.filename.lower().endswith(".csv") and "bweb" in m.filename.lower()]
                    if not membros:
                        log(f"  {arq['nome']}: nenhum CSV de BU dentro do .zip — ignorado.")
                        continue
                    for mb in membros:
                        destino = pasta_ext / Path(mb.filename).name
                        livre = shutil.disk_usage(pasta_ext).free
                        if livre < mb.file_size * 1.2:
                            sys.exit(f"Espaço em disco insuficiente para descompactar {mb.filename} "
                                     f"({mb.file_size / 1e9:.1f} GB). Libere espaço ou descompacte em outra unidade e use --dados.")
                        with z.open(mb) as src, open(destino, "wb") as dst:
                            shutil.copyfileobj(src, dst, 16 * 1024 * 1024)
                        temporarios.append(destino)
                csvs = temporarios
            else:
                csvs = [arq["caminho"]]
            linhas = 0
            for c in csvs:
                self.meta["bytes_csv"] += c.stat().st_size
                fonte = LEITURA_CSV.format(caminho=c.as_posix().replace("'", "''"))
                sql = SQL_SELECT_BU.format(arq=i, fonte=fonte)
                if not criado:
                    self.con.execute(f"CREATE TABLE bu AS {sql}")
                    criado = True
                    n = self.con.execute("SELECT count(*) FROM bu").fetchone()[0]
                else:
                    antes = self.con.execute("SELECT count(*) FROM bu").fetchone()[0]
                    self.con.execute(f"INSERT INTO bu {sql}")
                    n = self.con.execute("SELECT count(*) FROM bu").fetchone()[0] - antes
                linhas += n
            for tmp in temporarios:
                if not self.args.manter_extraidos:
                    tmp.unlink(missing_ok=True)
            arq["linhas"] = linhas
            log(f"  {arq['nome']}: {linhas:,} registros ({time.time() - t:.0f}s)".replace(",", "."))
        if not criado:
            sys.exit("Nenhum registro de Boletim de Urna foi carregado.")
        self.arquivos_bu = [a for a in self.arquivos_bu if not a.get("excluido")]
        self.meta["linhas"] = self.con.execute("SELECT count(*) FROM bu").fetchone()[0]
        repetidos = self.con.execute("""SELECT turno, uf FROM bu GROUP BY ALL HAVING count(DISTINCT arq) > 1""").fetchall()
        if repetidos:
            sys.exit(f"Turno/UF carregado a partir de mais de um arquivo: {repetidos}. Mantenha uma única versão por turno/UF.")

    def ingerir_cesp(self):
        self.tem_cesp = False
        csec, ccont = [], []
        pasta = self.trabalho / "cesp"
        pasta.mkdir(exist_ok=True)
        for (turno, uf), arq in self.cesp_zip.items():
            try:
                with zipfile.ZipFile(arq["caminho"]) as z:
                    for mb in z.infolist():
                        nome = Path(mb.filename).name
                        destino = pasta / nome
                        if RE_CSEC.match(nome) or RE_CCONT.match(nome):
                            with z.open(mb) as src, open(destino, "wb") as dst:
                                shutil.copyfileobj(src, dst)
                            (csec if RE_CSEC.match(nome) else ccont).append((turno, uf, destino))
            except zipfile.BadZipFile:
                log(f"  Arquivo CESP corrompido: {arq['nome']}")
        presentes = {(t, u) for t, u, _ in csec}
        for chave, lista in (("csec", csec), ("ccont", ccont)):
            soltos = {}
            for a in self.cesp_csv[chave]:
                k = (a["turno"], a["uf"])
                if k not in presentes and (k not in soltos or ts_nome(a["ts"]) > ts_nome(soltos[k]["ts"])):
                    soltos[k] = a
            lista += [(a["turno"], a["uf"], a["caminho"]) for a in soltos.values()]
        if not csec:
            log("Arquivos CESP indisponíveis: teste 12 avaliará apenas tipo de urna e junta apuradora.")
            return
        partes = []
        for turno, uf, c in csec:
            partes.append(f"""SELECT {turno}::TINYINT AS turno, SG_UF AS uf, TRY_CAST(CD_MUNICIPIO AS INTEGER) AS mun,
                TRY_CAST(NR_ZONA AS INTEGER) AS zona, TRY_CAST(NR_SECAO AS INTEGER) AS secao,
                TRY_CAST(NR_URNA_ESPERADA AS BIGINT) AS urna_e, NULLIF(ltrim(CD_CARGA_URNA_ESPERADA, '0'), '') AS carga_e,
                ST_CORRESP_ALTERADA AS st FROM {LEITURA_CSV.format(caminho=c.as_posix().replace("'", "''"))}""")
        self.con.execute("CREATE OR REPLACE TABLE csec AS " + " UNION ALL ".join(partes))
        partes = []
        for turno, uf, c in ccont:
            partes.append(f"""SELECT {turno}::TINYINT AS turno, SG_UF AS uf, TRY_CAST(CD_MUNICIPIO AS INTEGER) AS mun,
                TRY_CAST(NR_ZONA AS INTEGER) AS zona, TRY_CAST(NR_URNA_ESPERADA AS BIGINT) AS urna_c,
                NULLIF(ltrim(CD_CARGA_URNA_ESPERADA, '0'), '') AS carga_c
                FROM {LEITURA_CSV.format(caminho=c.as_posix().replace("'", "''"))}""")
        if partes:
            self.con.execute("CREATE OR REPLACE TABLE ccont AS " + " UNION ALL ".join(partes))
        else:
            self.con.execute("CREATE OR REPLACE TABLE ccont (turno TINYINT, uf VARCHAR, mun INTEGER, zona INTEGER, urna_c BIGINT, carga_c VARCHAR)")
        self.tem_cesp = True
        self.meta["cesp_pares"] = sorted({(int(t), u) for t, u, _ in csec})
        log(f"Correspondências oficiais carregadas para {len(self.meta['cesp_pares'])} pares turno/UF.")

    # ------------------------------------------------------- bases
    def preparar_bases(self):
        log("Consolidando boletins por seção e cargo...")
        c = self.con
        c.execute("""
            CREATE OR REPLACE TABLE sc AS
            SELECT turno, uf, mun, zona, secao, cargo,
                   min(aptos) AS aptos_min, max(aptos) AS aptos, min(comp) AS comp_min, max(comp) AS comp,
                   min(abst) AS abst_min, max(abst) AS abst,
                   count(*) AS linhas, count(DISTINCT (tv, nv)) AS votaveis,
                   sum(votos)::BIGINT AS total, min(votos) AS votos_min,
                   coalesce(sum(votos) FILTER (WHERE tv IN (1, 4) AND nv <> 97), 0)::BIGINT AS validos,
                   coalesce(sum(votos) FILTER (WHERE tv = 1 AND nv <> 97), 0)::BIGINT AS nominais,
                   coalesce(sum(votos) FILTER (WHERE tv = 4), 0)::BIGINT AS legenda,
                   coalesce(sum(votos) FILTER (WHERE tv = 2), 0)::BIGINT AS brancos,
                   coalesce(sum(votos) FILTER (WHERE tv = 3), 0)::BIGINT AS nulos,
                   coalesce(sum(votos) FILTER (WHERE nv = 97 OR tv NOT IN (1, 2, 3, 4)), 0)::BIGINT AS anulados,
                   max(votos) FILTER (WHERE tv = 1 AND nv <> 97) AS top_votos,
                   arg_max(nv, votos::BIGINT * 1000000 - nv) FILTER (WHERE tv = 1 AND nv <> 97) AS top_nv  -- empate: menor número
            FROM bu GROUP BY ALL
        """)
        c.execute("""
            CREATE OR REPLACE TABLE sec AS
            SELECT turno, uf, mun, zona, secao,
                   min(nm_mun) AS nm_mun, min(loc) AS loc,
                   max(aptos) AS aptos, max(comp) AS comp, max(biom) AS biom,
                   min(abertura) AS abertura, max(abertura) AS abertura_max,
                   min(enc) AS enc, max(enc) AS enc_max, min(emis) AS emis, max(receb) AS receb,
                   max(junta) AS junta, max(tipo_urna) AS tipo_urna, min(tipo_urna) AS tipo_urna_min,
                   count(DISTINCT urna) AS n_urnas, count(DISTINCT carga) AS n_cargas,
                   count(DISTINCT abertura) AS n_aberturas, count(DISTINCT biom) AS n_biom,
                   min(urna) AS urna, min(carga) AS carga,
                   min(agreg) AS agreg, list(DISTINCT cargo ORDER BY cargo) AS cargos
            FROM bu GROUP BY ALL
        """)
        self.sec = c.execute("SELECT * FROM sec ORDER BY turno, uf, mun, zona, secao").df()
        self.sec["grupo"] = rotular_grupos(self.sec).values
        c.register("grupos_df", self.sec[CHAVE_SECAO + ["grupo", "nm_mun", "loc"]])
        c.execute("CREATE OR REPLACE TABLE grupos AS SELECT * FROM grupos_df")
        c.unregister("grupos_df")
        self.sc = c.execute("""SELECT s.*, g.grupo, g.nm_mun, g.loc FROM sc s JOIN grupos g USING (turno, uf, mun, zona, secao)
                                ORDER BY turno, uf, mun, zona, secao, cargo""").df()
        self.meta["secoes"] = len(self.sec)
        self.meta["secoes_distintas"] = len(self.sec[["uf", "mun", "zona", "secao"]].drop_duplicates())
        self.meta["boletins"] = len(self.sc)
        self.meta["turnos"] = sorted(int(t) for t in self.sec["turno"].unique())
        self.meta["ufs"] = sorted(self.sec["uf"].unique().tolist())
        cobertura = (self.sec.groupby(["turno", "uf"]).size().rename("secoes").reset_index())
        self.meta["cobertura"] = cobertura
        cand = c.execute("""SELECT turno, uf, cargo, nv, min(nm_votavel) AS nome, min(partido) AS partido,
                                   sum(votos)::BIGINT AS votos
                            FROM bu WHERE tv = 1 AND cargo IN (1, 3, 5) GROUP BY ALL
                            ORDER BY turno, uf, cargo, nv""").df()
        self.cand = cand
        pres = cand[cand.cargo == 1].groupby(["turno", "nv"]).agg(votos=("votos", "sum"), nome=("nome", "first")).reset_index()
        self.lideres_pres = {}
        for t, g in pres.groupby("turno"):
            self.lideres_pres[int(t)] = g.sort_values(["votos", "nv"], ascending=[False, True], kind="mergesort").head(2)[["nv", "nome", "votos"]].to_dict("records")
        gov = cand[cand.cargo == 3].sort_values(["votos", "nv"], ascending=[False, True], kind="mergesort").groupby(["turno", "uf"]).head(1)
        self.lideres_gov = {(int(r.turno), r.uf): {"nv": int(r.nv), "nome": r.nome} for r in gov.itertuples()}
        log(f"  {self.meta['secoes']:,} seções; {self.meta['boletins']:,} boletins seção–cargo.".replace(",", "."))

    def _nome_mun(self, df: pd.DataFrame) -> pd.DataFrame:
        if "nm_mun" in df.columns and "loc" in df.columns:
            return df
        return df.merge(self.sec[CHAVE_SECAO + ["nm_mun", "loc"]], on=CHAVE_SECAO, how="left")

    # ===================================================================
    # TESTES
    # ===================================================================
    def t01_fechamento(self) -> Resultado:
        sc = self.sc
        partes = []
        regras = [
            ("aptos_comp_abst", sc["aptos"] != sc["comp"] + sc["abst"],
             lambda d: d["aptos"].astype(str) + " ≠ " + d["comp"].astype(str) + " + " + d["abst"].astype(str)),
            ("comp_maior_aptos", sc["comp"] > sc["aptos"],
             lambda d: d["comp"].astype(str) + " > " + d["aptos"].astype(str)),
            ("valores_divergentes", (sc["aptos_min"] != sc["aptos"]) | (sc["comp_min"] != sc["comp"]) | (sc["abst_min"] != sc["abst"]),
             lambda d: "aptos " + d["aptos_min"].astype(str) + "–" + d["aptos"].astype(str) + "; comp " + d["comp_min"].astype(str) + "–" + d["comp"].astype(str)),
            ("votavel_duplicado", sc["linhas"] != sc["votaveis"],
             lambda d: (d["linhas"] - d["votaveis"]).astype(str) + " dup."),
            ("votos_negativos", sc["votos_min"] < 0, lambda d: "min " + d["votos_min"].astype(str)),
        ]
        for cat, mask, obs in regras:
            mask = mask.fillna(False)
            d = sc[mask]
            if len(d):
                partes.append(montar_sinais(d, "T01", "anomalia", cat, obs(d).values))
        # Regras por seção
        est = sc[sc["cargo"].isin(CARGOS_ESTADUAIS)]
        comp_est = est.groupby(CHAVE_SECAO)["comp"].agg(["min", "max"])
        div = comp_est[comp_est["min"] != comp_est["max"]].reset_index()
        if len(div):
            div = self._nome_mun(div)
            partes.append(montar_sinais(div, "T01", "anomalia", "comp_estadual_divergente",
                                        (div["min"].astype(str) + "–" + div["max"].astype(str)).values, cargo=np.nan))
        pres = sc[sc["cargo"] == 1][CHAVE_SECAO + ["comp"]].rename(columns={"comp": "comp_p"})
        cmp_ = pres.merge(comp_est["max"].rename("comp_e").reset_index(), on=CHAVE_SECAO)
        menor = cmp_[cmp_["comp_p"] < cmp_["comp_e"]]
        if len(menor):
            menor = self._nome_mun(menor)
            partes.append(montar_sinais(menor, "T01", "anomalia", "comp_presidente_menor",
                                        (menor["comp_p"].astype(str) + " < " + menor["comp_e"].astype(str)).values, cargo=1))
        # Atributos da urna que devem ser constantes em todas as linhas da seção
        sec = self.sec
        inc = sec[(sec["n_urnas"] > 1) | (sec["n_cargas"] > 1) | (sec["n_aberturas"] > 1) | (sec["n_biom"] > 1)]
        if len(inc):
            partes.append(montar_sinais(inc, "T01", "anomalia", "urna_inconsistente",
                                        ("urnas=" + inc["n_urnas"].astype(str) + "; cargas=" + inc["n_cargas"].astype(str)
                                         + "; aberturas=" + inc["n_aberturas"].astype(str) + "; biometria=" + inc["n_biom"].astype(str)).values,
                                        cargo=np.nan))
        # Cargos esperados
        tem_votos = sec["comp"].fillna(0) > 0

        def esperados(r):
            if r.uf == "ZZ":
                return {1}
            if r.turno == 1:
                return {1, 3, 5, 6, 8} if r.uf == "DF" else {1, 3, 5, 6, 7}
            return None  # 2º turno: depende de haver disputa de Governador na UF

        faltas = []
        cargos_2t = {}
        if (sec["turno"] == 2).any():
            cargos_2t = self.sc[self.sc.turno == 2].groupby("uf")["cargo"].agg(lambda s: set(s.unique())).to_dict()
        for r in sec[tem_votos & (sec["tipo_urna"] == 1)].itertuples(index=False):
            esp = esperados(r)
            if esp is None:
                esp = cargos_2t.get(r.uf, set())
            ausentes = esp - set(r.cargos)
            if ausentes:
                faltas.append((r, ",".join(str(a) for a in sorted(ausentes))))
        if faltas:
            df = pd.DataFrame([f[0]._asdict() for f in faltas])
            partes.append(montar_sinais(df, "T01", "anomalia", "cargo_ausente", [f[1] for f in faltas], cargo=np.nan))
        tab = pd.concat(partes, ignore_index=True) if partes else pd.DataFrame(columns=COLUNAS_SINAL)
        return Resultado("T01", unidades=len(sc), sinalizados=len(tab), tabela=tab)

    def t02_totais(self) -> Resultado:
        sc = self.sc.copy()
        sc["k"] = sc["cargo"].map(VAGAS_POR_CARGO).fillna(1).astype(int)
        sc["esperado"] = sc["k"] * sc["comp"]
        sc["delta"] = sc["total"] - sc["esperado"]
        d = sc[(sc["delta"] != 0) & sc["comp"].notna()]
        tab = montar_sinais(d, "T02", "anomalia", "soma_votos", d["total"].values, d["esperado"].values,
                            detalhe=("Δ=" + d["delta"].astype(str) + "; k=" + d["k"].astype(str)).values)
        with np.errstate(all="ignore"):
            razao = (sc["total"] / sc["comp"]).round(3)
        modal = (sc.assign(r=razao).groupby("cargo")["r"].agg(lambda s: s.mode().iloc[0] if len(s.mode()) else np.nan))
        contagem = sc.groupby("cargo").size()
        self.meta["k_validacao"] = [{"cargo": int(k), "boletins": int(contagem[k]), "razao_modal": float(modal[k]),
                                     "k": VAGAS_POR_CARGO.get(int(k), 1)} for k in modal.index]
        return Resultado("T02", unidades=len(sc), sinalizados=len(tab), tabela=tab)

    def t03_unanimidade(self) -> Resultado:
        sc = self.sc
        cargos = [1, 3, 6, 7, 8]
        eleg = sc[sc["cargo"].isin(cargos) & (sc["validos"] >= MIN_VOTOS_UNANIMIDADE)].copy()
        un = eleg[eleg["top_votos"] == eleg["validos"]].copy()
        res = Resultado("T03", unidades=len(eleg), brutos=len(un))
        if un.empty:
            return res
        # Estatísticas suficientes do grupo para cada (grupo, cargo, candidato) unânime
        base = eleg.groupby(["grupo", "cargo"]).agg(N=("validos", "sum"), G=("validos", "size"),
                                                    S2=("validos", lambda s: float((s.astype(float) ** 2).sum()))).reset_index()
        alvo = un[["grupo", "cargo", "top_nv"]].drop_duplicates().rename(columns={"top_nv": "nv"})
        self.con.register("alvo_df", alvo)
        self.con.execute("CREATE OR REPLACE TEMP TABLE alvo AS SELECT * FROM alvo_df")
        self.con.unregister("alvo_df")
        xq = self.con.execute(f"""
            WITH v AS (
                SELECT b.turno, b.uf, b.mun, b.zona, b.secao, b.cargo, b.nv, sum(b.votos)::BIGINT AS x
                FROM bu b WHERE b.tv = 1 AND b.cargo IN (SELECT DISTINCT cargo FROM alvo)
                  AND b.nv IN (SELECT DISTINCT nv FROM alvo)
                GROUP BY ALL)
            SELECT g.grupo, v.cargo, v.nv, sum(v.x)::DOUBLE AS X, sum(v.x::DOUBLE * v.x / s.validos) AS Q
            FROM v JOIN grupos g USING (turno, uf, mun, zona, secao)
                   JOIN sc s USING (turno, uf, mun, zona, secao, cargo)
                   JOIN alvo a ON a.grupo = g.grupo AND a.cargo = v.cargo AND a.nv = v.nv
            WHERE s.validos >= {MIN_VOTOS_UNANIMIDADE}
            GROUP BY ALL""").df()
        est = alvo.merge(base, on=["grupo", "cargo"], how="left").merge(xq, on=["grupo", "cargo", "nv"], how="left")
        un = un.merge(est[["grupo", "cargo", "nv", "N", "X", "Q", "S2", "G"]], left_on=["grupo", "cargo", "top_nv"],
                      right_on=["grupo", "cargo", "nv"], how="left")
        # Leave-one-out: a própria seção (x = n = válidos) é excluída da estimativa do grupo
        nn = un["validos"].astype(float).values
        a, b, m_bruto, _ = parametros_betabinomial(un["N"].values - nn, un["X"].values - nn, un["Q"].values - nn,
                                                   un["S2"].values - nn * nn, un["G"].values - 1)
        un["m"] = m_bruto
        un["p"] = p_integral_betabinomial(nn, a, b)
        p_todos = np.ones(len(eleg))
        q = benjamini_hochberg(np.concatenate([un["p"].values, p_todos[len(un):]]))
        un["q"] = q[: len(un)]
        un["improvavel"] = un["q"] < ALFA_FDR
        un = un.merge(self.cand[["turno", "uf", "cargo", "nv", "nome"]].rename(columns={"nv": "top_nv", "nome": "nome_cand"}),
                      on=["turno", "uf", "cargo", "top_nv"], how="left")
        nv_txt = "nº " + un["top_nv"].astype("int64").astype(str)
        un["det"] = np.where(un["nome_cand"].notna(), nv_txt + " — " + un["nome_cand"].astype(str), nv_txt)
        v = un["validos"].astype("int64").astype(str)
        un["obs"] = v + "/" + v + " (100%)"
        un["ref"] = np.where(un["m"].notna(), (100 * un["m"]).round(2).astype(str) + "%", "—")
        sig, inf = un[un["improvavel"]], un[~un["improvavel"]]
        res.sinalizados, res.informativos = len(sig), len(inf)
        partes = [montar_sinais(d, "T03", nivel, cat, d["obs"].values, d["ref"].values, d["p"].values, d["q"].values, d["det"].values)
                  for d, nivel, cat in ((sig, "anomalia", "unanimidade"), (inf, "informativo", "unanimidade_100")) if len(d)]
        res.tabela = pd.concat(partes, ignore_index=True)
        # Inventário: seções com 100% dos votos válidos para um único candidato, por candidato e UF
        # (Presidente também somado em todas as UFs carregadas).
        chave = ["turno", "uf", "cargo", "top_nv"]
        pc = un.groupby(chave).agg(nome=("nome_cand", "first"), secoes=("validos", "size"),
                                   improvaveis=("improvavel", "sum")).reset_index()
        pres = un[un["cargo"] == 1]
        if pres["uf"].nunique() > 1:
            pb = pres.groupby(["turno", "cargo", "top_nv"]).agg(nome=("nome_cand", "first"), secoes=("validos", "size"),
                                                               improvaveis=("improvavel", "sum")).reset_index().assign(uf="BR")
            pc = pd.concat([pb[pc.columns], pc], ignore_index=True)
        pc = pc.rename(columns={"top_nv": "nv"})
        pc["_ord"] = (pc["uf"] != "BR").astype(int)
        pc = (pc.sort_values(["turno", "cargo", "_ord", "uf", "secoes", "nv"], ascending=[True, True, True, True, False, True],
                             kind="mergesort").drop(columns="_ord").reset_index(drop=True))
        pc["improvaveis"] = pc["improvaveis"].astype(int)
        res.extras["por_candidato"] = pc
        return res

    def _teste_proporcao(self, df, x_col, n_col, tid, categoria, detalhe_fn=None):
        """Teste de cauda superior beta-binomial. Os parâmetros são estimados por (grupo, cargo)
        e o ajuste de Benjamini–Hochberg é único para todas as unidades do teste."""
        d = df[df[n_col] > 0].copy()
        x = d[x_col].astype(float).values
        n = d[n_col].astype(float).values
        cargo = d["cargo"].astype(str).values if "cargo" in d else np.full(len(d), "-")
        g = d["grupo"].astype(str).values + "#" + cargo
        aux = pd.DataFrame({"g": g, "n": n, "x": x, "q": x * x / n, "n2": n * n})
        agg = aux.groupby("g").agg(N=("n", "sum"), X=("x", "sum"), Q=("q", "sum"), S2=("n2", "sum"), G=("n", "size"))
        a, b, m_ref, _ = parametros_loo(agg, g, x, n)
        d["m_ref"] = m_ref
        d["p"] = p_superior_betabinomial(x, n, a, b, m_ref)
        d["q"] = benjamini_hochberg(d["p"].values)
        sig = d[d["q"] < ALFA_FDR].sort_values("q")
        det = detalhe_fn(sig) if detalhe_fn else ""
        xi, ni = sig[x_col].astype("int64"), sig[n_col].astype("int64")
        tab = montar_sinais(sig, tid, "anomalia", categoria,
                            ((100 * xi / ni).round(2).astype(str) + "% (" + xi.astype(str) + "/" + ni.astype(str) + ")").values,
                            ((100 * sig["m_ref"]).round(2).astype(str) + "%").values, sig["p"].values, sig["q"].values, det)
        return len(d), tab

    def t04_abstencao(self) -> Resultado:
        sec = self.sec[(self.sec["aptos"] >= MIN_APTOS_ABSTENCAO) & self.sec["comp"].notna()].copy()
        res = Resultado("T04", unidades=len(sec))
        x, n = sec["comp"].astype(float).values, sec["aptos"].astype(float).values
        aux = pd.DataFrame({"g": sec["grupo"].values, "n": n, "x": x, "q": x * x / n, "n2": n * n})
        agg = aux.groupby("g").agg(N=("n", "sum"), X=("x", "sum"), Q=("q", "sum"), S2=("n2", "sum"), G=("n", "size"))
        a, b, m_ref, _ = parametros_loo(agg, sec["grupo"].values, x, n)
        integral = (sec["comp"] == sec["aptos"]).values
        p = np.ones(len(sec))
        p[integral] = p_integral_betabinomial(n[integral], a[integral], b[integral])
        sec["p"], sec["m_ref"] = p, m_ref
        sec["q"] = benjamini_hochberg(p)
        res.brutos = int(integral.sum())
        sig = sec[(sec["q"] < ALFA_FDR) & integral].sort_values("q")
        res.sinalizados = len(sig)
        res.tabela = montar_sinais(sig, "T04", "anomalia", "abstencao_zero",
                                   (sig["comp"].astype("int64").astype(str) + "/" + sig["aptos"].astype("int64").astype(str)).values,
                                   (100 * sig["m_ref"]).round(2).astype(str).values + "%", sig["p"].values, sig["q"].values, cargo=np.nan)
        return res

    def t05_brancos_nulos(self) -> Resultado:
        sc = self.sc[self.sc["total"] >= MIN_VOTOS_PROPORCAO].copy()
        sc["invalidos"] = sc["brancos"] + sc["nulos"]
        sc["prop"] = sc["invalidos"] / sc["total"]
        sc["z"] = z_robusto(sc["prop"], sc["grupo"].astype(str) + "|" + sc["cargo"].astype(str))
        u, tab = self._teste_proporcao(sc, "invalidos", "total", "T05", "brancos_nulos",
                                       detalhe_fn=lambda s: ("z=" + s["z"].round(1).astype(str)).values)
        return Resultado("T05", unidades=u, sinalizados=len(tab), tabela=tab)

    def t06_voto_cruzado(self) -> Resultado:
        cls = classificacao_efetiva()
        self.con.register("cls_df", cls[["numero", "bloco", "escore"]])
        blocos = self.con.execute("""
            SELECT b.turno, b.uf, b.mun, b.zona, b.secao, b.cargo,
                   sum(b.votos)::BIGINT AS validos,
                   coalesce(sum(b.votos) FILTER (WHERE c.bloco = 'E'), 0)::BIGINT AS e,
                   coalesce(sum(b.votos) FILTER (WHERE c.bloco = 'C'), 0)::BIGINT AS c,
                   coalesce(sum(b.votos) FILTER (WHERE c.bloco = 'D'), 0)::BIGINT AS d,
                   sum(b.votos * c.escore) / nullif(sum(b.votos) FILTER (WHERE c.escore IS NOT NULL), 0) AS escore
            FROM bu b LEFT JOIN cls_df c ON b.partido = c.numero
            WHERE b.tv IN (1, 4) AND b.nv <> 97 AND b.cargo IN (1, 3, 6, 7, 8)
            GROUP BY ALL""").df()
        self.con.unregister("cls_df")
        for k in ("e", "c", "d"):
            blocos[k] = blocos[k] / blocos["validos"]
        blocos = blocos.merge(self.sec[CHAVE_SECAO + ["grupo", "nm_mun", "loc"]], on=CHAVE_SECAO, how="left")
        pares = [("voto_cruzado_pres_df", 1, [6]), ("voto_cruzado_gov_de", 3, [7, 8])]
        partes, unidades, so_a, a_e_b = [], 0, 0, 0
        for cat, ce, cl in pares:
            ex = blocos[blocos["cargo"] == ce]
            le = blocos[blocos["cargo"].isin(cl)]
            m = ex.merge(le, on=CHAVE_SECAO + ["grupo", "nm_mun", "loc"], suffixes=("_x", "_l"))
            m = m[(m["validos_x"] >= MIN_VOTOS_VOTO_CRUZADO) & (m["validos_l"] >= MIN_VOTOS_VOTO_CRUZADO)].copy()
            unidades += len(m)
            crit_a = ((m["e_x"] >= LIMIAR_BLOCO) & (m["d_l"] >= LIMIAR_BLOCO)) | ((m["d_x"] >= LIMIAR_BLOCO) & (m["e_l"] >= LIMIAR_BLOCO))
            m["delta"] = m["escore_x"] - m["escore_l"]
            m["z"] = z_robusto(m["delta"], m["grupo"])
            crit_b = m["z"].abs() >= LIMIAR_Z_ROBUSTO
            so_a += int(crit_a.sum())
            sig = m[crit_a & crit_b.fillna(False)].copy()
            a_e_b += len(sig)
            sig["cargo"] = ce
            obs = ("E " + (100 * sig["e_x"]).round(0).astype(int).astype(str) + "% / D " + (100 * sig["d_x"]).round(0).astype(int).astype(str)
                   + "% × E " + (100 * sig["e_l"]).round(0).astype(int).astype(str) + "% / D " + (100 * sig["d_l"]).round(0).astype(int).astype(str) + "%")
            partes.append(montar_sinais(sig, "T06", "anomalia", cat, obs.values,
                                        ("Δ=" + sig["delta"].round(2).astype(str)).values,
                                        detalhe=("z=" + sig["z"].round(1).astype(str)).values))
        tab = pd.concat(partes, ignore_index=True) if partes else pd.DataFrame(columns=COLUNAS_SINAL)
        tab = tab.reindex(tab["detalhe"].str.replace("z=", "", regex=False).astype(float).abs().sort_values(ascending=False).index) if len(tab) else tab
        return Resultado("T06", unidades=unidades, sinalizados=len(tab), brutos=so_a, tabela=tab,
                         extras={"so_a": so_a, "a_e_b": a_e_b})

    def t07_legenda(self) -> Resultado:
        sc = self.sc[self.sc["cargo"].isin([6, 7, 8]) & (self.sc["validos"] >= MIN_VOTOS_PROPORCAO)]
        u, tab = self._teste_proporcao(sc, "legenda", "validos", "T07", "legenda")
        return Resultado("T07", unidades=u, sinalizados=len(tab), tabela=tab)

    def _votos_lideres(self) -> pd.DataFrame:
        linhas = []
        for t, lst in self.lideres_pres.items():
            for r in lst[:2]:
                linhas.append({"turno": t, "uf": None, "cargo": 1, "nv": int(r["nv"])})
        for (t, uf), r in self.lideres_gov.items():
            linhas.append({"turno": t, "uf": uf, "cargo": 3, "nv": r["nv"]})
        lid = pd.DataFrame(linhas)
        if lid.empty:
            return pd.DataFrame(columns=CHAVE_SECAO + ["cargo", "nv", "x"])
        self.con.register("lid_df", lid)
        v = self.con.execute("""
            SELECT b.turno, b.uf, b.mun, b.zona, b.secao, b.cargo, b.nv, sum(b.votos)::BIGINT AS x
            FROM bu b JOIN lid_df l ON b.turno = l.turno AND b.cargo = l.cargo AND b.nv = l.nv
                                   AND (l.uf IS NULL OR b.uf = l.uf)
            WHERE b.tv = 1 GROUP BY ALL""").df()
        self.con.unregister("lid_df")
        return v

    def t08_vizinhanca(self) -> Resultado:
        if not hasattr(self, "_vl"):
            self._vl = self._votos_lideres()
        v = self._vl
        partes, unidades = [], 0
        for cargo in (1, 3):
            if cargo == 1:
                lid = pd.DataFrame([{"turno": t, "nv": int(l[0]["nv"])} for t, l in self.lideres_pres.items() if l])
                if lid.empty:
                    continue
                base = self.sc[self.sc["cargo"] == 1].merge(lid, on="turno")
            else:
                lid = pd.DataFrame([{"turno": t, "uf": uf, "nv": r["nv"]} for (t, uf), r in self.lideres_gov.items()])
                if lid.empty:
                    continue
                base = self.sc[self.sc["cargo"] == 3].merge(lid, on=["turno", "uf"])
            base = base.merge(v[v["cargo"] == cargo][CHAVE_SECAO + ["nv", "x"]], on=CHAVE_SECAO + ["nv"], how="left")
            base["x"] = base["x"].fillna(0)
            base = base[base["validos"] >= MIN_VOTOS_PROPORCAO]
            chave_local = ["turno", "uf", "mun", "zona", "loc"]
            base["n_loc"] = base.groupby(chave_local)["secao"].transform("size")
            base = base[base["n_loc"] >= MIN_SECOES_LOCAL].copy()
            if base.empty:
                continue
            base["X_loc"] = base.groupby(chave_local)["x"].transform("sum")
            base["N_loc"] = base.groupby(chave_local)["validos"].transform("sum")
            base["X_r"] = base["X_loc"] - base["x"]
            base["N_r"] = base["N_loc"] - base["validos"]
            base = base[base["N_r"] > 0].copy()
            p_sec = base["x"] / base["validos"]
            p_r = base["X_r"] / base["N_r"]
            p_pool = base["X_loc"] / base["N_loc"]
            se = np.sqrt(p_pool * (1 - p_pool) * (1 / base["validos"] + 1 / base["N_r"]))
            with np.errstate(all="ignore"):
                z0 = (p_sec - p_r) / se
            base["z0"] = z0.replace([np.inf, -np.inf], np.nan)
            phi = (base["z0"] ** 2).groupby(base["grupo"]).transform("median") / 0.4549364
            base["phi"] = phi.clip(lower=1.0).fillna(1.0)
            base["z"] = base["z0"] / np.sqrt(base["phi"])
            base["p"] = 2 * stats.norm.sf(base["z"].abs().fillna(0))
            base["dif"] = 100 * (p_sec - p_r)
            base["p_sec"], base["p_r"] = p_sec, p_r
            unidades += len(base)
            partes.append(base)
        if not partes:
            return Resultado("T08", unidades=0)
        allb = pd.concat(partes, ignore_index=True)
        allb["q"] = benjamini_hochberg(allb["p"].values)
        sig = allb[(allb["q"] < ALFA_FDR) & (allb["dif"].abs() >= LIMIAR_DIF_VIZINHANCA_PP)].sort_values("q")
        tab = montar_sinais(sig, "T08", "anomalia", "vizinhanca",
                            ((100 * sig["p_sec"]).round(1).astype(str) + "% (nº " + sig["nv"].astype(str) + ")").values,
                            ((100 * sig["p_r"]).round(1).astype(str) + "%").values, sig["p"].values, sig["q"].values,
                            ("Δ=" + sig["dif"].round(1).astype(str) + " p.p.; φ=" + sig["phi"].round(2).astype(str)).values)
        return Resultado("T08", unidades=unidades, sinalizados=len(tab), tabela=tab)

    def t09_identicos(self) -> Resultado:
        c = self.con
        # Assinatura independente da ordem (soma de hashes): leve em memória mesmo na escala nacional.
        c.execute("""
            CREATE OR REPLACE TEMP TABLE assin AS
            SELECT turno, uf, mun, zona, secao, cargo,
                   CASE WHEN cargo = 1 THEN 'BR' ELSE uf END AS escopo,
                   sum(hash(tv, nv, votos))::HUGEINT AS sig,
                   sum(votos)::BIGINT AS total, count(*) AS k
            FROM bu WHERE cargo IN (1, 3, 6, 7, 8) AND votos > 0
            GROUP BY turno, uf, mun, zona, secao, cargo""")
        filtro = f"total >= {MIN_VOTOS_IDENTICOS} AND k >= {MIN_CATEGORIAS_IDENTICOS}"
        unidades = c.execute(f"SELECT count(*) FROM assin WHERE {filtro}").fetchone()[0]
        res = Resultado("T09", unidades=int(unidades))
        cand = c.execute(f"""
            WITH e AS (SELECT * FROM assin WHERE {filtro}),
                 d AS (SELECT turno, cargo, escopo, sig FROM e GROUP BY ALL HAVING count(*) > 1)
            SELECT e.turno, e.uf, e.mun, e.zona, e.secao, e.cargo, e.escopo, e.total, e.k
            FROM e JOIN d USING (turno, cargo, escopo, sig)""").df()
        if cand.empty:
            return res
        # Vetor exato apenas para as seções candidatas; o reagrupamento pelo vetor elimina colisões de hash.
        c.register("dup_df", cand[CHAVE_SECAO + ["cargo"]])
        vet = c.execute("""
            SELECT b.turno, b.uf, b.mun, b.zona, b.secao, b.cargo,
                   string_agg(b.tv || ':' || b.nv || ':' || b.votos, ',' ORDER BY b.tv, b.nv) AS chave,
                   string_agg(CAST(b.votos AS VARCHAR), ',' ORDER BY b.tv, b.nv) AS vetor
            FROM bu b JOIN dup_df d USING (turno, uf, mun, zona, secao, cargo)
            WHERE b.votos > 0 GROUP BY ALL""").df()
        c.unregister("dup_df")
        dup = cand.merge(vet, on=CHAVE_SECAO + ["cargo"])
        dup = dup[dup.groupby(["turno", "cargo", "escopo", "chave"])["secao"].transform("size") > 1].copy()
        if dup.empty:
            return res
        tamanhos = c.execute(f"""SELECT turno, cargo, escopo, total, count(*) AS n_mesmo_total FROM assin
                                 WHERE {filtro} GROUP BY ALL""").df()
        dup = dup.merge(tamanhos, on=["turno", "cargo", "escopo", "total"], how="left")

        def prob_colisao(vetor: str, n: int) -> float:
            cnt = np.array([int(v) for v in vetor.split(",") if v], dtype=float)
            cnt = cnt[cnt > 0]
            k = cnt.size
            p = cnt / cnt.sum()
            logp = -0.5 * (k - 1) * math.log(4 * math.pi * n) - 0.5 * np.log(p).sum()
            return float(min(1.0, math.exp(logp)))

        dup["p_col"] = [prob_colisao(v, n) for v, n in zip(dup["vetor"], dup["total"])]
        dup["pares"] = dup["n_mesmo_total"] * (dup["n_mesmo_total"] - 1) / 2
        dup["E"] = dup["p_col"] * dup["pares"]
        dup["grupo_dup"] = dup.groupby(["turno", "cargo", "escopo", "chave"]).ngroup()
        dup["tam_grupo"] = dup.groupby("grupo_dup")["secao"].transform("size")
        dup["id_sec"] = (dup["uf"].astype(str) + "/" + dup["mun"].astype(str) + "/" + dup["zona"].astype(str)
                         + "/" + dup["secao"].astype(str))
        ids = dup.groupby("grupo_dup")["id_sec"].agg(list)
        dup["outras"] = [";".join(o for o in ids[gd] if o != me) for gd, me in zip(dup["grupo_dup"], dup["id_sec"])]
        dup = self._nome_mun(dup)
        res.brutos = len(dup)
        sig = dup[dup["E"] < LIMIAR_ESPERADO_IDENTICOS].sort_values(["E", "uf", "mun", "zona", "secao"])
        res.sinalizados = len(sig)
        if sig.empty:
            return res
        res.tabela = montar_sinais(sig, "T09", "anomalia", "identicos",
                                   ("n=" + sig["total"].astype("int64").astype(str) + "; K=" + sig["k"].astype("int64").astype(str)).values,
                                   ["E=" + f"{v:.2e}" for v in sig["E"]], sig["p_col"].values, np.nan,
                                   ("= " + sig["outras"].astype(str)).values)
        return res

    def t10_biometria(self) -> Resultado:
        sec = self.sec[(self.sec["comp"] >= MIN_VOTOS_PROPORCAO) & self.sec["biom"].notna()].copy()
        sec["biom"] = np.minimum(sec["biom"], sec["comp"]).astype("int64")
        sec["comp"] = sec["comp"].astype("int64")
        u, tab = self._teste_proporcao(sec, "biom", "comp", "T10", "biometria")
        tab["cargo"] = np.nan
        return Resultado("T10", unidades=u, sinalizados=len(tab), tabela=tab)

    def t11_horarios(self) -> Resultado:
        sec = self.sec.copy()
        urna = (sec["tipo_urna"] == 1) & (sec["junta"].fillna(-1) == -1) & (sec["comp"].fillna(0) > 0)
        s = sec[urna].copy()
        res = Resultado("T11", unidades=len(s))
        partes = []
        ausente = s["abertura"].isna() | s["enc"].isna()
        d = s[ausente]
        partes.append(montar_sinais(d, "T11", "anomalia", "horario_ausente", "—", cargo=np.nan))
        s = s[~ausente].copy()
        if s.empty:
            res.tabela = pd.concat(partes, ignore_index=True)
            res.sinalizados = len(res.tabela)
            return res
        # Fuso local: entre os fusos possíveis da UF, o mais próximo do 10º percentil das aberturas do
        # município (uma abertura regular nunca ocorre antes do horário oficial; atrasos não deslocam a referência).
        h_dec = s["abertura"].dt.hour + s["abertura"].dt.minute / 60.0 + s["abertura"].dt.second / 3600.0
        h_q = h_dec.groupby([s["turno"], s["uf"], s["mun"]]).transform(lambda v: v.quantile(0.10))
        s["offset"] = [min(FUSOS_UF.get(u, (0,)), key=lambda o: abs(h - HORA_INICIO_OFICIAL - o)) if pd.notna(h) else np.nan
                       for u, h in zip(s["uf"], h_q)]
        s["offset"] = s["offset"].astype(float)
        brasil = s["uf"] != "ZZ"
        dia = s.groupby("turno")["abertura"].transform(lambda v: v.dt.normalize().mode().iloc[0])
        inicio = dia + pd.to_timedelta(HORA_INICIO_OFICIAL + s["offset"], unit="h")
        fim = dia + pd.to_timedelta(HORA_FIM_OFICIAL + s["offset"], unit="h")
        tol = pd.Timedelta(minutes=TOLERANCIA_MINUTOS)
        fmt = lambda col: s[col].dt.strftime("%H:%M:%S")
        checagens = [
            ("abertura_antecipada", "anomalia", s["abertura"] < inicio - tol, fmt("abertura"), inicio.dt.strftime("%H:%M")),
            ("encerramento_antecipado", "anomalia", s["enc"] < fim - tol, fmt("enc"), fim.dt.strftime("%H:%M")),
            ("encerramento_antes_abertura", "anomalia", s["enc"] < s["abertura"], fmt("enc"), fmt("abertura")),
            ("emissao_antes_encerramento", "anomalia", s["emis"] < s["enc"] - tol, fmt("emis"), fmt("enc")),
            ("data_divergente", "anomalia", (s["abertura"].dt.normalize() != dia) | (s["enc"].dt.normalize() != dia),
             s["abertura"].dt.strftime("%Y-%m-%d"), dia.dt.strftime("%Y-%m-%d")),
            ("atraso_abertura", "informativo", s["abertura"] >= inicio + pd.Timedelta(minutes=ATRASO_ABERTURA_MIN), fmt("abertura"), inicio.dt.strftime("%H:%M")),
        ]
        emis_brt = s["emis"] - pd.to_timedelta(s["offset"], unit="h")
        checagens.append(("recebimento_antes_emissao", "anomalia", brasil & (s["receb"] < emis_brt - tol),
                          s["receb"].dt.strftime("%H:%M:%S"), emis_brt.dt.strftime("%H:%M:%S")))
        for cat, nivel, mask, obs, ref in checagens:
            mask = mask.fillna(False)
            d = s[mask]
            if len(d):
                fuso = ["hora local" if u == "ZZ" else (f"UTC{o - 3:+.0f}" if pd.notna(o) else "?")
                        for u, o in zip(s.loc[mask, "uf"], s.loc[mask, "offset"])]
                partes.append(montar_sinais(d, "T11", nivel, cat, obs[mask].values, ref[mask].values,
                                            detalhe=fuso if cat != "data_divergente" else "", cargo=np.nan))
        tab = pd.concat([p for p in partes if len(p)], ignore_index=True) if any(len(p) for p in partes) else pd.DataFrame(columns=COLUNAS_SINAL)
        res.tabela = tab
        res.sinalizados = int((tab["nivel"] == "anomalia").sum())
        res.informativos = int((tab["nivel"] == "informativo").sum())
        return res

    def t12_urnas(self) -> Resultado:
        sec = self.sec.copy()
        partes = []
        for cod in (2, 3, 4, 5):
            d = sec[(sec["tipo_urna"] == cod) | (sec["tipo_urna_min"] == cod)]
            if len(d):
                partes.append(montar_sinais(d, "T12", "anomalia", f"tipo_urna_{cod}", str(cod), cargo=np.nan))
        junta = sec[sec["junta"].fillna(-1) != -1]
        if len(junta):
            partes.append(montar_sinais(junta, "T12", "informativo", "junta_apuradora",
                                        junta["junta"].astype(str).values, cargo=np.nan))
        extras = {"cesp": bool(getattr(self, "tem_cesp", False))}
        if extras["cesp"]:
            m = self.con.execute("""
                SELECT s.turno, s.uf, s.mun, s.zona, s.secao, s.urna, s.carga, s.junta, s.tipo_urna,
                       e.urna_e, e.carga_e,
                       EXISTS (SELECT 1 FROM ccont c WHERE c.turno = s.turno AND c.uf = s.uf AND c.urna_c = s.urna) AS em_cont,
                       EXISTS (SELECT 1 FROM ccont c WHERE c.turno = s.turno AND c.uf = s.uf AND c.urna_c = s.urna AND c.carga_c = s.carga) AS em_cont_carga,
                       EXISTS (SELECT 1 FROM csec x WHERE x.turno = s.turno AND x.uf = s.uf AND x.urna_e = s.urna
                               AND NOT (x.mun = s.mun AND x.zona = s.zona AND x.secao = s.secao)) AS de_outra
                FROM sec s LEFT JOIN csec e USING (turno, uf, mun, zona, secao)
                WHERE EXISTS (SELECT 1 FROM csec k WHERE k.turno = s.turno AND k.uf = s.uf)""").df()
            m = self._nome_mun(m)
            eletr = m["junta"].fillna(-1) == -1
            regras = [
                ("sem_correspondencia", "anomalia", eletr & m["urna_e"].isna()),
                ("urna_ausente", "anomalia", eletr & m["urna_e"].notna() & m["urna"].isna()),
                ("carga_divergente", "anomalia", eletr & (m["urna"] == m["urna_e"]) & m["carga"].notna() & m["carga_e"].notna()
                 & (m["carga"] != m["carga_e"])),
                ("carga_ausente", "anomalia", eletr & (m["urna"] == m["urna_e"]) & m["carga"].isna()),
                ("contingencia_oficial", "informativo", eletr & m["urna_e"].notna() & (m["urna"] != m["urna_e"]) & m["em_cont_carga"]),
                ("contingencia_carga_divergente", "anomalia", eletr & m["urna_e"].notna() & (m["urna"] != m["urna_e"]) & m["em_cont"] & ~m["em_cont_carga"]),
                ("urna_de_outra_secao", "anomalia", eletr & m["urna_e"].notna() & (m["urna"] != m["urna_e"]) & ~m["em_cont"] & m["de_outra"]),
                ("urna_nao_prevista", "anomalia", eletr & m["urna_e"].notna() & (m["urna"] != m["urna_e"]) & ~m["em_cont"] & ~m["de_outra"]),
            ]
            for cat, nivel, mask in regras:
                mask = mask.fillna(False)
                d = m[mask]
                if len(d):
                    urna_o, urna_e = d["urna"].astype("Int64").astype(str), d["urna_e"].astype("Int64").astype(str)
                    if "carga" in cat:
                        obs = ("urna " + urna_o + "; carga " + d["carga"].fillna("—").astype(str)).values
                        ref = ("urna " + urna_e + "; carga " + d["carga_e"].fillna("—").astype(str)).values
                    else:
                        obs, ref = urna_o.values, urna_e.values
                    partes.append(montar_sinais(d, "T12", nivel, cat, obs, ref, cargo=np.nan))
            extras["regulares"] = int((eletr & (m["urna"] == m["urna_e"]) & (m["carga"] == m["carga_e"])).fillna(False).sum())
            extras["secoes_cesp"] = int(len(m))
            cob = {(int(t), u) for t, u in self.con.execute("SELECT DISTINCT turno, uf FROM csec").fetchall()}
            todos = {(int(t), u) for t, u in self.sec[["turno", "uf"]].drop_duplicates().itertuples(index=False)}
            extras["sem_cesp"] = sorted(todos - cob)
        tab = pd.concat([p for p in partes if len(p)], ignore_index=True) if any(len(p) for p in partes) else pd.DataFrame(columns=COLUNAS_SINAL)
        return Resultado("T12", unidades=len(sec), sinalizados=int((tab["nivel"] == "anomalia").sum()) if len(tab) else 0,
                         informativos=int((tab["nivel"] == "informativo").sum()) if len(tab) else 0, tabela=tab, extras=extras)

    # --- dígitos -----------------------------------------------------------
    @staticmethod
    def _benford_2():
        return np.array([sum(math.log10(1 + 1 / (10 * k + d)) for k in range(1, 10)) for d in range(10)])

    @staticmethod
    def _segundo_digito(v: np.ndarray) -> np.ndarray:
        v = v.astype(np.int64)
        return np.where(v < 100, v % 10, np.where(v < 1000, (v // 10) % 10,
                        np.where(v < 10000, (v // 100) % 10, (v // 1000) % 10)))

    def _simular_digitos(self) -> pd.DataFrame:
        """Para cada candidato × UF (Presidente, Governador, Senador), compara a distribuição observada
        do 2º e do último dígito (contagens ≥ 10) com a distribuição simulada (Monte Carlo, semente fixa)
        sob modelo beta-binomial ajustado à votação do candidato em cada local de votação."""
        if hasattr(self, "_dig"):
            return self._dig
        linhas, excluidas = [], 0
        base_all = self.sc[self.sc["cargo"].isin([1, 3, 5]) & (self.sc["validos"] > 0)]
        nomes = self.cand.groupby(["turno", "uf", "cargo", "nv"])["nome"].first()
        for (turno, uf), sc_uf in base_all.groupby(["turno", "uf"], sort=True):
            votos = self.con.execute("""
                SELECT mun, zona, secao, cargo, nv, sum(votos)::BIGINT AS x FROM bu
                WHERE turno = ? AND uf = ? AND tv = 1 AND nv <> 97 AND cargo IN (1, 3, 5)
                GROUP BY ALL""", [int(turno), uf]).df()
            for cargo, base in sc_uf.groupby("cargo"):
                base = base[["mun", "zona", "secao", "loc", "validos", "grupo"]].sort_values(["mun", "zona", "secao"]).reset_index(drop=True)
                n = base["validos"].to_numpy(dtype=float)
                # Grupo do modelo: local de votação (≥ MIN_SECOES_LOCAL_DIGITOS seções); senão, grupo de referência.
                chave_loc = base["mun"].astype(str) + "|" + base["zona"].astype(str) + "|" + base["loc"].astype(str)
                tam_loc = chave_loc.map(chave_loc.value_counts())
                g = np.where(tam_loc >= MIN_SECOES_LOCAL_DIGITOS, "L|" + chave_loc, base["grupo"].astype(str)).astype(str)
                chave = pd.MultiIndex.from_frame(base[["mun", "zona", "secao"]])
                for nv, vv in votos[votos["cargo"] == cargo].groupby("nv"):
                    x = (pd.Series(vv["x"].to_numpy(dtype=float), index=pd.MultiIndex.from_frame(vv[["mun", "zona", "secao"]]))
                         .reindex(chave).fillna(0.0).to_numpy())
                    obs = x[x >= 10].astype(np.int64)
                    if obs.size < MIN_CONTAGENS_DIGITOS:
                        continue
                    if np.median(obs) < MIN_MEDIANA_DIGITOS:
                        excluidas += 1  # contagens pequenas e assimétricas: sem referência confiável
                        continue
                    # Gerador próprio por série: resultado independente da ordem de processamento.
                    rng = np.random.default_rng([SEMENTE_SIMULACAO, int(turno), UFS_BRASIL.index(uf) if uf in UFS_BRASIL else 99,
                                                 int(cargo), int(nv)])
                    aux = pd.DataFrame({"g": g, "n": n, "x": x, "q": x * x / n, "n2": n * n})
                    agg = aux.groupby("g").agg(N=("n", "sum"), X=("x", "sum"), Q=("q", "sum"), S2=("n2", "sum"), G=("n", "size"))
                    a, b, _, _ = parametros_betabinomial(agg["N"], agg["X"], agg["Q"], agg["S2"], agg["G"])
                    ia = pd.Series(a, index=agg.index).reindex(g).to_numpy()
                    ib = pd.Series(b, index=agg.index).reindex(g).to_numpy()
                    p = rng.beta(ia, ib, size=(REPLICAS_DIGITOS, n.size))
                    sim = rng.binomial(n.astype(np.int64), p)
                    sim = sim[sim >= 10]
                    linhas.append({
                        "turno": int(turno), "uf": uf, "cargo": int(cargo), "nv": int(nv),
                        "nome": nomes.get((turno, uf, cargo, nv), ""),
                        "o2": np.bincount(self._segundo_digito(obs), minlength=10)[:10],
                        "s2": np.bincount(self._segundo_digito(sim), minlength=10)[:10] if sim.size else np.zeros(10),
                        "ou": np.bincount(obs % 10, minlength=10)[:10],
                        "su": np.bincount(sim % 10, minlength=10)[:10] if sim.size else np.zeros(10),
                    })
        self._dig = pd.DataFrame(linhas)
        self.meta["series_digitos_excluidas"] = excluidas
        return self._dig

    def _teste_digitos(self, tid: str, cargos: tuple, chave_o: str, chave_s: str, categoria: str, com_media: bool):
        dig = self._simular_digitos()
        res = Resultado(tid)
        if dig.empty:
            return res, pd.DataFrame()
        d = dig[dig["cargo"].isin(cargos)].reset_index(drop=True)
        if d.empty:
            return res, pd.DataFrame()
        O = np.vstack(d[chave_o].to_numpy()).astype(float)
        S = np.vstack(d[chave_s].to_numpy()).astype(float)
        P = (S + 0.5) / (S.sum(axis=1, keepdims=True) + 5.0)
        N = O.sum(axis=1, keepdims=True)
        E = N * P
        registros = d[["turno", "uf", "cargo", "nv", "nome"]].copy()
        # Agregado de todas as UFs (Presidente): soma de observados e esperados por UF
        pres = registros.index[(registros["cargo"] == 1)]
        if len(pres) and registros.loc[pres, "uf"].nunique() > 1:
            extra_reg, extra_O, extra_E = [], [], []
            for (t, nv), idx in registros.loc[pres].groupby(["turno", "nv"]).groups.items():
                extra_reg.append({"turno": t, "uf": "BR", "cargo": 1, "nv": nv, "nome": registros.loc[idx[0], "nome"]})
                extra_O.append(O[idx].sum(axis=0))
                extra_E.append(E[idx].sum(axis=0))
            registros = pd.concat([registros, pd.DataFrame(extra_reg)], ignore_index=True)
            O = np.vstack([O, np.array(extra_O)])
            E = np.vstack([E, np.array(extra_E)])
            N = O.sum(axis=1, keepdims=True)
        correcao = 1.0 + 1.0 / REPLICAS_DIGITOS  # incerteza de Monte Carlo da referência
        chi2 = ((O - E) ** 2 / E).sum(axis=1) / correcao
        out = registros.copy()
        out["n"] = N.ravel().astype(int)
        out["chi2"] = chi2
        out["p"] = stats.chi2.sf(chi2, 9)
        if com_media:
            dg = np.arange(10)
            Pm = E / E.sum(axis=1, keepdims=True)
            mu = (Pm * dg).sum(axis=1)
            sd = np.sqrt((Pm * (dg - mu[:, None]) ** 2).sum(axis=1))
            out["media"] = (O * dg).sum(axis=1) / N.ravel()
            out["media_modelo"] = mu
            out["z_media"] = (out["media"] - mu) / (sd / np.sqrt(N.ravel()))
            out["media_benford"] = float((self._benford_2() * dg).sum())
        out["q"] = benjamini_hochberg(out["p"].to_numpy())
        out["sinal"] = out["q"] < ALFA_FDR
        sig = out[out["sinal"]].sort_values("q")
        tab = pd.DataFrame({
            "teste": tid, "nivel": "anomalia", "categoria": categoria, "turno": sig["turno"].values,
            "uf": sig["uf"].values, "mun": np.nan, "nm_mun": "", "zona": np.nan, "secao": np.nan, "loc": np.nan,
            "cargo": sig["cargo"].values,
            "observado": (sig["media"].round(3).astype(str).values if com_media else ("χ²=" + sig["chi2"].round(1).astype(str)).values),
            "referencia": (sig["media_modelo"].round(3).astype(str).values if com_media else "modelo"),
            "p": sig["p"].values, "q": sig["q"].values,
            "detalhe": (sig["nome"].astype(str) + " (nº " + sig["nv"].astype(str) + "); n=" + sig["n"].astype(str)).values})
        res = Resultado(tid, unidades=len(out), sinalizados=len(tab), tabela=tab[COLUNAS_SINAL])
        return res, out

    def t13_mebane(self) -> Resultado:
        res, out = self._teste_digitos("T13", (1, 3), "o2", "s2", "segundo_digito", com_media=True)
        res.extras["tabela"] = out
        return res

    def t14_ultimo(self) -> Resultado:
        res, out = self._teste_digitos("T14", (1, 3, 5), "ou", "su", "ultimo_digito", com_media=False)
        res.extras["tabela"] = out
        return res

    def t15_klimek(self) -> Resultado:
        if not hasattr(self, "_vl"):
            self._vl = self._votos_lideres()
        v = self._vl[self._vl["cargo"] == 1]
        base = self.sc[self.sc["cargo"] == 1][CHAVE_SECAO + ["validos", "grupo"]].merge(
            self.sec[CHAVE_SECAO + ["aptos", "comp"]], on=CHAVE_SECAO)
        base = base[(base["aptos"] > 0) & (base["validos"] > 0)]
        linhas, figs = [], []
        for t, lideres in self.lideres_pres.items():
            for lid in lideres[:2]:
                d = base[base["turno"] == t].merge(v[(v["turno"] == t) & (v["nv"] == lid["nv"])][CHAVE_SECAO + ["x"]],
                                                   on=CHAVE_SECAO, how="left")
                d["x"] = d["x"].fillna(0)
                d["t"] = (d["comp"] / d["aptos"]).clip(0, 1)
                d["s"] = (d["x"] / d["validos"]).clip(0, 1)
                d["ct"] = (d["t"] >= KLIMEK_CANTO).astype(float)
                d["cs"] = (d["s"] >= KLIMEK_CANTO).astype(float)
                # Esperado sob independência DENTRO de cada grupo de referência (estratificado),
                # o que neutraliza a mistura de regiões com perfis distintos (paradoxo de Simpson).
                gr = d.groupby("grupo").agg(n=("t", "size"), pt=("ct", "mean"), ps=("cs", "mean"))
                d["esp_g"] = (gr["pt"] * gr["ps"]).reindex(d["grupo"]).to_numpy()
                domestico = d[d["uf"] != "ZZ"]
                escopos = ([("BR", domestico)] if domestico["uf"].nunique() > 1 else []) + [(uf, g) for uf, g in d.groupby("uf")]
                for esc, g in escopos:
                    if len(g) < 30:
                        continue
                    w = g["aptos"].astype(float)
                    mt, ms = np.average(g["t"], weights=w), np.average(g["s"], weights=w)
                    cov = np.average((g["t"] - mt) * (g["s"] - ms), weights=w)
                    vt, vs = np.average((g["t"] - mt) ** 2, weights=w), np.average((g["s"] - ms) ** 2, weights=w)
                    corr = cov / math.sqrt(vt * vs) if vt > 0 and vs > 0 else np.nan
                    obs = int(((g["ct"] > 0) & (g["cs"] > 0)).sum())
                    esp = float(g["esp_g"].sum())
                    razao = obs / esp if esp > 0 else (np.inf if obs > 0 else np.nan)
                    marca = bool(obs >= KLIMEK_MIN_CANTO and razao >= KLIMEK_RAZAO)
                    linhas.append({"turno": t, "uf": esc, "nv": lid["nv"], "nome": lid["nome"], "secoes": len(g),
                                   "corr": corr, "canto_obs": obs, "canto_esp": esp, "razao": razao, "inspecao": marca})
                if plt is not None:
                    figs.append(self._grafico_klimek(domestico if len(domestico) else d, t, lid))
                    figs.append(self._grafico_klimek_ufs(d, t, lid))
        out = pd.DataFrame(linhas)
        if out.empty:
            return Resultado("T15")
        sig = out[out["inspecao"]]
        tab = pd.DataFrame({"teste": "T15", "nivel": "informativo", "categoria": "klimek", "turno": sig["turno"].values,
                            "uf": sig["uf"].values, "mun": np.nan, "nm_mun": "", "zona": np.nan, "secao": np.nan, "loc": np.nan,
                            "cargo": 1, "observado": sig["canto_obs"].values, "referencia": sig["canto_esp"].round(2).values,
                            "p": np.nan, "q": np.nan,
                            "detalhe": (sig["nome"].astype(str) + " (nº " + sig["nv"].astype(str) + "); r=" + sig["corr"].round(3).astype(str)).values})
        return Resultado("T15", unidades=len(out), informativos=len(tab), tabela=tab[COLUNAS_SINAL],
                         extras={"tabela": out, "figuras": [f for f in figs if f]})

    def _grafico_klimek(self, d: pd.DataFrame, turno: int, lid: dict):
        try:
            nome = f"klimek_{turno}t_{lid['nv']}_brasil.png"
            fig, ax = plt.subplots(figsize=(7, 6), dpi=150)
            h = ax.hist2d(100 * d["t"], 100 * d["s"], bins=100, range=[[0, 100], [0, 100]], cmap="viridis", cmin=1,
                          norm=matplotlib.colors.LogNorm())
            fig.colorbar(h[3], ax=ax, label="Seções / Sections / Secciones")
            ax.set_xlabel("Comparecimento / Turnout / Comparecencia (%)")
            ax.set_ylabel("Votação do candidato / Vote share / Votación (%)")
            ufs = sorted(d["uf"].unique())
            escopo = "Brasil (sem Exterior)" if len(ufs) > 1 else ufs[0]
            ax.set_title(f"{lid['nome']} ({lid['nv']}) — {turno}º turno — {escopo}\n{len(d):,} seções".replace(",", "."), fontsize=10)
            fig.tight_layout()
            fig.savefig(self.pasta_graf / nome, metadata={"Software": None})
            plt.close(fig)
            return nome
        except Exception as exc:  # pragma: no cover
            log(f"  Gráfico não gerado: {exc}")
            return None

    def _grafico_klimek_ufs(self, d: pd.DataFrame, turno: int, lid: dict):
        try:
            ufs = sorted(d["uf"].unique())
            if len(ufs) < 2:
                return None
            nome = f"klimek_{turno}t_{lid['nv']}_por_uf.png"
            cols = min(7, len(ufs))
            rows = math.ceil(len(ufs) / cols)
            fig, axes = plt.subplots(rows, cols, figsize=(2.4 * cols, 2.4 * rows), dpi=130, squeeze=False)
            for ax in axes.ravel():
                ax.set_visible(False)
            for ax, uf in zip(axes.ravel(), ufs):
                g = d[d["uf"] == uf]
                ax.set_visible(True)
                ax.hist2d(100 * g["t"], 100 * g["s"], bins=50, range=[[0, 100], [0, 100]], cmap="viridis", cmin=1,
                          norm=matplotlib.colors.LogNorm())
                ax.set_title(uf, fontsize=9)
                ax.tick_params(labelsize=6)
            fig.suptitle(f"{lid['nome']} ({lid['nv']}) — {turno}º turno — x: comparecimento/turnout (%), y: votação/vote share (%)", fontsize=9)
            fig.tight_layout()
            fig.savefig(self.pasta_graf / nome, metadata={"Software": None})
            plt.close(fig)
            return nome
        except Exception as exc:  # pragma: no cover
            log(f"  Gráfico por UF não gerado: {exc}")
            return None

    # ===================================================================
    # EXECUÇÃO
    # ===================================================================
    def executar_testes(self):
        funcoes = {"T01": self.t01_fechamento, "T02": self.t02_totais, "T03": self.t03_unanimidade,
                   "T04": self.t04_abstencao, "T05": self.t05_brancos_nulos, "T06": self.t06_voto_cruzado,
                   "T07": self.t07_legenda, "T08": self.t08_vizinhanca, "T09": self.t09_identicos,
                   "T10": self.t10_biometria, "T11": self.t11_horarios, "T12": self.t12_urnas,
                   "T13": self.t13_mebane, "T14": self.t14_ultimo, "T15": self.t15_klimek}
        for tid in ORDEM_TESTES:
            t = time.time()
            log(f"Teste {tid[1:]} — {TESTES[tid]['PT']['nome']}...")
            try:
                r = funcoes[tid]()
            except Exception as exc:
                r = Resultado(tid, erro=f"{type(exc).__name__}: {exc}")
                log(f"  FALHA: {r.erro}")
                _LOG.append(traceback.format_exc())
            r.segundos = time.time() - t
            if r.tabela is not None and len(r.tabela):
                r.tabela = ordenar_sinais(r.tabela.reindex(columns=COLUNAS_SINAL))
            self.resultados[tid] = r
            if not r.erro:
                log(f"  unidades={r.unidades:,} sinalizações={r.sinalizados:,} informativos={r.informativos:,} ({r.segundos:.0f}s)".replace(",", "."))

    def consolidar(self):
        tabs = [self.resultados[t].tabela.reindex(columns=COLUNAS_SINAL) for t in ORDEM_TESTES
                if self.resultados[t].tabela is not None and len(self.resultados[t].tabela)]
        sinais = pd.concat(tabs, ignore_index=True) if tabs else pd.DataFrame(columns=COLUNAS_SINAL)
        for c in ("turno", "mun", "zona", "secao", "loc", "cargo"):
            sinais[c] = pd.to_numeric(sinais[c], errors="coerce").round().astype("Int64")
        # Identificação completa da urna (para o cidadão conferir a própria seção)
        self.ident = self.sec[CHAVE_SECAO + list(IDENT_SECAO)].rename(columns=IDENT_SECAO)
        for c in ("turno", "mun", "zona", "secao"):
            self.ident[c] = self.ident[c].astype("Int64")
        for c in ("nr_urna", "tipo_urna", "junta", "aptos", "comparecimento", "n_urnas"):
            self.ident[c] = pd.to_numeric(self.ident[c], errors="coerce").astype("Int64")
        self.sinais = sinais.merge(self.ident, on=CHAVE_SECAO, how="left")
        por_secao = self.sinais[(self.sinais["nivel"] == "anomalia") & (~self.sinais["teste"].isin(TESTES_AGREGADOS))].copy()
        for c in ("turno", "mun", "zona", "secao"):
            por_secao[c] = pd.to_numeric(por_secao[c], errors="coerce").round().astype("Int64")
        # Convergência por FAMÍLIA de testes: testes mecanicamente acoplados contam uma única vez.
        por_secao["familia"] = por_secao["teste"].map(lambda t: FAMILIAS_TESTES.get(t, t))
        conv = (por_secao.groupby(CHAVE_SECAO).agg(testes=("teste", lambda s: ",".join(sorted(set(s)))),
                                                  n_testes=("familia", "nunique"), nm_mun=("nm_mun", "first"))
                .reset_index())
        conv = conv.merge(self.ident[CHAVE_SECAO + ["secoes_agregadas", "nr_urna", "cod_carga"]], on=CHAVE_SECAO, how="left")
        conv = conv.merge(self.sec[CHAVE_SECAO + ["loc"]].astype({c: "Int64" for c in ("turno", "mun", "zona", "secao")}),
                          on=CHAVE_SECAO, how="left")
        self.secoes_sinalizadas = conv
        self.convergentes = conv[conv["n_testes"] >= 2].sort_values(["n_testes", "turno", "uf", "mun", "zona", "secao"],
                                                                   ascending=[False, True, True, True, True, True])
        por_uf = conv.groupby(["turno", "uf"]).size().rename("sinalizadas")
        tot_uf = self.sec.assign(turno=self.sec["turno"].astype("Int64")).groupby(["turno", "uf"]).size().rename("secoes")
        self.por_uf = pd.concat([tot_uf, por_uf], axis=1).fillna(0).astype(int).reset_index()

    # ------------------------------------------------------- exportação
    def exportar(self):
        log("Exportando tabelas de resultados...")
        enc = "utf-8-sig"
        cols = ["teste", "nivel", "categoria", "turno", "uf", "mun", "nm_mun", "zona", "secao", "secoes_agregadas", "loc",
                "nr_urna", "cod_carga", "tipo_urna", "n_urnas", "junta", "aptos", "comparecimento", "abertura", "encerramento",
                "cargo", "observado", "referencia", "p", "q", "detalhe"]
        s = self.sinais[cols].copy()
        for c in ("abertura", "encerramento"):
            s[c] = pd.to_datetime(s[c], errors="coerce").dt.strftime("%d/%m/%Y %H:%M:%S")
        for c in ("p", "q"):
            s[c] = [sig_n(v) for v in s[c]]
        s.insert(1, "teste_nome", s["teste"].map(lambda t: TESTES[t]["PT"]["nome"]))
        s.insert(s.columns.get_loc("cargo") + 1, "cargo_nome", s["cargo"].map(lambda c: self._cargo(c, "PT")))
        s.to_csv(self.pasta_csv / "secoes_sinalizadas.csv", index=False, encoding=enc, float_format="%.6g")
        self.convergentes.to_csv(self.pasta_csv / "secoes_convergentes.csv", index=False, encoding=enc)
        # Índice de busca para o site: uma entrada por seção, com todos os testes em que ela aparece.
        busca = []
        loc_s = s[~s["teste"].isin(TESTES_AGREGADOS) & s["secao"].notna()]
        for k, g in loc_s.groupby(CHAVE_SECAO, sort=True):
            r0 = g.iloc[0]
            busca.append({
                "turno": canon(r0["turno"]), "uf": r0["uf"], "cod_municipio": canon(r0["mun"]), "municipio": canon(r0["nm_mun"]),
                "zona": canon(r0["zona"]), "secao": canon(r0["secao"]), "secoes_agregadas": canon(r0["secoes_agregadas"]),
                "local_votacao": canon(r0["loc"]), "nr_urna": canon(r0["nr_urna"]), "cod_carga": canon(r0["cod_carga"]),
                "anomalias": int((g["nivel"] == "anomalia").sum()), "informativos": int((g["nivel"] != "anomalia").sum()),
                "ocorrencias": [{"teste": x["teste"], "teste_nome": x["teste_nome"], "nivel": x["nivel"], "categoria": x["categoria"],
                                 "cargo": canon(x["cargo_nome"]), "observado": canon(x["observado"]), "referencia": canon(x["referencia"]),
                                 "p": canon(x["p"]), "q": canon(x["q"]), "detalhe": canon(x["detalhe"])} for x in g.to_dict("records")]})
        (self.pasta_csv / "busca_urnas.json").write_text(json.dumps(busca, ensure_ascii=False, indent=1), encoding="utf-8")
        pc = self.resultados["T03"].extras.get("por_candidato")
        if isinstance(pc, pd.DataFrame):
            pc.to_csv(self.pasta_csv / "unanimidade_por_candidato.csv", index=False, encoding=enc)
        resumo = []
        for tid in ORDEM_TESTES:
            r = self.resultados.get(tid)
            resumo.append({"teste": tid, "nome": TESTES[tid]["PT"]["nome"], "unidades": r.unidades, "sinalizacoes": r.sinalizados,
                           "informativos": r.informativos, "brutos": r.brutos, "erro": r.erro or ""})
        pd.DataFrame(resumo).to_csv(self.pasta_csv / "resumo_testes.csv", index=False, encoding=enc)
        pd.DataFrame(self.integridade).to_csv(self.pasta_csv / "integridade_arquivos.csv", index=False, encoding=enc)
        classificacao_efetiva().to_csv(self.pasta_csv / "classificacao_partidaria.csv", index=False, encoding=enc)
        for tid, nome in (("T13", "digitos_segundo_mebane.csv"), ("T14", "digitos_ultimo_beber_scacco.csv"), ("T15", "klimek_indicadores.csv")):
            t = self.resultados.get(tid)
            if t and "tabela" in t.extras and isinstance(t.extras["tabela"], pd.DataFrame):
                tb = t.extras["tabela"]
                tb.sort_values([c for c in ("turno", "uf", "cargo", "nv") if c in tb.columns], kind="mergesort").to_csv(
                    self.pasta_csv / nome, index=False, encoding=enc, float_format="%.6g")
        self.por_uf.to_csv(self.pasta_csv / "sinalizacoes_por_uf.csv", index=False, encoding=enc)

    # ------------------------------------------------------- determinismo
    def montar_nucleo(self) -> dict:
        """Núcleo analítico: SOMENTE resultados (sem data, hora ou duração). É o objeto cujo SHA-256 é comparado."""
        analises = {}
        for tid in ORDEM_TESTES:
            r = self.resultados[tid]
            urnas = {}
            tab = self.sinais[self.sinais["teste"] == tid]
            campos = ["observado", "referencia", "p", "q", "detalhe", "nm_mun", "loc"] + COLUNAS_IDENT
            for rec in tab.to_dict("records"):
                k = "|".join(str(canon(rec.get(c))) for c in ("nivel", "categoria", "turno", "uf", "mun", "zona", "secao", "cargo"))
                base, n = k, 2
                while k in urnas:
                    k, n = f"{base}#{n}", n + 1
                urnas[k] = {c: canon(rec.get(c)) for c in campos}
            analises[tid] = {"nome": TESTES[tid]["PT"]["nome"], "unidades": canon(r.unidades), "sinalizados": canon(r.sinalizados),
                             "informativos": canon(r.informativos), "brutos": canon(r.brutos), "erro": r.erro,
                             "extras": canon(r.extras), "urnas": urnas}
        return {
            "versao_motor": VERSAO_MOTOR,
            "parametros": self.parametros_nucleo(),
            "entrada": {"arquivos": [{"arquivo": i["arquivo"], "sha512": i["sha512"], "status": i["status"]} for i in self.integridade],
                        "excluidos": canon(self.meta.get("excluidos", [])), "linhas": canon(self.meta.get("linhas")),
                        "secoes": canon(self.meta["secoes"]), "secoes_distintas": canon(self.meta["secoes_distintas"]),
                        "boletins": canon(self.meta["boletins"]), "turnos": canon(self.meta["turnos"]), "ufs": canon(self.meta["ufs"])},
            "analises": analises,
            "consolidacao": {"secoes_sinalizadas": len(self.secoes_sinalizadas),
                             "convergentes": canon_df(self.convergentes[CHAVE_SECAO + ["testes", "n_testes"]]),
                             "por_uf": canon_df(self.por_uf)},
        }

    @staticmethod
    def parametros_nucleo() -> dict:
        nomes = ["ALFA_FDR", "MIN_SECOES_GRUPO", "RHO_MIN", "RHO_MAX", "MIN_VOTOS_UNANIMIDADE", "MIN_APTOS_ABSTENCAO",
                 "MIN_VOTOS_PROPORCAO", "LIMIAR_BLOCO", "LIMIAR_Z_ROBUSTO", "MIN_VOTOS_VOTO_CRUZADO", "MIN_SECOES_LOCAL",
                 "LIMIAR_DIF_VIZINHANCA_PP", "MIN_VOTOS_IDENTICOS", "MIN_CATEGORIAS_IDENTICOS", "LIMIAR_ESPERADO_IDENTICOS",
                 "HORA_INICIO_OFICIAL", "HORA_FIM_OFICIAL", "TOLERANCIA_MINUTOS", "ATRASO_ABERTURA_MIN", "MIN_CONTAGENS_DIGITOS",
                 "KLIMEK_CANTO", "KLIMEK_MIN_CANTO", "KLIMEK_RAZAO", "MIN_MEDIANA_DIGITOS", "REPLICAS_DIGITOS",
                 "SEMENTE_SIMULACAO", "MIN_SECOES_LOCAL_DIGITOS", "DIGITOS_NUCLEO"]
        g = globals()
        return {n: canon(g[n]) for n in nomes if n in g}

    def verificar_determinismo(self):
        """Compara o SHA-256 do núcleo analítico com o registro de homologação (baseline) dos MESMOS dados de entrada."""
        (self.saida / "determinismo_divergencias.json").unlink(missing_ok=True)  # resíduo de execução anterior
        nucleo = self.montar_nucleo()
        txt = json_canonico(nucleo)
        h = sha256_texto(txt)
        (self.pasta_csv / "nucleo_analitico.json").write_text(txt, encoding="utf-8")
        # Impressão digital da entrada: arquivos (SHA-512), parâmetros e versão do motor. Dados diferentes → registro próprio.
        impressao = sha256_texto(json_canonico({"v": VERSAO_MOTOR, "p": nucleo["parametros"], "a": nucleo["entrada"]["arquivos"]}))[:16]
        raiz = Path(self.args.baseline).resolve() if self.args.baseline else self.saida / PASTA_DETERMINISMO
        pasta = raiz / impressao
        arq_payload, arq_hash = pasta / "baseline_payload.json", pasta / "baseline.hash"
        det = {"hash": h, "impressao": impressao, "pasta": str(pasta), "divergencias": []}
        barra = "=" * 100
        if not (arq_payload.exists() and arq_hash.exists()):
            pasta.mkdir(parents=True, exist_ok=True)
            ocultar_no_windows(raiz)
            arq_payload.write_text(txt, encoding="utf-8")
            arq_hash.write_text(h + "\n", encoding="utf-8")
            det.update(status="baseline", hash_baseline=h)
            log(barra)
            log("[REGISTRO DE HOMOLOGAÇÃO] Primeira execução com estes dados de entrada: o núcleo analítico foi registrado.")
            log(f"  SHA-256 do núcleo analítico: {h}")
            log(f"  Registro: {pasta}")
            log("  As próximas execuções com os mesmos arquivos serão comparadas a este registro.")
            log(barra)
        else:
            h_base = arq_hash.read_text(encoding="utf-8").strip()
            base_txt = arq_payload.read_text(encoding="utf-8")
            det["hash_baseline"] = h_base
            if sha256_texto(base_txt) != h_base:
                det["status"] = "baseline_corrompido"
                log(barra)
                log("[ALERTA CRÍTICO] O registro de homologação foi alterado: baseline_payload.json não corresponde a baseline.hash.")
                log(f"  Apague a pasta {pasta} para registrar um novo baseline.")
                log(barra)
            elif h == h_base:
                det["status"] = "identico"
                log(barra)
                log("[SUCESSO] VERIFICAÇÃO DE DETERMINISMO: O motor analítico produziu resultados 100% IDÊNTICOS ao relatório de "
                    "homologação (Ignorando metadados temporais). As 15 análises foram validadas pelo Hash SHA-256.")
                log(f"  SHA-256 do núcleo analítico: {h}")
                log(barra)
            else:
                det["status"] = "divergente"
                difs = diff_profundo(json.loads(base_txt), json.loads(txt))
                for caminho, antigo, novo in difs:
                    if caminho and caminho[0] == "analises" and len(caminho) > 1 and caminho[1] in TESTES:
                        nome = f"{caminho[1]} — {TESTES[caminho[1]]['PT']['nome']}"
                        resto = " › ".join(caminho[2:])
                    else:
                        nome, resto = (caminho[0] if caminho else "núcleo"), " › ".join(caminho[1:])
                    det["divergencias"].append({"analise": nome, "campo": resto, "baseline": antigo, "atual": novo})
                (self.saida / "determinismo_divergencias.json").write_text(
                    json.dumps(det["divergencias"], ensure_ascii=False, indent=1), encoding="utf-8")
                log(barra)
                log("[ALERTA CRÍTICO] Falha de Determinismo: O resultado puro da varredura de votos apresentou divergências.")
                log("[RASTREAMENTO DA INCONSISTÊNCIA ENCONTRADA]:")
                corta = lambda v: (json_canonico(v) if not isinstance(v, str) else v)[:300]
                for d in det["divergencias"][:30]:
                    log(f"- Análise divergente: {d['analise']}" + (f" › {d['campo']}" if d["campo"] else ""))
                    log(f"- Valor no Baseline (Teste): {corta(d['baseline'])}")
                    log(f"- Valor na Execução Atual (Live): {corta(d['atual'])}")
                if len(det["divergencias"]) > 30:
                    log(f"  ... mais {len(det['divergencias']) - 30} divergência(s) em determinismo_divergencias.json")
                log(f"  SHA-256 baseline: {h_base}")
                log(f"  SHA-256 atual:    {h}")
                log(barra)
        self.det = det

    # ------------------------------------------------------- relatório
    def gerar_relatorios(self):
        self.fim = datetime.now(TZ_BRT)
        self.duracao = time.time() - self.t0
        self.hashes_saida = {}
        for p in sorted(self.pasta_csv.glob("*.csv")) + sorted(self.pasta_csv.glob("*.json")) + sorted(self.pasta_graf.glob("*.png")):
            self.hashes_saida[p.relative_to(self.saida).as_posix()] = sha512_arquivo(p)
        for lang in IDIOMAS:
            caminho = self.saida / f"{PREFIXO_RELATORIO}_{lang}.md"
            caminho.write_text(self.relatorio(lang), encoding="utf-8")
            log(f"Relatório gerado: {caminho.name}")

    def _cargo(self, c, lang):
        try:
            return NOMES_CARGOS[int(c)][lang]
        except (ValueError, TypeError, KeyError):
            return "—"

    def relatorio(self, lang: str) -> str:
        L = TXT[lang]
        P = []
        turnos = ", ".join(L["turno"].format(n=t) for t in self.meta["turnos"])
        alfa = fnum(ALFA_FDR, lang, 2)
        P.append(f"# {L['titulo']}\n")
        P.append(f"**{L['subtitulo'].format(ano=ANO_ELEICAO, turnos=turnos)}**\n")
        P.append(md_tabela(["", ""], [
            [L["id_doc"], f"`{self.meta['hash_manifesto'][:32]}`"],
            [L["data_doc"], self.fim.strftime("%d/%m/%Y" if lang != "EN" else "%Y-%m-%d")],
            [L["versao"], VERSAO_MOTOR],
            [L["hash_nucleo"], f"`{self.det['hash']}`"],
        ]))
        P.append("")
        P.append(self._bloco_determinismo(lang))
        P.append(L["legenda"] + "\n")
        # 1
        P.append(f"## {L['s1']}\n")
        for par in L["s1_txt"]:
            P.append(par.format(alfa=alfa) + "\n")
        # 2
        P.append(f"## {L['s2']}\n")
        P.append(md_tabela(["", ""], [
            [L["autor"], AUTOR["nome"]],
            [L["especialidade"], AUTOR["especialidade"][lang]],
            [L["local"], AUTOR["local"][lang]],
            [L["instagram"], AUTOR["instagram"]],
        ]))
        P.append("")
        # 3
        P.append(f"## {L['s3']}\n")
        n_ok = sum(1 for i in self.integridade if i["status"] == "st_confere")
        n_div = sum(1 for i in self.integridade if i["status"] == "st_diverge")
        n_nv = len(self.integridade) - n_ok - n_div
        P.append(L["s3_intro"].format(linhas=fnum(self.meta["linhas"], lang), arquivos=len(self.arquivos_bu),
                                      ufs=len(self.meta["ufs"]), secoes=fnum(self.meta["secoes"], lang),
                                      distintas=fnum(self.meta["secoes_distintas"], lang), turnos=turnos,
                                      boletins=fnum(self.meta["boletins"], lang), ntestes=len(ORDEM_TESTES)) + "\n")
        P.append(L["s3_integridade"].format(ok=n_ok, total=len(self.integridade), div=n_div, nv=n_nv) + "\n")
        if n_div:
            P.append(L["aviso_divergencia"] + "\n")
        n_sec = len(self.secoes_sinalizadas)
        P.append(L["s3_secoes"].format(n=fnum(n_sec, lang), pct=fpct(n_sec / max(self.meta["secoes"], 1), lang),
                                       conv=fnum(len(self.convergentes), lang)) + "\n")
        P.append(f"**{L['s3_tabela']}**\n")
        linhas = []
        for tid in ORDEM_TESTES:
            r = self.resultados[tid]
            nome = f"{self._status(r)} {int(tid[1:])}. {TESTES[tid][lang]['nome']}"
            if r.erro:
                linhas.append([nome, "—", L["falha"], "—", "—", "—"])
                continue
            taxa = fpct(r.sinalizados / r.unidades, lang, 3) if r.unidades else "—"
            linhas.append([nome, fnum(r.unidades, lang), fnum(r.sinalizados, lang), fnum(r.informativos, lang),
                           fnum(r.brutos, lang) if r.brutos is not None else "—", taxa])
        P.append(md_tabela([L["col_teste"], L["col_unidades"], L["col_sinal"], L["col_info"], L["col_bruto"], L["col_taxa"]],
                           linhas, {1, 2, 3, 4, 5}))
        P.append("")
        P.append(f"### {L['busca_titulo']}\n")
        for par in L["busca_txt"]:
            P.append(par + "\n")
        # 4
        P.append(f"## {L['s4']}\n")
        P.append(L["s4_txt"].format(ano=ANO_ELEICAO) + "\n")
        cob = self.meta["cobertura"]
        lin = []
        for a in self.arquivos_bu:
            ns = cob[(cob["turno"] == a["turno"]) & (cob["uf"] == a["uf"])]["secoes"].sum()
            lin.append([a["uf"], a["turno"], a["nome"], fnum(a.get("linhas", 0), lang), fnum(int(ns), lang)])
        P.append(f"**{L['s4_cobertura']}**\n")
        P.append(md_tabela([L["col_uf"], L["col_turno"], L["col_arquivo"], L["col_linhas"], L["col_secoes"]], lin, {3, 4}))
        P.append("")
        ausentes = [u for u in UFS_BRASIL if u not in self.meta["ufs"]]
        P.append((L["ufs_ausentes"].format(ufs=", ".join(ausentes)) if ausentes else L["ufs_completas"]) + "\n")
        if self.meta.get("ignorados"):
            P.append(L["ignorados"].format(lista=", ".join(f"`{n}`" for n in self.meta["ignorados"])) + "\n")
        if self.meta.get("excluidos"):
            P.append(L["excluidos"].format(lista=", ".join(f"`{n}` ({L['motivo_' + m]})" for n, m in self.meta["excluidos"])) + "\n")
        # 5
        P.append(f"## {L['s5']}\n")
        for par in L["s5_txt"]:
            P.append(par + "\n")
        lin = [[i["arquivo"], fnum(i["tamanho"], lang), f"`{i['sha512']}`", L[i["status"]]] for i in self.integridade]
        P.append(md_tabela([L["col_arquivo"], L["col_tamanho"], L["col_sha"], L["col_status"]], lin, {1}))
        P.append("")
        P.append(f"**{L['hash_manifesto']}:** `{self.meta['hash_manifesto']}`\n")
        if n_div:
            P.append(L["aviso_divergencia"] + "\n")
        # 6
        P.append(f"## {L['s6']}\n")
        h, rem = divmod(int(self.duracao), 3600)
        mi, se = divmod(rem, 60)
        fmt_dt = "%d/%m/%Y %H:%M:%S" if lang != "EN" else "%Y-%m-%d %H:%M:%S"
        libs = f"DuckDB {duckdb.__version__}; pandas {pd.__version__}; NumPy {np.__version__}; SciPy {__import__('scipy').__version__}"
        if plt is not None:
            libs += f"; Matplotlib {matplotlib.__version__}"
        P.append(md_tabela(["", ""], [
            [L["inicio"], self.inicio.strftime(fmt_dt)],
            [L["fim"], self.fim.strftime(fmt_dt)],
            [L["duracao"], f"{h}h {mi:02d}min {se:02d}s"],
            [L["fuso"], "America/Sao_Paulo (UTC−03:00)"],
            [L["so"], f"{platform.system()} {platform.release()} ({platform.machine()})"],
            [L["python"], platform.python_version()],
            [L["bibliotecas"], libs],
            [L["cpu"], str(os.cpu_count())],
            [L["ram"], f"{fnum(self.meta['ram_gb'], lang, 1)} GB" if self.meta.get("ram_gb") else "—"],
            [L["limite_duckdb"], f"{fnum(self.meta['duckdb_memory_limit_gb'], lang, 1)} GB"],
            [L["volume_zip"], f"{fnum(self.meta['bytes_zip'] / 1024 ** 3, lang, 2)} GB"],
            [L["volume_csv"], f"{fnum(self.meta['bytes_csv'] / 1024 ** 3, lang, 2)} GB"],
        ]))
        P.append("")
        # 7
        P.append(f"## {L['s7']}\n")
        for par in L["s7_txt"]:
            P.append(f"- {par}")
        P.append("")
        if self.meta.get("k_validacao"):
            P.append(f"**{L['k_senador']}**\n")
            lin = [[self._cargo(k["cargo"], lang), fnum(k["boletins"], lang), fnum(k["razao_modal"], lang, 3), str(k["k"])]
                   for k in self.meta["k_validacao"]]
            P.append(md_tabela([L["col_cargo"], L["col_boletins"], L["col_razao"], "k"], lin, {1, 2, 3}))
            P.append("")
        # 8
        P.append(f"## {L['s8']}\n")
        P.append(f"### {L['s8_1']}\n\n{L['s8_1_txt']}\n")
        P.append(f"### {L['s8_2']}\n\n{L['s8_2_txt'].format(min=MIN_SECOES_GRUPO)}\n")
        P.append(f"### {L['s8_3']}\n\n{L['s8_3_txt'].format(rmin=fnum(RHO_MIN, lang, 6), rmax=fnum(RHO_MAX, lang, 1))}\n")
        P.append(f"### {L['s8_4']}\n\n{L['s8_4_txt'].format(alfa=alfa)}\n")
        P.append(f"### {L['s8_5']}\n\n{L['s8_5_txt']}\n")
        P.append(f"### {L['s8_6']}\n")
        params = [("ALFA_FDR", ALFA_FDR), ("MIN_SECOES_GRUPO", MIN_SECOES_GRUPO), ("RHO_MIN / RHO_MAX", f"{RHO_MIN} / {RHO_MAX}"),
                  ("MIN_VOTOS_UNANIMIDADE", MIN_VOTOS_UNANIMIDADE), ("MIN_APTOS_ABSTENCAO", MIN_APTOS_ABSTENCAO),
                  ("MIN_VOTOS_PROPORCAO", MIN_VOTOS_PROPORCAO), ("LIMIAR_BLOCO", LIMIAR_BLOCO), ("LIMIAR_Z_ROBUSTO", LIMIAR_Z_ROBUSTO),
                  ("MIN_VOTOS_VOTO_CRUZADO", MIN_VOTOS_VOTO_CRUZADO), ("MIN_SECOES_LOCAL", MIN_SECOES_LOCAL),
                  ("LIMIAR_DIF_VIZINHANCA_PP", LIMIAR_DIF_VIZINHANCA_PP), ("MIN_VOTOS_IDENTICOS", MIN_VOTOS_IDENTICOS),
                  ("MIN_CATEGORIAS_IDENTICOS", MIN_CATEGORIAS_IDENTICOS), ("LIMIAR_ESPERADO_IDENTICOS", LIMIAR_ESPERADO_IDENTICOS),
                  ("HORA_INICIO_OFICIAL / HORA_FIM_OFICIAL", f"{HORA_INICIO_OFICIAL} / {HORA_FIM_OFICIAL}"),
                  ("TOLERANCIA_MINUTOS", TOLERANCIA_MINUTOS), ("ATRASO_ABERTURA_MIN", ATRASO_ABERTURA_MIN),
                  ("MIN_CONTAGENS_DIGITOS", MIN_CONTAGENS_DIGITOS), ("MIN_MEDIANA_DIGITOS", MIN_MEDIANA_DIGITOS), ("REPLICAS_DIGITOS / SEMENTE_SIMULACAO", f"{REPLICAS_DIGITOS} / {SEMENTE_SIMULACAO}"),
                  ("MIN_SECOES_LOCAL_DIGITOS", MIN_SECOES_LOCAL_DIGITOS), ("KLIMEK_CANTO", KLIMEK_CANTO),
                  ("KLIMEK_MIN_CANTO / KLIMEK_RAZAO", f"{KLIMEK_MIN_CANTO} / {KLIMEK_RAZAO}"),
                  ("VAGAS_POR_CARGO", ", ".join(f"{self._cargo(k, lang)}={v}" for k, v in VAGAS_POR_CARGO.items()))]
        P.append(md_tabela([L["col_parametro"], L["col_valor"]], [[f"`{k}`", str(v)] for k, v in params]))
        P.append("")
        # 9
        P.append(f"## {L['s9']}\n")
        for i, tid in enumerate(ORDEM_TESTES, start=1):
            P.append(self._secao_teste(tid, i, lang))
        # 10
        P.append(f"## {L['s10']}\n")
        P.append(L["s10_txt"] + "\n")
        multi = len(self.meta["turnos"]) > 1
        if len(self.convergentes):
            P.append(f"**🔴 {L['conv_full'].format(n=fnum(len(self.convergentes), lang))}**\n")
            lin = [[i] + ([fid(r.turno)] if multi else []) + [r.uf, self._mun(r), fid(r.zona), fid(r.secao), self._txt(r.secoes_agregadas),
                    fid(r.loc), fid(r.nr_urna), self._txt(r.cod_carga),
                    ", ".join(str(int(t[1:])) for t in r.testes.split(",")), r.n_testes]
                   for i, r in enumerate(self.convergentes.itertuples(), start=1)]
            cab = [L["col_num"]] + ([L["col_turno"]] if multi else []) + [L["col_uf"], L["col_mun"], L["col_zona"], L["col_secao"],
                                                                         L["col_agreg"], L["col_local"], L["col_urna"], L["col_carga"],
                                                                         L["col_testes"], L["col_ntestes"]]
            P.append(md_tabela(cab, lin, {0, len(cab) - 1}))
        else:
            P.append(L["sem_sinal"])
        P.append("")
        # 11
        P.append(f"## {L['s11']}\n")
        lin = [([fid(r.turno)] if multi else []) + [r.uf, fnum(r.secoes, lang), fnum(r.sinalizadas, lang),
                fpct(r.sinalizadas / r.secoes if r.secoes else np.nan, lang)] for r in self.por_uf.itertuples()]
        cab = ([L["col_turno"]] if multi else []) + [L["col_uf"], L["col_secoes"], L["col_secoes_sinal"], L["col_pct"]]
        P.append(md_tabela(cab, lin, set(range(len(cab) - 3, len(cab)))))
        P.append("")
        # 12
        P.append(f"## {L['s12']}\n")
        P.append(L["s12_txt"].format(ano=ANO_ELEICAO) + "\n")
        cls = classificacao_efetiva()
        lin = [[r.numero, r.sigla, NOMES_ESPECTROS[r.original][lang], r.federacao or "—", NOMES_ESPECTROS[r.efetiva][lang]]
               for r in cls.itertuples()]
        P.append(md_tabela([L["col_numero"], L["col_sigla"], L["col_original"], L["col_federacao"], L["col_efetiva"]], lin))
        P.append("")
        # 13
        P.append(f"## {L['s13']}\n")
        for par in L["s13_txt"]:
            P.append(f"- {par}")
        P.append("")
        # 14
        P.append(f"## {L['s14']}\n")
        P.append(L["s14_txt"] + "\n")
        P.append(L["s14_det"].format(h=self.det["hash"], pasta=f"{PASTA_DETERMINISMO}/{self.det['impressao']}"
                                     if not self.args.baseline else self.det["pasta"], d=DIGITOS_NUCLEO) + "\n")
        P.append(f"**{L['comando']}:** `python {Path(sys.argv[0]).name} --dados <...> --saida <...>`\n")
        lin = [[f"`{k}`", f"`{v}`"] for k, v in self.hashes_saida.items()]
        if lin:
            P.append(md_tabela([L["col_arquivo"], "SHA-512"], lin))
            P.append("")
        # 15
        P.append(f"## {L['s15']}\n")
        for ref in REFERENCIAS:
            P.append(f"- {ref.format(ano=ANO_ELEICAO)}")
        P.append("\n---\n")
        P.append(f"*{L['rodape'].format(v=VERSAO_MOTOR)}*\n")
        return "\n".join(P)

    @staticmethod
    def _status(r: Resultado) -> str:
        return "⚠️" if r.erro else ("🔴" if r.sinalizados else ("🟡" if r.informativos else "🟢"))

    @staticmethod
    def _txt(v) -> str:
        if v is None or v is pd.NA or (isinstance(v, float) and math.isnan(v)):
            return "—"
        return str(v)

    def _mun(self, x) -> str:
        nome = x.nm_mun if isinstance(x.nm_mun, str) else ""
        return f"{nome} ({fid(x.mun)})" if nome else fid(x.mun)

    def _bloco_determinismo(self, lang: str) -> str:
        L, d = TXT[lang], self.det
        if d["status"] == "identico":
            return L["det_ok"] + "\n"
        if d["status"] == "baseline":
            return L["det_base"].format(h=d["hash"]) + "\n"
        if d["status"] == "baseline_corrompido":
            return L["det_corrompido"] + "\n"
        difs = d["divergencias"]
        txt = L["det_div"].format(h=d["hash"], hb=d.get("hash_baseline", "—"), n=fnum(len(difs), lang)) + "\n\n"
        corta = lambda v: (json_canonico(v) if not isinstance(v, str) else v)[:200]
        txt += md_tabela([L["col_analise"], L["col_campo"], L["col_baseline"], L["col_atual"]],
                         [[x["analise"], f"`{x['campo']}`" if x["campo"] else "—", corta(x["baseline"]), corta(x["atual"])] for x in difs[:100]])
        return txt + "\n"

    def _tabela_urnas(self, tab: pd.DataFrame, lang: str) -> str:
        """Tabela completa de urnas sinalizadas, com todos os dados de identificação."""
        L = TXT[lang]
        multi = len(self.meta["turnos"]) > 1
        com_cat = tab["categoria"].nunique() > 1
        com_q = tab["q"].notna().any()
        lin = []
        for i, x in enumerate(tab.itertuples(), start=1):
            lin.append([i] + ([fid(x.turno)] if multi else []) +
                       [x.uf, self._mun(x), fid(x.zona), fid(x.secao), self._txt(x.secoes_agregadas), fid(x.loc), fid(x.nr_urna),
                        self._txt(x.cod_carga), self._cargo(x.cargo, lang)] +
                       ([CATEGORIAS.get(x.categoria, {}).get(lang, x.categoria)] if com_cat else []) +
                       [fdec(x.observado, lang), fdec(x.referencia, lang)] +
                       ([fp(x.q, lang) if pd.notna(x.q) else "—"] if com_q else []) + [fdec(x.detalhe, lang)])
        cab = ([L["col_num"]] + ([L["col_turno"]] if multi else []) +
               [L["col_uf"], L["col_mun"], L["col_zona"], L["col_secao"], L["col_agreg"], L["col_local"], L["col_urna"],
                L["col_carga"], L["col_cargo"]] + ([L["col_ocorrencia"]] if com_cat else []) +
               [L["col_obs"], L["col_ref"]] + ([L["col_q"]] if com_q else []) + [L["col_detalhe"]])
        k = 1 if multi else 0
        return md_tabela(cab, lin, {0, 3 + k, 4 + k}) + "\n"

    def _secao_teste(self, tid: str, i: int, lang: str) -> str:
        L = TXT[lang]
        r = self.resultados[tid]
        out = [f"### 9.{i} {self._status(r)} {TESTES[tid][lang]['nome']}\n"]
        for campo in ("objetivo", "metodo", "criterio", "limites"):
            out.append(f"**{L[campo]}.** {texto_teste(tid, lang, campo)}\n")
        if r.erro:
            out.append(f"> ⚠️ **{L['falha']}:** `{r.erro}`\n")
            return "\n".join(out)
        taxa = fpct(r.sinalizados / r.unidades, lang, 3) if r.unidades else "—"
        caixa = [L["res_caixa"].format(st=self._status(r), s=fnum(r.sinalizados, lang), u=fnum(r.unidades, lang), taxa=taxa,
                                       i=fnum(r.informativos, lang))]
        if r.brutos is not None and tid != "T06":
            caixa.append(L["bruto_txt"].format(b=fnum(r.brutos, lang)))
        if tid == "T06":
            caixa.append(L["cruzado_a"].format(a=fnum(r.extras.get("so_a", 0), lang), ab=fnum(r.extras.get("a_e_b", 0), lang)))
        if tid == "T12" and not r.extras.get("cesp"):
            caixa.append(L["sem_cesp"])
        if tid == "T12" and r.extras.get("cesp"):
            sem = ", ".join(f"{t}/{u}" for t, u in r.extras.get("sem_cesp", [])) or L["nenhum"]
            caixa.append(L["cesp_cobertura"].format(secoes=fnum(r.extras.get("secoes_cesp", 0), lang),
                                                    regulares=fnum(r.extras.get("regulares", 0), lang), sem=sem))
        if tid in ("T13", "T14") and self.meta.get("series_digitos_excluidas") is not None:
            caixa.append(L["digitos_excluidas"].format(m=MIN_MEDIANA_DIGITOS, n=fnum(self.meta["series_digitos_excluidas"], lang)))
        if tid in TESTES_AGREGADOS:
            caixa.append(L["explica_agregado"])
        else:
            caixa.append(L["explica_anom"] if r.sinalizados else L["explica_zero"])
            if r.informativos:
                caixa.append(L["explica_info"])
        out.append("\n>\n".join("> " + c for c in caixa) + "\n")
        tab = self.sinais[self.sinais["teste"] == tid]
        if len(tab):
            cat = tab.groupby(["categoria", "nivel"]).size().reset_index(name="n")
            cat = cat.sort_values(["n", "categoria"], ascending=[False, True], kind="mergesort")
            if cat["categoria"].nunique() > 1 or tid in ("T01", "T11", "T12"):
                out.append(f"**{L['por_categoria']}**\n")
                out.append(md_tabela([L["col_categoria"], L["col_qtd"]],
                                     [[("🔴 " if c.nivel == "anomalia" else "🟡 ") + CATEGORIAS.get(c.categoria, {}).get(lang, c.categoria),
                                       fnum(c.n, lang)] for c in cat.itertuples()], {1}))
                out.append("")
        if tid == "T03" and isinstance(r.extras.get("por_candidato"), pd.DataFrame) and len(r.extras["por_candidato"]):
            pc = r.extras["por_candidato"]
            multi = len(self.meta["turnos"]) > 1
            out.append(f"**{L['t03_por_cand']}**\n")
            lin = [([fid(x.turno)] if multi else []) +
                   [x.uf if x.uf != "BR" else L["todas_ufs"], self._cargo(x.cargo, lang),
                    f"nº {fid(x.nv)}" + (f" — {x.nome}" if isinstance(x.nome, str) else ""), fnum(x.secoes, lang),
                    fnum(x.improvaveis, lang)] for x in pc.itertuples()]
            cab = ([L["col_turno"]] if multi else []) + [L["col_uf"], L["col_cargo"], L["col_candidato"], L["col_secoes_100"],
                                                          L["col_improvaveis"]]
            out.append(md_tabela(cab, lin, {len(cab) - 2, len(cab) - 1}))
            out.append("")
        if tid in ("T13", "T14"):
            out.append(self._tabela_digitos(r, lang, tid))
            return "\n".join(out)
        if tid == "T15":
            out.append(self._tabela_klimek(r, lang))
            return "\n".join(out)
        if tab.empty:
            out.append(f"🟢 {L['sem_sinal']}\n")
            return "\n".join(out)
        anom, info = tab[tab["nivel"] == "anomalia"], tab[tab["nivel"] != "anomalia"]
        if len(anom):
            out.append(f"#### {L['tab_anom'].format(n=fnum(len(anom), lang))}\n")
            out.append(self._tabela_urnas(anom, lang))
        if len(info):
            out.append(f"<details>\n<summary><b>{L['tab_info'].format(n=fnum(len(info), lang))}</b></summary>\n")
            out.append(self._tabela_urnas(info, lang))
            out.append("</details>\n")
        return "\n".join(out)

    def _tabela_digitos(self, r: Resultado, lang: str, tid: str) -> str:
        L = TXT[lang]
        t = r.extras.get("tabela")
        if t is None or t.empty:
            return f"🟢 {L['sem_sinal']}\n"
        t = t.assign(_q=[sig_n(v) for v in t["q"]]).sort_values(["_q", "turno", "uf", "cargo", "nv"], kind="mergesort")
        lin = []
        for x in t.itertuples():
            base = [x.uf if x.uf != "BR" else L["todas_ufs"], self._cargo(x.cargo, lang), f"{x.nome} ({x.nv})", fnum(x.n, lang)]
            if tid == "T13":
                base += [fnum(x.media, lang, 3), fnum(x.media_modelo, lang, 3), fnum(x.media_benford, lang, 3), fnum(x.chi2, lang, 1)]
            else:
                base += [fnum(x.chi2, lang, 1)]
            base += [fp(x.p, lang), fp(x.q, lang), ("🔴 " + L["sim"]) if x.sinal else ("🟢 " + L["nao"])]
            lin.append(base)
        cab = [L["col_uf"], L["col_cargo"], L["col_candidato"], L["col_n"]]
        cab += [L["col_media"], L["col_media_modelo"], L["col_media_benford"], L["col_chi2"]] if tid == "T13" else [L["col_chi2"]]
        cab += [L["col_p"], L["col_q"], L["col_sinalizado"]]
        dir_ = set(range(3, len(cab) - 1))
        return (f"**{L['tabela_digitos_full']}**\n\n" + md_tabela(cab, lin, dir_) + "\n")

    def _tabela_klimek(self, r: Resultado, lang: str) -> str:
        L = TXT[lang]
        t = r.extras.get("tabela")
        if t is None or t.empty:
            return f"🟢 {L['sem_sinal']}\n"
        lin = []
        for x in t.sort_values(["turno", "nv", "uf"], kind="mergesort").itertuples():
            lin.append([x.uf if x.uf != "BR" else L["br_sem_zz"], f"{x.nome} ({x.nv})", fnum(x.secoes, lang), fnum(x.corr, lang, 3),
                        fnum(x.canto_obs, lang), fnum(x.canto_esp, lang, 2), fnum(x.razao, lang, 2) if np.isfinite(x.razao) else "—",
                        ("🟡 " + L["sim"]) if x.inspecao else ("🟢 " + L["nao"])])
        txt = md_tabela([L["col_uf"], L["col_candidato"], L["col_secoes"], L["col_corr"], L["col_canto_obs"],
                         L["col_canto_esp"], L["col_razao_oe"], L["col_marca"]], lin, {2, 3, 4, 5, 6}) + "\n"
        figs = r.extras.get("figuras") or []
        if figs:
            txt += f"\n**{L['klimek_graficos']}**\n\n" + "\n\n".join(f"![{f}](graficos/{f})" for f in figs) + "\n"
        return txt

    # ------------------------------------------------------- manifesto
    def manifesto_saida(self):
        (self.saida / "log_execucao.txt").write_text("\n".join(_LOG) + "\n", encoding="utf-8")
        linhas = []
        for p in sorted(self.saida.rglob("*")):
            if p.is_file() and "_trabalho" not in p.parts and PASTA_DETERMINISMO not in p.parts and p.name != "manifesto_saida.sha512":
                linhas.append(f"{sha512_arquivo(p)}  {p.relative_to(self.saida).as_posix()}")
        (self.saida / "manifesto_saida.sha512").write_text("\n".join(linhas) + "\n", encoding="utf-8")

    def limpar(self):
        try:
            self.con.close()
        except Exception:
            pass
        if not self.args.manter_banco:
            shutil.rmtree(self.trabalho, ignore_errors=True)

    def executar(self):
        log(f"Auditoria Estatística dos Boletins de Urna — Eleições {ANO_ELEICAO} (motor v{VERSAO_MOTOR})")
        self.preparar_pastas()
        self.descobrir_arquivos()
        self.baixar_complementos()
        self.verificar_integridade()
        self.ingerir()
        self.ingerir_cesp()
        self.preparar_bases()
        self.executar_testes()
        self.consolidar()
        self.exportar()
        self.verificar_determinismo()  # antes de compilar o .md
        self.gerar_relatorios()
        self.manifesto_saida()
        self.limpar()
        h, rem = divmod(int(time.time() - self.t0), 3600)
        log(f"AUDITORIA CONCLUÍDA em {h}h {rem // 60:02d}min {rem % 60:02d}s. Resultados em: {self.saida}")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    ap = argparse.ArgumentParser(description="Auditoria estatística dos Boletins de Urna — Eleições 2026")
    ap.add_argument("--dados", default=PASTA_DADOS, help="pasta com os arquivos do TSE (padrão: ./dados_tse)")
    ap.add_argument("--saida", default=PASTA_SAIDA, help="pasta de resultados (padrão: ./resultados)")
    ap.add_argument("--offline", action="store_true", help="não acessa a internet (sem hash oficial e sem CESP automático)")
    ap.add_argument("--manter-banco", action="store_true", help="mantém o banco DuckDB intermediário em <saida>/_trabalho")
    ap.add_argument("--manter-extraidos", action="store_true", help="mantém os CSV descompactados em <saida>/_trabalho/csv")
    ap.add_argument("--baseline", default=None,
                    help=f"pasta do registro de homologação do determinismo (padrão: <saida>/{PASTA_DETERMINISMO})")
    args = ap.parse_args()
    Auditoria(args).executar()


if __name__ == "__main__":
    main()
