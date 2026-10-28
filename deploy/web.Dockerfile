# syntax=docker/dockerfile:1
# El Caddy de Ferrebress con la aplicación adentro (ADR-011). Se construye desde la raíz: primero
# se arma la aplicación con Vite, con la versión del commit, y después se copia a Caddy.
# Las imágenes base van por su huella, así una etiqueta movida no cambia lo que se arma; para
# actualizarlas se cambia la huella (docker pull y docker image inspect). La de Caddy la usan
# también las pruebas de punta a punta.
FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS app
WORKDIR /repo
# Un certificado extra solo si se construye detrás de un proxy (las sesiones en la nube);
# va como secreto, así no queda en ninguna capa.
ENV NODE_EXTRA_CA_CERTS=/run/secrets/ca
RUN --mount=type=secret,id=ca,required=false npm install --global pnpm@10.15.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY src/shared/package.json src/shared/
COPY src/app/package.json src/app/
RUN --mount=type=secret,id=ca,required=false \
    pnpm install --frozen-lockfile --filter @ferrebress/app...
COPY tsconfig.base.json ./
COPY src/shared src/shared
COPY src/app src/app
ARG VERSION
RUN VERSION=$VERSION pnpm --filter @ferrebress/app build

FROM caddy:2.11-alpine@sha256:eb4d35b7452d1ab6171fbdbe8d9275b2301dad6dad92115d91e19fb9b24d510f
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=app /repo/src/app/dist /srv
EXPOSE 80
