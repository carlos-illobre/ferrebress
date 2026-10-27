// La página del marco del botón de Google (google-button.html): espera que la aplicación le diga
// qué dibujar, lo dibuja y le pasa a la aplicación cuándo quedó dibujado y el pase de Google.
import { showGoogleButton } from './button.ts';
import { type FromFrame, messageFrom, type ToFrame } from './messages.ts';

export function startGoogleFrame(place: HTMLElement, app: Window): void {
  const tell = (message: FromFrame) => app.postMessage(message, location.origin);
  addEventListener('message', (event) => {
    const message = messageFrom<ToFrame>(event, app);
    if (message?.type !== 'show') return;
    const { scriptUrl, clientId, nonce, width } = message;
    void showGoogleButton(place, {
      scriptUrl,
      clientId,
      nonce,
      width,
      onCredential: (credential) => tell({ type: 'credential', credential }),
    }).then((drawn) => drawn && tell({ type: 'drawn' }));
  });
  tell({ type: 'ready' });
}
