// Las reglas de la cinta sin dibujo (05 · R4.11): las filas, lo que se ve con alguien aislado, dónde
// cae cada acción, la más cercana al arrastrar, el gesto de deslizar y cuánto espera «Reproducir».
import type { AuditView } from '@ferrebress/shared/contracts/audit-log';
import { describe, expect, it } from 'vitest';
import { events } from './audit-test-kit.tsx';
import { lanesOf, nearest, stepMs, swipeOf, timeline, visibleOf } from './tape.ts';

const today = events.slice(0, 4).toReversed();

describe('las reglas de la cinta', () => {
  it('las filas: alguien sin entrar arriba, el sistema abajo; lo que hizo y lo que recibió', () => {
    const lanes = lanesOf(events);
    expect(lanes.map((lane) => lane.id)).toEqual([
      'outsider',
      'ana',
      'martin',
      'pedro',
      'nadie',
      'system',
    ]);
    expect(lanes.find((lane) => lane.id === 'martin')).toMatchObject({ made: 1, got: 1 });
    expect(visibleOf(events, 'martin').map((event) => event.id)).toEqual(['2026:5', '2026:2']);
    expect(visibleOf(events, undefined)).toHaveLength(5);
    const nameless = lanesOf([
      { ...(events[0] as AuditView), actor: { kind: 'person', id: 'x', today: 'Hoy' } },
      {
        ...(events[0] as AuditView),
        actor: { kind: 'person', id: 'y' },
        targets: [{ kind: 'person', id: 'z' }],
      },
    ]);
    expect(nameless.map((lane) => lane.name)).toEqual(['Hoy', 'Martín', '', '']);
  });

  it('la más cercana y el gesto de deslizar', () => {
    const two = events.slice(0, 2);
    const where = (event: AuditView) => (event === two[0] ? 0.2 : 0.8);
    expect(nearest(two, where, 0.3)).toBe(two[0]);
    expect(nearest(two, where, 0.6)).toBe(two[1]);
    expect(swipeOf(-60, 10)).toBe(1);
    expect(swipeOf(60, 10)).toBe(-1);
    expect(swipeOf(30, 0)).toBeUndefined();
    expect(swipeOf(60, 40)).toBeUndefined();
  });

  it('dónde cae cada acción y cuánto espera «Reproducir»', () => {
    const where = timeline(today);
    expect(where(today[0] as never)).toBeGreaterThan(0);
    expect(where(today.at(-1) as never)).toBeLessThan(1);
    expect(stepMs(1, true)).toBe(14_000);
    expect(stepMs(10_000, true)).toBe(40);
    expect(stepMs(5, false)).toBe(1_000);
  });
});
