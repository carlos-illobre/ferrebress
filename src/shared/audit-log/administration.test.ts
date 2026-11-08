// Cómo se lee en Quién hizo qué un cambio de los ajustes para todos (capítulo 06, R2.5).
import { describe, expect, it } from 'vitest';
import type { AuditView } from '../contracts/audit-log.ts';
import { entryOf, type Piece } from './index.ts';

const read = (pieces: Piece[]) =>
  pieces
    .map((piece) => ('text' in piece ? piece.text : 'thing' in piece ? piece.thing : ''))
    .join('');
const says = (key: unknown, before: unknown, after: unknown, prices?: number) => {
  const view: AuditView = {
    ...{ id: '2026:1', at: '2026-11-07T13:00:00.000Z', type: 'settings.changed', tone: 'plain' },
    actor: { kind: 'person', id: 'u-ana', name: 'Ana' },
    targets: [],
    changes: { value: { before, after } },
    data: { key, ...(prices !== undefined && { prices }) },
  };
  return read(entryOf('settings.changed').says(view));
};

describe('un ajuste para todos en Quién hizo qué', () => {
  it('administration-E09: el ajuste con el valor anterior y el nuevo', () => {
    expect(entryOf('settings.changed').group).toBe('administration');
    expect(says('pairingDays', 30, 15)).toBe('Cambió los días del vínculo: 30 días → 15 días');
    expect(says('sessionIdle', 60, 30)).toBe('Cambió el tiempo sin uso de la sesión: 60 min → 30 min');
    expect(says('sessionMax', 8, 4)).toBe('Cambió el tope de la sesión: 8 h → 4 h');
    expect(says('quickMargins', [300, 200, 100, 50, 25], [300, 200, 150, 50, 25])).toBe(
      'Cambió los márgenes rápidos: 300, 200, 100, 50, 25 % → 300, 200, 150, 50, 25 %',
    );
  });

  it('administration-E19: el redondeo, con cuántos precios cambiaron', () => {
    expect(says('roundingStep', 1000, 500, 1650)).toBe(
      'Cambió el redondeo: $ 1.000 → $ 500 (cambiaron 1.650 precios)',
    );
    expect(says('roundingStep', 1000, 0, 0)).toBe('Cambió el redondeo: $ 1.000 → sin redondeo');
  });

  it('un valor que no es una lista o una clave que no existe se leen igual', () => {
    expect(says('quickMargins', null, [300, 200, 100, 50, 25])).toBe(
      'Cambió los márgenes rápidos: — → 300, 200, 100, 50, 25 %',
    );
    expect(says('__proto__', 1, 2)).toBe('Cambió un ajuste para todos');
  });
});
