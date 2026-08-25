/**
 * GradientMesh.tsx — subtle ambient background.
 * A single soft indigo radial glow behind the hero — enough to add
 * depth without competing with content. No animation (static is premium).
 */
export default function GradientMesh() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-[0.08]"
        style={{
          background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}