FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm install
RUN cd apps/api && npm install

COPY . .

RUN npm run prisma:generate

EXPOSE 3001

CMD ["npm", "run", "dev"]
