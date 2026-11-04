// Un `Live` de mentira para probar las piezas del vínculo vivo una por una, y una conexión de mentira
// con lo que manda y cómo entregarle lo que llega.
import { vi } from 'vitest';
import { createConfirm } from '../modules/device-link/confirm.ts';
import type { PairingEvent, PairingState } from '../modules/device-link/machine/types.ts';
import type { Live } from '../modules/device-link/runtime/live.ts';
import { listen } from '../modules/device-link/runtime/messages.ts';
import type { Deps } from '../modules/device-link/runtime.ts';
import { createSnapAssembler } from '../modules/device-link/wire.ts';
import { createMirror } from '../platform/mirror/registry.ts';
import { createTransport } from '../platform/peer/transport.ts';
import { createStore } from '../platform/store.ts';
import { pc } from './pairing.ts';
import { createWifi } from './wifi.ts';

export function fakeLive(
  state: PairingState,
  api: Deps['api'] = vi.fn().mockResolvedValue({ ok: true, data: {} }) as never,
) {
  const notes: string[] = [];
  const events: PairingEvent[] = [];
  const live = {
    deps: {
      api,
      want: vi.fn().mockReturnValue(vi.fn()),
      mirror: createMirror(),
      rtc: createWifi().rtc('X'),
      online: createStore(true),
      appVersion: 'v1',
      outdated: vi.fn().mockReturnValue(false),
      journal: { note: (what: string) => notes.push(what), step: vi.fn() },
      strip: vi.fn(),
    },
    confirm: createConfirm({
      check: vi.fn().mockResolvedValue({ ok: true, data: { pairing: pc, peer: 'ok' } }),
      onVerdict: vi.fn(),
    }),
    state: () => state,
    dispatch: (event: PairingEvent) => events.push(event),
    enqueue: (run: () => void) => void run(),
    check: vi.fn(async () => undefined),
    relayInbox: [],
    helloWaiters: [],
    failedIce: { host: 0, mdns: 0, pairs: 0, state: 'new' },
  } as unknown as Live;
  return { live, notes, events };
}

export function fakeLink(live: Live, attempt = 'a', kind: 'direct' | 'relayed' = 'direct') {
  const sent: unknown[] = [];
  const { transport, deliver } = createTransport(
    kind,
    (text) => sent.push(JSON.parse(text)),
    () => undefined,
  );
  const link = listen(live, { attempt, transport, assemble: createSnapAssembler() });
  return { link, sent, deliver };
}
