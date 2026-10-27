# syntax=docker/dockerfile:1
# El servidor (ADR-012). Se construye desde la raíz del repositorio.
FROM node:24-alpine AS dependencies
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

FROM node:24-alpine
WORKDIR /repo
COPY --from=dependencies /repo ./
COPY src/shared src/shared
COPY src/server src/server
ARG VERSION
ENV VERSION=$VERSION NODE_ENV=production
RUN mkdir -p /data/audit /data/geo && chown node /data/audit
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=6 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "src/server/main.ts"]
