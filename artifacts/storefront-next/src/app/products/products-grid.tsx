import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function isVideo(url: string) {
  return url.match(/\.(mp4|webm|ogg)$/i);
}

function canOptimize(src: string) {
  try {
    const u = new URL(src, "https://example.com");
    return u.hostname === "images.unsplash.com" || u.pathname.includes("/uploads/");
  } catch {
    return src.includes("/uploads/");
  }
}

export type ProductLite = {
  id: number;
  name: string;
  categoryName?: string | null;
  basePrice?: string | number | null;
  averageRating?: number | null;
  images?: string[] | null;
};

export function ProductsGrid({ products }: { products: ProductLite[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-serif text-2xl text-muted-foreground mb-3">No products found</p>
        <p className="text-sm text-muted-foreground font-sans">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.id}`} className="group cursor-pointer block">
          <div className="aspect-square overflow-hidden bg-[#f8f8f8] mb-3 relative flex items-center justify-center">
            {product.images?.[0] ? (
              isVideo(product.images[0]) ? (
                <video
                  src={product.images[0]}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : canOptimize(product.images[0]) ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={400}
                  height={400}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0]}
                  alt={product.name}
                  loading="lazy"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-300 font-serif text-4xl">I</span>
              </div>
            )}
          </div>
          <div className="text-center px-2">
            <p className="text-[10px] tracking-[0.2em] uppercase text-gray-500 font-sans mb-1">
              {product.categoryName}
            </p>
            <h3 className="font-sans text-xs font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2">
              {product.name}
            </h3>
            <div className="flex flex-col items-center gap-1.5">
              <span className="font-sans text-sm font-bold text-[#1a1a1a]">
                Rs. {Number(product.basePrice || 0).toLocaleString()}
              </span>
              {product.averageRating != null && product.averageRating > 0 && (
                <span className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < Math.round(product.averageRating ?? 0)
                          ? "fill-[#b8860b] text-[#b8860b]"
                          : "fill-gray-200 text-gray-200",
                      )}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
