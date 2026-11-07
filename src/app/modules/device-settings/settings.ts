// Los topes y tiempos de Configuración (diseño de 04).
const second = 1000;

export const deviceSettingsSettings = {
  // Cuántas personas guarda un dispositivo; la que cambió algo hace más tiempo sale primero (§ 2).
  maxPeople: 20,
  // El aviso para instalar aparece un momento después de llegar al marco, no encima del cambio de
  // pantalla (04 · R4.5).
  offerAfterMs: second,
  // Lo mío (diseño de 04b, § 7): hasta cuándo una sesión dice «usada ahora», cuánto dura el brillo
  // al guardar el nombre y cuánto se puede mover el dedo apoyado en «Se me perdió» sin dejar de cortar.
  usedNowMs: 5 * 60 * second,
  shineMs: 900,
  stillFingerPx: 10,
};
