#!/bin/bash

# FormForge Universal Deployment Script
# Deploy FormForge to any VPS with any domain
# Usage: ./scripts/universal-deploy.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
}

log_prompt() {
    echo -e "${CYAN}[INPUT]${NC} $1"
}

# ASCII Art Header
show_header() {
    echo -e "${PURPLE}"
    cat << 'EOF'
    ______                    ______                       
   / ____/___  _________ ___ / ____/___  _________ ______ 
  / /_  / __ \/ ___/ __ `__ \/ /_  / __ \/ ___/ __ `/ ___/
 / __/ / /_/ / /  / / / / / / __/ / /_/ / /  / /_/ / /    
/_/    \____/_/  /_/ /_/ /_/_/    \____/_/   \__, /_/     
                                           /____/        
                Universal Deployment Script
EOF
    echo -e "${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        echo "Usage: sudo ./scripts/universal-deploy.sh"
        exit 1
    fi
}

# Validate domain format
validate_domain() {
    local domain=$1
    if [[ ! "$domain" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$ ]]; then
        return 1
    fi
    return 0
}

# Validate email format
validate_email() {
    local email=$1
    if [[ ! "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 1
    fi
    return 0
}

# Collect deployment configuration
collect_config() {
    log_step "🔧 Configuration Setup"
    echo
    
    # Domain configuration
    while true; do
        log_prompt "Enter your domain name (e.g., example.com):"
        read -r DOMAIN
        if validate_domain "$DOMAIN"; then
            break
        else
            log_error "Invalid domain format. Please enter a valid domain (e.g., example.com)"
        fi
    done
    
    # Subdomain option
    log_prompt "Do you want to include 'www' subdomain? [Y/n]:"
    read -r INCLUDE_WWW
    INCLUDE_WWW=${INCLUDE_WWW:-Y}
    
    if [[ "$INCLUDE_WWW" =~ ^[Yy] ]]; then
        WWW_DOMAIN="www.$DOMAIN"
        DOMAIN_LIST="$DOMAIN $WWW_DOMAIN"
    else
        WWW_DOMAIN=""
        DOMAIN_LIST="$DOMAIN"
    fi
    
    # Email for SSL certificate
    while true; do
        log_prompt "Enter email address for SSL certificate notifications:"
        read -r SSL_EMAIL
        if validate_email "$SSL_EMAIL"; then
            break
        else
            log_error "Invalid email format. Please enter a valid email address"
        fi
    done
    
    # Application directory
    log_prompt "Enter application directory [/opt/formforge]:"
    read -r APP_DIR
    APP_DIR=${APP_DIR:-/opt/formforge}
    
    # Repository URL
    log_prompt "Enter repository URL [https://github.com/PGSDaveMoudy/FormForge.git]:"
    read -r REPO_URL
    REPO_URL=${REPO_URL:-https://github.com/PGSDaveMoudy/FormForge.git}
    
    # Environment selection
    log_prompt "Select environment (production/staging/development) [production]:"
    read -r ENVIRONMENT
    ENVIRONMENT=${ENVIRONMENT:-production}
    
    # Security settings
    log_prompt "Generate secure passwords automatically? [Y/n]:"
    read -r AUTO_PASSWORDS
    AUTO_PASSWORDS=${AUTO_PASSWORDS:-Y}
    
    if [[ "$AUTO_PASSWORDS" =~ ^[Yy] ]]; then
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
        JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    else
        log_prompt "Enter database password:"
        read -s DB_PASSWORD
        echo
        log_prompt "Enter JWT secret:"
        read -s JWT_SECRET
        echo
        log_prompt "Enter JWT refresh secret:"
        read -s JWT_REFRESH_SECRET
        echo
    fi
    
    # Optional integrations
    log_prompt "Configure Salesforce integration? [y/N]:"
    read -r SETUP_SALESFORCE
    SETUP_SALESFORCE=${SETUP_SALESFORCE:-N}
    
    if [[ "$SETUP_SALESFORCE" =~ ^[Yy] ]]; then
        log_prompt "Enter Salesforce Client ID:"
        read -r SALESFORCE_CLIENT_ID
        log_prompt "Enter Salesforce Client Secret:"
        read -s SALESFORCE_CLIENT_SECRET
        echo
    fi
    
    log_prompt "Configure SendGrid for email? [y/N]:"
    read -r SETUP_SENDGRID
    SETUP_SENDGRID=${SETUP_SENDGRID:-N}
    
    if [[ "$SETUP_SENDGRID" =~ ^[Yy] ]]; then
        log_prompt "Enter SendGrid API Key:"
        read -s SENDGRID_API_KEY
        echo
        log_prompt "Enter 'From' email address:"
        read -r FROM_EMAIL
    fi
    
    # Confirmation
    echo
    log_step "📋 Configuration Summary"
    echo "Domain: $DOMAIN"
    [[ -n "$WWW_DOMAIN" ]] && echo "WWW Domain: $WWW_DOMAIN"
    echo "SSL Email: $SSL_EMAIL"
    echo "App Directory: $APP_DIR"
    echo "Environment: $ENVIRONMENT"
    echo "Repository: $REPO_URL"
    echo
    
    log_prompt "Proceed with deployment? [Y/n]:"
    read -r CONFIRM
    CONFIRM=${CONFIRM:-Y}
    
    if [[ ! "$CONFIRM" =~ ^[Yy] ]]; then
        log_warn "Deployment cancelled by user"
        exit 0
    fi
}

# System update and preparation
prepare_system() {
    log_step "1️⃣  Preparing System"
    
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    
    log_info "Installing essential packages..."
    apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    log_success "System preparation completed"
}

# Install Docker and Docker Compose
install_docker() {
    log_step "2️⃣  Installing Docker"
    
    if command -v docker &> /dev/null; then
        log_info "Docker already installed, checking version..."
        docker --version
    else
        log_info "Installing Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt update
        apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        systemctl enable docker
        systemctl start docker
        log_success "Docker installed successfully"
    fi
    
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose already installed, checking version..."
        docker-compose --version
    else
        log_info "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        log_success "Docker Compose installed successfully"
    fi
}

# Install and configure Nginx
install_nginx() {
    log_step "3️⃣  Installing and Configuring Nginx"
    
    log_info "Installing Nginx and Certbot..."
    apt install -y nginx certbot python3-certbot-nginx
    systemctl enable nginx
    
    log_success "Nginx and Certbot installed successfully"
}

# Setup application directory and clone repository
setup_application() {
    log_step "4️⃣  Setting Up Application"
    
    log_info "Creating application directory: $APP_DIR"
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    if [ -d ".git" ]; then
        log_info "Repository already exists, pulling latest changes..."
        git pull origin master
    else
        log_info "Cloning FormForge repository..."
        git clone "$REPO_URL" .
    fi
    
    log_success "Application setup completed"
}

# Create environment configuration
create_environment() {
    log_step "5️⃣  Creating Environment Configuration"
    
    cd "$APP_DIR"
    
    log_info "Creating environment file..."
    cat << EOF > .env
# FormForge Environment Configuration
NODE_ENV=$ENVIRONMENT
PORT=3000

# Database Configuration
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Application URLs
FRONTEND_URL=https://$DOMAIN
BACKEND_URL=https://$DOMAIN

# Email Configuration
FROM_EMAIL=${FROM_EMAIL:-noreply@$DOMAIN}
$(if [[ "$SETUP_SENDGRID" =~ ^[Yy] ]]; then echo "SENDGRID_API_KEY=$SENDGRID_API_KEY"; fi)

# Salesforce Integration
$(if [[ "$SETUP_SALESFORCE" =~ ^[Yy] ]]; then
echo "SALESFORCE_CLIENT_ID=$SALESFORCE_CLIENT_ID"
echo "SALESFORCE_CLIENT_SECRET=$SALESFORCE_CLIENT_SECRET"
echo "SALESFORCE_CALLBACK_URL=https://$DOMAIN/api/salesforce/callback"
fi)

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
UPLOAD_MAX_SIZE=10485760

# Generated on: $(date)
# Domain: $DOMAIN
# Environment: $ENVIRONMENT
EOF
    
    chmod 600 .env
    log_success "Environment configuration created"
}

# Create simple backend server
create_backend() {
    log_step "6️⃣  Creating Backend Server"
    
    cd "$APP_DIR"
    
    log_info "Creating simple Node.js backend server..."
    cat << 'EOF' > simple-server.js
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Load environment variables from .env file
function loadEnv() {
    try {
        const envFile = fs.readFileSync('.env', 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                if (!key.startsWith('#') && key.trim() && value.trim()) {
                    process.env[key.trim()] = value.trim();
                }
            }
        });
    } catch (error) {
        console.log('No .env file found, using system environment variables');
    }
}

loadEnv();

// Simple HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Health endpoint
    if (path === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            uptime: process.uptime(),
            domain: process.env.FRONTEND_URL || 'localhost'
        }));
        return;
    }
    
    // API status endpoint
    if (path === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'FormForge API is running',
            data: {
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
                domain: process.env.FRONTEND_URL || 'localhost',
                features: {
                    salesforce: !!process.env.SALESFORCE_CLIENT_ID,
                    sendgrid: !!process.env.SENDGRID_API_KEY,
                    ssl: process.env.NODE_ENV === 'production'
                }
            }
        }));
        return;
    }
    
    // Root endpoint
    if (path === '/' || path === '/api') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'FormForge Backend API',
            version: '1.0.0',
            domain: process.env.FRONTEND_URL || 'localhost',
            documentation: '/api/docs',
            health: '/health',
            status: '/api/status'
        }));
        return;
    }
    
    // API routes placeholder
    if (path.startsWith('/api/')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: 'API endpoint not found',
            message: `Route ${path} not implemented yet`,
            availableRoutes: [
                'GET /health',
                'GET /api/status',
                'GET /api'
            ]
        }));
        return;
    }
    
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: false,
        error: 'Not found',
        message: `Route ${path} not found`
    }));
});

