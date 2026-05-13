import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchApiJson } from "@/lib/api-origin";
import ProductDetailClient from "@/components/pages/product-detail-client";
import { JsonLd } from "@/components/json-ld";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  images?: string[];
  basePrice?: string | number | null;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pid = parseInt(id, 10);
  if (Number.isNaN(pid)) {
    return { title: "Product" };
  }
  try {
    const product = await fetchApiJson<Product>(`/api/products/${pid}`, {
      next: { revalidate: 120 },
    });
    const desc =
      (product.description?.slice(0, 155) ?? `Buy ${product.name} at Ilyas Store.`).trim();
    const image = product.images?.[0];
    const url = `${siteUrl}/products/${pid}`;
    return {
      title: product.name,
      description: desc,
      alternates: { canonical: url },
      openGraph: {
        title: `${product.name} | Ilyas Store`,
        description: desc,
        url,
        type: "website",
        images: image ? [{ url: image }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} | Ilyas Store`,
        description: desc,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return { title: "Product", robots: { index: false } };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = parseInt(id, 10);
  if (Number.isNaN(pid)) notFound();

  let product: Product | null = null;
  try {
    product = await fetchApiJson<Product>(`/api/products/${pid}`, {
      next: { revalidate: 60 },
    });
  } catch {
    notFound();
  }

  if (!product) notFound();

  const price = Number(product.basePrice ?? 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images?.filter(Boolean),
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price,
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/products/${pid}`,
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductDetailClient initialProduct={product as any} />
    </>
  );
}
