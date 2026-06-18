import { useMemo, useState } from "react";
import type { FileRef } from "@/lib/report.api";

export type GalleryItem = {
  file: FileRef;
  idx: number;
  caption: string;
  sectionKey: string;
  isVideo: boolean;
  isDamage: boolean;
  timestamp?: string | null;
};

const TAB_DEFS: Array<{ key: string; label: string; match: (i: GalleryItem) => boolean }> = [
  { key: "all", label: "Все", match: () => true },
  {
    key: "exterior",
    label: "Экстерьер",
    match: (i) =>
      i.sectionKey === "bodyElements" ||
      i.sectionKey === "glassElements" ||
      i.sectionKey === "lightningElements",
  },
  { key: "interior", label: "Интерьер", match: (i) => i.sectionKey === "interiorElements" },
  {
    key: "engine",
    label: "Двигатель",
    match: (i) =>
      i.sectionKey === "underHoodElements" ||
      i.sectionKey === "computerDiagnosticsElements",
  },
  { key: "damage", label: "Повреждения", match: (i) => i.isDamage },
  { key: "video", label: "Видео", match: (i) => i.isVideo },
];

type Density = "comfortable" | "compact";

export function MediaGallery({
  items,
  onOpen,
  renderTile,
}: {
  items: GalleryItem[];
  onOpen: (idx: number) => void;
  renderTile: (item: GalleryItem) => React.ReactNode;
}) {
  const [tab, setTab] = useState("all");
  const [density, setDensity] = useState<Density>("comfortable");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const def of TAB_DEFS) c[def.key] = items.filter(def.match).length;
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const def = TAB_DEFS.find((d) => d.key === tab) ?? TAB_DEFS[0];
    return items.filter(def.match);
  }, [items, tab]);

  const photoCount = useMemo(() => items.filter((i) => !i.isVideo).length, [items]);
  const videoCount = useMemo(() => items.filter((i) => i.isVideo).length, [items]);

  if (items.length === 0) return null;

  const gridClass =
    density === "comfortable"
      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
      : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2";

  return (
    <section className="panel p-5 md:p-6">
      {/* Header */}
      <header className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Фото и видео с осмотра
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="ink font-medium">{items.length}</span>{" "}
            {pluralize(items.length, ["материал", "материала", "материалов"])}
            <span className="opacity-50"> · </span>
            <span className="mono">{photoCount}</span> фото
            {videoCount > 0 && (
              <>
                <span className="opacity-50"> · </span>
                <span className="mono">{videoCount}</span> видео
              </>
            )}
          </p>
        </div>

        <div
          className="inline-flex rounded-md border border-border bg-card p-0.5 shrink-0"
          role="group"
          aria-label="Плотность сетки"
        >
          <DensityButton
            active={density === "comfortable"}
            onClick={() => setDensity("comfortable")}
            label="Крупно"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
              <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" />
              <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" />
              <rect x="9" y="9" width="5.5" height="5.5" rx="1" />
            </svg>
          </DensityButton>
          <DensityButton
            active={density === "compact"}
            onClick={() => setDensity("compact")}
            label="Компактно"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="1" y="1" width="4" height="4" rx="0.6" />
              <rect x="6" y="1" width="4" height="4" rx="0.6" />
              <rect x="11" y="1" width="4" height="4" rx="0.6" />
              <rect x="1" y="6" width="4" height="4" rx="0.6" />
              <rect x="6" y="6" width="4" height="4" rx="0.6" />
              <rect x="11" y="6" width="4" height="4" rx="0.6" />
              <rect x="1" y="11" width="4" height="4" rx="0.6" />
              <rect x="6" y="11" width="4" height="4" rx="0.6" />
              <rect x="11" y="11" width="4" height="4" rx="0.6" />
            </svg>
          </DensityButton>
        </div>
      </header>

      {/* Tabs */}
      <div className="-mx-1 mb-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-1.5 px-1 min-w-min">
          {TAB_DEFS.map((d) => {
            const active = tab === d.key;
            const count = counts[d.key];
            if (count === 0 && d.key !== "all") return null;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setTab(d.key)}
                aria-pressed={active}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
                style={{
                  background: active ? "var(--ink)" : "var(--card)",
                  color: active ? "white" : "var(--foreground)",
                  borderColor: active ? "var(--ink)" : "var(--border)",
                }}
              >
                <span>{d.label}</span>
                <span
                  className="mono text-[10px] px-1.5 py-0.5 rounded-full leading-none"
                  style={{
                    background: active ? "rgba(255,255,255,0.18)" : "var(--muted)",
                    color: active ? "white" : "var(--muted-foreground)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 py-12 px-6 text-center">
          <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="11" r="1.5" />
              <path d="M21 17l-5-5-7 7" />
            </svg>
          </div>
          <div className="text-sm font-medium ink">Нет файлов в этой категории</div>
          <div className="text-xs text-muted-foreground mt-1">
            Попробуйте выбрать другой фильтр
          </div>
        </div>
      ) : (
        <div className={gridClass}>
          {visible.map((item, i) => (
            <button
              key={`${item.file.id}-${item.idx}`}
              type="button"
              onClick={() => onOpen(item.idx)}
              aria-label={`Открыть: ${item.caption}`}
              className="group relative text-left rounded-lg border border-border bg-card overflow-hidden flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              <span className="absolute top-1.5 right-1.5 z-10 mono text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/55 text-white tracking-wider">
                {i + 1}/{visible.length}
              </span>
              {renderTile(item)}
              <span className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function DensityButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className="inline-flex items-center justify-center w-7 h-7 rounded transition-colors"
      style={{
        background: active ? "var(--ink)" : "transparent",
        color: active ? "white" : "var(--muted-foreground)",
      }}
    >
      {children}
    </button>
  );
}

function pluralize(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
