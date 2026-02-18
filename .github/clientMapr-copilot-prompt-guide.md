# GitHub Copilot Context & Prompt Library
## ClientMapr Phase 1 Development

---

## PART 1: GITHUB COPILOT CONTEXT FILE

Create `.github/copilot-context.md` in your repository root:

```markdown
# ClientMapr - GitHub Copilot Context

## Project Overview
- **Project Name:** ClientMapr
- **Type:** B2B SaaS Lead Generation Platform
- **Target Users:** Freelancers, Web Developers, Small Digital Agencies
- **Phase:** Phase 1 MVP Development (42 days)
- **Tech Stack:** Node.js 20 + React 18 + Supabase PostgreSQL
- **Development Mode:** Local development with free tier services

## Architecture
- **Backend:** Express.js REST API on port 5000
- **Frontend:** React + Vite on port 3000
- **Database:** Supabase PostgreSQL (free tier)
- **Authentication:** JWT tokens + OAuth2 (Google, LinkedIn)
- **Real-time:** Supabase real-time subscriptions
- **File Storage:** Local filesystem (./uploads/)
- **Email:** SendGrid or Supabase Auth

## Code Structure
```
clientmapr/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── services/          # Business logic
│   │   ├── models/            # Database queries
│   │   ├── middleware/        # Auth, logging, errors
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Helper functions
│   │   ├── validators/        # Zod schemas
│   │   └── jobs/              # Background tasks (Bull)
│   ├── tests/                 # Jest tests
│   ├── .env.example           # Environment template
│   ├── server.js              # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # React pages
│   │   ├── components/        # Reusable components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # React Context
│   │   ├── services/          # API calls
│   │   ├── utils/             # Utilities
│   │   └── App.jsx            # Root component
│   ├── tests/                 # Component tests
│   ├── .env.example
│   └── package.json
│
└── docs/                      # Documentation
```

## File Naming Conventions

### Backend
- **Controllers:** `authController.js`, `leadController.js` (camelCase)
- **Services:** `authService.js`, `leadService.js` (camelCase)
- **Models:** `User.js`, `Lead.js` (PascalCase for export classes)
- **Middleware:** `authMiddleware.js`, `errorMiddleware.js` (camelCase)
- **Routes:** `authRoutes.js`, `leadRoutes.js` (camelCase)
- **Tests:** `auth.test.js`, `auth.integration.js` (camelCase)

### Frontend
- **Components:** `SignUp.jsx`, `Dashboard.jsx` (PascalCase)
- **Pages:** `SignUpPage.jsx`, `DashboardPage.jsx` (PascalCase)
- **Hooks:** `useAuth.js`, `useLeads.js` (camelCase, starts with 'use')
- **Context:** `AuthContext.jsx`, `LeadsContext.jsx` (PascalCase, ends with 'Context')
- **Tests:** `SignUp.test.jsx`, `Dashboard.test.jsx` (PascalCase)

## Backend Code Standards

### General
- **Language:** JavaScript ES6+
- **Pattern:** Async/await (NO callbacks)
- **Module system:** CommonJS (require/module.exports)
- **Error handling:** Try-catch blocks with custom error classes
- **Logging:** Winston logger (NO console.log)
- **Validation:** Zod v3 schemas for all inputs
- **Database:** Supabase JavaScript client (@supabase/supabase-js)
- **Environment:** dotenv for configuration

### Comments & Documentation
- **JSDoc:** Every exported function/class
- **Inline comments:** For complex logic only
- **Format:**
```javascript
/**
 * Creates a new user account
 * @param {string} email - User email address
 * @param {string} password - Plain text password
 * @returns {Promise<{id: string, email: string}>}
 * @throws {Error} If email already exists
 */
async function createUser(email, password) {
  // Implementation
}
```

### Error Handling
- Custom error class:
```javascript
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

- Always throw with status code:
```javascript
if (!user) {
  throw new AppError('User not found', 404);
}

if (user.isDeleted) {
  throw new AppError('User account is deleted', 410);
}
```

