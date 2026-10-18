// Versiones bíblicas que se muestran desde una API (con copyright, nunca guardadas en el repo).
// El texto se muestra tal cual llega: sin reestructurar ni agregarle nada (regla legal 2).

export interface TextoVersion {
  /** HTML del capítulo tal como lo devuelve la API */
  html: string
  /** Copyright o atribución, siempre visible junto al texto */
  atribucion: string
  /** Hojas de estilo que pide la API para mostrar su HTML */
  estilos?: string[]
  /** Atributos que la API pide poner en el contenedor del HTML */
  atributosContenedor?: Record<string, string>
  /** Link al pasaje en el sitio de la versión */
  enlace?: string
  /** Se llama una vez que el texto está en pantalla (por ejemplo, para FUMS) */
  alMostrar?: () => void
}

export interface ProveedorVersion {
  id: string
  abreviatura: string
  nombre: string
  /** false si falta la configuración (clave) para usarla */
  configurada: boolean
  obtener(usfmLibro: string, capitulo: number): Promise<TextoVersion>
}

/** La versión no se puede usar (sin acceso, límite alcanzado, sin clave): se saca del selector. */
export class VersionNoDisponible extends Error {}
