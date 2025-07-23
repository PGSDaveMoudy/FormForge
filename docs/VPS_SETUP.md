# FormForge VPS Setup Guide

Complete guide for provisioning and deploying FormForge on a Namecheap VPS running Ubuntu 22.04.

## Prerequisites

- Namecheap VPS with Ubuntu 22.04
- Domain: portwoodglobalsolutions.com
- Root or sudo access to the VPS
- GitHub repository access

## 1. Initial VPS Configuration

### 1.1 Connect to VPS
```bash
ssh root@YOUR_VPS_IP
```

### 1.2 Update System
```bash
apt update && apt upgrade -y
```

### 1.3 Create Deploy User
```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 1.4 Configure Firewall
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## 2. Install Required Software

### 2.1 Install Docker
```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add deploy user to docker group
usermod -aG docker deploy

# Enable Docker service
systemctl enable docker
systemctl start docker
```

### 2.2 Install Docker Compose
```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2.3 Install Nginx
```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 2.4 Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 2.5 Install Node.js (for local development/debugging)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

## 3. DNS Configuration

### 3.1 Namecheap DNS Settings
In your Namecheap control panel, set these DNS records:

```
Type    Host    Value               TTL
A       @       YOUR_VPS_IP         Automatic
CNAME   www     @                   Automatic
```

### 3.2 Verify DNS Propagation
```bash
dig portwoodglobalsolutions.com
dig www.portwoodglobalsolutions.com
```

## 4. SSL Certificate Setup

### 4.1 Initial SSL Certificate
```bash
# Stop nginx temporarily
systemctl stop nginx

# Get certificate
certbot certonly --standalone -d portwoodglobalsolutions.com -d www.portwoodglobalsolutions.com

# Start nginx
systemctl start nginx
```

### 4.2 Configure Auto-renewal
```bash
# Test renewal
certbot renew --dry-run

# Add cron job for auto-renewal
crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## 5. Application Deployment

### 5.1 Create Application Directory
```bash
sudo mkdir -p /opt/formforge
sudo chown deploy:deploy /opt/formforge
```

### 5.2 Clone Repository
```bash
su - deploy
cd /opt/formforge
git clone https://github.com/PGSDaveMoudy/FormForge.git .
```

### 5.3 Create Environment File
```bash
cd /opt/formforge
cat << 'EOF' > .env
NODE_ENV=production
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD
JWT_SECRET=YOUR_JWT_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET_HERE
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
FROM_EMAIL=noreply@portwoodglobalsolutions.com
SALESFORCE_CLIENT_ID=YOUR_SALESFORCE_CLIENT_ID
SALESFORCE_CLIENT_SECRET=YOUR_SALESFORCE_CLIENT_SECRET
SALESFORCE_CALLBACK_URL=https://portwoodglobalsolutions.com/api/salesforce/callback
FRONTEND_URL=https://portwoodglobalsolutions.com
BACKEND_URL=https://portwoodglobalsolutions.com
EOF

# Secure the environment file
chmod 600 .env
```

### 5.4 Create Required Directories
```bash
mkdir -p backups uploads nginx/ssl
sudo mkdir -p /var/www/html
```

## 6. Nginx Configuration

### 6.1 Copy Configuration Files
```bash
sudo cp nginx/sites-available/portwoodglobalsolutions.com /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/portwoodglobalsolutions.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 6.2 Test and Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Deploy Application

### 7.1 Build and Start Services
```bash
cd /opt/formforge
docker-compose up -d
```

### 7.2 Run Database Migrations
```bash
docker-compose run --rm backend npx prisma migrate deploy
```

### 7.3 Seed Database (Optional)
```bash
docker-compose run --rm backend npm run db:seed
```

## 8. Systemd Services (Alternative to Docker)

### 8.1 Create Backend Service
```bash
sudo tee /etc/systemd/system/formforge-backend.service << 'EOF'
[Unit]
Description=FormForge Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/formforge/backend
Environment=NODE_ENV=production
EnvironmentFile=/opt/formforge/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### 8.2 Create Frontend Service
```bash
sudo tee /etc/systemd/system/formforge-frontend.service << 'EOF'
[Unit]
Description=FormForge Frontend
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/formforge/frontend
ExecStart=/usr/bin/npx serve -s dist -l 5173
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### 8.3 Enable Services
```bash
sudo systemctl enable formforge-backend
sudo systemctl enable formforge-frontend
sudo systemctl start formforge-backend
sudo systemctl start formforge-frontend
```

## 9. Monitoring and Logging

### 9.1 Log Rotation
```bash
sudo tee /etc/logrotate.d/formforge << 'EOF'
/var/log/nginx/formforge.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF
```

### 9.2 Health Check Script
```bash
cat << 'EOF' > /opt/formforge/scripts/health-check.sh
#!/bin/bash
if ! curl -f https://portwoodglobalsolutions.com/health; then
    echo "Health check failed - restarting services"
    cd /opt/formforge
    docker-compose restart
fi
EOF

chmod +x /opt/formforge/scripts/health-check.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /opt/formforge/scripts/health-check.sh
```

## 10. Backup Configuration

### 10.1 Database Backup Script
```bash
cat << 'EOF' > /opt/formforge/scripts/backup.sh
#!/bin/bash
cd /opt/formforge
timestamp=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U formforge formforge > backups/formforge_$timestamp.sql
find backups/ -name "*.sql" -mtime +7 -delete
EOF

chmod +x /opt/formforge/scripts/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /opt/formforge/scripts/backup.sh
```

## 11. Security Hardening

### 11.1 SSH Configuration
```bash
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

### 11.2 Fail2Ban
```bash
sudo apt install -y fail2ban

sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 12. GitHub Actions Secrets

Configure these secrets in your GitHub repository:

```
DOCKER_USERNAME=your_dockerhub_username
DOCKER_PASSWORD=your_dockerhub_password
PRODUCTION_VPS_HOST=your_vps_ip
PRODUCTION_VPS_USER=deploy
VPS_SSH_KEY=your_private_ssh_key
DB_PASSWORD=your_secure_db_password
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@portwoodglobalsolutions.com
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
```

## 13. Troubleshooting

### 13.1 Check Service Status
```bash
# Docker services
docker-compose ps
docker-compose logs

# System services
sudo systemctl status nginx
sudo systemctl status docker

# Check logs
sudo tail -f /var/log/nginx/error.log
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 13.2 Common Issues

**SSL Certificate Issues:**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal -d portwoodglobalsolutions.com
```

**Database Connection Issues:**
```bash
docker-compose exec postgres psql -U formforge -d formforge
```

**Port Issues:**
```bash
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

## 14. Maintenance

### 14.1 Update Application
```bash
cd /opt/formforge
git pull origin main
docker-compose pull
docker-compose up -d
```

### 14.2 System Updates
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### 14.3 Docker Cleanup
```bash
docker system prune -af
docker volume prune -f
```

This setup provides a production-ready deployment of FormForge with proper security, monitoring, and backup procedures.