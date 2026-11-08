// El redondeo en la pantalla de Administración (06 · R3.4, R3.5): cuántos precios cambian, la
// confirmación, cancelar y el recálculo que falla.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { openAdministration, option, saveOf, tab, toast } from './administration-test-kit.tsx';

const ok = (value: unknown, version = 1) => ({ body: { value, version } });

describe('Administración, el redondeo', () => {
  it('administration-E18, E19: el redondeo dice cuántos precios cambian y se confirma', async () => {
    const server = openAdministration({
      '/api/administration/rounding': {
        body: {
          total: 3486,
          changes: { 500: 1650 },
          examples: [{ name: 'Martillo', calculated: 15_001 }],
        },
      },
      [saveOf('roundingStep')]: [
        { status: 409, body: { error: 'confirm-prices', prices: 1650 } },
        ok(500),
      ],
    });
    fireEvent.mouseEnter(await screen.findByRole('button', { name: /\$ 500.*1\.650/ }));
    expect(screen.getByText('Cambian 1.650')).toBeTruthy();
    fireEvent.click(option(/\$ 500/));
    const confirm = await screen.findByRole('button', { name: /Cambiar 1\.650 precios/ });
    expect(screen.getByText('1.650 de 3.486 precios cambian')).toBeTruthy();
    fireEvent.click(confirm);
    await waitFor(() => expect(tab(/Redondeo.*\$ 500/)).toBeTruthy());
    expect(server.bodies(saveOf('roundingStep'))[1]).toEqual({
      value: 500,
      version: 0,
      confirmed: 1650,
    });
    // administration-E23: el redondeo no lleva «Deshacer».
    expect(toast()).toContain('Redondeo: $ 500');
    expect(screen.queryByRole('button', { name: 'Deshacer' })).toBeNull();
  });

  it('administration-E20: cancelar no cambia nada', async () => {
    openAdministration({
      [saveOf('roundingStep')]: { status: 409, body: { error: 'confirm-prices', prices: 12 } },
    });
    fireEvent.click(await screen.findByRole('button', { name: /\$ 5\.000/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Cancelar/ }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(tab(/Redondeo.*\$ 1\.000/)).toBeTruthy();
  });

  it('administration-E22: si el recálculo falla, lo dice y deja reintentar', async () => {
    openAdministration({
      [saveOf('roundingStep')]: [
        { status: 409, body: { error: 'confirm-prices', prices: 12 } },
        { status: 503, body: { error: 'recalc-failed' } },
        ok(0),
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: /Sin/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Cambiar 12 precios/ }));
    expect(await screen.findByText('No se pudo recalcular: no cambió ningún precio.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    await waitFor(() => expect(tab(/Redondeo.*Sin redondeo/)).toBeTruthy());
  });

  it('administration-E21: sin precios, muestra el ejemplo de la regla y guarda sin preguntar', async () => {
    openAdministration({ [saveOf('roundingStep')]: ok(100) });
    expect(await screen.findByText('Todavía no hay precios: este es un ejemplo.')).toBeTruthy();
    fireEvent.mouseEnter(option(/\$ 50\b/));
    expect(screen.getByText('$ 15.050')).toBeTruthy();
    fireEvent.click(option(/\$ 100\b/));
    await waitFor(() => expect(tab(/Redondeo.*\$ 100/)).toBeTruthy());
  });
});
