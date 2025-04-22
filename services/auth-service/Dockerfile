FROM node:20

ARG EMAIL_PORT
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV EMAIL_PORT=$EMAIL_PORT

EXPOSE 3001
CMD ["node", "index.js"]