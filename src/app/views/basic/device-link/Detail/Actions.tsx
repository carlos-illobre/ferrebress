// Los botones del detalle (R4.2), según el estado: la acción principal, naranja y ancha, y las demás en
// una fila partida (Desconectar · Vincular · Desvincular). Cada uno con su tecla, con Alt.

import type { LinkView } from '../../../../modules/device-link/model.ts';
import { type Act, choicesOf, detailTexts } from '../../../../modules/device-link/model.ts';
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../../../ui/button/Button.tsx';
import { Say } from '../../../../ui/say/Say.tsx';

export type { Act };

export function Actions({
  view,
  phone,
  onAct,
}: {
  view: LinkView;
  phone: boolean;
  onAct: (act: Act) => unknown;
}) {
  const choices = choicesOf(view, phone);
  const main = choices.filter((choice) => choice.look === 'action');
  const rows = choices.filter((choice) => choice.look !== 'action');
  const trying = view.probe === 'trying';
  const keys = useShortcutHints('link-detail');
  return (
    <div class="link-actions">
      {main.map((choice) => (
        <Button
          key={choice.act}
          look="action"
          size="large"
          icon={choice.icon}
          keyHint={keys[choice.act]}
          doing={choice.label}
          disabled={choice.act === 'probe' && trying}
          onPress={() => onAct(choice.act)}
        >
          {choice.act === 'probe' && trying ? (
            <Say words={detailTexts.actions.probing} />
          ) : (
            choice.label
          )}
        </Button>
      ))}
      {rows.length > 0 && (
        <div class="link-action-rows">
          {rows.map((choice) => (
            <Button
              key={choice.act}
              look={choice.look === 'danger' ? 'danger' : 'plain'}
              icon={choice.icon}
              keyHint={keys[choice.act]}
              doing={choice.label}
              onPress={() => onAct(choice.act)}
            >
              {choice.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
