import { renderHook } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renewAfterMs, useNonceRenewal } from './renew.ts';

describe('la renovación del pedido de Google', () => {
  const hidden = (value: boolean) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (value ? 'hidden' : 'visible'),
    });
    document.dispatchEvent(new Event('visibilitychange'));
  };
  afterEach(() => {
    hidden(false);
    vi.useRealTimers();
  });

  it('oculta no pide nada, aunque pasen horas: cada nonce nuevo hace que Google baje su botón de nuevo', () => {
    vi.useFakeTimers();
    const renew = vi.fn();
    renderHook(() => useNonceRenewal('n1', true, renew));
    hidden(true);
    vi.advanceTimersByTime(renewAfterMs * 20);
    expect(renew).not.toHaveBeenCalled();
    hidden(false);
    expect(renew).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(renewAfterMs);
    expect(renew).toHaveBeenCalledTimes(2);
  });

  it('con la entrada a la vista, pide otro un minuto antes de que venza', () => {
    vi.useFakeTimers();
    const renew = vi.fn();
    renderHook(() => useNonceRenewal('n1', true, renew));
    vi.advanceTimersByTime(renewAfterMs - 1);
    expect(renew).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(renew).toHaveBeenCalledOnce();
  });

  it('si el dispositivo durmió, lo pide apenas vuelve a la vista; antes de tiempo, no', () => {
    vi.useFakeTimers();
    const renew = vi.fn();
    renderHook(() => useNonceRenewal('n1', true, renew));
    hidden(true);
    hidden(false);
    expect(renew).not.toHaveBeenCalled();
    // El reloj de la página siguió, pero el temporizador no llegó a correr (el dispositivo dormido).
    vi.setSystemTime(Date.now() + renewAfterMs);
    hidden(true);
    expect(renew).not.toHaveBeenCalled();
    hidden(false);
    expect(renew).toHaveBeenCalledOnce();
  });

  it('al volver a la vista antes de tiempo, el próximo va a lo que le falta, no a un plazo entero', () => {
    vi.useFakeTimers();
    const renew = vi.fn();
    renderHook(() => useNonceRenewal('n1', true, renew));
    hidden(true);
    vi.advanceTimersByTime(renewAfterMs - 60_000);
    hidden(false);
    expect(renew).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(renew).toHaveBeenCalledOnce();
  });

  it('sin la entrada a la vista o sin pedido todavía, no pide nada', () => {
    vi.useFakeTimers();
    const renew = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ shown, nonce }) => useNonceRenewal(nonce, shown, renew),
      {
        initialProps: { shown: false, nonce: 'n1' as string | undefined },
      },
    );
    rerender({ shown: true, nonce: undefined });
    vi.advanceTimersByTime(renewAfterMs * 2);
    unmount();
    expect(renew).not.toHaveBeenCalled();
  });
});
