FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

RUN npm install
RUN cd apps/web && npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
