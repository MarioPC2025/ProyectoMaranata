// Los 66 libros con nombres y abreviaturas en español.
// El id (1-66) es el mismo que usa el pipeline de datos (scripts/libros.py).

export type Genero =
  | 'ley'
  | 'historia'
  | 'poesia'
  | 'profetas-mayores'
  | 'profetas-menores'
  | 'evangelios'
  | 'hechos'
  | 'cartas-paulinas'
  | 'cartas-generales'
  | 'apocalipsis'

export interface Libro {
  id: number
  nombre: string
  abreviatura: string
  /** Para la URL: sin tildes ni espacios ("1-corintios") */
  slug: string
  genero: Genero
  /** Otras formas de escribirlo (además del nombre y la abreviatura) */
  variantes: string[]
}

export const NOMBRES_GENERO: Record<Genero, string> = {
  ley: 'Ley',
  historia: 'Historia',
  poesia: 'Poesía y sabiduría',
  'profetas-mayores': 'Profetas mayores',
  'profetas-menores': 'Profetas menores',
  evangelios: 'Evangelios',
  hechos: 'Hechos',
  'cartas-paulinas': 'Cartas de Pablo',
  'cartas-generales': 'Cartas generales',
  apocalipsis: 'Apocalipsis',
}

type Fila = [nombre: string, abreviatura: string, genero: Genero, variantes?: string[]]

const FILAS: Fila[] = [
  ['Génesis', 'Gn', 'ley', ['gen', 'ge']],
  ['Éxodo', 'Éx', 'ley', ['exo', 'ex']],
  ['Levítico', 'Lv', 'ley', ['lev', 'le']],
  ['Números', 'Nm', 'ley', ['num', 'nu']],
  ['Deuteronomio', 'Dt', 'ley', ['deut', 'deu']],
  ['Josué', 'Jos', 'historia'],
  ['Jueces', 'Jue', 'historia', ['jue', 'jc']],
  ['Rut', 'Rt', 'historia', ['ruth']],
  ['1 Samuel', '1 S', 'historia', ['1sam', '1sa']],
  ['2 Samuel', '2 S', 'historia', ['2sam', '2sa']],
  ['1 Reyes', '1 R', 'historia', ['1rey', '1re']],
  ['2 Reyes', '2 R', 'historia', ['2rey', '2re']],
  ['1 Crónicas', '1 Cr', 'historia', ['1cro']],
  ['2 Crónicas', '2 Cr', 'historia', ['2cro']],
  ['Esdras', 'Esd', 'historia'],
  ['Nehemías', 'Neh', 'historia'],
  ['Ester', 'Est', 'historia'],
  ['Job', 'Job', 'poesia'],
  ['Salmos', 'Sal', 'poesia', ['salmo', 'sl', 'ps']],
  ['Proverbios', 'Pr', 'poesia', ['prov', 'pro']],
  ['Eclesiastés', 'Ec', 'poesia', ['ecl', 'qo']],
  ['Cantares', 'Cnt', 'poesia', ['cantar', 'cantardeloscantares', 'cant', 'ct']],
  ['Isaías', 'Is', 'profetas-mayores', ['isa']],
  ['Jeremías', 'Jer', 'profetas-mayores', ['jr']],
  ['Lamentaciones', 'Lm', 'profetas-mayores', ['lam']],
  ['Ezequiel', 'Ez', 'profetas-mayores', ['eze']],
  ['Daniel', 'Dn', 'profetas-mayores', ['dan']],
  ['Oseas', 'Os', 'profetas-menores'],
  ['Joel', 'Jl', 'profetas-menores'],
  ['Amós', 'Am', 'profetas-menores'],
  ['Abdías', 'Abd', 'profetas-menores'],
  ['Jonás', 'Jon', 'profetas-menores'],
  ['Miqueas', 'Mi', 'profetas-menores', ['miq']],
  ['Nahúm', 'Nah', 'profetas-menores'],
  ['Habacuc', 'Hab', 'profetas-menores'],
  ['Sofonías', 'Sof', 'profetas-menores'],
  ['Hageo', 'Hag', 'profetas-menores'],
  ['Zacarías', 'Zac', 'profetas-menores'],
  ['Malaquías', 'Mal', 'profetas-menores'],
  ['Mateo', 'Mt', 'evangelios', ['mat']],
  ['Marcos', 'Mr', 'evangelios', ['mc', 'mar']],
  ['Lucas', 'Lc', 'evangelios', ['luc']],
  ['Juan', 'Jn', 'evangelios'],
  ['Hechos', 'Hch', 'hechos', ['hech', 'hec']],
  ['Romanos', 'Ro', 'cartas-paulinas', ['rom', 'rm']],
  ['1 Corintios', '1 Co', 'cartas-paulinas', ['1cor']],
  ['2 Corintios', '2 Co', 'cartas-paulinas', ['2cor']],
  ['Gálatas', 'Gá', 'cartas-paulinas', ['gal']],
  ['Efesios', 'Ef', 'cartas-paulinas', ['efe']],
  ['Filipenses', 'Fil', 'cartas-paulinas', ['flp']],
  ['Colosenses', 'Col', 'cartas-paulinas'],
  ['1 Tesalonicenses', '1 Ts', 'cartas-paulinas', ['1tes']],
  ['2 Tesalonicenses', '2 Ts', 'cartas-paulinas', ['2tes']],
  ['1 Timoteo', '1 Ti', 'cartas-paulinas', ['1tim', '1tm']],
  ['2 Timoteo', '2 Ti', 'cartas-paulinas', ['2tim', '2tm']],
  ['Tito', 'Tit', 'cartas-paulinas', ['tt']],
  ['Filemón', 'Flm', 'cartas-paulinas', ['filem']],
  ['Hebreos', 'He', 'cartas-generales', ['heb']],
  ['Santiago', 'Stg', 'cartas-generales', ['sant', 'stgo']],
  ['1 Pedro', '1 P', 'cartas-generales', ['1pe', '1ped']],
  ['2 Pedro', '2 P', 'cartas-generales', ['2pe', '2ped']],
  ['1 Juan', '1 Jn', 'cartas-generales'],
  ['2 Juan', '2 Jn', 'cartas-generales'],
  ['3 Juan', '3 Jn', 'cartas-generales'],
  ['Judas', 'Jud', 'cartas-generales'],
  ['Apocalipsis', 'Ap', 'apocalipsis', ['apoc', 'apo', 'rev']],
]

