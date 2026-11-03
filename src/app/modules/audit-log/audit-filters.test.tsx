// Los filtros de Quién hizo qué (05 · R4.5, R4.9): por persona, por fecha y por tipo, combinados, y
// los números del resumen que filtran.
import { fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openAuditLog, page } from './audit-test-kit.tsx';

const chip = (name: RegExp) => screen.getByRole('button', { name }) as HTMLElement;

describe('los filtros de Quién hizo qué', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('audit-log-E33, E23, E31: tocar a quien la hizo o la recibió filtra, desde la página 1', async () => {
    const server = openAuditLog({
      '/api/audit-log?page=1&size=20&by=ana': { body: page({ total: 3, pages: 1 }) },
      '/api/audit-log?page=1&size=20&by=ana&to=martin': { body: page({ total: 1, pages: 1 }) },
    });
    const [actor] = await screen.findAllByRole('button', { name: 'Ana Gómez' });
    fireEvent.click(actor as HTMLElement);
    await screen.findByText('3 acciones');
    const [target] = screen.getAllByRole('button', { name: /^Martín/ });
    fireEvent.click(target as HTMLElement);
    await screen.findByText('1 acción');
    expect(server.sent.at(-1)?.path).toBe('/api/audit-log?page=1&size=20&by=ana&to=martin');
    expect(chip(/Hecho por/).textContent).toContain('Ana Gómez');
    expect(chip(/Hecho a/).textContent).toContain('Martín Sosa');
  });

  it('audit-log-E35: con el teclado se llega a cada filtro, a las páginas y a cada fila', async () => {
    openAuditLog();
    await screen.findByText('25 acciones');
    const keys = [...document.querySelectorAll<HTMLElement>('.audit [data-key]')].map(
      (one) => one.dataset.key,
    );
    expect(keys).toEqual(expect.arrayContaining(['p', 'a', 'f', 't', 'r']));
    expect(chip(/Hecho por/).dataset.key).toBe('p');
    expect(chip(/Hecho a/).dataset.key).toBe('a');
    const pages = [...document.querySelectorAll<HTMLElement>('[data-page]')].map(
      (one) => one.dataset.page,
    );
    expect(pages.sort()).toEqual(['next', 'previous']);
    expect(document.querySelectorAll('.audit-row[data-mark]')).toHaveLength(5);
  });

  it('audit-log-E19: anterior y siguiente; en la primera, «anterior» apagado', async () => {
    const server = openAuditLog({
      '/api/audit-log?page=2&size=20': { body: page({ page: 2 }) },
      '/api/audit-log?page=1&size=20': { body: page() },
    });
    await screen.findByText('página 1 de 2');
    expect((screen.getByRole('button', { name: 'Anterior' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('página 2 de 2');
    expect((screen.getByRole('button', { name: 'Siguiente' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    await screen.findByText('página 1 de 2');
    expect(server.sent.map((one) => one.path)).toContain('/api/audit-log?page=2&size=20');
  });

  it('audit-log-E35c, R4.9: los números del resumen filtran en su período, y tocar de nuevo saca el filtro', async () => {
    const amber = '/api/audit-log?page=1&size=20&range=today&tone=amber&summary=1&strip=1';
    const today = '/api/audit-log?page=1&size=20&range=today';
    const red = '/api/audit-log?page=1&size=20&range=today&tone=red';
    const server = openAuditLog({
      [amber]: { body: page({ total: 2, pages: 1 }) },
      [today]: { body: page({ total: 4, pages: 1 }) },
      [red]: { body: page({ total: 1, pages: 1 }) },
    });
    const refused = await screen.findByRole('button', { name: /Rechazos/ });
    fireEvent.click(refused);
    await screen.findByText('2 acciones');
    expect(refused.getAttribute('aria-pressed')).toBe('true');
    expect(chip(/Tipo/).textContent).toContain('Rechazos y sin confirmar');
    expect(chip(/Fecha/).textContent).toContain('Hoy');
    fireEvent.click(refused);
    await screen.findByText('4 acciones');
    fireEvent.click(screen.getByRole('button', { name: /Sacó o borró/ }));
    await screen.findByText('1 acción');
    fireEvent.click(document.querySelector('.audit-number') as HTMLElement);
    await waitFor(() => expect(server.sent.at(-1)?.path).toBe(today));
  });

  it('audit-log-E25, E27, E28, E29, E30: los filtros, combinados, con las personas dadas de baja y borradas; si no hay nada, sacarlos', async () => {
    const yesterday = '/api/audit-log?page=1&size=20&range=yesterday&summary=1&strip=1';
    const roles = '/api/audit-log?page=1&size=20&range=yesterday&group=roles';
    const renamed = '/api/audit-log?page=1&size=20&range=yesterday&type=user.renamed';
    const nobody = '/api/audit-log?page=1&size=20&by=camila&range=yesterday&type=user.renamed';
    const server = openAuditLog({
      [yesterday]: { body: page() },
      [roles]: { body: page() },
      [renamed]: { body: page() },
      [nobody]: { body: page({ total: 0, pages: 1, events: [], days: {} }) },
      '/api/audit-log?page=1&size=20&summary=1&strip=1': { body: page() },
    });
    await screen.findByText('25 acciones');
    fireEvent.click(chip(/Fecha/));
    fireEvent.click(screen.getByRole('option', { name: 'Ayer' }));
    await waitFor(() => expect(chip(/Fecha/).textContent).toContain('Ayer'));
    expect(server.sent.at(-1)?.path).toBe(yesterday);
    fireEvent.click(chip(/Tipo/));
    fireEvent.click(screen.getByRole('option', { name: 'Roles' }));
    await waitFor(() => expect(chip(/Tipo/).textContent).toContain('Roles'));
    expect(server.sent.at(-1)?.path).toBe(roles);
    fireEvent.click(chip(/Tipo/));
    fireEvent.click(screen.getByRole('option', { name: 'Cambió el nombre de alguien' }));
    await waitFor(() => expect(chip(/Tipo/).textContent).toContain('Cambió el nombre'));
    expect(server.sent.at(-1)?.path).toBe(renamed);
    fireEvent.click(chip(/Hecho por/));
    expect(screen.getByRole('option', { name: /Lucía \(dada de baja\)/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Camila (borrada)' })).toBeTruthy();
    fireEvent.click(screen.getByRole('option', { name: 'Camila (borrada)' }));
    await screen.findByText('No hay acciones con esos filtros.');
    const clear = screen.getAllByRole('button', { name: /Sacar los filtros/ });
    fireEvent.click(clear.at(-1) as HTMLElement);
    await waitFor(() =>
      expect(server.sent.at(-1)?.path).toBe('/api/audit-log?page=1&size=20&summary=1&strip=1'),
    );
  });

  it('las opciones de cada filtro: todos, el sistema, alguien sin entrar, los atajos y los días a mano', async () => {
    const days =
      '/api/audit-log?page=1&size=20&from=2026-10-20&until=2026-10-28&tone=red&summary=1&strip=1';
    const server = openAuditLog({
      '/api/audit-log?page=1&size=20&by=system': { body: page() },
      '/api/audit-log?page=1&size=20&by=outsider': { body: page() },
      '/api/audit-log?page=1&size=20': { body: page() },
      '/api/audit-log?page=1&size=20&tone=red': { body: page() },
      [days]: { body: page() },
    });
    await screen.findByText('25 acciones');
    for (const [filter, option, path] of [
      [/Hecho por/, 'El sistema', '/api/audit-log?page=1&size=20&by=system'],
      [/Hecho por/, 'Alguien sin entrar', '/api/audit-log?page=1&size=20&by=outsider'],
      [/Hecho por/, 'Todos', '/api/audit-log?page=1&size=20'],
      [/Tipo/, 'Lo que borra o saca', '/api/audit-log?page=1&size=20&tone=red'],
    ] as const) {
      fireEvent.click(chip(filter));
      fireEvent.click(screen.getByRole('option', { name: option }));
      await waitFor(() => expect(chip(filter).textContent).toContain(option));
      expect(server.sent.at(-1)?.path).toBe(path);
    }
    expect(chip(/Hecho por/).textContent).toContain('Todos');
    fireEvent.click(chip(/Fecha/));
    const form = document.querySelector('.audit-pick-dates') as HTMLFormElement;
    const [from, until] = within(form).getAllByDisplayValue('2026-10-28');
    fireEvent.input(from as HTMLElement, { target: { value: '2026-10-20' } });
    fireEvent.input(until as HTMLElement, { target: { value: '2026-10-28' } });
    fireEvent.submit(form);
    await waitFor(() => expect(chip(/Fecha/).textContent).toContain('2026-10-20 – 2026-10-28'));
    expect(server.sent.at(-1)?.path).toBe(days);
    // Con días elegidos a mano, ningún atajo está elegido.
    fireEvent.click(chip(/Fecha/));
    expect(screen.getByRole('option', { name: 'Hoy' }).getAttribute('aria-selected')).toBe('false');
    fireEvent.click(chip(/Fecha/));
    // Cerrar sin elegir.
    fireEvent.click(chip(/Hecho a/));
    fireEvent.click(screen.getByRole('button', { name: /Cerrar/ }));
    expect(screen.queryByRole('listbox', { name: 'Hecho a' })).toBeNull();
  });
});
