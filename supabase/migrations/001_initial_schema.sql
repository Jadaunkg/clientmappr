-- ============================================
-- ClientMapr Phase 1 Database Schema
-- ============================================
-- Migration file for initial schema setup
-- Created: 2024-02-18

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free_trial' 
    CHECK (subscription_tier IN ('free_trial', 'starter', 'professional', 'enterprise')),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Leads Table
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  website_url TEXT,
  has_website BOOLEAN DEFAULT FALSE,
  google_rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  business_category VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Subscriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL 
    CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' 
    CHECK (status IN ('active', 'canceled', 'past_due')),
  monthly_price INTEGER,
  billing_cycle VARCHAR(50) DEFAULT 'monthly' 
    CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start DATE,
  current_period_end DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Interactions Table (Lead interactions)
-- ============================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_contacted' 
    CHECK (status IN ('not_contacted', 'contacted', 'qualified', 'rejected', 'won')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Exports Table (User data exports)
-- ============================================
CREATE TABLE IF NOT EXISTS exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  format VARCHAR(20) CHECK (format IN ('csv', 'excel', 'json')),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255),
  record_count INTEGER,
  status VARCHAR(50) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_state ON leads(state);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(business_category);
CREATE INDEX IF NOT EXISTS idx_leads_has_website ON leads(has_website);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON exports(status);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- Note: Leads table does not need RLS (public lead search)

-- ============================================
-- RLS Policies for Users
-- ============================================
-- Allow users to read their own profile
CREATE POLICY IF NOT EXISTS "Users can read own profile" ON users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Allow users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Allow public to insert (signup)
CREATE POLICY IF NOT EXISTS "Anyone can signup" ON users
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- RLS Policies for Subscriptions
-- ============================================
-- Allow users to read their own subscriptions
CREATE POLICY IF NOT EXISTS "Users can read own subscriptions" ON subscriptions
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- ============================================
-- RLS Policies for Interactions
-- ============================================
-- Allow users to read their own interactions
CREATE POLICY IF NOT EXISTS "Users can read own interactions" ON interactions
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Allow users to insert interactions
CREATE POLICY IF NOT EXISTS "Users can insert interactions" ON interactions
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to update their interactions
CREATE POLICY IF NOT EXISTS "Users can update interactions" ON interactions
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================
-- RLS Policies for Exports
-- ============================================
-- Allow users to read their own exports
CREATE POLICY IF NOT EXISTS "Users can read own exports" ON exports
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Allow users to insert exports
CREATE POLICY IF NOT EXISTS "Users can insert exports" ON exports
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to update their exports
CREATE POLICY IF NOT EXISTS "Users can update exports" ON exports
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);
