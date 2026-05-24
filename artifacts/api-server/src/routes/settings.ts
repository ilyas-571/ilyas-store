import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const rows = await db.select().from(settingsTable);
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(settingsTable).values({ storeId: 1 }).returning();
  return created;
}

function formatSettings(s: typeof settingsTable.$inferSelect) {
  return { 
    id: s.id, 
    storeName: s.storeName, 
    logoUrl: s.logoUrl ?? null, 
    faviconUrl: s.faviconUrl ?? null,
    codEnabled: s.codEnabled, 
    defaultCurrency: s.defaultCurrency, 
    currencies: s.currencies,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    contactAddress: s.contactAddress,
    facebookUrl: s.facebookUrl,
    instagramUrl: s.instagramUrl,
    shippingSettings: s.shippingSettings,
    taxSettings: s.taxSettings,
    emailNotifications: s.emailNotifications,
    updatedAt: s.updatedAt 
  };
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(formatSettings(settings));
});

router.put("/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const settings = await getOrCreateSettings();
  const updateData: Record<string, unknown> = {};
  if (parsed.data.storeName != null) updateData.storeName = parsed.data.storeName;
  if ("logoUrl" in parsed.data) updateData.logoUrl = parsed.data.logoUrl;
  if (parsed.data.codEnabled != null) updateData.codEnabled = parsed.data.codEnabled;
  if (parsed.data.defaultCurrency != null) updateData.defaultCurrency = parsed.data.defaultCurrency;
  if (parsed.data.currencies != null) updateData.currencies = parsed.data.currencies;
  if ("contactEmail" in parsed.data) updateData.contactEmail = parsed.data.contactEmail;
  if ("contactPhone" in parsed.data) updateData.contactPhone = parsed.data.contactPhone;
  if ("contactAddress" in parsed.data) updateData.contactAddress = parsed.data.contactAddress;
  if ("facebookUrl" in parsed.data) updateData.facebookUrl = parsed.data.facebookUrl;
  if ("instagramUrl" in parsed.data) updateData.instagramUrl = parsed.data.instagramUrl;
  if ("faviconUrl" in req.body) updateData.faviconUrl = req.body.faviconUrl ?? null;
  if ("shippingSettings" in req.body) updateData.shippingSettings = req.body.shippingSettings;
  if ("taxSettings" in req.body) updateData.taxSettings = req.body.taxSettings;
  if ("emailNotifications" in req.body) updateData.emailNotifications = req.body.emailNotifications;

  const [updated] = await db.update(settingsTable).set(updateData).where(eq(settingsTable.id, settings.id)).returning();
  res.json(updated);
});

export default router;
