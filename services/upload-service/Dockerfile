FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p uploads
EXPOSE 3002
CMD ["node", "app.js"]