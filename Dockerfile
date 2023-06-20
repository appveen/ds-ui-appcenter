FROM appveen/angular.base:11
FROM node:18-alpine AS node

WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build --production

# RUN npm run build