FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY packages/shared-contracts ./packages/shared-contracts
COPY apps/employee-web ./apps/employee-web

RUN npm install
RUN npm --workspace=apps/employee-web run build

FROM nginx:alpine

COPY --from=build /app/apps/employee-web/dist /usr/share/nginx/html
COPY apps/employee-web/nginx.conf.template /etc/nginx/templates/default.conf.template

ENV PORT=32301
ENV API_TARGET=http://backend-user:32302

EXPOSE ${PORT}
