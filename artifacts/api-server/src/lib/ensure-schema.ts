import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

const ddlStatements = [
  "ALTER TABLE users ALTER COLUMN role TYPE text",
  "ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'",
  "ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id integer",
  "ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text NOT NULL DEFAULT ''",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) NOT NULL DEFAULT 0",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS fragrance_types text[] NOT NULL DEFAULT '{}'::text[]",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS variations jsonb NOT NULL DEFAULT '[]'::jsonb",
  "ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id integer",
  "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod'",
  "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending'",
  "ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number text",
  "ALTER TABLE settings ADD COLUMN IF NOT EXISTS favicon_url text",
  "ALTER TABLE settings ADD COLUMN IF NOT EXISTS shipping_settings jsonb NOT NULL DEFAULT '{\"enabled\":true,\"flatRate\":250,\"freeShippingThreshold\":5000}'::jsonb",
  "ALTER TABLE settings ADD COLUMN IF NOT EXISTS tax_settings jsonb NOT NULL DEFAULT '{\"enabled\":true,\"taxPercent\":15,\"includedInPrice\":false}'::jsonb",
  "ALTER TABLE settings ADD COLUMN IF NOT EXISTS email_notifications jsonb NOT NULL DEFAULT '{\"newOrder\":true,\"orderStatusChanged\":true,\"lowStockAlert\":true}'::jsonb",
];

/** Module-level flag to avoid running DDL on every serverless invocation */
let _schemaEnsured = false;

export async function ensureSchemaUpToDate() {
  if (_schemaEnsured) return;

  for (const statement of ddlStatements) {
    try {
      await db.execute(sql.raw(statement));
    } catch (error) {
      logger.warn({ error, statement }, "Schema ensure step failed");
    }
  }

  _schemaEnsured = true;
  logger.info("Schema migration check completed");
}
