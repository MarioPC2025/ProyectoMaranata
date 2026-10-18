import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Lo que el SDK de YouVersion devuelve, con lo mínimo que usa el cliente. */
const sdk = vi.hoisted(() => ({
  getPassageDisplay: vi.fn(),
  getPassage: vi.fn(),
  getVersion: vi.fn(),
  appKeys: [] as string[],
}));

vi.mock('@youversion/platform-core', () => ({
  ApiClient: class {
    readonly appKey: string;
    constructor(options: { appKey: string }) {
      this.appKey = options.appKey;
      sdk.appKeys.push(options.appKey);
    }
  },
  BibleClient: class {
    getPassageDisplay = sdk.getPassageDisplay;
    getPassage = sdk.getPassage;
    getVersion = sdk.getVersion;
  },
  BIBLE_CONTAINER_ATTRIBUTES: { 'data-yv-bible-renderer': 'true' },
}));

const DISPLAY = {
  html: '<p>texto</p>',
  attribution: { text: '© Biblica' },
  stylesheets: [{ href: 'https://cdn.example/bible.css' }],
  containerAttributes: { 'data-yv-sdk': 'x' },
  version: { youversion_deep_link: 'https://www.bible.com/bible/128/JHN.3' },
};

/** El módulo de cero, para que el cliente guardado de una prueba no pase a la siguiente. */
async function load() {
  vi.resetModules();
  return import('./youversion.ts');
}

beforeEach(() => {
  sdk.getPassageDisplay.mockReset();
  sdk.getPassage.mockReset();
  sdk.getVersion.mockReset();
  sdk.appKeys.length = 0;
  vi.stubEnv('VITE_YVP_APP_KEY', 'clave-de-prueba');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('la NVI-S y la RVES', () => {
  it('se ofrecen solo con la app key', async () => {
    const { nvi, rves } = await load();
    expect(nvi.configured()).toBe(true);
    vi.stubEnv('VITE_YVP_APP_KEY', '');
    expect(nvi.configured()).toBe(false);
    expect(rves.configured()).toBe(false);
  });

  it('piden el capítulo al SDK y devuelven su atribución y sus estilos', async () => {
    sdk.getPassageDisplay.mockResolvedValue(DISPLAY);
    const { nvi } = await load();
    const text = await nvi.fetchChapter('JHN', 3);
    expect(sdk.getPassageDisplay).toHaveBeenCalledWith({ versionId: 128, passageId: 'JHN.3' });
    expect(sdk.appKeys).toEqual(['clave-de-prueba']);
    expect(text).toEqual({
      html: '<p>texto</p>',
      attribution: '© Biblica',
      stylesheets: ['https://cdn.example/bible.css'],
      containerAttributes: { 'data-yv-sdk': 'x' },
      link: 'https://www.bible.com/bible/128/JHN.3',
      onShown: null,
    });
  });

  it('crea el cliente una sola vez', async () => {
    sdk.getPassageDisplay.mockResolvedValue(DISPLAY);
    const { nvi, rves } = await load();
    await nvi.fetchChapter('JHN', 3);
    await rves.fetchChapter('GEN', 1);
    expect(sdk.appKeys).toHaveLength(1);
  });

  it('atribuye con el título cuando la versión no trae atribución (la RVES)', async () => {
    sdk.getPassageDisplay.mockRejectedValue({ code: 'missing_passage_attribution' });
    sdk.getPassage.mockResolvedValue({ content: '<p>antiguo</p>' });
    sdk.getVersion.mockResolvedValue({
      title: 'Reina-Valera Antigua',
      abbreviation: 'RVA',
      youversion_deep_link: 'https://www.bible.com/bible/147',
    });
    const { rves } = await load();
    const text = await rves.fetchChapter('GEN', 1);
    expect(sdk.getPassage).toHaveBeenCalledWith(147, 'GEN.1', 'html');
    expect(text).toMatchObject({
      html: '<p>antiguo</p>',
      attribution: 'Reina-Valera Antigua (RVA), vía YouVersion.',
      stylesheets: ['https://cdn.youversion.com/platform/1/bible.css'],
      containerAttributes: { 'data-yv-bible-renderer': 'true' },
      link: 'https://www.bible.com/bible/147',
    });
  });

  it('avisa que no está disponible sin app key', async () => {
    vi.stubEnv('VITE_YVP_APP_KEY', '');
    const { nvi } = await load();
    await expect(nvi.fetchChapter('JHN', 3)).rejects.toThrow('app key');
  });

  it.each([401, 403])('avisa que no está disponible si YouVersion responde %i', async (status) => {
    sdk.getPassageDisplay.mockRejectedValue({ status });
    const { nvi } = await load();
    await expect(nvi.fetchChapter('JHN', 3)).rejects.toMatchObject({
      name: 'ApiVersionUnavailableError',
    });
  });

  it('deja pasar cualquier otro error', async () => {
    sdk.getPassageDisplay.mockRejectedValue({ status: 500 });
    const { nvi } = await load();
    await expect(nvi.fetchChapter('JHN', 3)).rejects.toEqual({ status: 500 });
  });
});
