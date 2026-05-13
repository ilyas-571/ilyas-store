import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useListBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, getListBannersQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Image, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdminRole } from "@/lib/authz";

type BannerForm = { title: string; subtitle: string; image: string; link: string; isActive: boolean; sortOrder: string };
const emptyForm: BannerForm = { title: "", subtitle: "", image: "", link: "", isActive: true, sortOrder: "0" };

export default function AdminBanners() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const { data: banners, isLoading } = useListBanners();
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const deleteMutation = useDeleteBanner();

  if (!authLoading && (!user || !isAdminRole(user.role as string))) { navigate("/admin/login"); return null; }

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (b: any) => {
    setForm({ title: b.title, subtitle: b.subtitle ?? "", image: b.image, link: b.link ?? "", isActive: b.isActive, sortOrder: String(b.sortOrder) });
    setEditingId(b.id); setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title: form.title, subtitle: form.subtitle || undefined, image: form.image, link: form.link || undefined, isActive: form.isActive, sortOrder: parseInt(form.sortOrder) || 0 };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Banner updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Banner created" });
      }
      queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Banner deleted" });
      queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() });
      setDeleteId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum upload size is 10MB.", variant: "destructive" });
      return;
    }

    setIsUploadingFile(true);
    try {
      const token = localStorage.getItem("ilyas_token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload file.");
      }

      const data = await res.json();
      setForm(prev => ({ ...prev, image: data.url }));
      toast({ title: "File uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingFile(false);
      e.target.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-sans mb-1">Manage</p>
            <h1 className="font-serif text-2xl font-semibold">Banners</h1>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-2 font-sans"><Plus className="h-4 w-4" />Add Banner</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-sm" />)}</div>
        ) : !(banners?.data as any[])?.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-sm">
            <Image className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-sans text-sm">No banners yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {((banners?.data as any[]) ?? []).map((b) => (
              <div key={b.id} className="border border-border rounded-sm bg-card flex overflow-hidden">
                <div className="w-40 h-24 shrink-0 bg-muted overflow-hidden">
                  {b.image && <img src={b.image} alt={b.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-serif text-base font-medium text-foreground">{b.title}</h3>
                      <Badge variant="outline" className={cn("text-xs", b.isActive ? "border-green-500 text-green-600" : "border-muted text-muted-foreground")}>{b.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    {b.subtitle && <p className="text-xs text-muted-foreground font-sans">{b.subtitle}</p>}
                    <p className="text-xs text-muted-foreground font-sans mt-1">Order: {b.sortOrder}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(b)} className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(b.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif">{editingId ? "Edit Banner" : "Add Banner"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Subtitle</Label>
              <Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="font-sans" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Image (URL or Upload)</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    aria-label="Upload banner image or video"
                    title="Upload banner image or video"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={isUploadingFile}
                  />
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 font-sans relative z-[-1]">
                    <Upload className="h-3 w-3" />
                    {isUploadingFile ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </div>
              <Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} required placeholder="https://..." className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Link (optional)</Label>
              <Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="/products" className="font-sans" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} className="font-sans" />
              </div>
              <div className="flex items-end gap-3 pb-0.5">
                <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                <Label className="font-sans text-sm">Active</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 font-sans">Cancel</Button>
              <Button type="submit" className="flex-1 font-sans" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save changes" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-serif">Delete Banner?</DialogTitle></DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 font-sans">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 font-sans" disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
