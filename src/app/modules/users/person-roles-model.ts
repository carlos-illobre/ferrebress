// Los roles de una persona en su tarjeta y autorizar a alguien, sin HTML (R3.3, R7.5): lo tildado y
// lo escrito viaja al otro dispositivo; los avisos, no.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { useState } from 'preact/hooks';
import * as z from 'zod/mini';
import { useMirrored } from '../../platform/mirror/use-mirrored.ts';
import { authorize } from './actions.ts';
import { saveRoles } from './person-roles.ts';
import { useUsersContext } from './state.ts';
import { refusalTexts } from './texts.ts';

const ids = z.array(z.string().check(z.maxLength(64))).check(z.maxLength(60));
const text = z.string().check(z.maxLength(320));
const same = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// Lo elegido, el aviso sin roles y guardar: lo comparten la computadora y el celular.
export function usePersonRoles(person: PersonRow) {
  const users = useUsersContext();
  const [chosen, setChosen] = useMirrored<string[]>(
    `users.card.roles:${person.id}`,
    person.roleIds,
    ids,
  );
  const [error, setError] = useState<string>(); // local: lo que contestó a este dispositivo
  return {
    chosen,
    error,
    changed: !same(chosen, person.roleIds),
    choose: (next: string[]) => {
      setChosen(next);
      setError(undefined);
    },
    undo: () => setChosen(person.roleIds),
    save: async () => {
      if (chosen.length === 0) return setError(refusalTexts['no-roles']);
      return saveRoles(users, person, chosen);
    },
  };
}

// Autorizar a alguien (R3.3): un correo sin forma de correo o ya cargado se dice junto al campo, sin
// perder lo escrito; sin ningún rol (E42), junto a los roles.
export function useAuthorize() {
  const users = useUsersContext();
  const [name, setName] = useMirrored('users.authorize.name', '', text);
  const [email, setEmail] = useMirrored('users.authorize.email', '', text);
  const [error, setError] = useState<string>(); // local: lo que contestó a este dispositivo
  const [roles, setRoles] = useMirrored<string[]>('users.authorize.roles', [], ids);
  const [noRoles, setNoRoles] = useState(false); // local: el aviso de este dispositivo
  const send = async (): Promise<unknown> => {
    if (!looksLikeEmail(email)) return setError(refusalTexts['bad-request']);
    if (roles.length === 0) return setNoRoles(true);
    const refused = await authorize(users, { name, email, roles }, send);
    if (refused) setError(refusalTexts[refused]);
    return undefined;
  };
  return {
    name,
    email,
    error,
    roles,
    noRoles,
    send,
    close: users.close,
    typeName: setName,
    typeEmail(value: string) {
      setEmail(value);
      setError(undefined);
    },
    chooseRoles(next: string[]) {
      setRoles(next);
      setNoRoles(false);
    },
  };
}
