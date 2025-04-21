FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p zips
CMD ["node", "index.js"]