/**
 * Si la página corre dentro de la app de Android (Capacitor) y no en un navegador. Capacitor
 * inyecta `window.Capacitor` antes de que cargue la página, así que basta con mirarlo: no hace
 * falta sumar su paquete al sitio.
 */
export function isNativeApp(): boolean {
  const { Capacitor } = window as { Capacitor?: { isNativePlatform?: () => boolean } };
  return Capacitor?.isNativePlatform?.() === true;
}
