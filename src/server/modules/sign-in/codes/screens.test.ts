import { describe, expect, it } from 'vitest';
import { codeSettings } from '../settings.ts';
import { createScreens } from './screens.ts';

describe('las pantallas de entrada', () => {
  it('los códigos vencidos hace rato se barren; los recientes quedan para decir que vencieron', () => {
    let now = 0;
    const screens = createScreens({ now: () => new Date(now) });
    const screen = screens.open('190.1.1.1', 'Chrome en Windows') as NonNullable<
      ReturnType<typeof screens.open>
    >;
    const old = screens.newCode(screen);
    now += 60_000;
    const recent = screens.newCode(screen);
    expect(screens.find(old)).toBe('code-expired');
    now += 61_000;
    screens.newCode(screen);
    expect(screens.find(recent)).toBe('code-expired');
    expect(screens.find(old)).toBe('code-expired');
  });

  it('hay un tope total de pantallas abiertas', () => {
    const screens = createScreens({ now: () => new Date(0) });
    for (let i = 0; i < codeSettings.maxScreens; i++)
      screens.open(`10.${Math.floor(i / 250)}.${i % 250}.1`, 'x');
    expect(screens.open('10.9.9.9', 'x')).toBeUndefined();
  });
});
