import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FileRef, InspectionElement } from "@/lib/report.functions";

export type ViewerElement = InspectionElement & {
  _status: "ok" | "minor" | "major";
  _category: string;
  _displayName: string;
};

type StatusMeta = { icon: string; label: string; bg: string; fg: string };

interface Props {
  elements: ViewerElement[];
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
  statusMeta: (s: ViewerElement["_status"]) => StatusMeta;
}

export function ElementViewer({
  elements,
  index,
  onClose,
  onChange,
  statusMeta,
}: Props) {
  const open = index != null && elements[index] != null;

  // keyboard nav
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 md:px-5 h-14 border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => canPrev && onChange(index! - 1)}
          disabled={!canPrev}
          className="h-9 w-9 rounded-md border border-white/15 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Предыдущий"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => canNext && onChange(index! + 1)}
          disabled={!canNext}
          className="h-9 w-9 rounded-md border border-white/15 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Следующий"
        >
          ›
        </button>
        <div className="text-xs text-white/60 mono tabular-nums">
          {index! + 1} / {elements.length}
        </div>
        <div className="min-w-0 flex-1 ml-2">
          <div className="text-[10px] uppercase tracking-wider text-white/50 truncate">
            {el._category}
          </div>
          <div className="text-sm font-semibold truncate">{el._displayName}</div>
        </div>
        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
          style={{ background: m.bg, color: m.fg }}
        >
          <span>{m.icon}</span>
          {m.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 rounded-md border border-white/15 hover:bg-white/10 flex items-center justify-center"
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>

      {/* Body: media + details */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <div className="flex-1 min-h-0 relative bg-black flex items-center justify-center">
          <MediaStage
            key={el.id}
            file={el.file}
            onPrev={canPrev ? () => onChange(index! - 1) : undefined}
            onNext={canNext ? () => onChange(index! + 1) : undefined}
          />
        </div>

        <aside className="md:w-[340px] md:border-l border-white/10 border-t md:border-t-0 overflow-y-auto bg-zinc-950 p-4 space-y-4 text-sm shrink-0 max-h-[45vh] md:max-h-none">
          <span
            className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{ background: m.bg, color: m.fg }}
          >
            <span>{m.icon}</span>
            {m.label}
          </span>

          {(el.paintworkThicknessFrom != null ||
            el.paintworkThicknessTo != null) && (
            <Block label="Толщина ЛКП">
              <span className="mono text-base font-semibold">
                {el.paintworkThicknessFrom ?? "—"}–
                {el.paintworkThicknessTo ?? "—"} мкм
              </span>
            </Block>
          )}

          {(el.seriousDamageTags.length > 0 ||
            el.noSeriousDamageTags.length > 0) && (
            <Block label="Повреждения">
              <ul className="space-y-1.5">
                {el.seriousDamageTags.map((t) => (
                  <li
                    key={t.id}
                    className="px-2.5 py-1.5 rounded text-xs border-l-[3px] bg-white/5"
                    style={{ borderLeftColor: "var(--grade-bad)" }}
                  >
                    {t.name}
                  </li>
                ))}
                {el.noSeriousDamageTags.map((t) => (
                  <li
                    key={t.id}
                    className="px-2.5 py-1.5 rounded text-xs border-l-[3px] bg-white/5"
                    style={{ borderLeftColor: "var(--grade-warn)" }}
                  >
                    {t.name}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {el.note && (
            <Block label="Примечание">
              <p className="text-xs leading-relaxed whitespace-pre-line text-white/80">
                {el.note}
              </p>
            </Block>
          )}

          {el.audioNotes && el.audioNotes.length > 0 && (
            <Block label="Аудио-заметки">
              <div className="space-y-2">
                {el.audioNotes.map((a) => (
                  <audio
                    key={a.id}
                    src={a.url}
                    controls
                    preload="metadata"
                    className="w-full h-9"
                  />
                ))}
              </div>
            </Block>
          )}
        </aside>
      </div>
    </div>,
    document.body,
  );
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

/* ===== Media stage: zoom + pan for images, native player for video/audio ===== */
function MediaStage({
  file,
  onPrev,
  onNext,
}: {
  file: FileRef | null | undefined;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  if (!file?.url) {
    return (
      <div className="text-white/40 text-sm flex flex-col items-center gap-2">
        <span className="text-3xl">∅</span>
        Медиа отсутствует
      </div>
    );
  }
  const t = (file.type || "").toLowerCase();
  if (t.includes("video")) {
    return (
      <video
        src={file.url}
        controls
        playsInline
        className="max-w-full max-h-full"
      />
    );
  }
  if (t.includes("audio")) {
    return (
      <div className="w-full max-w-md px-6">
        <audio src={file.url} controls className="w-full" />
        <div className="mt-2 text-xs text-white/50 text-center truncate">
          {file.filename}
        </div>
      </div>
    );
  }
  return <ZoomImage src={file.url} alt={file.filename} onPrev={onPrev} onNext={onNext} />;
}

function ZoomImage({
  src,
  alt,
  onPrev,
  onNext,
}: {
  src: string;
  alt: string;
  onPrev?: () => void;
  onNext?: () => void;
}) {
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

  // Pinch-to-zoom (touch)
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

  // Reset on src change
  useEffect(() => {
    reset();
  }, [src, reset]);

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

      {/* Side nav (desktop) */}
      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/50 hover:bg-black/70 border border-white/15 items-center justify-center text-xl"
          aria-label="Предыдущий"
        >
          ‹
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/50 hover:bg-black/70 border border-white/15 items-center justify-center text-xl"
          aria-label="Следующий"
        >
          ›
        </button>
      )}

      {/* Zoom toolbar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 border border-white/15 rounded-full px-1 py-1 backdrop-blur">
        <ZoomBtn label="−" onClick={() => zoomBy(1 / 1.4)} />
        <span className="mono text-xs text-white/70 w-12 text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <ZoomBtn label="+" onClick={() => zoomBy(1.4)} />
        <ZoomBtn label="↺" onClick={reset} title="Сбросить" />
      </div>
    </div>
  );
}

function ZoomBtn({
  label,
  onClick,
  title,
}: {
  label: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-sm"
    >
      {label}
    </button>
  );
}
