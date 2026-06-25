/**
 * Temporary image thumbnailing via wsrv.nl (free, well-cached image proxy).
 *
 * Backend currently returns only original full-resolution photos
 * (often 3000+ px wide) for inspection media. Until the API provides
 * `thumbUrl` / `posterUrl` variants, we route thumbnails through wsrv
 * so the browser actually downloads ~400 px webp instead of the master.
 *
 * Lightbox/full-screen viewers must keep using the original URL.
 */

const PROXY = "https://wsrv.nl/";

// Hosts we are willing to proxy. wsrv refuses arbitrary upstreams anyway,
// but we keep an explicit allowlist to avoid sending unrelated URLs.
const PROXY_HOSTS = ["s3.regru.cloud"];

function shouldProxy(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return PROXY_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** Build a single proxied URL at width `w` px (webp, q=80). */
export function thumbUrl(url: string | null | undefined, w: number): string | null {
  if (!url) return null;
  if (!shouldProxy(url)) return url;
  const params = new URLSearchParams({
    url,
    w: String(w),
    output: "webp",
    q: "80",
    we: "", // "without enlargement": never upscale
  });
  return `${PROXY}?${params.toString()}`;
}

/** Build a 1x/2x srcset for a thumbnail. */
export function thumbSrcSet(url: string | null | undefined, w: number): string | null {
  if (!url || !shouldProxy(url)) return null;
  const x1 = thumbUrl(url, w);
  const x2 = thumbUrl(url, w * 2);
  if (!x1 || !x2) return null;
  return `${x1} 1x, ${x2} 2x`;
}
