/**
 * Versiones bíblicas que se leen desde una API (NTV, NVI-S, RVES): tienen copyright, así que su
 * texto nunca se guarda en el repo ni se mezcla con el de las traducciones incluidas. Se pide un
 * capítulo cuando el lector elige la versión y se muestra tal cual llega, sin reestructurarlo ni
 * agregarle nada (regla legal 2).
 */

export const API_VERSION_IDS = ['ntv', 'nvi', 'rves'] as const;
export type ApiVersionId = (typeof API_VERSION_IDS)[number];

/** Un capítulo tal como lo devuelve la API. */
export interface ApiChapterText {
  /** HTML del capítulo, sin limpiar todavía (ver `sanitizeHtml`). */
  readonly html: string;
  /** Copyright o atribución, siempre visible junto al texto. */
  readonly attribution: string;
  /** Hojas de estilo que pide la API para mostrar su HTML. */
  readonly stylesheets: readonly string[];
  /** Atributos que la API pide poner en el contenedor del HTML. */
  readonly containerAttributes: Readonly<Record<string, string>>;
  /** Enlace al pasaje en el sitio de la versión, si lo hay. */
  readonly link: string | null;
  /** Se llama una vez que el texto está en pantalla (el reporte FUMS de API.Bible). */
  readonly onShown: (() => void) | null;
}

export interface ApiVersion {
  readonly id: ApiVersionId;
  readonly abbreviation: string;
  readonly name: string;
  /** `false` si falta la configuración (la clave) para usarla: entonces no se ofrece. */
  readonly configured: () => boolean;
  /** El capítulo `chapter` del libro con código USFM `usfmBook` (`JHN`). */
  readonly fetchChapter: (usfmBook: string, chapter: number) => Promise<ApiChapterText>;
}

/** La versión no se puede usar ahora (sin acceso, límite alcanzado, sin clave). */
export class ApiVersionUnavailableError extends Error {
  override readonly name = 'ApiVersionUnavailableError';
}
