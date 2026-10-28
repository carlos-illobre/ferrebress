// «Continuar con Google» (R2.1, R7.1). El botón lo dibuja Google en su propio marco
// (google/messages.ts); mientras tanto, su lugar muestra «El hilo» (useGooglePhase.ts), del mismo
// tamaño, así que cuando aparece no se mueve nada. Si no carga, se puede reintentar.
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { connectGoogleFrame } from '../../../google/connect.ts';
import { googleFramePath } from '../../../google/messages.ts';
import { texts } from '../../../texts.ts';
import { withGoogle } from '../../../useSignIn.ts';
import { limited, offline, useEntrance } from '../context.ts';
import { GoogleG } from './GoogleG.tsx';
import { type GooglePhase, useGooglePhase } from './useGooglePhase.ts';
import './google-slot.css';

const t = texts.googleSlot;

// El marco de Google: lo conecta, le manda qué dibujar cuando hay nonce y avisa cuándo quedó
// dibujado. Cada intento (`frameKey`) es un marco nuevo.
function useGoogleFrame(frameKey: number, setDrawn: (drawn: boolean) => void) {
  const entrance = useEntrance();
  const frame = useRef<HTMLIFrameElement>(null);
  const connection = useRef<ReturnType<typeof connectGoogleFrame>>(undefined);
  const attempt = useRef(entrance.attempt);
  attempt.current = entrance.attempt;
  const signInFirst = useRef(entrance.signInFirst);
  signInFirst.current = entrance.signInFirst;
  const { googleClientId, googleNonce, googleScriptUrl } = entrance.start;
  useEffect(() => {
    const opened = connectGoogleFrame(frame.current as HTMLIFrameElement, {
      drawn: () => setDrawn(true),
      credential: (credential) =>
        attempt.current(() => withGoogle(credential, !signInFirst.current)),
    });
    connection.current = opened;
    return opened.stop;
  }, [frameKey]);
  useEffect(() => {
    const element = frame.current as HTMLIFrameElement;
    if (!googleNonce) return;
    connection.current?.show({
      scriptUrl: googleScriptUrl,
      clientId: googleClientId,
      nonce: googleNonce,
      width: Math.min(400, element.clientWidth || 400),
    });
  }, [googleClientId, googleNonce, frameKey]);
  return frame;
}

// Lo que se ve en el lugar mientras no está el botón: el hilo, «Reintentar» o que falta internet.
function Waiting({ phase, again }: { phase: GooglePhase; again: () => void }) {
  return (
    <>
      <div class="g-thread" aria-hidden="true">
        <span class="g-label">
          <GoogleG />
          {t.connecting}
        </span>
        <span class="g-track">
          <span class="g-run" />
          <span class="g-fill" />
        </span>
      </div>
      {phase === 'failed' && (
        <button type="button" class="g-fail" data-mark="" data-key="r" onClick={again}>
          <span class="g-label">
            <Icon name="refresh-cw" size="small" />
            <span>{t.failed}</span>
            <b>{t.retry}</b>
            <kbd>R</kbd>
          </span>
          <span class="g-track" />
        </button>
      )}
      {phase === 'offline' && (
        <p class="g-off">
          <span class="g-label">
            <Icon name="wifi-off" size="small" />
            {t.offline}
          </span>
        </p>
      )}
    </>
  );
}

export function GoogleButton() {
  const entrance = useEntrance();
  const [drawn, setDrawn] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const { phase, arrived, again } = useGooglePhase(drawn, !offline(entrance), () => {
    setDrawn(false);
    setFrameKey((n) => n + 1);
  });
  const frame = useGoogleFrame(frameKey, setDrawn);
  // Apagado (sin conexión o con demasiados intentos) se ve gris el botón ya dibujado; tampoco se
  // llega con el teclado: inert saca el marco del orden de Tab.
  const off = limited(entrance) && phase === 'ready';
  return (
    <div
      class={`google${off ? ' off' : ''}${arrived ? ' arrived' : ''}`}
      data-phase={phase}
      data-drawn={drawn ? '' : undefined}
      inert={off}
    >
      <Waiting phase={phase} again={again} />
      <iframe key={frameKey} ref={frame} src={googleFramePath} title={texts.google} />
    </div>
  );
}
