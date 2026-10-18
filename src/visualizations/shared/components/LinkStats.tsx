import type { ReactNode } from 'react';
import { formatInteger, formatShare } from '../../../shared/lib/format.ts';
import type { LinkSummary } from '../link-summary.ts';
import styles from './LinkStats.module.css';

interface LinkStatsProps {
  readonly summary: LinkSummary;
  /**
   * How to interact, shown under the numbers: with a mouse (on wide screens), or on a touch
   * screen (phones included, since touch gestures are harder to guess).
   */
  readonly hint?: { readonly pointer: ReactNode; readonly touch: ReactNode };
}

/** A quiet corner summary of what is on screen; context, not the main event. */
export function LinkStats({ summary, hint }: LinkStatsProps) {
  const { verseCount, shownLinks, totalLinks, connectedVerses, crossTestamentLinks } = summary;
  return (
    <div className={styles.stats} aria-label="Resumen">
      <span>
        <strong>{formatInteger(verseCount)}</strong> versículos ·{' '}
        <strong>{formatInteger(shownLinks)}</strong>
        {shownLinks < totalLinks && ` de ${formatInteger(totalLinks)}`} enlaces mostrados
      </span>
      <span className={styles.secondary}>
        <strong>{formatShare(connectedVerses, verseCount)}</strong> de los versículos conectados ·{' '}
        <strong>{formatInteger(crossTestamentLinks)}</strong> enlaces entre los testamentos
      </span>
      {hint !== undefined && (
        <>
          <span className={`${styles.hint} ${styles.pointerHint}`}>{hint.pointer}</span>
          <span className={`${styles.hint} ${styles.touchHint}`}>{hint.touch}</span>
        </>
      )}
    </div>
  );
}
