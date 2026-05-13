import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Product } from "@workspace/api-client-react";

export interface CartItem {
  product: Product;
  variantId?: number;
  quantity: number;
}

/**
 * "Buy Now" mode: when set, checkout should ONLY process these items
 * (ignoring the regular cart). Cleared after order or navigation away.
 */
export interface BuyNowPayload {
  items: CartItem[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variantId?: number) => void;
  removeItem: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, variantId: number | undefined, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;

  /** Buy-now flow — bypasses the regular cart */
  buyNowPayload: BuyNowPayload | null;
  setBuyNow: (product: Product, quantity: number, variantId?: number) => void;
  clearBuyNow: () => void;
  /** The items that should be used at checkout (buy-now if active, else cart) */
  checkoutItems: CartItem[];
  checkoutSubtotal: number;
}

const CART_STORAGE_KEY = "ilyas_cart";
const CART_USER_KEY = "ilyas_cart_user";

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Build a user-scoped storage key so different users never share a cart.
 * For guest users (no token) we use "guest".
 */
function currentUserId(): string {
  try {
    const token = localStorage.getItem("ilyas_token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return String(payload.id ?? "guest");
    }
  } catch { /* ignore */ }
  return "guest";
}

function loadCart(): CartItem[] {
  try {
    const uid = currentUserId();
    const storedUser = localStorage.getItem(CART_USER_KEY);

    // If the stored cart belongs to a different user, discard it
    if (storedUser && storedUser !== uid) {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(CART_USER_KEY);
      return [];
    }

    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  localStorage.setItem(CART_USER_KEY, currentUserId());
}

function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    let price = item.product.basePrice ?? 0;
    if (item.variantId && item.product.variants) {
      const variant = item.product.variants.find((v: any) => v.id === item.variantId);
      if (variant) price = variant.price;
    }
    return sum + (Number(price) * item.quantity);
  }, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") return loadCart();
    return [];
  });

  const [buyNowPayload, setBuyNowPayload] = useState<BuyNowPayload | null>(null);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    saveCart(items);
  }, [items]);

  // When the user changes (login/logout), reload/reset the cart
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "ilyas_token") {
        // User session changed — reload cart for new user
        setItems(loadCart());
        setBuyNowPayload(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addItem = useCallback((product: Product, quantity = 1, variantId?: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id && item.variantId === variantId);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.variantId === variantId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, variantId }];
    });
  }, []);

  const removeItem = useCallback((productId: number, variantId?: number) => {
    setItems((prev) => prev.filter((item) => !(item.product.id === productId && item.variantId === variantId)));
  }, []);

  const updateQuantity = useCallback((productId: number, variantId: number | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.variantId === variantId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setBuyNowPayload(null);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_USER_KEY);
  }, []);

  /** Initiate a "Buy Now" — sets a separate payload that checkout will use */
  const setBuyNow = useCallback((product: Product, quantity: number, variantId?: number) => {
    setBuyNowPayload({
      items: [{ product, quantity, variantId }],
    });
  }, []);

  const clearBuyNow = useCallback(() => {
    setBuyNowPayload(null);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calcSubtotal(items);

  // Checkout always uses buy-now items if a buy-now flow is active
  const checkoutItems = buyNowPayload ? buyNowPayload.items : items;
  const checkoutSubtotal = calcSubtotal(checkoutItems);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        buyNowPayload,
        setBuyNow,
        clearBuyNow,
        checkoutItems,
        checkoutSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
