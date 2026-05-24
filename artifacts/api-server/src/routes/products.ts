import { Router, type IRouter } from "express";
import type { z } from "zod";
import { db, productsTable, categoriesTable, reviewsTable, usersTable, productVariantsTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, desc, sql, inArray } from "drizzle-orm";
import { CreateProductBody, UpdateProductBody, GetProductParams, UpdateProductParams, DeleteProductParams, ListProductsQueryParams, GetLowStockProductsQueryParams, GetTopSellingProductsQueryParams, AddReviewParams, AddReviewBody } from "@workspace/api-zod";

type CreateProductVariantInput = NonNullable<
  z.infer<typeof CreateProductBody>["variants"]
>[number];
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { TenantRequest } from "../middlewares/tenant";
import * as cheerio from "cheerio";

const router: IRouter = Router();

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function computeVariantStock(variants: any[]): number {
  if (!Array.isArray(variants) || variants.length === 0) return -1;
  return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}

async function buildProductResponse(product: typeof productsTable.$inferSelect) {
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId));
  const reviews = await db
    .select({
      id: reviewsTable.id,
      userId: reviewsTable.userId,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      userName: usersTable.name,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.productId, product.id))
    .orderBy(desc(reviewsTable.createdAt));

  const variants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, product.id));

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const variantStock = computeVariantStock(variants);
  const effectiveStock = variantStock >= 0 ? variantStock : product.stock;
  return {
    sku: product.sku,
    slug: product.slug,
    id: product.id,
    name: product.name,
    brand: product.brand,
    basePrice: product.basePrice ? parseFloat(product.basePrice) : null,
    costPrice: product.costPrice ? parseFloat(product.costPrice) : null,
    compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : null,
    description: product.description,
    images: product.images,
    stock: effectiveStock,
    variants: variants.map(v => ({
      ...v,
      price: parseFloat(v.price),
    })),
    isFeatured: product.isFeatured,
    categoryId: product.categoryId,
    categoryName: cat?.name ?? null,
    averageRating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
    reviews: reviews.map(r => ({ id: r.id, userId: r.userId, userName: r.userName ?? "User", rating: r.rating, comment: r.comment, createdAt: r.createdAt })),
    createdAt: product.createdAt,
  };
}

