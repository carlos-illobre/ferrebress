// Lo que entra y sale de las rutas del catálogo (07 · R1 a R4; diseño de 07, § 3): lo comparten el
// servidor, que valida, y la aplicación, que muestra y valida antes de mandar.
import * as z from 'zod/mini';
import type { CostBasis } from '../pricing/basis.ts';

export const units = ['un.', 'kg', 'm', 'L'] as const;
export type Unit = (typeof units)[number];
// El IVA, en décimos: 21 %, 10,5 % y 27 % (R1.3).
export const vats = [210, 105, 270] as const;
export type Vat = (typeof vats)[number];
export const marginRange = { min: 1, max: 10_000 } as const;
// Lo que se busca (R3.1).
export const searchLimits = { letters: 80, words: 8 } as const;

const uuid = z
  .string()
  .check(z.regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/));
export const productId = uuid;

export const productsQuery = z.strictObject({
  q: z.optional(z.string().check(z.maxLength(searchLimits.letters))),
  brand: z.optional(z.string().check(z.maxLength(searchLimits.letters))),
  show: z.optional(z.enum(['noPrice', 'discontinued'])),
  // La posición en lo encontrado; con «Dados de baja», la clave y el identificador del último.
  after: z.optional(z.string().check(z.maxLength(200))),
});
export type ProductsQuery = z.infer<typeof productsQuery>;

const margin = z.nullable(z.int().check(z.minimum(marginRange.min), z.maximum(marginRange.max)));
export const marginBody = z.strictObject({ before: margin, value: margin });
export const unitBody = z.strictObject({ before: z.enum(units), value: z.enum(units) });
const vat = z.union([z.literal(210), z.literal(105), z.literal(270)]);
export const vatBody = z.strictObject({
  before: vat,
  value: vat,
  // «Deshacer» lo deja como estaba (R1.4): si era de la lista o puesto a mano. Sin esto, a mano.
  manual: z.optional(z.boolean()),
});
export type MarginBody = z.infer<typeof marginBody>;
export type UnitBody = z.infer<typeof unitBody>;
export type VatBody = z.infer<typeof vatBody>;

// Por qué no tiene precio (R2.4): lo ve cualquiera.
export type ProductState = 'priced' | 'no-price' | 'no-cost';

export type ProductRow = {
  id: string;
  code: string;
  barcode: string | null;
  description: string;
  brand: string | null;
  unit: Unit;
  vat: Vat;
  // El IVA lo puso alguien a mano: ninguna lista lo cambia.
  vatManual: boolean;
  // En centavos, como texto; sin él, `state` dice por qué.
  sale?: string;
  state: ProductState;
  discontinued: boolean;
  // Con «Ver costos» (R4.1).
  margin?: number | null;
  // En millonésimos, como texto.
  cost?: string | null;
};

export type ProductsPage = {
  products: ProductRow[];
  next?: string;
  total: number;
  noPrice: number;
  // El paso del redondeo, para los decimales del precio (R2.3).
  stepCents: number;
};

// Un producto con su cuenta, para quien ve los costos (R2.6).
export type Product = ProductRow & {
  stepCents: number;
  // Con «Ver costos»: su proveedor, la cuenta del costo y el precio sin redondear, en centavos.
  supplier?: { id: string; name: string } | null;
  basis?: CostBasis | null;
  raw?: string | null;
};

// Lo que dicen las listas del costo de un producto.
export type CostSource = { supplier: { id: string; name: string }; basis: CostBasis };

export type BrandsResponse = { brands: string[] };

// Un cambio que otro hizo antes (R1.5): el producto como está ahora.
export type ProductChanged = { error: 'product-changed'; product: ProductRow };
