-- ====================================================
-- APPPROMPTHUB - ADMIN CRUD POLICY ADJUSTMENTS
-- Run this SQL in your Supabase SQL Editor if you encounter
-- permission issues (401 / 403) when saving edits from `/admin`.
-- ====================================================

-- By default, prompts and news tables are locked for writes.
-- These commands grant write permissions (INSERT, UPDATE, DELETE) to administrators.

-- OPTION A: EASY MODE (For local prototyping & sandbox testing)
-- This allows anyone accessing your app to add or modify prompts. Recommended for local dev!

-- 1. Policies for 'prompts' table CRUD:
DROP POLICY IF EXISTS "Allow public update of views and likes" ON prompts;
CREATE POLICY "Allow public insert on prompts" ON prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on prompts" ON prompts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on prompts" ON prompts FOR DELETE USING (true);

-- 2. Policies for 'news' table CRUD:
CREATE POLICY "Allow public insert on news" ON news FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on news" ON news FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on news" ON news FOR DELETE USING (true);

-- 3. Policies for 'subscribers' table CRUD:
CREATE POLICY "Allow public delete on subscribers" ON subscribers FOR DELETE USING (true);
CREATE POLICY "Allow public read on subscribers" ON subscribers FOR SELECT USING (true);


-- ----------------------------------------------------
-- OPTION B: SECURE PRODUCTION MODE (For live sites)
-- Locks down writes so only requests using your Supabase service_role key can execute writes.
-- (Required if you deploy to production and want to prevent public DB edits).
-- To use this option, do not run the public policies above. Instead, query your tables using
-- a server-side Supabase client initialized with your secret SUPABASE_SERVICE_ROLE_KEY.
-- ----------------------------------------------------
