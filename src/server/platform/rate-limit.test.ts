import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rate-limit.ts';

function fakeClock(start = 0) {
  let now = start;
  return { now: () => new Date(now), advance: (ms: number) => (now += ms) };
}

describe('los límites de pedidos', () => {
  it('deja pasar hasta el máximo de la ventana y dice cuánto falta', () => {
    const clock = fakeClock();
    const limiter = createRateLimiter(clock);
    const window = { max: 2, windowMs: 60_000 };
    expect(limiter.hit('ip:1', window).allowed).toBe(true);
    clock.advance(10_000);
    expect(limiter.hit('ip:1', window).allowed).toBe(true);
    expect(limiter.hit('ip:1', window)).toEqual({ allowed: false, retryAfterMs: 50_000 });
    expect(limiter.hit('ip:2', window).allowed).toBe(true);
  });

  it('en la ventana siguiente vuelve a contar y dice cuántos hubo en la anterior', () => {
    const clock = fakeClock();
    const limiter = createRateLimiter(clock);
    const window = { max: 1, windowMs: 1_000 };
    limiter.hit('k', window);
    limiter.hit('k', window);
    clock.advance(1_000);
    expect(limiter.hit('k', window)).toEqual({ allowed: true, retryAfterMs: 0, previousCount: 2 });
  });

  it('con máximo cero no deja pasar nada', () => {
    expect(createRateLimiter(fakeClock()).hit('k', { max: 0, windowMs: 1 }).allowed).toBe(false);
  });

  it('barre las ventanas vencidas cuando hay muchas, así la memoria no crece sin fin', () => {
    const clock = fakeClock();
    const limiter = createRateLimiter(clock);
    for (let i = 0; i < 10_000; i++) limiter.hit(`k${i}`, { max: 1, windowMs: 1_000 });
    limiter.hit('vivo', { max: 1, windowMs: 60_000 });
    clock.advance(1_000);
    expect(limiter.hit('nuevo', { max: 1, windowMs: 1_000 }).allowed).toBe(true);
    expect(limiter.hit('vivo', { max: 1, windowMs: 60_000 }).allowed).toBe(false);
    expect(limiter.hit('k0', { max: 1, windowMs: 1_000 })).toEqual({
      allowed: true,
      retryAfterMs: 0,
    });
  });

  it('dice si una clave ya se pasó sin contar el pedido', () => {
    const clock = fakeClock();
    const limiter = createRateLimiter(clock);
    const window = { max: 1, windowMs: 1_000 };
    expect(limiter.exceeded('k', window)).toBe(false);
    limiter.hit('k', window);
    expect(limiter.exceeded('k', window)).toBe(true);
    clock.advance(1_000);
    expect(limiter.exceeded('k', window)).toBe(false);
  });
});
