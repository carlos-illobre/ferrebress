// La pantalla de Administración (capítulo 06), con el servidor de mentira: ver, cambiar, deshacer, el
// choque con otro, el redondeo con su confirmación, el permiso y sin conexión.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { online } from '../../platform/server/api.ts';
import {
  initial,
  openAdministration,
  option,
  saveOf,
  seller,
  tab,
  toast,
} from './administration-test-kit.tsx';

const ok = (value: unknown, version = 1) => ({ body: { value, version } });

describe('Administración', () => {
  afterEach(() => {
    vi.useRealTimers();
    online.set(true);
  });

  it('administration-E01: muestra los ajustes con su valor, agrupados', async () => {
    openAdministration();
    expect(await screen.findByRole('tab', { name: /Redondeo.*\$ 1\.000/ })).toBeTruthy();
    expect(tab(/Márgenes rápidos.*300 a 25 %/)).toBeTruthy();
    expect(tab(/Sin uso.*60 min/)).toBeTruthy();
    expect(tab(/Tope de la sesión.*8 h/)).toBeTruthy();
    expect(tab(/Días del vínculo.*30 días/)).toBeTruthy();
    expect(tab(/Zona horaria.*14:30/)).toBeTruthy();
    expect(screen.getAllByText('Precios').length).toBeGreaterThan(0);
    expect(screen.queryByText(/hace falta «Cambiar los ajustes»/)).toBeNull();
  });

  it('administration-E02: sin el permiso, nada se toca y dice qué falta y quién lo tiene', async () => {
    const server = openAdministration({}, seller);
    expect(
      await screen.findByText(/hace falta «Cambiar los ajustes»: lo tiene Administrador/),
    ).toBeTruthy();
    expect((option(/\$ 500/) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(option(/\$ 500/));
    expect(server.bodies(saveOf('roundingStep'))).toEqual([]);
  });

  it('administration-E09, E10: guarda al cambiar, con «Deshacer», que es otro cambio', async () => {
    const server = openAdministration({
      [saveOf('sessionIdle')]: [ok(30), ok(60, 2)],
    });
    fireEvent.click(await screen.findByRole('tab', { name: /Sin uso/ }));
    fireEvent.click(option(/30 min/));
    await waitFor(() => expect(toast()).toContain('Sin uso: 30 min'));
    expect(server.bodies(saveOf('sessionIdle'))).toEqual([{ value: 30, version: 0 }]);
    expect(tab(/Sin uso.*30 min/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(tab(/Sin uso.*60 min/)).toBeTruthy());
    expect(server.bodies(saveOf('sessionIdle'))[1]).toEqual({ value: 60, version: 1 });
  });

  it('administration-E11: «Deshacer» se va a los 5 segundos', async () => {
    openAdministration({ [saveOf('sessionMax')]: ok(12) });
    fireEvent.click(await screen.findByRole('tab', { name: /Tope de la sesión/ }));
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.click(option(/12 h/));
    await vi.advanceTimersByTimeAsync(4900);
    expect(toast()).toContain('Deshacer');
    await vi.advanceTimersByTimeAsync(200);
    expect(toast()).toBe('');
  });

  it('administration-E12: si otro lo cambió recién, dice quién y muestra el valor de ahora', async () => {
    openAdministration({
      [saveOf('pairingDays')]: {
        status: 409,
        body: { error: 'setting-changed', value: 15, version: 1, by: 'Hugo Ferreyra' },
      },
    });
    fireEvent.click(await screen.findByRole('tab', { name: /Días del vínculo/ }));
    fireEvent.click(screen.getByRole('button', { name: '90' }));
    expect(
      await screen.findByText('Lo cambió Hugo Ferreyra recién: ahora vale 15 días.'),
    ).toBeTruthy();
    expect(tab(/Días del vínculo.*15 días/)).toBeTruthy();
  });

  it('administration-E25 a E28: los márgenes se guardan al salir y se ordenan; lo que no vale lo dice', async () => {
    const server = openAdministration({
      [saveOf('quickMargins')]: [
        ok([400, 300, 200, 100, 50]),
        { status: 400, body: { error: 'invalid-setting', key: 'quickMargins' } },
      ],
    });
    fireEvent.click(await screen.findByRole('tab', { name: /Márgenes rápidos/ }));
    const fifth = screen.getByLabelText('Margen de la tecla 5') as HTMLInputElement;
    fireEvent.keyDown(fifth, { key: 'a' });
    fifth.value = '400';
    fireEvent.keyDown(fifth, { key: 'Enter' });
    fireEvent.focusOut(fifth);
    await waitFor(() => expect(tab(/Márgenes rápidos.*400 a 50 %/)).toBeTruthy());
    expect(server.bodies(saveOf('quickMargins'))[0]).toEqual({
      value: [400, 300, 200, 100, 50],
      version: 0,
    });
    // Un repetido no sale: lo dice en el lugar.
    const first = screen.getByLabelText('Margen de la tecla 1') as HTMLInputElement;
    first.value = '300';
    fireEvent.focusOut(first);
    expect(await screen.findByText('Ya hay un margen rápido de 300 %.')).toBeTruthy();
    first.value = '0';
    fireEvent.focusOut(first);
    expect(await screen.findByText('Va un entero entre 1 y 10.000.')).toBeTruthy();
    // Lo mismo que tenía no se manda.
    const second = screen.getByLabelText('Margen de la tecla 2') as HTMLInputElement;
    fireEvent.focusOut(second);
    expect(server.bodies(saveOf('quickMargins'))).toHaveLength(1);
  });

  it('administration-E30, E31: la zona se ve, con la hora del negocio, y no se toca', async () => {
    openAdministration();
    fireEvent.click(await screen.findByRole('tab', { name: /Zona horaria/ }));
    expect(screen.getByText('Se cambia solo al instalar')).toBeTruthy();
    expect(screen.getByText('Buenos Aires')).toBeTruthy();
    expect(document.querySelector('.admin-clock-time')?.textContent).toBe('14:30');
  });

  it('administration-E32: los tiempos de la sesión, solo de la lista, con lo que harían', async () => {
    openAdministration();
    fireEvent.click(await screen.findByRole('tab', { name: /Tope de la sesión/ }));
    expect(
      screen
        .getAllByRole('button')
        .filter((one) => one.classList.contains('admin-option'))
        .map((one) => one.textContent),
    ).toEqual([
      '15 minMás corto',
      '30 minMás corto',
      'de arranque60 minAhora',
      '120 minMás largo',
      '4 ha las 12:00',
      'de arranque8 hAhora',
      '12 ha las 20:00',
      '24 ha las 8:00',
    ]);
    expect(screen.getByText(/la sesión se cierra a las 13:10/)).toBeTruthy();
    fireEvent.mouseEnter(option(/^120 min/));
    expect(screen.getByText(/volvió a las 13:30: sigue adentro/)).toBeTruthy();
    fireEvent.mouseEnter(option(/^30 min/));
    expect(screen.getByText(/la sesión se cierra a las 12:40/)).toBeTruthy();
    fireEvent.mouseLeave(option(/^30 min/));
    fireEvent.mouseEnter(option(/^24 h/));
    expect(screen.getByText(/el tope llega a las 8:00, después de cerrar/)).toBeTruthy();
    fireEvent.mouseEnter(option(/^4 h/));
    expect(screen.getByText(/a las 12:00 entra de nuevo/)).toBeTruthy();
  });

  it('administration-E38, E39: los días se escriben, se eligen o se deslizan', async () => {
    const server = openAdministration({
      [saveOf('pairingDays')]: [ok(20), ok(90, 2), ok(45, 3)],
    });
    fireEvent.click(await screen.findByRole('tab', { name: /Días del vínculo/ }));
    const field = screen.getByRole('textbox', { name: 'Días del vínculo' });
    const expires = () => document.querySelector('.admin-big b')?.textContent;
    const before = expires();
    fireEvent.input(field, { target: { value: '20' } });
    await waitFor(() => expect(expires()).not.toBe(before));
    fireEvent.keyDown(field, { key: 'Enter' });
    fireEvent.focusOut(field);
    await waitFor(() => expect(tab(/Días del vínculo.*20 días/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: '90' }));
    await waitFor(() => expect(tab(/Días del vínculo.*90 días/)).toBeTruthy());
    const slider = screen.getByRole('slider');
    fireEvent.input(slider, { target: { value: '45' } });
    fireEvent.pointerUp(slider);
    await waitFor(() => expect(tab(/Días del vínculo.*45 días/)).toBeTruthy());
    // Salir sin escribir no manda nada.
    fireEvent.focusOut(field);
    fireEvent.keyUp(slider);
    expect(server.bodies(saveOf('pairingDays'))).toHaveLength(3);
    fireEvent.input(field, { target: { value: '400' } });
    await waitFor(() => expect((field as HTMLInputElement).value).toBe('400'));
    fireEvent.focusOut(field);
    expect(await screen.findByText('Entre 1 y 365 días.')).toBeTruthy();
  });

  it('administration-E05: si perdió el permiso, no se guardó y lo dice', async () => {
    openAdministration({
      [saveOf('sessionMax')]: {
        status: 403,
        body: { error: 'forbidden', permission: 'settings.change' },
      },
    });
    fireEvent.click(await screen.findByRole('tab', { name: /Tope de la sesión/ }));
    fireEvent.click(option(/24 h/));
    expect(
      await screen.findByText('Ya no tenés «Cambiar los ajustes»: no se guardó.'),
    ).toBeTruthy();
  });

  it('un error inesperado lo dice en el lugar', async () => {
    openAdministration({ [saveOf('sessionMax')]: 'offline' });
    fireEvent.click(await screen.findByRole('tab', { name: /Tope de la sesión/ }));
    fireEvent.click(option(/24 h/));
    expect(await screen.findByText('No se pudo guardar. Probá de nuevo.')).toBeTruthy();
  });

  it('administration-E07: sin conexión y sin haberla visto, dice que hace falta, con «Reintentar»', async () => {
    online.set(false);
    const server = openAdministration({ '/api/administration': ['offline', { body: initial }] });
    online.set(false);
    expect(await screen.findByText('Hace falta conexión')).toBeTruthy();
    online.set(true);
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByRole('tab', { name: /Redondeo/ })).toBeTruthy();
    expect(server.sent.filter((one) => one.path === '/api/administration').length).toBeGreaterThan(
      1,
    );
  });

  it('administration-E06: sin conexión, gris con lo último que se vio, sin poder cambiar', async () => {
    openAdministration();
    expect(await screen.findByRole('tab', { name: /Redondeo/ })).toBeTruthy();
    online.set(false);
    await waitFor(() =>
      expect(
        screen.getByText(/Sin conexión: es lo último que se vio, a las \d+:\d\d/),
      ).toBeTruthy(),
    );
    expect((option(/\$ 500/) as HTMLButtonElement).disabled).toBe(true);
  });

  it('si no se pudieron traer con conexión, lo dice y deja reintentar', async () => {
    openAdministration({ '/api/administration': { status: 500, body: { error: 'unexpected' } } });
    expect(await screen.findByText('No se pudieron traer los ajustes.')).toBeTruthy();
  });
});
