import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../../src/core/bible/versification.ts';
import { importRv1909, realinearRv1909 } from './rv1909.ts';
import { casillerosRv1909 as casilleros, vplRv1909 as vpl } from './rv1909-fixture.ts';

const PROVENANCE = {
  url: 'https://example.org/rv.zip',
  sha256: 'abc',
  retrievedAt: '2026-10-18',
  snapshotDate: null,
};

describe('la RV1909 realineada', () => {
  it('reparte los casilleros y no deja ningún versículo vacío', () => {
    const archivo = importRv1909(vpl(casilleros()), PROVENANCE);
    expect(archivo.translationId).toBe('rv1909');
    expect(archivo.verses).toHaveLength(CANONICAL_VERSIFICATION.verseCount);
    expect(archivo.verses.every((texto) => texto !== '')).toBe(true);
  });

  it('pone cada parte de un casillero compartido en su versículo', () => {
    const archivo = importRv1909(vpl(casilleros()), PROVENANCE);
    const texto = (capitulo: number, versiculo: number) =>
      archivo.verses[
        CANONICAL_VERSIFICATION.indexOf({ book: 'Job', chapter: capitulo, verse: versiculo }) ?? -1
      ];
    expect(texto(39, 27)).toBe('Comienzo relleno de JOB 39:27');
    expect(texto(39, 28)).toBe('Ella habita y está en la piedra relleno de JOB 39:28');
    expect(texto(40, 5)).toBe('Una vez hablé relleno de JOB 40:5');
  });

  it('corre los versículos que quedaron al comienzo del capítulo siguiente', () => {
    const lineas = realinearRv1909(vpl(casilleros())).split('\n');
    expect(lineas).toContain('NUM 12:16 Y después resto de NUM 12:16');
  });

  it('pasa a minúsculas solo el comienzo de capítulo que quedó en el medio', () => {
    const realineado = realinearRv1909(vpl(casilleros()));
    expect(realineado).toContain('JOB 40:6 Entonces resto de JOB 40:6');
    expect(realineado).toContain('NUM 29:40 Y Moisés resto de NUM 29:40');
  });

  it('acepta el BOM y los saltos de línea de Windows', () => {
    const archivo = `\uFEFF${vpl(casilleros()).replaceAll('\n', '\r\n')}\r\n\r\n`;
    expect(() => importRv1909(archivo, PROVENANCE)).not.toThrow();
  });
});

describe('cuando la fuente cambia', () => {
  it('rechaza una línea que no es un versículo', () => {
    expect(() => realinearRv1909('esto no es un versículo')).toThrow('formato desconocido');
  });

  it('avisa si falta un casillero', () => {
    const grilla = casilleros();
    grilla.delete('JOB 39:30');
    expect(() => realinearRv1909(vpl(grilla))).toThrow('falta el casillero JOB 39:30');
  });

  it('avisa si un marcador no aparece', () => {
    const grilla = casilleros();
    grilla.set('JOB 39:30', 'sin las frases de corte');
    expect(() => realinearRv1909(vpl(grilla))).toThrow('no aparece una sola vez');
  });

  it('avisa si un marcador aparece dos veces', () => {
    const grilla = casilleros();
    grilla.set('JON 2:10', 'Y mandó Jehová al pez y otra vez Y mandó Jehová al pez');
    expect(() => realinearRv1909(vpl(grilla))).toThrow('no aparece una sola vez');
  });

  it('avisa si el comienzo de capítulo ya no está en mayúsculas', () => {
    const grilla = casilleros();
    grilla.set('NUM 13:1', 'Y después en minúsculas');
    expect(() => realinearRv1909(vpl(grilla))).toThrow('no empieza con "Y DESPUÉS"');
  });

  it('avisa si quedan versículos vacíos', () => {
    const grilla = casilleros();
    grilla.set('GEN 1:1', '');
    expect(() => realinearRv1909(vpl(grilla))).toThrow('1 versículos vacíos');
  });

  it('avisa si falta todo el texto', () => {
    expect(() => realinearRv1909('')).toThrow('falta el casillero');
  });
});
