# syntax=docker/dockerfile:1.7
# =============================================================================
# YouLearn web — the Next.js front end.
#
# Build context is web/ :
#   docker build -f docker/web/Dockerfile web/
#
# Three stages so the runtime image contains neither the build toolchain nor
# any dev dependency. `output: "standalone"` in next.config.ts traces the
# modules actually imported and copies just those, which is what makes the
# final image a fraction of the size of node_modules.
#
# Nothing secret is baked in. Every value in web/src/lib/env.ts is read at
# request time from the environment, so the same image runs in any environment
# and an image leak is not a credential leak.
# =============================================================================

FROM node:22-alpine AS deps
WORKDIR /app
# Only the manifests, so this layer is reused whenever dependencies are
# unchanged — which is nearly every build.
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NODE_ENV is set by `next build` itself. env.ts validates on first access
# rather than at import, so the build needs no secrets — see its comment.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# Which commit this image was built from. Deploys are pull-based, so CI cannot
# watch the rollout directly — it polls /api/health until this value is the one
# answering. Declared in the runtime stage only, so changing it does not
# invalidate the build cache for any layer above.
ARG BUILD_SHA=unknown

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    BUILD_SHA=${BUILD_SHA}

# Unprivileged. The standalone server needs no write access to its own files.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Any response below 500 counts as up, because "/" legitimately redirects to
# Keycloak when nobody is signed in.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:3000,path:'/'},r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
