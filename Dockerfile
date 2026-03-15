FROM node:22-slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
COPY emojis.json ./
COPY languages/ ./languages/
RUN npm run build

FROM node:22-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY languages/ ./languages/
COPY assets/ ./assets/
COPY dashboard/views/ ./dashboard/views/
COPY dashboard/public/ ./dashboard/public/
COPY emojis.json ./

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/index.js"]
