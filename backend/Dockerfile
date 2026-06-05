FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

RUN npx prisma db push --accept-data-loss || true

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]
