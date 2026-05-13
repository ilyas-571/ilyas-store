import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdminRole } from "@/lib/authz";

const STATUS_COLORS: Record<string, string> = {
  pending: "border-amber-500 text-amber-600",
  confirmed: "border-blue-500 text-blue-600",
  shipped: "border-purple-500 text-purple-600",
  delivered: "border-green-500 text-green-600",
  cancelled: "border-red-400 text-red-500",
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data, isLoading } = useListOrders({ ...(statusFilter ? { status: statusFilter } : {}), page, limit: 20 });
  const updateStatusMutation = useUpdateOrderStatus();

  if (!authLoading && (!user || !isAdminRole(user.role as string))) { navigate("/admin/login"); return null; }

  const orders = (data as any)?.orders ?? [];

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: orderId, data: { status: status as any } });
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-sans mb-1">Manage</p>
            <h1 className="font-serif text-2xl font-semibold">Orders</h1>
          </div>
          <Select value={statusFilter || "all"} onValueChange={v => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40 h-9 font-sans text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-sm" />)
          ) : orders.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-sm">
              <p className="text-muted-foreground font-sans text-sm">No orders found</p>
            </div>
          ) : orders.map((order: any) => (
            <div key={order.id} className="border border-border rounded-sm bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => toggle(order.id)}>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-xs text-muted-foreground font-sans">#{order.id}</span>
                  <span className="text-sm font-medium font-sans text-foreground">{order.userName ?? "Customer"}</span>
                  <span className="text-xs text-muted-foreground font-sans">{order.userEmail}</span>
                  <Badge variant="outline" className={cn("text-xs capitalize", STATUS_COLORS[order.status] ?? "")}>{order.status}</Badge>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-sans text-sm font-medium">PKR {Number(order.totalPrice).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground font-sans hidden sm:block">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <Link href={`/orders/${order.id}/print`} onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:flex">
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {expanded.has(order.id) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {expanded.has(order.id) && (
                <div className="border-t border-border px-5 py-5 bg-muted/10 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <p className="text-xs tracking-wide uppercase text-muted-foreground font-sans mb-2">Customer</p>
                      <p className="text-sm font-sans text-foreground">{order.userName}</p>
                      <p className="text-xs font-sans text-muted-foreground">{order.userEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs tracking-wide uppercase text-muted-foreground font-sans mb-2">Delivery</p>
                      <p className="text-sm font-sans text-foreground">{order.address?.name}</p>
                      <p className="text-xs font-sans text-muted-foreground">{order.address?.phone}</p>
                      <p className="text-xs font-sans text-muted-foreground">{order.address?.street}, {order.address?.city}</p>
                    </div>
                    <div>
                      <p className="text-xs tracking-wide uppercase text-muted-foreground font-sans mb-2">Update Status</p>
                      <Select value={order.status} onValueChange={v => handleStatusChange(order.id, v)}>
                        <SelectTrigger className="h-9 font-sans text-sm w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs tracking-wide uppercase text-muted-foreground font-sans mb-3">Items</p>
                    <div className="space-y-2">
                      {(order.items ?? []).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-muted rounded-sm overflow-hidden shrink-0">
                            {item.productImage && <img src={item.productImage} alt={item.productName || "Order item"} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-sans text-foreground">{item.productName}</p>
                            <p className="text-xs text-muted-foreground font-sans">x{item.quantity} · PKR {Number(item.price).toLocaleString()}</p>
                          </div>
                          <span className="text-sm font-sans font-medium">PKR {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {(data as any)?.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-sans">Page {page} of {(data as any).totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="font-sans text-xs">Prev</Button>
              <Button variant="outline" size="sm" disabled={page === (data as any).totalPages} onClick={() => setPage(p => p + 1)} className="font-sans text-xs">Next</Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
