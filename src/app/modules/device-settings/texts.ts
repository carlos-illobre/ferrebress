// Los textos de Configuración (capítulo 04): largos en la computadora y cortos en el celular
// (00 · R3); los que la regla fija, tal cual (R4.3, R4.5, R5.3).
export const texts = {
  title: 'Configuración',
  forYou: { long: 'Solo para vos, en esta computadora', short: 'Solo para vos, en este celular' },
  summary: 'Así la tenés:',
  reset: { long: 'Volver a como viene', short: 'Como viene' },
  resetDone: 'Volvió a como viene',
  here: 'En esta computadora',
  animations: {
    name: 'Animaciones',
    what: {
      long: 'Las ventanas, las hojas y los avisos aparecen con un movimiento corto. Apagadas, todo aparece en el acto.',
      short: 'Pantallas y avisos con un movimiento corto',
    },
    moving: {
      long: 'Así se mueve ahora. Corto: nunca te hace esperar.',
      short: 'Así se mueve ahora. Corto, nunca te hace esperar.',
    },
    still: {
      long: 'Así, en el acto. Aparece y desaparece, sin moverse.',
      short: 'Así, en el acto. Sin movimiento.',
    },
    waits: 'La espera gira siempre',
    system: {
      long: 'Este dispositivo ya pide no animar. Manda el sistema: para cambiarlo, andá a sus ajustes de accesibilidad.',
      short: 'Este dispositivo ya pide no animar',
    },
  },
  time: {
    name: 'Formato de la hora',
    what: {
      long: 'Cambia solo cómo se escribe la hora en toda la aplicación. La hora es la del negocio, la misma para todos.',
      short: 'Solo cómo se escribe; la hora es la del negocio',
    },
    h24: { name: '24 horas', detail: 'Siempre así' },
    h12: { name: 'a. m./p. m.', detail: 'De 1 a 12' },
    seenIn: 'Se ve así en',
    auditLog: 'Quién hizo qué',
  },
  install: {
    name: { long: 'Instalar en este dispositivo', short: 'Instalar en este celular' },
    what: {
      long: 'Queda con su ícono, para abrirla como cualquier otra aplicación.',
      short: 'Abrila desde un ícono',
    },
    button: 'Instalar',
    done: 'Listo',
    installedName: 'Ya está instalada',
    installedWhat: 'Abrila desde su ícono.',
    ios: 'Tocá Compartir y después Agregar a inicio',
    installedToast: 'Listo: Ferrebress quedó con su ícono',
  },
  offlineOn: 'Entrás con tu huella aunque no haya internet, hasta 24 h',
  chips: {
    moving: 'Con movimiento',
    still: 'En el acto',
    browser: { long: 'En el navegador', short: 'Navegador' },
    installed: 'Instalada',
    offlineOn: 'También sin conexión',
    offlineOff: 'Solo con internet',
  },
  yours: 'Lo tuyo',
  soon: 'Pronto',
  notYet: (name: string) => `${name} · pronto. Todavía no está.`,
  later: [
    { name: 'Mis celulares con huella', what: 'Dónde entrás con huella', icon: 'fingerprint' },
    { name: 'Mis sesiones', what: 'Dónde tenés sesión', icon: 'monitor-smartphone' },
    { name: 'Cortar mi celular perdido', what: 'Que nadie entre con él', icon: 'plug-off' },
    { name: 'Nombre del dispositivo', what: 'Cómo la ves en la lista', icon: 'pencil-line' },
  ],
  kept: 'Queda guardado en esta computadora, para vos: no cambia nada de otras personas ni de otros dispositivos, y vuelve cuando entres de nuevo. Con el celular en espejo, cada uno tiene lo suyo.',
  // El aviso para instalar (R4.5).
  offer: {
    title: 'Instalá Ferrebress para abrirla desde un ícono',
    quick: 'Abre al toque',
    full: 'Pantalla completa',
    install: 'Instalar',
    notNow: 'Ahora no',
    later: 'Si cambiás de idea, está en Más → Configuración',
  },
} as const;
