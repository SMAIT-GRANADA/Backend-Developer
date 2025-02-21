FROM node:18-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "start"]