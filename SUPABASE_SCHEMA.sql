-- ═══════════════════════════════════════════════════════════════
-- UJRIS ENTERPRISE DATABASE SCHEMA v4.0
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('individual', 'solicitor', 'charity', 'union', 'academic');
CREATE TYPE case_status AS ENUM ('assessment', 'sar_pending', 'acas_early_conciliation', 'et1_drafting', 'tribunal_active', 'settled', 'closed');
CREATE TYPE subscription_tier AS ENUM ('free', 'individual_pro', 'solicitor_pro', 'solicitor_enterprise', 'charity', 'union', 'institution');

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role user_role DEFAULT 'individual',
  firm_name TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  stripe_customer_id TEXT,
  cases_limit INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CASES (multiple per user)
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  case_name TEXT NOT NULL,
  defendant_name TEXT,
  case_type TEXT,
  status case_status DEFAULT 'assessment',
  icon TEXT DEFAULT '⚖',
  case_ref TEXT,
  tribunal TEXT DEFAULT 'Employment Tribunal',
  incident_date DATE,
  limitation_date DATE,
  next_deadline DATE,
  settlement_goal NUMERIC DEFAULT 0,
  settlement_amount NUMERIC,
  disc_types TEXT[],
  notes TEXT,
  case_data JSONB,
  ai_assessment TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EVIDENCE (per case)
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  file_name TEXT,
  file_url TEXT,
  file_type TEXT,
  category TEXT,
  description TEXT,
  importance TEXT DEFAULT 'medium',
  forensic_metadata JSONB,
  tags TEXT[],
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS (per case)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  document_type TEXT,
  title TEXT,
  content TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  downloaded BOOLEAN DEFAULT FALSE
);

-- TIMELINE EVENTS (per case)
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  event_date DATE,
  description TEXT,
  event_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  plan subscription_tier,
  status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API KEYS (for law firms)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  key TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  name TEXT,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (users only see their own data)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can CRUD own cases" ON cases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own evidence" ON evidence FOR ALL USING (
  case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
);
CREATE POLICY "Users can CRUD own documents" ON documents FOR ALL USING (
  case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
);
CREATE POLICY "Users can CRUD own timeline" ON timeline_events FOR ALL USING (
  case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
);

-- AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- SETUP COMPLETE. Connect Supabase to UJRIS:
-- 1. Add SUPABASE_URL to Hostinger environment variables
-- 2. Add SUPABASE_ANON_KEY to Hostinger environment variables
-- ═══════════════════════════════════════════════════════════════
