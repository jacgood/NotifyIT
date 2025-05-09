# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the shell script that will inject environment variables
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Start nginx with our custom entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
