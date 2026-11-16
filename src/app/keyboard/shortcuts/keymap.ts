// Qué tecla o combinación ejecuta cada atajo, en el contexto de su pantalla (ADR-019): el comando,
// «<pantalla>.<comando>», y su tecla. Cambiar una tecla es cambiar una línea de este archivo, sin
// tocar la pantalla ni su lógica. Lo controla keymap.test.ts: cada comando existe y ninguna
// combinación se repite entre una pantalla y las de toda la aplicación. Dentro de una pantalla, una
// combinación puede repetirse solo entre comandos que nunca se pueden usar a la vez: se prueba
// primero el que está antes en el archivo de la pantalla.
export const keymap: Record<string, string> = {
  // Más → Administración (06 · R1.8): la tecla de cada ajuste, y «Reintentar».
  'administration.retry': 'Alt+R',
  'administration.roundingStep': 'Alt+R',
  'administration.quickMargins': 'Alt+M',
  'administration.zone': 'Alt+Z',
  'administration.sessionIdle': 'Alt+S',
  'administration.sessionMax': 'Alt+T',
  'administration.pairingDays': 'Alt+V',
  // La confirmación del redondeo (06 · R3.4).
  'administration-confirm.confirm': 'Alt+P',
  'administration-confirm.cancel': 'Alt+C',
  'administration-confirm.retry': 'Alt+R',
  'administration-confirm.later': 'Alt+A',
  // Más → Configuración (04 · R1.9, R9.2).
  'device-settings.animations': 'Alt+D',
  'device-settings.otherTimeFormat': 'Alt+H',
  'device-settings.reset': 'Alt+O',
  'device-settings.rename': 'Alt+K',
  'device-settings.clearName': 'Alt+B',
  'device-settings.install': 'Alt+I',
  'device-settings.closeAll': 'Alt+X',
  'device-settings.idea1': 'Alt+1',
  'device-settings.idea2': 'Alt+2',
  'device-settings.idea3': 'Alt+3',
};
