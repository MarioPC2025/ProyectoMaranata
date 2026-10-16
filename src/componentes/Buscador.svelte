<script lang="ts">
  import { cargarIndice } from '../lib/datos/cargar'
  import { esValida, parsear, ruta } from '../lib/biblia/referencia'
  import { navegar } from '../lib/navegacion.svelte'

  let consulta = $state('')
  let error = $state('')

  async function buscar(e: SubmitEvent) {
    e.preventDefault()
    error = ''
    const ref = parsear(consulta)
    if (!ref) {
      error = 'No reconozco esa referencia. Probá con "Juan 3:16" o "1 Co 13".'
      return
    }
    ref.capitulo ??= 1
    if (!esValida(ref, await cargarIndice())) {
      error = 'Esa referencia no existe.'
      return
    }
    navegar(ruta(ref))
    consulta = ''
  }
</script>

<form role="search" onsubmit={buscar}>
  <label class="oculto" for="buscar">Buscar un pasaje</label>
  <input
    id="buscar"
    type="search"
    placeholder="Buscar: Juan 3:16, 1 Co 13…"
    autocomplete="off"
    spellcheck="false"
    bind:value={consulta}
    aria-describedby="buscar-error"
  />
  <button type="submit">Ir</button>
  <p id="buscar-error" class="error" aria-live="polite">{error}</p>
</form>

<style>
  form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    width: 100%;
  }
  input {
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.75rem;
    font: inherit;
    color: inherit;
    background: var(--fondo);
    border: 1px solid var(--borde);
    border-radius: 0.5rem;
  }
  button {
    padding: 0.5rem 1rem;
    font: inherit;
    color: var(--fondo);
    background: var(--acento);
    border: 0;
    border-radius: 0.5rem;
    cursor: pointer;
  }
  .error {
    flex-basis: 100%;
    margin: 0;
    min-height: 0;
    color: var(--texto-suave);
    font-size: 0.875rem;
  }
  .error:empty {
    display: none;
  }
</style>
