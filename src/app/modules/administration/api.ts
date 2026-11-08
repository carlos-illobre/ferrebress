// Las llamadas al servidor de Administración, una sola vez (diseño de 06, § 3). Todas necesitan
// conexión.
import type {
  AdministrationResponse,
  RoundingResponse,
  SaveSettingBody,
  SaveSettingResponse,
  SettingKey,
} from '@ferrebress/shared/contracts/administration';
import type { HoldersResponse } from '@ferrebress/shared/contracts/roles';
import { api } from '../../platform/server/api.ts';

export const administrationApi = {
  settings: () => api<AdministrationResponse>('/api/administration'),
  rounding: () => api<RoundingResponse>('/api/administration/rounding'),
  save: (key: SettingKey, body: SaveSettingBody) =>
    api<SaveSettingResponse>(`/api/administration/settings/${key}`, body),
  // Quién tiene el permiso, para decirlo sin él (R1.2, E02).
  holders: () => api<HoldersResponse>('/api/permissions/settings.change/holders'),
};
