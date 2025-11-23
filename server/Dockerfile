# server/Dockerfile

FROM node:20-alpine

WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# NPM cache temizle
RUN npm cache clean --force

# Hafıza sınırı (Pi için kritik)
ENV NODE_OPTIONS="--max_old_space_size=3000"

# Bağımlılıkları yükle
RUN npm install

# Geri kalan server kodlarını kopyala
COPY . .

# Server'ı başlat
CMD ["node", "index.js"]
