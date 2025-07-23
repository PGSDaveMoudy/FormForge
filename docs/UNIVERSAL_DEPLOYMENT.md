# FormForge Universal Deployment Guide

Deploy FormForge to any VPS with any domain using the automated universal deployment script.

## 🚀 Quick Start

### Prerequisites
- Ubuntu 22.04 or 20.04 VPS
- Root access to the server
- Domain name pointed to your VPS IP address
- Email address for SSL certificate registration

### One-Command Deployment

```bash
# Download and run the deployment script
curl -sSL https://raw.githubusercontent.com/PGSDaveMoudy/FormForge/master/scripts/universal-deploy.sh | sudo bash
```

**Or manually:**

```bash
# Clone the repository
git clone https://github.com/PGSDaveMoudy/FormForge.git
cd FormForge

# Run the deployment script
sudo ./scripts/universal-deploy.sh
```

## 📋 Deployment Process

The script will guide you through an interactive setup process:

### 1. Domain Configuration
- **Domain Name**: Enter your domain (e.g., `example.com`)
- **WWW Subdomain**: Choose whether to include `www.example.com`
- **SSL Email**: Email for Let's Encrypt certificate notifications

### 2. Application Settings
- **App Directory**: Where to install FormForge (default: `/opt/formforge`)
- **Repository URL**: Git repository to clone from
- **Environment**: Choose production, staging, or development

### 3. Security Configuration
- **Auto-Generated Passwords**: Secure random passwords for database and JWT
- **Manual Passwords**: Enter your own passwords if preferred

### 4. Optional Integrations
- **Salesforce**: Configure Salesforce Connected App integration
- **SendGrid**: Set up email service for notifications

## 🛠️ What Gets Installed

### System Components
- **Docker & Docker Compose**: Container runtime
- **Nginx**: Web server and reverse proxy
- **Certbot**: SSL certificate management
- **Node.js Backend**: API server
- **PostgreSQL**: Database
- **Redis**: Caching and sessions

### Security Features
- **SSL/TLS Encryption**: Automatic HTTPS with Let's Encrypt
- **Security Headers**: Comprehensive HTTP security headers
- **Firewall Configuration**: UFW firewall setup
- **Auto-renewal**: SSL certificates renew automatically

### Monitoring & Management
- **Health Checks**: Built-in health monitoring
- **Systemd Services**: Automatic service management
- **Log Rotation**: Automated log management
- **Management Scripts**: Easy start/stop/status commands

## 📁 Directory Structure

After deployment, your application will be organized as follows:

```
/opt/formforge/                    # Application root
├── index.html                     # Frontend application
├── simple-server.js               # Backend API server
├── .env                          # Environment configuration
├── docker-compose.yml            # Database services
├── nginx-site.conf               # Nginx configuration
├── backend.log                   # Backend logs
├── start.sh                      # Start services script
├── stop.sh                       # Stop services script
├── status.sh                     # Check status script
├── restart.sh                    # Restart services script
└── backups/                      # Backup directory
```

## 🔧 Management Commands

### Service Management
```bash
# Check all service status
cd /opt/formforge && ./status.sh

# Start all services
cd /opt/formforge && ./start.sh

# Stop all services
cd /opt/formforge && ./stop.sh

# Restart services
cd /opt/formforge && ./restart.sh
```

### Individual Services
```bash
# Backend service
systemctl status formforge
systemctl start formforge
systemctl stop formforge
systemctl restart formforge

# View backend logs
journalctl -u formforge -f

# Nginx service
systemctl status nginx
systemctl reload nginx

# Database services
docker-compose -f /opt/formforge/docker-compose.yml ps
docker-compose -f /opt/formforge/docker-compose.yml logs
```

### SSL Certificate Management
```bash
# Check certificate status
certbot certificates

# Renew certificates manually
certbot renew

# Test renewal (dry run)
certbot renew --dry-run
```

## 🌐 Post-Deployment Access

After successful deployment, your FormForge installation will be available at:

- **Main Website**: `https://yourdomain.com`
- **Health Check**: `https://yourdomain.com/health`
- **API Status**: `https://yourdomain.com/api/status`

The website will display:
- Real-time backend status
- System configuration information
- Feature availability
- Deployment information

## 🔒 Security Considerations

### Firewall
The script automatically configures UFW firewall:
```bash
# Check firewall status
ufw status

# Allowed ports: SSH (22), HTTP (80), HTTPS (443)
```

