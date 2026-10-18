// NVI-S y RVES vía YouVersion Platform. El SDK se carga recién cuando se elige una de estas
// versiones, para no sumar peso a la carga inicial del sitio.

import { VersionNoDisponible, type ProveedorVersion, type TextoVersion } from './tipos'

const APP_KEY = import.meta.env.VITE_YVP_APP_KEY as string | undefined
/** Hoja de estilos del renderer de YouVersion (la misma que devuelve getPassageDisplay) */
const ESTILOS_BIBLIA = 'https://cdn.youversion.com/platform/1/bible.css'

type Cliente = import('@youversion/platform-core').BibleClient
let cliente: Promise<Cliente> | undefined

function obtenerCliente(): Promise<Cliente> {
  cliente ??= import('@youversion/platform-core').then(
    ({ ApiClient, BibleClient }) => new BibleClient(new ApiClient({ appKey: APP_KEY! })),
  )
  return cliente
}

function crear(
  id: string,
  versionId: number,
  abreviatura: string,
  nombre: string,
): ProveedorVersion {
  return {
    id,
    abreviatura,
    nombre,
    configurada: !!APP_KEY,
    async obtener(usfmLibro, capitulo): Promise<TextoVersion> {
      if (!APP_KEY) throw new VersionNoDisponible('Falta la app key de YouVersion')
      const pasaje = `${usfmLibro}.${capitulo}`
      try {
        const bible = await obtenerCliente()
        try {
          const d = await bible.getPassageDisplay({ versionId, passageId: pasaje })
          return {
            html: d.html,
            atribucion: d.attribution.text,
            estilos: d.stylesheets.map((s) => s.href),
            atributosContenedor: { ...d.containerAttributes },
            enlace: d.version.youversion_deep_link,
          }
        } catch (e) {
          // Algunas versiones (como la RVES, 147) no traen texto de atribución y el SDK no
          // las muestra con getPassageDisplay: se usa getPassage y se atribuye con el título.
          if ((e as { code?: string }).code !== 'missing_passage_attribution') throw e
          const { BIBLE_CONTAINER_ATTRIBUTES } = await import('@youversion/platform-core')
          const [p, v] = await Promise.all([
            bible.getPassage(versionId, pasaje, 'html'),
            bible.getVersion(versionId),
          ])
          return {
            html: p.content,
            atribucion: `${v.title} (${v.abbreviation}), vía YouVersion.`,
            estilos: [ESTILOS_BIBLIA],
            atributosContenedor: { ...BIBLE_CONTAINER_ATTRIBUTES },
            enlace: v.youversion_deep_link,
          }
        }
      } catch (e) {
        const estado = (e as { status?: number }).status
        if (estado === 401 || estado === 403) throw new VersionNoDisponible(String(e))
        throw e
      }
    },
  }
}

export const nvi = crear('nvi', 128, 'NVI', 'Nueva Versión Internacional 2025')
export const rves = crear('rves', 147, 'RVES', 'Reina-Valera Antigua')
