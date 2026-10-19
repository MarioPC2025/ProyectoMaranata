import { isNativeApp } from '../app/native-app.ts';
import { createCachedLoader, type CachedLoader } from '../shared/lib/cached-loader.ts';

/**
 * El hebreo y el griego palabra por palabra (STEPBible-Data, CC BY 4.0). Los archivos los genera
 * `scripts/construir_original.py` y viven en `public/data/`: un libro por archivo, más el léxico de
 * cada idioma y la lista de morfologías. Se piden recién cuando el lector abre el texto original.
 */

/** `[texto, transliteración, glosa en español, glosa en inglés, Strongs, morfología, marca]` */
export type Word = readonly [
  text: string,
  transliteration: string,
  glossEs: string,
  glossEn: string,
  strongs: string,
  morphology: string,
  mark: number,
];

/** Capítulos → versículos → palabras. */
export type BookWords = readonly (readonly (readonly Word[])[])[];

/** Strong → `[lema, transliteración, categoría, glosa en inglés]` */
export type Lexicon = Readonly<Record<string, readonly [string, string, string, string]>>;

export type Morphology = Readonly<Record<string, string>>;

/**
 * La ficha de una persona, un lugar u otro nombre propio (TIPNR, `scripts/nombres.py`). Los
 * textos van en español si están traducidos (`translated` 1) y, si no, en inglés.
 */
export type NameCard = readonly [
  kind: 'P' | 'L' | 'O',
  name: string,
  brief: string,
  summary: string,
  translated: number,
  parents: readonly number[],
  siblings: readonly number[],
  partners: readonly number[],
  children: readonly number[],
  verses: number,
  first: readonly [book: number, chapter: number, verse: number] | null,
];

/** Las fichas y, para cada Strong de cada forma de un nombre, su ficha. */
export interface Names {
  readonly indice: Readonly<Record<string, number>>;
  readonly fichas: readonly NameCard[];
}

const NO_NAMES: Names = { indice: {}, fichas: [] };

/** La ficha del nombre propio que tiene ese Strong, si la hay. */
export function nameCard(names: Names, strong: string): NameCard | undefined {
  const index = names.indice[strong];
  return index === undefined ? undefined : names.fichas[index];
}

export const WORD_MARK = {
  normal: 0,
  /** Griego: solo en el Textus Receptus (del que se tradujo la RV1909). */
  onlyReceivedText: 1,
  /** Griego: solo en Nestle-Aland. */
  onlyNestleAland: 2,
  /** Parte del título de un salmo. */
  psalmTitle: 3,
} as const;

export interface StrongParts {
  readonly parts: readonly string[];
  /** Posición de la parte principal: la que lleva la morfología y la que se busca en el capítulo. */
  readonly main: number;
}

/** `H9003/{H7225G}` → `{ parts: ['H9003', 'H7225G'], main: 1 }` */
export function splitStrongs(strongs: string): StrongParts {
  const raw = strongs.split('/');
  const main = Math.max(
    0,
    raw.findIndex((part) => part.startsWith('{')),
  );
  return { parts: raw.map((part) => part.replace(/[{}]/g, '')), main };
}

/** El Strong de la parte principal de la palabra, con el que se la compara con otras. */
export function mainStrong(word: Word): string {
  const { parts, main } = splitStrongs(word[4]);
  return parts[main] ?? '';
}

/** La glosa para mostrar: en español si la hay y, si no, en inglés (y se avisa). */
export function wordGloss(word: Word): { readonly text: string; readonly inEnglish: boolean } {
  return word[2] === '' ? { text: word[3], inEnglish: true } : { text: word[2], inEnglish: false };
}

/** Si la palabra es del título de un salmo, que va aparte del versículo. */
export function isPsalmTitle(word: Word): boolean {
  return word[6] === WORD_MARK.psalmTitle;
}

