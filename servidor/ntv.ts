// Proxy de la NTV (API.Bible). Corre en Cloudflare (Pages Functions) para que la clave
// nunca llegue al navegador. Reglas (ver CLAUDE.md, regla legal 3):
// - Se pide un capítulo (siempre menos de 500 versículos) solo cuando el usuario lo elige.
// - Se cachea en Workers KV hasta 29 días, así se refresca antes de los 30.
// - Un contador mensual corta antes de las 5.000 llamadas del plan Starter.
// - Se devuelve el fumsToken para que el navegador reporte cada vista (FUMS v3).

import { USFM_CODES } from '../src/core/bible/usfm.ts';

export const NTV_ID = '826f63861180e056-01';
export const LIMITE_MENSUAL = 4500;
const TTL_TEXTO = 29 * 24 * 60 * 60;
const TTL_CONTADOR = 40 * 24 * 60 * 60;
const API = 'https://rest.api.bible/v1';

/** Lo mínimo de KVNamespace que se usa (así los tests pueden pasar un doble) */
export interface Almacen {
  get(clave: string): Promise<string | null>;
  put(clave: string, valor: string, opciones?: { expirationTtl?: number }): Promise<void>;
}

export interface Entorno {
  APIBIBLE_KEY?: string;
  CACHE_BIBLIA?: Almacen;
}

export interface CapituloNTV {
  html: string;
  copyright: string;
  referencia: string;
  fumsToken: string | null;
  obtenido: number;
}

const LIBROS_VALIDOS = new Set(USFM_CODES);

function json(datos: unknown, estado = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': estado === 200 ? 'public, max-age=86400' : 'no-store',
      ...extra,
    },
  });
}

function mesActual(ahora: Date): string {
  return ahora.toISOString().slice(0, 7);
}

export async function obtenerCapitulo(
  libro: string,
  capitulo: number,
  env: Entorno,
  pedir: typeof fetch = fetch,
  ahora = new Date(),
): Promise<Response> {
  if (!LIBROS_VALIDOS.has(libro) || !Number.isInteger(capitulo) || capitulo < 1 || capitulo > 150) {
    return json({ error: 'referencia-invalida' }, 400);
  }
  if (!env.APIBIBLE_KEY) return json({ error: 'no-configurado' }, 503);

  const kv = env.CACHE_BIBLIA;
  const clave = `ntv:${libro}.${capitulo}`;
  const guardado = await kv?.get(clave);
  if (guardado) return json(JSON.parse(guardado), 200, { 'X-Cache': 'HIT' });

  const claveContador = `contador:${mesActual(ahora)}`;
  const usadas = Number((await kv?.get(claveContador)) ?? 0);
  if (usadas >= LIMITE_MENSUAL) return json({ error: 'limite-mensual' }, 503);

  const url =
    `${API}/bibles/${NTV_ID}/chapters/${libro}.${capitulo}` +
    '?content-type=html&include-notes=false&include-titles=true' +
    '&include-chapter-numbers=false&include-verse-numbers=true&fums-version=3';
  const resp = await pedir(url, { headers: { 'api-key': env.APIBIBLE_KEY } });
  await kv?.put(claveContador, String(usadas + 1), { expirationTtl: TTL_CONTADOR });
  if (resp.status === 401 || resp.status === 403) return json({ error: 'sin-acceso' }, 503);
  if (resp.status === 404) return json({ error: 'no-encontrado' }, 404);
  if (!resp.ok) return json({ error: 'error-api' }, 502);

  const cuerpo = await resp.json<{
    data: { content: string; copyright: string; reference: string };
    meta?: { fumsToken?: string };
  }>();
  const capituloNTV: CapituloNTV = {
    html: cuerpo.data.content,
    copyright: cuerpo.data.copyright,
    referencia: cuerpo.data.reference,
    fumsToken: cuerpo.meta?.fumsToken ?? null,
    obtenido: ahora.getTime(),
  };
  await kv?.put(clave, JSON.stringify(capituloNTV), { expirationTtl: TTL_TEXTO });
  return json(capituloNTV, 200, { 'X-Cache': 'MISS' });
}
