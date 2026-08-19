/**
 * detailed-galaxy/loading.tsx — on-brand loading state for the
 * planetarium. The WebGL scene is a lazy chunk (Galaxy3D), so this
 * shows while it streams in: a pulsing orbit ring + rotating copy.
 */
import RouteLoader from "@/components/ui/RouteLoader";

export default function DetailedGalaxyLoading() {
  return (
    <RouteLoader
      messages={[
        "igniting the sun…",
        "spinning up the orbits…",
        "plotting planet trajectories…",
        "rounding up the moons…",
        "calibrating the telescope…",
      ]}
      detail="assembling the 3D planetarium"
    />
  );
}
