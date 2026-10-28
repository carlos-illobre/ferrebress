import { describe, expect, it, vi } from 'vitest';
import { serverNow, syncServerTime } from './clock.ts';

describe('la hora del servidor', () => {
  it('no se sabe hasta que el servidor la dice; después avanza con el cronómetro', () => {
    expect(serverNow()).toBeUndefined();
    const now = vi.spyOn(performance, 'now').mockReturnValue(1_000);
    syncServerTime(Date.UTC(2026, 9, 27, 12));
    now.mockReturnValue(61_000);
    expect(serverNow()).toEqual(new Date(Date.UTC(2026, 9, 27, 12, 1)));
    now.mockRestore();
  });
});
