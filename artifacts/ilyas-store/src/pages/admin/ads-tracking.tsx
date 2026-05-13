import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Chrome, Music2, Save, Loader2 } from "lucide-react";

const token = () => localStorage.getItem("ilyas_token");
const headers = () => ({ "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

export default function AdsTracking() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    facebookPixelId: "", googleAdsConversionId: "", tiktokPixelId: "",
    facebookEnabled: false, googleEnabled: false, tiktokEnabled: false,
  });

  useEffect(() => {
    fetch("/api/ads/tracking", { headers: headers() }).then(r => r.json()).then(d => {
      setData({
        facebookPixelId: d.facebookPixelId || "", googleAdsConversionId: d.googleAdsConversionId || "",
        tiktokPixelId: d.tiktokPixelId || "", facebookEnabled: d.facebookEnabled,
        googleEnabled: d.googleEnabled, tiktokEnabled: d.tiktokEnabled,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch("/api/ads/tracking", { method: "PUT", headers: headers(), body: JSON.stringify(data) });
      toast({ title: "Tracking settings saved ✓" });
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground font-sans text-sm">Loading...</div>;

  const pixels = [
    { key: "facebook" as const, label: "Facebook Pixel", icon: Facebook, idKey: "facebookPixelId" as const, enableKey: "facebookEnabled" as const, placeholder: "Enter Facebook Pixel ID", color: "text-blue-600" },
    { key: "google" as const, label: "Google Ads", icon: Chrome, idKey: "googleAdsConversionId" as const, enableKey: "googleEnabled" as const, placeholder: "Enter Google Ads Conversion ID (AW-XXXXXXX)", color: "text-emerald-600" },
    { key: "tiktok" as const, label: "TikTok Pixel", icon: Music2, idKey: "tiktokPixelId" as const, enableKey: "tiktokEnabled" as const, placeholder: "Enter TikTok Pixel ID", color: "text-pink-500" },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm font-sans text-blue-800 dark:text-blue-300">
          <strong>How it works:</strong> Add your tracking pixel IDs below and enable them. The tracking scripts will be automatically injected into your storefront for conversion tracking.
        </p>
      </div>

      {pixels.map(p => (
        <div key={p.key} className="border border-border rounded-lg p-5 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${p.color}`}>
                <p.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-semibold text-foreground">{p.label}</h3>
                <p className="text-[11px] text-muted-foreground font-sans">Track conversions and optimize ad spend</p>
              </div>
            </div>
            <Switch checked={data[p.enableKey]} onCheckedChange={v => setData({ ...data, [p.enableKey]: v })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Pixel / Conversion ID</Label>
            <Input value={data[p.idKey]} onChange={e => setData({ ...data, [p.idKey]: e.target.value })} placeholder={p.placeholder} className="font-sans text-sm" />
          </div>
        </div>
      ))}

      <Button onClick={save} disabled={saving} className="gap-2 font-sans">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Tracking Settings"}
      </Button>
    </div>
  );
}
