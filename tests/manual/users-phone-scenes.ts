// Las escenas de Usuarios en el celular, para el capítulo «Personas» del manual: las mismas
// personas inventadas que en la computadora (users-scenes.ts).

import type { Scene } from './scenes.ts';
import {
  authorizeFilled,
  authorizePoints,
  button,
  choose,
  deactivating,
  inDialog,
  lostChosen,
  lostPoints,
  luciaCard,
  opened,
  users,
} from './users-scenes.ts';

export const phoneUserScenes: Scene[] = [
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
      person: (page) =>
        page.locator('.users-row', { hasText: 'Lucía Fernández' }).locator('.users-avatar'),
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
      await opened(page);
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
  { name: 'phone-users-lost', device: 'phone', prepare: lostChosen, points: lostPoints },
  {
    name: 'phone-users-foot',
    device: 'phone',
    prepare: async (page) => {
      await luciaCard(page);
      // Al final de la tarjeta, de un salto: con el reloj fijo, deslizarse nunca termina.
      await button('Dar de baja')(page).evaluate((foot) =>
        foot.scrollIntoView({ block: 'center' }),
      );
    },
    points: { deactivate: button('Dar de baja') },
  },
  {
    name: 'phone-users-off',
    device: 'phone',
    prepare: (page) => choose(page, 'Sofía Blanco'),
    points: { activate: button('Dar de alta') },
  },
];
