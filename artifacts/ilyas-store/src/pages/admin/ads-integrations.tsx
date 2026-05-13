import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Chrome, Music2, Link2, Unlink, Loader2, CheckCircle2, XCircle } from "lucide-react";

const token = () => localStorage.getItem("ilyas_token");
const headers = () => ({ "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

const platforms = [
  { key: "meta", label: "Meta Ads", desc: "Facebook & Instagram advertising", icon: Facebook, color: "bg-blue-500", connKey: "metaConnected" as const },
  { key: "google", label: "Google Ads", desc: "Search, Display & Shopping ads", icon: Chrome, color: "bg-emerald-500", connKey: "googleConnected" as const },
  { key: "tiktok", label: "TikTok Ads", desc: "Short-form video advertising", icon: Music2, color: "bg-pink-500", connKey: "tiktokConnected" as const },
];

export default function AdsIntegrations() {
  const { toast } = useToast();
  const [tracking, setTracking] = useState<any>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/ads/tracking", { headers: headers() }).then(r => r.json()).then(setTracking);
  }, []);

  const connect = async (platform: string) => {
    if (!tokenInput.trim()) { toast({ title: "Enter an access token", variant: "destructive" }); return; }
    setBusy(platform);
    try {
      await fetch(`/api/ads/connect/${platform}`, { method: "POST", headers: headers(), body: JSON.stringify({ accessToken: tokenInput }) });
      setTracking({ ...tracking, [`${platform === "meta" ? "meta" : platform}Connected`]: true });
      setConnectingPlatform(null); setTokenInput("");
      toast({ title: `${platform} connected ✓` });
    } catch { toast({ title: "Connection failed", variant: "destructive" }); }
    setBusy("");
  };

  const disconnect = async (platform: string) => {
    setBusy(platform);
    try {
      await fetch(`/api/ads/disconnect/${platform}`, { method: "POST", headers: headers() });
      setTracking({ ...tracking, [`${platform === "meta" ? "meta" : platform}Connected`]: false });
      toast({ title: `${platform} disconnected` });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    setBusy("");
  };

  if (!tracking) return <div className="p-8 text-center text-muted-foreground font-sans text-sm">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm font-sans text-amber-800 dark:text-amber-300">
          <strong>Setup:</strong> Connect your ad accounts by providing your API access tokens. Tokens are stored securely on your server.
        </p>
      </div>

      {platforms.map(p => {
        const connected = tracking[p.connKey];
        return (
          <div key={p.key} className="border border-border rounded-lg p-5 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${p.color} flex items-center justify-center text-white`}>
                  <p.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-semibold text-foreground">{p.label}</h3>
                  <p className="text-[11px] text-muted-foreground font-sans">{p.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {connected ? (
                  <>
                    <span className="flex items-center gap-1.5 text-xs font-sans text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Connected</span>
                    <Button variant="outline" size="sm" onClick={() => disconnect(p.key)} disabled={busy === p.key} className="gap-1.5 font-sans text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                      {busy === p.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />} Disconnect
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => { setConnectingPlatform(p.key); setTokenInput(""); }} className="gap-1.5 font-sans text-xs">
                    <Link2 className="h-3 w-3" /> Connect
                  </Button>
                )}
              </div>
            </div>

            {connectingPlatform === p.key && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">API Access Token</Label>
                  <Input value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder={`Paste your ${p.label} access token`} className="font-sans text-sm" type="password" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => connect(p.key)} disabled={busy === p.key} className="font-sans text-xs gap-1.5">
                    {busy === p.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Save & Connect
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConnectingPlatform(null)} className="font-sans text-xs">Cancel</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
