// Lo que solo se puede comprobar en un navegador de verdad (00 · E04, E19): que nada se desplace
// hacia el costado en los anchos de siempre, y que en lo angosto se usen los textos cortos. Con
// sesión, el marco; sin sesión, la entrada.
import { expect, type Page, test } from '@playwright/test';

const person = { userId: 'u1', name: 'Ana Gómez', email: 'ana@example.com', role: 'Administrador' };

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
  const shown = (form: string) => page.locator(`.light-text .${form}`).filter({ visible: true });
  await expect(shown('short')).not.toHaveCount(0);
  await expect(shown('long')).toHaveCount(0);
  await page.setViewportSize({ width: 1366, height: 800 });
  await expect(shown('long')).not.toHaveCount(0);
  await expect(shown('short')).toHaveCount(0);
});
