# Frontend'i inşa etme talimatları (Multi-stage build)

# 1. Kısım: Sitenin 'build' edilme aşaması
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

# Next.js uygulaması inşa edilir
RUN npm run build


# 2. Kısım: Sadece sonuçları çalıştıracak hafif aşama
FROM node:20-alpine AS runner

WORKDIR /app

# Next.js'in statik dosyalarını ve node_modules'ü kopyala
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Next.js server'ı Production modunda başlat
CMD ["npm", "start"]