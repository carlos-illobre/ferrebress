// Volver a confirmar quién es, sin HTML (02 · R3.8): con Google (pide un nonce nuevo y, con el pase,
// confirma) o con la huella del celular. Al confirmar, se cierra y lo que se pidió se repite solo.
import { useState } from 'preact/hooks';
import { isPhone } from '../../platform/device/device.ts';
import { signInApi } from './api.ts';
import { connectGoogleFrame } from './google/connect.ts';
import { signWithPasskey } from './passkeys/webauthn.ts';
import { hasPasskey } from './session.ts';
import { signInSettings } from './settings.ts';

async function withPasskey(): Promise<boolean> {
  const options = await signInApi.confirmPasskeyOptions();
  const response = options.ok ? await signWithPasskey(options.data) : undefined;
  return !!response && (await signInApi.confirmPasskey(response)).ok;
}

// El botón de Google en su marco (la vista le da el elemento): pide un nonce nuevo y, con el pase,
// confirma. Devuelve cómo soltarlo.
function showGoogle(element: HTMLIFrameElement, confirm: (credential: string) => void): () => void {
  const connection = connectGoogleFrame(element, { drawn: () => {}, credential: confirm });
  void signInApi.start().then((start) => {
    if (!start.ok || !start.data.googleNonce) return;
    const width = signInSettings.google.confirmWidth;
    connection.show({
      scriptUrl: start.data.googleScriptUrl,
      clientId: start.data.googleClientId,
      nonce: start.data.googleNonce,
      width: Math.min(width, element.clientWidth || width),
      theme: 'filled_blue',
    });
  });
  return connection.stop;
}

export function useConfirm(onConfirmed: () => unknown, onClose: () => void) {
  const [failed, setFailed] = useState(false); // local: la hoja de este dispositivo
  const done = async (ok: boolean) => {
    setFailed(!ok);
    if (ok) {
      onClose();
      await onConfirmed();
    }
  };
  return {
    failed,
    // La huella, solo en un celular que la tiene.
    canPasskey: isPhone() && hasPasskey(),
    withPasskey: async () => done(await withPasskey()),
    showGoogle: (element: HTMLIFrameElement) =>
      showGoogle(
        element,
        (credential) => void signInApi.confirmGoogle(credential).then((result) => done(result.ok)),
      ),
  };
}
