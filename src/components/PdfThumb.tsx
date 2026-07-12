import { useEffect, useRef, useState } from "react";

// Lightweight PDF first-page thumbnail. Uses pdfjs-dist with a CDN-hosted
// worker and renders lazily via IntersectionObserver so tiles offscreen
// never pay the cost.

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      // Use the worker bundled with the same version to avoid version mismatch.
      // Vite handles ?url import; falls back to CDN if unavailable.
      try {
        const workerUrl = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        mod.GlobalWorkerOptions.workerSrc = workerUrl;
      } catch {
        mod.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${mod.version}/build/pdf.worker.min.mjs`;
      }
      return mod;
    });
  }
  return pdfjsPromise;
}

// Cache rendered thumbnails per URL so switching tabs / re-mounting is instant.
const cache = new Map<string, string>();

export function PdfThumb({
  url,
  className,
  alt,
  width = 400,
  height = 300,
}: {
  url: string;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(() => cache.get(url) ?? null);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (dataUrl || failed) return;
    const node = ref.current;
    if (!node) return;

    let cancelled = false;
    let io: IntersectionObserver | null = null;

    const start = async () => {
      try {
        const pdfjs = await loadPdfjs();
        if (cancelled) return;
        const task = pdfjs.getDocument({ url, disableAutoFetch: true, disableStream: true });
        const doc = await task.promise;
        const page = await doc.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
          (width * 2) / baseViewport.width,
          (height * 2) / baseViewport.height,
        );
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d ctx");
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const out = canvas.toDataURL("image/jpeg", 0.85);
        cache.set(url, out);
        if (!cancelled) setDataUrl(out);
        doc.cleanup();
      } catch (e) {
        if (!cancelled) setFailed(true);
      }
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
  }, [url, dataUrl, failed, width, height]);

  if (failed) {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className ?? ""}`}
        aria-label={alt}
      >
        <PdfBadge />
      </div>
    );
  }

  if (dataUrl) {
    return (
      <div ref={ref} className={`relative ${className ?? ""}`}>
        <img
          src={dataUrl}
          alt={alt ?? "PDF preview"}
          className="w-full h-full object-cover object-top"
          loading="lazy"
          decoding="async"
        />
        <span className="absolute bottom-1.5 left-1.5 mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/70 text-white">
          PDF
        </span>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`flex items-center justify-center bg-muted/60 animate-pulse ${className ?? ""}`}
      aria-label={alt}
    >
      <PdfBadge muted />
    </div>
  );
}

function PdfBadge({ muted }: { muted?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${muted ? "opacity-40" : ""}`}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
      <span className="text-[10px] font-semibold tracking-wider">PDF</span>
    </div>
  );
}
