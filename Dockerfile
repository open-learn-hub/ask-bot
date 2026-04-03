FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY app.js claude.js loader.js ./

EXPOSE 3000

CMD ["node", "app.js"]
