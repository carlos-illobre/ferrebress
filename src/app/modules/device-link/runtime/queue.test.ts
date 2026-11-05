// La fila del vínculo vivo: un error en un paso se anota y lo que sigue corre.
import type { PairingView } from '@ferrebress/shared/contracts/device-link';
import { describe, expect, it, vi } from 'vitest';
import { createMirror } from '../../../platform/mirror/registry.ts';
import { createStore } from '../../../platform/store.ts';
import { pc } from '../../../testing/pairing.ts';
import { createWifi } from '../../../testing/wifi.ts';
import { createRuntime, type Deps } from '../runtime.ts';

describe('el vínculo vivo', () => {
  const pairing = pc as PairingView;
  const base = (api: Deps['api']) =>
    createRuntime({
      api,
      want: () => () => undefined,
      mirror: createMirror(),
      rtc: createWifi().rtc('X'),
      online: createStore(true),
      appVersion: 'v1',
      outdated: () => false,
      journal: { note: notes.push.bind(notes), step: vi.fn() } as never,
      strip: () => undefined,
    });
  const notes: string[] = [];

  it('un error en un paso se anota y la fila sigue; un error del servidor al preguntar no cambia nada', async () => {
    const throwing = (async () => {
      throw new Error('roto');
    }) as never;
    const runtime = base(throwing);
    runtime.dispatch({ type: 'serverSaid', pairing });
    runtime.dispatch({ type: 'peerGone', why: 'lost' });
    runtime.dispatch({ type: 'tabAway', why: 'hidden' });
    runtime.dispatch({ type: 'tabBack' });
    await runtime.settled();
    expect(notes[0]).toBe('error');
    // Un paso que tira (acá, la tira del día) también se anota, y lo que sigue en la fila corre.
    const broken = createRuntime({
      ...({} as Deps),
      api: throwing,
      want: () => () => undefined,
      mirror: createMirror(),
      online: createStore(true),
      journal: { note: notes.push.bind(notes), step: vi.fn() } as never,
      strip: () => {
        throw new Error('roto');
      },
    });
    notes.length = 0;
    broken.dispatch({ type: 'serverSaid', pairing: null });
    broken.dispatch({ type: 'serverSaid', pairing });
    await broken.settled();
    expect(notes).toContain('error');
    expect(broken.state.get().kind).toBe('waiting');
    broken.stop();
    expect(await runtime.roundTripMs()).toBeUndefined();
    const refused = base((async () => ({ ok: false, error: 'not-paired' })) as never);
    await refused.check();
    expect(refused.state.get().kind).toBe('asleep');
    runtime.stop();
    refused.stop();
  });
});
