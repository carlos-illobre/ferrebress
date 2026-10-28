// La aplicación (diseño de 01, § 5, «Al abrir la aplicación»): manda primero la salida pendiente,
// pregunta /api/start y muestra el marco si hay sesión o la entrada si no; sin nadie guardado, la
// entrada se dibuja antes de que conteste. Si la sesión se cierra mientras se usa, la entrada
// aparece encima de lo que había, sin perderlo (R3.4). Atiende también
// la dirección del QR (/link#<código>) y la cámara de «Escanear».
import type { Environment } from '@ferrebress/shared/contracts/server-header';
import type { StartResponse } from '@ferrebress/shared/contracts/sign-in';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  announceUpdate,
  Dialogs,
  Frame,
  forgetReport,
  updateOnOpen,
  watchBackground,
  watchCrashes,
} from './modules/frame/index.ts';
import {
  Camera,
  CodeSheet,
  confirmed,
  Entrance,
  hasPendingSignOut,
  linkPath,
  OfferSheet,
  person,
  sendPendingSignOut,
  signInApi,
  signOut,
  useNonceRenewal,
  usePhoneCode,
} from './modules/sign-in/index.ts';
import { readStored, store } from './platform/device/storage.ts';
import { clearHash, navigate, route } from './platform/router.ts';
import { sessionClosed } from './platform/server/api.ts';
import { useReconnect } from './platform/server/reconnect.ts';
import { useStore } from './platform/store.ts';
import { Toasts } from './ui/toast/Toast.tsx';

// Sin conexión al abrir, no se sabe nada del servidor: se sigue con lo guardado (R3.6), también
// el último ambiente, para que el de pruebas siga con su marco y su menú (00 · R10.1).
const environmentKey = 'environment';
const unknown = (): StartResponse => ({
  environment: readStored<Environment>(environmentKey) ?? 'production',
  version: '',
  googleClientId: '',
  googleScriptUrl: '',
});

async function boot(): Promise<StartResponse | undefined> {
  await sendPendingSignOut();
  const start = await signInApi.start();
  if (!start.ok) return unknown();
  store(environmentKey, start.data.environment);
  // Recién abierta, con una versión nueva en el servidor, se actualiza antes de que se use (R5.2).
  if (updateOnOpen(start.data.version)) return undefined;
  confirmed(start.data.person);
  return start.data;
}

// Al volver la conexión, el servidor revisa la sesión: si venció durante el corte, aparece la
// entrada encima de lo que había (R3.6, E28b).
async function recheck(): Promise<void> {
  await sendPendingSignOut();
  if (!person.get()) return;
  const start = await signInApi.start();
  if (start.ok && !start.data.person) sessionClosed.set('unknown');
}

// Salir borra también el aviso de «Algo salió mal» guardado (diseño de 01, § 7).
async function leave(): Promise<void> {
  forgetReport();
  await signOut();
}

// El código que trajo la dirección: se lee una vez y se borra, para que no quede en el historial.
function takeCode(): string | undefined {
  const { path, hash } = route.get();
  if (path !== linkPath || !hash) return undefined;
  clearHash();
  navigate('/', { replace: true });
  return hash;
}

// Sin nadie guardado en el dispositivo, lo más probable es la entrada: se dibuja sin esperar al
// servidor, así el marco de Google y el QR cargan mientras tanto (el botón de Google espera el
// nonce). No si hay una salida pendiente, que tiene que salir antes que cualquier otro pedido.
const early = (): StartResponse | undefined =>
  person.get() || hasPendingSignOut() ? undefined : unknown();

// Al abrir: arranca, lee el código del QR si vino en la dirección, y escucha lo que pasa mientras
// la aplicación está abierta (la red, los errores, el segundo plano).
function useStart(scanned: (code: string) => void) {
  const [start, setStart] = useState<StartResponse | undefined>(early);
  const booted = useRef(false);
  const who = useStore(person);
  const closed = useStore(sessionClosed);

  useEffect(() => {
    const linked = takeCode();
    void boot().then((started) => {
      if (!started) return;
      booted.current = true;
      setStart(started);
      announceUpdate();
      if (linked) scanned(linked);
    });
    const retry = () => void recheck();
    addEventListener('online', retry);
    const stops = [watchCrashes(), watchBackground()];
    return () => {
      removeEventListener('online', retry);
      for (const stop of stops) stop();
    };
  }, []);

  // La entrada necesita un nonce de Google sin usar: al salir, al cerrarse la sesión y cuando el
  // que tenía venció, se pide otro.
  const refresh = () => void signInApi.start().then((again) => again.ok && setStart(again.data));
  // Con la entrada abierta, solo hace falta otro nonce: un pedido mínimo, que en el celular se paga
  // con datos (01 · R2.1).
  const renew = () =>
    void signInApi.nonce().then((fresh) => {
      if (fresh.ok) setStart((now) => now && { ...now, googleNonce: fresh.data.nonce });
    });
  useEffect(() => {
    if (closed) refresh();
  }, [closed]);
  useEffect(() => {
    if (who && closed) sessionClosed.set(undefined);
    if (!who && booted.current) refresh();
  }, [who]);

  return { start, who, closed, refresh, renew };
}

export function App() {
  const [camera, setCamera] = useState(false);
  const code = usePhoneCode();
  const { start, who, closed, refresh, renew } = useStart((linked) => void code.scanned(linked));
  const entrance = !who || !!closed || code.state.step === 'sign-in-first';
  useNonceRenewal(start?.googleNonce, entrance, renew);
  // Con la entrada apagada por un pedido que falló teniendo red, se vuelve a probar con el mismo
  // pedido mínimo del nonce (01 · R2.8).
  useReconnect(entrance, renew);

  if (!start) return <Dialogs />;
  const testing = start.environment !== 'production';
  return (
    <>
      {who && <Frame person={who} testing={testing} onSignOut={leave} />}
      {entrance && (
        <Entrance
          start={start}
          onScan={() => setCamera(true)}
          signInFirst={code.state.step === 'sign-in-first'}
          onStale={refresh}
        />
      )}
      {camera && (
        <Camera
          onCode={(read) => {
            setCamera(false);
            void code.scanned(read);
          }}
          onClose={() => setCamera(false)}
        />
      )}
      <CodeSheet code={code} />
      <OfferSheet />
      <Dialogs />
      <Toasts />
    </>
  );
}
