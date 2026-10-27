import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawnWithinMs, forgetGoogleChoice, showGoogleButton } from './google.ts';
import { scan, scanEveryMs } from './scanner.ts';

const scriptUrl = 'https://accounts.google.com/gsi/client';

function fakeGoogle() {
  const id = { initialize: vi.fn(), renderButton: vi.fn(), disableAutoSelect: vi.fn() };
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
    await first;
    expect(element.innerHTML).toBe('');
    const loadedEmpty = showGoogleButton(element, {
      scriptUrl,
      clientId: 'c',
      nonce: 'n',
      width: 300,
      onCredential: () => {},
    });
    lastScript.dispatchEvent(new Event('load'));
    await loadedEmpty;
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
    await second;
    expect(id.renderButton).toHaveBeenCalledWith(
      element,
      expect.objectContaining({ text: 'continue_with', width: 300 }),
    );
    const options = id.initialize.mock.calls[0]?.[0];
    expect(options).toMatchObject({ client_id: 'c', nonce: 'n' });
    options.callback({ credential: 'pase' });
    expect(onCredential).toHaveBeenCalledWith('pase');
  });

  it('el botón se ve recién cuando llegaron los estilos de Google, o a los 3 s', async () => {
    vi.useFakeTimers();
    fakeGoogle();
    const shown = (element: HTMLElement) =>
      showGoogleButton(element, {
        scriptUrl,
        clientId: 'c',
        nonce: 'n',
        width: 300,
        onCredential() {},
      });
    const styles = document.createElement('link');
    styles.id = 'googleidentityservice';
    document.body.append(styles);
    const styled = document.createElement('div');
    const drawing = shown(styled);
    await vi.advanceTimersByTimeAsync(0);
    expect(styled.dataset.drawn).toBeUndefined();
    styles.dispatchEvent(new Event('load'));
    await drawing;
    expect(styled.dataset.drawn).toBe('');
    const failed = document.createElement('div');
    const failing = shown(failed);
    await vi.advanceTimersByTimeAsync(0);
    styles.dispatchEvent(new Event('error'));
    await failing;
    expect(failed.dataset.drawn).toBe('');
    const slow = document.createElement('div');
    const waiting = shown(slow);
    await vi.advanceTimersByTimeAsync(drawnWithinMs);
    await waiting;
    expect(slow.dataset.drawn).toBe('');
    styles.remove();
    vi.useRealTimers();
  });

  it('01-E11: después de salir, Google vuelve a pedir la cuenta', () => {
    forgetGoogleChoice();
    const id = fakeGoogle();
    forgetGoogleChoice();
    expect(id.disableAutoSelect).toHaveBeenCalledOnce();
  });
});

describe('la cámara', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function camera() {
    const track = { stop: vi.fn() };
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) },
    });
    const video = document.createElement('video');
    Object.defineProperty(video, 'srcObject', { set: () => {} });
    video.play = vi.fn(async () => {});
    return { track, video };
  }

  it('lee con BarcodeDetector cada 250 ms hasta encontrar algo, y apaga la cámara al cerrar', async () => {
    vi.useFakeTimers();
    const { track, video } = camera();
    const detect = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('cuadro'))
      .mockResolvedValue([{ rawValue: 'texto' }]);
    vi.stubGlobal(
      'BarcodeDetector',
      class {
        detect = detect;
      },
    );
    const onText = vi.fn();
    const stop = await scan(video, onText, () => {});
    await vi.advanceTimersByTimeAsync(scanEveryMs * 2);
    expect(onText).toHaveBeenCalledWith('texto');
    stop();
    expect(track.stop).toHaveBeenCalled();
  });

  it('si se cierra mientras busca, deja de leer', async () => {
    vi.useFakeTimers();
    const { video } = camera();
    const detect = vi.fn(async () => []);
    vi.stubGlobal(
      'BarcodeDetector',
      class {
        detect = detect;
      },
    );
    const stop = await scan(
      video,
      () => {},
      () => {},
    );
    await vi.advanceTimersByTimeAsync(0);
    stop();
    await vi.advanceTimersByTimeAsync(scanEveryMs * 3);
    expect(detect).toHaveBeenCalledTimes(1);
  });

  it('donde no hay BarcodeDetector, usa ZXing', async () => {
    const { video } = camera();
    vi.doMock('@zxing/library', () => ({
      BrowserQRCodeReader: class {
        calls = 0;
        decodeOnce() {
          this.calls += 1;
          if (this.calls === 1) return Promise.reject(new Error('nada'));
          return Promise.resolve({ getText: () => 'zxing' });
        }
      },
    }));
    vi.useFakeTimers();
    const onText = vi.fn();
    const stop = await scan(video, onText, () => {});
    await vi.advanceTimersByTimeAsync(scanEveryMs);
    expect(onText).toHaveBeenCalledWith('zxing');
    stop();
    await vi.advanceTimersByTimeAsync(scanEveryMs);
    vi.doUnmock('@zxing/library');
  });

  it('sin cámara o sin permiso, avisa', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: { getUserMedia: vi.fn(async () => Promise.reject(new Error('sin permiso'))) },
    });
    const onFail = vi.fn();
    const stop = await scan(document.createElement('video'), () => {}, onFail);
    expect(onFail).toHaveBeenCalledOnce();
    stop();
  });
});
