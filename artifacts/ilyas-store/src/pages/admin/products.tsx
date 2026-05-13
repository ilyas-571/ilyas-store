import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useListCategories, getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Search, AlertTriangle, Link as LinkIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdminRole } from "@/lib/authz";

type ProductForm = { name: string; sku: string; brand: string; tags: string; basePrice: string; compareAtPrice: string; costPrice: string; description: string; stock: string; categoryId: string; isFeatured: boolean; images: string; variants: string; };

const emptyForm: ProductForm = { name: "", sku: "", brand: "", tags: "", basePrice: "", compareAtPrice: "", costPrice: "", description: "", stock: "0", categoryId: "", isFeatured: false, images: "", variants: "[]" };

const VARIANT_TYPES = ["size", "volume", "color", "custom"] as const;

export default function AdminProducts() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadingVariationIndex, setUploadingVariationIndex] = useState<number | null>(null);

  const { data, isLoading } = useListProducts({ ...(search ? { search } : {}), page, limit: 15 });
  const { data: categories } = useListCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  if (!authLoading && (!user || !isAdminRole(user.role as string))) { navigate("/admin/login"); return null; }

  const products = (data?.data as any)?.products ?? [];

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setForm({ 
      name: p.name, 
      sku: p.sku ?? "",
      brand: p.brand ?? "",
      tags: (p.tags ?? []).join(", "),
      basePrice: p.basePrice ? String(p.basePrice) : "", 
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
      costPrice: p.costPrice ? String(p.costPrice) : "",
      description: p.description ?? "", 
      stock: String(p.stock), 
      categoryId: String(p.categoryId), 
      isFeatured: p.isFeatured, 
      images: (p.images ?? []).join("\n"),
      variants: JSON.stringify(p.variants ?? [], null, 2),
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const variants = (() => { try { return JSON.parse(form.variants || "[]"); } catch { return []; } })();
    const payload = {
      name: form.name,
      sku: form.sku,
      brand: form.brand,
      basePrice: form.basePrice ? parseFloat(form.basePrice) : null,
      compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
      costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
      description: form.description || undefined,
      stock: parseInt(form.stock) || 0,
      categoryId: parseInt(form.categoryId) || 0,
      isFeatured: form.isFeatured,
      images: form.images.split("\n").map(s => s.trim()).filter(Boolean),
      variants,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Product updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Product created" });
      }
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Product deleted" });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      setDeleteId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    setIsImporting(true);
    try {
      const token = localStorage.getItem("ilyas_token");
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: importUrl })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to import product from URL.");
      }
      const data = await res.json();
      
      setForm({
        ...emptyForm,
        name: data.name || "",
        sku: data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "",
        basePrice: data.price ? String(data.price) : "",
        description: data.description || "",
        images: data.image ? data.image : ""
      });
      setImportDialogOpen(false);
      setImportUrl("");
      setEditingId(null);
      setDialogOpen(true);
      toast({ title: "Product imported", description: "Review details and select a category before saving." });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
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
      
      // Append the new URL to the text area
      setForm(prev => {
        const currentUrls = prev.images.split("\n").map(s => s.trim()).filter(Boolean);
        currentUrls.push(data.url);
        return { ...prev, images: currentUrls.join("\n") };
      });
      
      toast({ title: "File uploaded successfully" });
      
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingFile(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleVariationImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum upload size is 10MB.", variant: "destructive" });
      return;
    }

    setUploadingVariationIndex(index);
    try {
      const token = localStorage.getItem("ilyas_token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload file.");
      }

      const data = await res.json();
      
      setForm(prev => {
        const vars = (() => { try { return JSON.parse(prev.variants || "[]"); } catch { return []; } })();
        if (vars[index]) {
          vars[index].imageUrl = data.url;
          // Also append to main images array if not there
          const currentUrls = prev.images.split("\n").map(s => s.trim()).filter(Boolean);
          if (!currentUrls.includes(data.url)) {
            currentUrls.push(data.url);
          }
          return { ...prev, images: currentUrls.join("\n"), variants: JSON.stringify(vars) };
        }
        return prev;
      });
      
      toast({ title: "Variation image uploaded successfully" });
      
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingVariationIndex(null);
      e.target.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-sans mb-1">Manage</p>
            <h1 className="font-serif text-2xl font-semibold">Products</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setImportDialogOpen(true)} size="sm" variant="outline" className="gap-2 font-sans text-muted-foreground">
              <LinkIcon className="h-3.5 w-3.5" />Import via URL
            </Button>
            <Button onClick={openCreate} size="sm" className="gap-2 font-sans"><Plus className="h-4 w-4" />Add Product</Button>
          </div>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 font-sans text-sm" />
        </div>

        <div className="border border-border rounded-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Price</th>
                  <th className="text-left px-5 py-3">Stock</th>
                  <th className="text-left px-5 py-3">Featured</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-5 py-3"><Skeleton className="h-8" /></td></tr>
                  ))
                ) : products.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No products found</td></tr>
                ) : products.map((p: any) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-muted rounded-sm shrink-0 overflow-hidden">
                          {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{p.categoryName}</td>
                    <td className="px-5 py-3 font-medium">PKR {Number(p.basePrice || 0).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={cn("flex items-center gap-1.5", p.stock <= 5 ? "text-amber-600" : "text-foreground")}>
                        {p.stock <= 5 && <AlertTriangle className="h-3.5 w-3.5" />}
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {p.isFeatured ? <Badge variant="outline" className="text-xs border-primary text-primary">Featured</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.data && (data.data as any).totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground font-sans">Page {page} of {(data.data as any).totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="font-sans text-xs">Prev</Button>
                <Button variant="outline" size="sm" disabled={page === (data.data as any).totalPages} onClick={() => setPage(p => p + 1)} className="font-sans text-xs">Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="font-sans" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">SKU <span className="normal-case text-[10px]">(auto if empty)</span></Label>
                <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generated" className="font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Brand</Label>
                <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Nike" className="font-sans" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Base Price (PKR) *</Label>
                <Input type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} required min="0" step="0.01" className="font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Compare At Price</Label>
                <Input type="number" value={form.compareAtPrice} onChange={e => setForm({ ...form, compareAtPrice: e.target.value })} min="0" step="0.01" placeholder="Original price" className="font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Cost Price</Label>
                <Input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} min="0" step="0.01" placeholder="Cost price" className="font-sans" />
              </div>
            </div>
            {/* Stock - hidden if variants exist */}
            {(() => {
              const vars = (() => { try { return JSON.parse(form.variants || "[]"); } catch { return []; } })();
              const totalVarStock = vars.reduce((s: number, v: any) => s + (Number(v.stock) || 0), 0);
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">
                      {vars.length > 0 ? "Total Stock (auto)" : "Stock *"}
                    </Label>
                    <Input type="number" value={vars.length > 0 ? String(totalVarStock) : form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required min="0" className="font-sans" disabled={vars.length > 0} />
                    {vars.length > 0 && <p className="text-[10px] text-muted-foreground">Auto-calculated from variants</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Category *</Label>
                    <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger className="font-sans"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {((categories?.data ?? []) as any[]).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })()}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="font-sans resize-none" />
            </div>

            {/* === DYNAMIC VARIANT GENERATOR === */}
            <div className="space-y-1.5 border p-3 rounded-md bg-muted/20">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Product Variants</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const vars = (() => { try { return JSON.parse(form.variants || "[]"); } catch { return []; } })();
                  vars.push({ value: "", type: "size", price: 0, stock: 0, sku: "", imageUrl: "" });
                  setForm({ ...form, variants: JSON.stringify(vars) });
                }} className="h-6 text-[10px] px-2"><Plus className="h-3 w-3 mr-1"/>Add Variant</Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {(() => {
                  const vars = (() => { try { return JSON.parse(form.variants || "[]"); } catch { return []; } })();
                  if (vars.length === 0) return <p className="text-xs text-muted-foreground italic">No variants. This is a simple product with base price & stock.</p>;
                  return vars.map((v: any, i: number) => (
                    <div key={i} className="flex flex-col gap-2 border bg-card p-2.5 rounded relative shadow-sm">
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 absolute top-1 right-1 text-destructive hover:bg-destructive/10" onClick={() => {
                        const newVars = vars.filter((_: any, idx: number) => idx !== i);
                        setForm({ ...form, variants: JSON.stringify(newVars) });
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pr-8">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Type</Label>
                          <Select value={v.type || "size"} onValueChange={val => { vars[i].type = val; setForm({ ...form, variants: JSON.stringify(vars) }); }}>
                            <SelectTrigger className="h-7 text-xs font-sans"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {VARIANT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Value</Label>
                          <Input value={v.value || ""} onChange={e => { vars[i].value = e.target.value; setForm({ ...form, variants: JSON.stringify(vars) }); }} placeholder={v.type === "volume" ? "e.g. 100ml" : v.type === "color" ? "e.g. Black" : "e.g. Large"} className="h-7 text-xs font-sans" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Price</Label>
                          <Input type="number" value={v.price || ""} onChange={e => { vars[i].price = Number(e.target.value); setForm({ ...form, variants: JSON.stringify(vars) }); }} placeholder="Override" className="h-7 text-xs font-sans" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Stock *</Label>
                          <Input type="number" value={v.stock ?? ""} onChange={e => { vars[i].stock = Number(e.target.value); setForm({ ...form, variants: JSON.stringify(vars) }); }} className="h-7 text-xs font-sans" />
                        </div>
                        <div className="col-span-2 sm:col-span-4 flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground">Variant SKU</Label>
                            <Input value={v.sku || ""} onChange={e => { vars[i].sku = e.target.value; setForm({ ...form, variants: JSON.stringify(vars) }); }} placeholder="Auto if empty" className="h-7 text-xs font-sans" />
                          </div>
                          <div className="relative pt-[18px]">
                            <input type="file" accept="image/*" onChange={(e) => handleVariationImageUpload(i, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" disabled={uploadingVariationIndex === i} />
                            <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 font-sans pointer-events-none" disabled={uploadingVariationIndex === i}>
                              <Upload className="h-3 w-3" />
                              {uploadingVariationIndex === i ? "..." : "Image"}
                            </Button>
                          </div>
                        </div>
                        {v.imageUrl && (
                          <div className="col-span-2 sm:col-span-4">
                            <img src={v.imageUrl} alt={`Variant ${v.value}`} className="h-10 w-10 rounded object-cover border" />
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Product Media (Images / Video URLs)</Label>
                
                {/* Upload button wrapper */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    aria-label="Upload product media"
                    title="Upload product media"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={isUploadingFile}
                  />
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 font-sans pointer-events-none">
                    <Upload className="h-3 w-3" />
                    {isUploadingFile ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </div>
              <Textarea value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} rows={3} placeholder="https://..." className="font-sans resize-none text-xs" />
              <p className="text-[10px] text-muted-foreground font-sans">Upload a file or paste external URLs (one per line). Supported: Images & Videos.</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isFeatured} onCheckedChange={v => setForm({ ...form, isFeatured: v })} />
              <Label className="font-sans text-sm text-foreground">Featured product</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 font-sans">Cancel</Button>
              <Button type="submit" className="flex-1 font-sans" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save changes" : "Create product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-serif">Delete Product?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-sans">This action cannot be undone.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 font-sans">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 font-sans" disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import URL dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif">Import Product</DialogTitle></DialogHeader>
          <form onSubmit={handleImport} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Product URL</Label>
              <Input 
                value={importUrl} 
                onChange={e => setImportUrl(e.target.value)} 
                placeholder="https://example.com/products/item" 
                required 
                className="font-sans" 
              />
              <p className="text-[10px] text-muted-foreground font-sans mt-1">
                Enter the URL of a Shopify or standard eCommerce product page to auto-extract the name, description, price, and image.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)} className="flex-1 font-sans">Cancel</Button>
              <Button type="submit" className="flex-1 font-sans" disabled={isImporting}>
                {isImporting ? "Importing..." : "Import Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
