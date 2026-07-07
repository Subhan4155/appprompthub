import { PromptItem, NewsItem } from "../types";

export const mockPrompts: PromptItem[] = [
  {
    id: "p1",
    slug: "saas-analytics-dashboard",
    title: "SaaS Analytics Dashboard Component",
    description: "Generates a fully responsive modern SaaS analytics dashboard with interactive charts, sidebar navigation, dark mode toggle, and dummy metrics cards.",
    category: "web-app",
    targetAI: "Claude 3.5 Sonnet",
    promptText: `Create a single-page React component for a SaaS Analytics Dashboard. It should use HTML5 semantic tags and be styled using a premium, dark-themed dashboard look.
Include:
1. Sidebar navigation with animated hover effects (Dashboard, Analytics, Customers, Settings).
2. Header with search bar, notifications icon, and user profile dropdown.
3. Top Metrics Row: 4 cards showing Revenue ($48,250, +12%), Active Users (10,240, +5%), Conversion Rate (2.4%, -0.8%), and Bounce Rate (41%, -3%).
4. Main Content Area:
   - A large interactive chart area (mocked with SVG or clean CSS bars) representing monthly revenue.
   - A table showing "Recent Transactions" with status badges (Completed, Pending, Failed).
5. Interactivity: Clicking a metric card highlights it, and hover effects are smooth and responsive. Use pure inline styling or standard CSS classes. No external library dependencies except Lucide icons if needed (or use custom SVG icons).`,
    outputDescription: "A gorgeous, responsive analytics page featuring clean SVG graphs, glassmorphic layout, metrics toggling, and interactive customer list.",
    views: 1420,
    likes: 382,
    difficulty: "Intermediate",
    date: "2026-06-28",
    imageUrl: "/previews/saas-dashboard.jpg",
    expectedOutputImageUrl: "/previews/saas-dashboard.jpg",
    priceCents: 499,
    previewText: "Create a single-page React component for a SaaS Analytics Dashboard. It should use HTML5 semantic tags and be styled using a premium, dark-themed dashboard look...",
    fullText: `Create a single-page React component for a SaaS Analytics Dashboard. It should use HTML5 semantic tags and be styled using a premium, dark-themed dashboard look.
Include:
1. Sidebar navigation with animated hover effects (Dashboard, Analytics, Customers, Settings).
2. Header with search bar, notifications icon, and user profile dropdown.
3. Top Metrics Row: 4 cards showing Revenue ($48,250, +12%), Active Users (10,240, +5%), Conversion Rate (2.4%, -0.8%), and Bounce Rate (41%, -3%).
4. Main Content Area:
   - A large interactive chart area (mocked with SVG or clean CSS bars) representing monthly revenue.
   - A table showing "Recent Transactions" with status badges (Completed, Pending, Failed).
5. Interactivity: Clicking a metric card highlights it, and hover effects are smooth and responsive. Use pure inline styling or standard CSS classes. No external library dependencies except Lucide icons if needed (or use custom SVG icons).`
  },
  {
    id: "p2",
    slug: "minimalist-portfolio-blog",
    title: "Minimalist Developer Portfolio Layout",
    description: "A clean, typography-focused personal portfolio and blog layout. Perfect for engineers, designers, and writers.",
    category: "blog",
    targetAI: "v0 by Vercel",
    promptText: `Create a modern minimalist developer portfolio and blog template.
Design requirements:
- Monochrome palette with one high-contrast accent color (e.g., electric indigo or emerald).
- Hero section: Bold, large typography introducing the developer, with social links and an "Available for hire" green dot indicator.
- Work Section: Minimal list layout with project name, brief description, and year. On hover, the background shifts subtly.
- Blog Section: A feed of 3 articles showing Date, Reading Time, Title, and a short excerpt.
- Responsive design: Single column on mobile, transitioning to a clean grid layout on desktop.
- Ensure all margins, paddings, and font sizes use logical variables for consistency.`,
    outputDescription: "A content-first personal site layout with elegant hover transitions, optimized reading widths, and clean mobile responsiveness.",
    views: 890,
    likes: 215,
    difficulty: "Beginner",
    date: "2026-06-25",
    imageUrl: "/previews/minimalist-portfolio.jpg"
  },
  {
    id: "p3",
    slug: "cinematic-cyberpunk-street",
    title: "Cinematic Cyberpunk Alleyway Shot",
    description: "Highly detailed Midjourney prompt for generating a rain-slicked, neon-lit cyberpunk street with cinematic lighting and deep reflections.",
    category: "image-gen",
    targetAI: "Midjourney v6",
    promptText: "A cinematic shot of a narrow alleyway in a futuristic cyberpunk city, rain-slicked pavement reflecting glowing neon signs in magenta, cyan, and amber, a single figure in a dark trench coat walking away from the camera, steam rising from street vents, cinematic lighting, shot on 35mm lens, f/1.8, photorealistic, intricate details, volumetric haze, moody color grading --ar 16:9 --style raw --v 6.0",
    outputDescription: "A stunning 16:9 cinematic render featuring realistic puddles, volumetric steam, vibrant neon contrast, and professional film grain.",
    views: 2310,
    likes: 674,
    difficulty: "Intermediate",
    date: "2026-06-24",
    imageUrl: "/previews/cyberpunk-street.jpg"
  },
  {
    id: "p4",
    slug: "nextjs-blog-boilerplate",
    title: "Next.js Full-Stack Blog Boilerplate",
    description: "An advanced prompt instructing LLMs to generate a complete Next.js blog template structure with markdown file parsing, static page generation, and SEO optimization.",
    category: "blog",
    targetAI: "ChatGPT / GPT-4o",
    promptText: `Generate a full-stack Next.js (App Router) blog workspace structure.
Provide code for:
1. 'src/lib/posts.ts' using 'fs' and 'gray-matter' to read and parse local Markdown/MDX files from a 'posts/' directory, sorting them by date.
2. 'src/app/blog/[slug]/page.tsx' displaying the parsed blog content, using dynamic route generation ('generateStaticParams') and generating dynamic SEO metadata ('generateMetadata').
3. 'src/app/blog/page.tsx' listing all posts with tags and search filtering.
Make sure to include error handling for missing files, dynamic page cache revalidation headers, and structured JSON-LD schema for SEO optimization.`,
    outputDescription: "A complete files-and-folders layout script ready to copy-paste, including metadata structures, caching strategies, and gray-matter loaders.",
    views: 1105,
    likes: 289,
    difficulty: "Advanced",
    date: "2026-06-22",
    imageUrl: "/previews/nextjs-blog.jpg"
  },
  {
    id: "p5",
    slug: "luxury-watch-shot",
    title: "Luxury Chronograph Watch Macro Shot",
    description: "Professional product photography prompt for high-end luxury watch advertising, focusing on macro details, metal textures, and studio lighting.",
    category: "image-gen",
    targetAI: "Stable Diffusion 3",
    promptText: "Macro studio photography of a luxury mechanical chronograph watch, dark brushed titanium bezel, sapphire crystal glass with subtle blue reflections, complex internal gold gears visible, resting on a dark velvet cushion, water droplets on the surface, professional studio softbox lighting, shallow depth of field, sharp focus on watch hands, gold and obsidian color palette, commercial advertising style, highly detailed, 8k resolution, raytraced shadows",
    outputDescription: "An ultra-premium macro product image showing realistic metallic reflections, glass refraction, and sharp mechanical textures.",
    views: 1750,
    likes: 412,
    difficulty: "Advanced",
    date: "2026-06-20",
    imageUrl: "/previews/luxury-watch.jpg"
  },
  {
    id: "p6",
    slug: "kanban-board-application",
    title: "Interactive Kanban Board App",
    description: "Generates a complete drag-and-drop Kanban Board application with lists for To Do, In Progress, and Done, custom color tags, and local storage persistence.",
    category: "web-app",
    targetAI: "Claude 3.5 Sonnet",
    promptText: `Build a complete Kanban Board component in React.
Key Features:
1. 3 Columns: "To Do", "In Progress", "Completed".
2. Ability to add new task cards directly to any column.
3. Card contents: Title, description, tag dropdown (High, Medium, Low priority), and date.
4. Drag-and-drop capability using standard HTML5 drag-and-drop API (no external libraries like react-beautiful-dnd).
5. State management: persist board state to browser localStorage so items are retained on reload.
6. Design: Clean, minimalist dark theme, glowing card borders indicating task priority (red for high, yellow for medium, green for low).`,
    outputDescription: "A full-functional project planner component utilizing clean HTML5 DnD event listeners, localStorage hooks, and priority tag badges.",
    views: 1980,
    likes: 541,
    difficulty: "Advanced",
    date: "2026-06-18"
  },
  {
    id: "p7",
    slug: "auth-forms-validation",
    title: "Secure Login & Registration Forms",
    description: "Prompt for generating highly animated Login and Register toggle forms with real-time Zod validation, password strength indicators, and social login buttons.",
    category: "web-app",
    targetAI: "v0 by Vercel",
    promptText: `Create a clean React component that handles both Login and Registration forms within a single card layout.
Include:
1. A sliding toggle switch between 'Login' and 'Sign Up' with smooth CSS transitions.
2. Login Form: Email input, Password input, 'Forgot password?' link, and 'Remember me' checkbox.
3. Registration Form: Name, Email, Password, and Password Confirmation.
4. Client-side input validation with custom error tooltips (or simulate React Zod validator errors).
5. Interactive Password Strength Meter: changes colors (Red/Yellow/Green) and text (Weak/Medium/Strong) dynamically as the user types.
6. Design: Glassmorphic dark card, frosted border, with social login buttons (Google, GitHub) on the bottom.`,
    outputDescription: "Highly polished sliding form component showing custom feedback states, email syntax checks, and dynamic password complexity gauges.",
    views: 1650,
    likes: 310,
    difficulty: "Intermediate",
    date: "2026-06-16"
  },
  {
    id: "p8",
    slug: "landing-page-copywriting",
    title: "High-Converting SaaS Landing Page Copy",
    description: "Expert copywriting framework prompt to generate full-page copy structure, hooks, testimonials, pricing plans, and CTAs for a software startup.",
    category: "blog",
    targetAI: "ChatGPT / GPT-4o",
    promptText: `Act as a world-class copywriter specializing in conversion rate optimization (CRO) for B2B SaaS companies.
Generate the complete page copy for a new AI-powered email productivity application called "FlowMail".
Provide copywriting for:
1. Above-the-fold Hero Section: Headline, Subheadline, Primary CTA button text, and social proof helper text.
2. Problem vs. Solution Section: 3 key pain points of email overload and how FlowMail solves them.
3. Features Section: 3 main features with benefits-focused headings (not just technical descriptions).
4. Social Proof Section: 2 fake but highly realistic customer testimonials from CTOs.
5. Interactive Pricing Tier Matrix: Hobbyist ($0), Pro ($19/mo), Enterprise ($99/mo) detailing features.
6. FAQ Section: 4 common onboarding questions answered with objection-handling copy.
Ensure the tone is professional yet punchy and focuses heavily on user benefits.`,
    outputDescription: "Curated sales copy blueprint split into logical sections, highlighting cognitive hooks, conversion-focused headlines, and trust factors.",
    views: 1210,
    likes: 298,
    difficulty: "Intermediate",
    date: "2026-06-15"
  },
  {
    id: "p9",
    slug: "isometric-floating-island",
    title: "Isometric Fantasy Floating Island",
    description: "Midjourney prompt for generating a detailed 3D isometric floating island with a small wooden cabin, glowing crystals, waterfall, and miniature trees.",
    category: "image-gen",
    targetAI: "Midjourney v6",
    promptText: "An isometric 3D render of a small floating grassy island in a sky void, miniature cozy log cabin with warm light shining from windows, tiny waterfall pouring over the edge into clouds, ancient glowing purple crystals growing out of rocks, small cherry blossom tree in bloom shedding petals, 3d game asset style, blender render, octane render, soft ambient lighting, pastel colors, clean white background --ar 1:1 --v 6.0",
    outputDescription: "High-quality isometric game asset rendering displaying clean textures, ambient occlusion shadows, and glowing purple lighting accents.",
    views: 2940,
    likes: 812,
    difficulty: "Intermediate",
    date: "2026-06-12"
  },
  {
    id: "p10",
    slug: "settings-page-component",
    title: "Comprehensive User Profile Settings Page",
    description: "Generates a full profile management interface with avatar upload crop simulator, notification toggle switches, security keys registry, and billing details.",
    category: "web-app",
    targetAI: "Claude 3.5 Sonnet",
    promptText: `Create a clean React Settings Component with a tabbed sub-navigation layout:
Include:
1. Tab 1: Profile (Name, avatar upload image placeholder with hover edit icon, email, biography textbox, public profile visibility toggle).
2. Tab 2: Notifications (Grid of toggle switches for Email alerts, Push alerts, Newsletter, Weekly Digests).
3. Tab 3: Security (Change password fields, active session devices list with IP address and 'Revoke' button, 2FA toggle).
4. Tab 4: Billing (Plan tier description, card information card display showing last 4 digits, billing history invoices list).
5. UI Layout: Sidebar menu mapping settings tabs on the left, active forms block on the right. Modern dark-theme UI with neat responsive grids.`,
    outputDescription: "Multi-form settings dashboard utilizing clean state-management tabs, hover avatar upload edit indicators, and toggle inputs.",
    views: 1380,
    likes: 367,
    difficulty: "Intermediate",
    date: "2026-06-10"
  },
  {
    id: "p11",
    slug: "seo-blog-optimizer",
    title: "SEO Blog Outline & Keyword Strategist",
    description: "A prompt that instructs GPT models to analyze a topic, generate a structural semantic H1-H3 outline, semantic keyword density targets, and target search intent.",
    category: "blog",
    targetAI: "ChatGPT / GPT-4o",
    promptText: `You are an SEO Content Director. I will give you a core target keyword. You must generate:
1. A semantic H1, H2, and H3 structure for a 2,000-word article optimized to rank on page 1 of Google.
2. A list of 15 LSI (Latent Semantic Indexing) keywords to distribute naturally throughout the headers and body.
3. Search Intent Analysis: Explain whether this topic matches informational, transactional, or commercial intent, and how the copy should adapt.
4. Schema Markup Suggestion: Provide a JSON-LD FAQ Schema layout to embed on the page based on the questions resolved in the outline.
Core Keyword to Analyze: "best Next.js hosting solutions for production apps"`,
    outputDescription: "Complete SEO content brief containing semantic structure hierarchy, LSI distributions, schema layouts, and search intent guidelines.",
    views: 1540,
    likes: 410,
    difficulty: "Advanced",
    date: "2026-06-08"
  },
  {
    id: "p12",
    slug: "minimal-line-art-logo",
    title: "Minimalist Vector Brand Logo Layout",
    description: "Vector logo prompt for generating clean geometric line-art brand logos, focusing on symmetry, flat designs, and high-contrast color palettes.",
    category: "image-gen",
    targetAI: "Stable Diffusion 3",
    promptText: "Flat minimalist vector logo, a clean geometric line art icon representing a stylized origami phoenix rising, symmetrical lines, black background, high contrast, clean golden lines, vector graphic style, professional branding logo, flat icon design, simple outline shape --ar 1:1",
    outputDescription: "Stunning brand logo design showcasing flat golden line geometry, clean symmetrical origami patterns, and a solid black background.",
    views: 1890,
    likes: 489,
    difficulty: "Beginner",
    date: "2026-06-05"
  },
  {
    id: "p13",
    slug: "stripe-checkout-integration",
    title: "Stripe Subscription Checkout Handler",
    description: "Prompt for generating a Node.js Express backend API router setting up Stripe subscription checkout sessions, handling webhook verification, and updating user database records.",
    category: "web-app",
    targetAI: "ChatGPT / GPT-4o",
    promptText: `Generate a Node.js router using Express and stripe SDK.
Include endpoints for:
1. '/create-checkout-session': creates a Stripe subscription checkout session for a specific price ID. Handles passing customer email, metadata, and success/cancel redirection URLs.
2. '/webhook': handles the raw post requests from Stripe webhooks. Must securely verify the Stripe signature key ('stripe-signature').
3. Handle webhook events:
   - 'checkout.session.completed': parse customer information and log subscription ID.
   - 'customer.subscription.deleted': mark the user's active database subscription as cancelled.
Include proper error catching, raw request parser setup for the webhook endpoint, and helper DB transaction logs placeholders.`,
    outputDescription: "Production-ready backend router setup showcasing secure Stripe webhook signatures verification, Express middleware parsing, and route mappings.",
    views: 1470,
    likes: 395,
    difficulty: "Advanced",
    date: "2026-06-02"
  },
  {
    id: "p14",
    slug: "cold-email-sequence",
    title: "B2B Cold Email Outreach Sequence",
    description: "Generates a 3-step follow-up email drip sequence for sales outreach, utilizing personalization hooks, benefits-first structures, and strong soft CTAs.",
    category: "blog",
    targetAI: "ChatGPT / GPT-4o",
    promptText: `Create a 3-step B2B cold email sequence targeting Marketing Directors for a new digital analytics platform called 'ScopeMetric' (which speeds up campaign reporting by 80%).
Requirements:
1. Email 1 (The Hook): Subject line options (under 6 words), short introductory sentence referencing a common industry pain point, ScopeMetric value prop, and a low-friction soft CTA (e.g. 'Opposed to a quick email overview?'). Max 150 words.
2. Email 2 (Case Study / Social Proof): Sent 3 days later. Simple reply thread format. Subject line: Re: ScopeMetric. Focus on how a similar marketing team reduced hours on reports, referencing a specific metric.
3. Email 3 (The Break-up): Sent 7 days later. A short, professional message giving them an easy out while leaving the door open for future collaboration.
Tone: Conversational, helpful, absolutely NO corporate jargon or pushy sales pitches.`,
    outputDescription: "Complete outreach blueprint containing subject alternatives, low-friction callback CTAs, thread follow-up formatting, and soft breakups.",
    views: 980,
    likes: 212,
    difficulty: "Beginner",
    date: "2026-05-30"
  },
  {
    id: "p15",
    slug: "retro-sci-fi-poster",
    title: "Retro Sci-Fi Vintage Book Cover",
    description: "Cinematic Midjourney prompt for generating a 1970s sci-fi paperback book cover illustration, featuring space explorers, cosmic nebulas, and warm retro colors.",
    category: "image-gen",
    targetAI: "Midjourney v6",
    promptText: "A retro sci-fi book cover illustration in the style of 1970s science fiction art, a giant futuristic explorer dome on a desert planet, two astronauts standing on a ridge looking up, massive rings of a gas giant planet in the sky, warm color palette of orange, ochre, mustard, and deep cyan, retro-futuristic aesthetic, hand-drawn detailing, grain texture, pulp paperback cover art style --ar 2:3 --v 6.0",
    outputDescription: "Stunning vintage pulp cover design containing textured dust grains, warm planetary gradients, hand-painted details, and classic sci-fi scale.",
    views: 2190,
    likes: 604,
    difficulty: "Intermediate",
    date: "2026-05-25"
  }
];

