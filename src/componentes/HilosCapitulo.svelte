<script lang="ts">
  // Franja con toda la Biblia en una línea y los hilos que salen del capítulo (o del versículo
  // elegido) hacia los textos con los que conecta.
  import { onMount } from 'svelte'
  import type { Indice } from '../lib/biblia/indice'
  import { GENEROS, LIBROS } from '../lib/biblia/libros'
  import { formatear, ruta } from '../lib/biblia/referencia'
  import type { Referencias } from '../lib/datos/xrefs'
  import { navegar } from '../lib/navegacion.svelte'
  import { alCambiarTema, colorGenero, temaActual, type Tema } from '../lib/viz/colores'
  import { crearEscala, versiculoAX, xAVersiculo } from '../lib/viz/escala'
  import type { Lienzo } from '../lib/viz/geometria'
  import { librosPorVersiculo } from '../lib/viz/instancias'
  import {
    dibujarArcos2D,
    dibujarBase,
    prepararCanvas,
    type ArcoSimple,
  } from '../lib/viz/resaltado'

  let {
    indice,
    referencias,
    libro,
    capitulo,
    versiculo,
  }: {
    indice: Indice
    referencias: Referencias
    libro: number
    capitulo: number
    versiculo?: number
  } = $props()

  const ALTO = 120

  let contenedor: HTMLDivElement
  let canvas: HTMLCanvasElement
  let ancho = $state(0)
  let tema = $state<Tema>(temaActual())
  /** Capítulo global bajo el puntero */
  let bajoPuntero = $state<number | null>(null)

  const libros = $derived(librosPorVersiculo(indice))
  const generoDeLibro = LIBROS.map((l) => GENEROS.indexOf(l.genero))
  const escala = $derived(crearEscala(indice.total, ancho || 1))
  const lienzo = $derived<Lienzo>({ ancho, base: ALTO - 16, altoMax: ALTO - 24 })

  /** Versículos de origen: el elegido o todo el capítulo */
  const origen = $derived.by((): [number, number] => {
    if (versiculo && indice.existe(libro, capitulo, versiculo)) {
      const v = indice.numero(libro, capitulo, versiculo)
      return [v, v + 1]
    }
    const c = indice.capituloGlobal(libro, capitulo)
    return [indice.inicioCapitulo[c], indice.inicioCapitulo[c + 1]]
  })

  const hilos = $derived.by(() => {
    const lista: ArcoSimple[] = []
    for (let v = origen[0]; v < origen[1]; v++) {
      for (let i = referencias.desp[v]; i < referencias.desp[v + 1]; i++) {
        const b = referencias.inicio[i]
        lista.push({ a: v, b, genero: generoDeLibro[libros[b] - 1] })
      }
    }
    return lista
  })

  /** Cuántos hilos llegan a cada capítulo global */
  const llegadas = $derived.by(() => {
    // Se arma de nuevo en cada cálculo y no se modifica después: no necesita ser reactivo
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const cuenta = new Map<number, number>()
    for (const h of hilos) {
      const c = indice.capituloDe(h.b)
      cuenta.set(c, (cuenta.get(c) ?? 0) + 1)
    }
    return cuenta
  })

  onMount(() => {
    const observador = new ResizeObserver(([e]) => {
      ancho = e.contentRect.width
      const dpr = Math.min(2, devicePixelRatio || 1)
      canvas.width = Math.round(ancho * dpr)
      canvas.height = Math.round(ALTO * dpr)
    })
    observador.observe(contenedor)
    const dejarDeEscuchar = alCambiarTema((t) => (tema = t))
    return () => {
      observador.disconnect()
      dejarDeEscuchar()
    }
  })

  $effect(() => {
    if (ancho <= 0) return
    const ctx = prepararCanvas(canvas, ancho)
    const alfa = Math.min(0.9, Math.max(0.25, 40 / Math.max(1, hilos.length)))
    dibujarArcos2D(ctx, escala, hilos, lienzo, tema, { alfa, grosor: 1.25 })
    dibujarBase(ctx, escala, indice, lienzo, tema)
    // Marca del capítulo (o versículo) actual
    const x0 = versiculoAX(escala, origen[0]) - 1
    const x1 = versiculoAX(escala, origen[1] - 1) + 1
    ctx.fillStyle = tema === 'oscuro' ? '#ffffff' : '#000000'
    ctx.fillRect(x0, lienzo.base - 2, Math.max(3, x1 - x0), 12)
    if (bajoPuntero !== null) {
      const c0 = versiculoAX(escala, indice.inicioCapitulo[bajoPuntero]) - 1
      const c1 = versiculoAX(escala, indice.inicioCapitulo[bajoPuntero + 1] - 1) + 1
      ctx.fillStyle = colorGenero(LIBROS[libros[indice.inicioCapitulo[bajoPuntero]] - 1].genero, tema)
      ctx.fillRect(c0, lienzo.base - 4, Math.max(3, c1 - c0), 14)
    }
  })

  /** Capítulo bajo el puntero; si hay un destino de los hilos a pocos píxeles, ese. */
  function capituloEn(e: MouseEvent): number {
    const x = e.clientX - contenedor.getBoundingClientRect().left
    let mejor = indice.capituloDe(xAVersiculo(escala, x))
    let distancia = 12
    for (const c of llegadas.keys()) {
      const d = Math.abs(versiculoAX(escala, indice.inicioCapitulo[c]) - x)
      if (d < distancia) {
        distancia = d
        mejor = c
      }
    }
    return mejor
  }

  const descripcion = $derived.by(() => {
    if (bajoPuntero === null) return ''
    const c = indice.capituloEnLibro(bajoPuntero)
    const n = llegadas.get(bajoPuntero) ?? 0
    return `${formatear(c)}: ${n} ${n === 1 ? 'referencia' : 'referencias'}`
  })

  const posicion = $derived(
    bajoPuntero === null
      ? 0
      : Math.min(ancho - 8, Math.max(8, versiculoAX(escala, indice.inicioCapitulo[bajoPuntero]))),
  )
</script>

<figure class="hilos">
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="lienzo"
    bind:this={contenedor}
    onpointermove={(e) => (bajoPuntero = capituloEn(e))}
    onpointerleave={() => (bajoPuntero = null)}
    onclick={(e) => navegar(ruta(indice.capituloEnLibro(capituloEn(e))))}
  >
    <canvas bind:this={canvas} aria-hidden="true"></canvas>
    {#if descripcion}
      <span class="etiqueta" class:derecha={posicion > ancho / 2} style:left={`${posicion}px`}
        >{descripcion}</span
      >
    {/if}
  </div>
  <figcaption>
    {hilos.length}
    {hilos.length === 1 ? 'referencia' : 'referencias'} desde
    {versiculo ? formatear({ libro, capitulo, versiculo }) : formatear({ libro, capitulo })}
    hacia el resto de la Biblia.
  </figcaption>
</figure>

<style>
  .hilos {
    margin: 1rem 0;
  }
  .lienzo {
    position: relative;
    height: 120px;
    cursor: pointer;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  .etiqueta {
    position: absolute;
    top: 0;
    transform: translateX(-10%);
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    white-space: nowrap;
    background: var(--fondo);
    border: 1px solid var(--borde);
    border-radius: 0.375rem;
    pointer-events: none;
  }
  .etiqueta.derecha {
    transform: translateX(-90%);
  }
  figcaption {
    font-size: 0.8125rem;
    color: var(--texto-suave);
  }
</style>
