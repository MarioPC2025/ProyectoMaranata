import type { CapacitorConfig } from '@capacitor/cli';

/**
 * La app de Android: el mismo sitio (`dist/`) empaquetado con Capacitor. El id es el dominio al
 * revés y no se puede cambiar después de publicar en Google Play.
 */
const config: CapacitorConfig = {
  appId: 'ar.org.proyectomaranata.app',
  appName: 'Maranata',
  webDir: 'dist',
  android: {
    // El tema de trekhleb es oscuro: así no se ve un destello blanco al abrir.
    backgroundColor: '#121417',
  },
};

export default config;
