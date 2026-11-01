// Los botones del rol (02 · R7.3, R7.13). En la computadora, arriba a la derecha: «Duplicar» y
// «Borrar el rol» en uno que existe, y «Guardar rol», apagado en gris hasta el primer cambio. Sin
// «Cancelar»: salir es descartar, y con cambios pregunta antes (pedido de Carlos). En el celular,
// «Guardar rol» va fijo abajo y «Duplicar» y «Borrar el rol»
// al final del rol, porque arriba no entran. El Administrador no muestra «Borrar el rol» (R7.4).

import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { navigate } from '../../../../../platform/router.ts';
import { Button } from '../../../../../ui/button/Button.tsx';
import { showToast } from '../../../../../ui/toast/Toast.tsx';
import { refusalText, useUsersContext } from '../../../state.ts';
import { removeRole } from '../../actions.ts';
import type { Draft } from '../../draft.ts';
import { listPath, newPath } from '../../paths.ts';
import { rolesTexts as t } from '../../texts.ts';

// Borrar: si alguien lo tiene, también dado de baja, lo dice sin preguntar al servidor (R7.3, E39).
function useRemove(draft: Draft) {
  const users = useUsersContext();
  return async () => {
    const id = draft.id as string;
    const holding = (users.people as PersonRow[]).filter((one) => one.roleIds.includes(id));
    const names = holding.map((one) =>
      one.active ? one.displayName : t.inactiveMark(one.displayName),
    );
    if (names.length > 0) return showToast(t.inUse(names), 'triangle-alert');
    const result = await removeRole({ id, version: draft.version });
    if (!result.ok) return showToast(refusalText(result.error), 'triangle-alert');
    await users.reload();
    showToast(t.removed(draft.original.name), 'trash-2');
    return navigate(listPath, { force: true });
  };
}

// Duplicar con cambios pregunta antes, como cualquier salida: lo hace la guarda de la dirección.
const duplicate = (draft: Draft) => () => navigate(newPath, { state: { duplicate: draft.id } });

function Existing({ draft, keys }: { draft: Draft; keys: boolean }) {
  const users = useUsersContext();
  const remove = useRemove(draft);
  if (!draft.id) return null;
  return (
    <>
      <Button
        icon="copy"
        {...(keys && { shortcut: 'u' })}
        doing={t.duplicate}
        onPress={duplicate(draft)}
        disabled={!users.online}
      >
        {t.duplicate}
      </Button>
      {!draft.system && (
        <Button
          look="danger"
          icon="trash-2"
          {...(keys && { shortcut: 'b' })}
          doing={t.remove}
          onPress={remove}
          disabled={!users.online}
        >
          {t.remove}
        </Button>
      )}
    </>
  );
}

type Props = { draft: Draft; dirty: boolean; save: () => unknown };

export function RoleActions({ draft, dirty, save }: Props) {
  const users = useUsersContext();
  return (
    <div class="role-actions desktop-only">
      {!users.online && <small class="role-offline">{t.offlineSave}</small>}
      <Existing draft={draft} keys />
      {draft.id && <span class="role-actions-gap" aria-hidden="true" />}
      <Button
        look="action"
        icon="save"
        shortcut="g"
        doing={t.save}
        onPress={save}
        disabled={!dirty || !users.online}
      >
        {draft.id ? t.save : t.create}
      </Button>
    </div>
  );
}

export function ExtraActions({ draft }: { draft: Draft }) {
  if (!draft.id) return null;
  return (
    <div class="role-extra phone-only">
      <Existing draft={draft} keys={false} />
    </div>
  );
}
