import esbuild from "esbuild";
import pinoPlugin from "esbuild-plugin-pino";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: "dist/index.mjs",
  sourcemap: true,
  external: [
    "bcrypt",
    "compression",
    "cookie-parser",
    "cors",
    "drizzle-orm",
    "express",
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
});
