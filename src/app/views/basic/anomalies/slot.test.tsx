// El lugar de Anomalías: baja la pantalla y la muestra; sin red y sin poder bajarla, lo dice.
import { render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('el lugar de Anomalías', () => {
  afterEach(() => {
    vi.doUnmock('./Anomalies.tsx');
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('con el código bajado, muestra la pantalla', async () => {
    vi.doMock('./Anomalies.tsx', () => ({ Anomalies: () => <p>las anomalías</p> }));
    const { AnomaliesSlot } = await import('./Slot.tsx');
    render(<AnomaliesSlot />);
    expect(await screen.findByText('las anomalías')).toBeTruthy();
  });

  it('sin red, dice «Sin conexión»', async () => {
    vi.doMock('./Anomalies.tsx', () => Promise.reject(new Error('no está')));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { AnomaliesSlot } = await import('./Slot.tsx');
    render(<AnomaliesSlot />);
    expect((await screen.findByRole('status')).textContent).toContain('Sin conexión');
  });
});
