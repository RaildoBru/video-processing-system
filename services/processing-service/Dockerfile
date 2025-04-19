FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN apt-get update && apt-get install -y ffmpeg
RUN mkdir -p frames
CMD ["node", "app.js"]