// GET /api/ntv/:libro/:capitulo (por ejemplo /api/ntv/JHN/3). La lógica está en servidor/ntv.ts.
import { obtenerCapitulo, type Entorno } from '../../../../servidor/ntv'

export const onRequestGet: PagesFunction<Entorno> = ({ params, env }) =>
  obtenerCapitulo(String(params.libro), Number(params.capitulo), env)
