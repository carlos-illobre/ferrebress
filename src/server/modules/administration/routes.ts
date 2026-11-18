// Las rutas de Administración (diseño de 06, § 3): ver los ajustes y el panel del redondeo, con
// sesión y sin permiso (R1.2); cambiar uno, con «Cambiar los ajustes» (R1.4, R1.5).
import {
  type AdministrationResponse,
  type ConfirmPrices,
  type SaveSettingBody,
  type SaveSettingResponse,
  type SettingChanged,
  type SettingKey,
  saveSettingBody,
  settingKeyOf,
  settingValue,
} from '@ferrebress/shared/contracts/administration';
import { businessTimeZone } from '@ferrebress/shared/time/business';
import type { Context, MiddlewareHandler } from 'hono';
import type { Kysely } from 'kysely';
import { bySchema, readBody } from '../../platform/guards.ts';
import { fail, Refused } from '../../platform/http.ts';
import { permissionsOf } from '../../platform/permissions.ts';
import { sessionOf } from '../../platform/session.ts';
import type { AdministrationContext } from './context.ts';
import { type AdministrationTables, administrationData } from './data.ts';
import { checkChange } from './rules.ts';
import { administrationSettings } from './settings.ts';

// Cambiar el redondeo recalcula todos los precios: además, su propio límite (diseño de 07, § 9).
const roundingLimit =
  (ctx: AdministrationContext): MiddlewareHandler =>
  async (c, next) =>
    c.req.param('key') === 'roundingStep'
      ? (ctx.throttle(
          c,
          [`rounding-change:session:${sessionOf(c).id}`],
          administrationSettings.rounding,
        ) ?? (await next()))
      : next();

export function registerRoutes(ctx: AdministrationContext) {
  const { http, sessions, permissions } = ctx.platform;
  const body = readBody(bySchema(saveSettingBody));
  const limited = ctx.limit(
    (c) => [`settings:session:${sessionOf(c).id}`],
    administrationSettings.changes,
  );
  // La clave se busca en la lista fija; otra no existe (diseño de 06, § 3).
  const knownKey: MiddlewareHandler = async (c, next) =>
    settingKeyOf(c.req.param('key') as string) ? next() : fail(c, 404, 'not-found');

  http.get('/api/administration', sessions.require, (c) =>
    c.json<AdministrationResponse>({
      settings: ctx.memory.states(),
      businessTimeZone: businessTimeZone(),
    }),
  );

  // Los ejemplos de verdad, solo para quien ve los costos (R3.7). Con su límite: cuenta en la base.
  http.get(
    '/api/administration/rounding',
    sessions.require,
    ctx.limit((c) => [`rounding:session:${sessionOf(c).id}`], administrationSettings.rounding),
    async (c) =>
      c.json(await ctx.recalculator.preview(permissionsOf(c).includes('price-lists.costs'))),
  );

  http.post(
    '/api/administration/settings/:key',
    sessions.require,
    permissions.require('settings.change'),
    knownKey,
    limited,
    roundingLimit(ctx),
    body.step,
    async (c) =>
      change(ctx, c, settingKeyOf(c.req.param('key') as string) as SettingKey, body.of(c)),
  );
}

async function change(
  ctx: AdministrationContext,
  c: Context,
  key: SettingKey,
  { value: raw, version, confirmed }: SaveSettingBody,
) {
  const before = ctx.memory.states()[key];
  const rounding = key === 'roundingStep';
  // Se cuenta solo un paso que vale: uno inválido no llega a quien recalcula.
  const valid = settingValue(key, raw) !== undefined;
  const prices = rounding && valid ? await ctx.recalculator.changesWith(Number(raw)) : 0;
  const check = checkChange(key, raw, before.value, prices, confirmed);
  if (check.kind === 'invalid') return fail(c, 400, 'invalid-setting', { key });
  if (check.kind === 'confirm')
    return c.json<ConfirmPrices & { error: string }>({ error: 'confirm-prices', prices }, 409);
  if (check.kind === 'same') return c.json<SaveSettingResponse>(before);
  const { userId } = sessionOf(c);
  const { saved, changed } = await saveIn(
    ctx,
    { key, value: check.value, version, prices },
    userId,
  );
  if (saved === undefined) return changedBy(ctx, c, key);
  const after = { value: check.value, version: saved };
  ctx.memory.put(key, after);
  ctx.record(c, 'settings.changed', {
    changes: { value: { before: before.value, after: after.value } },
    // El paso se anota en centavos (T136): los anotados antes, en pesos, se leen distinto.
    data: { key, ...(rounding && { prices: changed, cents: true }) },
  });
  return c.json<SaveSettingResponse>(after);
}

// Guarda con la versión que se vio y, en el redondeo, recalcula en la misma transacción: si el
// recálculo falla, la transacción se deshace y no cambia nada (R3.5, E22); si cambiaron otros precios
// que los que se confirmaron (alguien cambió costos en el medio), también, y se vuelve a preguntar
// con el número de ahora (R3.4, E41). Devuelve cuántos cambiaron de verdad, para Quién hizo qué.
function saveIn(
  ctx: AdministrationContext,
  change: { key: SettingKey; value: unknown; version: number; prices: number },
  userId: string,
): Promise<{ saved: number | undefined; changed: number }> {
  const { key, value, version, prices } = change;
  return ctx.platform.db.transaction().execute(async (trx) => {
    const data = administrationData(trx as Kysely<AdministrationTables>);
    const saved = await data.save(key, value, version, userId);
    if (saved === undefined || key !== 'roundingStep') return { saved, changed: 0 };
    const changed = await ctx.recalculator.apply(Number(value), trx).catch((error: unknown) => {
      console.error(error);
      throw new Refused(503, 'recalc-failed');
    });
    if (changed !== prices) throw new Refused(409, 'confirm-prices', { prices: changed });
    return { saved, changed };
  });
}

// Otro lo cambió antes (R2.3, E12): el valor de ahora, su versión y quién. Sin fila, nadie lo cambió
// y la versión que se mandó no era la de arranque.
async function changedBy(ctx: AdministrationContext, c: Context, key: SettingKey) {
  const now = ctx.memory.states()[key];
  const by = await ctx.data.changedBy(key);
  const name = by ? ((await ctx.nameOf(by)) ?? '') : '';
  return c.json<SettingChanged & { error: string }>(
    { error: 'setting-changed', ...now, by: name },
    409,
  );
}
