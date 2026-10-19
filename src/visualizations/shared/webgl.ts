import { Color, Vector3, WebGLRenderer } from 'three';
import { GENRE_RGB, VIZ_SURFACE } from './palette.ts';
import type { RenderProfile } from './render-profile.ts';

export function createRenderer(canvas: HTMLCanvasElement, profile: RenderProfile): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: profile.antialias,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.maxPixelRatio));
  renderer.setClearColor(new Color(VIZ_SURFACE), 1);
  return renderer;
}

/** Genre palette as a `vec3[10]` uniform value. */
export function genrePaletteUniform(): Vector3[] {
  return GENRE_RGB.map(([red, green, blue]) => new Vector3(red, green, blue));
}
