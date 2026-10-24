FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3012 HOSTNAME=0.0.0.0 GOVTECH_DATA_DIR=/app/data GOVTECH_ORIGIN=http://127.0.0.1:3012
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/scripts/setup.mjs /app/scripts/container.mjs ./scripts/
COPY --from=build --chown=node:node /app/lib/paths.mjs ./lib/paths.mjs
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3012
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://127.0.0.1:3012/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","scripts/container.mjs"]
