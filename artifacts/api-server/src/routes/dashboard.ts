import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, usersTable, productsTable, productVariantsTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { GetRecentOrdersQueryParams, GetRevenueChartQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [usersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [productsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable);
  const allOrders = await db.select().from(ordersTable);
  const pendingOrders = allOrders.filter(o => o.status === "pending").length;
  const totalRevenue = allOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + parseFloat(o.totalPrice), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + parseFloat(o.totalPrice), 0);

  const products = await db.select().from(productsTable);
  const variants = await db.select().from(productVariantsTable);
  
  let lowStockCount = 0;
  for (const p of products) {
    const pVars = variants.filter(v => v.productId === p.id);
    if (pVars.length > 0) {
      const varStock = pVars.reduce((s, v) => s + v.stock, 0);
      if (varStock <= 5) lowStockCount++;
    } else {
      if (p.stock <= 5) lowStockCount++;
    }
  }

  res.json({
    totalOrders: allOrders.length,
    totalRevenue,
    totalUsers: usersCount?.count ?? 0,
    totalProducts: productsCount?.count ?? 0,
    pendingOrders,
    lowStockCount,
    todayOrders: todayOrders.length,
    todayRevenue,
  });
});

router.get("/dashboard/revenue", requireAdmin, async (req, res): Promise<void> => {
  const params = GetRevenueChartQueryParams.safeParse(req.query);
  const days = params.success ? (params.data.days ?? 7) : 7;

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayOrders = await db.select().from(ordersTable)
      .where(sql`${ordersTable.createdAt} >= ${date} AND ${ordersTable.createdAt} < ${nextDate}`);
    
    const revenue = dayOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + parseFloat(o.totalPrice), 0);
    result.push({ date: date.toISOString().slice(0, 10), revenue, orders: dayOrders.length });
  }
  res.json(result);
});

router.get("/dashboard/orders-by-status", requireAdmin, async (_req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);
  const total = allOrders.length;
  const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
  const result = statuses.map(status => {
    const count = allOrders.filter(o => o.status === status).length;
    return { status, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0 };
  });
  res.json(result);
});

router.get("/dashboard/recent-orders", requireAdmin, async (req, res): Promise<void> => {
  const params = GetRecentOrdersQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 10) : 10;

  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(limit);
  const result = await Promise.all(orders.map(async order => {
    const [user] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, order.userId));
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    return {
      id: order.id, userId: order.userId, userName: user?.name ?? null, userEmail: user?.email ?? null,
      items: items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        productNameSnapshot: i.productNameSnapshot,
        variantValueSnapshot: i.variantValueSnapshot,
        priceSnapshot: parseFloat(i.priceSnapshot),
        quantity: i.quantity
      })),
      totalPrice: parseFloat(order.totalPrice), currency: order.currency,
      status: order.status, address: order.address, couponCode: order.couponCode,
      discount: order.discount ? parseFloat(order.discount) : 0, createdAt: order.createdAt,
    };
  }));
  res.json(result);
});

export default router;
