// 2 · Vincular la huella y entrar con ella, en el celular (R2.2, R2.3; E06, E07): después del
// primer Google se ofrece la huella; vinculada, se sale y se vuelve a entrar solo con ella.
import { expect, test } from '@playwright/test';
import { phone } from './support/devices.ts';
import { signInWithGoogle } from './support/google.ts';

test('vincula la huella después de Google y entra con ella', async ({ browser }) => {
  const page = await phone(browser);
  await page.goto('/');
  await signInWithGoogle(page);
  await page.getByRole('button', { name: 'Sí, usar la huella' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Más', exact: true }).click();
  await page.getByRole('button', { name: /Salir/ }).click();
  await page.getByRole('button', { name: /Ingresar con huella/ }).click();
  await expect(page.getByRole('button', { name: 'Más', exact: true })).toBeVisible();
});
