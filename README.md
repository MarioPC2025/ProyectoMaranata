# Proyecto Maranata

Web (y más adelante app Android) en español para explorar las ~345.000 referencias cruzadas de la Biblia, con un lector de estudio con hebreo y griego en una segunda etapa.

Proyecto personal y sin fines de lucro. Código bajo licencia MIT; los datos tienen sus propias licencias (ver [DATA_SOURCES.md](DATA_SOURCES.md)).

## Desarrollo

Requisitos: Node 24+ y Python 3.13+.

```bash
npm install
npm run dev        # servidor local
npm run check      # tipos (Svelte + TypeScript)
npm run lint
npm test           # tests de TypeScript (Vitest)
python -m unittest discover -s scripts   # tests del pipeline de datos
```

### Datos

Los datos de origen se descargan a `data/raw/` (no se versiona) y los scripts de `scripts/` generan los archivos compactos de `public/data/`:

```bash
python scripts/descargar.py
python scripts/construir.py
```

### Secretos

Copiá `.dev.vars.example` como `.dev.vars` y `.env.local.example` como `.env.local`. Ninguno de los dos se sube al repo.
