# UI/UX Design & Features Plan — "Orbital" Portfolio

Status: **living plan** — companion to `plan.md` (build plan) and `agents.md` (roles).
This document owns the **visual design direction, section-level UX specs, and feature
priorities**. Build steps and content rules stay in `plan.md`; where they overlap, this
file wins on design, `plan.md` wins on scope/order.

Grounded in the installed **ui-ux-pro-max** skill (`.agents/skills/ui-ux-pro-max/`) —
its searchable style/color/typography/UX data was queried directly (Python isn't on this
machine's PATH, so the CSVs in `data/` were read instead of running `scripts/search.py`).

---

## 1. Design direction (validated & locked)

### 1.1 Style — "Minimal & Swiss structure + Motion-Driven storytelling"

Skill data (`data/products.csv`, row *Portfolio/Personal*) recommends for personal
portfolios: **Motion-Driven + Minimalism & Swiss Style**, landing pattern
**Storytelling-Driven**, "brand primary + artistic interpretation", *"Showcase work.
Personality shine through."*

This maps cleanly onto what's already built — and it's the right middle ground:

| Skill guidance | Current implementation | Verdict |
|---|---|---|
| Swiss/minimal structure (grid, whitespace, clear type hierarchy) | `globals.css` tokens, `Section` shell, max-w-5xl, generous spacing | ✅ keep |
| Motion-Driven (scroll reveals, micro-interactions, entrance anims) | `Section` whileInView fade-up (once, −80px), Hero entrance + rotating roles, orbital ring | ✅ keep — deliberately **subtler** than full Motion-Driven (300–400ms, parallax). Restraint fits a fresher portfolio and keeps Lighthouse > 90 |
| Storytelling-Driven (personality over product) | "learning in public" narrative: streak, mission log, mission briefs | ✅ keep |
| Avoid (style anti-patterns) | No mixing flat/skeuomorphic, no emoji-as-generic-icons (galaxy planets are the one sanctioned exception per plan §4.1) | ✅ already ruled |

**Locked stance:** never add parallax, page transitions, or GSAP-style choreography.
The site's motion vocabulary = entrance reveals (≤ 500ms) + hover states (200ms) +
one slow orbital ring + the galaxy interaction. Nothing faster, nothing busier.

### 1.2 Palette (already tokenized — validate, don't change)

- Warm paper `#faf9f6` bg, white cards, stone-900 ink — matches the skill's
  "warm off-white" minimal guidance.
- One indigo accent `#4f46e5` + per-topic muted hues (sky/teal/violet/amber/mars/ice)
  for galaxy planets — this is the "brand primary + artistic interpretation" move.
- ONE gradient (indigo→cyan) reserved for hero ring + galaxy sun (plan §4.1).
- Dark mode: already implemented via CSS variables; verify contrast passes in dark
  (accent lifts to indigo-400 — good).

**No palette work needed.** Any future tweak goes through `--color-*` tokens in
`src/app/globals.css`, never raw hex in components.

### 1.3 Typography (one considered tweak available)

Current: Space Grotesk (display) + Inter (body) + Geist Mono (terminal eyebrows).

Skill's `data/typography.csv` has an exact match for this project:
**#3 Tech Startup — Space Grotesk (headings) + DM Sans (body)** —
"tech, startup, modern… Space Grotesk has unique character, DM Sans is highly readable."

- Keep Space Grotesk for display. **Optional swap:** Inter → DM Sans for body copy
  (DM Sans is the skill-verified pair; Inter is the safer/neutral choice). Low risk,
  low payoff — decide when polishing S9.
- Geist Mono for eyebrows is a deliberate deviation (terminal `~/section` labels,
  plan §4.1) — keep it; it's the identity's personality marker.
- Baseline rules: body ≥ 16px, line-height ≥ 1.5, no body text < 12px (skill
  `ux` priority 6).

### 1.4 Motion & interaction spec (locked values)

| Element | Spec | Where |
|---|---|---|
| Section reveal | fade-up 24px, 500ms easeOut, once, −80px viewport margin | `ui/Section.tsx` (done) |
| Hover | 200ms, translate-y −2px + accent border + shadow lift | `ui/Card.tsx` (done) |
| Role rotation | 2.2s interval, 500ms fade/slide, stops under reduced-motion | `Hero.tsx` (done) |
| Orbit ring | CSS spin 24s linear, pauses for reduced-motion | `Hero.tsx` (done) |
| Galaxy panel | 250ms fade-up; add Escape-to-close + focus handling (P0) | `LearningGalaxy.tsx` |
| All motion | gated by `useReducedMotion` / `prefers-reduced-motion` | across app (done) |

### 1.5 Anti-patterns to avoid (from skill UX data)

- **Hover-only interactions** → touch devices never see them. Galaxy moons light on
  hover *and* focus; mission brief is reachable by click/tap (done — keep it that way).
- **Instant state changes (0ms)** → all feedback has ≥ 150ms transitions.
- **Focus rings removed** → `:focus-visible` outline is global (done).
- **Emoji as icons** → only inside galaxy planets (plan §4.1 sanction).
- **Contrast on colored elements** → text stays dark-on-light; colored elements are
  icons/badges/rings only (plan §4.1).

---

## 2. Current state audit

Phase 1 (frontend) is **done**. Phase 2 (admin CMS) is **half done**. Phase 3 (deploy) **not started**.

| Area | State | Details |
|---|---|---|
| Design tokens, fonts, dark mode, reduced-motion | ✅ | `globals.css`, `layout.tsx` |
| UI primitives (Button, Card, Badge, Eyebrow, Section, BrandIcon, ThemeToggle) | ✅ | `src/components/ui/` |
| Header (sticky, nav, momentum badge, GitHub, theme) | ✅ | now with **mobile nav** + scrolled shadow (`Header.tsx`) |
| Footer (OpenMoji credit, deploy badge) | ✅ | badge link uses `config.github` (no hardcode) |
| All 8 sections + GithubStrip | ✅ | `src/components/sections/` |
| Scroll reveal + zero-data policy | ✅ | `Section.tsx` + every section returns `null` when empty |
| Content boundary (seed → Mongo) | ✅ | `lib/content.ts`, `lib/seed.ts`, `types/`, `models/` |
| NextAuth v5 + login + middleware gate | ✅ | `lib/auth.ts`, `/admin/login`, `middleware.ts` |
| **Admin CRUD** (list + forms + API routes) | ✅ | registry `lib/collections.ts`, routes `/api/admin/[collection]`, pages `/admin/[collection]` + `/new` + `/[id]`; revalidates the site after each mutation |
| Cloudinary upload route | ⏳ | dep + `next.config` remotePatterns ready; upload endpoint is the last P1 item |
| Blog markdown rendering | ✅ | `/blog/[slug]` SSG + react-markdown; cards link to posts |
| Mobile navigation | ✅ | hamburger panel, 44px targets, Escape/aria-expanded |
| Skip-to-content link | ✅ | first tab stop in `layout.tsx` |
| Custom 404 | ✅ | `not-found.tsx` — “Lost in space — rerouting to Mission Control” |
| Ctrl+K terminal easter egg | ✅ | `TerminalEasterEgg.tsx` (help/whoami/ls/pwd/date/clear/exit) |
| ISR on home + blog | ✅ | `revalidate = 60` + revalidatePath on mutations |
| Git repo / deploy / deploy badge data | ❌ | not a git repo yet; `public/deploy-meta.json` empty — needs your Vercel account (P2) |

---

## 3. Section-by-section UI/UX plan

### Chrome

**Header** (exists)
- *Keep:* sticky, backdrop blur, momentum badge, GitHub icon, ThemeToggle.
- *Add (P0):* **mobile nav** — hamburger (lucide `Menu`/`X`) opening a small dropdown
  panel with the same `NAV_LINKS`; close on selection and on Escape; `aria-expanded`
  on the toggle; nav links 44px touch targets (skill: touch target size).
- *Add (P1):* scroll state — subtle shadow/border intensification when scrolled.
- *Optional (P2):* scroll-progress "flight path" line under the header (plan §4.2).

**Footer** (exists)
- *Keep:* identity line, OpenMoji CC BY-SA 4.0 credit, deploy badge.
- *Add (P1):* make the whole footer a proper `<footer>` with `nav` landmark for
  secondary links (reuse social links) — currently only identity + badge.

### 1 · Hero (exists — light touches)
- *Keep:* rotating roles, momentum badge, orbital ring, CTAs, scroll cue.
- *Add (P0):* **skip link target** — `#hero` isn't the main content; put `id="main"`
  on `<main>` and a "Skip to content" link first in `layout.tsx` (skill UX #45).
- *Add (P1):* render `config.currentlyLearning` in the momentum badge instead of the
  hardcoded "Kubernetes" string (currently hardcoded — violates the content boundary).
- *Check:* `min-h-[85dvh]` leaves no horizontal scroll at 375px (verify in browser).

### 2 · GitHub strip (exists)
- *Keep:* build-time fetch, zero-data guards (renders nothing on failure/zeros).
- *Add (P1):* link the "n repos" text to the GitHub profile — currently informational,
  but it's the one stat worth a click-through.

### 3 · Skills (exists)
- *Keep:* honest 1–5 level bars, icon tiles, auto-hide.
- *Add (P1):* per-card color (use per-topic hues: cloud=sky, devops=teal, ai=violet)
  for the icon tile instead of accent-soft everywhere — adds the "colorful but
  restrained" personality without touching the palette.

### 4 · Learning Galaxy (centerpiece — orbit rework shipped)
- ✅ **Planets actually orbit**: each rides its own rotating ring (CSS spin, per-planet
  radius + speed, inner faster) and counter-rotates so icons/labels stay upright.
- ✅ **Orbits pause on hover/focus** (no moving targets to click); reduced-motion users
  keep the static table fallback.
- ✅ Sun breathing glow (the one sanctioned gradient), **spotlight dim** on hover/focus,
  repo-count bubbles, moon-type legend, mission log beside the system on desktop.
- ✅ Dialog hygiene: Escape closes the mission brief; focus moves in and returns to the
  planet on close; `aria-expanded` on planets.
- *Not shipped:* constellation lines (conflict with CSS-driven rotation — revisit if
  orbits become JS-positioned); drag-to-rotate + comet trails (P2 tier).

### 5 · Projects (exists)
- *Keep:* featured lead card + grid, tech badges, GitHub/live links, auto-hide.
- *Add (P1):* **cover images** once Cloudinary upload exists — `coverImage` field is
  already in the type; render with `next/image` + Cloudinary remote pattern. Empty
  covers stay fine (cards don't reserve image space — zero CLS either way).
- *Add (P1):* hover arrow slide on links (`ArrowUpRight` nudges right on hover).

### 6 · Experience (exists)
- *Keep:* timeline, auto-hide when empty (it is empty in seed — good, honest).
- *Add (P1):* **designed empty-state variant** — plan §5.4: when the section is
  *intentionally shown* but empty, show "This constellation is still forming" instead
  of hiding. Decide via a `sectionsEnabled` flag + a CMS "show even when empty" toggle.

### 7 · Certifications (exists)
- *Keep:* verify links as the proof (no scraped logos), category badges.
- *Add (P1):* issuer logos via official badge embeds only (plan §4.3); otherwise leave.

### 8 · Blog / Notes (exists — biggest feature gap)
- *Keep:* cards with read time, tags, auto-hide.
- *Add (P0):* **blog detail pages** — `/blog/[slug]`, rendered with **react-markdown**
  (already installed, currently dead weight). Card becomes a link; page shows title,
  date, tags, rendered markdown, back link. This activates the CMS's markdown textarea.
- *Add (P1):* `generateStaticParams` + `dynamicParams = false` for SSG slugs; a tiny
  "reading time" on the detail page; prose styling (`prose` classes or manual
  component map) so headings/code/lists match the design system.

### 9 · Contact (exists)
- *Keep:* copy-email + toast, mailto form, socials. Zero backend by design (D4).
- *Add (P1):* social icons as proper lucide/simple-icons instead of text labels;
  `aria-label` per icon link.
- *Note:* mailto-only means form data is never tracked — that's a feature (privacy),
  state it in the copy if desired.

### Admin CMS (not built — core feature, P0)
- `/admin` dashboard exists; **build the CRUD**: list + form views at `/admin/[collection]`
  and `/admin/[collection]/[id]`, session-checked `/api/admin/*` route handlers,
  markdown textarea for posts, Cloudinary upload at `/api/upload`, `revalidatePath`
  after every mutation. This is the project's "hiring-proof" centerpiece (agents.md).
- UI treatment: keep it plain and fast (plan D10) — tables + forms, terminal-styled
  `~/collection` eyebrows, same tokens as the site so it feels owned, not bolted on.

---

## 4. Feature roadmap (prioritized)

### P0 — UX correctness ✅ done
1. ✅ Mobile nav (hamburger + panel) — `Header.tsx`
2. ✅ Skip-to-content link — `layout.tsx`
3. ✅ Mission-brief dialog: Escape close + focus in/return — `LearningGalaxy.tsx`
4. ✅ Blog detail pages with react-markdown — `/blog/[slug]` + card links
5. ✅ Hero momentum badge reads `config.currentlyLearning` (kill hardcode)
6. ✅ **Admin CRUD** — registry, list + form pages, session-checked API routes, revalidatePath after every mutation

### P1 — Polish & features (mostly done)
7. ⏳ Admin Cloudinary upload route (`/api/upload`) + project covers via `next/image` (config ready; endpoint left for next pass)
8. ✅ Skills icon tiles per-topic color
9. ✅ Custom 404 “Lost in space — rerouting to Mission Control” (`not-found.tsx`)
10. ✅ GitHub strip count links to profile; scrolled-header shadow
11. ✅ Blog SSG (`generateStaticParams`), reading-time on detail, `.markdown` prose styling
12. ✅ Contact socials as icons (simple-icons; note: simple-icons 16 dropped LinkedIn — renders text-only)
13. ✅ ISR `revalidate = 60` on home + blog (plan S13)

### P2 — Deploy & delight (needs your account)
14. `git init` → commit → Vercel import → populate `deploy-meta.json` → Lighthouse > 90
15. ✅ Ctrl+K fake terminal easter egg (`help`, `whoami`) — plan §4
16. Designed empty-state variant for Experience/Blog (plan §5.4)
17. Scroll-progress flight path; “farthest mission” sparkle badge

---

## 5. Accessibility & UX checklist (from skill priority table)

Run this before every release; all rules are already partially enforced — verify, don't rebuild.

| # | Rule (skill priority) | Current status |
|---|---|---|
| 1 | Contrast 4.5:1 for body text | ✅ tokens; re-check dark mode after any palette change |
| 2 | Touch targets ≥ 44px (web: WCAG target size) | ⚠️ nav links + filter chips are small — bump padding on mobile |
| 3 | Visible focus ring on every control | ✅ global `:focus-visible`; keep for new dialog/nav |
| 4 | Full keyboard nav, tab order = visual order | ✅ galaxy planets focusable + mission brief focus in/return; new mobile nav Escape-aware |
| 5 | Reduced motion respected everywhere | ✅ `useReducedMotion` + CSS media query |
| 6 | Hover never the only interaction | ✅ galaxy uses focus too; keep for all new UI |
| 7 | Empty states guide, never blank | ✅ zero-data policy; add §5.4 designed empties in P2 |
| 8 | Loading feedback for async work | ✅ admin forms + lists have pending/loading + error states |
| 9 | No horizontal scroll at 375px | ⚠️ verify galaxy + mission brief on phones (manual pass) |
| 10 | Auto-rotating content has controls | ✅ rotating roles are decorative text, not content (fine) |
| 11 | Skip link on nav-heavy pages | ✅ first tab stop in `layout.tsx` |

---

## 6. Design tokens reference

**Locked values (do not change):**
- `--color-paper: #faf9f6` · `--color-ink: #1c1917` · `--color-accent: #4f46e5`
- `--color-accent-cyan: #06b6d4` (hero ring + sun ONLY)
- Per-topic hues `--color-topic-*`, moon tints `--color-moon-*`
- Radius: card 12px, pill 9999px · Shadows: `shadow-card` / `shadow-card-hover` / `shadow-orbital`
- Fonts: Space Grotesk / Inter / Geist Mono

**New tokens when needed (add to `@theme`, never inline):**
- `--color-moon-*` already covers moon types; add `--color-success`/`--color-danger`
  for admin form feedback if missing
- `--shadow-scrolled` for the header scrolled state (P1)

---

## 7. Using the installed tools

### 21st MCP (magic-mcp) — configured, needs your API key
- Config: `.vscode/mcp.json` → server `21st` (HTTP `https://21st.dev/api/mcp`).
- VS Code prompts for the key at first start (`${input:21stApiKey}`) — get a free key
  at **https://21st.dev/mcp** (old Magic keys were reset). The package
  `@21st-dev/magic` remains a compatibility proxy; the CLI
  `npx @21st-dev/cli@latest init --client vscode` can also generate this.
- Use it to search/generate React/Tailwind components (e.g. the admin forms, mobile
  nav) — then adapt results to this design system's tokens.

### ui-ux-pro-max skill (7 skills installed to `.agents/skills/`)
- Flagship: **ui-ux-pro-max** (design intelligence), plus ui-styling (shadcn/Tailwind
  impl), design-system (token architecture), brand, design, banner-design, slides.
- The search script needs Python 3 (`scripts/search.py`) — **not installed on this
  machine** (only the MS Store stub). Either install Python 3, or read the data
  directly: `.agents/skills/ui-ux-pro-max/data/*.csv` (styles, colors, typography,
  landing, ux-guidelines, products, charts, icons) and `references/quick-reference.md`
  (all 119 UX guidelines).
- Load it by name with the `skill` tool when designing/building UI in this session.
