import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Indice } from '../biblia/indice'
import { leerReferencias, referenciasDe } from './xrefs'

const indice = new Indice(JSON.parse(readFileSync('public/data/indice.json', 'utf-8')))
const archivo = readFileSync('public/data/xrefs.bin')
// Copia a un ArrayBuffer propio y alineado
const buffer = archivo.buffer.slice(archivo.byteOffset, archivo.byteOffset + archivo.byteLength)

describe('xrefs.bin', () => {
  const refs = leerReferencias(buffer as ArrayBuffer)

  it('tiene todas las referencias', () => {
    expect(refs.versiculos).toBe(31102)
    expect(refs.total).toBe(344799)
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

  it('rechaza archivos inválidos', () => {
    expect(() => leerReferencias(new ArrayBuffer(16))).toThrow()
  })
})
