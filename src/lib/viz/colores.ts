// Paleta de la visualización: un color por género literario, en el orden de GENEROS.
// Provisoria hasta decidir el diseño visual.

import { GENEROS, type Genero } from '../biblia/libros'

const OSCURO: Record<Genero, string> = {
  ley: '#f2b134',
  historia: '#e07a5f',
  poesia: '#c77dff',
  'profetas-mayores': '#4cc9f0',
  'profetas-menores': '#4895ef',
  evangelios: '#f94144',
  hechos: '#f8961e',
  'cartas-paulinas': '#90be6d',
  'cartas-generales': '#43aa8b',
  apocalipsis: '#f9e04f',
}

const CLARO: Record<Genero, string> = {
  ley: '#b07800',
  historia: '#b44a2e',
  poesia: '#8a3fd1',
  'profetas-mayores': '#0b84a8',
  'profetas-menores': '#2459b8',
  evangelios: '#c8102e',
  hechos: '#c05f00',
  'cartas-paulinas': '#4a7f25',
  'cartas-generales': '#1c7a5f',
  apocalipsis: '#9c8400',
}

export type Tema = 'oscuro' | 'claro'

export function colorGenero(genero: Genero, tema: Tema): string {
  return (tema === 'oscuro' ? OSCURO : CLARO)[genero]
}

/** Colores RGB (0-1) de todos los géneros, en el orden de GENEROS, para el shader */
export function paletaRGB(tema: Tema): Float32Array {
  const rgb = new Float32Array(GENEROS.length * 3)
  GENEROS.forEach((g, i) => {
    const hex = colorGenero(g, tema)
    for (let c = 0; c < 3; c++) rgb[i * 3 + c] = parseInt(hex.slice(1 + c * 2, 3 + c * 2), 16) / 255
  })
  return rgb
}

/** Tema efectivo de la página (respeta data-tema y prefers-color-scheme) */
export function temaActual(): Tema {
  const forzado = document.documentElement.dataset.tema
  if (forzado === 'claro' || forzado === 'oscuro') return forzado
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}
