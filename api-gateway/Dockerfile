FROM node:20-alpine AS builder
WORKDIR /app
COPY api-gateway/package*.json ./
RUN npm ci
COPY api-gateway/tsconfig.json ./
COPY api-gateway/src ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY api-gateway/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY docs ./docs
EXPOSE 3000
CMD ["node", "dist/index.js"]
