-- ====================================================
-- APPPROMPTHUB - DATABASE INITIALIZATION SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- ====================================================

-- 1. Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'web-app', 'blog', 'image-gen'
  target_ai TEXT NOT NULL, -- e.g. 'Claude 3.5 Sonnet', 'GPT-4o'
  prompt_text TEXT NOT NULL,
  output_description TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  difficulty TEXT NOT NULL, -- 'Beginner', 'Intermediate', 'Advanced'
  date TEXT NOT NULL -- 'YYYY-MM-DD'
);

-- Enable Row Level Security (RLS)
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (allow everyone to read, allow anonymous updates to views/likes)
CREATE POLICY "Allow public read access on prompts" ON prompts 
  FOR SELECT USING (true);

CREATE POLICY "Allow public update of views and likes" ON prompts 
  FOR UPDATE USING (true) WITH CHECK (true);


-- 2. Create news table
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Model Release', 'Industry News', 'API Updates'
  date TEXT NOT NULL, -- 'YYYY-MM-DD'
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  importance TEXT NOT NULL, -- 'high', 'medium', 'low'
  source_url TEXT
);

-- Enable RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (allow everyone to read)
CREATE POLICY "Allow public read access on news" ON news 
  FOR SELECT USING (true);


-- 3. Create newsletter subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous email inserts (public newsletter signups)
CREATE POLICY "Allow public subscription insertions" ON subscribers 
  FOR INSERT WITH CHECK (true);

-- Create policy to allow reading list (disabled for public, only accessible via service role)
CREATE POLICY "Restrict read to administrators" ON subscribers 
  FOR SELECT USING (false);


-- ====================================================
-- SEED DATA INSERTIONS
-- ====================================================

