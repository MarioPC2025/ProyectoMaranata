# Maranata

Las **344.799 referencias cruzadas de la Biblia** dibujadas como arcos, cada capítulo leído con sus
hilos hasta donde se conectan sus versículos, y el **texto hebreo y griego palabra por palabra** de
cada pasaje. En español, sin anuncios ni cuentas.

Hecho por Mario Baldovino, sin fines de lucro. Está construido sobre
[Bible Cross-References](https://github.com/trekhleb/bible-cross-references) de Oleksii Trekhleb
(licencia MIT), de donde vienen la visualización y el pipeline de datos; se agregaron las
traducciones en español, el texto original de STEP Bible y el resaltado de la misma palabra en el
capítulo. Mira y se usa igual que el original.

## Qué se puede hacer

- **Arcos**: los 31.102 versículos en una línea, de Génesis a Apocalipsis, con sus referencias como
  arcos coloreados por género literario. Se acerca, se mueve y se toca un versículo o un capítulo
  para ver sus conexiones.
- **Hilos**: un capítulo para leer, con los hilos de cada versículo hasta donde caen sus referencias
  en toda la Biblia.
- **Panel de detalles** de un pasaje:
  - su texto, con un botón para copiarlo con su referencia y un enlace;
  - **Texto hebreo / griego palabra por palabra** (STEP Bible): transliteración, glosa, morfología en
    español, partes de la palabra y qué variantes tiene el texto griego;
  - **Hebreo / Griego del capítulo**: al tocar una palabra se resaltan todas las que comparten su
    número Strong en el capítulo, y se marcan los versículos que la contienen;
  - **Misma palabra hebrea / griega**: en qué otros versículos aparece;
  - las referencias que salen y las que llegan, por libro.
- **Traducciones**: Reina-Valera 1909 (por defecto), Berean Standard Bible y King James. Se elige en
  el botón de la traducción, junto al buscador.
- **Leer también en**: NTV (API.Bible), NVI-S y RVES (YouVersion), como capítulo completo en el
  panel, tal como las entrega su proveedor, con su copyright. RVR1960 y TLA, con un enlace a
  BibleGateway.
- **Buscador tolerante**: `Juan 3:16`, `jn 3 16`, `1 co 13`, `primera de Corintios 13`, `Sal 23`,
  `Gen.1.1`; con o sin tildes, y también con los nombres en inglés.
- **Instalable y sin conexión**: se instala como app y guarda el texto bíblico y las referencias en
  el dispositivo. Las versiones que vienen de una API necesitan conexión.
- Enlaces compartibles: `?ref=John.3.16`, `?t=kjv`, `#install`.

## Datos y licencias

Detalle completo en [`DATA_SOURCES.md`](DATA_SOURCES.md). En resumen:

| Dato                                | Fuente                         | Licencia                |
| ----------------------------------- | ------------------------------ | ----------------------- |
| Referencias cruzadas                | OpenBible.info                 | CC BY 4.0               |
| Reina-Valera 1909, BSB, KJV         | eBible.org / Berean            | Dominio público         |
| Hebreo y griego, léxico, morfología | STEPBible-Data (Tyndale House) | CC BY 4.0               |
| NTV                                 | API.Bible (Tyndale House)      | Copyright; solo vía API |
| NVI-S, RVES                         | YouVersion Platform            | Copyright; solo vía API |

El texto con copyright **nunca** se guarda en este repositorio: lo piden el servidor
(`functions/api/`) o el navegador cuando el lector lo elige, y se muestra sin alterarlo.

## Desarrollo

Requiere Node 24 (ver `.nvmrc`). Python 3 solo hace falta para regenerar el hebreo y el griego.

```sh
npm install
npm run dev          # baja los datos de origen la primera vez (npm run data:fetch) y arranca Vite
npm run dev:api      # (otra terminal, después de npm run build) el proxy de la NTV en :8788
npm run check        # tipos, lint, formato y tests con cobertura
npm run build        # el sitio en dist/
npm run test:e2e     # pruebas en un navegador real (Playwright)
```

- `npm run data:fetch` descarga los archivos de origen fijados en `data/sources.json` (y los
  verifica con su SHA-256); `npm run data:build` los convierte en `public/data/`. No hace falta
  correrlos a mano: `dev` y `build` los corren.
- `npm run data:original` regenera el hebreo y el griego palabra por palabra
  (`public/data/original/`, `lexico/` y `morfologia.json`, que sí están en el repo porque salen de
  archivos de STEP que se bajan aparte).
- Secretos en `.dev.vars` (`APIBIBLE_KEY`, ver `.dev.vars.example`) y `.env.local`
  (`VITE_YVP_APP_KEY`, ver `.env.local.example`). Ninguno llega al repo.

### Estructura

- `src/core/`: libros, versificación, referencias y formatos de los datos.
- `src/visualizations/`: los arcos (three.js), los hilos y el panel de detalles.
- `src/translations/`: las traducciones incluidas y, en `api/`, las que vienen de una API.
- `src/words/`: las palabras de diccionario y el hebreo/griego palabra por palabra.
- `scripts/data/`: el pipeline que convierte los datos de origen; `scripts/*.py`, el del hebreo y
  el griego palabra por palabra.
- `functions/api/` y `servidor/`: el proxy de la NTV en Cloudflare Pages Functions.
- `vite/`: los plugins del build (cabecera, instalación, caché sin conexión).
- `tests/e2e/`: las pruebas de extremo a extremo.

La guía detallada de la base, en inglés, es el README original de
[bible-cross-references](https://github.com/trekhleb/bible-cross-references#readme).

### Despliegue

Cloudflare Pages, conectado a este repositorio: comando de build `npm run build`, carpeta de salida
`dist`. Las funciones de `functions/` se publican en el mismo proyecto. Hay que crear el KV
`CACHE_BIBLIA` (`npx wrangler kv namespace create CACHE_BIBLIA`, y poner su id en `wrangler.toml`),
cargar `APIBIBLE_KEY` como secreto y `VITE_YVP_APP_KEY` como variable de build.

## Licencia

Código bajo licencia [MIT](LICENSE): © Oleksii Trekhleb (la base) y © Mario Baldovino. Los datos
tienen las suyas, en [`DATA_SOURCES.md`](DATA_SOURCES.md).

La visualización de arcos se inspira en
[Bible Cross-References](https://www.chrisharrison.net/index.php/Visualizations/BibleViz) de Chris
Harrison y Christoph Römhild.
