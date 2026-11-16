// Los comandos de los atajos de Quién hizo qué y de la cinta, sobre un modelo de mentira.
import { describe, expect, it } from 'vitest';
import type { AuditLogState } from '../state.ts';
import type { TapeState } from '../useTape.ts';
import { shortcuts } from './audit-log.ts';
import { shortcuts as tape } from './tape.ts';

function model({
  page = true,
  filtered = true,
  shown = true,
  on = true,
  online = true,
  newOnes = 2,
} = {}) {
  const calls: string[] = [];
  const fake = {
    page: page ? {} : undefined,
    filters: filtered ? { by: 'u1' } : {},
    toggleFilter: (which: string) => calls.push(which),
    clear: () => calls.push('clear'),
    live: { shown, on, toggle: () => calls.push('live') },
    online,
    newOnes,
    showNew: () => calls.push('new'),
  } as unknown as AuditLogState;
  return { fake, calls };
}
const run = (name: string, fake: AuditLogState) =>
  (shortcuts.commands[name] as (m: AuditLogState) => unknown)(fake);

describe('los atajos de Quién hizo qué', () => {
  it('los filtros, sacarlos, «Actualizar solo» y «3 nuevas»', () => {
    const { fake, calls } = model();
    for (const name of ['by', 'to', 'dates', 'kind', 'clearFilters', 'live', 'newOnes'])
      run(name, fake);
    expect(calls).toEqual(['by', 'to', 'dates', 'kind', 'clear', 'live', 'new']);
  });

  it('nada sin la lista, sin filtros, sin conexión o sin nuevas', () => {
    expect(run('by', model({ page: false }).fake)).toBe(false);
    expect(run('clearFilters', model({ filtered: false }).fake)).toBe(false);
    expect(run('live', model({ online: false }).fake)).toBe(false);
    expect(run('newOnes', model({ newOnes: 0 }).fake)).toBe(false);
  });

  it('la cinta: reproducir, solo con acciones', () => {
    const calls: string[] = [];
    const with_ = {
      events: [{}],
      play: { toggle: () => calls.push('play') },
    } as unknown as TapeState;
    (tape.commands.play as (t: TapeState) => unknown)(with_);
    expect(calls).toEqual(['play']);
    expect(
      (tape.commands.play as (t: TapeState) => unknown)({ events: [] } as unknown as TapeState),
    ).toBe(false);
  });
});
