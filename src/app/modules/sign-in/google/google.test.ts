import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawnWithinMs, showGoogleButton } from './button.ts';
import { connectGoogleFrame } from './connect.ts';
import { startGoogleFrame } from './frame.ts';
import { forgetGoogleChoice } from './messages.ts';

const scriptUrl = 'https://accounts.google.com/gsi/client';

// Google pone su marco del botón personalizado, que carga enseguida.
const drawsFrame = (element: HTMLElement) => {
  const frame = document.createElement('iframe');
  element.append(frame);
  setTimeout(() => frame.dispatchEvent(new Event('load')), 0);
};

function fakeGoogle() {
  const id = {
    initialize: vi.fn(),
    renderButton: vi.fn(drawsFrame),
    disableAutoSelect: vi.fn(),
  };
  vi.stubGlobal('google', { accounts: { id } });
  return id;
}

// happy-dom no baja scripts: se guarda el que se agrega y la prueba dice si cargó o no.
let lastScript: HTMLScriptElement;
const appended = () =>
  vi.spyOn(document.head, 'append').mockImplementation((script) => {
    lastScript = script as HTMLScriptElement;
  });

describe('el botón de Google', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('si el script no carga, no dibuja nada, y lo vuelve a intentar la próxima vez', async () => {
    appended();
    const element = document.createElement('div');
    const first = showGoogleButton(element, {
      scriptUrl,
      clientId: 'c',
      nonce: 'n',
      width: 300,
      onCredential: () => {},
    });
    lastScript.dispatchEvent(new Event('error'));
    expect(await first).toBe(false);
    expect(element.innerHTML).toBe('');
    const loadedEmpty = showGoogleButton(element, {
      scriptUrl,
      clientId: 'c',
      nonce: 'n',
      width: 300,
      onCredential: () => {},
    });
    lastScript.dispatchEvent(new Event('load'));
    expect(await loadedEmpty).toBe(false);
    expect(element.innerHTML).toBe('');
    const id = fakeGoogle();
    const onCredential = vi.fn();
    const second = showGoogleButton(element, {
      scriptUrl,
      clientId: 'c',
      nonce: 'n',
      width: 300,
      onCredential,
    });
    expect(lastScript.src).toBe(scriptUrl);
    lastScript.dispatchEvent(new Event('load'));
    expect(await second).toBe(true);
    expect(id.renderButton).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ text: 'continue_with', width: 300 }),
    );
    const options = id.initialize.mock.calls[0]?.[0];
    expect(options).toMatchObject({ client_id: 'c', nonce: 'n' });
    options.callback({ credential: 'pase' });
    expect(onCredential).toHaveBeenCalledWith('pase');
  });

  it('dice que lo dibujó recién cuando llegaron los estilos de Google, o a los 3 s', async () => {
    vi.useFakeTimers();
    fakeGoogle();
    const shown = () => {
      let done = false;
      const drawing = showGoogleButton(document.createElement('div'), {
        scriptUrl,
        clientId: 'c',
        nonce: 'n',
        width: 300,
        onCredential() {},
      }).then((drawn) => {
        done = drawn;
      });
      return { drawing, done: () => done };
    };
    const styles = document.createElement('link');
    styles.id = 'googleidentityservice';
    document.body.append(styles);
    const styled = shown();
    await vi.advanceTimersByTimeAsync(0);
    expect(styled.done()).toBe(false);
    styles.dispatchEvent(new Event('load'));
    await styled.drawing;
    expect(styled.done()).toBe(true);
    const failing = shown();
    await vi.advanceTimersByTimeAsync(0);
    styles.dispatchEvent(new Event('error'));
    await failing.drawing;
    expect(failing.done()).toBe(true);
    const slow = shown();
    await vi.advanceTimersByTimeAsync(drawnWithinMs);
    await slow.drawing;
    expect(slow.done()).toBe(true);
    styles.remove();
    vi.useRealTimers();
  });

  it('espera también el marco del botón personalizado, aunque Google lo ponga después', async () => {
    vi.useFakeTimers();
    const id = fakeGoogle();
    let later = (_: HTMLElement) => {};
    id.renderButton.mockImplementationOnce((element: HTMLElement) => {
      element.append(document.createElement('div'));
      later = drawsFrame;
    });
    const element = document.createElement('div');
    let drawn = false;
    const drawing = showGoogleButton(element, {
      scriptUrl,
      clientId: 'c',
      nonce: 'n',
      width: 300,
      onCredential() {},
    }).then((done) => {
      drawn = done;
    });
    await vi.advanceTimersByTimeAsync(10);
    expect(drawn).toBe(false);
    later(element);
    await vi.advanceTimersByTimeAsync(10);
    await drawing;
    expect(drawn).toBe(true);
    vi.useRealTimers();
  });

  it('sign-in-E11: después de salir, Google vuelve a pedir la cuenta una vez', async () => {
    const id = fakeGoogle();
    const show = () =>
      showGoogleButton(document.createElement('div'), {
        scriptUrl,
        clientId: 'c',
        nonce: 'n',
        width: 300,
        onCredential() {},
      });
    forgetGoogleChoice();
    await show();
    await show();
    expect(id.disableAutoSelect).toHaveBeenCalledOnce();
  });
});

