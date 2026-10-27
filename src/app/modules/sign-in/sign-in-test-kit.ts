// Lo que comparten las pruebas de la entrada: una persona, las respuestas del servidor al entrar y
// un navegador con huella de mentira (WebAuthn y su JSON).
import { type Mock, vi } from 'vitest';

export const ana = {
  userId: 'u1',
  name: 'Ana Gómez',
  email: 'ana@example.com',
  role: 'Administrador',
};
export const sessionId = '0190a000-0000-7000-8000-000000000001';
export const signInReply = (offerPasskey = false) => ({
  body: { person: ana, sessionId, offerPasskey },
});
export const startReply = (extra: Record<string, unknown> = {}) => ({
  body: {
    environment: 'testing',
    version: 'app-test',
    googleClientId: 'cliente',
    googleScriptUrl: 'https://accounts.google.com/gsi/client',
    googleNonce: 'nonce',
    ...extra,
  },
});

// El navegador con huella: crear y usar devuelven una credencial, o fallan si la persona cancela.
export function fakePasskeys({ cancel = false } = {}) {
  const credential = { toJSON: () => ({ id: 'credencial' }) };
  const result = () =>
    cancel
      ? Promise.reject(new DOMException('cancelado', 'NotAllowedError'))
      : Promise.resolve(credential);
  const credentials = { create: vi.fn(result), get: vi.fn(result) };
  vi.stubGlobal('PublicKeyCredential', {
    ...globalThis.PublicKeyCredential,
    parseCreationOptionsFromJSON: (options: unknown) => ({ parsed: options }),
    parseRequestOptionsFromJSON: (options: unknown) => ({ parsed: options }),
  });
  vi.stubGlobal('navigator', { ...navigator, credentials, onLine: true });
  return credentials;
}

export const phone = () =>
  vi.stubGlobal('navigator', {
    ...navigator,
    userAgent: 'Android',
    userAgentData: { mobile: true },
  });

// happy-dom no baja scripts: el de Google se guarda sin cargar, y la prueba decide si cargó. Se
// guardan todos los de la corrida: el botón baja el script una sola vez por página.
const scripts: HTMLScriptElement[] = [];

type GoogleId = Record<'initialize' | 'renderButton' | 'disableAutoSelect', Mock>;

export function googleScript(): { id: GoogleId; load: () => void } {
  vi.spyOn(document.head, 'append').mockImplementation((script) => {
    scripts.push(script as HTMLScriptElement);
  });
  const id = { initialize: vi.fn(), renderButton: vi.fn(), disableAutoSelect: vi.fn() };
  return {
    id,
    load() {
      vi.stubGlobal('google', { accounts: { id } });
      for (const script of scripts) script.dispatchEvent(new Event('load'));
    },
  };
}

// El navegador puede, o no, usar un celular cercano por Bluetooth (R2.6).
export const nearby = (can: boolean) =>
  vi.stubGlobal('PublicKeyCredential', {
    getClientCapabilities: async () => ({ hybridTransport: can }),
  });
