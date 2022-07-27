> **Note**
> This is a demo on how you can containerize a nextjs application at its bare basic. If you'd like to do production grade deployment, I recommend using vercel's official guide.

> **Warning**
> This is a demo on how you can containerize a nextjs application at its bare basic. If you'd like to do production grade deployment, I recommend using vercel's official guide.

# Multi-stage

# Stage 1: Installing dependencies

FROM node:16-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copying package.json and yarn.lock and installing node modules

# This helps caching the modules

COPY ./package.json .
COPY ./yarn.lock .
RUN yarn install --frozen-lockfile --prod

# Stage 2: Building source code

FROM node:16-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# This will do the trick, use the corresponding env file for each environment.

# COPY .env.production.sample .env.production

RUN yarn build

# 3. Setting up the production image

FROM node:16-alpine
WORKDIR /app
ENV NODE_ENV=production

# You only need to copy next.config.js if you are NOT using the default configuration

# COPY --from=builder /app/next.config.js ./

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
