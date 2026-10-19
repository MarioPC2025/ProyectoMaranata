// Íconos y pantalla de inicio de la app de Android, a partir de public/icono.svg (`npm run
// android:iconos`). Los dibuja Chromium, el de Playwright, así no hace falta otra dependencia.
//
// - ic_launcher / ic_launcher_round: el ícono entero, para Android 7 y anteriores.
// - ic_launcher_foreground: solo el dibujo, para el ícono adaptable (Android 8 en adelante), que
//   pone el fondo y recorta la forma: el dibujo va dentro de la zona segura (66 de 108 dp).
// - splash: el ícono en el centro, sobre el fondo oscuro del sitio.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { ROOT_DIR } from '../vite/site.ts';

const RES = join(ROOT_DIR, 'android', 'app', 'src', 'main', 'res');
const FONDO = '#121417';
const SVG = readFileSync(join(ROOT_DIR, 'public', 'icono.svg'), 'utf8');
/** El dibujo sin el cuadrado de fondo, para el ícono adaptable. */
const DIBUJO = SVG.replace(/<rect width="512" height="512"[^>]*\/>/, '');

const DENSIDADES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 } as const;

/** Ancho y alto de un PNG, leídos de su cabecera. */
function tamano(ruta: string): { ancho: number; alto: number } {
  const png = readFileSync(ruta);
  return { ancho: png.readUInt32BE(16), alto: png.readUInt32BE(20) };
}

const browser = await chromium.launch();
const page = await browser.newPage();

async function dibujar(
  ruta: string,
  ancho: number,
  alto: number,
  svg: string,
  { fondo = 'transparent', lado = Math.min(ancho, alto), redondo = false } = {},
): Promise<void> {
  await page.setViewportSize({ width: ancho, height: alto });
  await page.setContent(
    `<body style="margin:0;width:${String(ancho)}px;height:${String(alto)}px;display:grid;` +
      `place-items:center;background:${fondo}">` +
      `<div style="width:${String(lado)}px;height:${String(lado)}px;` +
      `${redondo ? 'border-radius:50%;overflow:hidden;' : ''}">` +
      svg.replace('<svg ', '<svg width="100%" height="100%" ') +
      '</div></body>',
  );
  writeFileSync(ruta, await page.screenshot({ omitBackground: fondo === 'transparent' }));
}

for (const [densidad, escala] of Object.entries(DENSIDADES)) {
  const carpeta = join(RES, `mipmap-${densidad}`);
  const icono = 48 * escala;
  await dibujar(join(carpeta, 'ic_launcher.png'), icono, icono, SVG);
  // El redondo es el mismo cuadrado recortado en círculo.
  await dibujar(join(carpeta, 'ic_launcher_round.png'), icono, icono, SVG, { redondo: true });
  const frente = 108 * escala;
  await dibujar(join(carpeta, 'ic_launcher_foreground.png'), frente, frente, DIBUJO, {
    lado: Math.round(frente * (66 / 108)),
  });
}

// La pantalla de inicio: se respetan los tamaños que trae la plantilla de Capacitor.
for (const carpeta of readdirSync(RES).filter((nombre) => nombre.startsWith('drawable'))) {
  const ruta = join(RES, carpeta, 'splash.png');
  try {
    const { ancho, alto } = tamano(ruta);
    await dibujar(ruta, ancho, alto, SVG, {
      fondo: FONDO,
      lado: Math.round(Math.min(ancho, alto) * 0.4),
    });
  } catch {
    // Esa carpeta no tiene pantalla de inicio.
  }
}

await browser.close();

writeFileSync(
  join(RES, 'values', 'ic_launcher_background.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n' +
    `    <color name="ic_launcher_background">${FONDO}</color>\n</resources>\n`,
);
console.log('Íconos y pantalla de inicio de Android generados.');
