// Las escenas de Usuarios para el capítulo «Personas» del manual: Ana, una persona con dos sesiones
// y un celular con huella, una que todavía no entró y una dada de baja, todas inventadas.

import { type BrowserContext, expect, type Locator, type Page } from '@playwright/test';
import type { Person } from '../../src/shared/contracts/sign-in.ts';
import { ana, header, hour, now, row, type Scene, signedIn } from './scenes.ts';

const at = (hours: number) => now.getTime() - hours * hour;

const people = [
  row(ana.userId, ana.name, at(2.5), true),
  { ...row('lucia', 'Lucía Fernández', at(50)), sessions: 2, phones: 1 },
  row('pedro', 'Pedro Giménez', null),
  {
    ...row('sofia', 'Sofía Blanco', at(400)),
    active: false,
    deactivatedAt: at(100),
    sessions: 0,
  },
];

const lucia = {
  sessions: [
    {
      id: 's1',
      deviceLabel: 'Chrome en Windows',
      way: 'google',
      isPhone: false,
      createdAt: at(50),
      lastUsedAt: at(0.25),
    },
    {
      id: 's2',
      deviceLabel: 'Chrome en Android',
      way: 'passkey',
      isPhone: true,
      createdAt: at(20),
      lastUsedAt: at(1.5),
    },
  ],
  phones: [
    { id: 'p1', deviceLabel: 'Chrome en Android', createdAt: at(1000), lastUsedAt: at(1.5) },
  ],
};

const lost = {
  people: [
    {
      userId: 'lucia',
      displayName: 'Lucía Fernández',
      self: false,
      phones: [
        {
          id: 'p1',
          deviceLabel: 'Chrome en Android',
          sessions: 1,
          passkey: true,
          lastUsedAt: at(1.5),
        },
      ],
    },
  ],
};

async function answerPeople(page: Page | BrowserContext, _person: Person): Promise<void> {
  const answer = (json: unknown) => (route: { fulfill: (o: object) => Promise<void> }) =>
    route.fulfill({ json, headers: header() });
  await page.route('**/api/users', answer({ people }));
  await page.route('**/api/users/*/access', (route) =>
    answer(route.request().url().includes('/lucia/') ? lucia : { sessions: [], phones: [] })(route),
  );
  await page.route('**/api/lost-phones', answer(lost));
}

const shown = (locator: Locator) => locator.filter({ visible: true }).first();
const button = (name: string | RegExp) => (page: Page) =>
  shown(page.getByRole('button', { name, exact: typeof name === 'string' }));
const inDialog = (name: string) => (page: Page) =>
  page.getByRole('alertdialog').getByRole('button', { name, exact: true });

async function users(page: Page): Promise<void> {
  await signedIn(page, ana, answerPeople);
  await shown(page.locator('.users-row')).waitFor();
}

async function choose(page: Page, name: string): Promise<void> {
  await users(page);
  // Sin esperar a que quede quieta: con el reloj fijo, la lista que se desliza nunca termina.
  await page.locator('.users-row', { hasText: name }).dispatchEvent('click');
}

async function luciaCard(page: Page): Promise<void> {
  await choose(page, 'Lucía Fernández');
  await expect(shown(page.getByText('Chrome en Windows'))).toBeVisible();
}

async function authorizeFilled(page: Page): Promise<void> {
  await users(page);
  await button('Autorizar a alguien')(page).click();
  await page
    .getByRole('alertdialog')
    .getByRole('textbox', { name: /^Nombre/ })
    .fill('Marta Ruiz');
  await page.getByRole('alertdialog').getByLabel('Correo de Google').fill('marta@example.com');
}

async function deactivating(page: Page): Promise<void> {
  await luciaCard(page);
  await button('Dar de baja')(page).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
}

const authorizePoints = {
  email: (page: Page) => page.getByRole('alertdialog').getByLabel('Correo de Google'),
  yes: inDialog('Autorizar'),
};

export const userScenes: Scene[] = [
  {
    name: 'desktop-users',
    device: 'computer',
    prepare: luciaCard,
    points: {
      authorize: button('Autorizar a alguien'),
      lost: button('Se perdió un celular'),
      search: (page) => shown(page.getByRole('searchbox')),
      name: button('Cambiar el nombre'),
      close: button('Cerrar'),
      'close-all': button('Cerrar todas'),
      remove: button('Quitar'),
      deactivate: button('Dar de baja'),
    },
  },
  {
    name: 'desktop-users-authorize',
    device: 'computer',
    prepare: authorizeFilled,
    points: authorizePoints,
  },
  {
    name: 'desktop-users-lost',
    device: 'computer',
    prepare: async (page) => {
      await users(page);
      await button('Se perdió un celular')(page).click();
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: /Lucía Fernández/ })
        .click();
    },
    points: {
      phone: (page) =>
        page.getByRole('alertdialog').getByRole('button', { name: /Chrome en Android/ }),
      cut: inDialog('Cortar'),
    },
  },
  {
    name: 'desktop-users-never',
    device: 'computer',
    prepare: (page) => choose(page, 'Pedro Giménez'),
    points: { email: button('Cambiar el correo'), delete: button('Borrar el alta') },
  },
  {
    name: 'desktop-users-deactivate',
    device: 'computer',
    prepare: deactivating,
    points: { yes: inDialog('Dar de baja') },
  },
  {
    name: 'desktop-users-off',
    device: 'computer',
    prepare: (page) => choose(page, 'Sofía Blanco'),
    points: { activate: button('Dar de alta') },
  },
  {
    name: 'phone-more-users',
    device: 'phone',
    prepare: async (page) => {
      await users(page);
      await page.getByRole('button', { name: 'Más', exact: true }).click();
    },
    points: { users: button(/^Usuarios/) },
  },
  {
    name: 'phone-users',
    device: 'phone',
    prepare: users,
    points: {
      search: button('Buscar usuario'),
      authorize: button('Autorizar a alguien'),
      lost: button('Se perdió un celular'),
    },
  },
  {
    name: 'phone-users-authorize',
    device: 'phone',
    prepare: authorizeFilled,
    points: authorizePoints,
  },
  {
    name: 'phone-users-search',
    device: 'phone',
    prepare: async (page) => {
      await users(page);
      await button('Buscar usuario')(page).click();
      await page.getByRole('alertdialog').getByRole('searchbox').fill('luc');
    },
    points: {
      box: (page) => page.getByRole('alertdialog').getByRole('searchbox'),
      chips: (page) => page.getByRole('alertdialog').locator('.users-chips'),
    },
  },
  {
    name: 'phone-users-card',
    device: 'phone',
    prepare: luciaCard,
    points: {
      cut: button('Cortar sesión'),
      passkey: button('Quitar huella'),
      close: button('Cerrar'),
    },
  },
  {
    name: 'phone-users-deactivate',
    device: 'phone',
    prepare: deactivating,
    points: { yes: inDialog('Dar de baja') },
  },
];
