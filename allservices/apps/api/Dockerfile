FROM node:20-alpine

WORKDIR /app

# Copy workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm install --legacy-peer-deps

COPY . .

WORKDIR /app/apps/api
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/main.js"]
