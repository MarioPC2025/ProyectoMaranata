// Registro de versiones para el selector "Ver en…".

import { ntv } from './apibible'
import type { ProveedorVersion } from './tipos'
import { nvi, rves } from './youversion'

export const PROVEEDORES: ProveedorVersion[] = [ntv, nvi, rves]

/** Versiones sin licencia propia: se ofrecen como link a otro sitio */
export interface VersionExterna {
  abreviatura: string
  nombre: string
  enlace(nombreLibro: string, capitulo: number): string
}

const bibleGateway =
  (version: string) =>
  (nombreLibro: string, capitulo: number): string =>
    `https://www.biblegateway.com/passage/?search=${encodeURIComponent(`${nombreLibro} ${capitulo}`)}&version=${version}`

export const EXTERNAS: VersionExterna[] = [
  { abreviatura: 'RVR1960', nombre: 'Reina-Valera 1960', enlace: bibleGateway('RVR1960') },
  { abreviatura: 'TLA', nombre: 'Traducción en Lenguaje Actual', enlace: bibleGateway('TLA') },
]
