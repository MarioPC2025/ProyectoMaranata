// Índice canónico de versículos: cada versículo es un entero de 0 a N-1
// (Gn 1:1 = 0, Ap 22:21 = 31101), en la versificación KJV que usa OpenBible.

export interface DatosIndice {
  versiculos: number
  /** Por libro (id - 1), cantidad de versículos de cada capítulo */
  libros: number[][]
  /** Capítulos [libro, capítulo] cuya RV1909 no coincide versículo a versículo */
  rv1909Desalineados: [number, number][]
}

export interface Posicion {
  libro: number
  capitulo: number
  versiculo: number
}

export class Indice {
  readonly total: number
  readonly conteos: number[][]
  /** Número del primer versículo de cada capítulo, en orden canónico (1189 capítulos) */
  readonly inicioCapitulo: Int32Array
  /** Índice en inicioCapitulo del primer capítulo de cada libro (más un final) */
  readonly primerCapitulo: Int32Array
  private readonly desalineados: Set<string>

  constructor(datos: DatosIndice) {
    this.total = datos.versiculos
    this.conteos = datos.libros
    const capitulos = datos.libros.reduce((s, c) => s + c.length, 0)
    this.inicioCapitulo = new Int32Array(capitulos + 1)
    this.primerCapitulo = new Int32Array(datos.libros.length + 1)
    let n = 0
    let c = 0
    datos.libros.forEach((caps, i) => {
      this.primerCapitulo[i] = c
      for (const cant of caps) {
        this.inicioCapitulo[c++] = n
        n += cant
      }
    })
    this.primerCapitulo[datos.libros.length] = c
    this.inicioCapitulo[c] = n
    if (n !== this.total) throw new Error(`Índice inconsistente: ${n} != ${this.total}`)
    this.desalineados = new Set(datos.rv1909Desalineados.map(([l, c]) => `${l}.${c}`))
  }

  capitulos(libro: number): number {
    return this.conteos[libro - 1]?.length ?? 0
  }

  versiculos(libro: number, capitulo: number): number {
    return this.conteos[libro - 1]?.[capitulo - 1] ?? 0
  }

  existe(libro: number, capitulo = 1, versiculo = 1): boolean {
    return versiculo >= 1 && versiculo <= this.versiculos(libro, capitulo)
  }

  /** Índice global (0-1188) de un capítulo */
  capituloGlobal(libro: number, capitulo: number): number {
    return this.primerCapitulo[libro - 1] + capitulo - 1
  }

  numero(libro: number, capitulo: number, versiculo: number): number {
    if (!this.existe(libro, capitulo, versiculo)) {
      throw new RangeError(`Versículo inexistente: ${libro} ${capitulo}:${versiculo}`)
    }
    return this.inicioCapitulo[this.capituloGlobal(libro, capitulo)] + versiculo - 1
  }

  /** Índice global (0-1188) del capítulo que contiene el versículo `numero` */
  capituloDe(numero: number): number {
    if (numero < 0 || numero >= this.total) throw new RangeError(`Fuera de rango: ${numero}`)
    let lo = 0
    let hi = this.inicioCapitulo.length - 2
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (this.inicioCapitulo[mid] <= numero) lo = mid
      else hi = mid - 1
    }
    return lo
  }

  /** Libro y capítulo de un capítulo global (0-1188) */
  capituloEnLibro(global: number): { libro: number; capitulo: number } {
    let libro = 1
    while (this.primerCapitulo[libro] <= global) libro++
    return { libro, capitulo: global - this.primerCapitulo[libro - 1] + 1 }
  }

  posicion(numero: number): Posicion {
    const lo = this.capituloDe(numero)
    let libro = 1
    while (this.primerCapitulo[libro] <= lo) libro++
    return {
      libro,
      capitulo: lo - this.primerCapitulo[libro - 1] + 1,
      versiculo: numero - this.inicioCapitulo[lo] + 1,
    }
  }

  rv1909Desalineado(libro: number, capitulo: number): boolean {
    return this.desalineados.has(`${libro}.${capitulo}`)
  }
}
