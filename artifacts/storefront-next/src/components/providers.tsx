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

// Factory — each Providers mount gets its own QueryClient to prevent
// cross-request data leakage during SSR.
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        networkMode: "online",
      },
      mutations: {
        retry: 1,
        networkMode: "online",
      },
    },
  });

export function Providers({ children }: { children: React.ReactNode }) {
  // Each render tree gets its own QueryClient — safe for SSR
  const [queryClient] = useState(() => createQueryClient());

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
