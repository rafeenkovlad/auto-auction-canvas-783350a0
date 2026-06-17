import type { GalleryItem } from "@/components/MediaGallery";
import { isImageFile } from "@/lib/report.utils";
import { SECTION_LABELS, STEP_LABELS } from "@/lib/report.constants";
import { useHlsVideo } from "@/hooks/useHlsVideo";

export function GalleryTileBody({ item }: { item: GalleryItem }) {
  const file = item.file;
  const url = file.url;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const isHls = ext === "m3u8" || url.includes(".m3u8");
  const isImage = isImageFile(file);
  return (
    <>
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {isImage ? (
          <img src={url} alt={item.caption} loading="lazy" className="w-full h-full object-cover" />
        ) : item.isVideo ? (
          <>
            <VideoThumb url={url} isHls={isHls} />
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
        {item.isDamage && (
          <span
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
            style={{ background: "var(--grade-bad)", color: "white" }}
          >
            замечание
          </span>
        )}
      </div>
      <div className="px-2 py-1.5 border-t border-border bg-card">
        <div className="text-xs font-medium ink truncate">{item.caption}</div>
        <div className="text-[10px] text-muted-foreground truncate">
          {SECTION_LABELS[item.sectionKey] ?? STEP_LABELS[item.sectionKey] ?? item.sectionKey}
        </div>
      </div>
    </>
  );
}

function VideoThumb({ url, isHls }: { url: string; isHls: boolean }) {
  const ref = useHlsVideo(url, isHls);
  return (
    <video
      ref={ref}
      muted
      playsInline
      preload="metadata"
      className="w-full h-full object-cover"
    />
  );
}
