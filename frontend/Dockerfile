# Stage 1: build the React app (includes logo from src/assets)
FROM node:20-alpine AS builder
LABEL maintainer="Yesmine GRASSA <yasmineg432@gmail.com>"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY public ./public
COPY src ./src
COPY tsconfig.json ./
COPY tailwind.config.js postcss.config.js ./
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:1.25-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
