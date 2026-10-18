# Fuentes de datos y atribuciones

El código de Proyecto Maranata está bajo licencia MIT (ver `LICENSE`). Parte de la base es de
[trekhleb/bible-cross-references](https://github.com/trekhleb/bible-cross-references) (MIT,
© Oleksii Trekhleb), de donde vienen la visualización y el pipeline de datos. Los datos tienen
licencias propias, listadas acá. Los archivos de origen que se pueden guardar en el repo están en
`data/raw/`; el resto se baja con `npm run data:fetch` y se verifica contra su checksum en
`data/sources.json`.

## Referencias cruzadas

- **OpenBible.info Cross References** — https://www.openbible.info/labs/cross-references/
- Licencia: Creative Commons Attribution 4.0 (CC BY 4.0).
- Basadas principalmente en el _Treasury of Scripture Knowledge_ (dominio público), con puntuación de la comunidad de OpenBible.info.
- Atribución en el sitio: "OpenBible.info (CC BY 4.0)" en el pie de cada página.

## Texto bíblico de dominio público

- **Reina-Valera 1909** — dominio público. Fuente: VPL de eBible.org, https://ebible.org/Scriptures/details.php?id=spaRV1909 (marcado "Public Domain / Dominio Público").
  - Ese archivo acomoda la versificación propia de la RV1909 en la grilla KJV: deja 18 versículos vacíos y fusiona otros en 18 capítulos (Nm 12–13 y 29–30, 1 S 23–24, 2 S 20, 2 Cr 33, Job 35 y 38–40, Os 11–12, Jon 1–2, Hch 19, 2 Co 13). `scripts/data/importers/rv1909.ts` reparte ese texto en la versificación KJV: mueve los versículos corridos y parte los casilleros que juntan varios versículos en la frase donde empieza cada uno (cotejado versículo por versículo con el hebreo y el griego de STEP). El texto no se cambia, salvo la primera palabra en mayúsculas de 7 comienzos de capítulo que quedaron en medio de otro (por ejemplo "MAS Jehová" → "Mas Jehová" en Jon 1:17). Si la fuente cambia, el build falla en lugar de cortar mal.
  - Como con la KJV, se quitan los pilcrows (¶) y los corchetes con que eBible marca las palabras agregadas por los traductores; el texto no se toca.
  - El USFM de esa misma página trae números Strong: es el etiquetado de Rubén Gómez, que CrossWire publica en el módulo `SpaRV1909` como "Copyrighted; Permission to distribute granted to CrossWire". **No se usa** hasta tener su permiso por escrito.
- **Etiquetado Strong de la RV1909** — Rubén Gómez. Licencia pendiente de confirmar; no se incluye hasta tenerla.
- **Berean Standard Bible (BSB)** — dominio público, https://berean.bible/. Se ofrece como opción.
- **King James Version (KJV)** — edición de eBible.org. Dominio público en la mayor parte del mundo; en el Reino Unido, derechos de la Corona administrados por Cambridge University Press (el sitio lo dice donde se elige el texto). Se ofrece como opción.

## Datos de idiomas originales y léxicos

- **STEPBible-Data** — https://github.com/STEPBible/STEPBible-Data
- Creados por Tyndale House Cambridge, curados por STEPBible.org. Licencia CC BY 4.0.
- Atribución en el sitio: "STEP Bible" con link a https://www.stepbible.org y a la licencia, siempre visible junto al texto original.
- Datasets usados: TAHOT, TAGNT, TBESH, TBESG, TEHMC, TEGMC, TIPNR, TVTMS.
- Según https://stepbibleguide.blogspot.com/p/copyrights-licences.html, los datasets "may be freely used in other free projects" con atribución. Las definiciones de TBESH/TBESG parten del _Abridged Brown-Driver-Briggs_ y el _Abridged Thayer_, que STEP usa "with permission" (Larry Pierce, OnlineBible.net): confirmar con STEPBible antes de traducirlas y publicarlas.

