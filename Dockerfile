FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
RUN npm install -g pnpm

FROM base AS builder
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN npm run build

FROM base AS prod
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM gcr.io/distroless/nodejs22-debian12
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER nonroot
EXPOSE 8000
CMD [ "dist/src/index.js" ]