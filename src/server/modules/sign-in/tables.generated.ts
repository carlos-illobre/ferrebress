// Las tablas del esquema `sign_in` como las dejan sus migraciones. Lo genera `pnpm db:types`
// (ADR-018) y `pnpm check` controla que esté al día: no se edita a mano.
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Int8 = ColumnType<string, bigint | number | string, bigint | number | string>;

export type SignInClosedReason = "deactivated" | "idle" | "max-age" | "revoked" | "sign-out";

export type SignInOfflineReason = "deactivated" | "not-allowed" | "revoked-session" | "too-late" | "too-old";

export type SignInOfflineResult = "confirmed" | "ended" | "rejected";

export type SignInWay = "google" | "offline" | "passkey" | "qr";

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface SignInDevices {
  device_id: string;
  last_seen_at: Timestamp;
  name: string | null;
  public_key: Uint8Array | null;
}

export interface SignInOfflineSignIns {
  credential_id: string;
  device_id: string;
  id: string;
  last_contact_at: Timestamp | null;
  proof_public_key: Uint8Array;
  reason: SignInOfflineReason | null;
  received_at: Timestamp;
  result: SignInOfflineResult;
  session_id: string | null;
  signed_at: Timestamp;
  user_id: string;
}

export interface SignInPasskeys {
  counter: Int8;
  created_at: Timestamp;
  device_id: string;
  device_label: Generated<string>;
  id: string;
  last_used_at: Timestamp | null;
  public_id: Generated<string>;
  public_key: Uint8Array;
  revoked_at: Timestamp | null;
  user_id: string;
}

export interface SignInSessions {
  approved_by: string | null;
  closed_at: Timestamp | null;
  closed_reason: SignInClosedReason | null;
  created_at: Timestamp;
  device_id: string;
  device_label: string;
  google_at: Timestamp | null;
  id: string;
  ip_address: string;
  is_phone: Generated<boolean>;
  last_used_at: Timestamp;
  passkey_at: Timestamp | null;
  passkey_id: string | null;
  proof_public_key: Uint8Array;
  token_hash: Uint8Array;
  user_id: string;
  way: Generated<SignInWay>;
}

export interface DB {
  "sign_in.devices": SignInDevices;
  "sign_in.offline_sign_ins": SignInOfflineSignIns;
  "sign_in.passkeys": SignInPasskeys;
  "sign_in.sessions": SignInSessions;
}
