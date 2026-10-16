<script lang="ts">
  // Texto de un versículo de la RV1909. Las palabras entre corchetes son agregados
  // de los traductores y se muestran en cursiva, como en las ediciones impresas.
  let { texto }: { texto: string } = $props()

  const partes = $derived(texto.split(/\[([^\]]*)\]/))
</script>

{#each partes as parte, i (i)}{#if i % 2}<em>{parte}</em>{:else}{parte}{/if}{/each}
