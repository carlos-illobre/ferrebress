// Lo que comparten las pruebas de Administración: los ajustes de arranque como los trae el servidor y
// la pantalla montada con un servidor de mentira, vista por un Administrador o por quien no tiene el
// permiso.
import type { AdministrationResponse } from '@ferrebress/shared/contracts/administration';
import { render, screen } from '@testing-library/preact';
import { online } from '../../platform/server/api.ts';
import { syncServerTime } from '../../platform/server/clock.ts';
import { fakeServer, type Reply } from '../../testing/fake-server.ts';
import { administrator } from '../../testing/person.ts';
import { Toasts } from '../../ui/toast/Toast.tsx';
import { person as me } from '../sign-in/index.ts';
import { Administration } from './screens/Administration/Administration.tsx';

// La hora del servidor: miércoles 4 de noviembre de 2026, 14:30 en Buenos Aires.
export const now = Date.parse('2026-11-04T17:30:00Z');

export const initial: AdministrationResponse = {
  settings: {
    roundingStep: { value: 1000, version: 0 },
    quickMargins: { value: [300, 200, 100, 50, 25], version: 0 },
    sessionIdle: { value: 60, version: 0 },
    sessionMax: { value: 8, version: 0 },
    pairingDays: { value: 30, version: 0 },
  },
  businessTimeZone: 'America/Argentina/Buenos_Aires',
};

const empty = { body: { total: 0, changes: {}, examples: [] } };
const holders = {
  body: { roles: [{ id: 'r', name: 'Administrador', people: [] }], grantedBy: [] },
};

export const seller = {
  userId: 'marta',
  name: 'Marta Benítez',
  email: 'marta@example.com',
  roles: [{ id: 'v', name: 'Vendedora' }],
  permissions: ['users.view' as const],
  rolesChangedBy: null,
  rolesChangedAt: null,
};

export function openAdministration(
  routes: Record<string, Reply | Reply[]> = {},
  who: Parameters<typeof me.set>[0] = {
    userId: 'ruben',
    name: 'Rubén Paredes',
    email: 'ruben@example.com',
    ...administrator,
  },
) {
  syncServerTime(now);
  online.set(true);
  me.set(who);
  const server = fakeServer({
    '/api/administration': { body: initial },
    '/api/administration/rounding': empty,
    '/api/permissions/settings.change/holders': holders,
    ...routes,
  });
  render(
    <>
      <div id="app" data-layer="">
        <Administration />
      </div>
      <Toasts />
    </>,
  );
  return server;
}

export const toast = () => document.querySelector('.toast')?.textContent ?? '';
export const tab = (name: RegExp) => screen.getByRole('tab', { name });
export const option = (name: RegExp) =>
  screen
    .getAllByRole('button', { name })
    .find((one) => one.classList.contains('admin-option')) as HTMLElement;
export const saveOf = (key: string) => `/api/administration/settings/${key}`;
