// Lo que el marco hace con los permisos (00 · R1.4, R1.8; 02 · R7.7, R7.8): lo que no se puede usar no
// aparece; abierto por la dirección, «Sin permiso»; perdido mientras se usa, «Ya no tenés permiso» y
// a los 5 segundos a la primera opción.
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { act, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate, route } from '../../platform/router.ts';
import { fakeServer } from '../../testing/fake-server.ts';
import { Toasts } from '../../ui/toast/Toast.tsx';
import { media, open, person } from './frame-test-kit.tsx';
import { Frame } from './index.ts';

const seller: Person = {
  ...person,
  roles: [{ id: 'r2', name: 'Vendedor' }],
  permissions: ['offline.work'],
  rolesChangedBy: 'Graciela Benítez',
  rolesChangedAt: 1,
};
const holders = {
  roles: [{ id: 'r1', name: 'Administrador', people: ['Rubén Paredes', 'Graciela Benítez'] }],
  grantedBy: ['Rubén Paredes', 'Graciela Benítez'],
};
const users = () => <p>La pantalla de Usuarios</p>;

describe('el marco con permisos', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    navigate('/', { replace: true });
  });

  it('users-E45: sin «Ver las personas», Usuarios no está en Más ni abre al entrar', () => {
    media();
    const { side } = open({ who: seller, screens: { users } });
    fireEvent.click(within(side).getByRole('button', { name: /Más/ }));
    expect(screen.queryByRole('button', { name: /Usuarios/ })).toBeNull();
    expect(screen.getByRole('main').textContent).not.toContain('La pantalla de Usuarios');
  });

  it('users-E45: por la dirección, dice qué falta, quién lo tiene y quién lo da, y copia el pedido', async () => {
    media();
    const server = fakeServer({ '/api/permissions/users.view/holders': { body: holders } });
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    navigate('/users');
    open({ who: seller, screens: { users } });
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading').textContent).toBe('No tenés permiso para Usuarios');
    expect(main.textContent).toContain('«Ver las personas»');
    expect(await within(main).findByText('Administrador')).toBeTruthy();
    expect(main.textContent).toContain('1 rol · 2 personas');
    expect(main.textContent).toContain('Graciela Benítez');
    expect(main.textContent).toContain('Vendedor');
    expect(main.textContent).not.toContain('@');
    expect(server.sent.map((sent) => sent.path)).toEqual(['/api/permissions/users.view/holders']);
    await act(async () => {
      fireEvent.click(within(main).getByRole('button', { name: /Copiar el pedido/ }));
    });
    expect(writeText).toHaveBeenCalledWith(
      'Hola, soy Rubén Paredes. ¿Me podés dar el permiso «Ver las personas» en Ferrebress? Lo necesito para usar Usuarios.',
    );
    await act(async () => {
      fireEvent.click(within(main).getByRole('button', { name: /Ir a Vender/ }));
    });
    expect(route.get().path).toBe('/');
  });

  it('users-E48: le sacan el permiso con Usuarios abierto: lo dice y a los 5 segundos va a la primera opción', () => {
    media();
    vi.useFakeTimers();
    fakeServer({ '/api/permissions/users.view/holders': { body: holders } });
    navigate('/users');
    const frame = (who: Person) => (
      <div id="app">
        <Frame person={who} testing={false} onSignOut={() => {}} screens={{ users }} />
        <Toasts />
      </div>
    );
    const { rerender } = render(frame(person));
    expect(screen.getByRole('main').textContent).toBe('La pantalla de Usuarios');
    rerender(frame(seller));
    const dialog = screen.getByRole('alertdialog', { name: 'Ya no tenés permiso para Usuarios' });
    expect(dialog.textContent).toContain('Graciela Benítez te sacó «Administrador» recién.');
    expect(dialog.textContent).toContain('Te llevo a Vender');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(route.get().path).toBe('/');
  });
});
