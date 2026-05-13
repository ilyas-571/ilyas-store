"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

export type CategoryLite = { id: number; name: string };

export function ProductsToolbar({ categories }: { categories: CategoryLite[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setMinPrice(searchParams.get("minPrice") ?? "");
    setMaxPrice(searchParams.get("maxPrice") ?? "");
  }, [searchParams]);

  const pushQuery = useCallback(
    (extra: Record<string, string>) => {
      const q = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(extra)) {
        if (v === "") q.delete(k);
        else q.set(k, v);
      }
      q.delete("page");
      router.push(`/products?${q.toString()}`);
    },
    [router, searchParams],
  );

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    router.push("/products");
  };

  const hasFilters = Boolean(search || category || minPrice || maxPrice);

  return (
    <>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-sans mb-1">Explore</p>
          <h1 className="font-serif text-3xl font-semibold text-foreground">All Collections</h1>
        </div>
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4" />
          {showFilters ? "Hide Filters" : "Filters"}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-muted/40 rounded-sm p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
              pushQuery({
                search,
                category,
                minPrice,
                maxPrice,
              });
            }}
            aria-label="Search products"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 font-sans"
            />
          </form>
          <Select
            value={category || "all"}
            onValueChange={(v) => {
              const next = v === "all" ? "" : v;
              setCategory(next);
              pushQuery({
                search,
                category: next,
                minPrice,
                maxPrice,
              });
            }}
          >
            <SelectTrigger className="h-10 font-sans">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Min price"
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() =>
              pushQuery({
                search,
                category,
                minPrice,
                maxPrice,
              })
            }
            className="h-10 font-sans"
          />
          <Input
            placeholder="Max price"
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() =>
              pushQuery({
                search,
                category,
                minPrice,
                maxPrice,
              })
            }
            className="h-10 font-sans"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      )}
    </>
  );
}
