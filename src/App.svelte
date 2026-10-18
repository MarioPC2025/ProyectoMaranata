<script lang="ts">
  import { tick } from 'svelte'
  import Buscador from './componentes/Buscador.svelte'
  import SelectorTema from './componentes/SelectorTema.svelte'
  import { desdeRuta, ruta } from './lib/biblia/referencia'
  import { navegar, ubicacion } from './lib/navegacion.svelte'
  import Acerca from './rutas/Acerca.svelte'
  import Inicio from './rutas/Inicio.svelte'
  import Lectura from './rutas/Lectura.svelte'

  const referencia = $derived(desdeRuta(ubicacion.ruta))

  // "/juan" lleva al capítulo 1
  $effect(() => {
    if (referencia && !referencia.capitulo) navegar(ruta({ ...referencia, capitulo: 1 }), true)
  })

  $effect(() => {
    if (ubicacion.ruta === '/acerca') document.title = 'Acerca de — Proyecto Maranata'
    else if (!referencia) document.title = 'Proyecto Maranata — Referencias cruzadas de la Biblia'
  })

  // Al cambiar de página (no en la carga inicial), el foco va al contenido nuevo para que
  // los lectores de pantalla lo anuncien. Si la ruta apunta a un versículo, Lectura hace scroll.
  let rutaAnterior = ubicacion.ruta
  let principal: HTMLElement
  $effect(() => {
    const actual = ubicacion.ruta
    if (actual === rutaAnterior) return
    const mismoCapitulo =
      desdeRuta(actual)?.capitulo !== undefined &&
      desdeRuta(rutaAnterior)?.libro === desdeRuta(actual)?.libro &&
      desdeRuta(rutaAnterior)?.capitulo === desdeRuta(actual)?.capitulo
    rutaAnterior = actual
    if (mismoCapitulo) return
    tick().then(() => {
      principal.focus({ preventScroll: true })
      if (!desdeRuta(actual)?.versiculo) window.scrollTo(0, 0)
    })
  })
</script>

<a class="saltar" href="#contenido">Saltar al contenido</a>

<header class="barra">
  <a class="marca" href="/">Proyecto Maranata</a>
  <Buscador />
  <SelectorTema />
</header>

<main id="contenido" tabindex="-1" bind:this={principal} class:ancho={ubicacion.ruta === '/'}>
  {#if ubicacion.ruta === '/'}
    <Inicio />
  {:else if ubicacion.ruta === '/acerca'}
    <Acerca />
  {:else if referencia?.capitulo}
    <Lectura {referencia} />
  {:else if !referencia}
    <h1>Página no encontrada</h1>
    <p><a href="/">Volver al inicio</a></p>
  {/if}
</main>

<footer>
  <p>
    Referencias cruzadas de <a href="https://www.openbible.info/labs/cross-references/"
      >OpenBible.info</a
    >, CC BY. Texto bíblico: Reina-Valera 1909, dominio público. Otras versiones, con el copyright
    de cada una.
  </p>
  <p><a href="/acerca">Acerca de, fuentes y privacidad</a></p>
</footer>

<style>
  .saltar {
    position: absolute;
    left: 0.5rem;
    top: -3rem;
    z-index: 2;
    padding: 0.5rem 0.75rem;
    background: var(--fondo);
    border: 1px solid var(--acento);
    border-radius: 0.375rem;
  }
  .saltar:focus {
    top: 0.5rem;
  }
  .barra {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    padding: 0.75rem 1rem;
    background: var(--fondo);
    border-bottom: 1px solid var(--borde);
  }
  .barra :global(form) {
    flex: 1 1 16rem;
    max-width: 28rem;
  }
  .marca {
    font-weight: 700;
    color: var(--texto);
    text-decoration: none;
  }
  main {
    max-width: 44rem;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
  }
  main:focus {
    outline: none;
  }
  /* El inicio usa todo el ancho para la vista general */
  main.ancho {
    max-width: 80rem;
  }
  footer {
    max-width: 44rem;
    margin: 0 auto;
    padding: 1rem;
    border-top: 1px solid var(--borde);
    color: var(--texto-suave);
    font-size: 0.8125rem;
  }
</style>
