// Lo que comparten las pruebas de la entrada: una persona, las respuestas del servidor al entrar y
// un navegador con huella de mentira (WebAuthn y su JSON).
import { act } from '@testing-library/preact';
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

// happy-dom no carga el marco del botón de Google: la prueba hace de marco. `ready` dice que está
// listo, `drawn` que lo dibujó, `shown` es lo que la entrada le pidió dibujar y `credential` le pasa
// un pase de Google.
export function googleFrame(): {
  shown: Mock;
  ready: () => void;
  drawn: () => void;
  credential: (credential: string) => void;
} {
  const inside = { postMessage: vi.fn() };
  vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue(
    inside as unknown as Window,
  );
  const say = (data: unknown) =>
    act(() => {
      dispatchEvent(
        new MessageEvent('message', { data, origin: location.origin, source: inside as never }),
      );
    });
  return {
    shown: inside.postMessage,
    ready: () => say({ type: 'ready' }),
    drawn: () => say({ type: 'drawn' }),
    credential: (credential: string) => say({ type: 'credential', credential }),
  };
}
