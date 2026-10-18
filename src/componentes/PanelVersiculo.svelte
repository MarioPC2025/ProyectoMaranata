<script lang="ts">
  // Panel del versículo elegido: referencias cruzadas o texto original (hebreo/griego).
  import type { Indice } from '../lib/biblia/indice'
  import type { Referencias } from '../lib/datos/xrefs'
  import { panel, type Pestana } from '../lib/panel.svelte'
  import ListaReferencias from './ListaReferencias.svelte'
  import PanelOriginal from './PanelOriginal.svelte'

  let {
    indice,
    referencias,
    libro,
    capitulo,
    versiculo,
  }: {
    indice: Indice
    referencias: Referencias | undefined
    libro: number
    capitulo: number
    versiculo: number
  } = $props()

  const idPanel = $props.id()
  const pestanas = $derived<{ id: Pestana; nombre: string }[]>([
    { id: 'referencias', nombre: 'Referencias' },
    { id: 'original', nombre: libro <= 39 ? 'Hebreo' : 'Griego' },
  ])

  function teclas(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    panel.pestana = panel.pestana === 'referencias' ? 'original' : 'referencias'
    document.getElementById(`${idPanel}-${panel.pestana}`)?.focus()
  }
</script>

<div class="panel">
  <div
    class="pestanas"
    role="tablist"
    aria-label="Estudio del versículo"
    tabindex="-1"
    onkeydown={teclas}
  >
    {#each pestanas as p (p.id)}
      <button
        type="button"
        role="tab"
        id={`${idPanel}-${p.id}`}
        aria-selected={panel.pestana === p.id}
        aria-controls={`${idPanel}-contenido`}
        tabindex={panel.pestana === p.id ? 0 : -1}
        onclick={() => (panel.pestana = p.id)}>{p.nombre}</button
      >
    {/each}
  </div>
  <div id={`${idPanel}-contenido`} role="tabpanel" aria-labelledby={`${idPanel}-${panel.pestana}`}>
    {#if panel.pestana === 'original'}
      <PanelOriginal {indice} {libro} {capitulo} {versiculo} />
    {:else if referencias}
      <ListaReferencias
        versiculo={indice.numero(libro, capitulo, versiculo)}
        {indice}
        {referencias}
      />
    {:else}
      <p class="cargando">Cargando referencias…</p>
    {/if}
  </div>
</div>

<style>
  .panel {
    margin: 0.5rem 0 1rem;
    border-left: 3px solid var(--acento);
    background: color-mix(in srgb, var(--acento) 6%, var(--fondo));
    border-radius: 0 0.5rem 0.5rem 0;
    font-family: var(--fuente-interfaz);
    font-size: 0.9375rem;
    line-height: 1.5;
  }
  .pestanas {
    display: flex;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem 0;
    border-bottom: 1px solid var(--borde);
  }
  .pestanas button {
    padding: 0.375rem 0.75rem;
    font: inherit;
    font-size: 0.875rem;
    color: var(--texto-suave);
    background: none;
    border: 0;
    border-bottom: 2px solid transparent;
    cursor: pointer;
  }
  .pestanas button[aria-selected='true'] {
    color: var(--texto);
    font-weight: 600;
    border-bottom-color: var(--acento);
  }
  /* El contenido trae su propio relleno; acá se le saca el borde de color duplicado */
  [role='tabpanel'] :global(.referencias) {
    margin: 0;
    border-left: 0;
    background: none;
  }
  .cargando {
    margin: 0;
    padding: 0.75rem 1rem;
    color: var(--texto-suave);
  }
</style>
