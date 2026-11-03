// Las reglas de la pantalla de Quién hizo qué, sin dibujo, y que cada ícono del catálogo esté
// dibujado en la aplicación (05 · R4.10).
import { catalog, entryOf } from '@ferrebress/shared/audit-log/index';
import { describe, expect, it } from 'vitest';
import { auditLogShapes } from '../../ui/icon/audit-log-shapes.tsx';
import { menuShapes } from '../../ui/icon/menu-shapes.tsx';
import { peopleShapes } from '../../ui/icon/people-shapes.tsx';
import { rolesShapes } from '../../ui/icon/roles-shapes.tsx';
import { shapes } from '../../ui/icon/shapes.tsx';
import { queryString } from './api.ts';
import { browserOf, dayTitle, initials, stripDay, stripScale } from './logic.ts';

describe('la pantalla de Quién hizo qué, sin dibujo', () => {
  it('audit-log-E35b: cada ícono del catálogo está dibujado', () => {
    const drawn = { ...shapes, ...menuShapes, ...peopleShapes, ...rolesShapes, ...auditLogShapes };
    const icons = [...Object.values(catalog), entryOf('nada')].map((entry) => entry.icon);
    expect(icons.filter((icon) => !(icon in drawn))).toEqual([]);
  });

  it('los parámetros, sin los vacíos', () => {
    expect(queryString({})).toBe('');
    expect(queryString({ page: 1, by: undefined, to: '', type: 'a b' })).toBe('?page=1&type=a%20b');
  });

  it('los días, las iniciales y el navegador', () => {
    expect(dayTitle('2026-10-20', '2026-10-28')).toMatch(/^Martes,? 20 de octubre$/);
    expect(initials('  ana  maría gómez')).toBe('AM');
    expect(browserOf({ phone: true, browser: 'firefox' })).toBe('Firefox');
    expect(browserOf({ phone: true, os: 'iphone' })).toBe('iPhone');
    expect(browserOf({ phone: false, browser: 'edge', os: 'linux' })).toBe('Edge en Linux');
    expect(browserOf(undefined)).toBeUndefined();
  });

  it('el día y el tramo de la tira', () => {
    expect(stripDay(undefined, '2026-10-28')).toBe('2026-10-28');
    expect(stripDay({ range: 'yesterday' }, '2026-10-28')).toBe('2026-10-27');
    expect(stripDay({ from: '2026-10-20', until: '2026-10-20' }, '2026-10-28')).toBe('2026-10-20');
    const short = stripScale([9 * 3600 + 40 * 60]);
    expect(short.hours).toEqual([9, 10, 11, 12]);
    expect(short.place(9 * 3600)).toBe(0);
    expect(stripScale([3600, 20 * 3600]).hours).toEqual([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]);
  });
});
