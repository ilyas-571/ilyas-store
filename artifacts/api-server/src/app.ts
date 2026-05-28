import express, { type Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { tenantMiddleware } from "./middlewares/tenant";

const app: Express = express();

// Note: Vercel applies gzip/brotli automatically — no compression middleware needed.

/** Security headers middleware */
app.use((req, res, next) => {
  // HSTS - enforce HTTPS in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // CSP - prevent XSS attacks
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:"
  );

  // XFO - prevent clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Disable MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS Protection (for older browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // COOP - cross-origin isolation
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  next();
});

/** Short CDN/browser caching for safe public GET APIs (portable across hosts). */
function apiPublicCacheHeaders(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (req.method !== "GET") {
    next();
    return;
  }
  const p = req.path;
  const cacheable =
    /^\/categories$/.test(p) ||
    /^\/banners$/.test(p) ||
    /^\/settings$/.test(p) ||
    /^\/products\/featured$/.test(p) ||
    /^\/products\/top-selling$/.test(p) ||
    /^\/products$/.test(p) ||
    /^\/products\/\d+$/.test(p);

  if (cacheable) {
    res.setHeader(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=300",
    );
  }
  next();
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// CORS: default to storefront URL if CORS_ORIGIN is not explicitly set
const corsOrigin = process.env.CORS_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || "*";
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Global rate limiting — generous for general browsing (500 req / 15 min)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Too many requests from this IP, please try again later.",
});
app.use(globalLimiter);

// Stricter rate limiting for auth routes (10 req / 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts, please try again later.",
});
app.use("/api/auth", authLimiter);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(tenantMiddleware);

const uploadsDir = path.join(process.cwd(), "uploads");
app.use(
  "/uploads",
  express.static(uploadsDir, {
    maxAge: "7d",
    immutable: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".svg")) {
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  }),
);

app.use("/api", apiPublicCacheHeaders);
app.use("/api", router);

export default app;