/** Minúsculas y sin tildes. Conserva la ñ. */
export function sinTildes(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/ñ/g, 'ñ')
    .replace(/[̀-ͯ]/g, '')
}

/** Minúsculas, sin tildes y sin espacios ni puntos. Conserva la ñ. */
export function normalizar(texto: string): string {
  return sinTildes(texto).replace(/[\s.]+/g, '')
}

export const LIBROS: Libro[] = FILAS.map(([nombre, abreviatura, genero, variantes = []], i) => ({
  id: i + 1,
  nombre,
  abreviatura,
  slug: normalizar(nombre.replace(' ', '-')),
  genero,
  variantes,
}))

export function libro(id: number): Libro {
  const l = LIBROS[id - 1]
  if (!l) throw new RangeError(`Libro inexistente: ${id}`)
  return l
}

const POR_SLUG = new Map(LIBROS.map((l) => [l.slug, l]))

export function libroPorSlug(slug: string): Libro | undefined {
  return POR_SLUG.get(slug.toLowerCase())
}

// Todas las formas normalizadas de cada libro, para la búsqueda.
const ALIAS = new Map<string, number>()
for (const l of LIBROS) {
  for (const forma of [l.nombre, l.abreviatura, l.slug, ...l.variantes]) {
    ALIAS.set(normalizar(forma).replace(/-/g, ''), l.id)
  }
}

/**
 * Busca un libro por nombre, abreviatura o un prefijo inequívoco del nombre.
 * Recibe el texto ya normalizado (ver normalizar()), con el número delante si lo tiene: "1co", "genesis".
 */
export function buscarLibro(clave: string): Libro | undefined {
  const exacto = ALIAS.get(clave)
  if (exacto) return libro(exacto)
  if (clave.replace(/^\d/, '').length < 2) return undefined
  const candidatos = new Set<number>()
  for (const [alias, id] of ALIAS) {
    if (alias.startsWith(clave)) candidatos.add(id)
  }
  return candidatos.size === 1 ? libro([...candidatos][0]) : undefined
}
