// Lo que las vistas usan de este módulo (ADR-019): sus modelos, sus textos y las cuentas que
// muestran. Las vistas no importan nada más del módulo; index.ts es lo que va en el arranque.

export { useMenuCount, useMoreCount } from './counts.ts';
export {
  allowed,
  exists,
  firstOption,
  goToFirst,
  insideAt,
  moreFor,
  moreOptions,
  type Option,
  openOption,
  optionAt,
  partsFor,
  unavailable,
} from './menu.ts';
export { initials, roleNames } from './names.ts';
export { words as noPermissionWords } from './no-permission-texts.ts';
export { type Crash, crash, saveReport } from './notices/crash/crash.ts';
export { dismissed, update } from './notices/update/update.ts';
export { useCrash, useOpened, useUpdateRequired, useVersionNotice } from './notices-model.ts';
export {
  type LostPermission,
  type NoPermissionModel,
  useLostPermission,
  useNoPermission,
  usePermissionLost,
  useWork,
} from './permission.ts';
export { permissionIcons } from './permission-icons.ts';
export { frameSettings } from './settings.ts';
export { texts } from './texts.ts';
export { useWaitNotice } from './wait.ts';
