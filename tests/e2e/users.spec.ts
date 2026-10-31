// 02 · Personas: cerrar una sesión desde otro dispositivo (R5.3; aprobada por Carlos). Lo que una
// unitaria no alcanza: dos navegadores de verdad con sus cookies, el cierre en la base y en la
// memoria del servidor, y que el primero vuelva a la entrada con su próximo pedido.
import { expect, test } from '@playwright/test';
import { computer } from './support/devices.ts';
import { signInWithGoogle } from './support/google.ts';

test('una sesión cerrada desde otra computadora vuelve a la entrada con su próximo pedido', async ({
  browser,
}) => {
  // Las otras pruebas entran a la vez con la misma persona: el mostrador se distingue por su nombre.
  const counter = await computer(
    browser,
    'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
  );
  await counter.goto('/');
  await signInWithGoogle(counter);
  await expect(counter.getByRole('region', { name: 'Usuarios' })).toBeVisible();

  const office = await computer(browser);
  await office.goto('/');
  await signInWithGoogle(office);
  // En la propia tarjeta figura la sesión del mostrador, no la de esta computadora (R5.2).
  await office.locator('.users-row', { hasText: 'Vos' }).click();
  const session = office.locator('.users-card .users-item', { hasText: 'Firefox en Linux' });
  await session.getByRole('button', { name: 'Cerrar' }).click();
  await expect(office.locator('.toast')).toContainText('Sesión cerrada');

  // El mostrador no se entera solo: con su próximo pedido aparece la entrada encima.
  await counter.locator('.users-row', { hasText: 'Vos' }).click();
  await expect(counter.getByText('Tu sesión se cerró desde otro dispositivo')).toBeVisible();
});
