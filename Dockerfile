# ── Stage 1: Build ────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Recebe as variáveis do Coolify em tempo de build
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY

ENV VITE_EMAILJS_SERVICE_ID=$VITE_EMAILJS_SERVICE_ID
ENV VITE_EMAILJS_TEMPLATE_ID=$VITE_EMAILJS_TEMPLATE_ID
ENV VITE_EMAILJS_PUBLIC_KEY=$VITE_EMAILJS_PUBLIC_KEY

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: Serve com nginx ───────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
