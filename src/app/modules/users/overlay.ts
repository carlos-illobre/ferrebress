// Lo que se abre encima de Usuarios y cómo viaja al otro dispositivo (diseño de 03, § 5.1): qué es y,
// si es de una persona, cuál; la persona sale de la lista de cada uno.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import * as z from 'zod/mini';
import { oneOf } from '../../platform/schema.ts';

// Lo que se abre encima: autorizar, «Se perdió un celular» y las dos confirmaciones. Volver a
// confirmar quién es va aparte, encima de lo que haya, así autorizar sigue abierto debajo.
export type Overlay =
  | { kind: 'authorize' }
  | { kind: 'lost' }
  | { kind: 'deactivate'; person: PersonRow }
  | { kind: 'close-all'; person: PersonRow }
  | { kind: 'search' };

// Lo abierto encima, como viaja: qué es y, si es de una persona, cuál (la persona sale de la lista).
const kinds = ['authorize', 'lost', 'deactivate', 'close-all', 'search'] as const;
export const personId = z.string().check(z.maxLength(64));
export const opened = z.object({ kind: oneOf(kinds), id: z.nullable(personId) });
type Opened = z.infer<typeof opened>;
export const filters = ['all', 'active', 'never', 'off'] as const;
export const searchText = z.string().check(z.maxLength(200));

export const openedOf = (overlay: Overlay): Opened =>
  'person' in overlay
    ? { kind: overlay.kind, id: overlay.person.id }
    : { kind: overlay.kind, id: null };

export function overlayOf(
  open: Opened | null,
  people: PersonRow[] | undefined,
): Overlay | undefined {
  if (!open) return undefined;
  if (open.kind !== 'deactivate' && open.kind !== 'close-all') return { kind: open.kind };
  const person = people?.find((one) => one.id === open.id);
  return person && { kind: open.kind, person };
}
