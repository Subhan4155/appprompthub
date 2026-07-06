# Frontend Features Progress

Process: one item at a time; typecheck + lint + build after each; check off with a one-line note; stop & summarize after each group and wait for approval before the next. **Before building in a group, verify what already exists; flag missing backend deps.**

> ⚠️ **Audit result (see Group 1.1): the current app is much smaller than this plan assumes.**
> Real routes: `/` (HomeClient), `/explore` (ExploreClient), `/admin` (AdminClient). "Custom Builder", "AI News", "Workspace" are **tabs inside HomeClient**, not pages. The following referenced by the plan **do not exist**: Calculator page, Resources page, Partners page/directory, prompt-detail page, worked/failed voting, "Submit Prompt", and any of these DB columns/tables: `price_cents`, `preview_text`, `full_text`, `expected_output_image_url`, `is_verified`, `affiliate_category`, `affiliate_links`, `unlocks`, `partners`, `partner_reviews`, plus all Stripe code. Groups 3–8 are therefore **greenfield backend + frontend**, not "wire up existing backend."

---

## Group 1 — Unify navigation
- [x] 1.1 Audit every page's header markup. **Done.** Findings below.
- [x] 1.2 Built `src/components/SiteHeader.tsx` — one nav list, one auth display, one logo. `public` variant (Explore link + Custom Builder/AI News/Workspace) and `admin` variant (branding + View Front Website + Log Out). Added `.nav-link`/`.nav-link--active` rules to `globals.css:166` so `<a>` and `<button>` items render identically.
- [x] 1.3 Replaced all three headers with `<SiteHeader>`: HomeClient (`onSelectTab` drives in-page tabs, `activeNav` highlights active tab), ExploreClient (`wide` + `activeNav="explore"`, link-based nav), AdminClient (`variant="admin"`). Removed the now-unused `Link` import from AdminClient. Nav labels/padding/logo are now identical across pages.
- [~] 1.4 Rename "Resources" → "Partners" / de-dupe Calculator+Resources nav. **Skipped — not actionable:** no Resources or Calculator pages/nav-sets exist to rename or de-duplicate. (Default chosen since the question went unanswered.)
- [~] 1.5 Add "Partners" directory nav item. **Deferred — would be a dead link:** `/partners` is Group 8 (unbuilt). Will add to `SiteHeader`'s nav list when Group 8 creates the route.

### 1.1 Audit findings — three distinct header implementations
1. **HomeClient.tsx** (`src/components/HomeClient.tsx:777-816`): logo (span, not link); nav = `<Link href="/explore">Explore</Link>`, `<button>Custom Builder</button>` (sets tab state + `window.scrollTo`), `<button>AI News</button>` (tab state), then auth: if user → `My Workspace` button (tab state) + `Sign Out` button; else → `Sign In / Sign Up` button (tab state). Nav is **tab-state-driven**.
2. **ExploreClient.tsx** (`src/components/ExploreClient.tsx:396-428`): logo wrapped in `<Link href="/">`; nav = `<Link href="/explore">`, `<Link href="/?tab=builder">Custom Builder</Link>`, `<Link href="/?tab=news">AI News</Link>`, then auth: if user → `<Link href="/?tab=workspace">My Workspace</Link>` + `Sign Out` button; else → `<Link href="/?tab=workspace">Sign In / Sign Up</Link>`. Nav is **link/query-driven** (different mechanism from Home for the same labels).
3. **AdminClient.tsx** (`src/app/admin/AdminClient.tsx`, header ~lines 470-483): logo + `Admin` pill; nav = `<Link href="/">View Front Website</Link>` + `Log Out` button. Minimal, no site nav.
Footers in Home/Explore also duplicate a mini nav list (Explore/Builder/News) — relevant if we centralize nav.
No Calculator/Resources/Partners headers exist to reconcile.