/**
 * Los versículos de un capítulo (por su posición, desde 0) en los que aparece la palabra con ese
 * Strong principal. Es lo que resalta "la misma palabra" a lo largo del capítulo.
 */
export function versesWithStrong(chapter: readonly (readonly Word[])[], strong: string): number[] {
  return chapter.flatMap((words, offset) =>
    words.some((word) => mainStrong(word) === strong) ? [offset] : [],
  );
}

/**
 * Descomprime si hace falta. Algunos servidores mandan el archivo con `Content-Encoding: gzip` y
 * el navegador ya lo descomprimió; por eso se miran los primeros bytes antes.
 */
export async function decompressIfNeeded(data: ArrayBuffer): Promise<ArrayBuffer> {
  const head = new Uint8Array(data, 0, Math.min(2, data.byteLength));
  if (head[0] !== 0x1f || head[1] !== 0x8b) {
    return data;
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

const files = new Map<string, Promise<unknown>>();

/** Un archivo JSON de `public/data/` (comprimido o no), pedido una sola vez. */
function fetchJson<T>(path: string): Promise<T> {
  let pending = files.get(path);
  if (!pending) {
    pending = (async () => {
      // Al armar la app de Android, el empaquetador descomprime los .gz y les quita la extensión.
      const file = isNativeApp() ? path.replace(/\.gz$/, '') : path;
      const url = `${import.meta.env.BASE_URL}data/${file}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`No se pudo cargar ${path} (${String(response.status)})`);
      }
      const buffer = await decompressIfNeeded(await response.arrayBuffer());
      return JSON.parse(new TextDecoder().decode(buffer)) as unknown;
    })();
    files.set(path, pending);
    // Una descarga fallida no queda guardada: el próximo intento vuelve a pedirla.
    pending.catch(() => {
      files.delete(path);
    });
  }
  return pending as Promise<T>;
}

/** Olvida lo descargado (los tests lo usan para empezar de cero). */
export function forgetWordFiles(): void {
  files.clear();
}

/** El hebreo o el griego de un libro; `bookNumber` va de 1 (Génesis) a 66 (Apocalipsis). */
export function loadBookWords(bookNumber: number): Promise<BookWords> {
  return fetchJson<BookWords>(`original/${String(bookNumber)}.json.gz`);
}

/** El léxico breve de un idioma: `H` hebreo y arameo, `G` griego. */
export function loadLexicon(language: 'H' | 'G'): Promise<Lexicon> {
  return fetchJson<Lexicon>(`lexico/${language}.json.gz`);
}

export function loadMorphology(): Promise<Morphology> {
  return fetchJson<Morphology>('morfologia.json');
}

/** Las fichas de nombres propios. Si no llegan, el texto original se muestra igual, sin ellas. */
export function loadNames(): Promise<Names> {
  return fetchJson<Names>('nombres.json.gz').catch(() => NO_NAMES);
}

/** Todo lo que hace falta para mostrar un libro palabra por palabra. */
export interface WordByWordData {
  readonly words: BookWords;
  readonly lexicon: Lexicon;
  readonly morphology: Morphology;
  readonly names: Names;
}

const bookLoaders = new Map<number, CachedLoader<WordByWordData>>();

export function wordByWordLoader(bookNumber: number): CachedLoader<WordByWordData> {
  let loader = bookLoaders.get(bookNumber);
  if (!loader) {
    loader = createCachedLoader(async () => {
      const [words, lexicon, morphology, names] = await Promise.all([
        loadBookWords(bookNumber),
        loadLexicon(bookNumber <= 39 ? 'H' : 'G'),
        loadMorphology(),
        loadNames(),
      ]);
      return { words, lexicon, morphology, names };
    });
    bookLoaders.set(bookNumber, loader);
  }
  return loader;
}

/** Olvida un libro cuya descarga falló, para que el próximo intento la repita. */
export function resetWordByWord(bookNumber: number): void {
  bookLoaders.delete(bookNumber);
}
