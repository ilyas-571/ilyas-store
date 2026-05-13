import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT || "3000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-runtime-error-modal").then((m) =>
            m.default(),
          ),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    cssMinify: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Path-based splitting avoids empty `vendor` chunks (Rollup may merge
        // string-array `manualChunks` entries into the main chunk).
        manualChunks(id) {
          const n = id.split("\\").join("/");
          if (!n.includes("/node_modules/")) {
            return undefined;
          }
          if (
            n.includes("/node_modules/react/") ||
            n.includes("/node_modules/react-dom/")
          ) {
            return "vendor";
          }
          if (n.includes("/node_modules/wouter")) {
            return "router";
          }
          if (n.includes("/node_modules/@tanstack/react-query")) {
            return "query";
          }
          const uiPrefixes = [
            "/node_modules/@radix-ui/react-dialog/",
            "/node_modules/@radix-ui/react-dropdown-menu/",
            "/node_modules/@radix-ui/react-tooltip/",
            "/node_modules/@radix-ui/react-select/",
            "/node_modules/@radix-ui/react-toast/",
          ];
          if (uiPrefixes.some((p) => n.includes(p))) {
            return "ui";
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
