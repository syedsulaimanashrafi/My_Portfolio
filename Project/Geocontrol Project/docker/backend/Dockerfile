FROM node:18-alpine

WORKDIR /app

COPY ../package.json ../package-lock.json ./
RUN npm install

COPY .. .

EXPOSE 5000

RUN mkdir -p logs

CMD ["sh", "-c", "npm run create-root && npm run start"]