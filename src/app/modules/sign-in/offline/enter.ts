// Entrar sin conexión con la huella (15 · R2.1 a R2.6; diseño de 15, § 5): el celular arma el
// desafío que ata la firma a esta entrada, pide la huella y se fía del lector: comprueba solo que
// la huella sea de la persona del permiso y que se haya verificado. La verificación que vale es la
// del servidor, al volver la conexión. La llave de prueba se crea antes y va en el desafío: así la
// firma de la huella queda atada a una llave que no se puede copiar del celular. Entra directo al
// marco, sin «Entrando».
import { offlineChallenge } from '@ferrebress/shared/contracts/offline-sign-in';
import { deviceId } from '../../../platform/device/device.ts';
import { createProofKey } from '../../../platform/device/proof-key.ts';
import { signWithPasskey } from '../passkeys/webauthn.ts';
import { signedInOffline } from '../session.ts';
import { lastContactAt, offlineOption, offlineUntil } from './option.ts';
import { addEntry } from './pending.ts';

type Json = Record<string, unknown>;

const bytes = (value: unknown) =>
  Uint8Array.from(atob(String(value).replace(/-/g, '+').replace(/_/g, '/')), (char) =>
    char.charCodeAt(0),
  );

// La huella es de esta persona (su identificador, guardado al vincularla) y se verificó de verdad.
export function isOwn(response: Json, userId: string): boolean {
  try {
    const inner = response.response as Json;
    const handle = [...bytes(inner.userHandle)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    const flags = bytes(inner.authenticatorData)[32] ?? 0;
    return handle === userId.replaceAll('-', '') && (flags & 0x04) !== 0;
  } catch {
    return false;
  }
}

export async function withOfflinePasskey(): Promise<undefined> {
  const current = offlineOption.get();
  const contact = lastContactAt();
  if (!current || contact === undefined || !offlineUntil()) return undefined;
  const { userId } = current.person;
  const fields = {
    id: crypto.randomUUID(),
    userId,
    signedAt: new Date().toISOString(),
    lastContactAt: new Date(contact).toISOString(),
    proofPublicKey: await createProofKey(),
  };
  const challenge = await offlineChallenge({ ...fields, deviceId: deviceId() });
  const response = await signWithPasskey({ challenge, userVerification: 'required' });
  if (!response || !isOwn(response, userId)) return undefined;
  addEntry({ ...fields, response, ended: false });
  // El correo no se guarda en el celular: lo trae el servidor al confirmar.
  signedInOffline({ ...current.person, email: '' }, fields.id);
  return undefined;
}
