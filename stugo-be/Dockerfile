# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package*.json ./

USER appuser

EXPOSE 3000

CMD ["node", "src/index.js"]
