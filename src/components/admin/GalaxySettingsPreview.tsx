/**
 * GalaxySettingsPreview.tsx (client) — galaxy v4 §29 "Preview Galaxy"
 * A live, pixel-identical mini galaxy inside the /admin/galaxySettings
 * form. It reads the form's CURRENT (unsaved) settings — toggle orbit
 * lines, animation, or star density and the preview updates instantly,
 * so the admin sees the effect before saving. Reuses System2D (the
 * same component the public site renders) with inert handlers — what
 * you see here is what the site will render.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import System2D from "@/components/galaxy/System2D";
import { DEFAULT_GALAXY_SETTINGS, type GalaxyData, type GalaxyPlanetWithMoons } from "@/types/galaxy";

type Override = Partial<
  Pick<
    GalaxyData["settings"],
    "showOrbitLines" | "showStars" | "starDensity" | "animationEnabled" | "globalSpeedScale"
  >
>;

export default function GalaxySettingsPreview({ override }: { override: Override }) {
  const [planets, setPlanets] = useState<GalaxyPlanetWithMoons[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/galaxyPlanet")
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (cancelled || !r.ok) return;
        const list = json?.data;
        if (!Array.isArray(list)) return;
        setPlanets(
          (list as (GalaxyPlanetWithMoons & { isVisible?: boolean })[])
            .filter((p) => p.isVisible !== false)
            .map((p) => ({ ...p, moons: [] }))
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const galaxy: GalaxyData | null = useMemo(() => {
    if (!planets) return null;
    return {
      profile: { name: "You", tagline: "" },
      settings: { ...DEFAULT_GALAXY_SETTINGS, ...override },
      planets,
    };
  }, [planets, override]);

  if (!galaxy) {
    return (
      <div className="rounded-card border border-card-border bg-paper p-6 text-center text-xs text-ink-faint">
        Loading preview…
      </div>
    );
  }

  return (
    <div className="rounded-card border border-card-border bg-paper p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
          Live preview — reflects the settings above (unsaved)
        </p>
        <a
          href="/detailed-galaxy"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-medium text-accent hover:underline"
        >
          Open full galaxy ↗
        </a>
      </div>
      <div className="mx-auto max-w-[340px]">
        <System2D
          galaxy={galaxy}
          filter="all"
          activeId={null}
          triggerRefs={{ current: new Map() }}
          triggerHandlers={() => ({})}
        />
      </div>
    </div>
  );
}
