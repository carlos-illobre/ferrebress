// Las piezas que se muestran encima de otras o en su lugar, tocadas de verdad (constitución VII): el
// navegador comprueba que el toque le llegue a cada una y no a lo que tiene debajo. Las respuestas
// del servidor las arma cada prueba, sin servidor de verdad.
import { expect, type Page, test } from '@playwright/test';

const ana = { userId: 'u1', name: 'Ana Gómez', email: 'ana@example.com', role: 'Administrador' };
const start = {
  environment: 'testing',
  version: 'screens',
  googleClientId: 'screens',
  googleScriptUrl: '/google-button-screens.js',
  googleNonce: 'screens',
};
const header = (version = 'screens') => ({
  'X-Ferrebress': `v=${version}; t=${Date.now()}; e=testing`,
});

// Contesta `path` con `body` (y `status`), con la cabecera del servidor.
async function answer(
  page: Page,
  path: string,
  body: unknown,
  options = { status: 200, version: 'screens' },
) {
  await page.route(`**${path}`, (route) =>
    route.fulfill({ status: options.status, json: body, headers: header(options.version) }),
  );
}

const phone = {
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/141 Mobile',
  isMobile: true,
  hasTouch: true,
};

test.describe('en el celular', () => {
  test.use(phone);
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'userAgentData', { get: () => ({ mobile: true }) }),
    );
  });

  test('el botón de Google, y la hoja de la huella encima del marco', async ({ page }) => {
    await answer(page, '/api/sign-in/google', { person: ana, sessionId: 's', offerPasskey: true });
    await page.goto('/');
    await page.locator('.google[data-drawn] iframe').contentFrame().getByRole('button').tap();
    await page.getByRole('button', { name: 'Ahora no' }).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('la hoja del código leído, encima de la entrada', async ({ page }) => {
    const reading = {
      secret: 's',
      computer: { label: 'Chrome en Windows' },
      holdSeconds: 120,
      authentication: {},
    };
    await answer(page, '/api/sign-in/codes/read', reading);
    await answer(page, '/api/sign-in/codes/cancel', { ok: true });
    await page.addInitScript(() => localStorage.setItem('passkey', 'true'));
    await page.goto('/link#codigo-de-prueba');
    await page.getByRole('button', { name: 'No soy yo, cancelar' }).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('la cámara, encima de la entrada', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Escanear/ }).tap();
    await page.getByRole('button', { name: 'Cerrar' }).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('Más, en lugar del área de trabajo, y la hoja de lo pendiente encima', async ({ page }) => {
    await answer(page, '/api/start', { ...start, person: ana });
    await page.goto('/');
    await page.getByRole('button', { name: 'Más', exact: true }).tap();
    const more = page.getByRole('region', { name: 'Más' });
    await more.locator('.phone-more-light').tap();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('en la computadora', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('«Hay una versión nueva», encima del marco', async ({ page }) => {
    await answer(page, '/api/start', { ...start, person: ana }, { status: 200, version: 'otra' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Ahora no' }).click();
    await expect(page.getByRole('status', { name: 'Hay una versión nueva' })).toHaveCount(0);
  });

  test('«Algo salió mal», encima de todo', async ({ page }) => {
    await answer(page, '/api/start', { ...start, person: ana });
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Tu sesión' })).toBeVisible();
    await page.evaluate(() => setTimeout(() => Promise.reject(new Error('prueba'))));
    await page.getByRole('button', { name: 'Seguir sin avisar' }).click();
    await expect(page.getByRole('button', { name: 'Seguir sin avisar' })).toHaveCount(0);
  });

  test('mientras se abre la sesión, «Entrando» tapa la tarjeta: Google no recibe toques', async ({
    page,
  }) => {
    await page.route('**/api/sign-in/google', () => {});
    await page.goto('/');
    const google = page.locator('.google[data-drawn] iframe');
    await google.contentFrame().getByRole('button').click();
    await expect(page.locator('.card-body[inert]')).toBeVisible();
    await expect(google.click({ trial: true, timeout: 500 })).rejects.toThrow();
  });
});
