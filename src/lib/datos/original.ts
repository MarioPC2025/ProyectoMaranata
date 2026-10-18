// Datos de hebreo y griego (STEPBible-Data). El formato lo genera scripts/construir_original.py.

/** [texto, transliteración, glosa en español, glosa en inglés, Strongs, morfología, marca] */
export type Palabra = [string, string, string, string, string, string, number]

/** Strong → [lema, transliteración, categoría, glosa en inglés] */
export type Lexico = Record<string, [string, string, string, string]>

export const MARCA = {
  normal: 0,
  /** Griego: solo en el Textus Receptus (del que se tradujo la RV1909) */
  soloTR: 1,
  /** Griego: solo en Nestle-Aland */
  soloNA: 2,
  /** Parte del título de un salmo */
  titulo: 3,
} as const

/** Tamaño de los bloques de la concordancia (igual que BLOQUE_CONCORDANCIA en Python) */
const BLOQUE = 500

export interface PartesStrong {
  partes: string[]
  /** Índice de la parte principal (la que lleva la morfología y va a la concordancia) */
  principal: number
}

/** "H9003/{H7225G}" → { partes: ["H9003", "H7225G"], principal: 1 } */
export function partesStrong(strongs: string): PartesStrong {
  const crudas = strongs.split('/')
  const principal = Math.max(
    0,
    crudas.findIndex((p) => p.startsWith('{')),
  )
  return { partes: crudas.map((p) => p.replace(/[{}]/g, '')), principal }
}

export function strongPrincipal(palabra: Palabra): string {
  const { partes, principal } = partesStrong(palabra[4])
  return partes[principal]
}

export function bloqueConcordancia(strong: string): string {
  const numero = Number(/^[HG](\d+)/.exec(strong)?.[1] ?? 0)
  return `${strong[0]}${Math.floor(numero / BLOQUE)}`
}

export function deltasAVersiculos(deltas: number[]): number[] {
  let acumulado = 0
  return deltas.map((d) => (acumulado += d))
}

/** "H" para hebreo/arameo y "G" para griego, según el Strong */
export function idioma(strong: string): 'H' | 'G' {
  return strong.startsWith('G') ? 'G' : 'H'
}

/** Glosa para mostrar: en español si hay, si no en inglés (y se avisa) */
export function glosa(palabra: Palabra): { texto: string; enIngles: boolean } {
  return palabra[2] ? { texto: palabra[2], enIngles: false } : { texto: palabra[3], enIngles: true }
}
