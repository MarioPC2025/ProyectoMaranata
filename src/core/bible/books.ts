export type Testament = 'OT' | 'NT';

interface BookDefinition {
  /** OSIS book ID, e.g. `Gen`, `1Cor` (https://crosswire.org/osis/). */
  readonly id: string;
  /** Nombre completo en español, p. ej. `Génesis`. */
  readonly name: string;
  /** Name used when citing a single passage, if it differs from `name` (e.g. `Salmo 23:1`). */
  readonly referenceName?: string;
  readonly testament: Testament;
  /**
   * Otras formas de escribirlo al buscar (abreviaturas en español y en inglés), normalizadas: en
   * minúsculas, sin tildes, espacios ni puntos.
   */
  readonly aliases: readonly string[];
}

/**
 * The 66 books of the Protestant canon, in canonical order.
 *
 * Book IDs follow the OSIS standard, which is also what the OpenBible.info
 * cross-reference dataset uses.
 */
const BOOK_DEFINITIONS = [
  { id: 'Gen', name: 'Génesis', testament: 'OT', aliases: ['ge', 'gn', 'gen'] },
  { id: 'Exod', name: 'Éxodo', testament: 'OT', aliases: ['ex', 'exo'] },
  { id: 'Lev', name: 'Levítico', testament: 'OT', aliases: ['le', 'lv', 'lev'] },
  { id: 'Num', name: 'Números', testament: 'OT', aliases: ['nu', 'nm', 'nb', 'num'] },
  { id: 'Deut', name: 'Deuteronomio', testament: 'OT', aliases: ['de', 'dt', 'deu', 'deut'] },
  { id: 'Josh', name: 'Josué', testament: 'OT', aliases: ['jos', 'jsh'] },
  { id: 'Judg', name: 'Jueces', testament: 'OT', aliases: ['jdg', 'jg', 'jdgs', 'jue', 'jc'] },
  { id: 'Ruth', name: 'Rut', testament: 'OT', aliases: ['ru', 'rth', 'rt'] },
  { id: '1Sam', name: '1 Samuel', testament: 'OT', aliases: ['1sa', '1sm', '1s', '1sam'] },
  { id: '2Sam', name: '2 Samuel', testament: 'OT', aliases: ['2sa', '2sm', '2s', '2sam'] },
  { id: '1Kgs', name: '1 Reyes', testament: 'OT', aliases: ['1ki', '1kg', '1r', '1re', '1rey'] },
  { id: '2Kgs', name: '2 Reyes', testament: 'OT', aliases: ['2ki', '2kg', '2r', '2re', '2rey'] },
  {
    id: '1Chr',
    name: '1 Crónicas',
    testament: 'OT',
    aliases: ['1ch', '1chron', '1cr', '1cro', '1cron'],
  },
  {
    id: '2Chr',
    name: '2 Crónicas',
    testament: 'OT',
    aliases: ['2ch', '2chron', '2cr', '2cro', '2cron'],
  },
  { id: 'Ezra', name: 'Esdras', testament: 'OT', aliases: ['ezr', 'esd'] },
  { id: 'Neh', name: 'Nehemías', testament: 'OT', aliases: ['ne'] },
  { id: 'Esth', name: 'Ester', testament: 'OT', aliases: ['es', 'est'] },
  { id: 'Job', name: 'Job', testament: 'OT', aliases: ['jb'] },
  {
    id: 'Ps',
    name: 'Salmos',
    referenceName: 'Salmo',
    testament: 'OT',
    aliases: ['psa', 'psm', 'pss', 'sal', 'sl'],
  },
  { id: 'Prov', name: 'Proverbios', testament: 'OT', aliases: ['pr', 'pro', 'prv', 'prov'] },
  { id: 'Eccl', name: 'Eclesiastés', testament: 'OT', aliases: ['ec', 'ecc', 'qoh', 'ecl', 'qo'] },
  {
    id: 'Song',
    name: 'Cantares',
    testament: 'OT',
    aliases: [
      'sng',
      'sos',
      'songofsongs',
      'canticles',
      'cnt',
      'cantar',
      'cantardeloscantares',
      'cant',
      'ct',
    ],
  },
  { id: 'Isa', name: 'Isaías', testament: 'OT', aliases: ['is'] },
  { id: 'Jer', name: 'Jeremías', testament: 'OT', aliases: ['je', 'jr'] },
  { id: 'Lam', name: 'Lamentaciones', testament: 'OT', aliases: ['la', 'lm'] },
  { id: 'Ezek', name: 'Ezequiel', testament: 'OT', aliases: ['eze', 'ezk', 'ez'] },
  { id: 'Dan', name: 'Daniel', testament: 'OT', aliases: ['da', 'dn'] },
  { id: 'Hos', name: 'Oseas', testament: 'OT', aliases: ['ho', 'os'] },
  { id: 'Joel', name: 'Joel', testament: 'OT', aliases: ['jl'] },
  { id: 'Amos', name: 'Amós', testament: 'OT', aliases: ['am'] },
  { id: 'Obad', name: 'Abdías', testament: 'OT', aliases: ['ob', 'oba', 'abd'] },
  { id: 'Jonah', name: 'Jonás', testament: 'OT', aliases: ['jon', 'jnh'] },
  { id: 'Mic', name: 'Miqueas', testament: 'OT', aliases: ['mi', 'miq'] },
  { id: 'Nah', name: 'Nahúm', testament: 'OT', aliases: ['na', 'nah'] },
  { id: 'Hab', name: 'Habacuc', testament: 'OT', aliases: ['hb'] },
  { id: 'Zeph', name: 'Sofonías', testament: 'OT', aliases: ['zep', 'zp', 'sof'] },
  { id: 'Hag', name: 'Hageo', testament: 'OT', aliases: ['hg'] },
  { id: 'Zech', name: 'Zacarías', testament: 'OT', aliases: ['zec', 'zc', 'zac'] },
  { id: 'Mal', name: 'Malaquías', testament: 'OT', aliases: ['ml'] },
  { id: 'Matt', name: 'Mateo', testament: 'NT', aliases: ['mt', 'mat'] },
  { id: 'Mark', name: 'Marcos', testament: 'NT', aliases: ['mk', 'mr', 'mrk', 'mc', 'mar'] },
  { id: 'Luke', name: 'Lucas', testament: 'NT', aliases: ['lk', 'luk', 'lc', 'luc'] },
  { id: 'John', name: 'Juan', testament: 'NT', aliases: ['jn', 'jhn', 'joh'] },
  { id: 'Acts', name: 'Hechos', testament: 'NT', aliases: ['ac', 'act', 'hch', 'hech', 'hec'] },
  { id: 'Rom', name: 'Romanos', testament: 'NT', aliases: ['ro', 'rm', 'rom'] },
  { id: '1Cor', name: '1 Corintios', testament: 'NT', aliases: ['1co', '1cor'] },
  { id: '2Cor', name: '2 Corintios', testament: 'NT', aliases: ['2co', '2cor'] },
  { id: 'Gal', name: 'Gálatas', testament: 'NT', aliases: ['ga', 'gal'] },
  { id: 'Eph', name: 'Efesios', testament: 'NT', aliases: ['ephes', 'ef', 'efe'] },
  { id: 'Phil', name: 'Filipenses', testament: 'NT', aliases: ['php', 'pp', 'flp', 'fil'] },
  { id: 'Col', name: 'Colosenses', testament: 'NT', aliases: [] },
  {
    id: '1Thess',
    name: '1 Tesalonicenses',
    testament: 'NT',
    aliases: ['1th', '1thes', '1ts', '1tes'],
  },
  {
    id: '2Thess',
    name: '2 Tesalonicenses',
    testament: 'NT',
    aliases: ['2th', '2thes', '2ts', '2tes'],
  },
  { id: '1Tim', name: '1 Timoteo', testament: 'NT', aliases: ['1ti', '1tm', '1tim'] },
  { id: '2Tim', name: '2 Timoteo', testament: 'NT', aliases: ['2ti', '2tm', '2tim'] },
  { id: 'Titus', name: 'Tito', testament: 'NT', aliases: ['ti', 'tit', 'tt'] },
  {
    id: 'Phlm',
    name: 'Filemón',
    testament: 'NT',
    aliases: ['phm', 'pm', 'philem', 'flm', 'filem'],
  },
  { id: 'Heb', name: 'Hebreos', testament: 'NT', aliases: ['he'] },
  { id: 'Jas', name: 'Santiago', testament: 'NT', aliases: ['jm', 'jam', 'stg', 'sant', 'stgo'] },
  { id: '1Pet', name: '1 Pedro', testament: 'NT', aliases: ['1pe', '1pt', '1p', '1ped'] },
  { id: '2Pet', name: '2 Pedro', testament: 'NT', aliases: ['2pe', '2pt', '2p', '2ped'] },
  { id: '1John', name: '1 Juan', testament: 'NT', aliases: ['1jn', '1jo', '1jhn'] },
  { id: '2John', name: '2 Juan', testament: 'NT', aliases: ['2jn', '2jo', '2jhn'] },
  { id: '3John', name: '3 Juan', testament: 'NT', aliases: ['3jn', '3jo', '3jhn'] },
  { id: 'Jude', name: 'Judas', testament: 'NT', aliases: ['jud', 'jd'] },
  {
    id: 'Rev',
    name: 'Apocalipsis',
    testament: 'NT',
    aliases: ['re', 'rv', 'apocalypse', 'ap', 'apoc', 'apo'],
  },
] as const satisfies readonly BookDefinition[];

export type BookId = (typeof BOOK_DEFINITIONS)[number]['id'];

export interface Book extends BookDefinition {
  readonly id: BookId;
  /** Zero-based position of the book in canonical order. */
  readonly ordinal: number;
}

export const BOOKS: readonly Book[] = BOOK_DEFINITIONS.map((definition, ordinal) => ({
  ...definition,
  ordinal,
}));

const BOOKS_BY_ID: ReadonlyMap<string, Book> = new Map(BOOKS.map((book) => [book.id, book]));

export function isBookId(value: string): value is BookId {
  return BOOKS_BY_ID.has(value);
}

export function getBook(id: BookId): Book {
  const book = BOOKS_BY_ID.get(id);
  if (!book) {
    throw new RangeError(`Unknown book ID: ${id}`);
  }
  return book;
}

/** The name to use when citing a passage from the book, e.g. `Salmo` rather than `Salmos`. */
export function getReferenceName(book: Book): string {
  return book.referenceName ?? book.name;
}
