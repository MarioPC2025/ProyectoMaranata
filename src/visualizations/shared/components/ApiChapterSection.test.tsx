import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiVersionUnavailableError,
  type ApiChapterText,
  type ApiVersion,
} from '../../../translations/api/types.ts';
import { ApiChapterSection, forgetApiChapters } from './ApiChapterSection.tsx';

const TEXT: ApiChapterText = {
  html: '<p><span class="v">16</span>Porque de tal manera amó Dios.</p><script>alert(1)</script>',
  attribution: '© Tyndale House Foundation',
  stylesheets: [],
  containerAttributes: {},
  link: null,
  onShown: null,
};

function version(fetchChapter: ApiVersion['fetchChapter']): ApiVersion {
  return {
    id: 'ntv',
    abbreviation: 'NTV',
    name: 'Nueva Traducción Viviente',
    configured: () => true,
    fetchChapter,
  };
}

function section(v: ApiVersion, chapter = 3) {
  return <ApiChapterSection version={v} usfmBook="JHN" bookName="Juan" chapter={chapter} />;
}

beforeEach(() => {
  forgetApiChapters();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  document.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    link.remove();
  });
});

describe('ApiChapterSection', () => {
  it('muestra que está cargando y después el capítulo, con su copyright', async () => {
    const fetchChapter = vi.fn(() => Promise.resolve(TEXT));
    render(section(version(fetchChapter)));
    expect(screen.getByText('Cargando la NTV…')).toBeDefined();
    expect(await screen.findByText(/Porque de tal manera amó Dios/)).toBeDefined();
    expect(fetchChapter).toHaveBeenCalledWith('JHN', 3);
    expect(screen.getByText('© Tyndale House Foundation')).toBeDefined();
    expect(screen.getByRole('heading', { name: /NTV/ })).toBeDefined();
  });

  it('muestra el texto de la API limpio de scripts', async () => {
    const { container } = render(section(version(() => Promise.resolve(TEXT))));
    await screen.findByText(/Porque de tal manera/);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('.v')?.textContent).toBe('16');
  });

  it('pone en el contenedor lo que pide la API, y carga sus hojas de estilo una vez', async () => {
    const text = {
      ...TEXT,
      stylesheets: ['data:text/css,x'],
      containerAttributes: { 'data-yv-sdk': 'x', class: 'yv' },
    };
    const fetchChapter = vi.fn(() => Promise.resolve(text));
    const v = version(fetchChapter);
    const { container, rerender } = render(section(v));
    await screen.findByText(/Porque de tal manera/);
    expect(container.querySelector('[data-yv-sdk="x"]')?.className).toContain('yv');
    rerender(section(v, 4));
    await waitFor(() => {
      expect(fetchChapter).toHaveBeenCalledWith('JHN', 4);
    });
    expect(document.head.querySelectorAll('link[href="data:text/css,x"]')).toHaveLength(1);
  });

  it('ofrece el enlace al pasaje cuando la versión lo trae', async () => {
    const text = { ...TEXT, link: 'https://www.bible.com/bible/128/JHN.3' };
    render(section(version(() => Promise.resolve(text))));
    const link = await screen.findByRole('link', { name: 'Ver en YouVersion' });
    expect(link.getAttribute('href')).toBe('https://www.bible.com/bible/128/JHN.3');
  });

  it('avisa a la API que el texto ya está en pantalla', async () => {
    const onShown = vi.fn();
    render(section(version(() => Promise.resolve({ ...TEXT, onShown }))));
    await screen.findByText(/Porque de tal manera/);
    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it('no vuelve a pedir un capítulo que ya llegó', async () => {
    const fetchChapter = vi.fn(() => Promise.resolve(TEXT));
    const first = render(section(version(fetchChapter)));
    await screen.findByText(/Porque de tal manera/);
    first.unmount();
    render(section(version(fetchChapter)));
    await screen.findByText(/Porque de tal manera/);
    expect(fetchChapter).toHaveBeenCalledTimes(1);
  });

  it('dice que la versión no está disponible', async () => {
    render(section(version(() => Promise.reject(new ApiVersionUnavailableError('sin acceso')))));
    expect(await screen.findByText('La NTV no está disponible por ahora.')).toBeDefined();
  });

  it('dice que no pudo cargarla, y lo intenta de nuevo la próxima vez', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchChapter = vi
      .fn<ApiVersion['fetchChapter']>()
      .mockRejectedValueOnce(new Error('sin red'))
      .mockResolvedValue(TEXT);
    const first = render(section(version(fetchChapter)));
    expect(await screen.findByText(/No se pudo cargar la NTV/)).toBeDefined();
    expect(error).toHaveBeenCalled();
    first.unmount();
    render(section(version(fetchChapter)));
    await screen.findByText(/Porque de tal manera/);
    expect(fetchChapter).toHaveBeenCalledTimes(2);
  });

  it('no pone en pantalla un capítulo que llega cuando ya se pidió otro', async () => {
    let resolveSlow: (text: ApiChapterText) => void = () => undefined;
    const slow = new Promise<ApiChapterText>((resolve) => {
      resolveSlow = resolve;
    });
    const fetchChapter = vi.fn((_book: string, chapter: number) =>
      chapter === 3 ? slow : Promise.resolve({ ...TEXT, html: '<p>capítulo cuatro</p>' }),
    );
    const v = version(fetchChapter);
    const { rerender } = render(section(v, 3));
    rerender(section(v, 4));
    await screen.findByText('capítulo cuatro');
    resolveSlow({ ...TEXT, html: '<p>capítulo tres</p>' });
    await Promise.resolve();
    expect(screen.queryByText('capítulo tres')).toBeNull();
  });
});
