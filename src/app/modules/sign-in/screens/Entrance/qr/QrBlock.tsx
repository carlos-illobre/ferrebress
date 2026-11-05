// La computadora: el código QR de Ferrebress con los dos pasos (R2.5), la única forma de entrar con
// el celular (R2.6). El QR cambia cuando el servidor
// manda otro; la cuenta regresiva solo lo muestra.
import { codeSeconds } from '@ferrebress/shared/contracts/sign-in';
import { useEffect, useState } from 'preact/hooks';
import isotype from '../../../../../styles/brand/isotype.svg';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { linkUrl } from '../../../codes/qr.ts';
import { useComputerCode } from '../../../codes/useComputerCode.ts';
import { minutes } from '../../../notice.ts';
import { texts } from '../../../texts.ts';

// Los segundos que le quedan al código. Puede llegar después de la última marca del reloj: hasta
// la siguiente, va entero (1:00, nunca 1:01).
export const secondsLeft = (now: number, since: number): number =>
  Math.max(0, codeSeconds - Math.floor(Math.max(0, now - since) / 1000));

function useCountdown(since: number): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return secondsLeft(now, since);
}

type Draw = typeof import('../../../../../platform/camera/qr-draw.ts')['qrPath'];
let drawing: Promise<Draw> | undefined;

// El dibujo del QR, que se baja una sola vez y recién cuando hace falta.
function useQrPath(code: string | undefined) {
  const [draw, setDraw] = useState<{ qrPath: Draw }>();
  useEffect(() => {
    drawing ??= import('../../../../../platform/camera/qr-draw.ts').then((loaded) => loaded.qrPath);
    void drawing.then((qrPath) => setDraw({ qrPath }));
  }, []);
  return code && draw ? draw.qrPath(linkUrl(code)) : undefined;
}

export function QrBlock() {
  const { code, read, since } = useComputerCode(true);
  const left = useCountdown(since);
  const qr = useQrPath(code);
  return (
    <div class="qr-block">
      <div class="qr-col">
        <div class={read ? 'qr read' : 'qr'} role="img" aria-label={texts.qrLabel}>
          {qr && (
            <svg
              viewBox={`0 0 ${qr.size} ${qr.size}`}
              shape-rendering="crispEdges"
              aria-hidden="true"
            >
              <path fill="#17312b" d={qr.d} />
            </svg>
          )}
          <img class="qr-logo" src={isotype} alt="" />
          <span class="qr-read" aria-hidden={!read}>
            <Icon name="fingerprint" size="large" />
            <b>{texts.read}</b>
            <small>{texts.waitingFinger}</small>
          </span>
        </div>
        <p class="qr-count">
          <span>
            <i class="ring" style={{ '--part': String(left / codeSeconds) }} aria-hidden="true" />
            {texts.changesIn} <b>{minutes(left)}</b>
          </span>
          <span>{texts.usedOnce}</span>
        </p>
      </div>
      <Steps />
    </div>
  );
}

function Steps() {
  return (
    <ol class="steps">
      {texts.steps.map(([title, detail]) => (
        <li key={title}>
          <span>
            <b>{title}</b>
            {detail}
          </span>
        </li>
      ))}
    </ol>
  );
}
