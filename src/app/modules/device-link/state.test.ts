// La máquina de estados del vínculo (diseño de 03, § 8): un evento de otro intento, o que no
// corresponde al estado, no cambia nada; las transiciones, en machine/*.test.ts.
import { describe, expect, it } from 'vitest';
import { pc, phone } from '../../testing/pairing.ts';
import { type PairingEvent, type PairingState, step } from './state.ts';

describe('la máquina de estados del vínculo', () => {
  const ignored: [string, PairingState, PairingEvent][] = [
    [
      'sin vincular y el servidor dice que no',
      { kind: 'unpaired' },
      { type: 'serverSaid', pairing: null },
    ],
    ['dormido y sale', { kind: 'asleep' }, { type: 'sessionLost', samePerson: true }],
    [
      'llegó el otro sin estar esperando',
      { kind: 'direct', pairing: pc, attempt: 'a' },
      { type: 'peerPresent', attempt: 'b' },
    ],
    [
      'volvió por un directo que no es el dormido',
      { kind: 'waiting', pairing: pc, dormant: 'a' },
      { type: 'peerBack', attempt: 'b' },
    ],
    [
      'un directUp de otro intento',
      { kind: 'meeting', pairing: pc, attempt: 'a' },
      { type: 'directUp', attempt: 'b' },
    ],
    [
      'relayUp no cambia nada',
      { kind: 'relayed', pairing: pc, attempt: 'a' },
      { type: 'relayUp', attempt: 'a' },
    ],
    [
      'el otro se fue sin estar conectados',
      { kind: 'paused', pairing: pc },
      { type: 'peerGone', why: 'lost' },
    ],
    ['sin vínculo no hay internet que perder', { kind: 'unpaired' }, { type: 'internetLost' }],
    [
      'volvió internet sin estar sin internet',
      { kind: 'waiting', pairing: pc },
      { type: 'internetBack' },
    ],
    [
      'el directo sigue sin internet (E20)',
      { kind: 'direct', pairing: pc, attempt: 'a' },
      { type: 'internetLost' },
    ],
    ['ya en pausa', { kind: 'paused', pairing: pc }, { type: 'pause', from: 'here' }],
    [
      'reconectar sin estar en pausa',
      { kind: 'waiting', pairing: pc },
      { type: 'resume', from: 'here' },
    ],
    [
      'probar sin estar por el servidor',
      { kind: 'direct', pairing: pc, attempt: 'a' },
      { type: 'probe' },
    ],
    [
      'ya probando',
      { kind: 'relayed', pairing: pc, attempt: 'a', probe: 'trying' },
      { type: 'probe' },
    ],
    [
      'un resultado sin estar probando',
      { kind: 'relayed', pairing: pc, attempt: 'a' },
      { type: 'probeResult', attempt: 'a', ok: true },
    ],
    ['oculta sin vínculo', { kind: 'unpaired' }, { type: 'tabAway', why: 'hidden' }],
    ['ya oculta', { kind: 'away', pairing: pc }, { type: 'tabAway', why: 'hidden' }],
    ['vuelve sin estar oculta', { kind: 'waiting', pairing: pc }, { type: 'tabBack' }],
    ['sin directo dormido que perder', { kind: 'waiting', pairing: pc }, { type: 'dormantLost' }],
  ];

  it.each(ignored)('no cambia nada: %s', (_name, from, event) => {
    const next = step(from, event);
    expect(next).toEqual({ state: from, commands: [], ignored: true });
  });

  it('oculta con el directo, lo conserva dormido para saludar al volver', () => {
    const next = step(
      { kind: 'direct', pairing: phone, attempt: 'a' },
      { type: 'tabAway', why: 'hidden' },
    );
    expect(next.state).toEqual({ kind: 'away', pairing: phone, dormant: 'a' });
  });

  it('otra versión deja la marca en el estado', () => {
    const next = step(
      { kind: 'direct', pairing: pc, attempt: 'a' },
      { type: 'peerGone', why: 'version' },
    );
    expect(next.state).toEqual({ kind: 'waiting', pairing: pc, why: 'version' });
  });

  it('un evento desconocido es un error de programación', () => {
    expect(() => step({ kind: 'unpaired' }, { type: 'nada' } as never)).toThrow(
      'Evento sin manejar',
    );
  });
});
