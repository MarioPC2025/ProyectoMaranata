// GET /api/ntv/:libro/:capitulo (por ejemplo /api/ntv/JHN/3). La lógica está en servidor/ntv.ts.
import { conCors, obtenerCapitulo, type Entorno } from '../../../../servidor/ntv';

export const onRequestGet: PagesFunction<Entorno> = async ({ params, env, request }) =>
  conCors(
    await obtenerCapitulo(String(params.libro), Number(params.capitulo), env),
    request.headers.get('Origin'),
  );
