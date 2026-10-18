// Service worker de Proyecto Maranata: permite usar el sitio sin conexión con la RV1909 y las
// referencias. No guarda las versiones con copyright (/api ni otros dominios): esas
// requieren conexión y tienen sus propias reglas de caché.

const VERSION = 'v1'
const CACHE_APP = `maranata-app-${VERSION}`
const CACHE_DATOS = `maranata-datos-${VERSION}`
const INICIALES = [
  '/',
  '/data/indice.json',
  '/data/xrefs.bin.gz',
  '/icono.svg',
  '/manifest.webmanifest',
]

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_DATOS)
      .then((cache) => cache.addAll(INICIALES))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves
            .filter((c) => c.startsWith('maranata-') && c !== CACHE_APP && c !== CACHE_DATOS)
            .map((c) => caches.delete(c)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

/** Responde con la caché y la actualiza en segundo plano */
async function cacheYActualizar(cacheNombre, peticion) {
  const cache = await caches.open(cacheNombre)
  const guardada = await cache.match(peticion)
  const red = fetch(peticion)
    .then((resp) => {
      if (resp.ok) cache.put(peticion, resp.clone())
      return resp
    })
    .catch(() => undefined)
  return guardada ?? (await red) ?? Response.error()
}

/** Páginas: primero la red; sin conexión, la portada guardada (la app resuelve la ruta) */
async function pagina(peticion) {
  try {
    const resp = await fetch(peticion)
    if (resp.ok) (await caches.open(CACHE_APP)).put('/', resp.clone())
    return resp
  } catch {
    return (await caches.match('/')) ?? Response.error()
  }
}

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  const url = new URL(peticion.url)
  if (peticion.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (peticion.mode === 'navigate') {
    evento.respondWith(pagina(peticion))
  } else if (url.pathname.startsWith('/data/')) {
    evento.respondWith(cacheYActualizar(CACHE_DATOS, peticion))
  } else if (url.pathname.startsWith('/assets/') || /\.(svg|png|webmanifest)$/.test(url.pathname)) {
    // Los archivos de /assets tienen hash en el nombre: nunca cambian
    evento.respondWith(cacheYActualizar(CACHE_APP, peticion))
  }
})
