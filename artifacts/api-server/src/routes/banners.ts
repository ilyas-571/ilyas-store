import { Router, type IRouter } from "express";
import { db, bannersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { CreateBannerBody, UpdateBannerBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/banners", async (_req, res): Promise<void> => {
  const banners = await db
    .select()
    .from(bannersTable)
    .where(eq(bannersTable.isActive, true))
    .orderBy(asc(bannersTable.sortOrder));
  res.json(
    banners.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      image: b.image,
      link: b.link,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
      createdAt: b.createdAt,
    }))
  );
});

router.post("/banners", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [banner] = await db
    .insert(bannersTable)
    .values({
      title: parsed.data.title,
      subtitle: parsed.data.subtitle ?? null,
      image: parsed.data.image,
      link: parsed.data.link ?? null,
      isActive: parsed.data.isActive ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();

  res.status(201).json({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    image: banner.image,
    link: banner.link,
    isActive: banner.isActive,
    sortOrder: banner.sortOrder,
    createdAt: banner.createdAt,
  });
});

router.put(
  "/banners/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = UpdateBannerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.title != null) updateData.title = parsed.data.title;
    if (parsed.data.subtitle !== undefined)
      updateData.subtitle = parsed.data.subtitle;
    if (parsed.data.image != null) updateData.image = parsed.data.image;
    if (parsed.data.link !== undefined) updateData.link = parsed.data.link;
    if (parsed.data.isActive != null)
      updateData.isActive = parsed.data.isActive;
    if (parsed.data.sortOrder != null)
      updateData.sortOrder = parsed.data.sortOrder;

    const [banner] = await db
      .update(bannersTable)
      .set(updateData)
      .where(eq(bannersTable.id, id))
      .returning();
    if (!banner) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }
    res.json({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      link: banner.link,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
      createdAt: banner.createdAt,
    });
  }
);

router.delete(
  "/banners/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [banner] = await db
      .delete(bannersTable)
      .where(eq(bannersTable.id, id))
      .returning();
    if (!banner) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }
    res.json({ message: "Banner deleted" });
  }
);

export default router;
