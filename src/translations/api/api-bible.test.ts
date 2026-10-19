import { afterEach, describe, expect, it, vi } from 'vitest';
import { ntv } from './api-bible.ts';
import { ApiVersionUnavailableError } from './types.ts';

function serve(body: unknown, status = 200) {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const CHAPTER = { html: '<p>texto</p>', copyright: '© Tyndale', fumsToken: 'token-1' };

/** El script de FUMS no se descarga en los tests: se mira qué se agregaría a la página. */
function captureScripts() {
  return vi.spyOn(document.body, 'append').mockImplementation(() => undefined);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete window.fums;
  delete window.fumsData;
  document.body.innerHTML = '';
});

describe('la NTV', () => {
  it('pide el capítulo al proxy, que guarda la clave', async () => {
    const fetchMock = serve(CHAPTER);
    const text = await ntv.fetchChapter('JHN', 3);
    expect(fetchMock).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}api/ntv/JHN/3`);
    expect(text).toMatchObject({ html: '<p>texto</p>', attribution: '© Tyndale', link: null });
  });

  it('está siempre configurada: si falta la clave, lo dice el proxy', () => {
    expect(ntv.configured()).toBe(true);
  });

  it('reporta la vista con FUMS cuando el texto está en pantalla', async () => {
    serve(CHAPTER);
    const append = captureScripts();
    const text = await ntv.fetchChapter('JHN', 3);
    expect(window.fums).toBeUndefined();
    text.onShown?.();
    expect(window.fumsData).toEqual([['trackView', 'token-1']]);
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ src: 'https://pkg.api.bible/fumsV3.min.js' }),
    );
  });

  it('carga el script de FUMS una sola vez y sigue reportando', async () => {
    serve(CHAPTER);
    const append = captureScripts();
    const text = await ntv.fetchChapter('JHN', 3);
    text.onShown?.();
    text.onShown?.();
    expect(append).toHaveBeenCalledTimes(1);
    expect(window.fumsData).toHaveLength(2);
  });

  it('no reporta nada si la API no mandó el token', async () => {
    serve({ ...CHAPTER, fumsToken: null });
    const text = await ntv.fetchChapter('JHN', 3);
    text.onShown?.();
    expect(window.fums).toBeUndefined();
  });

  it('avisa que no está disponible cuando el proxy responde 503', async () => {
    serve({ error: 'limite-mensual' }, 503);
    await expect(ntv.fetchChapter('JHN', 3)).rejects.toBeInstanceOf(ApiVersionUnavailableError);
  });

  it('falla con otro error cuando el proxy no pudo traer el capítulo', async () => {
    serve({ error: 'error-api' }, 502);
    await expect(ntv.fetchChapter('JHN', 3)).rejects.toThrow('502');
  });
});
