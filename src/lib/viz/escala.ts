// Escala horizontal de la vista general: todos los versículos en una línea, con zoom y desplazamiento.
// Es inmutable: cada operación devuelve una escala nueva.

export interface Escala {
  /** Cantidad de versículos */
  total: number
  /** Ancho disponible en píxeles CSS */
  ancho: number
  /** 1 = toda la Biblia visible */
  zoom: number
  /** Versículo (fraccionario) que queda en el borde izquierdo */
  desde: number
}

export const ZOOM_MAX = 2000
/** Por encima de esta densidad, el puntero selecciona capítulos en lugar de versículos */
export const VERSICULOS_POR_PIXEL_CAPITULO = 3

export function crearEscala(total: number, ancho: number): Escala {
  return { total, ancho: Math.max(1, ancho), zoom: 1, desde: 0 }
}

function limitar(e: Escala): Escala {
  const zoom = Math.min(ZOOM_MAX, Math.max(1, e.zoom))
  const visibles = e.total / zoom
  const desde = Math.min(e.total - visibles, Math.max(0, e.desde))
  return { ...e, zoom, desde }
}

export function conAncho(e: Escala, ancho: number): Escala {
  return limitar({ ...e, ancho: Math.max(1, ancho) })
}

/** Versículos por píxel con el zoom actual */
export function densidad(e: Escala): number {
  return e.total / (e.ancho * e.zoom)
}

/** Posición x (centro) del versículo v */
export function versiculoAX(e: Escala, v: number): number {
  return (v + 0.5 - e.desde) / densidad(e)
}

/** Versículo bajo la posición x */
export function xAVersiculo(e: Escala, x: number): number {
  const v = Math.floor(e.desde + x * densidad(e))
  return Math.min(e.total - 1, Math.max(0, v))
}

/** Zoom por un factor manteniendo fijo el punto que está en x */
export function zoomEn(e: Escala, x: number, factor: number): Escala {
  const ancla = e.desde + x * densidad(e)
  const zoom = Math.min(ZOOM_MAX, Math.max(1, e.zoom * factor))
  return limitar({ ...e, zoom, desde: ancla - (x * e.total) / (e.ancho * zoom) })
}

/** Desplaza la vista dx píxeles (positivo = el contenido se mueve a la derecha) */
export function desplazar(e: Escala, dx: number): Escala {
  return limitar({ ...e, desde: e.desde - dx * densidad(e) })
}

/** Centra la vista en el versículo v sin cambiar el zoom */
export function centrarEn(e: Escala, v: number): Escala {
  return limitar({ ...e, desde: v + 0.5 - e.total / e.zoom / 2 })
}

export function verTodo(e: Escala): Escala {
  return { ...e, zoom: 1, desde: 0 }
}
