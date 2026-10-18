import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { versePassage, type Passage } from '../../../core/bible/passage.ts';
import { verseIndex } from '../../../test-utils/fixtures.ts';
import { ntv } from '../../../translations/api/api-bible.ts';
import { createVizData } from '../../../test-utils/viz-data.ts';
import { DEFAULT_LINK_FILTER } from '../link-filter.ts';
import { PassagePanel } from './PassagePanel.tsx';

const JOHN_3_16 = verseIndex('John', 3, 16);
const JOHN_3_17 = verseIndex('John', 3, 17);
const ROM_5_8 = verseIndex('Rom', 5, 8);
const GEN_1_1 = verseIndex('Gen', 1, 1);

const DATA = createVizData(
  [
    { from: JOHN_3_16, to: ROM_5_8, votes: 50 },
    { from: GEN_1_1, to: JOHN_3_16, votes: 30 },
  ],
  new Map([
    [JOHN_3_16, 'For God so loved the world…'],
    [ROM_5_8, 'But God proves His love…'],
    [GEN_1_1, 'In the beginning…'],
    [JOHN_3_17, 'For God did not send His Son…'],
  ]),
);

function renderPanel(passage: Passage = versePassage(JOHN_3_16), props = {}) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const result = render(
    <PassagePanel
      data={DATA}
      passage={passage}
      filter={DEFAULT_LINK_FILTER}
      onSelect={onSelect}
      onClose={onClose}
      shareUrl={(target) => `https://example.org/?ref=${target.kind}`}
      {...props}
    />,
  );
  return { ...result, onSelect, onClose };
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('PassagePanel', () => {
  it('offers the chapter on BibleGateway, in the versions that have no licence here', () => {
    renderPanel();
    const link = screen.getByRole('link', { name: 'RVR1960' });
    expect(link.getAttribute('href')).toContain('search=Juan%203&version=RVR1960');
  });

  it('reads the chapter in the version from an API that the reader chose', async () => {
    localStorage.setItem('bible-cross-references:api-version', 'ntv');
    const fetchChapter = vi.spyOn(ntv, 'fetchChapter').mockResolvedValue({
      html: '<p>Texto de la NTV</p>',
      attribution: '© Tyndale',
      stylesheets: [],
      containerAttributes: {},
      link: null,
      onShown: null,
    });
    renderPanel();
    expect(await screen.findByText('Texto de la NTV')).toBeDefined();
    expect(fetchChapter).toHaveBeenCalledWith('JHN', 3);
    expect(screen.getByText('© Tyndale')).toBeDefined();
  });

  it('shows no API text until the reader chooses a version', () => {
    const fetchChapter = vi.spyOn(ntv, 'fetchChapter');
    renderPanel();
    expect(fetchChapter).not.toHaveBeenCalled();
  });
  it('names the passage, its book and its genre', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: 'Juan 3:16' })).toBeDefined();
    expect(screen.getByText(/Evangelios/)).toBeDefined();
  });

  it("shows a verse's text", () => {
    renderPanel();
    expect(screen.getByText('For God so loved the world…')).toBeDefined();
  });

  it('lists where the passage points, and what points at it', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /Referencias/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Referenciado por/ })).toBeDefined();
    expect(screen.getByText(/But God proves His love/)).toBeDefined();
    expect(screen.getByText(/In the beginning/)).toBeDefined();
  });

  it('follows a reference when it is chosen', async () => {
    const { onSelect } = renderPanel();
    await userEvent.click(
      screen.getByText(/But God proves His love/).closest('button') as HTMLElement,
    );
    expect(onSelect).toHaveBeenCalledWith(versePassage(ROM_5_8));
  });

  it('closes', async () => {
    const { onClose } = renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('steps to the next and previous verse', async () => {
    const { onSelect } = renderPanel();
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(onSelect).toHaveBeenCalledWith(versePassage(JOHN_3_17));
    await userEvent.click(screen.getByRole('button', { name: /anterior/i }));
    expect(onSelect).toHaveBeenCalledWith(versePassage(verseIndex('John', 3, 15)));
  });

  it('says so when a passage has no links in a direction', () => {
    renderPanel(versePassage(verseIndex('Rev', 22, 21)));
    expect(screen.getAllByText('Ninguno').length).toBeGreaterThan(0);
  });

  it('shows a chapter as a list of its verses', () => {
    renderPanel({ kind: 'chapter', book: 'John', chapter: 3 });
    expect(screen.getByRole('button', { name: /Versículos/ })).toBeDefined();
    expect(screen.getByText('For God so loved the world…')).toBeDefined();
  });

  it("opens a verse from a chapter's list", async () => {
    const { onSelect } = renderPanel({ kind: 'chapter', book: 'John', chapter: 3 });
    await userEvent.click(
      screen.getByText('For God so loved the world…').closest('button') as HTMLElement,
    );
    expect(onSelect).toHaveBeenCalledWith(versePassage(JOHN_3_16));
  });

  it('shows the genre breakdown of where a passage connects', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /Se conecta con/ })).toBeDefined();
  });

  it('shows actions the host gives it', () => {
    renderPanel(versePassage(JOHN_3_16), {
      actions: <button type="button">Leer en contexto</button>,
    });
    expect(screen.getByRole('button', { name: 'Leer en contexto' })).toBeDefined();
  });

  it('previews a connection when one is pointed at, and stops when it is not', async () => {
    const onPreview = vi.fn();
    renderPanel(versePassage(JOHN_3_16), { onPreview });
    const row = screen.getByText(/But God proves His love/).closest('[class*="quotable"]');
    await userEvent.hover(row as HTMLElement);
    await userEvent.unhover(row as HTMLElement);
    expect(onPreview).toHaveBeenCalledWith(null);
  });

  it('notes a verse the translation leaves out', () => {
    const data = createVizData([], new Map([[verseIndex('Matt', 17, 21), '']]));
    render(
      <PassagePanel
        data={data}
        passage={versePassage(verseIndex('Matt', 17, 21))}
        filter={DEFAULT_LINK_FILTER}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        shareUrl={() => 'https://example.org/'}
      />,
    );
    expect(screen.getByText(/Omitted in the BSB/)).toBeDefined();
  });
});
