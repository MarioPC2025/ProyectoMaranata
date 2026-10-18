# Fuentes de datos y atribuciones

El código de Proyecto Maranata está bajo licencia MIT. Los datos tienen licencias propias, listadas acá.

## Referencias cruzadas
- **OpenBible.info Cross References** — https://www.openbible.info/labs/cross-references/
- Licencia: Creative Commons Attribution (CC BY).
- Basadas principalmente en el *Treasury of Scripture Knowledge* (dominio público), con puntuación de la comunidad de OpenBible.info.
- Atribución en el sitio: "Referencias cruzadas de OpenBible.info, CC BY".

## Texto bíblico de dominio público
- **Reina-Valera 1909** — dominio público. Fuente: VPL de eBible.org, https://ebible.org/Scriptures/details.php?id=spaRV1909 (marcado "Public Domain / Dominio Público").
  - Ese archivo acomoda la versificación propia de la RV1909 en la grilla KJV: deja 18 versículos vacíos y fusiona otros en 19 capítulos (Nm 12–13 y 29–30, 1 S 23–24, 2 S 20, 2 Cr 33, Job 35 y 38–41, Os 11–12, Jon 1–2, Hch 19, 2 Co 13). Esos capítulos se marcan en `indice.json` (`rv1909Desalineados`) y se realinean en la fase 2 con TVTMS.
  - El USFM de esa misma página trae números Strong: es el etiquetado de Rubén Gómez, que CrossWire publica en el módulo `SpaRV1909` como "Copyrighted; Permission to distribute granted to CrossWire". **No se usa** hasta tener su permiso por escrito.
- **Etiquetado Strong de la RV1909** — Rubén Gómez. Licencia pendiente de confirmar; no se incluye hasta tenerla.

## Datos de idiomas originales y léxicos
- **STEPBible-Data** — https://github.com/STEPBible/STEPBible-Data
- Creados por Tyndale House Cambridge, curados por STEPBible.org. Licencia CC BY 4.0.
- Atribución en el sitio: "STEP Bible" con link a https://www.stepbible.org
- Datasets usados: TAHOT, TAGNT, TBESH, TBESG, TIPNR, TVTMS.
- Según https://stepbibleguide.blogspot.com/p/copyrights-licences.html, los datasets "may be freely used in other free projects" con atribución. Las definiciones de TBESH/TBESG parten del *Abridged Brown-Driver-Briggs* y el *Abridged Thayer*, que STEP usa "with permission" (Larry Pierce, OnlineBible.net): confirmar con STEPBible antes de traducirlas y publicarlas.

### Cambios realizados sobre datos CC BY
(Registrar acá cada transformación: formato convertido, traducción al español del léxico, correcciones, etc.)

- **OpenBible.info cross_references.txt** (versión del 2026-10-12): convertido al binario `public/data/xrefs.bin` (`scripts/construir.py`). Los versículos se numeran en orden canónico, las referencias de cada versículo se ordenan por votos y los rangos se guardan como inicio y fin. Las 5 referencias a 3 Jn 1:15 (versificación no KJV) se asignan a 3 Jn 1:14. No se descarta ninguna referencia.

## Texto bíblico con copyright (servido por API, nunca almacenado en el repo)
- **NTV** — © Tyndale House Publishers, vía API.Bible (American Bible Society), plan Starter (5.000 llamadas por mes). Uso no comercial.
- **NVI-S** (Nueva Versión Internacional 2025) y **RVES** (Reina Valera Antigua) — vía YouVersion Platform. Uso no comercial.
- El copyright de cada versión se muestra junto al texto, tal como lo devuelve cada API.
- IDs: NTV en API.Bible `826f63861180e056-01`; en YouVersion, NVI-S `128` y RVES `147`.
- La NTV se cachea por capítulo hasta 29 días (Workers KV) junto con su `fumsToken`, que el navegador reporta con FUMS v3 cada vez que muestra el capítulo.
- La RVES no trae texto de atribución en YouVersion: se muestra "Reina-Valera Antigua (RVES), vía YouVersion" con link a la versión.
