// Leer un código QR con la cámara (diseño de 01, § 10): con BarcodeDetector donde el navegador lo
// tiene, y si no, con ZXing, que se baja recién al tocar «Escanear». Lee un cuadro cada 250 ms
// hasta que se cierre la cámara, y avisa cada texto que lee: quien la usa decide si le sirve, así un
// QR ajeno (el de un producto, uno de un pago) no la deja sin leer.
type Detector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type WithDetector = { BarcodeDetector?: new (options: { formats: string[] }) => Detector };

export const scanEveryMs = 250;

async function detector(): Promise<(video: HTMLVideoElement) => Promise<string | undefined>> {
  const Native = (globalThis as WithDetector).BarcodeDetector;
  if (Native) {
    const native = new Native({ formats: ['qr_code'] });
    return async (video) => (await native.detect(video))[0]?.rawValue;
  }
  const { BrowserQRCodeReader } = await import('@zxing/library');
  const reader = new BrowserQRCodeReader();
  return async (video) => {
    try {
      return (await reader.decodeOnce(video)).getText();
    } catch {
      return undefined;
    }
  };
}

// Prende la cámara de atrás en el video y avisa todo lo que lee; devuelve cómo apagarla. Si no hay
// cámara o no dan permiso, avisa con onFail.
export async function scan(
  video: HTMLVideoElement,
  onText: (text: string) => void,
  onFail: () => void,
): Promise<() => void> {
  let stopped = false;
  let stream: MediaStream | undefined;
  const stop = () => {
    stopped = true;
    for (const track of stream?.getTracks() ?? []) track.stop();
  };
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    await video.play();
    const read = await detector();
    const tick = async () => {
      if (stopped) return;
      const text = await read(video).catch(() => undefined);
      if (text) onText(text);
      setTimeout(tick, scanEveryMs);
    };
    void tick();
  } catch {
    stop();
    onFail();
  }
  return stop;
}
