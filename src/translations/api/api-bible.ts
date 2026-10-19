import { ApiVersionUnavailableError, type ApiChapterText, type ApiVersion } from './types.ts';

/**
 * La NTV, vía API.Bible y a través del proxy de `functions/api/ntv/`, que guarda la clave y la
 * caché (en el navegador nunca hay clave). Cada vista se reporta con FUMS v3, que API.Bible exige
 * (regla legal 3).
 */

const FUMS_SCRIPT = 'https://pkg.api.bible/fumsV3.min.js';

declare global {
  interface Window {
    fums?: (...args: unknown[]) => void;
    fumsData?: unknown[];
  }
}

/** Carga el tracker de FUMS una sola vez, con la cola que indica la documentación de API.Bible. */
function loadFums(): void {
  if (window.fums) {
    return;
  }
  const queue: unknown[] = (window.fumsData ??= []);
  window.fums = (...args: unknown[]) => {
    queue.push(args);
  };
  const script = document.createElement('script');
  script.src = FUMS_SCRIPT;
  script.async = true;
  document.body.append(script);
}

function trackView(token: string | null): void {
  if (token === null) {
    return;
  }
  loadFums();
  window.fums?.('trackView', token);
}

/**
 * La dirección del proxy. En el sitio es el mismo origen; en la app de Android la página se sirve
 * desde el teléfono, así que va al sitio publicado (`VITE_API_ORIGIN`, ver `.env.android`).
 */
function proxyUrl(path: string): string {
  const relative = `${import.meta.env.BASE_URL}${path}`;
  const origin = import.meta.env.VITE_API_ORIGIN;
  return origin ? new URL(relative, origin).href : relative;
}

interface ProxyChapter {
  readonly html: string;
  readonly copyright: string;
  readonly fumsToken: string | null;
}

export const ntv: ApiVersion = {
  id: 'ntv',
  abbreviation: 'NTV',
  name: 'Nueva Traducción Viviente',
  // La clave vive en el servidor; si falta, el proxy responde 503.
  configured: () => true,
  async fetchChapter(usfmBook, chapter): Promise<ApiChapterText> {
    const response = await fetch(proxyUrl(`api/ntv/${usfmBook}/${String(chapter)}`));
    if (response.status === 503) {
      throw new ApiVersionUnavailableError('NTV no disponible');
    }
    if (!response.ok) {
      throw new Error(`No se pudo cargar la NTV (${String(response.status)})`);
    }
    const data = (await response.json()) as ProxyChapter;
    return {
      html: data.html,
      attribution: data.copyright,
      stylesheets: [],
      containerAttributes: {},
      link: null,
      onShown: () => {
        trackView(data.fumsToken);
      },
    };
  },
};
