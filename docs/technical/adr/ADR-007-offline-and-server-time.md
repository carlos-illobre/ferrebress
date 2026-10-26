# ADR-007: Sin conexión, solo para atender, y la hora del servidor

**Estado:** aceptado (2026-10-26, decisiones 14, 17, 22 y 23)

## Decisión

- **Un ajuste por dispositivo.** Si habilitó trabajar sin conexión, baja lo justo para atender
  clientes y proveedores: productos con precio y códigos, proveedores, clientes. Después baja solo
  lo que cambió, con una marca de hasta dónde tiene. Si no lo habilitó, no usa IndexedDB para
  nada.
- **Lo que se hace sin conexión es un comando** con un identificador generado en el dispositivo:
  se guarda en una cola y se manda cuando vuelve la conexión. Repetirlo no lo duplica.
- **Cada módulo declara** qué baja y qué acciones puede encolar; la plataforma hace el resto.
  Desde el módulo de ventas, todo se programa con comandos repetibles, aunque el módulo `offline`
  llegue después.
- **La hora es la del servidor.** El dispositivo guarda la hora del servidor de cada respuesta y
  el valor de su cronómetro (`performance.now()`, que no depende del reloj del aparato). Lo hecho
  sin conexión toma la hora del servidor más lo medido. Si el aparato se reinició sin conexión y
  se perdió esa cuenta, usa la hora del dispositivo y queda marcada como «hora no confirmada».
- **Conflictos:** si dos dispositivos cambian la misma venta sin conexión, el servidor guarda la
  primera que llega y anota la segunda como anomalía para que un Administrador elija; las dos
  quedan en la auditoría.
- **Alguien dado de baja:** todo lo que llega con su sesión pasa a revisión de un Administrador,
  que lo aprueba o lo rechaza.

## Consecuencias

- Un dispositivo sin el ajuste no ocupa espacio, y busca siempre en el servidor.
- El tamaño de lo bajado se mide como meta de performance de cada módulo.
