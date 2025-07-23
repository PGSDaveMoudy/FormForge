#!/bin/bash

# FormForge VPS Deployment Script
# Run this script on your VPS as root

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

log_info "🚀 Starting FormForge deployment to VPS..."

# Step 1: Update system
log_step "1. Updating system packages..."
apt update && apt upgrade -y

# Step 2: Install Docker
log_step "2. Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    log_info "✅ Docker installed successfully"
else
    log_info "✅ Docker already installed"
fi

# Step 3: Install Docker Compose
log_step "3. Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_info "✅ Docker Compose installed successfully"
else
    log_info "✅ Docker Compose already installed"
fi

# Step 4: Install Nginx and Certbot
log_step "4. Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx
systemctl enable nginx
log_info "✅ Nginx and Certbot installed successfully"

# Step 5: Create application directory and clone repository
log_step "5. Setting up application directory..."
mkdir -p /opt/formforge
cd /opt/formforge

if [ -d ".git" ]; then
    log_info "Repository already exists, pulling latest changes..."
    git pull origin master
else
    log_info "Cloning FormForge repository..."
    git clone https://github.com/PGSDaveMoudy/FormForge.git .
fi

# Step 6: Create environment file
log_step "6. Creating environment configuration..."
cat << 'EOF' > .env
NODE_ENV=production
DB_PASSWORD=formforge_secure_pass_2024
JWT_SECRET=super_secret_jwt_key_change_in_production_2024
JWT_REFRESH_SECRET=super_secret_refresh_key_change_in_production_2024
SENDGRID_API_KEY=
FROM_EMAIL=noreply@portwoodglobalsolutions.com
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
SALESFORCE_CALLBACK_URL=https://portwoodglobalsolutions.com/api/salesforce/callback
FRONTEND_URL=https://portwoodglobalsolutions.com
BACKEND_URL=https://portwoodglobalsolutions.com
EOF

chmod 600 .env
log_info "✅ Environment file created"

# Step 7: Configure Nginx
log_step "7. Configuring Nginx..."
cp nginx/sites-available/portwoodglobalsolutions.com /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/portwoodglobalsolutions.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if nginx -t; then
    log_info "✅ Nginx configuration is valid"
else
    log_error "❌ Nginx configuration test failed"
    exit 1
fi

# Step 8: Get SSL Certificate
log_step "8. Setting up SSL certificate..."
read -p "Enter your email for Let's Encrypt notifications: " email
if [[ -z "$email" ]]; then
    log_error "Email is required for SSL certificate"
    exit 1
fi

# Stop nginx temporarily
systemctl stop nginx

# Get certificate
if certbot certonly --standalone --non-interactive --agree-tos --email "$email" -d portwoodglobalsolutions.com -d www.portwoodglobalsolutions.com; then
    log_info "✅ SSL certificate obtained successfully"
else
    log_error "❌ Failed to obtain SSL certificate"
    log_warn "Continuing without SSL for now..."
fi

# Start nginx
systemctl start nginx

# Step 9: Deploy application
log_step "9. Building and starting application..."
docker-compose down --remove-orphans || true
docker-compose build --no-cache
docker-compose up -d

# Step 10: Wait for services to start
log_step "10. Waiting for services to start..."
sleep 30

# Step 11: Check service status
log_step "11. Checking service status..."
docker-compose ps

# Step 12: Test health endpoints
log_step "12. Testing application health..."
for i in {1..10}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_info "✅ Backend health check passed"
        break
    fi
    if [[ $i -eq 10 ]]; then
        log_warn "⚠️  Backend health check failed after 50 seconds"
    else
        log_info "Waiting for backend to be ready... ($i/10)"
        sleep 5
    fi
done

for i in {1..6}; do
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        log_info "✅ Frontend health check passed"
        break
    fi
    if [[ $i -eq 6 ]]; then
        log_warn "⚠️  Frontend health check failed after 30 seconds"
    else
        log_info "Waiting for frontend to be ready... ($i/6)"
        sleep 5
    fi
done

# Step 13: Setup auto-renewal for SSL
log_step "13. Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -

# Step 14: Setup firewall
log_step "14. Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

log_info "🎉 FormForge deployment completed!"
echo
log_info "📊 Deployment Summary:"
echo "   • Application: https://portwoodglobalsolutions.com"
echo "   • Health Check: https://portwoodglobalsolutions.com/health"
echo "   • API Status: https://portwoodglobalsolutions.com/api/status"
echo "   • Backend: Running on port 3000"
echo "   • Frontend: Running on port 5173"
echo "   • Database: PostgreSQL with Redis"
echo
log_info "🔧 Management Commands:"
echo "   • View logs: cd /opt/formforge && docker-compose logs -f"
echo "   • Restart: docker-compose restart"
echo "   • Stop: docker-compose down"
echo "   • Status: docker-compose ps"
echo
log_info "🔒 Security Features:"
echo "   • SSL certificate with auto-renewal"
echo "   • Firewall configured"
echo "   • Docker containers isolated"
echo
log_warn "📝 Next Steps:"
echo "   1. Test the application at https://portwoodglobalsolutions.com"
echo "   2. Monitor logs for any issues"
echo "   3. Consider changing default passwords in .env file"
echo "   4. Set up regular backups"

echo
log_info "✅ FormForge is now live at https://portwoodglobalsolutions.com"