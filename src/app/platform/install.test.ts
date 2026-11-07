import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubMedia } from '../testing/media.ts';

type Outcome = 'accepted' | 'dismissed';

// El evento con que el navegador dice que se puede instalar.
function offer(outcome: Outcome | 'fails' = 'accepted') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event &
    Record<string, unknown>;
  event.prompt = vi.fn(() =>
    outcome === 'fails' ? Promise.reject(new Error('no')) : Promise.resolve(),
  );
  event.userChoice = Promise.resolve({ outcome });
  dispatchEvent(event);
  return event;
}

async function load(options: { standalone?: boolean; agent?: string; related?: unknown[] } = {}) {
  vi.resetModules();
  stubMedia((query) => query.includes('standalone') && options.standalone === true);
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(options.agent ?? 'Chrome Android');
  if (options.related)
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: options.agent ?? 'Chrome Android',
      getInstalledRelatedApps: () => Promise.resolve(options.related),
    });
  const module = await import('./install.ts');
  module.watchInstall();
  module.askInstalled();
  return module;
}

describe('instalar la aplicación', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('device-settings-E20: con el aviso del navegador se puede; se pide una vez y queda instalada', async () => {
    const { installState, install } = await load();
    expect(installState.get()).toBe('cannot');
    const event = offer('accepted');
    expect(event.defaultPrevented).toBe(true);
    expect(installState.get()).toBe('can');
    expect(await install()).toBe('accepted');
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(installState.get()).toBe('installed');
    expect(await install()).toBe('dismissed');
  });

  it('device-settings-E36: si se cancela o falla, no queda instalada', async () => {
    const { installState, install } = await load();
    offer('dismissed');
    expect(await install()).toBe('dismissed');
    expect(installState.get()).toBe('cannot');
    offer('fails');
    expect(await install()).toBe('dismissed');
  });

  it('device-settings-E21: abierta desde su ícono', async () => {
    const { installState } = await load({ standalone: true, related: [{ platform: 'webapp' }] });
    await Promise.resolve();
    expect(installState.get()).toBe('installed-here');
    dispatchEvent(new Event('appinstalled'));
    expect(installState.get()).toBe('installed-here');
  });

  it('device-settings-E22: instalada y abierta en el navegador, porque lo dijo el navegador o lo avisó al instalarse', async () => {
    const first = await load({ related: [{ platform: 'webapp' }] });
    await vi.waitFor(() => expect(first.installState.get()).toBe('installed'));
    vi.unstubAllGlobals();
    const second = await load();
    dispatchEvent(new Event('appinstalled'));
    expect(second.installState.get()).toBe('installed');
    const third = await load();
    expect(third.installState.get()).toBe('installed');
    offer();
    expect(third.installState.get()).toBe('can');
    expect((await load()).installState.get()).toBe('cannot');
  });

  it('device-settings-E23: el iPhone no tiene botón', async () => {
    const { installState } = await load({ agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' });
    expect(installState.get()).toBe('ios');
  });

  it('device-settings-E24: un navegador que no sabe instalar, aunque pregunte por las instaladas y falle', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Firefox',
      getInstalledRelatedApps: () => Promise.reject(new Error('no')),
    });
    vi.resetModules();
    stubMedia(() => false);
    const { installState, watchInstall, askInstalled } = await import('./install.ts');
    watchInstall();
    askInstalled();
    await Promise.resolve();
    expect(installState.get()).toBe('cannot');
  });
});
