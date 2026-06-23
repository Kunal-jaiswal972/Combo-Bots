FROM node:20-bookworm-slim AS build

WORKDIR /app

# better-sqlite3 native addon — no prebuild on slim image without these
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsup.config.ts ./
COPY src ./src

RUN npm run build \
  && npm prune --omit=dev

FROM node:20-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
  HEADLESS=true \
  CHROME_EXECUTABLE_PATH=/usr/bin/chromium \
  CHROME_USER_DATA_DIR=/data/chrome \
  DATABASE_URL=file:/data 
  
COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN mkdir -p /data /data/chrome

VOLUME ["/data"]

CMD ["node", "dist/index.js"]
