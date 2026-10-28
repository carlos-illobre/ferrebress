# syntax=docker/dockerfile:1
# El servidor (ADR-012). Se construye desde la raíz del repositorio.
# Las imágenes base van por su huella, así una etiqueta movida no cambia lo que se arma; para
# actualizarlas se cambia la huella (docker pull y docker image inspect).
FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS dependencies
WORKDIR /repo
# Un certificado extra solo si se construye detrás de un proxy (las sesiones en la nube);
# va como secreto, así no queda en ninguna capa.
ENV NODE_EXTRA_CA_CERTS=/run/secrets/ca
RUN --mount=type=secret,id=ca,required=false npm install --global pnpm@10.15.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY src/shared/package.json src/shared/
COPY src/server/package.json src/server/
RUN --mount=type=secret,id=ca,required=false \
    pnpm install --frozen-lockfile --prod --filter @ferrebress/server...

FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53
WORKDIR /repo
COPY --from=dependencies /repo ./
COPY src/shared src/shared
COPY src/server src/server
ARG VERSION
ENV VERSION=$VERSION NODE_ENV=production
RUN mkdir -p /data/audit && chown node /data/audit
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=6 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "src/server/main.ts"]
