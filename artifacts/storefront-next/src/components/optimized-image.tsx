"use client";

import Image from "next/image";

function shouldUseNextOptimizer(src: string): boolean {
  if (!src || src.startsWith("data:")) return false;
  try {
    const u = new URL(src, typeof window !== "undefined" ? window.location.origin : "https://example.com");
    if (u.hostname === "images.unsplash.com") return true;
    if (u.pathname.includes("/uploads/")) return true;
    return false;
  } catch {
    return src.includes("/uploads/");
  }
}

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
};

/**
 * Uses `next/image` for known remote patterns (AVIF/WebP); falls back to `<img>` for other URLs.
 */
export function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 800,
  className,
  sizes = "(max-width: 768px) 50vw, 33vw",
  priority = false,
  fill = false,
}: Props) {
  if (!src) return null;

  if (!shouldUseNextOptimizer(src)) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        loading={priority ? undefined : "lazy"}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      priority={priority}
      loading={priority ? undefined : "lazy"}
    />
  );
}
