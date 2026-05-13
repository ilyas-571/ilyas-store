/**
 * Origin for server-side fetches to the Express API (rewrites only apply to browser).
 */
export function getInternalApiOrigin(): string {
  return (
    process.env.INTERNAL_API_URL ??
    process.env.API_ORIGIN ??
    ""
  ).replace(/\/$/, "");
}

export async function fetchApiJson<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } },
): Promise<T> {
  const base = getInternalApiOrigin();
  const url = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;

  // Create AbortController with 5-second timeout for SSR
  // Lighthouse has 30-second timeout, so 5s for each API call is reasonable
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...init?.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`fetch ${path} failed: ${res.status}`);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}