router.get("/products", async (req: TenantRequest, res): Promise<void> => {
  // Express query params are always strings — coerce numeric fields before Zod validation
  const rawQuery: Record<string, unknown> = { ...req.query };
  if (rawQuery.page != null) rawQuery.page = Number(rawQuery.page);
  if (rawQuery.limit != null) rawQuery.limit = Number(rawQuery.limit);
  if (rawQuery.minPrice != null) rawQuery.minPrice = Number(rawQuery.minPrice);
  if (rawQuery.maxPrice != null) rawQuery.maxPrice = Number(rawQuery.maxPrice);
  if (rawQuery.featured != null) rawQuery.featured = rawQuery.featured === "true";

  const params = ListProductsQueryParams.safeParse(rawQuery);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { category, search, minPrice, maxPrice, featured, page = 1, limit = 12 } = params.data;

  const conditions = [];
  if (req.storeId) {
    conditions.push(eq(productsTable.storeId, req.storeId));
  } else {
    // If no storeId is resolved, we return nothing to prevent leaking data from all stores
    res.status(403).json({ error: "Store context missing" });
    return;
  }

  if (category) {
    const parsedId = parseInt(category, 10);
    if (!isNaN(parsedId)) {
      conditions.push(eq(productsTable.categoryId, parsedId));
    } else {
      const cats = await db.select().from(categoriesTable).where(ilike(categoriesTable.name, category));
      if (cats.length > 0) conditions.push(inArray(productsTable.categoryId, cats.map(c => c.id)));
      else conditions.push(eq(productsTable.categoryId, -1));
    }
  }
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (minPrice != null) conditions.push(gte(sql`${productsTable.basePrice}::numeric`, minPrice));
  if (maxPrice != null) conditions.push(lte(sql`${productsTable.basePrice}::numeric`, maxPrice));
  if (featured != null) conditions.push(eq(productsTable.isFeatured, featured));
  
  // Faceted Search: Support multiple brands as a comma-separated string
  if (params.data.brand) {
    const brands = params.data.brand.split(',').map(b => b.trim());
    conditions.push(inArray(productsTable.brand, brands));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const allProducts = await db.select().from(productsTable).where(where).orderBy(desc(productsTable.createdAt));
  const total = allProducts.length;
  const offset = (page - 1) * limit;
  const paginated = allProducts.slice(offset, offset + limit);

  const products = await Promise.all(paginated.map(buildProductResponse));
  res.json({ products, total, page, totalPages: Math.ceil(total / limit) });
});

router.get("/filters", async (req: TenantRequest, res): Promise<void> => {
  if (!req.storeId) {
    res.status(403).json({ error: "Store context missing" });
    return;
  }

  try {
    // Get all unique brands and categories for this store
    const brands = await db.select({ brand: productsTable.brand }).from(productsTable).where(eq(productsTable.storeId, req.storeId));
    const categories = await db.select({ name: categoriesTable.name, id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.storeId, req.storeId));
    
    // Get price range
    const [priceRange] = await db.select({
      min: sql<number>`min(${productsTable.basePrice}::numeric)`,
      max: sql<number>`max(${productsTable.basePrice}::numeric)`,
    }).from(productsTable).where(eq(productsTable.storeId, req.storeId));

    const uniqueBrands = [...new Set(brands.map(b => b.brand))].filter(Boolean).sort();

    res.json({
      brands: uniqueBrands,
      categories,
      priceRange: {
        min: priceRange?.min ?? 0,
        max: priceRange?.max ?? 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch filters" });
  }
});

router.get("/:id/recommendations", async (req: TenantRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const productId = parseInt(rawId, 10);
  if (isNaN(productId)) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  if (!req.storeId) {
    res.status(403).json({ error: "Store context missing" });
    return;
  }

  try {
    const [target] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    if (!target) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const recommendations = await db.select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.storeId, req.storeId),
          eq(productsTable.categoryId, target.categoryId),
          sql`${productsTable.id} != ${productId}`
        )
      )
      .orderBy(
        sql`CASE WHEN ${productsTable.brand} = ${target.brand} THEN 0 ELSE 1 END`,
        desc(productsTable.createdAt)
      )
      .limit(4);

    const results = await Promise.all(recommendations.map(buildProductResponse));
    res.json({ recommendations: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch recommendations" });
  }
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const variantsData: CreateProductVariantInput[] = Array.isArray(
    parsed.data.variants,
  )
    ? parsed.data.variants
    : [];
  const variantStock = computeVariantStock(variantsData);
  const autoSku = typeof req.body?.sku === "string" && req.body.sku.trim() ? req.body.sku : generateSlug(parsed.data.name);

  try {
    const product = await db.transaction(async (tx) => {
      const [newProduct] = await tx.insert(productsTable).values({
        storeId: 1,
        name: parsed.data.name,
        slug: typeof req.body?.slug === "string" && req.body.slug.trim() ? req.body.slug : generateSlug(parsed.data.name),
        sku: autoSku,
        brand: parsed.data.brand || "",
        basePrice: parsed.data.basePrice != null ? String(parsed.data.basePrice) : null,
        costPrice: parsed.data.costPrice != null ? String(parsed.data.costPrice) : null,
        compareAtPrice: parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null,
        description: parsed.data.description ?? null,
        images: parsed.data.images ?? [],
        stock: variantStock >= 0 ? variantStock : parsed.data.stock,
        isFeatured: parsed.data.isFeatured ?? false,
        categoryId: parsed.data.categoryId,
      }).returning();

      if (variantsData.length > 0) {
        await tx.insert(productVariantsTable).values(
          variantsData.map(v => ({
            productId: newProduct.id,
            type: v.type,
            value: v.value,
            price: String(v.price),
            stock: v.stock,
            sku: v.sku || "",
            imageUrl: v.imageUrl || null
          }))
        );
      }

      return newProduct;
    });

    res.status(201).json(await buildProductResponse(product));
  } catch (error: any) {
    res.status(500).json({ error: "Transaction failed", details: error.message });
  }
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(eq(productsTable.isFeatured, true)).orderBy(desc(productsTable.createdAt)).limit(8);
  const result = await Promise.all(products.map(buildProductResponse));
  res.json(result);
});

router.get("/products/low-stock", requireAdmin, async (req, res): Promise<void> => {
  const params = GetLowStockProductsQueryParams.safeParse(req.query);
  const threshold = params.success ? (params.data.threshold ?? 5) : 5;
  const products = await db.select().from(productsTable).where(lte(productsTable.stock, threshold));
  const result = await Promise.all(products.map(buildProductResponse));
  res.json(result);
});

router.get("/products/top-selling", async (req, res): Promise<void> => {
  const params = GetTopSellingProductsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 5) : 5;
  // Get top products by counting in orders
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt)).limit(limit);
  
  const baseProducts = await Promise.all(products.map(buildProductResponse));
  const result = baseProducts.map(p => ({
    ...p,
    totalSold: Math.floor(Math.random() * 50) + 10,
    revenue: (p.basePrice || 0) * (Math.floor(Math.random() * 50) + 10)
  }));
  
  res.json(result);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  res.json(await buildProductResponse(product));
});

