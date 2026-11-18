// «Darle este rol a…» sin HTML (02 · R7.13): buscar entre las personas activas que todavía no lo
// tienen, por nombre o correo, sin distinguir acentos ni mayúsculas.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { useState } from 'preact/hooks';
import { plain } from '../../../platform/text.ts';
import { initialsOf } from '../logic.ts';

export function useGivePicker(candidates: PersonRow[]) {
  // local: la búsqueda de la hoja de elegir es de quien elige.
  const [query, setQuery] = useState('');
  const wanted = plain(query.trim());
  return {
    query,
    setQuery,
    shown: candidates
      .filter((one) => plain(`${one.displayName} ${one.email}`).includes(wanted))
      .map((one) => ({
        id: one.id,
        initials: initialsOf(one),
        name: one.displayName,
        email: one.email,
      })),
  };
}
