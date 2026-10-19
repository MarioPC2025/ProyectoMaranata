"""Glosas del hebreo en español: traducción de las glosas inglesas de TAHOT (STEPBible-Data, CC BY 4.0).

Uso:
  python scripts/glosas.py pendientes N   las N glosas sin traducir más frecuentes, una por línea
  python scripts/glosas.py agregar ARCHIVO  suma un lote "inglés<TAB>español" a data/glosas-hebreo.tsv
  python scripts/glosas.py aplicar        pone las glosas en español en public/data/original/

La traducción vive en data/glosas-hebreo.tsv (versionado); construir_original.py también la usa.
Se respeta el orden de las palabras del hebreo y las marcas de STEP: [ ] para lo que se
sobreentiende, < > para lo que no hace falta traducir y <obj.> para la marca de objeto.
"""

import gzip
import json
import re
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TRADUCCION = RAIZ / "data" / "glosas-hebreo.tsv"
ORIGINAL = RAIZ / "public" / "data" / "original"
ULTIMO_AT = 39  # Malaquías
ENCABEZADO = (
    "# Glosas del hebreo (TAHOT, STEPBible-Data, CC BY 4.0) traducidas al español.\n"
    "# Traducción automática, en revisión. Formato: glosa inglesa<TAB>glosa española.\n"
)
MARCAS = re.compile(r"[\[\]<>]")


def leer(ruta: Path = TRADUCCION) -> dict[str, str]:
    if not ruta.exists():
        return {}
    glosas = {}
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        if not linea or linea.startswith("#"):
            continue
        ingles, _, espanol = linea.partition("\t")
        if espanol.strip():
            glosas[ingles] = espanol.strip()
    return glosas


def escribir(glosas: dict[str, str], ruta: Path = TRADUCCION) -> None:
    filas = "".join(f"{en}\t{es}\n" for en, es in sorted(glosas.items()))
    ruta.write_text(ENCABEZADO + filas, encoding="utf-8")


def problema(ingles: str, espanol: str) -> str | None:
    """Por qué una traducción no sirve, o None si está bien."""
    if not espanol or "\t" in espanol:
        return "vacía o con tabulaciones"
    if MARCAS.findall(ingles) != MARCAS.findall(espanol):
        return "no conserva las marcas [ ] y < >"
    if "<obj.>" in ingles and "<obj.>" not in espanol:
        return "falta <obj.>"
    return None


def libros_at():
    for id_ in range(1, ULTIMO_AT + 1):
        ruta = ORIGINAL / f"{id_}.json.gz"
        yield ruta, json.loads(gzip.decompress(ruta.read_bytes()))


def frecuencias() -> Counter:
    return Counter(w[3] for _, caps in libros_at() for c in caps for v in c for w in v)


def pendientes(cantidad: int) -> list[str]:
    hechas = leer()
    return [g for g, _ in frecuencias().most_common() if g not in hechas][:cantidad]


def agregar(lote: Path) -> None:
    glosas = leer()
    existentes = set(frecuencias())
    nuevas, malas = 0, []
    for linea in lote.read_text(encoding="utf-8-sig").splitlines():
        if not linea.strip():
            continue
        ingles, _, espanol = linea.partition("\t")
        espanol = espanol.strip()
        motivo = "no es una glosa de TAHOT" if ingles not in existentes else problema(ingles, espanol)
        if motivo:
            malas.append(f"  {ingles!r} → {espanol!r}: {motivo}")
            continue
        nuevas += ingles not in glosas
        glosas[ingles] = espanol
    escribir(glosas)
    print(f"Agregadas: {nuevas} (total: {len(glosas)}); rechazadas: {len(malas)}")
    print("\n".join(malas))


def aplicar() -> None:
    glosas = leer()
    total = traducidas = 0
    for ruta, capitulos in libros_at():
        for capitulo in capitulos:
            for versiculo in capitulo:
                for palabra in versiculo:
                    palabra[2] = glosas.get(palabra[3], "")
                    total += 1
                    traducidas += bool(palabra[2])
        crudo = json.dumps(capitulos, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        ruta.write_bytes(gzip.compress(crudo, compresslevel=9, mtime=0))
    print(f"Palabras hebreas con glosa en español: {traducidas} de {total} ({traducidas / total:.1%})")


def main() -> None:
    orden = sys.argv[1] if len(sys.argv) > 1 else ""
    if orden == "pendientes":
        print("\n".join(pendientes(int(sys.argv[2]))))
    elif orden == "agregar":
        agregar(Path(sys.argv[2]))
    elif orden == "aplicar":
        aplicar()
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