## Group 2 — Prompt detail as a dedicated page
- [x] 2.1 Created dynamic route `src/app/prompt/[slug]/page.tsx` with static paths and dynamic metadata generation.
- [x] 2.2 Moved description, sandbox inputs, compilation logic to `src/components/PromptDetailClient.tsx` and created a brand new Worked/Failed database voting schema in `supabase_voting.sql` and client interface.
- [x] 2.3 Swapped standard modal-opening buttons in `src/components/ExploreClient.tsx` and `src/components/HomeClient.tsx` with standard routing links to the new detail page.

## Group 3 — Pay-per-unlock UI ⚠️ greenfield backend (no Stripe, no columns/tables)
- [x] 3.1 Created `supabase_monetization.sql` migration, updated `src/types.ts` and prompt `p1` inside `src/data/mockData.ts`.
- [x] 3.2 Implemented locked preview container with blur filters and guest email input/checkout trigger inside `src/components/PromptDetailClient.tsx` and custom checkout sandbox UI.
- [x] 3.3 Built Stripe session creator and simulated fallback checkout router at `src/app/api/checkout/route.ts`.
- [x] 3.4 Built Stripe webhook completion handler at `src/app/api/webhook/route.ts` and developer simulated unlock endpoint at `src/app/api/pay/unlock/route.ts`.
- [x] 3.5 Built secure database function `get_prompt_full_text` to hide premium text, and wired check loader inside `src/components/PromptDetailClient.tsx`.

## Group 4 — Expected output screenshot ⚠️ needs new column
- [ ] 4.1 Add `expected_output_image_url` to `prompts`.
- [ ] 4.2 Show the image on the detail page, visible pre-unlock.

## Group 5 — Category-based affiliate links ⚠️ greenfield (no field/table)
- [ ] 5.1 Add `affiliate_category` to `prompts`; create `affiliate_links` table (service_name, category, url, description).
- [ ] 5.2 Detail page: render affiliate cards matching the prompt's category.
- [ ] 5.3 Affiliate disclosure line near the block.

## Group 6 — Admin panel additions ⚠️ depends on Groups 3–5 columns/tables
- [ ] 6.1 Add `price_cents`, `expected_output_image_url`, `is_verified` toggle, `affiliate_category` fields to the prompt form.
- [ ] 6.2 Affiliate links CRUD panel.
- [ ] 6.3 Make `is_verified` drive the "Verified" badge (badge doesn't exist yet either).

## Group 7 — Creator area (user-submitted prompts) ⚠️ greenfield (no submission model)
- [ ] 7.1 "My Submissions" view with pending/approved/rejected status.
- [ ] 7.2 For approved: views, unlock count, vote tally.
- [ ] 7.3 Revenue-share earnings if modeled; else note as future.
- [ ] 7.4 "My Submissions" link beside "Submit Prompt" (neither exists yet).

## Group 8 — Partner directory ($15/mo) ⚠️ greenfield (no tables, no Stripe)
- [ ] 8.1 `/partners` public directory grid (name, services, avg rating, portfolio, Contact).
- [ ] 8.2 `/partners/apply` application form (status: pending).
- [ ] 8.3 `/partners/[id]` detail + reviews + review form (logged-in).
- [ ] 8.4 `/partner-dashboard` (subscription status, billing portal, edit listing, reviews).
- [ ] 8.5 $15/mo Stripe subscription checkout in the dashboard.
- [ ] 8.6 Admin "Partner Applications" approve/reject tab.

### Backend prerequisites not yet present (blockers for Groups 3–8)
- Stripe: no SDK dependency, no keys wired in code, no `/api/checkout`, no webhook route. (`.env.local` has `STRIPE_*` keys but nothing reads them.)
- Tables/columns: none of the monetization/partner/affiliate/voting/submission schema exists in `supabase_setup.sql`.
- User↔content ownership: no `user_id`/author on prompts; workspace data is localStorage-only (per the review), so "my submissions"/"unlocks per user" need a real user-data model first.
