import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  decompressIfNeeded,
  forgetWordFiles,
  isPsalmTitle,
  loadBookWords,
  loadNames,
  mainStrong,
  nameCard,
  resetWordByWord,
  splitStrongs,
  versesWithStrong,
  wordByWordLoader,
  wordGloss,
  WORD_MARK,
  type Word,
} from './word-by-word.ts';

/** Comprime como lo hace el script que genera los archivos. */
async function gzip(text: string): Promise<ArrayBuffer> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

const word = (strongs: string, glossEs = '', mark = 0): Word => [
  'λόγος',
  'logos',
  glossEs,
  'word',
  strongs,
  'N-NSM',
  mark,
];

describe('splitStrongs', () => {
  it('separa las partes de una palabra y marca la principal', () => {
    expect(splitStrongs('H9003/{H7225G}')).toEqual({ parts: ['H9003', 'H7225G'], main: 1 });
  });

  it('toma la primera cuando ninguna está marcada', () => {
    expect(splitStrongs('G3056')).toEqual({ parts: ['G3056'], main: 0 });
  });
});

describe('las palabras', () => {
  it('dan el Strong principal para compararlas', () => {
    expect(mainStrong(word('H9003/{H7225G}'))).toBe('H7225G');
    expect(mainStrong(word('G3056'))).toBe('G3056');
    expect(mainStrong(word(''))).toBe('');
  });

  it('muestran la glosa en español y, si falta, la inglesa avisando que lo es', () => {
    expect(wordGloss(word('G3056', 'Palabra'))).toEqual({ text: 'Palabra', inEnglish: false });
    expect(wordGloss(word('G3056'))).toEqual({ text: 'word', inEnglish: true });
  });

  it('reconocen el título de un salmo', () => {
    expect(isPsalmTitle(word('H1', '', WORD_MARK.psalmTitle))).toBe(true);
    expect(isPsalmTitle(word('H1'))).toBe(false);
  });
});

describe('versesWithStrong', () => {
  it('lista los versículos del capítulo (desde 0) donde aparece la palabra', () => {
    const chapter = [[word('G1'), word('G3056')], [word('G2')], [word('G9/{G3056}')], []];
    expect(versesWithStrong(chapter, 'G3056')).toEqual([0, 2]);
    expect(versesWithStrong(chapter, 'G77')).toEqual([]);
  });
});

describe('decompressIfNeeded', () => {
  it('descomprime lo que viene en gzip', async () => {
    const data = await gzip('hola');
    expect(new TextDecoder().decode(await decompressIfNeeded(data))).toBe('hola');
  });

  it('deja como está lo que el navegador ya descomprimió', async () => {
    const plain = new TextEncoder().encode('[1,2]').buffer;
    expect(await decompressIfNeeded(plain)).toBe(plain);
    const empty = new ArrayBuffer(0);
    expect(await decompressIfNeeded(empty)).toBe(empty);
  });
});

describe('la carga de los archivos', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    forgetWordFiles();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)));

  it('pide un libro, y lo pide una sola vez', async () => {
    fetchMock.mockImplementation(() => json([[[]]]));
    await loadBookWords(43);
    await loadBookWords(43);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}data/original/43.json.gz`);
  });

  it('descomprime el libro si llega en gzip', async () => {
    const body = await gzip(JSON.stringify([[[]]]));
    fetchMock.mockImplementation(() => Promise.resolve(new Response(body)));
    expect(await loadBookWords(1)).toEqual([[[]]]);
  });

  it('falla si el servidor no tiene el archivo, y la próxima vez lo vuelve a pedir', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
    await expect(loadBookWords(7)).rejects.toThrow('404');
    fetchMock.mockImplementation(() => json([]));
    await expect(loadBookWords(7)).resolves.toEqual([]);
  });

  it('junta el libro, el léxico de su idioma y las morfologías', async () => {
    fetchMock.mockImplementation((input) => {
      const url = typeof input === 'string' ? input : '';
      return json(url.includes('lexico') ? { L: url } : url.includes('morfologia') ? { M: 1 } : []);
    });
    const hebrew = await wordByWordLoader(1).load();
    expect(hebrew.lexicon).toEqual({ L: expect.stringContaining('lexico/H.json.gz') as string });
    expect(hebrew.morphology).toEqual({ M: 1 });
    const greek = await wordByWordLoader(43).load();
    expect(greek.lexicon).toEqual({ L: expect.stringContaining('lexico/G.json.gz') as string });
  });

  it('trae las fichas de nombres y, si no llegan, sigue sin ellas', async () => {
    const card = ['P', 'Aarón', '', '', 1, [], [], [], [], 334, [2, 4, 14]];
    fetchMock.mockImplementation(() => json({ indice: { H0175: 0 }, fichas: [card] }));
    const names = await loadNames();
    expect(nameCard(names, 'H0175')).toEqual(card);
    expect(nameCard(names, 'H9999')).toBeUndefined();
    forgetWordFiles();
    fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
    expect(await loadNames()).toEqual({ indice: {}, fichas: [] });
  });

  it('guarda el libro cargado, y se puede olvidar para reintentar', () => {
    fetchMock.mockImplementation(() => json({}));
    const first = wordByWordLoader(5);
    expect(wordByWordLoader(5)).toBe(first);
    resetWordByWord(5);
    expect(wordByWordLoader(5)).not.toBe(first);
  });
});
