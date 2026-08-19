/**
 * JsonLd.tsx (client) — P8 SEO.
 * Injects JSON-LD structured data (Person + WebSite) into the SSR
 * stream via useServerInsertedHTML — the same React-19-safe pattern
 * as ThemeInit (a raw <script> inside the React tree would warn).
 * Gives search engines typed entities: who you are, your profile
 * links, and the site's name/URL.
 */
"use client";

import { useServerInsertedHTML } from "next/navigation";

/** BUGFIX: JSON-LD is injected raw inside a <script> — a CMS value
 *  containing "</script>" would terminate the tag early (malformed
 *  markup + potential self-XSS). Escaping `<` as \u003c makes the
 *  serialized JSON safe while staying valid JSON. */
const jsonLd = (o: unknown): string =>
  JSON.stringify(o).replace(/</g, "\\u003c");

export default function JsonLd({
  name,
  url,
  email,
  github,
  headline,
}: {
  name: string;
  url: string;
  email: string;
  github: string;
  headline: string;
}) {
  useServerInsertedHTML(() => {
    const person = {
      "@context": "https://schema.org",
      "@type": "Person",
      name,
      url,
      email,
      jobTitle: headline,
      sameAs: [`https://github.com/${github}`],
    };
    const site = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: `${name} — Portfolio`,
      url,
      description: headline,
    };
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(person) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(site) }}
        />
      </>
    );
  });
  return null;
}
