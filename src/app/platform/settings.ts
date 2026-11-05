// Los tiempos y topes de la plataforma de la aplicación: todos con nombre, en un lugar. Cada módulo
// tiene los suyos en su `settings.ts`; las pruebas los cambian acá para no esperar de verdad.
const second = 1000;
const minute = 60 * second;

export const platformSettings = {
  // Sin conexión, cuándo vuelve a probar con la pantalla a la vista: a los 2, 4, 8, 16 y 32 s y
  // después cada minuto (01 · R2.8, 03 · R3.4).
  reconnect: {
    delaysMs: [2 * second, 4 * second, 8 * second, 16 * second, 32 * second],
    everyMs: minute,
  },
  // Lo que tarda: la marca de espera a los 300 ms y la barra a los 2 s (00 · R7.2, R7.3).
  waiting: { markAfterMs: 300, barAfterMs: 2 * second },
  // Con un 429 que no dice cuánto esperar, un minuto.
  retryAfterMs: minute,
  // El canal en tiempo real: sin nada del servidor en 55 s (el latido es cada 40 s), está cortado.
  realtime: { silenceMs: 55 * second },
  // El medidor (diseño de 05, § 8.1): el último minuto en casillas de un segundo, cuánto suma la
  // conexión (TCP y TLS) a cada trozo que llega y cada cuánto se vuelve a dibujar.
  meter: { windowSeconds: 60, overheadBytes: 80, redrawMs: 5 * second },
  // El respaldo por el servidor junta lo de 50 ms en un pedido, de a uno por vez, y cada pedido lleva
  // como mucho 100 mensajes y 60 KB: el servidor no acepta más (diseño de 03, § 4.3 y § 10.2).
  relayed: { batchMs: 50, maxMessages: 100, maxBytes: 60 * 1024 },
  // El que sigue espera que el otro le mande lo que pidió antes de pedirlo él (§ 5.3); lo que cambia
  // en el espejo por el servidor se junta 150 ms, de cada clave el último (§ 4.3).
  mirror: { followerWaitMs: 3 * second, coalesceMs: 150 },
  // El directo: cuánto espera para abrir, cuánto sin respuesta lo da por perdido, cuánto espera
  // candidatos de más y el tope para juntarlos (diseño de 03, § 4.2).
  direct: { openWithinMs: 5 * second, lostAfterMs: 5 * second, quietMs: 300, capMs: second },
  // El que sigue espera que el otro le mande lo que pidió antes de pedirlo él (diseño de 03, § 5.3).
  // Cada cuánto mira la cámara si hay un código.
  camera: { scanEveryMs: 250 },
};
