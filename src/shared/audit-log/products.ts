// Los tipos de acción del catálogo (capítulo 07, R5.1) en Quién hizo qué: el margen, la unidad y el
// IVA de un producto, con el valor de antes y el de después.
import { centsText } from '../money/money.ts';
import { type Entry, named, text, thing } from './kinds.ts';

const percent = (raw: unknown) => (typeof raw === 'number' ? `${raw} %` : 'sin margen');
const vat = (raw: unknown) => `${(Number(raw) / 10).toLocaleString('es-AR')} %`;
const price = (raw: unknown) => (typeof raw === 'string' ? centsText(BigInt(raw)) : 'sin precio');

type Shown = { changes: Record<string, { before?: unknown; after?: unknown } | undefined> };
const change = (e: Shown, field: string, shown: (raw: unknown) => string) =>
  thing(`${shown(e.changes[field]?.before)} → ${shown(e.changes[field]?.after)}`);
// El precio, si cambió.
const withPrice = (e: Shown) =>
  e.changes.price ? [text(' (precio '), change(e, 'price', price), text(')')] : [];

export const productsTypes = {
  'products.margin-changed': {
    group: 'catalog',
    tone: 'plain',
    icon: 'badge-percent',
    name: 'Cambió el margen de un producto',
    shows: [],
    says: (e) => [
      text('Cambió el margen de '),
      named(e, 'product', 'un producto'),
      text(': '),
      change(e, 'margin', percent),
      ...withPrice(e),
    ],
  },
  'products.unit-changed': {
    group: 'catalog',
    tone: 'plain',
    icon: 'ruler',
    name: 'Cambió la unidad de un producto',
    shows: [],
    says: (e) => [
      text('Cambió la unidad de '),
      named(e, 'product', 'un producto'),
      text(': '),
      change(e, 'unit', String),
    ],
  },
  'products.vat-changed': {
    group: 'catalog',
    tone: 'plain',
    icon: 'receipt',
    name: 'Cambió el IVA de un producto',
    shows: [],
    says: (e) => [
      text('Cambió el IVA de '),
      named(e, 'product', 'un producto'),
      text(': '),
      change(e, 'vat', vat),
      ...withPrice(e),
    ],
  },
} satisfies Record<string, Entry>;
