"""Tests de los datos de idiomas originales (construir_original.py).

Uso: python -m unittest discover -s scripts
Los de datos generados se omiten si todavía no se corrió construir_original.py.
"""

import gzip
import json
import unittest
from pathlib import Path

from construir_original import REF, palabra_griega, palabra_hebrea, principal, resolver
from morfologia import VALORES, describir

DATOS = Path(__file__).resolve().parent.parent / "public" / "data"


def leer_gz(ruta: Path):
    return json.loads(gzip.decompress(ruta.read_bytes()))


class TestParseo(unittest.TestCase):
    def test_referencias(self):
        m = REF.match("Gen.31.55(32.1)#01=L")
        self.assertEqual(m.groups(), ("Gen", "31", "55", "01", "L"))
        self.assertEqual(REF.match("Act.2.11[2.10]#03=NKO").group(4), "03")

    def test_strong_principal(self):
        self.assertEqual(principal("H9003/{H7225G}"), (["H9003", "H7225G"], 1))
        self.assertEqual(principal("H9009/{H0776G}\\H9016"), (["H9009", "H0776G"], 1))
        self.assertEqual(principal("{H0045}+\\H9014"), (["H0045"], 0))

    def test_resolver_contra_el_lexico(self):
        lexico = {"G2453G": [], "G3700": [], "H7225G": []}
        self.assertEqual(resolver("H7225G", lexico), "H7225G")
        self.assertEqual(resolver("G2453", lexico), "G2453G")
        self.assertEqual(resolver("G3700H", lexico), "G3700")
        self.assertEqual(resolver("G9999", lexico), "G9999")

    def test_palabra_hebrea(self):
        fila = ["Gen.1.1#01=L", "בְּ/רֵאשִׁ֖ית", "be./re.Shit", "in/ beginning", "H9003/{H7225G}", "HR/Ncfsa"]
        palabra, strong, morf = palabra_hebrea(fila)
        self.assertEqual(palabra[0], "בְּרֵאשִׁ֖ית")
        self.assertEqual((strong, morf, palabra[3]), ("H7225G", "HNcfsa", "in beginning"))
        # En arameo el prefijo de idioma es A
        fila_aramea = ["Dan.2.4#05=L", "x", "x", "x", "H9001/{H0001}", "AR/Aabsa"]
        self.assertEqual(palabra_hebrea(fila_aramea)[2], "AAabsa")

    def test_palabra_griega_y_marcas(self):
        fila = ["Jhn.1.1#05=NKO", "λόγος, (logos)", "Word,", "G3056=N-NSM", "λόγος=word", "", "", "", "Palabra"]
        palabra, strong, morf = palabra_griega(fila, "NKO")
        self.assertEqual(palabra[:3], ["λόγος,", "logos", "Palabra"])
        self.assertEqual((strong, morf, palabra[6]), ("G3056", "N-NSM", 0))
        self.assertEqual(palabra_griega(fila, "K")[0][6], 1)  # solo en el TR
        self.assertEqual(palabra_griega(fila, "NO")[0][6], 2)  # solo en Nestle-Aland
        self.assertIsNone(palabra_griega(fila, "ko"))  # solo variantes menores

    def test_morfologia_en_espanol(self):
        rasgos = {"Function": "Verb", "Stem": "Qal", "Form": "Perfect", "Person": "Third"}
        self.assertEqual(describir(rasgos), "Verbo, qal perfecto 3.ª persona")
        self.assertIn("Noun", VALORES)


@unittest.skipUnless((DATOS / "original" / "1.json.gz").exists(), "sin datos generados")
class TestDatosOriginales(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.meta = json.loads((DATOS / "indice.json").read_text(encoding="utf-8"))
        cls.libros = {i: leer_gz(DATOS / "original" / f"{i}.json.gz") for i in range(1, 67)}
        cls.morfologia = json.loads((DATOS / "morfologia.json").read_text(encoding="utf-8"))

    def test_forma_y_cantidades(self):
        total = {"AT": 0, "NT": 0}
        for id_, capitulos in self.libros.items():
            self.assertEqual([len(c) for c in capitulos], self.meta["libros"][id_ - 1])
            total["AT" if id_ <= 39 else "NT"] += sum(len(v) for c in capitulos for v in c)
        # TAHOT tiene ~305 mil palabras y TAGNT ~139 mil en NA o TR
        self.assertGreater(total["AT"], 300000)
        self.assertGreater(total["NT"], 135000)

    def test_casi_todos_los_versiculos_tienen_palabras(self):
        vacios = [
            (id_, c + 1, v + 1)
            for id_, capitulos in self.libros.items()
            for c, versiculos in enumerate(capitulos)
            for v, palabras in enumerate(versiculos)
            if not palabras
        ]
        # Unos pocos versículos KJV no existen en los textos críticos (p. ej. Mt 17:21)
        self.assertLess(len(vacios), 20, vacios)

    def test_casos_puntuales(self):
        gn = self.libros[1][0][0]
        self.assertEqual(gn[0][4], "H9003/{H7225G}")
        self.assertEqual(gn[1][4], "H1254A")  # una sola parte: sin llaves
        jn = self.libros[43][0][0]
        self.assertEqual(jn[4][0], "λόγος,")  # normalizado a NFC (tonos, no oxia)
        self.assertEqual(jn[4][2], "Palabra")
        # Título del Salmo 3 al comienzo del versículo 1
        self.assertEqual(self.libros[19][2][0][0][6], 3)

    def test_morfologia_y_lexico_completos(self):
        lexico = {**leer_gz(DATOS / "lexico" / "H.json.gz"), **leer_gz(DATOS / "lexico" / "G.json.gz")}
        sin_lexico = set()
        for capitulos in self.libros.values():
            for c in capitulos:
                for v in c:
                    for p in v:
                        self.assertIn(p[5], self.morfologia)
                        partes = [s.strip("{}") for s in p[4].split("/")]
                        if not any(s in lexico for s in partes):
                            sin_lexico.add(p[4])
        self.assertLess(len(sin_lexico), 50, sorted(sin_lexico)[:20])

    def test_concordancia(self):
        bloque = leer_gz(DATOS / "concordancia" / "G6.json.gz")  # G3000-G3499
        deltas = bloque["G3056"]
        versiculos = [sum(deltas[: i + 1]) for i in range(len(deltas))]
        jn11 = sum(self.meta["libros"][i][j] for i in range(42) for j in range(len(self.meta["libros"][i])))
        self.assertIn(jn11, versiculos)
        self.assertEqual(versiculos, sorted(set(versiculos)))


if __name__ == "__main__":
    unittest.main()
