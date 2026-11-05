// Las pantallas de vincular: el código de la computadora, que se renueva y avisa al leerse, y el
// celular que lee, con la pregunta de reemplazar y lo que no vincula.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TopicHandler } from '../../../platform/realtime/demand.ts';
import { createStore } from '../../../platform/store.ts';
import { pairingView, pc } from '../../../testing/pairing.ts';
import { linkRuntime } from '../current.ts';
import { detailOpen, reading } from '../detail.ts';
import type { PairingState } from '../machine/types.ts';
import type { Runtime } from '../runtime.ts';
import { deviceLinkSettings } from '../settings.ts';
import { Code } from './Code/Code.tsx';
import { Layer } from './Detail/Over.tsx';
import { Read } from './Read/Read.tsx';

let topic: TopicHandler | undefined;
vi.mock('../../../platform/realtime/use-topic.ts', () => ({
  useTopic: (_token: string, handler: TopicHandler) => {
    topic = handler;
  },
}));
let onText: (text: string) => void = () => undefined;
vi.mock('../../../platform/camera/scanner.ts', () => ({
  scan: vi.fn(async (_video: unknown, read: (text: string) => void) => {
    onText = read;
    return () => undefined;
  }),
}));

const replies = (...bodies: [number, unknown][]) => {
  const fetch = vi.fn();
  for (const [status, body] of bodies)
    fetch.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};
function fakeRuntime(state: PairingState) {
  const runtime = {
    state: createStore(state),
    dispatch: vi.fn(),
    roundTripMs: vi.fn(async () => 8),
  };
  linkRuntime.set(runtime as unknown as Runtime);
  return runtime;
}

const inApp = () => {
  const app = document.getElementById('app') ?? document.createElement('div');
  app.id = 'app';
  document.body.append(app);
  return { container: app.appendChild(document.createElement('div')) };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('el código de la computadora', () => {
  it('muestra el código, cuánto le queda y, al leerse, avisa el vínculo', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'Date'] });
    const onPaired = vi.fn();
    const onBack = vi.fn();
    render(<Code other="Chrome en Android" onPaired={onPaired} onBack={onBack} />);
    expect(screen.getByText('Se renueva en 1:00')).toBeTruthy();
    expect(screen.getByText(/Ya está vinculada con Chrome en Android/)).toBeTruthy();
    act(() => topic?.onEvent({ code: 'abc' }));
    await waitFor(() => expect(document.querySelector('.qr-box > svg path')).toBeTruthy());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Se renueva en 0:55')).toBeTruthy();
    // Lo que no tiene su forma no hace nada.
    act(() => topic?.onEvent({ code: 7, paired: { id: 'roto' } }));
    act(() => topic?.onEvent(null));
    expect(onPaired).not.toHaveBeenCalled();
    act(() => topic?.onEvent({ paired: pc }));
    expect(onPaired).toHaveBeenCalledWith(pc);
    expect(document.querySelector('.qr-box.read')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Volver/ }));
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });
});

describe('vincular desde el detalle', () => {
  it('en la computadora, el código; al leerse se vincula y vuelve al detalle', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const runtime = fakeRuntime({ kind: 'unpaired' });
    detailOpen.set(true);
    render(<Layer />);
    fireEvent.click(screen.getByRole('button', { name: /Vincular el celular/ }));
    await waitFor(() => expect(screen.getByText('Sirve una vez')).toBeTruthy());
    act(() => topic?.onEvent({ paired: pc }));
    expect(runtime.dispatch).toHaveBeenCalledWith({ type: 'serverSaid', pairing: pc });
    act(() => {
      vi.advanceTimersByTime(deviceLinkSettings.doneMs);
    });
    expect(screen.queryByText('Sirve una vez')).toBeNull();
    detailOpen.set(false);
    linkRuntime.set(undefined);
  });

  it('en el celular, la cámara; al vincular se cierra, y cerrar también', async () => {
    replies([200, { pairing: pc }]);
    const runtime = fakeRuntime({ kind: 'direct', pairing: pairingView('phone'), attempt: 'a' });
    detailOpen.set(true);
    render(<Layer />);
    fireEvent.click(screen.getByRole('button', { name: /Leer el código/ }));
    expect(detailOpen.get()).toBe(false);
    await waitFor(() => expect(reading.get()).toEqual({}));
    act(() => onText(`${location.origin}/pair#abc`));
    await waitFor(() =>
      expect(runtime.dispatch).toHaveBeenCalledWith({ type: 'serverSaid', pairing: pc }),
    );
    expect(reading.get()).toBeUndefined();
    act(() => reading.set({}));
    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar' }));
    expect(reading.get()).toBeUndefined();
    linkRuntime.set(undefined);
  });
});

describe('el celular que lee el código', () => {
  it('lee con la cámara, ignora lo que no es un código de vincular y vincula', async () => {
    replies([200, { pairing: pc }]);
    const onPaired = vi.fn();
    render(<Read code={undefined} onPaired={onPaired} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Leer el código' })).toBeTruthy();
    await waitFor(() => expect(onText).toBeTruthy());
    act(() => onText('https://otro.com/x'));
    act(() => onText(`${location.origin}/pair#abc`));
    await waitFor(() => expect(onPaired).toHaveBeenCalledWith(pc));
  });

  it('si ya estaba vinculado pregunta; al aceptar vincula, y cancelar cierra', async () => {
    replies(
      [200, { ticket: 't', replaces: { phone: 'Chrome en Windows' } }],
      [200, { pairing: pc }],
    );
    const onPaired = vi.fn();
    render(<Read code="abc" onPaired={onPaired} onClose={vi.fn()} />, inApp());
    expect(
      await screen.findByRole('alertdialog', {
        name: 'Este celular está vinculado a Chrome en Windows. ¿Reemplazar?',
      }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Reemplazar/ }));
    await waitFor(() => expect(onPaired).toHaveBeenCalledWith(pc));
  });

  it('la otra computadora con otro celular también pregunta, y cancelar no vincula', async () => {
    replies([200, { ticket: 't', replaces: { computer: true } }]);
    const onClose = vi.fn();
    render(<Read code="abc" onPaired={vi.fn()} onClose={onClose} />, inApp());
    await screen.findByRole('alertdialog', {
      name: /Esta computadora está vinculada a otro celular/,
    });
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('un código vencido ofrece leer el nuevo; otra cuenta, sin internet o un error, solo entendido', async () => {
    replies([410, { error: 'code-expired' }]);
    const { unmount } = render(<Read code="abc" onPaired={vi.fn()} onClose={vi.fn()} />, inApp());
    await screen.findByRole('alertdialog', { name: 'Este código venció' });
    fireEvent.click(screen.getByRole('button', { name: /Leer el nuevo/ }));
    expect(await screen.findByRole('dialog', { name: 'Leer el código' })).toBeTruthy();
    unmount();
    for (const [status, error, title] of [
      [403, 'other-account', 'Este código es de otra cuenta'],
      [500, 'internal', 'No se pudo vincular'],
    ] as const) {
      replies([status, { error }]);
      const onClose = vi.fn();
      const again = render(<Read code="abc" onPaired={vi.fn()} onClose={onClose} />, inApp());
      await screen.findByRole('alertdialog', { name: title });
      fireEvent.click(screen.getByRole('button', { name: /Entendido/ }));
      await waitFor(() => expect(onClose).toHaveBeenCalled());
      again.unmount();
    }
  });
});
