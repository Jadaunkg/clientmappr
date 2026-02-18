# ClientMapr - Lead Generation SaaS

> **Phase 1 MVP Development** - Find pre-qualified leads for freelancers and agencies

## Overview

ClientMapr is a B2B SaaS platform that helps freelancers, web developers, and small digital agencies find pre-qualified leads. The platform scrapes business data from Google Maps and provides advanced filtering to identify businesses most likely to need web development services.

**Phase 1 Goal:** Build MVP with authentication, lead search, export, user dashboard, and billing system in 42 days.

## Tech Stack

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT + OAuth2 (Google, LinkedIn)
- **File Storage:** Local filesystem (./uploads/)
- **Email:** SendGrid
- **Payment:** Stripe (test mode)

### Frontend
- **Framework:** React 18 with Hooks
- **Bundler:** Vite
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios + React Query
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v6

### Development & DevOps
- **Testing:** Jest + Supertest + React Testing Library + Playwright
- **Code Quality:** ESLint + Prettier
- **Version Control:** Git
- **CI/CD:** GitHub Actions (to be set up)

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Docker Desktop (for local Supabase)
- Git

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/clientmapr.git
cd clientmapr
git checkout -b develop
git checkout -b feature/phase-1-mvp
```

### Step 2: Setup Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Verify server starts
npm run dev
# Should output: 🚀 Server running on http://localhost:5000
```

### Step 3: Setup Database

```bash
# In project root directory
# Install Supabase CLI
npm install -g supabase

# Start local Supabase (requires Docker)
supabase start

# Copy connection details from output to backend/.env

# Apply database migrations
supabase db push
```

### Step 4: Setup Frontend

```bash
cd frontend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start dev server
npm run dev
# Should open browser at http://localhost:3000
```

### Step 5: Verify Setup

```bash
# Health check
curl http://localhost:5000/health

# Should return:
# {
#   "success": true,
#   "data": {"status": "OK"},
#   "error": null
# }
```

## Project Structure

```
clientmapr/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API route definitions
│   │   ├── validators/         # Zod validation schemas
│   │   └── utils/              # Logger, errors, helpers
│   ├── tests/                  # Jest test files
│   ├── server.js               # Entry point
│   ├── package.json
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # React pages
│   │   ├── components/         # Reusable components
│   │   ├── hooks/              # Custom hooks
│   │   ├── context/            # React Context
│   │   ├── services/           # API service layer
│   │   ├── utils/              # Helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tests/                  # Jest tests
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   └── .gitignore
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # Database schema
│
├── docs/                       # Documentation
├── .github/
│   ├── copilot-context.md      # GitHub Copilot guidelines
│   └── workflows/              # CI/CD workflows (to be added)
│
├── clientMapr-phase1-daywise-strategy.md
├── clientMapr-copilot-prompt-guide.md
├── clientMapr-local-dev-setup.md
├── .gitignore
├── .env.example
└── README.md (this file)
```

## Available Scripts

### Backend Commands

```bash
cd backend

npm run dev              # Start dev server with auto-reload
npm start               # Start production server
npm run test            # Run all tests
npm run test:watch      # Watch mode for tests
npm run test:coverage   # Coverage report
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix linting issues
npm run format          # Format code with Prettier
npm run format:check    # Check formatting
```

### Frontend Commands

```bash
cd frontend

npm run dev             # Start dev server
npm run build           # Production build
npm run preview         # Preview production build
npm run test            # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix linting
npm run format          # Format code
npm run format:check    # Check formatting
```

### Database Commands

```bash
supabase start          # Start local development database
supabase stop           # Stop Supabase
supabase status         # Check status
supabase db push        # Apply migrations
supabase db reset       # Reset database (⚠️ deletes all data)
```

## Phase 1 Development Timeline

### Week 1: Authentication (Days 1-5)
- Backend: Auth API (signup, login, OAuth)
- Frontend: SignUp & Login pages
- Database: Users table & schema
- Tests: 80+ unit tests

### Week 2: Lead Database (Days 6-10)
- Database: Leads table with 100k+ sample data
- API: Lead search with basic filters
- Caching & performance optimization
- Tests: Integration tests for search

