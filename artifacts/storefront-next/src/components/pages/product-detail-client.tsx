"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Star, Minus, Plus, ShoppingBag, Package, ChevronDown, ChevronUp, Share2, Truck, ShieldCheck, RotateCcw, Heart, Droplets, Wind, Sparkles, Zap, Award, TrendingUp } from "lucide-react";
import { useGetProduct, useAddReview, useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getGetProductQueryKey } from "@workspace/api-client-react";
import { OptimizedImage } from "@/components/optimized-image";

function isVideo(url: string) {
  return url.match(/\.(mp4|webm|ogg)$/i);
}

export type ProductDetailClientProps = {
  initialProduct?: any | null;
};

export default function ProductDetailClient({ initialProduct = null }: ProductDetailClientProps) {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(String(params?.id ?? "0"), 10);
  const { data: productResponse, isLoading } = useGetProduct(id, {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id) },
  });
  let product = productResponse?.data ?? initialProduct;
  if (typeof product === "string")
    try {
      product = JSON.parse(product) as any;
    } catch {
      /* ignore */
    }

  const { addItem, setBuyNow } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addReviewMutation = useAddReview();

  // Related products
  const relatedParams = { category: product?.categoryName, limit: 6 };
  const { data: relatedResponse } = useListProducts(
    relatedParams,
    { query: { enabled: !!product?.categoryName, queryKey: getListProductsQueryKey(relatedParams) } }
  );
  let relatedData = relatedResponse?.data;
  if (typeof relatedData === 'string') try { relatedData = JSON.parse(relatedData); } catch(e){}
  const relatedProducts = (relatedData?.products ?? []).filter((p: any) => p.id !== id).slice(0, 4);

  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "notes" | "details">("description");
  
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  useEffect(() => { setActiveImage(0); setQty(1); setSelectedVariantId(null); }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const itemToAdd = { ...product };
    const variant = selectedVariantId ? product.variants?.find((v: any) => v.id === selectedVariantId) : null;
    if (variant) (itemToAdd as any).name = `${product.name} (${variant.type}: ${variant.value})`;
    addItem(itemToAdd as any, qty, selectedVariantId || undefined);
    toast({ title: "Added to Cart", description: `${qty}x ${(itemToAdd as any).name ?? product.name}` });
  };

  const handleOrderNow = () => {
    if (!product) return;
    setBuyNow(product as any, qty, selectedVariantId || undefined);
    router.push("/cart");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product?.name, url }); } catch { }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Product link copied to clipboard" });
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addReviewMutation.mutateAsync({ id, data: { rating: reviewRating, comment: reviewComment } });
      toast({ title: "Review submitted ✓" });
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) });
    } catch (err: any) {
      toast({ title: "Failed to submit review", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  if (isLoading && !product) {
    return (
      <>
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-pulse">
            <div className="space-y-4">
              <Skeleton className="aspect-square rounded-lg bg-gradient-to-r from-slate-100 to-slate-50" />
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-20 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50" />
                ))}
              </div>
            </div>
            <div className="space-y-8 mt-10">
              <Skeleton className="h-8 w-32 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50" />
              <Skeleton className="h-12 w-3/4 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50" />
              <Skeleton className="h-10 w-1/4 rounded-lg bg-gradient-to-r from-amber-100 to-amber-50" />
              <Skeleton className="h-32 w-full rounded-lg bg-gradient-to-r from-slate-100 to-slate-50" />
              <div className="flex gap-3">
                <Skeleton className="h-16 w-32 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50" />
                <Skeleton className="h-16 flex-1 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <div className="max-w-[1400px] mx-auto px-4 py-32 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
          <p className="font-serif text-3xl tracking-wide text-foreground mb-4">Product Not Found</p>
          <p className="font-sans text-muted-foreground mb-8">This exclusive item is no longer available in our collection.</p>
          <Link href="/products">
            <Button className="rounded-none uppercase tracking-widest text-xs px-8 py-6 bg-foreground text-background hover:bg-foreground/90">
              Return to Boutique
            </Button>
          </Link>
        </div>
      </>
    );
  }

  const images: string[] = product.images?.length ? product.images : [];
  const variants: any[] = product.variants ?? [];

  const variantGroups: Record<string, any[]> = {};
  for (const v of variants) {
    const type = v.type || "option";
    if (!variantGroups[type]) variantGroups[type] = [];
    variantGroups[type].push(v);
  }

  const selectedVariant = selectedVariantId
    ? variants.find((v: any) => v.id === selectedVariantId)
    : null;

  const activeStock = selectedVariant ? selectedVariant.stock : (product.stock ?? 0);
  const inStock = activeStock > 0;
  const reviews = product.reviews ?? [];
  const unitPrice = selectedVariant ? Number(selectedVariant.price) : (Number(product.basePrice) || 0);
  const totalPrice = unitPrice * qty;

  return (
    <>
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-3 text-[10px] sm:text-xs uppercase tracking-widest font-sans text-foreground/70 mb-10">
          <Link href="/" aria-label="Go to boutique home"><span className="hover:text-foreground transition-colors cursor-pointer">Boutique</span></Link>
          <span className="text-foreground/40" aria-hidden="true">/</span>
          <Link href="/products" aria-label="View all product collections"><span className="hover:text-foreground transition-colors cursor-pointer">Collections</span></Link>
          {product.categoryName && (
            <>
              <span className="text-foreground/40" aria-hidden="true">/</span>
              <Link href={`/products?category=${product.categoryName}`} aria-label={`View ${product.categoryName} category`}>
                <span className="hover:text-foreground transition-colors cursor-pointer">{product.categoryName}</span>
              </Link>
            </>
          )}
          <span className="text-foreground/40" aria-hidden="true">/</span>
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20">

          {/* ─── Image Gallery ─── */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto scrollbar-hide w-full md:w-28 shrink-0 pb-2 md:pb-0">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "flex-shrink-0 h-20 w-20 md:h-28 md:w-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden transition-all duration-300 relative group",
                      i === activeImage 
                        ? "ring-2 ring-offset-2 ring-foreground opacity-100 scale-105 md:scale-100" 
                        : "opacity-60 hover:opacity-100 ring-2 ring-transparent hover:ring-slate-300 hover:scale-105 md:hover:scale-100"
                    )}
                  >
                    {isVideo(img) ? (
                      <div className="relative w-full h-full bg-muted flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-foreground border-b-[5px] border-b-transparent ml-1" />
                      </div>
                    ) : (
                      <img src={img} alt={`Thumbnail ${i + 1}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    )}
                    {i === activeImage && (
                      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Main Image with Enhanced Effects */}
            <div className="relative aspect-[4/5] bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden group w-full flex-1 rounded-lg shadow-2xl">
              {images[activeImage] ? (
                isVideo(images[activeImage]) ? (
                  <video src={images[activeImage]} controls autoPlay muted loop className="w-full h-full object-cover" />
                ) : (
                  <div className="relative h-full w-full">
                    <OptimizedImage
                      src={images[activeImage]}
                      alt={product.name}
                      fill
                      priority={activeImage === 0}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 origin-center cursor-zoom-in"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                    />
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform skew-x-12" />
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-serif text-muted-foreground/30 tracking-widest">ILYAS</span>
                </div>
              )}

              {/* Enhanced Badges & Actions */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {product.isFeatured && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 font-sans font-bold rounded-full shadow-lg">
                    <Sparkles className="h-3 w-3" /> Exclusif
                  </div>
                )}
                {product.compareAtPrice && Number(product.compareAtPrice) > (Number(product.basePrice) || 0) && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 font-sans font-bold rounded-full shadow-lg animate-pulse">
                    <TrendingUp className="h-3 w-3" /> 
                    {Math.round(((Number(product.compareAtPrice) - Number(product.basePrice || 0)) / Number(product.compareAtPrice)) * 100)}% Off
                  </div>
                )}
              </div>

              <button
                aria-label={wishlist ? "Remove from wishlist" : "Add to wishlist"}
                onClick={() => { setWishlist(!wishlist); toast({ title: wishlist ? "Removed from wishlist" : "Added to wishlist ♥" }); }}
                className="absolute top-6 right-6 h-14 w-14 bg-white/90 backdrop-blur-lg flex items-center justify-center hover:bg-white hover:scale-125 transition-all duration-300 z-10 rounded-full shadow-xl hover:shadow-2xl group"
              >
                <Heart className={cn("h-6 w-6 transition-all duration-300", wishlist ? "fill-red-700 text-red-700 scale-110" : "text-foreground group-hover:scale-110")} />
              </button>

              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-sans tracking-widest">
                  {activeImage + 1} / {images.length}
                </div>
              )}

              {/* Share button */}
              <button
                onClick={handleShare}
                aria-label="Share product"
                className="absolute bottom-4 left-4 h-12 w-12 bg-white/90 backdrop-blur-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 z-10 rounded-full shadow-xl hover:shadow-2xl"
              >
                <Share2 className="h-5 w-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* ─── Product Info ─── */}
          <div className="lg:col-span-5 flex flex-col animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150">
            <p className="text-[10px] tracking-[0.2em] uppercase text-foreground/60 font-sans mb-4 font-semibold">{product.categoryName} {product.brand && `• ${product.brand}`}</p>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-foreground leading-[1.1] mb-6 tracking-tight animate-in fade-in duration-700">
              {product.name}
            </h1>
            
            {/* Enhanced Price with Discount Display */}
            <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="flex items-end gap-4 mb-2">
                <span className="font-serif text-4xl lg:text-5xl text-foreground font-bold">
                  Rs. {totalPrice.toLocaleString()}
                </span>
                {product.compareAtPrice && Number(product.compareAtPrice) > unitPrice && (
                  <>
                    <span className="font-sans text-lg text-foreground/60 line-through">
                      Rs. {Number(product.compareAtPrice).toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-white bg-red-600 px-3 py-1 rounded-full">
                      Save Rs. {(Number(product.compareAtPrice) - unitPrice).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
              {selectedVariant && (
                <p className="text-xs text-foreground/70 font-sans uppercase tracking-widest">
                  Unit Price: Rs. {unitPrice.toLocaleString()}
                </p>
              )}
            </div>

            {/* Enhanced Rating */}
            {product.averageRating != null && product.averageRating > 0 && (
              <div className="flex items-center gap-4 mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer group hover:shadow-md transition-all" onClick={() => document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" })}>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={cn("h-5 w-5 transition-colors", s <= Math.round(product.averageRating!) ? "fill-amber-500 text-amber-500" : "text-foreground/20")} />
                  ))}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {product.averageRating.toFixed(1)} out of 5
                  </p>
                  <p className="text-xs text-foreground/70 font-sans uppercase tracking-widest">
                    Based on {product.reviewCount} verified reviews
                  </p>
                </div>
                <ChevronDown className="h-5 w-5 text-foreground group-hover:translate-y-1 transition-transform" />
              </div>
            )}

            <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

            {/* Variants with Enhanced Styling */}
            {Object.entries(variantGroups).map(([type, groupVars]) => (
              <div key={type} className="mb-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-xs tracking-widest uppercase font-sans text-foreground/70 font-bold">Select {type}</span>
                  {selectedVariantId && groupVars.find((v: any) => v.id === selectedVariantId) && (
                    <span className="text-sm font-serif text-foreground bg-slate-100 px-3 py-1 rounded-full">
                      ✓ {groupVars.find((v: any) => v.id === selectedVariantId)!.value}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {groupVars.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQty(1);
                        if (v.imageUrl) {
                          const idx = images.indexOf(v.imageUrl);
                          if (idx !== -1) setActiveImage(idx);
                        }
                      }}
                      className={cn(
                        "px-5 py-3 text-sm font-sans transition-all duration-300 font-semibold rounded-lg",
                        selectedVariantId === v.id
                          ? "bg-foreground text-background ring-2 ring-foreground ring-offset-2 shadow-lg transform scale-105"
                          : "bg-white text-foreground ring-2 ring-border hover:ring-foreground/50 hover:shadow-md",
                        v.stock <= 0 && "opacity-50 cursor-not-allowed hover:ring-border bg-muted"
                      )}
                      disabled={v.stock <= 0}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Enhanced Stock Status */}
            <div className="mb-8 p-4 rounded-lg" style={{background: inStock ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}}>
              {inStock ? (
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    {activeStock <= 5 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={cn("relative inline-flex rounded-full h-3 w-3", activeStock <= 5 ? "bg-emerald-500" : "bg-emerald-600")}></span>
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest font-sans text-emerald-700">
                    {activeStock <= 5 ? `⏰ Only ${activeStock} left in stock!` : "✓ In Stock - Ready to Ship"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📭</span>
                  <span className="text-sm font-bold uppercase tracking-widest font-sans text-red-700">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Add to Cart & Buy Now - Enhanced */}
            {inStock && (
              <div className="flex flex-col gap-4 mb-12">
                <div className="flex gap-3 h-16">
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between border-2 border-foreground w-32 px-3 shrink-0 h-16 rounded-lg hover:shadow-lg transition-shadow">
                    <button aria-label="Decrease quantity" onClick={() => setQty(q => Math.max(1, q - 1))} className="text-foreground hover:bg-slate-100 transition-colors p-2 rounded">
                      <Minus className="h-5 w-5 font-bold" />
                    </button>
                    <span className="font-sans text-lg font-bold">{qty}</span>
                    <button aria-label="Increase quantity" onClick={() => setQty(q => Math.min(activeStock, q + 1))} className="text-foreground hover:bg-slate-100 transition-colors p-2 rounded">
                      <Plus className="h-5 w-5 font-bold" />
                    </button>
                  </div>
                  
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    className="flex-1 h-full rounded-lg border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 font-sans tracking-widest uppercase text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transform"
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" /> Add to Cart
                  </Button>
                </div>
                
                <Button
                  onClick={handleOrderNow}
                  className="w-full h-16 rounded-lg bg-gradient-to-r from-foreground to-slate-800 text-background hover:from-slate-800 hover:to-foreground transition-all duration-300 font-sans tracking-widest uppercase text-sm font-bold shadow-xl hover:shadow-2xl hover:scale-105 transform"
                >
                  <Zap className="h-5 w-5 mr-2" /> Buy It Now
                </Button>
              </div>
            )}

            {/* Enhanced Trust Badges */}
            <div className="grid grid-cols-3 border-2 border-foreground/20 divide-x-2 divide-foreground/20 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center justify-center p-5 text-center gap-2 group hover:bg-slate-100 transition-colors cursor-help">
                <Truck className="h-6 w-6 text-foreground group-hover:scale-125 transition-transform" strokeWidth={1.5} />
                <span className="text-[9px] uppercase tracking-widest font-sans font-bold text-foreground/80 leading-tight">Free<br/>Shipping</span>
              </div>
              <div className="flex flex-col items-center justify-center p-5 text-center gap-2 group hover:bg-slate-100 transition-colors cursor-help">
                <RotateCcw className="h-6 w-6 text-foreground group-hover:scale-125 transition-transform" strokeWidth={1.5} />
                <span className="text-[9px] uppercase tracking-widest font-sans font-bold text-foreground/80 leading-tight">Easy<br/>Returns</span>
              </div>
              <div className="flex flex-col items-center justify-center p-5 text-center gap-2 group hover:bg-slate-100 transition-colors cursor-help">
                <ShieldCheck className="h-6 w-6 text-foreground group-hover:scale-125 transition-transform" strokeWidth={1.5} />
                <span className="text-[9px] uppercase tracking-widest font-sans font-bold text-foreground/80 leading-tight">Secure<br/>Checkout</span>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Detailed Information Tabs ─── */}
        <div className="max-w-4xl mx-auto mb-24 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
          <div className="flex justify-center gap-8 md:gap-16 border-b-2 border-foreground/10 mb-12 overflow-x-auto">
            <button 
              onClick={() => setActiveTab("description")} 
              className={cn("py-5 text-xs uppercase tracking-[0.2em] font-sans transition-all relative min-h-[48px] whitespace-nowrap font-bold text-lg", activeTab === "description" ? "text-foreground" : "text-foreground/60 hover:text-foreground")}
            >
              The Story
              {activeTab === "description" && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab("notes")} 
              className={cn("py-5 text-xs uppercase tracking-[0.2em] font-sans transition-all relative min-h-[48px] whitespace-nowrap font-bold text-lg", activeTab === "notes" ? "text-foreground" : "text-foreground/60 hover:text-foreground")}
            >
              Olfactory Notes
              {activeTab === "notes" && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />}
            </button>
            <button 
              onClick={() => setActiveTab("details")} 
              className={cn("py-5 text-xs uppercase tracking-[0.2em] font-sans transition-all relative min-h-[48px] whitespace-nowrap font-bold text-lg", activeTab === "details" ? "text-foreground" : "text-foreground/60 hover:text-foreground")}
            >
              Details
              {activeTab === "details" && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />}
            </button>
          </div>

          <div className="min-h-[250px]">
            {activeTab === "description" && (
              <div className="animate-in fade-in duration-500 p-8 bg-gradient-to-b from-slate-50 to-white rounded-lg border border-slate-200">
                <p className="font-serif text-lg md:text-xl text-center leading-relaxed text-foreground/85 px-4 whitespace-pre-line">
                  {product.description || "A signature creation that embodies the spirit of Ilyas Store. Crafted with precision and passion for the modern connoisseur."}
                </p>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-in fade-in duration-500 px-4">
                <div className="flex flex-col items-center text-center gap-5 p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-lg transition-all group">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Sparkles className="h-8 w-8 text-amber-900" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl mb-2 font-bold">Top Notes</h3>
                    <p className="text-sm font-sans text-muted-foreground">The initial impression. Bright, sparkling, and captivating.</p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-5 p-6 rounded-lg bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 hover:shadow-lg transition-all group">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Droplets className="h-8 w-8 text-pink-900" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl mb-2 font-bold">Heart Notes</h3>
                    <p className="text-sm font-sans text-muted-foreground">The true personality. Deep, floral, or spicy character.</p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-5 p-6 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 hover:shadow-lg transition-all group">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Wind className="h-8 w-8 text-orange-900" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl mb-2 font-bold">Base Notes</h3>
                    <p className="text-sm font-sans text-muted-foreground">The lingering memory. Rich woods, amber, or musk.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "details" && (
              <div className="max-w-xl mx-auto font-sans text-sm animate-in fade-in duration-500">
                <div className="grid grid-cols-2 py-4 border-b-2 border-border/30 hover:bg-slate-50 px-4 -mx-4 transition-colors">
                  <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Brand</span>
                  <span className="text-foreground font-bold text-right">{product.brand || "Ilyas"}</span>
                </div>
                <div className="grid grid-cols-2 py-4 border-b-2 border-border/30 hover:bg-slate-50 px-4 -mx-4 transition-colors">
                  <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Collection</span>
                  <span className="text-foreground font-bold text-right">{product.categoryName}</span>
                </div>
                <div className="grid grid-cols-2 py-4 border-b-2 border-border/30 hover:bg-slate-50 px-4 -mx-4 transition-colors">
                  <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Application</span>
                  <span className="text-foreground font-bold text-right">Spray on pulse points</span>
                </div>
                <div className="grid grid-cols-2 py-4 hover:bg-slate-50 px-4 -mx-4 transition-colors">
                  <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">SKU</span>
                  <span className="text-foreground font-bold text-right text-xs">{selectedVariant?.sku || product.sku || "N/A"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Full Width Image Break (Luxury Touch) ─── */}
        {images.length > 2 && (
          <div className="w-screen relative left-1/2 -translate-x-1/2 h-[40vh] md:h-[60vh] mb-24 overflow-hidden rounded-lg shadow-2xl group">
            <img 
              src={images[1]} 
              alt="Lifestyle" 
              loading="lazy" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 group-hover:to-black/50 transition-all duration-700" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="font-serif text-5xl md:text-7xl text-white tracking-widest opacity-90 group-hover:opacity-100 transition-opacity duration-500 block mb-4 drop-shadow-lg">ELEGANCE</span>
                <span className="font-sans text-white/70 uppercase tracking-[0.3em] text-xs md:text-sm drop-shadow-md">Discover the Art of Refinement</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Reviews ─── */}
        <div id="reviews-section" className="max-w-4xl mx-auto mb-24 scroll-mt-24">
          <div className="text-center mb-16 animate-in fade-in duration-700">
            <div className="inline-block mb-4">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-900 px-4 py-2 rounded-full font-sans text-xs uppercase tracking-widest font-bold">
                <Award className="h-4 w-4" /> Customer Reviews
              </div>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">Trusted by Our Customers</h2>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {product.averageRating != null && product.averageRating > 0 ? (
                <>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("h-6 w-6", s <= Math.round(product.averageRating!) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20")} />
                    ))}
                  </div>
                  <span className="text-base font-sans uppercase tracking-widest font-bold">
                    {product.averageRating.toFixed(1)} • {product.reviewCount} Reviews
                  </span>
                </>
              ) : (
                <span className="text-base font-sans uppercase tracking-widest text-muted-foreground font-bold">Be the first to review this masterpiece</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Review list */}
            <div className="md:col-span-7 space-y-6">
              {reviews.length === 0 ? (
                <div className="py-16 border-2 border-dashed border-border/50 text-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-sans text-base tracking-wide font-semibold">No reviews yet for this masterpiece.</p>
                  <p className="text-muted-foreground/70 font-sans text-sm mt-2">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review: any, idx: number) => (
                    <div 
                      key={review.id} 
                      className="animate-in fade-in p-6 border-l-4 border-amber-400 bg-gradient-to-r from-amber-50/50 to-white rounded-lg hover:shadow-md transition-all duration-300 hover:border-l-amber-500"
                      style={{animationDelay: `${idx * 100}ms`}}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-gradient-to-br from-foreground to-slate-700 text-white flex items-center justify-center font-serif text-lg rounded-full font-bold shadow-md">
                            {review.userName?.charAt(0)?.toUpperCase() ?? "U"}
                          </div>
                          <div>
                            <p className="text-base font-bold uppercase tracking-widest font-sans text-foreground">{review.userName}</p>
                            <p className="text-[11px] text-muted-foreground font-sans uppercase tracking-widest mt-1">
                              {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 bg-amber-100 p-2 rounded-lg">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={cn("h-4 w-4", s <= review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20")} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-base text-foreground/85 font-serif leading-relaxed pl-0">
                          <span className="text-2xl text-amber-400 mr-2">"</span>{review.comment}<span className="text-2xl text-amber-400 ml-2">"</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review form */}
            <div className="md:col-span-5">
              {user ? (
                <form onSubmit={handleReview} className="bg-gradient-to-br from-slate-50 to-white p-8 border-2 border-foreground/10 rounded-lg shadow-lg">
                  <h3 className="font-serif text-2xl text-foreground mb-2 font-bold">Share Your Experience</h3>
                  <p className="text-muted-foreground text-sm font-sans mb-8">Your feedback helps our community discover amazing products</p>
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-widest font-sans text-muted-foreground mb-4 font-bold">How would you rate this?</p>
                    <div className="flex gap-2 bg-amber-50 p-4 rounded-lg">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button 
                          key={s} 
                          type="button"
                          aria-label={`Rate ${s} stars`}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewRating(s)}
                          className="transform transition-all duration-200 hover:scale-150">
                          <Star className={cn("h-8 w-8 transition-colors", s <= (hoverRating || reviewRating) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20 hover:text-amber-300")} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-widest font-sans text-muted-foreground mb-4 font-bold">Tell us more</p>
                    <Textarea
                      placeholder="Describe your experience with this product..."
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      rows={5}
                      className="font-sans resize-none rounded-lg border-2 border-border/50 bg-white focus:border-foreground focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={addReviewMutation.isPending} 
                    className="w-full rounded-lg h-12 uppercase tracking-widest text-sm font-sans font-bold bg-gradient-to-r from-foreground to-slate-800 hover:from-slate-800 hover:to-foreground shadow-lg hover:shadow-xl transition-all"
                  >
                    {addReviewMutation.isPending ? "Submitting..." : "✓ Submit Review"}
                  </Button>
                </form>
              ) : (
                <div className="bg-gradient-to-br from-slate-50 to-white p-8 text-center border-2 border-foreground/10 rounded-lg shadow-lg">
                  <div className="text-5xl mb-4">🔐</div>
                  <h3 className="font-serif text-2xl text-foreground mb-2 font-bold">Share Your Thoughts</h3>
                  <p className="text-muted-foreground font-sans mb-8 text-base">Join our community of connoisseurs to leave a review and help others discover this gem.</p>
                  <Link href="/login">
                    <Button className="w-full rounded-lg h-12 uppercase tracking-widest text-sm font-sans font-bold border-2 border-foreground bg-white text-foreground hover:bg-foreground hover:text-white transition-all shadow-md hover:shadow-lg">
                      Sign In to Review
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Related Products ─── */}
        {relatedProducts.length > 0 && (
          <div className="pt-20 border-t-2 border-border/30 mt-24">
            <div className="text-center mb-16 animate-in fade-in duration-700">
              <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">Discover More</h2>
              <p className="text-muted-foreground font-sans tracking-wide max-w-2xl mx-auto">
                Explore our curated selection of premium products from the same collection
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {relatedProducts.map((p: any, idx: number) => (
                <Link key={p.id} href={`/products/${p.id}`}>
                  <div className="group cursor-pointer animate-in fade-in duration-500" style={{animationDelay: `${idx * 100}ms`}}>
                    <div className="aspect-[4/5] bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden mb-4 relative rounded-lg shadow-md group-hover:shadow-2xl transition-all duration-300">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} loading="lazy" className="w-full h-full object-cover transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="h-12 w-12 text-muted-foreground/15" /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-4">
                        <Button className="w-full h-10 rounded-lg bg-white text-foreground font-bold uppercase text-xs tracking-widest hover:bg-foreground hover:text-white transition-all">
                          View Details
                        </Button>
                      </div>
                      {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.basePrice || 0) && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                          Sale
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-sans mb-2 font-semibold group-hover:text-foreground transition-colors">{p.brand || p.categoryName}</p>
                    <p className="text-sm font-serif text-foreground line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors leading-tight">{p.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-sans font-bold text-foreground">Rs. {Number(p.basePrice ?? 0).toLocaleString()}</p>
                      {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.basePrice || 0) && (
                        <p className="text-xs text-muted-foreground line-through">Rs. {Number(p.compareAtPrice).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Sticky Mobile Bottom Bar ─── */}
      {inStock && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-xl border-t-2 border-border p-4 flex gap-2 lg:hidden z-50 shadow-2xl shadow-foreground/20 pb-safe">
          <Button
            onClick={handleAddToCart}
            variant="outline"
            className="flex-1 rounded-lg border-2 border-foreground text-foreground text-xs uppercase tracking-widest font-sans font-bold h-12 hover:bg-foreground hover:text-background transition-all hover:scale-105 transform"
          >
            <ShoppingBag className="h-4 w-4 mr-2" /> Add
          </Button>
          <Button
            onClick={handleOrderNow}
            className="flex-1 rounded-lg bg-gradient-to-r from-foreground to-slate-800 text-background text-xs uppercase tracking-widest font-sans font-bold h-12 hover:from-slate-800 hover:to-foreground shadow-lg hover:shadow-xl hover:scale-105 transform transition-all"
          >
            <Zap className="h-4 w-4 mr-2" /> Buy Now
          </Button>
        </div>
      )}
    </>
  );
}
