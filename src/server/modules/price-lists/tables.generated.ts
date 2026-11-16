// Las tablas del esquema `price_lists` como las dejan sus migraciones. Lo genera `pnpm db:types`
// (ADR-018) y `pnpm check` controla que esté al día: no se edita a mano.
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface PriceListsFiles {
  deleting_at: Timestamp | null;
  sha256: Uint8Array;
  size: Int8;
  stored_at: Timestamp;
}

export interface PriceListsItems {
  barcode: string | null;
  basis: Json;
  brand: string | null;
  cost: Int8;
  description: string;
  discontinued: Generated<boolean>;
  discontinued_list_id: string | null;
  list_id: string;
  product_id: string;
  search_key: string;
  supplier_code: string;
  supplier_id: string;
  vat: number;
}

export interface PriceListsListRows {
  abs_variation: Generated<number | null>;
  barcode: string | null;
  basis: Json | null;
  brand: string | null;
  cells: Json | null;
  change: string | null;
  cost: Int8 | null;
  description: string | null;
  list_id: string;
  list_price: Int8 | null;
  previous_cost: Int8 | null;
  row: number;
  search_key: string | null;
  sheet: number;
  skipped: string | null;
  supplier_code: string | null;
  vat: number | null;
}

export interface PriceListsLists {
  attempts: Generated<number>;
  date_from: string | null;
  decided_at: Timestamp | null;
  decided_by: string | null;
  file_name: string;
  file_sha256: Uint8Array | null;
  id: string;
  list_date: Timestamp | null;
  new_reader: Generated<boolean>;
  read_at: Timestamp | null;
  reader_id: string | null;
  reason: string | null;
  result: Json | null;
  rows_read: number | null;
  rows_total: number | null;
  scope: Generated<string>;
  size_confirmed: Generated<boolean>;
  status: "queued" | "reading" | "pending" | "applying" | "applied" | "discarded" | "unreadable";
  supplier_confirmed: Generated<boolean>;
  supplier_from: string | null;
  supplier_id: string | null;
  uploaded_at: Timestamp;
  uploaded_by: string;
  waiting_for: string | null;
}

export interface PriceListsReaders {
  active: Generated<boolean>;
  code: string | null;
  code_sha: Uint8Array | null;
  created_at: Timestamp;
  file_key: string | null;
  id: string;
  last_list_id: string | null;
  origin: string;
  params: Json | null;
  pending_list_id: string | null;
  proof_list_id: string | null;
  supplier_id: string | null;
  template: string | null;
}

export interface PriceListsSuppliers {
  email: string | null;
  id: string;
  inactive: Generated<boolean>;
  last_list_date: Timestamp | null;
  last_list_id: string | null;
  name: string;
  name_key: string;
  note: string | null;
  phone: string | null;
  seller: string | null;
  terms: Json;
  terms_version: number;
}

export interface DB {
  "price_lists.files": PriceListsFiles;
  "price_lists.items": PriceListsItems;
  "price_lists.list_rows": PriceListsListRows;
  "price_lists.lists": PriceListsLists;
  "price_lists.readers": PriceListsReaders;
  "price_lists.suppliers": PriceListsSuppliers;
}
