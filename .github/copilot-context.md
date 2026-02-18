# GitHub Copilot Context for ClientMapr Phase 1

## Project Overview
- **Project:** ClientMapr - Lead Generation SaaS
- **Phase:** Phase 1 MVP Development (42 days)
- **Tech Stack:** Node.js + React 18 + Supabase PostgreSQL
- **Development Mode:** 100% Local with free tier services
- **Goal:** Build MVP with auth, lead search, export, dashboard, and billing

## Architecture @ a Glance
```
Frontend (React + Vite) → Backend (Express.js) → Supabase (PostgreSQL)
     :3000                    :5000                http://localhost:54321
```

## Directory Structure Rules

**Backend:**
- `src/controllers/` - Route handlers (AuthController, LeadController)
- `src/services/` - Business logic (AuthService, LeadService)
- `src/middleware/` - Express middleware (auth, logging, errors)
- `src/routes/` - API route definitions
- `src/utils/` - Helper functions, logger, error handler
- `src/validators/` - Zod validation schemas
- `tests/` - Jest test files

**Frontend:**
- `src/pages/` - React pages (LoginPage, DashboardPage)
- `src/components/` - Reusable components
- `src/hooks/` - Custom React hooks (useAuth, useLeads)
- `src/context/` - React Context (AuthContext)
- `src/services/` - API service layer
- `src/utils/` - Utility functions
- `tests/` - Jest component tests

## Naming Conventions

**Files:**
- Backend: camelCase (authService.js, loginController.js)
- Frontend: PascalCase for components (SignUp.jsx, Dashboard.jsx)
- Backend middleware: camelCase ending with Middleware (authMiddleware.js)
- Frontend hooks: camelCase starting with 'use' (useAuth.js, useLeads.js)
- Frontend context: PascalCase ending with Context (AuthContext.jsx)

**Database (Supabase):**
- Tables: snake_case plural (users, leads, subscriptions, interactions, exports)
- Columns: snake_case (email, full_name, created_at, subscription_tier)
- Indexes: idx_table_column (idx_users_email, idx_leads_city)

## Code Standards

### Backend (Node.js Express)
- **Pattern:** Async/await (NO callbacks, ever)
- **Validation:** Zod validation schemas before business logic
- **Error Handling:** Custom AppError class with statusCode and message
- **Logging:** Winston logger (NO console.log)
- **Database:** Supabase @supabase/supabase-js client
- **Response Format:**
  ```javascript
  {
    success: true/false,
    data: {...} or null,
    error: {message, code} or null,
    meta: {timestamp}
  }
  ```
- **HTTP Status Codes:**
  - 200: Success OK
  - 201: Created
  - 400: Bad Request (validation)
  - 401: Unauthorized (auth required)
  - 403: Forbidden (no permission)
  - 404: Not Found
  - 409: Conflict (duplicate)
  - 429: Rate Limited
  - 500: Server Error

### Frontend (React 18)
- **Components:** Functional components with hooks only
- **State Management:** React Context + custom hooks
- **HTTP Client:** Axios with interceptors
- **Form Handling:** React Hook Form + Zod
- **Data Fetching:** React Query (@tanstack/react-query)
- **Styling:** Tailwind CSS utilities only
- **Props:** JSDoc with @param annotations
- **No:** console.log in code, inline styles, class components

## Authentication Flow

**Backend:**
- POST `/api/v1/auth/signup` - Create user with password hash
- POST `/api/v1/auth/login` - Verify credentials, return JWT token
- JWT token: 1-hour expiry, stored in Authorization header
- Refresh token: 7-day expiry, stored in secure HTTP-only cookie
- Middleware: `verifyJWT` extracts token from header, validates, attaches user to req

**Frontend:**
- AuthContext manages user state and tokens
- useAuth hook provides login/signup/logout functions
- Protected routes check authentication
- Auto-redirect to login if unauthenticated
- ProtectedRoute component wraps protected pages

## Database Tables (Supabase)

**users:** id, email, password_hash, full_name, subscription_tier, oauth_provider, oauth_id, email_verified, created_at, updated_at

**leads:** id, business_name, address, city, state, zip_code, phone, website_url, has_website, google_rating, review_count, business_category, latitude, longitude, created_at, updated_at

