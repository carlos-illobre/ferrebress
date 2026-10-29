// Cuando el código del manual no se puede bajar (diseño del manual, § 4): con red es una versión vieja
// y se pide actualizar; sin red, lo dice y deja volver.
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate } from '../../platform/router.ts';
import { updateRequired } from '../../platform/server/api.ts';
import { ManualSlot } from './index.ts';

// El código del manual que no llega: el import() de la pantalla falla.
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

// Sin red, la pantalla del lugar del manual muestra «Volver» sin el código del manual: alcanza para
// ver a dónde vuelve.
async function backButton(state: unknown) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  navigate('/manual', { replace: true, state });
  const { unmount } = render(<ManualSlot testing={false} />);
  const button = await screen.findByRole('button');
  return { label: button.textContent, button, unmount };
}

describe('a dónde vuelve «Volver»', () => {
  afterEach(() => vi.restoreAllMocks());

  it('a un lugar de una lista cerrada: la entrada, una parte del menú, Más o Ferrebress', async () => {
    const places = [
      [{ from: 'entrance' }, 'Volver a la entrada'],
      [{ from: 'sell' }, 'Volver a Vender'],
      [{ from: 'more' }, 'Volver a Más'],
      [{ from: 'app' }, 'Volver a Ferrebress'],
    ] as const;
    for (const [state, label] of places) {
      const shown = await backButton(state);
      expect(shown.label).toBe(label);
      shown.unmount();
    }
  });

  it('lo que no está en la lista, o nada, lleva al principio: nunca a una dirección de afuera', async () => {
    // Sin `from` (`{}`: un reemplazo de la dirección con `null` conserva el estado anterior).
    const strange = [{}, { from: 'https://otro.sitio' }, { from: 3 }];
    for (const state of [...strange, { from: 'constructor' }, { from: '__proto__' }]) {
      const shown = await backButton(state);
      expect(shown.label).toBe('Ir a Ferrebress');
      fireEvent.click(shown.button);
      expect(location.pathname).toBe('/');
      shown.unmount();
    }
  });
});
