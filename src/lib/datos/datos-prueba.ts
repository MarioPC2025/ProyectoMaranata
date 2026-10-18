// Solo para tests (usa node:fs): lee los datos generados de public/data como el navegador.
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'

/** public/data/xrefs.bin.gz descomprimido */
export function bufferXrefs(): ArrayBuffer {
  const crudo = gunzipSync(readFileSync('public/data/xrefs.bin.gz'))
  return crudo.buffer.slice(crudo.byteOffset, crudo.byteOffset + crudo.byteLength) as ArrayBuffer
}
