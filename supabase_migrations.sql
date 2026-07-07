-- ====================================================
-- APPPROMPTHUB - DATABASE MIGRATION SYSTEM
-- Run this SQL in your Supabase SQL Editor
-- ====================================================

-- 1. Alter prompts table to support submissions, previews, and monetization
alter table prompts 
  add column if not exists status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  add column if not exists submitted_by uuid references auth.users(id),
  add column if not exists source text not null default 'official' check (source in ('official', 'community')),
  add column if not exists preview_text text,
  add column if not exists full_text text,
  add column if not exists price_cents integer default 0; -- 0 represents free prompts by default

-- Populate full_text and preview_text columns for existing prompts
update prompts set full_text = prompt_text where full_text is null;
update prompts set preview_text = substring(prompt_text from 1 for 150) || '...' where preview_text is null;

-- Enable Row Level Security (RLS) policies for user submissions
drop policy if exists "public_read_approved" on prompts;
create policy "public_read_approved"
  on prompts for select
  using (status = 'approved');

drop policy if exists "users_can_submit" on prompts;
create policy "users_can_submit"
  on prompts for insert
  with check (auth.uid() = submitted_by and status = 'pending');


-- 2. Create prompt feedback table
create table if not exists prompt_feedback (
  id uuid primary key default gen_random_uuid(),
  prompt_id text references prompts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  worked boolean not null,
  comment text,
  created_at timestamp with time zone default now(),
  unique (prompt_id, user_id)
);

-- Enable RLS on prompt_feedback
alter table prompt_feedback enable row level security;

-- Create policies for feedback
drop policy if exists "public_read_feedback" on prompt_feedback;
create policy "public_read_feedback"
  on prompt_feedback for select
  using (true);

drop policy if exists "users_can_vote" on prompt_feedback;
create policy "users_can_vote"
  on prompt_feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "users_can_update_own_vote" on prompt_feedback;
create policy "users_can_update_own_vote"
  on prompt_feedback for update
  using (auth.uid() = user_id);


-- 3. Create success rate calculations view
create or replace view prompt_success_rates as
select
  prompt_id,
  count(*) filter (where worked) as worked_count,
  count(*) as total_votes,
  round(100.0 * count(*) filter (where worked) / nullif(count(*), 0)) as success_rate
from prompt_feedback
group by prompt_id;


-- 4. Create unlocks table for paid monetization
create table if not exists unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  prompt_id text references prompts(id) on delete cascade,
  stripe_payment_intent_id text,
  created_at timestamp with time zone default now(),
  unique (user_id, prompt_id)
);

-- Enable RLS on unlocks
alter table unlocks enable row level security;

drop policy if exists "users_see_own_unlocks" on unlocks;
create policy "users_see_own_unlocks"
  on unlocks for select
  using (auth.uid() = user_id);


-- 5. Create secure definer RPC function to access paid prompt contents
create or replace function get_prompt_full_text(p_prompt_id text)
returns text
language plpgsql
security definer
as $$
declare
  result text;
begin
  if exists (
    select 1 from prompts
    where id = p_prompt_id and (price_cents is null or price_cents = 0)
  ) or exists (
    select 1 from unlocks
    where prompt_id = p_prompt_id and user_id = auth.uid()
  ) then
    select full_text into result from prompts where id = p_prompt_id;
    return result;
  else
    return null;
  end if;
end;
$$;

-- Restrict direct SELECT access to prompts.full_text from client-facing roles
revoke select (full_text) on prompts from anon, authenticated;


-- 6. Create business cost calculator configurations table
create table if not exists pricing_config (
  id text primary key,
  category text not null, -- 'domain', 'hosting', 'build', 'ecommerce'
  approach text not null, -- 'diy', 'builder', 'freelancer'
  cost_per_year integer not null,
  cost_one_time integer not null,
  description text
);

-- Enable RLS
alter table pricing_config enable row level security;

drop policy if exists "public_read_pricing_config" on pricing_config;
create policy "public_read_pricing_config"
  on pricing_config for select
  using (true);

-- Seed defaults for pricing config
insert into pricing_config (id, category, approach, cost_per_year, cost_one_time, description)
values
('domain-diy', 'domain', 'diy', 12, 0, 'Domain registration fee'),
('domain-builder', 'domain', 'builder', 12, 0, 'Domain registration fee (often bundled)'),
('domain-freelancer', 'domain', 'freelancer', 12, 0, 'Domain registration fee'),
('hosting-diy', 'hosting', 'diy', 0, 0, 'Free hosting tier (Vercel/Netlify)'),
('hosting-builder', 'hosting', 'builder', 200, 0, 'Website builder subscription fee'),
('hosting-freelancer', 'hosting', 'freelancer', 60, 0, 'Static or basic VPS hosting fee'),
('build-diy', 'build', 'diy', 0, 0, 'Build cost (DIY with AI prompts)'),
('build-builder', 'build', 'builder', 0, 0, 'Build cost (using builder templates)'),
('build-freelancer', 'build', 'freelancer', 0, 900, 'One-time freelance developer builder fee'),
('ecom-diy', 'ecommerce', 'diy', 60, 0, 'E-commerce API or transactional costs'),
('ecom-builder', 'ecommerce', 'builder', 360, 0, 'E-commerce website builder integration tier'),
('ecom-freelancer', 'ecommerce', 'freelancer', 120, 0, 'Merchant account & custom plugins fee')
on conflict (id) do update set
  cost_per_year = excluded.cost_per_year,
  cost_one_time = excluded.cost_one_time,
  description = excluded.description;


-- 7. Create affiliate/referral links table
create table if not exists affiliate_links (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  category text not null check (category in ('domain', 'hosting', 'ai_tool', 'other')),
  url text not null,
  description text,
  sort_order integer default 0,
  active boolean default true
);

-- Enable RLS
alter table affiliate_links enable row level security;

drop policy if exists "public_read_affiliate_links" on affiliate_links;
create policy "public_read_affiliate_links"
  on affiliate_links for select
  using (true);

-- Seed initial referral links
insert into affiliate_links (service_name, category, url, description, sort_order, active)
values
('Namecheap Domains', 'domain', 'https://namecheap.pxf.io/c/placeholder', 'Affordable domains with free lifetime privacy protection.', 10, true),
('Hostinger VPS', 'hosting', 'https://hostinger.com', 'Fast, secure VPS and shared hosting for modern apps.', 20, true),
('Claude AI Pro', 'ai_tool', 'https://claude.ai', 'Anthropic Claude AI chat helper for complex reasoning.', 30, true)
on conflict do nothing;

-- ====================================================
-- Group 4: Expected Output Image URL support
-- ====================================================
alter table prompts
  add column if not exists expected_output_image_url text;
