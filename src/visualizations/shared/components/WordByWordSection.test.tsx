import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import { verseIndex } from '../../../test-utils/fixtures.ts';
import type * as WordModule from '../../../words/word-by-word.ts';
import { wordByWordLoader, type Word, type WordByWordData } from '../../../words/word-by-word.ts';
import { ChapterWordsSection, WordByWordSection } from './WordByWordSection.tsx';

vi.mock('../../../words/word-by-word.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof WordModule>()),
  wordByWordLoader: vi.fn(),
}));

const word = (
  text: string,
  strongs: string,
  glossEs = '',
  mark = 0,
  glossEn = 'in English',
): Word => [text, `t-${text}`, glossEs, glossEn, strongs, 'N-NSM', mark];

const REISHIT = word('בְּרֵאשִׁית', 'H9003/{H7225G}', '', 0, 'in beginning');
const BARA = word('בָּרָא', 'H1254A', 'creó');
const ELOHIM = word('אֱלֹהִים', 'H0430G', 'Dios');
const BARA_AGAIN = word('בָּרָא', 'H1254A', 'creó');
const LOGOS = word('λόγος', 'G3056', 'Palabra');
const VARIANT = word('καὶ', 'G2532', 'y', 1);
const NESTLE = word('ὁ', 'G3588', 'el', 2);
const TITLE = word('מִזְמוֹר', 'H4210', 'salmo', 3);

const DATA: WordByWordData = {
  words: [[[REISHIT, BARA, ELOHIM], [BARA_AGAIN], [ELOHIM]]],
  lexicon: {
    H7225G: ['רֵאשִׁית', 're.shit', 'N:N-F', 'beginning'],
    H9003: ['בְּ', 'be', 'P', 'in'],
    H1254A: ['בָּרָא', 'ba.ra', 'V', 'to create'],
  },
  morphology: { 'N-NSM': 'Sustantivo, nominativo masculino singular' },
};

const GEN_1_1 = verseIndex('Gen', 1, 1);

function serve(data: WordByWordData | Error) {
  const load = vi.fn(() => (data instanceof Error ? Promise.reject(data) : Promise.resolve(data)));
  vi.mocked(wordByWordLoader).mockReturnValue({ load, reset: vi.fn() });
  return load;
}

function firstButton(name: RegExp): HTMLElement {
  const [button] = screen.getAllByRole('button', { name });
  if (!button) {
    throw new Error('No hay ninguna palabra así.');
  }
  return button;
}

function renderVerse(verse = GEN_1_1) {
  return render(<WordByWordSection verse={verse} versification={CANONICAL_VERSIFICATION} />);
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.mocked(wordByWordLoader).mockReset();
});

