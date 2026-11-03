// Las acciones inventadas de Quién hizo qué para las escenas: un día del local, con entradas,
// cambios de Usuarios y de Roles, rechazos y una entrada sin conexión sin confirmar (05 · R4).
import type { AuditPage, AuditPeople, AuditView } from '../../src/shared/contracts/audit-log.ts';

const at = (hhmm: string, day = '2026-10-28') => new Date(`${day}T${hhmm}:00-03:00`).toISOString();
const person = (id: string, name: string, today?: string) => ({
  kind: 'person' as const,
  id,
  name,
  ...(today && { today }),
});
const ana = person('u1', 'Ana Gómez');
const lucia = person('lucia', 'Lucía Fernández');
const martin = person('martin', 'Martín', 'Martín Sosa');
const pedro = person('pedro', 'Pedro Giménez');
const phone = { phone: true, browser: 'chrome', os: 'android' };
const computer = { phone: false, browser: 'chrome', os: 'windows' };

let next = 100;
const event = (
  time: string,
  type: string,
  fields: Partial<AuditView> & Pick<AuditView, 'actor'>,
  day?: string,
): AuditView => ({
  id: `2026:${next--}`,
  at: at(time, day),
  type,
  tone: 'plain',
  targets: [],
  changes: {},
  data: {},
  device: computer,
  ipAddress: '190.18.44.7',
  ...fields,
});

export const auditEvents: AuditView[] = [
  event('11:52', 'user.roles-changed', {
    actor: ana,
    tone: 'red',
    targets: [martin],
    changes: { roles: { before: ['Cajero', 'Encargado'], after: ['Encargado'] } },
  }),
  event('11:40', 'role.changed', {
    actor: ana,
    targets: [{ kind: 'role', id: 'r1', name: 'Encargado' }],
    changes: { permissions: { before: ['users.view'], after: ['users.view', 'users.cut'] } },
  }),
  event('11:31', 'sign-in.rejected', {
    actor: { kind: 'outsider', email: 'jefe.local@ejemplo.com' },
    tone: 'amber',
    data: { method: 'google', reason: 'unknown' },
    device: phone,
  }),
  event('11:20', 'user.deactivated', { actor: ana, tone: 'red', targets: [lucia] }),
  event('11:02', 'user.renamed', {
    actor: ana,
    targets: [martin],
    changes: { name: { before: 'Martín', after: 'Martín Sosa' } },
  }),
  event('10:48', 'permission.denied', {
    actor: pedro,
    tone: 'amber',
    data: { permission: 'roles.manage' },
  }),
  event('10:30', 'sign-in.succeeded', { actor: pedro, data: { method: 'google' } }),
  event('10:05', 'user.authorized', {
    actor: ana,
    targets: [pedro],
    data: { roles: ['Vendedor'] },
  }),
  event('09:40', 'sign-in.offline-rejected', {
    actor: martin,
    tone: 'amber',
    deviceTime: at('08:55'),
    arrivedAt: at('09:40'),
    device: phone,
  }),
  event('09:12', 'passkey.linked', { actor: lucia, device: phone }),
  event('09:10', 'sign-in.succeeded', { actor: lucia, data: { method: 'passkey' }, device: phone }),
  event('08:31', 'sign-in.succeeded', { actor: ana, data: { method: 'google' } }),
  event('08:30', 'role.permissions-added', { actor: { kind: 'system' }, device: undefined as never }),
  event('19:58', 'sign-out', { actor: ana }, '2026-10-27'),
  event('19:30', 'phone.cut', { actor: ana, tone: 'red', targets: [lucia] }, '2026-10-27'),
  event('18:12', 'role.created', {
    actor: ana,
    targets: [{ kind: 'role', id: 'r2', name: 'Depósito' }],
  }, '2026-10-27'),
  event('17:40', 'session.ended', {
    actor: { kind: 'system' },
    targets: [martin],
    data: { reason: 'idle' },
  }, '2026-10-27'),
  event('16:02', 'request.throttled', {
    actor: { kind: 'outsider' },
    tone: 'amber',
    data: { topic: 'sign-in', by: 'ip' },
  }, '2026-10-27'),
  event('15:44', 'code.approved', { actor: martin, device: phone }, '2026-10-27'),
  event('15:20', 'sessions.closed-all', { actor: ana, tone: 'red', targets: [martin] }, '2026-10-27'),
  event('14:55', 'user.email-changed', {
    actor: ana,
    targets: [pedro],
    changes: { email: { before: 'pedro@ejemplo.com', after: 'pedro.gimenez@ejemplo.com' } },
  }, '2026-10-27'),
  event('14:30', 'sign-in.succeeded', { actor: martin, data: { method: 'qr' } }, '2026-10-27'),
].map((one) => (one.device === undefined ? (({ device: _d, ...rest }) => rest)(one) : one));

const today = auditEvents.filter((one) => one.at >= at('00:00'));
const tones = (list: AuditView[]) => ({
  total: list.length,
  amber: list.filter((one) => one.tone === 'amber').length,
  red: list.filter((one) => one.tone === 'red').length,
});
const midnight = Date.parse(at('00:00'));

export const auditPage = (size: number): AuditPage => ({
  today: '2026-10-28',
  total: auditEvents.length,
  page: 1,
  pages: Math.ceil(auditEvents.length / size),
  days: { '2026-10-28': today.length, '2026-10-27': auditEvents.length - today.length },
  events: auditEvents.slice(0, size),
  summary: tones(today),
  strip: today
    .map((one) => ({ id: one.id, at: Math.floor((Date.parse(one.at) - midnight) / 1000), tone: one.tone }))
    .reverse(),
});

export const auditPeople: AuditPeople = {
  people: [
    { id: 'u1', name: 'Ana Gómez', email: 'ana@example.com', state: 'active' },
    { id: 'lucia', name: 'Lucía Fernández', email: 'lucia@example.com', state: 'deactivated' },
    { id: 'martin', name: 'Martín Sosa', email: 'martin@example.com', state: 'active' },
    { id: 'pedro', name: 'Pedro Giménez', email: 'pedro@example.com', state: 'active' },
    { id: 'camila', name: 'Camila Ruiz', state: 'deleted' },
  ],
};

export const auditDay = {
  date: '2026-10-28',
  today: '2026-10-28',
  week: ['22', '23', '24', '25', '26', '27', '28'].map((d, i) => ({
    date: `2026-10-${d}`,
    total: [0, 12, 8, 3, 0, 9, today.length][i] as number,
    amber: [0, 1, 0, 0, 0, 1, 3][i] as number,
    red: [0, 0, 1, 0, 0, 2, 2][i] as number,
  })),
  events: today.toReversed(),
};
