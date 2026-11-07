// Lo que se dice al cerrar sesiones y cortar celulares, igual en Usuarios y en Configuración (02 · R5;
// 04 · R6 a R8). Las tostadas son cortas: valen para el celular y la computadora.
export const accessTexts = {
  sessionClosed: (device: string) => `Sesión cerrada · ${device}`,
  nothingToClose: 'Ya estaba cerrada: no había nada que cortar',
  closedAll: (n: number) =>
    n === 0
      ? 'No había sesiones abiertas'
      : n === 1
        ? 'Se cerró la sesión'
        : `Se cerraron las ${n} sesiones`,
  phoneRemoved: (closed: boolean) =>
    `Celular quitado: ya no entra con la huella${closed ? ' y se cerró su sesión' : ''}`,
  hereRemoved: 'Quitaste la huella de este celular: entrás con Google',
  nothingToCut: 'Ese celular ya no tiene ni sesión ni huella: no había nada que cortar',
  cut: (device: string, name: string, sessions: number, passkey: boolean) => {
    const what = [
      sessions > 0 &&
        (sessions === 1 ? 'se cerró su sesión' : `se cerraron sus ${sessions} sesiones`),
      passkey && 'se le quitó la huella',
    ].filter(Boolean);
    const said = what.join(' y ');
    return `Cortado: ${device} de ${name}. ${said.charAt(0).toUpperCase()}${said.slice(1)}`;
  },
};
