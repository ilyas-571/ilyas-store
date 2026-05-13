import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Tags, Upload } from "lucide-react";
import { isAdminRole } from "@/lib/authz";

type CatForm = { name: string; image: string };

export default function AdminCategories() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CatForm>({ name: "", image: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const { data: categories, isLoading } = useListCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  if (!authLoading && (!user || !isAdminRole(user.role as string))) { navigate("/admin/login"); return null; }

  const openCreate = () => { setForm({ name: "", image: "" }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (c: any) => { setForm({ name: c.name, image: c.image ?? "" }); setEditingId(c.id); setDialogOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, image: form.image || undefined };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Category updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Category created" });
      }
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Category deleted" });
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
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
            <h1 className="font-serif text-2xl font-semibold">Categories</h1>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-2 font-sans"><Plus className="h-4 w-4" />Add Category</Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-sm" />)}
          </div>
        ) : !(categories?.data as any[])?.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-sm">
            <Tags className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-sans text-sm">No categories yet. Add your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {((categories?.data as any[]) ?? []).map((cat) => (
              <div key={cat.id} className="border border-border rounded-sm bg-card overflow-hidden group">
                {cat.image && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base font-medium text-foreground">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground font-sans mt-0.5">{cat.productCount} products</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(cat)} className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(cat.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif">{editingId ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="font-sans" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Image (URL or Upload)</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    aria-label="Upload category image or video"
                    title="Upload category image or video"
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
              <Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." className="font-sans" />
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
          <DialogHeader><DialogTitle className="font-serif">Delete Category?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">Products in this category will not be deleted but will lose their category assignment.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 font-sans">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 font-sans" disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
