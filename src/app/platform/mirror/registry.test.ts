// El espejo (diseño de 03, § 5.2): gana el último que escribe, con el que manda en el empate; repetir
// o desordenar no cambia nada; la foto gana en los dos; lo que no tiene su forma, lo enorme y lo que
// el que sigue trae del servidor no entran; lo que llega antes que su pantalla espera.
import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod/mini';
import { createMirror, type Patch } from './registry.ts';

const text = z.string();

// Dos dispositivos conectados entre sí: la computadora manda.
function pair() {
  const computer = createMirror();
  const phone = createMirror();
  computer.attach({ leader: true, over: 'direct', send: (patches) => phone.receive(patches) });
  phone.attach({ leader: false, over: 'direct', send: (patches) => computer.receive(patches) });
  return { computer, phone };
}

describe('el espejo', () => {
  it('sin puerto es un valor común: cambia, avisa y se suelta', () => {
    const alone = createMirror();
    const value = alone.register('x.y.z', 'a', text);
    const seen: string[] = [];
    const stop = value.subscribe((v) => seen.push(v));
    value.set('b');
    stop();
    value.set('c');
    expect(seen).toEqual(['b']);
    expect(value.get()).toBe('c');
    value.release();
    expect(() => alone.register('x.y.z', 'a', text)).not.toThrow();
  });

  it('dos registros de la misma clave son un error de programación', () => {
    const one = createMirror();
    one.register('x.y.z', 'a', text);
    expect(() => one.register('x.y.z', 'a', text)).toThrow('ya está registrado');
  });

  it('un cambio en uno se ve en el otro, y gana el último que escribe', () => {
    const { computer, phone } = pair();
    const [onComputer, onPhone] = [
      computer.register('k', 'a', text),
      phone.register('k', 'a', text),
    ];
    onPhone.set('desde el celular');
    expect(onComputer.get()).toBe('desde el celular');
    onComputer.set('desde la compu');
    expect(onPhone.get()).toBe('desde la compu');
  });

  it('en el empate gana el que manda; repetir o desordenar no cambia el resultado', () => {
    const lone = createMirror();
    const value = lone.register('k', 'a', text);
    const fromFollower: Patch = { k: 'k', v: 'celular', c: 5, l: false };
    const fromLeader: Patch = { k: 'k', v: 'compu', c: 5, l: true };
    lone.receive([fromFollower, fromLeader, fromFollower]);
    expect(value.get()).toBe('compu');
    lone.receive([{ k: 'k', v: 'vieja', c: 3, l: true }]);
    expect(value.get()).toBe('compu');
  });

  it('lo que no tiene su forma, lo de más de 64 KB y lo del servidor que trae el que sigue no entran', () => {
    const onDiscard = vi.fn();
    const computer = createMirror({ onDiscard });
    const sent: Patch[][] = [];
    computer.attach({ leader: true, over: 'direct', send: (p) => sent.push(p) });
    const value = computer.register('k', 'a', text);
    computer.register('q:x.y.z', 'a', text);
    computer.receive([{ k: 'k', v: 7, c: 9, l: false } as unknown as Patch]);
    computer.receive([{ k: 'q:x.y.z', v: 'b', c: 9, l: false }]);
    value.set('x'.repeat(64 * 1024 + 1));
    expect(sent).toHaveLength(0);
    expect(onDiscard.mock.calls.map(([d]) => d.why)).toEqual([
      'schema',
      'from-follower',
      'too-large',
    ]);
  });

  it('lo que la pantalla elige sola no viaja', () => {
    const { computer, phone } = pair();
    const [onComputer, onPhone] = [
      computer.register('k', 'a', text),
      phone.register('k', 'a', text),
    ];
    onComputer.set('la primera persona', { auto: true });
    expect(onPhone.get()).toBe('a');
  });

  it('lo que llega antes que su pantalla espera, con su tope', () => {
    let now = 0;
    const onDiscard = vi.fn();
    const late = createMirror({ now: () => now, onDiscard });
    late.receive([{ k: 'temprano', v: 'b', c: 1, l: true }]);
    expect(late.register('temprano', 'a', text).get()).toBe('b');
    late.receive([{ k: 'vencido', v: 'b', c: 1, l: true }]);
    now += 11_000;
    expect(late.register('vencido', 'a', text).get()).toBe('a');
    for (let i = 0; i < 65; i++) late.receive([{ k: `k${i}`, v: 'b', c: 1, l: true }]);
    expect(onDiscard).toHaveBeenCalledWith({ key: 'k64', why: 'unknown' });
    late.receive([{ k: 'k0', v: 'c', c: 2, l: true }]);
    late.detach();
    expect(late.register('k0', 'a', text).get()).toBe('a');
  });

  it('la foto del que manda gana en los dos, y lo que no trae vuelve a su valor inicial', () => {
    const { computer, phone } = pair();
    const [onComputer, onPhone] = [
      computer.register('k', 'a', text),
      phone.register('k', 'a', text),
    ];
    const onlyPhone = phone.register('solo', 'inicial', text);
    phone.detach();
    onPhone.set('viejo del celular');
    onlyPhone.set('cambiado');
    onComputer.set('de la compu', { auto: true });
    computer.register('q:x.y.z', 'dato', text);
    const photo = computer.snapshot(phone.highestClock(), false);
    expect(photo.map((patch) => patch.k)).toEqual(['k']);
    phone.adopt(photo);
    expect(onPhone.get()).toBe('de la compu');
    expect(onlyPhone.get()).toBe('inicial');
    expect(computer.snapshot(0, true).map((patch) => patch.k)).toEqual(['k', 'q:x.y.z']);
    expect(computer.port()?.leader).toBe(true);
  });
});
