// NTV vía API.Bible, a través de nuestro proxy (/api/ntv), que guarda la clave y la caché.
// Cada vista se reporta con FUMS v3 (obligatorio, regla legal 3).

import { VersionNoDisponible, type ProveedorVersion, type TextoVersion } from './tipos'

const FUMS_SCRIPT = 'https://pkg.api.bible/fumsV3.min.js'

declare global {
  interface Window {
    fums?: (...args: unknown[]) => void
    fumsData?: unknown[]
  }
}

/** Carga el tracker de FUMS una sola vez, con la cola que indica la documentación de API.Bible */
function cargarFums() {
  if (window.fums) return
  window.fumsData = window.fumsData || []
  window.fums = function (...args: unknown[]) {
    window.fumsData!.push(args)
  }
  const script = document.createElement('script')
  script.src = FUMS_SCRIPT
  script.async = true
  document.body.appendChild(script)
}

function reportarVista(token: string | null) {
  if (!token) return
  cargarFums()
  window.fums!('trackView', token)
}

export const ntv: ProveedorVersion = {
  id: 'ntv',
  abreviatura: 'NTV',
  nombre: 'Nueva Traducción Viviente',
  configurada: true, // la clave vive en el servidor; si falta, el proxy responde 503
  async obtener(usfmLibro, capitulo): Promise<TextoVersion> {
    const resp = await fetch(`/api/ntv/${usfmLibro}/${capitulo}`)
    if (resp.status === 503) throw new VersionNoDisponible('NTV no disponible')
    if (!resp.ok) throw new Error(`No se pudo cargar la NTV (${resp.status})`)
    const datos = (await resp.json()) as {
      html: string
      copyright: string
      fumsToken: string | null
    }
    return {
      html: datos.html,
      atribucion: datos.copyright,
      alMostrar: () => reportarVista(datos.fumsToken),
    }
  },
}
