// Los botones del detalle (R4.2), según el estado: la acción principal, naranja y ancha, y las demás en
// una fila partida (Desconectar · Vincular · Desvincular). Cada uno con su tecla, con Alt.
import { Button } from '../../../../ui/button/Button.tsx';
import type { IconName } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import type { LinkView } from '../../view.ts';
import { detailTexts } from './texts.ts';

export type Act = 'probe' | 'pause' | 'resume' | 'pair' | 'unpair';
type Choice = {
  act: Act;
  label: string;
  icon: IconName;
  key: string;
  look: 'action' | 'row' | 'danger';
};

export function choicesOf(view: LinkView, phone: boolean): Choice[] {
  const t = detailTexts.actions;
  const pair: Choice = phone
    ? { act: 'pair', label: t.pairPhone, icon: 'scan-qr-code', key: 'v', look: 'row' }
    : { act: 'pair', label: t.pairComputer, icon: 'qr-code', key: 'v', look: 'row' };
  if (view.status === 'unpaired') return [{ ...pair, look: 'action' }];
  const choices: Choice[] = [];
  if (view.status === 'relayed')
    choices.push({ act: 'probe', label: t.probe, icon: 'zap', key: 'p', look: 'action' });
  if (view.status === 'paused')
    choices.push({ act: 'resume', label: t.resume, icon: 'plug-zap', key: 'r', look: 'action' });
  else choices.push({ act: 'pause', label: t.pause, icon: 'unplug', key: 'd', look: 'row' });
  choices.push(pair, { act: 'unpair', label: t.unpair, icon: 'unlink', key: 'x', look: 'danger' });
  return choices;
}

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
  return (
    <div class="link-actions">
      {main.map((choice) => (
        <Button
          key={choice.act}
          look="action"
          size="large"
          icon={choice.icon}
          shortcut={choice.key}
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
              shortcut={choice.key}
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
