// Lo que se dice de cada anomalía, con lo guardado incompleto: lo que falta no se dice.
import type { AnomalyView } from '@ferrebress/shared/contracts/anomalies';
import { describe, expect, it } from 'vitest';
import { pageSchema } from './schemas.ts';
import { cellsOf, linesOf, listOf } from './summary.ts';

const base: AnomalyView = {
  id: 'x',
  kind: 'price-list-skipped-rows',
  subject: 'otro:algo',
  status: 'reviewed',
  summary: {},
  openedAt: '2026-01-01T00:00:00.000Z',
};

describe('lo que se dice de una anomalía', () => {
  it('sin cuántas, sin motivos conocidos, sin fecha de revisada ni lista', () => {
    expect(linesOf(base)).toMatchObject({ detail: undefined, state: undefined, file: undefined });
    expect(linesOf({ ...base, summary: { skipped: 1, reasons: { otro: 1 } } }).detail).toBe(
      'Salteó 1 fila',
    );
    expect(linesOf({ ...base, summary: { skipped: 2 } }).detail).toBe('Salteó 2 filas');
    expect(linesOf({ ...base, kind: 'price-list-unreadable' }).detail).toBeUndefined();
    expect(linesOf({ ...base, status: 'closed' }).state).toBeUndefined();
    expect(listOf(base)).toBeUndefined();
    expect(cellsOf({})).toBe('');
    expect(cellsOf({ cells: ['', 'A', 'B'] })).toBe('A · B');
  });
});

describe('lo que llega del otro dispositivo', () => {
  it('una página de anomalías es un objeto con `anomalies`', () => {
    expect(pageSchema.safeParse({ anomalies: [] }).success).toBe(true);
    expect(pageSchema.safeParse(null).success).toBe(false);
    expect(pageSchema.safeParse({}).success).toBe(false);
  });
});
