# ClientMapr - Phase 1 Development Strategy (Day-wise)
## Local Development with Supabase, GitHub Copilot & Free Services

**Phase Duration:** 9 Weeks (42 Days of Active Development)  
**Team:** 2 Backend + 2 Frontend + 1 QA (Can work with 3-4 people)  
**Tech Stack:** Node.js + React + Supabase + Free Tier Services  
**Development Mode:** 100% Local, CI/CD on GitHub Actions (free)  

---

## TABLE OF CONTENTS
1. [Project Setup & GitHub Copilot Configuration](#project-setup--github-copilot-configuration)
2. [Week-by-Week Breakdown](#week-by-week-breakdown)
3. [Day-wise Development Plan](#day-wise-development-plan)
4. [GitHub Copilot Prompt Guidelines](#github-copilot-prompt-guidelines)
5. [Code Generation Best Practices](#code-generation-best-practices)
6. [Testing Strategy](#testing-strategy)
7. [Daily Review & QA Checklist](#daily-review--qa-checklist)
8. [Free Services & Tools Setup](#free-services--tools-setup)
9. [Local Development Environment](#local-development-environment)

---

## PROJECT SETUP & GITHUB COPILOT CONFIGURATION

### Prerequisites Setup (Day 0 - Before Development Starts)

#### Step 1: GitHub Copilot Setup

```bash
# 1. Ensure GitHub Copilot is installed in VS Code
Extensions → Search "GitHub Copilot"
Install both:
  - GitHub Copilot
  - GitHub Copilot Chat

# 2. Login with GitHub account
Ctrl+Shift+P → GitHub Copilot: Authorize

# 3. Test Copilot
Create a test file and type: function add(a, b) {
Press Tab to accept suggestions
```

#### Step 2: Project Repository Setup

```bash
# Initialize repository
git clone https://github.com/your-username/clientmapr.git
cd clientmapr

# Create main branches
git checkout -b develop
git checkout -b main

# Create feature branch for Phase 1
git checkout -b feature/phase-1-mvp

# Create directory structure
mkdir -p backend frontend mobile docs
cd backend && npm init -y
cd ../frontend && npm init -y
```

#### Step 3: Supabase Setup (Local & Cloud)

```bash
# Option A: Supabase Local (Docker)
npm install -g supabase-cli
supabase start  # Starts local PostgreSQL + Supabase

# Connection string will be displayed
# Save to .env.local file

# Option B: Supabase Cloud (Free Tier)
1. Go to https://supabase.com
2. Sign up free
3. Create new project
4. Get connection string
5. Save to .env file

# Database URL format:
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_KEY=xxxx
```

#### Step 4: GitHub Copilot Context Configuration

Create `.github/copilot-context.md`:

```markdown
# GitHub Copilot Context Guidelines

## Project Overview
- ClientMapr: Lead generation SaaS for freelancers & agencies
- Stack: Node.js + React + Supabase
- Local development with free tier services

## Code Style Guidelines
- File naming: camelCase for JS, PascalCase for React components
- Folder structure: services/, controllers/, models/, hooks/, components/
- Use async/await (no callbacks)
- Use ES6+ features
- Enforce ESLint rules
- Add JSDoc comments for functions

## Database: Supabase PostgreSQL
- Use supabase-js SDK (@supabase/supabase-js)
- Use Row Level Security (RLS) policies
- Tables: users, leads, subscriptions, exports
- Real-time: Use supabase.from().on() for real-time updates

## API Patterns
- RESTful endpoints: /api/v1/resource
- Middleware: auth, logging, error handling
- Response format: {success, data, error, meta}
- Error handling: Try-catch with proper HTTP status codes

## Testing Requirements
- Unit tests: Jest (services, utils)
- Integration tests: API endpoints
- E2E tests: User flows
- Target: 85%+ coverage

## React Component Standards
- Functional components (hooks)
- Custom hooks for logic
- Context for state (auth, subscription)
- React Query for API calls
- Tailwind CSS for styling

## Security Standards
- Hash passwords with bcryptjs
- JWT for authentication
- Environment variables for secrets
- Input validation (Zod)
- SQL injection prevention: Use parameterized queries

## Documentation
- JSDoc for functions
- README.md for setup
- API docs (Swagger comments)
- Commit messages: feat:, fix:, docs:, test:, refactor:
```

---

## WEEK-BY-WEEK BREAKDOWN

### Week 1: Foundation & Authentication (Days 1-5)
```
Mon (Day 1): Project setup, Database schema, Backend skeleton
Tue (Day 2): Authentication API (signup, login, email verification)
Wed (Day 3): OAuth integration (Google, LinkedIn), JWT tokens
Thu (Day 4): Frontend auth pages (signup, login, reset password)
Fri (Day 5): Integration testing, code review, bug fixes

Deliverables:
  ✅ Users can signup with email/password
  ✅ Users can login and get JWT token
  ✅ Email verification flow working
  ✅ OAuth callbacks working
  ✅ 80+ unit tests
  ✅ Protected routes on frontend
```

### Week 2: Lead Database & Google Maps (Days 6-10)
```
Mon (Day 6): Database schema, Supabase setup, seed script
Tue (Day 7): Google Maps API integration, lead scraping service
Wed (Day 8): Lead storage, indexing, caching strategy
Thu (Day 9): Search API endpoints (basic filtering)
Fri (Day 10): Integration tests, performance tuning, review

Deliverables:
  ✅ 100k+ leads in database
  ✅ Lead search API working
  ✅ Basic filters working
  ✅ Caching implemented
  ✅ <500ms search response
```

### Week 3: Advanced Filtering (Days 11-15)
```
Mon (Day 11): Advanced filter endpoints, filter validation
Tue (Day 12): Frontend filter components, UI layout
Wed (Day 13): Save search functionality, search history
Thu (Day 14): Filter performance optimization
Fri (Day 15): Testing, refinement, code review

Deliverables:
  ✅ All filter types working (basic + advanced)
  ✅ Save/load search working
  ✅ Filter UI complete
  ✅ Search suggestions
```

### Week 4: Export & Dashboard (Days 16-20)
```
Mon (Day 16): Export service (CSV, Excel, JSON), S3/local storage
Tue (Day 17): Export endpoints, usage tracking, email
Wed (Day 18): Dashboard page, stats display, recent items
Thu (Day 19): Export history, UI refinement
Fri (Day 20): Integration testing, optimization, review

Deliverables:
  ✅ CSV/Excel export working
  ✅ File storage set up
  ✅ Usage limits enforced
  ✅ Dashboard displaying metrics
```

### Week 5: Billing System (Days 21-25)
```
Mon (Day 21): Stripe integration (free trial account), products setup
Tue (Day 22): Subscription endpoints, payment processing
Wed (Day 23): Billing page frontend, plan comparison
Thu (Day 24): Invoice generation, email notifications
Fri (Day 25): End-to-end testing, bug fixes, review

Deliverables:
  ✅ 3 pricing tiers configured
  ✅ Stripe webhook handling
  ✅ Usage limits enforced by tier
  ✅ Billing page working
  ✅ Invoices generated
```

### Week 6: User Dashboard & Settings (Days 26-30)
```
Mon (Day 26): Settings endpoints, profile management
Tue (Day 27): Preferences, notifications, import/export settings
Wed (Day 28): Frontend settings pages, forms
Thu (Day 29): Analytics data aggregation
Fri (Day 30): Testing, polish, code review

Deliverables:
  ✅ Settings fully functional
  ✅ User preferences working
  ✅ Analytics dashboard displaying
```

### Week 7: Testing & Optimization (Days 31-35)
```
Mon (Day 31): Comprehensive unit test coverage (85%+)
Tue (Day 32): Integration test suite, database tests
Wed (Day 33): Performance testing, optimization
Thu (Day 34): Security testing, vulnerability scanning
Fri (Day 35): Load testing, stress testing, refinement

Deliverables:
  ✅ 85%+ test coverage
  ✅ All E2E flows working
  ✅ Performance targets met
  ✅ <1s page load time
```

### Week 8: Documentation & Staging (Days 36-40)
```
Mon (Day 36): API documentation (Swagger), README updates
Tue (Day 37): Setup guides, troubleshooting docs
Wed (Day 38): Deployment guide, database backup procedures
Thu (Day 39): Final bug fixes, last-minute polish
Fri (Day 40): Release candidate testing, final review

Deliverables:
  ✅ Complete API docs
  ✅ Setup guides
  ✅ Deployment procedures
  ✅ All critical bugs fixed
```

### Week 9: Ready for Soft Launch (Days 41-42)
```
Mon (Day 41): Soft launch prep, monitoring setup
Tue (Day 42): Final QA, production checklist verification

Deliverables:
  ✅ MVP ready for beta launch
  ✅ 100+ beta users can test
  ✅ Monitoring & logging active
  ✅ Backup procedures tested
```

---

## DAY-WISE DEVELOPMENT PLAN

### DAY 1: Project Setup & Database Schema

#### Morning (2 hours)

**Task 1: Copilot Prompt for Backend Boilerplate**

```
Create an Express.js backend boilerplate with the following:
- Express server on port 5000
- Environment variables using dotenv
- Middleware: CORS, compression, logging (Morgan)
- Error handling middleware
- Request validation middleware
- Helmet for security headers
- Directory structure: routes/, controllers/, services/, models/

Code should follow:
- async/await pattern
- Consistent error handling
- No console.log (use Winston for logging)
- JSDoc comments
- ESLint compatible

Generate package.json with dependencies:
express, dotenv, cors, compression, morgan, helmet, winston, bcryptjs, jsonwebtoken
```

**Expected Output:** Full Express app skeleton with middleware setup

**Task 2: Database Schema Design (Supabase)**

```
Create Supabase SQL schema for ClientMapr Phase 1 with:

1. Users table:
   - id (UUID, primary key)
   - email (unique)
   - password_hash
   - full_name
   - subscription_tier (enum: free_trial, starter, professional, enterprise)
   - created_at, updated_at
   - email_verified (boolean)

2. Leads table:
   - id (UUID, primary key)
   - business_name
   - address, city, state, zip_code
   - phone, website_url
   - has_website (boolean)
   - google_rating, review_count
   - business_category
   - latitude, longitude
   - created_at, updated_at
   - Indexes on: city, state, business_category, has_website

3. Subscriptions table:
   - id (UUID, primary key)
   - user_id (foreign key)
   - plan_type (enum)
   - stripe_subscription_id
   - status (active/canceled/past_due)
   - monthly_price, billing_cycle
   - current_period_start, current_period_end
   - created_at

4. User_Leads_Interaction table:
   - id (UUID)
   - user_id, lead_id (foreign keys)
   - status (not_contacted, contacted, qualified, rejected, won)
   - notes
   - created_at, updated_at

Generate SQL migration file with all table definitions and indexes.
```

**Expected Output:** Complete SQL migration script

#### Afternoon (2 hours)

**Task 3: Copilot Prompt for Frontend Boilerplate**

```
Create a React + Vite project with:
- React 18, React Router v6
- Tailwind CSS configured
- Axios for API calls with interceptors
- React Query (TanStack Query) for server state
- React Context for auth state
- Custom hooks pattern
- Directory structure: pages/, components/, hooks/, services/, context/, utils/

Features:
- Protected routes component
- API service layer with error handling
- Auth context with JWT token management
- Responsive layout (Header, Sidebar, Main)
- Reusable UI components (Button, Input, Modal, Card)
- Environment variable configuration

Include eslintrc.json with strict rules
Include tailwind.config.js with custom colors
```

**Expected Output:** React Vite project ready for feature development

#### Daily Review Checklist:
```
☐ Backend boilerplate runs on localhost:5000
☐ Frontend runs on localhost:3000
☐ Database migrations created (but not run yet)
☐ Environment files (.env.example) created
☐ Git commits made with messages (feat: initial setup)
☐ README.md updated with setup instructions
☐ Code passes ESLint check
```

---

### DAY 2: Authentication API Development

#### Morning (3 hours)

**Task 1: Copilot Prompt for Auth Service**

```
Create authService.js with the following functions:

1. signup(email, password, fullName)
   - Validate email format and password strength
   - Hash password with bcryptjs (salt rounds: 10)
   - Create user in Supabase
   - Send verification email
   - Return: {success: true, user: {id, email, fullName}}

2. login(email, password)
   - Find user in Supabase
   - Compare password with hash
   - Generate JWT token (RS256, expires in 1h)
   - Generate refresh token (expires in 7d)
   - Return: {success: true, accessToken, refreshToken}

3. verifyEmail(token)
   - Decode token
   - Update user email_verified = true
   - Return: {success: true}

4. refreshAccessToken(refreshToken)
   - Verify refresh token
   - Generate new access token
   - Return: {success: true, accessToken}

5. resetPassword(email)
   - Generate password reset token
   - Send email with reset link
   - Return: {success: true, message: 'Email sent'}

6. validateJWT(token)
   - Verify and decode JWT
   - Return decoded payload or throw error

Use Supabase client (@supabase/supabase-js):
- const supabase = createClient(url, anonKey)
- supabase.from('users').insert(), select(), update()

Error handling: Throw custom errors for business logic
All functions should be async
Use JSDoc comments
Use try-catch with proper error messages
```

**Expected Output:** Complete auth service with all functions

**Task 2: Copilot Prompt for Auth Controller**

```
Create authController.js with route handlers:

1. POST /api/v1/auth/signup
   - Extract email, password, fullName from request body
   - Call authService.signup()
   - Return 201 status with user data
   - Handle validation errors (400)
   - Handle existing user errors (409)

2. POST /api/v1/auth/login
   - Extract email, password
   - Call authService.login()
   - Set refresh token in secure HTTP-only cookie
   - Return 200 with accessToken
   - Handle invalid credentials (401)

3. POST /api/v1/auth/verify-email
   - Extract token from request body
   - Call authService.verifyEmail()
   - Return 200 with success message
   - Handle invalid token (400)

4. POST /api/v1/auth/refresh-token
   - Extract refresh token from secure cookie
   - Call authService.refreshAccessToken()
   - Return new access token
   - Handle expired token (401)

5. POST /api/v1/auth/reset-password
   - Extract email
   - Call authService.resetPassword()
   - Return 200 with message
   
6. POST /api/v1/auth/logout
   - Clear refresh token cookie
   - Return 200 with success

Response format for all endpoints:
{
  success: true/false,
  data: {...},
  error: null/error message,
  meta: {timestamp: Date.now()}
}

Use middleware for:
- validateRequest (validate request body with Zod)
- errorHandler (catch and format errors)
- logger (log all requests)

Create middleware functions before controller
```

**Expected Output:** Auth routes and controller handlers

#### Afternoon (2 hours)

**Task 3: Copilot Prompt for Auth Middleware**

```
Create auth middleware (middleware/authMiddleware.js):

1. verifyJWT middleware
   - Extract JWT from Authorization header (Bearer token)
   - Call authService.validateJWT()
   - Attach user to request.user
   - Return 401 if invalid/missing
   - Pass control to next middleware if valid

2. checkSubscriptionTier middleware
   - Extract subscription tier from user
   - Optional parameter: requiredTiers (array)
   - Return 403 if user tier not in requiredTiers
   - Used to gate Pro/Enterprise features

3. rateLimitAuth middleware
   - Limit auth endpoints: 5 requests per minute
   - Track by IP address using redis
   - Return 429 if exceeded
   - Include retry-after header

Use:
- @supabase/supabase-js for database calls
- jsonwebtoken for token verification
- redis for rate limiting cache

All middleware functions return (req, res, next) pattern
Add JSDoc with @param, @returns
```

**Expected Output:** Complete middleware suite

#### Daily Testing Tasks:

```javascript
Test 1: POST /api/v1/auth/signup
  Input: {email: 'test@example.com', password: 'SecurePass123!', fullName: 'Test User'}
  Expected: 201 status, user created
  
Test 2: POST /api/v1/auth/login
  Input: {email: 'test@example.com', password: 'SecurePass123!'}
  Expected: 200 status, accessToken, refreshToken cookie set

Test 3: POST /api/v1/auth/login (wrong password)
  Input: {email: 'test@example.com', password: 'WrongPassword'}
  Expected: 401 status, error message

Test 4: Verify protected route with JWT
  Send request with Authorization: Bearer <token>
  Expected: 200 status, user.id in request.user

Test 5: JWT expiration
  Wait for token to expire (mock time)
  Expected: 401 status on next request
```

#### Daily Code Review Checklist:
```
☐ All passwords hashed (never stored plain)
☐ JWT tokens properly signed
☐ Refresh tokens in secure HTTP-only cookies
☐ No sensitive data in logs
☐ All endpoints have input validation
☐ All error responses follow format
☐ 10+ unit tests for auth service
☐ 5+ integration tests for auth endpoints
☐ ESLint passes without warnings
☐ Code coverage >80%
```

---

### DAY 3: OAuth Integration (Google & LinkedIn)

#### Morning (2 hours)

**Task 1: Copilot Prompt for OAuth Service**

```
Create oauthService.js for Google and LinkedIn OAuth:

1. generateGoogleAuthUrl()
   - Generate Google OAuth URL using google-auth-library
   - Scope: email, profile
   - Return: authorization_url

2. handleGoogleCallback(code)
   - Exchange authorization code for tokens
   - Get user profile from Google
   - Check if user exists in database
   - If exists: return existing user
   - If not exists: create new user with oauth_provider='google' and oauth_id=google_id
   - Generate JWT and refresh token
   - Return: {accessToken, refreshToken, user}

3. generateLinkedInAuthUrl()
   - Generate LinkedIn OAuth URL
   - Scope: r_liteprofile r_emailaddress
   - Return: authorization_url

4. handleLinkedInCallback(code, state)
   - Exchange code for tokens
   - Get user profile from LinkedIn (name, email)
   - Check if user exists
   - If exists: return existing user
   - If not exists: create new user with oauth_provider='linkedin' and oauth_id=linkedin_id
   - Generate JWT and refresh token
   - Return: {accessToken, refreshToken, user}

Use libraries:
- google-auth-library: npm install google-auth-library
- linkedin-unofficial: npm install linkedin-unofficial
  (Or use oauth2 package for generic handling)

Handle errors:
- Invalid authorization code: throw 401
- Network errors: throw 502
- User creation errors: throw 500

All functions async, with JSDoc
```

**Expected Output:** OAuth service with Google and LinkedIn support

**Task 2: Copilot Prompt for OAuth Controller**

```
Create routes for OAuth callbacks:

1. GET /api/v1/auth/google (Initiate Google OAuth)
   - Call oauthService.generateGoogleAuthUrl()
   - Redirect to Google authorization URL

2. GET /api/v1/auth/google/callback
   - Extract authorization code from query
   - Call oauthService.handleGoogleCallback(code)
   - Set refresh token in secure cookie
   - Redirect to frontend with access token as query param
   - Frontend saves token in localStorage
   - Redirect to dashboard

3. GET /api/v1/auth/linkedin (Initiate LinkedIn OAuth)
   - Call oauthService.generateLinkedInAuthUrl()
   - Redirect to LinkedIn authorization URL

4. GET /api/v1/auth/linkedin/callback
   - Extract code and state from query
   - Call oauthService.handleLinkedInCallback(code, state)
   - Set refresh token in cookie
   - Redirect to frontend with token
   - Frontend saves token, redirects to dashboard

Response pattern:
- Success: Redirect to frontend: window.location.href = `${FRONTEND_URL}/dashboard?token=${accessToken}`
- Error: Redirect to: `${FRONTEND_URL}/login?error=oauth_failed`

Callback URLs must match registered URLs in OAuth provider settings
```

**Expected Output:** OAuth routes with redirects

#### Afternoon (2 hours)

**Task 3: Supabase RLS (Row Level Security) for Users**

```
Create RLS policies for users table:

1. Users can read their own profile
   - Policy name: 'Users can read own profile'
   - USING: auth.uid() = id

2. Users can update their own profile
   - Policy name: 'Users can update own profile'
   - USING: auth.uid() = id
   - WITH CHECK: auth.uid() = id

3. Public can insert (signup)
   - Policy name: 'Anyone can signup'
   - Target: INSERT
   - Allow anyone to insert

4. Service role can do anything (backend)
   - Use service_role_key for backend operations
   - Don't use RLS for service operations

Enable RLS on users table
All queries from frontend: use anon_key with RLS
All queries from backend: use service_role_key (no RLS)
```

#### Daily Testing Tasks:

```
Test 1: Google OAuth Flow
  1. User clicks "Login with Google"
  2. Redirected to Google login
  3. User authorizes app
  4. Redirected back to callback
  5. JWT token generated
  6. User logged in

Test 2: LinkedIn OAuth Flow
  1. User clicks "Login with LinkedIn"
  2. Redirected to LinkedIn login
  3. User authorizes app
  4. Redirected back to callback
  5. JWT token generated
  6. User logged in

Test 3: Creating user via OAuth
  - First time: Create new user
  - Second time: Return existing user
  
Test 4: OAuth with existing email
  - Merge with existing user account
```

#### Daily Code Review Checklist:
```
☐ OAuth secrets in environment variables (never in code)
☐ All redirects use HTTPS in production
☐ CSRF protection implemented (state parameter)
☐ All OAuth tokens stored securely
☐ No sensitive data logged
☐ Error messages don't leak information
☐ Rate limiting on OAuth endpoints
☐ 8+ tests for OAuth flows
☐ RLS policies configured correctly
```

---

### DAY 4: Frontend Authentication Pages

#### Morning (3 hours)

**Task 1: Copilot Prompt for Auth Context**

```
Create React Context for authentication (context/AuthContext.jsx):

State to manage:
- user: {id, email, fullName, subscriptionTier}
- accessToken: JWT token
- loading: boolean (during auth operations)
- error: error message or null
- isAuthenticated: boolean

Functions to implement:
1. signup(email, password, fullName)
   - Validate inputs (email format, password strength)
   - Call POST /api/v1/auth/signup
   - Store accessToken in localStorage
   - Store user in context
   - Return success or throw error

2. login(email, password)
   - Call POST /api/v1/auth/login
   - Store accessToken
   - Store user
   - Return success

3. loginWithGoogle()
   - Redirect to /api/v1/auth/google

4. loginWithLinkedIn()
   - Redirect to /api/v1/auth/linkedin

5. logout()
   - Clear localStorage
   - Clear user state
   - Redirect to /login

6. verifyEmail(token)
   - Call POST /api/v1/auth/verify-email with token

7. resetPassword(email)
   - Call POST /api/v1/auth/reset-password

8. refreshToken()
   - Call POST /api/v1/auth/refresh-token
   - Update accessToken in context
   - Called automatically before expiration

Use React Context API:
- createContext()
- useReducer for complex state
- useEffect for auto-refresh token

Persist to localStorage:
- accessToken
- user data

Error handling: All errors caught and set in error state
Loading state: Set during API calls
```

**Expected Output:** Complete AuthContext with all auth logic

**Task 2: Copilot Prompt for ProtectedRoute Component**

```
Create ProtectedRoute component (components/ProtectedRoute.jsx):

Function: Redirect to login if not authenticated

Implementation:
1. Read user from AuthContext
2. If authenticated: render children component
3. If not authenticated: redirect to /login
4. If loading: show loading spinner
5. Optional: check subscription tier (gated features)

Usage:
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

<ProtectedRoute requiredTier="professional">
  <AdvancedFeatures />
</ProtectedRoute>

Handle:
- Auto-redirect on logout
- Refresh token silently when needed
- Display loading state during auth check
```

**Expected Output:** ProtectedRoute HOC component

**Task 3: Copilot Prompt for SignUp Page**

```
Create SignUp page (pages/SignUp.jsx):

Layout:
┌─────────────────────────────────┐
│        ClientMapr Logo          │
│      Create Your Account        │
├─────────────────────────────────┤
│ Full Name: [______]             │
│ Email:     [______]             │
│ Password:  [______]             │
│ Confirm:   [______]             │
│                                 │
│ [✓] I agree to Terms            │
│                                 │
│ [Sign Up Button]                │
│                                 │
│ [Divider: OR]                   │
│ [Google Button]  [LinkedIn Btn] │
│                                 │
│ Already have account? Login     │
└─────────────────────────────────┘

Features:
- Full name, email, password, confirm password inputs
- Form validation (email format, password strength)
- Password strength indicator (weak/fair/good/strong)
- Show/hide password toggle
- Terms acceptance checkbox
- Error messages display
- Success message after signup
- Redirect to email verification page
- OAuth buttons (Google, LinkedIn)
- Loading state during submission
- Link to login page

Use React Hook Form for form management:
- register()
- handleSubmit()
- formState.errors

Use Zod for validation schema:
  const schema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  })

Error handling:
- Email already exists: Show error message
- Weak password: Show requirements
- Network error: Show retry option

Styling: Tailwind CSS with custom theme
```

**Expected Output:** Complete SignUp page with validation

#### Afternoon (2 hours)

**Task 4: Copilot Prompt for Login Page**

```
Create Login page (pages/Login.jsx):

Layout:
┌─────────────────────────────────┐
│        ClientMapr Logo          │
│         Log In                  │
├─────────────────────────────────┤
│ Email:     [______]             │
│ Password:  [______]             │
│ [✓] Remember me                 │
│                                 │
│ [Forgot Password?]              │
│                                 │
│ [Log In Button]                 │
│                                 │
│ [Divider: OR]                   │
│ [Google Button]  [LinkedIn Btn] │
│                                 │
│ Don't have account? Sign Up     │
└─────────────────────────────────┘

Features:
- Email and password inputs
- Show/hide password toggle
- Remember me checkbox (stores email, not password)
- Forgot password link
- Error messages (invalid credentials)
- Loading state
- OAuth buttons
- Link to signup
- Redirect to dashboard on success
- Handle token expiration gracefully

Error handling:
- Invalid credentials (401): Show generic error (don't reveal if email exists)
- Too many login attempts: Show rate limit message
- Network error: Show retry option

On success:
- Store JWT token in localStorage
- Store user data in AuthContext
- Redirect to /dashboard
```

**Expected Output:** Complete Login page

#### Daily Testing Tasks:

```
Test 1: SignUp Form Validation
  - Empty fields: Show validation errors
  - Invalid email: Show error
  - Weak password: Show requirements
  - Emails mismatch: Show error
  
Test 2: SignUp Success
  - Valid inputs: User created, redirected to email verification
  
Test 3: Login Form
  - Valid credentials: Logged in, redirected to dashboard
  - Invalid credentials: Show error
  - Empty fields: Show validation errors
  
Test 4: OAuth Buttons
  - Google button: Initiates OAuth flow
  - LinkedIn button: Initiates OAuth flow
  
Test 5: Protected Routes
  - Unauthenticated user accessing /dashboard: Redirected to /login
  - Authenticated user accessing /login: Redirected to /dashboard
```

#### Daily Code Review Checklist:
```
☐ No password stored in localStorage (only token)
☐ All API calls use HTTPS in production
☐ Form validation works client-side
☐ Error messages don't leak sensitive info
☐ Loading states display properly
☐ All Tailwind styles responsive
☐ Component tests: 15+ tests passing
☐ No console.log in production code
☐ Accessibility: labels, ARIA attributes
☐ OAuth buttons working
```

---

### DAY 5: Integration Testing & Code Review

#### Morning (2 hours)

**Task 1: Write Integration Tests**

```
Create tests/integration/auth.integration.test.js:

Test Scenarios:
1. Complete signup flow
   - POST /api/v1/auth/signup
   - Verify user created
   - Verify email sent (mock)
   - Verify response has correct format

2. Complete login flow
   - POST /api/v1/auth/login
   - Verify JWT token returned
   - Verify refresh token in cookie
   - Verify user can access protected route

3. Token refresh flow
   - POST /api/v1/auth/login
   - Wait for access token to expire
   - POST /api/v1/auth/refresh-token
   - Verify new token generated
   - Verify old token no longer works

4. Email verification
   - POST /api/v1/auth/signup
   - POST /api/v1/auth/verify-email with token
   - Verify email_verified=true in database
   - Verify password reset works only after verification

5. Google OAuth flow
   - GET /api/v1/auth/google
   - Verify redirect to Google
   - Mock Google callback
   - Verify JWT token generated
   - Verify user created in database

Setup:
- Use Jest with supertest
- Mock Supabase client (@supabase/supabase-js)
- Mock email service
- Use test database (separate)
- Clean database after each test

Use testing-library for assertions:
- expect(response.status).toBe(200)
- expect(response.body.data.user).toBeDefined()
```

**Expected Output:** Comprehensive integration tests for auth

**Task 2: Copilot Prompt for E2E Tests (Frontend)**

```
Create Playwright E2E tests (tests/e2e/auth.e2e.spec.js):

Test Scenarios:
1. Complete user signup flow
   - Navigate to /signup
   - Fill signup form
   - Submit form
   - Verify success message
   - Verify redirected to email verification page

2. Email verification flow
   - Check test email inbox (mock)
   - Click verification link
   - Verify success message
   - Verify can now login

3. Complete login flow
   - Navigate to /login
   - Fill login form
   - Submit form
   - Verify JWT token in localStorage
   - Verify redirected to /dashboard

4. Logout flow
   - Login (see above)
   - Click logout button
   - Verify token removed from localStorage
   - Verify redirected to /login

5. Protected route access
   - Access /dashboard without login
   - Verify redirected to /login
   - After login: verify can access /dashboard

6. Session timeout
   - Login
   - Wait for token to expire
   - Try to access protected route
   - Verify redirected to /login

Setup:
- Use Playwright
- Test on Chrome, Firefox
- Mock API if needed (or use test backend)
- Clear localStorage between tests

Usage:
playwright test tests/e2e/auth.e2e.spec.js
```

**Expected Output:** End-to-end tests for auth flows

#### Afternoon (2 hours)

**Task 3: Code Review Checklist**

```
Backend Code Review:

Security:
  ☐ No passwords logged
  ☐ No tokens in response body (only in secure cookie)
  ☐ All inputs validated
  ☐ SQL injection prevention (parameterized queries)
  ☐ CORS properly configured
  ☐ Rate limiting on auth endpoints
  ☐ JWT signing key secure
  ☐ Refresh tokens cannot be used as access tokens

Code Quality:
  ☐ All functions have JSDoc comments
  ☐ Error handling consistent
  ☐ No console.log or console.error in production
  ☐ Logger (Winston) used instead
  ☐ DRY principle followed
  ☐ No hardcoded values (use config)
  ☐ Consistent naming conventions
  ☐ No unused imports
  ☐ ESLint passes
  ☐ Code coverage >85%

Database:
  ☐ All tables have created_at, updated_at
  ☐ Foreign keys configured
  ☐ Indexes on frequently searched columns
  ☐ RLS policies in place for frontend access
  ☐ Service role key used for backend

Tests:
  ☐ All critical paths tested
  ☐ Error scenarios covered
  ☐ Integration tests for API flows
  ☐ 80+ tests passing
  ☐ Coverage report generated
  ☐ Test data cleaned up after each test

Frontend Code Review:

Functionality:
  ☐ All components render without errors
  ☐ Forms validate correctly
  ☐ Error messages display properly
  ☐ Loading states show during API calls
  ☐ Success messages confirm actions
  ☐ Redirects work as expected

Security:
  ☐ Tokens only in localStorage/cookie
  ☐ No sensitive data in components
  ☐ Input validation before API calls
  ☐ HTTPS enforced in production

User Experience:
  ☐ Forms are intuitive
  ☐ Error messages are helpful
  ☐ Loading indicators present
  ☐ Responsive on mobile
  ☐ Keyboard navigation works
  ☐ Accessibility: labels, ARIA attributes

Code Quality:
  ☐ React best practices followed (hooks, etc.)
  ☐ No console.log in production
  ☐ Components properly named (PascalCase)
  ☐ Files properly named (camelCase)
  ☐ JSDoc comments for complex logic
  ☐ No unused state/props
  ☐ Consistent import ordering
  ☐ ESLint passes
  ☐ Prettier formatting applied

Testing:
  ☐ Component tests for all pages (15+ tests)
  ☐ E2E tests for critical flows (5+ tests)
  ☐ Error handling tested
  ☐ 80%+ coverage

Performance:
  ☐ No unnecessary re-renders
  ☐ API calls memoized/cached appropriately
  ☐ Bundle size < 150KB (gzipped)
  ☐ Images optimized
```

**Task 4: Git Code Review & Commit**

```
Before pushing to GitHub:

1. Run all tests locally
   npm run test:unit
   npm run test:integration
   npm run test:e2e
   npm run test:coverage

2. Run linting
   npm run lint
   npm run format:check

3. Build check
   npm run build (frontend)
   npm run type-check (if using TypeScript)

4. Stage changes
   git add .
   git status (verify only intended changes)

5. Commit with meaningful message
   git commit -m "feat: implement authentication system
   
   - Add signup, login, logout flows
   - Implement Google and LinkedIn OAuth
   - Add email verification
   - Add password reset
   - Add JWT token management
   - Add 80+ unit tests with 85% coverage
   - Add integration tests for auth flows"

6. Push to feature branch
   git push origin feature/phase-1-mvp

7. Create Pull Request on GitHub
   - Link to Trello/Jira ticket
   - Add description of changes
   - List testing done
   - Link to any documentation
   - Request reviews from team

8. Wait for CI/CD
   - GitHub Actions runs all tests
   - Code quality checks pass
   - Coverage maintained
   - SonarQube green
```

#### Daily Deliverables:
```
✅ Authentication API endpoints complete
✅ OAuth integration working (Google & LinkedIn)
✅ Email verification flow implemented
✅ Frontend auth pages complete
✅ 80+ unit tests
✅ 10+ integration tests
✅ 5+ E2E tests
✅ 85%+ code coverage
✅ All code reviewed
✅ Pull request created
✅ Merged to develop branch
```

---

## GITHUB COPILOT PROMPT GUIDELINES

### How to Write Effective Copilot Prompts

#### 1. Specific Context Prompts

**Bad Prompt:**
```
Create an API endpoint
```

**Good Prompt:**
```
Create a POST endpoint /api/v1/auth/login that:
- Validates email and password using Zod
- Queries Supabase users table for email match
- Compares password hash using bcryptjs.compare()
- Generates JWT token (RS256, expires 1h)
- Generates refresh token (expires 7d)
- Returns {success: true, accessToken: '...', refreshToken: '...'}
- Returns 401 on invalid credentials
- Uses try-catch with proper error messages
```

#### 2. Architecture Context Prompts

**Example:**
```
Following the ClientMapr architecture, create:
- File: services/leadService.js
- Dependency: Supabase client (@supabase/supabase-js)
- Exports: searchLeads(filters), enrichLead(leadId), scoreLead(lead)
- Error handling: CustomError class with status codes
- Database: PostgreSQL via Supabase
- Pattern: async/await with try-catch
```

#### 3. Testing Context Prompts

**Example:**
```
Create Jest unit tests for authService.login():
- Mock Supabase client
- Test successful login returns tokens
- Test invalid password returns 401
- Test non-existent user returns 401
- Test token has correct expiration
- Test refresh token stored securely
- Use: jest.mock(), beforeEach(), afterEach()
- Should have 6+ test cases with 100% coverage
```

#### 4. Code Style Prompts

**Example:**
```
Generate code following:
- Naming: camelCase for functions/variables, PascalCase for components
- Comments: JSDoc for all exported functions
- Error handling: Custom error class with status codes
- Logging: Winston logger (not console.log)
- Validation: Zod schemas for all inputs
- Database: Supabase client with parameterized queries
- No var (use const/let), no callbacks (use async/await)
```

#### 5. Integration Prompts

**Example:**
```
Create integration between:
- Frontend: utils/apiClient.js (Axios instance)
- Backend: routes/authRoutes.js
- Database: Supabase users table
- Authentication: JWT tokens in Authorization header

Flow:
1. Frontend sends POST to /api/v1/auth/login
2. Backend validates credentials against Supabase
3. Backend generates JWT token
4. Frontend stores token in localStorage
5. Subsequent requests include token in header
```

### Copilot Prompt Template

Use this template for all feature prompts:

```
Task: [Feature Name]
File: [path/to/file]
Language: [JavaScript/JSX/SQL]
Framework: [Express/React/Supabase]

Context:
- Project: ClientMapr (lead generation SaaS)
- Tech: Node.js, React, Supabase PostgreSQL
- Database: Supabase client (@supabase/supabase-js)
- Style Guides: [Link code guidelines]

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Functions to implement:
1. functionName(params) → returns X
   - Does what
   - Handles error cases
   - Validates input

Error Handling:
- Throw CustomError on validation failure
- Try-catch block wrapping
- Proper HTTP status codes

Testing:
- Should work with [specific test framework]
- Mock [external dependencies]
- Test [X test cases]

Code Standards:
- Use JSDoc comments
- async/await pattern
- No console.log (use Winston)
- ESLint compliant
```

---

## CODE GENERATION BEST PRACTICES

### Best Practices with Copilot

#### 1. Generate Then Refine

```
Step 1: Generate the basic function
- Let Copilot create the initial implementation
- Accept generated code

Step 2: Review the output
- Check logic correctness
- Verify error handling
- Look for security issues

Step 3: Refine with Copilot
- Ask: "Add better error handling"
- Ask: "Add input validation with Zod"
- Ask: "Add logging (Winston)"

Step 4: Add tests
- Ask Copilot to generate test suite
- Let it create test cases
```

#### 2. Use Copilot Chat for Explanations

```
When stuck, ask:
- "Explain how JWT token refresh works"
- "What are best practices for React hooks?"
- "How do I structure a Supabase query for performance?"
- "What's the difference between access and refresh tokens?"

Copilot Chat provides detailed explanations and can generate code examples
```

#### 3. Leverage Context Files

```
Create .github/copilot-context.md with:
- Project overview
- Tech stack
- Code style guidelines
- Naming conventions
- Database patterns
- Security requirements
- Testing standards

Copilot reads this file and generates code following these rules
```

#### 4. Progressive Feature Implementation

```
Don't generate entire feature at once.
Break it down:

Week 1 Auth:
- Day 1: Generate auth controller
- Day 2: Generate auth service
- Day 3: Generate auth middleware
- Day 4: Generate frontend auth pages
- Day 5: Generate auth tests

This breaks complexity into manageable chunks
```

### Command Patterns with Copilot

```
"Generate a [Component/Function] that..."
"Create tests for [Component/Function]"
"Write the [Database] schema for..."
"Generate an API endpoint for..."
"Create validation schema using Zod for..."
"Generate a React hook for..."
"Write middleware to..."
"Create an error handler for..."
"Generate sample test data for..."
"Refactor this code to use [pattern]"
```

---

## TESTING STRATEGY

### Test Coverage by Day

```
Day 1: No tests (setup day)

Day 2 (Auth): 
- 20+ unit tests for authService
- 10+ integration tests for /auth endpoints
- Target: 80% coverage

Day 3 (OAuth):
- 15+ unit tests for oauthService
- 5+ integration tests for OAuth callbacks
- Target: 85% coverage

Day 4 (Frontend Auth):
- 15+ component tests for auth pages
- 5+ E2E tests for auth flows
- Target: 80% coverage

Day 5 (Integration):
- 10+ end-to-end flow tests
- Complete integration test suite
- Final coverage report

Target overall: 85%+ coverage
```

### Test Command Examples

```bash
# Run all tests
npm run test

# Run specific test file
npm run test authService.test.js

# Run with coverage
npm run test:coverage

# Watch mode (during development)
npm run test:watch

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration

# Coverage threshold check
npm run test:coverage -- --threshold 85
```

---

## DAILY REVIEW & QA CHECKLIST

### Morning Review (Start of Day)

```
Checklist:
☐ Pull latest from develop branch: git pull origin develop
☐ Check for merge conflicts: git status
☐ Install new dependencies: npm install
☐ Run all tests to ensure no regressions: npm run test
☐ Review yesterday's feedback/PRs
☐ Check for any new issues/bugs reported
☐ Plan today's tasks
☐ Estimate time for each task
☐ Set up local environment (backend + frontend running)
```

### During Development

```
Every 2 hours:
☐ Run tests: npm run test
☐ Check code coverage: npm run test:coverage
☐ Run linting: npm run lint
☐ Commit work in progress: git add . && git commit -m "wip: [feature]"
☐ Check for merge conflicts with develop branch

Every 4 hours:
☐ Push to remote: git push origin feature/phase-1-mvp
☐ Run full test suite
☐ Update task status in Trello/Jira
```

### End of Day Review

```
Checklist:
☐ All code committed: git status (should be clean)
☐ All tests passing: npm run test
☐ Code coverage > 85%: npm run test:coverage
☐ Linting passes: npm run lint
☐ No TODOs left (or documented): grep -r "TODO" src/
☐ A documentation completed: Updated comments
☐ PR created if feature branch complete
☐ PR reviewed by team member
☐ Merge to develop if approved
☐ Push to develop: git push origin develop
☐ Update status in Trello/Jira

Before leaving:
☐ All uncommitted changes saved
☐ Feature branch pushed
☐ Nothing blocking next day's work
☐ Notes written for next developer
```

### Weekly Review (Friday Afternoon)

```
Checklist:
☐ Week's deliverables complete?
☐ No major bugs in code?
☐ Test coverage maintained/improved?
☐ Documentation up to date?
☐ Code reviewed and approved by team?
☐ Merged to develop/main?

If incomplete:
☐ Document blockers
☐ Plan for next week
☐ Reassign if needed
```

---

## FREE SERVICES & TOOLS SETUP

### Free Tier Services for Phase 1

#### 1. Supabase (Database)

```
Free Tier Includes:
- PostgreSQL 10GB database
- Real-time function calls
- Auth (users, sessions)
- Vector storage (pgvector)
- Edge functions
- Rate limit per endpoint

Setup:
1. Go to supabase.com
2. Sign up with GitHub
3. Create new project
4. Get project URL and keys
5. Add to .env file

.env:
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_KEY=[service_key]

Note: Service key is for backend only (never expose to frontend)
```

#### 2. GitHub (Repository & CI/CD)

```
Free Tier Includes:
- Unlimited public repos
- 2000 GitHub Actions min/month
- Unlimited collaborators
- CI/CD pipelines free

Setup:
1. Create GitHub account
2. Create repository: clientmapr
3. Enable GitHub Actions
4. Configure workflows (already provided)

CI/CD runs automatically:
- On pull request: Run tests, linting
- On merge to develop: Run full test suite
- On merge to main: Build & deploy
```

#### 3. SendGrid (Email)

```
Free Tier: 100 emails/day
- Verification emails
- Password reset emails
- Billing/Invoice emails

Setup:
1. Go to sendgrid.com
2. Sign up
3. Create API key
4. Add to .env

.env:
SENDGRID_API_KEY=[your_key]

Usage:
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({
  to: 'user@example.com',
  from: 'noreply@clientmapr.dev',
  subject: 'Email Verification',
  html: '...',
});
```

#### 4. Google OAuth

```
Free Setup:
1. Go to console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - http://localhost:5000/api/v1/auth/google/callback (dev)
   - https://yourdomain.com/api/v1/auth/google/callback (prod)
6. Get Client ID and Secret
7. Add to .env

.env:
GOOGLE_CLIENT_ID=[client_id]
GOOGLE_CLIENT_SECRET=[client_secret]
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback
```

#### 5. LinkedIn OAuth

```
Free Setup:
1. Go to linkedin.com/developers
2. Create app
3. Add authorized redirect URLs
4. Get Client ID and Secret
5. Add to .env

.env:
LINKEDIN_CLIENT_ID=[client_id]
LINKEDIN_CLIENT_SECRET=[client_secret]
LINKEDIN_REDIRECT_URI=http://localhost:5000/api/v1/auth/linkedin/callback
```

#### 6. Stripe (Payments) - Trial

```
Stripe has 90-day free trial for payments
No fees during trial period

Setup:
1. Go to stripe.com
2. Create account
3. Set up products & pricing in dashboard
4. Get API keys (Publishable & Secret)
5. Add to .env

.env:
STRIPE_SECRET_KEY=[secret_key]
STRIPE_PUBLISHABLE_KEY=[publishable_key]
STRIPE_WEBHOOK_SECRET=[webhook_secret]

Create 3 products for pricing tiers:
- Starter: $99/month
- Professional: $299/month
- Enterprise: $999/month
```

#### 7. Local Storage (Phase 1)

```
No cloud storage needed yet:
- Use local filesystem for uploads
- Directory: ./uploads/exports/

Later: Can upgrade to:
- AWS S3 (free tier: 5GB/month)
- Supabase Storage (free tier: 1GB)
```

#### 8. Monitoring & Logging (Free)

```
Option 1: Winston + Console Logging
- npm install winston
- Store logs locally
- Free

Option 2: Sentry (Free Plan)
- Signup at sentry.io
- 50,000 events/month free
- Error tracking and reporting

.env:
SENTRY_DSN=[your_dsn]
```

---

## LOCAL DEVELOPMENT ENVIRONMENT

### Complete Setup Script

```bash
#!/bin/bash
# setup-dev.sh - One command to set up everything

echo "🚀 Setting up ClientMapr development environment..."

# 1. Clone repository
echo "📦 Cloning repository..."
git clone https://github.com/your-username/clientmapr.git
cd clientmapr

# 2. Create environment files
echo "⚙️  Creating .env files..."
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Install Node dependencies
echo "📥 Installing dependencies..."
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Setup Supabase Local
echo "🗄️  Starting Supabase locally..."
npm install -g @supabase/cli
supabase start

# 5. Wait for Supabase
sleep 10

# 6. Run database migrations
echo "🔄 Running database migrations..."
cd backend
npx supabase db push
cd ..

# 7. Seed test data
echo "🌱 Seeding test data..."
cd backend
npm run seed:dev
cd ..

# 8. Start backend
echo "🔧 Starting backend on localhost:5000..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 9. Start frontend
echo "⚛️  Starting frontend on localhost:3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Setup complete!"
echo ""
echo "Services running:"
echo "  - Supabase: http://localhost:54321"
echo "  - Backend API: http://localhost:5000"
echo "  - Frontend: http://localhost:3000"
echo ""
echo "To stop everything: kill $BACKEND_PID $FRONTEND_PID"
echo "Supabase: supabase stop"
```

### Docker Compose Setup (Alternative)

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - SUPABASE_URL=http://postgres:5432
      - SUPABASE_ANON_KEY=test-key
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
    command: npm run dev

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000
    volumes:
      - ./frontend:/app
    command: npm run dev

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=clientmapr
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

---

## IMPLEMENTATION COMMAND REFERENCE

### Day 1 Commands

```bash
# Initialize project
git clone [repo]
cd clientmapr
git checkout -b feature/phase-1-mvp

# Setup backend
cd backend
npm init
npm install express dotenv cors helmet morgan winston bcryptjs jsonwebtoken

# Create folder structure
mkdir -p src/{routes,controllers,services,models,middleware,utils,jobs}

# Ask Copilot for boilerplate
# Use prompt from "GitHub Copilot Prompt Guidelines"

# Run backend
npm run dev

# Backend should be accessible at http://localhost:5000
curl http://localhost:5000/health
```

### Day 2-5 Development Commands

```bash
# Start of day
git pull origin develop
npm install
npm run test

# During development
npm run dev          # Start dev server
npm run test:watch   # Watch mode tests
npm run lint         # Check lint
npm run format       # Format code

# End of day
git add .
git commit -m "feat: description"
git push origin feature/phase-1-mvp

# Create pull request (on GitHub UI)
# Wait for CI/CD to pass
# Request code review
# Merge when approved
```

### Running Tests

```bash
# All tests
npm run test

# Specific test file
npm run test -- authService.test.js

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration

# Performance tests
npm run test:load
```

---

## PHASE 1 SUCCESS METRICS

### By End of Week 1 (Day 5):
```
✅ Auth system fully functional
✅ 80+ unit tests passing
✅ 85%+ code coverage for auth
✅ OAuth working (Google & LinkedIn)
✅ Email verification functional
✅ All code reviewed and merged
```

### By End of Week 2 (Day 10):
```
✅ 100k+ leads in database
✅ Lead search working <500ms
✅ Caching implemented
✅ 10+ integration tests
✅ Database indexed for performance
```

### By End of Phase 1 (Day 42):
```
✅ All 5 core features implemented
✅ 85%+ code coverage
✅ 80+ unit tests
✅ 15+ integration tests
✅ 10+ E2E tests
✅ All code reviewed
✅ Ready for soft launch
✅ Performance targets met
✅ Security audit passed
```

---

**This plan is ready for immediate execution. Follow it day-by-day and use Copilot for code generation!**