### Database (Supabase)
- Use Supabase client SDK, never raw SQL (unless migrations)
- Always use Row Level Security (RLS) for frontend queries
- Parameterize all queries
- Connection:
```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
```

- Query example:
```javascript
const { data, error } = await supabase
  .from('users')
  .select('id, email, full_name')
  .eq('email', email)
  .single();

if (error) throw new AppError(error.message, 400);
return data;
```

### Authentication
- JWT tokens:
  - Access token: 1 hour expiry, stored in Authorization header
  - Refresh token: 7 day expiry, stored in secure HTTP-only cookie
  - Signing algorithm: HS256 (HMAC SHA-256)
  - Secret: environment variable (never hardcoded)

- Middleware check:
```javascript
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Missing authorization header', 401);
  }
  return authHeader.substring(7);
}
```

### Database Schema Best Practices
- All tables have: `id` (UUID), `created_at`, `updated_at`
- Foreign keys define relationships
- Indexes on frequently searched columns
- RLS enabled for multi-tenant safety (if needed)
- Triggers for updated_at timestamp

### Response Format (All API Endpoints)
```javascript
// Success response
{
  "success": true,
  "data": {
    // Response payload
  },
  "error": null,
  "meta": {
    "timestamp": 1708251234567,
    "version": "1.0"
  }
}

// Error response
{
  "success": false,
  "data": null,
  "error": {
    "message": "Email already exists",
    "code": "EMAIL_EXISTS"
  },
  "meta": {
    "timestamp": 1708251234567
  }
}
```

### HTTP Status Codes to Use
- 200: Success (GET, PUT, PATCH)
- 201: Created (POST)
- 204: No Content (DELETE)
- 400: Bad Request (validation failed)
- 401: Unauthorized (auth required or failed)
- 403: Forbidden (no permission)
- 404: Not Found
- 409: Conflict (duplicate entry)
- 429: Too Many Requests (rate limited)
- 500: Server Error

## Frontend Code Standards

### General
- **Framework:** React 18 with Hooks
- **Component style:** Functional components only
- **Styling:** Tailwind CSS
- **HTTP client:** Axios with interceptors
- **State management:** React Context + Custom hooks
- **Data fetching:** React Query (TanStack Query) v5
- **Form handling:** React Hook Form + Zod
- **Routing:** React Router v6
- **Bundler:** Vite

### Component Standards
- Functional components only (no class components)
- Props spread in JSDoc
- Custom hooks for logic
- Named exports for components

```javascript
/**
 * User authentication sign up form
 * @param {Object} props
 * @param {function} props.onSuccess - Callback on successful signup
 * @returns {JSX.Element}
 */
function SignUpForm({ onSuccess }) {
  // Component logic
  return (
    // JSX
  );
}

export default SignUpForm;
```

### Hooks Pattern
- Logic in custom hooks
- UI in components
```javascript
// In: hooks/useAuth.js
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const login = async (email, password) => {
    // Logic
  };
  
  return { user, loading, login };
}

// In: component
function LoginPage() {
  const { login, loading } = useAuth();
  // Use hook in component
}
```

### Context Pattern (Auth)
- Global state in Context for: user, token, loading
- Wrap app at root level
- Access via `useContext(AuthContext)`

### API Calls Pattern
- Create service layer (services/authService.js)
- Service returns Promise
- Component uses React Query or custom hook
```javascript
// Service
export const authService = {
  login: (email, password) => 
    axios.post('/api/v1/auth/login', { email, password }),
  signup: (email, password, name) =>
    axios.post('/api/v1/auth/signup', { email, password, name }),
};

// Component
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { mutate: login, isLoading } = useMutation(
    () => authService.login(email, password),
    {
      onSuccess: (data) => {
        localStorage.setItem('token', data.accessToken);
        navigate('/dashboard');
      },
    }
  );
  
  return (
    // Form JSX
  );
}
```

### Styling (Tailwind)
- Mobile-first responsive design
- Use Tailwind utilities (never inline styles)
- Create custom components for reuse
- Keep component files under 300 lines

### Security Standards
- Never store passwords
- Store JWT token only (localStorage or cookie)
- Never log sensitive data
- Validate all inputs
- Use HTTPS in production
- Sanitize user inputs before display

