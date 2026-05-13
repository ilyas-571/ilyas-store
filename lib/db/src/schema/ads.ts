import { pgTable, text, serial, timestamp, boolean, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adsTrackingTable = pgTable("ads_tracking", {
  id: serial("id").primaryKey(),
  // Tracking Pixels
  facebookPixelId: text("facebook_pixel_id"),
  googleAdsConversionId: text("google_ads_conversion_id"),
  tiktokPixelId: text("tiktok_pixel_id"),
  // Enable/disable toggles
  facebookEnabled: boolean("facebook_enabled").notNull().default(false),
  googleEnabled: boolean("google_enabled").notNull().default(false),
  tiktokEnabled: boolean("tiktok_enabled").notNull().default(false),
  // Integration tokens (encrypted/stored securely)
  metaAccessToken: text("meta_access_token"),
  googleAccessToken: text("google_access_token"),
  tiktokAccessToken: text("tiktok_access_token"),
  // Connection status
  metaConnected: boolean("meta_connected").notNull().default(false),
  googleConnected: boolean("google_connected").notNull().default(false),
  tiktokConnected: boolean("tiktok_connected").notNull().default(false),
  // Settings
  adsCurrency: text("ads_currency").notNull().default("PKR"),
  targetRegions: jsonb("target_regions").notNull().$type<string[]>().default(["PK"]),
  // Product feed
  productFeedEnabled: boolean("product_feed_enabled").notNull().default(false),
  productFeedLastSync: timestamp("product_feed_last_sync", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform", { enum: ["meta", "google", "tiktok"] }).notNull(),
  status: text("status", { enum: ["draft", "active", "paused", "ended"] }).notNull().default("draft"),
  budget: numeric("budget", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("PKR"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  productIds: jsonb("product_ids").notNull().$type<number[]>().default([]),
  // Analytics (aggregated)
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  spend: numeric("spend", { precision: 10, scale: 2 }).notNull().default("0"),
  revenue: numeric("revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAdsTrackingSchema = createInsertSchema(adsTrackingTable).omit({ id: true, updatedAt: true });
export type InsertAdsTracking = z.infer<typeof insertAdsTrackingSchema>;
export type AdsTracking = typeof adsTrackingTable.$inferSelect;

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
