/**
 * PlanetMoonsManager.tsx
 * In-Page Orbiting Moons Manager mounted inside the Planet Edit view (/admin/galaxyPlanet/[id]).
 * Allows viewing, creating, editing, and deleting moons belonging to this planet directly,
 * eliminating the need to jump to /admin/galaxyMoon and manually link IDs.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  FileText,
  Rocket,
  Wrench,
  BookOpen,
  Award,
  Sparkles,
  RefreshCw,
  X,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import BrandIcon from "@/components/ui/BrandIcon";
import { showToast } from "@/components/ui/Toast";
import IconPicker from "@/components/admin/IconPicker";

export interface MoonDoc {
  _id?: string;
  planetId: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  icon?: string;
  githubUrl?: string;
  liveUrl?: string;
  documentationUrl?: string;
  technologies?: string[];
  size?: number;
  isFeatured?: boolean;
  isVisible?: boolean;
  displayOrder?: number;
  projectId?: string;
}

interface ProjectDoc {
  _id: string;
  title: string;
  description?: string;
  repoUrl?: string;
  demoUrl?: string;
  tech?: string[];
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  project: Rocket,
  lab: Wrench,
  notes: BookOpen,
  certification: Award,
};

const TYPE_COLORS: Record<string, string> = {
  project: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  lab: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  notes: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  certification: "bg-purple-500/20 text-purple-300 border-purple-500/40",
};

export default function PlanetMoonsManager({
  planetId,
  planetName,
}: {
  planetId: string;
  planetName: string;
}) {
  const [moons, setMoons] = useState<MoonDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Drawer state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMoon, setEditingMoon] = useState<MoonDoc | null>(null);
  const [saving, setSaving] = useState(false);

  // Available projects to import from
  const [projects, setProjects] = useState<ProjectDoc[]>([]);

  // Form fields for create/edit
  const [formData, setFormData] = useState<Partial<MoonDoc>>({
    name: "",
    slug: "",
    type: "project",
    description: "",
    icon: "🚀",
    githubUrl: "",
    liveUrl: "",
    documentationUrl: "",
    technologies: [],
    size: 14,
    isFeatured: false,
    isVisible: true,
    displayOrder: 0,
  });

  const loadMoons = useCallback(async () => {
    if (!planetId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/galaxyMoon?planetId=${planetId}`);
      if (!res.ok) throw new Error("Failed to load moons");
      const json = await res.json();
      setMoons(Array.isArray(json.data) ? json.data : []);
      setError(null);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [planetId]);

  useEffect(() => {
    loadMoons();
  }, [loadMoons]);

  // Load available projects for quick 1-click import
  useEffect(() => {
    fetch("/api/admin/project")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data && Array.isArray(json.data)) {
          setProjects(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingMoon(null);
    setFormData({
      planetId,
      name: "",
      slug: "",
      type: "project",
      description: "",
      icon: "🚀",
      githubUrl: "",
      liveUrl: "",
      documentationUrl: "",
      technologies: [],
      size: 14,
      isFeatured: false,
      isVisible: true,
      displayOrder: moons.length,
    });
    setModalOpen(true);
  };

  const openEditModal = (moon: MoonDoc) => {
    setEditingMoon(moon);
    setFormData({
      ...moon,
      technologies: moon.technologies || [],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMoon(null);
  };

  const handleImportProject = (projectId: string) => {
    const proj = projects.find((p) => p._id === projectId);
    if (!proj) return;
    setFormData((prev) => ({
      ...prev,
      projectId,
      name: proj.title,
      slug: proj.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      description: proj.description || prev.description,
      githubUrl: proj.repoUrl || prev.githubUrl,
      liveUrl: proj.demoUrl || prev.liveUrl,
      technologies: proj.tech || prev.technologies,
      type: "project",
      icon: "🚀",
    }));
    showToast(`Pre-filled from "${proj.title}"`);
  };

  const handleSaveMoon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast("Moon name is required");
      return;
    }

    const payload = {
      ...formData,
      planetId,
      slug:
        formData.slug?.trim() ||
        formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
    };

    setSaving(true);
    try {
      const isEdit = Boolean(editingMoon?._id);
      const url = isEdit
        ? `/api/admin/galaxyMoon/${editingMoon!._id}`
        : `/api/admin/galaxyMoon`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");

      showToast(isEdit ? "Moon updated!" : "Moon created!");
      closeModal();
      loadMoons();
    } catch (err: unknown) {
      showToast((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMoon = async (moon: MoonDoc) => {
    if (!moon._id) return;
    if (!window.confirm(`Delete orbiting moon "${moon.name}" permanently?`)) return;

    try {
      const res = await fetch(`/api/admin/galaxyMoon/${moon._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Moon removed from orbit");
      loadMoons();
    } catch (err: unknown) {
      showToast((err as Error).message);
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= moons.length) return;

    const currentMoon = moons[index];
    const targetMoon = moons[targetIndex];
    if (!currentMoon._id || !targetMoon._id) return;

    try {
      // Swap displayOrder values
      const currentOrder = currentMoon.displayOrder ?? index;
      const targetOrder = targetMoon.displayOrder ?? targetIndex;

      await Promise.all([
        fetch(`/api/admin/galaxyMoon/${currentMoon._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { displayOrder: targetOrder } }),
        }),
        fetch(`/api/admin/galaxyMoon/${targetMoon._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { displayOrder: currentOrder } }),
        }),
      ]);

      loadMoons();
    } catch {
      showToast("Reorder failed");
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-[#12102e]/90 via-[#0e142c]/90 to-[#0a1122]/90 backdrop-blur-xl p-6 sm:p-7 shadow-xl shadow-black/40">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Orbiting Artifacts & Moons
          </div>
          <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            Moons of {planetName || "This Planet"}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            Manage repos, project labs, and documentation notes orbiting this skill planet directly in this view.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadMoons}
            title="Refresh list"
            className="rounded-lg border border-indigo-400/30 bg-white/[0.05] p-2 text-slate-300 transition-colors hover:bg-white/[0.1] hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-cyan-500/30 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add Moon to {planetName ? `"${planetName}"` : "Planet"}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Moons List Table */}
      <div className="mt-5">
        {loading && moons.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">Scanning planetary orbits…</div>
        ) : moons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-indigo-500/25 bg-black/20 p-8 text-center">
            <Rocket className="mx-auto h-8 w-8 text-indigo-400/50" />
            <p className="mt-2 text-sm font-semibold text-slate-200">No moons orbiting this planet yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Add a GitHub repo, practical lab, or study note to bring this skill to life in the 3D Solar System.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20"
            >
              <Plus className="h-3.5 w-3.5" /> Create First Moon
            </button>
          </div>
        ) : (
          <div className="divide-y divide-indigo-500/15 overflow-hidden rounded-xl border border-indigo-500/25 bg-black/30">
            {moons.map((moon, index) => {
              const TypeIcon = TYPE_ICONS[moon.type] || Rocket;
              const typeStyle = TYPE_COLORS[moon.type] || TYPE_COLORS.project;

              return (
                <div
                  key={moon._id ?? index}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Reorder arrows */}
                    <div className="flex flex-col gap-0.5 text-slate-500">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveOrder(index, "up")}
                        className="rounded p-0.5 hover:text-cyan-300 disabled:opacity-20"
                        title="Move inward"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === moons.length - 1}
                        onClick={() => handleMoveOrder(index, "down")}
                        className="rounded p-0.5 hover:text-cyan-300 disabled:opacity-20"
                        title="Move outward"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Icon / Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-400/30 bg-indigo-950/60 text-base shadow-sm">
                      {moon.icon || "✦"}
                    </div>

                    {/* Meta */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white truncate text-sm">
                          {moon.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyle}`}
                        >
                          <TypeIcon className="h-2.5 w-2.5" />
                          {moon.type}
                        </span>
                        {moon.isFeatured && (
                          <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            ★ Featured
                          </span>
                        )}
                        {!moon.isVisible && (
                          <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400 truncate max-w-md">
                        {moon.description || `Orbiting ${planetName}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Links */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {moon.githubUrl && (
                      <a
                        href={moon.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 transition-colors hover:text-white"
                        title="GitHub repo"
                      >
                        <BrandIcon name="github" className="h-3.5 w-3.5 fill-current" />
                      </a>
                    )}
                    {moon.liveUrl && (
                      <a
                        href={moon.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 transition-colors hover:text-cyan-300"
                        title="Live demo"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(moon)}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMoon(moon)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 p-1.5 text-red-300 transition-colors hover:bg-red-500/25"
                      title="Delete moon"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-Page Quick Add / Edit Moon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-indigo-500/40 bg-[#0d1226] p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                  Target Planet: {planetName}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {editingMoon ? `Edit Moon "${editingMoon.name}"` : "Add Orbiting Moon"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Import Project Bar (if creating) */}
            {!editingMoon && projects.length > 0 && (
              <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3">
                <label className="block text-xs font-semibold text-indigo-300 mb-1.5">
                  ⚡ Quick Auto-Fill from an Existing Project:
                </label>
                <select
                  onChange={(e) => handleImportProject(e.target.value)}
                  defaultValue=""
                  className="w-full rounded-lg border border-indigo-400/40 bg-[#0a0f20] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="" disabled>
                    Choose a project to import details…
                  </option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveMoon} className="mt-5 space-y-4 text-xs sm:text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-slate-200 mb-1">
                    Moon Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        name: e.target.value,
                        slug:
                          p.slug ||
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, ""),
                      }))
                    }
                    placeholder="e.g. Lambda Image Processor"
                    className="w-full rounded-lg border border-indigo-400/30 bg-black/40 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-200 mb-1">
                    Moon Slug (URL key)
                  </label>
                  <input
                    type="text"
                    value={formData.slug || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="e.g. lambda-image-processor"
                    className="w-full rounded-lg border border-indigo-400/30 bg-black/40 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block font-medium text-slate-200 mb-1">Moon Type</label>
                  <select
                    value={formData.type || "project"}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                    className="w-full rounded-lg border border-indigo-400/30 bg-black/40 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="project">Project (Repo/App)</option>
                    <option value="lab">Lab (Hands-on POC)</option>
                    <option value="notes">Notes (Docs/Study)</option>
                    <option value="certification">Certification</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-200 mb-1">Icon / Emoji</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.icon || "🚀"}
                      onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
                      className="w-full rounded-lg border border-indigo-400/30 bg-black/40 px-3 py-2 text-center text-white focus:border-cyan-400 focus:outline-none"
                    />
                    <IconPicker
                      id="moon-icon-picker"
                      inputClasses="w-full rounded-lg border border-indigo-400/30 bg-black/40 px-3 py-2 text-center text-white focus:border-cyan-400 focus:outline-none"
                      mode="emoji"
                      value={formData.icon || "🚀"}
                      onChange={(val) => setFormData((p) => ({ ...p, icon: val }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-200 mb-1">Visual Size (px)</label>
                  <select
                    value={String(formData.size || 14)}
                    onChange={(e) => setFormData((p) => ({ ...p, size: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-indigo-400/30 bg-black/40 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="10">10 (Compact Note)</option>
                    <option value="14">14 (Standard Repo)</option>
                    <option value="18">18 (Major Artifact)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-200 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What does this repository or note accomplish?"
                  className="w-full rounded-lg border border-indigo-400/30 bg-black/40 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-slate-200 mb-1">GitHub Repo URL</label>
                  <input
                    type="url"
                    value={formData.githubUrl || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, githubUrl: e.target.value }))}
                    placeholder="https://github.com/username/repo"
                    className="w-full rounded-lg border border-indigo-400/30 bg-black/40 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-200 mb-1">Live Demo / App URL</label>
                  <input
                    type="url"
                    value={formData.liveUrl || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, liveUrl: e.target.value }))}
                    placeholder="https://my-app.vercel.app"
                    className="w-full rounded-lg border border-indigo-400/30 bg-black/40 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-200 mb-1">
                  Technologies (comma separated)
                </label>
                <input
                  type="text"
                  value={(formData.technologies || []).join(", ")}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      technologies: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="AWS Lambda, Python, S3, Terraform"
                  className="w-full rounded-lg border border-indigo-400/30 bg-black/40 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVisible !== false}
                    onChange={(e) => setFormData((p) => ({ ...p, isVisible: e.target.checked }))}
                    className="rounded border-indigo-400 bg-black text-indigo-500 focus:ring-indigo-400"
                  />
                  <span className="text-slate-200 font-medium">Visible in Solar System</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isFeatured)}
                    onChange={(e) => setFormData((p) => ({ ...p, isFeatured: e.target.checked }))}
                    className="rounded border-amber-400 bg-black text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-amber-300 font-medium">Featured Moon (Luminous Aura)</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-indigo-500/20 pt-4 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-white/10 px-4 py-2 font-medium text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-2 font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {saving ? "Saving…" : editingMoon ? "Save Changes" : "Create Moon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
