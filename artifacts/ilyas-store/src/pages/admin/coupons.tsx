import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useListCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, getListCouponsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdminRole } from "@/lib/authz";

type CouponForm = { code: string; discountType: string; discountValue: string; minOrderAmount: string; maxUses: string; isActive: boolean; expiresAt: string };
const emptyForm: CouponForm = { code: "", discountType: "percentage", discountValue: "", minOrderAmount: "", maxUses: "", isActive: true, expiresAt: "" };

export default function AdminCoupons() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: coupons, isLoading } = useListCoupons();
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  if (!authLoading && (!user || !isAdminRole(user.role as string))) { navigate("/admin/login"); return null; }

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setForm({ code: c.code, discountType: c.discountType, discountValue: String(c.discountValue), minOrderAmount: c.minOrderAmount != null ? String(c.minOrderAmount) : "", maxUses: c.maxUses != null ? String(c.maxUses) : "", isActive: c.isActive, expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : "" });
    setEditingId(c.id); setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      code: form.code.toUpperCase(),
      discountType: form.discountType as "percentage" | "fixed",
      discountValue: parseFloat(form.discountValue),
      isActive: form.isActive,
      ...(form.minOrderAmount ? { minOrderAmount: parseFloat(form.minOrderAmount) } : {}),
      ...(form.maxUses ? { maxUses: parseInt(form.maxUses) } : {}),
      ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {}),
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Coupon updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Coupon created" });
      }
      queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Coupon deleted" });
      queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() });
      setDeleteId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-sans mb-1">Manage</p>
            <h1 className="font-serif text-2xl font-semibold">Coupons</h1>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-2 font-sans"><Plus className="h-4 w-4" />Add Coupon</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-sm" />)}</div>
        ) : !(coupons?.data as any[])?.length ? (
          <div className="text-center py-16 border border-dashed border-border rounded-sm">
            <Ticket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-sans text-sm">No coupons yet.</p>
          </div>
        ) : (
          <div className="border border-border rounded-sm bg-card overflow-hidden">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Discount</th>
                  <th className="text-left px-5 py-3">Usage</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Expires</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {((coupons?.data as any[]) ?? []).map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm font-semibold tracking-wider text-foreground">{c.code}</span>
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {c.discountType === "percentage" ? `${c.discountValue}%` : `PKR ${Number(c.discountValue).toLocaleString()}`}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={cn("text-xs", c.isActive ? "border-green-500 text-green-600" : "border-muted text-muted-foreground")}>{c.isActive ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-serif">{editingId ? "Edit Coupon" : "Add Coupon"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Code</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="SUMMER20" className="font-mono uppercase font-sans" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Type</Label>
                <Select value={form.discountType} onValueChange={v => setForm({ ...form, discountType: v })}>
                  <SelectTrigger className="font-sans"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed (PKR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Value</Label>
                <Input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} required min="0" step="0.01" className="font-sans" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Min Order (PKR)</Label>
                <Input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} min="0" className="font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Max Uses</Label>
                <Input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} min="0" className="font-sans" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Expires At</Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="font-sans" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <Label className="font-sans text-sm">Active</Label>
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
          <DialogHeader><DialogTitle className="font-serif">Delete Coupon?</DialogTitle></DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 font-sans">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 font-sans" disabled={deleteMutation.isPending}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
