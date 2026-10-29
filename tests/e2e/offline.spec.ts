// 5 · Entrar sin conexión con la huella, en el celular (15 · R1 a R3; E01, E07, E15): con la huella
// vinculada se prende «Trabajar sin conexión», se sale, se corta la red, se entra con la huella y,
// al volver la red, el servidor confirma la entrada y la sesión sigue sin volver a entrar.
import { expect, test } from '@playwright/test';
import { phone } from './support/devices.ts';
import { signInWithGoogle } from './support/google.ts';

test('offline-E07, E11, E15: entra sin conexión con la huella después de salir, y el servidor lo confirma al volver la red', async ({
  browser,
}) => {
  const page = await phone(browser);
  await page.goto('/');
  await signInWithGoogle(page);
  await page.getByRole('button', { name: 'Sí, usar la huella' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Más', exact: true }).click();
  const option = page.getByRole('switch', { name: /Trabajar sin conexión/ });
  await option.click();
  await expect(option).toHaveAttribute('aria-checked', 'true');
  // Que termine lo que pide la entrada al salir antes de cortar: una respuesta que llega después
  // del corte prendería la luz de nuevo.
  const started = page.waitForResponse('**/api/start');
  await page.getByRole('button', { name: /Salir/ }).click();
  await started;
  await page.waitForLoadState('networkidle');

  await page.context().setOffline(true);
  await expect(page.getByText(/Sin conexión: podés entrar con la huella hasta/)).toBeVisible();
  await page.getByRole('button', { name: /Ingresar con huella/ }).click();
  await expect(page.getByRole('button', { name: 'Más', exact: true })).toBeVisible();
  // E07: en el marco, con la luz en «Sin conexión».
  await expect(page.locator('.frame[data-net="offline"]')).toBeVisible();

  const confirmed = page.waitForResponse('**/api/sign-in/offline');
  await page.context().setOffline(false);
  expect((await confirmed).status()).toBe(200);
  await expect(page.getByRole('button', { name: 'Más', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Entrar' })).toHaveCount(0);
});
