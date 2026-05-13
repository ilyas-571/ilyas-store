import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, CheckCircle2, MapPin, CreditCard, Package } from "lucide-react";
import StoreLayout from "@/components/layout/store-layout";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useValidateCoupon, useCreateOrder, useGetSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/seo";

type Step = "cart" | "checkout" | "confirm";

const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "cart", label: "Cart", icon: <ShoppingBag className="h-4 w-4" /> },
  { key: "checkout", label: "Delivery", icon: <MapPin className="h-4 w-4" /> },
  { key: "confirm", label: "Confirm", icon: <CheckCircle2 className="h-4 w-4" /> },
];

export default function CartPage() {
  const [, navigate] = useLocation();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    buyNowPayload,
    clearBuyNow,
    checkoutItems,
    checkoutSubtotal,
  } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settingsResponse } = useGetSettings();
  const settings = settingsResponse?.data;
  const currency = settings?.defaultCurrency ?? "PKR";

  const validateCouponMutation = useValidateCoupon();
  const createOrderMutation = useCreateOrder();

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [step, setStep] = useState<Step>("cart");
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    landmark: "",
    country: "Pakistan",
    notes: "",
  });

  // Determine if we're in buy-now mode
  const isBuyNow = !!buyNowPayload;

  // If buy-now, auto-advance to checkout step
  useEffect(() => {
    if (isBuyNow) {
      setStep("cart"); // show cart review first, user clicks "Proceed"
    }
  }, [isBuyNow]);

  // Reset coupon state when checkout items change
  useEffect(() => {
    setDiscount(0);
    setAppliedCoupon("");
    setCouponCode("");
  }, [isBuyNow]);

  // Use checkout items for total computation
  const total = Math.max(0, checkoutSubtotal - discount);
  const shipping = 0;

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const result = await validateCouponMutation.mutateAsync({ data: { code: couponCode, orderAmount: checkoutSubtotal } });
      if ((result as any).valid) {
        setDiscount((result as any).discount);
        setAppliedCoupon(couponCode);
        toast({ title: "Coupon applied", description: (result as any).message });
      } else {
        toast({ title: "Invalid coupon", description: (result as any).message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Coupon error", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }

    try {
      const order = await createOrderMutation.mutateAsync({
        data: {
          items: checkoutItems.map(i => ({ productId: i.product.id, variantId: i.variantId, quantity: i.quantity })),
          address: {
            name: form.name,
            phone: form.phone,
            street: form.street + (form.postalCode ? `, ${form.postalCode}` : "") + (form.landmark ? ` (Near ${form.landmark})` : ""),
            city: form.city,
            country: form.country,
          },
          currency,
          couponCode: appliedCoupon || undefined,
        }
      });
      setPlacedOrderId((order as any).id);

      // Full cleanup after successful order
      if (isBuyNow) {
        // Buy-now: only clear the buy-now payload, keep regular cart intact
        clearBuyNow();
      } else {
        // Regular cart checkout: clear the entire cart
        clearCart();
      }

      // Reset coupon/discount state
      setDiscount(0);
      setAppliedCoupon("");
      setCouponCode("");

      setStep("confirm");
    } catch (err: any) {
      toast({ title: "Order failed", description: err?.data?.error ?? err.message, variant: "destructive" });
    }
  };

  /** Cancel buy-now and go back to regular cart view */
  const handleCancelBuyNow = () => {
    clearBuyNow();
  };

  const currentStepIndex = steps.findIndex(s => s.key === step);

  // Determine the displayable items for the cart view
  const displayItems = isBuyNow ? checkoutItems : items;
  const displaySubtotal = isBuyNow ? checkoutSubtotal : subtotal;

  if (displayItems.length === 0 && step !== "confirm") {
    return (
      <StoreLayout>
        <SEO title="Cart" description="Review your shopping cart and checkout at Ilyas Store." />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
          <h2 className="font-serif text-3xl text-foreground mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground font-sans mb-8">Add something exceptional to begin.</p>
          <Link href="/products"><Button className="font-sans">Browse Collections</Button></Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <SEO title={step === "cart" ? "Your Cart" : step === "checkout" ? "Checkout" : "Order Confirmed"} description="Checkout at Ilyas Store securely." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header + stepper */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-sans mb-1">Shopping</p>
          <h1 className="font-serif text-3xl font-semibold text-foreground mb-6">
            {step === "cart"
              ? (isBuyNow ? "Order Summary" : "Your Cart")
              : step === "checkout"
                ? "Checkout"
                : "Order Confirmed"}
          </h1>

          {/* Buy Now banner */}
          {isBuyNow && step !== "confirm" && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-sm mb-4">
              <Package className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-sans text-sm font-medium text-foreground">Buy Now — Direct Order</p>
                <p className="font-sans text-xs text-muted-foreground">Only the selected product will be ordered. Your cart items are unchanged.</p>
              </div>
              <Button variant="ghost" size="sm" className="font-sans text-xs" onClick={handleCancelBuyNow}>
                Cancel & View Cart
              </Button>
            </div>
          )}

          {step !== "confirm" && (
            <div className="flex items-center gap-0">
              {steps.filter(s => s.key !== "confirm").map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium transition-colors",
                    currentStepIndex === i
                      ? "bg-primary text-primary-foreground"
                      : currentStepIndex > i
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {s.icon}
                    {s.label}
                  </div>
                  {i < steps.filter(s => s.key !== "confirm").length - 1 && (
                    <div className={cn("h-px w-8", currentStepIndex > i ? "bg-primary" : "bg-border")} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Confirmed */}
        {step === "confirm" && (
          <div className="max-w-lg mx-auto text-center py-10">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Thank you for your order!</h2>
            <p className="font-sans text-muted-foreground mb-1">Order #{placedOrderId} has been placed successfully.</p>
            <p className="font-sans text-sm text-muted-foreground mb-8">You'll receive your items within 3–5 business days. Our team will contact you before delivery.</p>
            <div className="bg-muted/30 rounded-sm p-5 text-left mb-8 space-y-2">
              <div className="flex justify-between text-sm font-sans">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">Cash on Delivery</span>
              </div>
              <div className="flex justify-between text-sm font-sans">
                <span className="text-muted-foreground">Estimated Delivery</span>
                <span className="font-medium">3–5 Business Days</span>
              </div>
              <div className="flex justify-between text-sm font-sans">
                <span className="text-muted-foreground">Delivery To</span>
                <span className="font-medium">{form.city}, {form.country}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/orders">
                <Button className="font-sans gap-2"><Package className="h-4 w-4" />Track Orders</Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="font-sans">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        )}

        {step === "cart" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Items */}
            <div className="lg:col-span-2 space-y-6">
              {displayItems.map(({ product, quantity, variantId }) => {
                const variant = variantId && product.variants ? product.variants.find((v: any) => v.id === variantId) : null;
                const price = variant ? variant.price : (product.basePrice || 0);
                const image = variant?.imageUrl || product.images?.[0];

                return (
                  <div key={`${product.id}-${variantId || 'base'}`} className="flex gap-5 pb-6 border-b border-border last:border-0">
                    <Link href={`/products/${product.id}`}>
                      <div className="h-24 w-20 shrink-0 bg-muted rounded-sm overflow-hidden">
                        {image ? (
                          <img src={image} alt={product.name} loading="lazy" width={80} height={96} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-sans">{(product as any).categoryName}</p>
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-serif text-base font-medium text-foreground hover:text-primary transition-colors mt-0.5">{product.name}</h3>
                      </Link>
                      {variant && <p className="font-sans text-xs text-muted-foreground mt-0.5">{variant.type}: {variant.value}</p>}
                      <p className="font-sans text-sm text-muted-foreground mt-1">{currency} {Number(price).toLocaleString()}</p>
                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity controls — disabled in buy-now mode to keep it simple */}
                        {isBuyNow ? (
                          <span className="font-sans text-sm text-muted-foreground">Qty: {quantity}</span>
                        ) : (
                          <div className="flex items-center border border-border rounded-sm">
                            <button aria-label={`Decrease quantity of ${product.name}`} onClick={() => updateQuantity(product.id, variantId, quantity - 1)} className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="h-8 w-8 flex items-center justify-center font-sans text-sm">{quantity}</span>
                            <button aria-label={`Increase quantity of ${product.name}`} onClick={() => updateQuantity(product.id, variantId, quantity + 1)} className="h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="font-sans text-sm font-medium">{currency} {(Number(price) * quantity).toLocaleString()}</span>
                          {!isBuyNow && (
                            <button aria-label={`Remove ${product.name} from cart`} onClick={() => removeItem(product.id, variantId)} className="text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-muted/30 rounded-sm p-6 sticky top-24">
                <h3 className="font-sans text-sm font-medium tracking-wide uppercase text-muted-foreground mb-5">Order Summary</h3>
                <div className="space-y-3 text-sm font-sans">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({displayItems.length} items)</span>
                    <span>{currency} {displaySubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon})</span>
                      <span>-{currency} {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{currency} {total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="mt-5 pt-5 border-t border-border">
                  <Label className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Coupon Code</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="SAVE20"
                      className="h-9 font-sans text-sm"
                      disabled={!!appliedCoupon}
                    />
                    <Button variant="outline" size="sm" className="shrink-0 font-sans" onClick={handleCoupon} disabled={validateCouponMutation.isPending || !!appliedCoupon}>
                      <Tag className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {appliedCoupon && <p className="text-xs text-green-600 font-sans mt-1.5">✓ Coupon "{appliedCoupon}" applied</p>}
                </div>

                {/* Payment badge */}
                <div className="mt-5 pt-5 border-t border-border flex items-center gap-2 text-sm font-sans text-muted-foreground">
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span>Payment: <span className="text-foreground font-medium">Cash on Delivery</span></span>
                </div>

                <Button
                  className="w-full mt-6 font-sans gap-2"
                  onClick={() => {
                    if (!user) { navigate("/login"); return; }
                    setStep("checkout");
                  }}
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-center text-xs text-muted-foreground font-sans mt-3">Free returns · Secure checkout</p>
              </div>
            </div>
          </div>
        )}

        {step === "checkout" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
              {/* Contact */}
              <div className="border border-border rounded-sm p-6 space-y-5">
                <h3 className="font-sans text-sm font-medium tracking-wide uppercase text-muted-foreground">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Full Name *</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Full name" className="h-11 font-sans" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Phone Number *</Label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="+92 300 1234567" className="h-11 font-sans" />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="border border-border rounded-sm p-6 space-y-5">
                <h3 className="font-sans text-sm font-medium tracking-wide uppercase text-muted-foreground">Delivery Address</h3>
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Street Address *</Label>
                  <Input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} required placeholder="House / flat no. and street name" className="h-11 font-sans" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Landmark / Area</Label>
                  <Input value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} placeholder="Near landmark or area name" className="h-11 font-sans" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs tracking-wide uppercase text-muted-foreground font-sans">City *</Label>
                    <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required placeholder="City" className="h-11 font-sans" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Postal Code</Label>
                    <Input value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} placeholder="75500" className="h-11 font-sans" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Country *</Label>
                    <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} required placeholder="Country" className="h-11 font-sans" />
                  </div>
                </div>
              </div>

              {/* Payment + Notes */}
              <div className="border border-border rounded-sm p-6 space-y-5">
                <h3 className="font-sans text-sm font-medium tracking-wide uppercase text-muted-foreground">Payment & Notes</h3>
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-sm">
                  <CreditCard className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">Cash on Delivery</p>
                    <p className="font-sans text-xs text-muted-foreground mt-0.5">Pay when your order arrives at your door</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs font-sans border-primary/30 text-primary">Active</Badge>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wide uppercase text-muted-foreground font-sans">Order Notes (Optional)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any special instructions for delivery or packaging..."
                    className="font-sans text-sm resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Estimated Delivery */}
              <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-sm border border-border">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-sans text-sm font-medium text-foreground">Estimated Delivery: 3–5 Business Days</p>
                  <p className="font-sans text-xs text-muted-foreground mt-0.5">Our team will call before delivery to confirm your availability.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep("cart")} className="font-sans">← Back to Cart</Button>
                <Button type="submit" className="flex-1 font-sans gap-2" disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? "Placing order..." : <><CheckCircle2 className="h-4 w-4" /> Place Order</>}
                </Button>
              </div>
            </form>

            {/* Order mini-summary */}
            <div className="lg:col-span-1">
              <div className="bg-muted/30 rounded-sm p-6 sticky top-24">
                <h3 className="font-sans text-sm font-medium tracking-wide uppercase text-muted-foreground mb-4">Your Order</h3>
                <div className="space-y-3">
                  {checkoutItems.map(({ product, quantity, variantId }) => {
                    const variant = variantId && product.variants ? product.variants.find((v: any) => v.id === variantId) : null;
                    const price = variant ? variant.price : (product.basePrice || 0);
                    const image = variant?.imageUrl || product.images?.[0];

                    return (
                      <div key={`${product.id}-${variantId || 'base'}`} className="flex items-center gap-3">
                        <div className="relative h-12 w-12 bg-muted rounded-sm shrink-0 overflow-hidden">
                          {image && <img src={image} alt={product.name} loading="lazy" width={48} height={48} className="w-full h-full object-cover" />}
                          <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-sans font-medium">{quantity}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-xs text-foreground truncate">{product.name}</p>
                          {variant && <p className="font-sans text-[10px] text-muted-foreground truncate">{variant.type}: {variant.value}</p>}
                          <p className="font-sans text-xs text-muted-foreground">{currency} {Number(price).toLocaleString()} ea.</p>
                        </div>
                        <span className="font-sans text-xs font-medium shrink-0">{currency} {(Number(price) * quantity).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm font-sans">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{currency} {checkoutSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{currency} {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{currency} {total.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground font-sans mt-4">
                  🔒 Secure & encrypted checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
