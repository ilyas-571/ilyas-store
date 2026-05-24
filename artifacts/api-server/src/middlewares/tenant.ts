import { Request, Response, NextFunction } from "express";
import { db, storesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

export interface TenantRequest extends Request {
  storeId?: number;
  storeSlug?: string;
}

/**
 * TenantMiddleware resolves the store based on the 'x-store-slug' header 
 * or the request hostname.
 */
export function tenantMiddleware(req: TenantRequest, res: Response, next: NextFunction): void {
  // 1. Try to get store slug from header (useful for API calls)
  const storeSlug = req.headers["x-store-slug"] as string || req.hostname?.split('.')[0];

  if (!storeSlug || storeSlug === "localhost" || storeSlug === "www") {
    // If no store is identified, we might be on the main landing page or a global route
    next();
    return;
  }

  async function resolveStore() {
    try {
      const [store] = await db.select().from(storesTable).where(eq(storesTable.slug, storeSlug));
      
      if (!store) {
        logger.warn({ storeSlug }, "Store not found for given slug");
        res.status(404).json({ error: "Store not found" });
        return;
      }

      if (!store.isActive) {
        res.status(403).json({ error: "This store is currently inactive" });
        return;
      }

      req.storeId = store.id;
      req.storeSlug = store.slug;
      next();
    } catch (err) {
      logger.error({ err }, "Error resolving tenant store");
      res.status(500).json({ error: "Internal server error resolving store" });
    }
  }

  void resolveStore();
}
