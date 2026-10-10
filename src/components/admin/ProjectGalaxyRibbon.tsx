/**
 * ProjectGalaxyRibbon.tsx
 * Relationship widget shown inside the Project edit view (/admin/project/[id]).
 * Shows whether this project is already linked/orbiting as a Moon in the Learning Galaxy,
 * and allows 1-click converting/publishing to a Planet orbit if not yet deployed.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Rocket, Plus, ExternalLink, Check, RefreshCw } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import Link from "next/link";

interface Moon {
  _id: string;
  name: string;
  type: string;
  planetId: string;
  projectId?: string;
  icon?: string;
  githubUrl?: string;
}

interface Planet {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
}

export default function ProjectGalaxyRibbon({
  projectId,
  projectTitle,
  projectDescription,
  projectRepoUrl,
  projectDemoUrl,
  projectTech,
}: {
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  projectRepoUrl?: string;
  projectDemoUrl?: string;
  projectTech?: string[];
}) {
  const [orbitingMoon, setOrbitingMoon] = useState<Moon | null>(null);
  const [parentPlanet, setParentPlanet] = useState<Planet | null>(null);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick deploy modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlanetId, setSelectedPlanetId] = useState("");
  const [deploying, setDeploying] = useState(false);

  const checkOrbitStatus = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      // Fetch planets
      const planetsRes = await fetch("/api/admin/galaxyPlanet");
      const planetsJson = await planetsRes.json();
      const loadedPlanets: Planet[] = Array.isArray(planetsJson?.data) ? planetsJson.data : [];
      setPlanets(loadedPlanets);

      // Fetch moons to see if one references this project
      const moonsRes = await fetch("/api/admin/galaxyMoon");
      const moonsJson = await moonsRes.json();
      const moons: Moon[] = Array.isArray(moonsJson?.data) ? moonsJson.data : [];

      const matchedMoon = moons.find(
        (m) =>
          m.projectId === projectId ||
          m.name.toLowerCase() === projectTitle.toLowerCase() ||
          (m.githubUrl && projectRepoUrl && m.githubUrl === projectRepoUrl)
      );

      if (matchedMoon) {
        setOrbitingMoon(matchedMoon);
        const p = loadedPlanets.find((item) => item._id === matchedMoon.planetId);
        setParentPlanet(p || null);
      } else {
        setOrbitingMoon(null);
        setParentPlanet(null);
      }
    } catch {
      // quiet fail
    } finally {
      setLoading(false);
    }
  }, [projectId, projectTitle, projectRepoUrl]);

  useEffect(() => {
    checkOrbitStatus();
  }, [checkOrbitStatus]);

  const handleDeployToGalaxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanetId) {
      showToast("Please choose a target planet");
      return;
    }

    setDeploying(true);
    try {
      const payload = {
        planetId: selectedPlanetId,
        projectId,
        name: projectTitle,
        slug: projectTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        type: "project",
        description: projectDescription || "",
        githubUrl: projectRepoUrl || "",
        liveUrl: projectDemoUrl || "",
        technologies: projectTech || [],
        icon: "🚀",
        size: 14,
        isVisible: true,
      };

      const res = await fetch("/api/admin/galaxyMoon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Deploy failed");
      }

      showToast(`Project deployed as an orbiting moon in Learning Galaxy!`);
      setModalOpen(false);
      checkOrbitStatus();
    } catch (err: unknown) {
      showToast((err as Error).message);
    } finally {
      setDeploying(false);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-8 rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-cyan-950/40 p-5 shadow-lg shadow-black/30 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-950/60 text-lg shadow-inner">
            <Sparkles className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300">
              Connected Learning Ecosystem
            </h4>
            {orbitingMoon && parentPlanet ? (
              <p className="mt-0.5 text-sm font-semibold text-white">
                Orbiting as Moon around{" "}
                <span className="text-cyan-300 font-bold">
                  {parentPlanet.icon || "🪐"} {parentPlanet.name}
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm font-semibold text-slate-300">
                Not yet deployed to the Learning Galaxy solar system
              </p>
            )}
          </div>
        </div>

        <div>
          {orbitingMoon && parentPlanet ? (
            <Link
              href={`/admin/galaxyPlanet/${parentPlanet._id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-3.5 py-2 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/30"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Manage on {parentPlanet.name}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (planets.length > 0) setSelectedPlanetId(planets[0]._id);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Rocket className="h-4 w-4" />
              Deploy as Galaxy Moon
            </button>
          )}
        </div>
      </div>

      {/* Deploy to Galaxy Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-indigo-500/40 bg-[#0d1226] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Deploy &quot;{projectTitle}&quot; to Galaxy
            </h3>
            <p className="mt-1 text-xs text-slate-300">
              Select which skill planet this project should orbit as a proof artifact.
            </p>

            <form onSubmit={handleDeployToGalaxy} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Target Skill Planet:
                </label>
                <select
                  value={selectedPlanetId}
                  onChange={(e) => setSelectedPlanetId(e.target.value)}
                  className="w-full rounded-xl border border-indigo-400/40 bg-[#080d1d] px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  {planets.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.icon || "🪐"} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-indigo-500/20">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deploying}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {deploying ? "Deploying…" : "Confirm & Deploy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
