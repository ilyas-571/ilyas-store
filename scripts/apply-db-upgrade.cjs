const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const queries = [
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

  for (const query of queries) {
    await client.query(query);
  }

  await client.end();
  console.log("Database schema upgrade applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
