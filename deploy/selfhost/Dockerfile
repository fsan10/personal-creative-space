FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ libvips-dev && rm -rf /var/lib/apt/lists/*
COPY strapi/package.json strapi/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY strapi/ ./
ENV NODE_ENV=production
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends libvips42 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=1337
COPY --from=build --chown=node:node /app/ ./
RUN mkdir -p public/uploads .tmp && chown -R node:node public/uploads .tmp
USER node
EXPOSE 1337
CMD ["npm", "run", "start"]
