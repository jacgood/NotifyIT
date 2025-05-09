# Running NotifyIT in Docker

This document explains how to build and run the NotifyIT application using Docker.

## Prerequisites

- Docker installed on your machine
- Docker Compose installed on your machine

## Building and Running with Docker Compose

The easiest way to run NotifyIT is using Docker Compose:

1. Make sure you're in the project root directory:
   ```
   cd /path/to/NotifyIT
   ```

2. Create a `.env` file with your Azure AD credentials (if you haven't already):
   ```
   REACT_APP_AZURE_CLIENT_ID=your-client-id
   REACT_APP_AZURE_TENANT_ID=your-tenant-id
   ```

3. Build and start the container:
   ```
   docker-compose up -d
   ```

4. Access the application at http://localhost:3000

5. To stop the container:
   ```
   docker-compose down
   ```

## Building and Running with Docker Directly

If you prefer to use Docker commands directly:

1. Build the Docker image:
   ```
   docker build -t notifyit .
   ```

2. Run the container:
   ```
   docker run -p 3000:80 \
     -e REACT_APP_AZURE_CLIENT_ID=your-client-id \
     -e REACT_APP_AZURE_TENANT_ID=your-tenant-id \
     -e REACT_APP_BASE_URL=http://localhost:3000 \
     -d notifyit
   ```

3. Access the application at http://localhost:3000

## Customizing the Configuration

You can customize the application by passing different environment variables:

- `REACT_APP_BASE_URL`: The base URL where the application is hosted
- `REACT_APP_AZURE_CLIENT_ID`: Your Azure AD application client ID
- `REACT_APP_AZURE_TENANT_ID`: Your Azure AD tenant ID

Example with a custom domain:
```
docker run -p 80:80 \
  -e REACT_APP_BASE_URL=https://notifyit.example.com \
  -e REACT_APP_AZURE_CLIENT_ID=your-client-id \
  -e REACT_APP_AZURE_TENANT_ID=your-tenant-id \
  -d notifyit
```

## Deploying to a Production Environment

For production deployments, consider:

1. Using a reverse proxy like Nginx or Traefik to handle SSL termination
2. Setting up proper health checks
3. Implementing container orchestration with Kubernetes or Docker Swarm
4. Using secrets management for sensitive information

## Troubleshooting

If you encounter issues:

1. Check the container logs:
   ```
   docker logs [container-id]
   ```

2. Verify your environment variables are correctly set:
   ```
   docker exec [container-id] env
   ```

3. Ensure the container is running:
   ```
   docker ps
   ```