describe('el marco del botón de Google', () => {
  afterEach(() => vi.unstubAllGlobals());

  const from = (source: unknown, data: unknown, origin = location.origin) =>
    dispatchEvent(new MessageEvent('message', { data, origin, source: source as Window }));

  it('el marco avisa que está listo, dibuja lo que le pide la aplicación y le pasa el pase', async () => {
    const id = fakeGoogle();
    const app = { postMessage: vi.fn() };
    const place = document.createElement('div');
    startGoogleFrame(place, app as unknown as Window);
    expect(app.postMessage).toHaveBeenLastCalledWith({ type: 'ready' }, location.origin);
    const show = { type: 'show', scriptUrl, clientId: 'c', nonce: 'n', width: 320 };
    from({}, show);
    from(app, show, 'https://otro.example');
    from(app, { type: 'otra' });
    expect(id.renderButton).not.toHaveBeenCalled();
    from(app, show);
    await vi.waitFor(() =>
      expect(app.postMessage).toHaveBeenLastCalledWith({ type: 'drawn' }, location.origin),
    );
    id.initialize.mock.calls[0]?.[0].callback({ credential: 'pase' });
    expect(app.postMessage).toHaveBeenLastCalledWith(
      { type: 'credential', credential: 'pase' },
      location.origin,
    );
    vi.unstubAllGlobals();
    vi.stubGlobal('google', undefined);
    app.postMessage.mockClear();
    from(app, show);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(app.postMessage).not.toHaveBeenCalled();
  });

  it('la aplicación le pide al marco que dibuje cuando está listo, y escucha solo a su marco', () => {
    const frame = document.createElement('iframe');
    const inside = { postMessage: vi.fn() };
    Object.defineProperty(frame, 'contentWindow', { value: inside });
    const events = { drawn: vi.fn(), credential: vi.fn() };
    const connection = connectGoogleFrame(frame, events);
    const show = { scriptUrl, clientId: 'c', nonce: 'n', width: 320 };
    connection.show(show);
    expect(inside.postMessage).not.toHaveBeenCalled();
    from({}, { type: 'ready' });
    from(inside, { type: 'ready' });
    expect(inside.postMessage).toHaveBeenCalledWith({ type: 'show', ...show }, location.origin);
    connection.show({ ...show, nonce: 'otro' });
    expect(inside.postMessage).toHaveBeenLastCalledWith(
      { type: 'show', ...show, nonce: 'otro' },
      location.origin,
    );
    from(inside, { type: 'drawn' });
    from(inside, { type: 'credential', credential: 'pase' });
    expect(events.drawn).toHaveBeenCalledOnce();
    expect(events.credential).toHaveBeenCalledWith('pase');
    connection.stop();
    from(inside, { type: 'drawn' });
    expect(events.drawn).toHaveBeenCalledOnce();
    const empty = connectGoogleFrame(document.createElement('iframe'), events);
    from(null, { type: 'ready' });
    empty.stop();
  });
});
