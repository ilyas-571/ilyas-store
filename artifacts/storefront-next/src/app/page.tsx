import type { Metadata } from "next";
import { Suspense } from "react";
import HomeClient, { type HomeClientProps } from "@/components/pages/home-client";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { fetchApiJson } from "@/lib/api-origin";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Shop the finest fragrances, timepieces, and cosmetics at Ilyas Store.",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "Ilyas Store — Home",
    description:
      "Shop the finest fragrances, timepieces, and cosmetics at Ilyas Store.",
    url: siteUrl,
    type: "website",
  },
};

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await fetchApiJson<T>(path, { next: { revalidate: 60 } });
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [banners, categoriesList, featuredList, topSellingList] = await Promise.all([
    safeFetch<unknown[]>("/api/banners", []),
    safeFetch<
      {
        id: number;
        name: string;
        image?: string | null;
        productCount?: number;
      }[]
    >("/api/categories", []),
    safeFetch<Record<string, unknown>[]>("/api/products/featured", []),
    safeFetch<Record<string, unknown>[]>("/api/products/top-selling?limit=8", []),
  ]);

  const bannerList = Array.isArray(banners) ? banners : [];
  const firstBannerImage =
    typeof bannerList[0] === "object" &&
    bannerList[0] !== null &&
    "image" in bannerList[0] &&
    typeof (bannerList[0] as { image?: string }).image === "string"
      ? (bannerList[0] as { image: string }).image
      : null;

  return (
    <>
      {firstBannerImage && !/\.(mp4|webm|ogg)$/i.test(firstBannerImage) ? (
        <link rel="preload" as="image" href={firstBannerImage} fetchPriority="high" />
      ) : null}
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <HomeClient
            banners={bannerList as HomeClientProps["banners"]}
            categoriesList={categoriesList}
            featuredList={featuredList}
            topSellingList={topSellingList}
          />
        </main>
        <Suspense fallback={<div className="min-h-[200px] bg-foreground" aria-hidden />}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
}
