// Las escenas de la pestaña Roles para el capítulo «Roles» del manual (02 · R7.12, R7.13), en la
// computadora y en el celular: el Administrador y «Encargado de turno», que tiene Lucía, con las
// mismas personas inventadas que el resto de Usuarios.

import { type BrowserContext, expect, type Page } from '@playwright/test';
import type { Person } from '../../src/shared/contracts/sign-in.ts';
import {
  ana,
  header,
  hour,
  now,
  row,
  type Scene,
  sceneRoleRows,
  sceneRoles,
  signedIn,
} from './scenes.ts';
import { button, opened, shown } from './users-scenes.ts';

const at = (hours: number) => now.getTime() - hours * hour;
const shiftId = '0190a000-0000-7000-8000-00000000a002';
const shift = {
  id: shiftId,
  name: 'Encargado de turno',
  description: 'Abre y cierra el local; corta el celular de quien lo pierde.',
};

const people = [
  row(ana.userId, ana.name, at(2.5), true),
  { ...row('lucia', 'Lucía Fernández', at(50)), roleIds: [shiftId] },
  row('pedro', 'Pedro Giménez', null),
];

async function answerRoles(page: Page | BrowserContext, _person: Person): Promise<void> {
  const answer = (json: unknown) => (route: { fulfill: (o: object) => Promise<void> }) =>
    route.fulfill({ json, headers: header() });
  await page.route('**/api/users', answer({ people, roles: [...sceneRoles, shift] }));
  const shiftRow = {
    ...shift,
    system: false,
    version: 1,
    permissions: ['users.cut', 'users.view'],
  };
  await page.route('**/api/roles', answer({ roles: [...sceneRoleRows(), shiftRow] }));
  await page.route('**/api/users/*/access', answer({ sessions: [], phones: [] }));
}

// La pestaña Roles, con la lista.
async function roles(page: Page): Promise<void> {
  await signedIn(page, ana, answerRoles);
  // Directo por su dirección: tocar la pestaña deja estados del toque que cambian la captura.
  await page.goto('/users/roles');
  await shown(page.locator('.roles-row')).waitFor();
  // La pestaña se baja aparte: que terminen de cargar sus letras y sus animaciones, así la captura
  // sale igual cada vez.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().length === 0);
}

// Un rol nuevo, con el nombre y un permiso; `down`, la pantalla bajada hasta los permisos.
const newRole =
  (down = 0) =>
  async (page: Page): Promise<void> => {
    await roles(page);
    await button(/Nuevo rol/)(page).click();
    await page.getByLabel(/Nombre del rol/).fill('Cajero');
    await page.getByRole('checkbox', { name: /^Ver las personas/ }).check();
    await page.locator('.roles-tab').evaluate((tab, top) => tab.scrollTo(0, top), down);
  };

// «Encargado de turno» abierto, con Pedro elegido para darle el rol.
async function giving(page: Page): Promise<void> {
  await roles(page);
  await shown(page.getByRole('button', { name: 'Abrir «Encargado de turno»' })).click();
  await button(/Darle este rol a/)(page).click();
  await opened(page);
  await expect(page.getByRole('alertdialog')).toBeVisible();
}

async function given(page: Page): Promise<void> {
  await giving(page);
  await page.getByRole('alertdialog').getByText('Pedro Giménez').click();
  await expect(page.getByText('Se lo das al guardar')).toBeVisible();
  // Que la hoja termine de cerrarse: en una máquina lenta la captura la agarraba a medio camino.
  await expect(page.getByRole('alertdialog')).toBeHidden();
}

const rolePoints = {
  name: (page: Page) => page.getByLabel(/Nombre del rol/),
  permission: (page: Page) => page.getByRole('checkbox', { name: /^Ver las personas/ }),
};

const roleScenes = (device: 'computer' | 'phone', prefix: string): Scene[] => [
  {
    name: `${prefix}-roles`,
    device,
    prepare: roles,
    points: {
      tab: button(/^Roles/),
      search: (page) => shown(page.getByRole('searchbox')),
      new: button(/Nuevo rol/),
      role: (page) => shown(page.getByRole('button', { name: 'Abrir «Encargado de turno»' })),
    },
  },
  {
    name: `${prefix}-role-new`,
    device,
    prepare: newRole(),
    // En la computadora el permiso no entra en esta captura: va en desktop-role-permissions.
    points:
      device === 'phone'
        ? { ...rolePoints, create: button(/^Crear/) }
        : { name: rolePoints.name, create: button(/^Crear/) },
  },
  {
    name: `${prefix}-role-give`,
    device,
    prepare: giving,
    points: { person: (page) => page.getByRole('alertdialog').getByText('Pedro Giménez') },
  },
  {
    name: `${prefix}-role-given`,
    device,
    prepare: given,
    points: {
      take: button('Sacárselo'),
      undo: button(/Deshacer/),
      save: button(/^Guardar/),
    },
  },
];

export const rolesScenes: Scene[] = [
  ...roleScenes('computer', 'desktop'),
  // En la computadora el permiso queda abajo: otra captura, bajada hasta los permisos.
  {
    name: 'desktop-role-permissions',
    device: 'computer',
    prepare: newRole(300),
    points: { permission: rolePoints.permission },
  },
  ...roleScenes('phone', 'phone'),
];
