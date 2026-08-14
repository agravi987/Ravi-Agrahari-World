# Portfolio Website Plan — Simple & Achievable

**Who:** Fresher / entry-level Cloud, DevOps & AI enthusiast with basic knowledge.
**Goal:** A clean, attractive, light-themed portfolio that shows who I am and what I'm learning — powered by **my own MongoDB-backed CMS at `/admin`** (a hiring-proof project in itself). Deployed on Vercel. Buildable in ~2 weeks.

---

## 1. Identity: "Orbital" — Space × Cloud × DevOps × AI

- Theme: astronomy + cloud/devops/ai combined, used as a *subtle metaphor*, not decoration.
  - Orbits = systems, planets = services, constellations = connected skills.
- **Light theme first** — warm off-white (`#faf9f6`), one accent (indigo `#4f46e5`), colorful but restrained.
- Typography: Space Grotesk (headings) + Geist/Inter (body). Generous whitespace.

## 2. Tech Stack (Keep It Simple)

| What | Tool |
|------|------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion (subtle) |
| Database | **MongoDB Atlas** (free tier) + Mongoose |
| Auth | **NextAuth.js (Auth.js)** — Credentials + JWT, one admin account |
| Content | **Custom CMS at `/admin`** (built in-house, this plan) |
| Images | **Cloudinary** (free tier) for CMS uploads |
| Rich text | **Markdown textarea** in CMS → rendered with `react-markdown` on the site |
| Hosting | **Vercel** (free) |
| CI/CD | GitHub + Vercel auto-deploy + a deploy badge |

**Deliberately NOT doing (yet):** Kubernetes, Docker, RAG/AI chatbot, Go CLI, Terraform, Grafana, CMS drafts/versioning, multi-user admin, WYSIWYG editor. Learn those later — the portfolio should be honest about your current level.

## 3. Sections (8)

All sections read content from MongoDB **through `lib/content.ts`** — the single content boundary (D6). No content is hardcoded in components.

1. **Hero** — name, one-liner, rotating roles ("Cloud Enthusiast → DevOps Learner → AI Explorer"), CTA buttons
2. **Skills** — 3 cards (☁️ Cloud, 🔧 DevOps, 🤖 AI) with icons + level bars (honest levels!)
3. **Learning Galaxy** ⭐ — the star of the site. Each learning topic = a planet; every GitHub repo = an orbiting moon. Details below
4. **Projects** — card grid, tech badges, links (GitHub / Live). Even small projects count
5. **Experience / Internships** — simple timeline (can be empty initially, shows potential)
6. **Certifications** — badge cards (AWS/Azure/GCP fundamentals etc.)
7. **Blog / Learnings** — notes on what you're studying (good signal for growth)
8. **Contact** — email + social links + simple form

### 3.1 Learning Galaxy (the visual centerpiece)

**Concept:** Your GitHub learning repos, displayed as a solar system — shows you're actively growing across Cloud/DevOps/AI topics.

```
             🔭
   [Linux]------[Docker]
        \         /
   [AWS]--(YOU)--[Kubernetes]
        /    ☀️   \
[GitHub Actions]--[Networking]
             \
           [Terraform]
```

- **Center "sun"** = you / your learning journey
- **Planets** = topics (Linux, Docker, Kubernetes, Networking, AWS, Terraform, GitHub Actions)
- **Planet size** = how much content exists (more repos → bigger planet) — clamped to a min/max scale so sparse data still renders
- **Planet ring** = self-rated level (beginner / learning / growing) — honest, not oversold
- **Moons** = individual GitHub repos, color-tinted by type:
  - 🗒️ Notes (blue) · 🛠️ Hands-on (green) · 🚀 Projects (accent/purple)
- Interactions: hover planet → glows + moons light up; click → panel lists items with GitHub links
- Filter chips: All / Notes / Hands-on / Projects
- Reduced-motion: static layout + a simple list/table fallback
- Keyboard accessible: planets focusable, panel reachable without hover

**Why it works:** every moon links to a real repo = instant proof. Add a repo → new moon. Add a topic → new planet. All from the CMS.

