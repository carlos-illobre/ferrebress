import { afterEach, describe, expect, it, vi } from 'vitest';
import { deviceId, isPhone } from './device.ts';

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

  // Una página nueva del módulo, como si el navegador la abriera de cero, de la forma `type`.
  async function page(type: string | undefined) {
    vi.resetModules();
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue(
      (type ? [{ type }] : []) as unknown as PerformanceEntryList,
    );
    return (await import('./device.ts')).tabId;
  }

  it('la pestaña conserva su identificador al recargarla, y solo ahí: una duplicada lleva otro', async () => {
    sessionStorage.clear();
    const first = (await page('navigate'))();
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect((await page('reload'))()).toBe(first);
    // Duplicar la pestaña copia lo guardado, pero no es una recarga.
    expect((await page('back_forward'))()).not.toBe(first);
    expect((await page(undefined))()).toMatch(/^[0-9a-f-]{36}$/);
    // Dentro de la misma página es siempre el mismo.
    const tabId = await page('navigate');
    expect(tabId()).toBe(tabId());
    vi.restoreAllMocks();
  });

  it('sin sessionStorage, ninguna pestaña: se abre como antes', async () => {
    vi.resetModules();
    vi.stubGlobal('sessionStorage', {
      getItem() {
        throw new Error('bloqueado');
      },
    });
    expect((await import('./device.ts')).tabId()).toBeUndefined();
    vi.restoreAllMocks();
  });
});
