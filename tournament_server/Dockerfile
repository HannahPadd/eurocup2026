# syntax=docker/dockerfile:1

FROM node:latest
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "run", "start"]
EXPOSE 3000
