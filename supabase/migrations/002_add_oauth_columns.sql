-- ============================================
-- Add OAuth Columns to Users Table
-- ============================================
-- Migration to add OAuth provider and OAuth ID columns for Google and LinkedIn authentication

-- Add oauth_provider and oauth_id columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

-- Create index for efficient OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);

-- Add comment explaining the columns
COMMENT ON COLUMN users.oauth_provider IS 'OAuth provider: "google", "linkedin", or NULL for email/password auth';
COMMENT ON COLUMN users.oauth_id IS 'Provider-specific user ID from OAuth provider';
