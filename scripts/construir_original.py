"""Datos de los idiomas originales (STEPBible-Data, CC BY 4.0) para el panel de estudio.

Uso: python scripts/construir_original.py   (antes: descargar.py)

Genera en public/data/:
- original/<id>.json.gz      por libro: capítulos → versículos → palabras (versificación KJV)
- lexico/H.json.gz, G.json.gz {Strong extendido: [lema, transliteración, categoría, glosa en inglés]}
- morfologia.json            {código de morfología: descripción en español}

Cada palabra es [texto, transliteración, glosa en español, glosa en inglés, Strongs, morfología, marca]:
- Strongs: todos los de la palabra separados por "/" (prefijos, palabra, sufijos). Si hay
  más de uno, el principal va entre llaves como en STEP ("H9003/{H7225G}"); es con el que se
  compara una palabra con otra y al que corresponde la morfología.
- morfología: código de la parte principal (con el prefijo de idioma H, A o el de TEGMC).
- marca: 0 = normal; en griego, 1 = solo en el Textus Receptus (del que se tradujo la
  RV1909) y 2 = solo en Nestle-Aland; 3 = parte del título de un salmo (STEP lo numera como
  versículo 0 y acá va al comienzo del versículo 1).

Por ahora no se publican las definiciones de TBESH/TBESG: parten del Abridged BDB y del
Abridged Thayer, que STEP usa con permiso; falta confirmar con STEPBible (ver CLAUDE.md).
"""

import gzip
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

from libros import POR_USFM
from morfologia import describir, leer_codigos

RAIZ = Path(__file__).resolve().parent.parent
STEP = RAIZ / "data" / "raw" / "step"
SALIDA = RAIZ / "public" / "data"
# Capítulos y versículos de cada libro en la versificación KJV (de src/core/bible/kjv-versification.ts)
CONTEOS = Path(__file__).resolve().parent / "kjv_conteos.json"
TITULO = 3  # marca de las palabras del título de un salmo

# Versículos de la versificación inglesa moderna (NRSV) que en la KJV son parte de otro.
# Como los archivos vienen en orden, sus palabras quedan al final o al comienzo del destino.
REASIGNAR = {
    (64, 1, 15): (64, 1, 14),  # 3 Jn 1:15 → final de 3 Jn 1:14
    (66, 12, 18): (66, 13, 1),  # Ap 12:18 → comienzo de Ap 13:1
}

# "Gen.31.55(32.1)#01=L": referencia inglesa, alternativa opcional, número de palabra y tipo
REF = re.compile(r"^([1-3]?[A-Za-z]{2,3})\.(\d+)\.(\d+)(?:\([^)]*\)|\[[^\]]*\])?#(\d+)=(\S+)$")