server.listen(PORT, () => {
    console.log(`🚀 FormForge Backend server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Domain: ${process.env.FRONTEND_URL || 'localhost'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
EOF
    
    log_success "Backend server created"
}

# Create frontend
create_frontend() {
    log_step "7️⃣  Creating Frontend"
    
    cd "$APP_DIR"
    
    log_info "Creating frontend HTML..."
    cat << EOF > index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FormForge - Form Builder</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><line x1='9' y1='9' x2='15' y2='9'/><line x1='9' y1='15' x2='15' y2='15'/></svg>">
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .pulse-dot {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Header -->
        <header class="gradient-bg text-white py-16">
            <div class="container mx-auto px-4 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-white text-blue-600 rounded-xl mb-6">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h1 class="text-5xl font-bold mb-4">FormForge</h1>
                <p class="text-xl text-blue-100 max-w-2xl mx-auto mb-4">
                    Professional drag-and-drop form builder
                </p>
                <p class="text-lg text-blue-200 mb-8">
                    Deployed on <strong>$DOMAIN</strong>
                </p>
                <div class="flex justify-center space-x-4">
                    <span id="ssl-status" class="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium">
                        <span class="w-2 h-2 bg-white rounded-full mr-2 pulse-dot"></span>
                        SSL Secured
                    </span>
                    <span id="api-status" class="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-full text-sm font-medium">
                        <span class="w-2 h-2 bg-white rounded-full mr-2 pulse-dot"></span>
                        Checking API...
                    </span>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <div class="container mx-auto px-4 py-16">
            <!-- Status Cards -->
            <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                <!-- Frontend Status -->
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <div class="flex items-center mb-4">
                        <div class="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <h2 class="text-2xl font-semibold text-gray-900">Frontend</h2>
                    </div>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Status:</span>
                            <span class="font-medium text-green-600">Online</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Domain:</span>
                            <span class="font-medium">$DOMAIN</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">SSL:</span>
                            <span class="font-medium text-green-600">Active</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Environment:</span>
                            <span class="font-medium">$ENVIRONMENT</span>
                        </div>
                    </div>
                </div>

                <!-- Backend Status -->
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <div class="flex items-center mb-4">
                        <div id="backend-status" class="w-3 h-3 bg-yellow-500 rounded-full mr-3 pulse-dot"></div>
                        <h2 class="text-2xl font-semibold text-gray-900">Backend API</h2>
                    </div>
                    <div id="backend-info" class="space-y-3">
                        <div class="flex items-center text-gray-600">
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Connecting to API...
                        </div>
                    </div>
                </div>
            </div>

            <!-- Deployment Info -->
            <div class="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto mb-16">
                <h2 class="text-2xl font-semibold text-gray-900 mb-6">Deployment Information</h2>
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 mb-3">Configuration</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Domain:</span>
                                <span class="font-medium">$DOMAIN</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Environment:</span>
                                <span class="font-medium">$ENVIRONMENT</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Deployment:</span>
                                <span class="font-medium">$(date)</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 mb-3">Features</h3>
                        <div class="space-y-2 text-sm">
                            <div id="feature-salesforce" class="flex justify-between">
                                <span class="text-gray-600">Salesforce:</span>
                                <span class="font-medium text-gray-500">Checking...</span>
                            </div>
                            <div id="feature-sendgrid" class="flex justify-between">
                                <span class="text-gray-600">Email Service:</span>
                                <span class="font-medium text-gray-500">Checking...</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Database:</span>
                                <span class="font-medium text-green-600">PostgreSQL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Coming Soon Features -->
            <div class="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
                <h2 class="text-2xl font-semibold text-gray-900 mb-6">FormForge Features</h2>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                        <span class="text-2xl mr-3">🎯</span>
                        <span class="font-medium text-gray-700">Drag & Drop Builder</span>
                    </div>
                    <div class="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                        <span class="text-2xl mr-3">📝</span>
                        <span class="font-medium text-gray-700">Form Elements</span>
                    </div>
                    <div class="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                        <span class="text-2xl mr-3">⚡</span>
                        <span class="font-medium text-gray-700">Salesforce Sync</span>
                    </div>
                    <div class="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                        <span class="text-2xl mr-3">📧</span>
                        <span class="font-medium text-gray-700">Email Verification</span>
                    </div>
                    <div class="flex items-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                        <span class="text-2xl mr-3">🔐</span>
                        <span class="font-medium text-gray-700">Authentication</span>
                    </div>
                    <div class="flex items-center p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg">
                        <span class="text-2xl mr-3">👁️</span>
                        <span class="font-medium text-gray-700">Live Preview</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="bg-gray-100 py-8">
            <div class="container mx-auto px-4 text-center">
                <div class="mb-4">
                    <a href="/health" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-4">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Health Check
                    </a>
                    <a href="/api/status" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        API Status
                    </a>
                </div>
                <p class="text-gray-600">
                    FormForge deployed successfully on <strong>$DOMAIN</strong>
                </p>
            </div>
        </footer>
    </div>

    <script>
        // Check backend status
        async function checkBackendStatus() {
            try {
                const response = await fetch('/api/status');
                if (!response.ok) throw new Error('API not responding');
                
                const data = await response.json();
                
                // Update status indicators
                const backendStatus = document.getElementById('backend-status');
                const apiStatus = document.getElementById('api-status');
                const backendInfo = document.getElementById('backend-info');
                
                backendStatus.className = 'w-3 h-3 bg-green-500 rounded-full mr-3';
                apiStatus.innerHTML = '<span class="w-2 h-2 bg-white rounded-full mr-2"></span>API Online';
                apiStatus.className = 'inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium';
                
                const uptime = Math.floor(data.data.uptime);
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = uptime % 60;
                const uptimeStr = \`\${hours}h \${minutes}m \${seconds}s\`;
                
                backendInfo.innerHTML = \`
                    <div class="flex justify-between">
                        <span class="text-gray-600">Status:</span>
                        <span class="font-medium text-green-600">Online</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Environment:</span>
                        <span class="font-medium">\${data.data.environment}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Version:</span>
                        <span class="font-medium">\${data.data.version}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Uptime:</span>
                        <span class="font-medium">\${uptimeStr}</span>
                    </div>
                \`;
                
                // Update feature status
                const features = data.data.features || {};
                const salesforceEl = document.getElementById('feature-salesforce');
                const sendgridEl = document.getElementById('feature-sendgrid');
                
                if (salesforceEl) {
                    const status = features.salesforce ? 'Configured' : 'Not Configured';
                    const color = features.salesforce ? 'text-green-600' : 'text-gray-500';
                    salesforceEl.innerHTML = \`
                        <span class="text-gray-600">Salesforce:</span>
                        <span class="font-medium \${color}">\${status}</span>
                    \`;
                }
                
                if (sendgridEl) {
                    const status = features.sendgrid ? 'Configured' : 'Not Configured';
                    const color = features.sendgrid ? 'text-green-600' : 'text-gray-500';
                    sendgridEl.innerHTML = \`
                        <span class="text-gray-600">Email Service:</span>
                        <span class="font-medium \${color}">\${status}</span>
                    \`;
                }
                
            } catch (error) {
                console.error('Backend check failed:', error);
                const backendStatus = document.getElementById('backend-status');
                const apiStatus = document.getElementById('api-status');
                const backendInfo = document.getElementById('backend-info');
                
                backendStatus.className = 'w-3 h-3 bg-red-500 rounded-full mr-3';
                apiStatus.innerHTML = '<span class="w-2 h-2 bg-white rounded-full mr-2"></span>API Offline';
                apiStatus.className = 'inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium';
                
                backendInfo.innerHTML = \`
                    <div class="flex justify-between">
                        <span class="text-gray-600">Status:</span>
                        <span class="font-medium text-red-600">Offline</span>
                    </div>
                    <div class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        Backend API is not responding
                    </div>
                \`;
            }
        }
        
        // Check status on load and every 30 seconds
        checkBackendStatus();
        setInterval(checkBackendStatus, 30000);
        
        // Update page title with domain
        document.title = \`FormForge - \${window.location.hostname}\`;
    </script>
</body>
</html>
EOF
    
    log_success "Frontend created"
}

# Configure Nginx
configure_nginx() {
    log_step "8️⃣  Configuring Nginx"
    
    cd "$APP_DIR"
    
    log_info "Creating Nginx configuration..."
    cat << EOF > nginx-site.conf
# FormForge - $DOMAIN
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN_LIST;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN_LIST;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Root and index
    root $APP_DIR;
    index index.html;
    
    # Logging
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log /var/log/nginx/$DOMAIN.error.log;
    
    # API routes - proxy to backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Frontend application
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Security - deny access to hidden files
    location ~ /\. {
        deny all;
    }
    
    # Security - deny access to sensitive files
    location ~* \.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist|env)$ {
        deny all;
    }
}
EOF
    
    # Copy to Nginx sites-available
    cp nginx-site.conf "/etc/nginx/sites-available/$DOMAIN"
    ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
    rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    if nginx -t; then
        log_success "Nginx configuration is valid"
    else
        log_error "Nginx configuration test failed"
        exit 1
    fi
}

# Obtain SSL certificate
setup_ssl() {
    log_step "9️⃣  Setting Up SSL Certificate"
    
    log_info "Stopping Nginx for standalone certificate..."
    systemctl stop nginx
    
    log_info "Obtaining SSL certificate for $DOMAIN_LIST..."
    if certbot certonly --standalone --non-interactive --agree-tos --email "$SSL_EMAIL" -d $DOMAIN_LIST; then
        log_success "SSL certificate obtained successfully"
    else
        log_error "Failed to obtain SSL certificate"
        log_warn "Continuing without SSL..."
        # Create a temporary HTTP-only configuration
        sed -i 's/listen 443 ssl http2;/listen 80;/' "/etc/nginx/sites-available/$DOMAIN"
        sed -i '/ssl_/d' "/etc/nginx/sites-available/$DOMAIN"
    fi
    
    log_info "Starting Nginx..."
    systemctl start nginx
}

# Start services
start_services() {
    log_step "🔟 Starting Services"
    
    cd "$APP_DIR"
    
    log_info "Starting database services..."
    docker-compose up -d postgres redis
    
    log_info "Starting backend server..."
    # Kill any existing Node processes
    pkill -f "node simple-server.js" || true
    nohup node simple-server.js > backend.log 2>&1 &
    sleep 3
    
    log_info "Testing backend health..."
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Backend is running successfully"
    else
        log_warn "Backend may not be responding correctly"
    fi
    
    log_success "All services started"
}

# Create systemd service for backend
create_systemd_service() {
    log_step "🔧 Creating Systemd Service"
    
    log_info "Creating systemd service for FormForge backend..."
    cat << EOF > /etc/systemd/system/formforge.service
[Unit]
Description=FormForge Backend API Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=$ENVIRONMENT
ExecStart=/usr/bin/node simple-server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=formforge

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable formforge
    systemctl start formforge
    
    log_success "Systemd service created and started"
}

# Setup automatic SSL renewal
setup_ssl_renewal() {
    log_step "🔄 Setting Up SSL Auto-Renewal"
    
    log_info "Configuring automatic SSL certificate renewal..."
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
    
    log_success "SSL auto-renewal configured"
}

# Create management scripts
create_management_scripts() {
    log_step "📋 Creating Management Scripts"
    
    cd "$APP_DIR"
    
    # Start script
    cat << 'EOF' > start.sh
#!/bin/bash
echo "🚀 Starting FormForge services..."
docker-compose up -d postgres redis
systemctl start formforge
systemctl start nginx
echo "✅ FormForge services started"
EOF
    
    # Stop script
    cat << 'EOF' > stop.sh
#!/bin/bash
echo "🛑 Stopping FormForge services..."
systemctl stop formforge
docker-compose down
echo "✅ FormForge services stopped"
EOF
    
    # Status script
    cat << 'EOF' > status.sh
#!/bin/bash
echo "📊 FormForge Service Status"
echo "=========================="
echo "Backend Service:"
systemctl status formforge --no-pager -l
echo ""
echo "Database Services:"
docker-compose ps
echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager -l
echo ""
echo "SSL Certificate:"
certbot certificates
EOF
    
    # Restart script
    cat << 'EOF' > restart.sh
#!/bin/bash
echo "🔄 Restarting FormForge services..."
systemctl restart formforge
systemctl reload nginx
echo "✅ FormForge services restarted"
EOF
    
    chmod +x start.sh stop.sh status.sh restart.sh
    
    log_success "Management scripts created"
}

# Final verification
verify_deployment() {
    log_step "✅ Verifying Deployment"
    
    log_info "Testing HTTP to HTTPS redirect..."
    if curl -I -s "http://$DOMAIN" | grep -q "301"; then
        log_success "HTTP to HTTPS redirect working"
    else
        log_warn "HTTP to HTTPS redirect may not be working"
    fi
    
    log_info "Testing HTTPS frontend..."
    if curl -k -f "https://$DOMAIN" > /dev/null 2>&1; then
        log_success "HTTPS frontend accessible"
    else
        log_warn "HTTPS frontend may not be accessible"
    fi
    
    log_info "Testing backend API..."
    if curl -k -f "https://$DOMAIN/api/status" > /dev/null 2>&1; then
        log_success "Backend API accessible"
    else
        log_warn "Backend API may not be accessible"
    fi
    
    log_info "Testing health endpoint..."
    if curl -k -f "https://$DOMAIN/health" > /dev/null 2>&1; then
        log_success "Health endpoint accessible"
    else
        log_warn "Health endpoint may not be accessible"
    fi
}

# Show deployment summary
show_summary() {
    log_step "🎉 Deployment Complete!"
    echo
    log_success "FormForge has been successfully deployed!"
    echo
    echo -e "${CYAN}🌐 Website URLs:${NC}"
    echo "   • Main Site: https://$DOMAIN"
    [[ -n "$WWW_DOMAIN" ]] && echo "   • WWW Site: https://$WWW_DOMAIN"
    echo "   • Health Check: https://$DOMAIN/health"
    echo "   • API Status: https://$DOMAIN/api/status"
    echo
    echo -e "${CYAN}📁 Application Directory:${NC}"
    echo "   • Location: $APP_DIR"
    echo "   • Environment: $ENVIRONMENT"
    echo
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo "   • Start Services: cd $APP_DIR && ./start.sh"
    echo "   • Stop Services: cd $APP_DIR && ./stop.sh"
    echo "   • Check Status: cd $APP_DIR && ./status.sh"
    echo "   • Restart: cd $APP_DIR && ./restart.sh"
    echo
    echo -e "${CYAN}📊 Service Management:${NC}"
    echo "   • Backend Service: systemctl status formforge"
    echo "   • View Logs: journalctl -u formforge -f"
    echo "   • Nginx Logs: tail -f /var/log/nginx/$DOMAIN.access.log"
    echo
    echo -e "${CYAN}🔒 SSL Certificate:${NC}"
    echo "   • Status: certbot certificates"
    echo "   • Renewal: certbot renew"
    echo "   • Auto-renewal: Configured (daily at 2 AM)"
    echo
    echo -e "${CYAN}🗄️ Database:${NC}"
    echo "   • PostgreSQL: Running in Docker"
    echo "   • Redis: Running in Docker"
    echo "   • Manage: docker-compose -f $APP_DIR/docker-compose.yml"
    echo
    if [[ "$SETUP_SALESFORCE" =~ ^[Yy] ]]; then
        echo -e "${CYAN}⚡ Salesforce Integration:${NC}"
        echo "   • Status: Configured"
        echo "   • Callback URL: https://$DOMAIN/api/salesforce/callback"
        echo
    fi
    if [[ "$SETUP_SENDGRID" =~ ^[Yy] ]]; then
        echo -e "${CYAN}📧 Email Service:${NC}"
        echo "   • Provider: SendGrid"
        echo "   • From Address: $FROM_EMAIL"
        echo
    fi
    echo -e "${CYAN}🚀 Next Steps:${NC}"
    echo "   1. Visit https://$DOMAIN to see your deployment"
    echo "   2. Monitor the services using the status scripts"
    echo "   3. Begin developing FormForge features"
    echo "   4. Configure any additional integrations needed"
    echo
    log_success "Deployment completed successfully! 🎉"
}

# Main execution
main() {
    show_header
    check_root
    collect_config
    prepare_system
    install_docker
    install_nginx
    setup_application
    create_environment
    create_backend
    create_frontend
    configure_nginx
    setup_ssl
    start_services
    create_systemd_service
    setup_ssl_renewal
    create_management_scripts
    verify_deployment
    show_summary
    
    log_success "🎉 FormForge Universal Deployment Complete!"
}

# Run main function
main "$@"