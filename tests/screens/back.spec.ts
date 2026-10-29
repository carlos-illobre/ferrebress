// El botón atrás del celular con la cámara abierta (01 · R2.5): la cierra y vuelve a la entrada, sin
// salir de la aplicación. En un navegador de verdad, con su historial.
import { expect, test } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/141 Mobile',
  isMobile: true,
  hasTouch: true,
});

test('atrás cierra la cámara y queda la entrada', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'userAgentData', { get: () => ({ mobile: true }) }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: /Escanear código QR/ }).tap();
  const camera = page.getByRole('dialog', { name: 'Escanear el código' });
  await expect(camera).toBeVisible();
  await page.goBack();
  await expect(camera).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Entrar' })).toBeVisible();
  // Abrirla otra vez y cerrarla con la × saca su paso: queda el de la entrada.
  await page.getByRole('button', { name: /Escanear código QR/ }).tap();
  await page.getByRole('button', { name: 'Cerrar' }).tap();
  await expect(camera).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => history.state)).toBeNull();
});
