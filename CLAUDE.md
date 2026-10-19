# Proyecto Maranata

Web (y luego app Android) en español para explorar la Biblia: visualización de las ~345.000 referencias cruzadas y texto hebreo/griego palabra por palabra (STEP Bible). Autor: Mario Baldovino. Repo: MarioPC2025/ProyectoMaranata. Código MIT. Interfaz, comentarios y commits en español. Proyecto sin fines de lucro, separado de Mario PC.

Está construido sobre [trekhleb/bible-cross-references](https://github.com/trekhleb/bible-cross-references) (MIT): mismo estilo visual y misma forma de usarse; no cambiar ninguno de los dos sin que Mario lo pida.

Fuentes de datos con sus licencias, funcionalidades por fase y pendientes: `docs/proyecto.md`. Atribuciones: `DATA_SOURCES.md`. Leelos solo cuando la tarea lo necesite.

## Reglas legales (no negociables)

Ante la duda, gana la regla más estricta.

1. **Nunca subir al repo texto bíblico con copyright** (NTV, NVI, RVR1960, TLA, NRV2000). Solo dominio público y datos con licencia abierta.
2. **El texto de las APIs no se altera**: no se reestructura, no se le inyectan Strong ni etiquetas, no se combina en un texto nuevo. Se muestra tal cual, con su copyright visible, y solo en el panel de detalles (nunca en fragmentos, búsqueda ni citas copiadas).
3. **Caché de API.Bible**: menos de 500 versículos consecutivos, refresco al menos cada 30 días, máximo 5.000 llamadas por mes. **FUMS obligatorio** en cada página con texto de API.Bible. El service worker no cachea `/api/`.
4. **Sin monetización**: ni publicidad, patrocinios, suscripciones, compras, paywalls ni "premium". Sin link de donaciones al lanzar. Sin analítica de terceros.
5. **Nada de numerología ni gematría.**
6. El etiquetado Strong de la RV1909 (Rubén Gómez) **no se usa** sin permiso escrito.
7. Todo cambio a datos CC BY se documenta en `DATA_SOURCES.md`.

## Stack y estructura

- React 19 + Vite + TypeScript. Visualización en three.js (`src/visualizations/`).
- `src/core/` libros (nombres en español, alias en inglés en `english-names.ts`), versificación KJV, referencias y formatos de datos.
- `src/translations/` traducciones incluidas (RV1909, BSB, KJV) y `api/` (NTV por el proxy, NVI-S y RVES por YouVersion).
- `src/words/` palabras de diccionario (`words/stepbible.json`) y hebreo/griego palabra por palabra (`word-by-word.ts`).
- `functions/api/` y `servidor/`: proxy de API.Bible en Cloudflare Pages Functions (la clave nunca llega al navegador).
- `scripts/data/`: pipeline TypeScript que convierte los datos de origen (`data/sources.json`, `data/raw/`, no leer enteros) en `public/data/`. `scripts/*.py`: hebreo/griego palabra por palabra (`npm run data:original`).
- Los tests de la base están en inglés; lo nuevo, en español.

## Comandos

- `npm run dev` · `npm run build` · `npm run check` (tipos, lint, formato y tests con cobertura mínima del 98 %) · `npm test` · `npm run test:e2e`
- `npm run dev:api` (otra terminal, después de `npm run build`): el proxy de la NTV en :8788.
- Tests de datos Python: `python -m unittest discover -s scripts`
- Al terminar un cambio, correr solo los tests relacionados; la suite completa, antes de hacer commit.

## Cómo trabajar (para gastar pocos tokens)

- `public/data/` y `data/raw/` son datos generados o enormes: **no leerlos enteros**. Para ver su formato, mirar el script que los genera o usar `head -c 500`.
- No recorrer todo el repo: usar la estructura de arriba e ir directo a los archivos de la tarea.
- Antes de un cambio grande, proponer el plan y esperar el OK.
- Respuestas cortas: no repetir código que no cambió ni resumir lo que ya se ve en el diff.

## Secretos

Clave de API.Bible: secreto del Worker (`APIBIBLE_KEY`). App key de YouVersion: `VITE_YVP_APP_KEY`. Local: `.dev.vars` y `.env.local` (ignorados por git). Nunca pedir, leer ni imprimir claves.
