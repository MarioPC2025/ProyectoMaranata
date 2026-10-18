import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import {
  bloqueConcordancia,
  deltasAVersiculos,
  glosa,
  partesStrong,
  strongPrincipal,
  type Lexico,
  type Palabra,
} from './original'

const leer = <T>(ruta: string): T =>
  JSON.parse(gunzipSync(readFileSync(`public/data/${ruta}`)).toString('utf-8'))

describe('datos originales', () => {
  it('separa los Strongs y encuentra el principal', () => {
    expect(partesStrong('H9003/{H7225G}')).toEqual({ partes: ['H9003', 'H7225G'], principal: 1 })
    expect(partesStrong('G3056')).toEqual({ partes: ['G3056'], principal: 0 })
  })

  it('calcula bloques y versículos de la concordancia', () => {
    expect(bloqueConcordancia('G3056')).toBe('G6')
    expect(bloqueConcordancia('H0430G')).toBe('H0')
    expect(deltasAVersiculos([10, 2, 5])).toEqual([10, 12, 17])
  })

  it('Gn 1:1 y Jn 1:1 en los archivos generados', () => {
    const genesis = leer<Palabra[][][]>('original/1.json.gz')
    const palabra = genesis[0][0][0]
    expect(strongPrincipal(palabra)).toBe('H7225G')
    expect(glosa(palabra)).toEqual({ texto: 'in beginning', enIngles: true })

    const juan = leer<Palabra[][][]>('original/43.json.gz')
    expect(glosa(juan[0][0][4])).toEqual({ texto: 'Palabra', enIngles: false })

    const lexico = leer<Lexico>('lexico/G.json.gz')
    expect(lexico.G3056[0]).toBe('λόγος')
    const morfologia = JSON.parse(readFileSync('public/data/morfologia.json', 'utf-8'))
    expect(morfologia[palabra[5]]).toMatch(/^Sustantivo/)
  })
})
