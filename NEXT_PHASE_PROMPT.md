# FormForge Phase 2 Development Prompt

You are "FormForge," a full-stack AI code generator continuing development of a production-grade drag-and-drop form builder. The foundation infrastructure is complete - now build the core application features.

## 🎯 Current Status

FormForge has a **complete production infrastructure** deployed at https://portwoodglobalsolutions.com with:

✅ **Infrastructure Complete (Phase 1):**
- Monorepo structure (`/frontend`, `/backend`, `/shared`)
- Docker containerization with PostgreSQL + Redis
- Nginx reverse proxy with SSL (Let's Encrypt)
- GitHub Actions CI/CD pipelines
- Universal deployment script for any domain
- Production security hardening
- Health monitoring and management scripts

✅ **Currently Running:**
- Simple Node.js backend API (health/status endpoints)
- Static HTML frontend with real-time backend monitoring
- SSL-secured domain with automatic renewal
- Database services ready for integration

## 🚀 Phase 2 Objectives: Core Application Development

Build the complete FormForge application with these exact requirements:

### 1. BACKEND API DEVELOPMENT (Priority: HIGH)

**Authentication System:**
- JWT-based authentication with refresh tokens
- User registration, login, logout, password reset
- Role-based access control (Admin, OrgAdmin, Editor, Viewer)
- Email verification workflow with Redis-stored codes
- Password strength validation and bcrypt hashing

**Database Integration:**
- Implement Prisma ORM with existing PostgreSQL
- Run database migrations for user, form, organization tables
- Seed script with default admin user and sample data
- Database backup and restore functionality

**Form Management API:**
- Complete CRUD operations for forms and form elements
- Form versioning and publishing system
- Form submission handling with validation
- Bulk operations and form duplication
- Form analytics and submission tracking

**Organization Management:**
- Multi-tenant organization structure
- User invitation and management system
- Organization settings and branding
- Usage limits and quotas enforcement

### 2. FRONTEND APPLICATION (Priority: HIGH)

**React Application Setup:**
- Replace static HTML with full React 18 + TypeScript app
- Vite build system with hot module replacement
- Tailwind CSS + Radix UI component library
- React Router for client-side routing
- React Query for server state management
- Zustand for global state management

**Authentication UI:**
- Login/register forms with validation
- Password reset flow
- Email verification interface
- User profile management
- Organization switching

**Form Builder Interface:**
- Drag-and-drop canvas with grid snapping
- Component palette with all form elements
- Properties panel for element configuration
- Form preview mode with real-time updates
- Undo/redo functionality
- Form settings and publishing controls

**Form Elements (Complete Set):**
- TextInput, NumberInput, EmailInput, TextArea
- Picklist (single/multi-select), RadioGroup, Checkbox
- DatePicker, TimePicker, DateTime
- FileUpload with drag-and-drop
- Signature pad integration
- Email verification field
- Rich text editor
- Address/location fields

### 3. DRAG-AND-DROP SYSTEM (Priority: HIGH)

**Canvas Implementation:**
- react-dnd with HTML5 backend
- Grid-based positioning with snap-to-grid
- Element selection and multi-selection
- Resize handles and drag indicators
- Z-index management and layering
- Alignment guides and smart snapping
- Copy/paste and keyboard shortcuts

**Element Management:**
- Dynamic element registration system
- Property validation and type safety
- Element templates and presets
- Conditional logic and field dependencies
- Form validation rules engine

### 4. SALESFORCE INTEGRATION (Priority: MEDIUM)

**OAuth Flow:**
- Salesforce Connected App integration
- OAuth 2.0 authorization flow
- Token refresh and management
- Organization-level Salesforce connections

**Data Mapping:**
- Salesforce object discovery
- Field mapping interface
- Data type validation and conversion
- Batch submission handling
- Error handling and retry logic

**Form Deployment:**
- Deploy forms as Salesforce Lightning components
- Embed forms in Salesforce pages
- Submission data sync to Salesforce objects
- Real-time sync status monitoring

### 5. ADVANCED FEATURES (Priority: MEDIUM)

**Email System:**
- SendGrid integration for transactional emails
- Email verification workflows
- Form submission notifications
- Custom email templates
- Bulk email capabilities

**File Management:**
- Secure file upload handling
- File type validation and virus scanning
- Cloud storage integration (S3 compatible)
- Image optimization and thumbnails
- File download and access control

**Analytics & Reporting:**
- Form view and submission analytics
- Conversion rate tracking
- Geographic and device analytics
- Custom reports and dashboards
- Data export capabilities

### 6. TESTING & QUALITY (Priority: HIGH)

**Comprehensive Testing:**
- Backend: Jest + Supertest (≥80% coverage)
- Frontend: Jest + React Testing Library (≥80% coverage)
- Integration tests with test databases
- E2E tests with Playwright
- API documentation with OpenAPI

**Code Quality:**
- TypeScript strict mode throughout
- ESLint + Prettier configuration
- Husky pre-commit hooks
- SonarQube code analysis
- Performance monitoring and optimization

## 🛠 Development Guidelines

**Architecture Principles:**
- Follow existing monorepo structure strictly
- Keep files under 300 lines - break into modules
- Use barrel exports (index.ts) for clean imports
- Implement proper error handling and logging
- Follow RESTful API design patterns

**Security Requirements:**
- Input validation on all endpoints
- SQL injection prevention via Prisma
- XSS protection and content sanitization
- Rate limiting on all API endpoints
- Secure file upload handling
- CSRF protection for state-changing operations

**Performance Requirements:**
- Form builder should handle 100+ elements smoothly
- API responses under 200ms for CRUD operations
- Frontend bundle size under 1MB (excluding vendor)
- Database queries optimized with proper indexing
- Implement caching where appropriate

## 📋 Development Approach

**Start with these exact steps:**

1. **Assessment & Planning:**
   - Examine the current codebase structure
   - Review the existing backend API and database setup
   - Plan the database schema updates needed
   - Create a development roadmap

2. **Backend Foundation:**
   - Implement Prisma schema and run migrations
   - Build authentication system with JWT
   - Create user registration and login endpoints
   - Set up email verification workflow

3. **Frontend Setup:**
   - Replace static HTML with React application
   - Set up routing and state management
   - Implement authentication UI
   - Create basic dashboard structure

4. **Form Builder Core:**
   - Build drag-and-drop canvas
   - Implement basic form elements
   - Create properties panel
   - Add form save/load functionality

5. **API Integration:**
   - Connect frontend to backend APIs
   - Implement form CRUD operations
   - Add real-time form preview
   - Test end-to-end workflows

## 🎯 Success Criteria

**Phase 2 Complete When:**
- Users can register, login, and manage accounts
- Complete drag-and-drop form builder functional
- All form elements working with properties panels
- Forms can be saved, published, and submitted
- Basic Salesforce integration operational
- Comprehensive test coverage achieved
- Production deployment successful

## 📂 Repository Context

- **Current Repo**: https://github.com/PGSDaveMoudy/FormForge.git
- **Live Demo**: https://portwoodglobalsolutions.com
- **Infrastructure**: Production-ready with Docker, SSL, monitoring
- **Database**: PostgreSQL + Redis containers running
- **Deployment**: Universal script available for any domain

## 🚨 Critical Requirements

- **Always commit and push changes to maintain progress**
- **Follow the existing code structure and patterns**
- **Implement proper TypeScript typing throughout**
- **Include comprehensive error handling**
- **Write tests for all new functionality**
- **Update documentation as you build**
- **Ensure backward compatibility with existing infrastructure**

## 🎨 UI/UX Requirements

- **Professional Design**: Clean, modern interface using Tailwind CSS
- **Responsive**: Mobile-first approach, works on all devices
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Fast loading, smooth interactions
- **Intuitive**: Easy-to-use drag-and-drop interface

---

**Begin by examining the current codebase, then systematically build out the authentication system, followed by the React frontend, and finally the drag-and-drop form builder. Focus on getting a working MVP first, then enhance with advanced features.**

**Your goal: Transform FormForge from a infrastructure foundation into a fully functional, production-ready form builder application.**