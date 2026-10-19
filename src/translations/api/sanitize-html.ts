/**
 * Limpieza de seguridad del HTML que llega de las APIs: quita scripts, iframes y atributos de
 * eventos. No toca el texto ni la estructura de párrafos y versículos.
 */

const DANGEROUS_TAGS = 'script, style, iframe, object, embed, link, meta, form';
const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href', 'action', 'formaction']);
const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/**
 * Lista blanca de esquemas: así quedan afuera `javascript:`, `data:`, `vbscript:` y cualquier otro.
 * Los navegadores ignoran espacios y caracteres de control dentro de la URL (`java\tscript:`), por
 * eso se quitan antes de mirar el esquema.
 */
export function isSafeUrl(url: string): boolean {
  // eslint-disable-next-line no-control-regex
  const cleaned = url.replace(/[\u0000- \u007f]/g, '').toLowerCase();
  const scheme = /^[a-z][a-z0-9+.-]*:/.exec(cleaned);
  return !scheme || ALLOWED_SCHEMES.has(scheme[0]);
}

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll(DANGEROUS_TAGS).forEach((element) => {
    element.remove();
  });
  doc.body.querySelectorAll('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on') || (URL_ATTRIBUTES.has(name) && !isSafeUrl(attribute.value))) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return doc.body.innerHTML;
}