### Cambios realizados sobre los datos de STEP

Hay dos pasos, con la misma fuente:

1. **Palabras por versículo** (`public/data/words/stepbible.json`, `scripts/data/importers/stepbible.ts`, archivos fijados en `data/sources.json`): para cada palabra de diccionario, los versículos donde aparece; alimenta "Misma palabra hebrea/griega". Se queda solo con las formas de diccionario y los versículos, nunca con el texto de un versículo. Se omiten las palabras usadas en más de 100 versículos, las que no tienen entrada en el léxico y las de los títulos de los salmos.
2. **Hebreo y griego palabra por palabra** (`scripts/descargar.py` y `scripts/construir_original.py`, commit `ed476a8` de STEPBible-Data, fijado en `scripts/descargar.py`):
   - **TAHOT / TAGNT** → `public/data/original/<libro>.json.gz`: palabras agrupadas por versículo en versificación KJV. Los títulos de los Salmos (versículo 0 en STEP) van al comienzo del versículo 1 con una marca; 3 Jn 1:15 y Ap 12:18 se unen a 3 Jn 1:14 y Ap 13:1. Se omiten 14 lecturas _qere_ sin texto y, en griego, las palabras que no están en Nestle-Aland ni en el Textus Receptus; las que están solo en uno se marcan. El griego se normaliza a Unicode NFC. Cada número Strong se ajusta a la forma en que figura en el léxico (por ejemplo G2453 → G2453G).
   - La glosa en español del griego es la columna "Spanish translation" de TAGNT, sin cambios.
   - **TBESH / TBESG** → `public/data/lexico/`: solo lema, transliteración, categoría y glosa breve. Las definiciones no se publican todavía.
   - **TEHMC / TEGMC** → `public/data/morfologia.json`: descripción de cada código traducida al español a partir de sus rasgos (`scripts/morfologia.py`).

## Tipografías

- **Noto Serif** y **Noto Serif Hebrew** (Google), licencia SIL Open Font 1.1, servidas desde el sitio vía `@fontsource` para el texto hebreo y griego.

### Cambios realizados sobre datos CC BY

(Registrar acá cada transformación: formato convertido, traducción al español del léxico, correcciones, etc.)

- **OpenBible.info cross_references.txt**: convertido al JSON en columnas `public/data/cross-references/openbible.json` (`scripts/data/importers/openbible.ts`). Los versículos se numeran en orden canónico y los votos se conservan sin cambios. Las 5 referencias a 3 Jn 1:15 (versificación no KJV) se asignan a 3 Jn 1:14. No se descarta ninguna referencia.
- **STEPBible-Data**: ver arriba, "Cambios realizados sobre los datos de STEP".

## Texto bíblico con copyright (servido por API, nunca almacenado en el repo)

- **NTV** — © Tyndale House Publishers, vía API.Bible (American Bible Society), plan Starter (5.000 llamadas por mes). Uso no comercial.
- **NVI-S** (Nueva Versión Internacional 2025) y **RVES** (Reina Valera Antigua) — vía YouVersion Platform. Uso no comercial.
- El copyright de cada versión se muestra junto al texto, tal como lo devuelve cada API. El texto se muestra sin tocarlo y solo en el panel de detalles, como capítulo completo: no entra en los fragmentos de los arcos, en la búsqueda ni en las citas copiadas.
- IDs: NTV en API.Bible `826f63861180e056-01`; en YouVersion, NVI-S `128` y RVES `147`.
- La NTV se cachea por capítulo hasta 29 días (Workers KV) junto con su `fumsToken`, que el navegador reporta con FUMS v3 cada vez que muestra el capítulo. El navegador no la guarda (el service worker no cachea `/api/`).
- La RVES no trae texto de atribución en YouVersion: se muestra "Reina-Valera Antigua (RVES), vía YouVersion" con link a la versión.
- RVR1960 y TLA no se muestran: solo hay un enlace al capítulo en BibleGateway.
