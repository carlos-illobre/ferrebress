// Las tablas del esquema `catalog` como las dejan sus migraciones. Lo genera `pnpm db:types`
// (ADR-018) y `pnpm check` controla que esté al día: no se edita a mano.
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export interface CatalogProducts {
  barcode: string | null;
  brand: string | null;
  cost: Int8 | null;
  cost_supplier_id: string | null;
  description: string;
  discontinued: Generated<boolean>;
  id: string;
  unit: Generated<string>;
  unit_manual: Generated<boolean>;
  vat: number;
  vat_manual: Generated<boolean>;
}

export interface DB {
  "catalog.products": CatalogProducts;
}
