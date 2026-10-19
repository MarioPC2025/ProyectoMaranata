import { MAX_PIXEL_RATIO } from './frames.ts';

/** Cuánto le pide el dibujo de los arcos a la placa de video. */
export interface RenderProfile {
  /** Densidad de píxeles máxima del lienzo WebGL. */
  readonly maxPixelRatio: number;
  /** Tramos rectos con que se aproxima cada arco del fondo. */
  readonly lineSegments: number;
  readonly antialias: boolean;
  /** Si los arcos crecen al aparecer (redibuja todos en cada cuadro). */
  readonly intro: boolean;
}

const FULL: RenderProfile = {
  maxPixelRatio: MAX_PIXEL_RATIO,
  lineSegments: 48,
  antialias: true,
  intro: true,
};

/**
 * En teléfonos y tabletas. Con 150.000 arcos el perfil completo puede tardar tanto por cuadro
 * que Android reinicia la placa de video (pasó en un Samsung A54): el lienzo queda en blanco y
 * todo se pone lento. A la densidad de un teléfono la diferencia casi no se ve.
 */
const LIGHT: RenderProfile = {
  maxPixelRatio: 1,
  lineSegments: 16,
  antialias: false,
  intro: false,
};

/** El perfil de este dispositivo: liviano si se usa principalmente con el dedo. */
export function renderProfile(): RenderProfile {
  return window.matchMedia('(pointer: coarse)').matches ? LIGHT : FULL;
}
