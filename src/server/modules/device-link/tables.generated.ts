// Las tablas del esquema `device_link` como las dejan sus migraciones. Lo genera `pnpm db:types`
// (ADR-018) y `pnpm check` controla que esté al día: no se edita a mano.
import type { ColumnType } from "kysely";

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface DeviceLinkPairings {
  computer_device_id: string;
  computer_label: string;
  created_at: Timestamp;
  id: string;
  mirrored_at: Timestamp;
  paired_by: "button" | "sign-in";
  paused_at: Timestamp | null;
  phone_device_id: string;
  phone_label: string;
  user_id: string;
}

export interface DB {
  "device_link.pairings": DeviceLinkPairings;
}
