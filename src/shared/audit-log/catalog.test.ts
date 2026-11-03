import { describe, expect, it } from 'vitest';
import type { AuditView } from '../contracts/audit-log.ts';
import { catalog, entryOf, isGroup, type Piece, shownData, toneOf, typesOf } from './index.ts';
import { difference, listOf } from './kinds.ts';

const lucia = { kind: 'person', id: 'u-lucia', name: 'Lucía' };
const view = (type: string, more: Partial<AuditView> = {}): AuditView => ({
  id: '2026:1',
  at: '2026-11-04T13:00:00.000Z',
  type,
  tone: 'plain',
  actor: { kind: 'person', id: 'u-marcos', name: 'Marcos' },
  targets: [lucia],
  changes: {},
  data: {},
  ...more,
});
// El texto, como se leería: las personas y las cosas por su nombre.
const read = (pieces: Piece[]) =>
  pieces
    .map((piece) =>
      'text' in piece ? piece.text : 'thing' in piece ? piece.thing : piece.person.name,
    )
    .join('');
const says = (type: string, more: Partial<AuditView> = {}) =>
  read(entryOf(type).says(view(type, more)));

describe('el catálogo de Quién hizo qué', () => {
  it('audit-log-E35b: cada tipo tiene su ícono, que no se repite', () => {
    const icons = Object.values(catalog).map((entry) => entry.icon);
    expect(new Set(icons).size).toBe(icons.length);
    expect(icons).not.toContain(entryOf('nada').icon);
  });

  it('los grupos y sus tipos; un tipo que no conoce va en «Otros»', () => {
    expect(isGroup('roles')).toBe(true);
    expect(isGroup('ventas')).toBe(false);
    expect(typesOf('roles').sort()).toEqual([
      'role.changed',
      'role.created',
      'role.deleted',
      'role.permissions-added',
      'user.roles-changed',
    ]);
    expect(entryOf('venta.cobrada')).toMatchObject({ group: 'other', name: 'Otra acción' });
    expect(says('venta.cobrada')).toBe('Hizo una acción que esta versión no conoce');
  });

  it('audit-log-E21: el color, fijo o según lo que hizo', () => {
    const actor = { kind: 'person', userId: 'u-marcos' };
    expect(toneOf('user.deleted', { actor })).toBe('red');
    expect(toneOf('sign-in.rejected', { actor })).toBe('amber');
    expect(toneOf('sign-out', { actor })).toBe('plain');
    const roles = (before: string[], after: string[]) => ({
      actor,
      changes: { roles: { before, after } },
    });
    expect(toneOf('user.roles-changed', roles(['Cajero', 'Encargado'], ['Encargado']))).toBe('red');
    expect(toneOf('user.roles-changed', roles(['Cajero'], ['Cajero', 'Encargado']))).toBe('plain');
    expect(toneOf('role.changed', { actor })).toBe('plain');
    const other = { actor, targets: [{ kind: 'person', id: 'u-lucia' }] };
    const own = { actor, targets: [{ kind: 'person', id: 'u-marcos' }] };
    expect(toneOf('session.closed', other)).toBe('red');
    expect(toneOf('sessions.closed-all', own)).toBe('plain');
  });

  it('solo salen los datos que el tipo muestra', () => {
    expect(
      shownData('sign-in.rejected', { method: 'google', reason: 'unknown', subject: 'g-123' }),
    ).toEqual({ method: 'google', reason: 'unknown' });
    expect(shownData('sign-out')).toEqual({});
  });

  it('el texto de Entrar', () => {
    expect(says('sign-in.succeeded', { data: { method: 'google' } })).toBe('Entró con Google');
    expect(says('sign-in.succeeded', { data: { method: 'qr' } })).toBe(
      'Entró con el código, desde el celular',
    );
    expect(says('sign-in.succeeded')).toBe('Entró');
    expect(says('sign-out')).toBe('Salió');
    expect(says('sign-out', { data: { pending: true } })).toBe('Salió sin conexión');
    expect(says('session.ended')).toBe('Se le venció la sesión a Lucía');
    expect(says('session.ended', { targets: [] })).toBe('Se le venció la sesión a alguien');
    expect(says('passkey.linked')).toBe('Vinculó la huella de su celular');
    expect(says('code.read')).toBe('Leyó el código de una computadora');
    expect(says('code.approved')).toBe('Dejó entrar a una computadora con su celular');
    expect(says('code.cancelled')).toBe('Canceló la entrada de una computadora');
    expect(says('session.closed')).toBe('Cerró una sesión de Lucía');
    expect(says('sessions.closed-all')).toBe('Cerró todas las sesiones de Lucía');
    expect(says('passkey.removed')).toBe('Le quitó un celular con huella a Lucía');
    expect(says('phone.cut')).toBe('Cortó un celular perdido de Lucía');
    expect(says('sign-in.rejected', { data: { reason: 'unknown' } })).toBe(
      'Intentó entrar con un correo no autorizado',
    );
    expect(says('sign-in.rejected', { data: { reason: 'otra' } })).toBe('Intentó entrar y no pudo');
    expect(says('passkey.rejected')).toBe('No pudo vincular la huella');
    expect(says('code.rejected')).toBe('Usó el código de una computadora desde otra red');
    expect(says('session.confirm-rejected')).toBe('No pudo confirmar quién era');
  });

  it('el texto de Usuarios', () => {
    expect(says('user.authorized', { data: { roles: ['Vendedor', 'Cajero'] } })).toBe(
      'Autorizó a Lucía con Vendedor y Cajero',
    );
    expect(says('user.authorized')).toBe('Autorizó a Lucía');
    expect(says('user.renamed')).toBe('Le cambió el nombre a Lucía');
    expect(says('user.email-changed')).toBe('Le cambió el correo a Lucía');
    expect(says('user.activated')).toBe('Dio de alta a Lucía');
    expect(says('user.deactivated')).toBe('Dio de baja a Lucía');
    expect(says('user.deleted')).toBe('Borró a Lucía');
    expect(says('users.rejected', { data: { reason: 'self' } })).toBe(
      'No se pudo cambiar a Lucía: no se puede sobre uno mismo',
    );
    expect(says('users.rejected', { data: { reason: 'otra' } })).toBe('No se pudo cambiar a Lucía');
    expect(says('users.rejected', { targets: [], data: { reason: 'confirm-first' } })).toBe(
      'No se pudo hacer un cambio en Usuarios: faltaba confirmar con Google o la huella',
    );
    expect(says('users.rejected', { targets: [] })).toBe('No se pudo hacer un cambio en Usuarios');
  });

  it('el texto de Roles', () => {
    const roles = (before: string[], after: string[]) => ({
      changes: { roles: { before, after } },
    });
    expect(says('user.roles-changed', roles(['Cajero'], ['Cajero', 'Vendedor']))).toBe(
      'Le dio el rol Vendedor a Lucía',
    );
    expect(says('user.roles-changed', roles(['Cajero', 'Vendedor', 'Depósito'], []))).toBe(
      'Le sacó los roles Cajero, Vendedor y Depósito a Lucía',
    );
    expect(says('user.roles-changed', roles(['Cajero'], ['Vendedor']))).toBe(
      'Le cambió los roles a Lucía',
    );
    const role = { targets: [{ kind: 'role', id: 'r1', name: 'Depósito' }] };
    expect(says('role.created', role)).toBe('Creó el rol Depósito');
    expect(says('role.created', { targets: [] })).toBe('Creó el rol nuevo');
    expect(says('role.changed', { ...role, changes: { name: { before: 'a', after: 'b' } } })).toBe(
      'Le cambió el nombre al rol Depósito',
    );
    expect(
      says('role.changed', { ...role, changes: { permissions: { before: [], after: [] } } }),
    ).toBe('Cambió los permisos del rol Depósito');
    expect(says('role.changed', role)).toBe('Cambió la descripción del rol Depósito');
    expect(says('role.deleted', role)).toBe('Borró el rol Depósito');
    expect(says('role.permissions-added')).toBe('Le sumó al rol Administrador los permisos nuevos');
  });

  it('el texto de Sin conexión, de la plataforma y de Quién hizo qué', () => {
    expect(says('sign-in.offline-confirmed')).toBe('Entró sin conexión');
    expect(says('sign-in.offline-rejected')).toBe('No se pudo confirmar su entrada sin conexión');
    expect(says('sign-in.offline-rejected', { actor: { kind: 'outsider' } })).toBe(
      'No se pudo confirmar una entrada sin conexión de Lucía',
    );
    expect(says('sign-in.offline-repeated')).toBe('Repitió una entrada sin conexión de Lucía');
    expect(says('request.throttled', { data: { topic: 'sign-in' } })).toBe(
      'Llegó al límite de intentos para entrar',
    );
    expect(says('request.throttled')).toBe('Llegó al límite de intentos');
    expect(says('request.rejected')).toBe('Se rechazó un pedido que no venía de la aplicación');
    expect(says('permission.denied', { data: { permission: 'roles.manage' } })).toBe(
      'Quiso usar algo sin el permiso «Administrar roles»',
    );
    expect(says('permission.denied')).toBe('Quiso usar algo sin el permiso «que hace falta»');
    expect(says('audit-log.opened')).toBe('Abrió Quién hizo qué');
  });

  it('las listas y las diferencias', () => {
    expect(listOf([])).toBe('');
    expect(listOf(['A'])).toBe('A');
    expect(difference('nada', ['A'])).toEqual({ added: ['A'], removed: [] });
  });
});
