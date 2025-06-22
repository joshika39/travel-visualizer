FROM node:20-alpine AS builder

LABEL org.opencontainers.image.source="https://github.com/joshika39/travel-visualizer"
LABEL org.opencontainers.image.description="Visualize your trips across the globe with Travel Visualizer"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY package*.json ./
COPY vite.config.ts ./

RUN corepack enable
RUN corepack prepare pnpm@latest --activate


RUN pnpm install

COPY . .
RUN pnpm build

FROM nginx:alpine

LABEL org.opencontainers.image.source="https://github.com/joshika39/travel-visualizer"
LABEL org.opencontainers.image.description="Visualize your trips across the globe with Travel Visualizer"
LABEL org.opencontainers.image.licenses="MIT"

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]