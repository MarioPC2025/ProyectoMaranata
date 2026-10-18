<script lang="ts">
  import type { Indice } from '../lib/biblia/indice'
  import { formatearRango, ruta } from '../lib/biblia/referencia'
  import { cargarLibroRV1909 } from '../lib/datos/cargar'
  import { referenciasDe, type Referencias } from '../lib/datos/xrefs'
  import TextoVersiculo from './TextoVersiculo.svelte'

  let {
    versiculo,
    indice,
    referencias,
  }: { versiculo: number; indice: Indice; referencias: Referencias } = $props()

  const PASO = 15
  let mostrar = $state(PASO)
  const lista = $derived(referenciasDe(referencias, versiculo))

  $effect(() => {
    void versiculo
    mostrar = PASO
  })

  async function extracto(numero: number): Promise<string> {
    const p = indice.posicion(numero)
    const libro = await cargarLibroRV1909(p.libro)
    return libro[p.capitulo - 1][p.versiculo - 1]
  }
</script>

<section class="referencias" aria-label="Referencias cruzadas">
  {#if lista.length === 0}
    <p class="vacio">Este versículo no tiene referencias cruzadas.</p>
  {:else}
    <h2>{lista.length} {lista.length === 1 ? 'referencia' : 'referencias'}</h2>
    <ol>
      {#each lista.slice(0, mostrar) as r (r.inicio * 65536 + r.fin)}
        <li>
          <a href={ruta(indice.posicion(r.inicio))}>{formatearRango(r.inicio, r.fin, indice)}</a>
          <span class="texto">
            {#await extracto(r.inicio)}
              …
            {:then texto}
              <TextoVersiculo {texto} />{r.fin > r.inicio ? ' …' : ''}
            {:catch}
              (no se pudo cargar el texto)
            {/await}
          </span>
        </li>
      {/each}
    </ol>
    {#if lista.length > mostrar}
      <button type="button" onclick={() => (mostrar += PASO * 2)}>
        Ver más ({lista.length - mostrar} restantes)
      </button>
    {/if}
  {/if}
</section>

<style>
  .referencias {
    margin: 0.5rem 0 1rem;
    padding: 0.75rem 1rem;
    border-left: 3px solid var(--acento);
    background: color-mix(in srgb, var(--acento) 6%, var(--fondo));
    border-radius: 0 0.5rem 0.5rem 0;
    font-family: var(--fuente-interfaz);
    font-size: 0.9375rem;
  }
  h2 {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--texto-suave);
  }
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.5rem;
  }
  a {
    font-weight: 600;
    margin-right: 0.375rem;
    white-space: nowrap;
  }
  .texto {
    color: var(--texto-suave);
  }
  .vacio {
    margin: 0;
    color: var(--texto-suave);
  }
  button {
    margin-top: 0.75rem;
    padding: 0.375rem 0.75rem;
    font: inherit;
    color: var(--acento);
    background: none;
    border: 1px solid var(--borde);
    border-radius: 0.5rem;
    cursor: pointer;
  }
</style>
