// El estado de la pantalla de Usuarios (diseño de 02, § 8): la lista entera, pedida al abrir; la
// persona elegida y su tarjeta, pedida al elegirla; y lo que está abierto encima. No se guarda nada
// en el dispositivo. Lo comparten las piezas por UsersContext.

import { can } from '@ferrebress/shared/contracts/can';
import type { RoleRow, RoleSummary } from '@ferrebress/shared/contracts/roles';
import type { AccessResponse, PersonRow } from '@ferrebress/shared/contracts/users';
import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { type ApiResult, online as onlineStore } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { showToast } from '../../ui/toast/Toast.tsx';
import { person as me, pendingEntries } from '../sign-in/index.ts';
import type { RoleDraft } from './api.ts';
import { usersApi } from './api.ts';
import { type Filter, visible } from './logic.ts';
import { refusalTexts, somethingFailed } from './texts.ts';

// Lo que se abre encima: autorizar, «Se perdió un celular» y las dos confirmaciones. Volver a
// confirmar quién es va aparte, encima de lo que haya, así autorizar sigue abierto debajo.
export type Overlay =
  | { kind: 'authorize' }
  | { kind: 'lost' }
  | { kind: 'deactivate'; person: PersonRow }
  | { kind: 'close-all'; person: PersonRow }
  | { kind: 'search' };

type Failed = Extract<ApiResult<unknown>, { ok: false }>;

function useList() {
  const [people, setPeople] = useState<PersonRow[]>();
  // Los roles, para las pastillas y el filtro por rol (R3.1).
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [failed, setFailed] = useState(false);
  const load = async () => {
    const result = await usersApi.people();
    setFailed(!result.ok);
    if (!result.ok) return;
    setPeople(result.data.people);
    setRoles(result.data.roles);
  };
  // Una persona como quedó después de un cambio: conserva sus cantidades y si tiene más permisos,
  // que el cambio no trae.
  const put = (row: PersonRow) =>
    setPeople((all = []) =>
      all.some((one) => one.id === row.id)
        ? all.map((one) =>
            one.id === row.id
              ? { ...row, sessions: one.sessions, phones: one.phones, outranks: one.outranks }
              : one,
          )
        : [...all, row],
    );
  const drop = (id: string) => setPeople((all = []) => all.filter((one) => one.id !== id));
  const patch = (id: string, change: Partial<PersonRow>) =>
    setPeople((all = []) => all.map((one) => (one.id === id ? { ...one, ...change } : one)));
  // Lo que cerró o quitó un cambio en sus sesiones y celulares.
  const recount = (id: string, sessions: number, phones: number) =>
    setPeople((all = []) =>
      all.map((one) =>
        one.id === id
          ? {
              ...one,
              sessions: Math.max(0, one.sessions - sessions),
              phones: Math.max(0, one.phones - phones),
            }
          : one,
      ),
    );
  return { people, roles, failed, load, put, drop, patch, recount };
}

function useCard() {
  const [selected, setSelected] = useState<string>();
  const [access, setAccess] = useState<AccessResponse>();
  const loadAccess = async (id: string) => {
    const result = await usersApi.access(id);
    if (result.ok) setAccess(result.data);
  };
  const select = (id: string | undefined) => {
    setSelected(id);
    setAccess(undefined);
    if (id) void loadAccess(id);
  };
  return { selected, access, select, loadAccess };
}

// Qué se ve de la lista: el filtro y lo buscado.
function useView() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>();
  // La pestaña: las personas o, con «Administrar roles», los roles (R7.3).
  const [tab, setTab] = useState<'people' | 'roles'>('people');
  // El rol abierto en la pestaña Roles, o uno nuevo (con lo de otro, al duplicar).
  const [roleCard, setRoleCard] = useState<string>();
  const [draft, setDraft] = useState<RoleDraft>();
  return {
    ...{ filter, setFilter, search, setSearch, role, setRole, tab, setTab },
    ...{ roleCard, setRoleCard, draft, setDraft },
  };
}