## Database Schema Reference

### users
```sql
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
full_name VARCHAR(255)
subscription_tier ENUM('free_trial', 'starter', 'professional', 'enterprise')
oauth_provider VARCHAR(50) -- 'google', 'linkedin', or NULL
oauth_id VARCHAR(255)
email_verified BOOLEAN DEFAULT false
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### leads
```sql
id UUID PRIMARY KEY
business_name VARCHAR(255) NOT NULL
address VARCHAR(255)
city VARCHAR(100)
state VARCHAR(100)
zip_code VARCHAR(20)
phone VARCHAR(20)
website_url TEXT
has_website BOOLEAN
google_rating DECIMAL(3,2)
review_count INTEGER
business_category VARCHAR(100)
latitude DECIMAL(10,8)
longitude DECIMAL(11,8)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()

-- Indexes
CREATE INDEX idx_city ON leads(city);
CREATE INDEX idx_state ON leads(state);
CREATE INDEX idx_category ON leads(business_category);
CREATE INDEX idx_has_website ON leads(has_website);
```

### subscriptions
```sql
id UUID PRIMARY KEY
user_id UUID FOREIGN KEY REFERENCES users(id)
plan_type VARCHAR(50) -- 'starter', 'professional', 'enterprise'
stripe_subscription_id VARCHAR(255)
status VARCHAR(50) -- 'active', 'canceled', 'past_due'
monthly_price INTEGER -- in cents
billing_cycle VARCHAR(50) -- 'monthly', 'annually'
current_period_start DATE
current_period_end DATE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

## Testing Standards

### Unit Tests (Jest)
- Test individual functions in isolation
- Mock external dependencies
- Minimum 80% coverage
- File naming: `*.test.js` or `*.spec.js`

```javascript
describe('authService.login', () => {
  it('should return token on valid credentials', async () => {
    const result = await authService.login('test@example.com', 'password123');
    expect(result).toHaveProperty('accessToken');
  });
  
  it('should throw error on invalid password', async () => {
    await expect(
      authService.login('test@example.com', 'wrongpassword')
    ).rejects.toThrow('Invalid credentials');
  });
});
```

### Integration Tests
- Test API endpoints end-to-end
- Use test database (separate from dev)
- File naming: `*.integration.test.js`
- Mockonly external services (stripe, email)

### E2E Tests (Playwright)
- Test complete user flows
- Test on real browser
- Minimum 5 critical flows
- File naming: `*.e2e.spec.js`

### Coverage Targets
- Backend: 85%+
- Frontend: 80%+
- Overall: 85%+

## Environment Variables

### Backend (.env)
```
# Server
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug

# Database
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE_IN=1h
REFRESH_TOKEN_EXPIRE_IN=7d
JWT_ALGORITHM=HS256

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback

LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=http://localhost:5000/api/v1/auth/linkedin/callback

# Email
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@clientmapr.dev

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# External
GOOGLE_MAPS_API_KEY=... (Phase 2)
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=https://[project].supabase.co
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_STRIPE_PUBLISHABLE_KEY=...
```

## Git Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/[name]`: Individual feature branches
- `hotfix/[name]`: Urgent production fixes

### Commit Message Format
```
feat: add user authentication
fix: resolve token expiration issue
docs: update setup instructions
test: add auth service tests
refactor: simplify error handling
style: format code with prettier
```

### Pull Request Process
1. Create feature branch from `develop`
2. Write code and tests
3. Create PR with description
4. Code review (min 1 approval)
5. GitHub Actions passes (tests, lint)
6. Merge to `develop`
7. After approval, merge `develop` → `main`

## Performance Targets

- Backend API response time: <300ms (p95)
- Frontend page load: <2s
- Database query: <100ms
- Search query: <500ms
- Export generation: <10s (for 1000 leads)

## Security Checklist

- ✅ No hardcoded secrets (use .env)
- ✅ All inputs validated (Zod schemas)
- ✅ All passwords hashed (bcryptjs)
- ✅ CORS configured (specific origins)
- ✅ Rate limiting enabled
- ✅ HTTPS enforced (production)
- ✅ JWT tokens secure (HS256 or RS256)
- ✅ Refresh tokens in HTTP-only cookies
- ✅ OWASP top 10 addressed
- ✅ Helmet enabled (security headers)

