"""Convierte los datos de data/raw/ en archivos compactos para public/data/.

Uso: python scripts/construir.py   (antes: python scripts/descargar.py)

Genera:
- indice.json      versículos por capítulo de cada libro (versificación KJV/OpenBible)
                   y los capítulos cuya RV1909 no está alineada con esa versificación
- xrefs.bin.gz     referencias cruzadas en binario, comprimido con gzip (formato abajo)
- rv1909/<id>.json texto RV1909 de cada libro: lista de capítulos, cada uno lista de versículos

Formato de xrefs.bin.gz, versión 2 (little endian, todo dentro de gzip). Cada versículo
se identifica con un entero 0..N-1 en orden canónico (Gn 1:1 = 0, Ap 22:21 = 31101).
  cabecera  4 bytes "MBXR", u32 versión, u32 N (versículos), u32 R (referencias)
  u16[N]    cantidad de referencias de cada versículo origen
  i16[R]    destino inicial, como diferencia: la primera referencia de cada origen respecto
            del origen y las siguientes respecto de la anterior
  u16[R]    largo del rango (destino final - destino inicial; 0 si es un solo versículo)
  i16[R]    votos de OpenBible.info
Dentro de cada origen, las referencias van ordenadas por destino. Cada arreglo se guarda
"en planos": primero los bytes bajos de todos sus valores y después los altos. Las
diferencias y los planos hacen que gzip lo comprima a menos de la mitad.
"""

import gzip
import json
import struct
import sys
from array import array
from pathlib import Path

from libros import LIBROS, POR_BW, POR_OSIS

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "data" / "raw"
SALIDA = RAIZ / "public" / "data"

VERSION_XREFS = 2

# Versículos que OpenBible cita con otra versificación. 3 Jn 1:15 de algunas
# ediciones es la segunda mitad de 3 Jn 1:14 en la versificación KJV.
CORRECCIONES = {"3John.1.15": "3John.1.14"}

# El VPL de eBible acomoda la versificación propia de la RV1909 en la grilla KJV:
# deja estos huecos vacíos y fusiona versículos en otro lugar del capítulo, así que
# el texto de los capítulos marcados no coincide versículo a versículo con la KJV.
# Pendiente para la fase 2: realinearlos con TVTMS. Mientras tanto la interfaz avisa.
HUECOS_RV1909 = {
    (4, 12, 16), (4, 29, 40), (9, 23, 29), (10, 20, 26), (14, 33, 25),
    (18, 35, 16), (18, 38, 39), (18, 38, 40), (18, 38, 41), (18, 40, 20),
    (18, 40, 21), (18, 40, 22), (18, 40, 23), (18, 40, 24), (28, 11, 12),
    (32, 1, 17), (44, 19, 41), (47, 13, 14),
}
CAPITULOS_DESALINEADOS = [
    (4, 12), (4, 13), (4, 29), (4, 30), (9, 23), (9, 24), (10, 20), (14, 33),
    (18, 35), (18, 38), (18, 39), (18, 40), (18, 41), (28, 11), (28, 12),
    (32, 1), (32, 2), (44, 19), (47, 13),
]


def leer_rv1909(ruta: Path) -> dict[int, list[list[str]]]:
    """Lee el VPL de eBible: 'GEN 1:1 texto' por línea."""
    libros: dict[int, list[list[str]]] = {id_: [] for id_, _, _ in LIBROS}
    for n, linea in enumerate(ruta.read_text(encoding="utf-8-sig").splitlines(), 1):
        if not linea.strip():
            continue
        codigo, cv, texto = linea.split(" ", 2)
        cap, vers = (int(x) for x in cv.split(":"))
        capitulos = libros[POR_BW[codigo]]
        if cap == len(capitulos) + 1:
            capitulos.append([])
        if cap != len(capitulos) or vers != len(capitulos[-1]) + 1:
            raise ValueError(f"Línea {n} fuera de orden: {codigo} {cv}")
        capitulos[-1].append(texto.strip())
    vacios = {
        (id_, c, v)
        for id_, caps in libros.items()
        for c, versiculos in enumerate(caps, 1)
        for v, t in enumerate(versiculos, 1)
        if not t
    }
    if vacios != HUECOS_RV1909:
        raise ValueError(f"Los huecos de la RV1909 cambiaron: {sorted(vacios ^ HUECOS_RV1909)}")
    return libros


class Indice:
    """Convierte (libro, capítulo, versículo) en el entero canónico y viceversa."""

    def __init__(self, conteos: list[list[int]]):
        self.conteos = conteos
        self.inicio: dict[tuple[int, int], int] = {}
        n = 0
        for id_, caps in enumerate(conteos, 1):
            for cap, cant in enumerate(caps, 1):
                self.inicio[(id_, cap)] = n
                n += cant
        self.total = n

    def numero(self, libro: int, cap: int, vers: int) -> int:
        if not 1 <= vers <= self.conteos[libro - 1][cap - 1]:
            raise KeyError((libro, cap, vers))
        return self.inicio[(libro, cap)] + vers - 1

    def desde_osis(self, ref: str) -> int:
        libro, cap, vers = CORRECCIONES.get(ref, ref).split(".")
        return self.numero(POR_OSIS[libro], int(cap), int(vers))


