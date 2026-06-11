# syntax=docker/dockerfile:1.7

################################
## BUILD ENVIRONMENT ###########
################################
FROM node:22-alpine3.20 AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY ./ ./

ARG VITE_API_BASE_URL
ARG VITE_ITGONLINE_URL
ARG VITE_PUBLIC_ENABLE_LIVE_SCORES

# Build the app using either a build arg or an optional secret.
# Secrets are only available during this RUN.
RUN --mount=type=secret,id=vite_api_base_url \
    if [ -f /run/secrets/vite_api_base_url ]; then \
      export VITE_API_BASE_URL="$(cat /run/secrets/vite_api_base_url)"; \
    else \
      export VITE_API_BASE_URL="${VITE_API_BASE_URL}"; \
    fi && \
    if [ -f /run/secrets/vite_itgonline_url ]; then \
      export VITE_ITGONLINE_URL="$(cat /run/secrets/vite_itgonline_url)"; \
    else \
      export VITE_ITGONLINE_URL="${VITE_ITGONLINE_URL}"; \
    fi && \
    if [ -f /run/secrets/vite_public_enable_live_scores ]; then \
      export VITE_PUBLIC_ENABLE_LIVE_SCORES="$(cat /run/secrets/vite_public_enable_live_scores)"; \
    else \
      export VITE_PUBLIC_ENABLE_LIVE_SCORES="${VITE_PUBLIC_ENABLE_LIVE_SCORES}"; \
    fi && \
    npm run build

################################
#### PRODUCTION ENVIRONMENT ####
################################
FROM nginx:stable AS production

# Copy nginx config and built app
COPY --from=build /app/nginx /etc/nginx/conf.d
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
