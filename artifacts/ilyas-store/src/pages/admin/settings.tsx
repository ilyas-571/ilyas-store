import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, Upload, X, Image } from "lucide-react";
import { isAdminRole } from "@/lib/authz";

interface Currency { code: string; symbol: string; rate: number; isEnabled: boolean; isDefault: boolean }

export default function AdminSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useGetSettings();
  const updateMutation = useUpdateSettings();

  const [storeName, setStoreName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState("PKR");
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setStoreName((settings as any).storeName ?? "Ilyas Store");
      const savedLogo = (settings as any).logoUrl ?? "";
      setLogoUrl(savedLogo);
      setLogoPreview(savedLogo || null);
      setCodEnabled((settings as any).codEnabled ?? true);
      setDefaultCurrency((settings as any).defaultCurrency ?? "PKR");
      setCurrencies((settings as any).currencies ?? []);
      setContactEmail((settings as any).contactEmail ?? "");
      setContactPhone((settings as any).contactPhone ?? "");
      setContactAddress((settings as any).contactAddress ?? "");
      setFacebookUrl((settings as any).facebookUrl ?? "");
      setInstagramUrl((settings as any).instagramUrl ?? "");
    }
  }, [settings]);

  if (!authLoading && (!user || !isAdminRole(user.role as string))) { navigate("/admin/login"); return null; }

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please use an image under 2MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      setLogoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    setLogoPreview(url || null);
  };

  const clearLogo = () => {
    setLogoUrl("");
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        data: {
          storeName,
          logoUrl: logoUrl || null,
          codEnabled,
          defaultCurrency,
          currencies,
          contactEmail,
          contactPhone,
          contactAddress,
          facebookUrl,
          instagramUrl,
        } as any
      });
      toast({ title: "Settings saved" });
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const addCurrency = () => {
    setCurrencies(prev => [...prev, { code: "", symbol: "", rate: 1, isEnabled: true, isDefault: false }]);
  };

  const removeCurrency = (index: number) => {
    setCurrencies(prev => prev.filter((_, i) => i !== index));
  };

  const updateCurrency = (index: number, field: keyof Currency, value: any) => {
    setCurrencies(prev => prev.map((c, i) => {
      if (i !== index) return c;
      return { ...c, [field]: value };
    }));
  };

  const setDefaultCurrencyCode = (index: number) => {
    setCurrencies(prev => prev.map((c, i) => ({ ...c, isDefault: i === index })));
    setDefaultCurrency(currencies[index]?.code ?? "");
  };

  if (isLoading) {
    return <AdminLayout><div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-40" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-8">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-sans mb-1">Configure</p>
          <h1 className="font-serif text-2xl font-semibold">Store Settings</h1>
        </div>

        {/* General */}
        <div className="border border-border rounded-sm bg-card p-6 space-y-5">
          <h3 className="font-sans text-sm font-medium tracking-wide uppercase text-muted-foreground">General</h3>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Store Name</Label>
            <Input value={storeName} onChange={e => setStoreName(e.target.value)} className="font-sans max-w-xs" />
          </div>
          <div className="flex items-center justify-between py-3 border-t border-border">
            <div>
              <p className="font-sans text-sm font-medium text-foreground">Cash on Delivery</p>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">Enable COD payment method for orders</p>
            </div>
            <Switch checked={codEnabled} onCheckedChange={setCodEnabled} />
          </div>
        </div>

        {/* Logo Uploader */}
        <div className="border border-border rounded-sm bg-card p-6 space-y-5">
          <div>
            <h3 className="font-sans text-sm font-medium tracking-wide uppercase text-muted-foreground">Store Logo</h3>
            <p className="font-sans text-xs text-muted-foreground mt-1">Displayed on invoices and print receipts. Use a PNG with transparent background for best results.</p>
          </div>

          {/* Preview */}
          <div className="flex items-start gap-5">
            <div className="h-24 w-40 border border-dashed border-border rounded-sm bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <Image className="h-8 w-8 text-muted-foreground/30 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground font-sans">No logo</p>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              {/* File upload */}
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-1.5 block">Upload Image</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                  id="logo-file-input"
                />
                <label htmlFor="logo-file-input">
                  <Button variant="outline" size="sm" className="gap-2 font-sans text-xs cursor-pointer" asChild>
                    <span>
                      <Upload className="h-3.5 w-3.5" />
                      Choose File
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground font-sans mt-1">PNG, JPG, SVG — max 2MB</p>
              </div>
              {/* URL input */}
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-1.5 block">Or enter image URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={logoUrl.startsWith("data:") ? "" : logoUrl}
                    onChange={e => handleLogoUrlChange(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="font-sans text-xs h-9"
                  />
                  {logoPreview && (
                    <Button variant="ghost" size="sm" onClick={clearLogo} className="h-9 w-9 p-0 text-destructive hover:text-destructive shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Currencies */}
        <div className="border border-border rounded-sm bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-sm font-medium tracking-wide uppercase text-muted-foreground">Currencies</h3>
            <Button onClick={addCurrency} variant="outline" size="sm" className="gap-1.5 font-sans text-xs h-8">
              <Plus className="h-3.5 w-3.5" />Add
            </Button>
          </div>
          <div className="space-y-4">
            {currencies.map((currency, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-3">
                  {index === 0 && <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-1.5 block">Code</Label>}
                  <Input value={currency.code} onChange={e => updateCurrency(index, "code", e.target.value.toUpperCase())} placeholder="PKR" className="font-mono font-sans h-9 text-sm" maxLength={5} />
                </div>
                <div className="col-span-2">
                  {index === 0 && <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-1.5 block">Symbol</Label>}
                  <Input value={currency.symbol} onChange={e => updateCurrency(index, "symbol", e.target.value)} placeholder="₨" className="font-sans h-9 text-sm" />
                </div>
                <div className="col-span-3">
                  {index === 0 && <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-1.5 block">Rate (to PKR)</Label>}
                  <Input type="number" value={currency.rate} onChange={e => updateCurrency(index, "rate", parseFloat(e.target.value) || 1)} step="0.0001" className="font-sans h-9 text-sm" />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  {index === 0 && <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-1.5 block">Default</Label>}
                  <div className="flex items-center gap-2 h-9">
                    <Switch checked={currency.isDefault} onCheckedChange={() => setDefaultCurrencyCode(index)} className="scale-75" />
                    <Switch checked={currency.isEnabled} onCheckedChange={v => updateCurrency(index, "isEnabled", v)} className="scale-75" />
                  </div>
                </div>
                <div className="col-span-2 flex justify-end">
                  {index === 0 && <div className="mb-1.5 h-[14px]" />}
                  <Button variant="ghost" size="sm" onClick={() => removeCurrency(index)} className="h-9 w-9 p-0 text-destructive hover:text-destructive mt-auto">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-sans">Default = toggle left; Enabled = toggle right. Set rate relative to 1 PKR.</p>
        </div>

        {/* Contact Information */}
        <div className="border border-border rounded-sm bg-card p-6 space-y-5">
          <h3 className="font-sans text-sm font-medium tracking-wide uppercase text-muted-foreground">Contact & Footer Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Email Address</Label>
              <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contact@ilyasstore.com" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Phone Number</Label>
              <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+92 300 1234567" className="font-sans" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Store Address</Label>
              <Input value={contactAddress} onChange={e => setContactAddress(e.target.value)} placeholder="123 Main Street, City" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Facebook URL</Label>
              <Input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Instagram URL</Label>
              <Input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className="font-sans" />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 font-sans">
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </AdminLayout>
  );
}
