// Una hora sin que nadie toque nada (capítulo 03, E23 y E24; diseño de 03, § 18): la meta que más pesa
// del módulo, gastar lo mínimo de datos. Se cuentan los pedidos al servidor y los temas escuchados
// con el reloj falso durante una hora.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupDevices as setup, stopDevices, together } from '../../testing/two-devices.ts';

const hour = 60 * 60_000;

afterEach(() => {
  vi.useRealTimers();
  stopDevices();
  localStorage.clear();
});

// Lo que pide cada uno al servidor, desde ahora.
function counter(calls: string[]) {
  const before = calls.length;
  return () => calls.slice(before);
}

describe('una hora sin tocar nada', () => {
  it('E23: una computadora sin vínculo no pide nada ni escucha', async () => {
    const { pc, server } = setup();
    const since = counter(server.world.calls);
    vi.useFakeTimers();
    pc.runtime.dispatch({ type: 'serverSaid', pairing: null });
    await vi.advanceTimersByTimeAsync(hour);
    expect(pc.kind()).toBe('unpaired');
    expect(since()).toEqual([]);
    expect(server.world.listening.size).toBe(0);
  });

  it('E23: un celular con la computadora cerrada se fija una vez, deja el tema y no pide más', async () => {
    const { phone, server } = setup();
    const since = counter(server.world.calls);
    vi.useFakeTimers();
    phone.start();
    await vi.advanceTimersByTimeAsync(hour);
    expect(phone.kind()).toBe('waiting');
    expect(since()).toEqual([]);
    expect(server.world.listening.size).toBe(0);
  });

  it('E24: dos «Directo» no tienen canal con el servidor ni le piden nada', async () => {
    const { pc, phone, server } = setup();
    await together(pc, phone);
    const since = counter(server.world.calls);
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(hour);
    expect([pc.kind(), phone.kind()]).toEqual(['direct', 'direct']);
    expect(since()).toEqual([]);
    expect(server.world.listening.size).toBe(0);
  });
});
