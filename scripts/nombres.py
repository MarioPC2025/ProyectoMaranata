"""Fichas de personas, lugares y otros nombres propios (TIPNR, STEPBible-Data, CC BY 4.0).

Uso:
  python scripts/nombres.py                  genera public/data/nombres.json.gz (antes: descargar.py)
  python scripts/nombres.py pendientes N     las N fichas sin traducir que más aparecen, en TSV
  python scripts/nombres.py agregar ARCHIVO  suma un lote "id<TAB>nombre<TAB>breve<TAB>resumen"
                                             a data/nombres-es.tsv (después, volver a generar)

nombres.json.gz es {"indice": {Strong: n}, "fichas": [ficha]} y cada ficha es
[tipo, nombre, breve, resumen, traducida, padres, hermanos, cónyuges, hijos, veces, primera]:
- tipo: "P" persona, "L" lugar, "O" otro (dioses, meses, títulos…).
- nombre, breve y resumen: en español si están en data/nombres-es.tsv (traducida = 1) y, si no,
  los de STEP en inglés (traducida = 0). El artículo largo de STEP no se publica por ahora.
- padres, hermanos, cónyuges e hijos: números de otras fichas (solo personas).
- veces: versículos donde aparece; primera: [libro, capítulo, versículo] o null.
El índice va de cada Strong de cada forma del nombre (como en public/data/original/) a su ficha.
"""

import json
import re
import sys
from pathlib import Path

from construir_original import escribir_gz
from libros import POR_USFM

RAIZ = Path(__file__).resolve().parent.parent
TIPNR = RAIZ / "data" / "raw" / "step" / "TIPNR.txt"
TRADUCCION = RAIZ / "data" / "nombres-es.tsv"
SALIDA = RAIZ / "public" / "data" / "nombres.json.gz"
TIPOS = {"PERSON(s)": "P", "PLACE": "L", "PLACE+PERSON": "L", "OTHER": "O"}
ENCABEZADO = (
    "# Fichas de TIPNR (STEPBible-Data, CC BY 4.0) traducidas al español.\n"
    "# Traducción automática, en revisión. Formato: id<TAB>nombre<TAB>breve<TAB>resumen.\n"
)
REF = re.compile(r"([1-3]?[A-Za-z]{2,3})\.(\d+)\.(\d+)")


def bloques(lineas: list[str]):
    """(tipo, líneas) de cada registro; los registros empiezan con "$==========" ."""
    tipo, actual = None, []
    for linea in lineas:
        if linea.startswith("$=========="):
            if tipo:
                yield tipo, actual
            tipo, actual = TIPOS.get(linea.strip("$= \t")), []
        elif tipo:
            actual.append(linea.rstrip("\t"))
    if tipo:
        yield tipo, actual


def referencia(texto: str) -> list[int] | None:
    m = REF.match(texto)
    libro = POR_USFM.get(m.group(1).upper()) if m else None
    return [libro, int(m.group(2)), int(m.group(3))] if libro else None


def lista(texto: str) -> list[str]:
    """Nombres únicos separados por comas o "+", sin las marcas (d), (a), (f), (?)."""
    nombres = (re.sub(r"\([^)]*\)", "", n).strip() for n in re.split(r"[,+]", texto))
    return [n for n in nombres if "@" in n]


def limpiar(texto: str) -> str:
    """Sin las marcas de STEP: <ref="…">Gen.1.1</ref> queda como el texto, sin la nota del artículo."""
    texto = re.sub(r'<ref="[^"]*">([^<]*)</ref>', r"\1", texto)
    texto = texto.replace("(Multiple references, see article for details)", "")
    return re.sub(r"\s+", " ", texto).strip()


