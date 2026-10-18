// Lectura de public/data/xrefs.bin.gz (ya descomprimido). El formato (versión 2) está
// documentado en scripts/construir.py: conteos por origen, destinos como diferencias y cada
// arreglo "en planos" (bytes bajos y después altos). Acá se reconstruyen valores absolutos.

export interface Referencias {
  /** Cantidad de versículos (N) */
  versiculos: number
  /** Cantidad total de referencias (R) */
  total: number
  /** Las referencias del versículo v están en [desp[v], desp[v+1]) */
  desp: Uint32Array
  /** Versículo destino inicial de cada referencia (ordenadas por destino dentro de cada origen) */
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

const VERSION = 2

/** Lee `cantidad` valores de 16 bits guardados en planos a partir de `pos` */
function dePlanos(bytes: Uint8Array, pos: number, cantidad: number, conSigno: boolean) {
  const valores = conSigno ? new Int16Array(cantidad) : new Uint16Array(cantidad)
  for (let i = 0; i < cantidad; i++) {
    const v = bytes[pos + i] | (bytes[pos + cantidad + i] << 8)
    valores[i] = conSigno && v > 0x7fff ? v - 0x10000 : v
  }
  return valores
}

export function leerReferencias(buffer: ArrayBuffer): Referencias {
  const vista = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  if (buffer.byteLength < 16) throw new Error('xrefs inválido')
  const magia = String.fromCharCode(...bytes.subarray(0, 4))
  if (magia !== 'MBXR') throw new Error('xrefs inválido')
  const version = vista.getUint32(4, true)
  if (version !== VERSION) throw new Error(`Versión de xrefs no soportada: ${version}`)
  const n = vista.getUint32(8, true)
  const r = vista.getUint32(12, true)
  if (buffer.byteLength !== 16 + 2 * n + 6 * r) throw new Error('xrefs con tamaño inesperado')

  let pos = 16
  const conteos = dePlanos(bytes, pos, n, false)
  pos += 2 * n
  const deltas = dePlanos(bytes, pos, r, true)
  pos += 2 * r
  const largos = dePlanos(bytes, pos, r, false)
  pos += 2 * r
  const votos = dePlanos(bytes, pos, r, true) as Int16Array

  const desp = new Uint32Array(n + 1)
  const inicio = new Uint16Array(r)
  const fin = new Uint16Array(r)
  let i = 0
  for (let origen = 0; origen < n; origen++) {
    let anterior = origen
    for (let k = 0; k < conteos[origen]; k++, i++) {
      anterior += deltas[i]
      inicio[i] = anterior
      fin[i] = anterior + largos[i]
    }
    desp[origen + 1] = i
  }
  return { versiculos: n, total: r, desp, inicio, fin, votos }
}

/** Referencias de un versículo, ordenadas por votos (de mayor a menor) y después por destino. */
export function referenciasDe(refs: Referencias, versiculo: number): ReferenciaCruzada[] {
  const lista: ReferenciaCruzada[] = []
  for (let i = refs.desp[versiculo]; i < refs.desp[versiculo + 1]; i++) {
    lista.push({ inicio: refs.inicio[i], fin: refs.fin[i], votos: refs.votos[i] })
  }
  return lista.sort((a, b) => b.votos - a.votos || a.inicio - b.inicio)
}
