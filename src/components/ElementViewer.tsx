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
  const [expanded, setExpanded] = useState(false);

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
          <div className="flex items-end gap-3">
            <h2 className="text-base md:text-lg font-semibold leading-tight truncate flex-1">
              {el._displayName}
            </h2>
            {hasDetails && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-white/60 hover:text-white shrink-0"
              >
                {expanded ? "Скрыть" : "Подробнее"}
              </button>
            )}
          </div>

          {/* Compact inline meta (always visible) */}
          {(el.paintworkThicknessFrom != null ||
            el.paintworkThicknessTo != null ||
            el.seriousDamageTags.length + el.noSeriousDamageTags.length > 0) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-white/70">
              {(el.paintworkThicknessFrom != null ||
                el.paintworkThicknessTo != null) && (
                <span>
                  ЛКП:{" "}
                  <span className="mono text-white">
                    {el.paintworkThicknessFrom ?? "—"}–
                    {el.paintworkThicknessTo ?? "—"} мкм
                  </span>
                </span>
              )}
              {el.seriousDamageTags.length + el.noSeriousDamageTags.length >
                0 && (
                <span>
                  Повреждений:{" "}
                  <span className="mono text-white">
                    {el.seriousDamageTags.length +
                      el.noSeriousDamageTags.length}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Expanded details */}
          {expanded && hasDetails && (
            <div className="mt-3 space-y-3 max-h-[40vh] overflow-y-auto text-sm">
              {(el.seriousDamageTags.length > 0 ||
                el.noSeriousDamageTags.length > 0) && (
                <ul className="space-y-1">
                  {el.seriousDamageTags.map((t) => (
                    <li
                      key={t.id}
                      className="px-2 py-1 rounded text-xs border-l-[3px] bg-white/5"
                      style={{ borderLeftColor: "var(--grade-bad)" }}
                    >
                      {t.name}
                    </li>
                  ))}
                  {el.noSeriousDamageTags.map((t) => (
                    <li
                      key={t.id}
                      className="px-2 py-1 rounded text-xs border-l-[3px] bg-white/5"
                      style={{ borderLeftColor: "var(--grade-warn)" }}
                    >
                      {t.name}
                    </li>
                  ))}
                </ul>
              )}
              {el.audioNotes && el.audioNotes.length > 0 && (
                <div className="space-y-2">
                  {el.audioNotes.map((a) => (
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
  if (t.includes("video")) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          src={file.url}
          controls
          playsInline
          className="max-w-full max-h-full"
        />
      </div>
    );
  }
  if (t.includes("audio")) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <audio src={file.url} controls className="w-full max-w-md" />
      </div>
    );
  }
  return <ZoomImage src={file.url} alt={file.filename} />;
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
