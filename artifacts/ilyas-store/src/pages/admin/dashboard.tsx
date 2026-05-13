import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetDashboardStats, useGetRevenueChart, useGetOrdersByStatus, useGetRecentOrders,
  getGetDashboardStatsQueryKey, getGetOrdersByStatusQueryKey,
  getGetRevenueChartQueryKey, getGetRecentOrdersQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { ShoppingCart, Users, Package, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdminRole } from "@/lib/authz";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  shipped: "#8B5CF6",
  delivered: "#10B981",
  cancelled: "#EF4444",
};
const STATUS_BADGE: Record<string, string> = {
  pending: "border-amber-500 text-amber-600",
  confirmed: "border-blue-500 text-blue-600",
  shipped: "border-purple-500 text-purple-600",
  delivered: "border-green-500 text-green-600",
  cancelled: "border-red-400 text-red-500",
};

function StatCard({ label, value, sub, icon: Icon, highlight }: { label: string; value: string | number; sub?: string; icon: React.ElementType; highlight?: boolean }) {
  return (
    <div className={cn("rounded-sm border p-5", highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card")}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-sans">{label}</p>
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <p className="font-serif text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground font-sans mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = !!user && isAdminRole(user.role as string);

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { enabled: isAdmin, queryKey: getGetDashboardStatsQueryKey() },
  });
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueChart(undefined, {
    query: { enabled: isAdmin, queryKey: getGetRevenueChartQueryKey() },
  });
  const { data: byStatus } = useGetOrdersByStatus({
    query: { enabled: isAdmin, queryKey: getGetOrdersByStatusQueryKey() },
  });
  const { data: recentOrders } = useGetRecentOrders(undefined, {
    query: { enabled: isAdmin, queryKey: getGetRecentOrdersQueryKey() },
  });

  if (!authLoading && (!user || !isAdminRole(user.role as string))) {
    navigate("/admin/login");
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-sans mb-1">Overview</p>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-sm" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={`PKR ${Number((stats?.data as any)?.totalRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} highlight />
            <StatCard label="Total Orders" value={(stats?.data as any)?.totalOrders ?? 0} sub={`${(stats?.data as any)?.pendingOrders ?? 0} pending`} icon={ShoppingCart} />
            <StatCard label="Customers" value={(stats?.data as any)?.totalUsers ?? 0} icon={Users} />
            <StatCard label="Products" value={(stats?.data as any)?.totalProducts ?? 0} sub={(stats?.data as any)?.lowStockCount ? `${(stats?.data as any).lowStockCount} low stock` : undefined} icon={Package} />
            <StatCard label="Today's Orders" value={(stats?.data as any)?.todayOrders ?? 0} icon={Clock} />
            <StatCard label="Today's Revenue" value={`PKR ${Number((stats?.data as any)?.todayRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} />
            <StatCard label="Pending Orders" value={(stats?.data as any)?.pendingOrders ?? 0} icon={Clock} />
            <StatCard label="Low Stock" value={(stats?.data as any)?.lowStockCount ?? 0} icon={AlertTriangle} highlight={!!((stats?.data as any)?.lowStockCount && (stats?.data as any).lowStockCount > 0)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-border rounded-sm p-5 bg-card">
            <h3 className="font-sans text-sm font-medium text-foreground mb-5">Revenue (Last 7 Days)</h3>
            {revenueLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={((revenue?.data as any) ?? []) as any[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: "DM Sans" }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fontFamily: "DM Sans" }} width={60} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`PKR ${Number(v).toLocaleString()}`, "Revenue"]} contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="border border-border rounded-sm p-5 bg-card">
            <h3 className="font-sans text-sm font-medium text-foreground mb-5">Orders by Status</h3>
            {!byStatus ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={((byStatus?.data as any[]) ?? []).filter((d: any) => d.count > 0)} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {((byStatus?.data as any[]) ?? []).filter((d: any) => d.count > 0).map((entry: any, index: number) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.status] ?? "#ccc"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
                  <Legend formatter={(v) => <span className="font-sans text-[11px] capitalize">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="border border-border rounded-sm bg-card">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-sans text-sm font-medium text-foreground">Recent Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left px-5 py-3">Order</th>
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {(((recentOrders?.data as any[]) ?? []) as any[]).map((order: any) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 text-muted-foreground">#{order.id}</td>
                    <td className="px-5 py-3 text-foreground">{order.userName ?? "—"}</td>
                    <td className="px-5 py-3 font-medium">PKR {Number(order.totalPrice).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={cn("text-xs capitalize", STATUS_BADGE[order.status] ?? "")}>{order.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {(!recentOrders?.data || ((recentOrders?.data as any[]) ?? []).length === 0) && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
