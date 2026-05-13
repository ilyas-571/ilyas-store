import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Loader2, Play, Pause, CircleStop } from "lucide-react";

const token = () => localStorage.getItem("ilyas_token");
const headers = () => ({ "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) });

const STATUS_STYLE: Record<string, string> = {
  draft: "border-gray-400 text-gray-500", active: "border-green-500 text-green-600",
  paused: "border-amber-500 text-amber-600", ended: "border-red-400 text-red-500",
};

type Campaign = { id: number; name: string; platform: string; status: string; budget: number; currency: string; startDate: string | null; endDate: string | null; productIds: number[]; impressions: number; clicks: number; conversions: number; spend: number; revenue: number; };

export default function AdsCampaigns() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", platform: "meta", budget: "", currency: "PKR", startDate: "", endDate: "", productIds: "" });
  const [busy, setBusy] = useState(false);

  const load = () => fetch("/api/ads/campaigns", { headers: headers() }).then(r => r.json()).then(d => { setCampaigns(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: "", platform: "meta", budget: "", currency: "PKR", startDate: "", endDate: "", productIds: "" }); setEditId(null); setDialogOpen(true); };
  const openEdit = (c: Campaign) => {
    setForm({ name: c.name, platform: c.platform, budget: String(c.budget), currency: c.currency, startDate: c.startDate?.slice(0, 10) ?? "", endDate: c.endDate?.slice(0, 10) ?? "", productIds: c.productIds.join(", ") });
    setEditId(c.id); setDialogOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const payload = { ...form, budget: parseFloat(form.budget) || 0, productIds: form.productIds.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)), startDate: form.startDate || null, endDate: form.endDate || null };
    try {
      if (editId) { await fetch(`/api/ads/campaigns/${editId}`, { method: "PUT", headers: headers(), body: JSON.stringify(payload) }); toast({ title: "Campaign updated ✓" }); }
      else { await fetch("/api/ads/campaigns", { method: "POST", headers: headers(), body: JSON.stringify(payload) }); toast({ title: "Campaign created ✓" }); }
      setDialogOpen(false); load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setBusy(false);
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/ads/campaigns/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify({ status }) });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete this campaign?")) return;
    await fetch(`/api/ads/campaigns/${id}`, { method: "DELETE", headers: headers() });
    toast({ title: "Campaign deleted" }); load();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground font-sans text-sm">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm" className="gap-2 font-sans"><Plus className="h-4 w-4" />New Campaign</Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground font-sans text-sm mb-3">No campaigns yet</p>
          <Button onClick={openCreate} variant="outline" size="sm" className="font-sans gap-2"><Plus className="h-4 w-4" />Create your first campaign</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c.id} className="border border-border rounded-lg p-5 bg-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-sans text-sm font-semibold text-foreground">{c.name}</h3>
                    <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_STYLE[c.status] ?? ""}`}>{c.status}</Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">{c.platform}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans">
                    Budget: {c.currency} {c.budget.toLocaleString()}
                    {c.startDate && ` · ${new Date(c.startDate).toLocaleDateString()}`}
                    {c.endDate && ` — ${new Date(c.endDate).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  {c.status === "draft" && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={() => updateStatus(c.id, "active")}><Play className="h-3.5 w-3.5" /></Button>}
                  {c.status === "active" && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-600" onClick={() => updateStatus(c.id, "paused")}><Pause className="h-3.5 w-3.5" /></Button>}
                  {c.status === "paused" && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={() => updateStatus(c.id, "active")}><Play className="h-3.5 w-3.5" /></Button>}
                  {(c.status === "active" || c.status === "paused") && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => updateStatus(c.id, "ended")}><CircleStop className="h-3.5 w-3.5" /></Button>}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => del(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[["Impressions", c.impressions], ["Clicks", c.clicks], ["Conversions", c.conversions], ["Spend", `${c.currency} ${c.spend.toLocaleString()}`]].map(([l, v]) => (
                  <div key={String(l)} className="bg-muted/40 rounded-md p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wide">{String(l)}</p>
                    <p className="font-sans text-sm font-semibold text-foreground">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif">{editId ? "Edit Campaign" : "New Campaign"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Campaign Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="font-sans" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Platform</Label>
                <Select value={form.platform} onValueChange={v => setForm({ ...form, platform: v })}><SelectTrigger className="font-sans"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="meta">Meta (FB/IG)</SelectItem><SelectItem value="google">Google</SelectItem><SelectItem value="tiktok">TikTok</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Budget</Label><Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="0" min="0" className="font-sans" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="font-sans" /></div>
              <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="font-sans" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Product IDs (comma separated)</Label><Input value={form.productIds} onChange={e => setForm({ ...form, productIds: e.target.value })} placeholder="1, 2, 3" className="font-sans" /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 font-sans">Cancel</Button>
              <Button type="submit" className="flex-1 font-sans" disabled={busy}>{busy ? "Saving..." : editId ? "Save" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
