// La computadora: el código QR de Ferrebress con los dos pasos (R2.5), la única forma de entrar con
// el celular (R2.6). El QR cambia cuando el servidor
// manda otro; la cuenta regresiva solo lo muestra.
import { useEffect, useState } from 'preact/hooks';
import isotype from '../../../../styles/brand/isotype.svg';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { minutes } from '../../notice.ts';
import { linkUrl, qrPath } from '../../qr.ts';
import { texts } from '../../texts.ts';
import { useComputerCode } from '../../useComputerCode.ts';

export const codeSeconds = 60;

function useCountdown(since: number): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, codeSeconds - Math.floor((now - since) / 1000));
}

export function QrBlock() {
  const { code, read, since } = useComputerCode(true);
  const left = useCountdown(since);
  const qr = code ? qrPath(linkUrl(code)) : undefined;
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
