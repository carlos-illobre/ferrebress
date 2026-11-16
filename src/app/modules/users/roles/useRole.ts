// El modelo de la pantalla de un rol, nuevo o que existe (02 · R7.13), sin HTML: el borrador, que
// vive en esta pantalla y se pierde al salir de ella; guardar, borrar y duplicar; la pregunta de
// salir con cambios; y elegir a quién darle el rol. Nada se guarda hasta «Guardar rol», que guarda
// todo junto.
import type { RoleRow } from '@ferrebress/shared/contracts/roles';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { useEffect, useRef, useState } from 'preact/hooks';
import * as z from 'zod/mini';
import { useMirrored } from '../../../platform/mirror/use-mirrored.ts';
import { guardNavigation, navigate } from '../../../platform/router.ts';
import { flag } from '../../../platform/schema.ts';
import { useScreen } from '../../../platform/screens.ts';
import { notify } from '../../../platform/view/notify.ts';
import { registerWork } from '../../frame/index.ts';
import { usersApi } from '../api.ts';
import { refusalText } from '../refusals.ts';
import { type Users, useUsersContext } from '../state.ts';
import { somethingFailed } from '../texts.ts';
import { removeRole, type SaveOutcome, saveDraft } from './actions.ts';
import {
  type Draft,
  type DraftErrors,
  give,
  hasErrors,
  isDirty,
  reapply,
  validate,
} from './draft.ts';
import { whatItGives } from './gives.ts';
import { activeHolders, ids, listPath, newPath } from './paths.ts';
import { rolesTexts as t } from './texts.ts';

// Mientras hay cambios, salir por otro lado pregunta (E64); se saca al desmontar o al descartar.
function useLeaveGuard(dirty: boolean) {
  // local: la pregunta de salir sin guardar, de quien sale.
  const [asking, setAsking] = useState<() => void>();
  useEffect(() => {
    if (!dirty) return undefined;
    return guardNavigation((go) => setAsking(() => go));
  }, [dirty]);
  const stay = () => setAsking(undefined);
  const leave = () => {
    const go = asking as () => void;
    stay();
    go();
  };
  return { asking: !!asking, stay, leave };
}

const contextOf = (users: Users) => {
  // La pantalla del rol se abre con las personas y los roles ya traídos (useRoles).
  const people = users.people as PersonRow[];
  return {
    roles: users.roleRows as RoleRow[],
    me: (people.find((one) => one.self) as PersonRow).id,
    roleIdsOf: Object.fromEntries(people.map((one) => [one.id, one.roleIds])),
  };
};

const nameIn = (users: Users) => (id: string) =>
  ((users.people as PersonRow[]).find((one) => one.id === id) as PersonRow).displayName;

// Otro cambió el rol mientras se armaba: el borrador vuelve a ponerse encima de lo de ahora.
async function changedOver(users: Users, draft: Draft, setDraft: (draft: Draft) => void) {
  const [roles, people] = await Promise.all([usersApi.roles(), usersApi.people()]);
  const role = roles.ok && roles.data.roles.find((one) => one.id === draft.id);
  if (!role || !people.ok) {
    notify(somethingFailed, 'triangle-alert');
    return undefined;
  }
  setDraft(reapply(draft, role, ids(activeHolders(people.data.people, role.id))));
  await users.reload();
  return t.changedOver;
}

async function saved(users: Users, draft: Draft, id: string) {
  await users.reload();
  notify((draft.id ? t.saved : t.created)(draft.name.trim()), 'shield-check');
  navigate(listPath, { force: true, state: { arriving: id } });
}

// Guardar (R7.13): lo que ya se sabe se dice sin preguntar; después, un solo pedido. Si pide
// confirmar quién es, lo repite; si otro cambió el rol, vuelve a poner el borrador encima.
function useSave(users: Users, draft: Draft, setDraft: (draft: Draft) => void) {
  // local: lo que contestó el servidor a este dispositivo.
  const [errors, setErrors] = useState<DraftErrors>();
  // local: el aviso de este dispositivo.
  const [notice, setNotice] = useState<string>();
  const notSaved = (outcome: Exclude<SaveOutcome, { ok: true }>, again: () => unknown) => {
    if (outcome.kind === 'confirm-first')
      return users.askToConfirm(again, whatItGives(draft, nameIn(users)));
    if (outcome.kind === 'changed') return changedOver(users, draft, setDraft).then(setNotice);
    if (outcome.kind === 'other') return notify(refusalText(outcome.error), 'triangle-alert');
    return setErrors(outcome.errors);
  };
  const save = async (): Promise<unknown> => {
    const known = validate(draft, contextOf(users));
    setNotice(undefined);
    if (hasErrors(known)) return setErrors(known);
    const outcome = await saveDraft(draft);
    return outcome.ok ? saved(users, draft, outcome.id) : notSaved(outcome, save);
  };
  // Al corregir, lo marcado se vuelve a mirar, así se apaga.
  const recheck = (next: Draft) => errors && setErrors(validate(next, contextOf(users)));
  return { errors, notice, save, recheck };
}

