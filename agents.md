# Agent Definitions — Simple Portfolio Build

Small agent roles for building the simple portfolio. Read `plan.md` first.

---

## Agent: `frontend-designer`

**Role:** Builds the entire frontend — design system, all sections, animations, responsive, a11y.

**Mandate:**
- Set up Next.js (App Router) + TypeScript + Tailwind + Framer Motion
- Build design tokens (light theme, one indigo accent, warm paper background)
- Implement all 8 sections (Hero, Skills, **Learning Galaxy**, Projects, Experience, Certifications, Blog, Contact)
- **Learning Galaxy:** solar-system viz — planets = learning topics, moons = GitHub repos (notes/hands-on/projects), fed from MongoDB `learningTrack` via `lib/content.ts`
- Scroll reveal, hover states, orbital hero ring, reduced-motion support (galaxy gets a list/table fallback)
- Responsive, semantic HTML, focus states, SEO basics

**Tools:** Read, Write, Edit, Bash, Glob, Grep

**Key Files:**
- `src/app/globals.css` — design tokens
- `tailwind.config.ts`
- `src/app/page.tsx` — single-page sections
- `src/components/` — components (incl. `LearningGalaxy.tsx`)
- `src/lib/content.ts` — content boundary (returns seed data until Mongo is wired — D6)
- `src/lib/github.ts` — build-time GitHub stats (D2)

**Definition of Done:**
- All 8 sections render, responsive on mobile
- Learning Galaxy shows planets + moons from real data through `lib/content.ts` (NOT hardcoded)
- Light colorful theme, one accent color
- Scroll animations + reduced-motion respected
- **Zero-data policy enforced:** no metric renders at 0, empty sections auto-hide (plan.md §5)
- `npm run build` passes with zero TypeScript/ESLint errors
- Frontend works identically against seed data (no DB running)

---

## Agent: `admin-cms-developer`

**Role:** Owns the MongoDB data layer, authentication, and the `/admin` CMS. This is the project's core hiring-proof feature.

**Mandate:**
- Mongoose schemas mirroring plan.md §3.1 (`siteConfig`, `learningTrack`, `project`, `experience`, `certification`, `post`, `user`)
- `lib/db.ts` — cached MongoDB connection singleton (serverless-safe)
- `lib/content.ts` — swap seed → Mongoose, drop-in, same types (D6). **Must fall back to seed when `MONGODB_URI` is absent** so fresh clones still build
- `scripts/seed.ts` — idempotent seed: populates collections + creates the admin user (bcrypt-hashed from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env)
- **NextAuth.js (Auth.js) v5**, Credentials provider + JWT sessions (D7); `middleware.ts` protects `/admin` and `/api/admin/*`; login page at `/admin/login`
- CRUD route handlers under `/api/admin/*` (server-only, session-checked) + admin UI (list + form views) for all collections
- Cloudinary upload route (D8) → URLs stored in DB; markdown textarea for rich content (D9)
- Revalidate the site after every mutation so edits go live immediately

**Tools:** Read, Write, Edit, Bash, Glob, Grep

**Key Files:**
- `src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/content.ts`, `src/lib/cloudinary.ts`
- `src/models/` — Mongoose schemas
- `src/app/admin/` — login + dashboard + forms
- `src/app/api/admin/` + `src/app/api/upload/` — route handlers
- `middleware.ts`, `scripts/seed.ts`

**Definition of Done:**
- `/admin` login works; unauthenticated requests are blocked from admin pages and API routes
- Create/edit/delete content in `/admin` → changes appear on the live site
- Frontend renders exclusively from MongoDB via `lib/content.ts` — zero hardcoded content
- Zero-data policy respected: empty collections hide sections on the site (plan.md §5)
- `npm run build` passes; `npm run seed` is idempotent

---

## Agent: `deploy-engineer`

**Role:** Owns deployment + the deploy badge (the ONE DevOps touch).

**Mandate:**
- Push to GitHub, import to Vercel, verify auto-deploy
- Deploy badge: read Vercel build env (`VERCEL_GIT_COMMIT_SHA` + build time) at build time into `public/deploy-meta.json` → footer shows it (plan.md S10)
- Add SEO essentials (metadata, OG image, sitemap)
- (Later) optional Dockerfile

**Tools:** Read, Write, Edit, Bash, Glob, Grep

**Key Files:**
- `.github/workflows/deploy-meta.yml` (CI lint/typecheck; badge comes from Vercel build env, not workflow write-back)
- `src/app/layout.tsx`
- `public/deploy-meta.json`
- Environment checklist in plan.md §2/§6: `MONGODB_URI`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLOUDINARY_*` (server-only), `NEXT_PUBLIC_GITHUB_USERNAME`

**Definition of Done:**
- Site live on Vercel with Mongo + auth + CMS working in production
- Footer shows live commit hash + deploy time
- Push to main → site updates automatically
- Lighthouse > 90

---

## Orchestration

- Work in order: `frontend-designer` (seed-driven frontend, `lib/content.ts` boundary) → `admin-cms-developer` (MongoDB + auth + `/admin`) → `deploy-engineer` (deploy + env vars).
- Shared state: `plan.md` (this file's sibling), `AGENTS.md` (this file).
- Content lives in MongoDB, never hardcoded. Seed data is a dev-time stand-in; `lib/content.ts` is the only boundary between them.

---

*Simple scope. Ship it, then iterate.*
