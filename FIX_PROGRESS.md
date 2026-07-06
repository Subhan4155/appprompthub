# Fix Progress

Findings from REVIEW_FINDINGS.md, regrouped in **dependency order** (not the order they appear in the findings doc). Work top to bottom. Groups A–F are done one at a time with a stop-and-summarize after each group. **Group G is not to be touched until the user approves A–F.**

Verification per item: run `npx tsc --noEmit` (typecheck) and `npm run lint`; full `npm run build` at each group boundary. (No test runner exists in the repo.)

Env vars already present in `.env.local`: `ADMIN_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. (Stripe keys exist but are unused — no Stripe code.)

---

## Group A — Auth foundation (do first; everything else depends on it)

- [x] A1. Real server-side admin auth. New `src/lib/adminAuth.ts` (constant-time password check vs server-only `ADMIN_PASSWORD`; HMAC-signed httpOnly session cookie, 8h TTL). New `POST /api/admin/login` (verifies password, sets cookie), `POST /api/admin/logout`, `GET /api/admin/session`. Login throttled to 5/min/IP via new `src/lib/rateLimit.ts`. AdminClient no longer knows the password — it POSTs to the server and tracks only session validity.
- [x] A2. Removed the `"admin123"` fallback and the `"default: admin123"` placeholder. Auth fails closed: if `ADMIN_PASSWORD` is unset the login route returns 503 and the UI shows a "not configured" banner. Password is server-only (no `NEXT_PUBLIC_`), so it's never in the client bundle.
- [x] A3. All admin CRUD moved to session-gated server routes using the service-role key: `GET /api/admin/data` (aggregate load), `POST /api/admin/prompts` + `PATCH|DELETE /api/admin/prompts/[id]`, same for `news`, and `DELETE /api/admin/subscribers/[id]`. Shared guard `src/lib/adminRoute.ts`; snake_case↔camelCase mapping `src/lib/mappers.ts`; input validation `src/lib/adminValidation.ts`; service client `src/lib/supabaseAdmin.ts` (lazy, throws if unconfigured). AdminClient rewritten to call these; dropped the anon-key `supabase` client, `hasSupabaseCredentials`, and the mockData import. Logout clears the cookie server-side.

**Incidental (was a Group G item, forced by the status-panel rewrite):** removed the deceptive/dead "Resend Marketing List Sync" status card (it read a server-only env var in client code — always "MISSING" — and falsely claimed a Supabase backup existed). Noted so it isn't double-counted in G.

## Group B — Database security (after A; admin routes must work without the open policies)

- [ ] B1. Drop the "Option A" world-writable RLS policies (supabase_admin_policies.sql:14-26).
- [ ] B2. Remove the public UPDATE-all-columns policy on `prompts` (supabase_setup.sql:29-30).
- [ ] B3. Create atomic `increment_views` / `increment_likes` (+ decrement) SECURITY DEFINER RPC functions; grant execute to anon.
- [ ] B4. Add email-format CHECK constraint + case normalization (citext or lower() unique index) on `subscribers` (supabase_setup.sql:57,65-66).

## Group C — Data integrity (after B)

- [ ] C1. Generate/author proper Supabase row types; centralize snake_case↔camelCase mapping; fix schema/type drift incl. `image_url` and nullable `description`/`output_description`. *(types.ts vs SQL; per-component mappers)*
- [ ] C2. Fix admin UI writing to local state on failed DB writes — only mutate UI state on confirmed success (prompts, news, subscribers). *(AdminClient.tsx:229-233,252,328,350,368)* — largely handled by the A3 rewrite; verify here.
- [ ] C3. Fix admin editing clobbering live view/like counters (don't send views/likes on update). *(AdminClient.tsx:182-183,194-195)*
- [ ] C4. Add NOT NULL/CHECK(>=0) on counters; enums/CHECK on category/difficulty/importance; `DATE` type for date; `created_at`/`updated_at` timestamps. *(supabase_setup.sql:12,16-19,39,42)*
- [ ] C5. UUID id generation instead of hand-assigned `p-<ts>`/`n-<ts>`; ids not user-editable; use insert (not upsert) for creates. *(supabase_setup.sql:8,35; AdminClient.tsx:165,273,666-676,800-808)*
- [ ] C6. Add `ON CONFLICT (id) DO NOTHING` to seed inserts (supabase_setup.sql:78-185).

## Group D — Security bugs (after C)

- [ ] D1. Fix XSS in ExploreClient sandbox preview — escape user values or render React nodes instead of `dangerouslySetInnerHTML`. *(ExploreClient.tsx:256-257,788)*
- [ ] D2. Check Supabase `{ error }` returns everywhere they're currently swallowed; use the new RPCs; decouple bookmarking from the global like counter. *(HomeClient.tsx:220-227,241-247,395-401,202-257; ExploreClient.tsx:162-186,282-291)*

## Group E — Newsletter (after D)

- [ ] E1. Migrate `/api/subscribe` from the local JSON file to the Supabase `subscribers` table.
- [ ] E2. Proper input validation (type-check, regex, length, normalize) + rate limiting on `/api/subscribe`. *(route.ts:9-16,11,36-41)*

## Group F — Fail-fast config (after E)

- [ ] F1. `src/lib/supabase.ts`: throw in production when env vars are missing instead of the placeholder client; export nullable-safe client. *(supabase.ts:7-8)*
- [ ] F2. Fix the missing-credentials warning firing only in the browser — also warn server-side. *(supabase.ts:10-18)*

---

## Group G — Everything else (DO NOT START until A–F are approved)

SEO / routes: client-only rendering & SEO; no per-prompt `[slug]` routes; missing `/og-image.jpg`; `/admin` indexable (noindex); no `error.tsx`/`not-found.tsx`/`loading.tsx`; no `robots.ts`/`sitemap.ts`; `suppressHydrationWarning` on html/body.

Components (HomeClient): empty-DB shows mock data; `imageUrl` dead mapping; dead `handleNewsletterSubmit`; tab state not in URL; cosmetic workspace "auth"; hero "150+" vs 15; footer MIT claim / no LICENSE; Terms/Privacy placeholders; shared localStorage try/catch; giant component split.

Components (ExploreClient): ~600 lines duplicated with HomeClient (extract shared PromptCard/Modal/Footer/Header + hooks); different localStorage keys for newsletter status; bookmarks filter desync; auto-scroll on every keystroke; mock user trusted when Supabase configured; `any` types.

Admin (leftover): deceptive/dead "Resend" status card; per-table error handling on load; hardcoded fake subscribers seed; toast timer race; slug format validation surfacing real errors.

Styling: `--accent-red` undefined; `* { outline:none }` kills focus; broken /explore responsive collapse (grid vs flex); no admin responsive rules; missing `.importance--low`; dead CSS (`.copy-status-bubble`, `.footer-social-links`, `.social-icon-link`, `.footer-newsletter-form`); `!important` overuse; duplicate `.prompt-card__title`; no `prefers-reduced-motion`; leftover unused `/public` SVGs; missing `/previews/*.jpg`.

Performance: server-render data; exclude mockData from prod bundle; passive/threshold scroll listener; memoize `extractVariables` for open modal.

Code quality / docs: README is stock boilerplate (document setup + env); add `.env.example`; add `typecheck` script + consider tests; add `engines`; mockData/SQL-seed content duplication.
