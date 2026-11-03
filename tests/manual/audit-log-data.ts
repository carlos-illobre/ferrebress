// Lo que contesta el servidor de mentira en las escenas de Quién hizo qué (audit-log-scenes.ts): una
// mañana de la ferretería, con las mismas personas inventadas que el resto de Usuarios.

import type { BrowserContext, Page } from '@playwright/test';
import type {
  AuditDay,
  AuditPage,
  AuditView,
  StripMark,
} from '../../src/shared/contracts/audit-log.ts';
import type { Person } from '../../src/shared/contracts/sign-in.ts';
import { ana, answerUsers, header } from './scenes.ts';

const today = '2026-10-28';
const at = (time: string, day = today) => new Date(`${day}T${time}:00-03:00`).toISOString();
const computer = { phone: false, browser: 'chrome', os: 'windows' };
const phone = { phone: true, browser: 'chrome', os: 'android' };
const anaActor = { kind: 'person' as const, id: ana.userId, name: ana.name };
const lucia = { kind: 'person' as const, id: 'lucia', name: 'Lucía Fernández' };
const pedro = { kind: 'person' as const, id: 'pedro', name: 'Pedro Giménez' };
const martin = { kind: 'person' as const, id: 'martin', name: 'Martín Sosa' };

const action = (
  id: number,
  time: string,
  more: Partial<AuditView> & Pick<AuditView, 'type' | 'actor'>,
  day = today,
): AuditView => ({
  id: `2026:${id}`,
  at: at(time, day),
  tone: 'plain',
  targets: [],
  changes: {},
  data: {},
  device: computer,
  ipAddress: '190.2.10.4',
  ...more,
});

// De la más nueva a la más vieja, como las da el servidor.
const events: AuditView[] = [
  action(9, '11:52', {
    type: 'user.roles-changed',
    tone: 'red',
    actor: anaActor,
    targets: [martin, { kind: 'role', id: 'r-cajero', name: 'Cajero' }],
    changes: { roles: { before: ['Cajero', 'Encargado de turno'], after: ['Encargado de turno'] } },
  }),
  action(8, '11:30', {
    type: 'phone.cut',
    tone: 'red',
    actor: anaActor,
    targets: [lucia],
    data: { sessions: 1, passkey: true },
  }),
  action(7, '10:26', {
    type: 'user.authorized',
    actor: anaActor,
    targets: [pedro],
    data: { roles: ['Vendedor'] },
  }),
  action(6, '09:40', {
    type: 'sign-in.rejected',
    tone: 'amber',
    actor: { kind: 'outsider', email: 'juan.perez@gmail.com' },
    data: { method: 'google', reason: 'unknown' },
    device: phone,
    ipAddress: '181.4.77.20',
  }),
  action(5, '09:05', {
    type: 'role.created',
    actor: anaActor,
    targets: [{ kind: 'role', id: 'r-turno', name: 'Encargado de turno' }],
  }),
  action(4, '08:31', {
    type: 'sign-in.succeeded',
    actor: lucia,
    data: { method: 'google' },
    device: phone,
  }),
  action(3, '08:02', { type: 'sign-in.succeeded', actor: martin, data: { method: 'passkey' } }),
  action(2, '19:10', { type: 'sign-out', actor: martin }, '2026-10-27'),
  action(
    1,
    '18:45',
    { type: 'sign-in.succeeded', actor: lucia, data: { method: 'google' } },
    '2026-10-27',
  ),
];
// El día y la hora del negocio de una acción (Buenos Aires, sin horario de verano).
const local = (event: AuditView) => new Date(Date.parse(event.at) - 3 * 3_600_000);
const dayOf = (event: AuditView) => local(event).toISOString().slice(0, 10);
const seconds = (event: AuditView) =>
  local(event).getUTCHours() * 3600 + local(event).getUTCMinutes() * 60;
const ofToday = events.filter((event) => dayOf(event) === today);
const count = (list: AuditView[], tone: string) =>
  list.filter((event) => event.tone === tone).length;

const pageOf = (shown: AuditView[]): AuditPage => ({
  today,
  total: shown.length,
  page: 1,
  pages: 1,
  days: Object.fromEntries(
    [...new Set(shown.map(dayOf))].map((day) => [
      day,
      shown.filter((event) => dayOf(event) === day).length,
    ]),
  ),
  events: shown,
  summary: { total: ofToday.length, amber: count(ofToday, 'amber'), red: count(ofToday, 'red') },
  strip: ofToday
    .toReversed()
    .map((event): StripMark => ({ id: event.id, at: seconds(event), tone: event.tone })),
});

// La semana de la cinta: los días anteriores, con cantidades inventadas.
const week = [12, 9, 0, 15, 11, 2].map((total, back) => ({
  date: `2026-10-${String(22 + back).padStart(2, '0')}`,
  total,
  amber: back === 3 ? 1 : 0,
  red: back === 1 ? 1 : 0,
}));
const day: AuditDay = {
  date: today,
  today,
  week: [
    ...week,
    {
      date: today,
      total: ofToday.length,
      amber: count(ofToday, 'amber'),
      red: count(ofToday, 'red'),
    },
  ],
  events: ofToday.toReversed(),
};

const people = {
  people: [
    { id: ana.userId, name: ana.name, email: ana.email, state: 'active' },
    { id: 'lucia', name: 'Lucía Fernández', email: 'lucia@example.com', state: 'active' },
    { id: 'martin', name: 'Martín Sosa', email: 'martin@example.com', state: 'active' },
    { id: 'pedro', name: 'Pedro Giménez', email: 'pedro@example.com', state: 'active' },
  ],
};

// Lo que contesta el servidor de mentira: con «Hecho por», solo lo de esa persona.
export async function answerAuditLog(page: Page | BrowserContext, person: Person): Promise<void> {
  await answerUsers(page, person);
  await page.route('**/api/audit-log**', (route) => {
    const url = new URL(route.request().url());
    const by = url.searchParams.get('by');
    const json =
      url.pathname === '/api/audit-log/people'
        ? people
        : url.pathname === '/api/audit-log/day'
          ? day
          : pageOf(
              by
                ? events.filter((event) => event.actor.kind === 'person' && event.actor.id === by)
                : events,
            );
    return route.fulfill({ json, headers: header() });
  });
}
