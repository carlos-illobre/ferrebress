// Las tablas del esquema `anomalies` como las dejan sus migraciones. Lo genera `pnpm db:types`
// (ADR-018) y `pnpm check` controla que esté al día: no se edita a mano.
import type { ColumnType } from "kysely";

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface AnomaliesAnomalies {
  closed_at: Timestamp | null;
  id: string;
  kind: string;
  note: string | null;
  opened_at: Timestamp;
  reviewed_at: Timestamp | null;
  reviewed_by: string | null;
  status: "open" | "reviewed" | "closed";
  subject: string;
  summary: Json;
}

export interface DB {
  "anomalies.anomalies": AnomaliesAnomalies;
}
