// Lectura de public/data/xrefs.bin. El formato está documentado en scripts/construir.py.

export interface Referencias {
  /** Cantidad de versículos (N) */
  versiculos: number
  /** Cantidad total de referencias (R) */
  total: number
  /** Las referencias del versículo v están en [desp[v], desp[v+1]) */
  desp: Uint32Array
  /** Versículo destino inicial de cada referencia */
  inicio: Uint16Array
  /** Versículo destino final (igual al inicial si no es un rango) */
  fin: Uint16Array
  /** Votos de OpenBible.info */
  votos: Int16Array
}

export interface ReferenciaCruzada {
  inicio: number
  fin: number
  votos: number
}

const VERSION = 1

export function leerReferencias(buffer: ArrayBuffer): Referencias {
  const vista = new DataView(buffer)
  const magia = String.fromCharCode(...new Uint8Array(buffer, 0, 4))
  if (magia !== 'MBXR') throw new Error('xrefs.bin inválido')
  const version = vista.getUint32(4, true)
  if (version !== VERSION) throw new Error(`Versión de xrefs.bin no soportada: ${version}`)
  const n = vista.getUint32(8, true)
  const r = vista.getUint32(12, true)
  let pos = 16
  const desp = new Uint32Array(buffer, pos, n + 1)
  pos += 4 * (n + 1)
  const inicio = new Uint16Array(buffer, pos, r)
  pos += 2 * r
  const fin = new Uint16Array(buffer, pos, r)
  pos += 2 * r
  const votos = new Int16Array(buffer, pos, r)
  pos += 2 * r
  if (pos !== buffer.byteLength) throw new Error('xrefs.bin con tamaño inesperado')
  return { versiculos: n, total: r, desp, inicio, fin, votos }
}

/** Referencias de un versículo, ordenadas por votos (de mayor a menor). */
export function referenciasDe(refs: Referencias, versiculo: number): ReferenciaCruzada[] {
  const lista: ReferenciaCruzada[] = []
  for (let i = refs.desp[versiculo]; i < refs.desp[versiculo + 1]; i++) {
    lista.push({ inicio: refs.inicio[i], fin: refs.fin[i], votos: refs.votos[i] })
  }
  return lista
}
