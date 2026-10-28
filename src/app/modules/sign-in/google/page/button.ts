// El botón de Google Identity Services (diseño de 01, § 5), dentro de su marco (frame.ts): lo
// dibuja Google, en el idioma del navegador, y devuelve el pase que verifica el servidor. El script
// (su dirección la dice el servidor: en las pruebas de punta a punta es uno de prueba) se baja
// recién cuando se muestra la entrada; si la aplicación abre con sesión, no se carga.
import { takeForgetGoogle } from '../messages.ts';

type GoogleId = {
  initialize(options: {
    client_id: string;
    nonce: string;
    callback: (response: { credential: string }) => void;
    ux_mode: 'popup';
  }): void;
  renderButton(element: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
};

type WithGoogle = { google?: { accounts: { id: GoogleId } } };

let loading: Promise<void> | undefined;

const googleId = () => (globalThis as WithGoogle).google?.accounts.id;

function load(scriptUrl: string): Promise<void> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = undefined;
      reject(new Error('google'));
    };
    document.head.append(script);
  });
  return loading;
}

// Google dibuja su botón en dos tiempos: primero el común, con sus estilos, que pide aparte (sin
// ellos se ve una G enorme); después, en un marco suyo, el personalizado («Continuar como…»), si el
// navegador tiene una sesión de Google, con otra letra y otra altura. El botón se da por dibujado
// cuando llegaron los estilos y cargó ese marco, o a los 3 s: así no se ve ningún salto.
export const drawnWithinMs = 3000;

function frameLoaded(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      watcher.disconnect();
      resolve();
    };
    const watch = () => {
      const frame = element.querySelector('iframe');
      if (!frame) return;
      watcher.disconnect();
      frame.addEventListener('load', done, { once: true });
    };
    const watcher = new MutationObserver(watch);
    watcher.observe(element, { childList: true, subtree: true });
    watch();
    setTimeout(done, drawnWithinMs);
  });
}

function stylesLoaded(): Promise<void> {
  const styles = document.getElementById('googleidentityservice') as HTMLLinkElement | null;
  if (!styles || styles.sheet) return Promise.resolve();
  return new Promise((resolve) => {
    styles.addEventListener('load', () => resolve(), { once: true });
    styles.addEventListener('error', () => resolve(), { once: true });
    setTimeout(resolve, drawnWithinMs);
  });
}

export type GoogleButton = {
  scriptUrl: string;
  clientId: string;
  nonce: string;
  width: number;
  onCredential: (credential: string) => void;
  theme?: 'filled_blue' | 'outline';
};

// Dibuja el botón dentro del elemento y dice si lo dibujó: si Google no carga (sin conexión), no.
export async function showGoogleButton(
  element: HTMLElement,
  button: GoogleButton,
): Promise<boolean> {
  const loaded = await load(button.scriptUrl).then(
    () => true,
    () => false,
  );
  const google = googleId();
  if (!loaded || !google) return false;
  // Después de «Salir», Google vuelve a pedir que se elija la cuenta (R2.1).
  if (takeForgetGoogle()) google.disableAutoSelect();
  google.initialize({
    client_id: button.clientId,
    nonce: button.nonce,
    callback: (response) => button.onCredential(response.credential),
    ux_mode: 'popup',
  });
  google.renderButton(element, {
    theme: button.theme === 'outline' ? 'outline' : 'filled_blue',
    shape: 'pill',
    size: 'large',
    text: 'continue_with',
    width: button.width,
  });
  await Promise.all([stylesLoaded(), frameLoaded(element)]);
  return true;
}
