// Cómo se leen en Quién hizo qué las acciones del vínculo (capítulo 03, R8; E41).
import { describe, expect, it } from 'vitest';
import type { AuditView } from '../contracts/audit-log.ts';
import { entryOf, type Piece, typesOf } from './index.ts';

const devices = [
  { kind: 'phone', id: 'p', name: 'Chrome en Android' },
  { kind: 'computer', id: 'c', name: 'Chrome en Windows' },
];
const view = (type: string, data: Record<string, unknown>, targets = devices): AuditView => ({
  id: '2026:1',
  at: '2026-11-04T13:00:00.000Z',
  type,
  tone: 'plain',
  actor: { kind: 'person', id: 'u-ana', name: 'Ana' },
  targets,
  changes: {},
  data,
});
const read = (pieces: Piece[]) =>
  pieces
    .map((piece) => ('text' in piece ? piece.text : 'thing' in piece ? piece.thing : ''))
    .join('');
const says = (type: string, data: Record<string, unknown> = {}, targets = devices) =>
  read(entryOf(type).says(view(type, data, targets)));

describe('el vínculo en Quién hizo qué', () => {
  it('vincular, con el botón o al entrar con el celular', () => {
    expect(says('device-link.paired', { how: 'button' })).toBe(
      'Vinculó Chrome en Android con Chrome en Windows',
    );
    expect(says('device-link.paired', { how: 'sign-in' })).toBe(
      'Vinculó Chrome en Android con Chrome en Windows, al entrar con el celular',
    );
    expect(says('device-link.paired', {}, [])).toBe('Vinculó un celular con una computadora');
  });

  it('reemplazar, desvincular desde cada lado y cada motivo de fin', () => {
    expect(says('device-link.replaced')).toBe(
      'Terminó el vínculo de Chrome en Android con Chrome en Windows al vincular otro',
    );
    expect(says('device-link.unpaired', { from: 'phone' })).toContain(', desde el celular');
    expect(says('device-link.unpaired', { from: 'computer' })).toContain(', desde la computadora');
    expect(says('device-link.ended', { reason: 'expired' })).toContain(': venció por no usarse');
    expect(says('device-link.ended', { reason: 'otro' })).toContain(': terminó');
  });

  it('los rechazos van con los rechazos, en rojo', () => {
    expect(says('device-link.rejected', { reason: 'other-account' })).toBe(
      'Leyó el código de vincular de otra cuenta',
    );
    expect(says('device-link.rejected', { reason: 'nuevo' })).toBe('Intentó vincular sin poder');
    expect(entryOf('device-link.rejected').group).toBe('refused');
    expect(typesOf('device-link').sort()).toEqual([
      'device-link.ended',
      'device-link.paired',
      'device-link.replaced',
      'device-link.unpaired',
    ]);
  });
});
