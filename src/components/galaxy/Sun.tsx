/**
 * Sun.tsx — the galaxy's center: profile photo (or initials) +
 * name + tagline with a soft breathing glow (v4 §5). Server-safe.
 * The DOM avatar keeps the photo crisp (no sphere texture stretch).
 */
import Image from "next/image";
import type { GalaxyProfile } from "@/types/galaxy";
import { initials, sunStyle } from "@/lib/galaxyGeometry";
import { isAllowedImageUrl, withCloudinaryOptimizations } from "@/lib/imageHosts";

export default function Sun({
  profile,
  size = 88,
}: {
  profile: GalaxyProfile;
  size?: number;
}) {
  // BUGFIX: profile.image is CMS-provided — next/image would throw
  // "hostname not configured" for non-allowlisted hosts. Unallowed
  // URLs fall back to the initials core (zero-data safe).
  const hasImage = isAllowedImageUrl(profile.image);
  return (
    <div className="galaxy-sun" style={sunStyle(size)}>
      <div className="galaxy-sun-core">
        {hasImage ? (
          <Image
            src={withCloudinaryOptimizations(profile.image as string)}
            alt={profile.name}
            width={size}
            height={size}
            sizes={`${size}px`}
            className="galaxy-sun-avatar"
            priority
            fetchPriority="high"
          />
        ) : (
          <span className="galaxy-sun-initials" style={{ fontSize: size * 0.42 }}>
            {initials(profile.name) || "✦"}
          </span>
        )}
      </div>
      <p className="galaxy-sun-name" style={{ fontSize: Math.max(14, size * 0.2) }}>
        {profile.name}
      </p>
      {profile.tagline && (
        <p className="galaxy-sun-tagline" style={{ display: size < 80 ? "none" : undefined }}>
          {profile.tagline}
        </p>
      )}
    </div>
  );
}
