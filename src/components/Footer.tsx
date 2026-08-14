/**
 * Footer.tsx — plan S9/S10
 * Identity line + OpenMoji attribution (plan §4.3, CC BY-SA 4.0)
 * + the deploy badge: reads public/deploy-meta.json written at
 * build time from Vercel env (VERCEL_GIT_COMMIT_SHA, plan S10).
 * `github` comes from the content layer (D6) so the badge link
 * never hardcodes a username.
 */

interface FooterProps {
  github: string;
}
import { readFile } from "node:fs/promises";
import path from "node:path";

interface DeployMeta {
  commit?: string;
  builtAt?: string;
}

/** Reads the deploy badge file (written at build time by S10 tooling). */
async function getDeployMeta(): Promise<DeployMeta | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "deploy-meta.json"), "utf-8");
    return JSON.parse(raw) as DeployMeta;
  } catch {
    return null; // file absent pre-deploy — badge just doesn't render
  }
}

export default async function Footer({ github }: FooterProps) {
  const meta = await getDeployMeta();

  return (
    <footer className="mt-20 border-t border-card-border bg-paper-deep/50">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <p className="text-sm text-ink-soft">
          Built while learning in public · <span className="font-mono text-xs text-ink-faint">orbital v1</span>
        </p>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          <p className="text-xs text-ink-faint">
            Planet icons by{" "}
            <a
              href="https://openmoji.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-soft underline decoration-dotted underline-offset-2 hover:text-accent"
            >
              OpenMoji
            </a>{" "}
            (CC BY-SA 4.0)
          </p>

          {/* Deploy badge (plan S10) — only when build metadata exists */}
          {meta?.commit && (
            <p className="font-mono text-xs text-ink-faint" title="Latest deploy">
              <span className="text-accent-cyan">●</span>{" "}
              <span className="text-ink-soft">deployed</span>{" "}
              <a
                href={`https://github.com/${github}/portfolio/commit/${meta.commit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                {meta.commit.slice(0, 7)}
              </a>
              {meta.builtAt && (
                <>
                  {" · "}
                  {new Date(meta.builtAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