### Week 3: Advanced Filters (Days 11-15)
- API: Advanced filtering endpoints
- Frontend: Filter UI components
- Save & load search functionality
- Search suggestions

### Week 4: Exports & Dashboard (Days 16-20)
- Export service: CSV, Excel, JSON
- File storage & email delivery
- User dashboard with statistics
- Tests: Export flow tests

### Week 5: Billing System (Days 21-25)
- Stripe integration (test mode)
- 3-tier subscription plans
- Invoice generation
- Dashboard billing page

### Week 6: User Settings (Days 26-30)
- User profile & settings
- Notification preferences
- Feature toggles by tier

### Week 7: Testing & QA (Days 31-35)
- Comprehensive test coverage
- Performance testing
- Security review
- Bug fixes

### Week 8: Documentation (Days 36-40)
- API documentation (Swagger)
- Setup guides
- Deployment procedures
- Troubleshooting

### Week 9: Launch Prep (Days 41-42)
- Final testing
- Production readiness check
- Ready for soft launch

## Configuration

### Environment Variables

Create `.env` files in backend and frontend directories:

**backend/.env:**
```env
NODE_ENV=development
PORT=5000
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=your_key_here
JWT_SECRET=your_secret_key
# See backend/.env.example for full list
```

**frontend/.env:**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=http://localhost:54321
# See frontend/.env.example for full list
```

## Testing

### Run Tests

```bash
# Backend
cd backend
npm run test              # Run all tests once
npm run test:watch       # Continuous watch mode
npm run test:coverage    # With coverage report

# Frontend
cd frontend
npm run test              # Run component tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Test Coverage Targets
- Backend: 85%+
- Frontend: 80%+
- Overall: 85%+

## Code Style

### ESLint & Prettier

```bash
# Check
npm run lint
npm run format:check

# Fix
npm run lint:fix
npm run format
```

### Commit Messages

Follow conventional commit format:
```
feat: add user authentication
fix: resolve token expiration bug
docs: update setup guide
test: add auth service tests
refactor: simplify error handling
```

## API Documentation

### Health Check
```bash
GET /health
# Response:
{
  "success": true,
  "data": {"status": "OK"},
  "error": null
}
```

### Authentication Endpoints (Full documentation in progress)
```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/refresh-token
```

See [API docs](./docs/API.md) for complete endpoint documentation.

## Troubleshooting

### Backend Issues

**"Cannot connect to Supabase"**
```bash
# Make sure Docker is running
docker desktop
supabase start
# Check status
supabase status
```

**"Port 5000 already in use"**
```bash
# Find and kill process using port 5000
lsof -i :5000      # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

**Tests failing**
```bash
# Clear Jest cache
npm run test -- --clearCache
```

### Frontend Issues

**"Cannot reach API"**
- Verify backend is running: `curl http://localhost:5000/health`
- Check `REACT_APP_API_URL` in frontend/.env

**"Port 3000 already in use"**
```bash
# Kill process or change port in frontend package.json
# Find: "dev": "vite"
# Change to: "dev": "vite --port 3001"
```

##Contributing

### Workflow

1. Create feature branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes following code standards
   ```bash
   npm run lint:fix
   npm run format
   npm run test
   ```

3. Commit with conventional messages:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

4. Push and create Pull Request:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Request review and merge after approval

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Jetpack Documentation](https://jestjs.io)
- [Tailwind CSS](https://tailwindcss.com)
- [GitHub Copilot Prompt Guide](./.github/copilot-context.md)

## Phase 1 Planning Guides

- [Day-wise Development Strategy](./clientMapr-phase1-daywise-strategy.md)
- [GitHub Copilot Prompt Guide](./clientMapr-copilot-prompt-guide.md)
- [Local Development Setup](./clientMapr-local-dev-setup.md)

## License

MIT

## Contact

For questions about ClientMapr Phase 1 development, refer to the documentation files or team leads.

---

**Getting Started?**

1. Follow "Quick Start" section above
2. Read [Local Development Setup Guide](./clientMapr-local-dev-setup.md)
3. Review [GitHub Copilot Context](./.github/copilot-context.md)
4. Start with [Day 1 Plan](./clientMapr-phase1-daywise-strategy.md)

**Happy coding! 🚀**
