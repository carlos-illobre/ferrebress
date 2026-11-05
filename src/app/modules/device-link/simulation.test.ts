// La simulación de los dos dispositivos (diseño de 03, § 20): dos vínculos enteros, cada uno con su
// máquina, su espejo y su confirmación, sobre una red de mentira que según una semilla demora y
// desordena los pedidos, y una serie de cosas al azar: cambiar valores, desconectar y reconectar,
// ocultar y volver, cortar el Wi-Fi, aislar los equipos y perder internet. Al final todo se arregla
// (vuelve internet, el Wi-Fi anda, los dos a la vista) y los dos tienen que quedar conectados de la
// misma forma, con los mismos valores. Una semilla que falla se agrega a `fixed`.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { random, shake } from '../../testing/chaos.ts';
import { type Device, setupDevices, stopDevices } from '../../testing/two-devices.ts';

const seeds = 500;
// Las semillas que alguna vez fallaron, para que no vuelvan.
const fixed = [2, 15, 18, 109];
const minute = 60_000;

afterEach(() => {
  vi.useRealTimers();
  stopDevices();
  localStorage.clear();
});

type World = ReturnType<typeof setupDevices>;

// Lo que puede pasar, elegido al azar.
function actions({ pc, phone, wifi, server }: World) {
  const sides: [Device, 'computer' | 'phone'][] = [
    [pc, 'computer'],
    [phone, 'phone'],
  ];
  return sides.flatMap(([one, side]) => [
    (step: number) => one.value.set(`${side} ${step}`),
    () => one.runtime.dispatch({ type: 'pause', from: 'here' }),
    () => one.runtime.dispatch({ type: 'resume', from: 'here' }),
    () => one.runtime.dispatch({ type: 'tabAway', why: 'hidden' }),
    () => one.runtime.dispatch({ type: 'tabBack' }),
    () => server.world.online.set(side, !server.world.online.get(side)),
    () => wifi.cut(),
    () => wifi.isolate(true),
    () => wifi.isolate(false),
  ]);
}

// Todo vuelve a andar: internet, el Wi-Fi, los dos a la vista y sin pausa; y cada uno hace un pedido,
// que con la huella `l=` le dice si el otro cambió (E23b).
async function heal({ pc, phone, wifi, server }: World) {
  const both = [pc, phone];
  wifi.isolate(false);
  for (const side of ['computer', 'phone'] as const) server.world.online.set(side, true);
  for (const one of both) one.online.set(true);
  for (const one of both.filter((one) => one.kind() === 'away'))
    one.runtime.dispatch({ type: 'tabBack' });
  await vi.advanceTimersByTimeAsync(minute);
  // Cada uno se entera de cómo está el vínculo y, si quedó en pausa, la persona reconecta.
  for (let round = 0; round < 2; round++) {
    for (const one of both) one.runtime.pairingChanged();
    await vi.advanceTimersByTimeAsync(minute);
    for (const one of both.filter((one) => one.kind() === 'paused'))
      one.runtime.dispatch({ type: 'resume', from: 'here' });
    await vi.advanceTimersByTimeAsync(minute);
  }
  for (const one of both) one.runtime.pairingChanged();
  await vi.advanceTimersByTimeAsync(10 * minute);
}

async function run(seed: number) {
  const restore = shake(seed);
  vi.useFakeTimers();
  try {
    const world = setupDevices();
    const { pc, phone } = world;
    const next = random(seed * 7919);
    const possible = actions(world);
    pc.start();
    phone.start();
    for (let step = 0; step < 20; step++) {
      possible[Math.floor(next() * possible.length)]?.(step);
      await vi.advanceTimersByTimeAsync(Math.floor(next() * 3000));
    }
    await heal(world);
    const kinds = [pc.kind(), phone.kind()];
    expect(kinds[0], `semilla ${seed}: ${kinds}`).toBe(kinds[1]);
    expect(['direct', 'relayed'], `semilla ${seed}: ${kinds}`).toContain(kinds[0]);
    pc.value.set('al final');
    await vi.advanceTimersByTimeAsync(minute);
    expect(phone.value.get(), `semilla ${seed}`).toBe('al final');
    phone.value.set('respuesta');
    await vi.advanceTimersByTimeAsync(minute);
    expect(pc.value.get(), `semilla ${seed}`).toBe('respuesta');
  } finally {
    restore();
    vi.useRealTimers();
    stopDevices();
    localStorage.clear();
  }
}

describe('la simulación de los dos dispositivos', () => {
  it(`${seeds} semillas al azar terminan conectados y con los mismos valores`, async () => {
    for (let seed = 1; seed <= seeds; seed++) await run(seed);
  });

  it.each(fixed)('la semilla %i, que alguna vez falló', async (seed) => {
    await run(seed);
  });
});
