// Cómo se lee en Quién hizo qué el nombre de un dispositivo (capítulo 04, R9.5; E56).
import { describe, expect, it } from 'vitest';
import type { AuditView } from '../contracts/audit-log.ts';
import { entryOf, type Piece } from './index.ts';

const read = (pieces: Piece[]) =>
  pieces
    .map((piece) => ('text' in piece ? piece.text : 'thing' in piece ? piece.thing : ''))
    .join('');
const says = (
  before: unknown,
  after: unknown,
  targets = [{ kind: 'device', id: '', name: 'Chrome en Windows' }],
) => {
  const view: AuditView = {
    ...{ id: '2026:1', at: '2026-11-07T13:00:00.000Z', type: 'device.renamed', tone: 'plain' },
    actor: { kind: 'person', id: 'u-ana', name: 'Ana' },
    targets,
    changes: { name: { before, after } },
    data: {},
  };
  return read(entryOf('device.renamed').says(view));
};

describe('el nombre de un dispositivo en Quién hizo qué', () => {
  it('device-settings-E56: ponerlo, cambiarlo y sacarlo, con el anterior y el nuevo', () => {
    expect(entryOf('device.renamed').group).toBe('device-settings');
    expect(says(null, 'Compu del mostrador')).toBe(
      'Le puso nombre a este dispositivo: Compu del mostrador',
    );
    expect(says('Caja', 'Compu del mostrador')).toBe(
      'Le cambió el nombre: Caja → Compu del mostrador',
    );
    expect(says('Caja', null)).toBe('Le sacó el nombre a este dispositivo: Caja');
    // Sin el anterior (una fila rara), por cómo se llamaba el dispositivo; sin nada, vacío.
    expect(says(undefined, null)).toBe('Le sacó el nombre a este dispositivo: Chrome en Windows');
    expect(says(undefined, null, [])).toBe('Le sacó el nombre a este dispositivo: ');
  });
});
