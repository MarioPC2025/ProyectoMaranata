<script lang="ts">
  import Buscador from './componentes/Buscador.svelte'
  import { desdeRuta, ruta } from './lib/biblia/referencia'
  import { navegar, ubicacion } from './lib/navegacion.svelte'
  import Inicio from './rutas/Inicio.svelte'
  import Lectura from './rutas/Lectura.svelte'

  const referencia = $derived(desdeRuta(ubicacion.ruta))

  // "/juan" lleva al capítulo 1
  $effect(() => {
    if (referencia && !referencia.capitulo) navegar(ruta({ ...referencia, capitulo: 1 }), true)
  })

  $effect(() => {
    if (!referencia) document.title = 'MaranathaBible — Referencias cruzadas de la Biblia'
  })
</script>

<header class="barra">
  <a class="marca" href="/">MaranathaBible</a>
  <Buscador />
</header>

<main>
  {#if ubicacion.ruta === '/'}
    <Inicio />
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
    >, CC BY. Texto bíblico: Reina-Valera 1909, dominio público.
  </p>
</footer>

<style>
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
  footer {
    max-width: 44rem;
    margin: 0 auto;
    padding: 1rem;
    border-top: 1px solid var(--borde);
    color: var(--texto-suave);
    font-size: 0.8125rem;
  }
</style>
