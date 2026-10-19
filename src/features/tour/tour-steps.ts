import { readPreference, writePreference } from '../../shared/lib/preferences.ts';

/** One stop of the features tour. */
export interface TourStep {
  readonly id: string;
  /**
   * The `data-tour` mark of what the step points at. A step whose mark is not on screen is skipped
   * (the Android app keeps translation, genres and filters inside "Opciones", the web does not).
   */
  readonly target?: string;
  readonly title: string;
  readonly text: string;
}

/**
 * Every stop, in order. `touch` picks how the gestures are explained: with a finger, or with a
 * mouse.
 */
export function tourSteps(touch: boolean): readonly TourStep[] {
  return [
    {
      id: 'bienvenida',
      title: 'Bienvenido a Maranata',
      text: 'Un recorrido corto por lo que puedes hacer aquí. Toma menos de un minuto.',
    },
    {
      id: 'arcos',
      target: 'arcos',
      title: 'Las referencias cruzadas',
      text: 'Cada arco une dos versículos que se citan o se explican entre sí: más de 340.000 en toda la Biblia. El color dice en qué tipo de libro empieza: ley, historia, poesía, profetas, evangelios, cartas…',
    },
    {
      id: 'gestos',
      target: 'arcos',
      title: 'Cómo moverte',
      text: touch
        ? 'Mantén el dedo sobre el diagrama para ver qué pasaje es y tócalo para abrirlo. Pellizca para acercar y arrastra para moverte.'
        : 'Pasa el mouse para ver qué pasaje es y haz clic para abrirlo. Desplaza la rueda para acercar y arrastra para moverte.',
    },
    {
      id: 'buscar',
      target: 'buscar',
      title: 'Ir a un pasaje',
      text: 'Escribe una referencia, como Juan 3:16 o Sal 23, para ir directo a ella.',
    },
    {
      id: 'vistas',
      target: 'vistas',
      title: 'Arcos e Hilos',
      text: 'Arcos muestra toda la Biblia de una vez. Hilos muestra un capítulo versículo por versículo, con los hilos hacia donde conecta cada uno.',
    },
    {
      id: 'opciones',
      target: 'opciones',
      title: 'Opciones',
      text: 'Aquí eliges la traducción, qué géneros se ven y cuántos enlaces mostrar según los votos de la comunidad.',
    },
    {
      id: 'traduccion',
      target: 'traduccion',
      title: 'Traducción',
      text: 'Elige en qué traducción leer. También puedes sumar otra versión para leer el capítulo en el panel de detalles.',
    },
    {
      id: 'generos',
      target: 'generos',
      title: 'Géneros',
      text: 'Los colores son los géneros de los libros. Toca uno para ocultar o mostrar sus enlaces.',
    },
    {
      id: 'filtros',
      target: 'filtros',
      title: 'Filtros',
      text: 'Muestra más o menos enlaces según los votos de los lectores de OpenBible.info.',
    },
    {
      id: 'panel',
      title: 'Al abrir un pasaje',
      text: 'Se abre un panel con su texto, sus referencias y el hebreo o el griego palabra por palabra, con lo que significa cada una.',
    },
    {
      id: 'ayuda',
      target: 'ayuda',
      title: '¡Listo!',
      text: 'Puedes volver a ver este recorrido cuando quieras desde este botón.',
    },
  ];
}

/** The steps whose mark is on screen, plus those that point at nothing. */
export function availableSteps(
  steps: readonly TourStep[],
  isShown: (target: string) => boolean,
): readonly TourStep[] {
  return steps.filter((step) => step.target === undefined || isShown(step.target));
}

export interface Box {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

/** Space kept between the bubble and what it points at, and the edges of the screen. */
const GAP_PX = 12;

/**
 * Where the bubble goes: below what it points at, or above it if there is no room, or at the
 * bottom of the screen when the target fills it (the arcs). Without a target, in the middle.
 */
export function placeBubble(
  target: Box | null,
  bubble: { readonly width: number; readonly height: number },
  viewport: { readonly width: number; readonly height: number },
): { readonly top: number; readonly left: number } {
  const maxLeft = Math.max(viewport.width - bubble.width - GAP_PX, GAP_PX);
  if (target === null) {
    return {
      top: Math.max((viewport.height - bubble.height) / 2, GAP_PX),
      left: Math.min(Math.max((viewport.width - bubble.width) / 2, GAP_PX), maxLeft),
    };
  }
  const left = Math.min(
    Math.max(target.left + target.width / 2 - bubble.width / 2, GAP_PX),
    maxLeft,
  );
  const below = target.top + target.height + GAP_PX;
  if (below + bubble.height <= viewport.height - GAP_PX) {
    return { top: below, left };
  }
  const above = target.top - GAP_PX - bubble.height;
  if (above >= GAP_PX) {
    return { top: above, left };
  }
  return { top: Math.max(viewport.height - bubble.height - GAP_PX, GAP_PX), left };
}

const SEEN_KEY = 'tour-seen';

/** Whether this reader has already been shown the tour (or closed it). */
export function hasSeenTour(): boolean {
  return readPreference(SEEN_KEY) === 'true';
}

export function markTourSeen(): void {
  writePreference(SEEN_KEY, 'true');
}
