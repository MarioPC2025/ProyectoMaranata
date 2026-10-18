<script lang="ts">
  // Hebreo/arameo o griego de un versículo, palabra por palabra (STEPBible-Data, CC BY 4.0).
  // Al tocar una palabra se ve su ficha: lema, morfología, glosa y dónde más aparece.
  import '@fontsource/noto-serif-hebrew/hebrew-400.css'
  import '@fontsource/noto-serif/greek-400.css'
  import '@fontsource/noto-serif/greek-ext-400.css'
  import type { Indice } from '../lib/biblia/indice'
  import { formatear, ruta } from '../lib/biblia/referencia'
  import {
    cargarConcordancia,
    cargarLexico,
    cargarMorfologia,
    cargarOriginal,
  } from '../lib/datos/cargar'
  import { MARCA, glosa, partesStrong, type Lexico, type Palabra } from '../lib/datos/original'

  let {
    indice,
    libro,
    capitulo,
    versiculo,
  }: { indice: Indice; libro: number; capitulo: number; versiculo: number } = $props()

  const hebreo = $derived(libro <= 39)
  const PASO = 20

  let palabras = $state.raw<Palabra[]>()
  let lexico = $state.raw<Lexico>()
  let morfologia = $state.raw<Record<string, string>>()
  let error = $state('')
  let elegida = $state<number | null>(null)
  let mostrar = $state(PASO)

  $effect(() => {
    const [l, c, v] = [libro, capitulo, versiculo]
    palabras = undefined
    elegida = null
    error = ''
    Promise.all([cargarOriginal(l), cargarLexico(l <= 39 ? 'H' : 'G'), cargarMorfologia()]).then(
      ([original, lex, morf]) => {
        if (l !== libro || c !== capitulo || v !== versiculo) return
        palabras = original[c - 1]?.[v - 1] ?? []
        lexico = lex
        morfologia = morf
      },
      (e) => (error = e instanceof Error ? e.message : String(e)),
    )
  })

  $effect(() => {
    void elegida
    mostrar = PASO
  })

  const titulo = $derived(palabras?.filter((p) => p[6] === MARCA.titulo) ?? [])
  const cuerpo = $derived(palabras?.filter((p) => p[6] !== MARCA.titulo) ?? [])
  const actual = $derived(elegida !== null && palabras ? palabras[elegida] : undefined)
  const aqui = $derived(indice.numero(libro, capitulo, versiculo))

  function elegir(p: Palabra) {
    const i = palabras!.indexOf(p)
    elegida = elegida === i ? null : i
  }

  function nombreVersiculo(n: number): string {
    return formatear(indice.posicion(n), true)
  }
</script>

