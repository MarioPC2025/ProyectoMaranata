import { useCallback } from 'react';
import { useStringPreference } from '../../shared/lib/preferences.ts';
import { getApiVersion, isApiVersionId } from './registry.ts';
import type { ApiVersion, ApiVersionId } from './types.ts';

/** Clave de la elección, que se recuerda entre visitas. */
const PREFERENCE_KEY = 'api-version';

/**
 * La versión de API que el lector eligió para leer en el panel, o `null` si no eligió ninguna. La
 * elección vive en las preferencias, así que el menú del encabezado y el panel de detalles la ven
 * a la vez.
 */
export function useApiVersionChoice(): readonly [
  ApiVersion | null,
  (id: ApiVersionId | null) => void,
] {
  const [stored, store] = useStringPreference(PREFERENCE_KEY, '');
  const set = useCallback(
    (id: ApiVersionId | null) => {
      store(id ?? '');
    },
    [store],
  );
  const version = isApiVersionId(stored) ? getApiVersion(stored) : null;
  return [version?.configured() ? version : null, set];
}
