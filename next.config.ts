import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Remote images (plan D8): Cloudinary hosts CMS uploads; GitHub
     hosts avatars/repo images. Only these hosts are ever allowed. */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
    ],
  },
};

export default nextConfig;