**Database model (MongoDB collections — Mongoose schemas):**
```
siteConfig: { name, headline, roles[], currentlyLearning, streak, email, github, socialLinks[], sectionsEnabled{...} }
learningTrack: { name, icon, color, level, description, order, updatedAt, items[]{ type, title, description, githubUrl, tags[] } }
project: { title, description, coverImage?, tech[], repoUrl, demoUrl, featured, order }
experience: { company, role, period, description, metrics[], order }
certification: { name, issuer, date, verifyUrl, logo?, category }
post: { title, slug, excerpt, contentMarkdown, tags[], publishedAt }
user: { email, passwordHash }   // single admin, seeded from env (D7)
```

## 4. Design Details (Simple but Attractive)

- Light warm background, dark text, one indigo accent + a single indigo→cyan gradient element (hero ring)
- Subtle dotted-grid or star pattern on hero only
- Cards: white, rounded, soft shadow, lift + accent border on hover
- Scroll reveal: sections fade up once (60ms stagger, subtle)
- Dark mode toggle: optional, via CSS variables (easy win)
- Small orbital ring animation in hero (CSS only, pauses for reduced-motion)
- Terminal easter egg: `Ctrl+K` opens a fun fake terminal (`help`, `whoami`) — small, hidden, delightful

### 4.1 Design Assets & Image Policy (LOCKED IN — follow this)

**Icons — two systems, no mixing:**
- `lucide-react` for generic UI icons (terminal, cloud, rocket, github, linkedin, mail) — line style, consistent weight
- `simple-icons` for tech/brand logos (AWS, Docker, Kubernetes, Terraform, Linux, GitHub Actions) — real colored brand marks
- Rule: lucide = UI, simple-icons = brands. Never mix two generic icon sets.

**Emojis — allowed but disciplined:**
- One per section eyebrow max: "🚀 03 · PROJECTS"
- Planet icons in the galaxy (🐳 Docker, ☸️ K8s, 🐧 Linux, 🌐 Networking) — the one place emojis shine; render as **OpenMoji SVG** where available (§4.3)
- A few in hero rotating roles
- Rule: if a paragraph needs 2+ emojis, cut one. No emojis in body text.

**AI-generated images — SKIP for v1:**
- No AI covers/hero art — they clash with the minimal theme and read as "template"
- Only exception later: subtle nebula/stardust texture at ~5% opacity behind the galaxy (optional)
- Planets are CSS/SVG (gradients on circles) — crisp, lightweight, no image loading
- Cloudinary hosts only **real** content (project covers, blog images) — covers are optional fields, not required
- Every downloaded asset must come from the verified shortlist in **§4.3** — no Google-image grabs

**Colorful-but-elegant palette (per-section accents, muted not neon):**
- Base: warm paper `#faf9f6`, white cards, slate-900 text
- One brand accent: indigo `#4f46e5` (buttons, links, focus rings)
- Per-topic muted hues for galaxy planets: Cloud = sky blue, DevOps = teal/green, AI = violet, others = soft mars-red / amber / ice-blue
- ONE gradient (indigo→cyan) only on hero ring + galaxy sun. Everything else solid.
- Contrast rule: colored elements = icons/badges/rings; body text stays dark-on-light

**Small polish touches (these elevate more than images):**
- Terminal-styled eyebrows: `~/projects` section labels (devs love this, matches identity)
- Green pulsing "learning · actively pushing repos" status dot
- Planet glow strength = repo recency (fresher commits = brighter)
- One consistent border-radius + shadow scale everywhere
- Accent-colored selection + styled scrollbar

### 4.2 Brainstorm — extras locked into scope

**Galaxy (core):**
- **Mission brief panel** — click a planet → opens a card with 1-line story + GitHub links + "what I learned". Human, not a bare repo list
- **Planet rings for level** — Saturn-style ring = "growing", none = "beginner". Instant visual hierarchy

**Hero / header (core):**
- **"Currently learning: Kubernetes" badge** in the header — momentum story, encourages visitors to ask
- **Learning streak counter** — from CMS field, only shown when ≥ 2 (§5)
- **GitHub stats strip** — repos + last pushed, live from GitHub API at build/ISR time. **NEVER stars/contributions/followers** (see §5)

**Contact (core):**
- **Copy-email one-click** — copies address to clipboard + toast. Removes friction

**Content (core):**
- **"What I learned this week"** micro-notes in the galaxy — short weekly blurbs. Consistency proof, no big blog needed
- **Troubleshooting log** — 3 real problems you debugged + how. Instant "can actually do things" proof

