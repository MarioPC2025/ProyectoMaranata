"""Tests de las fichas de nombres propios (nombres.py).

Uso: python -m unittest discover -s scripts
"""

import unittest

from nombres import bloques, construir, leer_registro, limpiar, lista, referencia

AARON = [
    "$========== PERSON(s)",
    "Aaron@Exo.4.14-Heb=H0175\tHigh Priest\tAmram@Exo.6.18-1Ch + Jochebed@Exo.6.20-Num\t"
    "Moses@Exo.2.10-Rev, Miriam@Exo.15.20-Mic\t\tNadab@Exo.6.23-1Ch\tTribe of Levi\t#Resumen\tMale",
    "– Named\tAaron@Exo.4.14-Heb\tH0175«H0175=אַהֲרֹן\tAaron\tExo.4.14; Exo.7.10a; Exo.7.10b",
    "– Greek\tAaron@Exo.4.14-Heb\tG0002«G0002=Ἀαρών\tAaron\t\tLuk.1.5",
    "– Total\tAaron\tAaron\tH0175, G0002\tExo.4.14; Luk.1.5",
    "@Brief= Moses' brother, first high priest of Israel",
    "@Short= Aaron was Moses' older brother.",
    "$========== PERSON(s)",
    "Moses@Exo.2.10-Rev=H4872\tProphet\t + \t\t\t\t\t#\tMale",
    "– Named\tMoses@Exo.2.10-Rev\tH4872«H4872=מֹשֶׁה\tMoses\tExo.2.10",
    "$========== EXCLUDED OTHER",
    "Algo@Gen.1.1=H9999\tx",
    "$========== PLACE",
    "Bethel@Gen.12.8-Zec=H1008G\tBethel_1\t\t\t\t\t\t#\tPlace",
    "– Named\tLuz|Bethel@Gen.12.8-Zec\tH3870H«H3870=לוּז\tLuz\tGen.28.19",
]


class TestNombres(unittest.TestCase):
    def test_bloques_y_tipos(self):
        tipos = [t for t, _ in bloques(AARON)]
        self.assertEqual(tipos, ["P", "P", "L"])  # los EXCLUDED se saltean

    def test_referencias_y_listas(self):
        self.assertEqual(referencia("Exo.4.14-Heb"), [2, 4, 14])
        self.assertEqual(referencia("1Ki.4.6"), [11, 4, 6])
        self.assertIsNone(referencia("Xyz.1.1"))
        self.assertEqual(lista("Canaan@Gen.9.18-1Ch(d) + "), ["Canaan@Gen.9.18-1Ch"])
        self.assertEqual(lista("A@Gen.1.1, B@Gen.1.2(?)"), ["A@Gen.1.1", "B@Gen.1.2"])

    def test_limpiar(self):
        texto = 'Rome was the capital (<ref="Act.28.16">Act.28.16</ref>). (Multiple references, see article for details)'
        self.assertEqual(limpiar(texto), "Rome was the capital (Act.28.16).")

    def test_registro(self):
        tipo, lineas = next(bloques(AARON))
        r = leer_registro(tipo, lineas)
        self.assertEqual((r["id"], r["nombre"], r["primera"]), ("Aaron@Exo.4.14-Heb", "Aaron", [2, 4, 14]))
        self.assertEqual(r["strongs"], ["H0175", "G0002"])
        self.assertEqual(len(r["versiculos"]), 3)  # 7.10a y 7.10b son uno; el Total no cuenta
        self.assertEqual(r["familia"][0], ["Amram@Exo.6.18-1Ch", "Jochebed@Exo.6.20-Num"])
        self.assertEqual(r["breve"], "Moses' brother, first high priest of Israel")

    def test_construir_con_y_sin_traduccion(self):
        registros = [leer_registro(t, b) for t, b in bloques(AARON) if t]
        datos = construir(registros, {"Aaron@Exo.4.14-Heb": ["Aarón", "Hermano de Moisés", "Resumen."]})
        aaron, moises, betel = datos["fichas"]
        self.assertEqual(aaron[:5], ["P", "Aarón", "Hermano de Moisés", "Resumen.", 1])
        self.assertEqual(aaron[6], [1])  # Moisés es la ficha 1; Miriam no está
        self.assertEqual(moises[1:5], ["Moses", "", "", 0])
        self.assertEqual(betel[1], "Bethel")
        self.assertEqual(datos["indice"], {"H0175": 0, "G0002": 0, "H4872": 1, "H3870H": 2})


if __name__ == "__main__":
    unittest.main()
