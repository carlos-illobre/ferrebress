// Lo que comparten las pruebas de Quién hizo qué: acciones inventadas (correos @example.com) y la
// pestaña montada con un servidor de mentira, en la computadora o en el celular.
import type { AuditPage, AuditView } from '@ferrebress/shared/contracts/audit-log';
import { render } from '@testing-library/preact';
import { vi } from 'vitest';
import { syncServerTime } from '../../platform/server/clock.ts';
import { fakeServer, type Reply } from '../../testing/fake-server.ts';
import { Toasts } from '../../ui/toast/Toast.tsx';
import { AuditLog } from './screens/AuditLog.tsx';

export const now = Date.parse('2026-10-28T15:00:00Z');
const at = (time: string, day = '2026-10-28') => new Date(`${day}T${time}:00-03:00`).toISOString();
export const ana = { kind: 'person' as const, id: 'ana', name: 'Ana Gómez' };
export const martin = {
  kind: 'person' as const,
  id: 'martin',
  name: 'Martín',
  today: 'Martín Sosa',
};

const base = (
  id: string,
  time: string,
  type: string,
  more: Partial<AuditView> = {},
): AuditView => ({
  id,
  at: at(time),
  type,
  tone: 'plain',
  actor: ana,
  targets: [],
  changes: {},
  data: {},
  device: { phone: false, browser: 'chrome', os: 'windows' },
  ipAddress: '190.0.0.1',
  ...more,
});

export const events: AuditView[] = [
  base('2026:5', '11:52', 'user.roles-changed', {
    tone: 'red',
    targets: [martin],
    changes: { roles: { before: ['Cajero', 'Encargado'], after: ['Encargado'] } },
  }),
  base('2026:4', '11:31', 'sign-in.rejected', {
    tone: 'amber',
    actor: { kind: 'outsider', email: '<b>jefe</b>@example.com' },
    data: { reason: 'unknown' },
    device: { phone: true, os: 'android' },
  }),
  base('2026:3', '11:02', 'role.changed', {
    targets: [{ kind: 'role', id: 'r1', name: 'Encargado' }],
    changes: {
      permissions: { before: ['users.view', 'viejo.permiso'], after: [] },
      description: { before: null, after: 'Para el turno' },
      otra: { before: 'a', after: 'b' },
    },
    truncated: true,
  }),
  base('2026:2', '09:40', 'sign-in.offline-rejected', {
    tone: 'amber',
    actor: martin,
    deviceTime: at('08:55'),
    arrivedAt: at('09:40'),
  }),
  {
    ...base('2026:1', '19:00', 'session.ended', {
      actor: { kind: 'system' },
      targets: [
        { kind: 'person', id: 'pedro', today: 'Pedro' },
        { kind: 'person', id: 'nadie' },
      ],
    }),
    at: at('19:00', '2026-10-27'),
  },
];
delete (events[4] as Partial<AuditView>).device;
delete (events[4] as Partial<AuditView>).ipAddress;

export const page = (more: Partial<AuditPage> = {}): AuditPage => ({
  today: '2026-10-28',
  total: 25,
  page: 1,
  pages: 2,
  days: { '2026-10-28': 4, '2026-10-27': 21 },
  events,
  summary: { total: 4, amber: 2, red: 1 },
  strip: [
    { id: '2026:2', at: 9 * 3600 + 40 * 60, tone: 'amber' },
    { id: '2026:5', at: 11 * 3600 + 52 * 60, tone: 'red' },
  ],
  ...more,
});

export const people = {
  people: [
    { id: 'ana', name: 'Ana Gómez', email: 'ana@example.com', state: 'active' },
    { id: 'martin', name: 'Martín Sosa', email: 'martin@example.com', state: 'active' },
    { id: 'lucia', name: 'Lucía', email: 'lucia@example.com', state: 'deactivated' },
    { id: 'camila', name: 'Camila', state: 'deleted' },
  ],
};

export const first = '/api/audit-log?page=1&size=20&summary=1&strip=1';
export const firstPhone = '/api/audit-log?page=1&size=10&summary=1';

// `phone`: como en lo angosto, de a 10 y con el detalle en una hoja.
export function openAuditLog(routes: Record<string, Reply | Reply[]> = {}, phone = false) {
  syncServerTime(now);
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: phone && query.includes('max-width'),
    media: query,
  }));
  const server = fakeServer({
    '/api/audit-log/people': { body: people },
    [first]: { body: page() },
    [firstPhone]: { body: (({ strip: _strip, ...rest }) => rest)(page()) },
    ...routes,
  });
  render(
    <>
      <div id="app" data-layer="">
        <AuditLog />
      </div>
      <Toasts />
    </>,
  );
  return server;
}

export const rows = () => [...document.querySelectorAll<HTMLElement>('.audit-row')];
export const detail = () => document.querySelector('.audit-detail-body')?.textContent ?? '';
