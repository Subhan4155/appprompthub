-- ====================================================
-- APPPROMPTHUB - SCHEMA FOR WORKED/FAILED VOTING
-- Run this SQL in your Supabase SQL Editor
-- ====================================================

CREATE TABLE IF NOT EXISTS prompt_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID, -- references auth.users(id) on delete cascade (can be null for sandbox mock mode)
  user_email TEXT NOT NULL,
  worked BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (prompt_id, user_email)
);

-- Enable RLS
ALTER TABLE prompt_feedback ENABLE ROW LEVEL SECURITY;

-- Allow public read access to feedback
CREATE POLICY "Allow public select on feedback" ON prompt_feedback
  FOR SELECT USING (true);

-- Allow public insert of feedback (checked via client validation/API)
CREATE POLICY "Allow public insert on feedback" ON prompt_feedback
  FOR INSERT WITH CHECK (true);

-- Allow public update of feedback
CREATE POLICY "Allow public update on feedback" ON prompt_feedback
  FOR UPDATE USING (true);
