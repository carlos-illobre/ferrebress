import { renderHook, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLazy, useLoaded } from './lazy.ts';
import { updateRequired } from './server/api.ts';

describe('lo que se baja al usarlo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    updateRequired.set(false);
  });

  it('mientras se baja no está; después, lo bajado', async () => {
    const { result } = renderHook(() => useLazy(async () => ({ Screen: 'pantalla' })));
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toEqual({ Screen: 'pantalla' }));
  });

  it('si no se puede bajar con red, es una versión vieja: pide actualizar', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    renderHook(() => useLazy(() => Promise.reject(new Error('no está'))));
    await waitFor(() => expect(updateRequired.get()).toBe(true));
  });

  it('sin red lo dice; lo que no dice nada sin red, no se ve', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const failing = () => Promise.reject(new Error('sin red'));
    const lazy = renderHook(() => useLazy(failing));
    const loaded = renderHook(() => useLoaded(failing));
    await waitFor(() => expect(lazy.result.current).toBe('offline'));
    expect(loaded.result.current).toBeUndefined();
    expect(updateRequired.get()).toBe(false);
  });
});
