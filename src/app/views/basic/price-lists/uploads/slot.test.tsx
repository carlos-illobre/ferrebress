// El lugar del panel de las listas que se suben: sin ninguna, nada; con alguna, baja el panel.
import { render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('el lugar del panel de las listas que se suben', () => {
  afterEach(() => {
    vi.doUnmock('./Panel.tsx');
    vi.resetModules();
  });

  it('sin listas no hay nada; con una, el panel', async () => {
    vi.doMock('./Panel.tsx', () => ({ UploadsPanel: () => <p>el panel</p> }));
    const { UploadsSlot } = await import('./Slot.tsx');
    const { uploads } = await import('../../../../modules/price-lists/uploads/store.ts');
    const { container } = render(<UploadsSlot />);
    expect(container.innerHTML).toBe('');
    uploads.set([
      { key: 'k', fileName: 'a.csv', bytes: 1, scope: 'full', phase: 'failed', sent: 0 },
    ]);
    expect(await screen.findByText('el panel')).toBeTruthy();
    uploads.set([]);
  });

  it('sin poder bajar el panel, no muestra nada', async () => {
    vi.doMock('./Panel.tsx', () => Promise.reject(new Error('no está')));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { UploadsSlot } = await import('./Slot.tsx');
    const { uploads } = await import('../../../../modules/price-lists/uploads/store.ts');
    uploads.set([
      { key: 'k', fileName: 'a.csv', bytes: 1, scope: 'full', phase: 'failed', sent: 0 },
    ]);
    const { container } = render(<UploadsSlot />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container.innerHTML).toBe('');
    uploads.set([]);
    vi.restoreAllMocks();
  });
});
