import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Indice } from '../biblia/indice'
import { descomprimirSiHaceFalta } from './cargar'
import { bufferXrefs } from './datos-prueba'
import { leerReferencias, referenciasDe } from './xrefs'

const indice = new Indice(JSON.parse(readFileSync('public/data/indice.json', 'utf-8')))

describe('xrefs.bin.gz', () => {
  const refs = leerReferencias(bufferXrefs())

  it('tiene todas las referencias', () => {
    expect(refs.versiculos).toBe(31102)
    expect(refs.total).toBe(344799)
    expect(refs.desp[31102]).toBe(344799)
  })

  it('Gn 1:1 apunta a Sal 115:15 y Jn 1:1-3', () => {
    const lista = referenciasDe(refs, 0)
    const sal = indice.numero(19, 115, 15)
    expect(lista).toContainEqual(expect.objectContaining({ inicio: sal, fin: sal }))
    expect(lista).toContainEqual(
      expect.objectContaining({ inicio: indice.numero(43, 1, 1), fin: indice.numero(43, 1, 3) }),
    )
    const votos = lista.map((r) => r.votos)
    expect(votos).toEqual([...votos].sort((a, b) => b - a))
  })

  it('todos los destinos están en rango', () => {
    for (let i = 0; i < refs.total; i += 101) {
      expect(refs.inicio[i]).toBeLessThanOrEqual(refs.fin[i])
      expect(refs.fin[i]).toBeLessThan(31102)
    }
  })

  it('descomprime solo si llega en gzip', async () => {
    const gz = readFileSync('public/data/xrefs.bin.gz')
    const comprimido = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength) as ArrayBuffer
    const desde = await descomprimirSiHaceFalta(comprimido)
    expect(leerReferencias(desde).total).toBe(344799)
    // Si el servidor ya lo descomprimió (Content-Encoding: gzip), queda igual
    const plano = bufferXrefs()
    expect(await descomprimirSiHaceFalta(plano)).toBe(plano)
  })

  it('rechaza archivos inválidos', () => {
    expect(() => leerReferencias(new ArrayBuffer(16))).toThrow()
    expect(() => leerReferencias(new ArrayBuffer(3))).toThrow()
  })
})
