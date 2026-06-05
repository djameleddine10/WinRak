FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY index.js ./

# Make app available at BOTH paths so any start command works
RUN mkdir -p dist && cp index.js dist/index.js

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]
