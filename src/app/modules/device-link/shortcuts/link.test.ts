// Los comandos de los atajos de lo que abre el indicador del vínculo, sobre un modelo de mentira.
import { describe, expect, it } from 'vitest';
import type { LinkDetail } from '../detail/useLinkDetail.ts';
import { shortcuts as code } from './code.ts';
import { shortcuts as detail } from './detail.ts';
import { shortcuts as unpair } from './unpair.ts';

function model(status: string, probe?: string, page = true) {
  const calls: string[] = [];
  const fake = {
    view: { status, probe, pairing: { side: 'computer' } },
    act: (act: string) => calls.push(act),
    close: () => calls.push('close'),
    code: page ? { back: () => calls.push('back') } : undefined,
    cancelUnpair: () => calls.push('cancel'),
    unpair: () => calls.push('unpair!'),
  } as unknown as LinkDetail;
  return { fake, calls };
}
const run = (screen: typeof detail, name: string, fake: LinkDetail) =>
  (screen.commands[name] as (m: LinkDetail) => unknown)(fake);

describe('los atajos del vínculo', () => {
  it('el detalle hace solo lo que muestra ahora', () => {
    const relayed = model('relayed');
    for (const name of ['probe', 'pause', 'resume', 'pair', 'unpair', 'close'])
      run(detail, name, relayed.fake);
    expect(relayed.calls).toEqual(['probe', 'pause', 'pair', 'unpair', 'close']);
    expect(run(detail, 'probe', model('relayed', 'trying').fake)).toBe(false);
  });

  it('el código vuelve al detalle, y la confirmación cancela o desvincula', () => {
    const { fake, calls } = model('unpaired');
    run(code, 'back', fake);
    run(unpair, 'cancel', fake);
    run(unpair, 'unpair', fake);
    expect(calls).toEqual(['back', 'cancel', 'unpair!']);
    expect(run(code, 'back', model('unpaired', undefined, false).fake)).toBeUndefined();
  });
});
