<script lang="ts">
  import { tick } from 'svelte'
  import HilosCapitulo from '../componentes/HilosCapitulo.svelte'
  import ListaReferencias from '../componentes/ListaReferencias.svelte'
  import TextoVersiculo from '../componentes/TextoVersiculo.svelte'
  import type { Indice } from '../lib/biblia/indice'
  import { libro as datosLibro } from '../lib/biblia/libros'
  import { esValida, formatear, ruta, type Referencia } from '../lib/biblia/referencia'
  import { cargarIndice, cargarLibroRV1909, cargarReferencias } from '../lib/datos/cargar'
  import type { Referencias } from '../lib/datos/xrefs'
  import OtraVersion from '../componentes/OtraVersion.svelte'
  import { EXTERNAS } from '../lib/versiones'
  import { disponibles, elegirVersion, versiones } from '../lib/versiones/estado.svelte'

  let { referencia }: { referencia: Referencia } = $props()

  let indice = $state.raw<Indice>()
  let referencias = $state.raw<Referencias>()
  let texto = $state<string[][]>()
  let error = $state('')

  const libro = $derived(datosLibro(referencia.libro))
  const capitulo = $derived(referencia.capitulo ?? 1)
  const valida = $derived(indice ? esValida({ ...referencia, capitulo }, indice) : true)
  const paralela = $derived(disponibles().find((p) => p.id === versiones.elegida))

  $effect(() => {
    cargarIndice().then((i) => (indice = i), mostrarError)
    cargarReferencias().then((r) => (referencias = r), mostrarError)
  })

  $effect(() => {
    const id = referencia.libro
    texto = undefined
    cargarLibroRV1909(id).then((t) => {
      if (id === referencia.libro) texto = t
    }, mostrarError)
  })

  // Lleva a la vista el versículo elegido
  $effect(() => {
    const v = referencia.versiculo
    if (!texto || !indice || !referencias || !v) return
    tick().then(() => {
      document.getElementById(`v${v}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  })

  $effect(() => {
    document.title = `${formatear({ ...referencia, capitulo })} — Proyecto Maranata`
  })

  function mostrarError(e: unknown) {
    error = e instanceof Error ? e.message : String(e)
  }

  function enlaceCapitulo(delta: number): string | undefined {
    if (!indice) return undefined
    let l = referencia.libro
    let c = capitulo + delta
    if (c < 1) {
      if (l === 1) return undefined
      l--
      c = indice.capitulos(l)
    } else if (c > indice.capitulos(l)) {
      if (l === 66) return undefined
      l++
      c = 1
    }
    return ruta({ libro: l, capitulo: c })
  }
</script>

{#if error}
  <p role="alert">No se pudieron cargar los datos: {error}</p>
{:else if !valida}
  <h1>No encontrado</h1>
  <p>{formatear({ ...referencia, capitulo })} no existe en la Biblia.</p>
  <p><a href={ruta({ libro: referencia.libro, capitulo: 1 })}>Ir a {libro.nombre} 1</a></p>
{:else}
  <article>
    <header>
      <h1>{libro.nombre} {capitulo}</h1>
      <nav aria-label="Capítulos">
        {#if enlaceCapitulo(-1)}<a href={enlaceCapitulo(-1)} rel="prev">← Anterior</a>{/if}
        {#if enlaceCapitulo(1)}<a href={enlaceCapitulo(1)} rel="next">Siguiente →</a>{/if}
      </nav>
    </header>

    {#if indice && referencias}
      <HilosCapitulo
        {indice}
        {referencias}
        libro={referencia.libro}
        {capitulo}
        versiculo={referencia.versiculo}
      />
    {/if}

    <div class="ver-en">
      <label>
        Ver también en
        <select value={versiones.elegida} onchange={(e) => elegirVersion(e.currentTarget.value)}>
          <option value="">— solo RV1909 —</option>
          {#each disponibles() as p (p.id)}
            <option value={p.id}>{p.abreviatura} · {p.nombre}</option>
          {/each}
        </select>
      </label>
      <span class="externas">
        En otros sitios:
        {#each EXTERNAS as ext, i (ext.abreviatura)}
          {#if i > 0}<span class="separador" aria-hidden="true">·</span>{/if}
          <a
            href={ext.enlace(libro.nombre, capitulo)}
            target="_blank"
            rel="noopener"
            title={ext.nombre}>{ext.abreviatura}</a
          >
        {/each}
      </span>
    </div>

    {#if indice?.rv1909Desalineado(referencia.libro, capitulo)}
      <p class="aviso">
        En este capítulo la numeración de la Reina-Valera 1909 difiere de la que usan las
        referencias cruzadas, así que algunos versículos pueden aparecer corridos o vacíos.
      </p>
    {/if}

    <div class="columnas" class:con-paralela={!!paralela}>
      {#if paralela}
        <aside class="paralela">
          <OtraVersion proveedor={paralela} {libro} {capitulo} />
        </aside>
      {/if}
      <div class="principal">
        {#if !texto || !indice || !referencias}
          <p class="cargando">Cargando…</p>
        {:else}
          {#if paralela}<h2 class="titulo-rv">
              RV1909 <span>· {libro.nombre} {capitulo}</span>
            </h2>{/if}
          <ol class="versiculos">
            {#each texto[capitulo - 1] as t, i (i)}
              {@const v = i + 1}
              {@const seleccionado = v === referencia.versiculo}
              <li id={`v${v}`} class:seleccionado>
                <a
                  class="numero"
                  href={seleccionado
                    ? ruta({ libro: referencia.libro, capitulo })
                    : ruta({ libro: referencia.libro, capitulo, versiculo: v })}
                  aria-current={seleccionado ? 'true' : undefined}
                  aria-label={`Versículo ${v}${seleccionado ? ', ocultar referencias' : ', ver referencias'}`}
                  >{v}</a
                >
                <span class="texto"><TextoVersiculo texto={t} /></span>
                {#if seleccionado}
                  <ListaReferencias
                    versiculo={indice.numero(referencia.libro, capitulo, v)}
                    {indice}
                    {referencias}
                  />
                {/if}
              </li>
            {/each}
          </ol>
          <p class="fuente">Texto: Reina-Valera 1909 (dominio público).</p>
        {/if}
      </div>
    </div>
  </article>
{/if}

<style>
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }
  h1 {
    margin: 0;
    font-family: var(--fuente-lectura);
  }
  nav {
    display: flex;
    gap: 1rem;
  }
  .aviso {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--borde);
    border-radius: 0.5rem;
    color: var(--texto-suave);
    font-size: 0.875rem;
  }
  .versiculos {
    margin: 1rem 0;
    padding: 0;
    list-style: none;
    font-family: var(--fuente-lectura);
    font-size: 1.125rem;
    line-height: 1.7;
  }
  .versiculos li {
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    scroll-margin-top: 5rem;
  }
  .seleccionado > .texto {
    background: color-mix(in srgb, var(--acento) 12%, transparent);
  }
  .numero {
    display: inline-block;
    min-width: 1.75rem;
    margin-right: 0.25rem;
    font-family: var(--fuente-interfaz);
    font-size: 0.75rem;
    font-weight: 600;
    vertical-align: super;
    text-decoration: none;
  }
  .cargando,
  .fuente {
    color: var(--texto-suave);
    font-size: 0.875rem;
  }
  .ver-en {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    margin: 0.5rem 0 1rem;
    font-size: 0.875rem;
  }
  .ver-en select {
    margin-left: 0.25rem;
    font: inherit;
    color: inherit;
    background: var(--fondo);
    border: 1px solid var(--borde);
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
    max-width: 100%;
  }
  .externas {
    color: var(--texto-suave);
  }
  .separador {
    margin: 0 0.375rem;
  }
  .titulo-rv {
    margin: 0 0 0.75rem;
    font-family: var(--fuente-lectura);
    font-size: 1.125rem;
  }
  .titulo-rv span {
    font-weight: normal;
    color: var(--texto-suave);
  }
  /* En celular, la otra versión va arriba en un bloque con su propio scroll */
  .paralela {
    margin-bottom: 1.5rem;
    padding: 1rem;
    max-height: 60vh;
    overflow-y: auto;
    border: 1px solid var(--borde);
    border-radius: 0.5rem;
  }
  /* En pantallas anchas, dos columnas: RV1909 a la izquierda y la otra versión a la derecha */
  @media (min-width: 1100px) {
    .columnas.con-paralela {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.5rem;
      width: min(88rem, calc(100vw - 2rem));
      position: relative;
      left: 50%;
      transform: translateX(-50%);
    }
    .paralela {
      order: 2;
      position: sticky;
      top: 5rem;
      align-self: start;
      max-height: calc(100vh - 6rem);
      margin: 0;
      padding: 0 0 0 2.5rem;
      border: 0;
      border-left: 1px solid var(--borde);
      border-radius: 0;
    }
  }
</style>
