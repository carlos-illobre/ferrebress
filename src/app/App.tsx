// La aplicación (diseño de 01, § 5, «Al abrir la aplicación»): manda primero la salida pendiente,
// pregunta /api/start y muestra el marco si hay sesión o la entrada si no. Si la sesión se cierra
// mientras se usa, la entrada aparece encima de lo que había, sin perderlo (R3.4). Atiende también
// la dirección del QR (/link#<código>) y la cámara de «Escanear».
import type { Environment } from '@ferrebress/shared/contracts/server-header';
import type { StartResponse } from '@ferrebress/shared/contracts/sign-in';
import { useEffect, useState } from 'preact/hooks';
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
  linkPath,
  OfferSheet,
  person,
  sendPendingSignOut,
  signInApi,
  signOut,
  usePhoneCode,
} from './modules/sign-in/index.ts';
import { readStored, store } from './platform/device/storage.ts';
import { clearHash, navigate, route } from './platform/router.ts';
import { sessionClosed } from './platform/server/api.ts';
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

// Al abrir: arranca, lee el código del QR si vino en la dirección, y escucha lo que pasa mientras
// la aplicación está abierta (la red, los errores, el segundo plano).
function useStart(scanned: (code: string) => void) {
  const [start, setStart] = useState<StartResponse>();
  const who = useStore(person);
  const closed = useStore(sessionClosed);

  useEffect(() => {
    const linked = takeCode();
    void boot().then((started) => {
      if (!started) return;
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
  useEffect(() => {
    if (closed) refresh();
  }, [closed]);
  useEffect(() => {
    if (who && closed) sessionClosed.set(undefined);
    if (!who && start) refresh();
  }, [who]);

  return { start, who, closed, refresh };
}

export function App() {
  const [camera, setCamera] = useState(false);
  const code = usePhoneCode();
  const { start, who, closed, refresh } = useStart((linked) => void code.scanned(linked));

  if (!start) return <Dialogs />;
  const testing = start.environment !== 'production';
  return (
    <>
      {who && <Frame person={who} testing={testing} onSignOut={leave} />}
      {(!who || closed || code.state.step === 'sign-in-first') && (
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
