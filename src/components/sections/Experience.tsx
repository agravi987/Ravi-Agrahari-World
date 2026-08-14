/**
 * Experience.tsx — plan S7
 * Simple timeline (company → role → period → description).
 * Auto-hides when empty — freshers typically ship this empty
 * until internships land (plan §5.2 / §5.4).
 */
import Section from "@/components/ui/Section";
import type { Experience as ExperienceItem } from "@/types";

interface ExperienceProps {
  experience: ExperienceItem[];
}

export default function Experience({ experience }: ExperienceProps) {
  if (experience.length === 0) return null; // auto-hide (§5.2)

  return (
    <Section
      id="experience"
      eyebrow="experience"
      title="Experience & internships"
      description="Early-career, but every role taught me something real."
    >
      <ol className="relative space-y-8 border-l border-card-border pl-6">
        {experience.map((item) => (
          <li key={`${item.company}-${item.role}`} className="relative">
            {/* Timeline dot */}
            <span
              aria-hidden="true"
              className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-paper"
            />
            <h3 className="font-display text-lg font-semibold text-ink">{item.role}</h3>
            <p className="text-sm font-medium text-accent">
              {item.company} · <span className="text-ink-faint">{item.period}</span>
            </p>
            <p className="mt-2 text-sm text-ink-soft">{item.description}</p>
            {item.metrics.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-soft">
                {item.metrics.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}
