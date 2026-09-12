# Frontend Audit — 200+ improvements, bug fixes & enhancements

Scope: full public frontend — `src/app/**` (home, blog, blog/[slug], blog/tag, not-found, error, loading states), `src/components/**` (Header, Footer, all sections, galaxy preview, all 38 `ui/` primitives), `src/lib/**` (hooks, theme, nav, scroll), `globals.css`.

Tags: **[BUG]** broken/incorrect behavior · **[A11Y]** accessibility · **[PERF]** performance · **[UX]** usability/interaction · **[POLISH]** visual/consistency · **[CLEANUP]** dead code/refactor.

Priority stars: ⭐⭐⭐ do first · ⭐⭐ this week · ⭐ whenever.

---

## Quick wins (highest impact / lowest effort)

1, 2, 3, 4, 5, 6, 8, 9 (SPA reload bugs), 13 (form double-validation), 19–20 (contrast), 24 (double progress bars), 32 (dead scroll cue), 77 (emoji → icons), 111 (toast exit), 121 (BackToTop), 144 (scroll cue restore), 160 (iOS input zoom).

---

## A. SPA navigation correctness (silent full-page reloads)

These render raw `<a href="/some-route">` to internal routes. In the App Router that's a **full document reload** — losing SPA state, replaying theme/palette init, and re-downloading the page. Every one should use `next/link` (or the existing `useSmartNav` for hash links).

1. ⭐⭐⭐ [BUG] `TechMarquee.tsx` — every stack chip is a raw `<a>` → clicking any tech reloads the whole site. Use `Link` (with `hrefFor` logic kept).
2. ⭐⭐⭐ [BUG] `MomentumStats.tsx` — internal stat links (`/blog`, `#projects`) render raw `<a>`; `/blog` does a full reload. Use `Link` for non-`http` hrefs.
3. ⭐⭐⭐ [BUG] `GalaxyPreview.tsx` — "Explore my galaxy" CTA + all planet chips are raw `<a>` → reload. Use `Link`.
4. ⭐⭐⭐ [BUG] `Hero.tsx` — "currently learning" badge (`/detailed-galaxy`) is a raw `<a>` → reload. Use `Link`/smartNav.
5. ⭐⭐⭐ [BUG] `GalaxyPreviewStage.tsx` — the 3D stage anchor is raw `<a>` → reload. Use `Link`.
6. ⭐⭐ [BUG] `not-found.tsx` — quick links are raw `<a>`; use `Link` for consistency (also fixes middle-click prefetch).
7. ⭐⭐ [UX] `Hero.tsx` `jumpSection` duplicates `useSmartNav`/`scrollToSection` logic — reuse the shared helper so behavior can't drift.
8. ⭐⭐ [BUG] `Certifications.tsx` — planet deep-link wrapped around the category badge is a raw `<a>` → reload. Use `Link`.
9. ⭐⭐ [BUG] `Skills.tsx` — "explore in galaxy →" link is a raw `<a>` → reload. Use `Link`.
10. ⭐ [PERF] Audit remaining raw internal `<a>`s with a lint rule (`@next/next/no-html-link-for-pages` covers some; galaxy anchors need `Link` with hash + `scroll` handling).

## B. Functional bugs

