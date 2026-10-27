# ADR-010: Contenedores con Docker Compose, solo para correr el sistema

**Estado:** aceptado

## Contexto

En la máquina corren tres piezas: la puerta de entrada (ADR-011), el servidor y PostgreSQL. Tienen
que arrancar solas, actualizarse sin cortar y volver atrás si una versión falla. Las pruebas
unitarias no necesitan contenedores (ADR-005).

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| **Docker Compose** | Un archivo describe todo; lo mismo en la máquina de desarrollo, en la CI y en el servidor; versiones fijas de cada pieza; volver atrás es cambiar la etiqueta de la imagen | Una capa más; algo de memoria para el motor |
| Servicios de systemd sin contenedores | Lo más liviano | Instalar y actualizar PostgreSQL, Node y Caddy a mano en la máquina; distinto en cada lugar |
| Podman | Sin un proceso de fondo con privilegios | Compose funciona con diferencias; menos documentación |
| Kubernetes | Escala y alta disponibilidad | Muchísimo más complejo de lo que hace falta |

## Decisión

Docker Compose, con el motor sin privilegios de administrador (rootless), un solo `compose.yml` y
el `.env` como única fuente de lo que cambia entre ambientes. Las imágenes se construyen en la CI
(ADR-014). Las pruebas unitarias corren sin Docker; las de punta a punta levantan el compose.

## Consecuencias

- La máquina solo necesita Docker; todo lo demás viene en las imágenes.
