import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ntv } from './api-bible.ts';
import { API_VERSIONS, EXTERNAL_VERSIONS, getApiVersion, isApiVersionId } from './registry.ts';
import { useApiVersionChoice } from './use-api-version-choice.ts';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('el registro de versiones de API', () => {
  it('lista la NTV, la NVI-S y la RVES, en ese orden', () => {
    expect(API_VERSIONS.map((version) => version.id)).toEqual(['ntv', 'nvi', 'rves']);
  });

  it('reconoce los ids que conoce', () => {
    expect(isApiVersionId('ntv')).toBe(true);
    expect(isApiVersionId('kjv')).toBe(false);
    expect(isApiVersionId('')).toBe(false);
  });

  it('busca una versión por su id', () => {
    expect(getApiVersion('rves').abbreviation).toBe('RVES');
  });

  it('arma el enlace a BibleGateway de las versiones sin licencia propia', () => {
    const [rvr] = EXTERNAL_VERSIONS;
    expect(rvr?.url('1 Corintios', 13)).toBe(
      'https://www.biblegateway.com/passage/?search=1%20Corintios%2013&version=RVR1960',
    );
  });
});

describe('useApiVersionChoice', () => {
  it('no hay ninguna elegida hasta que el lector elige', () => {
    const { result } = renderHook(() => useApiVersionChoice());
    expect(result.current[0]).toBeNull();
  });

  it('recuerda la elegida y se puede quitar', () => {
    const { result } = renderHook(() => useApiVersionChoice());
    act(() => {
      result.current[1]('ntv');
    });
    expect(result.current[0]?.id).toBe('ntv');
    expect(localStorage.getItem('bible-cross-references:api-version')).toBe('ntv');
    act(() => {
      result.current[1](null);
    });
    expect(result.current[0]).toBeNull();
  });

  it('ignora una elección guardada que ya no existe', () => {
    localStorage.setItem('bible-cross-references:api-version', 'otra');
    const { result } = renderHook(() => useApiVersionChoice());
    expect(result.current[0]).toBeNull();
  });

  it('no ofrece una versión que no está configurada', () => {
    vi.spyOn(ntv, 'configured').mockReturnValue(false);
    localStorage.setItem('bible-cross-references:api-version', 'ntv');
    const { result } = renderHook(() => useApiVersionChoice());
    expect(result.current[0]).toBeNull();
  });
});
