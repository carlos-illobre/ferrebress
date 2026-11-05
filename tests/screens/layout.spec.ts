// Lo que solo se puede comprobar en un navegador de verdad (00 · E04, E19): que nada se desplace
// hacia el costado en los anchos de siempre, y que en lo angosto se usen los textos cortos. Con
// sesión, el marco; sin sesión, la entrada.
import { expect, type Page, test } from '@playwright/test';
import { administrator } from './person.ts';

const person = { userId: 'u1', name: 'Ana Gómez', email: 'ana@example.com', ...administrator };

async function withSession(page: Page): Promise<void> {
  await page.route('**/api/start', async (route) => {
    const start = await (await route.fetch()).json();
    await route.fulfill({ json: { ...start, person } });
  });
}

const fitsWidth = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

for (const width of [1366, 1920, 768, 390]) {
  test(`app-E04: a ${width} px todo se ve entero, sin desplazarse al costado`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Entrar' })).toBeVisible();
    expect(await fitsWidth(page)).toBe(true);
    await withSession(page);
    await page.reload();
    await expect(page.locator('.frame')).toBeVisible();
    expect(await fitsWidth(page)).toBe(true);
  });
}

test('app-E19: con la ventana angosta, la computadora usa los textos cortos', async ({ page }) => {
  await withSession(page);
  await page.setViewportSize({ width: 800, height: 800 });
  await page.goto('/');
  // Debajo del título, en angosto: la pastilla del vínculo (y la luz, sin conexión); en ancho, la luz.
  const shown = (form: string) =>
    page.locator(`:is(.light-text, .link-pill-text) .${form}`).filter({ visible: true });
  // Debajo del título se ve la pastilla del vínculo o, mientras no llega, la luz: ningún texto largo.
  await expect(page.locator('.phone-status > *').first()).toBeVisible();
  await expect(shown('long')).toHaveCount(0);
  // En ancho, al pie del menú: el indicador del vínculo, con la luz solo sin conexión (00 · R4.1).
  await page.setViewportSize({ width: 1366, height: 800 });
  await expect(page.locator('.side-footer :is(.link-indicator, .light)').first()).toBeVisible();
  await expect(shown('short')).toHaveCount(0);
});
