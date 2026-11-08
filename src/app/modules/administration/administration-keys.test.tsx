// Administración con el teclado (06 · R1.8): la tecla del ajuste lleva a sus opciones y ← → las
// recorren sin elegir.
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { openAdministration, option, saveOf } from './administration-test-kit.tsx';

describe('Administración con el teclado', () => {
  it('R1.8: la tecla del ajuste lleva a su opción elegida', async () => {
    openAdministration();
    fireEvent.click(await screen.findByRole('tab', { name: /Sin uso/ }));
    await waitFor(() => expect(document.activeElement?.className).toBe('admin-option'));
    expect(document.activeElement?.textContent).toContain('60 min');
    fireEvent.click(screen.getByRole('tab', { name: /Días del vínculo/ }));
    await waitFor(() => expect(document.activeElement?.tagName).toBe('INPUT'));
  });

  it('R1.8: si la pantalla se cierra antes, el cursor no va a ningún lado', async () => {
    openAdministration();
    fireEvent.click(await screen.findByRole('tab', { name: /Sin uso/ }));
    cleanup();
    await new Promise((settled) => setTimeout(settled, 250));
    expect(document.activeElement?.tagName).toBe('BODY');
  });

  it('R1.8: ← y → recorren las opciones sin elegir', async () => {
    const server = openAdministration();
    const now = await screen.findByRole('button', { name: /\$ 1\.000/ });
    now.focus();
    fireEvent.keyDown(now, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(option(/\$ 5\.000/));
    fireEvent.keyDown(option(/\$ 5\.000/), { key: 'ArrowRight' });
    fireEvent.keyDown(option(/\$ 5\.000/), { key: 'ArrowLeft' });
    fireEvent.keyDown(option(/\$ 1\.000/), { key: 'Tab' });
    expect(document.activeElement).toBe(option(/\$ 1\.000/));
    fireEvent.click(option(/\$ 1\.000/));
    expect(server.bodies(saveOf('roundingStep'))).toEqual([]);
  });
});
