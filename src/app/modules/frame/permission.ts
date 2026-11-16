// Los permisos en el marco, sin HTML (02 · R7.7, R7.8): qué se mira (lo de adentro con su propio
// permiso), «Sin permiso» al abrir por la dirección algo que no puede usar y «Ya no tenés permiso»
// cuando se lo sacan con la pantalla abierta.
import type { PermissionId } from '@ferrebress/shared/contracts/permissions';
import { permissionOf } from '@ferrebress/shared/contracts/permissions';
import type { HoldersResponse } from '@ferrebress/shared/contracts/roles';
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { route } from '../../platform/router.ts';
import { useScreen } from '../../platform/screens.ts';
import { api } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { notify } from '../../platform/view/notify.ts';
import { allowed, firstOption, goToFirst, insideAt, type Option } from './menu.ts';
import { words } from './no-permission-texts.ts';
import { frameSettings } from './settings.ts';

export type LostPermission = { option: Option; before: Person; after: Person };

// Lo que se mira: lo de adentro con su propio permiso, si la dirección es suya (05 · E13). Abierto por
// la dirección sin el permiso, «Sin permiso»; si se lo sacan con eso abierto, no: lo cierra la
// pantalla de la opción (02 · R7.8).
function useGuarded(person: Person, opened: Option | undefined) {
  const path = useStore(route).path;
  const inner = insideAt(opened, path);
  const had = useRef<string>(undefined);
  if (!inner) had.current = undefined;
  else if (allowed(inner, person)) had.current = path;
  return inner && had.current !== path ? inner : opened;
}

// El área de trabajo: la pantalla de la opción abierta, o «Sin permiso» si no la puede usar (R7.7).
export function useWork(person: Person, opened: Option | undefined) {
  const guarded = useGuarded(person, opened);
  const blocked = guarded?.permission && !allowed(guarded, person) ? guarded.permission : undefined;
  return {
    blocked: guarded && blocked ? { ...guarded, permission: blocked } : undefined,
    first: firstOption(person),
    goToFirst: () => goToFirst(person),
  };
}

// R7.8: si con los permisos nuevos ya no puede usar la pantalla abierta, lo dice y la deja.
export function useLostPermission(person: Person, opened: Option | undefined) {
  const before = useRef(person);
  // local: el permiso perdido de la sesión de este dispositivo.
  const [now, setNow] = useState<LostPermission>();
  useEffect(() => {
    const was = before.current;
    before.current = person;
    // La que se veía: la de la dirección o, sin ninguna, la primera que podía usar (R1.4).
    const shown = opened ?? firstOption(was);
    if (was !== person && allowed(shown, was) && !allowed(shown, person))
      setNow({ option: shown, before: was, after: person });
  }, [person, opened]);
  const go = useCallback(() => {
    setNow(undefined);
    goToFirst(person);
  }, [person]);
  return { now, go, first: firstOption(person) };
}

// «Ya no tenés permiso»: los roles que le sacaron y, a los segundos del ajuste, a su primera opción.
export function usePermissionLost(lost: LostPermission, onGo: () => void) {
  // local: la cuenta regresiva de este aviso.
  const [left, setLeft] = useState(frameSettings.permissionLostSeconds);
  useEffect(() => {
    const timer = setInterval(() => setLeft((seconds) => seconds - 1), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (left <= 0) onGo();
  }, [left, onGo]);
  const kept = new Set(lost.after.roles.map((role) => role.id));
  return {
    left: Math.max(left, 0),
    part: Math.max(left, 0) / frameSettings.permissionLostSeconds,
    removed: lost.before.roles.filter((role) => !kept.has(role.id)).map((role) => role.name),
    // Los que tenía, cada uno con si se lo sacaron.
    had: lost.before.roles.map((role) => ({ ...role, gone: !kept.has(role.id) })),
  };
}

// «Sin permiso»: qué permiso falta, quiénes lo tienen (lo trae el servidor) y copiar el pedido.
export function useNoPermission(person: Person, option: Option & { permission: PermissionId }) {
  const permission = permissionOf(option.permission);
  // local: lo que trae el servidor para este dispositivo.
  const [holders, setHolders] = useState<HoldersResponse>();
  useEffect(() => {
    void api<HoldersResponse>(`/api/permissions/${option.permission}/holders`).then(
      (reply) => reply.ok && setHolders(reply.data),
    );
  }, [option.permission]);
  const model = {
    permission,
    holders,
    // Por dónde entró, para que se entienda de qué pantalla se habla.
    address: `${location.host}${option.path as string}`,
    async copy() {
      await navigator.clipboard.writeText(words.request(person.name, permission.name, option.name));
      notify(words.copied, 'copy');
    },
  };
  useScreen('no-permission', model);
  return model;
}

export type NoPermissionModel = ReturnType<typeof useNoPermission>;
