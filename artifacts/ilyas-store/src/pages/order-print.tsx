import { useParams } from "wouter";
import { useGetOrder, getGetOrderQueryKey, useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderPrintPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id ?? "0", 10);
  const { user } = useAuth();

  const { data: order, isLoading: orderLoading } = useGetOrder(orderId, {
    query: { enabled: !!user && !!orderId, queryKey: getGetOrderQueryKey(orderId) }
  });

  const { data: settings } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });

  const storeName = (settings as any)?.storeName ?? "Ilyas Store";
  const logoUrl = (settings as any)?.logoUrl ?? null;

  if (orderLoading) {
    return (
      <div className="p-10 space-y-4">
        <Skeleton className="h-16 w-48" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground font-sans">Order not found.</p>
      </div>
    );
  }

  const o = order as any;
  const orderDate = new Date(o.createdAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Print action bar — hidden when printing */}
      <div className="print:hidden bg-muted/40 border-b border-border px-8 py-3 flex items-center justify-between">
        <p className="font-sans text-sm text-muted-foreground">Order Invoice — #{o.id}</p>
        <Button onClick={() => window.print()} className="gap-2 font-sans" size="sm">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Printable document */}
      <div className="max-w-2xl mx-auto px-8 py-10 print:px-6 print:py-6 font-sans">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-black">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-14 w-auto object-contain" />
            ) : (
              <div className="text-left">
                <p className="font-serif text-2xl font-bold tracking-widest">{storeName.toUpperCase()}</p>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">INVOICE</p>
            <p className="text-sm text-gray-500 mt-1">Order #{o.id}</p>
            <p className="text-sm text-gray-500">{orderDate}</p>
          </div>
        </div>

        {/* Billed to / Shipped to */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Customer</p>
            <p className="font-semibold text-gray-800">{o.address?.name ?? o.userName}</p>
            <p className="text-sm text-gray-600">{o.address?.phone}</p>
            {o.userEmail && <p className="text-sm text-gray-600">{o.userEmail}</p>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Delivery Address</p>
            <p className="text-sm text-gray-700">{o.address?.street}</p>
            <p className="text-sm text-gray-700">{o.address?.city}, {o.address?.country}</p>
          </div>
        </div>

        {/* Order details row */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
          <div className="bg-gray-50 rounded p-3 border border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
            <p className="font-semibold text-gray-800">{statusLabels[o.status] ?? o.status}</p>
          </div>
          <div className="bg-gray-50 rounded p-3 border border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment</p>
            <p className="font-semibold text-gray-800">Cash on Delivery</p>
          </div>
          <div className="bg-gray-50 rounded p-3 border border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Currency</p>
            <p className="font-semibold text-gray-800">{o.currency ?? "PKR"}</p>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 font-bold text-gray-700">Item</th>
              <th className="text-center py-2 font-bold text-gray-700 w-16">Qty</th>
              <th className="text-right py-2 font-bold text-gray-700 w-24">Unit Price</th>
              <th className="text-right py-2 font-bold text-gray-700 w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {(o.items ?? []).map((item: any, i: number) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-3 text-gray-800 font-medium">{item.productName}</td>
                <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right text-gray-600">{o.currency ?? "PKR"} {Number(item.price).toLocaleString()}</td>
                <td className="py-3 text-right font-semibold text-gray-800">{o.currency ?? "PKR"} {(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{o.currency ?? "PKR"} {(o.discount ? (Number(o.totalPrice) + Number(o.discount)) : Number(o.totalPrice)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
            {o.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount{o.couponCode ? ` (${o.couponCode})` : ""}</span>
                <span>-{o.currency ?? "PKR"} {Number(o.discount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 border-t-2 border-black pt-2">
              <span>Total</span>
              <span>{o.currency ?? "PKR"} {Number(o.totalPrice).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-600">{storeName}</p>
          <p>Thank you for your purchase! For support, please contact us.</p>
          <p className="mt-2 text-gray-300">Generated on {new Date().toLocaleDateString("en-PK")}</p>
        </div>
      </div>
    </>
  );
}
