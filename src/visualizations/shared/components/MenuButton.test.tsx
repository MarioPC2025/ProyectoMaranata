import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FiltersIcon } from '../../../shared/ui/icons.tsx';
import { MenuButton, OptionsMenu } from './MenuButton.tsx';

function renderMenu(props: Partial<Parameters<typeof MenuButton>[0]> = {}) {
  return render(
    <MenuButton label="Filtros" icon={FiltersIcon} {...props}>
      <p>menu contents</p>
    </MenuButton>,
  );
}

describe('MenuButton', () => {
  it('starts closed', () => {
    renderMenu();
    expect(screen.queryByText('menu contents')).toBeNull();
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false');
  });

  it('opens and closes on its own button', async () => {
    renderMenu();
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(screen.getByText('menu contents')).toBeDefined();
    await userEvent.click(button);
    expect(screen.queryByText('menu contents')).toBeNull();
  });

  it('closes when something outside it is used', async () => {
    render(
      <div>
        <MenuButton label="Filtros">
          <p>menu contents</p>
        </MenuButton>
        <button type="button">elsewhere</button>
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    expect(screen.getByText('menu contents')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(screen.queryByText('menu contents')).toBeNull();
  });

  it('stays open while the menu itself is used', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    await userEvent.click(screen.getByText('menu contents'));
    expect(screen.getByText('menu contents')).toBeDefined();
  });

  it('closes on Escape', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button'));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('menu contents')).toBeNull();
  });

  it('ignores keys that are not Escape', async () => {
    renderMenu();
    await userEvent.click(screen.getByRole('button'));
    // Enter and Space would activate the focused button, which is the browser's own doing.
    await userEvent.keyboard('{ArrowDown}x');
    expect(screen.getByText('menu contents')).toBeDefined();
  });

  it('wears its value in place of its name, so the setting is readable at a glance', () => {
    renderMenu({ value: 'KJV' });
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('KJV');
    expect(button.getAttribute('aria-label')).toBe('Filtros: KJV');
  });

  it('is named for itself when it shows no value', () => {
    renderMenu();
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Filtros');
  });

  it('says when its settings differ from the defaults', () => {
    renderMenu({ indicator: true });
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Filtros (cambiado)');
  });

  it('says when the choice is still being applied', () => {
    renderMenu({ value: 'KJV', busy: true });
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true');
  });

  it('is not busy by default', () => {
    renderMenu();
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBeNull();
  });

  it('points at the popover it controls', async () => {
    renderMenu();
    const button = screen.getByRole('button');
    await userEvent.click(button);
    const id = button.getAttribute('aria-controls');
    expect(document.getElementById(id ?? '')?.textContent).toBe('menu contents');
  });

  it('stops listening once it is gone', async () => {
    const { unmount } = renderMenu();
    await userEvent.click(screen.getByRole('button'));
    unmount();
    // No listener should survive to act on this.
    await userEvent.keyboard('{Escape}');
    expect(document.body.textContent).toBe('');
  });
});

describe('OptionsMenu', () => {
  it('junta varios menús en un solo botón, cada uno como una sección', async () => {
    render(
      <OptionsMenu>
        <MenuButton label="Traducción" value="RV1909">
          <p>traducciones</p>
        </MenuButton>
        <MenuButton label="Filtros" icon={FiltersIcon}>
          <p>filtros</p>
        </MenuButton>
      </OptionsMenu>,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    expect(screen.getByRole('region', { name: 'Traducción' }).textContent).toContain(
      'Traducción: RV1909',
    );
    expect(screen.getByRole('region', { name: 'Filtros' }).textContent).toContain('filtros');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('avisa si algo de adentro no está como al principio', () => {
    render(
      <OptionsMenu indicator>
        <p>contenido</p>
      </OptionsMenu>,
    );
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Opciones (cambiado)');
  });

  it('queda marcado para el recorrido', () => {
    const { container } = render(
      <OptionsMenu>
        <p>contenido</p>
      </OptionsMenu>,
    );
    expect(container.querySelector('[data-tour="opciones"]')).not.toBeNull();
  });
});
