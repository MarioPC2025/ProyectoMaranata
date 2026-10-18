// Dibujo en Canvas 2D: la línea base con los libros, los arcos resaltados de la selección
// y, si no hay WebGL2, una versión reducida de todos los arcos.

import type { Indice } from '../biblia/indice'
import { GENEROS, LIBROS } from '../biblia/libros'
import { colorGenero, type Tema } from './colores'
import { densidad, type Escala } from './escala'
import { arcoEnPantalla, type Lienzo } from './geometria'
import { FLOATS_POR_ARCO, type Arcos } from './instancias'

export const ALTO_BASE = 6

/** Prepara el contexto para dibujar en píxeles CSS y lo limpia */
export function prepararCanvas(canvas: HTMLCanvasElement, ancho: number): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')!
  const dpr = canvas.width / Math.max(1, ancho)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  return ctx
}

/** La Biblia como una franja: cada libro con el color de su género */
export function dibujarBase(
  ctx: CanvasRenderingContext2D,
  e: Escala,
  indice: Indice,
  lienzo: Lienzo,
  tema: Tema,
) {
  const d = densidad(e)
  for (const l of LIBROS) {
    const desde = indice.inicioCapitulo[indice.primerCapitulo[l.id - 1]]
    const hasta = indice.inicioCapitulo[indice.primerCapitulo[l.id]]
    const x0 = (desde - e.desde) / d
    const x1 = (hasta - e.desde) / d
    if (x1 < 0 || x0 > lienzo.ancho) continue
    ctx.fillStyle = colorGenero(l.genero, tema)
    // Un píxel de separación entre libros cuando hay lugar
    ctx.fillRect(x0, lienzo.base + 1, Math.max(1, x1 - x0 - (x1 - x0 > 4 ? 1 : 0)), ALTO_BASE)
  }
}

export interface ArcoSimple {
  a: number
  b: number
  /** Índice en GENEROS */
  genero: number
}

export function dibujarArcos2D(
  ctx: CanvasRenderingContext2D,
  e: Escala,
  arcos: Iterable<ArcoSimple>,
  lienzo: Lienzo,
  tema: Tema,
  estilo: { alfa: number; grosor: number },
) {
  ctx.lineWidth = estilo.grosor
  ctx.globalAlpha = estilo.alfa
  // Agrupa por color para no cambiar strokeStyle en cada arco
  const porGenero = new Map<number, Path2D>()
  for (const arco of arcos) {
    const g = arcoEnPantalla(e, arco.a, arco.b, lienzo)
    if (!g || g.radio < 0.25) continue
    let camino = porGenero.get(arco.genero)
    if (!camino) porGenero.set(arco.genero, (camino = new Path2D()))
    camino.moveTo(g.cx - g.radio, lienzo.base)
    camino.ellipse(g.cx, lienzo.base, g.radio, Math.max(0.5, g.alto), 0, Math.PI, 2 * Math.PI)
  }
  for (const [genero, camino] of porGenero) {
    ctx.strokeStyle = colorGenero(GENEROS[genero], tema)
    ctx.stroke(camino)
  }
  ctx.globalAlpha = 1
}

/** Los primeros `cantidad` arcos de la vista general como ArcoSimple (para el respaldo 2D) */
export function* recorrerArcos(arcos: Arcos, cantidad: number): Generator<ArcoSimple> {
  for (let i = 0; i < Math.min(cantidad, arcos.cantidad); i++) {
    const o = i * FLOATS_POR_ARCO
    yield { a: arcos.datos[o], b: arcos.datos[o + 1], genero: arcos.datos[o + 2] }
  }
}
