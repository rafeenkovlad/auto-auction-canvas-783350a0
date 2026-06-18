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
  tag?: { name: string; severe: boolean } | null;
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
    "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4";

  return (
    <section className="panel p-4 sm:p-5 md:p-6 flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Фото и видео с осмотра
          <span className="ml-2 mono text-[11px] normal-case tracking-normal text-muted-foreground/70">
            ({items.length})
          </span>
        </h3>
      </div>

      {/* Tabs — same segmented style as Схема осмотра */}
      <div
        className="flex sm:flex-wrap gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar snap-x snap-mandatory"
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
              className="relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium transition-all shrink-0 sm:flex-1 sm:min-w-0 snap-start"
              style={{
                background: active ? "var(--card)" : "transparent",
                color: active ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: active
                  ? "0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--border)"
                  : undefined,
              }}
            >
              <Icon size={16} strokeWidth={1.75} aria-hidden className="shrink-0 sm:size-[18px]" />
              <span className="whitespace-nowrap sm:flex-1 sm:text-left">{d.label}</span>
              <span
                className="mono text-[10px] sm:text-[11px] leading-none px-1.5 py-0.5 rounded shrink-0"
                style={{
                  background: active ? "var(--muted)" : "color-mix(in oklab, var(--muted) 70%, transparent)",
                  color: "var(--muted-foreground)",
                }}
                aria-hidden
              >
                {counts[d.key]}
              </span>
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
