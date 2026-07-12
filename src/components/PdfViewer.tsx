import { useEffect, useRef, useState } from "react";

// Full PDF viewer used inside the lightbox. Uses pdfjs-dist directly so it
// works even when the backend serves the file with `Content-Disposition:
// attachment` or `X-Frame-Options: deny` (both break plain <iframe>).

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      return mod;
    });
  }
  return pdfjsPromise;
}

export function PdfViewer({ url, filename }: { url: string; filename: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";
    let cancelled = false;
    let cleanupDoc: (() => void) | null = null;

    (async () => {
      try {
        setState("loading");
        const pdfjs = await loadPdfjs();
        if (cancelled) return;
        const task = pdfjs.getDocument({ url, withCredentials: false });
        const doc = await task.promise;
        if (cancelled) {
          doc.cleanup();
          return;
        }
        setPageCount(doc.numPages);
        cleanupDoc = () => doc.cleanup();

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const containerWidth = Math.min(container.clientWidth || 800, 1100);

        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) break;
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = (containerWidth - 24) / base.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width * dpr);
          canvas.height = Math.ceil(viewport.height * dpr);
          canvas.style.width = `${Math.ceil(viewport.width)}px`;
          canvas.style.height = `${Math.ceil(viewport.height)}px`;
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 12px";
          canvas.style.background = "white";
          canvas.style.boxShadow = "0 2px 12px rgba(0,0,0,0.25)";
          canvas.style.borderRadius = "4px";
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          ctx.scale(dpr, dpr);
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          if (cancelled) break;
          container.appendChild(canvas);
        }

        if (!cancelled) setState("ready");
      } catch (e) {
        console.error("PDF render failed", e);
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
      cleanupDoc?.();
    };
  }, [url]);

  return (
    <div className="absolute inset-0 flex flex-col bg-neutral-800">
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-black/50 text-white text-xs">
        <span className="truncate">
          {filename}
          {pageCount > 0 && (
            <span className="ml-2 mono text-white/60">· {pageCount} стр.</span>
          )}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mono text-[11px] bg-white/15 hover:bg-white/25 rounded-full px-3 py-1 shrink-0"
        >
          Открыть в новой вкладке ↗
        </a>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-auto px-3 py-4"
        style={{ scrollbarGutter: "stable" }}
      />
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/80 text-sm">
          Загрузка PDF…
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80 text-sm px-6 text-center">
          <div>Не удалось отобразить PDF.</div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mono text-[11px] bg-white/15 hover:bg-white/25 rounded-full px-3 py-1"
          >
            Открыть в новой вкладке ↗
          </a>
        </div>
      )}
    </div>
  );
}
