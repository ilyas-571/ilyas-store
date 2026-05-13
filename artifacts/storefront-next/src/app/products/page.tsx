import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { fetchApiJson } from "@/lib/api-origin";
import { ProductsToolbar, type CategoryLite } from "./products-toolbar";
import { ProductsGrid, type ProductLite } from "./products-grid";
import { ProductsPagination } from "./pagination";

type ListResponse = {
  products: ProductLite[];
  totalPages: number;
  page: number;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  return {
    title: "Products | Ilyas Store",
    description:
      "Explore our complete collection of luxury perfumes, watches, and cosmetics.",
    alternates: { canonical: `${base}/products` },
    openGraph: {
      title: "Products | Ilyas Store",
      description:
        "Explore our complete collection of luxury perfumes, watches, and cosmetics.",
      url: `${base}/products`,
      type: "website",
    },
  };
}

function buildListQuery(sp: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  if (sp.search) q.set("search", sp.search);
  if (sp.category) q.set("category", sp.category);
  if (sp.minPrice) q.set("minPrice", sp.minPrice);
  if (sp.maxPrice) q.set("maxPrice", sp.maxPrice);
  if (sp.featured === "true") q.set("featured", "true");
  q.set("limit", "12");
  q.set("page", sp.page ?? "1");
  return q.toString();
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const sp: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) {
    sp[k] = Array.isArray(v) ? v[0] : v;
  }

  const listQs = buildListQuery(sp);
  const navQs = new URLSearchParams(listQs);
  navQs.delete("page");
  const queryForPagination = navQs.toString();

  const [listData, categories] = await Promise.all([
    fetchApiJson<ListResponse>(`/api/products?${listQs}`, {
      next: { revalidate: 60 },
    }),
    fetchApiJson<CategoryLite[]>("/api/categories", {
      next: { revalidate: 120 },
    }),
  ]);

  const page = Number(sp.page ?? "1") || 1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={null}>
          <ProductsToolbar categories={categories} />
        </Suspense>
        <ProductsGrid products={listData.products} />
        <ProductsPagination
          page={page}
          totalPages={listData.totalPages}
          queryString={queryForPagination}
        />
      </div>
      </main>
      <Suspense fallback={<div className="min-h-[200px] bg-foreground" aria-hidden />}>
        <Footer />
      </Suspense>
    </div>
  );
}