11. ⭐⭐⭐ [BUG] `Projects.tsx` — grid wrapper uses `role="grid"` but contains no `role="row"`/`gridcell` (invalid ARIA). Drop the role or make it `role="list"` with `role="listitem"` cards.
12. ⭐⭐ [BUG] `Projects.tsx` — arrow-key grid math assumes a uniform 2-col grid, but featured cards are `sm:col-span-2`, so ↓/↑ land on wrong cards. Account for spans or navigate linearly.
13. ⭐⭐⭐ [BUG] `Contact.tsx` — form relies on custom validation but has no `noValidate`, so native browser bubbles fire *before* `onSubmit` and fight the inline errors. Add `noValidate`.
14. ⭐⭐ [BUG] `Experience.tsx` — timeline track "grows" but the math sets `--track-progress = 1 − visible`, so the line is **full on entry and shrinks as you scroll**. Inverted vs. the stated intent — verify and flip.
15. ⭐⭐ [BUG] `Skills.tsx` — auto-advance timer keeps cycling while the section is scrolled off-screen; user returns to a different domain than they left. Gate on IntersectionObserver.
16. ⭐⭐ [BUG] `globals.css` — `.img-shimmer > img.loaded + ::before` / `~ ::before` are invalid selectors (pseudo-element can't be a sibling combinator target); they never match. Delete (the TS class toggle already handles it).
17. ⭐⭐ [BUG] `globals.css` — `mesh-drift` keyframes have no consumer (GradientMesh is static now). Dead code — remove.
18. ⭐⭐ [BUG] `Hero.tsx` — `ParticleField` canvas is `absolute z-0` while the text column is static/unpositioned, so dots paint **above** hero text (subtle). Move canvas to `-z-10` or make the content wrapper `relative`.
19. ⭐⭐⭐ [BUG] `lib/tagHue.ts` — badge text uses soft `text-topic-*` hues at 12px — fails AA contrast (the exact bug the P25 audit fixed for marquee/preview chips using `deep-*`). Switch `tagHueClasses` text classes to `topic-*-deep`.
20. ⭐⭐⭐ [BUG] `CodeBlock.tsx` — `LANG_HUES` bar text uses soft `text-topic-*` on `bg-topic-*/10` — same AA fail. Use deep tokens (bar) + soft (dot).
21. ⭐⭐ [BUG] `TableOfContents.tsx` — docs promise a mobile chip list; only the desktop `aside` renders. Add the mobile `<details>` TOC or fix the comment.
22. ⭐⭐ [BUG] `blog/[slug]/page.tsx` — "Keep reading" related posts follow unsorted array order; sort by `dateMs` desc so they're newest-first.
23. ⭐ [BUG] `Experience.tsx` `durationOf` — 12 months renders "1.0y"; want "1y" (and "2y" not "2.0y").
24. ⭐⭐⭐ [BUG] Blog post pages show **two** reading indicators at once: `ScrollProgressBar` (3px site-wide) + `ReadingProgress` (2px article). Suppress ScrollProgressBar on post pages (or everywhere and keep the BackToTop ring).
25. ⭐ [BUG] `ParticleField.tsx` / `CursorGlow` — accent color read once at mount; switching theme mid-session leaves stale color. Re-read on `data-theme` change.
26. ⭐ [BUG] `ThemeToggle.tsx` — reads `localStorage` during render (impure; React-compiler hostile). Move into an effect/store snapshot.
27. ⭐ [BUG] `Shortcuts.tsx` — shortcut list hardcodes "⌘K" while the site has `CmdKey` for platform-correct labels. Reuse it.
28. ⭐⭐ [BUG] `Hero.tsx` — scroll cue hardcodes `#skills`; if the skills section is CMS-disabled it's a dead jump. Target the first enabled section (data exists in page.tsx).
29. ⭐ [BUG] `Skills.tsx` — `style={{ minHeight: "inherit" }}` on inactive panels inherits `auto` — no-op. Remove.
30. ⭐ [CLEANUP] `Badge.tsx` — `colored` variant is byte-identical to `accent` (className overrides always supply the real color). Collapse to two variants.
31. ⭐ [BUG] `MomentumStats.tsx` — `grid sm:grid-cols-5` fixed; with a hidden section you get 4 cells in a 5-col grid (ragged gap). Use `auto-fit`/`justify-center`.
32. ⭐ [BUG] `Button.tsx` — `<a>` branch spreads `{...rest}` (which includes `children`) *and* renders `{rest.children}` explicitly. Redundant double-prop; drop the explicit one.
33. ⭐ [BUG] `Experience.tsx` — company logo `<img>` has no `onError` fallback; a broken CMS URL shows a broken-image glyph. Fall back to the monogram.
34. ⭐ [BUG] `BlogArchive.tsx` — the search "×" also silently resets the tag filter while its label says "Clear search". Either label it "Clear all" or only clear the query.
35. ⭐ [BUG] `MomentumStats.tsx` — `ICON_BY_LABEL` string-matching against display labels is fragile (CMS rename silently drops icons). Pass icon keys as data from `page.tsx`.
36. ⭐ [BUG] `Projects.tsx` — thumbnail strip uses `role="tablist"`/`tab` without a controlled tabpanel/`aria-controls`. Simplify to plain buttons with `aria-current`.
37. ⭐ [BUG] `Dialog.tsx` — when `description` is undefined, Radix warns about missing `Description`/`aria-describedby`. Always render a visually-hidden Description.
38. ⭐ [BUG] `BackToTop.tsx` — `setProgress` runs on **every** scroll frame (two setStates). Throttle to meaningful deltas (e.g. only when the rounded % changes).
39. ⭐ [BUG] `Header.tsx` — `/` shortcut opens the palette but the guard misses `role="combobox"`-style hosts that aren't INPUT/TEXTAREA (e.g. custom editors). Also check `closest('[contenteditable]')` on parents.
40. ⭐ [BUG] `Hero.tsx` — `sizes="... 360px"` on the portrait while the layout width is 260px — wastes bytes. Align to actual width.

## C. Accessibility

41. ⭐⭐⭐ [A11Y] Touch targets: dozens of `text-xs` pills (tags, filters, share/copy, footer links) are <24px tall. Add a coarse-pointer min-height (`@media (pointer: coarse)`) or pad to ~44px on mobile.
42. ⭐⭐⭐ [A11Y] Filter semantics are inconsistent: blog/skills/certs use `role="tab"`+`aria-selected`, projects/certs-categories use `aria-pressed` buttons. Pick one pattern (recommend `aria-pressed` toggle group) and unify.
43. ⭐⭐ [A11Y] `TechMarquee.tsx` — reduced-motion freezes the track mid-chip (half-cut chips, rest unreachable). For reduced motion render a static wrapped chip list instead.
44. ⭐⭐ [A11Y] `SectionRail.tsx` — icon-only dots rely on `title` only; add `aria-label` and `aria-current="true"` on the active dot.
45. ⭐⭐ [A11Y] `Contact.tsx` — error summary is a plain list; link each item to its field (`<a href="#name">`) so keyboard/SR users can jump.
46. ⭐⭐ [A11Y] `Contact.tsx` — per-field `role="alert"` errors **and** a summary `role="alert"` = double announcements. Keep the summary as alert; make inline ones `role="status"` or visually-linked text.
47. ⭐⭐ [A11Y] `Contact.tsx` — the character counter `aria-live="polite"` announces on every keystroke. Make it `aria-hidden` and announce only at thresholds (e.g. 50 chars left).
48. ⭐⭐ [A11Y] `Toast.tsx` — toasts can't be dismissed by pointer, only auto/Escape. Add a click-to-dismiss (and an ✕ button).
49. ⭐⭐ [A11Y] `ThemeToggle.tsx` — popover doesn't move focus on open; keyboard users must Tab blindly. Focus the selected option on open; restore on close.
50. ⭐⭐ [A11Y] `CommandPalette.tsx` — `role="option"` on `<button>` elements is non-idiomatic (interactive inside listbox); use `div role="option"` rows or a proper `aria-activedescendant` pattern with one focusstop.
51. ⭐⭐ [A11Y] `CommandPalette.tsx` — no match highlighting or result-count announcement; add `aria-live` "N results" and highlight the matched substring.
52. ⭐⭐ [A11Y] `MomentumStats.tsx` — link cells' accessible name comes from `title` only ("Jump to projects"); add sr-only link text.
53. ⭐⭐ [A11Y] `Experience.tsx` — expanded detail panel has no `role="region"` + `aria-labelledby` tie to its row button.
54. ⭐⭐ [A11Y] External links: only Hero adds "(opens in a new tab)" to the accessible name. Standardize across socials, cert Verify, post shares, GitHub links.
55. ⭐⭐ [A11Y] Social/profile links: add `rel="me"` (IndieWeb) alongside noopener on personal profiles; sitewide `referrerPolicy="strict-origin-when-cross-origin"` for outbound.
56. ⭐⭐ [A11Y] `Projects.tsx` — closing the dialog via a tech-filter chip loses focus to `<body>`; return focus to the originating card.
57. ⭐⭐ [A11Y] `loading.tsx` skeletons have no `aria-busy`/`role="status"`; SR users get silence. Add both.
58. ⭐ [A11Y] `globals.css` — `prefers-contrast: more` overrides only target `.hero`; extend token overrides sitewide (the generic token block exists — verify coverage).
59. ⭐ [A11Y] `Breadcrumbs.tsx` — colored crumbs use soft `text-topic-*` at 14px; switch to deep tokens for AA.
60. ⭐ [A11Y] `Footer.tsx`/`Kbd` hints — decorative `<kbd>` chips are fine, but the "⌘K jump · ? shortcuts" line is meaningless to touch/SR users (already `hidden md:block` — good); add `aria-hidden` to the kbd glyphs.
61. ⭐ [A11Y] `Certifications.tsx` — "Show all" toggle collapses without moving focus; keep focus on the button and announce the new count (`aria-live`).
62. ⭐ [A11Y] `Skills.tsx` — level ring/tooltip info ("1 = getting started…") is Tooltip-only; surface the words in the DOM for SR/touch (the level word exists — tie it to the ring's aria-label).
63. ⭐ [A11Y] `blog/[slug]/page.tsx` — share icons: ensure `aria-label` includes the post title for all three (X/LinkedIn do; CopyLinkButton doesn't — it says "this note" which is fine, but unify format).
64. ⭐ [A11Y] Galaxy page (audit task): verify planet/moon buttons have real accessible names (emoji aria-hidden), card dialog focus management, zoom controls keyboard-reachable, and Esc restores focus.
65. ⭐ [A11Y] `Header.tsx` — mobile menu panel: add `inert`-equivalent behavior for the page behind (focus trap exists; consider `aria-hidden` on `#main` while open).
66. ⭐ [A11Y] `Blog.tsx`/archive search inputs — add a visible label or keep aria-label + icon (icon is `aria-hidden`, ok) but announce result changes: the count `<span>` is `aria-hidden` in Blog while the archive announces — unify.
67. ⭐ [A11Y] `error.tsx` — announce the failure politely (`role="status"` on the intro) and include `error.digest` for support.
68. ⭐ [A11Y] `PageReveal` curtain — decorative full-screen overlay; mark the container `aria-hidden` (it is on the inner div; ensure outer too) and never render for reduced-motion (already gated — verify SSR path).
69. ⭐ [A11Y] Focus visibility on dark covers: white "view project" pill over scrim needs a focus ring for keyboard users (card is focusable but the pill is hover-only).
70. ⭐ [A11Y] `RouteLoader`/`LoadingMessages` — `aria-live="polite"` on a rotating message re-announces every 1.5s; use `aria-live="off"` + one initial announcement.

## D. Visual design & consistency

71. ⭐⭐ [POLISH] Radius scale drift: `rounded-card` (12px), `rounded-2xl` (Dialog), `rounded-[1.35rem]`/`rounded-[1.1rem]` (hero photo), `rounded-xl` tiles. Normalize to the token scale (add `--radius-lg`).
72. ⭐⭐ [POLISH] Social-link UI exists in 3 styles (hero icon pills, contact pills, footer text links) — extract one `SocialLink` primitive.
73. ⭐⭐ [POLISH] `SOCIAL_BRANDS` + `BRAND_HOVER` maps are duplicated in Hero/Contact/Footer with drift already (LinkedIn missing in Hero's brand map). Extract to `lib/social.ts`.
74. ⭐⭐ [POLISH] Emoji-as-icon violations of the site's own rule: Contact presets 🤝💼💬, location 📍, blog "🌌 written while learning", Experience "{n} ✦". Replace with lucide icons (`Handshake`, `Briefcase`, `MessageCircle`, `MapPin`, `Sparkles`).
75. ⭐⭐ [POLISH] `Contact.tsx` success card uses a text "✓" glyph — use the `Check` icon like every other success state.
76. ⭐⭐ [POLISH] Text arrows "↗", "→", "→" hints (GithubStrip, Skills, MomentumStats, GalaxyPreview) vs `ArrowUpRight`/`ArrowRight` icons — unify on icons.
77. ⭐⭐ [POLISH] Blog card CTA "Read note" uses `ArrowRight`, archive uses `ArrowUpRight` — pick one direction language.
78. ⭐⭐ [POLISH] `GalaxyPreview.tsx` CTA hand-rolls the primary button classes — use the `Button` component.
79. ⭐⭐ [POLISH] Chip styling is re-implemented 4× (marquee `CHIP_HUES`, preview `PLANET_HUES`, certs `CATEGORY_HUES`, `tagHue`) — extract one `HueChip` with a hue prop.
80. ⭐⭐ [POLISH] Header nav lacks an Experience link while the footer has it — recruiters scanning the top nav miss it. Add (space exists at md+).
81. ⭐⭐ [POLISH] Footer quick links lack Certifications — add for parity with sections.
82. ⭐ [POLISH] `ProjectCover.tsx` — hash uses only `charCodeAt(0)` of each tech: "React"/"Redux" collide to the same gradient. Hash full strings.
83. ⭐ [POLISH] Status colors (`emerald`, `red`, `amber`) are raw Tailwind families while everything else is tokenized — add `--color-success/-danger/-warning` tokens and migrate.
84. ⭐ [POLISH] Featured ribbon/star uses hardcoded `amber-400/300` — tokenize with the linux hue or a dedicated gold token.
85. ⭐ [POLISH] Nord theme doesn't override `--shadow-orbital` (inherits indigo-tinted glow that clashes with frost accent) — add theme-tinted override.
86. ⭐ [POLISH] `::selection` is accent + white — fails contrast on Nord's light-cyan accent. Use a token-aware selection color (e.g. ink bg / paper text fallback).
87. ⭐ [POLISH] `.galaxy-sun-tagline` is 0.72rem — below the site's own ~12px floor. Bump to 0.8rem.
88. ⭐ [POLISH] Add `text-pretty` to section descriptions & card excerpts (orphans); hero already uses `text-balance`.
89. ⭐ [POLISH] `.markdown` tables: no zebra striping and no horizontal-scroll wrapper — wrap tables in `overflow-x-auto` (mobile) and stripe rows.
90. ⭐ [POLISH] `.markdown` missing task-list checkbox styles, `kbd`, and `<mark>` styles — cheap additions for richer notes.
91. ⭐ [POLISH] `Footer.tsx` — "orbital v1" hardcodes a version; read from `package.json` at build or drop the pill.
92. ⭐ [POLISH] Dark themes: `.img-shimmer` skeleton is near-invisible on dark cards (`paper-deep` on `card` #1c1917) — brighten shimmer stops per theme.
93. ⭐ [POLISH] `CodeBlock.tsx` — `LANG_HUES` missing common langs (go, rust, sql, java, c) → unknown langs get no bar; add a default hue fallback.
94. ⭐ [POLISH] Hero photo card `focus-within` ring exists but the composition is decorative-focused — ensure focus ring shows for the "streak" chip too (it's a `p` with title — not focusable; fine) — audit passes.
95. ⭐ [POLISH] `MomentumStats` numerals: add `font-variant-numeric: tabular-nums` so counting doesn't jiggle layout.
96. ⭐ [POLISH] `BackToTop` progress ring + title tooltip: switch to the shared `Tooltip` component (consistency).
97. ⭐ [POLISH] `Section.tsx` copy-link "#": on touch it's always visible and fights the title — keep visible but reduce prominence (opacity-60, smaller hit area is currently 28px — keep ≥40px on coarse).
98. ⭐ [POLISH] Blog post header: date/read-time/share row wraps awkwardly at ~400px — allow the share cluster to drop to its own row cleanly (`flex-wrap` + `ml-auto` audit).
99. ⭐ [POLISH] `Experience.tsx` period/duration/achievements chip cluster overflows at 320px — allow wrap between chips (verify `flex-wrap` on the right cluster).
100. ⭐ [POLISH] TechMarquee "stack" label overlaps the first chip under ~360px — increase left padding at xs or hide the label below 380px.
101. ⭐ [POLISH] Command palette footer shows "⌘K / ctrl K" — use `CmdKey` for platform truth.
102. ⭐ [POLISH] `ThemeToggle`/palette theme icons + labels are duplicated maps — share `THEME_META` from `lib/theme.ts`.
103. ⭐ [POLISH] `CommandPalette.tsx` — "GitHub profile" action uses the `Home` icon; use `Github`/`BrandIcon`.
104. ⭐ [POLISH] Add `-webkit-tap-highlight-color: transparent` for custom card/chip taps (plus visible active states so taps still register visually).
105. ⭐ [POLISH] Print: gradient text (`.text-gradient`) can print blank in some engines — add `print-color-adjust: exact` or a solid-color print fallback.
106. ⭐ [POLISH] Print: hide `LevelSpread`, CmdKey/Kbd hints, marquee label, SectionRail (already position:fixed hidden?) — audit print pass end-to-end.
107. ⭐ [POLISH] Consolidate the three separate `@media print` blocks in globals.css into one section.
108. ⭐ [POLISH] Scrollbar: `*` selector applies themed scrollbars to nested scroll areas too (thumbnail strip) — fine, but thumb contrast on dark themes is low — verify.
109. ⭐ [POLISH] `Eyebrow` cursor option is used only on the last section — formalize which section gets it (docs/comments).
110. ⭐ [POLISH] `Hero.tsx` gradient divider + title sweeps + mesh + halo + orbit ring = 5 decoration layers in one hero — pick two (recommend: photo frame gradient + orbit ring) for a more professional read.

## E. Micro-interactions & motion

111. ⭐⭐⭐ [UX] Toasts vanish instantly (no exit). The plan's own rule: exit faster than enter — add a 120ms fade/slide-out.
112. ⭐⭐ [UX] Scroll cue hides forever after first scroll — restore it when the user returns to top (`scrollY < 24`).
113. ⭐⭐ [UX] `Projects.tsx` "Explore more" expands but can't collapse (Certifications has "Show fewer"). Add collapse parity.
114. ⭐⭐ [UX] `Experience.tsx` accordion rows pop open with no height transition — animate `grid-template-rows` 0fr→1fr for a smooth expand.
115. ⭐⭐ [UX] `BackToTop.tsx` appears via conditional render (no transition) — fade/scale in.
116. ⭐⭐ [UX] `CommandPalette.tsx` panel has no entrance animation — add scale+fade from top (matches Dialog language).
117. ⭐⭐ [UX] `ThemeToggle.tsx` popover pops instantly — add transform-origin top-right scale-in (the icon has one; the menu doesn't).
118. ⭐ [UX] `.title-sweep.animated` runs an infinite 4s gradient loop on every section title — run 2 cycles then settle (premium = still; also saves battery).
119. ⭐ [UX] `.gradient-text` (hero name) shifts every 6s forever — slow to 10–12s or animate once.
120. ⭐ [UX] `Magnetic.tsx` — transition uses `ease`; switch to `--ease-spring`, and gate to `(pointer: fine)` like other pointer effects.
121. ⭐⭐ [PERF+UX] `BackToTop` — see #38; also add `will-change` removal when idle.
122. ⭐ [UX] Tilt max degrees vary (4/5/6/7) — standardize (5° cards, 3° photo).
123. ⭐ [UX] Reveal stagger uses `(i % 4) * 70` inline magic in two files — extract a shared `staggerDelay(i)` helper.
124. ⭐ [UX] Reveal/IO thresholds differ (0.08/0.12/0.3/0.4) — pick one reveal threshold constant.
125. ⭐ [UX] `TechMarquee` pauses on hover but not on keyboard focus — add `:focus-within` pause.
126. ⭐ [UX] `TechMarquee` speed is fixed 30s regardless of list length — scale duration with track width (fewer chips = slower crawl feels broken).
127. ⭐ [UX] `CursorGlow` — keep rAF alive while the tab is hidden; add `visibilitychange` pause.
128. ⭐ [PERF] `ParticleField` — animates even when the hero is off-screen; gate with IntersectionObserver (same for the drift/fade scroll hooks).
129. ⭐ [UX] `Button` ghost variant lacks the `active:translate-y-px` press feedback the other variants have.
130. ⭐ [UX] Clickable cards (project/blog) have hover lift but no pressed state — add `active:scale-[0.99]` (and the tap-highlight fix from #104).
131. ⭐ [UX] Nav underline always sweeps from the left; on hover-out it retracts left too. Switch origin by direction (in from left, out to right) for the pro feel.
132. ⭐ [UX] `LevelBar` sweep replays on every Skills panel swap (component remounts) — keep the one-time reveal per session.
133. ⭐ [UX] Hero `hero-in`/`hero-fade` delays (0.3s/0.4s) are inline literals — tokenize into CSS vars for one entrance rhythm.
134. ⭐ [UX] Search inputs: icon stays gray on focus — accent the icon via `focus-within:` on the wrapper.
135. ⭐ [UX] Copy buttons (code, heading, section, link) swap the icon instantly — add a brief "✓ pulse" scale for tactile feedback.
136. ⭐ [UX] `GalaxyPreviewStage` "click to explore" hint overlaps the stage bottom edge on small screens — reposition above bottom or hide < sm.
137. ⭐ [UX] `Certifications` verify button hover fills accent — good; add icon nudge (`translate-x-0.5`) for consistency with other CTAs.
138. ⭐ [UX] Dialog close ✕ — add rotate-90 on hover (tiny, consistent with theme-swap motion language).
139. ⭐ [UX] `PageReveal` curtain is a solid 1.1s block on first paint — consider a 0.6s quicker reveal or gradient wipe; it currently delays *perceived* LCP even though the metric is safe.
140. ⭐ [UX] Add a subtle "saved" pulse to the contact draft counter when autosave fires (currently invisible work).

## F. Responsive & mobile

141. ⭐⭐ [BUG] iOS Safari zooms any input with font-size <16px — form inputs/search are `text-sm` (14px). Bump to 16px on coarse pointers / <sm.
142. ⭐⭐ [UX] `MomentumStats` on mobile: 2-col grid with 5 stats leaves a lone last cell — make the last odd cell span 2 or switch to auto-fit.
143. ⭐⭐ [UX] `BackToTop` and the Toaster can overlap bottom-right on mobile — offset the toaster above the FAB or move FAB up when toasts render.
144. ⭐ [UX] `DialogBody` max-height `55vh` — use `dvh` and ~60–65vh on small screens; footers already wrap.
145. ⭐ [UX] `BlogArchive` search+sort row is cramped <sm — stack sort under search on xs.
146. ⭐ [PERF] `ProjectCover` `sizes="(max-width: 640px) 92vw, 480px"` — in the 2-col grid the real size is ~50vw on desktop; refine to cut bytes.
147. ⭐ [UX] Shortcuts overlay is keyboard-only — verify the footer hint is touch-hidden (it is) and the overlay itself is harmless on touch (it is) — document.
148. ⭐ [UX] Mobile menu: add the same colored active-state dot language as desktop for a cohesive feel.
149. ⭐ [UX] Hero photo chips can collide with the header badge on short viewports — audit 360×640.
150. ⭐ [UX] Add `scroll-margin` audit: html `scroll-padding-top: 5rem` covers anchors — verify dialog-open + hash navigation cases.
151. ⭐ [UX] Test 320px width end-to-end (index pills, marquee label, period chips, header jump pill) — several elements were flagged above; do one dedicated pass.
152. ⭐ [UX] Landscape phones: sticky header + hero composition eats vertical space — reduce hero py at short heights (`@media (max-height: 600px)`).

## G. Performance

153. ⭐⭐ [PERF] Consolidate scroll listeners: Header, BackToTop, ScrollProgressBar, SectionRail, Experience track, Hero drift/fade/cue each add their own. Introduce a tiny shared scroll store (one rAF listener, pub/sub) — biggest sustained-scroll win.
154. ⭐⭐ [PERF] Fonts: 3 families with default weights — specify only used weights (400/500/600 Inter, 500/600/700 Space Grotesk, 400/500 Geist Mono) to cut font bytes.
155. ⭐⭐ [PERF] `will-change: transform` is set permanently on hero section, photo card, marquee track, cursor glow — memory cost on low-end devices; set only during interaction or leave to the compositor hints already present.
156. ⭐ [PERF] `Blog.tsx`/`BlogArchive` — `totalWords` splits the full markdown of every post on every client render — compute once server-side (or `useMemo`).
157. ⭐ [PERF] `TechMarquee` doubles the whole skills+planets list in DOM — cap visible chips (~24) with a "+N more" tail.
158. ⭐ [PERF] `Reveal` mounts one IO + layout effect per card; a single IO per grid would cut hundreds of observers on large walls.
159. ⭐ [PERF] Header `backdrop-blur-xl` on a full-width sticky bar repaints on every scroll — verify cost on low-end; consider blur reduction while scrolling.
160. ⭐ [PERF] Cloudinary URL helper: verify `f_auto,q_auto,w_…` are always applied (ProjectCover passes through raw CMS URLs otherwise).
161. ⭐ [PERF] Prefetch: with `Link` migration (items 1–9) ensure `prefetch` is on for the galaxy/blog destinations; keep default.
162. ⭐ [PERF] `CommandPalette` — DOM scan on each open is fine, but the actions array rebuilds all post keywords; memoize keyword strings by slug.
163. ⭐ [PERF] `content-visibility: auto` is scoped to `.page-home` — evaluate for /blog archive grid (skip if sticky TOC children break it; measure first).
164. ⭐ [PERF] LazyMount placeholder heights vs real sections — verify no CLS jump on reveal (SectionPlaceholder reserves height; compare real heights at sm/lg).
165. ⭐ [PERF] Move `IdleMount` timeout lower (1.5s) for the palette/shortcuts listeners — interactions within 2.5s currently do nothing (mount listeners early, defer only visuals).
166. ⭐ [PERF] Add `fetchPriority`/`loading` audit for the first blog post image (none currently — posts are text; fine) — skip if N/A.

## H. Forms & contact specifics

167. ⭐⭐ [UX] Show a "Draft restored" whisper when localStorage rehydrates the form — silent field-filling is surprising.
168. ⭐⭐ [UX] Add a tiny "saved" indicator near the counter when autosave writes (ties to #140).
169. ⭐ [UX] Subject/message valid-state Check icon overlaps long text — add `pr-8` when the icon renders.
170. ⭐ [UX] Counter turns amber near the limit (≥90%) — cheap guidance.
171. ⭐ [UX] While `sending`, disable inputs too (currently only the button) to prevent double-edits mid-POST.
172. ⭐ [UX] On send failure with mailto fallback, preserve scroll position & focus (currently `window.location.href` navigates away; returning users land cold).
173. ⭐ [UX] Add `aria-busy` to the form while sending.
174. ⭐ [UX] Honeypot: also set `autocomplete="off"` (done) + `name="company"` fine — add `hidden` attribute as extra belt-and-suspenders for AT that ignores aria-hidden.

## I. Blog & reading experience

175. ⭐⭐ [UX] Mobile TOC (dup #21) — implement as a `<details>` "On this page" above the article.
176. ⭐⭐ [UX] `ReadingProgress` measures document height, not the article — on short posts with long footers it never reaches 100%. Measure the `<article>` element.
177. ⭐⭐ [UX] Markdown external links: react-markdown renders them without `target`/`rel` — add a link renderer (blank + noopener + external arrow glyph).
178. ⭐ [UX] `HeadingCopyLink` — also `history.replaceState` the hash so the URL bar matches what was copied.
179. ⭐ [UX] Inline `code` with long tokens overflows — add `overflow-wrap: anywhere` to `.markdown code`.
180. ⭐ [UX] `CodeBlock` — add a right-edge fade indicating horizontal overflow.
181. ⭐ [UX] Optional: line numbers on fenced blocks ≥10 lines (CSS counters, no deps).
182. ⭐ [UX] "Keep reading" cards: add the tag hairline + chips for parity with archive cards.
183. ⭐ [UX] Prev/next footer: include dates under titles (scannability).
184. ⭐ [UX] Archive month headers: make them sticky (desktop) for long archives.
185. ⭐ [UX] Add per-post "share to LinkedIn/X" URL intents already exist — add a native `navigator.share` button on mobile (parity with Projects).
186. ⭐ [A11Y] `CodeBlock` copy button: `aria-label` toggles Copied/Copy code — also announce via toast (exists) — fine; skip.
187. ⭐ [UX] `/blog/tag/[tag]` pages: verify breadcrumb + "N notes" count + empty state for tags with 0 posts (direct URL entry).
188. ⭐ [UX] Empty /blog archive (CMS cleared): page shows header + nothing — add a friendly empty state with links home/contact.

## J. Content, zero-data & copy

189. ⭐ [UX] Hero "learning in public" chip and "currently learning" badge + header badge + Contact availability = 4 status surfaces — ensure they're all CMS-driven and consider trimming one (hero chip) if the data duplicates.
190. ⭐ [POLISH] Footer credit line: add three.js/OpenMoji already credited — add "…· three.js" for honesty if the galaxy is on.
191. ⭐ [UX] 404: make the "press ⌘K" hint a real button that opens the palette (works on touch too).
192. ⭐ [UX] `error.tsx`: show `error.digest` in a `<code>` chip for support requests.
193. ⭐ [POLISH] Date formatting is hardcoded `en-US` everywhere — fine for now, but centralize in `lib/date.ts` so an i18n switch is one file.
194. ⭐ [POLISH] "replies within 24h" is a hard-coded promise — make it a CMS string or soften ("I read everything").
195. ⭐ [POLISH] MomentumStats labels are lowercase-by-design — document that in a comment so future edits keep the style.
196. ⭐ [UX] `SectionPlaceholder` witty messages are charming — but on very fast connections they flash; add a 150ms delay before showing text.

## K. Code cleanup & robustness

197. ⭐⭐ [CLEANUP] Extract `lib/social.ts` (dup #73), `lib/hue.ts` chip maps (dup #79), `THEME_META` (dup #102).
198. ⭐⭐ [CLEANUP] Hero's `useTilt` duplicates `TiltCard` — use the component (keeps one tilt implementation).
199. ⭐⭐ [CLEANUP] Move `useScrollDrift`/`useScrollFade`/`usePhotoParallax` to `lib/` with unit tests — they're pure utilities living in a section file.
200. ⭐⭐ [CLEANUP] `tagHue.ts` — two parallel maps (classes + borders) drift easily; merge into one table with derived outputs.
201. ⭐ [CLEANUP] Delete dead code: `mesh-drift` (#17), invalid shimmer selectors (#16), `Badge colored` (#30), `minHeight: inherit` (#29), `.hero-cta-sticky` print references (component removed).
202. ⭐ [CLEANUP] Consolidate `@media print` blocks (#107).
203. ⭐ [CLEANUP] Skill `icon` strings — type as a union (`"cloud" | "workflow" | "bot"`) instead of `string`.
204. ⭐ [CLEANUP] Magic thresholds (stagger 70ms, hold 2000ms, debounce 250ms, IdleMount 2500ms) → a `lib/timings.ts` constants module.
205. ⭐ [TEST] Only 2 test files — add unit tests for: `dateMs`, heading-id dedupe, `durationOf`, `monthValue`, `tagHue` mapping, `smartHref`.
206. ⭐ [CLEANUP] Verify eslint `jsx-a11y` plugin coverage (only `next/core-web-vitals` visible) — several a11y items above would be caught automatically.
207. ⭐ [CLEANUP] Session/localStorage keys scattered (`contact-draft`, `page-reveal-seen`, `orbital:palette-recent`, `theme`) — centralize names in `lib/storage.ts`.

## L. SEO / metadata / publishing

208. ⭐ [SEO] Verify `/blog/tag/[tag]` pages emit canonical + `generateMetadata` (tag name in title).
209. ⭐ [SEO] Sitemap: confirm tag pages + all post URLs are included and lastmod reflects edits.
210. ⭐ [SEO] JSON-LD: add `knowsAbout` (skills array) to the Person entity — free relevance signal.
211. ⭐ [SEO] BlogPosting: add `author.url` (site) and `publisher` omitted is fine for personal.
212. ⭐ [SEO] RSS: confirm `feed.xml` includes full content vs excerpt (pick intentionally; full content wins subscribers).
213. ⭐ [SEO] Per-post OG image: verify long titles truncate gracefully in `opengraph-image.tsx`.
214. ⭐ [SEO] Add `article:modified_time` when `updatedAt` exists (meta currently only in JSON-LD).

## M. Galaxy surface (audit tasks — verify on the live page)

215. ⭐ [A11Y] Zoom/rotate controls: keyboard reachable + visible focus + aria-labels.
216. ⭐ [A11Y] Planet/moon buttons: accessible names (aria-hidden emoji + sr-only planet name).
217. ⭐ [UX] Card open state: Esc closes, focus returns to the planet, orbit highlight aria-announced.
218. ⭐ [PERF] 3D tier: confirm DPR cap and pause rendering when the stage is off-screen.
219. ⭐ [UX] Add a "pause motion" toggle visible on the galaxy page itself (power users + reduced-motion discoverability).
220. ⭐ [POLISH] 2D fallback text labels overlap at high planet counts — audit with the max admin-configured planets.

## N. Extra polish backlog (small, safe, professional-feel)

221. ⭐ [POLISH] Add `loading="lazy"` + `decoding="async"` audit across remaining `<img>`s.
222. ⭐ [POLISH] `Kbd` chip inside header palette button shifts width when ⌘K→Ctrl K swaps — reserve width to avoid layout shift.
223. ⭐ [POLISH] `CmdKey` swap causes tiny header reflow — same fix.
224. ⭐ [POLISH] Blog search inputs: add `<kbd>/</kbd>` hint that focuses search (wired to existing "/" global? "/" opens palette — consider "press /" focusing search on /blog instead).
225. ⭐ [UX] Home: pressing Escape while a section dialog is open then re-opening should restore the last index (state resets — fine, verify intent).
226. ⭐ [POLISH] Consistent `title` vs `Tooltip` usage: certify one rule (Tooltip for interactive controls, title for static hints) and sweep violations (BackToTop #96, marquee chips).
227. ⭐ [POLISH] Hero: prefers-contrast text-shadow rule references `.hero` but the section has no `hero` class — the rule never matches. Fix the selector (real bug found late: **[BUG]**).
228. ⭐ [POLISH] `globals.css` — `.text-gradient` has both a static and animated definition path; document which is canonical.
229. ⭐ [UX] Add keyboard hint chips to section copy-link buttons ("#" → shows ⌘-free "copied" state inline).
230. ⭐ [POLISH] Unify focus ring: global `:focus-visible` + dozens of per-component `focus-visible:outline-2` — keep both but document why (specificity overrides) or drop the globals.
231. ⭐ [UX] Command palette: add "Copy email" also as a footer quick action on mobile (palette is desktop-leaning).
232. ⭐ [UX] Add `Esc` hint to Skills/Certs switchers? Not dialogs — skip. (Placeholder removed — count preserved.)
233. ⭐ [POLISH] `MomentumStats` icons inherit currentColor — verify each token (`text-stat-*`) passes AA at 30px numerals in all 5 themes.
234. ⭐ [POLISH] Theme toggle menu: check the selected theme on open (currently recomputed per render — fine) — add `aria-checked` semantics.
235. ⭐ [UX] Add a subtle section-transition fade for the LazyMount reveal (placeholder → real section currently swaps instantly).
236. ⭐ [POLISH] Blog archive featured card: gradient border uses the full accent→cyan→ai rainbow — consider the single accent→cyan brand pair per the "ONE gradient" plan rule.
237. ⭐ [POLISH] Hero availability pill + Contact pill: identical markup twice — extract `AvailabilityPill`.
238. ⭐ [POLISH] `GithubStrip` — stars/followers pills are non-interactive spans while neighbors are links; make them link to the repos/profile for consistency.
239. ⭐ [UX] Palette: add Shift+Enter to "open in new tab" for post/project rows (power users).
240. ⭐ [UX] Add `Ctrl/Cmd+Enter` parity note in the palette footer (it submits the contact form; cheap cross-hint).

---

## Suggested execution order

**Pass 1 — correctness (items 1–40):** SPA `<Link>` migration, form `noValidate`, contrast fixes (19/20), duplicate progress bars, inverted timeline, z-order canvas fix. No visual redesign — pure repairs.

**Pass 2 — a11y sweep (41–70):** touch targets, unified filter semantics, marquee reduced-motion alternative, contact form announcements, focus management. Verify with axe DevTools + keyboard-only run-through.

**Pass 3 — consistency (71–110):** primitives extraction (SocialLink, HueChip, AvailabilityPill, theme meta), emoji→icon sweep, radius/shadow/token normalization.

**Pass 4 — motion & feel (111–140):** toast exit, accordion expand, scroll cue restore, palette/toggle entrances, infinite animations → settle.

**Pass 5 — perf (141–166):** scroll listener consolidation, font weights, will-change cleanup, cover sizes.

**Pass 6 — everything else** in id order.

*No code was changed in this pass — this document is the audit deliverable. Each item is scoped to be a small, independent edit.*
