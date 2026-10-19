import { useId, useState, type SubmitEvent } from 'react';
import { passageFromReference, type Passage } from '../../../core/bible/passage.ts';
import { parseReference } from '../../../core/bible/reference-parse.ts';
import type { Versification } from '../../../core/bible/versification.ts';
import { SearchIcon } from '../../../shared/ui/icons.tsx';
import styles from './controls.module.css';

interface ReferenceSearchProps {
  readonly versification: Versification;
  readonly onSelect: (passage: Passage) => void;
}

/** "Ir a": acepta referencias como `Juan 3:16`, `jn 3 16`, `Sal 23` o `Gen.1.1`. */
export function ReferenceSearch({ versification, onSelect }: ReferenceSearchProps) {
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = new FormData(form).get('reference');
    const result = parseReference(typeof input === 'string' ? input : '', versification);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    form.reset();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur(); // Closes the on-screen keyboard on phones.
    }
    onSelect(passageFromReference(result.reference, versification));
  };

  return (
    <form role="search" className={styles.search} onSubmit={handleSubmit} data-tour="buscar">
      <SearchIcon className={styles.searchIcon} />
      <input
        name="reference"
        type="search"
        className={styles.input}
        placeholder="Ir a… Juan 3:16, Sal 23"
        aria-label="Ir a una referencia bíblica"
        aria-invalid={error !== null}
        aria-describedby={error === null ? undefined : errorId}
        autoComplete="off"
        enterKeyHint="go"
        onChange={() => {
          setError(null);
        }}
      />
      {error !== null && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </form>
  );
}
