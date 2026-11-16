// Los botones del rol (02 · R7.3, R7.13). En la computadora, arriba a la derecha: «Duplicar» y
// «Borrar el rol» en uno que existe, y «Guardar rol», apagado en gris hasta el primer cambio. Sin
// «Cancelar»: salir es descartar, y con cambios pregunta antes (pedido de Carlos). En el celular, la
// barra de arriba de PhoneBar. El Administrador no muestra «Borrar el rol» (R7.4).

import { type RoleScreenModel, rolesTexts as t } from '../../../../../modules/users/model.ts';
import { useShortcutHints } from '../../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../../ui/button/Button.tsx';

type Props = { role: RoleScreenModel };

function Existing({ role }: Props) {
  const keys = useShortcutHints('role');
  if (!role.draft.id) return null;
  return (
    <>
      <Button
        icon="copy"
        keyHint={keys.duplicate}
        doing={t.duplicate}
        onPress={role.duplicate}
        disabled={!role.online}
      >
        {t.duplicate}
      </Button>
      {!role.draft.system && (
        <Button
          look="danger"
          icon="trash-2"
          keyHint={keys.remove}
          doing={t.remove}
          onPress={role.remove}
          disabled={!role.online}
        >
          {t.remove}
        </Button>
      )}
    </>
  );
}

// «Guardar rol» («Crear el rol» en uno nuevo): apagado sin cambios o sin conexión.
// `short`: en el celular, «Guardar» o «Crear», para que entre junto a «Borrar» y «Duplicar».
// En la computadora, Enter en el nombre del rol lo toca (`enterDoes`, 00 · R2.6).
function SaveButton({
  role,
  keyHint,
  short,
}: Props & { keyHint?: string | undefined; short?: boolean }) {
  const { draft } = role;
  return (
    <Button
      look="action"
      icon="save"
      keyHint={keyHint}
      doing={t.save}
      onPress={role.save}
      disabled={!role.dirty || !role.online}
      enterDoes={!short}
    >
      {short ? (draft.id ? t.saveShort : t.createShort) : draft.id ? t.save : t.create}
    </Button>
  );
}

export function RoleActions({ role }: Props) {
  const keys = useShortcutHints('role');
  return (
    <div class="role-actions desktop-only">
      {!role.online && <small class="role-offline">{t.offlineSave}</small>}
      <Existing role={role} />
      {role.draft.id && <span class="role-actions-gap" aria-hidden="true" />}
      <SaveButton role={role} keyHint={keys.save} />
    </div>
  );
}

// En el celular, debajo del título, una fila como la del buscador y «Nuevo rol» de la lista (pedido
// de Carlos): «Borrar» y «Duplicar» a la izquierda y «Guardar» a la derecha, donde va
// «Nuevo rol», del mismo alto. Queda fija al bajar. El Administrador no muestra borrar (R7.4); un rol
// nuevo, ninguno de los dos. «‹ Roles» va arriba del título, como el camino de la computadora.
export function PhoneBar({ role }: Props) {
  const { draft } = role;
  return (
    <div class="role-phone-bar phone-only">
      {draft.id && !draft.system && (
        <Button
          look="danger"
          icon="trash-2"
          doing={t.remove}
          onPress={role.remove}
          disabled={!role.online}
        >
          {t.removeShort}
        </Button>
      )}
      {draft.id && (
        <Button icon="copy" doing={t.duplicate} onPress={role.duplicate} disabled={!role.online}>
          {t.duplicate}
        </Button>
      )}
      <SaveButton role={role} short />
    </div>
  );
}
