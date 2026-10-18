<script lang="ts">
  // Vista general: todos los versículos en una línea y las referencias cruzadas como arcos.
  import { onMount } from 'svelte'
  import type { Indice } from '../lib/biblia/indice'
  import { GENEROS, LIBROS } from '../lib/biblia/libros'
  import { formatear, ruta } from '../lib/biblia/referencia'
  import { cargarIndice, cargarLibroRV1909, cargarReferencias } from '../lib/datos/cargar'
  import type { Referencias } from '../lib/datos/xrefs'
  import { navegar } from '../lib/navegacion.svelte'
  import { RendererArcos } from '../lib/viz/arcos'
  import { alCambiarTema, temaActual, type Tema } from '../lib/viz/colores'
  import {
    VERSICULOS_POR_PIXEL_CAPITULO,
    centrarEn,
    conAncho,
    crearEscala,
    densidad,
    desplazar,
    verTodo,
    versiculoAX,
    xAVersiculo,
    zoomEn,
    type Escala,
  } from '../lib/viz/escala'
  import type { Lienzo } from '../lib/viz/geometria'
  import {
    cantidadConVotos,
    construirArcos,
    librosPorVersiculo,
    type Arcos,
  } from '../lib/viz/instancias'
  import {
    dibujarArcos2D,
    dibujarBase,
    prepararCanvas,
    recorrerArcos,
    type ArcoSimple,
  } from '../lib/viz/resaltado'
  import TextoVersiculo from './TextoVersiculo.svelte'

  type Foco = { tipo: 'versiculo' | 'capitulo'; numero: number }

  const ALTO_ETIQUETAS = 22
  const MAX_ARCOS_2D = 20000
  const tactil = matchMedia('(pointer: coarse)').matches
  const OPCIONES_VOTOS = [
    { valor: -32768, texto: 'Todas' },
    { valor: 5, texto: 'Con 5 votos o más' },
    { valor: 10, texto: 'Con 10 votos o más' },
    { valor: 20, texto: 'Con 20 votos o más' },
  ]

  let contenedor: HTMLDivElement
  let canvasGL: HTMLCanvasElement
  let canvas2D: HTMLCanvasElement

  let ancho = $state(0)
  let alto = $state(0)
  let escala = $state<Escala>(crearEscala(31102, 1))
  let tema = $state<Tema>(temaActual())
  let minimoVotos = $state(tactil ? 5 : -32768)
  let indice = $state.raw<Indice>()
  let referencias = $state.raw<Referencias>()
  let arcos = $state.raw<Arcos>()
  let foco = $state<Foco | null>(null)
  /** true si el foco lo fijó un toque o el teclado (no se pierde al mover el mouse) */
  let fijado = $state(false)
  let sinWebGL = $state(false)
  let error = $state('')
  let renderer: RendererArcos | undefined

  const lienzo = $derived<Lienzo>({
    ancho,
    base: alto - ALTO_ETIQUETAS - 8,
    altoMax: Math.max(10, alto - ALTO_ETIQUETAS - 16),
  })
  const cantidad = $derived(arcos ? cantidadConVotos(arcos, minimoVotos) : 0)
  const libros = $derived(indice ? librosPorVersiculo(indice) : undefined)
  const generoDeLibro = LIBROS.map((l) => GENEROS.indexOf(l.genero))

  onMount(() => {
    try {
      if (!RendererArcos.soportado()) throw new Error('sin WebGL2')
      renderer = new RendererArcos(canvasGL, tactil ? 16 : 24, dibujarGL)
    } catch {
      sinWebGL = true
    }

    Promise.all([cargarIndice(), cargarReferencias()]).then(([i, r]) => {
      indice = i
      referencias = r
      escala = conAncho(crearEscala(i.total, ancho || 1), ancho || 1)
      arcos = construirArcos(r, i)
      renderer?.cargar(arcos)
    }, (e) => (error = e instanceof Error ? e.message : String(e)))

    const observador = new ResizeObserver(([entrada]) => {
      ancho = entrada.contentRect.width
      alto = entrada.contentRect.height
      const dpr = Math.min(2, devicePixelRatio || 1)
      for (const c of [canvasGL, canvas2D]) {
        c.width = Math.round(ancho * dpr)
        c.height = Math.round(alto * dpr)
      }
      escala = conAncho(escala, ancho)
    })
    observador.observe(contenedor)

    const dejarDeEscuchar = alCambiarTema((t) => (tema = t))

    return () => {
      observador.disconnect()
      dejarDeEscuchar()
      renderer?.destruir()
    }
  })

  // --- Dibujo (solo cuando cambia algo, una vez por cuadro) ---

  let pendienteGL = 0
  function dibujarGL() {
    cancelAnimationFrame(pendienteGL)
    pendienteGL = requestAnimationFrame(() => {
      renderer?.dibujar({ escala, lienzo, alto, cantidad, tema })
    })
  }

  $effect(() => {
    void [escala, lienzo, cantidad, tema, arcos]
    if (renderer && ancho > 0) dibujarGL()
  })

  let pendiente2D = 0
  $effect(() => {
    void [escala, lienzo, tema, foco, cantidad, arcos]
    if (!indice || ancho <= 0) return
    cancelAnimationFrame(pendiente2D)
    pendiente2D = requestAnimationFrame(dibujar2D)
  })

  function dibujar2D() {
    if (!indice) return
    const ctx = prepararCanvas(canvas2D, ancho)
    if (sinWebGL && arcos) {
      dibujarArcos2D(ctx, escala, recorrerArcos(arcos, Math.min(cantidad, MAX_ARCOS_2D)), lienzo, tema, {
        alfa: 0.08,
        grosor: 1,
      })
    }
    dibujarBase(ctx, escala, indice, lienzo, tema)
    if (foco) {
      const resaltados = arcosDelFoco(foco)
      if (resaltados.length) {
        // Un capítulo puede tener cientos de referencias: cuantas más, más transparentes
        const alfa = Math.min(0.9, Math.max(0.4, 60 / resaltados.length))
        dibujarArcos2D(ctx, escala, resaltados, lienzo, tema, { alfa, grosor: 1.5 })
      }
      const [desde, hasta] = rangoDelFoco(foco)
      const x0 = versiculoAX(escala, desde) - 0.5 / densidad(escala)
      const x1 = versiculoAX(escala, hasta - 1) + 0.5 / densidad(escala)
      ctx.fillStyle = tema === 'oscuro' ? '#ffffff' : '#000000'
      ctx.fillRect(x0, lienzo.base - 2, Math.max(2, x1 - x0), ALTO_ETIQUETAS / 2 + 4)
    }
  }

  /** [primer versículo, último + 1] del foco */
  function rangoDelFoco(f: Foco): [number, number] {
    if (f.tipo === 'versiculo') return [f.numero, f.numero + 1]
    return [indice!.inicioCapitulo[f.numero], indice!.inicioCapitulo[f.numero + 1]]
  }

  function arcosDelFoco(f: Foco): ArcoSimple[] {
    if (!referencias || !libros) return []
    const [desde, hasta] = rangoDelFoco(f)
    const lista: ArcoSimple[] = []
    for (let v = desde; v < hasta; v++) {
      for (let i = referencias.desp[v]; i < referencias.desp[v + 1]; i++) {
        const b = referencias.inicio[i]
        lista.push({ a: v, b, genero: generoDeLibro[libros[b] - 1] })
      }
    }
    return lista
  }

  function cantidadReferencias(f: Foco): number {
    if (!referencias) return 0
    const [desde, hasta] = rangoDelFoco(f)
    return referencias.desp[hasta] - referencias.desp[desde]
  }

  // --- Foco y navegación ---

  function focoEn(x: number): Foco | null {
    if (!indice) return null
    const v = xAVersiculo(escala, x)
    return densidad(escala) > VERSICULOS_POR_PIXEL_CAPITULO
      ? { tipo: 'capitulo', numero: indice.capituloDe(v) }
      : { tipo: 'versiculo', numero: v }
  }

  function rutaDe(f: Foco): string {
    if (f.tipo === 'capitulo') return ruta(indice!.capituloEnLibro(f.numero))
    return ruta(indice!.posicion(f.numero))
  }

  function nombreDe(f: Foco): string {
    if (f.tipo === 'capitulo') return formatear(indice!.capituloEnLibro(f.numero))
    return formatear(indice!.posicion(f.numero))
  }

  async function textoDe(numero: number): Promise<string> {
    const p = indice!.posicion(numero)
    const libro = await cargarLibroRV1909(p.libro)
    return libro[p.capitulo - 1][p.versiculo - 1]
  }

  /** Mueve el foco una unidad (versículo o capítulo según el zoom) y lo mantiene a la vista */
  function moverFoco(delta: number) {
    if (!indice) return
    const tipo = densidad(escala) > VERSICULOS_POR_PIXEL_CAPITULO ? 'capitulo' : 'versiculo'
    const maximo = tipo === 'capitulo' ? indice.inicioCapitulo.length - 2 : indice.total - 1
    let actual: number
    if (foco && foco.tipo === tipo) actual = foco.numero + delta
    else if (foco) {
      // Cambió la granularidad: se pasa de versículo a capítulo o al revés
      const v = foco.tipo === 'versiculo' ? foco.numero : indice.inicioCapitulo[foco.numero]
      actual = tipo === 'capitulo' ? indice.capituloDe(v) : v
    } else {
      const v = xAVersiculo(escala, ancho / 2)
      actual = tipo === 'capitulo' ? indice.capituloDe(v) : v
    }
    foco = { tipo, numero: Math.min(maximo, Math.max(0, actual)) }
    fijado = true
    const [desde] = rangoDelFoco(foco)
    const x = versiculoAX(escala, desde)
    if (x < 0 || x > ancho) escala = centrarEn(escala, desde)
  }

  // --- Puntero: hover, clic, arrastre y pellizco ---

  // No necesita ser reactivo: solo lo leen los manejadores de eventos
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const punteros = new Map<number, number>()
  let ultimoX = 0
  let recorrido = 0
  let distanciaPrevia = 0

  function xLocal(e: PointerEvent | WheelEvent | MouseEvent): number {
    return e.clientX - contenedor.getBoundingClientRect().left
  }

  function alPresionar(e: PointerEvent) {
    contenedor.setPointerCapture(e.pointerId)
    punteros.set(e.pointerId, xLocal(e))
    ultimoX = xLocal(e)
    recorrido = 0
    if (punteros.size === 2) {
      const [a, b] = [...punteros.values()]
      distanciaPrevia = Math.abs(a - b)
    }
  }

  function alMover(e: PointerEvent) {
    const x = xLocal(e)
    if (!punteros.has(e.pointerId)) {
      if (e.pointerType === 'mouse' && !fijado) foco = focoEn(x)
      return
    }
    punteros.set(e.pointerId, x)
    if (punteros.size === 1) {
      const dx = x - ultimoX
      recorrido += Math.abs(dx)
      ultimoX = x
      if (recorrido > 4) escala = desplazar(escala, dx)
    } else if (punteros.size === 2) {
      const [a, b] = [...punteros.values()]
      const distancia = Math.abs(a - b)
      if (distanciaPrevia > 10 && distancia > 10) {
        escala = zoomEn(escala, (a + b) / 2, distancia / distanciaPrevia)
      }
      distanciaPrevia = distancia
      recorrido = Infinity
    }
  }

  function alSoltar(e: PointerEvent) {
    const eraUnico = punteros.size === 1
    punteros.delete(e.pointerId)
    if (!eraUnico || recorrido > 4) return
    const f = focoEn(xLocal(e))
    if (!f) return
    if (e.pointerType === 'mouse') {
      navegar(rutaDe(f))
    } else {
      foco = f
      fijado = true
    }
  }

  function alSalir(e: PointerEvent) {
    if (e.pointerType === 'mouse' && !fijado && punteros.size === 0) foco = null
  }

  function alRueda(e: WheelEvent) {
    e.preventDefault()
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      escala = desplazar(escala, -e.deltaX)
    } else {
      escala = zoomEn(escala, xLocal(e), Math.exp(-e.deltaY * 0.0015))
    }
  }

  function alTecla(e: KeyboardEvent) {
    const acciones: Record<string, () => void> = {
      ArrowRight: () => moverFoco(1),
      ArrowLeft: () => moverFoco(-1),
      '+': () => (escala = zoomEn(escala, ancho / 2, 1.5)),
      '=': () => (escala = zoomEn(escala, ancho / 2, 1.5)),
      '-': () => (escala = zoomEn(escala, ancho / 2, 1 / 1.5)),
      Home: () => (escala = verTodo(escala)),
      Enter: () => foco && navegar(rutaDe(foco)),
      Escape: () => {
        foco = null
        fijado = false
      },
    }
    const accion = acciones[e.key]
    if (accion) {
      e.preventDefault()
      accion()
    }
  }

  function zoomBoton(factor: number) {
    const x = foco ? versiculoAX(escala, rangoDelFoco(foco)[0]) : ancho / 2
    escala = zoomEn(escala, Math.min(ancho, Math.max(0, x)), factor)
  }

  // --- Etiquetas de los libros ---

  const etiquetas = $derived.by(() => {
    if (!indice || ancho <= 0) return []
    const d = densidad(escala)
    return LIBROS.flatMap((l) => {
      const x0 = (indice!.inicioCapitulo[indice!.primerCapitulo[l.id - 1]] - escala.desde) / d
      const x1 = (indice!.inicioCapitulo[indice!.primerCapitulo[l.id]] - escala.desde) / d
      const visible0 = Math.max(0, x0)
      const visible1 = Math.min(ancho, x1)
      const espacio = visible1 - visible0
      if (espacio < 22) return []
      return [{ id: l.id, texto: espacio > 90 ? l.nombre : l.abreviatura, x: (visible0 + visible1) / 2 }]
    })
  })

  const posicionTooltip = $derived.by(() => {
    if (!foco || !indice) return 0
    const [desde, hasta] = rangoDelFoco(foco)
    const x = (versiculoAX(escala, desde) + versiculoAX(escala, hasta - 1)) / 2
    return Math.min(Math.max(x, 8), Math.max(8, ancho - 8))
  })
