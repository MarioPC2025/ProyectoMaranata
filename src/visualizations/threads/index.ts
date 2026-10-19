import { lazy } from 'react';
import { ReadingIcon } from '../../shared/ui/icons.tsx';
import type { Visualization } from '../visualization.ts';

// The view's code is a chunk of its own; its download starts as soon as the app lists the views.
const explorer = import('./ThreadsExplorer.tsx');

export const threads = {
  id: 'threads',
  title: 'Hilos',
  shortTitle: 'Hilos',
  icon: ReadingIcon,
  openLabel: 'Leer en contexto',
  Component: lazy(async () => ({ default: (await explorer).ThreadsExplorer })),
} as const satisfies Visualization;