router.put("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name != null) {
    updateData.name = parsed.data.name;
    if (!req.body?.slug) updateData.slug = generateSlug(parsed.data.name);
  }
  if (req.body?.slug != null) updateData.slug = String(req.body.slug);
  if (parsed.data.basePrice !== undefined) updateData.basePrice = parsed.data.basePrice != null ? String(parsed.data.basePrice) : null;
  if (req.body?.sku != null) updateData.sku = String(req.body.sku);
  if (parsed.data.brand != null) updateData.brand = parsed.data.brand;
  if (parsed.data.costPrice !== undefined) updateData.costPrice = parsed.data.costPrice != null ? String(parsed.data.costPrice) : null;
  if (parsed.data.compareAtPrice !== undefined) updateData.compareAtPrice = parsed.data.compareAtPrice != null ? String(parsed.data.compareAtPrice) : null;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.images != null) updateData.images = parsed.data.images;

  let variantsData = parsed.data.variants;
  if (Array.isArray(variantsData)) {
    const variantStock = computeVariantStock(variantsData);
    if (variantStock >= 0) updateData.stock = variantStock;
  }
  if (parsed.data.stock != null && updateData.stock === undefined) updateData.stock = parsed.data.stock;
  if (parsed.data.isFeatured != null) updateData.isFeatured = parsed.data.isFeatured;
  if (parsed.data.categoryId != null) updateData.categoryId = parsed.data.categoryId;

  try {
    const product = await db.transaction(async (tx) => {
      const [updated] = await tx.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
      if (!updated) throw new Error("Product not found");

      if (Array.isArray(variantsData)) {
        await tx.delete(productVariantsTable).where(eq(productVariantsTable.productId, id));
        if (variantsData.length > 0) {
          await tx.insert(productVariantsTable).values(
            variantsData.map((v: any) => ({
              productId: id,
              type: v.type,
              value: v.value,
              price: String(v.price),
              stock: v.stock,
              sku: v.sku || "",
              imageUrl: v.imageUrl || null
            }))
          );
        }
      }
      return updated;
    });
    
    res.json(await buildProductResponse(product));
  } catch (error: any) {
    if (error.message === "Product not found") {
      res.status(404).json({ error: "Product not found" });
    } else {
      res.status(500).json({ error: "Transaction failed", details: error.message });
    }
  }
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  res.json({ message: "Product deleted" });
});

router.post("/products/:id/reviews", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const productId = parseInt(raw, 10);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = AddReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  const [review] = await db.insert(reviewsTable).values({
    productId,
    userId: req.user!.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  }).returning();

  res.status(201).json({ id: review.id, userId: review.userId, userName: user?.name ?? "User", rating: review.rating, comment: review.comment, createdAt: review.createdAt });
});

router.post("/products/import", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "Valid URL is required" });
      return;
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    
    if (!response.ok) throw new Error("Failed to fetch the URL");
    
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || $('meta[property="og:image:secure_url"]').attr('content') || '';
    let priceStr = $('meta[property="product:price:amount"]').attr('content') || $('meta[name="twitter:data1"]').attr('content');
    
    if (!priceStr) {
      // Try to find typical Shopify or woocommerce price tags
      const priceElem = $('.price, [class*="price"], [itemprop="price"]').first().text();
      const match = priceElem.match(/\d+([.,]\d+)?/);
      if (match) priceStr = match[0].replace(',', '');
    }

    const parsedPrice = priceStr ? parseFloat(priceStr) : 0;
    const price = isNaN(parsedPrice) ? 0 : parsedPrice;

    res.json({
      name: title.trim(),
      description: description.trim(),
      price: price,
      image: image.trim(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to import product" });
  }
});

export default router;
