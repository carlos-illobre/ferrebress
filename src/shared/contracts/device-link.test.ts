// Los bordes de las rutas del vínculo: lo que no cumple el contrato no pasa (diseño de 03, § 10).
import { describe, expect, it } from 'vitest';
import { acceptBody, readCodeBody, relayBody, reportBody, signalBody } from './device-link.ts';

const ok = (schema: { safeParse(v: unknown): { success: boolean } }, value: unknown) =>
  schema.safeParse(value).success;

describe('los contratos del vínculo', () => {
  it('el código (22 caracteres de base64url) y el boleto (32), nada más', () => {
    expect(ok(readCodeBody, { code: 'a'.repeat(22) })).toBe(true);
    expect(ok(readCodeBody, { code: 'a'.repeat(21) })).toBe(false);
    expect(ok(readCodeBody, { code: `${'a'.repeat(21)}/` })).toBe(false);
    expect(ok(readCodeBody, { code: 'a'.repeat(22), otro: 1 })).toBe(false);
    expect(ok(acceptBody, { ticket: 'b'.repeat(32) })).toBe(true);
    expect(ok(acceptBody, { ticket: 'b'.repeat(22) })).toBe(false);
  });

  it('la oferta lleva su intento y como mucho 8 KB', () => {
    const offer = { attempt: '0a1b2c3d', kind: 'offer', sdp: 'v=0' };
    expect(ok(signalBody, offer)).toBe(true);
    expect(ok(signalBody, { ...offer, attempt: 'XYZ' })).toBe(false);
    expect(ok(signalBody, { ...offer, sdp: 'x'.repeat(8 * 1024 + 1) })).toBe(false);
  });

  it('el reenvío lleva de 1 a 100 mensajes', () => {
    expect(ok(relayBody, { messages: [{ t: 'p' }] })).toBe(true);
    expect(ok(relayBody, { messages: [] })).toBe(false);
    expect(ok(relayBody, { messages: Array(101).fill(1) })).toBe(false);
  });

  it('el aviso de una falla del directo: solo números y listas cerradas, sin direcciones', () => {
    const report = {
      attempt: '0a1b2c3d',
      outcome: 'direct-failed',
      ice: { host: 2, mdns: 2, pairs: 0, state: 'failed' },
    };
    expect(ok(reportBody, report)).toBe(true);
    expect(ok(reportBody, { ...report, ice: { ...report.ice, address: '190.1.2.3' } })).toBe(false);
    expect(ok(reportBody, { ...report, ice: { ...report.ice, host: 51 } })).toBe(false);
    expect(ok(reportBody, { ...report, outcome: 'otro' })).toBe(false);
  });
});
