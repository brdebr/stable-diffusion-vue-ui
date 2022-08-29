FROM node:14.16.1

RUN apt update

RUN mkdir /app
WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build

EXPOSE 3000

ENTRYPOINT ["npm", "run", "serve"]