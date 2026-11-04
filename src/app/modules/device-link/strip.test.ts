// La tira del día (R4.4): arranca con la primera conexión, un tramo por estado, totales, y empieza de
// cero al otro día, con otra persona o al desvincular.
import { afterEach, describe, expect, it } from 'vitest';
import { createStrip, stripKey } from './strip.ts';

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
    expect(JSON.parse(localStorage.getItem(stripKey) as string).marks).toEqual([]);
  });
});
