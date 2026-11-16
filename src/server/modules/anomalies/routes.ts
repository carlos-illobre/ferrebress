// Las rutas de las anomalías (06 · R9; diseño de 08, § 3): verlas, marcarlas revisadas y volver a
// abrirlas, todas con «Revisar las anomalías» (R9.3). Cada cambio va a Quién hizo qué (R9.7).
import {
  type AnomaliesPage,
  type AnomalyChanged,
  type AnomalyView,
  anomaliesPageSize,
  anomaliesQuery,
  reviewBody,
} from '@ferrebress/shared/contracts/anomalies';
import type { Context } from 'hono';
import { bySchema, readBody } from '../../platform/guards.ts';
import { fail, uuidParams } from '../../platform/http.ts';
import { sessionOf } from '../../platform/session.ts';
import type { AnomaliesContext } from './context.ts';
import type { AnomalyRow } from './data.ts';
import { noteOf, viewOf } from './rules.ts';
import { anomaliesSettings } from './settings.ts';

// Las filas con el nombre de quien las revisó: un nombre por persona.
async function viewsOf(ctx: AnomaliesContext, rows: AnomalyRow[]): Promise<AnomalyView[]> {
  const ids = [...new Set(rows.flatMap((row) => (row.reviewedBy ? [row.reviewedBy] : [])))];
  const names = new Map<string, string | null>();
  for (const id of ids) names.set(id, await ctx.nameOf(id));
  return rows.map((row) => viewOf(row, names));
}

export function registerRoutes(ctx: AnomaliesContext) {
  const { http, sessions, permissions } = ctx.platform;
  const allowed = permissions.require('anomalies.review');
  const id = uuidParams('id');
  const body = readBody(bySchema(reviewBody));
  const limited = ctx.limit(
    (c) => [`anomalies:session:${sessionOf(c).id}`],
    anomaliesSettings.changes,
  );

  http.get('/api/anomalies', sessions.require, allowed, async (c) => {
    const query = anomaliesQuery.safeParse(c.req.query());
    if (!query.success) return fail(c, 400, 'bad-request');
    const rows = await ctx.data.page(query.data, anomaliesPageSize);
    const shown = rows.slice(0, anomaliesPageSize);
    const next = rows.length > anomaliesPageSize ? shown.at(-1)?.id : undefined;
    return c.json<AnomaliesPage>({
      anomalies: await viewsOf(ctx, shown),
      ...(next && { next }),
    });
  });

  http.post('/api/anomalies/:id/review', sessions.require, allowed, id, limited, body.step, (c) =>
    change(ctx, c, 'anomalies.reviewed', () =>
      ctx.data.review(
        c.req.param('id'),
        sessionOf(c).userId,
        ctx.platform.clock.now(),
        noteOf(body.of(c).note),
      ),
    ),
  );

  http.post('/api/anomalies/:id/reopen', sessions.require, allowed, id, limited, (c) =>
    change(ctx, c, 'anomalies.reopened', () => ctx.data.reopen(c.req.param('id'))),
  );
}

// Un cambio de estado: si no estaba como hacía falta (otro la cambió antes, o se cerró sola), 409 con
// cómo está ahora; si no existe, 404.
async function change(
  ctx: AnomaliesContext,
  c: Context,
  type: 'anomalies.reviewed' | 'anomalies.reopened',
  save: () => Promise<AnomalyRow | undefined>,
) {
  const saved = await save();
  if (!saved) {
    const now = await ctx.data.one(c.req.param('id') as string);
    if (!now) return fail(c, 404, 'not-found');
    const [anomaly] = await viewsOf(ctx, [now]);
    return c.json<AnomalyChanged>(
      { error: 'anomaly-changed', anomaly: anomaly as AnomalyView },
      409,
    );
  }
  await ctx.refresh();
  ctx.record(c, type, {
    targets: [{ kind: 'anomaly', id: saved.id }],
    data: { kind: saved.kind, ...(saved.note && { note: saved.note }) },
  });
  const [anomaly] = await viewsOf(ctx, [saved]);
  return c.json<AnomalyView>(anomaly as AnomalyView);
}
