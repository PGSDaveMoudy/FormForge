# FormForge

A production-grade, modular, drag-and-drop form builder web application for portwoodglobalsolutions.com.

## 🚀 Features

- **Drag & Drop Interface**: Intuitive form building with react-dnd
- **Rich Form Elements**: Text inputs, dropdowns, date pickers, file uploads, signatures, and more
- **Salesforce Integration**: Direct form submission to Salesforce objects
- **Email Verification**: Built-in email verification workflows
- **Multi-tenant**: Organization-based access control
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Preview**: Live form preview as you build
- **Production Ready**: Docker-based deployment with CI/CD

## 🏗️ Architecture

```
FormForge/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + TypeScript
├── shared/            # Shared types, constants, validation
├── nginx/             # Nginx configuration
├── docs/              # Documentation
├── scripts/           # Deployment and utility scripts
└── .github/workflows/ # CI/CD pipelines
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** + **Radix UI** for styling
- **Zustand** for state management
- **React Query** for server state
- **react-dnd** for drag & drop

### Backend
- **Node.js 20** with TypeScript
- **Express.js** for REST API
- **Prisma** ORM with PostgreSQL
- **Redis** for caching and sessions
- **JWT** authentication
- **Zod** for validation

### DevOps
- **Docker** & **docker-compose**
- **Nginx** reverse proxy
- **GitHub Actions** CI/CD
- **Let's Encrypt** SSL

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (for local development)
- Redis (for local development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/PGSDaveMoudy/FormForge.git
   cd FormForge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose run --rm backend npx prisma migrate dev
   ```

5. **Seed the database (optional)**
   ```bash
   docker-compose run --rm backend npm run db:seed
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api/docs

### Manual Development Setup

1. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker
   docker run -d --name postgres -p 5432:5432 -e POSTGRES_DB=formforge -e POSTGRES_USER=formforge -e POSTGRES_PASSWORD=password postgres:16-alpine
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

3. **Build shared package**
   ```bash
   cd shared && npm run build
   ```

4. **Start backend**
   ```bash
   cd backend
   npm run dev
   ```

5. **Start frontend**
   ```bash
   cd frontend
   npm run dev
   ```

## 🏭 Production Deployment

### VPS Setup

1. **Follow the VPS setup guide**
   ```bash
   # See docs/VPS_SETUP.md for detailed instructions
   ```

2. **Deploy using the script**
   ```bash
   ./scripts/deploy.sh production
   ```

### Environment Variables

Required environment variables:

```env
NODE_ENV=production
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@portwoodglobalsolutions.com
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
SALESFORCE_CALLBACK_URL=https://portwoodglobalsolutions.com/api/salesforce/callback
FRONTEND_URL=https://portwoodglobalsolutions.com
BACKEND_URL=https://portwoodglobalsolutions.com
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific package tests
cd backend && npm test
cd frontend && npm test
```

## 📝 API Documentation

The API documentation is automatically generated using OpenAPI/Swagger and available at:
- Development: http://localhost:3000/api/docs
- Production: https://portwoodglobalsolutions.com/api/docs

## 🔧 Development Scripts

```bash
# Start all services in development
npm run dev

# Build all packages
npm run build

# Lint all packages
npm run lint

# Docker commands
npm run docker:build
npm run docker:up
npm run docker:down

# Deploy to production
npm run deploy
```

## 📁 Project Structure

### Frontend (`/frontend`)
```
src/
├── components/        # Reusable UI components
│   ├── TextInput/
│   ├── Picklist/
│   └── ...
├── canvas/            # Drag & drop canvas components
├── state/             # Zustand stores
├── api/               # API client functions
├── pages/             # Page components
└── utils/             # Utility functions
```

### Backend (`/backend`)
```
src/
├── modules/           # Feature modules
│   ├── auth/
│   ├── forms/
│   ├── salesforce/
│   └── ...
├── shared/            # Shared utilities
│   ├── middleware/
│   └── validation/
└── config/            # Configuration files
```

## 🔐 Salesforce Integration

### Setup Connected App

1. In Salesforce Setup, create a Connected App:
   - **Callback URL**: `https://portwoodglobalsolutions.com/api/salesforce/callback`
   - **OAuth Scopes**: `api`, `refresh_token`, `offline_access`

2. Configure environment variables:
   ```env
   SALESFORCE_CLIENT_ID=your_consumer_key
   SALESFORCE_CLIENT_SECRET=your_consumer_secret
   ```

3. Connect your organization through the settings page

## 🏥 Health Checks & Monitoring

- **Health Endpoint**: `/health`
- **Metrics**: Integrated with OpenTelemetry (optional)
- **Logs**: Structured logging with Winston
- **Uptime**: Monitored via health check scripts

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **RBAC** (Role-Based Access Control)
- **Rate Limiting** on API endpoints
- **Input Validation** with Zod schemas
- **Security Headers** via Helmet
- **CORS** protection
- **SQL Injection** protection via Prisma
- **XSS** protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- GitHub Issues: [FormForge Issues](https://github.com/PGSDaveMoudy/FormForge/issues)
- Email: support@portwoodglobalsolutions.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**FormForge** - Built with ❤️ by [Portwood Global Solutions](https://portwoodglobalsolutions.com)