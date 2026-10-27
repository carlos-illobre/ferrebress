// Adelanta el reloj de mentira y deja que la pantalla se vuelva a dibujar con lo que pasó.
import { act } from '@testing-library/preact';
import { vi } from 'vitest';

export const later = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
