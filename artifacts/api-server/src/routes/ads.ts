import { Router, type IRouter } from "express";
import { db, adsTrackingTable, campaignsTable, productsTable } from "@workspace/db";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

// ─── Helpers ────────────────────────────────────────────────────
async function getOrCreateTracking() {
  const rows = await db.select().from(adsTrackingTable);
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(adsTrackingTable).values({}).returning();
  return created;
}

function formatTracking(t: typeof adsTrackingTable.$inferSelect) {
  return {
    id: t.id,
    facebookPixelId: t.facebookPixelId,
    googleAdsConversionId: t.googleAdsConversionId,
    tiktokPixelId: t.tiktokPixelId,
    facebookEnabled: t.facebookEnabled,
    googleEnabled: t.googleEnabled,
    tiktokEnabled: t.tiktokEnabled,
    metaConnected: t.metaConnected,
    googleConnected: t.googleConnected,
    tiktokConnected: t.tiktokConnected,
    adsCurrency: t.adsCurrency,
    targetRegions: t.targetRegions,
    productFeedEnabled: t.productFeedEnabled,
    productFeedLastSync: t.productFeedLastSync,
    updatedAt: t.updatedAt,
  };
}

// ─── Tracking Settings ──────────────────────────────────────────
router.get("/ads/tracking", requireAdmin, async (_req, res): Promise<void> => {
  const tracking = await getOrCreateTracking();
  res.json(formatTracking(tracking));
});

router.put("/ads/tracking", requireAdmin, async (req, res): Promise<void> => {
  const tracking = await getOrCreateTracking();
  const updateData: Record<string, unknown> = {};

  if ("facebookPixelId" in req.body) updateData.facebookPixelId = req.body.facebookPixelId || null;
  if ("googleAdsConversionId" in req.body) updateData.googleAdsConversionId = req.body.googleAdsConversionId || null;
  if ("tiktokPixelId" in req.body) updateData.tiktokPixelId = req.body.tiktokPixelId || null;
  if ("facebookEnabled" in req.body) updateData.facebookEnabled = !!req.body.facebookEnabled;
  if ("googleEnabled" in req.body) updateData.googleEnabled = !!req.body.googleEnabled;
  if ("tiktokEnabled" in req.body) updateData.tiktokEnabled = !!req.body.tiktokEnabled;
  if ("adsCurrency" in req.body) updateData.adsCurrency = req.body.adsCurrency;
  if ("targetRegions" in req.body) updateData.targetRegions = req.body.targetRegions;
  if ("productFeedEnabled" in req.body) updateData.productFeedEnabled = !!req.body.productFeedEnabled;

  const [updated] = await db.update(adsTrackingTable).set(updateData).where(eq(adsTrackingTable.id, tracking.id)).returning();
  res.json(formatTracking(updated));
});

// ─── Integration Connect/Disconnect ─────────────────────────────
router.post("/ads/connect/:platform", requireAdmin, async (req, res): Promise<void> => {
  const platform = req.params.platform as string;
  const { accessToken } = req.body;

  if (!accessToken || typeof accessToken !== "string") {
    res.status(400).json({ error: "Access token is required" });
    return;
  }

  const tracking = await getOrCreateTracking();
  const updateData: Record<string, unknown> = {};

  switch (platform) {
    case "meta":
      updateData.metaAccessToken = accessToken;
      updateData.metaConnected = true;
      break;
    case "google":
      updateData.googleAccessToken = accessToken;
      updateData.googleConnected = true;
      break;
    case "tiktok":
      updateData.tiktokAccessToken = accessToken;
      updateData.tiktokConnected = true;
      break;
    default:
      res.status(400).json({ error: "Invalid platform. Use: meta, google, tiktok" });
      return;
  }

  const [updated] = await db.update(adsTrackingTable).set(updateData).where(eq(adsTrackingTable.id, tracking.id)).returning();
  res.json({ connected: true, platform, updatedAt: updated.updatedAt });
});

