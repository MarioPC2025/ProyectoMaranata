"""Descarga los datos de origen a data/raw/ (no versionado).

Uso: python scripts/descargar.py
"""

import io
import urllib.request
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "data" / "raw"

FUENTES = {
    # Referencias cruzadas de OpenBible.info (CC BY)
    "openbible": "https://a.openbible.info/data/cross-references.zip",
    # Reina-Valera 1909, dominio público, formato VPL de eBible.org
    "rv1909": "https://ebible.org/Scriptures/spaRV1909_vpl.zip",
}


def descargar(nombre: str, url: str) -> None:
    destino = RAW / nombre
    if destino.exists() and any(destino.iterdir()):
        print(f"{nombre}: ya descargado, se omite")
        return
    print(f"{nombre}: descargando {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "ProyectoMaranata/0.1"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        datos = resp.read()
    destino.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(datos)) as z:
        for miembro in z.namelist():
            # Evita rutas que escapen de la carpeta de destino
            ruta = (destino / miembro).resolve()
            if not ruta.is_relative_to(destino.resolve()):
                raise ValueError(f"Ruta sospechosa en el zip: {miembro}")
        z.extractall(destino)
    print(f"{nombre}: listo en {destino.relative_to(RAIZ)}")


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    for nombre, url in FUENTES.items():
        descargar(nombre, url)


if __name__ == "__main__":
    main()
