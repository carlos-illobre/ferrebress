// Lo que se dice de cada persona en la lista y en su tarjeta (02 · R3.1), resuelto para cualquier
// vista: su tono, sus letras, su nombre o que no tiene, sus roles, cuándo entró y cuántas sesiones y
// celulares tiene; lo que muestra su tarjeta. Y los grupos de la lista, con qué se dice si no queda
// nadie.
import type { RoleSummary } from '@ferrebress/shared/contracts/roles';
import type { AccessResponse, PersonRow } from '@ferrebress/shared/contracts/users';
import { dateOf, nowMs, sinceOf } from '../../platform/time.ts';
import { deviceOf, footOf, initialsOf, wayNames } from './logic.ts';
import { cardTexts, texts } from './texts.ts';

// Dos tonos que se alternan por persona, siempre el mismo para cada una (maqueta).
const toneOf = (id: string) => [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2;

export function personLines(person: PersonRow, roles: readonly RoleSummary[], now: number) {
  const noName = person.displayName === person.email;
  return {
    id: person.id,
    tone: toneOf(person.id),
    active: person.active,
    // Las letras del círculo; dada de baja, ninguna (se ve el ícono de baja).
    initials: person.active ? initialsOf(person) : undefined,
    name: person.displayName,
    self: person.self,
    email: noName ? undefined : person.email,
    noName: noName ? texts.noName : undefined,
    roles: roles
      .filter((role) => person.roleIds.includes(role.id))
      .map((role) => ({ id: role.id, name: role.name })),
    last:
      person.lastSignInAt === null
        ? { never: true, text: texts.neverSignedIn }
        : { never: false, text: texts.signedIn(sinceOf(person.lastSignInAt, now)) },
    // Solo si tiene alguna.
    sessions: person.sessions > 0 ? person.sessions : undefined,
    phones: person.phones > 0 ? person.phones : undefined,
  };
}

export type PersonLines = ReturnType<typeof personLines>;

// «Pueden entrar» y «Dadas de baja», sin los grupos vacíos.
export const listGroups = (shown: readonly PersonLines[]) =>
  [
    { title: texts.canEnter, people: shown.filter((person) => person.active) },
    { title: texts.deactivatedGroup, people: shown.filter((person) => !person.active) },
  ].filter((group) => group.people.length > 0);

// Sin nadie: con lo buscado, lo dice y cómo buscar; si no, que el filtro no tiene a nadie.
export function emptyOf(search: string) {
  const wanted = search.trim();
  return wanted
    ? { title: texts.nobody(wanted), hint: texts.nobodyHint }
    : { title: texts.nobodyHere, hint: undefined };
}

type May = { manage: boolean; manageOver: (person: PersonRow) => boolean };

// Lo que muestra la tarjeta (maquetas de 02, R7.11): si el nombre se cambia; el correo, fijo, para
// cambiar (si nunca entró y no tiene más permisos que quien mira) o atado a su cuenta; desde cuándo;
// qué va en el medio (la explicación de una dada de baja o de quien nunca entró, o sus accesos) y qué
// va al pie.
export function cardLines(person: PersonRow, may: May, now: number) {
  const authorized = dateOf(person.authorizedAt, now);
  return {
    nameEditable: may.manage,
    namePlaceholder: cardTexts.namePlaceholder(person.neverSignedIn),
    email: !person.neverSignedIn
      ? ('bound' as const)
      : may.manageOver(person)
        ? ('editable' as const)
        : ('fixed' as const),
    when: person.deactivatedAt
      ? cardTexts.deactivatedAt(dateOf(person.deactivatedAt, now))
      : person.authorizedBy
        ? cardTexts.authorizedAt(authorized)
        : cardTexts.installed(authorized),
    middle: !person.active
      ? ('off' as const)
      : person.neverSignedIn
        ? ('never' as const)
        : ('access' as const),
    neverHint: cardTexts.neverHint(person.email),
    foot: footOf(person, may),
  };
}

type AccessMay = { roles: boolean; cutOver: (person: PersonRow) => boolean };

// Sus sesiones y sus celulares (R5), resueltos: cada uno con su dispositivo y desde cuándo, si se
// pueden cerrar o quitar (R7.7), «Cerrar todas» solo si hay alguna, y los botones del celular, cada
// uno si se puede y si hay algo que hacer. Con un solo celular, «Quitar huella» lo quita.
export function accessLines(
  person: PersonRow,
  access: AccessResponse,
  may: AccessMay,
  online: boolean,
  now: number,
) {
  const cut = may.cutOver(person);
  return {
    cut,
    sessions: access.sessions.map((session) => ({
      session,
      phone: session.isPhone,
      device: deviceOf(session),
      line: cardTexts.sessionLine(wayNames[session.way], sinceOf(session.createdAt, now)),
      used: cardTexts.usedSession(sinceOf(session.lastUsedAt, now)),
    })),
    phones: access.phones.map((phone) => ({
      phone,
      device: deviceOf(phone),
      linked: cardTexts.linked(dateOf(phone.createdAt, now)),
      used: cardTexts.usedPhone(
        phone.lastUsedAt === null ? undefined : sinceOf(phone.lastUsedAt, now),
      ),
    })),
    closeAll: cut && access.sessions.length > 0,
    tiles: {
      cut: { allowed: cut, off: access.sessions.length === 0 || !online },
      passkey: { allowed: cut, off: access.phones.length === 0 || !online },
      roles: { allowed: may.roles, off: false },
    },
    onlyPhone: access.phones.length === 1 ? access.phones[0] : undefined,
  };
}

export type AccessLines = ReturnType<typeof accessLines>;

// Lo que se dice de la elegida y de cada una, en sus grupos; y qué se dice sin nadie.
export function shownOf(seen: {
  shown: PersonRow[];
  person: PersonRow | undefined;
  roles: RoleSummary[];
  may: May & AccessMay;
  search: string;
  access: AccessResponse | undefined;
  online: boolean;
}) {
  const now = nowMs();
  const lines = seen.shown.map((one) => personLines(one, seen.roles, now));
  const { person, access } = seen;
  return {
    personLines: person && personLines(person, seen.roles, now),
    cardLines: person && cardLines(person, seen.may, now),
    accessLines: person && access && accessLines(person, access, seen.may, seen.online, now),
    groups: listGroups(lines),
    empty: lines.length === 0 ? emptyOf(seen.search) : undefined,
  };
}
