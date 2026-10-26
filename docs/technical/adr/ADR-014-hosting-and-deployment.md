# ADR-014: Dónde corre y cómo se despliega

**Estado:** aceptado (2026-10-26, decisiones 25 y 32)

## Contexto

La infraestructura no cuesta nada hasta producción. Durante el desarrollo hay un solo ambiente, el
de pruebas; producción nace en la tercera etapa (decisión 25). El repositorio es público: ni
secretos ni datos de proveedores entran en él.

## Opciones

| Para | Opción | A favor | En contra |
|---|---|---|---|
| Máquina | **Oracle Cloud, capa gratuita (ARM)** | Gratis para siempre; hasta 4 núcleos y 24 GB, de sobra; una sola máquina con Docker | Si la cuenta queda inactiva, Oracle puede reclamar la máquina; hay que usarla |
| | Fly.io, Render, Railway | Despliegue cómodo | Las capas gratuitas cambian seguido y tienen límites de memoria o de base |
| | Una computadora en el local | Gratis y cerca | Depende del internet intermitente del local: justo lo que no tiene que frenar el mostrador |
| CI | **GitHub Actions** | Gratis para repositorios públicos; al lado del código | — |
| Imágenes | **GitHub Container Registry** | Gratis, junto al repositorio | — |

## Decisión

- Una máquina de la capa gratuita de Oracle (ARM), con Docker Compose (ADR-010) y Caddy (ADR-011).
- En cada subida a `main`, la CI corre `pnpm check`, construye las imágenes para ARM, las publica
  en GHCR y le avisa a la máquina, que baja la nueva versión, la levanta y vuelve a la anterior si
  no contesta bien.
- Producción se suma en la tercera etapa, en la misma máquina, desde una rama `production` que se
  promueve a pedido de Carlos; junto con ella, el plan de copias que se diseña en la segunda etapa.

## Consecuencias

- La máquina no publica más que el puerto de Caddy; el servidor y PostgreSQL quedan en la red
  interna de Docker.
