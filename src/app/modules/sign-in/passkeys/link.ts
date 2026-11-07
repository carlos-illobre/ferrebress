// Vincular la huella en este celular (R2.2): la ofrece la hoja al entrar y la pide Configuración
// (04 · R6.3), que antes hace volver a confirmar quién es. Dice cómo salió.
import { signInApi } from '../api.ts';
import { allowOffline, passkeyLinked } from '../session.ts';
import { createPasskey } from './webauthn.ts';

export type Linked = 'linked' | 'other-account' | undefined;

export async function linkHere(): Promise<Linked> {
  const options = await signInApi.linkOptions();
  if (!options.ok) return undefined;
  const response = await createPasskey(options.data);
  if (!response) return undefined;
  const result = await signInApi.link(response);
  if (!result.ok) return result.error === 'phone-has-other-account' ? 'other-account' : undefined;
  passkeyLinked();
  // Con la huella, ya puede prender «Trabajar sin conexión» (15 · R1.3).
  if (result.data.offline) allowOffline();
  return 'linked';
}
