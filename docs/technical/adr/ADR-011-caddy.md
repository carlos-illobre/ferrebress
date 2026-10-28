# ADR-011: Caddy como puerta de entrada

**Estado:** aceptado

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

- **Un Caddy propio de Ferrebress**, en su compose, con un `Caddyfile` mínimo: los archivos de la
  aplicación con compresión y caché larga (los nombres llevan su huella), `/api/*` hacia el
  servidor, SSE sin acumular respuestas (ADR-003), las cabeceras de seguridad y el tamaño máximo de
  los pedidos. Nada de lógica: ni sesiones ni permisos, que los resuelve el servidor.
- **HTTPS lo atiende el proxy de la máquina**, otro Caddy que comparten todas las aplicaciones de
  la VM y que tiene los puertos 80 y 443. Ferrebress le agrega un archivo con sus dominios
  (`/etc/caddy/sitios/ferrebress.caddy`), que solo pasa cada dominio al puerto local de su ambiente
  y la dirección real de quien se conecta en `X-Forwarded-For`. El Caddy de Ferrebress solo
  escucha en `127.0.0.1`, confía en esa cabecera solo si viene del proxy, se queda con la
  dirección que agregó el proxy (`trusted_proxies_strict`) y se la pasa al servidor, una sola, en
  `X-Real-IP`.
- **Por qué no alcanza con el proxy de la máquina:** la configuración del Caddy propio cambia con el
  código y se despliega con cada commit; la aplicación viaja en su imagen, así que volver atrás es
  cambiar de versión; y las pruebas de punta a punta usan la misma configuración que la máquina.
  En el proxy de la máquina, cada cambio necesitaría que un administrador escriba en `/etc/caddy`,
  y el despliegue de Ferrebress no tiene, ni debe tener, permisos sobre el proxy que atiende a las
  otras aplicaciones.

## Consecuencias

- Si algún día se quiere no abrir puertos, Cloudflare Tunnel se pone delante del proxy de la
  máquina sin cambiar nada más.
- Un dominio nuevo (el de producción) es una línea en el archivo de Ferrebress del proxy de la
  máquina, que agrega un administrador una vez.
- Cuesta un contenedor de unos 40 MB de memoria y un salto local más por pedido.
