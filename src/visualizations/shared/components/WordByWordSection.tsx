import '@fontsource/noto-serif-hebrew/hebrew-400.css';
import '@fontsource/noto-serif/greek-400.css';
import '@fontsource/noto-serif/greek-ext-400.css';
import { useEffect, useState } from 'react';
import { getBook } from '../../../core/bible/books.ts';
import type { VerseIndex } from '../../../core/bible/verse-ref.ts';
import type { Versification } from '../../../core/bible/versification.ts';
import { formatInteger } from '../../../shared/lib/format.ts';
import { useBooleanPreference } from '../../../shared/lib/preferences.ts';
import { WordsIcon } from '../../../shared/ui/icons.tsx';
import {
  isPsalmTitle,
  mainStrong,
  resetWordByWord,
  splitStrongs,
  versesWithStrong,
  wordByWordLoader,
  wordGloss,
  WORD_MARK,
  type Word,
  type WordByWordData,
} from '../../../words/word-by-word.ts';
import { PanelSection } from './PanelSection.tsx';
import styles from './PassagePanel.module.css';

type Load =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly data: WordByWordData };

const LOADING: Load = { status: 'loading' };

/**
 * El hebreo o el griego de un libro, con su léxico y sus morfologías. No se pide hasta que haga
 * falta (`enabled`): quien nunca abre el texto original no paga su descarga.
 */
function useWordByWord(bookNumber: number, enabled: boolean): Load {
  const [loaded, setLoaded] = useState<{ readonly book: number; readonly load: Load }>({
    book: bookNumber,
    load: LOADING,
  });
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let current = true;
    wordByWordLoader(bookNumber)
      .load()
      .then(
        (data) => {
          if (current) {
            setLoaded({ book: bookNumber, load: { status: 'ready', data } });
          }
        },
        (error: unknown) => {
          // Una descarga fallida no queda: abrir otro versículo vuelve a pedirla.
          resetWordByWord(bookNumber);
          if (current) {
            const message = error instanceof Error ? error.message : String(error);
            setLoaded({ book: bookNumber, load: { status: 'error', message } });
          }
        },
      );
    return () => {
      current = false;
    };
  }, [bookNumber, enabled]);
  return loaded.book === bookNumber ? loaded.load : LOADING;
}

/** Si una sección del panel está abierta: la misma preferencia que usa `PanelSection`. */
function useSectionOpen(id: string, defaultOpen: boolean): boolean {
  return useBooleanPreference(`panel:${id}`, defaultOpen)[0];
}

const language = (hebrew: boolean) => (hebrew ? 'he' : 'grc');

