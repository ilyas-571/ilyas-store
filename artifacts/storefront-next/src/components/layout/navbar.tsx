"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Menu, X, User, LogOut, ChevronDown, Heart, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { isAdminRole } from "@/lib/authz";
import { useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalItems, subtotal } = useCart();
  const { data: categoriesResponse } = useListCategories();
  let categoriesData = categoriesResponse?.data;
  if (typeof categoriesData === "string")
    try {
      categoriesData = JSON.parse(categoriesData);
    } catch {
      /* ignore */
    }
  const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 flex flex-col w-full">
      <div className="bg-[#1a1a1a] text-white text-[11px] py-2.5 text-center uppercase tracking-widest font-medium w-full">
        <Link href="/products" className="hover:text-[#b8860b] transition-colors">
          Find Your Perfect Perfume - Shop The New Collection
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 w-full">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-serif text-3xl font-bold tracking-widest text-[#1a1a1a] group-hover:text-[#b8860b] transition-colors">
                ILYAS
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex flex-1 justify-center max-w-2xl px-12">
            <form
              onSubmit={handleSearch}
              role="search"
              aria-label="Search products"
              className="flex items-center w-full border border-gray-300 rounded-full overflow-hidden bg-white focus-within:border-gray-400 transition-colors"
            >
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                className="flex-grow border-0 focus-visible:ring-0 h-11 px-6 rounded-none text-sm font-sans"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="bg-[#1a1a1a] text-white h-11 px-8 uppercase text-[11px] font-bold tracking-widest hover:bg-black transition-colors shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden md:flex items-center gap-2 outline-none group cursor-pointer">
                  <User className="h-5 w-5 text-gray-700 group-hover:text-black transition-colors" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">
                      My Account
                    </span>
                    <span className="text-xs font-bold text-gray-800 leading-none">
                      {(user.name || "User").split(" ")[0]}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-sans">
                  <DropdownMenuItem asChild>
                    <Link href="/orders">My Orders</Link>
                  </DropdownMenuItem>
                  {isAdminRole(user.role as string) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">Admin Panel</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="hidden md:flex items-center gap-2 group">
                <User className="h-5 w-5 text-gray-700 group-hover:text-black transition-colors" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">
                    Log In
                  </span>
                  <span className="text-xs font-bold text-gray-800 leading-none">My Account</span>
                </div>
              </Link>
            )}

            <Link href="/products" aria-label="Wishlist" className="relative group hidden sm:block cursor-pointer">
              <Heart className="h-5 w-5 text-gray-700 group-hover:text-black transition-colors" />
              <span className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full bg-[#b8860b] text-white text-[10px] font-bold flex items-center justify-center">
                0
              </span>
            </Link>

            <Link
              href="/cart"
              aria-label={`Shopping cart with ${totalItems} items`}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="h-5 w-5 text-gray-700 group-hover:text-black transition-colors" />
                <span className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full bg-[#1a1a1a] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              </div>
              <div className="hidden md:flex flex-col items-start text-left ml-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">Cart</span>
                <span className="text-xs font-bold text-gray-800 leading-none">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="md:hidden ml-2 h-12 w-12"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </Button>
          </div>
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className="hidden lg:flex justify-center items-center space-x-10 py-3.5 bg-white border-t border-gray-100"
      >
        <Link
          href="/"
          className="text-xs font-bold tracking-widest uppercase text-gray-800 hover:text-[#b8860b] transition-colors relative"
        >
          Home
        </Link>
        <Link
          href="/products"
          className="text-xs font-bold tracking-widest uppercase text-gray-800 hover:text-[#b8860b] transition-colors relative flex items-center gap-1 group"
        >
          All Products <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-[#b8860b]" />
        </Link>
        {categoriesList.slice(0, 4).map((cat: { id: number; name: string }) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.id}`}
            className="text-xs font-bold tracking-widest uppercase text-gray-800 hover:text-[#b8860b] transition-colors relative"
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl max-h-[calc(100vh-100px)] overflow-y-auto z-50">
          <div className="p-4 border-b border-gray-100">
            <form
              onSubmit={handleSearch}
              className="flex items-center w-full border border-gray-300 rounded-full overflow-hidden bg-white"
            >
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-grow border-0 h-10 px-4 rounded-none text-sm font-sans"
              />
              <button
                type="submit"
                aria-label="Search products"
                className="bg-[#1a1a1a] text-white h-10 px-4 uppercase text-[10px] font-bold tracking-widest shrink-0"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
          <div className="flex flex-col py-2">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase text-gray-800 border-b border-gray-50"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase text-gray-800 border-b border-gray-50"
            >
              All Products
            </Link>
            {categoriesList.map((cat: { id: number; name: string }) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                onClick={() => setMobileOpen(false)}
                className="px-6 py-3 text-sm font-bold tracking-widest uppercase text-gray-800 border-b border-gray-50"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/products?sort=popular"
              onClick={() => setMobileOpen(false)}
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase text-[#b8860b] border-b border-gray-50"
            >
              Customer Favorites
            </Link>

            {user ? (
              <div className="px-6 py-4 bg-gray-50 mt-2">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">My Account ({user.name})</p>
                <div className="flex flex-col gap-2">
                  <Link href="/orders" onClick={() => setMobileOpen(false)} className="text-sm font-bold">
                    My Orders
                  </Link>
                  {isAdminRole(user.role as string) && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-bold text-[#b8860b]"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="text-sm font-bold text-red-500 text-left mt-2"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 bg-gray-50 mt-2 flex gap-3">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="bg-[#1a1a1a] uppercase tracking-widest text-xs font-bold rounded-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="uppercase tracking-widest text-xs font-bold rounded-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
