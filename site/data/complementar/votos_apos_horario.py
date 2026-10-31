#!/usr/bin/env python3
"""Análise complementar: votos computados depois do horário oficial de encerramento, voto a voto, pelo log da urna.

Prévia publicada no site; não faz parte do Relatório Técnico nem do motor (auditoria_eleicoes_2026.py).

Seções analisadas: as sinalizadas por encerramento tardio (encerramento_tardio.csv: encerramento 1 h ou mais depois do
horário oficial local), em cada turno em que foram sinalizadas. Para cada uma:

1. baixa do TSE o índice da seção (…-aux.json) e o log da urna (.logjez) — resultados.tse.jus.br, arquivo-urna;
2. lê o log da urna (logd.dat) e os logs de urnas substituídas no dia (contingência), que vêm dentro do mesmo .logjez;
3. cada eleitor = um bloco do log, do "Identificador do eleitor digitado pelo mesário" até "O voto do eleitor foi
   computado"; guarda a hora do início do atendimento, da liberação ("Eleitor foi habilitado") e da gravação do voto;
4. forma de liberação: digital do eleitor ("Tipo de habilitação do eleitor [biométrica]", com o nº de capturas),
   digital não reconhecida ("Solicitação de dado pessoal do eleitor para habilitação manual") ou sem digital cadastrada
   (só o ano de nascimento conferido); identificador digitado: título ou CPF;
5. "depois do horário" = voto gravado a partir do horário oficial local (fim_oficial_local do encerramento_tardio.csv:
   17h de Brasília no 1º turno e 19h no 2º turno, encerramento estendido, convertidos para a hora local; no Exterior,
   as mesmas horas locais). Os horários são os do relógio da urna.

Quando o .logjez traz duas cópias do log da mesma urna, cada linha (urna, data e hora, assinatura da linha) conta uma
vez só. O log não informa em quem o eleitor votou nem quem é o eleitor. Os números de título de mesários que aparecem no log
não são gravados em nenhuma saída.

Conferência: o total de votos computados no log de cada seção é comparado com o comparecimento do BU (site/data/secoes).

Uso:  python3 votos_apos_horario.py [pasta site/data] [pasta cache dos logs | -] [processos]
      Com "-" no lugar da pasta de cache, os logs são baixados e lidos na memória (nada é gravado em disco).
Saídas (em site/data):
  votoshora/<UF>/<zona>.json      seções da zona: resumo, gráfico do dia, eventos e lista voto a voto depois do horário
  votoshora/<UF>.json             resumo por seção (tabela "votos_horario" da Consulta avançada)
  complementar/votos_apos_horario/<UF>.csv.gz    um voto por linha (só os depois do horário), um arquivo por estado
  complementar/votos_apos_horario_secoes.csv     uma seção por linha
  complementar/votos_apos_horario.json           resumo nacional
"""
import csv
import datetime
import gzip
import hashlib
import io
import json
import os
import re
import sys
import time
import zipfile
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from multiprocessing import Pool
from pathlib import Path

PLEITO = {1: 3220, 2: 3221}
DIA = {1: "04/10/2026", 2: "25/10/2026"}
URL = "https://resultados.tse.jus.br/oficial/ele2026/arquivo-urna/{pl}/dados/{uf}/{m:05d}/{z:04d}/{s:04d}"
MAX_EVENTOS = 300

R_CAP = re.compile(r"^Capturada a digital\. Tentativa \[(\d)\]")
R_FAIL = re.compile(r"^(?:Número de tentativas de reconhecimento do dedo|Timeout de reconhecimento do dedo)\. Tentativa \[(\d)\]")
R_ENC_ANTES = re.compile(r"^Encerramento só pode ser solicitado após as (\d\d:\d\d)")

# Eventos da seção: código -> início da mensagem no log (nenhum guarda números de título)
EVENTOS = [
    ("suspensa", "Votação suspensa"),
    ("reinicio", "Mesário confirmou o reinício da votação"),
    ("desligada", "Desligando a urna"),
    ("ligada", "Urna ligada em "),
    ("bateria", "Urna operando na bateria interna"),
    ("rede", "Urna operando na rede elétrica"),
    ("ja_votou", "O eleitor identificado já votou"),
    ("impedido", "Eleitor impedido"),
    ("justificativa", "Justificativa recebida"),
    ("suspenso_sem_voto", "Eleitor foi suspenso e não confirmou nenhum voto"),
    ("hab_cancelada", "Habilitação cancelada"),
    ("nao_encontrado", "Eleitor não encontrado para o identificador informado"),
    ("enc_cedo", "Encerramento só pode ser solicitado após as"),
    ("enc_menu", "Operador selecionou: Encerrar votação"),
    ("enc_cancelado", "Operador cancelou o encerramento da votação"),
    ("todos_sim", "Todas as pessoas presentes já votaram? SIM"),
    ("todos_nao", "Todas as pessoas presentes já votaram? NÃO"),
    ("enc_confirmado", "Procedimento de encerramento confirmado"),
    ("enc_abortado", "Procedimento de encerramento abortado"),
    ("bu_impresso", "Imprimindo relatório [BU] via nº [1]"),
]