### SSL/TLS
- Automatic HTTPS redirect from HTTP
- Strong SSL configuration with modern ciphers
- HSTS (HTTP Strict Transport Security) enabled
- Auto-renewal configured via cron job

### Passwords
- Database passwords are auto-generated (32 characters)
- JWT secrets are auto-generated (50 characters)
- All sensitive data stored in protected `.env` file

## 📊 Monitoring

### Health Checks
The deployment includes built-in health monitoring:

```bash
# Check backend health
curl https://yourdomain.com/health

# Check API status with features
curl https://yourdomain.com/api/status
```

### Log Files
```bash
# Backend logs
tail -f /var/log/syslog | grep formforge
journalctl -u formforge -f

# Nginx access logs
tail -f /var/log/nginx/yourdomain.com.access.log

# Nginx error logs
tail -f /var/log/nginx/yourdomain.com.error.log

# SSL renewal logs
tail -f /var/log/letsencrypt/letsencrypt.log
```

## 🔧 Customization

### Environment Variables
Edit `/opt/formforge/.env` to customize:

```bash
# Domain and URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com

# Database
DB_PASSWORD=your_secure_password

# JWT Authentication
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@yourdomain.com

# Salesforce Integration
SALESFORCE_CLIENT_ID=your_client_id
SALESFORCE_CLIENT_SECRET=your_client_secret
SALESFORCE_CALLBACK_URL=https://yourdomain.com/api/salesforce/callback
```

### Frontend Customization
Edit `/opt/formforge/index.html` to customize the frontend appearance.

### Backend Customization
Edit `/opt/formforge/simple-server.js` to add new API endpoints or modify existing ones.

## 🐛 Troubleshooting

### Common Issues

**1. Domain not resolving**
```bash
# Check DNS configuration
dig yourdomain.com
nslookup yourdomain.com

# Ensure A record points to your VPS IP
```

**2. SSL certificate issues**
```bash
# Check certificate status
certbot certificates

# Test domain accessibility
curl -I http://yourdomain.com

# Renew certificate manually
certbot renew --force-renewal -d yourdomain.com
```

**3. Backend not responding**
```bash
# Check if backend is running
systemctl status formforge

# Check backend logs
journalctl -u formforge -f

# Restart backend
systemctl restart formforge
```

**4. Nginx configuration issues**
```bash
# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

**5. Database connection issues**
```bash
# Check database containers
docker-compose -f /opt/formforge/docker-compose.yml ps

# Restart database services
docker-compose -f /opt/formforge/docker-compose.yml restart
```

### Getting Help

1. **Check service status**: `cd /opt/formforge && ./status.sh`
2. **Review logs**: Check the log files mentioned above
3. **Restart services**: `cd /opt/formforge && ./restart.sh`
4. **Contact support**: If issues persist, provide:
   - Domain name
   - Error messages from logs
   - Output of status script

## 🔄 Updates and Maintenance

### Updating FormForge
```bash
cd /opt/formforge
git pull origin master
./restart.sh
```

### System Updates
```bash
# Update system packages
apt update && apt upgrade -y

# Restart services after system updates
cd /opt/formforge && ./restart.sh
```

### Backup and Restore
```bash
# Create database backup
docker-compose -f /opt/formforge/docker-compose.yml exec -T postgres pg_dump -U formforge formforge > backup_$(date +%Y%m%d).sql

# Restore database backup
docker-compose -f /opt/formforge/docker-compose.yml exec -T postgres psql -U formforge formforge < backup_20240101.sql
```

## 🚀 Advanced Configuration

### Custom Domain with Subdirectory
To deploy FormForge to a subdirectory (e.g., `yourdomain.com/formforge`):

1. Modify the Nginx configuration
2. Update the `FRONTEND_URL` and `BACKEND_URL` in `.env`
3. Adjust the frontend routing accordingly

### Multiple Environments
You can deploy multiple environments on the same server:

```bash
# Production
sudo ./scripts/universal-deploy.sh
# Use domain: yourdomain.com
# Use directory: /opt/formforge-prod

# Staging
sudo ./scripts/universal-deploy.sh
# Use domain: staging.yourdomain.com
# Use directory: /opt/formforge-staging
```

### Load Balancer Configuration
For high-traffic deployments, consider:
- Multiple backend instances
- Load balancer (nginx, HAProxy)
- Database clustering
- Redis clustering

## 📞 Support

For deployment support:
- **Documentation**: This guide and README.md
- **Issues**: GitHub repository issues
- **Email**: Support contact from your organization

---

**FormForge Universal Deployment** - Deploy anywhere, on any domain, with full automation and security.