import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Remote images (plan D8): Cloudinary hosts CMS uploads; GitHub
     hosts avatars/repo images. Only these hosts are ever allowed.
     NOTE: keep in sync with ALLOWED_IMAGE_HOSTS in src/lib/imageHosts.ts
     (components check that list before rendering a CMS image). */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
    ],
  },
  /* Baseline hardening headers. Deliberately NO Content-Security-Policy
     here: Next injects inline scripts/styles (hydration, fonts) that
     would need hash-based CSP allowances — easy to get wrong, hard to
     verify in CI. The four below are safe to apply globally. */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
