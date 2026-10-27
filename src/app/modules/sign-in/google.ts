// El botón de Google Identity Services (diseño de 01, § 5): lo dibuja Google, en el idioma del
// navegador, y devuelve el pase que verifica el servidor. El script (su dirección la dice el
// servidor: en las pruebas de punta a punta es uno de prueba) se baja recién cuando se muestra la
// entrada; si la aplicación abre con sesión, no se carga.
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

// El botón de Google es HTML con los estilos de Google, que su script pide aparte: sin ellos se ve
// una G enorme y el texto repetido. El lugar queda vacío hasta que esos estilos llegaron, o 3 s.
export const drawnWithinMs = 3000;

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
};

// Dibuja el botón dentro del elemento; si Google no carga (sin conexión), no dibuja nada.
export async function showGoogleButton(element: HTMLElement, button: GoogleButton): Promise<void> {
  const loaded = await load(button.scriptUrl).then(
    () => true,
    () => false,
  );
  const google = googleId();
  if (!loaded || !google) return;
  google.initialize({
    client_id: button.clientId,
    nonce: button.nonce,
    callback: (response) => button.onCredential(response.credential),
    ux_mode: 'popup',
  });
  google.renderButton(element, {
    theme: 'filled_blue',
    shape: 'pill',
    size: 'large',
    text: 'continue_with',
    width: button.width,
  });
  await stylesLoaded();
  element.dataset.drawn = '';
}

// Después de «Salir», Google vuelve a pedir que se elija la cuenta (R2.1).
export function forgetGoogleChoice(): void {
  googleId()?.disableAutoSelect();
}
