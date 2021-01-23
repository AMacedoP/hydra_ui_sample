## Builder
FROM node:14.15.4-alpine3.12 as builder
WORKDIR /app
COPY package* ./
RUN npm ci
# Compiling TypeScript to /app/build
COPY tsconfig.json .eslint* ./
COPY ./src ./src
RUN npm run build

## Runner
FROM node:14.15.4-alpine3.12 as runner

RUN mkdir /app && chown node:node /app
USER node

ENV HYDRA_ADMIN_URL=http://localhost:4445/
ENV DB_LOCATION=/app/database.json

WORKDIR /app

COPY --from=builder /app/build ./build

COPY package* ./
RUN npm ci --production

COPY ./views /app/views

ENTRYPOINT [ "node" ]
CMD ["./build/index.js"]