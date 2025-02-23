FROM node:18-slim

RUN apt-get update -y && \
    apt-get install -y openssl postgresql-client curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npx prisma generate

RUN echo '#!/bin/sh\n\
# Check required environment variables\n\
if [ -z "$DATABASE_URL" ]; then\n\
    echo "Error: DATABASE_URL is not set"\n\
    exit 1\n\
fi\n\
if [ -z "$NODE_ENV" ]; then\n\
    echo "Error: NODE_ENV is not set"\n\
    exit 1\n\
fi\n\
\n\
# Add delay untuk memastikan services lain siap\n\
sleep 5\n\
\n\
# Start application\n\
exec node app.js\n\
' > /app/startup.sh

RUN chmod +x /app/startup.sh

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/_health || exit 1

CMD ["/bin/sh", "/app/startup.sh"]