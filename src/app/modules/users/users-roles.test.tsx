import { fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate, route } from '../../platform/router.ts';
import { person as me } from '../sign-in/index.ts';
import {
  all,
  encRow,
  openRoles,
  role,
  rolesRoute,
  saveButton,
  settle,
  typeIn,
} from './users-roles-kit.tsx';
import { openUsers, roleRows, toast } from './users-test-kit.tsx';

const rowOf = (name: string) => screen.getByRole('button', { name: `Abrir «${name}»` });
const search = (text: string) =>
  fireEvent.input(screen.getByRole('searchbox', { name: /Buscá un rol/ }), {
    target: { value: text },
  });

describe('la pestaña Roles (02 · R7.12, R7.13)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('users-E57, E60: cada rol con su descripción, cuántos permisos y quiénes lo tienen', async () => {
    await openRoles();
    const shift = within(rowOf('Encargado de turno'));
    expect(shift.getByText('Abre y cierra el local')).toBeTruthy();
    expect(shift.getByText('Lo tiene 1 persona')).toBeTruthy();
    expect(within(rowOf('Administrador')).getByText('Lo tienen 3 personas')).toBeTruthy();
    expect(screen.getAllByText('LF').length).toBeGreaterThan(0);
  });

  it('users-E61: se busca mientras se escribe; sin nada, ofrece crear uno con ese nombre', async () => {
    await openRoles();
    search('lucía');
    expect(screen.queryByRole('button', { name: 'Abrir «Administrador»' })).toBeNull();
    expect(rowOf('Encargado de turno')).toBeTruthy();
    search('Cajero');
    expect(screen.getByText('Ningún rol coincide con «Cajero».')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Crear el rol «Cajero»' }));
    await screen.findByText('Crear nuevo rol', { selector: 'h2' });
    expect((role().getByLabelText(/Nombre del rol/) as HTMLInputElement).value).toBe('Cajero');
    expect(route.get().path).toBe('/users/roles/new');
  });

  it('users-E62: «Guardar rol» va apagado hasta el primer cambio y guarda solo lo que cambió', async () => {
    const saved = { ...encRow, description: 'Otra cosa', version: 4 };
    const server = await openRoles({
      '/api/roles/enc': { body: { role: saved } },
      '/api/roles': [rolesRoute, { body: { roles: [...roleRows, saved] } }],
    });
    fireEvent.click(rowOf('Encargado de turno'));
    await screen.findByText('Información del rol');
    expect(route.get().path).toBe('/users/roles/enc');
    expect(saveButton().disabled).toBe(true);
    typeIn('Descripción', 'Otra cosa');
    expect(saveButton().disabled).toBe(false);
    typeIn('Descripción', 'Abre y cierra el local');
    expect(saveButton().disabled).toBe(true);
    typeIn('Descripción', 'Otra cosa');
    fireEvent.click(saveButton());
    await waitFor(() => expect(toast()).toBe('Se guardó «Encargado de turno».'));
    expect(server.bodies('/api/roles/enc')).toEqual([{ version: 3, description: 'Otra cosa' }]);
    expect(route.get()).toMatchObject({ path: '/users/roles', state: { arriving: 'enc' } });
  });

  it('users-E36: lo incluido queda con candado y lo dice; solo el primer grupo arranca abierto', async () => {
    await openRoles({}, '/users/roles/enc');
    const view = role().getByRole('checkbox', { name: /^Ver las personas/ }) as HTMLInputElement;
    expect(view.checked).toBe(true);
    expect(view.disabled).toBe(true);
    expect(role().getAllByText(/Va incluido en «Cortar sesiones y huellas»/).length).toBe(1);
    expect(role().queryByRole('checkbox', { name: /^Trabajar sin conexión/ })).toBeNull();
    fireEvent.click(role().getByRole('button', { name: /Sin conexión/ }));
    fireEvent.click(role().getByRole('checkbox', { name: /^Trabajar sin conexión/ }));
    expect(role().getByText('1 de 1')).toBeTruthy();
    fireEvent.click(role().getByRole('checkbox', { name: /^Cortar sesiones y huellas/ }));
    expect(
      (role().getByRole('checkbox', { name: /^Ver las personas/ }) as HTMLInputElement).disabled,
    ).toBe(false);
    fireEvent.click(role().getByRole('button', { name: /Usuarios/ }));
    expect(role().queryByRole('checkbox', { name: /^Ver las personas/ })).toBeNull();
  });

  it('users-E64: no hay «Cancelar»; sin cambios, volver a la lista no pregunta ni pide nada', async () => {
    const server = await openRoles({}, '/users/roles/enc');
    expect(role().queryByRole('button', { name: /Cancelar/ })).toBeNull();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Volver a los roles' })[0] as HTMLElement,
    );
    await screen.findByRole('button', { name: 'Abrir «Encargado de turno»' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(server.bodies('/api/roles/enc')).toEqual([]);
  });

  it('users-E64: salir con cambios pregunta; «Seguir editando» no pierde nada; «Descartar» sale', async () => {
    await openRoles({}, '/users/roles/enc');
    typeIn('Nombre del rol', 'Otro nombre');
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Volver a los roles' })[0] as HTMLElement,
    );
    const ask = await screen.findByRole('alertdialog', { name: '¿Descartar los cambios del rol?' });
    fireEvent.click(within(ask).getByRole('button', { name: 'Seguir editando' }));
    expect((role().getByLabelText(/Nombre del rol/) as HTMLInputElement).value).toBe('Otro nombre');
    expect(route.get().path).toBe('/users/roles/enc');
    navigate('/users');
    const again = await screen.findByRole('alertdialog', {
      name: '¿Descartar los cambios del rol?',
    });
    fireEvent.click(within(again).getByRole('button', { name: /^Descartar/ }));
    await settle();
    expect(route.get().path).toBe('/users');
  });

  it('users-E37, E65: un nombre que ya está y sin permisos, lo dice todo junto y no pide nada', async () => {
    const server = await openRoles({}, '/users/roles/new');
    expect(saveButton().disabled).toBe(true);
    typeIn('Nombre del rol', 'encargado de turno');
    fireEvent.click(saveButton());
    expect(
      await screen.findByText(
        /No se guardó nada. Corregí lo que está marcado en rojo: el nombre, los permisos\./,
      ),
    ).toBeTruthy();
    expect(role().getAllByText(/Ya hay un rol con ese nombre/)).toHaveLength(1);
    expect(role().getAllByText('Tildá al menos un permiso.')).toHaveLength(1);
    typeIn('Nombre del rol', '  ');
    expect(role().getAllByText('Ponele un nombre.')).toHaveLength(1);
    expect(server.bodies('/api/roles').filter(Boolean)).toEqual([]);
  });

  it('una dirección de un rol que ya no está vuelve a la lista', async () => {
    navigate('/users/roles/viejo', { replace: true, force: true });
    openUsers({ '/api/users': { body: all }, '/api/roles': rolesRoute });
    await waitFor(() => expect(route.get().path).toBe('/users/roles'));
  });

  it('mientras trae los roles, lo dice; «Usuarios» vuelve a las personas', async () => {
    navigate('/users/roles', { replace: true, force: true });
    openUsers({ '/api/roles': 'waiting' });
    expect(await screen.findByText('Trayendo los roles…')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Usuarios$/ }));
    expect(route.get().path).toBe('/users');
  });

  it('desde Usuarios, la pestaña Roles abre la lista; «Nuevo rol», uno vacío; Enter en el nombre guarda', async () => {
    const created = { ...encRow, id: 'caja', name: 'Caja', version: 1 };
    const server = await openRoles({
      '/api/roles': [rolesRoute, { body: { role: created } }, rolesRoute],
    });
    fireEvent.click(screen.getByRole('button', { name: /^Usuarios$/ }));
    fireEvent.click(await screen.findByRole('button', { name: /^Roles$/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Nuevo rol/ }));
    await screen.findByText('Crear nuevo rol', { selector: 'h2' });
    typeIn('Nombre del rol', 'Caja');
    fireEvent.click(role().getByRole('checkbox', { name: /^Ver las personas/ }));
    fireEvent.keyDown(role().getByLabelText(/Nombre del rol/), { key: 'Enter' });
    fireEvent.keyDown(role().getByLabelText(/Nombre del rol/), { key: 'a' });
    await waitFor(() => expect(toast()).toBe('Se creó el rol «Caja».'));
    expect(server.bodies('/api/roles').filter(Boolean)).toEqual([
      { name: 'Caja', description: null, permissions: ['users.view'] },
    ]);
  });

  it('un rol que nadie tiene lo dice en la lista', async () => {
    const nobody = { ...encRow, id: 'nada', name: 'Sin nadie', description: null };
    await openRoles({ '/api/roles': { body: { roles: [...roleRows, encRow, nobody] } } });
    expect(within(rowOf('Sin nadie')).getAllByText('Nadie lo tiene').length).toBeGreaterThan(0);
  });

  it('users-E48: si le sacan «Administrar roles» con la pestaña abierta, vuelve a las personas', async () => {
    await openRoles();
    const who = me.get() as NonNullable<ReturnType<typeof me.get>>;
    me.set({ ...who, permissions: ['users.view'] });
    await waitFor(() => expect(route.get().path).toBe('/users'));
    me.set(who);
  });

  it('lo que rechaza el servidor sin lugar lo dice un aviso; el nombre repetido va al nombre', async () => {
    const server = await openRoles(
      {
        '/api/roles/enc': [
          { status: 409, body: { error: 'role-name-taken' } },
          { status: 400, body: { error: 'otra-cosa' } },
          { status: 409, body: { error: 'changed' } },
        ],
        '/api/roles': [rolesRoute, { status: 500, body: { error: 'otra-cosa' } }],
      },
      '/users/roles/enc',
    );
    typeIn('Nombre del rol', 'Cajero');
    fireEvent.click(saveButton());
    expect(await screen.findAllByText(/Ya hay un rol con ese nombre/)).toHaveLength(1);
    fireEvent.click(saveButton());
    await waitFor(() => expect(toast()).toBe('No se pudo. Probá de nuevo.'));
    fireEvent.click(saveButton());
    // Si otro lo cambió y no se puede traer cómo quedó, lo dice y el borrador sigue como estaba.
    await waitFor(() => expect(server.bodies('/api/roles')).toHaveLength(2));
    expect((role().getByLabelText(/Nombre del rol/) as HTMLInputElement).value).toBe('Cajero');
  });

  it('en el celular: el buscador corto y el cursor no arranca en el nombre', async () => {
    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      get: () => ({ mobile: true }),
    });
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('max-width'),
      media: query,
    }));
    navigate('/users/roles', { replace: true, force: true });
    openUsers({ '/api/users': { body: all }, '/api/roles': rolesRoute }, true);
    expect((await screen.findByRole('searchbox')).getAttribute('placeholder')).toBe('Buscá un rol');
    fireEvent.click(rowOf('Encargado de turno'));
    await screen.findByText('Información del rol');
    expect(document.activeElement).not.toBe(role().getByLabelText(/Nombre del rol/));
    Reflect.deleteProperty(navigator, 'userAgentData');
  });

  it('la descripción avisa al llegar a 200 letras; un rol con un permiso lo dice en singular', async () => {
    const one = { ...encRow, id: 'uno', name: 'Uno solo', permissions: ['users.view'] };
    await openRoles({ '/api/roles': { body: { roles: [...roleRows, encRow, one] } } });
    expect(within(rowOf('Uno solo')).getByText('permiso')).toBeTruthy();
    fireEvent.click(rowOf('Uno solo'));
    await screen.findByText('Información del rol');
    typeIn('Descripción', 'x'.repeat(200));
    expect(role().getByText('200/200').className).toContain('full');
  });
});
