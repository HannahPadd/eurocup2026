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

# Build the app using the secret
# The secret is only available during this RUN
RUN --mount=type=secret,id=vite_api_base_url \
    export VITE_API_BASE_URL="$(cat /run/secrets/vite_api_base_url)" && \
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
