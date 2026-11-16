// «¿Descartar los cambios del rol?» (02 · R7.13, E64): al salir con algo sin guardar. «Seguir
// editando» es lo de siempre: el cursor arranca ahí y Esc lo toca.

import { type RoleScreenModel, rolesTexts as t } from '../../../../../modules/users/model.ts';
import { useShortcutHints } from '../../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../../ui/dialog/Dialog.tsx';

export function Discard({ role }: { role: RoleScreenModel }) {
  const keys = useShortcutHints('role-discard');
  return (
    <Dialog label={t.discardTitle} className="role-discard">
      <h2>{t.discardTitle}</h2>
      <p>{role.discardLead}</p>
      <div class="role-discard-foot">
        <Button doing={t.keepEditing} onPress={role.stay} closes primary>
          {t.keepEditing}
        </Button>
        <Button
          look="red"
          icon="trash-2"
          keyHint={keys.discard}
          doing={t.discard}
          onPress={role.leave}
        >
          {t.discard}
        </Button>
      </div>
    </Dialog>
  );
}
