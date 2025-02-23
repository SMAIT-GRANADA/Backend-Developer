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

COPY <<EOF /app/startup.sh

required_vars=(
  "DATABASE_URL"
  "NODE_ENV"
  "JWT_ACCESS_SECRET"
  "JWT_REFRESH_SECRET"
  "SESSION_SECRET"
  "GOOGLE_CLOUD_PROJECT_ID"
  "GOOGLE_CLOUD_BUCKET_NAME"
)

for var in "\${required_vars[@]}"; do
  if [ -z "\${!var}" ]; then
    echo "Error: \$var is not set"
    exit 1
  fi
done
sleep 5
exec node app.js
EOF

RUN chmod +x /app/startup.sh

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/_health || exit 1

CMD ["/app/startup.sh"]