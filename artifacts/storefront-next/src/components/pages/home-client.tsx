"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/optimized-image";

function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

type Banner = { title?: string; subtitle?: string | null; image?: string | null; link?: string | null };

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (!banners?.length) {
    return (
      <section
        aria-label="Hero banner"
        className="relative w-full min-h-[400px] md:min-h-[520px] bg-foreground flex items-center justify-center overflow-hidden"
      >
        <div className="text-center text-background px-6 max-w-xl z-10">
          <p className="text-xs tracking-[0.3em] uppercase text-background/50 font-sans mb-4">New Collection</p>
          <h1 className="font-serif text-5xl md:text-6xl font-semibold leading-tight mb-6 text-background">
            The Art of Luxury
          </h1>
          <p className="text-background/60 font-sans text-base mb-8 leading-relaxed">
            Perfumes that linger. Watches that endure. Cosmetics that transform.
          </p>
          <Link href="/products">
            <Button
              size="lg"
              variant="outline"
              className="border-background/30 text-background hover:bg-background hover:text-foreground"
            >
              Explore Collection <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Hero banner" className="relative w-full h-[400px] md:h-[520px] overflow-hidden group">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {banners.map((banner, index) => (
            <div key={index} className="relative flex-[0_0_100%] h-full">
              <div className="absolute inset-0 bg-[#1a1a1a]">
                {banner.image && !isVideo(banner.image) ? (
                  <div className="relative h-full w-full">
                    <OptimizedImage
                      src={banner.image}
                      alt={banner.title || "Promotional banner"}
                      fill
                      priority={index === 0}
                      className="object-cover"
                      sizes="100vw"
                    />
                  </div>
                ) : banner.image && isVideo(banner.image) ? (
                  <video
                    src={banner.image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="relative h-full flex items-center px-8 md:px-20 max-w-7xl mx-auto z-[1]">
                <div className="max-w-xl">
                  <p className="text-xs tracking-[0.3em] uppercase text-white/50 font-sans mb-4">Featured</p>
                  {index === 0 ? (
                    <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight mb-4 text-white">
                      {banner.title}
                    </h1>
                  ) : (
                    <p className="font-serif text-4xl md:text-5xl font-semibold leading-tight mb-4 text-white">
                      {banner.title}
                    </p>
                  )}
                  {banner.subtitle && (
                    <p className="text-white/70 font-sans text-base mb-8 leading-relaxed">{banner.subtitle}</p>
                  )}
                  {banner.link && (
                    <Link href={banner.link}>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white hover:text-foreground uppercase tracking-widest font-bold text-[10px]"
                      >
                        Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-10"
            role="group"
            aria-label="Banner slides"
          >
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1} of ${banners.length}`}
                aria-current={i === current ? "true" : undefined}
                onClick={() => emblaApi?.scrollTo(i)}
                className="p-2"
              >
                <div
                  className={cn(
                    "h-1 rounded-full transition-all",
                    i === current ? "w-8 bg-[#b8860b]" : "w-2 bg-white/40",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function ProductCard({ product }: { product: Record<string, unknown> }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const name = String(product.name ?? "");
  const id = Number(product.id);
  const images = product.images as string[] | undefined;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product as never, 1);
    toast({ title: "Added to cart", description: name });
  };

  return (
    <Link href={`/products/${id}`}>
      <div className="group cursor-pointer">
        <div className="aspect-square overflow-hidden bg-[#f8f8f8] mb-3 relative flex items-center justify-center">
          {images?.[0] ? (
            isVideo(images[0]) ? (
              <video
                src={images[0]}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <OptimizedImage
                src={images[0]}
                alt={name}
                width={400}
                height={400}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-300 font-serif text-4xl">I</span>
            </div>
          )}
          <button
            type="button"
            aria-label={`Add ${name} to cart`}
            onClick={handleAddToCart}
            className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] text-white text-[10px] font-bold tracking-widest uppercase font-sans min-h-[48px] py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10"
          >
            Add to Cart
          </button>
        </div>
        <div className="text-center px-2">
          <p className="text-[10px] tracking-[0.2em] uppercase text-gray-500 font-sans mb-1">
            {String(product.categoryName ?? "")}
          </p>
          <h3 className="font-sans text-xs font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2">{name}</h3>
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-sans text-sm font-bold text-[#1a1a1a]">
              Rs. {Number(product.basePrice || 0).toLocaleString()}
            </span>
            {Number(product.averageRating) > 0 && (
              <span
                className="flex items-center gap-0.5"
                role="img"
                aria-label={`${Math.round(Number(product.averageRating))} out of 5 stars`}
              >
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < Math.round(Number(product.averageRating ?? 0))
                        ? "fill-[#b8860b] text-[#b8860b]"
                        : "fill-gray-200 text-gray-200",
                    )}
                  />
                ))}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductSlider({ products, title }: { products: Record<string, unknown>[]; title: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });

  if (!products?.length) return null;

  return (
    <section aria-label={title} className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center mb-10 relative">
          <h2 className="font-sans text-2xl font-bold text-[#1a1a1a] uppercase tracking-widest">{title}</h2>
          <div className="w-12 h-[2px] bg-[#b8860b] mt-3" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
            <button
              type="button"
              aria-label={`Previous ${title} product`}
              onClick={() => emblaApi?.scrollPrev()}
              className="h-12 w-12 border border-gray-200 flex items-center justify-center rounded hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              type="button"
              aria-label={`Next ${title} product`}
              onClick={() => emblaApi?.scrollNext()}
              className="h-12 w-12 border border-gray-200 flex items-center justify-center rounded hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {products.map((p) => (
              <div key={String(p.id)} className="flex-[0_0_50%] md:flex-[0_0_25%] min-w-0 pl-4">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export type HomeClientProps = {
  banners: Banner[];
  featuredList: Record<string, unknown>[];
  topSellingList: Record<string, unknown>[];
  categoriesList: {
    id: number;
    name: string;
    image?: string | null;
    productCount?: number;
  }[];
};

export default function HomeClient({
  banners,
  featuredList,
  topSellingList,
  categoriesList,
}: HomeClientProps) {
  return (
    <div>
      <BannerCarousel banners={banners} />
      {topSellingList.length > 0 && <ProductSlider products={topSellingList} title="Top Selling" />}
      <section aria-label="Shop by category" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-sans mb-2">Shop By</p>
          <h2 className="font-serif text-3xl font-semibold text-foreground">Collections</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoriesList.slice(0, 8).map((cat) => (
            <Link key={cat.id} href={`/products?category=${cat.id}`}>
              <div className="group cursor-pointer relative aspect-square overflow-hidden rounded-sm bg-muted">
                {cat.image ? (
                  <OptimizedImage
                    src={cat.image}
                    alt={cat.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <h3 className="font-serif text-white text-xl font-semibold">{cat.name}</h3>
                  <p className="text-white/60 text-xs font-sans mt-1">{cat.productCount ?? 0} items</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section aria-label="New arrivals" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center mb-10 relative">
            <h2 className="font-sans text-2xl font-bold text-[#1a1a1a] uppercase tracking-widest">New Arrivals</h2>
            <div className="w-12 h-[2px] bg-[#b8860b] mt-3" />
            <Link
              href="/products?featured=true"
              className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:block"
            >
              <Button
                variant="outline"
                className="rounded-none border-gray-300 uppercase text-[10px] tracking-widest font-bold text-gray-900 hover:bg-gray-50"
              >
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredList.slice(0, 8).map((p) => (
              <ProductCard key={String(p.id)} product={p} />
            ))}
          </div>
        </div>
      </section>
      <section
        aria-label="Our commitment"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center"
      >
        <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground font-sans mb-6">Our Commitment</p>
        <blockquote className="font-serif text-3xl md:text-4xl text-foreground max-w-3xl mx-auto leading-relaxed font-medium">
          &quot;Every piece in our collection is chosen with the patience and precision of an artisan — never in
          haste, always in pursuit of the exceptional.&quot;
        </blockquote>
        <div className="mt-8 h-px w-24 bg-primary mx-auto" />
      </section>
    </div>
  );
}