describe('WordByWordSection', () => {
  it('muestra las palabras del versículo con su transliteración y su glosa', async () => {
    serve(DATA);
    renderVerse();
    expect(screen.getByText('Cargando el texto original…')).toBeDefined();
    expect(await screen.findByText('Texto hebreo')).toBeDefined();
    expect(screen.getByText('creó')).toBeDefined();
    expect(screen.getByText('t-בָּרָא')).toBeDefined();
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(3);
  });

  it('dice griego en el Nuevo Testamento', async () => {
    serve({ ...DATA, words: Array.from({ length: 66 }, () => [[LOGOS]]) });
    renderVerse(verseIndex('John', 1, 1));
    expect(await screen.findByText('Texto griego')).toBeDefined();
    expect(vi.mocked(wordByWordLoader)).toHaveBeenCalledWith(43);
  });

  it('abre la ficha de una palabra y la cierra al volver a tocarla', async () => {
    serve(DATA);
    renderVerse();
    await screen.findByText('Texto hebreo');
    await userEvent.click(screen.getByRole('button', { name: /בָּרָא/ }));
    const card = screen.getByRole('article');
    expect(within(card).getByText('ba.ra')).toBeDefined();
    expect(within(card).getByText('H1254A')).toBeDefined();
    expect(within(card).getByText('Sustantivo, nominativo masculino singular')).toBeDefined();
    expect(within(card).getByText('to create')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /בָּרָא/ }));
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('explica las partes de una palabra compuesta y marca la principal', async () => {
    serve(DATA);
    renderVerse();
    await screen.findByText('Texto hebreo');
    await userEvent.click(screen.getByRole('button', { name: /בְּרֵאשִׁית/ }));
    const card = screen.getByRole('article');
    expect(within(card).getByText('Partes de la palabra')).toBeDefined();
    expect(card.querySelector('[data-main="true"]')?.textContent).toContain('רֵאשִׁית');
    expect(within(card).getByText('H7225G')).toBeDefined();
  });

  it('avisa cuando la glosa está en inglés', async () => {
    serve(DATA);
    renderVerse();
    expect(await screen.findByText(/glosas del hebreo están en inglés/)).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /בְּרֵאשִׁית/ }));
    expect(screen.getAllByText('(en inglés)').length).toBeGreaterThan(0);
  });

  it('pone el título de un salmo aparte del versículo', async () => {
    serve({ ...DATA, words: Array.from({ length: 66 }, () => [[TITLE, BARA]]) });
    renderVerse(verseIndex('Ps', 3, 1));
    expect(await screen.findByText('Título del salmo')).toBeDefined();
    expect(screen.getByText('Versículo')).toBeDefined();
  });

  it('dice cuando una palabra está solo en el Textus Receptus o en Nestle-Aland', async () => {
    serve({ ...DATA, words: Array.from({ length: 66 }, () => [[VARIANT, NESTLE]]) });
    renderVerse(verseIndex('John', 1, 1));
    await screen.findByText('Texto griego');
    await userEvent.click(screen.getByRole('button', { name: /καὶ/ }));
    expect(screen.getByText(/Está en el Textus Receptus/)).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /ὁ/ }));
    expect(screen.getByText(/Está en Nestle-Aland/)).toBeDefined();
  });

  it('cambia de palabra elegida sin dejar abiertas las dos fichas', async () => {
    serve(DATA);
    renderVerse();
    await screen.findByText('Texto hebreo');
    await userEvent.click(screen.getByRole('button', { name: /בָּרָא/ }));
    await userEvent.click(screen.getByRole('button', { name: /אֱלֹהִים/ }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('olvida la palabra elegida al pasar a otro versículo', async () => {
    serve(DATA);
    const { rerender } = renderVerse();
    await screen.findByText('Texto hebreo');
    await userEvent.click(screen.getByRole('button', { name: /בָּרָא/ }));
    rerender(<WordByWordSection verse={GEN_1_1 + 1} versification={CANONICAL_VERSIFICATION} />);
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('avisa cuando el versículo no está en el texto original usado', async () => {
    serve({ ...DATA, words: [[[]]] });
    renderVerse();
    expect(await screen.findByText(/no está en el texto hebreo usado/)).toBeDefined();
  });

  it('acredita a STEP Bible', async () => {
    serve(DATA);
    renderVerse();
    const credit = (await screen.findByText(/Tyndale House, Cambridge/)).closest('p');
    expect(within(credit as HTMLElement).getByRole('link', { name: 'STEP Bible' })).toBeDefined();
    expect(within(credit as HTMLElement).getByRole('link', { name: 'CC BY 4.0' })).toBeDefined();
  });

  it('cuenta lo que no pudo cargar', async () => {
    serve(new Error('sin red'));
    renderVerse();
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByText(/sin red/)).toBeDefined();
  });

  it('no pide nada mientras la sección está cerrada', () => {
    localStorage.setItem('bible-cross-references:panel:word-by-word', 'false');
    const load = serve(DATA);
    renderVerse();
    expect(load).not.toHaveBeenCalled();
  });
});

describe('ChapterWordsSection', () => {
  function renderChapter(
    props: Partial<Parameters<typeof ChapterWordsSection>[0]> = {},
    open = true,
  ) {
    localStorage.setItem('bible-cross-references:panel:chapter-words', String(open));
    const onSelect = vi.fn();
    const result = render(
      <ChapterWordsSection
        start={GEN_1_1}
        versification={CANONICAL_VERSIFICATION}
        selection={null}
        onSelect={onSelect}
        {...props}
      />,
    );
    return { ...result, onSelect };
  }

  it('no pide el capítulo hasta que el lector abre la sección', () => {
    const load = serve(DATA);
    renderChapter({}, false);
    expect(load).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /Hebreo del capítulo/ })).toBeDefined();
  });

  it('muestra todos los versículos del capítulo, uno por fila', async () => {
    serve(DATA);
    renderChapter();
    await screen.findAllByText('Dios');
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('creó')).toHaveLength(2);
  });

  it('elige el Strong de la palabra tocada y dice en qué versículos está', async () => {
    serve(DATA);
    const { onSelect } = renderChapter();
    await screen.findAllByText('creó');
    await userEvent.click(firstButton(/בָּרָא/));
    expect(onSelect).toHaveBeenCalledWith({
      strong: 'H1254A',
      verses: [GEN_1_1, GEN_1_1 + 1],
    });
  });

  it('resalta las repeticiones de la palabra elegida y cuenta cuántas son', async () => {
    serve(DATA);
    renderChapter({ selection: { strong: 'H1254A', verses: [GEN_1_1, GEN_1_1 + 1] } });
    await screen.findAllByText('creó');
    const marked = screen
      .getAllByRole('button', { pressed: true })
      .map((button) => button.textContent);
    expect(marked).toHaveLength(2);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('aparece 2 veces en 2 versículos de este capítulo');
  });

  it('usa el singular cuando aparece una sola vez', async () => {
    serve(DATA);
    renderChapter({ selection: { strong: 'H7225G', verses: [GEN_1_1] } });
    await screen.findAllByText('creó');
    expect(screen.getByRole('status').textContent).toContain('aparece 1 vez en 1 versículo');
  });

  it('quita el resaltado al volver a tocar la palabra, con el botón y con Escape', async () => {
    serve(DATA);
    const selection = { strong: 'H1254A', verses: [GEN_1_1, GEN_1_1 + 1] };
    const { onSelect } = renderChapter({ selection });
    await screen.findAllByText('creó');
    await userEvent.click(firstButton(/בָּרָא/));
    expect(onSelect).toHaveBeenLastCalledWith(null);
    await userEvent.click(screen.getByRole('button', { name: 'Quitar resaltado' }));
    expect(onSelect).toHaveBeenCalledTimes(2);
    firstButton(/אֱלֹהִים/).focus();
    await userEvent.keyboard('{Escape}');
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('no hace nada con Escape cuando no hay nada elegido', async () => {
    serve(DATA);
    const { onSelect } = renderChapter();
    await screen.findAllByText('creó');
    firstButton(/בָּרָא/).focus();
    await userEvent.keyboard('{Escape}');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('dice griego en el Nuevo Testamento y cuenta lo que no pudo cargar', async () => {
    serve(new Error('sin red'));
    renderChapter({ start: verseIndex('John', 1, 1) });
    expect(screen.getByRole('heading', { name: /Griego del capítulo/ })).toBeDefined();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });
});
