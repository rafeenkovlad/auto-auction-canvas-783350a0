import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FileRef, InspectionElement } from "@/lib/report.api";
import type { Status, StatusMeta } from "@/lib/report.utils";

export type ViewerElement = InspectionElement & {
  _status: Status;
  _category: string;
  _displayName: string;
};

interface Props {
  elements: ViewerElement[];
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
  statusMeta: (s: Status) => StatusMeta;
}


export function ElementViewer({
  elements,
  index,
  onClose,
  onChange,
  statusMeta,
}: Props) {
  const open = index != null && elements[index] != null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index! > 0) onChange(index! - 1);
      else if (e.key === "ArrowRight" && index! < elements.length - 1)
        onChange(index! + 1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, index, elements.length, onChange, onClose]);

  if (!open || typeof document === "undefined") return null;

  const el = elements[index!];
  const m = statusMeta(el._status);
  const canPrev = index! > 0;
  const canNext = index! < elements.length - 1;

  const hasDetails =
    el.paintworkThicknessFrom != null ||
    el.paintworkThicknessTo != null ||
    el.seriousDamageTags.length > 0 ||
    el.noSeriousDamageTags.length > 0 ||
    (el.audioNotes && el.audioNotes.length > 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black text-white animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Media fills the whole viewport */}
      <MediaStage
        key={el.id}
        file={el.file}
      />

      {/* Minimal top bar: counter left, close right */}
      <div className="absolute top-0 inset-x-0 h-12 flex items-center justify-between px-3 pointer-events-none z-10">
        <div className="mono text-xs text-white/70 tabular-nums px-2 py-1 rounded bg-black/40 backdrop-blur pointer-events-auto">
          {index! + 1} / {elements.length}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur flex items-center justify-center pointer-events-auto"
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>

      {/* Side nav (desktop only, subtle) */}
      {canPrev && (
        <button
          type="button"
          onClick={() => onChange(index! - 1)}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur items-center justify-center z-10"
          aria-label="Предыдущий"
        >
          ‹
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => onChange(index! + 1)}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur items-center justify-center z-10"
          aria-label="Следующий"
        >
          ›
        </button>
      )}

      {/* Bottom info panel: compact, contains all useful data */}
      <InfoPanel el={el} m={m} hasDetails={hasDetails} />

      {/* Mobile swipe nav buttons in info panel header — handled via tap targets below */}
      <MobileNav
        canPrev={canPrev}
        canNext={canNext}
        onPrev={() => onChange(index! - 1)}
        onNext={() => onChange(index! + 1)}
      />
    </div>,
    document.body,
  );
}

function MobileNav({
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="md:hidden absolute top-1/2 -translate-y-1/2 inset-x-0 flex justify-between px-2 pointer-events-none z-[5]">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className="h-10 w-10 rounded-full bg-black/30 disabled:opacity-0 backdrop-blur flex items-center justify-center pointer-events-auto"
        aria-label="Предыдущий"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="h-10 w-10 rounded-full bg-black/30 disabled:opacity-0 backdrop-blur flex items-center justify-center pointer-events-auto"
        aria-label="Следующий"
      >
        ›
      </button>
    </div>
  );
}

