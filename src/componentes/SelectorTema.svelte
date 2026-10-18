<script lang="ts">
  import { aplicarPreferencia, leerPreferencia, type PreferenciaTema } from '../lib/tema'

  let preferencia = $state<PreferenciaTema>(leerPreferencia())
</script>

<label class="tema">
  <span class="oculto">Tema</span>
  <select
    bind:value={preferencia}
    onchange={() => aplicarPreferencia(preferencia)}
    title="Tema de colores"
  >
    <option value="auto">Tema: automático</option>
    <option value="claro">Tema: claro</option>
    <option value="oscuro">Tema: oscuro</option>
  </select>
</label>

<style>
  select {
    font: inherit;
    font-size: 0.8125rem;
    color: inherit;
    background: var(--fondo);
    border: 1px solid var(--borde);
    border-radius: 0.375rem;
    padding: 0.25rem 0.375rem;
  }
</style>
