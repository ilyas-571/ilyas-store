import { useState } from "react";
import { useLocation } from "wouter";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { isAdminRole } from "@/lib/authz";

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const { login, user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginUser();

  if (user && isAdminRole(user.role as string)) {
    navigate("/admin");
    return null;
  } else if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginMutation.mutateAsync({ data: { email, password } });
      const token = (res as any).data?.token;
      if (token) {
        localStorage.setItem("ilyas_token", token);
        login(token);
        if (isAdminRole((res as any).data?.user?.role)) {
          toast({ title: "Admin authentication successful" });
          navigate("/admin");
        } else {
          toast({ title: "Access denied", description: "You are not an administrator", variant: "destructive" });
          navigate("/");
        }
      }
    } catch (err: any) {
      toast({ title: "Login failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background border border-border shadow-xl rounded-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold tracking-wider text-foreground">ILYAS ADMIN</h1>
              <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase font-sans">Secure Portal</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@ilyasstore.com"
                required
                className="h-11 font-sans bg-muted/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Master Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="h-11 font-sans pr-10 bg-muted/50"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-sans tracking-wide mt-2" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Authenticating..." : "Login to Dashboard"}
            </Button>
          </form>
        </div>
        <div className="bg-muted/30 px-8 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground font-sans text-center">
            This portal is restricted to authorized personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}
