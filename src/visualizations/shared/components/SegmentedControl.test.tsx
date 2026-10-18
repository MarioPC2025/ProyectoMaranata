import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl.tsx';

const OPTIONS = [
  { value: 'both' as const, label: 'Both directions' },
  { value: 'out' as const, label: 'Referencias' },
];

describe('SegmentedControl', () => {
  it('is a named group of the options', () => {
    render(
      <SegmentedControl label="Direction" options={OPTIONS} value="both" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('group', { name: 'Direction' })).toBeDefined();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('marks exactly the chosen one as pressed', () => {
    render(<SegmentedControl label="Direction" options={OPTIONS} value="out" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Referencias' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Both directions' }).getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('reports the option that was chosen', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl label="Direction" options={OPTIONS} value="both" onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Referencias' }));
    expect(onChange).toHaveBeenCalledWith('out');
  });

  it('reports a click on the option already chosen, leaving the choice to the caller', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl label="Direction" options={OPTIONS} value="both" onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Both directions' }));
    expect(onChange).toHaveBeenCalledWith('both');
  });

  it('keeps its name where the label is hidden, and adds a tooltip', () => {
    const Icon = () => <svg data-testid="icon" />;
    render(
      <SegmentedControl
        label="Views"
        options={[{ value: 'arcs' as const, label: 'Arcos', icon: Icon }]}
        value="arcs"
        onChange={vi.fn()}
        iconsOnlyWhenNarrow
      />,
    );
    const button = screen.getByRole('button', { name: 'Arcos' });
    expect(button.getAttribute('title')).toBe('Arcos');
    expect(screen.getByTestId('icon')).toBeDefined();
  });

  it('has no tooltip where the label is always visible', () => {
    render(<SegmentedControl label="D" options={OPTIONS} value="both" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Referencias' }).getAttribute('title')).toBeNull();
  });
});
