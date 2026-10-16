// Navegación del lado del cliente con la History API (las rutas son compartibles).

export const ubicacion = $state({ ruta: location.pathname })

export function navegar(ruta: string, reemplazar = false): void {
  if (ruta === ubicacion.ruta) return
  if (reemplazar) history.replaceState(null, '', ruta)
  else history.pushState(null, '', ruta)
  ubicacion.ruta = ruta
}

addEventListener('popstate', () => {
  ubicacion.ruta = location.pathname
})

// Los links internos (<a href="/...">) navegan sin recargar la página.
addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return
  const a = (e.target as Element).closest('a')
  if (!a || a.target || a.hasAttribute('download') || a.origin !== location.origin) return
  e.preventDefault()
  navegar(a.pathname)
})
