// El manual, tal como quedó aprobado (maqueta final del manual), con el manual de prueba de
// tests/manual/fixture/ (así reordenar el de verdad no cambia estas capturas): la computadora con
// la primera tarea, lo encontrado al buscar y «Todos los pasos»; el celular con sus tareas y la hoja
// del paso a paso.
import { expect, type Page, test } from '@playwright/test';

const ready = async (page: Page, path: string) => {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: '¿Qué querés hacer?' })).toBeVisible();
};

test.describe('en la computadora', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('el manual con la primera tarea', async ({ page }) => {
    await ready(page, '/manual');
    await expect(page.locator('img[alt="Captura: El código"]')).toBeVisible();
    await expect(page).toHaveScreenshot('manual-desktop.png');
  });

  test('lo encontrado al buscar, con lo buscado marcado', async ({ page }) => {
    await ready(page, '/manual');
    await page.keyboard.type('huella');
    await expect(page.getByText('Entrar · 1 encontrada')).toBeVisible();
    await expect(page).toHaveScreenshot('manual-desktop-search.png');
  });

  test('«Todos los pasos»', async ({ page }) => {
    await ready(page, '/manual');
    await page
      .getByRole('button', { name: /^Todos los pasos/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: 'Entrar · todos los pasos' })).toBeVisible();
    await expect(page).toHaveScreenshot('manual-desktop-all-steps.png');
  });
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

  test('las tareas del celular', async ({ page }) => {
    await ready(page, '/manual');
    await expect(page).toHaveScreenshot('manual-phone.png');
  });

  test('la hoja del paso a paso, con el rótulo al costado del aro', async ({ page }) => {
    await ready(page, '/manual?d=phone&c=sign-in&t=google&p=1');
    await expect(page.locator('img[alt="Captura: Continuar con Google"]')).toBeVisible();
    await expect(page).toHaveScreenshot('manual-phone-step.png');
  });
});
