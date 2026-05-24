import { defineConfig } from "drizzle-kit";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from workspace root .env
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?(.*?)["']?\s*$/);
    if (match) {
      process.env.DATABASE_URL = match[1];
    }
  }
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});

