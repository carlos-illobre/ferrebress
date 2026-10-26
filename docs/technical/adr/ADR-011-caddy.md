# ADR-011: Caddy como puerta de entrada

**Estado:** aceptado (2026-10-26, decisión 32)

## Contexto

¿Hace falta algo delante del servidor? Alguien tiene que:

1. Atender HTTPS con un certificado válido y renovarlo solo (HTTPS siempre).
2. Servir la aplicación (archivos estáticos) con compresión y cabeceras de caché, rápido.
3. Pasar a Node solo lo que es de la API, con HTTP/2 hacia el navegador.
4. Ser lo único publicado a internet.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| **Caddy** | Certificados automáticos y su renovación sin configurar nada; HTTP/2 y HTTP/3; comprime y sirve estáticos muy rápido; la configuración son unas 20 líneas; un solo binario | Un contenedor más (unos 40 MB de memoria) |
| Nada: Node atiende todo | Una pieza menos | Hay que programar la obtención y renovación de certificados y el servido de estáticos con caché y compresión: código propio para algo que no es del negocio; Node gasta su tiempo en archivos en vez de en la API |
| nginx + certbot | Muy probado y rápido | Dos piezas, más configuración, la renovación es un proceso aparte |
| Traefik | Certificados automáticos | Pensado para muchos servicios con etiquetas; más complejo para una sola aplicación |
| Cloudflare Tunnel | No abre puertos; certificados y caché de Cloudflare; oculta la dirección de la máquina | Depende de un tercero; todo el tráfico pasa por él; otra cuenta que administrar |

## Decisión

Caddy, con un `Caddyfile` mínimo: HTTPS, los archivos de la aplicación con compresión y caché
larga (los nombres llevan su huella), `/api/*` hacia el servidor, y SSE sin acumular respuestas
(ADR-003). Nada de lógica en Caddy: ni sesiones ni permisos, que los resuelve el servidor.

## Consecuencias

- Si algún día se quiere no abrir puertos, Cloudflare Tunnel se pone delante de Caddy sin cambiar
  nada más.
