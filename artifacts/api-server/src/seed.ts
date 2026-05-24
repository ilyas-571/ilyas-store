import bcrypt from "bcrypt";
import { db, storesTable, settingsTable, usersTable, categoriesTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Check/Insert Store
    let store = await db.query.storesTable.findFirst({
      where: eq(storesTable.id, 1),
    });

    if (!store) {
      console.log("Creating default store...");
      const [newStore] = await db.insert(storesTable).values({
        id: 1,
        name: "Ilyas Store",
        slug: "ilyas-store",
        isActive: true,
      }).returning();
      store = newStore;
      console.log(`Store '${store.name}' created with ID: ${store.id}`);
    } else {
      console.log(`Default store already exists: ${store.name}`);
    }

    // 2. Check/Insert Settings
    let settings = await db.query.settingsTable.findFirst({
      where: eq(settingsTable.storeId, 1),
    });

    if (!settings) {
      console.log("Creating default settings...");
      const [newSettings] = await db.insert(settingsTable).values({
        storeId: 1,
        storeName: "Ilyas Store",
        codEnabled: true,
        defaultCurrency: "PKR",
      }).returning();
      settings = newSettings;
      console.log(`Default settings created for store ID: ${settings.storeId}`);
    } else {
      console.log("Default settings already exist.");
    }

    // 3. Check/Insert Admin User
    let admin = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, "admin@ilyasstore.com"),
    });

    if (!admin) {
      console.log("Creating default admin user...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const [newAdmin] = await db.insert(usersTable).values({
        name: "Admin",
        email: "admin@ilyasstore.com",
        password: hashedPassword,
        role: "super_admin",
        storeId: 1,
      }).returning();
      admin = newAdmin;
      console.log(`Admin user created: ${admin.email} / admin123`);
    } else {
      console.log(`Admin user already exists: ${admin.email}`);
    }

    // 4. Check/Insert Default Category
    let category = await db.query.categoriesTable.findFirst({
      where: eq(categoriesTable.name, "Perfumes"),
    });

    if (!category) {
      console.log("Creating default 'Perfumes' category...");
      const [newCategory] = await db.insert(categoriesTable).values({
        storeId: 1,
        name: "Perfumes",
        sortOrder: 1,
      }).returning();
      category = newCategory;
      console.log(`Category '${category.name}' created.`);
    } else {
      console.log(`Category already exists: ${category.name}`);
    }

    // 5. Check/Insert Default Product
    let product = await db.query.productsTable.findFirst({
      where: eq(productsTable.name, "Signature Royal Perfume"),
    });

    if (!product) {
      console.log("Creating sample product 'Signature Royal Perfume'...");
      const [newProduct] = await db.insert(productsTable).values({
        storeId: 1,
        name: "Signature Royal Perfume",
        slug: "signature-royal-perfume",
        sku: "SRP-001",
        brand: "Ilyas Fragrances",
        basePrice: "4500.00",
        description: "An exquisite, long-lasting luxury signature royal fragrance crafted with rare notes of amber, oud, and fresh citrus.",
        stock: 50,
        isFeatured: true,
        categoryId: category.id,
        images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop&q=60"],
        tags: ["luxury", "royal", "signature"],
      }).returning();
      product = newProduct;
      console.log(`Sample product '${product.name}' created.`);
    } else {
      console.log(`Sample product already exists: ${product.name}`);
    }

    console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  }
}

main();
