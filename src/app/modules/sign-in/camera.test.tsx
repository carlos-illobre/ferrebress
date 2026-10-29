import { act, render } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';
import { scan } from './codes/scanner.ts';
import { Camera } from './index.ts';

vi.mock('./codes/scanner.ts', () => ({ scan: vi.fn(), scanEveryMs: 250 }));

it('el botón atrás del celular cierra la cámara y vuelve a la entrada; cerrada con la ×, saca su paso', async () => {
  vi.mocked(scan).mockResolvedValue(vi.fn());
  const back = vi.spyOn(history, 'back').mockImplementation(() => {});
  const push = vi.spyOn(history, 'pushState');
  const onClose = vi.fn();
  const closed = render(<Camera onCode={vi.fn()} onClose={onClose} />);
  await act(async () => {});
  expect(push).toHaveBeenCalledOnce();
  act(() => closed.unmount());
  expect(back).toHaveBeenCalledOnce();
  const backed = render(<Camera onCode={vi.fn()} onClose={onClose} />);
  await act(async () => {});
  expect(onClose).not.toHaveBeenCalled();
  // El botón atrás: el historial vuelve al paso anterior y avisa.
  history.replaceState(null, '');
  dispatchEvent(new PopStateEvent('popstate'));
  expect(onClose).toHaveBeenCalledOnce();
  act(() => backed.unmount());
  expect(back).toHaveBeenCalledOnce();
});
