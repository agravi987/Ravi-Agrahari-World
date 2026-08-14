/**
 * Skills.tsx — plan S4
 * Three cards (☁️ Cloud, 🔧 DevOps, 🤖 AI) with icons and HONEST
 * 1–5 level bars (plan §3: never oversold). Renders nothing if
 * the skills array is empty (plan §5.2).
 */
import { Bot, Cloud, Workflow } from "lucide-react";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import type { Skill } from "@/types";

/** Maps seed icon keys → lucide icons (plan §4.1: lucide = UI icons). */
const ICON_MAP = {
  cloud: Cloud,
  workflow: Workflow,
  bot: Bot,
} as const;

/**
 * Per-topic tile color (ui-ux-design.md P1): each skill card gets
 * its own muted hue from the design tokens instead of accent-soft
 * everywhere — colorful but restrained (plan §4.1).
 */
const TILE_STYLES: Record<string, string> = {
  cloud: "bg-topic-cloud/10 text-topic-cloud",
  workflow: "bg-topic-devops/10 text-topic-devops",
  bot: "bg-topic-ai/10 text-topic-ai",
};

interface SkillsProps {
  skills: Skill[];
}

export default function Skills({ skills }: SkillsProps) {
  if (skills.length === 0) return null; // auto-hide when empty (§5.2)

  return (
    <Section
      id="skills"
      eyebrow="skills"
      title="What I'm building toward"
      description="Honest levels — early but consistent. These bars move as I learn (plan §3)."
    >
      <div className="grid gap-6 sm:grid-cols-3">
        {skills.map((skill) => {
          const Icon = ICON_MAP[skill.icon as keyof typeof ICON_MAP] ?? Cloud;
          return (
            <Card key={skill.name} className="p-6" hover>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  TILE_STYLES[skill.icon] ?? "bg-accent-soft text-accent"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {skill.name}
              </h3>
              <p className="mt-2 text-sm text-ink-soft">{skill.blurb}</p>

              {/* Honest level bar: 1–5, labeled not percentaged */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-ink-faint">
                  <span aria-hidden="true">level</span>
                  <span className="font-medium text-accent">
                    {skill.level}/5
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-deep"
                  role="img"
                  aria-label={`${skill.name} level ${skill.level} out of 5`}
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(skill.level / 5) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
