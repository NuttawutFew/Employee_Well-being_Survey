FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY packages/shared-contracts ./packages/shared-contracts
COPY apps/admin-web ./apps/admin-web

RUN npm install
RUN npm --workspace=apps/admin-web run build

FROM nginx:alpine

COPY --from=build /app/apps/admin-web/dist /usr/share/nginx/html
COPY apps/admin-web/nginx.conf.template /etc/nginx/templates/default.conf.template

ENV PORT=32303
ENV API_TARGET=http://backend-admin:32304

EXPOSE ${PORT}
