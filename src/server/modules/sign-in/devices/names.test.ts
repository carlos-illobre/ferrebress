// Los nombres en memoria (diseño de 04b, § 2): se cargan al arrancar, los usados hace menos tiempo
// primero, y con el tope lleno se olvida el que hace más que no cambia.
import type { Kysely } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSignInServer, type SignInServer } from '../../../testing/sign-in/sign-in-server.ts';
import { signInSettings } from '../settings.ts';
import type { DevicesTables } from './data.ts';
import { createDeviceNames } from './names.ts';

const ids = ['a', 'b', 'c'].map((letter) => `0192d3a4-1b2c-7d3e-8f40-00000000000${letter}`);

describe('los nombres de los dispositivos, en memoria', () => {
  let server: SignInServer;
  const { devices } = signInSettings;
  const max = devices.maxInMemory;

  beforeAll(async () => {
    server = await createSignInServer();
    const db = server.platform.db as Kysely<DevicesTables>;
    await db
      .insertInto('sign_in.devices')
      .values([
        { device_id: ids[0] as string, name: 'Viejo', last_seen_at: new Date('2026-01-01') },
        { device_id: ids[1] as string, name: 'Caja', last_seen_at: new Date('2026-11-01') },
        { device_id: ids[2] as string, name: null, last_seen_at: new Date('2026-11-02') },
      ])
      .execute();
  });
  afterAll(() => {
    devices.maxInMemory = max;
    return server.close();
  });

  it('al arrancar carga los que tienen nombre; con el tope, los usados hace menos', async () => {
    const all = createDeviceNames(server.platform);
    await all.load();
    expect(ids.map(all.nameOf)).toEqual(['Viejo', 'Caja', undefined]);
    expect(all.othersThan(ids[1] as string)).toEqual(['Viejo']);
    devices.maxInMemory = 1;
    const few = createDeviceNames(server.platform);
    await few.load();
    expect(ids.map(few.nameOf)).toEqual([undefined, 'Caja', undefined]);
    // Uno nuevo con el tope lleno hace olvidar el que hace más que no cambia.
    await few.rename(ids[2] as string, 'Depósito');
    expect(ids.map(few.nameOf)).toEqual([undefined, undefined, 'Depósito']);
  });
});