## Common Issues & Solutions

### Issue: Supabase connection error
```
Solution: 
1. Check .env SUPABASE_URL and keys
2. Verify supabase service running: supabase status
3. Check network connectivity
```

### Issue: JWT token not working
```
Solution:
1. Verify JWT_SECRET in .env
2. Check token expiration: decode token
3. Verify authMiddleware is applied to route
```

### Issue: CORS error
```
Solution:
1. Check CORS middleware configuration
2. Verify front-end URL in allowedOrigins array
3. Check credentials flag in Axios requests
```

## Useful Commands

```bash
# Backend
npm run dev              # Start development server
npm run test             # Run all tests
npm run test:coverage    # Check coverage
npm run test:watch       # Watch mode
npm run lint             # ESLint check
npm run format           # Prettier format
npm run build            # Build for production

# Frontend
npm run dev              # Development server
npm run build            # Production build
npm run preview          # Preview build
npm run test             # Run tests
npm run test:e2e         # E2E tests
npm run lint             # ESLint check

# Database
supabase start           # Start local Supabase
supabase stop            # Stop local Supabase
supabase db push         # Apply migrations
```

## Resources & Documentation

- Supabase: https://supabase.com/docs
- React: https://react.dev
- Express: https://expressjs.com
- Zod: https://zod.dev
- React Query: https://tanstack.com/query
- Jest: https://jestjs.io
- Playwright: https://playwright.dev

---

**Last Updated:** 2024
**For Phase:** 1 MVP Development
```

---

## PART 2: COPILOT PROMPT TEMPLATES

### Template 1: Feature Implementation Prompt

```
Task: [Feature Name - e.g., "User Authentication Login"]

Context:
- Project: ClientMapr (Lead Generation SaaS)
- Phase: 1 MVP Development
- Tech Stack: Node.js + React + Supabase
- Database: PostgreSQL via Supabase
- See .github/copilot-context.md for full context

File Structure:
- Backend: /backend/src/services/authService.js
- Tests: /backend/tests/auth.test.js
- Frontend: /frontend/src/pages/LoginPage.jsx
- Tests: /frontend/tests/LoginPage.test.jsx

Requirements:
- [Specific requirement 1]
- [Specific requirement 2]
- [Specific requirement 3]

Functions to Implement:
1. functionName(params)
   - Input: [describe input]
   - Output: [describe output]
   - Error handling: [describe errors]
   - Side effects: [describe side effects]

Code Standards:
- Use async/await (no callbacks)
- Follow naming conventions in context file
- Include JSDoc comments
- Use Zod for validation
- Error handling with custom AppError class
- Logging with Winston (not console.log)

Testing:
- Generate unit tests with Jest
- Mock external dependencies
- Test happy path and error cases
- Target 80%+ coverage

Response Format:
1. Provide the complete implementation
2. Include JSDoc comments
3. Add accompanying tests
4. List any new dependencies needed
```

### Template 2: Bug Fix Prompt

```
Issue: [Describe the bug]

