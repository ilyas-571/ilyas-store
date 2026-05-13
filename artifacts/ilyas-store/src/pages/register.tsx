import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { login, user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegisterUser();

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters", variant: "destructive" });
      return;
    }
    try {
      const res = await registerMutation.mutateAsync({ data: { name, email, password } });
      const token = (res as any).data?.token;
      if (token) {
        localStorage.setItem("ilyas_token", token);
        login(token);
        toast({ title: "Account created", description: `Welcome, ${name}` });
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Registration failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground flex-col justify-between p-12">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold tracking-wider text-background">ILYAS</span>
            <span className="text-xs tracking-[0.3em] text-background/40 uppercase font-sans">STORE</span>
          </div>
        </div>
        <div>
          <blockquote className="font-serif text-2xl text-background/80 leading-relaxed mb-6">
            "To begin collecting is to begin a conversation with beauty that never ends."
          </blockquote>
          <div className="h-px w-16 bg-background/20" />
        </div>
        <p className="text-xs text-background/30 font-sans tracking-widest uppercase">Est. 2024</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-sans mb-2">Join the atelier</p>
            <h1 className="font-serif text-3xl font-semibold text-foreground">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Full Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required className="h-11 font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className="h-11 font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="h-11 font-sans pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-sans tracking-wide" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <div className="border-b border-border w-full"></div>
            <span className="text-xs text-muted-foreground uppercase tracking-widest px-4 shrink-0 font-sans">Or continue with</span>
            <div className="border-b border-border w-full"></div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="h-11 font-sans gap-2" 
              onClick={() => toast({ title: "OAuth not configured", description: "Google login requires API keys in .env", variant: "destructive" })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.7449 12.27C23.7449 11.48 23.6749 10.73 23.5549 10H12.2148V14.51H18.7248C18.4348 15.99 17.5848 17.24 16.3248 18.09V21.09H20.1848C22.4448 19.01 23.7449 15.92 23.7449 12.27Z" fill="#4285F4"/><path d="M12.2148 24C15.4548 24 18.1748 22.93 20.1848 21.09L16.3248 18.09C15.2448 18.81 13.8548 19.25 12.2148 19.25C9.03484 19.25 6.34484 17.1 5.37484 14.23H1.38484V17.32C3.39484 21.31 7.45484 24 12.2148 24Z" fill="#34A853"/><path d="M5.37484 14.23C5.12484 13.51 4.98484 12.76 4.98484 12C4.98484 11.24 5.12484 10.49 5.37484 9.77V6.68H1.38484C0.554841 8.33 0.0848389 10.12 0.0848389 12C0.0848389 13.88 0.554841 15.67 1.38484 17.32L5.37484 14.23Z" fill="#FBBC05"/><path d="M12.2148 4.75C13.9748 4.75 15.5548 5.36 16.7948 6.54L20.2648 3.07C18.1648 1.11 15.4548 0 12.2148 0C7.45484 0 3.39484 2.69 1.38484 6.68L5.37484 9.77C6.34484 6.9 9.03484 4.75 12.2148 4.75Z" fill="#EA4335"/></svg>
              Google
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="h-11 font-sans gap-2 text-[#1877F2]" 
              onClick={() => toast({ title: "OAuth not configured", description: "Facebook login requires API keys in .env", variant: "destructive" })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073C24 5.405 18.627 0 12 0C5.373 0 0 5.405 0 12.073C0 18.106 4.388 23.094 10.125 24V15.562H7.078V12.073H10.125V9.412C10.125 6.381 11.916 4.707 14.656 4.707C15.97 4.707 17.344 4.943 17.344 4.943V7.933H15.83C14.339 7.933 13.875 8.868 13.875 9.83V12.073H17.203L16.671 15.562H13.875V24C19.612 23.094 24 18.106 24 12.073Z"/></svg>
              Facebook
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground font-sans">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
