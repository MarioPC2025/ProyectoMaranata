"""Códigos de morfología de STEPBible (TEHMC para hebreo/arameo, TEGMC para griego) en español.

Los archivos describen cada código como rasgos en inglés ("Function=Noun; Gender=Feminine").
Acá se traduce cada valor con un vocabulario fijo y se arma una descripción breve.
"""

import re
from pathlib import Path

# Valores en inglés → español. Lo que está antes de " (hence" en los de TEHMC.
VALORES = {
    # Función
    "Adjective": "adjetivo", "Adverb": "adverbio", "Conjunction": "conjunción", "Noun": "sustantivo",
    "Particle": "partícula", "Preposition": "preposición", "Pronoun": "pronombre", "Suffix": "sufijo",
    "Verb": "verbo", "Adverb or adverb and particle combined": "adverbio",
    "Aramaic transliterated word": "palabra aramea transliterada",
    "Correlative or Interrogative pronoun": "pronombre correlativo o interrogativo",
    "Correlative pronoun": "pronombre correlativo", "Definite article": "artículo definido",
    "Demonstrative pronoun": "pronombre demostrativo",
    "Demonstrative pronoun+Conjunction": "pronombre demostrativo con conjunción",
    "Indeclinable Noun of Other type": "sustantivo indeclinable",
    "Indeclinable Proper Noun": "nombre propio indeclinable", "Indefinite pronoun": "pronombre indefinido",
    "Interjection": "interjección", "Interrogative Particle": "partícula interrogativa",
    "Interrogative pronoun": "pronombre interrogativo", "Negative Particle": "partícula negativa",
    "Particle or Disjunctive": "partícula", "Personal pronoun": "pronombre personal",
    "Possessive pronoun": "pronombre posesivo", "Reciprocal pronoun": "pronombre recíproco",
    "Reflexive pronoun": "pronombre reflexivo", "Relative pronoun": "pronombre relativo",
    # Forma (hebreo)
    "Common": "común", "Conditional": "condicional", "Conjunction+Imperfect": "imperfecto con conjunción",
    "Consecutive": "consecutivo", "Consecutive Imperfect": "imperfecto consecutivo",
    "Consecutive Perfect": "perfecto consecutivo", "Definite": "definido",
    "Definite article (Aramaic)": "artículo definido (arameo)",
    "Definite article (Hebrew)": "artículo definido", "Demonstrative": "demostrativo",
    "Directional": "direccional", "Gentilic": "gentilicio", "Imperative": "imperativo",
    "Imperfect": "imperfecto", "Infinitive": "infinitivo", "Interrogative": "interrogativo",
    "Negative": "negativo", "Numerical": "numeral", "Numerical position": "ordinal",
    "Object indicator": "marca de objeto", "Paragogic Hé": "he paragógica",
    "Paragogic Nun": "nun paragógica", "Participle": "participio", "Participle passive": "participio pasivo",
    "Perfect": "perfecto", "Personal": "personal", "Proper": "propio", "Relative": "relativo",
    "Title": "título",
    # Raíz verbal hebrea/aramea (se dejan los nombres técnicos)
    "Aphel": "aphel", "Haphel": "haphel", "Hiphil": "hifil", "Hishtaphel": "hishtafel",
    "Hithpael": "hitpael", "Hitpaal": "hitpaal", "Hitpael": "hitpael", "Hitpeel": "hitpeel",
    "Hophal": "hofal", "Hothpaal": "hotpaal", "Ishtaphel": "ishtafel", "Niphal": "nifal",
    "Nithpael": "nitpael", "Pael": "pael", "Peal": "peal", "Peil": "peil", "Piel": "piel",
    "Polal": "polal", "Pual": "pual", "Qal": "qal", "Shaphel": "shafel", "Tiphil": "tifil",
    # Género, número, persona, estado
    "Either gender": "común", "Feminine": "femenino", "Masculine": "masculino", "Neuter": "neutro",
    "Location": "lugar", "Dual": "dual", "Plural": "plural", "Singular": "singular",
    "First": "1.ª persona", "Second": "2.ª persona", "Third": "3.ª persona",
    "1st": "1.ª persona", "1st Person": "1.ª persona", "2nd": "2.ª persona", "2nd Person": "2.ª persona",
    "2nd Plural": "2.ª persona plural", "2nd Singular": "2.ª persona singular", "3rd": "3.ª persona",
    "Absolute": "absoluto", "Construct": "constructo",
    # Modo, voz, tiempo, caso (griego y hebreo)
    "Cohortative": "cohortativo", "Indicative": "indicativo", "Indicative/cohortative": "indicativo o cohortativo",
    "Indicative/jussive": "indicativo o yusivo", "Jussive": "yusivo", "jussive": "yusivo",
    "Optative": "optativo", "Subjunctive": "subjuntivo",
    "Active": "activa", "Passive": "pasiva", "Reflexive/iterative": "reflexiva o iterativa",
    "Middle": "media", "Middle Deponent": "media deponente", "Middle or Passive": "media o pasiva",
    "Middle or Passive Deponent": "media o pasiva deponente", "Passive Deponent": "pasiva deponente",
    "impersonal active": "activa impersonal", "indefinite voice": "voz indefinida",
    "2nd Aorist": "aoristo segundo", "2nd Future": "futuro segundo", "2nd Perfect": "perfecto segundo",
    "2nd Pluperfect": "pluscuamperfecto segundo", "2nd Present": "presente segundo", "Aorist": "aoristo",
    "Future": "futuro", "Pluperfect": "pluscuamperfecto", "Present": "presente",
    "indefinite tense": "tiempo indefinido",
    "Accusative": "acusativo", "Dative": "dativo", "Genitive": "genitivo", "Nominative": "nominativo",
    "Vocative": "vocativo",
    # Extras
    "Abbreviated": "abreviado", "Abbreviated Numeral": "numeral abreviado", "Aeolic": "eólico",
    "Apocopated form": "forma apocopada", "Attic Greek form": "forma ática", "Comparative": "comparativo",
    "Contracted form": "forma contracta", "IRRegular or impure form": "forma irregular",
    "Indeclinable Letter": "letra indeclinable", "Numeral": "numeral", "Superlative": "superlativo",
    "Transitive": "transitivo", "Indeclinable Numeral": "numeral indeclinable",
    "Individual": "persona", "Individual Gentilic": "gentilicio", "Location Gentilic": "gentilicio de lugar",
    "Person Gentilic": "gentilicio", "Person name Transcribed from Aramaic": "nombre transcrito del arameo",
    "Title Gentilic": "título gentilicio", "Type": "tipo",
    "Title Transcribed from Aramaic": "título transcrito del arameo",
    "Title Transcribed from Hebrew": "título transcrito del hebreo",
    "Transcribed from Aramaic": "transcrito del arameo", "Transcribed from Hebrew": "transcrito del hebreo",
}

