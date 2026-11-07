// Más → Configuración (capítulo 04), tal como quedó aprobada, en la computadora y en el celular, y el
// aviso para instalar del celular sobre el marco: que se vea entero y que el toque le llegue. Lo que
// dice el navegador (que se puede instalar) se simula.
import { expect, type Page, test } from '@playwright/test';
import { administrator } from './person.ts';

const ana = { userId: 'u1', name: 'Ana Gómez', email: 'ana@example.com', ...administrator };
const now = new Date('2026-11-06T17:05:00Z');

async function signedIn(page: Page, environment = 'testing') {
  await page.addInitScript((saved) => localStorage.setItem('session', JSON.stringify(saved)), {
    sessionId: 's',
    person: ana,
  });
  await page.route('**/api/start', async (route) => {
    const start = await (await route.fetch()).json();
    await route.fulfill({
      json: { ...start, environment, person: ana },
      headers: { 'X-Ferrebress': `v=screens; t=${now.getTime()}; e=${environment}` },
    });
  });
  await page.clock.setFixedTime(now);
}

// El navegador avisa que se puede instalar, como Chrome cuando la página cumple.
const browserOffers = (page: Page) =>
  page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: () => Promise.resolve(),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    dispatchEvent(event);
  });

test('device-settings: Configuración en la computadora', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await signedIn(page);
  await page.goto('/device-settings');
  await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible();
  await browserOffers(page);
  await expect(page.getByRole('button', { name: /Instalar/ })).toBeVisible();
  await expect(page).toHaveScreenshot('settings-desktop.png');
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

  test('device-settings: Configuración en el celular', async ({ page }) => {
    await signedIn(page);
    await page.goto('/device-settings');
    await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible();
    await expect(page).toHaveScreenshot('settings-phone.png');
  });

  test('device-settings-E25: el aviso para instalar, sobre Vender, y «Ahora no» recibe el toque', async ({
    page,
  }) => {
    await signedIn(page, 'production');
    await page.goto('/');
    await browserOffers(page);
    const sheet = page.getByRole('dialog', { name: /Instalá Ferrebress/ });
    await expect(sheet).toBeVisible();
    await expect(page).toHaveScreenshot('install-sheet-phone.png');
    await sheet.getByRole('button', { name: 'Ahora no' }).tap();
    await expect(sheet).toBeHidden();
  });
});
