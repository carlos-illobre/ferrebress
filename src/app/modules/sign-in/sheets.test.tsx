import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '../../platform/device/storage.ts';
import { fakeServer } from '../../testing/fake-server.ts';
import { scan } from './codes/scanner.ts';
import { Camera, CodeSheet, OfferSheet, usePhoneCode } from './index.ts';
import { hasPasskey, offerPasskey, person, wasOffered } from './session.ts';
import { ana, fakePasskeys } from './sign-in-test-kit.ts';

vi.mock('./codes/scanner.ts', () => ({ scan: vi.fn(), scanEveryMs: 250 }));

const reading = {
  secret: 's',
  computer: { label: 'Chrome en Windows' },
  holdSeconds: 120,
  authentication: {},
};

function Code({ code }: { code: string }) {
  const phone = usePhoneCode();
  return (
    <>
      <button type="button" onClick={() => void phone.scanned(code)}>
        leer
      </button>
      <CodeSheet code={phone} />
    </>
  );
}

describe('las hojas del celular', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(ana);
    offerPasskey.set(false);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sign-in-E13, R2.11: pregunta qué computadora pide entrar; con la huella, se cierra sin avisar', async () => {
    fakePasskeys();
    fakeServer({ '/api/sign-in/codes/read': { body: reading }, '/api/sign-in/codes/approve': {} });
    render(<Code code="c1" />);
    fireEvent.click(screen.getByText('leer'));
    expect(await screen.findByText('¿Entrar en Chrome en Windows?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, entrar con la huella' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('sign-in-E16b: si hay que vincular la huella, lo dice con el correo de la cuenta', async () => {
    fakeServer({
      '/api/sign-in/codes/read': { body: { ...reading, registration: {} } },
      '/api/sign-in/codes/cancel': {},
    });
    render(<Code code="c1" />);
    fireEvent.click(screen.getByText('leer'));
    expect(await screen.findByText('Vinculá tu huella para entrar a la computadora')).toBeTruthy();
    expect(screen.getByText(/ana@example.com/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'No soy yo, cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('sign-in-E03, R2.9: al aprobar, una cuenta que no puede entrar y los intentos de más dicen lo mismo que la entrada', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fakePasskeys();
    fakeServer({
      '/api/sign-in/codes/read': { body: reading },
      '/api/sign-in/codes/approve': [
        { status: 401, body: { error: 'not-authorized' } },
        { status: 429, body: { error: 'too-many-attempts', retryAfterSeconds: 2 } },
      ],
    });
    render(<Code code="c1" />);
    for (const expected of [/no está autorizada/, 'Demasiados intentos seguidos']) {
      fireEvent.click(screen.getByText('leer'));
      fireEvent.click(await screen.findByRole('button', { name: 'Sí, entrar con la huella' }));
      expect(await screen.findByText(expected)).toBeTruthy();
      if (expected !== 'Demasiados intentos seguidos')
        fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    }
    expect(screen.getByText('0:02')).toBeTruthy();
    await act(async () => void (await vi.advanceTimersByTimeAsync(1000)));
    expect(screen.getByText('0:01')).toBeTruthy();
    await act(async () => void (await vi.advanceTimersByTimeAsync(1000)));
    expect(screen.getByText('0:00')).toBeTruthy();
    vi.useRealTimers();
  });

  it('sign-in-E13b, E14, E16c: otra red, código vencido o sin huella, cada uno con su texto', async () => {
    fakeServer({
      '/api/sign-in/codes/read': [
        { status: 409, body: { error: 'other-network' } },
        { status: 410, body: { error: 'code-used' } },
      ],
    });
    render(<Code code="c1" />);
    fireEvent.click(screen.getByText('leer'));
    expect(
      await screen.findByText('Para entrar a la computadora, conectá este celular al mismo Wi-Fi'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    fireEvent.click(screen.getByText('leer'));
    expect(await screen.findByText(/Ese código ya no sirve/)).toBeTruthy();
    fakePasskeys({ cancel: true });
    fakeServer({ '/api/sign-in/codes/read': { body: reading }, '/api/sign-in/codes/cancel': {} });
    fireEvent.click(screen.getByText('leer'));
    fireEvent.click(await screen.findByRole('button', { name: 'Sí, entrar con la huella' }));
    expect(await screen.findByText(/Sin la huella no entra la computadora/)).toBeTruthy();
  });

  it('sign-in-E06, E07, R2.11: ofrece la huella una vez; al aceptar la vincula y se cierra sin avisar', async () => {
    fakePasskeys();
    fakeServer({
      '/api/passkeys/options': { body: {} },
      '/api/passkeys': { body: { ok: true, offline: true } },
    });
    store('session', { sessionId: 's', person: ana });
    render(<OfferSheet />);
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => offerPasskey.set(true));
    expect(screen.getByText(/ana@example.com/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, usar la huella' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(hasPasskey()).toBe(true);
    expect(wasOffered(ana.userId)).toBe(true);
    expect(offerPasskey.get()).toBe(false);
    // Con la huella, ya puede prender «Trabajar sin conexión» (15 · R1.3).
    expect(person.get()?.offline).toBe(true);
  });

  it('offline-E02: vinculada la huella sin el permiso, la opción no aparece', async () => {
    fakePasskeys();
    fakeServer({
      '/api/passkeys/options': { body: {} },
      '/api/passkeys': { body: { ok: true, offline: false } },
    });
    store('session', { sessionId: 's', person: ana });
    render(<OfferSheet />);
    act(() => offerPasskey.set(true));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, usar la huella' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(person.get()?.offline).toBeUndefined();
  });

  it('sign-in-E08, E09: «Ahora no» no la vuelve a ofrecer; si el celular es de otra cuenta, lo dice', async () => {
    fakePasskeys();
    const server = fakeServer({
      '/api/passkeys/options': [{ status: 401, body: { error: 'session-closed' } }, { body: {} }],
      '/api/passkeys': [
        { status: 400, body: { error: 'bad-request' } },
        { status: 409, body: { error: 'phone-has-other-account' } },
      ],
    });
    offerPasskey.set(true);
    render(<OfferSheet />);
    const yes = screen.getByRole('button', { name: 'Sí, usar la huella' });
    const again = async (sent: number) => {
      fireEvent.click(yes);
      await waitFor(() => expect(server.sent).toHaveLength(sent));
      await waitFor(() => expect(yes.getAttribute('aria-busy')).toBe('false'));
    };
    await again(1);
    await again(3);
    fakePasskeys({ cancel: true });
    await again(4);
    fakePasskeys();
    fireEvent.click(yes);
    expect(await screen.findByText(/ya tiene la huella de otra cuenta/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    act(() => offerPasskey.set(true));
    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }));
    expect(wasOffered(ana.userId)).toBe(true);
  });

  it('la cámara lee un código de esta aplicación y se cierra con la ×; sin cámara, lo dice', async () => {
    let read = (_: string) => {};
    const stop = vi.fn();
    const spy = vi.mocked(scan).mockImplementation(async (_video, onText, onFail) => {
      read = onText;
      if (spy.mock.calls.length > 1) onFail();
      return stop;
    });
    const onCode = vi.fn();
    const onClose = vi.fn();
    const { unmount } = render(<Camera onCode={onCode} onClose={onClose} />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    read('https://otro.sitio/link#x');
    read(`${location.origin}/link#abc`);
    expect(onCode).toHaveBeenCalledWith('abc');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalled();
    unmount();
    await waitFor(() => expect(stop).toHaveBeenCalledTimes(2));
    render(<Camera onCode={onCode} onClose={onClose} />);
    expect(await screen.findByText(/No se pudo abrir la cámara/)).toBeTruthy();
  });
});
