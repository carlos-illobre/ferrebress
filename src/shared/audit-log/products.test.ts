// Cómo se lee en Quién hizo qué un cambio de un producto (07 · R5.1, E20).
import { describe, expect, it } from 'vitest';
import type { AuditView } from '../contracts/audit-log.ts';
import { entryOf, type Piece } from './index.ts';

const read = (pieces: Piece[]) =>
  pieces
    .map((piece) => ('text' in piece ? piece.text : 'thing' in piece ? piece.thing : ''))
    .join('');
const says = (type: string, changes: AuditView['changes'], name: string | null = 'Martillo') =>
  read(
    entryOf(type).says({
      ...{ id: '2026:1', at: '2026-11-07T13:00:00.000Z', type, tone: 'plain' },
      actor: { kind: 'person', id: 'u-ana', name: 'Ana' },
      targets: [{ kind: 'product', id: 'p1', ...(name && { name }) }],
      changes,
      data: {},
    } as AuditView),
  );

describe('los cambios de un producto en Quién hizo qué', () => {
  it('catalog-E20: el margen, con el precio si cambió', () => {
    expect(entryOf('products.margin-changed').group).toBe('catalog');
    expect(
      says('products.margin-changed', {
        margin: { before: 50, after: 80 },
        price: { before: '400000', after: '500000' },
      }),
    ).toBe('Cambió el margen de Martillo: 50 % → 80 % (precio $ 4.000,00 → $ 5.000,00)');
    expect(says('products.margin-changed', { margin: { before: null, after: 80 } })).toBe(
      'Cambió el margen de Martillo: sin margen → 80 %',
    );
    expect(
      says(
        'products.margin-changed',
        {
          margin: { before: 80, after: null },
          price: { before: '500000', after: null },
        },
        null,
      ),
    ).toBe('Cambió el margen de un producto: 80 % → sin margen (precio $ 5.000,00 → sin precio)');
  });

  it('la unidad y el IVA', () => {
    expect(says('products.unit-changed', { unit: { before: 'un.', after: 'kg' } })).toBe(
      'Cambió la unidad de Martillo: un. → kg',
    );
    expect(says('products.vat-changed', { vat: { before: 210, after: 105 } })).toBe(
      'Cambió el IVA de Martillo: 21 % → 10,5 %',
    );
  });
});
