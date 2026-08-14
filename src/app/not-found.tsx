/**
 * not-found.tsx — ui-ux-design.md P1 (plan §4.2 optional)
 * Custom 404: "Lost in space — rerouting to Mission Control".
 * On-theme, friendly, and gives visitors a way back.
 */
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-mono text-xs text-accent">~/404</p>
      <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
        Lost in space
      </h1>
      <p className="mt-4 max-w-md text-ink-soft">
        That signal doesn&apos;t reach Mission Control — the route you tried isn&apos;t on
        the map. No worries, the coordinates are easy to re-enter.
      </p>
      <div className="mt-8">
        <Button href="/">Reroute to Mission Control</Button>
      </div>
    </div>
  );
}
