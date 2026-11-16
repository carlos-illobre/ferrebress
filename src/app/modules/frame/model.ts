// Lo que las vistas usan de este módulo (ADR-019): sus modelos, sus textos y las cuentas que
// muestran. Las vistas no importan nada más del módulo; index.ts es lo que va en el arranque.
export { useCollapse } from './behavior/useCollapse.ts';
export { type Place, px, usePanels } from './behavior/usePanels.ts';
export { usePhoneMore } from './behavior/usePhoneMore.ts';
export { useTip } from './behavior/useTip.ts';
export {
  FrameContext,
  type FrameLink,
  type FrameState,
  initials,
  roleNames,
  shake,
  useFrame,
} from './context.ts';
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
export { type Crash, crash, saveReport } from './notices/crash/crash.ts';
export { dismissed, update } from './notices/update/update.ts';
export {
  type LostPermission,
  useLostPermission,
  useNoPermission,
  usePermissionLost,
  useWork,
} from './permission.ts';
export { permissionIcons } from './permission-icons.ts';
export { frameSettings } from './settings.ts';
export { texts } from './texts.ts';
export { useWaitNotice } from './wait.ts';