def hms(s):
    return int(s[0:2]) * 3600 + int(s[3:5]) * 60 + int(s[6:8])


def txt_hora(seg):
    if seg is None:
        return ""
    d, r = divmod(int(seg), 86400)
    h, r = divmod(r, 3600)
    return f"{h:02d}:{r // 60:02d}:{r % 60:02d}" + (f" (+{d}d)" if d else "")


# ---------------------------------------------------------------- download

def baixar(item, cache):
    """Baixa aux.json e os .logjez da seção para o cache (retomável). Devolve a lista de arquivos .jez."""
    import requests
    t, uf, m, z, s = item
    d = Path(cache) / str(t) / uf
    d.mkdir(parents=True, exist_ok=True)
    pre = d / f"{m}-{z}-{s}"
    ok = Path(str(pre) + ".ok")
    if not ok.exists():
        pl = PLEITO[t]
        b = URL.format(pl=pl, uf=uf.lower(), m=m, z=z, s=s)
        ses = requests.Session()

        def get(u):
            for k in range(5):
                try:
                    r = ses.get(u, timeout=60)
                    if r.status_code == 200:
                        return r.content
                    if r.status_code == 404:
                        return None
                except requests.RequestException:
                    pass
                time.sleep(2 ** k)
            raise RuntimeError("falhou: " + u)

        aux = get(f"{b}/p{pl:06d}-{uf.lower()}-m{m:05d}-z{z:04d}-s{s:04d}-aux.json")
        if aux is None:
            raise RuntimeError("aux.json não encontrado")
        Path(str(pre) + ".aux.json").write_bytes(aux)
        n = 0
        for i, h in enumerate(json.loads(aux.decode("utf-8")).get("hashes", [])):
            for a in h.get("arq", []):
                if a.get("tp") == "log":
                    c = get(f"{b}/{h['hash']}/{a['nm']}")
                    if c is not None:
                        Path(f"{pre}-{i}.jez").write_bytes(c)
                        n += 1
        if not n:
            raise RuntimeError("sem log")
        ok.write_text(str(n))
    A = json.loads(Path(str(pre) + ".aux.json").read_text(encoding="utf-8"))
    return [Path(f"{pre}-{i}.jez") for i, h in enumerate(A.get("hashes", []))
            if any(a.get("tp") == "log" for a in h.get("arq", [])) and Path(f"{pre}-{i}.jez").exists()]


# ---------------------------------------------------------------- leitura do log

def logs_do_arquivo(blob):
    """logd.dat principal + logs de urnas substituídas (arquivos .jez dentro do .logjez)."""
    out = []
    z = zipfile.ZipFile(io.BytesIO(blob))
    for n in z.namelist():
        b = z.read(n)
        if n == "logd.dat":
            out.append(b.decode("latin1"))
        elif n.lower().endswith(".jez"):
            try:
                z2 = zipfile.ZipFile(io.BytesIO(b))
                if "logd.dat" in z2.namelist():
                    out.append(z2.read("logd.dat").decode("latin1"))
            except zipfile.BadZipFile:
                pass
    return out


def novo_bloco():
    return {"ti": None, "id": "", "cap": 0, "man": 0, "ano": 0, "bio": 0, "mes": 0, "th": None, "fl": 0}


