import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_PIXEL_RATIO } from './frames.ts';
import { renderProfile } from './render-profile.ts';

function pointer(coarse: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: coarse && query === '(pointer: coarse)',
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('renderProfile', () => {
  it('dibuja con todo detalle cuando se usa con mouse', () => {
    pointer(false);
    expect(renderProfile()).toMatchObject({
      maxPixelRatio: MAX_PIXEL_RATIO,
      antialias: true,
      intro: true,
    });
  });

  it('aliviana el dibujo en pantallas táctiles, para que la placa de video no se reinicie', () => {
    pointer(true);
    const profile = renderProfile();
    expect(profile.maxPixelRatio).toBe(1);
    expect(profile.intro).toBe(false);
    expect(profile.lineSegments).toBeLessThan(48);
  });
});
