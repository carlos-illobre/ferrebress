// Lo que se hace con cada respuesta al cerrar sesiones y cortar celulares (02 · R5.3 a R5.7; 04 · R6 a
// R8), una sola vez para Usuarios y Configuración: llama al servidor, deja que cada pantalla ponga al
// día lo suyo (`update`) y recién ahí dice cómo salió. Un rechazo lo atiende quien llama (`refuse`).
import type { ClosedResponse, CutResponse } from '@ferrebress/shared/contracts/users';
import type { ApiResult } from '../../../platform/server/api.ts';
import { showToast } from '../../../ui/toast/Toast.tsx';
import { disableOffline } from '../offline/option.ts';
import { passkeyRemovedHere } from '../session.ts';
import { accessApi, type How, type Whom } from './api.ts';
import { accessTexts as t } from './texts.ts';

export type Refused = Extract<ApiResult<unknown>, { ok: false }>;
type Then<T> = {
  refuse: (result: Refused) => void;
  update?: (data: T) => unknown;
};

async function answer<T>(
  result: ApiResult<T>,
  { refuse, update }: Then<T>,
  say: (data: T) => void,
) {
  if (!result.ok) return refuse(result);
  await update?.(result.data);
  say(result.data);
  return result.data;
}

// «Cerrar», sin confirmación (cero si ya estaba cerrada).
export const closeSession = async (
  whom: Whom,
  session: { id: string; device: string },
  then: Then<ClosedResponse>,
) =>
  answer(await accessApi.closeSession(whom, session.id), then, ({ closed }) =>
    showToast(closed ? t.sessionClosed(session.device) : t.nothingToClose, 'log-out'),
  );

// «Cerrar todas», después de confirmar: nunca la del dispositivo que se está usando.
export const closeAll = async (whom: Whom, then: Then<ClosedResponse>) =>
  answer(await accessApi.closeAll(whom), then, ({ closed }) =>
    showToast(t.closedAll(closed), 'log-out'),
  );

// «Quitar» o cortar como perdido un celular. `said`: cómo se dice lo cortado como perdido; sin él
// (Configuración, que lo muestra en el recibo), no hay tostada.
export const cutPhone = async (
  whom: Whom,
  phone: { key: string; how: How; said?: { device: string; owner: string } },
  then: Then<CutResponse>,
) =>
  answer(await accessApi.cut(whom, phone.key, phone.how), then, (cut) => {
    if (!cut.sessions && !cut.passkey) showToast(t.nothingToCut, 'smartphone');
    else if (phone.how === 'remove') showToast(t.phoneRemoved(cut.sessions > 0), 'fingerprint');
    else if (phone.said)
      showToast(t.cut(phone.said.device, phone.said.owner, cut.sessions, cut.passkey), 'power');
  });

// Quitarle la huella al celular que se está usando (04 · R6.2): sigue adentro, sin huella y con
// «Trabajar sin conexión» apagada.
export const removeHere = async (then: Then<CutResponse>) =>
  answer(
    await accessApi.removeHere(),
    {
      ...then,
      update: (cut) => {
        passkeyRemovedHere();
        disableOffline();
        return then.update?.(cut);
      },
    },
    ({ passkey }) => showToast(passkey ? t.hereRemoved : t.nothingToCut, 'fingerprint'),
  );
