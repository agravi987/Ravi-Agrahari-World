"use client";

import { useState, useCallback, useEffect } from "react";
import { Download, Printer, Copy, Check, ExternalLink, Mail, Briefcase, Award, Code2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

/* Module store so any button (Hero, Header, CommandPalette) can trigger the modal */
const resumeListeners = new Set<() => void>();

export function openResumeModal() {
  resumeListeners.forEach((fn) => fn());
}

interface ResumeModalProps {
  name: string;
  email: string;
  github: string;
  roles: string[];
}

export default function ResumeModal({ name, email, github, roles }: ResumeModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    resumeListeners.add(handleOpen);
    return () => {
      resumeListeners.delete(handleOpen);
    };
  }, []);

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      showToast("Email copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [email]);

  const handlePrint = useCallback(() => {
    try {
      window.print();
      showToast("Print preview opened — choose 'Save as PDF'");
    } catch {
      /* print dialog blocked */
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        title={`${name} — Resume & Profile Summary`}
        description="Recruiter overview, core capabilities, and one-click export."
        className="w-[calc(100vw-2rem)] max-w-2xl"
      >
        <DialogBody className="space-y-5 pr-2 max-h-[60vh]">
          {/* Top banner / role lockup */}
          <div className="rounded-xl border border-card-border bg-paper-deep/60 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-ink">{name}</h3>
                <p className="font-mono text-xs text-accent mt-0.5">
                  {roles.join(" · ")}
                </p>
                <p className="text-xs text-ink-soft mt-1">
                  Actively seeking Junior Cloud / DevOps / Full-Stack opportunities
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  Print / Save PDF
                </Button>
                <button
                  type="button"
                  data-compact-touch
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1 rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-accent/40 hover:text-ink transition-colors"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3 text-accent" />
                  )}
                  {copied ? "Copied" : "Copy Email"}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Snapshot grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-card p-4">
              <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                <Briefcase className="h-4 w-4 text-topic-cloud" />
                <span>Target Roles</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-ink-soft">
                <li>• Junior Cloud / Infrastructure Engineer</li>
                <li>• Associate DevOps / SRE Specialist</li>
                <li>• Full-Stack Developer (Next.js / Node.js)</li>
                <li>• Cloud & AI Platform Enthusiast</li>
              </ul>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-4">
              <div className="flex items-center gap-2 text-ink font-semibold text-sm">
                <Code2 className="h-4 w-4 text-topic-devops" />
                <span>Core Competencies</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-ink-soft">
                <li>• <strong>Cloud & Infra:</strong> AWS (EC2, S3, Lambda, IAM), Linux</li>
                <li>• <strong>DevOps & CI/CD:</strong> Docker, Kubernetes, GitHub Actions</li>
                <li>• <strong>Web & APIs:</strong> Next.js, React, TypeScript, Tailwind</li>
                <li>• <strong>Database:</strong> MongoDB Atlas, Mongoose, REST APIs</li>
              </ul>
            </div>
          </div>

          {/* Key Engineering Proof */}
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <Award className="h-4 w-4 text-topic-ai" />
              <span>Verified Highlights & Proof of Work</span>
            </div>
            <div className="mt-2.5 space-y-2 text-xs text-ink-soft leading-relaxed">
              <p>
                • <strong>Production Headless CMS Portfolio:</strong> Architected Next.js App Router portfolio backed by custom MongoDB CMS with NextAuth authentication, Cloudinary asset pipelines, and automated Vercel CI/CD badge integration.
              </p>
              <p>
                • <strong>3D Learning Galaxy:</strong> Built interactive WebGL & 2D accessible space explorer visualizing learning tracks, GitHub repos, and hands-on cloud labs with zero hardcoded content.
              </p>
              <p>
                • <strong>Serverless Cloud Automation:</strong> Developed automated cloud processing pipelines utilizing AWS Lambda, S3 event triggers, and GitHub Actions CI test/build workflows.
              </p>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="justify-between">
          <div className="flex items-center gap-2">
            <a
              href={`https://github.com/${github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-accent transition-colors"
            >
              GitHub Profile
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-ink-faint">·</span>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-accent transition-colors"
            >
              <Mail className="h-3 w-3" />
              Direct Email
            </a>
          </div>
          <Button onClick={handlePrint} className="px-4 py-2 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download / Print Resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
