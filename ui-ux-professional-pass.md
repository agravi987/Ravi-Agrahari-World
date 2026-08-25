# UI/UX Professional Pass — Plan

**Goal:** Make the site feel cleaner, more professional, and more attractive with decent, purposeful animations — while keeping the Learning Galaxy intact.

**Guiding UX rules applied (from ui-ux-pro-max):**
- `excessive-motion` — Animate 1-2 key elements per view max
- `motion-meaning` — Every animation must express a cause-effect, not decoration
- `spring-physics` — Prefer spring curves for hovers/presses
- `exit-faster-than-enter` — Exit duration = 60% of enter
- `stagger-sequence` — Stagger list items by 30-50ms
- `no-emoji-icons` — Use SVG icons, not emojis (structural UI)
- `primary-action` — ONE clear primary CTA per screen
- `elevation-consistent` — Consistent shadow scale

---

## Change 1: `globals.css` — Animation tokens & spring physics

**What:** Add a spring-based easing token. Replace all `ease-out` hover/press transitions with a professional spring curve. Clean up excessive keyframes.

**Files:** `src/app/globals.css`

- Add `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` and `--ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1)` to `@theme`
- Replace hover `transition: transform 0.2s ease` with `transition: transform 0.25s var(--ease-spring)` across `.galaxy-planet`, `.galaxy-moon`, `.cover-shine`, nav links
- **Remove** `constellation` class + keyframe (pure decoration, not meaning)
- **Remove** `float-slow` / `float-slower` keyframes (unused or replace with simpler hover-only)
- **Remove** `halo-pulse` animation → static halo (background decoration should not breathe)
- Keep: `hero-in`, `hero-fade`, `section-reveal`, `skill-swap-in`, `orbit-spin` (all purposeful)
- Keep: galaxy animations (orbit-spin, planet-face-motion, nebula-drift, comet) — these ARE the product
- Simplify: `animate-divider-flow` → static gradient (no flow animation)

---

## Change 2: `Hero.tsx` — Clean CTA hierarchy, remove visual noise

**What:** One primary CTA, one secondary. Remove 4 competing elements.

**File:** `src/components/sections/Hero.tsx`

- **Remove** "Copy email" button → move functionality into Contact section
- **Remove** quick-jump chips nav (Skills/Projects/Blog/Contact) — duplicates header nav
- **Remove** "press ? for shortcuts" hint — move to footer or remove
- **Change** secondary CTA from "Explore the galaxy" → "View projects" (recruiters understand this)
- **Remove** `text-shimmer` from name → keep gradient text but static (the shimmer is noise)
- **Remove** constellation dot-grid background div
- **Remove** word-by-word headline stagger → render as plain `<p>` (it delays reading)
- Keep: typewriter role (ONE signature animation), photo tilt (interactive, meaningful)
- Keep: floating chips (they provide context about learning streak + public learning)

---

## Change 3: `GradientMesh.tsx` — Tone down or remove

**What:** 5 drifting color blobs behind the hero is too much. The hero already has a gradient glow.

**File:** `src/components/ui/GradientMesh.tsx`

- **Replace** 5-blob mesh with a single subtle radial gradient (indigo, ~10% opacity, centered)
- This keeps the "color depth" feel without visual noise

---

## Change 4: `SectionDivider.tsx` — Static accent line

**What:** Animated rainbow divider is noise. A clean static accent line is more professional.

**File:** `src/components/ui/SectionDivider.tsx`

- Replace `animate-divider-flow` rainbow gradient with a static subtle gradient (indigo → transparent)
- Remove `useReducedMotion` import (no animation = no need)
- Result: a clean 1px accent line between sections

---

## Change 5: `Header.tsx` — Simpler, cleaner

**What:** Remove the animated progress bar and gradient hairline.

**File:** `src/components/Header.tsx`

