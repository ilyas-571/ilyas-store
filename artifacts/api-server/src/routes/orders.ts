import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, productsTable, productVariantsTable, usersTable, couponsTable, cartItemsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { CreateOrderBody, UpdateOrderStatusBody, ListOrdersQueryParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth";
import { sendOrderConfirmationEmail, sendNewOrderAdminAlert } from "../lib/email";

const router: IRouter = Router();

async function formatOrder(order: typeof ordersTable.$inferSelect, user?: { name: string; email: string } | null) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  return {
    id: order.id,
    userId: order.userId,
    userName: user?.name ?? null,
    userEmail: user?.email ?? null,
    items: items.map(i => ({
      productId: i.productId,
      variantId: i.variantId,
      productNameSnapshot: i.productNameSnapshot,
      variantValueSnapshot: i.variantValueSnapshot,
      priceSnapshot: parseFloat(i.priceSnapshot),
      quantity: i.quantity
    })),
    totalPrice: parseFloat(order.totalPrice),
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    invoiceNumber: order.invoiceNumber,
    address: order.address,
    couponCode: order.couponCode,
    discount: order.discount ? parseFloat(order.discount) : 0,
    createdAt: order.createdAt,
  };
}

router.get("/orders", requireAdmin, async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  const { status, page = 1, limit = 20 } = params.success ? params.data : { status: undefined, page: 1, limit: 20 };

  const conditions = status ? [eq(ordersTable.status, status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled")] : [];
  const allOrders = await db.select().from(ordersTable).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(ordersTable.createdAt));
  const total = allOrders.length;
  const paginated = allOrders.slice((page - 1) * limit, page * limit);

  const orders = await Promise.all(paginated.map(async (order) => {
    const [user] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, order.userId));
    return await formatOrder(order, user);
  }));

  res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { items, address, currency = "PKR", couponCode } = parsed.data;
  const paymentMethod = req.body?.paymentMethod === "stripe" || req.body?.paymentMethod === "paypal" ? req.body.paymentMethod : "cod";
  const paymentStatus = paymentMethod === "cod" ? "pending" : "paid";

  let discount = 0;
  let appliedCoupon: string | null = null;

  try {
    const order = await db.transaction(async (tx) => {
      let totalPrice = 0;
      let orderItemsToInsert = [];

      for (const item of items) {
        const [product] = await tx.select().from(productsTable).where(eq(productsTable.id, item.productId));
        if (!product) throw new Error(`Product ${item.productId} not found`);

        let price = parseFloat(product.basePrice ?? product.compareAtPrice ?? "0");
        let variantValueSnapshot = null;

        if (item.variantId) {
          const [variant] = await tx.select().from(productVariantsTable).where(eq(productVariantsTable.id, item.variantId));
          if (!variant) throw new Error(`Variant ${item.variantId} not found`);
          price = parseFloat(variant.price);
          variantValueSnapshot = `${variant.type}: ${variant.value}`;
          
          if (variant.stock < item.quantity) throw new Error(`Insufficient stock for variant ${variant.value}`);
          await tx.update(productVariantsTable).set({ stock: variant.stock - item.quantity }).where(eq(productVariantsTable.id, variant.id));
        } else {
          if (product.stock < item.quantity) throw new Error(`Insufficient stock for product ${product.name}`);
          await tx.update(productsTable).set({ stock: product.stock - item.quantity }).where(eq(productsTable.id, product.id));
        }

        totalPrice += price * item.quantity;
        orderItemsToInsert.push({
          productId: product.id,
          variantId: item.variantId || null,
          productNameSnapshot: product.name,
          variantValueSnapshot: variantValueSnapshot,
          priceSnapshot: String(price),
          quantity: item.quantity,
        });
      }

      if (couponCode) {
        const [coupon] = await tx.select().from(couponsTable).where(eq(couponsTable.code, couponCode));
        if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
          if (!coupon.minOrderAmount || totalPrice >= parseFloat(coupon.minOrderAmount)) {
            if (!coupon.maxUses || coupon.usedCount < coupon.maxUses) {
              if (coupon.discountType === "percentage") {
                discount = (totalPrice * parseFloat(coupon.discountValue)) / 100;
              } else {
                discount = parseFloat(coupon.discountValue);
              }
              totalPrice = Math.max(0, totalPrice - discount);
              appliedCoupon = couponCode;
              await tx.update(couponsTable).set({ usedCount: coupon.usedCount + 1 }).where(eq(couponsTable.id, coupon.id));
            }
          }
        }
      }

      const addressWithCountry = {
        ...address,
        country: address.country || "Pakistan"
      };

      const [newOrder] = await tx.insert(ordersTable).values({
        userId: req.user!.id,
        totalPrice: String(totalPrice),
        currency,
        paymentMethod,
        paymentStatus,
        status: "pending",
        invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        address: addressWithCountry,
        couponCode: appliedCoupon,
        discount: String(discount),
      }).returning();

      if (orderItemsToInsert.length > 0) {
        await tx.insert(orderItemsTable).values(
          orderItemsToInsert.map(item => ({ ...item, orderId: newOrder.id }))
        );
      }

      return newOrder;
    });

    const [user] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, req.user!.id));
    
    // Trigger emails asynchronously
    if (user?.email) {
      sendOrderConfirmationEmail(user.email, order.id, parseFloat(order.totalPrice)).catch(console.error);
    }
    sendNewOrderAdminAlert(order.id, parseFloat(order.totalPrice)).catch(console.error);

    // Clear server-side cart items for this user after successful order
    try {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.id));
    } catch (cartClearError) {
      // Non-critical — log but don't fail the order
      console.error("Failed to clear cart after order:", cartClearError);
    }

    res.status(201).json(await formatOrder(order, user));
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create order" });
  }
});

router.get("/orders/my", requireAuth, async (req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, req.user!.id)).orderBy(desc(ordersTable.createdAt));
  const results = await Promise.all(orders.map(o => formatOrder(o)));
  res.json(results);
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  if (req.user?.role !== "staff" && req.user?.role !== "super_admin" && order.userId !== req.user?.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const [user] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, order.userId));
  res.json(await formatOrder(order, user));
});

router.put("/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [order] = await db.update(ordersTable).set({
    status: parsed.data.status,
    paymentStatus: parsed.data.status === "delivered" ? "paid" : undefined,
  }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const [user] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, order.userId));
  res.json(await formatOrder(order, user));
});

export default router;
