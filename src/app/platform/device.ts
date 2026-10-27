// El dispositivo (diseño de 01, § 10): su identificador, que se guarda la primera vez; si es un
// celular; y si su navegador puede entrar con un celular cercano por Bluetooth (R2.6).
import { readStored, store } from './storage.ts';

const deviceIdKey = 'ferrebress.device-id';

export function deviceId(): string {
  const stored = readStored<string>(deviceIdKey);
  if (stored) return stored;
  const id = crypto.randomUUID();
  store(deviceIdKey, id);
  return id;
}

type UserAgentData = { mobile?: boolean };

export function isPhone(): boolean {
  const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  return data?.mobile ?? /Android|iPhone/.test(navigator.userAgent);
}

type Capabilities = { hybridTransport?: boolean };
type WithCapabilities = { getClientCapabilities?: () => Promise<Capabilities> };

export async function canUseNearbyPhone(): Promise<boolean> {
  const credential = globalThis.PublicKeyCredential as unknown as WithCapabilities | undefined;
  const capabilities = await credential?.getClientCapabilities?.().catch((): Capabilities => ({}));
  return capabilities?.hybridTransport === true;
}
