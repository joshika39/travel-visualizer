FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY vite.config.ts ./

RUN corepack enable
RUN corepack prepare pnpm@latest --activate


RUN pnpm install

COPY . .
RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]