import { useEffect, useRef, useState } from "react";

// Cache generated HLS poster data-URLs per source, so re-mounts are instant.
const cache = new Map<string, string>();
// Track in-flight generations so multiple tiles for the same URL share work.
const inflight = new Map<string, Promise<string | null>>();

async function generatePoster(url: string): Promise<string | null> {
  const existing = cache.get(url);
  if (existing) return existing;
  const running = inflight.get(url);
  if (running) return running;

  const task = (async () => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    // Off-DOM element; some browsers still need it attached to decode.
    video.style.position = "fixed";
    video.style.left = "-9999px";
    video.style.width = "2px";
    video.style.height = "2px";
    document.body.appendChild(video);

    let hlsInstance: { destroy: () => void } | null = null;

    const cleanup = () => {
      try {
        hlsInstance?.destroy();
      } catch {
        /* noop */
      }
      video.removeAttribute("src");
      try {
        video.load();
      } catch {
        /* noop */
      }
      video.remove();
    };

    try {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else {
        const { default: Hls } = await import("hls.js");
        if (!Hls.isSupported()) {
          cleanup();
          return null;
        }
        const instance = new Hls({ maxBufferLength: 4, capLevelToPlayerSize: true });
        instance.loadSource(url);
        instance.attachMedia(video);
        hlsInstance = instance;
      }

      const dataUrl = await new Promise<string | null>((resolve) => {
        let done = false;
        const finish = (value: string | null) => {
          if (done) return;
          done = true;
          resolve(value);
        };
        const timeout = window.setTimeout(() => finish(null), 12000);

        const onSeeked = () => {
          try {
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (!w || !h) {
              window.clearTimeout(timeout);
              finish(null);
              return;
            }
            const maxW = 600;
            const scale = Math.min(1, maxW / w);
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("no 2d ctx");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const out = canvas.toDataURL("image/jpeg", 0.75);
            window.clearTimeout(timeout);
            finish(out);
          } catch {
            window.clearTimeout(timeout);
            finish(null);
          }
        };

        const onLoaded = () => {
          const t = Math.min(0.2, Math.max(0.05, (video.duration || 1) * 0.05));
          try {
            video.currentTime = t;
          } catch {
            finish(null);
          }
        };

        video.addEventListener("seeked", onSeeked, { once: true });
        video.addEventListener("loadeddata", onLoaded, { once: true });
        video.addEventListener("error", () => finish(null), { once: true });
      });

      cleanup();
      if (dataUrl) cache.set(url, dataUrl);
      return dataUrl;
    } catch {
      cleanup();
      return null;
    }
  })();

  inflight.set(url, task);
  try {
    return await task;
  } finally {
    inflight.delete(url);
  }
}

export function HlsThumb({ url, caption }: { url: string; caption: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(() => cache.get(url) ?? null);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (dataUrl || failed) return;
    const node = ref.current;
    if (!node) return;

    let cancelled = false;
    let io: IntersectionObserver | null = null;

    const start = () => {
      generatePoster(url).then((result) => {
        if (cancelled) return;
        if (result) setDataUrl(result);
        else setFailed(true);
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              io?.disconnect();
              start();
              break;
            }
          }
        },
        { rootMargin: "400px 0px" },
      );
      io.observe(node);
    }

    return () => {
      cancelled = true;
      io?.disconnect();
    };
  }, [url, dataUrl, failed]);

  if (dataUrl) {
    return (
      <img
        ref={(el) => {
          ref.current = el as unknown as HTMLDivElement;
        }}
        src={dataUrl}
        alt={caption}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover bg-muted"
      />
    );
  }

  return (
    <div
      ref={ref}
      aria-label={caption}
      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground ${
        failed ? "" : "animate-pulse"
      }`}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}
