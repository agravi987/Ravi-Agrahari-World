/**
 * manifest.ts — dynamic web app manifest (PWA basics).
 * Served at /manifest.webmanifest by the App Router. Identity comes
 * from the content layer (D6) so the installed-app name always
 * matches the site — never hardcoded.
 */
import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { config } = await getContent();

  return {
    name: `${config.name} — Portfolio`,
    short_name: config.name,
    description: config.headline,
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#faf9f6",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
