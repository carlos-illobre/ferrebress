// «Escanear el código de la computadora» en el celular (R2.7): la cámara a pantalla completa con su
// marco; al leer un código de esta aplicación, se cierra y sigue como si se hubiera abierto su
// dirección. Si no hay cámara o no dan permiso, lo dice.
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { codeOf } from '../../qr.ts';
import { scan } from '../../scanner.ts';
import { texts } from '../../texts.ts';

export function Camera({
  onCode,
  onClose,
}: {
  onCode: (code: string) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const scanning = scan(
      video.current as HTMLVideoElement,
      (text) => {
        const code = codeOf(text);
        if (!code) return;
        void scanning.then((stop) => stop());
        onCode(code);
      },
      () => setFailed(true),
    );
    return () => void scanning.then((stop) => stop());
  }, []);

  return (
    <section
      class="camera"
      role="dialog"
      aria-modal="true"
      aria-label={texts.camera.title}
      data-layer=""
    >
      <video ref={video} class="camera-video" muted playsInline />
      <p class="camera-tip">{failed ? texts.camera.unavailable : texts.camera.tip}</p>
      <div class="camera-frame" aria-hidden="true">
        <i class="scanline" />
      </div>
      <button
        type="button"
        class="camera-close"
        aria-label={texts.camera.close}
        data-close=""
        onClick={onClose}
      >
        <Icon name="x" size="large" />
      </button>
    </section>
  );
}