**subscriptions:** id, user_id, plan_type, stripe_subscription_id, status, monthly_price, billing_cycle, current_period_start, current_period_end, created_at, updated_at

**interactions:** id, user_id, lead_id, status, notes, created_at, updated_at

**exports:** id, user_id, format, file_name, file_path, record_count, status, error_message, created_at, updated_at

## API Endpoints (Phase 1)

```
Authentication:
  POST   /api/v1/auth/signup
  POST   /api/v1/auth/login
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/refresh-token
  POST   /api/v1/auth/verify-email
  POST   /api/v1/auth/reset-password

Leads:
  GET    /api/v1/leads (with filters & pagination)
  GET    /api/v1/leads/:id
  
Exports:
  POST   /api/v1/exports (create export)
  GET    /api/v1/exports (list user exports)
  GET    /api/v1/exports/:id (download export)

Dashboard:
  GET    /api/v1/dashboard/stats
  GET    /api/v1/dashboard/recent-leads
  
User:
  GET    /api/v1/user/profile
  PUT    /api/v1/user/profile
  GET    /api/v1/user/subscription
```

## Testing Standards

- **Unit Tests:** Test individual functions in isolation with Jest
- **Integration Tests:** Test API endpoints end-to-end
- **E2E Tests:** Test complete user flows with Playwright
- **Coverage Target:** 85%+ for backend, 80%+ for frontend
- **Mocking:** Mock Supabase, Stripe, SendGrid in tests

## Security Checklist

- ✅ No hardcoded secrets (use .env)
- ✅ Passwords hashed with bcryptjs (salt rounds: 10)
- ✅ JWT tokens signed with secret
- ✅ Refresh tokens in secure HTTP-only cookies
- ✅ Input validation on all endpoints (Zod)
- ✅ CORS configured for localhost
- ✅ Rate limiting on auth endpoints
- ✅ No sensitive data in logs
- ✅ SQL injection prevention (use parameterized queries)
- ✅ OWASP Top 10 addressed

## Environment Variables

**Backend .env:**
NODE_ENV, PORT, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, SENDGRID_API_KEY, STRIPE_SECRET_KEY

**Frontend .env:**
REACT_APP_API_URL, REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY, REACT_APP_STRIPE_PUBLISHABLE_KEY

## Common Patterns

**Backend Service Function:**
```javascript
/**
 * Authenticates user with email and password
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<{accessToken, refreshToken}>}
 * @throws {AppError} If credentials invalid
 */
async function login(email, password) {
  const user = await supabase.from('users').select().eq('email', email).single();
  if (!user) throw new AppError('Invalid credentials', 401);
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new AppError('Invalid credentials', 401);
  const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '1h'});
  return {accessToken: token};
}
```

**Frontend Hook:**
```javascript
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/v1/auth/login', {email, password});
      setUser(response.data.data.user);
      localStorage.setItem('token', response.data.data.accessToken);
    } finally {
      setLoading(false);
    }
  };
  
  return {user, loading, login};
}
```

## Useful Commands

```bash
# Backend
npm install              # Install dependencies
npm run dev             # Start dev server with auto-reload
npm run lint            # Check code style
npm run test            # Run tests
npm run test:coverage   # Coverage report

# Frontend  
npm install             # Install dependencies
npm run dev            # Start dev server
npm run build          # Production build
npm run lint           # Check code style
npm run test           # Run component tests

# Database
supabase start         # Start local Supabase
supabase stop          # Stop local Supabase
supabase db push       # Apply migrations
```

## Debugging Tips

- **Backend logs:** Check `logs/` folder (Winston logger)
- **Database:** Open Supabase Studio at http://localhost:54321
- **Network requests:** Use browser DevTools Network tab
- **React component state:** Use React DevTools extension
- **API errors:** Check response format in frontend

## Phase 1 Success Metrics

By end of Day 5:
✅ Backend API running on localhost:5000
✅ Frontend running on localhost:3000
✅ Database schema migrated
✅ Git initialized with meaningful commits
✅ 80+ unit tests passing
✅ Code follows all standards above
✅ ESLint passes without warnings

---

**Use this context when writing prompts for GitHub Copilot. Reference this file for consistency!**
