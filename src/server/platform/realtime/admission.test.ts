// Los topes del canal: por sesión, por red sin sesión, los anónimos dentro del total y las aperturas.
import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../limits/rate-limit.ts';
import { createAdmission, realtimeSettings } from './admission.ts';
import { createChannel, type Owner } from './channel.ts';

const session = (id: string): Owner => ({
  kind: 'session',
  session: {
    id,
    userId: 'u',
    deviceId: 'd',
    deviceLabel: 'Chrome en Windows',
    isPhone: false,
    confirmedAt: null,
  },
});
const anonymous = (network: string): Owner => ({ kind: 'anonymous', network });
const sink = { write: async () => undefined, close: () => undefined };

function setup() {
  let now = 0;
  const admission = createAdmission(createRateLimiter({ now: () => new Date(now) }));
  let n = 0;
  const open = (owner: Owner) => {
    const channel = createChannel(String(++n), owner, sink, 1024);
    admission.opened(channel);
    return channel;
  };
  return { admission, open, later: () => (now += realtimeSettings.opens.windowMs) };
}

describe('los topes del canal', () => {
  it('cuatro por sesión: la quinta pestaña espera un latido; al cerrar una, entra', () => {
    const { admission, open } = setup();
    const opened = [1, 2, 3, 4].map(() => open(session('s')));
    expect(admission.admit(session('s'))).toEqual({
      allowed: false,
      retryAfterMs: realtimeSettings.beatEveryMs,
    });
    expect(admission.admit(session('otra')).allowed).toBe(true);
    admission.closed(opened[0] as never);
    expect(admission.admit(session('s')).allowed).toBe(true);
  });

  it('sin sesión, tres por red; los anónimos tienen su propio tope dentro del total', () => {
    const { admission, open } = setup();
    for (let i = 0; i < 3; i++) open(anonymous('190.1.1.1'));
    expect(admission.admit(anonymous('190.1.1.1')).allowed).toBe(false);
    for (let i = 3; i < realtimeSettings.channels.anonymousTotal; i++) open(anonymous(`10.${i}`));
    expect(admission.admit(anonymous('190.9.9.9')).allowed).toBe(false);
    expect(admission.admit(session('s')).allowed).toBe(true);
    const last = open(anonymous('190.2.2.2'));
    admission.closed(last);
    admission.closed(last);
  });

  it('el total también frena a quien tiene sesión', () => {
    const { admission, open } = setup();
    for (let i = 0; i < realtimeSettings.channels.total; i++) open(session(`s${i}`));
    expect(admission.admit(session('nueva')).allowed).toBe(false);
  });

  it('diez aperturas por minuto por dueño; el minuto siguiente vuelve a dejar', () => {
    const { admission, later } = setup();
    for (let i = 0; i < realtimeSettings.opens.max; i++)
      expect(admission.admit(session('s')).allowed).toBe(true);
    const refused = admission.admit(session('s'));
    expect(refused.allowed).toBe(false);
    later();
    expect(admission.admit(session('s')).allowed).toBe(true);
  });

  it('sesenta cambios de suscripción por minuto por canal', () => {
    const { admission, open } = setup();
    const channel = open(session('s'));
    for (let i = 0; i < realtimeSettings.subscriptionChanges.max; i++)
      expect(admission.mayChange(channel)).toBe(true);
    expect(admission.mayChange(channel)).toBe(false);
  });
});
