import { useMemo, useState } from "react";
import type { FileRef } from "@/lib/report.functions";

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

  return (
    <div className="panel p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Фото и видео с осмотра
        </h3>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TAB_DEFS.map((d) => {
          const active = tab === d.key;
          const count = counts[d.key];
          if (count === 0 && d.key !== "all") return null;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setTab(d.key)}
              className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
              style={{
                background: active ? "var(--accent)" : "var(--card)",
                color: active ? "var(--accent-foreground)" : "var(--foreground)",
                borderColor: active ? "var(--accent)" : "var(--border)",
              }}
            >
              {d.label}
              <span className="ml-1.5 mono opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 text-sm">
          Нет файлов в этой категории
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
    </div>
  );
}
