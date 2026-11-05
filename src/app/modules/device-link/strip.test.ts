// La tira del día (R4.4): arranca con la primera conexión, un tramo por estado, totales, y empieza de
// cero al otro día, con otra persona o al desvincular.
import { afterEach, describe, expect, it } from 'vitest';
import { createStrip, stripKeyOf } from './strip.ts';

const hour = 3_600_000;
const morning = new Date(2026, 10, 4, 9).getTime();

afterEach(() => localStorage.clear());

describe('la tira del día', () => {
  it('cuenta cada tramo desde la primera conexión, y qué parte fue directo', () => {
    let now = morning;
    const strip = createStrip({ owner: 'p1', now: () => now });
    const changes: number[] = [];
    const stop = strip.subscribe(() => changes.push(now));
    strip.mark('waiting');
    expect(strip.view()).toEqual({
      segments: [],
      totals: { direct: 0, relayed: 0, apart: 0 },
      together: 0,
      directShare: 0,
    });
    strip.mark('direct');
    now += 2 * hour;
    strip.mark('direct');
    strip.mark('relayed');
    now += hour / 2;
    strip.mark('waiting');
    now += hour / 2;
    stop();
    strip.mark('meeting');
    const view = strip.view();
    expect(view.segments.map((s) => s.lane)).toEqual(['direct', 'relayed', 'apart']);
    expect(view.totals).toEqual({ direct: 2 * hour, relayed: hour / 2, apart: hour / 2 });
    expect(view.together).toBe(2.5 * hour);
    expect(view.directShare).toBe(80);
    expect(changes).toHaveLength(3);
  });

  it('sobrevive a recargar, para la misma persona y el mismo día', () => {
    let now = morning;
    createStrip({ owner: 'p1', now: () => now }).mark('direct');
    now += hour;
    expect(createStrip({ owner: 'p1', now: () => now }).view().totals.direct).toBe(hour);
    expect(createStrip({ owner: 'p2', now: () => now }).view().segments).toEqual([]);
  });

  it('una clave por persona que no la nombra: otra persona no la ve ni la borra (§ 16)', () => {
    const now = morning;
    createStrip({ owner: 'persona-1', now: () => now }).mark('direct');
    createStrip({ owner: 'persona-2', now: () => now }).mark('relayed');
    expect(createStrip({ owner: 'persona-1', now: () => now }).view().segments).toHaveLength(1);
    const stored = Object.keys(localStorage).join() + Object.values(localStorage).join();
    expect(stored).not.toContain('persona');
    expect(stripKeyOf('persona-1')).not.toBe(stripKeyOf('persona-2'));
  });

  it('el día es el del negocio, no el de la zona del dispositivo', () => {
    // 02:30 y 03:30 en UTC son el mismo día en UTC, pero en Buenos Aires son las 23:30 del 4 y las
    // 00:30 del 5: el día del negocio cambió y la tira empieza de cero.
    let now = Date.UTC(2026, 10, 5, 2, 30);
    const strip = createStrip({ owner: 'p1', now: () => now });
    strip.mark('direct');
    now = Date.UTC(2026, 10, 5, 3, 30);
    expect(strip.view().segments).toEqual([]);
  });

  it('al otro día, o al desvincular, empieza de cero', () => {
    let now = morning;
    const strip = createStrip({ owner: 'p1', now: () => now });
    strip.mark('direct');
    now += 24 * hour;
    expect(strip.view().segments).toEqual([]);
    strip.mark('relayed');
    now += 24 * hour;
    strip.mark('direct');
    expect(strip.view().segments).toHaveLength(1);
    strip.mark('unpaired');
    expect(strip.view().segments).toEqual([]);
    expect(JSON.parse(localStorage.getItem(stripKeyOf('p1')) as string).marks).toEqual([]);
  });
});
