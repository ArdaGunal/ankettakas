# client/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Next.js uygulamasını build et
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Build ve node_modules'ı kopyala
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Next.js server'ı başlat
CMD ["npm", "start"]
