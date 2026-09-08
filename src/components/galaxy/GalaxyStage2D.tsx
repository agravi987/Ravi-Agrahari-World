/**
 * GalaxyStage2D.tsx — presentational CSS-orbit stage (the T3 static
 * fallback for the home preview). Pure markup + CSS animation, ZERO
 * client JS: it's what the home 3D preview swaps out when WebGL /
 * reduced-motion / viewport detection says "stay cheap". Shared by
 * the server section (GalaxyPreviewStage renders it) so the box is
 * never empty while the lazy 3D chunk loads.
 */
import type { GalaxyData } from "@/types/galaxy";
import { planetStyle, worldSize, worldStyle } from "@/lib/galaxyGeometry";
import GalaxyBackground from "@/components/galaxy/GalaxyBackground";
import GalaxyComets from "@/components/galaxy/GalaxyComets";
import OrbitLine from "@/components/galaxy/OrbitLine";
import Sun from "@/components/galaxy/Sun";

export default function GalaxyStage2D({ galaxy }: { galaxy: GalaxyData }) {
  const { profile, settings, planets } = galaxy;
  const staticLayout = !settings.animationEnabled;
  const world = worldSize(planets);

  return (
    <div
      className="galaxy-stage group mx-auto w-full transition-shadow duration-300 hover:shadow-orbital"
      data-static={staticLayout || undefined}
      aria-label="Learning galaxy preview"
    >
      <GalaxyBackground
        showStars={settings.showStars}
        density={settings.starDensity}
        nebula={settings.nebulaVisible}
      />
      <div className="galaxy-world" style={worldStyle(world)}>
        <Sun profile={profile} size={72} />
        {/* Comets revolve the sun on fixed elliptical orbits —
            decorative ambience (like the stars), scales with zoom. */}
        <GalaxyComets />

        <div className="galaxy-rotator" aria-hidden="true">
          {planets.map((p) => (
            <div key={p.slug} className="galaxy-orbit-ring" style={planetStyle(p, settings)}>
              {settings.showOrbitLines && <OrbitLine />}
              <div className="galaxy-planet-holder">
                <div className="galaxy-planet-inner">
                  <div className="galaxy-planet-face">
                    {/* Decorative duplicate of the CTA below —
                        inert to keyboard/AT, mouse-clickable. */}
                    <a
                      href="/detailed-galaxy"
                      tabIndex={-1}
                      aria-hidden="true"
                      className="galaxy-planet"
                    >
                      <span aria-hidden="true">{p.icon}</span>
                    </a>
                    {p.moons.length > 0 && (
                      <span
                        aria-hidden="true"
                        className="galaxy-moon-count absolute -top-2 right-2 flex items-center gap-0.5 rounded-full border border-card-border bg-card/90 px-1.5 py-0.5 text-[9px] font-mono text-ink-faint shadow-card backdrop-blur-sm"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {p.moons.length}
                      </span>
                    )}
                  </div>
                  <span className="galaxy-planet-chip" aria-hidden="true">
                    {p.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}