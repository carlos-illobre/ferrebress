// Sube cuando un contrato de la API cambia de forma incompatible. La aplicación la manda en
// X-App-Version y el servidor rechaza las menores que la mínima que entiende (00 · R5.5).
export const contractVersion = 1;
export const appVersionHeaderName = 'X-App-Version';
export const deviceIdHeaderName = 'X-Device-Id';