**Optional (later, low priority):**
- "Farthest mission" sparkle badge on newest topic
- Constellation cursor trail (galaxy section only)
- Custom 404 "Lost in space — rerouting to Mission Control"
- Scroll progress = flight path line in nav

### 4.3 Licensed Asset Shortlist (LOCKED IN — licenses verified Aug 2026)

**Rule: every downloaded asset must have a verified license, with credit where required. Prefer code-generated SVG over downloads. Max 3 downloaded image assets on the site.**

| Asset | Source | License | Notes |
|---|---|---|---|
| Nebula / stardust texture (~5% opacity behind galaxy) | [NASA Images](https://images.nasa.gov/) | Public domain (US gov work) — **NASA logo/insignia NOT allowed** | Use `mix-blend-mode: screen` or very low opacity so a dark photo blends into the warm paper bg; optional credit "Image: NASA"
| Planet icons (🐳 ☸️ 🐧 🌐 etc.) | [OpenMoji](https://openmoji.org/) | CC BY-SA 4.0 — commercial OK, **attribution required** | Download **SVG** (crisp, transparent) not PNG; credit in footer: "Planet icons by OpenMoji (CC BY-SA 4.0)"
| Illustrations (astronaut / orbit — 404 or Contact, max 1) | [unDraw](https://undraw.co/license) | Free for commercial + noncommercial, **no attribution required** | SVG; recolor to palette via `currentColor`/fill; unDraw is the only no-credit illustration source in the list
| Brand/tech icons (AWS, Docker, K8s, Linux, GitHub Actions…) | `simple-icons` (npm) | Project CC0; **individual icons carry their own brand licenses/trademarks** — check brand guidelines | Use as an npm package (code), never hotlink images; don't modify the marks
| Certification badges | **Official issuers only**: [AWS Credly badges](https://aws.amazon.com/certification/certification-digital-badges/), [Google Cloud Credential Wallet](https://support.google.com/cloud-certification/answer/13258004), Microsoft Learn | Badges are issued for sharing | **Never download/scrape brand logos** — use the official badge image/embed + a "Verify" link to the issuer (matches §5.6 honesty)

**Rules:**
- Downloads go in `public/assets/` with an `assets/README.md` listing source + license + credit (attribution audit trail)
- OpenMoji credit goes in the footer; NASA credit is optional but encouraged
- No AI-generated images, ever (§4.1)
- If an asset's license page changes, re-check before using

## 5. "Growth, not Numbers" — Zero-Data Policy (LOCKED IN)

> **Visitors can only ever see data that is ≥ 1. Zeros simply never render.**

**5.1 Conditional rendering (never show 0):**
- Every stat/metric is only output when value ≥ 1. A "0 stars" or "0 contributions" element **does not exist** on the page — nothing to feel bad about, nothing for visitors to judge.
- Counter components check `value >= 1` before rendering (or only render counts of real content).

**5.2 Auto-hide empty sections:**
- Each collection has a `sectionsEnabled` flag in `siteConfig`. No content → section is hidden entirely. No blank voids, no "0 items".
- Experience/blog/etc. simply don't appear until real content exists.

**5.3 Safe metric set (never embarrassing):**
| Show | Never show |
|------|-----------|
| Repos (real count) | Stars |
| Learning streak (≥ 2) | Followers |
| Topics learning (7) | Contributions |
| Weekly notes | Any empty counter |

**5.4 Designed empty states (when shown intentionally):**
- If a section IS shown but lightly populated, use positive framing: "This constellation is still forming — check back soon 🚀". Emptiness = curiosity, not failure.

**5.5 Lead with momentum, not numbers:**
- Primary narrative is "I show up and learn daily" (streak, currently-learning badge, weekly notes) — not stats.
- Hero copy focuses on journey, never on metrics you don't have.

**5.6 Honesty as superpower:**
- Only real, working links. Every moon/planet points to an actual GitHub repo.
- No fabricated numbers, no fake "years of experience". "Actively learning" beats a fake claim every time.

## 6. Build Decisions (LOCKED — resolved before coding)

| # | Decision | Choice |
|---|----------|--------|
| D1 | Database access | **Seed first, Mongo second** — the site runs on bundled seed data until `MONGODB_URI` is present. When it is, `lib/content.ts` reads from Mongoose. `npm run seed` populates Atlas. |
| D2 | GitHub stats | **Repos count + "last pushed"** via GitHub REST (`/users/{user}/repos`, no auth), fetched **at build/ISR time** (not per pageview) to avoid the 60 req/hr unauthenticated limit. **Learning streak = DB field** (updated by user in CMS). |
| D3 | Planet recency glow | **`updatedAt` date per moon in DB** — user updates it in the CMS when they push. No live API dependency. |
| D4 | Contact | **Copy-email button + `mailto:` pre-filled form** — zero backend, zero cost |
| D5 | GitHub username | **Placeholder `your-github-username`** in seed + CMS; user fills real one in CMS |
| D6 | Content source | **One loader, two backends** — `lib/content.ts` is the only file that knows the source (seed now → Mongoose later). Mongoose schemas mirror seed types exactly, so the swap is drop-in. |
| D7 | Auth | **NextAuth.js (Auth.js) v5**, Credentials provider + JWT sessions, **one admin account**. Password hashed with `bcryptjs` (pure JS — no native build issues on serverless), created by the seed script from env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). `middleware.ts` protects `/admin` and `/api/admin/*`. |
| D8 | Images | **Cloudinary** (free tier) — an admin upload route stores images to Cloudinary and returns a URL; DB stores URLs only. `next.config.ts` remotePatterns: cloudinary + github. Design rule stands: covers/badges optional, no AI images. |
| D9 | Rich content | **Markdown textarea** in the CMS, rendered with `react-markdown` on the site. No WYSIWYG in v1. |
| D10 | CMS scope v1 | CRUD (list + form views) for all 6 collections, single admin, **no drafts/versioning**, no multi-user. Keep the admin UI plain: tables + forms, no fancy editor. |
| D11 | **Code readability & reviewability** | This is a learning portfolio — readability beats brevity. Every file ships with comments (purpose, data source, non-obvious logic), descriptive names, small focused files, no clever one-liners. Conventions in §7.2. |

## 7. Executable Build Plan

### Target repo layout
```
portfolio/
├── .github/workflows/deploy-meta.yml   # deploy badge (see S10)
├── middleware.ts                       # D7: protects /admin + /api/admin/*
├── scripts/seed.ts                     # D1: seeds Atlas + creates admin user
├── src/
│   ├── app/
│   │   ├── globals.css                 # design tokens (§4.1)
│   │   ├── layout.tsx                  # Header + Footer + metadata + deploy badge
│   │   ├── page.tsx                    # all 8 sections
│   │   ├── admin/                      # D7/D10: login + dashboard + CRUD forms
│   │   └── api/
│   │       ├── admin/                  # D7/D10: auth + CRUD route handlers
│   │       └── upload/                 # D8: Cloudinary upload
│   ├── components/
│   │   ├── ui/                         # Button, Card, Badge, Eyebrow, Section
│   │   ├── sections/                   # Hero, Skills, LearningGalaxy, Projects,
│   │   │                               # Experience, Certifications, Blog, Contact
│   │   └── ThemeToggle.tsx             # light/dark via CSS vars
│   ├── lib/
│   │   ├── db.ts                       # D1: cached Mongo connection singleton
│   │   ├── auth.ts                     # D7: NextAuth config (Credentials + JWT)
│   │   ├── cloudinary.ts               # D8: upload helper
│   │   ├── content.ts                  # D6: THE content boundary (seed → Mongo)
│   │   └── github.ts                   # D2: repos + last-pushed at build time
│   ├── models/                         # D6/D10: Mongoose schemas (§3.1)
│   └── types/index.ts                  # SiteConfig, LearningTrack, Project, ...
├── public/deploy-meta.json             # placeholder, overwritten at build (S10)
├── next.config.ts                      # images.remotePatterns (cloudinary + github)
└── .env.local                          # MONGODB_URI, AUTH_SECRET, ADMIN_*, CLOUDINARY_*, NEXT_PUBLIC_GITHUB_USERNAME
```

### Build sequence (each step ends buildable + verifiable)

**S1 — Scaffold + tokens** (1 command + edits)
- [ ] `npx create-next-app@latest portfolio --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
- [ ] Deps: `framer-motion lucide-react simple-icons clsx` (Mongo/auth/Cloudinary deps added at S11–S12)
- [ ] `globals.css` tokens: paper bg, indigo accent, per-topic hues, radius/shadow scale, reduced-motion, selection, scrollbar
- [ ] Fonts via `next/font`: Space Grotesk (display) + Inter (body)
- **Verify:** `npm run dev` renders a themed blank page, `npm run build` passes

**S2 — Core UI primitives**
- [ ] `Button`, `Card`, `Badge`, `Eyebrow` (`~/skills` labels), `Section` (id, eyebrow, title, children)
- [ ] `ThemeToggle` (light/dark CSS vars, localStorage, no flash)
- **Verify:** build passes

**S3 — Hero**
- [ ] Name + one-liner + rotating roles (slide/fade 500ms) + CTAs + scroll cue
- [ ] Orbital ring (CSS animation, pauses on reduced-motion)
- **Verify:** responsive on 375px / 768px / 1280px

**S4 — Skills (3 cards)**
- [ ] Cloud / DevOps / AI cards, icons (lucide + simple-icons), level bars (honest 1–5)
- **Verify:** builds with seed data

**S5 — Learning Galaxy (centerpiece)**
- [ ] Planets from seed `learningTrack` (name, emoji, color, level, description)
- [ ] Moons (type-tinted: notes/hands-on/project) linking to real `githubUrl`
- [ ] Planet size = item count (min/max clamped); ring = level; glow = `updatedAt` recency (D3)
- [ ] Hover → glow + moons light; click → mission brief panel (story + links + learned)
- [ ] Filter chips (All/Notes/Hands-on/Projects); weekly notes; list/table fallback (reduced-motion); keyboard accessible
- **Verify:** zero-data safe (planet with 0 items hidden); mobile ok

**S6 — GitHub stats strip**
- [ ] `lib/github.ts`: fetch repos **at build/ISR time** (D2) → count + last pushed. Render only non-zero (§5)
- [ ] Streak from DB, shown only when ≥ 2
- **Verify:** no metric at 0 renders; graceful if fetch fails (hide, don't error)

**S7 — Projects, Experience, Certifications, Blog**
- [ ] Each reads seed data; **auto-hide when empty (§5.2)**
- [ ] Projects: featured 2× + cards, tech badges, links
- [ ] Experience: case-study rows (or timeline) — hidden until content exists
- [ ] Certifications: badge cards + verify link
- [ ] Blog: small cards (read time + tags)
- **Verify:** with empty seed arrays, sections don't render at all

**S8 — Contact**
- [ ] Copy-email button (clipboard + toast), `mailto:` pre-filled form (D4), social icons

**S9 — Polish + SEO**
- [ ] Scroll reveal (60ms stagger, once), hover states, focus rings, semantic HTML
- [ ] Metadata, OG image, sitemap, robots
- [ ] §5 zero-data verification pass

**S10 — Deploy + badge**
- [ ] Push to GitHub, import to Vercel
- [ ] Deploy badge: **read Vercel build env at build time** (`VERCEL_GIT_COMMIT_SHA` + build timestamp) into `public/deploy-meta.json` → footer shows commit + time. No GitHub Actions write-back needed (a workflow can't write into a live deploy; the env var is the reliable source).
- [ ] Lighthouse > 90

**S11 — MongoDB + Auth (core)**
- [ ] Deps: `mongoose next-auth bcryptjs react-markdown cloudinary`
- [ ] `lib/db.ts` cached connection singleton (serverless-safe); `lib/content.ts` swaps seed → Mongoose (same types, D6)
- [ ] Mongoose schemas for all 6 collections (§3.1)
- [ ] `scripts/seed.ts` — idempotent: populates collections from seed data + creates admin user from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (bcrypt-hashed)
- [ ] NextAuth v5 (Credentials + JWT), `AUTH_SECRET`; `middleware.ts` protects `/admin` + `/api/admin/*`
- [ ] Login page at `/admin/login`
- **Verify:** unauthenticated `/admin` redirects to login; login works; frontend now renders from Mongo; build passes with and without `MONGODB_URI`

**S12 — Admin CMS (core)**
- [ ] Dashboard: list views per collection with edit/delete
- [ ] CRUD route handlers under `/api/admin/*` (server-only, session-checked)
- [ ] Form pages: create/edit for each collection; markdown textarea for `contentMarkdown` (D9)
- [ ] Cloudinary upload route (D8) → returns URL into form fields
- [ ] After any mutation: `revalidatePath` so the site updates immediately
- **Verify:** create/edit/delete a project in `/admin` → appears/disappears on the live site

**S13 — Content + final pass**
- [ ] Run `npm run seed` against Atlas; fill real learning tracks, projects, blog posts
- [ ] ISR revalidation strategy (e.g. revalidate 60)
- [ ] Zero-data verification pass: empty collections → sections hidden (§5)
- [ ] Lighthouse > 90 after CMS wiring

### 7.1 — Command-level runbook (verified Aug 2026)

**Environment (checked):** Node 24.18.1 · npm 12.0.2 · git 2.55.0 · Docker 29.6.2 · `mongod` NOT installed → dev DB runs in **Docker mongo:7 container**. GitHub username locked: **`agravi987`**. Project root = current dir (scaffold into `.`).

**Every step ships reviewable code per §7.2 (D11):** file-header comments, WHY-not-WHAT comments, named constants, small files. No step is "done" until a human could read it cold.

**Phase 1 — Frontend (seed-driven, no DB needed)**

- **S1 Scaffold + tokens:** `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes` → `npm i framer-motion lucide-react simple-icons clsx` → `globals.css` tokens, `tailwind.config.ts`, Space Grotesk + Inter via `next/font`. **Verify:** `npm run build` passes, themed blank page.
- **S2 UI primitives:** `components/ui/{Button,Card,Badge,Eyebrow,Section}.tsx` + `ThemeToggle.tsx` (CSS vars, no flash). **Verify:** build.
- **S3 Hero:** rotating roles (500ms fade), CSS orbital ring (pauses on reduced-motion), CTAs, scroll cue. **Verify:** 375/768/1280.
- **S4 Skills:** 3 cards (☁️ Cloud, 🔧 DevOps, 🤖 AI) from seed, honest level bars. **Verify:** build.
- **S5 Learning Galaxy ⭐:** `LearningGalaxy.tsx` + `lib/seed.ts`; planet size = item count (clamped), ring = level, glow = `updatedAt`; moons tinted by type → real `githubUrl`; mission-brief panel; filter chips; weekly notes; reduced-motion list/table fallback; keyboard-accessible. **Verify:** zero-data safe, mobile ok.
- **S6 GitHub strip:** `lib/github.ts` fetches `agravi987` repos at build/ISR time (count + last pushed); streak from seed; render only ≥1 (streak ≥2). **Verify:** no 0 renders; failure → hide.
- **S7 Projects/Experience/Certs/Blog:** from seed, **auto-hide when empty**. **Verify:** empty arrays → sections absent.
- **S8 Contact:** copy-email + toast, `mailto:` form, socials.
- **S9 Polish + SEO:** scroll reveal (60ms once), hover/focus, metadata, OG, sitemap, robots; §5 zero-data pass.

**Phase 2 — MongoDB + Auth + Admin CMS**

- **Dev DB:** `docker run -d --name mongo-dev -p 27017:27017 -v mongo-data:/data/db mongo:7` → `mongodb://127.0.0.1:27017/portfolio`
- **S11 Data + auth:** `npm i mongoose next-auth bcryptjs react-markdown cloudinary` → `lib/db.ts` (cached singleton), `models/*` (7 schemas per §3.1), `scripts/seed.ts` (idempotent + admin user), `lib/content.ts` (seed→Mongo swap; **falls back to seed when `MONGODB_URI` absent**), `lib/auth.ts` (NextAuth v5 Credentials+JWT), `middleware.ts` (protect `/admin` + `/api/admin/*`), `/admin/login`. `.env.local`: `MONGODB_URI`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_GITHUB_USERNAME=agravi987`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`. **Verify:** login works, admin blocked unauthenticated, frontend reads Mongo, build passes with AND without `MONGODB_URI`.
- **S12 Admin CMS:** `/api/admin/*` CRUD (session-checked), `/admin` dashboard (list + forms), `/api/upload` (Cloudinary), markdown textarea, `revalidatePath` after mutations. **Verify:** create/edit/delete a project in `/admin` → live site updates.

**Phase 3 — Deploy + content**

- **S10 Deploy + badge:** `git init` → commit → push → import to Vercel (prod `MONGODB_URI` = Atlas). Badge: read `VERCEL_GIT_COMMIT_SHA` + build time at build → `public/deploy-meta.json` → footer. **Verify:** live, badge shows commit, Lighthouse > 90.
- **S13 Content + final pass:** seed prod Atlas, ISR revalidate 60, final zero-data + Lighthouse pass.

### 7.2 — Code & File Conventions (LOCKED — D11)

**Goal:** anyone (me, you, an interviewer) can open any file and understand it cold — structure, data flow, and why it's written that way.

**File header (every file):** a short comment block at the top:
```ts
/**
 * LearningGalaxy.tsx
 * Renders the Learning Galaxy section: planets = learning tracks, moons = repos.
 * Data source: lib/content.ts (seed → MongoDB, D6) — NEVER hardcoded here.
 * Zero-data: planets with 0 items are hidden (plan §5).
 */
```

**Comment rules:**
- Explain **WHY**, not **WHAT** — the code shows what; comments justify non-obvious decisions (e.g. "clamp planet size 32–96px so sparse data still renders", "fetch at build time to stay under GitHub's 60 req/hr unauthenticated limit")
- Comment every non-obvious block: zero-data guards, rate-limit handling, reduced-motion fallbacks, revalidation after mutations
- No commented-out code — delete it
- `TODO` comments only for known, tracked gaps

**Naming & structure:**
- Descriptive names; no single-letter variables outside loops
- No magic numbers — name them (`PLANET_MIN_SIZE`, `STAGGER_MS = 60`)
- One component = one concern; components are small; split when a file exceeds ~150 lines
- Folders: `components/ui/` (primitives), `components/sections/` (8 sections), `lib/` (data/auth/utils), `models/` (Mongoose), `types/` (shared types)
- Shared types live in `types/index.ts`; components import types, never duplicate them

**Review workflow (every step ends with this):**
1. `npm run build` passes (TypeScript + ESLint clean)
2. New files have header comments; touched files stay consistent with §7.2
3. Data flows through `lib/content.ts` (seed → Mongo), never hardcoded in a component
4. Zero-data policy (§5) holds: no 0 renders, empty sections auto-hide

### MongoDB schema (Mongoose, mirrors §3.1)
```
siteConfig: { name, headline, roles[], currentlyLearning, streak, email, github, socialLinks[], sectionsEnabled{...} }
learningTrack: { name, icon, color, level, description, order, updatedAt, items[]{ type, title, description, githubUrl, tags[] } }
project: { title, description, coverImage?, tech[], repoUrl, demoUrl, featured, order }
experience: { company, role, period, description, metrics[], order }
certification: { name, issuer, date, verifyUrl, logo?, category }
post: { title, slug, excerpt, contentMarkdown, tags[], publishedAt }
user: { email, passwordHash }
```

## 8. After Launch — What To Learn Next (in order)

Build these into portfolio projects, each proving a skill:

| Level | Skill | Portfolio project idea |
|-------|-------|------------------------|
| Now | Git + GitHub | This portfolio itself |
| Now | HTML/CSS/JS | This portfolio |
| Now | **Full-stack (MongoDB + auth + CRUD)** | **The `/admin` CMS itself** |
| 1–2 months | Linux basics + shell | Automate something with a script |
| 2–3 months | Docker | Dockerize this portfolio, add `Dockerfile` |
| 3–4 months | AWS/Azure basics | Deploy a small app to EC2/S3 |
| 4–6 months | CI/CD | Add GitHub Actions (lint → test → deploy) |
| 6+ months | Kubernetes | Deploy a Dockerized app to a free/managed cluster |
| 6+ months | AI/LLM | Build a small "chat with my resume" app |

> Every skill you learn gets added to the Skills + Projects sections. The portfolio grows with you.

## 9. Success Looks Like

- Lighthouse > 90 (fast, accessible)
- Live on Vercel within 2 weeks
- Honest, clean, reflects "early-career but curious and learning"
- Zero-data policy holds: no metric ever renders at 0, no section looks empty
- **Admin CMS works: content edits at `/admin` go live without touching code**
- You can point to it in job applications and say: "I built, deployed, and maintain this — including the CMS."

---

*Keep it simple. Ship it. Improve it later. A good portfolio is 80% good content, 20% fancy tech.*
