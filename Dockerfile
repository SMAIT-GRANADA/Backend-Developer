FROM node:18-bullseye-slim

# Install dependencies for Node.js application
RUN apt-get update -y && \
    apt-get install -y openssl libssl1.1 ca-certificates curl dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

COPY . .

RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

RUN groupadd -r granada && useradd -r -g granada granada
RUN chown -R granada:granada /app
USER granada

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT}/_health || exit 1

CMD ["node", "app.js"]