function InfoPanel({
  el,
  m,
  hasDetails,
}: {
  el: ViewerElement;
  m: StatusMeta;
  hasDetails: boolean;
}) {
  const tags = [
    ...el.seriousDamageTags.map((t) => ({ ...t, severe: true })),
    ...el.noSeriousDamageTags.map((t) => ({ ...t, severe: false })),
  ];
  const hasAudio = el.audioNotes && el.audioNotes.length > 0;
  void hasDetails;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10">
      <div className="bg-gradient-to-t from-black via-black/85 to-transparent pt-8">
        <div className="px-4 pb-[max(env(safe-area-inset-bottom),12px)] max-w-3xl mx-auto">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{ background: m.bg, color: m.fg }}
            >
              <span>{m.icon}</span>
              {m.label}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/50 truncate">
              {el._category}
            </span>
          </div>
          <h2 className="text-base md:text-lg font-semibold leading-tight truncate">
            {el._displayName}
          </h2>

          {/* Compact inline meta */}
          {(el.paintworkThicknessFrom != null ||
            el.paintworkThicknessTo != null) && (
            <div className="mt-1.5 text-xs text-white/70">
              ЛКП:{" "}
              <span className="mono text-white">
                {el.paintworkThicknessFrom ?? "—"}–
                {el.paintworkThicknessTo ?? "—"} мкм
              </span>
            </div>
          )}

          {/* Tags — always visible, minimal chips */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-block px-2 py-0.5 rounded-full text-[11px] border"
                  style={{
                    borderColor: t.severe
                      ? "var(--grade-bad)"
                      : "var(--grade-warn)",
                    color: t.severe ? "var(--grade-bad)" : "var(--grade-warn)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}

          {hasAudio && (
            <div className="mt-2 space-y-1.5">
              {el.audioNotes!.map((a) => (
                <audio
                  key={a.id}
                  src={a.url}
                  controls
                  preload="metadata"
                  className="w-full h-8"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Media stage ===== */
function MediaStage({ file }: { file: FileRef | null | undefined }) {
  if (!file?.url) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
        Медиа отсутствует
      </div>
    );
  }
  const t = (file.type || "").toLowerCase();
  const url = file.url;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const isPdf = t.includes("pdf") || ext === "pdf";
  const isHls = ext === "m3u8" || url.includes(".m3u8");
  const isVideo = t.includes("video") || isHls || ext === "mp4" || ext === "webm" || ext === "mov";
  const isAudio = t.includes("audio") || ext === "mp3" || ext === "wav" || ext === "m4a" || ext === "ogg";

  if (isPdf) {
    return (
      <div className="absolute inset-0 flex flex-col">
        <iframe
          src={url}
          title={file.filename}
          className="flex-1 w-full bg-white"
        />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-20 right-3 z-10 mono text-[11px] text-white/90 bg-black/50 hover:bg-black/70 backdrop-blur rounded-full px-3 py-1"
        >
          Открыть PDF ↗
        </a>
      </div>
    );
  }
  if (isVideo) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <VideoPlayer src={url} hls={isHls} />
      </div>
    );
  }
  if (isAudio) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <audio src={url} controls className="w-full max-w-md" />
      </div>
    );
  }
  return <ZoomImage src={url} alt={file.filename} />;
}

function VideoPlayer({ src, hls }: { src: string; hls: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    // Native HLS (Safari/iOS)
    if (!hls || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      tryPlay();
      return;
    }

    let destroyed = false;
    let hlsInstance: { destroy: () => void } | null = null;

    import("hls.js").then(({ default: Hls }) => {
      if (destroyed) return;
      if (Hls.isSupported()) {
        const instance = new Hls({ enableWorker: true });
        instance.loadSource(src);
        instance.attachMedia(video);
        hlsInstance = instance;
        tryPlay();
      } else {
        video.src = src;
        tryPlay();
      }
    });

    return () => {
      destroyed = true;
      hlsInstance?.destroy();
    };
  }, [src, hls]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      playsInline
      className="max-w-full max-h-full"
    />
  );
}

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null,
  );
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setScale((s) => {
      const next = Math.min(8, Math.max(1, s * factor));
      if (next === 1) {
        setTx(0);
        setTy(0);
      }
      return next;
    });
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
  };

  const onDoubleClick = () => {
    if (scale > 1) reset();
    else setScale(2.5);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setTx(dragRef.current.tx + (e.clientX - dragRef.current.x));
    setTy(dragRef.current.ty + (e.clientY - dragRef.current.y));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), scale };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      const next = Math.min(
        8,
        Math.max(1, (pinchRef.current.scale * d) / pinchRef.current.dist),
      );
      setScale(next);
      if (next === 1) {
        setTx(0);
        setTy(0);
      }
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
  };

  useEffect(() => {
    reset();
  }, [src, reset]);

  const zoomed = scale > 1.01;

  return (
    <div
      className="absolute inset-0 overflow-hidden touch-none select-none"
      onWheel={onWheel}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          maxWidth: "100%",
          maxHeight: "100%",
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: dragRef.current ? "none" : "transform 120ms ease-out",
          cursor: scale > 1 ? (dragRef.current ? "grabbing" : "grab") : "zoom-in",
          willChange: "transform",
        }}
      />

      {/* Zoom indicator: only shown when actually zoomed */}
      {zoomed && (
        <button
          type="button"
          onClick={reset}
          className="absolute top-3 left-1/2 -translate-x-1/2 mono text-[11px] text-white/80 tabular-nums bg-black/50 hover:bg-black/70 backdrop-blur rounded-full px-3 py-1 z-10"
          title="Сбросить масштаб"
        >
          {Math.round(scale * 100)}% · сброс
        </button>
      )}
    </div>
  );
}
