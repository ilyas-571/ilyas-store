import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  const allProducts = await db.select().from(productsTable);
  for (const p of allProducts) {
    if (p.price === "NaN") {
      console.log(`Fixing product ${p.id} which has price NaN`);
      await db.update(productsTable).set({ price: "0" }).where(eq(productsTable.id, p.id));
    }
  }
  console.log("Done");
  process.exit(0);
}

main().catch(console.error);
