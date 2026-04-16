FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
# Dependencias de Chromium en Alpine
RUN apk add --no-cache \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/templates ./src/templates

ENV PORT=3002
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

EXPOSE 3002
CMD ["node", "dist/index.js"]