def ler(textos, dia):
    """Votos computados (hora em segundos desde 0h do dia da eleição; depois da meia-noite, + 86400) e eventos."""
    d, m, a = (int(x) for x in dia.split("/"))
    dseg = (datetime.date(a, m, d) + datetime.timedelta(days=1)).strftime("%d/%m/%Y")
    votos, eventos, urnas = [], [], []
    vistos = set()   # o .logjez pode trazer cópias do log da mesma urna (ex.: MI e ME): linha igual conta uma vez só
    for txt in textos:
        cur, urna, prim = None, None, None
        for ln in txt.splitlines():
            p = ln.split("\t")
            if len(p) < 6 or p[3] != "VOTA":
                continue
            data = p[0][:10]
            if data == dia:
                t = hms(p[0][11:19])
            elif data == dseg:
                t = hms(p[0][11:19]) + 86400
            else:
                continue
            urna = urna or p[2]
            prim = t if prim is None else prim
            nivel, msg = p[1], p[4]
            assin = (p[2], p[0], p[5])
            repetida = assin in vistos
            vistos.add(assin)
            if repetida:
                pass
            elif nivel == "ERRO":
                eventos.append((t, "erro"))
            else:
                for cod, ini in EVENTOS:
                    if msg.startswith(ini):
                        if cod == "enc_cedo":
                            mm = R_ENC_ANTES.match(msg)
                            cod += ":" + (mm.group(1) if mm else "")
                        eventos.append((t, cod))
                        break
            # bloco do eleitor
            if msg == "Aguardando digitação do identificador do eleitor":
                if cur is None or cur["th"] is None:
                    cur = novo_bloco()
                continue
            if msg == "Identificador do eleitor digitado pelo mesário":
                if cur is None:
                    cur = novo_bloco()
                if cur["ti"] is None:
                    cur["ti"] = t
                continue
            if cur is None:
                continue
            if msg.startswith("Identificador digitado pelo mesário foi:"):
                cur["id"] = "C" if "CPF" in msg else "T"
            elif R_CAP.match(msg):
                cur["cap"] = max(cur["cap"], int(R_CAP.match(msg).group(1)))
            elif msg == "Tipo de habilitação do eleitor [biométrica]":
                cur["bio"] = 1
            elif msg.startswith("Solicitação de dado pessoal do eleitor para habilitação manual"):
                cur["man"] = 1
            elif msg.startswith("Ano de nascimento digitado é igual") or msg == "Dado digitado confere":
                cur["ano"] = 1
            elif msg == "Capturada a digital do mesário" or (msg.startswith("Mesário") and msg.endswith("habilitou o eleitor")):
                cur["mes"] = 1
            elif msg.startswith("Habilitação cancelada"):
                cur.update({"cap": 0, "man": 0, "ano": 0, "bio": 0, "mes": 0})   # nova tentativa, mesmo atendimento
            elif msg == "Eleitor foi habilitado":
                cur["th"] = t
            elif msg.startswith("Eleitor corrigiu na tela de confirmação"):
                cur["fl"] |= 1
            elif msg.startswith("Eleitor sem atividade por"):
                cur["fl"] |= 2
            elif msg.startswith("Eleitor votou parcialmente e em seguida foi suspenso") or msg.startswith("Atribuido voto nulo por suspensão"):
                cur["fl"] |= 4
            elif msg.startswith("Áudio ativado") or msg == "Fone de ouvido conectado":
                cur["fl"] |= 8
            elif msg == "Eleitor foi suspenso e não confirmou nenhum voto":
                cur = None
            elif msg == "O voto do eleitor foi computado":
                if cur["bio"]:
                    lib = f"D{max(1, cur['cap'])}"            # digital do eleitor, na n-ésima captura
                elif cur["man"]:
                    lib = "N"                                  # digital não reconhecida: liberação manual
                elif cur["ano"]:
                    lib = "S"                                  # sem digital cadastrada: ano de nascimento
                else:
                    lib = "?"
                fl = cur["fl"] | (16 if cur["mes"] and lib in ("N", "S") else 0)
                th = cur["th"] if cur["th"] is not None else t
                ti = cur["ti"] if cur["ti"] is not None else th
                if not repetida:
                    votos.append((t, th, ti, lib, cur["id"] or "?", fl))
                cur = None
        if prim is not None and (prim, urna) not in urnas:
            urnas.append((prim, urna))
    votos.sort(key=lambda v: v[0])
    eventos.sort()
    urnas.sort()
    return votos, eventos, urnas


def baixar_memoria(aux_url):
    """Baixa o índice da seção e os .logjez, sem gravar em disco."""
    import requests
    ses = requests.Session()

    def get(u):
        for k in range(6):
            try:
                r = ses.get(u, timeout=60)
                if r.status_code == 200:
                    return r.content
                if r.status_code == 404:
                    return None
            except requests.RequestException:
                pass
            time.sleep(2 ** k)
        raise RuntimeError("falhou: " + u)

    aux = get(aux_url)
    if aux is None:
        raise RuntimeError("aux.json não encontrado")
    base = aux_url.rsplit("/", 1)[0]
    out = []
    for h in json.loads(aux.decode("utf-8")).get("hashes", []):
        for a in h.get("arq", []):
            if a.get("tp") == "log":
                c = get(f"{base}/{h['hash']}/{a['nm']}")
                if c is not None:
                    out.append(c)
    if not out:
        raise RuntimeError("sem log")
    return out


