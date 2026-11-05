// El protocolo del vínculo, versión 1 (diseño de 03, § 4.4): lo que se dicen la computadora y el
// celular por el directo o por el servidor. El transporte no lo conoce: acá se valida cada mensaje que
// llega, y lo que no tiene una forma conocida vuelve como `unknown` (para el diario), nunca tira.
// Sumar un mensaje es sumar su esquema a la tabla: quien lo recibe no compila sin manejarlo.

import * as z from 'zod/mini';
import { type Json, type Patch, sizeOf } from '../../platform/mirror/registry.ts';
import { flag, oneOf, type TaggedOf, tagged } from '../../platform/schema.ts';

export const protocolVersion = 1;

// Por qué se va uno: lo que la máquina de estados recibe como `peerGone` en el otro.
export const byeReasons = ['hidden', 'signout', 'lost', 'handover', 'replaced', 'unpair'] as const;

// Un valor del espejo: lo valida el espejo con el esquema de su clave.
const json = z.unknown() as unknown as z.ZodMiniType<Json>;
const count = (min: number) => z.int().check(z.minimum(min));
const patch = z.strictObject({
  k: z.string().check(z.minLength(1), z.maxLength(200)),
  v: json,
  c: count(0),
  l: flag,
});
const patches = z.array(patch).check(z.maxLength(500));
const bare = <const T extends string>(t: T) => z.strictObject({ t: oneOf([t]) });

// Uno por tipo de mensaje, elegido por `t`.
const messages = {
  // `app`: la versión del código; `clock`: el reloj más alto del que sigue (§ 5.2).
  hello: z.strictObject({
    t: oneOf(['hello']),
    v: oneOf([protocolVersion]),
    app: z.string().check(z.maxLength(64)),
    clock: z.optional(count(0)),
  }),
  bye: z.strictObject({ t: oneOf(['bye']), why: oneOf(byeReasons) }),
  pause: bare('pause'),
  resume: bare('resume'),
  probe: bare('probe'),
  'give-up': bare('give-up'),
  // Cambios del espejo, y la foto en partes de hasta 64 KB (`part` de `of`).
  patch: z.strictObject({ t: oneOf(['patch']), p: patches }),
  snap: z.strictObject({
    t: oneOf(['snap']),
    p: patches,
    part: count(0),
    of: count(1).check(z.maximum(64)),
  }),
};
const message = tagged('t', messages);

export type WireMessage = TaggedOf<typeof messages>;
export type ByeReason = (typeof byeReasons)[number];
export type Snap = Extract<WireMessage, { t: 'snap' }>;

// Lo que llegó: el mensaje tipado, o `unknown` con lo mínimo para anotar (sin el contenido).
export type Received = { ok: true; message: WireMessage } | { ok: false; kind: string };

export function read(raw: Json): Received {
  const parsed = message(raw);
  if (parsed.success) return { ok: true, message: parsed.data as WireMessage };
  const kind =
    raw !== null && typeof raw === 'object' && !Array.isArray(raw) && typeof raw.t === 'string'
      ? raw.t.slice(0, 20)
      : typeof raw;
  return { ok: false, kind };
}

// La foto, en partes que entran en un mensaje: se corta por cantidad de bytes, no de claves.
export function snapParts(photo: Patch[], maxBytes: number): Snap[] {
  const groups: Patch[][] = [[]];
  let size = 0;
  for (const item of photo) {
    const bytes = sizeOf(item) + 1;
    const current = groups.at(-1) as Patch[];
    if (current.length > 0 && size + bytes > maxBytes) {
      groups.push([item]);
      size = bytes;
    } else {
      current.push(item);
      size += bytes;
    }
  }
  return groups.map((p, part) => ({ t: 'snap' as const, p, part, of: groups.length }));
}

// Junta las partes de una foto; devuelve la foto entera cuando llegó la última.
export function createSnapAssembler() {
  let parts: Patch[][] = [];
  return (received: Snap): Patch[] | undefined => {
    if (received.part === 0) parts = [];
    if (received.part !== parts.length) return undefined;
    parts.push(received.p);
    if (parts.length < received.of) return undefined;
    const photo = parts.flat();
    parts = [];
    return photo;
  };
}
