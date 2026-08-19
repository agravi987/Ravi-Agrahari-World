/**
 * readTime.ts — rough read-time from word count (markdown content).
 * Shared by the home blog section and the /blog archive (P17).
 */
export function readTimeMinutes(contentMarkdown: string): number {
  const words = contentMarkdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
