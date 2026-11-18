// El avance de una lista (08 · R4.9; diseño de 08, § 6): el tema `price-lists.list`, en la forma
// `temporary` (ADR-003): llega en el momento y el canal está abierto solo mientras una pantalla espera.
// Lo escucha quien tiene «Ver costos»; al suscribirse, el estado de ahora.
import { type ListProgress, listStatuses } from '@ferrebress/shared/contracts/price-lists';
import * as z from 'zod/mini';
import type { Platform } from '../../platform/modules.ts';
import type { RequestSession } from '../../platform/session.ts';
import { asDb } from './data/db.ts';
import { type ListRecord, readingData } from './data/reading.ts';
import { progressOf } from './rules/lists.ts';
import { priceListsSettings } from './settings.ts';

export const listTopic = 'price-lists.list';
const permission = 'price-lists.costs';

const progress = z.strictObject({
  status: z.enum(listStatuses),
  waitingFor: z.optional(z.enum(['supplier', 'size'])),
  rowsRead: z.int(),
  applied: z.optional(z.int()),
  rowsTotal: z.optional(z.int()),
  reason: z.optional(z.string()),
});

// A lo sumo un aviso cada `progressMs` por lista: lo que llega en el medio espera y sale el último. Un
// cambio de estado o de lo que espera sale enseguida.
function throttled(publish: (listId: string, progress: ListProgress) => void) {
  const last = new Map<string, { at: number; progress: ListProgress; timer?: NodeJS.Timeout }>();
  const now = (listId: string, progress: ListProgress) => {
    clearTimeout(last.get(listId)?.timer);
    last.set(listId, { at: Date.now(), progress });
    publish(listId, progress);
  };
  return (listId: string, progress: ListProgress) => {
    const before = last.get(listId);
    const changed =
      !before ||
      before.progress.status !== progress.status ||
      before.progress.waitingFor !== progress.waitingFor;
    const wait = before ? before.at + priceListsSettings.progressMs - Date.now() : 0;
    if (changed || wait <= 0) return now(listId, progress);
    clearTimeout(before.timer);
    before.timer = setTimeout(() => now(listId, progress), wait);
  };
}

export function registerListTopic(platform: Platform) {
  const { realtime, permissions } = platform;
  const data = readingData(asDb(platform.db));
  realtime.topic({
    name: listTopic,
    param: z.string().check(z.regex(/^[0-9a-f-]{36}$/)),
    event: progress,
    authorize: async ({ session, request }, listId) => {
      const { userId } = session as RequestSession;
      if ((await permissions.of(userId)).includes(permission)) return { key: listId };
      if (request) permissions.noteDenied(request, userId, permission, { topic: listTopic });
      return { refused: 'forbidden' };
    },
    onSubscribe: async (listId, send) => {
      const list = await data.one(listId);
      if (list) send(progressOf(list));
    },
    recheckOn: ['users.permissions-changed'],
  });
  const send = throttled((listId, now) => realtime.publish(listTopic, listId, now));
  return {
    // Avisa el avance de una lista a quien la mira. Las listas no se borran: la que se avisa existe.
    publish: async (listId: string) => {
      const list = (await data.one(listId)) as ListRecord;
      send(listId, progressOf(list));
    },
    // Mientras se aplica, sin consultar la base (la tiene la transacción que aplica).
    progress: (listId: string, progress: ListProgress) => send(listId, progress),
  };
}
