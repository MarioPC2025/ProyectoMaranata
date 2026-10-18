import type { DatasetProvenance, TranslationTextFile } from '../../../src/core/datasets/formats.ts';
import { BOOK_CODES, importEbibleVerseLines } from './ebible-vpl.ts';

/**
 * Importador de la Reina-Valera 1909 de eBible.org.
 *
 * El VPL de eBible acomoda la numeración propia de la RV1909 en la grilla KJV: en 18 capítulos el
 * texto queda corrido (el último versículo KJV de un capítulo está al comienzo del siguiente) y
 * algunos casilleros juntan dos o más versículos KJV. Acá se dice, para cada versículo KJV
 * afectado, de qué casillero sale su texto y, si ese casillero junta varios, en qué frase empieza
 * cada uno. Se armó comparando versículo por versículo con el texto hebreo y griego de STEP, que
 * está en versificación KJV.
 *
 * El texto no se modifica: solo se reparte (y se pasan a minúsculas las mayúsculas de comienzo de
 * capítulo que quedan en el medio, ver `MINUSCULAS`). Cada marcador tiene que aparecer exactamente
 * una vez en su casillero; si la fuente cambia, el build falla en lugar de cortar mal.
 */

interface Casillero {
  readonly capitulo: number;
  readonly versiculo: number;
}

/** Dónde empieza y dónde termina, dentro del casillero, el texto de un versículo KJV. */
interface Corte {
  readonly inicio: string | null;
  readonly fin: string | null;
}

interface Regla {
  readonly casillero: Casillero;
  readonly corte?: Corte;
}

/** Clave de un versículo, con el código de libro de eBible: `JOB 38:39`. */
function clave(libro: number, capitulo: number, versiculo: number): string {
  const codigo = BOOK_CODES[libro - 1];
  if (codigo === undefined) {
    throw new RangeError(`RV1909: no hay libro ${String(libro)}.`);
  }
  return `${codigo} ${String(capitulo)}:${String(versiculo)}`;
}

const REGLAS = new Map<string, Regla>();

/** KJV `capitulo:v` sale del casillero `casillero:(v + delta)`, para cada `v` de `versiculos`. */
function corrida(
  libro: number,
  capitulo: number,
  versiculos: readonly number[],
  casillero: number,
  delta: number,
): void {
  for (const versiculo of versiculos) {
    REGLAS.set(clave(libro, capitulo, versiculo), {
      casillero: { capitulo: casillero, versiculo: versiculo + delta },
    });
  }
}

const desde = (primero: number, ultimo: number): number[] =>
  Array.from({ length: ultimo - primero + 1 }, (_, i) => primero + i);

/**
 * Un casillero que junta varios versículos KJV: `[capítulo, versículo, frase con la que empieza]`.
 * La primera parte empieza al comienzo del casillero (su frase es `null`).
 */
function cortes(
  libro: number,
  capitulo: number,
  versiculo: number,
  partes: readonly (readonly [number, number, string | null])[],
): void {
  partes.forEach(([parteCapitulo, parteVersiculo, inicio], i) => {
    REGLAS.set(clave(libro, parteCapitulo, parteVersiculo), {
      casillero: { capitulo, versiculo },
      corte: { inicio, fin: partes[i + 1]?.[2] ?? null },
    });
  });
}

// Números 12–13: Nm 12:16 está al comienzo del cap. 13
corrida(4, 12, [16], 13, -15);
corrida(4, 13, desde(1, 31), 13, 1);
cortes(4, 13, 33, [
  [13, 32, null],
  [13, 33, 'También vimos allí gigantes'],
]);
// Números 29–30
corrida(4, 29, [40], 30, -39);
corrida(4, 30, desde(1, 14), 30, 1);
cortes(4, 30, 16, [
  [30, 15, null],
  [30, 16, 'Estas son las ordenanzas'],
]);
// 1 Samuel 23–24
corrida(9, 23, [29], 24, -28);
corrida(9, 24, desde(1, 20), 24, 1);
cortes(9, 24, 22, [
  [24, 21, null],
  [24, 22, 'Entonces David juró á Saúl'],
]);
// 2 Samuel 20
cortes(10, 20, 25, [
  [20, 25, null],
  [20, 26, 'é Ira Jaireo'],
]);
// 2 Crónicas 33: el versículo 10 junta 10 y 11, y desde ahí todo está corrido
cortes(14, 33, 10, [
  [33, 10, null],
  [33, 11, 'por lo cual Jehová trajo'],
]);
corrida(14, 33, desde(12, 25), 33, -1);
// Job 35
cortes(18, 35, 15, [
  [35, 15, null],
  [35, 16, 'por eso Job abrió'],
]);
// Job 38–40: el cap. 39 empieza con Job 38:39; el último casillero del 39 junta 39:27–30 y
// 40:1–5; el cap. 40 empieza con Job 40:6
corrida(18, 38, [39, 40, 41], 39, -38);
corrida(18, 39, desde(1, 26), 39, 3);
cortes(18, 39, 30, [
  [39, 27, null],
  [39, 28, 'Ella habita y está en la piedra'],
  [39, 29, 'Desde allí acecha la comida'],
  [39, 30, 'Sus pollos chupan la sangre'],
  [40, 1, 'A más de eso respondió Jehová'],
  [40, 2, '¿Es sabiduría contender'],
  [40, 3, 'Y respondió Job á Jehová'],
  [40, 4, 'He aquí que yo soy vil'],
  [40, 5, 'Una vez hablé'],
]);
corrida(18, 40, desde(6, 24), 40, -5);
// Oseas 11–12
corrida(28, 11, [12], 12, -11);
corrida(28, 12, desde(1, 12), 12, 1);
cortes(28, 12, 14, [
  [12, 13, null],
  [12, 14, 'Enojado ha Ephraim'],
]);
// Jonás 1–2
corrida(32, 1, [17], 2, -16);
corrida(32, 2, desde(1, 8), 2, 1);
cortes(32, 2, 10, [
  [2, 9, null],
  [2, 10, 'Y mandó Jehová al pez'],
]);
// Hechos 19
cortes(44, 19, 40, [
  [19, 40, null],
  [19, 41, 'Y habiendo dicho esto'],
]);
// 2 Corintios 13
cortes(47, 13, 12, [
  [13, 12, null],
  [13, 13, 'Todos los santos os saludan'],
]);
corrida(47, 13, [14], 13, -1);

