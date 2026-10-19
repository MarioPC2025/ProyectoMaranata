# Proyecto Maranata — detalle del proyecto

Contexto que no hace falta en cada sesión de Claude Code (por eso no está en `CLAUDE.md`). Leer solo la sección que pida la tarea.

## Fuentes de datos

| Dato                                                                   | Fuente                                                                                            | Licencia / condición                                                                                                                                    | Uso                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Referencias cruzadas (~345k)                                           | OpenBible.info (basado en el Treasury of Scripture Knowledge)                                     | CC BY                                                                                                                                                   | Arcos de la visualización y lista de referencias por versículo |
| RV1909 (texto)                                                         | Dominio público                                                                                   | Libre                                                                                                                                                   | Texto por defecto, incluido en el sitio, offline               |
| RV1909 con números Strong                                              | Etiquetado de Rubén Gómez (módulo SWORD `SpaRV1909`; el USFM de eBible trae las mismas etiquetas) | **"Copyrighted; Permission to distribute granted to CrossWire"**: no se usa sin permiso escrito                                                         | Texto de estudio interactivo (fase 2)                          |
| NTV                                                                    | API.Bible, plan Starter                                                                           | No comercial, FUMS, caché limitada, revocable, **5.000 llamadas por mes**                                                                               | Columna paralela de solo lectura                               |
| NVI-S (Nueva Versión Internacional 2025) + RVES (Reina Valera Antigua) | YouVersion Platform                                                                               | No comercial, gratuito para el usuario final                                                                                                            | Columna paralela de solo lectura                               |
| TAHOT / TAGNT                                                          | STEPBible-Data (Tyndale House Cambridge)                                                          | CC BY 4.0                                                                                                                                               | Hebreo/arameo y griego palabra por palabra, morfología, Strong |
| TBESH / TBESG                                                          | STEPBible-Data                                                                                    | CC BY 4.0 para proyectos gratuitos; las definiciones parten del _Abridged BDB_ y el _Abridged Thayer_ ("used with permission", Larry Pierce): verificar | Léxico breve, a traducir al español                            |
| TIPNR                                                                  | STEPBible-Data                                                                                    | CC BY 4.0                                                                                                                                               | Fichas de personas y lugares                                   |
| TVTMS                                                                  | STEPBible-Data                                                                                    | CC BY 4.0                                                                                                                                               | Mapeo de versificación entre tradiciones                       |

Versiones deseadas pero **sin licencia todavía**: RVR1960 y TLA (Sociedades Bíblicas Unidas), NRV2000 (Nueva Reina-Valera 2000, Sociedad Bíblica Emanuel, la adventista). Mientras tanto: link externo a YouVersion / Bible Gateway.

Atribuciones completas en `DATA_SOURCES.md`. Todo cambio a datos CC BY (por ejemplo, la traducción del léxico) debe quedar documentado ahí.

## Funcionalidades por fase

La base es el repositorio de trekhleb (arcos y hilos); lo propio de Maranata se agregó encima sin cambiar su estilo ni su forma de usarse.

### Fase 1 — Visualizador de referencias cruzadas (hecha)

- Todos los versículos en una línea (Génesis → Apocalipsis) con las referencias como arcos, coloreados por género literario; vista por capítulo con hilos hacia donde conecta.
- Texto del versículo y sus referencias en el panel de detalles. Traducciones incluidas: RV1909 (por defecto), BSB y KJV.
- "Leer también en": NTV (API.Bible), NVI-S y RVES (YouVersion), como capítulo completo en el panel; RVR1960 y TLA, como enlace a BibleGateway.
- La NTV se pide solo cuando el lector la elige, con caché global por capítulo (Workers KV, 29 días) y un contador mensual que la corta antes de las 5.000 llamadas.
- Búsqueda tolerante en español (tildes, ordinales, abreviaturas) y con nombres en inglés.
- Enlaces compartibles; instalable y sin conexión; mobile first.

### Fase 2 — Modo estudio (en curso)

- Hecho: hebreo/arameo y griego palabra por palabra en el panel (TAHOT/TAGNT): transliteración, glosa (en español en el griego), morfología en español, partes de la palabra y variantes TR/NA.
- Hecho: en un capítulo, tocar una palabra del texto original resalta las que comparten su Strong y marca los versículos que la contienen.
- Hecho: "Misma palabra hebrea/griega" (dataset de trekhleb, `words/stepbible.json`).
- Pendiente: la RV1909 no lleva Strong (regla legal 6), así que no se puede marcar la palabra dentro del texto en español.
- Hecho (93,7 %): glosas del hebreo en español (`data/glosas-hebreo.tsv`, `python scripts/glosas.py pendientes|agregar|aplicar`; 43.800 glosas que cubren el 93,7 % de las palabras del AT, traducción automática por lotes, de las más frecuentes a las menos, pendiente de revisión humana). Las que quedan aparecen una o dos veces cada una.
- Hecho: fichas de nombres propios (TIPNR) en la ficha de la palabra (`scripts/nombres.py`, `data/nombres-es.tsv`, `python scripts/nombres.py pendientes|agregar`; traducidas las 4.238, con traducción automática pendiente de revisión humana).
- Pendiente: léxico TBESH/TBESG traducido (IA + revisión humana).

