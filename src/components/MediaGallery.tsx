import { useMemo, useState } from "react";
import { Images, Car, Armchair, Wrench, AlertTriangle, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

const TAB_DEFS: Array<{
  key: string;
  label: string;
  icon: LucideIcon;
  match: (i: GalleryItem) => boolean;
}> = [
  { key: "all", label: "Все", icon: Images, match: () => true },
  {
    key: "exterior",
    label: "Экстерьер",
    icon: Car,
    match: (i) =>
      i.sectionKey === "bodyElements" ||
      i.sectionKey === "glassElements" ||
      i.sectionKey === "lightningElements",
  },
  {
    key: "interior",
    label: "Интерьер",
    icon: Armchair,
    match: (i) => i.sectionKey === "interiorElements",
  },
  {
    key: "engine",
    label: "Двигатель",
    icon: Wrench,
    match: (i) =>
      i.sectionKey === "underHoodElements" ||
      i.sectionKey === "computerDiagnosticsElements",
  },
  { key: "damage", label: "Повреждения", icon: AlertTriangle, match: (i) => i.isDamage },
  { key: "video", label: "Видео", icon: Video, match: (i) => i.isVideo },
];

type Density = "three" | "two";

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

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const def of TAB_DEFS) c[def.key] = items.filter(def.match).length;
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const def = TAB_DEFS.find((d) => d.key === tab) ?? TAB_DEFS[0];
    return items.filter(def.match);
  }, [items, tab]);

  if (items.length === 0) return null;

  const visibleTabs = TAB_DEFS.filter((d) => d.key === "all" || counts[d.key] > 0);

  const gridClass =
    density === "three"
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4";

  return (
    <section className="panel p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Фото и видео с осмотра
          <span className="ml-2 mono text-[11px] normal-case tracking-normal text-muted-foreground/70">
            ({items.length})
          </span>
        </h3>

        <div
          className="inline-flex rounded-md p-0.5 gap-0.5"
          style={{ background: "color-mix(in oklab, var(--muted) 60%, transparent)" }}
          role="group"
          aria-label="Плотность сетки"
        >
          <DensityButton
            active={density === "two"}
            onClick={() => setDensity("two")}
            label="2 в ряд"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="1.5" y="2.5" width="5.5" height="11" rx="1" />
              <rect x="9" y="2.5" width="5.5" height="11" rx="1" />
            </svg>
          </DensityButton>
          <DensityButton
            active={density === "three"}
            onClick={() => setDensity("three")}
            label="3 в ряд"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="1" y="2.5" width="3.5" height="11" rx="0.8" />
              <rect x="6.25" y="2.5" width="3.5" height="11" rx="0.8" />
              <rect x="11.5" y="2.5" width="3.5" height="11" rx="0.8" />
            </svg>
          </DensityButton>
        </div>
      </div>

      {/* Tabs — same segmented style as Схема осмотра */}
      <div
        className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 rounded-xl"
        style={{ background: "color-mix(in oklab, var(--muted) 60%, transparent)" }}
        role="tablist"
      >
        {visibleTabs.map((d) => {
          const active = tab === d.key;
          const Icon = d.icon;
          return (
            <button
              key={d.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(d.key)}
              className="relative flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: active ? "var(--card)" : "transparent",
                color: active ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: active
                  ? "0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--border)"
                  : undefined,
              }}
            >
              <span
                className="absolute top-1.5 right-1.5 mono text-[9px] leading-none px-1 py-0.5 rounded"
                style={{
                  background: active ? "var(--muted)" : "transparent",
                  color: "var(--muted-foreground)",
                }}
                aria-hidden
              >
                {counts[d.key]}
              </span>
              <Icon size={16} strokeWidth={1.75} aria-hidden />
              <span>{d.label}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 text-sm">
          Нет файлов в этой категории
        </div>
      ) : (
        <div className={gridClass}>
          {visible.map((item) => (
            <button
              key={`${item.file.id}-${item.idx}`}
              type="button"
              onClick={() => onOpen(item.idx)}
              className="text-left rounded-lg border border-border bg-card hover:border-accent hover:shadow-sm transition-all overflow-hidden flex flex-col"
            >
              {renderTile(item)}
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
      className="inline-flex items-center justify-center w-7 h-7 rounded transition-all"
      style={{
        background: active ? "var(--card)" : "transparent",
        color: active ? "var(--foreground)" : "var(--muted-foreground)",
        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--border)" : undefined,
      }}
    >
      {children}
    </button>
  );
}
