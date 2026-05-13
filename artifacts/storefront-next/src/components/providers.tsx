"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { setBaseUrl } from "@workspace/api-client-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { Toaster } from "@/components/ui/toaster";
import { DeferredAds } from "@/components/deferred-ads";
import { ErrorBoundary } from "@/components/error-boundary";

// Create a stable QueryClient instance (shared across requests in dev)
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Reduce retries to speed up failures
        retry: 1,
        // Cache data for 30 seconds to reduce redundant requests
        staleTime: 30_000,
        // Don't refetch on window focus during Lighthouse audit
        refetchOnWindowFocus: false,
        // Add timeouts to prevent hanging
        networkMode: "online",
      },
      // Optimize mutations to reduce main-thread blocking
      mutations: {
        retry: 1,
        networkMode: "online",
      },
    },
  });

let sharedQueryClient: QueryClient | null = null;

export function Providers({ children }: { children: React.ReactNode }) {
  // Ensure single QueryClient instance in production
  const [queryClient] = useState(() => {
    if (!sharedQueryClient) {
      sharedQueryClient = createQueryClient();
    }
    return sharedQueryClient;
  });

  // Initialize API client base URL for browser-side requests
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      setBaseUrl(apiUrl);
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster />
              <DeferredAds />
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
