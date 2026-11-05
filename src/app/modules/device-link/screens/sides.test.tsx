// Las pantallas del vínculo según el lado y el ancho (maqueta aprobada de 03): en el celular, una hoja
// con los textos cortos; en una computadora angosta, también una hoja, con el código; y los textos que
// hablan desde un lado, por el lado.
import { act, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeRuntime, narrow } from '../../../testing/link-screens.ts';
import { pairingView, pc } from '../../../testing/pairing.ts';
import { Toasts } from '../../../ui/toast/Toast.tsx';
import { linkRuntime } from '../current.ts';
import { detailOpen } from '../detail.ts';
import { Layer as Over } from './Detail/Over.tsx';

beforeEach(() => {
  narrow(false);
  detailOpen.set(true);
});
afterEach(() => {
  linkRuntime.set(undefined);
  detailOpen.set(false);
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('el detalle en cada lado', () => {
  it('en el celular es una hoja, con los textos cortos y «Leer el código»', () => {
    narrow(true);
    fakeRuntime({ kind: 'direct', pairing: pairingView('phone'), attempt: 'a' });
    render(<Over />);
    expect(screen.getByRole('dialog', { name: 'Con la computadora' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Leer el código/ })).toBeTruthy();
    fireEvent.click(document.querySelector('.sheet-scrim') as HTMLElement);
    expect(detailOpen.get()).toBe(false);
  });

  it('9.1: en una computadora angosta, el código va en la hoja', async () => {
    narrow(true);
    fakeRuntime({ kind: 'unpaired' });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    render(<Over />);
    fireEvent.click(screen.getByRole('button', { name: /Vincular el celular/ }));
    expect(await screen.findByRole('button', { name: /Volver/ })).toBeTruthy();
    expect(document.querySelector('.link-sheet')).toBeTruthy();
  });

  it('9.2: la frase que habla desde un lado se elige por el lado, no por el ancho', () => {
    narrow(false);
    const runtime = fakeRuntime({ kind: 'waiting', pairing: pairingView('phone') });
    render(<Over />);
    expect(screen.getByText(/La computadora no tiene Ferrebress abierto/)).toBeTruthy();
    narrow(true);
    act(() => runtime.state.set({ kind: 'waiting', pairing: pc }));
    expect(screen.getByText(/El celular no tiene Ferrebress abierto/)).toBeTruthy();
  });

  it('E25: en el celular sin vincular, el título es el de trabajar con la compu, con sus pasos', () => {
    narrow(true);
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Android',
      userAgentData: { mobile: true },
    });
    fakeRuntime({ kind: 'unpaired' });
    render(<Over />);
    expect(screen.getByRole('dialog', { name: 'Trabajar con la compu' })).toBeTruthy();
    expect(screen.getByText('En la computadora, tocá el indicador y leé el código.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Leer el código/ })).toBeTruthy();
  });

  it('«Reconectados» dice lo de su lado', () => {
    narrow(true);
    fakeRuntime({ kind: 'paused', pairing: pairingView('phone') });
    render(<Toasts />);
    render(<Over />);
    fireEvent.click(screen.getByRole('button', { name: /Reconectar/ }));
    expect(screen.getByText('Reconectados: fuiste a la pantalla de la compu')).toBeTruthy();
  });
});
