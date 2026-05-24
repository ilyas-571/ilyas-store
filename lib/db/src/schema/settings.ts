import { pgTable, text, serial, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id), // Added for multi-tenancy
  storeName: text("store_name").notNull().default("Ilyas Store"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  codEnabled: boolean("cod_enabled").notNull().default(true),
  defaultCurrency: text("default_currency").notNull().default("PKR"),
  currencies: jsonb("currencies").notNull().$type<Array<{
    code: string;
    symbol: string;
    rate: number;
    isEnabled: boolean;
    isDefault: boolean;
  }>>().default([
    { code: "PKR", symbol: "₨", rate: 1, isEnabled: true, isDefault: true },
    { code: "USD", symbol: "$", rate: 0.0036, isEnabled: true, isDefault: false },
    { code: "AED", symbol: "د.إ", rate: 0.013, isEnabled: true, isDefault: false },
  ]),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactAddress: text("contact_address"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  shippingSettings: jsonb("shipping_settings").notNull().$type<{
    enabled: boolean;
    flatRate: number;
    freeShippingThreshold: number;
  }>().default({ enabled: true, flatRate: 250, freeShippingThreshold: 5000 }),
  taxSettings: jsonb("tax_settings").notNull().$type<{
    enabled: boolean;
    taxPercent: number;
    includedInPrice: boolean;
  }>().default({ enabled: true, taxPercent: 15, includedInPrice: false }),
  emailNotifications: jsonb("email_notifications").notNull().$type<{
    newOrder: boolean;
    orderStatusChanged: boolean;
    lowStockAlert: boolean;
  }>().default({ newOrder: true, orderStatusChanged: true, lowStockAlert: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