export const mockNews: NewsItem[] = [
  {
    id: "n1",
    slug: "gemini-25-pro-global-launch",
    title: "Gemini 2.5 Pro Launches Globally with Real-Time Video Reasoning",
    category: "Model Release",
    date: "2026-06-25",
    summary: "Google has announced the general availability of Gemini 2.5 Pro, featuring live audio-video reasoning capabilities, native 2M token context window, and significantly reduced latency.",
    content: "Gemini 2.5 Pro marks a massive step forward in multimodal understanding. Users can now stream live video directly to the model API and receive real-time commentary, object detection, and logical analysis. In addition, API pricing has been lowered by 30% for input tokens, making it highly competitive for enterprise deployments.",
    importance: "high",
    sourceUrl: "https://deepmind.google/technologies/gemini/"
  },
  {
    id: "n2",
    slug: "claude-35-sonnet-upgrade",
    title: "Anthropic Upgrades Claude 3.5 Sonnet with 500k Context & Computer Use 2.0",
    category: "Model Release",
    date: "2026-06-18",
    summary: "Anthropic rolls out an updated version of Claude 3.5 Sonnet, doubling the token limits and releasing major improvements to its native desktop automation tools.",
    content: "The upgraded Claude 3.5 Sonnet features a 500,000-token input window, allowing developers to upload entire small codebases or extensive PDF books in a single prompt. Furthermore, the 'Computer Use' API receives a major performance overhaul, reducing mouse-clicking errors by 45% and enabling smoother browser-based testing automation.",
    importance: "high",
    sourceUrl: "https://www.anthropic.com/claude"
  },
  {
    id: "n3",
    slug: "openai-gpt-4o-pricing-cut",
    title: "OpenAI Announces 50% Price Reduction on GPT-4o API Calls",
    category: "API Updates",
    date: "2026-06-12",
    summary: "In a bid to capture high-throughput agent developer markets, OpenAI cuts prices for GPT-4o input and output tokens by half, alongside introducing free fine-tuning.",
    content: "This aggressive price cut makes GPT-4o one of the most cost-effective intelligence-per-dollar options available. Input tokens are now priced at $2.50 per million, and output tokens at $5.00 per million. OpenAI also launched a free fine-tuning cohort running until the end of the year, giving startups room to build highly specialized agents.",
    importance: "medium",
    sourceUrl: "https://openai.com/api/"
  },
  {
    id: "n4",
    slug: "sora-video-api-general-availability",
    title: "Sora Video Generation API Opened to All Developers",
    category: "API Updates",
    date: "2026-06-05",
    summary: "OpenAI has officially launched public API access to its Sora video generation model, allowing automated creation of high-definition 1080p video clips via simple text prompts.",
    content: "After months of closed testing, Sora is now available to all tier-4 developers. The API supports generating up to 15 seconds of high-fidelity 60fps video, dynamic camera controls, and aspect ratio configuration. Pricing starts at $0.15 per generated second, opening new avenues for video marketing and content automation.",
    importance: "high",
    sourceUrl: "https://openai.com/sora"
  }
];
