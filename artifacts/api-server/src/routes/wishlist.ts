import { Router, type IRouter } from "express";
import { db, wishlistTable, productsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { TenantRequest } from "../middlewares/tenant";

const router: IRouter = Router();

router.get("/wishlist", requireAuth, async (req: TenantRequest, res): Promise<void> => {
  if (!req.storeId) {
    res.status(403).json({ error: "Store context missing" });
    return;
  }

  const items = await db.select()
    .from(wishlistTable)
    .where(and(
      eq(wishlistTable.userId, req.user!.id),
      eq(wishlistTable.storeId, req.storeId)
    ))
    .orderBy(desc(wishlistTable.createdAt));

  // Fetch full product details for each wishlist item
  const products = await Promise.all(
    items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      return { ...item, product };
    })
  );

  res.json(products);
});

router.post("/wishlist", requireAuth, async (req: TenantRequest, res): Promise<void> => {
  if (!req.storeId) {
    res.status(403).json({ error: "Store context missing" });
    return;
  }

  const { productId, variantId } = req.body;
  if (!productId) {
    res.status(400).json({ error: "Product ID is required" });
    return;
  }

  // Check if already in wishlist
  const [existing] = await db.select().from(wishlistTable).where(
    and(
      eq(wishlistTable.userId, req.user!.id),
      eq(wishlistTable.productId, productId),
      eq(wishlistTable.storeId, req.storeId)
    )
  );

  if (existing) {
    res.status(409).json({ error: "Product already in wishlist" });
    return;
  }

  const [item] = await db.insert(wishlistTable).values({
    userId: req.user!.id,
    productId,
    variantId: variantId || null,
    storeId: req.storeId,
  }).returning();

  res.status(201).json(item);
});

router.delete("/wishlist/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid wishlist item ID" });
    return;
  }

  const result = await db.delete(wishlistTable).where(
    and(
      eq(wishlistTable.id, id),
      eq(wishlistTable.userId, req.user!.id)
    )
  );

  if (result.rowCount === 0) {
    res.status(404).json({ error: "Wishlist item not found" });
    return;
  }

  res.status(204).send();
});

export default router;
