"use client";

import { useEffect } from "react";

/**
 * Loads Meta / Google / TikTok tags after idle so first-party JS and LCP stay prioritized.
 * Inline chunks from `/api/ads/script` are mounted as real `<script>` nodes (not innerHTML).
 */
export function DeferredAds() {
  useEffect(() => {
    const injectHtmlFragment = (html: string) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      doc.querySelectorAll("script").forEach((old) => {
        const s = document.createElement("script");
        if (old.src) {
          s.src = old.src;
          s.async = true;
        } else {
          s.textContent = old.textContent;
        }
        document.body.appendChild(s);
      });
    };

    const load = () => {
      fetch("/api/ads/script", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((data: { scripts?: string[] }) => {
          for (const html of data.scripts ?? []) {
            if (typeof html === "string" && html.trim()) injectHtmlFragment(html);
          }
        })
        .catch(() => {});
    };

    let idle: number | ReturnType<typeof setTimeout>;
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idle = window.requestIdleCallback(load, { timeout: 5000 });
    } else {
      idle = setTimeout(load, 2800);
    }

    return () => {
      if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idle as number);
      } else {
        clearTimeout(idle as ReturnType<typeof setTimeout>);
      }
    };
  }, []);

  return null;
}
