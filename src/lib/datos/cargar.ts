// Carga perezosa (y con caché en memoria) de los datos de public/data.

import { Indice, type DatosIndice } from '../biblia/indice'
import { leerReferencias, type Referencias } from './xrefs'

const BASE = `${import.meta.env.BASE_URL}data`

let indice: Promise<Indice> | undefined
let referencias: Promise<Referencias> | undefined
const libros = new Map<number, Promise<string[][]>>()

async function pedir(url: string): Promise<Response> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`No se pudo cargar ${url} (${resp.status})`)
  return resp
}

export async function descomprimirSiHaceFalta(datos: ArrayBuffer): Promise<ArrayBuffer> {
  const b = new Uint8Array(datos, 0, Math.min(2, datos.byteLength))
  if (b[0] !== 0x1f || b[1] !== 0x8b) return datos
  const flujo = new Blob([datos]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(flujo).arrayBuffer()
}

export function cargarIndice(): Promise<Indice> {
  indice ??= pedir(`${BASE}/indice.json`)
    .then((r) => r.json() as Promise<DatosIndice>)
    .then((d) => new Indice(d))
  return indice
}

export function cargarReferencias(): Promise<Referencias> {
  // El archivo está comprimido con gzip, así no depende de que el hosting comprima. Algunos
  // servidores lo mandan con Content-Encoding: gzip y el navegador ya lo descomprime; por
  // eso se miran los primeros bytes antes de descomprimir.
  referencias ??= pedir(`${BASE}/xrefs.bin.gz`)
    .then((r) => r.arrayBuffer())
    .then(descomprimirSiHaceFalta)
    .then(leerReferencias)
  return referencias
}

/** Texto RV1909 de un libro: lista de capítulos, cada uno lista de versículos. */
export function cargarLibroRV1909(libro: number): Promise<string[][]> {
  let p = libros.get(libro)
  if (!p) {
    p = pedir(`${BASE}/rv1909/${libro}.json`).then((r) => r.json() as Promise<string[][]>)
    p.catch(() => libros.delete(libro))
    libros.set(libro, p)
  }
  return p
}
