// Cómo se lee en Quién hizo qué un cambio de los ajustes para todos (capítulo 06, R2.5).
import { describe, expect, it } from 'vitest';
import type { AuditView } from '../contracts/audit-log.ts';
import { entryOf, type Piece } from './index.ts';

const read = (pieces: Piece[]) =>
  pieces
    .map((piece) => ('text' in piece ? piece.text : 'thing' in piece ? piece.thing : ''))
    .join('');
const says = (key: unknown, before: unknown, after: unknown, prices?: number) => {
  const view: AuditView = {
    ...{ id: '2026:1', at: '2026-11-07T13:00:00.000Z', type: 'settings.changed', tone: 'plain' },
    actor: { kind: 'person', id: 'u-ana', name: 'Ana' },
    targets: [],
    changes: { value: { before, after } },
    data: { key, ...(prices !== undefined && { prices }) },
  };
  return read(entryOf('settings.changed').says(view));
};

describe('un ajuste para todos en Quién hizo qué', () => {
  it('administration-E09: el ajuste con el valor anterior y el nuevo', () => {
    expect(entryOf('settings.changed').group).toBe('administration');
    expect(says('pairingDays', 30, 15)).toBe('Cambió los días del vínculo: 30 días → 15 días');
    expect(says('sessionIdle', 60, 30)).toBe(
      'Cambió el tiempo sin uso de la sesión: 60 min → 30 min',
    );
    expect(says('sessionMax', 8, 4)).toBe('Cambió el tope de la sesión: 8 h → 4 h');
    expect(says('offlineHours', 24, 8)).toBe(
      'Cambió las horas para entrar sin conexión: 24 h → 8 h',
    );
    expect(says('googleAttempts', 10, 3)).toBe(
      'Cambió los intentos con Google por minuto: 10 por minuto → 3 por minuto',
    );
    expect(says('passkeyAttempts', 20, 30)).toBe(
      'Cambió los intentos con la huella por minuto: 20 por minuto → 30 por minuto',
    );
    expect(says('failedAttempts', 20, 5)).toBe(
      'Cambió los intentos fallidos por hora: 20 por hora → 5 por hora',
    );
    expect(says('quickMargins', [300, 200, 100, 50, 25], [300, 200, 150, 50, 25])).toBe(
      'Cambió los márgenes rápidos: 300, 200, 100, 50, 25 % → 300, 200, 150, 50, 25 %',
    );
  });

  it('administration-E09: los ajustes de las listas', () => {
    expect(says('reviewPercent', 50, 30)).toBe(
      'Cambió cuánto cambia un costo para revisar: 50 % → 30 %',
    );
    expect(says('goneWarnPercent', 20, 10)).toBe('Cambió cuántas bajas avisan: 20 % → 10 %');
    expect(says('maxFileMb', 30, 50)).toBe('Cambió el tamaño máximo de una lista: 30 MB → 50 MB');
    expect(says('confirmRows', 200_000, 1_000_000)).toBe(
      'Cambió desde cuántas filas se avisa: 200.000 filas → 1.000.000 filas',
    );
    expect(says('filesMb', 100, 2000)).toBe(
      'Cambió cuánto ocupan los archivos de las listas: 100 MB → 2.000 MB',
    );
    expect(says('unappliedFileDays', 30, 7)).toBe(
      'Cambió los días de una lista que no se aplicó: 30 días → 7 días',
    );
  });

  it('administration-E19: el redondeo, con cuántos precios cambiaron', () => {
    expect(says('roundingStep', 1000, 500, 1650)).toBe(
      'Cambió el redondeo: $ 1.000 → $ 500 (cambiaron 1.650 precios)',
    );
    expect(says('roundingStep', 1000, 0, 0)).toBe('Cambió el redondeo: $ 1.000 → sin redondeo');
  });

  it('un valor que no es una lista o una clave que no existe se leen igual', () => {
    expect(says('quickMargins', null, [300, 200, 100, 50, 25])).toBe(
      'Cambió los márgenes rápidos: — → 300, 200, 100, 50, 25 %',
    );
    expect(says('__proto__', 1, 2)).toBe('Cambió un ajuste para todos');
  });
});

describe('una anomalía en Quién hizo qué', () => {
  const says = (type: string, data: Record<string, unknown>) =>
    read(
      entryOf(type).says({
        ...{ id: '2026:2', at: '2026-11-07T13:00:00.000Z', type, tone: 'plain' },
        ...{ actor: { kind: 'person', id: 'u-ana' }, targets: [], changes: {}, data },
      }),
    );

  it('administration-E48: marcarla revisada, con la nota', () => {
    expect(entryOf('anomalies.reviewed').group).toBe('administration');
    expect(says('anomalies.reviewed', { kind: 'price-list-unreadable', note: 'Visto' })).toBe(
      'Marcó revisada una lista que no se pudo leer: Visto',
    );
    expect(says('anomalies.reviewed', { kind: 'price-list-skipped-rows' })).toBe(
      'Marcó revisada las filas salteadas de una lista',
    );
  });

  it('administration-E49: volver a abrirla; un tipo que no conoce se lee igual', () => {
    expect(says('anomalies.reopened', { kind: 'price-list-unreadable' })).toBe(
      'Volvió a abrir una lista que no se pudo leer',
    );
    expect(says('anomalies.reopened', { kind: 'constructor' })).toBe('Volvió a abrir una anomalía');
  });
});

