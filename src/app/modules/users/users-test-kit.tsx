// Lo que comparten las pruebas de Usuarios: personas de mentira (correos @example.com), sus
// sesiones y celulares, y la pantalla montada con un servidor de mentira.
import type { AccessResponse, PersonRow } from '@ferrebress/shared/contracts/users';
import { render, screen, within } from '@testing-library/preact';
import { vi } from 'vitest';
import { syncServerTime } from '../../platform/server/clock.ts';
import { fakeServer, type Reply } from '../../testing/fake-server.ts';
import { Toasts } from '../../ui/toast/Toast.tsx';
import { Users } from './screens/Users/Users.tsx';

// La hora que dice el servidor de mentira en cada respuesta.
export const now = 1_700_000_000_000;
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

// `wide`: con la computadora que elige sola a la primera persona; si no, como en lo angosto, para
// que cada prueba elija a quien quiera.
export function openUsers(
  routes: Record<string, Reply | Reply[]> = {},
  testing = true,
  wide = false,
) {
  syncServerTime(now);
  const media = window.matchMedia.bind(window);
  if (!wide)
    vi.stubGlobal('matchMedia', (query: string) =>
      query.includes('min-width') ? { matches: false, media: query } : media(query),
    );
  const server = fakeServer({ '/api/users': { body: { people } }, ...routes });
  render(
    <>
      <div id="app" data-layer="">
        <Users testing={testing} />
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
