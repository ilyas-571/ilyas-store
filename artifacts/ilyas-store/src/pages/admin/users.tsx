import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useListUsers, useToggleBlockUser, useUpdateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { isAdminRole } from "@/lib/authz";

export default function AdminUsers() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListUsers({ page, limit: 20 });
  const toggleBlockMutation = useToggleBlockUser();
  const updateUserMutation = useUpdateUser();

  if (!authLoading && (!user || !isAdminRole(user.role as string))) { navigate("/admin/login"); return null; }

  const users = (data as any)?.users ?? [];

  const handleToggleBlock = async (userId: number, isBlocked: boolean) => {
    try {
      await toggleBlockMutation.mutateAsync({ id: userId, data: { isBlocked: !isBlocked } });
      toast({ title: !isBlocked ? "User blocked" : "User unblocked" });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await updateUserMutation.mutateAsync({ id: userId, data: { role: role as any } });
      toast({ title: "Role updated" });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-sans mb-1">Manage</p>
          <h1 className="font-serif text-2xl font-semibold">Users</h1>
        </div>

        <div className="border border-border rounded-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Joined</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Block</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-5 py-3"><Skeleton className="h-8" /></td></tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No users found</td></tr>
                ) : users.map((u: any) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Select value={u.role} onValueChange={v => handleRoleChange(u.id, v)} disabled={u.id === user?.id}>
                        <SelectTrigger className="h-7 w-28 font-sans text-xs border-none bg-muted/50 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={cn("text-xs", u.isBlocked ? "border-red-400 text-red-500" : "border-green-500 text-green-600")}>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Switch checked={!u.isBlocked} onCheckedChange={() => handleToggleBlock(u.id, u.isBlocked)} disabled={u.id === user?.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(data as any)?.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground font-sans">Page {page} of {(data as any).totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="font-sans text-xs">Prev</Button>
                <Button variant="outline" size="sm" disabled={page === (data as any).totalPages} onClick={() => setPage(p => p + 1)} className="font-sans text-xs">Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
