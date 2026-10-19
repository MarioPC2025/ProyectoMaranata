import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findTourTarget, Tour } from './Tour.tsx';
import { hasSeenTour } from './tour-steps.ts';

/** happy-dom lays nothing out: these elements get a size, so the tour sees them on screen. */
function giveSize(element: Element, width = 100, height = 40) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    top: 10,
    left: 10,
    width,
    height,
    right: 10 + width,
    bottom: 10 + height,
    x: 10,
    y: 10,
    toJSON: () => ({}),
  });
}

/** A page with some of the marks the tour points at, as the explorer has them. */
function renderPage(marks: readonly string[]) {
  const page = render(
    <div data-view="arcs" data-active="true">
      {marks.map((mark) => (
        <div key={mark} data-tour={mark}>
          {mark}
        </div>
      ))}
    </div>,
  );
  for (const element of page.container.querySelectorAll('[data-tour]')) {
    giveSize(element);
  }
  return page;
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(pointer: coarse)' }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('findTourTarget', () => {
  it('encuentra lo marcado en la vista que se está mostrando', () => {
    renderPage(['buscar']);
    expect(findTourTarget('buscar')?.textContent).toBe('buscar');
  });

  it('ignora lo que no ocupa lugar, como el contenido de un menú cerrado', () => {
    render(
      <div data-view="arcs" data-active="true">
        <div data-tour="filtros" />
      </div>,
    );
    expect(findTourTarget('filtros')).toBeNull();
  });
});

describe('Tour', () => {
  it('no muestra nada cerrado', () => {
    render(<Tour open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('recorre los pasos que están en pantalla y recuerda que se vio', async () => {
    renderPage(['arcos', 'buscar', 'vistas', 'ayuda']);
    const onClose = vi.fn();
    render(<Tour open onClose={onClose} />);
    const dialog = screen.getByRole('dialog', { name: 'Bienvenido a Maranata' });
    expect(dialog.textContent).toContain('1 de 7');
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(screen.getByRole('dialog', { name: 'Las referencias cruzadas' })).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    // Con el dedo: los gestos se explican para una pantalla táctil.
    expect(screen.getByRole('dialog').textContent).toContain('Mantén el dedo');
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByRole('dialog', { name: 'Las referencias cruzadas' })).toBeDefined();
    for (let step = 0; step < 5; step += 1) {
      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    expect(screen.getByRole('dialog', { name: '¡Listo!' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Saltar' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Terminar' }));
    expect(onClose).toHaveBeenCalled();
    expect(hasSeenTour()).toBe(true);
  });

  it('se puede saltar, y también así queda visto', async () => {
    const onClose = vi.fn();
    render(<Tour open onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Saltar' }));
    expect(onClose).toHaveBeenCalled();
    expect(hasSeenTour()).toBe(true);
  });

  it('se maneja con el teclado y no deja salir el foco de la burbuja', () => {
    renderPage(['arcos']);
    const onClose = vi.fn();
    render(<Tour open onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    expect(document.activeElement?.textContent).toBe('Empezar');
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog', { name: 'Las referencias cruzadas' })).toBeDefined();
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    expect(screen.getByRole('dialog', { name: 'Bienvenido a Maranata' })).toBeDefined();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement?.textContent).toBe('Saltar');
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement?.textContent).toBe('Empezar');
    fireEvent.keyDown(dialog, { key: 'a' });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('ilumina lo que señala, o oscurece toda la pantalla si no señala nada', async () => {
    renderPage(['arcos']);
    render(<Tour open onClose={vi.fn()} />);
    const tour = screen.getByRole('dialog').parentElement;
    expect(tour?.children[0]?.getAttribute('style')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(tour?.children[0]?.getAttribute('style')).toContain('width: 108px');
  });

  it('se acomoda si cambia el tamaño de la ventana', () => {
    renderPage(['arcos']);
    render(<Tour open onClose={vi.fn()} />);
    fireEvent(window, new Event('resize'));
    expect(screen.getByRole('dialog').getAttribute('style')).toContain('top');
  });
});
