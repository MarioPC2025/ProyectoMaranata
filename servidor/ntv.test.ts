import { describe, expect, it, vi } from 'vitest'
import { LIMITE_MENSUAL, NTV_ID, obtenerCapitulo, type Almacen } from './ntv'

function almacen(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial))
  const ttl = new Map<string, number | undefined>()
  const kv: Almacen = {
    get: async (c) => datos.get(c) ?? null,
    put: async (c, v, o) => {
      datos.set(c, v)
      ttl.set(c, o?.expirationTtl)
    },
  }
  return { kv, datos, ttl }
}

const respuestaAPI = () =>
  new Response(
    JSON.stringify({
      data: { content: '<p>texto</p>', copyright: '© Tyndale', reference: 'Juan 3' },
      meta: { fumsToken: 'token-1' },
    }),
  )

const ahora = new Date('2026-10-17T12:00:00Z')

describe('proxy NTV', () => {
  it('pide el capítulo, lo cachea y cuenta la llamada', async () => {
    const { kv, datos, ttl } = almacen()
    const pedir = vi.fn(async () => respuestaAPI())
    const r = await obtenerCapitulo('JHN', 3, { APIBIBLE_KEY: 'k', CACHE_BIBLIA: kv }, pedir, ahora)
    expect(r.status).toBe(200)
    expect(r.headers.get('X-Cache')).toBe('MISS')
    const cuerpo = await r.json()
    expect(cuerpo).toMatchObject({
      html: '<p>texto</p>',
      copyright: '© Tyndale',
      fumsToken: 'token-1',
    })
    const [url, init] = pedir.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain(`/bibles/${NTV_ID}/chapters/JHN.3?`)
    expect(url).toContain('fums-version=3')
    expect((init.headers as Record<string, string>)['api-key']).toBe('k')
    expect(datos.get('contador:2026-10')).toBe('1')
    expect(ttl.get('ntv:JHN.3')).toBeLessThan(30 * 24 * 3600)
  })

  it('sirve desde la caché sin llamar a la API', async () => {
    const { kv } = almacen({ 'ntv:JHN.3': JSON.stringify({ html: 'cacheado' }) })
    const pedir = vi.fn()
    const r = await obtenerCapitulo('JHN', 3, { APIBIBLE_KEY: 'k', CACHE_BIBLIA: kv }, pedir, ahora)
    expect(r.headers.get('X-Cache')).toBe('HIT')
    expect((await r.json()).html).toBe('cacheado')
    expect(pedir).not.toHaveBeenCalled()
  })

  it('corta al llegar al límite mensual', async () => {
    const { kv } = almacen({ 'contador:2026-10': String(LIMITE_MENSUAL) })
    const pedir = vi.fn()
    const r = await obtenerCapitulo('JHN', 3, { APIBIBLE_KEY: 'k', CACHE_BIBLIA: kv }, pedir, ahora)
    expect(r.status).toBe(503)
    expect((await r.json()).error).toBe('limite-mensual')
    expect(pedir).not.toHaveBeenCalled()
  })

  it('rechaza referencias inválidas y funciona sin clave', async () => {
    const pedir = vi.fn()
    expect((await obtenerCapitulo('XXX', 3, { APIBIBLE_KEY: 'k' }, pedir)).status).toBe(400)
    expect((await obtenerCapitulo('JHN', 0, { APIBIBLE_KEY: 'k' }, pedir)).status).toBe(400)
    expect((await obtenerCapitulo('JHN', 3, {}, pedir)).status).toBe(503)
    expect(pedir).not.toHaveBeenCalled()
  })

  it('si la API revoca el acceso responde "sin-acceso"', async () => {
    const pedir = vi.fn(async () => new Response('', { status: 403 }))
    const r = await obtenerCapitulo('JHN', 3, { APIBIBLE_KEY: 'k' }, pedir, ahora)
    expect(r.status).toBe(503)
    expect((await r.json()).error).toBe('sin-acceso')
  })
})
