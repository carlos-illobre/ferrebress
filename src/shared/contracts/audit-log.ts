// Quién hizo qué (capítulo 05, diseño de 05, § 5): lo que piden y devuelven sus rutas. Lo comparten
// el servidor, que lo valida, y la aplicación, que lo muestra.
import * as z from 'zod/mini';
import { isBusinessDate } from '../time/business.ts';

export type ToneName = 'plain' | 'amber' | 'red';

export type ActorView =
  | { kind: 'person'; id: string; name?: string; today?: string }
  | { kind: 'system' }
  | { kind: 'outsider'; email?: string };

// `today`: el nombre de hoy, solo si es distinto del de ese momento (05 · R2.3).
export type TargetView = { kind: string; id: string; name?: string; today?: string };

export type DeviceView = { phone: boolean; browser?: string; os?: string };

export type AuditView = {
  id: string;
  at: string;
  arrivedAt?: string;
  deviceTime?: string;
  type: string;
  tone: ToneName;
  actor: ActorView;
  targets: TargetView[];
  changes: Record<string, { before: unknown; after: unknown }>;
  data: Record<string, unknown>;
  device?: DeviceView;
  ipAddress?: string;
  truncated?: true;
};

export type Summary = { total: number; amber: number; red: number };

// Una raya de la tira: `at` en segundos desde el comienzo del día del negocio.
export type StripMark = { id: string; at: number; tone: ToneName };

export type AuditPage = {
  today: string;
  // La última fila de cada archivo vivo, sin filtros: desde dónde contar las nuevas (diseño de 05, § 5).
  latest: string;
  // Si el período de las fechas incluye hoy: el selector «Actualizar solo» (R4.6).
  withToday: boolean;
  total: number;
  page: number;
  pages: number;
  days: Record<string, number>;
  events: AuditView[];
  summary?: Summary;
  strip?: StripMark[];
};

export type DayCount = Summary & { date: string };

export type AuditDay = {
  date: string;
  today: string;
  week: DayCount[];
  events?: AuditView[];
  tooMany?: number;
};

export type PersonState = 'active' | 'deactivated' | 'deleted';
export type AuditPerson = { id: string; name: string; email?: string; state: PersonState };
export type AuditPeople = { people: AuditPerson[] };

export const pageSizes = [10, 20] as const;
export const ranges = ['today', 'yesterday', 'week', 'month'] as const;
export type Range = (typeof ranges)[number];

const uuid = z.string().check(z.regex(/^[0-9a-f-]{36}$/i));
const date = z.string().check(z.refine(isBusinessDate));
const counting = z.string().check(z.regex(/^[1-9]\d{0,5}$/));

// Lo que se puede pedir de la lista (§ 5): todo opcional, todo texto de la dirección. Cualquier
// otro parámetro es un error (E39).
export const auditQuery = z.strictObject({
  page: z.optional(counting),
  size: z.optional(z.enum(['10', '20'])),
  by: z.optional(z.union([uuid, z.enum(['system', 'outsider'])])),
  to: z.optional(uuid),
  range: z.optional(z.enum(ranges)),
  from: z.optional(date),
  until: z.optional(date),
  group: z.optional(z.string().check(z.maxLength(40))),
  type: z.optional(z.string().check(z.maxLength(60))),
  tone: z.optional(z.enum(['amber', 'red'])),
  summary: z.optional(z.literal('1')),
  strip: z.optional(z.literal('1')),
});
export type AuditQuery = z.infer<typeof auditQuery>;

export const dayQuery = z.strictObject({ date: z.optional(date) });

// «Actualizar solo» (R4.6; diseño de 05, § 7): el tema del canal, que avisa sin datos, y cuántas
// llegaron desde `latest` con los filtros de la lista.
export const auditLiveTopic = 'audit-log.new';
// El aviso no dice qué ni cuántas: `subscribed` es el que manda al empezar a escuchar (para ponerse al
// día al volver), sin él, que se anotó algo.
export type AuditLiveEvent = { subscribed?: true };
export const newOnesQuery = z.strictObject({
  ...z.omit(auditQuery, { page: true, size: true, summary: true, strip: true }).shape,
  since: z.string().check(z.regex(/^\d{4}:\d{1,16}\.\d{4}:\d{1,16}$/)),
});
export type NewOnesQuery = z.infer<typeof newOnesQuery>;
export type AuditNewOnes = { count: number };