def processar(arg):
    """Uma seção: lê os logs e monta o registro."""
    item, fim_txt, jez, comp_bu, aux_url = arg
    t = item[0]
    fim = hms(fim_txt + ":00")
    textos, shas = [], []
    try:
        blobs = [Path(j).read_bytes() for j in jez] if jez is not None else baixar_memoria(aux_url)
    except Exception as e:  # noqa: BLE001
        return item, None, str(e)
    for b in blobs:
        shas.append(hashlib.sha256(b).hexdigest())
        textos += logs_do_arquivo(b)
    votos, eventos, urnas = ler(textos, DIA[t])
    tot = len(votos)
    apos = [v for v in votos if v[0] >= fim]
    antes = tot - len(apos)
    horas = Counter(min(7, (v[0] - fim) // 3600) for v in apos)
    h = [horas.get(i, 0) for i in range(8)]
    while len(h) > 1 and h[-1] == 0:
        h.pop()
    bins = Counter(v[0] // 600 for v in votos)
    b0 = min(bins) if bins else 0
    b = [b0, [bins.get(i, 0) for i in range(b0, max(bins) + 1)]] if bins else [0, []]
    sd_antes = sum(1 for v in votos[:antes] if v[3] in ("N", "S"))
    sd_apos = sum(1 for v in apos if v[3] in ("N", "S"))
    enc = [e[0] for e in eventos if e[1] == "enc_confirmado"]
    enc = enc[-1] if enc else None
    ult = votos[-1][0] if votos else None
    gaps, prev = [], fim
    for v in apos:
        gaps.append(v[0] - prev)
        prev = v[0]
    ev = [[e[0], e[1]] for e in eventos if e[0] >= fim][:MAX_EVENTOS]
    if len(urnas) > 1:   # urna substituída: início do log de cada urna no dia
        ev += [[u[0], "troca"] for u in urnas[1:] if u[0] >= fim]
        ev.sort()
    lista, ant = [], fim
    for v in apos:
        lista.append([v[0] - ant, v[0] - v[1], v[1] - v[2], v[3] + v[4], v[5]])
        ant = v[0]
    rec = {
        "fim": fim, "tot": tot, "bu": comp_bu, "apos": len(apos), "h": h, "b": b,
        "p": votos[0][0] if votos else None, "u": ult, "e": enc,
        "sd": [sd_antes, antes, sd_apos, len(apos)],
        "gap": max(gaps) if gaps else None,
        "ev": ev, "ur": len(urnas), "v": lista,
        "sha": shas, "url": aux_url,
        "cpf": sum(1 for v in apos if v[4] == "C"),
        "jv": sum(1 for e in eventos if e[1] == "ja_votou" and e[0] >= fim),
    }
    return item, rec, apos


# ---------------------------------------------------------------- principal

def main():
    base = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[1])
    cache = sys.argv[2] if len(sys.argv) > 2 else str(base.parent.parent / "cache_logs")
    memoria = cache == "-"
    nproc = int(sys.argv[3]) if len(sys.argv) > 3 else os.cpu_count() or 2
    lista = list(csv.DictReader(open(base / "complementar" / "encerramento_tardio.csv", encoding="utf-8")))
    itens = [(int(r["turno"]), r["uf"], int(r["cod_mun"]), int(r["zona"]), int(r["secao"])) for r in lista]
    info = {it: r for it, r in zip(itens, lista)}

    arquivos, falhas = {}, []
    if memoria:
        print(f"{len(itens)} seções; logs baixados e lidos na memória", flush=True)
        arquivos = {it: None for it in itens}
    else:
        print(f"{len(itens)} seções; baixando o que faltar em {cache}", flush=True)
        with ThreadPoolExecutor(12) as ex:
            futs = {it: ex.submit(baixar, it, Path(cache)) for it in itens}
            for it, f in futs.items():
                try:
                    arquivos[it] = f.result()
                except Exception as e:  # noqa: BLE001
                    falhas.append((it, str(e)))
        print(f"logs: {len(arquivos)} seções; falhas: {len(falhas)}", flush=True)

    # comparecimento do BU (conferência)
    zonas = {}

    def comp(t, uf, z, s):
        if (uf, z) not in zonas:
            zonas[(uf, z)] = json.loads((base / "secoes" / uf / f"{z}.json").read_text(encoding="utf-8"))
        rec = zonas[(uf, z)]["s"].get(str(s))
        return rec[t][1] if rec and len(rec) > t and rec[t] else None

    args = []
    for it in itens:
        if it not in arquivos:
            continue
        t, uf, m, z, s = it
        pl = PLEITO[t]
        aux = URL.format(pl=pl, uf=uf.lower(), m=m, z=z, s=s) + f"/p{pl:06d}-{uf.lower()}-m{m:05d}-z{z:04d}-s{s:04d}-aux.json"
        args.append((it, info[it]["fim_oficial_local"], None if arquivos[it] is None else [str(p) for p in arquivos[it]], comp(t, uf, z, s), aux))

    porzona = defaultdict(dict)
    resumo_uf = defaultdict(list)
    out = base / "complementar"
    (out / "votos_apos_horario").mkdir(exist_ok=True)
    for velho in (out / "votos_apos_horario").glob("*.csv.gz"):
        velho.unlink()
    arqs_uf, escritores = {}, {}

    def wv_de(uf):
        if uf not in escritores:
            arqs_uf[uf] = gzip.open(out / "votos_apos_horario" / f"{uf}.csv.gz", "wt", encoding="utf-8", newline="")
            escritores[uf] = csv.writer(arqs_uf[uf])
            escritores[uf].writerow(["turno", "uf", "cod_mun", "municipio", "zona", "secao", "fim_oficial_local", "ordem_no_dia",
                                     "inicio_atendimento", "liberado", "voto_gravado", "minutos_apos_fim", "segundos_liberado_ate_gravado",
                                     "liberacao", "capturas_digital", "identificador", "corrigiu_voto", "inativo_45s", "suspenso_parcial",
                                     "audio", "digital_mesario"])
        return escritores[uf]
    fs = open(out / "votos_apos_horario_secoes.csv", "w", encoding="utf-8", newline="")
    ws = csv.writer(fs)
    ws.writerow(["turno", "uf", "cod_mun", "municipio", "zona", "secao", "fim_oficial_local", "votos_dia_log", "comparecimento_bu",
                 "votos_apos_fim", "primeira_hora", "segunda_hora", "terceira_hora", "quarta_hora", "quinta_hora", "sexta_hora",
                 "setima_hora", "oitava_hora_ou_mais", "ultimo_voto", "encerramento_log", "min_ultimo_voto_ate_encerramento",
                 "maior_intervalo_sem_voto_apos_fim_min", "sem_digital_antes", "votos_antes", "sem_digital_apos", "cpf_apos",
                 "ja_votou_apos", "urnas_no_dia", "sha256_logjez", "indice_tse"])
    tot = {1: Counter(), 2: Counter()}
    faixas = {1: Counter(), 2: Counter()}
    hora_ult = {1: Counter(), 2: Counter()}
    lib_t = {1: Counter(), 2: Counter()}
    divergentes = []
    nomes_lib = {"N": "digital_nao_reconhecida", "S": "sem_digital_cadastrada", "?": "nao_identificada"}
    with Pool(nproc) as pool:
        for k, (it, rec, apos) in enumerate(pool.imap_unordered(processar, args, chunksize=4), 1):
            t, uf, m, z, s = it
            if rec is None:
                falhas.append((it, apos))
                continue
            r = info[it]
            porzona[(uf, z)][f"{t}|{s}"] = rec
            fim = rec["fim"]
            h8 = (rec["h"] + [0] * 8)[:8]
            u, e = rec["u"], rec["e"]
            resumo_uf[uf].append([t, m, z, s, fim, rec["tot"], rec["bu"], rec["apos"]] + h8 +
                                 [u, e, rec["gap"], rec["sd"][0], rec["sd"][1], rec["sd"][2], rec["cpf"], rec["jv"], rec["ur"]])
            ws.writerow([t, uf, m, r["municipio"], z, s, r["fim_oficial_local"], rec["tot"], rec["bu"], rec["apos"]] + h8 +
                        [txt_hora(u), txt_hora(e), "" if u is None or e is None else round((e - u) / 60, 1),
                         "" if rec["gap"] is None else round(rec["gap"] / 60, 1), rec["sd"][0], rec["sd"][1], rec["sd"][2],
                         rec["cpf"], rec["jv"], rec["ur"], " ".join(rec["sha"]), rec["url"]])
            n0 = rec["tot"] - rec["apos"]
            wv = wv_de(uf) if apos else None
            for i, v in enumerate(apos):
                lib = v[3]
                wv.writerow([t, uf, m, r["municipio"], z, s, r["fim_oficial_local"], n0 + i + 1, txt_hora(v[2]), txt_hora(v[1]), txt_hora(v[0]),
                             round((v[0] - fim) / 60, 1), v[0] - v[1], "digital" if lib[0] == "D" else nomes_lib[lib],
                             lib[1:] if lib[0] == "D" else "", "cpf" if v[4] == "C" else "titulo" if v[4] == "T" else "",
                             int(bool(v[5] & 1)), int(bool(v[5] & 2)), int(bool(v[5] & 4)), int(bool(v[5] & 8)), int(bool(v[5] & 16))])
                lib_t[t]["D" if lib[0] == "D" else lib] += 1
            T = tot[t]
            T["secoes"] += 1
            T["votos_dia"] += rec["tot"]
            T["votos_apos"] += rec["apos"]
            T["sd_antes"] += rec["sd"][0]
            T["votos_antes"] += rec["sd"][1]
            T["sd_apos"] += rec["sd"][2]
            T["ja_votou_apos"] += rec["jv"]
            T["cpf_apos"] += rec["cpf"]
            if rec["bu"] is not None and rec["tot"] != rec["bu"]:
                divergentes.append([t, uf, m, z, s, rec["tot"], rec["bu"]])
            a = rec["apos"]
            faixas[t]["0" if a == 0 else "1-10" if a <= 10 else "11-50" if a <= 50 else "51-100" if a <= 100 else "101-200" if a <= 200 else ">200"] += 1
            if u is not None:
                hora_ult[t][str(max(-1, (u - fim) // 3600))] += 1
            if k % 2000 == 0:
                print(f"  {k}/{len(args)}", flush=True)
    for f in arqs_uf.values():
        f.close()
    fs.close()

    dest = base / "votoshora"
    for (uf, z), secs in porzona.items():
        p = dest / uf / f"{z}.json"
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps({"s": secs}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    campos = ["turno", "cod_mun", "zona", "secao", "fim", "votos_dia", "comparecimento_bu", "votos_apos"] + \
             [f"h{i}" for i in range(1, 9)] + ["ultimo_voto", "encerramento", "maior_intervalo", "sem_digital_antes",
                                               "votos_antes", "sem_digital_apos", "cpf_apos", "ja_votou_apos", "urnas"]
    for uf, linhas in resumo_uf.items():
        linhas.sort()
        (dest / f"{uf}.json").write_text(json.dumps({"campos": campos, "l": linhas}, separators=(",", ":")), encoding="utf-8")

    res = {"criterio": {"secoes": "sinalizadas por encerramento tardio (encerramento_tardio.csv)",
                        "depois_do_horario": "voto gravado a partir do horário oficial local (17h de Brasília; Exterior: 17h locais)",
                        "fonte": "log da urna (.logjez) do TSE, arquivo-urna, pleitos 3220 (1º turno) e 3221 (2º turno)"},
           "gerado_em": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
           "falhas_download": [[*it, e] for it, e in falhas],
           "log_diferente_do_bu": divergentes,
           "turnos": {}}
    for t in (1, 2):
        T = tot[t]
        res["turnos"][str(t)] = {
            "secoes": T["secoes"], "votos_dia": T["votos_dia"], "votos_apos": T["votos_apos"],
            "pct_apos": round(T["votos_apos"] / T["votos_dia"], 6) if T["votos_dia"] else 0,
            "faixas_votos_apos": dict(faixas[t]),
            "ultimo_voto_horas_apos_fim": dict(sorted(hora_ult[t].items(), key=lambda x: int(x[0]))),
            "sem_digital_antes_pct": round(T["sd_antes"] / T["votos_antes"], 6) if T["votos_antes"] else 0,
            "sem_digital_apos_pct": round(T["sd_apos"] / T["votos_apos"], 6) if T["votos_apos"] else 0,
            "liberacao_apos": dict(lib_t[t]),
            "cpf_apos": T["cpf_apos"], "ja_votou_apos": T["ja_votou_apos"],
        }
    (out / "votos_apos_horario.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(res["turnos"], ensure_ascii=False, indent=1))
    print("divergências log x BU:", len(divergentes), "falhas:", len(falhas))


if __name__ == "__main__":
    main()
