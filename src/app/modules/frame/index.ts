// El módulo del capítulo 00 en la aplicación: lo que hace el marco que rodea cada pantalla y sus
// avisos (la versión nueva, «Algo salió mal»). Su vista está en views/basic/frame.

export { isMenuPath, moreOptions, parts } from './menu.ts';
export { forgetReport, watchCrashes } from './notices/crash/crash.ts';
export {
  announceUpdate,
  updateOnOpen,
  updateOnSignIn,
  watchBackground,
} from './notices/update/update.ts';
export { groupIcons, permissionIcons } from './permission-icons.ts';
export { discardWork, halfDone, registerWork, type Work } from './work.ts';
