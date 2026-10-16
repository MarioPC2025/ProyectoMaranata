// Lectura y escritura de referencias bíblicas en español ("Juan 3:16", "1 co 13", "Jn3.16").

import type { Indice, Posicion } from './indice'
import { buscarLibro, libro, libroPorSlug, normalizar, sinTildes } from './libros'

export interface Referencia {
  libro: number
  capitulo?: number
  versiculo?: number
  versiculoFin?: number
}

const ORDINALES: [RegExp, string][] = [
  [/^(primera|primero|primer|1ra|1ro|1a|1o|i)\s+(de\s+)?/, '1 '],
  [/^(segunda|segundo|2da|2do|2a|2o|ii)\s+(de\s+)?/, '2 '],
  [/^(tercera|tercero|3ra|3ro|3a|3o|iii)\s+(de\s+)?/, '3 '],
]

const PATRON =
  /^([123])?\s*([a-zñ][a-zñ\s.]*?)\.?\s*(\d+)?(?:\s*[:.,\s]\s*(\d+))?(?:\s*[-–]\s*(\d+))?$/

/** Interpreta lo que escribe el usuario. No valida que el capítulo o versículo existan. */
export function parsear(entrada: string): Referencia | null {
  let s = sinTildes(entrada.trim()).replace(/\s+/g, ' ')
  for (const [re, num] of ORDINALES) s = s.replace(re, num)
  const m = PATRON.exec(s)
  if (!m) return null
  const [, numero = '', nombre, cap, vers, fin] = m
  const l = buscarLibro(numero + normalizar(nombre))
  if (!l) return null
  const ref: Referencia = { libro: l.id }
  if (cap) ref.capitulo = Number(cap)
  if (cap && vers) ref.versiculo = Number(vers)
  if (ref.versiculo && fin && Number(fin) > ref.versiculo) ref.versiculoFin = Number(fin)
  return ref
}

/** true si la referencia existe en el índice (capítulo y versículos dentro de rango). */
export function esValida(ref: Referencia, indice: Indice): boolean {
  const cap = ref.capitulo ?? 1
  if (cap < 1 || cap > indice.capitulos(ref.libro)) return false
  if (ref.versiculo !== undefined && !indice.existe(ref.libro, cap, ref.versiculo)) return false
  if (ref.versiculoFin !== undefined && !indice.existe(ref.libro, cap, ref.versiculoFin))
    return false
  return true
}

export function formatear(ref: Referencia, corto = false): string {
  const l = libro(ref.libro)
  let s = corto ? l.abreviatura : l.nombre
  if (ref.capitulo) s += ` ${ref.capitulo}`
  if (ref.capitulo && ref.versiculo) s += `:${ref.versiculo}`
  if (ref.versiculoFin) s += `-${ref.versiculoFin}`
  return s
}

/** Formatea un rango de versículos del índice global: "Jn 1:1-3", "Gn 1:31–2:3", "2 Jn 1:1 – 3 Jn 1:14". */
export function formatearRango(inicio: number, fin: number, indice: Indice, corto = true): string {
  const a = indice.posicion(inicio)
  const texto = (p: Posicion) => formatear({ ...p }, corto)
  if (inicio === fin) return texto(a)
  const b = indice.posicion(fin)
  if (a.libro !== b.libro) return `${texto(a)} – ${texto(b)}`
  if (a.capitulo !== b.capitulo) return `${texto(a)}–${b.capitulo}:${b.versiculo}`
  return `${texto(a)}-${b.versiculo}`
}

export function ruta(ref: Referencia): string {
  let s = `/${libro(ref.libro).slug}`
  if (ref.capitulo) s += `/${ref.capitulo}`
  if (ref.capitulo && ref.versiculo) s += `/${ref.versiculo}`
  return s
}

/** "/juan/3/16" → { libro: 43, capitulo: 3, versiculo: 16 }. null si no es una ruta de referencia. */
export function desdeRuta(path: string): Referencia | null {
  const partes = path.split('/').filter(Boolean).map(decodeURIComponent)
  if (partes.length === 0 || partes.length > 3) return null
  const l = libroPorSlug(partes[0])
  if (!l) return null
  const nums = partes.slice(1).map(Number)
  if (nums.some((n) => !Number.isInteger(n) || n < 1)) return null
  const ref: Referencia = { libro: l.id }
  if (nums[0]) ref.capitulo = nums[0]
  if (nums[1]) ref.versiculo = nums[1]
  return ref
}
