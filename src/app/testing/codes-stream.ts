// Para las pruebas de la entrada de la computadora: el pedido que abre el canal con el tema de su
// código QR, y lo que manda el servidor por él (el saludo del canal y los eventos del tema).
export const codesPath = (screen = 0) => `/api/realtime?s=sign-in.codes%3A${screen}`;

export const codesStream = (...events: [string, object][]) =>
  `event: hello\ndata: {"channel":"${'c'.repeat(22)}"}\n\n` +
  events
    .map(([type, data]) => `event: sign-in.codes\ndata: ${JSON.stringify({ type, ...data })}\n\n`)
    .join('');
