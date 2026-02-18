-- ClientMapr Phase 1 Database Schema
-- Supabase PostgreSQL 15
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- Enable Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "http";

-- ============================================
-- Create Enums
-- ============================================

CREATE TYPE subscription_tier AS ENUM ('free_trial', 'starter', 'professional', 'enterprise');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE interaction_status AS ENUM ('not_contacted', 'contacted', 'qualified', 'rejected', 'won');
CREATE TYPE export_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE export_format AS ENUM ('csv', 'excel', 'json');

-- ============================================
-- Users Table (Firebase UIDs as Primary Key)
-- ============================================

CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,                            -- Firebase UID (28 chars exactly)
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone_number VARCHAR(20),
  avatar_url TEXT,
  subscription_tier subscription_tier DEFAULT 'free_trial',
  status user_status DEFAULT 'active',
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (LENGTH(id) = 28)                               -- Enforce Firebase UID length
);

-- Indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================
-- Leads Table
-- ============================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  website_url TEXT,
  has_website BOOLEAN DEFAULT FALSE,
  google_rating DECIMAL(3, 1),
  review_count INTEGER DEFAULT 0,
  business_category VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for searching
CREATE INDEX idx_leads_city ON leads(city);
CREATE INDEX idx_leads_state ON leads(state);
CREATE INDEX idx_leads_business_category ON leads(business_category);
CREATE INDEX idx_leads_has_website ON leads(has_website);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_location ON leads(latitude, longitude);

-- ============================================
-- User-Leads Interactions Table
-- ============================================

CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status interaction_status DEFAULT 'not_contacted',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique: One user can only have one interaction per lead
  UNIQUE(user_id, lead_id)
);

-- Indexes for queries
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX idx_interactions_status ON interactions(status);
CREATE INDEX idx_interactions_created_at ON interactions(created_at DESC);

-- ============================================
-- Subscriptions Table
-- ============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan_type subscription_tier NOT NULL,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  monthly_price DECIMAL(10, 2),
  billing_cycle_start TIMESTAMP WITH TIME ZONE,
  billing_cycle_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- ============================================
-- Exports Table
-- ============================================

CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  format export_format NOT NULL,
  status export_status DEFAULT 'pending',
  file_url TEXT,
  record_count INTEGER DEFAULT 0,
  filters JSONB,                                         -- Store applied filters as JSON
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_exports_user_id ON exports(user_id);
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_created_at ON exports(created_at DESC);

-- ============================================
-- API Logs Table (Optional: for debugging)
-- ============================================

CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  method VARCHAR(10),
  path TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying logs
CREATE INDEX idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Users: Users can only view their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id);

-- Interactions: Users can only view/edit their own interactions
CREATE POLICY "Users can view their own interactions"
  ON interactions FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create interactions"
  ON interactions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own interactions"
  ON interactions FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Subscriptions: Users can only view their own subscription
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid()::text = user_id);

-- Exports: Users can only view their own exports
CREATE POLICY "Users can view their own exports"
  ON exports FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create exports"
  ON exports FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- API Logs: Users can only view their own logs
CREATE POLICY "Users can view their own logs"
  ON api_logs FOR SELECT
  USING (auth.uid()::text = user_id);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER users_updated_at_trigger BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER interactions_updated_at_trigger BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER subscriptions_updated_at_trigger BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER exports_updated_at_trigger BEFORE UPDATE ON exports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Seed Data (Optional - For Development)
-- ============================================

-- Note: Uncomment to seed initial data
-- INSERT INTO users (id, email, full_name, subscription_tier, email_verified)
-- VALUES 
--   ('dev-user-firebase-id-123', 'dev@clientmapr.test', 'Developer', 'professional', true),
--   ('test-user-firebase-id-456', 'test@clientmapr.test', 'Tester', 'starter', true);