</script>

<section class="vista-general" aria-label="Mapa de referencias cruzadas">
  <div class="controles">
    <p class="resumen">
      {#if arcos}
        {cantidad.toLocaleString('es')} conexiones
      {:else if !error}
        Cargando referencias…
      {/if}
    </p>
    <label>
      Mostrar
      <select bind:value={minimoVotos}>
        {#each OPCIONES_VOTOS as o (o.valor)}
          <option value={o.valor}>{o.texto}</option>
        {/each}
      </select>
    </label>
    <div class="zoom" role="group" aria-label="Zoom">
      <button type="button" onclick={() => zoomBoton(1 / 2)} aria-label="Alejar">−</button>
      <button type="button" onclick={() => zoomBoton(2)} aria-label="Acercar">+</button>
      <button type="button" onclick={() => (escala = verTodo(escala))}>Ver todo</button>
    </div>
  </div>

  <!-- Lienzo interactivo (role="application"): maneja puntero y teclado por su cuenta -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    class="lienzo"
    bind:this={contenedor}
    tabindex="0"
    role="application"
    aria-label="Todos los versículos de Génesis a Apocalipsis en una línea, con sus referencias como arcos. Flechas izquierda y derecha para recorrer, más y menos para acercar, Enter para abrir."
    aria-describedby="vista-foco"
    onpointerdown={alPresionar}
    onpointermove={alMover}
    onpointerup={alSoltar}
    onpointercancel={(e) => punteros.delete(e.pointerId)}
    onpointerleave={alSalir}
    onwheel={alRueda}
    ondblclick={(e) => (escala = zoomEn(escala, xLocal(e), 3))}
    onkeydown={alTecla}
  >
    <canvas bind:this={canvasGL} class:atenuado={!!foco} aria-hidden="true"></canvas>
    <canvas bind:this={canvas2D} aria-hidden="true"></canvas>

    <div class="etiquetas" aria-hidden="true">
      {#each etiquetas as et (et.id)}
        <span style:left={`${et.x}px`}>{et.texto}</span>
      {/each}
    </div>

    {#if foco && indice}
      <!-- Solo frena los eventos para que el link "Abrir" no dispare la selección del lienzo -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="tooltip"
        class:derecha={posicionTooltip > ancho / 2}
        class:fijado
        style:--x={`${posicionTooltip}px`}
        onpointerdown={(e) => e.stopPropagation()}
        onpointerup={(e) => e.stopPropagation()}
      >
        <strong>{nombreDe(foco)}</strong>
        <span class="cuenta">
          {cantidadReferencias(foco).toLocaleString('es')}
          {cantidadReferencias(foco) === 1 ? 'referencia' : 'referencias'}
        </span>
        {#if foco.tipo === 'versiculo'}
          {#await textoDe(foco.numero) then texto}
            <p><TextoVersiculo {texto} /></p>
          {/await}
        {/if}
        {#if fijado}
          <a href={rutaDe(foco)}>Abrir {nombreDe(foco)}</a>
        {/if}
      </div>
    {/if}

    {#if error}
      <p class="mensaje" role="alert">No se pudieron cargar las referencias: {error}</p>
    {:else if sinWebGL && arcos}
      <p class="mensaje aviso">
        Tu navegador no tiene WebGL2: se muestran solo las {MAX_ARCOS_2D.toLocaleString('es')} conexiones
        más votadas.
      </p>
    {/if}
  </div>

  <p id="vista-foco" class="oculto" aria-live="polite">
    {#if foco && indice}
      {nombreDe(foco)}: {cantidadReferencias(foco)} referencias.
    {/if}
  </p>
  <p class="ayuda">
    {tactil
      ? 'Tocá para ver un pasaje, arrastrá para moverte y pellizcá para acercar.'
      : 'Pasá el mouse para ver un pasaje y hacé clic para abrirlo. Rueda para acercar, arrastrá para moverte.'}
  </p>
</section>

<style>
  .vista-general {
    margin: 0 -1rem 1.5rem;
  }
  .controles {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    padding: 0 1rem 0.5rem;
    font-size: 0.875rem;
  }
  .resumen {
    margin: 0;
    margin-right: auto;
    color: var(--texto-suave);
  }
  select,
  button {
    font: inherit;
    color: inherit;
    background: var(--fondo);
    border: 1px solid var(--borde);
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
  }
  button {
    cursor: pointer;
    min-width: 2rem;
  }
  .zoom {
    display: flex;
    gap: 0.25rem;
  }
  .lienzo {
    position: relative;
    /* En pantallas angostas el alto acompaña al ancho, para que los arcos no queden finitos */
    height: clamp(220px, min(55vh, 60vw + 60px), 520px);
    overflow: hidden;
    touch-action: none;
    cursor: crosshair;
    user-select: none;
  }
  .lienzo:focus-visible {
    outline-offset: -2px;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transition: opacity 0.15s;
  }
  /* Con un pasaje enfocado, el resto de los arcos pasa a segundo plano */
  canvas.atenuado {
    opacity: 0.12;
  }
  .etiquetas {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 22px;
    font-size: 0.6875rem;
    color: var(--texto-suave);
    pointer-events: none;
  }
  .etiquetas span {
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .tooltip {
    position: absolute;
    top: 0.5rem;
    left: var(--x);
    max-width: min(22rem, calc(100% - 1rem));
    padding: 0.5rem 0.75rem;
    background: color-mix(in srgb, var(--fondo) 92%, transparent);
    border: 1px solid var(--borde);
    border-radius: 0.5rem;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
    font-size: 0.875rem;
    transform: translateX(-10%);
    pointer-events: none;
  }
  .tooltip.fijado {
    pointer-events: auto;
  }
  .tooltip.derecha {
    transform: translateX(-90%);
  }
  .tooltip p {
    margin: 0.375rem 0 0;
    font-family: var(--fuente-lectura);
    font-size: 0.9375rem;
  }
  .tooltip a {
    display: inline-block;
    margin-top: 0.5rem;
    font-weight: 600;
  }
  .cuenta {
    margin-left: 0.5rem;
    white-space: nowrap;
    color: var(--texto-suave);
  }
  .mensaje {
    position: absolute;
    left: 1rem;
    bottom: 2rem;
    margin: 0;
    font-size: 0.8125rem;
    color: var(--texto-suave);
  }
  .ayuda {
    margin: 0.5rem 1rem 0;
    font-size: 0.8125rem;
    color: var(--texto-suave);
  }
</style>
