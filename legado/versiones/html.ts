// Limpieza de seguridad del HTML que llega de las APIs: quita scripts, iframes y atributos
// de eventos. No toca el texto ni la estructura de párrafos y versículos.

const ETIQUETAS_PELIGROSAS = 'script, style, iframe, object, embed, link, meta, form'
const ATRIBUTOS_URL = new Set(['href', 'src', 'xlink:href', 'action', 'formaction'])
const ESQUEMAS_PERMITIDOS = new Set(['http:', 'https:', 'mailto:'])

// Lista blanca de esquemas: así quedan afuera javascript:, data:, vbscript: y cualquier
// otro. Los navegadores ignoran espacios y caracteres de control dentro de la URL
// ("java\tscript:"), por eso se quitan antes de mirar el esquema.
export function esUrlSegura(url: string): boolean {
  // eslint-disable-next-line no-control-regex
  const limpia = url.replace(/[\u0000- \u007f]/g, '').toLowerCase()
  const esquema = /^[a-z][a-z0-9+.-]*:/.exec(limpia)
  return !esquema || ESQUEMAS_PERMITIDOS.has(esquema[0])
}

export function limpiarHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll(ETIQUETAS_PELIGROSAS).forEach((el) => el.remove())
  doc.body.querySelectorAll('*').forEach((el) => {
    for (const atributo of [...el.attributes]) {
      const nombre = atributo.name.toLowerCase()
      if (
        nombre.startsWith('on') ||
        (ATRIBUTOS_URL.has(nombre) && !esUrlSegura(atributo.value))
      ) {
        el.removeAttribute(atributo.name)
      }
    }
  })
  return doc.body.innerHTML
}
