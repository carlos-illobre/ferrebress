// 1 · Entrar con Google y salir, en la computadora (R2.1, R3; E05, E11, E35): el botón en su marco,
// la sesión con su cookie y su llave contra el servidor, y «Salir», que la cierra y pide un nonce
// nuevo para la próxima.
import { expect, test } from '@playwright/test';
import { computer } from './support/devices.ts';
import { googleButton, googleState, signInWithGoogle } from './support/google.ts';

test('entra con Google, sigue adentro al recargar y sale', async ({ browser }) => {
  const page = await computer(browser);
  await page.goto('/');
  const first = await googleState(await googleButton(page));
  await signInWithGoogle(page);
  await expect(page.getByRole('region', { name: 'Tu sesión' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Tu sesión' })).toBeVisible();
  await page.getByRole('button', { name: /Salir/ }).first().click();
  const again = await googleState(await googleButton(page));
  expect(again.nonce).not.toBe(first.nonce);
  expect(again.forgot).toBe(true);
  await page.reload();
  await expect(page.locator('.google[data-drawn] iframe')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Tu sesión' })).toHaveCount(0);
});
