// Preferencia de tema elegida por el usuario: automático (el del sistema), claro u oscuro.
// Se guarda en este navegador. index.html la aplica antes de pintar, para evitar un parpadeo.

export type PreferenciaTema = 'auto' | 'claro' | 'oscuro'

const CLAVE = 'tema'

export function leerPreferencia(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CLAVE)
    return v === 'claro' || v === 'oscuro' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

export function aplicarPreferencia(pref: PreferenciaTema) {
  const raiz = document.documentElement
  if (pref === 'auto') delete raiz.dataset.tema
  else raiz.dataset.tema = pref
  try {
    if (pref === 'auto') localStorage.removeItem(CLAVE)
    else localStorage.setItem(CLAVE, pref)
  } catch {
    // Sin almacenamiento: vale solo para esta visita
  }
}
