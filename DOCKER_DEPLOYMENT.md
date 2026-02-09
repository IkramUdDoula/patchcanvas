# Docker Deployment Guide

## Prerequisites

- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)
- Environment variables configured

## Quick Start

### 1. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env
```

Edit `.env` with your actual Clerk credentials.

### 2. Build and run with Docker Compose

```bash
docker-compose up -d
```

The app will be available at `http://localhost:3000`

### 3. View logs

```bash
docker-compose logs -f app
```

### 4. Stop the application

```bash
docker-compose down
```

## Manual Docker Commands

### Build the image

```bash
docker build -t patchcanvas:latest .
```

### Run the container

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name patchcanvas \
  patchcanvas:latest
```

### Stop and remove container

```bash
docker stop patchcanvas
docker rm patchcanvas
```

## Production Deployment

### Using Docker Compose with custom port

Edit `docker-compose.yml` to change the port mapping:

```yaml
ports:
  - "8080:3000"  # Maps host port 8080 to container port 3000
```

### Environment Variables

Required environment variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key

Optional (with defaults):
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (default: /sign-in)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (default: /sign-up)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` (default: /dashboard)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` (default: /dashboard)

### Health Check

The container includes a health check that runs every 30 seconds. Check status:

```bash
docker ps
```

Look for "healthy" in the STATUS column.

## Troubleshooting

### Container won't start

Check logs:
```bash
docker-compose logs app
```

### Port already in use

Change the port in `docker-compose.yml` or stop the conflicting service.

### Build fails

Clear Docker cache and rebuild:
```bash
docker-compose build --no-cache
```

## Optimization Tips

- The Dockerfile uses multi-stage builds to minimize image size
- Only production dependencies are included in the final image
- The app runs as a non-root user for security
- Standalone output mode is enabled for optimal Docker performance
