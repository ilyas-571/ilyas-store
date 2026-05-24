import { pgTable, text, serial, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";
import { productVariantsTable } from "./product_variants";
import { storesTable } from "./stores";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id), // Added for multi-tenancy
  userId: integer("user_id").notNull().references(() => usersTable.id),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("PKR"),
  paymentMethod: text("payment_method", { enum: ["cod", "stripe", "paypal"] }).notNull().default("cod"),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed", "refunded"] }).notNull().default("pending"),
  status: text("status", { enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"] }).notNull().default("pending"),
  invoiceNumber: text("invoice_number"),
  address: jsonb("address").notNull().$type<{
    name: string;
    phone: string;
    street: string;
    city: string;
    country: string;
  }>(),
  couponCode: text("coupon_code"),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  variantId: integer("variant_id").references(() => productVariantsTable.id),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  variantValueSnapshot: text("variant_value_snapshot"), // e.g. "Size: M, Color: Black"
  priceSnapshot: numeric("price_snapshot", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;
