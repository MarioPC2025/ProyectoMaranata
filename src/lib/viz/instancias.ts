// Arcos de la vista general: un arco por par de versículos conectados.
// A→B y B→A dibujan el mismo arco, así que se fusionan (quedan los votos mayores).

import type { Indice } from '../biblia/indice'
import { GENEROS, LIBROS } from '../biblia/libros'
import type { Referencias } from '../datos/xrefs'

/** Floats por instancia en `datos`: [izquierda, derecha, género, votos] */
export const FLOATS_POR_ARCO = 4

export interface Arcos {
  /** Cantidad de arcos únicos */
  cantidad: number
  /** Interleaved, ordenado por votos (de mayor a menor) */
  datos: Float32Array
  /** Votos de cada arco, en el mismo orden (para elegir un umbral) */
  votos: Int16Array
}

/** Libro (1-66) de cada versículo del índice */
export function librosPorVersiculo(indice: Indice): Uint8Array {
  const libros = new Uint8Array(indice.total)
  for (let l = 1; l <= indice.conteos.length; l++) {
    const desde = indice.inicioCapitulo[indice.primerCapitulo[l - 1]]
    const hasta = indice.inicioCapitulo[indice.primerCapitulo[l]]
    libros.fill(l, desde, hasta)
  }
  return libros
}

export function construirArcos(refs: Referencias, indice: Indice): Arcos {
  const libros = librosPorVersiculo(indice)
  const generoDeLibro = LIBROS.map((l) => GENEROS.indexOf(l.genero))
  // clave = izquierda * 32768 + derecha → posición en las listas
  const pares = new Map<number, number>()
  const izq: number[] = []
  const der: number[] = []
  const votos: number[] = []

  for (let v = 0; v < refs.versiculos; v++) {
    for (let i = refs.desp[v]; i < refs.desp[v + 1]; i++) {
      const destino = refs.inicio[i]
      if (destino === v) continue
      const a = Math.min(v, destino)
      const b = Math.max(v, destino)
      const clave = a * 32768 + b
      const pos = pares.get(clave)
      if (pos === undefined) {
        pares.set(clave, izq.length)
        izq.push(a)
        der.push(b)
        votos.push(refs.votos[i])
      } else if (refs.votos[i] > votos[pos]) {
        votos[pos] = refs.votos[i]
      }
    }
  }

  const orden = Array.from(izq.keys()).sort((p, q) => votos[q] - votos[p])
  const datos = new Float32Array(orden.length * FLOATS_POR_ARCO)
  const votosOrdenados = new Int16Array(orden.length)
  orden.forEach((p, i) => {
    const o = i * FLOATS_POR_ARCO
    datos[o] = izq[p]
    datos[o + 1] = der[p]
    datos[o + 2] = generoDeLibro[libros[izq[p]] - 1]
    datos[o + 3] = votos[p]
    votosOrdenados[i] = votos[p]
  })
  return { cantidad: orden.length, datos, votos: votosOrdenados }
}

/** Cuántos arcos (los primeros, por estar ordenados) tienen al menos `minimo` votos */
export function cantidadConVotos(arcos: Arcos, minimo: number): number {
  let lo = 0
  let hi = arcos.cantidad
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (arcos.votos[mid] >= minimo) lo = mid + 1
    else hi = mid
  }
  return lo
}
