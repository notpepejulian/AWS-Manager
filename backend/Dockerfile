FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g @nestjs/cli && \
    npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "start:dev"]
