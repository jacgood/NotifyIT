#!/bin/sh
set -e

# Set default values for environment variables if not provided
REACT_APP_BASE_URL=${REACT_APP_BASE_URL:-"http://localhost:3000"}
REACT_APP_AZURE_CLIENT_ID=${REACT_APP_AZURE_CLIENT_ID:-""}
REACT_APP_AZURE_TENANT_ID=${REACT_APP_AZURE_TENANT_ID:-"common"}
PORT=${PORT:-"3000"}

echo "NotifyIT Docker Container Starting..."
echo "Base URL: $REACT_APP_BASE_URL"
echo "Port: $PORT"
echo "Azure Client ID: ${REACT_APP_AZURE_CLIENT_ID:0:5}... (truncated)"

# Create or update the runtime config file
echo "Creating runtime configuration..."
echo "window.RUNTIME_CONFIG = {" > /usr/share/nginx/html/runtime-config.js
echo "  REACT_APP_BASE_URL: \"$REACT_APP_BASE_URL\"," >> /usr/share/nginx/html/runtime-config.js
echo "  REACT_APP_AZURE_CLIENT_ID: \"$REACT_APP_AZURE_CLIENT_ID\"," >> /usr/share/nginx/html/runtime-config.js
echo "  REACT_APP_AZURE_TENANT_ID: \"$REACT_APP_AZURE_TENANT_ID\"," >> /usr/share/nginx/html/runtime-config.js
echo "  PORT: \"$PORT\"" >> /usr/share/nginx/html/runtime-config.js
echo "};" >> /usr/share/nginx/html/runtime-config.js
echo "Runtime configuration created successfully."

# Execute the main container command
echo "Starting Nginx server..."
exec "$@"
