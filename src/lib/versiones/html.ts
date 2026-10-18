// Limpieza de seguridad del HTML que llega de las APIs: quita scripts, iframes y atributos
// de eventos. No toca el texto ni la estructura de párrafos y versículos.

const ETIQUETAS_PELIGROSAS = 'script, style, iframe, object, embed, link, meta, form'

export function limpiarHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll(ETIQUETAS_PELIGROSAS).forEach((el) => el.remove())
  doc.body.querySelectorAll('*').forEach((el) => {
    for (const atributo of [...el.attributes]) {
      const nombre = atributo.name.toLowerCase()
      const valor = atributo.value.trim().toLowerCase()
      if (
        nombre.startsWith('on') ||
        ((nombre === 'href' || nombre === 'src') && valor.startsWith('javascript:'))
      ) {
        el.removeAttribute(atributo.name)
      }
    }
  })
  return doc.body.innerHTML
}
