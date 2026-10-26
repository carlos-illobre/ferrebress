# Decisiones técnicas (ADR)

Una decisión técnica que afecta a más de un módulo, con las opciones consideradas y el porqué.
Un ADR no se reescribe: si cambia, se agrega una enmienda o uno nuevo que lo reemplaza.

Los ADR de `ferre` son antecedente
([docs/adr](https://github.com/carlos-illobre/ferre/tree/master/docs/adr)) y se pueden
cuestionar; los que valgan acá se reescriben como ADR de este repositorio.

| ADR | Decisión | Estado |
|---|---|---|
| [ADR-001](ADR-001-one-modular-server.md) | Un solo servidor partido en módulos | Aceptado |
| [ADR-002](ADR-002-one-responsive-app.md) | Una sola aplicación, una pantalla para el celular y la computadora | Aceptado |
| [ADR-003](ADR-003-realtime-connections.md) | Las conexiones en un solo módulo, con cuatro formas | Aceptado |
| [ADR-004](ADR-004-audit-log-in-sqlite.md) | La auditoría en SQLite, aparte de PostgreSQL | Aceptado |
| [ADR-005](ADR-005-fast-tests.md) | Pruebas rápidas, sin Docker y con cobertura total | Aceptado |
| [ADR-006](ADR-006-sign-in-without-passwords.md) | Entrar sin contraseñas | Aceptado |
| [ADR-007](ADR-007-offline-and-server-time.md) | Sin conexión, solo para atender, y la hora del servidor | Aceptado |
