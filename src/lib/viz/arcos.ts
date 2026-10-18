// Renderer WebGL2 de la vista general: dibuja cientos de miles de arcos con instancing.
// Cada arco es una instancia; la media elipse se calcula en el vertex shader
// (misma fórmula que alturaArco() en geometria.ts).
//
// Con 300k arcos en unos cientos de píxeles, la mezcla común en 8 bits satura o, con alfa muy
// bajo, redondea a cero. Por eso, si el navegador lo permite, se dibuja en dos pasadas:
// 1. Se acumula en una textura de punto flotante la suma de colores y la cantidad de arcos.
// 2. Se compone en pantalla el color promedio, con una intensidad que crece con la densidad.

import { densidad, type Escala } from './escala'
import type { Lienzo } from './geometria'
import { FLOATS_POR_ARCO, type Arcos } from './instancias'
import { paletaRGB, type Tema } from './colores'

const VERTEX_ARCOS = `#version 300 es
in float a_t;
in vec4 a_arco; // izquierda, derecha, género, votos
uniform float u_desde;
uniform float u_densidad;
uniform vec3 u_lienzo; // ancho, base, altoMax (píxeles CSS)
uniform float u_alto;  // alto del canvas en píxeles CSS
uniform vec3 u_paleta[10];
out vec3 v_color;

void main() {
  float x0 = (a_arco.x + 0.5 - u_desde) / u_densidad;
  float x1 = (a_arco.y + 0.5 - u_desde) / u_densidad;
  v_color = u_paleta[int(a_arco.z)];
  if (x1 < 0.0 || x0 > u_lienzo.x) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // fuera de la vista: se descarta
    return;
  }
  float radio = (x1 - x0) * 0.5;
  float alto = u_lienzo.z * min(1.0, 2.0 * radio / u_lienzo.x);
  float ang = 3.14159265 * a_t;
  float x = (x0 + x1) * 0.5 - radio * cos(ang);
  float y = u_lienzo.y - alto * sin(ang);
  gl_Position = vec4(x / u_lienzo.x * 2.0 - 1.0, 1.0 - y / u_alto * 2.0, 0.0, 1.0);
}`

// Con u_alfa = 1 acumula (color, 1) por arco; en el modo de respaldo es alfa premultiplicado.
const FRAGMENT_ARCOS = `#version 300 es
precision mediump float;
in vec3 v_color;
uniform float u_alfa;
out vec4 color;
void main() {
  color = vec4(v_color * u_alfa, u_alfa);
}`

// Triángulo que cubre la pantalla
const VERTEX_PANTALLA = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAGMENT_COMPONER = `#version 300 es
precision highp float;
uniform sampler2D u_acumulado;
uniform float u_ganancia;
out vec4 color;
void main() {
  vec4 a = texelFetch(u_acumulado, ivec2(gl_FragCoord.xy), 0);
  if (a.a <= 0.0) discard;
  vec3 promedio = a.rgb / a.a;
  float intensidad = 1.0 - exp(-a.a * u_ganancia);
  color = vec4(promedio * intensidad, intensidad);
}`

export interface ParametrosDibujo {
  escala: Escala
  lienzo: Lienzo
  /** Alto del canvas en píxeles CSS */
  alto: number
  /** Cuántos arcos dibujar (los primeros, ordenados por votos) */
  cantidad: number
  tema: Tema
}

function compilar(gl: WebGL2RenderingContext, tipo: number, fuente: string): WebGLShader {
  const s = gl.createShader(tipo)!
  gl.shaderSource(s, fuente)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(`Shader: ${gl.getShaderInfoLog(s)}`)
  }
  return s
}

function programa(gl: WebGL2RenderingContext, vertex: string, fragment: string): WebGLProgram {
  const p = gl.createProgram()!
  gl.attachShader(p, compilar(gl, gl.VERTEX_SHADER, vertex))
  gl.attachShader(p, compilar(gl, gl.FRAGMENT_SHADER, fragment))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(`Programa: ${gl.getProgramInfoLog(p)}`)
  }
  return p
}

export class RendererArcos {
  private gl: WebGL2RenderingContext
  private progArcos!: WebGLProgram
  private progComponer!: WebGLProgram
  private vao!: WebGLVertexArrayObject
  private u: Record<string, WebGLUniformLocation | null> = {}
  private arcos?: Arcos
  private perdido = false
  /** Textura de acumulación (null si no hay render a punto flotante) */
  private acumulado: { textura: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number } | null =
    null
  private flotante = false

  static soportado(): boolean {
    try {
      return !!document.createElement('canvas').getContext('webgl2')
    } catch {
      return false
    }
  }

