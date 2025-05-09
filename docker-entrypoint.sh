#!/bin/sh
set -e

# Replace environment variables in the runtime config
if [ -f /usr/share/nginx/html/runtime-config.js ]; then
  echo "Injecting environment variables into runtime-config.js..."
  
  # Replace environment variables
  if [ ! -z "$REACT_APP_BASE_URL" ]; then
    sed -i "s|__REACT_APP_BASE_URL__|$REACT_APP_BASE_URL|g" /usr/share/nginx/html/runtime-config.js
  fi
  
  if [ ! -z "$REACT_APP_AZURE_CLIENT_ID" ]; then
    sed -i "s|__REACT_APP_AZURE_CLIENT_ID__|$REACT_APP_AZURE_CLIENT_ID|g" /usr/share/nginx/html/runtime-config.js
  fi
  
  if [ ! -z "$REACT_APP_AZURE_TENANT_ID" ]; then
    sed -i "s|__REACT_APP_AZURE_TENANT_ID__|$REACT_APP_AZURE_TENANT_ID|g" /usr/share/nginx/html/runtime-config.js
  fi
  
  if [ ! -z "$PORT" ]; then
    sed -i "s|__PORT__|$PORT|g" /usr/share/nginx/html/runtime-config.js
  fi
  
  echo "Environment variables injected successfully."
else
  echo "Warning: runtime-config.js not found. Environment variables will not be injected."
  # Create the runtime config file
  echo "window.RUNTIME_CONFIG = {" > /usr/share/nginx/html/runtime-config.js
  echo "  REACT_APP_BASE_URL: \"$REACT_APP_BASE_URL\"," >> /usr/share/nginx/html/runtime-config.js
  echo "  REACT_APP_AZURE_CLIENT_ID: \"$REACT_APP_AZURE_CLIENT_ID\"," >> /usr/share/nginx/html/runtime-config.js
  echo "  REACT_APP_AZURE_TENANT_ID: \"$REACT_APP_AZURE_TENANT_ID\"," >> /usr/share/nginx/html/runtime-config.js
  echo "  PORT: \"$PORT\"" >> /usr/share/nginx/html/runtime-config.js
  echo "};" >> /usr/share/nginx/html/runtime-config.js
  echo "Runtime config file created."
fi

# Execute the main container command
exec "$@"
