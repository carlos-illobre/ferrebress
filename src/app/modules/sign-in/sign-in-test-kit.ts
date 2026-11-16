// Lo que comparten las pruebas de la entrada: una persona, las respuestas del servidor al entrar y
// un navegador con huella de mentira (WebAuthn y su JSON).
import { act, screen } from '@testing-library/preact';
import { type Mock, vi } from 'vitest';
import { administrator } from '../../testing/person.ts';

export const ana = {
  userId: 'u1',
  name: 'Ana Gómez',
  email: 'ana@example.com',
  ...administrator,
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
    businessTimeZone: 'America/Argentina/Buenos_Aires',
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

// Si lo de la tarjeta de la entrada quedó inerte debajo de la espera.
export const cardInert = (card: HTMLElement) =>
  card.querySelector('.card-body')?.hasAttribute('inert') === true;

// Las partes de la entrada que las pruebas miran y que no tienen rol ni texto propio: solo este
// conductor sabe cómo están armadas (ADR-019).
const parts = {
  qr: '.qr',
  qrDrawn: '.qr svg path',
  qrRead: '.qr.read',
  note: '.note',
  testBanner: '.test-banner',
  deviceName: '.status-device',
  google: '.google',
  googleFrameElement: 'iframe',
} as const;
type Part = keyof typeof parts;

export const one = (name: Part, root: ParentNode = document) =>
  root.querySelector<HTMLElement>(parts[name]);
// El lugar del botón de Google en la entrada.
export const googlePlace = () =>
  one('google', screen.getByRole('region', { name: 'Entrar' })) as HTMLElement;
// Si el botón de Google llegó después de verse el hilo, y si quedó apagado.
export const arrivedLate = (place: Element) => place.classList.contains('arrived');
export const isOff = (place: Element) => place.classList.contains('off');
// El botón de Google apagado: gris y sin poder tocarse.
export const googleOff = (card: Element) => {
  const place = one('google', card) as HTMLElement;
  return place.hasAttribute('inert') && isOff(place);
};
