import type { TranslationId } from '../core/datasets/ids.ts';
import type { TranslationManifest } from './translation-manifest.ts';

const TRANSLATIONS: Readonly<Record<TranslationId, TranslationManifest>> = {
  rv1909: {
    id: 'rv1909',
    name: 'Reina-Valera 1909',
    abbreviation: 'RV1909',
    language: 'es',
    direction: 'ltr',
    versification: 'kjv',
    license: {
      name: 'Dominio público',
      url: 'https://ebible.org/Scriptures/details.php?id=spaRV1909',
    },
    attribution:
      'Texto bíblico: Reina-Valera 1909, en dominio público. Edición de eBible.org, repartida ' +
      'en la numeración de versículos de la KJV (el texto no se modifica, solo se reparte).',
    homepage: 'https://ebible.org/Scriptures/details.php?id=spaRV1909',
    access: 'bundled',
  },
  bsb: {
    id: 'bsb',
    name: 'Berean Standard Bible',
    abbreviation: 'BSB',
    language: 'en',
    direction: 'ltr',
    versification: 'kjv',
    license: { name: 'Dominio público', url: 'https://berean.bible/terms.htm' },
    attribution: 'Texto bíblico: Berean Standard Bible (BSB), dedicada al dominio público.',
    homepage: 'https://berean.bible/',
    access: 'bundled',
  },
  kjv: {
    id: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'en',
    direction: 'ltr',
    versification: 'kjv',
    license: {
      name: 'Dominio público',
      url: 'https://ebible.org/Scriptures/details.php?id=eng-kjv2006',
    },
    // The United Kingdom is the exception to "public domain", and the app says so wherever the
    // translation is chosen: rights there are a perpetual royal patent, not an expiring copyright.
    attribution:
      'Texto bíblico: King James Version (Authorized Version), el texto de 1769. Dominio público ' +
      'en Estados Unidos y en la mayor parte del mundo; en el Reino Unido los derechos pertenecen ' +
      'a la Corona y los administra su titular de la patente, Cambridge University Press.',
    homepage: 'https://ebible.org/Scriptures/details.php?id=eng-kjv2006',
    access: 'bundled',
  },
};

/** Every translation the app can show, in the order the picker lists them. */
export const TRANSLATION_MANIFESTS: readonly TranslationManifest[] = Object.values(TRANSLATIONS);

/** The translation shown when the user has not picked one. */
export const DEFAULT_TRANSLATION_ID: TranslationId = 'rv1909';

export function getTranslationManifest(id: TranslationId): TranslationManifest {
  return TRANSLATIONS[id];
}
