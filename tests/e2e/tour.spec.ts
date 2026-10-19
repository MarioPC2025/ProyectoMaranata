import { expect, test } from '@playwright/test';
import { ACTIVE, waitForApp } from './helpers.ts';

// Como alguien que entra por primera vez: sin la marca de "ya visto" que tienen las demás pruebas.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('el recorrido por la app', () => {
  test('se abre solo la primera vez, se puede saltar y volver a abrir', async ({ page }) => {
    await page.goto('./');
    await waitForApp(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Bienvenido a Maranata');
    await dialog.getByRole('button', { name: 'Empezar' }).click();
    await expect(dialog).toContainText('Las referencias cruzadas');
    await dialog.getByRole('button', { name: 'Saltar' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await waitForApp(page);
    await page.waitForTimeout(1500);
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.locator(ACTIVE).getByRole('button', { name: 'Ver el recorrido por la app' }).click();
    await expect(page.getByRole('dialog')).toContainText('Bienvenido a Maranata');
  });

  test('no tapa un pasaje compartido', async ({ page }) => {
    await page.goto('./?ref=John.3.16');
    await waitForApp(page);
    await page.waitForTimeout(1500);
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
