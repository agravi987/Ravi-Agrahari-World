/**
 * sectionTour.ts — the astronaut guide's script (UI copy, not CMS
 * content — same class of static strings as SectionRail labels).
 * One entry per home section. Everything the guide can say lives here:
 *   tip      — one-liner for the small docked bubble
 *   label    — the section's short name (name tag chip)
 *   describe — the fuller paragraph the big info panel shows
 * Both the docked bubble, the info panel and the guided tour read from
 * this single source so a section and its words never drift.
 */

export interface GuideStep {
  /** Section anchor id — same ids as SectionRail/page.tsx use. */
  id: string;
  /** Short name, shown in the Orbit info card. */
  label: string;
  /** One-line bubble tip, shown while the section is under the probe. */
  tip: string;
  /** Paragraph for the big info panel (the click-to-open card). */
  describe: string;
}

export const GUIDE_SECTIONS: readonly GuideStep[] = [
  {
    id: "skills",
    label: "Skills",
    tip: "My stack at a glance — grouped by how I actually use it.",
    describe:
      "Languages, frameworks, infra and the human side around them — grouped the way I work, not by buzzword. Hover or tap a chip to see the level and where you've seen it in practice.",
  },
  {
    id: "projects",
    label: "Projects",
    tip: "Projects first, latest first — click any card for the brief.",
    describe:
      "The ships are real: Dockerized apps, case studies and links to the code. Ordered by impact, latest first — click any card for the full brief, stack and what it taught me.",
  },
  {
    id: "experience",
    label: "Experience",
    tip: "Where I've applied it: internships, tools, impact.",
    describe:
      "Internships and roles on a timeline — the tools, the teams and the measurable outcomes at each stop, so you can see how I operate outside the code editor.",
  },
  {
    id: "certifications",
    label: "Certifications",
    tip: "Certificates that back up the learning — links included.",
    describe:
      "Every certificate links to the issuing body so you can verify it yourself. They're the receipts for the 'learning in public' habit — each one earned, not screenshotted.",
  },
  {
    id: "blog",
    label: "Blog",
    tip: "Field notes from what I'm studying — searchable and tagged.",
    describe:
      "Field notes from what I'm currently studying — searchable, tagged and refreshingly honest about being a work-in-progress. The raw material behind the stack you just skimmed.",
  },
  {
    id: "contact",
    label: "Contact",
    tip: "The inbox is one click away — no forms in between.",
    describe:
      "The inbox is one click away. No forms, no gatekeeping — a direct mailto, socials for the informal route, and the deploy badge down there if you like reading commit hashes.",
  },
] as const satisfies readonly GuideStep[];

/** Bubble shown while no section sits under the probe line (top of page). */
export const GUIDE_IDLE_TIP = "Scroll on — I'll flag the good stuff.";

/** Panel copy shown before the visitor reaches any section. */
export const GUIDE_ABOUT_DESCRIBE =
  "Welcome to my space. Scroll to meet the stack, the ships and how I work — or take the tour and I'll point at the good bits in order.";

/** Character name for the dialogue tag + reply copy. */
export const GUIDE_NAME = "Orbit";

/** Returning-visitor greeting (visit #2+ of a storage-carrying browser). */
export const GUIDE_RETURN_TIP = "Back for more galaxies, Captain?";

/** Custom event name the hero's "Take the tour" button dispatches. */
export const GUIDE_TOUR_EVENT = "guide-tour:start";

/** First-visit welcome card copy. */
export const GUIDE_INVITE_TITLE = "New here? I'm";
export const GUIDE_INVITE_BODY =
  "Want me to fly you around? I'll show you the stack, the ships and the parts that matter — in the order that makes sense.";