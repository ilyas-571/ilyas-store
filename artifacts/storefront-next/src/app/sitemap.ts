import type { MetadataRoute } from "next";
import { getInternalApiOrigin } from "@/lib/api-origin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const apiBase = getInternalApiOrigin();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const res = await fetch(`${apiBase}/api/products?limit=500&page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return staticRoutes;
    const data = (await res.json()) as { products?: { id: number }[] };
    const products = data.products ?? [];
    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}/products/${p.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    return [...staticRoutes, ...productUrls];
  } catch {
    return staticRoutes;
  }
}
