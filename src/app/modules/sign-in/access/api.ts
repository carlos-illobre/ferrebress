// Las llamadas al servidor de lo que se ve y se corta de las sesiones y las huellas de una persona
// (02 · R5; 04 · R6 a R9; diseño de 04b, § 3), una sola vez: a quién, por parámetro. Usuarios corta a
// la persona elegida, con su permiso; lo mío, a la de la sesión, sin ninguno.
import type {
  DeviceNameResponse,
  MyDevicesResponse,
} from '@ferrebress/shared/contracts/device-settings';
import type { ClosedResponse, CutResponse } from '@ferrebress/shared/contracts/users';
import { api } from '../../../platform/server/api.ts';

// A quién: una persona elegida en Usuarios, o la de la sesión.
export type Whom = { userId: string } | 'me';

// Cómo se corta un celular: «Quitar» su huella o cortarlo como perdido.
export type How = 'remove' | 'lost';

const at = (whom: Whom) =>
  whom === 'me' ? '/api/me' : `/api/users/${encodeURIComponent(whom.userId)}`;
const one = (id: string) => encodeURIComponent(id);

export const accessApi = {
  closeSession: (whom: Whom, sessionId: string) =>
    api<ClosedResponse>(`${at(whom)}/sessions/${one(sessionId)}/close`, {}),
  closeAll: (whom: Whom) => api<ClosedResponse>(`${at(whom)}/sessions/close`, {}),
  cut: (whom: Whom, key: string, how: How) =>
    whom === 'me'
      ? api<CutResponse>(`/api/me/devices/${one(key)}/cut`, { how })
      : api<CutResponse>(`${at(whom)}/phones/${one(key)}/cut`, {
          from: how === 'lost' ? 'lost' : 'card',
        }),
  // Quitarle la huella al celular que se está usando (04 · R6.2).
  removeHere: () => api<CutResponse>('/api/me/passkey/remove', {}),
  mine: () => api<MyDevicesResponse>('/api/me/devices'),
  rename: (name: string) => api<DeviceNameResponse>('/api/me/device-name', { name }),
};