// Lo que puede hacer quien mira (R7.7, R7.11): lo demás no aparece; el servidor igual lo rechaza.
function useMay() {
  const who = useStore(me);
  const has = (id: Parameters<typeof can>[1]) => can(who, id);
  const over = (target: PersonRow) => !target.outranks;
  return {
    authorize: has('users.manage') && has('roles.manage'),
    manage: has('users.manage'),
    // Cambiar el correo, dar de baja y de alta: no sobre quien tiene más.
    manageOver: (target: PersonRow) => has('users.manage') && over(target),
    cutOver: (target: PersonRow) => has('users.cut') && over(target),
    cut: has('users.cut'),
    roles: has('roles.manage'),
  };
}

// Los roles con sus permisos y quiénes los tienen, para quien los administra (R7.3).
function useRoleRows(may: boolean) {
  const [rows, setRows] = useState<RoleRow[]>();
  const loadRoles = async () => {
    if (!may) return;
    const result = await usersApi.roles();
    if (result.ok) setRows(result.data.roles);
  };
  return { roleRows: rows, loadRoles };
}

export function useUsers() {
  const list = useList();
  const may = useMay();
  const roleRows = useRoleRows(may.roles);
  const card = useCard();
  const online = useStore(onlineStore);
  // Una entrada sin conexión que el servidor todavía no confirmó: su sesión todavía no existe allá
  // y un pedido la daría por cerrada (15 · R3). Se espera a que la confirme.
  const unconfirmed = useStore(pendingEntries) > 0;
  const [overlay, setOverlay] = useState<Overlay>();
  // Lo que hay que repetir después de confirmar quién es (R3.8).
  const [retry, setRetry] = useState<{ again: () => unknown }>();
  const view = useView();
  // Al abrir; sin conexión, cuando vuelve (con la lista que ya tenía no se pide de nuevo).
  useEffect(() => {
    if (online && !unconfirmed && !list.people) void list.load();
    if (online && !unconfirmed && !roleRows.roleRows) void roleRows.loadRoles();
  }, [online, unconfirmed, may.roles]);
  const shown = list.people ? visible(list.people, view.filter, view.search, view.role) : [];
  // En la computadora, la tarjeta nunca queda vacía: sin nadie elegido, el primero de la lista (la
  // propia). En lo angosto la tarjeta tapa la lista, así que no se abre sola.
  const first = shown[0]?.id;
  useEffect(() => {
    if (first && !card.selected && matchMedia('(min-width: 900px)').matches) card.select(first);
  }, [first, card.selected]);
  const person = list.people?.find((one) => one.id === card.selected);
  return {
    ...list,
    ...card,
    may,
    ...roleRows,
    // Después de un cambio de roles: la lista y los roles, que cambian juntos.
    reload: () => Promise.all([list.load(), roleRows.loadRoles()]),
    online,
    person,
    shown,
    overlay,
    open: setOverlay,
    close: () => setOverlay(undefined),
    retry,
    confirmFirst: (again: () => unknown) => setRetry({ again }),
    confirmed: () => setRetry(undefined),
    ...view,
  };
}

export type Users = ReturnType<typeof useUsers>;

export const UsersContext = createContext<Users | undefined>(undefined);
export const useUsersContext = () => useContext(UsersContext) as Users;

// Autorizar y dar de alta pueden pedir confirmar quién es (R3.8): se abre la hoja, que al confirmar
// repite lo que se estaba haciendo. Dice si era eso.
export function confirmFirst(users: Users, result: Failed, retry: () => unknown): boolean {
  if (result.error !== 'confirm-first') return false;
  users.confirmFirst(retry);
  return true;
}

// Cualquier otro rechazo: con una versión vieja, la persona como quedó; si ya no está (`target`: en
// las rutas de una sesión o un celular, un 404 puede ser solo de ellos), se saca; y se dice.
export function refused(users: Users, result: Failed, target?: string): void {
  const person = (result as { person?: PersonRow }).person;
  if (person) users.put(person);
  if (result.error === 'not-found' && target) {
    users.select(undefined);
    users.drop(target);
  }
  showToast(refusalTexts[result.error] ?? somethingFailed, 'triangle-alert');
}
