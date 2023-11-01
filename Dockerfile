###################
# BASE IMAGE
###################
FROM node:19.2.0-alpine3.15 AS base

RUN npm i -g pnpm


###################
# BUILD FOR LOCAL DEVELOPMENT
###################
FROM base AS development

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

EXPOSE 8000


###################
# BUILD FOR PRODUCTION
###################
FROM base AS builder

WORKDIR /usr/src/app

COPY package*.json pnpm-lock.yaml ./
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY . .

RUN pnpm build

RUN pnpm install --prod && npm cache clean --force


###################
# PRODUCTION
###################
FROM base AS production

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/.env /usr/src/app/.env.production ./

EXPOSE 8000

CMD [ "node", "dist/main.js" ]