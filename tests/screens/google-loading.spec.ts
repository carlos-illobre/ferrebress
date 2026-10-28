// El lugar del botón de Google mientras carga, «El hilo» (01 · R2.1; docs/design/mockups/
// sign-in-google-loading/final/): Google no contesta y el reloj de la página avanza hasta cada
// momento. Las animaciones quedan quietas en la captura.
import { expect, type Page, test } from '@playwright/test';

const now = new Date('2026-10-28T12:00:00-03:00');

// La entrada con Google que nunca contesta, el reloj en `ms` y el lugar en `phase`.
async function waiting(page: Page, ms: number, phase: string): Promise<void> {
  await page.route('**/google-button-screens.js', () => {});
  await page.clock.install({ time: now });
  await page.goto('/');
  await expect(page.locator('.qr > svg > path, .finger').first()).toBeVisible();
  await page.clock.runFor(ms);
  await expect(page.locator(`.google[data-phase="${phase}"]`)).toBeVisible();
}

test('en la computadora, pasados 2 s: «Conectando con Google…»', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await waiting(page, 2500, 'slow');
  await expect(page).toHaveScreenshot('google-loading-desktop.png');
});

test.describe('en el celular', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/141 Mobile',
    isMobile: true,
    hasTouch: true,
  });
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'userAgentData', { get: () => ({ mobile: true }) }),
    );
  });

  test('pasados 2 s: «Conectando con Google…»', async ({ page }) => {
    await waiting(page, 2500, 'slow');
    await expect(page).toHaveScreenshot('google-loading-phone.png');
  });

  test('a los 8 s: «Google no responde · Reintentar»', async ({ page }) => {
    await waiting(page, 8500, 'failed');
    await expect(page).toHaveScreenshot('google-failed-phone.png');
    // Se toca de verdad (nada lo tapa) y vuelve a pedir Google: la espera empieza de cero.
    await page.getByRole('button', { name: /Reintentar/ }).tap();
    await expect(page.locator('.google[data-phase="empty"]')).toBeVisible();
  });

  test('sin conexión: «Sin internet, Google no carga»', async ({ page, context }) => {
    await waiting(page, 500, 'loading');
    await context.setOffline(true);
    await expect(page.locator('.google[data-phase="offline"]')).toBeVisible();
    await expect(page).toHaveScreenshot('google-offline-phone.png');
  });
});
