// 02 · Roles y permisos: perder un permiso mientras se usa (R7.6, R7.8, E48; aprobada por Carlos). Lo
// que una unitaria no alcanza: dos navegadores, el cambio de roles en la base, las dos memorias del
// servidor y la cabecera que avisa, y que el primero vea «Ya no tenés permiso» con su próximo pedido.
import { randomUUID } from 'node:crypto';
import { expect, type Page, test } from '@playwright/test';
import { computer } from './support/devices.ts';
import { signInWithGoogle } from './support/google.ts';

// Un rol nuevo, desde la pestaña Roles, con un solo permiso (de esa parte, que puede estar plegada).
async function newRole(page: Page, name: string, permission: string, part: string) {
  await page.locator('.users-tab', { hasText: 'Roles' }).click();
  await page
    .getByRole('button', { name: /Nuevo rol/ })
    .first()
    .click();
  await page.getByRole('textbox', { name: 'Nombre del rol' }).fill(name);
  const box = page.getByRole('checkbox', { name: new RegExp(`^${permission}`) });
  if (!(await box.isVisible())) await page.locator('.role-group-head', { hasText: part }).click();
  await box.check();
  await page
    .getByRole('button', { name: /Crear el rol/ })
    .first()
    .click();
  await expect(page.locator('.toast')).toContainText(`Se creó el rol «${name}».`);
}

// Autorizar a alguien con esos roles.
async function authorize(page: Page, email: string, roles: string[]) {
  await page.locator('.users-tab', { hasText: 'Usuarios' }).click();
  await page
    .getByRole('button', { name: /Autorizar a alguien/ })
    .first()
    .click();
  const dialog = page.getByRole('alertdialog', { name: 'Autorizar a alguien' });
  await dialog.getByRole('textbox', { name: /Correo/ }).fill(email);
  for (const role of roles)
    await dialog.getByRole('checkbox', { name: new RegExp(role) }).check({ force: true });
  await dialog.getByRole('button', { name: /^Autorizar/ }).click();
  await expect(page.locator('.toast')).toContainText('Autorizada');
}

// Sacarle un rol desde su tarjeta.
async function takeRole(page: Page, email: string, role: string) {
  await page.locator('.users-row', { hasText: email }).click();
  const roles = page.getByRole('group', { name: /Roles de/ });
  await roles.getByRole('checkbox', { name: new RegExp(role) }).uncheck({ force: true });
  await page.getByRole('button', { name: /Guardar los roles/ }).click();
  await expect(page.locator('.toast')).toContainText('guardados');
}

test('a quien le sacan el rol con Usuarios abierto ve «Ya no tenés permiso» y Usuarios desaparece', async ({
  browser,
}) => {
  const suffix = randomUUID().slice(0, 8);
  const watcher = `Mira ${suffix}`;
  const offline = `Sin conexión ${suffix}`;
  const email = `roles-${suffix}@example.com`;

  const admin = await computer(browser);
  await admin.goto('/');
  await signInWithGoogle(admin);
  await expect(admin.getByRole('region', { name: 'Usuarios' })).toBeVisible();
  await newRole(admin, watcher, 'Ver las personas', 'Usuarios');
  await newRole(admin, offline, 'Trabajar sin conexión', 'Sin conexión');
  await authorize(admin, email, [watcher, offline]);

  const other = await computer(
    browser,
    'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
  );
  await other.goto('/');
  await signInWithGoogle(other, email);
  await expect(other.getByRole('region', { name: 'Usuarios' })).toBeVisible();
  // Ve las personas, pero no puede autorizar ni armar roles.
  await expect(other.getByRole('button', { name: /Autorizar a alguien/ })).toHaveCount(0);

  // Le sacan «Mira» y le queda el otro rol.
  await takeRole(admin, email, watcher);

  // Con su próximo pedido se entera, sin volver a entrar.
  await other.locator('.users-row').first().click();
  await expect(
    other.getByRole('alertdialog', { name: 'Ya no tenés permiso para Usuarios' }),
  ).toBeVisible();
  await expect(other.getByRole('alertdialog')).toContainText(`te sacó «${watcher}»`);
  await other.getByRole('button', { name: /ahora/ }).click();
  await other.locator('.part.more').click();
  await expect(other.locator('#more-options')).toBeVisible();
  await expect(other.locator('#more-options').getByText('Usuarios')).toHaveCount(0);
});
