// Las transiciones de quedarse (diseño de 03, § 8.3), con sus comandos.
import { describe } from 'vitest';
import { type Case, itTransitions, pc, phone } from '../../../testing/pairing.ts';

const cases: Case[] = [
  [
    'sin internet, por el servidor: a esperar que vuelva (E21)',
    { kind: 'relayed', pairing: pc, attempt: 'a' },
    { type: 'internetLost' },
    'offline',
    ['closeTransport', 'unsubscribe', 'detachMirror', 'retryInternet', 'strip'],
  ],
  [
    'volvió internet',
    { kind: 'offline', pairing: pc },
    { type: 'internetBack' },
    'waiting',
    ['subscribe', 'strip'],
  ],
  [
    'desconectar desde acá conserva el directo (E27)',
    { kind: 'direct', pairing: pc, attempt: 'a' },
    { type: 'pause', from: 'here' },
    'paused',
    ['post', 'send', 'detachMirror', 'strip'],
  ],
  [
    'desconectar sin directo suelta todo',
    { kind: 'waiting', pairing: pc },
    { type: 'pause', from: 'peer' },
    'paused',
    ['detachMirror', 'strip', 'closeTransport', 'unsubscribe'],
  ],
  [
    'reconectar con el directo conservado (E29)',
    { kind: 'paused', pairing: pc, kept: 'a' },
    { type: 'resume', from: 'here' },
    'direct',
    ['post', 'send', 'unsubscribe', 'attachMirror', 'confirm', 'snapshot', 'strip'],
  ],
  [
    'reconectar del otro con el directo conservado',
    { kind: 'paused', pairing: phone, kept: 'a' },
    { type: 'resume', from: 'peer' },
    'direct',
    ['unsubscribe', 'attachMirror', 'strip'],
  ],
  [
    'reconectar sin directo',
    { kind: 'paused', pairing: pc },
    { type: 'resume', from: 'peer' },
    'waiting',
    ['subscribe', 'strip'],
  ],
  [
    'probar el directo (E19)',
    { kind: 'relayed', pairing: pc, attempt: 'a' },
    { type: 'probe' },
    'relayed',
    ['send', 'probeDirect'],
  ],
  [
    'el celular también puede pedir probar',
    { kind: 'relayed', pairing: phone, attempt: 'a' },
    { type: 'probe' },
    'relayed',
    ['send'],
  ],
  [
    'la prueba salió',
    { kind: 'relayed', pairing: pc, attempt: 'a', probe: 'trying' },
    { type: 'probeResult', attempt: 'a', ok: true },
    'direct',
    ['closeTransport', 'unsubscribe', 'attachMirror', 'confirm', 'snapshot', 'strip'],
  ],
  [
    'la prueba no salió',
    { kind: 'relayed', pairing: pc, attempt: 'a', probe: 'trying' },
    { type: 'probeResult', attempt: 'a', ok: false },
    'relayed',
    ['report'],
  ],
  [
    'esta pestaña se ocultó con el directo: lo deja dormido',
    { kind: 'direct', pairing: phone, attempt: 'a' },
    { type: 'tabAway', why: 'hidden' },
    'away',
    ['bye', 'unsubscribe', 'detachMirror', 'closeTransport'],
  ],
  [
    'otra pestaña tomó el espejo',
    { kind: 'relayed', pairing: pc, attempt: 'a' },
    { type: 'tabAway', why: 'handover' },
    'away',
    ['bye', 'unsubscribe', 'detachMirror', 'closeTransport'],
  ],
  [
    'volvió la pestaña',
    { kind: 'away', pairing: pc },
    { type: 'tabBack' },
    'waiting',
    ['check', 'subscribe', 'strip'],
  ],
  [
    'volvió la pestaña con el directo dormido: saluda por él (E22)',
    { kind: 'away', pairing: phone, dormant: 'a' },
    { type: 'tabBack' },
    'waiting',
    ['send', 'strip'],
  ],
  [
    'el directo dormido se perdió: espera como siempre',
    { kind: 'waiting', pairing: phone, dormant: 'a' },
    { type: 'dormantLost' },
    'waiting',
    ['check', 'peek', 'strip'],
  ],
  [
    'el directo dormido se perdió con la pestaña oculta',
    { kind: 'away', pairing: phone, dormant: 'a' },
    { type: 'dormantLost' },
    'away',
    [],
  ],
];

describe('quedarse', () => itTransitions(cases));
