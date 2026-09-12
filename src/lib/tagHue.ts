/**
 * tagHue.ts — P19: blog tags get topic hues instead of grey pills.
 * Known topics map to their token color; unknown tags fall back to
 * neutral (so the CMS can add any tag without breaking the palette).
 *
 * TEXT uses the DEEP-* tokens (audit #19): the soft topic-* hues fail
 * WCAG AA for 12px badge text on paper — the same bug the P25 audit
 * caught on the marquee/preview chips. Fills/borders stay soft.
 */
const TAG_HUES: Record<string, string> = {
  // devops family
  ci: "bg-topic-devops/10 text-topic-devops-deep",
  "ci-cd": "bg-topic-devops/10 text-topic-devops-deep",
  cicd: "bg-topic-devops/10 text-topic-devops-deep",
  devops: "bg-topic-devops/10 text-topic-devops-deep",
  "github-actions": "bg-topic-devops/10 text-topic-devops-deep",
  // cloud family
  cloud: "bg-topic-cloud/10 text-topic-cloud-deep",
  aws: "bg-topic-cloud/10 text-topic-cloud-deep",
  docker: "bg-topic-cloud/10 text-topic-cloud-deep",
  kubernetes: "bg-topic-cloud/10 text-topic-cloud-deep",
  // ai family
  ai: "bg-topic-ai/10 text-topic-ai-deep",
  ml: "bg-topic-ai/10 text-topic-ai-deep",
  "machine-learning": "bg-topic-ai/10 text-topic-ai-deep",
  // linux family
  linux: "bg-topic-linux/10 text-topic-linux-deep",
  bash: "bg-topic-linux/10 text-topic-linux-deep",
  shell: "bg-topic-linux/10 text-topic-linux-deep",
  git: "bg-topic-linux/10 text-topic-linux-deep",
  terminal: "bg-topic-linux/10 text-topic-linux-deep",
  // writing / notes family
  learning: "bg-topic-ice/10 text-topic-ice-deep",
  writing: "bg-topic-mars/10 text-topic-mars-deep",
  notes: "bg-topic-mars/10 text-topic-mars-deep",
};

/** Colored-badge classes for a tag, or undefined to keep neutral. */
export function tagHueClasses(tag: string): string | undefined {
  return TAG_HUES[tag.toLowerCase().trim()];
}

/** Phase 9: a 2px TOP hairline in the tag's hue — cards get a colored
 *  leading edge (same family mapping, so badge + edge always agree). */
const TAG_BORDER_HUES: Record<string, string> = {
  // devops family
  ci: "border-t-topic-devops/60",
  "ci-cd": "border-t-topic-devops/60",
  cicd: "border-t-topic-devops/60",
  devops: "border-t-topic-devops/60",
  "github-actions": "border-t-topic-devops/60",
  // cloud family
  cloud: "border-t-topic-cloud/60",
  aws: "border-t-topic-cloud/60",
  docker: "border-t-topic-cloud/60",
  kubernetes: "border-t-topic-cloud/60",
  // ai family
  ai: "border-t-topic-ai/60",
  ml: "border-t-topic-ai/60",
  "machine-learning": "border-t-topic-ai/60",
  // linux family
  linux: "border-t-topic-linux/60",
  bash: "border-t-topic-linux/60",
  shell: "border-t-topic-linux/60",
  git: "border-t-topic-linux/60",
  terminal: "border-t-topic-linux/60",
  // writing / notes family
  learning: "border-t-topic-ice/60",
  writing: "border-t-topic-mars/60",
  notes: "border-t-topic-mars/60",
};

/** Colored top-edge classes for a tag, or undefined to keep neutral. */
export function tagHueBorder(tag: string): string | undefined {
  return TAG_BORDER_HUES[tag.toLowerCase().trim()];
}
