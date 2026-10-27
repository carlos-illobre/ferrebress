# ADR-014: Dónde corre y cómo se despliega

**Estado:** aceptado

## Contexto

La infraestructura no cuesta nada hasta producción. Durante el desarrollo hay un solo ambiente, el
de pruebas; producción nace en la tercera etapa. El repositorio es público: ni
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

## Cómo se entera la máquina

La CI no entra a la máquina:

1. La CI publica las imágenes en GHCR con la etiqueta del commit y manda un **aviso vacío** a un
   canal de ntfy.sh (servicio gratuito de notificaciones). El aviso no dice qué desplegar.
2. En la máquina, un servicio de usuario de systemd (sin permisos de administrador) tiene **una
   sola conexión saliente** abierta a ese canal. No abre ningún puerto hacia adentro.
3. Al recibir un aviso, corre `deploy.sh`, que **le pregunta a GitHub** cuál es el último commit de
   la rama de su ambiente (`main` para pruebas; `production`, en la tercera etapa), verifica que
   sus imágenes estén publicadas, baja el `compose.yml` de ese commit, fija la etiqueta, levanta
   los contenedores y espera a que estén sanos; si no lo están, vuelve a la etiqueta anterior.
4. Un candado evita dos despliegues a la vez. Al arrancar la máquina, `deploy.sh` corre una vez,
   por si se perdió un aviso. Opcionalmente, el resultado se manda a otro canal de ntfy.


| | Aviso y la máquina pregunta (elegida) | SSH con una llave limitada (descartada) |
|---|---|---|
| Entrada a la máquina desde afuera | Ninguna | La CI entra por SSH |
| Secreto en GitHub | Solo el nombre del canal | Una llave SSH |
| Aviso falso | Solo provoca una consulta a GitHub: despliega lo que ya está en la rama | Con la llave robada, se puede pedir desplegar cualquier etiqueta publicada |
| Dependencia externa | ntfy.sh; si se cae, se despliega a mano o al reiniciar | Ninguna |
