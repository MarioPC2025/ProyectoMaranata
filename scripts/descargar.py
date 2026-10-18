"""Descarga los datos de origen a data/raw/ (no versionado).

Uso: python scripts/descargar.py
"""

import io
import urllib.parse
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

# STEPBible-Data (Tyndale House Cambridge, CC BY 4.0), fijado a un commit para que la
# construcción sea reproducible. Para actualizar: cambiar el commit y volver a construir.
STEP_COMMIT = "ed476a8ee6e3f7b3a46fc48af6c7dabc02387b1d"
STEP_ARCHIVOS = {
    "TAHOT Gen-Deu.txt": "Translators Amalgamated OT+NT/TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    "TAHOT Jos-Est.txt": "Translators Amalgamated OT+NT/TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    "TAHOT Job-Sng.txt": "Translators Amalgamated OT+NT/TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    "TAHOT Isa-Mal.txt": "Translators Amalgamated OT+NT/TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
    "TAGNT Mat-Jhn.txt": "Translators Amalgamated OT+NT/TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
    "TAGNT Act-Rev.txt": "Translators Amalgamated OT+NT/TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
    "TBESH.txt": "Lexicons/TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt",
    "TBESG.txt": "Lexicons/TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt",
    "TEHMC.txt": "Morphology codes/TEHMC - Translators Expansion of Hebrew Morphology Codes - STEPBible.org CC BY.txt",
    "TEGMC.txt": "Morphology codes/TEGMC - Translators Expansion of Greek Morphhology Codes - STEPBible.org CC BY.txt",
    "TIPNR.txt": "Proper Nouns/TIPNR - Translators Individualised Proper Names with all References - STEPBible.org CC BY.txt",
    "TVTMS.txt": "Versification/TVTMS - Translators Versification Traditions with Methodology for Standardisation for Eng+Heb+Lat+Grk+Others - STEPBible.org CC BY.txt",
}


def descargar_step() -> None:
    destino = RAW / "step"
    destino.mkdir(parents=True, exist_ok=True)
    for nombre, ruta in STEP_ARCHIVOS.items():
        archivo = destino / nombre
        if archivo.exists():
            print(f"step/{nombre}: ya descargado, se omite")
            continue
        url = (
            "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/"
            f"{STEP_COMMIT}/{urllib.parse.quote(ruta)}"
        )
        print(f"step/{nombre}: descargando")
        req = urllib.request.Request(url, headers={"User-Agent": "ProyectoMaranata/0.1"})
        with urllib.request.urlopen(req, timeout=300) as resp:
            archivo.write_bytes(resp.read())


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
    descargar_step()


if __name__ == "__main__":
    main()
