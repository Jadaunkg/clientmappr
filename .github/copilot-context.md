# GitHub Copilot Context for ClientMapr Phase 1

## Project Overview
- **Project:** ClientMapr - Lead Generation SaaS
- **Phase:** Phase 1 MVP Development (42 days)
- **Tech Stack:** Node.js + React 18 + Supabase PostgreSQL
- **Development Mode:** 100% Local with free tier services
- **Goal:** Build MVP with auth, lead search, export, dashboard, and billing

## Architecture @ a Glance
```
Frontend (React + Firebase SDK) → Backend (Express.js + Firebase Admin SDK) → Database (Supabase PostgreSQL)
        :3000                              :5000                          http://localhost:54321

AUTHENTICATION: Firebase (handles signup, login, email verification, OAuth, password reset)
DATABASE: Supabase (stores leads, subscriptions, interactions, exports, user profiles)
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

### Firebase Authentication (Phase 1 MVP)
Firebase Auth handles all authentication server-side:
- **Signup:** User creates account via Firebase with email/password
- **Social Login:** Google & LinkedIn OAuth integrated in Firebase Console
- **Email Verification:** Firebase sends verification email natively
- **Password Reset:** Firebase provides secure password reset flow
- **Session Management:** Firebase SDK manages ID tokens locally
- **Token Expiry:** 1 hour (Firebase default), auto-refresh in SDK
- **MFA:** Firebase supports but disabled in Phase 1

### Backend Integration
- Firebase Admin SDK verifies ID tokens from frontend
- Tokens sent in Authorization header: `Bearer <firebase_id_token>`
- Custom claims stored in Firebase for subscription tier, role, etc.
- Middleware: `firebaseAuthMiddleware` verifies token and attaches user claims to req.user
- Supabase RLS policies use Firebase UID as primary key

### Frontend Integration
- Firebase SDK initialized with project credentials
- User authentication state managed by Firebase SDK (no localStorage needed)
- AuthContext wraps Firebase SDK for React components
- useAuth hook provides login/signup/logout functions
- Protected routes check Firebase authentication state
- Auto-redirect to login if unauthenticated
- ProtectedRoute component wraps protected pages

## Database Tables (Supabase)

All tables use VARCHAR(255) for user IDs to store Firebase UIDs (28 character strings)

**users:** id (Firebase UID), email, full_name, phone_number, avatar_url, subscription_tier, status, email_verified, last_login, created_at, updated_at
- id: VARCHAR(255) PRIMARY KEY (Firebase UID format)
- No password_hash (Firebase manages passwords)
- No oauth_provider/oauth_id (Firebase handles OAuth)

**leads:** id, business_name, address, city, state, zip_code, phone, website_url, has_website, google_rating, review_count, business_category, latitude, longitude, created_at, updated_at

**subscriptions:** id, user_id (Firebase UID), plan_type, stripe_subscription_id, stripe_customer_id, status, monthly_price, billing_cycle, current_period_start, current_period_end, created_at, updated_at

**interactions:** id, user_id (Firebase UID), lead_id, status, notes, interaction_date, created_at, updated_at

**exports:** id, user_id (Firebase UID), format, file_name, file_path, record_count, status, error_message, created_at, updated_at

## API Endpoints (Phase 1)

```
Authentication: (Firebase handles these - backend is token verification only)
  POST   /api/v1/auth/signup-callback       (create user profile after Firebase signup)
  POST   /api/v1/auth/logout               (cleanup backend resources if needed)
  
Leads: (Protected - require Firebase auth)
  GET    /api/v1/leads (with filters & pagination)
  GET    /api/v1/leads/:id
  
Exports: (Protected - Firebase required)
  POST   /api/v1/exports (create export)
  GET    /api/v1/exports (list user exports)
  GET    /api/v1/exports/:id (download export)

Dashboard: (Protected - Firebase required)
  GET    /api/v1/dashboard/stats
  GET    /api/v1/dashboard/recent-leads
  
User: (Protected - Firebase required)
  GET    /api/v1/user/profile
  PUT    /api/v1/user/profile
  GET    /api/v1/user/subscription
  
Billing: (Protected - Firebase required)
  GET    /api/v1/billing/plans
  POST   /api/v1/billing/subscribe
  GET    /api/v1/billing/subscription
```

## Testing Standards

- **Unit Tests:** Test individual functions in isolation with Jest
- **Integration Tests:** Test API endpoints end-to-end
- **E2E Tests:** Test complete user flows with Playwright
- **Coverage Target:** 85%+ for backend, 80%+ for frontend
- **Mocking:** Mock Supabase, Stripe, SendGrid in tests

## Security Checklist

- ✅ No hardcoded secrets (use .env)
- ✅ Authentication outsourced to Firebase (SOC-2, PCI-DSS certified)
- ✅ Firebase ID tokens verified on backend
- ✅ Custom claims used for authorization (subscription tier, role)
- ✅ Firebase email verification built-in
- ✅ Firebase password reset flow built-in
- ✅ Firebase OAuth2 for Google & LinkedIn
- ✅ Input validation on all endpoints (Zod)
- ✅ CORS configured for localhost
- ✅ Rate limiting on API endpoints
- ✅ No sensitive data in logs
- ✅ SQL injection prevention (Supabase parameterized queries)
- ✅ Row-level security (RLS) policies in Supabase
- ✅ RLS policies use Firebase UID from JWT claims
- ✅ OWASP Top 10 addressed

## Environment Variables

**Backend .env:**
NODE_ENV, PORT, SUPABASE_URL, SUPABASE_SERVICE_KEY, DATABASE_URL, FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_DATABASE_URL, SENDGRID_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, UPLOAD_DIR, FILE_SIZE_LIMIT, MAX_EXPORTS_PER_MONTH, LOG_LEVEL

**Frontend .env:**
REACT_APP_API_URL, REACT_APP_FIREBASE_API_KEY, REACT_APP_FIREBASE_AUTH_DOMAIN, REACT_APP_FIREBASE_PROJECT_ID, REACT_APP_FIREBASE_STORAGE_BUCKET, REACT_APP_FIREBASE_MESSAGING_SENDER_ID, REACT_APP_FIREBASE_APP_ID, REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY, REACT_APP_STRIPE_PUBLISHABLE_KEY

## Common Patterns

**Backend Middleware (Firebase Auth):**
```javascript
/**
 * Middleware to verify Firebase ID token and attach user to request
 * Firebase handles all authentication - this just verifies the token
 */
const firebaseAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next(new AppError('No token provided', 401));
    
    const decodedToken = await verifyFirebaseToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };
    next();
  } catch (error) {
    next(new AppError('Authentication failed', 401));
  }
};
```

**Backend Service with Firebase + Supabase:**
```javascript
/**
 * Gets user profile from Supabase using Firebase UID
 * @param {string} firebaseUid - Firebase user ID (from auth token)
 * @returns {Promise<Object>} User profile data
 */
async function getUserProfile(firebaseUid) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', firebaseUid)  // Firebase UID is primary key
    .single();
  
  if (error || !data) throw new AppError('User not found', 404);
  return data;
}
```

**Frontend Hook (Firebase + React):**
```javascript
/**
 * Custom hook for Firebase authentication
 * Manages Firebase user state and authentication
 */
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setUser(firebaseUser);
        localStorage.setItem('firebaseToken', token);
      } else {
        setUser(null);
        localStorage.removeItem('firebaseToken');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  
  const logout = () => signOut(firebaseAuth);
  return { user, loading, logout };
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
