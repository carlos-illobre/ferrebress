// Las tablas del esquema `administration` como las dejan sus migraciones. Lo genera `pnpm db:types`
// (ADR-018) y `pnpm check` controla que esté al día: no se edita a mano.
export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export interface AdministrationSettings {
  changed_by: string;
  key: string;
  value: Json;
  version: number;
}

export interface DB {
  "administration.settings": AdministrationSettings;
}
