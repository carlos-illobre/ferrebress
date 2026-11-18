// Qué cambia cada ajuste de Administración, en una línea (06 · R1.3): largo en la computadora, que
// explica, y corto en el celular.
import type { SettingKey } from '@ferrebress/shared/contracts/administration';

type Words = { long: string; short: string };

export const what: Record<SettingKey | 'zone', Words> = {
  roundingStep: {
    long: 'El precio que calcula el sistema sube al múltiplo siguiente',
    short: 'Al múltiplo siguiente',
  },
  quickMargins: {
    long: 'Los cinco atajos para el margen de un producto, teclas 1 a 5',
    short: 'Teclas 1 a 5',
  },
  zone: {
    long: 'Se fijó al instalar: el día de las ventas y el cierre de caja',
    short: 'Se fija al instalar',
  },
  sessionIdle: {
    long: 'Sin usarla, la sesión se cierra pasado esto',
    short: 'Sin usarla, se cierra',
  },
  sessionMax: {
    long: 'Lo más que dura una sesión desde que se entró',
    short: 'Desde que se entró',
  },
  pairingDays: { long: 'Lo que dura el vínculo sin estar en espejo', short: 'Sin estar en espejo' },
  offlineHours: {
    long: 'Lo que se puede entrar con la huella sin internet desde el último contacto con el servidor; más horas es más tiempo en que un celular perdido se abre sin que el servidor se entere',
    short: 'Con la huella, sin internet',
  },
  googleAttempts: {
    long: 'Cuántas veces por minuto se puede probar entrar con Google desde un dispositivo',
    short: 'Por minuto, por dispositivo',
  },
  passkeyAttempts: {
    long: 'Cuántas veces por minuto se puede probar entrar con la huella desde un dispositivo',
    short: 'Por minuto, por dispositivo',
  },
  failedAttempts: {
    long: 'Cuántos intentos fallidos por hora tiene una cuenta, desde cualquier dispositivo, contados aparte para Google y la huella',
    short: 'Por hora, por cuenta',
  },
  reviewPercent: {
    long: 'Un costo que cambia más que esto se marca para revisar antes de aplicar la lista',
    short: 'Costo que cambia más que esto',
  },
  goneWarnPercent: {
    long: 'Si una lista da de baja más productos del proveedor que esto, se avisa antes de aplicarla',
    short: 'Bajas de más se avisan',
  },
  maxFileMb: {
    long: 'El archivo más grande que se acepta como lista de precios',
    short: 'El archivo más grande',
  },
  confirmRows: {
    long: 'Una planilla con más filas que esto se pregunta antes de leerla; no es un tope',
    short: 'Más filas se preguntan',
  },
  filesMb: {
    long: 'Lo que ocupan entre todos los archivos de las listas; al pasarlo se borran los más viejos',
    short: 'Al pasarlo, se borran los viejos',
  },
  unappliedFileDays: {
    long: 'El archivo de una lista que nunca se aplicó se borra pasados estos días',
    short: 'Se borran pasados los días',
  },
};
