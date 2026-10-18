# Proyecto Maranata — detalle del proyecto

Contexto que no hace falta en cada sesión de Claude Code (por eso no está en `CLAUDE.md`). Leer solo la sección que pida la tarea.

## Fuentes de datos

| Dato | Fuente | Licencia / condición | Uso |
|---|---|---|---|
| Referencias cruzadas (~345k) | OpenBible.info (basado en el Treasury of Scripture Knowledge) | CC BY | Arcos de la visualización y lista de referencias por versículo |
| RV1909 (texto) | Dominio público | Libre | Texto por defecto, incluido en el sitio, offline |
| RV1909 con números Strong | Etiquetado de Rubén Gómez (módulo SWORD `SpaRV1909`; el USFM de eBible trae las mismas etiquetas) | **"Copyrighted; Permission to distribute granted to CrossWire"**: no se usa sin permiso escrito | Texto de estudio interactivo (fase 2) |
| NTV | API.Bible, plan Starter | No comercial, FUMS, caché limitada, revocable, **5.000 llamadas por mes** | Columna paralela de solo lectura |
| NVI-S (Nueva Versión Internacional 2025) + RVES (Reina Valera Antigua) | YouVersion Platform | No comercial, gratuito para el usuario final | Columna paralela de solo lectura |
| TAHOT / TAGNT | STEPBible-Data (Tyndale House Cambridge) | CC BY 4.0 | Hebreo/arameo y griego palabra por palabra, morfología, Strong |
| TBESH / TBESG | STEPBible-Data | CC BY 4.0 para proyectos gratuitos; las definiciones parten del *Abridged BDB* y el *Abridged Thayer* ("used with permission", Larry Pierce): verificar | Léxico breve, a traducir al español |
| TIPNR | STEPBible-Data | CC BY 4.0 | Fichas de personas y lugares |
| TVTMS | STEPBible-Data | CC BY 4.0 | Mapeo de versificación entre tradiciones |

Versiones deseadas pero **sin licencia todavía**: RVR1960 y TLA (Sociedades Bíblicas Unidas), NRV2000 (Nueva Reina-Valera 2000, Sociedad Bíblica Emanuel, la adventista). Mientras tanto: link externo a YouVersion / Bible Gateway.

Atribuciones completas en `DATA_SOURCES.md`. Todo cambio a datos CC BY (por ejemplo, la traducción del léxico) debe quedar documentado ahí.

## Funcionalidades por fase

### Fase 1 — Visualizador de referencias cruzadas
- Todos los versículos en una línea (Génesis → Apocalipsis) con las referencias como arcos, coloreados por género literario; vista por capítulo con hilos hacia donde conecta.
- Al pasar el mouse o tocar: texto del versículo (RV1909 local) y sus referencias.
- Selector "Ver en...": NTV (API.Bible), NVI-S y RVES (YouVersion); lo no licenciado, como link externo.
- La NTV se pide solo cuando el usuario la elige (nunca por adelantado), con caché global por capítulo (Workers KV, 30 días) y un contador mensual que la oculta antes de llegar a las 5.000 llamadas.
- Búsqueda tolerante en español: "juan 3.16", "Jn3:16", "1 co 13", con abreviaturas en español (Gn, Éx, Lv, Nm, Dt, ..., Jn, Hch, Ro, 1 Co, ..., Ap).
- Links compartibles por versículo (URL propia por referencia).
- Mobile first y accesible.
- Si una API revoca el acceso, la versión desaparece del selector y el sitio sigue andando con RV1909.

### Fase 2 — Lector con modo estudio (estilo STEP)
- RV1909 con palabras clickeables vía Strong: resalta todas las apariciones de la misma palabra original (concordancia).
- Panel de hebreo/arameo y griego (TAHOT/TAGNT): palabra original, transliteración (pronunciación), análisis morfológico y definición breve en español.
- NTV/NVI-S como columnas paralelas de solo lectura (sin resaltado).
- Fichas de nombres propios (TIPNR) y referencias cruzadas integradas al lector.
- Léxico TBESH/TBESG traducido al español en lote con IA + revisión humana de términos teológicos.

### Fase 3 — App Android
- La misma base de código como PWA empaquetada con Capacitor y publicada en Google Play.
- Offline: RV1909, léxicos y referencias. Las versiones por API requieren conexión.

## Diseño

Pendiente de decidir: oscuro y minimalista como el original de trekhleb, o una identidad visual propia. Requisitos ya definidos: legible en celular, modo claro/oscuro, tipografía cómoda para lectura larga, nombres de libros en español.

## Pendientes

- [ ] Comprar el dominio.
- [ ] Crear la cuenta de Cloudflare dedicada (mail del proyecto) y conectar Pages al repo. Al publicar: crear el KV `CACHE_BIBLIA` y poner su id en `wrangler.toml`, cargar `APIBIBLE_KEY` como secreto y `VITE_YVP_APP_KEY` como variable de build.
- [ ] Mail a YouVersion: ¿se permite un link de donación discreto en un proyecto sin fines de lucro?
- [ ] Mail a Rubén Gómez (rubeng{at}infotelecom{dot}es, según la ficha de CrossWire): permiso para usar su etiquetado Strong de la RV1909 fuera de CrossWire.
- [ ] Confirmar con support@api.bible el modelo (sin fines de lucro, sin donaciones al lanzar) y guardar la respuesta.
- [ ] Gestionar licencias de RVR1960 y TLA (SBU / Sociedad Bíblica Argentina) y NRV2000 (Sociedad Bíblica Emanuel).
- [ ] Verificar la licencia del repo de trekhleb.
- [ ] Verificar con STEPBible los términos de las definiciones de TBESH y TBESG (basadas en el Abridged BDB y el Abridged Thayer).
- [ ] Conseguir un revisor con formación bíblica para la traducción del léxico.
- [ ] Decidir el diseño visual.
- [ ] Cuenta de desarrollador de Google Play (fase 3).
- [x] Realinear los capítulos de la RV1909 que no coincidían con la versificación KJV (`scripts/realinear.py`).
