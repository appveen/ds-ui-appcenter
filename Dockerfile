FROM node:14-alpine

WORKDIR /app

ENV NODE_OPTIONS --max_old_space_size=8192
RUN npm i -g @angular/cli@9.1.5

COPY package.json .

RUN npm install

COPY . .

RUN ng build --prod

# RUN npm run build