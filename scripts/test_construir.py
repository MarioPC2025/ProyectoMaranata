"""Tests de integridad de los datos generados.

Uso: python -m unittest discover -s scripts
Requieren haber corrido descargar.py y construir.py; si no hay datos, se omiten.
"""

import json
import struct
import unittest
from array import array
from pathlib import Path

from construir import CORRECCIONES, HUECOS_RV1909, Indice
from libros import LIBROS

DATOS = Path(__file__).resolve().parent.parent / "public" / "data"


class TestLibros(unittest.TestCase):
    def test_66_libros_con_ids_consecutivos(self):
        self.assertEqual([l[0] for l in LIBROS], list(range(1, 67)))
        self.assertEqual(len({l[1] for l in LIBROS}), 66)
        self.assertEqual(len({l[2] for l in LIBROS}), 66)


class TestIndice(unittest.TestCase):
    def setUp(self):
        # Mini Biblia: libro 1 con capítulos de 3 y 2 versículos; libro 2 con uno de 4.
        self.indice = Indice([[3, 2], [4]] + [[1]] * 64)

    def test_numeracion(self):
        self.assertEqual(self.indice.numero(1, 1, 1), 0)
        self.assertEqual(self.indice.numero(1, 2, 2), 4)
        self.assertEqual(self.indice.numero(2, 1, 1), 5)

    def test_fuera_de_rango(self):
        with self.assertRaises(KeyError):
            self.indice.numero(1, 1, 4)

    def test_correcciones_apuntan_a_versiculos_validos(self):
        for destino in CORRECCIONES.values():
            libro, _, _ = destino.split(".")
            self.assertIn(libro, {l[1] for l in LIBROS})


@unittest.skipUnless((DATOS / "xrefs.bin").exists(), "sin datos generados")
class TestDatosGenerados(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.meta = json.loads((DATOS / "indice.json").read_text(encoding="utf-8"))
        cls.indice = Indice(cls.meta["libros"])
        crudo = (DATOS / "xrefs.bin").read_bytes()
        magia, cls.version, cls.n, cls.r = struct.unpack_from("<4sIII", crudo)
        assert magia == b"MBXR"
        pos = 16
        cls.desp = array("I", crudo[pos : pos + 4 * (cls.n + 1)])
        pos += 4 * (cls.n + 1)
        cls.ini = array("H", crudo[pos : pos + 2 * cls.r])
        pos += 2 * cls.r
        cls.fin = array("H", crudo[pos : pos + 2 * cls.r])
        pos += 2 * cls.r
        cls.votos = array("h", crudo[pos : pos + 2 * cls.r])
        pos += 2 * cls.r
        cls.largo_sobrante = len(crudo) - pos

    def test_cantidades(self):
        self.assertEqual(self.meta["versiculos"], 31102)
        self.assertEqual(self.n, 31102)
        self.assertEqual(len(self.meta["libros"]), 66)
        self.assertEqual(sum(len(c) for c in self.meta["libros"]), 1189)
        # El archivo de OpenBible tiene 344.799 referencias; ninguna se descarta.
        self.assertEqual(self.r, 344799)
        self.assertEqual(self.largo_sobrante, 0)

    def test_desplazamientos_y_rangos(self):
        self.assertEqual(self.desp[0], 0)
        self.assertEqual(self.desp[-1], self.r)
        self.assertTrue(all(a <= b for a, b in zip(self.desp, self.desp[1:])))
        self.assertTrue(all(0 <= i <= f < self.n for i, f in zip(self.ini, self.fin)))

    def test_ordenadas_por_votos(self):
        for v in range(0, self.n, 997):
            votos = self.votos[self.desp[v] : self.desp[v + 1]]
            self.assertEqual(list(votos), sorted(votos, reverse=True))

    def destinos(self, libro, cap, vers):
        v = self.indice.numero(libro, cap, vers)
        return set(zip(self.ini[self.desp[v] : self.desp[v + 1]], self.fin[self.desp[v] : self.desp[v + 1]]))

    def test_casos_puntuales(self):
        # Gn 1:1 → Sal 115:15 y Jn 1:1-3
        gn11 = self.destinos(1, 1, 1)
        sal = self.indice.numero(19, 115, 15)
        self.assertIn((sal, sal), gn11)
        self.assertIn((self.indice.numero(43, 1, 1), self.indice.numero(43, 1, 3)), gn11)
        # Jn 3:16 tiene referencias
        self.assertGreater(len(self.destinos(43, 3, 16)), 10)

    def test_texto_rv1909(self):
        juan = json.loads((DATOS / "rv1909" / "43.json").read_text(encoding="utf-8"))
        self.assertIn("unigénito", juan[2][15])
        for id_, _, _ in LIBROS:
            caps = json.loads((DATOS / "rv1909" / f"{id_}.json").read_text(encoding="utf-8"))
            self.assertEqual([len(c) for c in caps], self.meta["libros"][id_ - 1])
            for c, versiculos in enumerate(caps, 1):
                for v, texto in enumerate(versiculos, 1):
                    if not texto.strip():
                        self.assertIn((id_, c, v), HUECOS_RV1909)
                        self.assertIn([id_, c], self.meta["rv1909Desalineados"])


if __name__ == "__main__":
    unittest.main()
