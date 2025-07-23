# FormForge Live Deployment Checklist

## Prerequisites for VPS Deployment

1. **VPS Access**: SSH access to your Namecheap VPS
2. **Domain Configuration**: DNS pointing to your VPS IP
3. **Required Information**:
   - VPS IP address
   - SSH credentials
   - Domain: portwoodglobalsolutions.com

## Quick Deployment Steps

### 1. VPS Initial Setup
```bash
# Connect to VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx
apt install -y nginx

# Install Certbot
apt install -y certbot python3-certbot-nginx
```

### 2. Clone Repository
```bash
# Create application directory
mkdir -p /opt/formforge
cd /opt/formforge

# Clone repository
git clone https://github.com/PGSDaveMoudy/FormForge.git .
```

### 3. Configure Environment
```bash
# Create environment file
cat << 'EOF' > .env
NODE_ENV=production
DB_PASSWORD=formforge_secure_pass_2024
JWT_SECRET=super_secret_jwt_key_change_in_production_2024
JWT_REFRESH_SECRET=super_secret_refresh_key_change_in_production_2024
SENDGRID_API_KEY=your_sendgrid_key_here
FROM_EMAIL=noreply@portwoodglobalsolutions.com
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
SALESFORCE_CALLBACK_URL=https://portwoodglobalsolutions.com/api/salesforce/callback
FRONTEND_URL=https://portwoodglobalsolutions.com
BACKEND_URL=https://portwoodglobalsolutions.com
EOF

chmod 600 .env
```

### 4. Configure Nginx
```bash
# Copy Nginx configuration
cp nginx/sites-available/portwoodglobalsolutions.com /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/portwoodglobalsolutions.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t
```

### 5. Get SSL Certificate
```bash
# Stop nginx temporarily
systemctl stop nginx

# Get certificate
certbot certonly --standalone -d portwoodglobalsolutions.com -d www.portwoodglobalsolutions.com

# Start nginx
systemctl start nginx
```

### 6. Deploy Application
```bash
# Build and start services
docker-compose up -d

# Run database migrations
docker-compose run --rm backend npx prisma migrate deploy

# Check services
docker-compose ps
```

### 7. Verify Deployment
- Visit https://portwoodglobalsolutions.com
- Check https://portwoodglobalsolutions.com/health
- Monitor logs: `docker-compose logs -f`

## Troubleshooting Commands

```bash
# Check service status
docker-compose ps
systemctl status nginx

# View logs
docker-compose logs backend
docker-compose logs frontend
tail -f /var/log/nginx/error.log

# Restart services
docker-compose restart
systemctl restart nginx

# Check ports
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

## Current Status Requirements

For immediate testing, we need:
1. ✅ Infrastructure (completed)
2. 🔄 Minimal backend server (in progress)
3. 🔄 Basic frontend (in progress)
4. 🔄 Environment configuration
5. 🔄 VPS deployment