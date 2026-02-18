# ClientMapr - Complete Feature Plan & Application Development Guide

---

## TABLE OF CONTENTS
1. [Feature Architecture Overview](#feature-architecture-overview)
2. [Core Features Breakdown](#core-features-breakdown)
3. [Application Flow Diagrams](#application-flow-diagrams)
4. [User Journey Maps](#user-journey-maps)
5. [Frontend Component Structure](#frontend-component-structure)
6. [Backend API Endpoints](#backend-api-endpoints)
7. [Database Schema](#database-schema)
8. [Feature Rendering Logic](#feature-rendering-logic)
9. [Data Flow Architecture](#data-flow-architecture)
10. [Module-by-Module Breakdown](#module-by-module-breakdown)

---

## FEATURE ARCHITECTURE OVERVIEW

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATION LAYER                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │   Web Dashboard  │  │   Mobile App     │  │  Desktop Client │ │
│  │   (React SPA)    │  │   (React Native) │  │  (Electron)     │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘ │
│           │                     │                      │           │
└─────────────┼─────────────────────┼──────────────────────┼─────────
              │                     │                      │
              └─────────┬───────────┴──────────┬───────────┘
                        │                      │
          ┌─────────────▼──────────┐  ┌────────▼────────────┐
          │   API Gateway / Auth   │  │  Rate Limiting      │
          │   (JWT + OAuth)        │  │  (Stripe for Pay)  │
          └─────────────┬──────────┘  └────────┬────────────┘
                        │                      │
        ┌───────────────▼──────────────────────▼───────────────┐
        │         BUSINESS LOGIC LAYER (Node.js)               │
        │  ┌─────────────────────────────────────────────────┐ │
        │  │  • Lead Management Service                      │ │
        │  │  • Search & Filter Service                      │ │
        │  │  • CRM Integration Service                      │ │
        │  │  • Export Service (CSV, JSON, Zapier)           │ │
        │  │  • Analytics Service                            │ │
        │  │  • Subscription Service                         │ │
        │  │  • User Management Service                      │ │
        │  └─────────────────────────────────────────────────┘ │
        └────────────────┬──────────────────────────────────────┘
                         │
        ┌────────────────▼──────────────────────────────────────┐
        │         DATA ACCESS LAYER (Database)                   │
        │  ┌──────────────────────────────────────────────────┐ │
        │  │  PostgreSQL (Relational Data)                    │ │
        │  │  Redis (Caching & Sessions)                      │ │
        │  │  Elasticsearch (Lead Indexing & Search)          │ │
        │  │  S3 (File Storage - Exports, Reports)            │ │
        │  └──────────────────────────────────────────────────┘ │
        └───────────────┬────────────────────────────────────────┘
                        │
        ┌───────────────▼──────────────────────────────────────┐
        │         EXTERNAL INTEGRATIONS                         │
        │  ┌──────────────────────────────────────────────────┐ │
        │  │  Google Maps API (Lead Discovery)                │ │
        │  │  Stripe API (Payments)                           │ │
        │  │  HubSpot / Salesforce / Pipedrive                │ │
        │  │  Zapier / Make.com (Automation)                  │ │
        │  │  SendGrid (Email)                                │ │
        │  │  Sentry (Error Tracking)                         │ │
        │  └──────────────────────────────────────────────────┘ │
        └────────────────────────────────────────────────────────┘
```

---

## CORE FEATURES BREAKDOWN

### Feature Priority Matrix

#### **TIER 1: MVP CRITICAL (Must Have - Week 1-8)**
1. User Authentication & Authorization
2. Lead Database & Discovery Engine
3. Search & Advanced Filtering
4. Lead Export (CSV/Excel)
5. User Dashboard
6. Subscription Management & Billing

#### **TIER 2: GROWTH (Should Have - Week 9-16)**
7. CRM Integrations
8. Lead Enrichment
9. Analytics Dashboard
10. Team Management
11. Zapier/Automation Integration

#### **TIER 3: PREMIUM (Nice to Have - Week 17-26)**
12. AI-Powered Recommendations
13. API Access
14. White-Label Portal
15. Competitor Tracking
16. Mobile App

---

## DETAILED FEATURE SPECIFICATIONS

### FEATURE 1: User Authentication & Authorization

**Purpose:** Secure user login, registration, and permission management

**Sub-features:**
- Email/Password signup
- Google OAuth integration
- LinkedIn OAuth integration
- Email verification
- Password reset
- Two-factor authentication (Phase 2)
- Role-based access control (Free/Starter/Professional/Enterprise)

**Flow:**
```
User Landing Page
    ↓
[Sign Up] or [Log In]
    ↓
    ├─→ [Sign Up] → Email + Password → Email Verification → Dashboard
    ├─→ [Google/LinkedIn] → OAuth Confirmation → Profile Setup → Dashboard
    └─→ [Log In] → Email + Password → [2FA Optional] → Dashboard
```

**Data Points:**
- User ID, Email, Full Name, Company
- Auth Provider (email/google/linkedin)
- Subscription Tier, Team Seats
- Last Login, Created Date
- Preferences (timezone, language, notifications)

**API Endpoints:**
```
POST   /auth/signup                    → Register new user
POST   /auth/login                     → Login with credentials
POST   /auth/google-callback           → Google OAuth response
POST   /auth/linkedin-callback         → LinkedIn OAuth response
POST   /auth/verify-email              → Verify email token
POST   /auth/refresh-token             → Refresh JWT token
POST   /auth/logout                    → Logout user
POST   /auth/forgot-password           → Send reset link
POST   /auth/reset-password            → Reset password with token
```

---

### FEATURE 2: Lead Discovery Engine (Google Maps Integration)

**Purpose:** Find local businesses without websites using Google Maps API

**Sub-features:**
- Real-time Google Maps scraping
- Business data collection (name, location, phone, website)
- Website detection (has website / no website / poor online presence)
- Data quality scoring
- Lead freshness tracking

**Data Collection Points:**
```
Google Maps API → Raw Data
    ├─ Business Name
    ├─ Address (Street, City, State, ZIP)
    ├─ Phone Number
    ├─ Website URL (if exists)
    ├─ Google Rating (1-5 stars)
    ├─ Review Count
    ├─ Business Hours
    ├─ Business Category/Type
    ├─ Employee Count Estimate
    ├─ Google Maps URL
    └─ Last Updated (from Google)

Processing Pipeline:
    ↓
Website Analysis
    ├─ URL exists? Yes/No
    ├─ Website quality score (poor/moderate/good)
    ├─ Last updated date (if website exists)
    ├─ Mobile-friendly? Yes/No
    └─ Indexed in Google? Yes/No

    ↓
Lead Quality Score
    ├─ High (No website + 100+ reviews)
    ├─ Medium (No website or poor website + 50+ reviews)
    └─ Low (New business or low engagement)

    ↓
Database Storage
    └─ PostgreSQL + Elasticsearch (for fast search)
```

**API Endpoints:**
```
GET    /api/leads/search                → Search for leads with filters
GET    /api/leads/:id                   → Get specific lead details
GET    /api/leads/export                → Export leads (CSV/Excel/JSON)
POST   /api/leads/bulk-import           → Import leads to CRM
DELETE /api/leads/:id                   → Remove lead from saved list
POST   /api/leads/status-update         → Update lead status (contacted/qualified/closed)
```

---

### FEATURE 3: Search & Advanced Filtering

**Purpose:** Allow users to find exactly the leads they need

**Filter Hierarchy:**

```
LEVEL 1: BASIC FILTERS (Starter Tier)
├─ Location (City, State, Radius in miles)
├─ Business Category (Select from dropdown)
├─ Website Status
│  ├─ No Website
│  ├─ Has Website (but poor quality)
│  └─ Has Good Website
└─ Review Count (Min-Max range)

LEVEL 2: ADVANCED FILTERS (Professional Tier)
├─ All of LEVEL 1 plus:
├─ Revenue Range (estimated)
├─ Employee Count (1-10, 11-50, 51-200, 200+)
├─ Business Age (New: <1yr, Established: 1-5yrs, Mature: 5+yrs)
├─ Google Rating (Min-Max: 1.0-5.0)
├─ Phone Availability (Yes/No)
├─ Operating Hours Type (24/7, Business Hours, etc.)
├─ Social Media Presence
│  ├─ Facebook Page
│  ├─ Instagram Page
│  ├─ LinkedIn Page
│  └─ None of Above
└─ Custom Tags (User-defined categories)

LEVEL 3: ENTERPRISE FILTERS (Enterprise Tier)
├─ All of LEVEL 2 plus:
├─ Competitor Analysis (Show businesses targeting specific competitor keywords)
├─ Location Type (Home-based, Physical Store, Both)
├─ Industry Subcategories (Auto-complete dropdown with 500+ options)
├─ Decision-Maker Information Available (Yes/No)
├─ Lead Quality Score Range (1-100)
├─ Last Contact Date (Never contacted, 30+ days ago, etc.)
├─ Conversion Likelihood (ML-based scoring)
└─ Custom Segment Builder (AND/OR logic combinations)
```

**Search UI Layout:**

```
┌─────────────────────────────────────────────────┐
│  SEARCH BAR: "Find leads near you"              │
├─────────────────────────────────────────────────┤
│  FILTER SIDEBAR (Collapsible)                   │
│  ┌───────────────────────────────────────────┐  │
│  │ 📍 LOCATION                               │  │
│  │  City: [Austin, TX ▼]                     │  │
│  │  Radius: [10 miles ▼]                     │  │
│  ├───────────────────────────────────────────┤  │
│  │ 🏢 BUSINESS CATEGORY                      │  │
│  │  ☑ Plumber      ☑ HVAC      ☑ Electrician│  │
│  │  ☑ Salon        ☑ Restaurant ☑ Dentist  │  │
│  ├───────────────────────────────────────────┤  │
│  │ 🌐 WEBSITE STATUS                         │  │
│  │  ○ No Website        ○ Has Website        │  │
│  │  ○ Poor Quality      ○ Any Status         │  │
│  ├───────────────────────────────────────────┤  │
│  │ ⭐ GOOGLE RATING                          │  │
│  │  Min: [1.0] ──●──── Max: [5.0]           │  │
│  ├───────────────────────────────────────────┤  │
│  │ 📊 REVIEW COUNT                           │  │
│  │  Min: [0] ──●────── Max: [500+]          │  │
│  ├───────────────────────────────────────────┤  │
│  │ [🔍 Apply Filters] [✕ Reset Filters]     │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  RESULTS AREA                                    │
│  ┌───────────────────────────────────────────┐  │
│  │ Showing 247 leads                         │  │
│  │ [Download CSV] [Add to CRM] [Save Search] │  │
│  ├───────────────────────────────────────────┤  │
│  │ Lead #1                                   │  │
│  │ ├─ ABC Plumbing Co.                       │  │
│  │ ├─ Austin, TX 78701                       │  │
│  │ ├─ (512) 555-1234                         │  │
│  │ ├─ No Website ✗                           │  │
│  │ ├─ Rating: ⭐⭐⭐⭐ (4.5) | 125 reviews     │  │
│  │ └─ Status: [Not Contacted ▼]              │  │
│  ├───────────────────────────────────────────┤  │
│  │ Lead #2                                   │  │
│  │ ├─ XYZ HVAC Services                      │  │
│  │ ├─ [...more leads...]                     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**API Endpoints:**
```
POST   /api/filters/save                  → Save search filter
GET    /api/filters/my-filters            → Get user's saved filters
DELETE /api/filters/:filterId             → Delete saved filter
PUT    /api/filters/:filterId             → Update saved filter
POST   /api/filters/apply                 → Apply filter and get results
```

---

### FEATURE 4: Lead Export & Multiple Formats

**Purpose:** Export leads in multiple formats for use in different tools

**Export Formats Supported:**

```
STARTER TIER:
├─ CSV (Excel-compatible)
└─ Excel (.xlsx with multiple sheets)

PROFESSIONAL TIER:
├─ CSV
├─ Excel (.xlsx)
├─ JSON (Developer-friendly)
└─ Direct Zapier Integration

ENTERPRISE TIER:
├─ All above
├─ Direct API Access
├─ CRM Direct Sync (SFDC, HubSpot, Pipedrive)
├─ Scheduled Exports (Recurring)
└─ Custom Format (XML, Custom CSV structure)
```

**Export UI Flow:**

```
User views search results
    ↓
[Export Leads] button clicked
    ↓
┌─────────────────────────────────────┐
│ EXPORT OPTIONS MODAL                │
├─────────────────────────────────────┤
│ Format:                              │
│  ○ CSV                               │
│  ○ Excel                             │
│  ○ JSON (Pro+)                       │
│  ○ Direct CRM Sync (Pro+)           │
├─────────────────────────────────────┤
│ Fields to Include:                   │
│  ☑ Business Name  ☑ Address          │
│  ☑ Phone          ☑ Website          │
│  ☑ Rating         ☑ Reviews          │
│  ☑ Category       ☑ Email*           │
│  ☑ Decision-Maker* ☑ LinkedIn*       │
│  (* Premium fields)                  │
├─────────────────────────────────────┤
│ Leads Usage:                         │
│ You used: 42/500 this month          │
│ Exporting: 73 leads                  │
│ Remaining: 385 leads                 │
├─────────────────────────────────────┤
│ [Export Now] [Schedule Recurring]    │
└─────────────────────────────────────┘
    ↓
File/Integration Generated
    ↓
Success notification + Download link
```

**CSV Export Structure (Sample):**
```
Business Name,Address,City,State,ZIP,Phone,Website,Google Rating,Review Count,Category,Last Updated,Lead Quality,Decision Maker Email
ABC Plumbing,123 Main St,Austin,TX,78701,(512)555-1234,,4.5,125,Plumbing,2026-02-18,High,john@abcplumbing.com
XYZ HVAC,456 Oak Ave,Austin,TX,78702,(512)555-5678,xyz-hvac.com,4.2,89,HVAC,2026-02-17,Medium,
...
```

**API Endpoints:**
```
POST   /api/export/csv                   → Generate CSV export
POST   /api/export/excel                 → Generate Excel export
POST   /api/export/json                  → Generate JSON export
POST   /api/export/zapier                → Send to Zapier
POST   /api/export/schedule              → Schedule recurring export
GET    /api/export/status/:exportId      → Check export status
GET    /api/export/download/:exportId    → Download export file
```

---

### FEATURE 5: User Dashboard & Settings

**Purpose:** Central hub for user to manage account, leads, and settings

**Dashboard Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: ClientMapr | Welcome, John! | Account ▼ | Logout    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SIDEBAR                        MAIN CONTENT                │
│  ┌────────────────────┐  ┌──────────────────────────────┐  │
│  │ 📊 Dashboard       │  │  DASHBOARD OVERVIEW          │  │
│  │ 🔍 Lead Search     │  │  ┌──────────────────────────┐ │  │
│  │ 📋 My Searches     │  │  │ Plan: Professional       │ │  │
│  │ 📤 Exports         │  │  │ Status: Active           │ │  │
│  │ 📊 Analytics       │  │  │ Renewal: Mar 18, 2026    │ │  │
│  │ 🔌 Integrations    │  │  │ Next Charge: $299        │ │  │
│  │ 👥 Team Members    │  │  └──────────────────────────┘ │  │
│  │ ⚙️ Account Settings │  │                               │  │
│  │ 💳 Billing         │  │  USAGE THIS MONTH             │  │
│  │ 📞 Support         │  │  ┌──────────────────────────┐ │  │
│  └────────────────────┘  │  │ Leads Used: 247 / 500     │ │  │
│                          │  │ ████████░░ 49% Used      │ │  │
│                          │  │ Exports: 5 / Unlimited    │ │  │
│                          │  │ Team Seats: 1 / 1         │ │  │
│                          │  └──────────────────────────┘ │  │
│                          │                               │  │
│                          │  RECENT SEARCHES              │  │
│                          │  - Plumbers in Austin (247)   │  │
│                          │  - Salons in Dallas (89)      │  │
│                          │  - HVAC in San Antonio (156)  │  │
│                          │                               │  │
│                          │  RECENT EXPORTS               │  │
│                          │  - austin_plumbers.csv (2hrs) │  │
│                          │  - leads_feb_2026.xlsx (1day) │  │
│                          │                               │  │
│                          │  [+ Create New Search]        │  │
│                          └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Sub-pages:**

**1. Lead Search Page:**
- Main search interface (covered in Feature 3)
- Saved search shortcuts
- Recent searches

**2. My Searches Page:**
```
┌─────────────────────────────────────────────┐
│ SAVED SEARCHES                              │
├─────────────────────────────────────────────┤
│ Search Name          Results  Last Used  Actions
│────────────────────────────────────────────
│ Plumbers in Austin    247    Today      [Edit] [Delete] [Export]
│ Salons in Dallas      89     2 days ago [Edit] [Delete] [Export]
│ HVAC Services TX      156    5 days ago [Edit] [Delete] [Export]
└─────────────────────────────────────────────┘
```

**3. Export History Page:**
```
┌─────────────────────────────────────────────────────────┐
│ EXPORT HISTORY                                          │
├─────────────────────────────────────────────────────────┤
│ Date        Search          Format  Size    Status      
│─────────────────────────────────────────────────────
│ Today 2pm   Plumbers Austin CSV     1.2MB   ✓ Complete [Download]
│ Yesterday   Salons Dallas   Excel   450KB   ✓ Complete [Download]
│ 5 days ago  HVAC TX         CSV     2.3MB   ✓ Complete [Download]
└─────────────────────────────────────────────────────────┘
```

**4. Analytics Page:**
```
┌──────────────────────────────────────────────┐
│ MONTHLY ANALYTICS                            │
├──────────────────────────────────────────────┤
│ Top Industries Searched:                     │
│  1. Plumbing (45%)                           │
│  2. HVAC (25%)                               │
│  3. Cleaning Services (15%)                  │
│  4. Salons (10%)                             │
│  5. Other (5%)                               │
├──────────────────────────────────────────────┤
│ Top Geographic Markets:                      │
│  1. Austin, TX (180 leads)                   │
│  2. Dallas, TX (156 leads)                   │
│  3. Houston, TX (120 leads)                  │
├──────────────────────────────────────────────┤
│ Export Trends:                               │
│ [Chart showing exports over time]            │
│ Average: 5 exports/month                     │
│ Peak: Last week (8 exports)                 │
└──────────────────────────────────────────────┘
```

**5. Account Settings Page:**
```
┌──────────────────────────────────────────────┐
│ ACCOUNT SETTINGS                             │
├──────────────────────────────────────────────┤
│ PROFILE                                      │
│ Name: [John Smith___________]                │
│ Email: john@email.com                        │
│ Company: [ABC Agency_______]                 │
│ Website: [www.abcagency.com]                 │
│                                              │
│ PREFERENCES                                  │
│ Timezone: [America/Chicago ▼]               │
│ Email Notifications: ☑ Enabled               │
│  ☑ Weekly reports                            │
│  ☑ Export alerts                             │
│  ☑ Product updates                           │
│                                              │
│ [Save Changes] [Cancel]                      │
└──────────────────────────────────────────────┘
```

---

### FEATURE 6: Subscription & Billing

**Purpose:** Manage subscription plans and payments

**Subscription Management UI:**

```
┌─────────────────────────────────────────────────┐
│ CURRENT PLAN: Professional                      │
├─────────────────────────────────────────────────┤
│ Price: $299/month                               │
│ Billing Cycle: Monthly (renew Mar 18, 2026)     │
│                                                  │
│ Next Charge Card: •••• •••• •••• 4242           │
│ Amount: $299.00                                 │
│                                                  │
│ [Upgrade to Enterprise] [Downgrade] [Cancel]    │
├─────────────────────────────────────────────────┤
│ PLAN COMPARISON                                 │
│ ┌─────────────┬──────────────┬──────────────┐   │
│ │ STARTER     │ PROFESSIONAL │ ENTERPRISE   │   │
│ │ (Current)   │ (Upgrade)    │ (Premium)    │   │
│ │ $99/mo      │ $299/mo      │ $999/mo      │   │
│ │ 50 leads    │ 500 leads    │ 2000+ leads  │   │
│ │ [...more]   │ [...more]    │ [...more]    │   │
│ │             │ [Upgrade ↑]  │ [Upgrade ↑]  │   │
│ └─────────────┴──────────────┴──────────────┘   │
└─────────────────────────────────────────────────┘

INVOICES & PAYMENT HISTORY:
┌─────────────────────────────────────────────────┐
│ Date        Amount  Status   Invoice             │
├─────────────────────────────────────────────────┤
│ Feb 18      $299    Paid     [View]              │
│ Jan 18      $299    Paid     [View]              │
│ Dec 18      $99     Paid     [View]              │
│ [Load more...]                                  │
└─────────────────────────────────────────────────┘
```

**Billing Flow:**

```
User clicks [Upgrade to Enterprise]
    ↓
┌────────────────────────────────────────┐
│ UPGRADE TO ENTERPRISE                  │
│ Current Plan: Professional ($299/mo)   │
│ New Plan: Enterprise ($999/mo)         │
│ Difference: +$700 pro-rated            │
│ Effective Date: Today (Feb 18)          │
│ Next Renewal: Mar 18, 2026              │
├────────────────────────────────────────┤
│ Payment Method:                        │
│ Visa ending in 4242                    │
│ Exp: 12/28                             │
│ [Change Payment Method]                │
├────────────────────────────────────────┤
│ [ ✓ I agree to ToS] [Proceed] [Cancel] │
│                                        │
│ 30-day money-back guarantee            │
└────────────────────────────────────────┘
    ↓
Payment processed via Stripe
    ↓
Success notification
    ↓
New features unlocked in dashboard
```

**API Endpoints:**
```
GET    /api/subscription/current         → Get current subscription
POST   /api/subscription/upgrade         → Upgrade plan
POST   /api/subscription/downgrade       → Downgrade plan
POST   /api/subscription/cancel          → Cancel subscription
GET    /api/invoices                     → Get invoice history
POST   /api/payment-method/update        → Update payment method
GET    /api/usage                        → Get current usage
```

---

### FEATURE 7: CRM Integration (Phase 2)

**Purpose:** Sync leads directly to CRM platforms

**Supported CRMs:**
- HubSpot
- Salesforce
- Pipedrive
- ActiveCampaign
- Zoho

**Integration Setup Flow:**

```
User navigates to Integrations Page
    ↓
[Connect HubSpot] button
    ↓
Redirects to HubSpot OAuth
    ↓
HubSpot shows permission approval
    (Read/Write contacts, deals, etc.)
    ↓
User approves → Redirects back to ClientMapr
    ↓
Auth token stored securely in database
    ↓
Success notification: "HubSpot connected!"
    ↓
Now user can:
├─ Sync leads directly from search results
├─ Map fields (ClientMapr field → CRM field)
├─ Set automatic sync on export
└─ View sync history & status
```

**Field Mapping UI:**

```
┌─────────────────────────────────────────────┐
│ HUBSPOT FIELD MAPPING                       │
├─────────────────────────────────────────────┤
│ ClientMapr Field      → HubSpot Field        │
│ ─────────────────────────────────────────   │
│ Business Name         → Company Name        │
│ Address               → Street Address      │
│ Phone                 → Phone Number        │
│ Website               → Website URL         │
│ Contact Person        → Contact Name        │
│ Email                 → Email               │
│ Google Rating         → Custom Field: Rating│
│ Review Count          → Custom Field: Reviews│
│                                             │
│ [Auto-Map] [Reset] [Save Mapping]           │
└─────────────────────────────────────────────┘

Sync Leads:
┌─────────────────────────────────────────────┐
│ [Sync Selected Leads to HubSpot]             │
│ Syncing: 45 leads...                        │
│ ███████░░░░ 70% (31/45)                     │
│                                             │
│ Successfully synced: 31                     │
│ Errors: 0                                   │
│ Pending: 14                                 │
└─────────────────────────────────────────────┘
```

**API Endpoints:**
```
POST   /api/crm/connect/:provider         → Initiate OAuth flow
GET    /api/crm/callback/:provider        → OAuth callback
POST   /api/crm/sync-leads                → Sync leads to CRM
GET    /api/crm/field-mapping/:provider   → Get field mapping
PUT    /api/crm/field-mapping/:provider   → Update field mapping
DELETE /api/crm/disconnect/:provider      → Disconnect CRM
GET    /api/crm/sync-history              → Get sync history
```

---

### FEATURE 8: Lead Enrichment (Decision-Maker Data)

**Purpose:** Get contact info and decision-maker details for leads

**Data Points Enriched:**
- Decision-maker name and title
- Decision-maker email
- Decision-maker phone
- Decision-maker LinkedIn profile
- Business email address
- Business phone directory
- Additional contacts at business

**Enrichment Process:**

```
Lead Found
    ↓
Basic info from Google Maps:
├─ Business Name
├─ Address
├─ Google Reviews
└─ Website (if exists)

    ↓
[User selects "Enrich Lead" - Pro+ feature]
    ↓
ClientMapr calls third-party data providers:
├─ RocketReach (Decision-maker data)
├─ Hunter.io (Email finder)
├─ Clearbit (Company data)
└─ LinkedIn (Profile data)

    ↓
Data compiled and merged
    ↓
Stored in database with freshness timestamp
    ↓
Displayed in lead details
```

**Enriched Lead Display:**

```
┌──────────────────────────────────────────────┐
│ LEAD DETAILS - ABC PLUMBING CO.              │
├──────────────────────────────────────────────┤
│ BASIC INFO                                   │
│ Name: ABC Plumbing Co.                       │
│ Address: 123 Main St, Austin, TX 78701       │
│ Phone: (512) 555-1234                        │
│ Website: abc-plumbing.com                    │
│ Google Rating: ⭐⭐⭐⭐ (4.5) • 125 reviews     │
│                                              │
│ DECISION-MAKERS (Pro+)                       │
│ ┌──────────────────────────────────────────┐ │
│ │ John Smith                                │ │
│ │ Title: Owner                              │ │
│ │ Email: john@abc-plumbing.com              │ │
│ │ Phone: (512) 555-1235                     │ │
│ │ LinkedIn: linkedin.com/in/johnsmith       │ │
│ │ [Email] [Call] [LinkedIn]                 │ │
│ ├──────────────────────────────────────────┤ │
│ │ Sarah Johnson                             │ │
│ │ Title: Manager                            │ │
│ │ Email: sarah@abc-plumbing.com             │ │
│ │ Phone: (512) 555-1236                     │ │
│ │ [Email] [Call] [LinkedIn]                 │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ACTIONS                                      │
│ [Email] [Call] [LinkedIn] [Export] [Add Note]│
│                                              │
│ STATUS: Not Contacted ▼                     │
│ [Save to CRM] [Enrich More] [Add to List]   │
└──────────────────────────────────────────────┘
```

---

### FEATURE 9: Analytics Dashboard (Phase 2)

**Purpose:** Track performance and insights

**Analytics Views:**

```
┌─────────────────────────────────────────────────────┐
│ ANALYTICS DASHBOARD                                 │
├─────────────────────────────────────────────────────┤
│ Period: [Feb 2026 ▼] | [Last 30 days ▼]             │
│                                                      │
│ KEY METRICS                                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Leads Searched: 892                             │ │
│ │ Leads Exported: 247                             │ │
│ │ Exports Created: 8                              │ │
│ │ Avg Leads/Search: 112                           │ │
│ │ Most Used Filter: Location (98%)                │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ SEARCH TRENDS (Chart)                               │
│ [Line chart showing searches over time]             │
│ Peak: Feb 16 (45 searches)                          │
│                                                      │
│ TOP INDUSTRIES                                      │
│ 1. Plumbing (35%)    ████████░░                     │
│ 2. HVAC (25%)        ██████░░░░                     │
│ 3. Salons (15%)      ████░░░░░░                     │
│ 4. Cleaning (15%)    ████░░░░░░                     │
│ 5. Other (10%)       ███░░░░░░░                     │
│                                                      │
│ TOP LOCATIONS                                       │
│ 1. Austin, TX (280 leads)                           │
│ 2. Dallas, TX (210 leads)                           │
│ 3. Houston, TX (180 leads)                          │
│ 4. San Antonio, TX (130 leads)                      │
│ 5. Other (92 leads)                                 │
│                                                      │
│ LEAD QUALITY BREAKDOWN                              │
│ High Quality (No Website, 100+ reviews): 45%        │
│ Medium Quality: 35%                                  │
│ Low Quality: 20%                                     │
│                                                      │
│ MONTHLY ROI ESTIMATE                                │
│ (Based on typical conversion rate)                  │
│ Leads Exported: 247                                 │
│ Est. Conversion Rate: 5%                            │
│ Est. Won Deals: 12                                  │
│ Avg Deal Value: $2,500 (typical)                    │
│ Est. Revenue Generated: $30,000                     │
│ Plan Cost: $299                                     │
│ ROI: 10,034% ⭐                                     │
└─────────────────────────────────────────────────────┘
```

---

## APPLICATION FLOW DIAGRAMS

### Overall User Journey

```
┌──────────────┐
│ Landing Page │
└──────┬───────┘
       ├─────────────────────┬──────────────────────┐
       │                     │                      │
       ▼                     ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌─────────────┐
│ New User     │      │ Existing     │      │ Free Trial  │
│ (Sign Up)    │      │ User        │      │ User        │
└──────┬───────┘      │ (Log In)    │      └──────┬──────┘
       │              └──────┬───────┘             │
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                       ┌─────▼──────┐
                       │ Dashboard  │
                       └─────┬──────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
          ┌────────┐  ┌──────────┐  ┌──────────────┐
          │ Search │  │View My   │  │Account/      │
          │ Leads  │  │Searches  │  │Settings      │
          └────┬───┘  └──────────┘  └──────────────┘
               │
        ┌──────┴────────┐
        │               │
        ▼               ▼
   ┌─────────┐    ┌────────────┐
   │ View    │    │ Save Search│
   │Results  │    └────────────┘
   └─────┬───┘
         │
    ┌────┴────────────────┬──────────────┐
    │                     │              │
    ▼                     ▼              ▼
┌────────────┐    ┌────────────┐   ┌────────────┐
│Export      │    │ Add        │   │ Enrich     │
│Leads       │    │ to CRM     │   │ Lead Data  │
└────┬───────┘    └────────────┘   └────────────┘
     │
     └─────────────────────────────────────┐
                                  Success  │
                                           ▼
                                    ┌────────────┐
                                    │Download/   │
                                    │Sync File   │
                                    └────────────┘
```

---

### Lead Search & Filter Flow

```
START: User clicks "Lead Search"
       │
       ▼
┌─────────────────────────────────┐
│ Lead Search Page Loads           │
├─────────────────────────────────┤
│ • Empty search (all leads shown) │
│ • Or populate with saved search  │
└─────────────────────┬───────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
        ▼                            ▼
  ┌─────────────┐         ┌──────────────────┐
  │ User enters │         │ User selects     │
  │ location    │         │ from suggestions │
  └─────┬───────┘         └────────┬─────────┘
        │                          │
        └──────────────┬───────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │ Apply Basic Filters:    │
         │ • Location/Radius       │
         │ • Business Category     │
         │ • Website Status        │
         │ • Rating Range          │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ Advanced Filters?       │
         └──────┬──────────┬───────┘
                │          │
            YES │          │ NO
                │          │
                ▼          │
         ┌──────────────┐  │
         │ Apply more   │  │
         │ advanced     │  │
         │ filters      │  │
         └──────┬───────┘  │
                │          │
                └─────┬────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │ [Apply Filters Button]  │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ Backend processes:      │
         │ 1. Query Elasticsearch  │
         │ 2. Filter criteria      │
         │ 3. Score leads (quality)│
         │ 4. Sort results         │
         │ 5. Paginate (20/page)   │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │ Display Results:        │
         │ • Lead cards (paginated)│
         │ • Filters shown on left │
         │ • Sort options (rating) │
         │ • Export button         │
         └──────────┬──────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
       YES          │          NO
        │           ▼           │
        │      Save Search?     │
        │           │           │
        │     [Yes] │ [No]      │
        │           │           │
        │     Save to DB        │
        │           │           │
        └───┬───────┴─────┬─────┘
            │             │
            ▼             ▼
      Continue            END
```

---

### Export & CRM Sync Flow

```
User clicks [Export Leads]
       │
       ▼
┌─────────────────────────────────────────────┐
│ EXPORT OPTIONS MODAL                        │
├─────────────────────────────────────────────┤
│ Select Format: CSV / Excel / JSON / CRM     │
│ Check lead usage limits                     │
│ Select fields to include                    │
└──────────────┬───────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
 ┌─────────┐      ┌──────────────────┐
 │CSV/Excel│      │CRM Direct Sync   │
 │Export   │      │(Pro+ feature)    │
 └────┬────┘      └────────┬─────────┘
      │                    │
      ▼                    ▼
Generate file         ┌────────────────┐
┌──────────────────┐  │CRM Connected?  │
│1. Fetch leads    │  └─┬──────────┬───┘
│2. Format data    │    │NO        │YES
│3. Create file    │    │          │
│4. Save to S3     │    ▼          ▼
│5. Generate link  │ [Connect CRM] Auth
└────┬─────────────┘    │         Token
     │                  │          │
     └──────────┬───────┴────┬─────┘
                │            │
                ▼            ▼
           ┌────────────────────────────┐
           │ Process Each Lead:         │
           │ 1. Map fields to CRM       │
           │ 2. Check duplicates        │
           │ 3. Create/Update in CRM    │
           │ 4. Log sync result         │
           │ 5. Track success/failure   │
           └────────┬───────────────────┘
                    │
                    ▼
           ┌────────────────────┐
           │ Sync Complete:     │
           │ ✓ 45/47 successful │
           │ ✗ 2 failed         │
           └────────┬───────────┘
                    │
                    ▼
           ┌────────────────────┐
           │ Send Notification  │
           │ + Show Report      │
           └────────────────────┘
```

---

## USER JOURNEY MAPS

### Journey 1: New User Free Trial

```
AWARENESS               SIGNUP                    EXPLORATION
     │                    │                            │
     ▼                    ▼                            ▼
  Lands on          Fills signup form         Email verification
  landing page      (name, email, password)   
     │                    │                            │
     │                    │                       Confirms email
     │                    │                            │
     │                    ├────────────────────────────┤
     │                    │                            │
     │                    ▼                            ▼
     │              Account created         Redirected to dashboard
     │                                       (7-day free trial)
     │                                             │
     │                                             ▼
     │                                       Onboarding tour starts
     │                                             │
     │                                             ▼
     │                                       [+] Try search
     │                                       [+] Select location
     │                                       [+] Select category
     │                                             │
     │                                             ▼
     │                                       View first 50 leads
     │                                       (free limit)
     │                                             │
     │                                             ▼
     │                                       [Export] button shown
     │                                             │
     │                                       Decision point:
     │                                       Valuable? → YES
     │                                             │
     │                                             ▼
     │                                       [Upgrade Now]
     │                                       Shows pricing page
     │                                             │
     │                                       Selects plan +
     │                                       enters payment
     │                                             │
     │                                             ▼
     │                                       ✓ Conversion!
     │                                       Subscriber created

EVALUATION             DECISION               CONVERSION
     │                    │                        │
  Used free              7 days                 Now paying
  features               passed                 member
```

### Journey 2: Returning Customer (Lead Generation)

```
LOGIN                SEARCH              FILTER & Refine              EXPORT
  │                   │                        │                        │
  ▼                   ▼                        ▼                        ▼
Click on         Dashboard         1. Select location         Export form
login             loads            2. Select category         │
  │                 │              3. Apply filters          ▼
  ▼                 ▼              4. Review results    Select format:
Enter             Lead Search      (247 results)        • CSV
credentials       button                │              • Excel
  │                 │                   ▼              • CRM Sync
  ▼                 ▼              [Save Search]            │
Auth check      Search page       [View Analytics]         ▼
  │                |             [Export]             Process:
  ▼                ▼                  │              1. Deduct quota
✓ Login        Previous              ▼              2. Generate file
  │            searches         Export Dialog        3. Save to S3
  │            shown            Options shown        4. Email link
  │                 │                  │                │
  └────────────┬────┘                  ▼                ▼
               │                Select fields        File ready
               │                (filtered list)      │
               │                    │                ▼
                Performance         ▼           [Download]
                Insights       [Export Now]    or
                (ROI, usage)        │        [Send to CRM]
                                    │                │
                                    ▼                ▼
                               Result Page      Success page
                               File generated   Notification sent
                                    │                │
                                    └────────────────┘
                                         │
                                         ▼
                                    Usage updated
                                    Summary shown
```

---

## FRONTEND COMPONENT STRUCTURE

### React Component Hierarchy

```
App.js (Root)
├── Layout/
│   ├── Header.js
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── User Menu
│   ├── Sidebar.js
│   │   ├── NavLinks
│   │   ├── Settings
│   │   └── Support
│   └── Footer.js
│
├── Pages/
│   ├── LandingPage/
│   │   ├── Hero
│   │   ├── Features
│   │   ├── Pricing
│   │   ├── CTA Buttons
│   │   └── Footer
│   │
│   ├── AuthPages/
│   │   ├── SignUp.js
│   │   │   ├── SignUpForm
│   │   │   ├── OAuthButtons
│   │   │   └── TermsCheckbox
│   │   ├── LogIn.js
│   │   ├── ForgotPassword.js
│   │   └── ResetPassword.js
│   │
│   ├── Dashboard/
│   │   ├── DashboardPage.js
│   │   ├── stats/
│   │   │   ├── StatsCards.js (Usage, Plan, Revenue)
│   │   │   └── Charts.js
│   │   ├── quickLinks/
│   │   │   ├── RecentSearches.js
│   │   │   └── RecentExports.js
│   │   └── CTA/
│   │       └── CreateSearchButton.js
│   │
│   ├── LeadSearch/
│   │   ├── SearchPage.js (Main container)
│   │   ├── filters/
│   │   │   ├── FilterSidebar.js
│   │   │   ├── LocationFilter.js
│   │   │   ├── CategoryFilter.js
│   │   │   ├── WebsiteStatusFilter.js
│   │   │   ├── RatingFilter.js
│   │   │   ├── AdvancedFilters.js (Pro+)
│   │   │   └── FilterApplyButton.js
│   │   ├── results/
│   │   │   ├── ResultsList.js
│   │   │   ├── LeadCard.js
│   │   │   │   ├── BusinessInfo
│   │   │   │   ├── ContactInfo
│   │   │   │   ├── RatingStars
│   │   │   │   ├── StatusDropdown
│   │   │   │   └── ActionButtons
│   │   │   ├── Pagination.js
│   │   │   ├── SortOptions.js
│   │   │   └── ResultsCount.js
│   │   ├── toolbar/
│   │   │   ├── SearchSaveButton.js
│   │   │   ├── ExportButton.js
│   │   │   ├── ViewToggle.js
│   │   │   └── SearchBar.js
│   │   └── LeadDetailModal.js
│   │       ├── BasicInfo
│   │       ├── DecisionMakers (Pro+)
│   │       ├── NotesSection
│   │       └── ActionButtons
│   │
│   ├── MySearces/
│   │   ├── SavedSearchesPage.js
│   │   ├── SearchTable.js
│   │   └── SearchCard.js
│   │
│   ├── Exports/
│   │   ├── ExportDialogModal.js
│   │   │   ├── FormatSelector
│   │   │   ├── FieldSelector
│   │   │   ├── UsageDisplay
│   │   │   └── ExportButton
│   │   ├── ExportHistory.js
│   │   └── ExportCard.js
│   │
│   ├── Analytics/
│   │   ├── AnalyticsDashboard.js
│   │   ├── charts/
│   │   │   ├── SearchTrendsChart.js
│   │   │   ├── IndustryBreakdown.js
│   │   │   ├── LocationMap.js
│   │   │   └── ROICalculator.js
│   │   └── metrics/
│   │       ├── KPICards.js
│   │       └── PerformanceMetrics.js
│   │
│   ├── Integrations/
│   │   ├── IntegrationsPage.js
│   │   ├── CRMTile.js (HubSpot, Salesforce, etc.)
│   │   ├── AutomationTile.js (Zapier)
│   │   ├── ConnectionModal.js
│   │   └── FieldMappingPanel.js
│   │
│   ├── Settings/
│   │   ├── SettingsPage.js
│   │   ├── ProfileSettings.js
│   │   ├── PreferencesSettings.js
│   │   ├── PrivacySettings.js
│   │   └── DangerZone.js (Delete account)
│   │
│   ├── Billing/
│   │   ├── BillingPage.js
│   │   ├── CurrentPlan.js
│   │   ├── PlanComparison.js
│   │   ├── PaymentMethod.js
│   │   └── InvoiceHistory.js
│   │
│   ├── Pricing/
│   │   ├── PricingPage.js
│   │   ├── PricingTier.js (3 tiers: Starter, Pro, Enterprise)
│   │   ├── PricingComparisonTable.js
│   │   ├── AddOnsList.js
│   │   └── CTA Buttons
│   │
│   └── Support/
│       ├── SupportPage.js
│       ├── FAQ.js
│       ├── ContactFormModal.js
│       └── ChatWidget.js
│
├── Components/ (Reusable)
│   ├── Common/
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── Select.js
│   │   ├── Modal.js
│   │   ├── Card.js
│   │   ├── Badge.js
│   │   ├── Loader.js
│   │   ├── Toast.js (Notifications)
│   │   └── Avatar.js
│   │
│   ├── Charts/
│   │   ├── LineChart.js
│   │   ├── BarChart.js
│   │   ├── PieChart.js
│   │   └── AreaChart.js
│   │
│   ├── Forms/
│   │   ├── FormField.js
│   │   ├── TextInput.js
│   │   ├── TextArea.js
│   │   ├── Checkbox.js
│   │   ├── RadioButton.js
│   │   ├── Dropdown.js
│   │   ├── MultiSelect.js
│   │   ├── RangeSlider.js
│   │   └── FormSubmitButton.js
│   │
│   └── Tables/
│       ├── DataTable.js
│       ├── TableRow.js
│       ├── TableHeader.js
│       └── TablePagination.js
│
├── Hooks/ (Custom React Hooks)
│   ├── useAuth.js
│   ├── useLeads.js
│   ├── useFilters.js
│   ├── useExport.js
│   ├── useCRM.js
│   ├── useAnalytics.js
│   └── useLocalStorage.js
│
├── Context/ (State Management)
│   ├── AuthContext.js
│   ├── LeadsContext.js
│   ├── FilterContext.js
│   ├── SubscriptionContext.js
│   └── UIContext.js
│
├── Services/
│   ├── api/
│   │   ├── authService.js
│   │   ├── leadsService.js
│   │   ├── exportService.js
│   │   ├── crmService.js
│   │   ├── analyticsService.js
│   │   └── billingService.js
│   ├── storage/
│   │   └── localStorage.js
│   └── utils/
│       ├── formatters.js
│       ├── validators.js
│       └── helpers.js
│
├── Utils/
│   ├── constants.js
│   ├── config.js
│   ├── localStorage.js
│   └── api.js (Axios setup)
│
└── Styles/
    ├── global.css
    ├── colors.css
    ├── typography.css
    └── breakpoints.css
```

---

## BACKEND API ENDPOINTS

### Authentication Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/google-callback
POST   /api/auth/linkedin-callback
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
POST   /api/auth/resend-verification
```

### Lead Management Endpoints

```
GET    /api/leads                        → Get leads (paginated)
GET    /api/leads/:id                    → Get specific lead
GET    /api/leads/search                 → Search & filter leads
POST   /api/leads/:id/enrich             → Enrich lead data (Pro+)
PUT    /api/leads/:id/status             → Update lead status
PUT    /api/leads/:id/notes              → Add notes to lead
DELETE /api/leads/:id                    → Remove lead
POST   /api/leads/bulk-action            → Bulk operations on leads
```

### Search & Filter Endpoints

```
POST   /api/searches/save                → Save search criteria
GET    /api/searches/my-searches         → Get user's saved searches
PUT    /api/searches/:id                 → Update saved search
DELETE /api/searches/:id                 → Delete saved search
POST   /api/searches/:id/apply           → Apply saved search
GET    /api/searches/:id/results         → Get results for saved search
```

### Export Endpoints

```
POST   /api/exports/csv                  → Generate CSV
POST   /api/exports/excel                → Generate Excel
POST   /api/exports/json                 → Generate JSON
GET    /api/exports/history              → Get export history
GET    /api/exports/:id/download         → Download export file
DELETE /api/exports/:id                  → Delete export
POST   /api/exports/schedule             → Schedule recurring export
```

### CRM Integration Endpoints

```
POST   /api/crm/:provider/connect        → Initiate OAuth
GET    /api/crm/:provider/callback       → OAuth callback
POST   /api/crm/sync                     → Sync leads to CRM
GET    /api/crm/field-mapping/:provider  → Get field mapping
PUT    /api/crm/field-mapping/:provider  → Update field mapping
DELETE /api/crm/:provider/disconnect     → Disconnect CRM
GET    /api/crm/sync-history             → Get sync history
```

### User Management Endpoints

```
GET    /api/users/profile                → Get user profile
PUT    /api/users/profile                → Update profile
PUT    /api/users/preferences            → Update preferences
POST   /api/users/change-password        → Change password
DELETE /api/users/account                → Delete account
```

### Subscription & Billing Endpoints

```
GET    /api/subscription/current         → Get current subscription
POST   /api/subscription/upgrade         → Upgrade plan
POST   /api/subscription/downgrade       → Downgrade plan
POST   /api/subscription/cancel          → Cancel subscription
GET    /api/invoices                     → Get invoices
GET    /api/usage                        → Get usage metrics
PUT    /api/payment-method               → Update payment method
POST   /api/apply-coupon                 → Apply promo code
```

### Analytics Endpoints

```
GET    /api/analytics/overview           → Get dashboard overview
GET    /api/analytics/searches           → Get search analytics
GET    /api/analytics/exports            → Get export analytics
GET    /api/analytics/industries         → Get industry breakdown
GET    /api/analytics/locations          → Get geo breakdown
GET    /api/analytics/roi                → Get ROI estimate
```

### Team Management Endpoints (Pro+)

```
GET    /api/team/members                 → List team members
POST   /api/team/invite                  → Invite team member
DELETE /api/team/members/:id             → Remove team member
PUT    /api/team/members/:id/role        → Change member role
GET    /api/team/activity-log            → Get team activity
```

### Automation & Integration Endpoints

```
POST   /api/zapier/authorize             → Authorize Zapier
GET    /api/zapier/triggers              → Get available triggers
POST   /api/zapier/webhook               → Receive webhook from Zapier
```

---

## DATABASE SCHEMA

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    user_avatar_url VARCHAR(255),
    subscription_tier ENUM('free_trial', 'starter', 'professional', 'enterprise'),
    auth_provider ENUM('email', 'google', 'linkedin'),
    oauth_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    timezone VARCHAR(50),
    notification_preferences JSON,
    deleted_at TIMESTAMP NULL
);
```

### Leads Table
```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    website_url VARCHAR(255),
    has_website BOOLEAN,
    website_quality ENUM('poor', 'moderate', 'good'),
    google_rating DECIMAL(3,2),
    review_count INTEGER,
    business_category VARCHAR(100),
    google_maps_url VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(10,8),
    business_type VARCHAR(100),
    employee_count_estimate INTEGER,
    social_media JSON,
    data_source ENUM('google_maps', 'directory', 'manual'),
    last_updated TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    indexed_in_elasticsearch BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_leads_location ON leads(city, state);
CREATE INDEX idx_leads_category ON leads(business_category);
CREATE INDEX idx_leads_website_status ON leads(has_website);
CREATE INDEX idx_leads_rating ON leads(google_rating);
```

### User Lead Interactions (Tracking & Status)
```sql
CREATE TABLE user_lead_interactions (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY REFERENCES users(id),
    lead_id UUID FOREIGN KEY REFERENCES leads(id),
    status ENUM('not_contacted', 'contacted', 'qualified', 'rejected', 'won'),
    notes TEXT,
    view_count INTEGER DEFAULT 1,
    last_viewed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Saved Searches Table
```sql
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY REFERENCES users(id),
    search_name VARCHAR(255),
    filter_criteria JSON,
    result_count INTEGER,
    last_executed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Exports Table
```sql
CREATE TABLE exports (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY REFERENCES users(id),
    export_type ENUM('csv', 'excel', 'json', 'crm'),
    format VARCHAR(50),
    file_url VARCHAR(255),
    lead_count INTEGER,
    status ENUM('processing', 'completed', 'failed'),
    file_size_bytes INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY REFERENCES users(id),
    plan_type ENUM('starter', 'professional', 'enterprise'),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status ENUM('active', 'canceled', 'past_due'),
    monthly_price DECIMAL(10,2),
    billing_cycle VARCHAR(20),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    canceled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Plan Limits Table (Feature Flags)
```sql
CREATE TABLE plan_limits (
    id UUID PRIMARY KEY,
    plan_type ENUM('starter', 'professional', 'enterprise'),
    monthly_leads_limit INTEGER,
    crm_integration BOOLEAN,
    advanced_filters BOOLEAN,
    api_access BOOLEAN,
    white_label BOOLEAN,
    team_seats INTEGER,
    priority_support BOOLEAN
);
```

### CRM Integrations Table
```sql
CREATE TABLE crm_integrations (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY REFERENCES users(id),
    crm_type ENUM('hubspot', 'salesforce', 'pipedrive', 'activecampaign'),
    oauth_token VARCHAR(255) ENCRYPTED,
    refresh_token VARCHAR(255) ENCRYPTED,
    field_mapping JSON,
    is_active BOOLEAN,
    connected_at TIMESTAMP,
    last_sync TIMESTAMP,
    sync_count INTEGER DEFAULT 0
);
```

### Lead Enrichment Data Table
```sql
CREATE TABLE lead_enrichment (
    id UUID PRIMARY KEY,
    lead_id UUID FOREIGN KEY REFERENCES leads(id),
    decision_maker_name VARCHAR(255),
    decision_maker_title VARCHAR(255),
    decision_maker_email VARCHAR(255),
    decision_maker_phone VARCHAR(20),
    decision_maker_linkedin_url VARCHAR(255),
    business_email VARCHAR(255),
    phone_directory JSON,
    additional_contacts JSON,
    enrichment_score DECIMAL(3,2),
    data_provider VARCHAR(100),
    enriched_at TIMESTAMP,
    expires_at TIMESTAMP
);
```

### Analytics Events Table
```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY,
    user_id UUID FOREIGN KEY REFERENCES users(id),
    event_type ENUM('search', 'export', 'crm_sync', 'login', 'signup'),
    event_metadata JSON,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_time ON analytics_events(user_id, timestamp);
```

---

## FEATURE RENDERING LOGIC

### How Subscription Tier Controls Features

```javascript
// Feature visibility based on subscription tier

const FeatureRenderer = ({subscriptionTier, featureName}) => {
    const tiers = {
        free_trial: ['basic_search', 'csv_export', '50_leads_monthly'],
        starter: ['basic_search', 'csv_export', '50_leads_monthly', 'email_support'],
        professional: [
            'basic_search',
            'advanced_search',
            'csv_export',
            'excel_export',
            'json_export',
            'zapier_integration',
            'crm_integration',
            'lead_enrichment',
            'analytics',
            '500_leads_monthly',
            'chat_support',
            'api_read_only'
        ],
        enterprise: [
            'all_professional_features',
            'api_read_write',
            'crm_bulk_sync',
            'white_label',
            'custom_branding',
            '2000_plus_leads',
            'priority_support',
            'dedicated_account_manager',
            'team_management',
            'competitor_tracking'
        ]
    };

    const allowedFeatures = tiers[subscriptionTier] || [];
    return allowedFeatures.includes(featureName);
};

// Usage in component:
{FeatureRenderer({subscriptionTier: 'professional', featureName: 'crm_integration'}) && (
    <CRMIntegrationPanel/>
)}
```

### Conditional Feature Display in UI

```javascript
// Example: Advanced Filters Component

const AdvancedFilters = ({subscriptionTier}) => {
    const isProPlus = ['professional', 'enterprise'].includes(subscriptionTier);

    return (
        <>
            {/* Basic Filters Always Shown */}
            <BasicFilters/>

            {/* Advanced Filters Gated */}
            {isProPlus ? (
                <AdvancedFilterOptions/>
            ) : (
                <UpgradePrompt
                    message="Upgrade to Professional to unlock advanced filtering"
                    currentTier={subscriptionTier}
                    targetTier="professional"
                />
            )}
        </>
    );
};
```

### Lead Export Logic Based on Tier

```javascript
const ExportLeads = async ({leads, format, subscriptionTier}) => {
    // Check usage limits
    const usage = await checkMonthlyUsage(subscriptionTier);
    
    if (leads.length > (usage.remaining)) {
        throw new Error(`Exceeded monthly limit. You have ${usage.remaining} leads remaining.`);
    }

    // Check format availability
    const allowedFormats = {
        starter: ['csv'],
        professional: ['csv', 'excel', 'json', 'zapier'],
        enterprise: ['csv', 'excel', 'json', 'zapier', 'api', 'crm_direct']
    };

    if (!allowedFormats[subscriptionTier].includes(format)) {
        throw new Error(`Format ${format} not available in ${subscriptionTier} plan`);
    }

    // Generate export
    const exportData = await generateExport(leads, format);
    
    // Track usage
    await updateMonthlyUsage(subscriptionTier, leads.length);
    
    return exportData;
};
```

---

## DATA FLOW ARCHITECTURE

### Complete Request/Response Flow

```
┌─────────────────────────────────────────────────────────┐
│                  USER BROWSER                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React Component Renders                          │  │
│  │  (SearchPage, FilterSidebar, Results)             │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     │ User interacts (clicks filters)    │
│                     ▼                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Filter values collected in React State          │  │
│  │  (location, category, rating, etc.)              │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     │ User clicks [Apply Filters]        │
│                     ▼                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  API Call via Axios/Fetch                        │  │
│  │  POST /api/leads/search                          │  │
│  │  Payload:                                         │  │
│  │  {                                                │  │
│  │    location: "Austin, TX",                        │  │
│  │    radius: 10,                                    │  │
│  │    category: "Plumbing",                          │  │
│  │    website_status: "no_website",                  │  │
│  │    rating_min: 3.5,                              │  │
│  │    limit: 20,                                     │  │
│  │    page: 1                                        │  │
│  │  }                                                │  │
│  └──────────────────┬────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────┘
                      │
                      │ HTTP POST Request
                      │ (JWT token in header)
                      │
        ┌─────────────▼──────────────────────┐
        │  API GATEWAY / LOAD BALANCER        │
        │  ├─ Authentication Check            │
        │  ├─ Rate Limiting                   │
        │  └─ Request Validation              │
        └─────────────┬──────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  EXPRESS/NODE.js BACKEND            │
        │  ┌────────────────────────────────┐ │
        │  │ Route Handler                  │ │
        │  │ /api/leads/search              │ │
        │  │ (searchController.js)          │ │
        │  └────────────┬───────────────────┘ │
        │               │                      │
        │               ▼                      │
        │  ┌────────────────────────────────┐ │
        │  │ Middleware Chain               │ │
        │  │ 1. Validate request            │ │
        │  │ 2. Check auth token            │ │
        │  │ 3. Check subscription tier     │ │
        │  │ 4. Verify usage limits         │ │
        │  └────────────┬───────────────────┘ │
        │               │                      │
        │               ▼                      │
        │  ┌────────────────────────────────┐ │
        │  │ Business Logic                 │ │
        │  │ (searchService.js)             │ │
        │  │ 1. Parse filters               │ │
        │  │ 2. Build query                 │ │
        │  │ 3. Apply permission rules      │ │
        │  └────────────┬───────────────────┘ │
        │               │                      │
        │               ▼                      │
        │  ┌────────────────────────────────┐ │
        │  │ Data Layer                     │ │
        │  │ (leadRepository.js)            │ │
        │  │ 1. Check Redis cache           │ │
        │  │ 2. If miss → Query Elasticsearch│
        │  │ 3. If miss → Query PostgreSQL  │
        │  └────────────┬───────────────────┘ │
        └────────────────┼────────────────────┘
                         │
             ┌───────────┼───────────┐
             │           │           │
             ▼           ▼           ▼
        ┌────────┐ ┌──────────┐ ┌─────────┐
        │ Redis  │ │ Elast    │ │PostgreSQL
        │ Cache  │ │icsearch  │ │ Primary 
        │        │ │ (indexed)│ │ DB
        │ (1ms  │ │(50ms)    │ │(200ms)
        │ lookup)│ │          │ │
        └────────┘ └──────────┘ └─────────┘
                         │
             Results returned to Node.js
             (Merged if from multiple sources)
                         │
        ┌────────────────────────────────────┐
        │  Response Formatting               │
        │  1. Map to schema                  │
        │  2. Exclude sensitive data         │
        │  3. Add pagination info            │
        │  4. Add metadata                   │
        │  5. JSON stringify                 │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  Response Body:                    │
        │  {                                 │
        │    success: true,                  │
        │    data: {                         │
        │      leads: [...],                 │
        │      total_count: 247,             │
        │      page: 1,                      │
        │      per_page: 20,                 │
        │      total_pages: 13               │
        │    },                              │
        │    meta: {                         │
        │      response_time_ms: 125,        │
        │      cached: true                  │
        │    }                               │
        │  }                                 │
        └────────────┬───────────────────────┘
                     │
                     │ HTTP 200 OK
                     │
┌────────────────────┴──────────────────────┐
│          USER BROWSER                     │
│  React receives response                  │
│         │                                  │
│         ▼                                  │
│  State updated: setLeads(data.leads)      │
│         │                                  │
│         ▼                                  │
│  Component re-renders                     │
│  (Results displayed)                      │
│         │                                  │
│         ▼                                  │
│  ┌─────────────────────────────────────┐  │
│  │ Lead Results Display:                │  │
│  │ ┌─────────────────────────────────┐ │  │
│  │ │ Lead #1: ABC Plumbing           │ │  │
│  │ │ Austin, TX | 4.5★ | 125 reviews │ │  │
│  │ │ No Website ✗                    │ │  │
│  │ └─────────────────────────────────┘ │  │
│  │ ┌─────────────────────────────────┐ │  │
│  │ │ Lead #2: ...                    │ │  │
│  │ │ ...                             │ │  │
│  │ └─────────────────────────────────┘ │  │
│  │ Pagination: [Prev] 1 2 3 [Next]    │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  User can now:                            │
│  • View lead details                      │
│  • Add lead status                        │
│  • Export leads                           │
│  • Save search                            │
│  • Refine filters                         │
└───────────────────────────────────────────┘
```

---

## MODULE-BY-MODULE BREAKDOWN

### Module 1: Authentication & Authorization

**FILES:**
```
backend/
├── controllers/
│   └── authController.js
├── routes/
│   └── authRoutes.js
├── services/
│   └── authService.js
├── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
├── utils/
│   └── tokenUtils.js
└── models/
    └── User.js
```

**Key Functions:**
- `signupUser(email, password)` → Validates, hashes password, creates user
- `loginUser(email, password)` → Authenticates, generates JWT
- `refreshToken(refreshToken)` → Returns new JWT
- `verifyEmail(token)` → Confirms email address
- `resetPassword(email)` → Sends reset link
- `oauthCallback(provider, code)` → Handles Google/LinkedIn OAuth
- `authMiddleware(req, res, next)` → Verifies JWT in requests
- `roleMiddleware(requiredTier)` → Checks subscription tier

---

### Module 2: Lead Search & Discovery

**FILES:**
```
backend/
├── controllers/
│   └── leadController.js
├── routes/
│   └── leadRoutes.js
├── services/
│   ├── leadService.js
│   ├── searchService.js
│   └── googleMapsService.js
├── models/
│   └── Lead.js
└── utils/
    └── leadFilterer.js
```

**Key Functions:**
- `searchLeads(filters)` → Queries leads based on filters
- `getLeadById(id)` → Fetches detailed lead info
- `enrichLead(leadId)` → Calls enrichment APIs
- `fetchFromGoogleMaps(params)` → Scrapes Google Maps API
- `buildElasticsearchQuery(filters)` → Constructs ES query
- `scoreLead(lead)` → Calculates lead quality score
- `updateLeadInteraction(userId, leadId, status)` → Tracks user interaction

---

### Module 3: Export & File Generation

**FILES:**
```
backend/
├── controllers/
│   └── exportController.js
├── routes/
│   └── exportRoutes.js
├── services/
│   ├── exportService.js
│   ├── csvGenerator.js
│   ├── excelGenerator.js
│   └── fileStorage.js
├── models/
│   └── Export.js
└── jobs/
    └── exportQueue.js (Bull job queue)
```

**Key Functions:**
- `generateCSV(leads, fields)` → Creates CSV file
- `generateExcel(leads, fields)` → Creates Excel file
- `generateJSON(leads)` → Creates JSON file
- `uploadToS3(fileBuffer, filename)` → Stores file in S3
- `sendDownloadEmail(user, downloadLink)` → Emails download link
- `trackExportUsage(userId, leadCount)` → Updates user usage
- `scheduleRecurringExport(params)` → Sets up recurring exports

---

### Module 4: CRM Integration

**FILES:**
```
backend/
├── controllers/
│   └── crmController.js
├── routes/
│   └── crmRoutes.js
├── services/
│   ├── crmIntegrationService.js
│   ├── hubspotService.js
│   ├── salesforceService.js
│   ├── pipedriveService.js
│   └── fieldMappingService.js
├── models/
│   └── CRMIntegration.js
└── utils/
    └── crmConnectors.js
```

**Key Functions:**
- `initiateOAuth(provider)` → Starts OAuth flow
- `handleOAuthCallback(provider, code)` → Processes OAuth response
- `syncLeadsToCRM(leads, crmType)` → Pushes leads to CRM
- `getFieldMapping(provider)` → Retrieves mapped fields
- `updateFieldMapping(provider, mapping)` → Saves field mapping
- `detectDuplicates(lead, crmType)` → Checks for existing contacts
- `trackSyncStatus(syncId, status)` → Logs sync progress

---

### Module 5: Subscription & Billing

**FILES:**
```
backend/
├── controllers/
│   └── billingController.js
├── routes/
│   └── billingRoutes.js
├── services/
│   ├── subscriptionService.js
│   ├── stripeService.js
│   └── usageTrackingService.js
├── models/
│   ├── Subscription.js
│   └── Invoice.js
└── webhooks/
    └── stripeWebhook.js
```

**Key Functions:**
- `createSubscription(userId, planType, paymentMethod)` → Starts subscription
- `upgradePlan(userId, newPlan)` → Upgrades subscription
- `downgrade Plan(userId, newPlan)` → Downgrades subscription
- `cancelSubscription(userId)` → Cancels subscription
- `recordPayment(subscriptionId, amount)` → Logs successful payment
- `handleFailedPayment(subscriptionId)` → Manages payment failures
- `checkUsageLimit(userId)` → Verifies monthly lead limit
- `generateInvoice(subscriptionId)` → Creates invoice

---

### Module 6: Analytics & Reporting

**FILES:**
```
backend/
├── controllers/
│   └── analyticsController.js
├── routes/
│   └── analyticsRoutes.js
├── services/
│   ├── analyticsService.js
│   └── reportGenerator.js
├── models/
│   └── AnalyticsEvent.js
└── jobs/
    └── analyticsProcessor.js
```

**Key Functions:**
- `trackEvent(userId, eventType, metadata)` → Records user action
- `getSearchAnalytics(userId)` → Returns search trends
- `getIndustryBreakdown(userId)` → Shows industry distribution
- `getGeographicBreakdown(userId)` → Shows location distribution
- `calculateROI(userId)` → Estimates ROI based on leads
- `generateMonthlyReport(userId)` → Creates summary report
- `compareWithPrevious(metric, period)` → Analyzes trends

---

### Module 7: Team Management (Enterprise)

**FILES:**
```
backend/
├── controllers/
│   └── teamController.js
├── routes/
│   └── teamRoutes.js
├── services/
│   └── teamService.js
├── models/
│   └── TeamMember.js
└── middleware/
    └── teamPermissionMiddleware.js
```

**Key Functions:**
- `inviteTeamMember(email, role)` → Sends invitation
- `addTeamMember(token, password)` → Accepts invitation
- `updateMemberRole(memberId, newRole)` → Changes permissions
- `removeTeamMember(memberId)` → Revokes access
- `getTeamActivity(filters)` → Shows activity log
- `shareSearch(searchId, memberIds)` → Shares saved search
- `setMemberQuota(memberId, leadLimit)` → Allocates leads

### Module 8: Notifications & Communications

**FILES:**
```
backend/
├── controllers/
│   └── notificationController.js
├── services/
│   ├── emailService.js
│   ├── notificationService.js
│   └── slackService.js
├── models/
│   └── Notification.js
└── queue/
    └── emailQueue.js
```

**Key Functions:**
- `sendVerificationEmail(user)` → Sends email verification
- `sendPasswordResetEmail(user)` → Sends reset link
- `sendExportReadyEmail(user, downloadLink)` → Notifies export complete
- `sendWeeklyReport(user, reportData)` → Sends summary email
- `sendMonthlyInvoice(user, invoice)` → Sends billing email
- `sendAlerts(user, alertType)` → Sends custom alerts
- `sendSlackNotification(workspace, message)` → Posts to Slack

---

**Document Ready for Development!**

This comprehensive feature plan covers:
✅ Full application architecture
✅ Complete API endpoints
✅ Database schema design  
✅ Component structure
✅ User flows & journeys
✅ Data flow diagrams
✅ Module breakdown
✅ Feature gating logic

**Next Steps:**
1. Set up development environment
2. Initialize Git repository
3. Set up CI/CD pipeline
4. Begin backend API development
5. Build frontend components in parallel
