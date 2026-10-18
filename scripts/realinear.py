"""Realineación de la RV1909 de eBible a la versificación KJV.

El VPL de eBible acomoda la numeración propia de la RV1909 en la grilla KJV: en 18
capítulos el texto queda corrido (el último versículo KJV de un capítulo está al comienzo
del siguiente) y algunos casilleros juntan dos o más versículos KJV. Acá se dice, para cada
versículo KJV afectado, de qué casillero sale su texto y, si ese casillero junta varios, en
qué frase empieza cada uno. Se armó comparando versículo por versículo con el texto
hebreo/griego de STEP (que está en versificación KJV).

El texto no se modifica: solo se reparte (y se pasan a minúsculas las mayúsculas de comienzo
de capítulo que quedan en el medio, ver MAYUSCULAS). Cada marcador tiene que aparecer
exactamente una vez en su casillero; si la fuente cambia, el build falla en lugar de cortar mal.
"""

# (libro, capítulo KJV, versículo KJV) → (capítulo del casillero, versículo del casillero)
Regla = tuple[int, int, int]


def _corrida(reglas, libro, cap_kjv, versos, cap_casillero, delta):
    """KJV cap_kjv:v ← casillero cap_casillero:(v + delta) para cada v de versos."""
    for v in versos:
        reglas[(libro, cap_kjv, v)] = (cap_casillero, v + delta, None)


def _cortes(reglas, libro, cap_casillero, vers_casillero, partes):
    """Un casillero que junta varios versículos KJV: [(cap, vers, frase con la que empieza)].
    La primera parte empieza al comienzo del casillero (su frase es None)."""
    for i, (cap, vers, inicio) in enumerate(partes):
        fin = partes[i + 1][2] if i + 1 < len(partes) else None
        reglas[(libro, cap, vers)] = (cap_casillero, vers_casillero, (inicio, fin))


def _armar():
    r = {}
    # Números 12–13: Nm 12:16 está al comienzo del cap. 13
    _corrida(r, 4, 12, [16], 13, -15)
    _corrida(r, 4, 13, range(1, 32), 13, 1)
    _cortes(r, 4, 13, 33, [(13, 32, None), (13, 33, "También vimos allí gigantes")])
    # Números 29–30
    _corrida(r, 4, 29, [40], 30, -39)
    _corrida(r, 4, 30, range(1, 15), 30, 1)
    _cortes(r, 4, 30, 16, [(30, 15, None), (30, 16, "Estas son las ordenanzas")])
    # 1 Samuel 23–24
    _corrida(r, 9, 23, [29], 24, -28)
    _corrida(r, 9, 24, range(1, 21), 24, 1)
    _cortes(r, 9, 24, 22, [(24, 21, None), (24, 22, "Entonces David juró á Saúl")])
    # 2 Samuel 20
    _cortes(r, 10, 20, 25, [(20, 25, None), (20, 26, "é Ira Jaireo")])
    # 2 Crónicas 33: el versículo 10 junta 10 y 11, y desde ahí todo está corrido
    _cortes(r, 14, 33, 10, [(33, 10, None), (33, 11, "por lo cual Jehová trajo")])
    _corrida(r, 14, 33, range(12, 26), 33, -1)
    # Job 35
    _cortes(r, 18, 35, 15, [(35, 15, None), (35, 16, "por eso Job abrió")])
    # Job 38–40: el cap. 39 empieza con Job 38:39; el último casillero del 39 junta
    # 39:27–30 y 40:1–5; el cap. 40 empieza con Job 40:6
    _corrida(r, 18, 38, [39, 40, 41], 39, -38)
    _corrida(r, 18, 39, range(1, 27), 39, 3)
    _cortes(
        r, 18, 39, 30,
        [
            (39, 27, None),
            (39, 28, "Ella habita y está en la piedra"),
            (39, 29, "Desde allí acecha la comida"),
            (39, 30, "Sus pollos chupan la sangre"),
            (40, 1, "A más de eso respondió Jehová"),
            (40, 2, "¿Es sabiduría contender"),
            (40, 3, "Y respondió Job á Jehová"),
            (40, 4, "He aquí que yo soy vil"),
            (40, 5, "Una vez hablé"),
        ],
    )
    _corrida(r, 18, 40, range(6, 25), 40, -5)
    # Oseas 11–12
    _corrida(r, 28, 11, [12], 12, -11)
    _corrida(r, 28, 12, range(1, 13), 12, 1)
    _cortes(r, 28, 12, 14, [(12, 13, None), (12, 14, "Enojado ha Ephraim")])
    # Jonás 1–2
    _corrida(r, 32, 1, [17], 2, -16)
    _corrida(r, 32, 2, range(1, 9), 2, 1)
    _cortes(r, 32, 2, 10, [(2, 9, None), (2, 10, "Y mandó Jehová al pez")])
    # Hechos 19
    _cortes(r, 44, 19, 40, [(19, 40, None), (19, 41, "Y habiendo dicho esto")])
    # 2 Corintios 13
    _cortes(r, 47, 13, 12, [(13, 12, None), (13, 13, "Todos los santos os saludan")])
    _corrida(r, 47, 13, [14], 13, -1)
    return r


REGLAS = _armar()

# La RV1909 escribe en mayúsculas la primera palabra de cada capítulo. Estos versículos
# eran el comienzo de un capítulo en la numeración española y en la KJV quedan en el medio:
# se pasan a minúsculas (a mano, para no tocar nombres propios como "MOISÉS").
MAYUSCULAS = {
    (4, 12, 16): ("Y DESPUÉS", "Y después"),
    (4, 29, 40): ("Y MOISÉS", "Y Moisés"),
    (9, 23, 29): ("ENTONCES", "Entonces"),
    (18, 38, 39): ("¿CAZARÁS", "¿Cazarás"),
    (18, 40, 6): ("ENTONCES", "Entonces"),
    (28, 11, 12): ("CERCÓME", "Cercóme"),
    (32, 1, 17): ("MAS", "Mas"),
}


def _tramo(texto: str, inicio: str | None, fin: str | None, donde) -> str:
    for marca in (inicio, fin):
        if marca is not None and texto.count(marca) != 1:
            raise ValueError(f"El marcador {marca!r} no aparece una sola vez en {donde}")
    desde = texto.index(inicio) if inicio else 0
    hasta = texto.index(fin) if fin else len(texto)
    return texto[desde:hasta].strip()


def realinear(libros: dict[int, list[list[str]]]) -> dict[int, list[list[str]]]:
    """Devuelve una copia con los capítulos afectados en versificación KJV."""
    nuevos = {id_: [list(c) for c in caps] for id_, caps in libros.items()}
    for (libro, cap, vers), (cap_c, vers_c, corte) in REGLAS.items():
        texto = libros[libro][cap_c - 1][vers_c - 1]
        if corte:
            texto = _tramo(texto, *corte, donde=f"{libro} {cap_c}:{vers_c}")
        if (libro, cap, vers) in MAYUSCULAS:
            antes, despues = MAYUSCULAS[(libro, cap, vers)]
            if not texto.startswith(antes):
                raise ValueError(f"{libro} {cap}:{vers} no empieza con {antes!r}")
            texto = despues + texto[len(antes) :]
        nuevos[libro][cap - 1][vers - 1] = texto
    return nuevos