def leer_referencias(ruta: Path, indice: Indice):
    """Devuelve una lista por versículo origen de (destino_ini, destino_fin, votos) y las descartadas."""
    por_origen: list[list[tuple[int, int, int]]] = [[] for _ in range(indice.total)]
    descartadas = []
    lineas = ruta.read_text(encoding="utf-8").splitlines()
    for linea in lineas[1:]:  # la primera es la cabecera
        if not linea.strip():
            continue
        origen, destino, votos = linea.split("\t")[:3]
        try:
            o = indice.desde_osis(origen)
            ini, _, fin = destino.partition("-")
            d1 = indice.desde_osis(ini)
            d2 = indice.desde_osis(fin) if fin else d1
        except (KeyError, IndexError, ValueError):
            descartadas.append(linea)
            continue
        if d2 < d1:
            d1, d2 = d2, d1
        por_origen[o].append((d1, d2, int(votos)))
    for refs in por_origen:
        refs.sort()
    return por_origen, descartadas


def _en_planos(a: array) -> bytes:
    """Bytes bajos de todos los valores (u16/i16, little endian) y después los altos."""
    if sys.byteorder != "little":
        a = array(a.typecode, a)
        a.byteswap()
    crudo = a.tobytes()
    return crudo[0::2] + crudo[1::2]


def _de_planos(crudo: bytes, typecode: str) -> array:
    mitad = len(crudo) // 2
    intercalado = bytearray(len(crudo))
    intercalado[0::2] = crudo[:mitad]
    intercalado[1::2] = crudo[mitad:]
    a = array(typecode, bytes(intercalado))
    if sys.byteorder != "little":
        a.byteswap()
    return a


def escribir_xrefs(ruta: Path, por_origen) -> int:
    conteos, deltas, largos, votos = array("H"), array("h"), array("H"), array("h")
    for origen, refs in enumerate(por_origen):
        conteos.append(len(refs))
        anterior = origen
        for d1, d2, v in refs:
            deltas.append(d1 - anterior)
            anterior = d1
            largos.append(d2 - d1)
            votos.append(max(-32768, min(32767, v)))
    cuerpo = b"MBXR" + struct.pack("<III", VERSION_XREFS, len(por_origen), len(deltas))
    cuerpo += b"".join(_en_planos(a) for a in (conteos, deltas, largos, votos))
    # mtime=0: el mismo contenido da siempre el mismo archivo (no ensucia git)
    ruta.write_bytes(gzip.compress(cuerpo, compresslevel=9, mtime=0))
    return len(deltas)


def leer_xrefs(ruta: Path):
    """Decodifica xrefs.bin.gz. Devuelve (N, desp, inicio, fin, votos) con valores absolutos."""
    crudo = gzip.decompress(ruta.read_bytes())
    magia, version, n, r = struct.unpack_from("<4sIII", crudo)
    if magia != b"MBXR" or version != VERSION_XREFS:
        raise ValueError("xrefs.bin.gz inválido")
    pos = 16
    partes = []
    for largo, tipo in ((n, "H"), (r, "h"), (r, "H"), (r, "h")):
        partes.append(_de_planos(crudo[pos : pos + 2 * largo], tipo))
        pos += 2 * largo
    if pos != len(crudo):
        raise ValueError("xrefs.bin.gz con tamaño inesperado")
    conteos, deltas, largos, votos = partes
    desp = array("I", [0])
    inicio, fin = array("H"), array("H")
    i = 0
    for origen, cant in enumerate(conteos):
        anterior = origen
        for _ in range(cant):
            anterior += deltas[i]
            inicio.append(anterior)
            fin.append(anterior + largos[i])
            i += 1
        desp.append(i)
    return n, desp, inicio, fin, votos


def main() -> None:
    libros = leer_rv1909(RAW / "rv1909" / "spaRV1909_vpl.txt")
    conteos = [[len(c) for c in libros[id_]] for id_, _, _ in LIBROS]
    indice = Indice(conteos)

    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / "indice.json").write_text(
        json.dumps(
            {
                "versiculos": indice.total,
                "libros": conteos,
                "rv1909Desalineados": CAPITULOS_DESALINEADOS,
            },
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )

    carpeta_rv = SALIDA / "rv1909"
    carpeta_rv.mkdir(exist_ok=True)
    for id_, capitulos in libros.items():
        (carpeta_rv / f"{id_}.json").write_text(
            json.dumps(capitulos, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )

    por_origen, descartadas = leer_referencias(RAW / "openbible" / "cross_references.txt", indice)
    viejo = SALIDA / "xrefs.bin"  # formato 1, reemplazado por xrefs.bin.gz
    if viejo.exists():
        viejo.unlink()
    total = escribir_xrefs(SALIDA / "xrefs.bin.gz", por_origen)

    print(f"Versículos: {indice.total}")
    print(f"Referencias: {total} (descartadas: {len(descartadas)})")
    for linea in descartadas[:20]:
        print(f"  descartada: {linea}")


if __name__ == "__main__":
    main()