describe('un proveedor en Quién hizo qué', () => {
  const says = (type: string, data: Record<string, unknown> = {}) =>
    read(
      entryOf(type).says({
        ...{ id: '2026:3', at: '2026-11-07T13:00:00.000Z', type, tone: 'plain' },
        ...{ actor: { kind: 'person', id: 'u-ana' }, changes: {}, data },
        targets: [{ kind: 'supplier', id: 's1', name: 'Bulonera Centro' }],
      }),
    );

  it('price-lists-R9.1: el alta, un dato, cómo cobra, la baja y la reactivación', () => {
    expect(entryOf('suppliers.created').group).toBe('price-lists');
    expect(says('suppliers.created')).toBe('Dio de alta al proveedor Bulonera Centro');
    expect(says('suppliers.changed', { field: 'phone' })).toBe(
      'Cambió el teléfono de Bulonera Centro',
    );
    expect(says('suppliers.changed', { field: 'otro' })).toBe('Cambió un dato de Bulonera Centro');
    expect(says('suppliers.terms-changed', { costs: 2167 })).toBe(
      'Cambió cómo cobra Bulonera Centro (cambiaron 2.167 costos)',
    );
    expect(says('suppliers.terms-changed')).toBe('Cambió cómo cobra Bulonera Centro');
    expect(says('suppliers.deactivated', { costs: 30, discontinued: 12 })).toBe(
      'Dio de baja a Bulonera Centro (30 perdieron su costo, 12 quedaron dados de baja)',
    );
    expect(says('suppliers.reactivated')).toBe('Reactivó a Bulonera Centro');
  });
});

describe('una lista en Quién hizo qué', () => {
  const says = (type: string, data: Record<string, unknown> = {}, name?: string) =>
    read(
      entryOf(type).says({
        ...{ id: '2026:4', at: '2026-11-07T13:00:00.000Z', type, tone: 'plain' },
        ...{ actor: { kind: 'person', id: 'u-ana' }, changes: {}, data },
        targets: name ? [{ kind: 'list', id: 'l1', name }] : [],
      }),
    );

  it('price-lists-R9.1: subir, cancelar y descartar una lista', () => {
    expect(says('lists.uploaded', { scope: 'full' }, 'lista.xlsx')).toBe(
      'Subió la lista lista.xlsx',
    );
    expect(says('lists.uploaded', { scope: 'partial' }, 'cambios.xlsx')).toBe(
      'Subió la lista cambios.xlsx (solo cambios)',
    );
    expect(says('lists.discarded', { reason: 'cancelled' }, 'lista.xlsx')).toBe(
      'Canceló la lista lista.xlsx',
    );
    expect(says('lists.discarded', { reason: 'by-hand' })).toBe('Descartó la lista sin nombre');
    expect(says('lists.applied', { created: 4, changed: 1200, gone: 2 }, 'lista.xlsx')).toBe(
      'Aplicó la lista lista.xlsx de un proveedor: 4 nuevos, 1.200 costos, 2 bajas',
    );
    expect(says('lists.costs', {})).toBe('Cambió el costo de 0 productos con una lista');
  });
});

describe('los lectores y los archivos en Quién hizo qué', () => {
  const says = (type: string, data: Record<string, unknown> = {}) =>
    read(
      entryOf(type).says({
        ...{ id: '2026:5', at: '2026-11-07T13:00:00.000Z', type, tone: 'plain' },
        ...{ actor: { kind: 'person', id: 'u-ana' }, changes: {}, data },
        targets: [{ kind: 'supplier', id: 's1', name: 'Bulonera Centro' }],
      }),
    );

  it('price-lists-E50 y administration-E53', () => {
    expect(says('readers.deactivated', { origin: 'auto', supplier: 'Bulonera Centro' })).toBe(
      'Desactivó el lector automático de Bulonera Centro',
    );
    expect(says('readers.activated', { origin: 'otro' })).toBe('Activó un lector');
    expect(says('readers.assigned', { origin: 'programmer' })).toBe(
      'Asoció el lector de un programador a Bulonera Centro',
    );
    expect(says('files.deleted')).toBe('Borró el archivo de una lista');
    expect(says('files.restored')).toBe('Deshizo el borrado del archivo de una lista');
  });
});
