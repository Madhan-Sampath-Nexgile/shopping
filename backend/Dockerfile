FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm i --no-audit --no-fund || true
COPY . .
EXPOSE 4000
CMD ["npm","run","dev"]
