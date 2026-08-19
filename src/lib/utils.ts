/**
 * utils.ts — shared class-name helper (shadcn/ui convention).
 * Merges Tailwind classes without conflicts: clsx builds the string,
 * tailwind-merge dedupes competing utilities (e.g. two `bg-*` classes
 * keep the last). Every component uses cn() instead of raw template
 * strings so overrides always win predictably.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
