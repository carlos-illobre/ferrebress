import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eva, resetOffline } from './offline-kit.ts';
import {
  contacted,
  disableOffline,
  enableOffline,
  heardOfflineHours,
  knownOfflineHours,
  lastContactAt,
  offlineOption,
  offlineSessionOver,
  offlineUntil,
  revokeOffline,
  updateOffline,
} from './option.ts';
import { whenText } from './when.ts';

const at = new Date('2026-10-29T09:40:00').getTime();
const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

describe('hasta cuándo se puede entrar sin conexión', () => {
  beforeEach(resetOffline);
  afterEach(() => vi.useRealTimers());

  it('offline-E06, E08: hasta 24 horas desde el último contacto con sesión; después, no', () => {
    expect(offlineUntil(at)).toBeUndefined();
    heardOfflineHours('24');
    contacted(at);
    expect(offlineUntil(at)).toBeUndefined();
    enableOffline(eva);
    expect(offlineUntil(at + minute)).toEqual(new Date(at + day));
    expect(offlineUntil(at + day)).toBeUndefined();
    expect(lastContactAt()).toBe(at);
  });

  it('administration-E56 y E57: con las horas del último contacto; sin ellas, las más cortas', () => {
    enableOffline(eva);
    contacted(at);
    // Un contacto guardado sin horas: 4.
    expect(knownOfflineHours()).toBe(4);
    expect(offlineUntil(at + 4 * hour)).toBeUndefined();
    // E56: con 8 horas, a las 10 del último contacto ya no.
    heardOfflineHours('8');
    contacted(at);
    expect(offlineUntil(at + 7 * hour)).toBeDefined();
    expect(offlineUntil(at + 10 * hour)).toBeUndefined();
    // E57: el servidor cambió las horas mientras el celular estaba sin conexión: sigue con las que
    // tenía hasta su próximo contacto.
    const later = at + 11 * hour;
    contacted(later);
    heardOfflineHours('24');
    expect(offlineUntil(later + 9 * hour)).toBeUndefined();
    contacted(later + 9 * hour);
    expect(offlineUntil(later + 20 * hour)).toBeDefined();
    // Una respuesta sin horas no borra las del contacto.
    heardOfflineHours(undefined);
    contacted(at);
    expect(knownOfflineHours()).toBe(24);
    // Unas horas que no son de la lista no se toman.
    heardOfflineHours('9999');
    contacted(at);
    expect(knownOfflineHours()).toBe(24);
  });

  it('offline-E09: atrasar el reloj por debajo de la hora más alta que vio no deja entrar', () => {
    contacted(at);
    enableOffline(eva);
    expect(offlineUntil(at + 60 * minute)).toBeDefined();
    expect(offlineUntil(at + 56 * minute)).toBeDefined();
    expect(offlineUntil(at + 54 * minute)).toBeUndefined();
    // Un contacto nuevo no baja la más alta.
    contacted(at + 10 * minute);
    expect(offlineUntil(at + 54 * minute)).toBeUndefined();
  });

  it('offline-R2.3, R2.7: la sesión sin conexión se corta a las 24 horas, o si el reloj se atrasó', () => {
    expect(offlineSessionOver(at)).toBe(true);
    contacted(at);
    expect(offlineSessionOver(at + minute)).toBe(false);
    expect(offlineSessionOver(at - 6 * minute)).toBe(true);
    expect(offlineSessionOver(at + 4 * hour)).toBe(true);
  });

  it('users-E52: la persona de la opción guarda su nombre, sus roles y permisos de ahora, y nunca el correo', () => {
    enableOffline(eva);
    expect(offlineOption.get()?.person).toEqual({
      userId: eva.userId,
      name: eva.name,
      roles: eva.roles,
      permissions: eva.permissions,
      rolesChangedBy: null,
      rolesChangedAt: null,
    });
    updateOffline({ ...eva, name: 'Eva R.' });
    expect(offlineOption.get()?.person.name).toBe('Eva R.');
    // Le sacaron un permiso (02 · R7.9): se guarda el de ahora.
    updateOffline({ ...eva, name: 'Eva R.', permissions: ['users.view'] });
    expect(offlineOption.get()?.person.permissions).toEqual(['users.view']);
    updateOffline({ ...eva, name: 'Eva R.' });
    updateOffline({ ...eva, userId: 'otra', name: 'Otra' });
    expect(offlineOption.get()?.person.name).toBe('Eva R.');
    disableOffline();
    updateOffline(eva);
    expect(offlineOption.get()).toBeUndefined();
  });

  it('offline-E10: con la sesión cerrada desde otro dispositivo, no hasta el próximo contacto', () => {
    contacted(at);
    enableOffline(eva);
    revokeOffline();
    expect(offlineUntil(at)).toBeUndefined();
    contacted(at + minute);
    expect(offlineOption.get()?.revoked).toBe(false);
    expect(offlineUntil(at + minute)).toBeDefined();
    disableOffline();
    revokeOffline();
    expect(offlineOption.get()).toBeUndefined();
  });

  it('offline-R2.1: dice hasta cuándo como lo lee la persona', () => {
    // En la hora del negocio (Buenos Aires, -03:00), aunque el dispositivo esté en otra zona.
    const now = new Date('2026-10-29T08:00:00-03:00');
    expect(whenText(new Date('2026-10-29T21:40:00-03:00'), now)).toBe('hoy 21:40');
    expect(whenText(new Date('2026-10-30T09:05:00-03:00'), now)).toBe('mañana 09:05');
    expect(whenText(new Date('2026-11-03T09:40:00-03:00'), now)).toBe('el martes 09:40');
    vi.useFakeTimers({ now });
    expect(whenText(new Date('2026-10-29T21:40:00-03:00'))).toBe('hoy 21:40');
  });
});
