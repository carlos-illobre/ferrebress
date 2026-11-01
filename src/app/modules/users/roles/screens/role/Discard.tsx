// «¿Descartar los cambios del rol?» (02 · R7.13, E64): al salir con algo sin guardar. «Seguir
// editando» es lo de siempre: el cursor arranca ahí y Esc lo toca.
import { Button } from '../../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../../ui/dialog/Dialog.tsx';
import { rolesTexts as t } from '../../texts.ts';

// `lead`: qué se pierde, con el nombre del rol (o que el nuevo todavía no se creó).
export function Discard({ go, stay, lead }: { go: () => void; stay: () => void; lead: string }) {
  return (
    <Dialog label={t.discardTitle} className="role-discard">
      <h2>{t.discardTitle}</h2>
      <p>{lead}</p>
      <div class="role-discard-foot">
        <Button
          look="red"
          icon="trash-2"
          shortcut="t"
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
