// Lo que las vistas usan de Administración (ADR-019): el modelo de la pantalla, sus textos y las
// cuentas que muestran. Las vistas no importan nada más del módulo; index.ts es lo que va en el
// arranque.
import { serverNow } from '../../platform/server/clock.ts';
import { expiresOn } from './logic.ts';

export {
  counterDay,
  type ListSetting,
  listSettings,
  maxEnds,
  pesos,
  shown,
  thousands,
  weeks,
} from './logic.ts';
export { type AdminPage, openAdminPage, useAdminLinks, useAdminPage } from './pages.ts';
export { administrationSettings } from './settings.ts';
export { groupOf, names, type Panel, pagesTexts, texts, what } from './texts.ts';
export {
  type Administration,
  type Confirm,
  type Note,
  useAdministration,
} from './useAdministration.ts';

// Hasta cuándo dura un vínculo de tantos días, contando desde ahora en el servidor (R7).
export const expiresIn = (days: number) => expiresOn(days, (serverNow() as Date).getTime());
