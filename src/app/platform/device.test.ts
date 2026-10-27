import { afterEach, describe, expect, it, vi } from 'vitest';
import { canUseNearbyPhone, deviceId, isPhone } from './device.ts';

describe('el dispositivo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('tiene un identificador que se guarda la primera vez', () => {
    const id = deviceId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(deviceId()).toBe(id);
  });

  it('es un celular si el navegador lo dice o, si no dice nada, si es Android o iPhone', () => {
    vi.stubGlobal('navigator', { userAgentData: { mobile: true }, userAgent: 'Windows' });
    expect(isPhone()).toBe(true);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 14)' });
    expect(isPhone()).toBe(true);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0' });
    expect(isPhone()).toBe(false);
  });

  it('sign-in-E17: puede entrar con un celular cercano solo si el navegador lo dice', async () => {
    vi.stubGlobal('PublicKeyCredential', {
      getClientCapabilities: async () => ({ hybridTransport: true }),
    });
    expect(await canUseNearbyPhone()).toBe(true);
    vi.stubGlobal('PublicKeyCredential', { getClientCapabilities: async () => ({}) });
    expect(await canUseNearbyPhone()).toBe(false);
    vi.stubGlobal('PublicKeyCredential', {
      getClientCapabilities: () => Promise.reject(new Error('no')),
    });
    expect(await canUseNearbyPhone()).toBe(false);
    vi.stubGlobal('PublicKeyCredential', {});
    expect(await canUseNearbyPhone()).toBe(false);
    vi.stubGlobal('PublicKeyCredential', undefined);
    expect(await canUseNearbyPhone()).toBe(false);
  });
});