router.post("/ads/disconnect/:platform", requireAdmin, async (req, res): Promise<void> => {
  const platform = req.params.platform as string;
  const tracking = await getOrCreateTracking();
  const updateData: Record<string, unknown> = {};

  switch (platform) {
    case "meta":
      updateData.metaAccessToken = null;
      updateData.metaConnected = false;
      break;
    case "google":
      updateData.googleAccessToken = null;
      updateData.googleConnected = false;
      break;
    case "tiktok":
      updateData.tiktokAccessToken = null;
      updateData.tiktokConnected = false;
      break;
    default:
      res.status(400).json({ error: "Invalid platform" });
      return;
  }

  await db.update(adsTrackingTable).set(updateData).where(eq(adsTrackingTable.id, tracking.id));
  res.json({ connected: false, platform });
});

// ─── Tracking Script (Public — injected by frontend) ────────────
router.get("/ads/script", async (_req, res): Promise<void> => {
  const rows = await db.select().from(adsTrackingTable);
  if (rows.length === 0) { res.json({ scripts: [] }); return; }
  const t = rows[0];
  const scripts: string[] = [];

  if (t.facebookEnabled && t.facebookPixelId) {
    scripts.push(`<!-- Facebook Pixel -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${t.facebookPixelId}');fbq('track','PageView');
</script>`);
  }

  if (t.googleEnabled && t.googleAdsConversionId) {
    scripts.push(`<!-- Google Ads -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${t.googleAdsConversionId}"></script>
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${t.googleAdsConversionId}');
</script>`);
  }

  if (t.tiktokEnabled && t.tiktokPixelId) {
    scripts.push(`<!-- TikTok Pixel -->
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=
["page","track","identify","instances","debug","on","off","once","ready","alias",
"group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function()
{t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;
i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],
n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n)
{var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];
ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e+\"_\"+n]=1;var o=document.createElement("script");
o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];
a.parentNode.insertBefore(o,a)};
ttq.load('${t.tiktokPixelId}');ttq.page();
}(window,document,'ttq');
</script>`);
  }

  res.json({ scripts });
});

// ─── Product Feed (Google Merchant Center XML) ──────────────────
router.get("/ads/product-feed", async (req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt));
  const host = `${req.protocol}://${req.get("host")}`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Ilyas Store Product Feed</title>
