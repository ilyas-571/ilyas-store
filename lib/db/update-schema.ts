import { db } from "./src/index.js";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS contact_email text;`);
  await db.execute(sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS contact_phone text;`);
  await db.execute(sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS contact_address text;`);
  await db.execute(sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS facebook_url text;`);
  await db.execute(sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS instagram_url text;`);
  console.log("Settings table updated successfully");
  process.exit(0);
}

main().catch(console.error);
