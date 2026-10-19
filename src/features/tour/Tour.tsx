import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import controls from '../../visualizations/shared/components/controls.module.css';
import { availableSteps, markTourSeen, placeBubble, tourSteps, type Box } from './tour-steps.ts';
import styles from './Tour.module.css';

/** Room left around what a step points at, inside the spotlight. */
const SPOTLIGHT_PADDING_PX = 4;

/**
 * What a `data-tour` mark points at on screen: in the view that is shown (both views stay
 * mounted, see `Explorer`), and only if it takes up room (a closed menu's contents do not).
 */
export function findTourTarget(id: string): HTMLElement | null {
  const scope = document.querySelector('[data-view][data-active="true"]') ?? document;
  for (const element of scope.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)) {
    const { width, height } = element.getBoundingClientRect();
    if (width > 0 && height > 0) {
      return element;
    }
  }
  return null;
}

interface TourProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/**
 * The features tour: a bubble at a time over the real parts of the page (search, arcs, menus),
 * with the rest dimmed. Closing it, or reaching the end, remembers that it was seen, so it only
 * opens by itself the first time.
 */
export function Tour({ open, onClose }: TourProps) {
  return open ? createPortal(<TourDialog onClose={onClose} />, document.body) : null;
}

function TourDialog({ onClose }: { readonly onClose: () => void }) {
  const [steps] = useState(() =>
    availableSteps(
      tourSteps(window.matchMedia('(pointer: coarse)').matches),
      (target) => findTourTarget(target) !== null,
    ),
  );
  const [index, setIndex] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;
  const [spotlight, setSpotlight] = useState<Box | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const textId = useId();

  const close = () => {
    markTourSeen();
    onClose();
  };
  const next = () => {
    if (isLast) {
      close();
    } else {
      setIndex(index + 1);
    }
  };
  const previous = () => {
    setIndex(Math.max(index - 1, 0));
  };

  // Before paint, so the bubble never shows where the previous step had it.
  useLayoutEffect(() => {
    const place = () => {
      const target = step?.target === undefined ? null : findTourTarget(step.target);
      const rect = target?.getBoundingClientRect();
      const box = rect
        ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        : null;
      setSpotlight(box);
      const bubble = bubbleRef.current;
      if (bubble) {
        setPosition(
          placeBubble(
            box,
            { width: bubble.offsetWidth, height: bubble.offsetHeight },
            { width: window.innerWidth, height: window.innerHeight },
          ),
        );
      }
    };
    place();
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('resize', place);
    };
  }, [step]);

  useEffect(() => {
    primaryRef.current?.focus();
  }, [index]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'ArrowRight') {
      next();
    } else if (event.key === 'ArrowLeft') {
      previous();
    } else if (event.key === 'Tab') {
      // Keeps the keyboard inside the bubble: the page behind it is not part of the tour.
      const buttons = [...(bubbleRef.current?.querySelectorAll('button') ?? [])];
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const target = buttons.at((current + (event.shiftKey ? -1 : 1)) % buttons.length);
      target?.focus();
      event.preventDefault();
    } else {
      return;
    }
    event.stopPropagation();
  };

  if (!step) {
    return null;
  }
  return (
    <div className={styles.tour} onKeyDown={onKeyDown}>
      {spotlight ? (
        <div
          className={styles.spotlight}
          style={{
            top: spotlight.top - SPOTLIGHT_PADDING_PX,
            left: spotlight.left - SPOTLIGHT_PADDING_PX,
            width: spotlight.width + SPOTLIGHT_PADDING_PX * 2,
            height: spotlight.height + SPOTLIGHT_PADDING_PX * 2,
          }}
        />
      ) : (
        <div className={styles.backdrop} />
      )}
      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        className={styles.bubble}
        style={position ?? { visibility: 'hidden' }}
      >
        <p className={styles.count}>
          {index + 1} de {steps.length}
        </p>
        <h2 id={titleId} className={styles.title}>
          {step.title}
        </h2>
        <p id={textId} className={styles.text}>
          {step.text}
        </p>
        <div className={styles.actions}>
          {!isLast && (
            <button type="button" className={styles.skip} onClick={close}>
              Saltar
            </button>
          )}
          {index > 0 && (
            <button type="button" className={controls.button} onClick={previous}>
              Anterior
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            className={`${controls.button} ${styles.primary}`}
            onClick={next}
          >
            {isLast ? 'Terminar' : index === 0 ? 'Empezar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}
