// Qué se puede hacer desde el detalle del vínculo, según su estado (R4.2): la acción principal y las
// demás (Desconectar · Vincular · Desvincular), con su ícono y su texto.
import type { IconName } from '../../../platform/view/icon-name.ts';
import type { LinkView } from '../view.ts';
import { detailTexts } from './texts.ts';

export type Act = 'probe' | 'pause' | 'resume' | 'pair' | 'unpair';
export type Choice = {
  act: Act;
  label: string;
  icon: IconName;
  look: 'action' | 'row' | 'danger';
};

export function choicesOf(view: LinkView, phone: boolean): Choice[] {
  const t = detailTexts.actions;
  const pair: Choice = phone
    ? { act: 'pair', label: t.pairPhone, icon: 'scan-qr-code', look: 'row' }
    : { act: 'pair', label: t.pairComputer, icon: 'qr-code', look: 'row' };
  if (view.status === 'unpaired') return [{ ...pair, look: 'action' }];
  const choices: Choice[] = [];
  if (view.status === 'relayed')
    choices.push({ act: 'probe', label: t.probe, icon: 'zap', look: 'action' });
  if (view.status === 'paused')
    choices.push({ act: 'resume', label: t.resume, icon: 'plug-zap', look: 'action' });
  else choices.push({ act: 'pause', label: t.pause, icon: 'unplug', look: 'row' });
  choices.push(pair, { act: 'unpair', label: t.unpair, icon: 'unlink', look: 'danger' });
  return choices;
}
