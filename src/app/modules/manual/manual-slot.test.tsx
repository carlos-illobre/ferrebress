// Cuando el código del manual no se puede bajar (diseño del manual, § 4): con red es una versión vieja
// y se pide actualizar; sin red, lo dice y deja volver.
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate } from '../../platform/router.ts';
import { updateRequired } from '../../platform/server/api.ts';
import { backOf } from './back.ts';
import { ManualSlot } from './index.ts';

vi.mock('./screens/Manual/Manual.tsx', () => Promise.reject(new Error('no está')));

describe('el lugar del manual', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    updateRequired.set(false);
  });

  it('con red, un código que no se puede bajar pide actualizar', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    render(<ManualSlot testing={false} />);
    await waitFor(() => expect(updateRequired.get()).toBe(true));
  });

  it('sin red, dice que necesita internet y deja volver', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    navigate('/manual', { state: { from: 'entrance' } });
    const go = vi.spyOn(history, 'go').mockImplementation(() => undefined);
    render(<ManualSlot testing={false} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Volver a la entrada' }));
    expect(screen.getByRole('status').textContent).toContain('El manual necesita internet.');
    expect(go).toHaveBeenCalledWith(-1);
  });
});

describe('a dónde vuelve «Volver»', () => {
  it('de una lista cerrada: la entrada, una parte o Más; con las hojas abiertas, más pasos atrás', () => {
    const go = vi.spyOn(history, 'go').mockImplementation(() => undefined);
    expect(backOf({ from: 'entrance' })).toMatchObject({
      long: 'Volver a la entrada',
      short: 'Entrada',
    });
    expect(backOf({ from: 'sell' })).toMatchObject({ long: 'Volver a Vender', short: 'Vender' });
    const more = backOf({ from: 'more' });
    expect(more).toMatchObject({ long: 'Volver a Más', short: 'Más' });
    more.go(2);
    expect(go).toHaveBeenCalledWith(-3);
  });

  it('lo que no está en la lista, o nada, lleva al principio: nunca a una dirección de afuera', () => {
    for (const state of [null, { from: 'https://otro.sitio' }, { from: 3 }]) {
      navigate('/manual', { replace: true });
      const back = backOf(state);
      expect(back.long).toBe('Ir a Ferrebress');
      back.go(0);
      expect(location.pathname).toBe('/');
    }
  });
});
