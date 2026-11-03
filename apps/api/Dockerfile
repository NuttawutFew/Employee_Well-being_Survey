FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY packages/shared-contracts ./packages/shared-contracts
COPY apps/api ./apps/api

RUN npm install --omit=dev

EXPOSE 4000

CMD ["node", "apps/api/src/server.js"]
