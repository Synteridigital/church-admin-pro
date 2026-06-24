"use client";

import { useState } from "react";

type Props = {
  fullName: string;
  photoUrl?: string | null;
  /** Tailwind size class, e.g. "h-9 w-9" or "h-14 w-14" */
  size?: string;
  /** Text size class for initials, e.g. "text-xs" or "text-lg" */
  textSize?: string;
};

export function MemberAvatar({
  fullName,
  photoUrl,
  size = "h-9 w-9",
  textSize = "text-xs",
}: Props) {
  const [imgError, setImgError] = useState(false);
  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={fullName}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover shrink-0 ring-2`}
        style={{ ringColor: "var(--brand)" } as React.CSSProperties}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full flex items-center justify-center ${textSize} font-semibold shrink-0`}
      style={{
        backgroundColor: "var(--brand)",
        color: "var(--brand-text)",
      }}
    >
      {initials}
    </div>
  );
}