/** Las palabras de un grupo, cada una como botón con su transliteración y su glosa. */
function WordChips({
  words,
  hebrew,
  selected,
  matchStrong,
  onSelect,
}: {
  readonly words: readonly Word[];
  readonly hebrew: boolean;
  /** La palabra elegida, para abrir su ficha. */
  readonly selected: Word | null;
  /** El Strong cuyas repeticiones se resaltan. */
  readonly matchStrong: string | null;
  readonly onSelect: (word: Word) => void;
}) {
  return (
    <ol className={styles.wordChips} dir={hebrew ? 'rtl' : 'ltr'}>
      {words.map((word, index) => {
        const gloss = wordGloss(word);
        const match = matchStrong !== null && mainStrong(word) === matchStrong;
        const variant =
          word[6] === WORD_MARK.onlyReceivedText || word[6] === WORD_MARK.onlyNestleAland;
        return (
          <li key={index}>
            <button
              type="button"
              className={styles.wordChip}
              data-variant={variant}
              data-match={match}
              aria-pressed={selected === word || match}
              onClick={() => {
                onSelect(word);
              }}
            >
              <span className={styles.wordOriginal} lang={language(hebrew)}>
                {word[0]}
              </span>
              <span className={styles.wordTranslit} dir="ltr">
                {word[1]}
              </span>
              <span className={styles.wordGloss} dir="ltr" data-english={gloss.inEnglish}>
                {gloss.text}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** La ficha de una palabra: su lema, su morfología, su glosa y las partes que la forman. */
function WordCard({
  word,
  data,
  hebrew,
}: {
  readonly word: Word;
  readonly data: WordByWordData;
  readonly hebrew: boolean;
}) {
  const { parts, main } = splitStrongs(word[4]);
  const strong = parts[main] ?? '';
  const entry = data.lexicon[strong];
  const gloss = wordGloss(word);
  return (
    <article className={styles.wordCard} aria-live="polite">
      <header className={styles.wordCardHead}>
        <span className={styles.wordCardLemma} lang={language(hebrew)} dir={hebrew ? 'rtl' : 'ltr'}>
          {entry?.[0] ?? word[0]}
        </span>
        {entry && <span className={styles.wordTranslit}>{entry[1]}</span>}
        <span className={styles.wordCardStrong}>{strong}</span>
      </header>
      <dl className={styles.wordCardList}>
        <dt>En este versículo</dt>
        <dd>
          <span lang={language(hebrew)}>{word[0]}</span> · {gloss.text}
          {gloss.inEnglish && <span className={styles.muted}> (en inglés)</span>}
        </dd>
        <dt>Morfología</dt>
        <dd>{data.morphology[word[5]] ?? word[5]}</dd>
        {entry && (
          <>
            <dt>Significado breve</dt>
            <dd>
              {entry[3]} <span className={styles.muted}>(en inglés)</span>
            </dd>
          </>
        )}
        {parts.length > 1 && (
          <>
            <dt>Partes de la palabra</dt>
            <dd>
              {parts.map((part, index) => (
                <span key={index} data-main={index === main}>
                  {index > 0 && <span aria-hidden="true"> + </span>}
                  {(data.lexicon[part]?.[0] ?? part).replace(/^\/|\/$/g, '')} (
                  {data.lexicon[part]?.[3] ?? part})
                </span>
              ))}
            </dd>
          </>
        )}
        {word[6] === WORD_MARK.onlyReceivedText && (
          <>
            <dt>Texto</dt>
            <dd>Está en el Textus Receptus (base de la RV1909) pero no en Nestle-Aland.</dd>
          </>
        )}
        {word[6] === WORD_MARK.onlyNestleAland && (
          <>
            <dt>Texto</dt>
            <dd>Está en Nestle-Aland pero no en el Textus Receptus (base de la RV1909).</dd>
          </>
        )}
      </dl>
    </article>
  );
}

/** El crédito de los datos: es una condición de la licencia, así que no se esconde. */
function WordsCredit({ hebrew }: { readonly hebrew: boolean }) {
  return (
    <p className={styles.credit}>
      Texto {hebrew ? 'hebreo' : 'griego'} y datos:{' '}
      <a href="https://www.stepbible.org" target="_blank" rel="noreferrer">
        STEP Bible
      </a>{' '}
      (Tyndale House, Cambridge),{' '}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
        CC BY 4.0
      </a>
      .
    </p>
  );
}

function Status({ load }: { readonly load: Load }) {
  if (load.status === 'error') {
    return (
      <p className={styles.muted} role="alert">
        No se pudo cargar el texto original: {load.message}
      </p>
    );
  }
  return (
    <p className={styles.muted} role="status">
      Cargando el texto original…
    </p>
  );
}

/**
 * El hebreo o el griego de un versículo, palabra por palabra. Al tocar una palabra se abre su
 * ficha; "Misma palabra", más abajo, dice en qué otros versículos aparece.
 */
export function WordByWordSection({
  verse,
  versification,
}: {
  readonly verse: VerseIndex;
  readonly versification: Versification;
}) {
  const ref = versification.refAt(verse);
  const book = getBook(ref.book);
  const hebrew = book.testament === 'OT';
  const open = useSectionOpen('word-by-word', true);
  const load = useWordByWord(book.ordinal + 1, open);
  // La palabra elegida pertenece al versículo en que se eligió.
  const [choice, setChoice] = useState<{ readonly verse: VerseIndex; readonly word: Word } | null>(
    null,
  );
  const selected = choice?.verse === verse ? choice.word : null;
  const words =
    load.status === 'ready' ? (load.data.words[ref.chapter - 1]?.[ref.verse - 1] ?? []) : [];
  const title = words.filter(isPsalmTitle);
  const body = words.filter((word) => !isPsalmTitle(word));
  const toggle = (word: Word) => {
    setChoice(selected === word ? null : { verse, word });
  };
  return (
    <>
      <PanelSection
        id="word-by-word"
        icon={WordsIcon}
        title={hebrew ? 'Texto hebreo' : 'Texto griego'}
        description="palabra por palabra"
        {...(load.status === 'ready' && words.length > 0 ? { count: words.length } : {})}
        countLabel="palabras"
      >
        {load.status !== 'ready' && <Status load={load} />}
        {load.status === 'ready' && words.length === 0 && (
          <p className={styles.muted}>
            Este versículo no está en el texto {hebrew ? 'hebreo' : 'griego'} usado (aparece en el
            Textus Receptus o en otra tradición).
          </p>
        )}
        {load.status === 'ready' && words.length > 0 && (
          <>
            {title.length > 0 && (
              <>
                <p className={styles.wordLabel}>Título del salmo</p>
                <WordChips
                  words={title}
                  hebrew={hebrew}
                  selected={selected}
                  matchStrong={null}
                  onSelect={toggle}
                />
                <p className={styles.wordLabel}>Versículo</p>
              </>
            )}
            <WordChips
              words={body}
              hebrew={hebrew}
              selected={selected}
              matchStrong={null}
              onSelect={toggle}
            />
            {body.some((word) => wordGloss(word).inEnglish) && (
              <p className={styles.muted}>
                Por ahora las glosas del hebreo están en inglés: la traducción al español está en
                curso.
              </p>
            )}
            {selected && <WordCard word={selected} data={load.data} hebrew={hebrew} />}
          </>
        )}
      </PanelSection>
      {load.status === 'ready' && words.length > 0 && <WordsCredit hebrew={hebrew} />}
    </>
  );
}

/** Lo que el panel recuerda de la palabra elegida en un capítulo. */
export interface ChapterWordSelection {
  /** El Strong principal de la palabra. */
  readonly strong: string;
  /** Los versículos (índices canónicos) del capítulo en que aparece. */
  readonly verses: readonly VerseIndex[];
}

/**
 * El hebreo o el griego de todo un capítulo. Al tocar una palabra se resaltan, en todo el
 * capítulo, las que comparten su Strong, y el panel marca los versículos que la contienen.
 */
export function ChapterWordsSection({
  start,
  versification,
  selection,
  onSelect,
}: {
  /** El primer versículo del capítulo. */
  readonly start: VerseIndex;
  readonly versification: Versification;
  readonly selection: ChapterWordSelection | null;
  readonly onSelect: (selection: ChapterWordSelection | null) => void;
}) {
  const ref = versification.refAt(start);
  const book = getBook(ref.book);
  const hebrew = book.testament === 'OT';
  const open = useSectionOpen('chapter-words', false);
  const load = useWordByWord(book.ordinal + 1, open);
  const chapter = load.status === 'ready' ? (load.data.words[ref.chapter - 1] ?? []) : [];
  const entry =
    load.status === 'ready' && selection ? load.data.lexicon[selection.strong] : undefined;
  const occurrences = selection
    ? chapter.reduce(
        (total, words) =>
          total + words.filter((word) => mainStrong(word) === selection.strong).length,
        0,
      )
    : 0;
  const pick = (word: Word) => {
    const strong = mainStrong(word);
    onSelect(
      selection?.strong === strong
        ? null
        : { strong, verses: versesWithStrong(chapter, strong).map((offset) => start + offset) },
    );
  };
  return (
    <>
      <PanelSection
        id="chapter-words"
        icon={WordsIcon}
        title={hebrew ? 'Hebreo del capítulo' : 'Griego del capítulo'}
        description="toca para resaltar"
        defaultOpen={false}
      >
        {load.status !== 'ready' && <Status load={load} />}
        {load.status === 'ready' && (
          <div
            onKeyDown={(event) => {
              if (event.key === 'Escape' && selection) {
                event.stopPropagation();
                onSelect(null);
              }
            }}
          >
            {selection && (
              <p className={styles.wordMatches} role="status">
                <span lang={language(hebrew)}>{entry?.[0] ?? selection.strong}</span> aparece{' '}
                {formatInteger(occurrences)} {occurrences === 1 ? 'vez' : 'veces'} en{' '}
                {formatInteger(selection.verses.length)}{' '}
                {selection.verses.length === 1 ? 'versículo' : 'versículos'} de este capítulo.{' '}
                <button
                  type="button"
                  className={styles.more}
                  onClick={() => {
                    onSelect(null);
                  }}
                >
                  Quitar resaltado
                </button>
              </p>
            )}
            <ol className={styles.chapterWords}>
              {chapter.map((words, offset) => (
                <li key={offset} className={styles.chapterWordVerse}>
                  <span className={styles.verseNumber}>{offset + 1}</span>
                  <WordChips
                    words={words.filter((word) => !isPsalmTitle(word))}
                    hebrew={hebrew}
                    selected={null}
                    matchStrong={selection?.strong ?? null}
                    onSelect={pick}
                  />
                </li>
              ))}
            </ol>
          </div>
        )}
      </PanelSection>
      {load.status === 'ready' && <WordsCredit hebrew={hebrew} />}
    </>
  );
}