Symptom: [What users see]
Expected Behavior: [What should happen]
Actual Behavior: [What's happening now]

File: [path/to/problematic/file]
Line(s): [line numbers if known]

Context:
- Refer to .github/copilot-context.md for architectural patterns
- Current implementation [describe current code]
- Problem likely caused by [describe hypothesis]

Requirements:
- Fix the issue while maintaining existing behavior
- Add test case to prevent regression
- Update JSDoc if signature changes
- Don't break existing functionality

Provide:
1. Root cause analysis
2. Fixed code
3. Regression test
4. Backward compatibility notes
```

### Template 3: Code Review Prompt

```
Review Code:
[Paste code to review]

Review Criteria:
- Follows architectural patterns from context file
- Handles all error cases
- Includes proper validation with Zod
- Uses async/await correctly
- Has JSDoc comments
- Matches naming conventions
- Database queries use Supabase client correctly
- No hardcoded secrets or sensitive data
- Tests have adequate coverage

Provide feedback on:
1. Code quality and readability
2. Security concerns
3. Performance issues
4. Best practices violations
5. Specific improvement suggestions
```

### Template 4: Test Generation Prompt

```
Generate Tests for:
[Function/Component name]

File: [path/to/file]
Function: [function implementation - paste code]

Test Framework:
- Backend: Jest with supertest
- Frontend: Jest with React Testing Library
- E2E: Playwright

Test Coverage Needs:
- Happy path: [describe normal usage]
- Error cases: [list error scenarios]
- Edge cases: [list edge cases]
- Setup/teardown: [special requirements]

Dependencies to Mock:
- [External service 1]
- [External service 2]

Target Coverage: 85%+

Provide:
1. Complete test suite
2. Test data/fixtures
3. Mock setup code
4. Run command examples
```

### Template 5: Component Architecture Prompt

```
Design Component Structure for:
[Feature name]

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

Client Context:
- User is [describe user type]
- Flow is [describe action flow]
- Data needed: [list data requirements]

Component Breakdown:
- [Parent component]
  - [Child component 1]
  - [Child component 2]
    - [Subcomponent]

Data Flow:
- [Describe data source]
- [Describe state management]
- [Describe prop passing]

Consider:
- Reusability (can component be used elsewhere)
- Performance (avoid unnecessary re-renders)
- Accessibility (ARIA labels, keyboard navigation)
- Error states and loading states
- Responsiveness (mobile to desktop)

Provide:
1. Component hierarchy diagram
2. Props interface for each component
3. State management approach
4. Skeleton code for each component
5. Usage example
```

### Template 6: API Endpoint Design Prompt

```
Design API Endpoint:

Endpoint Path: POST /api/v1/[resource]/[action]

Purpose: [What does this endpoint do]

Request:
- Method: [GET/POST/PUT/PATCH/DELETE]
- Body: [JSON structure or form data]
- Headers: [Authorization, etc]
- Query params: [if any]

Response (Success):
- Status: [e.g., 200, 201]
- Body: [JSON structure]

Response (Error):
- Status: [e.g., 400, 401, 409]
- Error cases: [list possible errors]
- Messages: [what to return]

Authentication:
- Required?: Yes/No
- Token location: [Bearer header / cookie]
- Scopes: [if applicable]

Validation:
- Input validation rules
- Required fields
- Data type constraints

Database:
- Tables accessed: [list tables]
- Operations: [SELECT/INSERT/UPDATE/DELETE]

Rate Limiting:
- Limit: [e.g., 100 requests/hour]
- Key: [IP or user ID]

Provide:
1. Implementation in Express.js
2. Input validation with Zod
3. Controller and service layers
4. Database query
5. Tests for success and error cases
```

### Template 7: Database Migration Prompt

```
Generate Database Migration:

Schema Addition:
- New table: [table name]
  OR
- New column: [column name] on [table name]
  OR
- Modify existing: [changes]

Specifications:
- Columns: [list with types]
- Constraints: [primary key, foreign keys, unique, etc]
- Indexes: [what to index]
- Default values: [if any]
- RLS policies: [security policies]

Related Tables:
- [Other tables this relates to]

Data Migration:
- Existing data affected?: [Yes/No]
- How to migrate existing records?: [steps if yes]

Rollback Plan:
- How to safely rollback?

Provide:
1. Supabase SQL migration script
2. Rollback script
3. Migration metadata (name, timestamp)
4. Testing instructions
5. Documentation of changes
```

---

## PART 3: DAILY COPILOT USAGE EXAMPLES

### Day 1: Project Setup

**Prompt 1: Backend Setup**
```
Task: Create Express.js backend boilerplate

File: backend/server.js

Context: ClientMapr Phase 1, see .github/copilot-context.md

Requirements:
- Express server on port 5000
- Environment variables with dotenv
- Middleware: CORS, compression, Morgan logging, Helmet security
- Error handling middleware
- Health check endpoint GET /health
- Directory structure created (src/routes, src/services, etc)
- ESLint configuration

Provide:
1. server.js with middleware setup
2. error handling middleware
3. package.json dependencies list
4. .env.example file
5. Setup instructions
```

**Prompt 2: Frontend Setup**
```
Task: Create React + Vite frontend boilerplate

Context: ClientMapr Phase 1, see .github/copilot-context.md

Requirements:
- React 18.2 with Vite bundler
- React Router v6 for routing
- Tailwind CSS for styling
- ESLint and Prettier configuration
- Directory structure (src/pages, src/components, etc)
-Custom hooks pattern
- Protected route component
- API service layer with Axios

Deliverables:
1. Vite configuration
2. Root App.jsx with routing
3. ProtectedRoute component
4. API service template
5. Tailwind config
6. ESLint and Prettier configs
7. package.json with dependencies
```

### Day 2: Authentication

**Prompt 3: Auth Service**
```
Task: Create authentication service

File: backend/src/services/authService.js

Requirements:
1. signup(email, password, fullName)
   - Validate email format and password strength
   - Hash password with bcryptjs
   - Create user in Supabase
   - Send verification email
   
2. login(email, password)
   - Query Supabase for user by email
   - Compare password hash
   - Generate JWT tokens
   - Return tokens

3. verifyEmail(token)
   - Update user email_verified = true

4. refreshAccessToken(refreshToken)
   - Generate new access token from refresh token

Error handling: Custom AppError class
Database: Use @supabase/supabase-js client
Validation: Use Zod schemas
Logging: Use Winston logger

Provide:
1. Complete auth service implementation
2. Zod validation schemas
3. JSDoc comments
4. Error cases handled
5. Test file with 20+ tests
```

### Day 4: Frontend Auth Pages

**Prompt 4: SignUp Page**
```
Task: Create SignUp page component

File: frontend/src/pages/SignUpPage.jsx

Features:
- Full name, email, password inputs with validation
- Password strength indicator
- Form submission to /api/v1/auth/signup
- Success message and redirect to verification
- OAuth buttons (Google, LinkedIn)
- Error message display
- Loading state during submission

UI Requirements:
- Responsive design (mobile-first)
- Tailwind CSS styling
- Accessible (labels, ARIA attributes)
- Clear user feedback

State Management:
- Use React Hook Form for form state
- Use Zod for validation schema
- Use React Query for API mutation
- Use AuthContext for global state

Error Handling:
- Email already exists
- Weak password
- Network errors
- Display user-friendly messages

Provide:
1. Complete SignUpPage component
2. Zod validation schema
3. Form logic with React Hook Form
4. Styling with Tailwind
5. Error handling
6. Component tests (8+ tests)
7. Usage example in App.jsx
```

---

## PART 4: COPILOT BEST PRACTICES

### ✅ DO:

1. **Be Specific**
   - ❌ "Create an API endpoint"
   - ✅ "Create POST /api/v1/auth/login endpoint that validates email/password, queries Supabase users table, generates JWT tokens"

2. **Provide Context**
   - Include file paths
   - Link to code standards document (.github/copilot-context.md)
   - Describe what should happen

3. **Ask for Complete Solutions**
   - Include tests with implementation
   - Ask for JSDoc comments
   - Request error handling

4. **Review Generated Code**
   - Check logic correctness
   - Verify error handling
   - Look for security issues
   - Run tests before using

5. **Use Copilot Chat for Questions**
   - "How do JWT token refresh work?"
   - "What's the best way to handle async state in React?"
   - "How do I structure Supabase queries?"

### ❌ DON'T:

1. **Don't Accept Code Without Review**
   - Always review generated code
   - Run tests to verify
   - Check for security issues

2. **Don't Use Generic Prompts**
   - "Generate code" ← Too vague
   - Be specific about what you need

3. **Don't Leave TODOs**
   - Ask Copilot to complete incomplete code
   - Don't merge code with TODO comments

4. **Don't Mix Concerns in One Prompt**
   - One feature per prompt
   - Multiple requests one at a time
   - Let Copilot focus

---

**This comprehensive guide will help you and your team use GitHub Copilot effectively throughout Phase 1 development!**
