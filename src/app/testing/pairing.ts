// Lo que comparten las pruebas de la máquina de estados del vínculo: dos vínculos, uno visto desde
// cada lado, y una tabla de transiciones que se prueba fila por fila.
import type { PairingView } from '@ferrebress/shared/contracts/device-link';
import { expect, it } from 'vitest';
import {
  type Command,
  type PairingEvent,
  type PairingState,
  step,
} from '../modules/device-link/state.ts';

export const pairingView = (
  side: 'phone' | 'computer',
  extra: Partial<PairingView> = {},
): PairingView => ({
  id: 'v1',
  side,
  other: { label: 'otro' },
  since: 0,
  lastMirrored: 0,
  paused: false,
  ...extra,
});
export const pc = pairingView('computer');
export const phone = pairingView('phone');
const does = (commands: Command[]) => commands.map((c) => c.do);

// Nombre, de dónde, qué pasa, a qué estado y qué comandos, en orden.
export type Case = [string, PairingState, PairingEvent, PairingState['kind'], string[]];

export function itTransitions(cases: Case[]) {
  it.each(cases)('%s', (_name, from, event, kind, commands) => {
    const next = step(from, event);
    expect(next.state.kind).toBe(kind);
    expect(does(next.commands)).toEqual(commands);
    expect(next.ignored).toBeUndefined();
  });
}
