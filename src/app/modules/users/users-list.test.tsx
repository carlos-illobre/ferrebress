// La lista de Usuarios (02 · R3.1, R3.2, R2.2): el orden, lo que dice cada renglón, el buscador y
// los filtros, y sin conexión.
import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { online } from '../../platform/server/api.ts';
import { pendingEntries } from '../sign-in/index.ts';
import { openUsers, row } from './users-test-kit.tsx';

const names = () =>
  [...document.querySelectorAll('.users-row .users-name em')].map((one) => one.textContent);

describe('la lista de Usuarios', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => online.set(true));
  });

  it('users-E06, E07: la propia con «Vos», las activas y al final las de baja; cuándo entró', async () => {
    openUsers();
    await screen.findByText('Rubén Paredes');
    expect(names()).toEqual([
      'Rubén Paredes',
      'Graciela Benítez',
      'pedro@example.com',
      'Sofía Blanco',
    ]);
    expect(within(row(/Rubén/)).getByText('Vos')).toBeTruthy();
    expect(row(/Graciela/).textContent).toContain('Entró hace 3 días');
    expect(row(/pedro/).textContent).toContain('Todavía no entró');
    expect(row(/pedro/).textContent).toContain('Sin nombre: se ve su correo hasta que entre');
    expect(row(/Sofía/).classList.contains('off')).toBe(true);
    expect(row(/Sofía/).textContent).toContain('Dada de baja');
    const stats = document.querySelector('.users-stats')?.textContent;
    expect(stats).toContain('3Pueden entrar');
    expect(stats).toContain('3Sesiones');
    expect(stats).toContain('1Con huella');
    expect(stats).toContain('1Sin entrar aún');
  });

  it('el buscador, sin mayúsculas ni tildes, y los filtros', async () => {
    openUsers();
    const search = await screen.findByRole('searchbox');
    fireEvent.input(search, { target: { value: 'GRACIELA' } });
    expect(names()).toEqual(['Graciela Benítez']);
    fireEvent.input(search, { target: { value: 'nadie' } });
    expect(screen.getByText('Nadie con «nadie»')).toBeTruthy();
    fireEvent.input(search, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /De baja/ }));
    expect(names()).toEqual(['Sofía Blanco']);
    fireEvent.click(screen.getByRole('button', { name: /Sin entrar/ }));
    expect(names()).toEqual(['pedro@example.com']);
    fireEvent.click(screen.getByRole('button', { name: /Activas/ }));
    expect(names()).toHaveLength(3);
    fireEvent.input(search, { target: { value: 'sofia' } });
    expect(screen.getByText('Nadie con «sofia»')).toBeTruthy();
    expect(screen.getByText('Buscá por nombre o por correo.')).toBeTruthy();
  });

  it('en el celular, «Buscar usuario» abre un diálogo con la caja y los filtros', async () => {
    openUsers();
    await screen.findByText('Rubén Paredes');
    const open = screen.getByRole('button', { name: 'Buscar usuario' });
    fireEvent.click(open);
    const dialog = await screen.findByRole('alertdialog', { name: 'Buscar usuario' });
    const box = within(dialog).getByRole('searchbox');
    fireEvent.input(box, { target: { value: 'graciela' } });
    expect(names()).toEqual(['Graciela Benítez']);
    expect(within(dialog).getByRole('button', { name: 'Ver 1 persona' })).toBeTruthy();
    fireEvent.input(box, { target: { value: '' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /De baja/ }));
    expect(names()).toEqual(['Sofía Blanco']);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ver 1 persona' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(open.querySelector('.users-tool-dot')).not.toBeNull();
    fireEvent.click(open);
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(names()).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Ver 4 personas' }));
    expect(open.querySelector('.users-tool-dot')).toBeNull();
  });

  it('si no se pudo traer la lista, lo dice y se reintenta', async () => {
    openUsers({
      '/api/users': [{ status: 500, body: { error: 'internal' } }, { body: { people: [] } }],
    });
    expect(screen.getByText('Buscando a las personas')).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByText('Nadie en este filtro.')).toBeTruthy();
  });

  it('users-R2.2: sin conexión, gris y con lo último; abierta sin conexión, la pide al volver', async () => {
    act(() => online.set(false));
    const server = openUsers();
    expect(screen.getByRole('status').textContent).toContain('Sin conexión');
    expect(server.sent).toHaveLength(0);
    for (const button of screen.getAllByRole('button', { name: /Autorizar a alguien/ }))
      expect((button as HTMLButtonElement).disabled).toBe(true);
    act(() => online.set(true));
    await screen.findByText('Rubén Paredes');
    act(() => online.set(false));
    expect(document.querySelector('.users')?.hasAttribute('data-off')).toBe(true);
    expect(screen.getByText('Rubén Paredes')).toBeTruthy();
    act(() => online.set(true));
    await waitFor(() =>
      expect(document.querySelector('.users')?.hasAttribute('data-off')).toBe(false),
    );
    expect(server.sent).toHaveLength(1);
  });

  it('con una entrada sin conexión por confirmar, espera a que el servidor la confirme (15 · R3)', async () => {
    act(() => pendingEntries.set(1));
    const server = openUsers();
    await act(async () => {});
    expect(server.sent).toHaveLength(0);
    act(() => pendingEntries.set(0));
    await screen.findByText('Rubén Paredes');
  });

  it('Auditoría todavía no está: dice «Pronto»', async () => {
    openUsers();
    fireEvent.click(screen.getByRole('button', { name: /Auditoría/ }));
    expect(document.querySelector('.toast')?.textContent).toContain('Auditoría · pronto');
  });
});