// Borrar: si alguien lo tiene, también dado de baja, lo dice sin preguntar al servidor (R7.3, E39).
async function remove(users: Users, draft: Draft) {
  const id = draft.id as string;
  const holding = (users.people as PersonRow[]).filter((one) => one.roleIds.includes(id));
  const names = holding.map((one) =>
    one.active ? one.displayName : t.inactiveMark(one.displayName),
  );
  if (names.length > 0) return notify(t.inUse(names), 'triangle-alert');
  const result = await removeRole({ id, version: draft.version });
  if (!result.ok) return notify(refusalText(result.error), 'triangle-alert');
  await users.reload();
  notify(t.removed(draft.original.name), 'trash-2');
  return navigate(listPath, { force: true });
}

// Lo armado es trabajo a medio hacer (01 · E25, E26): si después de una sesión cerrada entra otra
// persona, se descarta, junto con la hoja de confirmar que hubiera abierta (revisión de seguridad,
// 46); y la versión nueva no se aplica sola encima (00 · R5.6).
function useHalfDone(users: Users, dirty: boolean) {
  const pending = useRef(dirty);
  pending.current = dirty;
  useEffect(
    () =>
      registerWork({
        pending: () => pending.current,
        discard: () => {
          users.endConfirm();
          navigate(listPath, { replace: true, force: true });
        },
      }),
    [],
  );
}

// El rol que se está armando viaja al otro dispositivo, con lo tildado sin guardar (diseño de 03,
// § 5.1). Va como texto: el servidor valida lo que se guarda, y uno que no es de este rol no entra.
const draftText = z.string().check(z.maxLength(64 * 1024));

function useDraft(start: Draft): [Draft, (next: Draft) => void] {
  const [text, setText] = useMirrored(`users.role.draft:${start.id ?? 'new'}`, '', draftText);
  let draft = start;
  try {
    const read = JSON.parse(text) as Draft;
    if (read.id === start.id) draft = read;
  } catch {
    // Sin nada escrito todavía (o algo que no se entiende): el rol como llegó.
  }
  return [draft, (next) => setText(JSON.stringify(next))];
}

// Elegir a quién darle el rol (R7.5) viaja al otro dispositivo, como lo demás de la pantalla.
function usePicker(draft: Draft, change: (next: Draft) => void) {
  const [picking, setPicking] = useMirrored('users.role.picking', false, flag);
  return {
    picking,
    openPicker: () => setPicking(true),
    closePicker: () => setPicking(false),
    giveTo(id: string) {
      change(give(draft, id));
      setPicking(false);
    },
  };
}

export function useRoleScreen(start: Draft) {
  const users = useUsersContext();
  const [draft, setDraft] = useDraft(start);
  const dirty = isDirty(draft);
  const leaving = useLeaveGuard(dirty);
  useHalfDone(users, dirty);
  const saving = useSave(users, draft, setDraft);
  const change = (next: Draft) => {
    setDraft(next);
    saving.recheck(next);
  };
  const picker = usePicker(draft, change);
  const model = {
    draft,
    dirty,
    online: users.online,
    people: users.people as PersonRow[],
    title: draft.id ? start.name : t.newTitle,
    crumb: draft.id ? start.name : t.newCrumb,
    discardLead: draft.id ? t.discardLead(start.name) : t.discardLeadNew,
    change,
    ...saving,
    // Sin cambios o sin conexión no hay nada que guardar: el botón está apagado y Enter no hace nada.
    save: () => (dirty && users.online ? saving.save() : false),
    ...leaving,
    ...picker,
    back: () => navigate(listPath),
    // Duplicar con cambios pregunta antes, como cualquier salida: lo hace la guarda de la dirección.
    duplicate: () => navigate(newPath, { state: { duplicate: draft.id } }),
    remove: () => remove(users, draft),
  };
  useScreen('role', model, !leaving.asking && !picker.picking);
  useScreen('role-discard', model, leaving.asking);
  return model;
}

export type RoleScreenModel = ReturnType<typeof useRoleScreen>;