# Orden en el que se arman las descripciones
ORDEN = [
    "Function", "Stem", "Form", "Tense", "Voice", "Mood", "Person", "Case", "Gender", "Number",
    "State", "Extra", "Adj.Numb.", "Name type", "Original language", "Name in Original language",
]


def _limpiar(valor: str) -> str:
    return valor.split(" (hence")[0].strip().rstrip(")").strip()


def leer_codigos(ruta: Path) -> dict[str, dict[str, str]]:
    """{código: {rasgo: valor en inglés}} de un archivo TEHMC/TEGMC."""
    codigos = {}
    for linea in ruta.read_text(encoding="utf-8-sig", errors="replace").splitlines():
        m = re.match(r"^([A-Z][A-Za-z0-9\-]*)\t(\w[^\t]*=.*)$", linea)
        if not m:
            continue
        rasgos = {}
        for par in re.split(r"\s*;\s*", m.group(2).strip()):
            if "=" in par:
                k, v = par.split("=", 1)
                v = _limpiar(v)
                if v:
                    rasgos[k.strip()] = v
        codigos[m.group(1)] = rasgos
    return codigos


def describir(rasgos: dict[str, str]) -> str:
    """Descripción en español, por ejemplo "sustantivo común, femenino singular, absoluto"."""
    partes = []
    for clave in ORDEN:
        if clave in rasgos:
            partes.append(VALORES.get(rasgos[clave], rasgos[clave]))
    if not partes:
        return ""
    texto = partes[0]
    if len(partes) > 1:
        texto += ", " + " ".join(partes[1:])
    return texto[0].upper() + texto[1:]


def faltantes(codigos: dict[str, dict[str, str]]) -> set[str]:
    """Valores sin traducción (para los tests)."""
    return {
        v for rasgos in codigos.values() for k, v in rasgos.items() if k in ORDEN and v not in VALORES
    }
