// Pestaña elegida en el panel del versículo; se mantiene al pasar de un versículo a otro.
export type Pestana = 'referencias' | 'original'

export const panel = $state<{ pestana: Pestana }>({ pestana: 'referencias' })
