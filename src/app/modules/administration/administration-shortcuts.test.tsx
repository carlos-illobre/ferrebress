// Administración con los atajos (06 · R1.8, 00 · R2.8): la tecla de cada ajuste, «Reintentar» y la
// confirmación del redondeo, con las teclas del mapa (keyboard/shortcuts/keymap.ts).
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { online } from '../../platform/server/api.ts';
import { startKeyboard } from '../../testing/keyboard.ts';
import { openAdministration, saveOf, tab } from '../../views/basic/administration/kit.tsx';
import { keyShown } from '../../views/basic/kit.ts';

const alt = (letter: string) =>
  fireEvent.keyDown(window, { key: letter, code: `Key${letter}`, altKey: true });
const ok = (value: unknown, version: number) => ({ body: { value, version } });

describe('Administración con los atajos', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('app-E12: la tecla de cada ajuste lo elige, y cada uno muestra su tecla', async () => {
    openAdministration();
    await screen.findByRole('tab', { name: /Márgenes/ });
    for (const [letter, name] of [
      ['M', /Márgenes/],
      ['Z', /Zona/],
      ['S', /Sin uso/],
      ['T', /Tope/],
      ['V', /Días del vínculo/],
      ['R', /Redondeo/],
    ] as const) {
      alt(letter);
      await waitFor(() => expect(tab(name).getAttribute('aria-selected')).toBe('true'));
      expect(keyShown(tab(name))).toBe(letter);
    }
  });

  it('app-E12: sin conexión, Alt R reintenta en lugar de elegir el redondeo', async () => {
    const server = openAdministration();
    await screen.findByRole('tab', { name: /Márgenes/ });
    alt('M');
    online.set(false);
    await screen.findByRole('button', { name: /Reintentar/ });
    const before = server.sent.filter((s) => s.path === '/api/administration').length;
    alt('R');
    await waitFor(() =>
      expect(server.sent.filter((s) => s.path === '/api/administration').length).toBeGreaterThan(
        before,
      ),
    );
    expect(tab(/Márgenes/).getAttribute('aria-selected')).toBe('true');
  });

  it('administration-E18, E20: en la confirmación, Alt C cancela y Alt P cambia los precios', async () => {
    const server = openAdministration({
      [saveOf('roundingStep')]: [
        { status: 409, body: { error: 'confirm-prices', prices: 12 } },
        { status: 409, body: { error: 'confirm-prices', prices: 12 } },
        ok(5000, 1),
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: /\$ 5\.000/ }));
    await screen.findByRole('button', { name: /Cambiar 12 precios/ });
    alt('Z');
    expect(tab(/Redondeo/).getAttribute('aria-selected')).toBe('true');
    alt('C');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: /\$ 5\.000/ }));
    await screen.findByRole('button', { name: /Cambiar 12 precios/ });
    alt('P');
    await waitFor(() => expect(server.bodies(saveOf('roundingStep')).length).toBe(3));
  });

  it('administration-E22: si el recálculo falla, Alt R reintenta y Alt A lo deja para después', async () => {
    const server = openAdministration({
      [saveOf('roundingStep')]: [
        { status: 409, body: { error: 'confirm-prices', prices: 12 } },
        { status: 503, body: { error: 'recalc-failed' } },
        { status: 503, body: { error: 'recalc-failed' } },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: /\$ 5\.000/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Cambiar 12 precios/ }));
    await screen.findByText('No se pudo recalcular: no cambió ningún precio.');
    alt('P');
    alt('R');
    await waitFor(() => expect(server.bodies(saveOf('roundingStep')).length).toBe(3));
    alt('C');
    expect(screen.queryByRole('alertdialog')).toBeTruthy();
    alt('A');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });
});
