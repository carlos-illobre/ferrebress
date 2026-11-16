// Lo que las vistas usan de este módulo (ADR-019): sus modelos, sus textos y las cuentas que
// muestran. Las vistas no importan nada más del módulo; index.ts es lo que va en el arranque.
export { codeOf } from './codes/qr.ts';
export { useComputerQr } from './codes/useComputerQr.ts';
export type { usePhoneCode } from './codes/usePhoneCode.ts';
export { confirmTexts } from './confirm-texts.ts';
export {
  EntranceContext,
  type EntranceProps,
  fingerOff,
  limited,
  offline,
  useEntrance,
  useEntranceModel,
  useEntranceModelContext,
} from './entrance.ts';
export { googleFramePath } from './google/messages.ts';
export type { GooglePhase } from './google/phase.ts';
export { minutes, type Notice, useNotice } from './notice.ts';
export { withOfflinePasskey } from './offline/enter.ts';
export { whenText } from './offline/when.ts';
export { useOffer } from './passkeys/useOffer.ts';
export { person } from './session.ts';
export { texts } from './texts.ts';
export { useConfirm } from './useConfirm.ts';
export { entering, type Way, withPasskey } from './useSignIn.ts';
