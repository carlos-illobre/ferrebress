// Las pantallas de la entrada en esta vista: la entrada, la cámara y las hojas del celular, que pone la
// aplicación. Volver a confirmar quién es se baja recién cuando hace falta (02 · R3.8).
export { Entrance } from './Entrance/Entrance.tsx';
export { Camera } from './Sheets/Camera.tsx';
export { CodeSheet } from './Sheets/CodeSheet.tsx';
export { OfferSheet } from './Sheets/OfferSheet.tsx';

export const loadConfirmSheet = () => import('./Sheets/ConfirmSheet.tsx');
