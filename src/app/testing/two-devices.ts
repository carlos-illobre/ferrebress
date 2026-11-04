// Dos dispositivos enteros para probar el vínculo: cada uno con su vínculo, su espejo, su diario y su
// tira, contra el servidor y el Wi-Fi de mentira. Lo que `api()` responde cambia `online`, como en la
// aplicación.
import type { Side } from '@ferrebress/shared/contracts/device-link';
import { expect, vi } from 'vitest';
import * as z from 'zod/mini';
import { createJournal } from '../modules/device-link/journal.ts';
import { createRuntime, type Deps } from '../modules/device-link/runtime.ts';
import { createStrip } from '../modules/device-link/strip.ts';
import { createMirror } from '../platform/mirror/registry.ts';
import { createStore } from '../platform/store.ts';
import { createLinkServer } from './device-link-server.ts';
import { createWifi } from './wifi.ts';

type Server = ReturnType<typeof createLinkServer>;
type Wifi = ReturnType<typeof createWifi>;

export function device(side: Side, server: Server, wifi: Wifi, appVersion = 'v1') {
  const mirror = createMirror();
  const value = mirror.register('test.screen.text', 'inicial', z.string());
  const journal = createJournal({ every: () => () => undefined });
  const strip = createStrip({ owner: side, now: () => Date.now() });
  const online = createStore(true);
  const api = server.api(side);
  const runtime = createRuntime({
    api: (async (path: string, body?: unknown) => {
      const result = await api(path, body);
      online.set(result.ok || result.error !== 'offline');
      return result;
    }) as Deps['api'],
    want: server.want(side),
    mirror,
    rtc: wifi.rtc(side === 'computer' ? 'PC' : 'CE'),
    online,
    appVersion,
    outdated: () => appVersion !== 'v2',
    journal,
    strip: () => strip,
  });
  const kind = () => runtime.state.get().kind;
  const start = () => runtime.dispatch({ type: 'serverSaid', pairing: server.view(side) });
  const notes = () => journal.entries().map((entry) => entry.e);
  return { runtime, mirror, value, journal, online, kind, start, notes, strip };
}

export type Device = ReturnType<typeof device>;

const running: Device[] = [];

export function setupDevices(versions: [string, string] = ['v1', 'v1']) {
  const server = createLinkServer();
  const wifi = createWifi();
  const pc = device('computer', server, wifi, versions[0]);
  const phone = device('phone', server, wifi, versions[1]);
  running.push(pc, phone);
  const add = (one: Device) => running.push(one);
  return { server, wifi, pc, phone, add };
}

export function stopDevices() {
  for (const one of running.splice(0)) {
    one.runtime.stop();
    one.journal.stop();
  }
}

// La computadora entra primero, después el celular, y los dos quedan conectados.
export async function together(pc: Device, phone: Device, kind = 'direct') {
  pc.start();
  await vi.waitFor(() => expect(pc.kind()).toBe('waiting'));
  phone.start();
  await vi.waitFor(() => {
    expect(pc.kind()).toBe(kind);
    expect(phone.kind()).toBe(kind);
  });
}

export const pause = (ms: number) => new Promise((settled) => setTimeout(settled, ms));
