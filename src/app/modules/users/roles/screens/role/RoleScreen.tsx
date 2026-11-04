// La pantalla de un rol, nuevo o que existe (02 · R7.13; maqueta users-roles/final): el camino para
// volver, el título, los botones y, debajo, los tres pasos y la vista previa. Lo que se arma vive en
// el borrador de esta pantalla y se pierde al salir de ella. Nada se guarda hasta «Guardar rol», que
// guarda todo junto. Salir con cambios pregunta antes de descartarlos.

import type { RoleRow } from '@ferrebress/shared/contracts/roles';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { useEffect, useRef, useState } from 'preact/hooks';
import { isPhone } from '../../../../../platform/device/device.ts';
import { guardNavigation, navigate } from '../../../../../platform/router.ts';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { showToast } from '../../../../../ui/toast/Toast.tsx';
import { PhoneLight, PhoneLink, registerWork } from '../../../../frame/index.ts';
import { usersApi } from '../../../api.ts';
import { refusalText } from '../../../refusals.ts';
import { useUsersContext } from '../../../state.ts';
import { somethingFailed } from '../../../texts.ts';
import { type SaveOutcome, saveDraft } from '../../actions.ts';
import {
  type Draft,
  type DraftErrors,
  hasErrors,
  isDirty,
  reapply,
  validate,
} from '../../draft.ts';
import { rolesTexts as t } from '../../texts.ts';
import { Discard } from './Discard.tsx';
import { whatItGives } from './gives.ts';
import './RoleScreen.css';
import './RolePhone.css';
import './RoleSteps.css';
import './RolePermissions.css';
import './RolePreview.css';
import { activeHolders, ids, listPath } from '../../paths.ts';
import { Problems } from './Problems.tsx';
import { PhoneBar, RoleActions } from './RoleActions.tsx';
import { RoleHolders } from './RoleHolders.tsx';
import { RoleInfo } from './RoleInfo.tsx';
import { RolePermissions } from './RolePermissions.tsx';
import { RolePreview } from './RolePreview.tsx';

// Mientras hay cambios, salir por otro lado pregunta (E64); se saca al desmontar o al descartar.
function useLeaveGuard(dirty: boolean) {
  const [asking, setAsking] = useState<() => void>();
  useEffect(() => {
    if (!dirty) return undefined;
    return guardNavigation((go) => setAsking(() => go));
  }, [dirty]);
  return { asking, stopAsking: () => setAsking(undefined) };
}

// Guardar (R7.13): lo que ya se sabe se dice sin preguntar; después, un solo pedido. Si pide
// confirmar quién es, lo repite; si otro cambió el rol, vuelve a poner el borrador encima.
function useSave(draft: Draft, setDraft: (draft: Draft) => void) {
  const users = useUsersContext();
  const [errors, setErrors] = useState<DraftErrors>();
  const [notice, setNotice] = useState<string>();
  // La pantalla del rol se abre con las personas y los roles ya traídos (Roles.tsx).
  const people = users.people as PersonRow[];
  const context = () => ({
    roles: users.roleRows as RoleRow[],
    me: (people.find((one) => one.self) as PersonRow).id,
    roleIdsOf: Object.fromEntries(people.map((one) => [one.id, one.roleIds])),
  });
  const nameOf = (id: string) => (people.find((one) => one.id === id) as PersonRow).displayName;
  const changedOver = async () => {
    const [roles, people] = await Promise.all([usersApi.roles(), usersApi.people()]);
    const role = roles.ok && roles.data.roles.find((one) => one.id === draft.id);
    if (!role || !people.ok) return showToast(somethingFailed, 'triangle-alert');
    setDraft(reapply(draft, role, ids(activeHolders(people.data.people, role.id))));
    setNotice(t.changedOver);
    await users.reload();
  };
  const saved = async (id: string) => {
    await users.reload();
    showToast((draft.id ? t.saved : t.created)(draft.name.trim()), 'shield-check');
    navigate(listPath, { force: true, state: { arriving: id } });
  };
  // Lo que el servidor no guardó: confirmar y repetir, poner el borrador encima o decir qué y dónde.
  const notSaved = (outcome: Exclude<SaveOutcome, { ok: true }>, again: () => unknown) => {
    if (outcome.kind === 'confirm-first')
      return users.askToConfirm(again, whatItGives(draft, nameOf));
    if (outcome.kind === 'changed') return changedOver();
    if (outcome.kind === 'other') return showToast(refusalText(outcome.error), 'triangle-alert');
    return setErrors(outcome.errors);
  };
  const save = async (): Promise<unknown> => {
    const known = validate(draft, context());
    setNotice(undefined);
    if (hasErrors(known)) return setErrors(known);
    const outcome = await saveDraft(draft);
    return outcome.ok ? saved(outcome.id) : notSaved(outcome, save);
  };
  // Al corregir, lo marcado se vuelve a mirar, así se apaga.
  const recheck = (next: Draft) => errors && setErrors(validate(next, context()));
  return { errors, notice, save, recheck };
}

// Lo armado es trabajo a medio hacer (01 · E25, E26): si después de una sesión cerrada entra otra
// persona, se descarta, junto con la hoja de confirmar que hubiera abierta (revisión de seguridad,
// 46); y la versión nueva no se aplica sola encima (00 · R5.6).
function useHalfDone(dirty: boolean) {
  const users = useUsersContext();
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

export function RoleScreen({ start }: { start: Draft }) {
  const users = useUsersContext();
  const [draft, setDraftState] = useState(start);
  const dirty = isDirty(draft);
  const { asking, stopAsking } = useLeaveGuard(dirty);
  useHalfDone(dirty);
  const saving = useSave(draft, setDraftState);
  const change = (next: Draft) => {
    setDraftState(next);
    saving.recheck(next);
  };
  const title = draft.id ? start.name : t.newTitle;
  return (
    <section class="role-screen" aria-label={title}>
      <header class="role-head">
        <nav class="role-crumbs" aria-label={t.crumbs}>
          <button
            type="button"
            class="role-back"
            data-key="l"
            aria-label={t.backLabel}
            onClick={() => navigate(listPath)}
          >
            <Icon name="chevron-left" size="small" />
            {t.back}
          </button>
          <Icon name="chevron-right" size="small" />
          <span>{draft.id ? start.name : t.newCrumb}</span>
        </nav>
        <div class="title-row">
          <h2 class="role-title">{title}</h2>
          <PhoneLink />
        </div>
        <PhoneLight />
        <p class="role-lead">{t.lead}</p>
        <RoleActions draft={draft} dirty={dirty} save={saving.save} />
      </header>
      <PhoneBar draft={draft} dirty={dirty} save={saving.save} />
      <Problems
        errors={saving.errors}
        notice={saving.notice}
        people={users.people as PersonRow[]}
      />
      <div class="role-columns">
        <div class="role-steps">
          <RoleInfo draft={draft} change={change} errors={saving.errors} focus={!isPhone()} />
          <RolePermissions draft={draft} change={change} errors={saving.errors} />
          <RoleHolders draft={draft} change={change} errors={saving.errors} />
        </div>
        <RolePreview draft={draft} />
      </div>
      {asking && (
        <Discard
          go={asking}
          stay={stopAsking}
          lead={draft.id ? t.discardLead(start.name) : t.discardLeadNew}
        />
      )}
    </section>
  );
}
