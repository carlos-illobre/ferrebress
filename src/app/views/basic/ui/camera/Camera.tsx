// La cámara que lee un código QR, a pantalla completa con su marco (diseño de 01, § 10; de 03, § 13):
// la usan la entrada (el código para entrar) y el vínculo (el código para vincular). Lo que lee se
// le pasa a `read`, que dice si es un código que le sirve; al primero que sirve, se apaga y avisa.
// Si no hay cámara o no dan permiso, lo dice. El botón atrás del celular la cierra.
import { useEffect, useRef, useState } from 'preact/hooks';
import { useBackStep } from '../../../../platform/view/back-step.ts';
import { scan } from '../../../../platform/view/camera.ts';
import { Icon } from '../icon/Icon.tsx';
import './camera.css';

export type CameraTexts = { title: string; tip: string; unavailable: string; close: string };

type Props = {
  texts: CameraTexts;
  read: (text: string) => string | undefined;
  onCode: (code: string) => void;
  onClose: () => void;
};

export function Camera({ texts, read, onCode, onClose }: Props) {
  // vista: el video donde se ve la cámara.
  const video = useRef<HTMLVideoElement>(null);
  // vista: si la cámara no se pudo abrir, para decirlo en su lugar.
  const [failed, setFailed] = useState(false);
  useBackStep(onClose);

  useEffect(() => {
    const scanning = scan(
      video.current as HTMLVideoElement,
      (text) => {
        const code = read(text);
        if (!code) return;
        void scanning.then((stop) => stop());
        onCode(code);
      },
      () => setFailed(true),
    );
    return () => void scanning.then((stop) => stop());
  }, []);

  return (
    <section class="camera" role="dialog" aria-modal="true" aria-label={texts.title} data-layer="">
      <video ref={video} class="camera-video" muted playsInline />
      <p class="camera-tip">{failed ? texts.unavailable : texts.tip}</p>
      <div class="camera-frame" aria-hidden="true">
        <i class="scanline" />
      </div>
      <button
        type="button"
        class="camera-close"
        aria-label={texts.close}
        data-close=""
        onClick={onClose}
      >
        <Icon name="x" size="large" />
      </button>
    </section>
  );
}
