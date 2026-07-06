-- ====================================================
-- APPPROMPTHUB - SCHEMA FOR PAY-PER-UNLOCK MONETIZATION
-- Run this SQL in your Supabase SQL Editor
-- ====================================================

-- 1. Alter prompts table to support previews and pricing
ALTER TABLE prompts 
  ADD COLUMN IF NOT EXISTS price_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preview_text TEXT,
  ADD COLUMN IF NOT EXISTS full_text TEXT;

-- Populate full_text and preview_text columns for existing prompts
UPDATE prompts SET full_text = prompt_text WHERE full_text IS NULL;
UPDATE prompts SET preview_text = SUBSTRING(prompt_text FROM 1 FOR 150) || '...' WHERE preview_text IS NULL;

-- 2. Create unlocks table
CREATE TABLE IF NOT EXISTS unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- references auth.users(id) on delete cascade (can be null for sandbox mock mode)
  user_email TEXT NOT NULL,
  prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_email, prompt_id)
);

-- Enable RLS on unlocks
ALTER TABLE unlocks ENABLE ROW LEVEL SECURITY;

-- Allow select/insert policies for unlocks
CREATE POLICY "Allow public select on unlocks" ON unlocks
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on unlocks" ON unlocks
  FOR INSERT WITH CHECK (true);

-- 3. Create secure definer RPC function to access paid prompt contents
CREATE OR REPLACE FUNCTION get_prompt_full_text(p_prompt_id TEXT, p_user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
  v_email TEXT;
BEGIN
  -- Resolve email from auth JWT if logged in via real Supabase Auth, otherwise fallback
  v_email := COALESCE(NULLIF(auth.jwt() ->> 'email', ''), p_user_email);

  IF EXISTS (
    SELECT 1 FROM prompts
    WHERE id = p_prompt_id AND (price_cents IS NULL OR price_cents = 0)
  ) OR EXISTS (
    SELECT 1 FROM unlocks
    WHERE prompt_id = p_prompt_id AND user_email = v_email
  ) THEN
    SELECT full_text INTO result FROM prompts WHERE id = p_prompt_id;
    RETURN result;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;
