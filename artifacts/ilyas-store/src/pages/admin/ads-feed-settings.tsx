import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Rss, RefreshCw, Copy, Save, Loader2, Globe, MapPin } from "lucide-react";

const token = () => localStorage.getItem("ilyas_token");
const headers = () => ({ "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

export default function AdsFeedSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState({ productFeedEnabled: false, productFeedLastSync: null as string | null, adsCurrency: "PKR", targetRegions: ["PK"] as string[] });
  const [regionInput, setRegionInput] = useState("");

  useEffect(() => {
    fetch("/api/ads/tracking", { headers: headers() }).then(r => r.json()).then(d => {
      setData({ productFeedEnabled: d.productFeedEnabled, productFeedLastSync: d.productFeedLastSync, adsCurrency: d.adsCurrency || "PKR", targetRegions: d.targetRegions || ["PK"] });
      setRegionInput((d.targetRegions || ["PK"]).join(", "));
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const regions = regionInput.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    try {
      const res = await fetch("/api/ads/tracking", { method: "PUT", headers: headers(), body: JSON.stringify({ productFeedEnabled: data.productFeedEnabled, adsCurrency: data.adsCurrency, targetRegions: regions }) });
      const updated = await res.json();
      setData({ ...data, targetRegions: regions, productFeedLastSync: updated.productFeedLastSync });
      toast({ title: "Settings saved ✓" });
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
    setSaving(false);
  };

  const syncFeed = async () => {
    setSyncing(true);
    try {
      await fetch("/api/ads/product-feed", { headers: headers() });
      const t = await fetch("/api/ads/tracking", { headers: headers() }).then(r => r.json());
      setData({ ...data, productFeedLastSync: t.productFeedLastSync });
      toast({ title: "Product feed synced ✓" });
    } catch { toast({ title: "Sync failed", variant: "destructive" }); }
    setSyncing(false);
  };

  const copyFeedUrl = () => { navigator.clipboard.writeText(`${window.location.origin}/api/ads/product-feed`); toast({ title: "Feed URL copied!" }); };

  if (loading) return <div className="p-8 text-center text-muted-foreground font-sans text-sm">Loading...</div>;

  return (
    <div className="space-y-5">
      {/* Product Feed */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center text-white"><Rss className="h-4 w-4" /></div>
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground">Product Feed</h3>
            <p className="text-[11px] text-muted-foreground font-sans">Auto-generated XML feed for Google Merchant Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Switch checked={data.productFeedEnabled} onCheckedChange={v => setData({ ...data, productFeedEnabled: v })} />
          <Label className="font-sans text-sm">Enable product feed</Label>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Input value={`${window.location.origin}/api/ads/product-feed`} readOnly className="font-mono text-xs bg-muted/50" />
          <Button variant="outline" size="sm" onClick={copyFeedUrl} className="shrink-0 gap-1.5 font-sans text-xs"><Copy className="h-3 w-3" />Copy</Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={syncFeed} disabled={syncing} className="gap-1.5 font-sans text-xs">
            {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Sync Now
          </Button>
          {data.productFeedLastSync && <span className="text-[11px] text-muted-foreground font-sans">Last sync: {new Date(data.productFeedLastSync).toLocaleString()}</span>}
        </div>
      </div>

      {/* Currency & Regions */}
      <div className="border border-border rounded-lg p-5 bg-card space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-lg bg-violet-500 flex items-center justify-center text-white"><Globe className="h-4 w-4" /></div>
          <h3 className="font-sans text-sm font-semibold text-foreground">Ads Settings</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans flex items-center gap-1"><Globe className="h-3 w-3" />Ads Currency</Label>
            <Input value={data.adsCurrency} onChange={e => setData({ ...data, adsCurrency: e.target.value.toUpperCase() })} placeholder="PKR" className="font-sans" maxLength={3} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans flex items-center gap-1"><MapPin className="h-3 w-3" />Target Regions</Label>
            <Input value={regionInput} onChange={e => setRegionInput(e.target.value)} placeholder="PK, AE, SA" className="font-sans" />
            <p className="text-[10px] text-muted-foreground font-sans">ISO country codes, comma separated</p>
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="gap-2 font-sans">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
