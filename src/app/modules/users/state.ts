// El estado de la pantalla de Usuarios (diseño de 02, § 8): la lista entera, pedida al abrir; la
// persona elegida y su tarjeta, pedida al elegirla; y lo que está abierto encima. No se guarda nada
// en el dispositivo. Lo comparten las piezas por UsersContext.

import { can } from '@ferrebress/shared/contracts/can';
import type { RoleRow, RoleSummary } from '@ferrebress/shared/contracts/roles';
import type { AccessResponse, PersonRow } from '@ferrebress/shared/contracts/users';
import { createContext } from 'preact';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import * as z from 'zod/mini';
import { useLatest } from '../../platform/latest.ts';
import { useMirrored } from '../../platform/mirror/use-mirrored.ts';
import { isWide } from '../../platform/narrow.ts';
import { navigate, route } from '../../platform/router.ts';
import { oneOf } from '../../platform/schema.ts';
import {
  filters,
  type Overlay,
  opened,
  openedOf,
  overlayOf,
  personId,
  searchText,
} from './overlay.ts';

export type { Overlay } from './overlay.ts';

import { online as onlineStore } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { person as me, pendingEntries } from '../sign-in/index.ts';
import { usersApi } from './api.ts';
import { type Filter, visible } from './logic.ts';
import { listPath } from './roles/paths.ts';

// Lo que trae el servidor lo pide cada dispositivo, con su sesión y su permiso; los roles, para las
// pastillas y el filtro por rol (R3.1).
function useList() {
  const [people, setPeople] = useState<PersonRow[]>(); // local: del servidor
  const [roles, setRoles] = useState<RoleSummary[]>([]); // local: del servidor
  const [failed, setFailed] = useState(false); // local: el pedido de este dispositivo
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

// La tarjeta muestra solo lo de quien está elegido: si se elige a otra persona mientras se pedía lo de
// la anterior, lo de la anterior no llega a la tarjeta.
// La persona elegida viaja al otro dispositivo (diseño de 03, § 5.1); la que la computadora abre
// sola, por su ancho, no (`auto`). Cada uno pide su tarjeta.
function useCard() {
  const [chosen, choose] = useMirrored('users.list.selected', null, z.nullable(personId));
  const selected = chosen ?? undefined;
  // local: lo que trae el servidor de la persona elegida lo pide cada dispositivo.
  const [access, setAccess] = useState<AccessResponse>();
  const shown = useRef<string | undefined>(undefined);
  const latest = useLatest();
  const loadAccess = async (id: string) => {
    if (id !== shown.current) return;
    const result = await latest(usersApi.access(id));
    if (result?.ok) setAccess(result.data);
  };
  // La elegida cambió, acá o en el otro: se pide su tarjeta.
  useEffect(() => {
    shown.current = selected;
    setAccess(undefined);
    if (selected) void loadAccess(selected);
  }, [selected]);
  const select = (id: string | undefined, auto?: true) => {
    // Tocar a la que ya está elegida la vuelve a pedir, como siempre: no cambia lo que viaja.
    if (id && id === selected) {
      setAccess(undefined);
      void loadAccess(id);
      return;
    }
    choose(id ?? null, auto ? { auto } : undefined);
  };
  return { selected, access, select, loadAccess };
}

const auditPath = '/users/audit-log';
export type Tab = 'people' | 'roles' | 'audit';

// Qué se ve de la lista: el filtro y lo buscado.
function useView() {
  const [filter, setFilter] = useMirrored<Filter>('users.list.filter', 'all', oneOf(filters));
  const [search, setSearch] = useMirrored('users.list.search', '', searchText);
  const [chosenRole, chooseRole] = useMirrored('users.list.role', null, z.nullable(personId));
  const role = chosenRole ?? undefined;
  const setRole = (id: string | undefined) => chooseRole(id ?? null);
  // La pestaña sale de la dirección: /users/roles y lo de adentro son de Roles (R7.13).
  const path = useStore(route).path;
  const tab: Tab =
    path === listPath || path.startsWith(`${listPath}/`)
      ? 'roles'
      : path === auditPath
        ? 'audit'
        : 'people';
  const paths: Record<Tab, string> = { people: '/users', roles: listPath, audit: auditPath };
  const setTab = (to: Tab) => navigate(paths[to]);
  // Con un rol abierto, en el celular el rol ocupa la pantalla (maqueta users-roles/final).
  const inRole = path.startsWith(`${listPath}/`);
  return { filter, setFilter, search, setSearch, role, setRole, tab, setTab, inRole };
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
    audit: has('audit-log.view'),
  };
}

// Los roles con sus permisos, para quien los administra (R7.3). Quiénes los tienen sale de la lista.
function useRoleRows(may: boolean) {
  // local: del servidor, con el permiso de quien mira en este dispositivo.
  const [rows, setRows] = useState<RoleRow[]>();
  // local: si el pedido de este dispositivo falló.
  const [failed, setFailed] = useState(false);
  const loadRoles = async () => {
    if (!may) return;
    const result = await usersApi.roles();
    setFailed(!result.ok);
    if (result.ok) setRows(result.data.roles);
  };
  return { roleRows: rows, loadRoles, rolesFailed: failed };
}

// Lo que hay que repetir después de confirmar quién es (R3.8), y qué da, para decirlo.
function useRetry() {
  // local: volver a confirmar quién es se hace con la huella de cada dispositivo (R3.8).
  const [retry, setRetry] = useState<{ again: () => unknown; what: string[] }>();
  return {
    retry,
    askToConfirm: (again: () => unknown, what: string[] = []) => setRetry({ again, what }),
    endConfirm: () => setRetry(undefined),
  };
}

// Si le sacan «Administrar roles» o «Ver quién hizo qué» con su pestaña abierta, se cierra (R7.8): a la
// lista de personas.
function useTabClosing(tab: Tab, may: { roles: boolean; audit: boolean }) {
  const lost = (tab === 'roles' && !may.roles) || (tab === 'audit' && !may.audit);
  useEffect(() => {
    if (lost) navigate('/users', { replace: true, force: true });
  }, [lost]);
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
  const [open, setOpen] = useMirrored('users.screen.overlay', null, z.nullable(opened));
  const overlay = overlayOf(open, list.people);
  const setOverlay = (next: Overlay | undefined) => setOpen(next ? openedOf(next) : null);
  const retrying = useRetry();
  const view = useView();
  useTabClosing(view.tab, may);
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
    if (first && !card.selected && isWide()) card.select(first, true);
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
    ...retrying,
    ...view,
  };
}

export type Users = ReturnType<typeof useUsers>;

export const UsersContext = createContext<Users | undefined>(undefined);
export const useUsersContext = () => useContext(UsersContext) as Users;
