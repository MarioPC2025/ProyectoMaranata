<script lang="ts">
  import { LIBROS, NOMBRES_GENERO, type Genero, type Libro } from '../lib/biblia/libros'

  const grupos = Object.entries(
    LIBROS.reduce<Partial<Record<Genero, Libro[]>>>((g, l) => {
      ;(g[l.genero] ??= []).push(l)
      return g
    }, {}),
  ) as [Genero, Libro[]][]
</script>

<section>
  <h1>Referencias cruzadas de la Biblia</h1>
  <p class="intro">
    Más de 340.000 conexiones entre versículos. Elegí un libro o buscá un pasaje para ver con qué
    otros textos se relaciona.
  </p>

  {#each grupos as [genero, libros] (genero)}
    <h2>{NOMBRES_GENERO[genero]}</h2>
    <ul class="libros">
      {#each libros as l (l.id)}
        <li><a href={`/${l.slug}/1`} data-genero={l.genero}>{l.nombre}</a></li>
      {/each}
    </ul>
  {/each}
</section>

<style>
  .intro {
    color: var(--texto-suave);
  }
  h2 {
    margin: 1.5rem 0 0.5rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--texto-suave);
  }
  .libros {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: 0.375rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .libros a {
    display: block;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--borde);
    border-radius: 0.5rem;
    color: var(--texto);
    text-decoration: none;
  }
  .libros a:hover {
    border-color: var(--acento);
  }
</style>