### Fase 3 — App Android

- La misma base de código como PWA empaquetada con Capacitor y publicada en Google Play. Ícono: `public/icono.svg`, `public/icons/`.
- Offline: RV1909, léxicos y referencias. Las versiones por API requieren conexión.
- Hecho: Capacitor 8 (`capacitor.config.ts`, id `ar.org.proyectomaranata.app`, que no se puede cambiar después de publicar) y el proyecto de Android en `android/`. `npm run android` arma el sitio en modo `android` y lo copia al proyecto; `npm run android:abrir` abre Android Studio; `npm run android:iconos` regenera los íconos y la pantalla de inicio desde `public/icono.svg`.
- En la app no se registra el service worker (los archivos ya vienen en el paquete) y la NTV se pide al proxy del sitio publicado (`VITE_API_ORIGIN` en `.env.android`), que acepta el origen de la app por CORS. Hasta que el dominio esté publicado, en la app la NTV muestra el aviso de que no está disponible.
- El wrapper de Gradle está en 9.2.1 (la plantilla de Capacitor trae 8.14.3, que no corre sobre el Java 25 de Android Studio). Los `.gz` de `public/data/` el empaquetador de Android los descomprime y les saca la extensión, así que en la app se piden sin `.gz` (`src/words/word-by-word.ts`).
- Pendiente: firmar el build de release y publicarlo (necesita la cuenta de Google Play); revisar si YouVersion acepta las llamadas desde el origen de la app (`https://localhost`).

## Diseño

El de trekhleb, sin cambios: oscuro y minimalista. Lo propio: el logo (`public/icono.svg`, de donde salen el favicon y los íconos de la app).

## Pendientes

- [ ] Comprar el dominio.
- [ ] Crear la cuenta de Cloudflare dedicada (mail del proyecto) y conectar Pages al repo. Al publicar: crear el KV `CACHE_BIBLIA` y poner su id en `wrangler.toml`, cargar `APIBIBLE_KEY` como secreto y `VITE_YVP_APP_KEY` como variable de build.
- [x] Mail a YouVersion: ¿se permite un link de donación discreto en un proyecto sin fines de lucro? (respondido, ver abajo)
- [ ] Si se quieren donaciones: preguntar a las editoriales qué consideran "comercial" (Biblica por la NVI-S; el titular de la RVES).
- [ ] Mail a Rubén Gómez (rubeng{at}infotelecom{dot}es, según la ficha de CrossWire): permiso para usar su etiquetado Strong de la RV1909 fuera de CrossWire. (Enviado el 18/10/2026; esperando respuesta.)
- [ ] Confirmar con support@api.bible el modelo (sin fines de lucro, sin donaciones al lanzar) y guardar la respuesta. (Enviado el 18/10/2026; esperando respuesta.)
- [ ] Gestionar licencias de RVR1960 y TLA (SBU / Sociedad Bíblica Argentina) y NRV2000 (Sociedad Bíblica Emanuel). (Pedidos enviados el 18/10/2026; esperando respuesta.)
- [x] Verificar la licencia del repo de trekhleb (MIT, © Oleksii Trekhleb; se conserva su nota en `LICENSE`).
- [ ] Verificar con STEPBible los términos de las definiciones de TBESH y TBESG (basadas en el Abridged BDB y el Abridged Thayer). (Enviado el 18/10/2026; esperando respuesta.)
- [ ] Conseguir un revisor con formación bíblica para la traducción del léxico.
- [x] Decidir el diseño visual (el de trekhleb).
- [ ] Cuenta de desarrollador de Google Play (fase 3).
- [x] Realinear los capítulos de la RV1909 que no coincidían con la versificación KJV (`scripts/data/importers/rv1909.ts`).

## Respuestas recibidas

- **YouVersion Platform Support** (platform-support@youversion.com, 18/10/2026): la Platform se puede usar en apps o sitios con funciones pagas, siempre que el acceso a la app y a la Escritura que da la Platform nunca quede detrás de un paywall. Si se monetiza otra parte, hay que revisar la licencia de cada traducción, porque cada editorial define qué es uso "comercial"; ante la duda, consultar a la editorial. Consecuencia: un link de donación no choca con YouVersion, pero falta la opinión de Biblica (NVI-S) y del titular de la RVES. La regla 4 de `CLAUDE.md` (sin donaciones al lanzar) no cambia.
