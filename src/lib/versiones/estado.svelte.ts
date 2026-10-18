// Versión paralela elegida (se recuerda en este navegador) y versiones que dejaron de estar
// disponibles durante la sesión (por ejemplo, si una API revoca el acceso).

import { PROVEEDORES } from './index'

const CLAVE = 'ver-en'

function leer(): string {
  try {
    return localStorage.getItem(CLAVE) ?? ''
  } catch {
    return ''
  }
}

export const versiones = $state({ elegida: leer(), noDisponibles: [] as string[] })

export function elegirVersion(id: string) {
  versiones.elegida = id
  try {
    if (id) localStorage.setItem(CLAVE, id)
    else localStorage.removeItem(CLAVE)
  } catch {
    // Sin almacenamiento (modo privado): se recuerda solo en esta visita
  }
}

export function marcarNoDisponible(id: string) {
  if (!versiones.noDisponibles.includes(id)) versiones.noDisponibles.push(id)
  if (versiones.elegida === id) versiones.elegida = ''
}

export function disponibles() {
  return PROVEEDORES.filter((p) => p.configurada && !versiones.noDisponibles.includes(p.id))
}
