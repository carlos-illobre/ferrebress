// «¿Descartar los cambios del rol?» (02 · R7.13, E64): al salir con algo sin guardar. «Seguir
// editando» es lo de siempre: el cursor arranca ahí y Esc lo toca.
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { rolesTexts as t } from '../texts.ts';

export function Discard({ go, stay }: { go: () => void; stay: () => void }) {
  return (
    <Dialog label={t.discardTitle} className="role-discard">
      <h2>{t.discardTitle}</h2>
      <p>{t.discardLead}</p>
      <div class="role-discard-foot">
        <Button
          look="red"
          icon="trash-2"
          doing={t.discard}
          onPress={() => {
            stay();
            go();
          }}
        >
          {t.discard}
        </Button>
        <Button look="dark" doing={t.keepEditing} onPress={stay} closes primary>
          {t.keepEditing}
        </Button>
      </div>
    </Dialog>
  );
}
