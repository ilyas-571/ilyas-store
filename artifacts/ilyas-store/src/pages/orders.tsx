import { Link, useLocation } from "wouter";
import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import StoreLayout from "@/components/layout/store-layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetMyOrders, getGetMyOrdersQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "border-amber-500 text-amber-600",
  confirmed: "border-blue-500 text-blue-600",
  shipped: "border-purple-500 text-purple-600",
  delivered: "border-green-500 text-green-600",
  cancelled: "border-red-400 text-red-500",
};

export default function OrdersPage() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { data: orders, isLoading } = useGetMyOrders({ query: { enabled: !!user, queryKey: getGetMyOrdersQueryKey() } });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (!authLoading && !user) {
    navigate("/login");
    return null;
  }

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-sans mb-1">Account</p>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Order History</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : !(orders?.data as any[])?.length ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
            <h2 className="font-serif text-2xl text-muted-foreground mb-3">No orders yet</h2>
            <p className="text-sm text-muted-foreground font-sans mb-8">Your order history will appear here.</p>
            <Link href="/products"><Button className="font-sans">Start Shopping</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {((orders?.data as any[]) ?? []).map((order: any) => (
              <div key={order.id} className="border border-border rounded-sm overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-5">
                    <div>
                      <p className="font-sans text-xs text-muted-foreground">Order #{order.id}</p>
                      <p className="font-sans text-sm font-medium mt-0.5 text-foreground">
                        PKR {Number(order.totalPrice).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("text-xs font-sans capitalize", statusColors[order.status] ?? "")}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-sans hidden sm:block">
                      {new Date(order.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                    {expanded.has(order.id) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {expanded.has(order.id) && (
                  <div className="border-t border-border px-5 py-5 bg-muted/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
                      <div>
                        <p className="text-xs tracking-wide uppercase text-muted-foreground font-sans mb-2">Delivery Address</p>
                        <p className="text-sm font-sans text-foreground">{order.address?.name}</p>
                        <p className="text-sm font-sans text-muted-foreground">{order.address?.phone}</p>
                        <p className="text-sm font-sans text-muted-foreground">{order.address?.street}, {order.address?.city}, {order.address?.country}</p>
                      </div>
                      <div>
                        <p className="text-xs tracking-wide uppercase text-muted-foreground font-sans mb-2">Payment</p>
                        <p className="text-sm font-sans text-foreground">Cash on Delivery</p>
                        {order.couponCode && <p className="text-sm font-sans text-green-600">Coupon: {order.couponCode} (-PKR {Number(order.discount).toLocaleString()})</p>}
                      </div>
                    </div>
                    <p className="text-xs tracking-wide uppercase text-muted-foreground font-sans mb-3">Items</p>
                    <div className="space-y-3">
                      {(order.items ?? []).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-muted rounded-sm shrink-0 overflow-hidden">
                            {item.productImage && <img src={item.productImage} alt={item.productName || "Order item"} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-sans text-sm text-foreground">{item.productName}</p>
                            <p className="font-sans text-xs text-muted-foreground">x{item.quantity} · PKR {Number(item.price).toLocaleString()}</p>
                          </div>
                          <span className="font-sans text-sm font-medium shrink-0">PKR {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
