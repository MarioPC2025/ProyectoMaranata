<script lang="ts">
  // Texto de un capítulo en otra versión (NTV, NVI-S, RVES), tal como lo devuelve su API.
  import { onMount, tick } from 'svelte'
  import type { Libro } from '../lib/biblia/libros'
  import { alCambiarTema, temaActual } from '../lib/viz/colores'
  import { marcarNoDisponible } from '../lib/versiones/estado.svelte'
  import { limpiarHtml } from '../lib/versiones/html'
  import {
    VersionNoDisponible,
    type ProveedorVersion,
    type TextoVersion,
  } from '../lib/versiones/tipos'

  let {
    proveedor,
    libro,
    capitulo,
  }: { proveedor: ProveedorVersion; libro: Libro; capitulo: number } = $props()

  let texto = $state<TextoVersion>()
  // Los estilos de YouVersion tienen su propio tema oscuro (data-yv-theme)
  let tema = $state(temaActual())
  onMount(() => alCambiarTema((t) => (tema = t)))
  let error = $state('')
  let cargando = $state(true)

  $effect(() => {
    const p = proveedor
    const usfm = libro.usfm
    const c = capitulo
    texto = undefined
    error = ''
    cargando = true
    p.obtener(usfm, c).then(
      async (t) => {
        if (p !== proveedor || usfm !== libro.usfm || c !== capitulo) return
        for (const href of t.estilos ?? []) agregarEstilo(href)
        texto = t
        cargando = false
        await tick()
        t.alMostrar?.()
      },
      (e) => {
        cargando = false
        if (e instanceof VersionNoDisponible) {
          error = `La ${p.abreviatura} no está disponible por ahora.`
          marcarNoDisponible(p.id)
        } else {
          console.error(`Error al cargar la ${p.abreviatura}:`, e)
          error = `No se pudo cargar la ${p.abreviatura}. Probá de nuevo más tarde.`
        }
      },
    )
  })

  function agregarEstilo(href: string) {
    if (document.querySelector(`link[rel="stylesheet"][href="${CSS.escape(href)}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }
</script>

<section class="otra-version" aria-label={`${proveedor.nombre}, ${libro.nombre} ${capitulo}`}>
  <h2>{proveedor.abreviatura} <span>· {libro.nombre} {capitulo}</span></h2>
  {#if cargando}
    <p class="estado">Cargando la {proveedor.abreviatura}…</p>
  {:else if error}
    <p class="estado" role="status">{error}</p>
  {:else if texto}
    <div
      class="texto"
      {...texto.atributosContenedor}
      data-yv-theme={tema === 'oscuro' ? 'dark' : 'light'}
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML de la API, limpiado de scripts -->
      {@html limpiarHtml(texto.html)}
    </div>
    <p class="atribucion">{texto.atribucion}</p>
    {#if texto.enlace}
      <p class="atribucion">
        <a href={texto.enlace} target="_blank" rel="noopener">Ver en YouVersion</a>
      </p>
    {/if}
  {/if}
</section>

<style>
  .otra-version {
    font-family: var(--fuente-lectura);
  }
  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.125rem;
  }
  h2 span {
    font-weight: normal;
    color: var(--texto-suave);
  }
  .texto {
    font-size: 1.0625rem;
    line-height: 1.7;
  }
  /* Números de versículo de API.Bible (span.v) */
  .texto :global(.v) {
    font-family: var(--fuente-interfaz);
    font-size: 0.7rem;
    font-weight: 600;
    vertical-align: super;
    margin-right: 0.2rem;
    color: var(--acento);
  }
  .texto :global(p) {
    margin: 0 0 0.75rem;
  }
  .texto :global(.s1),
  .texto :global(.s) {
    font-family: var(--fuente-interfaz);
    font-weight: 600;
    font-size: 0.9375rem;
    margin-top: 1rem;
  }
  .atribucion,
  .estado {
    font-family: var(--fuente-interfaz);
    font-size: 0.8125rem;
    color: var(--texto-suave);
  }
</style>
