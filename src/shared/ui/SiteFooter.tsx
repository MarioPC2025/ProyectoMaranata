import type { ReactNode } from 'react';
import { SourceCodeIcon } from './icons.tsx';
import { InstallLink } from './InstallGuide.tsx';
import styles from './SiteFooter.module.css';

const YEAR = new Date().getFullYear();

/** Where the code lives. The project is open source, so every page points at it. */
const REPOSITORY_URL = 'https://github.com/MarioPC2025/MaranathaBible';

interface SiteFooterProps {
  /** Page-specific credits, such as data attribution. */
  readonly children?: ReactNode;
  /** Extra class for page-specific spacing (CSS Modules class names may be undefined). */
  readonly className?: string | undefined;
}

/**
 * The minimal site-wide footer: the year, the author's site, the source and how to install the
 * app, plus credits.
 */
export function SiteFooter({ children, className }: SiteFooterProps) {
  return (
    <footer className={className ? `${styles.footer} ${className}` : styles.footer}>
      <span className={styles.owner}>
        <span className={styles.copyright}>© {YEAR} · </span>
        <a href="https://github.com/MarioPC2025" target="_blank" rel="noreferrer">
          Mario Baldovino
        </a>{' '}
        ·{' '}
        <a
          className={styles.source}
          href={REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          title="Código fuente en GitHub"
          aria-label="Código fuente en GitHub"
        >
          <SourceCodeIcon />
          <span className={styles.sourceLabel}>GitHub</span>
        </a>{' '}
        <InstallLink />
      </span>
      {children !== undefined && <span className={styles.credits}>{children}</span>}
    </footer>
  );
}
