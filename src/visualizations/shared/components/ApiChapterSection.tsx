import { useEffect, useState } from 'react';
import { ReadingIcon } from '../../../shared/ui/icons.tsx';
import { sanitizeHtml } from '../../../translations/api/sanitize-html.ts';
import { ApiVersionUnavailableError } from '../../../translations/api/types.ts';
import type { ApiChapterText, ApiVersion } from '../../../translations/api/types.ts';
import { PanelSection } from './PanelSection.tsx';
import styles from './PassagePanel.module.css';

type ChapterState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly text: ApiChapterText }
  | { readonly status: 'unavailable' }
  | { readonly status: 'error' };

const LOADING: ChapterState = { status: 'loading' };

/**
 * Los capítulos que ya llegaron en esta visita: moverse entre los versículos de un capítulo no
 * vuelve a pedirlo. Solo vive en memoria, así que nunca supera lo que permite la licencia.
 */
const chapters = new Map<string, Promise<ApiChapterText>>();

function fetchOnce(
  version: ApiVersion,
  usfmBook: string,
  chapter: number,
): Promise<ApiChapterText> {
  const key = `${version.id}:${usfmBook}.${String(chapter)}`;
  let pending = chapters.get(key);
  if (!pending) {
    pending = version.fetchChapter(usfmBook, chapter);
    chapters.set(key, pending);
    // Un pedido fallido no queda: el próximo intento vuelve a preguntar.
    pending.catch(() => {
      chapters.delete(key);
    });
  }
  return pending;
}

/** Olvida los capítulos guardados (los tests lo usan para empezar de cero). */
export function forgetApiChapters(): void {
  chapters.clear();
}

/** Las hojas de estilo que pide la API, una sola vez cada una. */
function addStylesheet(href: string): void {
  if (document.querySelector(`link[rel="stylesheet"][href="${CSS.escape(href)}"]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

function useApiChapter(version: ApiVersion, usfmBook: string, chapter: number): ChapterState {
  const key = `${version.id}:${usfmBook}.${String(chapter)}`;
  const [loaded, setLoaded] = useState<{ readonly key: string; readonly state: ChapterState }>({
    key,
    state: LOADING,
  });
  useEffect(() => {
    let current = true;
    const settle = (state: ChapterState) => {
      if (current) {
        setLoaded({ key, state });
      }
    };
    fetchOnce(version, usfmBook, chapter).then(
      (text) => {
        text.stylesheets.forEach(addStylesheet);
        settle({ status: 'ready', text });
      },
      (error: unknown) => {
        if (!(error instanceof ApiVersionUnavailableError)) {
          console.error(`Error al cargar la ${version.abbreviation}:`, error);
        }
        settle({ status: error instanceof ApiVersionUnavailableError ? 'unavailable' : 'error' });
      },
    );
    return () => {
      current = false;
    };
  }, [key, version, usfmBook, chapter]);

  const state = loaded.key === key ? loaded.state : LOADING;
  const text = state.status === 'ready' ? state.text : null;
  // Una vez que el texto está en pantalla (el reporte FUMS de API.Bible).
  useEffect(() => {
    text?.onShown?.();
  }, [text]);
  return state;
}

/** El contenedor del HTML: los atributos que pide la API, y `class` como `className`. */
function containerProps(attributes: Readonly<Record<string, string>>) {
  const { class: className, ...rest } = attributes;
  return {
    ...rest,
    className: className === undefined ? styles.apiText : `${styles.apiText} ${className}`,
  };
}

/**
 * Un capítulo en una versión que viene de una API, tal como la entrega su proveedor: el texto no
 * se toca, el copyright queda a la vista y no se ofrece nada que lo recorte (regla legal 2).
 */
export function ApiChapterSection({
  version,
  usfmBook,
  bookName,
  chapter,
}: {
  readonly version: ApiVersion;
  /** El código USFM del libro (`JHN`). */
  readonly usfmBook: string;
  readonly bookName: string;
  readonly chapter: number;
}) {
  const state = useApiChapter(version, usfmBook, chapter);
  return (
    <PanelSection
      id="api-text"
      icon={ReadingIcon}
      title={version.abbreviation}
      description={`${bookName} ${String(chapter)}, capítulo completo`}
    >
      {state.status === 'loading' && (
        <p className={styles.muted} role="status">
          Cargando la {version.abbreviation}…
        </p>
      )}
      {state.status === 'unavailable' && (
        <p className={styles.muted} role="status">
          La {version.abbreviation} no está disponible por ahora.
        </p>
      )}
      {state.status === 'error' && (
        <p className={styles.muted} role="status">
          No se pudo cargar la {version.abbreviation}. Inténtalo de nuevo más tarde.
        </p>
      )}
      {state.status === 'ready' && (
        <>
          <div
            {...containerProps(state.text.containerAttributes)}
            data-yv-theme="dark"
            lang="es"
            // El HTML de la API, limpiado de scripts y de atributos de eventos.
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(state.text.html) }}
          />
          <p className={styles.credit}>{state.text.attribution}</p>
          {state.text.link !== null && (
            <p className={styles.credit}>
              <a href={state.text.link} target="_blank" rel="noreferrer">
                Ver en YouVersion
              </a>
            </p>
          )}
        </>
      )}
    </PanelSection>
  );
}
