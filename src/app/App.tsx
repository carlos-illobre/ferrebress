// La aplicación (diseño de 01, § 5, «Al abrir la aplicación»): manda primero la salida pendiente,
// pregunta /api/start y muestra el marco si hay sesión o la entrada si no. Si la sesión se cierra
// mientras se usa, la entrada aparece encima de lo que había, sin perderlo (R3.4). Atiende también
// la dirección del QR (/link#<código>) y la cámara de «Escanear».
import type { StartResponse } from '@ferrebress/shared/contracts/sign-in';
import { useEffect, useState } from 'preact/hooks';
import { Frame } from './modules/frame/index.ts';
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
import { sessionClosed } from './platform/api.ts';
import { clearHash, navigate, route } from './platform/router.ts';
import { useStore } from './platform/store.ts';

// Sin conexión al abrir, no se sabe nada del servidor: se sigue con lo guardado (R3.6).
const unknown: StartResponse = {
  environment: 'production',
  version: '',
  googleClientId: '',
  googleScriptUrl: '',
};

async function boot(): Promise<StartResponse> {
  await sendPendingSignOut();
  const start = await signInApi.start();
  if (!start.ok) return unknown;
  confirmed(start.data.person);
  return start.data;
}

// El código que trajo la dirección: se lee una vez y se borra, para que no quede en el historial.
function takeCode(): string | undefined {
  const { path, hash } = route.get();
  if (path !== linkPath || !hash) return undefined;
  clearHash();
  navigate('/', { replace: true });
  return hash;
}

export function App() {
  const [start, setStart] = useState<StartResponse>();
  const [camera, setCamera] = useState(false);
  const who = useStore(person);
  const closed = useStore(sessionClosed);
  const code = usePhoneCode();

  useEffect(() => {
    const linked = takeCode();
    void boot().then((started) => {
      setStart(started);
      if (linked) void code.scanned(linked);
    });
    const retry = () => void sendPendingSignOut();
    addEventListener('online', retry);
    return () => removeEventListener('online', retry);
  }, []);

  // La sesión cerrada se vuelve a abrir desde la entrada, con un pase de Google nuevo.
  useEffect(() => {
    if (closed) void signInApi.start().then((again) => again.ok && setStart(again.data));
  }, [closed]);
  useEffect(() => {
    if (who && closed) sessionClosed.set(undefined);
  }, [who]);

  if (!start) return null;
  const testing = start.environment !== 'production';
  return (
    <>
      {who && <Frame person={who} testing={testing} onSignOut={signOut} />}
      {(!who || closed) && (
        <Entrance
          start={start}
          onScan={() => setCamera(true)}
          signInFirst={code.state.step === 'sign-in-first'}
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
    </>
  );
}
