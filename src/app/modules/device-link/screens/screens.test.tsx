// Las pantallas del vínculo (maqueta aprobada de 03): el indicador de cada estado, el detalle con su
// ruta, frase, tira, datos y botones, y desvincular con su confirmación.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startParts } from '../../../platform/server/start-parts.ts';
import { fakeRuntime, inApp, narrow } from '../../../testing/link-screens.ts';
import { pc, phone } from '../../../testing/pairing.ts';
import { Toasts } from '../../../ui/toast/Toast.tsx';
import { linkOver, linkRuntime, linkStrip } from '../current.ts';
import { detailOpen } from '../detail.ts';
import { frameLink } from '../frame-link.tsx';
import { createStrip } from '../strip.ts';
import { Layer as Over } from './Detail/Over.tsx';
import { PhoneIndicator, SideIndicator } from './Indicator/Indicator.tsx';

const hour = 3_600_000;
beforeEach(() => narrow(false));
afterEach(() => {
  linkRuntime.set(undefined);
  detailOpen.set(false);
  vi.unstubAllGlobals();
  vi.useRealTimers();
  localStorage.clear();
});

describe('lo que abre el indicador', () => {
  it('se ve con el detalle abierto, cuando el vínculo ya llegó', () => {
    fakeRuntime({ kind: 'unpaired' });
    const { container } = render(<frameLink.Over />);
    expect(container.innerHTML).toBe('');
    act(() => detailOpen.set(true));
    expect(container.innerHTML).toBe('');
    act(() => linkOver.set({ Over }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    act(() => detailOpen.set(false));
    expect(screen.queryByRole('dialog')).toBeNull();
    linkOver.set(undefined);
  });
});

describe('el indicador', () => {
  it('sin sesión no se ve; con el vínculo, el estado y con qué, y abre el detalle', () => {
    const empty = render(<SideIndicator />);
    expect(empty.container.innerHTML).toBe('');
    empty.unmount();
    const runtime = fakeRuntime({ kind: 'direct', pairing: pc, attempt: 'a' });
    render(<SideIndicator />);
    const button = screen.getByRole('button', { name: 'Directo, con otro. Ver el vínculo' });
    expect(button.dataset.tone).toBe('success');
    fireEvent.click(button);
    expect(detailOpen.get()).toBe(true);
    act(() => runtime.state.set({ kind: 'unpaired' }));
    expect(screen.getByText('Tocalo para vincular')).toBeTruthy();
    act(() => runtime.state.set({ kind: 'asleep' }));
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('en el celular, la pastilla dice el estado corto', () => {
    fakeRuntime({ kind: 'waiting', pairing: phone });
    render(<PhoneIndicator light={<span>luz</span>} offline={true} />);
    expect(screen.getByText('luz')).toBeTruthy();
    const pill = screen.getByRole('button', { name: /Esperando a la computadora/ });
    expect(pill.querySelector('.short')?.textContent).toBe('Esperando');
    fireEvent.click(pill);
    expect(detailOpen.get()).toBe(true);
    linkRuntime.set(undefined);
  });

  it('sin nada que mostrar del vínculo, la luz en su lugar; mientras se baja, lo que dijo /api/start', () => {
    render(<PhoneIndicator light={<span>luz</span>} offline={false} />);
    expect(screen.getByText('luz')).toBeTruthy();
    act(() => startParts.set({ pairing: null }));
    expect(screen.getByRole('button', { name: /Sin vincular/ })).toBeTruthy();
    act(() => startParts.set({ pairing: pc }));
    expect(screen.getByRole('button', { name: /Esperando al celular/ })).toBeTruthy();
    act(() => startParts.set({ pairing: { ...pc, paused: true } }));
    expect(screen.getByRole('button', { name: /Desconectado/ })).toBeTruthy();
    expect(screen.queryByText('luz')).toBeNull();
    act(() => startParts.set(undefined));
  });
});

describe('el detalle', () => {
  beforeEach(() => detailOpen.set(true));

  it('E26, E26b: directo: la ruta con la latencia, la tira del día, los datos y los botones', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    const start = new Date(2026, 10, 4, 8).getTime();
    vi.setSystemTime(start);
    const strip = createStrip({ owner: 'ana', now: () => Date.now() });
    strip.mark('direct');
    vi.setSystemTime(start + 2 * hour);
    strip.mark('relayed');
    vi.setSystemTime(start + 2.5 * hour);
    linkStrip.set({ of: () => strip });
    const lasting = { ...pc, expiresAt: start + 30 * 24 * hour };
    const runtime = fakeRuntime({ kind: 'direct', pairing: lasting, attempt: 'a' });
    render(<Over />);
    expect(screen.getByRole('dialog', { name: 'El vínculo con tu celular' })).toBeTruthy();
    expect(await screen.findByText('12 ms')).toBeTruthy();
    expect(screen.getByText('2 h 30 min')).toBeTruthy();
    expect(screen.getByText('80 % directo')).toBeTruthy();
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(
      /directo 2 h, por el servidor 30 min/,
    );
    expect(screen.getByText('9:00')).toBeTruthy();
    expect(screen.getByText('30 de 30 días')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    fireEvent.click(screen.getByRole('button', { name: /Desconectar/ }));
    await waitFor(() =>
      expect(runtime.dispatch).toHaveBeenCalledWith({ type: 'pause', from: 'here' }),
    );
    fireEvent.click(screen.getByRole('button', { name: /Cerrar/ }));
    expect(detailOpen.get()).toBe(false);
    linkStrip.set({});
  });

  it('por el servidor ofrece probar el directo; probando espera, y si no se pudo lo dice en lugar de la frase', async () => {
    const runtime = fakeRuntime({ kind: 'relayed', pairing: pc, attempt: 'a' });
    render(<Over />);
    expect(screen.getByText(/la red no deja la conexión directa\. Gasta/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Probar conexión directa/ }));
    await waitFor(() => expect(runtime.dispatch).toHaveBeenCalledWith({ type: 'probe' }));
    act(() => runtime.state.set({ kind: 'relayed', pairing: pc, attempt: 'a', probe: 'trying' }));
    expect((screen.getByRole('button', { name: /Probando/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    act(() => runtime.state.set({ kind: 'relayed', pairing: pc, attempt: 'a', probe: 'failed' }));
    expect(screen.getByRole('status').textContent).toMatch(/No se pudo/);
    render(<Toasts />);
    act(() => runtime.state.set({ kind: 'relayed', pairing: pc, attempt: 'a', probe: 'trying' }));
    act(() => runtime.state.set({ kind: 'direct', pairing: pc, attempt: 'a' }));
    expect(screen.getAllByText(/Ahora van directo por el Wi-Fi/).length).toBeGreaterThan(0);
  });

  it('desconectado ofrece reconectar; sin vincular, los pasos; esperando y sin internet, su frase', async () => {
    const runtime = fakeRuntime({ kind: 'paused', pairing: pc });
    render(<Over />);
    fireEvent.click(screen.getByRole('button', { name: /Reconectar/ }));
    await waitFor(() =>
      expect(runtime.dispatch).toHaveBeenCalledWith({ type: 'resume', from: 'here' }),
    );
    act(() => runtime.state.set({ kind: 'unpaired' }));
    expect(screen.getByRole('dialog', { name: 'Trabajar con el celular' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    // Vincular muestra el código (el canal no contesta en la prueba) y Volver, el detalle.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
    fireEvent.click(screen.getByRole('button', { name: /Vincular el celular/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Volver/ }));
    act(() => runtime.state.set({ kind: 'waiting', pairing: pc }));
    expect(screen.getAllByText('Esperando al celular').length).toBeGreaterThan(0);
    act(() => runtime.state.set({ kind: 'offline', pairing: pc }));
    expect(screen.getAllByText(/no hay internet/).length).toBeGreaterThan(0);
  });

  it('desvincular pregunta; cancelar no hace nada y confirmar lo termina', async () => {
    const runtime = fakeRuntime({ kind: 'direct', pairing: pc, attempt: 'a' });
    const fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', fetch);
    render(<Over />, inApp());
    fireEvent.click(screen.getByRole('button', { name: /Desvincular/ }));
    expect(screen.getByRole('alertdialog', { name: '¿Desvincular el celular?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/ }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: /Desvincular/ }));
    const dialog = screen.getByRole('alertdialog');
    fireEvent.click(dialog.querySelector('[data-primary]') as HTMLElement);
    await waitFor(() =>
      expect(runtime.dispatch).toHaveBeenCalledWith({ type: 'serverSaid', pairing: null }),
    );
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('si desvincular no llega al servidor, la pregunta sigue', async () => {
    fakeRuntime({ kind: 'direct', pairing: pc, attempt: 'a' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('sin red'))),
    );
    render(<Over />);
    fireEvent.click(screen.getByRole('button', { name: /Desvincular/ }));
    fireEvent.click(screen.getByRole('alertdialog').querySelector('[data-primary]') as HTMLElement);
    await new Promise((settled) => setTimeout(settled, 20));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
  });

  it('sin el vínculo, o sin sesión, no muestra nada', () => {
    const { container } = render(<Over />);
    expect(container.innerHTML).toBe('');
    fakeRuntime({ kind: 'asleep' });
    const again = render(<Over />);
    expect(again.container.innerHTML).toBe('');
  });
});
