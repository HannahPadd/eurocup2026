# syntax=docker/dockerfile:1.7

################################
## BUILD ENVIRONMENT ###########
################################
FROM node:22-alpine3.20 AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY ./ ./

# Optional build args
ARG NODE_ENV=production

# Build secrets (JWT, CORS)
# Secrets are only available during this RUN, not baked into final image
RUN --mount=type=secret,id=jwt_secret \
    --mount=type=secret,id=cors_origin,required=false \
    if [ -f /run/secrets/jwt_secret ]; then \
        export JWT_SECRET="$(cat /run/secrets/jwt_secret)"; \
    fi && \
    if [ -f /run/secrets/cors_origin ]; then \
        export CORS_ORIGIN="$(cat /run/secrets/cors_origin)"; \
    fi && \
    npm run build

################################
#### PRODUCTION ENVIRONMENT ####
################################
FROM node:22-alpine3.20 AS production

WORKDIR /app

# Copy only necessary files from build
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Set production environment
ENV NODE_ENV=production

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main.js"]