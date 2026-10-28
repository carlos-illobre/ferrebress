import { act, renderHook } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { online } from './api.ts';
import { reconnectDelaysMs, reconnectEveryMs, useReconnect } from './reconnect.ts';

describe('volver a probar la conexión', () => {
  const hidden = (value: boolean) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (value ? 'hidden' : 'visible'),
    });
    document.dispatchEvent(new Event('visibilitychange'));
  };
  const browserOnline = (value: boolean) =>
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value);
  afterEach(() => {
    hidden(false);
    vi.restoreAllMocks();
    vi.useRealTimers();
    act(() => online.set(true));
  });

  it('sign-in-E45: el navegador dice que hay red pero el último pedido falló: prueba con espera creciente y después cada minuto, hasta que anda', () => {
    vi.useFakeTimers();
    browserOnline(true);
    act(() => online.set(false));
    const probe = vi.fn();
    renderHook(() => useReconnect(true, probe));
    let elapsed = 0;
    for (const [index, ms] of [...reconnectDelaysMs, reconnectEveryMs].entries()) {
      vi.advanceTimersByTime(ms - 1);
      expect(probe).toHaveBeenCalledTimes(index);
      vi.advanceTimersByTime(1);
      elapsed += ms;
    }
    expect(probe).toHaveBeenCalledTimes(reconnectDelaysMs.length + 1);
    act(() => online.set(true));
    vi.advanceTimersByTime(elapsed);
    expect(probe).toHaveBeenCalledTimes(reconnectDelaysMs.length + 1);
  });

  it('oculta, sin red en el navegador o sin la entrada, no prueba; al volver empieza por la espera corta', () => {
    vi.useFakeTimers();
    const browser = browserOnline(false);
    act(() => online.set(false));
    const probe = vi.fn();
    const { rerender } = renderHook(({ active }) => useReconnect(active, probe), {
      initialProps: { active: true },
    });
    vi.advanceTimersByTime(reconnectEveryMs * 5);
    browser.mockReturnValue(true);
    hidden(true);
    vi.advanceTimersByTime(reconnectEveryMs * 5);
    expect(probe).not.toHaveBeenCalled();
    hidden(false);
    vi.advanceTimersByTime(reconnectDelaysMs[0] as number);
    expect(probe).toHaveBeenCalledOnce();
    dispatchEvent(new Event('online'));
    vi.advanceTimersByTime(reconnectDelaysMs[0] as number);
    expect(probe).toHaveBeenCalledTimes(2);
    rerender({ active: false });
    vi.advanceTimersByTime(reconnectEveryMs * 5);
    expect(probe).toHaveBeenCalledTimes(2);
  });
});