def escribir_gz(ruta: Path, datos) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    crudo = json.dumps(datos, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    ruta.write_bytes(gzip.compress(crudo, compresslevel=9, mtime=0))


def filas(prefijo: str):
    """Filas de palabras de los archivos TAHOT o TAGNT: (libro, cap, vers, tipo, columnas)."""
    for archivo in sorted(STEP.glob(f"{prefijo} *.txt")):
        for linea in archivo.read_text(encoding="utf-8-sig", errors="replace").splitlines():
            columnas = linea.split("\t")
            m = REF.match(columnas[0])
            if not m:
                continue
            libro = POR_USFM.get(m.group(1).upper())
            if libro is None:
                raise ValueError(f"Libro desconocido: {columnas[0]}")
            yield libro, int(m.group(2)), int(m.group(3)), m.group(5), columnas


def principal(strongs: str) -> tuple[list[str], int]:
    """("H9003/{H7225G}\\H9016") → (["H9003", "H7225G"], 1): partes y cuál es la principal."""
    partes = strongs.split("\\")[0].split("/")
    indice = next((i for i, p in enumerate(partes) if p.startswith("{")), 0)
    # "+" marca un nombre partido en dos palabras ("Abi-albón")
    return [p.strip("{}+") for p in partes], indice


def resolver(strong: str, lexico: dict) -> str:
    """El Strong tal como aparece en el léxico: exacto, sin la letra final o con la primera letra."""
    if strong in lexico or not re.match(r"^[HG]\d", strong):
        return strong
    base = re.match(r"^[HG]\d+", strong).group(0)
    if base in lexico:
        return base
    return next((k for k in (f"{base}{l}" for l in "ABCDEFGHIJKLMNOPQRSTUVWXYZ") if k in lexico), strong)


def palabra_hebrea(c: list[str]) -> tuple[list, str, str] | None:
    if not c[1].strip():
        return None  # qere sin texto: lo escrito no se lee (Is 44:24, Jer 38:16, etc.)
    partes, i = principal(c[4])
    gramatica = c[5].split("\\")[0].split("/")
    idioma = gramatica[0][0]  # H (hebreo) o A (arameo): solo lo lleva la primera parte
    j = min(i, len(gramatica) - 1)
    morf = gramatica[j] if j == 0 else idioma + gramatica[j]
    texto = c[1].replace("/", "").replace("\\", "")
    glosa = re.sub(r"/\s*", " ", c[3]).strip()
    strongs = "/".join(f"{{{p}}}" if k == i and len(partes) > 1 else p for k, p in enumerate(partes))
    return [texto, c[2].replace("/", ""), "", glosa, strongs, morf, 0], partes[i], morf


def palabra_griega(c: list[str], tipo: str) -> tuple[list, str, str] | None:
    mayusculas = re.sub(r"\([^)]*\)", "", tipo)  # lo que está entre paréntesis es secundario
    en_na, en_tr = "N" in mayusculas, "K" in mayusculas
    if not (en_na or en_tr):
        return None
    marca = 0 if (en_na and en_tr) else (1 if en_tr else 2)
    m = re.match(r"^(.*?)\s*\(([^)]*)\)\s*$", c[1])
    texto, translit = (m.group(1), m.group(2)) if m else (c[1].strip(), "")
    # STEP usa la tilde "oxia" (U+1F7x); NFC la pasa a la forma estándar (tonos)
    texto = unicodedata.normalize("NFC", texto)
    # Palabras combinadas ("A-NUI + G3638=A-NUI"): se toma la primera parte
    strong, _, morf = c[3].split(" + ")[0].partition("=")
    glosa_es = c[8].strip() if len(c) > 8 else ""
    return [texto, translit, glosa_es, c[2].strip(), strong.strip(), morf.strip(), marca], strong.strip(), morf.strip()


def leer_lexico(ruta: Path) -> dict[str, list[str]]:
    lexico = {}
    for linea in ruta.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        c = linea.split("\t")
        if len(c) < 7 or not re.match(r"^[HG]\d", c[0]):
            continue
        clave = c[1].split(" ")[0].strip()
        if clave and clave not in lexico:
            lema = c[3].strip()
            if clave.startswith("G"):
                lema = unicodedata.normalize("NFC", lema)  # igual que las palabras griegas
            lexico[clave] = [lema, c[4].strip(), c[5].strip(), c[6].strip()]
    return lexico


def existe(conteos: list[list[int]], libro: int, cap: int, vers: int) -> bool:
    caps = conteos[libro - 1]
    return 1 <= cap <= len(caps) and 1 <= vers <= caps[cap - 1]


def main() -> None:
    conteos = json.loads(CONTEOS.read_text(encoding="utf-8"))["libros"]
    libros = {id_: [[[] for _ in range(cant)] for cant in caps] for id_, caps in enumerate(conteos, 1)}
    morfologias: set[str] = set()
    fuera = defaultdict(int)
    omitidas = defaultdict(int)
    lexicos = {"H": leer_lexico(STEP / "TBESH.txt"), "G": leer_lexico(STEP / "TBESG.txt")}
    lexico = {**lexicos["H"], **lexicos["G"]}

    for prefijo in ("TAHOT", "TAGNT"):
        for libro, cap, vers, tipo, c in filas(prefijo):
            resultado = palabra_hebrea(c) if prefijo == "TAHOT" else palabra_griega(c, tipo)
            if resultado is None:
                omitidas[prefijo] += 1
                continue
            palabra, strong, morf = resultado
            # Cada Strong como figura en el léxico, para poder buscarlo directamente
            palabra[4] = "/".join(
                f"{{{resolver(s[1:-1], lexico)}}}" if s.startswith("{") else resolver(s, lexico)
                for s in palabra[4].split("/")
            )
            strong = resolver(strong, lexico)
            if vers == 0:
                # Título de un salmo: la KJV no lo numera aparte, va con el versículo 1
                palabra[6] = TITULO
                vers = 1
            libro, cap, vers = REASIGNAR.get((libro, cap, vers), (libro, cap, vers))
            if not existe(conteos, libro, cap, vers):
                fuera[f"{libro}.{cap}.{vers}"] += 1
                continue
            libros[libro][cap - 1][vers - 1].append(palabra)
            morfologias.add(morf)

    for id_, capitulos in libros.items():
        escribir_gz(SALIDA / "original" / f"{id_}.json.gz", capitulos)

    for letra, entradas in lexicos.items():
        escribir_gz(SALIDA / "lexico" / f"{letra}.json.gz", entradas)

    codigos = {**leer_codigos(STEP / "TEHMC.txt"), **leer_codigos(STEP / "TEGMC.txt")}
    tabla = {m: describir(codigos[m]) for m in sorted(morfologias) if m in codigos}
    sin_descripcion = sorted(m for m in morfologias if m not in codigos)
    (SALIDA / "morfologia.json").write_text(
        json.dumps(tabla, ensure_ascii=False, separators=(",", ":"), sort_keys=True), encoding="utf-8"
    )

    total = sum(len(v) for caps in libros.values() for c in caps for v in c)
    print(
        f"Palabras: {total} (omitidas: {omitidas['TAHOT']} qere sin texto, "
        f"{omitidas['TAGNT']} griegas que no están en NA ni en el TR)"
    )
    print(f"Fuera de la versificación KJV: {sum(fuera.values())} palabras en {len(fuera)} versículos")
    for ref, n in fuera.items():
        print(f"  {ref}: {n}")
    print(f"Códigos de morfología: {len(tabla)} (sin descripción: {len(sin_descripcion)})")
    for m in sin_descripcion[:15]:
        print(f"  sin descripción: {m}")


if __name__ == "__main__":
    main()
