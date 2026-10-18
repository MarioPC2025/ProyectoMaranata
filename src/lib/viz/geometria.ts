// Forma de los arcos, compartida por el renderer WebGL (que la repite en el shader) y Canvas 2D.
// Cada arco es media elipse sobre la línea base: el ancho lo dan sus extremos y la altura
// crece con el ancho hasta altoMax (un arco que cruza toda la vista llega arriba de todo).

import { densidad, type Escala } from './escala'

export interface Lienzo {
  /** Ancho en píxeles CSS */
  ancho: number
  /** y (en píxeles CSS, desde arriba) de la línea base */
  base: number
  /** Altura máxima de un arco */
  altoMax: number
}

export function alturaArco(radio: number, lienzo: Lienzo): number {
  return lienzo.altoMax * Math.min(1, (2 * radio) / lienzo.ancho)
}

/** Centro, radio horizontal y altura de un arco entre los versículos a y b, o null si no se ve. */
export function arcoEnPantalla(
  e: Escala,
  a: number,
  b: number,
  lienzo: Lienzo,
): { cx: number; radio: number; alto: number } | null {
  const d = densidad(e)
  const x0 = (Math.min(a, b) + 0.5 - e.desde) / d
  const x1 = (Math.max(a, b) + 0.5 - e.desde) / d
  if (x1 < 0 || x0 > lienzo.ancho) return null
  const radio = (x1 - x0) / 2
  return { cx: (x0 + x1) / 2, radio, alto: alturaArco(radio, lienzo) }
}