  constructor(
    private canvas: HTMLCanvasElement,
    private segmentos: number,
    alRestaurar: () => void,
  ) {
    const gl = canvas.getContext('webgl2', { antialias: true })
    if (!gl) throw new Error('WebGL2 no disponible')
    this.gl = gl
    canvas.addEventListener('webglcontextlost', this.alPerder)
    canvas.addEventListener('webglcontextrestored', () => {
      this.perdido = false
      this.acumulado = null
      this.iniciar()
      if (this.arcos) this.cargar(this.arcos)
      alRestaurar()
    })
    this.iniciar()
  }

  private alPerder = (e: Event) => {
    e.preventDefault()
    this.perdido = true
  }

  private iniciar() {
    const gl = this.gl
    this.flotante = !!gl.getExtension('EXT_color_buffer_float')
    this.progArcos = programa(gl, VERTEX_ARCOS, FRAGMENT_ARCOS)
    this.progComponer = programa(gl, VERTEX_PANTALLA, FRAGMENT_COMPONER)
    for (const n of ['u_desde', 'u_densidad', 'u_lienzo', 'u_alto', 'u_paleta', 'u_alfa']) {
      this.u[n] = gl.getUniformLocation(this.progArcos, n)
    }
    for (const n of ['u_acumulado', 'u_ganancia']) {
      this.u[n] = gl.getUniformLocation(this.progComponer, n)
    }

    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)
    // t ∈ [0, 1] a lo largo de cada arco
    const t = new Float32Array(this.segmentos + 1).map((_, i) => i / this.segmentos)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, t, gl.STATIC_DRAW)
    const locT = gl.getAttribLocation(this.progArcos, 'a_t')
    gl.enableVertexAttribArray(locT)
    gl.vertexAttribPointer(locT, 1, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)
  }

  /** Crea (o recrea si cambió el tamaño) la textura de acumulación. false si no se puede. */
  private prepararAcumulado(w: number, h: number): boolean {
    if (!this.flotante) return false
    if (this.acumulado && this.acumulado.w === w && this.acumulado.h === h) return true
    const gl = this.gl
    if (this.acumulado) {
      gl.deleteTexture(this.acumulado.textura)
      gl.deleteFramebuffer(this.acumulado.fbo)
    }
    const textura = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, textura)
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, w, h)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textura, 0)
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    if (!ok) {
      gl.deleteTexture(textura)
      gl.deleteFramebuffer(fbo)
      this.flotante = false
      this.acumulado = null
      return false
    }
    this.acumulado = { textura, fbo, w, h }
    return true
  }

  cargar(arcos: Arcos) {
    this.arcos = arcos
    if (this.perdido) return
    const gl = this.gl
    gl.bindVertexArray(this.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, arcos.datos, gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(this.progArcos, 'a_arco')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, FLOATS_POR_ARCO * 4, 0)
    gl.vertexAttribDivisor(loc, 1)
    gl.bindVertexArray(null)
  }

  dibujar(p: ParametrosDibujo) {
    if (this.perdido) return
    const gl = this.gl
    const { width: w, height: h } = this.canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (!this.arcos || p.cantidad <= 0 || w === 0 || h === 0) return

    const cantidad = Math.min(p.cantidad, this.arcos.cantidad)
    const acumular = this.prepararAcumulado(w, h)

    gl.useProgram(this.progArcos)
    gl.uniform1f(this.u.u_desde, p.escala.desde)
    gl.uniform1f(this.u.u_densidad, densidad(p.escala))
    gl.uniform3f(this.u.u_lienzo, p.lienzo.ancho, p.lienzo.base, p.lienzo.altoMax)
    gl.uniform1f(this.u.u_alto, p.alto)
    gl.uniform3fv(this.u.u_paleta, paletaRGB(p.tema))
    gl.enable(gl.BLEND)

    if (acumular) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.acumulado!.fbo)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(this.u.u_alfa, 1)
      gl.blendFunc(gl.ONE, gl.ONE)
    } else {
      // Respaldo en 8 bits: alfa bajo según cuántos arcos se superponen por píxel
      const porPixel = cantidad / (p.lienzo.ancho * Math.sqrt(p.escala.zoom))
      gl.uniform1f(this.u.u_alfa, Math.min(0.6, Math.max(0.004, 1.5 / porPixel)))
      gl.blendFunc(gl.ONE, p.tema === 'oscuro' ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA)
    }
    gl.bindVertexArray(this.vao)
    gl.drawArraysInstanced(gl.LINE_STRIP, 0, this.segmentos + 1, cantidad)
    gl.bindVertexArray(null)

    if (acumular) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.useProgram(this.progComponer)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.acumulado!.textura)
      gl.uniform1i(this.u.u_acumulado, 0)
      gl.uniform1f(this.u.u_ganancia, p.tema === 'oscuro' ? 0.015 : 0.01)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
  }

  destruir() {
    this.canvas.removeEventListener('webglcontextlost', this.alPerder)
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
