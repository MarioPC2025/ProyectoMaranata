import { ntv } from './api-bible.ts';
import type { ApiVersion, ApiVersionId } from './types.ts';
import { nvi, rves } from './youversion.ts';

/** Las versiones que se leen desde una API, en el orden del menú. */
export const API_VERSIONS: readonly ApiVersion[] = [ntv, nvi, rves];

export function isApiVersionId(value: string): value is ApiVersionId {
  return API_VERSIONS.some((version) => version.id === value);
}

export function getApiVersion(id: ApiVersionId): ApiVersion {
  const version = API_VERSIONS.find((candidate) => candidate.id === id);
  if (!version) {
    throw new RangeError(`Versión desconocida: ${id}`);
  }
  return version;
}

/** Versiones sin licencia propia en el sitio: se ofrecen como enlace a otro sitio. */
export interface ExternalVersion {
  readonly abbreviation: string;
  readonly name: string;
  readonly url: (bookName: string, chapter: number) => string;
}

const bibleGateway = (version: string) => (bookName: string, chapter: number) =>
  `https://www.biblegateway.com/passage/?search=${encodeURIComponent(`${bookName} ${String(chapter)}`)}&version=${version}`;

export const EXTERNAL_VERSIONS: readonly ExternalVersion[] = [
  { abbreviation: 'RVR1960', name: 'Reina-Valera 1960', url: bibleGateway('RVR1960') },
  { abbreviation: 'TLA', name: 'Traducción en Lenguaje Actual', url: bibleGateway('TLA') },
];
