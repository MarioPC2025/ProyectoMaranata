import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Indice } from '../biblia/indice'
import { leerReferencias, type Referencias } from '../datos/xrefs'
import { bufferXrefs } from '../datos/datos-prueba'
import { paletaRGB } from './colores'
import {
  ZOOM_MAX,
  centrarEn,
  crearEscala,
  densidad,
  desplazar,
  versiculoAX,
  xAVersiculo,
  zoomEn,
} from './escala'
import { FLOATS_POR_ARCO, cantidadConVotos, construirArcos, librosPorVersiculo } from './instancias'

const indice = new Indice(JSON.parse(readFileSync('public/data/indice.json', 'utf-8')))

describe('escala', () => {
  const e = crearEscala(31102, 1000)

  it('va y vuelve entre versículo y x', () => {
    for (const v of [0, 100, 15000, 31101]) expect(xAVersiculo(e, versiculoAX(e, v))).toBe(v)
    expect(xAVersiculo(e, -50)).toBe(0)
    expect(xAVersiculo(e, 5000)).toBe(31101)
  })

  it('el zoom mantiene fijo el punto bajo el cursor', () => {
    const antes = xAVersiculo(e, 300)
    const z = zoomEn(e, 300, 8)
    expect(z.zoom).toBe(8)
    expect(Math.abs(xAVersiculo(z, 300) - antes)).toBeLessThanOrEqual(1)
  })

  it('respeta los límites', () => {
    expect(zoomEn(e, 0, 0.1).zoom).toBe(1)
    expect(zoomEn(e, 0, 1e9).zoom).toBe(ZOOM_MAX)
    expect(desplazar(e, 500).desde).toBe(0)
    const z = zoomEn(e, 1000, 10)
    const fin = desplazar(z, -1e9)
    expect(fin.desde + fin.total / fin.zoom).toBeCloseTo(31102)
    expect(densidad(e)).toBeCloseTo(31.102)
  })

  it('centra en un versículo', () => {
    const z = centrarEn(zoomEn(e, 0, 100), 20000)
    expect(versiculoAX(z, 20000)).toBeCloseTo(500, 0)
  })
})

describe('arcos', () => {
  it('fusiona A→B con B→A y ordena por votos', () => {
    // 4 versículos: 0→2 (5 votos), 2→0 (9), 1→3 (3), 3→3 (se ignora)
    const refs: Referencias = {
      versiculos: 4,
      total: 4,
      desp: new Uint32Array([0, 1, 2, 3, 4]),
      inicio: new Uint16Array([2, 3, 0, 3]),
      fin: new Uint16Array([2, 3, 0, 3]),
      votos: new Int16Array([5, 3, 9, 1]),
    }
    const mini = new Indice({ versiculos: 4, libros: [[4]], rv1909Desalineados: [] })
    const arcos = construirArcos(refs, mini)
    expect(arcos.cantidad).toBe(2)
    expect(Array.from(arcos.datos.slice(0, FLOATS_POR_ARCO))).toEqual([0, 2, 0, 9])
    expect(Array.from(arcos.votos)).toEqual([9, 3])
    expect(cantidadConVotos(arcos, 4)).toBe(1)
    expect(cantidadConVotos(arcos, -100)).toBe(2)
  })

  it('con los datos reales', () => {
    const arcos = construirArcos(leerReferencias(bufferXrefs()), indice)
    expect(arcos.cantidad).toBeGreaterThan(150000)
    expect(arcos.cantidad).toBeLessThan(344799)
    for (let i = 1; i < arcos.cantidad; i += 997) {
      expect(arcos.votos[i]).toBeLessThanOrEqual(arcos.votos[i - 1])
    }
  })

  it('asigna libros y colores', () => {
    const libros = librosPorVersiculo(indice)
    expect(libros[0]).toBe(1)
    expect(libros[indice.numero(43, 3, 16)]).toBe(43)
    expect(libros[31101]).toBe(66)
    expect(paletaRGB('oscuro')).toHaveLength(30)
  })
})
