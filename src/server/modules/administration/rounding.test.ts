// Cambiar el redondeo (06 · R3.4, R3.5; diseño de 06, § 3), con un recalculador de mentira en lugar
// del catálogo: pide confirmar cuántos precios cambian, recalcula en la misma transacción y es todo o
// nada.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, type RolesKit } from '../../testing/users/roles-kit.ts';
import type { PriceRecalculator } from './recalculator.ts';

describe('cambiar el redondeo', () => {
  let kit: RolesKit;
  // Cuántos precios cambian con cada paso; `fail` hace fallar el próximo recálculo.
  const fake = { changes: new Map([[500, 1650]]), applied: [] as number[], fail: false };
  const recalculator: PriceRecalculator = {
    preview: async () => ({
      total: 3486,
      changes: Object.fromEntries(fake.changes),
      examples: [{ name: 'Martillo carpintero', calculated: 15_001 }],
    }),
    changesWith: async (step) => fake.changes.get(step) ?? 0,
    apply: async (step) => {
      if (fake.fail) throw new Error('la base se cayó');
      fake.applied.push(step);
      return fake.changes.get(step) ?? 0;
    },
  };

  beforeAll(async () => {
    kit = await createRolesKit({ recalculator });
  });
  afterAll(() => kit.server.close());

  const save = (body: object) =>
    kit.admin.request('/api/administration/settings/roundingStep', body);
  const step = () => kit.server.administration.settings().roundingStep;

  it('el panel muestra lo que dice quien recalcula, a cualquiera con sesión', async () => {
    expect((await kit.admin.request('/api/administration/rounding')).body).toEqual({
      total: 3486,
      changes: { 500: 1650 },
      examples: [{ name: 'Martillo carpintero', calculated: 15_001 }],
    });
  });

  it('administration-E18: si cambian precios, antes de guardar dice cuántos', async () => {
    expect(await save({ value: 500, version: 0 })).toMatchObject({
      status: 409,
      body: { error: 'confirm-prices', prices: 1650 },
    });
    expect(step()).toBe(1000);
    expect(fake.applied).toEqual([]);
  });

  it('administration-E41: si el número cambió entre que se vio y se confirmó, vuelve a preguntar', async () => {
    fake.changes.set(500, 1700);
    expect(await save({ value: 500, version: 0, confirmed: 1650 })).toMatchObject({
      status: 409,
      body: { error: 'confirm-prices', prices: 1700 },
    });
    expect(step()).toBe(1000);
  });

  it('administration-E22: si el recálculo falla, no cambia ni el paso ni ningún precio', async () => {
    fake.fail = true;
    expect(await save({ value: 500, version: 0, confirmed: 1700 })).toMatchObject({
      status: 503,
      body: { error: 'recalc-failed' },
    });
    expect(step()).toBe(1000);
    expect((await kit.admin.request('/api/administration')).body.settings.roundingStep).toEqual({
      value: 1000,
      version: 0,
    });
    fake.fail = false;
  });

  it('administration-E19: confirmado, recalcula y queda con cuántos precios cambiaron', async () => {
    const saved = await save({ value: 500, version: 0, confirmed: 1700 });
    expect(saved).toMatchObject({ status: 200, body: { value: 500, version: 1 } });
    expect(step()).toBe(500);
    expect(fake.applied).toEqual([500]);
    expect(kit.audited('settings.changed').at(-1)).toMatchObject({
      changes: { value: { before: 1000, after: 500 } },
      data: { key: 'roundingStep', prices: 1700 },
    });
  });

  it('administration-E21: si no cambia ningún precio, se guarda sin preguntar', async () => {
    const saved = await save({ value: 5000, version: 1 });
    expect(saved).toMatchObject({ status: 200, body: { value: 5000, version: 2 } });
    expect(fake.applied).toEqual([500, 5000]);
  });

  it('administration-E24: un paso que no está en la lista no se guarda', async () => {
    expect(await save({ value: 300, version: 2 })).toMatchObject({
      status: 400,
      body: { error: 'invalid-setting' },
    });
  });

  it('con una versión vieja no recalcula: el choque se dice antes', async () => {
    const applied = fake.applied.length;
    expect((await save({ value: 10, version: 1 })).status).toBe(409);
    expect(fake.applied).toHaveLength(applied);
  });
});

describe('sin catálogo', () => {
  it('administration-E21: no hay precios; el panel lo dice y el redondeo se guarda solo', async () => {
    const kit = await createRolesKit();
    expect((await kit.admin.request('/api/administration/rounding')).body).toEqual({
      total: 0,
      changes: {},
      examples: [],
    });
    const saved = await kit.admin.request('/api/administration/settings/roundingStep', {
      value: 100,
      version: 0,
    });
    expect(saved).toMatchObject({ status: 200, body: { value: 100, version: 1 } });
    await kit.server.close();
  });
});
