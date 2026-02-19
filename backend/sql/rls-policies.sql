-- ============================================
-- RLS (Row Level Security) Policies for Users
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
-- Authenticated users can only see their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
-- Authenticated users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Anyone can insert (signup with OAuth)
-- Public can create new user accounts
CREATE POLICY "Anyone can signup"
  ON users FOR INSERT
  WITH CHECK (true);

-- Policy 4: Service role bypasses RLS
-- Backend operations using service_role_key don't need to follow RLS
-- This is handled at the application level - always use service_role_key for backend

-- Policy 5: Users can delete their own profile (soft delete via status)
-- Authenticated users can mark their own profile as deleted
CREATE POLICY "Users can delete own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: All these policies apply ONLY when using the anon_key (frontend)
-- Backend operations use service_role_key which bypasses RLS completely
-- This allows backend to query/update any user without RLS restrictions
