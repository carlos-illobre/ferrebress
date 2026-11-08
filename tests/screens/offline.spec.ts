// Entrar sin conexión en el celular (capítulo 15), tal como quedó aprobado: la entrada que el
// servidor no confirmó, encima del marco (R3.2), y la opción «Trabajar sin conexión» de Configuración (R1, 04 · R5).
// Las respuestas del servidor las arma cada prueba.
import { expect, type Page, test } from '@playwright/test';
import { administrator } from './person.ts';

const ana = { userId: 'u1', name: 'Ana Gómez', email: 'ana@example.com', ...administrator };
const start = {
  environment: 'testing',
  version: 'screens',
  googleClientId: 'screens',
  googleScriptUrl: '/google-button-screens.js',
  businessTimeZone: 'America/Argentina/Buenos_Aires',
  googleNonce: 'screens',
};

// `at`: la hora que dice el servidor; fija donde la captura la muestra.
async function answerStart(page: Page, body: unknown, at = Date.now()) {
  await page.route('**/api/start', (route) =>
    route.fulfill({
      json: body,
      headers: { 'X-Ferrebress': `v=screens; t=${at}; e=testing` },
    }),
  );
}

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

test('offline-R3.2: la entrada que el servidor no confirmó, encima del marco, también al recargar', async ({
  page,
}) => {
  await page.addInitScript((person) => {
    const saved = { person, closedReason: 'offline-not-confirmed' };
    localStorage.setItem('session', JSON.stringify(saved));
  }, ana);
  await answerStart(page, start);
  await page.goto('/');
  await expect(page.getByText('No se pudo confirmar tu entrada sin conexión')).toBeVisible();
  await expect(page.locator('.google[data-drawn] iframe')).toBeVisible();
  await expect(page).toHaveScreenshot('entrance-phone-not-confirmed.png');
});

test('offline-E01, device-settings-E28: «Trabajar sin conexión», en Configuración, se prende al tocarlo', async ({
  page,
}) => {
  const person = { ...ana, offline: true };
  await page.addInitScript((saved) => localStorage.setItem('session', JSON.stringify(saved)), {
    sessionId: 's',
    person,
  });
  // La hora de ahora se ve en Configuración: fija, para que la captura salga siempre igual.
  const at = new Date('2026-11-06T17:05:00Z');
  await answerStart(page, { ...start, person }, at.getTime());
  await page.clock.setFixedTime(at);
  await page.goto('/');
  await page.getByRole('button', { name: 'Más', exact: true }).tap();
  await page.getByRole('button', { name: /Configuración/ }).tap();
  const option = page.getByRole('switch', { name: 'Trabajar sin conexión' });
  await option.tap();
  await expect(option).toHaveAttribute('aria-checked', 'true');
  await expect(page).toHaveScreenshot('settings-phone-offline-on.png', { animations: 'disabled' });
});
