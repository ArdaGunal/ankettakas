# Backend'i inşa etme talimatları
# Node.js'in ARM tabanlı sürümünü kullanıyoruz (Pi için)
FROM node:20-alpine

WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle (Pi'nin mimarisine özel olacak)
RUN npm install

# Geri kalan kodları kopyala
COPY . .

# Server'ı başlat
CMD ["node", "index.js"]