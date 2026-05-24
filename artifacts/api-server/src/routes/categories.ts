import { Router, type IRouter } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db
    .select()
    .from(categoriesTable)
    .orderBy(categoriesTable.sortOrder, categoriesTable.name);
  const result = await Promise.all(
    categories.map(async (cat) => {
      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(productsTable)
        .where(eq(productsTable.categoryId, cat.id));
      return {
        id: cat.id,
        name: cat.name,
        image: cat.image,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        productCount: countRow?.count ?? 0,
        createdAt: cat.createdAt,
      };
    })
  );
  res.json(result);
});

router.post(
  "/categories",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = CreateCategoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [cat] = await db
      .insert(categoriesTable)
      .values({
        storeId: 1,
        name: parsed.data.name,
        image: parsed.data.image ?? null,
        parentId: Number.isInteger(req.body?.parentId)
          ? req.body.parentId
          : null,
        sortOrder: Number.isInteger(req.body?.sortOrder)
          ? req.body.sortOrder
          : 0,
      })
      .returning();
    res.status(201).json({
      id: cat.id,
      name: cat.name,
      image: cat.image,
      parentId: cat.parentId,
      sortOrder: cat.sortOrder,
      productCount: 0,
      createdAt: cat.createdAt,
    });
  }
);

router.put(
  "/categories/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = UpdateCategoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name != null) updateData.name = parsed.data.name;
    if (parsed.data.image !== undefined) updateData.image = parsed.data.image;
    if (req.body?.parentId !== undefined)
      updateData.parentId = Number.isInteger(req.body.parentId)
        ? req.body.parentId
        : null;
    if (req.body?.sortOrder !== undefined)
      updateData.sortOrder = Number(req.body.sortOrder) || 0;

    const [cat] = await db
      .update(categoriesTable)
      .set(updateData)
      .where(eq(categoriesTable.id, id))
      .returning();
    if (!cat) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(eq(productsTable.categoryId, cat.id));
    res.json({
      id: cat.id,
      name: cat.name,
      image: cat.image,
      parentId: cat.parentId,
      sortOrder: cat.sortOrder,
      productCount: countRow?.count ?? 0,
      createdAt: cat.createdAt,
    });
  }
);

router.put(
  "/categories/sort",
  requireAdmin,
  async (req, res): Promise<void> => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    for (const item of items) {
      if (!Number.isInteger(item?.id)) continue;
      await db
        .update(categoriesTable)
        .set({ sortOrder: Number(item?.sortOrder) || 0 })
        .where(eq(categoriesTable.id, item.id));
    }
    res.json({ message: "Category sort updated" });
  }
);

router.delete(
  "/categories/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [cat] = await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .returning();
    if (!cat) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    res.json({ message: "Category deleted" });
  }
);

export default router;
