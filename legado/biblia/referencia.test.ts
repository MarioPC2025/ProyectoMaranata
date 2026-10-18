import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Indice } from './indice'
import { LIBROS, buscarLibro } from './libros'
import { desdeRuta, esValida, formatear, formatearRango, parsear, ruta } from './referencia'

const indice = new Indice(JSON.parse(readFileSync('public/data/indice.json', 'utf-8')))

describe('libros', () => {
  it('tiene 66 libros con slugs y abreviaturas únicos', () => {
    expect(LIBROS).toHaveLength(66)
    expect(new Set(LIBROS.map((l) => l.slug)).size).toBe(66)
    expect(new Set(LIBROS.map((l) => l.abreviatura)).size).toBe(66)
    expect(LIBROS[45].slug).toBe('1-corintios')
    expect(LIBROS[0].slug).toBe('genesis')
  })

  it('cada nombre y abreviatura lleva a su propio libro', () => {
    for (const l of LIBROS) {
      expect(parsear(l.nombre)?.libro, l.nombre).toBe(l.id)
      expect(parsear(l.abreviatura)?.libro, l.abreviatura).toBe(l.id)
    }
  })

  it('no adivina prefijos ambiguos', () => {
    expect(buscarLibro('ju')).toBeUndefined()
    expect(buscarLibro('gene')?.id).toBe(1)
  })
})

describe('parsear', () => {
  it.each([
    ['juan 3.16', { libro: 43, capitulo: 3, versiculo: 16 }],
    ['Jn3:16', { libro: 43, capitulo: 3, versiculo: 16 }],
    ['Juan 3 16', { libro: 43, capitulo: 3, versiculo: 16 }],
    ['JUAN 3,16', { libro: 43, capitulo: 3, versiculo: 16 }],
    ['1 co 13', { libro: 46, capitulo: 13 }],
    ['1co13', { libro: 46, capitulo: 13 }],
    ['1 Corintios 13:4-7', { libro: 46, capitulo: 13, versiculo: 4, versiculoFin: 7 }],
    ['primera de corintios 13', { libro: 46, capitulo: 13 }],
    ['II Reyes 2', { libro: 12, capitulo: 2 }],
    ['ex 20 1-17', { libro: 2, capitulo: 20, versiculo: 1, versiculoFin: 17 }],
    ['Éx 20', { libro: 2, capitulo: 20 }],
    ['exodo', { libro: 2 }],
    ['Gn 1:1', { libro: 1, capitulo: 1, versiculo: 1 }],
    ['gn. 1.1', { libro: 1, capitulo: 1, versiculo: 1 }],
    ['sal 23', { libro: 19, capitulo: 23 }],
    ['Salmo 119:105', { libro: 19, capitulo: 119, versiculo: 105 }],
    ['cantar de los cantares 2:1', { libro: 22, capitulo: 2, versiculo: 1 }],
    ['1 jn 4:8', { libro: 62, capitulo: 4, versiculo: 8 }],
    ['3 Juan 1:14', { libro: 64, capitulo: 1, versiculo: 14 }],
    ['jud 3', { libro: 65, capitulo: 3 }],
    ['Hch 2:38', { libro: 44, capitulo: 2, versiculo: 38 }],
    ['ap 22 21', { libro: 66, capitulo: 22, versiculo: 21 }],
    ['  Isaías   53  ', { libro: 23, capitulo: 53 }],
    ['is 53:5', { libro: 23, capitulo: 53, versiculo: 5 }],
    ['fil 4:13', { libro: 50, capitulo: 4, versiculo: 13 }],
    ['flm 1', { libro: 57, capitulo: 1 }],
    ['stg 1:5', { libro: 59, capitulo: 1, versiculo: 5 }],
    ['nahum 1', { libro: 34, capitulo: 1 }],
  ])('%s', (entrada, esperado) => {
    expect(parsear(entrada)).toEqual(esperado)
  })

  it.each(['', 'hola', '3:16', 'ju 3:16', '4 juan 1'])('rechaza "%s"', (entrada) => {
    expect(parsear(entrada)).toBeNull()
  })
})

describe('validación y formato', () => {
  it('valida contra el índice', () => {
    expect(esValida({ libro: 43, capitulo: 3, versiculo: 16 }, indice)).toBe(true)
    expect(esValida({ libro: 43, capitulo: 22 }, indice)).toBe(false)
    expect(esValida({ libro: 64, capitulo: 1, versiculo: 15 }, indice)).toBe(false)
  })

  it('formatea nombres y rangos', () => {
    expect(formatear({ libro: 43, capitulo: 3, versiculo: 16 })).toBe('Juan 3:16')
    expect(formatear({ libro: 46, capitulo: 13 }, true)).toBe('1 Co 13')
    const n = (l: number, c: number, v: number) => indice.numero(l, c, v)
    expect(formatearRango(n(43, 1, 1), n(43, 1, 3), indice)).toBe('Jn 1:1-3')
    expect(formatearRango(n(1, 1, 31), n(1, 2, 3), indice)).toBe('Gn 1:31–2:3')
    expect(formatearRango(n(63, 1, 1), n(64, 1, 14), indice)).toBe('2 Jn 1:1 – 3 Jn 1:14')
  })

  it('va y vuelve de la ruta', () => {
    const ref = { libro: 46, capitulo: 13, versiculo: 4 }
    expect(ruta(ref)).toBe('/1-corintios/13/4')
    expect(desdeRuta('/1-corintios/13/4')).toEqual(ref)
    expect(desdeRuta('/juan')).toEqual({ libro: 43 })
    expect(desdeRuta('/acerca')).toBeNull()
    expect(desdeRuta('/juan/x')).toBeNull()
  })
})

describe('índice', () => {
  it('numera y vuelve', () => {
    expect(indice.total).toBe(31102)
    expect(indice.numero(1, 1, 1)).toBe(0)
    expect(indice.numero(66, 22, 21)).toBe(31101)
    for (const n of [0, 1, 1532, 1533, 23144, 31101]) {
      const p = indice.posicion(n)
      expect(indice.numero(p.libro, p.capitulo, p.versiculo)).toBe(n)
    }
    expect(indice.posicion(1533)).toEqual({ libro: 2, capitulo: 1, versiculo: 1 })
  })
})
