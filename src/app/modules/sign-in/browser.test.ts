import { afterEach, describe, expect, it, vi } from 'vitest';
import { scan, scanEveryMs } from './scanner.ts';

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

  it('después de leer un QR ajeno sigue leyendo (revisión de código, 1.10)', async () => {
    vi.useFakeTimers();
    const { video } = camera();
    const detect = vi
      .fn()
      .mockResolvedValueOnce([{ rawValue: 'https://otro.example/producto' }])
      .mockResolvedValue([{ rawValue: 'el bueno' }]);
    vi.stubGlobal(
      'BarcodeDetector',
      class {
        detect = detect;
      },
    );
    const onText = vi.fn();
    const stop = await scan(video, onText, () => {});
    await vi.advanceTimersByTimeAsync(scanEveryMs);
    expect(onText.mock.calls.map(([text]) => text)).toEqual([
      'https://otro.example/producto',
      'el bueno',
    ]);
    stop();
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
