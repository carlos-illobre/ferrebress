# Decisiones técnicas (ADR)

Una decisión técnica que afecta a más de un módulo, con las opciones consideradas y el porqué.
Cada ADR describe la decisión vigente, con sus opciones y el porqué. Si cambia, se reescribe; la
historia está en los commits.

Cada tecnología elegida tiene su ADR, con las opciones, los pros, los contras y el porqué.

| ADR | Decisión | Estado |
|---|---|---|
| [ADR-001](ADR-001-one-modular-server.md) | Un solo servidor partido en módulos | Aceptado |
| [ADR-002](ADR-002-one-responsive-app.md) | Una sola aplicación, una pantalla para el celular y la computadora | Aceptado |
| [ADR-003](ADR-003-realtime-connections.md) | Las conexiones en un solo módulo, con cuatro formas | Aceptado |
| [ADR-004](ADR-004-audit-log-in-sqlite.md) | La auditoría en SQLite, aparte de PostgreSQL | Aceptado |
| [ADR-005](ADR-005-fast-tests.md) | Pruebas rápidas, sin Docker y con cobertura total | Aceptado |
| [ADR-006](ADR-006-sign-in-without-passwords.md) | Entrar sin contraseñas | Aceptado |
| [ADR-007](ADR-007-offline-and-server-time.md) | Sin conexión, solo para atender, y la hora del servidor | Aceptado |
| [ADR-008](ADR-008-typescript-and-node.md) | TypeScript sobre Node, con pnpm | Aceptado |
| [ADR-009](ADR-009-postgresql.md) | PostgreSQL para el estado actual | Aceptado |
| [ADR-010](ADR-010-docker-compose.md) | Contenedores con Docker Compose, solo para correr el sistema | Aceptado |
| [ADR-011](ADR-011-caddy.md) | Caddy como puerta de entrada | Aceptado |
| [ADR-012](ADR-012-server-libraries.md) | Hono, Kysely y Zod en el servidor | Aceptado |
| [ADR-013](ADR-013-app-libraries.md) | Preact, Vite y CSS sin herramientas en la aplicación | Aceptado |
| [ADR-014](ADR-014-hosting-and-deployment.md) | Dónde corre y cómo se despliega | Aceptado |
| [ADR-015](ADR-015-sessions-not-jwt.md) | Sesiones propias guardadas en el servidor, no JWT | Aceptado |
