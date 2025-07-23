#!/bin/bash

# FormForge Backup Script
# Creates backups of the database and important files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cd "$PROJECT_ROOT"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log_info "🔄 Starting FormForge backup process..."

# Check if PostgreSQL container is running
if ! docker-compose ps | grep -q "postgres.*Up"; then
    log_error "PostgreSQL container is not running"
    exit 1
fi

# Create database backup
log_info "📦 Creating database backup..."
DB_BACKUP_FILE="$BACKUP_DIR/formforge_db_$TIMESTAMP.sql"

if docker-compose exec -T postgres pg_dump -U formforge formforge > "$DB_BACKUP_FILE"; then
    log_info "✅ Database backup created: $(basename "$DB_BACKUP_FILE")"
    
    # Compress the backup
    gzip "$DB_BACKUP_FILE"
    log_info "🗜️  Database backup compressed: $(basename "$DB_BACKUP_FILE").gz"
else
    log_error "❌ Database backup failed"
    exit 1
fi

# Backup uploaded files
log_info "📂 Creating uploads backup..."
UPLOADS_BACKUP_FILE="$BACKUP_DIR/formforge_uploads_$TIMESTAMP.tar.gz"

if [[ -d "uploads" ]] && [[ "$(ls -A uploads)" ]]; then
    if tar -czf "$UPLOADS_BACKUP_FILE" uploads/; then
        log_info "✅ Uploads backup created: $(basename "$UPLOADS_BACKUP_FILE")"
    else
        log_warn "⚠️  Uploads backup failed, but continuing..."
    fi
else
    log_info "📂 No uploads to backup"
fi

# Backup environment and configuration files
log_info "⚙️  Creating configuration backup..."
CONFIG_BACKUP_FILE="$BACKUP_DIR/formforge_config_$TIMESTAMP.tar.gz"

# Create temporary directory for config files
TEMP_CONFIG_DIR=$(mktemp -d)
trap "rm -rf $TEMP_CONFIG_DIR" EXIT

# Copy important configuration files (excluding sensitive data)
mkdir -p "$TEMP_CONFIG_DIR/config"

# Copy docker-compose and nginx configs
cp docker-compose.yml "$TEMP_CONFIG_DIR/config/" 2>/dev/null || true
cp -r nginx/ "$TEMP_CONFIG_DIR/config/" 2>/dev/null || true

# Copy package.json files
find . -name "package.json" -not -path "./node_modules/*" -exec cp --parents {} "$TEMP_CONFIG_DIR/config/" \; 2>/dev/null

# Create the config backup
if tar -czf "$CONFIG_BACKUP_FILE" -C "$TEMP_CONFIG_DIR" config/; then
    log_info "✅ Configuration backup created: $(basename "$CONFIG_BACKUP_FILE")"
else
    log_warn "⚠️  Configuration backup failed, but continuing..."
fi

# Clean up old backups (keep last 7 days)
log_info "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "formforge_*.gz" -mtime +7 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "formforge_*.tar.gz" -mtime +7 -delete 2>/dev/null || true

# Show backup summary
log_info "📊 Backup Summary:"
echo "   Directory: $BACKUP_DIR"
echo "   Files created:"
ls -lh "$BACKUP_DIR"/formforge_*_$TIMESTAMP* 2>/dev/null || echo "   No files created"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "unknown")
log_info "   Total backup size: $TOTAL_SIZE"

# Check available disk space
AVAILABLE_SPACE=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
log_info "   Available disk space: $AVAILABLE_SPACE"

log_info "✅ Backup process completed successfully!"

# Optional: Upload to remote storage (uncomment and configure as needed)
# log_info "☁️  Uploading to remote storage..."
# aws s3 cp "$BACKUP_DIR/formforge_db_$TIMESTAMP.sql.gz" s3://formforge-backups/
# aws s3 cp "$UPLOADS_BACKUP_FILE" s3://formforge-backups/ 2>/dev/null || true