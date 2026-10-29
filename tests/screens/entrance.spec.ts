// La entrada, en la computadora y en el celular, tal como quedó aprobada (01 · R7.1, E38): una
// captura de cada una que tiene que coincidir punto por punto con la de referencia.
import { expect, type Page, test } from '@playwright/test';

const now = new Date('2026-10-28T12:00:00-03:00');

async function ready(page: Page): Promise<void> {
  await page.clock.setFixedTime(now);
  await page.goto('/');
  await expect(page.locator('.google[data-drawn] iframe')).toBeVisible();
}

test('la entrada en la computadora', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await ready(page);
  await expect(page.locator('.qr > svg > path')).toBeVisible();
  await expect(page).toHaveScreenshot('entrance-desktop.png');
});

test('la entrada en la computadora con la ventana angosta', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 900 });
  await ready(page);
  await expect(page.locator('.qr > svg > path')).toBeVisible();
  await expect(page).toHaveScreenshot('entrance-desktop-narrow.png');
});

test.describe('en el celular', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/141 Mobile',
    isMobile: true,
    hasTouch: true,
  });

  test('la entrada en el celular', async ({ page }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'userAgentData', { get: () => ({ mobile: true }) }),
    );
    await ready(page);
    await expect(page).toHaveScreenshot('entrance-phone.png');
  });

  // 15 · R2.1: sin conexión, con «Trabajar sin conexión» prendido y el último contacto hace una
  // hora, la huella queda prendida y el aviso dice hasta cuándo.
  test('la entrada en el celular sin conexión, con la huella', async ({ page, context }) => {
    const contact = now.getTime() - 3_600_000;
    await page.addInitScript((at) => {
      Object.defineProperty(navigator, 'userAgentData', { get: () => ({ mobile: true }) });
      const person = { userId: 'u1', name: 'Ana', email: 'a@x.com', role: 'Administrador' };
      localStorage.setItem('offline-permit', JSON.stringify({ person, revoked: false }));
      localStorage.setItem('offline-contact', JSON.stringify({ at, maxSeenAt: at }));
    }, contact);
    await ready(page);
    await context.setOffline(true);
    await expect(page.getByText(/Sin conexión: podés entrar con la huella hasta/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Ingresar con huella/ })).toBeEnabled();
    await expect(page).toHaveScreenshot('entrance-phone-offline-finger.png');
  });
});