/** Las reglas, para que los tests armen un texto que las cubra a todas. */
export const REGLAS_RV1909: ReadonlyMap<string, Regla> = REGLAS;

/**
 * La RV1909 escribe en mayúsculas la primera palabra de cada capítulo. Estos versículos eran el
 * comienzo de un capítulo en la numeración española y en la KJV quedan en el medio: se pasan a
 * minúsculas (a mano, para no tocar nombres propios como "MOISÉS").
 */
export const MINUSCULAS: ReadonlyMap<string, readonly [mayuscula: string, minuscula: string]> =
  new Map([
    [clave(4, 12, 16), ['Y DESPUÉS', 'Y después']],
    [clave(4, 29, 40), ['Y MOISÉS', 'Y Moisés']],
    [clave(9, 23, 29), ['ENTONCES', 'Entonces']],
    [clave(18, 38, 39), ['¿CAZARÁS', '¿Cazarás']],
    [clave(18, 40, 6), ['ENTONCES', 'Entonces']],
    [clave(28, 11, 12), ['CERCÓME', 'Cercóme']],
    [clave(32, 1, 17), ['MAS', 'Mas']],
  ]);

const LINEA = /^(\S+ \d+:\d+) ?(.*)$/;

function tramo(texto: string, { inicio, fin }: Corte, donde: string): string {
  for (const marca of [inicio, fin]) {
    if (marca !== null && texto.split(marca).length !== 2) {
      throw new Error(`RV1909: el marcador "${marca}" no aparece una sola vez en ${donde}.`);
    }
  }
  const primero = inicio === null ? 0 : texto.indexOf(inicio);
  const ultimo = fin === null ? texto.length : texto.indexOf(fin);
  return texto.slice(primero, ultimo).trim();
}

/** Reparte el VPL de eBible en la versificación KJV; devuelve otro VPL con el mismo formato. */
export function realinearRv1909(vpl: string): string {
  const original = new Map<string, string>();
  vpl.split(/\r?\n/).forEach((linea, i) => {
    if (linea.trim() === '') {
      return;
    }
    const partes = LINEA.exec(linea.replace(/^\uFEFF/, ''));
    if (!partes) {
      throw new Error(
        `RV1909 línea ${String(i + 1)}: formato desconocido: "${linea.slice(0, 80)}".`,
      );
    }
    original.set(partes[1] ?? '', partes[2] ?? '');
  });

  const nuevo = new Map(original);
  for (const [versiculo, { casillero, corte }] of REGLAS) {
    const [codigo = ''] = versiculo.split(' ');
    const donde = `${codigo} ${String(casillero.capitulo)}:${String(casillero.versiculo)}`;
    let texto = original.get(donde);
    if (texto === undefined) {
      throw new Error(`RV1909: falta el casillero ${donde}.`);
    }
    if (corte) {
      texto = tramo(texto, corte, donde);
    }
    const minuscula = MINUSCULAS.get(versiculo);
    if (minuscula) {
      const [mayuscula, pasada] = minuscula;
      if (!texto.startsWith(mayuscula)) {
        throw new Error(`RV1909: ${versiculo} no empieza con "${mayuscula}".`);
      }
      texto = pasada + texto.slice(mayuscula.length);
    }
    nuevo.set(versiculo, texto);
  }

  const vacios = [...nuevo]
    .filter(([, texto]) => texto.trim() === '')
    .map(([versiculo]) => versiculo);
  if (vacios.length > 0) {
    throw new Error(
      `RV1909: quedaron ${String(vacios.length)} versículos vacíos después de realinear, ` +
        `por ejemplo ${vacios.slice(0, 5).join(', ')}.`,
    );
  }
  return [...nuevo].map(([versiculo, texto]) => `${versiculo} ${texto}`).join('\n');
}

export function importRv1909(vpl: string, provenance: DatasetProvenance): TranslationTextFile {
  return importEbibleVerseLines(realinearRv1909(vpl), 'rv1909', provenance);
}
