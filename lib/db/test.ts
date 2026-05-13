import { db } from "./src/index.js";
import { sql } from "drizzle-orm";

async function check() {
  try {
    const res = await db.execute(sql`SELECT * FROM settings`);
    console.log("Success:", res.rows);
  } catch (err) {
    console.error("DB Error:", err);
  }
  process.exit(0);
}

check();