- Remove `progress` state and the flight-path progress line div (the scroll progress adds visual noise for no clear purpose)
- Replace the `bg-gradient-to-r from-accent via-accent-cyan to-topic-ai` top hairline with a simple solid `bg-accent/20` 1px line — the rainbow hairline fights with the content
- Keep: scroll shadow (meaningful — shows you've scrolled)

---

## Change 6: `MomentumStats.tsx` — Rename, keep count-up

**What:** "galaxy planets" is insider jargon. Count-up animation is good (purposeful).

**File:** `src/app/page.tsx` (where stats are defined)

- Change label "galaxy planets" → "learning tracks"
- Keep count-up animation (it's meaningful — numbers growing = progress)
- Keep stagger delay (120ms per cell — follows `stagger-sequence` rule)

---

## Change 7: `Hero.tsx` — Replace emoji with SVG

**What:** 🔥 emoji → Lucide `Flame` icon (rule: `no-emoji-icons`).

**File:** `src/components/sections/Hero.tsx`

- Replace `<span className="flame-flicker">🔥</span>` with `<Flame className="h-3.5 w-3.5 text-topic-mars" />` from lucide-react
- Keep the floating chip (it communicates learning streak — meaningful)

---

## Change 8: `CursorGlow.tsx` — Reduce intensity

**What:** The 700px ambient glow is too large and too opaque. Make it subtler.

**File:** `src/components/ui/CursorGlow.tsx`

- Reduce opacity from `0.07/0.04` → `0.04/0.02` (barely visible, premium feel)
- Reduce size from 700px → 500px (tighter to cursor)

---

## Change 9: `TechMarquee.tsx` — Remove planet emoji from chips

**What:** Planet chips show emoji alongside text → inconsistent with skill chips that show a colored dot.

**File:** `src/components/sections/TechMarquee.tsx`

- Remove emoji display from planet chips → show colored dot only (consistent with skill chips)
- The galaxy page keeps planet emojis (content, not UI chrome)

---

## Change 10: `Hero.tsx` — Sticky CTA bar removal

**What:** The sticky bottom CTA bar appears after scrolling past the hero. It competes with the header (which is already sticky). Rule: `avoid-mixed-patterns`.

**File:** `src/components/sections/Hero.tsx`

- Remove the entire sticky CTA bar block (`pastHero && !ctaDismissed`)
- Remove `usePastHero` hook
- Remove `ctaDismissed` state
- Remove `hero-cta-sticky` CSS class usage
- The header already provides persistent navigation — this bar is redundant

---

## Change 11: `globals.css` — Clean up CSS animations

**What:** Remove dead/unused animation classes.

**File:** `src/app/globals.css`

- Remove `constellation` + `constellation-twinkle` keyframe
- Remove `float-slow` / `float-slower` + `float-slow` keyframe (if unused in components)
- Remove `halo-pulse` keyframe → static halo
- Simplify `animate-divider-flow` → just a div with a gradient, no animation
- Add `--ease-spring` token for hover transitions

---

## Summary of net changes

| Element | Before | After |
|---------|--------|-------|
| Hero CTAs | 3 buttons + social + chips + shortcut hint | 2 buttons + social row |
| Sticky CTA bar | Appears on scroll | Removed |
| Gradient mesh | 5 drifting blobs | Single subtle radial |
| Section divider | Animated rainbow | Static accent line |
| Header hairline | Rainbow gradient | Solid accent |
| Header progress line | Animated | Removed |
| Name text | Gradient + shimmer | Gradient only (static) |
| Headline | Word-by-word stagger | Plain text |
| Constellation background | Twinkling dots | Removed |
| Halo behind photo | Pulsing | Static |
| 🔥 emoji | Emoji | Lucide Flame icon |
| Stat label | "galaxy planets" | "learning tracks" |
| Cursor glow | 700px, 0.07 opacity | 500px, 0.04 opacity |
| Planet chip emoji | Emoji in marquee | Colored dot (consistent) |
| Hover transitions | `ease` curves | Spring physics curves |

**Animations KEPT (purposeful):**
- Typewriter role (ONE signature hero animation)
- Photo tilt on hover (interactive, meaningful)
- Scroll-reveal for sections (progressive disclosure)
- Galaxy orbit system (the product itself)
- Count-up stats (meaningful progress signal)
- Floating chips (context about learning streak)
- Marquee ticker (content discovery)

**Animations REMOVED (decorative noise):**
- Constellation twinkle
- Name shimmer
- Word-by-word headline
- Halo pulse
- Gradient mesh drift
- Divider flow animation
- Header progress line
- Sticky CTA bar appearance