def leer_registro(tipo: str, lineas: list[str]) -> dict | None:
    if not lineas or "@" not in lineas[0]:
        return None
    cabecera = lineas[0].split("\t")
    id_ = cabecera[0].partition("=")[0].strip()
    registro = {
        "id": id_,
        "tipo": tipo,
        "nombre": id_.split("@")[0].replace("_", " "),
        "breve": "",
        "resumen": "",
        "strongs": [],
        "versiculos": set(),
        "primera": referencia(id_.split("@")[1]),
        "familia": [[], [], [], []],
    }
    if tipo == "P":
        registro["familia"] = [lista(c) for c in (cabecera + [""] * 6)[2:6]]
    for linea in lineas[1:]:
        c = linea.split("\t")
        if linea.startswith("@Brief="):
            registro["breve"] = limpiar(linea.partition("=")[2])
        elif linea.startswith("@Short="):
            registro["resumen"] = limpiar(linea.partition("=")[2])
        elif linea.startswith("–") and not linea.startswith("– Total") and len(c) > 2 and "«" in c[2]:
            strong = c[2].split("«")[0].strip()
            if strong not in registro["strongs"]:
                registro["strongs"].append(strong)
            refs = ";".join(c[4:])  # el link de STEP a veces falta y corre las columnas
            # "Gen.12.8a" y "Gen.12.8b" son el mismo versículo
            registro["versiculos"].update(r.strip().rstrip("ab") for r in refs.split(";") if REF.match(r.strip()))
    return registro


def leer_tipnr(ruta: Path = TIPNR) -> list[dict]:
    lineas = ruta.read_text(encoding="utf-8-sig", errors="replace").splitlines()
    return [r for t, b in bloques(lineas) if t and (r := leer_registro(t, b))]


def leer_traduccion(ruta: Path = TRADUCCION) -> dict[str, list[str]]:
    if not ruta.exists():
        return {}
    traduccion = {}
    for linea in ruta.read_text(encoding="utf-8-sig").splitlines():
        if linea and not linea.startswith("#"):
            id_, *campos = linea.split("\t")
            if campos and campos[0].strip():
                traduccion[id_] = [c.strip() for c in (campos + ["", ""])[:3]]
    return traduccion


def construir(registros: list[dict], traduccion: dict[str, list[str]]) -> dict:
    numero = {r["id"]: n for n, r in enumerate(registros)}
    indice, fichas = {}, []
    for n, r in enumerate(registros):
        es = traduccion.get(r["id"])
        textos = es if es else [r["nombre"], r["breve"], r["resumen"]]
        familia = [[numero[x] for x in grupo if x in numero] for grupo in r["familia"]]
        fichas.append([r["tipo"], *textos, int(bool(es)), *familia, len(r["versiculos"]), r["primera"]])
        for strong in r["strongs"]:
            indice.setdefault(strong, n)
    return {"indice": indice, "fichas": fichas}


def pendientes(cantidad: int) -> list[str]:
    hechas = leer_traduccion()
    registros = sorted(leer_tipnr(), key=lambda r: -len(r["versiculos"]))
    return [
        "\t".join([r["id"], r["nombre"], r["breve"], r["resumen"]])
        for r in registros
        if r["id"] not in hechas
    ][:cantidad]


def agregar(lote: Path) -> None:
    ids = {r["id"] for r in leer_tipnr()}
    traduccion = leer_traduccion()
    nuevas, malas = 0, []
    for linea in lote.read_text(encoding="utf-8-sig").splitlines():
        if not linea.strip():
            continue
        id_, *campos = linea.split("\t")
        if id_ not in ids or len(campos) != 3 or not campos[0].strip():
            malas.append(f"  {linea[:80]!r}")
            continue
        nuevas += id_ not in traduccion
        traduccion[id_] = [c.strip() for c in campos]
    filas = "".join("\t".join([id_, *campos]) + "\n" for id_, campos in sorted(traduccion.items()))
    TRADUCCION.write_text(ENCABEZADO + filas, encoding="utf-8")
    print(f"Agregadas: {nuevas} (total: {len(traduccion)}); rechazadas: {len(malas)}")
    print("\n".join(malas))


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    orden = sys.argv[1] if len(sys.argv) > 1 else ""
    if orden == "pendientes":
        print("\n".join(pendientes(int(sys.argv[2]))))
    elif orden == "agregar":
        agregar(Path(sys.argv[2]))
    elif orden:
        sys.exit(__doc__)
    else:
        datos = construir(leer_tipnr(), leer_traduccion())
        escribir_gz(SALIDA, datos)
        traducidas = sum(f[4] for f in datos["fichas"])
        print(f"Fichas: {len(datos['fichas'])} (traducidas: {traducidas}); Strongs: {len(datos['indice'])}")


if __name__ == "__main__":
    main()
