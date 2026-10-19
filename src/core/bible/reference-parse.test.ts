import { describe, expect, it } from 'vitest';
import { parseReference } from './reference-parse.ts';
import { KJV_VERSIFICATION } from './versification.ts';

const parse = (input: string) => parseReference(input, KJV_VERSIFICATION);

describe('parseReference', () => {
  it.each([
    ['Juan 3:16', { book: 'John', chapter: 3, verse: 16 }],
    ['jn 3 16', { book: 'John', chapter: 3, verse: 16 }],
    ['juan3:16', { book: 'John', chapter: 3, verse: 16 }],
    ['Jn3.16', { book: 'John', chapter: 3, verse: 16 }],
    ['juan 3,16', { book: 'John', chapter: 3, verse: 16 }],
    ['1 Cor 13:4', { book: '1Cor', chapter: 13, verse: 4 }],
    ['1co13.4', { book: '1Cor', chapter: 13, verse: 4 }],
    ['Primera de Corintios 13', { book: '1Cor', chapter: 13, verse: undefined }],
    ['2da Timoteo 3:16', { book: '2Tim', chapter: 3, verse: 16 }],
    ['  II Reyes 2 : 11 ', { book: '2Kgs', chapter: 2, verse: 11 }],
    ['Gen.1.1', { book: 'Gen', chapter: 1, verse: 1 }],
    ['génesis 1:1', { book: 'Gen', chapter: 1, verse: 1 }],
    ['Éxodo 20', { book: 'Exod', chapter: 20, verse: undefined }],
    ['Cantares 2:1', { book: 'Song', chapter: 2, verse: 1 }],
    ['Sal 23', { book: 'Ps', chapter: 23, verse: undefined }],
    ['Salmo 23', { book: 'Ps', chapter: 23, verse: undefined }],
    ['Apocalipsis 22:21', { book: 'Rev', chapter: 22, verse: 21 }],
    // Los nombres en inglés también llevan al pasaje.
    ['John 3:16', { book: 'John', chapter: 3, verse: 16 }],
    ['Song of Solomon 2:1', { book: 'Song', chapter: 2, verse: 1 }],
    ['  II Kings 2 : 11 ', { book: '2Kgs', chapter: 2, verse: 11 }],
  ])('parses %j', (input, reference) => {
    expect(parse(input)).toEqual({ ok: true, reference });
  });

  it.each([
    ['', 'Escribe una referencia como "Juan 3:16" o "Sal 23".'],
    ['Juan 3:16-18', 'Escribe una referencia como "Juan 3:16" o "Sal 23".'],
    ['Ezequías 1:1', 'No conozco el libro "ezequias".'],
    ['Jo 1:1', '"jo" puede ser Josué, Job, Joel, Jonás o Juan.'],
    ['Génesis 51:1', 'Génesis tiene 50 capítulos.'],
    ['Salmos 23:7', 'Salmo 23 tiene 6 versículos.'],
    ['Juan 3:0', 'Juan 3 tiene 36 versículos.'],
  ])('rejects %j', (input, error) => {
    expect(parse(input)).toEqual({ ok: false, error });
  });
});
