/**
 * Eyebrow.tsx — UI primitive (plan S2/§4.1)
 * Terminal-styled section labels: "~/projects" in mono font with
 * accent color — devs love this, matches the orbital identity.
 */
import { clsx } from "clsx";

interface EyebrowProps {
  /** The path shown after "~/", e.g. "projects". */
  label: string;
  /** Optional blinking cursor for the last eyebrow on the page. */
  cursor?: boolean;
  className?: string;
}

export default function Eyebrow({ label, cursor = false, className }: EyebrowProps) {
  return (
    <p
      className={clsx(
        "font-mono text-xs font-medium tracking-tight text-accent",
        className
      )}
    >
      ~/{label}
      {cursor && (
        <span className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-0.5 animate-pulse bg-accent/80" />
      )}
    </p>
  );
}