{#snippet lista(grupo: Palabra[])}
  <ol class="palabras" dir={hebreo ? 'rtl' : 'ltr'}>
    {#each grupo as p, i (i)}
      {@const g = glosa(p)}
      <li>
        <button
          type="button"
          class="palabra"
          class:elegida={actual === p}
          class:variante={p[6] === MARCA.soloTR || p[6] === MARCA.soloNA}
          aria-pressed={actual === p}
          onclick={() => elegir(p)}
        >
          <span class="original" lang={hebreo ? 'he' : 'grc'}>{p[0]}</span>
          <span class="translit" dir="ltr">{p[1]}</span>
          <span class="glosa" dir="ltr" class:ingles={g.enIngles}>{g.texto}</span>
        </button>
      </li>
    {/each}
  </ol>
{/snippet}

<section class="original-panel" aria-label={hebreo ? 'Texto hebreo' : 'Texto griego'}>
  {#if error}
    <p class="nota" role="alert">No se pudo cargar el texto original: {error}</p>
  {:else if !palabras || !lexico || !morfologia}
    <p class="nota">Cargando…</p>
  {:else if palabras.length === 0}
    <p class="nota">
      Este versículo no está en el texto {hebreo ? 'hebreo' : 'griego'} usado (aparece en el Textus Receptus
      o en otra tradición).
    </p>
  {:else}
    {#if titulo.length}
      <p class="rotulo">Título del salmo</p>
      {@render lista(titulo)}
      <p class="rotulo">Versículo</p>
    {/if}
    {@render lista(cuerpo)}

    {#if cuerpo.some((p) => glosa(p).enIngles)}
      <p class="nota">
        Por ahora las glosas del hebreo están en inglés: la traducción al español está en curso.
      </p>
    {/if}

    {#if actual}
      {@const { partes, principal } = partesStrong(actual[4])}
      {@const strong = partes[principal]}
      {@const entrada = lexico[strong]}
      {@const g = glosa(actual)}
      <article class="ficha" aria-live="polite">
        <header>
          <span class="grande" lang={hebreo ? 'he' : 'grc'} dir={hebreo ? 'rtl' : 'ltr'}
            >{entrada?.[0] ?? actual[0]}</span
          >
          {#if entrada}<span class="translit">{entrada[1]}</span>{/if}
          <span class="strong">{strong}</span>
        </header>
        <dl>
          <dt>En este versículo</dt>
          <dd>
            <span lang={hebreo ? 'he' : 'grc'}>{actual[0]}</span>
            · {g.texto}{#if g.enIngles}<span class="ingles aparte">(en inglés)</span>{/if}
          </dd>
          <dt>Morfología</dt>
          <dd>{morfologia[actual[5]] ?? actual[5]}</dd>
          {#if entrada}
            <dt>Significado breve</dt>
            <dd>{entrada[3]} <span class="ingles">(en inglés)</span></dd>
          {/if}
          {#if partes.length > 1}
            <dt>Partes de la palabra</dt>
            <dd>
              {#each partes as parte, i (i)}
                {#if i > 0}<span aria-hidden="true"> + </span>{/if}
                <span class:principal={i === principal}
                  >{(lexico[parte]?.[0] ?? parte).replace(/^\/|\/$/g, '')} ({lexico[parte]?.[3] ??
                    parte})</span
                >
              {/each}
            </dd>
          {/if}
          {#if actual[6] === MARCA.soloTR}
            <dt>Texto</dt>
            <dd>Está en el Textus Receptus (base de la RV1909) pero no en Nestle-Aland.</dd>
          {:else if actual[6] === MARCA.soloNA}
            <dt>Texto</dt>
            <dd>Está en Nestle-Aland pero no en el Textus Receptus (base de la RV1909).</dd>
          {/if}
        </dl>

        {#await cargarConcordancia(strong)}
          <p class="nota">Buscando en qué otros versículos aparece…</p>
        {:then versiculos}
          <h3>
            Aparece en {versiculos.length.toLocaleString('es')}
            {versiculos.length === 1 ? 'versículo' : 'versículos'}
          </h3>
          <ul class="concordancia">
            {#each versiculos.slice(0, mostrar) as n (n)}
              <li>
                <a href={ruta(indice.posicion(n))} aria-current={n === aqui ? 'true' : undefined}
                  >{nombreVersiculo(n)}</a
                >
              </li>
            {/each}
          </ul>
          {#if versiculos.length > mostrar}
            <button type="button" class="mas" onclick={() => (mostrar += PASO * 5)}>
              Ver más ({(versiculos.length - mostrar).toLocaleString('es')} restantes)
            </button>
          {/if}
        {:catch}
          <p class="nota">No se pudo cargar la concordancia.</p>
        {/await}
      </article>
    {/if}

    <p class="fuente">
      Texto {hebreo ? 'hebreo' : 'griego'} y datos:
      <a href="https://www.stepbible.org">STEP Bible</a>
      (Tyndale House, Cambridge), CC BY 4.0.
    </p>
  {/if}
</section>

<style>
  .original-panel {
    padding: 0.75rem 1rem;
  }
  .palabras {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .palabra {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 3rem;
    padding: 0.25rem 0.5rem;
    font: inherit;
    color: inherit;
    background: var(--fondo);
    border: 1px solid var(--borde);
    border-radius: 0.375rem;
    cursor: pointer;
  }
  .palabra:hover,
  .palabra.elegida {
    border-color: var(--acento);
  }
  .palabra.elegida {
    background: color-mix(in srgb, var(--acento) 14%, var(--fondo));
  }
  .palabra.variante {
    border-style: dashed;
  }
  .original,
  .grande {
    font-family: 'Noto Serif Hebrew', 'Noto Serif', 'SBL Hebrew', 'Times New Roman', serif;
    font-size: 1.375rem;
    line-height: 1.6;
  }
  .translit {
    font-size: 0.75rem;
    font-style: italic;
    color: var(--texto-suave);
  }
  .glosa {
    font-size: 0.8125rem;
  }
  .ingles {
    color: var(--texto-suave);
  }
  .aparte {
    margin-left: 0.3em;
  }
  .rotulo {
    margin: 0.5rem 0 0.25rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--texto-suave);
  }
  .ficha {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: var(--fondo);
    border: 1px solid var(--borde);
    border-radius: 0.5rem;
  }
  .ficha header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.75rem;
  }
  .grande {
    font-size: 1.75rem;
  }
  .strong {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--texto-suave);
  }
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.25rem 0.75rem;
    margin: 0.5rem 0;
  }
  dt {
    color: var(--texto-suave);
    font-size: 0.8125rem;
  }
  dd {
    margin: 0;
  }
  .principal {
    font-weight: 600;
  }
  h3 {
    margin: 0.75rem 0 0.25rem;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--texto-suave);
  }
  .concordancia {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .concordancia a[aria-current] {
    font-weight: 700;
  }
  .mas {
    margin-top: 0.5rem;
    padding: 0.25rem 0.625rem;
    font: inherit;
    color: var(--acento);
    background: none;
    border: 1px solid var(--borde);
    border-radius: 0.375rem;
    cursor: pointer;
  }
  .nota,
  .fuente {
    margin: 0.5rem 0 0;
    font-size: 0.8125rem;
    color: var(--texto-suave);
  }
  @media (max-width: 480px) {
    dl {
      grid-template-columns: 1fr;
    }
  }
</style>
