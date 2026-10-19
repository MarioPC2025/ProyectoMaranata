import { afterEach, describe, expect, it } from 'vitest';
import { isNativeApp } from './native-app.ts';

afterEach(() => {
  Reflect.deleteProperty(window, 'Capacitor');
});

describe('isNativeApp', () => {
  it('reconoce la app de Android por el puente que inyecta Capacitor', () => {
    Object.assign(window, { Capacitor: { isNativePlatform: () => true } });
    expect(isNativeApp()).toBe(true);
  });

  it('en un navegador común no hay puente', () => {
    expect(isNativeApp()).toBe(false);
  });

  it('no confunde el Capacitor de la web con la app', () => {
    Object.assign(window, { Capacitor: { isNativePlatform: () => false } });
    expect(isNativeApp()).toBe(false);
  });
});
