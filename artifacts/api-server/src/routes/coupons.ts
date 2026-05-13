import { Router, type IRouter } from "express";
import { db, couponsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateCouponBody, UpdateCouponBody, ValidateCouponBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function formatCoupon(c: typeof couponsTable.$inferSelect) {
  return { id: c.id, code: c.code, discountType: c.discountType, discountValue: parseFloat(c.discountValue), minOrderAmount: c.minOrderAmount ? parseFloat(c.minOrderAmount) : null, maxUses: c.maxUses, usedCount: c.usedCount, isActive: c.isActive, expiresAt: c.expiresAt, createdAt: c.createdAt };
}

router.get("/coupons", requireAdmin, async (_req, res): Promise<void> => {
  const coupons = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
  res.json(coupons.map(formatCoupon));
});

router.post("/coupons", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [coupon] = await db.insert(couponsTable).values({
    code: parsed.data.code,
    discountType: parsed.data.discountType,
    discountValue: String(parsed.data.discountValue),
    minOrderAmount: parsed.data.minOrderAmount != null ? String(parsed.data.minOrderAmount) : null,
    maxUses: parsed.data.maxUses ?? null,
    isActive: parsed.data.isActive ?? true,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  }).returning();

  res.status(201).json(formatCoupon(coupon));
});

router.put("/coupons/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.code != null) updateData.code = parsed.data.code;
  if (parsed.data.discountType != null) updateData.discountType = parsed.data.discountType;
  if (parsed.data.discountValue != null) updateData.discountValue = String(parsed.data.discountValue);
  if (parsed.data.minOrderAmount !== undefined) updateData.minOrderAmount = parsed.data.minOrderAmount != null ? String(parsed.data.minOrderAmount) : null;
  if (parsed.data.maxUses !== undefined) updateData.maxUses = parsed.data.maxUses;
  if (parsed.data.isActive != null) updateData.isActive = parsed.data.isActive;
  if (parsed.data.expiresAt !== undefined) updateData.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;

  const [coupon] = await db.update(couponsTable).set(updateData).where(eq(couponsTable.id, id)).returning();
  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }
  res.json(formatCoupon(coupon));
});

router.delete("/coupons/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [coupon] = await db.delete(couponsTable).where(eq(couponsTable.id, id)).returning();
  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }
  res.json({ message: "Coupon deleted" });
});

router.post("/coupons/validate", async (req, res): Promise<void> => {
  const parsed = ValidateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { code, orderAmount } = parsed.data;
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code));

  if (!coupon || !coupon.isActive) {
    res.json({ valid: false, discount: 0, message: "Invalid or inactive coupon" });
    return;
  }
  if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
    res.json({ valid: false, discount: 0, message: "Coupon has expired" });
    return;
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    res.json({ valid: false, discount: 0, message: "Coupon usage limit reached" });
    return;
  }
  if (coupon.minOrderAmount && orderAmount < parseFloat(coupon.minOrderAmount)) {
    res.json({ valid: false, discount: 0, message: `Minimum order amount is ${coupon.minOrderAmount}` });
    return;
  }

  const discount = coupon.discountType === "percentage"
    ? (orderAmount * parseFloat(coupon.discountValue)) / 100
    : parseFloat(coupon.discountValue);

  res.json({ valid: true, discount, message: `Coupon applied! You save ${discount.toFixed(2)}` });
});

export default router;
