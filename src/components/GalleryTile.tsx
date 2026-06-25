import type { GalleryItem } from "@/components/MediaGallery";
import { isImageFile } from "@/lib/report.utils";
import { SECTION_LABELS, STEP_LABELS } from "@/lib/report.constants";
import { thumbSrcSet, thumbUrl } from "@/lib/image";

/**
 * Thumbnail body used inside `MediaGallery` and `AdditionalMaterials`.
 *
 * Performance notes:
 *  - Backend currently returns only the original full-resolution URL
 *    (often 3000+ px wide). Until an image CDN / resize endpoint is
 *    available we still download the original, but we mark the <img>
 *    so the browser can:
 *      * defer it (`loading="lazy"`, `fetchpriority="low"`)
 *      * decode off the main thread (`decoding="async"`)
 *      * skip layout/paint while offscreen (`content-visibility: auto`)
 *  - Video tiles no longer mount an HLS player just to show a poster:
 *    a single <video preload="metadata"> for native MP4 still grabs a
 *    frame, and HLS tiles render a neutral placeholder with a play icon.
 *    The full HLS player is only created inside the lightbox on click.
 */
export function GalleryTileBody({ item }: { item: GalleryItem }) {
  const file = item.file;
  const url = file.url;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const isHls = ext === "m3u8" || url.includes(".m3u8");
  // Video flag wins: backend sometimes labels HLS files as `image/*`,
  // which would otherwise route the .m3u8 URL through the image proxy
  // and trigger an ERR_BLOCKED_BY_ORB on the tile.
  const isImage = !item.isVideo && !isHls && isImageFile(file);
  return (
    <>
      <div
        className="relative aspect-[4/3] bg-muted overflow-hidden shrink-0"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "300px 225px",
        }}
      >
        {isImage ? (
          <img
            src={thumbUrl(url, 400) ?? url}
            srcSet={thumbSrcSet(url, 400) ?? undefined}
            alt={item.caption}
            loading="lazy"
            decoding="async"
            // @ts-expect-error fetchpriority is valid HTML but not yet in React's typings on older versions
            fetchpriority="low"
            width={400}
            height={300}
            sizes="(min-width: 1280px) 220px, (min-width: 640px) 33vw, 50vw"
            className="w-full h-full object-cover"
          />
        ) : item.isVideo ? (
          <>
            <VideoThumb url={url} isHls={isHls} caption={item.caption} />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 10 10" fill="white">
                  <path d="M2 1l7 4-7 4z" />
                </svg>
              </span>
            </span>
            <span className="absolute bottom-1.5 right-1.5 mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/55 text-white">
              {isHls ? "HLS" : "Видео"}
            </span>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M4 14l4-4 4 4 4-4 4 4" />
            </svg>
          </div>
        )}
        {item.damageTags && item.damageTags.length > 0 ? (
          <div className="absolute top-1.5 left-1.5 right-1.5 flex flex-wrap gap-1 max-h-[calc(100%-12px)] overflow-hidden">
            {item.damageTags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 max-w-full truncate px-1.5 py-0.5 rounded-md text-[10px] font-medium border backdrop-blur-sm"
                style={{
                  background: t.severe
                    ? "color-mix(in oklab, var(--grade-bad) 18%, white)"
                    : "color-mix(in oklab, var(--grade-warn) 22%, white)",
                  borderColor: t.severe ? "var(--grade-bad)" : "var(--grade-warn)",
                  color: "var(--foreground)",
                }}
                title={t.name}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: t.severe ? "var(--grade-bad)" : "var(--grade-warn)" }}
                  aria-hidden
                />
                <span className="truncate">{t.name}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="px-2 py-1.5 border-t border-border bg-card space-y-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {item.status ? (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background:
                  item.status === "serious"
                    ? "var(--grade-bad)"
                    : item.status === "minor"
                      ? "var(--grade-warn)"
                      : "var(--grade-good)",
              }}
              aria-hidden
            />
          ) : null}
          <div className="text-xs font-medium ink truncate">{item.caption}</div>
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {SECTION_LABELS[item.sectionKey] ?? STEP_LABELS[item.sectionKey] ?? item.sectionKey}
        </div>
        {(item.paintworkFrom != null || item.paintworkTo != null) && (
          <div className="mono text-[10px] text-muted-foreground tabular-nums">
            ЛКП {item.paintworkFrom ?? "—"}–{item.paintworkTo ?? "—"} мкм
          </div>
        )}
        {item.damageTags && item.damageTags.length > 0 && (
          <div className="flex gap-x-1.5 overflow-hidden whitespace-nowrap">
            {item.damageTags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground min-w-0"
                title={t.name}
              >
                <span
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{
                    background: t.severe ? "var(--grade-bad)" : "var(--grade-warn)",
                  }}
                />
                <span className="truncate">{t.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function VideoThumb({ url, isHls, caption }: { url: string; isHls: boolean; caption: string }) {
  // HLS thumbnails are the most expensive thing on this page — each one
  // would otherwise spin up hls.js and fetch the manifest + first segment
  // just to show a poster. Render a neutral placeholder instead and let
  // the lightbox handle real playback.
  if (isHls) {
    return (
      <div
        aria-label={caption}
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      </div>
    );
  }
  // Native MP4/WebM: a metadata preload is cheap and gives a real poster.
  return (
    <video
      src={url.includes("#") ? url : `${url}#t=0.1`}
      muted
      playsInline
      preload="metadata"
      disableRemotePlayback
      aria-label={caption}
      className="w-full h-full object-cover bg-muted"
    />
  );
}
