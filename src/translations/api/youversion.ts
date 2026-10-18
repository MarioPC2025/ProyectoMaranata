import type { BibleClient } from '@youversion/platform-core';
import { ApiVersionUnavailableError, type ApiChapterText, type ApiVersion } from './types.ts';

/**
 * La NVI-S y la RVES, vía YouVersion Platform. El SDK se carga recién cuando se elige una de estas
 * versiones, para no sumar peso a la carga inicial del sitio.
 */

/** Hoja de estilos del renderer de YouVersion (la misma que devuelve `getPassageDisplay`). */
const BIBLE_STYLES = 'https://cdn.youversion.com/platform/1/bible.css';

let client: Promise<BibleClient> | undefined;

/** La app key de YouVersion, de `.env.local` (`VITE_YVP_APP_KEY`). */
function appKey(): string | undefined {
  const key = import.meta.env.VITE_YVP_APP_KEY;
  return typeof key === 'string' && key !== '' ? key : undefined;
}

function getClient(key: string): Promise<BibleClient> {
  client ??= import('@youversion/platform-core').then(
    ({ ApiClient, BibleClient: Bible }) => new Bible(new ApiClient({ appKey: key })),
  );
  return client;
}

function createVersion(
  id: ApiVersion['id'],
  versionId: number,
  abbreviation: string,
  name: string,
): ApiVersion {
  return {
    id,
    abbreviation,
    name,
    configured: () => appKey() !== undefined,
    async fetchChapter(usfmBook, chapter): Promise<ApiChapterText> {
      const key = appKey();
      if (key === undefined) {
        throw new ApiVersionUnavailableError('Falta la app key de YouVersion');
      }
      const passageId = `${usfmBook}.${String(chapter)}`;
      try {
        const bible = await getClient(key);
        try {
          const display = await bible.getPassageDisplay({ versionId, passageId });
          return {
            html: display.html,
            attribution: display.attribution.text,
            stylesheets: display.stylesheets.map((sheet) => sheet.href),
            containerAttributes: { ...display.containerAttributes },
            link: display.version.youversion_deep_link,
            onShown: null,
          };
        } catch (error) {
          // Algunas versiones (como la RVES, 147) no traen texto de atribución y el SDK no las
          // muestra con `getPassageDisplay`: se usa `getPassage` y se atribuye con el título.
          if ((error as { code?: string }).code !== 'missing_passage_attribution') {
            throw error;
          }
          const { BIBLE_CONTAINER_ATTRIBUTES } = await import('@youversion/platform-core');
          const [passage, version] = await Promise.all([
            bible.getPassage(versionId, passageId, 'html'),
            bible.getVersion(versionId),
          ]);
          return {
            html: passage.content,
            attribution: `${version.title} (${version.abbreviation}), vía YouVersion.`,
            stylesheets: [BIBLE_STYLES],
            containerAttributes: { ...BIBLE_CONTAINER_ATTRIBUTES },
            link: version.youversion_deep_link,
            onShown: null,
          };
        }
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) {
          throw new ApiVersionUnavailableError(String(error));
        }
        throw error;
      }
    },
  };
}

export const nvi = createVersion('nvi', 128, 'NVI', 'Nueva Versión Internacional 2025');
export const rves = createVersion('rves', 147, 'RVES', 'Reina-Valera Antigua');
