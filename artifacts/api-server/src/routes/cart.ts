import { Router } from "express";
import { db, cartItemsTable, productsTable, productVariantsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod/v4";

const router = Router();

const CartItemRequest = z.object({
  productId: z.number(),
  variantId: z.number().nullable().optional(),
  quantity: z.number().min(1),
});

const UpdateCartItemRequest = z.object({
  quantity: z.number().min(1),
});

// GET /cart
router.get("/cart", requireAuth, async (req, res) => {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.id));
  
  // We need to return the products info as well
  const enrichedItems = await Promise.all(items.map(async (item) => {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    const variants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, item.productId));
    
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: {
        ...product,
        basePrice: product.basePrice ? parseFloat(product.basePrice) : null,
        variants: variants.map(v => ({ ...v, price: parseFloat(v.price) }))
      }
    };
  }));

  res.json(enrichedItems);
});

// POST /cart
router.post("/cart", requireAuth, async (req, res) => {
  const parsed = CartItemRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check if item already exists in cart
  const condition = parsed.data.variantId 
    ? and(eq(cartItemsTable.userId, req.user!.id), eq(cartItemsTable.productId, parsed.data.productId), eq(cartItemsTable.variantId, parsed.data.variantId))
    : and(eq(cartItemsTable.userId, req.user!.id), eq(cartItemsTable.productId, parsed.data.productId));

  const [existing] = await db.select().from(cartItemsTable).where(condition);

  let cartItem;
  if (existing) {
    [cartItem] = await db.update(cartItemsTable)
      .set({ quantity: existing.quantity + parsed.data.quantity })
      .where(eq(cartItemsTable.id, existing.id))
      .returning();
  } else {
    [cartItem] = await db.insert(cartItemsTable)
      .values({
        userId: req.user!.id,
        productId: parsed.data.productId,
        variantId: parsed.data.variantId || null,
        quantity: parsed.data.quantity,
      })
      .returning();
  }

  res.status(201).json(cartItem);
});

// PUT /cart/:id
router.put("/cart/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateCartItemRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(cartItemsTable)
    .set({ quantity: parsed.data.quantity })
    .where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, req.user!.id)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Item not found" }); return; }

  res.json(updated);
});

// DELETE /cart/:id
router.delete("/cart/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [deleted] = await db.delete(cartItemsTable)
    .where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, req.user!.id)))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Item not found" }); return; }

  res.json({ message: "Item removed" });
});

export default router;
