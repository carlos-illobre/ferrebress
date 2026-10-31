import { describe, expect, it } from 'vitest';
import { closedReasonOf, confirmedAtOf } from './rules.ts';

const limits = { idleMs: 60 * 60_000, maxMs: 8 * 60 * 60_000 };
const createdAt = new Date('2026-10-27T08:00:00Z');
const at = (minutes: number) => new Date(createdAt.getTime() + minutes * 60_000);
const open = (lastUsedMinutes: number) => ({
  createdAt,
  lastUsedAt: at(lastUsedMinutes),
  closedReason: null,
});

describe('cuándo vale una sesión', () => {
  it('sign-in-E21: a los 59 minutos sin pedidos sigue', () => {
    expect(closedReasonOf(open(0), at(59), limits)).toBeNull();
  });

  it('sign-in-E22: a los 60 minutos sin pedidos vence', () => {
    expect(closedReasonOf(open(0), at(60), limits)).toBe('idle');
  });

  it('sign-in-E23 y E24: a las 8 horas vence aunque se use sin parar', () => {
    expect(closedReasonOf(open(479), at(480), limits)).toBe('max-age');
  });

  it('una cerrada a mano sigue cerrada por su motivo', () => {
    expect(closedReasonOf({ ...open(0), closedReason: 'revoked' }, at(1), limits)).toBe('revoked');
  });
});

describe('cuándo confirmó por última vez (02 · R3.8)', () => {
  it('la más nueva de Google y la huella; sin ninguna, nada', () => {
    expect(confirmedAtOf({ googleAt: at(5), passkeyAt: at(30) })).toEqual(at(30));
    expect(confirmedAtOf({ googleAt: at(5), passkeyAt: null })).toEqual(at(5));
    expect(confirmedAtOf({ googleAt: null, passkeyAt: null })).toBeNull();
  });
});
