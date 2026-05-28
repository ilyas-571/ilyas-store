const esbuild = require("esbuild");
const pinoPlugin = require("esbuild-plugin-pino");

esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  sourcemap: true,
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  external: [
    "bcrypt",
    "compression",
    "cookie-parser",
    "cors",
    "drizzle-orm",
    "express",
    "express-rate-limit",
    "jsonwebtoken",
    "pino",
    "pino-http",
    "pg",
    "zod",
    "drizzle-zod",
    "cheerio",
    "multer",
    "nodemailer",
  ],
  plugins: [pinoPlugin({ transports: ["pino-pretty"] })],
}).catch(() => process.exit(1));