-- Seed prompts
INSERT INTO prompts (id, slug, title, description, category, target_ai, prompt_text, output_description, views, likes, difficulty, date)
VALUES
('p1', 'saas-analytics-dashboard', 'SaaS Analytics Dashboard Component', 'Generates a fully responsive modern SaaS analytics dashboard with interactive charts, sidebar navigation, dark mode toggle, and dummy metrics cards.', 'web-app', 'Claude 3.5 Sonnet', 'Create a single-page React component for a SaaS Analytics Dashboard. It should use HTML5 semantic tags and be styled using a premium, dark-themed dashboard look.
Include:
1. Sidebar navigation with animated hover effects (Dashboard, Analytics, Customers, Settings).
2. Header with search bar, notifications icon, and user profile dropdown.
3. Top Metrics Row: 4 cards showing Revenue ($48,250, +12%), Active Users (10,240, +5%), Conversion Rate (2.4%, -0.8%), and Bounce Rate (41%, -3%).
4. Main Content Area:
   - A large interactive chart area (mocked with SVG or clean CSS bars) representing monthly revenue.
   - A table showing "Recent Transactions" with status badges (Completed, Pending, Failed).
5. Interactivity: Clicking a metric card highlights it, and hover effects are smooth and responsive. Use pure inline styling or standard CSS classes. No external library dependencies except Lucide icons if needed (or use custom SVG icons).', 'A gorgeous, responsive analytics page featuring clean SVG graphs, glassmorphic layout, metrics toggling, and interactive customer list.', 1420, 382, 'Intermediate', '2026-06-28'),

('p2', 'minimalist-portfolio-blog', 'Minimalist Developer Portfolio Layout', 'A clean, typography-focused personal portfolio and blog layout. Perfect for engineers, designers, and writers.', 'blog', 'v0 by Vercel', 'Create a modern minimalist developer portfolio and blog template.
Design requirements:
- Monochrome palette with one high-contrast accent color (e.g., electric indigo or emerald).
- Hero section: Bold, large typography introducing the developer, with social links and an "Available for hire" green dot indicator.
- Work Section: Minimal list layout with project name, brief description, and year. On hover, the background shifts subtly.
- Blog Section: A feed of 3 articles showing Date, Reading Time, Title, and a short excerpt.
- Responsive design: Single column on mobile, transitioning to a clean grid layout on desktop.
- Ensure all margins, paddings, and font sizes use logical variables for consistency.', 'A content-first personal site layout with elegant hover transitions, optimized reading widths, and clean mobile responsiveness.', 890, 215, 'Beginner', '2026-06-25'),

('p3', 'cinematic-cyberpunk-street', 'Cinematic Cyberpunk Alleyway Shot', 'Highly detailed Midjourney prompt for generating a rain-slicked, neon-lit cyberpunk street with cinematic lighting and deep reflections.', 'image-gen', 'Midjourney v6', 'A cinematic shot of a narrow alleyway in a futuristic cyberpunk city, rain-slicked pavement reflecting glowing neon signs in magenta, cyan, and amber, a single figure in a dark trench coat walking away from the camera, steam rising from street vents, cinematic lighting, shot on 35mm lens, f/1.8, photorealistic, intricate details, volumetric haze, moody color grading --ar 16:9 --style raw --v 6.0', 'A stunning 16:9 cinematic render featuring realistic puddles, volumetric steam, vibrant neon contrast, and professional film grain.', 2310, 674, 'Intermediate', '2026-06-24'),

('p4', 'nextjs-blog-boilerplate', 'Next.js Full-Stack Blog Boilerplate', 'An advanced prompt instructing LLMs to generate a complete Next.js blog template structure with markdown file parsing, static page generation, and SEO optimization.', 'blog', 'ChatGPT / GPT-4o', 'Generate a full-stack Next.js (App Router) blog workspace structure.
Provide code for:
1. ''src/lib/posts.ts'' using ''fs'' and ''gray-matter'' to read and parse local Markdown/MDX files from a ''posts/'' directory, sorting them by date.
2. ''src/app/blog/[slug]/page.tsx'' displaying the parsed blog content, using dynamic route generation (''generateStaticParams'') and generating dynamic SEO metadata (''generateMetadata'').
3. ''src/app/blog/page.tsx'' listing all posts with tags and search filtering.
Make sure to include error handling for missing files, dynamic page cache revalidation headers, and structured JSON-LD schema for SEO optimization.', 'A complete files-and-folders layout script ready to copy-paste, including metadata structures, caching strategies, and gray-matter loaders.', 1105, 289, 'Advanced', '2026-06-22'),

('p5', 'luxury-watch-shot', 'Luxury Chronograph Watch Macro Shot', 'Professional product photography prompt for high-end luxury watch advertising, focusing on macro details, metal textures, and studio lighting.', 'image-gen', 'Stable Diffusion 3', 'Macro studio photography of a luxury mechanical chronograph watch, dark brushed titanium bezel, sapphire crystal glass with subtle blue reflections, complex internal gold gears visible, resting on a dark velvet cushion, water droplets on the surface, professional studio softbox lighting, shallow depth of field, sharp focus on watch hands, gold and obsidian color palette, commercial advertising style, highly detailed, 8k resolution, raytraced shadows', 'An ultra-premium macro product image showing realistic metallic reflections, glass refraction, and sharp mechanical textures.', 1750, 412, 'Advanced', '2026-06-20'),

('p6', 'kanban-board-application', 'Interactive Kanban Board App', 'Generates a complete drag-and-drop Kanban Board application with lists for To Do, In Progress, and Done, custom color tags, and local storage persistence.', 'web-app', 'Claude 3.5 Sonnet', 'Build a complete Kanban Board component in React.
Key Features:
1. 3 Columns: "To Do", "In Progress", "Completed".
2. Ability to add new task cards directly to any column.
3. Card contents: Title, description, tag dropdown (High, Medium, Low priority), and date.
4. Drag-and-drop capability using standard HTML5 drag-and-drop API (no external libraries like react-beautiful-dnd).
5. State management: persist board state to browser localStorage so items are retained on reload.
6. Design: Clean, minimalist dark theme, glowing card borders indicating task priority (red for high, yellow for medium, green for low).', 'A full-functional project planner component utilizing clean HTML5 DnD event listeners, localStorage hooks, and priority tag badges.', 1980, 541, 'Advanced', '2026-06-18'),

('p7', 'auth-forms-validation', 'Secure Login & Registration Forms', 'Prompt for generating highly animated Login and Register toggle forms with real-time Zod validation, password strength indicators, and social login buttons.', 'web-app', 'v0 by Vercel', 'Create a clean React component that handles both Login and Registration forms within a single card layout.
Include:
1. A sliding toggle switch between ''Login'' and ''Sign Up'' with smooth CSS transitions.
2. Login Form: Email input, Password input, ''Forgot password?'' link, and ''Remember me'' checkbox.
3. Registration Form: Name, Email, Password, and Password Confirmation.
4. Client-side input validation with custom error tooltips (or simulate React Zod validator errors).
5. Interactive Password Strength Meter: changes colors (Red/Yellow/Green) and text (Weak/Medium/Strong) dynamically as the user types.
6. Design: Glassmorphic dark card, frosted border, with social login buttons (Google, GitHub) on the bottom.', 'Highly polished sliding form component showing custom feedback states, email syntax checks, and dynamic password complexity gauges.', 1650, 310, 'Intermediate', '2026-06-16'),

('p8', 'landing-page-copywriting', 'High-Converting SaaS Landing Page Copy', 'Expert copywriting framework prompt to generate full-page copy structure, hooks, testimonials, pricing plans, and CTAs for a software startup.', 'blog', 'ChatGPT / GPT-4o', 'Act as a world-class copywriter specializing in conversion rate optimization (CRO) for B2B SaaS companies.
Generate the complete page copy for a new AI-powered email productivity application called "FlowMail".
Provide copywriting for:
1. Above-the-fold Hero Section: Headline, Subheadline, Primary CTA button text, and social proof helper text.
2. Problem vs. Solution Section: 3 key pain points of email overload and how FlowMail solves them.
3. Features Section: 3 main features with benefits-focused headings (not just technical descriptions).
4. Social Proof Section: 2 fake but highly realistic customer testimonials from CTOs.
5. Interactive Pricing Tier Matrix: Hobbyist ($0), Pro ($19/mo), Enterprise ($99/mo) detailing features.
6. FAQ Section: 4 common onboarding questions answered with objection-handling copy.
Ensure the tone is professional yet punchy and focuses heavily on user benefits.', 'Curated sales copy blueprint split into logical sections, highlighting cognitive hooks, conversion-focused headlines, and trust factors.', 1210, 298, 'Intermediate', '2026-06-15'),

('p9', 'isometric-floating-island', 'Isometric Fantasy Floating Island', 'Midjourney prompt for generating a detailed 3D isometric floating island with a small wooden cabin, glowing crystals, waterfall, and miniature trees.', 'image-gen', 'Midjourney v6', 'An isometric 3D render of a small floating grassy island in a sky void, miniature cozy log cabin with warm light shining from windows, tiny waterfall pouring over the edge into clouds, ancient glowing purple crystals growing out of rocks, small cherry blossom tree in bloom shedding petals, 3d game asset style, blender render, octane render, soft ambient lighting, pastel colors, clean white background --ar 1:1 --v 6.0', 'High-quality isometric game asset rendering displaying clean textures, ambient occlusion shadows, and glowing purple lighting accents.', 2940, 812, 'Intermediate', '2026-06-12'),

('p10', 'settings-page-component', 'Comprehensive User Profile Settings Page', 'Generates a full profile management interface with avatar upload crop simulator, notification toggle switches, security keys registry, and billing details.', 'web-app', 'Claude 3.5 Sonnet', 'Create a clean React Settings Component with a tabbed sub-navigation layout:
Include:
1. Tab 1: Profile (Name, avatar upload image placeholder with hover edit icon, email, biography textbox, public profile visibility toggle).
2. Tab 2: Notifications (Grid of toggle switches for Email alerts, Push alerts, Newsletter, Weekly Digests).
3. Tab 3: Security (Change password fields, active session devices list with IP address and ''Revoke'' button, 2FA toggle).
4. Tab 4: Billing (Plan tier description, card information card display showing last 4 digits, billing history invoices list).
5. UI Layout: Sidebar menu mapping settings tabs on the left, active forms block on the right. Modern dark-theme UI with neat responsive grids.', 'Multi-form settings dashboard utilizing clean state-management tabs, hover avatar upload edit indicators, and toggle inputs.', 1380, 367, 'Intermediate', '2026-06-10'),

('p11', 'seo-blog-optimizer', 'SEO Blog Outline & Keyword Strategist', 'A prompt that instructs GPT models to analyze a topic, generate a structural semantic H1-H3 outline, semantic keyword density targets, and target search intent.', 'blog', 'ChatGPT / GPT-4o', 'You are an SEO Content Director. I will give you a core target keyword. You must generate:
1. A semantic H1, H2, and H3 structure for a 2,000-word article optimized to rank on page 1 of Google.
2. A list of 15 LSI (Latent Semantic Indexing) keywords to distribute naturally throughout the headers and body.
3. Search Intent Analysis: Explain whether this topic matches informational, transactional, or commercial intent, and how the copy should adapt.
4. Schema Markup Suggestion: Provide a JSON-LD FAQ Schema layout to embed on the page based on the questions resolved in the outline.
Core Keyword to Analyze: "best Next.js hosting solutions for production apps"', 'Complete SEO content brief containing semantic structure hierarchy, LSI distributions, schema layouts, and search intent guidelines.', 1540, 410, 'Advanced', '2026-06-08'),

('p12', 'minimal-line-art-logo', 'Minimalist Vector Brand Logo Layout', 'Vector logo prompt for generating clean geometric line-art brand logos, focusing on symmetry, flat designs, and high-contrast color palettes.', 'image-gen', 'Stable Diffusion 3', 'Flat minimalist vector logo, a clean geometric line art icon representing a stylized origami phoenix rising, symmetrical lines, black background, high contrast, clean golden lines, vector graphic style, professional branding logo, flat icon design, simple outline shape --ar 1:1', 'Stunning brand logo design showcasing flat golden line geometry, clean symmetrical origami patterns, and a solid black background.', 1890, 489, 'Beginner', '2026-06-05'),

('p13', 'stripe-checkout-integration', 'Stripe Subscription Checkout Handler', 'Prompt for generating a Node.js Express backend API router setting up Stripe subscription checkout sessions, handling webhook verification, and updating user database records.', 'web-app', 'ChatGPT / GPT-4o', 'Generate a Node.js router using Express and stripe SDK.
Include endpoints for:
1. ''/create-checkout-session'': creates a Stripe subscription checkout session for a specific price ID. Handles passing customer email, metadata, and success/cancel redirection URLs.
2. ''/webhook'': handles the raw post requests from Stripe webhooks. Must securely verify the Stripe signature key (''stripe-signature'').
3. Handle webhook events:
   - ''checkout.session.completed'': parse customer information and log subscription ID.
   - ''customer.subscription.deleted'': mark the user''s active database subscription as cancelled.
Include proper error catching, raw request parser setup for the webhook endpoint, and helper DB transaction logs placeholders.', 'Production-ready backend router setup showcasing secure Stripe webhook signatures verification, Express middleware parsing, and route mappings.', 1470, 395, 'Advanced', '2026-06-02'),

('p14', 'cold-email-sequence', 'B2B Cold Email Outreach Sequence', 'Generates a 3-step follow-up email drip sequence for sales outreach, utilizing personalization hooks, benefits-first structures, and strong soft CTAs.', 'blog', 'ChatGPT / GPT-4o', 'Create a 3-step B2B cold email sequence targeting Marketing Directors for a new digital analytics platform called ''ScopeMetric'' (which speeds up campaign reporting by 80%).
Requirements:
1. Email 1 (The Hook): Subject line options (under 6 words), short introductory sentence referencing a common industry pain point, ScopeMetric value prop, and a low-friction soft CTA (e.g. ''Opposed to a quick email overview?''). Max 150 words.
2. Email 2 (Case Study / Social Proof): Sent 3 days later. Simple reply thread format. Subject line: Re: ScopeMetric. Focus on how a similar marketing team reduced hours on reports, referencing a specific metric.
3. Email 3 (The Break-up): Sent 7 days later. A short, professional message giving them an easy out while leaving the door open for future collaboration.
Tone: Conversational, helpful, absolutely NO corporate jargon or pushy sales pitches.', 'Complete outreach blueprint containing subject alternatives, low-friction callback CTAs, thread follow-up formatting, and soft breakups.', 980, 212, 'Beginner', '2026-05-30'),

('p15', 'retro-sci-fi-poster', 'Retro Sci-Fi Vintage Book Cover', 'Cinematic Midjourney prompt for generating a 1970s sci-fi paperback book cover illustration, featuring space explorers, cosmic nebulas, and warm retro colors.', 'image-gen', 'Midjourney v6', 'A retro sci-fi book cover illustration in the style of 1970s science fiction art, a giant futuristic explorer dome on a desert planet, two astronauts standing on a ridge looking up, massive rings of a gas giant planet in the sky, warm color palette of orange, ochre, mustard, and deep cyan, retro-futuristic aesthetic, hand-drawn detailing, grain texture, pulp paperback cover art style --ar 2:3 --v 6.0', 'Stunning vintage pulp cover design containing textured dust grains, warm planetary gradients, hand-painted details, and classic sci-fi scale.', 2190, 604, 'Intermediate', '2026-05-25');

-- Seed news
INSERT INTO news (id, slug, title, category, date, summary, content, importance, source_url)
VALUES
('n1', 'gemini-25-pro-global-launch', 'Gemini 2.5 Pro Launches Globally with Real-Time Video Reasoning', 'Model Release', '2026-06-25', 'Google has announced the general availability of Gemini 2.5 Pro, featuring live audio-video reasoning capabilities, native 2M token context window, and significantly reduced latency.', 'Gemini 2.5 Pro marks a massive step forward in multimodal understanding. Users can now stream live video directly to the model API and receive real-time commentary, object detection, and logical analysis. In addition, API pricing has been lowered by 30% for input tokens, making it highly competitive for enterprise deployments.', 'high', 'https://deepmind.google/technologies/gemini/'),

('n2', 'claude-35-sonnet-upgrade', 'Anthropic Upgrades Claude 3.5 Sonnet with 500k Context & Computer Use 2.0', 'Model Release', '2026-06-18', 'Anthropic rolls out an updated version of Claude 3.5 Sonnet, doubling the token limits and releasing major improvements to its native desktop automation tools.', 'The upgraded Claude 3.5 Sonnet features a 500,000-token input window, allowing developers to upload entire small codebases or extensive PDF books in a single prompt. Furthermore, the ''Computer Use'' API receives a major performance overhaul, reducing mouse-clicking errors by 45% and enabling smoother browser-based testing automation.', 'high', 'https://www.anthropic.com/claude'),

('n3', 'openai-gpt-4o-pricing-cut', 'OpenAI Announces 50% Price Reduction on GPT-4o API Calls', 'API Updates', '2026-06-12', 'In a bid to capture high-throughput agent developer markets, OpenAI cuts prices for GPT-4o input and output tokens by half, alongside introducing free fine-tuning.', 'This aggressive price cut makes GPT-4o one of the most cost-effective intelligence-per-dollar options available. Input tokens are now priced at $2.50 per million, and output tokens at $5.00 per million. OpenAI also launched a free fine-tuning cohort running until the end of the year, giving startups room to build highly specialized agents.', 'medium', 'https://openai.com/api/'),

('n4', 'sora-video-api-general-availability', 'Sora Video Generation API Opened to All Developers', 'API Updates', '2026-06-05', 'OpenAI has officially launched public API access to its Sora video generation model, allowing automated creation of high-definition 1080p video clips via simple text prompts.', 'After months of closed testing, Sora is now available to all tier-4 developers. The API supports generating up to 15 seconds of high-fidelity 60fps video, dynamic camera controls, and aspect ratio configuration. Pricing starts at $0.15 per generated second, opening new avenues for video marketing and content automation.', 'high', 'https://openai.com/sora');
