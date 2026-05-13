import { useState, useEffect } from "react";
import { TrendingUp, MousePointerClick, Target, DollarSign, BarChart3, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const token = () => localStorage.getItem("ilyas_token");
const headers = () => ({ "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-sans">{label}</p>
        <div className={`h-7 w-7 rounded-md flex items-center justify-center ${color}`}><Icon className="h-3.5 w-3.5 text-white" /></div>
      </div>
      <p className="font-serif text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function AdsAnalytics() {
  const [data, setData] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/ads/analytics", { headers: headers() }).then(r => r.json()).then(setData);
    fetch("/api/ads/campaigns", { headers: headers() }).then(r => r.json()).then(setCampaigns);
  }, []);

  if (!data) return <div className="p-8 text-center text-muted-foreground font-sans text-sm">Loading analytics...</div>;

  const chartData = campaigns.slice(0, 8).map(c => ({ name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name, clicks: c.clicks, conversions: c.conversions }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard label="Total Impressions" value={data.totalImpressions.toLocaleString()} icon={BarChart3} color="bg-blue-500" />
        <MetricCard label="Total Clicks" value={data.totalClicks.toLocaleString()} icon={MousePointerClick} color="bg-indigo-500" />
        <MetricCard label="Conversions" value={data.totalConversions.toLocaleString()} icon={Target} color="bg-green-500" />
        <MetricCard label="Ad Spend" value={`PKR ${data.totalSpend.toLocaleString()}`} icon={DollarSign} color="bg-amber-500" />
        <MetricCard label="Revenue from Ads" value={`PKR ${data.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-emerald-500" />
        <MetricCard label="ROAS" value={`${data.roas}x`} icon={TrendingUp} color="bg-purple-500" />
      </div>

      {chartData.length > 0 && (
        <div className="border border-border rounded-lg p-5 bg-card">
          <h3 className="font-sans text-sm font-medium text-foreground mb-4">Campaign Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "DM Sans" }} />
              <YAxis tick={{ fontSize: 10, fontFamily: "DM Sans" }} width={40} />
              <Tooltip contentStyle={{ fontFamily: "DM Sans", fontSize: 12 }} />
              <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Clicks" />
              <Bar dataKey="conversions" fill="#10B981" radius={[4, 4, 0, 0]} name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.topProducts?.length > 0 && (
        <div className="border border-border rounded-lg bg-card">
          <div className="px-5 py-4 border-b border-border"><h3 className="font-sans text-sm font-medium text-foreground">Top Promoted Products</h3></div>
          <div className="divide-y divide-border">
            {data.topProducts.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-9 w-9 bg-muted rounded-md shrink-0 overflow-hidden">
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="h-4 w-4 m-auto mt-2.5 text-muted-foreground/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground font-sans">In {p.campaigns} campaign{p.campaigns !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {campaigns.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-10 text-center">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground font-sans">Create campaigns to start tracking analytics</p>
        </div>
      )}
    </div>
  );
}
