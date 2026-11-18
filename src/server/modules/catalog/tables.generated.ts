// Las tablas del esquema `catalog` como las dejan sus migraciones. Lo genera `pnpm db:types`
// (ADR-018) y `pnpm check` controla que esté al día: no se edita a mano.
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export interface CatalogPricing {
  id: Generated<boolean>;
  step_cents: number;
}

export interface CatalogProducts {
  barcode: string | null;
  brand: string | null;
  brand_key: string | null;
  cost: Int8 | null;
  cost_supplier_id: string | null;
  description: string;
  discontinued: Generated<boolean>;
  id: string;
  margin: number | null;
  raw_cents: Int8 | null;
  sale_cents: Int8 | null;
  search_key: Generated<string>;
  supplier_code: Generated<string>;
  unit: Generated<string>;
  unit_manual: Generated<boolean>;
  vat: number;
  vat_from_list: number;
  vat_manual: Generated<boolean>;
}

export interface DB {
  "catalog.pricing": CatalogPricing;
  "catalog.products": CatalogProducts;
}
