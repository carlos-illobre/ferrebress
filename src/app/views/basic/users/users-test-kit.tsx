// Lo que comparten las pruebas de Usuarios: personas de mentira (correos @example.com), sus
// sesiones y celulares, y la pantalla montada con un servidor de mentira.
import type { AccessResponse, PersonRow } from '@ferrebress/shared/contracts/users';
import { fireEvent, render, screen, within } from '@testing-library/preact';
import { person as me } from '../../../modules/sign-in/index.ts';
import { syncServerTime } from '../../../platform/server/clock.ts';
import { fakeServer, type Reply } from '../../../testing/fake-server.ts';
import { stubMedia } from '../../../testing/media.ts';
import { administrator } from '../../../testing/person.ts';
import { Toasts } from '../ui/toast/Toast.tsx';
import { Users } from './Users/Users.tsx';

// La hora que dice el servidor de mentira en cada respuesta.
export const now = 1_700_000_000_000;

// Los roles que trae la lista: el Administrador, que tienen todas las personas de las pruebas.
const adminRole = (administrator.roles[0] as { id: string }).id;
export const roles = [{ id: adminRole, name: 'Administrador', description: 'Puede todo.' }];
// Los mismos, como los trae la pestaña Roles.
export const roleRows = [
  {
    ...(roles[0] as (typeof roles)[number]),
    system: true,
    version: 1,
    permissions: [...administrator.permissions],
  },
];
const hour = 3_600_000;
const day = 24 * hour;

export const person = (
  fields: Partial<PersonRow> & { id: string; displayName: string },
): PersonRow => ({
  name: fields.displayName,
  email: `${fields.id}@example.com`,
  active: true,
  self: false,
  authorizedAt: now - 90 * day,
  authorizedBy: null,
  deactivatedAt: null,
  lastSignInAt: now - 3 * day,
  neverSignedIn: false,
  version: 1,
  sessions: 0,
  phones: 0,
  roleIds: [adminRole],
  outranks: false,
  ...fields,
});

export const ruben = person({
  id: 'ruben',
  displayName: 'Rubén Paredes',
  self: true,
  sessions: 1,
  lastSignInAt: now - 2 * hour,
});
export const graciela = person({
  id: 'graciela',
  displayName: 'Graciela Benítez',
  sessions: 2,
  phones: 1,
  authorizedBy: 'ruben',
});
export const pedro = person({
  id: 'pedro',
  displayName: 'pedro@example.com',
  name: null,
  lastSignInAt: null,
  neverSignedIn: true,
});
export const sofia = person({
  id: 'sofia',
  displayName: 'Sofía Blanco',
  active: false,
  deactivatedAt: now - 10 * day,
});
export const people = [sofia, graciela, pedro, ruben];

export const access: AccessResponse = {
  sessions: [
    {
      id: 's1',
      deviceLabel: 'Chrome en Windows',
      way: 'google',
      isPhone: false,
      createdAt: now - 3 * day,
      lastUsedAt: now - 5 * 60_000,
    },
    {
      id: 's2',
      deviceLabel: 'Chrome en Android',
      way: 'passkey',
      isPhone: true,
      createdAt: now - day,
      lastUsedAt: now - hour,
    },
  ],
  phones: [
    { id: 'f1', deviceLabel: 'Chrome en Android', createdAt: now - 70 * day, lastUsedAt: null },
    { id: 'f2', deviceLabel: 'Safari en iPhone', createdAt: now - 70 * day, lastUsedAt: now - day },
  ],
};

// Quien mira: Rubén, Administrador (con todos los permisos), salvo que la prueba diga otra cosa.
export const viewer = {
  userId: 'ruben',
  name: 'Rubén Paredes',
  email: 'ruben@example.com',
  ...administrator,
};

// `wide`: con la computadora que elige sola a la primera persona; si no, como en lo angosto, para
// que cada prueba elija a quien quiera.

export function openUsers(routes: Record<string, Reply | Reply[]> = {}, wide = false) {
  syncServerTime(now);
  if (!me.get()) me.set(viewer);
  const before = window.matchMedia.bind(window);
  if (!wide) stubMedia((query) => !query.includes('min-width') && before(query).matches);
  const server = fakeServer({
    '/api/users': { body: { people, roles } },
    '/api/roles': { body: { roles: roleRows } },
    ...routes,
  });
  render(
    <>
      <div id="app" data-layer="">
        <Users />
      </div>
      <Toasts />
    </>,
  );
  return server;
}

export const row = (name: RegExp) =>
  screen
    .getAllByRole('button')
    .find(
      (one) => one.classList.contains('users-row') && name.test(one.textContent as string),
    ) as HTMLElement;

export const card = () => document.querySelector('.users-card') as HTMLElement;
export const inCard = () => within(card());
export const toast = () => document.querySelector('.toast')?.textContent;

// Si el renglón de una persona se ve dado de baja (gris).
export const isOff = (one: HTMLElement) => one.classList.contains('off');
// Los botones de las tarjetas de arriba y de los renglones que llevan a una parte, en el celular.
export const tilesOf = () => within(card().querySelector('.users-tiles') as HTMLElement);
export const linkRowsOf = () => within(card().querySelector('.users-link-rows') as HTMLElement);
// Las cantidades de sesiones o celulares que muestra el renglón de una persona.
export const countsOf = (one: HTMLElement) => one.querySelector('.users-counts')?.textContent;
// «‹ Usuarios», que en lo angosto vuelve de la tarjeta a la lista.
export const backToList = () => document.querySelector('.users-back') as HTMLElement;
// Lo resaltado de lo buscado en los nombres de la lista.
export const highlighted = () =>
  [...document.querySelectorAll('.users-row .users-name em')].map((one) => one.textContent);
// Las cuentas de arriba de la lista.
export const statsText = () => document.querySelector('.users-stats')?.textContent;
// El punto de «Buscar usuario» que dice que hay una búsqueda o un filtro puestos.
export const hasSearchDot = (button: HTMLElement) =>
  button.querySelector('.users-tool-dot') !== null;
// Si la pantalla se ve sin conexión (gris).
export const looksOffline = () => document.querySelector('.users')?.hasAttribute('data-off');
// Las pastillas de los roles de la tarjeta y lo que va a poder la persona.
export const roleChips = () => document.querySelector('.users-role-chips') as HTMLElement;
export const abilitiesText = () =>
  (document.querySelector('.person-abilities') as HTMLElement).textContent;
// El pie de los roles de una persona en el celular y lo que pierde.
export const personFoot = () => document.querySelector('.person-foot') as HTMLElement;
export const lostIn = (foot: HTMLElement) => foot.querySelector('.gone')?.textContent;
// El título de un diálogo.
export const titleOf = (region: HTMLElement) => region.querySelector('h2')?.textContent;
// El primer botón de la barra de abajo, en el celular.
export const phoneBarButton = () => document.querySelector('.users-bar button') as HTMLElement;
// Elegir a una persona de la lista, una vez que la lista llegó.
export const choose = async (name: RegExp) => {
  await screen.findByText('Rubén Paredes');
  fireEvent.click(row(name));
};
