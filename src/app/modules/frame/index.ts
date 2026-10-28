// El módulo del capítulo 00 en la aplicación: el marco que rodea cada pantalla, el marco del
// ambiente de pruebas y los avisos (la versión nueva, «Algo salió mal»), que también usa la entrada.

export { moreOptions, parts } from './menu.ts';
export { forgetReport, watchCrashes } from './notices/crash/crash.ts';
export { Dialogs } from './notices/Notices.tsx';
export { announceUpdate, updateOnOpen, watchBackground } from './notices/update/update.ts';
export { Frame, type FrameProps, TestEnvironment } from './screens/Frame/Frame.tsx';
export { discardWork, halfDone, registerWork, type Work } from './work.ts';
