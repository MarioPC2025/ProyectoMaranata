import { afterEach, describe, expect, it } from 'vitest';
import { availableSteps, hasSeenTour, markTourSeen, placeBubble, tourSteps } from './tour-steps.ts';

afterEach(() => {
  localStorage.clear();
});

describe('tourSteps', () => {
  it('explica los gestos con el dedo en una pantalla táctil y con el mouse en una compu', () => {
    const touch = tourSteps(true).find((step) => step.id === 'gestos');
    const mouse = tourSteps(false).find((step) => step.id === 'gestos');
    expect(touch?.text).toContain('Pellizca');
    expect(mouse?.text).toContain('mouse');
  });

  it('empieza con la bienvenida y termina en el botón para volver a verlo', () => {
    const steps = tourSteps(false);
    expect(steps[0]?.id).toBe('bienvenida');
    expect(steps.at(-1)?.target).toBe('ayuda');
  });
});

describe('availableSteps', () => {
  it('saltea los pasos cuyo destino no está en pantalla, y deja los que no apuntan a nada', () => {
    const steps = availableSteps(tourSteps(true), (target) => target !== 'filtros');
    const ids = steps.map((step) => step.id);
    expect(ids).not.toContain('filtros');
    expect(ids).toContain('bienvenida');
    expect(ids).toContain('panel');
  });
});

describe('placeBubble', () => {
  const viewport = { width: 400, height: 800 };
  const bubble = { width: 300, height: 150 };

  it('centra la burbuja cuando no apunta a nada', () => {
    expect(placeBubble(null, bubble, viewport)).toEqual({ top: 325, left: 50 });
  });

  it('la pone debajo de lo que señala, centrada y sin salirse de la pantalla', () => {
    expect(placeBubble({ top: 10, left: 0, width: 40, height: 30 }, bubble, viewport)).toEqual({
      top: 52,
      left: 12,
    });
  });

  it('la pone arriba si abajo no entra', () => {
    expect(placeBubble({ top: 700, left: 350, width: 40, height: 40 }, bubble, viewport)).toEqual({
      top: 538,
      left: 88,
    });
  });

  it('la pone al pie de la pantalla si lo que señala la ocupa toda', () => {
    expect(placeBubble({ top: 0, left: 0, width: 400, height: 800 }, bubble, viewport)).toEqual({
      top: 638,
      left: 50,
    });
  });

  it('nunca la deja más arriba ni más a la izquierda del margen en una pantalla chica', () => {
    expect(placeBubble(null, bubble, { width: 200, height: 100 })).toEqual({ top: 12, left: 12 });
  });
});

describe('hasSeenTour', () => {
  it('recuerda que el lector ya vio el recorrido', () => {
    expect(hasSeenTour()).toBe(false);
    markTourSeen();
    expect(hasSeenTour()).toBe(true);
  });
});
