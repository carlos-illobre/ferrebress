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
      lastUsedAt: at(0.31), // 18 min y medio: lejos del borde del minuto
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

export const shown = (locator: Locator) => locator.filter({ visible: true }).first();
export const button = (name: string | RegExp) => (page: Page) =>
  shown(page.getByRole('button', { name, exact: typeof name === 'string' }));
export const inDialog = (name: string) => (page: Page) =>
  page.getByRole('alertdialog').getByRole('button', { name, exact: true });

// El diálogo enfoca su caja (o su botón) y apaga lo de atrás después de dibujarse: hasta que lo
// hizo, lo que se escribe o se toca puede quedar con el foco en otro lado.
export const opened = (page: Page) => expect(page.locator('#app')).toHaveAttribute('inert', '');

export async function users(page: Page): Promise<void> {
  await signedIn(page, ana, answerPeople);
  await shown(page.locator('.users-row')).waitFor();
  // En la computadora se abre sola la tarjeta de la primera: que termine de cargar antes de seguir.
  await expect(page.locator('.users-card [aria-busy]')).toHaveCount(0);
}

export async function choose(page: Page, name: string): Promise<void> {
  await users(page);
  // Sin esperar a que quede quieta: con el reloj fijo, la lista que se desliza nunca termina.
  await page.locator('.users-row', { hasText: name }).dispatchEvent('click');
}

export async function luciaCard(page: Page): Promise<void> {
  await choose(page, 'Lucía Fernández');
  await expect(shown(page.getByText('Chrome en Windows'))).toBeVisible();
}

export async function authorizeFilled(page: Page): Promise<void> {
  await users(page);
  await button('Autorizar a alguien')(page).click();
  await opened(page);
  await page
    .getByRole('alertdialog')
    .getByRole('textbox', { name: /^Nombre/ })
    .fill('Marta Ruiz');
  await page.getByRole('alertdialog').getByLabel('Correo de Google').fill('marta@example.com');
  // Escribir mueve el diálogo lo justo para que a veces asome su barra de desplazamiento: sin
  // ella, la captura sale idéntica en cada máquina.
  await page.addStyleTag({ content: '.dialog { scrollbar-width: none; }' });
}

export async function deactivating(page: Page): Promise<void> {
  await luciaCard(page);
  await button('Dar de baja')(page).click();
  await opened(page);
  await expect(page.getByRole('alertdialog')).toBeVisible();
}

export async function lostChosen(page: Page): Promise<void> {
  await users(page);
  await button('Se perdió un celular')(page).click();
  await opened(page);
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: /Lucía Fernández/ })
    .click();
}

export const lostPoints = {
  phone: (page: Page) =>
    page.getByRole('alertdialog').getByRole('button', { name: /Chrome en Android/ }),
  cut: inDialog('Cortar'),
};

export const authorizePoints = {
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
      filters: (page) => shown(page.locator('.users-chips')),
      person: (page) => page.locator('.users-row', { hasText: 'Lucía Fernández' }),
      sessions: (page) => shown(page.locator('#users-sessions h3')),
    },
  },
  {
    name: 'desktop-more-users',
    device: 'computer',
    prepare: async (page) => {
      await users(page);
      await page.getByRole('button', { name: /^Más/ }).first().click();
    },
    points: { users: button(/^Usuarios/) },
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
    prepare: lostChosen,
    points: lostPoints,
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
];
