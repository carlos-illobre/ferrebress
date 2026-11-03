// La pestaña Quién hizo qué (capítulo 05): la lista, el resumen, los filtros, el detalle y la
// conexión, en la computadora y en el celular.
import type { AuditView } from '@ferrebress/shared/contracts/audit-log';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { online } from '../../platform/server/api.ts';
import { detail, events, first, firstPhone, openAuditLog, page, rows } from './audit-test-kit.tsx';

const chip = (name: RegExp) => screen.getByRole('button', { name }) as HTMLElement;

describe('Quién hizo qué', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => online.set(true));
  });

  it('audit-log-E17, E22, E35b: de la más nueva a la más vieja, por días, con su ícono, la hora y la fecha si no es de hoy', async () => {
    const server = openAuditLog();
    await screen.findByText('25 acciones');
    expect(server.sent.map((one) => one.path)).toEqual(['/api/audit-log/people', first]);
    expect(rows()).toHaveLength(5);
    const days = [...document.querySelectorAll('.audit-day h2')].map((one) => one.textContent);
    expect(days[0]).toMatch(/^Hoy, miércoles,? 28 de octubre4 acciones$/);
    expect(days[1]).toMatch(/^Ayer, martes,? 27 de octubre21 acciones$/);
    expect(rows()[0]?.textContent).toContain('11:52');
    expect(rows()[0]?.textContent).toContain('Le sacó el rol Cajero a Martín (hoy: Martín Sosa)');
    expect(rows()[4]?.textContent).toContain('27/10');
    // Cada tipo con su ícono, que no se repite.
    const icons = rows().map((row) => row.querySelector('.audit-icon')?.innerHTML);
    expect(new Set(icons).size).toBe(icons.length);
    expect(screen.getByText('25 acciones')).toBeTruthy();
    expect(screen.getByText('página 1 de 2')).toBeTruthy();
  });

  it('audit-log-E21: rojo lo que saca, ámbar los rechazos y lo no confirmado, con la hora del celular', async () => {
    openAuditLog();
    await screen.findByText('25 acciones');
    expect(rows().map((row) => row.className.match(/audit-(plain|amber|red)/)?.[1])).toEqual([
      'red',
      'amber',
      'plain',
      'amber',
      'plain',
    ]);
    expect(rows()[3]?.textContent).toContain('08:55');
  });

  it('audit-log-E38, E08: el texto de afuera se ve como texto; «El sistema» y «Alguien sin entrar»', async () => {
    const nameless: AuditView = {
      ...(events[1] as AuditView),
      id: '2026:9',
      actor: { kind: 'outsider' },
    };
    openAuditLog({ [first]: { body: page({ events: [...events, nameless] }) } });
    await screen.findByText('<b>jefe</b>@example.com');
    expect(document.querySelector('.audit-row b b')).toBeNull();
    expect(rows()[4]?.textContent).toContain('El sistemaCerró la sesión vencida de Pedro');
    expect(rows()[5]?.textContent).toContain('Alguien sin entrar');
    fireEvent.click(rows()[4] as HTMLElement);
    expect(detail()).toContain('Pedro');
  });

  it('audit-log-E32, E35d: en la computadora, el detalle de la primera y de la que marca el teclado', async () => {
    openAuditLog();
    await screen.findByText('25 acciones');
    expect(detail()).toContain('Ana Gómez le sacó el rol Cajero a Martín');
    expect(detail()).toContain('Cajero, Encargado');
    expect(detail()).toContain('Chrome en Windows');
    expect(detail()).toContain('190.0.0.1');
    expect(detail()).toContain('hora del servidor');
    // Que la lista ya escuche al teclado (los efectos corren después de dibujar).
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    act(() => {
      document.dispatchEvent(new CustomEvent('mark', { detail: rows()[2] as HTMLElement }));
    });
    expect(detail()).toContain('cambió los permisos del rol Encargado');
    expect(detail()).toContain('Ver las personas, viejo.permiso');
    expect(detail()).toContain('Descripciónnada');
    expect(detail()).toContain('otraa');
    expect(detail()).toContain('Esta acción era muy grande');
    act(() => {
      document.dispatchEvent(new CustomEvent('mark'));
    });
    fireEvent.keyDown(rows()[3] as HTMLElement, { key: 'a' });
    expect(detail()).not.toContain('hora del celular');
    fireEvent.keyDown(rows()[3] as HTMLElement, { key: ' ' });
    expect(detail()).toContain('hora del celular, sin confirmar');
    expect(detail()).toContain('llegó a las 09:40');
    fireEvent.click(rows()[4] as HTMLElement);
    expect(detail()).not.toContain('Desde dóndeDispositivo');
  });

  it('audit-log-E20: sin nada anotado, lo dice', async () => {
    openAuditLog({
      [first]: { body: page({ total: 0, pages: 1, events: [], days: {}, strip: [] }) },
    });
    await screen.findByText('Todavía no hay nada anotado.');
    expect(document.querySelector('.audit-strip')).toBeNull();
    expect(document.querySelector('.audit-pager')).toBeNull();
  });

  it('si no se pudieron traer, lo dice y deja reintentar o actualizar', async () => {
    const failed = { status: 500, body: { error: 'unexpected' } };
    openAuditLog({ [first]: [failed, failed, { body: page() }] });
    await screen.findByRole('button', { name: /Reintentar/ });
    fireEvent.click(screen.getByRole('button', { name: /Actualizar/ }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    await screen.findByText('25 acciones');
  });

  it('audit-log-E34: no se pone al día sola; «Actualizar» la trae', async () => {
    const server = openAuditLog();
    await screen.findByText('25 acciones');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(server.sent).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /Actualizar/ }));
    await waitFor(() => expect(server.sent).toHaveLength(3));
    expect(server.sent.at(-1)?.path).toBe(first);
  });

  it('audit-log-E36: sin conexión, gris; al volver, sale del gris sin pedir nada', async () => {
    const server = openAuditLog();
    await screen.findByText('25 acciones');
    act(() => online.set(false));
    expect(screen.getByText(/Sin conexión: Quién hizo qué vuelve sola/)).toBeTruthy();
    expect(document.querySelector('.audit')?.hasAttribute('data-off')).toBe(true);
    act(() => online.set(true));
    expect(document.querySelector('.audit')?.hasAttribute('data-off')).toBe(false);
    expect(server.sent).toHaveLength(2);
  });

  it('audit-log-E18: en el celular, de a 10, sin tira, y el detalle en una hoja al tocar', async () => {
    const server = openAuditLog({}, true);
    await screen.findByText('25 acciones');
    expect(server.sent.at(-1)?.path).toBe(firstPhone);
    expect(document.querySelector('.audit-strip')).toBeNull();
    expect(document.querySelector('.audit-detail')).toBeNull();
    fireEvent.click(rows()[0] as HTMLElement);
    expect(detail()).toContain('le sacó el rol Cajero');
    fireEvent.click(screen.getAllByRole('button', { name: /Cerrar/ }).at(-1) as HTMLElement);
    expect(detail()).toBe('');
    fireEvent.click(rows()[0] as HTMLElement);
    fireEvent.click(document.querySelector('.sheet-scrim') as HTMLElement);
    expect(detail()).toBe('');
  });

  it('seguridad: lo que muestra personas lleva data-private', async () => {
    openAuditLog();
    await screen.findByText('25 acciones');
    expect(document.querySelector('.audit-detail-body')?.hasAttribute('data-private')).toBe(true);
    expect(document.querySelector('.audit-person')?.hasAttribute('data-private')).toBe(true);
    expect(events[1]?.actor.kind).toBe('outsider');
    expect(document.querySelector('.audit-outsider')?.hasAttribute('data-private')).toBe(true);
  });
});
