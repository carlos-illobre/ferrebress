// Lo que comparten las pruebas de entrar sin conexión en el celular: una persona con identificador
// de verdad (la huella lo guarda), una huella de mentira que firma como esa persona, y cómo dejar
// todo como al principio.
import { act } from '@testing-library/preact';
import { vi } from 'vitest';
import { sessionClosed } from '../../../platform/server/api.ts';
import { person } from '../session.ts';
import { dropEntry, entries } from './pending.ts';
import { disableOffline } from './permit.ts';

export const eva = {
  userId: '0190a000-0000-7000-8000-0000000000aa',
  name: 'Eva Ríos',
  email: 'eva@example.com',
  role: 'Administrador',
  offline: true as const,
};

const b64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

// Lo que devuelve la huella: de quién es (`userId`) y si se verificó de verdad.
export function assertion(userId = eva.userId, verified = true) {
  const handle = Uint8Array.from(userId.replaceAll('-', '').match(/../g) as string[], (pair) =>
    Number.parseInt(pair, 16),
  );
  const authenticatorData = new Uint8Array(37);
  authenticatorData[32] = verified ? 0x05 : 0x01;
  return {
    id: 'credencial',
    response: {
      userHandle: b64(handle),
      authenticatorData: b64(authenticatorData),
      clientDataJSON: 'e30',
      signature: 'firma',
    },
  };
}

// Un celular con huella que contesta `answer`, o cancela si es null.
export function fakeFinger(answer: unknown = assertion()) {
  const get = vi.fn(async () =>
    answer ? { toJSON: () => answer } : Promise.reject(new DOMException('no', 'NotAllowedError')),
  );
  vi.stubGlobal('PublicKeyCredential', {
    parseRequestOptionsFromJSON: (options: unknown) => ({ parsed: options }),
  });
  vi.stubGlobal('navigator', {
    ...navigator,
    credentials: { get },
    userAgent: 'Android',
    userAgentData: { mobile: true },
  });
  return get;
}

export function resetOffline(): void {
  act(() => {
    disableOffline();
    for (const entry of entries()) dropEntry(entry.id);
    person.set(undefined);
    sessionClosed.set(undefined);
  });
  localStorage.clear();
}
