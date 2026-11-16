// La capa de la navegación con el teclado (00 · R2.1 a R2.7, ADR-019): el motor es el paquete
// @ferrebress/keyboard. La encuentra main.tsx sola (ADR-020); borrar esta carpeta la saca sin romper
// nada.
import { startNavigation } from '@ferrebress/keyboard';
import { isPhone } from '../../platform/device/device.ts';
import { navigationKeys } from './keys.ts';

export const start = () => startNavigation({ touchOnly: isPhone(), ...navigationKeys });
