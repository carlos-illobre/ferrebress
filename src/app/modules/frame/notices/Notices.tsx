// Los avisos del marco (capítulo 00): la espera, la versión nueva, el bloqueo de «Hay que
// actualizar» y «Algo salió mal». El bloqueo y «Algo salió mal» se ven también en la entrada.
import { CrashDialog } from './CrashDialog.tsx';
import { UpdateBlock } from './UpdateBlock.tsx';
import './dialogs.css';
import './notices.css';

export { VersionNotice } from './VersionNotice.tsx';
export { WaitNotice } from './WaitNotice.tsx';

export const Dialogs = () => (
  <>
    <UpdateBlock />
    <CrashDialog />
  </>
);
