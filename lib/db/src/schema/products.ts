import { pgTable, text, serial, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";
import { storesTable } from "./stores";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id), // Added for multi-tenancy
  name: text("name").notNull(),
  slug: text("slug").notNull().default(""),
  sku: text("sku").notNull().default(""),
  brand: text("brand").notNull().default(""),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }), // Nullable as requested
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }), // Optional
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }), // Optional
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  description: text("description"),
  images: text("images").array().notNull().default([]),
  stock: integer("stock").notNull().default(0),
  tags: text("tags").array().notNull().default([]),
  isFeatured: boolean("is_featured").notNull().default(false),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  subcategoryId: integer("subcategory_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
