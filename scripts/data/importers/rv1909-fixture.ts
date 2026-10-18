import { getBook } from '../../../src/core/bible/books.ts';
import { CANONICAL_VERSIFICATION } from '../../../src/core/bible/versification.ts';
import { BOOK_CODES } from './ebible-vpl.ts';
import { MINUSCULAS, REGLAS_RV1909 } from './rv1909.ts';

/** Lo que dice un casillero que junta varios versículos, en la parte que empieza con `inicio`. */
function parte(versiculo: string, inicio: string | null): string {
  return `${inicio ?? 'Comienzo'} relleno de ${versiculo}`;
}

/**
 * Los casilleros de un VPL de la RV1909 que cubren todas las reglas de `rv1909.ts`, con texto de
 * relleno: sirve para probar el importador sin la fuente real.
 */
export function casillerosRv1909(): Map<string, string> {
  const grilla = new Map<string, string>();
  for (let index = 0; index < CANONICAL_VERSIFICATION.verseCount; index += 1) {
    const { book, chapter, verse } = CANONICAL_VERSIFICATION.refAt(index);
    const codigo = BOOK_CODES[getBook(book).ordinal];
    grilla.set(`${codigo ?? ''} ${String(chapter)}:${String(verse)}`, `Versículo ${String(index)}`);
  }
  // Un casillero que junta varios versículos: sus partes, una tras otra.
  const partes = new Map<string, string[]>();
  for (const [versiculo, { casillero, corte }] of REGLAS_RV1909) {
    if (corte) {
      const [codigo = ''] = versiculo.split(' ');
      const donde = `${codigo} ${String(casillero.capitulo)}:${String(casillero.versiculo)}`;
      partes.set(donde, [...(partes.get(donde) ?? []), parte(versiculo, corte.inicio)]);
    }
  }
  for (const [donde, lista] of partes) {
    grilla.set(donde, lista.join(' '));
  }
  // Los que eran comienzo de capítulo, en mayúsculas.
  for (const [versiculo, [mayuscula]] of MINUSCULAS) {
    const regla = REGLAS_RV1909.get(versiculo);
    const [codigo = ''] = versiculo.split(' ');
    const donde = `${codigo} ${String(regla?.casillero.capitulo)}:${String(regla?.casillero.versiculo)}`;
    grilla.set(donde, `${mayuscula} resto de ${versiculo}`);
  }
  return grilla;
}

/** Los casilleros, escritos como las líneas de un VPL de eBible. */
export function vplRv1909(grilla: Map<string, string> = casillerosRv1909()): string {
  return [...grilla].map(([clave, texto]) => `${clave} ${texto}`).join('\n');
}
