import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FileRef, InspectionElement } from "@/lib/report.api";
import type { Status, StatusMeta } from "@/lib/report.utils";
import { thumbUrl } from "@/lib/image";

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
  const swipeRef = useRef<{ x: number; y: number; t: number; touches: number; handled: boolean } | null>(null);
  

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
  void statusMeta;
  const canPrev = index! > 0;
  const canNext = index! < elements.length - 1;

  // Capture-phase swipe detection so we get events before native video controls / image handlers.
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      swipeRef.current = null;
      return;
    }
    swipeRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: Date.now(),
      touches: 1,
      handled: false,
    };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s || s.handled) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - s.x;
    const dy = touch.clientY - s.y;
    const dt = Date.now() - s.t;
    if (dt > 700) return;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    // Vertical swipe (up or down) closes the viewer
    if (ay > 90 && ay > ax * 1.3) {
      onClose();
      return;
    }
    // Horizontal swipe navigates
    if (ax > 50 && ax > ay * 1.2) {
      if (dx < 0 && canNext) onChange(index! + 1);
      else if (dx > 0 && canPrev) onChange(index! - 1);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black text-white animate-in fade-in duration-150 overflow-hidden"
      role="dialog"
      aria-modal="true"
      onTouchStartCapture={onTouchStart}
      onTouchEndCapture={onTouchEnd}
    >
      {/* Media fills the whole viewport */}
      <MediaStage
        key={el.id}
        file={el.file}
      />

      {/* Minimal top bar: counter left, close right */}
      <div className="absolute top-0 inset-x-0 h-12 flex items-center justify-between px-3 pointer-events-none z-20">
        <div className="mono text-xs text-white/80 tabular-nums px-2 py-1 rounded bg-black/50 backdrop-blur pointer-events-auto">
          {index! + 1} / {elements.length}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center pointer-events-auto"
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
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur items-center justify-center z-20"
          aria-label="Предыдущий"
        >
          ‹
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => onChange(index! + 1)}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur items-center justify-center z-20"
          aria-label="Следующий"
        >
          ›
        </button>
      )}

      {/* Audio notes (rare) — kept here because they need a player */}
      {el.audioNotes && el.audioNotes.length > 0 ? (
        <div className="absolute inset-x-0 bottom-0 z-20 p-3 pb-[max(env(safe-area-inset-bottom),12px)] space-y-1.5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto space-y-1.5">
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
        </div>
      ) : null}
    </div>,
    document.body,
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
    <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
      <div className="bg-gradient-to-t from-black/85 via-black/55 to-transparent pt-10 pb-[max(env(safe-area-inset-bottom),10px)]">
        <div className="px-4 max-w-3xl mx-auto pointer-events-auto">
          {/* Meta line: status dot · category */}
          <div className="flex items-center gap-2 text-[11px] text-white/70">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: m.fg }}
              aria-label={m.label}
            />
            <span className="truncate">{el._category}</span>
            <span className="text-white/30">·</span>
            <span className="truncate">{m.label}</span>
          </div>

          {/* Title */}
          <h2 className="mt-0.5 text-sm md:text-base font-medium leading-snug truncate">
            {el._displayName}
          </h2>

          {/* Inline ЛКП */}
          {(el.paintworkThicknessFrom != null ||
            el.paintworkThicknessTo != null) && (
            <div className="mt-1 mono text-[11px] text-white/70 tabular-nums">
              ЛКП {el.paintworkThicknessFrom ?? "—"}–
              {el.paintworkThicknessTo ?? "—"} мкм
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 text-[10px] text-white/80"
                >
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{
                      background: t.severe
                        ? "var(--grade-bad)"
                        : "var(--grade-warn)",
                    }}
                  />
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
      <div className="absolute inset-0 flex items-center justify-center bg-black">
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
  const [buffering, setBuffering] = useState(true);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setBuffering(true);
    setFailed(false);
    setMuted(false);

    // Try to start unmuted (with sound). If the browser blocks autoplay
    // (Chrome/Safari policy: no sound until a user gesture), fall back
    // to a muted autoplay and surface an "unmute" button.
    const tryPlay = () => {
      video.muted = false;
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          video.muted = true;
          setMuted(true);
          video.play().catch(() => {});
        });
      }
    };

    // Spinner driven by readyState rather than just `waiting`/`playing`:
    // some streams fire `waiting` after every fragment append even though
    // playback continues — and `timeupdate` is the most reliable signal
    // that frames are actually rendering.
    const refreshBuffering = () => {
      // HAVE_FUTURE_DATA (3) means the next frame is ready.
      setBuffering(video.readyState < 3 && !video.paused);
    };
    const onPlaying = () => setBuffering(false);
    const onTimeUpdate = () => setBuffering(false);
    const onWaiting = refreshBuffering;
    const onStalled = refreshBuffering;
    const onCanPlay = () => setBuffering(false);
    const onSeeking = () => setBuffering(true);
    const onSeeked = refreshBuffering;
    const onError = () => setFailed(true);
    const onVolumeChange = () => setMuted(video.muted);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("stalled", onStalled);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.addEventListener("volumechange", onVolumeChange);

    const detachListeners = () => {
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("stalled", onStalled);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      video.removeEventListener("volumechange", onVolumeChange);
    };

    // Native HLS (Safari/iOS) — much smoother than MSE on those platforms.
    if (!hls || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      tryPlay();
      return detachListeners;
    }

    let destroyed = false;
    let hlsInstance: import("hls.js").default | null = null;

    import("hls.js").then(({ default: Hls }) => {
      if (destroyed) return;
      if (!Hls.isSupported()) {
        video.src = src;
        tryPlay();
        return;
      }
      const instance = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        progressive: true,
        startLevel: -1,
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: 30,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.5,
        nudgeMaxRetry: 10,
        abrEwmaDefaultEstimate: 1_000_000,
        abrBandWidthFactor: 0.9,
        abrBandWidthUpFactor: 0.7,
        fragLoadingMaxRetry: 6,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
      });
      instance.attachMedia(video);
      instance.loadSource(src);

      instance.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            instance.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            instance.recoverMediaError();
            break;
          default:
            setFailed(true);
            instance.destroy();
        }
      });
      instance.on(Hls.Events.MANIFEST_PARSED, tryPlay);
      hlsInstance = instance;
    });

    return () => {
      destroyed = true;
      detachListeners();
      hlsInstance?.destroy();
    };
  }, [src, hls]);

  const unmute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    if (v.volume === 0) v.volume = 1;
    setMuted(false);
    v.play().catch(() => {});
  };

  return (
    <>
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        preload="auto"
        className="max-w-full max-h-full"
      />
      {buffering && !failed ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      ) : null}
      {muted && !failed ? (
        <button
          type="button"
          onClick={unmute}
          className="absolute top-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg hover:bg-white/90"
          aria-label="Включить звук"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.5 8.5a5 5 0 010 7" />
            <path d="M19 5a9 9 0 010 14" />
          </svg>
          Включить звук
        </button>
      ) : null}
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/80">
          Не удалось загрузить видео.
        </div>
      ) : null}
    </>
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

  // Progressive load: show ~1200w webp preview from the proxy immediately,
  // upgrade to the original (full resolution) once it finishes decoding.
  // For sources that aren't proxyable, `previewSrc` will fall back to `src`
  // and there's effectively no swap.
  const previewSrc = useMemo(() => thumbUrl(src, 1200) ?? src, [src]);
  const [currentSrc, setCurrentSrc] = useState(previewSrc);
  useEffect(() => {
    setCurrentSrc(previewSrc);
    if (previewSrc === src) return;
    const full = new Image();
    full.decoding = "async";
    let cancelled = false;
    full.onload = () => {
      if (!cancelled) setCurrentSrc(src);
    };
    full.src = src;
    return () => {
      cancelled = true;
      full.onload = null;
    };
  }, [previewSrc, src]);

  const zoomed = scale > 1.01;

  return (
    <div
      className="absolute inset-0 overflow-hidden touch-none select-none"
      onWheel={onWheel}
    >
      <img
        src={currentSrc}
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
