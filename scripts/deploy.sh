#!/bin/bash

# FormForge Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting FormForge deployment to $ENVIRONMENT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as deploy user
if [[ "$USER" != "deploy" && "$ENVIRONMENT" == "production" ]]; then
    log_error "This script should be run as the 'deploy' user in production"
    exit 1
fi

# Check if .env file exists
if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
    log_error ".env file not found. Please create it before deploying."
    exit 1
fi

# Validate environment
case $ENVIRONMENT in
    production|staging|development)
        log_info "Deploying to $ENVIRONMENT environment"
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT. Use: production, staging, or development"
        exit 1
        ;;
esac

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose is not installed or not in PATH"
    exit 1
fi

cd "$PROJECT_ROOT"

# Pull latest code (only in production/staging)
if [[ "$ENVIRONMENT" != "development" ]]; then
    log_info "Pulling latest code from repository..."
    git pull origin main
fi

# Create backup directory if it doesn't exist
mkdir -p backups uploads

# Create database backup before deployment
if docker-compose ps | grep -q postgres; then
    log_info "Creating database backup..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    docker-compose exec -T postgres pg_dump -U formforge formforge > "backups/formforge_pre_deploy_$timestamp.sql" || {
        log_warn "Database backup failed, but continuing with deployment"
    }
fi

# Build and pull images
log_info "Building and pulling Docker images..."
if [[ "$ENVIRONMENT" == "development" ]]; then
    docker-compose build
else
    docker-compose pull
fi

# Stop services gracefully
log_info "Stopping services..."
docker-compose down --timeout 30

# Start services
log_info "Starting services..."
docker-compose up -d

# Wait for services to be ready
log_info "Waiting for services to start..."
sleep 10

# Check if backend is responding
log_info "Checking backend health..."
for i in {1..12}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_info "Backend is healthy!"
        break
    fi
    if [[ $i -eq 12 ]]; then
        log_error "Backend health check failed after 60 seconds"
        docker-compose logs backend
        exit 1
    fi
    log_info "Waiting for backend to be ready... ($i/12)"
    sleep 5
done

# Run database migrations
log_info "Running database migrations..."
docker-compose run --rm backend npx prisma migrate deploy

# Check if frontend is responding (only if nginx is not handling it)
if [[ "$ENVIRONMENT" == "development" ]]; then
    log_info "Checking frontend health..."
    for i in {1..6}; do
        if curl -f http://localhost:5173 > /dev/null 2>&1; then
            log_info "Frontend is healthy!"
            break
        fi
        if [[ $i -eq 6 ]]; then
            log_error "Frontend health check failed after 30 seconds"
            docker-compose logs frontend
            exit 1
        fi
        log_info "Waiting for frontend to be ready... ($i/6)"
        sleep 5
    done
fi

# Clean up old Docker images and containers
log_info "Cleaning up Docker resources..."
docker system prune -f

# Remove old backups (keep last 7 days)
log_info "Cleaning up old backups..."
find backups/ -name "*.sql" -mtime +7 -delete 2>/dev/null || true

# Display service status
log_info "Service status:"
docker-compose ps

# Show logs for a few seconds
log_info "Recent logs:"
timeout 5 docker-compose logs --tail=10 || true

log_info "✅ Deployment completed successfully!"

# Environment-specific completion messages
case $ENVIRONMENT in
    production)
        log_info "🌐 Production deployment complete!"
        log_info "   URL: https://portwoodglobalsolutions.com"
        ;;
    staging)
        log_info "🧪 Staging deployment complete!"
        log_info "   URL: https://staging.portwoodglobalsolutions.com"
        ;;
    development)
        log_info "🔧 Development deployment complete!"
        log_info "   Frontend: http://localhost:5173"
        log_info "   Backend:  http://localhost:3000"
        log_info "   API Docs: http://localhost:3000/api/docs"
        ;;
esac

log_info "📋 Next steps:"
log_info "   - Monitor logs: docker-compose logs -f"
log_info "   - Check health: curl https://portwoodglobalsolutions.com/health"
log_info "   - View services: docker-compose ps"