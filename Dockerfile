FROM appveen/angular.base:11

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

RUN ng build --prod

# RUN npm run build