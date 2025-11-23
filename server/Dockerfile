# Server/Dockerfile (Hafıza Optimizasyonu Eklendi)

FROM node:20-alpine

WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# 1. NPM Cache'i Temizle (Garantilemek için)
RUN npm cache clean --force

# 2. Hafıza Sınırını Yükselt (ARM Pi için kritik)
# Node.js'e daha fazla RAM kullanma izni veriyoruz (3 GB)
ENV NODE_OPTIONS="--max_old_space_size=3000"

# Bağımlılıkları yükle
RUN npm install

# Geri kalan kodları kopyala
COPY . .

# Server'ı başlat
CMD ["node", "index.js"]