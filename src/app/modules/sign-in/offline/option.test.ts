import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eva, resetOffline } from './offline-kit.ts';
import {
  contacted,
  disableOffline,
  enableOffline,
  lastContactAt,
  offlineOption,
  offlineSessionOver,
  offlineUntil,
  offlineWindowMs,
  revokeOffline,
  updateOffline,
} from './option.ts';
import { whenText } from './when.ts';

const at = new Date('2026-10-29T09:40:00').getTime();
const minute = 60_000;

describe('hasta cuándo se puede entrar sin conexión', () => {
  beforeEach(resetOffline);
  afterEach(() => vi.useRealTimers());

  it('offline-E06, E08: hasta 24 horas desde el último contacto con sesión; después, no', () => {
    expect(offlineUntil(at)).toBeUndefined();
    contacted(at);
    expect(offlineUntil(at)).toBeUndefined();
    enableOffline(eva);
    expect(offlineUntil(at + minute)).toEqual(new Date(at + offlineWindowMs));
    expect(offlineUntil(at + offlineWindowMs)).toBeUndefined();
    expect(lastContactAt()).toBe(at);
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
    expect(offlineSessionOver(at + offlineWindowMs)).toBe(true);
  });

  it('la persona de la opción guarda su nombre y su rol de ahora, y nunca el correo', () => {
    enableOffline(eva);
    expect(offlineOption.get()?.person).toEqual({
      userId: eva.userId,
      name: eva.name,
      role: eva.role,
    });
    updateOffline({ ...eva, name: 'Eva R.' });
    expect(offlineOption.get()?.person.name).toBe('Eva R.');
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
    const now = new Date('2026-10-29T08:00:00');
    expect(whenText(new Date('2026-10-29T21:40:00'), now)).toBe('hoy 21:40');
    expect(whenText(new Date('2026-10-30T09:05:00'), now)).toBe('mañana 9:05');
    expect(whenText(new Date('2026-11-03T09:40:00'), now)).toBe('el martes 9:40');
    vi.useFakeTimers({ now });
    expect(whenText(new Date('2026-10-29T21:40:00'))).toBe('hoy 21:40');
  });
});
