// El espejo con el otro, con un `Live` de mentira: el saludo, la foto y su confirmación (diseño de 03,
// § 5 y § 7).

import { afterEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod/mini';
import { fakeLink, fakeLive } from '../../../testing/live.ts';
import { pc } from '../../../testing/pairing.ts';
import { createConfirm } from '../confirm.ts';
import type { PairingState } from '../machine/types.ts';
import { deviceLinkSettings } from '../settings.ts';
import { attachMirror, sendHello, sendSnapshot } from './mirror-port.ts';

const waiting: PairingState = { kind: 'waiting', pairing: pc };
const direct = (attempt = 'a'): PairingState => ({ kind: 'direct', pairing: pc, attempt });

afterEach(() => vi.useRealTimers());

describe('el espejo con el otro', () => {
  it('sin conexión no hay espejo, ni saludo, ni foto', async () => {
    const { live, notes } = fakeLive(direct());
    attachMirror(live, 'direct');
    expect(notes).toContain('no-link');
    attachMirror(fakeLive(waiting).live, 'relayed');
    expect(() => sendHello(live, undefined)).not.toThrow();
    await sendSnapshot(live, true);
    expect(live.deps.mirror.port()).toBeUndefined();
  });

  it('por el directo sin la huella del otro, confirma con una vacía: el servidor dice que no y nada sale', async () => {
    const { live } = fakeLive(direct());
    const check = vi.fn(async () => ({
      ok: true as const,
      data: { pairing: pc, peer: 'gone' as const },
    }));
    live.confirm = createConfirm({ check, onVerdict: vi.fn() });
    const { link, sent } = fakeLink(live);
    live.current = link;
    attachMirror(live, 'direct');
    expect(sent).toEqual([expect.objectContaining({ t: 'hello' })]);
    live.deps.mirror.register('k', 'a', z.string()).set('b');
    await vi.waitFor(() => expect(check).toHaveBeenCalledWith(''));
    await new Promise((settled) => setTimeout(settled, 0));
    expect(sent).toHaveLength(1);
  });

  it('sin el saludo del otro, la foto sale igual a los 5 s; lo que no entra en un mensaje se anota', async () => {
    vi.useFakeTimers();
    const { live, notes } = fakeLive(direct());
    const { link, sent } = fakeLink(live);
    live.current = link;
    live.confirm.begin('huella');
    live.deps.mirror.attach({ leader: true, over: 'direct', send: vi.fn() });
    live.deps.mirror.register('grande', 'x'.repeat(70 * 1024), z.string());
    const photo = sendSnapshot(live, false);
    await vi.advanceTimersByTimeAsync(deviceLinkSettings.runtime.helloWaitMs);
    await photo;
    expect(notes).toEqual(['hello-timeout', 'not-sent']);
    expect(sent).toEqual([]);
  });

  it('sin confirmación del directo, o con el espejo ya desconectado, la foto no sale (§ 7.1)', async () => {
    const { live, notes } = fakeLive(direct());
    const { link, sent } = fakeLink(live);
    live.current = link;
    live.hello = { t: 'hello', v: 1, app: 'v1' };
    // Sin la huella del otro, la confirmación dice que no.
    await sendSnapshot(live, false);
    expect(notes).toEqual(['confirm-failed']);
    live.confirm.begin('huella');
    await sendSnapshot(live, false);
    expect(sent).toEqual([]);
  });

  it('si cambió la conexión mientras esperaba el saludo, no manda la foto', async () => {
    vi.useFakeTimers();
    const { live } = fakeLive(direct());
    const first = fakeLink(live);
    live.current = first.link;
    const photo = sendSnapshot(live, false);
    live.current = fakeLink(live, 'b').link;
    await vi.advanceTimersByTimeAsync(deviceLinkSettings.runtime.helloWaitMs);
    await photo;
    expect(first.sent).toEqual([]);
  });

  it('una parte de la foto sola no se aplica todavía', () => {
    const { live } = fakeLive(direct());
    const { link, deliver } = fakeLink(live);
    live.current = link;
    const adopt = vi.spyOn(live.deps.mirror, 'adopt');
    deliver(JSON.stringify({ t: 'snap', p: [], part: 0, of: 2 }));
    expect(adopt).not.toHaveBeenCalled();
  });
});