<link>${host}</link>
<description>Product feed for Google Merchant Center and ads platforms</description>
`;

  for (const p of products) {
    const price = parseFloat(p.basePrice ?? "0") || 0;
    const imageUrl = p.images?.[0] ? (p.images[0].startsWith("http") ? p.images[0] : `${host}${p.images[0]}`) : "";
    xml += `<item>
  <g:id>${p.id}</g:id>
  <g:title><![CDATA[${p.name}]]></g:title>
  <g:description><![CDATA[${p.description ?? p.name}]]></g:description>
  <g:link>${host}/products/${p.id}</g:link>
  <g:image_link>${imageUrl}</g:image_link>
  <g:price>${price.toFixed(2)} PKR</g:price>
  <g:availability>${p.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
  <g:condition>new</g:condition>
  <g:brand>Ilyas Store</g:brand>
</item>
`;
  }

  xml += `</channel>
</rss>`;

  // Update last sync timestamp
  const rows = await db.select().from(adsTrackingTable);
  if (rows.length > 0) {
    await db.update(adsTrackingTable).set({ productFeedLastSync: new Date() }).where(eq(adsTrackingTable.id, rows[0].id));
  }

  res.send(xml);
});

// ─── Ads Analytics (Aggregated) ─────────────────────────────────
router.get("/ads/analytics", requireAdmin, async (_req, res): Promise<void> => {
  const campaigns = await db.select().from(campaignsTable);

  const totals = {
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalSpend: 0,
    totalRevenue: 0,
    activeCampaigns: 0,
    roas: 0,
    ctr: 0,
  };

  for (const c of campaigns) {
    totals.totalImpressions += c.impressions;
    totals.totalClicks += c.clicks;
    totals.totalConversions += c.conversions;
    totals.totalSpend += parseFloat(c.spend) || 0;
    totals.totalRevenue += parseFloat(c.revenue) || 0;
    if (c.status === "active") totals.activeCampaigns++;
  }

  totals.roas = totals.totalSpend > 0 ? Math.round((totals.totalRevenue / totals.totalSpend) * 100) / 100 : 0;
  totals.ctr = totals.totalImpressions > 0 ? Math.round((totals.totalClicks / totals.totalImpressions) * 10000) / 100 : 0;

  // Top performing products across all campaigns
  const allProductIds = campaigns.flatMap(c => c.productIds ?? []);
  const uniqueIds = [...new Set(allProductIds)];
  let topProducts: any[] = [];

  if (uniqueIds.length > 0) {
    const products = await db.select().from(productsTable).where(inArray(productsTable.id, uniqueIds.slice(0, 10)));
    topProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      image: p.images?.[0] ?? null,
      campaigns: campaigns.filter(c => c.productIds.includes(p.id)).length,
    }));
  }

  res.json({ ...totals, topProducts });
});

// ─── Campaigns CRUD ─────────────────────────────────────────────
router.get("/ads/campaigns", requireAdmin, async (_req, res): Promise<void> => {
  const campaigns = await db.select().from(campaignsTable).orderBy(desc(campaignsTable.createdAt));
  const formatted = campaigns.map(c => ({
    id: c.id,
    name: c.name,
    platform: c.platform,
    status: c.status,
    budget: parseFloat(c.budget) || 0,
    currency: c.currency,
    startDate: c.startDate,
    endDate: c.endDate,
    productIds: c.productIds,
    impressions: c.impressions,
    clicks: c.clicks,
    conversions: c.conversions,
    spend: parseFloat(c.spend) || 0,
    revenue: parseFloat(c.revenue) || 0,
    createdAt: c.createdAt,
  }));
  res.json(formatted);
});

router.post("/ads/campaigns", requireAdmin, async (req, res): Promise<void> => {
  const { name, platform, budget, currency, startDate, endDate, productIds } = req.body;

  if (!name || !platform) {
    res.status(400).json({ error: "Name and platform are required" });
    return;
  }

  const [campaign] = await db.insert(campaignsTable).values({
    name,
    platform,
    budget: String(budget || 0),
    currency: currency || "PKR",
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    productIds: Array.isArray(productIds) ? productIds : [],
  }).returning();

  res.status(201).json({
    id: campaign.id,
    name: campaign.name,
    platform: campaign.platform,
    status: campaign.status,
    budget: parseFloat(campaign.budget) || 0,
    currency: campaign.currency,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    productIds: campaign.productIds,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    conversions: campaign.conversions,
    spend: parseFloat(campaign.spend) || 0,
    revenue: parseFloat(campaign.revenue) || 0,
    createdAt: campaign.createdAt,
  });
});

router.put("/ads/campaigns/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const updateData: Record<string, unknown> = {};
  if (req.body.name != null) updateData.name = req.body.name;
  if (req.body.platform != null) updateData.platform = req.body.platform;
  if (req.body.status != null) updateData.status = req.body.status;
  if (req.body.budget != null) updateData.budget = String(req.body.budget);
  if (req.body.currency != null) updateData.currency = req.body.currency;
  if (req.body.startDate !== undefined) updateData.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
  if (req.body.endDate !== undefined) updateData.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
  if (req.body.productIds != null) updateData.productIds = req.body.productIds;

  const [campaign] = await db.update(campaignsTable).set(updateData).where(eq(campaignsTable.id, id)).returning();
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  res.json({
    id: campaign.id,
    name: campaign.name,
    platform: campaign.platform,
    status: campaign.status,
    budget: parseFloat(campaign.budget) || 0,
    currency: campaign.currency,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    productIds: campaign.productIds,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    conversions: campaign.conversions,
    spend: parseFloat(campaign.spend) || 0,
    revenue: parseFloat(campaign.revenue) || 0,
    createdAt: campaign.createdAt,
  });
});

router.delete("/ads/campaigns/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [campaign] = await db.delete(campaignsTable).where(eq(campaignsTable.id, id)).returning();
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

  res.json({ message: "Campaign deleted" });
});

export default router;
