/**
 * Certifications.tsx — plan S7
 * Badge cards with official verify links (plan §4.3: never scraped
 * logos — the verifyUrl IS the proof, honest by design). Auto-hides
 * when empty (plan §5.2).
 */
import { ArrowUpRight, Award } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import type { Certification } from "@/types";

interface CertificationsProps {
  certifications: Certification[];
}

export default function Certifications({ certifications }: CertificationsProps) {
  if (certifications.length === 0) return null; // auto-hide (§5.2)

  return (
    <Section
      id="certifications"
      eyebrow="certifications"
      title="Certifications"
      description="Verified, with links — check them yourself."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {certifications.map((cert) => (
          <Card key={`${cert.name}-${cert.date}`} hover className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Award className="h-5 w-5" aria-hidden="true" />
              </div>
              {cert.verifyUrl && (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Verify ${cert.name}`}
                  className="text-ink-faint transition-colors hover:text-accent"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
            <h3 className="mt-4 font-display text-base font-semibold text-ink">{cert.name}</h3>
            <p className="mt-1 text-sm text-ink-soft">{cert.issuer}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="accent">{cert.category}</Badge>
              <span className="text-xs text-ink-faint">{cert.date}</span>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
