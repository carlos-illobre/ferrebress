// Los botones del rol (02 · R7.3, R7.13). En la computadora, arriba a la derecha: «Duplicar» y
// «Borrar el rol» en uno que existe, y «Guardar rol», apagado en gris hasta el primer cambio. Sin
// «Cancelar»: salir es descartar, y con cambios pregunta antes (pedido de Carlos). En el celular, la
// barra de arriba de PhoneBar. El Administrador no muestra «Borrar el rol» (R7.4).
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { navigate } from '../../../../../platform/router.ts';
import { Button } from '../../../../../ui/button/Button.tsx';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
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

function Existing({ draft }: { draft: Draft }) {
  const users = useUsersContext();
  const remove = useRemove(draft);
  if (!draft.id) return null;
  return (
    <>
      <Button
        icon="copy"
        shortcut="u"
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
          shortcut="b"
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

// «Guardar rol» («Crear el rol» en uno nuevo): apagado sin cambios o sin conexión.
function SaveButton({ draft, dirty, save, shortcut }: Props & { shortcut?: string }) {
  const users = useUsersContext();
  return (
    <Button
      look="action"
      icon="save"
      {...(shortcut && { shortcut })}
      doing={t.save}
      onPress={save}
      disabled={!dirty || !users.online}
    >
      {draft.id ? t.save : t.create}
    </Button>
  );
}

export function RoleActions({ draft, dirty, save }: Props) {
  const users = useUsersContext();
  return (
    <div class="role-actions desktop-only">
      {!users.online && <small class="role-offline">{t.offlineSave}</small>}
      <Existing draft={draft} />
      {draft.id && <span class="role-actions-gap" aria-hidden="true" />}
      <SaveButton draft={draft} dirty={dirty} save={save} shortcut="g" />
    </div>
  );
}

// En el celular, debajo del título, una fila como la del buscador y «Nuevo rol» de la lista (pedido
// de Carlos): borrar y duplicar con el ícono solo a la izquierda y «Guardar» a la derecha, donde va
// «Nuevo rol», del mismo alto. Queda fija al bajar. El Administrador no muestra borrar (R7.4); un rol
// nuevo, ninguno de los dos. «‹ Roles» va arriba del título, como el camino de la computadora.
export function PhoneBar({ draft, dirty, save }: Props) {
  const users = useUsersContext();
  const remove = useRemove(draft);
  return (
    <div class="role-phone-bar phone-only">
      {draft.id && !draft.system && (
        <button
          type="button"
          class="role-icon-button danger"
          aria-label={t.remove}
          title={t.remove}
          onClick={remove}
          disabled={!users.online}
        >
          <Icon name="trash-2" />
        </button>
      )}
      {draft.id && (
        <button
          type="button"
          class="role-icon-button"
          aria-label={t.duplicate}
          title={t.duplicate}
          onClick={duplicate(draft)}
          disabled={!users.online}
        >
          <Icon name="copy" />
        </button>
      )}
      <SaveButton draft={draft} dirty={dirty} save={save} />
    </div>
  );
}
