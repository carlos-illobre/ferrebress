// La confirmación del vínculo (diseño de 03, § 7): retiene lo que sale y entra hasta tener una de
// menos de 4 minutos (o hasta que cambie algo del vínculo), la pide una sola vez, tira lo retenido si el otro ya no está, sigue sin internet
// con la última buena y no mezcla conexiones.
import type { CheckResponse } from '@ferrebress/shared/contracts/device-link';
import { describe, expect, it, vi } from 'vitest';
import type { ApiResult } from '../../platform/server/api.ts';
import { createConfirm, eventOfVerdict, verdictOf } from './confirm.ts';
import { deviceLinkSettings } from './settings.ts';

const pairing = {
  id: 'v',
  side: 'computer' as const,
  other: { label: 'x' },
  since: 0,
  lastMirrored: 0,
  expiresAt: 30 * 86_400_000,
  lastsDays: 30,
  paused: false,
};
const ok: ApiResult<CheckResponse> = { ok: true, data: { pairing, peer: 'ok' } };
const gone: ApiResult<CheckResponse> = { ok: true, data: { pairing, peer: 'gone' } };
const none: ApiResult<CheckResponse> = { ok: true, data: {} };
const offline: ApiResult<CheckResponse> = { ok: false, error: 'offline' };

function setup(answers: ApiResult<CheckResponse>[]) {
  let now = 0;
  const pending: ((value: ApiResult<CheckResponse>) => void)[] = [];
  const check = vi.fn(() => new Promise<ApiResult<CheckResponse>>((r) => pending.push(r)));
  const onVerdict = vi.fn();
  const confirm = createConfirm({ check, now: () => now, onVerdict });
  const answer = async () => {
    pending.shift()?.(answers.shift() as ApiResult<CheckResponse>);
    await new Promise((settled) => setTimeout(settled, 0));
  };
  return { confirm, check, onVerdict, answer, pass: (ms: number) => (now += ms) };
}

describe('la confirmación del vínculo', () => {
  it('sin huella (por el servidor) no retiene nada', () => {
    const { confirm, check } = setup([]);
    const run = vi.fn();
    confirm.gate(run);
    expect(run).toHaveBeenCalled();
    expect(check).not.toHaveBeenCalled();
  });

  it('retiene en orden hasta confirmar una sola vez, y después pasa directo hasta los 4 minutos', async () => {
    const { confirm, check, answer, pass } = setup([ok, ok]);
    confirm.begin('fp');
    const order: number[] = [];
    confirm.gate(() => order.push(1));
    confirm.gate(() => order.push(2));
    expect(order).toEqual([]);
    await answer();
    expect(order).toEqual([1, 2]);
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith('fp');
    confirm.gate(() => order.push(3));
    expect(order).toEqual([1, 2, 3]);
    pass(deviceLinkSettings.confirm.maxAgeMs);
    confirm.gate(() => order.push(4));
    expect(order).toEqual([1, 2, 3]);
    await answer();
    expect(order).toEqual([1, 2, 3, 4]);
  });

  it('cuando cambia algo del vínculo, la última no vale: lo próximo espera una nueva', async () => {
    const { confirm, check, answer } = setup([ok, none]);
    confirm.begin('fp');
    const sent = vi.fn();
    confirm.gate(sent);
    await answer();
    expect(sent).toHaveBeenCalledTimes(1);
    confirm.stale();
    confirm.gate(sent);
    expect(sent).toHaveBeenCalledTimes(1);
    await answer();
    expect(check).toHaveBeenCalledTimes(2);
    expect(sent).toHaveBeenCalledTimes(1);
  });

  it('con el otro fuera de regla, o sin vínculo, tira lo retenido y avisa', async () => {
    const { confirm, onVerdict, answer } = setup([gone, none]);
    confirm.begin('fp');
    const run = vi.fn();
    confirm.gate(run);
    await answer();
    expect(onVerdict).toHaveBeenLastCalledWith('gone', pairing);
    confirm.gate(run);
    await answer();
    expect(onVerdict).toHaveBeenLastCalledWith('none', undefined);
    expect(run).not.toHaveBeenCalled();
  });

  it('sin internet sigue con la última buena de esta conexión, y sin ninguna no deja pasar', async () => {
    const { confirm, answer, pass } = setup([offline, ok, offline]);
    confirm.begin('fp');
    const run = vi.fn();
    confirm.gate(run);
    await answer();
    expect(run).not.toHaveBeenCalled();
    expect(await Promise.all([confirm.ensure(1000), answer()]).then(([v]) => v)).toBe(true);
    pass(deviceLinkSettings.confirm.maxAgeMs);
    confirm.gate(run);
    await answer();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('R3.4: sin internet, la última buena vale hasta 30 minutos; después deja de espejar', async () => {
    const { confirm, onVerdict, answer, pass } = setup([ok, offline, offline]);
    confirm.begin('fp');
    const run = vi.fn();
    confirm.gate(run);
    await answer();
    pass(deviceLinkSettings.confirm.offlineMs - 1);
    confirm.gate(run);
    await answer();
    expect(run).toHaveBeenCalledTimes(2);
    expect(onVerdict).not.toHaveBeenCalled();
    pass(1);
    confirm.gate(run);
    await answer();
    expect(run).toHaveBeenCalledTimes(2);
    expect(onVerdict).toHaveBeenCalledWith('stale', undefined);
  });

  it('lo que contesta una confirmación de la conexión anterior no toca la nueva', async () => {
    const { confirm, check, answer } = setup([ok, ok]);
    confirm.begin('vieja');
    const old = vi.fn();
    confirm.gate(old);
    confirm.begin('nueva');
    const fresh = vi.fn();
    confirm.gate(fresh);
    await answer();
    expect(old).not.toHaveBeenCalled();
    expect(fresh).not.toHaveBeenCalled();
    await answer();
    expect(fresh).toHaveBeenCalled();
    expect(check).toHaveBeenLastCalledWith('nueva');
    confirm.end();
    expect(await confirm.ensure(1)).toBe(false);
  });

  it('dos que piden a la vez esperan la misma; un error del servidor no corta: no se pudo confirmar', async () => {
    const check = vi.fn(async () => ({ ok: false, error: 'too-many-attempts' }) as never);
    const onVerdict = vi.fn();
    const confirm = createConfirm({ check, onVerdict });
    confirm.begin('fp');
    expect(await Promise.all([confirm.ensure(1), confirm.ensure(1)])).toEqual([false, false]);
    expect(check).toHaveBeenCalledTimes(1);
    expect(onVerdict).not.toHaveBeenCalled();
    check.mockResolvedValueOnce(ok as never);
    expect(await confirm.ensure(1000)).toBe(true);
    expect(await confirm.ensure(1000)).toBe(true);
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('cada veredicto malo es un evento de la máquina', () => {
    expect(eventOfVerdict('none', undefined)).toEqual({ type: 'serverSaid', pairing: null });
    expect(eventOfVerdict('none', pairing)).toEqual({ type: 'serverSaid', pairing });
    expect(eventOfVerdict('gone', pairing)).toEqual({ type: 'peerGone', why: 'signed-out' });
    expect(eventOfVerdict('stale', undefined)).toEqual({ type: 'peerGone', why: 'lost' });
  });

  it('cada respuesta tiene su veredicto', () => {
    expect(verdictOf({ ok: false, error: 'too-many-attempts' } as never)).toBe('offline');
    expect(verdictOf({ ok: true, data: { pairing, peer: 'gone' } })).toBe('gone');
    expect(verdictOf(offline)).toBe('offline');
  });
});
