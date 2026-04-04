# Stage 1: Build the React app
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package*.json ./
RUN npm install

# Copy the rest of the source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# 1. Remove default nginx static assets
RUN rm -rf ./*

# 2. Copy the build output from the 'build' stage
COPY --from=build /app/dist .

# 3. Copy your custom nginx config to the correct location
# We overwrite default.conf because it is pre-included by the main nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]