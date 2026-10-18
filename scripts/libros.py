"""Tabla canónica de los 66 libros: id (1-66) y códigos de cada fuente.

El id es el mismo que usa el frontend (src/lib/biblia/libros.ts).
"""

# (id, código OpenBible/OSIS, código BibleWorks del VPL de eBible)
LIBROS = [
    (1, "Gen", "GEN"), (2, "Exod", "EXO"), (3, "Lev", "LEV"), (4, "Num", "NUM"),
    (5, "Deut", "DEU"), (6, "Josh", "JOS"), (7, "Judg", "JDG"), (8, "Ruth", "RUT"),
    (9, "1Sam", "1SA"), (10, "2Sam", "2SA"), (11, "1Kgs", "1KI"), (12, "2Kgs", "2KI"),
    (13, "1Chr", "1CH"), (14, "2Chr", "2CH"), (15, "Ezra", "EZR"), (16, "Neh", "NEH"),
    (17, "Esth", "EST"), (18, "Job", "JOB"), (19, "Ps", "PSA"), (20, "Prov", "PRO"),
    (21, "Eccl", "ECC"), (22, "Song", "SOL"), (23, "Isa", "ISA"), (24, "Jer", "JER"),
    (25, "Lam", "LAM"), (26, "Ezek", "EZE"), (27, "Dan", "DAN"), (28, "Hos", "HOS"),
    (29, "Joel", "JOE"), (30, "Amos", "AMO"), (31, "Obad", "OBA"), (32, "Jonah", "JON"),
    (33, "Mic", "MIC"), (34, "Nah", "NAH"), (35, "Hab", "HAB"), (36, "Zeph", "ZEP"),
    (37, "Hag", "HAG"), (38, "Zech", "ZEC"), (39, "Mal", "MAL"),
    (40, "Matt", "MAT"), (41, "Mark", "MAR"), (42, "Luke", "LUK"), (43, "John", "JOH"),
    (44, "Acts", "ACT"), (45, "Rom", "ROM"), (46, "1Cor", "1CO"), (47, "2Cor", "2CO"),
    (48, "Gal", "GAL"), (49, "Eph", "EPH"), (50, "Phil", "PHI"), (51, "Col", "COL"),
    (52, "1Thess", "1TH"), (53, "2Thess", "2TH"), (54, "1Tim", "1TI"), (55, "2Tim", "2TI"),
    (56, "Titus", "TIT"), (57, "Phlm", "PHM"), (58, "Heb", "HEB"), (59, "Jas", "JAM"),
    (60, "1Pet", "1PE"), (61, "2Pet", "2PE"), (62, "1John", "1JO"), (63, "2John", "2JO"),
    (64, "3John", "3JO"), (65, "Jude", "JUD"), (66, "Rev", "REV"),
]

POR_OSIS = {osis: id_ for id_, osis, _ in LIBROS}
POR_BW = {bw: id_ for id_, _, bw in LIBROS}

# Códigos USFM en orden canónico (los mismos que src/lib/biblia/libros.ts). STEPBible los usa
# con mayúscula inicial ("Gen", "1Sa", "Jhn").
USFM = (
    "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG "
    "ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT "
    "ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV"
).split()
POR_USFM = {codigo: i + 1 for i, codigo in enumerate(USFM)}
