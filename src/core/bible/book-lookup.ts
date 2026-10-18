import { BOOKS, getReferenceName, type Book } from './books.ts';
import { ENGLISH_NAMES } from './english-names.ts';

export type BookLookupResult =
  | { readonly kind: 'found'; readonly book: Book }
  | { readonly kind: 'ambiguous'; readonly candidates: readonly Book[] }
  | { readonly kind: 'unknown' };

/** Los ordinales con que se escribe el número de un libro: "primera de", "1ra", "II". */
const ORDINALS: readonly (readonly [RegExp, string])[] = [
  [/^(primera|primero|primer|1ra|1ro|1a|1o|i)\s+(de\s+)?/, '1'],
  [/^(segunda|segundo|2da|2do|2a|2o|ii)\s+(de\s+)?/, '2'],
  [/^(tercera|tercero|3ra|3ro|3a|3o|iii)\s+(de\s+)?/, '3'],
];

/** Minúsculas y sin tildes ni otras marcas ("Éxodo" → "exodo"). */
export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/**
 * Normalizes a book name for lookup: lowercase, without accents, a leading ordinal ("primera de",
 * "1ra", or a roman numeral) turned into a digit ("II Reyes" → "2reyes"), spaces and dots removed.
 */
export function normalizeBookName(value: string): string {
  let name = stripAccents(value.trim());
  for (const [pattern, digit] of ORDINALS) {
    name = name.replace(pattern, digit);
  }
  return name.replace(/[\s.]+/g, '');
}

function bookNames(book: Book): string[] {
  return [book.name, getReferenceName(book), ...ENGLISH_NAMES[book.id]];
}

function buildExactIndex(): ReadonlyMap<string, Book> {
  const index = new Map<string, Book>();
  for (const book of BOOKS) {
    const keys = [book.id, ...bookNames(book), ...book.aliases].map(normalizeBookName);
    for (const key of keys) {
      const existing = index.get(key);
      if (existing && existing !== book) {
        throw new Error(`Book name "${key}" is ambiguous: ${existing.id} and ${book.id}.`);
      }
      index.set(key, book);
    }
  }
  return index;
}

const EXACT_INDEX = buildExactIndex();

const NORMALIZED_NAMES: readonly { readonly book: Book; readonly names: readonly string[] }[] =
  BOOKS.map((book) => ({ book, names: bookNames(book).map(normalizeBookName) }));

/**
 * Finds a book by name, OSIS ID or common abbreviation (case-insensitive).
 *
 * Exact matches win; otherwise the query is matched as a prefix of the full book names, so
 * "gene" finds Génesis while "jo" is reported as ambiguous.
 */
export function lookupBook(query: string): BookLookupResult {
  const key = normalizeBookName(query);
  if (key === '') {
    return { kind: 'unknown' };
  }

  const exactMatch = EXACT_INDEX.get(key);
  if (exactMatch) {
    return { kind: 'found', book: exactMatch };
  }

  const candidates = NORMALIZED_NAMES.filter(({ names }) =>
    names.some((name) => name.startsWith(key)),
  ).map(({ book }) => book);
  const [onlyCandidate] = candidates;
  if (candidates.length === 1 && onlyCandidate) {
    return { kind: 'found', book: onlyCandidate };
  }
  return candidates.length === 0 ? { kind: 'unknown' } : { kind: 'ambiguous', candidates };
}
