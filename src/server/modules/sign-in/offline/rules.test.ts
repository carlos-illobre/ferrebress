import { describe, expect, it } from 'vitest';
import { offlineSettings, rejectionOf } from './rules.ts';

const now = new Date('2026-10-29T08:00:00Z');
const ago = (ms: number) => new Date(now.getTime() - ms);
const judged = {
  user: { active: true },
  allowed: true,
  lastSession: { lastUsedAt: ago(60_000), closedReason: null },
  now,
  signedAt: now,
  lastContactAt: ago(60_000),
};

describe('las reglas de entrar sin conexión', () => {
  it('se confirma dentro del plazo, con margen por la escritura por tandas', () => {
    expect(rejectionOf(judged)).toBeUndefined();
    const edge = offlineSettings.windowMs + offlineSettings.marginMs;
    const lastSession = { lastUsedAt: ago(edge), closedReason: null };
    expect(rejectionOf({ ...judged, lastSession })).toBeUndefined();
    const late = { lastUsedAt: ago(edge + 1), closedReason: null };
    expect(rejectionOf({ ...judged, lastSession: late })).toBe('too-late');
  });

  it('sin el permiso, o sin ninguna sesión de ese celular (se borran a los 30 días), no', () => {
    expect(rejectionOf({ ...judged, allowed: false })).toBe('not-allowed');
    expect(rejectionOf({ ...judged, lastSession: undefined })).toBe('too-late');
  });

  it('la baja pesa más que todo lo demás', () => {
    const user = { active: false };
    expect(rejectionOf({ ...judged, user, allowed: false })).toBe('deactivated');
  });
});
