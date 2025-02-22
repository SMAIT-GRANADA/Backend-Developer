FROM node:18-slim

RUN apt-get update -y && \
    apt-get install -y openssl postgresql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "app.js"]