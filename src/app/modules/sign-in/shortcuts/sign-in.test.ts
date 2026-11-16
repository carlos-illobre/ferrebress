// Los comandos de los atajos de la entrada, sobre un modelo de mentira.
import { describe, expect, it } from 'vitest';
import type { EntranceModel } from '../entrance.ts';
import { shortcuts } from './sign-in.ts';

function model({ phone = false, online = true, phase = 'failed' } = {}) {
  const calls: string[] = [];
  const fake = {
    phone,
    state: { online },
    google: { phase, again: () => calls.push('again') },
    openManual: () => calls.push('manual'),
  } as unknown as EntranceModel;
  return { fake, calls };
}
const run = (name: string, fake: EntranceModel) =>
  (shortcuts.commands[name] as (m: EntranceModel) => unknown)(fake);

describe('los atajos de la entrada', () => {
  it('el manual y reintentar Google', () => {
    const { fake, calls } = model();
    run('manual', fake);
    run('retryGoogle', fake);
    expect(calls).toEqual(['manual', 'again']);
  });

  it('sin el manual en el celular ni sin conexión, y sin reintentar si Google cargó', () => {
    expect(run('manual', model({ phone: true }).fake)).toBe(false);
    expect(run('manual', model({ online: false }).fake)).toBe(false);
    expect(run('retryGoogle', model({ phase: 'ready' }).fake)).toBe(false);
  });
});
