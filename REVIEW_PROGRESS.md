# Review Progress Checklist

Full-project review, one area at a time. Every file in each area is read fully before the item is checked off. Findings go to REVIEW_FINDINGS.md.

## Project map (excluding node_modules, .next, build output, lock files)

```
/                           — config & root files
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── .gitignore
├── README.md, AGENTS.md, CLAUDE.md
├── supabase_setup.sql
├── supabase_admin_policies.sql
├── public/                 — static assets (5 svg + favicon)
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── admin/          — page.tsx + AdminClient.tsx (910 lines)
    │   ├── api/subscribe/  — route.ts
    │   └── explore/        — page.tsx
    ├── components/
    │   ├── HomeClient.tsx  (1905 lines)
    │   └── ExploreClient.tsx (913 lines)
    ├── data/mockData.ts
    ├── lib/supabase.ts
    └── types.ts
```

## Checklist

- [x] Root config files (package.json, next.config.ts, tsconfig.json, eslint.config.mjs, .gitignore, README.md, AGENTS.md/CLAUDE.md)
- [x] Supabase SQL & RLS (supabase_setup.sql, supabase_admin_policies.sql)
- [x] /src/lib + /src/types + /src/data (supabase.ts, types.ts, mockData.ts)
- [x] /src/app/api/subscribe (route.ts)
- [x] /src/app core routes (layout.tsx, page.tsx, explore/page.tsx, admin/page.tsx)
- [x] /src/app/admin/AdminClient.tsx
- [x] /src/components/HomeClient.tsx
- [x] /src/components/ExploreClient.tsx
- [x] /src/app/globals.css + /public assets
- [x] Final pass: "Fix first" summary at top of REVIEW_FINDINGS.md
